# Setup

Complete setup instructions from a fresh clone to running on the iOS Simulator.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | `brew install node` |
| Python | 3.12+ | `brew install python@3.12` |
| uv | latest | `brew install uv` |
| Docker Desktop | latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| just | latest | `brew install just` |
| Supabase CLI | latest | `brew install supabase/tap/supabase` |
| Xcode | 15+ | Mac App Store |
| CocoaPods | latest | `brew install cocoapods` |

After installing Xcode, accept the license and install command-line tools:

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

Copy the example env files:

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

To get your Supabase keys, run `just infra-up` (step 3), then retrieve them:

| Supabase status label | Env var |
|---|---|
| Project URL | `SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` |
| Publishable key | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| Secret key | `SUPABASE_SERVICE_KEY` |
| JWT Secret | `SUPABASE_JWT_SECRET` |

Retrieve keys later with `supabase status` or `supabase status -o env`.

!!! note
    Newer Supabase CLI versions sign user JWTs with ES256 (asymmetric). The backend fetches the JWKS public key from Supabase on startup, so `SUPABASE_JWT_SECRET` is used as a fallback for HS256 tokens only.

## 3. Start infrastructure

```sh
just infra-up
```

This single command:

1. Stops any stale Docker containers
2. Starts Redis via Docker Compose
3. Starts local Supabase (Postgres, Auth, Storage, etc.)
4. Applies all migrations from `supabase/migrations/`

Check status:

```sh
just infra-status
```

Stop everything:

```sh
just infra-down
```

Reset the database (wipes all data including user accounts):

```sh
just db-reset
```

## 4. Backend setup

```sh
just backend-install
just backend-check    # lint + typecheck + tests
just backend-dev      # start FastAPI dev server
```

Verify:

```sh
curl http://localhost:8000/api/v1/health
# {"status":"ok","redis":"ok"}
```

## 5. Mobile setup

```sh
just mobile-install
just mobile-check     # typecheck + lint
```

Generate the native iOS project:

```sh
cd apps/mobile
npx expo prebuild --platform ios
cd ios && pod install && cd ..
```

Run on iOS Simulator:

```sh
just mobile-ios
```

## One-command dev start

Start infrastructure + backend in one command:

```sh
just dev
```

## Troubleshooting

??? tip "`npm install` fails with ERESOLVE errors"
    Use `npm install --legacy-peer-deps`. This is handled automatically by `just mobile-install`.

??? tip "`pod install` fails with Reanimated/worklets error"
    Reanimated 4.x requires `react-native-worklets` as a peer dependency. Install it with `npx expo install react-native-worklets`, then re-run `pod install`.

??? tip "Xcode build fails with signing errors"
    Open the `.xcworkspace` in Xcode, go to Signing & Capabilities, and select your development team.

??? tip "Backend returns 'Invalid token' for all authenticated requests"
    The backend needs to fetch JWKS from Supabase on startup. Ensure Supabase is running before starting the backend.

??? tip "Backend health check returns 500"
    Redis is not running. Run `just infra-up` to start all infrastructure.

??? tip "'No active session' error in the mobile app"
    Check that `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `apps/mobile/.env` match the values from `supabase status`.
