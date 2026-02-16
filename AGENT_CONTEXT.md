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
| GPU rendering | @shopify/react-native-skia | 2.x | Gradients, mood orbs, ambient background |
| Maps | react-native-maps | latest | Apple Maps on iOS (no API key), Android excluded |
| Location | expo-location | latest | GPS + reverse geocoding |
| Gestures | react-native-gesture-handler | 2.x | Tap gestures for buttons |
| Haptics | expo-haptics | latest | Button press feedback |
| Deep linking | expo-linking | latest | `nstil://` scheme for auth callbacks |
| Backend | FastAPI | 0.115+ | Async everywhere |
| Python | CPython | 3.12+ | Strict mypy |
| Logging | structlog | 25.x | Structured logging, sensitive data scrubbing |
| Auth/DB | Supabase | 2.x | Local dev via CLI, JWT auth, email confirmations |
| Cache/Queue | Redis + ARQ | Redis 7, ARQ 0.26+ | Async Redis, background workers |
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
| `ROADMAP.md` | Phased development plan with checkboxes — **source of truth for progress** |
| `AGENT_CONTEXT.md` | This file |
| `SETUP.md` | Full setup instructions from fresh clone |
| `justfile` | Task runner for all commands |
| `docker-compose.yml` | Backend + worker + Redis |
| `supabase/config.toml` | Local Supabase config (auth, email, DB) |
| `supabase/migrations/` | SQL migrations (8 total: init, search, journals, mood, calendar, media, location) |
| `packages/shared/` | Placeholder for shared types/constants |

### Backend (`apps/backend/`)

Source lives in `src/nstil/` (hatchling src layout).

| Directory | Purpose |
|-----------|---------|
| `api/` | FastAPI routes — `deps.py` (DI), `middleware.py`, `router.py`, `v1/` (endpoints) |
| `core/` | Domain logic — `security.py` (JWT), `exceptions.py` |
| `models/` | Pydantic models — `journal.py`, `mood.py`, `calendar.py`, `media.py`, `space.py` |
| `services/` | Service layer — `journal.py`, `media.py`, `redis.py`, cache services |
| `observability/` | Structured logging — config, middleware, processors, context |
| `workers/` | ARQ background tasks and settings |

### Mobile (`apps/mobile/`)

| Directory | Purpose |
|-----------|---------|
| `app/` | expo-router routes — `(auth)/` (6 screens), `(tabs)/` (4 tabs), `entry/` (create + edit) |
| `components/ui/` | Reusable UI primitives — each in own directory |
| `components/auth/` | Auth-specific shared components |
| `components/journal/` | Journal feature components (EntryForm, EntryCard, Calendar, LocationPicker, etc.) |
| `hooks/` | Custom hooks — form logic, data fetching, theme |
| `lib/` | Utilities — Supabase client, React Query, i18n, validation, location, date formatting |
| `stores/` | Zustand stores — `authStore.ts`, `themeStore.ts` |
| `services/api/` | API client + domain-specific API functions |
| `styles/` | Design tokens — palettes, spacing, typography, radius, animation, opacity |
| `types/` | Shared TypeScript types — `journal.ts`, `calendar.ts`, `auth.ts`, `api.ts` |

---

## 4. Commands

```sh
just backend-dev          # uvicorn --reload on :8000
just backend-check        # lint + typecheck + test (all three)
just mobile-ios           # expo run:ios
just mobile-check         # typecheck + lint
just db-start             # supabase start (runs migrations)
just db-reset             # reset + re-migrate
```

Direct commands:
```sh
cd apps/backend && uv run ruff check src tests && uv run mypy src && uv run pytest -v
cd apps/mobile && npx tsc --noEmit && npx eslint .
```

---

## 5. Backend Architecture

### Key patterns

- **App factory** (`main.py`): `create_app()` with async lifespan for Redis pool
- **DI**: all external resources via `Depends()` — `get_settings()`, `get_redis()`, `get_current_user()`
- **Auth**: Bearer JWT → `verify_jwt` (HS256) → `UserPayload`. `TokenExpiredError` / `InvalidTokenError`
- **Models**: Pydantic models per domain — `Create`, `Update`, `Row`, `Response` pattern. Shared validators (e.g., `validate_mood_pair`, `validate_coordinate_pair`)
- **Services**: `JournalService` (Supabase queries), `CachedJournalService` (Redis cache-first), `MediaService` (storage + signed URLs)
- **Cache**: Redis with pattern-based invalidation. Cache keys include user_id, filters, pagination. TTLs: 5min for lists, 60s for search, 5min for calendar
- **Observability**: structlog with sensitive data scrubbing, request logging middleware

### Database (8 migrations)

1. `001_init` — `journal_entries` table with RLS, search vector, triggers
2. `002_search_rpc` — `search_journal_entries` RPC function
3. `003_journals` — `journals` table, FK on entries, default journal trigger
4. `004_pin` — `is_pinned` column + composite index
5. `005_mood` — `mood_category`/`mood_specific` columns (replaced `mood_score`)
6. `006_calendar_rpc` — `get_calendar_data` RPC with timezone support
7. `007_media` — `entry_media` table + storage bucket
8. `008_location` — `latitude`/`longitude` columns with pair constraints

### Tests: 297 passing

Covers models, API endpoints, cache layer, validators. Run `uv run pytest -v` from `apps/backend/`.

---

## 6. Mobile Architecture

### Theme system

