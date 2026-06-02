import { useTranslation } from 'react-i18next';
import { getDateFnsLocale } from '@/i18n/dateLocale';

/** date-fns locale synced with the active i18next language. */
export function useDateLocale() {
  const { i18n } = useTranslation();
  return getDateFnsLocale(i18n.language);
}
