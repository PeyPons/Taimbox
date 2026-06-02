import { useTranslation, Trans } from 'react-i18next';
import type { ComponentProps } from 'react';

const APP_NS = 'app';

export function useAppTranslation() {
  return useTranslation(APP_NS);
}

/** `<Trans>` bound to the `app` namespace (defaultNS is `landing`). */
export function AppTrans(props: Omit<ComponentProps<typeof Trans>, 'ns' | 't'>) {
  const { t } = useTranslation(APP_NS);
  return <Trans ns={APP_NS} t={t} {...props} />;
}
