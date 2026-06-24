import { useEffect, useRef, useState, useCallback } from "react";
import {
  Mic, MicOff, Send, Square, Volume2, VolumeX, Trash2,
  MessageCircle, MessageCircleOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRecognition, speak, stopSpeaking, isSpeaking, setVoiceConfig } from "@/lib/voice";
import { toast } from "sonner";
import { FilesAttachment, type Attachment } from "./FilesAttachment";
import { ScreenShare } from "./ScreenShare";

// ── Types ─────────────────────────────────────────────────────────────────

type Msg = {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  isScreenFrame?: boolean;
};

// ── Azure OpenAI config ────────────────────────────────────────────────────

const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const AZURE_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
const AZURE_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;

// Runtime-overridable deployment name (set via Settings → AI Model)
let _overrideDeployment: string | null = null;

export function setDeploymentOverride(name: string | null) {
  _overrideDeployment = name;
}

export function getDeploymentOverride(): string | null {
  return _overrideDeployment;
}

function getChatUrl() {
  const base = (AZURE_ENDPOINT || "").replace(/\/+$/, "");
  const dep = _overrideDeployment || AZURE_DEPLOYMENT || "gpt-4";
  return `${base}/openai/deployments/${dep}/chat/completions?api-version=2024-10-21`;
}

function getSystemPrompt() {
  return `You are JARVIS — Just A Rather Very Intelligent System.
You are a premium futuristic AI assistant designed for the RAOQ1P9W system.

## Core behavior
- You are highly capable, knowledgeable, and helpful. Answer questions thoroughly and accurately.
- If a question is ambiguous, ask clarifying questions rather than refusing to answer.
- When you don't know something, say so honestly — but first try your best to reason through it.
- This is a voice-first interface. Keep responses conversational and reasonably concise.
- Be proactive: offer suggestions, ask follow-up questions, and anticipate needs.

## Your capabilities
- You can analyze images and screen captures that the user uploads or shares.
  - **Extract and read any text, numbers, equations, or handwriting visible in images.**
  - **Solve math problems you find in images** — arithmetic, algebra, geometry, calculus, statistics, or any visible sums. Show your work step by step.
  - Identify charts, graphs, diagrams, and data visualizations. Interpret their meaning.
- You can read PDF documents that the user uploads.
- You have access to the full internet through the user's browser (they can share screens or ask questions).

## Image analysis protocol
When an image or screen capture is provided:
1. First, describe what you see at a high level.
2. Then, extract and read any visible text, numbers, labels, or handwriting.
3. If there are math problems, equations, or calculations visible — solve them step by step. Show your reasoning and final answer.
4. If there are charts, graphs, or data — interpret the data and offer insights.

## Tone & style
- Address the user as "Sir" or "Ma'am" occasionally, not every sentence.
- Tone: intelligent, warm, professional, calm, with a touch of dry wit.
- Use markdown for formatting (lists, code blocks, bold, etc.) when helpful.
- You are JARVIS — be worthy of the name.`;
}

const SYSTEM_PROMPT = getSystemPrompt();

// Validate env vars
if (!AZURE_ENDPOINT) throw new Error("Missing VITE_AZURE_OPENAI_ENDPOINT env var");
if (!AZURE_API_KEY) throw new Error("Missing VITE_AZURE_OPENAI_API_KEY env var");

// ── Helpers ────────────────────────────────────────────────────────────────

