#!/usr/bin/env bash
# Invocar cada hora (p. ej. minuto 15) desde crontab en el servidor Pi.
# Requiere NOTIFICATIONS_CRON_SECRET en el entorno (mismo valor que Edge Functions).
set -euo pipefail
SUPABASE_URL="${SUPABASE_URL:-https://api.taimbox.com}"
NOTIFICATIONS_CRON_SECRET="${NOTIFICATIONS_CRON_SECRET:?Set NOTIFICATIONS_CRON_SECRET}"
curl -fsS -X POST "${SUPABASE_URL}/functions/v1/expire-trials" \
  -H "Authorization: Bearer ${NOTIFICATIONS_CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}'
