import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMarginSemaphore } from '@/utils/marginSemaphore';

export type ProfitabilityAttributionRow = {
  employeeId: string;
  hoursDisplay: number;
  attributedRevenue: number;
  cost: number;
  margin: number;
};

type FormatMoney = (value: number) => string;
type FormatPerHour = (value: number, digits?: number) => string;

type Props = {
  rows: ProfitabilityAttributionRow[];
  employeeNameById: (id: string) => string;
  formatMoney: FormatMoney;
  formatPerHour: FormatPerHour;
  hoursModeLabel: string;
};

/**
 * Desglose por empleado en móvil: tarjetas apiladas (sin tabla ancha).
 * Mantiene nombre, horas, coste y margen — lo esencial para decidir.
 */
export function ProfitabilityAttributionMobileList({
  rows,
  employeeNameById,
  formatMoney,
  formatPerHour,
  hoursModeLabel,
}: Props) {
  const { t } = useTranslation('app');

  if (rows.length === 0) {
    return (
      <p className="text-sm italic text-slate-500 py-2">
        {t('financialHealth.expand.noEmployeeBreakdown')}
      </p>
    );
  }

  const totH = rows.reduce((s, r) => s + r.hoursDisplay, 0);
  const totRev = rows.reduce((s, r) => s + r.attributedRevenue, 0);
  const totCost = rows.reduce((s, r) => s + r.cost, 0);
  const totMargin = rows.reduce((s, r) => s + r.margin, 0);
  const totMarginPct = totRev > 0 ? (totMargin / totRev) * 100 : totMargin < 0 ? -1 : 0;
  const totSem = getMarginSemaphore(totMarginPct);

  return (
    <div className="space-y-2 md:hidden">
      <p className="text-[11px] text-slate-400 px-0.5">{hoursModeLabel}</p>
      <ul className="space-y-2">
        {rows.map((row) => {
          const marginPct =
            row.attributedRevenue > 0
              ? (row.margin / row.attributedRevenue) * 100
              : row.margin < 0
                ? -1
                : 0;
          const sem = getMarginSemaphore(marginPct);
          const costPh = row.hoursDisplay > 0.001 ? row.cost / row.hoursDisplay : 0;
          return (
            <li
              key={row.employeeId}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-900 text-sm leading-snug min-w-0">
                  {employeeNameById(row.employeeId)}
                </p>
                <span
                  className={cn(
                    'font-mono text-sm font-semibold tabular-nums shrink-0 inline-flex items-center gap-1',
                    sem.className,
                  )}
                >
                  {sem.showAlert && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
                  {formatMoney(row.margin)}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600">
                <div>
                  <dt className="text-slate-400">{t('financialHealth.columns.hours', 'Horas')}</dt>
                  <dd className="font-mono tabular-nums">{row.hoursDisplay.toFixed(1)} h</dd>
                </div>
                <div>
                  <dt className="text-slate-400">{t('financialHealth.mobile.revenueShort', 'Ingreso')}</dt>
                  <dd className="font-mono tabular-nums">{formatMoney(row.attributedRevenue)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">{t('financialHealth.mobile.costShort', 'Coste')}</dt>
                  <dd className="font-mono tabular-nums">{formatMoney(row.cost)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">{t('financialHealth.columns.costPerHour', 'Coste/h')}</dt>
                  <dd className="font-mono tabular-nums">
                    {row.hoursDisplay > 0.001 ? formatPerHour(costPh, 2) : '–'}
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
      <div className="rounded-xl border border-slate-200 bg-slate-100/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">{t('financialHealth.expand.total')}</p>
          <span
            className={cn(
              'font-mono text-sm font-semibold tabular-nums inline-flex items-center gap-1',
              totSem.className,
            )}
          >
            {totSem.showAlert && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
            {formatMoney(totMargin)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
          {totH.toFixed(1)} h · {formatMoney(totRev)} · {formatMoney(totCost)}
        </p>
      </div>
    </div>
  );
}
