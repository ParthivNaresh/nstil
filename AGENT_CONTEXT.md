# NStil — Agent Context Document

This document provides a comprehensive onboarding context for any Claude agent working on the NStil project. Read this fully before making any changes.

---

## 1. What is NStil?

NStil is a cross-platform reflection/journaling companion. Mobile-first (iOS/Android via Expo), FastAPI backend, Supabase for auth and Postgres, Redis for caching and async jobs.
This project is still in development, so backwards compatibility is not necessary.
The project is designed to be modular and extensible, allowing for easy integration of new features and components.
Every aspect of this project should be built with production-grade, gold standard software development in mind the first time around. Never implement something "good enough" as a POC or minimum viable feature. The point is to never have to go back and refactor features that are half implemented.

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Mobile | Expo (React Native) | SDK 54, RN 0.81 | TypeScript, file-based routing |
| Routing | expo-router | 6.x | `app/` directory = router, uses `Stack` navigator |
| State | Zustand | 5.x | Client state only |
| Server state | TanStack React Query | 5.x | All API-fetched data |
| i18n | i18next + react-i18next | latest | All user-facing strings externalized |
| Animations | react-native-reanimated | 4.x | Spring animations, floating labels |
| Gestures | react-native-gesture-handler | 2.x | Tap gestures for buttons |
| Haptics | expo-haptics | latest | Button press feedback |
| Backend | FastAPI | 0.115+ | Async everywhere |
| Python | CPython | 3.12+ | Strict mypy |
| Logging | structlog | 25.x | Structured logging, sensitive data scrubbing |
| Auth/DB | Supabase | 2.x | Client + self-hosted, JWT auth |
| Cache/Queue | Redis + ARQ | Redis 7, ARQ 0.26+ | Async Redis, background workers |
| Styling | Custom design tokens | — | Dark glassmorphism theme |
| Package manager (Python) | uv | latest | NOT pip/poetry |
| Task runner | just | — | All commands via `just <command>` |
| Linter (Python) | ruff | 0.9+ | Lint + format |
| Type checker (Python) | mypy | 1.14+ | Strict mode, pydantic plugin |
| Linter (Mobile) | ESLint v8 | — | Pinned v8 (expo config incompatible with v9+) |

---

## 3. Repository Structure

### Top level

- `ROADMAP.md` — phased development plan with checkboxes
- `AGENT_CONTEXT.md` — this file
- `justfile` — task runner for all commands
- `docker-compose.yml` — backend + worker + redis
- `supabase/migrations/` — SQL migrations (Postgres + pgvector + RLS)
- `packages/shared/` — placeholder for shared types/constants

### Backend (`apps/backend/`)

Source lives in `src/nstil/` (hatchling src layout). Key directories:

| Directory | Purpose |
|-----------|---------|
| `api/` | FastAPI routes — `deps.py` (DI), `router.py` (mount point), `v1/` (endpoint modules) |
| `core/` | Domain logic — `security.py` (JWT verification), `exceptions.py` (custom errors) |
| `models/` | Pydantic models — one file per domain, `__init__.py` re-exports |
| `observability/` | Structured logging — config, middleware, processors, context, constants |
| `services/` | External service wrappers — `redis.py` |
| `workers/` | ARQ background tasks and settings |

Root files: `main.py` (app factory), `config.py` (Pydantic Settings).

Tests in `tests/` mirror the source structure. `factories.py` for JWT token generation, `conftest.py` at each level for fixtures.

### Mobile (`apps/mobile/`)

| Directory | Purpose |
|-----------|---------|
| `app/` | expo-router file-based routes — `(auth)/` (unauthenticated), `(tabs)/` (authenticated) |
| `components/ui/` | Reusable UI primitives — each in own directory with `index.ts`, `types.ts`, implementation files |
| `components/auth/` | Auth-specific shared components with `types.ts` |
| `hooks/` | Custom hooks — form logic extracted from screens |
| `lib/` | Utilities — Supabase client, React Query client, i18n setup, validation, error mapping |
| `lib/i18n/locales/` | Translation files — all user-facing strings externalized here |
| `lib/validation/` | Pure validation functions and form validators |
| `stores/` | Zustand stores — `authStore.ts` |
| `services/api/` | API client — `apiFetch<T>` with auto Bearer token |
| `styles/` | Design tokens — colors, spacing, typography |
| `types/` | Shared TypeScript types — one file per domain |

