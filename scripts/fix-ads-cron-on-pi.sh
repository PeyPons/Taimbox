#!/bin/bash
# Ejecutar EN LA PI como usuario alex: bash /home/alex/Timeboxing/scripts/fix-ads-cron-on-pi.sh
set -euo pipefail

REPO="/home/alex/Timeboxing"
LOG="/home/alex/logs/taimbox-ads-cron.log"
DOCKER_ENV="/home/alex/supabase-pi/supabase/docker/.env"

echo "==> Usuario: $(whoami)"
if [ "$(whoami)" != "alex" ]; then
  echo "ERROR: Ejecuta como alex (no root). Ejemplo: sudo -u alex bash $0"
  exit 1
fi

mkdir -p /home/alex/logs
cd "$REPO"

echo "==> git pull"
git fetch origin main
git pull origin main

echo "==> Normalizar scripts (CRLF + ejecutable)"
for f in scripts/cron-ads-sync.sh scripts/cron-expire-trials.sh scripts/restore-taimbox-crontab.sh; do
  [ -f "$f" ] && sed -i 's/\r$//' "$f"
done
chmod +x scripts/cron-ads-sync.sh scripts/cron-expire-trials.sh scripts/restore-taimbox-crontab.sh

echo "==> Comprobar ADS_CRON_SECRET en Docker .env"
if ! grep -q '^ADS_CRON_SECRET=' "$DOCKER_ENV" 2>/dev/null; then
  echo "ERROR: Falta ADS_CRON_SECRET en $DOCKER_ENV"
  exit 1
fi

echo "==> Instalar crontab de alex"
bash scripts/restore-taimbox-crontab.sh

echo "==> Crontab alex (cron-ads):"
crontab -l | grep cron-ads || true

echo "==> Probar sync manual"
scripts/cron-ads-sync.sh | tee -a "$LOG"

echo "==> Últimas líneas del log:"
tail -8 "$LOG"

echo "==> OK"
