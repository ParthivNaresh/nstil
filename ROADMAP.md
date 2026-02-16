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

## Phase 5 — Guided Check-ins & On-Device AI

The intelligence layer. Push notification-initiated guided flows reduce the barrier to journaling. On-device LLMs provide personalized prompts, reflections, and insights — all data stays on device.

### Subphase 5A — Guided Check-in Flow

Low-friction, structured micro-entries initiated by the app rather than the user.

- [ ] **Check-in data model** — new `check_ins` table (or entry subtype) with `mood_score` (1-10 scale), `prompt_id`, `response_text`, `created_at`. Lightweight alternative to full journal entries
- [ ] **Check-in flow UI** — push notification → app opens to check-in screen. Step 1: "How are you feeling?" with 1-10 mood scale (Skia gradient slider or tappable pills). Step 2: contextual follow-up prompt based on score (e.g., low score → "What's weighing on you?", high → "What's going well?"). Step 3: optional free-text expansion, voice memo, or "just save"
- [ ] **Prompt engine** — curated prompt bank organized by mood range. Randomized selection within range to avoid repetition. Extensible for AI-generated prompts later
- [ ] **Check-in → entry promotion** — option to expand a check-in into a full journal entry (pre-fills mood, body from responses)
- [ ] **Check-in history** — visible in calendar view (different visual indicator from full entries). Contributes to streak

### Subphase 5B — Push Notifications & Reminders

Scheduled reflection reminders. Configurable cadence. Gentle, non-intrusive prompts.

- [ ] **Push notification infrastructure** — `expo-notifications` for local scheduled notifications. Permission request flow with graceful denial
- [ ] **Reminder settings** — configurable in Settings: frequency (daily, twice daily, custom), time of day, days of week. Stored locally (no backend needed for local notifications)
- [ ] **Smart scheduling** — avoid sending during sleep hours. Respect Do Not Disturb
- [ ] **Notification content** — rotating prompt text ("Time for a quick check-in", "How's your day going?", "Take a moment to reflect"). Tapping opens guided check-in flow
- [ ] **Backend push (future)** — when moving to production, migrate to server-sent push via APNs/FCM for reliability and cross-device sync

### Subphase 5C — On-Device AI: Apple Foundation Models (iOS)

Leverage Apple's Foundation Models framework (3B parameter on-device LLM, iOS 26+) for personalized, private intelligence features. Free inference, works offline.

- [ ] **Native module bridge** — Swift native module exposing Foundation Models framework to React Native. `FoundationModelSession` with guided generation (structured output). Availability check (`FoundationModelAvailability`) with graceful fallback
- [ ] **Personalized journaling prompts** — feed recent entries (mood, tags, topics) as context. Generate contextual prompts: "You mentioned feeling anxious about work yesterday — how did today go?" Prompts adapt to user's emotional state over time
- [ ] **Entry reflections** — after saving an entry, offer an AI-generated reflection or reframe. "It sounds like you handled that situation with patience — that's growth"
- [ ] **Mood-aware notifications** — generate context-aware notification text based on recent mood patterns. Low mood streak → compassionate check-in. High mood → celebration prompt
- [ ] **Entry summaries** — weekly/monthly summaries of journal themes, mood trends, recurring topics. Displayed on Insights tab
- [ ] **Natural language search** — semantic understanding of search queries beyond keyword matching. "entries about my relationship" finds relevant entries even without that exact word

### Subphase 5D — On-Device AI: Gemini Nano (Android)

Equivalent intelligence features on Android using Gemini Nano via ML Kit GenAI APIs.

- [ ] **Native module bridge** — Kotlin native module exposing ML Kit GenAI Prompt API to React Native. Availability check (AICore service, supported devices). Graceful fallback for unsupported devices
- [ ] **Feature parity** — same prompt generation, reflections, summaries, and mood-aware notifications as iOS. Shared prompt templates and context preparation logic in TypeScript. Platform-specific inference only
- [ ] **Fallback strategy** — devices without on-device AI support get curated prompt bank (5A) instead of generated prompts. No cloud fallback — privacy first

### Subphase 5E — Insights Dashboard

AI-powered analytics and visualizations on the Insights tab.

- [ ] **Mood trends** — weekly/monthly mood charts (Skia-rendered). Average mood over time, mood distribution pie/bar chart
- [ ] **Journaling streaks & stats** — entries per week, average entry length, most active time of day, most used tags
- [ ] **AI-generated weekly digest** — on-device summary of the week's entries, themes, emotional arc. "This week you wrote about work stress 3 times but ended the week feeling hopeful"
- [ ] **"Year in Pixels"** — full-year grid where each day is a mood-colored pixel. Skia-rendered, scrollable

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
