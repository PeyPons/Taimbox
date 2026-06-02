import { useState } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { toast } from '@/lib/notify';
import { cn } from '@/lib/utils';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface AgencySelectorCompactProps {
  /** Integrado en una línea de contexto (sin borde, trigger compacto) */
  inline?: boolean;
}

export function AgencySelectorCompact(props: AgencySelectorCompactProps = {}) {
  const { inline = false } = props;
  const { currentAgency, availableAgencies, switchAgency, isLoading, refreshAgency } = useAgency();
  const { t } = useAppTranslation();
  const [isSwitching, setIsSwitching] = useState(false);
  const hasMultipleAgencies = (availableAgencies?.length || 0) > 1;

  const handleSwitchAgency = async (agencyId: string) => {
    if (agencyId === currentAgency?.id) return;

    setIsSwitching(true);
    try {
      await switchAgency(agencyId);
      await refreshAgency();
      toast.success(t('agencies.toast.switchSuccess'));
    } catch (error) {
      console.error('Error cambiando agencia:', error);
      toast.error(t('agencies.toast.switchError'));
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading || !currentAgency) return null;
  if (!hasMultipleAgencies && !inline) return null;
  if (!hasMultipleAgencies && inline) return null; // inline solo para multi-agencia

  const trigger = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-auto hover:bg-slate-800 text-slate-300 text-[11px]",
        inline
          ? "py-0.5 px-1 min-w-0 font-medium text-slate-200 hover:text-white"
          : "w-full justify-between text-left py-1 px-2"
      )}
      disabled={isSwitching}
    >
      {inline ? (
        <>
          <span className="truncate max-w-[80px]">{currentAgency.name}</span>
          <span className="ml-0.5 px-1 py-0.5 rounded bg-primary/20 text-[9px] text-primary font-semibold shrink-0">
            {availableAgencies.length}
          </span>
          <ChevronDown className="h-2.5 w-2.5 shrink-0 text-slate-400 ml-0.5" />
        </>
      ) : (
        <>
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="truncate font-medium">{currentAgency.name}</span>
            <span className="ml-1 px-1 py-0.5 rounded bg-primary/20 text-[9px] text-primary font-semibold">
              {availableAgencies.length}
            </span>
          </div>
          <ChevronDown className="h-2.5 w-2.5 shrink-0 text-slate-400 ml-0.5" />
        </>
      )}
    </Button>
  );

  return (
    <TooltipProvider>
      {inline ? (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700">
              <p className="text-xs">{currentAgency.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{availableAgencies.length} agencias</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-64 bg-slate-800 border-slate-700">
            <DropdownMenuLabel className="text-slate-300 text-xs">Cambiar de agencia</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            {availableAgencies.map((agency) => (
              <DropdownMenuItem
                key={agency.agencyId}
                onClick={() => handleSwitchAgency(agency.agencyId)}
                className={cn(
                  "cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs",
                  currentAgency.id === agency.agencyId && "bg-slate-700"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-xs">{agency.agencyName}</div>
                    </div>
                  </div>
                  {currentAgency.id === agency.agencyId && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary ml-2" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="pt-1.5 border-t border-slate-800">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700">
                <p className="text-xs">{currentAgency.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{availableAgencies.length} agencias disponibles</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-64 bg-slate-800 border-slate-700">
            <DropdownMenuLabel className="text-slate-300 text-xs">Cambiar de agencia</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />

            {availableAgencies.map((agency) => (
              <DropdownMenuItem
                key={agency.agencyId}
                onClick={() => handleSwitchAgency(agency.agencyId)}
                className={cn(
                  "cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs",
                  currentAgency.id === agency.agencyId && "bg-slate-700"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-xs">{agency.agencyName}</div>
                    </div>
                  </div>
                  {currentAgency.id === agency.agencyId && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary ml-2" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      )}
    </TooltipProvider>
  );
}

export default AgencySelectorCompact;
