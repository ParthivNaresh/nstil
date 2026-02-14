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

- **2A — Design Token Hardening & Typography System** ✅
- **2B — Core Layout & Navigation Components** ✅
- **2C — Data Display Components** ✅
- **2D — Feedback & Overlay Components** _(as needed)_
  - [ ] Toast/Snackbar, Bottom sheet, Confirmation dialog, Pull-to-refresh indicator
- **2E — Input & Form Components** ✅
- **2F — Animated Transitions & Polish** _(as needed)_
  - [ ] Screen transitions, List animations, Micro-interactions, Haptic feedback patterns

---

## Phase 3 — Journal Entry CRUD ✅

Core product loop: create, read, update, delete journal entries. FastAPI backend with Supabase Postgres, cursor-based pagination, Redis caching, and full mobile screens.

- **3A — Database Schema & Backend Models** ✅
- **3B — Database Service Layer** ✅
- **3C — API Endpoints & Tests** ✅
- **3D — Redis Caching Layer** ✅
- **3E — Mobile: TypeScript Types & API Layer** ✅
- **3F — Mobile: Journal List Screen** ✅
- **3G — Mobile: Create/Edit Entry Screen** ✅
- **3H — Mobile: Entry Detail Screen** ✅
- **3I — Integration Testing & Polish** ✅ — 124 backend tests. Manual smoke test passed.

---

## Phase 4 — Core Journaling Features

The brick and mortar of a production journaling app. Everything a user expects before AI enters the picture. Theme system and visual polish come first — every subsequent UI component is built theme-aware from day one. Critical path: 4A → 4B → 4C → 4D → 4E → 4F → 4G → 4H → 4I → 4J → 4K → 4L.

### Subphase 4A — Theme System, Skia & Visual Foundation ✅

The visual foundation for everything that follows. Skia installed, theme provider built, three color palettes created, all existing components migrated to be theme-aware.

- [x] `@shopify/react-native-skia` v2.2.12 installed — pod install, rebuild verified. Skia `Canvas` renders GPU-accelerated gradients
- [x] Theme provider — Zustand `themeStore` with `dark` (default), `light`, `oled`, `auto` (system) modes. `useTheme()` hook returns current `ColorPalette`, `isDark`, `keyboardAppearance`, `setMode`
- [x] Color palettes — `darkPalette`, `lightPalette`, `oledPalette` in `styles/palettes.ts`. Same `ColorPalette` interface across all three. OLED: `#000000` backgrounds, higher contrast, subtle borders
- [x] All components migrated — every component uses `useTheme()` instead of static `colors` import. Dead `colors.ts` and `theme.ts` barrel files removed
- [x] Glassmorphism adaptation — `BlurView` tint adapts via `isDark`. Light theme: lighter blur tints. OLED: subtle glass values
- [x] Persistence — theme preference stored in SecureStore (synchronous `getItem` prevents theme flash). Loaded on app startup before first render
- [x] Settings screen — `ThemePicker` with `ThemeModeCard` per mode, color swatch previews, accent-highlighted selection
- [x] Skia gradient utility — `GradientBackground` component using Skia `Canvas` + `LinearGradient`. `MoodAccent` for entry card accent strips
- [x] Shared `withAlpha` utility — `lib/colorUtils.ts` for hex color alpha manipulation, used by Skia gradient components
- [x] Tests — tsc ✅, eslint ✅

### Subphase 4B — Visual Polish Pass 🔄

With the theme system in place, redesign existing screens to close the gap with apps like Reflectly. Not new features — making what we have look and feel premium.

**Completed:**

- [x] Entry form redesign — section dividers between form groups, increased textarea `minHeight` (180px), better vertical breathing room (`spacing.lg` gaps)
- [x] Mood selector — Skia gradient-tinted backgrounds per mood (idle + selected states), 64px touch targets, colored border on selection, haptic feedback
- [x] Entry type selector — pill shapes (`radius.full`), haptic feedback on selection, accent-colored selected state
- [x] Journal list — mood-colored left accent border via Skia `MoodAccent`, staggered fade-in animation (`AnimatedEntryCard`), better typography hierarchy (date prominent, body secondary), increased card spacing
- [x] Detail screen — full-width Skia gradient mood banner, metadata row with icons (Calendar, FileText, MapPin), tags as rounded pills, better section spacing
- [x] Tab bar — animated active tab indicator (accent-colored pill, spring scale animation)
- [x] Tag pills — consistent `radius.full` pill styling across EntryCard, EntryDetail, and TagInput
- [x] Tests — tsc ✅, eslint ✅

