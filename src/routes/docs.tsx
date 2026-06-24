import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Mic, Monitor, FileText, MessageCircle, Cpu, Shield } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "JARVIS — System Documentation" },
      { name: "description", content: "JARVIS holographic AI assistant system documentation and user guide." },
    ],
  }),
  component: DocsPage,
});

const SECTIONS = [
  {
    id: "overview",
    icon: BookOpen,
    title: "System Overview",
    content: `JARVIS (Just A Rather Very Intelligent System) is a futuristic, voice-first holographic AI assistant inspired by Iron Man's iconic AI. It combines a sleek holographic interface with real-time voice interaction, file analysis, screen sharing, and streaming AI capabilities powered by Azure OpenAI.

The system is built as a static web application using React, TanStack Router, and Tailwind CSS, deployable anywhere static sites are supported.`,
  },
  {
    id: "features",
    icon: Cpu,
    title: "Key Features",
    content: [
      { label: "Voice-first interaction", desc: "Tap the orb and speak naturally. JARVIS listens, transcribes, and responds with both text and speech." },
      { label: "Streaming AI responses", desc: "Real-time streaming responses from Azure OpenAI — you see the reply as it's generated, word by word." },
      { label: "Holographic interface", desc: "Fully themed dark holographic UI with animated orb, telemetry panels, corner brackets, and glow effects." },
      { label: "File upload & analysis", desc: "Upload images and PDFs. JARVIS can analyze image contents with vision AI and read text from PDF documents." },
      { label: "Screen sharing", desc: "Share your screen and JARVIS will periodically analyze its contents, offering observations and assistance." },
      { label: "Voice conversation mode", desc: "Toggle continuous conversation mode. Speak naturally, JARVIS detects silence and responds — like a real conversation." },
      { label: "Quick command suggestions", desc: "Pre-built command categories for coding, analysis, creative tasks, and general questions." },
      { label: "Voice output toggle", desc: "Choose whether JARVIS speaks responses aloud or only displays them as text." },
    ],
  },
  {
    id: "voice",
    icon: Mic,
    title: "Voice Modes",
    content: [
      { label: "Standard mode (push-to-talk)", desc: "Tap the orb or mic button to speak. Your speech is captured until you stop talking, then sent to JARVIS." },
      { label: "Voice conversation mode", desc: "Toggle this mode with the chat bubble button in the command console header. The mic stays open continuously. Speak naturally — when you fall silent for ~2 seconds, JARVIS automatically responds. After responding, the mic re-opens for your next reply. A true conversational loop." },
      { label: "Voice output", desc: "Toggle the speaker icon to enable or disable JARVIS speaking responses aloud. Uses browser's built-in Speech Synthesis." },
    ],
  },
  {
    id: "files",
    icon: FileText,
    title: "File Uploads",
    content: [
      { label: "Supported formats", desc: "Images (PNG, JPEG, GIF, WebP) and PDF documents. Max file size: 10 MB per file." },
      { label: "Image analysis", desc: "Upload images and JARVIS will analyze them using Azure OpenAI's vision capabilities. Ask questions about what's in the image." },
      { label: "PDF analysis", desc: "Upload PDFs and JARVIS extracts and reads the text content. Works best with text-based PDFs." },
      { label: "How to use", desc: "Click the paperclip icon in the command console input area, select Images or PDFs, choose your files, then send your message with the files attached." },
    ],
  },
  {
    id: "screen",
    icon: Monitor,
    title: "Screen Sharing",
    content: [
      { label: "Starting a share", desc: "Click the monitor icon in the command console. Your browser will prompt you to select which screen or window to share." },
      { label: "How it works", desc: "Once sharing, JARVIS captures a frame of your screen every 7 seconds and analyzes it. Each analysis includes observations about what's on screen." },
      { label: "Stopping", desc: "Click the red monitor icon to stop sharing, or use your browser's built-in screen sharing controls. A banner appears at the top while sharing is active." },
      { label: "Privacy", desc: "Screen sharing is entirely local until you choose to share. Frames are sent only to Azure OpenAI for analysis and are not stored." },
    ],
  },
  {
    id: "architecture",
    icon: Cpu,
    title: "Architecture",
    content: [
      { label: "Frontend", desc: "React 19 with TypeScript, TanStack Router & Start, Tailwind CSS 4, Vite." },
      { label: "AI Backend", desc: "Azure OpenAI — direct API calls from the browser using VITE_ environment variables." },
      { label: "Deployment", desc: "Static site on Vercel (or any static host). No server runtime needed." },
      { label: "Voice", desc: "Browser Web Speech API (SpeechRecognition + SpeechSynthesis). Works in Chrome, Edge, and Safari." },
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Security & Privacy",
    content: [
      { label: "API Key", desc: "The Azure OpenAI API key is passed via VITE_ env var and is exposed to the browser. Use a key with appropriate usage limits." },
      { label: "Data handling", desc: "Conversation history is stored only in browser memory. Clearing the console removes all messages." },
      { label: "Screen sharing", desc: "Screen capture frames are sent directly to Azure OpenAI for analysis. No data is stored on intermediate servers." },
      { label: "Voice data", desc: "Speech recognition happens locally in your browser. Transcribed text is sent to Azure OpenAI for processing." },
    ],
  },
];

function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-panel mx-4 mt-4 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-smooth"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to interface
          </Link>
          <div className="w-px h-5 bg-primary/20" />
          <h1 className="font-display text-sm tracking-[0.3em] text-primary glow-text">
            SYSTEM DOCUMENTATION
          </h1>
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          v3.7.0
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="glass-panel corner-bracket relative p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center glow-cyan">
                <section.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display text-lg tracking-[0.2em] text-primary glow-text">
                {section.title}
              </h2>
            </div>

            {typeof section.content === "string" ? (
              <p className="text-sm text-foreground/80 leading-relaxed">{section.content}</p>
            ) : (
              <div className="space-y-4">
                {section.content.map((item: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0 glow-cyan" />
                    <div>
                      <h3 className="text-sm font-semibold text-primary mb-0.5">{item.label}</h3>
                      <p className="text-xs text-foreground/70 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
            STARK INDUSTRIES — HOLOGRAPHIC INTERFACE • JARVIS OS v3.7.0
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground/40">
            Powered by Azure OpenAI • TanStack • React • Tailwind CSS
          </p>
        </div>
      </main>
    </div>
  );
}
