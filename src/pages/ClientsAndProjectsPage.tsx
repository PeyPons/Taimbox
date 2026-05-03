import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { Client, Project, Allocation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2, Plus, Search, ChevronLeft, ChevronRight, ChevronDown,
  AlertTriangle, TrendingUp, TrendingDown, Pencil, Trash2, Users,
  FolderOpen, Clock, CalendarDays, ArrowUpRight, ArrowDownRight,
  Minus, Eye, X, ChevronsUpDown, User, Target, Filter, LayoutGrid,
  AlertOctagon, CircleDashed, Ban, CheckCircle2, XCircle, Zap, EyeOff, Link as LinkIcon, Check
} from 'lucide-react';
import { cn, matchesAliasingRule } from '@/lib/utils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { toast } from '@/lib/notify';
import { format, subMonths, addMonths, isSameMonth, parseISO, getDaysInMonth, getDate } from 'date-fns';
import { isAllocationInEffectiveMonth, getWeeksForMonth } from '@/utils/dateUtils';
import { es } from 'date-fns/locale';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { useIntegration } from '@/hooks/useIntegration';
import { Deadline } from '@/types';
import { getEffectiveBudget } from '@/utils/budgetUtils';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { normalizeDepartments, employeeBelongsToDepartment } from '@/utils/departmentUtils';
import { supabase } from '@/lib/supabase';
import { ClientsAndProjectsFilters, type ClientsAndProjectsFiltersValues, type FilterType, type StatusFilter } from '@/components/clients-projects/ClientsAndProjectsFilters';
import { getEffectiveCompletedHours } from '@/utils/hoursTracking';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { PROJECT_TYPE_ENTREGABLE } from '@/config/projectTypePresets';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useDeliverableLifecycleBatch } from '@/hooks/useDeliverableLifecycleBatch';
import { DeliverableLifecycleBadge } from '@/components/projects/DeliverableLifecycleBadge';
import { ProjectMutateDialog } from '@/components/clients-projects/ProjectMutateDialog';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

const colorOptions = [
  '#0d9488', '#dc2626', '#7c3aed', '#ea580c', '#0284c7', '#16a34a',
  '#db2777', '#9333ea', '#f59e0b', '#06b6d4', '#84cc16', '#6366f1'
];

