#!/usr/bin/env bash
set -euo pipefail

PASS="✅"
FAIL="❌"
WARN="⚠️"
BOLD="\033[1m"
RESET="\033[0m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"

FAILURES=0
WARNINGS=0

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_ENV="$REPO_ROOT/apps/backend/.env"
MOBILE_ENV="$REPO_ROOT/apps/mobile/.env"

pass() {
  echo -e "  ${PASS} $1"
}

fail() {
  echo -e "  ${FAIL} ${RED}$1${RESET}"
  if [[ -n "${2:-}" ]]; then
    echo -e "     → Fix: ${BOLD}$2${RESET}"
  fi
  FAILURES=$((FAILURES + 1))
}

warn() {
  echo -e "  ${WARN} ${YELLOW}$1${RESET}"
  if [[ -n "${2:-}" ]]; then
    echo -e "     → Fix: ${BOLD}$2${RESET}"
  fi
  WARNINGS=$((WARNINGS + 1))
}

section() {
  echo ""
  echo -e "${BOLD}$1${RESET}"
}

env_val() {
  local file="$1"
  local key="$2"
  grep -E "^${key}=" "$file" 2>/dev/null | head -1 | cut -d'=' -f2-
}

port_open() {
  local host="$1"
  local port="$2"
  nc -z -w 2 "$host" "$port" 2>/dev/null
}

http_status() {
  curl -m 3 -s -o /dev/null -w "%{http_code}" "$1" 2>/dev/null || echo "000"
}

http_body() {
  curl -m 3 -s "$1" 2>/dev/null || echo ""
}

echo -e "${BOLD}NStil Doctor${RESET}"
echo "Running diagnostics..."

# ─── 1. Prerequisites ────────────────────────────────────

section "1. Prerequisites"

if docker info &>/dev/null; then
  pass "Docker daemon is running"
else
  fail "Docker daemon is not running" "Open Docker Desktop"
fi

if command -v supabase &>/dev/null; then
  SB_VERSION=$(supabase --version 2>&1 | head -1)
  pass "Supabase CLI installed ($SB_VERSION)"
else
  fail "Supabase CLI not installed" "brew install supabase/tap/supabase"
fi

if command -v uv &>/dev/null; then
  pass "uv installed"
else
  fail "uv not installed" "brew install uv"
fi

if command -v node &>/dev/null; then
  pass "Node.js installed ($(node --version))"
else
  fail "Node.js not installed" "brew install node"
fi

# ─── 2. Environment Files ────────────────────────────────

section "2. Environment files"

BACKEND_REQUIRED_KEYS=("SUPABASE_URL" "SUPABASE_SERVICE_KEY" "SUPABASE_JWT_SECRET" "REDIS_URL")
MOBILE_REQUIRED_KEYS=("EXPO_PUBLIC_SUPABASE_URL" "EXPO_PUBLIC_SUPABASE_ANON_KEY" "EXPO_PUBLIC_API_URL")

if [[ -f "$BACKEND_ENV" ]]; then
  pass "Backend .env exists"
  for key in "${BACKEND_REQUIRED_KEYS[@]}"; do
    val=$(env_val "$BACKEND_ENV" "$key")
    if [[ -z "$val" ]]; then
      fail "Backend .env missing: $key" "Add $key to apps/backend/.env"
    fi
  done
else
  fail "Backend .env not found" "cp apps/backend/.env.example apps/backend/.env"
fi

if [[ -f "$MOBILE_ENV" ]]; then
  pass "Mobile .env exists"
  for key in "${MOBILE_REQUIRED_KEYS[@]}"; do
    val=$(env_val "$MOBILE_ENV" "$key")
    if [[ -z "$val" ]]; then
      fail "Mobile .env missing: $key" "Add $key to apps/mobile/.env"
    fi
  done
else
  fail "Mobile .env not found" "cp apps/mobile/.env.example apps/mobile/.env"
fi

# ─── 3. Infrastructure ───────────────────────────────────

section "3. Infrastructure"

if port_open 127.0.0.1 6379; then
  pass "Redis is reachable (port 6379)"
else
  fail "Redis is not reachable on port 6379" "just infra-up"
fi

SUPABASE_URL=""
if [[ -f "$BACKEND_ENV" ]]; then
  SUPABASE_URL=$(env_val "$BACKEND_ENV" "SUPABASE_URL")
fi
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"

SUPABASE_AUTH_STATUS=$(http_status "${SUPABASE_URL}/auth/v1/health")
if [[ "$SUPABASE_AUTH_STATUS" == "200" ]]; then
  pass "Supabase Auth is healthy"
else
  fail "Supabase Auth is not reachable (status: $SUPABASE_AUTH_STATUS)" "just infra-up"
fi

if port_open 127.0.0.1 54322; then
  pass "Supabase Postgres is reachable (port 54322)"
else
  fail "Supabase Postgres is not reachable on port 54322" "just infra-up"
fi

# ─── 4. Port Conflicts ───────────────────────────────────

section "4. Port conflicts"

