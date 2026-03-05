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
- [ ] **4G-10** — Create Journal screen (name + color picker + optional description, modal presentation)
- [ ] **4G-11** — Journal management screen (settings → manage journals, edit/delete/reorder)
- [ ] **4G-12** — Journal indicator on entry cards and detail screen

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

#### Radial Create Menu ✅

Replaced the direct-navigate + button with a radial arc menu that opens two creation paths: "Journal" (new journal space) and "Entry" (new journal entry). The + button previously navigated straight to `/entry/create` — now it opens a glassmorphic semicircular menu above the tab bar.

- [x] **`CreateMenu` component** — Skia-drawn annular sector (semicircle from 180°→360°) with glassmorphism layering: glass fill → accent gradient overlay → blurred glow stroke → crisp glass border. Radial divider line splits the arc into two segments
- [x] **Radial sweep animation** — Pre-computed 61-frame SVG path lookup table (`arcPath.ts`). `useDerivedValue` worklet indexes into frames based on progress. Arc sweeps open radially (not linearly) in 280ms with `Easing.out(cubic)`, closes in 200ms. Items fade in staggered as the sweep passes their angular position
- [x] **`CreateTabButton` update** — + icon spring-rotates 45° into × when menu is open. `isMenuOpen` prop
- [x] **`CreateMenuItem` component** — Pressable items positioned along the arc midline radius at evenly spaced angles. Haptic feedback on tap
- [x] **Backdrop dismiss** — Full-screen backdrop with `onPress` dismiss. Menu container uses `pointerEvents="box-none"` so taps on empty space pass through to backdrop
- [x] **i18n** — `createMenu.newEntry`, `createMenu.newJournal` translation keys
- [x] **"Entry" wired** — Navigates to `/entry/create` (existing flow)
- [x] **"Journal" placeholder** — Closes menu, ready to wire to Create Journal screen (4G-10)

**File structure:** `components/ui/TabBar/CreateMenu/` — `CreateMenu.tsx`, `CreateMenuItem.tsx`, `arcPath.ts`, `styles.ts`, `types.ts`, `index.ts`

#### Remaining Home Screen Items
- [ ] **Today's mood summary** — Compact card showing moods logged today (from both entries and snapshots)
- [ ] **Recent entries** — Last 2–3 entries (title, mood orb, relative time). Tap navigates to detail
- [ ] **Weekly mood dots** — 7 small dots (Sun–Sat) colored by dominant mood per day, empty for no-entry days

---

## Phase 7 — Wellness & Mini-Games

Interactive wellness features that give users a place to calm down and decompress. Starting with breathing exercises, expanding to ambient mini-games (terrarium, gentle glide, idle yard) in future iterations.

### Subphase 7A — Breathing Exercise ✅

Full-screen guided breathing exercise with shader-based animated orb, haptic transitions, session persistence, and phase-aware easing. Three patterns: Box Breathing (4-4-4-4), 4-7-8, and Calm (4-6).

**Step 1: Database migration ✅**
- [x] `supabase/migrations/009_BREATHING_SESSIONS.sql` — `breathing_sessions` table (id, user_id, pattern, duration_seconds, cycles_completed, cycles_target, mood_before, mood_after, completed, created_at). RLS policies. Index on (user_id, created_at desc)

**Step 2: Backend models & service ✅**
- [x] `models/breathing.py` — `BreathingPattern` (StrEnum), `BreathingSessionRow`, `BreathingSessionCreate`, `BreathingSessionUpdate`, `BreathingSessionResponse` (with `from_row()`), `BreathingStatsResponse`
- [x] `services/breathing.py` — `BreathingService`: `create()`, `complete()`, `get_stats()`, `list_recent()`

**Step 3: Backend API routes, DI & tests ✅**
- [x] `api/v1/breathing.py` — `POST /sessions`, `PATCH /sessions/{id}`, `GET /stats`, `GET /sessions`
- [x] `api/deps.py` — `get_breathing_service` factory
- [x] `api/router.py` — Wire breathing router
- [x] Backend tests for models, service, and routes

