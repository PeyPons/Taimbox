/**
 * Infografía del framework de 6 pasos para gestionar carga de trabajo sin burnout.
 * Pensada para compartir en redes (captura clara en tema oscuro del blog).
 */
const STEPS = [
  { n: 1, title: 'Visibilidad', subtitle: 'Mapear carga real' },
  { n: 2, title: 'Prioridad', subtitle: 'Eisenhower en equipo' },
  { n: 3, title: 'Reparto', subtitle: 'Capacidad + habilidad' },
  { n: 4, title: 'Límites', subtitle: 'Decir no al scope creep' },
  { n: 5, title: 'Ritmo', subtitle: 'Bloques y deep work' },
  { n: 6, title: 'Revisión', subtitle: 'Check-ins de carga' },
] as const;

export function CargaTrabajoFrameworkVisual() {
  return (
    <figure className="rounded-2xl border border-violet-500/35 bg-gradient-to-br from-violet-950/50 via-indigo-950/40 to-slate-950/60 p-5 sm:p-8 overflow-hidden not-prose">
      <figcaption className="text-center text-sm font-semibold text-violet-200/95 mb-6">
        Framework en 6 pasos: de la invisibilidad a la carga sostenible
      </figcaption>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className="relative rounded-xl border border-white/10 bg-white/[0.06] p-3 sm:p-4 text-left min-h-[5.5rem] sm:min-h-[6rem] flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/25 text-violet-200 text-sm font-black">
                {s.n}
              </span>
              {i < STEPS.length - 1 && (
                <span className="hidden sm:block text-violet-500/40 text-xs font-mono" aria-hidden>
                  →
                </span>
              )}
            </div>
            <div>
              <p className="text-white font-bold text-sm sm:text-base leading-tight m-0">{s.title}</p>
              <p className="text-indigo-200/75 text-xs sm:text-sm m-0 mt-1">{s.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-indigo-300/70 text-xs mt-5 m-0">
        Objetivo: visibilidad + prioridades explícitas + recuperación entre picos
      </p>
    </figure>
  );
}
