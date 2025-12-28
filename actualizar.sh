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
    # Resetear a origin/main para que coincida exactamente con GitHub
    git fetch origin main
    git reset --hard origin/main
    echo "[$(date +'%H:%M:%S')] ✅ Repositorio actualizado a origin/main"
fi

echo "[$(date +'%H:%M:%S')] ✅ Actualización completada"

# Reinstalar dependencias si package.json cambió
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q package.json; then
    echo "[$(date +'%H:%M:%S')] 📦 package.json cambió, reinstalando dependencias..."
    npm install
fi

# Compilar la aplicación
echo "[$(date +'%H:%M:%S')] 🔨 Compilando aplicación..."
npm run build

# Reiniciar el servidor web
echo "[$(date +'%H:%M:%S')] 🔄 Reiniciando servidor web..."

# Intentar diferentes métodos de reinicio según lo que esté disponible
if command -v pm2 &> /dev/null; then
    # Usar PM2 si está disponible
    echo "[$(date +'%H:%M:%S')] Reiniciando con PM2..."
    pm2 restart timeboxing 2>/dev/null || pm2 restart all 2>/dev/null || {
        echo "[$(date +'%H:%M:%S')] ⚠️  No se encontró proceso en PM2, iniciando..."
        pm2 start npm --name timeboxing -- run preview 2>/dev/null || echo "[$(date +'%H:%M:%S')] ⚠️  Error con PM2"
    }
elif systemctl is-active --quiet timeboxing.service 2>/dev/null; then
    # Usar systemd si el servicio está activo
    echo "[$(date +'%H:%M:%S')] Reiniciando con systemd..."
    sudo systemctl restart timeboxing.service
elif [ -f ~/Timeboxing/restart.sh ]; then
    # Usar script de reinicio personalizado si existe
    echo "[$(date +'%H:%M:%S')] Ejecutando script de reinicio personalizado..."
    bash ~/Timeboxing/restart.sh
else
    echo "[$(date +'%H:%M:%S')] ⚠️  No se encontró método de reinicio automático."
    echo "[$(date +'%H:%M:%S')] 💡 Reinicia manualmente el servidor web."
fi

echo "[$(date +'%H:%M:%S')] ✅ Actualización y despliegue completados"
