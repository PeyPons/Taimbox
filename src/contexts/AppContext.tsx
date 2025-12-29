import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Employee, Client, Project, Allocation, LoadStatus, Absence, TeamEvent, ProfessionalGoal, WeeklyFeedback } from '@/types';
import { getWorkingDaysInRange, getMonthlyCapacity, getWeeksForMonth, getStorageKey, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getTeamEventHoursInRange, getTeamEventDetailsInRange } from '@/utils/teamEventUtils';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Tipos para respuestas de Supabase (snake_case)
interface SupabaseEmployee {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_id?: string;
  role?: string;
  department?: string;
  avatar_url?: string;
  default_weekly_capacity: number;
  work_schedule?: any;
  is_active: boolean;
  hourly_rate?: number;
  crm_user_id?: number;
  welcome_tour_completed?: boolean;
  deadlines_tour_completed?: boolean;
  planner_tour_completed?: boolean;
  permissions?: any;
}

interface SupabaseProject {
  id: string;
  client_id: string;
  name: string;
  status: string;
  budget_hours: number;
  minimum_hours?: number;
  monthly_fee?: number;
  external_id?: string;
  project_type?: string;
  is_hidden?: boolean;
  okrs?: any;
  deliverables_log?: any;
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

interface SupabaseProfessionalGoal {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  key_results?: any;
  progress: number;
  start_date?: string;
  due_date?: string;
  training_url?: string;
}

interface SupabaseTeamEvent {
  id: string;
  name: string;
  date: string;
  hours_reduction: number;
  affected_employee_ids: string[] | 'all';
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
  getEmployeeLoadForWeek: (employeeId: string, weekStart: string, effectiveStart?: Date, effectiveEnd?: Date) => { hours: number; capacity: number; baseCapacity: number; status: LoadStatus; percentage: number; breakdown: { reason: string; hours: number; type: 'absence' | 'event' }[] };
  getEmployeeMonthlyLoad: (employeeId: string, year: number, month: number) => { hours: number; capacity: number; status: LoadStatus; percentage: number };
  getProjectHoursForMonth: (projectId: string, month: Date) => { used: number; budget: number; available: number; percentage: number };
  getClientTotalHoursForMonth: (clientId: string, month: Date) => { used: number; budget: number; percentage: number };
  getProjectById: (id: string) => Project | undefined;
  getClientById: (id: string) => Client | undefined;
  professionalGoals: ProfessionalGoal[];
  addProfessionalGoal: (goal: Omit<ProfessionalGoal, 'id'>) => void;
  updateProfessionalGoal: (goal: ProfessionalGoal) => void;
  deleteProfessionalGoal: (id: string) => void;
  getEmployeeGoals: (employeeId: string) => ProfessionalGoal[];
  loadDataForMonth: (month: Date) => Promise<void>;
  addWeeklyFeedback: (feedback: Omit<WeeklyFeedback, 'id' | 'createdAt'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isInitialized: isAuthInitialized } = useAuth();
  const [currentUser, setCurrentUser] = useState<Employee | undefined>(undefined);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([]);
  const [weeklyFeedback, setWeeklyFeedback] = useState<WeeklyFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [professionalGoals, setProfessionalGoals] = useState<ProfessionalGoal[]>([]);

  // Ref para evitar vinculaciones duplicadas - DEBE estar ANTES de los useEffects
  const hasLinkedUserRef = useRef<string | null>(null);
  // Ref para acceder a employees sin trigger re-renders
  const employeesRef = useRef<Employee[]>([]);

