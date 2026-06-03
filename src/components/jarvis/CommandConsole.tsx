import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Square, Volume2, VolumeX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRecognition, speak, stopSpeaking } from "@/lib/voice";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jarvis-chat`;

interface Props {
  onStateChange?: (state: { speaking: boolean; listening: boolean; thinking: boolean }) => void;
}

export function CommandConsole({ onStateChange }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Online and ready, Sir. How may I assist?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOut, setVoiceOut] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    onStateChange?.({ speaking, listening, thinking });
  }, [speaking, listening, thinking, onStateChange]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // Listen for quick-command + mic-toggle events
  useEffect(() => {
    const cmd = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) send(detail);
    };
    const mic = () => toggleListen();
    window.addEventListener("jarvis:command", cmd);
    window.addEventListener("jarvis:toggleMic", mic);
    return () => {
      window.removeEventListener("jarvis:command", cmd);
      window.removeEventListener("jarvis:toggleMic", mic);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, thinking, listening]);

  // Greet on mount
  useEffect(() => {
    if (voiceOut) {
      // Wait a tick for voices to load
      setTimeout(() => speak(messages[0].content, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
      }), 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setThinking(true);
    stopSpeaking();
    setSpeaking(false);

    abortRef.current = new AbortController();
    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content !== messages[messages.length - 1]?.content) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
        signal: abortRef.current.signal,
      });

      if (resp.status === 429) { toast.error("Rate limit reached. Easy now."); setThinking(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add funds in Settings."); setThinking(false); return; }
      if (!resp.ok || !resp.body) { toast.error("JARVIS is unreachable."); setThinking(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const r = await reader.read();
        if (r.done) break;
        buffer += decoder.decode(r.value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (voiceOut && assistantSoFar) {
        speak(assistantSoFar, {
          onStart: () => setSpeaking(true),
          onEnd: () => setSpeaking(false),
        });
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        toast.error("Connection lost.");
      }
    } finally {
      setThinking(false);
    }
  };

  const toggleListen = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = getRecognition();
    if (!rec) {
      toast.error("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    recRef.current = rec;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setInput(finalText + interim);
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) send(finalText);
    };
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
    stopSpeaking();
    setSpeaking(false);
  };

  const stopAll = () => {
    abortRef.current?.abort();
    stopSpeaking();
    setSpeaking(false);
    setThinking(false);
  };

  return (
    <div className="glass-panel corner-bracket relative flex flex-col h-full min-h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success glow-cyan animate-pulse" />
          <h2 className="font-display text-xs tracking-[0.3em] text-primary glow-text">
            COMMAND CONSOLE
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => setVoiceOut(v => !v)} title={voiceOut ? "Mute voice output" : "Unmute"}>
            {voiceOut ? <Volume2 className="h-3.5 w-3.5 text-primary" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => setMessages([{ role: "assistant", content: "Memory cleared. Standing by." }])}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`animate-fade-up ${m.role === "user" ? "text-right" : ""}`}>
            <div className="text-[10px] uppercase tracking-widest mb-1 text-muted-foreground">
              {m.role === "user" ? "YOU" : "JARVIS"}
            </div>
            <div className={`inline-block max-w-[90%] px-3.5 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap
              ${m.role === "user"
                ? "bg-primary/15 text-foreground border border-primary/30"
                : "bg-card text-foreground border border-primary/20 glow-cyan"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2 text-primary text-xs">
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            <span className="text-muted-foreground tracking-wider uppercase text-[10px]">processing</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 px-4 py-3 border-t border-primary/20"
      >
        <Button type="button" size="icon" variant="ghost"
          className={`h-10 w-10 shrink-0 ${listening ? "text-danger glow-cyan" : "text-primary"}`}
          onClick={toggleListen}>
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening…" : "Address JARVIS…"}
          className="flex-1 bg-transparent border border-primary/30 rounded-md px-3 py-2 text-sm
            font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-smooth"
        />
        {(thinking || speaking) ? (
          <Button type="button" size="icon" className="h-10 w-10 bg-danger/80 hover:bg-danger" onClick={stopAll}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon" className="h-10 w-10 bg-primary hover:bg-primary/90 glow-cyan" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
