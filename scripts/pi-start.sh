#!/usr/bin/env bash
# Dashboard OS — Raspberry Pi 2GB production start
set -euo pipefail
cd "$(dirname "$0")/.."

export NODE_ENV=production
# Cap V8 heap so the OS + Chromium still have room on 2GB
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=384}"
# Optional: force performance mode even if DB has it off
export DASHBOARD_PI=1

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

if [[ ! -d .next ]]; then
  echo "No production build found. Running npm run build..."
  npm run build
fi

echo "Starting Dashboard OS on ${HOST}:${PORT} (Pi memory profile)"
exec npx next start --hostname "$HOST" --port "$PORT"
