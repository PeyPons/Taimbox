import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, FolderKanban, Search } from 'lucide-react';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { formatDeadlineHoursForDisplay } from '@/utils/deadlineUtils';
import { OpenProjectButton } from '@/components/deadlines/suggestions/OpenProjectButton';
import {
  projectTotalSuggestedHours,
  sortProjectsBySuggestedHours,
} from '@/components/deadlines/suggestions/suggestionFlowUtils';
import type { ProjectRecommendation } from '@/components/deadlines/suggestions/types';

const DEFAULT_VISIBLE = 12;
const MAX_TRANSFERS_SHOWN = 3;

const REVIEW_MAX_PROJECTS = 8;

export function ProjectTransfersList({
  projects,
  onOpenProject,
  reviewMode,
}: {
  projects: ProjectRecommendation[];
  onOpenProject?: (projectId: string) => void;
  reviewMode?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => sortProjectsBySuggestedHours(projects), [projects]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter((p) => p.projectName.toLowerCase().includes(term));
  }, [sorted, search]);

  const visible = reviewMode
    ? filtered.slice(0, REVIEW_MAX_PROJECTS)
    : showAll
      ? filtered
      : filtered.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = reviewMode
    ? Math.max(0, filtered.length - REVIEW_MAX_PROJECTS)
    : Math.max(0, filtered.length - DEFAULT_VISIBLE);

  const projectCards = (
    <div className="space-y-3 max-h-[min(50vh,420px)] overflow-y-auto pr-1">
      {visible.map((proj) => {
        const transfers = proj.transfers
          .filter((t) => (Number(t.suggestedHours) || 0) > 0.05)
          .sort((a, b) => (Number(b.suggestedHours) || 0) - (Number(a.suggestedHours) || 0));
        const shown = transfers.slice(0, MAX_TRANSFERS_SHOWN);
        const more = transfers.length - shown.length;
        return (
          <div key={proj.projectId} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FolderKanban className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">
                    <SensitiveText kind="project" id={proj.projectId}>{proj.projectName}</SensitiveText>
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    hasta {formatDeadlineHoursForDisplay(projectTotalSuggestedHours(proj))}h en total
                  </p>
                </div>
              </div>
              <OpenProjectButton projectId={proj.projectId} onOpenProject={onOpenProject} />
            </div>
            {shown.map((t) => (
              <div key={t.fromId} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg p-2">
                <span className="font-medium text-slate-700 truncate flex-1">{t.fromName}</span>
                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="font-mono text-primary font-semibold shrink-0">
                  hasta {formatDeadlineHoursForDisplay(t.suggestedHours)}h
                </span>
              </div>
            ))}
            {more > 0 && (
              <p className="text-[10px] text-slate-400 pl-1">+{more} origen(es) más en este proyecto</p>
            )}
          </div>
        );
      })}
    </div>
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-slate-600 py-6 text-center">
        No hay proyectos con transferencias sugeridas para esta persona.
      </p>
    );
  }

  if (reviewMode) {
    const transferCount = sorted.reduce(
      (n, p) => n + p.transfers.filter((t) => (Number(t.suggestedHours) || 0) > 0.05).length,
      0
    );
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500">
          {sorted.length} proyecto(s) · {transferCount} movimiento(s) sugerido(s)
        </p>
        {projectCards}
        {hiddenCount > 0 && (
          <p className="text-[11px] text-slate-400 text-center">+{hiddenCount} proyecto(s) más en el paso Proyectos</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {sorted.length} proyecto(s) con sugerencias
          {search.trim() ? ` · ${filtered.length} coincidencias` : ''}
        </span>
      </div>
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