  const fetchData = useCallback(async (skipLoading = false, dateRange?: { start: Date; end: Date }) => {
    if (!skipLoading) {
      setIsLoading(true);
    }
    try {
      // Calcular rango de fechas: 3 meses atrás y 6 meses adelante desde hoy (o rango proporcionado)
      const today = new Date();
      const defaultStart = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 6, 0);
      const startDate = dateRange?.start || defaultStart;
      const endDate = dateRange?.end || defaultEnd;

      // Formatear fechas para Supabase (YYYY-MM-DD)
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      // Tablas pequeñas: cargar todo
      // Tablas grandes con fechas: filtrar por rango
      const [empRes, cliRes, projRes, allocRes, absRes, evRes, goalsRes, feedbackRes] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('projects').select('*'),
        // Allocations: filtrar por week_start_date
        supabase.from('allocations')
          .select('*')
          .gte('week_start_date', startStr)
          .lte('week_start_date', endStr),
        // Absences: filtrar por rango de fechas (start_date <= endDate AND end_date >= startDate)
        supabase.from('absences')
          .select('*')
          .lte('start_date', endStr)
          .gte('end_date', startStr),
        // Team events: filtrar por date
        supabase.from('team_events')
          .select('*')
          .gte('date', startStr)
          .lte('date', endStr),
        supabase.from('professional_goals').select('*'),
        supabase.from('weekly_feedback')
          .select('*')
          .gte('week_start_date', startStr)
          .lte('week_start_date', endStr),
      ]);

      if (empRes.data) {
        const mappedEmployees = empRes.data.map((e: SupabaseEmployee) => ({
          ...e,
          avatarUrl: e.avatar_url,
          defaultWeeklyCapacity: e.default_weekly_capacity,
          workSchedule: e.work_schedule,
          isActive: e.is_active,
          first_name: e.first_name,
          last_name: e.last_name,
          email: e.email,
          user_id: e.user_id,
          hourlyRate: e.hourly_rate || 0,
          crmUserId: e.crm_user_id,
          welcomeTourCompleted: e.welcome_tour_completed === true,
          deadlinesTourCompleted: e.deadlines_tour_completed === true,
          plannerTourCompleted: e.planner_tour_completed === true,
          permissions: e.permissions || undefined
        }));
        setEmployees(mappedEmployees);
        employeesRef.current = mappedEmployees; // Actualizar ref
      }

