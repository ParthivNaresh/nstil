# Conventions

Coding standards and patterns enforced across the project.

## General

- No comments in code (leave existing comments alone)
- No imports inside functions (only at top of file, unless circular dependency)
- No `any` casts or `@ts-ignore` — fix the types properly
- No `console.log` or `print()` — use `console.debug`/`console.warn`/`console.error` with `[tag]` prefix
- Don't swallow errors silently in catch blocks — log with tagged prefix

## Python (Backend)

- **Package manager**: `uv` — never pip or poetry
- **Linter**: ruff (lint + format)
- **Type checker**: mypy in strict mode with pydantic plugin
- **Supabase payloads**: `dict[str, object]` — never `dict[str, Any]`
- **Model pattern**: `Row`, `Create` (with `to_update_dict()`), `Update`, `Response` (with `from_row()`)
- **DI**: all external resources via `Depends()` — never import Settings directly in endpoints

## TypeScript (Mobile)

- **ESLint**: pinned to v8 (expo config incompatible with v9+)
- **Text component**: `AppText` from `@/components/ui` — never raw `Text` from react-native (exceptions: `Button.tsx`, `ErrorMessage.tsx`)
- **Typography variants**: `h1`, `h2`, `h3`, `body`, `bodySmall`, `caption`, `label` — there is no `title` variant
- **Strings**: all user-facing strings via `t()` from i18next — never hardcoded
- **Styles**: `StyleSheet.create()` at bottom of file, use design tokens from `@/styles`
- **Route files**: thin wrappers only — extract all logic into hooks
- **Component structure**: each in own directory with `index.ts`, `types.ts`, implementation files
- **No files in `app/` except route components** (Expo Router treats everything as a route)

## Modals

Centered floating card pattern — animated backdrop + scale/fade/translateY card via Reanimated shared values.

## State Management

| Concern | Solution |
|---------|----------|
| Client state | Zustand (persisted to SecureStore where needed) |
| Server state | TanStack React Query (5 min staleTime) |
| Form state | Custom hooks |
| Navigation | expo-router (file-based) |

## Theme

Every component uses `useTheme()` — no static color imports. Three palettes: dark (default), light, OLED.
