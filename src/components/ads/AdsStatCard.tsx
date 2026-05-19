import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const colorClasses = {
  slate: 'bg-slate-50 border-slate-200',
  blue: 'bg-blue-50 border-blue-200',
  emerald: 'bg-emerald-50 border-emerald-200',
  amber: 'bg-amber-50 border-amber-200',
  red: 'bg-red-50 border-red-200',
} as const;

export type AdsStatCardColor = keyof typeof colorClasses;

export interface AdsStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  color?: AdsStatCardColor;
  className?: string;
}

export const AdsStatCard = memo(function AdsStatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'slate',
  className,
}: AdsStatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 sm:p-4 min-w-0 h-full flex flex-col overflow-hidden',
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-slate-500 mb-1.5 min-w-0">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide truncate">{label}</span>
      </div>
      <p
        className="text-base sm:text-lg xl:text-2xl font-bold text-slate-900 tabular-nums leading-tight min-w-0 [overflow-wrap:anywhere] sm:truncate"
        title={value}
      >
        {value}
      </p>
      {subValue ? (
        <p
          className="text-[10px] sm:text-xs text-slate-500 mt-auto pt-1 leading-snug line-clamp-2 min-w-0 [overflow-wrap:anywhere]"
          title={subValue}
        >
          {subValue}
        </p>
      ) : null}
    </div>
  );
});