---

## 4. Commands

All commands run from the repo root via `just`:

```sh
# Setup
just install              # install all deps (backend + mobile)
just backend-install      # uv sync --dev
just mobile-install       # npm install --legacy-peer-deps

# Backend
just backend-dev          # uvicorn --reload on :8000
just backend-lint         # ruff check src tests
just backend-format       # ruff format src tests
just backend-typecheck    # mypy strict
just backend-test         # pytest -v
just backend-check        # lint + typecheck + test (all three)

# Mobile
just mobile-dev           # expo start
just mobile-ios           # expo run:ios (build + Metro)
just mobile-android       # expo run:android
just mobile-rebuild-ios   # clean prebuild + pod install + run:ios
just mobile-rebuild-android # clean prebuild + run:android
just mobile-lint          # eslint
just mobile-typecheck     # tsc --noEmit
just mobile-check         # typecheck + lint

# Database
just db-start             # supabase start (runs migrations)
just db-stop              # supabase stop
just db-reset             # reset + re-migrate
just db-migration <name>  # create new migration

# Docker
just up / just down / just build
```

**Direct commands** (when working from `apps/backend/`):

```sh
cd apps/backend
uv run ruff check src tests          # lint
uv run ruff format src tests         # format
uv run mypy src                      # typecheck (strict, 25 source files)
uv run pytest -v                     # tests (16 tests currently)
```

---

## 5. Backend Architecture

### App factory pattern

`main.py` uses `create_app()` with an async lifespan that creates/destroys the Redis connection pool. Structured logging is configured at app creation, and `RequestLoggingMiddleware` is added for automatic HTTP request/response logging:

```python
def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(log_level=settings.log_level, log_format=settings.log_format)
    application = FastAPI(...)
    application.add_middleware(CORSMiddleware, ...)
    application.add_middleware(RequestLoggingMiddleware)
    application.include_router(api_router)
    return application
```

### Configuration (`config.py`)

- Pydantic Settings reads from `.env`
- `supabase_service_key` and `supabase_jwt_secret` are `SecretStr` — auto-masked in repr/logs
- `log_level` (default `"INFO"`) and `log_format` (default `"console"`, or `"json"` for production)
- `@model_validator(mode="after")` rejects empty secrets at startup (fail fast)
- Secrets are accessed via `.get_secret_value()` at point of use

### Dependency injection (`api/deps.py`)

Three injectable dependencies:

| Dependency | Returns | How |
|-----------|---------|-----|
| `get_settings()` | `Settings` | `@lru_cache(maxsize=1)` singleton |
| `get_redis(request)` | `aioredis.Redis` | From `request.app.state.redis` |
| `get_current_user(credentials, settings)` | `UserPayload` | Verifies JWT Bearer token |

All are injected via `Depends()` — never imported directly in endpoint handlers.

### Auth pipeline

```
Bearer token
  → HTTPBearer extracts credentials (401 if missing)
  → get_current_user calls verify_jwt
    → jwt.decode with HS256, audience="authenticated", require sub/exp/aud, 30s leeway
    → ExpiredSignatureError → TokenExpiredError → 401 "Token has expired"
    → JWTError → InvalidTokenError → 401 "Invalid token"
    → Pydantic validates payload → UserPayload
    → ValidationError (e.g., missing role) → InvalidTokenError → 401 "Invalid token"
  → Returns UserPayload to endpoint handler
```

### Observability (`observability/`)

Structured logging via `structlog`, configured in `main.py` at app creation:

