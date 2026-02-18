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

Record and attach audio to journal entries.

- [x] **Database migration** — `009_ADD_AUDIO_SUPPORT.sql`. Audio content types (`audio/m4a`, `audio/aac`, `audio/wav`, `audio/mpeg`, `audio/mp4`) added to `entry_media` CHECK constraint. `010_ADD_WAVEFORM.sql` — `waveform jsonb` column on `entry_media` for persisted amplitude data
- [x] **Backend** — `EntryMediaRow.waveform` and `EntryMediaResponse.waveform` (`list[float] | None`). `upload_media` accepts `waveform` as JSON string Form field, parsed via `_parse_waveform()`
- [x] **Mobile recording** — `VoiceRecorderInline` (mic icon trigger) + `VoiceRecorderActive` (full recording UI). `expo-av` recording with real-time metering. `WaveformStatic` component renders live amplitude bars during recording. Auto-stop at max duration (5 min). Haptic feedback on start/stop/discard. `Date.now()` fallback for `durationMillis: 0` on iOS Simulator
- [x] **Mobile playback** — `VoicePlayer` with play/pause, duration display, animated `Waveform` component. Skia-rendered bars with `useDerivedValue` + `withTiming` smooth progress animation via `Group clip`. Real waveform data from recording (no placeholder bars)
- [x] **Waveform persistence** — Amplitudes captured during recording (`allAmplitudesRef`), downsampled via `downsampleAmplitudes()` in `audioUtils.ts`, stored as `LocalAudio.waveform`. Uploaded as JSON, persisted in `entry_media.waveform`. Playback uses stored waveform data
- [x] **Audio utilities** — `lib/audioUtils.ts`: `configureAudioSession`, `createRecording`, `resetAudioSession`, `requestMicrophonePermission`, `normalizeMetering`, `formatDuration`, `downsampleAmplitudes`
- [x] **Entry form integration** — `VoiceMemoSection` for active recording + playback. `useEntryForm` manages `localAudio`, `existingAudio`, `isRecordingAudio` state. Upload via `uploadAudio()` with waveform data
- [x] **Tests** — Backend: ruff ✅, mypy ✅, 313 tests ✅. Mobile: tsc ✅, eslint ✅

### Subphase 4L — Location Tagging ✅

Structured geolocation with interactive place search and map-based pin drop.

- [x] `latitude`/`longitude` columns with CHECK constraints and pair validation
- [x] `LocationSearchSheet` floating modal with Nominatim search (400ms debounce), "Use Current Location" GPS fetch, two-step selection
- [x] `LocationMap` (iOS only) — Apple Maps with tap-to-drop-pin, reverse geocoding
- [x] Auto-detect location on new entries (silent — no prompt if permission not granted)
- [x] Detail screen: tappable location opens Apple Maps / Google Maps
- [x] 297 tests. `expo-location` + `react-native-maps` installed

---

## Phase 5 — AI Intelligence Layer & On-Device AI

The intelligence layer. Backend provides data aggregation, curated prompt selection, and computed insights. On-device LLMs (Apple Foundation Models / Gemini Nano) provide personalized text generation — all inference stays on device.

### Subphase 5A — Backend AI Architecture ✅

Database schema, models, services, and orchestration layer for the AI intelligence system.

**Database (migrations consolidated into domain-based files):**
- [x] `006_USER_PREFERENCES.sql` — `user_ai_profiles` (prompt_style, topics_to_avoid, goals) + `user_notification_preferences` (reminder frequency/time, quiet hours). Auto-created by `handle_new_user()` trigger
- [x] `007_AI_INTELLIGENCE_LAYER.sql` — `ai_sessions`, `ai_messages`, `ai_prompts`, `ai_insights`, `ai_feedback`, `ai_agent_tasks`, `entry_embeddings` tables. Full RLS, indexes, constraints. `semantic_search()` and `get_ai_context()` RPCs
- [x] `008_TRIGGERS_AND_FUNCTIONS.sql` — `handle_new_user()` creates profile + default journal + AI profile + notification prefs

