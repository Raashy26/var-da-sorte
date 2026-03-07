#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${BOT_PORT:-8000}"
HOST="127.0.0.1"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1"
    exit 1
  }
}

need_cmd curl

echo "[1/4] Local API health"
if curl -fsS "http://${HOST}:${PORT}/healthz" >/dev/null 2>&1; then
  echo "OK: http://${HOST}:${PORT}/healthz"
else
  echo "FAIL: local API is not reachable"
fi

echo ""
echo "[2/5] Ollama"
if curl -fsS "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
  echo "OK: Ollama API reachable on 127.0.0.1:11434"
else
  echo "FAIL: Ollama API not reachable"
fi

echo ""
echo "[3/5] Ngrok tunnels"
if curl -fsS "http://127.0.0.1:4040/api/tunnels" >/dev/null 2>&1; then
  curl -fsS "http://127.0.0.1:4040/api/tunnels"
else
  echo "FAIL: ngrok API not reachable on 127.0.0.1:4040"
fi

echo ""
echo "[4/5] Telegram webhook info"
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  "${ROOT_DIR}/scripts/get_webhook_info.sh"
else
  echo "SKIP: set TELEGRAM_BOT_TOKEN to query Telegram webhook info"
fi

echo ""
echo "[5/5] Reminder"
echo "Bot only stays online while this machine and local processes are running."
