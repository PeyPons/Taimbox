import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadIndicator } from '@/components/shared/LoadIndicator';
import { MetricsCard } from '@/components/shared/MetricsCard';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getWeeksForMonth } from '@/utils/dateUtils';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { demoEmployees, demoClients, demoProjects, demoAllocations } from '@/data/demoData';
import { DemoProvider, useDemo } from '@/contexts/DemoContext';
import { DemoEmployeeDashboard } from './DemoEmployeeDashboard';
import { cn } from '@/lib/utils';
import { AlertCircle, Info } from 'lucide-react';

export function DemoPlanner() {
  const { employees, allocations, projects, clients, getEmployeeMonthlyLoad, getEmployeeLoadForWeek } = useDemo();
  const [currentMonth] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('overview');

  const weeks = useMemo(() => getWeeksForMonth(currentMonth), [currentMonth]);

  // Dos empleados de ejemplo para el desglose por semana (María + Carlos)
  const calendarEmployees = employees.slice(0, 2);

  return (
    <div className="space-y-6 min-w-0">
      {/* Banner informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 min-w-0">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900 mb-1">
            Demo Interactivo - Datos de Ejemplo
          </p>
          <p className="text-xs text-blue-700">
            Esta es una demostración con datos simulados. Explora las diferentes secciones para ver cómo funciona la plataforma.
            No se pueden realizar modificaciones en este modo demo.
          </p>
        </div>
      </div>

      {/* Vista general con pestañas: menú con scroll horizontal en móvil para evitar overflow de página */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full min-w-0">
        <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1 custom-scrollbar">
          <TabsList className="w-full justify-start h-auto p-1 bg-slate-50 min-w-max">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white shrink-0">
              Vista general
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-white shrink-0">
              Proyectos
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-white shrink-0">
              Métricas
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Vista general: equipo, proyectos, escenarios + desglose por semana */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Equipo</h3>
              <div className="space-y-3">
                {employees.map(emp => {
                  const load = getEmployeeMonthlyLoad(
                    emp.id,
                    currentMonth.getFullYear(),
                    currentMonth.getMonth()
                  );
                  return (
                    <div key={emp.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm font-medium">{emp.name}</span>
                      <LoadIndicator
                        hours={load.hours}
                        capacity={load.capacity}
                        percentage={load.percentage}
                        size="sm"
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Proyectos activos</h3>
              <div className="space-y-2">
                {projects.map(proj => {
                  const client = clients.find(c => c.id === proj.clientId);
                  const projectAllocations = allocations.filter(a => a.projectId === proj.id);
                  const totalHours = projectAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
                  const percentage = proj.budgetHours > 0 ? (totalHours / proj.budgetHours) * 100 : 0;

                  return (
                    <div key={proj.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: client?.color }} />
                        <span className="text-sm">{proj.name}</span>
                      </div>
                      <Badge variant="outline" className={cn(
                        percentage > 100 ? "bg-red-50 text-red-700" :
                          percentage > 80 ? "bg-amber-50 text-amber-700" :
                            "bg-emerald-50 text-emerald-700"
                      )}>
                        {percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Escenarios</h3>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                  <div className="font-medium text-emerald-900">María González</div>
                  <div className="text-xs text-emerald-700">Carga normal (80-90%)</div>
                </div>
                <div className="p-2 bg-red-50 rounded border border-red-200">
                  <div className="font-medium text-red-900">Carlos Ruiz</div>
                  <div className="text-xs text-red-700">Sobrecarga (110-120%)</div>
                </div>
                <div className="p-2 bg-amber-50 rounded border border-amber-200">
                  <div className="font-medium text-amber-900">Ana Martínez</div>
                  <div className="text-xs text-amber-700">Subcarga (50-60%)</div>
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="font-medium text-blue-900">Luis Fernández</div>
                  <div className="text-xs text-blue-700">Carga óptima (85-95%)</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Carga por semana (antes pestaña Calendario): mismo contenido, integrado en vista general */}
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Carga por semana</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Desglose de horas planificadas por semana (ejemplo: María y Carlos)</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {calendarEmployees.map((emp) => {
                  const empMonthlyLoad = getEmployeeMonthlyLoad(emp.id, currentMonth.getFullYear(), currentMonth.getMonth());
                  return (
                    <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 border border-indigo-200 shrink-0">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
                            {emp.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{emp.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{emp.role}</p>
                        </div>
                      </div>
                      <LoadIndicator
                        hours={empMonthlyLoad.hours}
                        capacity={empMonthlyLoad.capacity}
                        percentage={empMonthlyLoad.percentage}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="flex flex-wrap gap-2 flex-1">
                        {weeks.map((week, index) => {
                          const weekStartDate = format(week.weekStart, 'yyyy-MM-dd');
                          const load = getEmployeeLoadForWeek(emp.id, weekStartDate, week.effectiveStart, week.effectiveEnd, currentMonth);
                          const weekAllocations = allocations.filter(a =>
                            a.employeeId === emp.id && a.weekStartDate === weekStartDate
                          );
                          const effectiveStart = week.effectiveStart || week.weekStart;
                          const effectiveEnd = week.effectiveEnd || addDays(week.weekStart, 6);
                          const weekLabel = `${format(effectiveStart, 'd', { locale: es })}-${format(effectiveEnd, 'd MMM', { locale: es })}`;
                          return (
                            <div
                              key={week.weekStart.toISOString()}
                              className={cn(
                                "rounded-lg border px-3 py-2 min-w-[80px]",
                                load.percentage > 100 ? "border-red-200 bg-red-50" :
                                  load.percentage > 85 ? "border-amber-200 bg-amber-50" :
                                    "border-slate-200 bg-slate-50"
                              )}
                            >
                              <p className="text-[10px] font-bold uppercase text-slate-500">S{index + 1}</p>
                              <p className="text-xs text-slate-600 mt-0.5">{weekLabel}</p>
                              <p className={cn(
                                "font-bold text-sm mt-1",
                                load.percentage > 100 ? "text-red-600" :
                                  load.percentage > 85 ? "text-amber-600" : "text-emerald-600"
                              )}>
                                {load.hours}h / {load.capacity}h
                              </p>
                              {weekAllocations.length > 0 && (
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {weekAllocations.length} tarea{weekAllocations.length > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proyectos */}
        <TabsContent value="projects" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(proj => {
              const client = clients.find(c => c.id === proj.clientId);
              const projectAllocations = allocations.filter(a => a.projectId === proj.id);
              const completed = projectAllocations.filter(a => a.status === 'completed');
              const totalAssigned = projectAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
              const totalComputed = completed.reduce((sum, a) => sum + (a.hoursComputed || 0), 0);
              const totalReal = completed.reduce((sum, a) => sum + (a.hoursActual || 0), 0);
              const percentage = proj.budgetHours > 0 ? (totalComputed / proj.budgetHours) * 100 : 0;

              return (
                <Card key={proj.id} className="flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-bold truncate">{proj.name}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color }} />
                          <span className="text-xs text-muted-foreground truncate">{client?.name}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn(
                        percentage > 100 ? "bg-red-50 text-red-700" :
                          percentage > 80 ? "bg-amber-50 text-amber-700" :
                            "bg-emerald-50 text-emerald-700"
                      )}>
                        {percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-3">
                      <div className="text-xs text-slate-500">
                        <div>Asignadas: {totalAssigned}h</div>
                        <div>Computadas: {totalComputed}h</div>
                        <div>Presupuesto: {proj.budgetHours}h</div>
                      </div>
                      <MetricsCard
                        estimated={totalAssigned}
                        real={totalReal}
                        computed={totalComputed}
                        size="sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-4 text-center text-sm text-slate-500">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Vista de solo lectura en modo demo
          </div>
        </TabsContent>

        {/* Métricas */}
        <TabsContent value="metrics" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumen del equipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employees.map(emp => {
                  const load = getEmployeeMonthlyLoad(emp.id, currentMonth.getFullYear(), currentMonth.getMonth());
                  const empAllocations = allocations.filter(a => a.employeeId === emp.id);
                  const completed = empAllocations.filter(a => a.status === 'completed');

                  return (
                    <div key={emp.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{emp.name}</span>
                        <Badge variant="outline" className={cn(
                          load.percentage > 100 ? "bg-red-50 text-red-700" :
                            load.percentage > 85 ? "bg-amber-50 text-amber-700" :
                              load.percentage < 60 ? "bg-blue-50 text-blue-700" :
                                "bg-emerald-50 text-emerald-700"
                        )}>
                          {load.percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div>Horas: {load.hours}h / {load.capacity}h</div>
                        <div>Tareas completadas: {completed.length} / {empAllocations.length}</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estado de proyectos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projects.map(proj => {
                  const client = clients.find(c => c.id === proj.clientId);
                  const projectAllocations = allocations.filter(a => a.projectId === proj.id);
                  const totalComputed = projectAllocations
                    .filter(a => a.status === 'completed')
                    .reduce((sum, a) => sum + (a.hoursComputed || 0), 0);
                  const percentage = proj.budgetHours > 0 ? (totalComputed / proj.budgetHours) * 100 : 0;

                  return (
                    <div key={proj.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: client?.color }} />
                          <span className="text-sm font-medium">{proj.name}</span>
                        </div>
                        <span className={cn(
                          "text-xs font-bold",
                          percentage > 100 ? "text-red-600" :
                            percentage > 80 ? "text-amber-600" :
                              "text-emerald-600"
                        )}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className={cn(
                          "h-2",
                          percentage > 100 && "[&>div]:bg-red-500",
                          percentage > 80 && percentage <= 100 && "[&>div]:bg-amber-500",
                          percentage <= 80 && "[&>div]:bg-emerald-500"
                        )}
                      />
                      <div className="text-xs text-slate-500">
                        {totalComputed}h computadas de {proj.budgetHours}h contratadas
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
          <div className="text-center text-sm text-slate-500">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Métricas de solo lectura en modo demo
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Este componente ya no se usa, se reemplazó por DemoEmployeeDashboard
export function DemoDashboard() {
  return (
    <DemoProvider>
      <DemoEmployeeDashboard />
    </DemoProvider>
  );
}