**Remaining:**

- [ ] Auth screens — visual verification of all 6 auth screens in light/dark/OLED
- [ ] Header polish — visual verification of blur/transparent modes across all themes
- [ ] Full visual verification — all screens in all three themes on device/simulator

### Subphase 4C — Rich Text Editing

Replace plain text body with Markdown-based editing and rendering.

**Objectives:**

- [ ] Markdown editor — integrate a production-grade Markdown editor for the entry body field. Support: **bold**, *italic*, ~~strikethrough~~, headings (H1-H3), bullet lists, numbered lists, links, blockquotes, horizontal rules, inline code
- [ ] Formatting toolbar — minimal floating toolbar above keyboard with bold/italic/list/heading/link buttons. Toolbar auto-hides when keyboard is dismissed. Distraction-free: toolbar fades out after 3s of typing, reappears on tap or pause
- [ ] Markdown rendering — render stored Markdown in the detail screen and in entry card previews (strip formatting for preview, render fully on detail). Theme-aware rendering (code blocks, blockquotes adapt to current palette)
- [ ] Migration — existing plain text entries render as-is (plain text is valid Markdown). No data migration needed
- [ ] Backend — body field remains `text`. No schema change. Markdown is a client-side concern
- [ ] Tests — editor renders, toolbar toggles formatting, preview strips Markdown, detail renders Markdown

### Subphase 4D — Pin & Star Entries ✅

Quick access to meaningful entries.

- [x] Backend — `is_pinned boolean NOT NULL DEFAULT false` added to `journal_entries`. Migration with composite index `(user_id, is_pinned DESC, created_at DESC)`. Pydantic models updated across `Create`, `Update`, `Row`, `Response`
- [x] API — `PATCH /entries/{id}` with `{"is_pinned": true/false}` toggles pin. List endpoint returns pinned-first sort order (`ORDER BY is_pinned DESC, created_at DESC`)
- [x] Mobile — pin icon (lucide `Pin`) on `EntryCard` top-left when pinned. Detail screen header has pin/unpin toggle (Pin/PinOff icons) with haptic feedback. `useTogglePin` mutation hook with optimistic cache update
- [x] Cache invalidation — `CachedJournalService.update()` already calls `invalidate_all()` — no additional work needed
- [x] Tests — 5 new backend tests (create pinned, default unpinned, pin via update, unpin via update, pinned sort in list). 129 total passing. Mobile: tsc ✅, eslint ✅

### Subphase 4E — Full-Text Search ✅

Lightning-fast keyword search across all entries using Postgres full-text search.

- [x] Backend — `search_vector tsvector` column with weighted A/B ranking (title > body). Trigger auto-updates on INSERT/UPDATE of title/body. GIN index on `search_vector WHERE deleted_at IS NULL`. Postgres RPC function `search_journal_entries` handles filtering, ordering, and pagination in a single query
- [x] API — `GET /api/v1/entries/search?q=<query>&limit=20&cursor=<cursor>`. Returns `JournalEntryListResponse`. Empty/whitespace query returns 422. `SearchParams` model with validation
- [x] Service layer — `JournalService.search()` via Supabase RPC. `CachedJournalService.search()` with cache-first pattern. Ownership enforced via RPC `p_user_id` param. Soft-deleted excluded in SQL
- [x] Cache — search results cached with 60s TTL keyed by `user + query + cursor + limit` (md5 hash). `invalidate_user_searches()` clears all search cache on create/update/delete
- [x] Mobile — `searchEntries` API function, `useSearchEntries` infinite query hook with debounced input. New **History tab** with search bar + entry list (entry list moved from old Journal tab). Home tab simplified to welcome/landing screen. 4-tab layout: Home, History, Insights, Settings
- [x] Refactor — `list()` → `list_entries()` across service/cached/API/tests to fix Python builtin name shadowing
- [x] Tests — 7 new search API tests (results, empty, pagination, empty query, missing query, whitespace-only, auth). 136 total passing. Mobile: tsc ✅, eslint ✅

### Subphase 4F — Backdate Entries ✅

Let users set a custom date for entries.