      if (cliRes.data) setClients(cliRes.data);
      if (projRes.data) {
        setProjects(projRes.data.map((p: SupabaseProject) => ({
          ...p,
          clientId: p.client_id,
          budgetHours: round2(p.budget_hours),
          minimumHours: round2(p.minimum_hours || 0),
          monthlyFee: p.monthly_fee,
          externalId: p.external_id,
          projectType: p.project_type,
          isHidden: p.is_hidden || false
        })));
      }
      if (allocRes.data) {
        const mappedAllocations = allocRes.data.map((a: SupabaseAllocation) => ({
          ...a,
          employeeId: a.employee_id,
          projectId: a.project_id,
          weekStartDate: a.week_start_date,
          hoursAssigned: round2(a.hours_assigned),
          hoursActual: a.hours_actual ? round2(a.hours_actual) : undefined,
          hoursComputed: a.hours_computed ? round2(a.hours_computed) : undefined,
          taskName: a.task_name,
          dependencyId: a.dependency_id,
          transferredFromAllocationId: a.transferred_from_allocation_id,
          distributionSourceAllocationId: a.distribution_source_allocation_id
        }));
        
        // Si skipLoading es true, significa que estamos cargando datos adicionales (merge)
        // Si no, reemplazamos todos los datos
        if (skipLoading) {
          setAllocations(prev => {
            // Merge: agregar nuevas allocations que no existan ya
            const existingIds = new Set(prev.map(a => a.id));
            const newAllocations = mappedAllocations.filter(a => !existingIds.has(a.id));
            return [...prev, ...newAllocations];
          });
        } else {
          setAllocations(mappedAllocations);
        }
      }
      if (absRes.data) {
        setAbsences(absRes.data.map((ab: SupabaseAbsence) => ({
          ...ab,
          employeeId: ab.employee_id,
          startDate: ab.start_date,
          endDate: ab.end_date,
          hours: ab.hours
        })));
      }
      if (goalsRes.data) {
        setProfessionalGoals(goalsRes.data.map((g: SupabaseProfessionalGoal) => ({
          ...g,
          employeeId: g.employee_id,
          keyResults: g.key_results,
          trainingUrl: g.training_url,
          startDate: g.start_date,
          dueDate: g.due_date
        })));
      }
      if (evRes.data) {
        setTeamEvents(evRes.data.map((te: SupabaseTeamEvent) => ({
          ...te,
          hoursReduction: te.hours_reduction,
          affectedEmployeeIds: te.affected_employee_ids
        })));
      }
      if (feedbackRes.data) {
        setWeeklyFeedback(feedbackRes.data.map((fb: any) => ({
          ...fb,
          employeeId: fb.employee_id,
          weekStartDate: fb.week_start_date,
          projectId: fb.project_id,
          allocationId: fb.allocation_id,
          createdAt: fb.created_at
        })));
      }
    } catch (error: any) {
      console.error("Error cargando datos:", error);
      const errorMessage = error?.message || error?.error?.message || "Error al cargar los datos. Por favor, recarga la página.";
      toast.error(errorMessage);
      setIsLoading(false);
    } finally {
      if (!skipLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  // Función para cargar datos de un mes específico (merge con datos existentes)
  const loadDataForMonth = useCallback(async (month: Date): Promise<boolean> => {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    let dataFound = false;
    
    // Calcular el rango de semanas que pueden tener días en este mes (incluyendo semanas que cruzan)
    const weeks = getWeeksForMonth(month);
    const weekStartDates = weeks.map(w => format(w.weekStart, 'yyyy-MM-dd'));
    const minWeekStart = weekStartDates.length > 0 ? weekStartDates[0] : format(monthStart, 'yyyy-MM-dd');
    const maxWeekStart = weekStartDates.length > 0 ? weekStartDates[weekStartDates.length - 1] : format(monthEnd, 'yyyy-MM-dd');
    
    // Cargar solo allocations, absences, team_events y weekly_feedback para este mes (merge)
    try {
      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');
      
      const [allocRes, absRes, evRes, feedRes] = await Promise.all([
        supabase.from('allocations')
          .select('*')
          .gte('week_start_date', minWeekStart)
          .lte('week_start_date', maxWeekStart),
        supabase.from('absences')
          .select('*')
          .lte('start_date', endStr)
          .gte('end_date', startStr),
        supabase.from('team_events')
          .select('*')
          .gte('date', startStr)
          .lte('date', endStr),
        supabase.from('weekly_feedback')
          .select('*')
          .gte('week_start_date', minWeekStart)
          .lte('week_start_date', maxWeekStart),
      ]);

      if (allocRes.data) {
        const mappedAllocations = allocRes.data.map((a: SupabaseAllocation) => ({
          ...a,
          employeeId: a.employee_id,
          projectId: a.project_id,
          weekStartDate: a.week_start_date,
          hoursAssigned: round2(a.hours_assigned),
          hoursActual: a.hours_actual ? round2(a.hours_actual) : undefined,
          hoursComputed: a.hours_computed ? round2(a.hours_computed) : undefined,
          taskName: a.task_name,
          dependencyId: a.dependency_id,
          transferredFromAllocationId: a.transferred_from_allocation_id,
          distributionSourceAllocationId: a.distribution_source_allocation_id
        }));
        
        setAllocations(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          // Filtrar por mes efectivo antes de añadir
          const newAllocations = mappedAllocations.filter(a => 
            !existingIds.has(a.id) && 
            isAllocationInEffectiveMonth(a.weekStartDate, month)
          );
          return [...prev, ...newAllocations];
        });
      }

      if (absRes.data) {
        const mappedAbsences = absRes.data.map((a: SupabaseAbsence) => ({
          ...a,
          employeeId: a.employee_id,
          startDate: a.start_date,
          endDate: a.end_date,
          hours: a.hours
        }));
        
        setAbsences(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newAbsences = mappedAbsences.filter(a => !existingIds.has(a.id));
          return [...prev, ...newAbsences];
        });
      }

      if (evRes.data) {
        const mappedEvents = evRes.data.map((e: SupabaseTeamEvent) => ({
          ...e,
          affectedEmployeeIds: e.affected_employee_ids
        }));
        
        setTeamEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEvents = mappedEvents.filter(e => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
      }

      // NUEVO: Cargar weekly_feedback para el mes
      if (feedRes.data && feedRes.data.length > 0) {
        dataFound = true;
        const mappedFeedback = feedRes.data.map((fb: any) => ({
          ...fb,
          employeeId: fb.employee_id,
          weekStartDate: fb.week_start_date,
          projectId: fb.project_id,
          allocationId: fb.allocation_id,
          createdAt: fb.created_at
        }));
        
        setWeeklyFeedback(prev => {
          const existingIds = new Set(prev.map(f => f.id));
          const newItems = mappedFeedback.filter(f => !existingIds.has(f.id));
          return [...prev, ...newItems];
        });
      }
    } catch (error) {
      console.error("Error cargando datos del mes:", error);
    }
    
    return dataFound;
  }, []);

  // Cargar datos cuando la autenticación esté lista
  useEffect(() => {
    if (isAuthInitialized) {
      fetchData();
    }
  }, [isAuthInitialized, fetchData]);

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
          console.log('[AppContext] Vinculando empleado existente con usuario Auth:', foundEmployee.email);
          
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
          console.log('[AppContext] Empleado encontrado:', foundEmployee.email);
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
    const { data, error } = await supabase.from('employees').insert({
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
      permissions: employee.permissions || null
    }).select().single();

    if (error) {
      console.error('Error creando empleado:', error);
      const errorMessage = error?.message || error?.error?.message || 'Error al crear el empleado';
      toast.error(errorMessage);
      throw error;
    }

    if (data) {
      const mappedEmployee: Employee = {
        ...data,
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
        plannerTourCompleted: data.planner_tour_completed === true,
        permissions: data.permissions || undefined
      };
      setEmployees(prev => [...prev, mappedEmployee]);
    }
  }, []);

  const updateEmployee = useCallback(async (employee: Employee) => {
    setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
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
      permissions: employee.permissions || null
    }).eq('id', employee.id);
    
    if (error) {
      console.error('Error actualizando empleado:', error);
      const errorMessage = error?.message || error?.error?.message || 'Error al actualizar el empleado';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    setAllocations(prev => prev.filter(a => a.employeeId !== id));
    setAbsences(prev => prev.filter(a => a.employeeId !== id));
    await supabase.from('employees').delete().eq('id', id);
  }, []);

  const toggleEmployeeActive = useCallback(async (id: string) => {
    // Usamos un ref para obtener el estado actual sin depender de employees
    let newState: boolean | null = null;

    setEmployees(prev => {
      const emp = prev.find(e => e.id === id);
      if (!emp) return prev;
      newState = !emp.isActive;
      return prev.map(e => e.id === id ? { ...e, isActive: newState! } : e);
    });

    // Solo hacer la llamada a supabase si encontramos el empleado
    if (newState !== null) {
      await supabase.from('employees').update({ is_active: newState }).eq('id', id);
    }
  }, []);

  // --- ALLOCATIONS ---
  const addAllocation = useCallback(async (allocation: Omit<Allocation, 'id'>): Promise<Allocation | null> => { 
    const { data } = await supabase.from('allocations').insert({ 
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
      distribution_source_allocation_id: allocation.distributionSourceAllocationId
    }).select().single(); 
    
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
        distributionSourceAllocationId: data.distribution_source_allocation_id
      };
      setAllocations(prev => [...prev, mappedAllocation]);
      return mappedAllocation;
    }
    return null;
  }, []);

  const updateAllocation = useCallback(async (allocation: Allocation) => { 
    setAllocations(prev => prev.map(a => a.id === allocation.id ? allocation : a)); 
    await supabase.from('allocations').update({ 
      hours_assigned: allocation.hoursAssigned, 
      hours_actual: allocation.hoursActual, 
      hours_computed: allocation.hoursComputed, 
      status: allocation.status, 
      description: allocation.description, 
      task_name: allocation.taskName,
      dependency_id: allocation.dependencyId,
      transferred_from_allocation_id: allocation.transferredFromAllocationId,
      distribution_source_allocation_id: allocation.distributionSourceAllocationId
    }).eq('id', allocation.id); 
  }, []);

  const deleteAllocation = useCallback(async (id: string) => { 
    setAllocations(prev => prev.filter(a => a.id !== id)); 
    await supabase.from('allocations').delete().eq('id', id); 
  }, []);
  
  // --- CLIENTS ---
  const addClient = useCallback(async (client: Omit<Client, 'id'>) => { 
    const { data } = await supabase.from('clients').insert(client).select().single(); 
    if (data) setClients(prev => [...prev, data]); 
  }, []);

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
    const { data } = await supabase.from('projects').insert({ 
      client_id: project.clientId, 
      name: project.name, 
      status: project.status, 
      budget_hours: project.budgetHours, 
      minimum_hours: project.minimumHours 
    }).select().single(); 
    if (data) setProjects(prev => [...prev, { 
      ...data, 
      clientId: data.client_id, 
      budgetHours: round2(data.budget_hours), 
      minimumHours: round2(data.minimum_hours) 
    }]); 
  }, []);

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
      deliverables_log: project.deliverablesLog,
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

  // --- PROFESSIONAL GOALS ---
  const addProfessionalGoal = useCallback(async (goal: Omit<ProfessionalGoal, 'id'>) => {
    const { data } = await supabase.from('professional_goals').insert({
      employee_id: goal.employeeId,
      title: goal.title,
      description: goal.description,
      key_results: goal.keyResults,
      progress: goal.progress,
      start_date: goal.startDate,
      due_date: goal.dueDate,
      training_url: goal.trainingUrl
    }).select().single();
    if (data) setProfessionalGoals(prev => [...prev, {
      ...data,
      employeeId: data.employee_id,
      keyResults: data.key_results,
      trainingUrl: data.training_url,
      startDate: data.start_date,
      dueDate: data.due_date
    }]);
  }, []);

  const updateProfessionalGoal = useCallback(async (goal: ProfessionalGoal) => {
    setProfessionalGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    await supabase.from('professional_goals').update({
      title: goal.title,
      description: goal.description,
      key_results: goal.keyResults,
      progress: goal.progress,
      start_date: goal.startDate,
      due_date: goal.dueDate,
      training_url: goal.trainingUrl
    }).eq('id', goal.id);
  }, []);

  const deleteProfessionalGoal = useCallback(async (id: string) => {
    setProfessionalGoals(prev => prev.filter(g => g.id !== id));
    await supabase.from('professional_goals').delete().eq('id', id);
  }, []);

  const getEmployeeGoals = useCallback((employeeId: string) => {
    return professionalGoals.filter(g => g.employeeId === employeeId);
  }, [professionalGoals]);

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

  const getEmployeeLoadForWeek = useCallback((employeeId: string, weekStart: string, effectiveStart?: Date, effectiveEnd?: Date) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return { hours: 0, capacity: 0, baseCapacity: 0, status: 'empty' as LoadStatus, percentage: 0, breakdown: [] };

    const employeeAllocations = allocations.filter(a => a.employeeId === employeeId && a.weekStartDate === weekStart);
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

    const breakdown: { reason: string; hours: number; type: 'absence' | 'event' }[] = [];
    let reducedCapacity = baseCapacity;

    const relevantAbsences = absences.filter(a => a.employeeId === employeeId);
    const absenceReductionTotal = getAbsenceHoursInRange(rangeStart, rangeEnd, relevantAbsences, employee.workSchedule);
    if (absenceReductionTotal > 0) {
      relevantAbsences.forEach(abs => {
        const absStart = new Date(abs.startDate);
        const absEnd = new Date(abs.endDate);
        if (absStart <= rangeEnd && absEnd >= rangeStart) {
          const specificHours = getAbsenceHoursInRange(rangeStart, rangeEnd, [abs], employee.workSchedule);
          if (specificHours > 0) breakdown.push({ reason: `Ausencia: ${abs.type}`, hours: specificHours, type: 'absence' });
        }
      });
      reducedCapacity -= absenceReductionTotal;
    }

    const eventReductionTotal = getTeamEventHoursInRange(rangeStart, rangeEnd, employeeId, teamEvents, employee.workSchedule, relevantAbsences);
    if (eventReductionTotal > 0) {
      const eventDetails = getTeamEventDetailsInRange(rangeStart, rangeEnd, employeeId, teamEvents, employee.workSchedule, relevantAbsences);
      eventDetails.forEach(detail => {
        breakdown.push({ reason: `Evento: ${detail.name}`, hours: detail.hours, type: 'event' });
      });
      reducedCapacity -= eventReductionTotal;
    }

    reducedCapacity = Math.max(0, round2(reducedCapacity));
    const percentage = reducedCapacity > 0 ? round2((totalHours / reducedCapacity) * 100) : (totalHours > 0 ? 999 : 0);
    let status: LoadStatus = 'empty';
    if (totalHours === 0) status = 'empty';
    else if (reducedCapacity === 0 && totalHours > 0) status = 'overload';
    else if (percentage <= 85) status = 'healthy';
    else if (percentage <= 100) status = 'warning';
    else status = 'overload';

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
    capacity = Math.max(0, capacity - getAbsenceHoursInRange(monthStart, monthEnd, employeeAbsences, employee.workSchedule));
    capacity = Math.max(0, capacity - getTeamEventHoursInRange(monthStart, monthEnd, employeeId, teamEvents, employee.workSchedule, employeeAbsences));
    capacity = round2(capacity);
    const percentage = capacity > 0 ? round2((totalHours / capacity) * 100) : (totalHours > 0 ? 999 : 0);
    let status: LoadStatus = 'empty';
    if (totalHours === 0) status = 'empty';
    else if (capacity === 0 && totalHours > 0) status = 'overload';
    else if (percentage <= 85) status = 'healthy';
    else if (percentage <= 100) status = 'warning';
    else status = 'overload';
    return { hours: totalHours, capacity, status, percentage };
  }, [employees, allocations, absences, teamEvents]);

  const getProjectHoursForMonth = useCallback((projectId: string, month: Date) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return { used: 0, budget: 0, available: 0, percentage: 0 };
    const weeks = getWeeksForMonth(month);
    let usedHours = 0;
    weeks.forEach(week => {
      const storageKey = getStorageKey(week.weekStart, month);
      const tasks = allocations.filter(a => a.projectId === projectId && a.weekStartDate === storageKey);
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

  const getProjectById = useCallback((id: string) => projects.find(p => p.id === id), [projects]);
  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);

  const value = useMemo(() => ({
    currentUser,
    isAdmin: currentUser?.role === 'Responsable' || currentUser?.role === 'Coordinador',
    employees, clients, projects, allocations, absences, teamEvents, weeklyFeedback, isLoading,
    addEmployee, updateEmployee, deleteEmployee, toggleEmployeeActive,
    addClient, updateClient, deleteClient,
    addProject, updateProject, deleteProject,
    addAllocation, updateAllocation, deleteAllocation,
    addAbsence, deleteAbsence,
    addTeamEvent, updateTeamEvent, deleteTeamEvent,
    getEmployeeAllocationsForWeek, getEmployeeLoadForWeek, getEmployeeMonthlyLoad,
    getProjectHoursForMonth, getClientTotalHoursForMonth, getProjectById, getClientById,
    professionalGoals, addProfessionalGoal, updateProfessionalGoal, deleteProfessionalGoal, getEmployeeGoals,
    loadDataForMonth,
    addWeeklyFeedback
  }), [currentUser, employees, clients, projects, allocations, absences, teamEvents, weeklyFeedback, isLoading,
    addEmployee, updateEmployee, deleteEmployee, toggleEmployeeActive,
    addClient, updateClient, deleteClient,
    addProject, updateProject, deleteProject,
    addAllocation, updateAllocation, deleteAllocation,
    addAbsence, deleteAbsence,
    addTeamEvent, updateTeamEvent, deleteTeamEvent,
    getEmployeeAllocationsForWeek, getEmployeeLoadForWeek, getEmployeeMonthlyLoad,
    getProjectHoursForMonth, getClientTotalHoursForMonth, getProjectById, getClientById,
    professionalGoals, addProfessionalGoal, updateProfessionalGoal, deleteProfessionalGoal, getEmployeeGoals,
    loadDataForMonth,
    addWeeklyFeedback]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
