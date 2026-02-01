import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Employee, Client, Project, Allocation, LoadStatus, Absence, TeamEvent, WeeklyFeedback, EmployeeRole, WorkSchedule, UserRoutine, TaskTransfer } from '@/types';
import { getWorkingDaysInRange, getMonthlyCapacity, getWeeksForMonth, getStorageKey, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getTeamEventHoursInRange, getTeamEventDetailsInRange } from '@/utils/teamEventUtils';
import { getCapacityReductionBreakdown } from '@/utils/capacityUtils';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import { toast } from 'sonner';
import { logCreate, logUpdate, logDelete } from '@/services/auditService';

// Tipos para respuestas de Supabase (snake_case)
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
  is_hidden?: boolean;
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

interface AppContextType {
  currentUser: Employee | undefined;
  isAdmin: boolean;
  employees: Employee[];
  clients: Client[];
  projects: Project[];
  allocations: Allocation[];
  absences: Absence[];
  teamEvents: TeamEvent[];
  weeklyFeedback: WeeklyFeedback[];
  isLoading: boolean;
  isSecondaryLoading: boolean;
  fetchArchivedProjects: () => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  toggleEmployeeActive: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addAllocation: (allocation: Omit<Allocation, 'id'>) => Promise<Allocation | null>;
  updateAllocation: (allocation: Allocation) => void;
  deleteAllocation: (id: string) => void;
  addAbsence: (absence: Omit<Absence, 'id'>) => void;
  deleteAbsence: (id: string) => void;
  addTeamEvent: (event: Omit<TeamEvent, 'id'>) => void;
  updateTeamEvent: (event: TeamEvent) => void;
  deleteTeamEvent: (id: string) => void;
  getEmployeeAllocationsForWeek: (employeeId: string, weekStart: string) => Allocation[];
  getEmployeeLoadForWeek: (employeeId: string, weekStart: string, effectiveStart?: Date, effectiveEnd?: Date, viewMonth?: Date) => { hours: number; capacity: number; baseCapacity: number; status: LoadStatus; percentage: number; breakdown: { reason: string; hours: number; type: 'absence' | 'event' }[] };
  getEmployeeMonthlyLoad: (employeeId: string, year: number, month: number) => { hours: number; capacity: number; status: LoadStatus; percentage: number };
  getProjectHoursForMonth: (projectId: string, month: Date) => { used: number; budget: number; available: number; percentage: number };
  getClientTotalHoursForMonth: (clientId: string, month: Date) => { used: number; budget: number; percentage: number };
  getProjectById: (id: string) => Project | undefined;
  getClientById: (id: string) => Client | undefined;
  loadDataForMonth: (month: Date) => Promise<boolean>;
  ensureMonthLoaded: (date: Date) => Promise<void>;
  addWeeklyFeedback: (feedback: Omit<WeeklyFeedback, 'id' | 'createdAt'>) => void;
  refreshData: (skipLoading?: boolean) => Promise<void>;
  userRoutines: UserRoutine[];
  addRoutine: (routine: Omit<UserRoutine, 'id'>) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  toggleRoutine: (id: string) => Promise<void>;