**Models (10 new model files):**
- [x] `ai_profile.py`, `notification.py`, `ai_session.py`, `ai_message.py`, `ai_prompt.py`, `ai_insight.py`, `ai_feedback.py`, `ai_task.py`, `embedding.py`, `ai_context.py`
- [x] `CHECK_IN` added to `EntryType` enum, body made optional for check-in entries

**Tier 1 Data Services (CRUD + Query, 9 services):**
- [x] `services/ai/session.py` — AISessionService (sessions + messages, sort_order tracking)
- [x] `services/ai/prompt.py` — AIPromptService (engagement funnel: mark_delivered/seen/engaged/dismissed/converted)
- [x] `services/ai/insight.py` — AIInsightService (period queries, supersede chain)
- [x] `services/ai/feedback.py` — AIFeedbackService (append-only, target-based lookup)
- [x] `services/ai/task.py` — AITaskService (enqueue, optimistic-locking claim_next)
- [x] `services/ai/profile.py` — AIProfileService
- [x] `services/ai/context.py` — AIContextService (get_ai_context RPC wrapper)
- [x] `services/ai/embedding.py` — EmbeddingService (upsert, semantic_search RPC)
- [x] `services/notification.py` — NotificationService

**Cache Layer:**
- [x] `cache/ai_keys.py` — Key generation for AI context, profile, notification prefs
- [x] `cache/ai_cache.py` — AICacheService (context 60s TTL, profile/prefs 600s TTL)
- [x] `cached_ai_context.py`, `cached_ai_profile.py`, `cached_notification.py` — Cache-aside wrappers

**Prompt Bank (76 curated prompts):**
- [x] `services/ai/prompt_bank/types.py` — CuratedPrompt dataclass, PromptIntensity, PromptTag enums
- [x] 7 data files: check_in (15), reflection (10), nudge (8), affirmation (10), reframe (10), guided (15), goal_check (8)
- [x] `services/ai/prompt_bank/__init__.py` — PromptBank class with indexed lookup, mood/topic/intensity filtering, dedup-aware random selection

**Tier 2 Orchestration Services:**
- [x] `services/ai/prompt_engine.py` — PromptEngine: context-aware prompt type determination (check_in/reflection/nudge/affirmation/goal_check/guided), mood-appropriate selection, progressive filter relaxation, engagement context snapshot
- [x] `services/ai/check_in.py` — CheckInOrchestrator: multi-step check-in flow (start → respond → convert/complete/abandon), flow_state management, resume-on-interrupt, orphaned session recovery, entry promotion to journal
- [x] `services/ai/insight_engine.py` + `insight_computations.py` — InsightEngine v1: streak/milestone detection, weekly summaries (entry count, mood distribution, top tags, avg length), mood anomaly detection (difficult mood ratio comparison). Pure computation functions separated for testability

**InsightEngine v2 (deferred):**
- [ ] Mood trends — moving averages, upward/downward trend detection across multiple months
- [ ] Complex patterns — day-of-week journaling frequency, mood-by-day correlations, gratitude→mood correlations
- [ ] Monthly summaries — same structure as weekly, requires sufficient user data
- [ ] LLM-generated narrative summaries on top of computed data

