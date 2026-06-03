#!/usr/bin/env bash
# Restaura entradas Taimbox en crontab (Pi). Lee ADS_CRON_SECRET del .env de Supabase Docker.
set -euo pipefail
DOCKER_ENV="${DOCKER_ENV:-/home/alex/supabase-pi/supabase/docker/.env}"
ADS="$(grep '^ADS_CRON_SECRET=' "$DOCKER_ENV" | cut -d= -f2- | tr -d '"')"
if [ -z "$ADS" ]; then
  echo "ADS_CRON_SECRET no encontrado en $DOCKER_ENV"
  exit 1
fi
TMP="$(mktemp)"
{
  echo '# DuckDNS'
  echo '*/5 * * * * /home/alex/scripts/duckdns.sh >/dev/null 2>&1'
  echo ''
  echo '# Supabase'
  echo '0 4 * * * /home/alex/backup_system.sh >> /home/alex/backup.log 2>&1'
  echo ''
  echo '# Cloudflare DDNS'
  echo '*/5 * * * * /home/alex/scripts/cloudflare.sh >/dev/null 2>&1'
  echo ''
  echo '# Taimbox notificaciones programadas'
  echo '0 * * * * . /home/alex/.config/taimbox/notifications-cron.env && curl -fsS -X POST "https://api.taimbox.com/functions/v1/process-notification-rules" -H "Authorization: Bearer $NOTIFICATIONS_CRON_SECRET" -H "Content-Type: application/json" -d "{}" 2>&1 | logger -t taimbox-notifications'
  echo "0 * * * * ADS_CRON_SECRET=${ADS} SUPABASE_URL=https://api.taimbox.com /home/alex/Timeboxing/scripts/cron-ads-sync.sh >> /home/alex/logs/taimbox-ads-cron.log 2>&1"
  echo '15 * * * * set -a && . /home/alex/.config/taimbox/notifications-cron.env && set +a && /home/alex/Timeboxing/scripts/cron-expire-trials.sh >> /home/alex/logs/taimbox-expire-trials.log 2>&1'
} > "$TMP"
crontab "$TMP"
rm -f "$TMP"
echo "Crontab Taimbox restaurado."
