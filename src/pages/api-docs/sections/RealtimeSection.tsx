import { Zap } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';

export function RealtimeSection() {
  return (
    <section>
      <SectionHeading id="realtime" icon={Zap} className="mb-6">
        Suscripciones Realtime
      </SectionHeading>
      <p className="text-indigo-100/85 mb-4">
        Recibe cambios en tiempo real sin polling. Ideal para dashboards que se actualizan
        automáticamente cuando alguien modifica una asignación o crea una ausencia.
      </p>
      <CodeBlock lang="typescript">{`// Escuchar cambios en asignaciones de un proyecto (requiere SDK)
const channel = timeboxing
  .channel('project-allocations')
  .on(
    'postgres_changes',
    {
      event: '*',           // INSERT, UPDATE, DELETE (o uno especifico)
      schema: 'public',
      table: 'allocations',
      filter: \`project_id=eq.\${projectId}\`
    },
    (payload) => {
      console.log('Cambio detectado:', payload.eventType, payload.new)
      // payload.new = fila despues del cambio
      // payload.old = fila antes del cambio (solo en UPDATE/DELETE)
    }
  )
  .subscribe()

// Desuscribirse cuando ya no sea necesario
timeboxing.removeChannel(channel)`}</CodeBlock>
      <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-100/90">
            <strong className="text-indigo-300">Nota:</strong> Realtime está habilitado en las
            tablas principales (allocations, employees, projects). Si necesitas suscripciones en
            otras tablas, contacta con nuestro equipo.
          </p>
        </div>
      </div>
    </section>
  );
}
