# NStil

NStil is a cross-platform reflection companion designed to bridge the gap between digital activity and emotional well-being.

## Project Structure

```
nstil/
├── apps/
│   ├── mobile/          # Expo React Native (TypeScript)
│   └── backend/         # FastAPI (Python)
├── packages/
│   └── shared/          # Shared types/constants
├── supabase/
│   └── migrations/      # SQL migrations
├── docker-compose.yml
└── justfile             # Task runner
```

## Getting Started

### Backend

```sh
cd apps/backend
uv sync
just backend-dev
```

### Mobile

```sh
cd apps/mobile
npm install
just mobile-dev
```

### Infrastructure

```sh
docker compose up -d    # Redis + backend + worker
just backend-test       # Run tests
just backend-lint       # Lint
just backend-typecheck  # Type check
```
