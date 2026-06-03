#!/bin/bash
# Cron horario: scheduled-ads-sync (Google + Meta, planes Agency+).
# Crontab Pi: 0 * * * * /home/alex/Timeboxing/scripts/cron-ads-sync.sh >> /home/alex/logs/taimbox-ads-cron.log 2>&1
set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-https://api.taimbox.com}"
DOCKER_ENV="${DOCKER_ENV:-/home/alex/supabase-pi/supabase/docker/.env}"

# En la Pi: llamar a Kong local evita timeout de Cloudflare (504 ~60s)
if [ -z "${SUPABASE_URL_FORCE:-}" ] && [ -z "${SUPABASE_INTERNAL_SKIP:-}" ]; then
  for internal in "${SUPABASE_INTERNAL_URL:-http://127.0.0.1:8001}" "http://127.0.0.1:8000"; do
    if curl -sS -o /dev/null --connect-timeout 2 --max-time 3 "${internal}/functions/v1/" 2>/dev/null; then
      SUPABASE_URL="$internal"
      break
    fi
  done
fi

if [ -z "${ADS_CRON_SECRET:-}" ] && [ -f "$DOCKER_ENV" ]; then
  ADS_CRON_SECRET="$(grep '^ADS_CRON_SECRET=' "$DOCKER_ENV" | cut -d= -f2- | tr -d '"\r' || true)"
fi

if [ -z "${ADS_CRON_SECRET:-}" ]; then
  echo "[$(date -Is)] ERROR: ADS_CRON_SECRET no definido (export o $DOCKER_ENV)" >&2
  exit 1
fi

echo "[$(date -Is)] POST scheduled-ads-sync"
curl -sS --max-time 600 -w "\n[$(date -Is)] HTTP %{http_code}\n" \
  -X POST "${SUPABASE_URL}/functions/v1/scheduled-ads-sync" \
  -H "Authorization: Bearer ${ADS_CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}'
