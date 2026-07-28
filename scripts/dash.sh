#!/usr/bin/env bash
# Dashboard OS — one command for install / start / service / update
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"
SERVICE_NAME="dashboard-os"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# Detect npm/node paths for systemd (more reliable than bare "npm")
NPM_BIN="$(command -v npm || true)"
NODE_BIN="$(command -v node || true)"
if [[ -z "$NPM_BIN" ]]; then
  NPM_BIN="/usr/bin/npm"
fi
if [[ -z "$NODE_BIN" ]]; then
  NODE_BIN="/usr/bin/node"
fi

USER_NAME="${SUDO_USER:-${USER:-$(id -un)}}"
HOME_DIR="$(eval echo "~${USER_NAME}")"

ip_hint() {
  hostname -I 2>/dev/null | awk '{print $1}'
}

usage() {
  cat <<EOF
Dashboard OS

Usage:
  ./start              Start the server (default)
  ./start enable       Install + start on boot (systemd)
  ./start stop         Stop background service
  ./start restart      Restart background service
  ./start status       Show service / port status
  ./start update       git pull, rebuild, restart
  ./start install      Install deps + build (no start)
  ./start logs         Follow service logs

Env: PORT=3000 HOST=0.0.0.0
EOF
}

ensure_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo "Node.js not found. On the Pi run:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs build-essential python3 git"
    exit 1
  fi
  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$major" -lt 20 ]]; then
    echo "Node 20+ required (found $(node -v))."
    exit 1
  fi
}

cmd_install() {
  ensure_node
  echo "==> Installing dependencies…"
  if [[ -f package-lock.json ]]; then
    npm ci --omit=dev
  else
    npm install --omit=dev
  fi
  echo "==> Building…"
  npm run build
  mkdir -p data
  echo "==> Install complete."
}

cmd_start_fg() {
  ensure_node
  export NODE_ENV=production
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=384}"
  export DASHBOARD_PI=1

  if [[ ! -d .next ]]; then
    echo "==> No build found — installing & building first…"
    cmd_install
  fi

  local ip
  ip="$(ip_hint)"
  echo ""
  echo "Dashboard OS starting on port ${PORT}"
  echo "  Local:  http://localhost:${PORT}"
  if [[ -n "$ip" ]]; then
    echo "  LAN:    http://${ip}:${PORT}"
    echo "  Phone:  http://${ip}:${PORT}/companion"
  fi
  echo "  Stop:   Ctrl+C"
  echo ""
  exec npx next start --hostname "$HOST" --port "$PORT"
}

write_service() {
  local unit
  unit=$(cat <<EOF
[Unit]
Description=Dashboard OS
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${USER_NAME}
WorkingDirectory=${ROOT}
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=384
Environment=DASHBOARD_PI=1
Environment=PORT=${PORT}
Environment=HOST=0.0.0.0
ExecStart=${ROOT}/start
Restart=on-failure
RestartSec=5
MemoryMax=600M
MemoryHigh=450M

[Install]
WantedBy=multi-user.target
EOF
)
  echo "$unit"
}

cmd_enable() {
  ensure_node
  if [[ ! -d .next ]]; then
    cmd_install
  fi

  if ! command -v systemctl >/dev/null 2>&1; then
    echo "systemd not available — starting in the foreground instead."
    cmd_start_fg
  fi

  echo "==> Installing systemd service as user '${USER_NAME}'"
  echo "    path: ${ROOT}"
  write_service | sudo tee "$SERVICE_FILE" >/dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable --now "$SERVICE_NAME"

  local ip
  ip="$(ip_hint)"
  echo ""
  echo "✓ Running in the background (starts on boot)."
  echo "  Open:    http://${ip:-localhost}:${PORT}"
  echo "  Status:  ./start status"
  echo "  Stop:    ./start stop"
  echo "  Logs:    ./start logs"
  echo ""
}

cmd_stop() {
  if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    sudo systemctl stop "$SERVICE_NAME"
    echo "Stopped ${SERVICE_NAME}."
  else
    # fall back: kill process on port
    if command -v fuser >/dev/null 2>&1; then
      sudo fuser -k "${PORT}/tcp" 2>/dev/null || true
    fi
    echo "No active ${SERVICE_NAME} service (cleared port ${PORT} if busy)."
  fi
}

cmd_restart() {
  if [[ -f "$SERVICE_FILE" ]]; then
    sudo systemctl restart "$SERVICE_NAME"
    echo "Restarted ${SERVICE_NAME}."
    cmd_status
  else
    echo "Service not installed. Run: ./start enable"
    exit 1
  fi
}

cmd_status() {
  local ip
  ip="$(ip_hint)"
  echo "App path:  ${ROOT}"
  echo "URL:       http://${ip:-localhost}:${PORT}"
  echo ""
  if command -v systemctl >/dev/null 2>&1 && [[ -f "$SERVICE_FILE" ]]; then
    systemctl --no-pager --full status "$SERVICE_NAME" || true
  else
    echo "systemd service not installed. Foreground start: ./start"
    if command -v ss >/dev/null 2>&1; then
      ss -ltnp 2>/dev/null | grep ":${PORT}" || echo "Port ${PORT}: not listening"
    fi
  fi
}

cmd_logs() {
  if [[ -f "$SERVICE_FILE" ]]; then
    journalctl -u "$SERVICE_NAME" -f
  else
    echo "No service installed. Use ./start for foreground logs."
    exit 1
  fi
}

cmd_update() {
  ensure_node
  echo "==> Updating…"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git pull --ff-only || git pull
  fi
  cmd_install
  if [[ -f "$SERVICE_FILE" ]] && systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
    sudo systemctl restart "$SERVICE_NAME"
    echo "✓ Updated and restarted."
    cmd_status
  else
    echo "✓ Updated. Start with: ./start   or   ./start enable"
  fi
}

CMD="${1:-start}"
case "$CMD" in
  start|"")
    # If service exists and is active, don't double-start in foreground
    if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
      echo "Already running as a service."
      cmd_status
      exit 0
    fi
    cmd_start_fg
    ;;
  enable|service|boot)
    cmd_enable
    ;;
  stop)
    cmd_stop
    ;;
  restart)
    cmd_restart
    ;;
  status)
    cmd_status
    ;;
  logs|log)
    cmd_logs
    ;;
  update|upgrade)
    cmd_update
    ;;
  install)
    cmd_install
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: $CMD"
    usage
    exit 1
    ;;
esac
