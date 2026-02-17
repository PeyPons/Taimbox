import { Users } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { TutorialStep } from '../components/TutorialStep';

export function TutorialSyncTeam() {
  return (
    <section>
      <SectionHeading id="tutorial-sync-team" icon={Users} className="mb-2">
        Sincronizar equipo
      </SectionHeading>
      <p className="text-indigo-100/85 mb-6">
        Aprende a leer la lista de empleados, crear nuevos miembros y actualizar horarios desde tu
        sistema externo.
      </p>

      <div className="mb-4 p-4 rounded-lg bg-white/[0.03] border border-white/5">
        <h4 className="text-white font-semibold text-sm mb-2">Prerequisitos</h4>
        <ul className="text-sm text-indigo-200/70 space-y-1 list-disc list-inside">
          <li>
            Cliente configurado (ver{' '}
            <button
              onClick={() => document.getElementById('tutorial-quickstart')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-indigo-300 underline hover:text-white"
            >
              Primeros pasos
            </button>
            )
          </li>
          <li>Token con permisos de lectura/escritura</li>
        </ul>
      </div>

      <div className="space-y-0">
        <TutorialStep
          step={1}
          title="Leer todos los empleados"
          description="Obtener la lista completa de empleados activos con sus datos basicos."
          code={`const { data: employees, error } = await timeboxing
  .from('employees')
  .select('id, name, email, role, default_weekly_capacity, work_schedule, is_active')
  .eq('is_active', true)
  .order('name')

// Resultado: array de empleados
// [{ id: "e1-...", name: "Ana Garcia", email: "ana@...", role: "Disenador", ... }]`}
          note="RLS filtra automaticamente por tu agencia. No necesitas pasar agency_id en los filtros."
        />
        <TutorialStep
          step={2}
          title="Crear un nuevo empleado"
          description="Anade un miembro al equipo. Los campos obligatorios son: name, role, default_weekly_capacity, work_schedule y agency_id. El agency_id lo puedes copiar desde API & Integraciones (Datos de conexion)."
          code={`const { data: newEmployee, error } = await timeboxing
  .from('employees')
  .insert({
    name: 'Laura Martinez',
    first_name: 'Laura',
    last_name: 'Martinez',
    email: 'laura@agencia.com',
    role: 'Desarrollador',
    default_weekly_capacity: 40,
    work_schedule: {
      monday: 8, tuesday: 8, wednesday: 8,
      thursday: 8, friday: 8, saturday: 0, sunday: 0
    },
    agency_id: process.env.TIMEBOXING_AGENCY_ID  // Copiado desde API & Integraciones
  })
  .select()
  .single()

if (error) {
  console.error('Error al crear empleado:', error.message)
} else {
  console.log('Empleado creado:', newEmployee.id)
}`}
        />
        <TutorialStep
          step={3}
          title="Actualizar horario laboral"
          description="Modifica las horas semanales de un empleado existente. Util para reflejar cambios de jornada."
          code={`const { data, error } = await timeboxing
  .from('employees')
  .update({
    default_weekly_capacity: 32,
    work_schedule: {
      monday: 8, tuesday: 8, wednesday: 8,
      thursday: 8, friday: 0, saturday: 0, sunday: 0
    }
  })
  .eq('id', employeeId)
  .select()
  .single()

// El empleado ahora trabaja 32h/semana (L-J)`}
        />
        <TutorialStep
          step={4}
          title="Desactivar un empleado"
          description="En vez de eliminar, es recomendable desactivar. Asi se mantiene el historico de asignaciones."
          code={`const { error } = await timeboxing
  .from('employees')
  .update({ is_active: false })
  .eq('id', employeeId)

// El empleado ya no aparecera en planificacion ni vistas activas`}
          note="Los empleados inactivos mantienen sus asignaciones historicas. No uses DELETE a menos que quieras eliminar todo rastro."
        />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm text-emerald-100/90">
          <strong className="text-emerald-300">Siguiente paso:</strong> Con el equipo
          sincronizado, aprende a{' '}
          <button
            onClick={() => document.getElementById('tutorial-planning')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-emerald-300 underline hover:text-white"
          >
            automatizar la planificacion
          </button>
          .
        </p>
      </div>
    </section>
  );
}
