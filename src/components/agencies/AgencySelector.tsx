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
import { Building2, ChevronDown, Plus, Settings, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/notify';
import { cn } from '@/lib/utils';

export function AgencySelector() {
  const { currentAgency, userAgencies, switchAgency, isLoading } = useAgency();
  const [isSwitching, setIsSwitching] = useState(false);
  const navigate = useNavigate();

  const handleSwitchAgency = async (agencyId: string) => {
    if (agencyId === currentAgency?.id) return;

    setIsSwitching(true);
    try {
      await switchAgency(agencyId);
      toast.success('Agencia cambiada correctamente');
      // Disparar evento para que AppContext recargue datos
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

  if (isLoading || !currentAgency) {
    return (
      <div className="px-4 py-2 text-sm text-slate-400">
        <Building2 className="h-4 w-4 inline mr-2" />
        Cargando...
      </div>
    );
  }

  return (
    <div className="px-4 mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between text-left h-auto py-2 px-3 hover:bg-slate-800 text-slate-200"
            disabled={isSwitching}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate font-medium">{currentAgency.name}</span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 bg-slate-800 border-slate-700">
          <DropdownMenuLabel className="text-slate-300">Mis Agencias</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />
          
          {userAgencies.length === 0 ? (
            <div className="px-2 py-4 text-sm text-slate-400 text-center">
              No tienes agencias
            </div>
          ) : (
            userAgencies.map((userAgency) => (
              <DropdownMenuItem
                key={userAgency.agency.id}
                onClick={() => handleSwitchAgency(userAgency.agency.id)}
                className={cn(
                  "cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white",
                  currentAgency.id === userAgency.agency.id && "bg-slate-700"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{userAgency.agency.name}</div>
                      {userAgency.role && (
                        <div className="text-xs text-slate-400 truncate">{userAgency.role}</div>
                      )}
                    </div>
                  </div>
                  {currentAgency.id === userAgency.agency.id && (
                    <Check className="h-4 w-4 shrink-0 text-primary ml-2" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator className="bg-slate-700" />
          
          <DropdownMenuItem
            onClick={() => navigate('/agencies')}
            className="cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Gestionar agencias
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => navigate('/agencies?action=create')}
            className="cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear nueva agencia
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

