#!/usr/bin/env bash
set -euo pipefail

BOLD="\033[1m"
RESET="\033[0m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE_DIR="$REPO_ROOT/apps/mobile"
BACKEND_DIR="$REPO_ROOT/apps/backend"
MOBILE_ENV="$MOBILE_DIR/.env"
BACKEND_ENV="$BACKEND_DIR/.env"
DEVICE_MODE=false

for arg in "$@"; do
  case "$arg" in
    --device) DEVICE_MODE=true ;;
  esac
done

step() {
  echo -e "\n${BOLD}→ $1${RESET}"
}

kill_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "  Killing process(es) on port $port"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

open_iterm_tab() {
  local cmd="$1"
  osascript -e 'tell application "iTerm"' \
            -e 'activate' \
            -e 'tell current window' \
            -e 'create tab with default profile' \
            -e 'tell current session' \
            -e "write text \"$cmd\"" \
            -e 'end tell' \
            -e 'end tell' \
            -e 'end tell' > /dev/null 2>&1
}

get_lan_ip() {
  local ip
  ip=$(ipconfig getifaddr en0 2>/dev/null || true)
  if [[ -z "$ip" ]]; then
    ip=$(ipconfig getifaddr en1 2>/dev/null || true)
  fi
  echo "$ip"
}

read_env_value() {
  local file="$1"
  local key="$2"
  grep "^${key}=" "$file" | cut -d= -f2-
}

write_mobile_env() {
  local supabase_url="$1"
  local api_url="$2"
  local anon_key
  anon_key=$(read_env_value "$MOBILE_ENV" "EXPO_PUBLIC_SUPABASE_ANON_KEY")

  cat > "$MOBILE_ENV" <<EOF
EXPO_PUBLIC_SUPABASE_URL=${supabase_url}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${anon_key}
EXPO_PUBLIC_API_URL=${api_url}
EOF
}

write_backend_env() {
  local supabase_url="$1"
  local service_key
  local jwt_secret
  local redis_url
  local cors_origins
  service_key=$(read_env_value "$BACKEND_ENV" "SUPABASE_SERVICE_KEY")
  jwt_secret=$(read_env_value "$BACKEND_ENV" "SUPABASE_JWT_SECRET")
  redis_url=$(read_env_value "$BACKEND_ENV" "REDIS_URL")
  cors_origins=$(read_env_value "$BACKEND_ENV" "CORS_ORIGINS")

  cat > "$BACKEND_ENV" <<EOF
SUPABASE_URL=${supabase_url}
SUPABASE_SERVICE_KEY=${service_key}
SUPABASE_JWT_SECRET=${jwt_secret}
REDIS_URL=${redis_url}
CORS_ORIGINS=${cors_origins}
DEBUG=true
EOF
}

if $DEVICE_MODE; then
  LAN_IP=$(get_lan_ip)
  if [[ -z "$LAN_IP" ]]; then
    echo -e "${RED}Could not detect LAN IP. Are you connected to Wi-Fi?${RESET}"
    exit 1
  fi
  echo -e "${BOLD}NStil Dev — Physical Device Mode${RESET}"
  echo -e "  LAN IP: ${GREEN}${LAN_IP}${RESET}"
else
  LAN_IP=""
  echo -e "${BOLD}NStil Dev — Starting everything${RESET}"
fi

step "Stopping stale Docker containers"
docker compose -f "$REPO_ROOT/docker-compose.yml" down --remove-orphans 2>&1 | grep -v "^$" || true
docker stop nstil-backend-1 nstil-worker-1 2>/dev/null && echo "  Stopped nstil-backend-1, nstil-worker-1" || true

step "Killing processes on port 8000 (backend)"
kill_port 8000

step "Killing processes on port 8081 (Metro)"
kill_port 8081

step "Starting Redis"
docker compose -f "$REPO_ROOT/docker-compose.yml" up redis -d 2>/dev/null

step "Starting Supabase"
cd "$REPO_ROOT"
supabase start > /dev/null 2>&1 || true
echo "  Supabase started"

