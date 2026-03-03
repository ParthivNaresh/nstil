# Mobile Architecture

The mobile app is an Expo React Native application in `apps/mobile/` using file-based routing via expo-router.

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `app/` | expo-router routes — `(auth)/`, `(tabs)/`, `entry/`, `check-in.tsx`, `settings/` |
| `components/ui/` | Reusable UI primitives — each in own directory |
| `components/auth/` | Auth-specific shared components |
| `components/journal/` | Journal feature components |
| `components/insights/` | Insight components |
| `components/settings/` | Settings components |
| `hooks/` | Custom hooks — form logic, data fetching, theme, AI, check-in |
| `lib/` | Utilities — Supabase client, React Query, i18n, validation, location, audio |
| `lib/ai/` | On-device AI — prompts, reflections, summaries, notifications |
| `modules/nstil-ai/` | Local Expo native module — Swift bridge to Apple Foundation Models |
| `stores/` | Zustand stores — authStore, themeStore, notificationStore |
| `services/api/` | API client + domain-specific API functions |
| `styles/` | Design tokens — palettes, spacing, typography, radius, animation, opacity |
| `types/` | Shared TypeScript types |

## Navigation Structure

- `app/(auth)/` — 6 auth screens (sign-in, sign-up, verify-email, forgot-password, reset-password, index)
- `app/(tabs)/` — 5 tabs: Home, History, Insights, Settings + Create
- `app/entry/create.tsx` — new entry form
- `app/entry/[id]/index.tsx` — unified edit screen with pin toggle, delete, save, AI reflection card
- `app/entry/search.tsx` — full-text search
- `app/check-in.tsx` — AI check-in flow (4-step state machine)
- `app/settings/notifications.tsx` — notification preferences
- `app/settings/ai-profile.tsx` — AI profile settings

!!! important
    Tapping an entry card navigates directly to the edit screen (`/entry/${id}`). There is no read-only detail screen.

## Theme System

Three palettes: `darkPalette` (default), `lightPalette`, `oledPalette`. Zustand `themeStore` persisted to SecureStore (no theme flash on launch). `useTheme()` hook returns `colors`, `isDark`, `keyboardAppearance`.

Every component uses `useTheme()` — no static color imports.

Skia `AmbientBackground` mounted at root layout — all screens are transparent overlays on top of a continuous GPU-rendered gradient.

## Key Patterns

### Route files are thin

No business logic in `app/` route files. All form logic, data fetching, and state management is extracted into custom hooks. Screens are thin wrappers that compose hooks and components.

### Component structure

Each component lives in its own directory:

```
components/journal/EntryForm/
├── index.ts          # barrel export
├── EntryForm.tsx     # implementation
└── types.ts          # props interface
```

### Typography

Variants: `h1`, `h2`, `h3`, `body`, `bodySmall`, `caption`, `label`. There is no `title` variant.

Always use `AppText` from `@/components/ui` — never raw `Text` from react-native (exceptions: `Button.tsx`, `ErrorMessage.tsx`).

### Internationalization

All user-facing strings via `t()` from i18next. Never hardcoded.

### Modals

Centered floating card pattern — animated backdrop + scale/fade/translateY card via Reanimated shared values.

### Styles

`StyleSheet.create()` at the bottom of each file. Use design tokens from `@/styles` — never hardcoded values.

## State Management

| Concern | Solution |
|---------|----------|
| Client state | Zustand (auth, theme, notifications) |
| Server state | TanStack React Query (5 min staleTime) |
| Form state | Custom hooks (`useEntryForm`, `useSignInForm`, etc.) |
| Navigation | expo-router (file-based) |
