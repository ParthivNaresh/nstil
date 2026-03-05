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

### Subphase 7B — Gentle Drift 🔄

Full-screen, no-score, no-failure calm experience inspired by Alto's Odyssey Zen Mode. A silhouette glides across a looping landscape with layered parallax terrain, a cycling day/night sky, and ambient audio. Touch to descend, release to rise. Zero backend dependencies — purely a mobile-side feature.

**Visual target:** Alto's Odyssey silhouette aesthetic — flat color layers, gradient sky, minimal detail. Monument Valley's color palette meets Alto's parallax depth. 5-6 terrain layers with atmospheric perspective, procedural star field at night, separate sun/moon discs, paraglider silhouette, water surface at bottom.

**Architecture:** Hybrid Skia rendering — sky as `LinearGradient`, terrain as `Path` geometry (generated once at mount, translated per frame), stars as `Circle` elements, player as `Path` silhouette. All animation driven by 3 SharedValues (`time`, `playerY`, `isTouching`) with `scrollX` and `dayProgress` derived. Zero new dependencies.

#### Steps 1–8: Core Implementation ✅

Built the full feature end-to-end: scene infrastructure (`lib/drift/` — types, terrain math, day/night cycle, config), sky rendering (gradient + stars + celestial disc), game hook (`useDrift` — state machine, SharedValues, wall-clock timer, AppState, reduce-motion), scene compositor (`DriftScene/` — 6 sub-components with gesture handling), audio (`useDriftAudio` — fade in/out, phase-boundary volume, AppState pause/resume), UI chrome (timer, controls, mood picker, ready overlay), route screen (`app/drift.tsx` — ready → drifting → complete), and home screen integration (DriftCard + check-in outcome links). All i18n via `drift.*` namespace.

**Files created:** `lib/drift/` (5 files), `hooks/useDrift.ts`, `hooks/useDriftAudio.ts`, `components/drift/` (10 files), `components/home/DriftCard.tsx`, `app/drift.tsx`, `assets/audio/drift-ambient.wav`

**Files modified:** `lib/i18n/locales/en.ts`, `components/home/index.ts`, `components/checkIn/CheckInOutcome.tsx`, `app/(tabs)/index.tsx`, `hooks/index.ts`

#### Step 9: Fix gesture handling & movement model ✅

Three bugs fixed: gesture reliability, binary movement, and canvas height mismatch.

**Fix A — Gesture:** Replaced `onBegin`/`onFinalize` with `onTouchesDown`/`onTouchesUp`/`onTouchesCancelled` raw touch callbacks. These fire reliably on every finger down/up regardless of Pan gesture state machine lifecycle (fixes iOS 26 + RNGH 2.28 bug where `onFinalize` doesn't fire for taps without drag). Removed `.runOnJS(true)` — all callbacks run as worklets on UI thread.

**Fix B — Physics movement:** Replaced binary `withTiming` toggle (animate to top/bottom) with per-frame velocity-based physics. `useAnimatedReaction` watches `time.value` (already animated linearly), computes `dt`, smoothly interpolates `velocityY` toward `targetVy` (gravity when touching, -buoyancy when not) using exponential smoothing (`tau = 0.15s`), integrates `playerY += velocityY * dt`, clamps to bounds. Uses existing `player.gravity` (120) and `player.buoyancy` (80) config values that were previously dead code. Added `clamp` worklet to `lib/animation/worklets.ts`.

**Fix C — Canvas height:** Eliminated `CANVAS_FALLBACK_HEIGHT = 600`. `useDrift()` now takes no parameters and owns a `canvasHeight` SharedValue. `DriftScene` writes measured height via `onLayout` callback. Physics loop guards on `canvasHeight.value > 0`.

**Files changed:** `hooks/useDrift.ts`, `components/drift/DriftScene/DriftScene.tsx`, `components/drift/DriftScene/types.ts`, `app/drift.tsx`, `lib/animation/worklets.ts`, `lib/animation/index.ts`, `hooks/useDriftAudio.ts` (added catch for placeholder audio crash)

#### Step 10: Fix celestial bodies — sun visible during night ✅

**Problem:** `getSunMoonPosition` treated sun/moon as a single object with no phase-gating. The disc was always visible — opacity only faded at arc endpoints (first/last 10%), not based on day phase.

**Files changed:** `lib/drift/dayNightCycle.ts`, `components/drift/DriftScene/CelestialDisc.tsx`, `components/drift/DriftScene/DriftScene.tsx`, `components/drift/DriftScene/types.ts`, `lib/drift/index.ts`

- [x] Split `getSunMoonPosition` into `getSunPosition` (visible p=0.0→0.5) and `getMoonPosition` (visible p=0.5→1.0) with hard phase-gating (returns opacity 0 outside range) and 8% arc-progress fade at boundaries
- [x] Sun: 55px body, 95px glow, 150px atmospheric bleed layer (very low opacity `#FFF8E718`). Warm white core `#FFFDF5`. Peak at 12% canvas height
- [x] Moon: 22px body, 38px glow. Cool silver `#E0E8F0`. Peak at 18% canvas height. Max opacity 85%
- [x] `CelestialBody` type (`"sun" | "moon"`) added to `types.ts`. `CelestialDiscProps` takes `body` prop. Two `CelestialDisc` instances rendered in `DriftScene.tsx`
- [x] Removed `getSunMoonPosition` from barrel export, added `getSunPosition` and `getMoonPosition`

**Future polish (deferred):**
- [ ] Sun horizon color shift — warm orange/red tint near horizon (low arc progress), transitioning to bright white at peak. Lerp sun core color based on `arcProgress`
- [ ] Moon surface detail — subtle crater-like darker patches via overlapping semi-transparent `Circle` elements offset from center, or a noise-based SkSL shader
- [ ] Sun corona rays — 4-6 faint radial `Line` elements extending from sun body, slowly rotating via `time` SharedValue
- [ ] Moon phase — crescent shadow overlay that shifts across the lunar cycle (could tie to real date or drift session count)

#### Step 11: Terrain overhaul — mountains, not sine waves

**Problem:** 3 layers with conservative harmonics (max k=7, max amplitude 35) produce smooth undulating dunes. Layers are crammed between 55-75% of canvas height with nearly identical character. Tint colors are muddy browns/navies with inverted atmospheric perspective (far=dark, near=light).

**Files:** `lib/drift/types.ts`, `lib/drift/terrainCurve.ts`, `lib/drift/driftConfig.ts`, `lib/drift/dayNightCycle.ts`, `components/drift/DriftScene/TerrainLayers.tsx`

**A) Dynamic atmospheric perspective (tint generation):**
- [ ] Replace static per-layer `tints` with dynamic computation: `getTerrainTint` computes tint as `lerpColor(skyBottom, nearSilhouette, depth)` where `depth` is the layer's `depthFactor` (0=far/sky-colored, 1=near/dark silhouette)
- [ ] Define per-phase near-silhouette colors (dawn: dark warm brown, day: dark navy, dusk: deep indigo, night: near-black blue)
- [ ] Remove `tints` from `TerrainLayerConfig`, add `depthFactor: number` (0→1, far→near)
- [ ] `getTerrainTint(dayProgress, depthFactor)` signature — uses `getSkyColors(dayProgress).bottom` as fog target, lerps toward near-silhouette

