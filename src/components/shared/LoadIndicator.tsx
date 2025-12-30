import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const calculatedPercentage = percentage ?? (capacity > 0 ? (hours / capacity) * 100 : 0);
  const isOverload = calculatedPercentage > 100;
  const isNearLimit = calculatedPercentage >= 80 && calculatedPercentage <= 100;
  
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
      container: 'w-20 h-14',
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

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-lg border",
      isOverload ? "bg-red-50 border-red-200 text-red-700" 
        : isNearLimit ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-emerald-50 border-emerald-200 text-emerald-700",
      classes.container,
      className
    )}>
      <span className={cn("font-bold leading-none", classes.hours)}>{hours}h</span>
      <span className={cn("opacity-70", classes.capacity)}>/ {capacity}h</span>
      {showPercentage && (
        <span className={cn("opacity-60 mt-0.5", classes.percentage)}>
          {calculatedPercentage.toFixed(0)}%
        </span>
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
              <p><span className="font-medium">Horas asignadas:</span> {hours}h</p>
              <p><span className="font-medium">Capacidad:</span> {capacity}h</p>
              <p><span className="font-medium">Ocupación:</span> {calculatedPercentage.toFixed(1)}%</p>
              {isOverload && (
                <p className="text-red-600 mt-1">⚠️ Sobrecarga</p>
              )}
              {isNearLimit && !isOverload && (
                <p className="text-amber-600 mt-1">Carga alta</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
