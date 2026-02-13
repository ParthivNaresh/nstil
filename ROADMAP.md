# NStil Roadmap

## Phase 1 — Authentication

Complete, production-grade auth flow across backend and mobile. Every subphase must pass lint, typecheck, and tests before it is considered done.

### Subphase 1A — Backend: Auth hardening & protected route patterns ✅

Harden the existing JWT verification and establish the patterns all future protected endpoints will follow.

**Objectives:**

- [x] Strengthen `core/security.py` — validate all required JWT claims (sub, exp, aud), reject tokens missing `sub`, handle clock skew tolerance (30s leeway), return typed `UserPayload` (not raw dict)
- [x] Create `models/auth.py` — Pydantic `UserPayload` schema (sub, email, role, exp, iss, aud) with `extra="ignore"` for forward compatibility
- [x] Harden `api/deps.py:get_current_user` — return `UserPayload`, distinct 401 errors for expired vs invalid tokens
- [x] Secrets management — `SecretStr` for `supabase_service_key` and `supabase_jwt_secret`, startup validator rejects empty secrets
- [x] Custom exceptions — `TokenExpiredError` and `InvalidTokenError` in `core/exceptions.py`, separated from business logic
- [x] Comprehensive tests — 16 tests across unit (`core/test_security.py`) and integration (`api/v1/test_auth.py`): valid token, expired, malformed, empty string, missing sub/exp/role claims, wrong audience/algorithm/secret, missing auth header, empty bearer
- [x] Test infrastructure — scalable directory structure (`tests/api/v1/`, `tests/core/`), JWT token factory (`tests/factories.py`), separated fixtures

**Deferred (by design):**

- Rate limiting — backend only verifies tokens, it doesn't issue them; rate limiting is an API gateway concern to be addressed in Phase 6
- Issuer (`iss`) validation — would require per-environment config with no security benefit beyond signature + audience verification
- Role-based 403 responses — no role-gated endpoints exist yet; will be added when needed

### Subphase 1B — Mobile: Auth screens (Sign In & Sign Up) ✅

Production-grade sign-in and sign-up screens with full validation, error handling, and polished UI using the glassmorphism design system.

**Objectives:**

- [x] Create reusable auth UI primitives in `components/ui/` — `GlassCard`, `TextInput` (with floating label, error state, secure entry toggle), `Button` (with loading spinner, disabled state, press animation), `ScreenContainer` (SafeArea + KeyboardAvoidingView + background)
- [x] Build `app/(auth)/sign-in.tsx` — email + password fields, "Sign In" button, link to sign-up, link to forgot password, full input validation (email format, password not empty), inline error display, loading state during API call, generic error messages (no "email not found" vs "wrong password" leaking)
- [x] Build `app/(auth)/sign-up.tsx` — email + password + confirm password fields, password strength requirements (min 8 chars, at least one uppercase, one number), matching password validation, terms acknowledgment, navigates to email verification pending on success
- [x] Build `app/(auth)/index.tsx` — landing/welcome screen that routes to sign-in or sign-up
- [x] Keyboard handling — inputs scroll into view when keyboard appears, "next" button moves focus between fields, "done" submits the form
- [x] Error handling — network errors show a retry-able message, Supabase-specific errors mapped to user-friendly strings, no raw error codes shown to users
- [x] Accessibility — all inputs have proper labels, error messages announced to screen readers, minimum touch target sizes (48x48)

**Implementation details:**

- i18n infrastructure (`lib/i18n/`) with `i18next` + `react-i18next`, English locale, all user-facing strings externalized
- Validation utilities (`lib/validation/`) — pure functions for email, password strength, separated from UI
- Auth error mapping (`lib/authErrors.ts`) — Supabase `AuthError` codes mapped to generic i18n strings, no user enumeration
- Form hooks (`hooks/useSignInForm.ts`, `hooks/useSignUpForm.ts`) — all form state and submission logic extracted from screens
- Shared auth components (`components/auth/`) — `AuthHeader`, `AuthFooterLink`, `FormError`
- UI primitives split into sub-files: `TextInput/` has `FloatingLabel`, `SecureToggle`, `ErrorMessage`; `Button/` has `ButtonSpinner`, variant styles
- `GestureHandlerRootView` added to root layout for gesture-based button animations
- Dependencies added: `i18next`, `react-i18next`, `expo-haptics`

### Subphase 1C — Mobile: Email verification flow ✅

Users must verify their email before gaining access. Handle the complete lifecycle from pending verification to confirmed.

**Objectives:**

