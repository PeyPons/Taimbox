#!/usr/bin/env bash
# Invocar cada hora desde crontab en el servidor Pi:
# 0 * * * * /home/alex/Timeboxing/scripts/cron-ads-sync.sh >> /var/log/taimbox-ads-cron.log 2>&1
set -euo pipefail
SUPABASE_URL="${SUPABASE_URL:-https://api.taimbox.com}"
ADS_CRON_SECRET="${ADS_CRON_SECRET:?Set ADS_CRON_SECRET}"
curl -sS -X POST "${SUPABASE_URL}/functions/v1/scheduled-ads-sync" \
  -H "Authorization: Bearer ${ADS_CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}'
