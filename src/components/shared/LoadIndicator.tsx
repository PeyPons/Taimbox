import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface LoadIndicatorProps {
  hours: number;
  capacity: number;
  percentage?: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showTooltip?: boolean;
  className?: string;
  variant?: 'compact' | 'detailed' | 'minimal';
}

export function LoadIndicator({
  hours,
  capacity,
  percentage,
  size = 'md',
  showPercentage = true,
  showTooltip = false,
  className,
  variant = 'compact'
}: LoadIndicatorProps) {
  const { t } = useTranslation('app');
  const calculatedPercentage = percentage ?? (capacity > 0 ? (hours / capacity) * 100 : 0);
  const hoursRemaining = capacity - hours;
  const isOverload = hours > capacity; // Rojo: se pasa del límite
  const isHealthy = hoursRemaining >= 2 && hoursRemaining <= 5; // Verde: tiene entre 2-5 horas libres
  const isNearLimit = !isOverload && !isHealthy; // Amarillo: cerca del límite

  const sizeClasses = {
    sm: {
      hours: 'text-xs',
      capacity: 'text-[10px]',
      percentage: 'text-[10px]',
      container: 'w-16 h-10',
      gap: 'gap-0.5'
    },
    md: {
      hours: 'text-base',
      capacity: 'text-[10px]',
      percentage: 'text-xs',
      container: 'w-24 h-16', // Expanded default width/height
      gap: 'gap-1'
    },
    lg: {
      hours: 'text-lg',
      capacity: 'text-xs',
      percentage: 'text-sm',
      container: 'w-24 h-16',
      gap: 'gap-1.5'
    }
  };

  const classes = sizeClasses[size];

  // If a custom className provides width/height, we should respect it over defaults
  const containerClasses = cn(
    "flex flex-col items-center justify-center rounded-lg border px-1",
    isOverload ? "bg-red-50 border-red-200 text-red-700"
      : isHealthy ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : isNearLimit ? "bg-amber-50 border-amber-200 text-amber-700"
          : "bg-slate-50 border-slate-200 text-slate-400",
    classes.container,
    className
  );
  const content = (
    <div className={containerClasses}>
      <div className="flex items-baseline gap-0.5">
        <span className={cn("font-bold leading-none", classes.hours)}>{hours}h</span>
        <span className={cn("opacity-70 font-medium", classes.capacity)}>/ {capacity}h</span>
      </div>
      {showPercentage && (
        <Badge variant="outline" className={cn(
          "mt-1 px-1.5 py-0 h-4 min-w-[32px] justify-center bg-white/50 border-0 shadow-sm",
          classes.percentage
        )}>
          {calculatedPercentage.toFixed(0)}%
        </Badge>
      )}
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p><span className="font-medium">{t('planner.loadIndicator.assignedHours')}</span> {hours}h</p>
              <p><span className="font-medium">{t('planner.loadIndicator.capacity')}</span> {capacity}h</p>
              <p><span className="font-medium">{t('planner.loadIndicator.occupancy')}</span> {calculatedPercentage.toFixed(1)}%</p>
              {isOverload && (
                <p className="text-red-600 mt-1">⚠️ {t('planner.loadIndicator.overload')}</p>
              )}
              {isNearLimit && !isOverload && (
                <p className="text-amber-600 mt-1">{t('planner.loadIndicator.highLoad')}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
