import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ProfitabilityMobileMetric = {
  label: string;
  value: ReactNode;
  /** Destaca la métrica (p. ej. margen) a ancho completo */
  emphasize?: boolean;
  className?: string;
};

type Props = {
  items: ProfitabilityMobileMetric[];
  className?: string;
  /** 2 columnas por defecto; 3 si caben métricas cortas */
  cols?: 2 | 3;
};

/**
 * Rejilla de métricas con etiqueta visible.
 * En móvil no basta con “números · números”: cada valor lleva su nombre.
 */
export function ProfitabilityMobileMetrics({ items, className, cols = 2 }: Props) {
  return (
    <dl
      className={cn(
        'mt-2 gap-x-3 gap-y-2 text-xs',
        cols === 3 ? 'grid grid-cols-3' : 'grid grid-cols-2',
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(item.emphasize && cols === 2 && 'col-span-2', item.emphasize && cols === 3 && 'col-span-3')}
        >
          <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400 leading-none">
            {item.label}
          </dt>
          <dd className={cn('mt-0.5 font-mono text-sm tabular-nums text-slate-800 leading-snug', item.className)}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