Three palettes: `darkPalette` (default), `lightPalette`, `oledPalette`. Zustand `themeStore` persisted to SecureStore. `useTheme()` hook returns `colors`, `isDark`, `keyboardAppearance`. Every component uses `useTheme()` — no static color imports.

Skia `AmbientBackground` mounted at root layout — all screens are transparent overlays on top of a continuous GPU-rendered gradient.

### Navigation structure

- `app/(auth)/` — 6 auth screens (welcome, sign-in, sign-up, verify-email, forgot-password, reset-password)
- `app/(tabs)/` — 4 tabs: Home, History, Insights, Settings
- `app/entry/create.tsx` — new entry form
- `app/entry/[id]/index.tsx` — unified edit screen (no separate detail/read-only view). Includes pin toggle, delete, and save in header
- `app/entry/search.tsx` — full-text search

**Important**: tapping an entry card navigates directly to the edit screen (`/entry/${id}`). There is no read-only detail screen — it was intentionally removed.

### Entry form

`useEntryForm` hook manages all form state (title, body, mood, tags, entry type, date, location, images). Used by both create and edit screens. The `EntryForm` component receives all state + callbacks as props.

### Location system

- Auto-detects on new entry via `getCurrentLocationSilent()` (checks existing permission, no prompt)
- `LocationPicker` opens `LocationSearchSheet` — centered floating modal with:
  - Text search via Nominatim (OpenStreetMap) — supports POI names, addresses, landmarks
  - "Use Current Location" GPS fetch
  - Apple Maps `MapView` with tap-to-drop-pin (iOS only, conditionally loaded)
  - Two-step selection: pick → preview on map → confirm
- `openInMaps()` utility for deep-linking to native maps apps (Apple Maps / Google Maps fallback)

### Key patterns

- **No files in `app/` except route components** — styles must be inlined or in `components/`. Expo Router treats every file in `app/` as a route
- **Component structure**: each in own directory with `index.ts`, `types.ts`, implementation files
- **Hooks**: form logic extracted into custom hooks, screens are thin wrappers
- **Styles**: `StyleSheet.create()` at bottom of file, use design tokens from `@/styles`
- **i18n**: all user-facing strings via `t()`, never hardcoded
- **Modals**: centered floating card pattern (see `DateTimePickerSheet`, `LocationSearchSheet`) — animated backdrop + scale/fade/translateY card via Reanimated shared values

---

## 7. Environment Variables

### Backend (`apps/backend/.env`)

`SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (SecretStr), `SUPABASE_JWT_SECRET` (SecretStr), `REDIS_URL`, `CORS_ORIGINS`, `DEBUG`, `LOG_LEVEL`, `LOG_FORMAT`

### Mobile (`apps/mobile/.env`)

`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`

Get keys via `supabase status` after `just db-start`.

---

## 8. Current Progress

See `ROADMAP.md` for full details. Summary:

| Phase | Status | Key deliverables |
|-------|--------|-----------------|
| 1 — Authentication | ✅ | JWT auth, 6 auth screens, deep linking, SecureStore, 401 auto-sign-out |
| 2 — Design System | ✅ | 18 UI components, design tokens, glassmorphism theme |
| 3 — Journal CRUD | ✅ | Create/read/update/delete entries, cursor pagination, Redis caching |
| 4A — Theme & Skia | ✅ | 3 palettes, Skia gradients, ambient background, theme persistence |
| 4B — Visual Polish | 🔄 | Custom date/time picker, mood selector, entry cards, tab bar (auth screen verification remaining) |
| 4C — Rich Text | ❌ | Not started |
| 4D — Pin & Star | ✅ | Pin toggle with haptics, pinned-first sort |
| 4E — Full-Text Search | ✅ | Postgres tsvector, search RPC, History tab with search |
| 4F — Backdate Entries | ✅ | Custom date picker, future prevention |
| 4G — Journals/Spaces | 🔄 | CRUD, picker, filter (management screen + card indicators remaining) |
| 4H — Enhanced Mood | ✅ | 5 categories × 4 sub-emotions, Skia gradient pills |
| 4I — Calendar | ✅ | Continuous scroll, mood-colored cells, timezone-aware |
| 4J — Media (Images) | ✅ | Multi-image upload, compression, thumbnails |
| 4K — Voice Memos | ❌ | Not started |
| 4L — Location Tagging | ✅ | GPS auto-detect, Nominatim search, Apple Maps pin drop, 297 backend tests |

---

## 9. Testing & Verification

**Always run before considering work complete:**

```sh
cd apps/backend && uv run ruff check src tests && uv run mypy src && uv run pytest -v
cd apps/mobile && npx tsc --noEmit && npx eslint .
```

Backend: 297 tests across models, API, cache, validators.

---

## 10. What NOT to Do

- Don't put non-route files in `app/` directory (Expo Router treats them as routes)
- Don't import Settings directly in endpoints — use DI
- Don't mock external services in integration tests
- Don't skip mypy, ruff, tsc, or eslint checks
- Don't use `pip` or `poetry` — use `uv`
- Don't use ESLint v9+ on mobile
- Don't hardcode user-facing strings — use i18n
- Don't put form logic in screen components — extract to hooks
- Don't use `console.log` or `print()`
- Don't add `any` casts or `@ts-ignore` — fix the types properly
- Don't add comments to code (project convention)
- Don't add imports inside functions (only at top of file, unless circular dependency)
