#!/usr/bin/env bash
# Auditoría Stripe + Edge Functions en el servidor (Raspberry / self-hosted).
# Ejecutar EN EL SERVIDOR tras SSH:  bash supabase/scripts/audit-stripe-on-server.sh
set -euo pipefail

echo "========== 1. Rutas del proyecto =========="
for d in /opt/timeboxing "$HOME/Timeboxing" /timeboxing; do
  if [ -d "$d" ]; then
    echo "OK  $d"
    PROJECT="$d"
  fi
done
PROJECT="${PROJECT:-$HOME/Timeboxing}"
echo "Usando: $PROJECT"

echo ""
echo "========== 2. Funciones en repo (origen) =========="
ls -1 "$PROJECT/supabase/functions" 2>/dev/null | sort || { echo "No existe supabase/functions"; exit 1; }

echo ""
echo "========== 3. Funciones desplegadas (volumen Docker) =========="
VOL="${SUPABASE_DOCKER_DIR:-$HOME/supabase-pi/supabase/docker}/volumes/functions"
if [ -d "$VOL" ]; then
  ls -1 "$VOL" 2>/dev/null | sort
  echo ""
  for fn in admin-set-agency-plan stripe-webhook _shared; do
    if [ -e "$VOL/$fn" ]; then
      echo "  [OK] $fn"
    else
      echo "  [FALTA] $fn"
    fi
  done
  if [ -f "$VOL/stripe-webhook/index.ts" ]; then
    if grep -q "resolvePlanIdFromSubscriptionAsync" "$VOL/stripe-webhook/index.ts" 2>/dev/null; then
      echo "  [OK] stripe-webhook usa resolver async (_shared)"
    else
      echo "  [AVISO] stripe-webhook parece versión antigua (sin resolver async)"
    fi
    if grep -q '"scale"' "$VOL/_shared/stripe-plan.ts" 2>/dev/null; then
      echo "  [OK] stripe-plan incluye plan scale"
    else
      echo "  [AVISO] _shared/stripe-plan.ts sin soporte scale — git pull + redeploy"
    fi
  fi
else
  echo "No existe $VOL"
fi

echo ""
echo "========== 4. Contenedor Edge Functions =========="
docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null | grep -E 'edge|function|NAMES' || true
CONTAINER="${EDGE_CONTAINER:-supabase-edge-functions}"
if docker inspect "$CONTAINER" &>/dev/null; then
  echo "Contenedor: $CONTAINER"
  docker inspect "$CONTAINER" --format '{{range $k, $v := .Config.Env}}{{println $v}}{{end}}' 2>/dev/null \
    | grep -E '^STRIPE_|^SUPABASE_URL' \
    | sed -E 's/(STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)=.+/\\1=***oculto***/' \
    | sed -E 's/(STRIPE_PRICE_ID_[A-Z]+)=.+/\\1=\\0/' || echo "  (sin vars STRIPE visibles)"
  for v in STRIPE_PRICE_ID_PRO STRIPE_PRICE_ID_BUSINESS STRIPE_PRICE_ID_SCALE STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do
    if docker inspect "$CONTAINER" --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -q "^${v}=$"; then
      echo "  [VACÍO] $v"
    elif docker inspect "$CONTAINER" --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -q "^${v}="; then
      echo "  [OK] $v definido"
    else
      echo "  [FALTA] $v"
    fi
  done
else
  echo "No se encontró contenedor $CONTAINER"
fi

echo ""
echo "========== 5. Prueba HTTP (Kong / api.taimbox.com) =========="
BASE="${API_BASE:-https://api.taimbox.com}"
for fn in stripe-webhook create-checkout-session admin-set-agency-plan; do
  code=$(curl -s -o /tmp/ef-audit.json -w "%{http_code}" -m 10 -X POST "$BASE/functions/v1/$fn" \
    -H "Content-Type: application/json" -d '{}' || echo "000")
  body=$(head -c 100 /tmp/ef-audit.json 2>/dev/null || echo "")
  echo "  $fn -> HTTP $code  $body"
done
if [ -f /tmp/ef-audit.json ] && grep -q "No Stripe-Signature" /tmp/ef-audit.json 2>/dev/null; then
  echo "  [OK] stripe-webhook desplegado (400 sin firma = env STRIPE_* cargado)"
fi

echo ""
echo "========== 6. Agencias con suscripción (vía psql local si existe) =========="
DB_URL="${SUPABASE_DB_URL:-}"
if [ -n "$DB_URL" ] && command -v psql &>/dev/null; then
  psql "$DB_URL" -t -c "SELECT name, plan_id, subscription_status, stripe_subscription_id IS NOT NULL FROM agencies WHERE subscription_status IS NOT NULL AND subscription_status <> 'canceled' ORDER BY updated_at DESC LIMIT 10;"
else
  echo "  (define SUPABASE_DB_URL o consulta en Supabase Studio)"
fi

echo ""
echo "========== Fin =========="
echo "Si admin-set-agency-plan falla con 'entrypoint': despliega con:"
echo "  cd $PROJECT && git pull && rsync -a ./supabase/functions/ /home/alex/supabase-pi/supabase/docker/volumes/functions/ && docker restart supabase-edge-functions"
