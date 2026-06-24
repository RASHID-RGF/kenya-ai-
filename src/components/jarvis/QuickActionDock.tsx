import { MessageSquare, Upload, Image, Monitor, Mic, Sparkles, Settings, Plus } from "lucide-react";

export type QuickAction = "new-chat" | "upload-pdf" | "upload-image" | "share-screen" | "voice-call" | "generate" | "settings";

export interface QuickActionDef {
  id: QuickAction;
  icon: typeof MessageSquare;
  label: string;
  shortcut: string;
  color: string;
}

const ACTIONS: QuickActionDef[] = [
  { id: "new-chat", icon: MessageSquare, label: "New Chat", shortcut: "⌘N", color: "from-cyan to-blue-500" },
  { id: "upload-pdf", icon: Upload, label: "Upload PDF", shortcut: "⌘U", color: "from-amber to-orange-500" },
  { id: "upload-image", icon: Image, label: "Upload Image", shortcut: "⌘I", color: "from-emerald to-cyan" },
  { id: "share-screen", icon: Monitor, label: "Share Screen", shortcut: "⌘S", color: "from-purple to-pink-500" },
  { id: "voice-call", icon: Mic, label: "Voice Call AI", shortcut: "⌘V", color: "from-rose to-red-500" },
  { id: "generate", icon: Sparkles, label: "Generate", shortcut: "⌘G", color: "from-primary to-cyan" },
  { id: "settings", icon: Settings, label: "Settings", shortcut: "⌘,", color: "from-gray-400 to-gray-600" },
];

interface Props {
  onAction: (action: QuickAction) => void;
  onCustomize?: () => void;
}

export function QuickActionDock({ onAction, onCustomize }: Props) {
  return (
    <div className="glass-panel p-3 animate-fade-up relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-[10px] tracking-[0.3em] text-primary glow-text">
          QUICK ACTIONS
        </h3>
        {onCustomize && (
          <button onClick={onCustomize} className="text-[9px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-smooth">
            <Plus className="h-3 w-3" /> Customize
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="group relative flex flex-col items-center gap-1.5 p-3 rounded-xl
              border border-primary/10 hover:border-primary/40 bg-background/20
              hover:bg-primary/5 transition-all duration-300
              hover:scale-105 active:scale-95"
          >
            {/* Icon container with gradient */}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color}
              flex items-center justify-center shadow-lg
              group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-300`}>
              <action.icon className="h-5 w-5 text-white" />
            </div>

            {/* Label */}
            <span className="text-[9px] text-muted-foreground group-hover:text-primary uppercase tracking-wider transition-smooth">
              {action.label}
            </span>

            {/* Glow effect on hover */}
            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
              transition-opacity duration-300 bg-gradient-to-b ${action.color} opacity-5 pointer-events-none`} />
          </button>
        ))}
      </div>
    </div>
  );
}
