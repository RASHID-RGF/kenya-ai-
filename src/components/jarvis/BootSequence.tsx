import { useEffect, useState } from "react";

const LINES = [
  "JARVIS > Initializing core systems…",
  "JARVIS > Loading neural matrices… [OK]",
  "JARVIS > Calibrating holographic interface…",
  "JARVIS > Establishing secure uplink to AI gateway…",
  "JARVIS > All systems nominal. Welcome back, Sir.",
];

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (idx >= LINES.length) {
      const t = setTimeout(() => { setDone(true); setTimeout(onDone, 600); }, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx(i => i + 1), 550);
    return () => clearTimeout(t);
  }, [idx, onDone]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500 ${done ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
      <div className="w-full max-w-xl px-6">
        <div className="text-center mb-8 animate-boot-grow">
          <h1 className="font-display text-6xl tracking-[0.4em] text-primary glow-text">
            J.A.R.V.I.S
          </h1>
          <p className="mt-2 text-[10px] uppercase tracking-[0.5em] text-muted-foreground">
            Just A Rather Very Intelligent System
          </p>
        </div>
        <div className="glass-panel p-5 font-mono text-xs space-y-1.5 min-h-[180px]">
          {LINES.slice(0, idx).map((l, i) => (
            <div key={i} className="text-primary/90 animate-fade-up">{l}</div>
          ))}
          {idx < LINES.length && (
            <div className="text-primary inline-flex">
              <span className="animate-pulse">▌</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
