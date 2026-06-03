#!/usr/bin/env bash
# Ejecutar EN EL SERVIDOR (Pi) una vez: añade secrets de cron al contenedor Edge y reinicia.
set -euo pipefail
DOCKER_DIR="${DOCKER_DIR:-/home/alex/supabase-pi/supabase/docker}"
ENV_FILE="$DOCKER_DIR/.env"
COMPOSE="$DOCKER_DIR/docker-compose.yml"
NOTIF_ENV="${NOTIF_ENV:-/home/alex/.config/taimbox/notifications-cron.env}"

if [ ! -f "$COMPOSE" ]; then
  echo "No existe $COMPOSE"
  exit 1
fi

# NOTIFICATIONS desde archivo de cron existente
if [ -f "$NOTIF_ENV" ]; then
  # shellcheck disable=SC1090
  set -a && source "$NOTIF_ENV" && set +a
fi
if [ -n "${NOTIFICATIONS_CRON_SECRET:-}" ] && ! grep -q '^NOTIFICATIONS_CRON_SECRET=' "$ENV_FILE" 2>/dev/null; then
  printf '\nNOTIFICATIONS_CRON_SECRET=%s\n' "$NOTIFICATIONS_CRON_SECRET" >> "$ENV_FILE"
fi
if [ -n "${NOTIFICATIONS_CRON_SECRET:-}" ] && ! grep -q '^EXPIRE_TRIALS_CRON_SECRET=' "$ENV_FILE" 2>/dev/null; then
  printf 'EXPIRE_TRIALS_CRON_SECRET=%s\n' "$NOTIFICATIONS_CRON_SECRET" >> "$ENV_FILE"
fi

if ! grep -q 'ADS_CRON_SECRET: \${ADS_CRON_SECRET}' "$COMPOSE"; then
  sed -i '/REGISTRATION_NOTIFY_EMAIL: \${REGISTRATION_NOTIFY_EMAIL}/a\
      NOTIFICATIONS_CRON_SECRET: ${NOTIFICATIONS_CRON_SECRET}\
      ADS_CRON_SECRET: ${ADS_CRON_SECRET}\
      EXPIRE_TRIALS_CRON_SECRET: ${EXPIRE_TRIALS_CRON_SECRET}' "$COMPOSE"
fi

cd "$DOCKER_DIR"
docker compose up -d functions
echo "Edge functions recreadas con secrets de cron."
