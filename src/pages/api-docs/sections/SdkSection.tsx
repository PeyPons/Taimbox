import { Terminal } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';

export function SdkSection() {
  return (
    <section>
      <SectionHeading id="sdk" icon={Terminal} className="mb-6">
        SDK JavaScript (opcional)
      </SectionHeading>
      <p className="text-indigo-100/85 mb-4">
        Puedes integrar la API mediante peticiones HTTP estándar (ver sección REST) o, si trabajas
        con JavaScript/TypeScript, usar el SDK que simplifica las consultas con una sintaxis más
        legible.
      </p>
      <CodeBlock lang="bash">{`npm install @supabase/supabase-js`}</CodeBlock>
      <div className="mt-4" />
      <CodeBlock lang="typescript">{`import { createClient } from '@supabase/supabase-js'

// URL de tu instancia Supabase + clave anonima (la misma que usa la app)
const SUPABASE_URL = 'http://supabase.peypons.duckdns.org'
const ANON_KEY = process.env.SUPABASE_ANON_KEY

// Token API generado desde API & Integraciones
const API_TOKEN = process.env.TIMEBOXING_API_TOKEN

const timeboxing = createClient(SUPABASE_URL, ANON_KEY, {
  global: {
    headers: { Authorization: \`Bearer \${API_TOKEN}\` }
  }
})

// Ejemplo: listar empleados activos de tu agencia
// (RLS filtra automaticamente por tu agency_id)
const { data: employees, error } = await timeboxing
  .from('employees')
  .select('id, name, role, email')
  .eq('is_active', true)
  .order('name')

if (error) {
  console.error('Error:', error.message)
} else {
  console.log('Empleados:', employees)
}`}</CodeBlock>
      <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-start gap-2">
          <Terminal className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-100/90">
            <strong className="text-indigo-300">Nota:</strong> No necesitas filtrar por{' '}
            <code className="px-1 rounded bg-white/10 font-mono text-xs">agency_id</code> en
            cada consulta: tu token JWT contiene el{' '}
            <code className="px-1 rounded bg-white/10 font-mono text-xs">agency_id</code> de tu
            agencia y las políticas RLS lo aplican automáticamente a nivel de base de datos.
          </p>
        </div>
      </div>
    </section>
  );
}
