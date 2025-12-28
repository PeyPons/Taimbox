import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, 
  Clock, Link, Users, Calendar, ListPlus, FileDown,
  ChevronRight, MoreHorizontal, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Datos de muestra para mostrar en los tours cuando no hay datos reales.
 * Estos componentes se muestran SOLO durante los tours para usuarios nuevos.
 */

// Mock data
const mockProjects = [
  { 
    id: '1', 
    name: 'SEO Mensual [Cliente ABC]', 
    budgetHours: 30, 
    computed: 18, 
    planned: 8, 
    status: 'healthy',
    color: 'indigo'
  },
  { 
    id: '2', 
    name: 'Campaña SEM [Cliente XYZ]', 
    budgetHours: 20, 
    computed: 19, 
    planned: 3, 
    status: 'warning',
    color: 'amber'
  },
  { 
    id: '3', 
    name: 'Auditoría Web [Cliente DEF]', 
    budgetHours: 15, 
    computed: 15, 
    planned: 0, 
    status: 'complete',
    color: 'emerald'
  }
];

const mockTasks = [
  { 
    id: '1', 
    name: 'Análisis de keywords', 
    project: 'SEO Mensual', 
    hours: 4, 
    completed: true,
    hoursActual: 3.5,
    hoursComputed: 4
  },
  { 
    id: '2', 
    name: 'Optimización on-page', 
    project: 'SEO Mensual', 
    hours: 6, 
    completed: false,
    dependency: 'Análisis de keywords',
    depOwner: 'Marta Ojeda'
  },
  { 
    id: '3', 
    name: 'Informe mensual', 
    project: 'SEO Mensual', 
    hours: 2, 
    completed: false,
    blockingUser: 'Carlos García'
  }
];

const mockTeammates = [
  { name: 'Marta Ojeda', avatar: null, hours: 12, role: 'SEO Specialist' },
  { name: 'Carlos García', avatar: null, hours: 8, role: 'Content Manager' },
  { name: 'Ana López', avatar: null, hours: 5, role: 'Project Manager' }
];

const mockCalendar = [
  { week: 1, hours: 35, capacity: 40, status: 'healthy' },
  { week: 2, hours: 42, capacity: 40, status: 'warning' },
  { week: 3, hours: 38, capacity: 40, status: 'healthy' },
  { week: 4, hours: 32, capacity: 40, status: 'healthy' }
];

/**
 * Widget de calendario mock para el tour
 */
