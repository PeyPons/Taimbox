import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Key, Shield, AlertTriangle, Clock, RefreshCw, Eye } from 'lucide-react';
import { SectionAnchor } from '../components/SectionAnchor';
import { CodeBlock } from '../components/CodeBlock';

export function OverviewAuth() {
  return (
    <section>
      <SectionAnchor id="auth" />
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Key className="h-6 w-6 text-indigo-300" /> Autenticacion y seguridad
      </h2>
      <p className="text-indigo-100/85 mb-6">
        Para usar la API necesitas dos valores en los headers de cada peticion:
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                HEADER
              </span>
              <code className="text-white font-medium text-sm font-mono">apikey</code>
            </div>
            <p className="text-xs text-indigo-200/70 leading-relaxed">
              La clave anonima (
              <code className="text-indigo-200 bg-white/10 px-1 rounded font-mono">ANON_KEY</code>
              ) de tu instancia Supabase. Es la misma que usa la aplicacion web. Se envia en el
              header{' '}
              <code className="text-indigo-200 bg-white/10 px-1 rounded font-mono">apikey</code>.
            </p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                HEADER
              </span>
              <code className="text-white font-medium text-sm font-mono">Authorization</code>
            </div>
            <p className="text-xs text-indigo-200/70 leading-relaxed">
              Token JWT generado desde{' '}
              <Link to="/api-keys" className="text-indigo-300 underline hover:text-white">
                API & Integraciones
              </Link>
              . Contiene el{' '}
              <code className="text-indigo-200 bg-white/10 px-1 rounded font-mono">
                agency_id
              </code>{' '}
              de tu agencia. Se envia como{' '}
              <code className="text-indigo-200 bg-white/10 px-1 rounded font-mono">
                Bearer &lt;token&gt;
              </code>
              .
            </p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-white font-semibold mb-3">Como obtener un token</h3>
      <div className="mb-6 space-y-3">
        {[
          'Inicia sesion en Timeboxing como administrador de tu agencia.',
          'Ve a Configuracion \u2192 API & Integraciones en el menu lateral.',
          'Haz clic en Crear token, asigna un nombre descriptivo y elige los permisos (lectura o lectura/escritura).',
          'Copia el token JWT que se muestra. Solo se muestra una vez; guardalo en un lugar seguro.',
        ].map((text, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0">
              {i + 1}
            </span>
            <span className="text-sm text-indigo-100/85">{text}</span>
          </div>
        ))}
      </div>

      <h3 className="text-white font-semibold mb-3">Ejemplo de peticion autenticada</h3>
      <CodeBlock lang="bash">{`curl -X GET \\
  'http://supabase.peypons.duckdns.org/rest/v1/employees?is_active=eq.true' \\
  -H 'apikey: <ANON_KEY>' \\
  -H 'Authorization: Bearer <TU_API_TOKEN>' \\
  -H 'Content-Type: application/json'`}</CodeBlock>

      <h3 className="text-white font-semibold mt-8 mb-4">Buenas practicas de seguridad</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {[
          {
            icon: Eye,
            title: 'No expongas tokens',
            text: 'Nunca incluyas tokens en repositorios publicos, logs o codigo frontend accesible.',
          },
          {
            icon: RefreshCw,
            title: 'Rota periodicamente',
            text: 'Revoca y regenera tokens cada cierto tiempo. Revoca inmediatamente si sospechas compromiso.',
          },
          {
            icon: Shield,
            title: 'Permisos minimos',
            text: 'Crea tokens con solo los permisos necesarios. Usa solo lectura si no necesitas escribir.',
          },
          {
            icon: Clock,
            title: 'Usa expiracion',
            text: 'Al crear un token puedes definir dias de expiracion. Los tokens sin expirar son mas riesgosos.',
          },
        ].map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="p-4 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">{title}</span>
            </div>
            <p className="text-xs text-indigo-200/70 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div className="text-sm text-indigo-100/90">
              <strong className="text-indigo-300">Row Level Security (RLS):</strong> Las
              politicas RLS de la base de datos garantizan que solo puedes acceder a datos de tu
              agencia. El token JWT contiene el{' '}
              <code className="px-1 rounded bg-white/10 font-mono text-xs">agency_id</code> y
              PostgREST lo verifica automaticamente.
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-100/90">
              <strong className="text-amber-300">Rate limiting:</strong> Actualmente no hay
              limites estrictos de tasa, pero se recomienda no superar 100 peticiones/minuto. En
              futuras versiones se podrian implementar limites formales.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
