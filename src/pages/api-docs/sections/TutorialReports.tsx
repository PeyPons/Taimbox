import { BarChart3 } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { TutorialStep } from '../components/TutorialStep';

export function TutorialReports() {
  return (
    <section>
      <SectionHeading id="tutorial-reports" icon={BarChart3} className="mb-2">
        Exportar reportes
      </SectionHeading>
      <p className="text-indigo-100/85 mb-6">
        Consulta datos de planificacion para generar reportes de horas, rentabilidad y ocupacion
        del equipo.
      </p>

      <div className="space-y-0">
        <TutorialStep
          step={1}
          title="Obtener horas por proyecto y mes"
          description="Lee todas las asignaciones de un mes para calcular horas totales por proyecto."
          code={`const { data: allocations } = await timeboxing
  .from('allocations')
  .select('project_id, hours_assigned, hours_actual, hours_computed')
  .gte('week_start_date', '2026-02-01')
  .lte('week_start_date', '2026-02-28')

// Agrupar por proyecto
const byProject = {}
allocations?.forEach(a => {
  if (!byProject[a.project_id]) {
    byProject[a.project_id] = { planned: 0, actual: 0, computed: 0 }
  }
  byProject[a.project_id].planned += a.hours_assigned
  byProject[a.project_id].actual += a.hours_actual
  byProject[a.project_id].computed += a.hours_computed
})

console.log('Horas por proyecto:', byProject)`}
        />
        <TutorialStep
          step={2}
          title="Calcular rentabilidad"
          description="Cruza las horas con los datos del proyecto (presupuesto, tarifa mensual) para obtener métricas de rentabilidad."
          code={`const { data: projects } = await timeboxing
  .from('projects')
  .select('id, name, budget_hours, monthly_fee')
  .eq('status', 'active')

const report = projects?.map(p => {
  const hours = byProject[p.id] || { planned: 0, actual: 0, computed: 0 }
  const progress = p.budget_hours > 0
    ? Math.round((hours.computed / p.budget_hours) * 100)
    : 0
  const hourValue = p.budget_hours > 0
    ? (p.monthly_fee / p.budget_hours).toFixed(2)
    : '0'

  return {
    project: p.name,
    budgetHours: p.budget_hours,
    hoursPlanned: hours.planned,
    hoursActual: hours.actual,
    progress: \`\${progress}%\`,
    hourValue: \`\${hourValue} EUR/h\`
  }
})

console.table(report)`}
        />
        <TutorialStep
          step={3}
          title="Reporte de ocupacion del equipo"
          description="Calcula la carga de cada empleado para detectar sobrecargas o infrautilización."
          code={`const { data: employees } = await timeboxing
  .from('employees')
  .select('id, name, default_weekly_capacity')
  .eq('is_active', true)

const { data: monthAllocations } = await timeboxing
  .from('allocations')
  .select('employee_id, hours_assigned')
  .gte('week_start_date', '2026-02-01')
  .lte('week_start_date', '2026-02-28')

const occupancy = employees?.map(emp => {
  const totalHours = monthAllocations
    ?.filter(a => a.employee_id === emp.id)
    .reduce((sum, a) => sum + a.hours_assigned, 0) || 0
  const capacity = emp.default_weekly_capacity * 4 // 4 semanas aprox
  const load = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0

  return { name: emp.name, totalHours, capacity, load: \`\${load}%\` }
})

console.table(occupancy)`}
        />
        <TutorialStep
          step={4}
          title="Exportar a CSV"
          description="Convierte los datos a CSV para importar en Excel o Google Sheets."
          code={`function toCSV(data, headers) {
  const rows = [headers.join(',')]
  data.forEach(row => {
    rows.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  })
  return rows.join('\\n')
}

const csv = toCSV(report, ['project', 'budgetHours', 'hoursPlanned', 'hoursActual', 'progress', 'hourValue'])

// Node.js: guardar a archivo
// require('fs').writeFileSync('report.csv', csv)

// Browser: descargar
// const blob = new Blob([csv], { type: 'text/csv' })
// const url = URL.createObjectURL(blob)
// window.open(url)`}
        />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm text-emerald-100/90">
          <strong className="text-emerald-300">Siguiente paso:</strong> Aprende a{' '}
          <button
            onClick={() => document.getElementById('tutorial-absences')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-emerald-300 underline hover:text-white"
          >
            gestionar ausencias y eventos
          </button>{' '}
          para mantener la capacidad actualizada.
        </p>
      </div>
    </section>
  );
}
