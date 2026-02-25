-- Extend view_mode_type enum to include 'kanban'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'kanban'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'view_mode_type')
  ) THEN
    ALTER TYPE view_mode_type ADD VALUE 'kanban';
  END IF;
END
$$;

-- Kanban tasks table
CREATE TABLE IF NOT EXISTS public.kanban_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  allocation_id uuid REFERENCES public.allocations(id),
  title text NOT NULL,
  task_type text NOT NULL DEFAULT 'ROUTINE'
    CHECK (task_type IN ('ROUTINE', 'PROJECT', 'FIRE')),
  status text NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog', 'todo', 'in-progress', 'review', 'done')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  platform text,
  sop_checklist jsonb DEFAULT '[]',
  sop_template_id uuid,
  due_date date,
  week_start_date date NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT kanban_tasks_pkey PRIMARY KEY (id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_agency ON public.kanban_tasks(agency_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_employee ON public.kanban_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_week ON public.kanban_tasks(week_start_date);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status ON public.kanban_tasks(status);

-- RLS
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kanban_tasks' AND policyname = 'kanban_tasks_agency_policy'
  ) THEN
    CREATE POLICY kanban_tasks_agency_policy ON public.kanban_tasks
      USING (agency_id = requesting_agency_id());
  END IF;
END
$$;

-- SOP templates table
CREATE TABLE IF NOT EXISTS public.sop_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  name text NOT NULL,
  platform text,
  items jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sop_templates_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_sop_templates_agency ON public.sop_templates(agency_id);

ALTER TABLE public.sop_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sop_templates' AND policyname = 'sop_templates_agency_policy'
  ) THEN
    CREATE POLICY sop_templates_agency_policy ON public.sop_templates
      USING (agency_id = requesting_agency_id());
  END IF;
END
$$;

-- Update cleanup_employee_data to also delete kanban_tasks
CREATE OR REPLACE FUNCTION public.cleanup_employee_data(p_employee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
BEGIN
  DELETE FROM public.kanban_tasks WHERE employee_id = p_employee_id;
  DELETE FROM public.active_timers WHERE employee_id = p_employee_id;
  DELETE FROM public.timer_sessions WHERE employee_id = p_employee_id;
  DELETE FROM public.time_entries WHERE employee_id = p_employee_id;
  DELETE FROM public.allocations WHERE employee_id = p_employee_id;
  DELETE FROM public.absences WHERE employee_id = p_employee_id;
  DELETE FROM public.weekly_feedback WHERE employee_id = p_employee_id;
  DELETE FROM public.user_routines WHERE employee_id = p_employee_id;
  DELETE FROM public.professional_goals WHERE employee_id = p_employee_id;
  DELETE FROM public.task_transfers WHERE from_employee_id = p_employee_id OR to_employee_id = p_employee_id;

  UPDATE public.deadlines
  SET employee_hours = employee_hours - p_employee_id::text
  WHERE employee_hours ? p_employee_id::text;

  UPDATE public.team_events
  SET affected_employee_ids = (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(affected_employee_ids) AS elem
    WHERE elem::text != ('"' || p_employee_id::text || '"')
  )
  WHERE affected_employee_ids @> to_jsonb(p_employee_id::text);
END;
$func$;
