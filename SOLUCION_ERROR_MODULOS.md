# Solución: Error de carga de módulos JavaScript

## Problema

Al entrar en la página de reportes (y posiblemente otras), el navegador muestra:

```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html".
TypeError: Failed to fetch dynamically imported module
```

## Causa

El servidor web (nginx/apache) está devolviendo HTML en lugar de JavaScript cuando se solicitan archivos `.js` del directorio `assets/`. Esto suele pasar cuando:

1. **El archivo no existe** y el servidor devuelve una página 404 en HTML
2. **Configuración incorrecta del servidor** que no sirve archivos estáticos correctamente
3. **Problema con el build** - los archivos no se subieron correctamente al servidor

## Soluciones

### 1. Verificar que los archivos existen en el servidor

```bash
# En el servidor, verificar que existe el directorio dist/assets/
ls -la /ruta/a/tu/proyecto/dist/assets/

# Verificar que hay archivos .js
ls -la /ruta/a/tu/proyecto/dist/assets/*.js
```

### 2. Configuración de Nginx

Si usas Nginx, asegúrate de que tu configuración incluya:

```nginx
server {
    listen 80;
    server_name timeboxing.peypons.duckdns.org;
    root /ruta/a/tu/proyecto/dist;
    index index.html;

    # Servir archivos estáticos con MIME types correctos
    location ~* \.(js|mjs)$ {
        add_header Content-Type application/javascript;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Servir otros assets
    location ~* \.(css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback - redirigir todo a index.html EXCEPTO archivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Configuración de Apache

Si usas Apache, crea o modifica `.htaccess` en el directorio `dist/`:

```apache
<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType application/javascript .mjs
</IfModule>

# Habilitar rewrite para SPA
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### 4. Verificar permisos

```bash
# Asegurar que el servidor web puede leer los archivos
chmod -R 755 /ruta/a/tu/proyecto/dist
chown -R www-data:www-data /ruta/a/tu/proyecto/dist  # Para nginx/apache
```

### 5. Rebuild y redeploy

Si los archivos no existen, necesitas hacer un nuevo build:

```bash
cd /ruta/a/tu/proyecto
npm run build
# O si usas el script actualizar.sh
./actualizar.sh
```

## Mejoras implementadas en el código

1. **Filtro de eventos duplicados mejorado** en `AuthContext.tsx`:
   - Reducido el tiempo de deduplicación de 3s a 1s
   - Añadido log cuando se ignora un evento duplicado

2. **Manejo de errores en lazy loading** en `App.tsx`:
   - Detecta errores de MIME type
   - Intenta recargar la página automáticamente si detecta error del servidor

## Verificación

Después de aplicar los cambios del servidor:

1. Limpiar caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)
2. Abrir la consola del navegador
3. Intentar acceder a `/reports`
4. Verificar que los archivos `.js` se cargan correctamente (status 200, Content-Type: application/javascript)

## Nota importante

El problema principal es de **configuración del servidor**, no del código. Los cambios en el código solo mejoran el manejo de errores, pero el servidor debe estar configurado correctamente para servir los archivos estáticos.
