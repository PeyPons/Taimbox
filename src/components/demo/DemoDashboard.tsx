import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadIndicator } from '@/components/shared/LoadIndicator';
import { MetricsCard } from '@/components/shared/MetricsCard';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getWeeksForMonth, getMonthName } from '@/utils/dateUtils';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { demoEmployees, demoClients, demoProjects, demoAllocations } from '@/data/demoData';
import { DemoProvider, useDemo } from '@/contexts/DemoContext';
import { cn } from '@/lib/utils';
import { AlertCircle, Info, Users, Calendar, BarChart3, Target, TrendingUp, TrendingDown, CheckCircle2, Clock } from 'lucide-react';

function DemoDashboardContent() {
  const { employees, allocations, projects, clients, getEmployeeMonthlyLoad, getEmployeeLoadForWeek } = useDemo();
  const [currentMonth] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const weeks = useMemo(() => getWeeksForMonth(currentMonth), [currentMonth]);
  const gridTemplate = `250px repeat(${weeks.length}, minmax(0, 1fr)) 100px`;
  
  // Empleado demo (María)
  const demoEmployee = employees[0];
  const monthlyLoad = getEmployeeMonthlyLoad(
    demoEmployee.id, 
    currentMonth.getFullYear(), 
    currentMonth.getMonth()
  );

  return (
    <div className="space-y-6">
      {/* Banner informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 mb-1">
            Demo Interactivo - Datos de Ejemplo
          </p>
          <p className="text-xs text-blue-700">
            Esta es una demostración con datos simulados. Explora las diferentes secciones para ver cómo funciona la plataforma. 
            No se pueden realizar modificaciones en este modo demo.
          </p>
        </div>
      </div>

      {/* Vista general con pestañas */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-slate-50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white">
            Vista General
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-white">
            Calendario
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-white">
            Proyectos
          </TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-white">
            Métricas
          </TabsTrigger>
        </TabsList>

        {/* Vista General */}
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
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Proyectos Activos</h3>
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
        </TabsContent>

        {/* Calendario */}
        <TabsContent value="calendar" className="mt-4">
          <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
            <div className="overflow-x-auto custom-scrollbar">
              <div style={{ minWidth: '1000px' }}>
                <div className="grid bg-slate-50 border-b" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="px-4 py-3 font-bold text-sm text-slate-700 flex items-center border-r">
                    Calendario
                  </div>
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
                      <div key={week.weekStart.toISOString()} className="text-center px-1 py-2 border-r flex flex-col justify-center">
                        <span className="text-xs font-bold uppercase text-slate-500">S{index + 1}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {weekDateLabel}
                        </span>
                      </div>
                    );
                  })}
                  <div className="px-2 py-3 font-bold text-xs text-center flex items-center justify-center">TOTAL</div>
                </div>

                <div className="grid bg-white" style={{ gridTemplateColumns: gridTemplate }}>
                  {/* Columna Empleado */}
                  <div className="sticky left-0 z-10 bg-background/95 backdrop-blur border-r p-3 flex items-center">
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-10 w-10 border border-indigo-200">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
                          {demoEmployee.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate">{demoEmployee.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{demoEmployee.role}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Celdas de semanas */}
                  {weeks.map((week) => {
                    const weekStartDate = format(week.weekStart, 'yyyy-MM-dd');
                    const load = getEmployeeLoadForWeek(demoEmployee.id, weekStartDate, week.effectiveStart, week.effectiveEnd, currentMonth);
                    const weekAllocations = allocations.filter(a => 
                      a.employeeId === demoEmployee.id && 
                      a.weekStartDate === weekStartDate
                    );
                    
                    return (
                      <div key={week.weekStart.toISOString()} className="border-r last:border-r-0 p-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={cn(
                              "font-bold",
                              load.status === 'overload' ? "text-red-600" :
                              load.status === 'high' ? "text-amber-600" :
                              load.status === 'optimal' ? "text-emerald-600" :
                              load.status === 'low' ? "text-blue-600" :
                              "text-slate-400"
                            )}>
                              {load.hours}h
                            </span>
                            <span className="text-slate-400">/{load.capacity}h</span>
                          </div>
                          <Progress 
                            value={Math.min(load.percentage, 100)} 
                            className={cn(
                              "h-1.5",
                              load.status === 'overload' && "[&>div]:bg-red-500",
                              load.status === 'high' && "[&>div]:bg-amber-500",
                              load.status === 'optimal' && "[&>div]:bg-emerald-500",
                              load.status === 'low' && "[&>div]:bg-blue-500"
                            )}
                          />
                          {weekAllocations.length > 0 && (
                            <div className="text-[10px] text-slate-500 mt-1">
                              {weekAllocations.length} tarea{weekAllocations.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
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
                <CardTitle className="text-sm">Resumen del Equipo</CardTitle>
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
                <CardTitle className="text-sm">Estado de Proyectos</CardTitle>
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

export function DemoDashboard() {
  return (
    <DemoProvider>
      <DemoDashboardContent />
    </DemoProvider>
  );
}
