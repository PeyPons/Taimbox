import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDeadlineHoursForDisplay } from '@/utils/deadlineUtils';
import type { TeamSuggestionsSummary } from '@/utils/suggestionTeamUtils';

export function SuggestionTeamResumen({ summary }: { summary: TeamSuggestionsSummary }) {
  if (summary.transferCount === 0) {
    return (
      <div className="text-sm text-slate-600 py-4 space-y-2 px-1">
        <p className="font-medium text-slate-800">Sin movimientos sugeridos</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Prueba bajar el mínimo por transferencia, subir el % del receptor o incluir más proyectos en los
          filtros avanzados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Resumen del equipo
        </p>
        <p className="text-slate-800">
          Hasta{' '}
          <span className="font-mono font-semibold text-primary">
            {formatDeadlineHoursForDisplay(summary.totalHours)}h
          </span>{' '}
          repartidas en {summary.transferCount} movimientos entre {summary.receiverCount} personas.
        </p>
      </div>
      {summary.topReceivers.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">Por quien recibe</p>
          <ul className="space-y-2">
            {summary.topReceivers.map((r) => (
              <li key={r.employeeId} className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-slate-200">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {r.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-slate-800">{r.name}</span>
                <span className="font-mono text-xs text-primary shrink-0">
                  +{formatDeadlineHoursForDisplay(r.hours)}h
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {summary.topDonors.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">Por quien cede</p>
          <ul className="space-y-2">
            {summary.topDonors.map((d) => (
              <li key={d.fromId} className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-slate-200">
                  <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                    {d.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-slate-800">{d.name}</span>
                <span className="font-mono text-xs text-amber-800 shrink-0">
                  −{formatDeadlineHoursForDisplay(d.hours)}h
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
