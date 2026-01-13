-- 1. Tabla de Rutinas (user_routines)
CREATE TABLE IF NOT EXISTS public.user_routines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) NOT NULL, -- Usamos employee_id en lugar de user_id directo para consistencia
    title text NOT NULL,             -- Ej: "Daily Stand-up", "Gestión Correos"
    estimated_minutes int DEFAULT 30,
    project_id uuid REFERENCES public.projects(id), -- Opcional
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;

-- Política simple: Todos los autenticados pueden leer/crear (ajustar según necesidad real)
CREATE POLICY "Enable all access for authenticated users" ON public.user_routines
    FOR ALL USING (auth.role() = 'authenticated');


-- 2. Función para generar rutinas (Simula el Cron Job)
CREATE OR REPLACE FUNCTION generate_daily_routines()
RETURNS void AS $$
DECLARE
    routine RECORD;
    current_week_start date;
    s_date date := current_date;
BEGIN
    -- Calcular el inicio de semana (Lunes) para la fecha actual
    current_week_start := date_trunc('week', s_date)::date;

    FOR routine IN 
        SELECT * FROM public.user_routines WHERE is_active = true
    LOOP
        -- Insertar en allocations ("tasks")
        INSERT INTO public.allocations (
            employee_id,
            project_id,
            week_start_date,
            task_name,
            hours_assigned,
            status,
            created_at,
            user_priority -- Ponerlas al principio (prioridad alta/baja según lógica, usaremos -1 para tope)
        ) VALUES (
            routine.employee_id,
            routine.project_id, -- Si es null, el frontend deberá manejarlo o asignar proyecto "General"
            current_week_start,
            routine.title,
            (routine.estimated_minutes::numeric / 60.0), -- Convertir min a horas
            'planned',
            now(),
            -1 -- Prioridad tope para que salgan arriba
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Índices para rendimiento (Team Pulse View)
CREATE INDEX IF NOT EXISTS idx_allocations_employee_status_date ON public.allocations(employee_id, status, week_start_date);
