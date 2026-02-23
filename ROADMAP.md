# NStil Roadmap

## Phase 1 — Authentication ✅

Complete, production-grade auth flow across backend and mobile. Every subphase passed lint, typecheck, and tests.

- **1A — Backend: Auth hardening & protected route patterns** ✅
- **1B — Mobile: Auth screens (Sign In & Sign Up)** ✅
- **1C — Mobile: Email verification flow** ✅
- **1D — Mobile: Password reset flow** ✅
- **1E — Backend & Mobile: Session management hardening** ✅
- **1F — Integration testing & auth polish** ✅

---

## Phase 2 — Design System & Core UI Components ✅

Reusable component library with Reanimated animations, glassmorphism effects, and accessibility.

- **2A — Design Token Hardening & Typography System** ✅
- **2B — Core Layout & Navigation Components** ✅
- **2C — Data Display Components** ✅
- **2D — Feedback & Overlay Components** _(as needed)_
- **2E — Input & Form Components** ✅
- **2F — Animated Transitions & Polish** _(as needed)_

---

## Phase 3 — Journal Entry CRUD ✅

Core product loop: create, read, update, delete journal entries. FastAPI backend with Supabase Postgres, cursor-based pagination, Redis caching, and full mobile screens.

- **3A–3I** ✅ — 124 backend tests. Manual smoke test passed.

---

## Phase 4 — Core Journaling Features

The brick and mortar of a production journaling app. Everything a user expects before AI enters the picture.

### Subphase 4A — Theme System, Skia & Visual Foundation ✅

Skia installed, theme provider built, three color palettes (dark/light/OLED), all components migrated to theme-aware. Zustand `themeStore` with SecureStore persistence (no theme flash). `GradientBackground`, `MoodAccent` Skia components. `withAlpha` color utility (handles hex + rgba parsing). `onAccent`/`onError` palette tokens added — zero hardcoded hex in components.

### Subphase 4B — Visual Polish Pass 🔄

Redesigned existing screens toward premium glassmorphism aesthetic.

**Completed:**
- Entry form redesign (flat inputs, section dividers, breathing room)
- Custom date/time picker (floating modal, calendar grid, scroll-snap time wheels, future time prevention)
- TextArea floating label fix (label above scrollable area)
- Image compression progress indicator
- Mood selector (Skia gradient pills, haptic feedback)
- Entry type selector (pill shapes, accent selection)
- Journal list (mood-colored Skia accent strips, staggered fade-in)
- Detail screen (full-width Skia gradient mood banner, metadata icons, tag pills)
- Tab bar (animated accent-colored pill indicator)
- Persistent ambient background (single Skia shader at root, transparent navigation)
- Style files moved out of `app/` directory (eliminated Expo Router warnings)

**Remaining:**
- [ ] Auth screens — visual verification in light/dark/OLED
- [ ] Header polish — blur/transparent modes across themes
- [ ] Full visual verification — all screens, all themes, on device

### Subphase 4C — Rich Text Editing

Replace plain text body with Markdown-based editing and rendering.

- [ ] Markdown editor with formatting toolbar (bold, italic, lists, headings, links, blockquotes, code)
- [ ] Distraction-free toolbar (auto-hides after 3s typing, reappears on pause)
- [ ] Theme-aware Markdown rendering on detail screen and card previews
- [ ] No migration needed — plain text is valid Markdown

### Subphase 4D — Pin & Star Entries ✅

`is_pinned` boolean with composite index. Pin icon on cards, toggle in detail header with haptic feedback. Pinned-first sort order. 5 new backend tests, 129 total.

### Subphase 4E — Full-Text Search ✅

Postgres `tsvector` with weighted A/B ranking (title > body). GIN index. RPC-based search with filtering, ordering, pagination. Redis cache (60s TTL, md5-keyed). Mobile: debounced search, infinite query. History tab with search + entry list. 7 new tests, 136 total.

### Subphase 4F — Backdate Entries ✅

Optional `created_at` on create/update with future validation (1-min tolerance). Custom `DateTimePickerSheet` floating modal with `PickerCalendar` + `TimePicker` wheels. 12 new tests, 148 total.

### Subphase 4G — Journals & Spaces 🔄

Separate spaces for different areas of life.

**Completed (4G-1 through 4G-9):**
- `journals` table with RLS, default "My Journal" on signup, cascade soft-delete RPC
- Full backend CRUD with service/cache layers, 211 tests
- Mobile: `JournalPicker` on entry form, `JournalFilterBar` on history screen
- Entry list and search filter by journal