- **`config.py`** — `LoggingConfig` dataclass configures structlog + stdlib logging. Supports `"console"` (colored dev output) and `"json"` (production) formats. Silences noisy third-party loggers. Installs uncaught exception handler.
- **`processors.py`** — `scrub_sensitive_data` recursively scrubs dicts/lists/strings matching sensitive keys or JWT patterns. `add_service_info` stamps service name/version on every log line.
- **`constants.py`** — `SENSITIVE_KEYS` (frozenset of key names like `password`, `token`, `jwt_secret`), `SENSITIVE_PATTERNS` (regex for JWTs, Supabase keys), `THIRD_PARTY_LOGGERS` to silence.
- **`context.py`** — `bind_context()` / `clear_context()` wrappers around structlog contextvars for request-scoped context.
- **`logger.py`** — `get_logger(name)` factory. Use `from nstil.observability import get_logger`.
- **`middleware.py`** — `RequestLoggingMiddleware` auto-logs every HTTP request with request ID, method, path, status, duration. Skips health/metrics paths. Generates `X-Request-ID` header. Uses warning level for 4xx, error for 5xx.

Usage:
```python
from nstil.observability import get_logger
logger = get_logger("my_module")
logger.info("something.happened", key="value")
```

### Exceptions (`core/exceptions.py`)

Two custom exceptions, separated from business logic:

```python
class TokenExpiredError(Exception): pass
class InvalidTokenError(Exception): pass
```

### Models (`models/`)

- Each domain gets its own file: `models/auth.py`, (future: `models/journal.py`, etc.)
- `models/__init__.py` re-exports all public models for convenient imports: `from nstil.models import UserPayload`
- `UserPayload` uses `extra="ignore"` because Supabase tokens contain claims beyond what we model
- `sub` is `str` (not UUID) — Supabase sends it as string, downstream code uses it as string for DB queries

### Routing (`api/router.py`)

Versioned sub-routers. Each endpoint module gets its own file in `api/v1/`. To add a new endpoint: create `api/v1/my_feature.py` with a `router = APIRouter()`, then `v1_router.include_router(my_feature.router)` in `router.py`.

### Services

- **`services/redis.py`** — `create_redis_pool(url)` / `close_redis_pool(pool)`. Minimal wrapper; pool management is in the lifespan.

### Workers

- **`workers/tasks.py`** — `placeholder_task`. All ARQ background tasks go here.
- **`workers/settings.py`** — `WorkerSettings` class consumed by `arq`. Instantiates `Settings()` at import time (workers need full config).

### Docker

Multi-stage Dockerfile: `uv` builder → slim Python runtime. `docker-compose.yml` runs backend, worker, and Redis.

---

## 6. Mobile Architecture

### Root layout (`app/_layout.tsx`)

The root layout wraps the entire app in:
1. `GestureHandlerRootView` (with `flex: 1`) — required for gesture-based button animations
2. `SafeAreaProvider` — provides safe area insets to all `SafeAreaView` descendants
3. `QueryClientProvider` — React Query context
4. `Stack` navigator (not `Slot`) — expo-router requires `Stack` for `Redirect` to work

Auth initialization happens in a `useEffect` with try/catch resilience — if Supabase is unreachable, the app still renders auth screens (null session). The splash screen is hidden after initialization completes (success or failure).

i18n is initialized via a side-effect import: `import "@/lib/i18n"` at the top of the root layout.

### Routing

expo-router with file-based routing. Two route groups:
- `(auth)/` — unauthenticated screens: welcome, sign-in, sign-up
- `(tabs)/` — authenticated tab navigator with placeholder home screen

`app/index.tsx` uses `Redirect` to route based on session state. After sign-in/sign-up, hooks call `router.replace("/(tabs)")` for programmatic navigation.

### State management

- **Client state**: Zustand store at `stores/authStore.ts`
- **Server state**: TanStack React Query for API-fetched data
- **Auth source of truth**: Supabase client (SecureStore adapter for token persistence)

The auth store manages a single `onAuthStateChange` subscription, cleaning up any previous subscription on re-initialization to prevent listener leaks.

### i18n

All user-facing strings are externalized in `lib/i18n/locales/en.ts`. No hardcoded strings in components or screens. The locale file is organized by feature namespace: `common`, `home`, `auth` (with sub-namespaces for `welcome`, `signIn`, `signUp`, `validation`, `errors`).

