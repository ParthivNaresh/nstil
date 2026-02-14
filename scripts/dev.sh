#!/usr/bin/env bash
set -euo pipefail

BOLD="\033[1m"
RESET="\033[0m"
GREEN="\033[32m"
RED="\033[31m"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

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

echo -e "${BOLD}NStil Dev — Starting everything${RESET}"

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

step "Opening backend in new iTerm tab"
open_iterm_tab "cd $REPO_ROOT/apps/backend && uv run uvicorn nstil.main:app --reload --host 0.0.0.0 --port 8000"

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

step "Opening Metro + iOS Simulator in new iTerm tab"
open_iterm_tab "cd $REPO_ROOT/apps/mobile && EXPO_PACKAGER_PROXY_URL=http://localhost:8081 npx expo run:ios"

echo -e "\n${GREEN}${BOLD}All services started!${RESET}"
echo "  Backend:  http://localhost:8000"
echo "  Metro:    http://localhost:8081"
echo "  Supabase: http://127.0.0.1:54321"
echo "  Redis:    localhost:6379"
echo ""
echo -e "Run ${BOLD}just doctor${RESET} to verify everything is connected."
