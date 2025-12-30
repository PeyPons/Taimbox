import { useState, useMemo, useCallback, useRef } from 'react';
import { MyWeekView } from '@/components/employee/MyWeekView';
import { PriorityInsights, ProjectTeamPulse } from '@/components/employee/DashboardWidgets'; 
import { ReliabilityIndexCard } from '@/components/employee/ReliabilityIndexCard';
import { PlanningInconsistenciesCard } from '@/components/employee/PlanningInconsistenciesCard';
import { CollaborationCards } from '@/components/employee/CollaborationCards';
import { MonthlyBalanceCard } from '@/components/employee/MonthlyBalanceCard';
import { LoadIndicator } from '@/components/shared/LoadIndicator';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeRow } from '@/components/planner/EmployeeRow';
import { AllocationSheet } from '@/components/planner/AllocationSheet';
import { getWeeksForMonth, getMonthName } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, addDays, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';
import { AlertCircle, Info } from 'lucide-react';

export function DemoEmployeeDashboard() {
  const { 
    employees, allocations, absences, teamEvents, projects, clients,
    getEmployeeMonthlyLoad, getEmployeeLoadForWeek,
    currentUser
  } = useDemo();
  
  const demoEmployee = currentUser || employees[0];
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; weekStart: Date } | null>(null);
  
  const weeks = useMemo(() => getWeeksForMonth(currentMonth), [currentMonth]);
  const gridTemplate = `250px repeat(${weeks.length}, minmax(0, 1fr)) 100px`;
  const monthlyLoad = getEmployeeMonthlyLoad(demoEmployee.id, currentMonth.getFullYear(), currentMonth.getMonth());

  const handlePrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const handleToday = () => setCurrentMonth(new Date());

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-20">
      {/* Banner informativo */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-3 sm:p-4 flex items-start gap-3 shadow-sm">
        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">
            Demo Interactivo - Datos de Ejemplo
          </p>
          <p className="text-xs text-blue-700">
            Esta es una demostración con datos simulados. Explora las diferentes secciones para ver cómo funciona la plataforma. 
            No se pueden realizar modificaciones en este modo demo.
          </p>
        </div>
      </div>

      {/* 1. CABECERA + ACCIONES */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 border border-indigo-100/50 shadow-lg">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Hola, {demoEmployee.first_name || demoEmployee.name.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Panel de control operativo (Demo)</p>
          </div>
        </div>
      </div>

      {/* 2. CONTROL MES */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-xl border border-indigo-200/50 shadow-md backdrop-blur-sm">
        <h2 className="text-base sm:text-lg font-bold capitalize bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent flex items-center gap-2 sm:min-w-[180px]">
          {getMonthName(currentMonth)} <Badge variant="outline" className="text-xs font-normal bg-white/80">{currentMonth.getFullYear()}</Badge>
        </h2>
        <div className="hidden sm:block h-6 w-px bg-indigo-200 mx-2" />
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 hover:bg-indigo-100" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 sm:h-7 text-xs px-3 sm:px-2 hover:bg-indigo-100 flex-1 sm:flex-initial"><CalendarDays className="h-3.5 w-3.5 mr-1.5" />Mes actual</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 hover:bg-indigo-100" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* 3. CALENDARIO - Responsive */}
      <Card className="overflow-hidden border-indigo-200/50 shadow-xl bg-white/90 backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 -z-10" />
        <div className="overflow-x-auto custom-scrollbar -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0">
          <div className="min-w-[700px] sm:min-w-[900px] md:min-w-[1000px]">
            <div className="grid bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200/50" style={{ gridTemplateColumns: gridTemplate }}>
              <div className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-xs sm:text-sm text-slate-700 flex items-center border-r border-indigo-200/50">Mi calendario</div>
              {weeks.map((week, index) => {
                const effectiveStart = week.effectiveStart || week.weekStart;
                const effectiveEnd = week.effectiveEnd || addDays(week.weekStart, 6);
                
                const workingDays = [];
                let currentDay = new Date(effectiveStart);
                while (currentDay <= effectiveEnd) {
                  const dayOfWeek = currentDay.getDay();
                  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    workingDays.push(new Date(currentDay));
                  }
                  currentDay = addDays(currentDay, 1);
                }
                
                const firstWorkingDay = workingDays[0];
                const lastWorkingDay = workingDays[workingDays.length - 1];
                const weekDateLabel = firstWorkingDay && lastWorkingDay 
                  ? `${format(firstWorkingDay, 'd', { locale: es })}-${format(lastWorkingDay, 'd MMM', { locale: es })}`
                  : `${format(effectiveStart, 'd', { locale: es })}-${format(effectiveEnd, 'd MMM', { locale: es })}`;
                
                return (
                  <div key={week.weekStart.toISOString()} className="text-center px-1 sm:px-2 py-1.5 sm:py-2 border-r border-indigo-200/50 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-indigo-600">S{index + 1}</span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                      {weekDateLabel}
                    </span>
                  </div>
                );
              })}
              <div className="px-1 sm:px-2 py-2 sm:py-3 font-bold text-[10px] sm:text-xs text-center flex items-center justify-center bg-indigo-50/50">TOTAL MES</div>
            </div>

            <div className="grid bg-white" style={{ gridTemplateColumns: gridTemplate }}>
              <EmployeeRow 
                employee={demoEmployee} 
                weeks={weeks} 
                projects={projects} 
                allocations={allocations} 
                absences={absences} 
                teamEvents={teamEvents} 
                viewDate={currentMonth} 
                onOpenSheet={(empId, date) => setSelectedCell({ employeeId: empId, weekStart: date })} 
              />
              <div className="flex items-center justify-center border-l p-2 bg-slate-50/30">
                <LoadIndicator 
                  hours={monthlyLoad.hours} 
                  capacity={monthlyLoad.capacity} 
                  percentage={monthlyLoad.percentage}
                  size="md"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. VISTA ORGANIZADA POR PESTAÑAS - PRIORIDAD DE MAYOR A MENOR */}
      <Card className="border-indigo-200/50 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 -z-10" />
        <Tabs defaultValue="dependencies" className="w-full">
          <TabsList className="w-full justify-start h-auto p-1 bg-gradient-to-r from-indigo-50 to-purple-50 flex-wrap border-b border-indigo-100/50 overflow-x-auto">
            <TabsTrigger value="dependencies" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-indigo-200 transition-all text-xs sm:text-sm whitespace-nowrap">
              Dependencias
            </TabsTrigger>
            <TabsTrigger value="coherence" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-indigo-200 transition-all text-xs sm:text-sm whitespace-nowrap">
              Coherencia
            </TabsTrigger>
            <TabsTrigger value="teammates" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-indigo-200 transition-all text-xs sm:text-sm whitespace-nowrap">
              Compañeros
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-indigo-200 transition-all text-xs sm:text-sm whitespace-nowrap">
              Proyectos
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-indigo-200 transition-all text-xs sm:text-sm whitespace-nowrap">
              Métricas
            </TabsTrigger>
          </TabsList>
          
          {/* 1. DEPENDENCIAS - MÁS IMPORTANTE */}
          <TabsContent value="dependencies" className="mt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <PriorityInsights employeeId={demoEmployee.id} viewDate={currentMonth} />
              </div>
              <div>
                <ProjectTeamPulse employeeId={demoEmployee.id} viewDate={currentMonth} />
              </div>
            </div>
          </TabsContent>

          {/* 2. COHERENCIA DE PLANIFICACIÓN */}
          <TabsContent value="coherence" className="mt-4">
            <div>
              <PlanningInconsistenciesCard employeeId={demoEmployee.id} viewDate={currentMonth} />
            </div>
          </TabsContent>

          {/* 3. COMPAÑEROS */}
          <TabsContent value="teammates" className="mt-4">
            <div>
              <CollaborationCards employeeId={demoEmployee.id} viewDate={currentMonth} />
            </div>
          </TabsContent>

          {/* 4. PROYECTOS DEL MES */}
          <TabsContent value="projects" className="mt-4">
            <MyWeekView employeeId={demoEmployee.id} viewDate={currentMonth} />
          </TabsContent>

          {/* 5. MÉTRICAS Y ANÁLISIS */}
          <TabsContent value="metrics" className="mt-4 space-y-6">
            <div>
              <MonthlyBalanceCard employeeId={demoEmployee.id} viewDate={currentMonth} />
            </div>
            <div>
              <ReliabilityIndexCard employeeId={demoEmployee.id} viewDate={currentMonth} />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* MODAL AllocationSheet */}
      {selectedCell && (
        <AllocationSheet 
          open={!!selectedCell} 
          onOpenChange={(open) => !open && setSelectedCell(null)} 
          employeeId={selectedCell.employeeId} 
          weekStart={selectedCell.weekStart.toISOString()} 
          viewDateContext={currentMonth} 
        />
      )}
    </div>
  );
}