**Step 4: Mobile types & API client ✅**
- [x] `types/breathing.ts` — TypeScript interfaces: `BreathingPatternId`, `BreathingPhase`, `BreathingSession`, `BreathingStats`, `BreathingPhaseConfig`, `BreathingPatternConfig`
- [x] `lib/breathingPatterns.ts` — Pattern definitions (phases, durations per phase, cycle counts per session length). `getBreathingPattern()`, `computeCycleCount()`, `computeSessionDuration()`
- [x] `services/api/breathing.ts` — API client functions
- [x] `hooks/useBreathingSessions.ts` — TanStack Query hooks: `useBreathingStats`, `useBreathingSessions`, `useCreateBreathingSession`, `useUpdateBreathingSession`

**Step 5: Core breathing hook ✅**
- [x] `hooks/useBreathing.ts` — Timer state machine: `idle` → `inhale` → `hold` → `exhale` → `rest` → cycle or `complete`. Exposes `phase`, `phaseSignal` (SharedValue for stutter-free UI thread animation), `phaseIndex`, `phaseCount`, `progress` (SharedValue 0→1), `currentCycle`, `totalCycles`, `isActive`, `start()`, `pause()`, `resume()`, `stop()`. Phase-aware easing: inhale uses `Easing.out(cubic)`, exhale uses `Easing.in(cubic)`, hold/rest use linear. Resume uses linear for remaining fraction to avoid easing discontinuity

**Step 6: Breathing UI components ✅**
- [x] `components/breathing/BreathingOrb/` — Shader-based animated orb replacing flat circle:
  - `shader.ts` — SkSL runtime shader with organic wobble distortion, core-to-edge gradient, soft glow halo, circular boundary fade (no square clipping)
  - `colors.ts` — `hexToShaderColor()` utility converting hex to float4 shader uniforms
  - `BreathingOrb.tsx` — Drives shader uniforms from `phaseSignal` SharedValue (no React prop dependency, zero-stutter phase transitions). Continuous wobble via `withRepeat` time loop with proper `cancelAnimation` cleanup
  - `ProgressRing.tsx` — Skia arc-based session progress ring (phase-granular: `completedCycles * phaseCount + phaseIndex`). Updates on React re-renders (phase transitions), positioned absolutely over orb
  - `types.ts`, `index.ts` — Typed props, barrel exports
- [x] `components/breathing/BreathingPhaseLabel.tsx` — "Inhale" / "Hold" / "Exhale" / "Rest" text with Reanimated fade transitions
- [x] `components/breathing/BreathingPatternPicker.tsx` — Pattern selection (Box, 4-7-8, Calm) with Skia gradient pills and descriptions
- [x] `components/breathing/BreathingDurationPicker.tsx` — Session length selector (1 min, 3 min, 5 min)
- [x] `components/breathing/BreathingProgress.tsx` — Cycle counter ("3 of 8")
- [x] `components/breathing/BreathingComplete.tsx` — Completion screen with success animation, optional mood selector, done button

**Step 7: Breathing screen & i18n ✅**
- [x] `app/breathing.tsx` — Route screen: 3-step flow (setup → exercise → complete). Haptic pulse on phase transitions (`expo-haptics`). Ambient background reuse. Session persistence (create on start, update on stop/complete with cycles and mood)
- [x] `lib/i18n/locales/en.ts` — `breathing.*` namespace (patterns, phases, durations, completion, progress)

**Step 8: Home screen entry point ✅**
- [x] `components/home/BreathingCard.tsx` — Breathing card on home screen alongside check-in card
- [x] "Need a moment? Try breathing" link on check-in outcome screen (`CheckInOutcome.tsx`)

### Subphase 7A+ — Animation Library Foundation & Cleanup ✅

Shared animation infrastructure extracted from breathing work. Reusable across all Skia/Reanimated components.

- [x] `lib/animation/useCanvasSize.ts` — Hook returning `{ size, onLayout, hasSize }` for Skia Canvas sizing. Refactored into 10 components (StreakBanner, AmbientBackground, GradientBackground, MoodItem, MoodSpecificItem, PromptStylePicker/StylePill, DaySelector/DayPill, FrequencyPicker/FrequencyPill, MoodAccent, YearInPixels)
- [x] `lib/animation/worklets.ts` — `lerp()` worklet-tagged linear interpolation. Used by BreathingOrb
- [x] `lib/animation/index.ts` — Barrel exports for `useCanvasSize`, `CanvasSize`, `UseCanvasSizeReturn`, `lerp`
- [x] Missing `cancelAnimation` cleanup added to `Skeleton.tsx` and `CheckInOutcome.tsx` useEffect returns

### Subphase 7B — Gentle Drift

