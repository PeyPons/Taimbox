# Guía para Desplegar Edge Functions en Supabase

## Prerrequisitos

1. **Instalar Supabase CLI**:
```bash
npm install -g supabase
```

O con Homebrew (macOS):
```bash
brew install supabase/tap/supabase
```

2. **Verificar instalación**:
```bash
supabase --version
```

## Pasos para Desplegar

### 1. Iniciar sesión en Supabase

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

### 2. Vincular tu proyecto

Necesitas el **Project Reference ID** de tu proyecto Supabase:
- Ve a tu proyecto en [supabase.com](https://supabase.com)
- En Settings → General, encontrarás el "Reference ID"

Luego ejecuta:
```bash
supabase link --project-ref [TU-PROJECT-REF]
```

Ejemplo:
```bash
supabase link --project-ref abcdefghijklmnop
```

### 3. Desplegar las Edge Functions

Despliega cada función individualmente:

```bash
# Función para registrar agencias (pública, sin verificación JWT)
supabase functions deploy register-agency --no-verify-jwt

# Función para crear usuarios
supabase functions deploy create-user

# Función para actualizar usuarios
supabase functions deploy update-user

# Función para eliminar usuarios
supabase functions deploy delete-user

# Función para invitar usuarios a agencias
supabase functions deploy invite-user-to-agency
```

### 4. Verificar el despliegue

Puedes verificar que las funciones se desplegaron correctamente:

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Edge Functions** en el menú lateral
3. Deberías ver todas las funciones listadas

### 5. Configurar variables de entorno (si es necesario)

Las Edge Functions usan automáticamente las variables de entorno de Supabase:
- `SUPABASE_URL` - Se configura automáticamente
- `SUPABASE_SERVICE_ROLE_KEY` - Se configura automáticamente

Si necesitas variables adicionales, puedes configurarlas en:
- Supabase Dashboard → Edge Functions → [Nombre de función] → Settings → Secrets

## Desplegar todas las funciones de una vez

Si quieres desplegar todas las funciones, puedes crear un script:

```bash
#!/bin/bash
supabase functions deploy register-agency --no-verify-jwt
supabase functions deploy create-user
supabase functions deploy update-user
supabase functions deploy delete-user
supabase functions deploy invite-user-to-agency
```

Guarda esto como `deploy-functions.sh`, dale permisos de ejecución:
```bash
chmod +x deploy-functions.sh
```

Y ejecuta:
```bash
./deploy-functions.sh
```

## Solución de Problemas

### Error: "Project not found"
- Verifica que el Project Reference ID sea correcto
- Asegúrate de estar autenticado: `supabase login`

### Error: "Function not found"
- Verifica que el nombre de la función coincida exactamente con el nombre de la carpeta
- Asegúrate de estar en el directorio raíz del proyecto

### Error: "Permission denied"
- Verifica que tengas permisos de administrador en el proyecto
- Intenta hacer logout y login nuevamente: `supabase logout && supabase login`

### Las funciones no aparecen en el Dashboard
- Espera unos minutos, puede haber un delay
- Refresca la página del Dashboard
- Verifica los logs: `supabase functions logs [nombre-funcion]`

## Ver logs de las funciones

Para ver los logs de una función específica:
```bash
supabase functions logs invite-user-to-agency
```

O ver logs en tiempo real:
```bash
supabase functions logs invite-user-to-agency --follow
```

## Actualizar una función

Para actualizar una función después de hacer cambios:
```bash
supabase functions deploy invite-user-to-agency
```

No necesitas eliminar la función anterior, el deploy la actualiza automáticamente.

