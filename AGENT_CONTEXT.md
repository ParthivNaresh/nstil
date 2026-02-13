# NStil — Agent Context Document

This document provides onboarding context for any AI agent working on the NStil project. Read this fully before making any changes.

---

## 1. What is NStil?

NStil is a cross-platform reflection/journaling companion. Mobile-first (iOS/Android via Expo), FastAPI backend, Supabase for auth and Postgres, Redis for caching and async jobs.

This project is in active development. Backwards compatibility is not a concern. Every feature must be built production-grade the first time — no POCs, no "good enough" implementations. Think WhatsApp or Discord level quality.

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Mobile | Expo (React Native) | SDK 54, RN 0.81 | TypeScript, file-based routing |
| Routing | expo-router | 6.x | `app/` directory, `Stack` navigator |
| State | Zustand | 5.x | Client state only |
| Server state | TanStack React Query | 5.x | All API-fetched data, 5 min staleTime |
| i18n | i18next + react-i18next | latest | All user-facing strings externalized |
| Animations | react-native-reanimated | 4.x | Spring animations, floating labels |
| Gestures | react-native-gesture-handler | 2.x | Tap gestures for buttons |
| Haptics | expo-haptics | latest | Button press feedback |
| Deep linking | expo-linking | latest | `nstil://` scheme for auth callbacks |
| Backend | FastAPI | 0.115+ | Async everywhere |
| Python | CPython | 3.12+ | Strict mypy |
| Logging | structlog | 25.x | Structured logging, sensitive data scrubbing |
| Auth/DB | Supabase | 2.x | Local dev via CLI, JWT auth, email confirmations |
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

| Path | Purpose |
|------|---------|
| `ROADMAP.md` | Phased development plan with checkboxes |
| `AGENT_CONTEXT.md` | This file |
| `SETUP.md` | Full setup instructions from fresh clone |
| `justfile` | Task runner for all commands |
| `docker-compose.yml` | Backend + worker + Redis |
| `supabase/config.toml` | Local Supabase config (auth, email, DB) |
| `supabase/migrations/` | SQL migrations (Postgres + pgvector + RLS) |
| `packages/shared/` | Placeholder for shared types/constants |

### Backend (`apps/backend/`)

Source lives in `src/nstil/` (hatchling src layout).

| Directory | Purpose |
|-----------|---------|
| `api/` | FastAPI routes — `deps.py` (DI), `middleware.py` (CacheControl), `router.py`, `v1/` (endpoints) |
| `core/` | Domain logic — `security.py` (JWT), `exceptions.py` |
| `models/` | Pydantic models — one file per domain, `__init__.py` re-exports |
| `observability/` | Structured logging — config, middleware, processors, context, constants |
| `services/` | External service wrappers — `redis.py` |
| `workers/` | ARQ background tasks and settings |

Root files: `main.py` (app factory), `config.py` (Pydantic Settings).

Tests in `tests/` mirror the source structure. `factories.py` for JWT token generation, `conftest.py` at each level for fixtures. **39 tests** across 5 test modules.

### Mobile (`apps/mobile/`)

| Directory | Purpose |
|-----------|---------|
| `app/` | expo-router file-based routes — `(auth)/` (6 screens), `(tabs)/` (authenticated) |
| `components/ui/` | Reusable UI primitives — each in own directory |
| `components/auth/` | Auth-specific shared components |
| `hooks/` | Custom hooks — form logic extracted from screens |
| `lib/` | Utilities — Supabase client, React Query, i18n, validation, error mapping, deep linking |
| `stores/` | Zustand stores — `authStore.ts` |
| `services/api/` | API client with typed errors and auto-auth |
| `styles/` | Design tokens — colors, spacing, typography |
| `types/` | Shared TypeScript types — one file per domain |

---

## 4. Commands

All commands run from the repo root via `just`:

```sh
just backend-dev          # uvicorn --reload on :8000
just backend-check        # lint + typecheck + test (all three)
just mobile-ios           # expo run:ios
just mobile-check         # typecheck + lint
just db-start             # supabase start (runs migrations)
just db-reset             # reset + re-migrate
```

Direct commands from `apps/backend/`:
```sh
uv run ruff check src tests
uv run mypy src
uv run pytest -v
```

Direct commands from `apps/mobile/`:
```sh
npx tsc --noEmit
npx eslint .
```

---

## 5. Backend Architecture

### App factory (`main.py`)

`create_app()` with async lifespan for Redis pool. Middleware stack (order matters — LIFO):
1. `CORSMiddleware` — restricted origins
2. `RequestLoggingMiddleware` — auto-logs HTTP requests with request ID, duration
3. `CacheControlMiddleware` — `no-store, private` on authenticated responses, skips public paths

### Configuration (`config.py`)

Pydantic Settings reads from `.env`. `SecretStr` for `supabase_service_key` and `supabase_jwt_secret`. `@model_validator` rejects empty secrets at startup.

### Dependency injection (`api/deps.py`)

