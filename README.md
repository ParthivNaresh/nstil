# NStil

A cross-platform reflection/journaling companion. Mobile-first (iOS/Android via Expo), FastAPI backend, Supabase for auth and Postgres, Redis for caching and async jobs.

## Project Structure

```
nstil/
├── apps/
│   ├── mobile/          # Expo React Native (TypeScript, SDK 54)
│   └── backend/         # FastAPI (Python 3.12+, strict mypy)
├── packages/
│   └── shared/          # Shared types/constants
├── supabase/
│   ├── config.toml      # Local Supabase config
│   └── migrations/      # SQL migrations
├── docker-compose.yml   # Backend + worker + Redis
├── justfile             # Task runner
├── SETUP.md             # Full setup instructions
├── ROADMAP.md           # Development roadmap
└── AGENT_CONTEXT.md     # AI agent onboarding context
```

## Quick Start

See [SETUP.md](SETUP.md) for full setup instructions from a fresh clone.

```sh
just db-start           # Start local Supabase
just backend-dev        # Start FastAPI dev server
just mobile-ios         # Build and run on iOS Simulator
```

## Development

```sh
# Backend
just backend-check      # lint + typecheck + test

# Mobile
just mobile-check       # typecheck + lint
```

## Current Status

- **Phase 1 — Authentication** ✅ Complete (6 auth screens, deep linking, session management)
- **Phase 2 — Design System** ✅ Complete (19 UI components, design tokens, custom tab bar, glassmorphism theme)
- **Phase 3 — Journal Entry CRUD** ✅ Complete (124 backend tests, cursor-based pagination, Redis caching)
- **Phase 4 — Core Journaling Features** 🔄 In progress (4A theme system ✅, 4B visual polish 🔄)

See [ROADMAP.md](ROADMAP.md) for the full development plan.
