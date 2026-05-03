/**
 * Vista compacta de recomendaciones de redistribución en el sidebar de Deadlines.
 * Muestra hasta 3 empleados y un botón para abrir el panel completo.
 * Sin estado interno; solo presentacional.
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, HelpCircle, ChevronRight, Maximize2 } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

export interface SuggestionGroupPreview {
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  deficitHours: number;
  projects: { projectId: string; projectName: string; transfers: unknown[] }[];
}

export interface DeadlinesSuggestionsPreviewProps {
  /** Primeros N grupos (p. ej. slice(0, 3)) */
  groups: SuggestionGroupPreview[];
  onOpenFull: () => void;
}

export function DeadlinesSuggestionsPreview({ groups, onOpenFull }: DeadlinesSuggestionsPreviewProps) {
  if (groups.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm" data-tour="suggestions">
      <div className="flex items-center gap-1 mb-2">
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          Recomendaciones
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[260px] z-[100] p-0 border-slate-200/90 bg-gradient-to-br from-slate-50 to-white shadow-lg rounded-xl overflow-hidden">
                <div className="p-3.5">
                  <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-200/80">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">Recomendaciones por proyecto</p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Quién puede recibir horas y en qué proyecto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Horas asignadas por origen para decidir transferencias</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Solo empleados que comparten proyectos</span>
                    </li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
      </div>
      <div className="space-y-1.5">
        {groups.map((group) => (
          <button
            key={group.employeeId}
            type="button"
            onClick={onOpenFull}
            className="w-full flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 text-left transition-colors"
          >
            <Avatar className="h-7 w-7 border-2 border-white shadow-sm shrink-0">
              <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                {group.employeeName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-slate-800 text-xs truncate flex-1">{group.employeeName}</span>
            <Badge variant="secondary" className="text-[10px] bg-slate-200/80 text-slate-600 shrink-0">
              {group.projects.length} {group.projects.length === 1 ? 'proyecto' : 'proy.'}
            </Badge>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-2 h-8 text-slate-600 hover:bg-slate-100 text-xs"
        onClick={onOpenFull}
      >
        <Maximize2 className="h-3 w-3 mr-1" />
        Ver desglose por proyecto
      </Button>
    </div>
  );
}