**Deferred Tier 2 services:**
- [ ] `services/ai/reflection.py` — ReflectionEngine: post-entry reflection/reframe generation. **Deferred because** v1 curated reflections are fully handled by `PromptEngine.generate(prompt_type=REFLECTION, entry_id=...)` — the existing engine already selects mood-appropriate reflection/reframe prompts from the PromptBank and links them to the triggering entry. A separate `ReflectionEngine` class becomes necessary only when on-device LLM integration (5C/5D) adds personalized text generation that reads the entry body and produces a contextual response. **Build trigger:** when implementing 5C (Apple Foundation Models) or 5D (Gemini Nano), create `ReflectionEngine` as the coordinator between the on-device LLM bridge and the `AIPromptService` persistence layer.
- [ ] `services/ai/task_orchestrator.py` — TaskOrchestrator: ARQ worker dispatcher for background jobs (batch insight generation, embedding computation, scheduled tasks). **Deferred because** it requires infrastructure not yet in place: ARQ worker setup, `get_unembedded_entries` RPC in migrations, and an embedding model provider. The `AITaskService` (enqueue/claim_next with optimistic locking) is already built and ready to be consumed. **Build trigger:** when adding background processing — either for batch embedding generation (requires an embedding model decision), scheduled insight runs across all users, or any async work that shouldn't block API requests. **Dependencies:** ARQ integration in `pyproject.toml`, worker entrypoint, `get_unembedded_entries` RPC added to migrations.

**API Routes (17 endpoints across 4 route files):**
- [x] `api/v1/check_in.py` — 6 endpoints: `POST /start`, `POST /{id}/respond`, `POST /{id}/convert`, `POST /{id}/complete`, `POST /{id}/abandon`, `GET /active`. Typed request models (`StartCheckInRequest`, `RespondCheckInRequest`, `ConvertCheckInRequest`), unified `CheckInResponse` wrapper
- [x] `api/v1/insights.py` — 3 endpoints: `GET /insights` (paginated, filterable), `POST /insights/generate`, `PATCH /insights/{id}`
- [x] `api/v1/ai_profile.py` — 4 endpoints: `GET /ai/profile`, `PATCH /ai/profile`, `GET /ai/notifications`, `PATCH /ai/notifications`
- [x] `api/v1/ai_context.py` — 4 endpoints: `GET /ai/context` (configurable entry_limit/days_back), `GET /ai/prompts` (paginated), `POST /ai/prompts/generate`, `PATCH /ai/prompts/{id}`
- [x] `api/deps.py` — 10 dependency injection factories wiring the full AI service graph (cache → data services → cached wrappers → engines → orchestrators)

**Remaining backend work:**
- [ ] ARQ worker setup + TaskOrchestrator (see deferred services above)

### Subphase 5B — Push Notifications & Reminders ✅

Scheduled reflection reminders with configurable cadence, quiet hours, and full lifecycle management.

- [x] **5B-1 — Infrastructure & permission flow** — `expo-notifications` installed, `lib/notifications.ts` (permission request, handler config, `PermissionStatus` enum), `stores/notificationStore.ts` (Zustand: permission tracking, schedule sync, clear), root layout integration (module-scope handler config, notification tap → `/entry/create?source=notification`, cold-launch handling via `getLastResponseAsync`)
- [x] **5B-2 — Notification scheduling engine** — `scheduleReminders()` (cancel all → iterate reminderTimes × activeDays → skip quiet hours → schedule WEEKLY triggers), `isWithinQuietHours()` (handles overnight wrap), `lib/nudgeContent.ts` (15 rotating notification body strings), `toExpoWeekday()` conversion
- [x] **5B-3 — API service & types** — `types/notification.ts` (`ReminderTime`, `ReminderFrequency`, `NotificationPreferences`, `NotificationPreferencesUpdate`), `services/api/notifications.ts` (GET/PATCH), `hooks/useNotificationPreferences.ts` (useQuery + useMutation with optimistic update, reschedule on success, rollback on error), `queryKeys` additions
- [x] **5B-4 — Notification preferences screen** — `app/settings/_layout.tsx` + `app/settings/notifications.tsx` (sub-screen with Header, permission gating, loading skeletons). 6 components in `components/settings/NotificationSettings/`: `NotificationPermissionCard` (undetermined/denied states), `FrequencyPicker` (Skia gradient pills), `DaySelector` (7 circular Skia gradient pills), `ReminderTimeRow` (reuses TimePicker scroll wheels, local state for atomic updates, reserved-height quiet hours warning in red), `QuietHoursSection` (toggle + compact side-by-side TimePickers, local state emitting both start+end atomically), `NotificationSettings` (orchestrator with debounced/immediate update split, local toggle state for flicker-free switches). Settings tab updated with Bell icon navigation card. i18n translations for all notification UI strings
- [x] **5B-5 — Notification response handling** — Tap notification → navigate to `/entry/create?source=notification` (implemented in 5B-1). `data: { action: "check_in" }` set on all scheduled notifications
- [x] **5B-6 — Sync & edge cases** — `hooks/useNotificationSync.ts`: AppState foreground listener (re-check permission status, fetch prefs if `updated_at` changed, reschedule or cancel), sign-in detection (fetch + schedule), sign-out detection (cancel all), `lastSyncedAt` ref to avoid redundant reschedules. Sign-out in settings clears scheduled notifications
- [x] **Backend fix** — `NotificationPreferencesUpdate.to_update_dict()` and model validator refactored to use `model_fields_set` (Pydantic) to distinguish "field omitted" from "field explicitly set to null", enabling quiet hours clearing. `TimePicker` gained `compact` prop for side-by-side quiet hours layout. 574 backend tests ✅