**B) Layer count & spread (5 layers):**
- [ ] baseHeight spread: 0.48 → 0.58 → 0.68 → 0.78 → 0.86
- [ ] parallax spread: 0.12 → 0.25 → 0.45 → 0.70 → 1.0
- [ ] depthFactor spread: 0.0 → 0.25 → 0.50 → 0.75 → 1.0
- [ ] Each layer gets unique harmonic signature — different k values, different phase offsets

**C) Terrain shape (ridge shaping + x-warp):**
- [ ] Ridge shaping in `getHarmonicHeight`: normalize sine sum to [-1,1], apply `ridge = 1 - abs(normalized)`, blend with original via per-layer `ridgeBlend` (0=pure sine, 1=full ridge). Front layers 0.3-0.5, back layers 0.1-0.2
- [ ] X-warp per layer: `x' = x + warpAmp * sin(2π * warpK * x / loopWidth + warpPhase)` before harmonic evaluation. Breaks even peak spacing. Small warpAmp (5-25px)
- [ ] More harmonics: front layers 6-8 harmonics with k up to 13-17, back layers 3-5 harmonics with lower k
- [ ] Larger amplitudes: front 60-80px, back 10-20px
- [ ] Add `ridgeBlend`, `warp` config to `TerrainLayerConfig`

**D) Point count:**
- [ ] Bump `terrainPointCount` from 300 to 450 to prevent faceting with higher harmonics

#### Step 12: Water surface

**Problem:** Reference has a reflective water body in the bottom ~15-20% that grounds the scene. Our front terrain just fills to bottom with solid color.

**Files:** New `components/drift/DriftScene/WaterSurface.tsx`, `components/drift/DriftScene/DriftScene.tsx`, `components/drift/DriftScene/types.ts`, `components/drift/DriftScene/index.ts`

- [ ] `WaterSurface` component — `Rect` in bottom 15% with `LinearGradient` that mirrors/darkens the sky bottom color at current `dayProgress`
- [ ] Subtle horizontal `Line` elements at varying opacity for water ripple effect
- [ ] Render after terrain layers so it overlaps the very bottom

#### Step 13: Paraglider silhouette

**Problem:** Two concentric circles (8px + 16px) are barely visible and have no character. Reference has a recognizable paraglider — canopy above, figure below.

**Files:** `components/drift/DriftScene/PlayerSprite.tsx`

- [ ] Replace circles with Skia `Path` silhouette: wide arc canopy (~40px wide, ~15px tall) via `cubicTo`, two thin lines to figure, small body shape below
- [ ] Dark silhouette fill (near-black or darkest terrain tint)
- [ ] Keep subtle glow halo behind for visibility against dark backgrounds
- [ ] Squash transform on touch still applies to whole group

#### Step 14: Wind-streak particles

**Problem:** Reference has 2-3 diagonal white streaks suggesting motion. Planned but deferred.

**Files:** New `components/drift/DriftScene/WindStreaks.tsx`, `components/drift/DriftScene/DriftScene.tsx`, `components/drift/DriftScene/types.ts`, `components/drift/DriftScene/index.ts`

- [ ] 3-5 `Line` elements, low opacity white, slight diagonal angle (~15-20°)
- [ ] Positions driven by `scrollX` SharedValue
- [ ] Varying lengths (30-80px) and opacities (0.1-0.3)
- [ ] Phase-aware: more visible at dusk/night, less during bright day

#### Execution order

1. **Step 9** (gesture fix) — functional bug, fix first
2. **Steps 10** (celestial fix + sun size) — functional bug
3. **Step 11** (terrain overhaul — shape, layers, colors) — core visual improvement, biggest impact
4. **Step 12** (water surface) — new component
5. **Step 13** (paraglider) — new Path geometry
6. **Step 14** (wind streaks) — polish, lowest priority

**Current ratings (post-Steps 1-8):** Structural 7/10, Visual 3/10. Target after Steps 9-14: Structural 9/10, Visual 7-8/10.

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
