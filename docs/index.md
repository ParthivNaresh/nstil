# NStil

A cross-platform reflection and journaling companion with on-device AI intelligence.

Mobile-first (iOS/Android via Expo), FastAPI backend, Supabase for auth and Postgres, Redis for caching. All AI inference runs on-device via Apple Foundation Models — your journal never leaves your phone.

## Features

- **Journal entries** — Rich text, mood tracking (5 categories × 4 sub-emotions), tags, entry types, backdating
- **Media attachments** — Multiple images with client-side compression, voice memos with Skia waveform visualization
- **Location tagging** — GPS auto-detect, place search via Nominatim, Apple Maps pin drop
- **Journals & spaces** — Separate spaces for different areas of life, filterable
- **Full-text search** — Postgres tsvector with weighted ranking, debounced search UI
- **Calendar & mood history** — Continuous-scroll mood calendar with Skia gradient cells, streak tracking
- **On-device AI** — Personalized check-in prompts, entry reflections, weekly narrative summaries, mood-aware notification text — all generated on-device via Apple Foundation Models (iOS 26+)
- **AI check-in flow** — Multi-step guided check-in with mood selection, contextual prompts, convert-to-entry
- **Insights dashboard** — Streak banners, weekly summaries, mood anomaly detection, mood trend charts, year-in-pixels grid
- **Push notifications** — Scheduled reminders with configurable cadence, quiet hours, personalized text
- **Glassmorphism UI** — Three theme palettes (dark/light/OLED), Skia GPU-rendered ambient background, haptic feedback throughout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 54, React Native 0.81, TypeScript |
| GPU Rendering | @shopify/react-native-skia |
| State | Zustand + TanStack React Query |
| On-device AI | Apple Foundation Models (iOS 26+) via custom Expo native module |
| Backend | FastAPI, Python 3.12+, strict mypy |
| Database | Supabase (Postgres with RLS, full-text search, RPCs) |
| Cache | Redis with pattern-based invalidation |
| Auth | Supabase Auth (JWT, email verification, password reset) |

## Architecture Highlights

**Privacy-first AI**: All LLM inference runs on-device via Apple Foundation Models. The backend provides structured context (mood distributions, entry summaries, user preferences) via `GET /ai/context`. The mobile client feeds this to the on-device 3B parameter model for personalized text generation. Results are persisted via API but the model never sees raw journal content on any server.

**Graceful degradation**: When Foundation Models are unavailable (non-iOS, older devices, Apple Intelligence disabled), the app falls back to a curated prompt bank (76 prompts across 7 categories with mood/topic/intensity filtering). The UI is completely source-agnostic.

**Cache-aside pattern**: Redis sits in front of all read-heavy paths (entries, calendar, search, AI context, user preferences) with TTL-based expiration and pattern-based invalidation on writes.

**Cursor-based pagination**: All list endpoints use cursor-based pagination for consistent performance regardless of dataset size.

## Current Status

| Phase | Status |
|-------|--------|
| 1 — Authentication | ✅ |
| 2 — Design System | ✅ |
| 3 — Journal Entry CRUD | ✅ |
| 4 — Core Journaling Features | 🔄 (4C rich text, 4G management screen remaining) |
| 5 — AI Intelligence Layer | ✅ (iOS; Android pending) |
| 6 — Production Deployment | Not started |

See the full [Roadmap](roadmap.md) for details.
