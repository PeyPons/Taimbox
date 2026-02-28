# Comandos para actualizar Edge Functions (copiar y pegar)

Cuando actualices código en `supabase/functions/`, ejecuta estos comandos **en el servidor** (SSH) para desplegar y reiniciar.

---

## 1. En el servidor: actualizar código y desplegar

Copia y pega todo el bloque en la terminal del servidor:

```bash
cd ~/Timeboxing
git pull
chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh
./supabase/scripts/deploy-edge-functions-supabase-pi.sh
```

Si el proyecto en el servidor está en otra ruta (por ejemplo `/home/alex/Timeboxing`), usa:

```bash
cd /home/alex/Timeboxing
git pull
chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh
./supabase/scripts/deploy-edge-functions-supabase-pi.sh
```

---

## 2. Si las rutas de Supabase son distintas

Si Timeboxing no está en `~/Timeboxing` o Supabase no está en `~/supabase-pi/supabase/docker`, define las variables y ejecuta:

```bash
cd /home/alex/Timeboxing
git pull
export TIMBOXING_DIR=/home/alex/Timeboxing
export SUPABASE_DOCKER_DIR=/home/alex/supabase-pi/supabase/docker
chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh
./supabase/scripts/deploy-edge-functions-supabase-pi.sh
```

---

## 3. Ver logs tras el deploy (si algo falla)

```bash
docker logs supabase-edge-functions --tail 50
```

---

## Resumen una línea (tras hacer push desde tu PC)

En el servidor:

```bash
cd ~/Timeboxing && git pull && chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh && ./supabase/scripts/deploy-edge-functions-supabase-pi.sh
```