**Remaining:**
- [ ] **4G-10** — Journal management screen (settings → manage journals, add/edit/delete)
- [ ] **4G-11** — Journal indicator on entry cards and detail screen

### Subphase 4H — Enhanced Mood System ✅

Two-level mood system: 5 categories (Happy, Calm, Sad, Anxious, Angry) × 4 sub-emotions each (20 total). No emojis — Skia gradient-filled pills. Two-step inline picker with staggered animation. Mood gradient orbs on cards and detail screen. 231 tests.

### Subphase 4I — Calendar & Mood History View ✅

Continuous-scroll mood calendar on History tab. Skia gradient circles per day. Timezone-aware aggregation via Postgres RPC. `useCalendarRange` fetches 8 months in parallel. Streak computation. Semi-transparent card background. 253 tests.

### Subphase 4J — Media Attachments (Images) ✅

Multiple images per entry (max 10, 10MB each). `entry_media` table with RLS + storage bucket. Client-side compression (2048px max, JPEG 80%). Incremental thumbnail appearance during compression. `MediaPreviewCluster` on cards. Long-press to activate delete (haptic feedback), tap to confirm, tap elsewhere to dismiss. 277 tests.

### Subphase 4K — Voice Memos ✅

Record and attach audio to journal entries. `expo-av` recording with real-time metering, Skia waveform visualization (live during recording, animated playback with `Group clip`), waveform persistence via `entry_media.waveform` JSONB column. Auto-stop at 5 min, haptic feedback. 313 tests.

### Subphase 4L — Location Tagging ✅

Structured geolocation with interactive place search and map-based pin drop. `latitude`/`longitude` columns with CHECK constraints. `LocationSearchSheet` with Nominatim search, GPS fetch, Apple Maps tap-to-drop-pin. Auto-detect on new entries. Detail screen tappable location opens native maps. 297 tests.

---

## Phase 5 — AI Intelligence Layer & On-Device AI ✅

The intelligence layer. Backend provides data aggregation, curated prompt selection, and computed insights. On-device LLMs (Apple Foundation Models) provide personalized text generation — all inference stays on device. 583 backend tests.

### Subphase 5A — Backend AI Architecture ✅

Full backend AI system: database schema (8 consolidated migrations), 10 model files, 9 data services, cache layer with TTL-based invalidation, 76-prompt curated PromptBank with mood/topic/intensity filtering, and 3 orchestration services (PromptEngine, CheckInOrchestrator, InsightEngine). 20 API endpoints across 4 route files with 10 DI factories. InsightEngine computes streaks, milestones, weekly summaries, and mood anomaly detection.

**Deferred:**
- [ ] `services/ai/task_orchestrator.py` — ARQ worker dispatcher for background jobs (batch insight generation, embedding computation). Requires ARQ worker setup, `get_unembedded_entries` RPC, embedding model provider decision.
- [ ] InsightEngine v2 — mood trends (moving averages), complex patterns (day-of-week correlations), monthly summaries.

### Subphase 5B — Push Notifications & Reminders ✅

Scheduled reflection reminders with configurable cadence, quiet hours, and full lifecycle management. `expo-notifications` with WEEKLY triggers, `isWithinQuietHours()` overnight wrap handling, 15 static fallback messages. Notification preferences screen with Skia gradient pills, compact TimePicker wheels, debounced/immediate update split. AppState foreground sync, sign-in/sign-out lifecycle. Notification tap navigates to `/entry/create?source=notification`.

### Subphase 5C — On-Device AI: Apple Foundation Models (iOS) ✅

All four on-device AI features confirmed working on physical device (iOS 26.3 with Apple Intelligence).

**5C-1 — Native Module: Foundation Models Bridge ✅**

Swift native module (`modules/nstil-ai/`) exposing Apple Foundation Models to React Native via Expo Modules API. `NStilAIModule.swift` with `checkAvailability()` and `generate(instructions, prompt)`. `#if canImport(FoundationModels)` compile-time guards. TypeScript wrapper with platform guard, 30s timeout, typed `FoundationModelError` class. `useAICapabilities` hook as single source of truth for AI-conditional UI.

**5C-2 — Personalized Prompt Generation ✅**

On-device LLM replaces curated PromptBank when Foundation Models available. `promptContext.ts` transforms `AIContextResponse` into natural language (profile, activity stats, mood patterns, recent entries). `promptTemplates.ts` with per-task system prompts enforcing tone. `promptGenerator.ts` mirrors backend `PromptEngine` logic for prompt type determination. Silent fallback to curated backend on failure. Home screen check-in card shows personalized prompts.

**5C-3 — Entry Reflections ✅**

