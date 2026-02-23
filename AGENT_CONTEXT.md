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
| Notifications | expo-notifications | latest | WEEKLY scheduled triggers, configurable quiet hours |
| Audio | expo-av | latest | Recording with real-time metering, playback |
| On-device AI | Apple Foundation Models | iOS 26+ | 3B param LLM via custom Expo native module |
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
| `mkdocs.yml` | MkDocs Material documentation site config |
| `docs/` | Documentation source (architecture, setup, conventions) |
| `sonar-project.properties` | SonarCloud analysis config |
| `.github/workflows/` | CI — `lint.yml` (format + lint + typecheck + docs build), `test.yml` (pytest + SonarCloud) |
| `supabase/config.toml` | Local Supabase config (auth, email, DB) |
| `supabase/migrations/` | SQL migrations (8 consolidated domain-based files) |
| `packages/shared/` | Placeholder for shared types/constants |

### Backend (`apps/backend/`)

Source lives in `src/nstil/` (hatchling src layout).

| Directory | Purpose |
|-----------|---------|
| `api/` | FastAPI routes — `deps.py` (DI with 10 AI factories), `middleware.py`, `router.py`, `v1/` (endpoints) |
| `core/` | Domain logic — `security.py` (JWT), `exceptions.py` |
| `models/` | Pydantic models — journal, mood, calendar, media, space, AI (profile, session, message, prompt, insight, feedback, task, embedding, context) |
| `services/` | Service layer — journal, media, redis, notification, cache services |
| `services/ai/` | AI services — session, prompt, insight, feedback, task, profile, context, embedding, prompt_engine, check_in, insight_engine, insight_computations |
| `services/ai/prompt_bank/` | 76 curated prompts across 7 categories with mood/topic/intensity filtering |
| `cache/` | Redis cache — `ai_keys.py`, `ai_cache.py`, cached wrappers for context/profile/notifications |
| `observability/` | Structured logging — config, middleware, processors, context |
| `workers/` | ARQ background tasks and settings |

### Mobile (`apps/mobile/`)

| Directory | Purpose |
|-----------|---------|
| `app/` | expo-router routes — `(auth)/`, `(tabs)/`, `entry/`, `check-in.tsx`, `settings/` |
| `components/ui/` | Reusable UI primitives — each in own directory |
| `components/auth/` | Auth-specific shared components |
| `components/journal/` | Journal feature components (EntryForm, EntryCard, Calendar, LocationPicker, ReflectionCard, VoiceMemo) |
| `components/insights/` | Insight components (StreakBanner, WeeklySummaryCard, MoodTrendChart, NarrativeSummary, YearInPixels) |
| `components/settings/` | Settings components (NotificationSettings, AIProfileSettings) |
| `hooks/` | Custom hooks — form logic, data fetching, theme, AI capabilities, check-in state machine |
| `lib/` | Utilities — Supabase client, React Query, i18n, validation, location, date formatting, audio |
| `lib/ai/` | On-device AI — foundationModels, promptGenerator, promptTemplates, promptContext, reflectionEngine, summaryEngine, notificationTextEngine, personalizedNotifications |
| `modules/nstil-ai/` | Local Expo native module — Swift bridge to Apple Foundation Models |
| `stores/` | Zustand stores — authStore, themeStore, notificationStore |
| `services/api/` | API client + domain-specific API functions |
| `styles/` | Design tokens — palettes, spacing, typography, radius, animation, opacity |
| `types/` | Shared TypeScript types |

---

## 4. Commands

```sh
just dev                  # infra-up + backend-dev
just device               # expo run:ios --device (physical device build)
just backend-dev          # uvicorn --factory --reload on :8000
just backend-check        # format-check + lint + typecheck + test
just backend-format       # auto-format with ruff
just mobile-ios           # expo run:ios
just mobile-check         # typecheck + lint
just infra-up             # supabase start + redis (runs migrations)
just db-reset             # reset + re-migrate
just docs-serve           # local mkdocs dev server
just docs-build           # strict mkdocs build (used in CI)
```

Direct commands:
```sh
cd apps/backend && uv run ruff format --check src tests && uv run ruff check src tests && uv run mypy src && uv run pytest -v
cd apps/mobile && npx tsc --noEmit && npx eslint .
```

---

## 5. Backend Architecture

### Key patterns

