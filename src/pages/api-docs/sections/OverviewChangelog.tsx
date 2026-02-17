import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionAnchor } from '../components/SectionAnchor';
import { CHANGELOG_ENTRIES } from '../data/changelog';

const TYPE_STYLES = {
  new: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  improved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  deprecated: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  fixed: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

const TYPE_LABELS = {
  new: 'Nuevo',
  improved: 'Mejorado',
  deprecated: 'Deprecado',
  fixed: 'Corregido',
};

export function OverviewChangelog() {
  return (
    <section>
      <SectionAnchor id="changelog" />
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <History className="h-6 w-6 text-indigo-300" /> Changelog
      </h2>
      <p className="text-indigo-100/85 mb-6">
        Historial de cambios en la API. Consulta esta seccion para conocer nuevas funcionalidades,
        mejoras y posibles cambios que rompan compatibilidad.
      </p>

      {CHANGELOG_ENTRIES.length === 0 ? (
        <div className="p-6 rounded-lg bg-white/[0.03] border border-white/5 text-center">
          <p className="text-sm text-indigo-200/60">
            No hay entradas en el changelog todavia. Los cambios se documentaran aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {CHANGELOG_ENTRIES.map((entry, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-white/[0.03] border border-white/5"
            >
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-xs font-mono text-slate-400">{entry.date}</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                    TYPE_STYLES[entry.type],
                  )}
                >
                  {TYPE_LABELS[entry.type]}
                </span>
                <span className="text-sm font-semibold text-white">{entry.title}</span>
              </div>
              <p className="text-xs text-indigo-200/70 leading-relaxed">{entry.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
