# NStil

A cross-platform reflection and journaling companion with on-device AI intelligence. Mobile-first (iOS/Android via Expo), FastAPI backend, Supabase for auth and Postgres, Redis for caching. All AI inference runs on-device via Apple Foundation Models — your journal never leaves your phone.

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
- **Network resilience** — Typed error classes, error-aware query retry with exponential backoff, screen-level error states with retry
- **Observability** — Sentry crash reporting with session replay, structured backend logging
- **Wellness features** — Guided breathing exercises (3 patterns, shader orb, haptics), ambient drift mini-game

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 54, React Native 0.81, TypeScript |
| GPU Rendering | @shopify/react-native-skia |
| State | Zustand + TanStack React Query |
| On-device AI | Apple Foundation Models (iOS 26+) via custom Expo native module |
| Error Tracking | Sentry (@sentry/react-native) with session replay and source maps |
| Backend | FastAPI, Python 3.12+, strict mypy |
| Database | Supabase (Postgres with RLS, full-text search, RPCs) |
| Cache | Redis with pattern-based invalidation |
| Auth | Supabase Auth (JWT, email verification, password reset) |

## Project Structure

```
nstil/
├── apps/
│   ├── mobile/              # Expo React Native app
│   │   ├── app/             # File-based routing (auth, tabs, entry, check-in, settings)
│   │   ├── components/      # UI primitives, journal, insights, settings components
│   │   ├── hooks/           # Custom hooks (form logic, data fetching, AI, check-in)
│   │   ├── lib/             # Utilities, i18n, validation, audio
│   │   ├── lib/ai/          # On-device AI (prompts, reflections, summaries, notifications)
│   │   ├── modules/nstil-ai/# Swift native module for Apple Foundation Models
│   │   ├── services/api/    # API client and domain-specific functions
│   │   ├── stores/          # Zustand stores (auth, theme, notifications)
│   │   ├── styles/          # Design tokens (palettes, spacing, typography)
│   │   └── types/           # Shared TypeScript interfaces
│   └── backend/             # FastAPI backend
│       └── src/nstil/
│           ├── api/         # Routes, DI, middleware (20 AI endpoints + CRUD)
│           ├── models/      # Pydantic models (15+ domain model files)
│           ├── services/    # Service layer (journal, media, notification)
│           ├── services/ai/ # AI services (9 data + 3 orchestration + prompt bank)
│           ├── cache/       # Redis cache layer with TTL management
│           └── core/        # Security, exceptions
├── supabase/
│   ├── config.toml          # Local Supabase config
│   └── migrations/          # 8 consolidated SQL migrations
├── docs/                    # MkDocs documentation source
├── .github/workflows/       # CI (lint, test, SonarCloud, docs build)
├── docker-compose.yml       # Backend + worker + Redis
├── justfile                 # Task runner
├── mkdocs.yml               # Documentation site config
├── sonar-project.properties # SonarCloud config
├── SETUP.md                 # Full setup instructions
├── ROADMAP.md               # Development roadmap
└── AGENT_CONTEXT.md         # AI agent onboarding context
```

## Quick Start

See [SETUP.md](SETUP.md) for full setup instructions from a fresh clone.

```sh
just dev                  # Start infrastructure + backend dev server
just mobile-ios           # Build and run on iOS Simulator
just device               # Build and run on physical iOS device
```

## Development

```sh
# Backend (format-check + lint + typecheck + test)
just backend-check

# Mobile (typecheck + lint)
just mobile-check

# Documentation
just docs-serve           # Local dev server at localhost:8000
just docs-build           # Strict build (used in CI)
```

583 backend tests. All code passes ruff format, ruff check, mypy (strict), tsc, and eslint.

## CI/CD

GitHub Actions run on every push to `main` and every PR:

- **Lint workflow** — backend format-check + lint + typecheck, mobile typecheck + lint, docs build
- **Test workflow** — pytest with coverage → SonarCloud analysis

All CI jobs use `just` commands for consistency with local development.

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
| 6 — Onboarding & Home Screen | 🔄 (onboarding, greeting, mood snapshots done; home polish remaining) |
| 7 — Wellness & Mini-Games | 🔄 (breathing ✅, drift in progress) |
| 8 — Production & Observability | 🔄 (Sentry, network resilience, CI/CD, rate limiting done; SMTP, app store remaining) |

See [ROADMAP.md](ROADMAP.md) for the full development plan.

## License

See [LICENSE](LICENSE).
