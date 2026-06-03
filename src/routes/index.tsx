import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, MessageSquare, X } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { BootSequence } from "@/components/jarvis/BootSequence";
import { StatusBar } from "@/components/jarvis/StatusBar";
import { JarvisOrb } from "@/components/jarvis/JarvisOrb";
import { SystemPanel } from "@/components/jarvis/SystemPanel";
import { CommandConsole } from "@/components/jarvis/CommandConsole";
import { QuickCommands } from "@/components/jarvis/QuickCommands";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JARVIS — Holographic AI Assistant" },
      { name: "description", content: "Voice-first holographic AI assistant. Tap to talk." },
      { property: "og:title", content: "JARVIS — Holographic AI Assistant" },
      { property: "og:description", content: "Tap the orb and talk to JARVIS." },
    ],
  }),
  component: Index,
});

function Index() {
  const [booted, setBooted] = useState(false);
  const [orb, setOrb] = useState({ speaking: false, listening: false, thinking: false });
  const [chatOpen, setChatOpen] = useState(false);

  const toggleMic = () => window.dispatchEvent(new Event("jarvis:toggleMic"));

  const status = orb.listening
    ? "Listening… speak now"
    : orb.thinking
    ? "Processing your request"
    : orb.speaking
    ? "Responding…"
    : "Tap the orb and speak";

  return (
    <>
      {!booted && <BootSequence onDone={() => setBooted(true)} />}
      <Toaster theme="dark" position="top-center" />

      <div className="min-h-screen relative">
        <StatusBar />

        <main className="px-4 pb-6 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left telemetry */}
          <aside className="lg:col-span-3 space-y-4 order-2 lg:order-1">
            <SystemPanel />
            <QuickCommands
              onPick={(q) => window.dispatchEvent(new CustomEvent("jarvis:command", { detail: q }))}
            />
          </aside>

          {/* Center — voice-first orb */}
          <section className="lg:col-span-9 order-1 lg:order-2">
            <div className="glass-panel corner-bracket relative w-full p-6 md:p-10 flex flex-col items-center min-h-[70vh]">
              <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2">
                AI CORE
              </div>
              <h1 className="font-display text-2xl md:text-3xl tracking-[0.3em] text-primary glow-text mb-8">
                TAP TO SPEAK
              </h1>

              {/* Big tappable orb */}
              <button
                onClick={toggleMic}
                aria-label={orb.listening ? "Stop listening" : "Start listening"}
                className="group relative w-full max-w-[420px] aspect-square rounded-full
                  transition-transform duration-200 hover:scale-[1.02] active:scale-95
                  focus:outline-none focus:ring-4 focus:ring-primary/40 rounded-full"
              >
                <JarvisOrb {...orb} />
                {/* Mic affordance overlay */}
                <span className={`pointer-events-none absolute inset-0 flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity ${orb.listening ? "opacity-100" : ""}`}>
                  <span className="w-16 h-16 rounded-full bg-background/40 backdrop-blur-sm
                    border border-primary/40 flex items-center justify-center glow-cyan">
                    <Mic className={`h-7 w-7 ${orb.listening ? "text-danger" : "text-primary"}`} />
                  </span>
                </span>
              </button>

              {/* Live status */}
              <div className="mt-10 text-center">
                <div className={`font-display text-sm md:text-base tracking-[0.3em] uppercase
                  ${orb.listening ? "text-danger" : "text-primary"} glow-text transition-colors`}>
                  {status}
                </div>
                <p className="mt-3 text-xs text-muted-foreground max-w-md mx-auto">
                  Try: <span className="text-primary/80">"What's the weather like on Mars?"</span> or{" "}
                  <span className="text-primary/80">"Write a haiku about coffee."</span>
                </p>
              </div>

              {/* Open chat shortcut */}
              <button
                onClick={() => setChatOpen(true)}
                className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full
                  border border-primary/30 text-xs uppercase tracking-widest text-primary
                  hover:bg-primary/10 hover:border-primary transition-smooth"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Open command console
              </button>
            </div>
          </section>
        </main>

        <footer className="px-6 pb-4 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
          STARK INDUSTRIES — HOLOGRAPHIC INTERFACE
        </footer>

        {/* Persistent CommandConsole — hidden offscreen until opened, so it keeps state and continues to power voice */}
        <div
          className={`fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] p-3
            transition-transform duration-300 ${chatOpen ? "translate-x-0" : "translate-x-full"}`}
          aria-hidden={!chatOpen}
        >
          <div className="relative h-full">
            <button
              onClick={() => setChatOpen(false)}
              className="absolute -left-3 top-3 z-10 w-8 h-8 rounded-full glass-panel
                flex items-center justify-center text-primary hover:bg-primary/20"
              aria-label="Close console"
            >
              <X className="h-4 w-4" />
            </button>
            <CommandConsole onStateChange={setOrb} />
          </div>
        </div>

        {/* Floating mic FAB on mobile when chat closed */}
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