- [x] Backend — `JournalEntryCreate.created_at` and `JournalEntryUpdate.created_at` — optional `datetime | None`, validated against future (1-min tolerance via `FUTURE_TOLERANCE`). Shared `_validate_not_future()` helper. Naive datetimes get UTC. `to_update_dict()` uses `model_dump(mode="json")` for datetime serialization
- [x] Service layer — `JournalService.create()` conditionally includes `created_at` in insert payload. When `None`, Postgres `DEFAULT now()` applies
- [x] Mobile — `EntryDatePicker` component (journal-specific, not generic UI) using native iOS compact picker (`display="compact"`). Glass pill trigger with calendar icon. Border + icon shift to accent color when backdated. `useEntryForm` manages `entryDate` state, serializes to ISO on submit. Old generic `DatePicker` UI component deleted
- [x] Tests — 12 new backend tests (model + API): create with custom date, default none, future rejected, naive gets UTC, update date, update future rejected, `to_update_dict` serialization. 148 total passing. Mobile: tsc ✅, eslint ✅
- [ ] **Visual debt** — native iOS compact picker popover cannot be styled (system UI). Will be replaced with a custom Skia-rendered glass-morphism date/time picker in 4I alongside the History tab calendar (shared components)

### Subphase 4G — Journals & Spaces

Separate spaces for different areas of life: "Work Stress," "Personal Growth," "Dream Logs."

**Objectives:**

- [ ] Backend — new `journals` table: `id`, `user_id`, `name` (max 100), `description` (max 500, nullable), `color` (hex, nullable), `icon` (Lucide name, nullable), `sort_order`, `created_at`, `updated_at`, `deleted_at`. RLS. Default journal auto-created on signup
- [ ] Entry association — add `journal_id (uuid FK, nullable)` to `journal_entries`. Nullable for backwards compat. Migration backfills existing entries to default journal
- [ ] Models — `JournalCreate`, `JournalUpdate`, `JournalRow`, `JournalResponse`, `JournalListResponse`. Entry models updated with `journal_id`
- [ ] Service layer — `JournalSpaceService` (CRUD). `JournalService.list()` accepts optional `journal_id` filter
- [ ] API — `POST/GET/PATCH/DELETE /api/v1/journals`. Entry list gets `journal_id` query param
- [ ] Mobile — journal picker on entry form. Journal list screen. Journal-filtered entry list. Color-coded indicators on entry cards
- [ ] Tests — backend: CRUD journals, filter entries by journal, default journal creation. Mobile: tsc + eslint

### Subphase 4H — Enhanced Mood System

Replace the 5-point emoji scale with a two-level emotion wheel for professional-grade emotional granularity.

**Objectives:**

- [ ] Data model — replace `mood_score smallint` with `mood_category text` + `mood_specific text`. Categories based on Plutchik's wheel: Joy, Sadness, Anger, Fear, Surprise, Disgust, Trust, Anticipation. Each has 3-5 specific emotions. Migration maps existing 1-5 scores to new model
- [ ] Backend models — `MoodCategory` and `MoodSpecific` enums. Validation: `mood_specific` must belong to given `mood_category`
- [ ] Mobile — two-step mood picker: select category (8 options with emoji + color), then specific emotion (3-5 options). Animated transition with Skia gradient backgrounds per mood category. Each category has a distinct color for calendar/charts. Replaces existing `MoodSelector`
- [ ] Tests — backend: valid mood pairs, invalid pair rejected, migration correctness. Mobile: tsc + eslint

### Subphase 4I — Calendar, Date Picker & Mood History View

Monthly calendar showing mood logged each day — the signature feature of mood tracking apps. Also replaces the native iOS date picker with a custom Skia-rendered glass-morphism picker (shared components between calendar and entry form).

**Objectives:**

- [ ] Custom date/time picker — Skia-rendered glass-morphism bottom sheet with scroll wheels for date and time selection. Replaces native iOS compact picker in `EntryDatePicker`. Shared primitives reused by calendar grid
- [ ] Backend — `GET /api/v1/entries/calendar?year=2026&month=1`. Returns array of `{ date, mood_category, mood_specific, entry_count }` per day. Aggregated query grouped by date, dominant mood per day
- [ ] Mobile — monthly grid with Skia-rendered mood-colored dots per day. Swipe to change months. Tap day → filtered entry list. Current day highlighted. Mood streak (consecutive days with entries). Lives in History tab
- [ ] Cache — calendar data cached per user + month (5 min TTL). Invalidated on entry changes
- [ ] Tests — backend: calendar aggregation, empty month, multiple entries per day. Mobile: tsc + eslint