| Dependency | Returns | Notes |
|-----------|---------|-------|
| `get_settings()` | `Settings` | `@lru_cache(maxsize=1)` singleton |
| `get_redis(request)` | `aioredis.Redis` | From `request.app.state.redis` |
| `get_current_user(credentials, settings)` | `UserPayload` | JWT verification, 401 on failure |

### Auth pipeline

Bearer token → `HTTPBearer` → `verify_jwt` (HS256, audience="authenticated", require sub/exp/aud, 30s leeway) → `UserPayload`. Distinct errors: `TokenExpiredError` → 401 "Token has expired", `InvalidTokenError` → 401 "Invalid token".

### Observability

structlog-based. `scrub_sensitive_data` recursively scrubs dicts/lists/strings matching sensitive keys (`password`, `token`, `jwt_secret`, etc.) or patterns (JWT regex, Supabase key regex). `RequestLoggingMiddleware` generates `X-Request-ID`, logs method/path/status/duration, warning for 4xx, error for 5xx.

### Patterns to follow

- Imports: `from nstil.xxx import yyy`
- DI: all external resources via `Depends()`, never global imports in endpoints
- Async: all route handlers, Redis calls, services
- Exceptions: domain exceptions in `core/exceptions.py`, HTTP translation in `api/deps.py`
- Models: one file per domain in `models/`, re-export from `__init__.py`
- Endpoints: one file per feature in `api/v1/`, registered in `api/router.py`
- Type annotations: required on all function signatures (mypy strict)
- Settings: always via `Depends(get_settings)`, `.get_secret_value()` for SecretStr
- Logging: `from nstil.observability import get_logger`, no `print()`

---

## 6. Mobile Architecture

### Auth flow

6 screens in `app/(auth)/`: welcome, sign-in, sign-up, verify-email, forgot-password, reset-password. Redirect logic in `app/index.tsx`: no session → auth, recovery session → reset-password, unverified → verify-email, verified → tabs.

### Deep linking

`lib/deepLink.ts` handles `nstil://` scheme. Parses access/refresh tokens from URL fragment, detects `type` param (signup vs recovery), sets `pendingDeepLinkType` in auth store. Listener wired in root layout with cleanup.

### Auth store (`stores/authStore.ts`)

Zustand store with event-aware `onAuthStateChange`. `SIGNED_OUT` event clears all caches. `isEmailVerified` derived from `email_confirmed_at`. `pendingDeepLinkType` drives recovery flow routing.

### API client (`services/api/client.ts`)

`apiFetch<T>()` auto-injects Bearer token. Throws `NoSessionError` if no session, `ApiError` with typed status on failure, auto-signs-out on 401.

### Patterns to follow

- i18n: all user-facing strings via `t()`, never hardcoded
- Components: each in own directory with `index.ts`, `types.ts`, implementation files
- Hooks: form logic extracted into custom hooks, screens are thin
- Styles: `StyleSheet.create()` at bottom, use design tokens from `@/styles`
- Types: shared in `types/`, component-specific in component's `types.ts`
- Validation: pure functions in `lib/validation/`, composed into form validators
- Error handling: Supabase errors mapped to i18n keys, generic messages only
- Navigation: `router.replace()` for auth transitions (no back gesture)

### Design system

Dark glassmorphism theme with comprehensive design tokens in `styles/`:

| Token file | Contents |
|-----------|----------|
| `colors.ts` | Background, surface, glass, text, accent, semantic colors with muted variants |
| `spacing.ts` | 8pt grid: xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48, 3xl=64 |
| `typography.ts` | Typed `TypographyScale` with `TypographyVariant` — h1, h2, h3, body, bodySmall, caption, label |
| `radius.ts` | Border radius scale: xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, full=9999 |
| `animation.ts` | Duration tokens (instant/fast/normal/slow), spring easing presets |
| `opacity.ts` | Opacity scale: disabled=0.5, muted=0.4, subtle=0.7, full=1 |
| `theme.ts` | Aggregated `theme` object with `Theme` type |

### UI Component Library (18 components in `components/ui/`)

Each component lives in its own directory with `index.ts`, `types.ts`, and implementation files.

| Component | Purpose |
|-----------|---------|
| `AppText` | Variant-driven text (`variant`, `color`, `align` props) — use instead of raw `Text` |
| `Icon` | Typed Lucide wrapper with `IconSize` enum |
| `Button` | Spring animation + haptics, primary/secondary/ghost variants |
| `TextInput` | Floating label, secure toggle, error state |
| `TextArea` | Multi-line, auto-growing, character/word count |
| `Card` | Pressable glass/elevated variants, header/footer slots, chevron |
| `SearchInput` | Search icon, clear button, debounced `onSearch` |
| `DatePicker` | Styled trigger + native picker, date/time/datetime modes |
| `MoodSelector` | 5-mood emoji picker with spring animation |
| `Avatar` | Initials-based, 4 sizes |
| `Badge` | Count or dot mode, positioned overlay |
| `EmptyState` | Icon + title + subtitle + optional CTA |
| `Skeleton` | Pulse animation, text/circle/rect shapes |
| `ScreenContainer` | SafeArea + keyboard avoidance + dark background (auth screens) |
| `ScrollContainer` | Pull-to-refresh, keyboard avoidance (content screens) |
| `Header` | Blur background, back button, right action slot |
| `TabBar` | Custom glassmorphism tab bar with icons and badges |
| `Divider` | Configurable horizontal rule |

