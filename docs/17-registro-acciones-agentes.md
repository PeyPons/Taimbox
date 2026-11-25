# Registro de acciones de agentes (Claude, Codex, Antigravity)

## Problema

Con varios agentes abiertos a la vez, una petición vaga (por ejemplo «revisa el Hangout de Pablo») no es trabajo de un cliente. El sistema de Codex clasifica la petición, baja al README del cliente y solo entonces ejecuta. Si se imputa la hora entera a cada cliente que toca, las cifras de cartera dejan de ser creíbles.

## Qué hay en Taimbox

| Pieza | Uso |
|-------|-----|
| Tabla `agent_actions` | Árbol de nodos por agencia |
| RPC `record_agent_action` | Alta/upsert idempotente por `external_id` |
| Scope API `agent_actions` | Lectura/escritura con token de integración |
| Pantalla `/agentes` | «Trabajo en paralelo»: árbol + reloj repartido |
| Utilidad `agentActionAttribution` | Reparte solapes; no suma duración bruta por cliente |

Migración: `supabase/migrations/20261125120000_agent_actions.sql`.

## Categorías

| `category` | Significado | ¿Imputa a cliente? |
|------------|-------------|--------------------|
| `intake` | Petición humana | No |
| `triage` | Detección de cliente/canal | No |
| `client_work` | Trabajo reconocible de un cliente | Solo si `match_status=matched` y hay `client_id` |
| `internal` | Gestión interna (RRHH, informes de agencia, etc.) | Sí, como «Gestiones internas» |
| `noise` | Descartado | No (ni alarga el reloj) |

La hoja imputable es la que lleva `client_work`/`internal` **y** no tiene un hijo que ya lleve ese tiempo. Así la petición no se suma encima de la revisión de Ads.

## Solapes

Si dos hojas imputables de la misma persona se solapan:

1. Si alguna es `attention=exclusive`, se queda el tramo.
2. Si no, las `shared` se reparten a partes iguales.
3. `background` no recibe tramo cuando hay exclusive o shared.

El **reloj de la persona** es la unión de intervalos (sin duplicar). La **suma sin repartir** es la cifra que se infla cuando hay cuatro clientes a la vez. **Imputable** es lo que queda tras el reparto.

## Cómo registrar (agentes)

Preferir:

```http
POST /rest/v1/rpc/record_agent_action
```

con token **readwrite** y scope `agent_actions`. Crear primero la raíz (`intake`) y después los hijos con `p_parent_external_id`. No registrar inventarios locales, `buscar_contexto` ni lecturas de índice.

Detalle de campos y ejemplos: `/api-docs#resource-agent_actions`.

## Prompt para pegar en Codex / Claude / Antigravity

```text
# Registrar trabajo en Taimbox (obligatorio al cerrar)

Tienes acceso a la API de Taimbox (token readwrite con scope agent_actions).
Agency id: <AGENCY_ID>
Base: <BASE_URL>/rest/v1
Headers: apikey + Authorization Bearer

## Trabajador (obligatorio en TODOS los nodos)
Tu workspace sabe siempre quién eres. En cada llamada a record_agent_action envía:
- p_employee_id = UUID del empleado en Taimbox si lo tienes en memoria/config, O
- p_employee_name = nombre completo o email EXACTOS como en Taimbox (employees).
No inventes otra persona. No dejes el nodo sin trabajador.
Si warnings trae employee_unmatched o employee_ambiguous: avisa y no inventes otro nombre.
El external_id debe incluir tu identidad estable: {tool}:{tu-email-o-id}:{slug-peticion}:{nodo}

## Qué NO registrar
- Inventario, recuento o comando local sin cliente ni entrega.
- Lectura de docs/INDEX.md, resumen-operativas, buscar_contexto o listados.
- Fallos de runtime, dry-run o pruebas.
- Continuidad que solo relee memoria y no produce un resultado de cliente.

## Qué SÍ registrar
Cuando clasifiques la petición (rapida / cliente / critica / repetible) y haya un resultado
de cliente o una gestión interna cerrada:

1) Un nodo raíz category=intake con el texto de la petición (title ≤ 300) + trabajador.
   work_mode = el modo de arranque. attention=shared salvo que Alex diga que era lo único.
2) Si detectas cliente/canal antes de trabajar: hijo category=triage (no imputa) + trabajador.
3) Por cada trabajo real (+ trabajador siempre):
   - category=client_work + channel
     (google_ads|meta|seo|dv360|analytics|email|crm|chatgpt_ads|reporting|other)
   - Cliente: client_id o client_name exacto de Taimbox.
   - Proyecto (preferible): si conoces el proyecto del canal/servicio, envía también
     project_id o project_name exacto (ej. "Google Ads · Avioa", el nombre tal cual en Taimbox).
     El proyecto ancla mejor que solo el cliente cuando hay varios servicios.
     Si el nombre de proyecto no es único o no lo sabes, deja solo el cliente; no inventes.
   - o category=internal si es RRHH / informe de agencia / sin cliente
4) outcome = resultado breve (≤ 2000). No pegues el hilo ni el documento.
5) history_ref = ruta corta del README o estado usado (ej. clientes/avioa/README.md#estado-operativo).
6) client_tier = escalón corto si lo conoces (responsable / apoyo / cobertura). No inventes importes.
7) started_at / finished_at reales del nodo. Si hay varios clientes a la vez, attention=shared.
8) external_id estable (ver arriba). Reutiliza el mismo al actualizar (idempotente).
9) Si warnings trae client_unmatched, client_ambiguous, project_unmatched o project_ambiguous:
   NO elijas otro. Deja el nodo y avisa. Sin cliente único no se imputa client_work.

## Ejemplo Hangout → Avioa
Raíz intake + employee_name/id: "Revisa el Hangout de Pablo a ver qué necesita"
Hijo client_work google_ads: client_name=Avioa, project_name=<nombre exacto del proyecto Google Ads de Avioa en Taimbox>
Hijo client_work email: client_name=Avioa, mismo trabajador, parent=raíz
(Si no hay proyecto de correo, solo cliente está bien.)

No crees allocations ni time_entries desde este flujo salvo que te lo pidan aparte.
La pantalla /agentes reparte el solape; no sumes minutos a mano por cliente.
```

## Despliegue

1. Aplicar la migración SQL en el Postgres self-hosted.
2. Desplegar Edge Function `generate-api-token` (catálogo de scopes).
3. Regenerar o ampliar scopes del token de los agentes para incluir `agent_actions` (los tokens que ya tenían el catálogo completo anterior reciben el scope en el backfill de la migración).
4. Publicar el front con la ruta `/agentes`.
