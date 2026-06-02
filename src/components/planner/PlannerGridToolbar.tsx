import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

import { getMonthName } from '@/utils/dateUtils';
import { useDateLocale } from '@/hooks/useDateLocale';

import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';

import {

  CalendarDays,

  ChevronLeft,

  ChevronRight,

  ChevronsUpDown,

  User,

} from 'lucide-react';



interface PlannerGridToolbarProps {

  currentMonth: Date;

  year: number;

  onPrevMonth: () => void;

  onNextMonth: () => void;

  onToday: () => void;

  selectedEmployeeId: string;

  selectedProjectId: string;

  employees: { id: string; name: string }[];

  projects: { id: string; name: string; status?: string }[];

  sortedEmployees: { id: string; name: string }[];

  sortedProjects: { id: string; name: string; status?: string }[];

  onSelectEmployee: (id: string) => void;

  onSelectProject: (id: string) => void;

  showOnlyMe: boolean;

  onToggleShowOnlyMe: () => void;

  openEmployeeCombo: boolean;

  setOpenEmployeeCombo: (open: boolean) => void;

  openProjectCombo: boolean;

  setOpenProjectCombo: (open: boolean) => void;

  compact?: boolean;

}



function LoadLegend({ className }: { className?: string }) {
  const { t } = useTranslation('app');

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground', className)}>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
        {t('planner.toolbar.loadLegend.healthy', 'Equilibrada (2–5h libres)')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
        {t('planner.toolbar.loadLegend.warning', 'Cerca del límite')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
        {t('planner.toolbar.loadLegend.overload', 'Sobrecarga (>100%)')}
      </span>
    </div>
  );
}



export function PlannerGridToolbar({

  currentMonth,

  year,

  onPrevMonth,

  onNextMonth,

  onToday,

  selectedEmployeeId,

  selectedProjectId,

  employees,

  projects,

  sortedEmployees,

  sortedProjects,

  onSelectEmployee,

  onSelectProject,

  showOnlyMe,

  onToggleShowOnlyMe,

  openEmployeeCombo,

  setOpenEmployeeCombo,

  openProjectCombo,

  setOpenProjectCombo,

}: PlannerGridToolbarProps) {
  const { t } = useTranslation('app');
  const dateLocale = useDateLocale();

  return (

    <div className="border-b bg-card px-3 py-2 shrink-0 space-y-2">

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 justify-between">

        <div className="flex flex-wrap items-center gap-2 min-w-0">

          <h2 className="text-base font-bold capitalize text-foreground flex items-center gap-1.5 shrink-0">

            {getMonthName(currentMonth, dateLocale)}

            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">

              {year}

            </Badge>

          </h2>



          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 shrink-0">

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPrevMonth} aria-label={t('planner.toolbar.prevMonth', 'Mes anterior')}>

              <ChevronLeft className="h-4 w-4" />

            </Button>

            <Button variant="ghost" size="sm" onClick={onToday} className="h-7 text-xs px-2">

              <CalendarDays className="h-3.5 w-3.5 mr-1" />

              {t('planner.toolbar.today', 'Hoy')}

            </Button>

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNextMonth} aria-label={t('planner.toolbar.nextMonth', 'Mes siguiente')}>

              <ChevronRight className="h-4 w-4" />

            </Button>

          </div>

        </div>



        <div className="flex flex-wrap items-center gap-1.5">

          <Popover open={openEmployeeCombo} onOpenChange={setOpenEmployeeCombo}>

            <PopoverTrigger asChild>

              <Button variant="outline" className="h-8 w-[140px] sm:w-[160px] justify-between text-xs bg-white px-2">

                <span className="truncate">

                  {selectedEmployeeId === 'all'

                    ? t('planner.toolbar.all', 'Todos')

                    : (employees || []).find((e) => e.id === selectedEmployeeId)?.name}

                </span>

                <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50 shrink-0" />

              </Button>

            </PopoverTrigger>

            <PopoverContent className="w-[200px] p-0" align="end">

              <Command>

                <CommandInput placeholder={t('planner.toolbar.employeePlaceholder', 'Empleado...')} />

                <CommandList>

                  <CommandGroup>

                    <CommandItem

                      onSelect={() => {

                        onSelectEmployee('all');

                        setOpenEmployeeCombo(false);

                      }}

                    >

                      {t('planner.toolbar.all', 'Todos')}

                    </CommandItem>

                    {sortedEmployees.map((e) => (

                      <CommandItem

                        key={e.id}

                        onSelect={() => {

                          onSelectEmployee(e.id);

                          setOpenEmployeeCombo(false);

                        }}

                      >

                        {e.name}

                      </CommandItem>

                    ))}

                  </CommandGroup>

                </CommandList>

              </Command>

            </PopoverContent>

          </Popover>



          <Popover open={openProjectCombo} onOpenChange={setOpenProjectCombo}>

            <PopoverTrigger asChild>

              <Button variant="outline" className="h-8 w-[140px] sm:w-[160px] justify-between text-xs bg-white px-2">

                <span className="truncate">

                  {selectedProjectId === 'all'

                    ? t('planner.toolbar.all', 'Todos')

                    : (projects || []).find((p) => p.id === selectedProjectId)?.name}

                </span>

                <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50 shrink-0" />

              </Button>

            </PopoverTrigger>

            <PopoverContent className="w-[240px] p-0" align="end">

              <Command>

                <CommandInput placeholder={t('planner.toolbar.projectPlaceholder', 'Proyecto...')} />

                <CommandList>

                  <CommandGroup>

                    <CommandItem

                      onSelect={() => {

                        onSelectProject('all');

                        setOpenProjectCombo(false);

                      }}

                    >

                      {t('planner.toolbar.all', 'Todos')}

                    </CommandItem>

                    {sortedProjects

                      .filter((p) => p.status === 'active')

                      .map((p) => (

                        <CommandItem

                          key={p.id}

                          onSelect={() => {

                            onSelectProject(p.id);

                            setOpenProjectCombo(false);

                          }}

                        >

                          {p.name}

                        </CommandItem>

                      ))}

                  </CommandGroup>

                </CommandList>

              </Command>

            </PopoverContent>

          </Popover>



          <Button

            variant={showOnlyMe ? 'secondary' : 'outline'}

            size="sm"

            onClick={onToggleShowOnlyMe}

            className={cn('h-8 text-xs gap-1.5 px-2.5', showOnlyMe && 'bg-indigo-100 text-indigo-700')}

          >

            <User className="h-3.5 w-3.5" />

            {t('planner.toolbar.onlyMe', 'Solo yo')}

          </Button>

        </div>

      </div>



      <LoadLegend className="hidden sm:flex" />

    </div>

  );

}

