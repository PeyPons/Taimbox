import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

/** Límites y condicionantes colapsables para no tapar la lista del equipo. */
export function SuggestionTeamRulesCollapsible({
  open,
  onOpenChange,
  hasRestrictiveFilters,
  onResetFilters,
  children,
  unboundedContent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasRestrictiveFilters?: boolean;
  onResetFilters?: () => void;
  children: ReactNode;
  /** Sin scroll interno: el contenido crece y el scroll queda en la columna principal. */
  unboundedContent?: boolean;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="shrink-0">
      <div className="flex items-center gap-2 mb-1">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex flex-1 items-center gap-2 min-w-0 text-left font-medium rounded-lg transition-colors',
              'text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 py-2 px-3 border border-slate-200 bg-slate-50/80'
            )}
          >
            {open ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
            )}
            <span className="flex-1 truncate">Límites y condicionantes</span>
            {hasRestrictiveFilters && (
              <Badge variant="outline" className="text-[10px] shrink-0 border-amber-200 text-amber-800">
                Activos
              </Badge>
            )}
          </button>
        </CollapsibleTrigger>
        {onResetFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 h-9 text-xs text-slate-500"
            onClick={onResetFilters}
            title="Restaurar valores por defecto"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Restaurar
          </Button>
        )}
      </div>
      <CollapsibleContent>
        <div
          className={cn(
            'pr-1 space-y-3 pb-1',
            !unboundedContent && 'max-h-[min(28vh,240px)] overflow-y-auto overscroll-contain'
          )}
        >
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
