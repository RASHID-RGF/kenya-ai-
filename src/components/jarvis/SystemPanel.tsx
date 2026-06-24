import { useEffect, useState } from "react";
import {
  Cpu, Activity, HardDrive, Wifi, Battery, Thermometer,
  Zap, BarChart3, TrendingUp, Users, Clock, Layers, ListChecks,
} from "lucide-react";

interface Stat {
  label: string;
  value: number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
}

function StatBar({ label, value, unit = "%", icon, color = "primary" }: Stat) {
  return (
    <div className="group">
      <div className="flex justify-between items-baseline text-[10px] mb-1.5">
        <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
          {icon}
          {label}
        </span>
        <span className="font-display tabular-nums text-primary glow-text text-xs">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-input overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, oklch(0.78 0.18 215 / 0.6), var(--color-${color}))`,
            boxShadow: `0 0 12px var(--color-${color} / 0.4)`,
          }}
        />
        <div className="absolute inset-0 scanline opacity-30" />
        {/* Animated shine */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute inset-y-0 -left-10 w-10 bg-white/10 skew-x-12 animate-data-stream" />
        </div>
      </div>
    </div>
  );
}

function DashboardWidget({ title, children, className = "", icon }: {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`glass-panel p-4 relative overflow-hidden group animate-card-float hover:animate-holographic-border ${className}`}>
      {/* Ambient glow */}
      <div className="absolute -inset-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, oklch(0.78 0.18 215 / 0.05), transparent 70%)" }} />
      <div className="absolute inset-0 scanline opacity-20 pointer-events-none" />

      <div className="flex items-center gap-2 mb-3 relative z-10">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="font-display text-[10px] tracking-[0.3em] text-primary glow-text uppercase">
          {title}
        </h3>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function SystemPanel() {
  const [stats, setStats] = useState({
    cpu: 24, gpu: 18, ram: 42, disk: 67, net: 12, batt: 87,
    temp: 48, cluster: 3,
  });

  const [timeActive] = useState("02:34:17");
  const [requestsToday] = useState(142);
  const [activeUsers] = useState(3);

  useEffect(() => {
    const id = setInterval(() => {
      setStats((s) => ({
        cpu: clamp(s.cpu + (Math.random() - 0.5) * 18, 5, 95),
        gpu: clamp(s.gpu + (Math.random() - 0.5) * 15, 3, 90),
        ram: clamp(s.ram + (Math.random() - 0.5) * 6, 30, 75),
        disk: clamp(s.disk + (Math.random() - 0.5) * 1, 60, 75),
        net: clamp(s.net + (Math.random() - 0.5) * 25, 0, 100),
        batt: clamp(s.batt - Math.random() * 0.05, 20, 100),
        temp: clamp(s.temp + (Math.random() - 0.5) * 4, 35, 75),
        cluster: clamp(s.cluster + (Math.random() - 0.5) * 0.5, 1, 8),
      }));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header with system status */}
      <div className="glass-panel p-5 corner-bracket relative animate-hologram-flicker overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                <div className="absolute -inset-1 rounded-full bg-success/30 animate-pulse-ring" />
              </div>
              <div>
                <h2 className="font-display text-xs tracking-[0.3em] text-primary glow-text">
                  SYSTEMS MONITOR
                </h2>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  All Systems Nominal • Uplink Stable
                </p>
              </div>
            </div>
            <span className="text-[9px] px-2 py-1 rounded-full bg-success/10 border border-success/30 text-success uppercase tracking-wider">
              Online
            </span>
          </div>

          {/* Quick metrics row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Uptime", value: timeActive, icon: Clock },
              { label: "Requests", value: requestsToday.toString(), icon: Activity },
              { label: "Cluster", value: `Node ${stats.cluster.toFixed(0)}`, icon: Layers },
            ].map((m) => (
              <div key={m.label} className="text-center p-2 rounded-lg bg-background/40 border border-primary/10">
                <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
                  <m.icon className="h-3 w-3" />
                  {m.label}
                </div>
                <div className="font-display text-sm text-primary glow-text tabular-nums">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Telemetry bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatBar label="CPU" value={stats.cpu} icon={<Cpu className="h-3 w-3" />} color="cyan" />
            <StatBar label="GPU" value={stats.gpu} icon={<Zap className="h-3 w-3" />} color="purple" />
            <StatBar label="Memory" value={stats.ram} icon={<BarChart3 className="h-3 w-3" />} />
            <StatBar label="Disk" value={stats.disk} icon={<HardDrive className="h-3 w-3" />} color="amber" />
            <StatBar label="Network" value={stats.net} unit=" Mb/s" icon={<Wifi className="h-3 w-3" />} />
            <StatBar label="Temp" value={stats.temp} unit="°C" icon={<Thermometer className="h-3 w-3" />} color="danger" />
          </div>

          {/* Battery indicator */}
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-background/40 border border-primary/10">
            <Battery className={`h-4 w-4 ${stats.batt > 50 ? "text-success" : stats.batt > 20 ? "text-amber" : "text-danger"}`} />
            <div className="flex-1 h-2 rounded-full bg-input overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  stats.batt > 50 ? "bg-success" : stats.batt > 20 ? "bg-amber" : "bg-danger"
                }`}
                style={{ width: `${stats.batt}%` }}
              />
            </div>
            <span className="font-display text-xs text-primary tabular-nums">{stats.batt.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Status Monitor */}
        <DashboardWidget title="AI Status" icon={<Activity className="h-3.5 w-3.5" />}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-foreground/80">Neural Engine</span>
            <span className="text-[10px] text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Active
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-foreground/80">Model</span>
            <span className="text-[10px] text-primary">GPT-4 Turbo</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-foreground/80">Latency</span>
            <span className="text-[10px] text-primary tabular-nums">124ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-foreground/80">Token Rate</span>
            <span className="text-[10px] text-primary tabular-nums">1,240 t/s</span>
          </div>
        </DashboardWidget>

        {/* Active Tasks */}
        <DashboardWidget title="Active Tasks" icon={<ListChecks className="h-3.5 w-3.5" />}>
          {[
            { name: "Processing image analysis", progress: 78 },
            { name: "Compiling memory context", progress: 45 },
            { name: "Syncing knowledge graph", progress: 92 },
          ].map((task) => (
            <div key={task.name} className="space-y-1 mb-3 last:mb-0">
              <div className="flex justify-between text-[10px]">
                <span className="text-foreground/70">{task.name}</span>
                <span className="text-primary tabular-nums">{task.progress}%</span>
              </div>
              <div className="h-1 rounded-full bg-input overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-all duration-1000"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          ))}
        </DashboardWidget>

        {/* Productivity Metrics */}
        <DashboardWidget title="Productivity" icon={<TrendingUp className="h-3.5 w-3.5" />}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Today's Tasks", value: "12/18", sub: "66% complete" },
              { label: "Avg Response", value: "1.2s", sub: "Faster by 8%" },
              { label: "Files Processed", value: "47", sub: "+12 today" },
              { label: "Accuracy Rate", value: "97.3%", sub: "+2.1% this week" },
            ].map((m) => (
              <div key={m.label} className="p-2 rounded-lg bg-background/40 border border-primary/10">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{m.label}</div>
                <div className="font-display text-xs text-primary glow-text mt-0.5">{m.value}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>
        </DashboardWidget>

        {/* Recent Conversations */}
        <DashboardWidget title="Recent Activity" icon={<Users className="h-3.5 w-3.5" />}>
          <div className="space-y-2">
            {[
              { user: "You", msg: "What's the weather like on Mars?", time: "2m ago" },
              { user: "JARVIS", msg: "Temperature averages -60°C...", time: "1m ago" },
              { user: "You", msg: "Write a haiku about coffee", time: "15m ago" },
              { user: "JARVIS", msg: "Dark roasted droplets...", time: "14m ago" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/10 transition-smooth">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${
                  item.user === "JARVIS" ? "bg-primary/20 text-primary" : "bg-cyan/20 text-cyan"
                }`}>
                  {item.user === "JARVIS" ? "J" : "Y"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] truncate text-foreground/70">{item.msg}</div>
                  <div className="text-[8px] text-muted-foreground">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
