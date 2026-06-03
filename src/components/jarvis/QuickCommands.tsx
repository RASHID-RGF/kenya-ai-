const COMMANDS = [
  { cat: "GENERAL", items: ["What's on my agenda today?", "Brief me on the latest tech news", "Tell me a joke, JARVIS"] },
  { cat: "CODING",  items: ["Explain async/await in TypeScript", "Review this React component pattern", "Generate a SQL migration for users"] },
  { cat: "ANALYSIS",items: ["Summarize the pros and cons of edge AI", "Compare React vs Svelte", "Explain quantum entanglement simply"] },
  { cat: "CREATIVE",items: ["Write a haiku about midnight", "Draft a product launch email", "Brainstorm app names for a fitness tracker"] },
];

interface Props { onPick: (q: string) => void; }

export function QuickCommands({ onPick }: Props) {
  return (
    <div className="glass-panel corner-bracket relative p-5">
      <h3 className="font-display text-xs tracking-[0.3em] text-primary glow-text mb-4">
        SUGGESTED DIRECTIVES
      </h3>
      <div className="space-y-3">
        {COMMANDS.map((g) => (
          <div key={g.cat}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{g.cat}</div>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((q) => (
                <button key={q}
                  onClick={() => onPick(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-primary/30
                    text-foreground/80 hover:border-primary hover:bg-primary/10 hover:text-primary
                    transition-smooth">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
