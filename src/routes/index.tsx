import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MessageSquare, X, BookOpen, ChevronDown, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { BootSequence } from "@/components/jarvis/BootSequence";
import { JarvisOrb } from "@/components/jarvis/JarvisOrb";
import { SystemPanel } from "@/components/jarvis/SystemPanel";
import { CommandConsole } from "@/components/jarvis/CommandConsole";
import { TopNavBar } from "@/components/jarvis/TopNavBar";
import { LeftSidebar } from "@/components/jarvis/LeftSidebar";
import { RightContextPanel } from "@/components/jarvis/RightContextPanel";
import { QuickActionDock, type QuickAction } from "@/components/jarvis/QuickActionDock";
import { SettingsPanel, type AppSettings } from "@/components/jarvis/SettingsPanel";
import { toast } from "sonner";
import { setVoiceConfig } from "@/lib/voice";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JARVIS X — Neural AI Operating System" },
      { name: "description", content: "Next-generation holographic AI interface. Voice-first, visually intelligent." },
      { property: "og:title", content: "JARVIS X — Neural AI Operating System" },
      { property: "og:description", content: "The future of human-AI interaction." },
    ],
  }),
  component: Index,
});

function Index() {
  const [booted, setBooted] = useState(false);
  const [orb, setOrb] = useState({ speaking: false, listening: false, thinking: false, voiceMode: false });
  const [chatOpen, setChatOpen] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceCallCount, setVoiceCallCount] = useState(0);
  // Persist settings across panel open/close
  const [savedSettings, setSavedSettings] = useState<Partial<AppSettings> | undefined>(undefined);

  // Hidden file inputs for upload actions
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Keep track of conversation count for "New Chat"
  const [chatKey, setChatKey] = useState(0);

  // Single source of truth: orb click delegates speech recognition to CommandConsole via event
  const toggleMic = () => {
    setChatOpen(true);
    // Small delay to let the console panel open before dispatching
    setTimeout(() => {
      window.dispatchEvent(new Event("jarvis:toggleMic"));
    }, 200);
  };

  // Derive voice mode active from orb state
  const voiceModeActive = orb.voiceMode || false;

  // Detect browser capabilities once on mount
  useEffect(() => {
    const hasRecognition = typeof window !== "undefined" && (
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
    if (!hasRecognition) {
      toast.info("Voice recognition not supported in this browser. Try Chrome or Edge for voice features.", { duration: 8000 });
    }
  }, []);

  // Apply saved theme on mount
  useEffect(() => {
    if (!savedSettings?.theme) return;
    applyTheme(savedSettings.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  

  // ── Handle Quick Actions ────────────────────────────────────────────────

  const handleQuickAction = useCallback((action: QuickAction) => {
    switch (action) {
      case "new-chat":
        setChatKey((k) => k + 1);
        setChatOpen(true);
        toast.success("New conversation started");
        window.dispatchEvent(new CustomEvent("jarvis:newChat"));
        break;

      case "upload-pdf":
        pdfInputRef.current?.click();
        break;

      case "upload-image":
        imageInputRef.current?.click();
        break;

      case "share-screen":
        window.dispatchEvent(new Event("jarvis:screenShare"));
        break;

      case "voice-call":
        setChatOpen(true);
        setVoiceCallCount((c) => c + 1);
        // Dispatch after a small delay to let the console open
        setTimeout(() => {
          window.dispatchEvent(new Event("jarvis:voiceCall"));
        }, 400);
        break;

      case "generate":
        setChatOpen(true);
        window.dispatchEvent(new CustomEvent("jarvis:command", {
          detail: "Generate something creative and impressive — surprise me.",
        }));
        break;

      case "settings":
        setSettingsOpen(true);
        break;
    }
  }, []);

  // ── File upload handlers ────────────────────────────────────────────────

  const handleFileUpload = useCallback((file: File, type: "image" | "pdf") => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} is too large. Max 10 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      const attachment = {
        id: crypto.randomUUID(),
        type,
        name: file.name,
        data,
        mime: file.type,
      };
      // Open chat and dispatch the file via custom event
      setChatOpen(true);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("jarvis:attachment", {
          detail: { attachment, type },
        }));
      }, 500);
    };
    reader.readAsDataURL(file);
  }, []);

  const onImageSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => handleFileUpload(f, "image"));
    e.target.value = "";
  }, [handleFileUpload]);

  const onPdfSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => handleFileUpload(f, "pdf"));
    e.target.value = "";
  }, [handleFileUpload]);

  // ── Theme application helper ───────────────────────────────────────────

  function applyTheme(theme: string) {
    const root = document.documentElement;
    if (theme === "cyberpunk") {
      root.style.setProperty("--background", "oklch(0.12 0.06 280)");
      root.style.setProperty("--primary", "oklch(0.85 0.22 330)");
      root.style.setProperty("--cyan", "oklch(0.85 0.22 330)");
      root.style.setProperty("--cyan-glow", "oklch(0.90 0.25 320)");
      root.style.setProperty("--border", "oklch(0.85 0.22 330 / 18%)");
      root.style.setProperty("--input", "oklch(0.25 0.08 300)");
      root.style.setProperty("--ring", "oklch(0.85 0.22 330 / 60%)");
      root.style.setProperty("--gradient-hero", "radial-gradient(ellipse at top, oklch(0.35 0.15 280 / 0.6), transparent 60%), radial-gradient(ellipse at bottom, oklch(0.30 0.12 330 / 0.4), transparent 60%)");
      root.style.setProperty("--gradient-panel", "linear-gradient(135deg, oklch(0.18 0.08 280 / 0.7), oklch(0.14 0.06 290 / 0.5))");
    } else if (theme === "minimal") {
      root.style.setProperty("--background", "oklch(0.14 0.01 240)");
      root.style.setProperty("--primary", "oklch(0.60 0.05 220)");
      root.style.setProperty("--cyan", "oklch(0.60 0.05 220)");
      root.style.setProperty("--cyan-glow", "oklch(0.65 0.06 210)");
      root.style.setProperty("--border", "oklch(0.60 0.05 220 / 18%)");
      root.style.setProperty("--input", "oklch(0.25 0.03 240)");
      root.style.setProperty("--ring", "oklch(0.60 0.05 220 / 60%)");
      root.style.setProperty("--gradient-hero", "radial-gradient(ellipse at top, oklch(0.20 0.03 240 / 0.4), transparent 60%), radial-gradient(ellipse at bottom, oklch(0.18 0.02 250 / 0.3), transparent 60%)");
      root.style.setProperty("--gradient-panel", "linear-gradient(135deg, oklch(0.18 0.02 240 / 0.7), oklch(0.15 0.01 250 / 0.5))");
    } else {
      // Default dark hologram
      root.style.setProperty("--background", "oklch(0.16 0.03 240)");
      root.style.setProperty("--primary", "oklch(0.78 0.18 215)");
      root.style.setProperty("--cyan", "oklch(0.82 0.16 210)");
      root.style.setProperty("--cyan-glow", "oklch(0.85 0.20 200)");
      root.style.setProperty("--border", "oklch(0.78 0.18 215 / 18%)");
      root.style.setProperty("--input", "oklch(0.30 0.05 240)");
      root.style.setProperty("--ring", "oklch(0.78 0.18 215 / 60%)");
      root.style.setProperty("--gradient-hero", "radial-gradient(ellipse at top, oklch(0.30 0.10 230 / 0.6), transparent 60%), radial-gradient(ellipse at bottom, oklch(0.25 0.08 260 / 0.4), transparent 60%)");
      root.style.setProperty("--gradient-panel", "linear-gradient(135deg, oklch(0.22 0.05 240 / 0.7), oklch(0.18 0.04 250 / 0.5))");
    }
  }

  // ── Settings handler ────────────────────────────────────────────────────

  const handleSettingsSave = useCallback((settings: AppSettings) => {
    // Persist settings so they survive panel close/reopen
    setSavedSettings(settings);
    // Apply voice settings globally
    setVoiceConfig({
      voiceName: settings.voiceName,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
    });
    // Apply theme
    applyTheme(settings.theme);
    // Dispatch settings change for CommandConsole (applies silenceDelay, temp, maxTokens)
    window.dispatchEvent(new CustomEvent("jarvis:settings", { detail: settings }));
    toast.success(`Settings applied — ${settings.theme === "cyberpunk" ? "Cyberpunk" : settings.theme === "minimal" ? "Minimal" : "Dark Hologram"} theme active`);
  }, []);

  // ── State ───────────────────────────────────────────────────────────────

  const status = orb.listening
    ? "Listening… speak now"
    : orb.thinking
    ? "Processing your request"
    : orb.speaking
    ? "Responding…"
    : voiceModeActive
    ? "Voice mode active — speak naturally"
    : "Tap the orb and speak";

  return (
    <>
      {!booted && <BootSequence onDone={() => setBooted(true)} />}
      <Toaster theme="dark" position="top-center" />

      <div className="min-h-screen relative flex flex-col">
        {/* Top Navigation Bar */}
        <TopNavBar />

        {/* Particle background effect */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-glow-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan/5 rounded-full blur-[80px] animate-glow-pulse" style={{ animationDelay: "4s" }} />
        </div>

        {/* Hidden file inputs */}
        <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple className="hidden" onChange={onImageSelected} />
        <input ref={pdfInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={onPdfSelected} />

        {/* Main 3-column layout */}
        <main className="flex-1 px-4 pb-4 pt-3 flex gap-4 relative z-10">
          {/* Left Sidebar */}
          <div className={`transition-all duration-300 ${leftCollapsed ? "w-auto" : "w-64 xl:w-72 shrink-0"}`}>
            <LeftSidebar collapsed={leftCollapsed} onToggle={() => setLeftCollapsed(!leftCollapsed)} />
          </div>

          {/* Center Workspace */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Quick Action Dock */}
            <QuickActionDock onAction={handleQuickAction} />

            {/* Voice / Orb Section */}
            <div className="glass-panel corner-bracket relative w-full p-4 md:p-6 flex flex-col items-center animate-hologram-flicker overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

              <div className="relative z-10 w-full flex flex-col items-center">
                {/* AI Core indicator */}
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  AI CORE
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>

                <h1 className="font-display text-xl md:text-2xl lg:text-3xl tracking-[0.3em] text-primary glow-text mb-4">
                  JARVIS X
                </h1>

                {/* Orb container */}
                <div className="w-full max-w-[380px]">
                  <button
                    onClick={toggleMic}
                    aria-label={orb.listening ? "Stop listening" : "Start listening"}
                    className="group relative w-full aspect-square rounded-full
                      transition-transform duration-200 hover:scale-[1.02] active:scale-95
                      focus:outline-none focus:ring-4 focus:ring-primary/40"
                  >
                    <JarvisOrb {...orb} />
                    {/* Mic affordance overlay */}
                    <span className={`pointer-events-none absolute inset-0 flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-opacity ${orb.listening ? "opacity-100" : ""}`}>
                      <span className="w-14 h-14 rounded-full bg-background/40 backdrop-blur-sm
                        border border-primary/40 flex items-center justify-center glow-cyan">
                        <Mic className={`h-6 w-6 ${orb.listening ? "text-danger" : "text-primary"}`} />
                      </span>
                    </span>
                  </button>
                </div>

                {/* Live status */}
                <div className="mt-6 text-center">
                  <div className={`font-display text-xs md:text-sm tracking-[0.3em] uppercase
                    ${orb.listening ? "text-danger" : orb.voiceMode ? "text-success" : "text-primary"} glow-text transition-colors`}>
                    {status}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground max-w-md mx-auto">
                    {orb.voiceMode ? (
                      "Conversation mode — speak naturally. Silence prompts a response."
                    ) : (
                      <>
                        Try: <span className="text-primary/80">"What's the weather like on Mars?"</span> or{" "}
                        <span className="text-primary/80">"Write a haiku about coffee."</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => setChatOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                      bg-primary/15 border border-primary/40 text-xs uppercase tracking-widest text-primary
                      hover:bg-primary/25 hover:border-primary/60 transition-smooth glow-cyan"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Open console
                  </button>
                  <button
                    onClick={() => setShowDashboard(!showDashboard)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full
                      border border-primary/20 text-[10px] uppercase tracking-widest text-muted-foreground
                      hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-smooth"
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform ${showDashboard ? "rotate-180" : ""}`} />
                    Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard / System Panel (collapsible) */}
            <div className={`transition-all duration-500 overflow-hidden ${
              showDashboard ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            }`}>
              <SystemPanel />
            </div>
          </div>

          {/* Right Context Panel */}
          <div className={`transition-all duration-300 ${rightCollapsed ? "w-auto" : "w-64 xl:w-72 shrink-0"}`}>
            <RightContextPanel />
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 px-6 pb-3 text-center flex items-center justify-center gap-4">
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-primary transition-smooth"
          >
            <BookOpen className="h-3 w-3" />
            System Documentation
          </Link>
          <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">
            RAOQ1P9W • HOLOGRAPHIC INTERFACE v4.0
          </span>
        </footer>

        {/* CommandConsole - slide-in overlay */}
        <div
          className={`fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] p-3
            transition-transform duration-300 ease-out ${chatOpen ? "translate-x-0" : "translate-x-full"}`}
          aria-hidden={!chatOpen}
        >
          <div className="relative h-full">
            <button
              onClick={() => setChatOpen(false)}
              className="absolute -left-3 top-3 z-10 w-8 h-8 rounded-full glass-panel
                flex items-center justify-center text-primary hover:bg-primary/20 transition-smooth"
              aria-label="Close console"
            >
              <X className="h-4 w-4" />
            </button>
            <CommandConsole
              key={chatKey}
              onStateChange={setOrb}
              autoVoiceMode={voiceCallCount > 0}
            />
          </div>
        </div>

        {/* Settings Panel */}
        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSettingsSave}
          initialSettings={savedSettings}
        />

        {/* Floating mic FAB on mobile */}
        <button
          onClick={toggleMic}
          className={`lg:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full glow-cyan-strong
            flex items-center justify-center transition-transform active:scale-90
            ${orb.listening ? "bg-danger" : "bg-primary"} ${chatOpen ? "hidden" : ""}`}
          aria-label="Tap to talk"
        >
          <Mic className="h-6 w-6 text-primary-foreground" />
        </button>
      </div>
    </>
  );
}
