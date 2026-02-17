import { Rocket } from 'lucide-react';
import { SectionAnchor } from '../components/SectionAnchor';
import { TutorialStep } from '../components/TutorialStep';

export function TutorialQuickStart() {
  return (
    <section>
      <SectionAnchor id="tutorial-quickstart" />
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
        <Rocket className="h-6 w-6 text-indigo-300" /> Primeros pasos
      </h2>
      <p className="text-indigo-100/85 mb-6">
        En menos de 5 minutos tendras tu primera peticion funcionando. Este tutorial cubre: obtener
        un token, configurar el cliente y verificar la conexion.
      </p>

      <div className="mb-4 p-4 rounded-lg bg-white/[0.03] border border-white/5">
        <h4 className="text-white font-semibold text-sm mb-2">Prerequisitos</h4>
        <ul className="text-sm text-indigo-200/70 space-y-1 list-disc list-inside">
          <li>Cuenta de administrador en Timeboxing</li>
          <li>Node.js 18+ instalado (para el SDK) o cualquier cliente HTTP (cURL, Postman)</li>
        </ul>
      </div>

      <div className="space-y-0">
        <TutorialStep
          step={1}
          title="Genera tu token API"
          description="Accede a Configuracion > API & Integraciones en Timeboxing y crea un nuevo token. Dale un nombre descriptivo como 'Mi integracion' y selecciona permisos de lectura."
          note="El token solo se muestra una vez. Copialo y guardalo en un lugar seguro (ej: variable de entorno)."
        />
        <TutorialStep
          step={2}
          title="Instala el SDK (opcional)"
          description="Si usas JavaScript/TypeScript, instala el SDK de Supabase para simplificar las consultas."
          code={`npm install @supabase/supabase-js`}
          lang="bash"
        />
        <TutorialStep
          step={3}
          title="Configura el cliente"
          description="Crea un archivo de configuracion con tus credenciales. Nunca hardcodees tokens en el codigo fuente."
          code={`import { createClient } from '@supabase/supabase-js'

const timeboxing = createClient(
  'http://supabase.peypons.duckdns.org',
  process.env.SUPABASE_ANON_KEY!,
  {
    global: {
      headers: { Authorization: \`Bearer \${process.env.TIMEBOXING_API_TOKEN}\` }
    }
  }
)`}
        />
        <TutorialStep
          step={4}
          title="Haz tu primera peticion"
          description="Verifica que todo funciona listando los empleados activos de tu agencia."
          code={`const { data, error } = await timeboxing
  .from('employees')
  .select('id, name, role')
  .eq('is_active', true)
  .limit(5)

if (error) {
  console.error('Error de conexion:', error.message)
} else {
  console.log('Conexion exitosa! Empleados:', data)
  // [{ id: "...", name: "Ana Garcia", role: "Disenador" }, ...]
}`}
          note="Si recibes un error 401, verifica que la ANON_KEY y el API_TOKEN sean correctos. Si recibes un array vacio, es posible que no haya empleados activos en tu agencia."
        />
        <TutorialStep
          step={5}
          title="Tambien funciona con cURL"
          description="Si no usas JavaScript, puedes verificar la conexion con una peticion HTTP directa."
          code={`curl -s \\
  'http://supabase.peypons.duckdns.org/rest/v1/employees?is_active=eq.true&limit=5&select=id,name,role' \\
  -H 'apikey: TU_ANON_KEY' \\
  -H 'Authorization: Bearer TU_API_TOKEN' | json_pp`}
          lang="bash"
        />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm text-emerald-100/90">
          <strong className="text-emerald-300">Siguiente paso:</strong> Ahora que tienes la
          conexion funcionando, aprende a{' '}
          <button
            onClick={() => document.getElementById('tutorial-sync-team')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-emerald-300 underline hover:text-white"
          >
            sincronizar tu equipo
          </button>
          .
        </p>
      </div>
    </section>
  );
}
