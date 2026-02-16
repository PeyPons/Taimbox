import { useState, useEffect } from 'react';
import { EmployeeRow } from './EmployeeRow';
import { AllocationSheet } from './AllocationSheet';
import { MobilePlannerView } from './MobilePlannerView';
import { GanttView } from './GanttView';
import { useIsMobile } from '@/hooks/use-mobile';
import { PendingTransfersPanel } from '@/components/transfers/TaskTransferComponents';
import { usePlannerData } from '@/hooks/usePlannerData';
import { getMonthName, isCurrentWeek, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, User, Loader2, ChevronsUpDown, LayoutGrid, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, parseISO, isSameMonth, max, min, format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
export function PlannerGrid() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showOnlyMe, setShowOnlyMe] = useState(() => localStorage.getItem('planner_only_me') === 'true');
  const [openEmployeeCombo, setOpenEmployeeCombo] = useState(false);
  const [openProjectCombo, setOpenProjectCombo] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; weekStart: Date; autoAdd?: boolean } | null>(null);
  const [activeView, setActiveView] = useState<'grid' | 'gantt'>('grid');
  const isMobile = useIsMobile();

  const {
    currentMonth,
    setCurrentMonth,
    weeks,
    year,
    month,
    isLoadingMonth,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    filteredEmployees,
    sortedProjects,
    sortedEmployees,
    monthAllocations,
    employees,
    projects,
    allocations,
    absences,
    teamEvents,
    currentUser,
    getEmployeeMonthlyLoad
  } = usePlannerData({ showOnlyMe, selectedEmployeeId, selectedProjectId });

  useEffect(() => { localStorage.setItem('planner_only_me', String(showOnlyMe)); }, [showOnlyMe]);

  const handleCellClick = (employeeId: string, weekStart: Date, autoAdd?: boolean) => setSelectedCell({ employeeId, weekStart, autoAdd });

  const gridTemplate = `250px repeat(${weeks.length}, minmax(0, 1fr)) 100px`;

  if (isLoadingMonth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-slate-500 dark:text-slate-400">Cargando {getMonthName(currentMonth)}...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 rounded-lg border shadow-sm overflow-hidden">
      {/* Tabs navigation */}
      <div className="flex items-center border-b px-4 py-2 bg-slate-50">
        <div className="flex items-center border rounded-lg p-0.5 bg-white">
          <Button
            variant={activeView === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('grid')}
            className="h-7 text-xs gap-1.5 rounded-md"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Vista Semanal
          </Button>
          <Button
            variant={activeView === 'gantt' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('gantt')}
            className="h-7 text-xs gap-1.5 rounded-md"
          >
            <Calendar className="h-3.5 w-3.5" />
            Timeline
          </Button>
        </div>
      </div>

      {activeView === 'gantt' ? (
        <GanttView initialViewDate={currentMonth} />
      ) : isMobile ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header móvil: mes y navegación */}
          <div className="flex flex-col gap-3 border-b bg-card px-3 py-3 z-20">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold capitalize text-foreground">
                {getMonthName(currentMonth)} <span className="text-slate-500 font-normal">{year}</span>
              </h2>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
                <Button variant="ghost" size="icon" className="h-11 w-11 min-h-[44px]" onClick={goToPrevMonth} aria-label="Mes anterior"><ChevronLeft className="h-5 w-5" /></Button>
                <Button variant="ghost" size="sm" onClick={goToToday} className="h-11 text-sm px-3 min-h-[44px]"><CalendarDays className="h-4 w-4 mr-1" />Hoy</Button>
                <Button variant="ghost" size="icon" className="h-11 w-11 min-h-[44px]" onClick={goToNextMonth} aria-label="Mes siguiente"><ChevronRight className="h-5 w-5" /></Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Popover open={openEmployeeCombo} onOpenChange={setOpenEmployeeCombo}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-11 flex-1 min-w-0 justify-between text-sm bg-white min-h-[44px]">
                    <span className="truncate">{selectedEmployeeId === 'all' ? 'Todos' : (employees || []).find(e => e.id === selectedEmployeeId)?.name}</span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] max-w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Empleado..." />
                    <CommandList>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setSelectedEmployeeId('all'); setOpenEmployeeCombo(false); }}>Todos</CommandItem>
                        {sortedEmployees.map(e => <CommandItem key={e.id} onSelect={() => { setSelectedEmployeeId(e.id); setOpenEmployeeCombo(false); }}>{e.name}</CommandItem>)}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button variant={showOnlyMe ? 'secondary' : 'outline'} size="sm" onClick={() => setShowOnlyMe(!showOnlyMe)} className={cn('h-11 text-sm gap-2 min-h-[44px]', showOnlyMe && 'bg-indigo-100 text-indigo-700')}><User className="h-3.5 w-3.5" /> Solo yo</Button>
            </div>
          </div>
          <div className="px-2 py-1">
            <PendingTransfersPanel />
          </div>
          <div className="flex-1 overflow-auto">
            <MobilePlannerView
              filteredEmployees={filteredEmployees}
              weeks={weeks}
              allocations={allocations || []}
              viewDate={currentMonth}
              getEmployeeMonthlyLoad={getEmployeeMonthlyLoad}
              onOpenSheet={handleCellClick}
            />
          </div>
          {selectedCell && (
            <AllocationSheet
              open={!!selectedCell}
              onOpenChange={(open) => !open && setSelectedCell(null)}
              employeeId={selectedCell.employeeId}
              weekStart={selectedCell.weekStart.toISOString()}
              viewDateContext={currentMonth}
              initialAutoAdd={selectedCell.autoAdd}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header & Filters */}
          <div className="flex flex-col gap-4 border-b bg-card px-4 py-3 z-20 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold capitalize text-foreground flex items-center gap-2">
                  {getMonthName(currentMonth)} <Badge variant="outline" className="text-xs font-normal hidden sm:flex">{year}</Badge>
                </h2>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={goToToday} className="h-7 text-xs px-2"><CalendarDays className="h-3.5 w-3.5 mr-1.5" />Mes</Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Popover open={openEmployeeCombo} onOpenChange={setOpenEmployeeCombo}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="h-8 w-[200px] justify-between text-xs bg-white">
                      <span className="truncate">{selectedEmployeeId === 'all' ? "Todos" : (employees || []).find(e => e.id === selectedEmployeeId)?.name}</span>
                      <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Empleado..." />
                      <CommandList>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setSelectedEmployeeId('all'); setOpenEmployeeCombo(false) }}>Todos</CommandItem>
                          {sortedEmployees.map(e => <CommandItem key={e.id} onSelect={() => { setSelectedEmployeeId(e.id); setOpenEmployeeCombo(false) }}>{e.name}</CommandItem>)}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Popover open={openProjectCombo} onOpenChange={setOpenProjectCombo}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="h-8 w-[200px] justify-between text-xs bg-white">
                      <span className="truncate">{selectedProjectId === 'all' ? "Todos" : (projects || []).find(p => p.id === selectedProjectId)?.name}</span>
                      <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0">
                    <Command>
                      <CommandInput placeholder="Proyecto..." />
                      <CommandList>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setSelectedProjectId('all'); setOpenProjectCombo(false) }}>Todos</CommandItem>
                          {sortedProjects.filter(p => p.status === 'active').map(p => <CommandItem key={p.id} onSelect={() => { setSelectedProjectId(p.id); setOpenProjectCombo(false) }}>{p.name}</CommandItem>)}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button variant={showOnlyMe ? "secondary" : "outline"} size="sm" onClick={() => setShowOnlyMe(!showOnlyMe)} className={cn("h-8 text-xs gap-2", showOnlyMe && "bg-indigo-100 text-indigo-700")}><User className="h-3.5 w-3.5" /> Solo Yo</Button>
              </div>

              <div className="flex items-center gap-3 text-xs hidden lg:flex">
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> <span className="text-muted-foreground">90-110%</span></div>
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber-400" /> <span className="text-muted-foreground">&lt;90%</span></div>
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-500" /> <span className="text-muted-foreground">&gt;110%</span></div>
              </div>
            </div>
          </div>

          {/* Panel de Transferencias Pendientes */}
          <div className="px-4 py-2">
            <PendingTransfersPanel />
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
            <div style={{ minWidth: '1000px' }}>
              <div className="grid sticky top-0 z-10 bg-white dark:bg-slate-950 border-b shadow-sm" style={{ gridTemplateColumns: gridTemplate }}>
                <div className="px-4 py-3 font-bold text-sm text-slate-700 dark:text-slate-200 border-r flex items-center bg-slate-50 dark:bg-slate-900">Equipo ({filteredEmployees.length})</div>
                {weeks.map((week, index) => (
                  <div key={week.weekStart.toISOString()} className={cn("text-center px-1 py-2 border-r flex flex-col justify-center", isCurrentWeek(week.weekStart) && "bg-primary/10/50")}>
                    <span className={cn("text-xs font-bold uppercase", isCurrentWeek(week.weekStart) ? "text-primary" : "text-slate-500")}>Semana {index + 1}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{format(week.weekStart, 'd MMM', { locale: es })} - {format(addDays(week.weekStart, 4), 'd MMM', { locale: es })}</span>
                  </div>
                ))}
                <div className="px-2 py-3 font-bold text-xs text-center border-l bg-slate-50 flex items-center justify-center">TOTAL</div>
              </div>

              <div>
                {filteredEmployees.map((employee) => {
                  const monthlyLoad = getEmployeeMonthlyLoad(employee.id, year, month);
                  return (
                    <div key={employee.id} className="grid border-b hover:bg-slate-50 transition-colors bg-white" style={{ gridTemplateColumns: gridTemplate }}>
                      <EmployeeRow
                        employee={employee}
                        weeks={weeks}
                        projects={projects}
                        allocations={allocations}
                        absences={absences}
                        teamEvents={teamEvents}
                        viewDate={currentMonth}
                        onOpenSheet={(empId, date, autoAdd) => handleCellClick(empId, date, autoAdd)}
                      />


                      <div className="flex items-center justify-center border-l p-2 bg-slate-50/30">
                        <div className={cn("flex flex-col items-center justify-center w-16 h-12 rounded-lg border-2", monthlyLoad.status === 'overload' ? "bg-red-50 border-red-200 text-red-700" : monthlyLoad.status === 'warning' ? "bg-yellow-50 border-yellow-200 text-yellow-700" : monthlyLoad.status === 'healthy' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400")}>
                          <span className="text-sm font-bold leading-none">{monthlyLoad.hours}h</span>
                          <span className="text-[10px] opacity-70">/ {monthlyLoad.capacity}h</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Sheet */}
          {selectedCell && (
            <AllocationSheet
              open={!!selectedCell}
              onOpenChange={(open) => !open && setSelectedCell(null)}
              employeeId={selectedCell.employeeId}
              weekStart={selectedCell.weekStart.toISOString()}
              viewDateContext={currentMonth}
              initialAutoAdd={selectedCell.autoAdd}
            />
          )}
        </div>

      )}
    </div>
  );
}
