#!/usr/bin/env bash
# Asegura variables de Edge Functions en docker/.env y docker-compose.yml (servidor self-hosted).
# Uso: bash /home/alex/Timeboxing/supabase/scripts/ensure-edge-functions-env.sh
set -euo pipefail

DOCKER_DIR="${SUPABASE_DOCKER_DIR:-$HOME/supabase-pi/supabase/docker}"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.yml"
ENV_FILE="$DOCKER_DIR/.env"

CHECKOUT_BASE_URL="${CHECKOUT_BASE_URL:-https://taimbox.com}"
REGISTRATION_NOTIFY_EMAIL="${REGISTRATION_NOTIFY_EMAIL:-alexanderouteiral@gmail.com}"

patch_env() {
  local key="$1"
  local val="$2"
  if [ ! -f "$ENV_FILE" ]; then
    echo "  [FALTA] $ENV_FILE — créalo antes"
    return 1
  fi
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    echo "  [OK] $key ya en .env"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
    echo "  [AÑADIDO] $key en .env"
  fi
}

echo "=== Parche .env ($ENV_FILE) ==="
patch_env "CHECKOUT_BASE_URL" "$CHECKOUT_BASE_URL"
patch_env "REGISTRATION_NOTIFY_EMAIL" "$REGISTRATION_NOTIFY_EMAIL"
grep -E '^STRIPE_PRICE_ID_' "$ENV_FILE" 2>/dev/null || echo "  [AVISO] Añade STRIPE_PRICE_ID_PRO y STRIPE_PRICE_ID_BUSINESS"

echo ""
echo "=== docker-compose.yml (servicio functions) ==="
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "  No existe $COMPOSE_FILE"
  exit 1
fi

ensure_compose_var() {
  local var="$1"
  if grep -q "${var}:" "$COMPOSE_FILE" 2>/dev/null; then
    echo "  [OK] $var en compose"
  else
    echo "  [AVISO] Añade manualmente en environment del servicio functions:"
    echo "        ${var}: \${${var}}"
  fi
}

for v in STRIPE_PRICE_ID_PRO STRIPE_PRICE_ID_BUSINESS STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET \
  RESEND_API_KEY CHECKOUT_BASE_URL REGISTRATION_NOTIFY_EMAIL; do
  ensure_compose_var "$v"
done

if [[ "${NONINTERACTIVE:-0}" == "1" ]]; then
  echo ""
  echo "=== Recrear contenedor functions (NONINTERACTIVE) ==="
  (cd "$DOCKER_DIR" && docker compose -f docker-compose.yml up -d --force-recreate functions)
  docker inspect supabase-edge-functions --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
    | grep -E '^(CHECKOUT_BASE_URL|REGISTRATION_NOTIFY|STRIPE_PRICE_ID_)' \
    | sed -E 's/(STRIPE_SECRET|STRIPE_WEBHOOK|RESEND_API).+/=***set***/' || true
fi
