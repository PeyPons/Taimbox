# Review Agents (Ollama)

Portal de revisión con skills personalizables, cola BullMQ/Redis y worker en **ia-srv** que llama a Ollama local.

## Estructura

| Paquete | Descripción |
|---------|-------------|
| `shared` | Tipos y constantes |
| `api` | REST Express (puerto 3001) |
| `worker` | Pipeline map-reduce + Ollama |
| `portal` | SPA React (Vite) |

## Base de datos

Aplicar migración:

```bash
# Desde el repo Taimbox
psql ... -f supabase/migrations/20260526120000_review_agents.sql
# o supabase db push / MCP apply_migration
```

## Desarrollo local

```bash
cd packages/review-agents
npm install
npm run build -w @taimbox/review-shared

# Terminal 1 — Redis
docker compose -f deploy/docker-compose.redis.yml up -d

# Terminal 2 — API (copiar variables de supabase/.env)
export SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=...
npm run dev:api

# Terminal 3 — Worker
npm run dev:worker

# Terminal 4 — Portal
cp portal/.env.example portal/.env
npm run dev:portal
```

## Arquitectura: ia-srv solo expone Ollama

Si **no puedes instalar nada en ia-srv** (88.30.74.159), solo necesitas la API que ya tienes:

| Dónde corre | Qué |
|-------------|-----|
| **ia-srv** | Solo Ollama detrás de Apache (`/ollama-api` + token Bearer). **Sin cambios** si ya funciona. |
| **Otro host** (PC, VPS, mismo servidor que Supabase) | `review-api`, `review-worker`, Redis, portal |

Variables del worker (en el host donde corre el worker, **no** en ia-srv):

```env
OLLAMA_URL=http://88.30.74.159/ollama-api
OLLAMA_API_TOKEN=tu-token-bearer
OLLAMA_MODEL=qwen2.5:7b-instruct
OLLAMA_MODEL_MAP=llama3.2:3b
OLLAMA_MODEL_REDUCE=qwen2.5:7b-instruct
```

## Producción (api + worker + portal)

1. `deploy/docker-compose.redis.yml` en el host elegido
2. Build (`npm run build` en `packages/review-agents`)
3. `deploy/env.example` → archivo env con Supabase + Ollama remoto + Resend
4. Opcional: `systemd` en `deploy/systemd/`, Apache para el portal

## Documentación

- [`docs/review-agents-mcp-baseline.md`](../../docs/review-agents-mcp-baseline.md)
- [`docs/05-integraciones-automatizacion.md`](../../docs/05-integraciones-automatizacion.md) (§ Review Agents)
