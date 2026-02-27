# Desplegar Edge Functions (Supabase self-hosted)

**Convención del proyecto:** En entornos self-hosted no usamos `supabase login` ni `supabase functions deploy`. Generamos el script de deploy en el servidor con un heredoc (pegando el contenido) y luego ejecutamos el deploy. Así queda documentado para cualquier servidor sin necesidad de clonar el repo solo para desplegar.

---

## Crear el script de deploy en el servidor (heredoc)

Si en el servidor no tienes el repo de Taimbox o quieres tener el script sin clonar, créalo pegando este bloque en la consola (todo de una vez). Crea el directorio, el archivo con el contenido y lo marca ejecutable:

```bash
mkdir -p ~/Taimbox/supabase/scripts
cat > ~/Taimbox/supabase/scripts/deploy-edge-functions-supabase-pi.sh << 'ENDOFFILE'
#!/usr/bin/env bash
#
# Despliegue de Edge Functions para Taimbox cuando Supabase está en ~/supabase-pi.
#

set -e

TIMBOXING_DIR="${TIMBOXING_DIR:-$HOME/Taimbox}"
SUPABASE_DOCKER_DIR="${SUPABASE_DOCKER_DIR:-$HOME/supabase-pi/supabase/docker}"
COMPOSE_FILE="${SUPABASE_DOCKER_DIR}/docker-compose.yml"
FUNCTIONS_SOURCE="${TIMBOXING_DIR}/supabase/functions"
VOLUMES_FUNCTIONS="${SUPABASE_DOCKER_DIR}/volumes/functions"
SERVICE_NAME="${SUPABASE_FUNCTIONS_SERVICE:-functions}"

echo "[deploy] Taimbox:    $TIMBOXING_DIR"
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

mkdir -p "$VOLUMES_FUNCTIONS"
echo "[deploy] Copiando funciones..."
rsync -a "$FUNCTIONS_SOURCE/" "$VOLUMES_FUNCTIONS/"
echo "[deploy] Copia terminada."

echo "[deploy] Reiniciando $SERVICE_NAME..."
(cd "$SUPABASE_DOCKER_DIR" && docker compose -f docker-compose.yml restart "$SERVICE_NAME") || {
  echo "  Fallo al reiniciar. Servicios:"
  (cd "$SUPABASE_DOCKER_DIR" && docker compose -f docker-compose.yml config --services 2>/dev/null) || true
  echo "  Reinicio manual: cd $SUPABASE_DOCKER_DIR && docker compose -f docker-compose.yml restart $SERVICE_NAME"
  exit 1
}

echo "[deploy] Listo."
ENDOFFILE
chmod +x ~/Taimbox/supabase/scripts/deploy-edge-functions-supabase-pi.sh
echo "Script creado: ~/Taimbox/supabase/scripts/deploy-edge-functions-supabase-pi.sh"
```

Después, **asegúrate de que en el servidor** la carpeta `~/Taimbox/supabase/functions/` **contenga todas las funciones** (incluida `add-platform-admin`). Si en el servidor no está actualizada:
- Desde tu **PC** (en la carpeta del proyecto):  
  `rsync -avz supabase/functions/ alex@IP_O_DOMINIO:~/Taimbox/supabase/functions/`
- O en el **servidor**: `cd ~/Taimbox && git pull`  
Luego ejecuta el deploy (siguiente sección).

---

## Servidor con Taimbox en ~/Taimbox y Supabase en ~/supabase-pi

En el servidor (ya conectado por SSH):

```bash
cd ~/Taimbox
chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh
./supabase/scripts/deploy-edge-functions-supabase-pi.sh
```

Eso copia `~/Taimbox/supabase/functions/` a `~/supabase-pi/supabase/docker/volumes/functions/` y reinicia el servicio `functions` (contenedor `supabase-edge-functions`). No hace falta `sudo` si tu usuario está en el grupo `docker`.

Si las rutas son otras:

