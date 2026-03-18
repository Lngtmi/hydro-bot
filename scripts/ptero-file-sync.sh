#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.ptero.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

PTERO_PANEL_URL="${PTERO_PANEL_URL:-https://panel-legal.jhonaley.net}"
PTERO_SERVER_ID="${PTERO_SERVER_ID:-66e2e7fc}"
PTERO_API_KEY="${PTERO_API_KEY:-}"

if [[ -z "$PTERO_API_KEY" ]]; then
  echo "[ERROR] PTERO_API_KEY belum diisi."
  echo "Isi di file: $ENV_FILE"
  exit 1
fi

BASE_URL="${PTERO_PANEL_URL%/}/api/client/servers/${PTERO_SERVER_ID}"

usage() {
  cat <<'EOF'
Sync file lokal langsung ke Pterodactyl Files API.

Usage:
  bash scripts/ptero-file-sync.sh --all [--restart]
  bash scripts/ptero-file-sync.sh [--restart] hydro.js settings.js config.js

Options:
  --all         Upload semua file tracked git (yang ada di git ls-files)
  --restart     Restart server setelah upload/delete selesai
  -h, --help    Tampilkan bantuan

Catatan:
  - File yang tidak ada di lokal tapi disebut sebagai argumen akan dihapus di panel.
  - Upload menggunakan endpoint files/upload (signed URL), jadi sinkron real ke container.
EOF
}

API_BODY=""
API_CODE=""

api_request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local response
  local url="${BASE_URL}/${path}"

  if [[ "$method" == "GET" ]]; then
    response="$(curl -sS -w $'\n%{http_code}' \
      -X GET "$url" \
      -H "Authorization: Bearer ${PTERO_API_KEY}" \
      -H "Accept: application/json")"
  else
    response="$(curl -sS -w $'\n%{http_code}' \
      -X "$method" "$url" \
      -H "Authorization: Bearer ${PTERO_API_KEY}" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      --data "$data")"
  fi

  API_BODY="${response%$'\n'*}"
  API_CODE="${response##*$'\n'}"
}

require_2xx() {
  local context="$1"
  if [[ ! "$API_CODE" =~ ^2 ]]; then
    local preview
    preview="$(printf '%s' "$API_BODY" | tr '\n' ' ' | cut -c1-240)"
    echo "[ERROR] ${context} gagal (HTTP ${API_CODE}): ${preview}" >&2
    exit 1
  fi
}

urlencode() {
  python3 - "$1" <<'PY'
import sys, urllib.parse
print(urllib.parse.quote(sys.argv[1], safe=''))
PY
}

json_get_upload_url() {
  python3 -c 'import json,sys; obj=json.loads(sys.stdin.read() or "{}"); print(obj.get("attributes", {}).get("url", ""))'
}

json_create_folder_payload() {
  python3 - "$1" "$2" <<'PY'
import json, sys
print(json.dumps({"root": sys.argv[1], "name": sys.argv[2]}))
PY
}

json_delete_payload() {
  python3 - "$1" <<'PY'
import json, sys
print(json.dumps({"root": "/", "files": [sys.argv[1]]}))
PY
}

RESTART_AFTER=0
SYNC_ALL=0
declare -a INPUT_FILES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --restart)
      RESTART_AFTER=1
      shift
      ;;
    --all)
      SYNC_ALL=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do
        INPUT_FILES+=("$1")
        shift
      done
      ;;
    *)
      INPUT_FILES+=("$1")
      shift
      ;;
  esac
done

cd "$ROOT_DIR"

