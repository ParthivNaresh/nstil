# On-Device AI

All AI inference runs on-device via Apple Foundation Models (iOS 26+). No cloud LLM calls. Privacy first.

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Mobile Client                   │
│                                                   │
│  ┌─────────────┐    ┌──────────────────────────┐ │
│  │  TypeScript  │    │    Swift Native Module    │ │
│  │   AI Layer   │───▶│  (modules/nstil-ai/)     │ │
│  │  (lib/ai/)   │◀───│                          │ │
│  └──────┬───────┘    │  checkAvailability()     │ │
│         │            │  generate(instructions,   │ │
│         │            │           prompt)          │ │
│         │            └──────────────────────────┘ │
���         │                        │                │
│         │                        ▼                │
│         │            ┌──────────────────────────┐ │
│         │            │   Apple Foundation Models │ │
│         │            │   (3B parameter LLM)      │ │
│         │            └──────────────────────────┘ │
│         │                                         │
│         ▼                                         │
│  ┌─────────────┐                                  │
│  │  Backend API │  GET /ai/context                │
│  │  (context    │  (mood distributions, streaks,  │
│  │   only)      │   entry summaries, preferences) │
│  └─────────────┘                                  │
└──────────────────────────────────────────────────┘
```

## Native Module

The Swift native module (`modules/nstil-ai/`) bridges Apple Foundation Models to React Native via the Expo Modules API.

- `NStilAIModule.swift` — `checkAvailability()` and `generate(instructions, prompt)`
- `#if canImport(FoundationModels)` compile-time guards for backwards compatibility
- Podspec platform 15.1 (matches project minimum)

## TypeScript AI Layer

Located in `lib/ai/`:

| Module | Purpose |
|--------|---------|
| `foundationModels.ts` | TypeScript wrapper with platform guard, 30s timeout, typed errors |
| `promptTemplates.ts` | Per-task system prompts enforcing tone and format |
| `promptContext.ts` | Transforms `AIContextResponse` into natural language for the LLM |
| `promptGenerator.ts` | Mirrors backend `PromptEngine` logic for prompt type determination |
| `reflectionEngine.ts` | Generates post-entry reflections from entry content |
| `summaryEngine.ts` | Generates weekly narrative summaries from computed insight metadata |
| `notificationTextEngine.ts` | Generates personalized notification reminder text |
| `personalizedNotifications.ts` | Shared utility for notification scheduling with LLM text |

## Four AI Features

### 1. Personalized Check-in Prompts

On-device LLM replaces the curated PromptBank when Foundation Models are available. The prompt generator determines the appropriate prompt type (mood check, gratitude, reflection, etc.) based on user context, then generates a personalized prompt.

### 2. Entry Reflections

Post-entry reflections generated on-device after saving. Fire-and-forget — the entry saves immediately, the reflection appears asynchronously. Displayed as a 3-line truncated preview with tap-to-open modal.

### 3. Weekly Narrative Summaries

Generated from computed insight metadata (mood counts, streaks, milestones). Uses exact counts instead of percentages to reduce hallucination. Strict prompt instructions enforce factual accuracy.

### 4. Personalized Notification Text

Replaces static notification message rotation with LLM-generated text that reflects the user's journaling patterns and mood trends.

## Fallback Strategy

When Foundation Models are unavailable (non-iOS, older devices, Apple Intelligence disabled):

1. `useAICapabilities` hook reports `isAvailable: false`
2. Prompt generation falls back to the backend's curated PromptBank (76 prompts, 7 categories)
3. Reflections and summaries are not generated (graceful absence)
4. Notifications use 15 static fallback messages
5. The UI is completely source-agnostic — it never knows the difference
