# Architecture Overview

NStil is a monorepo with three main layers: a mobile client, a backend API, and a Supabase-managed database.

## Project Structure

```
nstil/
├── apps/
│   ├── mobile/              # Expo React Native app
│   │   ├── app/             # File-based routing
│   │   ├── components/      # UI primitives, journal, insights, settings
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities, i18n, validation, AI
│   │   ├── modules/nstil-ai/# Swift native module for Apple Foundation Models
│   │   ├── services/api/    # API client
│   │   ├── stores/          # Zustand stores
│   │   ├── styles/          # Design tokens
│   │   └── types/           # Shared TypeScript interfaces
│   └── backend/             # FastAPI backend
│       └── src/nstil/
│           ├── api/         # Routes, DI, middleware
│           ├── models/      # Pydantic models
│           ├── services/    # Service layer
│           ├── services/ai/ # AI services
│           ├── cache/       # Redis cache layer
│           ├── observability/ # Structured logging
│           └── core/        # Security, exceptions
├── supabase/
│   ├── config.toml          # Local Supabase config
│   └── migrations/          # SQL migrations
├── docs/                    # MkDocs documentation
├── docker-compose.yml       # Backend + worker + Redis
├── justfile                 # Task runner
└── mkdocs.yml               # Documentation config
```

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │────▶│   FastAPI   │────▶│  Supabase   │
│  (Expo RN)  │◀────│  Backend    │◀────│  (Postgres)  │
└──────┬──────┘     └──────┬──────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │    Redis    │
       │            │   (Cache)   │
       │            └─────────────┘
       │
       ▼
┌─────────────┐
│   Apple     │
│ Foundation  │
│   Models    │
│ (On-device) │
└─────────────┘
```

**Mobile → Backend**: REST API over HTTPS. Bearer JWT authentication. All requests go through the FastAPI backend — the mobile client never talks to Supabase directly (except for auth flows via the Supabase JS client).

**Backend → Supabase**: Service-role key for all database operations. Row-Level Security (RLS) policies enforce data isolation at the database level.

**Backend → Redis**: Cache-aside pattern. Read-heavy paths check Redis first, fall back to Supabase, then populate the cache. Pattern-based invalidation on writes.

**Mobile → Foundation Models**: All AI inference runs on-device. The backend provides structured context data; the mobile client feeds it to the local 3B parameter model. No journal content ever reaches a cloud LLM.

## Key Architectural Decisions

### Privacy-first AI

The entire AI layer is designed so that raw journal content never leaves the device. The backend computes aggregated metadata (mood distributions, streak counts, entry summaries) and the on-device model uses this context to generate personalized text.

### Graceful degradation

When Apple Foundation Models are unavailable, the app falls back to a curated prompt bank (76 prompts across 7 categories). The UI is source-agnostic — it doesn't know or care whether a prompt came from an LLM or a static bank.

### Cache-aside with pattern invalidation

Redis TTLs: 5min for entry lists, 60s for search/AI context, 5min for calendar, 10min for AI profile/notification preferences. On writes, related cache keys are invalidated by pattern (e.g., all entries for a user).

### Cursor-based pagination

All list endpoints use cursor-based pagination for O(1) page fetches regardless of dataset size. No offset-based pagination anywhere.
