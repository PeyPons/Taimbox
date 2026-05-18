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

export const TABLE_GROUPS_EN: TableGroup[] = [
  {
    anchorId: 'res-organizacion',
    group: 'Organization',
    icon: Globe,
    tables: [
      {
        name: 'agencies',
        description:
          'Each agency is an isolated tenant. All resources belong to an agency. Read-only via API: agencies are created in the app (signup/onboarding).',
        authNote: 'Authentication required. You can only access agencies for your user.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'name', type: 'text', required: true, description: 'Agency name. Must be unique.' },
          { name: 'slug', type: 'text', required: true, description: 'URL-friendly slug. Unique.' },
          { name: 'settings', type: 'jsonb', required: false, default: "'{}'", description: 'Agency settings (roles, modules, branding).' },
          { name: 'setup_completed', type: 'boolean', required: false, default: 'false', description: 'Whether onboarding is complete.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Creation timestamp. Auto-generated.' },
          { name: 'updated_at', type: 'timestamptz', required: false, default: 'now()', description: 'Last update. Auto-generated.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('agencies')
  .select('id, name, slug, settings')
  .eq('id', agencyId)
  .single()`,
          insert: `// Agencies are not created via API.
// They are managed in the app (signup / onboarding).`,
        },
        responses: {
          getList: `[
  {
    "id": "a1b2c3d4-...",
    "name": "My Agency",
    "slug": "my-agency",
    "settings": { "roles": [...], "modules": {...} }
  }
]`,
          getOne: `{
  "id": "a1b2c3d4-...",
  "name": "My Agency",
  "slug": "my-agency",
  "settings": { "roles": [...], "modules": {...} },
  "setup_completed": true,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-10T14:22:00Z"
}`,
          post: `// Not available. Agencies are created in the app.`,
        },
      },
      {
        name: 'employees',
        description:
          'Team members. Each employee has a role, weekly capacity, and work schedule.',
        authNote: 'Authentication required. You must filter by agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'name', type: 'text', required: true, description: 'Full name of the employee.' },
          { name: 'first_name', type: 'text', required: false, description: 'First name.' },
          { name: 'last_name', type: 'text', required: false, description: 'Last name.' },
          { name: 'email', type: 'text', required: false, description: 'Email address.' },
          { name: 'role', type: 'text', required: true, description: 'Role name (defines permissions).' },
          { name: 'department', type: 'text', required: false, default: "'General'", description: 'Department the employee belongs to.' },
          { name: 'default_weekly_capacity', type: 'numeric', required: true, description: 'Base working hours per week (e.g. 40).' },
          { name: 'work_schedule', type: 'jsonb', required: true, description: 'Hours per day: { monday: 8, tuesday: 8, ... sunday: 0 }.' },
          { name: 'hourly_rate', type: 'numeric', required: false, default: '0', description: 'Employee hourly cost.' },
          { name: 'is_active', type: 'boolean', required: false, default: 'true', description: 'Whether active. Inactive employees are hidden from planning.' },
          { name: 'avatar_url', type: 'text', required: false, description: 'Avatar URL.' },
          { name: 'user_id', type: 'uuid', required: false, description: 'Link to platform user. Read-only.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agency the employee belongs to.' },
          { name: 'department_id', type: 'uuid', required: false, fk: 'department_config(id)', description: 'Departamento configurado.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Creation timestamp. Auto-generated.' },
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
    name: 'Anna Garcia',
    first_name: 'Anna',
    last_name: 'Garcia',
    email: 'anna@agency.com',
    role: 'Designer',
    default_weekly_capacity: 40,
    work_schedule: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 },
    agency_id: agencyId
  })
  .select()
  .single()`,
          curlSelect: `curl -X GET \\
  '<BASE_URL>/employees?select=id,name,role,email,default_weekly_capacity,'\\
  'is_active&agency_id=eq.<AGENCY_ID>&is_active=eq.true&order=name.asc' \\
  -H 'apikey: <YOUR_API_KEY>' \\
  -H 'Authorization: Bearer <YOUR_API_TOKEN>'`,
          curlInsert: `curl -X POST \\
  '<BASE_URL>/employees' \\
  -H 'apikey: <YOUR_API_KEY>' \\
  -H 'Authorization: Bearer <YOUR_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -H 'Prefer: return=representation' \\
  -d '{"name":"Anna Garcia","role":"Designer","default_weekly_capacity":40,'\\
  '"agency_id":"<AGENCY_ID>","work_schedule":{"monday":8,"tuesday":8,'\\
  '"wednesday":8,"thursday":8,"friday":8,"saturday":0,"sunday":0}}'`,
        },
        responses: {
          getList: `[
  {
    "id": "e1f2a3b4-...",
    "name": "Anna Garcia",
    "role": "Designer",
    "email": "anna@agency.com",
    "default_weekly_capacity": 40,
    "is_active": true
  },
  {
    "id": "c5d6e7f8-...",
    "name": "Carlos Lopez",
    "role": "Developer",
    "email": "carlos@agency.com",
    "default_weekly_capacity": 40,
    "is_active": true
  }
]`,
          getOne: `{
  "id": "e1f2a3b4-...",
  "name": "Anna Garcia",
  "first_name": "Ana",
  "last_name": "Garcia",
  "email": "anna@agency.com",
  "role": "Designer",
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
  "name": "Anna Garcia",
  "first_name": "Ana",
  "last_name": "Garcia",
  "email": "anna@agency.com",
  "role": "Designer",
  "default_weekly_capacity": 40,
  "work_schedule": { "monday": 8, "tuesday": 8, "wednesday": 8, "thursday": 8, "friday": 8, "saturday": 0, "sunday": 0 },
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'clients',
        description: 'Agency clients. Each project belongs to a client.',
        authNote: 'Authentication required. You must filter by agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'name', type: 'text', required: true, description: 'Client name.' },
          { name: 'color', type: 'text', required: true, description: 'Hex color for visual display (e.g. #3B82F6).' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Owning agency.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Creation timestamp. Auto-generated.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('clients')
  .select('id, name, color')
  .eq('agency_id', agencyId)
  .order('name')`,
          insert: `const { data } = await timeboxing
  .from('clients')
  .insert({ name: 'Example client', color: '#8B5CF6', agency_id: agencyId })
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
  "name": "Example client",
  "color": "#8B5CF6",
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'projects',
        description:
          'Projects linked to a client. They hold team hour allocations.',
        authNote: 'Authentication required. You must filter by agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'client_id', type: 'uuid', required: true, fk: 'clients(id)', description: 'Client this project belongs to.' },
          { name: 'name', type: 'text', required: true, description: 'Project name.' },
          { name: 'status', type: 'text', required: false, default: "'active'", check: "IN ('active','archived')", description: 'Project status.' },
          { name: 'budget_hours', type: 'numeric', required: false, default: '0', description: 'Budgeted hours per month.' },
          { name: 'minimum_hours', type: 'numeric', required: false, default: '0', description: 'Minimum committed hours.' },
          { name: 'monthly_fee', type: 'numeric', required: false, default: '0', description: 'Monthly project fee (EUR).' },
          { name: 'project_type', type: 'text', required: false, default: "'Mensual'", description: 'Type: Monthly, One-off, etc.' },
          { name: 'deliverable_contract_fee', type: 'numeric', required: false, description: 'Deliverable contract total EUR; NULL = use monthly_fee as total when prorating by month.' },
          { name: 'deliverable_start_date', type: 'date', required: false, description: 'Deliverable phase start (inclusive), with deliverable_due_date.' },
          { name: 'deliverable_due_date', type: 'date', required: false, description: 'Deliverable phase end (inclusive).' },
          { name: 'is_hidden', type: 'boolean', required: false, default: 'false', description: 'Hidden from general views.' },
          { name: 'okrs', type: 'jsonb', required: false, default: "'[]'", description: 'Project objectives and key results.' },
          { name: 'deliverables_log', type: 'jsonb', required: false, default: "'{}'", description: 'Deliverables log.' },
          { name: 'last_meeting_date', type: 'timestamptz', required: false, description: 'Date of the last client meeting.' },
          { name: 'external_id', type: 'integer', required: false, description: 'External ID for CRM integrations.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Owning agency.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Creation timestamp. Auto-generated.' },
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
    name: 'Q1 2026 campaign',
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
    "name": "Q1 2026 campaign",
    "client_id": "c1d2e3f4-...",
    "budget_hours": 120,
    "monthly_fee": 3500,
    "status": "active"
  }
]`,
          getOne: `{
  "id": "p1q2r3s4-...",
  "name": "Q1 2026 campaign",
  "client_id": "c1d2e3f4-...",
  "status": "active",
  "budget_hours": 120,
  "minimum_hours": 80,
  "monthly_fee": 3500,
  "project_type": "Monthly",
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-01-05T10:00:00Z"
}`,
          post: `{
  "id": "x9y8z7w6-...",
  "name": "Q1 2026 campaign",
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
    group: 'Planning',
    icon: FileJson,
    tables: [
      {
        name: 'allocations',
        description:
          'Atomic planning unit. Each allocation links an employee to a project for a specific week.',
        authNote: 'Authentication required. Filter by agency_id via the project.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Assigned employee.' },
          { name: 'project_id', type: 'uuid', required: true, fk: 'projects(id)', description: 'Target project.' },
          { name: 'week_start_date', type: 'date', required: true, description: 'Monday of the week (YYYY-MM-DD).' },
          { name: 'hours_assigned', type: 'numeric', required: true, description: 'Planned hours for the week.' },
          { name: 'hours_actual', type: 'numeric', required: false, default: '0', description: 'Hours actually worked (reported).' },
          { name: 'hours_computed', type: 'numeric', required: false, default: '0', description: 'System-calculated hours.' },
          { name: 'task_name', type: 'text', required: false, description: 'Task name.' },
          { name: 'description', type: 'text', required: false, description: 'Detailed task description.' },
          { name: 'status', type: 'text', required: false, default: "'planned'", check: "IN ('planned','completed')", description: 'Allocation status.' },
          { name: 'is_locked', type: 'boolean', required: false, default: 'false', description: 'Whether locked for editing.' },
          { name: 'user_priority', type: 'integer', required: false, description: 'User-defined priority (sort order).' },
          { name: 'focus_date', type: 'date', required: false, description: 'Day the employee marks the task in focus (My day view); null = backlog. Does not change hours_assigned.' },
          { name: 'dependency_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Allocation this task depends on.' },
          { name: 'parent_allocation_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Parent allocation (subdivisions).' },
          { name: 'transferred_from_allocation_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Source if transferred.' },
          { name: 'transfer_source_employee_id', type: 'uuid', required: false, fk: 'employees(id)', description: 'Source employee of the transfer.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Creation timestamp. Auto-generated.' },
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
    task_name: 'Landing design',
    status: 'planned'
  })
  .select()
  .single()`,
          curlSelect: `curl -X GET \\
  '<BASE_URL>/allocations?select=id,employee_id,project_id,week_start_date,'\\
  'hours_assigned,task_name,status&employee_id=eq.<EMPLOYEE_ID>&'\\
  'week_start_date=gte.2026-02-01&week_start_date=lte.2026-02-28&order=week_start_date.asc' \\
  -H 'apikey: <YOUR_API_KEY>' \\
  -H 'Authorization: Bearer <YOUR_API_TOKEN>'`,
          curlInsert: `curl -X POST \\
  '<BASE_URL>/allocations' \\
  -H 'apikey: <YOUR_API_KEY>' \\
  -H 'Authorization: Bearer <YOUR_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -H 'Prefer: return=representation' \\
  -d '{"employee_id":"<EMPLOYEE_ID>","project_id":"<PROJECT_ID>",'\\
  '"week_start_date":"2026-02-17","hours_assigned":8,'\\
  '"task_name":"Landing design","status":"planned"}'`,
        },
        responses: {
          getList: `[
  {
    "id": "al1-...",
    "employee_id": "e1f2a3b4-...",
    "project_id": "p1q2r3s4-...",
    "week_start_date": "2026-02-17",
    "hours_assigned": 8,
    "task_name": "Landing design",
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
  "task_name": "Landing design",
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
  "task_name": "Landing design",
  "status": "planned",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'allocation_notes',
        description:
          'Append-only notes per task (allocation). Distinct from weekly_feedback.comments and time_entries.notes.',
        authNote: 'Authentication required. Filter by agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Linked weekly task.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agency (direct RLS).' },
          { name: 'author_employee_id', type: 'uuid', required: false, fk: 'employees(id)', description: 'Note author.' },
          { name: 'body', type: 'text', required: true, description: 'Content (max 10000 chars).' },
          { name: 'source', type: 'text', required: true, default: "'user'", check: "IN ('user','legacy_description','system_copy')", description: 'Note origin.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generated.' },
          { name: 'deleted_at', type: 'timestamptz', required: false, description: 'Soft delete; null = active.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('allocation_notes')
  .select('id, allocation_id, body, source, created_at')
  .eq('allocation_id', allocationId)
  .is('deleted_at', null)
  .order('created_at')`,
          insert: `const { data } = await timeboxing
  .from('allocation_notes')
  .insert({
    allocation_id: allocationId,
    agency_id: agencyId,
    author_employee_id: employeeId,
    body: 'Upload ES images and EN/DE copy',
    source: 'user'
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  {
    "id": "an1-...",
    "allocation_id": "al1-...",
    "body": "Upload ES images and EN/DE copy",
    "source": "user",
    "created_at": "2026-02-17T09:00:00Z"
  }
]`,
          getOne: `{
  "id": "an1-...",
  "allocation_id": "al1-...",
  "agency_id": "a1b2c3d4-...",
  "author_employee_id": "e1f2a3b4-...",
  "body": "Upload ES images and EN/DE copy",
  "source": "user",
  "created_at": "2026-02-17T09:00:00Z",
  "deleted_at": null
}`,
          post: `{
  "id": "an2-...",
  "allocation_id": "al1-...",
  "body": "Upload ES images and EN/DE copy",
  "source": "user",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'deadlines',
        description:
          'Monthly targets per project. Defines how many hours each employee should spend on a project in a month.',
        authNote: 'Authentication required. Filtered via project (which belongs to an agency).',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'project_id', type: 'uuid', required: true, fk: 'projects(id)', description: 'Associated project.' },
          { name: 'month', type: 'varchar', required: true, default: "to_char(now(),'YYYY-MM')", description: 'Month in YYYY-MM format.' },
          { name: 'employee_hours', type: 'jsonb', required: false, default: "'{}'", description: 'Map { employeeId: hours } for monthly split.' },
          { name: 'budget_override', type: 'numeric', required: false, description: 'Custom budget for this month (overrides the project).' },
          { name: 'recognized_revenue', type: 'numeric', required: false, description: 'Legacy column; app metrics do not use it (deliverable revenue on projects.deliverable_*).' },
          { name: 'notes', type: 'text', required: false, description: 'Internal notes about the deadline.' },
          { name: 'is_hidden', type: 'boolean', required: false, default: 'false', description: 'Hidden from the general view.' },
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
  "notes": "Launch month",
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
          'Log of actual hours worked per allocation and day. Can be written via INSERT or via the log_timer_hours RPC (app timer). UNIQUE (employee_id, allocation_id, date). RLS: users only see their own rows.',
        authNote: 'Authentication required. Filter by agency_id to list by agency; RLS limits rows to the employee linked to the user.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Allocation the hours are charged to.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Employee logging the entry.' },
          { name: 'date', type: 'date', required: true, description: 'Entry date (YYYY-MM-DD).' },
          { name: 'hours', type: 'numeric', required: false, default: '0', check: '>= 0 AND <= 24', description: 'Hours worked (numeric 10,6 for seconds). Max per session configurable per agency (timeTrackerMaxHours).' },
          { name: 'notes', type: 'text', required: false, description: 'Notes about the work done.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Employee agency. Allows filtering by agency in the API.' },
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
    notes: 'Layout review',
    agency_id: agencyId
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "te1-...", "allocation_id": "al1-...", "date": "2026-02-17", "hours": 4.5, "notes": "Layout review", "agency_id": "a1b2c3d4-..." }
]`,
          getOne: `{
  "id": "te1-...",
  "allocation_id": "al1-...",
  "employee_id": "e1f2a3b4-...",
  "date": "2026-02-17",
  "hours": 4.5,
  "notes": "Layout review",
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-17T18:00:00Z"
}`,
          post: `{
  "id": "te2-...",
  "allocation_id": "al1-...",
  "employee_id": "e1f2a3b4-...",
  "date": "2026-02-17",
  "hours": 4.5,
  "notes": "Layout review",
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-17T18:00:00Z"
}`,
        },
      },
      {
        name: 'active_timers',
        description:
          'Active timers: one row per employee with the task (allocation) and start time. The app uses this table to show and restore the timer after refresh. Written from the app; read/query via API. RLS: each user only sees their own timer.',
        authNote: 'Authentication required. Filter by agency_id to list agency timers. RLS limits to the user employee row.',
        columns: [
          { name: 'employee_id', type: 'uuid', required: true, pk: true, fk: 'employees(id)', description: 'Employee (PK; one active timer per employee).' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Task the timer is running on.' },
          { name: 'started_at', type: 'timestamptz', required: true, default: 'now()', description: 'Timer start time.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Employee agency. Filled by trigger.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('active_timers')
  .select('employee_id, allocation_id, started_at')
  .eq('agency_id', agencyId)
  .maybeSingle()`,
          insert: `// The app inserts/updates when starting the timer. Use log_timer_hours RPC to log hours.`,
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
          post: `// Use log_timer_hours RPC to stop and log; the app manages active_timers on start/stop.`,
        },
      },
      {
        name: 'timer_sessions',
        description:
          'Exact timer sessions (start_time, end_time) per "Stop". Append-only; intended for webhooks and integrations (e.g. Perfex). Internal analytics live in time_entries. RLS: users only see their own sessions.',
        authNote: 'Authentication required. Filter by agency_id to list agency sessions.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Employee who logged the session.' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Charged task.' },
          { name: 'start_time', type: 'timestamptz', required: true, description: 'Session start.' },
          { name: 'end_time', type: 'timestamptz', required: true, default: 'now()', description: 'Session end.' },
          { name: 'hours', type: 'numeric', required: true, description: 'Session hours (numeric 10,6).' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Employee agency.' },
          { name: 'created_at', type: 'timestamptz', required: false, default: 'now()', description: 'Auto-generado.' },
        ],
        examples: {
          select: `const { data } = await timeboxing
  .from('timer_sessions')
  .select('id, employee_id, allocation_id, start_time, end_time, hours')
  .eq('agency_id', agencyId)
  .gte('start_time', '2026-02-01')
  .order('start_time', { ascending: false })`,
          insert: `// Read-only via API. Rows are created by log_timer_hours RPC when stopping the timer.`,
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
          post: `// Only log_timer_hours RPC writes to timer_sessions.`,
        },
      },
    ],
  },
  {
    anchorId: 'res-transferencias',
    group: 'Transfers',
    icon: ArrowRight,
    tables: [
      {
        name: 'task_transfers',
        description:
          'Task transfer requests between employees. Lifecycle: pending -> accepted/rejected/cancelled.',
        authNote: 'Authentication required. You must filter by agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'allocation_id', type: 'uuid', required: true, fk: 'allocations(id)', description: 'Allocation being transferred.' },
          { name: 'from_employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Employee sending the task.' },
          { name: 'to_employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Employee receiving the task.' },
          { name: 'hours_transferred', type: 'numeric', required: true, description: 'Hours being transferred.' },
          { name: 'status', type: 'text', required: false, default: "'pending'", check: "IN ('pending','accepted','rejected','cancelled')", description: 'Request status.' },
          { name: 'acceptance_mode', type: 'text', required: false, check: "IN ('keep','move','distribute','rollover')", description: 'Acceptance mode chosen by the recipient.' },
          { name: 'reason', type: 'text', required: false, description: 'Reason for the transfer.' },
          { name: 'rejection_reason', type: 'text', required: false, description: 'Rejection reason (if any).' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia.' },
          { name: 'requested_at', type: 'timestamptz', required: false, default: 'now()', description: 'Request timestamp. Auto-generated.' },
          { name: 'responded_at', type: 'timestamptz', required: false, description: 'Response timestamp.' },
          { name: 'result_allocation_ids', type: 'uuid[]', required: false, default: "'{}'", description: 'Child allocation IDs (e.g. distribute) or continuation (rollover). Atomic acceptance uses accept_task_transfer RPC.' },
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
    reason: 'Overload this week',
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
  "reason": "Overload this week",
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
  "reason": "Overload this week",
  "agency_id": "a1b2c3d4-...",
  "requested_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
    ],
  },
  {
    anchorId: 'res-ausencias',
    group: 'Absences and events',
    icon: AlertTriangle,
    tables: [
      {
        name: 'absences',
        description: 'Employee absences (vacation, sick leave, time off). Automatically reduce available capacity.',
        authNote: 'Authentication required.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Absent employee.' },
          { name: 'start_date', type: 'date', required: true, description: 'Start date (YYYY-MM-DD).' },
          { name: 'end_date', type: 'date', required: true, description: 'End date (YYYY-MM-DD).' },
          { name: 'type', type: 'text', required: true, description: 'Absence type (vacation, sick leave, leave, etc.).' },
          { name: 'hours', type: 'numeric', required: false, default: '0', description: 'Absence hours (if partial).' },
          { name: 'description', type: 'text', required: false, description: 'Description or notes.' },
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
    type: 'vacation',
    description: 'Easter week'
  })
  .select()
  .single()`,
          curlSelect: `curl -X GET \\
  '<BASE_URL>/absences?select=id,employee_id,start_date,end_date,type,hours&'\\
  'employee_id=eq.<EMPLOYEE_ID>&end_date=gte.2026-02-01' \\
  -H 'apikey: <YOUR_API_KEY>' \\
  -H 'Authorization: Bearer <YOUR_API_TOKEN>'`,
          curlInsert: `curl -X POST \\
  '<BASE_URL>/absences' \\
  -H 'apikey: <YOUR_API_KEY>' \\
  -H 'Authorization: Bearer <YOUR_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -H 'Prefer: return=representation' \\
  -d '{"employee_id":"<EMPLOYEE_ID>","start_date":"2026-03-10",'\\
  '"end_date":"2026-03-14","type":"vacation","description":"Easter week"}'`,
        },
        responses: {
          getList: `[
  { "id": "ab1-...", "employee_id": "e1f2a3b4-...", "start_date": "2026-03-10", "end_date": "2026-03-14", "type": "vacation", "hours": 0 }
]`,
          getOne: `{
  "id": "ab1-...",
  "employee_id": "e1f2a3b4-...",
  "start_date": "2026-03-10",
  "end_date": "2026-03-14",
  "type": "vacation",
  "hours": 0,
  "description": "Easter week",
  "created_at": "2026-02-01T10:00:00Z"
}`,
          post: `{
  "id": "ab2-...",
  "employee_id": "e1f2a3b4-...",
  "start_date": "2026-03-10",
  "end_date": "2026-03-14",
  "type": "vacation",
  "description": "Easter week",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'team_events',
        description: 'Team events that reduce availability (holidays, training, team building).',
        authNote: 'Authentication required.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'name', type: 'text', required: true, description: 'Event name.' },
          { name: 'date', type: 'date', required: true, description: 'Event date.' },
          { name: 'hours_reduction', type: 'numeric', required: true, description: 'Hours deducted from capacity.' },
          { name: 'affected_employee_ids', type: 'jsonb', required: true, description: 'Array of affected employee UUIDs.' },
          { name: 'description', type: 'text', required: false, description: 'Event description.' },
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
    name: 'Constitution Day',
    date: '2026-12-06',
    hours_reduction: 8,
    affected_employee_ids: [employeeId1, employeeId2]
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "te1-...", "name": "Constitution Day", "date": "2026-12-06", "hours_reduction": 8, "affected_employee_ids": ["e1-...", "e2-..."] }
]`,
          getOne: `{
  "id": "te1-...",
  "name": "Constitution Day",
  "date": "2026-12-06",
  "hours_reduction": 8,
  "affected_employee_ids": ["e1f2a3b4-...", "c5d6e7f8-..."],
  "description": "National holiday",
  "created_at": "2026-01-15T08:00:00Z"
}`,
          post: `{
  "id": "te2-...",
  "name": "Constitution Day",
  "date": "2026-12-06",
  "hours_reduction": 8,
  "affected_employee_ids": ["e1f2a3b4-...", "c5d6e7f8-..."],
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'global_assignments',
        description: 'Global monthly hour reservations that affect capacity (recurring training, fixed meetings, etc.).',
        authNote: 'Authentication required. Filtra por agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'month', type: 'varchar', required: true, description: 'Month in YYYY-MM format.' },
          { name: 'name', type: 'text', required: true, description: 'Global assignment name.' },
          { name: 'hours', type: 'numeric', required: true, description: 'Reserved monthly hours.' },
          { name: 'affects_all', type: 'boolean', required: false, default: 'true', description: 'Whether it affects all employees.' },
          { name: 'affected_employee_ids', type: 'jsonb', required: false, default: "'[]'", description: 'Array of affected UUIDs (if not global).' },
          { name: 'employee_id', type: 'uuid', required: false, fk: 'employees(id)', description: 'Specific employee (if individual).' },
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
    name: 'Monthly training',
    hours: 4,
    affects_all: true,
    agency_id: agencyId
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "ga1-...", "month": "2026-02", "name": "Monthly training", "hours": 4, "affects_all": true }
]`,
          getOne: `{
  "id": "ga1-...",
  "month": "2026-02",
  "name": "Monthly training",
  "hours": 4,
  "affects_all": true,
  "affected_employee_ids": [],
  "agency_id": "a1b2c3d4-...",
  "created_at": "2026-02-01T08:00:00Z"
}`,
          post: `{
  "id": "ga2-...",
  "month": "2026-03",
  "name": "Monthly training",
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
    group: 'Configuration',
    icon: Shield,
    tables: [
      {
        name: 'department_config',
        description: 'Per-department settings: default view, day and time of weekly close.',
        authNote: 'Authentication required. Filtra por agency_id.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'agency_id', type: 'uuid', required: true, fk: 'agencies(id)', description: 'Agencia.' },
          { name: 'department_name', type: 'text', required: true, description: 'Department name.' },
          { name: 'default_view', type: 'text', required: false, default: "'weekly'", description: 'Default view (weekly).' },
          { name: 'is_view_strict', type: 'boolean', required: false, default: 'false', description: 'Locks the view; users cannot change it.' },
          { name: 'closing_day', type: 'integer', required: false, default: '3', check: '0-6 (0=Sunday)', description: 'Weekly close day (0=Sun, 1=Mon...6=Sat).' },
          { name: 'closing_hour', type: 'integer', required: false, default: '10', check: '0-23', description: 'Close hour (0-23).' },
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
    department_name: 'Engineering',
    closing_day: 4,
    closing_hour: 14
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "dc1-...", "agency_id": "a1b2c3d4-...", "department_name": "Engineering", "closing_day": 4, "closing_hour": 14 }
]`,
          getOne: `{
  "id": "dc1-...",
  "agency_id": "a1b2c3d4-...",
  "department_name": "Engineering",
  "default_view": "weekly",
  "is_view_strict": false,
  "closing_day": 4,
  "closing_hour": 14,
  "created_at": "2026-01-10T08:00:00Z"
}`,
          post: `{
  "id": "dc2-...",
  "agency_id": "a1b2c3d4-...",
  "department_name": "Engineering",
  "closing_day": 4,
  "closing_hour": 14,
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'client_settings',
        description: 'Advanced per-client settings: budget limit, grouping, visibility.',
        authNote: 'Authentication required.',
        columns: [
          { name: 'client_id', type: 'text', required: true, pk: true, description: 'Client ID (primary key).' },
          { name: 'budget_limit', type: 'numeric', required: false, default: '0', description: 'Total budget limit.' },
          { name: 'group_name', type: 'text', required: false, description: 'Group name to cluster clients.' },
          { name: 'is_hidden', type: 'boolean', required: false, default: 'false', description: 'Hidden from general views.' },
          { name: 'is_sales_account', type: 'boolean', required: false, default: 'true', description: 'Whether this is a sales account.' },
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
        description: 'Weekly feedback on allocations: report blockers, estimation issues, or other reasons.',
        authNote: 'Authentication required.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Reporting employee.' },
          { name: 'week_start_date', type: 'date', required: true, description: 'Monday of the week (YYYY-MM-DD).' },
          { name: 'project_id', type: 'uuid', required: false, fk: 'projects(id)', description: 'Affected project.' },
          { name: 'allocation_id', type: 'uuid', required: false, fk: 'allocations(id)', description: 'Specific allocation.' },
          { name: 'reason', type: 'text', required: false, check: "IN ('technical_issue','client_blocker','bad_estimation','personal_absence','other')", description: 'Issue type.' },
          { name: 'comments', type: 'text', required: false, description: 'Additional comments.' },
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
    comments: 'Waiting for client approval'
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "wf1-...", "employee_id": "e1f2a3b4-...", "week_start_date": "2026-02-17", "reason": "client_blocker", "comments": "Waiting for approval" }
]`,
          getOne: `{
  "id": "wf1-...",
  "employee_id": "e1f2a3b4-...",
  "week_start_date": "2026-02-17",
  "project_id": "p1q2r3s4-...",
  "reason": "client_blocker",
  "comments": "Waiting for client approval",
  "created_at": "2026-02-17T16:00:00Z"
}`,
          post: `{
  "id": "wf2-...",
  "employee_id": "e1f2a3b4-...",
  "week_start_date": "2026-02-17",
  "project_id": "p1q2r3s4-...",
  "reason": "client_blocker",
  "comments": "Waiting for client approval",
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
    ],
  },
  {
    anchorId: 'res-objetivos',
    group: 'Goals',
    icon: Zap,
    tables: [
      {
        name: 'professional_goals',
        description: 'Professional goals per employee with key results, actions, and progress.',
        authNote: 'Authentication required.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Owning employee.' },
          { name: 'title', type: 'text', required: true, description: 'Goal title.' },
          { name: 'key_results', type: 'jsonb', required: false, description: 'Associated key results.' },
          { name: 'actions', type: 'text', required: false, description: 'Concrete actions to achieve it.' },
          { name: 'training_url', type: 'text', required: false, description: 'Training resource URL.' },
          { name: 'start_date', type: 'date', required: false, description: 'Start date.' },
          { name: 'due_date', type: 'date', required: false, description: 'Target date.' },
          { name: 'progress', type: 'integer', required: false, default: '0', description: 'Progress 0-100.' },
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
    title: 'Google Ads certification',
    start_date: '2026-01-01',
    due_date: '2026-06-30',
    progress: 0
  })
  .select()
  .single()`,
        },
        responses: {
          getList: `[
  { "id": "pg1-...", "employee_id": "e1f2a3b4-...", "title": "Google Ads certification", "progress": 25, "due_date": "2026-06-30" }
]`,
          getOne: `{
  "id": "pg1-...",
  "employee_id": "e1f2a3b4-...",
  "title": "Google Ads certification",
  "key_results": [{ "title": "Pass exam", "done": false }],
  "start_date": "2026-01-01",
  "due_date": "2026-06-30",
  "progress": 25,
  "created_at": "2026-01-05T08:00:00Z"
}`,
          post: `{
  "id": "pg2-...",
  "employee_id": "e1f2a3b4-...",
  "title": "Google Ads certification",
  "start_date": "2026-01-01",
  "due_date": "2026-06-30",
  "progress": 0,
  "created_at": "2026-02-17T12:00:00Z"
}`,
        },
      },
      {
        name: 'user_routines',
        description: 'Employee recurring routines (daily standups, reviews, etc.).',
        authNote: 'Authentication required.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Owning employee.' },
          { name: 'title', type: 'text', required: true, description: 'Routine name.' },
          { name: 'estimated_minutes', type: 'integer', required: false, default: '30', description: 'Estimated duration in minutes.' },
          { name: 'project_id', type: 'uuid', required: false, fk: 'projects(id)', description: 'Associated project (optional).' },
          { name: 'is_active', type: 'boolean', required: false, default: 'true', description: 'Whether the routine is active.' },
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
    group: 'Editing locks',
    icon: Lock,
    tables: [
      {
        name: 'project_editing_locks',
        description: 'Short-lived locks (5 min) to avoid concurrent edit conflicts on a project/month.',
        authNote: 'Authentication required. The lock expires automatically.',
        columns: [
          { name: 'id', type: 'uuid', required: false, default: 'gen_random_uuid()', pk: true, description: 'Unique identifier.' },
          { name: 'project_id', type: 'uuid', required: true, fk: 'projects(id)', description: 'Locked project.' },
          { name: 'employee_id', type: 'uuid', required: true, fk: 'employees(id)', description: 'Employee holding the lock.' },
          { name: 'month', type: 'varchar', required: true, description: 'Locked month (YYYY-MM).' },
          { name: 'locked_at', type: 'timestamptz', required: false, default: 'now()', description: 'Lock start.' },
          { name: 'expires_at', type: 'timestamptz', required: false, default: 'now() + 5min', description: 'Automatic expiry (5 minutes).' },
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

export const ERROR_CODES_EN: ErrorCode[] = [
  { code: 200, meaning: 'OK', description: 'Successful request. The requested data is returned.' },
  { code: 201, meaning: 'Created', description: 'Resource created successfully (POST with Prefer: return=representation).' },
  { code: 204, meaning: 'No Content', description: 'Successful operation with no response body (DELETE, PATCH without return).' },
  { code: 400, meaning: 'Bad Request', description: 'Invalid parameters, wrong data type, or constraint violation.' },
  { code: 401, meaning: 'Unauthorized', description: 'Missing API key or expired session token.' },
  { code: 403, meaning: 'Forbidden', description: 'The user does not have RLS permission for this resource.' },
  { code: 404, meaning: 'Not Found', description: 'Resource not found or invalid path.' },
  { code: 409, meaning: 'Conflict', description: 'UNIQUE constraint violation or data conflict.' },
  { code: 429, meaning: 'Too Many Requests', description: 'Too many requests. Wait before retrying.' },
  { code: 500, meaning: 'Server Error', description: 'Internal server error. Contact support if it persists.' },
];

