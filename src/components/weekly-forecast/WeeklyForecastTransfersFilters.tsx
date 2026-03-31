import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Client, Employee, Project } from '@/types';

interface WeeklyForecastTransfersFiltersProps {
  filterTransferStatus: 'all' | 'pending' | 'kept' | 'distributed';
  onFilterTransferStatusChange: (status: 'all' | 'pending' | 'kept' | 'distributed') => void;
  selectedDepartmentId: string | null;
  filterFeedbackEmployee: string;
  onFilterFeedbackEmployeeChange: (employeeId: string) => void;
  filterFeedbackProject: string;
  onFilterFeedbackProjectChange: (projectId: string) => void;
  employees: Employee[];
  employeesForView: Employee[];
  projects: Project[];
  filteredProjectsForView: Project[];
  clients: Client[];
  formatProjectName: (name: string) => string;
}

export function WeeklyForecastTransfersFilters({
  filterTransferStatus,
  onFilterTransferStatusChange,
  selectedDepartmentId,
  filterFeedbackEmployee,
  onFilterFeedbackEmployeeChange,
  filterFeedbackProject,
  onFilterFeedbackProjectChange,
  employees,
  employeesForView,
  projects,
  filteredProjectsForView,
  clients,
  formatProjectName,
}: WeeklyForecastTransfersFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border shadow-sm p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 font-medium">Estado:</span>
        <Button variant={filterTransferStatus === 'all' ? 'default' : 'outline'} size="sm" className="h-7 text-xs px-2" onClick={() => onFilterTransferStatusChange('all')}>
          Todas
        </Button>
        <Button variant={filterTransferStatus === 'pending' ? 'default' : 'outline'} size="sm" className="h-7 text-xs px-2" onClick={() => onFilterTransferStatusChange('pending')}>
          Pendientes
        </Button>
        <Button variant={filterTransferStatus === 'kept' ? 'default' : 'outline'} size="sm" className="h-7 text-xs px-2" onClick={() => onFilterTransferStatusChange('kept')}>
          Mantenidas
        </Button>
        <Button variant={filterTransferStatus === 'distributed' ? 'default' : 'outline'} size="sm" className="h-7 text-xs px-2" onClick={() => onFilterTransferStatusChange('distributed')}>
          Redistribuidas
        </Button>
      </div>

      <div className="w-full border-t my-2"></div>

      <div className="flex-1 min-w-0 sm:min-w-[200px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full h-8 text-xs justify-between bg-white">
              <span className="truncate">
                {filterFeedbackEmployee === 'all'
                  ? (selectedDepartmentId ? 'Todo el departamento' : 'Todos los compañeros')
                  : (employees.find(e => e.id === filterFeedbackEmployee)?.name || 'Compañero')}
              </span>
              <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] max-w-[calc(100vw-2rem)] p-0">
            <Command>
              <CommandInput placeholder="Buscar compañero..." />
              <CommandList>
                <CommandEmpty>No hay compañeros</CommandEmpty>
                <CommandGroup>
                  <CommandItem onSelect={() => onFilterFeedbackEmployeeChange('all')}>
                    <Check className={cn("mr-2 h-4 w-4", filterFeedbackEmployee === 'all' ? "opacity-100" : "opacity-0")} />
                    Todos los compañeros
                  </CommandItem>
                  {employeesForView
                    .filter(e => e.isActive)
                    .map(emp => (
                      <CommandItem key={emp.id} value={emp.name} onSelect={() => onFilterFeedbackEmployeeChange(emp.id)}>
                        <Check className={cn("mr-2 h-4 w-4", filterFeedbackEmployee === emp.id ? "opacity-100" : "opacity-0")} />
                        {emp.name}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 min-w-0 sm:min-w-[200px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full h-8 text-xs justify-between bg-white">
              <span className="truncate">
                {filterFeedbackProject === 'all'
                  ? 'Todos los proyectos'
                  : formatProjectName(projects.find(p => p.id === filterFeedbackProject)?.name || '')}
              </span>
              <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] max-w-[calc(100vw-2rem)] p-0">
            <Command>
              <CommandInput placeholder="Buscar proyecto..." />
              <CommandList>
                <CommandEmpty>No hay proyectos</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="all" onSelect={() => onFilterFeedbackProjectChange('all')}>
                    <Check className={cn("mr-2 h-4 w-4", filterFeedbackProject === 'all' ? "opacity-100" : "opacity-0")} />
                    {selectedDepartmentId ? 'Todos (dep.)' : 'Todos los proyectos'}
                  </CommandItem>
                  {(selectedDepartmentId ? filteredProjectsForView : projects)
                    .filter(p => p.status === 'active' && !p.isHidden)
                    .map(proj => {
                      const client = clients.find(c => c.id === proj.clientId);
                      return (
                        <CommandItem
                          key={proj.id}
                          value={`${client?.name || ''} ${proj.name}`}
                          onSelect={() => onFilterFeedbackProjectChange(proj.id)}
                        >
                          <Check className={cn("mr-2 h-4 w-4", filterFeedbackProject === proj.id ? "opacity-100" : "opacity-0")} />
                          <span className="truncate">{client?.name} - {formatProjectName(proj.name)}</span>
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

