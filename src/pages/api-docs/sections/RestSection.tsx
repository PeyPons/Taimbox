import { Plug } from 'lucide-react';
import { SectionAnchor } from '../components/SectionAnchor';
import { EndpointBlock } from '../components/EndpointBlock';

export function RestSection() {
  return (
    <section>
      <SectionAnchor id="rest" />
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Plug className="h-6 w-6 text-indigo-300" /> API REST (HTTP)
      </h2>
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
  'http://supabase.peypons.duckdns.org/rest/v1/employees?is_active=eq.true&order=name.asc' \\
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
  'http://supabase.peypons.duckdns.org/rest/v1/allocations' \\
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
  'http://supabase.peypons.duckdns.org/rest/v1/allocations?id=eq.<UUID>' \\
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
  'http://supabase.peypons.duckdns.org/rest/v1/allocations?id=eq.<UUID>' \\
  -H 'apikey: <TU_API_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>'`}
          sdkExample={`const { error } = await timeboxing
  .from('allocations')
  .delete()
  .eq('id', allocationId)`}
        />
      </div>
    </section>
  );
}
