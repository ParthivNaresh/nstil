# NStil Roadmap

## Phase 1 — Authentication ✅

Complete, production-grade auth flow across backend and mobile. Every subphase passed lint, typecheck, and tests.

- **1A — Backend: Auth hardening & protected route patterns** ✅ — JWT verification with typed `UserPayload`, `SecretStr` secrets, custom exceptions (`TokenExpiredError`/`InvalidTokenError`), 16 tests covering all auth paths. JWKS-based ES256 verification added (fetches public keys from Supabase on startup, falls back to HS256). Structured logging on all JWT failure paths (algorithm, kid, jwks_loaded).
- **1B — Mobile: Auth screens (Sign In & Sign Up)** ✅ — Glassmorphism auth screens with i18n, validation utilities, form hooks, reusable UI primitives (`Card`, `TextInput`, `Button`, `ScreenContainer`). Generic error messages (no user enumeration).
- **1C — Mobile: Email verification flow** ✅ — Post-signup verification screen with resend cooldown, deep linking (`nstil://` scheme), `onAuthStateChange` auto-updates, Supabase `config.toml` with confirmations enabled.
- **1D — Mobile: Password reset flow** ✅ — Forgot password + reset password screens, deep link routing for recovery tokens, extracted password validation helpers.
- **1E — Backend & Mobile: Session management hardening** ✅ — SecureStore token storage, `CacheControlMiddleware` (no-store on authenticated responses), `apiFetch` with `NoSessionError`/`ApiError` typing, 401 auto-sign-out, React Query cache clearing on sign-out.
- **1F — Integration testing & auth polish** ✅ — 18 backend tests, zero `any`/`ts-ignore` in mobile, manual smoke test passed, security audit checklist completed (no secrets in client code, generic errors, CORS restricted, Supabase rate limiting).

---

## Phase 2 — Design System & Core UI Components ✅

Reusable component library with Reanimated animations, glassmorphism effects, and accessibility.

- **2A — Design Token Hardening & Typography System** ✅ — `AppText` with `TypographyVariant`, `Icon` with `IconSize` enum, design tokens for `radius`, `duration`, `easing`, `opacity`. Aggregated `theme` object.
- **2B — Core Layout & Navigation Components** ✅ — Custom `TabBar` with blur + haptics + badges, `Header` with blur/transparent modes, `Divider`, `ScrollContainer`. Three-tab layout (Journal, Insights, Settings).
- **2C — Data Display Components** ✅ — `Card` (glass/elevated, press animation), `Avatar` (initials-based), `Badge` (count/dot), `EmptyState`, `Skeleton` (Reanimated pulse).
- **2D — Feedback & Overlay Components** _(as needed)_
  - [ ] Toast/Snackbar — non-blocking notification, auto-dismiss, success/error/info variants
  - [ ] Bottom sheet — draggable modal with snap points (Reanimated + Gesture Handler). Used for entry options, filters, quick actions
  - [ ] Confirmation dialog — modal with title, message, confirm/cancel buttons. Used for destructive actions
  - [ ] Pull-to-refresh indicator — custom animated refresh indicator matching glassmorphism theme
- **2E — Input & Form Components** ✅ — `TextArea` (auto-grow), `DatePicker` (native), `MoodSelector` (animated emoji picker), `SearchInput` (debounced). `GlassCard` deprecated → `Card`.
- **2F — Animated Transitions & Polish** _(as needed)_
  - [ ] Screen transitions — custom Reanimated transitions between screens (shared element for entry list → detail)
  - [ ] List animations — staggered fade-in for list items, swipe-to-delete with spring animation
  - [ ] Micro-interactions — button press scales, card hover/press states, loading state transitions
  - [ ] Haptic feedback patterns — define when haptics fire and which intensity (button press, pull-to-refresh, destructive actions)

---

## Phase 3 — Journal Entry CRUD ✅

