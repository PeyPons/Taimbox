/** @deprecated Import from `@/utils/adsPpcAlertBuild` — re-export por compatibilidad. */
export {
  adsBudgetAlertDedupeKey,
  adsPpcAlertMatchesFlags,
  computeAdsBudgetAlerts,
  type AdsBudgetAlert,
  type AdsClientSettingRow,
  type AdsPpcAlertDetail,
  type AdsPpcStatus,
} from '@/utils/adsPpcAlertBuild';

export type AdsSpendRow = {
  client_id: string;
  cost: number;
  date: string;
  client_name?: string | null;
};
