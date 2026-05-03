#!/bin/bash
# Pruebas rápidas: traer código de GitHub y levantar npm run dev (sin build ni Docker).
# Uso: ./dev-rapido.sh

set -e
cd "$(dirname "$0")"

if [ ! -f "package.json" ]; then
    echo "❌ No se encontró package.json. Ejecuta desde la raíz del proyecto."
    exit 1
fi

echo "[$(date +'%H:%M:%S')] 📥 Traiendo cambios de GitHub..."
git fetch origin
git pull --rebase origin main || git pull origin main

echo "[$(date +'%H:%M:%S')] 📦 Dependencias (solo si hace falta)..."
npm install

echo "[$(date +'%H:%M:%S')] 🚀 Arrancando dev server..."
npm run dev