- [x] Build `app/(auth)/verify-email.tsx` — informational screen shown after sign-up, displays the email address, "Resend verification" button with cooldown timer (60s), "Already verified? Sign in" link, "Use a different email" option
- [x] Configure deep linking — handle Supabase email verification callback URLs via the `nstil://` scheme, parse access/refresh tokens from URL fragment, set session via Supabase client
- [x] Auth store updates — `isEmailVerified` derived from `email_confirmed_at`, `resendVerification()` method, `onAuthStateChange` auto-updates verification state
- [x] Supabase config — `supabase/config.toml` created with `enable_confirmations = true`, `site_url = "nstil://"`, `additional_redirect_urls` for deep links, `minimum_password_length = 8`, `password_requirements = "lower_upper_letters_digits"`
- [x] Redirect logic — `app/index.tsx` gates on both session existence AND email verification: no session → auth, unverified → verify-email, verified → tabs
- [x] Edge cases — auto-redirect to tabs when verification completes (via `onAuthStateChange`), deep link handler runs on cold start and foreground, resend cooldown prevents spam

**Implementation details:**

- `supabase/config.toml` — full local dev config with PG 17, auth confirmations enabled, Inbucket for email testing
- `lib/deepLink.ts` — `setupDeepLinkListener()` handles both cold start (`getInitialURL`) and foreground (`addEventListener`) deep links, extracts tokens from URL fragment
- `hooks/useVerifyEmail.ts` — 60s cooldown timer with interval cleanup, resend state, status messages
- Sign-up flow redirects to `/(auth)/verify-email` with email param instead of `/(tabs)`
- Deep link listener wired into root layout `useEffect` with cleanup

### Subphase 1D — Mobile: Password reset flow ✅

Secure password reset via email with proper UX for every state.

**Objectives:**

- [x] Build `app/(auth)/forgot-password.tsx` — two-state screen: form state (email input, validation, submit) and success state (email displayed, resend with 60s cooldown, status messages)
- [x] Build `app/(auth)/reset-password.tsx` — new password + confirm password fields, same password strength validation as sign-up, submit via `supabase.auth.updateUser()`, sign out recovery session and redirect to sign-in on success
- [x] Deep link routing — `lib/deepLink.ts` parses `type` param from URL fragment (`recovery` vs `signup`), sets `pendingDeepLinkType` in auth store, redirect logic in `app/index.tsx` routes recovery sessions to reset-password screen
- [x] Auth store — `requestPasswordReset(email)`, `resetPassword(newPassword)`, `pendingDeepLinkType` state with setter/clearer
- [x] Validation refactor — extracted `validatePasswordStrength()` and `validateConfirmPassword()` helpers from `validateSignUp`, reused in new `validateResetPassword()`
- [x] Edge cases — double-submission prevented by loading state, expired links handled by `mapAuthError`, recovery session cleared after successful reset

**Implementation details:**

- `hooks/useForgotPassword.ts` — form state, submit, success state toggle, 60s resend cooldown (same pattern as verify-email)
- `hooks/useResetPassword.ts` — password fields, validation, submit calls `updateUser` then `signOut` then navigates to sign-in
- `DeepLinkType` type alias added to `types/auth.ts`
- `pendingDeepLinkType` in auth store drives redirect: session + recovery → reset-password, cleared after use
- Existing `sign-in.tsx` "Forgot password?" link now resolves to a real screen

### Subphase 1E — Backend & Mobile: Session management hardening ✅

Ensure tokens are refreshed, expired sessions are handled gracefully, and sign-out is thorough.

**Objectives:**

- [x] Token refresh — `autoRefreshToken: true` verified in Supabase client config, `onAuthStateChange` handler reacts to `SIGNED_OUT` event (fired when refresh fails), forces clean sign-out with cache clearing and redirect via `app/index.tsx`
- [x] Secure storage audit — tokens stored exclusively in SecureStore (Keychain iOS / Keystore Android) via `ExpoSecureStoreAdapter`, no AsyncStorage usage, no token logging (observability scrubs sensitive data), `persistSession: true` and `detectSessionInUrl: false` confirmed
- [x] Backend session validation — JWTs verified on every request (stateless, no revocation list needed — access tokens valid until expiry ~1hr, refresh tokens revoked server-side by Supabase on sign-out). `CacheControlMiddleware` added: `Cache-Control: no-store, private` + `Pragma: no-cache` on all authenticated responses, skipped for public paths (`/health`, `/docs`, etc.)
- [x] Sign-out — `signOut()` calls `supabase.auth.signOut()` (revokes refresh token server-side), clears Zustand store, clears React Query cache. SecureStore cleared internally by Supabase client. `SIGNED_OUT` event handler also clears caches for server-initiated sign-outs.
- [x] Cache TTLs — access tokens: 1hr (`jwt_expiry = 3600` in `config.toml`), refresh token rotation enabled with 10s reuse interval, React Query `staleTime`: 5 min, Redis cache TTLs: N/A until Phase 3 (no server-side cached user data yet)
- [x] API client hardening — `apiFetch` throws `NoSessionError` if no session, throws `ApiError` with typed status on failure, auto-signs-out on 401 responses

