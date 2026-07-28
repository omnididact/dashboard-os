#!/usr/bin/env bash
# Run ON the Raspberry Pi after extracting the package
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Dashboard OS · Pi installer"
echo "Working directory: $(pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install Node 22 first:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs build-essential python3"
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "Node 20+ required (found $(node -v))."
  exit 1
fi

echo "==> Installing production dependencies (compiles better-sqlite3 for this CPU)…"
npm ci --omit=dev

# Host Mac may have produced a .next for a different arch — rebuild on Pi is safest
if [[ "${REBUILD:-1}" == "1" ]]; then
  echo "==> Building on Pi (native)…"
  npm run build
else
  if [[ ! -d .next ]]; then
    echo "No .next found — building…"
    npm run build
  else
    echo "==> Using packaged .next (set REBUILD=1 to rebuild on Pi)"
  fi
fi

mkdir -p data

echo ""
echo "Install complete."
echo ""
echo "Start now:"
echo "  npm run start:pi"
echo ""
echo "Or install systemd (edit User / WorkingDirectory first):"
echo "  sudo cp deploy/dashboard-os.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable --now dashboard-os"
echo ""
echo "Then open:  http://$(hostname -I | awk '{print $1}'):3000"
