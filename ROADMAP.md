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

## Phase 6 — Production Deployment & Observability

CI/CD pipelines, production Supabase project, monitoring, error tracking, app store submission.

- [ ] Production SMTP — real email delivery (SendGrid, Postmark, or SES), custom templates
- [ ] Token revocation — Redis-based token blacklist for immediate invalidation on sign-out
- [ ] API gateway rate limiting
- [ ] CORS production configuration
- [ ] CI/CD pipelines — automated lint, typecheck, test on every PR
- [ ] Error tracking — Sentry integration for backend and mobile
- [ ] Log aggregation — structured log shipping
- [ ] Performance budgets — bundle size limits, API response time targets
- [ ] App store submission — iOS App Store and Google Play Store
- [ ] Network resilience — offline detection, retry logic, offline indicator in UI
