# Google Consent Mode v2 con GTM (Timeboxing)

El consentimiento de cookies se expone a **Google Tag Manager** de dos formas para que puedas usar Consent Mode con la mínima configuración.

## 1. Cookies (recomendada para lectura en carga)

Se escriben **4 cookies** con valores directos `granted` o `denied` (sin codificar):

| Cookie | Ejemplo de valor |
|--------|-------------------|
| `timeboxing_gtm_analytics_storage` | `granted` |
| `timeboxing_gtm_ad_storage` | `denied` |
| `timeboxing_gtm_ad_user_data` | `denied` |
| `timeboxing_gtm_ad_personalization` | `denied` |

**En GTM:**

1. Crear 4 variables de tipo **1st Party Cookie**, con los nombres de cookie indicados.
2. Usar cada variable en tu tag de Consent Mode (o en `gtag('consent', 'update', {...})`).

## 2. dataLayer (recomendada para actualizar Consent al cambiar)

Cada vez que el usuario acepta o cambia preferencias, se hace push con:

- **Evento**: `cookie_consent_update`
- **Campos**: `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` (valores `"granted"` o `"denied"`).

**En GTM:**

1. Crear un **Trigger** tipo Evento personalizado, nombre del evento: `cookie_consent_update`.
2. En un tag de **Consent Mode** (o tag que llame a `gtag('consent', 'update', {...})`), usar como disparador este trigger y leer de dataLayer las variables:
   - `{{DLV - analytics_storage}}`
   - `{{DLV - ad_storage}}`
   - `{{DLV - ad_user_data}}`
   - `{{DLV - ad_personalization}}`

(En GTM son Variables de capa de datos con los nombres de clave indicados.)

## Resumen de mapeo

| Preferencia Timeboxing | Consent Mode |
|------------------------|--------------|
| Necesarias (siempre activas) | — |
| Analíticas | `analytics_storage` |
| Marketing | `ad_storage`, `ad_user_data`, `ad_personalization` |

Si no hay consentimiento guardado (usuario no ha elegido aún), no se escribe cookie ni dataLayer hasta que acepte; el estado por defecto en GTM debe ser "denied" hasta recibir `cookie_consent_update` o hasta leer la cookie.