Post-entry reflections generated on-device. Fire-and-forget — entry saves immediately, reflection appears asynchronously. `reflectionEngine.ts` builds entry-specific context, generates via Foundation Models. `useEntryReflection` hook with dedup guard. `ReflectionCard` component with 3-line truncated preview, tap-to-open `pageSheet` modal for full text. Positioned between date/location and text body via `reflectionSlot` prop pattern. Dismiss persists via API.

**5C-4 — Narrative Summaries & Personalized Notifications ✅**

On-device LLM generates weekly narrative summaries from computed insight metadata. `summaryEngine.ts` builds context with exact mood counts (not percentages) to reduce hallucination. Strict prompt instructions enforce factual accuracy. `NarrativeSummary` component renders above `WeeklySummaryCard` on Insights tab. Personalized notification text via `notificationTextEngine.ts` replaces static rotation — `personalizedNotifications.ts` shared utility used by both `useNotificationSync` and `useNotificationPreferences` to ensure all scheduling paths attempt LLM generation.

### Subphase 5C+ — Contextual Intelligence (deferred, post-v1.0)

System-level data integration for proactive, context-aware intelligence. Builds on top of 5C's Foundation Models bridge.

- [ ] **Journaling Suggestions API** — Apple's framework for system-aggregated context (workouts, music, photos, locations)
- [ ] **HealthKit integration** — Sleep, HRV, resting heart rate, mindful minutes. Background delivery for contextual notification triggers
- [ ] **Contextual notification triggers** — HealthKit events → "How did that workout make you feel?" Rate limiting (max 3/day, 2hr apart). App Intents for Dynamic Island / Lock Screen suggestions
- [ ] **Calendar integration** — EventKit for meeting density, upcoming stressors

### Subphase 5D — On-Device AI: Gemini Nano (Android)

Equivalent intelligence features on Android using Gemini Nano via ML Kit GenAI APIs.

- [ ] **Native module bridge** — Kotlin native module exposing ML Kit GenAI Prompt API. Availability check, graceful fallback to curated prompts
- [ ] **Health Connect integration** — Read workouts, sleep, heart rate. Change token-based polling via `WorkManager`
- [ ] **Feature parity** — Same TypeScript prompt construction, context preparation, and persistence logic as iOS. Platform-specific code is only the native module bridge layer
- [ ] **Fallback strategy** — Devices without on-device AI get curated PromptBank selection. No cloud fallback — privacy first

### Subphase 5E — Mobile AI Screens & Check-in Flow UI ✅

Full user-facing AI experience consuming 20 backend endpoints. Check-in flow with state machine hook (`useCheckIn`), lazy session creation, 4-step UI (loading → mood → prompt → outcome), abandon dialog, auto-complete timer, convert-to-entry. Home screen check-in card with 30-min stale query, optimistic dismiss, pull-to-refresh. Insights dashboard with streak banner, weekly summary, mood anomaly cards, mood trend chart (Skia line), year-in-pixels grid, insight cards with bookmark/dismiss. AI profile settings with prompt style picker, topics to avoid, goals list.

---

## Phase 6 — Onboarding & Home Screen

Post-signup onboarding flow and a home screen that feels alive. The onboarding captures the minimum data needed for personalization while keeping friction low. The home screen becomes the emotional center of the app — a daily snapshot that motivates the user to journal.

### Subphase 6A — Backend: Profile Service & Onboarding State ✅

Wired up the existing `profiles` table with backend service, cache layer, and API endpoints. `handle_new_user()` trigger creates profile row on signup — this subphase built the application layer to read and update it. `onboarding_completed_at` column added to `profiles` migration (NULL = not completed). `ProfileRow`, `ProfileUpdate`, `ProfileResponse` models. `ProfileService` with get/update/complete_onboarding. `CachedProfileService` with Redis TTL-based invalidation. 3 API endpoints (`GET /api/v1/profile`, `PATCH /api/v1/profile`, `POST /api/v1/profile/onboarding-complete`). DI factory. 32 new tests (13 model, 7 service, 12 API route). 615 total backend tests.

### Subphase 6B — Mobile: Onboarding Flow ✅

4-step onboarding flow that appears once after email verification. One-time experience — if the user kills the app or navigates away before completion, it restarts from step 1. Only marked complete when all steps are finished. No local step persistence.

