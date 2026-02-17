import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Key, Database, FileJson, Zap, Filter, Terminal, Shield } from 'lucide-react';
import { SectionAnchor } from '../components/SectionAnchor';

export function OverviewIntro() {
  return (
    <section>
      <SectionAnchor id="intro" />
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">API de Integracion</h1>
        <p className="text-lg text-indigo-200/90 max-w-2xl">
          Integra los datos de planificacion, equipo y proyectos de tu agencia en Timeboxing
          directamente con tus herramientas internas.
        </p>
      </div>

      <Card className="border-2 border-indigo-300/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl mb-6 shadow-xl shadow-indigo-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg">
              <Key className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">
                Genera tu token API
              </h3>
              <p className="text-slate-700 dark:text-white/95 text-sm leading-relaxed mb-3">
                Los administradores de cada agencia pueden crear sus propios tokens de acceso
                directamente desde la seccion <strong>API & Integraciones</strong> dentro de la
                app. Cada token esta vinculado a tu{' '}
                <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/20 font-mono text-xs text-slate-800 dark:text-white">
                  agency_id
                </code>{' '}
                y protegido por politicas RLS (Row Level Security).
              </p>
              <p className="text-slate-600 dark:text-white/85 text-xs leading-relaxed mb-3">
                Todas las operaciones estan limitadas a los datos de tu agencia. No es posible
                acceder a datos de otras agencias.
              </p>
              <Link to="/api-keys">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white text-sm hover:from-indigo-500 hover:to-purple-500">
                  <Key className="h-4 w-4 mr-2" />
                  Ir a API & Integraciones
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-white font-semibold mb-4">Casos de uso</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: Database, text: 'Sincronizar proyectos y empleados con tu ERP o CRM' },
              { icon: FileJson, text: 'Consultar horas asignadas y reales por semana o mes' },
              { icon: Zap, text: 'Crear ausencias y eventos del equipo automaticamente' },
              { icon: Filter, text: 'Generar reportes personalizados con datos de planificacion' },
              { icon: Terminal, text: 'Automatizar la creacion de asignaciones desde scripts' },
              { icon: Shield, text: 'Recibir cambios en tiempo real via suscripciones Realtime' },
            ].map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
              >
                <Icon className="h-4 w-4 text-indigo-300 mt-0.5 shrink-0" />
                <span className="text-sm text-indigo-100/85">{text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
