import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';
import { ERROR_CODES } from '../data/tables';

export function OverviewResponses() {
  return (
    <section>
      <SectionHeading id="responses" icon={AlertTriangle} className="mb-6">
        Respuestas y errores
      </SectionHeading>
      <p className="text-indigo-100/85 mb-4">
        Todas las respuestas son JSON. La API devuelve códigos HTTP estándar y errores
        estructurados. Siempre verifica el campo{' '}
        <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-indigo-200">
          error
        </code>{' '}
        en la respuesta del SDK o el status HTTP en peticiones directas.
      </p>
      <div className="mb-6 p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
        <p className="text-sm text-slate-100/90">
          <strong className="text-slate-300">200 con cuerpo vacío:</strong> Una petición GET
          correcta (token válido) puede devolver <code className="font-mono text-xs">[]</code> con
          status 200 cuando no hay filas que cumplan el filtro o cuando RLS no permite ver
          ninguna. Solo recibirás 401/403 si el token es inválido o no tienes permiso para el
          recurso. Trata 200 + array vacío como &quot;sin resultados&quot;, no como error.
        </p>
      </div>

      <h3 className="text-white font-semibold mb-3">Formato de datos</h3>
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {[
          {
            title: 'GET lista',
            status: '200',
            desc: 'Devuelve un array JSON de objetos. Puede estar vacío si no hay resultados o si RLS no permite ver ninguna fila (mismo 200, no se distingue por seguridad).',
          },
          {
            title: 'GET/POST/PATCH uno',
            status: '200/201',
            desc: 'Devuelve un objeto JSON con Prefer: return=representation.',
          },
          {
            title: 'DELETE',
            status: '204',
            desc: 'Sin cuerpo de respuesta. Verifica que status sea 204.',
          },
        ].map(({ title, status, desc }) => (
          <div
            key={title}
            className="p-4 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {status}
              </span>
              <span className="text-sm font-semibold text-white">{title}</span>
            </div>
            <p className="text-xs text-indigo-200/70 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-white font-semibold mb-3">Códigos de estado</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/15">
              <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs w-20">
                Código
              </th>
              <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs w-32">
                Estado
              </th>
              <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs">
                Descripción
              </th>
            </tr>
          </thead>
          <tbody>
            {ERROR_CODES.map((ec, i) => (
              <tr
                key={ec.code}
                className={cn(
                  'border-b border-white/5',
                  i % 2 === 0 ? 'bg-white/[0.02]' : '',
                )}
              >
                <td className="py-2 px-3 font-mono text-white font-bold">{ec.code}</td>
                <td className="py-2 px-3 text-xs">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full font-medium',
                      ec.code < 300
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : ec.code < 500
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300',
                    )}
                  >
                    {ec.meaning}
                  </span>
                </td>
                <td className="py-2 px-3 text-indigo-100/80 text-xs">{ec.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-white font-semibold mb-3">Formato de error</h3>
      <CodeBlock lang="json">{`{
  "message": "new row violates row-level security policy",
  "details": null,
  "hint": null,
  "code": "42501"
}`}</CodeBlock>

      <div className="mt-6" />
      <h3 className="text-white font-semibold mb-3">Patrón recomendado (SDK)</h3>
      <CodeBlock lang="typescript">{`const { data, error } = await timeboxing
  .from('allocations')
  .insert({ /* ... */ })
  .select()
  .single()

if (error) {
  // error.message  -> descripcion legible
  // error.code     -> codigo PostgreSQL
  // error.details  -> detalles adicionales (puede ser null)
  console.error(\`Error [\${error.code}]: \${error.message}\`)
  throw error
}

// data contiene el recurso creado`}</CodeBlock>
    </section>
  );
}