### Subphase 4J — Media Attachments (Images)

Support for multiple images per entry.

**Objectives:**

- [ ] Storage — Supabase Storage bucket `entry-media` with RLS. Path: `{user_id}/{entry_id}/{uuid}.{ext}`. Formats: JPEG, PNG, HEIC, WebP. Max 10MB per image, max 10 per entry
- [ ] Backend — new `entry_media` table: `id`, `entry_id`, `user_id`, `storage_path`, `content_type`, `size_bytes`, `width`, `height`, `sort_order`, `created_at`. Cascade delete with entry
- [ ] API — `POST /entries/{id}/media` (upload), `DELETE /entries/{id}/media/{media_id}`, `GET /entries/{id}/media`. Entry response includes `media[]` with signed URLs (1hr expiry)
- [ ] Mobile — image picker (`expo-image-picker`). Thumbnail grid on form. Full-screen view with pinch-to-zoom. Upload progress. Horizontal gallery on detail screen
- [ ] Optimization — client-side compression (max 2048px, JPEG 80%). Thumbnails via Supabase image transforms
- [ ] Tests — backend: upload, list, delete, max count, file type validation. Mobile: tsc + eslint

### Subphase 4K — Voice Memos

Record and attach audio to entries.

**Objectives:**

- [ ] Storage — same `entry_media` table and bucket. Formats: M4A, AAC, WAV. Max 5 minutes, max 25MB
- [ ] Mobile — record button on entry form (mic icon). `expo-av` for recording. Skia-rendered waveform visualization during recording and playback. Playback controls (play/pause, scrubber, duration). Auto-stop at max duration
- [ ] Backend — same upload/delete/list endpoints. `content_type` distinguishes audio from images. Duration in `metadata jsonb`
- [ ] Permissions — microphone permission via `expo-av`. Graceful denial handling
- [ ] Tests — backend: audio upload, content type validation. Mobile: tsc + eslint

### Subphase 4L — Location Tagging

Upgrade the existing `location` text field to structured geolocation.

**Objectives:**

- [ ] Backend — add `latitude double precision`, `longitude double precision` to `journal_entries`. Rename `location` → `location_name`. Validation: if lat/lng provided, both required. Lat -90 to 90, lng -180 to 180
- [ ] Mobile — `expo-location` for current position. Auto-attach toggle on entry form (opt-in). Location displayed on detail with MapPin icon, tappable to open Maps
- [ ] Reverse geocoding — `expo-location.reverseGeocodeAsync()` converts lat/lng to city/country. Stored in `location_name`
- [ ] Privacy — location always opt-in. Never auto-attach without explicit action. Clear indicator when recording
- [ ] Tests — backend: create with location, validation. Mobile: tsc + eslint

---

## Phase 5 — AI Integration (Embeddings & Insights)

Generate vector embeddings for journal entries via background workers. Semantic search, mood tracking over time, AI-powered reflection prompts. pgvector queries for similarity search. "Year in Pixels" sentiment-colored history view.

---

## Phase 6 — Notifications & Reminders

Scheduled reflection reminders via push notifications. Configurable cadence. Gentle, non-intrusive prompts.

---

## Phase 7 — Production Deployment & Observability

CI/CD pipelines, production Supabase project, monitoring, error tracking (Sentry), log aggregation, performance budgets, app store submission.

**Includes:**

- [ ] Production SMTP configuration — real email delivery (SendGrid, Postmark, or SES), custom templates
- [ ] Token revocation — Redis-based token blacklist for immediate invalidation on sign-out
- [ ] API gateway rate limiting — rate limiting on backend endpoints
- [ ] CORS production configuration — replace localhost origins with production domains
- [ ] CI/CD pipelines — automated lint, typecheck, test on every PR
- [ ] Error tracking — Sentry integration for backend and mobile
- [ ] Log aggregation — structured log shipping to centralized platform
- [ ] Performance budgets — bundle size limits, API response time targets
- [ ] App store submission — iOS App Store and Google Play Store
- [ ] Network resilience — offline detection, retry logic, offline indicator in UI
