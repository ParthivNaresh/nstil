# Repository Guidelines

## Project Structure & Module Organization

- **Monorepo root:** tooling and infra live at the repo root (e.g. `justfile`, `docker-compose.yml`, `supabase/`, `docs/`).
- **Backend (FastAPI):** `apps/backend/` (Python/uv). Source uses a src-layout at `apps/backend/src/nstil/`; tests live in `apps/backend/tests/` and generally mirror the `src/nstil/` module structure.
- **Mobile (Expo / React Native):** `apps/mobile/` (TypeScript). Routing is file-based via `apps/mobile/app/`; reusable UI and feature components live in `apps/mobile/components/`, hooks in `apps/mobile/hooks/`, and shared utilities in `apps/mobile/lib/`.
- **Database & local infra:** Supabase config/migrations in `supabase/`; Redis and backend containers in `docker-compose.yml`.

## Build, Test, and Development Commands

All commands are intended to be run from the repo root via `justfile`:

```bash
# Start infra (Redis + local Supabase) and run backend dev server
just dev

# Infrastructure only (Supabase + Redis)
just infra-up
just infra-down
just infra-status

# Backend
just backend-install
just backend-dev
just backend-check          # ruff format --check + ruff check + mypy + pytest

# Mobile
just mobile-install
just mobile-check           # tsc --noEmit + eslint
just mobile-ios

# Docs (MkDocs)
just docs-serve
just docs-build
```

## Coding Style & Naming Conventions

- **Python:** formatted/linted with **ruff** (`apps/backend/pyproject.toml`), line length **99**. Type checking is **mypy strict**. Prefer typed dicts like `dict[str, object]` (see `docs/contributing/conventions.md`).
- **TypeScript:** `apps/mobile/tsconfig.json` is **strict**. ESLint extends `expo` (`apps/mobile/.eslintrc.js`).
- **Project conventions:** see `docs/contributing/conventions.md` (e.g., “no comments in code”, no `any`/`@ts-ignore`, user-facing strings via i18next `t()`, route files in `apps/mobile/app/` should stay thin).
- **Naming:** tests use `test_<module>.py` (see `apps/backend/tests/README.md`).

## Testing Guidelines

- **Framework:** `pytest` (+ `pytest-asyncio`, `pytest-cov`) configured in `apps/backend/pyproject.toml`.
- **Tests live in:** `apps/backend/tests/` and mirror `src/nstil/`.
- **Run tests:** `just backend-test` or the full suite `just backend-check`.

## Commit & Pull Request Guidelines

- **Commit messages:** recent history shows short, imperative/sentence-style messages (e.g. `added rate limiting`, `AI Intelligence Layer complete`). There is no enforced Conventional Commits rule visible in-repo.
- **PRs:** the git history includes merge commits like `Merge pull request #<n> from <branch>`.
- **Branches:** observed branch names include underscores (e.g. `core_journaling`, `ai_implementation`, `push_notifications`).

---

# Repository Tour

## 🎯 What This Repository Does

NStil is a cross-platform reflection/journaling companion with a mobile-first Expo app, a FastAPI backend, and a Supabase (Postgres/Auth/Storage) data layer, with Redis used for caching. A key design goal is **privacy-first AI**: on-device inference via Apple Foundation Models, with the backend providing structured context.

**Key responsibilities:**
- Provide a journaling UI (entries, journals/spaces, calendar, media attachments, insights) in `apps/mobile/`.
- Serve a REST API for journaling + AI context/orchestration in `apps/backend/`.
- Manage schema/migrations and local dev infrastructure via `supabase/` and `docker-compose.yml`.

---

## 🏗️ Architecture Overview

### System Context

```text
User
  └─▶ Mobile app (apps/mobile, Expo RN)
        ├─▶ On-device AI (Apple Foundation Models via modules/nstil-ai)
        └─▶ Backend API (apps/backend, FastAPI)
              ├─▶ Supabase (Postgres/Auth/Storage)
              └─▶ Redis (cache + rate limiting)
```

### Key Components

- **Mobile app (`apps/mobile/`)** — Expo Router screens in `app/`, reusable components in `components/`, data fetching and feature logic in `hooks/` and `services/api/`.
- **Backend API (`apps/backend/src/nstil/`)** — FastAPI app factory (`main.py`), API routers (`api/router.py`, `api/v1/*`), dependency injection (`api/deps.py`), and domain services (`services/`).
- **Supabase layer (`supabase/`)** — local config (`supabase/config.toml`) and SQL migrations (`supabase/migrations/`).
- **Caching + rate limiting (Redis)** — Redis pool is created on startup (`services/redis.py`); cache wrappers live under `services/cache/` and `services/cached_*.py`; request rate limiting is enforced via ASGI middleware (`api/rate_limit_middleware.py`) backed by Redis sorted sets + Lua (`services/rate_limit.py`).

### Data Flow (backend request)

1. **Request enters FastAPI** via `nstil.main:create_app()` and routes under `/api/v1` (`apps/backend/src/nstil/api/router.py`).
2. **Middleware runs**: cache-control headers for non-public paths (`api/middleware.py`), optional rate limiting (`api/rate_limit_middleware.py`), and request logging (`observability/middleware.py`, wired in `main.py`).
3. **Dependency injection** constructs per-request services (`api/deps.py`), including Supabase/Redis clients stored on `app.state.app` (`core/app_state.py`).
4. **Service layer** talks to Supabase (e.g., `services/journal.py`, `services/profile.py`) and caches results via cached wrappers (e.g., `services/cached_journal.py`).
5. **Response** is returned with `Cache-Control: no-store, private` on non-public endpoints.