Full-screen, no-score, no-failure calm experience inspired by Alto's Odyssey Zen Mode. A small silhouette glides across a looping landscape with layered parallax terrain, a cycling day/night sky, and ambient audio. Touch to descend, release to rise. No obstacles that punish — soft auto-correct on terrain contact. Sessions are 3 minutes by default with an option to keep drifting. Zero backend dependencies — purely a mobile-side feature.

**Visual target:** Alto's Odyssey silhouette aesthetic — flat color layers, gradient sky, minimal detail. Monument Valley's color palette meets Alto's parallax depth. 3 terrain layers (darkest foreground, lightest background), procedural star field at night, sun/moon disc at horizon, subtle wind-streak particles.

**Architecture: Hybrid rendering (revised from shader-only after peer review)**
- **Sky:** Skia `LinearGradient` fill with 4-phase color interpolation (no shader needed for gradient alone)
- **Stars:** 50-150 Skia `Circle` elements with precomputed positions, opacity driven by `dayProgress`. Geometry-based, not per-pixel hash — cheaper and safer than shader noise
- **Sun/moon disc:** Skia `Circle` with radial gradient, position/opacity tied to `dayProgress`
- **Terrain layers:** 3 Skia `Path` fills, **generated once at mount** and translated with `-(scrollX % loopWidth)`. Two copies of each Path drawn (at `x` and `x + loopWidth`) for seamless wrap with zero recomputation. Terrain height from integer-harmonic sine waves guaranteeing exact loop: `y(x) = Σ aᵢ * sin(2π * kᵢ * x / loopWidth + φᵢ)` where each `kᵢ` is an integer
- **Player:** Skia `Circle` or simple `Path` silhouette, Y-position clamped to terrain height with **hover margin** (~8-12px above surface) and short easing spring on contact for a floating feel (not sticky ground scraping)
- **Particles:** Skia `Line` elements with SharedValue positions for wind streaks
- **Why hybrid:** Full-screen fragment shader computing 3 terrain layers + stars + particles = ~44M math ops/frame on iPhone 14. The breathing orb shader works because it's a small circle with simple math. Hybrid keeps sky as geometry fills and terrain as Path geometry computed at ~300 points per layer, not millions of pixels

**Day/night cycle — four-phase model:**
- 0.00 = dawn, 0.25 = day, 0.50 = dusk, 0.75 = night, 1.00 = dawn (wrap)
- Stars fade in 0.6→0.75, full opacity 0.75→0.9, fade out 0.9→1.0
- Terrain tint interpolates across all four phases (warm brown → cool blue → deep navy → warm brown)
- Full cycle duration: 90 seconds

**Tech stack (zero new dependencies):**

| Dependency | Purpose | Status |
|---|---|---|
| `@shopify/react-native-skia` 2.2.12 | Canvas, SkSL shader, Path, Circle | ✅ Installed |
| `react-native-reanimated` ~4.1.1 | SharedValues for scroll/player/day cycle | ✅ Installed |
| `react-native-gesture-handler` ~2.28.0 | `Gesture.Pan().minDistance(0)` for immediate press/release | ✅ Installed |
| `expo-av` ~16.0.8 | Ambient audio loop (already used for voice memos) | ✅ Installed |
| `expo-haptics` | Session start/end haptics | ✅ Installed |

**Hard scope boundaries (what this is NOT):**
- No backend API endpoints, no database tables, no session persistence
- No multiple biomes/themes (one scene, one palette cycle)
- No scoring, coins, collectibles, or progression
- No procedural terrain generation (deterministic sine-wave composition, looping)
- No collision physics (soft visual clamp only)

**Step 1: Scene infrastructure — `lib/drift/`**
- [ ] `types.ts` — `DriftConfig`, `DriftPhase` (`"idle" | "drifting" | "ending"`), `DriftSessionResult`, `TerrainLayerConfig` (harmonics array, amplitude, parallax factor, tint)
- [ ] `terrainCurve.ts` — Worklet-friendly pure math for terrain height. **Integer-harmonic sine waves** guaranteeing exact loop: `y(x) = Σ aᵢ * sin(2π * kᵢ * x / loopWidth + φᵢ)` where each `kᵢ` is an integer. Single source of truth for both Path generation (at mount) and player Y clamp (per frame). `getTerrainHeight(x, layerConfig, loopWidth)` and `generateTerrainPath(canvasWidth, canvasHeight, layerConfig, loopWidth, pointCount)` — Path generated once, never recomputed
- [ ] `dayNightCycle.ts` — `getSkyColors(dayProgress)` (4-phase gradient endpoints), `getTerrainTint(dayProgress, layerIndex)` (silhouette color per phase per layer), `getStarOpacity(dayProgress)`, `getSunMoonPosition(dayProgress, canvasHeight)`. Piecewise interpolation across dawn/day/dusk/night
- [ ] `driftConfig.ts` — Default constants: scroll speed (px/sec), terrain harmonics per layer (integer `k` values + amplitudes + phases), parallax depth ratios (back 0.3x, mid 0.6x, front 1.0x), player gravity/buoyancy, hover margin (8-12px), day cycle 90s, session default 3 min, terrain loop width, star count (100)