**Completed:**
- `types/profile.ts` — `Profile`, `ProfileUpdate` interfaces
- `services/api/profile.ts` — `getProfile()`, `updateProfile()`, `completeOnboarding()`
- `hooks/useProfile.ts` — `useProfile()` (with `enabled` flag), `useUpdateProfile()` (optimistic), `useCompleteOnboarding()`
- `queryKeys.ts` — `profile` key
- `app/index.tsx` — Root redirect: fetches profile after auth, routes to `/(onboarding)` if `onboarding_completed_at` null, else `/(tabs)`
- `app/(onboarding)/_layout.tsx` — Stack navigator, no header, fade transitions
- `components/onboarding/StepIndicator.tsx` — Animated progress dots (active pill expands, Reanimated)
- `components/onboarding/OnboardingStep.tsx` — Shared step layout (indicator, title, subtitle, content, footer)
- Step 1 (Welcome/Name) — flat text input, Continue writes display_name, Skip proceeds without
- Step 2 (Prompt Style) — reuses `PromptStylePicker` with `showLabel={false}`, writes to AI profile
- Step 3 (Theme) — reuses `ThemePicker` with `showLabel={false}`, instant preview via `themeStore`
- Step 4 (Notifications) — Bell icon, Enable requests permission, both paths call `POST /api/v1/profile/onboarding-complete` then `router.replace("/(tabs)")`
- `showLabel` prop added to `PromptStylePicker` and `ThemePicker` (backward compatible, defaults `true`)
- i18n: `onboarding` namespace with all step strings

### Subphase 6C — Home Screen Enhancements

Transform the home screen from a single check-in card into a daily dashboard with Mood Snapshots as a new primary interaction loop.

- [x] **Time-of-day greeting** — "Good morning, Parthiv" / "Good afternoon" / "Good evening". Uses `profiles.display_name`, gracefully degrades to no name. `greetingUtils.ts` utility, `Greeting` component, current date below greeting. Profile query cached from root index fetch
- [x] **Streak banner** — Already on home screen, uses calendar data directly

#### Mood Snapshots

One-tap mood logging directly from the home screen. No title, no body, no navigation — just tap a mood and it's saved. Creates a new `mood_snapshot` entry type that feeds into the calendar, mood trends, AI context, and weekly summaries automatically. The goal is to increase daily touchpoints from 1 (journal entry) to many, capturing emotional moments throughout the day that the user would never write a full entry for.

**Entry point:** An inline mood strip on the home screen (between greeting and check-in card). 5 mood category pills always visible. Tap a category → sub-emotions slide in below → tap a sub-emotion → done. Or tap the category again to confirm just the category. 2 taps max, 2 seconds.

**Step 1: Backend — `mood_snapshot` entry type ✅**
- [x] Added `MOOD_SNAPSHOT = "mood_snapshot"` to `EntryType` enum in `models/journal.py`
- [x] Created `BODYLESS_ENTRY_TYPES` frozenset (`CHECK_IN`, `MOOD_SNAPSHOT`) — replaces hardcoded `!= EntryType.CHECK_IN` check
- [x] Updated `JournalEntryCreate` body validation: exempt `BODYLESS_ENTRY_TYPES` from body requirement
- [x] Added `mood_snapshot` validation: require `mood_category` when `entry_type` is `mood_snapshot`
- [x] Updated SQL CHECK constraint in `004_JOURNAL_ENTRIES.sql` to include `'mood_snapshot'`
- [x] Exported `BODYLESS_ENTRY_TYPES` from `models/__init__.py`
- [x] 8 new model tests (create with category, with specific, without mood rejected, empty body accepted, body accepted, invalid pair rejected, bodyless set membership, response from row)

**Step 2: Backend — AI context awareness ✅**
- [x] Renamed `_has_check_in_today()` → `_has_engaged_today()` in `prompt_engine.py` — now checks `_ENGAGEMENT_ENTRY_TYPES` frozenset (`check_in`, `mood_snapshot`)
- [x] Verified `insight_computations.py` handles `mood_snapshot` correctly — `Counter(e.entry_type)` is type-agnostic
- [x] 6 new engagement tests + 2 weekly summary tests with mood snapshots
- [x] No changes needed to calendar RPCs — they already aggregate all entries with moods regardless of type

**Step 3: Mobile — types & hook ✅**
- [x] Added `"mood_snapshot"` to `EntryType` union in `types/journal.ts`
- [x] Added `BODYLESS_ENTRY_TYPES` as `ReadonlySet<EntryType>` — mirrors backend frozenset, exported from `types/index.ts`
- [x] Made `body` optional in `JournalEntryCreate` (`readonly body?: string`)
- [x] Created `hooks/useMoodSnapshot.ts` — `useMoodSnapshot()` returns `{ logMood, isLogging, lastSnapshot }`. Auto-selects first journal, creates `mood_snapshot` entry, tracks last log for cooldown UI
- [x] Added `shouldGenerateReflection()` guard in `useEntries.ts` — `useCreateEntry` and `useUpdateEntry` skip reflection for bodyless entry types
- [x] Exported `useMoodSnapshot` from `hooks/index.ts`
- [x] `EntryTypeSelector` confirmed unchanged — `mood_snapshot` not in picker

