import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionAnchor } from '../components/SectionAnchor';
import { CodeBlock } from '../components/CodeBlock';

const FILTER_OPS = [
  ['Igual', '.eq(col, val)', 'col=eq.val', 'Coincidencia exacta'],
  ['Distinto', '.neq(col, val)', 'col=neq.val', 'No igual'],
  ['Mayor que', '.gt(col, val)', 'col=gt.val', 'Estrictamente mayor'],
  ['Mayor o igual', '.gte(col, val)', 'col=gte.val', 'Mayor o igual'],
  ['Menor que', '.lt(col, val)', 'col=lt.val', 'Estrictamente menor'],
  ['Menor o igual', '.lte(col, val)', 'col=lte.val', 'Menor o igual'],
  ['Contiene texto', '.like(col, pattern)', 'col=like.%val%', 'LIKE (case sensitive)'],
  ['Contiene (no case)', '.ilike(col, pattern)', 'col=ilike.%val%', 'ILIKE (case insensitive)'],
  ['En lista', '.in(col, [a,b])', 'col=in.(a,b)', 'IN (lista de valores)'],
  ['Es nulo', '.is(col, null)', 'col=is.null', 'IS NULL'],
];

export function FilteringSection() {
  return (
    <section>
      <SectionAnchor id="filtering" />
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Filter className="h-6 w-6 text-indigo-300" /> Filtrado, paginacion y ordenacion
      </h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-white font-semibold mb-3">Operadores de filtro</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/15">
                  <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">Operador</th>
                  <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">SDK</th>
                  <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">HTTP</th>
                  <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">Descripcion</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {FILTER_OPS.map(([op, sdk, http, desc], i) => (
                  <tr key={i} className={cn('border-b border-white/5', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
                    <td className="py-2 px-3 text-white font-sans font-medium">{op}</td>
                    <td className="py-2 px-3 text-purple-300">{sdk}</td>
                    <td className="py-2 px-3 text-cyan-300">{http}</td>
                    <td className="py-2 px-3 text-indigo-200/70 font-sans">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Paginacion</h3>
          <CodeBlock lang="typescript">{`// SDK: limit + offset (mas range)
const { data } = await timeboxing
  .from('allocations')
  .select('*', { count: 'exact' })  // count total de filas
  .range(0, 24)                      // primeras 25 filas (0-indexado)

// HTTP: header Range
// Range: 0-24`}</CodeBlock>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Ordenacion</h3>
          <CodeBlock lang="typescript">{`// SDK
const { data } = await timeboxing
  .from('employees')
  .select('*')
  .order('name', { ascending: true })
  .order('created_at', { ascending: false })

// HTTP: order=name.asc,created_at.desc`}</CodeBlock>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Ejemplo completo</h3>
          <p className="text-indigo-100/80 text-sm mb-3">
            Obtener asignaciones de febrero 2026 para un empleado, ordenadas por fecha:
          </p>
          <CodeBlock lang="typescript">{`const { data, error, count } = await timeboxing
  .from('allocations')
  .select('id, project_id, week_start_date, hours_assigned, task_name, status', { count: 'exact' })
  .eq('employee_id', employeeId)
  .gte('week_start_date', '2026-02-01')
  .lte('week_start_date', '2026-02-28')
  .eq('status', 'planned')
  .order('week_start_date')
  .range(0, 49)

// count = numero total de resultados (paginacion)
// data = array de asignaciones`}</CodeBlock>
        </div>
      </div>
    </section>
  );
}
