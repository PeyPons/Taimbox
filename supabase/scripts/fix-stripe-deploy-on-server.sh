#!/usr/bin/env bash
# Corrige despliegue Stripe en servidor self-hosted (ejecutar en la Raspberry).
# Uso:  cd ~/Timeboxing && bash supabase/scripts/fix-stripe-deploy-on-server.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="${SUPABASE_DOCKER_DIR:-$HOME/supabase-pi/supabase/docker}"
ENV_FILE="$DOCKER_DIR/.env"

echo "[fix] Proyecto: $PROJECT_ROOT"
echo "[fix] Docker:   $DOCKER_DIR"

if [ ! -d "$PROJECT_ROOT/supabase/functions/admin-set-agency-plan" ]; then
  echo "Error: falta admin-set-agency-plan en el repo. Haz git pull o sube el código." >&2
  exit 1
fi

echo "[fix] 1/3 Copiando Edge Functions al volumen..."
bash "$SCRIPT_DIR/deploy-edge-functions-supabase-pi.sh"

VOL="$DOCKER_DIR/volumes/functions"
if [ ! -d "$VOL/admin-set-agency-plan" ]; then
  echo "Error: tras el deploy sigue sin existir $VOL/admin-set-agency-plan" >&2
  exit 1
fi
if ! grep -q "resolvePlanIdFromSubscriptionAsync" "$VOL/stripe-webhook/index.ts" 2>/dev/null; then
  echo "Aviso: stripe-webhook en volumen sigue sin resolver async."
  echo "  ¿El repo en el servidor está actualizado? (git pull / rsync desde tu PC)"
fi

echo ""
echo "[fix] 2/3 Comprobando STRIPE_PRICE_ID_* en $ENV_FILE ..."
missing=0
for v in STRIPE_PRICE_ID_PRO STRIPE_PRICE_ID_BUSINESS STRIPE_PRICE_ID_SCALE; do
  if [ -f "$ENV_FILE" ] && grep -q "^${v}=.\+" "$ENV_FILE" 2>/dev/null; then
    echo "  [OK] $v en .env"
  else
    echo "  [FALTA] $v — añade en $ENV_FILE (mismos Price ID que en Stripe Dashboard / build de taimbox.com)"
    missing=1
  fi
done

if [ "$missing" -eq 1 ]; then
  echo ""
  echo "Edita el .env de Supabase, por ejemplo:"
  echo "  nano $ENV_FILE"
  echo ""
  echo "Añade (sustituye por tus price_... reales de Stripe → Productos → Precios):"
  echo "  STRIPE_PRICE_ID_PRO=price_..."
  echo "  STRIPE_PRICE_ID_BUSINESS=price_..."
  echo "  STRIPE_PRICE_ID_SCALE=price_..."
  echo ""
  echo "Asegúrate de que docker-compose.yml del servicio functions pasa esas variables al contenedor."
  echo "Luego: cd $DOCKER_DIR && docker compose up -d --force-recreate functions"
  echo ""
  read -r -p "¿Has añadido las variables y recreado el contenedor? (s/N) " ans || true
  if [ "${ans,,}" != "s" ] && [ "${ans,,}" != "y" ]; then
    echo "Continúa manualmente y vuelve a ejecutar la auditoría."
    exit 0
  fi
fi

echo ""
echo "[fix] 3/3 Recreando contenedor functions (carga env + código)..."
if [ -f "$DOCKER_DIR/docker-compose.yml" ]; then
  (cd "$DOCKER_DIR" && docker compose up -d --force-recreate functions)
else
  echo "No hay docker-compose.yml; reinicia manualmente: docker restart supabase-edge-functions"
  docker restart supabase-edge-functions 2>/dev/null || true
fi

echo ""
echo "[fix] Verificación rápida:"
docker inspect supabase-edge-functions --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -E '^STRIPE_PRICE_ID_' || echo "  (STRIPE_PRICE_ID_* aún no visibles en el contenedor)"

code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 -X POST "https://api.taimbox.com/functions/v1/admin-set-agency-plan" \
  -H "Content-Type: application/json" -d '{}' || echo "000")
echo "  admin-set-agency-plan HTTP $code (401/403 = OK desplegada; 500 entrypoint = sigue mal)"

echo ""
echo "[fix] Listo. Ejecuta de nuevo:"
echo "  bash $SCRIPT_DIR/audit-stripe-on-server.sh"
