import { CalendarOff } from 'lucide-react';
import { SectionAnchor } from '../components/SectionAnchor';
import { TutorialStep } from '../components/TutorialStep';

export function TutorialAbsences() {
  return (
    <section>
      <SectionAnchor id="tutorial-absences" />
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
        <CalendarOff className="h-6 w-6 text-indigo-300" /> Gestionar ausencias
      </h2>
      <p className="text-indigo-100/85 mb-6">
        Registra vacaciones, bajas y eventos del equipo para que la capacidad disponible se ajuste
        automaticamente en la planificacion.
      </p>

      <div className="space-y-0">
        <TutorialStep
          step={1}
          title="Leer ausencias de un empleado"
          description="Consulta las ausencias registradas para un periodo."
          code={`const { data: absences } = await timeboxing
  .from('absences')
  .select('id, employee_id, start_date, end_date, type, hours, description')
  .eq('employee_id', employeeId)
  .gte('end_date', '2026-03-01')
  .order('start_date')

// Resultado: vacaciones, bajas, permisos del empleado en marzo`}
        />
        <TutorialStep
          step={2}
          title="Crear una ausencia (vacaciones)"
          description="Registra un periodo de vacaciones. La capacidad del empleado se reducira automaticamente en el planificador."
          code={`const { data: absence, error } = await timeboxing
  .from('absences')
  .insert({
    employee_id: employeeId,
    start_date: '2026-04-06',
    end_date: '2026-04-10',
    type: 'vacaciones',
    description: 'Semana Santa'
  })
  .select()
  .single()

if (!error) {
  console.log('Ausencia registrada:', absence.id)
  // La capacidad de esa semana se reducira automaticamente
}`}
          note="Tipos comunes: 'vacaciones', 'baja', 'permiso', 'formacion'. Puedes usar cualquier texto."
        />
        <TutorialStep
          step={3}
          title="Ausencia parcial (medio dia)"
          description="Para ausencias que no cubren el dia completo, usa el campo hours."
          code={`const { data } = await timeboxing
  .from('absences')
  .insert({
    employee_id: employeeId,
    start_date: '2026-03-15',
    end_date: '2026-03-15',
    type: 'permiso',
    hours: 4,
    description: 'Cita medica por la manana'
  })
  .select()
  .single()

// Solo se reducen 4h de capacidad ese dia (en vez de la jornada completa)`}
        />
        <TutorialStep
          step={4}
          title="Crear un evento de equipo (festivo)"
          description="Los eventos afectan a multiples empleados. Ideal para festivos o formaciones grupales."
          code={`// Primero obtener IDs de empleados afectados
const { data: employees } = await timeboxing
  .from('employees')
  .select('id')
  .eq('is_active', true)

const employeeIds = employees?.map(e => e.id) || []

// Crear el evento
const { data: event } = await timeboxing
  .from('team_events')
  .insert({
    name: 'Dia de Andalucia',
    date: '2026-02-28',
    hours_reduction: 8,
    affected_employee_ids: employeeIds,
    description: 'Festivo regional'
  })
  .select()
  .single()

console.log('Evento creado. Afecta a', employeeIds.length, 'empleados')`}
        />
        <TutorialStep
          step={5}
          title="Calcular capacidad real"
          description="Cruza ausencias y eventos con el horario laboral para saber la capacidad real de una semana."
          code={`// Obtener datos de la semana
const weekStart = '2026-03-09'
const weekEnd = '2026-03-13' // Vie

const [{ data: absences }, { data: events }, { data: employee }] = await Promise.all([
  timeboxing.from('absences')
    .select('start_date, end_date, hours')
    .eq('employee_id', empId)
    .lte('start_date', weekEnd)
    .gte('end_date', weekStart),
  timeboxing.from('team_events')
    .select('date, hours_reduction')
    .gte('date', weekStart)
    .lte('date', weekEnd),
  timeboxing.from('employees')
    .select('default_weekly_capacity')
    .eq('id', empId)
    .single()
])

const baseCapacity = employee?.default_weekly_capacity || 40
const absenceHours = absences?.reduce((s, a) => s + (a.hours || 8), 0) || 0
const eventHours = events?.reduce((s, e) => s + e.hours_reduction, 0) || 0
const effectiveCapacity = Math.max(0, baseCapacity - Math.max(absenceHours, eventHours))

console.log(\`Capacidad real: \${effectiveCapacity}h / \${baseCapacity}h\`)`}
          note="Timeboxing usa Max(ausencia, evento) por dia para evitar doble contabilidad. Este ejemplo simplifica el calculo; la app usa un algoritmo diario mas preciso."
        />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm text-emerald-100/90">
          <strong className="text-emerald-300">Completado!</strong> Ahora dominas los casos de
          uso principales de la API. Consulta la{' '}
          <button
            onClick={() => document.getElementById('res-organizacion')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-emerald-300 underline hover:text-white"
          >
            Referencia de Recursos
          </button>{' '}
          para ver todos los campos y opciones de cada tabla.
        </p>
      </div>
    </section>
  );
}