```bash
export TIMBOXING_DIR=/home/alex/Taimbox
export SUPABASE_DOCKER_DIR=/home/alex/supabase-pi/supabase/docker
./supabase/scripts/deploy-edge-functions-supabase-pi.sh
```

**Nota:** El `docker-compose` de Supabase arranca el Edge Runtime con `--main-service /home/deno/functions/main`. Si en `volumes/functions` no existe una carpeta `main`, el contenedor puede fallar al iniciar. La primera vez, si ya tenías algo en `volumes/functions` (por ejemplo un `main` de ejemplo), el script no lo borra. Si `volumes/functions` estaba vacío y el servicio no arranca, puedes crear un `main` mínimo o revisar los logs: `docker logs supabase-edge-functions`.

---

## En el servidor (script genérico)

### 1. Configurar y ejecutar el script

```bash
# Ir a la carpeta del proyecto en el servidor (o donde esté el repo)
cd /ruta/donde/esta/el/proyecto   # p.ej. /opt/timeboxing

# Si el script no es ejecutable
chmod +x supabase/scripts/deploy-edge-functions.sh

# Decir dónde está el proyecto (si no es la ruta por defecto /opt/timeboxing)
export PROJECT_DIR=/ruta/donde/esta/el/proyecto

# Nombre del contenedor Docker del Edge Runtime (ver con: docker ps -a)
export RUNTIME_CONTAINER=supabase-edge-runtime

# Desplegar (actualiza desde git si hay .git y reinicia el contenedor)
./supabase/scripts/deploy-edge-functions.sh
```

### 2. Si usas docker-compose

Edita `supabase/scripts/deploy-edge-functions.sh` y descomenta/ajusta:

```bash
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
COMPOSE_SERVICE="functions"   # o el nombre del servicio en tu compose
```

Luego ejecuta el script (no hace falta `RUNTIME_CONTAINER`).

---

## Desde tu PC: subir funciones y desplegar en el servidor

Si el código está en tu máquina y quieres subir solo las funciones y reiniciar:

```bash
# Desde la carpeta del proyecto en tu PC (Taimbox)

# 1. Subir la carpeta functions al servidor
rsync -avz --delete supabase/functions/ usuario@TU_SERVIDOR:/ruta/proyecto/supabase/functions/

# 2. En el servidor, reiniciar el Edge Runtime (una sola línea por SSH)
ssh usuario@TU_SERVIDOR "export PROJECT_DIR=/ruta/proyecto && export RUNTIME_CONTAINER=supabase-edge-runtime && cd \$PROJECT_DIR/supabase/scripts && ./deploy-edge-functions.sh"
```

Sustituye:
- `usuario` → tu usuario SSH en el servidor
- `TU_SERVIDOR` → IP o dominio (ej. `api.taimbox.com` o la IP)
- `/ruta/proyecto` → ruta real del proyecto en el servidor (ej. `/opt/timeboxing`)

Si no tienes `rsync`, usa `scp`:

```bash
scp -r supabase/functions usuario@TU_SERVIDOR:/ruta/proyecto/supabase/
ssh usuario@TU_SERVIDOR "export PROJECT_DIR=/ruta/proyecto && export RUNTIME_CONTAINER=supabase-edge-runtime && cd \$PROJECT_DIR/supabase/scripts && ./deploy-edge-functions.sh"
```

---

## Descubrir el nombre del contenedor

En el servidor:

```bash
docker ps -a
```

Busca el contenedor que ejecuta el Edge Runtime (imagen tipo `supabase/edge-runtime` o similar) y usa su nombre en `RUNTIME_CONTAINER`.

---

## Migraciones de base de datos

Las migraciones SQL (p. ej. cronómetro de tareas, función `cleanup_employee_data`) se aplican en el contenedor de Postgres del mismo entorno. Comandos y flujo desde PC/servidor: **[docs/MIGRACIONES-SERVIDOR.md](../../docs/MIGRACIONES-SERVIDOR.md)**.
