/**
 * Versión REST de Google Ads API.
 * v22 hizo sunset el 7 de octubre de 2026: a partir de esa fecha las peticiones fallan
 * aunque el OAuth siga válido. v26 es la última mayor (sunset noviembre 2027).
 * Calendario: https://developers.google.com/google-ads/api/docs/sunset-dates
 */
export const GOOGLE_ADS_API_VERSION = 'v26';
