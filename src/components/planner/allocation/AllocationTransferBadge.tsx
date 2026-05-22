import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const TRANSFER_BADGE_CLASS =
  'h-5 px-1.5 text-[9px] bg-orange-50 text-orange-800 border-orange-200 shrink-0';

interface AllocationTransferBadgeProps {
  label?: string;
  tooltip?: string;
  className?: string;
  compact?: boolean;
}

export function AllocationTransferBadge({
  label = 'Transferida',
  tooltip,
  className,
  compact = false,
}: AllocationTransferBadgeProps) {
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        TRANSFER_BADGE_CLASS,
        compact && 'h-4 px-1.5 text-[8px]',
        tooltip && 'cursor-help',
        className
      )}
    >
      {label}
    </Badge>
  );

  if (!tooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs z-[9999] whitespace-pre-line text-xs" side="top">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
