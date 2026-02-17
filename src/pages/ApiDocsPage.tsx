import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  ArrowLeft,
  ArrowRight,
  Code,
  Database,
  Key,
  Plug,
  Shield,
  FileJson,
  Copy,
  Check,
  Menu,
  Zap,
  Filter,
  AlertTriangle,
  Globe,
  Terminal,
  BookOpen,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface ColumnDef {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  pk?: boolean;
  fk?: string;
  check?: string;
  description: string;
}

interface TableDef {
  name: string;
  description: string;
  authNote: string;
  columns: ColumnDef[];
  examples: { select: string; insert: string };
}

interface TableGroup {
  group: string;
  icon: React.ElementType;
  tables: TableDef[];
}

/* ═══════════════════════════════════════════════════════════════════
   TOC SECTIONS
   ═══════════════════════════════════════════════════════════════════ */

const TOC_SECTIONS = [
  { id: 'intro', label: 'Introducción' },
  { id: 'base-url', label: 'Base URL y headers' },
  { id: 'auth', label: 'Autenticación' },
  { id: 'sdk', label: 'SDK JavaScript' },
  { id: 'rest', label: 'API REST (HTTP)' },
  { id: 'filtering', label: 'Filtrado y paginación' },
  { id: 'realtime', label: 'Suscripciones Realtime' },
  { id: 'errors', label: 'Manejo de errores' },
  { id: 'resources', label: 'Referencia de recursos' },
] as const;

/* ═══════════════════════════════════════════════════════════════════
   TABLE SCHEMA DATA (17 public tables)
   ═══════════════════════════════════════════════════════════════════ */

