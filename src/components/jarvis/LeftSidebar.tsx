import { useState } from "react";
import {
  MessageSquare, FolderOpen, BookOpen, Settings, User, ChevronLeft, ChevronRight,
  Clock, Star, Archive, Plus,
} from "lucide-react";

const RECENT_CONVOS = [
  { title: "Weather analysis on Mars", time: "2m ago", active: true },
  { title: "Coffee haiku generation", time: "15m ago", active: false },
  { title: "React performance tips", time: "1h ago", active: false },
  { title: "Quantum computing basics", time: "3h ago", active: false },
];

const SAVED_PROJECTS = [
  { name: "RAOQ1P9W OS v4", icon: "⚡" },
  { name: "Arc Reactor UI", icon: "🌀" },
  { name: "Holo Display", icon: "✨" },
];

const KNOWLEDGE_BASES = [
  { name: "Tech Stack Docs", count: 24 },
  { name: "AI Research", count: 18 },
  { name: "System Architecture", count: 12 },
];

export function LeftSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [activeTab, setActiveTab] = useState("history");

  if (collapsed) {
    return (
      <aside className="glass-panel corner-bracket relative p-3 flex flex-col items-center gap-4 min-h-[400px]">
        <button onClick={onToggle} className="text-primary/60 hover:text-primary transition-smooth">
          <ChevronRight className="h-4 w-4" />
        </button>
        {[
          { icon: MessageSquare, id: "history" },
          { icon: FolderOpen, id: "projects" },
          { icon: BookOpen, id: "knowledge" },
          { icon: Settings, id: "settings" },
          { icon: User, id: "profile" },
        ].map(({ icon: Icon, id }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-smooth
              ${activeTab === id ? "bg-primary/20 text-primary glow-cyan" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <div className="mt-auto pt-4 border-t border-primary/10 w-full flex justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-purple-500 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="glass-panel corner-bracket relative p-4 flex flex-col gap-2 min-h-[500px] animate-slide-in-right">
      {/* Collapse button */}
      <button onClick={onToggle} className="absolute -right-3 top-4 w-6 h-6 rounded-full glass-panel flex items-center justify-center text-primary hover:bg-primary/20 z-10">
        <ChevronLeft className="h-3 w-3" />
      </button>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-lg bg-background/60 border border-primary/10 mb-3">
        {[
          { icon: MessageSquare, label: "Chat", id: "history" },
          { icon: FolderOpen, label: "Projects", id: "projects" },
          { icon: BookOpen, label: "Library", id: "knowledge" },
        ].map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] uppercase tracking-wider transition-smooth
              ${activeTab === id ? "bg-primary/20 text-primary glow-text" : "text-muted-foreground hover:text-primary"}`}
          >
            <Icon className="h-3 w-3" />
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "history" && (
        <div className="flex-1 space-y-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recent
            </span>
            <button className="text-[10px] text-primary/60 hover:text-primary flex items-center gap-1">
              <Plus className="h-3 w-3" /> New
            </button>
          </div>
          {RECENT_CONVOS.map((conv) => (
            <button
              key={conv.title}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-smooth group
                ${conv.active ? "bg-primary/15 border border-primary/30" : "hover:bg-primary/10 border border-transparent"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`truncate ${conv.active ? "text-primary" : "text-foreground/80"}`}>
                  {conv.title}
                </span>
                <Star className={`h-3 w-3 shrink-0 ${conv.active ? "text-amber fill-amber" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`} />
              </div>
              <span className="text-[9px] text-muted-foreground">{conv.time}</span>
            </button>
          ))}
        </div>
      )}

      {activeTab === "projects" && (
        <div className="flex-1 space-y-2 overflow-y-auto">
          {SAVED_PROJECTS.map((proj) => (
            <button
              key={proj.name}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-smooth border border-transparent hover:border-primary/20"
            >
              <span className="text-lg">{proj.icon}</span>
              <div className="text-left">
                <div className="text-xs text-foreground/90">{proj.name}</div>
                <div className="text-[9px] text-muted-foreground">Last edited 2d ago</div>
              </div>
            </button>
          ))}
          <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-primary/30 text-[10px] text-primary/60 hover:text-primary hover:border-primary/60 transition-smooth">
            <Plus className="h-3 w-3" /> New Project
          </button>
        </div>
      )}

      {activeTab === "knowledge" && (
        <div className="flex-1 space-y-1 overflow-y-auto">
          {KNOWLEDGE_BASES.map((kb) => (
            <button
              key={kb.name}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-smooth border border-transparent hover:border-primary/20"
            >
              <div className="flex items-center gap-2">
                <Archive className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-foreground/90">{kb.name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded">
                {kb.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom settings & profile */}
      <div className="mt-auto pt-3 border-t border-primary/10 flex items-center gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 transition-smooth">
          <Settings className="h-3.5 w-3.5" /> Settings
        </button>
        <button className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-primary/10 transition-smooth">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan to-purple-500 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-[11px] text-foreground/90 leading-none">RAOQ1P9W</div>
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Commander</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