### Validation

Pure validation functions in `lib/validation/rules.ts` (email regex, password strength checks). Composed into form validators in `lib/validation/authValidation.ts` that return arrays of `ValidationError` objects with field names and i18n-translated messages.

### Error handling

`lib/authErrors.ts` maps Supabase `AuthError` codes to i18n keys. Network errors are detected separately. All error messages are generic — no user enumeration (no "email not found" vs "wrong password").

### Hooks

Form hooks (`useSignInForm`, `useSignUpForm`) encapsulate all form state, validation, submission, error mapping, and navigation. Screen components are thin — they render UI and delegate logic to hooks.

`useFormField` is a reusable primitive for single-field state (value, error, onChange, reset).

### UI Components

All UI primitives live in `components/ui/` with each component in its own directory:

- **`ScreenContainer`** — SafeAreaView + KeyboardAvoidingView + dark background, optional scroll and centering
- **`GlassCard`** — glassmorphism container using design tokens
- **`TextInput`** — split into `FloatingLabel` (Reanimated animated label), `SecureToggle` (eye icon with i18n labels), `ErrorMessage`, and the main `TextInput` component
- **`Button`** — Reanimated spring press animation + haptic feedback via Gesture Handler, variant styles (primary/secondary/ghost), loading spinner, disabled state

Auth-specific shared components live in `components/auth/` with a `types.ts` for shared interfaces.

### API calls

`apiFetch<T>()` from `services/api/client.ts` auto-injects Bearer token from Supabase session.

### Design system

Dark glassmorphism theme with design tokens in `styles/`:
- Background: `#0A0A0F`, Surface: `#12121A`, Elevated: `#1A1A24`
- Accent: `#7C5CFC` (purple)
- Glass: `rgba(255, 255, 255, 0.05)` fill, `rgba(255, 255, 255, 0.08)` border
- Semantic colors with muted variants: `error`/`errorMuted`, `success`/`successMuted`, `warning`/`warningMuted`
- Spacing: 8pt grid (xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48, 3xl=64)
- All text: white/white-alpha on dark backgrounds

---

## 7. Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase API URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (SecretStr, validated non-empty at startup) |
| `SUPABASE_JWT_SECRET` | Secret for verifying Supabase JWTs (SecretStr, validated non-empty at startup) |
| `REDIS_URL` | Redis connection string |
| `CORS_ORIGINS` | JSON list of allowed origins |
| `DEBUG` | Enable debug mode |
| `LOG_LEVEL` | Logging level (default: `INFO`) |
| `LOG_FORMAT` | `console` (dev) or `json` (production) |

### Mobile (`apps/mobile/.env`)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `EXPO_PUBLIC_API_URL` | Backend API base URL |

Never commit `.env` files.

---

## 8. Testing

### Philosophy

- Tests prove the system works under **real conditions**
- **No mocking external services** in integration tests — hit real Redis, real Supabase, real Postgres
- Mocks are acceptable ONLY for unit tests of pure logic (e.g., JWT parsing) where no external service is involved
- The current `mock_redis` in API conftest is a **temporary placeholder** until a real Redis test instance is wired up
- Tests must be extensible and scalable — the directory structure mirrors `src/nstil/`

### Current test count: 16 (all passing)

### Directory structure

```
tests/
├── conftest.py            # Root: settings fixture (SecretStr values)
├── factories.py           # JWT token factory (build_jwt_claims, make_token)
├── README.md              # Full testing philosophy & conventions
├── api/                   # Integration tests (HTTP via TestClient)
│   ├── conftest.py        # client + mock_redis fixtures
│   └── v1/
│       ├── test_health.py # 1 test
│       └── test_auth.py   # 5 tests (valid, expired, invalid, missing header, empty bearer)
└── core/                  # Unit tests (no HTTP)
    └── test_security.py   # 10 tests (valid, expired, malformed, empty, missing claims, wrong aud/algo/secret/role)
```

### Factories (`tests/factories.py`)

