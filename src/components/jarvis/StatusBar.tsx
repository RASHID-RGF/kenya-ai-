import { useEffect, useState } from "react";
import { Activity, Wifi, Cpu, Shield } from "lucide-react";

export function StatusBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = time.toLocaleTimeString("en-US", { hour12: false });
  const date = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  return (
    <header className="glass-panel mx-4 mt-4 px-5 py-2.5 flex items-center justify-between text-[11px] uppercase tracking-widest">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-primary glow-cyan animate-pulse" />
        <span className="font-display text-primary glow-text tracking-[0.4em]">J.A.R.V.I.S</span>
        <span className="text-muted-foreground hidden md:inline">v3.7.0 • OFFLINE-READY</span>
      </div>
      <div className="hidden md:flex items-center gap-5 text-muted-foreground">
        <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-success" /> SECURE</span>
        <span className="flex items-center gap-1.5"><Wifi className="h-3 w-3 text-primary" /> UPLINK</span>
        <span className="flex items-center gap-1.5"><Cpu className="h-3 w-3 text-primary" /> AI READY</span>
        <span className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-success" /> NOMINAL</span>
      </div>
      <div className="text-right">
        <div className="font-display tabular-nums text-primary glow-text text-sm tracking-[0.2em]">{fmt}</div>
        <div className="text-[9px] text-muted-foreground">{date}</div>
      </div>
    </header>
  );
}
