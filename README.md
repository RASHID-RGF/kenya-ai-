# Jarvis OS

A voice-first holographic assistant web UI built with React, TanStack, Tailwind, and Supabase Edge Functions.

## Overview

Jarvis OS is a futuristic AI assistant interface inspired by Iron Man's JARVIS. The app offers:

- tap-to-talk voice input using the browser SpeechRecognition API
- real-time text and voice output with Web Speech API TTS
- streaming AI responses through a Supabase Edge Function
- a polished holographic UI with telemetry elements, quick commands, and a command console

## Technology Stack

- `React 19` and `TypeScript`
- `Vite` for development and bundling
- `@tanstack/react-router` + `@tanstack/react-start`
- `Tailwind CSS` for styling
- `Supabase Functions` for the AI chat backend
- `Cloudflare` compatibility via `wrangler.jsonc`

## Features

- Voice-first conversation flow with mic toggle and speech transcription
- Assistant responds with streaming text chunks and optional voice output
- Persistent command console with history, manual input, and quick-command shortcuts
- Built-in error handling for rate limiting and connectivity failures
- Modern holographic dashboard styling and mobile-friendly controls

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the required environment variables.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open the app in your browser at the URL shown by Vite.

## Environment Variables

Create a `.env` file at the project root with the following values:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
```

For the Supabase edge function, configure the AI provider key in your Supabase environment or Deno environment:


```

## Architecture

- `src/routes/index.tsx` contains the main landing page and UI layout.
- `src/components/jarvis/` contains the Jarvis interface components, including the orb, status bar, console, and quick commands.
- `src/lib/voice.ts` handles browser speech recognition and speech synthesis.
- `supabase/functions/jarvis-chat/index.ts` streams user messages to the Lovable AI Gateway and returns streaming responses.
- `src/server.ts` is the Cloudflare-compatible server entry used by the worker runtime.

## Usage

- Tap the glowing orb to start or stop listening.
- Speak naturally; the assistant captures voice input and sends it to the backend.
- Use the command console to type messages or reopen the chat panel.
- Toggle voice output with the speaker button inside the console.
- Clear conversation history using the trash button.

## Build

```bash
npm run build
```

## Code Quality

- Lint with: `npm run lint`
- Format with: `npm run format`

## Notes

- Voice input requires a browser that supports the Web Speech API (Chrome and Edge recommended).
- The backend function expects a valid _API_KEY` and uses streaming responses.
- The UI includes mobile-friendly controls and a floating mic action button for small screens.

## Project Layout

- `src/` — frontend application source
- `supabase/functions/jarvis-chat/` — serverless chat function
- `wrangler.jsonc` — worker compatibility config
- `package.json` — app dependencies and scripts
- `tsconfig.json` — TypeScript config

---

`Jarvis OS` is designed for rapid prototyping of a voice-enabled AI assistant experience with modern frontend tooling and serverless AI streaming.
