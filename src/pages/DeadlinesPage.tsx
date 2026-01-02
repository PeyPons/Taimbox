/* eslint-disable */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostgrestError } from '@supabase/supabase-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, Pencil, Trash2, Save, Search, Eye, EyeOff, ChevronDown, ChevronRight, ChevronLeft,
  Calendar, Users, AlertTriangle, CheckCircle2, XCircle, Copy, Filter, Sparkles, Edit, HelpCircle, PanelRight
} from 'lucide-react';
import { DeadlinesTour, useDeadlinesTour } from '@/components/deadlines/DeadlinesTour';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Deadline, GlobalAssignment } from '@/types';
import { cn, isKitDigitalProject } from '@/lib/utils';
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getTeamEventHoursInRange, getTeamEventDetailsInRange } from '@/utils/teamEventUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function DeadlinesPage() {
  const { projects, clients, employees, absences, teamEvents, currentUser } = useApp();
  const { currentAgency } = useAgency();
  const { showTour } = useDeadlinesTour();
  const isMobile = useIsMobile();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [globalAssignments, setGlobalAssignments] = useState<GlobalAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGlobalDialogOpen, setIsGlobalDialogOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [editingGlobal, setEditingGlobal] = useState<GlobalAssignment | null>(null);

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
    isHidden: false
  });

  const [confirmAction, setConfirmAction] = useState<{ type: 'delete_deadline' | 'delete_allocation' | 'copy_month', id?: string, data?: any } | null>(null);

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

  // Cargar deadlines desde Supabase
  const loadDeadlines = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('deadlines')
        .select('*, projects!inner(agency_id)') // Join para filtrar por agencia
        .eq('month', selectedMonth)
        .eq('projects.agency_id', currentAgency?.id) // Filtro de agencia
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setDeadlines(data.map((d: { id: string; project_id: string; month: string; notes?: string; employee_hours?: Record<string, number>; is_hidden?: boolean }) => ({
          id: d.id,
          projectId: d.project_id,
          month: d.month,
          notes: d.notes,
          employeeHours: d.employee_hours || {},
          isHidden: d.is_hidden || false
        })));

        // Cargar proyectos ocultos
        const hidden = new Set<string>();
        data.forEach((d: { project_id: string; is_hidden?: boolean }) => {
          if (d.is_hidden) hidden.add(d.project_id);
        });
        setHiddenProjects(hidden);
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

  // Suscripción en tiempo real para deadlines
  useEffect(() => {
    const channelName = `deadlines-changes-${selectedMonth}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deadlines',
          // No podemos filtrar por join en realtime, filtrado en cliente
          filter: `month=eq.${selectedMonth}`
        },
        (payload) => {
          // Filtrar eventos que no pertenecen a nuestra agencia (si es posible verificar)
          // Nota: lo ideal sería RLS, pero por ahora en cliente verificamos si el proyecto existe en nuestra lista
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newDeadline = payload.new as any;
            // Solo procesar si el proyecto pertenece a nuestra agencia (está en la lista de projects cargados)
            if (!projects.find(p => p.id === newDeadline.project_id)) return;

            // Cast typed variable
            const newDeadlineTyped = newDeadline as { id: string; project_id: string; month: string; notes?: string; employee_hours?: Record<string, number>; is_hidden?: boolean };
            setDeadlines(prev => {
              const existing = prev.find(d => d.id === newDeadlineTyped.id);
              if (existing) {
                return prev.map(d =>
                  d.id === newDeadlineTyped.id
                    ? {
                      id: newDeadline.id,
                      projectId: newDeadline.project_id,
                      month: newDeadline.month,
                      notes: newDeadline.notes,
                      employeeHours: newDeadline.employee_hours || {},
                      isHidden: newDeadline.is_hidden || false
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
                  isHidden: newDeadline.is_hidden || false
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
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscrito a cambios de deadlines');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en suscripción Realtime');
        }
      });

    return () => {
      console.log('🔌 Desconectando canal Realtime');
      supabase.removeChannel(channel);
    };
  }, [selectedMonth]);

  // Suscripción en tiempo real para global assignments
  useEffect(() => {
    const channelName = `global-assignments-changes-${selectedMonth}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_assignments',
          table: 'global_assignments',
          filter: `month=eq.${selectedMonth}`
          // Nota: Deberíamos filtrar por agency_id pero Supabase Realtime filter syntax es limitado para columnas nuevas sin reiniciar
        },
        (payload) => {

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const payloadNew = payload.new as any;
            // Filtrar por agencia
            if (payloadNew.agency_id && payloadNew.agency_id !== currentAgency?.id) return;

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
      .subscribe((status) => {
        console.log('📡 Realtime global assignments subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscrito a cambios de global assignments');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en suscripción Realtime de global assignments');
        }
      });

    return () => {
      console.log('🔌 Desconectando canal Realtime de global assignments');
      supabase.removeChannel(channel);
    };
  }, [selectedMonth]);

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

  // Suscripción en tiempo real para locks de edición
  useEffect(() => {
    // Canal compartido para todos los usuarios del mismo mes
    const channelName = `editing-locks-${selectedMonth}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_editing_locks',
          filter: `month=eq.${selectedMonth}`
        },
        (payload) => {
          console.log('🔔 Realtime editing lock change:', payload.eventType, payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const lock = payload.new as { employee_id: string; project_id: string; expires_at: string; locked_at: string };
            // Solo mostrar si no es nuestro propio lock
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
          // DELETE events no incluyen project_id, usamos broadcast en su lugar
        }
      )
      .on(
        'broadcast',
        { event: 'lock-released' },
        (payload) => {
          console.log('🔓 Broadcast: lock released', payload);
          const { projectIds, employeeId } = payload.payload as { projectIds: string[]; employeeId: string };
          // Solo procesar si no es nuestro propio broadcast
          if (employeeId !== currentUser?.id && projectIds?.length > 0) {
            setEditingLocks(prev => {
              const newLocks = { ...prev };
              projectIds.forEach(projectId => {
                // Solo eliminar si el lock pertenece al empleado que lo liberó
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
        console.log('📡 Realtime editing locks subscription status:', status);
      });

    // Guardar referencia al canal para usarla en las funciones de release
    broadcastChannelRef.current = channel;

    return () => {
      broadcastChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [selectedMonth, currentUser, employees]);

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
    return employees.filter(e => e.isActive).sort((a, b) =>
      (a.first_name || a.name).localeCompare(b.first_name || b.name)
    );
  }, [employees]);

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
        const remainingA = (a.budgetHours || 0) - assignedA;
        const remainingB = (b.budgetHours || 0) - assignedB;
        return remainingB - remainingA;
      }
    });

    return filtered;
  }, [projects, clients, searchTerm, filterId, showHidden, showUnassignedOnly, hiddenProjects, filterByEmployee, deadlines, selectedMonth, sortBy, filterProject]);

  // Agrupar proyectos por cliente (unificando Kit Digital)
  const projectsByClient = useMemo(() => {
    const grouped: Record<string, typeof filteredProjects> = {};

    filteredProjects.forEach(project => {
      // Unificar todos los proyectos "Kit Digital" bajo un solo cliente virtual
      // Usa la función helper que detecta todas las variantes: (KD), KD , KD:, kit digital, etc.
      const isKitDigital = isKitDigitalProject(project.name);

      const clientId = isKitDigital ? 'kit-digital' : (project.clientId || 'sin-cliente');
      if (!grouped[clientId]) {
        grouped[clientId] = [];
      }
      grouped[clientId].push(project);
    });

    return grouped;
  }, [filteredProjects]);

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
        isHidden: deadline.isHidden || false
      });
    } else {
      setEditingDeadline(null);
      setFormData({
        projectId: '',
        notes: '',
        employeeHours: {},
        isHidden: false
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
        is_hidden: formData.isHidden
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
    }
    setConfirmAction(null);
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
      isHidden: deadline?.isHidden || hiddenProjects.has(projectId)
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
    setInlineFormData({ employeeHours: {}, notes: '', isHidden: false });
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
        is_hidden: formData.isHidden
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
        is_hidden: inlineFormData.isHidden
      };

      if (existingDeadline) {
        const { error } = await supabase
          .from('deadlines')
          .update(deadlineData)
          .eq('id', existingDeadline.id);

        if (error) throw error;

        setDeadlines(prev => prev.map(d =>
          d.id === existingDeadline.id
            ? { ...d, projectId, month: selectedMonth, notes: inlineFormData.notes, employeeHours: inlineFormData.employeeHours, isHidden: inlineFormData.isHidden }
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
          isHidden: data.is_hidden || false
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
      // 1. Obtener deadlines del mes anterior
      const previousMonth = format(subMonths(parseISO(`${selectedMonth}-01`), 1), 'yyyy-MM');
      const { data: previousDeadlines, error: fetchError } = await supabase
        .from('deadlines')
        .select('*')
        .eq('month', previousMonth);

      if (fetchError) throw fetchError;

      if (!previousDeadlines || previousDeadlines.length === 0) {
        toast.info('No hay deadlines en el mes anterior');
        return;
      }

      // 2. Insertarlos en el mes actual
      const newDeadlines = previousDeadlines.map((d: any) => ({
        project_id: d.project_id,
        month: selectedMonth,
        notes: d.notes,
        employee_hours: d.employee_hours,
        is_hidden: d.is_hidden
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('deadlines')
        .insert(newDeadlines)
        .select();

      if (insertError) throw insertError;

      // 3. Actualizar estado local
      if (insertedData) {
        setDeadlines(prev => [
          ...prev,
          ...insertedData.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            month: d.month,
            notes: d.notes,
            employeeHours: d.employee_hours || {},
            isHidden: d.is_hidden || false
          }))
        ]);

        // Actualizar hidden projects
        insertedData.forEach((d: any) => {
          if (d.is_hidden) {
            setHiddenProjects(prev => new Set([...prev, d.project_id]));
          }
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
      const { data: previousDeadlines, error: fetchError } = await supabase
        .from('deadlines')
        .select('id') // Only need count
        .eq('month', previousMonth);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Cargando deadlines...</div>
      </div>
    );
  }

  // Calcular tips inteligentes de redistribución
  const getRedistributionTips = () => {
    const tips: { from: string; to: string; reason: string; projects: string[]; impact: number }[] = [];
    const employeeLoads: { id: string; name: string; percentage: number; projects: string[] }[] = [];

    // Calcular carga y proyectos de cada empleado SEO (excluir PPC)
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

    // Calcular desviación estándar para rangos amplios
    const variance = employeeLoads.reduce((sum, e) => sum + Math.pow(e.percentage - averageLoad, 2), 0) / employeeLoads.length;
    const standardDeviation = Math.sqrt(variance);

    // Umbral híbrido: si el rango es estrecho (≤15 puntos), usar umbral fijo bajo
    // Si el rango es amplio, usar desviación estándar dinámica
    const deviationThreshold = range <= 15
      ? 3  // Umbral fijo bajo para rangos estrechos (ej: 80-90%)
      : Math.max(3, Math.round(standardDeviation * 1.5));  // Dinámico para rangos amplios

    // Identificar empleados por encima y por debajo de la media
    const aboveAverage = employeeLoads.filter(e => e.percentage > averageLoad + deviationThreshold);
    const belowAverage = employeeLoads.filter(e => e.percentage < averageLoad - deviationThreshold);

    // Si todos están equilibrados (dentro del umbral), no hay sugerencias
    if (aboveAverage.length === 0 || belowAverage.length === 0) return [];

    // Generar sugerencias priorizando las que más equilibren el equipo
    aboveAverage.forEach(over => {
      belowAverage.forEach(avail => {
        // Solo sugerir si comparten proyectos
        const sharedProjects = over.projects.filter(p => avail.projects.includes(p));
        if (sharedProjects.length > 0) {
          // Calcular impacto: cuánto se acerca cada uno a la media después de la transferencia
          // Mayor diferencia = mayor impacto potencial
          const currentGap = (over.percentage - averageLoad) + (averageLoad - avail.percentage);
          const impact = currentGap; // Cuanto mayor el gap, mayor el impacto de equilibrar

          tips.push({
            from: over.name,
            to: avail.name,
            reason: `${over.name} está al ${over.percentage}% (media: ${averageLoad}%), ${avail.name} al ${avail.percentage}%`,
            projects: sharedProjects.map(pid => projects.find(p => p.id === pid)?.name || '').filter(Boolean),
            impact
          });
        }
      });
    });

    // Ordenar por impacto (mayor impacto primero) y devolver las top 3
    return tips
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3)
      .map(({ impact, ...tip }) => tip); // Remover impact del resultado final
  };

  const redistributionTips = getRedistributionTips();

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 min-h-screen bg-slate-50">
      <DeadlinesTour forceShow={showTour} />
      {/* Columna principal - Proyectos */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Deadline</h1>
            <p className="text-xs md:text-sm text-slate-500">Asignación mensual de horas</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Selector de mes con flechas */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1" data-tour="month-selector">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs md:text-sm font-medium px-1 md:px-2 min-w-[90px] md:min-w-[140px] text-center capitalize">
                {format(currentMonthDate, isMobile ? 'MMM yy' : 'MMMM yyyy', { locale: es })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 bg-white rounded-xl border shadow-sm p-2 sm:p-3" data-tour="filters">
          <div className="flex-1 min-w-0">
            <div className="relative">
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
            <Select value={filterId} onValueChange={setFilterId}>
              <SelectTrigger className="w-[120px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Tipo de Proyecto" />
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
            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
              <span className="text-slate-600 whitespace-nowrap">Ocultos</span>
              <Switch
                id="show-hidden"
                checked={showHidden}
                onCheckedChange={setShowHidden}
                className="scale-75 sm:scale-90"
              />
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
              <span className="text-orange-600 font-medium whitespace-nowrap">Sin asig.</span>
              <Switch
                id="show-unassigned"
                checked={showUnassignedOnly}
                onCheckedChange={setShowUnassignedOnly}
                className="scale-75 sm:scale-90"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterByEmployee} onValueChange={setFilterByEmployee}>
              <SelectTrigger className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Empleado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {activeEmployees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name || emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'client' | 'assigned' | 'remaining')}>
              <SelectTrigger className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Por cliente</SelectItem>
                <SelectItem value="assigned">Más asignado</SelectItem>
                <SelectItem value="remaining">Más disponible</SelectItem>
              </SelectContent>
            </Select>
            {/* Botón para añadir asignación global (visible en móvil) */}
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 gap-1"
                onClick={() => openGlobalDialog()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

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
                            {/* Fila del proyecto - clickeable para editar */}
                            <div
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors",
                                isEditing && "hover:bg-primary/10/40"
                              )}
                              onClick={() => !isEditing && startEditingProject(project.id)}
                            >
                              {/* Info del proyecto */}
                              <div className="min-w-[180px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-slate-800">{project.name}</span>
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
                                  <span>máx {project.budgetHours}h</span>
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

                            {/* Panel de edición */}
                            {isEditing && (
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

      {/* Panel lateral sticky - Disponibilidad del equipo (solo desktop) */}
      {
        !isMobile && (
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

              {/* Tips de redistribución */}
              {redistributionTips.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3" data-tour="suggestions">
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
                              <li>Se priorizan las sugerencias que más equilibran el equipo</li>
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
                      <Input placeholder="Ej: Deadline afecta a todos, Creación timeboxing" {...field} />
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

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'delete_deadline' && '¿Eliminar deadline?'}
              {confirmAction?.type === 'delete_allocation' && '¿Eliminar asignación?'}
              {confirmAction?.type === 'copy_month' && '¿Copiar deadlines?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'delete_deadline' && 'Esta acción eliminará la planificación de este proyecto para este mes.'}
              {confirmAction?.type === 'delete_allocation' && 'Esta acción eliminará la asignación global.'}
              {confirmAction?.type === 'copy_month' && `Se copiarán ${confirmAction.data?.count} deadlines del mes anterior a este mes.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={cn(confirmAction?.type === 'copy_month' ? "" : "bg-red-600 hover:bg-red-700")}
            >
              {confirmAction?.type === 'copy_month' ? 'Copiar' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
