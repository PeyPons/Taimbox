/**
 * Hook de datos para DeadlinesPage: carga de deadlines y global_assignments,
 * suscripción Realtime, locks de edición, proyectos filtrados/agrupados y capacidad.
 * Usado solo por DeadlinesPage. Expone broadcastChannelRef para que la página envíe lock-released.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from '@/lib/notify';
import { supabase } from '@/lib/supabase';
import { Deadline, GlobalAssignment, Project, Client, Employee, Absence, TeamEvent } from '@/types';
import { getEffectiveBudget } from '@/utils/budgetUtils';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { matchesAliasingRule } from '@/lib/utils';
import { getDaysInMonth, startOfMonth, endOfMonth } from 'date-fns';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getTeamEventHoursInRange, getTeamEventDetailsInRange } from '@/utils/teamEventUtils';
import type { DeadlinesFiltersValues } from '@/components/deadlines/DeadlinesFilters';

export type EditingLock = { employeeId: string; employeeName: string; lockedAt: string };

export type MonthlyCapacityResult = {
  total: number;
  absenceHours: number;
  eventHours: number;
  available: number;
  absenceDetails: { type: string; startDate: string; endDate: string; hours: number }[];
  eventDetails: { name: string; hours: number }[];
};

export interface UseDeadlinesPageDataParams {
  selectedMonth: string;
  currentAgency: { id: string } | null;
  projects: Project[];
  clients: Client[];
  employees: Employee[] | null;
  employeesForView: Employee[];
  absences: Absence[];
  teamEvents: TeamEvent[];
  currentUser: { id: string } | null;
  filterSnapshot: DeadlinesFiltersValues;
  filterProject: (project: Project, filterId: string) => boolean;
}

export function useDeadlinesPageData(params: UseDeadlinesPageDataParams) {
  const {
    selectedMonth,
    currentAgency,
    projects,
    clients,
    employees,
    employeesForView,
    absences,
    teamEvents,
    currentUser,
    filterSnapshot,
    filterProject,
  } = params;

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [globalAssignments, setGlobalAssignments] = useState<GlobalAssignment[]>([]);
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [editingLocks, setEditingLocks] = useState<Record<string, EditingLock>>({});

  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lockCleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDeadlines = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchDeadlinesForMonth(selectedMonth, currentAgency?.id);
      if (error) throw error;

      if (data && data.length > 0) {
        setDeadlines(data);
        const hidden = new Set<string>();
        data.forEach((d) => {
          if (d.isHidden) hidden.add(d.projectId);
        });
        setHiddenProjects(hidden);
      } else {
        setDeadlines([]);
        setHiddenProjects(new Set());
      }
    } catch (error) {
      console.error('Error cargando deadlines:', error);
      toast.error((error as Error)?.message || 'Error al cargar deadlines');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGlobalAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('global_assignments')
        .select('*')
        .eq('month', selectedMonth)
        .eq('agency_id', currentAgency?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setGlobalAssignments(
          data.map(
            (g: {
              id: string;
              month: string;
              name: string;
              hours: number;
              affects_all: boolean;
              affected_employee_ids?: string[];
              employee_id?: string;
              created_by?: string;
            }) => ({
              id: g.id,
              month: g.month,
              name: g.name,
              hours: Number(g.hours),
              affectsAll: g.affects_all,
              affectedEmployeeIds: (g.affected_employee_ids || []) as string[],
              employeeId: g.employee_id || g.created_by,
            })
          )
        );
      }
    } catch (error) {
      console.error('Error cargando asignaciones globales:', error);
    }
  };

  useEffect(() => {
    loadDeadlines();
    loadGlobalAssignments();

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
  }, [selectedMonth, currentUser?.id, currentAgency?.id]);

  useEffect(() => {
    if (!selectedMonth || !currentAgency) return;

    const channelName = `deadlines-room-${currentAgency.id}-${selectedMonth}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deadlines', filter: `month=eq.${selectedMonth}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newDeadline = payload.new as Record<string, unknown>;
            if (!projects.find((p) => p.id === newDeadline.project_id)) return;

            setDeadlines((prev) => {
              const existing = prev.find((d) => d.id === newDeadline.id);
              if (existing) {
                return prev.map((d) =>
                  d.id === newDeadline.id
                    ? {
                        id: newDeadline.id as string,
                        projectId: newDeadline.project_id as string,
                        month: newDeadline.month as string,
                        notes: newDeadline.notes as string | undefined,
                        employeeHours: (newDeadline.employee_hours as Record<string, number>) || {},
                        isHidden: (newDeadline.is_hidden as boolean) || false,
                        budgetOverride: newDeadline.budget_override as number | undefined,
                      }
                    : d
                );
              }
              return [
                ...prev,
                {
                  id: newDeadline.id as string,
                  projectId: newDeadline.project_id as string,
                  month: newDeadline.month as string,
                  notes: newDeadline.notes as string | undefined,
                  employeeHours: (newDeadline.employee_hours as Record<string, number>) || {},
                  isHidden: (newDeadline.is_hidden as boolean) || false,
                  budgetOverride: newDeadline.budget_override as number | undefined,
                },
              ];
            });

            if (newDeadline.is_hidden) {
              setHiddenProjects((prev) => new Set([...prev, newDeadline.project_id as string]));
            } else {
              setHiddenProjects((prev) => {
                const next = new Set(prev);
                next.delete(newDeadline.project_id as string);
                return next;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setDeadlines((prev) => prev.filter((d) => d.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_assignments',
          filter: `month=eq.${selectedMonth}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const payloadNew = payload.new as Record<string, unknown>;
            if (payloadNew.agency_id && payloadNew.agency_id !== currentAgency.id) return;

            const newAssignment = payload.new as {
              id: string;
              name: string;
              hours: number;
              affects_all: boolean;
              affected_employee_ids?: string[];
              month: string;
              employee_id?: string;
              created_by?: string;
            };
            setGlobalAssignments((prev) => {
              const existing = prev.find((a) => a.id === newAssignment.id);
              if (existing) {
                return prev.map((a) =>
                  a.id === newAssignment.id
                    ? {
                        id: newAssignment.id,
                        name: newAssignment.name,
                        hours: newAssignment.hours,
                        affectsAll: newAssignment.affects_all,
                        affectedEmployeeIds: (newAssignment.affected_employee_ids || []) as string[],
                        month: newAssignment.month,
                        employeeId: newAssignment.employee_id || newAssignment.created_by,
                      }
                    : a
                );
              }
              return [
                ...prev,
                {
                  id: newAssignment.id,
                  name: newAssignment.name,
                  hours: newAssignment.hours,
                  affectsAll: newAssignment.affects_all,
                  affectedEmployeeIds: (newAssignment.affected_employee_ids || []) as string[],
                  month: newAssignment.month,
                  employeeId: newAssignment.employee_id || newAssignment.created_by,
                },
              ];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setGlobalAssignments((prev) => prev.filter((a) => a.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_editing_locks',
          filter: `month=eq.${selectedMonth}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const lock = payload.new as {
              employee_id: string;
              project_id: string;
              expires_at: string;
              locked_at: string;
            };
            if (lock.employee_id !== currentUser?.id && lock.expires_at > new Date().toISOString()) {
              const employee = (employees ?? []).find((e) => e.id === lock.employee_id);
              setEditingLocks((prev) => ({
                ...prev,
                [lock.project_id]: {
                  employeeId: lock.employee_id,
                  employeeName: employee?.first_name || employee?.name || 'Alguien',
                  lockedAt: lock.locked_at,
                },
              }));
            }
          }
        }
      )
      .on('broadcast', { event: 'lock-released' }, (payload) => {
        const { projectIds, employeeId } = payload.payload as { projectIds: string[]; employeeId: string };
        if (employeeId !== currentUser?.id && projectIds?.length > 0) {
          setEditingLocks((prev) => {
            const newLocks = { ...prev };
            projectIds.forEach((projectId) => {
              if (newLocks[projectId]?.employeeId === employeeId) delete newLocks[projectId];
            });
            return newLocks;
          });
        }
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error en suscripción Realtime (${channelName})`);
        }
      });

    broadcastChannelRef.current = channel;
    return () => {
      broadcastChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [selectedMonth, currentAgency?.id, projects, currentUser?.id, employees]);

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
          const locksMap: Record<string, EditingLock> = {};
          data.forEach(
            (lock: {
              employee_id: string;
              project_id: string;
              expires_at: string;
              locked_at: string;
            }) => {
              const employee = (employees ?? []).find((e) => e.id === lock.employee_id);
              if (
                employee &&
                lock.employee_id !== currentUser?.id &&
                lock.expires_at > new Date().toISOString()
              ) {
                locksMap[lock.project_id] = {
                  employeeId: lock.employee_id,
                  employeeName: employee.first_name || employee.name || 'Desconocido',
                  lockedAt: lock.locked_at,
                };
              }
            }
          );
          setEditingLocks(locksMap);
        }
      } catch (error) {
        console.error('Error cargando locks:', error);
      }
    };
    loadEditingLocks();
  }, [selectedMonth, employees, currentUser?.id]);

  useEffect(() => {
    const cleanupOrphanedLocks = async () => {
      try {
        await supabase
          .from('project_editing_locks')
          .delete()
          .lt('expires_at', new Date().toISOString());
      } catch (error) {
        console.error('Error en limpieza de locks:', error);
      }
    };
    cleanupOrphanedLocks();
    lockCleanupIntervalRef.current = setInterval(cleanupOrphanedLocks, 60 * 1000);
    return () => {
      if (lockCleanupIntervalRef.current) clearInterval(lockCleanupIntervalRef.current);
    };
  }, []);

  const activeEmployees = useMemo(
    () =>
      employeesForView
        .filter((e) => e.isActive)
        .sort((a, b) => (a.first_name || a.name).localeCompare(b.first_name || b.name)),
    [employeesForView]
  );

  const getMonthlyCapacity = (employeeId: string): MonthlyCapacityResult => {
    const employee = (employees ?? []).find((e) => e.id === employeeId);
    if (!employee)
      return {
        total: 0,
        absenceHours: 0,
        eventHours: 0,
        available: 0,
        absenceDetails: [],
        eventDetails: [],
      };

    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const workSchedule = employee.workSchedule;

    let baseHours = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
      baseHours += workSchedule[dayKey as keyof typeof workSchedule] || 0;
    }

    const employeeAbsences = absences.filter((a) => a.employeeId === employeeId);
    const absenceHours = getAbsenceHoursInRange(monthStart, monthEnd, employeeAbsences, workSchedule);

    const absenceDetails = employeeAbsences
      .filter((a) => {
        const start = new Date(a.startDate);
        const end = new Date(a.endDate);
        return start <= monthEnd && end >= monthStart;
      })
      .map((a) => ({
        type: a.type,
        startDate: a.startDate,
        endDate: a.endDate,
        hours: getAbsenceHoursInRange(monthStart, monthEnd, [a], workSchedule),
      }))
      .filter((a) => a.hours > 0);

    const eventHours = getTeamEventHoursInRange(
      monthStart,
      monthEnd,
      employeeId,
      teamEvents,
      workSchedule,
      employeeAbsences
    );
    const eventDetailsRaw = getTeamEventDetailsInRange(
      monthStart,
      monthEnd,
      employeeId,
      teamEvents,
      workSchedule,
      employeeAbsences
    );
    const eventDetails = eventDetailsRaw.map((e) => ({ name: e.name, hours: e.hours }));
    const available = Math.max(0, baseHours - absenceHours - eventHours);

    return { total: baseHours, absenceHours, eventHours, available, absenceDetails, eventDetails };
  };

  const getEmployeeAssignedHours = (employeeId: string) => {
    let total = 0;
    deadlines.forEach((deadline) => {
      if (!hiddenProjects.has(deadline.projectId) && !deadline.isHidden) {
        total += deadline.employeeHours[employeeId] || 0;
      }
    });
    globalAssignments.forEach((assignment) => {
      if (
        assignment.affectsAll ||
        (assignment.affectedEmployeeIds ?? []).includes(employeeId)
      ) {
        total += assignment.hours;
      }
    });
    return total;
  };

  const filteredProjects = useMemo(() => {
    const { searchTerm, filterId, showHidden, showUnassignedOnly, filterByEmployee, sortBy } =
      filterSnapshot;
    let filtered = projects.filter((p) => p.status === 'active');

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => {
        const client = clients.find((c) => c.id === p.clientId);
        return (
          p.name.toLowerCase().includes(term) || client?.name.toLowerCase().includes(term)
        );
      });
    }

    if (filterId !== 'all') {
      filtered = filtered.filter((p) => filterProject(p, filterId));
    }

    if (!showHidden) {
      filtered = filtered.filter((p) => !hiddenProjects.has(p.id));
    }

    if (filterByEmployee !== 'all') {
      filtered = filtered.filter((p) => {
        const deadline = deadlines.find((d) => d.projectId === p.id && d.month === selectedMonth);
        return deadline && (deadline.employeeHours[filterByEmployee] || 0) > 0;
      });
    }

    if (showUnassignedOnly) {
      filtered = filtered.filter((p) => {
        const deadline = deadlines.find((d) => d.projectId === p.id && d.month === selectedMonth);
        if (!deadline) return true;
        const totalAssigned = (Object.values(deadline.employeeHours) as number[]).reduce(
          (s, h) => s + (h || 0),
          0
        );
        return totalAssigned === 0;
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === 'client') {
        const clientA = clients.find((c) => c.id === a.clientId)?.name || '';
        const clientB = clients.find((c) => c.id === b.clientId)?.name || '';
        return clientA.localeCompare(clientB);
      }
      if (sortBy === 'assigned') {
        const deadlineA = deadlines.find((d) => d.projectId === a.id && d.month === selectedMonth);
        const deadlineB = deadlines.find((d) => d.projectId === b.id && d.month === selectedMonth);
        const totalA = deadlineA
          ? (Object.values(deadlineA.employeeHours) as number[]).reduce((s, h) => s + (h || 0), 0)
          : 0;
        const totalB = deadlineB
          ? (Object.values(deadlineB.employeeHours) as number[]).reduce((s, h) => s + (h || 0), 0)
          : 0;
        return totalB - totalA;
      }
      const deadlineA = deadlines.find((d) => d.projectId === a.id && d.month === selectedMonth);
      const deadlineB = deadlines.find((d) => d.projectId === b.id && d.month === selectedMonth);
      const assignedA = deadlineA
        ? (Object.values(deadlineA.employeeHours) as number[]).reduce((s, h) => s + (h || 0), 0)
        : 0;
      const assignedB = deadlineB
        ? (Object.values(deadlineB.employeeHours) as number[]).reduce((s, h) => s + (h || 0), 0)
        : 0;
      const remainingA = getEffectiveBudget(a, deadlineA) - assignedA;
      const remainingB = getEffectiveBudget(b, deadlineB) - assignedB;
      return remainingB - remainingA;
    });

    return filtered;
  }, [
    projects,
    clients,
    filterSnapshot,
    hiddenProjects,
    deadlines,
    selectedMonth,
    filterProject,
  ]);

  const projectsByClient = useMemo(() => {
    const grouped: Record<string, Project[]> = {};
    const aliasingRules = currentAgency?.settings?.projectAliasingRules || [];

    filteredProjects.forEach((project) => {
      const matchedRule = matchesAliasingRule(project.name, aliasingRules);
      const clientId =
        matchedRule && matchedRule.groupAsVirtualClient
          ? matchedRule.id
          : (project.clientId || 'sin-cliente');

      if (!grouped[clientId]) grouped[clientId] = [];
      grouped[clientId].push(project);
    });

    return grouped;
  }, [filteredProjects, currentAgency?.settings?.projectAliasingRules]);

  const getProjectDeadline = (projectId: string) =>
    deadlines.find((d) => d.projectId === projectId && d.month === selectedMonth);

  const getTotalHours = (deadline: Deadline) =>
    Object.values(deadline.employeeHours).reduce((sum, hours) => sum + hours, 0);

  return {
    deadlines,
    setDeadlines,
    globalAssignments,
    setGlobalAssignments,
    hiddenProjects,
    setHiddenProjects,
    isLoading,
    setIsLoading,
    editingLocks,
    setEditingLocks,
    activeEmployees,
    filteredProjects,
    projectsByClient,
    getMonthlyCapacity,
    getEmployeeAssignedHours,
    getProjectDeadline,
    getTotalHours,
    loadDeadlines,
    loadGlobalAssignments,
    broadcastChannelRef,
  };
}
