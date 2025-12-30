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
import { 
  ChevronDown, ChevronRight, ChevronLeft, Search, Eye, EyeOff, Copy
} from 'lucide-react';
import { Deadline } from '@/types';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { demoDeadlines } from '@/data/demoData';

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
                                        
                                        return (
                                          <div key={empId} className="flex items-center gap-2 text-xs sm:text-sm">
                                            <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                                              <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                                                {employee.first_name?.[0] || employee.name[0]}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-slate-700 truncate">
                                              {employee.first_name || employee.name}
                                            </span>
                                            <Badge variant="outline" className="ml-auto bg-indigo-50 border-indigo-200">
                                              {hours}h
                                            </Badge>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {!deadline && (
                                    <p className="text-xs sm:text-sm text-slate-400 italic mt-2">
                                      Sin deadline asignado
                                    </p>
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

      {/* Columna lateral - Resumen de empleados (oculta en móvil) */}
      <div className="hidden lg:block w-80 shrink-0">
        <Card className="border-indigo-200/50 shadow-md bg-white/90 backdrop-blur-sm sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
              Resumen de Asignaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {employees.map(employee => {
              const assignedHours = getEmployeeAssignedHours(employee.id);
              const capacity = 160; // Capacidad mensual aproximada
              const percentage = (assignedHours / capacity) * 100;

              return (
                <div key={employee.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                        {employee.first_name?.[0] || employee.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {employee.first_name || employee.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {assignedHours}h / {capacity}h
                      </p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
