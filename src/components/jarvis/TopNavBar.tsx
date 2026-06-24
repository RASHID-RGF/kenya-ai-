import { useState } from "react";
import { Search, Bell, Mic, User, SunMoon, Sparkles } from "lucide-react";

export function TopNavBar() {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="glass-panel mx-4 mt-4 px-5 py-3 flex items-center justify-between gap-4 animate-fade-up relative overflow-hidden">
      {/* Data stream effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="animate-data-stream h-full" />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple-500 flex items-center justify-center animate-neon-pulse">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="absolute -inset-1 rounded-lg bg-primary/20 blur-sm animate-glow-ring" />
        </div>
        <div>
          <h1 className="font-display text-sm tracking-[0.3em] text-primary glow-text leading-none">
            JARVIS X
          </h1>
          <p className="text-[8px] tracking-[0.5em] text-muted-foreground uppercase mt-0.5">
            Neural Interface v4.0
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className={`flex-1 max-w-2xl hidden md:flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
        searchFocused
          ? "border-primary/60 bg-primary/10 shadow-glow"
          : "border-primary/20 bg-background/40"
      }`}>
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search everything..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-muted-foreground/50"
        />
        <kbd className="hidden lg:inline-flex text-[10px] px-1.5 py-0.5 rounded border border-primary/20 text-muted-foreground bg-background/60">
          ⌘K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Voice button */}
        <button
          className="relative w-9 h-9 rounded-full flex items-center justify-center
            border border-primary/30 hover:border-primary/60 hover:bg-primary/10
            transition-smooth group"
          aria-label="Voice assistant"
        >
          <Mic className="h-4 w-4 text-primary group-hover:animate-neon-pulse" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-full flex items-center justify-center
            border border-primary/30 hover:border-primary/60 hover:bg-primary/10
            transition-smooth group"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-smooth" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-[8px] font-bold flex items-center justify-center text-white">
            3
          </span>
        </button>

        {/* Theme switcher */}
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center
            border border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-smooth"
          aria-label="Toggle theme"
        >
          <SunMoon className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* User profile */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-full
            border border-primary/30 hover:border-primary/60 hover:bg-primary/10
            transition-smooth group"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan to-purple-500 flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
          <span className="hidden sm:inline text-xs text-muted-foreground group-hover:text-primary transition-smooth">
            RAOQ1P9W
          </span>
        </button>
      </div>
    </header>
  );
}
