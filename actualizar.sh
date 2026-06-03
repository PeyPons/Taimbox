#!/bin/bash

# Script de actualización del proyecto Timeboxing
# Elimina dist antes del build para evitar errores de permisos
#
# Ejecutar como usuario del repo (p. ej. alex), NO con `sudo su`.
# Si se invoca como root, reasigna permisos y se reejecuta como el dueño del directorio.

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR" || exit 1
DEPLOY_USER="$(stat -c '%U' "$REPO_DIR" 2>/dev/null || echo alex)"

if [ "$(id -u)" -eq 0 ]; then
    echo "[$(date +'%H:%M:%S')] ⚠️  Ejecutado como root: corrigiendo permisos y continuando como $DEPLOY_USER..."
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$REPO_DIR"
    exec sudo -u "$DEPLOY_USER" bash "$0" "$@"
fi

run_root() {
    if [ "$(id -u)" -eq 0 ]; then
        "$@"
    else
        sudo "$@"
    fi
}

echo "[$(date +'%H:%M:%S')] 🚀 Iniciando actualización..."

# Scripts de cron deben ser ejecutables (git pull no siempre preserva +x)
chmod +x scripts/cron-ads-sync.sh scripts/cron-expire-trials.sh scripts/restore-taimbox-crontab.sh 2>/dev/null || true

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. ¿Estás en el directorio correcto?"
    exit 1
fi

# 2. Verificar estado de Git
echo "[$(date +'%H:%M:%S')] 📊 Verificando cambios en Git..."
git fetch origin > /dev/null 2>&1

# 3. Mostrar diferencias
echo "[$(date +'%H:%M:%S')] 📋 Cambios pendientes:"
git diff --name-status HEAD..origin/main
echo "--------------------------------------------------"

# 4. LIMPIAR DIRECTORIO DIST (antes del build)
echo "[$(date +'%H:%M:%S')] 🧹 Limpiando directorio dist..."
if [ -d "dist" ]; then
    # Intentar cambiar permisos primero (por si hay problemas de permisos)
    chmod -R u+w dist 2>/dev/null || true
    
    # Eliminar el directorio dist
    rm -rf dist
    
    if [ $? -eq 0 ]; then
        echo "[$(date +'%H:%M:%S')] ✅ Directorio dist eliminado correctamente"
    else
        echo "[$(date +'%H:%M:%S')] ⚠️  Advertencia: No se pudo eliminar dist completamente (puede que no exista o ya esté vacío)"
    fi
else
    echo "[$(date +'%H:%M:%S')] ℹ️  El directorio dist no existe, se creará durante el build"
fi

# 5. APLICAR CAMBIOS (Aquí es donde se descargan físicamente)
echo "[$(date +'%H:%M:%S')] 📥 Descargando y sobrescribiendo archivos..."
git reset --hard origin/main

# 6. Instalar y Compilar
echo "[$(date +'%H:%M:%S')] 📦 Actualizando dependencias..."
npm install > /dev/null 2>&1

echo "[$(date +'%H:%M:%S')] 🔨 Generando nueva build..."
npm run build

# Verificar que el build fue exitoso
if [ $? -eq 0 ]; then
    echo "[$(date +'%H:%M:%S')] ✅ Build completado exitosamente"
else
    echo "[$(date +'%H:%M:%S')] ❌ Error durante el build. Revisa los mensajes anteriores."
    exit 1
fi

# 7. Reiniciar Docker (app principal Taimbox)
echo "[$(date +'%H:%M:%S')] 🔄 Reiniciando contenedor 'mi-planificador'..."
run_root docker restart mi-planificador

if [ $? -eq 0 ]; then
    echo "[$(date +'%H:%M:%S')] ✅ Contenedor reiniciado correctamente"
else
    echo "[$(date +'%H:%M:%S')] ⚠️  Advertencia: No se pudo reiniciar el contenedor Docker"
fi

# 8. Review Agents (portal + API + worker en el mismo servidor)
if [ -d "packages/review-agents" ]; then
    echo "[$(date +'%H:%M:%S')] 📦 Actualizando review-agents..."
    cd packages/review-agents
    npm install > /dev/null 2>&1
    npm run build -w @taimbox/review-shared > /dev/null 2>&1
    npm run build -w @taimbox/review-api > /dev/null 2>&1
    npm run build -w @taimbox/review-worker > /dev/null 2>&1
    if [ -d "portal" ]; then
        cd portal
        export VITE_REVIEW_API_URL=
        # shellcheck disable=SC1091
        [ -f "../../../.env" ] && set -a && . ../../../.env && set +a
        npm run build > /dev/null 2>&1
        cd ..
    fi
    cd ../..
    if systemctl is-active review-api > /dev/null 2>&1; then
        echo "[$(date +'%H:%M:%S')] 🔄 Reiniciando review-api y review-worker..."
        run_root systemctl restart review-api review-worker
    fi
    if [ -f "packages/review-agents/deploy/docker-compose.portal.yml" ]; then
        run_root docker compose -f packages/review-agents/deploy/docker-compose.portal.yml up -d > /dev/null 2>&1
        echo "[$(date +'%H:%M:%S')] ✅ Portal review.taimbox.com (contenedor review-portal)"
    fi
else
    echo "[$(date +'%H:%M:%S')] ℹ️  Sin packages/review-agents (solo tras git pull con el monorepo)"
fi

echo "[$(date +'%H:%M:%S')] ✨ ¡Actualización completada!"
