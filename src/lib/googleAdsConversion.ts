/**
 * Conversión Google Ads (registro) + conversiones mejoradas (email/nombre hasheados SHA-256).
 * Solo se dispara si el usuario ha aceptado cookies de marketing (Consent Mode / RGPD).
 *
 * GTM: escucha el evento `google_ads_registration` en dataLayer (send_to, hashes opcionales).
 * Tag directo: AW-18004734870 / ILDPCNiM0LQcEJbnqYlD
 */

import { getCookieConsent } from '@/lib/cookieConsent';

const GOOGLE_ADS_AW_ID =
  (import.meta.env.VITE_GOOGLE_ADS_AW_ID as string | undefined)?.trim() || 'AW-18004734870';

const GOOGLE_ADS_REGISTRATION_LABEL =
  (import.meta.env.VITE_GOOGLE_ADS_REGISTRATION_LABEL as string | undefined)?.trim() ||
  'ILDPCNiM0LQcEJbnqYlD';

export const GOOGLE_ADS_REGISTRATION_SEND_TO = `${GOOGLE_ADS_AW_ID}/${GOOGLE_ADS_REGISTRATION_LABEL}`;

export const GOOGLE_ADS_REGISTRATION_DATALAYER_EVENT = 'google_ads_registration';

type GtagFn = (...args: unknown[]) => void;

type WindowWithGtag = Window & {
  dataLayer?: unknown[];
  gtag?: GtagFn;
};

function getGtag(): GtagFn | null {
  if (typeof window === 'undefined') return null;
  const w = window as WindowWithGtag;
  if (typeof w.gtag === 'function') return w.gtag;
  w.dataLayer = w.dataLayer ?? [];
  w.gtag = (...args: unknown[]) => {
    w.dataLayer!.push(args);
  };
  return w.gtag;
}

let gtagScriptPromise: Promise<void> | null = null;

function loadGoogleAdsGtagScript(): Promise<void> {
  if (gtagScriptPromise) return gtagScriptPromise;
  gtagScriptPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('no document'));
      return;
    }
    const src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ADS_AW_ID)}`;
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load gtag.js'));
    document.head.appendChild(script);
  });
  return gtagScriptPromise;
}

/** Requiere consentimiento de marketing (publicidad) en el banner de cookies. */
export function canTrackGoogleAdsConversion(): boolean {
  return getCookieConsent()?.marketing === true;
}

/** Normalización previa al hash (Google Ads enhanced conversions). */
export function normalizeEmailForGoogleAds(email: string): string {
  return email.trim().toLowerCase();
}

export function splitFullNameForGoogleAds(fullName: string): {
  first_name: string;
  last_name: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', last_name: '' };
  if (parts.length === 1) {
    return { first_name: parts[0].toLowerCase(), last_name: '' };
  }
  return {
    first_name: parts[0].toLowerCase(),
    last_name: parts.slice(1).join(' ').toLowerCase(),
  };
}

async function sha256Hex(value: string): Promise<string> {
  if (!value) return '';
  if (typeof crypto?.subtle?.digest !== 'function') return '';
  const encoded = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export type GoogleAdsRegistrationConversionParams = {
  email: string;
  fullName: string;
  /** ID único para deduplicar (p. ej. auth user id). */
  transactionId?: string;
};

/**
 * Dispara conversión de registro en Google Ads con datos de conversiones mejoradas (hasheados).
 * No lanza error al usuario si falla la carga del tag.
 */
export async function trackGoogleAdsRegistrationConversion(
  params: GoogleAdsRegistrationConversionParams,
): Promise<void> {
  if (!canTrackGoogleAdsConversion()) return;

  const normalizedEmail = normalizeEmailForGoogleAds(params.email);
  const { first_name, last_name } = splitFullNameForGoogleAds(params.fullName);

  const [emailHash, firstNameHash, lastNameHash] = await Promise.all([
    sha256Hex(normalizedEmail),
    sha256Hex(first_name),
    sha256Hex(last_name),
  ]);

  try {
    const dl = (window as WindowWithGtag).dataLayer;
    if (dl && Array.isArray(dl)) {
      dl.push({
        event: GOOGLE_ADS_REGISTRATION_DATALAYER_EVENT,
        google_ads_send_to: GOOGLE_ADS_REGISTRATION_SEND_TO,
        ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
        ...(emailHash ? { user_email_hash: emailHash } : {}),
        ...(firstNameHash ? { user_first_name_hash: firstNameHash } : {}),
        ...(lastNameHash ? { user_last_name_hash: lastNameHash } : {}),
      });
    }
  } catch {
    // ignore dataLayer
  }

  try {
    await loadGoogleAdsGtagScript();
    const gtag = getGtag();
    if (!gtag) return;

    gtag('js', new Date());
    gtag('config', GOOGLE_ADS_AW_ID, { allow_enhanced_conversions: true });

    const userData: {
      email?: string;
      address?: { first_name?: string; last_name?: string };
    } = {};

    if (emailHash) userData.email = emailHash;
    if (firstNameHash || lastNameHash) {
      userData.address = {};
      if (firstNameHash) userData.address.first_name = firstNameHash;
      if (lastNameHash) userData.address.last_name = lastNameHash;
    }

    if (emailHash || firstNameHash || lastNameHash) {
      gtag('set', 'user_data', userData);
    }

    gtag('event', 'conversion', {
      send_to: GOOGLE_ADS_REGISTRATION_SEND_TO,
      ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
    });
  } catch (err) {
    console.debug('[Google Ads] registration conversion not sent', err);
  }
}