export function MockCalendarWidget() {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-indigo-100">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Tu carga - Enero 2025
      </div>
      <div className="grid grid-cols-4 gap-2">
        {mockCalendar.map((week) => (
          <div 
            key={week.week}
            className={cn(
              "p-3 rounded-lg border text-center cursor-pointer transition-all hover:scale-105",
              week.status === 'healthy' 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
            )}
          >
            <div className="text-[10px] text-slate-500">Sem {week.week}</div>
            <div className="text-lg font-bold">{week.hours}h</div>
            <div className="text-[9px] opacity-70">/{week.capacity}h</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Widget de prioridades mock para el tour
 */
export function MockPriorityWidget() {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-red-100">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-sm font-semibold text-slate-700">Alertas inteligentes</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-100">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-red-700">
            <strong>Carlos</strong> te está esperando en "Optimización on-page"
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-amber-700">
            El proyecto <strong>Campaña SEM</strong> está cerca del límite
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span className="text-xs text-emerald-700">
            <strong>3 tareas</strong> completadas esta semana
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Widget de dependencias mock para el tour
 */
export function MockDependenciesWidget() {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-indigo-100">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-semibold text-slate-700">Estado de dependencias</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs">Análisis de keywords</span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-emerald-100 border-emerald-200 text-emerald-700">
            Listo
          </Badge>
        </div>
        <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs">Esperando a Marta</span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-amber-100 border-amber-200 text-amber-700">
            Pendiente
          </Badge>
        </div>
      </div>
    </Card>
  );
}

/**
 * Widget de resumen de proyectos mock para el tour
 */
export function MockProjectsSummary() {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Tus proyectos - Enero
      </div>
      <div className="space-y-3">
        {mockProjects.map((project) => (
          <div key={project.id} className="p-3 bg-slate-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{project.name}</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px]",
                  project.status === 'healthy' && "bg-emerald-50 border-emerald-200 text-emerald-700",
                  project.status === 'warning' && "bg-amber-50 border-amber-200 text-amber-700",
                  project.status === 'complete' && "bg-emerald-100 border-emerald-300 text-emerald-800"
                )}
              >
                {project.status === 'complete' ? '✓ 100%' : `${Math.round((project.computed / project.budgetHours) * 100)}%`}
              </Badge>
            </div>
            <Progress 
              value={(project.computed / project.budgetHours) * 100} 
              className="h-2"
            />
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
              <span>Comp: {project.computed}h</span>
              <span>Plan: {project.planned}h</span>
              <span>Presup: {project.budgetHours}h</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Widget de equipo mock para el tour
 */
export function MockTeamWidget() {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-pink-100">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-pink-500" />
        <span className="text-sm font-semibold text-slate-700">Tu equipo este mes</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Compañeros con los que compartes proyectos:
      </p>
      <div className="space-y-2">
        {mockTeammates.map((teammate) => (
          <div key={teammate.name} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                {teammate.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium">{teammate.name}</div>
              <div className="text-[10px] text-slate-500">{teammate.role}</div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {teammate.hours}h juntos
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Widget de índice de fiabilidad mock para el tour
 */
export function MockReliabilityWidget() {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-emerald-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">Índice de fiabilidad</span>
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">92%</Badge>
      </div>
      <div className="relative pt-1">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Precisión de estimaciones</span>
          <span className="font-medium text-emerald-600">Excelente</span>
        </div>
        <Progress value={92} className="h-3" />
      </div>
      <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
        <p className="text-xs text-emerald-700">
          💡 <strong>Consejo:</strong> Tus estimaciones son muy precisas. 
          Mantén este ritmo para seguir siendo confiable en los deadlines.
        </p>
      </div>
    </Card>
  );
}

/**
 * Widget de inconsistencias mock para el tour
 */
export function MockInconsistenciesWidget() {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-amber-100">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-slate-700">Coherencia de planificación</span>
      </div>
      <div className="space-y-2">
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">SEO Mensual [Cliente ABC]</span>
            <div className="flex items-center gap-1 text-amber-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs font-bold">+2h</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-600">
            Deadline: <strong>10h</strong> → Real: <strong>12h</strong>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            Posible intercambio con <strong>Marta Ojeda</strong>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Tabla de tareas mock para el planificador
 */
export function MockTasksTable() {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="bg-indigo-500 text-white px-4 py-2.5 flex items-center justify-between">
        <span className="font-bold">SEO Mensual [Cliente ABC]</span>
        <span className="text-sm opacity-80">(3 tareas)</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="py-2 px-3 text-left font-medium w-8"></th>
            <th className="py-2 px-3 text-left font-medium">Tarea</th>
            <th className="py-2 px-3 text-center font-medium w-20">Horas</th>
            <th className="py-2 px-3 text-center font-medium w-24">Real</th>
            <th className="py-2 px-3 text-center font-medium w-24">Comp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {mockTasks.map((task) => (
            <tr key={task.id} className={cn("hover:bg-slate-50", task.completed && "bg-slate-50/50")}>
              <td className="py-2 px-3">
                <Checkbox checked={task.completed} className={cn(task.completed && "data-[state=checked]:bg-emerald-600")} />
              </td>
              <td className="py-2 px-3">
                <div className="space-y-1">
                  <div className={cn("font-medium", task.completed && "line-through text-slate-400")}>
                    {task.name}
                  </div>
                  {task.dependency && (
                    <div className="flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit border border-amber-200">
                      <Link className="w-2.5 h-2.5" />
                      <span>Dep: {task.dependency} <strong>({task.depOwner})</strong></span>
                    </div>
                  )}
                  {task.blockingUser && (
                    <div className="flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit border border-amber-200">
                      <Users className="w-2.5 h-2.5" />
                      <span>💡 <strong>{task.blockingUser}</strong> te espera</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2 px-3 text-center font-mono">{task.hours}</td>
              <td className="py-2 px-3 text-center">
                {task.completed ? (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono text-xs">
                    {task.hoursActual}h
                  </span>
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </td>
              <td className="py-2 px-3 text-center">
                {task.completed ? (
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded font-mono text-xs">
                    {task.hoursComputed}h
                  </span>
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Barra de acciones mock para el dashboard
 */
export function MockDashboardActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
        <ListPlus className="h-4 w-4" /> Añadir tareas
      </Button>
      <Button variant="outline" className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50">
        <FileDown className="h-4 w-4" /> Tareas CRM
      </Button>
      <Button variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50">
        <Clock className="h-4 w-4" /> Gestión interna
      </Button>
    </div>
  );
}

/**
 * Hook para determinar si mostrar datos mock en el tour
 */
export function useTourMockData(hasRealData: boolean, isTourActive: boolean): boolean {
  return isTourActive && !hasRealData;
}

