#!/usr/bin/env bash
# Comprueba que STRIPE_PRICE_ID_* llegan al contenedor supabase-edge-functions.
# Uso en el servidor:
#   cd ~/supabase-pi/supabase/docker
#   bash /home/alex/Timeboxing/supabase/scripts/ensure-stripe-price-env-compose.sh
set -euo pipefail

DOCKER_DIR="${SUPABASE_DOCKER_DIR:-$HOME/supabase-pi/supabase/docker}"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.yml"
ENV_FILE="$DOCKER_DIR/.env"

echo "=== .env (valores definidos) ==="
if [ -f "$ENV_FILE" ]; then
  grep -E '^STRIPE_PRICE_ID_' "$ENV_FILE" || echo "  [FALTA] Añade STRIPE_PRICE_ID_PRO y STRIPE_PRICE_ID_BUSINESS en $ENV_FILE"
else
  echo "  No existe $ENV_FILE"
fi

echo ""
echo "=== docker-compose.yml (¿se pasan al contenedor?) ==="
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "  No existe $COMPOSE_FILE"
  exit 1
fi
if grep -q 'STRIPE_PRICE_ID_PRO' "$COMPOSE_FILE"; then
  echo "  [OK] STRIPE_PRICE_ID_PRO referenciado en compose"
  grep 'STRIPE_PRICE' "$COMPOSE_FILE" || true
else
  echo "  [FALTA] El servicio functions NO incluye STRIPE_PRICE_ID_*"
  echo ""
  echo "  Edita $COMPOSE_FILE y en el bloque environment: del servicio functions añade:"
  echo ""
  echo "      STRIPE_PRICE_ID_PRO: \${STRIPE_PRICE_ID_PRO}"
  echo "      STRIPE_PRICE_ID_BUSINESS: \${STRIPE_PRICE_ID_BUSINESS}"
  echo ""
  echo "  (junto a STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET si ya existen)"
  echo ""
  echo "  Luego: cd $DOCKER_DIR && docker compose up -d --force-recreate functions"
  exit 1
fi

echo ""
echo "=== Contenedor en ejecución ==="
if docker inspect supabase-edge-functions &>/dev/null; then
  docker inspect supabase-edge-functions --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | grep -E '^STRIPE_PRICE_ID_' || echo "  [FALTA] Variables no presentes en el contenedor — recrea con compose"
else
  echo "  Contenedor supabase-edge-functions no encontrado"
fi
