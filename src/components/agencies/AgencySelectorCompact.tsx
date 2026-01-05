import { useState } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { usePermissions } from '@/hooks/usePermissions';
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
import { Building2, ChevronDown, Plus, Settings, Check, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AgencySelectorCompact() {
  const { currentAgency, availableAgencies, switchAgency, isLoading, refreshAgency } = useAgency();
  const { hasPermission } = usePermissions();
  const [isSwitching, setIsSwitching] = useState(false);
  const navigate = useNavigate();

  // Mostrar solo si hay múltiples agencias o es admin
  const shouldShow = (availableAgencies?.length || 0) > 1 || hasPermission('can_access_agency_settings');

  const handleSwitchAgency = async (agencyId: string) => {
    if (agencyId === currentAgency?.id) return;

    setIsSwitching(true);
    try {
      await switchAgency(agencyId);
      // Refrescar agencia para obtener datos actualizados
      await refreshAgency();
      toast.success('Agencia cambiada correctamente');
      // Pequeño delay para que el contexto se actualice antes de recargar datos
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('agency-changed'));
      }, 100);
    } catch (error) {
      console.error('Error cambiando agencia:', error);
      toast.error('Error al cambiar de agencia');
    } finally {
      setIsSwitching(false);
    }
  };

  // No mostrar si no cumple las condiciones
  if (!shouldShow || isLoading || !currentAgency) {
    return null;
  }

  const hasMultipleAgencies = (availableAgencies?.length || 0) > 1;
  const canManageAgency = hasPermission('can_access_agency_settings');

  return (
    <TooltipProvider>
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-left h-auto py-1.5 px-2 hover:bg-slate-800 text-slate-300 text-xs"
                  disabled={isSwitching}
                  onClick={(e) => {
                    // Si solo hay una agencia y tiene permisos, hacer click directo navega a gestión
                    if (!hasMultipleAgencies && canManageAgency) {
                      e.preventDefault();
                      navigate('/agency');
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate text-xs font-medium">{currentAgency.name}</span>
                    {hasMultipleAgencies && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/20 text-[10px] text-primary font-semibold">
                        {availableAgencies.length}
                      </span>
                    )}
                    {!hasMultipleAgencies && canManageAgency && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/20 text-[10px] text-primary font-semibold">
                        Admin
                      </span>
                    )}
                  </div>
                  {hasMultipleAgencies && (
                    <ChevronDown className="h-3 w-3 shrink-0 text-slate-400 ml-1" />
                  )}
                  {!hasMultipleAgencies && canManageAgency && (
                    <Settings className="h-3 w-3 shrink-0 text-slate-400 ml-1" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700">
              <p className="text-xs">{currentAgency.name}</p>
              {hasMultipleAgencies && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {availableAgencies.length} agencias disponibles
                </p>
              )}
              {!hasMultipleAgencies && canManageAgency && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Haz clic para gestionar la agencia
                </p>
              )}
            </TooltipContent>
          </Tooltip>

          {hasMultipleAgencies && (
            <DropdownMenuContent align="start" className="w-64 bg-slate-800 border-slate-700">
              <DropdownMenuLabel className="text-slate-300 text-xs">Mis Agencias</DropdownMenuLabel>
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

              <DropdownMenuSeparator className="bg-slate-700" />
              
              {canManageAgency && (
                <DropdownMenuItem
                  onClick={() => navigate('/team')}
                  className="cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
                >
                  <Users className="h-3.5 w-3.5 mr-2" />
                  Gestionar miembros
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem
                onClick={() => navigate('/agency')}
                className="cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                <Settings className="h-3.5 w-3.5 mr-2" />
                Configuración
              </DropdownMenuItem>
              
              {canManageAgency && (
                <DropdownMenuItem
                  onClick={() => navigate('/agencies?action=create')}
                  className="cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Crear nueva agencia
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          )}
          
          {/* Si solo hay una agencia pero tiene permisos, mostrar opción de gestión al hacer click */}
          {!hasMultipleAgencies && canManageAgency && (
            <DropdownMenuContent align="start" className="w-64 bg-slate-800 border-slate-700">
              <DropdownMenuLabel className="text-slate-300 text-xs">{currentAgency.name}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              
              <DropdownMenuItem
                onClick={() => navigate('/team')}
                className="cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                <Users className="h-3.5 w-3.5 mr-2" />
                Gestionar miembros
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => navigate('/agency')}
                className="cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                <Settings className="h-3.5 w-3.5 mr-2" />
                Configuración
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-slate-700" />
              
              <DropdownMenuItem
                onClick={() => navigate('/agencies?action=create')}
                className="cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Crear nueva agencia
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}

