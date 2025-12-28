#!/bin/bash

# Script de actualización del proyecto Timeboxing
# Elimina dist antes del build para evitar errores de permisos

echo "[$(date +'%H:%M:%S')] 🚀 Iniciando actualización..."

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

# 7. Reiniciar Docker
echo "[$(date +'%H:%M:%S')] 🔄 Reiniciando contenedor 'mi-planificador'..."
docker restart mi-planificador

if [ $? -eq 0 ]; then
    echo "[$(date +'%H:%M:%S')] ✅ Contenedor reiniciado correctamente"
else
    echo "[$(date +'%H:%M:%S')] ⚠️  Advertencia: No se pudo reiniciar el contenedor Docker"
fi

echo "[$(date +'%H:%M:%S')] ✨ ¡Actualización completada!"
