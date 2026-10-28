#!/usr/bin/env bash
# Parches de seguridad oct 2026 (Node Brotli, PHP php2shell, nginx Rift, Docker CopyEscape).
# Ejecutar EN la Pi / ia-srv como el usuario de deploy (p. ej. alex), NO como root directo
# salvo donde el script use sudo.
#
# Uso:
#   bash scripts/security-patch-oct2026.sh              # inventario (solo lectura)
#   bash scripts/security-patch-oct2026.sh --apply      # aplica (sin Docker Engine)
#   bash scripts/security-patch-oct2026.sh --apply --include-docker-engine
#
# Flags:
#   --apply                 Ejecuta cambios (sin esto solo informa)
#   --include-docker-engine Actualiza Docker Engine (reinicia TODOS los contenedores)
#   --skip-spa-rebuild      No ejecuta npm build / actualizar.sh al final
#   --yes                   No pide confirmación interactiva

set -euo pipefail

APPLY=0
INCLUDE_DOCKER=0
SKIP_SPA=0
ASSUME_YES=0
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_PORTAL="${REPO_DIR}/packages/review-agents/deploy/docker-compose.portal.yml"
NGINX_IMAGE_PIN="nginx:1.30.6-alpine"
NODE_TARGET_MAJOR=22
NODE_TARGET_MIN="22.23.4"

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --include-docker-engine) INCLUDE_DOCKER=1 ;;
    --skip-spa-rebuild) SKIP_SPA=1 ;;
    --yes|-y) ASSUME_YES=1 ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      echo "Flag desconocido: $arg" >&2
      exit 2
      ;;
  esac
done

log() { echo "[$(date +'%H:%M:%S')] $*"; }
warn() { echo "[$(date +'%H:%M:%S')] ⚠️  $*" >&2; }
ok() { echo "[$(date +'%H:%M:%S')] ✅ $*"; }