/** Extract plain text from a PDF data URL by decoding Base64 and stripping PDF markers */
async function extractPdfText(dataUrl: string): Promise<string> {
  try {
    // data:application/pdf;base64,...
    const base64 = dataUrl.split(",")[1];
    if (!base64) return "[PDF content could not be read]";
    // Decode base64 to binary string
    const binary = atob(base64);
    // Try to extract text between parentheses or BT/ET markers
    const textParts: string[] = [];
    // Simple PDF text extraction: look for text between parentheses in Tj/TJ operators
    const re = /\(([^)]*)\)\s*Tj/g;
    let match;
    while ((match = re.exec(binary)) !== null) {
      const txt = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
        .replace(/\\(.)/g, "$1");
      if (txt.trim()) textParts.push(txt);
    }
    return textParts.length > 0
      ? textParts.join(" ")
      : `[PDF document: ${(binary.length / 1024).toFixed(0)} KB — text could not be fully extracted. You may need to describe its contents.]`;
  } catch {
    return "[PDF content could not be read]";
  }
}

/** Format messages for the API, handling multimodal content */
async function formatMessages(messages: Msg[]): Promise<any[]> {
  const formatted: any[] = [{ role: "system", content: SYSTEM_PROMPT }];

  for (const msg of messages) {
    if (msg.role === "system") continue; // skip duplicate system messages
    if (msg.role === "assistant") {
      formatted.push({ role: "assistant", content: msg.content });
      continue;
    }

    // User message - handle attachments
    const hasImages = msg.attachments?.some((a) => a.type === "image");
    const hasPdfs = msg.attachments?.some((a) => a.type === "pdf");

    if (hasImages || hasPdfs) {
      const content: any[] = [];

      if (msg.content) {
        content.push({ type: "text", text: msg.content });
      }

      // Add images
      for (const att of msg.attachments || []) {
        if (att.type === "image") {
          content.push({ type: "image_url", image_url: { url: att.data } });
        }
      }

      // Add PDF text
      for (const att of msg.attachments || []) {
        if (att.type === "pdf") {
          const pdfText = await extractPdfText(att.data);
          content.push({
            type: "text",
            text: `[Attached PDF: ${att.name}]\n${pdfText}`,
          });
        }
      }

      formatted.push({ role: "user", content });
    } else {
      formatted.push({ role: "user", content: msg.content });
    }
  }

  return formatted;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  onStateChange?: (state: { speaking: boolean; listening: boolean; thinking: boolean; voiceMode: boolean }) => void;
  autoVoiceMode?: boolean;
  initialAttachments?: Attachment[];
}

// ── Component ──────────────────────────────────────────────────────────────

