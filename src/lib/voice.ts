// Browser voice helpers — Web Speech API. Works offline once page is loaded
// in browsers that ship native engines (Chrome/Edge/Safari).

type SpeechRecognitionAPI = any;

export function getRecognition(): SpeechRecognitionAPI | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = false;
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
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /Google UK English Male|Daniel|Microsoft Guy/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];
  if (preferred) u.voice = preferred;
  u.rate = 1.05;
  u.pitch = 0.95;
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
