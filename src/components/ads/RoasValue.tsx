import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getRoasColorClass, presentRoas } from '@/utils/adsPerformance';

type RoasValueProps = {
  isSales: boolean;
  cost: number;
  conversionValue: number;
  className?: string;
};

export function RoasValue({ isSales, cost, conversionValue, className }: RoasValueProps) {
  const { t } = useTranslation('app');
  const presentation = presentRoas({ isSales, cost, conversionValue });

  if (presentation.kind === 'hidden') return null;

  if (presentation.kind === 'empty') {
    return (
      <span
        className={cn('text-[11px] text-slate-400 tabular-nums', className)}
        title={t('ads.roas.emptyHint', 'Sin valor de conversión este mes. El ROAS no aplica.')}
      >
        —
      </span>
    );
  }

  return (
    <Badge variant="outline" className={cn('text-[10px] tabular-nums', getRoasColorClass(presentation.roas), className)}>
      {presentation.roas.toFixed(2)}
    </Badge>
  );
}
