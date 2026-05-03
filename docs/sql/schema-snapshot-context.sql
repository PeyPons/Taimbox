-- Snapshot de contexto para documentación (Taimbox). NO ejecutar como migración única:
-- el orden de tablas, enums USER-DEFINED y dependencias pueden ser inválidos para un run limpio.
-- Ante discrepancias, prevalecen supabase/migrations/ y el código de la aplicación.

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.absences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  hours numeric DEFAULT 0,
  CONSTRAINT absences_pkey PRIMARY KEY (id),
  CONSTRAINT absences_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);
CREATE TABLE public.active_timers (
  employee_id uuid NOT NULL,
  allocation_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  agency_id uuid NOT NULL,
  CONSTRAINT active_timers_pkey PRIMARY KEY (employee_id),
  CONSTRAINT active_timers_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT active_timers_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.allocations(id),
  CONSTRAINT active_timers_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.ad_accounts_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  account_id text NOT NULL,
  account_name text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  budget numeric DEFAULT 0,
  is_sales_objective boolean DEFAULT true,
  agency_id uuid,
  CONSTRAINT ad_accounts_config_pkey PRIMARY KEY (id),
  CONSTRAINT ad_accounts_config_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.ads_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text DEFAULT 'pending'::text,
  logs ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  agency_id uuid,
  CONSTRAINT ads_sync_logs_pkey PRIMARY KEY (id),
  CONSTRAINT ads_sync_logs_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.agencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  setup_completed boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active'::text,
  google_ads_refresh_token text,
  google_ads_customer_id text,
  plan_id text NOT NULL DEFAULT 'starter'::text CHECK (plan_id = ANY (ARRAY['starter'::text, 'pro'::text, 'business'::text, 'enterprise'::text])),
  subscription_status text DEFAULT 'active'::text,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamp with time zone,
  subscription_period_ends_at timestamp with time zone,
  subscription_cancel_at_period_end boolean NOT NULL DEFAULT false,
  trial_used_at timestamp with time zone,
  meta_ads_access_token text,
  CONSTRAINT agencies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  project_id uuid NOT NULL,
  week_start_date date NOT NULL,
  hours_assigned numeric NOT NULL,
  status text DEFAULT 'planned'::text CHECK (status = ANY (ARRAY['planned'::text, 'completed'::text])),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  task_name text,
  hours_actual numeric DEFAULT 0,
  hours_computed numeric DEFAULT 0,
  dependency_id uuid,
  transferred_from_allocation_id uuid,
  distribution_source_allocation_id uuid,
  parent_allocation_id uuid,
  original_transferred_task_name text,
  transfer_source_employee_id uuid,
  user_priority integer,
  is_locked boolean DEFAULT false,
  focus_date date,
  CONSTRAINT allocations_pkey PRIMARY KEY (id),
  CONSTRAINT allocations_dependency_id_fkey FOREIGN KEY (dependency_id) REFERENCES public.allocations(id),
  CONSTRAINT allocations_distribution_source_allocation_id_fkey FOREIGN KEY (distribution_source_allocation_id) REFERENCES public.allocations(id),
  CONSTRAINT allocations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT allocations_parent_allocation_id_fkey FOREIGN KEY (parent_allocation_id) REFERENCES public.allocations(id),
  CONSTRAINT allocations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT allocations_transferred_from_allocation_id_fkey FOREIGN KEY (transferred_from_allocation_id) REFERENCES public.allocations(id),
  CONSTRAINT allocations_transfer_source_employee_id_fkey FOREIGN KEY (transfer_source_employee_id) REFERENCES public.employees(id)
);
CREATE TABLE public.api_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  name text NOT NULL,
  token_hash text NOT NULL,
  permissions text NOT NULL DEFAULT 'readwrite'::text CHECK (permissions = ANY (ARRAY['readonly'::text, 'readwrite'::text])),
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT api_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT api_tokens_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['CREATE'::text, 'UPDATE'::text, 'DELETE'::text])),
  resource text NOT NULL CHECK (resource = ANY (ARRAY['ALLOCATION'::text, 'PROJECT'::text, 'EMPLOYEE'::text, 'CLIENT'::text, 'ABSENCE'::text, 'TEAM_EVENT'::text])),
  resource_id uuid NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.client_settings (
  client_id text NOT NULL,
  budget_limit numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  group_name text,
  is_hidden boolean DEFAULT false,
  is_sales_account boolean DEFAULT true,
  agency_id uuid,
  CONSTRAINT client_settings_pkey PRIMARY KEY (client_id),
  CONSTRAINT client_settings_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  agency_id uuid NOT NULL,
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.deadlines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  notes text,
  employee_hours jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  month character varying NOT NULL DEFAULT to_char(now(), 'YYYY-MM'::text),
  is_hidden boolean DEFAULT false,
  budget_override numeric,
  CONSTRAINT deadlines_pkey PRIMARY KEY (id),
  CONSTRAINT deadlines_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.department_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  department_name text NOT NULL,
  default_view USER-DEFINED DEFAULT 'weekly'::view_mode_type,
  is_view_strict boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  closing_day integer DEFAULT 3 CHECK (closing_day >= 0 AND closing_day <= 6),
  closing_hour integer DEFAULT 10 CHECK (closing_hour >= 0 AND closing_hour <= 23),
  CONSTRAINT department_config_pkey PRIMARY KEY (id),
  CONSTRAINT department_config_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  role text NOT NULL,
  default_weekly_capacity numeric NOT NULL,
  work_schedule jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  email text,
  user_id uuid,
  department text DEFAULT 'General'::text,
  hourly_rate numeric DEFAULT 0,
  first_name text,
  last_name text,
  crm_user_id integer,
  welcome_tour_completed boolean DEFAULT false,
  deadlines_tour_completed boolean DEFAULT false,
  planner_tour_completed boolean DEFAULT false,
  agency_id uuid NOT NULL,
  preferred_view USER-DEFINED,
  department_id uuid,
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
  CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.department_config(id)
);
CREATE TABLE public.global_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  month character varying NOT NULL,
  name text NOT NULL,
  hours numeric NOT NULL,
  affects_all boolean DEFAULT true,
  affected_employee_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  employee_id uuid,
  agency_id uuid,
  CONSTRAINT global_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT global_assignments_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
  CONSTRAINT global_assignments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);