---

## 7. Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase API URL |
| `SUPABASE_SERVICE_KEY` | Service role key (SecretStr, validated non-empty) |
| `SUPABASE_JWT_SECRET` | JWT signing secret (SecretStr, validated non-empty) |
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

Get keys via `supabase status` after `just db-start`.

---

## 8. Supabase Configuration

`supabase/config.toml` configures the local Supabase instance:
- `site_url = "nstil://"` — deep link scheme for auth callbacks
- `enable_confirmations = true` — email verification required
- `minimum_password_length = 8`, `password_requirements = "lower_upper_letters_digits"`
- `jwt_expiry = 3600` (1 hour), refresh token rotation enabled
- Inbucket/Mailpit at `localhost:54324` for local email testing

---

## 9. Testing

### Philosophy

- Tests prove the system works under real conditions
- No mocking external services in integration tests
- Mocks acceptable only for unit tests of pure logic
- Test directory mirrors source structure

### Current: 39 tests (all passing)

| Module | Tests | Type |
|--------|-------|------|
| `core/test_security.py` | 10 | Unit — JWT verification paths |
| `core/test_config.py` | 5 | Unit — Settings validation |
| `api/v1/test_auth.py` | 5 | Integration — auth dependency via HTTP |
| `api/v1/test_cache_control.py` | 2 | Integration — cache headers |
| `api/v1/test_health.py` | 1 | Integration — health endpoint |
| `observability/test_processors.py` | 16 | Unit — sensitive data scrubbing |

### Verification (run before any work is considered complete)

```sh
cd apps/backend && uv run ruff check src tests && uv run mypy src && uv run pytest -v
cd apps/mobile && npx tsc --noEmit && npx eslint .
```

---

## 10. Known Gotchas

### Backend
- `redis.asyncio.from_url` is untyped — needs `# type: ignore[no-untyped-call]`
- `python-jose` has no type stubs — needs `# type: ignore[import-untyped]`
- mypy is strict — every function needs return types, no implicit `Any`
- `workers/settings.py` instantiates `Settings()` at import time — requires all env vars

### Mobile
- `npm install` requires `--legacy-peer-deps` due to expo-router peer conflict
- `npx expo install` does NOT respect `.npmrc` — use `npm install --legacy-peer-deps`
- Reanimated 4.x requires `react-native-worklets` as a peer dependency
- ESLint pinned to v8 — `eslint-config-expo@10` incompatible with v9+
- Root layout must use `Stack` (not `Slot`) for `Redirect` to work
- `GestureHandlerRootView` requires `style={{ flex: 1 }}`
- After native dependency changes, run `just mobile-rebuild-ios`
- Email verification links must be opened in Simulator Safari (not desktop browser) — use `xcrun simctl openurl booted "<url>"`

---

## 11. Current Progress

### Phase 1 — Authentication ✅ Complete
- Backend: JWT verification, typed models, custom exceptions, secrets management, structured logging, cache-control middleware, 39 tests
- Mobile: 6 auth screens (welcome, sign-in, sign-up, verify-email, forgot-password, reset-password), deep linking, event-aware auth store, SecureStore token persistence, API client with typed errors and 401 auto-sign-out
- Security: generic error messages, no user enumeration, server-side password enforcement, sensitive data scrubbing, CORS restricted

### Phase 2 — Design System & Core UI Components ✅ Complete
- Design tokens: typed typography, radius, animation, opacity scales + aggregated theme object
- 18 UI components: AppText, Icon, Button, TextInput, TextArea, Card, SearchInput, DatePicker, MoodSelector, Avatar, Badge, EmptyState, Skeleton, ScreenContainer, ScrollContainer, Header, TabBar, Divider
- App shell: 3-tab layout (Journal, Insights, Settings) with custom glassmorphism tab bar
- Auth screens migrated from GlassCard to Card + AppText (GlassCard removed)
- Dependency added: `@react-native-community/datetimepicker`

### Phase 3 — Journal Entry CRUD (next)
### Phase 4 — AI Integration (Embeddings & Insights)
### Phase 5 — Notifications & Reminders
### Phase 6 — Production Deployment & Observability

See `ROADMAP.md` for detailed objectives and checkboxes.

---

## 12. What NOT to Do

- Don't import Settings directly in endpoints — use DI
- Don't put exceptions in the same file as business logic
- Don't mock external services in integration tests
- Don't skip mypy or ruff checks
- Don't use `pip` or `poetry` — use `uv`
- Don't use ESLint v9+ on mobile
- Don't hardcode user-facing strings — use i18n
- Don't put form logic in screen components — extract to hooks
- Don't use `console.log` or `print()` — remove before committing
- Don't add `any` casts or `@ts-ignore` — fix the types properly
