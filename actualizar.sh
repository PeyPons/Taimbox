#!/bin/bash
# Script de actualización para Timeboxing
# CORREGIDO: Usa la rama 'main' en lugar de 'master'

set -e  # Salir si hay errores

echo "[$(date +'%H:%M:%S')] Descargando cambios de GitHub..."

# Cambiar al directorio del proyecto
cd ~/Timeboxing || exit 1

# Verificar que estamos en un repositorio git
if [ ! -d .git ]; then
    echo "❌ Error: No se encontró un repositorio git en $(pwd)"
    exit 1
fi

# Obtener los últimos cambios
git fetch origin

# Cambiar a la rama main (crearla localmente si no existe)
if ! git rev-parse --verify main >/dev/null 2>&1; then
    echo "📦 Creando rama local 'main' desde origin/main..."
    git checkout -b main origin/main
else
    git checkout main 2>/dev/null || git checkout -b main origin/main
fi

# Actualizar desde origin/main (CORREGIDO: era origin/master)
echo "[$(date +'%H:%M:%S')] Actualizando desde origin/main..."

# Verificar si hay ramas divergentes y resolverlas
if ! git pull origin main --no-rebase 2>&1 | grep -q "divergent branches"; then
    # Pull exitoso, continuar
    :
else
    echo "[$(date +'%H:%M:%S')] ⚠️  Ramas divergentes detectadas. Forzando actualización desde origin/main..."
    # Guardar cambios locales si existen (opcional, descomentar si quieres preservar cambios locales)
    # git stash
    
    # Resetear a origin/main para que coincida exactamente con GitHub
    git fetch origin main
    git reset --hard origin/main
    echo "[$(date +'%H:%M:%S')] ✅ Repositorio actualizado a origin/main"
fi

echo "[$(date +'%H:%M:%S')] ✅ Actualización completada"

# Opcional: Reinstalar dependencias si package.json cambió
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q package.json; then
    echo "[$(date +'%H:%M:%S')] 📦 package.json cambió, reinstalando dependencias..."
    npm install
fi

# Opcional: Rebuild si es necesario
# echo "[$(date +'%H:%M:%S')] 🔨 Reconstruyendo aplicación..."
# npm run build

echo "[$(date +'%H:%M:%S')] ✅ Actualización completada"
