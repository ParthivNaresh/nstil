# NStil task runner

# ── High-level commands ──────────────────────────────────

doctor:
    ./scripts/doctor.sh

dev:
    ./scripts/dev.sh

infra-up:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "→ Stopping stale Docker containers..."
    docker compose down --remove-orphans 2>/dev/null || true
    echo "→ Starting Redis..."
    docker compose up redis -d
    echo "→ Starting Supabase..."
    supabase start
    echo "→ Infrastructure ready"

infra-down:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "→ Stopping Supabase..."
    supabase stop
    echo "→ Stopping Docker containers..."
    docker compose down --remove-orphans
    echo "→ Infrastructure stopped"

infra-status:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "── Supabase ──"
    supabase status 2>&1 || echo "Supabase not running"
    echo ""
    echo "── Docker ──"
    docker ps --format 'table {{"{{"}}.Names{{"}}"}}\t{{"{{"}}.Ports{{"}}"}}\t{{"{{"}}.Status{{"}}"}}' 2>&1
    echo ""
    echo "── Backend ──"
    curl -m 2 -s http://localhost:8000/api/v1/health 2>/dev/null || echo "Backend not running"
    echo ""

check: backend-check mobile-check

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

db-reset:
    supabase db reset

db-migration name:
    supabase migration new {{name}}
