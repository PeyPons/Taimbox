import { endOfMonth, format, startOfMonth, startOfWeek } from 'date-fns';
import { supabase } from '@/lib/supabase';
import {
  Employee,
  Client,
  Project,
  Allocation,
  Absence,
  TeamEvent,
  WeeklyFeedback,
  EmployeeRole,
  WorkSchedule,
  UserRoutine,
} from '@/types';
import { getWeeksForMonth, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { toast } from '@/lib/notify';
import { round2 } from '@/utils/numbers';

// Tipos equivalentes a los usados en AppContext (snake_case de Supabase)
interface SupabaseEmployee {
  id: string;
  agency_id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_id?: string;
  role?: string;
  department?: string;
  department_id?: string | null;
  avatar_url?: string;
  default_weekly_capacity: number;
  work_schedule?: unknown;
  is_active: boolean;
  hourly_rate?: number;
  crm_user_id?: number;
  welcome_tour_completed?: boolean;
  deadlines_tour_completed?: boolean;
  planner_tour_completed?: boolean;
  permissions?: unknown;
  preferred_view?: 'weekly' | 'daily' | null;
}

interface SupabaseClient {
  id: string;
  agency_id: string;
  name: string;
  color: string;
}

interface SupabaseProject {
  id: string;
  agency_id: string;
  client_id: string;
  name: string;
  status: string;
  budget_hours: number;
  minimum_hours?: number;
  monthly_fee?: number;
  external_id?: string;
  project_type?: string;
  deliverable_contract_fee?: number | null;
  deliverable_start_date?: string | null;
  deliverable_due_date?: string | null;
  is_hidden?: boolean;
  responsible_department_id?: string | null;
  okrs?: { id: string; title: string; progress: number }[];
  deliverables_log?: Record<string, string[]>;
}

interface SupabaseAllocation {
  id: string;
  employee_id: string;
  project_id: string;
  week_start_date: string;
  hours_assigned: number;
  hours_actual?: number;
  hours_computed?: number;
  status: string;
  description?: string;
  task_name?: string;
  dependency_id?: string;
  transferred_from_allocation_id?: string;
  distribution_source_allocation_id?: string;
  parent_allocation_id?: string;
  original_transferred_task_name?: string;
  transfer_source_employee_id?: string;
  user_priority?: number | null;
  focus_date?: string | null;
  is_locked?: boolean;
}

interface SupabaseAbsence {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  type: string;
  hours?: number;
  description?: string;
}

interface SupabaseTeamEvent {
  id: string;
  name: string;
  date: string;
  hours_reduction: number;
  affected_employee_ids: string[] | 'all';
}

interface SupabaseWeeklyFeedback {
  id: string;
  employee_id: string;
  week_start_date: string;
  project_id?: string;
  allocation_id?: string;
  reason?: string;
  comments?: string;
  created_at: string;
}

interface SupabaseUserRoutine {
  id: string;
  employee_id: string;
  title: string;
  estimated_minutes: number;
  project_id?: string;
  is_active: boolean;
}

export interface FetchInitialDataDeps {
  agencyId: string;
  skipLoading: boolean;
  dateRange?: { start: Date; end: Date };
  setIsLoading: (value: boolean) => void;
  setIsSecondaryLoading: (value: boolean) => void;
  setEmployees: (value: Employee[]) => void;
  setClients: (value: Client[]) => void;
  setProjects: (value: Project[]) => void;
  setAllocations: (value: Allocation[] | ((prev: Allocation[]) => Allocation[])) => void;
  setAbsences: (value: Absence[] | ((prev: Absence[]) => Absence[])) => void;
  setTeamEvents: (value: TeamEvent[] | ((prev: TeamEvent[]) => TeamEvent[])) => void;
  setWeeklyFeedback: (value: WeeklyFeedback[] | ((prev: WeeklyFeedback[]) => WeeklyFeedback[])) => void;
  setUserRoutines: (value: UserRoutine[]) => void;
  employeesRef: React.MutableRefObject<Employee[]>;
}

export async function fetchInitialAppData({
  agencyId,
  skipLoading,
  dateRange,
  setIsLoading,
  setIsSecondaryLoading,
  setEmployees,
  setClients,
  setProjects,
  setAllocations,
  setAbsences,
  setTeamEvents,
  setWeeklyFeedback,
  setUserRoutines,
  employeesRef,
}: FetchInitialDataDeps) {
  if (!skipLoading) {
    setIsLoading(true);
  }

  try {
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startDate = dateRange?.start || defaultStart;
    const endDate = dateRange?.end || defaultEnd;

    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    // Phase 1: empleados, clientes, proyectos activos
    const [empRes, cliRes, projRes] = await Promise.all([
      supabase.from('employees').select('*').eq('agency_id', agencyId),
      supabase.from('clients').select('*').eq('agency_id', agencyId),
      supabase.from('projects').select('*').eq('agency_id', agencyId).eq('status', 'active'),
    ]);

    if (empRes.data) {
      const mappedEmployees: Employee[] = empRes.data.map((e: SupabaseEmployee) => ({
        id: e.id,
        agencyId: e.agency_id,
        name: e.name,
        role: (e.role || 'SEO') as EmployeeRole,
        avatarUrl: e.avatar_url,
        defaultWeeklyCapacity: e.default_weekly_capacity,
        workSchedule: (e.work_schedule || {
          monday: 8,
          tuesday: 8,
          wednesday: 8,
          thursday: 8,
          friday: 8,
          saturday: 0,
          sunday: 0,
        }) as WorkSchedule,
        isActive: e.is_active,
        first_name: e.first_name,
        last_name: e.last_name,
        email: e.email,
        user_id: e.user_id,
        department: e.department,
        departmentId: e.department_id ?? undefined,
        monthlyCost: e.hourly_rate || 0,
        hourlyRate: e.hourly_rate || 0,
        crmUserId: e.crm_user_id,
        welcomeTourCompleted: e.welcome_tour_completed === true,
        deadlinesTourCompleted: e.deadlines_tour_completed === true,
        plannerTourCompleted: e.planner_tour_completed === true,
        permissions: e.permissions || undefined,
        preferredView: e.preferred_view || null,
      }));
      setEmployees(mappedEmployees);
      employeesRef.current = mappedEmployees;
    }

    if (cliRes.data) {
      setClients(
        cliRes.data.map(
          (c: SupabaseClient): Client => ({
            id: c.id,
            agencyId: c.agency_id,
            name: c.name,
            color: c.color,
          })
        )
      );
    }

    if (projRes.data) {
      setProjects(
        projRes.data.map(
          (p: SupabaseProject): Project => ({
            id: p.id,
            agencyId: p.agency_id,
            clientId: p.client_id,
            name: p.name,
            status: (p.status || 'active') as 'active' | 'archived' | 'completed',
            budgetHours: round2(p.budget_hours),
            minimumHours: round2(p.minimum_hours || 0),
            monthlyFee: p.monthly_fee,
            externalId: p.external_id ? Number(p.external_id) : undefined,
            projectType: p.project_type,
            deliverableContractFee: p.deliverable_contract_fee ?? undefined,
            deliverableStartDate: p.deliverable_start_date ?? undefined,
            deliverableDueDate: p.deliverable_due_date ?? undefined,
            isHidden: p.is_hidden || false,
            responsibleDepartmentId: p.responsible_department_id ?? undefined,
            okrs: p.okrs,
            deliverables_log: p.deliverables_log,
          })
        )
      );
    }

    if (!skipLoading) {
      setIsLoading(false);
    }

    // Phase 2: allocations, absences, events, feedback, routines
    setIsSecondaryLoading(true);
    const [allocRes, absRes, evRes, feedbackRes, routinesRes] = await Promise.all([
      supabase
        .from('allocations')
        .select('*, employees!allocations_employee_id_fkey!inner(agency_id)')
        .eq('employees.agency_id', agencyId)
        .gte('week_start_date', startStr)
        .lte('week_start_date', endStr),
      supabase
        .from('absences')
        .select('*, employees!inner(agency_id)')
        .eq('employees.agency_id', agencyId)
        .lte('start_date', endStr)
        .gte('end_date', startStr),
      supabase
        .from('team_events')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('date', startStr)
        .lte('date', endStr),
      supabase
        .from('weekly_feedback')
        .select('*, employees!inner(agency_id)')
        .eq('employees.agency_id', agencyId)
        .gte('week_start_date', startStr)
        .lte('week_start_date', endStr),
      supabase.from('user_routines').select('*, employees!inner(agency_id)').eq('employees.agency_id', agencyId),
    ]);

    if (allocRes.error) console.error('Error fetching allocations:', allocRes.error);
    if (absRes.error) console.error('Error fetching absences:', absRes.error);
    if (evRes.error) console.error('Error fetching events:', evRes.error);
    if (feedbackRes.error) console.error('Error fetching feedback:', feedbackRes.error);
    if (routinesRes.error) console.error('Error fetching user routines:', routinesRes.error);

    if (routinesRes.data) {
      setUserRoutines(
        routinesRes.data.map(
          (r: SupabaseUserRoutine): UserRoutine => ({
            id: r.id,
            employeeId: r.employee_id,
            title: r.title,
            estimatedMinutes: r.estimated_minutes,
            projectId: r.project_id,
            isActive: r.is_active,
          })
        )
      );
    }

    if (allocRes.data) {
      const mappedAllocations: Allocation[] = allocRes.data.map(
        (a: SupabaseAllocation): Allocation => ({
          id: a.id,
          employeeId: a.employee_id,
          projectId: a.project_id,
          weekStartDate: a.week_start_date,
          hoursAssigned: round2(a.hours_assigned),
          hoursActual: a.hours_actual ? round2(a.hours_actual) : undefined,
          hoursComputed: a.hours_computed ? round2(a.hours_computed) : undefined,
          status: (a.status || 'planned') as 'planned' | 'completed' | 'active',
          description: a.description,
          taskName: a.task_name,
          dependencyId: a.dependency_id,
          transferredFromAllocationId: a.transferred_from_allocation_id,
          distributionSourceAllocationId: a.distribution_source_allocation_id,
          parentAllocationId: a.parent_allocation_id,
          originalTransferredTaskName: a.original_transferred_task_name,
          transferSourceEmployeeId: a.transfer_source_employee_id,
          userPriority: a.user_priority ?? null,
          focusDate: a.focus_date ?? null,
          isLocked: a.is_locked ?? false,
        })
      );

      if (skipLoading) {
        setAllocations(prev => {
          const incomingMap = new Map(mappedAllocations.map(a => [a.id, a]));
          const updatedPrev = prev.map(existing =>
            incomingMap.has(existing.id) ? incomingMap.get(existing.id)! : existing
          );
          const prevIds = new Set(prev.map(a => a.id));
          const newItems = mappedAllocations.filter(a => !prevIds.has(a.id));
          return [...updatedPrev, ...newItems];
        });
      } else {
        setAllocations(mappedAllocations);
      }
    }

    if (absRes.data) {
      setAbsences(
        absRes.data.map(
          (ab: SupabaseAbsence): Absence => ({
            id: ab.id,
            employeeId: ab.employee_id,
            startDate: ab.start_date,
            endDate: ab.end_date,
            type: (ab.type || 'other') as 'vacation' | 'sick_leave' | 'personal' | 'other',
            description: ab.description,
            hours: ab.hours,
          })
        )
      );
    }

    if (evRes.data) {
      setTeamEvents(
        evRes.data.map(
          (te: SupabaseTeamEvent): TeamEvent => ({
            id: te.id,
            name: te.name,
            date: te.date,
            hoursReduction: te.hours_reduction,
            affectedEmployeeIds: te.affected_employee_ids,
          })
        )
      );
    }

    if (feedbackRes.data) {
      setWeeklyFeedback(
        feedbackRes.data.map(
          (fb: SupabaseWeeklyFeedback): WeeklyFeedback => ({
            id: fb.id,
            employeeId: fb.employee_id,
            weekStartDate: fb.week_start_date,
            projectId: fb.project_id,
            allocationId: fb.allocation_id,
            reason: fb.reason as WeeklyFeedback['reason'],
            comments: fb.comments,
            createdAt: fb.created_at,
          })
        )
      );
    }

    setIsSecondaryLoading(false);
  } catch (error) {
    console.error('Error cargando datos:', error);
    const errorMessage =
      (error as Error)?.message || 'Error al cargar los datos. Por favor, recarga la página.';
    toast.error(errorMessage);
    setIsLoading(false);
    setIsSecondaryLoading(false);
  }
}

/**
 * Ausencias que solapan el rango de calendario [rangeStart, rangeEnd] (cualquier día).
 * Usar en exports multi‑mes: evita depender del merge en memoria tras varios `refetchMonthData`
 * y asegura tramos que **cruzan límites de mes** (p. ej. vacaciones 28 mar – 4 abr).
 */
export async function fetchAbsencesOverlappingRange(
  agencyId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<{ data: Absence[]; error: Error | null }> {
  const startStr = format(startOfMonth(rangeStart), 'yyyy-MM-dd');
  const endStr = format(endOfMonth(rangeEnd), 'yyyy-MM-dd');
  try {
    const { data, error } = await supabase
      .from('absences')
      .select('*, employees!inner(agency_id)')
      .eq('employees.agency_id', agencyId)
      .lte('start_date', endStr)
      .gte('end_date', startStr);

    if (error) return { data: [], error: new Error(error.message) };

    const mapped: Absence[] = (data ?? []).map((a: SupabaseAbsence) => ({
      id: a.id,
      employeeId: a.employee_id,
      startDate: a.start_date,
      endDate: a.end_date,
      type: (a.type || 'other') as Absence['type'],
      description: a.description,
      hours: a.hours,
    }));
    return { data: mapped, error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export interface LoadMonthDataDeps {
  agencyId: string;
  month: Date;
  setAllocations: (value: Allocation[] | ((prev: Allocation[]) => Allocation[])) => void;
  setAbsences: (value: Absence[] | ((prev: Absence[]) => Absence[])) => void;
  setTeamEvents: (value: TeamEvent[] | ((prev: TeamEvent[]) => TeamEvent[])) => void;
  setWeeklyFeedback: (value: WeeklyFeedback[] | ((prev: WeeklyFeedback[]) => WeeklyFeedback[])) => void;
}

export async function loadMonthData({
  agencyId,
  month,
  setAllocations,
  setAbsences,
  setTeamEvents,
  setWeeklyFeedback,
}: LoadMonthDataDeps): Promise<boolean> {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const weeks = getWeeksForMonth(month);
  const weekStartDates = weeks.map(w => format(w.weekStart, 'yyyy-MM-dd'));
  const minWeekStart =
    weekStartDates.length > 0 ? weekStartDates[0] : format(monthStart, 'yyyy-MM-dd');
  const maxWeekStart =
    weekStartDates.length > 0
      ? weekStartDates[weekStartDates.length - 1]
      : format(monthEnd, 'yyyy-MM-dd');
  /** Incluir el lunes ISO de la semana que contiene el día 1 (filas legacy con week_start del mes anterior). */
  const isoMondayOfMonth = format(startOfWeek(monthStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const minFetchWeek = [minWeekStart, isoMondayOfMonth].sort()[0];

  try {
    const startStr = format(monthStart, 'yyyy-MM-dd');
    const endStr = format(monthEnd, 'yyyy-MM-dd');

    const [allocRes, absRes, evRes, feedRes] = await Promise.all([
      supabase
        .from('allocations')
        .select('*, employees!allocations_employee_id_fkey!inner(agency_id)')
        .eq('employees.agency_id', agencyId)
        .gte('week_start_date', minFetchWeek)
        .lte('week_start_date', maxWeekStart),
      supabase
        .from('absences')
        .select('*, employees!inner(agency_id)')
        .eq('employees.agency_id', agencyId)
        .lte('start_date', endStr)
        .gte('end_date', startStr),
      supabase
        .from('team_events')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('date', startStr)
        .lte('date', endStr),
      supabase
        .from('weekly_feedback')
        .select('*, employees!inner(agency_id)')
        .eq('employees.agency_id', agencyId)
        .gte('week_start_date', minFetchWeek)
        .lte('week_start_date', maxWeekStart),
    ]);

    if (allocRes.error) {
      console.error('Error cargando allocations del mes:', allocRes.error);
      return false;
    }
    if (absRes.error) {
      console.error('Error cargando ausencias del mes:', absRes.error);
      return false;
    }
    if (evRes.error) {
      console.error('Error cargando eventos del mes:', evRes.error);
      return false;
    }
    if (feedRes.error) {
      console.error('Error cargando feedback del mes:', feedRes.error);
      return false;
    }

    const allocationRows = allocRes.data ?? [];
    const mappedAllocations: Allocation[] = allocationRows.map(
      (a: SupabaseAllocation): Allocation => ({
        id: a.id,
        employeeId: a.employee_id,
        projectId: a.project_id,
        weekStartDate: a.week_start_date,
        hoursAssigned: round2(a.hours_assigned),
        hoursActual: a.hours_actual ? round2(a.hours_actual) : undefined,
        hoursComputed: a.hours_computed ? round2(a.hours_computed) : undefined,
        status: (a.status || 'planned') as 'planned' | 'completed' | 'active',
        description: a.description,
        taskName: a.task_name,
        dependencyId: a.dependency_id,
        transferredFromAllocationId: a.transferred_from_allocation_id,
        distributionSourceAllocationId: a.distribution_source_allocation_id,
        parentAllocationId: a.parent_allocation_id,
        originalTransferredTaskName: a.original_transferred_task_name,
        transferSourceEmployeeId: a.transfer_source_employee_id,
        userPriority: a.user_priority ?? null,
        focusDate: a.focus_date ?? null,
        isLocked: a.is_locked ?? false,
      })
    );

    setAllocations(prev => {
      const incomingMap = new Map(mappedAllocations.map(a => [a.id, a]));
      const updatedPrev = prev.map(existing =>
        incomingMap.has(existing.id) ? incomingMap.get(existing.id)! : existing
      );
      const prevIds = new Set(prev.map(a => a.id));
      const newItems = mappedAllocations.filter(
        a => !prevIds.has(a.id) && isAllocationInEffectiveMonth(a.weekStartDate, month)
      );
      return [...updatedPrev, ...newItems];
    });

    if (absRes.data) {
      const mappedAbsences: Absence[] = absRes.data.map(
        (a: SupabaseAbsence): Absence => ({
          id: a.id,
          employeeId: a.employee_id,
          startDate: a.start_date,
          endDate: a.end_date,
          type: (a.type || 'other') as 'vacation' | 'sick_leave' | 'personal' | 'other',
          description: a.description,
          hours: a.hours,
        })
      );

      setAbsences(prev => {
        const incomingMap = new Map(mappedAbsences.map(a => [a.id, a]));
        const updatedPrev = prev.map(existing =>
          incomingMap.has(existing.id) ? incomingMap.get(existing.id)! : existing
        );
        const prevIds = new Set(prev.map(a => a.id));
        const newItems = mappedAbsences.filter(a => !prevIds.has(a.id));
        return [...updatedPrev, ...newItems];
      });
    }

    if (evRes.data) {
      const mappedEvents: TeamEvent[] = evRes.data.map(
        (e: SupabaseTeamEvent): TeamEvent => ({
          id: e.id,
          name: e.name,
          date: e.date,
          hoursReduction: e.hours_reduction,
          affectedEmployeeIds: e.affected_employee_ids,
        })
      );

      setTeamEvents(prev => {
        const incomingMap = new Map(mappedEvents.map(e => [e.id, e]));
        const updatedPrev = prev.map(existing =>
          incomingMap.has(existing.id) ? incomingMap.get(existing.id)! : existing
        );
        const prevIds = new Set(prev.map(e => e.id));
        const newItems = mappedEvents.filter(e => !prevIds.has(e.id));
        return [...updatedPrev, ...newItems];
      });
    }

    if (feedRes.data && feedRes.data.length > 0) {
      const mappedFeedback: WeeklyFeedback[] = feedRes.data.map(
        (fb: SupabaseWeeklyFeedback): WeeklyFeedback => ({
          id: fb.id,
          employeeId: fb.employee_id,
          weekStartDate: fb.week_start_date,
          projectId: fb.project_id,
          allocationId: fb.allocation_id,
          reason: fb.reason as WeeklyFeedback['reason'],
          comments: fb.comments,
          createdAt: fb.created_at,
        })
      );

      setWeeklyFeedback(prev => {
        const incomingMap = new Map(mappedFeedback.map(f => [f.id, f]));
        const updatedPrev = prev.map(existing =>
          incomingMap.has(existing.id) ? incomingMap.get(existing.id)! : existing
        );
        const prevIds = new Set(prev.map(f => f.id));
        const newItems = mappedFeedback.filter(f => !prevIds.has(f.id));
        return [...updatedPrev, ...newItems];
      });
    }
    return true;
  } catch (error) {
    console.error('Error cargando datos del mes:', error);
    return false;
  }
}

