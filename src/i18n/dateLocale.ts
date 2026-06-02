import { enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';

/** date-fns locale from i18next language code (defaults to Spanish). */
export function getDateFnsLocale(language?: string | null): Locale {
  const lang = (language ?? 'es').split('-')[0].toLowerCase();
  return lang === 'en' ? enUS : es;
}
