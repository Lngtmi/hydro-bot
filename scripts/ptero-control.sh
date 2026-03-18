#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/ptero-control.sh restart
#   bash scripts/ptero-control.sh deploy
#   bash scripts/ptero-control.sh command "pm2 list"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.ptero.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

PTERO_PANEL_URL="${PTERO_PANEL_URL:-https://panel-legal.jhonaley.net}"
PTERO_SERVER_ID="${PTERO_SERVER_ID:-66e2e7fc}"
PTERO_API_KEY="${PTERO_API_KEY:-}"
PTERO_GIT_URL="${PTERO_GIT_URL:-}"
PTERO_GIT_BRANCH="${PTERO_GIT_BRANCH:-main}"
PTERO_DEPLOY_COMMAND="${PTERO_DEPLOY_COMMAND:-}"

if [[ -z "$PTERO_DEPLOY_COMMAND" ]]; then
  if [[ -n "$PTERO_GIT_URL" ]]; then
    PTERO_DEPLOY_COMMAND="cd /home/container && ( [ -d .git ] || (git init && git remote add origin $PTERO_GIT_URL) ) && git remote set-url origin $PTERO_GIT_URL && git fetch origin $PTERO_GIT_BRANCH && git reset --hard origin/$PTERO_GIT_BRANCH && npm install --omit=dev"
  else
    PTERO_DEPLOY_COMMAND="cd /home/container && git pull origin main && npm install --omit=dev"
  fi
fi

usage() {
  cat <<'EOF'
Pterodactyl control helper

Commands:
  start                 Start server
  stop                  Stop server
  restart               Restart server
  command "<text>"      Run console command
  deploy                Run deploy command, then restart

Environment (from .ptero.env or shell):
  PTERO_PANEL_URL
  PTERO_SERVER_ID
  PTERO_API_KEY         (Client API Key, format usually starts with ptlc_)
  PTERO_GIT_URL         (opsional, jika deploy mau auto init/fetch/reset)
  PTERO_GIT_BRANCH      (default: main)
  PTERO_DEPLOY_COMMAND
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

if [[ -z "$PTERO_API_KEY" ]]; then
  echo "[ERROR] PTERO_API_KEY belum diisi."
  echo "Isi di file: $ENV_FILE"
  exit 1
fi

ACTION="${1:-deploy}"
BASE_URL="${PTERO_PANEL_URL%/}/api/client/servers/${PTERO_SERVER_ID}"

escape_json() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  printf '%s' "$s"
}

api_post() {
  local path="$1"
  local payload="$2"
  curl -sS --fail-with-body \
    -X POST "${BASE_URL}/${path}" \
    -H "Authorization: Bearer ${PTERO_API_KEY}" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    --data "$payload" >/dev/null
}

send_power() {
  local signal="$1"
  api_post "power" "{\"signal\":\"${signal}\"}"
  echo "[OK] Power signal sent: ${signal}"
}

send_command() {
  local cmd="$1"
  local escaped
  escaped="$(escape_json "$cmd")"
  api_post "command" "{\"command\":\"${escaped}\"}"
  echo "[OK] Command sent: ${cmd}"
}

case "$ACTION" in
  start)
    send_power "start"
    ;;
  stop)
    send_power "stop"
    ;;
  restart)
    send_power "restart"
    ;;
  command)
    if [[ $# -lt 2 ]]; then
      echo "[ERROR] command membutuhkan teks perintah."
      echo "Contoh: bash scripts/ptero-control.sh command \"pm2 list\""
      exit 1
    fi
    shift
    send_command "$*"
    ;;
  deploy)
    send_command "$PTERO_DEPLOY_COMMAND"
    sleep 1
    send_power "restart"
    echo "[OK] Deploy + restart selesai dikirim."
    ;;
  *)
    echo "[ERROR] Unknown action: $ACTION"
    usage
    exit 1
    ;;
esac
