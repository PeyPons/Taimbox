import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { isAdsCampaignActive } from '@/utils/adsPerformance';
import { RoasValue } from '@/components/ads/RoasValue';

export type CampaignMetricRow = {
  key: string;
  name: ReactNode;
  status: string;
  cost: number;
  clicks: number;
  impressions: number;
  conversions: number;
  conversionValue: number;
  dailyBudget?: ReactNode;
  subtitle?: ReactNode;
};

type CampaignPerformanceListProps = {
  rows: CampaignMetricRow[];
  isSales: boolean;
  formatMoney: (amount: number) => string;
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-slate-800 tabular-nums truncate">{value}</div>
    </div>
  );
}

export function CampaignPerformanceList({ rows, isSales, formatMoney }: CampaignPerformanceListProps) {
  const { t } = useTranslation('app');
  const activeCount = rows.filter((row) => isAdsCampaignActive(row.status)).length;
  const totals = rows.reduce(
    (acc, row) => {
      acc.cost += row.cost;
      acc.clicks += row.clicks;
      acc.impressions += row.impressions;
      acc.conversions += row.conversions;
      acc.value += row.conversionValue;
      return acc;
    },
    { cost: 0, clicks: 0, impressions: 0, conversions: 0, value: 0 },
  );
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
  const showDaily = rows.some((row) => row.dailyBudget != null);

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg border px-4 py-8 text-center text-sm text-slate-400">
        {t('ads.table.noCampaigns', 'Sin campañas')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 border-b bg-slate-50 text-[11px] text-slate-500">
        <span>{t('ads.table.campaignSummary', { total: rows.length, active: activeCount, defaultValue: '{{active}} activas de {{total}}' })}</span>
        <span>CTR {ctr.toFixed(2)}%</span>
        <span>CPC {formatMoney(cpc)}</span>
        {isSales && totals.value > 0 && (
          <span>
            {t('ads.stats.valueLabel', 'Valor')} {formatMoney(totals.value)}
          </span>
        )}
      </div>

      <div className="md:hidden divide-y">
        {rows.map((row) => {
          const active = isAdsCampaignActive(row.status);
          const rowCtr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
          const rowCpc = row.clicks > 0 ? row.cost / row.clicks : 0;
          return (
            <div key={row.key} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-slate-800 leading-snug">{row.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-300')} />
                    {active ? t('ads.table.active', 'Activa') : t('ads.table.paused', 'Pausada')}
                    {row.subtitle}
                  </div>
                </div>
                {isSales && (
                  <RoasValue isSales cost={row.cost} conversionValue={row.conversionValue} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Metric label={t('ads.table.spent', 'Gasto')} value={formatMoney(row.cost)} />
                {showDaily && typeof row.dailyBudget === 'string' && (
                  <Metric label={t('common.dailyBudget', 'P. diario')} value={row.dailyBudget} />
                )}
                <Metric label={t('ads.stats.clicks', 'Clicks')} value={row.clicks.toLocaleString('es-ES')} />
                <Metric label="CTR" value={`${rowCtr.toFixed(2)}%`} />
                <Metric label="CPC" value={formatMoney(rowCpc)} />
                <Metric label={t('ads.table.impressions', 'Impresiones')} value={row.impressions.toLocaleString('es-ES')} />
                {isSales && (
                  <>
                    <Metric label={t('ads.table.conv', 'Conv')} value={row.conversions.toLocaleString('es-ES', { maximumFractionDigits: 1 })} />
                    <Metric
                      label={t('ads.stats.valueLabel', 'Valor')}
                      value={row.conversionValue > 0 ? formatMoney(row.conversionValue) : '—'}
                    />
                  </>
                )}
              </div>
              {showDaily && row.dailyBudget != null && typeof row.dailyBudget !== 'string' && (
                <div className="text-[11px] text-slate-500">
                  {t('common.dailyBudget', 'P. diario')}: {row.dailyBudget}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden md:block max-h-[420px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 border-b">
            <tr>
              <th className="px-3 py-2.5 text-left">{t('ads.table.campaign', 'Campaña')}</th>
              {showDaily && <th className="px-2 py-2.5 text-right">{t('common.dailyBudget', 'P. diario')}</th>}
              <th className="px-2 py-2.5 text-right">{t('ads.table.spent', 'Gasto')}</th>
              <th className="px-2 py-2.5 text-right">{t('ads.table.impressions', 'Impresiones')}</th>
              <th className="px-2 py-2.5 text-right">{t('ads.stats.clicks', 'Clicks')}</th>
              <th className="px-2 py-2.5 text-right">CTR</th>
              <th className="px-2 py-2.5 text-right">CPC</th>
              {isSales && <th className="px-2 py-2.5 text-right">{t('ads.table.conv', 'Conv')}</th>}
              {isSales && <th className="px-2 py-2.5 text-right">{t('ads.stats.valueLabel', 'Valor')}</th>}
              {isSales && <th className="px-2 py-2.5 text-center">{t('ads.table.roas', 'ROAS')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const active = isAdsCampaignActive(row.status);
              const rowCtr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
              const rowCpc = row.clicks > 0 ? row.cost / row.clicks : 0;
              return (
                <tr key={row.key} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800 leading-snug">{row.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-300')} />
                      {active ? t('ads.table.active', 'Activa') : t('ads.table.paused', 'Pausada')}
                      {row.subtitle}
                    </div>
                  </td>
                  {showDaily && (
                    <td className="px-2 py-2.5 text-right font-mono text-slate-500 whitespace-nowrap">{row.dailyBudget ?? '—'}</td>
                  )}
                  <td className="px-2 py-2.5 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">{formatMoney(row.cost)}</td>
                  <td className="px-2 py-2.5 text-right text-slate-600 tabular-nums">{row.impressions.toLocaleString('es-ES')}</td>
                  <td className="px-2 py-2.5 text-right text-slate-600 tabular-nums">{row.clicks.toLocaleString('es-ES')}</td>
                  <td className="px-2 py-2.5 text-right text-slate-500 tabular-nums">{rowCtr.toFixed(2)}%</td>
                  <td className="px-2 py-2.5 text-right text-slate-500 tabular-nums whitespace-nowrap">{formatMoney(rowCpc)}</td>
                  {isSales && (
                    <td className="px-2 py-2.5 text-right text-slate-700 tabular-nums">
                      {row.conversions.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
                    </td>
                  )}
                  {isSales && (
                    <td className="px-2 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {row.conversionValue > 0 ? (
                        <span className="text-emerald-700">{formatMoney(row.conversionValue)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  )}
                  {isSales && (
                    <td className="px-2 py-2.5 text-center">
                      <RoasValue isSales cost={row.cost} conversionValue={row.conversionValue} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
