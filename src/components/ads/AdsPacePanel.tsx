import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { AdsPaceStatus } from '@/components/ads/AdsAccountRow';

interface AdsPaceMetric {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'warn';
}

interface AdsPacePanelProps {
  title: string;
  editor: ReactNode;
  note?: ReactNode;
  progress?: { percent: number; status: AdsPaceStatus; available: string; danger: boolean } | null;
  metrics?: AdsPaceMetric[];
  warning?: string | null;
  forecast?: { label: string; value: string; danger: boolean } | null;
}

function barClass(status: AdsPaceStatus): string {
  if (status === 'over') return 'bg-red-500';
  if (status === 'risk') return 'bg-amber-500';
  return 'bg-slate-900';
}

export function AdsPacePanel({
  title,
  editor,
  note,
  progress,
  metrics = [],
  warning,
  forecast,
}: AdsPacePanelProps) {
  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-[13px] font-medium text-slate-900">{title}</h3>
        <div className="mt-3">{editor}</div>
        {note && <div className="mt-2 text-[12px] leading-relaxed text-slate-500">{note}</div>}
      </div>

      {progress && (
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12px] text-slate-500">
            <span className="tabular-nums">{progress.percent.toFixed(0)}%</span>
            <span className={cn('tabular-nums', progress.danger && 'font-medium text-red-600')}>{progress.available}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={cn('h-full rounded-full', barClass(progress.status))}
              style={{ width: `${Math.min(Math.max(progress.percent, 0), 100)}%` }}
            />
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <dl className="grid overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="border-b border-slate-200 px-3 py-2.5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <dt className="text-[11px] leading-4 text-slate-500">{metric.label}</dt>
              <dd className={cn('mt-1 text-sm font-semibold tabular-nums tracking-tight', metric.tone === 'warn' ? 'text-amber-700' : 'text-slate-900')}>
                {metric.value}
              </dd>
              {metric.hint && <p className="mt-1 text-[11px] leading-4 text-slate-400">{metric.hint}</p>}
            </div>
          ))}
        </dl>
      )}

      {warning && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-950">
          {warning}
        </p>
      )}

      {forecast && (
        <div className="flex items-baseline justify-between gap-3 border-t border-slate-200 pt-3">
          <span className="text-[12px] text-slate-500">{forecast.label}</span>
          <span className={cn('text-sm font-semibold tabular-nums', forecast.danger ? 'text-red-600' : 'text-slate-900')}>
            {forecast.value}
          </span>
        </div>
      )}
    </section>
  );
}