confirm() {
  local msg="$1"
  if [ "$ASSUME_YES" -eq 1 ]; then
    return 0
  fi
  if [ ! -t 0 ]; then
    warn "Sin TTY: usa --yes para aplicar sin confirmación"
    return 1
  fi
  read -r -p "$msg [y/N] " ans
  case "$ans" in
    y|Y|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

version_ge() {
  # version_ge A B → true si A >= B (semver simple X.Y.Z)
  printf '%s\n%s\n' "$2" "$1" | sort -V | head -1 | grep -qx "$2"
}

parse_node_ver() {
  node -v 2>/dev/null | sed 's/^v//' || true
}

echo "============================================================"
echo " Taimbox security patch oct 2026"
echo " Repo: $REPO_DIR"
echo " Modo: $([ "$APPLY" -eq 1 ] && echo APPLY || echo CHECK-ONLY)"
echo "============================================================"
echo

log "=== Inventario ==="

HOST_NODE="$(parse_node_ver)"
if [ -n "$HOST_NODE" ]; then
  log "Node host: v$HOST_NODE"
  if version_ge "$HOST_NODE" "$NODE_TARGET_MIN"; then
    ok "Node host ya ≥ $NODE_TARGET_MIN"
    NODE_OK=1
  else
    warn "Node host < $NODE_TARGET_MIN (parchear a ${NODE_TARGET_MAJOR}.x LTS ≥ $NODE_TARGET_MIN)"
    NODE_OK=0
  fi
else
  warn "Node no encontrado en PATH"
  NODE_OK=0
fi

if command -v docker >/dev/null 2>&1; then
  DOCKER_VER="$(docker version --format '{{.Server.Version}}' 2>/dev/null || true)"
  DOCKER_CLI="$(docker version --format '{{.Client.Version}}' 2>/dev/null || true)"
  log "Docker Engine: ${DOCKER_VER:-?} / CLI: ${DOCKER_CLI:-?}"
  if [ -n "$DOCKER_VER" ] && version_ge "$DOCKER_VER" "29.7.2"; then
    ok "Docker Engine ya ≥ 29.7.2 (CopyEscape)"
    DOCKER_OK=1
  else
    warn "Docker Engine < 29.7.2 o desconocido (CVE-2026-17106 CopyEscape)"
    DOCKER_OK=0
  fi
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' 2>/dev/null || true
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx review-portal; then
    RP_NGINX="$(docker exec review-portal nginx -v 2>&1 || true)"
    log "review-portal nginx: $RP_NGINX"
  fi
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx mi-planificador; then
    MP_NODE="$(docker exec mi-planificador node -v 2>/dev/null || echo 'sin node en contenedor')"
    log "mi-planificador node: $MP_NODE"
  fi
else
  warn "docker no disponible"
  DOCKER_OK=0
fi

if command -v nginx >/dev/null 2>&1; then
  log "nginx host: $(nginx -v 2>&1)"
elif [ -x /www/server/nginx/sbin/nginx ]; then
  log "nginx aaPanel: $(/www/server/nginx/sbin/nginx -v 2>&1)"
else
  log "nginx host: no detectado en PATH / aaPanel"
fi

PHP_FOUND=0
if command -v php >/dev/null 2>&1; then
  log "php CLI: $(php -v 2>/dev/null | head -1)"
  PHP_FOUND=1
fi
if ls /www/server/php/*/bin/php >/dev/null 2>&1; then
  PHP_FOUND=1
  for v in /www/server/php/*/bin/php; do
    [ -x "$v" ] || continue
    log "aaPanel PHP: $v → $($v -v 2>/dev/null | head -1)"
  done
fi
if ps aux 2>/dev/null | grep -E '[p]hp-fpm|[p]hp-cgi|[l]sphp' >/dev/null; then
  PHP_FOUND=1
  warn "Hay procesos PHP sirviendo (php2shell CRITICAL si versión < fijas)"
fi
if [ "$PHP_FOUND" -eq 0 ]; then
  ok "No se detectó PHP en uso (Taimbox no lo necesita)"
fi

echo
if [ "$APPLY" -eq 0 ]; then
  log "Solo inventario. Para aplicar:"
  echo "  bash scripts/security-patch-oct2026.sh --apply --yes"
  echo "  bash scripts/security-patch-oct2026.sh --apply --yes --include-docker-engine"
  exit 0
fi

if ! confirm "¿Aplicar parches ahora? Habrá downtime breve (más si Docker Engine)."; then
  log "Cancelado"
  exit 0
fi

log "=== 1) PHP (si aaPanel / apt) ==="
if ls /www/server/php/*/bin/php >/dev/null 2>&1; then
  warn "aaPanel: actualizar PHP desde App Store → Update App List → Update en cada versión."
  warn "Luego: /etc/init.d/php-fpm-XX restart  (XX=82/83/84…)"
  warn "Este script NO automatiza el App Store de aaPanel."
elif command -v apt-get >/dev/null 2>&1 && dpkg -l 'php*' 2>/dev/null | grep -q '^ii'; then
  log "Intentando apt update de paquetes php*…"
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --only-upgrade 'php*' || warn "apt php upgrade falló o no había updates"
  if systemctl list-units --type=service --state=running 2>/dev/null | grep -q php; then
    sudo systemctl reload 'php*-fpm' 2>/dev/null || sudo systemctl restart 'php*-fpm' 2>/dev/null || true
  fi
else
  ok "Nada que parchear en PHP desde este script"
fi

log "=== 2) nginx host (aaPanel / apt) ==="
if [ -x /www/server/nginx/sbin/nginx ]; then
  warn "aaPanel nginx: actualizar desde App Store (Update App List → nginx → Update) y reiniciar."
elif command -v apt-get >/dev/null 2>&1 && dpkg -l nginx 2>/dev/null | grep -q '^ii'; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --only-upgrade nginx || warn "apt nginx upgrade sin cambios"
  sudo nginx -t && sudo systemctl reload nginx || sudo systemctl restart nginx || true
  ok "nginx host recargado (si apt tenía paquete)"
else
  log "Sin nginx de sistema gestionable por apt"
fi

log "=== 3) review-portal (nginx:${NGINX_IMAGE_PIN#nginx:}) ==="
if [ -f "$COMPOSE_PORTAL" ] && command -v docker >/dev/null 2>&1; then
  # Asegurar pin en compose si aún dice nginx:alpine
  if grep -q 'image: nginx:alpine$' "$COMPOSE_PORTAL" 2>/dev/null; then
    sed -i "s|image: nginx:alpine|image: ${NGINX_IMAGE_PIN}|" "$COMPOSE_PORTAL"
    ok "Pin local en compose → $NGINX_IMAGE_PIN"
  fi
  (
    cd "$(dirname "$COMPOSE_PORTAL")"
    docker pull "$NGINX_IMAGE_PIN"
    docker compose -f docker-compose.portal.yml up -d
  )
  sleep 2
  docker exec review-portal nginx -v 2>&1 || warn "review-portal no responde aún"
  ok "review-portal recreado"
else
  warn "Sin compose portal o docker; omitido"
fi

log "=== 4) Node host ==="
if [ "${NODE_OK:-0}" -eq 1 ]; then
  ok "Node ya parcheado; no se reinstala"
else
  if command -v n >/dev/null 2>&1; then
    sudo n "$NODE_TARGET_MIN" || sudo n "$NODE_TARGET_MAJOR"
  elif [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$HOME/.nvm/nvm.sh"
    nvm install "$NODE_TARGET_MIN"
    nvm alias default "$NODE_TARGET_MIN"
  elif command -v apt-get >/dev/null 2>&1; then
    warn "Instalando Node ${NODE_TARGET_MAJOR}.x vía NodeSource (puede pedir confirmación de red)…"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_TARGET_MAJOR}.x" | sudo -E bash -
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
  else
    warn "No se pudo determinar gestor de Node; instala manualmente ≥ $NODE_TARGET_MIN"
  fi
  log "Node tras intento: $(node -v 2>/dev/null || echo desconocido)"
fi

if systemctl is-active review-api >/dev/null 2>&1; then
  log "Reiniciando review-api / review-worker con el Node nuevo…"
  sudo systemctl restart review-api review-worker || warn "falló restart review-*"
fi

log "=== 5) SPA rebuild + mi-planificador ==="
if [ "$SKIP_SPA" -eq 1 ]; then
  warn "Omitido rebuild SPA (--skip-spa-rebuild)"
elif [ -x "$REPO_DIR/actualizar.sh" ]; then
  log "Ejecutando actualizar.sh (git reset --hard origin/main + build + restart)…"
  warn "Esto alinea el repo a origin/main. Asegúrate de haber pusheado el pin de nginx."
  (
    cd "$REPO_DIR"
    # Si el pin ya está en el working tree y aún no en main, preservar compose pin tras reset
    PIN_BACKUP=""
    if [ -f "$COMPOSE_PORTAL" ]; then
      PIN_BACKUP="$(mktemp)"
      cp "$COMPOSE_PORTAL" "$PIN_BACKUP"
    fi
    ./actualizar.sh || warn "actualizar.sh terminó con error"
    if [ -n "$PIN_BACKUP" ] && [ -f "$PIN_BACKUP" ]; then
      # Si main aún no tiene el pin, reaplicar y recrear portal
      if grep -q 'image: nginx:alpine$' "$COMPOSE_PORTAL" 2>/dev/null; then
        cp "$PIN_BACKUP" "$COMPOSE_PORTAL"
        (
          cd "$(dirname "$COMPOSE_PORTAL")"
          docker compose -f docker-compose.portal.yml up -d
        ) || true
      fi
      rm -f "$PIN_BACKUP"
    fi
  )
else
  warn "No hay actualizar.sh ejecutable"
fi

log "=== 6) Docker Engine (opcional) ==="
if [ "$INCLUDE_DOCKER" -eq 1 ]; then
  if [ "${DOCKER_OK:-0}" -eq 1 ]; then
    ok "Docker ya ≥ 29.7.2"
  else
    warn "Actualizar Docker Engine tumba TODOS los contenedores (web+API+BD)."
    if confirm "¿Continuar con Docker Engine?"; then
      if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update -y
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --only-upgrade docker-ce docker-ce-cli containerd.io docker-compose-plugin \
          || warn "apt no pudo subir docker-ce (¿repo Docker instalado?)"
        sudo systemctl restart docker
        sleep 5
        # Reintento stack habitual
        if [ -f /home/alex/supabase-pi/supabase/docker/docker-compose.yml ]; then
          (cd /home/alex/supabase-pi/supabase/docker && docker compose up -d) || warn "supabase compose up falló"
        fi
        docker start mi-planificador 2>/dev/null || true
        if [ -f "$COMPOSE_PORTAL" ]; then
          (cd "$(dirname "$COMPOSE_PORTAL")" && docker compose -f docker-compose.portal.yml up -d) || true
        fi
        ok "Docker reiniciado; stacks re-levantados (revisar docker ps)"
      else
        warn "Sin apt; actualiza Docker manualmente a ≥ 29.7.2"
      fi
    fi
  fi
else
  log "Docker Engine omitido (pasa --include-docker-engine si quieres CVE CopyEscape)"
fi

echo
log "=== Smoke checks ==="
curl -sI -o /dev/null -w "taimbox.com HTTP %{http_code}\n" https://taimbox.com || true
curl -sI -o /dev/null -w "api.taimbox.com HTTP %{http_code}\n" https://api.taimbox.com || true
docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null | head -30 || true
echo
ok "Fin. Revisa versiones arriba y que la app cargue tras recargar el navegador."
echo "Si PHP/aaPanel nginx quedaron pendientes, completa desde el panel App Store."
