# Zarvis

A premium AI assistant — conversational chat, wake-word/double-clap voice activation, document
intelligence, image vision + OCR, and persistent memory. Built with Next.js 15, Supabase, and
NVIDIA NIM (build.nvidia.com).

## Tech stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Supabase (Postgres + pgvector, Auth, Storage, Realtime, Row Level Security) — no
  separate Node/Express backend
- **AI**: NVIDIA NIM — free, OpenAI-compatible hosted inference (chat, vision, embeddings). A
  standalone Google Gemini implementation also ships in `lib/services/gemini.ts` if you'd rather
  use that provider instead — see "Switching AI providers" below.

## 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A free [NVIDIA API key](https://build.nvidia.com) (no credit card required — sign in, go to your
  profile menu → API Keys → Generate API Key)

## 2. Set up Supabase

1. Create a new Supabase project.
2. In the SQL Editor, run the migration at `supabase/migrations/0001_init.sql`. This creates every
   table, index, trigger, RLS policy, storage bucket, and the `match_documents` semantic-search
   function, and enables the `vector` extension.
3. Under **Authentication → Providers**, enable **Email** and, if you want them, **Google** and
   **GitHub**. For OAuth providers you'll need to create OAuth apps with those providers and paste
   their client ID/secret into the Supabase dashboard — Supabase handles the redirect flow, so no
   extra code or environment variables are needed in this app for that part.
4. Under **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and
   your production URL's equivalent) as a redirect URL.
5. Copy your Project URL, anon key, and service role key from **Project Settings → API**.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NVIDIA_API_KEY=...
```

## 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Build for production

```bash
npm run build
npm run start
```

## Project structure

```
app/                 Next.js App Router pages and API routes
  (dashboard)/        Authenticated app shell: dashboard, chat, voice, documents, images, history, memory, settings, profile
  api/                 Route handlers: chat streaming, document processing, image analysis, account deletion
  login/ signup/ forgot-password/  Auth pages
  auth/callback/       OAuth + email confirmation callback
components/          UI components (shadcn-style primitives, chat, voice, layout, shared)
hooks/               useChat, useVoice, useSpeechRecognition, useSpeechSynthesis, useClapDetection, useMemory, useSettings, useUser
lib/
  supabase/            Browser client, server client, admin client, middleware session helper
  services/            Gemini service, PDF text extraction, speech (Web Speech API) service
  utils.ts, validations.ts
supabase/migrations/  SQL schema, RLS policies, storage buckets
types/               Database types, shared app types, Web Speech API ambient types
```

## Switching AI providers

The app calls whichever service is imported in the three API routes:
`app/api/chat/route.ts`, `app/api/documents/process/route.ts`, and `app/api/images/analyze/route.ts`.
By default they import from `@/lib/services/nvidia`. To switch back to Gemini, change those three
imports to `@/lib/services/gemini` and set `GEMINI_API_KEY` instead of `NVIDIA_API_KEY` in
`.env.local` (Gemini requires a Google Cloud billing account attached to get real quota — see the
comments in `.env.example`'s history, or ai.google.dev/pricing).

**One important detail if you switch providers after already using the app**: NVIDIA's embedding
model (`nv-embedqa-e5-v5`) outputs 1024-dimension vectors, while Gemini's `text-embedding-004`
outputs 768. The `documents.embedding` column in Supabase is fixed at one dimension size
(currently `vector(1024)` for NVIDIA). If you switch providers, you'll need to update that column's
dimension to match and re-embed any existing documents — the simplest way is to re-run the SQL
migration (`supabase/migrations/0001_init.sql`), which resets the schema, after changing the
`vector(1024)` occurrences to match your new provider's output size.

## NVIDIA free tier notes

- Sign-up requires no credit card and grants ~1,000 free inference credits, with rate limits of
  roughly 40 requests/minute on the free tier (NVIDIA doesn't publish an exact per-model number —
  check your own account dashboard at build.nvidia.com).
- NVIDIA's terms describe this tier as for development, testing, research, and evaluation — not
  for production traffic serving real end users. Treat it as ideal for personal/hobby use of
  Zarvis, not as a guaranteed always-on backend for other people to depend on.
- Default models are `meta/llama-3.3-70b-instruct` (chat), `meta/llama-3.2-11b-vision-instruct`
  (vision/OCR), and `nvidia/nv-embedqa-e5-v5` (embeddings) — all overridable via
  `NVIDIA_CHAT_MODEL`, `NVIDIA_VISION_MODEL`, and `NVIDIA_EMBEDDING_MODEL` in `.env.local` if you
  want to try a different model from NVIDIA's 100+ model catalog.

## Voice assistant notes

- **Wake word** ("Hey Zarvis" by default, configurable in Settings) uses the browser's
  `SpeechRecognition` API in continuous mode to listen for the phrase in ambient audio.
- **Double clap** detection is a real-time amplitude-spike analyzer built on the Web Audio API
  (`AnalyserNode`) — it looks for two sharp, fast-attack transients within a configurable time
  window. It's a heuristic, not a trained clap classifier, so sensitivity is tunable in Settings.
- Both features require microphone permission and work best in Chrome or Edge. Safari's support
  for continuous speech recognition is limited.

## Security

Every table has Row Level Security enabled — a user can only ever read or write their own rows.
Storage buckets (`documents`, `images`) are private and scoped per-user by folder; `avatars` is
public-read since avatars are displayed in the UI. The Supabase service role key is only used
server-side, in the account-deletion route.
