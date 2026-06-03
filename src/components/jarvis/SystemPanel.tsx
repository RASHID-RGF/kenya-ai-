import { useEffect, useState } from "react";

interface Stat {
  label: string;
  value: number; // 0-100
  unit?: string;
  icon?: React.ReactNode;
}

function StatBar({ label, value, unit = "%" }: Stat) {
  return (
    <div>
      <div className="flex justify-between items-baseline text-[11px] mb-1">
        <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-primary font-display tabular-nums glow-text">
          {value.toFixed(0)}{unit}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-input overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-primary glow-cyan transition-all duration-700"
          style={{ width: `${value}%` }} />
        <div className="absolute inset-0 scanline opacity-50" />
      </div>
    </div>
  );
}

export function SystemPanel() {
  const [stats, setStats] = useState({
    cpu: 24, gpu: 18, ram: 42, disk: 67, net: 12, batt: 87,
  });

  useEffect(() => {
    // Simulated telemetry — browsers cannot read real OS metrics
    const id = setInterval(() => {
      setStats((s) => ({
        cpu: clamp(s.cpu + (Math.random() - 0.5) * 18, 5, 95),
        gpu: clamp(s.gpu + (Math.random() - 0.5) * 15, 3, 90),
        ram: clamp(s.ram + (Math.random() - 0.5) * 6, 30, 75),
        disk: clamp(s.disk + (Math.random() - 0.5) * 1, 60, 75),
        net: clamp(s.net + (Math.random() - 0.5) * 25, 0, 100),
        batt: clamp(s.batt - Math.random() * 0.05, 20, 100),
      }));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-panel p-5 corner-bracket relative animate-hud-flicker">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xs tracking-[0.3em] text-primary glow-text">
          SYSTEM TELEMETRY
        </h3>
        <span className="text-[10px] text-muted-foreground">SIM • LIVE</span>
      </div>
      <div className="space-y-3">
        <StatBar label="CPU"     value={stats.cpu} />
        <StatBar label="GPU"     value={stats.gpu} />
        <StatBar label="Memory"  value={stats.ram} />
        <StatBar label="Disk"    value={stats.disk} />
        <StatBar label="Network" value={stats.net} unit=" Mb/s" />
        <StatBar label="Battery" value={stats.batt} />
      </div>
      <p className="mt-4 text-[10px] text-muted-foreground/70 leading-relaxed">
        Browser sandboxed — telemetry simulated. Native build can stream real metrics.
      </p>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