BACKEND_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E "^nstil-backend" || true)
if [[ -n "$BACKEND_CONTAINER" ]]; then
  fail "Docker container '$BACKEND_CONTAINER' is running on port 8000 (conflicts with local backend)" "docker stop $BACKEND_CONTAINER"
else
  pass "No Docker backend container competing for port 8000"
fi

WORKER_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E "^nstil-worker" || true)
if [[ -n "$WORKER_CONTAINER" ]]; then
  warn "Docker worker container '$WORKER_CONTAINER' is running (may not be needed for local dev)" "docker stop $WORKER_CONTAINER"
fi

# ─── 5. Backend ──────────────────────────────────────────

section "5. Backend"

API_URL=""
if [[ -f "$MOBILE_ENV" ]]; then
  API_URL=$(env_val "$MOBILE_ENV" "EXPO_PUBLIC_API_URL")
fi
API_URL="${API_URL:-http://localhost:8000}"

HEALTH_BODY=$(http_body "${API_URL}/api/v1/health")
HEALTH_STATUS=$(http_status "${API_URL}/api/v1/health")

if [[ "$HEALTH_STATUS" == "200" ]]; then
  pass "Backend is running (${API_URL})"

  REDIS_STATUS=$(echo "$HEALTH_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('redis','unknown'))" 2>/dev/null || echo "unknown")
  if [[ "$REDIS_STATUS" == "ok" ]]; then
    pass "Backend → Redis connection is healthy"
  else
    warn "Backend reports Redis status: $REDIS_STATUS" "Ensure Redis is running: just infra-up"
  fi
else
  fail "Backend is not running (status: $HEALTH_STATUS)" "just backend-dev"
fi

# ─── 6. Configuration Consistency ────────────────────────

section "6. Configuration consistency"

SUPABASE_ENV_OUTPUT=$(supabase status -o env 2>/dev/null || echo "")

if [[ -n "$SUPABASE_ENV_OUTPUT" && -f "$BACKEND_ENV" ]]; then
  LIVE_JWT_SECRET=$(echo "$SUPABASE_ENV_OUTPUT" | grep '^JWT_SECRET=' | cut -d'"' -f2)
  ENV_JWT_SECRET=$(env_val "$BACKEND_ENV" "SUPABASE_JWT_SECRET")

  if [[ -n "$LIVE_JWT_SECRET" && -n "$ENV_JWT_SECRET" ]]; then
    if [[ "$LIVE_JWT_SECRET" == "$ENV_JWT_SECRET" ]]; then
      pass "Backend JWT_SECRET matches Supabase"
    else
      fail "Backend SUPABASE_JWT_SECRET does not match Supabase's JWT_SECRET" "Update SUPABASE_JWT_SECRET in apps/backend/.env to: $LIVE_JWT_SECRET"
    fi
  fi

  LIVE_SECRET_KEY=$(echo "$SUPABASE_ENV_OUTPUT" | grep '^SECRET_KEY=' | cut -d'"' -f2)
  ENV_SERVICE_KEY=$(env_val "$BACKEND_ENV" "SUPABASE_SERVICE_KEY")

  if [[ -n "$LIVE_SECRET_KEY" && -n "$ENV_SERVICE_KEY" ]]; then
    if [[ "$LIVE_SECRET_KEY" == "$ENV_SERVICE_KEY" ]]; then
      pass "Backend SUPABASE_SERVICE_KEY matches Supabase"
    else
      fail "Backend SUPABASE_SERVICE_KEY does not match Supabase's SECRET_KEY" "Update SUPABASE_SERVICE_KEY in apps/backend/.env to: $LIVE_SECRET_KEY"
    fi
  fi

  if [[ -f "$MOBILE_ENV" ]]; then
    LIVE_PUBLISHABLE=$(echo "$SUPABASE_ENV_OUTPUT" | grep '^PUBLISHABLE_KEY=' | cut -d'"' -f2)
    ENV_ANON_KEY=$(env_val "$MOBILE_ENV" "EXPO_PUBLIC_SUPABASE_ANON_KEY")

    if [[ -n "$LIVE_PUBLISHABLE" && -n "$ENV_ANON_KEY" ]]; then
      if [[ "$LIVE_PUBLISHABLE" == "$ENV_ANON_KEY" ]]; then
        pass "Mobile ANON_KEY matches Supabase"
      else
        fail "Mobile EXPO_PUBLIC_SUPABASE_ANON_KEY does not match Supabase's PUBLISHABLE_KEY" "Update EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env to: $LIVE_PUBLISHABLE"
      fi
    fi
  fi
else
  if [[ -z "$SUPABASE_ENV_OUTPUT" ]]; then
    warn "Cannot verify config consistency — Supabase is not running" "just infra-up"
  fi
fi

# ─── 7. Database Schema ─────────────────────────────────

section "7. Database schema"

