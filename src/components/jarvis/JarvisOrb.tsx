import { useEffect, useState } from "react";

interface Props {
  speaking?: boolean;
  listening?: boolean;
  thinking?: boolean;
}

export function JarvisOrb({ speaking, listening, thinking }: Props) {
  const [bars, setBars] = useState<number[]>(Array.from({ length: 32 }, () => 0.3));

  useEffect(() => {
    if (!speaking && !listening) {
      setBars(Array.from({ length: 32 }, () => 0.25));
      return;
    }
    const id = setInterval(() => {
      setBars(Array.from({ length: 32 }, () => 0.25 + Math.random() * 0.75));
    }, 90);
    return () => clearInterval(id);
  }, [speaking, listening]);

  const state = speaking ? "speaking" : listening ? "listening" : thinking ? "thinking" : "idle";

  return (
    <div className="relative flex items-center justify-center w-full aspect-square max-w-[320px] mx-auto">
      {/* Outer rotating ring */}
      <svg className="absolute inset-0 w-full h-full animate-orb-rotate" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="92" fill="none"
          stroke="var(--color-primary)" strokeOpacity="0.3"
          strokeWidth="0.5" strokeDasharray="2 6" />
        <circle cx="100" cy="100" r="86" fill="none"
          stroke="var(--color-primary)" strokeOpacity="0.5"
          strokeWidth="1" strokeDasharray="20 200" />
      </svg>

      {/* Counter-rotating ring */}
      <svg className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] animate-orb-rotate"
        style={{ animationDirection: "reverse", animationDuration: "30s" }} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none"
          stroke="var(--color-cyan-glow)" strokeOpacity="0.4"
          strokeWidth="0.5" strokeDasharray="40 8 4 8" />
      </svg>

      {/* Glow halo */}
      <div className="absolute inset-8 rounded-full glow-cyan-strong opacity-60 blur-xl"
        style={{ background: "var(--gradient-orb)" }} />

      {/* Core orb */}
      <div className="relative w-2/3 h-2/3 rounded-full animate-orb-pulse glow-cyan-strong"
        style={{ background: "var(--gradient-orb)" }}>
        <div className="absolute inset-0 rounded-full opacity-30 mix-blend-overlay"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 3px, oklch(0 0 0 / 0.4) 3px, oklch(0 0 0 / 0.4) 4px)"
          }} />
      </div>

      {/* Waveform overlay */}
      <div className="absolute inset-x-0 bottom-1/2 translate-y-1/2 flex items-center justify-center gap-[2px] h-16 pointer-events-none">
        {bars.map((h, i) => (
          <div key={i}
            className="w-[3px] rounded-full bg-primary glow-cyan transition-all duration-100"
            style={{
              height: `${h * 100}%`,
              opacity: state === "idle" ? 0.2 : 0.7 + h * 0.3,
            }} />
        ))}
      </div>

      {/* Status label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 glass-panel text-[10px] uppercase tracking-[0.3em] text-primary glow-text">
        {state}
      </div>
    </div>
  );
}
