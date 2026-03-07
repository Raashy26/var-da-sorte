#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${BOT_PORT:-8000}"
HOST="127.0.0.1"
UVICORN_LOG="${ROOT_DIR}/.uvicorn.log"
NGROK_LOG="${ROOT_DIR}/.ngrok.log"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1"
    exit 1
  }
}

need_cmd curl

NGROK_BIN=""
if command -v ngrok >/dev/null 2>&1; then
  NGROK_BIN="$(command -v ngrok)"
elif command -v ngrok.exe >/dev/null 2>&1; then
  NGROK_BIN="$(command -v ngrok.exe)"
else
  echo "Missing required command: ngrok or ngrok.exe"
  exit 1
fi

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "Missing TELEGRAM_BOT_TOKEN"
  exit 1
fi

if [[ ! -f "${ROOT_DIR}/.env" ]]; then
  echo "Missing .env at ${ROOT_DIR}/.env"
  echo "Create it from .env.example before running this script."
  exit 1
fi

if ! curl -fsS "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
  echo "Ollama is not reachable on 127.0.0.1:11434"
  echo "Start Ollama first (example: 'ollama serve')."
  exit 1
fi

PYTHON_BIN=""
if [[ -x "${ROOT_DIR}/.venv/bin/python" ]]; then
  PYTHON_BIN="${ROOT_DIR}/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v python3)"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v python)"
else
  echo "Missing required command: python3 or python"
  exit 1
fi

cleanup() {
  if [[ -n "${NGROK_PID:-}" ]]; then
    kill "${NGROK_PID}" >/dev/null 2>&1 || true
  fi
  if [[ -n "${UVICORN_PID:-}" ]]; then
    kill "${UVICORN_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

cd "${ROOT_DIR}"

"${PYTHON_BIN}" -m uvicorn app.main:app --host "${HOST}" --port "${PORT}" >"${UVICORN_LOG}" 2>&1 &
UVICORN_PID=$!

echo "Starting bot API on ${HOST}:${PORT} (pid=${UVICORN_PID})..."
for _ in $(seq 1 30); do
  if curl -fsS "http://${HOST}:${PORT}/healthz" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "http://${HOST}:${PORT}/healthz" >/dev/null 2>&1; then
  echo "Bot API failed to start. Check ${UVICORN_LOG}"
  exit 1
fi

"${NGROK_BIN}" http "http://${HOST}:${PORT}" --log=stdout >"${NGROK_LOG}" 2>&1 &
NGROK_PID=$!

echo "Starting ngrok tunnel (pid=${NGROK_PID})..."

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:4040/api/tunnels" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

NGROK_URL=$("${PYTHON_BIN}" - <<'PY'
import json
import urllib.request

with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=5) as r:
    data = json.load(r)

for tunnel in data.get("tunnels", []):
    url = tunnel.get("public_url", "")
    if url.startswith("https://"):
        print(url)
        raise SystemExit(0)

raise SystemExit(1)
PY
)

if [[ -z "${NGROK_URL}" ]]; then
  echo "Could not resolve ngrok public URL. Check ${NGROK_LOG}"
  exit 1
fi

export WEBHOOK_BASE_URL="${NGROK_URL}"
"${ROOT_DIR}/scripts/set_webhook.sh" >/dev/null

echo ""
echo "Stack online"
echo "- Local API: http://${HOST}:${PORT}"
echo "- Ngrok URL: ${NGROK_URL}"
echo "- Webhook: ${NGROK_URL}/telegram/webhook"
echo ""
echo "Logs:"
echo "- ${UVICORN_LOG}"
echo "- ${NGROK_LOG}"
echo ""
echo "Press Ctrl+C to stop"

wait "${UVICORN_PID}" "${NGROK_PID}"