```python
token = make_token()                        # valid token
token = make_token(exp=0)                   # expired
token = make_token(aud="wrong")             # wrong audience
token = make_token(secret="other")          # wrong signing secret
token = make_token(algorithm="HS384")       # wrong algorithm
```

Default test secret is `"test-secret"`, matching the `settings` fixture.

### Conventions

- Test directory mirrors source: `src/nstil/core/security.py` → `tests/core/test_security.py`
- Test classes: `TestFeatureName` groups related tests
- Use `@pytest.mark.parametrize` for input variations
- Fixtures at narrowest scope (file-level unless shared)
- All `__init__.py` required in test directories
- `pythonpath = [".", "src"]` in pyproject.toml enables `from tests.factories import ...`

### Verification (run before any work is considered complete)

```sh
cd apps/backend
uv run ruff check src tests     # lint — must be clean
uv run mypy src                  # typecheck — must be clean (strict mode)
uv run pytest -v                 # all tests must pass

cd apps/mobile
npx tsc --noEmit                 # typecheck — must be clean
npx eslint .                     # lint — must be clean
```

---

## 9. Known Gotchas

### Backend
- `redis.asyncio.from_url` is untyped — needs `# type: ignore[no-untyped-call]` and `Any` return type
- `python-jose` has no type stubs — needs `# type: ignore[import-untyped]` on import line
- mypy is strict — every function needs return types, no implicit `Any`
- `jose.jwt.encode()` auto-adds `exp` claim — to test missing exp, you must manually craft the JWT (see `test_missing_exp_claim`)
- `workers/settings.py` instantiates `Settings()` at import time — it requires all env vars even when imported transitively

### Mobile
- `npm install` requires `--legacy-peer-deps` (or `.npmrc` sets it) due to expo-router's react-dom peer conflict
- `npx expo install` does NOT respect `.npmrc` — use `npm install --legacy-peer-deps` directly
- Reanimated 4.x requires `react-native-worklets` as a peer dependency
- ESLint pinned to v8 — `eslint-config-expo@10` exports legacy format incompatible with v9+
- Root layout must use `Stack` (not `Slot`) — `Slot` doesn't provide navigation context for `Redirect`
- `GestureHandlerRootView` requires `style={{ flex: 1 }}` or it collapses to zero height
- `SafeAreaProvider` must wrap any component using `SafeAreaView`
- After native dependency changes, run `just mobile-rebuild-ios` (clean prebuild + pod install + run)
- Metro hot reload only works when started via `npx expo run:ios`, not `npx expo start --dev-client` separately

---

## 10. Code Style & Patterns

### Backend patterns to follow

- **Imports**: `from nstil.xxx import yyy` (hatchling src layout)
- **DI**: all external resources via `Depends()`, never global imports in endpoints
- **Async**: all route handlers, Redis calls, and services are async
- **Exceptions**: domain exceptions in `core/exceptions.py`, HTTP translation in `api/deps.py`
- **Models**: one file per domain in `models/`, re-export from `models/__init__.py`
- **Endpoints**: one file per feature in `api/v1/`, registered in `api/router.py`
- **Type annotations**: required on all function signatures (mypy strict)
- **Settings access**: always via `Depends(get_settings)` in endpoints, `.get_secret_value()` for SecretStr fields
- **Logging**: use `from nstil.observability import get_logger`; no `print()` statements

### Mobile patterns to follow

- **i18n**: all user-facing strings via `t()` from `useTranslation()`, never hardcoded
- **Component structure**: each UI component in its own directory with `index.ts`, `types.ts`, and implementation files
- **Hooks**: form logic extracted into custom hooks, screens are thin render-only components
- **Styles**: `StyleSheet.create()` at bottom of file, use design tokens from `@/styles`
- **Types**: shared types in `types/` directory, component-specific types in component's `types.ts`
- **Validation**: pure functions in `lib/validation/`, composed into form validators
- **Error handling**: Supabase errors mapped to i18n keys via `lib/authErrors.ts`, generic messages only
- **Navigation**: `router.replace()` for auth transitions (no back gesture to previous auth state)

### What NOT to do

