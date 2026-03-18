#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
Sync local changes to panel in one flow:
  1) git add + commit (jika ada perubahan)
  2) git push
  3) upload file commit terbaru ke panel (Files API)
  4) restart panel

Usage:
  bash scripts/ptero-sync.sh
  bash scripts/ptero-sync.sh "pesan commit custom"

Env (opsional):
  PTERO_GIT_REMOTE   default: origin
  PTERO_GIT_BRANCH   default: branch aktif / main
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

COMMIT_MESSAGE="${1:-chore: sync panel $(date '+%Y-%m-%d %H:%M:%S')}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[ERROR] Folder ini bukan repository git."
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
if command -v python3 >/dev/null 2>&1; then
  PROJECT_REL="$(python3 -c 'import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))' "$ROOT_DIR" "$REPO_ROOT")"
else
  PROJECT_REL="${ROOT_DIR#$REPO_ROOT/}"
fi

if [[ -z "$PROJECT_REL" || "$PROJECT_REL" == ..* ]]; then
  echo "[ERROR] Path proyek tidak aman: '$PROJECT_REL'"
  echo "Sync dibatalkan untuk mencegah commit folder di luar project bot."
  exit 1
fi

if [[ "$PROJECT_REL" == "." && "$REPO_ROOT" != "$ROOT_DIR" ]]; then
  echo "[ERROR] Path proyek terdeteksi '.' pada repo parent."
  echo "Sync dibatalkan untuk mencegah commit folder di luar project bot."
  exit 1
fi

REMOTE="${PTERO_GIT_REMOTE:-origin}"
BRANCH="${PTERO_GIT_BRANCH:-$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo main)}"
COMMITTED=0
declare -a DEPLOY_FILES_RAW=()
declare -a DEPLOY_FILES=()

if ! git -C "$REPO_ROOT" remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "[ERROR] Remote git '$REMOTE' belum di-set."
  echo "Set dulu, contoh:"
  echo "  git remote add origin https://github.com/USERNAME/REPO.git"
  exit 1
fi

echo "[INFO] Target sync: $PROJECT_REL"
echo "[INFO] Stage perubahan..."
git -C "$REPO_ROOT" add -A -- "$PROJECT_REL"

if git -C "$REPO_ROOT" diff --cached --quiet -- "$PROJECT_REL"; then
  echo "[INFO] Tidak ada perubahan lokal untuk di-commit."
else
  echo "[INFO] Commit perubahan..."
  git -C "$REPO_ROOT" commit -m "$COMMIT_MESSAGE" -- "$PROJECT_REL"
  COMMITTED=1
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    DEPLOY_FILES_RAW+=("$line")
  done < <(git -C "$REPO_ROOT" show --pretty='' --name-only HEAD -- "$PROJECT_REL" | sed '/^$/d')
fi

echo "[INFO] Push ke $REMOTE/$BRANCH ..."
if ! git -C "$REPO_ROOT" push "$REMOTE" "$BRANCH"; then
  echo "[ERROR] Push ke GitHub gagal."
  echo "Silakan login GitHub di terminal lokal dulu (username + PAT), lalu ulangi:"
  echo "  git -C \"$REPO_ROOT\" push -u \"$REMOTE\" \"$BRANCH\""
  exit 1
fi

if (( COMMITTED == 1 )); then
  for f in "${DEPLOY_FILES_RAW[@]}"; do
    if [[ "$PROJECT_REL" == "." ]]; then
      DEPLOY_FILES+=("$f")
    else
      DEPLOY_FILES+=("${f#${PROJECT_REL}/}")
    fi
  done
fi

if (( ${#DEPLOY_FILES[@]} == 0 )); then
  echo "[INFO] Tidak ada file baru dari commit saat ini."
  echo "[INFO] Sinkronisasi panel pakai file inti..."
  DEPLOY_FILES=(hydro.js settings.js config.js package.json index.js)
fi

echo "[INFO] Upload file ke panel via Files API..."
bash "$ROOT_DIR/scripts/ptero-file-sync.sh" --restart "${DEPLOY_FILES[@]}"

echo "[OK] Sinkronisasi selesai: local -> git -> panel"
