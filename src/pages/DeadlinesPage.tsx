/* eslint-disable */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostgrestError } from '@supabase/supabase-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { normalizeDepartments, employeeBelongsToDepartment } from '@/utils/departmentUtils';

import { useProjectFilters } from '@/hooks/useProjectFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, Pencil, Trash2, Save, Search, Eye, EyeOff, ChevronDown, ChevronRight, ChevronLeft,
  Calendar, Users, AlertTriangle, CheckCircle2, XCircle, Copy, Filter, Sparkles, Edit, HelpCircle, PanelRight, Check, Maximize2, ChevronUp, FolderKanban, ArrowRight, Inbox, Share2
} from 'lucide-react';
import { DeadlinesTour, useDeadlinesTour } from '@/components/deadlines/DeadlinesTour';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Deadline, GlobalAssignment } from '@/types';
import { getEffectiveBudget } from '@/utils/budgetUtils';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { cn, matchesAliasingRule } from '@/lib/utils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getTeamEventHoursInRange, getTeamEventDetailsInRange } from '@/utils/teamEventUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function DeadlinesPage() {
  const { projects, clients, employees, absences, teamEvents, currentUser } = useApp();
  const { canAccess } = usePermissions();
  const isManager = canAccess('/planner') || canAccess('/reports') || canAccess('/operaciones') || canAccess('/finanzas');
  const canEditDeadlines = isManager || canAccess('/deadlines');
  const { currentAgency } = useAgency();
  const { selectedDepartmentId } = useDepartmentView();

  const departments = useMemo(() => normalizeDepartments(currentAgency?.settings?.departments), [currentAgency?.settings?.departments]);
  const employeesForView = useMemo(() => {
    if (!selectedDepartmentId || !departments.length) return employees ?? [];
    const dept = departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
    if (!dept) return employees ?? [];
    return (employees ?? []).filter(e => employeeBelongsToDepartment(e.department, dept.id, dept.name));
  }, [employees, selectedDepartmentId, departments]);
  const { showTour } = useDeadlinesTour();
  const isMobile = useIsMobile();
  const { formatName: formatProjectName } = useProjectAliasing();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [globalAssignments, setGlobalAssignments] = useState<GlobalAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGlobalDialogOpen, setIsGlobalDialogOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [editingGlobal, setEditingGlobal] = useState<GlobalAssignment | null>(null);
  const [isSuggestionsExpandedOpen, setIsSuggestionsExpandedOpen] = useState(false);
  const [expandedSuggestionsProjects, setExpandedSuggestionsProjects] = useState<Set<string>>(new Set()); // keys: `${toId}-${fromId}`
  const [expandedSuggestionsEmployees, setExpandedSuggestionsEmployees] = useState<Set<string>>(new Set());
  // Condicionantes de sugerencias: quién puede ceder y techo de carga del receptor
  const [excludedDonorIds, setExcludedDonorIds] = useState<string[]>([]);
  const [maxReceiverLoadPct, setMaxReceiverLoadPct] = useState<number>(100);
  const [maxReceiverLoadPctInput, setMaxReceiverLoadPctInput] = useState<string>('100');
  const [minSenderLoadPct, setMinSenderLoadPct] = useState<number>(30);
  const [minSenderLoadPctInput, setMinSenderLoadPctInput] = useState<string>('30');
  const [suggestionsCondicionantesOpen, setSuggestionsCondicionantesOpen] = useState(false);
  const [rightPanelPorProyectoOpen, setRightPanelPorProyectoOpen] = useState(false);

  // Estados de filtros y vista
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');
  const { activeFilters, filterProject } = useProjectFilters();
  const [filterId, setFilterId] = useState<string>('all');
  const [showHidden, setShowHidden] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [filterByEmployee, setFilterByEmployee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'client' | 'assigned' | 'remaining'>('client');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set());

  // Estado para edición inline
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [inlineFormData, setInlineFormData] = useState<{
    employeeHours: Record<string, number>;
    notes: string;
    isHidden: boolean;
    budgetOverride?: number;
  }>({ employeeHours: {}, notes: '', isHidden: false });
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estado para rastrear quién está editando qué proyecto
  const [editingLocks, setEditingLocks] = useState<Record<string, { employeeId: string; employeeName: string; lockedAt: string }>>({});
  const lockRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockCleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const [formData, setFormData] = useState({
    projectId: '',
    notes: '',
    employeeHours: {} as Record<string, number>,
    isHidden: false,
    budgetOverride: undefined as number | undefined
  });

  const [confirmAction, setConfirmAction] = useState<{ type: 'delete_deadline' | 'delete_allocation' | 'copy_month' | 'delete_month', id?: string, data?: any } | null>(null);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [openFilterType, setOpenFilterType] = useState(false);
  const [openFilterEmployee, setOpenFilterEmployee] = useState(false);
  const [openSortBy, setOpenSortBy] = useState(false);

  const globalAssignmentFormSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    hours: z.number().min(0.1, 'Las horas deben ser mayores a 0'),
    affectsAll: z.boolean(),
    affectedEmployeeIds: z.array(z.string()).optional().default([]),
  });

  type GlobalAssignmentFormValues = z.infer<typeof globalAssignmentFormSchema>;

  const globalAssignmentForm = useForm<GlobalAssignmentFormValues>({
    resolver: zodResolver(globalAssignmentFormSchema),
    defaultValues: {
      name: '',
      hours: 0,
      affectsAll: true,
      affectedEmployeeIds: [],
    },
  });

  // Cargar deadlines desde Supabase (filtrados por agencia para multi-tenant)
  const loadDeadlines = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchDeadlinesForMonth(selectedMonth, currentAgency?.id);
      if (error) throw error;

      if (data && data.length > 0) {
        setDeadlines(data);
        const hidden = new Set<string>();
        data.forEach(d => { if (d.isHidden) hidden.add(d.projectId); });
        setHiddenProjects(hidden);
      } else {
        setDeadlines([]);
        setHiddenProjects(new Set());
      }
    } catch (error) {
      console.error('Error cargando deadlines:', error);
      const errorMessage = (error as Error)?.message || 'Error al cargar deadlines';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar asignaciones globales
  const loadGlobalAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('global_assignments')
        .select('*')
        .eq('month', selectedMonth)
        .eq('agency_id', currentAgency?.id) // Filtro de agencia
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setGlobalAssignments(data.map((g: { id: string; month: string; name: string; hours: number; affects_all: boolean; affected_employee_ids?: string[]; employee_id?: string; created_by?: string }) => ({
          id: g.id,
          month: g.month,
          name: g.name,
          hours: Number(g.hours),
          affectsAll: g.affects_all,
          affectedEmployeeIds: (g.affected_employee_ids || []) as string[],
          employeeId: g.employee_id || g.created_by
        })));
      }
    } catch (error) {
      console.error('Error cargando asignaciones globales:', error);
    }
  };

  // Cargar al montar y cuando cambia el mes
  useEffect(() => {
    loadDeadlines();
    loadGlobalAssignments();

    // Limpiar cualquier lock huérfano de este usuario al cargar/cambiar mes
    const cleanupMyLocks = async () => {
      if (currentUser) {
        try {
          await supabase
            .from('project_editing_locks')
            .delete()
            .eq('employee_id', currentUser.id)
            .eq('month', selectedMonth);
        } catch (error) {
          console.error('Error limpiando locks al cargar:', error);
        }
      }
    };
    cleanupMyLocks();
  }, [selectedMonth, currentUser]);

  // Suscripción unificada en tiempo real (Deadlines, Global Assignments, Locks & Presence)
  useEffect(() => {
    if (!selectedMonth || !currentAgency) return;

    // Canal por agencia y mes (defensa en profundidad: cada agencia tiene su propio canal)
    const channelName = `deadlines-room-${currentAgency?.id}-${selectedMonth}`;

    const channel = supabase.channel(channelName)
      // 1. Listeners para Deadlines
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deadlines',
          filter: `month=eq.${selectedMonth}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newDeadline = payload.new as any;
            // Verificar si pertenece a un proyecto de la agencia actual
            if (!projects.find(p => p.id === newDeadline.project_id)) return;

            setDeadlines(prev => {
              const existing = prev.find(d => d.id === newDeadline.id);
              if (existing) {
                return prev.map(d =>
                  d.id === newDeadline.id
                    ? {
                      id: newDeadline.id,
                      projectId: newDeadline.project_id,
                      month: newDeadline.month,
                      notes: newDeadline.notes,
                      employeeHours: newDeadline.employee_hours || {},
                      isHidden: newDeadline.is_hidden || false,
                      budgetOverride: newDeadline.budget_override ?? undefined
                    }
                    : d
                );
              } else {
                return [...prev, {
                  id: newDeadline.id,
                  projectId: newDeadline.project_id,
                  month: newDeadline.month,
                  notes: newDeadline.notes,
                  employeeHours: newDeadline.employee_hours || {},
                  isHidden: newDeadline.is_hidden || false,
                  budgetOverride: newDeadline.budget_override ?? undefined
                }];
              }
            });

            // Actualizar proyectos ocultos
            if (newDeadline.is_hidden) {
              setHiddenProjects(prev => new Set([...prev, newDeadline.project_id]));
            } else {
              setHiddenProjects(prev => {
                const newSet = new Set(prev);
                newSet.delete(newDeadline.project_id);
                return newSet;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setDeadlines(prev => prev.filter(d => d.id !== deletedId));
          }
        }
      )
      // 2. Listeners para Global Assignments
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_assignments',
          filter: `month=eq.${selectedMonth}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const payloadNew = payload.new as any;
            // Filtrar por agencia
            if (payloadNew.agency_id && payloadNew.agency_id !== currentAgency.id) return;

            const newAssignment = payload.new as { id: string; name: string; hours: number; affects_all: boolean; affected_employee_ids?: string[]; month: string; employee_id?: string; created_by?: string };
            setGlobalAssignments(prev => {
              const existing = prev.find(a => a.id === newAssignment.id);
              if (existing) {
                return prev.map(a =>
                  a.id === newAssignment.id
                    ? {
                      id: newAssignment.id,
                      name: newAssignment.name,
                      hours: newAssignment.hours,
                      affectsAll: newAssignment.affects_all,
                      affectedEmployeeIds: (newAssignment.affected_employee_ids || []) as string[],
                      month: newAssignment.month,
                      employeeId: newAssignment.employee_id || newAssignment.created_by
                    }
                    : a
                );
              } else {
                return [...prev, {
                  id: newAssignment.id,
                  name: newAssignment.name,
                  hours: newAssignment.hours,
                  affectsAll: newAssignment.affects_all,
                  affectedEmployeeIds: (newAssignment.affected_employee_ids || []) as string[],
                  month: newAssignment.month,
                  employeeId: newAssignment.employee_id || newAssignment.created_by
                }];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setGlobalAssignments(prev => prev.filter(a => a.id !== deletedId));
          }
        }
      )
      // 3. Listeners para Editing Locks
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_editing_locks',
          filter: `month=eq.${selectedMonth}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const lock = payload.new as { employee_id: string; project_id: string; expires_at: string; locked_at: string };
            // Solo mostrar si no es nuestro propio lock y no ha expirado
            if (lock.employee_id !== currentUser?.id && lock.expires_at > new Date().toISOString()) {
              const employee = employees.find(e => e.id === lock.employee_id);
              setEditingLocks(prev => ({
                ...prev,
                [lock.project_id]: {
                  employeeId: lock.employee_id,
                  employeeName: employee?.first_name || employee?.name || 'Alguien',
                  lockedAt: lock.locked_at
                }
              }));
            }
          }
          // DELETE se maneja mejor via broadcast para inmediatez, pero podríamos añadirlo aquí tb
        }
      )
      // 4. Listeners para Broadcast (Locks liberados)
      .on(
        'broadcast',
        { event: 'lock-released' },
        (payload) => {
          const { projectIds, employeeId } = payload.payload as { projectIds: string[]; employeeId: string };
          // Solo procesar si no es nuestro propio broadcast
          if (employeeId !== currentUser?.id && projectIds?.length > 0) {
            setEditingLocks(prev => {
              const newLocks = { ...prev };
              projectIds.forEach(projectId => {
                if (newLocks[projectId]?.employeeId === employeeId) {
                  delete newLocks[projectId];
                }
              });
              return newLocks;
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error en suscripción Realtime unificada (${channelName})`);
        } else if (status === 'SUBSCRIBED') {
          // console.log(`✅ Suscrito a ${channelName}`);
        }
      });

    // Guardar referencia para enviar broadcasts
    broadcastChannelRef.current = channel;

    return () => {
      broadcastChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [selectedMonth, currentAgency, projects, currentUser, employees]);



  // Cargar locks de edición existentes
  useEffect(() => {
    const loadEditingLocks = async () => {
      try {
        const { data, error } = await supabase
          .from('project_editing_locks')
          .select('*')
          .eq('month', selectedMonth)
          .gt('expires_at', new Date().toISOString());

        if (error) throw error;

        if (data) {
          const locksMap: Record<string, { employeeId: string; employeeName: string; lockedAt: string }> = {};
          data.forEach((lock: { employee_id: string; project_id: string; expires_at: string; locked_at: string }) => {
            const employee = employees.find(e => e.id === lock.employee_id);
            // Solo mostrar locks de OTROS usuarios, no los propios
            if (employee && lock.employee_id !== currentUser?.id && lock.expires_at > new Date().toISOString()) {
              locksMap[lock.project_id] = {
                employeeId: lock.employee_id,
                employeeName: employee.first_name || employee.name || 'Desconocido',
                lockedAt: lock.locked_at
              };
            }
          });
          setEditingLocks(locksMap);
        }
      } catch (error) {
        console.error('Error cargando locks:', error);
      }
    };

    loadEditingLocks();
  }, [selectedMonth, employees, currentUser]);



  // Limpiar locks al desmontar o cambiar de mes
  useEffect(() => {
    return () => {
      // Limpiar interval de renovación
      if (lockRefreshIntervalRef.current) {
        clearInterval(lockRefreshIntervalRef.current);
      }
      if (lockCleanupIntervalRef.current) {
        clearInterval(lockCleanupIntervalRef.current);
      }
      // Remover listener de beforeunload
      if ((window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload) {
        window.removeEventListener('beforeunload', (window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload as EventListener);
        delete (window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload;
      }
      // Liberar lock si estamos editando
      if (editingProjectId && currentUser) {
        releaseEditLock(editingProjectId);
      }
    };
  }, [editingProjectId, currentUser, selectedMonth]);

  // Limpiar locks huérfanos periódicamente (cada minuto)
  useEffect(() => {
    const cleanupOrphanedLocks = async () => {
      try {
        // Eliminar locks expirados (sin heartbeat en los últimos 2 minutos)
        const { error } = await supabase
          .from('project_editing_locks')
          .delete()
          .lt('expires_at', new Date().toISOString());

        if (error) {
          console.error('Error limpiando locks huérfanos:', error);
        }
      } catch (error) {
        console.error('Error en limpieza de locks:', error);
      }
    };

    // Ejecutar inmediatamente y luego cada minuto
    cleanupOrphanedLocks();
    lockCleanupIntervalRef.current = setInterval(cleanupOrphanedLocks, 60 * 1000);

    return () => {
      if (lockCleanupIntervalRef.current) {
        clearInterval(lockCleanupIntervalRef.current);
      }
    };
  }, []);

  const activeEmployees = useMemo(() => {
    return employeesForView.filter(e => e.isActive).sort((a, b) =>
      (a.first_name || a.name).localeCompare(b.first_name || b.name)
    );
  }, [employeesForView]);

  // Calcular capacidad mensual de un empleado (restando ausencias y eventos)
  const getMonthlyCapacity = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return { total: 0, absenceHours: 0, eventHours: 0, available: 0, absenceDetails: [], eventDetails: [] };

    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const workSchedule = employee.workSchedule;

    // Calcular horas base del horario
    let baseHours = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
      baseHours += workSchedule[dayKey as keyof typeof workSchedule] || 0;
    }

    // Restar ausencias (con detalles)
    const employeeAbsences = absences.filter(a => a.employeeId === employeeId);
    const absenceHours = getAbsenceHoursInRange(monthStart, monthEnd, employeeAbsences, workSchedule);

    // Calcular detalle de cada ausencia que afecta este mes
    const absenceDetails = employeeAbsences
      .filter(a => {
        const start = new Date(a.startDate);
        const end = new Date(a.endDate);
        return start <= monthEnd && end >= monthStart;
      })
      .map(a => {
        const hours = getAbsenceHoursInRange(monthStart, monthEnd, [a], workSchedule);
        return {
          type: a.type,
          startDate: a.startDate,
          endDate: a.endDate,
          hours
        };
      })
      .filter(a => a.hours > 0);

    // Restar eventos del equipo (con detalles)
    const eventHours = getTeamEventHoursInRange(monthStart, monthEnd, employeeId, teamEvents, workSchedule, employeeAbsences);

    // Calcular detalle de cada evento que afecta este mes usando la función correcta
    const eventDetails = getTeamEventDetailsInRange(monthStart, monthEnd, employeeId, teamEvents, workSchedule, employeeAbsences);

    const available = Math.max(0, baseHours - absenceHours - eventHours);

    return { total: baseHours, absenceHours, eventHours, available, absenceDetails, eventDetails };
  };

  // Calcular horas asignadas a un empleado (deadlines + globales)
  const getEmployeeAssignedHours = (employeeId: string) => {
    let total = 0;

    // Sumar horas de deadlines
    deadlines.forEach(deadline => {
      if (!hiddenProjects.has(deadline.projectId) && !deadline.isHidden) {
        total += deadline.employeeHours[employeeId] || 0;
      }
    });

    // Sumar asignaciones globales
    globalAssignments.forEach(assignment => {
      if (assignment.affectsAll || (assignment.affectedEmployeeIds as string[])?.includes(employeeId)) {
        total += assignment.hours;
      }
    });

    return total;
  };

  // Filtrar proyectos
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(p => p.status === 'active');

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        const client = clients.find(c => c.id === p.clientId);
        return (
          p.name.toLowerCase().includes(term) ||
          client?.name.toLowerCase().includes(term)
        );
      });
    }

    // Filtro dinámico de proyectos (reemplaza a SEO/PPC hardcodeados)
    if (filterId !== 'all') {
      filtered = filtered.filter(p => filterProject(p, filterId));
    }

    // Filtrar ocultos
    if (!showHidden) {
      filtered = filtered.filter(p => !hiddenProjects.has(p.id));
    }

    // Filtrar por empleado asignado
    if (filterByEmployee !== 'all') {
      filtered = filtered.filter(p => {
        const deadline = deadlines.find(d => d.projectId === p.id && d.month === selectedMonth);
        return deadline && (deadline.employeeHours[filterByEmployee] || 0) > 0;
      });
    }

    // Filtrar solo proyectos sin asignar
    if (showUnassignedOnly) {
      filtered = filtered.filter(p => {
        const deadline = deadlines.find(d => d.projectId === p.id && d.month === selectedMonth);
        if (!deadline) return true; // Sin deadline = sin asignar
        const totalAssigned = (Object.values(deadline.employeeHours) as number[]).reduce((s, h) => s + (h || 0), 0);
        return totalAssigned === 0;
      });
    }

    // Filtrar vista para empleados (solo ver lo asignado a ellos)
    // NOTA: Permitimos que los empleados vean todos los proyectos de la agencia
    // para que puedan ver qué proyectos existen, incluso si aún no tienen asignaciones.
    // Si se desea restringir más, se puede descomentar el filtro siguiente:
    // if (!isManager && currentUser) {
    //   filtered = filtered.filter(p => {
    //     const deadline = deadlines.find(d => d.projectId === p.id && d.month === selectedMonth);
    //     return deadline && (deadline.employeeHours[currentUser.id] || 0) > 0;
    //   });
    // }

    // Ordenar proyectos
    filtered.sort((a, b) => {
      if (sortBy === 'client') {
        const clientA = clients.find(c => c.id === a.clientId)?.name || '';
        const clientB = clients.find(c => c.id === b.clientId)?.name || '';
        return clientA.localeCompare(clientB);
      } else if (sortBy === 'assigned') {
        const deadlineA = deadlines.find(d => d.projectId === a.id && d.month === selectedMonth);
        const deadlineB = deadlines.find(d => d.projectId === b.id && d.month === selectedMonth);
        const totalA = deadlineA ? (Object.values(deadlineA.employeeHours) as number[]).reduce((s, h) => s + (h || 0), 0) : 0;
        const totalB = deadlineB ? (Object.values(deadlineB.employeeHours) as number[]).reduce((s, h) => s + (h || 0), 0) : 0;
        return totalB - totalA;
      } else {
        const deadlineA = deadlines.find(d => d.projectId === a.id && d.month === selectedMonth);
        const deadlineB = deadlines.find(d => d.projectId === b.id && d.month === selectedMonth);
        const assignedA = deadlineA ? (Object.values(deadlineA.employeeHours) as number[]).reduce((s, h) => s + (h || 0), 0) : 0;
        const assignedB = deadlineB ? (Object.values(deadlineB.employeeHours) as number[]).reduce((s, h) => s + (h || 0), 0) : 0;
        const remainingA = getEffectiveBudget(a, deadlineA) - assignedA;
        const remainingB = getEffectiveBudget(b, deadlineB) - assignedB;
        return remainingB - remainingA;
      }
    });

    return filtered;
  }, [projects, clients, searchTerm, filterId, showHidden, showUnassignedOnly, hiddenProjects, filterByEmployee, deadlines, selectedMonth, sortBy, filterProject]);

  // Agrupar proyectos por cliente (unificando según reglas de aliasing)
  const projectsByClient = useMemo(() => {
    const grouped: Record<string, typeof filteredProjects> = {};
    const aliasingRules = currentAgency?.settings?.projectAliasingRules || [];

    filteredProjects.forEach(project => {
      // Verificar si el proyecto coincide con alguna regla de aliasing
      const matchedRule = matchesAliasingRule(project.name, aliasingRules);

      // Si coincide y la regla agrupa como cliente virtual, usar ese cliente
      const clientId = (matchedRule && matchedRule.groupAsVirtualClient)
        ? matchedRule.id
        : (project.clientId || 'sin-cliente');

      if (!grouped[clientId]) {
        grouped[clientId] = [];
      }
      grouped[clientId].push(project);
    });

    return grouped;
  }, [filteredProjects, currentAgency?.settings?.projectAliasingRules]);

  // Expandir todos los clientes por defecto
  useEffect(() => {
    const allClientIds = Object.keys(projectsByClient);
    setExpandedClients(new Set(allClientIds));
  }, [projectsByClient]);

  const openDialog = (deadline?: Deadline) => {
    if (deadline) {
      setEditingDeadline(deadline);
      setFormData({
        projectId: deadline.projectId,
        notes: deadline.notes || '',
        employeeHours: { ...deadline.employeeHours },
        isHidden: deadline.isHidden || false,
        budgetOverride: deadline.budgetOverride
      });
    } else {
      setEditingDeadline(null);
      setFormData({
        projectId: '',
        notes: '',
        employeeHours: {},
        isHidden: false,
        budgetOverride: undefined
      });
    }
    setIsDialogOpen(true);
  };

  const openGlobalDialog = (assignment?: GlobalAssignment) => {
    if (assignment) {
      setEditingGlobal(assignment);
      globalAssignmentForm.reset({
        name: assignment.name,
        hours: assignment.hours,
        affectsAll: assignment.affectsAll,
        affectedEmployeeIds: assignment.affectedEmployeeIds || []
      });
    } else {
      setEditingGlobal(null);
      globalAssignmentForm.reset({
        name: '',
        hours: 0,
        affectsAll: true,
        affectedEmployeeIds: []
      });
    }
    setIsGlobalDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.projectId) {
      toast.error('Selecciona un proyecto');
      return;
    }

    try {
      const deadlineData = {
        project_id: formData.projectId,
        month: selectedMonth,
        notes: formData.notes || null,
        employee_hours: formData.employeeHours,
        is_hidden: formData.isHidden,
        budget_override: formData.budgetOverride ?? null
      };

      if (editingDeadline) {
        const { error } = await supabase
          .from('deadlines')
          .update(deadlineData)
          .eq('id', editingDeadline.id);

        if (error) throw error;

        setDeadlines(prev => prev.map(d =>
          d.id === editingDeadline.id
            ? { ...d, ...deadlineData, projectId: formData.projectId, notes: formData.notes, employeeHours: formData.employeeHours, isHidden: formData.isHidden }
            : d
        ));

        if (formData.isHidden) {
          setHiddenProjects(prev => new Set([...prev, formData.projectId]));
        } else {
          setHiddenProjects(prev => {
            const newSet = new Set(prev);
            newSet.delete(formData.projectId);
            return newSet;
          });
        }

        toast.success('Deadline actualizado');
      } else {
        const { data, error } = await supabase
          .from('deadlines')
          .insert(deadlineData)
          .select()
          .single();

        if (error) throw error;

        setDeadlines(prev => [...prev, {
          id: data.id,
          projectId: data.project_id,
          month: data.month,
          notes: data.notes,
          employeeHours: data.employee_hours || {},
          isHidden: data.is_hidden || false
        }]);

        if (formData.isHidden) {
          setHiddenProjects(prev => new Set([...prev, formData.projectId]));
        }

        toast.success('Deadline creado');
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error guardando deadline:', error);
      toast.error((error as Error)?.message || 'Error al guardar deadline');
    }
  };

  const onSaveGlobal = async (data: GlobalAssignmentFormValues) => {

    try {
      const assignmentData = {
        month: selectedMonth,
        name: data.name,
        hours: data.hours,
        affects_all: data.affectsAll,
        affected_employee_ids: data.affectsAll ? null : data.affectedEmployeeIds,
        employee_id: undefined as string | undefined,
        agency_id: currentAgency?.id
      };

      // Al crear, guardar el employee_id del usuario actual
      if (!editingGlobal && currentUser) {
        assignmentData.employee_id = currentUser.id;
      }

      if (editingGlobal) {
        const { error } = await supabase
          .from('global_assignments')
          .update(assignmentData)
          .eq('id', editingGlobal.id);

        if (error) throw error;

        setGlobalAssignments(prev => prev.map(a =>
          a.id === editingGlobal.id
            ? { ...a, ...assignmentData, month: selectedMonth, name: data.name, hours: data.hours, affectsAll: data.affectsAll, affectedEmployeeIds: data.affectedEmployeeIds || [], employeeId: editingGlobal.employeeId }
            : a
        ));
        toast.success('Asignación global actualizada');
      } else {
        const { data, error } = await supabase
          .from('global_assignments')
          .insert(assignmentData)
          .select()
          .single();

        if (error) throw error;

        setGlobalAssignments(prev => [...prev, {
          id: data.id,
          month: data.month,
          name: data.name,
          hours: data.hours,
          affectsAll: data.affects_all,
          affectedEmployeeIds: data.affected_employee_ids || [],
          employeeId: data.employee_id || data.created_by
        }]);
        toast.success('Asignación global creada');
      }

      setIsGlobalDialogOpen(false);
    } catch (error) {
      console.error('Error guardando asignación global:', error);
      const errorMessage = (error as Error)?.message || 'Error al guardar asignación global';
      toast.error(errorMessage);
    }
  };

  const confirmDeleteDeadline = async () => {
    if (!editingDeadline) return;

    try {
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', editingDeadline.id);

      if (error) throw error;

      setDeadlines(prev => prev.filter(d => d.id !== editingDeadline.id));
      toast.success('Deadline eliminado');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error eliminando deadline:', error);
      toast.error('Error al eliminar deadline');
    }
  };

  const handleDeleteDeadline = () => {
    if (!editingDeadline) return;
    setConfirmAction({ type: 'delete_deadline', id: editingDeadline.id });
  };

  const confirmDeleteGlobal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('global_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGlobalAssignments(prev => prev.filter(a => a.id !== id));
      toast.success('Asignación eliminada');
      if (isGlobalDialogOpen) setIsGlobalDialogOpen(false);
    } catch (error) {
      console.error('Error eliminando asignación global:', error);
      toast.error('Error al eliminar asignación global');
    }
  };



  const handleDeleteGlobal = (id: string) => {
    if (!currentUser) {
      toast.error('No hay usuario autenticado');
      return;
    }

    const assignment = globalAssignments.find(a => a.id === id);
    if (!assignment) {
      toast.error('Asignación no encontrada');
      return;
    }

    // Solo permitir eliminar asignaciones propias
    if (assignment.employeeId && assignment.employeeId !== currentUser.id) {
      toast.error('Solo puedes eliminar tus propias asignaciones');
      return;
    }

    setConfirmAction({ type: 'delete_allocation', id: id });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'delete_deadline') {
      await confirmDeleteDeadline();
    } else if (confirmAction.type === 'delete_allocation') {
      if (confirmAction.id) {
        await confirmDeleteGlobal(confirmAction.id);
      }
    } else if (confirmAction.type === 'copy_month') {
      await executeCopyFromPreviousMonth();
    } else if (confirmAction.type === 'delete_month') {
      await executeDeleteMonth();
    }
    setConfirmAction(null);
  };

  const handleDeleteMonth = () => {
    if (deadlines.length === 0) {
      toast.info('No hay deadlines para eliminar en este mes');
      return;
    }
    setConfirmAction({
      type: 'delete_month',
      data: { count: deadlines.length }
    });
  };

  const executeDeleteMonth = async () => {
    if (!currentAgency?.id) return;
    setIsLoading(true);
    try {
      // Solo borrar deadlines de proyectos de esta agencia (evitar borrar otras agencias en mismo Supabase)
      const agencyProjectIds = projects.map(p => p.id);
      if (agencyProjectIds.length === 0) {
        setDeadlines([]);
        setHiddenProjects(new Set());
        setIsLoading(false);
        return;
      }
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('month', selectedMonth)
        .in('project_id', agencyProjectIds);

      if (error) throw error;

      setDeadlines([]);
      setHiddenProjects(new Set());
      toast.success('Mes reseteado correctamente');
    } catch (error) {
      console.error('Error reseteando mes:', error);
      toast.error('Error al resetear el mes');
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para gestionar locks de edición
  const acquireEditLock = async (projectId: string) => {
    if (!currentUser) return false;

    try {
      // Limpiar locks expirados primero
      await supabase
        .from('project_editing_locks')
        .delete()
        .lt('expires_at', new Date().toISOString());

      // PRIMERO verificar si ya existe un lock activo de otro usuario
      const { data: existingLock } = await supabase
        .from('project_editing_locks')
        .select('*')
        .eq('project_id', projectId)
        .eq('month', selectedMonth)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existingLock) {
        // Si el lock es de otro usuario, rechazar
        if (existingLock.employee_id !== currentUser.id) {
          const editor = employees.find(e => e.id === existingLock.employee_id);
          toast.warning(`${editor?.first_name || editor?.name || 'Alguien'} está editando este proyecto. Espera a que termine.`);
          return false;
        }
        // Si es nuestro lock, renovarlo y continuar
        await supabase
          .from('project_editing_locks')
          .update({
            expires_at: new Date(Date.now() + 60 * 1000).toISOString() // 1 minuto
          })
          .eq('id', existingLock.id);
        return true;
      }

      // No hay lock existente, crear uno nuevo
      const { error } = await supabase
        .from('project_editing_locks')
        .insert({
          project_id: projectId,
          employee_id: currentUser.id,
          month: selectedMonth,
          expires_at: new Date(Date.now() + 60 * 1000).toISOString() // 1 minuto
        });

      if (error) {
        console.error('Error creando lock:', error);
        // Si falla por conflicto, verificar de nuevo
        const { data: conflictLock } = await supabase
          .from('project_editing_locks')
          .select('*')
          .eq('project_id', projectId)
          .eq('month', selectedMonth)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle() as { data: { employee_id: string } | null, error: unknown };

        if (conflictLock && conflictLock.employee_id !== currentUser.id) {
          const editor = employees.find(e => e.id === conflictLock.employee_id);
          toast.warning(`${editor?.first_name || editor?.name || 'Alguien'} está editando este proyecto. Espera a que termine.`);
          return false;
        }
      }

      return true;
    } catch (error: unknown) {
      console.error('Error adquiriendo lock:', error);
      return false; // Cambiar a false para ser más estricto
    }
  };

  const renewEditLock = async (projectId: string) => {
    if (!currentUser || editingProjectId !== projectId) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('project_editing_locks')
        .update({
          expires_at: new Date(Date.now() + 60 * 1000).toISOString() // 1 minuto de expiración
        })
        .eq('project_id', projectId)
        .eq('employee_id', currentUser.id)
        .eq('month', selectedMonth) as { error: unknown };

      if (error) {
        console.error('Error renovando lock:', error);
        // Si falla la renovación, puede ser que el lock ya no existe, cancelar edición
        if ((error as { code?: string })?.code === 'PGRST116') {
          cancelEditingProject();
        }
      }
    } catch (error: unknown) {
      console.error('Error renovando lock:', error);
    }
  };

  const releaseEditLock = async (projectId: string) => {
    if (!currentUser) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('project_editing_locks')
        .delete()
        .eq('project_id', projectId)
        .eq('employee_id', currentUser.id)
        .eq('month', selectedMonth) as { error: unknown };

      if (error) {
        console.error('Error liberando lock:', error);
      }

      // Enviar broadcast para notificar a otros usuarios
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'lock-released',
          payload: { projectIds: [projectId], employeeId: currentUser.id }
        });
      }

      // También actualizar el estado local de locks
      setEditingLocks(prev => {
        const newLocks = { ...prev };
        delete newLocks[projectId];
        return newLocks;
      });
    } catch (error: unknown) {
      console.error('Error liberando lock:', error);
    }
  };

  // Liberar TODOS los locks de este usuario (para limpieza)
  const releaseAllMyLocks = async () => {
    if (!currentUser) return;

    try {
      // Primero obtener los IDs de proyectos que tenemos bloqueados
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: myLocks } = await supabase
        .from('project_editing_locks')
        .select('project_id')
        .eq('employee_id', currentUser.id)
        .eq('month', selectedMonth) as { data: { project_id: string }[] | null, error: unknown };

      // Eliminar de la BD
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('project_editing_locks')
        .delete()
        .eq('employee_id', currentUser.id)
        .eq('month', selectedMonth) as { error: unknown };

      if (error) {
        console.error('Error liberando todos los locks:', error);
      }

      // Enviar broadcast para notificar a otros usuarios
      if (myLocks && myLocks.length > 0 && broadcastChannelRef.current) {
        const projectIds = myLocks.map(lock => lock.project_id);
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'lock-released',
          payload: { projectIds, employeeId: currentUser.id }
        });

        // También actualizar estado local
        setEditingLocks(prev => {
          const newLocks = { ...prev };
          projectIds.forEach(projectId => {
            if (newLocks[projectId]?.employeeId === currentUser.id) {
              delete newLocks[projectId];
            }
          });
          return newLocks;
        });
      }
    } catch (error) {
      console.error('Error liberando todos los locks:', error);
    }
  };

  // Funciones de edición inline
  const startEditingProject = async (projectId: string) => {
    if (!canEditDeadlines) return;
    // Si ya estamos editando este proyecto, no hacer nada
    if (editingProjectId === projectId) return;

    // PRIMERO: Liberar TODOS los locks de este usuario en este mes
    // Esto asegura que no queden locks huérfanos
    await releaseAllMyLocks();

    // Limpiar estado de edición anterior si existe
    if (editingProjectId) {
      if (lockRefreshIntervalRef.current) {
        clearInterval(lockRefreshIntervalRef.current);
        lockRefreshIntervalRef.current = null;
      }
      if ((window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload) {
        window.removeEventListener('beforeunload', (window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload as EventListener);
        delete (window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload;
      }
    }

    // Intentar adquirir el lock (ahora que no tenemos ningún lock activo)
    const lockAcquired = await acquireEditLock(projectId);
    if (!lockAcquired) {
      // No se pudo adquirir el lock, no permitir editar
      setEditingProjectId(null);
      return;
    }

    const deadline = getProjectDeadline(projectId);
    setEditingProjectId(projectId);
    setInlineFormData({
      employeeHours: deadline?.employeeHours ? { ...deadline.employeeHours } : {},
      notes: deadline?.notes || '',
      isHidden: deadline?.isHidden || hiddenProjects.has(projectId),
      budgetOverride: deadline?.budgetOverride
    });
    setExpandedProjects(prev => new Set([...prev, projectId]));

    // Renovar el lock cada 20 segundos mientras se edita (heartbeat más frecuente)
    if (lockRefreshIntervalRef.current) {
      clearInterval(lockRefreshIntervalRef.current);
    }
    lockRefreshIntervalRef.current = setInterval(() => {
      renewEditLock(projectId);
    }, 20 * 1000); // Cada 20 segundos

    // Liberar lock cuando se cierra la ventana/pestaña
    const handleBeforeUnload = () => {
      if (editingProjectId === projectId && currentUser) {
        // Usar sendBeacon para asegurar que se ejecute aunque se cierre la ventana
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/project_editing_locks?project_id=eq.${projectId}&employee_id=eq.${currentUser.id}&month=eq.${selectedMonth}`,
          new Blob([], { type: 'application/json' })
        );
        // También intentar liberar normalmente
        releaseEditLock(projectId);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Guardar referencia para poder remover el listener
    (window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload = handleBeforeUnload;
  };

  const cancelEditingProject = async () => {
    const projectIdToRelease = editingProjectId;

    if (projectIdToRelease) {
      await releaseEditLock(projectIdToRelease);
    }

    if (lockRefreshIntervalRef.current) {
      clearInterval(lockRefreshIntervalRef.current);
      lockRefreshIntervalRef.current = null;
    }

    // Remover listener de beforeunload
    if ((window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload) {
      window.removeEventListener('beforeunload', (window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload as EventListener);
      delete (window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload;
    }

    setEditingProjectId(null);
    setInlineFormData({ employeeHours: {}, notes: '', isHidden: false, budgetOverride: undefined });
  };

  const toggleProjectExpanded = async (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
        // Si estamos editando este proyecto, cerrarlo y liberar lock
        if (editingProjectId === projectId) {
          cancelEditingProject(); // Liberar lock
        }
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const updateInlineEmployeeHours = (employeeId: string, hours: number, projectId: string, immediate = false) => {
    const newFormData = {
      ...inlineFormData,
      employeeHours: {
        ...inlineFormData.employeeHours,
        [employeeId]: hours >= 0 ? hours : 0
      }
    };
    setInlineFormData(newFormData);

    // Si es guardado inmediato, cancelar timeout y guardar ahora
    if (immediate) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      autoSaveDeadline(projectId, newFormData);
    } else {
      // Disparar autoguardado con debounce
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      setAutoSaveStatus('idle');
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveDeadline(projectId, newFormData);
      }, 800);
    }
  };

  const autoSaveDeadline = async (projectId: string, formData: typeof inlineFormData) => {
    setAutoSaveStatus('saving');
    try {
      const existingDeadline = getProjectDeadline(projectId);
      const deadlineData = {
        project_id: projectId,
        month: selectedMonth,
        notes: formData.notes || null,
        employee_hours: formData.employeeHours,
        is_hidden: formData.isHidden,
        budget_override: formData.budgetOverride ?? null
      };

      if (existingDeadline) {
        const { error } = await supabase
          .from('deadlines')
          .update(deadlineData)
          .eq('id', existingDeadline.id);

        if (error) throw error;
        // No actualizamos el estado local aquí - Realtime lo hará automáticamente
      } else {
        const { data, error } = await supabase
          .from('deadlines')
          .insert(deadlineData)
          .select()
          .single();

        if (error) throw error;
        // No actualizamos el estado local aquí - Realtime lo hará automáticamente
      }

      // Actualizar proyectos ocultos localmente (no se sincroniza por Realtime)
      if (formData.isHidden) {
        setHiddenProjects(prev => new Set([...prev, projectId]));
      } else {
        setHiddenProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
      }

      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 1500);
    } catch (error) {
      console.error('Error auto-saving:', error);
      setAutoSaveStatus('idle');
      toast.error('Error al guardar');
    }
  };

  const saveInlineDeadline = async (projectId: string) => {
    setIsSaving(true);
    try {
      const existingDeadline = getProjectDeadline(projectId);
      const deadlineData = {
        project_id: projectId,
        month: selectedMonth,
        notes: inlineFormData.notes || null,
        employee_hours: inlineFormData.employeeHours,
        is_hidden: inlineFormData.isHidden,
        budget_override: inlineFormData.budgetOverride ?? null
      };

      if (existingDeadline) {
        const { error } = await supabase
          .from('deadlines')
          .update(deadlineData)
          .eq('id', existingDeadline.id);

        if (error) throw error;

        setDeadlines(prev => prev.map(d =>
          d.id === existingDeadline.id
            ? { ...d, projectId, month: selectedMonth, notes: inlineFormData.notes, employeeHours: inlineFormData.employeeHours, isHidden: inlineFormData.isHidden, budgetOverride: inlineFormData.budgetOverride }
            : d
        ));
      } else {
        const { data, error } = await supabase
          .from('deadlines')
          .insert(deadlineData)
          .select()
          .single();

        if (error) throw error;

        setDeadlines(prev => [...prev, {
          id: data.id,
          projectId: data.project_id,
          month: data.month,
          notes: data.notes,
          employeeHours: data.employee_hours || {},
          isHidden: data.is_hidden || false,
          budgetOverride: data.budget_override ?? undefined
        }]);
      }

      if (inlineFormData.isHidden) {
        setHiddenProjects(prev => new Set([...prev, projectId]));
      } else {
        setHiddenProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
      }

      toast.success('Guardado');
      setEditingProjectId(null);
    } catch (error) {
      console.error('Error guardando deadline:', error);
      toast.error((error as Error)?.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const updateEmployeeHours = (employeeId: string, hours: number) => {
    setFormData(prev => ({
      ...prev,
      employeeHours: {
        ...prev.employeeHours,
        [employeeId]: hours > 0 ? hours : 0
      }
    }));
  };

  const getProjectDeadline = (projectId: string) => {
    return deadlines.find(d => d.projectId === projectId && d.month === selectedMonth);
  };

  const getTotalHours = (deadline: Deadline) => {
    return Object.values(deadline.employeeHours).reduce((sum, hours) => sum + hours, 0);
  };

  const executeCopyFromPreviousMonth = async () => {
    setIsLoading(true);
    try {
      const previousMonth = format(subMonths(parseISO(`${selectedMonth}-01`), 1), 'yyyy-MM');
      // 1. Obtener solo deadlines de esta agencia (mes anterior)
      const { data: previousDeadlines, error: fetchError } = await fetchDeadlinesForMonth(previousMonth, currentAgency?.id);
      if (fetchError) throw fetchError;

      if (!previousDeadlines || previousDeadlines.length === 0) {
        toast.info('No hay deadlines en el mes anterior');
        return;
      }

      // 2. Insertarlos en el mes actual
      const newDeadlines = previousDeadlines.map(d => ({
        project_id: d.projectId,
        month: selectedMonth,
        notes: d.notes ?? null,
        employee_hours: d.employeeHours,
        is_hidden: d.isHidden ?? false,
        budget_override: d.budgetOverride ?? null
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('deadlines')
        .insert(newDeadlines)
        .select();

      if (insertError) throw insertError;

      // 3. Actualizar estado local
      if (insertedData) {
        const mapped = insertedData.map((d: { id: string; project_id: string; month: string; notes?: string; employee_hours?: Record<string, number>; is_hidden?: boolean; budget_override?: number }) => ({
          id: d.id,
          projectId: d.project_id,
          month: d.month,
          notes: d.notes,
          employeeHours: d.employee_hours || {},
          isHidden: d.is_hidden || false,
          budgetOverride: d.budget_override ?? undefined
        }));
        setDeadlines(prev => [...prev, ...mapped]);
        setHiddenProjects(prev => {
          const next = new Set(prev);
          mapped.forEach(d => { if (d.isHidden) next.add(d.projectId); });
          return next;
        });
      }

      toast.success(`Se copiaron ${insertedData ? insertedData.length : 0} deadlines`);
    } catch (error) {
      console.error('Error copiando deadlines:', error);
      toast.error('Error al copiar deadlines');
    } finally {
      setIsLoading(false);
    }
  };

  const copyFromPreviousMonth = async () => {
    setIsLoading(true);
    try {
      const previousMonth = format(subMonths(parseISO(`${selectedMonth}-01`), 1), 'yyyy-MM');
      const { data: previousDeadlines, error: fetchError } = await fetchDeadlinesForMonth(previousMonth, currentAgency?.id);
      if (fetchError) throw fetchError;

      if (!previousDeadlines || previousDeadlines.length === 0) {
        toast.info('No hay deadlines en el mes anterior');
        return;
      }

      setConfirmAction({
        type: 'copy_month',
        data: { count: previousDeadlines.length }
      });
    } catch (error) {
      console.error('Error checking previous deadlines:', error);
      toast.error('Error al verificar deadlines anteriores');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  // Funciones para navegar entre meses
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const prevDate = subMonths(date, 1);
    setSelectedMonth(format(prevDate, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const nextDate = addMonths(date, 1);
    setSelectedMonth(format(nextDate, 'yyyy-MM'));
  };

  const handleToday = () => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
  };

  // Formatear el mes actual para mostrar
  const currentMonthDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  // Calcular tips inteligentes de redistribución (con ids para avatar y agrupación). Todo este bloque debe ejecutarse antes del early return (Rules of Hooks).
  const getRedistributionTips = (): { from: string; to: string; fromId: string; toId: string; reason: string; projects: string[]; projectIds: string[] }[] => {
    const tips: { from: string; to: string; fromId: string; toId: string; reason: string; projects: string[]; projectIds: string[]; impact: number }[] = [];
    const employeeLoads: { id: string; name: string; percentage: number; projects: string[] }[] = [];

    // Calcular carga y proyectos de cada empleado
    activeEmployees.forEach(emp => {
      const capacityData = getMonthlyCapacity(emp.id);
      const assigned = getEmployeeAssignedHours(emp.id);
      const percentage = capacityData.available > 0 ? Math.round((assigned / capacityData.available) * 100) : 0;

      // Obtener proyectos donde está asignado
      const empProjects: string[] = [];
      deadlines.forEach(d => {
        if ((d.employeeHours[emp.id] || 0) > 0) {
          const project = projects.find(p => p.id === d.projectId);
          if (project) empProjects.push(project.id);
        }
      });

      employeeLoads.push({ id: emp.id, name: emp.first_name || emp.name, percentage, projects: empProjects });
    });

    // Si hay menos de 2 empleados, no hay sugerencias posibles
    if (employeeLoads.length < 2) return [];

    // Calcular carga promedio del equipo (media)
    const totalPercentage = employeeLoads.reduce((sum, e) => sum + e.percentage, 0);
    const averageLoad = Math.round(totalPercentage / employeeLoads.length);

    // Calcular rango del equipo (diferencia entre máximo y mínimo)
    const maxLoad = Math.max(...employeeLoads.map(e => e.percentage));
    const minLoad = Math.min(...employeeLoads.map(e => e.percentage));
    const range = maxLoad - minLoad;

    // Si el rango es muy pequeño (menos de 5 puntos), no hay necesidad de redistribución
    if (range < 5) return [];

    // Calcular desviación estándar para rangos amplios
    const variance = employeeLoads.reduce((sum, e) => sum + Math.pow(e.percentage - averageLoad, 2), 0) / employeeLoads.length;
    const standardDeviation = Math.sqrt(variance);

    // Umbral más flexible: reducir el umbral mínimo para detectar más desequilibrios
    const deviationThreshold = range <= 15
      ? 2  // Umbral más bajo para rangos estrechos (antes era 3)
      : Math.max(2, Math.round(standardDeviation * 1.2));  // Dinámico pero más flexible (antes era 1.5)

    // Identificar empleados por encima y por debajo de la media
    const aboveAverage = employeeLoads.filter(e => e.percentage > averageLoad + deviationThreshold);
    const belowAverage = employeeLoads.filter(e => e.percentage < averageLoad - deviationThreshold);

    // Si no hay desequilibrio suficiente, intentar con umbral más bajo
    if (aboveAverage.length === 0 || belowAverage.length === 0) {
      // Usar umbral mínimo más bajo (5 puntos de diferencia)
      const relaxedThreshold = 5;
      const aboveRelaxed = employeeLoads.filter(e => e.percentage > averageLoad + relaxedThreshold);
      const belowRelaxed = employeeLoads.filter(e => e.percentage < averageLoad - relaxedThreshold);

      if (aboveRelaxed.length === 0 || belowRelaxed.length === 0) return [];

      // Usar los grupos relajados: solo sugerir si comparten al menos un proyecto
      aboveRelaxed.forEach(over => {
        belowRelaxed.forEach(avail => {
          const sharedProjects = over.projects.filter(p => avail.projects.includes(p));
          if (sharedProjects.length === 0) return;

          const currentGap = (over.percentage - averageLoad) + (averageLoad - avail.percentage);
          const impact = currentGap * 1.5;
          tips.push({
            from: over.name,
            to: avail.name,
            fromId: over.id,
            toId: avail.id,
            reason: `${over.name} está al ${over.percentage}% (media: ${averageLoad}%), ${avail.name} al ${avail.percentage}%`,
            projects: sharedProjects.map(pid => { const p = projects.find(proj => proj.id === pid); return p ? formatProjectName(p.name) : ''; }).filter(Boolean),
            projectIds: sharedProjects,
            impact
          });
        });
      });
    } else {
      // Generar sugerencias con el umbral normal: solo si comparten al menos un proyecto
      aboveAverage.forEach(over => {
        belowAverage.forEach(avail => {
          const sharedProjects = over.projects.filter(p => avail.projects.includes(p));
          if (sharedProjects.length === 0) return;

          const currentGap = (over.percentage - averageLoad) + (averageLoad - avail.percentage);
          const impact = currentGap * 1.5;
          tips.push({
            from: over.name,
            to: avail.name,
            fromId: over.id,
            toId: avail.id,
            reason: `${over.name} está al ${over.percentage}% (media: ${averageLoad}%), ${avail.name} al ${avail.percentage}%`,
            projects: sharedProjects.map(pid => { const p = projects.find(proj => proj.id === pid); return p ? formatProjectName(p.name) : ''; }).filter(Boolean),
            projectIds: sharedProjects,
            impact
          });
        });
      });
    }

    // Ordenar por impacto (mayor impacto primero); devolver hasta MAX para el popup ampliable
    const MAX_SUGGESTIONS = 20;
    return tips
      .sort((a, b) => b.impact - a.impact)
      .slice(0, MAX_SUGGESTIONS)
      .map(({ impact, ...tip }) => tip); // Remover impact del resultado final
  };

  const redistributionTips = getRedistributionTips();

  // Horas de un empleado en un proyecto (este mes)
  const getHoursOnProject = useCallback((projectId: string, employeeId: string) => {
    const d = deadlines.find(dl => dl.projectId === projectId);
    return (d?.employeeHours?.[employeeId] ?? 0) as number;
  }, [deadlines]);

  // Lista de posibles donantes (orígenes) para el selector de condicionantes
  const suggestionDonors = useMemo(() => {
    const ids = [...new Set(redistributionTips.map(t => t.fromId))];
    return ids.map(id => {
      const emp = (employees ?? []).find(e => e.id === id);
      return { id, name: emp?.first_name || emp?.name || id, avatarUrl: emp?.avatarUrl };
    }).filter(d => d.name);
  }, [redistributionTips, employees]);

  // Recomendaciones por empleado → por proyecto → quién puede pasar horas (con horas asignadas y sugeridas). Diseño premium.
  type ProjectRecommendation = { projectId: string; projectName: string; transfers: { fromId: string; fromName: string; fromAvatar?: string; hoursOnProject: number; suggestedHours: number; reason: string }[] };
  type EmployeeRecommendation = { employeeId: string; employeeName: string; employeeAvatar?: string; deficitHours: number; projects: ProjectRecommendation[] };
  const suggestionsByEmployeeAndProject = useMemo((): EmployeeRecommendation[] => {
    const excludedSet = new Set(excludedDonorIds);
    const filteredTips = excludedSet.size > 0 ? redistributionTips.filter(tip => !excludedSet.has(tip.fromId)) : redistributionTips;

    // Carga media del equipo (misma lógica que getRedistributionTips)
    const active = activeEmployees ?? [];
    if (active.length === 0) return [];
    let totalPercentage = 0;
    active.forEach(emp => {
      const capacityData = getMonthlyCapacity(emp.id);
      const assigned = getEmployeeAssignedHours(emp.id);
      const pct = capacityData.available > 0 ? (assigned / capacityData.available) * 100 : 0;
      totalPercentage += pct;
    });
    const averageLoad = totalPercentage / active.length;
    // Objetivo de carga: no superar el máximo elegido (p. ej. 100%, 95%, 90%)
    const targetLoadPct = Math.min(averageLoad, maxReceiverLoadPct);

    // Déficit por destino: horas que podría recibir hasta targetLoadPct
    const getShortfall = (toId: string) => {
      const cap = getMonthlyCapacity(toId);
      const assigned = getEmployeeAssignedHours(toId);
      const targetHours = cap.available * (targetLoadPct / 100);
      return Math.max(0, targetHours - assigned);
    };

    const byEmployee = new Map<string, Map<string, ProjectRecommendation>>();
    const shortfallByToId = new Map<string, number>();

    filteredTips.forEach(tip => {
      if (!tip.projectIds?.length) return;
      const toId = tip.toId;
      if (!shortfallByToId.has(toId)) shortfallByToId.set(toId, getShortfall(toId));
      const shortfall = shortfallByToId.get(toId)!;
      if (!byEmployee.has(toId)) byEmployee.set(toId, new Map());
      const byProject = byEmployee.get(toId)!;
      tip.projectIds.forEach((projectId, i) => {
        const projectName = tip.projects[i] ?? '';
        if (!byProject.has(projectId)) byProject.set(projectId, { projectId, projectName, transfers: [] });
        const proj = byProject.get(projectId)!;
        const hoursOnProject = getHoursOnProject(projectId, tip.fromId);
        // No dejar al que cede por debajo de minSenderLoadPct: max horas que podemos quitarle
        const fromCap = getMonthlyCapacity(tip.fromId).available;
        const fromAssigned = getEmployeeAssignedHours(tip.fromId);
        const minSenderHours = fromCap * (minSenderLoadPct / 100);
        const maxHoursFromSender = Math.max(0, fromAssigned - minSenderHours);
        const suggestedHours = Math.round(Math.min(hoursOnProject, shortfall, maxHoursFromSender) * 2) / 2; // redondeo a 0.5
        if (!proj.transfers.some(t => t.fromId === tip.fromId)) {
          proj.transfers.push({
            fromId: tip.fromId,
            fromName: tip.from,
            fromAvatar: (employees ?? []).find(e => e.id === tip.fromId)?.avatarUrl,
            hoursOnProject,
            suggestedHours,
            reason: tip.reason
          });
        }
      });
    });

    // Escalar por receptor para que el total sugerido no supere el déficit (receptor nunca > 100%)
    return Array.from(byEmployee.entries()).map(([employeeId, byProject]) => {
      const emp = (employees ?? []).find(e => e.id === employeeId);
      const rawProjects = Array.from(byProject.values()).filter(p => p.transfers.length > 0);
      const shortfall = shortfallByToId.get(employeeId) ?? 0;
      const totalSuggested = rawProjects.reduce((sum, p) => sum + p.transfers.reduce((s, t) => s + t.suggestedHours, 0), 0);
      const factor = shortfall > 0 && totalSuggested > shortfall ? shortfall / totalSuggested : 1;
      const projects = rawProjects.map(p => ({
        ...p,
        transfers: p.transfers.map(t => ({
          ...t,
          suggestedHours: factor === 1 ? t.suggestedHours : Math.round((t.suggestedHours * factor) * 2) / 2
        }))
      })).sort((a, b) => b.transfers.length - a.transfers.length);
      return {
        employeeId,
        employeeName: emp?.first_name || emp?.name || 'Desconocido',
        employeeAvatar: emp?.avatarUrl,
        deficitHours: shortfall,
        projects
      };
    }).filter(g => g.employeeName !== 'Desconocido' && g.projects.length > 0).sort((a, b) => b.projects.length - a.projects.length);
  }, [redistributionTips, employees, getHoursOnProject, activeEmployees, getMonthlyCapacity, getEmployeeAssignedHours, excludedDonorIds, maxReceiverLoadPct, minSenderLoadPct]);

  // Mantener para panel compacto (resumen por empleado)
  const suggestionsByEmployee = useMemo(() => {
    const byId = new Map<string, typeof redistributionTips>();
    redistributionTips.forEach(tip => {
      const list = byId.get(tip.toId) || [];
      list.push(tip);
      byId.set(tip.toId, list);
    });
    return Array.from(byId.entries()).map(([employeeId, tips]) => {
      const emp = (employees ?? []).find(e => e.id === employeeId);
      return {
        employeeId,
        employeeName: emp?.first_name || emp?.name || 'Desconocido',
        employeeAvatar: emp?.avatarUrl,
        tips
      };
    }).filter(g => g.employeeName !== 'Desconocido').sort((a, b) => b.tips.length - a.tips.length);
  }, [redistributionTips, employees]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Cargando deadlines...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 min-h-screen bg-slate-50">
      <DeadlinesTour forceShow={showTour} />
      {/* Columna principal - Proyectos */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header: sticky en móvil para navegación temporal */}
        <div className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-20",
          isMobile && "sticky top-0 bg-slate-50 pt-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0 border-b border-slate-200"
        )}>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Deadline</h1>
            <p className="text-xs md:text-sm text-slate-500">Asignación mensual de horas</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Selector de mes: botones grandes en móvil */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1" data-tour="month-selector">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 md:h-8 md:w-8", isMobile && "h-11 w-11")}
                onClick={handlePrevMonth}
                aria-label="Mes anterior"
              >
                <ChevronLeft className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
              </Button>
              <span className="text-xs md:text-sm font-medium px-1 md:px-2 min-w-[90px] md:min-w-[140px] text-center capitalize">
                {format(currentMonthDate, isMobile ? 'MMM yy' : 'MMMM yyyy', { locale: es })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 md:h-8 md:w-8", isMobile && "h-11 w-11")}
                onClick={handleNextMonth}
                aria-label="Mes siguiente"
              >
                <ChevronRight className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
              </Button>
            </div>
            {canEditDeadlines && (
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={copyFromPreviousMonth} className="h-8 w-8 p-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copiar del mes anterior</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMonth()}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Resetear mes completo (Eliminar todo)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            {/* Botón para ver equipo en móvil */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <PanelRight className="h-4 w-4" />
                    <span className="text-xs">Equipo</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-xs p-4 overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-base">Disponibilidad del equipo</SheetTitle>
                  </SheetHeader>
                  {/* Este contenido se duplica del sidebar desktop para móvil */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Disponibilidad</h3>
                      <div className="space-y-2">
                        {activeEmployees.map(emp => {
                          const capacityData = getMonthlyCapacity(emp.id);
                          const assigned = getEmployeeAssignedHours(emp.id);
                          const available = capacityData.available;
                          const percentage = available > 0 ? Math.round((assigned / available) * 100) : 0;
                          const remaining = available - assigned;
                          const status = percentage > 100 ? 'overload' : percentage > 85 ? 'warning' : 'healthy';
                          return (
                            <div key={emp.id} className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                                <AvatarFallback className="bg-primary/100 text-white text-[9px]">
                                  {(emp.first_name || emp.name)[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="truncate font-medium text-slate-700">{emp.first_name || emp.name}</span>
                                  <span className={cn(
                                    "font-mono font-bold",
                                    status === 'overload' ? "text-red-600" : status === 'warning' ? "text-orange-600" : "text-emerald-600"
                                  )}>{percentage}%</span>
                                </div>
                                <Progress value={Math.min(percentage, 100)} className="h-1.5" />
                                <div className="text-[10px] text-slate-400 mt-0.5">Disponible: {remaining.toFixed(0)}h</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Filtros: en móvil dentro de Sheet; en desktop inline */}
        {isMobile ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-11 px-4 gap-2 text-sm touch-manipulation"
                onClick={() => setFiltersSheetOpen(true)}
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              {canEditDeadlines && (
                <Button variant="outline" size="sm" className="h-11 px-4 gap-1" onClick={() => openGlobalDialog()}>
                  <Plus className="h-4 w-4" />
                  Global
                </Button>
              )}
            </div>
            <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-4 overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-base">Filtros</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <Label className="text-slate-600 mb-1.5 block">Buscar proyecto</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 border-slate-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-600 mb-1.5 block">Tipo de proyecto</Label>
                    <Popover open={openFilterType} onOpenChange={setOpenFilterType}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-11 w-full justify-between font-normal">
                          <span className="truncate">{filterId === 'all' ? 'Todos' : activeFilters.find(f => f.id === filterId)?.displayName ?? 'Tipo de proyecto'}</span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandList className="max-h-[280px]">
                            <CommandEmpty>No hay opciones.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem value="Todos" onSelect={() => { setFilterId('all'); setOpenFilterType(false); }}>
                                <Check className={cn('mr-2 h-4 w-4 shrink-0', filterId === 'all' ? 'opacity-100' : 'opacity-0')} />
                                Todos
                              </CommandItem>
                              {activeFilters.map(filter => (
                                <CommandItem key={filter.id} value={filter.displayName} onSelect={() => { setFilterId(filter.id); setOpenFilterType(false); }}>
                                  <Check className={cn('mr-2 h-4 w-4 shrink-0', filterId === filter.id ? 'opacity-100' : 'opacity-0')} />
                                  {filter.displayName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-slate-600 mb-1.5 block">Empleado</Label>
                    <Popover open={openFilterEmployee} onOpenChange={setOpenFilterEmployee}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-11 w-full justify-between font-normal">
                          <span className="truncate">{filterByEmployee === 'all' ? 'Todos' : (activeEmployees.find(e => e.id === filterByEmployee)?.first_name || activeEmployees.find(e => e.id === filterByEmployee)?.name) ?? 'Empleado'}</span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandList className="max-h-[280px]">
                            <CommandEmpty>No hay empleados.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem value="Todos" onSelect={() => { setFilterByEmployee('all'); setOpenFilterEmployee(false); }}>
                                <Check className={cn('mr-2 h-4 w-4 shrink-0', filterByEmployee === 'all' ? 'opacity-100' : 'opacity-0')} />
                                Todos
                              </CommandItem>
                              {activeEmployees.map(emp => (
                                <CommandItem key={emp.id} value={emp.first_name || emp.name || ''} onSelect={() => { setFilterByEmployee(emp.id); setOpenFilterEmployee(false); }}>
                                  <Check className={cn('mr-2 h-4 w-4 shrink-0', filterByEmployee === emp.id ? 'opacity-100' : 'opacity-0')} />
                                  {emp.first_name || emp.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-slate-600 mb-1.5 block">Ordenar por</Label>
                    <Popover open={openSortBy} onOpenChange={setOpenSortBy}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-11 w-full justify-between font-normal">
                          <span className="truncate">{sortBy === 'client' ? 'Por cliente' : sortBy === 'assigned' ? 'Más asignado' : 'Más disponible'}</span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandList className="max-h-[280px]">
                            <CommandGroup>
                              <CommandItem value="Por cliente" onSelect={() => { setSortBy('client'); setOpenSortBy(false); }}>
                                <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'client' ? 'opacity-100' : 'opacity-0')} />
                                Por cliente
                              </CommandItem>
                              <CommandItem value="Más asignado" onSelect={() => { setSortBy('assigned'); setOpenSortBy(false); }}>
                                <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'assigned' ? 'opacity-100' : 'opacity-0')} />
                                Más asignado
                              </CommandItem>
                              <CommandItem value="Más disponible" onSelect={() => { setSortBy('remaining'); setOpenSortBy(false); }}>
                                <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'remaining' ? 'opacity-100' : 'opacity-0')} />
                                Más disponible
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-600">Mostrar ocultos</span>
                    <Switch id="show-hidden-mobile" checked={showHidden} onCheckedChange={setShowHidden} />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-orange-600 font-medium">Solo sin asignar</span>
                    <Switch id="show-unassigned-mobile" checked={showUnassignedOnly} onCheckedChange={setShowUnassignedOnly} />
                  </div>
                  <Button className="w-full h-11" onClick={() => setFiltersSheetOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 bg-white rounded-xl border shadow-sm p-2 sm:p-3" data-tour="filters">
            <div className="flex-1 min-w-[11rem] sm:min-w-[12.5rem]">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar proyecto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 border-slate-200 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              <Popover open={openFilterType} onOpenChange={setOpenFilterType}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[120px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm justify-between font-normal">
                    <span className="truncate">{filterId === 'all' ? 'Todos' : activeFilters.find(f => f.id === filterId)?.displayName ?? 'Tipo'}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandList className="max-h-[280px]">
                      <CommandEmpty>No hay opciones.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="Todos" onSelect={() => { setFilterId('all'); setOpenFilterType(false); }}>
                          <Check className={cn('mr-2 h-4 w-4 shrink-0', filterId === 'all' ? 'opacity-100' : 'opacity-0')} />
                          Todos
                        </CommandItem>
                        {activeFilters.map(filter => (
                          <CommandItem key={filter.id} value={filter.displayName} onSelect={() => { setFilterId(filter.id); setOpenFilterType(false); }}>
                            <Check className={cn('mr-2 h-4 w-4 shrink-0', filterId === filter.id ? 'opacity-100' : 'opacity-0')} />
                            {filter.displayName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                <span className="text-slate-600 whitespace-nowrap">Ocultos</span>
                <Switch id="show-hidden" checked={showHidden} onCheckedChange={setShowHidden} className="scale-75 sm:scale-90" />
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                <span className="text-orange-600 font-medium whitespace-nowrap">Sin asig.</span>
                <Switch id="show-unassigned" checked={showUnassignedOnly} onCheckedChange={setShowUnassignedOnly} className="scale-75 sm:scale-90" />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={openFilterEmployee} onOpenChange={setOpenFilterEmployee}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm justify-between font-normal">
                    <span className="truncate">{filterByEmployee === 'all' ? 'Empleado' : (activeEmployees.find(e => e.id === filterByEmployee)?.first_name || activeEmployees.find(e => e.id === filterByEmployee)?.name) ?? 'Todos'}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandList className="max-h-[280px]">
                      <CommandEmpty>No hay empleados.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="Todos" onSelect={() => { setFilterByEmployee('all'); setOpenFilterEmployee(false); }}>
                          <Check className={cn('mr-2 h-4 w-4 shrink-0', filterByEmployee === 'all' ? 'opacity-100' : 'opacity-0')} />
                          Todos
                        </CommandItem>
                        {activeEmployees.map(emp => (
                          <CommandItem key={emp.id} value={emp.first_name || emp.name || ''} onSelect={() => { setFilterByEmployee(emp.id); setOpenFilterEmployee(false); }}>
                            <Check className={cn('mr-2 h-4 w-4 shrink-0', filterByEmployee === emp.id ? 'opacity-100' : 'opacity-0')} />
                            {emp.first_name || emp.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Popover open={openSortBy} onOpenChange={setOpenSortBy}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm justify-between font-normal">
                    <span className="truncate">{sortBy === 'client' ? 'Por cliente' : sortBy === 'assigned' ? 'Más asignado' : 'Más disponible'}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandList className="max-h-[280px]">
                      <CommandGroup>
                        <CommandItem value="Por cliente" onSelect={() => { setSortBy('client'); setOpenSortBy(false); }}>
                          <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'client' ? 'opacity-100' : 'opacity-0')} />
                          Por cliente
                        </CommandItem>
                        <CommandItem value="Más asignado" onSelect={() => { setSortBy('assigned'); setOpenSortBy(false); }}>
                          <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'assigned' ? 'opacity-100' : 'opacity-0')} />
                          Más asignado
                        </CommandItem>
                        <CommandItem value="Más disponible" onSelect={() => { setSortBy('remaining'); setOpenSortBy(false); }}>
                          <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'remaining' ? 'opacity-100' : 'opacity-0')} />
                          Más disponible
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Proyectos por cliente */}
        <div className="space-y-3" data-tour="project-list">
          {Object.keys(projectsByClient).length === 0 ? (
            <div className="text-center text-slate-500 py-8 bg-white rounded-xl border">
              No hay proyectos para mostrar
            </div>
          ) : (
            Object.entries(projectsByClient).map(([clientId, clientProjects]) => {
              const isKitDigitalGroup = clientId === 'kit-digital';
              const client = isKitDigitalGroup ? null : clients.find(c => c.id === clientId);
              const clientName = isKitDigitalGroup ? 'Kit Digital' : (client?.name || 'Sin cliente');
              const clientColor = isKitDigitalGroup ? '#10b981' : (client?.color || '#6b7280');
              const isExpanded = expandedClients.has(clientId);

              return (
                <div key={clientId} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  {/* Cabecera del cliente */}
                  <button
                    onClick={() => toggleClient(clientId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: clientColor }}
                    />
                    <span className="font-bold text-slate-800">{clientName}</span>
                    <span className="text-sm text-slate-400">({clientProjects.length} proyectos)</span>
                  </button>

                  {/* Proyectos del cliente */}
                  {isExpanded && (
                    <div className="border-t divide-y divide-slate-100">
                      {clientProjects.map(project => {
                        const deadline = getProjectDeadline(project.id);
                        const isEditing = editingProjectId === project.id;
                        const currentHours = isEditing ? inlineFormData.employeeHours : (deadline?.employeeHours || {});
                        const totalAssigned = (Object.values(currentHours) as number[]).reduce((sum, h) => sum + (h || 0), 0);
                        const isOverBudget = totalAssigned > (project.budgetHours || 0);
                        const isUnderMin = project.minimumHours != null && project.minimumHours > 0 && totalAssigned < project.minimumHours;
                        const isHidden = isEditing ? inlineFormData.isHidden : hiddenProjects.has(project.id);

                        const projectNotes = deadline?.notes;

                        return (
                          <div
                            key={project.id}
                            className={cn(
                              isHidden && "opacity-40",
                              isEditing && "bg-primary/10/40",
                              isOverBudget && !isEditing && "bg-red-50/40"
                            )}
                          >
                            {/* Fila del proyecto - clickeable para editar (en móvil abre Sheet) */}
                            <div
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors",
                                isEditing && !isMobile && "hover:bg-primary/10/40"
                              )}
                              onClick={() => !isEditing && startEditingProject(project.id)}
                            >
                              {/* Info del proyecto */}
                              <div className="min-w-[180px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-slate-800">{formatProjectName(project.name)}</span>
                                  {isHidden && <EyeOff className="h-3 w-3 text-slate-400 flex-shrink-0" />}
                                  {/* Indicador de edición concurrente */}
                                  {!isEditing && editingLocks[project.id] && editingLocks[project.id].employeeId !== currentUser?.id && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 border-amber-200 text-amber-700" data-tour="concurrent-editing">
                                      <Edit className="h-2.5 w-2.5 mr-1" />
                                      {editingLocks[project.id].employeeName}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {project.minimumHours != null && project.minimumHours > 0 && (
                                    <span className="text-orange-500 mr-1">mín {project.minimumHours}h ·</span>
                                  )}
                                  <span>
                                    máx {deadline?.budgetOverride != null ? deadline.budgetOverride : project.budgetHours}h
                                    {deadline?.budgetOverride != null && (deadline.budgetOverride - (project.budgetHours || 0)) !== 0 && (
                                      <span className={cn(
                                        "ml-1 font-bold",
                                        (deadline.budgetOverride - (project.budgetHours || 0)) > 0 ? "text-emerald-600" : "text-red-500"
                                      )}>
                                        ({(deadline.budgetOverride - (project.budgetHours || 0)) > 0 ? '+' : ''}{deadline.budgetOverride - (project.budgetHours || 0)}h)
                                      </span>
                                    )}
                                  </span>
                                </div>
                                {/* Notas visibles si existen */}
                                {projectNotes && !isEditing && (
                                  <div className="text-[11px] text-indigo-500 mt-0.5 italic truncate max-w-[200px]">
                                    📝 {projectNotes}
                                  </div>
                                )}
                              </div>

                              {/* Equipo asignado */}
                              <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                                {!isEditing && activeEmployees.map(emp => {
                                  const hours = (currentHours as Record<string, number>)[emp.id] || 0;
                                  if (hours === 0) return null;
                                  return (
                                    <div
                                      key={emp.id}
                                      className="flex items-center gap-1.5 bg-slate-100 rounded-full px-2 py-1"
                                    >
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                                        <AvatarFallback className="bg-primary/100 text-white text-[9px]">
                                          {(emp.first_name || emp.name)[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-slate-600">{emp.first_name || emp.name}</span>
                                      <span className="text-xs font-mono font-bold text-primary">{hours}h</span>
                                    </div>
                                  );
                                })}
                                {!isEditing && totalAssigned === 0 && (
                                  <span className="text-xs text-slate-400 italic">Clic para asignar</span>
                                )}
                              </div>

                              {/* Total */}
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className={cn(
                                    "font-mono font-bold text-sm",
                                    isOverBudget ? "text-red-600" :
                                      isUnderMin ? "text-orange-500" :
                                        totalAssigned > 0 ? "text-slate-700" : "text-slate-400"
                                  )}>
                                    {totalAssigned}h
                                  </span>
                                  <span className="text-xs text-slate-400">/{project.budgetHours}h</span>
                                </div>
                              </div>
                            </div>

                            {/* Panel de edición inline (solo desktop; en móvil se usa Sheet) */}
                            {isEditing && !isMobile && (
                              <div className="px-4 py-3 bg-slate-50 border-t" data-tour="inline-editing">
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {activeEmployees.map(emp => (
                                    <div key={emp.id} className="flex items-center gap-2 bg-white border rounded-lg px-2.5 py-1.5">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                                        <AvatarFallback className="bg-primary/100 text-white text-[9px]">
                                          {(emp.first_name || emp.name)[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-slate-600">{emp.first_name || emp.name}</span>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={inlineFormData.employeeHours[emp.id] || ''}
                                        onChange={(e) => updateInlineEmployeeHours(emp.id, parseFloat(e.target.value) || 0, project.id)}
                                        onBlur={() => {
                                          const currentHours = inlineFormData.employeeHours[emp.id] || 0;
                                          updateInlineEmployeeHours(emp.id, currentHours, project.id, true);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const currentHours = inlineFormData.employeeHours[emp.id] || 0;
                                            updateInlineEmployeeHours(emp.id, currentHours, project.id, true);
                                            (e.target as HTMLInputElement).blur();
                                          }
                                        }}
                                        className="h-7 w-20 text-center font-mono text-sm px-2"
                                        placeholder="0"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500">Ajuste:</span>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={inlineFormData.budgetOverride !== undefined ? (inlineFormData.budgetOverride - (project.budgetHours || 0)) : ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                        // Si el campo está vacío (e.target.value === ''), queremos que budgetOverride sea undefined para volver al original
                                        // PERO el usuario quiere "Ajuste", así que si borra, es ajuste 0 => budgetOverride = original.
                                        // Mejor: si escribe 0, ajuste 0. Si borra, undefined?
                                        // Si borra, asumimos 0 ajuste. 
                                        // Logic: budgetOverride = base + ajuste.
                                        // Si el input está vacío, asumimos ajuste 0? O mantenemos el anterior?
                                        // UX standard: vacío = 0.

                                        const adjustment = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                        const base = project.budgetHours || 0;
                                        const newBudget = adjustment !== undefined ? base + adjustment : undefined;

                                        const newFormData = { ...inlineFormData, budgetOverride: newBudget };
                                        setInlineFormData(newFormData);
                                        // Autoguardar budget
                                        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
                                        autoSaveTimeoutRef.current = setTimeout(() => {
                                          autoSaveDeadline(project.id, newFormData);
                                        }, 800);
                                      }}
                                      className={cn(
                                        "h-7 w-16 text-center font-mono text-xs px-1",
                                        (inlineFormData.budgetOverride !== undefined && (inlineFormData.budgetOverride - (project.budgetHours || 0)) !== 0)
                                          ? "bg-amber-50 border-amber-200 text-amber-700 font-bold"
                                          : ""
                                      )}
                                    />
                                    {inlineFormData.budgetOverride !== undefined && (inlineFormData.budgetOverride - (project.budgetHours || 0)) !== 0 && (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        = {inlineFormData.budgetOverride}h
                                      </span>
                                    )}
                                  </div>
                                  <Input
                                    placeholder="Notas..."
                                    value={inlineFormData.notes}
                                    onChange={(e) => {
                                      const newNotes = e.target.value;
                                      const newFormData = { ...inlineFormData, notes: newNotes };
                                      setInlineFormData(newFormData);
                                      // Autoguardar notas
                                      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
                                      autoSaveTimeoutRef.current = setTimeout(() => {
                                        autoSaveDeadline(project.id, newFormData);
                                      }, 800);
                                    }}
                                    onBlur={() => {
                                      if (autoSaveTimeoutRef.current) {
                                        clearTimeout(autoSaveTimeoutRef.current);
                                        autoSaveTimeoutRef.current = null;
                                      }
                                      autoSaveDeadline(project.id, inlineFormData);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (autoSaveTimeoutRef.current) {
                                          clearTimeout(autoSaveTimeoutRef.current);
                                          autoSaveTimeoutRef.current = null;
                                        }
                                        autoSaveDeadline(project.id, inlineFormData);
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }}
                                    className="h-7 text-xs flex-1 min-w-[150px]"
                                  />
                                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <Switch
                                      checked={inlineFormData.isHidden}
                                      onCheckedChange={(checked) => {
                                        const newFormData = { ...inlineFormData, isHidden: checked };
                                        setInlineFormData(newFormData);
                                        // Guardar inmediatamente al cambiar ocultar
                                        autoSaveDeadline(project.id, newFormData);
                                      }}
                                      className="scale-75"
                                    />
                                    <span className="text-slate-500">Ocultar</span>
                                  </label>
                                  <div className="ml-auto flex items-center gap-2 text-xs">
                                    {autoSaveStatus === 'saving' && (
                                      <span className="text-slate-400 animate-pulse">Guardando...</span>
                                    )}
                                    {autoSaveStatus === 'saved' && (
                                      <span className="text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Guardado
                                      </span>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-slate-500"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditingProject();
                                      }}
                                    >
                                      Cerrar
                                    </Button>
                                    <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                      title="Eliminar deadline (Resetear mes)"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Configurar el deadline a eliminar. 
                                        // Necesitamos el objeto deadline completo o al menos su ID si existe.
                                        // Buscamos el deadline correspondiente a este proyecto en la lista 'deadlines'
                                        const deadline = deadlines.find(d => d.projectId === project.id && d.month === selectedMonth);
                                        if (deadline) {
                                          setEditingDeadline(deadline);
                                          setConfirmAction({ type: 'delete_deadline', id: deadline.id });
                                        } else {
                                          toast.info("No hay configuración guardada para eliminar");
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sheet de edición de proyecto (solo móvil) */}
      {isMobile && editingProjectId && (() => {
        const project = projects.find(p => p.id === editingProjectId);
        const deadline = getProjectDeadline(editingProjectId);
        if (!project) return null;
        const currentHours = inlineFormData.employeeHours;
        const totalAssigned = (Object.values(currentHours) as number[]).reduce((sum, h) => sum + (h || 0), 0);
        const isOverBudget = totalAssigned > (project.budgetHours || 0);
        return (
          <Sheet open={true} onOpenChange={(open) => !open && cancelEditingProject()}>
            <SheetContent side="bottom" className="h-[88vh] rounded-t-2xl p-4 overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-base">{formatProjectName(project.name)}</SheetTitle>
                <p className="text-xs text-slate-500 font-mono">
                  {totalAssigned}h / {deadline?.budgetOverride ?? project.budgetHours}h
                  {isOverBudget && <span className="text-red-600 ml-1"> · Overload</span>}
                </p>
              </SheetHeader>
              <div className="space-y-4 text-sm">
                <div className="space-y-3">
                  <Label className="text-slate-600">Horas por empleado</Label>
                  {activeEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                        <AvatarFallback className="bg-primary/100 text-white text-xs">{(emp.first_name || emp.name)[0]}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-slate-700 font-medium truncate">{emp.first_name || emp.name}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={inlineFormData.employeeHours[emp.id] ?? ''}
                        onChange={(e) => updateInlineEmployeeHours(emp.id, parseFloat(e.target.value) || 0, project.id)}
                        onBlur={() => {
                          const h = inlineFormData.employeeHours[emp.id] || 0;
                          updateInlineEmployeeHours(emp.id, h, project.id, true);
                        }}
                        className="h-11 w-24 text-center font-mono text-base"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-slate-600 mb-1.5 block">Ajuste presupuesto (h)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={inlineFormData.budgetOverride !== undefined ? (inlineFormData.budgetOverride - (project.budgetHours || 0)) : ''}
                    onChange={(e) => {
                      const adjustment = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      const base = project.budgetHours || 0;
                      const newBudget = adjustment !== undefined ? base + adjustment : undefined;
                      const newFormData = { ...inlineFormData, budgetOverride: newBudget };
                      setInlineFormData(newFormData);
                      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
                      autoSaveTimeoutRef.current = setTimeout(() => autoSaveDeadline(project.id, newFormData), 800);
                    }}
                    className="h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-slate-600 mb-1.5 block">Notas</Label>
                  <Textarea
                    placeholder="Notas..."
                    value={inlineFormData.notes}
                    onChange={(e) => {
                      const newFormData = { ...inlineFormData, notes: e.target.value };
                      setInlineFormData(newFormData);
                      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
                      autoSaveTimeoutRef.current = setTimeout(() => autoSaveDeadline(project.id, newFormData), 800);
                    }}
                    className="min-h-[80px] text-sm"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-600">Ocultar proyecto</span>
                  <Switch
                    checked={inlineFormData.isHidden}
                    onCheckedChange={(checked) => {
                      const newFormData = { ...inlineFormData, isHidden: checked };
                      setInlineFormData(newFormData);
                      autoSaveDeadline(project.id, newFormData);
                    }}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  {autoSaveStatus === 'saving' && <span className="text-slate-400 text-sm">Guardando...</span>}
                  {autoSaveStatus === 'saved' && <span className="text-emerald-600 text-sm flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Guardado</span>}
                  <Button className="flex-1 h-11" variant="secondary" onClick={cancelEditingProject}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        );
      })()}

      {/* Panel lateral sticky - Disponibilidad del equipo (solo desktop) */}
      {
        !isMobile && canEditDeadlines && (
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* Disponibilidad en tiempo real */}
              <div className="bg-white rounded-xl border shadow-sm p-3" data-tour="availability-panel">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Disponibilidad
                </h3>
                <div className="space-y-2">
                  {activeEmployees.map(emp => {
                    const capacityData = getMonthlyCapacity(emp.id);
                    const assigned = getEmployeeAssignedHours(emp.id);
                    const available = capacityData.available;
                    const percentage = available > 0 ? Math.round((assigned / available) * 100) : 0;
                    const remaining = available - assigned;
                    const status = percentage > 100 ? 'overload' : percentage > 85 ? 'warning' : 'healthy';
                    const hasReductions = capacityData.absenceHours > 0 || capacityData.eventHours > 0;

                    return (
                      <TooltipProvider key={emp.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                                <AvatarFallback className="bg-primary/100 text-white text-[9px]">
                                  {(emp.first_name || emp.name)[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="truncate font-medium text-slate-700">
                                    {emp.first_name || emp.name}
                                    {hasReductions && <span className="text-orange-400 ml-1">*</span>}
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
                          <TooltipContent side="left" className="text-xs max-w-[280px] bg-white border border-slate-200 shadow-xl">
                            <div className="space-y-2 text-slate-700">
                              <div className="font-semibold text-slate-900 text-sm">{emp.first_name || emp.name}</div>
                              <div className="text-slate-600">Base mensual: <span className="font-medium">{capacityData.total.toFixed(1)}h</span></div>

                              {capacityData.absenceDetails.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-red-600 font-semibold text-xs">Ausencias:</div>
                                  {capacityData.absenceDetails.map((a, i) => (
                                    <div key={i} className="text-red-700 pl-3 text-xs">
                                      • {a.type === 'vacation' ? 'Vacaciones' :
                                        a.type === 'sick_leave' ? 'Baja médica' :
                                          a.type === 'personal' ? 'Personal' : a.type}
                                      : <span className="font-medium">-{a.hours.toFixed(1)}h</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {capacityData.eventDetails.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-orange-600 font-semibold text-xs">Eventos:</div>
                                  {capacityData.eventDetails.map((e, i) => (
                                    <div key={i} className="text-orange-700 pl-3 text-xs">
                                      • {e.name}: <span className="font-medium">-{e.hours.toFixed(1)}h</span>
                                    </div>
                                  ))}
                                </div>
                              )}

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

              {/* Recomendaciones por proyecto: vista compacta (anzuelo) */}
              {suggestionsByEmployeeAndProject.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm" data-tour="suggestions">
                  <div className="flex items-center gap-1 mb-2">
                    <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Recomendaciones
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-slate-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[260px] z-[100] p-0 border-slate-200/90 bg-gradient-to-br from-slate-50 to-white shadow-lg rounded-xl overflow-hidden">
                            <div className="p-3.5">
                              <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-200/80">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <Sparkles className="h-3.5 w-3.5" />
                                </div>
                                <p className="font-semibold text-slate-800 text-sm">Recomendaciones por proyecto</p>
                              </div>
                              <ul className="space-y-2 text-xs text-slate-600">
                                <li className="flex items-start gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>Quién puede recibir horas y en qué proyecto</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>Horas asignadas por origen para decidir transferencias</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>Solo empleados que comparten proyectos</span>
                                </li>
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {suggestionsByEmployeeAndProject.slice(0, 3).map((group) => (
                      <button
                        key={group.employeeId}
                        type="button"
                        onClick={() => setIsSuggestionsExpandedOpen(true)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 text-left transition-colors"
                      >
                        <Avatar className="h-7 w-7 border-2 border-white shadow-sm shrink-0">
                          <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                            {group.employeeName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-slate-800 text-xs truncate flex-1">{group.employeeName}</span>
                        <Badge variant="secondary" className="text-[10px] bg-slate-200/80 text-slate-600 shrink-0">
                          {group.projects.length} {group.projects.length === 1 ? 'proyecto' : 'proy.'}
                        </Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 h-8 text-slate-600 hover:bg-slate-100 text-xs"
                    onClick={() => setIsSuggestionsExpandedOpen(true)}
                  >
                    <Maximize2 className="h-3 w-3 mr-1" />
                    Ver desglose por proyecto
                  </Button>
                </div>
              )}

              {/* Tareas globales compactas */}
              <div className="bg-white rounded-xl border shadow-sm p-3" data-tour="global-assignments">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Otras asignaciones
                  </h3>
                  <Button onClick={() => openGlobalDialog()} size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {globalAssignments.length === 0 ? (
                  <div className="text-[10px] text-slate-400 italic">Sin asignaciones extra</div>
                ) : (
                  <div className="space-y-1">
                    {globalAssignments.map(a => {
                      const canDelete = !a.employeeId || a.employeeId === currentUser?.id;
                      return (
                        <div key={a.id} className="flex items-center justify-between text-xs group">
                          <span className="truncate text-slate-600">{a.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-primary">+{a.hours}h</span>
                            <button
                              onClick={() => openGlobalDialog(a)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600"
                            >
                              <Pencil className="h-2.5 w-2.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGlobal(a.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Dialog para asignaciones globales */}
      <Dialog open={isGlobalDialogOpen} onOpenChange={setIsGlobalDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingGlobal ? 'Editar asignación global' : 'Nueva asignación global'}
            </DialogTitle>
            <DialogDescription>
              Tareas que afectan a uno o más empleados
            </DialogDescription>
          </DialogHeader>

          <Form {...globalAssignmentForm}>
            <form onSubmit={globalAssignmentForm.handleSubmit(onSaveGlobal)} className="space-y-4 py-4">
              <FormField
                control={globalAssignmentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la tarea</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: deadline afecta a todos, creación timeboxing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={globalAssignmentForm.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="Ej: 2.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={globalAssignmentForm.control}
                name="affectsAll"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        id="affects-all"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel htmlFor="affects-all" className="cursor-pointer">
                      Afecta a todos los empleados
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!globalAssignmentForm.watch('affectsAll') && (
                <FormField
                  control={globalAssignmentForm.control}
                  name="affectedEmployeeIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seleccionar empleados</FormLabel>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                        {activeEmployees.map(emp => (
                          <div key={emp.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`emp-${emp.id}`}
                              checked={(field.value || []).includes(emp.id)}
                              onChange={(e) => {
                                const ids = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...ids, emp.id]);
                                } else {
                                  field.onChange(ids.filter(id => id !== emp.id));
                                }
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={`emp-${emp.id}`} className="cursor-pointer text-sm">
                              {emp.first_name || emp.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsGlobalDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Popup ampliable de sugerencias de redistribución */}
      {isMobile ? (
        <Sheet open={isSuggestionsExpandedOpen} onOpenChange={(open) => { setIsSuggestionsExpandedOpen(open); if (!open) { setExpandedSuggestionsProjects(new Set()); setExpandedSuggestionsEmployees(new Set()); } }}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                Sugerencias de redistribución
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden flex flex-col mt-2">
              <p className="text-xs text-slate-500 mb-3">
                Recomendaciones por proyecto. Quién puede recibir horas y desde qué proyecto transferir. Ajusta los condicionantes para afinar.
              </p>
              {/* Condicionantes (móvil) - premium */}
              <Collapsible open={suggestionsCondicionantesOpen} onOpenChange={setSuggestionsCondicionantesOpen}>
                <CollapsibleTrigger asChild>
                  <button type="button" className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-800 mb-2">
                    {suggestionsCondicionantesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    Condicionantes
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 py-2 pb-3 border border-slate-200 rounded-xl bg-slate-50/80 px-3 mb-2">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Quién puede ceder</p>
                    <div className="grid grid-cols-1 gap-2">
                      {suggestionDonors.map((d) => {
                        const allowed = !excludedDonorIds.includes(d.id);
                        return (
                          <div key={d.id} className={cn('flex items-center gap-2 rounded-lg border p-2 min-h-[2.25rem]', allowed ? 'bg-white border-slate-200' : 'bg-slate-100/80 border-slate-100 opacity-75')}>
                            <Avatar className="h-6 w-6 shrink-0 border border-slate-200">
                              <AvatarImage src={d.avatarUrl} alt={d.name} />
                              <AvatarFallback className="text-[10px]">{d.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="flex-1 truncate text-xs font-medium min-w-0" title={d.name}>{d.name}</span>
                            <Switch checked={allowed} onCheckedChange={(c) => setExcludedDonorIds(prev => c ? prev.filter(id => id !== d.id) : [...prev, d.id])} className="shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Inbox className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Quien recibe</p>
                            <p className="text-[11px] text-slate-500">No superará este %</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Input type="number" min={1} max={100} value={maxReceiverLoadPctInput} onChange={(e) => { const v = e.target.value; setMaxReceiverLoadPctInput(v); const n = parseInt(v, 10); if (v !== '' && !isNaN(n) && n >= 1 && n <= 100) setMaxReceiverLoadPct(n); }} onBlur={() => { const n = parseInt(maxReceiverLoadPctInput, 10); const clamped = (maxReceiverLoadPctInput === '' || isNaN(n) || n < 1) ? 100 : Math.min(100, Math.max(1, n)); setMaxReceiverLoadPct(clamped); setMaxReceiverLoadPctInput(String(clamped)); }} className="h-8 w-12 text-center text-xs font-mono font-semibold" />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Share2 className="h-4 w-4 text-amber-700 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Quien cede</p>
                            <p className="text-[11px] text-slate-500">No bajará de este %</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Input type="number" min={0} max={100} value={minSenderLoadPctInput} onChange={(e) => { const v = e.target.value; setMinSenderLoadPctInput(v); const n = parseInt(v, 10); if (v !== '' && !isNaN(n) && n >= 0 && n <= 100) setMinSenderLoadPct(n); }} onBlur={() => { const n = parseInt(minSenderLoadPctInput, 10); const clamped = (minSenderLoadPctInput === '' || isNaN(n) || n < 0) ? 30 : Math.min(100, Math.max(0, n)); setMinSenderLoadPct(clamped); setMinSenderLoadPctInput(String(clamped)); }} className="h-8 w-12 text-center text-xs font-mono font-semibold" />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2">
                {suggestionsByEmployeeAndProject.map((group) => {
                  const isEmployeeOpen = expandedSuggestionsEmployees.has(group.employeeId);
                  return (
                    <div key={group.employeeId} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <Collapsible open={isEmployeeOpen} onOpenChange={(open) => setExpandedSuggestionsEmployees(prev => { const next = new Set(prev); if (open) next.add(group.employeeId); else next.delete(group.employeeId); return next; })}>
                        <CollapsibleTrigger asChild>
                          <button type="button" className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50/80 transition-colors">
                            <Avatar className="h-10 w-10 border-2 border-slate-200 shrink-0 ring-1 ring-slate-100">
                              <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                {group.employeeName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{group.employeeName}</p>
                              <p className="text-xs text-slate-500">Puede recibir horas en {group.projects.length} {group.projects.length === 1 ? 'proyecto' : 'proyectos'}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                                Déficit: {Math.round(group.deficitHours * 2) / 2}h
                              </Badge>
                              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 font-medium">
                                {group.projects.length}
                              </Badge>
                            </div>
                            {isEmployeeOpen ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t border-slate-100 bg-slate-50/30 px-2 pb-2 pt-1 space-y-2">
                            {group.projects.map((proj) => {
                              const projectKey = `${group.employeeId}-${proj.projectId}`;
                              const isProjectOpen = expandedSuggestionsProjects.has(projectKey);
                              return (
                                <div key={projectKey} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                  <Collapsible open={isProjectOpen} onOpenChange={(open) => setExpandedSuggestionsProjects(prev => { const n = new Set(prev); if (open) n.add(projectKey); else n.delete(projectKey); return n; })}>
                                    <CollapsibleTrigger asChild>
                                      <button type="button" className="w-full flex items-center gap-2.5 p-2.5 text-left hover:bg-slate-50 transition-colors">
                                        <FolderKanban className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span className="font-medium text-slate-800 text-sm truncate flex-1">{proj.projectName}</span>
                                        <span className="text-[11px] text-slate-500 shrink-0">{proj.transfers.length} {proj.transfers.length === 1 ? 'origen' : 'orígenes'}</span>
                                        {isProjectOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                                      </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="border-t border-slate-100 bg-slate-50/50 px-2 py-2 space-y-2">
                                        {proj.transfers.map((t) => (
                                          <div key={t.fromId} className="flex items-start gap-3 p-2.5 rounded-md bg-white border border-slate-100 shadow-sm">
                                            <Avatar className="h-8 w-8 border border-slate-200 shrink-0">
                                              <AvatarImage src={t.fromAvatar} alt={t.fromName} />
                                              <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                                                {t.fromName.substring(0, 2).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-slate-900 text-sm">{t.fromName}</p>
                                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                <span className="font-mono font-semibold text-primary">{t.hoursOnProject}h</span>
                                                <span>asignadas en este proyecto</span>
                                              </p>
                                              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                                {t.suggestedHours > 0 ? (
                                                  <>Pasar hasta {t.suggestedHours}h a {group.employeeName}</>
                                                ) : (
                                                  <>Sin margen sugerido; revisar en tabla</>
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </CollapsibleContent>
                                    </Collapsible>
                                </div>
                              );
                            })}
                            {/* Resumen propuesto (móvil): mismo diseño premium que el panel derecho en desktop */}
                            {(() => {
                              const byFrom = new Map<string, { fromName: string; fromAvatar?: string; hours: number }>();
                              const byProject: { projectName: string; items: { fromName: string; hours: number }[] }[] = [];
                              let totalToReceptor = 0;
                              group.projects.forEach(p => {
                                const projectItems: { fromName: string; hours: number }[] = [];
                                p.transfers.forEach(t => {
                                  if (t.suggestedHours <= 0) return;
                                  if (!byFrom.has(t.fromId)) byFrom.set(t.fromId, { fromName: t.fromName, fromAvatar: t.fromAvatar, hours: 0 });
                                  byFrom.get(t.fromId)!.hours += t.suggestedHours;
                                  totalToReceptor += t.suggestedHours;
                                  projectItems.push({ fromName: t.fromName, hours: t.suggestedHours });
                                });
                                if (projectItems.length) byProject.push({ projectName: p.projectName, items: projectItems });
                              });
                              if (totalToReceptor <= 0) return null;
                              const receptorCap = getMonthlyCapacity(group.employeeId).available;
                              const receptorAssigned = getEmployeeAssignedHours(group.employeeId);
                              const receptorNewPct = receptorCap > 0 ? Math.round(((receptorAssigned + totalToReceptor) / receptorCap) * 100) : 0;
                              const originLoads = Array.from(byFrom.entries()).map(([fromId, { fromName, hours }]) => {
                                const cap = getMonthlyCapacity(fromId).available;
                                const assigned = getEmployeeAssignedHours(fromId);
                                const pct = cap > 0 ? Math.round(((assigned - hours) / cap) * 100) : 0;
                                return { fromId, fromName, pct };
                              });
                              return (
                                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 mt-3 space-y-3 shadow-sm">
                                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Resumen propuesto</p>
                                  <div className="space-y-2">
                                    <p className="text-[11px] font-medium text-slate-500">Quitar horas a</p>
                                    <div className="flex flex-wrap gap-2">
                                      {Array.from(byFrom.entries()).map(([fromId, { fromName, fromAvatar, hours }]) => (
                                        <div key={fromId} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                                          <Avatar className="h-7 w-7 border border-slate-200 shrink-0">
                                            <AvatarImage src={fromAvatar} alt={fromName} />
                                            <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-medium">{fromName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs font-medium text-slate-800 truncate max-w-[100px]">{fromName}</span>
                                          <Badge variant="secondary" className="shrink-0 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-mono">−{hours}h</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-px bg-slate-200" />
                                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <div className="flex-1 h-px bg-slate-200" />
                                  </div>
                                  <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <Avatar className="h-9 w-9 border-2 border-primary/30 shrink-0">
                                        <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{group.employeeName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-slate-500">Añadir horas a</p>
                                        <p className="font-semibold text-slate-900 text-sm truncate">{group.employeeName}</p>
                                      </div>
                                      <Badge className="shrink-0 bg-primary text-primary-foreground text-xs font-mono">+{totalToReceptor}h</Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-medium text-slate-500 mb-1.5">Cargas resultantes</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {originLoads.map(o => (
                                        <span key={o.fromId} className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', o.pct > 100 ? 'bg-red-50 border-red-200 text-red-700' : o.pct >= 80 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700')}>{o.fromName} {o.pct}%</span>
                                      ))}
                                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">{group.employeeName} {receptorNewPct}%</span>
                                    </div>
                                  </div>
                                  {byProject.length > 0 && (
                                    <div>
                                      <p className="text-[11px] font-medium text-slate-500 mb-1">Por proyecto</p>
                                      <div className="space-y-1.5">
                                        {byProject.map((proj, i) => (
                                          <div key={i} className="rounded border border-slate-200 bg-white px-2 py-1.5">
                                            <p className="text-[11px] font-medium text-slate-700 truncate">{proj.projectName}</p>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                              {proj.items.map((item, j) => (
                                                <span key={j} className="text-[10px] text-slate-600 bg-slate-100 rounded px-1 font-mono">{item.fromName} −{item.hours}h</span>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isSuggestionsExpandedOpen} onOpenChange={(open) => { setIsSuggestionsExpandedOpen(open); if (!open) { setExpandedSuggestionsProjects(new Set()); setExpandedSuggestionsEmployees(new Set()); } }}>
          <DialogContent className="max-w-[95vw] sm:max-w-[640px] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                Sugerencias de redistribución
              </DialogTitle>
              <DialogDescription>
                Recomendaciones por proyecto: quién puede recibir horas y desde qué proyecto transferir. Expande un empleado y revisa el panel de la derecha. Ajusta los condicionantes para afinar el reparto.
              </DialogDescription>
            </DialogHeader>
            {/* Condicionantes: quién puede ceder, carga máx. receptor y mín. del que cede (premium) */}
            <Collapsible open={suggestionsCondicionantesOpen} onOpenChange={setSuggestionsCondicionantesOpen}>
              <CollapsibleTrigger asChild>
                <button type="button" className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 py-1.5">
                  {suggestionsCondicionantesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Condicionantes (quién cede, cargas máx. receptor y mín. quien cede)
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 py-4 px-4 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white shadow-sm">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Quién puede ceder horas</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {suggestionDonors.map((d) => {
                        const allowed = !excludedDonorIds.includes(d.id);
                        return (
                          <div
                            key={d.id}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border p-2 transition-colors min-h-[2.25rem]',
                              allowed ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-100/80 opacity-75'
                            )}
                          >
                            <Avatar className="h-6 w-6 border border-slate-200 shrink-0">
                              <AvatarImage src={d.avatarUrl} alt={d.name} />
                              <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-medium">{d.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="flex-1 truncate text-sm font-medium text-slate-800 min-w-0" title={d.name}>{d.name}</span>
                            <Switch
                              checked={allowed}
                              onCheckedChange={(checked) => setExcludedDonorIds(prev => checked ? prev.filter(id => id !== d.id) : [...prev, d.id])}
                              className="shrink-0"
                            />
                          </div>
                        );
                      })}
                      {suggestionDonors.length === 0 && <span className="text-xs text-slate-500 col-span-full">No hay orígenes en las sugerencias</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 border-l border-slate-200 pl-6 lg:pl-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Inbox className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Quien recibe horas</p>
                            <p className="text-[11px] text-slate-500">No superará este % de carga</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Input type="number" min={1} max={100} value={maxReceiverLoadPctInput} onChange={(e) => { const v = e.target.value; setMaxReceiverLoadPctInput(v); const n = parseInt(v, 10); if (v !== '' && !isNaN(n) && n >= 1 && n <= 100) setMaxReceiverLoadPct(n); }} onBlur={() => { const n = parseInt(maxReceiverLoadPctInput, 10); const clamped = (maxReceiverLoadPctInput === '' || isNaN(n) || n < 1) ? 100 : Math.min(100, Math.max(1, n)); setMaxReceiverLoadPct(clamped); setMaxReceiverLoadPctInput(String(clamped)); }} className="h-9 w-14 text-center font-mono text-sm font-semibold" />
                          <span className="text-sm font-medium text-slate-500">%</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                            <Share2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Quien cede horas</p>
                            <p className="text-[11px] text-slate-500">No bajará de este % de carga</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Input type="number" min={0} max={100} value={minSenderLoadPctInput} onChange={(e) => { const v = e.target.value; setMinSenderLoadPctInput(v); const n = parseInt(v, 10); if (v !== '' && !isNaN(n) && n >= 0 && n <= 100) setMinSenderLoadPct(n); }} onBlur={() => { const n = parseInt(minSenderLoadPctInput, 10); const clamped = (minSenderLoadPctInput === '' || isNaN(n) || n < 0) ? 30 : Math.min(100, Math.max(0, n)); setMinSenderLoadPct(clamped); setMinSenderLoadPctInput(String(clamped)); }} className="h-9 w-14 text-center font-mono text-sm font-semibold" />
                          <span className="text-sm font-medium text-slate-500">%</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Las sugerencias se recalculan al cambiar cualquier valor.</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            {/* Layout dos columnas en desktop: lista izquierda + panel resumen derecha */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,minmax(320px,400px)] gap-4 min-h-0">
              <div className="overflow-y-auto min-h-0 py-1 space-y-3 pr-1 border-r-0 lg:border-r lg:border-slate-200 lg:pr-4">
              {suggestionsByEmployeeAndProject.map((group) => {
                const isEmployeeOpen = expandedSuggestionsEmployees.has(group.employeeId);
                return (
                  <div key={group.employeeId} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <Collapsible open={isEmployeeOpen} onOpenChange={(open) => setExpandedSuggestionsEmployees(prev => { const next = new Set(prev); if (open) next.add(group.employeeId); else next.delete(group.employeeId); return next; })}>
                      <CollapsibleTrigger asChild>
                        <button type="button" className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50/80 transition-colors">
                          <Avatar className="h-10 w-10 border-2 border-slate-200 shrink-0 ring-1 ring-slate-100">
                            <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {group.employeeName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{group.employeeName}</p>
                            <p className="text-xs text-slate-500">Puede recibir horas en {group.projects.length} {group.projects.length === 1 ? 'proyecto' : 'proyectos'}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                              Déficit: {Math.round(group.deficitHours * 2) / 2}h
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 font-medium">
                              {group.projects.length}
                            </Badge>
                          </div>
                          {isEmployeeOpen ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-slate-100 bg-slate-50/30 px-2 pb-2 pt-1 space-y-2">
                          {group.projects.map((proj) => {
                            const projectKey = `${group.employeeId}-${proj.projectId}`;
                            const isProjectOpen = expandedSuggestionsProjects.has(projectKey);
                            return (
                              <div key={projectKey} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                <Collapsible open={isProjectOpen} onOpenChange={(open) => setExpandedSuggestionsProjects(prev => { const n = new Set(prev); if (open) n.add(projectKey); else n.delete(projectKey); return n; })}>
                                  <CollapsibleTrigger asChild>
                                    <button type="button" className="w-full flex items-center gap-2.5 p-2.5 text-left hover:bg-slate-50 transition-colors">
                                      <FolderKanban className="h-4 w-4 text-slate-400 shrink-0" />
                                      <span className="font-medium text-slate-800 text-sm truncate flex-1">{proj.projectName}</span>
                                      <span className="text-[11px] text-slate-500 shrink-0">{proj.transfers.length} {proj.transfers.length === 1 ? 'origen' : 'orígenes'}</span>
                                      {isProjectOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                                    </button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="border-t border-slate-100 bg-slate-50/50 px-2 py-2 space-y-2">
                                      {proj.transfers.map((t) => (
                                        <div key={t.fromId} className="flex items-start gap-3 p-2.5 rounded-md bg-white border border-slate-100 shadow-sm">
                                          <Avatar className="h-8 w-8 border border-slate-200 shrink-0">
                                            <AvatarImage src={t.fromAvatar} alt={t.fromName} />
                                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                                              {t.fromName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 text-sm">{t.fromName}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                              <span className="font-mono font-semibold text-primary">{t.hoursOnProject}h</span>
                                              <span>asignadas en este proyecto</span>
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                              <ArrowRight className="h-3 w-3 text-slate-400" />
                                              {t.suggestedHours > 0 ? (
                                                <>Pasar hasta {t.suggestedHours}h a {group.employeeName}</>
                                              ) : (
                                                <>Sin margen sugerido; revisar en tabla</>
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            );
                          })}
                          {/* Resumen en desktop se muestra en el panel de la derecha */}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
              </div>
              {/* Panel derecho: resumen propuesto; scroll solo dentro del panel para no desplazar todo el modal */}
              <div className="hidden lg:flex flex-col min-h-0 overflow-y-auto overflow-x-hidden bg-slate-50/50 rounded-lg border border-slate-200 p-3">
                {(() => {
                  const group = suggestionsByEmployeeAndProject.find(g => expandedSuggestionsEmployees.has(g.employeeId));
                  if (!group) {
                    return (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-8 px-4">
                        <PanelRight className="h-10 w-10 text-slate-300" />
                        <p className="text-sm font-medium">Selecciona un empleado</p>
                        <p className="text-xs text-center">Expande una fila para ver aquí el resumen.</p>
                      </div>
                    );
                  }
                  const byFrom = new Map<string, { fromName: string; fromAvatar?: string; hours: number }>();
                  const byProject: { projectName: string; items: { fromName: string; hours: number }[] }[] = [];
                  let totalToReceptor = 0;
                  group.projects.forEach(p => {
                    const projectItems: { fromName: string; hours: number }[] = [];
                    p.transfers.forEach(t => {
                      if (t.suggestedHours <= 0) return;
                      if (!byFrom.has(t.fromId)) byFrom.set(t.fromId, { fromName: t.fromName, fromAvatar: t.fromAvatar, hours: 0 });
                      byFrom.get(t.fromId)!.hours += t.suggestedHours;
                      totalToReceptor += t.suggestedHours;
                      projectItems.push({ fromName: t.fromName, hours: t.suggestedHours });
                    });
                    if (projectItems.length) byProject.push({ projectName: p.projectName, items: projectItems });
                  });
                  if (totalToReceptor <= 0) {
                    return (
                      <div className="text-sm text-slate-500 py-4">Sin horas sugeridas para este empleado con la opción actual.</div>
                    );
                  }
                  const receptorCap = getMonthlyCapacity(group.employeeId).available;
                  const receptorAssigned = getEmployeeAssignedHours(group.employeeId);
                  const receptorNewPct = receptorCap > 0 ? Math.round(((receptorAssigned + totalToReceptor) / receptorCap) * 100) : 0;
                  const originLoads = Array.from(byFrom.entries()).map(([fromId, { fromName, hours }]) => {
                    const cap = getMonthlyCapacity(fromId).available;
                    const assigned = getEmployeeAssignedHours(fromId);
                    const pct = cap > 0 ? Math.round(((assigned - hours) / cap) * 100) : 0;
                    return { fromId, fromName, fromAvatar: byFrom.get(fromId)?.fromAvatar, hours, pct };
                  });
                  return (
                    <>
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Resumen propuesto</h4>
                      {/* 1) Cargas resultantes primero */}
                      <div className="mb-2">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">Cargas resultantes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {originLoads.map(o => (
                            <span key={o.fromId} className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', o.pct > 100 ? 'bg-red-50 border-red-200 text-red-700' : o.pct >= 80 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700')}>
                              <span className="truncate max-w-[72px]">{o.fromName}</span>
                              <span className="font-mono font-semibold">{o.pct}%</span>
                            </span>
                          ))}
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <span className="truncate max-w-[72px]">{group.employeeName}</span>
                            <span className="font-mono font-semibold">{receptorNewPct}%</span>
                          </span>
                        </div>
                      </div>
                      {/* 2) Transferencias compactas */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <p className="text-[11px] font-medium text-slate-500 uppercase w-full">Transferencias</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Array.from(byFrom.entries()).map(([fromId, { fromName, fromAvatar, hours }]) => (
                            <div key={fromId} className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white pl-1 pr-2 py-1 shadow-sm">
                              <Avatar className="h-6 w-6 border border-slate-200 shrink-0">
                                <AvatarImage src={fromAvatar} alt={fromName} />
                                <AvatarFallback className="text-[10px]">{fromName.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-[11px] font-medium text-slate-700 truncate max-w-[70px]">{fromName}</span>
                              <span className="text-[11px] font-mono text-rose-600 font-semibold">−{hours}h</span>
                            </div>
                          ))}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <div className="flex items-center gap-2 rounded-lg border-2 border-primary/30 bg-primary/5 pl-2 pr-2.5 py-1.5">
                          <Avatar className="h-7 w-7 border-2 border-primary/30 shrink-0">
                            <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
                            <AvatarFallback className="text-xs font-semibold text-primary">{group.employeeName.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-slate-800 truncate max-w-[90px]">{group.employeeName}</span>
                          <Badge className="shrink-0 bg-primary text-primary-foreground text-[11px] font-mono">+{totalToReceptor}h</Badge>
                        </div>
                      </div>
                      {/* 3) Por proyecto colapsable */}
                      {byProject.length > 0 && (
                        <Collapsible open={rightPanelPorProyectoOpen} onOpenChange={setRightPanelPorProyectoOpen}>
                          <CollapsibleTrigger asChild>
                            <button type="button" className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 py-0.5 mt-0.5">
                              {rightPanelPorProyectoOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              Por proyecto ({byProject.length})
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-1.5 pt-1">
                              {byProject.map((proj, i) => (
                                <div key={i} className="rounded border border-slate-200 bg-white px-2 py-1.5">
                                  <p className="text-[11px] font-medium text-slate-700 truncate">{proj.projectName}</p>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {proj.items.map((item, j) => (
                                      <span key={j} className="text-[10px] text-slate-600 bg-slate-100 rounded px-1 font-mono">{item.fromName} −{item.hours}h</span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'delete_deadline' && '¿Eliminar deadline?'}
              {confirmAction?.type === 'delete_allocation' && '¿Eliminar asignación?'}
              {confirmAction?.type === 'copy_month' && '¿Copiar deadlines?'}
              {confirmAction?.type === 'delete_month' && '¿Resetear mes completo?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'delete_deadline' && 'Esta acción eliminará la planificación de este proyecto para este mes.'}
              {confirmAction?.type === 'delete_allocation' && 'Esta acción eliminará la asignación global.'}
              {confirmAction?.type === 'copy_month' && `Se copiarán ${confirmAction.data?.count} deadlines del mes anterior a este mes.`}
              {confirmAction?.type === 'delete_month' && `¿Estás seguro? Se eliminarán TODAS las asignaciones (${confirmAction.data?.count} proyectos) de este mes. Esta acción no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={cn(
                confirmAction?.type === 'copy_month' ? "" : "bg-red-600 hover:bg-red-700"
              )}
            >
              {confirmAction?.type === 'copy_month' ? 'Copiar' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
