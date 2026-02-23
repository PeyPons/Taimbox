import { Rocket } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { TutorialStep } from '../components/TutorialStep';

export function TutorialQuickStart() {
  return (
    <section>
      <SectionHeading id="tutorial-quickstart" icon={Rocket} className="mb-2">
        Primeros pasos
      </SectionHeading>
      <p className="text-indigo-100/85 mb-6">
        En menos de 5 minutos tendrás tu primera petición funcionando. Este tutorial cubre: obtener
        un token, configurar el cliente y verificar la conexión.
      </p>

      <div className="mb-4 p-4 rounded-lg bg-white/[0.03] border border-white/5">
        <h4 className="text-white font-semibold text-sm mb-2">Prerequisitos</h4>
        <ul className="text-sm text-indigo-200/70 space-y-1 list-disc list-inside">
          <li>Cuenta de administrador en Taimbox</li>
          <li>Node.js 18+ instalado (para el SDK) o cualquier cliente HTTP (cURL, Postman)</li>
        </ul>
      </div>

      <div className="space-y-0">
        <TutorialStep
          step={1}
          title="Genera tu token API"
          description="Accede a Configuración > API & Integraciones en Taimbox y crea un nuevo token. Dale un nombre descriptivo como 'Mi integración' y selecciona permisos de lectura."
          note="El token solo se muestra una vez. Cópialo y guárdalo en un lugar seguro (ej: variable de entorno)."
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
          description="Crea un archivo de configuración con tus credenciales. Nunca hardcodees tokens en el código fuente."
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
          note="Si usas solo HTTP (cURL, Postman, Python requests, etc.), no necesitas este paso: usa la URL base y los headers apikey y Authorization en cada petición. Puedes ir al paso 5 para ver un ejemplo con cURL."
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
          note="Si recibes un error 401, verifica que la ANON_KEY y el API_TOKEN sean correctos. Si recibes un array vacío, es posible que no haya empleados activos en tu agencia."
        />
        <TutorialStep
          step={5}
          title="También funciona con cURL"
          description="Si no usas JavaScript, puedes verificar la conexión con una petición HTTP directa."
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
