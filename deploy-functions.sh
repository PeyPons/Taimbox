#!/bin/bash

# Script para desplegar todas las Edge Functions a Supabase
# Ejecuta: chmod +x deploy-functions.sh && ./deploy-functions.sh

echo "🚀 Desplegando Edge Functions a Supabase..."

# Verificar que supabase CLI esté disponible
if ! command -v supabase &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Error: Necesitas instalar Supabase CLI o tener npm/npx disponible"
    exit 1
fi

# Usar npx si supabase no está instalado globalmente
SUPABASE_CMD="supabase"
if ! command -v supabase &> /dev/null; then
    SUPABASE_CMD="npx supabase"
fi

# 1. Login (si no estás autenticado)
echo "📝 Verificando autenticación..."
$SUPABASE_CMD login

# 2. Link al proyecto (necesitarás tu Project Reference ID)
echo "🔗 Vinculando proyecto..."
echo "Por favor, ingresa tu Project Reference ID cuando se solicite:"
$SUPABASE_CMD link --project-ref $(read -p "Project Reference ID: " PROJECT_REF && echo $PROJECT_REF)

# 3. Desplegar funciones
echo "📦 Desplegando funciones..."

echo "  → register-agency..."
$SUPABASE_CMD functions deploy register-agency --no-verify-jwt

echo "  → create-user..."
$SUPABASE_CMD functions deploy create-user

echo "  → update-user..."
$SUPABASE_CMD functions deploy update-user

echo "  → delete-user..."
$SUPABASE_CMD functions deploy delete-user

echo "  → invite-user-to-agency..."
$SUPABASE_CMD functions deploy invite-user-to-agency

echo "  → sync-google-ads..."
$SUPABASE_CMD functions deploy sync-google-ads --no-verify-jwt

echo "  → sync-meta-ads..."
$SUPABASE_CMD functions deploy sync-meta-ads --no-verify-jwt

echo "✅ ¡Todas las funciones han sido desplegadas!"

