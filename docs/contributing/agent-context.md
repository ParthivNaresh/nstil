# Agent Context

This page provides onboarding context for any contributor (human or AI) working on NStil.

## Environment Variables

### Backend (`apps/backend/.env`)

`SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (SecretStr), `SUPABASE_JWT_SECRET` (SecretStr), `REDIS_URL`, `CORS_ORIGINS`, `DEBUG`, `LOG_LEVEL`, `LOG_FORMAT`

### Mobile (`apps/mobile/.env`)

`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`

Get keys via `supabase status` after `just infra-up`.

## Verification

Always run before considering work complete:

=== "Backend"

    ```sh
    just backend-check
    ```

    This runs ruff lint, mypy strict, and 583 pytest tests.

=== "Mobile"

    ```sh
    just mobile-check
    ```

    This runs tsc (no emit) and ESLint.

## Current Progress

| Phase | Status | Key deliverables |
|-------|--------|-----------------|
| 1 — Authentication | ✅ | JWT auth, 6 auth screens, deep linking, SecureStore, 401 auto-sign-out |
| 2 — Design System | ✅ | 18 UI components, design tokens, glassmorphism theme |
| 3 — Journal CRUD | ✅ | Create/read/update/delete entries, cursor pagination, Redis caching |
| 4 — Core Features | 🔄 | Theme, search, calendar, media, location, mood, journals (rich text + management remaining) |
| 5 — AI Layer | ✅ | Backend AI (583 tests), notifications, on-device AI (iOS), AI screens |
| 6 — Production | ❌ | CI/CD, deployment, monitoring, app store submission |
