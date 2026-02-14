# NStil Setup Guide

Complete setup instructions from a fresh clone to running on the iOS Simulator.

## Prerequisites

Install the following before starting:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | `brew install node` |
| Python | 3.12+ | `brew install python@3.12` |
| uv | latest | `brew install uv` |
| Docker Desktop | latest | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| just | latest | `brew install just` |
| Supabase CLI | latest | `brew install supabase/tap/supabase` |
| Xcode | 15+ | Mac App Store |
| CocoaPods | latest | `brew install cocoapods` |

After installing Xcode, open it once to accept the license and install command-line tools:

```sh
sudo xcodebuild -license accept
xcode-select --install
```

## 1. Clone and enter the repo

```sh
git clone <repo-url> nstil
cd nstil
```

## 2. Environment files

Copy the example env files and fill in your values:

```sh
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

### Backend (`apps/backend/.env`)

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=<your-secret-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=["http://localhost:8081"]
DEBUG=true
```

### Mobile (`apps/mobile/.env`)

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-key>
EXPO_PUBLIC_API_URL=http://localhost:8000
```

To get your Supabase keys, run `just infra-up` (see step 3). The CLI prints a table with your local keys:

| Supabase status label | Env var |
|---|---|
| Project URL | `SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` |
| Publishable key | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| Secret key | `SUPABASE_SERVICE_KEY` |
| JWT Secret | `SUPABASE_JWT_SECRET` |

You can retrieve these later with `supabase status` or `supabase status -o env`.

**Note:** Newer Supabase CLI versions sign user JWTs with ES256 (asymmetric). The backend fetches the JWKS public key from Supabase on startup, so the `SUPABASE_JWT_SECRET` is used as a fallback for HS256 tokens only.

## 3. Start infrastructure

```sh
just infra-up
```

This single command:
1. Stops any stale Docker containers
2. Starts Redis via Docker Compose
3. Starts local Supabase (Postgres, Auth, Storage, etc.)
4. Applies all migrations from `supabase/migrations/`

To check the status of all services:

```sh
just infra-status
```

To stop everything:

```sh
just infra-down
```

To reset the database and re-run migrations (wipes all data including user accounts):

```sh
just db-reset
```

## 4. Backend setup

### Install dependencies

```sh
just backend-install
```

### Verify

```sh
just backend-check   # runs lint + typecheck + tests
```

### Run the dev server

```sh
just backend-dev
```

The API is now running at `http://localhost:8000`. Verify with:

```sh
curl http://localhost:8000/api/v1/health
# {"status":"ok","redis":"ok"}
```

### One-command dev start

To start infrastructure + backend in one command:

```sh
just dev
```

This runs `infra-up` then `backend-dev`.

## 5. Mobile setup

### Install dependencies

```sh
just mobile-install
```

The `--legacy-peer-deps` flag is used automatically due to a peer dependency conflict between expo-router's react-dom and the project's React version.

### Verify

```sh
just mobile-check   # runs typecheck + lint
```

### Generate the native iOS project

Expo manages the native project via prebuild. Generate the `ios/` directory:

```sh
cd apps/mobile
npx expo prebuild --platform ios
```

This creates `apps/mobile/ios/` with the Xcode project, Podfile, and all native module configurations.

### Install CocoaPods dependencies

```sh
cd apps/mobile/ios
pod install
```

### Run on iOS Simulator

```sh
just mobile-ios
```

This builds the native project and launches it in the iOS Simulator automatically. It also starts the Metro bundler for fast refresh.

## Quick Reference

All commands run from the repo root via the `justfile`:

| Command | Description |
|---------|-------------|
| **High-level** | |
| `just dev` | Start infrastructure + backend dev server |
| `just infra-up` | Start Redis + Supabase (stops stale containers first) |
| `just infra-down` | Stop all infrastructure |
| `just infra-status` | Check status of all services |
| `just check` | Run all backend + mobile checks |
| `just install` | Install all dependencies |
| **Backend** | |
| `just backend-dev` | Start FastAPI dev server with hot reload |
| `just backend-check` | Lint + typecheck + test |
| `just backend-lint` | Lint Python with ruff |
| `just backend-format` | Auto-format Python with ruff |
| `just backend-typecheck` | Type-check Python with mypy |
| `just backend-test` | Run pytest |
| **Mobile** | |
| `just mobile-ios` | Build and run on iOS Simulator |
| `just mobile-check` | Typecheck + lint |
| `just mobile-dev` | Start Expo dev server |
| `just mobile-lint` | Lint TypeScript with ESLint |
| `just mobile-typecheck` | Type-check with tsc |
| **Database** | |
| `just db-reset` | Reset DB and re-run migrations |
| `just db-migration <name>` | Create a new migration file |

## Troubleshooting

**`npm install` fails with ERESOLVE errors**
Use `npm install --legacy-peer-deps`. This is handled automatically by `just mobile-install`.

**`pod install` fails with Reanimated/worklets error**
Reanimated 4.x requires `react-native-worklets` as a peer dependency. Install it with `npx expo install react-native-worklets`, then re-run `pod install`. If you see other version conflicts, try `pod install --repo-update`.

**Xcode build fails with signing errors**
Open the `.xcworkspace` in Xcode, go to Signing & Capabilities, and select your development team. For simulator-only builds, you can use any team.

**Backend returns "Invalid token" for all authenticated requests**
The backend needs to fetch JWKS from Supabase on startup. Ensure Supabase is running before starting the backend. If you started the backend first, restart it after `just infra-up`.

**Backend health check returns 500**
Redis is not running. Run `just infra-up` to start all infrastructure.

**"No active session" error in the mobile app**
The Supabase session is not being stored. Check that `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `apps/mobile/.env` match the values from `supabase status`.

**Port 8000 conflict**
`just infra-up` only starts Redis from Docker Compose (not the backend container). If you previously ran `just up` (which starts the backend container too), stop it with `docker stop nstil-backend-1 nstil-worker-1`.

**Supabase keys**
After `just infra-up`, retrieve keys with `supabase status` or `supabase status -o env`.
