# NStil task runner

# ── Setup ───────────────────────────────────────────────

install: backend-install mobile-install

# ── Backend ──────────────────────────────────────────────

backend-install:
    cd apps/backend && uv sync --dev

backend-dev:
    cd apps/backend && uv run uvicorn nstil.main:app --reload --host 0.0.0.0 --port 8000

backend-lint:
    cd apps/backend && uv run ruff check src tests

backend-format:
    cd apps/backend && uv run ruff format src tests

backend-format-check:
    cd apps/backend && uv run ruff format --check src tests

backend-typecheck:
    cd apps/backend && uv run mypy src

backend-test:
    cd apps/backend && uv run pytest -v

backend-check: backend-lint backend-typecheck backend-test

# ── Mobile ───────────────────────────────────────────────

mobile-install:
    cd apps/mobile && npm install --legacy-peer-deps

mobile-dev:
    cd apps/mobile && npx expo start

mobile-ios:
    cd apps/mobile && npx expo run:ios

mobile-android:
    cd apps/mobile && npx expo run:android

mobile-rebuild-ios:
    cd apps/mobile && npx expo prebuild --platform ios --clean && cd ios && pod install && cd .. && npx expo run:ios

mobile-rebuild-android:
    cd apps/mobile && npx expo prebuild --platform android --clean && npx expo run:android

mobile-lint:
    cd apps/mobile && npx eslint .

mobile-typecheck:
    cd apps/mobile && npx tsc --noEmit

mobile-check: mobile-typecheck mobile-lint

# ── Database ─────────────────────────────────────────────

db-start:
    supabase start

db-stop:
    supabase stop

db-reset:
    supabase db reset

db-migration name:
    supabase migration new {{name}}

# ── Infrastructure ───────────────────────────────────────

up:
    docker compose up -d

down:
    docker compose down

build:
    docker compose build
