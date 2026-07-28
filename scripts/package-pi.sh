#!/usr/bin/env bash
# Create a deployable tarball for Raspberry Pi (no node_modules — install on device)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NAME="dashboard-os-pi"
STAMP="$(date +%Y%m%d)"
OUT_DIR="${ROOT}/dist"
OUT="${OUT_DIR}/${NAME}-${STAMP}.tar.gz"
STAGE="${OUT_DIR}/.stage-${NAME}"

mkdir -p "$OUT_DIR"
rm -rf "$STAGE"
rm -f "$OUT"
mkdir -p "$STAGE/dashboard-os"

# Production build on the packaging machine (or skip if building on Pi)
if [[ "${BUILD_ON_HOST:-1}" == "1" ]]; then
  echo "Building production bundle…"
  npm run build
fi

echo "Staging files…"
# Source + build + deploy tooling (no node_modules, no local SQLite data)
rsync -a \
  --exclude node_modules \
  --exclude .git \
  --exclude data \
  --exclude dist \
  --exclude '.next/cache' \
  --exclude '*.log' \
  --exclude .DS_Store \
  package.json \
  package-lock.json \
  next.config.ts \
  tsconfig.json \
  postcss.config.mjs \
  components.json \
  README.md \
  scripts \
  deploy \
  public \
  src \
  "$STAGE/dashboard-os/"

if [[ -d .next ]]; then
  rsync -a --exclude cache .next "$STAGE/dashboard-os/"
fi

# Install helper + clear Pi deploy guide inside the package
cp deploy/INSTALL-PI.md "$STAGE/dashboard-os/INSTALL-PI.md" 2>/dev/null || true
cp scripts/install-on-pi.sh "$STAGE/dashboard-os/scripts/install-on-pi.sh"
chmod +x "$STAGE/dashboard-os/scripts/"*.sh

echo "Packaging ${OUT}…"
tar -czf "$OUT" -C "$STAGE" dashboard-os
rm -rf "$STAGE"

SIZE="$(du -h "$OUT" | awk '{print $1}')"
echo ""
echo "✓ Package ready: $OUT ($SIZE)"
echo ""
echo "Copy to your Pi, then:"
echo "  scp \"$OUT\" pi@PI_IP:~/ "
echo "  ssh pi@PI_IP"
echo "  tar -xzf $(basename "$OUT")"
echo "  cd dashboard-os"
echo "  bash scripts/install-on-pi.sh"
echo ""
echo "Full guide: README.md (Raspberry Pi section) or INSTALL-PI.md inside the tarball."