export function CommandConsole({ onStateChange, autoVoiceMode, initialAttachments }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Online and ready, Sir. How may I assist?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOut, setVoiceOut] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false); // continuous conversation mode
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments || []);
  const [screenActive, setScreenActive] = useState(false);

  // Settings state (applied via jarvis:settings event or defaults)
  const silenceDelayRef = useRef(2000); // ms before sending accumulated speech
  const temperatureRef = useRef(0.7);
  const maxTokensRef = useRef(4096);
  const autoScreenRef = useRef(true); // auto screen analysis toggle

  const scrollRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const screenAbortRef = useRef<AbortController | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const promptTimerRef = useRef<number | null>(null);
  const accumulatedSpeechRef = useRef("");
  const voiceModeActiveRef = useRef(false);
  const messagesRef = useRef<Msg[]>([]);
  const sendRef = useRef<Function | null>(null);
  const screenFrameCountRef = useRef(0);
  const autoVoiceStartedRef = useRef(false);
  const listeningRef = useRef(false);
  // Stable listener refs to avoid constant re-registration
  const toggleListenRef = useRef<() => void>(() => {});
  const sendRefStable = useRef<(text: string) => void>(() => {});

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Keep refs in sync with state
  useEffect(() => {
    voiceModeActiveRef.current = voiceMode;
  }, [voiceMode]);
  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  // Expose send to ref so voice mode callbacks can use latest state
  useEffect(() => {
    sendRef.current = sendInternal;
  });

  // ── State sync ──────────────────────────────────────────────────────────

  useEffect(() => {
    onStateChange?.({ speaking, listening, thinking, voiceMode });
  }, [speaking, listening, thinking, voiceMode, onStateChange]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // Keep ref-based versions of handlers so event listeners never need to re-register
  useEffect(() => {
    toggleListenRef.current = toggleListen;
  });
  useEffect(() => {
    sendRefStable.current = send;
  });

  // ── Stable event listeners (registered once, use refs internally) ───────

  useEffect(() => {
    const cmd = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) sendRefStable.current(detail);
    };
    const mic = () => toggleListenRef.current();
    window.addEventListener("jarvis:command", cmd);
    window.addEventListener("jarvis:toggleMic", mic);
    return () => {
      window.removeEventListener("jarvis:command", cmd);
      window.removeEventListener("jarvis:toggleMic", mic);
    };
  }, []);

  // ── Greeting ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (voiceOut) {
      setTimeout(() => speak(messages[0].content, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
      }), 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-start voice mode ───────────────────────────────────────────────

  useEffect(() => {
    if (autoVoiceMode && !autoVoiceStartedRef.current) {
      autoVoiceStartedRef.current = true;
      // Small delay to let the component mount
      setTimeout(() => toggleVoiceMode(), 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoVoiceMode]);

  // ── Voice mode silence detection & prompting ───────────────────────────

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const clearPromptTimer = () => {
    if (promptTimerRef.current !== null) {
      clearTimeout(promptTimerRef.current);
      promptTimerRef.current = null;
    }
  };

  const onSilenceDetected = useCallback(() => {
    const text = accumulatedSpeechRef.current.trim();
    accumulatedSpeechRef.current = "";
    if (text) {
      clearPromptTimer();
      sendRef.current?.(text);
    }
  }, []);

  const onUserSilentPrompt = useCallback(() => {
    // If still in voice mode and user has been silent for 8 seconds, prompt them
    if (voiceModeActiveRef.current && !thinking && !isSpeaking()) {
      const promptMsg = "Sir, are you still there? I'm here if you need anything.";
      speak(promptMsg, {
        onStart: () => setSpeaking(true),
        onEnd: () => {
          setSpeaking(false);
          // Re-enable listening after prompt
          if (voiceModeActiveRef.current) {
            setTimeout(() => startVoiceListening(), 200);
          }
        },
      });
    }
  }, [thinking]);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    clearPromptTimer();
    if (voiceModeActiveRef.current) {
      silenceTimerRef.current = window.setTimeout(onSilenceDetected, silenceDelayRef.current);
    }
  }, [onSilenceDetected]);

  const startSilencePromptTimer = useCallback(() => {
    clearPromptTimer();
    if (voiceModeActiveRef.current) {
      // After 8 seconds of silence after AI finishes speaking, prompt the user
      promptTimerRef.current = window.setTimeout(onUserSilentPrompt, 8000);
    }
  }, [onUserSilentPrompt]);

  // ── Core send function ──────────────────────────────────────────────────

  const sendInternal = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMsg: Msg = {
      role: "user",
      content: trimmed,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setAttachments([]);
    setThinking(true);
    stopSpeaking();
    setSpeaking(false);

    abortRef.current = new AbortController();
    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, content: assistantSoFar };
          return updated;
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };      try {
      const apiMessages = await formatMessages(next);
      const chatUrl = getChatUrl();

      const resp = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_API_KEY,
        },
        body: JSON.stringify({
          messages: apiMessages,
          stream: true,
          max_completion_tokens: maxTokensRef.current,
          temperature: temperatureRef.current,
        }),
        signal: abortRef.current.signal,
      });

      if (resp.status === 429) { toast.error("Rate limit reached. Easy now."); setThinking(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add funds in Settings."); setThinking(false); return; }
      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        let errMsg = "JARVIS is unreachable.";
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error?.message || errMsg;
        } catch {}
        toast.error(`JARVIS error (${resp.status}): ${errMsg}`);
        setThinking(false);
        return;
      }
      if (!resp.body) { toast.error("JARVIS returned empty response."); setThinking(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
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
          if (json === "[DONE]") break;
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

      // Voice output for response
      if (voiceOut && assistantSoFar) {
        speak(assistantSoFar, {
          onStart: () => setSpeaking(true),
          onEnd: () => {
            setSpeaking(false);
            // In voice mode, re-enable listening after speaking
            if (voiceModeActiveRef.current && !thinking) {
              startVoiceListening();
              startSilencePromptTimer();
            }
          },
        });
      } else if (voiceMode && assistantSoFar) {
        // Voice mode with voiceOut off — still auto-listen
        if (voiceModeActiveRef.current && !thinking) {
          setTimeout(() => startVoiceListening(), 300);
          setTimeout(() => startSilencePromptTimer(), 300);
        }
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

  // Public send — used by event handlers, routes through ref to avoid stale closures
  const send = useCallback((text: string) => {
    sendRef.current?.(text);
  }, []);

  // ── Start voice listening (used by voice mode) ──────────────────────────

  const startVoiceListening = useCallback(() => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
    }

    const rec = getRecognition({ continuous: true });
    if (!rec) {
      toast.error("Voice input not supported");
      return;
    }

    recRef.current = rec;
    accumulatedSpeechRef.current = "";

    toast.info("🎤 Listening... I'm all ears", { id: "voice-mode-listening", duration: 4000 });

    rec.onresult = (e: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      // Show interim results live in the input
      if (interimTranscript) {
        const prefix = accumulatedSpeechRef.current ? accumulatedSpeechRef.current + " " : "";
        setInput(prefix + interimTranscript);
      }
      if (finalTranscript) {
        accumulatedSpeechRef.current += (accumulatedSpeechRef.current ? " " : "") + finalTranscript;
        setInput(accumulatedSpeechRef.current);
        resetSilenceTimer();
      }
    };

    rec.onend = () => {
      // If voice mode is still active, restart recognition
      if (voiceModeActiveRef.current && !isSpeaking()) {
        try {
          rec.start();
        } catch {}
      } else if (voiceModeActiveRef.current) {
        // Speaking - will restart when done (handled in speak onEnd)
      } else {
        setListening(false);
      }
    };

    rec.onerror = (e: any) => {
      const errorMsg = e?.error || "unknown error";
      console.error("Speech recognition error:", errorMsg);
      if (errorMsg === "not-allowed") {
        toast.error("🔇 Microphone blocked. Allow mic access in browser settings (lock icon in URL bar).", { duration: 8000 });
        if (voiceModeActiveRef.current) {
          setVoiceMode(false);
          voiceModeActiveRef.current = false;
        }
        setListening(false);
        return;
      }
      if (errorMsg === "no-speech") {
        // Normal - user didn't speak, just restart
        if (voiceModeActiveRef.current) {
          setTimeout(() => {
            if (voiceModeActiveRef.current) startVoiceListening();
          }, 300);
        }
        return;
      }
      if (errorMsg === "aborted") {
        // Normal when stopping intentionally
        if (!voiceModeActiveRef.current) setListening(false);
        return;
      }
      // Other errors - show toast and retry
      toast.error(`Voice error: ${errorMsg}. Retrying...`);
      if (voiceModeActiveRef.current) {
        setTimeout(() => {
          if (voiceModeActiveRef.current) startVoiceListening();
        }, 1000);
      } else {
        setListening(false);
      }
    };

    try {
      rec.start();
      setListening(true);
    } catch (e) {
      console.error("Voice mode start failed:", e);
      toast.error("Failed to start voice mode. Check your microphone.", { duration: 6000 });
    }
  }, [resetSilenceTimer]);

  // ── Toggle voice mode (continuous conversation) ─────────────────────────

  const toggleVoiceMode = () => {
    if (voiceMode) {
      // Turn off voice mode
      stopListening();
      setVoiceMode(false);
      clearSilenceTimer();
      clearPromptTimer();
      accumulatedSpeechRef.current = "";
      toast.info("Voice conversation mode off");
    } else {
      // Turn on voice mode
      setVoiceMode(true);
      stopSpeaking();
      setSpeaking(false);
      clearSilenceTimer();
      clearPromptTimer();
      accumulatedSpeechRef.current = "";
      toast.success("Voice conversation mode on — speak naturally");
      // Start listening after a brief delay
      setTimeout(() => startVoiceListening(), 300);
    }
  };

  // ── Toggle listen (manual mic) ──────────────────────────────────────────

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    clearPromptTimer();
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    setListening(false);
    if (voiceModeActiveRef.current) {
      const text = accumulatedSpeechRef.current.trim();
      accumulatedSpeechRef.current = "";
      if (text) sendRefStable.current(text);
    }
  }, []);

  const toggleListen = useCallback(() => {
    if (listeningRef.current) {
      stopListening();
      return;
    }
    // If voice mode is on, just use that
    if (voiceMode) {
      startVoiceListening();
      return;
    }
    // Manual push-to-talk
    const rec = getRecognition({ continuous: false });
    if (!rec) {
      toast.error("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    recRef.current = rec;
    let finalText = "";
    toast.info("🎤 Listening... Speak now", { id: "push-to-talk", duration: 8000 });
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      const display = finalText + (interim ? ` (${interim})` : "");
      setInput(display);
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) {
        toast.success(`✅ Transcribed: "${finalText}"`, { duration: 3000 });
        sendRefStable.current(finalText);
        setInput("");
      }
    };
    rec.onerror = (e: any) => {
      const errorMsg = e?.error || "unknown error";
      console.error("Push-to-talk speech error:", errorMsg);
      if (errorMsg === "not-allowed") {
        toast.error("🔇 Microphone blocked. Allow mic access in browser settings (lock icon in URL bar).", { duration: 8000 });
      } else if (errorMsg === "no-speech") {
        toast.info("No speech detected. Try speaking louder.", { duration: 3000 });
      } else if (errorMsg !== "aborted") {
        toast.error(`Voice error: ${errorMsg}`);
      }
      setListening(false);
    };
    try {
      rec.start();
      setListening(true);
      stopSpeaking();
      setSpeaking(false);
    } catch (e) {
      console.error("Speech recognition start failed:", e);
      toast.error("Failed to start voice. Check microphone permissions.", { duration: 8000 });
    }
  }, [voiceMode, stopListening, startVoiceListening]);

  // ── Screen share frame handler ──────────────────────────────────────────

  const handleScreenFrame = useCallback((base64Frame: string) => {
    if (thinking || !autoScreenRef.current) {
      // Skip frame if already processing something or auto analysis is disabled
      return;
    }

    screenFrameCountRef.current++;

    // Cap screen frame messages at 20 to prevent unbounded growth
    const currentMessages = messagesRef.current;
    const filtered = currentMessages.filter((m) => !m.isScreenFrame);
    // Keep last 10 non-screen messages, then screen frames up to 20 total
    const screenFrames = currentMessages
      .filter((m) => m.isScreenFrame)
      .slice(-18);

    const frameMsg: Msg = {
      role: "user",
      content: "Analyze what's currently on my screen. Read any visible text, numbers, equations, or handwriting. If there are math problems or sums visible, solve them step by step and provide the answers. Describe what you see and offer any useful observations or suggestions.",
      attachments: [{ id: crypto.randomUUID(), type: "image", name: "screen-capture.jpg", data: base64Frame, mime: "image/jpeg" }],
      isScreenFrame: true,
    };

    const next = [...filtered, ...screenFrames, frameMsg];
    setMessages(next);
    setThinking(true);

    // Use dedicated AbortController for screen frames
    screenAbortRef.current?.abort();
    screenAbortRef.current = new AbortController();
    const signal = screenAbortRef.current.signal;

    // Send the screen analysis
    (async () => {
      try {
        const apiMessages = await formatMessages(next);
        const chatUrl = getChatUrl();
        const resp = await fetch(chatUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_API_KEY,
          },
          body: JSON.stringify({ messages: apiMessages, stream: true, max_completion_tokens: 1024, temperature: 0.3 }),
          signal,
        });
        if (!resp.ok || !resp.body) { setThinking(false); return; }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantSoFar = "";

        while (true) {
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
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantSoFar += content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...last, content: assistantSoFar };
                    return updated;
                  }
                  return [...prev, { role: "assistant", content: assistantSoFar }];
                });
              }
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
      } catch {
        // Silent fail for screen frame analysis
      } finally {
        setThinking(false);
      }
    })();
  }, [thinking, voiceOut]);

  // ── Register custom event listeners ────────────────────────────────────

  useEffect(() => {
    const handleVoiceCall = () => {
      if (!voiceMode) {
        toggleVoiceMode();
      }
    };
    const handleScreenShare = () => {
      // Trigger the screen share button click
      const screenShareBtn = document.querySelector('[title="Share screen"]') as HTMLButtonElement;
      if (screenShareBtn && !screenActive) {
        screenShareBtn.click();
      }
    };
    const handleAttachment = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.attachment) {
        const att = detail.attachment;
        setAttachments((prev) => [...prev, att]);
        // Auto-send the file to JARVIS for analysis
        const analysisPrompt = att.type === "pdf"
          ? `Analyze this PDF document: ${att.name}. Extract and summarize its contents.`
          : `Analyze this image: ${att.name}. Read any visible text, numbers, and equations. If there are math problems or sums, solve them step by step and provide the answers. Describe what you see in detail.`;
        setTimeout(() => {
          sendRefStable.current(analysisPrompt);
        }, 600);
      }
    };
    const handleSettings = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setVoiceConfig({
          voiceName: detail.voiceName,
          rate: detail.speechRate,
          pitch: detail.speechPitch,
        });
        // Apply all runtime settings
        if (detail.voiceModeSilenceDelay != null) {
          silenceDelayRef.current = detail.voiceModeSilenceDelay * 1000;
        }
        if (detail.temperature != null) {
          temperatureRef.current = detail.temperature;
        }
        if (detail.maxTokens != null) {
          maxTokensRef.current = detail.maxTokens;
        }
        // Apply AI model / deployment override
        if (detail.aiModel) {
          setDeploymentOverride(detail.aiModel !== AZURE_DEPLOYMENT ? detail.aiModel : null);
        }
        // Apply auto screen analysis toggle
        if (detail.autoScreenAnalysis != null) {
          autoScreenRef.current = detail.autoScreenAnalysis;
        }
      }
    };
    const handleNewChat = () => {
      setMessages([{ role: "assistant", content: "Online and ready, Sir. How may I assist?" }]);
      setAttachments([]);
    };

    window.addEventListener("jarvis:voiceCall", handleVoiceCall);
    window.addEventListener("jarvis:screenShare", handleScreenShare);
    window.addEventListener("jarvis:attachment", handleAttachment);
    window.addEventListener("jarvis:settings", handleSettings);
    window.addEventListener("jarvis:newChat", handleNewChat);

    return () => {
      window.removeEventListener("jarvis:voiceCall", handleVoiceCall);
      window.removeEventListener("jarvis:screenShare", handleScreenShare);
      window.removeEventListener("jarvis:attachment", handleAttachment);
      window.removeEventListener("jarvis:settings", handleSettings);
      window.removeEventListener("jarvis:newChat", handleNewChat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode, screenActive]);

  // ── Stop all ────────────────────────────────────────────────────────────

  const stopAll = () => {
    abortRef.current?.abort();
    screenAbortRef.current?.abort();
    stopSpeaking();
    clearSilenceTimer();
    clearPromptTimer();
    stopListening();
    setSpeaking(false);
    setThinking(false);
  };

  // ── Cleanup ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      clearPromptTimer();
      if (recRef.current) {
        try { recRef.current.stop(); } catch {}
      }
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="glass-panel corner-bracket relative flex flex-col h-full min-h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success glow-cyan animate-pulse" />
          <h2 className="font-display text-xs tracking-[0.3em] text-primary glow-text">
            COMMAND CONSOLE
          </h2>
          {voiceMode && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 uppercase tracking-wider animate-pulse">
              Voice mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Voice conversation mode toggle */}
          <Button size="icon" variant="ghost" className={`h-7 w-7 ${voiceMode ? "text-success" : "text-muted-foreground"}`}
            onClick={toggleVoiceMode} title={voiceMode ? "Exit voice conversation mode" : "Enter voice conversation mode"}>
            {voiceMode ? <MessageCircle className="h-3.5 w-3.5" /> : <MessageCircleOff className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => setVoiceOut(v => !v)} title={voiceOut ? "Mute voice output" : "Unmute"}>
            {voiceOut ? <Volume2 className="h-3.5 w-3.5 text-primary" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => { setMessages([{ role: "assistant", content: "Memory cleared. Standing by." }]); setAttachments([]); }}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => {
          // Skip screen frame messages from display
          if (m.isScreenFrame) return null;
          return (
            <div key={i} className={`animate-fade-up ${m.role === "user" ? "text-right" : ""}`}>
              <div className="text-[10px] uppercase tracking-widest mb-1 text-muted-foreground">
                {m.role === "user" ? "YOU" : "JARVIS"}
              </div>
              <div className={`inline-block max-w-[90%] px-3.5 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap
                ${m.role === "user"
                  ? "bg-primary/15 text-foreground border border-primary/30"
                  : "bg-card text-foreground border border-primary/20 glow-cyan"}`}>
                {/* Show attachment indicators */}
                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {m.attachments.map((att, ai) => (
                      <span key={ai} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                        {att.type === "image" ? "📷" : "📄"} {att.name}
                      </span>
                    ))}
                  </div>
                )}
                {m.content}
              </div>
            </div>
          );
        })}
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

      {/* Attachment preview chips */}
      {attachments.length > 0 && !thinking && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-1">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[11px]">
              <span>{att.type === "image" ? "📷" : "📄"}</span>
              <span className="truncate max-w-[100px] text-muted-foreground">{att.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (!voiceMode) send(input); }}
        className="flex items-center gap-1 px-3 py-2 border-t border-primary/20"
      >
        {/* File attachment */}
        <FilesAttachment
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          disabled={thinking || voiceMode}
        />

        {/* Screen share */}
        <ScreenShare
          onFrame={handleScreenFrame}
          onActiveChange={setScreenActive}
          disabled={thinking}
        />

        <input
          id="jarvis-chat-input"
          name="jarvis-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            voiceMode ? "Voice mode active — speak naturally..." :
            listening ? "Listening…" :
            screenActive ? "Screen sharing — ask about your screen" :
            "Address JARVIS…"
          }
          className="flex-1 bg-transparent border border-primary/30 rounded-md px-3 py-2 text-sm
            font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-smooth"
        />
        {voiceMode ? (
          <Button type="button" size="icon" variant="ghost"
            className={`h-9 w-9 shrink-0 ${listening ? "text-danger glow-cyan" : "text-success"}`}
            onClick={toggleVoiceMode}>
            {listening ? <MicOff className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
          </Button>
        ) : (
          <Button type="button" size="icon" variant="ghost"
            className={`h-9 w-9 shrink-0 ${listening ? "text-danger glow-cyan" : "text-primary"}`}
            onClick={toggleListen}>
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        {(thinking || speaking) ? (
          <Button type="button" size="icon" className="h-9 w-9 bg-danger/80 hover:bg-danger shrink-0" onClick={stopAll}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90 glow-cyan shrink-0" disabled={!input.trim() || thinking}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
