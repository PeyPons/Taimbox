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

Copia el bloque de abajo a cada compañero (sustituye `<AGENCY_ID>`, `<BASE_URL>` y el token).
Está escrito para que lo entienda una persona y el agente lo pueda seguir.

```text
# Registrar tu trabajo en Taimbox (obligatorio al cerrar)

## Para qué sirve
Cuando acabes algo útil, Taimbox guarda:
1) qué te pidieron,
2) quién eres,
3) a qué cliente (y proyecto, si se sabe) fue el trabajo,
4) cuándo empezaste y terminaste.

Eso se ve en la pantalla /agentes. Si tenías varias cosas a la vez, Taimbox reparte
la hora solo: no sumes minutos a mano ni crees allocations/time_entries desde aquí
salvo que te lo pidan aparte.

## Conexión (ya debería estar en tu workspace)
- Agency id: <AGENCY_ID>
- Base: <BASE_URL>/rest/v1
- Headers: apikey + Authorization Bearer (token readwrite con permiso agent_actions)
- Llamada: POST /rest/v1/rpc/record_agent_action

## Quién eres (OBLIGATORIO en cada registro)
Sin persona el registro no sirve. En TODAS las llamadas:

1) Si tienes usuario/empleado en Taimbox (lo normal):
   - Preferible: p_employee_id = tu UUID de empleado
   - Alternativa: p_employee_name = tu nombre completo O email EXACTOS como en Taimbox
     (ej. "Alexander Outeiral" o "aouteiral@cocosolution.com")
   Taimbox rellenará el nombre visible desde el empleado.

2) Si aún no tienes usuario en Taimbox:
   - p_employee_name = tu nombre real de persona (no el nick del agente)
   - Aparecerá el aviso employee_unmatched; avisa para que te den de alta.

No inventes otro nombre. Si llega employee_ambiguous o employee_missing: para y avisa.

## Misma conversación = misma raíz (como el historial de tareas)
No crees una petición nueva cada vez que retomas el mismo hilo (chat recuperado,
continuación, “sigue con lo de antes”).

- La raíz (intake) tiene un external_id estable de la petición.
- Al retomar: reutiliza ese external_id (actualiza) O añade hijos con
  p_parent_external_id apuntando a esa raíz.
- Solo crea una raíz nueva si es una petición distinta.

Identificador estable (external_id):
{tool}:{tu-email-o-id}:{slug-corto-de-la-peticion}:{nodo}
Ejemplo raíz: antigravity:aouteiral@cocosolution.com:tracy-bull-maps:root
Hijo:       antigravity:aouteiral@cocosolution.com:tracy-bull-maps:client-maps
Si actualizas el mismo nodo, reutiliza el mismo external_id (es idempotente).

## Qué NO registres
- Inventarios, recuentos o comandos locales sin entrega.
- Leer índices, resúmenes o buscar contexto sin producir un resultado.
- Pruebas, dry-run o fallos de runtime.
- Continuaciones que solo releen memoria y no dejan un resultado de cliente.

## Qué SÍ registres
Cuando hayas cerrado un trabajo de cliente o una gestión interna de la agencia:

1) Petición (raíz)
   - category = intake
   - title = texto de lo que te pidieron (máx. 300 caracteres)
   - quién eres (empleado)
   - work_mode = rapida | cliente | critica | repetible
   - attention = shared (salvo que te digan que era lo único que hacías: exclusive)

2) Si detectas el cliente/canal antes de trabajar
   - hijo category = triage (no imputa tiempo a cliente)
   - mismo trabajador

3) Por cada trabajo real (siempre con trabajador)
   - category = client_work + channel
     (google_ads | meta | seo | dv360 | analytics | email | crm | chatgpt_ads | reporting | other)
   - Cliente: client_id o client_name EXACTO como en Taimbox
   - Proyecto (recomendado): project_id o project_name EXACTO
     (ej. el proyecto "Google Ads · Avioa" tal cual está en Taimbox).
     Si no estás seguro del proyecto, deja solo el cliente. No inventes nombres.
   - O category = internal si es RRHH / informe de agencia / sin cliente

4) outcome = resultado breve en lenguaje claro (máx. 2000). No pegues el hilo entero.
5) history_ref = ruta corta del estado usado (ej. clientes/avioa/README.md#estado-operativo)
6) client_tier = responsable / apoyo / cobertura si lo conoces. No inventes importes.
7) started_at / finished_at = horas reales de ese nodo.
   Si trabajabas varios clientes a la vez → attention = shared.
8) Si hay varios trabajos de la misma petición, enlázalos con p_parent_external_id
   apuntando a la raíz (o al padre correcto).

## Si Taimbox no reconoce el cliente o el proyecto
Si la respuesta trae client_unmatched, client_ambiguous, project_unmatched o
project_ambiguous: NO elijas otro parecido. Deja el nodo y avisa.
Sin cliente único, ese trabajo de cliente no imputa.

## Ejemplo sencillo
Petición: «Revisa el Hangout de Pablo a ver qué necesita»
1) Raíz intake + tu nombre/email de empleado
2) Hijo client_work google_ads → client_name=Avioa + project_name del Ads de Avioa
3) Hijo client_work email → client_name=Avioa (si no hay proyecto de correo, solo cliente)
```

## Despliegue

1. Aplicar la migración SQL en el Postgres self-hosted.
2. Desplegar Edge Function `generate-api-token` (catálogo de scopes).
3. Regenerar o ampliar scopes del token de los agentes para incluir `agent_actions` (los tokens que ya tenían el catálogo completo anterior reciben el scope en el backfill de la migración).
4. Publicar el front con la ruta `/agentes`.