const TABLE_GROUPS: TableGroup[] = [
  {
    group: 'Organización',
    icon: Globe,
    tables: [
      {
        name: 'agencies',
        description: 'Cada agencia es un tenant aislado. Todos los recursos se asocian a una agencia.',
        authNote: 'Requiere autenticación. Solo puedes acceder a las agencias de tu usuario.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre de la agencia. Debe ser único.' },
          { name: 'slug', type: 'text', required: true, description: 'Slug URL-friendly. Único.' },
          { name: 'settings', type: 'jsonb', required: false, default: "'{}'", description: 'Configuración de la agencia (roles, módulos, branding).' },
          { name: 'setup_completed', type: 'boolean', required: false, default: 'false', description: 'Indica si el onboarding se completó.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de creación. Auto-generado.' },
          { name: 'updated_at', type: 'timestamptz', required: false, default: 'now()', description: 'Última actualización. Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('agencies')
  .select('id, name, slug, settings')
  .single()`,
          insert: `const { data } = await timeboxing
  .from('agencies')
  .insert({ name: 'Mi Agencia', slug: 'mi-agencia' })
  .select()
  .single()`,
        },
      },
      {
        name: 'employees',
        description: 'Miembros del equipo. Cada empleado tiene un rol, capacidad semanal y horario laboral.',
        authNote: 'Requiere autenticación. Filtra por agency_id obligatorio.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre completo del empleado.' },
          { name: 'first_name', type: 'text', required: false, description: 'Nombre.' },
          { name: 'last_name', type: 'text', required: false, description: 'Apellido.' },
          { name: 'email', type: 'text', required: false, description: 'Correo electrónico.' },
          { name: 'role', type: 'text', required: true, description: 'Nombre del rol (define permisos).' },
          { name: 'department', type: 'text', required: false, default: "'General'", description: 'Departamento al que pertenece.' },
          { name: 'default_weekly_capacity', type: 'numeric', required: true, description: 'Horas base de trabajo por semana (ej. 40).' },
          { name: 'work_schedule', type: 'jsonb', required: true, description: 'Horas por día: { monday: 8, tuesday: 8, ... sunday: 0 }.' },
          { name: 'hourly_rate', type: 'numeric', required: false, default: '0', description: 'Coste por hora del empleado.' },
          { name: 'is_active', type: 'boolean', required: false, default: 'true', description: 'Si está activo. Los inactivos no aparecen en planificación.' },
          { name: 'avatar_url', type: 'text', required: false, description: 'URL del avatar.' },
          { name: 'user_id', type: 'uuid', required: false, description: 'Vinculación con usuario de la plataforma. Solo lectura.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia a la que pertenece.' },
          { name: 'department_id', type: 'uuid', required: false, fk: 'department_config(id)', description: 'Departamento configurado.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de creación. Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('employees')
  .select('id, name, role, email, default_weekly_capacity, is_active')
  .eq('agency_id', agencyId)
  .eq('is_active', true)
  .order('name')`,
          insert: `const { data } = await timeboxing
  .from('employees')
  .insert({
    name: 'Ana García',
    first_name: 'Ana',
    last_name: 'García',
    email: 'ana@agencia.com',
    role: 'Diseñador',
    default_weekly_capacity: 40,
    work_schedule: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 },
    agency_id: agencyId
  })
  .select()
  .single()`,
        },
      },
      {
        name: 'clients',
        description: 'Clientes de la agencia. Cada proyecto pertenece a un cliente.',
        authNote: 'Requiere autenticación. Filtra por agency_id obligatorio.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre del cliente.' },
          { name: 'color', type: 'text', required: true, description: 'Color hex para representación visual (ej. #3B82F6).' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia propietaria.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de creación. Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('clients')
  .select('id, name, color')
  .eq('agency_id', agencyId)
  .order('name')`,
          insert: `const { data } = await timeboxing
  .from('clients')
  .insert({ name: 'Cliente Ejemplo', color: '#8B5CF6', agency_id: agencyId })
  .select()
  .single()`,
        },
      },
      {
        name: 'projects',
        description: 'Proyectos asociados a un cliente. Contienen las asignaciones de horas del equipo.',
        authNote: 'Requiere autenticación. Filtra por agency_id obligatorio.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'client_id', type: 'uuid', required: true, fk: 'clients(id)', description: 'Cliente al que pertenece.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre del proyecto.' },
          { name: 'status', type: 'text', required: false, default: "'active'", check: "IN ('active','archived')", description: 'Estado del proyecto.' },
          { name: 'budget_hours', type: 'numeric', required: false, default: '0', description: 'Horas presupuestadas por mes.' },
          { name: 'minimum_hours', type: 'numeric', required: false, default: '0', description: 'Mínimo de horas comprometidas.' },
          { name: 'monthly_fee', type: 'numeric', required: false, default: '0', description: 'Tarifa mensual del proyecto (€).' },
          { name: 'project_type', type: 'text', required: false, default: "'Mensual'", description: 'Tipo: Mensual, Puntual, etc.' },
          { name: 'is_hidden', type: 'boolean', required: false, default: 'false', description: 'Oculto en vistas generales.' },
          { name: 'okrs', type: 'jsonb', required: false, default: "'[]'", description: 'Objetivos y resultados clave del proyecto.' },
          { name: 'deliverables_log', type: 'jsonb', required: false, default: "'{}'", description: 'Registro de entregables.' },
          { name: 'last_meeting_date', type: 'timestamptz', required: false, description: 'Fecha de la última reunión con el cliente.' },
          { name: 'external_id', type: 'integer', required: false, description: 'ID externo para integraciones CRM.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia propietaria.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de creación. Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('projects')
  .select('id, name, client_id, budget_hours, monthly_fee, status')
  .eq('agency_id', agencyId)
  .eq('status', 'active')
  .order('name')`,
          insert: `const { data } = await timeboxing
  .from('projects')
  .insert({
    client_id: clientId,
    name: 'Campaña Q1 2026',
    budget_hours: 120,
    monthly_fee: 3500,
    agency_id: agencyId
  })
  .select()
  .single()`,
        },
      },
    ],
  },
  {
    group: 'Planificación',
    icon: FileJson,
    tables: [
      {
        name: 'allocations',
        description: 'Unidad atómica de planificación. Cada asignación vincula un empleado con un proyecto para una semana concreta.',
        authNote: 'Requiere autenticación. Filtra por agency_id a través del proyecto.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado asignado.' },
          { name: 'project_id', type: 'uuid', required: true, fk: 'projects(id)', description: 'Proyecto destino.' },
          { name: 'week_start_date', type: 'date', required: true, description: 'Lunes de la semana (YYYY-MM-DD).' },
          { name: 'hours_assigned', type: 'numeric', required: true, description: 'Horas planificadas para la semana.' },
          { name: 'hours_actual', type: 'numeric', required: false, default: '0', description: 'Horas realmente trabajadas (reportadas).' },
          { name: 'hours_computed', type: 'numeric', required: false, default: '0', description: 'Horas calculadas por el sistema.' },
          { name: 'task_name', type: 'text', required: false, description: 'Nombre de la tarea.' },
          { name: 'description', type: 'text', required: false, description: 'Descripción detallada de la tarea.' },
          { name: 'status', type: 'text', required: false, default: "'planned'", check: "IN ('planned','completed')", description: 'Estado de la asignación.' },
          { name: 'is_locked', type: 'boolean', required: false, default: 'false', description: 'Si está bloqueada para edición.' },
          { name: 'user_priority', type: 'integer', required: false, description: 'Prioridad asignada por el usuario (orden).' },
          { name: 'dependency_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Asignación de la que depende.' },
          { name: 'parent_allocation_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Asignación padre (subdivisiones).' },
          { name: 'transferred_from_allocation_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Origen si fue transferida.' },
          { name: 'transfer_source_employee_id', type: 'uuid', required: false, fk: 'employees(id)', description: 'Empleado origen de la transferencia.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de creación. Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('allocations')
  .select('id, employee_id, project_id, week_start_date, hours_assigned, task_name, status')
  .eq('employee_id', employeeId)
  .gte('week_start_date', '2026-02-01')
  .lte('week_start_date', '2026-02-28')
  .order('week_start_date')`,
          insert: `const { data } = await timeboxing
  .from('allocations')
  .insert({
    employee_id: employeeId,
    project_id: projectId,
    week_start_date: '2026-02-17',
    hours_assigned: 8,
    task_name: 'Diseño de landing',
    status: 'planned'
  })
  .select()
  .single()`,
        },
      },
      {
        name: 'deadlines',
        description: 'Objetivos mensuales por proyecto. Define cuántas horas debe dedicar cada empleado a un proyecto en un mes.',
        authNote: 'Requiere autenticación. Se filtra por proyecto (que pertenece a una agencia).',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'project_id', type: 'uuid', required: true, fk: 'projects(id)', description: 'Proyecto asociado.' },
          { name: 'month', type: 'varchar', required: true, default: "to_char(now(),'YYYY-MM')", description: 'Mes en formato YYYY-MM.' },
          { name: 'employee_hours', type: 'jsonb', required: false, default: "'{}'", description: 'Mapa { employeeId: horas } con el reparto mensual.' },
          { name: 'budget_override', type: 'numeric', required: false, description: 'Presupuesto personalizado para este mes (sobreescribe el del proyecto).' },
          { name: 'notes', type: 'text', required: false, description: 'Notas internas sobre el deadline.' },
          { name: 'is_hidden', type: 'boolean', required: false, default: 'false', description: 'Oculto en vista general.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
          { name: 'updated_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('deadlines')
  .select('id, project_id, month, employee_hours, budget_override')
  .eq('month', '2026-02')`,
          insert: `const { data } = await timeboxing
  .from('deadlines')
  .insert({
    project_id: projectId,
    month: '2026-03',
    employee_hours: { [employeeId]: 40 },
    budget_override: 100
  })
  .select()
  .single()`,
        },
      },
      {
        name: 'time_entries',
        description: 'Registro de horas reales trabajadas por asignación y día.',
        authNote: 'Requiere autenticación.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Asignación a la que se imputan las horas.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que registra.' },
          { name: 'date', type: 'date', required: true, description: 'Día del registro (YYYY-MM-DD).' },
          { name: 'hours', type: 'numeric', required: false, default: '0', check: '>= 0 AND <= 24', description: 'Horas trabajadas (0-24).' },
          { name: 'notes', type: 'text', required: false, description: 'Notas sobre el trabajo realizado.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
          { name: 'updated_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('time_entries')
  .select('id, allocation_id, date, hours, notes')
  .eq('employee_id', employeeId)
  .gte('date', '2026-02-17')
  .lte('date', '2026-02-23')`,
          insert: `const { data } = await timeboxing
  .from('time_entries')
  .insert({
    allocation_id: allocationId,
    employee_id: employeeId,
    date: '2026-02-17',
    hours: 4.5,
    notes: 'Revisión de maquetas'
  })
  .select()
  .single()`,
        },
      },
    ],
  },
  {
    group: 'Transferencias',
    icon: ArrowRight,
    tables: [
      {
        name: 'task_transfers',
        description: 'Solicitudes de transferencia de tareas entre empleados. Ciclo de vida: pending → accepted/rejected/cancelled.',
        authNote: 'Requiere autenticación. Filtra por agency_id obligatorio.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Asignación que se transfiere.' },
          { name: 'from_employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que envía la tarea.' },
          { name: 'to_employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que recibe la tarea.' },
          { name: 'hours_transferred', type: 'numeric', required: true, description: 'Horas que se transfieren.' },
          { name: 'status', type: 'text', required: false, default: "'pending'", check: "IN ('pending','accepted','rejected','cancelled')", description: 'Estado de la solicitud.' },
          { name: 'acceptance_mode', type: 'text', required: false, check: "IN ('keep','move','distribute','rollover')", description: 'Modo de aceptación elegido por el receptor.' },
          { name: 'reason', type: 'text', required: false, description: 'Motivo de la transferencia.' },
          { name: 'rejection_reason', type: 'text', required: false, description: 'Motivo del rechazo (si aplica).' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia.' },
          { name: 'requested_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de solicitud. Auto-generado.' },
          { name: 'responded_at', type: 'timestamptz', required: false, description: 'Fecha de respuesta.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('task_transfers')
  .select('id, allocation_id, from_employee_id, to_employee_id, hours_transferred, status')
  .eq('agency_id', agencyId)
  .eq('status', 'pending')`,
          insert: `const { data } = await timeboxing
  .from('task_transfers')
  .insert({
    allocation_id: allocationId,
    from_employee_id: fromId,
    to_employee_id: toId,
    hours_transferred: 4,
    reason: 'Sobrecarga esta semana',
    agency_id: agencyId
  })
  .select()
  .single()`,
        },
      },
    ],
  },
  {
    group: 'Ausencias y eventos',
    icon: AlertTriangle,
    tables: [
      {
        name: 'absences',
        description: 'Ausencias de empleados (vacaciones, baja, permisos). Reducen la capacidad disponible automáticamente.',
        authNote: 'Requiere autenticación.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado ausente.' },
          { name: 'start_date', type: 'date', required: true, description: 'Fecha de inicio (YYYY-MM-DD).' },
          { name: 'end_date', type: 'date', required: true, description: 'Fecha de fin (YYYY-MM-DD).' },
          { name: 'type', type: 'text', required: true, description: 'Tipo de ausencia (vacaciones, baja, permiso, etc.).' },
          { name: 'hours', type: 'numeric', required: false, default: '0', description: 'Horas de ausencia (si es parcial).' },
          { name: 'description', type: 'text', required: false, description: 'Descripción o notas.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('absences')
  .select('id, employee_id, start_date, end_date, type, hours')
  .eq('employee_id', employeeId)
  .gte('end_date', '2026-02-01')`,
          insert: `const { data } = await timeboxing
  .from('absences')
  .insert({
    employee_id: employeeId,
    start_date: '2026-03-10',
    end_date: '2026-03-14',
    type: 'vacaciones',
    description: 'Semana Santa'
  })
  .select()
  .single()`,
        },
      },
      {
        name: 'team_events',
        description: 'Eventos del equipo que reducen disponibilidad (festivos, formaciones, team buildings).',
        authNote: 'Requiere autenticación.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre del evento.' },
          { name: 'date', type: 'date', required: true, description: 'Fecha del evento.' },
          { name: 'hours_reduction', type: 'numeric', required: true, description: 'Horas que se reducen de la capacidad.' },
          { name: 'affected_employee_ids', type: 'jsonb', required: true, description: 'Array de UUIDs de empleados afectados.' },
          { name: 'description', type: 'text', required: false, description: 'Descripción del evento.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('team_events')
  .select('id, name, date, hours_reduction, affected_employee_ids')
  .gte('date', '2026-02-01')
  .lte('date', '2026-02-28')`,
          insert: `const { data } = await timeboxing
  .from('team_events')
  .insert({
    name: 'Día de la Constitución',
    date: '2026-12-06',
    hours_reduction: 8,
    affected_employee_ids: [employeeId1, employeeId2]
  })
  .select()
  .single()`,
        },
      },
      {
        name: 'global_assignments',
        description: 'Asignaciones globales de horas por mes que afectan la capacidad (formaciones recurrentes, reuniones fijas, etc.).',
        authNote: 'Requiere autenticación. Filtra por agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'month', type: 'varchar', required: true, description: 'Mes en formato YYYY-MM.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre de la asignación global.' },
          { name: 'hours', type: 'numeric', required: true, description: 'Horas mensuales reservadas.' },
          { name: 'affects_all', type: 'boolean', required: false, default: 'true', description: 'Si afecta a todos los empleados.' },
          { name: 'affected_employee_ids', type: 'jsonb', required: false, default: "'[]'", description: 'Array de UUIDs afectados (si no es global).' },
          { name: 'employee_id', type: 'uuid', required: false, fk: 'employees(id)', description: 'Empleado específico (si es individual).' },
          { name: 'agency_id', type: 'uuid', required: false, fk: 'agencies(id)', description: 'Agencia.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
          { name: 'updated_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('global_assignments')
  .select('*')
  .eq('agency_id', agencyId)
  .eq('month', '2026-02')`,
          insert: `const { data } = await timeboxing
  .from('global_assignments')
  .insert({
    month: '2026-03',
    name: 'Formación mensual',
    hours: 4,
    affects_all: true,
    agency_id: agencyId
  })
  .select()
  .single()`,
        },
      },
    ],
  },
  {
    group: 'Configuración',
    icon: Shield,
    tables: [
      {
        name: 'department_config',
        description: 'Configuración por departamento: vista por defecto, día y hora de cierre semanal.',
        authNote: 'Requiere autenticación. Filtra por agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia.' },
          { name: 'department_name', type: 'text', required: true, description: 'Nombre del departamento.' },
          { name: 'default_view', type: 'text', required: false, default: "'weekly'", description: 'Vista por defecto (weekly).' },
          { name: 'is_view_strict', type: 'boolean', required: false, default: 'false', description: 'Fuerza la vista; no permite cambiarla.' },
          { name: 'closing_day', type: 'integer', required: false, default: '3', check: '0-6 (0=domingo)', description: 'Día de cierre semanal (0=dom, 1=lun...6=sáb).' },
          { name: 'closing_hour', type: 'integer', required: false, default: '10', check: '0-23', description: 'Hora de cierre (0-23).' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
          { name: 'updated_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('department_config')
  .select('*')
  .eq('agency_id', agencyId)`,
          insert: `const { data } = await timeboxing
  .from('department_config')
  .insert({
    agency_id: agencyId,
    department_name: 'Desarrollo',
    closing_day: 4,
    closing_hour: 14
  })
  .select()
  .single()`,
        },
      },
      {
        name: 'client_settings',
        description: 'Ajustes avanzados por cliente: límite de presupuesto, agrupación, visibilidad.',
        authNote: 'Requiere autenticación.',
        columns: [
          { name: 'client_id', type: 'text', required: true, pk: true, description: 'ID del cliente (clave primaria).' },
          { name: 'budget_limit', type: 'numeric', required: false, default: '0', description: 'Límite de presupuesto total.' },
          { name: 'group_name', type: 'text', required: false, description: 'Nombre de grupo para agrupar clientes.' },
          { name: 'is_hidden', type: 'boolean', required: false, default: 'false', description: 'Oculto en vistas generales.' },
          { name: 'is_sales_account', type: 'boolean', required: false, default: 'true', description: 'Si es una cuenta comercial.' },
          { name: 'updated_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('client_settings')
  .select('*')
  .eq('client_id', clientId)`,
          insert: `const { data } = await timeboxing
  .from('client_settings')
  .upsert({
    client_id: clientId,
    budget_limit: 5000,
    group_name: 'Premium'
  })
  .select()
  .single()`,
        },
      },
    ],
  },
  {
    group: 'Feedback',
    icon: FileJson,
    tables: [
      {
        name: 'weekly_feedback',
        description: 'Feedback semanal sobre asignaciones: permite reportar bloqueos, problemas de estimación u otros motivos.',
        authNote: 'Requiere autenticación.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que reporta.' },
          { name: 'week_start_date', type: 'date', required: true, description: 'Lunes de la semana (YYYY-MM-DD).' },
          { name: 'project_id', type: 'uuid', required: false, fk: 'projects(id)', description: 'Proyecto afectado.' },
          { name: 'allocation_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Asignación concreta.' },
          { name: 'reason', type: 'text', required: false, check: "IN ('technical_issue','client_blocker','bad_estimation','personal_absence','other')", description: 'Tipo de problema.' },
          { name: 'comments', type: 'text', required: false, description: 'Comentarios adicionales.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('weekly_feedback')
  .select('id, employee_id, week_start_date, reason, comments')
  .eq('employee_id', employeeId)
  .eq('week_start_date', '2026-02-17')`,
          insert: `const { data } = await timeboxing
  .from('weekly_feedback')
  .insert({
    employee_id: employeeId,
    week_start_date: '2026-02-17',
    project_id: projectId,
    reason: 'client_blocker',
    comments: 'Esperando aprobación del cliente'
  })
  .select()
  .single()`,
        },
      },
    ],
  },
  {
    group: 'Objetivos',
    icon: Zap,
    tables: [
      {
        name: 'professional_goals',
        description: 'Objetivos profesionales de cada empleado con resultados clave, acciones y progreso.',
        authNote: 'Requiere autenticación.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado propietario.' },
          { name: 'title', type: 'text', required: true, description: 'Título del objetivo.' },
          { name: 'key_results', type: 'jsonb', required: false, description: 'Resultados clave asociados.' },
          { name: 'actions', type: 'text', required: false, description: 'Acciones concretas para lograrlo.' },
          { name: 'training_url', type: 'text', required: false, description: 'URL de recurso formativo.' },
          { name: 'start_date', type: 'date', required: false, description: 'Fecha de inicio.' },
          { name: 'due_date', type: 'date', required: false, description: 'Fecha objetivo.' },
          { name: 'progress', type: 'integer', required: false, default: '0', description: 'Progreso 0-100.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('professional_goals')
  .select('*')
  .eq('employee_id', employeeId)
  .order('due_date')`,
          insert: `const { data } = await timeboxing
  .from('professional_goals')
  .insert({
    employee_id: employeeId,
    title: 'Certificación Google Ads',
    start_date: '2026-01-01',
    due_date: '2026-06-30',
    progress: 0
  })
  .select()
  .single()`,
        },
      },
      {
        name: 'user_routines',
        description: 'Rutinas recurrentes del empleado (daily standups, revisiones, etc.).',
        authNote: 'Requiere autenticación.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado propietario.' },
          { name: 'title', type: 'text', required: true, description: 'Nombre de la rutina.' },
          { name: 'estimated_minutes', type: 'integer', required: false, default: '30', description: 'Duración estimada en minutos.' },
          { name: 'project_id', type: 'uuid', required: false, fk: 'projects(id)', description: 'Proyecto asociado (opcional).' },
          { name: 'is_active', type: 'boolean', required: false, default: 'true', description: 'Si la rutina está activa.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('user_routines')
  .select('*')
  .eq('employee_id', employeeId)
  .eq('is_active', true)`,
          insert: `const { data } = await timeboxing
  .from('user_routines')
  .insert({
    employee_id: employeeId,
    title: 'Daily standup',
    estimated_minutes: 15
  })
  .select()
  .single()`,
        },
      },
    ],
  },
  {
    group: 'Bloqueos de edición',
    icon: Lock,
    tables: [
      {
        name: 'project_editing_locks',
        description: 'Bloqueos temporales (5 min) para evitar conflictos de edición concurrente en un proyecto/mes.',
        authNote: 'Requiere autenticación. El lock expira automáticamente.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador único.' },
          { name: 'project_id', type: 'uuid', required: true, fk: 'projects(id)', description: 'Proyecto bloqueado.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que posee el lock.' },
          { name: 'month', type: 'varchar', required: true, description: 'Mes bloqueado (YYYY-MM).' },
          { name: 'locked_at', type: 'timestamptz', required: false, default: 'now()', description: 'Inicio del bloqueo.' },
          { name: 'expires_at', type: 'timestamptz', required: false, default: "now() + 5min", description: 'Expiración automática (5 minutos).' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('project_editing_locks')
  .select('*')
  .eq('project_id', projectId)
  .eq('month', '2026-02')
  .gt('expires_at', new Date().toISOString())`,
          insert: `const { data } = await timeboxing
  .from('project_editing_locks')
  .insert({
    project_id: projectId,
    employee_id: employeeId,
    month: '2026-02'
  })
  .select()
  .single()`,
        },
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   UI COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-all duration-150"
      title="Copiar código"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CodeBlock({ children, lang = 'typescript' }: { children: string; lang?: string }) {
  return (
    <div className="relative group">
      <div className="absolute top-0 left-0 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-800/50 rounded-br-lg">{lang}</div>
      <CopyButton text={children} />
      <pre className="p-4 pt-8 rounded-lg bg-slate-950 border border-white/10 text-sm text-slate-200 overflow-x-auto font-mono leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function MethodBadge({ method }: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE' }) {
  const colors = {
    GET: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    POST: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    PATCH: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    DELETE: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border', colors[method])}>
      {method}
    </span>
  );
}

function EndpointBlock({ method, path, description, curlExample, sdkExample }: {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  curlExample: string;
  sdkExample: string;
}) {
  const [tab, setTab] = useState<'curl' | 'sdk'>('sdk');
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <MethodBadge method={method} />
          <code className="text-sm font-mono text-slate-200">{path}</code>
        </div>
        <p className="text-sm text-indigo-200/80">{description}</p>
      </div>
      <div className="border-b border-white/10 flex">
        <button onClick={() => setTab('sdk')} className={cn('px-4 py-2 text-xs font-medium transition-colors', tab === 'sdk' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white')}>
          JavaScript SDK
        </button>
        <button onClick={() => setTab('curl')} className={cn('px-4 py-2 text-xs font-medium transition-colors', tab === 'curl' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white')}>
          cURL
        </button>
      </div>
      <div className="p-3">
        {tab === 'sdk' ? <CodeBlock lang="typescript">{sdkExample}</CodeBlock> : <CodeBlock lang="bash">{curlExample}</CodeBlock>}
      </div>
    </div>
  );
}

function ParamTable({ columns }: { columns: ColumnDef[] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/15">
            <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider">Campo</th>
            <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider">Tipo</th>
            <th className="text-center py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider">Requerido</th>
            <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">Default</th>
            <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Relación</th>
            <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col, i) => (
            <tr key={col.name} className={cn('border-b border-white/5', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
              <td className="py-2 px-3 font-mono text-white text-xs whitespace-nowrap">
                {col.name}
                {col.pk && <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-sans">PK</span>}
              </td>
              <td className="py-2 px-3 font-mono text-purple-300 text-xs whitespace-nowrap">{col.type}</td>
              <td className="py-2 px-3 text-center text-xs">
                {col.required ? <span className="text-rose-400">Sí</span> : <span className="text-slate-500">No</span>}
              </td>
              <td className="py-2 px-3 font-mono text-slate-400 text-[11px] hidden lg:table-cell whitespace-nowrap">
                {col.default || '—'}
              </td>
              <td className="py-2 px-3 font-mono text-cyan-300/80 text-[11px] hidden md:table-cell whitespace-nowrap">
                {col.fk || '—'}
              </td>
              <td className="py-2 px-3 text-indigo-100/80 text-xs leading-relaxed">
                {col.description}
                {col.check && <span className="ml-1 text-[10px] text-amber-300/70">({col.check})</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuthBadge({ note }: { note: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
      <Lock className="h-3 w-3" />
      {note}
    </div>
  );
}

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="scroll-mt-24" />;
}

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR TOC
   ═══════════════════════════════════════════════════════════════════ */

function SidebarTOC({ activeSection }: { activeSection: string }) {
  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <nav className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60 mb-3 px-3">Contenido</p>
      {TOC_SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => handleClick(id)}
          className={cn(
            'w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2',
            activeSection === id
              ? 'text-white bg-white/10 font-medium'
              : 'text-indigo-200/60 hover:text-white hover:bg-white/5'
          )}
        >
          {activeSection === id && <span className="w-0.5 h-4 bg-indigo-400 rounded-full shrink-0" />}
          {label}
        </button>
      ))}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCROLL SPY HOOK
   ═══════════════════════════════════════════════════════════════════ */

function useScrollSpy() {
  const [activeSection, setActiveSection] = useState('intro');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const sorted = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveSection(sorted[0].target.id);
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );

    const ids = TOC_SECTIONS.map(s => s.id);
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return activeSection;
}

/* ═══════════════════════════════════════════════════════════════════
   ERROR CODES TABLE
   ═══════════════════════════════════════════════════════════════════ */

const ERROR_CODES = [
  { code: 200, meaning: 'OK', description: 'Solicitud exitosa. Se devuelven los datos solicitados.' },
  { code: 201, meaning: 'Created', description: 'Recurso creado correctamente (POST con Prefer: return=representation).' },
  { code: 204, meaning: 'No Content', description: 'Operación exitosa sin cuerpo de respuesta (DELETE, PATCH sin return).' },
  { code: 400, meaning: 'Bad Request', description: 'Parámetros inválidos, tipo de dato incorrecto o violación de constraint.' },
  { code: 401, meaning: 'Unauthorized', description: 'API key ausente o token de sesión expirado.' },
  { code: 403, meaning: 'Forbidden', description: 'El usuario no tiene permisos RLS para este recurso.' },
  { code: 404, meaning: 'Not Found', description: 'Recurso no encontrado o ruta inválida.' },
  { code: 409, meaning: 'Conflict', description: 'Violación de constraint UNIQUE o conflicto de datos.' },
  { code: 500, meaning: 'Server Error', description: 'Error interno del servidor. Contacta soporte si persiste.' },
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function ApiDocsPage() {
  const activeSection = useScrollSpy();
  const isMobile = useIsMobile();

  return (
    <>
      <Helmet>
        <title>Documentación API - Timeboxing</title>
        <meta name="description" content="Documentación de la API de integración de Timeboxing. Conecta tus herramientas con datos de planificación, equipo y proyectos." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative">
        {/* Background effects (overflow-hidden solo aquí, no en el padre, para no romper sticky) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        </div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        {/* Header */}
        <div className="relative z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur-xl sticky top-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="icon" className="bg-transparent border-0 text-white hover:bg-white/10">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 bg-indigo-950 border-white/10 p-6">
                    <SheetTitle className="text-white text-lg font-bold mb-6">Navegación</SheetTitle>
                    <SidebarTOC activeSection={activeSection} />
                  </SheetContent>
                </Sheet>
              )}
              <Link to="/">
                <Button size="icon" className="bg-transparent border-0 text-white hover:bg-white/10 rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-white">
                <Code className="h-4 w-4 text-indigo-300" />
                <span className="font-semibold text-sm">API Docs</span>
              </div>
            </div>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white text-sm hover:from-indigo-500 hover:to-purple-500 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200">
                Acceder a la app
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Content with sidebar */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar (desktop only) */}
            {!isMobile && (
              <aside className="w-56 shrink-0">
                <div className="sticky top-20">
                  <SidebarTOC activeSection={activeSection} />
                </div>
              </aside>
            )}

            {/* Main content */}
            <main className="flex-1 min-w-0 space-y-16">

              {/* ── SECTION: Intro ── */}
              <section>
                <SectionAnchor id="intro" />
                <div className="mb-8">
                  <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">API de Integración</h1>
                  <p className="text-lg text-indigo-200/90 max-w-2xl">
                    Integra los datos de planificación, equipo y proyectos de tu agencia en Timeboxing directamente con tus herramientas internas.
                  </p>
                </div>

                {/* Generar token */}
                <Card className="border-2 border-indigo-300/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl mb-6 shadow-xl shadow-indigo-950/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg">
                        <Key className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">Genera tu token API</h3>
                        <p className="text-slate-700 dark:text-white/95 text-sm leading-relaxed mb-3">
                          Los administradores de cada agencia pueden crear sus propios tokens de acceso directamente desde la sección <strong>API & Integraciones</strong> dentro de la app.
                          Cada token está vinculado a tu <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/20 font-mono text-xs text-slate-800 dark:text-white">agency_id</code> y protegido por políticas RLS (Row Level Security).
                        </p>
                        <p className="text-slate-600 dark:text-white/85 text-xs leading-relaxed mb-3">
                          Todas las operaciones están limitadas a los datos de tu agencia. No es posible acceder a datos de otras agencias.
                        </p>
                        <Link to="/api-keys">
                          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white text-sm hover:from-indigo-500 hover:to-purple-500">
                            <Key className="h-4 w-4 mr-2" />
                            Ir a API & Integraciones
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <h3 className="text-white font-semibold mb-4">Casos de uso</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { icon: Database, text: 'Sincronizar proyectos y empleados con tu ERP o CRM' },
                        { icon: FileJson, text: 'Consultar horas asignadas y reales por semana o mes' },
                        { icon: Zap, text: 'Crear ausencias y eventos del equipo automáticamente' },
                        { icon: Filter, text: 'Generar reportes personalizados con datos de planificación' },
                        { icon: Terminal, text: 'Automatizar la creación de asignaciones desde scripts' },
                        { icon: Shield, text: 'Recibir cambios en tiempo real vía suscripciones Realtime' },
                      ].map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <Icon className="h-4 w-4 text-indigo-300 mt-0.5 shrink-0" />
                          <span className="text-sm text-indigo-100/85">{text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* ── SECTION: Base URL ── */}
              <section>
                <SectionAnchor id="base-url" />
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Globe className="h-6 w-6 text-indigo-300" /> Base URL y headers
                </h2>
                <p className="text-indigo-100/85 mb-4">
                  Todas las peticiones van contra la URL de la API de Timeboxing. Necesitas la <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-indigo-200">ANON_KEY</code> de tu instancia Supabase (la misma que usa la app) y un <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-indigo-200">API_TOKEN</code> que puedes generar desde la sección <strong>API & Integraciones</strong>.
                </p>
                <CodeBlock lang="bash">{`# URL base de la API de Timeboxing
http://supabase.peypons.duckdns.org/rest/v1/

# Headers obligatorios en cada petición
apikey: <ANON_KEY>                      # Clave anónima de tu instancia Supabase
Authorization: Bearer <TU_API_TOKEN>    # Token generado en API & Integraciones
Content-Type: application/json
Prefer: return=representation           # Para recibir el objeto creado/modificado`}</CodeBlock>
                <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-100/90">
                      <strong className="text-amber-300">Importante:</strong> Tu token está vinculado a tu <code className="px-1 rounded bg-white/10 font-mono text-xs">agency_id</code> mediante un JWT firmado. Solo podrás leer y escribir datos de tu propia agencia gracias a las políticas RLS. Si necesitas revocar un token, hazlo desde la sección API & Integraciones.
                    </p>
                  </div>
                </div>
              </section>

              {/* ── SECTION: Auth ── */}
              <section>
                <SectionAnchor id="auth" />
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Key className="h-6 w-6 text-indigo-300" /> Autenticación
                </h2>
                <p className="text-indigo-100/85 mb-6">
                  Para usar la API necesitas dos valores en los headers de cada petición:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <Card className="border border-white/10 bg-white/5">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">HEADER</span>
                        <code className="text-white font-medium text-sm font-mono">apikey</code>
                      </div>
                      <p className="text-xs text-indigo-200/70 leading-relaxed">
                        La clave anónima (<code className="text-indigo-200 bg-white/10 px-1 rounded font-mono">ANON_KEY</code>) de tu instancia Supabase. Es la misma que usa la aplicación web. Se envía en el header <code className="text-indigo-200 bg-white/10 px-1 rounded font-mono">apikey</code>.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border border-white/10 bg-white/5">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">HEADER</span>
                        <code className="text-white font-medium text-sm font-mono">Authorization</code>
                      </div>
                      <p className="text-xs text-indigo-200/70 leading-relaxed">
                        Token JWT generado desde <Link to="/api-keys" className="text-indigo-300 underline hover:text-white">API & Integraciones</Link>. Contiene el <code className="text-indigo-200 bg-white/10 px-1 rounded font-mono">agency_id</code> de tu agencia. Se envía como <code className="text-indigo-200 bg-white/10 px-1 rounded font-mono">Bearer &lt;token&gt;</code>.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <h3 className="text-white font-semibold mb-3">¿Cómo obtener un token?</h3>
                <div className="mb-6 space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0">1</span>
                    <span className="text-sm text-indigo-100/85">Inicia sesión en Timeboxing como administrador de tu agencia.</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0">2</span>
                    <span className="text-sm text-indigo-100/85">Ve a <strong>Configuración → API & Integraciones</strong> en el menú lateral.</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0">3</span>
                    <span className="text-sm text-indigo-100/85">Haz clic en <strong>Crear token</strong>, asigna un nombre descriptivo y elige los permisos (lectura o lectura/escritura).</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0">4</span>
                    <span className="text-sm text-indigo-100/85">Copia el token JWT que se muestra. <strong>Solo se muestra una vez</strong>; guárdalo en un lugar seguro.</span>
                  </div>
                </div>

                <h3 className="text-white font-semibold mb-3">Ejemplo de petición autenticada</h3>
                <CodeBlock lang="bash">{`curl -X GET \\
  'http://supabase.peypons.duckdns.org/rest/v1/employees?is_active=eq.true' \\
  -H 'apikey: <ANON_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>' \\
  -H 'Content-Type: application/json'`}</CodeBlock>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                      <div className="text-sm text-indigo-100/90">
                        <strong className="text-indigo-300">Row Level Security (RLS):</strong> Las políticas RLS de la base de datos garantizan que solo puedes acceder a datos de tu agencia. El token JWT contiene el <code className="px-1 rounded bg-white/10 font-mono text-xs">agency_id</code> y PostgREST lo verifica automáticamente.
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                      <div className="text-sm text-amber-100/90">
                        <strong className="text-amber-300">Seguridad:</strong> No compartas tus tokens en repositorios públicos. Si sospechas que un token ha sido comprometido, revócalo inmediatamente desde API & Integraciones y crea uno nuevo.
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── SECTION: SDK ── */}
              <section>
                <SectionAnchor id="sdk" />
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Terminal className="h-6 w-6 text-indigo-300" /> SDK JavaScript (opcional)
                </h2>
                <p className="text-indigo-100/85 mb-4">
                  Puedes integrar la API mediante peticiones HTTP estándar (ver sección REST) o, si trabajas con JavaScript/TypeScript, usar el SDK que simplifica las consultas con una sintaxis más legible.
                </p>
                <CodeBlock lang="bash">{`npm install @supabase/supabase-js`}</CodeBlock>
                <div className="mt-4" />
                <CodeBlock lang="typescript">{`import { createClient } from '@supabase/supabase-js'

// URL de tu instancia Supabase + clave anónima (la misma que usa la app)
const SUPABASE_URL = 'http://supabase.peypons.duckdns.org'
const ANON_KEY = process.env.SUPABASE_ANON_KEY

// Token API generado desde API & Integraciones
const API_TOKEN = process.env.TIMEBOXING_API_TOKEN

const timeboxing = createClient(SUPABASE_URL, ANON_KEY, {
  global: {
    headers: { Authorization: \`Bearer \${API_TOKEN}\` }
  }
})

// Ejemplo: listar empleados activos de tu agencia
// (RLS filtra automáticamente por tu agency_id)
const { data: employees, error } = await timeboxing
  .from('employees')
  .select('id, name, role, email')
  .eq('is_active', true)
  .order('name')

if (error) {
  console.error('Error:', error.message)
} else {
  console.log('Empleados:', employees)
}`}</CodeBlock>
                <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-start gap-2">
                    <Terminal className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-indigo-100/90">
                      <strong className="text-indigo-300">Nota:</strong> No necesitas filtrar por <code className="px-1 rounded bg-white/10 font-mono text-xs">agency_id</code> en cada consulta: tu token JWT contiene el <code className="px-1 rounded bg-white/10 font-mono text-xs">agency_id</code> de tu agencia y las políticas RLS lo aplican automáticamente a nivel de base de datos.
                    </p>
                  </div>
                </div>
              </section>

              {/* ── SECTION: REST ── */}
              <section>
                <SectionAnchor id="rest" />
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Plug className="h-6 w-6 text-indigo-300" /> API REST (HTTP)
                </h2>
                <p className="text-indigo-100/85 mb-6">
                  Puedes hacer peticiones HTTP directas desde cualquier lenguaje. Todos los recursos siguen el mismo patrón RESTful.
                </p>
                <div className="space-y-6">
                  <EndpointBlock
                    method="GET"
                    path="/rest/v1/{recurso}?select=col1,col2&filtro=eq.valor"
                    description="Listar recursos con filtros opcionales. Soporta select, filtros, paginación y orden."
                    curlExample={`curl -X GET \\
  'http://supabase.peypons.duckdns.org/rest/v1/employees?is_active=eq.true&order=name.asc' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>'`}
                    sdkExample={`const { data, error } = await timeboxing
  .from('employees')
  .select('id, name, role')
  .eq('is_active', true)
  .order('name')`}
                  />
                  <EndpointBlock
                    method="POST"
                    path="/rest/v1/{recurso}"
                    description="Crear un nuevo recurso. Envía el body como JSON."
                    curlExample={`curl -X POST \\
  'http://supabase.peypons.duckdns.org/rest/v1/allocations' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -H 'Prefer: return=representation' \\
  -d '{"employee_id":"...","project_id":"...","week_start_date":"2026-02-17","hours_assigned":8}'`}
                    sdkExample={`const { data, error } = await timeboxing
  .from('allocations')
  .insert({
    employee_id: employeeId,
    project_id: projectId,
    week_start_date: '2026-02-17',
    hours_assigned: 8
  })
  .select()
  .single()`}
                  />
                  <EndpointBlock
                    method="PATCH"
                    path="/rest/v1/{recurso}?id=eq.{uuid}"
                    description="Actualizar uno o varios campos de un recurso existente."
                    curlExample={`curl -X PATCH \\
  'http://supabase.peypons.duckdns.org/rest/v1/allocations?id=eq.<UUID>' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -H 'Prefer: return=representation' \\
  -d '{"hours_assigned":16}'`}
                    sdkExample={`const { data, error } = await timeboxing
  .from('allocations')
  .update({ hours_assigned: 16 })
  .eq('id', allocationId)
  .select()
  .single()`}
                  />
                  <EndpointBlock
                    method="DELETE"
                    path="/rest/v1/{recurso}?id=eq.{uuid}"
                    description="Eliminar un recurso. No se puede deshacer."
                    curlExample={`curl -X DELETE \\
  'http://supabase.peypons.duckdns.org/rest/v1/allocations?id=eq.<UUID>' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>'`}
                    sdkExample={`const { error } = await timeboxing
  .from('allocations')
  .delete()
  .eq('id', allocationId)`}
                  />
                </div>
              </section>

              {/* ── SECTION: Filtering ── */}
              <section>
                <SectionAnchor id="filtering" />
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Filter className="h-6 w-6 text-indigo-300" /> Filtrado, paginación y ordenación
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-semibold mb-3">Operadores de filtro</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/15">
                            <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">Operador</th>
                            <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">SDK</th>
                            <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">HTTP</th>
                            <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">Descripción</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono text-xs">
                          {[
                            ['Igual', '.eq(col, val)', 'col=eq.val', 'Coincidencia exacta'],
                            ['Distinto', '.neq(col, val)', 'col=neq.val', 'No igual'],
                            ['Mayor que', '.gt(col, val)', 'col=gt.val', 'Estrictamente mayor'],
                            ['Mayor o igual', '.gte(col, val)', 'col=gte.val', 'Mayor o igual'],
                            ['Menor que', '.lt(col, val)', 'col=lt.val', 'Estrictamente menor'],
                            ['Menor o igual', '.lte(col, val)', 'col=lte.val', 'Menor o igual'],
                            ['Contiene texto', '.like(col, pattern)', 'col=like.%val%', 'LIKE (case sensitive)'],
                            ['Contiene (no case)', '.ilike(col, pattern)', 'col=ilike.%val%', 'ILIKE (case insensitive)'],
                            ['En lista', '.in(col, [a,b])', 'col=in.(a,b)', 'IN (lista de valores)'],
                            ['Es nulo', '.is(col, null)', 'col=is.null', 'IS NULL'],
                          ].map(([op, sdk, http, desc], i) => (
                            <tr key={i} className={cn('border-b border-white/5', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
                              <td className="py-2 px-3 text-white font-sans font-medium">{op}</td>
                              <td className="py-2 px-3 text-purple-300">{sdk}</td>
                              <td className="py-2 px-3 text-cyan-300">{http}</td>
                              <td className="py-2 px-3 text-indigo-200/70 font-sans">{desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-3">Paginación</h3>
                    <CodeBlock lang="typescript">{`// SDK: limit + offset (más range)
const { data } = await timeboxing
  .from('allocations')
  .select('*', { count: 'exact' })  // count total de filas
  .range(0, 24)                      // primeras 25 filas (0-indexado)

// HTTP: header Range
// Range: 0-24`}</CodeBlock>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-3">Ordenación</h3>
                    <CodeBlock lang="typescript">{`// SDK
const { data } = await timeboxing
  .from('employees')
  .select('*')
  .order('name', { ascending: true })
  .order('created_at', { ascending: false })

// HTTP: order=name.asc,created_at.desc`}</CodeBlock>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-3">Ejemplo completo</h3>
                    <p className="text-indigo-100/80 text-sm mb-3">Obtener asignaciones de febrero 2026 para un empleado, ordenadas por fecha:</p>
                    <CodeBlock lang="typescript">{`const { data, error, count } = await timeboxing
  .from('allocations')
  .select('id, project_id, week_start_date, hours_assigned, task_name, status', { count: 'exact' })
  .eq('employee_id', employeeId)
  .gte('week_start_date', '2026-02-01')
  .lte('week_start_date', '2026-02-28')
  .eq('status', 'planned')
  .order('week_start_date')
  .range(0, 49)

// count = número total de resultados (paginación)
// data = array de asignaciones`}</CodeBlock>
                  </div>
                </div>
              </section>

              {/* ── SECTION: Realtime ── */}
              <section>
                <SectionAnchor id="realtime" />
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Zap className="h-6 w-6 text-indigo-300" /> Suscripciones Realtime
                </h2>
                <p className="text-indigo-100/85 mb-4">
                  Recibe cambios en tiempo real sin polling. Ideal para dashboards que se actualizan automáticamente cuando alguien modifica una asignación o crea una ausencia.
                </p>
                <CodeBlock lang="typescript">{`// Escuchar cambios en asignaciones de un proyecto (requiere SDK)
const channel = timeboxing
  .channel('project-allocations')
  .on(
    'postgres_changes',
    {
      event: '*',           // INSERT, UPDATE, DELETE (o uno específico)
      schema: 'public',
      table: 'allocations',
      filter: \`project_id=eq.\${projectId}\`
    },
    (payload) => {
      console.log('Cambio detectado:', payload.eventType, payload.new)
      // payload.new = fila después del cambio
      // payload.old = fila antes del cambio (solo en UPDATE/DELETE)
    }
  )
  .subscribe()

// Desuscribirse cuando ya no sea necesario
timeboxing.removeChannel(channel)`}</CodeBlock>
                <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-indigo-100/90">
                      <strong className="text-indigo-300">Nota:</strong> Realtime está habilitado en las tablas principales (allocations, employees, projects). Si necesitas suscripciones en otras tablas, contacta con nuestro equipo.
                    </p>
                  </div>
                </div>
              </section>

              {/* ── SECTION: Errors ── */}
              <section>
                <SectionAnchor id="errors" />
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-indigo-300" /> Manejo de errores
                </h2>
                <p className="text-indigo-100/85 mb-4">
                  La API devuelve errores estructurados. Siempre verifica el campo <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-indigo-200">error</code> en la respuesta del SDK o el status HTTP en peticiones directas.
                </p>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/15">
                        <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs w-20">Código</th>
                        <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs w-28">Estado</th>
                        <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ERROR_CODES.map((ec, i) => (
                        <tr key={ec.code} className={cn('border-b border-white/5', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
                          <td className="py-2 px-3 font-mono text-white font-bold">{ec.code}</td>
                          <td className="py-2 px-3 text-xs">
                            <span className={cn('px-2 py-0.5 rounded-full font-medium', ec.code < 300 ? 'bg-emerald-500/20 text-emerald-300' : ec.code < 500 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300')}>
                              {ec.meaning}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-indigo-100/80 text-xs">{ec.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <h3 className="text-white font-semibold mb-3">Formato de error</h3>
                <CodeBlock lang="json">{`{
  "message": "new row violates row-level security policy",
  "details": null,
  "hint": null,
  "code": "42501"
}`}</CodeBlock>
                <div className="mt-4" />
                <h3 className="text-white font-semibold mb-3">Patrón recomendado (SDK)</h3>
                <CodeBlock lang="typescript">{`const { data, error } = await timeboxing
  .from('allocations')
  .insert({ /* ... */ })
  .select()
  .single()

if (error) {
  // error.message  → descripción legible
  // error.code     → código PostgreSQL
  // error.details  → detalles adicionales (puede ser null)
  console.error(\`Error [\${error.code}]: \${error.message}\`)
  throw error
}

// data contiene el recurso creado`}</CodeBlock>
              </section>

              {/* ── SECTION: Resources ── */}
              <section>
                <SectionAnchor id="resources" />
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <Database className="h-6 w-6 text-indigo-300" /> Referencia de recursos
                </h2>
                <p className="text-indigo-100/85 mb-8">
                  Referencia detallada de los recursos disponibles a través de la API, organizados por dominio funcional.
                </p>

                {TABLE_GROUPS.map(({ group, icon: GroupIcon, tables }) => (
                  <div key={group} className="mb-12">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2.5">
                      <GroupIcon className="h-5 w-5 text-indigo-300" />
                      {group}
                    </h3>
                    <div className="space-y-8">
                      {tables.map((table) => (
                        <Card key={table.name} className="border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
                          <div className="p-5 border-b border-white/10">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h4 className="text-white font-bold font-mono text-lg">{table.name}</h4>
                              <AuthBadge note={table.authNote} />
                            </div>
                            <p className="text-sm text-indigo-200/80">{table.description}</p>
                          </div>
                          <CardContent className="p-5 space-y-5">
                            <div>
                              <h5 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                                <ChevronRight className="h-3.5 w-3.5 text-indigo-400" /> Columnas
                              </h5>
                              <ParamTable columns={table.columns} />
                            </div>
                            <div className="grid lg:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                  <MethodBadge method="GET" /> <span>Consultar</span>
                                </h5>
                                <CodeBlock lang="typescript">{table.examples.select}</CodeBlock>
                              </div>
                              <div>
                                <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                  <MethodBadge method="POST" /> <span>Crear</span>
                                </h5>
                                <CodeBlock lang="typescript">{table.examples.insert}</CodeBlock>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              {/* Footer links */}
              <div className="pt-8 border-t border-white/10 flex flex-wrap gap-4">
                <Link to="/guia">
                  <Button className="border-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Guía de funcionalidades
                  </Button>
                </Link>
                <Link to="/">
                  <Button className="border-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    Volver al inicio
                  </Button>
                </Link>
              </div>

            </main>
          </div>
        </div>
      </div>
    </>
  );
}
