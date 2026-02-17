import { CalendarDays } from 'lucide-react';
import { SectionAnchor } from '../components/SectionAnchor';
import { TutorialStep } from '../components/TutorialStep';

export function TutorialPlanning() {
  return (
    <section>
      <SectionAnchor id="tutorial-planning" />
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-indigo-300" /> Automatizar planificacion
      </h2>
      <p className="text-indigo-100/85 mb-6">
        Crea y gestiona asignaciones de tareas semanales programaticamente. Ideal para
        pre-planificar sprints o distribuir horas automaticamente.
      </p>

      <div className="space-y-0">
        <TutorialStep
          step={1}
          title="Leer asignaciones existentes"
          description="Consulta las tareas planificadas de un empleado para un rango de fechas."
          code={`const { data: allocations } = await timeboxing
  .from('allocations')
  .select(\`
    id, employee_id, project_id, week_start_date,
    hours_assigned, hours_actual, task_name, status
  \`)
  .eq('employee_id', employeeId)
  .gte('week_start_date', '2026-03-01')
  .lte('week_start_date', '2026-03-31')
  .order('week_start_date')

// Resultado: array de asignaciones del mes`}
        />
        <TutorialStep
          step={2}
          title="Crear una asignacion"
          description="Asigna horas de un empleado a un proyecto para una semana concreta. week_start_date debe ser un lunes."
          code={`const { data: allocation, error } = await timeboxing
  .from('allocations')
  .insert({
    employee_id: 'uuid-del-empleado',
    project_id: 'uuid-del-proyecto',
    week_start_date: '2026-03-02',  // Lunes
    hours_assigned: 16,
    task_name: 'Maquetacion homepage',
    status: 'planned'
  })
  .select()
  .single()

if (!error) {
  console.log('Tarea creada:', allocation.id)
}`}
          note="Si week_start_date no es un lunes, la asignacion se creara igualmente pero puede causar inconsistencias en el planificador visual."
        />
        <TutorialStep
          step={3}
          title="Distribuir horas entre semanas"
          description="Crea multiples asignaciones en batch para distribuir un presupuesto mensual."
          code={`const weeks = ['2026-03-02', '2026-03-09', '2026-03-16', '2026-03-23']
const hoursPerWeek = 10

const rows = weeks.map(week => ({
  employee_id: employeeId,
  project_id: projectId,
  week_start_date: week,
  hours_assigned: hoursPerWeek,
  task_name: 'Campana mensual',
  status: 'planned'
}))

const { data, error } = await timeboxing
  .from('allocations')
  .insert(rows)
  .select()

console.log(\`Creadas \${data?.length} asignaciones\`)`}
        />
        <TutorialStep
          step={4}
          title="Actualizar horas reales"
          description="Cuando el empleado reporta horas trabajadas, actualiza hours_actual."
          code={`const { error } = await timeboxing
  .from('allocations')
  .update({
    hours_actual: 14,
    status: 'completed'
  })
  .eq('id', allocationId)

// La asignacion queda marcada como completada con 14h reales`}
        />
        <TutorialStep
          step={5}
          title="Configurar objetivos mensuales (deadlines)"
          description="Define cuantas horas debe dedicar cada empleado a un proyecto en un mes."
          code={`const { data: deadline } = await timeboxing
  .from('deadlines')
  .upsert({
    project_id: projectId,
    month: '2026-03',
    employee_hours: {
      [employeeId1]: 40,
      [employeeId2]: 20
    },
    budget_override: 120
  })
  .select()
  .single()

// Objetivo: empleado1 dedica 40h y empleado2 dedica 20h al proyecto en marzo`}
          note="budget_override sobreescribe el presupuesto general del proyecto solo para ese mes. Si es null, se usa project.budget_hours."
        />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm text-emerald-100/90">
          <strong className="text-emerald-300">Siguiente paso:</strong> Aprende a{' '}
          <button
            onClick={() => document.getElementById('tutorial-reports')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-emerald-300 underline hover:text-white"
          >
            exportar reportes de rentabilidad
          </button>{' '}
          con los datos de planificacion.
        </p>
      </div>
    </section>
  );
}