- **App factory** (`main.py`): `create_app()` with async lifespan for Redis pool
- **DI**: all external resources via `Depends()` — `get_settings()`, `get_redis()`, `get_current_user()`, plus 10 AI service factories
- **Auth**: Bearer JWT -> `verify_jwt` (HS256) -> `UserPayload`. `TokenExpiredError` / `InvalidTokenError`
- **Models**: Pydantic models per domain — `Row`, `Create`, `Update` (with `to_update_dict()`), `Response` (with `from_row()`) pattern
- **Services**: `JournalService` (Supabase queries), `CachedJournalService` (Redis cache-first), `MediaService` (storage + signed URLs). AI services follow same pattern
- **Cache**: Redis with pattern-based invalidation. TTLs: 5min lists, 60s search/AI context, 5min calendar, 10min AI profile/notification prefs
- **Observability**: structlog with sensitive data scrubbing, request logging middleware
- **AI orchestration**: PromptEngine (context-aware prompt selection), CheckInOrchestrator (multi-step flow), InsightEngine (streak/milestone/summary/anomaly computation)

### Database (8 consolidated migrations)

1. `001_EXTENSIONS` — Required Postgres extensions
2. `002_PROFILES` — User profiles
3. `003_JOURNALS` — journals table with RLS, default journal trigger
4. `004_JOURNAL_ENTRIES` — journal_entries with search vector, mood, location, pin, calendar RPC
5. `005_ENTRY_MEDIA` — entry_media table + storage bucket (images, audio, waveform)
6. `006_USER_PREFERENCES` — user_ai_profiles + user_notification_preferences
7. `007_AI_INTELLIGENCE_LAYER` — ai_sessions, ai_messages, ai_prompts, ai_insights, ai_feedback, ai_agent_tasks, entry_embeddings
8. `008_TRIGGERS_AND_FUNCTIONS` — handle_new_user() trigger

### Tests: 583 passing

Covers models, API endpoints, cache layer, validators, AI services, check-in flow, insights, prompts.

---

## 6. Mobile Architecture

### Theme system

Three palettes: `darkPalette` (default), `lightPalette`, `oledPalette`. Zustand `themeStore` persisted to SecureStore. `useTheme()` hook returns `colors`, `isDark`, `keyboardAppearance`. Every component uses `useTheme()` — no static color imports.

Skia `AmbientBackground` mounted at root layout — all screens are transparent overlays on top of a continuous GPU-rendered gradient.

### Navigation structure

- `app/(auth)/` — 6 auth screens
- `app/(tabs)/` — 5 tabs: Home, History, Insights, Settings + Create
- `app/entry/create.tsx` — new entry form
- `app/entry/[id]/index.tsx` — unified edit screen with pin toggle, delete, save, AI reflection card
- `app/entry/search.tsx` — full-text search
- `app/check-in.tsx` — AI check-in flow (4-step state machine)
- `app/settings/notifications.tsx` — notification preferences
- `app/settings/ai-profile.tsx` — AI profile settings

**Important**: tapping an entry card navigates directly to the edit screen (`/entry/${id}`). There is no read-only detail screen.

### On-device AI architecture

All AI inference runs on-device via Apple Foundation Models (iOS 26+). No cloud LLM calls. Privacy first.

- **Native module** (`modules/nstil-ai/`): Swift bridge with `checkAvailability()` and `generate(instructions, prompt)`. Podspec platform 15.1 (matches project). `#if canImport(FoundationModels)` guards
- **TypeScript AI layer** (`lib/ai/`): foundationModels (timeout, errors), promptTemplates (per-task system prompts), promptContext (context to natural language), promptGenerator (type determination), reflectionEngine (entry reflections), summaryEngine (weekly narratives), notificationTextEngine (notification text), personalizedNotifications (shared scheduling utility)
- **Fallback**: when Foundation Models unavailable, falls back to curated PromptBank on backend. UI is source-agnostic

### Auth guard (critical — do not change this pattern)

The auth guard lives in `app/_layout.tsx` (root layout), NOT in `app/index.tsx`. It uses `useSegments()` + `useAuthStore` to reactively navigate:

- **Authenticated user in `(auth)` group** → `router.replace("/(tabs)")`
- **Unauthenticated user outside `(auth)` group** → `router.replace("/(auth)")`

`app/index.tsx` handles cold-start routing only (initial load, onboarding check, profile fetch). It uses declarative `<Redirect>` which commits a permanent navigation state — once it fires, `router.replace("/")` from inside a group will NOT re-mount the root index. This is an Expo Router behavior.

**Rules:**
- Never call `router.replace("/")` from inside `(auth)` screens — it resolves to the group's index, not `app/index.tsx`
- Sign-in/sign-up forms should NOT navigate after auth — the layout effect handles it reactively
- `signIn()` in `authStore` must update the Zustand store synchronously (not rely on `onAuthStateChange`)
- iOS Simulator Keychain persists across app deletions — `just dev` and `just db-reset` reset it automatically