**Deferred (by design):**

- Network resilience (offline detection, retry logic, offline indicators) — deferred to Phase 3 when real data-fetching screens exist. Currently no API calls from the app besides auth (handled by Supabase client).

**Implementation details:**

- `services/api/errors.ts` — `ApiError` (typed status, body, convenience getters), `SessionExpiredError`, `NoSessionError`
- `services/api/client.ts` — null session guard, 401 auto-sign-out, typed error responses
- `stores/authStore.ts` — event-aware `onAuthStateChange` with `SESSION_CLEARING_EVENTS` set, `clearClientCaches()` extracted for reuse
- `api/middleware.py` — `CacheControlMiddleware` adds no-cache headers to authenticated responses, skips public paths

### Subphase 1F — Integration testing & auth polish ✅

End-to-end validation that the complete auth system works as a unit.

**Objectives:**

- [x] Backend test coverage — 18 tests: 10 JWT unit tests, 5 auth dependency integration tests, 2 cache-control middleware tests, 1 health check. All auth paths covered (valid, expired, malformed, empty, missing claims, wrong audience/algorithm/secret, missing header, empty bearer).
- [x] Mobile type safety — zero `any` casts, zero `@ts-ignore`/`@ts-expect-error`, zero `eslint-disable` directives across all auth-related code (stores, hooks, lib, services, components, app screens)
- [x] Auth flow smoke tests — manual test script: sign up → redirected to verify-email → check Inbucket (localhost:54324) → click link → app opens → redirected to tabs → sign out → sign in → use app → forgot password → check Inbucket → click link → set new password → redirected to sign-in → sign in with new password
- [x] Loading and transition states — splash screen held via `SplashScreen.preventAutoHideAsync()` until auth initialization completes, `app/index.tsx` uses `Redirect` (no intermediate render), `router.replace()` for all auth transitions (no back gesture)
- [x] Security audit checklist:
  - [x] No secrets in client-side code — only `EXPO_PUBLIC_SUPABASE_ANON_KEY`, no service key references
  - [x] No sensitive data in logs — zero `console.log`/`print()` statements, observability module scrubs sensitive keys and JWT patterns
  - [x] Generic auth error messages — `mapAuthError()` returns generic i18n strings, no "email not found" vs "wrong password"
  - [x] Password requirements enforced client-side (`validatePasswordStrength`) AND server-side (`minimum_password_length = 8`, `password_requirements = "lower_upper_letters_digits"`)
  - [x] Tokens stored in SecureStore (Keychain/Keystore) — no AsyncStorage usage anywhere
  - [x] CORS restricted to `["http://localhost:8081"]` — not wildcard, production domains to be configured in Phase 6
  - [x] Rate limiting — Supabase handles auth endpoint rate limiting (`config.toml`: `sign_in_sign_ups = 30` per 5 min, `email_sent = 2` per hour, `token_verifications = 30` per 5 min)

**Implementation details:**

- `tests/api/v1/test_cache_control.py` — 2 tests: authenticated endpoint gets `Cache-Control: no-store, private` + `Pragma: no-cache`, health endpoint gets no cache headers
- Fixed `CacheControlMiddleware` to use `startswith()` with path prefixes (handles `/api/v1/health` correctly, not just `/health`)

---

## Phase 2 — Design System & Core UI Components

Build the reusable component library with Reanimated animations, glassmorphism effects, and accessibility. This is the visual foundation every feature screen builds on.

---

## Phase 3 — Journal Entry CRUD

The core product loop: create, read, update, delete journal entries. Backend endpoints with validation, pagination, and filtering. Mobile screens for writing, listing, and viewing entries.

---

## Phase 4 — AI Integration (Embeddings & Insights)

Generate vector embeddings for journal entries via background workers. Semantic search, mood tracking over time, AI-powered reflection prompts. pgvector queries for similarity search.

---

## Phase 5 — Notifications & Reminders

Scheduled reflection reminders via push notifications. Configurable cadence. Gentle, non-intrusive prompts.

---

## Phase 6 — Production Deployment & Observability

CI/CD pipelines, production Supabase project, monitoring, error tracking (Sentry), log aggregation, performance budgets, app store submission.
