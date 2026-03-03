# Commands

All commands run from the repo root via the `justfile`.

## High-level

| Command | Description |
|---------|-------------|
| `just dev` | Start infrastructure + backend dev server |
| `just device` | Build and run on physical iOS device |
| `just infra-up` | Start Redis + Supabase |
| `just infra-down` | Stop all infrastructure |
| `just infra-status` | Check status of all services |
| `just check` | Run all backend + mobile checks |
| `just install` | Install all dependencies |

## Backend

| Command | Description |
|---------|-------------|
| `just backend-dev` | Start FastAPI dev server with hot reload |
| `just backend-check` | Lint + typecheck + test |
| `just backend-lint` | Lint Python with ruff |
| `just backend-format` | Auto-format Python with ruff |
| `just backend-format-check` | Check formatting without modifying |
| `just backend-typecheck` | Type-check Python with mypy (strict) |
| `just backend-test` | Run pytest |
| `just backend-test-coverage` | Run pytest with coverage XML output |
| `just backend-install` | Install Python dependencies via uv |

## Mobile

| Command | Description |
|---------|-------------|
| `just mobile-ios` | Build and run on iOS Simulator |
| `just mobile-android` | Build and run on Android emulator |
| `just mobile-check` | Typecheck + lint |
| `just mobile-dev` | Start Expo dev server |
| `just mobile-lint` | Lint TypeScript with ESLint |
| `just mobile-typecheck` | Type-check with tsc |
| `just mobile-install` | Install npm dependencies |
| `just mobile-rebuild-ios` | Clean prebuild + pod install + run iOS |
| `just mobile-rebuild-android` | Clean prebuild + run Android |

## Database

| Command | Description |
|---------|-------------|
| `just db-reset` | Reset DB and re-run all migrations |
| `just db-migration <name>` | Create a new migration file |

## Documentation

| Command | Description |
|---------|-------------|
| `just docs-serve` | Start local docs dev server |
| `just docs-build` | Build static docs site |
