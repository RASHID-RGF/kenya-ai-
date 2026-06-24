import { useEffect, useState } from "react";
import {
  X, Mic, Volume2, Bot, Palette, Sparkles, Sliders, Globe, Cpu, Save, Monitor,
  ChevronDown, ChevronUp, Settings as SettingsIcon,
} from "lucide-react";
import { getAvailableVoices, getDefaultVoiceName, speak, type VoiceOption } from "@/lib/voice";
import { toast } from "sonner";

export interface AppSettings {
  voiceName: string;
  speechRate: number;
  speechPitch: number;
  aiModel: string;
  maxTokens: number;
  temperature: number;
  autoScreenAnalysis: boolean;
  voiceModeSilenceDelay: number;
  theme: "dark" | "cyberpunk" | "minimal";
}

const DEFAULT_SETTINGS: AppSettings = {
  voiceName: "Default",
  speechRate: 1.05,
  speechPitch: 0.95,
  aiModel: "GPT-4 Turbo",
  maxTokens: 4096,
  temperature: 0.7,
  autoScreenAnalysis: true,
  voiceModeSilenceDelay: 2,
  theme: "dark",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  initialSettings?: Partial<AppSettings>;
}

export function SettingsPanel({ open, onClose, onSave, initialSettings }: Props) {
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS, ...initialSettings });
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceListOpen, setVoiceListOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>("voice");

  useEffect(() => {
    if (open) {
      getAvailableVoices().then(setVoices);
      getDefaultVoiceName().then((name) => {
        if (!initialSettings?.voiceName) {
          setSettings((s) => ({ ...s, voiceName: name }));
        }
      });
    }
  }, [open, initialSettings?.voiceName]);

  const update = (partial: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  };

  const handleSave = () => {
    onSave(settings);
    toast.success("Settings saved");
    onClose();
  };

  if (!open) return null;

  const currentVoice = voices.find((v) => v.name === settings.voiceName);
  const displayVoiceName = currentVoice
    ? `${currentVoice.name} (${currentVoice.lang})`
    : settings.voiceName;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-up" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg p-4 flex items-start justify-end animate-slide-in-right">
        <div className="relative w-full h-full glass-panel corner-bracket overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple-500 flex items-center justify-center">
                <SettingsIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-display text-xs tracking-[0.3em] text-primary glow-text uppercase">
                  System Settings
                </h2>
                <p className="text-[9px] text-muted-foreground">Configure JARVIS X behavior</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-primary hover:bg-primary/20 transition-smooth">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Voice Section */}
            <Section expanded={expandedSection === "voice"} onToggle={() => setExpandedSection(expandedSection === "voice" ? "" : "voice")}
              title="Voice & Speech" icon={<Mic className="h-4 w-4" />}>

              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">TTS Voice</label>
                <div className="relative">
                  <button
                    onClick={() => setVoiceListOpen(!voiceListOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background/60 border border-primary/20 hover:border-primary/40 transition-smooth"
                  >
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-primary" />
                      <span className="text-xs text-foreground/80">{displayVoiceName}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${voiceListOpen ? "rotate-180" : ""}`} />
                  </button>
                  {voiceListOpen && (
                    <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-xl glass-panel p-2 space-y-1">
                      {voices.map((v) => (
                        <button
                          key={v.name}
                          onClick={() => { update({ voiceName: v.name }); setVoiceListOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-smooth
                            ${settings.voiceName === v.name ? "bg-primary/20 text-primary" : "text-foreground/70 hover:bg-primary/10"}`}
                        >
                          <span>{v.name}</span>
                          <span className="text-[9px] text-muted-foreground ml-2">{v.lang}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Speech Rate */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Speech Rate</label>
                  <span className="text-[10px] text-primary tabular-nums">{settings.speechRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range" min="0.5" max="2" step="0.05"
                  value={settings.speechRate}
                  onChange={(e) => update({ speechRate: parseFloat(e.target.value) })}
                  className="w-full h-1.5 rounded-full bg-input appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-glow"
                />
              </div>

              {/* Speech Pitch */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pitch</label>
                  <span className="text-[10px] text-primary tabular-nums">{settings.speechPitch.toFixed(2)}</span>
                </div>
                <input
                  type="range" min="0.5" max="1.5" step="0.05"
                  value={settings.speechPitch}
                  onChange={(e) => update({ speechPitch: parseFloat(e.target.value) })}
                  className="w-full h-1.5 rounded-full bg-input appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-glow"
                />
              </div>

              {/* Preview button */}
              <button
                onClick={() => {
                  speak("Hello Sir, JARVIS X systems are fully operational.", {
                    onStart: () => toast.info("Voice preview playing..."),
                  });
                }}
                className="w-full py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-xs text-primary hover:bg-primary/20 transition-smooth"
              >
                Preview Voice
              </button>
            </Section>

            {/* AI Model Section */}
            <Section expanded={expandedSection === "ai"} onToggle={() => setExpandedSection(expandedSection === "ai" ? "" : "ai")}
              title="AI Model" icon={<Bot className="h-4 w-4" />}>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-background/40 border border-primary/10">
                  <span className="text-xs text-foreground/80">Deployment Name</span>
                  <input
                    type="text"
                    value={settings.aiModel}
                    onChange={(e) => update({ aiModel: e.target.value })}
                    placeholder="gpt-4o"
                    className="bg-background/80 border border-primary/30 rounded-lg px-3 py-1.5 text-xs text-primary font-mono outline-none focus:border-primary"
                  />
                  <span className="text-[9px] text-muted-foreground">
                    Enter your Azure OpenAI deployment name (e.g. gpt-4o, gpt-35-turbo). Uses VITE_AZURE_OPENAI_DEPLOYMENT by default.
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-[10px] text-muted-foreground">Temperature</label>
                    <span className="text-[10px] text-primary">{settings.temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={settings.temperature}
                    onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
                    className="w-full h-1.5 rounded-full bg-input appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-glow"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-primary/10">
                  <span className="text-xs text-foreground/80">Max Tokens</span>
                  <select
                    value={settings.maxTokens}
                    onChange={(e) => update({ maxTokens: parseInt(e.target.value) })}
                    className="bg-background/80 border border-primary/30 rounded-lg px-3 py-1.5 text-xs text-primary outline-none"
                  >
                    <option value={2048}>2,048</option>
                    <option value={4096}>4,096</option>
                    <option value={8192}>8,192</option>
                    <option value={16384}>16,384</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* Voice Mode Section */}
            <Section expanded={expandedSection === "voice-mode"} onToggle={() => setExpandedSection(expandedSection === "voice-mode" ? "" : "voice-mode")}
              title="Voice Conversation" icon={<Globe className="h-4 w-4" />}>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-[10px] text-muted-foreground">Silence Detection Delay</label>
                    <span className="text-[10px] text-primary">{settings.voiceModeSilenceDelay}s</span>
                  </div>
                  <input
                    type="range" min="1" max="5" step="0.5"
                    value={settings.voiceModeSilenceDelay}
                    onChange={(e) => update({ voiceModeSilenceDelay: parseFloat(e.target.value) })}
                    className="w-full h-1.5 rounded-full bg-input appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-glow"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-primary/10">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    <span className="text-xs text-foreground/80">Auto Screen Analysis</span>
                  </div>
                  <button
                    onClick={() => update({ autoScreenAnalysis: !settings.autoScreenAnalysis })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${settings.autoScreenAnalysis ? "bg-primary" : "bg-input"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.autoScreenAnalysis ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
            </Section>

            {/* Theme Section */}
            <Section expanded={expandedSection === "theme"} onToggle={() => setExpandedSection(expandedSection === "theme" ? "" : "theme")}
              title="Appearance" icon={<Palette className="h-4 w-4" />}>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "dark", label: "Dark Hologram", gradient: "from-gray-900 via-blue-950 to-black" },
                  { id: "cyberpunk", label: "Cyberpunk", gradient: "from-purple-900 via-pink-900 to-cyan-900" },
                  { id: "minimal", label: "Minimal", gradient: "from-gray-900 via-gray-800 to-gray-900" },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => update({ theme: theme.id as any })}
                    className={`p-3 rounded-xl border transition-smooth ${
                      settings.theme === theme.id
                        ? "border-primary bg-primary/20"
                        : "border-primary/10 hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${theme.gradient} mb-2`} />
                    <span className="text-[9px] text-foreground/80">{theme.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* System Info Section */}
            <Section expanded={expandedSection === "system"} onToggle={() => setExpandedSection(expandedSection === "system" ? "" : "system")}
              title="System Info" icon={<Cpu className="h-4 w-4" />}>

              <div className="space-y-2 text-xs">
                {[
                  { label: "Version", value: "JARVIS X v4.0.1" },
                  { label: "API Status", value: "Connected" },
                  { label: "Speech Engine", value: "Web Speech API" },
                  { label: "Recognition Engine", value: "Web Speech API" },
                  { label: "Voices Available", value: `${voices.length}` },
                  { label: "Audio Output", value: "System Default" },
                ].map((info) => (
                  <div key={info.label} className="flex justify-between px-3 py-2 rounded-lg bg-background/40">
                    <span className="text-muted-foreground">{info.label}</span>
                    <span className="text-foreground/80">{info.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-primary/20 shrink-0">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-primary/30 text-xs text-muted-foreground hover:text-primary hover:border-primary/60 transition-smooth">
              Cancel
            </button>
            <button onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 glow-cyan transition-smooth flex items-center justify-center gap-2">
              <Save className="h-3.5 w-3.5" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Section component
function Section({ expanded, onToggle, title, icon, children }: {
  expanded: boolean;
  onToggle: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-primary/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-background/40 hover:bg-primary/5 transition-smooth"
      >
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span className="font-display text-[10px] tracking-[0.3em] text-primary glow-text uppercase">{title}</span>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 py-3 space-y-3 bg-background/20">
          {children}
        </div>
      )}
    </div>
  );
}