Core product loop: create, read, update, delete journal entries. FastAPI backend with Supabase Postgres, cursor-based pagination, Redis caching, and full mobile screens.

- **3A — Database Schema & Backend Models** ✅ — `journal_entries` table with soft delete, mood_score 1-5, tags array, entry_type enum. Pydantic models: `JournalEntryCreate`/`Update`/`Row`/`Response`/`ListResponse`, `CursorParams`. Tag/body/title validators with stripping.
- **3B — Database Service Layer** ✅ — `JournalService` with create/get/list/update/soft_delete. Cursor-based pagination (limit+1 pattern). Ownership enforced at service layer alongside RLS.
- **3C — API Endpoints & Tests** ✅ — 5 REST endpoints (`POST`/`GET`/`GET`/`PATCH`/`DELETE`), 23 tests with mocked service layer. 62 total tests.
- **3D — Redis Caching Layer** ✅ — `BaseCacheService` with silent error handling, `EntryCacheService` (entry 5min, list 2min TTL), `CachedJournalService` wrapper. 31 cache tests. 93 total tests.
- **3E — Mobile: TypeScript Types & API Layer** ✅ — `PaginatedResponse<T>`, `JournalEntry` interfaces, `apiFetch` with 204 handling, typed API functions, React Query v5 hooks (`useInfiniteQuery` for list, mutations with cache invalidation), query key factory.
- **3F — Mobile: Journal List Screen** ✅ — `EntryCard` with mood emoji + relative date + tag badges, skeleton loading, empty state with CTA, `FlatList` with infinite scroll + pull-to-refresh.
- **3G — Mobile: Create/Edit Entry Screen** ✅ — `EntryForm` (body, title, mood, tags, entry type), `useEntryForm` hook, `EntryTypeSelector`, `TagInput`. Shared between create and edit routes.
- **3H — Mobile: Entry Detail Screen** ✅ — Full entry display with edit (pencil icon) and delete (native `Alert.alert` confirmation). Three-state: loading/not-found/data.
- **3I — Integration Testing & Polish** — 124 backend tests passing. Whitespace-only body bug fixed. Mobile tsc ✅, eslint ✅.
  - [x] Manual smoke test — all 10 steps passed: create, detail view, edit, delete, pull-to-refresh, pagination (cold start loads page 1, scroll triggers page 2), empty state, CTA navigation.
  - [ ] Network resilience — offline detection, retry logic for failed API calls, offline indicator in UI (deferred to Phase 6 — requires more infrastructure than a polish item)
  - [ ] ROADMAP and AGENT_CONTEXT updated with Phase 3 completion details

---

## Phase 4 — AI Integration (Embeddings & Insights)

Generate vector embeddings for journal entries via background workers. Semantic search, mood tracking over time, AI-powered reflection prompts. pgvector queries for similarity search.

---

## Phase 5 — Notifications & Reminders

Scheduled reflection reminders via push notifications. Configurable cadence. Gentle, non-intrusive prompts.

---

## Phase 6 — Production Deployment & Observability

CI/CD pipelines, production Supabase project, monitoring, error tracking (Sentry), log aggregation, performance budgets, app store submission.

**Includes:**

- [ ] Production SMTP configuration — configure `[auth.email.smtp]` in Supabase for real email delivery (SendGrid, Postmark, or SES), custom email templates for verification and password reset
- [ ] Token revocation — short-lived Redis-based token blacklist for immediate access token invalidation on sign-out (currently access tokens remain valid until expiry ~1hr)
- [ ] API gateway rate limiting — rate limiting on backend endpoints (auth endpoints already rate-limited by Supabase)
- [ ] CORS production configuration — replace localhost origins with production domains
- [ ] CI/CD pipelines — automated lint, typecheck, test on every PR
- [ ] Error tracking — Sentry integration for both backend and mobile
- [ ] Log aggregation — structured log shipping to a centralized platform
- [ ] Performance budgets — bundle size limits, API response time targets
- [ ] App store submission — iOS App Store and Google Play Store