// Componente para estadísticas del header
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = 'slate'
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'slate' | 'emerald' | 'amber' | 'red';
}) {
  const colorClasses = {
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={cn("rounded-xl border p-4 transition-all hover:shadow-md", colorClasses[color])}>
      <div className="flex items-center justify-between">
        <div className={cn(
          "p-2 rounded-lg",
          color === 'slate' && "bg-slate-200/50",
          color === 'emerald' && "bg-emerald-200/50",
          color === 'amber' && "bg-amber-200/50",
          color === 'red' && "bg-red-200/50",
        )}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            trend === 'up' && "text-emerald-600",
            trend === 'down' && "text-red-600",
            trend === 'neutral' && "text-slate-400"
          )}>
            {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {trend === 'neutral' && <Minus className="h-3 w-3" />}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {subValue && <p className="text-[10px] text-muted-foreground/70 mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

export default function ClientsAndProjectsPage() {
  const { t } = useTranslation('app');
  const {
    clients, projects, allocations, employees,
    addClient, updateClient, deleteClient,
    updateProject, deleteProject,
    getClientTotalHoursForMonth, getProjectHoursForMonth,
    updateAllocation,
    ensureMonthLoaded,
  } = useApp();
  const { currentAgency } = useAgency();
  const { selectedDepartmentId } = useDepartmentView();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const focusProjectIdFromState = (location.state as { focusProjectId?: string } | null)?.focusProjectId;
  const focusProjectIdFromUrl =
    searchParams.get('projectId') ?? (typeof focusProjectIdFromState === 'string' ? focusProjectIdFromState : null);
  const isCrmExportEnabled = useIntegration('crm_export');
  const { formatName: formatProjectName } = useProjectAliasing();

  const departmentOptions = normalizeDepartments(currentAgency?.settings?.departments);
  const employeesForView = useMemo(() => {
    if (!selectedDepartmentId || !departmentOptions.length) return employees ?? [];
    const dept = departmentOptions.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
    if (!dept) return employees ?? [];
    return (employees ?? []).filter(e => employeeBelongsToDepartment(e.department, dept.id, dept.name));
  }, [employees, selectedDepartmentId, departmentOptions]);

  // Estados
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [hidingProject, setHidingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Allocation | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'client' | 'project', id: string, name: string } | null>(null);

  // Estados para edición de tarea
  const [editTaskProjectId, setEditTaskProjectId] = useState('');
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskHours, setEditTaskHours] = useState('');
  const [editTaskWeek, setEditTaskWeek] = useState('');
  const [editTaskEmployeeId, setEditTaskEmployeeId] = useState('');
  const [editTaskHoursActual, setEditTaskHoursActual] = useState('');
  const [editTaskHoursComputed, setEditTaskHoursComputed] = useState('');
  const [editTaskDependencyId, setEditTaskDependencyId] = useState('none');

  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [filterSnapshot, setFilterSnapshot] = useState<ClientsAndProjectsFiltersValues>({
    searchQuery: '',
    statusFilter: 'active',
    projectTypeFilter: 'all',
    selectedEmployeeId: 'all',
    activeFilter: 'all',
  });
  const [openEditTaskProject, setOpenEditTaskProject] = useState(false);
  const [openEditTaskEmployee, setOpenEditTaskEmployee] = useState(false);
  const [openEditTaskDependency, setOpenEditTaskDependency] = useState(false);
  const [openEditTaskWeek, setOpenEditTaskWeek] = useState(false);
  const [monthDeadlines, setMonthDeadlines] = useState<Deadline[]>([]);

  // Custom project filters from agency settings
  const { activeFilters, filterProject, getFilterDisplayName } = useProjectFilters();

  // Cargar deadlines del mes (filtrados por agencia)
  useEffect(() => {
    if (!currentAgency?.id) return;
    const load = async () => {
      const selectedMonthStr = format(currentMonth, 'yyyy-MM');
      const { data, error } = await fetchDeadlinesForMonth(selectedMonthStr, currentAgency?.id);
      if (!error && data) setMonthDeadlines(data);
    };
    load();
  }, [currentMonth, currentAgency?.id]);

  useEffect(() => {
    void ensureMonthLoaded(currentMonth);
  }, [currentMonth, ensureMonthLoaded]);

  // Mes anterior para comparación
  const prevMonth = subMonths(currentMonth, 1);

  // Calcular el progreso del mes
  const monthProgress = useMemo(() => {
    const today = new Date();
    if (!isSameMonth(today, currentMonth)) {
      return today > currentMonth ? 100 : 0;
    }
    const daysInMonth = getDaysInMonth(currentMonth);
    const currentDay = getDate(today);
    return Math.round((currentDay / daysInMonth) * 100);
  }, [currentMonth]);

  // Análisis de proyectos con métricas detalladas
  const projectsAnalysis = useMemo(() => {
    return projects.map(project => {
      const client = clients.find(c => c.id === project.clientId);
      const monthTasks = allocations.filter(a =>
        a.projectId === project.id &&
        isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)
      );

      const totalAssigned = monthTasks.reduce((sum, t) => sum + t.hoursAssigned, 0);
      const completedTasks = monthTasks.filter(t => t.status === 'completed');
      const pendingTasks = monthTasks.filter(t => t.status !== 'completed');

      const hoursReal = completedTasks.reduce((sum, t) => sum + (t.hoursActual || 0), 0);
      const hoursComputed = completedTasks.reduce((sum, t) => sum + getEffectiveCompletedHours(t, currentAgency?.settings?.hoursTrackingPreference), 0);
      const gain = hoursComputed - hoursReal;

      // Calcular uso efectivo: Computadas (de completadas) + Planificadas (de pendientes)
      // Esta es la métrica real de consumo del presupuesto que usa el reporte de coherencia
      const effectiveUsage = hoursComputed + pendingTasks.reduce((sum, t) => sum + t.hoursAssigned, 0);

      const deadline = monthDeadlines.find(d => d.projectId === project.id);
      const budget = getEffectiveBudget(project, deadline);
      const minimum = project.minimumHours || 0;

      // Lógica de horas objetivo según el usuario:
      // - Si tiene budgetHours (horas asignadas): DEBE planificar TODAS
      // - Si solo tiene minimumHours: DEBE planificar al menos esas
      // - Si tiene ambas: DEBE planificar todas las budgetHours (las asignadas son obligatorias)
      const targetHours = budget > 0 ? budget : minimum;

      // Cálculos de estado
      // Cálculos de estado
      // Planning % se basa en effectiveUsage para reflejar cuánto "hueco" hemos llenado
      const planningPct = targetHours > 0 ? (effectiveUsage / targetHours) * 100 : 0;
      const executionPct = totalAssigned > 0 ? (hoursComputed / totalAssigned) * 100 : 0;

      // Detección de problemas usando effectiveUsage para mayor precisión
      // Falta planificar: si el uso efectivo (computado + pendiente) es menor al objetivo
      const needsPlanning = minimum > 0
        ? effectiveUsage < minimum
        : (budget > 0 && effectiveUsage < budget);

      const behindSchedule = monthProgress > 30 && executionPct < (monthProgress - 20);

      // Over budget: si el uso efectivo supera el presupuesto
      // Usamos effectiveUsage para detectar si la proyección ya se pasa
      const overBudget = budget > 0 && effectiveUsage > budget;

      const noActivity = targetHours > 0 && totalAssigned === 0;
      const hasIssue = needsPlanning || behindSchedule || overBudget || noActivity;

      // Empleados involucrados
      const involvedEmployees = [...new Set(monthTasks.map(t => t.employeeId))];

      return {
        project,
        client,
        monthTasks,
        totalAssigned,
        completedTasks,
        pendingTasks,
        hoursReal,
        hoursComputed,
        gain,
        budget,
        minimum,
        planningPct,
        executionPct,
        needsPlanning,
        behindSchedule,
        overBudget,
        noActivity,
        hasIssue,
        involvedEmployees,
        effectiveUsage
      };
    });
  }, [projects, clients, allocations, currentMonth, monthProgress]);

  // Agrupar proyectos por cliente
  const clientsWithProjects = useMemo(() => {
    // Identificar proyectos que coinciden con reglas de aliasing
    const aliasingRules = currentAgency?.settings?.projectAliasingRules || [];

    // Agrupar proyectos por regla de aliasing
    const projectsByAliasRule = new Map<string, typeof projects>();

    projects.forEach(project => {
      const matchedRule = matchesAliasingRule(project.name, aliasingRules);
      if (matchedRule && matchedRule.groupAsVirtualClient) {
        const existing = projectsByAliasRule.get(matchedRule.id) || [];
        existing.push(project);
        projectsByAliasRule.set(matchedRule.id, existing);
      }
    });

    const aliasedProjectIds = new Set(
      [...projectsByAliasRule.values()].flat().map(p => p.id)
    );

    // Clientes regulares
    const regularClients = clients.map(client => {
      // Calcular horas a nivel cliente: planificadas (estimadas), computadas y ganancia
      const clientProjectsForStats = projects.filter(p => p.clientId === client.id && !aliasedProjectIds.has(p.id));

      // Horas planificadas (estimadas) - suma de todas las horas asignadas
      const plannedHours = clientProjectsForStats.reduce((sum, project) => {
        const analysis = projectsAnalysis.find(a => a.project.id === project.id);
        return sum + (analysis?.totalAssigned || 0);
      }, 0);

      // Horas computadas - suma de horas computadas de tareas completadas
      const computedHours = clientProjectsForStats.reduce((sum, project) => {
        const analysis = projectsAnalysis.find(a => a.project.id === project.id);
        return sum + (analysis?.hoursComputed || 0);
      }, 0);

      // Horas reales - suma de horas reales de tareas completadas
      const realHours = clientProjectsForStats.reduce((sum, project) => {
        const analysis = projectsAnalysis.find(a => a.project.id === project.id);
        return sum + (analysis?.hoursReal || 0);
      }, 0);

      // Ganancia = computadas - reales
      const gain = computedHours - realHours;

      // Horas contratadas totales del cliente
      const totalBudget = clientProjectsForStats.reduce((sum, p) => sum + (p.budgetHours || 0), 0);

      // Por computar = asignadas - computadas (horas que faltan por facturar)
      const pendingToCompute = totalBudget - computedHours;

      // Contar proyectos con problemas de planificación
      const projectsNeedingPlanning = clientProjectsForStats.filter(project => {
        const analysis = projectsAnalysis.find(a => a.project.id === project.id);
        return analysis?.needsPlanning || analysis?.noActivity;
      }).length;

      // Porcentaje basado en horas planificadas (no computadas)
      const percentage = totalBudget > 0 ? round2((plannedHours / totalBudget) * 100) : 0;

      // Calcular prevStats (mes anterior)
      const prevMonthProjects = projects.filter(p => p.clientId === client.id && !aliasedProjectIds.has(p.id));
      const prevPlannedHours = prevMonthProjects.reduce((sum, project) => {
        const monthTasks = allocations.filter(a =>
          a.projectId === project.id &&
          isAllocationInEffectiveMonth(a.weekStartDate, prevMonth)
        );
        return sum + monthTasks.reduce((s, t) => s + t.hoursAssigned, 0);
      }, 0);

      const clientProjects = projects
        .filter(p => p.clientId === client.id && !aliasedProjectIds.has(p.id) && p.status !== 'completed')
        .map(p => {
          const analysis = projectsAnalysis.find(a => a.project.id === p.id);
          return {
            project: p,
            analysis,
            hours: getProjectHoursForMonth(p.id, currentMonth)
          };
        });

      // Empleados asignados este mes (con objetos completos para avatares)
      const monthAllocations = allocations.filter(a =>
        isAllocationInEffectiveMonth(a.weekStartDate, currentMonth) &&
        clientProjects.some(p => p.project.id === a.projectId)
      );
      const assignedEmployeeIds = [...new Set(monthAllocations.map(a => a.employeeId))];
      const assignedEmployees = assignedEmployeeIds
        .map(id => employees.find(e => e.id === id))
        .filter(Boolean) as typeof employees;

      return {
        client,
        stats: {
          used: plannedHours,  // Horas planificadas (estimadas)
          computed: computedHours,  // Horas computadas
          real: realHours,  // Horas reales
          gain: gain,  // Ganancia (computadas - reales)
          budget: totalBudget,  // Horas asignadas
          pendingToCompute: pendingToCompute,  // Por computar (asignadas - computadas)
          projectsNeedingPlanning: projectsNeedingPlanning,  // Proyectos sin planificar completa
          percentage,
          projects: clientProjects
        },
        prevStats: { used: prevPlannedHours, budget: totalBudget },
        employees: assignedEmployees
      };
    });

    // Agregar clientes virtuales para cada regla de aliasing con proyectos
    projectsByAliasRule.forEach((aliasProjects, ruleId) => {
      // Excluir completados por defecto
      const visibleAliasProjects = aliasProjects.filter(p => p.status !== 'completed');
      if (visibleAliasProjects.length > 0) {
        const rule = aliasingRules.find(r => r.id === ruleId);
        const aliasProjectsWithAnalysis = visibleAliasProjects.map(p => {
          const analysis = projectsAnalysis.find(a => a.project.id === p.id);
          return {
            project: p,
            analysis,
            hours: getProjectHoursForMonth(p.id, currentMonth)
          };
        });

        const totalUsed = aliasProjectsWithAnalysis.reduce((sum, p) => sum + p.hours.used, 0);
        const totalBudget = aliasProjectsWithAnalysis.reduce((sum, p) => sum + p.hours.budget, 0);
        const percentage = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

        const monthAllocations = allocations.filter(a =>
          isAllocationInEffectiveMonth(a.weekStartDate, currentMonth) &&
          visibleAliasProjects.some(p => p.id === a.projectId)
        );
        const assignedEmployeeIds = [...new Set(monthAllocations.map(a => a.employeeId))];
        const assignedEmployees = assignedEmployeeIds
          .map(id => employees.find(e => e.id === id))
          .filter(Boolean) as typeof employees;

        // Calcular horas planificadas, computadas y ganancia
        const aliasPlannedHours = aliasProjectsWithAnalysis.reduce((sum, p) => sum + (p.analysis?.totalAssigned || 0), 0);
        const aliasComputedHours = aliasProjectsWithAnalysis.reduce((sum, p) => sum + (p.analysis?.hoursComputed || 0), 0);
        const aliasRealHours = aliasProjectsWithAnalysis.reduce((sum, p) => sum + (p.analysis?.hoursReal || 0), 0);
        const aliasGain = aliasComputedHours - aliasRealHours;
        const aliasPendingToCompute = totalBudget - aliasComputedHours;
        const aliasPercentage = totalBudget > 0 ? round2((aliasPlannedHours / totalBudget) * 100) : 0;
        const aliasProjectsNeedingPlanning = aliasProjectsWithAnalysis.filter(p =>
          p.analysis?.needsPlanning || p.analysis?.noActivity
        ).length;

        regularClients.push({
          client: {
            id: ruleId,
            name: rule?.virtualClientName || ruleId,
            color: rule?.virtualClientColor || '#10b981'
          } as Client,
          stats: {
            used: aliasPlannedHours,  // Horas planificadas
            computed: aliasComputedHours,  // Horas computadas
            real: aliasRealHours,  // Horas reales
            gain: aliasGain,  // Ganancia
            budget: totalBudget,  // Horas asignadas
            pendingToCompute: aliasPendingToCompute,  // Por computar
            projectsNeedingPlanning: aliasProjectsNeedingPlanning,  // Proyectos sin planificar
            percentage: aliasPercentage,
            projects: aliasProjectsWithAnalysis
          },
          prevStats: { used: 0, budget: 0 },
          employees: assignedEmployees
        });
      }
    });

    return regularClients;
  }, [clients, projects, projectsAnalysis, allocations, employees, currentMonth, prevMonth, getProjectHoursForMonth]);

  /** Cliente virtual o real bajo el que se lista el proyecto (aliasing agrupa en otro id que `project.clientId`). */
  const focusSectionClientId = useMemo(() => {
    if (!focusProjectIdFromUrl) return null;
    for (const row of clientsWithProjects) {
      if (row.stats.projects.some((p) => p.project.id === focusProjectIdFromUrl)) {
        return row.client.id;
      }
    }
    return null;
  }, [clientsWithProjects, focusProjectIdFromUrl]);

  /** Desde ?projectId=: expandir la sección correcta y hacer scroll (tras pintar la lista). */
  useEffect(() => {
    if (!focusProjectIdFromUrl || !focusSectionClientId) return;
    setExpandedClients((prev) => new Set(prev).add(focusSectionClientId));
    setExpandedProjects((prev) => new Set(prev).add(focusProjectIdFromUrl));
    const t = window.setTimeout(() => {
      document.getElementById(`project-focus-${focusProjectIdFromUrl}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [focusProjectIdFromUrl, focusSectionClientId]);

  // Filtrar clientes y proyectos (valores de filtro desde ClientsAndProjectsFilters vía filterSnapshot)
  const filteredClients = useMemo(() => {
    const { searchQuery, statusFilter, selectedEmployeeId, projectTypeFilter, activeFilter } = filterSnapshot;
    return clientsWithProjects
      .filter(({ client, stats }) => {
        if (focusProjectIdFromUrl) {
          const hasProject = stats.projects.some((p) => p.project.id === focusProjectIdFromUrl);
          if (!hasProject) return false;
          return true;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const clientMatch = client.name.toLowerCase().includes(query);
          const projectMatch = stats.projects.some(p =>
            p.project.name.toLowerCase().includes(query)
          );
          if (!clientMatch && !projectMatch) return false;
        }
        if (statusFilter !== 'all') {
          const hasMatchingStatus = stats.projects.some(p => {
            if (statusFilter === 'active') return p.project.status === 'active' && !p.project.isHidden;
            if (statusFilter === 'completed') return p.project.status === 'completed';
            if (statusFilter === 'archived') return p.project.status === 'archived';
            if (statusFilter === 'hidden') return p.project.isHidden === true;
            return false;
          });
          if (!hasMatchingStatus) return false;
        }
        if (selectedEmployeeId !== 'all') {
          const hasEmployee = stats.projects.some(p =>
            p.analysis?.involvedEmployees.includes(selectedEmployeeId)
          );
          if (!hasEmployee) return false;
        }
        return true;
      })
      .map(({ client, stats, prevStats, employees }) => {
        const filteredProjects = stats.projects.filter(({ project, analysis }) => {
          if (focusProjectIdFromUrl) {
            return project.id === focusProjectIdFromUrl;
          }
          if (!analysis) return false;
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const rawMatch = project.name.toLowerCase().includes(query);
            const formattedName = formatProjectName(project.name);
            const formattedMatch = formattedName.toLowerCase().includes(query);
            if (!rawMatch && !formattedMatch) return false;
          }
          if (statusFilter !== 'all') {
            if (statusFilter === 'active' && (project.status !== 'active' || project.isHidden)) return false;
            if (statusFilter === 'completed' && project.status !== 'completed') return false;
            if (statusFilter === 'archived' && project.status !== 'archived') return false;
            if (statusFilter === 'hidden' && !project.isHidden) return false;
          } else {
            if (project.isHidden) return false;
          }
          if (projectTypeFilter !== 'all') {
            if (!filterProject(project, projectTypeFilter)) return false;
          }
          switch (activeFilter) {
            case 'needs-planning':
              return analysis.needsPlanning && !analysis.noActivity;
            case 'behind-schedule':
              return analysis.behindSchedule;
            case 'over-budget':
              return analysis.overBudget;
            case 'no-activity':
              return analysis.noActivity;
            default:
              return true;
          }
        });

        // Ordenar proyectos dentro del cliente
        const sortedProjects = filteredProjects.sort((a, b) => {
          // 1. Proyectos con problemas primero (sin actividad, falta planificar)
          const aHasIssue = a.analysis?.noActivity || a.analysis?.needsPlanning;
          const bHasIssue = b.analysis?.noActivity || b.analysis?.needsPlanning;
          if (aHasIssue && !bHasIssue) return -1;
          if (!aHasIssue && bHasIssue) return 1;

          // 2. Por horas asignadas (mayor a menor)
          const aBudget = a.project.budgetHours || 0;
          const bBudget = b.project.budgetHours || 0;
          if (bBudget !== aBudget) return bBudget - aBudget;

          // 3. Por horas NO computadas (más pendiente = más arriba)
          const aPending = (a.analysis?.totalAssigned || 0) - (a.analysis?.hoursComputed || 0);
          const bPending = (b.analysis?.totalAssigned || 0) - (b.analysis?.hoursComputed || 0);
          if (bPending !== aPending) return bPending - aPending;

          // 4. Alfabéticamente
          return a.project.name.localeCompare(b.project.name);
        });

        // RECALCULAR métricas basándose en proyectos FILTRADOS (no todos)
        const filteredBudget = sortedProjects.reduce((sum, p) => sum + (p.project.budgetHours || 0), 0);
        const filteredComputed = sortedProjects.reduce((sum, p) => sum + (p.analysis?.hoursComputed || 0), 0);
        const filteredPlanned = sortedProjects.reduce((sum, p) => sum + (p.analysis?.totalAssigned || 0), 0);
        const filteredReal = sortedProjects.reduce((sum, p) => sum + (p.analysis?.hoursReal || 0), 0);
        const filteredGain = filteredComputed - filteredReal;
        const filteredPendingToCompute = filteredBudget - filteredComputed;
        const filteredPercentage = filteredBudget > 0 ? round2((filteredPlanned / filteredBudget) * 100) : 0;
        const filteredProjectsNeedingPlanning = sortedProjects.filter(p =>
          p.analysis?.needsPlanning || p.analysis?.noActivity
        ).length;

        return {
          client,
          stats: {
            used: filteredPlanned,
            computed: filteredComputed,
            real: filteredReal,
            gain: filteredGain,
            budget: filteredBudget,
            pendingToCompute: filteredPendingToCompute,
            projectsNeedingPlanning: filteredProjectsNeedingPlanning,
            percentage: filteredPercentage,
            projects: sortedProjects
          },
          prevStats,
          employees
        };
      })
      .filter(({ stats }) => stats.projects.length > 0) // Solo mostrar clientes con proyectos visibles
      .sort((a, b) => {
        // Kit Digital y entregables siempre al final
        const aIsSpecial = a.client.id === 'kit-digital' || a.client.name.toLowerCase().includes('entregable');
        const bIsSpecial = b.client.id === 'kit-digital' || b.client.name.toLowerCase().includes('entregable');

        if (aIsSpecial && !bIsSpecial) return 1;
        if (!aIsSpecial && bIsSpecial) return -1;
        if (aIsSpecial && bIsSpecial) return a.client.name.localeCompare(b.client.name);

        // Ordenar por horas CONTRATADAS (mayor a menor) - no por planificadas
        const aBudget = a.stats.budget || 0;
        const bBudget = b.stats.budget || 0;
        if (bBudget !== aBudget) return bBudget - aBudget;

        // Si tienen las mismas horas, ordenar alfabéticamente
        return a.client.name.localeCompare(b.client.name);
      });
  }, [clientsWithProjects, filterSnapshot, focusProjectIdFromUrl]);

  /** Solo entregables de clientes expandidos: el badge solo se pinta ahí; evita N× fetch de fase para toda la agencia. */
  const deliverableLifecycleBatchIds = useMemo(() => {
    const ids: string[] = [];
    for (const { client, stats } of filteredClients) {
      if (!expandedClients.has(client.id)) continue;
      for (const { project } of stats.projects) {
        if (project.projectType === PROJECT_TYPE_ENTREGABLE) ids.push(project.id);
      }
    }
    return ids;
  }, [filteredClients, expandedClients]);

  const { data: deliverableLifecycleByProjectId } = useDeliverableLifecycleBatch(deliverableLifecycleBatchIds, {
    costModeOverride: 'standard',
  });

  // Estadísticas globales
  const globalStats = useMemo(() => {
    const totalClients = filteredClients.length;
    const totalHours = filteredClients.reduce((sum, c) => sum + c.stats.used, 0);
    const totalBudget = filteredClients.reduce((sum, c) => sum + c.stats.budget, 0);
    const prevTotalHours = filteredClients.reduce((sum, c) => sum + c.prevStats.used, 0);
    const atRisk = filteredClients.filter(c => c.stats.percentage > 85 && c.stats.percentage <= 100).length;
    const overBudget = filteredClients.filter(c => c.stats.percentage > 100).length;

    return {
      totalClients,
      totalHours,
      totalBudget,
      prevTotalHours,
      atRisk,
      overBudget,
      trend: totalHours > prevTotalHours ? 'up' : totalHours < prevTotalHours ? 'down' : 'neutral'
    };
  }, [filteredClients]);

  // Handlers
  const clientFormSchema = z.object({
    name: z.string().min(1, t('clientsAndProjects.dialogs.newClient.nameRequired', 'El nombre es obligatorio')),
    color: z.string(),
  });

  type ClientFormValues = z.infer<typeof clientFormSchema>;

  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      color: colorOptions[0],
    },
  });

  const handleAddClient = (data: ClientFormValues) => {
    addClient({
      name: data.name || 'Nuevo Cliente',
      color: data.color || '#000000',
      agencyId: currentAgency?.id || ''
    });
    setIsAddingClient(false);
    clientForm.reset();
    toast.success(t('clientsAndProjects.dialogs.newClient.created', { name: data.name, defaultValue: `${data.name} creado` }));
  };

  const handleUpdateClient = () => {
    if (!editingClient || !editingClient.name.trim()) {
      toast.error(t('clientsAndProjects.dialogs.newClient.nameRequired', 'El nombre es obligatorio'));
      return;
    }
    updateClient(editingClient);
    setEditingClient(null);
    toast.success(t('clientsAndProjects.dialogs.newClient.updated', { name: editingClient.name, defaultValue: `${editingClient.name} actualizado` }));
  };

  const handleDeleteClient = () => {
    if (!editingClient) return;
    setDeleteConfirmation({ type: 'client', id: editingClient.id, name: editingClient.name });
  };

  const openNewProject = () => {
    setIsAddingProject(true);
    setEditingProject(null);
  };

  const openEditProject = (project: Project) => {
    setIsAddingProject(false);
    setEditingProject(project);
  };

  const openEditTask = (task: Allocation) => {
    setEditingTask(task);
    setEditTaskProjectId(task.projectId);
    setEditTaskName(task.taskName || '');
    setEditTaskHours(task.hoursAssigned.toString());
    setEditTaskWeek(task.weekStartDate);
    setEditTaskEmployeeId(task.employeeId);
    setEditTaskHoursActual((task.hoursActual || 0).toString());
    setEditTaskHoursComputed((task.hoursComputed || 0).toString());
    setEditTaskDependencyId(task.dependencyId || 'none');
  };

  const handleSaveTask = async () => {
    if (!editingTask) return;

    if (!editTaskProjectId || !editTaskName.trim() || !editTaskHours || !editTaskWeek || !editTaskEmployeeId) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      await updateAllocation({
        ...editingTask,
        projectId: editTaskProjectId,
        taskName: editTaskName,
        hoursAssigned: parseFloat(editTaskHours) || 0,
        weekStartDate: editTaskWeek,
        employeeId: editTaskEmployeeId,
        hoursActual: parseFloat(editTaskHoursActual) || undefined,
        hoursComputed: parseFloat(editTaskHoursComputed) || undefined,
        dependencyId: editTaskDependencyId === 'none' ? undefined : editTaskDependencyId
      });
      toast.success('Tarea actualizada');
      setEditingTask(null);
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      toast.error('Error al actualizar la tarea');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      if (deleteConfirmation.type === 'client') {
        const clientName = deleteConfirmation.name;
        deleteClient(deleteConfirmation.id);
        setEditingClient(null); // Close client dialog if open
        toast.success(`${clientName} eliminado`);
      } else if (deleteConfirmation.type === 'project') {
        await deleteProject(deleteConfirmation.id);
        setEditingProject(null); // Close project dialog if open
        toast.success('Proyecto eliminado');
      }
    } catch (e) {
      console.error('Error eliminando:', e);
      const errorMessage = (e as Error)?.message || 'Error al eliminar';
      toast.error(errorMessage);
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleHideProject = async () => {
    if (!hidingProject) return;
    try {
      const newHiddenState = !hidingProject.isHidden;
      await updateProject({ ...hidingProject, isHidden: newHiddenState });
      setHidingProject(null);
      toast.success(newHiddenState ? 'Proyecto ocultado' : 'Proyecto visible');
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar");
    }
  };

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const expandAll = () => {
    const allClientIds = new Set(filteredClients.map(c => c.client.id));
    setExpandedClients(allClientIds);
    const allProjectIds = new Set(
      filteredClients.flatMap(c => c.stats.projects.map(p => p.project.id))
    );
    setExpandedProjects(allProjectIds);
  };

  const collapseAll = () => {
    setExpandedClients(new Set());
    setExpandedProjects(new Set());
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Clientes y Proyectos</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tus clientes y proyectos con análisis detallado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de mes */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[120px] text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setCurrentMonth(new Date())}
              aria-label="Mes actual"
            >
              Mes actual
            </Button>
          </div>

          {/* Botón añadir proyecto */}
          <Button
            className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md"
            onClick={openNewProject}
          >
            <Plus className="h-4 w-4" />
            {t('clientsAndProjects.actions.newProject', 'Nuevo proyecto')}
          </Button>

          <ProjectMutateDialog
            open={isAddingProject || editingProject !== null}
            onOpenChange={(open) => {
              if (!open) {
                setIsAddingProject(false);
                setEditingProject(null);
              }
            }}
            mode={isAddingProject ? 'create' : 'edit'}
            editingProject={editingProject}
            clients={clients}
            departmentOptions={departmentOptions}
            isCrmExportEnabled={isCrmExportEnabled}
            onRequestDelete={(proj) =>
              setDeleteConfirmation({ type: 'project', id: proj.id, name: proj.name })
            }
          />

          {/* Botón añadir cliente */}
          <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md">
                <Plus className="h-4 w-4" />
                Nuevo cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo cliente</DialogTitle>
                <DialogDescription>
                  Crea un nuevo cliente para organizar tus proyectos.
                </DialogDescription>
              </DialogHeader>
              <Form {...clientForm}>
                <form onSubmit={clientForm.handleSubmit(handleAddClient)} className="space-y-4 py-4">
                  <FormField
                    control={clientForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => field.onChange(color)}
                              className={cn(
                                "h-9 w-9 rounded-lg transition-all hover:scale-110",
                                field.value === color && "ring-2 ring-offset-2 ring-indigo-500"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddingClient(false)}>Cancelar</Button>
                    <Button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600">
                      Crear cliente
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Building2}
          label={t('clientsAndProjects.stats.totalClients', 'Total clientes')}
          value={globalStats.totalClients}
          color="slate"
        />
        <StatCard
          icon={Clock}
          label={t('clientsAndProjects.stats.hoursThisMonth', 'Horas este mes')}
          value={`${globalStats.totalHours.toFixed(0)}h`}
          subValue={t('clientsAndProjects.stats.assignedHours', { budget: globalStats.totalBudget.toFixed(0), defaultValue: `de ${globalStats.totalBudget.toFixed(0)}h asignadas` })}
          trend={globalStats.trend as 'up' | 'down' | 'neutral'}
          color="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          label={t('clientsAndProjects.stats.atRisk', 'En riesgo')}
          value={globalStats.atRisk}
          subValue={t('clientsAndProjects.stats.atRiskDescription', '>85% de horas contratadas')}
          color={globalStats.atRisk > 0 ? 'amber' : 'slate'}
        />
        <StatCard
          icon={TrendingUp}
          label={t('clientsAndProjects.stats.overBudget', 'Excedidos')}
          value={globalStats.overBudget}
          subValue={t('clientsAndProjects.stats.overBudgetDescription', '>100% de horas contratadas')}
          color={globalStats.overBudget > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Filtros: estado interno en ClientsAndProjectsFilters; página usa filterSnapshot vía onFiltersChange */}
      <ClientsAndProjectsFilters
        activeFilters={activeFilters}
        employees={employeesForView}
        onFiltersChange={setFilterSnapshot}
      />

      {/* Acciones de lista */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {t('clientsAndProjects.clientList.count', { count: filteredClients.length, defaultValue: `${filteredClients.length} cliente${filteredClients.length !== 1 ? 's' : ''}` })}
          {' • '}
          {t('clientsAndProjects.clientList.projects', { count: filteredClients.reduce((sum, c) => sum + c.stats.projects.length, 0), defaultValue: `${filteredClients.reduce((sum, c) => sum + c.stats.projects.length, 0)} proyecto${filteredClients.reduce((sum, c) => sum + c.stats.projects.length, 0) !== 1 ? 's' : ''}` })}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs h-7">
            {t('clientsAndProjects.actions.expandAll', 'Expandir todos')}
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs h-7">
            {t('clientsAndProjects.actions.collapseAll', 'Colapsar todos')}
          </Button>
        </div>
      </div>

      {/* Lista de clientes con proyectos */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">{t('clientsAndProjects.clientList.noResults', 'No hay clientes con estos filtros')}</p>
              <p className="text-sm text-slate-400 mt-1">{t('clientsAndProjects.clientList.noResultsSub', 'Prueba con otros criterios de búsqueda')}</p>
            </div>
          </Card>
        ) : (
          filteredClients.map(({ client, stats, prevStats, employees: assignedEmployees }) => {
            const isExpanded = expandedClients.has(client.id);
            const isOverBudget = stats.percentage > 100;
            const isNearLimit = stats.percentage > 85 && stats.percentage <= 100;
            const trend = stats.used - prevStats.used;

            return (
              <div key={client.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {/* Cabecera del cliente */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleClient(client.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleClient(client.id);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  )}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: client.color }}
                  />
                  <span className="font-bold text-slate-800 flex-1 text-left">
                    <SensitiveText kind="account" id={client.id}>{client.name}</SensitiveText>
                  </span>
                  <div className="flex items-center gap-5 flex-shrink-0">
                    {/* Resumen de horas - Simplificado: 4 métricas principales */}
                    <div className="flex items-center gap-5">
                      {/* Horas asignadas */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-[10px] text-slate-400 uppercase block">{t('clientsAndProjects.stats.contracted', 'Contratadas')}</span>
                        <span className="font-bold text-slate-800">{stats.budget.toFixed(0)}h</span>
                      </div>

                      {/* Horas computadas */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-[10px] text-slate-400 uppercase block">{t('clientsAndProjects.stats.computed', 'Computadas')}</span>
                        <span className={cn(
                          "font-bold",
                          isOverBudget && "text-red-600",
                          isNearLimit && "text-amber-600",
                          !isOverBudget && !isNearLimit && "text-emerald-600"
                        )}>
                          {stats.computed?.toFixed(1) || '0.0'}h
                        </span>
                      </div>

                      {/* Horas por computar */}
                      <div className="text-right min-w-[80px]">
                        <span className="text-[10px] text-slate-400 uppercase block">{t('clientsAndProjects.stats.toCompute', 'Por computar')}</span>
                        <span className={cn(
                          "font-bold",
                          (stats.pendingToCompute || 0) > 0 ? "text-blue-600" : "text-slate-400"
                        )}>
                          {(stats.pendingToCompute || 0).toFixed(1)}h
                        </span>
                      </div>

                      {/* Barra de progreso compacta */}
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(stats.percentage, 100)}
                          className={cn(
                            "h-2 w-24",
                            isOverBudget && "[&>div]:bg-red-500",
                            isNearLimit && "[&>div]:bg-amber-500",
                            !isOverBudget && !isNearLimit && "[&>div]:bg-emerald-500"
                          )}
                        />
                        <span className={cn(
                          "text-sm font-bold w-12 text-right",
                          isOverBudget && "text-red-600",
                          isNearLimit && "text-amber-600",
                          !isOverBudget && !isNearLimit && "text-slate-600"
                        )}>
                          {stats.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Badges de estado */}
                    <div className="flex items-center gap-1.5">
                      {isOverBudget && (
                        <Badge variant="destructive" className="text-[10px] h-5 gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {t('clientsAndProjects.stats.overBudget', 'Excedido')}
                        </Badge>
                      )}
                      {isNearLimit && !isOverBudget && (
                        <Badge className="text-[10px] h-5 gap-1 bg-amber-100 text-amber-700 border-amber-200">
                          <TrendingUp className="h-3 w-3" />
                          {t('clientsAndProjects.filters.quick.behindSchedule', 'Casi lleno')}
                        </Badge>
                      )}
                      {/* Badge de proyectos sin planificar - NUEVO */}
                      {(stats.projectsNeedingPlanning || 0) > 0 && (
                        <Badge className="text-[10px] h-5 gap-1 bg-orange-100 text-orange-700 border-orange-200">
                          <CircleDashed className="h-3 w-3" />
                          {t('clientsAndProjects.clientList.unplanned', { count: stats.projectsNeedingPlanning, defaultValue: `${stats.projectsNeedingPlanning} sin planificar` })}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {t('clientsAndProjects.clientList.projects', { count: stats.projects.length, defaultValue: `${stats.projects.length} proyecto${stats.projects.length !== 1 ? 's' : ''}` })}
                      </Badge>
                    </div>

                    {/* Botón de acción */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingClient({ ...client }); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('clientsAndProjects.actions.edit', 'Editar')}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Proyectos del cliente */}
                {isExpanded && (
                  <div className="border-t divide-y divide-slate-100">
                    {stats.projects.length > 0 ? (
                      stats.projects.map(({ project, analysis }) => {
                        if (!analysis) return null;

                        const isProjectExpanded = expandedProjects.has(project.id);
                        const isProjectOverBudget = analysis.overBudget;
                        const isProjectNearLimit = analysis.planningPct > 85 && !analysis.overBudget;

                        return (
                          <div key={project.id} id={`project-focus-${project.id}`} className="mb-2 scroll-mt-24">
                            {/* Header del proyecto */}
                            <Collapsible
                              open={isProjectExpanded}
                              onOpenChange={() => toggleProject(project.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <div className={cn(
                                  "px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                                  isProjectOverBudget && "bg-red-50/40 border-l-red-500",
                                  isProjectNearLimit && "bg-amber-50/40 border-l-amber-500",
                                  project.status === 'completed' && "bg-slate-50/60 border-l-slate-400",
                                  project.status === 'archived' && "bg-slate-100/60 border-l-slate-500",
                                  !isProjectOverBudget && !isProjectNearLimit && project.status === 'active' && "border-l-emerald-500"
                                )}>
                                  <div className="flex items-center gap-3 group">
                                    <ChevronDown className={cn(
                                      "h-4 w-4 text-slate-400 transition-transform shrink-0",
                                      isProjectExpanded && "rotate-180"
                                    )} />
                                    <div
                                      className="h-2 w-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: client.color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-slate-800 truncate">
                                          <SensitiveText kind="project" id={project.id}>
                                            {formatProjectName(project.name)}
                                          </SensitiveText>
                                        </p>
                                        {deliverableLifecycleByProjectId.has(project.id) && (
                                          <DeliverableLifecycleBadge
                                            projectId={project.id}
                                            lifecycle={deliverableLifecycleByProjectId.get(project.id)!}
                                            disableAutoFetch
                                            className="mt-0"
                                          />
                                        )}

                                        {/* Badges de estado del proyecto */}
                                        <TooltipProvider>
                                          {project.status === 'completed' && (
                                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                              <CheckCircle2 className="h-3 w-3 mr-1" />
                                              {t('clientsAndProjects.projectCard.completed', 'Completado')}
                                            </Badge>
                                          )}
                                          {project.status === 'archived' && (
                                            <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-300">
                                              <XCircle className="h-3 w-3 mr-1" />
                                              {t('clientsAndProjects.projectCard.archived', 'Archivado')}
                                            </Badge>
                                          )}
                                          {analysis.noActivity && (
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-slate-200 cursor-help">
                                                  {t('clientsAndProjects.projectCard.noActivity', 'Sin actividad')}
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">{t('clientsAndProjects.projectCard.noActivityTooltip', 'No hay tareas planificadas este mes')}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                          {analysis.needsPlanning && !analysis.noActivity && (
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 cursor-help">
                                                  {t('clientsAndProjects.projectCard.percentagePlanned', { percentage: round2(analysis.planningPct), defaultValue: `${round2(analysis.planningPct)}% planificado` })}
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">
                                                  {analysis.budget > 0
                                                    ? t('clientsAndProjects.projectCard.missingHours_budget', { hours: round2(analysis.budget - analysis.effectiveUsage), budget: analysis.budget, defaultValue: `Faltan ${round2(analysis.budget - analysis.effectiveUsage)}h de ${analysis.budget}h asignadas` })
                                                    : t('clientsAndProjects.projectCard.missingHours_min', { hours: round2((analysis.project.minimumHours || 0) - analysis.effectiveUsage), min: analysis.project.minimumHours || 0, defaultValue: `Faltan ${round2((analysis.project.minimumHours || 0) - analysis.effectiveUsage)}h de ${analysis.project.minimumHours || 0}h mínimas` })
                                                  }
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                          {analysis.behindSchedule && (
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 cursor-help">
                                                  {t('clientsAndProjects.projectCard.percentageComputed', { percentage: round2(analysis.executionPct), defaultValue: `${round2(analysis.executionPct)}% computado` })}
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">{t('clientsAndProjects.filters.quick.behindScheduleTooltip', 'Ejecución por debajo del progreso del mes')}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                          {analysis.overBudget && (
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200 cursor-help">
                                                  {t('clientsAndProjects.projectCard.hoursExcess', { hours: round2(analysis.effectiveUsage - analysis.budget), defaultValue: `+${round2(analysis.effectiveUsage - analysis.budget)}h exceso` })}
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">
                                                  {t('clientsAndProjects.projectCard.excessProjection', { total: round2(analysis.effectiveUsage), budget: analysis.budget, defaultValue: `Proyección total: ${round2(analysis.effectiveUsage)}h (de ${analysis.budget}h asignadas)` })}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                        </TooltipProvider>
                                      </div>

                                      <div className="flex items-center gap-3 mt-1.5">
                                        {/* Mini barra de progreso */}
                                        {analysis.budget > 0 && (
                                          <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${Math.min(100, (analysis.hoursComputed / analysis.budget) * 100)}%` }}
                                              />
                                            </div>
                                            <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                                              {round2((analysis.hoursComputed / analysis.budget) * 100)}%
                                            </span>
                                          </div>
                                        )}

                                        {/* Métricas rápidas */}
                                        <div className="hidden md:flex items-center gap-4 text-sm shrink-0">
                                          <div className="text-center min-w-[80px]">
                                            <p className={cn(
                                              "font-mono font-bold text-xs",
                                              analysis.overBudget ? "text-red-600" :
                                                analysis.needsPlanning ? "text-amber-600" : "text-slate-700"
                                            )}>
                                              {round2(analysis.totalAssigned)}h
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                              {analysis.budget > 0 ? t('clientsAndProjects.stats.assignedHours', { budget: analysis.budget, defaultValue: `de ${analysis.budget}h` }) : t('clientsAndProjects.stats.estimated', 'estimado')}
                                            </p>
                                          </div>
                                          <div className="text-center min-w-[70px]">
                                            <p className="font-mono font-bold text-xs text-emerald-600">
                                              {round2(analysis.hoursComputed)}h
                                            </p>
                                            <p className="text-[10px] text-slate-400">{t('clientsAndProjects.stats.computed', 'computado')}</p>
                                          </div>
                                          {Math.abs(analysis.gain) > 0.01 && (
                                            <div className={cn(
                                              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                                              analysis.gain > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                            )}>
                                              {analysis.gain > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                              {analysis.gain > 0 ? '+' : ''}{round2(analysis.gain)}h
                                            </div>
                                          )}
                                          <div className="text-center min-w-[50px]">
                                            <p className="font-mono text-xs text-slate-600">
                                              <span className="text-emerald-600">{analysis.completedTasks.length}</span>
                                              <span className="text-slate-300">/</span>
                                              <span>{analysis.monthTasks.length}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-400">{t('clientsAndProjects.projectCard.tasks_plural', 'tareas')}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-slate-600 shrink-0"
                                            onClick={(e) => { e.stopPropagation(); openEditProject(project); }}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('clientsAndProjects.actions.edit', 'Editar')}</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-slate-600 shrink-0"
                                            onClick={(e) => { e.stopPropagation(); setHidingProject(project); }}
                                          >
                                            {project.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{project.isHidden ? t('clientsAndProjects.actions.showProject', 'Mostrar proyecto') : t('clientsAndProjects.actions.hideProject', 'Ocultar proyecto')}</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleTrigger>

                              {/* Contenido expandido del proyecto */}
                              <CollapsibleContent>
                                <div className="border-t bg-slate-50/50 mb-2">
                                  {/* Barra de progreso detallada */}
                                  {analysis.budget > 0 && (
                                    <div className="px-4 py-3 border-b bg-white">
                                      <div className="flex justify-between text-xs mb-2">
                                        <span className="text-slate-600">
                                          {analysis.effectiveUsage > analysis.totalAssigned ? (
                                            <><span className="font-semibold text-slate-800">{round2(analysis.effectiveUsage)}h</span> {t('clientsAndProjects.stats.estimated', 'proyección')}</>
                                          ) : (
                                            <><span className="font-semibold text-slate-800">{round2(analysis.totalAssigned)}h</span> {t('clientsAndProjects.stats.estimated', 'estimadas')}</>
                                          )}
                                          {(() => {

                                            const targetHours = analysis.project.budgetHours > 0
                                              ? analysis.project.budgetHours
                                              : (analysis.project.minimumHours || 0);

                                            // Usar effectiveUsage para determinar si falta o sobra
                                            // Esto alinea la lógica con el reporte de coherencia
                                            if (analysis.effectiveUsage < targetHours) {
                                              return (
                                                <span className="text-amber-600 ml-2">
                                                  {analysis.project.budgetHours > 0
                                                    ? t('clientsAndProjects.projectCard.missingHours_budget', { hours: round2(targetHours - analysis.effectiveUsage), budget: analysis.project.budgetHours, defaultValue: `(Faltan ${round2(targetHours - analysis.effectiveUsage)}h de ${analysis.project.budgetHours}h asignadas)` })
                                                    : t('clientsAndProjects.projectCard.missingHours_min', { hours: round2(targetHours - analysis.effectiveUsage), min: analysis.project.minimumHours || 0, defaultValue: `(Faltan ${round2(targetHours - analysis.effectiveUsage)}h de ${analysis.project.minimumHours || 0}h mínimas)` })
                                                  }
                                                </span>
                                              );
                                            }
                                            if (analysis.overBudget || analysis.effectiveUsage > targetHours) {
                                              return (
                                                <span className="text-red-600 ml-2">
                                                  {t('clientsAndProjects.projectCard.excessHours', { hours: round2(analysis.effectiveUsage - targetHours), defaultValue: `(+${round2(analysis.effectiveUsage - targetHours)}h de exceso)` })}
                                                </span>
                                              );
                                            }
                                            return null;
                                          })()}
                                        </span>
                                        <span className="text-slate-500">
                                          {analysis.project.budgetHours > 0 ? (
                                            <>{t('clientsAndProjects.stats.assignedHours', { budget: analysis.project.budgetHours, defaultValue: `Asignadas: ${analysis.project.budgetHours}h` })}</>
                                          ) : (
                                            <>{t('clientsAndProjects.projectCard.missingHours_min', { hours: 0, min: analysis.project.minimumHours || 0, defaultValue: `Mínimas: ${analysis.project.minimumHours || 0}h` })}</>
                                          )}
                                        </span>
                                      </div>

                                      {/* Barras: estimado (planificado), real y computado */}
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-slate-400 w-16">{t('clientsAndProjects.projectCard.hoursPlanned', 'Estimado')}</span>
                                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                              className={cn(
                                                "h-full rounded-full transition-all",
                                                analysis.overBudget ? "bg-red-500" :
                                                  analysis.planningPct < 50 ? "bg-amber-500" : "bg-blue-500"
                                              )}
                                              style={{ width: `${Math.min(100, analysis.planningPct)}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-medium text-slate-600 w-12 text-right">
                                            {round2(analysis.planningPct)}%
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-slate-400 w-16">{t('clientsAndProjects.projectCard.hoursReal', 'Real')}</span>
                                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-blue-500 rounded-full transition-all"
                                              style={{ width: `${Math.min(100, analysis.budget > 0 ? (analysis.hoursReal / analysis.budget) * 100 : 0)}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-medium text-blue-600 w-12 text-right">
                                            {round2(analysis.budget > 0 ? (analysis.hoursReal / analysis.budget) * 100 : 0)}%
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-slate-400 w-16">{t('clientsAndProjects.projectCard.hoursComputed', 'Computado')}</span>
                                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-emerald-500 rounded-full transition-all"
                                              style={{ width: `${Math.min(100, (analysis.hoursComputed / analysis.budget) * 100)}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-medium text-emerald-600 w-12 text-right">
                                            {round2((analysis.hoursComputed / analysis.budget) * 100)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Tareas pendientes */}
                                  <div className="p-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                      {t('clientsAndProjects.projectCard.pendingTasks', { count: analysis.pendingTasks.length, defaultValue: `Tareas pendientes (${analysis.pendingTasks.length})` })}
                                    </h4>

                                    {analysis.pendingTasks.length > 0 ? (
                                      <div className="space-y-2">
                                        {analysis.pendingTasks.map(task => {
                                          const emp = employees.find(e => e.id === task.employeeId);
                                          return (
                                            <div key={task.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm group">
                                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <Avatar className="h-7 w-7 border shrink-0">
                                                  <AvatarImage src={emp?.avatarUrl} />
                                                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[9px] font-bold">
                                                    {emp?.name.substring(0, 2).toUpperCase() || "??"}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-sm font-medium truncate">{task.taskName}</p>
                                                  <p className="text-[10px] text-slate-400">
                                                    {emp?.name} • Sem {format(parseISO(task.weekStartDate), 'w')}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0">
                                                <div className="text-right">
                                                  <p className="font-mono font-bold text-sm">{task.hoursAssigned}h</p>
                                                  <p className="text-[10px] text-slate-400">{t('clientsAndProjects.stats.estimated', 'estimadas')}</p>
                                                </div>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditTask(task);
                                                      }}
                                                    >
                                                      <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>Editar tarea</TooltipContent>
                                                </Tooltip>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 text-center py-4 bg-white rounded-lg border border-dashed">
                                        {t('clientsAndProjects.projectCard.noPendingTasks', 'Sin tareas pendientes este mes')}
                                      </p>
                                    )}
                                  </div>

                                  {/* Tareas completadas (colapsable) */}
                                  {analysis.completedTasks.length > 0 && (
                                    <Collapsible>
                                      <CollapsibleTrigger asChild>
                                        <div className="px-4 py-2 border-t bg-white cursor-pointer hover:bg-slate-50">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                              {t('clientsAndProjects.projectCard.completedTasks', { count: analysis.completedTasks.length, defaultValue: `Tareas completadas (${analysis.completedTasks.length})` })}
                                            </h4>
                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                          </div>
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="p-4 space-y-2">
                                          {analysis.completedTasks.map(task => {
                                            const emp = employees.find(e => e.id === task.employeeId);
                                            return (
                                              <div key={task.id} className="flex items-center justify-between p-3 bg-white border rounded-lg group">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                  <Avatar className="h-7 w-7 border shrink-0">
                                                    <AvatarImage src={emp?.avatarUrl} />
                                                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                                                      {emp?.name.substring(0, 2).toUpperCase() || "??"}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{task.taskName}</p>
                                                    <p className="text-[10px] text-slate-400">
                                                      {emp?.name} • Sem {format(parseISO(task.weekStartDate), 'w')}
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <div className="text-right">
                                                    <div className="space-y-0.5">
                                                      <p className="font-mono font-bold text-xs text-slate-700">
                                                        {t('clientsAndProjects.stats.estimated_short', 'Est')}: {task.hoursAssigned}h
                                                      </p>
                                                      <p className="font-mono font-bold text-xs text-blue-600">
                                                        {t('clientsAndProjects.stats.real_short', 'Real')}: {task.hoursActual || task.hoursAssigned}h
                                                      </p>
                                                      <p className="font-mono font-bold text-xs text-emerald-600">
                                                        {t('clientsAndProjects.stats.computed_short', 'Comp')}: {task.hoursComputed || task.hoursAssigned}h
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          openEditTask(task);
                                                        }}
                                                      >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('clientsAndProjects.actions.editTask', 'Editar tarea')}</TooltipContent>
                                                  </Tooltip>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        {filterSnapshot.statusFilter === 'all'
                          ? t('clientsAndProjects.clientList.noProjectsAll', 'Sin proyectos (incluye todos los estados)')
                          : t('clientsAndProjects.clientList.noProjectsStatus', { status: t(`clientsAndProjects.filters.status.${filterSnapshot.statusFilter}`), defaultValue: `Sin proyectos ${filterSnapshot.statusFilter}` })}
                      </div>
                    )}

                    {/* Resumen de equipo asignado */}
                    {assignedEmployees.length > 0 && (
                      <div className="px-4 py-3 bg-slate-50 border-t">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-600">{t('clientsAndProjects.projectCard.assignedTeam', 'Equipo asignado')}:</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {assignedEmployees.map((emp) => (
                              <div
                                key={emp.id}
                                className="flex items-center gap-1.5 text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200"
                              >
                                <Avatar className="h-4 w-4 border shrink-0">
                                  <AvatarImage src={emp.avatarUrl} />
                                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[8px] font-bold">
                                    {emp.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{emp.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Diálogo de edición de cliente */}
      {editingClient && (
        <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('clientsAndProjects.dialogs.editClient.title', 'Editar cliente')}</DialogTitle>
              <DialogDescription>
                {t('clientsAndProjects.dialogs.editClient.description', 'Modifica la información del cliente.')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('clientsAndProjects.dialogs.newProject.name', 'Nombre')}</Label>
                <Input
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('clientsAndProjects.dialogs.editClient.color', 'Color')}</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingClient({ ...editingClient, color })}
                      className={cn(
                        "h-9 w-9 rounded-lg transition-all hover:scale-110",
                        editingClient.color === color && "ring-2 ring-offset-2 ring-indigo-500"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteConfirmation({ type: 'client', id: editingClient.id, name: editingClient.name });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete', 'Eliminar')}
              </Button>
              <Button variant="outline" onClick={() => setEditingClient(null)}>{t('common.cancel', 'Cancelar')}</Button>
              <Button onClick={handleUpdateClient} className="bg-gradient-to-r from-indigo-500 to-purple-600">
                {t('common.save', 'Guardar')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de ocultar/mostrar proyecto */}
      {hidingProject && (
        <Dialog open={!!hidingProject} onOpenChange={(open) => !open && setHidingProject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{hidingProject.isHidden ? t('clientsAndProjects.actions.showProject', 'Mostrar proyecto') : t('clientsAndProjects.actions.hideProject', 'Ocultar proyecto')}</DialogTitle>
              <DialogDescription>
                {hidingProject.isHidden
                  ? t('clientsAndProjects.dialogs.showProject.description', { name: hidingProject.name, defaultValue: `¿Quieres hacer visible "${hidingProject.name}"? El proyecto volverá a aparecer en la lista.` })
                  : t('clientsAndProjects.dialogs.hideProject.description', { name: hidingProject.name, defaultValue: `¿Estás seguro de ocultar "${hidingProject.name}"? El proyecto seguirá existiendo pero no se mostrará en la lista.` })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHidingProject(null)}>{t('common.cancel', 'Cancelar')}</Button>
              <Button onClick={handleHideProject} className="bg-gradient-to-r from-indigo-500 to-purple-600">
                {hidingProject.isHidden ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('clientsAndProjects.actions.show', 'Mostrar')}
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    {t('clientsAndProjects.actions.hide', 'Ocultar')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de edición de tarea */}
      {editingTask && (() => {
        const weeks = getWeeksForMonth(currentMonth);
        const availableDependencies = allocations.filter(a =>
          a.projectId === editTaskProjectId &&
          a.id !== editingTask.id &&
          a.status !== 'completed'
        );

        return (
          <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('clientsAndProjects.actions.editTask', 'Editar tarea')}</DialogTitle>
                <DialogDescription>
                  {t('clientsAndProjects.dialogs.editTask.description', 'Modifica todos los detalles de la tarea.')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label>{t('clientsAndProjects.dialogs.newProject.client', 'Proyecto')}</Label>
                  <Popover open={openEditTaskProject} onOpenChange={setOpenEditTaskProject}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editTaskProjectId ? (
                            <SensitiveText kind="project" id={editTaskProjectId}>
                              {formatProjectName(projects.find(p => p.id === editTaskProjectId)?.name ?? t('clientsAndProjects.dialogs.newProject.selectProject', 'Seleccionar proyecto'))}
                            </SensitiveText>
                          ) : (
                            t('clientsAndProjects.dialogs.newProject.selectProject', 'Seleccionar proyecto')
                          )}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandList className="max-h-[280px]">
                          {projects.filter(p => p.status === 'active').map(project => (
                            <CommandItem key={project.id} value={project.name} onSelect={() => { setEditTaskProjectId(project.id); setOpenEditTaskProject(false); }}>
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', editTaskProjectId === project.id ? 'opacity-100' : 'opacity-0')} />
                              <SensitiveText kind="project" id={project.id}>{formatProjectName(project.name)}</SensitiveText>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>{t('clientsAndProjects.dialogs.newProject.taskName', 'Nombre de la tarea')}</Label>
                  <Input
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    placeholder={t('clientsAndProjects.dialogs.newProject.taskName', 'Nombre de la tarea')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('clientsAndProjects.dialogs.newProject.employee', 'Empleado')}</Label>
                  <Popover open={openEditTaskEmployee} onOpenChange={setOpenEditTaskEmployee}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        <span className="truncate">{editTaskEmployeeId ? (employees.find(e => e.id === editTaskEmployeeId)?.name || employees.find(e => e.id === editTaskEmployeeId)?.first_name || t('common.no_name', 'Sin nombre')) : t('clientsAndProjects.dialogs.newProject.selectEmployee', 'Seleccionar empleado')}</span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandList className="max-h-[280px]">
                          {employeesForView.filter(e => e.isActive).map(emp => (
                            <CommandItem key={emp.id} value={emp.name || emp.first_name || 'Sin nombre'} onSelect={() => { setEditTaskEmployeeId(emp.id); setOpenEditTaskEmployee(false); }}>
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', editTaskEmployeeId === emp.id ? 'opacity-100' : 'opacity-0')} />
                              {emp.name || emp.first_name || t('common.no_name', 'Sin nombre')}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs text-slate-500">
                    <LinkIcon className="w-3 h-3" /> {t('clientsAndProjects.dialogs.newProject.dependency', 'Depende de otra tarea')}
                  </Label>
                  <Popover open={openEditTaskDependency} onOpenChange={setOpenEditTaskDependency}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 w-full justify-between font-normal" disabled={!editTaskProjectId}>
                        <span className="truncate">{editTaskDependencyId === 'none' ? t('common.none', '-- Ninguna --') : (() => { const dep = availableDependencies.find(d => d.id === editTaskDependencyId); const owner = dep ? employees.find(e => e.id === dep.employeeId) : null; return dep ? `${dep.taskName} (${owner?.name || t('common.unknown', 'Desconocido')})` : t('common.no_dependency', 'Sin dependencia'); })()}</span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-max min-w-[var(--radix-popover-trigger-width)] max-w-[min(92vw,560px)] p-0" align="start">
                      <Command>
                        <CommandList className="max-h-[280px]">
                          <CommandGroup>
                            <CommandItem value="none" className="text-xs py-2 px-3" onSelect={() => { setEditTaskDependencyId('none'); setOpenEditTaskDependency(false); }}>
                              <Check className={cn('mr-2.5 h-3.5 w-3.5 shrink-0', editTaskDependencyId === 'none' ? 'opacity-100' : 'opacity-0')} />
                              {t('common.none', '-- Ninguna --')}
                            </CommandItem>
                            {availableDependencies.map(dep => {
                              const owner = employees.find(e => e.id === dep.employeeId);
                              const name = owner?.name || t('common.unknown', 'Desconocido');
                              const shortName = name.length > 8 ? name.substring(0, 6) + '..' : name;
                              const label = `${dep.taskName} (${shortName})`;
                              return (
                                <CommandItem key={dep.id} value={label} className="text-xs py-2 px-3 whitespace-nowrap" onSelect={() => { setEditTaskDependencyId(dep.id); setOpenEditTaskDependency(false); }}>
                                  <Check className={cn('mr-2.5 h-3.5 w-3.5 shrink-0', editTaskDependencyId === dep.id ? 'opacity-100' : 'opacity-0')} />
                                  <span title={`${dep.taskName} (${name})`}>{label}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('clientsAndProjects.dialogs.newProject.budget', 'Horas estimadas')}</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={editTaskHours}
                      onChange={(e) => setEditTaskHours(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('clientsAndProjects.dialogs.newProject.week', 'Semana')}</Label>
                    <Popover open={openEditTaskWeek} onOpenChange={setOpenEditTaskWeek}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                          <span className="truncate">{editTaskWeek ? (() => { const idx = weeks.findIndex(w => format(w.weekStart, 'yyyy-MM-dd') === editTaskWeek); return idx >= 0 ? t('clientsAndProjects.dialogs.newProject.week_short', { count: idx + 1, date: format(weeks[idx].weekStart, 'dd/MM'), defaultValue: `Sem ${idx + 1} (${format(weeks[idx].weekStart, 'dd/MM')})` }) : t('clientsAndProjects.dialogs.newProject.selectWeek', 'Seleccionar semana'); })() : t('clientsAndProjects.dialogs.newProject.selectWeek', 'Seleccionar semana')}</span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandList className="max-h-[280px]">
                            {weeks.map((w, i) => {
                              const val = format(w.weekStart, 'yyyy-MM-dd');
                              return (
                                <CommandItem key={val} value={val} onSelect={() => { setEditTaskWeek(val); setOpenEditTaskWeek(false); }}>
                                  <Check className={cn('mr-2 h-4 w-4 shrink-0', editTaskWeek === val ? 'opacity-100' : 'opacity-0')} />
                                  {t('clientsAndProjects.dialogs.newProject.week_short', { count: i + 1, date: format(w.weekStart, 'dd/MM'), defaultValue: `Sem ${i + 1} (${format(w.weekStart, 'dd/MM')})` })}
                                </CommandItem>
                              );
                            })}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {editingTask.status === 'completed' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('clientsAndProjects.stats.realHours', 'Horas reales')}</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={editTaskHoursActual}
                        onChange={(e) => setEditTaskHoursActual(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('clientsAndProjects.stats.computedHours', 'Horas computadas')}</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={editTaskHoursComputed}
                        onChange={(e) => setEditTaskHoursComputed(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  {t('common.cancel', 'Cancelar')}
                </Button>
                <Button onClick={handleSaveTask} className="bg-gradient-to-r from-indigo-500 to-purple-600">
                  {t('common.saveChanges', 'Guardar cambios')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmTitle', '¿Estás completamente seguro?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation?.type === 'client'
                ? t('clientsAndProjects.dialogs.deleteClient.description', { name: deleteConfirmation.name, defaultValue: `Estás a punto de eliminar el cliente "${deleteConfirmation.name}". Esta acción no se puede deshacer.` })
                : t('clientsAndProjects.dialogs.deleteProject.description', { name: deleteConfirmation?.name, defaultValue: `Estás a punto de eliminar el proyecto "${deleteConfirmation?.name}". Se borrarán todas sus asignaciones y deadline.` })
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancelar')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'Eliminar')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
