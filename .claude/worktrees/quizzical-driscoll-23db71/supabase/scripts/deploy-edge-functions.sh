#!/usr/bin/env bash
#
# Despliegue de Edge Functions en Supabase self-hosted.
# Ejecutar EN EL SERVIDOR donde corre el Edge Runtime.
#
# Uso:
#   1. Subir el repo o la carpeta functions al servidor (git pull, rsync, etc.).
#   2. Editar las variables abajo (PROJECT_DIR, RUNTIME_*).
#   3. ./deploy-edge-functions.sh
#
# Opción desde tu PC: subir funciones y ejecutar este script por SSH:
#   rsync -avz supabase/functions/ usuario@servidor:/ruta/proyecto/supabase/functions/
#   ssh usuario@servidor "cd /ruta/proyecto/supabase/scripts && ./deploy-edge-functions.sh"
#

set -e

# --- Configuración: editar según tu servidor ---
# Ruta del proyecto en el servidor (donde está la carpeta supabase/functions)
PROJECT_DIR="${PROJECT_DIR:-/opt/timeboxing}"

# Opción A: Reiniciar un contenedor Docker del Edge Runtime por nombre
# Si usas docker run con nombre, pon aquí el nombre del contenedor.
RUNTIME_CONTAINER="${RUNTIME_CONTAINER:-supabase-edge-runtime}"

# Opción B: O usar docker-compose (si tu stack tiene un servicio "functions" o "edge-runtime")
# Descomenta y ajusta si usas docker-compose en PROJECT_DIR o en otra ruta.
# COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
# COMPOSE_SERVICE="functions"

# --- No tocar a partir de aquí (salvo que uses compose) ---
FUNCTIONS_DIR="${PROJECT_DIR}/supabase/functions"

echo "[deploy] Proyecto: $PROJECT_DIR"
echo "[deploy] Funciones: $FUNCTIONS_DIR"

if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "Error: No existe $FUNCTIONS_DIR. ¿PROJECT_DIR es correcto?" >&2
  exit 1
fi

# Actualizar desde git (opcional; quita si no usas git en el servidor)
if [ -d "$PROJECT_DIR/.git" ]; then
  echo "[deploy] Actualizando desde git..."
  (cd "$PROJECT_DIR" && git pull --rebase || true)
else
  echo "[deploy] No hay .git; se usan los archivos actuales en $FUNCTIONS_DIR"
fi

# Reiniciar el Edge Runtime
if [ -n "$COMPOSE_FILE" ] && [ -n "$COMPOSE_SERVICE" ]; then
  echo "[deploy] Reiniciando servicio Docker Compose: $COMPOSE_SERVICE"
  docker-compose -f "$COMPOSE_FILE" restart "$COMPOSE_SERVICE"
elif docker ps -a --format '{{.Names}}' | grep -q "^${RUNTIME_CONTAINER}$"; then
  echo "[deploy] Reiniciando contenedor: $RUNTIME_CONTAINER"
  docker restart "$RUNTIME_CONTAINER"
else
  echo "[deploy] No se encontró contenedor '$RUNTIME_CONTAINER'."
  echo "  Si usas otro nombre, ejecuta:"
  echo "  export RUNTIME_CONTAINER=nombre-de-tu-contenedor"
  echo "  $0"
  echo ""
  echo "  O si usas docker-compose, edita el script y define COMPOSE_FILE y COMPOSE_SERVICE."
  echo "  Para listar contenedores: docker ps -a"
  exit 1
fi

echo "[deploy] Listo. Las Edge Functions deberían estar ya con el código actualizado."
