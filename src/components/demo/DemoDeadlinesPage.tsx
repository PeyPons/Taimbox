import { useState, useMemo } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ChevronDown, ChevronRight, Search, Eye, EyeOff, Sparkles, HelpCircle, Filter, Calendar, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getMonthlyCapacity as getMonthlyCapacityUtil } from '@/utils/dateUtils';
import { demoDeadlines } from '@/data/demoData';

export function DemoDeadlinesPage() {
  const { projects, clients, employees } = useDemo();
  const [selectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [hiddenProjects] = useState<Set<string>>(new Set());

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

  // Filtrar proyectos
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        const client = clients.find(c => c.id === p.clientId);
        return p.name.toLowerCase().includes(term) ||
          client?.name.toLowerCase().includes(term);
      });
    }

    if (!showHidden) {
      filtered = filtered.filter(p => !hiddenProjects.has(p.id));
    }

    return filtered;
  }, [projects, clients, searchTerm, showHidden, hiddenProjects]);

  const getProjectDeadline = (projectId: string) => {
    return monthDeadlines.find(d => d.projectId === projectId);
  };

  const getEmployeeAssignedHours = (employeeId: string) => {
    let total = 0;
    monthDeadlines.forEach(deadline => {
      total += deadline.employeeHours[employeeId] || 0;
    });
    return total;
  };

  const getEmployeeCapacity = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return { total: 160, available: 160 };

    // Simplificado para demo
    return { total: 160, available: 160 };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 min-h-screen bg-slate-50">

      {/* COLUMNA PRINCIPAL */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* HEADER Y FILTROS */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestión de Deadlines</h1>
              <p className="text-sm text-slate-500">Asigna objetivos mensuales por proyecto y empleado</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(), 'MMMM yyyy', { locale: es })}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-lg border shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar proyecto, cliente..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-600" onClick={() => setShowHidden(!showHidden)}>
                {showHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showHidden ? 'Ocultar archivados' : 'Ver archivados'}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Más filtros
              </Button>
            </div>
          </div>
        </div>

        {/* LISTA DE PROYECTOS */}
        <div className="space-y-4">
          {Object.entries(projectsByClient).map(([clientName, clientProjects]) => {
            const visibleProjects = clientProjects.filter(p => filteredProjects.includes(p));
            if (visibleProjects.length === 0) return null;

            const client = clients.find(c => c.name === clientName);
            const isExpanded = expandedClients.has(clientName);

            return (
              <Card key={clientName} className="border-slate-200 shadow-sm overflow-hidden">
                <Collapsible
                  open={isExpanded}
                  onOpenChange={(open) => {
                    const next = new Set(expandedClients);
                    if (open) next.add(clientName); else next.delete(clientName);
                    setExpandedClients(next);
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-3 px-4 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: client?.color || '#ccc' }} />
                          <CardTitle className="text-base font-bold text-slate-800">{clientName}</CardTitle>
                          <Badge variant="secondary" className="text-xs font-normal text-slate-500 bg-white border-slate-200">
                            {visibleProjects.length} proyectos
                          </Badge>
                        </div>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-4 space-y-3 bg-slate-50/30">
                      {visibleProjects.map(project => {
                        const deadline = getProjectDeadline(project.id);
                        const totalAssigned = deadline
                          ? Object.values(deadline.employeeHours).reduce((a, b) => a + b, 0)
                          : 0;

                        return (
                          <div key={project.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm group">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-slate-900">{project.name}</h3>
                                  {project.projectType === 'PPC' && <Badge variant="outline" className="text-[10px] h-5">PPC</Badge>}
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium text-slate-700">{totalAssigned}h</span> asignadas
                                  </span>
                                  <span className="text-slate-300">|</span>
                                  <span>Presupuesto: {project.budgetHours || 0}h</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Botones de acción simulados para demo */}
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Sparkles className="h-4 w-4 text-amber-500" />
                                </Button>
                              </div>
                            </div>

                            {/* Asignaciones de empleados */}
                            {deadline && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(deadline.employeeHours).map(([empId, hours]) => {
                                  const employee = employees.find(e => e.id === empId);
                                  if (!employee) return null;

                                  return (
                                    <div key={empId} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <Avatar className="h-6 w-6 border border-white">
                                          <AvatarFallback className="bg-indigo-100 text-primary text-[10px]">{employee.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-slate-700 truncate">{employee.first_name || employee.name}</span>
                                      </div>
                                      <Badge variant="secondary" className="bg-white border-slate-200 font-mono text-xs">
                                        {hours}h
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {!deadline && (
                              <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-lg">
                                <span className="text-sm text-slate-400">Sin asignaciones definidas para este mes</span>
                              </div>
                            )}
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

      {/* SIDEBAR - DISPONIBILIDAD (Sticky) */}
      <div className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-6 space-y-6">
          {/* Disponibilidad Card */}
          <Card className="border-indigo-100 shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-white">
              <CardTitle className="text-sm font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" />
                Disponibilidad Equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-[calc(100vh-200px)] overflow-y-auto">
                {employees.map(emp => {
                  const assigned = getEmployeeAssignedHours(emp.id);
                  const capacity = 160; // Hardcoded para demo
                  const percent = Math.round((assigned / capacity) * 100);
                  const isOverload = percent > 100;
                  const isWarning = percent > 85;

                  return (
                    <div key={emp.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-slate-200">
                            <AvatarFallback className="bg-slate-100 text-slate-700 font-medium text-xs">
                              {emp.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{emp.first_name || emp.name}</div>
                            <div className="text-[10px] text-slate-500">{emp.role || 'Empleado'}</div>
                          </div>
                        </div>
                        <div className={cn("text-xs font-bold px-1.5 py-0.5 rounded",
                          isOverload ? "bg-red-50 text-red-700" : isWarning ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                        )}>
                          {percent}%
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{assigned}h asignadas</span>
                          <span>{capacity - assigned}h libres</span>
                        </div>
                        <Progress
                          value={Math.min(percent, 100)}
                          className={cn("h-1.5",
                            isOverload ? "[&>div]:bg-red-500" : isWarning ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Banner Demo Side */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 leading-relaxed">
            <strong>Tip Pro:</strong> En la versión completa, arrastra y suelta proyectos para asignar horas automáticamente o utiliza el asistente de IA para balancear la carga de trabajo.
          </div>
        </div>
      </div>

    </div>
  );
}
