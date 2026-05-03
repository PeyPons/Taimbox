import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  estimated?: number;
  real?: number;
  computed?: number;
  /** Si false, solo 2 columnas (estimado + real); oculta computado aunque venga definido. */
  showComputed?: boolean;
  label?: string;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MetricsCard({ 
  estimated, 
  real, 
  computed, 
  showComputed = true,
  label,
  className,
  showLabels = true,
  size = 'md'
}: MetricsCardProps) {
  const sizeClasses = {
    sm: { text: 'text-sm', label: 'text-[10px]', gap: 'gap-1.5' },
    md: { text: 'text-lg', label: 'text-[10px]', gap: 'gap-2' },
    lg: { text: 'text-xl', label: 'text-xs', gap: 'gap-3' }
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn("grid gap-2 text-center", showComputed ? "grid-cols-3" : "grid-cols-2", className)}>
      {estimated !== undefined && (
        <div className={cn("space-y-0.5", classes.gap)}>
          <p className={cn("font-bold text-slate-700", classes.text)}>{estimated}h</p>
          {showLabels && <p className={cn("text-slate-400 uppercase", classes.label)}>Estimado</p>}
        </div>
      )}
      {real !== undefined && (
        <div className={cn("space-y-0.5", classes.gap)}>
          <p className={cn("font-bold text-blue-600", classes.text)}>{real}h</p>
          {showLabels && <p className={cn("text-blue-400 uppercase", classes.label)}>Real</p>}
        </div>
      )}
      {showComputed && computed !== undefined && (
        <div className={cn("space-y-0.5", classes.gap)}>
          <p className={cn("font-bold text-emerald-600", classes.text)}>{computed}h</p>
          {showLabels && <p className={cn("text-emerald-400 uppercase", classes.label)}>Computado</p>}
        </div>
      )}
      {label && (
        <div className="col-span-3 pt-2 border-t">
          <p className={cn("text-muted-foreground", classes.label)}>{label}</p>
        </div>
      )}
    </div>
  );
}
