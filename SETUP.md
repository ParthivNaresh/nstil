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
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=<your-service-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=["http://localhost:8081"]
DEBUG=true
```

### Mobile (`apps/mobile/.env`)

```
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
EXPO_PUBLIC_API_URL=http://localhost:8000
```

To get your Supabase keys, run `supabase start` (see step 3). The CLI prints a table with your local keys:

| Supabase status label | Env var |
|---|---|
| API URL | `SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` |
| Authentication Publishable key | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| Authentication Secret key | `SUPABASE_SERVICE_KEY` |
| JWT Secret | `SUPABASE_JWT_SECRET` |

You can retrieve these later with `supabase status`.

## 3. Start Supabase (local)

```sh
just db-start
```

This starts a local Supabase instance (Postgres, Auth, Storage, etc.) and applies all migrations in `supabase/migrations/`. The output will print your local API keys — use them to fill in the `.env` files from step 2.

To reset the database and re-run migrations at any time:

```sh
just db-reset
```

## 4. Backend setup

### Install dependencies

```sh
cd apps/backend
uv sync --all-extras
```

This creates a `.venv` in `apps/backend/` and installs all production + dev dependencies.

### Verify

```sh
just backend-lint       # ruff linter
just backend-typecheck  # mypy strict mode
just backend-test       # pytest
```

### Run the dev server

Start Redis first (either via Docker or Supabase's bundled Redis):

```sh
docker compose up redis -d
```

Then start the backend:

```sh
just backend-dev
```

The API is now running at `http://localhost:8000`. Verify with:

```sh
curl http://localhost:8000/api/v1/health
# {"status":"ok"}
```

## 5. Mobile setup

### Install dependencies

```sh
cd apps/mobile
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is needed due to a peer dependency conflict between expo-router's react-dom and the project's React version.

### Verify

```sh
just mobile-typecheck   # TypeScript
just mobile-lint        # ESLint
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

You have two options:

**Option A: Expo CLI (recommended for development)**

```sh
cd apps/mobile
npx expo run:ios
```

This builds the native project and launches it in the iOS Simulator automatically. It also starts the Metro bundler for fast refresh.

**Option B: Xcode**

1. Open the Xcode workspace:
   ```sh
   open apps/mobile/ios/NStil.xcworkspace
   ```
2. Select a simulator device from the toolbar (e.g. "iPhone 16 Pro").
3. Press **Cmd+R** to build and run.
4. In a separate terminal, start Metro:
   ```sh
   cd apps/mobile
   npx expo start --dev-client
   ```

The app will connect to the Metro bundler for live reload.

## 6. Docker (full stack)

To run the backend, worker, and Redis together:

```sh
# Build images
just build

# Start all services
just up

# View logs
docker compose logs -f

# Stop
just down
```

## Quick Reference

All commands run from the repo root via the `justfile`:

| Command | Description |
|---------|-------------|
| `just backend-dev` | Start FastAPI dev server with hot reload |
| `just backend-lint` | Lint Python with ruff |
| `just backend-format` | Auto-format Python with ruff |
| `just backend-typecheck` | Type-check Python with mypy |
| `just backend-test` | Run pytest |
| `just mobile-dev` | Start Expo dev server |
| `just mobile-lint` | Lint TypeScript with ESLint |
| `just mobile-typecheck` | Type-check with tsc |
| `just mobile-install` | Install npm dependencies |
| `just db-start` | Start local Supabase |
| `just db-stop` | Stop local Supabase |
| `just db-reset` | Reset DB and re-run migrations |
| `just up` | Docker compose up (backend + worker + Redis) |
| `just down` | Docker compose down |
| `just build` | Docker compose build |

## Troubleshooting

**`npm install` fails with ERESOLVE errors**
Use `npm install --legacy-peer-deps`. This is a known peer conflict from expo-router pulling in react-dom.

**`pod install` fails with Reanimated/worklets error**
Reanimated 4.x requires `react-native-worklets` as a peer dependency. Install it with `npx expo install react-native-worklets`, then re-run `pod install`. If you see other version conflicts, try `pod install --repo-update`.

**Xcode build fails with signing errors**
Open the `.xcworkspace` in Xcode, go to Signing & Capabilities, and select your development team. For simulator-only builds, you can use any team.

**`just backend-dev` can't connect to Redis**
Make sure Redis is running: `docker compose up redis -d` or `just db-start` (Supabase includes Redis).

**Supabase keys**
After `just db-start`, the CLI prints all keys. You can also retrieve them later with `supabase status`.
