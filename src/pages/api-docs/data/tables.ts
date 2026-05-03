import {
  Globe,
  FileJson,
  ArrowRight,
  AlertTriangle,
  Shield,
  Zap,
  Lock,
} from 'lucide-react';
import type { TableGroup, ErrorCode } from './types';

export const TABLE_GROUPS: TableGroup[] = [
  {
    anchorId: 'res-organizacion',
    group: 'Organizacion',
    icon: Globe,
    tables: [
      {
        name: 'agencies',
        description:
          'Cada agencia es un tenant aislado. Todos los recursos se asocian a una agencia. Solo lectura via API: la creacion de agencias se realiza desde la app (registro/onboarding).',
        authNote: 'Requiere autenticacion. Solo puedes acceder a las agencias de tu usuario.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre de la agencia. Debe ser unico.' },
          { name: 'slug', type: 'text', required: true, description: 'Slug URL-friendly. Unico.' },
          { name: 'settings', type: 'jsonb', required: false, default: "'{}'", description: 'Configuracion de la agencia (roles, modulos, branding).' },
          { name: 'setup_completed', type: 'boolean', required: false, default: 'false', description: 'Indica si el onboarding se completo.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de creacion. Auto-generado.' },
          { name: 'updated_at', type: 'timestamptz', required: false, default: 'now()', description: 'Ultima actualizacion. Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('agencies')
  .select('id, name, slug, settings')
  .eq('id', agencyId)
  .single()`,
          insert: `// Las agencias no se crean via API.
// Se gestionan desde la app (registro / onboarding).`,
        },
        responses: {
          getList: `[
  {
    "id": "a1b2c3d4-...",
    "name": "Mi Agencia",
    "slug": "mi-agencia",
    "settings": { "roles": [...], "modules": {...} }
  }
]`,
          getOne: `{
  "id": "a1b2c3d4-...",
  "name": "Mi Agencia",
  "slug": "mi-agencia",
  "settings": { "roles": [...], "modules": {...} },
  "setup_completed": true,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-10T14:22:00Z"
}`,
          post: `// No disponible. Las agencias se crean desde la app.`,
        },
      },
      {
        name: 'employees',
        description:
          'Miembros del equipo. Cada empleado tiene un rol, capacidad semanal y horario laboral.',
        authNote: 'Requiere autenticacion. Filtra por agency_id obligatorio.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre completo del empleado.' },
          { name: 'first_name', type: 'text', required: false, description: 'Nombre.' },
          { name: 'last_name', type: 'text', required: false, description: 'Apellido.' },
          { name: 'email', type: 'text', required: false, description: 'Correo electronico.' },
          { name: 'role', type: 'text', required: true, description: 'Nombre del rol (define permisos).' },
          { name: 'department', type: 'text', required: false, default: "'General'", description: 'Departamento al que pertenece.' },
          { name: 'default_weekly_capacity', type: 'numeric', required: true, description: 'Horas base de trabajo por semana (ej. 40).' },
          { name: 'work_schedule', type: 'jsonb', required: true, description: 'Horas por dia: { monday: 8, tuesday: 8, ... sunday: 0 }.' },
          { name: 'hourly_rate', type: 'numeric', required: false, default: '0', description: 'Coste por hora del empleado.' },
          { name: 'is_active', type: 'boolean', required: false, default: 'true', description: 'Si esta activo. Los inactivos no aparecen en planificacion.' },
          { name: 'avatar_url', type: 'text', required: false, description: 'URL del avatar.' },
          { name: 'user_id', type: 'uuid', required: false, description: 'Vinculacion con usuario de la plataforma. Solo lectura.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia a la que pertenece.' },
          { name: 'department_id', type: 'uuid', required: false, fk: 'department_config(id)', description: 'Departamento configurado.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de creacion. Auto-generado.' },
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
    name: 'Ana Garcia',
    first_name: 'Ana',
    last_name: 'Garcia',
    email: 'ana@agencia.com',
    role: 'Disenador',
    default_weekly_capacity: 40,
    work_schedule: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 },
    agency_id: agencyId
  })
  .select()
  .single()`,
          curlSelect: `curl -X GET \\
  '<BASE_URL>/employees?select=id,name,role,email,default_weekly_capacity,'\\
  'is_active&agency_id=eq.<AGENCY_ID>&is_active=eq.true&order=name.asc' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>'`,
          curlInsert: `curl -X POST \\
  '<BASE_URL>/employees' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -H 'Prefer: return=representation' \\
  -d '{"name":"Ana Garcia","role":"Disenador","default_weekly_capacity":40,'\\
  '"agency_id":"<AGENCY_ID>","work_schedule":{"monday":8,"tuesday":8,'\\
  '"wednesday":8,"thursday":8,"friday":8,"saturday":0,"sunday":0}}'`,
        },
        responses: {
          getList: `[
  {
    "id": "e1f2a3b4-...",
    "name": "Ana Garcia",
    "role": "Disenador",
    "email": "ana@agencia.com",
    "default_weekly_capacity": 40,
    "is_active": true
  },
  {
    "id": "c5d6e7f8-...",
    "name": "Carlos Lopez",
    "role": "Desarrollador",
    "email": "carlos@agencia.com",
    "default_weekly_capacity": 40,
    "is_active": true
  }
]`,
          getOne: `{
  "id": "e1f2a3b4-...",
  "name": "Ana Garcia",
  "first_name": "Ana",
  "last_name": "Garcia",
  "email": "ana@agencia.com",
  "role": "Disenador",
  "department": "General",
  "default_weekly_capacity": 40,
  "work_schedule": { "monday": 8, "tuesday": 8, "wednesday": 8, "thursday": 8, "friday": 8, "saturday": 0, "sunday": 0 },
  "hourly_rate": 35,
  "is_active": true,
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-01-20T09:00:00Z"
}`,
          post: `{
  "id": "e1f2a3b4-...",
  "name": "Ana Garcia",
  "first_name": "Ana",
  "last_name": "Garcia",
  "email": "ana@agencia.com",
  "role": "Disenador",
  "default_weekly_capacity": 40,
  "work_schedule": { "monday": 8, "tuesday": 8, "wednesday": 8, "thursday": 8, "friday": 8, "saturday": 0, "sunday": 0 },
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'clients',
        description: 'Clientes de la agencia. Cada proyecto pertenece a un cliente.',
        authNote: 'Requiere autenticacion. Filtra por agency_id obligatorio.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre del cliente.' },
          { name: 'color', type: 'text', required: true, description: 'Color hex para representacion visual (ej. #3B82F6).' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia propietaria.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de creacion. Auto-generado.' },
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
        responses: {
          getList: `[
  { "id": "c1d2e3f4-...", "name": "Acme Corp", "color": "#3B82F6" },
  { "id": "a5b6c7d8-...", "name": "StartupXYZ", "color": "#8B5CF6" }
]`,
          getOne: `{
  "id": "c1d2e3f4-...",
  "name": "Acme Corp",
  "color": "#3B82F6",
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-01-10T08:00:00Z"
}`,
          post: `{
  "id": "f9e8d7c6-...",
  "name": "Cliente Ejemplo",
  "color": "#8B5CF6",
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'projects',
        description:
          'Proyectos asociados a un cliente. Contienen las asignaciones de horas del equipo.',
        authNote: 'Requiere autenticacion. Filtra por agency_id obligatorio.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'client_id', type: 'uuid', required: true, fk: 'clients(id)', description: 'Cliente al que pertenece.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre del proyecto.' },
          { name: 'status', type: 'text', required: false, default: "'active'", check: "IN ('active','archived')", description: 'Estado del proyecto.' },
          { name: 'budget_hours', type: 'numeric', required: false, default: '0', description: 'Horas presupuestadas por mes.' },
          { name: 'minimum_hours', type: 'numeric', required: false, default: '0', description: 'Minimo de horas comprometidas.' },
          { name: 'monthly_fee', type: 'numeric', required: false, default: '0', description: 'Tarifa mensual del proyecto (EUR).' },
          { name: 'project_type', type: 'text', required: false, default: "'Mensual'", description: 'Tipo: Mensual, Puntual, etc.' },
          { name: 'deliverable_contract_fee', type: 'numeric', required: false, description: 'Total EUR contrato entregable; NULL = usar monthly_fee como total al prorratear por mes.' },
          { name: 'deliverable_start_date', type: 'date', required: false, description: 'Inicio fase entregable (inclusivo), con deliverable_due_date.' },
          { name: 'deliverable_due_date', type: 'date', required: false, description: 'Fin previsto fase entregable (inclusivo).' },
          { name: 'is_hidden', type: 'boolean', required: false, default: 'false', description: 'Oculto en vistas generales.' },
          { name: 'okrs', type: 'jsonb', required: false, default: "'[]'", description: 'Objetivos y resultados clave del proyecto.' },
          { name: 'deliverables_log', type: 'jsonb', required: false, default: "'{}'", description: 'Registro de entregables.' },
          { name: 'last_meeting_date', type: 'timestamptz', required: false, description: 'Fecha de la ultima reunion con el cliente.' },
          { name: 'external_id', type: 'integer', required: false, description: 'ID externo para integraciones CRM.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia propietaria.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de creacion. Auto-generado.' },
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
    name: 'Campana Q1 2026',
    budget_hours: 120,
    monthly_fee: 3500,
    agency_id: agencyId
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  {
    "id": "p1q2r3s4-...",
    "name": "Campana Q1 2026",
    "client_id": "c1d2e3f4-...",
    "budget_hours": 120,
    "monthly_fee": 3500,
    "status": "active"
  }
]`,
          getOne: `{
  "id": "p1q2r3s4-...",
  "name": "Campana Q1 2026",
  "client_id": "c1d2e3f4-...",
  "status": "active",
  "budget_hours": 120,
  "minimum_hours": 80,
  "monthly_fee": 3500,
  "project_type": "Mensual",
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-01-05T10:00:00Z"
}`,
          post: `{
  "id": "x9y8z7w6-...",
  "name": "Campana Q1 2026",
  "client_id": "c1d2e3f4-...",
  "budget_hours": 120,
  "monthly_fee": 3500,
  "status": "active",
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
    ],
  },
  {
    anchorId: 'res-planificacion',
    group: 'Planificacion',
    icon: FileJson,
    tables: [
      {
        name: 'allocations',
        description:
          'Unidad atomica de planificacion. Cada asignacion vincula un empleado con un proyecto para una semana concreta.',
        authNote: 'Requiere autenticacion. Filtra por agency_id a traves del proyecto.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado asignado.' },
          { name: 'project_id', type: 'uuid', required: true, fk: 'projects(id)', description: 'Proyecto destino.' },
          { name: 'week_start_date', type: 'date', required: true, description: 'Lunes de la semana (YYYY-MM-DD).' },
          { name: 'hours_assigned', type: 'numeric', required: true, description: 'Horas planificadas para la semana.' },
          { name: 'hours_actual', type: 'numeric', required: false, default: '0', description: 'Horas realmente trabajadas (reportadas).' },
          { name: 'hours_computed', type: 'numeric', required: false, default: '0', description: 'Horas calculadas por el sistema.' },
          { name: 'task_name', type: 'text', required: false, description: 'Nombre de la tarea.' },
          { name: 'description', type: 'text', required: false, description: 'Descripcion detallada de la tarea.' },
          { name: 'status', type: 'text', required: false, default: "'planned'", check: "IN ('planned','completed')", description: 'Estado de la asignacion.' },
          { name: 'is_locked', type: 'boolean', required: false, default: 'false', description: 'Si esta bloqueada para edicion.' },
          { name: 'user_priority', type: 'integer', required: false, description: 'Prioridad asignada por el usuario (orden).' },
          { name: 'focus_date', type: 'date', required: false, description: 'Día en que el empleado marca la tarea en foco (vista Mi día); null = backlog. No altera hours_assigned.' },
          { name: 'dependency_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Asignacion de la que depende.' },
          { name: 'parent_allocation_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Asignacion padre (subdivisiones).' },
          { name: 'transferred_from_allocation_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Origen si fue transferida.' },
          { name: 'transfer_source_employee_id', type: 'uuid', required: false, fk: 'employees(id)', description: 'Empleado origen de la transferencia.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de creacion. Auto-generado.' },
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
    task_name: 'Diseno de landing',
    status: 'planned'
  })
  .select()
  .single()`,
          curlSelect: `curl -X GET \\
  '<BASE_URL>/allocations?select=id,employee_id,project_id,week_start_date,'\\
  'hours_assigned,task_name,status&employee_id=eq.<EMPLOYEE_ID>&'\\
  'week_start_date=gte.2026-02-01&week_start_date=lte.2026-02-28&order=week_start_date.asc' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>'`,
          curlInsert: `curl -X POST \\
  '<BASE_URL>/allocations' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -H 'Prefer: return=representation' \\
  -d '{"employee_id":"<EMPLOYEE_ID>","project_id":"<PROJECT_ID>",'\\
  '"week_start_date":"2026-02-17","hours_assigned":8,'\\
  '"task_name":"Diseno de landing","status":"planned"}'`,
        },
        responses: {
          getList: `[
  {
    "id": "al1-...",
    "employee_id": "e1f2a3b4-...",
    "project_id": "p1q2r3s4-...",
    "week_start_date": "2026-02-17",
    "hours_assigned": 8,
    "task_name": "Diseno de landing",
    "status": "planned"
  }
]`,
          getOne: `{
  "id": "al1-...",
  "employee_id": "e1f2a3b4-...",
  "project_id": "p1q2r3s4-...",
  "week_start_date": "2026-02-17",
  "hours_assigned": 8,
  "hours_actual": 0,
  "hours_computed": 0,
  "task_name": "Diseno de landing",
  "status": "planned",
  "is_locked": false,
  "created_at": "2026-02-15T10:00:00Z"
}`,
          post: `{
  "id": "al2-...",
  "employee_id": "e1f2a3b4-...",
  "project_id": "p1q2r3s4-...",
  "week_start_date": "2026-02-17",
  "hours_assigned": 8,
  "task_name": "Diseno de landing",
  "status": "planned",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'deadlines',
        description:
          'Objetivos mensuales por proyecto. Define cuantas horas debe dedicar cada empleado a un proyecto en un mes.',
        authNote: 'Requiere autenticacion. Se filtra por proyecto (que pertenece a una agencia).',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'project_id', type: 'uuid', required: true, fk: 'projects(id)', description: 'Proyecto asociado.' },
          { name: 'month', type: 'varchar', required: true, default: "to_char(now(),'YYYY-MM')", description: 'Mes en formato YYYY-MM.' },
          { name: 'employee_hours', type: 'jsonb', required: false, default: "'{}'", description: 'Mapa { employeeId: horas } con el reparto mensual.' },
          { name: 'budget_override', type: 'numeric', required: false, description: 'Presupuesto personalizado para este mes (sobreescribe el del proyecto).' },
          { name: 'recognized_revenue', type: 'numeric', required: false, description: 'Columna legada; la app no la usa para métricas (ingreso entregable en projects.deliverable_*).' },
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
        responses: {
          getList: `[
  {
    "id": "dl1-...",
    "project_id": "p1q2r3s4-...",
    "month": "2026-02",
    "employee_hours": { "e1f2a3b4-...": 40 },
    "budget_override": null
  }
]`,
          getOne: `{
  "id": "dl1-...",
  "project_id": "p1q2r3s4-...",
  "month": "2026-02",
  "employee_hours": { "e1f2a3b4-...": 40, "c5d6e7f8-...": 20 },
  "budget_override": 100,
  "notes": "Mes de lanzamiento",
  "is_hidden": false,
  "created_at": "2026-02-01T08:00:00Z"
}`,
          post: `{
  "id": "dl2-...",
  "project_id": "p1q2r3s4-...",
  "month": "2026-03",
  "employee_hours": { "e1f2a3b4-...": 40 },
  "budget_override": 100,
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'time_entries',
        description:
          'Registro de horas reales trabajadas por asignacion y dia. Se puede escribir via INSERT o mediante la RPC log_timer_hours (cronómetro de la app). UNIQUE (employee_id, allocation_id, date). RLS: el usuario solo ve sus propias filas.',
        authNote: 'Requiere autenticacion. Filtra por agency_id para listar por agencia; RLS limita a las filas del empleado vinculado al usuario.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Asignacion a la que se imputan las horas.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que registra.' },
          { name: 'date', type: 'date', required: true, description: 'Dia del registro (YYYY-MM-DD).' },
          { name: 'hours', type: 'numeric', required: false, default: '0', check: '>= 0 AND <= 24', description: 'Horas trabajadas (numeric 10,6 para segundos). Máximo por sesión configurable por agencia (timeTrackerMaxHours).' },
          { name: 'notes', type: 'text', required: false, description: 'Notas sobre el trabajo realizado.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia del empleado. Permite filtrar por agencia en API.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
          { name: 'updated_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('time_entries')
  .select('id, allocation_id, date, hours, notes')
  .eq('agency_id', agencyId)
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
    notes: 'Revision de maquetas',
    agency_id: agencyId
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "te1-...", "allocation_id": "al1-...", "date": "2026-02-17", "hours": 4.5, "notes": "Revision de maquetas", "agency_id": "a1b2c3d4-..." }
]`,
          getOne: `{
  "id": "te1-...",
  "allocation_id": "al1-...",
  "employee_id": "e1f2a3b4-...",
  "date": "2026-02-17",
  "hours": 4.5,
  "notes": "Revision de maquetas",
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-17T18:00:00Z"
}`,
          post: `{
  "id": "te2-...",
  "allocation_id": "al1-...",
  "employee_id": "e1f2a3b4-...",
  "date": "2026-02-17",
  "hours": 4.5,
  "notes": "Revision de maquetas",
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-17T18:00:00Z"
}`,
        },
      },
      {
        name: 'active_timers',
        description:
          'Cronómetros activos: un registro por empleado con la tarea (allocation) y hora de inicio. La app usa esta tabla para mostrar y recuperar el timer tras F5. Escritura desde la app; lectura/consulta via API. RLS: cada usuario solo ve su propio timer.',
        authNote: 'Requiere autenticacion. Filtra por agency_id para listar timers de la agencia. RLS limita a la fila del empleado del usuario.',
        columns: [
          { name: 'employee_id', type: 'uuid', required: true, pk: true, fk: 'employees(id)', description: 'Empleado (PK; un timer activo por empleado).' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Tarea en la que está el cronómetro.' },
          { name: 'started_at', type: 'timestamptz', required: true, default: 'now()', description: 'Hora de inicio del cronómetro.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia del empleado. Rellenado por trigger.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('active_timers')
  .select('employee_id, allocation_id, started_at')
  .eq('agency_id', agencyId)
  .maybeSingle()`,
          insert: `// La app inserta/actualiza al iniciar el cronómetro. Para registrar horas use la RPC log_timer_hours.`,
        },
        responses: {
          getList: `[
  { "employee_id": "e1f2a3b4-...", "allocation_id": "al1-...", "started_at": "2026-02-21T10:30:00Z", "agency_id": "a1b2c3d4-..." }
]`,
          getOne: `{
  "employee_id": "e1f2a3b4-...",
  "allocation_id": "al1-...",
  "started_at": "2026-02-21T10:30:00Z",
  "agency_id": "a1b2c3d4-..."
}`,
          post: `// Use la RPC log_timer_hours para cerrar y registrar; la app gestiona active_timers al iniciar/parar.`,
        },
      },
      {
        name: 'timer_sessions',
        description:
          'Sesiones exactas de cronómetro (start_time, end_time) por cada "Stop". Append-only; pensada para webhooks e integraciones (p. ej. Perfex). La analítica interna está en time_entries. RLS: el usuario solo ve sus propias sesiones.',
        authNote: 'Requiere autenticacion. Filtra por agency_id para listar sesiones de la agencia.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que registró la sesión.' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Tarea imputada.' },
          { name: 'start_time', type: 'timestamptz', required: true, description: 'Inicio de la sesión.' },
          { name: 'end_time', type: 'timestamptz', required: true, default: 'now()', description: 'Fin de la sesión.' },
          { name: 'hours', type: 'numeric', required: true, description: 'Horas de la sesión (numeric 10,6).' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia del empleado.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('timer_sessions')
  .select('id, employee_id, allocation_id, start_time, end_time, hours')
  .eq('agency_id', agencyId)
  .gte('start_time', '2026-02-01')
  .order('start_time', { ascending: false })`,
          insert: `// Solo lectura via API. Las filas se crean con la RPC log_timer_hours al parar el cronómetro.`,
        },
        responses: {
          getList: `[
  { "id": "ts1-...", "employee_id": "e1f2a3b4-...", "allocation_id": "al1-...", "start_time": "2026-02-21T09:00:00Z", "end_time": "2026-02-21T10:30:00Z", "hours": 1.5, "agency_id": "a1b2c3d4-..." }
]`,
          getOne: `{
  "id": "ts1-...",
  "employee_id": "e1f2a3b4-...",
  "allocation_id": "al1-...",
  "start_time": "2026-02-21T09:00:00Z",
  "end_time": "2026-02-21T10:30:00Z",
  "hours": 1.5,
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-21T10:30:00Z"
}`,
          post: `// Solo la RPC log_timer_hours escribe en timer_sessions.`,
        },
      },
    ],
  },
  {
    anchorId: 'res-transferencias',
    group: 'Transferencias',
    icon: ArrowRight,
    tables: [
      {
        name: 'task_transfers',
        description:
          'Solicitudes de transferencia de tareas entre empleados. Ciclo de vida: pending -> accepted/rejected/cancelled.',
        authNote: 'Requiere autenticacion. Filtra por agency_id obligatorio.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Asignacion que se transfiere.' },
          { name: 'from_employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que envia la tarea.' },
          { name: 'to_employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que recibe la tarea.' },
          { name: 'hours_transferred', type: 'numeric', required: true, description: 'Horas que se transfieren.' },
          { name: 'status', type: 'text', required: false, default: "'pending'", check: "IN ('pending','accepted','rejected','cancelled')", description: 'Estado de la solicitud.' },
          { name: 'acceptance_mode', type: 'text', required: false, check: "IN ('keep','move','distribute','rollover')", description: 'Modo de aceptacion elegido por el receptor.' },
          { name: 'reason', type: 'text', required: false, description: 'Motivo de la transferencia.' },
          { name: 'rejection_reason', type: 'text', required: false, description: 'Motivo del rechazo (si aplica).' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia.' },
          { name: 'requested_at', type: 'timestamptz', required: false, default: 'now()', description: 'Fecha de solicitud. Auto-generado.' },
          { name: 'responded_at', type: 'timestamptz', required: false, description: 'Fecha de respuesta.' },
          { name: 'result_allocation_ids', type: 'uuid[]', required: false, default: "'{}'", description: 'IDs de allocations hijas (p. ej. distribute) o continuacion (rollover). La aceptacion atomica usa la RPC accept_task_transfer.' },
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
        responses: {
          getList: `[
  {
    "id": "tt1-...",
    "allocation_id": "al1-...",
    "from_employee_id": "e1f2a3b4-...",
    "to_employee_id": "c5d6e7f8-...",
    "hours_transferred": 4,
    "status": "pending"
  }
]`,
          getOne: `{
  "id": "tt1-...",
  "allocation_id": "al1-...",
  "from_employee_id": "e1f2a3b4-...",
  "to_employee_id": "c5d6e7f8-...",
  "hours_transferred": 4,
  "status": "pending",
  "reason": "Sobrecarga esta semana",
  "agency_id": "a1b2c3d4-...",
  "requested_at": "2026-02-17T09:00:00Z"
}`,
          post: `{
  "id": "tt2-...",
  "allocation_id": "al1-...",
  "from_employee_id": "e1f2a3b4-...",
  "to_employee_id": "c5d6e7f8-...",
  "hours_transferred": 4,
  "status": "pending",
  "reason": "Sobrecarga esta semana",
  "agency_id": "a1b2c3d4-...",
  "requested_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
    ],
  },
  {
    anchorId: 'res-ausencias',
    group: 'Ausencias y eventos',
    icon: AlertTriangle,
    tables: [
      {
        name: 'absences',
        description: 'Ausencias de empleados (vacaciones, baja, permisos). Reducen la capacidad disponible automaticamente.',
        authNote: 'Requiere autenticacion.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado ausente.' },
          { name: 'start_date', type: 'date', required: true, description: 'Fecha de inicio (YYYY-MM-DD).' },
          { name: 'end_date', type: 'date', required: true, description: 'Fecha de fin (YYYY-MM-DD).' },
          { name: 'type', type: 'text', required: true, description: 'Tipo de ausencia (vacaciones, baja, permiso, etc.).' },
          { name: 'hours', type: 'numeric', required: false, default: '0', description: 'Horas de ausencia (si es parcial).' },
          { name: 'description', type: 'text', required: false, description: 'Descripcion o notas.' },
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
          curlSelect: `curl -X GET \\
  '<BASE_URL>/absences?select=id,employee_id,start_date,end_date,type,hours&'\\
  'employee_id=eq.<EMPLOYEE_ID>&end_date=gte.2026-02-01' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>'`,
          curlInsert: `curl -X POST \\
  '<BASE_URL>/absences' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -H 'Prefer: return=representation' \\
  -d '{"employee_id":"<EMPLOYEE_ID>","start_date":"2026-03-10",'\\
  '"end_date":"2026-03-14","type":"vacaciones","description":"Semana Santa"}'`,
        },
        responses: {
          getList: `[
  { "id": "ab1-...", "employee_id": "e1f2a3b4-...", "start_date": "2026-03-10", "end_date": "2026-03-14", "type": "vacaciones", "hours": 0 }
]`,
          getOne: `{
  "id": "ab1-...",
  "employee_id": "e1f2a3b4-...",
  "start_date": "2026-03-10",
  "end_date": "2026-03-14",
  "type": "vacaciones",
  "hours": 0,
  "description": "Semana Santa",
  "created_at": "2026-02-01T10:00:00Z"
}`,
          post: `{
  "id": "ab2-...",
  "employee_id": "e1f2a3b4-...",
  "start_date": "2026-03-10",
  "end_date": "2026-03-14",
  "type": "vacaciones",
  "description": "Semana Santa",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'team_events',
        description: 'Eventos del equipo que reducen disponibilidad (festivos, formaciones, team buildings).',
        authNote: 'Requiere autenticacion.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre del evento.' },
          { name: 'date', type: 'date', required: true, description: 'Fecha del evento.' },
          { name: 'hours_reduction', type: 'numeric', required: true, description: 'Horas que se reducen de la capacidad.' },
          { name: 'affected_employee_ids', type: 'jsonb', required: true, description: 'Array de UUIDs de empleados afectados.' },
          { name: 'description', type: 'text', required: false, description: 'Descripcion del evento.' },
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
    name: 'Dia de la Constitucion',
    date: '2026-12-06',
    hours_reduction: 8,
    affected_employee_ids: [employeeId1, employeeId2]
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "te1-...", "name": "Dia de la Constitucion", "date": "2026-12-06", "hours_reduction": 8, "affected_employee_ids": ["e1-...", "e2-..."] }
]`,
          getOne: `{
  "id": "te1-...",
  "name": "Dia de la Constitucion",
  "date": "2026-12-06",
  "hours_reduction": 8,
  "affected_employee_ids": ["e1f2a3b4-...", "c5d6e7f8-..."],
  "description": "Festivo nacional",
  "created_at": "2026-01-15T08:00:00Z"
}`,
          post: `{
  "id": "te2-...",
  "name": "Dia de la Constitucion",
  "date": "2026-12-06",
  "hours_reduction": 8,
  "affected_employee_ids": ["e1f2a3b4-...", "c5d6e7f8-..."],
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'global_assignments',
        description: 'Asignaciones globales de horas por mes que afectan la capacidad (formaciones recurrentes, reuniones fijas, etc.).',
        authNote: 'Requiere autenticacion. Filtra por agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'month', type: 'varchar', required: true, description: 'Mes en formato YYYY-MM.' },
          { name: 'name', type: 'text', required: true, description: 'Nombre de la asignacion global.' },
          { name: 'hours', type: 'numeric', required: true, description: 'Horas mensuales reservadas.' },
          { name: 'affects_all', type: 'boolean', required: false, default: 'true', description: 'Si afecta a todos los empleados.' },
          { name: 'affected_employee_ids', type: 'jsonb', required: false, default: "'[]'", description: 'Array de UUIDs afectados (si no es global).' },
          { name: 'employee_id', type: 'uuid', required: false, fk: 'employees(id)', description: 'Empleado especifico (si es individual).' },
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
    name: 'Formacion mensual',
    hours: 4,
    affects_all: true,
    agency_id: agencyId
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "ga1-...", "month": "2026-02", "name": "Formacion mensual", "hours": 4, "affects_all": true }
]`,
          getOne: `{
  "id": "ga1-...",
  "month": "2026-02",
  "name": "Formacion mensual",
  "hours": 4,
  "affects_all": true,
  "affected_employee_ids": [],
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-01T08:00:00Z"
}`,
          post: `{
  "id": "ga2-...",
  "month": "2026-03",
  "name": "Formacion mensual",
  "hours": 4,
  "affects_all": true,
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
    ],
  },
  {
    anchorId: 'res-configuracion',
    group: 'Configuracion',
    icon: Shield,
    tables: [
      {
        name: 'department_config',
        description: 'Configuracion por departamento: vista por defecto, dia y hora de cierre semanal.',
        authNote: 'Requiere autenticacion. Filtra por agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia.' },
          { name: 'department_name', type: 'text', required: true, description: 'Nombre del departamento.' },
          { name: 'default_view', type: 'text', required: false, default: "'weekly'", description: 'Vista por defecto (weekly).' },
          { name: 'is_view_strict', type: 'boolean', required: false, default: 'false', description: 'Fuerza la vista; no permite cambiarla.' },
          { name: 'closing_day', type: 'integer', required: false, default: '3', check: '0-6 (0=domingo)', description: 'Dia de cierre semanal (0=dom, 1=lun...6=sab).' },
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
        responses: {
          getList: `[
  { "id": "dc1-...", "agency_id": "a1b2c3d4-...", "department_name": "Desarrollo", "closing_day": 4, "closing_hour": 14 }
]`,
          getOne: `{
  "id": "dc1-...",
  "agency_id": "a1b2c3d4-...",
  "department_name": "Desarrollo",
  "default_view": "weekly",
  "is_view_strict": false,
  "closing_day": 4,
  "closing_hour": 14,
  "created_at": "2026-01-10T08:00:00Z"
}`,
          post: `{
  "id": "dc2-...",
  "agency_id": "a1b2c3d4-...",
  "department_name": "Desarrollo",
  "closing_day": 4,
  "closing_hour": 14,
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'client_settings',
        description: 'Ajustes avanzados por cliente: limite de presupuesto, agrupacion, visibilidad.',
        authNote: 'Requiere autenticacion.',
        columns: [
          { name: 'client_id', type: 'text', required: true, pk: true, description: 'ID del cliente (clave primaria).' },
          { name: 'budget_limit', type: 'numeric', required: false, default: '0', description: 'Limite de presupuesto total.' },
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
        responses: {
          getList: `[
  { "client_id": "c1d2e3f4-...", "budget_limit": 5000, "group_name": "Premium", "is_hidden": false }
]`,
          getOne: `{
  "client_id": "c1d2e3f4-...",
  "budget_limit": 5000,
  "group_name": "Premium",
  "is_hidden": false,
  "is_sales_account": true,
  "updated_at": "2026-02-10T14:00:00Z"
}`,
          post: `{
  "client_id": "c1d2e3f4-...",
  "budget_limit": 5000,
  "group_name": "Premium",
  "updated_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
    ],
  },
  {
    anchorId: 'res-feedback',
    group: 'Feedback',
    icon: FileJson,
    tables: [
      {
        name: 'weekly_feedback',
        description: 'Feedback semanal sobre asignaciones: permite reportar bloqueos, problemas de estimacion u otros motivos.',
        authNote: 'Requiere autenticacion.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que reporta.' },
          { name: 'week_start_date', type: 'date', required: true, description: 'Lunes de la semana (YYYY-MM-DD).' },
          { name: 'project_id', type: 'uuid', required: false, fk: 'projects(id)', description: 'Proyecto afectado.' },
          { name: 'allocation_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Asignacion concreta.' },
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
    comments: 'Esperando aprobacion del cliente'
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "wf1-...", "employee_id": "e1f2a3b4-...", "week_start_date": "2026-02-17", "reason": "client_blocker", "comments": "Esperando aprobacion" }
]`,
          getOne: `{
  "id": "wf1-...",
  "employee_id": "e1f2a3b4-...",
  "week_start_date": "2026-02-17",
  "project_id": "p1q2r3s4-...",
  "reason": "client_blocker",
  "comments": "Esperando aprobacion del cliente",
  "created_at": "2026-02-17T16:00:00Z"
}`,
          post: `{
  "id": "wf2-...",
  "employee_id": "e1f2a3b4-...",
  "week_start_date": "2026-02-17",
  "project_id": "p1q2r3s4-...",
  "reason": "client_blocker",
  "comments": "Esperando aprobacion del cliente",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
    ],
  },
  {
    anchorId: 'res-objetivos',
    group: 'Objetivos',
    icon: Zap,
    tables: [
      {
        name: 'professional_goals',
        description: 'Objetivos profesionales de cada empleado con resultados clave, acciones y progreso.',
        authNote: 'Requiere autenticacion.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado propietario.' },
          { name: 'title', type: 'text', required: true, description: 'Titulo del objetivo.' },
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
    title: 'Certificacion Google Ads',
    start_date: '2026-01-01',
    due_date: '2026-06-30',
    progress: 0
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "pg1-...", "employee_id": "e1f2a3b4-...", "title": "Certificacion Google Ads", "progress": 25, "due_date": "2026-06-30" }
]`,
          getOne: `{
  "id": "pg1-...",
  "employee_id": "e1f2a3b4-...",
  "title": "Certificacion Google Ads",
  "key_results": [{ "title": "Aprobar examen", "done": false }],
  "start_date": "2026-01-01",
  "due_date": "2026-06-30",
  "progress": 25,
  "created_at": "2026-01-05T08:00:00Z"
}`,
          post: `{
  "id": "pg2-...",
  "employee_id": "e1f2a3b4-...",
  "title": "Certificacion Google Ads",
  "start_date": "2026-01-01",
  "due_date": "2026-06-30",
  "progress": 0,
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'user_routines',
        description: 'Rutinas recurrentes del empleado (daily standups, revisiones, etc.).',
        authNote: 'Requiere autenticacion.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado propietario.' },
          { name: 'title', type: 'text', required: true, description: 'Nombre de la rutina.' },
          { name: 'estimated_minutes', type: 'integer', required: false, default: '30', description: 'Duracion estimada en minutos.' },
          { name: 'project_id', type: 'uuid', required: false, fk: 'projects(id)', description: 'Proyecto asociado (opcional).' },
          { name: 'is_active', type: 'boolean', required: false, default: 'true', description: 'Si la rutina esta activa.' },
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
        responses: {
          getList: `[
  { "id": "ur1-...", "employee_id": "e1f2a3b4-...", "title": "Daily standup", "estimated_minutes": 15, "is_active": true }
]`,
          getOne: `{
  "id": "ur1-...",
  "employee_id": "e1f2a3b4-...",
  "title": "Daily standup",
  "estimated_minutes": 15,
  "project_id": null,
  "is_active": true,
  "created_at": "2026-01-20T08:00:00Z"
}`,
          post: `{
  "id": "ur2-...",
  "employee_id": "e1f2a3b4-...",
  "title": "Daily standup",
  "estimated_minutes": 15,
  "is_active": true,
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
    ],
  },
  {
    anchorId: 'res-bloqueos',
    group: 'Bloqueos de edicion',
    icon: Lock,
    tables: [
      {
        name: 'project_editing_locks',
        description: 'Bloqueos temporales (5 min) para evitar conflictos de edicion concurrente en un proyecto/mes.',
        authNote: 'Requiere autenticacion. El lock expira automaticamente.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Identificador unico.' },
          { name: 'project_id', type: 'uuid', required: true, fk: 'projects(id)', description: 'Proyecto bloqueado.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Empleado que posee el lock.' },
          { name: 'month', type: 'varchar', required: true, description: 'Mes bloqueado (YYYY-MM).' },
          { name: 'locked_at', type: 'timestamptz', required: false, default: 'now()', description: 'Inicio del bloqueo.' },
          { name: 'expires_at', type: 'timestamptz', required: false, default: 'now() + 5min', description: 'Expiracion automatica (5 minutos).' },
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
        responses: {
          getList: `[
  { "id": "pl1-...", "project_id": "p1q2r3s4-...", "employee_id": "e1f2a3b4-...", "month": "2026-02", "expires_at": "2026-02-17T12:05:00Z" }
]`,
          getOne: `{
  "id": "pl1-...",
  "project_id": "p1q2r3s4-...",
  "employee_id": "e1f2a3b4-...",
  "month": "2026-02",
  "locked_at": "2026-02-17T12:00:00Z",
  "expires_at": "2026-02-17T12:05:00Z"
}`,
          post: `{
  "id": "pl2-...",
  "project_id": "p1q2r3s4-...",
  "employee_id": "e1f2a3b4-...",
  "month": "2026-02",
  "locked_at": "2026-02-17T12:00:00Z",
  "expires_at": "2026-02-17T12:05:00Z"
}`,
        },
      },
    ],
  },
];

export const ERROR_CODES: ErrorCode[] = [
  { code: 200, meaning: 'OK', description: 'Solicitud exitosa. Se devuelven los datos solicitados.' },
  { code: 201, meaning: 'Created', description: 'Recurso creado correctamente (POST con Prefer: return=representation).' },
  { code: 204, meaning: 'No Content', description: 'Operacion exitosa sin cuerpo de respuesta (DELETE, PATCH sin return).' },
  { code: 400, meaning: 'Bad Request', description: 'Parametros invalidos, tipo de dato incorrecto o violacion de constraint.' },
  { code: 401, meaning: 'Unauthorized', description: 'API key ausente o token de sesion expirado.' },
  { code: 403, meaning: 'Forbidden', description: 'El usuario no tiene permisos RLS para este recurso.' },
  { code: 404, meaning: 'Not Found', description: 'Recurso no encontrado o ruta invalida.' },
  { code: 409, meaning: 'Conflict', description: 'Violacion de constraint UNIQUE o conflicto de datos.' },
  { code: 429, meaning: 'Too Many Requests', description: 'Demasiadas peticiones. Espera antes de reintentar.' },
  { code: 500, meaning: 'Server Error', description: 'Error interno del servidor. Contacta soporte si persiste.' },
];