### Subphase 5C — On-Device AI: Apple Foundation Models & Contextual Intelligence (iOS)

Leverage Apple Foundation Models (3B parameter on-device LLM, iOS 26+), Journaling Suggestions API, and HealthKit for personalized, private intelligence. All inference on-device. Backend provides structured context via `GET /ai/context`, client enriches with system signals, feeds to on-device LLM, persists results via existing API endpoints.

**5C-1 — Native Module: Foundation Models Bridge**

Swift native module exposing Apple Foundation Models to React Native via Expo Modules API.

- [ ] `NStilAIModule.swift` — Expo native module with `isAvailable(): Bool`, `generate(systemPrompt: String, userPrompt: String): String`, `generateStructured<T: Decodable>(systemPrompt: String, userPrompt: String, schema: String): T`. Uses `FoundationModelSession` with `@Generable` protocol for typed output
- [ ] `NStilAIAvailability.swift` — wraps `FoundationModelAvailability` checks (device capability, model download status, language support). Exposes `available`, `unavailable`, `downloading` states to JS
- [ ] TypeScript bridge — `lib/ai/foundationModels.ts`: typed wrapper functions (`generateText`, `generateStructured<T>`), availability check, error mapping. Platform guard (`Platform.OS === 'ios'`)
- [ ] Graceful fallback — when Foundation Models unavailable (older device, model not downloaded), all AI features silently fall back to curated PromptBank. No user-facing error. `useAICapabilities` hook exposes `{ hasOnDeviceAI, isDownloading }` for conditional UI

**5C-2 — Contextual Signals: Journaling Suggestions API**

Integrate Apple's Journaling Suggestions framework to receive system-aggregated context (workouts, music, photos, locations, contacts) without requesting individual permissions.

- [ ] `NStilSuggestionsModule.swift` — Expo native module wrapping `JournalingSuggestion` framework. `requestAuthorization(): Bool`, `fetchSuggestions(since: Date): JournalingSuggestion[]`. Maps native suggestion types to typed TS interfaces
- [ ] TypeScript types — `types/contextSignal.ts`: `ContextSignalType` enum (`workout`, `music`, `photo`, `location`, `contact`, `calendar`, `sleep`), `ContextSignal` interface (`type`, `timestamp`, `metadata: Record<string, unknown>`, `displayText`), `WorkoutSignal`, `MusicSignal`, `LocationSignal` etc. as discriminated union subtypes
- [ ] `lib/ai/contextSignals.ts` — `ContextSignalProvider` abstraction: `fetchSignals(since: Date): Promise<ContextSignal[]>`. iOS implementation reads from Journaling Suggestions module. Android implementation returns empty (until 5D). Shared interface enables future data sources
- [ ] Permission flow — `JournalingSuggestionsPicker` SwiftUI sheet (required by Apple) presented via native module. One-time authorization. Permission state persisted in `useAICapabilities`
- [ ] Signal-to-prompt mapping — `lib/ai/signalPromptMapper.ts`: converts `ContextSignal[]` into natural language context strings for LLM prompts. E.g., workout signal → "You completed a 45-minute run 2 hours ago." Reusable across all prompt generation paths

