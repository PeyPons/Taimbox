import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FolderKanban, Search } from 'lucide-react';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { formatDeadlineHoursForDisplay, roundDeadlineHours } from '@/utils/deadlineUtils';
import { OpenProjectButton } from '@/components/deadlines/suggestions/OpenProjectButton';
import type { DonorTransferRow } from '@/components/deadlines/suggestions/types';

const DEFAULT_VISIBLE = 12;
const MAX_RECEIVERS_SHOWN = 3;

const REVIEW_MAX_PROJECTS = 8;

export function DonorDestinationsList({
  rows,
  onOpenProject,
  reviewMode,
}: {
  rows: DonorTransferRow[];
  onOpenProject?: (projectId: string) => void;
  /** Vista compacta del paso Revisar (sin buscador ni paginación). */
  reviewMode?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const byProject = useMemo(() => {
    const map = new Map<string, DonorTransferRow[]>();
    rows.forEach((r) => {
      const list = map.get(r.projectId) ?? [];
      list.push(r);
      map.set(r.projectId, list);
    });
    return Array.from(map.entries())
      .map(([projectId, projectRows]) => ({
        projectId,
        projectName: projectRows[0].projectName,
        rows: projectRows.sort(
          (a, b) => (Number(b.transfer.suggestedHours) || 0) - (Number(a.transfer.suggestedHours) || 0)
        ),
        totalHours: roundDeadlineHours(
          projectRows.reduce((s, r) => s + (Number(r.transfer.suggestedHours) || 0), 0)
        ),
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return byProject;
    return byProject.filter((p) => p.projectName.toLowerCase().includes(term));
  }, [byProject, search]);

  const visible = reviewMode
    ? filtered.slice(0, REVIEW_MAX_PROJECTS)
    : showAll
      ? filtered
      : filtered.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = reviewMode
    ? Math.max(0, filtered.length - REVIEW_MAX_PROJECTS)
    : Math.max(0, filtered.length - DEFAULT_VISIBLE);

  const projectCards = (
    <div
      className="space-y-3 max-h-[min(50vh,420px)] overflow-y-auto pr-1"
    >
      {visible.map(({ projectId, projectName, rows: projectRows, totalHours }) => {
        const shown = projectRows.slice(0, MAX_RECEIVERS_SHOWN);
        const more = projectRows.length - shown.length;
        return (
          <div key={projectId} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FolderKanban className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">
                    <SensitiveText kind="project" id={projectId}>{projectName}</SensitiveText>
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    hasta {formatDeadlineHoursForDisplay(totalHours)}h en total
                  </p>
                </div>
              </div>
              <OpenProjectButton projectId={projectId} onOpenProject={onOpenProject} />
            </div>
            {shown.map((r) => (
              <div
                key={`${r.receiverId}-${r.projectId}`}
                className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg p-2"
              >
                <span className="text-slate-500 shrink-0">→</span>
                <span className="font-medium text-slate-700 truncate flex-1">{r.receiverName}</span>
                <span className="font-mono text-primary font-semibold shrink-0">
                  hasta {formatDeadlineHoursForDisplay(r.transfer.suggestedHours)}h
                </span>
              </div>
            ))}
            {more > 0 && (
              <p className="text-[10px] text-slate-400 pl-1">+{more} destino(s) más en este proyecto</p>
            )}
          </div>
        );
      })}
    </div>
  );

  if (byProject.length === 0) {
    return (
      <p className="text-sm text-slate-600 py-6 text-center">No hay destinos sugeridos para esta persona.</p>
    );
  }

  if (reviewMode) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500">
          {byProject.length} proyecto(s) · {rows.length} movimiento(s) sugerido(s)
        </p>
        {projectCards}
        {hiddenCount > 0 && (
          <p className="text-[11px] text-slate-400 text-center">+{hiddenCount} proyecto(s) más en el paso Destinos</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">{byProject.length} proyecto(s) donde puede ceder horas</p>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar proyecto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>
      {projectCards}
      {!showAll && hiddenCount > 0 && (
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowAll(true)}>
          Ver {hiddenCount} proyecto(s) más
        </Button>
      )}
      {showAll && filtered.length > DEFAULT_VISIBLE && (
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAll(false)}>
          Mostrar menos
        </Button>
      )}
    </div>
  );
}