step "Resetting iOS Simulator keychain"
BOOTED_DEVICE_ID=$(xcrun simctl list devices booted -j 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    for d in devices:
        if d.get('state') == 'Booted':
            print(d['udid'])
            sys.exit(0)
" 2>/dev/null || true)
if [[ -n "$BOOTED_DEVICE_ID" ]]; then
  xcrun simctl keychain "$BOOTED_DEVICE_ID" reset 2>/dev/null && echo "  Keychain reset for $BOOTED_DEVICE_ID" || echo "  No booted simulator to reset"
else
  echo "  No booted simulator found — skipping"
fi

step "Waiting for Supabase Auth to be healthy"
for i in $(seq 1 15); do
  status=$(curl -m 2 -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54321/auth/v1/health 2>/dev/null || echo "000")
  if [[ "$status" == "200" ]]; then
    echo "  Supabase Auth is healthy"
    break
  fi
  if [[ "$i" == "15" ]]; then
    echo -e "  ${RED}Supabase Auth not healthy after 15s — check supabase status${RESET}"
  fi
  sleep 1
done

if $DEVICE_MODE; then
  step "Configuring .env files for device (LAN IP: ${LAN_IP})"
  write_mobile_env "http://${LAN_IP}:54321" "http://${LAN_IP}:8000"
  write_backend_env "http://${LAN_IP}:54321"
  echo "  Mobile .env → LAN IP"
  echo "  Backend .env → LAN IP"
else
  step "Configuring .env files for simulator (localhost)"
  write_mobile_env "http://127.0.0.1:54321" "http://localhost:8000"
  write_backend_env "http://127.0.0.1:54321"
  echo "  Mobile .env → localhost"
  echo "  Backend .env → localhost"
fi

step "Opening backend in new iTerm tab"
open_iterm_tab "cd $REPO_ROOT/apps/backend && uv run uvicorn nstil.main:create_app --factory --reload --host 0.0.0.0 --port 8000"

step "Waiting for backend to start"
for i in $(seq 1 15); do
  status=$(curl -m 2 -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/health 2>/dev/null || echo "000")
  if [[ "$status" == "200" ]]; then
    echo "  Backend is healthy"
    break
  fi
  if [[ "$i" == "15" ]]; then
    echo -e "  ${RED}Backend not healthy after 15s — check the backend iTerm tab for errors${RESET}"
  fi
  sleep 1
done

if $DEVICE_MODE; then
  step "Opening Metro + iOS Device in new iTerm tab"
  open_iterm_tab "cd $REPO_ROOT/apps/mobile && npx expo run:ios --device 2>&1 | grep -v 'HALC_ProxyObjectMap'"

  echo -e "\n${GREEN}${BOLD}All services started (device mode)!${RESET}"
  echo -e "  Backend:  http://${LAN_IP}:8000"
  echo -e "  Metro:    http://${LAN_IP}:8081 (LAN)"
  echo -e "  Supabase: http://${LAN_IP}:54321"
  echo "  Redis:    localhost:6379"
  echo ""
  echo -e "  ${YELLOW}Your phone must be on the same Wi-Fi network.${RESET}"
  echo -e "  ${YELLOW}Run 'just dev' to switch back to simulator mode.${RESET}"
else
  step "Opening Metro + iOS Simulator in new iTerm tab"
  open_iterm_tab "cd $REPO_ROOT/apps/mobile && EXPO_PACKAGER_PROXY_URL=http://localhost:8081 npx expo run:ios 2>&1 | grep -v 'HALC_ProxyObjectMap'"

  echo -e "\n${GREEN}${BOLD}All services started!${RESET}"
  echo "  Backend:  http://localhost:8000"
  echo "  Metro:    http://localhost:8081"
  echo "  Supabase: http://127.0.0.1:54321"
  echo "  Redis:    localhost:6379"
fi

echo ""
echo -e "Run ${BOLD}just doctor${RESET} to verify everything is connected."
