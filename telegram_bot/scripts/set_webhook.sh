#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "Missing TELEGRAM_BOT_TOKEN"
  exit 1
fi

if [[ -z "${WEBHOOK_BASE_URL:-}" ]]; then
  echo "Missing WEBHOOK_BASE_URL (ex: https://abcd-12-34-56-78.ngrok-free.app)"
  exit 1
fi

WEBHOOK_URL="${WEBHOOK_BASE_URL%/}/telegram/webhook"

curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WEBHOOK_URL}\"}" | sed 's/"description":"[^"]*"/"description":"..."/'

echo
echo "Webhook configured to: ${WEBHOOK_URL}"