- Don't import Settings directly in endpoint modules — use DI
- Don't put exceptions in the same file as business logic
- Don't put models in `__init__.py` — create domain-specific files
- Don't mock external services in integration tests
- Don't skip mypy or ruff checks
- Don't use `pip` or `poetry` — use `uv`
- Don't use ESLint v9+ on mobile
- Don't hardcode user-facing strings — use i18n
- Don't put form logic in screen components — extract to hooks
- Don't use `Slot` in root layout — use `Stack`
- Don't use `console.log` for debugging — remove before committing

---

## 11. Current Progress (Roadmap)

### Phase 1 — Authentication

- **1A — Backend auth hardening** ✅ Complete
  - JWT verification hardened (require sub/exp/aud, 30s leeway, typed UserPayload)
  - SecretStr for secrets, startup validation
  - Custom exceptions separated from logic
  - 16 tests across unit and integration
  - Structured logging with sensitive data scrubbing
  - Request logging middleware with request IDs and duration tracking
  - Deferred: rate limiting (API gateway concern), issuer validation, role-based 403s

- **1B — Mobile auth screens** ✅ Complete
  - Welcome, sign-in, sign-up screens with glassmorphism design
  - Reusable UI primitives: ScreenContainer, GlassCard, TextInput (floating label), Button (spring animation + haptics)
  - i18n infrastructure with all strings externalized
  - Client-side validation with password strength rules
  - Generic error messages (no user enumeration)
  - Keyboard handling with field focus chaining
  - Accessibility labels and minimum touch targets

- **1C — Email verification flow** ⬜ Not started
- **1D — Password reset flow** ⬜ Not started
- **1E — Session management hardening** ⬜ Not started
- **1F — Integration testing & auth polish** ⬜ Not started

### Phases 2-6 — Not started
- Phase 2: Design System & Core UI Components
- Phase 3: Journal Entry CRUD
- Phase 4: AI Integration (Embeddings & Insights)
- Phase 5: Notifications & Reminders
- Phase 6: Production Deployment & Observability

---

## 12. Key Files Quick Reference

### Backend (paths relative to `apps/backend/`)

| What | File |
|------|------|
| App config | `src/nstil/config.py` |
| App factory | `src/nstil/main.py` |
| DI / auth | `src/nstil/api/deps.py` |
| JWT verification | `src/nstil/core/security.py` |
| Domain exceptions | `src/nstil/core/exceptions.py` |
| Auth model | `src/nstil/models/auth.py` |
| Model re-exports | `src/nstil/models/__init__.py` |
| Route registration | `src/nstil/api/router.py` |
| Endpoint modules | `src/nstil/api/v1/*.py` |
| Logging setup | `src/nstil/observability/__init__.py` |
| Request middleware | `src/nstil/observability/middleware.py` |
| Sensitive data scrubbing | `src/nstil/observability/processors.py` |
| Test factories | `tests/factories.py` |
| Test fixtures (root) | `tests/conftest.py` |
| Test fixtures (API) | `tests/api/conftest.py` |
| Python config | `pyproject.toml` |

### Mobile (paths relative to `apps/mobile/`)

| What | File |
|------|------|
| Root layout | `app/_layout.tsx` |
| Auth redirect | `app/index.tsx` |
| Auth screens | `app/(auth)/*.tsx` |
| Home screen | `app/(tabs)/index.tsx` |
| Auth store | `stores/authStore.ts` |
| Supabase client | `lib/supabase.ts` |
| i18n config | `lib/i18n/index.ts` |
| English locale | `lib/i18n/locales/en.ts` |
| Validation rules | `lib/validation/rules.ts` |
| Auth validation | `lib/validation/authValidation.ts` |
| Error mapping | `lib/authErrors.ts` |
| UI primitives | `components/ui/` |
| Auth components | `components/auth/` |
| Form hooks | `hooks/useSignInForm.ts`, `hooks/useSignUpForm.ts` |
| Design tokens | `styles/colors.ts`, `styles/spacing.ts`, `styles/typography.ts` |
| Auth types | `types/auth.ts` |
