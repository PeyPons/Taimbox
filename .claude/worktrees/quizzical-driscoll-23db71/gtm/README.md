# Google Tag Manager – import Consent Mode (Taimbox)

## Archivo

- **[GTM-consent-mode-taimbox.json](./GTM-consent-mode-taimbox.json)** – variables (cookies + capa de datos), disparadores y 3 etiquetas HTML personalizadas alineadas con `src/lib/cookieConsent.ts` y el banner `CookieBanner.tsx`.

## Cómo importar

1. En [Google Tag Manager](https://tagmanager.google.com/), abre el contenedor **GTM-WSQZRMW7**.
2. **Administrar** → **Importar contenedor**.
3. Elige el archivo `GTM-consent-mode-taimbox.json`.
4. Workspace: **existente** (o uno nuevo) del mismo contenedor.
5. Modo: **Combinar** (recomendado). Si GTM avisa de conflictos de nombres, elige renombrar o sobrescribir según tu criterio.
6. Revisa en **Vista previa** que disparen, en orden lógico:
   - **Taimbox - Consent Mode default (denied)** – disparador *Taimbox - Consent Initialization (import)*.
   - **Taimbox - Consent Mode update from cookies** – disparador *Taimbox - Initialization (import)*.
   - **Taimbox - Consent Mode update from dataLayer** – evento `cookie_consent_update`.

## Si la importación rechaza los disparadores `CONSENT_INIT` / `INIT`

Algunas versiones del importador no crean disparadores “sistema” duplicados. En ese caso, **borra** los disparadores importados que fallen y, en cada etiqueta, asigna manualmente:

| Etiqueta | Disparador integrado recomendado |
|----------|----------------------------------|
| Consent Mode default (denied) | **Consent Initialization - All Pages** |
| Consent Mode update from cookies | **Initialization - All Pages** |
| Consent Mode update from dataLayer | Evento personalizado **cookie_consent_update** |

Las variables de cookies deben seguir apuntando a los nombres exactos: `timeboxing_gtm_analytics_storage`, `timeboxing_gtm_ad_storage`, `timeboxing_gtm_ad_user_data`, `timeboxing_gtm_ad_personalization`.

## Etiquetas de medición (GA4, Ads, etc.)

Añádelas en este mismo contenedor y configura en cada una la **configuración de consentimiento** (p. ej. requerir `analytics_storage` o `ad_storage` según el tipo de etiqueta).

## Snippet en la web

El contenedor se carga desde la raíz del frontend: `index.html` (snippet oficial de GTM en `<head>` + `noscript` tras `<body>`). Toda la SPA (incluido el dashboard) usa ese único HTML.