**Step 2: Sky rendering — geometry-based (no shader)**
- [ ] Sky gradient: Skia `LinearGradient` fill with color stops from `getSkyColors(dayProgress)`. 4-phase interpolation (dawn peach→blue, day pale blue→white, dusk orange→purple, night navy→black). Colors update via `useDerivedValue` driven by `dayProgress`
- [ ] Stars: 100 Skia `Circle` elements with positions precomputed once at mount (seeded pseudo-random). Opacity driven by `getStarOpacity(dayProgress)` — geometry-based, not per-pixel shader hash. Varying radii (0.5-2px) for depth
- [ ] Sun/moon disc: Skia `Circle` with `RadialGradient` fill. Position from `getSunMoonPosition(dayProgress, canvasHeight)` — rises/sets at horizon. Opacity fades at dawn/dusk transitions

**Step 3: Game hook — `hooks/useDrift.ts`**
- [ ] State machine: `idle` → `drifting` → `ending` → `idle`
- [ ] **Single `time` SharedValue** as the only continuously running animation: `withRepeat(withTiming(...))`. All other scene values derived from it to eliminate drift between independent animations:
  - `scrollX` = `useDerivedValue(() => (time.value * scrollSpeed) % loopWidth)`
  - `dayProgress` = `useDerivedValue(() => (time.value % cycleDurationSec) / cycleDurationSec)`
- [ ] `playerY` SharedValue: touch down → `withTiming` toward ground (`Easing.out(cubic)`), touch up → `withTiming` toward sky (`Easing.in(cubic)`). Clamped to terrain height at player's fixed X with hover margin (~8-12px above surface) + short easing spring on contact
- [ ] `isTouching` SharedValue (0 or 1): driven by gesture handler
- [ ] Session timer: **wall-clock timestamps** (not `setTimeout`) with `AppState` listener for pause/resume on backgrounding. `startWallTime` stored, elapsed computed as `now - start` on each check. Audio and animation pause on background, resume on foreground
- [ ] **Reduce motion:** Check `AccessibilityInfo.isReduceMotionEnabled` — if true, reduce particle count, slow parallax, soften transitions
- [ ] Returns: `{ phase, playerY, scrollX, dayProgress, elapsed, start, stop }`
- [ ] **SharedValues total: 3** (`time`, `playerY`, `isTouching`). `scrollX` and `dayProgress` are derived, not independent

**Step 4: Scene component — `components/drift/DriftScene/`**
- [ ] `DriftScene.tsx` — Full-screen `<Canvas>` with:
  - `<Rect>` with `<LinearGradient>` for sky background (colors from `getSkyColors(dayProgress)`)
  - `<Circle>` with `<RadialGradient>` for sun/moon disc
  - 100 `<Circle>` elements for stars (precomputed positions, opacity from `dayProgress`)
  - 6 `<Path>` fills for terrain (2 copies × 3 layers for seamless wrap), translated by `-(scrollX % loopWidth) * parallaxFactor`
  - `<Circle>` or simple `<Path>` for player silhouette at `(fixedX, playerY)`
  - `<Line>` elements for wind-streak particles
- [ ] `GestureDetector` wrapping canvas: `Gesture.Pan().minDistance(0)` for immediate down/up. `hitSlop` margins on left edge to avoid conflict with iOS back-swipe gesture
- [ ] `useCanvasSize` from `lib/animation/` for responsive sizing
- [ ] Dev-only FPS overlay + quality toggles (layer count, particles on/off, stars on/off) — built from day one for cross-device profiling

