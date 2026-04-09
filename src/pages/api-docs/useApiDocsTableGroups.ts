import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getTableGroups } from './data/tableGroups';

export function useApiDocsTableGroups() {
  const { i18n } = useTranslation('apiDocs');
  const lang = i18n.language.startsWith('en') ? 'en' : 'es';
  return useMemo(() => getTableGroups(lang), [lang]);
}
