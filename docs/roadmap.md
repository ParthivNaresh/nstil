# Roadmap

## Phase 1 — Authentication ✅

Complete, production-grade auth flow across backend and mobile.

- Backend auth hardening & protected route patterns
- Mobile auth screens (Sign In, Sign Up, Email Verification, Password Reset)
- Session management hardening
- Integration testing & auth polish

## Phase 2 — Design System ✅

Reusable component library with Reanimated animations, glassmorphism effects, and accessibility.

- Design token hardening & typography system
- Core layout & navigation components
- Data display components
- Input & form components

## Phase 3 — Journal Entry CRUD ✅

Core product loop: create, read, update, delete journal entries. FastAPI backend with Supabase Postgres, cursor-based pagination, Redis caching, and full mobile screens.

## Phase 4 — Core Journaling Features

### Completed

- **4A — Theme System & Skia** ✅ — 3 palettes, Skia gradients, ambient background, theme persistence
- **4B — Visual Polish** 🔄 — Glassmorphism redesign (auth screen verification remaining)
- **4D — Pin & Star** ✅ — Pin toggle with haptics, pinned-first sort
- **4E — Full-Text Search** ✅ — Postgres tsvector, search RPC, History tab
- **4F — Backdate Entries** ✅ — Custom date picker, future prevention
- **4G — Journals & Spaces** 🔄 — CRUD, picker, filter (management screen remaining)
- **4H — Enhanced Mood** ✅ — 5 categories × 4 sub-emotions, Skia gradient pills
- **4I — Calendar** ✅ — Continuous scroll, mood-colored cells, timezone-aware
- **4J — Media (Images)** ✅ — Multi-image upload, compression, thumbnails
- **4K — Voice Memos** ✅ — Recording, Skia waveform, playback, persistence
- **4L — Location Tagging** ✅ — GPS auto-detect, Nominatim search, Apple Maps pin drop

### Remaining

- **4C — Rich Text Editing** — Markdown editor with formatting toolbar
- **4G-10/11** — Journal management screen, journal indicators on cards

## Phase 5 — AI Intelligence Layer ✅

- **5A — Backend AI** ✅ — 10 models, 9 services, 3 orchestrators, 76-prompt bank, 20 endpoints, 583 tests
- **5B — Notifications** ✅ — Scheduled reminders, quiet hours, preferences screen
- **5C — On-Device AI (iOS)** ✅ — Foundation Models bridge, prompts, reflections, narratives, notification text
- **5D — On-Device AI (Android)** — Not started (Gemini Nano via ML Kit)
- **5E — AI Screens** ✅ — Check-in flow, home prompt card, insights dashboard, AI profile settings

## Phase 6 — Production Deployment

- CI/CD pipelines
- Production Supabase project
- Error tracking (Sentry)
- Log aggregation
- Performance budgets
- App store submission
- Network resilience (offline detection, retry logic)