**Step 5: Audio — `hooks/useDriftAudio.ts`**
- [ ] `useDriftAudio()` — loads and loops a single ambient audio file via `expo-av`
- [ ] Fade in on session start, fade out on session end
- [ ] Volume updates **throttled to phase boundaries** (dawn/day/dusk/night transitions), not per-frame
- [ ] Audio mode: `Audio.setAudioModeAsync({ playsInSilentModeOnIOS: false, staysActiveInBackground: false, shouldDuckAndroid: false, interruptionModeIOS: InterruptionModeIOS.MixWithOthers })` — respects silent switch, mixes with user's music, no ducking, stops on background
- [ ] Pauses on `AppState` background, resumes on foreground
- [ ] Audio asset: single royalty-free ambient loop (~30-60s), stored in `assets/audio/`

**Step 6: UI chrome — `components/drift/`**
- [ ] `DriftTimer.tsx` — Elapsed time (top-right, semi-transparent). "2:34" format. **Updates at 1Hz** via `setInterval`, not per-frame — avoids re-render jank from rapidly changing text
- [ ] `DriftControls.tsx` — "End Session" button (bottom, semi-transparent pill)
- [ ] `DriftMoodPicker.tsx` — Post-session mood selector (reuses existing `MoodItem` components). Before/after mood capture. Not persisted to backend — reflective moment only

**Step 7: Screen & integration — `app/drift.tsx`**
- [ ] Thin route screen: 2-step flow (`"ready"` → `"drifting"` → `"complete"`)
- [ ] Ready: "Tap to begin" overlay with ambient background
- [ ] Drifting: full-screen DriftScene, minimal chrome
- [ ] Complete: fade to mood picker → "How do you feel?" → done → `router.back()`
- [ ] Haptic on session start (`impactAsync(Light)`) and end (`notificationAsync(Success)`)
- [ ] i18n: `drift.*` namespace

**Step 8: Home screen entry point**
- [ ] `DriftCard` on home screen alongside breathing card
- [ ] "Need a moment?" link on check-in outcome screen gets second option: "Try drifting"

**File structure:**
```
apps/mobile/
├── lib/drift/
│   ├── types.ts
│   ├── terrainCurve.ts
│   ├── dayNightCycle.ts
│   ├── driftConfig.ts
│   └── index.ts
├── hooks/
│   ├── useDrift.ts
│   └── useDriftAudio.ts
├── components/drift/
│   ├── DriftScene/
│   │   ├── DriftScene.tsx
│   │   ├── types.ts
│   │   └── index.ts
│   ├── DriftTimer.tsx
│   ├── DriftControls.tsx
│   ├── DriftMoodPicker.tsx
│   └── index.ts
├── app/
│   └── drift.tsx
└── assets/audio/
    └── drift-ambient.mp3
```

**Performance budget:**
- Target: 60fps sustained on iPhone 12+ and equivalent Android
- SharedValues: 3 total (`time`, `playerY`, `isTouching`). `scrollX` and `dayProgress` are derived via `useDerivedValue`. Zero `useAnimatedStyle` calls. Lighter than breathing orb.
- Terrain: 6 Skia Paths (2 copies × 3 layers) at ~300 points each, generated once at mount. Translation only per frame.
- Sky: `LinearGradient` fill + 100 `Circle` elements (stars) + 1 `Circle` (sun/moon). All geometry, no shader.
- Timer: 1Hz `setInterval` update, not per-frame re-render.
- Audio: single `expo-av` instance, looping. Negligible CPU.
- Memory: no images loaded. Pure Skia geometry.

**QA validation matrix:**

| Device class | Target | Pass criteria |
|---|---|---|
| iPhone 12/13/14 | 60fps sustained | No frame drops during 3-min session |
| Mid Android (Pixel 7a / Samsung A54) | 55+ fps sustained | Acceptable with quality toggle fallback |
| Low Android (if supported) | 30+ fps | Reduced particles, 2 terrain layers |

Pass/fail for all: no gesture latency, no audio glitches on background/foreground transitions, seamless terrain wrap.

**Estimated effort:** 6-8 focused sessions. Terrain math + Path generation is the most complex piece. Everything else follows patterns established in breathing exercise.

### Subphase 7C — Terrarium (future, post-Drift)

Persistent calm garden tied to journaling activity. Deferred until Drift ships and user engagement data validates the mini-game approach. Requires backend persistence (Supabase tables), content pipeline (species, growth stages), and careful product design to avoid guilt mechanics.

