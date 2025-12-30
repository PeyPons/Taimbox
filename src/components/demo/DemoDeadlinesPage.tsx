import { useState, useMemo } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ChevronDown, ChevronRight, ChevronLeft, Search, Eye, EyeOff, Copy, Sparkles, HelpCircle
} from 'lucide-react';
import { Deadline } from '@/types';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { demoDeadlines, demoEmployees } from '@/data/demoData';
import { getMonthlyCapacity as getMonthlyCapacityUtil } from '@/utils/dateUtils';

export function DemoDeadlinesPage() {
  const { projects, clients, employees } = useDemo();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');
  const [onlySEO, setOnlySEO] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set());

  const currentMonthDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = subMonths(new Date(year, month - 1, 1), 1);
    setSelectedMonth(format(prevDate, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = addMonths(new Date(year, month - 1, 1), 1);
    setSelectedMonth(format(nextDate, 'yyyy-MM'));
  };

  // Filtrar deadlines del mes actual
  const monthDeadlines = useMemo(() => {
    return demoDeadlines.filter(d => d.month === selectedMonth);
  }, [selectedMonth]);

  // Agrupar proyectos por cliente
  const projectsByClient = useMemo(() => {
    const grouped: Record<string, typeof projects> = {};
    projects.forEach(project => {
      const client = clients.find(c => c.id === project.clientId);
      if (!client) return;
      
      const clientName = client.name;
      if (!grouped[clientName]) {
        grouped[clientName] = [];
      }
      grouped[clientName].push(project);
    });
    return grouped;
  }, [projects, clients]);

  // Filtrar proyectos según búsqueda y filtros
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        const client = clients.find(c => c.id === p.clientId);
        return p.name.toLowerCase().includes(term) || 
               client?.name.toLowerCase().includes(term);
      });
    }

    // Filtro de ocultos
    if (!showHidden) {
      filtered = filtered.filter(p => !hiddenProjects.has(p.id));
    }

    return filtered;
  }, [projects, clients, searchTerm, showHidden, hiddenProjects]);

  const getProjectDeadline = (projectId: string): Deadline | undefined => {
    return monthDeadlines.find(d => d.projectId === projectId);
  };

  const getEmployeeAssignedHours = (employeeId: string): number => {
    let total = 0;
    monthDeadlines.forEach(deadline => {
      total += deadline.employeeHours[employeeId] || 0;
    });
    return total;
  };

  // Calcular capacidad mensual para cada empleado (similar a DeadlinesPage)
  const getEmployeeCapacity = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return { total: 160, available: 160, absenceHours: 0, eventHours: 0, absenceDetails: [], eventDetails: [] };
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const capacity = getMonthlyCapacityUtil(year, month - 1, employee.workSchedule);
    
    return {
      total: capacity,
      available: capacity,
      absenceHours: 0,
      eventHours: 0,
      absenceDetails: [],
      eventDetails: []
    };
  };

  // Calcular sugerencias de redistribución (similar a DeadlinesPage)
  const redistributionTips = useMemo(() => {
    const tips: { from: string; to: string; reason: string; projects: string[] }[] = [];
    const employeeLoads: { id: string; name: string; percentage: number; projects: string[] }[] = [];
    
    employees.forEach(emp => {
      const capacityData = getEmployeeCapacity(emp.id);
      const assigned = getEmployeeAssignedHours(emp.id);
      const percentage = capacityData.available > 0 ? Math.round((assigned / capacityData.available) * 100) : 0;
      
      const empProjects: string[] = [];
      monthDeadlines.forEach(d => {
        if ((d.employeeHours[emp.id] || 0) > 0) {
          empProjects.push(d.projectId);
        }
      });
      
      employeeLoads.push({ id: emp.id, name: emp.first_name || emp.name, percentage, projects: empProjects });
    });
    
    if (employeeLoads.length < 2) return [];
    
    const totalPercentage = employeeLoads.reduce((sum, e) => sum + e.percentage, 0);
    const averageLoad = Math.round(totalPercentage / employeeLoads.length);
    
    const maxLoad = Math.max(...employeeLoads.map(e => e.percentage));
    const minLoad = Math.min(...employeeLoads.map(e => e.percentage));
    const range = maxLoad - minLoad;
    
    const variance = employeeLoads.reduce((sum, e) => sum + Math.pow(e.percentage - averageLoad, 2), 0) / employeeLoads.length;
    const standardDeviation = Math.sqrt(variance);
    const deviationThreshold = range <= 15 ? 3 : Math.max(3, Math.round(standardDeviation * 1.5));
    
    const aboveAverage = employeeLoads.filter(e => e.percentage > averageLoad + deviationThreshold);
    const belowAverage = employeeLoads.filter(e => e.percentage < averageLoad - deviationThreshold);
    
    if (aboveAverage.length === 0 || belowAverage.length === 0) return [];
    
    aboveAverage.forEach(over => {
      belowAverage.forEach(avail => {
        const sharedProjects = over.projects.filter(p => avail.projects.includes(p));
        if (sharedProjects.length > 0) {
          const projectNames = sharedProjects.map(pid => projects.find(p => p.id === pid)?.name || '').filter(Boolean);
          tips.push({
            from: over.name,
            to: avail.name,
            reason: `${over.name} está al ${over.percentage}% (media: ${averageLoad}%), ${avail.name} al ${avail.percentage}%`,
            projects: projectNames
          });
        }
      });
    });
    
    return tips.sort((a, b) => {
      const aFrom = employeeLoads.find(e => e.name === a.from);
      const aTo = employeeLoads.find(e => e.name === a.to);
      const bFrom = employeeLoads.find(e => e.name === b.from);
      const bTo = employeeLoads.find(e => e.name === b.to);
      const aImpact = (aFrom?.percentage || 0) - (aTo?.percentage || 0);
      const bImpact = (bFrom?.percentage || 0) - (bTo?.percentage || 0);
      return bImpact - aImpact;
    }).slice(0, 3);
  }, [employees, monthDeadlines, projects, selectedMonth]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-3 sm:p-4 md:p-6 min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* Banner informativo */}
      <div className="lg:hidden bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-blue-700">
          <strong>Demo:</strong> Esta es una demostración con datos simulados. No se pueden realizar modificaciones.
        </p>
      </div>

      {/* Columna principal - Proyectos */}
      <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
              Deadline
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">Asignación mensual de horas</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Selector de mes con flechas */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-indigo-200/50 shadow-sm flex-1 sm:flex-initial">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs sm:text-sm font-medium px-2 min-w-[120px] sm:min-w-[140px] text-center capitalize">
                {format(currentMonthDate, 'MMMM yyyy', { locale: es })}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200/50 shadow-md p-3">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar proyecto o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 border-indigo-200/50 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-slate-600 whitespace-nowrap">Solo SEO</span>
              <Switch
                checked={onlySEO}
                onCheckedChange={setOnlySEO}
                className="scale-90"
              />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-slate-600 whitespace-nowrap">Ocultos</span>
              <Switch
                checked={showHidden}
                onCheckedChange={setShowHidden}
                className="scale-90"
              />
            </label>
          </div>
        </div>

        {/* Lista de proyectos agrupados por cliente */}
        <div className="space-y-3 sm:space-y-4">
          {Object.entries(projectsByClient)
            .filter(([clientName]) => {
              const clientProjects = projectsByClient[clientName];
              return clientProjects.some(p => filteredProjects.includes(p));
            })
            .map(([clientName, clientProjects]) => {
              const client = clients.find(c => c.name === clientName);
              const clientProjectsFiltered = clientProjects.filter(p => filteredProjects.includes(p));
              
              if (clientProjectsFiltered.length === 0) return null;

              const isExpanded = expandedClients.has(clientName);

              return (
                <Card key={clientName} className="border-indigo-200/50 shadow-md bg-white/90 backdrop-blur-sm overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={(open) => {
                    const newSet = new Set(expandedClients);
                    if (open) newSet.add(clientName);
                    else newSet.delete(clientName);
                    setExpandedClients(newSet);
                  }}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-indigo-50/50 transition-colors p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div 
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0" 
                              style={{ backgroundColor: client?.color || '#6b7280' }}
                            />
                            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                              {clientName}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {clientProjectsFiltered.length} proyecto{clientProjectsFiltered.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
                        {clientProjectsFiltered.map(project => {
                          const deadline = getProjectDeadline(project.id);
                          const isProjectExpanded = expandedProjects.has(project.id);
                          const isHidden = hiddenProjects.has(project.id);

                          return (
                            <div
                              key={project.id}
                              className={cn(
                                "border rounded-lg p-3 sm:p-4 transition-all",
                                isHidden ? "border-amber-200 bg-amber-50/50" : "border-indigo-100 bg-white"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                                      {project.name}
                                    </h3>
                                    {isHidden && (
                                      <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300">
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        Oculto
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {deadline && (
                                    <div className="space-y-2 mt-3">
                                      {Object.entries(deadline.employeeHours).map(([empId, hours]) => {
                                        const employee = employees.find(e => e.id === empId);
                                        if (!employee) return null;
                                        
                                        const totalAssigned = getEmployeeAssignedHours(empId);
                                        const capacityData = getEmployeeCapacity(empId);
                                        const percentage = capacityData.available > 0 ? Math.round((totalAssigned / capacityData.available) * 100) : 0;
                                        const status = percentage > 100 ? 'overload' : percentage > 85 ? 'warning' : 'healthy';
                                        
                                        return (
                                          <div key={empId} className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-slate-50 rounded-lg border border-slate-200">
                                            <Avatar className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0">
                                              <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                                                {employee.first_name?.[0] || employee.name[0]}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between">
                                                <span className="font-medium text-slate-700 truncate">
                                                  {employee.first_name || employee.name}
                                                </span>
                                                <span className={cn(
                                                  "text-xs font-mono font-bold ml-2",
                                                  status === 'overload' ? "text-red-600" : 
                                                  status === 'warning' ? "text-orange-600" : 
                                                  "text-emerald-600"
                                                )}>
                                                  {percentage}%
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 mt-1">
                                                <Progress 
                                                  value={Math.min(percentage, 100)} 
                                                  className={cn(
                                                    "h-1 flex-1",
                                                    status === 'overload' && "[&>div]:bg-red-500",
                                                    status === 'warning' && "[&>div]:bg-orange-500",
                                                    status === 'healthy' && "[&>div]:bg-emerald-500"
                                                  )}
                                                />
                                                <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-xs">
                                                  {hours}h
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {!deadline && (
                                    <div className="mt-2">
                                      <p className="text-xs sm:text-sm text-slate-400 italic">
                                        Sin deadline asignado
                                      </p>
                                      <p className="text-[10px] text-slate-300 mt-1">
                                        Presupuesto: {project.budgetHours}h
                                      </p>
                                    </div>
                                  )}
                                  
                                  {deadline && (
                                    <div className="mt-2 pt-2 border-t border-slate-200">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Total asignado:</span>
                                        <span className="font-semibold text-slate-700">
                                          {Object.values(deadline.employeeHours).reduce((sum, h) => sum + h, 0)}h
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs mt-1">
                                        <span className="text-slate-500">Presupuesto:</span>
                                        <span className="font-semibold text-slate-700">
                                          {project.budgetHours}h
                                        </span>
                                      </div>
                                      {deadline.notes && (
                                        <p className="text-[10px] text-slate-400 italic mt-2">
                                          {deadline.notes}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Columna lateral - Disponibilidad del equipo (igual que DeadlinesPage real) */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 space-y-4">
          {/* Disponibilidad en tiempo real */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-indigo-200/50 shadow-md p-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Disponibilidad
            </h3>
            <div className="space-y-2">
              {employees.map(emp => {
                const capacityData = getEmployeeCapacity(emp.id);
                const assigned = getEmployeeAssignedHours(emp.id);
                const available = capacityData.available;
                const percentage = available > 0 ? Math.round((assigned / available) * 100) : 0;
                const remaining = available - assigned;
                const status = percentage > 100 ? 'overload' : percentage > 85 ? 'warning' : 'healthy';
                
                return (
                  <TooltipProvider key={emp.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="bg-indigo-500 text-white text-[9px]">
                              {(emp.first_name || emp.name)[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs">
                              <span className="truncate font-medium text-slate-700">
                                {emp.first_name || emp.name}
                              </span>
                              <span className={cn(
                                "font-mono font-bold",
                                status === 'overload' ? "text-red-600" : 
                                status === 'warning' ? "text-orange-600" : 
                                "text-emerald-600"
                              )}>
                                {percentage}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Progress 
                                value={Math.min(percentage, 100)} 
                                className={cn(
                                  "h-1 flex-1",
                                  status === 'overload' && "[&>div]:bg-red-500",
                                  status === 'warning' && "[&>div]:bg-orange-500",
                                  status === 'healthy' && "[&>div]:bg-emerald-500"
                                )}
                              />
                              <span className={cn(
                                "text-[10px] font-mono w-10 text-right",
                                remaining < 0 ? "text-red-500" : "text-slate-400"
                              )}>
                                {remaining.toFixed(0)}h
                              </span>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs max-w-[280px] bg-white border border-slate-200 shadow-xl z-50">
                        <div className="space-y-2 text-slate-700">
                          <div className="font-semibold text-slate-900 text-sm">{emp.first_name || emp.name}</div>
                          <div className="text-slate-600">Base mensual: <span className="font-medium">{capacityData.total.toFixed(1)}h</span></div>
                          <div className="border-t border-slate-200 pt-2 mt-2">
                            <span className="text-slate-600">Disponible: </span>
                            <span className="font-mono font-bold text-slate-900 text-sm">{available.toFixed(1)}h</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>

          {/* Tips de redistribución */}
          {redistributionTips.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <h3 className="text-xs font-semibold text-orange-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Sugerencias
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-orange-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs z-[100]">
                      <div className="text-xs space-y-2">
                        <p className="font-semibold">Cálculo de sugerencias:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                          <li>Se calcula la carga promedio del equipo</li>
                          <li>Se identifican empleados por encima y por debajo de la media</li>
                          <li>Umbral: 3 puntos si el rango es estrecho (≤15 puntos), o 1.5× desviación estándar si es amplio</li>
                          <li>Solo se sugieren transferencias entre empleados que comparten proyectos</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <div className="space-y-2">
                {redistributionTips.map((tip, i) => (
                  <div key={i} className="text-xs bg-white border border-orange-100 rounded p-2">
                    <div className="font-medium text-slate-800 mb-0.5">
                      {tip.from} → {tip.to}
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      {tip.reason}
                    </div>
                    {tip.projects.length > 0 && (
                      <div className="text-[10px] text-orange-600 mt-1">
                        En común: {tip.projects.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
