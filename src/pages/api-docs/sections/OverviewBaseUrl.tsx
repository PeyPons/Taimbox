import { Globe, AlertTriangle } from 'lucide-react';
import { SectionAnchor } from '../components/SectionAnchor';
import { CodeBlock } from '../components/CodeBlock';

export function OverviewBaseUrl() {
  return (
    <section>
      <SectionAnchor id="base-url" />
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Globe className="h-6 w-6 text-indigo-300" /> Base URL y headers
      </h2>
      <p className="text-indigo-100/85 mb-4">
        Todas las peticiones van contra la URL de la API de Timeboxing. Necesitas la{' '}
        <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-indigo-200">
          ANON_KEY
        </code>{' '}
        de tu instancia Supabase (la misma que usa la app) y un{' '}
        <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-indigo-200">
          API_TOKEN
        </code>{' '}
        que puedes generar desde la seccion <strong>API & Integraciones</strong>.
      </p>
      <CodeBlock lang="bash">{`# URL base de la API de Timeboxing
http://supabase.peypons.duckdns.org/rest/v1/

# Headers obligatorios en cada peticion
apikey: <ANON_KEY>                      # Clave anonima de tu instancia Supabase
Authorization: Bearer <TU_API_TOKEN>    # Token generado en API & Integraciones
Content-Type: application/json
Prefer: return=representation           # Para recibir el objeto creado/modificado`}</CodeBlock>
      <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-100/90">
            <strong className="text-amber-300">Importante:</strong> Tu token esta vinculado a
            tu{' '}
            <code className="px-1 rounded bg-white/10 font-mono text-xs">agency_id</code>{' '}
            mediante un JWT firmado. Solo podras leer y escribir datos de tu propia agencia
            gracias a las politicas RLS. Si necesitas revocar un token, hazlo desde la seccion
            API & Integraciones.
          </p>
        </div>
      </div>
    </section>
  );
}