### Subphase 7D — Idle Yard (future, post-Terrarium)

Place attractors, return later to find visitors. Memory card collection. Deferred until Terrarium validates persistent calm experiences.

---

## Phase 8 — Production Deployment & Observability

CI/CD pipelines, production Supabase project, monitoring, error tracking, app store submission.

- [ ] Production SMTP — real email delivery (SendGrid, Postmark, or SES), custom templates
- [x] Token revocation — Redis-based session blacklist for immediate JWT invalidation on sign-out. `TokenBlacklistService` uses Redis `SETEX`/`EXISTS` with TTL matching token expiry (auto-cleanup, no cron). `session_id` claim added to `UserPayload`. Blacklist check integrated into `get_current_user` DI dependency (single `EXISTS` per authenticated request). `POST /api/v1/auth/sign-out` endpoint revokes the session. Fail-open on Redis unavailability. Mobile: `signOutFromBackend(token)` fires best-effort before `supabase.auth.signOut()`, raw `fetch` to avoid 401→signOut recursion, token captured before state teardown. 18 new backend tests, 708 total
- [x] API rate limiting — Sliding window rate limiter via Redis sorted sets + atomic Lua script. Pure ASGI middleware (not BaseHTTPMiddleware). 3-tier hierarchy: IP (120/min) → User (60/min) → Route-specific (write: 30/min, search: 20/min, AI: 10/min, media upload: 10/min). Fail-open on Redis unavailability. Singleton `RateLimitService` on `AppState`. Lightweight JWT `sub` extraction for user keying. `X-RateLimit-*` response headers on all requests. Mobile: `ApiError.isRateLimited` getter, `Retry-After` header parsing, 429-aware query retry with backoff. 48 new backend tests, 690 total
- [ ] CORS production configuration
- [x] CI/CD pipelines — GitHub Actions: lint workflow (backend format-check + lint + typecheck, mobile typecheck + lint, docs build), test workflow (pytest with coverage → SonarCloud). All jobs use `just` commands
- [ ] Error tracking — Sentry integration for backend and mobile
- [ ] Log aggregation — structured log shipping
- [ ] Performance budgets — bundle size limits, API response time targets
- [ ] App store submission — iOS App Store and Google Play Store
- [ ] Network resilience — offline detection, retry logic, offline indicator in UI

### JWKS Auto-Refresh — Critical Auth Resilience

**Problem:** The JWKS key store (`core/jwks.py`) loads signing keys from Supabase exactly once at startup via `jwks_store.load()` in `main.py`'s lifespan. There is no periodic refresh and no cache-miss retry. When Supabase rotates its JWT signing keys (routine during upgrades, restarts, or configuration changes), the backend will hold stale keys. New ES256-signed JWTs will carry a `kid` not present in the store, causing `_decode_with_jwks()` to return `None`. The HS256 fallback then attempts to verify an ES256-signed token with the HS256 secret, which fails with `InvalidSignatureError` — resulting in 401 for every authenticated request until the backend is restarted.

**Impact:** Complete authentication outage for all users after any Supabase key rotation event. No user action can resolve it — requires backend restart.

**Root cause trace:**
1. `jwks_store` is a module-level singleton (`core/jwks.py:38`)
2. `load()` called once in `lifespan()` (`main.py:38`)
3. `_decode_with_jwks()` (`security.py:41`) — `get_key(kid)` returns `None` for unknown `kid` → returns `None`
4. `verify_jwt()` (`security.py:76–77`) — `None` result triggers `_decode_with_secret()` HS256 fallback
5. HS256 decode of an ES256-signed token → `InvalidSignatureError` → `InvalidTokenError` → HTTP 401

**Fix — two complementary strategies (both required):**

**Strategy A: Cache-miss reload (immediate recovery)**

When `_decode_with_jwks()` encounters a `kid` not in the store, attempt a single JWKS reload before giving up. This provides instant recovery on the first request after key rotation, with no background task needed.