CREATE TABLE public.google_ads_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id text,
  client_name text,
  campaign_id text NOT NULL,
  campaign_name text,
  status text,
  cost double precision,
  clicks integer,
  impressions integer,
  date date NOT NULL,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  conversions_value numeric DEFAULT 0,
  daily_budget numeric DEFAULT 0,
  conversions numeric DEFAULT 0,
  agency_id uuid,
  CONSTRAINT google_ads_campaigns_pkey PRIMARY KEY (campaign_id, date),
  CONSTRAINT google_ads_campaigns_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.google_ads_changes (
  id text NOT NULL,
  client_id text NOT NULL,
  change_date timestamp with time zone,
  user_email text,
  change_type text,
  campaign_name text,
  resource_name text,
  details text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT google_ads_changes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.meta_ads_campaigns (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  client_id text NOT NULL,
  client_name text,
  campaign_id text NOT NULL,
  campaign_name text,
  status text,
  date date NOT NULL,
  cost numeric DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions numeric DEFAULT 0,
  conversions_value numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  agency_id uuid,
  CONSTRAINT meta_ads_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT meta_ads_campaigns_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.meta_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text DEFAULT 'pending'::text,
  logs ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  agency_id uuid,
  CONSTRAINT meta_sync_logs_pkey PRIMARY KEY (id),
  CONSTRAINT meta_sync_logs_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.platform_admins (
  user_id uuid NOT NULL,
  role text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT platform_admins_pkey PRIMARY KEY (user_id),
  CONSTRAINT platform_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.professional_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  title text NOT NULL,
  key_results jsonb,
  actions text,
  training_url text,
  start_date date,
  due_date date,
  progress integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT professional_goals_pkey PRIMARY KEY (id),
  CONSTRAINT professional_goals_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);
CREATE TABLE public.project_editing_locks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  month character varying NOT NULL,
  locked_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:05:00'::interval),
  CONSTRAINT project_editing_locks_pkey PRIMARY KEY (id),
  CONSTRAINT project_editing_locks_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT project_editing_locks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'archived'::text, 'completed'::text])),
  budget_hours numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  minimum_hours numeric DEFAULT 0,
  monthly_fee numeric DEFAULT 0,
  last_meeting_date timestamp with time zone,
  deliverables_log jsonb DEFAULT '{}'::jsonb,
  okrs jsonb DEFAULT '[]'::jsonb,
  external_id integer,
  project_type text DEFAULT 'Mensual'::text,
  is_hidden boolean DEFAULT false,
  agency_id uuid NOT NULL,
  responsible_department_id text,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
  CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.segmentation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  account_id text NOT NULL,
  keyword text NOT NULL,
  virtual_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  agency_id uuid,
  CONSTRAINT segmentation_rules_pkey PRIMARY KEY (id),
  CONSTRAINT segmentation_rules_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.support_ticket_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  author_user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_internal boolean NOT NULL DEFAULT true,
  CONSTRAINT support_ticket_replies_pkey PRIMARY KEY (id),
  CONSTRAINT support_ticket_replies_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id),
  CONSTRAINT support_ticket_replies_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  reporter_user_id uuid,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'closed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
  CONSTRAINT support_tickets_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.task_transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL,
  from_employee_id uuid NOT NULL,
  to_employee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'cancelled'::text])),
  reason text,
  rejection_reason text,
  hours_transferred numeric NOT NULL,
  requested_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  agency_id uuid NOT NULL,
  acceptance_mode text CHECK (acceptance_mode IS NULL OR (acceptance_mode = ANY (ARRAY['keep'::text, 'move'::text, 'distribute'::text, 'rollover'::text]))),
  result_allocation_ids ARRAY DEFAULT '{}'::uuid[],
  CONSTRAINT task_transfers_pkey PRIMARY KEY (id),
  CONSTRAINT task_transfers_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.allocations(id),
  CONSTRAINT task_transfers_from_employee_id_fkey FOREIGN KEY (from_employee_id) REFERENCES public.employees(id),
  CONSTRAINT task_transfers_to_employee_id_fkey FOREIGN KEY (to_employee_id) REFERENCES public.employees(id),
  CONSTRAINT task_transfers_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.team_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  hours_reduction numeric NOT NULL,
  affected_employee_ids jsonb NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  agency_id uuid,
  CONSTRAINT team_events_pkey PRIMARY KEY (id),
  CONSTRAINT team_events_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.time_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  date date NOT NULL,
  hours numeric NOT NULL DEFAULT 0 CHECK (hours >= 0::numeric AND hours <= 24::numeric),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  agency_id uuid NOT NULL,
  CONSTRAINT time_entries_pkey PRIMARY KEY (id),
  CONSTRAINT time_entries_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.allocations(id),
  CONSTRAINT time_entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT time_entries_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.timer_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  allocation_id uuid NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL DEFAULT now(),
  hours numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  agency_id uuid NOT NULL,
  CONSTRAINT timer_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT timer_sessions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT timer_sessions_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.allocations(id),
  CONSTRAINT timer_sessions_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.user_agencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  role text,
  department text,
  is_primary boolean DEFAULT false,
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_impersonation boolean NOT NULL DEFAULT false,
  CONSTRAINT user_agencies_pkey PRIMARY KEY (id),
  CONSTRAINT user_agencies_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
  CONSTRAINT user_agencies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_routines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  title text NOT NULL,
  estimated_minutes integer DEFAULT 30,
  project_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_routines_pkey PRIMARY KEY (id),
  CONSTRAINT user_routines_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT user_routines_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.weekly_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  week_start_date date NOT NULL,
  project_id uuid,
  allocation_id uuid,
  reason text CHECK (reason = ANY (ARRAY['technical_issue'::text, 'client_blocker'::text, 'bad_estimation'::text, 'personal_absence'::text, 'other'::text])),
  comments text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weekly_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_feedback_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.allocations(id),
  CONSTRAINT weekly_feedback_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT weekly_feedback_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