---

## 📁 Project Structure [Partial Directory Tree]

```text
nstil/
├── apps/
│   ├── backend/
│   │   ├── pyproject.toml        # Backend deps + ruff/mypy/pytest config
│   │   ├── src/nstil/            # FastAPI application (src layout)
│   │   └── tests/                # pytest suite (mirrors src/nstil)
│   └── mobile/
│       ├── package.json          # Expo app deps + scripts
│       ├── app/                  # expo-router routes
│       ├── components/           # UI + feature components
│       ├── hooks/                # screen/business logic
│       ├── lib/                  # utilities (incl. i18n + AI helpers)
│       └── modules/nstil-ai/      # Swift native module for Foundation Models
├── supabase/
│   ├── config.toml               # Local Supabase config (ports, auth redirects)
│   └── migrations/               # SQL migrations
├── docs/                         # MkDocs source
├── docker-compose.yml            # backend + worker + redis
├── justfile                      # canonical dev/test commands
├── mkdocs.yml                    # docs site config
├── SETUP.md                      # end-to-end local setup
└── AGENT_CONTEXT.md              # deeper architectural notes + strict conventions
```

### Key Files to Know

| File | Purpose | When You'd Touch It |
|------|---------|---------------------|
| `justfile` | Canonical dev/test commands | Adding/changing workflows or CI parity |
| `docker-compose.yml` | Redis + backend/worker containers | Adjusting local infra or ports |
| `apps/backend/src/nstil/main.py` | FastAPI app factory + middleware wiring | Adding global middleware, startup resources |
| `apps/backend/src/nstil/api/deps.py` | Dependency injection for services | Introducing new services / caching wrappers |
| `apps/backend/src/nstil/api/v1/*` | API endpoints (v1) | Adding/adjusting REST routes |
| `apps/backend/pyproject.toml` | Backend deps + ruff/mypy/pytest config | Dependency updates, lint/type rules |
| `apps/mobile/app/` | Route components (Expo Router) | New screens/routes (keep thin) |
| `apps/mobile/components/` | Reusable UI + features | Building UI without route coupling |
| `supabase/config.toml` | Local Supabase auth/ports/settings | Changing redirect URLs, local auth behavior |
| `SETUP.md` | Setup + environment instructions | Updating onboarding steps |

---

## 🔧 Technology Stack

### Core Technologies
- **Mobile:** Expo (`apps/mobile/package.json`), React 19.1.0, React Native 0.81.5, TypeScript (strict).
- **Backend:** Python **3.12+** (`apps/backend/pyproject.toml`), FastAPI `>=0.115`, Uvicorn `>=0.34`.
- **Database/Auth/Storage:** Supabase (`supabase/config.toml`), with Postgres (local `major_version = 17`).
- **Cache / rate limiting:** Redis (Docker image `redis:7-alpine` in `docker-compose.yml`).

### Key Libraries
- **Backend:** `supabase` async client, `redis` asyncio client, `PyJWT[crypto]` for JWT verification (JWKS + HS256 fallback), `structlog` for structured logging.
- **Mobile:** `expo-router`, Zustand, `@tanstack/react-query`, `i18next`/`react-i18next`, `@shopify/react-native-skia`.

### Development Tools
- **Task runner:** `just` (root `justfile`).
- **Python tooling:** `uv` for dependency management and running commands (`apps/backend/uv.lock`, `just backend-install`).
- **Lint/format:** `ruff` (format + lint) for backend; ESLint (`eslint-config-expo`) for mobile.
- **Type checking:** mypy (strict) for backend; `tsc --noEmit` for mobile.
- **Docs:** MkDocs Material (`mkdocs.yml`, served/built via `just docs-*`).

---

## 🌐 External Dependencies

### Required Services
- **Supabase** — auth + Postgres + storage. Local dev uses Supabase CLI (`just infra-up`) and config in `supabase/config.toml`.
- **Redis** — caching and rate limiting (see `docker-compose.yml`, `services/rate_limit.py`).

### Environment Variables (verified)

From `SETUP.md` and backend settings (`apps/backend/src/nstil/config.py`):

```bash
# Backend (apps/backend/.env)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=...
SUPABASE_JWT_SECRET=...
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=["http://localhost:8081"]
DEBUG=true
RATE_LIMIT_ENABLED=true

# Mobile (apps/mobile/.env)
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔄 Common Workflows

### Local development (infra + backend)
1. Create env files: `cp apps/backend/.env.example apps/backend/.env` and `cp apps/mobile/.env.example apps/mobile/.env`.
2. Start infrastructure: `just infra-up` (starts Redis + local Supabase and applies migrations).
3. Run backend: `just backend-dev` (Uvicorn factory at port 8000).

### Backend change verification
- Run `just backend-check` to ensure `ruff format --check`, `ruff check`, `mypy`, and `pytest` all pass.

---

## 🚨 Things to Be Careful About

### 🔒 Security Considerations (as implemented)
- **JWT verification:** `apps/backend/src/nstil/core/security.py` verifies audience and expiry, prefers ES* via JWKS (`core/jwks.py`) and falls back to HS256 secret.
- **Sensitive responses:** `CacheControlMiddleware` sets `Cache-Control: no-store, private` for non-public endpoints.
- **Rate limiting:** `RateLimitMiddleware` can be disabled via `RATE_LIMIT_ENABLED` (`config.py`). It is **fail-open** if Redis is unavailable (`services/rate_limit.py`).


*Update to last commit: bb89ea0c7b6aed23e7ec3a8eeee646dd9397ce7c*
