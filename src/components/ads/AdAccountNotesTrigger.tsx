import type { MouseEvent, PointerEvent } from 'react';
import { StickyNote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AdAccountNotesPanel } from '@/components/ads/AdAccountNotesPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdAccountNoteCounts } from '@/hooks/useAdAccountNotes';
import type { AdAccountPlatform } from '@/services/adAccountNotesService';
import { cn } from '@/lib/utils';

interface AdAccountNotesTriggerProps {
  platform: AdAccountPlatform;
  accountId: string;
  anonymized?: boolean;
  className?: string;
}

export function AdAccountNotesTrigger({
  platform,
  accountId,
  anonymized = false,
  className,
}: AdAccountNotesTriggerProps) {
  const { t } = useTranslation('app');
  const isMobile = useIsMobile();
  const { data: counts } = useAdAccountNoteCounts(platform);
  const noteCount = counts?.[accountId] ?? 0;
  const hasNotes = noteCount > 0;
  const label = hasNotes
    ? t('adAccountNotes.open', 'Ver notas')
    : t('adAccountNotes.addQuick', 'Añadir nota');
  const countLabel =
    noteCount === 1
      ? t('adAccountNotes.countOne', '1 nota')
      : t('adAccountNotes.countMany', {
          count: noteCount > 9 ? '9+' : noteCount,
          defaultValue: '{{count}} notas',
        });

  const stopBubble = {
    onPointerDown: (e: PointerEvent) => e.stopPropagation(),
    onClick: (e: MouseEvent) => e.stopPropagation(),
  };

  const trigger = (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800',
        className,
      )}
      aria-label={hasNotes ? `${label}: ${countLabel}` : label}
      {...stopBubble}
    >
      <StickyNote className="h-4 w-4" />
      {hasNotes && (
        <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-slate-900 px-0.5 text-[9px] font-medium leading-none text-white">
          {noteCount > 9 ? '9+' : noteCount}
        </span>
      )}
    </div>
  );

  const panel = (
    <AdAccountNotesPanel platform={platform} accountId={accountId} anonymized={anonymized} compact={!isMobile} />
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="h-[min(85vh,560px)] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="text-left pb-2">
            <SheetTitle>{t('adAccountNotes.title', 'Notas de la cuenta')}</SheetTitle>
          </SheetHeader>
          <AdAccountNotesPanel platform={platform} accountId={accountId} anonymized={anonymized} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover modal>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="top" className="text-xs z-[10001]">
          <p>{hasNotes ? countLabel : label}</p>
          <p className="text-slate-400 font-normal">
            {hasNotes
              ? t('adAccountNotes.clickToView', 'Clic para ver')
              : t('adAccountNotes.clickToAdd', 'Clic para añadir')}
          </p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        className="w-[min(92vw,400px)] p-4 z-[10000]"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}
