import { Plug } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { EndpointBlock } from '../components/EndpointBlock';

export function RestSection() {
  return (
    <section>
      <SectionHeading id="rest" icon={Plug} className="mb-6">
        API REST (HTTP)
      </SectionHeading>
      <p className="text-indigo-100/85 mb-6">
        Puedes hacer peticiones HTTP directas desde cualquier lenguaje. Todos los recursos siguen
        el mismo patron RESTful.
      </p>
      <div className="space-y-6">
        <EndpointBlock
          method="GET"
          path="/rest/v1/{recurso}?select=col1,col2&filtro=eq.valor"
          description="Listar recursos con filtros opcionales. Soporta select, filtros, paginacion y orden."
          curlExample={`curl -X GET \\
  'https://api.taimbox.com/rest/v1/employees?is_active=eq.true&order=name.asc' \\
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
          description="Crear un nuevo recurso. Envia el body como JSON."
          curlExample={`curl -X POST \\
  'https://api.taimbox.com/rest/v1/allocations' \\
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
  'https://api.taimbox.com/rest/v1/allocations?id=eq.<UUID>' \\
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
  'https://api.taimbox.com/rest/v1/allocations?id=eq.<UUID>' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>'`}
          sdkExample={`const { error } = await timeboxing
  .from('allocations')
  .delete()
  .eq('id', allocationId)`}
        />
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3">Llamadas RPC (tiempos / cronómetro)</h4>
        <p className="text-indigo-100/85 mb-4 text-sm">
          Para registrar horas desde un cronómetro o listar cronómetros activos del equipo se usan funciones RPC.
        </p>
        <EndpointBlock
          method="POST"
          path="/rest/v1/rpc/log_timer_hours"
          description="Cierra el cronómetro y registra horas: UPSERT en time_entries, actualiza allocations.hours_actual, inserta en timer_sessions y borra de active_timers. Solo el empleado vinculado al usuario (auth.uid) puede invocarla. Parámetros: p_employee_id, p_allocation_id, p_hours, p_notes (opcional), p_date (opcional, default hoy)."
          curlExample={`curl -X POST \\
  '<BASE_URL>/rest/v1/rpc/log_timer_hours' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -d '{"p_employee_id":"<UUID>","p_allocation_id":"<UUID>","p_hours":1.5,"p_notes":"Revisión"}'`}
          sdkExample={`const { error } = await timeboxing.rpc('log_timer_hours', {
  p_employee_id: employeeId,
  p_allocation_id: allocationId,
  p_hours: 1.5,
  p_notes: 'Revisión'
})`}
        />
        <EndpointBlock
          method="POST"
          path="/rest/v1/rpc/get_team_active_timers"
          description="Lista los cronómetros activos de todos los empleados de la agencia del usuario. Devuelve: employee_id, employee_name, allocation_id, task_name, client_name, started_at. Sin parámetros."
          curlExample={`curl -X POST \\
  '<BASE_URL>/rest/v1/rpc/get_team_active_timers' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>' \\
  -H 'Content-Type: application/json' \\
  -d '{}'`}
          sdkExample={`const { data } = await timeboxing.rpc('get_team_active_timers')`}
        />
      </div>
    </section>
  );
}