### Key patterns

- **No files in `app/` except route components**
- **Component structure**: each in own directory with `index.ts`, `types.ts`, implementation files
- **Hooks**: form logic extracted into custom hooks, screens are thin wrappers
- **Styles**: `StyleSheet.create()` at bottom of file, use design tokens from `@/styles`
- **Typography variants**: `h1`, `h2`, `h3`, `body`, `bodySmall`, `caption`, `label` — NO `title` variant
- **Text component**: `AppText` from `@/components/ui` — NOT raw `Text` from react-native (exception: `Button.tsx` and `ErrorMessage.tsx`)
- **i18n**: all user-facing strings via `t()`, never hardcoded
- **Modals**: centered floating card pattern — animated backdrop + scale/fade/translateY card via Reanimated shared values

---

## 7. Environment Variables

### Backend (`apps/backend/.env`)

`SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (SecretStr), `SUPABASE_JWT_SECRET` (SecretStr), `REDIS_URL`, `CORS_ORIGINS`, `DEBUG`, `LOG_LEVEL`, `LOG_FORMAT`

### Mobile (`apps/mobile/.env`)

`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`

Get keys via `supabase status` after `just infra-up`.

---

## 8. Current Progress

See `ROADMAP.md` for full details. Summary:

| Phase | Status | Key deliverables |
|-------|--------|-----------------|
| 1 — Authentication | ✅ | JWT auth, 6 auth screens, deep linking, SecureStore, 401 auto-sign-out |
| 2 — Design System | ✅ | 18 UI components, design tokens, glassmorphism theme |
| 3 — Journal CRUD | ✅ | Create/read/update/delete entries, cursor pagination, Redis caching |
| 4A — Theme and Skia | ✅ | 3 palettes, Skia gradients, ambient background, theme persistence |
| 4B — Visual Polish | 🔄 | Custom date/time picker, mood selector, entry cards, tab bar (auth screen verification remaining) |
| 4C — Rich Text | ❌ | Not started |
| 4D — Pin and Star | ✅ | Pin toggle with haptics, pinned-first sort |
| 4E — Full-Text Search | ✅ | Postgres tsvector, search RPC, History tab with search |
| 4F — Backdate Entries | ✅ | Custom date picker, future prevention |
| 4G — Journals/Spaces | 🔄 | CRUD, picker, filter (management screen + card indicators remaining) |
| 4H — Enhanced Mood | ✅ | 5 categories x 4 sub-emotions, Skia gradient pills |
| 4I — Calendar | ✅ | Continuous scroll, mood-colored cells, timezone-aware |
| 4J — Media (Images) | ✅ | Multi-image upload, compression, thumbnails |
| 4K — Voice Memos | ✅ | Recording, Skia waveform, playback, persistence |
| 4L — Location Tagging | ✅ | GPS auto-detect, Nominatim search, Apple Maps pin drop |
| 5A — Backend AI | ✅ | 10 models, 9 services, 3 orchestrators, 76-prompt bank, 20 endpoints, 583 tests |
| 5B — Notifications | ✅ | Scheduled reminders, quiet hours, preferences screen, lifecycle sync |
| 5C — On-Device AI (iOS) | ✅ | Foundation Models bridge, personalized prompts, reflections, narratives, notification text |
| 5D — On-Device AI (Android) | ❌ | Not started |
| 5E — AI Screens | ✅ | Check-in flow, home prompt card, insights dashboard, AI profile settings |

---

## 9. Testing and Verification

**Always run before considering work complete:**

```sh
cd apps/backend && uv run ruff check src tests && uv run mypy src && uv run pytest -v
cd apps/mobile && npx tsc --noEmit && npx eslint .
```

Backend: 583 tests across models, API, cache, validators, AI services.

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
- Don't use `console.log` or `print()` (use `console.debug`/`console.warn`/`console.error` with `[tag]` prefix for development logging)
- Don't add `any` casts or `@ts-ignore` — fix the types properly
- Don't add comments to code (project convention)
- Don't add imports inside functions (only at top of file, unless circular dependency)
- Don't use `Text` from react-native — use `AppText` from `@/components/ui` (exception: `Button.tsx`, `ErrorMessage.tsx`)
- Don't use `title` typography variant — it doesn't exist. Use `h1`, `h2`, `h3`, `body`, `bodySmall`, `caption`, `label`
- Don't use `dict[str, Any]` for Supabase payloads — use `dict[str, object]`
- Don't swallow errors silently in catch blocks — log with tagged prefix during development