**5C-3 — Contextual Signals: HealthKit Integration**

Deeper health data beyond Journaling Suggestions for mood-health correlation.

- [ ] `NStilHealthModule.swift` — Expo native module wrapping HealthKit. `requestAuthorization(types: [String]): Bool`, `querySleep(since: Date): SleepData[]`, `queryHeartRate(since: Date): HeartRateData[]`, `queryMindfulMinutes(since: Date): number`
- [ ] HealthKit observer — `HKObserverQuery` for workout completions + sleep analysis. Background delivery registration. On new data → fire local notification via existing `expo-notifications` infrastructure with context-aware body text
- [ ] TypeScript types — `SleepSignal`, `HeartRateSignal` extending `ContextSignal`. Integrated into `ContextSignalProvider`
- [ ] Settings UI — `HealthDataSettings` component in AI Profile screen. Per-signal-type toggles (sleep, workouts, heart rate). Stored in `user_ai_profiles.metadata`

**5C-4 — Personalized Prompt Generation**

Replace curated PromptBank selection with on-device LLM generation when available.

- [ ] `lib/ai/promptGenerator.ts` — `OnDevicePromptGenerator` class. Takes `AIContextResponse` + `ContextSignal[]` → builds system prompt (user's mood history, recent entries summary, active goals, current context signals) → calls Foundation Models `generateStructured` → returns typed `GeneratedPrompt { content: string, promptType: PromptType, reasoning: string }`
- [ ] Prompt templates — `lib/ai/promptTemplates.ts`: system prompt templates per generation task (check-in prompt, reflection, summary, notification). Shared between iOS and Android. Parameterized with context data. Kept in TypeScript (not native) for cross-platform reuse
- [ ] Integration with existing flow — `useHomePrompt` gains `preferOnDevice: boolean` flag. When on-device AI available: generate locally → persist via `POST /ai/prompts/generate` with `source: 'on_device_llm'`. When unavailable: existing `POST /ai/prompts/generate` (curated PromptBank). Transparent to UI layer
- [ ] Check-in flow enhancement — `CheckInOrchestrator` on mobile side: after mood selection, if on-device AI available, generate a personalized follow-up prompt based on the selected mood + recent context signals. Falls back to backend-generated prompt

**5C-5 — Entry Reflections & Summaries**

Post-entry intelligence: personalized reflections after saving, narrative summaries for insights.

- [ ] `ReflectionEngine` (mobile) — after entry save, if on-device AI available: read entry body + mood + context signals → generate personalized reflection/reframe → persist as `ai_prompt` with `source='on_device_llm'`, `entry_id` linked. Show as a card below the entry on detail screen
- [ ] Weekly narrative summaries — on-device LLM generates natural language summary on top of `InsightEngine`'s computed `weekly_summary` data. Persisted as `ai_insight` with `source='on_device_llm'`. Shown in Insights dashboard above the stats cards
- [ ] Mood-aware notification text — when scheduling reminders, if on-device AI available: generate context-aware notification body based on recent mood patterns + time of day. Replace static `nudgeContent.ts` rotation

**5C-6 — Contextual Notification Triggers**

Proactive, context-aware notifications beyond scheduled reminders.

- [ ] HealthKit background delivery — register `HKObserverQuery` for `HKWorkoutType` and `HKCategoryType.sleepAnalysis`. On new workout → generate "How did that workout make you feel?" notification. On poor sleep detected → morning prompt "You had a rough night — how are you starting your day?"
- [ ] Journaling Suggestions donation — register NStil intents with system intelligence layer via App Intents framework. System can surface NStil suggestions in Dynamic Island / Lock Screen at contextually appropriate moments
- [ ] Notification intelligence — `lib/ai/notificationIntelligence.ts`: decides whether to send a contextual notification based on user's recent engagement (don't spam), quiet hours, and signal significance. Rate limiting: max 3 contextual notifications per day, minimum 2 hours apart

