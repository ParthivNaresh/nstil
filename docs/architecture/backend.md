# Backend Architecture

The backend is a FastAPI application in `apps/backend/src/nstil/` using the hatchling src layout.

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `api/` | FastAPI routes — `deps.py` (DI with 10 AI factories), `middleware.py`, `router.py`, `v1/` (endpoints) |
| `core/` | Domain logic — `security.py` (JWT via PyJWT), `jwks.py` (JWKS key store), `app_state.py` (typed app state), `exceptions.py` |
| `models/` | Pydantic models — journal, mood, calendar, media, space, AI models |
| `services/` | Service layer — journal, media, redis, notification, cache services |
| `services/ai/` | AI services — session, prompt, insight, feedback, task, profile, context, embedding, orchestrators |
| `services/ai/prompt_bank/` | 76 curated prompts across 7 categories with mood/topic/intensity filtering |
| `cache/` | Redis cache — `ai_keys.py`, `ai_cache.py`, cached wrappers |
| `observability/` | Structured logging — config, middleware, processors, context |
| `workers/` | ARQ background tasks and settings |

## Key Patterns

### App Factory

`main.py` exposes `create_app()` with an async lifespan that manages the Redis connection pool.

### Dependency Injection

All external resources are injected via FastAPI's `Depends()`:

- `get_settings()` — application configuration
- `get_redis()` — Redis connection from the pool
- `get_current_user()` — authenticated user from JWT
- 10 AI service factories for session, prompt, insight, feedback, task, profile, context, embedding, check-in, and insight engine

### Model Conventions

Pydantic models follow a consistent pattern per domain:

- `Row` — database row representation
- `Create` — input for creation (with `to_update_dict()` for Supabase)
- `Update` — partial update input
- `Response` — API response (with `from_row()` class method)

### Service Layer

- `JournalService` — direct Supabase queries
- `CachedJournalService` — Redis cache-first wrapper
- `MediaService` — storage bucket operations + signed URLs
- AI services follow the same cache-first pattern

### Observability

structlog with sensitive data scrubbing, request logging middleware, and tagged context propagation.

### AI Orchestration

- **PromptEngine** — context-aware prompt selection from the curated bank
- **CheckInOrchestrator** — multi-step check-in flow management
- **InsightEngine** — streak, milestone, weekly summary, and mood anomaly computation

## Authentication

Bearer JWT → `verify_jwt` (HS256/ES256) → `UserPayload`. Raises `TokenExpiredError` or `InvalidTokenError`. The backend fetches JWKS from Supabase on startup for ES256 verification.

## Testing

627 tests covering models, API endpoints, cache layer, validators, AI services, check-in flow, insights, and prompts.

```sh
just backend-check    # lint + typecheck + test
just backend-test     # tests only
```
