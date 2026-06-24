// Browser voice helpers — Web Speech API. Works offline once page is loaded
// in browsers that ship native engines (Chrome/Edge/Safari).

type SpeechRecognitionAPI = any;

export type VoiceOption = {
  name: string;
  lang: string;
  isDefault: boolean;
};

let _voicesCache: SpeechSynthesisVoice[] = [];
let _voicesLoaded = false;

function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  if (_voicesLoaded) return Promise.resolve(_voicesCache);
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      _voicesCache = voices;
      _voicesLoaded = true;
      resolve(voices);
    }
    window.speechSynthesis.onvoiceschanged = () => {
      _voicesCache = window.speechSynthesis.getVoices();
      _voicesLoaded = true;
      resolve(_voicesCache);
    };
    // Fallback timeout
    setTimeout(() => {
      if (!_voicesLoaded) {
        _voicesCache = window.speechSynthesis.getVoices();
        _voicesLoaded = true;
        resolve(_voicesCache);
      }
    }, 1000);
  });
}

export async function getAvailableVoices(): Promise<VoiceOption[]> {
  const voices = await ensureVoices();
  return voices.map((v) => ({
    name: v.name,
    lang: v.lang,
    isDefault: v.default,
  }));
}

export async function getDefaultVoiceName(): Promise<string> {
  const voices = await ensureVoices();
  const preferred =
    voices.find((v) => /Google UK English Male|Daniel|Microsoft Guy|Microsoft David/i.test(v.name)) ||
    voices.find((v) => /Google\s+US\s+English/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en") && v.name.includes("Female")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];
  return preferred?.name || "Default";
}

// ── Speech ─────────────────────────────────────────────────────────────────

let _voiceName: string | null = null;
let _speechRate = 1.05;
let _speechPitch = 0.95;

export function setVoiceConfig(opts: { voiceName?: string; rate?: number; pitch?: number }) {
  if (opts.voiceName !== undefined) _voiceName = opts.voiceName;
  if (opts.rate !== undefined) _speechRate = opts.rate;
  if (opts.pitch !== undefined) _speechPitch = opts.pitch;
}

export function getVoiceConfig() {
  return { voiceName: _voiceName, rate: _speechRate, pitch: _speechPitch };
}

export function getRecognition({ continuous = false }: { continuous?: boolean } = {}): SpeechRecognitionAPI | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = continuous;
  rec.interimResults = true;
  rec.lang = "en-US";
  return rec;
}

export function speak(
  text: string,
  opts: { onStart?: () => void; onEnd?: () => void } = {},
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  // Strip markdown for cleaner TTS
  const clean = text
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/[*_#`>]+/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
  if (!clean) return;
  const u = new SpeechSynthesisUtterance(clean);

  // Ensure voices are loaded
  if (!_voicesLoaded) {
    ensureVoices();
  }

  // Use configured voice from cache, or find best fallback
  const voices = _voicesCache.length > 0 ? _voicesCache : window.speechSynthesis.getVoices();
  const selected = _voiceName
    ? voices.find((v) => v.name === _voiceName)
    : null;
  const preferred =
    selected ||
    voices.find((v) => /Google UK English Male|Daniel|Microsoft Guy|Microsoft David/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];
  if (preferred) u.voice = preferred;

  u.rate = _speechRate;
  u.pitch = _speechPitch;
  u.onstart = () => opts.onStart?.();
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking;
}
