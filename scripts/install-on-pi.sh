#!/usr/bin/env bash
# One-shot Pi setup: deps + build + optional auto-start on boot
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Dashboard OS · install"
echo "    ${ROOT}"

bash "$ROOT/scripts/dash.sh" install

# Auto-enable background service when systemd is available (typical on Pi OS)
if command -v systemctl >/dev/null 2>&1; then
  echo ""
  echo "==> Enabling start-on-boot…"
  bash "$ROOT/scripts/dash.sh" enable
else
  echo ""
  echo "Install done. Start with:"
  echo "  ./start"
fi