### Subphase 5D — On-Device AI: Gemini Nano (Android)

Equivalent intelligence features on Android using Gemini Nano via ML Kit GenAI APIs.

- [ ] **Native module bridge** — Kotlin native module exposing ML Kit GenAI Prompt API to React Native via Expo Modules API. `NStilAIModule.kt`: `isAvailable(): Boolean`, `generate(systemPrompt: String, userPrompt: String): String`. Availability check (AICore service, supported devices). Graceful fallback to curated prompts
- [ ] **Health Connect integration** — `NStilHealthModule.kt` wrapping Health Connect APIs. Read workouts, sleep, heart rate. Change token-based polling via `WorkManager` for background detection. Maps to same `ContextSignal` TypeScript types as iOS
- [ ] **Feature parity** — same `OnDevicePromptGenerator`, `promptTemplates`, `signalPromptMapper`, `notificationIntelligence` TypeScript modules as iOS. Platform-specific code is only the native module bridge layer. All prompt construction, context preparation, and persistence logic is shared
- [ ] **Fallback strategy** — devices without on-device AI support get curated PromptBank selection. No cloud fallback — privacy first. `useAICapabilities` hook returns same interface on both platforms

### Subphase 5E — Mobile AI Screens & Check-in Flow UI ✅

The user-facing AI experience. Consumes the 17 backend endpoints from 5A. Works with curated PromptBank prompts now; on-device LLM (5C/5D) layers personalization on top later.

- [x] **5E-1 — API service layer & types** — `types/ai.ts` (all AI interfaces), `services/api/checkIn.ts` (6 functions), `services/api/prompts.ts` (3 functions), `services/api/insights.ts` (3 functions), `services/api/aiProfile.ts` (2 functions), `queryKeys` additions
- [x] **5E-2 — Check-in flow UI** — `useCheckIn` hook (state machine with lazy session creation, `stateRef` for stable callbacks), 4 step components (`CheckInLoading`, `CheckInMood`, `CheckInPrompt`, `CheckInOutcome`), `app/check-in.tsx` screen with abandon dialog, auto-complete timer, convert-to-entry navigation. Mood screen shows instantly (session created in background)
- [x] **5E-3 — Home screen check-in card** — `useHomePrompt` (30-min stale query), `useDismissPrompt` (optimistic removal + background refetch), `useEngagePrompt`, `HomeCheckInSection` orchestrator with skeleton/prompt/fallback states, pull-to-refresh on home screen
- [x] **5E-4 — Insights dashboard** — `useInsights` hooks (generate mutation + list query + update mutation), `useYearCalendar` (12-month parallel fetch), 7 components (`StreakBanner` with Skia gradient, `WeeklySummaryCard` with `MoodBar`, `MoodAnomalyCard`, `MoodTrendChart` with Skia line chart, `YearInPixels` grid with memoized cells, `InsightCard` with bookmark/dismiss), `insightUtils.ts` for type-safe metadata parsing
- [x] **5E-5 — AI profile settings** — `useAIProfile`/`useUpdateAIProfile` (optimistic updates), `PromptStylePicker` (Skia gradient pills), `TopicsToAvoid` (tag input with plus button), `GoalsList` (add/remove with plus button), `AIProfileSettings` orchestrator (debounced/immediate update split), `app/settings/ai-profile.tsx` route, settings tab navigation card

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
