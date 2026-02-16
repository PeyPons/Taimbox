import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { format, startOfMonth, endOfMonth, isSameMonth, parseISO, addDays, startOfWeek, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle2, Users, Plus, ArrowRight, ChevronLeft, ChevronRight, CalendarDays, Check, ChevronDown, ArrowUpDown, Search, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getStorageKey, getWeeksForMonth, getMonthlyCapacity, isAllocationInEffectiveMonth, getWeekEndDate } from '@/utils/dateUtils';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getTeamEventHoursInRange } from '@/utils/teamEventUtils';
import { MonthlyEvolutionChart } from '@/components/employee/MonthlyEvolutionChart';
import { ActivityLogSection } from '@/components/shared/ActivityLogSection';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { Deadline } from '@/types';
import { getEffectiveBudget } from '@/utils/budgetUtils';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export default function WeeklyForecastPage() {
  const {
    projects, allocations, employees, clients, weeklyFeedback,
    addAllocation, updateAllocation, currentUser, absences, teamEvents, getEmployeeLoadForWeek
  } = useApp();
  const { currentAgency } = useAgency();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const saved = localStorage.getItem('forecast_date');
    return saved ? new Date(saved) : new Date();
  });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [redistributeSelectedTasks, setRedistributeSelectedTasks] = useState<Set<string>>(new Set());
  const [redistributeToEmployee, setRedistributeToEmployee] = useState('');
  const [redistributeWeek, setRedistributeWeek] = useState('');
  const [filterFeedbackEmployee, setFilterFeedbackEmployee] = useState<string>('all');
  const [filterFeedbackProject, setFilterFeedbackProject] = useState<string>('all');
  const [filterTransferStatus, setFilterTransferStatus] = useState<'all' | 'pending' | 'kept' | 'distributed'>('all');
  const [filterProjectStatus, setFilterProjectStatus] = useState<string>('all'); // all, red, yellow, green
  const [filterClient, setFilterClient] = useState<string>('all');
  const { activeFilters, filterProject } = useProjectFilters();
  const weeklyCloseDay = useWeeklyCloseDay();
  const [filterId, setFilterId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'difference' | 'contracted'>('status');
  const { formatName: formatProjectName } = useProjectAliasing();

  const [dbTransfers, setDbTransfers] = useState<any[]>([]);
  const [monthDeadlines, setMonthDeadlines] = useState<Deadline[]>([]);

  // Cargar transferencias de la nueva tabla (BD)
  useEffect(() => {
    const fetchDbTransfers = async () => {
      if (!currentUser?.agencyId) return;

      const start = startOfMonth(currentMonth).toISOString();
      const end = endOfMonth(currentMonth).toISOString();

      const { data, error } = await supabase
        .from('task_transfers')
        .select(`
          *,
          from_employee:employees!task_transfers_from_employee_id_fkey(name, avatar_url),
          to_employee:employees!task_transfers_to_employee_id_fkey(name, avatar_url),
          allocation:allocations!task_transfers_allocation_id_fkey(task_name, project_id)
        `)
        .eq('agency_id', currentUser.agencyId)
        .gte('requested_at', start)
        .lte('requested_at', end);

      if (!error && data) {
        setDbTransfers(data);
      }
    };

    fetchDbTransfers();
  }, [currentMonth, currentUser?.agencyId]);

  useEffect(() => {
    localStorage.setItem('forecast_date', currentMonth.toISOString());
  }, [currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const weeks = getWeeksForMonth(currentMonth);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Helper para obtener el índice de la semana relativo al mes (Semana 1, 2, 3...)
  const getWeekIndex = (dateStr: string) => {
    if (!dateStr) return -1;
    // Buscamos la semana que coincida con la fecha de inicio
    const index = weeks.findIndex(w => {
      const key = getStorageKey(w.weekStart, currentMonth);
      return key === dateStr || w.weekStart.toISOString().split('T')[0] === dateStr;
    });
    return index !== -1 ? index + 1 : -1;
  };

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentMonth(new Date());

  // Cargar deadlines del mes (filtrados por agencia)
  useEffect(() => {
    const load = async () => {
      const selectedMonthStr = format(currentMonth, 'yyyy-MM');
      const { data, error } = await fetchDeadlinesForMonth(selectedMonthStr, currentAgency?.id);
      if (!error && data) setMonthDeadlines(data);
    };
    load();
  }, [currentMonth, currentAgency?.id]);

  // Sección A: Semáforo de proyectos (Month-End Forecast) con filtros
  const projectForecast = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    let filteredProjects = projects.filter(p => p.status === 'active' && !p.isHidden);

    // Filtro por cliente
    if (filterClient !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.clientId === filterClient);
    }

    // Filtro por tipo de proyecto (Dynamic)
    if (filterId !== 'all') {
      filteredProjects = filteredProjects.filter(p => filterProject(p, filterId));
    }

    const today = new Date();

    const forecastData = filteredProjects.map(project => {
      const deadline = monthDeadlines.find(d => d.projectId === project.id);
      const contracted = getEffectiveBudget(project, deadline);

      // Realizado: Suma de hours_actual de allocations pasadas + hours_assigned de allocations futuras en este mes
      const monthAllocations = (allocations || []).filter(a => {
        return a.projectId === project.id &&
          isAllocationInEffectiveMonth(a.weekStartDate, currentMonth);
      });

      // Separar por completadas y planificadas
      const completed = monthAllocations.filter(a => a.status === 'completed');
      const planned = monthAllocations.filter(a => a.status !== 'completed');

      // Para tareas completadas: usar hoursComputed si existe (es la fuente de verdad de facturación), sino fallback a real/asignado
      const completedHours = round2(
        completed.reduce((sum, a) => sum + (a.hoursComputed !== undefined ? a.hoursComputed : ((a.hoursActual || 0) > 0 ? (a.hoursActual || 0) : a.hoursAssigned)), 0)
      );

      // Para tareas planificadas: usar hoursAssigned (son futuras)
      const plannedHours = round2(
        planned.reduce((sum, a) => sum + a.hoursAssigned, 0)
      );

      // Realizado = Computado (de completadas) + Planificado (de pendientes)
      // Esto refleja "Qué se va a cobrar" = Lo ya hecho (computado) + Lo que falta (planificado)
      const realized = round2(completedHours + plannedHours);
      const difference = round2(contracted - realized);

      const minimum = project.minimumHours || 0;

      let status: 'red' | 'yellow' | 'green';

      // Lógica con Mínimos:
      const targetHours = minimum > 0 ? minimum : contracted;
      const hoursMissing = targetHours - realized;

      // Si nos pasamos del budget (siempre alerta roja)
      if (contracted > 0 && realized > (contracted + 5)) {
        status = 'red';
      }
      // Si faltan horas para llegar al objetivo (sea mínimo o budget)
      else if (hoursMissing > 5) {
        status = 'yellow';
      } else {
        status = 'green';
      }

      return {
        projectId: project.id,
        projectName: project.name,
        clientName: clients.find(c => c.id === project.clientId)?.name || 'Sin cliente',
        clientColor: clients.find(c => c.id === project.clientId)?.color || '#6b7280',
        contracted,
        realized,
        completedHours,
        plannedHours,
        difference,
        status
      };
    }).filter(proj => {
      // Filtro por estado del semáforo
      if (filterProjectStatus === 'all') return true;
      return proj.status === filterProjectStatus;
    }).sort((a, b) => {
      // Aplicar ordenamiento según sortBy
      if (sortBy === 'name') {
        return a.projectName.localeCompare(b.projectName);
      } else if (sortBy === 'status') {
        // Ordenar: rojos primero, luego amarillos, luego verdes
        const statusOrder = { red: 0, yellow: 1, green: 2 };
        return statusOrder[a.status] - statusOrder[b.status] || Math.abs(b.difference) - Math.abs(a.difference);
      } else if (sortBy === 'difference') {
        return Math.abs(b.difference) - Math.abs(a.difference);
      } else if (sortBy === 'contracted') {
        return b.contracted - a.contracted;
      }
      return 0;
    });

    return Array.isArray(forecastData) ? forecastData : [];
  }, [projects, allocations, clients, currentMonth, filterClient, filterProjectStatus, filterId, filterProject]);

  // Sección B: Transferencias de horas (rediseñado) - muestra quién le pasó a quién

  // Obtener todas las transferencias DEL MES ACTUAL (no solo semana actual)
  const transfers = useMemo(() => {
    if (!weeklyFeedback || !Array.isArray(weeklyFeedback) || !allocations || !Array.isArray(allocations)) return [];

    // Función helper para determinar si una fecha (string o Date) está en el mes actual
    const isInMonth = (dateStr: string | Date) => {
      try {
        return isAllocationInEffectiveMonth(dateStr, currentMonth);
      } catch {
        return false;
      }
    };

    // Buscar feedback que indique transferencias EN ESTE MES
    const transferFeedbacks = (weeklyFeedback || []).filter(fb => {
      if (!isInMonth(fb.weekStartDate)) return false; // Filtro por mes estricto
      const comment = fb.comments || '';
      return comment.includes('transferida a') || comment.includes('Tarea transferida a');
    });

    // Buscar tareas transferidas usando el campo de BD
    const transferredTasks = (allocations || []).filter(a => {
      const isTransferred = a.transferredFromAllocationId !== undefined && a.transferredFromAllocationId !== null;
      if (!isTransferred && !a.taskName?.includes('(transferida de')) return false;
      return isInMonth(a.weekStartDate);
    });

    // Combinar información de feedback y tareas
    const transferMap = new Map<string, {
      fromEmployeeId: string;
      fromEmployeeName: string;
      fromEmployeeAvatar?: string;
      toEmployeeId: string;
      toEmployeeName: string;
      toEmployeeAvatar?: string;
      projectId: string;
      projectName: string;
      hours: number;
      taskName: string;
      status: 'pending' | 'kept' | 'distributed' | 'rejected';
      feedbackId?: string;
      allocationId?: string;
      createdAt: string;
      comments?: string;
      distributedTasks?: Array<{ name: string; hours: number; weekDate: string; employeeName?: string }>;
      notes?: string;
      originalWeek?: string;
      targetWeek?: string;
      acceptanceMode?: 'keep' | 'move' | 'distribute' | 'rollover';
      resultAllocationIds?: string[];
      uniqueId: string;
    }>();

    // 1. INTEGRACIÓN NUEVO SISTEMA: Añadir transferencias de la tabla task_transfers
    dbTransfers.forEach(t => {
      const key = t.id;
      // Determinar estado visual basado en status y acceptance_mode
      let status: 'pending' | 'kept' | 'distributed' | 'rejected' = 'pending';
      if (t.status === 'accepted') {
        // Use acceptance_mode to determine final status
        if (t.acceptance_mode === 'distribute') {
          status = 'distributed';
        } else {
          status = 'kept'; // 'keep', 'move', 'rollover' all show as kept
        }
      }
      if (t.status === 'rejected') status = 'rejected';

      transferMap.set(key, {
        fromEmployeeId: t.from_employee_id,
        fromEmployeeName: t.from_employee?.name || 'Desconocido',
        fromEmployeeAvatar: t.from_employee?.avatar_url,
        toEmployeeId: t.to_employee_id,
        toEmployeeName: t.to_employee?.name || 'Desconocido',
        toEmployeeAvatar: t.to_employee?.avatar_url,
        projectId: t.allocation?.project_id || '',
        projectName: projects.find(p => p.id === t.allocation?.project_id)?.name || 'Sin proyecto',
        hours: t.hours_transferred,
        taskName: t.allocation?.task_name || 'Tarea',
        status: status,
        allocationId: t.allocation_id,
        createdAt: t.requested_at,
        comments: t.reason,
        originalWeek: t.requested_at,
        // Include child allocation IDs and acceptance mode for detailed display
        acceptanceMode: t.acceptance_mode,
        resultAllocationIds: t.result_allocation_ids || [],
        uniqueId: key
      });
    });

    // Procesar feedback de transferencias
    transferFeedbacks.forEach(fb => {
      const fromEmployee = employees.find(e => e.id === fb.employeeId);
      const match = fb.comments?.match(/transferida a (.+?) \(/);
      const toEmployeeName = match ? match[1] : null;
      const toEmployee = toEmployeeName ? employees.find(e => e.name === toEmployeeName) : null;
      const hoursMatch = fb.comments?.match(/\((\d+(?:\.\d+)?)h restantes\)/);
      const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;

      if (fromEmployee && toEmployee && fb.allocationId) {
        const key = `${fb.allocationId}-${toEmployee.id}`;
        const transferredTask = transferredTasks.find(t => t.id === fb.allocationId || t.taskName?.includes(`(transferida de ${fromEmployee.name})`));

        // Verificar si el empleado destino ya procesó la tarea
        let status: 'pending' | 'kept' | 'distributed' | 'rejected' = 'pending';
        let targetWeek: string | undefined;

        const taskFeedbackOriginal = weeklyFeedback.find(f => f.allocationId === fb.allocationId);
        const taskFeedbackTransferred = transferredTask ? weeklyFeedback.find(f => f.allocationId === transferredTask.id) : null;
        const taskFeedback = taskFeedbackTransferred || taskFeedbackOriginal;

        if (taskFeedback) {
          if (taskFeedback.comments?.includes('Tarea mantenida tal cual')) {
            status = 'kept';
            targetWeek = taskFeedback.weekStartDate; // La semana donde se mantuvo
          } else if (taskFeedback.comments?.includes('Distribuidas en')) {
            status = 'distributed';
            targetWeek = taskFeedback.weekStartDate; // La semana donde se distribuyó
          }
        }

        // Obtener nombre de tarea
        let taskName = 'Tarea transferida';
        if (transferredTask) {
          taskName = transferredTask.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Tarea transferida';
        } else if (taskFeedback?.comments) {
          const nameMatch = taskFeedback.comments.match(/Nombre original: (.+?)(?:\s*\||$)/);
          if (nameMatch) {
            taskName = nameMatch[1].trim();
          } else {
            const transferNameMatch = fb.comments?.match(/Nombre: (.+?)(?:\s*\||$)/);
            if (transferNameMatch) {
              taskName = transferNameMatch[1].trim();
            }
          }
        } else if (fb.comments) {
          const transferNameMatch = fb.comments.match(/Nombre: (.+?)(?:\s*\||$)/);
          if (transferNameMatch) {
            taskName = transferNameMatch[1].trim();
          }
        }

        let notes: string | undefined;
        if (taskFeedback?.comments) {
          const notesMatch = taskFeedback.comments.match(/\| Motivo: (.+)$/);
          if (notesMatch) {
            notes = notesMatch[1].trim();
          }
        }

        transferMap.set(key, {
          fromEmployeeId: fromEmployee.id,
          fromEmployeeName: fromEmployee.name,
          fromEmployeeAvatar: fromEmployee.avatarUrl,
          toEmployeeId: toEmployee.id,
          toEmployeeName: toEmployee.name,
          toEmployeeAvatar: toEmployee.avatarUrl,
          projectId: fb.projectId || '',
          projectName: projects.find(p => p.id === fb.projectId)?.name || 'Sin proyecto',
          hours: hours || (transferredTask?.hoursAssigned || 0),
          taskName,
          status,
          feedbackId: fb.id,
          allocationId: fb.allocationId,
          createdAt: taskFeedback?.createdAt || fb.createdAt,
          comments: fb.comments,
          notes,
          originalWeek: fb.weekStartDate,
          targetWeek,
          uniqueId: key
        });
      }
    });

    // Añadir tareas transferidas sin feedback explícito
    transferredTasks.forEach(task => {
      // Intentar obtener origen desde nuevas columnas
      let fromEmployee: typeof employees[0] | undefined | null;
      let originalTaskName = 'Tarea transferida';

      if (task.transferSourceEmployeeId) {
        fromEmployee = employees.find(e => e.id === task.transferSourceEmployeeId);
        originalTaskName = task.originalTransferredTaskName || task.taskName || 'Tarea transferida';
      } else {
        // Fallback IDs/Regex
        const match = task.taskName?.match(/\(transferida de (.+)\)/);
        const fromEmployeeName = match ? match[1] : null;
        fromEmployee = fromEmployeeName ? employees.find(e => e.name === fromEmployeeName) : null;
        originalTaskName = task.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Tarea transferida';
      }

      if (fromEmployee && task.employeeId) {
        const toEmployee = employees.find(e => e.id === task.employeeId);
        if (toEmployee) {
          const key = `${task.id}-${toEmployee.id}`;
          if (!transferMap.has(key)) {
            const taskFeedback = weeklyFeedback.find(f => f.allocationId === task.id);
            let status: 'pending' | 'kept' | 'distributed' | 'rejected' = 'pending';
            let targetWeek: string | undefined;

            if (taskFeedback) {
              if (taskFeedback.comments?.includes('Tarea mantenida tal cual')) {
                status = 'kept';
                targetWeek = taskFeedback.weekStartDate;
              } else if (taskFeedback.comments?.includes('Distribuidas en')) {
                status = 'distributed';
                targetWeek = taskFeedback.weekStartDate;
              }
            } else if (task.status === 'completed') {
              // Si la tarea transferida se completó, asumimos "kept" o que ya se trabajó
              // status = 'kept'; // O lo dejamos pending si queremos confirmación explícita
            }

            let taskName = originalTaskName;
            if (taskFeedback?.comments && status === 'distributed') {
              const nameMatch = taskFeedback.comments.match(/Nombre original: (.+?)(?:\s*\||$)/);
              if (nameMatch) {
                taskName = nameMatch[1].trim();
              }
            }

            transferMap.set(key, {
              fromEmployeeId: fromEmployee.id,
              fromEmployeeName: fromEmployee.name,
              fromEmployeeAvatar: fromEmployee.avatarUrl,
              toEmployeeId: toEmployee.id,
              toEmployeeName: toEmployee.name,
              toEmployeeAvatar: toEmployee.avatarUrl,
              projectId: task.projectId,
              projectName: projects.find(p => p.id === task.projectId)?.name || 'Sin proyecto',
              hours: task.hoursAssigned,
              taskName,
              status,
              allocationId: task.id,
              createdAt: task.weekStartDate,
              originalWeek: task.weekStartDate, // Asumimos que la tarea transferida conserva la fecha o es la fecha de llegada
              targetWeek,
              uniqueId: key
            });
          }
        }
      }
    });

    // Buscar tareas distribuidas desde transferencias usando el campo de BD
    const distributedFromTransfers = (allocations || []).filter(a => {
      const isDistributed = a.distributionSourceAllocationId !== undefined && a.distributionSourceAllocationId !== null;
      if (!isDistributed && !a.taskName?.includes('(transferida de')) return false;
      return isInMonth(a.weekStartDate);
    });

    const distributedGroups = new Map<string, {
      fromEmployeeId: string;
      fromEmployeeName: string;
      fromEmployeeAvatar?: string;
      toEmployeeId: string;
      toEmployeeName: string;
      toEmployeeAvatar?: string;
      projectId: string;
      projectName: string;
      originalTaskName: string;
      distributedTasks: Array<{ id: string; name: string; hours: number; weekDate: string; employeeName: string }>;
      totalHours: number;
      createdAt: string;
      originalWeek?: string;
      targetWeek?: string;
    }>();

    distributedFromTransfers.forEach(distTask => {
      let fromEmployee: typeof employees[0] | undefined;
      let originalTaskName: string;
      let newTaskName: string = distTask.taskName || 'Tarea';
      let originalWeek: string | undefined;

      // 1. Intentar usar columnas de tracking robusto (Nuevo sistema)
      if (distTask.transferSourceEmployeeId && distTask.originalTransferredTaskName) {
        fromEmployee = employees.find(e => e.id === distTask.transferSourceEmployeeId);
        originalTaskName = distTask.originalTransferredTaskName;
        originalWeek = distTask.weekStartDate; // Aproximación si no rastreamos fecha original exacta en columna separada
      }

      // 2. Si no hay datos nuevos, intentar rastrear por IDs (Sistema híbrido)
      if (!fromEmployee && distTask.distributionSourceAllocationId) {
        const transferredTask = allocations.find(a => a.id === distTask.distributionSourceAllocationId);
        if (transferredTask) {
          originalWeek = transferredTask.weekStartDate; // Fecha de la tarea intermedia
          if (transferredTask.transferredFromAllocationId) {
            const originalTask = allocations.find(a => a.id === transferredTask.transferredFromAllocationId);
            if (originalTask) {
              fromEmployee = employees.find(e => e.id === originalTask.employeeId);
              originalTaskName = originalTask.taskName || 'Tarea';
              originalWeek = originalTask.weekStartDate; // Preferir la fecha original de verdad
            } else {
              const transferMatch = transferredTask.taskName?.match(/\(transferida de (.+?)\)/);
              const fromEmployeeName = transferMatch ? transferMatch[1] : null;
              fromEmployee = fromEmployeeName ? employees.find(e => e.name === fromEmployeeName) : undefined;
              originalTaskName = transferredTask.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Tarea';
            }
          } else {
            const transferMatch = transferredTask.taskName?.match(/\(transferida de (.+?)\)/);
            const fromEmployeeName = transferMatch ? transferMatch[1] : null;
            fromEmployee = fromEmployeeName ? employees.find(e => e.name === fromEmployeeName) : undefined;
            originalTaskName = transferredTask.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Tarea';
          }
        }
      }

      if (!fromEmployee) {
        const fullMatch = distTask.taskName?.match(/^(.+?)\s*\(transferida de (.+?), original: (.+?)\)$/);
        if (fullMatch) {
          const [, newName, fromEmployeeName, origName] = fullMatch;
          fromEmployee = employees.find(e => e.name === fromEmployeeName);
          originalTaskName = origName.trim();
          newTaskName = newName.trim();
        } else {
          const simpleMatch = distTask.taskName?.match(/^(.+?)\s*\(transferida de (.+?)\)$/);
          if (simpleMatch) {
            const [, newName, fromEmployeeName] = simpleMatch;
            fromEmployee = employees.find(e => e.name === fromEmployeeName);
            originalTaskName = newName.trim();
            newTaskName = newName.trim();
          } else {
            const taskFeedback = weeklyFeedback.find(f => f.allocationId === distTask.id);
            const originalNameMatch = taskFeedback?.comments?.match(/tarea original: (.+?)(?:\s*\||$)/i);
            originalTaskName = originalNameMatch ? originalNameMatch[1].trim() : (distTask.taskName || 'Tarea');
            return;
          }
        }
      }

      if (!fromEmployee) return;
      const toEmployee = employees.find(e => e.id === distTask.employeeId);
      if (!toEmployee) return;

      const groupKey = `${fromEmployee.id}-${toEmployee.id}-${distTask.projectId}-${originalTaskName}`;

      if (!distributedGroups.has(groupKey)) {
        distributedGroups.set(groupKey, {
          fromEmployeeId: fromEmployee.id,
          fromEmployeeName: fromEmployee.name,
          fromEmployeeAvatar: fromEmployee.avatarUrl,
          toEmployeeId: toEmployee.id,
          toEmployeeName: toEmployee.name,
          toEmployeeAvatar: toEmployee.avatarUrl,
          projectId: distTask.projectId,
          projectName: projects.find(p => p.id === distTask.projectId)?.name || 'Sin proyecto',
          originalTaskName,
          distributedTasks: [],
          totalHours: 0,
          createdAt: distTask.weekStartDate,
          originalWeek,
          targetWeek: distTask.weekStartDate
        });
      }

      const group = distributedGroups.get(groupKey)!;
      group.distributedTasks.push({
        id: distTask.id,
        name: newTaskName.trim(),
        hours: distTask.hoursAssigned,
        weekDate: distTask.weekStartDate,
        employeeName: toEmployee.name
      });
      group.totalHours += distTask.hoursAssigned;
    });

    // Convertir grupos de distribuciones en entradas de transferencia
    distributedGroups.forEach((group, key) => {
      const existingKey = Array.from(transferMap.keys()).find(k => {
        const entry = transferMap.get(k);
        return entry?.fromEmployeeId === group.fromEmployeeId &&
          entry?.toEmployeeId === group.toEmployeeId &&
          entry?.projectId === group.projectId &&
          entry?.taskName === group.originalTaskName;
      });

      if (existingKey) {
        const existing = transferMap.get(existingKey)!;
        existing.hours = group.totalHours;
        existing.status = 'distributed';
        existing.targetWeek = group.targetWeek;
        existing.distributedTasks = group.distributedTasks.map(t => ({ name: t.name, hours: t.hours, weekDate: t.weekDate, employeeName: t.employeeName }));
        transferMap.set(existingKey, existing);
      } else {
        const distributionFeedback = weeklyFeedback.find(fb =>
          fb.comments?.includes('Distribuidas en') &&
          fb.projectId === group.projectId &&
          fb.employeeId === group.toEmployeeId
        );

        let notes: string | undefined;
        if (distributionFeedback?.comments) {
          const notesMatch = distributionFeedback.comments.match(/\| Motivo: (.+)$/);
          if (notesMatch) {
            notes = notesMatch[1].trim();
          }
        }

        transferMap.set(`distributed-${key}`, {
          fromEmployeeId: group.fromEmployeeId,
          fromEmployeeName: group.fromEmployeeName,
          fromEmployeeAvatar: group.fromEmployeeAvatar,
          toEmployeeId: group.toEmployeeId,
          toEmployeeName: group.toEmployeeName,
          toEmployeeAvatar: group.toEmployeeAvatar,
          projectId: group.projectId,
          projectName: group.projectName,
          hours: group.totalHours,
          taskName: group.originalTaskName,
          status: 'distributed',
          allocationId: group.distributedTasks[0]?.id,
          createdAt: distributionFeedback?.createdAt || group.createdAt,
          comments: distributionFeedback?.comments,
          distributedTasks: group.distributedTasks.map(t => ({ name: t.name, hours: t.hours, weekDate: t.weekDate, employeeName: t.employeeName })),
          notes,
          originalWeek: group.originalWeek, // Propagar semana origen
          targetWeek: group.targetWeek, // Semana destino
          uniqueId: `distributed-${key}`
        });
      }
    });

    let filtered = Array.from(transferMap.values());

    // Filtro por compañero
    if (filterFeedbackEmployee !== 'all') {
      filtered = filtered.filter(t =>
        t.fromEmployeeId === filterFeedbackEmployee || t.toEmployeeId === filterFeedbackEmployee
      );
    }

    // Filtro por proyecto
    if (filterFeedbackProject !== 'all') {
      filtered = filtered.filter(t => t.projectId === filterFeedbackProject);
    }

    // Filtro por estado
    if (filterTransferStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterTransferStatus);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [weeklyFeedback, allocations, employees, projects, currentMonth, filterFeedbackEmployee, filterFeedbackProject, filterTransferStatus, dbTransfers]);

  // Semanas futuras para el selector de redistribución
  const futureWeeks = useMemo(() => {
    const today = new Date();
    return weeks.filter(week => {
      try {
        const weekDate = parseISO(getStorageKey(week.weekStart, currentMonth));
        // Incluir semana actual si aún no ha terminado (viernes)
        const weekEnd = addDays(weekDate, 4); // Viernes
        return weekEnd >= today;
      } catch {
        return false;
      }
    });
  }, [weeks, currentMonth]);

  // NUEVO: Tareas retrasadas de TODOS los compañeros para el proyecto seleccionado
  // Agrupadas por empleado con avatar y nombre
  const delayedTasksByEmployee = useMemo(() => {
    if (!selectedProject) return [];

    const today = new Date();
    const delayedTasks = allocations.filter(a => {
      if (a.projectId !== selectedProject) return false;
      if (a.status === 'completed') return false;

      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        if (!isAllocationInEffectiveMonth(taskWeekDate.toISOString().split('T')[0], currentMonth)) return false;

        const taskWeekEnd = getWeekEndDate(taskWeekDate, weeklyCloseDay);
        // Solo tareas de semanas pasadas o actual
        return taskWeekEnd <= today;
      } catch {
        return false;
      }
    });

    // Agrupar por empleado
    const grouped: Record<string, typeof allocations> = {};
    delayedTasks.forEach(task => {
      if (!grouped[task.employeeId]) {
        grouped[task.employeeId] = [];
      }
      grouped[task.employeeId].push(task);
    });

    // Convertir a array con información del empleado
    return Object.entries(grouped).map(([employeeId, tasks]) => {
      const employee = employees.find(e => e.id === employeeId);
      return {
        employeeId,
        employeeName: employee?.name || 'Desconocido',
        employeeAvatar: employee?.avatarUrl,
        tasks: tasks || []
      };
    }).filter(g => g.employeeName !== 'Desconocido' && g.tasks && g.tasks.length > 0);
  }, [selectedProject, allocations, currentMonth, employees]);

  // Sección C: Redistribución Rápida (mejorada - sin horas globales)
  const handleRedistribute = async () => {
    if (!selectedProject || !redistributeToEmployee || !redistributeWeek) {
      toast.error('Completa todos los campos');
      return;
    }

    if (redistributeSelectedTasks.size === 0) {
      toast.error('Selecciona al menos una tarea para redistribuir');
      return;
    }

    // Obtener todas las tareas seleccionadas (pueden ser de diferentes empleados)
    const allDelayedTasks = (delayedTasksByEmployee || []).flatMap(g => g.tasks || []);
    const tasksToTransfer = allDelayedTasks.filter(task => redistributeSelectedTasks.has(task.id));

    if (tasksToTransfer.length === 0) {
      toast.error('No hay tareas seleccionadas');
      return;
    }

    let totalHours = 0;
    const tasksByEmployee: Record<string, typeof allocations> = {};

    tasksToTransfer.forEach(task => {
      const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
      if (remainingHours > 0) {
        totalHours += remainingHours;
        if (!tasksByEmployee[task.employeeId]) {
          tasksByEmployee[task.employeeId] = [];
        }
        tasksByEmployee[task.employeeId].push(task);
      }
    });

    if (totalHours <= 0) {
      toast.error('Las tareas seleccionadas no tienen horas restantes');
      return;
    }

    try {
      // Transferir tareas específicas (pueden ser de diferentes empleados)
      for (const [fromEmployeeId, employeeTasks] of Object.entries(tasksByEmployee)) {
        const fromEmployee = employees.find(e => e.id === fromEmployeeId);
        const fromEmployeeName = fromEmployee?.name || 'compañero';

        for (const task of employeeTasks) {
          const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
          if (remainingHours > 0) {
            // Completar tarea original
            await updateAllocation({
              ...task,
              hoursAssigned: task.hoursActual || 0,
              status: 'completed'
            });

            // Crear tarea para el compañero destino
            await addAllocation({
              employeeId: redistributeToEmployee,
              projectId: selectedProject,
              weekStartDate: redistributeWeek,
              hoursAssigned: remainingHours,
              taskName: `${task.taskName || 'Tarea'} (transferida de ${fromEmployeeName})`,
              status: 'planned'
            });
          }
        }
      }

      toast.success(`${totalHours.toFixed(1)}h redistribuidas correctamente`);
      setRedistributeSelectedTasks(new Set());
      setRedistributeToEmployee('');
      setRedistributeWeek('');
      setSelectedProject(null);
    } catch (error) {
      console.error('Error redistribuyendo:', error);
      toast.error('Error al redistribuir horas');
    }
  };

  // Carga de trabajo eliminada para evitar redundancia con TeamCapacityPage
  const employeeWorkloads = useMemo(() => [], []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Previsión mensual</h1>
        <p className="text-slate-500 mt-1">Seguimiento de horas contratadas y redistribución de carga</p>
      </div>

      {/* Control de mes */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm w-fit">
        <h2 className="text-lg font-bold capitalize text-slate-900 flex items-center gap-2 ml-2">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="h-6 w-px bg-slate-200 mx-2" />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday} className="h-7 text-xs px-2">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />Mes actual
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Gráfico de Evolución Mensual */}
      <MonthlyEvolutionChart
        currentMonth={currentMonth}
        weeks={weeks}
        allocations={allocations}
        projects={projects}
        employees={employees}
      />

      {/* TABS */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="traffic" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Semáforo
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Transferencias
          </TabsTrigger>
          <TabsTrigger value="blockers" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Bloqueos
          </TabsTrigger>
          <TabsTrigger value="redistribute" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Redistribución
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Semáforo de proyectos */}
        <TabsContent value="traffic" className="space-y-4">
          {/* Filtros estilo Deadlines/Planner */}
          <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border shadow-sm p-3">
            <div className="flex-1 min-w-[200px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full h-8 text-xs justify-between bg-white">
                    <span className="truncate">
                      {filterClient === 'all' ? 'Todos los clientes' : clients.find(c => c.id === filterClient)?.name || 'Cliente'}
                    </span>
                    <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>No hay clientes</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => setFilterClient('all')}>
                          <Check className={cn("mr-2 h-4 w-4", filterClient === 'all' ? "opacity-100" : "opacity-0")} />
                          Todos los clientes
                        </CommandItem>
                        {clients.map(cli => (
                          <CommandItem key={cli.id} value={cli.name} onSelect={() => setFilterClient(cli.id)}>
                            <Check className={cn("mr-2 h-4 w-4", filterClient === cli.id ? "opacity-100" : "opacity-0")} />
                            {cli.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Select value={filterId} onValueChange={setFilterId}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Tipo de proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {activeFilters.map(filter => (
                    <SelectItem key={filter.id} value={filter.id}>
                      {filter.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filterProjectStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProjectStatus('all')}
                className="h-8 text-xs"
              >
                Todos
              </Button>
              <Button
                variant={filterProjectStatus === 'red' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProjectStatus('red')}
                className={cn("h-8 text-xs", filterProjectStatus === 'red' && "bg-red-600 hover:bg-red-700")}
              >
                ⚠️ En riesgo
              </Button>
              <Button
                variant={filterProjectStatus === 'yellow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProjectStatus('yellow')}
                className={cn("h-8 text-xs", filterProjectStatus === 'yellow' && "bg-amber-600 hover:bg-amber-700")}
              >
                ⏳ Pendiente
              </Button>
              <Button
                variant={filterProjectStatus === 'green' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProjectStatus('green')}
                className={cn("h-8 text-xs", filterProjectStatus === 'green' && "bg-emerald-600 hover:bg-emerald-700")}
              >
                ✅ On Track
              </Button>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                  <ArrowUpDown className="h-3 w-3" />
                  Ordenar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem onSelect={() => setSortBy('status')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'status' ? "opacity-100" : "opacity-0")} />
                        Por estado
                      </CommandItem>
                      <CommandItem onSelect={() => setSortBy('name')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'name' ? "opacity-100" : "opacity-0")} />
                        Por nombre
                      </CommandItem>
                      <CommandItem onSelect={() => setSortBy('difference')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'difference' ? "opacity-100" : "opacity-0")} />
                        Por diferencia
                      </CommandItem>
                      <CommandItem onSelect={() => setSortBy('contracted')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'contracted' ? "opacity-100" : "opacity-0")} />
                        Por horas contratadas
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Semáforo de proyectos (Month-End Forecast)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!projectForecast || projectForecast.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay proyectos activos este mes
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectForecast.map(proj => (
                    <Card
                      key={proj.projectId}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        proj.status === 'red' && "ring-2 ring-red-200 bg-red-50/50",
                        proj.status === 'yellow' && "ring-2 ring-amber-200 bg-amber-50/50",
                        proj.status === 'green' && "ring-2 ring-emerald-200 bg-emerald-50/50"
                      )}
                      onClick={() => setSelectedProject(proj.projectId)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-bold truncate">
                              {formatProjectName(proj.projectName)}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: proj.clientColor }} />
                              <span className="text-xs text-muted-foreground truncate">{proj.clientName}</span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0",
                              proj.status === 'red' && "bg-red-100 text-red-700 border-red-300",
                              proj.status === 'yellow' && "bg-amber-100 text-amber-700 border-amber-300",
                              proj.status === 'green' && "bg-emerald-100 text-emerald-700 border-emerald-300"
                            )}
                          >
                            {proj.status === 'red' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {proj.status === 'yellow' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {proj.status === 'green' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {proj.status === 'red' && `+${Math.abs(proj.difference)}h`}
                            {proj.status === 'yellow' && `-${proj.difference}h`}
                            {proj.status === 'green' && 'On Track'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-100 pb-2">
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Contratado</span>
                              <span className="font-bold text-sm block">{proj.contracted}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Total Est.</span>
                              <span className="font-bold text-sm block">{proj.realized}h</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground block text-[10px]">Planificado</span>
                              <span className="font-semibold text-blue-600 block">{proj.plannedHours}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">Computado</span>
                              <span className="font-semibold text-emerald-600 block">{proj.completedHours}h</span>
                            </div>
                          </div>
                        </div>
                        {proj.status === 'red' && (
                          <p className="text-xs text-red-600 mt-2 font-medium">
                            Nos pasamos por {Math.abs(proj.difference)} horas
                          </p>
                        )}
                        {proj.status === 'yellow' && (
                          <p className="text-xs text-amber-600 mt-2 font-medium">
                            Faltan {proj.difference} horas por asignar
                          </p>
                        )}
                        {proj.status === 'green' && (
                          <p className="text-xs text-emerald-600 mt-2 font-medium">
                            En línea con el contrato
                            {proj.contracted === 0 && proj.realized === 0 && (
                              <span className="text-muted-foreground ml-1">(Sin horas planificadas aún)</span>
                            )}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Transferencias de horas */}
        <TabsContent value="transfers" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border shadow-sm p-3">
            {/* Chips de filtro rápido por estado */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Estado:</span>
              <Button
                variant={filterTransferStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setFilterTransferStatus('all')}
              >
                Todas
              </Button>
              <Button
                variant={filterTransferStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setFilterTransferStatus('pending')}
              >
                Pendientes
              </Button>
              <Button
                variant={filterTransferStatus === 'kept' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setFilterTransferStatus('kept')}
              >
                Mantenidas
              </Button>
              <Button
                variant={filterTransferStatus === 'distributed' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setFilterTransferStatus('distributed')}
              >
                Redistribuidas
              </Button>
            </div>
            <div className="w-full border-t my-2"></div>
            <div className="flex-1 min-w-[200px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full h-8 text-xs justify-between bg-white">
                    <span className="truncate">
                      {filterFeedbackEmployee === 'all' ? 'Todos los compañeros' : employees.find(e => e.id === filterFeedbackEmployee)?.name || 'Compañero'}
                    </span>
                    <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar compañero..." />
                    <CommandList>
                      <CommandEmpty>No hay compañeros</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => setFilterFeedbackEmployee('all')}>
                          <Check className={cn("mr-2 h-4 w-4", filterFeedbackEmployee === 'all' ? "opacity-100" : "opacity-0")} />
                          Todos los compañeros
                        </CommandItem>
                        {employees
                          .filter(e => e.isActive)
                          .map(emp => (
                            <CommandItem key={emp.id} value={emp.name} onSelect={() => setFilterFeedbackEmployee(emp.id)}>
                              <Check className={cn("mr-2 h-4 w-4", filterFeedbackEmployee === emp.id ? "opacity-100" : "opacity-0")} />
                              {emp.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full h-8 text-xs justify-between bg-white">
                    <span className="truncate">
                      {filterFeedbackProject === 'all'
                        ? 'Todos los proyectos'
                        : formatProjectName(projects.find(p => p.id === filterFeedbackProject)?.name || '')}
                    </span>
                    <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar proyecto..." />
                    <CommandList>
                      <CommandEmpty>No hay proyectos</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="all" onSelect={() => setFilterFeedbackProject('all')}>
                          <Check className={cn("mr-2 h-4 w-4", filterFeedbackProject === 'all' ? "opacity-100" : "opacity-0")} />
                          Todos los proyectos
                        </CommandItem>
                        {projects
                          .filter(p => p.status === 'active' && !p.isHidden)
                          .map(proj => {
                            const client = clients.find(c => c.id === proj.clientId);
                            return (
                              <CommandItem
                                key={proj.id}
                                value={`${client?.name || ''} ${proj.name}`}
                                onSelect={() => setFilterFeedbackProject(proj.id)}
                              >
                                <Check className={cn("mr-2 h-4 w-4", filterFeedbackProject === proj.id ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{client?.name} - {formatProjectName(proj.name)}</span>
                              </CommandItem>
                            );
                          })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-primary" />
                Transferencias de horas ({format(currentMonth, 'MMMM', { locale: es })})
                {transfers && transfers.length > 0 && (
                  <Badge variant="secondary" className="ml-2 font-normal">
                    {transfers.length}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Historial de tareas reasignadas durante todo el mes de {format(currentMonth, 'MMMM', { locale: es })}
              </p>
            </CardHeader>
            <CardContent>
              {(!transfers || transfers.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay transferencias de horas esta semana
                </div>
              ) : (
                (() => {
                  // Agrupar transferencias por proyecto
                  const groupedByProject = transfers.reduce((acc, transfer) => {
                    const projectId = transfer.projectId || 'sin-proyecto';
                    if (!acc[projectId]) {
                      acc[projectId] = [];
                    }
                    acc[projectId].push(transfer);
                    return acc;
                  }, {} as Record<string, typeof transfers>);

                  return (
                    <div className="space-y-4">
                      {Object.entries(groupedByProject).map(([projectId, projectTransfers]) => {
                        const project = projects.find(p => p.id === projectId);
                        const client = clients.find(c => c.id === project?.clientId);

                        return (
                          <div key={projectId} className="space-y-2">
                            {/* Header del proyecto */}
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color || '#94a3b8' }} />
                              <span className="text-sm font-semibold text-slate-700">
                                {project ? formatProjectName(project.name) : 'Sin proyecto'}
                              </span>
                              <Badge variant="outline" className="ml-auto bg-slate-100 text-slate-600 border-slate-300 text-[10px]">
                                {projectTransfers.length} {projectTransfers.length === 1 ? 'transferencia' : 'transferencias'}
                              </Badge>
                            </div>

                            {/* Transferencias del proyecto */}
                            <div className="space-y-2 pl-4">
                              {projectTransfers.map((transfer, idx) => (
                                <div
                                  key={transfer.uniqueId || idx}
                                  className={cn(
                                    "p-3 rounded-lg border transition-all",
                                    transfer.status === 'pending' && "bg-amber-50/30 border-amber-100",
                                    transfer.status === 'kept' && "bg-blue-50/30 border-blue-100",
                                    transfer.status === 'distributed' && "bg-purple-50/30 border-purple-100",
                                    transfer.status === 'rejected' && "bg-red-50/30 border-red-100"
                                  )}
                                >
                                  <div className="flex items-center gap-4">
                                    {/* Sección izquierda: Transferencia (Avatar → Horas → Avatar) */}
                                    <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-slate-200">
                                      {/* Avatar origen con nombre */}
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <Avatar className="h-9 w-9 border-2 border-slate-200 shrink-0">
                                          <AvatarImage src={transfer.fromEmployeeAvatar} alt={transfer.fromEmployeeName} />
                                          <AvatarFallback className="bg-primary/100 text-white text-xs font-bold">
                                            {transfer.fromEmployeeName.substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold text-sm text-slate-900 whitespace-nowrap min-w-0 max-w-[120px] truncate">
                                          {transfer.fromEmployeeName}
                                        </span>
                                      </div>

                                      {/* Flecha y horas (vertical) */}
                                      <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
                                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                                        <Badge variant="outline" className="bg-primary/10 text-indigo-700 border-indigo-200 font-bold text-[10px] px-1.5 py-0 shrink-0">
                                          {transfer.hours}h
                                        </Badge>
                                      </div>

                                      {/* Avatar destino con nombre */}
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <Avatar className="h-9 w-9 border-2 border-slate-200 shrink-0">
                                          <AvatarImage src={transfer.toEmployeeAvatar} alt={transfer.toEmployeeName} />
                                          <AvatarFallback className="bg-purple-500 text-white text-xs font-bold">
                                            {transfer.toEmployeeName.substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold text-sm text-slate-900 whitespace-nowrap min-w-0 max-w-[120px] truncate">
                                          {transfer.toEmployeeName}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Sección derecha: Información de la tarea */}
                                    <div className="flex-1 min-w-0">
                                      {/* Proyecto y tarea en línea compacta */}
                                      <div className="flex items-center gap-1.5 mb-1">
                                        {project && (
                                          <>
                                            <span className="text-slate-400 text-xs">•</span>
                                            <span className="text-xs font-medium text-slate-600">{formatProjectName(transfer.projectName)}</span>
                                          </>
                                        )}
                                      </div>

                                      {/* Tarea original */}
                                      <div className="mb-1.5">
                                        <p className="text-xs text-slate-500 mb-0.5">Tarea original:</p>
                                        <div className="flex items-center flex-wrap gap-2">
                                          <p className="text-sm font-medium text-slate-900 leading-tight">{transfer.taskName}</p>
                                          <div className="flex items-center gap-1.5">
                                            {transfer.originalWeek && (
                                              <Badge variant="outline" className="text-[10px] h-4 px-1 bg-slate-50 text-slate-400 font-normal border-slate-200">
                                                Semana {getWeekIndex(transfer.originalWeek) !== -1 ? getWeekIndex(transfer.originalWeek) : '?'}
                                              </Badge>
                                            )}
                                            {transfer.targetWeek && transfer.targetWeek !== transfer.originalWeek && (
                                              <>
                                                <ArrowRight className="h-3 w-3 text-slate-300" />
                                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/10 text-indigo-500 font-normal border-indigo-100">
                                                  Semana {getWeekIndex(transfer.targetWeek) !== -1 ? getWeekIndex(transfer.targetWeek) : '?'}
                                                </Badge>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Si está distribuida, mostrar tareas distribuidas */}
                                      {transfer.status === 'distributed' && transfer.distributedTasks && transfer.distributedTasks.length > 0 && (
                                        <div className="mb-1.5 p-2 bg-purple-50/50 rounded border border-purple-200">
                                          <p className="text-xs text-slate-600 mb-1.5 font-medium">
                                            Distribuida en {transfer.distributedTasks.length} tarea{transfer.distributedTasks.length > 1 ? 's' : ''}:
                                          </p>
                                          <div className="space-y-1">
                                            {transfer.distributedTasks.map((task, taskIdx) => {
                                              const weekNum = task.weekDate ? Math.ceil(new Date(task.weekDate).getDate() / 7) : 0;
                                              return (
                                                <div key={taskIdx} className="flex items-center gap-2 text-xs bg-white rounded px-2 py-1 border border-purple-100">
                                                  <span className="font-medium text-slate-800">{task.employeeName || 'Empleado'}</span>
                                                  <span className="text-slate-400">→</span>
                                                  <span className="text-slate-600">{task.name}</span>
                                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-[10px] px-1.5 py-0">
                                                    {task.hours}h · S{weekNum}
                                                  </Badge>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Notas si existen */}
                                      {transfer.notes && (
                                        <div className="mb-1.5 p-1.5 bg-slate-50 rounded border border-slate-200">
                                          <p className="text-xs text-slate-500 mb-0.5">Notas:</p>
                                          <p className="text-xs text-slate-700 leading-relaxed">{transfer.notes}</p>
                                        </div>
                                      )}

                                      {/* Estado */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {transfer.status === 'pending' && (
                                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[10px]">
                                            <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                            Pendiente de aceptación
                                          </Badge>
                                        )}
                                        {transfer.status === 'kept' && (
                                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-[10px]">
                                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                            Mantenida tal cual
                                          </Badge>
                                        )}
                                        {transfer.status === 'distributed' && (
                                          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 text-[10px]">
                                            <Users className="h-2.5 w-2.5 mr-1" />
                                            Redistribuida
                                          </Badge>
                                        )}
                                        {transfer.status === 'rejected' && (
                                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-[10px]">
                                            <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                            Rechazada
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Bloqueos - Quién bloquea a quién */}
        <TabsContent value="blockers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Bloqueos entre tareas
                <Badge variant="outline" className="ml-2">
                  {(() => {
                    // Find tasks that have dependencyId pointing to an uncompleted task
                    const blockedTasks = allocations.filter(a => {
                      if (!a.dependencyId || a.status === 'completed') return false;
                      if (!isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)) return false;
                      const blockingTask = allocations.find(b => b.id === a.dependencyId);
                      return blockingTask && blockingTask.status !== 'completed';
                    });
                    return blockedTasks.length;
                  })()}
                </Badge>
              </CardTitle>
              <p className="text-sm text-slate-500">
                Tareas que dependen de otras para avanzar. Ayuda a identificar cuellos de botella.
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Find tasks that have dependencyId pointing to an uncompleted task
                const blockedTasks = allocations.filter(a => {
                  if (!a.dependencyId || a.status === 'completed') return false;
                  if (!isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)) return false;
                  const blockingTask = allocations.find(b => b.id === a.dependencyId);
                  return blockingTask && blockingTask.status !== 'completed';
                });

                if (blockedTasks.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                      <p className="font-medium">Sin bloqueos activos</p>
                      <p className="text-xs">No hay tareas esperando a que otras terminen</p>
                    </div>
                  );
                }

                // Group by blocking employee
                const blockingGroups = new Map<string, {
                  blockerName: string;
                  blockerAvatar?: string;
                  blockingTasks: Array<{
                    blockingTaskName: string;
                    blockedTaskName: string;
                    blockedEmployee: string;
                    blockedEmployeeAvatar?: string;
                    projectName: string;
                    weekNum: number;
                  }>;
                }>();

                blockedTasks.forEach(blocked => {
                  const blockingTask = allocations.find(a => a.id === blocked.dependencyId);
                  if (!blockingTask) return;

                  const blockerEmployee = employees.find(e => e.id === blockingTask.employeeId);
                  if (!blockerEmployee) return;

                  const key = blockerEmployee.id;
                  if (!blockingGroups.has(key)) {
                    blockingGroups.set(key, {
                      blockerName: blockerEmployee.name,
                      blockerAvatar: blockerEmployee.avatarUrl,
                      blockingTasks: []
                    });
                  }

                  const blockedEmployee = employees.find(e => e.id === blocked.employeeId);
                  const project = projects.find(p => p.id === blocked.projectId);
                  const weekNum = Math.ceil(new Date(blocked.weekStartDate).getDate() / 7);

                  blockingGroups.get(key)!.blockingTasks.push({
                    blockingTaskName: blockingTask.taskName || 'Tarea bloqueadora',
                    blockedTaskName: blocked.taskName || 'Tarea bloqueada',
                    blockedEmployee: blockedEmployee?.name || 'Empleado',
                    blockedEmployeeAvatar: blockedEmployee?.avatarUrl,
                    projectName: project?.name || 'Proyecto',
                    weekNum
                  });
                });

                const groupsArray = Array.from(blockingGroups.entries())
                  .sort((a, b) => b[1].blockingTasks.length - a[1].blockingTasks.length);

                return (
                  <div className="space-y-3">
                    {groupsArray.map(([employeeId, group]) => (
                      <div key={employeeId} className="border rounded-lg p-3 bg-red-50/30">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={group.blockerAvatar} />
                            <AvatarFallback className="bg-red-500 text-white text-xs">
                              {group.blockerName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{group.blockerName}</p>
                            <p className="text-xs text-slate-500">
                              Bloquea {group.blockingTasks.length} tarea{group.blockingTasks.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            {group.blockingTasks.length} bloqueo{group.blockingTasks.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="space-y-1 ml-11">
                          {group.blockingTasks.map((task, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-white rounded px-2 py-1.5 border flex-wrap">
                              <span className="text-slate-600 font-medium">
                                "{task.blockingTaskName}"
                              </span>
                              <ArrowRight className="h-3 w-3 text-red-400 shrink-0" />
                              <span className="text-slate-500">bloquea</span>
                              <Avatar className="h-4 w-4 shrink-0">
                                <AvatarImage src={task.blockedEmployeeAvatar} />
                                <AvatarFallback className="text-[8px] bg-slate-500 text-white">
                                  {task.blockedEmployee.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{task.blockedEmployee}</span>
                              <span className="text-slate-400">en</span>
                              <span className="text-slate-600">"{task.blockedTaskName}"</span>
                              <Badge variant="outline" className="text-[9px] shrink-0">
                                {task.projectName} · S{task.weekNum}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Redistribución - Formulario directo */}
        <TabsContent value="redistribute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Redistribución de Horas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona un proyecto y redistribuye horas entre compañeros
              </p>
            </CardHeader>
            <CardContent>
              {/* Selector de proyecto */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">Proyecto</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full h-10 justify-between">
                      <span className="truncate">
                        {selectedProject
                          ? formatProjectName(projects.find(p => p.id === selectedProject)?.name || '')
                          : 'Seleccionar proyecto...'}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar proyecto..." />
                      <CommandList>
                        <CommandEmpty>No hay proyectos</CommandEmpty>
                        <CommandGroup>
                          {projectForecast.map(proj => {
                            const client = clients.find(c => c.id === projects.find(p => p.id === proj.projectId)?.clientId);
                            return (
                              <CommandItem
                                key={proj.projectId}
                                value={`${client?.name || ''} ${proj.projectName}`}
                                onSelect={() => setSelectedProject(proj.projectId)}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedProject === proj.projectId ? "opacity-100" : "opacity-0")} />
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.clientColor }} />
                                  <span className="truncate">{client?.name} - {formatProjectName(proj.projectName)}</span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Formulario de redistribución (solo si hay proyecto seleccionado) */}
              {selectedProject && (
                <div className="space-y-6 pt-4 border-t">
                  {/* Mostrar el contenido del Sheet aquí directamente */}
                  {delayedTasksByEmployee.length > 0 ? (
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Tareas retrasadas</Label>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded-lg p-3">
                        {delayedTasksByEmployee.map(group => (
                          <div key={group.employeeId} className="space-y-2">
                            {/* Header del empleado */}
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
                                <AvatarFallback className="bg-primary/100 text-white text-[10px]">
                                  {group.employeeName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-sm text-slate-900">{group.employeeName}</span>
                              <Badge variant="outline" className="ml-auto text-xs bg-slate-50">
                                {group.tasks?.length || 0} tarea(s)
                              </Badge>
                            </div>

                            {/* Tareas del empleado */}
                            <div className="space-y-2 pl-8">
                              {(group.tasks || []).map(task => {
                                const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                                const isSelected = redistributeSelectedTasks.has(task.id);

                                return (
                                  <div
                                    key={task.id}
                                    className={cn(
                                      "flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors",
                                      isSelected ? "bg-primary/10 border-indigo-300" : "bg-white border-slate-200 hover:bg-slate-50"
                                    )}
                                    onClick={() => {
                                      setRedistributeSelectedTasks(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(task.id)) {
                                          newSet.delete(task.id);
                                        } else {
                                          newSet.add(task.id);
                                        }
                                        return newSet;
                                      });
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => { }}
                                      className="h-4 w-4"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{task.taskName || 'Sin nombre'}</p>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <span>Asignadas: {task.hoursAssigned}h</span>
                                        <span>Realizadas: {task.hoursActual || 0}h</span>
                                        {remainingHours > 0 && (
                                          <span className="text-amber-600 font-medium">Restantes: {remainingHours}h</span>
                                        )}
                                      </div>
                                    </div>
                                    {remainingHours > 0 && (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                        {remainingHours}h
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Compañero destino */}
                      {redistributeSelectedTasks.size > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Compañero destino</Label>
                          <Select value={redistributeToEmployee} onValueChange={setRedistributeToEmployee}>
                            <SelectTrigger>
                              <SelectValue placeholder="seleccionar compañero destino" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees
                                .filter(e => e.isActive)
                                .map(emp => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Semana destino */}
                      {redistributeToEmployee && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Semana destino</Label>
                          <Select value={redistributeWeek} onValueChange={setRedistributeWeek}>
                            <SelectTrigger>
                              <SelectValue placeholder="seleccionar semana" />
                            </SelectTrigger>
                            <SelectContent>
                              {(futureWeeks || []).map((week, idx) => {
                                const storageKey = getStorageKey(week.weekStart, currentMonth);
                                return (
                                  <SelectItem key={storageKey} value={storageKey}>
                                    Sem {idx + 1} ({format(week.weekStart, 'd MMM', { locale: es })})
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Resumen y carga */}
                      {redistributeToEmployee && redistributeWeek && (() => {
                        const allDelayedTasks = (delayedTasksByEmployee || []).flatMap(g => g.tasks || []);
                        const selectedTasks = allDelayedTasks.filter(t => redistributeSelectedTasks.has(t.id));
                        let totalTransfer = 0;
                        selectedTasks.forEach(task => {
                          const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                          if (remainingHours > 0) {
                            totalTransfer += remainingHours;
                          }
                        });

                        // Calcular carga usando getEmployeeLoadForWeek
                        const weekData = (futureWeeks || []).find(w => {
                          const storageKey = getStorageKey(w.weekStart, currentMonth);
                          return storageKey === redistributeWeek;
                        });

                        if (weekData) {
                          const weekLoad = getEmployeeLoadForWeek(
                            redistributeToEmployee,
                            redistributeWeek,
                            weekData.effectiveStart,
                            weekData.effectiveEnd
                          );

                          const newTotal = weekLoad.hours + totalTransfer;
                          const exceeds = newTotal > weekLoad.capacity;

                          return (
                            <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                              <Label className="text-sm font-medium">Carga del compañero destino</Label>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-white rounded text-xs">
                                  <span>Semana {format(weekData.weekStart, 'd MMM', { locale: es })}</span>
                                  <span className={cn(
                                    "font-semibold",
                                    weekLoad.percentage > 110 ? "text-red-600" : weekLoad.percentage > 100 ? "text-amber-600" : "text-emerald-600"
                                  )}>
                                    {weekLoad.hours}h / {weekLoad.capacity}h ({weekLoad.percentage}%)
                                  </span>
                                </div>
                                {totalTransfer > 0 && (
                                  <div className={cn(
                                    "p-3 rounded border",
                                    exceeds ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                                  )}>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium">Total a transferir:</span>
                                      <span className="font-bold">{totalTransfer.toFixed(1)}h</span>
                                    </div>
                                    <div className="mt-2 text-xs">
                                      <div className="flex items-center justify-between">
                                        <span>Carga actual:</span>
                                        <span>{weekLoad.hours}h / {weekLoad.capacity}h</span>
                                      </div>
                                      <div className={cn(
                                        "flex items-center justify-between mt-1 font-medium",
                                        exceeds ? "text-red-600" : "text-emerald-600"
                                      )}>
                                        <span>Nueva carga:</span>
                                        <span>
                                          {newTotal.toFixed(1)}h / {weekLoad.capacity}h
                                          {exceeds && ` (+${(newTotal - weekLoad.capacity).toFixed(1)}h exceso)`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Botón de redistribuir */}
                      <Button
                        onClick={handleRedistribute}
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={redistributeSelectedTasks.size === 0 || !redistributeToEmployee || !redistributeWeek}
                      >
                        Redistribuir Horas
                      </Button>
                    </div>
                  ) : selectedProject ? (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-700">
                        No hay tareas retrasadas en este proyecto.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Historial de Cambios */}
        <TabsContent value="activity" className="space-y-4">
          <ActivityLogSection currentMonth={currentMonth} />
        </TabsContent>
      </Tabs >
    </div >
  );
}

