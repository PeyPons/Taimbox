#!/bin/bash
# Cron horario: expire-trials (p. ej. minuto 15).
set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-https://api.taimbox.com}"
NOTIFY_ENV="${NOTIFY_ENV:-/home/alex/.config/taimbox/notifications-cron.env}"
DOCKER_ENV="${DOCKER_ENV:-/home/alex/supabase-pi/supabase/docker/.env}"

if [ -z "${NOTIFICATIONS_CRON_SECRET:-}" ] && [ -f "$NOTIFY_ENV" ]; then
  # shellcheck disable=SC1090
  set -a
  . "$NOTIFY_ENV"
  set +a
fi

if [ -z "${NOTIFICATIONS_CRON_SECRET:-}" ] && [ -f "$DOCKER_ENV" ]; then
  NOTIFICATIONS_CRON_SECRET="$(grep '^NOTIFICATIONS_CRON_SECRET=' "$DOCKER_ENV" | cut -d= -f2- | tr -d '"\r' || true)"
fi

if [ -z "${NOTIFICATIONS_CRON_SECRET:-}" ]; then
  echo "[$(date -Is)] ERROR: NOTIFICATIONS_CRON_SECRET no definido" >&2
  exit 1
fi

echo "[$(date -Is)] POST expire-trials"
curl -fsS --max-time 120 -w "\n[$(date -Is)] HTTP %{http_code}\n" \
  -X POST "${SUPABASE_URL}/functions/v1/expire-trials" \
  -H "Authorization: Bearer ${NOTIFICATIONS_CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}'
