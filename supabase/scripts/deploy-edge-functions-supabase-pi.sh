#!/usr/bin/env bash
#
# Despliegue de Edge Functions para Timeboxing cuando Supabase está en ~/supabase-pi.
# Ejecutar en el servidor (donde están /home/alex/supabase-pi y /home/alex/Timeboxing).
#
# Uso:
#   cd ~/Timeboxing
#   chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh
#   ./supabase/scripts/deploy-edge-functions-supabase-pi.sh
#
# Rutas por defecto:
#   - Timeboxing: $HOME/Timeboxing  ->  supabase/functions/
#   - Supabase:   $HOME/supabase-pi/supabase/docker  ->  volumes/functions/
#   - Servicio:   functions (contenedor supabase-edge-functions)
#

set -e

# Directorio del script (ej. /home/alex/Timeboxing/supabase/scripts) y raíz del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Rutas: si no se definen o no existen, usar la raíz del proyecto (útil al ejecutar como root)
if [ -z "$TIMBOXING_DIR" ] || [ ! -d "$TIMBOXING_DIR" ]; then
  TIMBOXING_DIR="$PROJECT_ROOT"
fi
if [ -z "$SUPABASE_DOCKER_DIR" ] || [ ! -f "$SUPABASE_DOCKER_DIR/docker-compose.yml" ]; then
  # Supabase suele estar en el mismo directorio padre que Timeboxing (ej. /home/alex/supabase-pi)
  SUPABASE_DOCKER_DIR="$(dirname "$PROJECT_ROOT")/supabase-pi/supabase/docker"
fi
COMPOSE_FILE="${SUPABASE_DOCKER_DIR}/docker-compose.yml"
FUNCTIONS_SOURCE="${TIMBOXING_DIR}/supabase/functions"
VOLUMES_FUNCTIONS="${SUPABASE_DOCKER_DIR}/volumes/functions"
SERVICE_NAME="${SUPABASE_FUNCTIONS_SERVICE:-functions}"

echo "[deploy] Timeboxing:    $TIMBOXING_DIR"
echo "[deploy] Supabase:      $SUPABASE_DOCKER_DIR"
echo "[deploy] Origen:        $FUNCTIONS_SOURCE"
echo "[deploy] Destino:       $VOLUMES_FUNCTIONS"
echo "[deploy] Servicio:      $SERVICE_NAME"

if [ ! -d "$FUNCTIONS_SOURCE" ]; then
  echo "Error: No existe $FUNCTIONS_SOURCE" >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: No existe $COMPOSE_FILE" >&2
  exit 1
fi

echo "[deploy] Carpetas en origen: $(ls -1 "$FUNCTIONS_SOURCE" 2>/dev/null | tr '\n' ' ')"
if [ ! -d "$FUNCTIONS_SOURCE/add-platform-admin" ]; then
  echo "Aviso: No existe $FUNCTIONS_SOURCE/add-platform-admin en el servidor." >&2
  echo "  Sube las funciones desde tu PC: rsync -avz supabase/functions/ alex@TU_SERVIDOR:~/Timeboxing/supabase/functions/" >&2
  echo "  O haz git pull en ~/Timeboxing si el repo está actualizado." >&2
fi

mkdir -p "$VOLUMES_FUNCTIONS"
echo "[deploy] Copiando funciones..."
# Sin --delete para no borrar una posible carpeta "main" que use el runtime
rsync -a "$FUNCTIONS_SOURCE/" "$VOLUMES_FUNCTIONS/"
echo "[deploy] Copia terminada."

echo "[deploy] Reiniciando $SERVICE_NAME..."
(cd "$SUPABASE_DOCKER_DIR" && docker compose -f docker-compose.yml restart "$SERVICE_NAME") || {
  echo "  Fallo al reiniciar. Servicios:"
  (cd "$SUPABASE_DOCKER_DIR" && docker compose -f docker-compose.yml config --services 2>/dev/null) || true
  echo "  Reinicio manual: cd $SUPABASE_DOCKER_DIR && docker compose -f docker-compose.yml restart $SERVICE_NAME"
  exit 1
}

# Verificar que el alias "functions" existe en la red Docker.
# Kong enruta a functions:9000; sin el alias, TODAS las peticiones devuelven
# {"message":"name resolution failed"} sin que aparezca log en el Edge Runtime.
# Esto ocurre cuando el contenedor se creó fuera de Compose (workaround manual).
CONTAINER_NAME="supabase-edge-functions"
NETWORK_NAME="supabase_default"
DNS_NAMES=$(docker inspect "$CONTAINER_NAME" --format '{{json .NetworkSettings.Networks}}' 2>/dev/null)
if echo "$DNS_NAMES" | grep -q '"functions"'; then
  echo "[deploy] Alias 'functions' OK en $NETWORK_NAME."
else
  echo "[deploy] ⚠️  Alias 'functions' NO encontrado. Reconectando con alias..."
  docker network disconnect "$NETWORK_NAME" "$CONTAINER_NAME" 2>/dev/null || true
  docker network connect --alias functions "$NETWORK_NAME" "$CONTAINER_NAME"
  echo "[deploy] Alias 'functions' añadido."
fi

echo "[deploy] Listo."