**Step 4: Mobile — `MoodSnapshotStrip` component ✅**
- [x] `components/home/MoodSnapshotStrip.tsx` — Inline mood strip with 5 category pills (reuses `MoodItem` and `MoodSpecificItem` directly)
- [x] Three-state machine: `idle` → `selecting` → `success` → `idle`
- [x] Two-phase interaction: tap category → sub-emotions slide in with staggered `FadeInDown` → tap sub-emotion → logged
- [x] Category-only confirm: tap selected category again to log without sub-emotion
- [x] Haptic feedback: `notificationAsync(Success)` on specific select, `impactAsync(Light)` on category (via `MoodItem`)
- [x] Success state: checkmark icon + mood label + relative time ("Anxious · 2h ago"), auto-returns to idle after 2s
- [x] Cooldown: after logging, shows last snapshot with "Tap to log again" hint. Tap resets to idle
- [x] Exported from `components/home/index.ts`

**Step 5: Mobile — Home screen integration ✅**
- [x] `MoodSnapshotStrip` added to home screen between `Greeting` and `StreakBanner`
- [x] Pull-to-refresh invalidates entries lists (mood snapshots refresh)
- [x] i18n keys: `home.moodSnapshot.prompt`, `home.moodSnapshot.logged`, `home.moodSnapshot.logAgain`

**Step 6: Mobile — History/Calendar display ✅**
- [x] `MoodSnapshotPill` component — compact inline pill (gradient dot + mood label + relative time) with `Pressable` for navigation
- [x] History screen `renderItem` branches on `entry_type === "mood_snapshot"` → renders `MoodSnapshotPill` instead of `AnimatedEntryCard`
- [x] Calendar day detail shows snapshots alongside full entries (same `useDayEntries` query, branched rendering)
- [x] `MoodSnapshotDetail` component — read-only detail view with large gradient orb, mood label, category, date, location
- [x] Entry detail screen branches: mood snapshots → `MoodSnapshotScreen` (read-only, delete only, no edit form/pin/save)
- [x] Exported from `components/journal/index.ts`

**Design decisions:**
- **Inline, not modal** — The mood strip is always visible on the home screen. No FAB, no bottom sheet, no navigation. Zero friction.
- **Reuse `journal_entries` table** — A mood snapshot is just an entry with `entry_type: "mood_snapshot"`, a mood, and no body. All existing queries, insights, calendar, and AI context include it automatically.
- **Not in entry type picker** — The 4 writing types (Journal, Reflection, Gratitude, Freewrite) stay as-is. Mood snapshots are created exclusively from the home screen strip.
- **Cooldown, not rate limit** — After logging, the strip shows the last snapshot instead of pills. The user can tap to log again anytime. No hard limit, but the visual state change reduces accidental double-taps.
- **Default journal** — Mood snapshots auto-assign to the user's first journal (same as check-in entries). No journal picker needed for a 2-second interaction.

#### Remaining Home Screen Items
- [ ] **Today's mood summary** — Compact card showing moods logged today (from both entries and snapshots)
- [ ] **Recent entries** — Last 2–3 entries (title, mood orb, relative time). Tap navigates to detail
- [ ] **Weekly mood dots** — 7 small dots (Sun–Sat) colored by dominant mood per day, empty for no-entry days

---

## Phase 7 — Production Deployment & Observability

CI/CD pipelines, production Supabase project, monitoring, error tracking, app store submission.

- [ ] Production SMTP — real email delivery (SendGrid, Postmark, or SES), custom templates
- [ ] Token revocation — Redis-based token blacklist for immediate invalidation on sign-out
- [ ] API gateway rate limiting
- [ ] CORS production configuration
- [x] CI/CD pipelines — GitHub Actions: lint workflow (backend format-check + lint + typecheck, mobile typecheck + lint, docs build), test workflow (pytest with coverage → SonarCloud). All jobs use `just` commands
- [ ] Error tracking — Sentry integration for backend and mobile
- [ ] Log aggregation — structured log shipping
- [ ] Performance budgets — bundle size limits, API response time targets
- [ ] App store submission — iOS App Store and Google Play Store
- [ ] Network resilience — offline detection, retry logic, offline indicator in UI
