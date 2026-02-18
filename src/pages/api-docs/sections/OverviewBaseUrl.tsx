import { Globe, AlertTriangle } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';

export function OverviewBaseUrl() {
  return (
    <section>
      <SectionHeading id="base-url" icon={Globe} className="mb-6">
        Base URL y headers
      </SectionHeading>
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

# Headers obligatorios en cada petición
apikey: <ANON_KEY>                      # Clave anonima de tu instancia Supabase
Authorization: Bearer <TU_API_TOKEN>    # Token generado en API & Integraciones
Content-Type: application/json
Prefer: return=representation           # Para recibir el objeto creado/modificado`}</CodeBlock>
      <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-100/90">
            <strong className="text-amber-300">Importante:</strong> Tu token está vinculado a
            tu agencia mediante un JWT firmado. Solo podrás leer y escribir datos de tu propia
            agencia gracias a las políticas RLS. Si necesitas revocar un token, hazlo desde la
            seccion API & Integraciones.
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <h4 className="text-white font-semibold text-sm mb-2">¿Cuándo necesito el ID de agencia?</h4>
        <ul className="text-sm text-indigo-100/90 space-y-1 list-disc list-inside">
          <li>
            <strong>En lecturas (GET):</strong> Nunca. El token ya identifica tu agencia y RLS
            filtra automáticamente. No hace falta pasar <code className="font-mono text-xs">agency_id</code> en los filtros.
          </li>
          <li>
            <strong>En inserciones (POST):</strong> Al crear empleados, clientes, proyectos u otros
            recursos que pertenecen a una agencia, el body debe incluir <code className="font-mono text-xs">agency_id</code>.
            Puedes copiarlo desde <strong>API & Integraciones</strong> (seccion &quot;Datos de conexion&quot;, campo &quot;ID de agencia&quot;)
            o obtenerlo con <code className="font-mono text-xs">GET /agencies</code> (solo veras tu agencia).
          </li>
        </ul>
      </div>
    </section>
  );
}