if port_open 127.0.0.1 54322; then
  SCHEMA_CHECK=$(docker exec supabase_db_nstil psql -U postgres -d postgres -t -c "
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_entries'
    ORDER BY ordinal_position;
  " 2>/dev/null || echo "")

  if [[ -z "$SCHEMA_CHECK" ]]; then
    fail "journal_entries table does not exist" "just db-reset"
  else
    EXPECTED_COLUMNS=("id" "user_id" "title" "body" "mood_score" "tags" "location" "entry_type" "embedding" "metadata" "created_at" "updated_at" "deleted_at")
    MISSING_COLS=()
    for col in "${EXPECTED_COLUMNS[@]}"; do
      if ! echo "$SCHEMA_CHECK" | grep -qw "$col"; then
        MISSING_COLS+=("$col")
      fi
    done

    if [[ ${#MISSING_COLS[@]} -eq 0 ]]; then
      pass "journal_entries schema is complete (${#EXPECTED_COLUMNS[@]} columns)"
    else
      fail "journal_entries is missing columns: ${MISSING_COLS[*]}" "just db-reset"
    fi
  fi
else
  warn "Cannot verify schema — Postgres is not reachable"
fi

# ─── 8. End-to-End Auth Chain ────────────────────────────

section "8. End-to-end auth chain"

if [[ "$SUPABASE_AUTH_STATUS" == "200" && "$HEALTH_STATUS" == "200" ]]; then
  JWKS_BODY=$(http_body "${SUPABASE_URL}/auth/v1/.well-known/jwks.json")
  JWKS_KEY_COUNT=$(echo "$JWKS_BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('keys',[])))" 2>/dev/null || echo "0")

  if [[ "$JWKS_KEY_COUNT" -gt 0 ]]; then
    pass "Supabase JWKS endpoint has $JWKS_KEY_COUNT key(s)"
  else
    warn "Supabase JWKS endpoint returned no keys — ES256 tokens will not verify"
  fi

  JWKS_ALG=$(echo "$JWKS_BODY" | python3 -c "import sys,json; keys=json.load(sys.stdin).get('keys',[]); print(keys[0].get('alg','') if keys else '')" 2>/dev/null || echo "")
  if [[ -n "$JWKS_ALG" ]]; then
    pass "Supabase JWT signing algorithm: $JWKS_ALG"
  fi

  ANON_KEY=""
  if [[ -f "$MOBILE_ENV" ]]; then
    ANON_KEY=$(env_val "$MOBILE_ENV" "EXPO_PUBLIC_SUPABASE_ANON_KEY")
  fi
  SERVICE_ROLE_KEY=""
  if [[ -n "$SUPABASE_ENV_OUTPUT" ]]; then
    SERVICE_ROLE_KEY=$(echo "$SUPABASE_ENV_OUTPUT" | grep '^SERVICE_ROLE_KEY=' | cut -d'"' -f2)
  fi

  if [[ -n "$SERVICE_ROLE_KEY" && -n "$ANON_KEY" ]]; then
    TEST_EMAIL="doctor-test-$(date +%s)@nstil.local"
    TEST_PASSWORD="DoctorTest1234"

    SIGNUP_RESP=$(curl -m 5 -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
      -H "apikey: ${ANON_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"email_confirm\":true}" 2>/dev/null || echo "{}")

    TEST_USER_ID=$(echo "$SIGNUP_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

    if [[ -z "$TEST_USER_ID" ]]; then
      warn "Could not create test user for auth chain verification"
    else
      SIGNIN_RESP=$(curl -m 5 -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
        -H "apikey: ${ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" 2>/dev/null || echo "{}")

      TEST_TOKEN=$(echo "$SIGNIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")

      if [[ -z "$TEST_TOKEN" ]]; then
        fail "Could not sign in test user — Supabase auth may be misconfigured"
      else
        ENTRIES_STATUS=$(curl -m 5 -s -o /dev/null -w "%{http_code}" \
          "${API_URL}/api/v1/entries" \
          -H "Authorization: Bearer ${TEST_TOKEN}" \
          -H "Content-Type: application/json" 2>/dev/null || echo "000")

        if [[ "$ENTRIES_STATUS" == "200" ]]; then
          pass "Full auth chain works: Supabase token → Backend → 200 OK"
        elif [[ "$ENTRIES_STATUS" == "401" ]]; then
          fail "Backend rejected Supabase-issued token (401)" "Restart the backend so JWKS is loaded: just backend-dev"
        else
          fail "Backend returned unexpected status $ENTRIES_STATUS for authenticated request"
        fi
      fi

      curl -m 5 -s -X DELETE "${SUPABASE_URL}/auth/v1/admin/users/${TEST_USER_ID}" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" &>/dev/null || true
    fi
  else
    warn "Cannot test auth chain — missing SERVICE_ROLE_KEY or ANON_KEY"
  fi
else
  warn "Skipping auth chain test — Supabase or Backend not running"
fi

# ─── Summary ─────────────────────────────────────────────

echo ""
echo -e "${BOLD}─── Summary ───${RESET}"

if [[ $FAILURES -eq 0 && $WARNINGS -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}All checks passed!${RESET} Your dev environment is ready."
elif [[ $FAILURES -eq 0 ]]; then
  echo -e "${YELLOW}${BOLD}${WARNINGS} warning(s), 0 failures.${RESET} Environment is functional but has minor issues."
else
  echo -e "${RED}${BOLD}${FAILURES} failure(s), ${WARNINGS} warning(s).${RESET} Fix the issues above before developing."
fi

exit $FAILURES
