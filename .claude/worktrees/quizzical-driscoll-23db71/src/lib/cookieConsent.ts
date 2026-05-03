/**
 * Utilidad para consentimiento de cookies (RGPD).
 * Persiste en localStorage y permite condicionar analytics/marketing.
 * Sincroniza con Google Consent Mode v2 para GTM (cookie + dataLayer).
 */

export const COOKIE_CONSENT_KEY = "timeboxing_cookie_consent";

/** Prefijo de cookies que GTM puede leer para Consent Mode (una por clave: analytics_storage, ad_storage, ad_user_data, ad_personalization) */
export const GTM_CONSENT_COOKIE_PREFIX = "timeboxing_gtm_";

/** Evento y clave dataLayer para GTM. Disparador en GTM: Event name = cookie_consent_update */
export const GTM_CONSENT_EVENT = "cookie_consent_update";

export interface CookieConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

/** Objeto listo para gtag('consent', 'update', ...) y para GTM Consent Mode */
export interface GtmConsentState {
  analytics_storage: "granted" | "denied";
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
}

const DEFAULT_CONSENT: CookieConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: 0,
};

const GTM_COOKIE_DAYS = 365;

function toGtmConsent(state: CookieConsentState): GtmConsentState {
  return {
    analytics_storage: state.analytics ? "granted" : "denied",
    ad_storage: state.marketing ? "granted" : "denied",
    ad_user_data: state.marketing ? "granted" : "denied",
    ad_personalization: state.marketing ? "granted" : "denied",
  };
}

/**
 * Escribe el consentimiento en cookies (una por clave, valores "granted"/"denied") y en dataLayer.
 * GTM: crear 4 variables 1st Party Cookie: timeboxing_gtm_analytics_storage, timeboxing_gtm_ad_storage,
 * timeboxing_gtm_ad_user_data, timeboxing_gtm_ad_personalization. O usar el evento cookie_consent_update
 * y leer de dataLayer.
 */
export function syncConsentToGtm(state: CookieConsentState): void {
  if (typeof window === "undefined") return;
  const gtm = toGtmConsent(state);
  try {
    const maxAge = GTM_COOKIE_DAYS * 24 * 60 * 60;
    const opts = `path=/;max-age=${maxAge};samesite=lax`;
    document.cookie = `${GTM_CONSENT_COOKIE_PREFIX}analytics_storage=${gtm.analytics_storage};${opts}`;
    document.cookie = `${GTM_CONSENT_COOKIE_PREFIX}ad_storage=${gtm.ad_storage};${opts}`;
    document.cookie = `${GTM_CONSENT_COOKIE_PREFIX}ad_user_data=${gtm.ad_user_data};${opts}`;
    document.cookie = `${GTM_CONSENT_COOKIE_PREFIX}ad_personalization=${gtm.ad_personalization};${opts}`;
  } catch {
    // ignore
  }
  try {
    const dl = (window as Window & { dataLayer?: Record<string, string>[] }).dataLayer;
    if (dl && Array.isArray(dl)) {
      dl.push({
        event: GTM_CONSENT_EVENT,
        analytics_storage: gtm.analytics_storage,
        ad_storage: gtm.ad_storage,
        ad_user_data: gtm.ad_user_data,
        ad_personalization: gtm.ad_personalization,
      });
    }
  } catch {
    // ignore
  }
}

export function getCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentState;
    if (
      typeof parsed.necessary !== "boolean" ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setCookieConsent(state: CookieConsentState): void {
  if (typeof window === "undefined") return;
  try {
    const toSave: CookieConsentState = {
      ...DEFAULT_CONSENT,
      ...state,
      necessary: true, // Siempre true cuando hay consentimiento explícito
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(toSave));
    syncConsentToGtm(toSave);
    window.dispatchEvent(new CustomEvent("cookie-consent-update", { detail: toSave }));
  } catch {
    // ignore
  }
}

export function hasCookieConsent(): boolean {
  return getCookieConsent() !== null;
}

export function acceptAllCookies(): void {
  setCookieConsent({
    necessary: true,
    analytics: true,
    marketing: true,
    timestamp: Date.now(),
  });
}

export function acceptOnlyNecessary(): void {
  setCookieConsent({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
  });
}