  // Transfers (Global State)
  pendingTransfers: TaskTransfer[];
  outgoingTransfers: TaskTransfer[];
  fetchTransfers: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isInitialized: isAuthInitialized } = useAuth();
  const { currentAgency, isLoading: isAgencyLoading } = useAgency();
  const [currentUser, setCurrentUser] = useState<Employee | undefined>(undefined);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([]);
  const [weeklyFeedback, setWeeklyFeedback] = useState<WeeklyFeedback[]>([]);
  const [userRoutines, setUserRoutines] = useState<UserRoutine[]>([]);
  // Transfers State
  const [pendingTransfers, setPendingTransfers] = useState<TaskTransfer[]>([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState<TaskTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSecondaryLoading, setIsSecondaryLoading] = useState(true);

  // Ref para evitar vinculaciones duplicadas - DEBE estar ANTES de los useEffects
  const hasLinkedUserRef = useRef<string | null>(null);
  // Ref para acceder a employees sin trigger re-renders
  const employeesRef = useRef<Employee[]>([]);
  // Ref para trackear meses cargados globalmente (centralizado)
  const loadedMonthsRef = useRef<Set<string>>(new Set());
  // Ref para trackear la agencia anterior y detectar cambios
  const prevAgencyIdRef = useRef<string | null>(null);

  const fetchData = useCallback(async (skipLoading = false, dateRange?: { start: Date; end: Date }) => {
    // No cargar datos si no hay agencia seleccionada
    if (!currentAgency?.id) {
      setIsLoading(false);
      return;
    }

    if (!skipLoading) {
      setIsLoading(true);
    }
    try {
      // Calcular rango de fechas: solo mes actual (otros meses se cargan bajo demanda via ensureMonthLoaded)
      const today = new Date();
      const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startDate = dateRange?.start || defaultStart;
      const endDate = dateRange?.end || defaultEnd;

      // Formatear fechas para Supabase (YYYY-MM-DD)
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      const agencyId = currentAgency.id;

      // ============================================================
      // PHASE 1: Critical data (blocks UI) - employees, clients, active projects
      // ============================================================
      const [empRes, cliRes, projRes] = await Promise.all([
        supabase.from('employees').select('*').eq('agency_id', agencyId),
        supabase.from('clients').select('*').eq('agency_id', agencyId),
        // OPTIMIZATION: Only load active projects initially
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
          workSchedule: (e.work_schedule || { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 }) as WorkSchedule,
          isActive: e.is_active,
          first_name: e.first_name,
          last_name: e.last_name,
          email: e.email,
          user_id: e.user_id,
          department: e.department,
          hourlyRate: e.hourly_rate || 0,
          crmUserId: e.crm_user_id,
          welcomeTourCompleted: e.welcome_tour_completed === true,
          deadlinesTourCompleted: e.deadlines_tour_completed === true,
          plannerTourCompleted: e.planner_tour_completed === true,
          permissions: e.permissions || undefined,
          preferredView: e.preferred_view || null
        }));
        setEmployees(mappedEmployees);
        employeesRef.current = mappedEmployees; // Actualizar ref
      }

      if (cliRes.data) {
        setClients(cliRes.data.map((c: SupabaseClient): Client => ({
          id: c.id,
          agencyId: c.agency_id,
          name: c.name,
          color: c.color
        })));
      }
      if (projRes.data) {
        setProjects(projRes.data.map((p: SupabaseProject): Project => ({
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
          isHidden: p.is_hidden || false,
          okrs: p.okrs,
          deliverables_log: p.deliverables_log
        })));
      }

      // Release critical loading state - UI can now render with employees, clients, projects
      if (!skipLoading) {
        setIsLoading(false);
      }

      // ============================================================
      // PHASE 2: Secondary data (background, non-blocking)
      // ============================================================
      setIsSecondaryLoading(true);
      const [allocRes, absRes, evRes, feedbackRes, routinesRes] = await Promise.all([
        // Allocations: filtrar por week_start_date y employee de la agencia
        supabase.from('allocations')
          .select('*, employees!allocations_employee_id_fkey!inner(agency_id)')
          .eq('employees.agency_id', agencyId)
          .gte('week_start_date', startStr)
          .lte('week_start_date', endStr),
        // Absences: filtrar por rango de fechas y employee de la agencia
        supabase.from('absences')
          .select('*, employees!inner(agency_id)')
          .eq('employees.agency_id', agencyId)
          .lte('start_date', endStr)
          .gte('end_date', startStr),
        // Team events: filtrar por date
        supabase.from('team_events')
          .select('*')
          .gte('date', startStr)
          .lte('date', endStr),
        supabase.from('weekly_feedback')
          .select('*, employees!inner(agency_id)')
          .eq('employees.agency_id', agencyId)
          .gte('week_start_date', startStr)
          .lte('week_start_date', endStr),
        // Cargar rutinas (solo si hay usuario logueado, idealmente filtrar por usuario pero por ahora cargamos y filtramos en UI o RLS filtra solo)
        supabase.from('user_routines').select('*')
      ]);

      if (allocRes.error) console.error('Error fetching allocations:', allocRes.error);
      if (absRes.error) console.error('Error fetching absences:', absRes.error);
      if (evRes.error) console.error('Error fetching events:', evRes.error);
      if (feedbackRes.error) console.error('Error fetching feedback:', feedbackRes.error);
      if (routinesRes.error) console.error('Error fetching user routines:', routinesRes.error);

      if (feedbackRes.data) {
        // Mapeo feedback...
      }

      if (routinesRes.data) {
        setUserRoutines(routinesRes.data.map((r: SupabaseUserRoutine) => ({
          id: r.id,
          employeeId: r.employee_id,
          title: r.title,
          estimatedMinutes: r.estimated_minutes,
          projectId: r.project_id,
          isActive: r.is_active
        })));
      }
      if (allocRes.data) {
        const mappedAllocations: Allocation[] = allocRes.data.map((a: SupabaseAllocation): Allocation => ({
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
          userPriority: a.user_priority ?? null
        }));

        // Si skipLoading es true, significa que estamos cargando datos adicionales (merge con upsert)
        // Si no, reemplazamos todos los datos
        if (skipLoading) {
          setAllocations(prev => {
            // UPSERT: Actualizar existentes y añadir nuevos
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
        setAbsences(absRes.data.map((ab: SupabaseAbsence): Absence => ({
          id: ab.id,
          employeeId: ab.employee_id,
          startDate: ab.start_date,
          endDate: ab.end_date,
          type: (ab.type || 'other') as 'vacation' | 'sick_leave' | 'personal' | 'other',
          description: ab.description,
          hours: ab.hours
        })));
      }
      if (evRes.data) {
        setTeamEvents(evRes.data.map((te: SupabaseTeamEvent): TeamEvent => ({
          id: te.id,
          name: te.name,
          date: te.date,
          hoursReduction: te.hours_reduction,
          affectedEmployeeIds: te.affected_employee_ids
        })));
      }
      if (feedbackRes.data) {
        setWeeklyFeedback(feedbackRes.data.map((fb: SupabaseWeeklyFeedback): WeeklyFeedback => ({
          id: fb.id,
          employeeId: fb.employee_id,
          weekStartDate: fb.week_start_date,
          projectId: fb.project_id,
          allocationId: fb.allocation_id,
          reason: fb.reason as WeeklyFeedback['reason'],
          comments: fb.comments,
          createdAt: fb.created_at
        })));
      }
      setIsSecondaryLoading(false);
    } catch (error) {
      console.error("Error cargando datos:", error);
      const errorMessage = (error as Error)?.message || "Error al cargar los datos. Por favor, recarga la página.";
      toast.error(errorMessage);
      setIsLoading(false);
      setIsSecondaryLoading(false);
    }
  }, [currentAgency?.id]);

  // Función para cargar datos de un mes específico (merge con datos existentes)
  const loadDataForMonth = useCallback(async (month: Date): Promise<boolean> => {
    // No cargar si no hay agencia
    if (!currentAgency?.id) return false;

    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    let dataFound = false;

    // Calcular el rango de semanas que pueden tener días en este mes (incluyendo semanas que cruzan)
    const weeks = getWeeksForMonth(month);
    const weekStartDates = weeks.map(w => format(w.weekStart, 'yyyy-MM-dd'));
    const minWeekStart = weekStartDates.length > 0 ? weekStartDates[0] : format(monthStart, 'yyyy-MM-dd');
    const maxWeekStart = weekStartDates.length > 0 ? weekStartDates[weekStartDates.length - 1] : format(monthEnd, 'yyyy-MM-dd');

    const agencyId = currentAgency.id;

    // Cargar solo allocations, absences, team_events y weekly_feedback para este mes (merge)
    try {
      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');

      const [allocRes, absRes, evRes, feedRes] = await Promise.all([
        supabase.from('allocations')
          .select('*, employees!allocations_employee_id_fkey!inner(agency_id)')
          .eq('employees.agency_id', agencyId)
          .gte('week_start_date', minWeekStart)
          .lte('week_start_date', maxWeekStart),
        supabase.from('absences')
          .select('*, employees!inner(agency_id)')
          .eq('employees.agency_id', agencyId)
          .lte('start_date', endStr)
          .gte('end_date', startStr),
        supabase.from('team_events')
          .select('*')
          .gte('date', startStr)
          .lte('date', endStr),
        supabase.from('weekly_feedback')
          .select('*, employees!inner(agency_id)')
          .eq('employees.agency_id', agencyId)
          .gte('week_start_date', minWeekStart)
          .lte('week_start_date', maxWeekStart),
      ]);

      if (allocRes.data) {
        const mappedAllocations: Allocation[] = allocRes.data.map((a: SupabaseAllocation): Allocation => ({
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
          userPriority: a.user_priority ?? null
        }));

        setAllocations(prev => {
          // UPSERT: Actualizar existentes y añadir nuevos
          const incomingMap = new Map(mappedAllocations.map(a => [a.id, a]));
          const updatedPrev = prev.map(existing =>
            incomingMap.has(existing.id) ? incomingMap.get(existing.id)! : existing
          );
          const prevIds = new Set(prev.map(a => a.id));
          // Filtrar por mes efectivo antes de añadir nuevos
          const newItems = mappedAllocations.filter(a =>
            !prevIds.has(a.id) && isAllocationInEffectiveMonth(a.weekStartDate, month)
          );
          return [...updatedPrev, ...newItems];
        });
      }

      if (absRes.data) {
        const mappedAbsences: Absence[] = absRes.data.map((a: SupabaseAbsence): Absence => ({
          id: a.id,
          employeeId: a.employee_id,
          startDate: a.start_date,
          endDate: a.end_date,
          type: (a.type || 'other') as 'vacation' | 'sick_leave' | 'personal' | 'other',
          description: a.description,
          hours: a.hours
        }));

        setAbsences(prev => {
          // UPSERT: Actualizar existentes y añadir nuevos
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
        const mappedEvents: TeamEvent[] = evRes.data.map((e: SupabaseTeamEvent): TeamEvent => ({
          id: e.id,
          name: e.name,
          date: e.date,
          hoursReduction: e.hours_reduction,
          affectedEmployeeIds: e.affected_employee_ids
        }));

        setTeamEvents(prev => {
          // UPSERT: Actualizar existentes y añadir nuevos
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
        dataFound = true;
        const mappedFeedback: WeeklyFeedback[] = feedRes.data.map((fb: SupabaseWeeklyFeedback): WeeklyFeedback => ({
          id: fb.id,
          employeeId: fb.employee_id,
          weekStartDate: fb.week_start_date,
          projectId: fb.project_id,
          allocationId: fb.allocation_id,
          reason: fb.reason as WeeklyFeedback['reason'],
          comments: fb.comments,
          createdAt: fb.created_at
        }));

        setWeeklyFeedback(prev => {
          // UPSERT: Actualizar existentes y añadir nuevos
          const incomingMap = new Map(mappedFeedback.map(f => [f.id, f]));
          const updatedPrev = prev.map(existing =>
            incomingMap.has(existing.id) ? incomingMap.get(existing.id)! : existing
          );
          const prevIds = new Set(prev.map(f => f.id));
          const newItems = mappedFeedback.filter(f => !prevIds.has(f.id));
          return [...updatedPrev, ...newItems];
        });
      }
    } catch (error) {
      console.error("Error cargando datos del mes:", error);
    }

    return dataFound;
  }, [currentAgency?.id]);

  // Función centralizada para asegurar que un mes está cargado (evita peticiones duplicadas)
  const ensureMonthLoaded = useCallback(async (date: Date) => {
    const monthKey = format(date, 'yyyy-MM');

    if (loadedMonthsRef.current.has(monthKey)) {
      return; // Ya lo tenemos, no hacemos nada (Caché hit!)
    }

    // Si no está, cargamos
    const success = await loadDataForMonth(date);
    if (success !== false) {
      loadedMonthsRef.current.add(monthKey);
    }
  }, [loadDataForMonth]);

  // Función para cargar proyectos archivados/completados bajo demanda
  const fetchArchivedProjects = useCallback(async () => {
    if (!currentAgency?.id) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('agency_id', currentAgency.id)
      .neq('status', 'active');

    if (error) {
      console.error('Error cargando proyectos archivados:', error);
      return;
    }

    if (data) {
      const mappedProjects = data.map((p: SupabaseProject): Project => ({
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
        isHidden: p.is_hidden || false,
        okrs: p.okrs,
        deliverables_log: p.deliverables_log
      }));

      setProjects(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProjects = mappedProjects.filter((p: Project) => !existingIds.has(p.id));
        return [...prev, ...newProjects];
      });
    }
  }, [currentAgency?.id]);

  // Cargar datos cuando la autenticación y la agencia estén listas
  useEffect(() => {
    if (isAuthInitialized && !isAgencyLoading && currentAgency?.id) {
      // Detectar si cambió la agencia (no es la misma que antes)
      const agencyChanged = prevAgencyIdRef.current !== null &&
        prevAgencyIdRef.current !== currentAgency.id;

      if (agencyChanged) {
        // Limpiar todo el estado antes de cargar datos nuevos
        console.debug('[AppContext] Agencia cambió, limpiando estado...');
        setEmployees([]);
        setClients([]);
        setProjects([]);
        setAllocations([]);
        setAbsences([]);
        setTeamEvents([]);
        setWeeklyFeedback([]);
        setUserRoutines([]);
        setCurrentUser(undefined);
        hasLinkedUserRef.current = null;
        loadedMonthsRef.current.clear(); // Limpiar caché de meses cargados
        employeesRef.current = [];
      }

      // Actualizar ref con la agencia actual
      prevAgencyIdRef.current = currentAgency.id;

      fetchData();
    }
  }, [isAuthInitialized, isAgencyLoading, currentAgency?.id, fetchData]);

  // ============================================================
  // REALTIME: Subscribe to allocation changes for live updates
  // ============================================================
  useEffect(() => {
    if (!currentAgency?.id) return;

    const channel = supabase
      .channel(`allocations-realtime-${currentAgency.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'allocations'
        },
        (payload) => {
          // Helper to map Supabase row to Allocation type
          const mapAllocation = (row: SupabaseAllocation): Allocation => ({
            id: row.id,
            employeeId: row.employee_id,
            projectId: row.project_id,
            weekStartDate: row.week_start_date,
            hoursAssigned: round2(row.hours_assigned),
            hoursActual: row.hours_actual ? round2(row.hours_actual) : undefined,
            hoursComputed: row.hours_computed ? round2(row.hours_computed) : undefined,
            status: (row.status || 'planned') as 'planned' | 'completed' | 'active',
            description: row.description,
            taskName: row.task_name,
            dependencyId: row.dependency_id,
            transferredFromAllocationId: row.transferred_from_allocation_id,
            distributionSourceAllocationId: row.distribution_source_allocation_id,
            parentAllocationId: row.parent_allocation_id,
            originalTransferredTaskName: row.original_transferred_task_name,
            transferSourceEmployeeId: row.transfer_source_employee_id,
            userPriority: row.user_priority ?? null
          });

          if (payload.eventType === 'INSERT') {
            const newAllocation = mapAllocation(payload.new as SupabaseAllocation);
            setAllocations(prev => {
              // Only add if not already present (avoid duplicates from local updates)
              if (prev.some(a => a.id === newAllocation.id)) return prev;
              return [...prev, newAllocation];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedAllocation = mapAllocation(payload.new as SupabaseAllocation);
            setAllocations(prev =>
              prev.map(a => a.id === updatedAllocation.id ? updatedAllocation : a)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setAllocations(prev => prev.filter(a => a.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or agency change
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAgency?.id]);

  // Reaccionar a cambios de usuario (login/logout) - SOLO cuando employees esté cargado
  useEffect(() => {
    // No hacer nada si auth no está inicializado
    if (!isAuthInitialized) return;

    // No hacer nada si aún estamos cargando datos iniciales
    if (isLoading) return;

    // No hacer nada si employees aún no se ha cargado (usar ref para evitar dependencia)
    if (employeesRef.current.length === 0) return;

    if (authUser) {
      // Evitar vincular múltiples veces al mismo usuario
      if (hasLinkedUserRef.current === authUser.id) {
        return;
      }

      // Buscar empleado por user_id o por email (usar ref para evitar dependencia)
      const foundEmployee = employeesRef.current.find(e =>
        e.user_id === authUser.id ||
        (e.email && authUser.email && e.email.toLowerCase() === authUser.email.toLowerCase())
      );

      if (foundEmployee) {
        // Marcar como vinculado INMEDIATAMENTE (antes de cualquier setState)
        hasLinkedUserRef.current = authUser.id;

        // Si el empleado no tiene user_id pero el email coincide, vincular automáticamente
        if (!foundEmployee.user_id && authUser.id) {
          // Vinculando empleado existente con usuario Auth

          // Actualizar currentUser PRIMERO (optimistic update)
          const updatedEmployee = { ...foundEmployee, user_id: authUser.id };
          setCurrentUser(updatedEmployee);

          // Luego persistir en BD (sin actualizar employees para evitar re-trigger)
          supabase
            .from('employees')
            .update({ user_id: authUser.id })
            .eq('id', foundEmployee.id)
            .then(({ error }) => {
              if (error) {
                console.error('[AppContext] Error actualizando user_id:', error);
                toast.error('Error al vincular empleado con usuario. Por favor, contacta al administrador.');
              }
              // NO llamar a setEmployees aquí para evitar re-trigger del useEffect
            });
        } else {
          // Empleado encontrado para usuario autenticado
          setCurrentUser(foundEmployee);
        }
      } else {
        console.warn('[AppContext] No se encontró empleado para usuario Auth:', authUser.email);
        setCurrentUser(undefined);
      }
    } else {
      // Usuario deslogueado - resetear
      hasLinkedUserRef.current = null;
      setCurrentUser(undefined);
    }
    // Usamos employeesRef para acceder al valor actual sin trigger re-renders
    // El efecto se ejecutará cuando authUser cambie o cuando isLoading pase de true a false
  }, [authUser, isAuthInitialized, isLoading]);

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id'>) => {
    if (!currentAgency?.id) {
      toast.error('No hay agencia seleccionada');
      throw new Error('No agency selected');
    }

    const { data, error } = await supabase.from('employees').insert({
      agency_id: employee.agencyId || currentAgency.id,
      name: employee.name,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      user_id: employee.user_id,
      role: employee.role,
      department: employee.department,
      avatar_url: employee.avatarUrl,
      default_weekly_capacity: employee.defaultWeeklyCapacity,
      work_schedule: employee.workSchedule,
      is_active: employee.isActive,
      hourly_rate: employee.hourlyRate || 0,
      crm_user_id: employee.crmUserId
    }).select().single();

    if (error) {
      console.error('Error creando empleado:', error);
      const errorMessage = error.message || 'Error al crear el empleado';
      toast.error(errorMessage);
      throw error;
    }

    if (data) {
      const mappedEmployee: Employee = {
        ...data,
        agencyId: data.agency_id,
        avatarUrl: data.avatar_url,
        defaultWeeklyCapacity: data.default_weekly_capacity,
        workSchedule: data.work_schedule,
        isActive: data.is_active,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        user_id: data.user_id,
        hourlyRate: data.hourly_rate || 0,
        crmUserId: data.crm_user_id,
        welcomeTourCompleted: data.welcome_tour_completed === true,
        deadlinesTourCompleted: data.deadlines_tour_completed === true,
        plannerTourCompleted: data.planner_tour_completed === true
      };
      setEmployees(prev => [...prev, mappedEmployee]);
    }
  }, [currentAgency?.id]);

  const updateEmployee = useCallback(async (employee: Employee) => {
    // 1. Actualización optimista del estado local
    setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));

    // 2. Actualizar en Base de Datos (Employees table)
    const { error } = await supabase.from('employees').update({
      name: employee.name,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      user_id: employee.user_id,
      role: employee.role,
      department: employee.department,
      avatar_url: employee.avatarUrl,
      default_weekly_capacity: employee.defaultWeeklyCapacity,
      work_schedule: employee.workSchedule,
      is_active: employee.isActive,
      hourly_rate: employee.hourlyRate || 0,
      crm_user_id: employee.crmUserId,
      welcome_tour_completed: employee.welcomeTourCompleted || false,
      deadlines_tour_completed: employee.deadlinesTourCompleted || false,
      planner_tour_completed: employee.plannerTourCompleted || false,
      preferred_view: employee.preferredView || null
    }).eq('id', employee.id);

    if (error) {
      console.error('Error actualizando empleado:', error);
      const errorMessage = error.message || 'Error al actualizar el empleado';
      toast.error(errorMessage);
      // Revertir estado optimista si falla? Por ahora no, para no complicar UX
      throw error;
    }

    // 3. Sincronizar con Supabase Auth (si tiene usuario vinculado y hay cambio de email)
    // Nota: update-user también maneja contraseñas, pero aquí solo tenemos email.
    if (employee.user_id && employee.email) {
      try {
        const { error: fnError } = await supabase.functions.invoke('update-user', {
          body: {
            userId: employee.user_id,
            email: employee.email
          }
        });

        if (fnError) {
          console.error('Error sincronizando Auth (update-user):', fnError);
          toast.warning('Empleado actualizado, pero hubo un error sincronizando el email de acceso.');
        }
      } catch (err) {
        console.error('Error invocando update-user:', err);
      }
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    // Buscar empleado antes de borrarlo para obtener su user_id
    // Usamos el estado actual 'employees' (closure) o el ref si queremos ser muy seguros, 
    // pero useEffect dependencies aseguran 'employees' actualizado? 
    // No, deleteEmployee dependencies es [], así que 'employees' dentro podría ser stale si no usamos callback en setState
    // MEJOR: Buscar en el ref que mantenemos actualizado
    const employeeToDelete = employeesRef.current.find(e => e.id === id);

    // 1. Actualización optimista UI
    setEmployees(prev => prev.filter(e => e.id !== id));
    setAllocations(prev => prev.filter(a => a.employeeId !== id));
    setAbsences(prev => prev.filter(a => a.employeeId !== id));

    // 2. Borrar de la tabla employees
    const { error } = await supabase.from('employees').delete().eq('id', id);

    if (error) {
      console.error('Error eliminando empleado de BD:', error);
      toast.error('Error eliminando empleado');
      // Podríamos revertir el estado aquí si fuera crítico
      return;
    }

    // 3. Borrar de Auth (si tiene user_id)
    if (employeeToDelete?.user_id) {
      // Eliminar usuario Auth asociado
      try {
        const { error: fnError } = await supabase.functions.invoke('delete-user', {
          body: { userId: employeeToDelete.user_id }
        });

        if (fnError) {
          console.error('Error eliminando usuario Auth (invoke):', fnError);
          toast.warning('Empleado eliminado, pero el usuario de acceso podría seguir activo (error de sincronización).');
        } else {
          // Usuario Auth eliminado correctamente
        }
      } catch (err) {
        console.error('Error invocando delete-user:', err);
      }
    }
  }, []);

  const toggleEmployeeActive = useCallback(async (id: string) => {
    let newState: boolean | null = null;

    setEmployees(prev => {
      const emp = prev.find(e => e.id === id);
      if (!emp) return prev;
      newState = !emp.isActive;
      // Actualizar ref también para consistency inmediata
      const updated = prev.map(e => e.id === id ? { ...e, isActive: newState! } : e);
      employeesRef.current = updated;
      return updated;
    });

    if (newState !== null) {
      await supabase.from('employees').update({ is_active: newState }).eq('id', id);
    }
  }, []);

  // --- ALLOCATIONS ---
  const addAllocation = useCallback(async (allocation: Omit<Allocation, 'id'>): Promise<Allocation | null> => {
    const { data, error } = await supabase.from('allocations').insert({
      employee_id: allocation.employeeId,
      project_id: allocation.projectId,
      week_start_date: allocation.weekStartDate,
      hours_assigned: allocation.hoursAssigned,
      hours_actual: allocation.hoursActual || 0,
      hours_computed: allocation.hoursComputed || 0,
      status: allocation.status,
      description: allocation.description,
      task_name: allocation.taskName,
      dependency_id: allocation.dependencyId,
      transferred_from_allocation_id: allocation.transferredFromAllocationId,
      distribution_source_allocation_id: allocation.distributionSourceAllocationId,
      parent_allocation_id: allocation.parentAllocationId,
      original_transferred_task_name: allocation.originalTransferredTaskName,
      transfer_source_employee_id: allocation.transferSourceEmployeeId,
      user_priority: allocation.userPriority
    }).select().single();

    if (error) {
      console.error('SUPABASE ERROR DETAILED:', JSON.stringify(error, null, 2));
      console.error('PAYLOAD WAS:', JSON.stringify(allocation, null, 2));
      toast.error(`Error al guardar: ${error.message} (${error.code})`);
      return null; // Stop execution
    }

    if (data) {
      const mappedAllocation = {
        ...data,
        employeeId: data.employee_id,
        projectId: data.project_id,
        weekStartDate: data.week_start_date,
        hoursAssigned: round2(data.hours_assigned),
        hoursActual: round2(data.hours_actual),
        hoursComputed: round2(data.hours_computed),
        taskName: data.task_name,
        dependencyId: data.dependency_id,
        transferredFromAllocationId: data.transferred_from_allocation_id,
        distributionSourceAllocationId: data.distribution_source_allocation_id,
        parentAllocationId: data.parent_allocation_id,
        originalTransferredTaskName: data.original_transferred_task_name,
        transferSourceEmployeeId: data.transfer_source_employee_id,
        userPriority: data.user_priority
      };
      setAllocations(prev => [...prev, mappedAllocation]);

      // Log audit for allocation creation
      if (currentAgency?.id) {
        logCreate(currentAgency.id, 'ALLOCATION', mappedAllocation.id, mappedAllocation as unknown as Record<string, unknown>);
      }

      return mappedAllocation;
    }
    return null;
  }, [currentAgency?.id]);

  const updateAllocation = useCallback(async (allocation: Allocation) => {
    // Get previous value for audit log and for revert on error
    const previousAllocation = allocations.find(a => a.id === allocation.id);

    // 1. Optimistic update
    setAllocations(prev => prev.map(a => a.id === allocation.id ? allocation : a));

    try {
      const { error } = await supabase.from('allocations').update({
        project_id: allocation.projectId, // IMPORTANTE: incluir project_id para permitir cambio de proyecto
        week_start_date: allocation.weekStartDate,
        hours_assigned: allocation.hoursAssigned,
        hours_actual: allocation.hoursActual,
        hours_computed: allocation.hoursComputed,
        status: allocation.status,
        description: allocation.description,
        task_name: allocation.taskName,
        dependency_id: allocation.dependencyId,
        transferred_from_allocation_id: allocation.transferredFromAllocationId,
        distribution_source_allocation_id: allocation.distributionSourceAllocationId,
        parent_allocation_id: allocation.parentAllocationId,
        original_transferred_task_name: allocation.originalTransferredTaskName,
        transfer_source_employee_id: allocation.transferSourceEmployeeId,
        user_priority: allocation.userPriority
      }).eq('id', allocation.id);

      if (error) {
        throw error;
      }

      // Log audit for allocation update
      if (currentAgency?.id && previousAllocation) {
        logUpdate(
          currentAgency.id,
          'ALLOCATION',
          allocation.id,
          previousAllocation as unknown as Record<string, unknown>,
          allocation as unknown as Record<string, unknown>
        );
      }
    } catch (error) {
      console.error('Error updating allocation:', error);
      toast.error('Error al guardar la tarea. Se han revertido los cambios.');

      // Revert optimistic update
      if (previousAllocation) {
        setAllocations(prev => prev.map(a => a.id === allocation.id ? previousAllocation : a));
      }
    }
  }, [allocations, currentAgency?.id]);

  const deleteAllocation = useCallback(async (id: string) => {
    // Get allocation data for audit log before deleting
    const deletedAllocation = allocations.find(a => a.id === id);

    setAllocations(prev => prev.filter(a => a.id !== id));
    await supabase.from('allocations').delete().eq('id', id);

    // Log audit for allocation deletion
    if (currentAgency?.id) {
      logDelete(
        currentAgency.id,
        'ALLOCATION',
        id,
        deletedAllocation as unknown as Record<string, unknown>
      );
    }
  }, [allocations, currentAgency?.id]);

  // --- CLIENTS ---
  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    if (!currentAgency?.id) {
      toast.error('No hay agencia seleccionada');
      return;
    }

    const { data } = await supabase.from('clients').insert({
      agency_id: client.agencyId || currentAgency.id,
      name: client.name,
      color: client.color
    }).select().single();

    if (data) {
      setClients(prev => [...prev, {
        id: data.id,
        agencyId: data.agency_id,
        name: data.name,
        color: data.color
      }]);
    }
  }, [currentAgency?.id]);

  const updateClient = useCallback(async (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    await supabase.from('clients').update({ name: client.name, color: client.color }).eq('id', client.id);
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    setProjects(prev => prev.filter(p => p.clientId !== id));
    await supabase.from('clients').delete().eq('id', id);
  }, []);

  // --- PROJECTS ---
  const addProject = useCallback(async (project: Omit<Project, 'id'>) => {
    if (!currentAgency?.id) {
      toast.error('No hay agencia seleccionada');
      return;
    }

    const { data } = await supabase.from('projects').insert({
      agency_id: project.agencyId || currentAgency.id,
      client_id: project.clientId,
      name: project.name,
      status: project.status,
      budget_hours: project.budgetHours,
      minimum_hours: project.minimumHours,
      monthly_fee: project.monthlyFee,
      external_id: project.externalId
    }).select().single();

    if (data) {
      setProjects(prev => [...prev, {
        id: data.id,
        agencyId: data.agency_id,
        clientId: data.client_id,
        name: data.name,
        status: (data.status || 'active') as 'active' | 'archived' | 'completed',
        budgetHours: round2(data.budget_hours),
        minimumHours: round2(data.minimum_hours || 0),
        monthlyFee: round2(data.monthly_fee || 0),
        externalId: data.external_id ? Number(data.external_id) : undefined
      }]);
    }
  }, [currentAgency?.id]);

  const updateProject = useCallback(async (project: Project) => {
    setProjects(prev => prev.map(p => p.id === project.id ? project : p));
    await supabase.from('projects').update({
      client_id: project.clientId,
      name: project.name,
      status: project.status,
      budget_hours: project.budgetHours,
      minimum_hours: project.minimumHours,
      monthly_fee: project.monthlyFee,
      okrs: project.okrs,
      deliverables_log: project.deliverables_log,
      external_id: project.externalId,
      project_type: project.projectType,
      is_hidden: project.isHidden || false
    }).eq('id', project.id);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setAllocations(prev => prev.filter(a => a.projectId !== id));
    await supabase.from('projects').delete().eq('id', id);
  }, []);

  // --- ABSENCES ---
  const addAbsence = useCallback(async (absence: Omit<Absence, 'id'>) => {
    const { data } = await supabase.from('absences').insert({
      employee_id: absence.employeeId,
      start_date: absence.startDate,
      end_date: absence.endDate,
      type: absence.type,
      hours: absence.hours,
      description: absence.description
    }).select().single();
    if (data) setAbsences(prev => [...prev, {
      ...data,
      employeeId: data.employee_id,
      startDate: data.start_date,
      endDate: data.end_date,
      hours: data.hours
    }]);
  }, []);

  const deleteAbsence = useCallback(async (id: string) => {
    setAbsences(prev => prev.filter(a => a.id !== id));
    await supabase.from('absences').delete().eq('id', id);
  }, []);

  // --- TEAM EVENTS ---
  const addTeamEvent = useCallback(async (event: Omit<TeamEvent, 'id'>) => {
    const { data } = await supabase.from('team_events').insert({
      name: event.name,
      date: event.date,
      hours_reduction: event.hoursReduction,
      affected_employee_ids: event.affectedEmployeeIds
    }).select().single();
    if (data) setTeamEvents(prev => [...prev, {
      ...data,
      hoursReduction: data.hours_reduction,
      affectedEmployeeIds: data.affected_employee_ids
    }]);
  }, []);

  const updateTeamEvent = useCallback(async (event: TeamEvent) => {
    setTeamEvents(prev => prev.map(e => e.id === event.id ? event : e));
    await supabase.from('team_events').update({
      name: event.name,
      date: event.date,
      hours_reduction: event.hoursReduction,
      affected_employee_ids: event.affectedEmployeeIds
    }).eq('id', event.id);
  }, []);

  const deleteTeamEvent = useCallback(async (id: string) => {
    setTeamEvents(prev => prev.filter(e => e.id !== id));
    await supabase.from('team_events').delete().eq('id', id);
  }, []);

  // --- WEEKLY FEEDBACK ---
  const addWeeklyFeedback = useCallback(async (feedback: Omit<WeeklyFeedback, 'id' | 'createdAt'>) => {
    const { data } = await supabase.from('weekly_feedback').insert({
      employee_id: feedback.employeeId,
      week_start_date: feedback.weekStartDate,
      project_id: feedback.projectId || null,
      allocation_id: feedback.allocationId || null,
      reason: feedback.reason || null,
      comments: feedback.comments || null
    }).select().single();
    if (data) setWeeklyFeedback(prev => [...prev, {
      ...data,
      employeeId: data.employee_id,
      weekStartDate: data.week_start_date,
      projectId: data.project_id,
      allocationId: data.allocation_id,
      createdAt: data.created_at
    }]);
  }, []);

  // --- QUERIES ---
  const getEmployeeAllocationsForWeek = useCallback((employeeId: string, weekStart: string) => {
    return allocations.filter(a => a.employeeId === employeeId && a.weekStartDate === weekStart);
  }, [allocations]);

  const getEmployeeLoadForWeek = useCallback((employeeId: string, weekStart: string, effectiveStart?: Date, effectiveEnd?: Date, viewMonth?: Date) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return { hours: 0, capacity: 0, baseCapacity: 0, status: 'empty' as LoadStatus, percentage: 0, breakdown: [] };

    // Filtrar allocations por employeeId y weekStartDate
    let employeeAllocations = allocations.filter(a => a.employeeId === employeeId && a.weekStartDate === weekStart);

    // Si se proporciona viewMonth, filtrar también por mes efectivo (para evitar sumar horas de meses anteriores)
    if (viewMonth) {
      employeeAllocations = employeeAllocations.filter(a => isAllocationInEffectiveMonth(a.weekStartDate, viewMonth));
    }

    const totalHours = round2(employeeAllocations.reduce((sum, a) => sum + (a.status === 'completed' && (a.hoursActual || 0) > 0 ? Number(a.hoursActual) : Number(a.hoursAssigned)), 0));

    const weekStartDate = new Date(weekStart);
    const weekEndDate = addDays(weekStartDate, 6);
    const rangeStart = effectiveStart || weekStartDate;
    const rangeEnd = effectiveEnd || weekEndDate;

    let baseCapacity: number;
    if (effectiveStart && effectiveEnd) {
      const { totalHours: capacityHours } = getWorkingDaysInRange(effectiveStart, effectiveEnd, employee.workSchedule);
      baseCapacity = capacityHours;
    } else {
      baseCapacity = employee.defaultWeeklyCapacity;
    }

    let reducedCapacity = baseCapacity;

    // Use unified capacity reduction to prevent double-counting of absences and events
    const relevantAbsences = absences.filter(a => a.employeeId === employeeId);
    const { total: totalReduction, breakdown } = getCapacityReductionBreakdown(
      rangeStart, rangeEnd, employeeId, relevantAbsences, teamEvents, employee.workSchedule
    );
    reducedCapacity -= totalReduction;

    reducedCapacity = Math.max(0, round2(reducedCapacity));
    const percentage = reducedCapacity > 0 ? round2((totalHours / reducedCapacity) * 100) : (totalHours > 0 ? 999 : 0);
    const hoursRemaining = reducedCapacity - totalHours;
    let status: LoadStatus = 'empty';
    if (totalHours === 0) status = 'empty';
    else if (reducedCapacity === 0 && totalHours > 0) status = 'overload';
    else if (totalHours > reducedCapacity) status = 'overload'; // Rojo: se pasa del límite
    else if (hoursRemaining >= 2 && hoursRemaining <= 5) status = 'healthy'; // Verde: tiene entre 2-5 horas libres
    else status = 'warning'; // Amarillo: cerca del límite (menos de 2h libres o más de 5h libres)

    return { hours: totalHours, capacity: reducedCapacity, baseCapacity, status, percentage, breakdown };
  }, [employees, allocations, absences, teamEvents]);

  const getEmployeeMonthlyLoad = useCallback((employeeId: string, year: number, month: number) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return { hours: 0, capacity: 0, status: 'empty' as LoadStatus, percentage: 0 };
    const monthStart = new Date(year, month, 1);
    const weeks = getWeeksForMonth(monthStart);
    let totalHours = 0;
    weeks.forEach(week => {
      // Buscar allocations por weekStartDate real, pero filtrar por mes efectivo
      const weekStartDate = format(week.weekStart, 'yyyy-MM-dd');
      const tasks = allocations.filter(a =>
        a.employeeId === employeeId &&
        a.weekStartDate === weekStartDate &&
        isAllocationInEffectiveMonth(a.weekStartDate, monthStart)
      );
      totalHours += tasks.reduce((sum, a) => sum + (a.status === 'completed' && (a.hoursActual || 0) > 0 ? Number(a.hoursActual) : Number(a.hoursAssigned)), 0);
    });
    totalHours = round2(totalHours);
    const monthEnd = new Date(year, month + 1, 0);
    const employeeAbsences = absences.filter(a => a.employeeId === employeeId);
    let capacity = getMonthlyCapacity(year, month, employee.workSchedule);
    // Use unified capacity reduction to prevent double-counting of absences and events
    const { total: totalReduction } = getCapacityReductionBreakdown(
      monthStart, monthEnd, employeeId, employeeAbsences, teamEvents, employee.workSchedule
    );
    capacity = Math.max(0, round2(capacity - totalReduction));
    const percentage = capacity > 0 ? round2((totalHours / capacity) * 100) : (totalHours > 0 ? 999 : 0);
    const hoursRemaining = capacity - totalHours;
    let status: LoadStatus = 'empty';
    if (totalHours === 0) status = 'empty';
    else if (capacity === 0 && totalHours > 0) status = 'overload';
    else if (totalHours > capacity) status = 'overload'; // Rojo: se pasa del límite
    else if (hoursRemaining >= 2 && hoursRemaining <= 5) status = 'healthy'; // Verde: tiene entre 2-5 horas libres
    else status = 'warning'; // Amarillo: cerca del límite (menos de 2h libres o más de 5h libres)
    return { hours: totalHours, capacity, status, percentage };
  }, [employees, allocations, absences, teamEvents]);

  const getProjectHoursForMonth = useCallback((projectId: string, month: Date) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return { used: 0, budget: 0, available: 0, percentage: 0 };
    const weeks = getWeeksForMonth(month);
    let usedHours = 0;
    weeks.forEach(week => {
      const storageKey = getStorageKey(week.weekStart, month);
      const tasks = allocations.filter(a =>
        a.projectId === projectId &&
        a.weekStartDate === storageKey &&
        isAllocationInEffectiveMonth(a.weekStartDate, month)
      );
      usedHours += tasks.reduce((sum, a) => sum + (a.status === 'completed' && (a.hoursActual || 0) > 0 ? Number(a.hoursActual) : Number(a.hoursAssigned)), 0);
    });
    usedHours = round2(usedHours);
    const available = round2(Math.max(0, project.budgetHours - usedHours));
    const percentage = project.budgetHours > 0 ? round2((usedHours / project.budgetHours) * 100) : 0;
    return { used: usedHours, budget: project.budgetHours, available, percentage };
  }, [projects, allocations]);

  const getClientTotalHoursForMonth = useCallback((clientId: string, month: Date) => {
    const clientProjects = projects.filter(p => p.clientId === clientId);
    const weeks = getWeeksForMonth(month);
    let totalUsed = 0;
    let totalBudget = 0;
    clientProjects.forEach(project => {
      totalBudget += Number(project.budgetHours);
      weeks.forEach(week => {
        const storageKey = getStorageKey(week.weekStart, month);
        const tasks = allocations.filter(a => a.projectId === project.id && a.weekStartDate === storageKey);
        totalUsed += tasks.reduce((sum, a) => sum + (a.status === 'completed' && (a.hoursActual || 0) > 0 ? Number(a.hoursActual) : Number(a.hoursAssigned)), 0);
      });
    });
    totalUsed = round2(totalUsed);
    totalBudget = round2(totalBudget);
    const percentage = totalBudget > 0 ? round2((totalUsed / totalBudget) * 100) : 0;
    return { used: totalUsed, budget: totalBudget, percentage };
  }, [projects, allocations]);


  const addRoutine = async (routine: Omit<UserRoutine, 'id'>) => {
    const { data, error } = await supabase.from('user_routines').insert({
      employee_id: routine.employeeId,
      title: routine.title,
      estimated_minutes: routine.estimatedMinutes,
      project_id: routine.projectId,
      is_active: routine.isActive
    }).select().single();

    if (error) {
      console.error(error);
      toast.error("Error creando rutina");
      return;
    }

    if (data) {
      setUserRoutines(prev => [...prev, {
        id: data.id,
        employeeId: data.employee_id,
        title: data.title,
        estimatedMinutes: data.estimated_minutes,
        projectId: data.project_id,
        isActive: data.is_active
      }]);
      toast.success("Rutina creada");
    }
  };



  // --- TRANSFERS ---
  const fetchTransfers = useCallback(async () => {
    if (!currentUser?.id || !currentUser.agencyId) return;

    try {
      // 1. Incoming: Transfers sent TO me (pending)
      const { data: incoming, error: inError } = await supabase
        .from('task_transfers')
        .select(`
          *,
          from_employee:employees!task_transfers_from_employee_id_fkey(name),
          allocation:allocations!task_transfers_allocation_id_fkey(task_name, project_id, week_start_date)
        `)
        .eq('to_employee_id', currentUser.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (inError) throw inError;

      // 2. Agency Pending: ALL pending transfers in the agency (for locking logic in Planner)
      const { data: agencyPending, error: pendingError } = await supabase
        .from('task_transfers')
        .select(`
          *,
          to_employee:employees!task_transfers_to_employee_id_fkey(name),
          allocation:allocations!task_transfers_allocation_id_fkey(task_name, project_id, week_start_date)
        `)
        .eq('agency_id', currentUser.agencyId)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // 3. My History: Accepted/Rejected transfers where I was the sender (for history list)
      const { data: myHistory, error: historyError } = await supabase
        .from('task_transfers')
        .select(`
          *,
          to_employee:employees!task_transfers_to_employee_id_fkey(name),
          allocation:allocations!task_transfers_allocation_id_fkey(task_name, project_id, week_start_date)
        `)
        .eq('from_employee_id', currentUser.id)
        .in('status', ['accepted', 'rejected'])
        .order('requested_at', { ascending: false })
        .limit(20);

      if (historyError) throw historyError;

      // Transform function
      const transformTransfer = (t: any): TaskTransfer => {
        const projectId = t.allocation?.project_id;
        const project = projects.find(p => p.id === projectId);

        return {
          id: t.id,
          allocationId: t.allocation_id,
          fromEmployeeId: t.from_employee_id,
          toEmployeeId: t.to_employee_id,
          status: t.status,
          reason: t.reason,
          rejectionReason: t.rejection_reason,
          hours: t.hours_transferred,
          hoursTransferred: t.hours_transferred,
          requestedAt: t.requested_at,
          respondedAt: t.responded_at,
          agencyId: t.agency_id,
          fromEmployeeName: t.from_employee?.name,
          toEmployeeName: t.to_employee?.name,
          taskName: t.allocation?.task_name,
          projectId: projectId,
          projectName: project?.name || 'Proyecto desconocido',
          originalWeek: t.allocation?.week_start_date
        };
      };

      const pendingMapped = (agencyPending || []).map(transformTransfer);
      const historyMapped = (myHistory || []).map(transformTransfer);

      // Combine for outgoingTransfers state (Pending first, then History)
      const combinedMap = new Map<string, TaskTransfer>();
      pendingMapped.forEach(t => combinedMap.set(t.id, t));
      historyMapped.forEach(t => combinedMap.set(t.id, t));

      setPendingTransfers((incoming || []).map(transformTransfer));
      setOutgoingTransfers(Array.from(combinedMap.values()));

    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  }, [currentUser?.id, currentUser?.agencyId, projects]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchTransfers();
    }
  }, [fetchTransfers, currentUser?.id]); // Also depends on fetchTransfers which depends on projects

  const deleteRoutine = async (id: string) => {
    setUserRoutines(prev => prev.filter(r => r.id !== id));
    await supabase.from('user_routines').delete().eq('id', id);
  };

  const toggleRoutine = async (id: string) => {
    const routine = userRoutines.find(r => r.id === id);
    if (!routine) return;

    const newValue = !routine.isActive;
    setUserRoutines(prev => prev.map(r => r.id === id ? { ...r, isActive: newValue } : r));
    await supabase.from('user_routines').update({ is_active: newValue }).eq('id', id);
  };

  const getProjectById = useCallback((id: string) => projects.find(p => p.id === id), [projects]);
  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);

  const value = useMemo(() => ({
    currentUser,
    isAdmin: currentUser?.role === 'Responsable' || currentUser?.role === 'Coordinador',
    employees, clients, projects, allocations, absences, teamEvents, weeklyFeedback, isLoading,
    isSecondaryLoading, fetchArchivedProjects,
    addEmployee, updateEmployee, deleteEmployee, toggleEmployeeActive,
    addClient, updateClient, deleteClient,
    addProject, updateProject, deleteProject,
    addAllocation, updateAllocation, deleteAllocation,
    addAbsence, deleteAbsence,
    addTeamEvent, updateTeamEvent, deleteTeamEvent,
    getEmployeeAllocationsForWeek, getEmployeeLoadForWeek, getEmployeeMonthlyLoad,
    getProjectHoursForMonth, getClientTotalHoursForMonth, getProjectById, getClientById,
    loadDataForMonth,
    ensureMonthLoaded,
    addWeeklyFeedback,
    refreshData: fetchData,
    userRoutines, addRoutine, deleteRoutine, toggleRoutine,
    pendingTransfers, outgoingTransfers, fetchTransfers
  }), [currentUser, employees, clients, projects, allocations, absences, teamEvents, weeklyFeedback, isLoading,
    isSecondaryLoading, fetchArchivedProjects,
    addEmployee, updateEmployee, deleteEmployee, toggleEmployeeActive,
    addClient, updateClient, deleteClient,
    addProject, updateProject, deleteProject,
    addAllocation, updateAllocation, deleteAllocation,
    addAbsence, deleteAbsence,
    addTeamEvent, updateTeamEvent, deleteTeamEvent,
    getEmployeeAllocationsForWeek, getEmployeeLoadForWeek, getEmployeeMonthlyLoad,
    getProjectHoursForMonth, getClientTotalHoursForMonth, getProjectById, getClientById,
    loadDataForMonth, ensureMonthLoaded,
    addWeeklyFeedback, fetchData, userRoutines,
    pendingTransfers, outgoingTransfers]); // Added transfer deps

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