- [ ] **`JWKSKeyStore` — add async `reload_if_missing(kid, supabase_url)` method** — If `get_key(kid)` returns `None` and a reload hasn't been attempted within a cooldown window (e.g., 30s), call `load()` and retry `get_key(kid)`. Use an `asyncio.Lock` to prevent thundering herd (concurrent requests all triggering reloads). Store `_last_reload_attempt: float` to enforce the cooldown. Return the key or `None` if still not found after reload.
- [ ] **`JWKSKeyStore` — store `_supabase_url` from initial `load()` call** — The reload method needs the URL but shouldn't require it as a parameter on every call. Store it as instance state during the first `load()`.
- [ ] **`security.py` — convert `_decode_with_jwks()` to async** — Currently synchronous. Must become `async` to call `reload_if_missing()`. This means `verify_jwt()` also becomes `async`.
- [ ] **`api/deps.py` — update `get_current_user()`** — Already `async`, so calling `await verify_jwt()` is a minimal change.
- [ ] **Update all test call sites** — `tests/core/test_security.py` calls `verify_jwt()` synchronously. All calls must become `await verify_jwt()`.

**Strategy B: Background periodic refresh (proactive freshness)**

A background `asyncio.Task` that refreshes the JWKS store on a fixed interval (e.g., every 5 minutes). This ensures the store stays warm even if no cache-miss occurs, and handles the case where Supabase adds new keys before the old ones expire.

- [ ] **`JWKSKeyStore` — add `start_background_refresh(supabase_url, interval_seconds)` and `stop_background_refresh()`** — Spawns an `asyncio.Task` that loops: `await asyncio.sleep(interval)` → `await load()` (with try/except to log and continue on failure). Stores the task handle for cancellation.
- [ ] **`config.py` — add `jwks_refresh_interval_seconds: int = 300`** — Configurable refresh interval, default 5 minutes.
- [ ] **`main.py` lifespan — start background refresh after initial load, cancel on shutdown** — `await jwks_store.load(...)` then `jwks_store.start_background_refresh(...)` in startup. `jwks_store.stop_background_refresh()` before `close_redis_pool()` in shutdown.

**Tests:**

- [ ] **`tests/core/test_jwks.py`** — New test file:
  - `test_load_populates_keys` — Mock httpx response with JWKS JSON, verify `get_key()` returns the key
  - `test_load_clears_old_keys` — Load once, load again with different keys, verify old keys gone
  - `test_get_key_unknown_kid_returns_none` — After load, request unknown `kid`
  - `test_is_loaded_false_initially` — Before any `load()` call
  - `test_is_loaded_true_after_load` — After successful `load()`
  - `test_load_failure_preserves_existing_keys` — Load successfully, then load with failing HTTP, verify old keys still present
  - `test_reload_if_missing_fetches_new_key` — Load with key A, request key B (miss), mock reload returns key B, verify found
  - `test_reload_if_missing_respects_cooldown` — Two rapid misses, verify only one HTTP call
  - `test_reload_if_missing_concurrent_requests_single_fetch` — Multiple concurrent `reload_if_missing()` calls, verify single HTTP request via lock
  - `test_background_refresh_calls_load_periodically` — Start with short interval, verify `load()` called multiple times
  - `test_background_refresh_survives_load_failure` — Inject failure, verify task continues and next iteration succeeds
  - `test_stop_background_refresh_cancels_task` — Start then stop, verify task is cancelled
- [ ] **`tests/core/test_security.py`** — Add key rotation scenarios:
  - `test_unknown_kid_triggers_reload_and_succeeds` — ES256 token with new `kid`, mock reload returns matching key
  - `test_unknown_kid_reload_fails_falls_back_to_hs256` — ES256 token with new `kid`, reload fails, HS256 fallback attempted
  - `test_verify_jwt_is_async` — Verify the function is a coroutine

**Files touched:**

| File | Change |
|------|--------|
| `core/jwks.py` | Add `_supabase_url`, `_last_reload_attempt`, `_reload_lock`, `reload_if_missing()`, `start_background_refresh()`, `stop_background_refresh()`. Update `load()` to store URL. |
| `core/security.py` | Make `_decode_with_jwks()` and `verify_jwt()` async. Call `await jwks_store.reload_if_missing()` on cache miss. |
| `config.py` | Add `jwks_refresh_interval_seconds: int = 300` |
| `main.py` | Start background refresh in lifespan startup, stop in shutdown. |
| `api/deps.py` | `await verify_jwt()` (already in async context, minimal change) |
| `tests/core/test_jwks.py` | New file — 12+ tests for reload, cooldown, concurrency, background refresh |
| `tests/core/test_security.py` | Update existing tests to `await`, add key rotation tests |
| `AGENT_CONTEXT.md` | Update JWKS description to reflect auto-refresh behavior |