if (( SYNC_ALL == 1 )) && (( ${#INPUT_FILES[@]} == 0 )); then
  while IFS= read -r line; do
    INPUT_FILES+=("$line")
  done < <(git ls-files)
fi

if (( ${#INPUT_FILES[@]} == 0 )); then
  echo "[ERROR] Tidak ada file untuk di-sync."
  echo "Contoh: bash scripts/ptero-file-sync.sh --restart hydro.js settings.js"
  exit 1
fi

declare -a UPLOAD_FILES=()
declare -a DELETE_FILES=()

normalize_file() {
  local f="$1"
  f="${f#./}"
  while [[ "$f" == /* ]]; do
    f="${f#/}"
  done
  printf '%s' "$f"
}

TMP_FILES_LIST="$(mktemp)"
cleanup_tmp() {
  rm -f "$TMP_FILES_LIST"
}
trap cleanup_tmp EXIT

for raw in "${INPUT_FILES[@]}"; do
  file="$(normalize_file "$raw")"
  [[ -z "$file" ]] && continue
  printf '%s\n' "$file" >>"$TMP_FILES_LIST"
done

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  if [[ -f "$ROOT_DIR/$file" ]]; then
    UPLOAD_FILES+=("$file")
  else
    DELETE_FILES+=("$file")
  fi
done < <(LC_ALL=C sort -u "$TMP_FILES_LIST")

if (( ${#UPLOAD_FILES[@]} == 0 && ${#DELETE_FILES[@]} == 0 )); then
  echo "[INFO] Tidak ada file valid untuk diproses."
  exit 0
fi

ensure_remote_dir() {
  local dir="$1"
  [[ -z "$dir" ]] && return 0

  local current=""
  local part parent payload
  IFS='/' read -r -a parts <<<"$dir"

  for part in "${parts[@]}"; do
    [[ -z "$part" ]] && continue
    if [[ -z "$current" ]]; then
      parent="/"
      current="$part"
    else
      parent="/$current"
      current="$current/$part"
    fi

    payload="$(json_create_folder_payload "$parent" "$part")"
    api_request "POST" "files/create-folder" "$payload"
    if [[ ! "$API_CODE" =~ ^2 ]]; then
      if ! printf '%s' "$API_BODY" | grep -Eiq 'exist|already'; then
        require_2xx "create-folder $current"
      fi
    fi
  done

}

upload_one_file() {
  local rel_file="$1"
  local local_file="$ROOT_DIR/$rel_file"
  local rel_dir="${rel_file%/*}"
  local remote_dir="/"
  local encoded_dir upload_url upload_resp upload_body upload_code

  if [[ "$rel_dir" != "$rel_file" ]]; then
    ensure_remote_dir "$rel_dir"
    remote_dir="/$rel_dir"
  fi

  encoded_dir="$(urlencode "$remote_dir")"
  api_request "GET" "files/upload?directory=${encoded_dir}"
  require_2xx "ambil signed upload URL ($rel_file)"

  upload_url="$(printf '%s' "$API_BODY" | json_get_upload_url)"
  if [[ -z "$upload_url" ]]; then
    echo "[ERROR] Signed upload URL kosong untuk: $rel_file" >&2
    exit 1
  fi

  upload_resp="$(curl -sS -w $'\n%{http_code}' -X POST \
    -H "Accept: application/json" \
    -F "files=@${local_file}" \
    "$upload_url")"

  upload_body="${upload_resp%$'\n'*}"
  upload_code="${upload_resp##*$'\n'}"
  if [[ ! "$upload_code" =~ ^2 ]]; then
    local preview
    preview="$(printf '%s' "$upload_body" | tr '\n' ' ' | cut -c1-220)"
    echo "[ERROR] Upload gagal ($rel_file) HTTP ${upload_code}: ${preview}" >&2
    exit 1
  fi
}

delete_one_file() {
  local rel_file="$1"
  local payload
  payload="$(json_delete_payload "$rel_file")"
  api_request "POST" "files/delete" "$payload"
  require_2xx "hapus file remote ($rel_file)"
}

uploaded=0
deleted=0

echo "[INFO] Uploading ${#UPLOAD_FILES[@]} file(s)..."
for f in "${UPLOAD_FILES[@]}"; do
  upload_one_file "$f"
  uploaded=$((uploaded + 1))
  echo "  [UP] $f"
done

if (( ${#DELETE_FILES[@]} > 0 )); then
  echo "[INFO] Deleting ${#DELETE_FILES[@]} file(s) yang sudah tidak ada di lokal..."
  for f in "${DELETE_FILES[@]}"; do
    delete_one_file "$f"
    deleted=$((deleted + 1))
    echo "  [DEL] $f"
  done
fi

if (( RESTART_AFTER == 1 )); then
  api_request "POST" "power" '{"signal":"restart"}'
  require_2xx "restart server"
  echo "[OK] Restart signal terkirim."
fi

echo "[OK] Sync selesai. Uploaded: ${uploaded}, Deleted: ${deleted}"
