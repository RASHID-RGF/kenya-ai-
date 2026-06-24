import { useState } from "react";
import {
  FileText, ListChecks, Brain, History, StickyNote, X, ExternalLink,
  Image, File, Maximize2, Minimize2,
} from "lucide-react";

const RECENT_ACTIONS = [
  { action: "Analyzed screen capture", time: "30s ago" },
  { action: "Generated code snippet", time: "2m ago" },
  { action: "Searched knowledge base", time: "5m ago" },
  { action: "Uploaded PDF document", time: "12m ago" },
];

const ACTIVE_TASKS = [
  { name: "Processing image analysis", progress: 78 },
  { name: "Compiling memory context", progress: 45 },
  { name: "Syncing knowledge graph", progress: 92 },
];

export function RightContextPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("files");

  if (collapsed) {
    return (
      <aside className="glass-panel corner-bracket relative p-3 flex flex-col items-center gap-4 min-h-[400px]">
        <button onClick={() => setCollapsed(false)} className="text-primary/60 hover:text-primary transition-smooth">
          <Maximize2 className="h-4 w-4" />
        </button>
        {[
          { icon: FileText, id: "files" },
          { icon: ListChecks, id: "tasks" },
          { icon: Brain, id: "memory" },
          { icon: History, id: "history" },
          { icon: StickyNote, id: "notes" },
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
      </aside>
    );
  }

  return (
    <aside className="glass-panel corner-bracket relative p-4 flex flex-col gap-2 min-h-[500px] animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-[10px] tracking-[0.3em] text-primary glow-text">
          CONTEXT
        </h3>
        <button onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-primary transition-smooth">
          <Minimize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tab navigation */}
      <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-background/60 border border-primary/10 mb-3">
        {[
          { icon: FileText, label: "Files", id: "files" },
          { icon: ListChecks, label: "Tasks", id: "tasks" },
          { icon: Brain, label: "Memory", id: "memory" },
          { icon: History, label: "Recent", id: "history" },
          { icon: StickyNote, label: "Notes", id: "notes" },
        ].map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-0.5 py-1.5 rounded-md transition-smooth
              ${activeTab === id ? "bg-primary/20" : "hover:bg-primary/10"}`}
            title={label}
          >
            <Icon className={`h-3 w-3 ${activeTab === id ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[7px] uppercase tracking-wider ${activeTab === id ? "text-primary" : "text-muted-foreground"}`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Files tab */}
        {activeTab === "files" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Uploaded Files</span>
              <span className="text-[9px] text-primary/60">4 items</span>
            </div>
            {[
              { name: "System_Arch.pdf", type: "pdf", size: "2.4 MB" },
              { name: "HUD_Design.png", type: "image", size: "1.8 MB" },
              { name: "Neural_Map.pdf", type: "pdf", size: "4.1 MB" },
              { name: "Arc_Reactor_v3.png", type: "image", size: "3.2 MB" },
            ].map((file) => (
              <div key={file.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/40 border border-primary/10 hover:border-primary/30 transition-smooth group cursor-pointer">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  file.type === "pdf" ? "bg-amber/20" : "bg-cyan/20"
                }`}>
                  {file.type === "pdf" ? (
                    <File className="h-4 w-4 text-amber" />
                  ) : (
                    <Image className="h-4 w-4 text-cyan" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] truncate text-foreground/90">{file.name}</div>
                  <div className="text-[9px] text-muted-foreground">{file.size}</div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}

        {/* Tasks tab */}
        {activeTab === "tasks" && (
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Active Tasks</span>
            {ACTIVE_TASKS.map((task) => (
              <div key={task.name} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-foreground/80">{task.name}</span>
                  <span className="text-primary tabular-nums">{task.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-input overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-primary transition-all duration-1000"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2">
              <button className="w-full py-2 rounded-lg border border-dashed border-primary/30 text-[10px] text-primary/60 hover:text-primary hover:border-primary/60 transition-smooth">
                View all tasks →
              </button>
            </div>
          </div>
        )}

        {/* Memory tab */}
        {activeTab === "memory" && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">AI Memory Context</span>
            <div className="p-3 rounded-lg bg-background/40 border border-primary/10 text-[11px] space-y-2">
              <div className="flex items-start gap-2">
                <Brain className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground/70">User prefers concise responses with technical depth</span>
              </div>
              <div className="flex items-start gap-2">
                <Brain className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground/70">Frequent topics: AI systems, web development, Iron Man tech</span>
              </div>
              <div className="flex items-start gap-2">
                <Brain className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground/70">Screen analysis mode engaged earlier</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent actions tab */}
        {activeTab === "history" && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">Recent Actions</span>
            {RECENT_ACTIONS.map((action) => (
              <div key={action.action} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-smooth">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                <div className="flex-1">
                  <div className="text-[11px] text-foreground/80">{action.action}</div>
                  <div className="text-[9px] text-muted-foreground">{action.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes tab */}
        {activeTab === "notes" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick Notes</span>
              <button className="text-[9px] text-primary/60 hover:text-primary">+ Add</button>
            </div>
            <textarea
              placeholder="Type your notes here..."
              className="w-full h-32 bg-background/60 border border-primary/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/40 transition-smooth"
            />
          </div>
        )}
      </div>

      {/* Memory usage indicator */}
      <div className="mt-auto pt-3 border-t border-primary/10">
        <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
          <span>Context Window</span>
          <span>342 / 4096 tokens</span>
        </div>
        <div className="h-1 rounded-full bg-input overflow-hidden">
          <div className="h-full w-[8.3%] rounded-full bg-gradient-to-r from-success to-primary transition-all" />
        </div>
      </div>
    </aside>
  );
}
