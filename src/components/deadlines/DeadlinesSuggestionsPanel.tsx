/**
 * Panel ampliable de sugerencias de redistribución (Sheet en móvil, Dialog en desktop).
 * Condicionantes (quién cede, % máx. receptor, % mín. quien cede), lista por empleado/proyecto
 * y resumen propuesto (transferencias y cargas resultantes).
 * Componente controlado: estado y callbacks vienen de la página.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  ArrowRight,
  Inbox,
  Share2,
  PanelRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SensitiveText } from '@/components/privacy/SensitiveText';

export interface SuggestionDonor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface TransferSuggestion {
  fromId: string;
  fromName: string;
  fromAvatar?: string;
  hoursOnProject: number;
  suggestedHours: number;
  reason: string;
}

export interface ProjectRecommendation {
  projectId: string;
  projectName: string;
  transfers: TransferSuggestion[];
}

export interface EmployeeRecommendation {
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  deficitHours: number;
  projects: ProjectRecommendation[];
}

export interface CapacityResult {
  available: number;
}

export interface DeadlinesSuggestionsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
  /** Al cerrar, el padre puede resetear estos si lo desea */
  expandedProjects: Set<string>;
  setExpandedProjects: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  expandedEmployees: Set<string>;
  setExpandedEmployees: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  excludedDonorIds: string[];
  setExcludedDonorIds: (v: string[] | ((prev: string[]) => string[])) => void;
  maxReceiverLoadPct: number;
  setMaxReceiverLoadPct: (v: number) => void;
  maxReceiverLoadPctInput: string;
  setMaxReceiverLoadPctInput: (v: string) => void;
  minSenderLoadPct: number;
  setMinSenderLoadPct: (v: number) => void;
  minSenderLoadPctInput: string;
  setMinSenderLoadPctInput: (v: string) => void;
  suggestionsCondicionantesOpen: boolean;
  setSuggestionsCondicionantesOpen: (v: boolean) => void;
  rightPanelPorProyectoOpen: boolean;
  setRightPanelPorProyectoOpen: (v: boolean) => void;
  suggestionDonors: SuggestionDonor[];
  suggestionsByEmployeeAndProject: EmployeeRecommendation[];
  getMonthlyCapacity: (employeeId: string) => CapacityResult;
  getEmployeeAssignedHours: (employeeId: string) => number;
  onlySharedProjects: boolean;
  setOnlySharedProjects: (v: boolean) => void;
  includedProjectIds: Set<string>;
  setIncludedProjectIds: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  filteredProjects: { id: string; name: string }[];
}

function handleClose(
  onOpenChange: (open: boolean) => void,
  setExpandedProjects: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void,
  setExpandedEmployees: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void
) {
  setExpandedProjects(new Set());
  setExpandedEmployees(new Set());
  onOpenChange(false);
}

/** Bloque condicionantes: quién puede ceder, % receptor/cedente, solo proyectos compartidos, proyectos a considerar */
function CondicionantesBlock({
  suggestionDonors,
  excludedDonorIds,
  setExcludedDonorIds,
  maxReceiverLoadPctInput,
  setMaxReceiverLoadPctInput,
  setMaxReceiverLoadPct,
  minSenderLoadPctInput,
  setMinSenderLoadPctInput,
  setMinSenderLoadPct,
  suggestionsCondicionantesOpen,
  setSuggestionsCondicionantesOpen,
  onlySharedProjects,
  setOnlySharedProjects,
  includedProjectIds,
  setIncludedProjectIds,
  filteredProjects,
  compact,
}: {
  suggestionDonors: SuggestionDonor[];
  excludedDonorIds: string[];
  setExcludedDonorIds: (v: string[] | ((prev: string[]) => string[])) => void;
  maxReceiverLoadPctInput: string;
  setMaxReceiverLoadPctInput: (v: string) => void;
  setMaxReceiverLoadPct: (v: number) => void;
  minSenderLoadPctInput: string;
  setMinSenderLoadPctInput: (v: string) => void;
  setMinSenderLoadPct: (v: number) => void;
  suggestionsCondicionantesOpen: boolean;
  setSuggestionsCondicionantesOpen: (v: boolean) => void;
  onlySharedProjects: boolean;
  setOnlySharedProjects: (v: boolean) => void;
  includedProjectIds: Set<string>;
  setIncludedProjectIds: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  filteredProjects: { id: string; name: string }[];
  compact?: boolean;
}) {
  const [projectSearch, setProjectSearch] = useState('');
  const projectsFilteredBySearch = projectSearch.trim()
    ? filteredProjects.filter((p) => p.name.toLowerCase().includes(projectSearch.trim().toLowerCase()))
    : filteredProjects;

  const triggerLabel = compact
    ? 'Condicionantes'
    : 'Condicionantes (quién cede, cargas máx. receptor y mín. quien cede)';
  return (
    <Collapsible open={suggestionsCondicionantesOpen} onOpenChange={setSuggestionsCondicionantesOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 w-full text-left font-medium rounded-lg transition-colors',
            compact
              ? 'text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 py-2 px-2 mb-2'
              : 'text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 py-2.5 px-3 border border-slate-200 bg-slate-50/50 hover:border-slate-300'
          )}
          title="Clic para ver o ocultar opciones: quién puede ceder, % receptor y quien cede, proyectos"
        >
          {suggestionsCondicionantesOpen ? (
            <ChevronUp className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4', 'shrink-0')} />
          ) : (
            <ChevronDown className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4', 'shrink-0')} />
          )}
          <span className="flex-1">{triggerLabel}</span>
          {!suggestionsCondicionantesOpen && !compact && (
            <span className="text-xs font-normal text-slate-500">Clic para ajustar</span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {compact ? (
          <div className="space-y-3 py-2 pb-3 border border-slate-200 rounded-xl bg-slate-50/80 px-3 mb-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Quién puede ceder</p>
            <div className="grid grid-cols-1 gap-2">
              {suggestionDonors.map((d) => {
                const allowed = !excludedDonorIds.includes(d.id);
                return (
                  <div
                    key={d.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-2 min-h-[2.25rem]',
                      allowed ? 'bg-white border-slate-200' : 'bg-slate-100/80 border-slate-100 opacity-75'
                    )}
                  >
                    <Avatar className="h-6 w-6 shrink-0 border border-slate-200">
                      <AvatarImage src={d.avatarUrl} alt={d.name} />
                      <AvatarFallback className="text-[10px]">{d.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-xs font-medium min-w-0" title={d.name}>
                      {d.name}
                    </span>
                    <Switch
                      checked={allowed}
                      onCheckedChange={(c) =>
                        setExcludedDonorIds((prev) => (c ? prev.filter((id) => id !== d.id) : [...prev, d.id]))
                      }
                      className="shrink-0"
                    />
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Inbox className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Quien recibe horas</p>
                    <p className="text-xs text-slate-500">No superará este % de carga</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={maxReceiverLoadPctInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMaxReceiverLoadPctInput(v);
                      const n = parseInt(v, 10);
                      if (v !== '' && !isNaN(n) && n >= 1 && n <= 100) setMaxReceiverLoadPct(n);
                    }}
                    onBlur={() => {
                      const n = parseInt(maxReceiverLoadPctInput, 10);
                      const clamped =
                        maxReceiverLoadPctInput === '' || isNaN(n) || n < 1
                          ? 100
                          : Math.min(100, Math.max(1, n));
                      setMaxReceiverLoadPct(clamped);
                      setMaxReceiverLoadPctInput(String(clamped));
                    }}
                    className="h-9 w-14 text-center text-base font-mono font-bold tabular-nums"
                  />
                  <span className="text-sm font-semibold text-slate-600 w-5">%</span>
                </div>
              </div>
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-3 flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Quien cede horas</p>
                    <p className="text-xs text-slate-500">No bajará de este % de carga</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={minSenderLoadPctInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMinSenderLoadPctInput(v);
                      const n = parseInt(v, 10);
                      if (v !== '' && !isNaN(n) && n >= 0 && n <= 100) setMinSenderLoadPct(n);
                    }}
                    onBlur={() => {
                      const n = parseInt(minSenderLoadPctInput, 10);
                      const clamped =
                        minSenderLoadPctInput === '' || isNaN(n) || n < 0
                          ? 30
                          : Math.min(100, Math.max(0, n));
                      setMinSenderLoadPct(clamped);
                      setMinSenderLoadPctInput(String(clamped));
                    }}
                    className="h-9 w-14 text-center text-base font-mono font-bold tabular-nums"
                  />
                  <span className="text-sm font-semibold text-slate-600 w-5">%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderKanban className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">Solo proyectos en común</span>
                </div>
                <Switch checked={onlySharedProjects} onCheckedChange={setOnlySharedProjects} className="shrink-0" />
              </div>
              {filteredProjects.length > 0 && (
                <Popover onOpenChange={(open) => !open && setProjectSearch('')}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <FolderKanban className="h-3.5 w-3.5 mr-1.5" />
                      {includedProjectIds.size === 0 ? 'Todos los proyectos' : `${includedProjectIds.size} proyecto(s) seleccionados`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2 max-h-56 overflow-auto" align="start">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Solo considerar estos proyectos</p>
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Buscar proyecto..."
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                    <div className="max-h-44 overflow-auto">
                      {projectsFilteredBySearch.slice(0, 50).map((p) => (
                        <label key={p.id} className="flex items-center gap-2 py-1.5 cursor-pointer text-xs">
                          <Checkbox
                            checked={includedProjectIds.has(p.id)}
                            onCheckedChange={(checked) => {
                              setIncludedProjectIds((prev) => {
                                const next = new Set(prev);
                                if (checked) next.add(p.id);
                                else next.delete(p.id);
                                return next;
                              });
                            }}
                          />
                          <span className="truncate">
                            <SensitiveText kind="project" id={p.id}>{p.name}</SensitiveText>
                          </span>
                        </label>
                      ))}
                    </div>
                    {(projectsFilteredBySearch.length > 50 || filteredProjects.length > 50) && (
                      <p className="text-[10px] text-slate-400 pt-1">
                        {projectSearch.trim() ? `${projectsFilteredBySearch.length} de ${filteredProjects.length}` : `Mostrando 50 de ${filteredProjects.length}`}
                      </p>
                    )}
                    {includedProjectIds.size > 0 && (
                      <Button variant="ghost" size="sm" className="mt-1 w-full text-[10px] h-7" onClick={() => setIncludedProjectIds(new Set())}>
                        Usar todos
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 py-4 px-4 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Quién puede ceder horas
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {suggestionDonors.map((d) => {
                  const allowed = !excludedDonorIds.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-2 transition-colors min-h-[2.25rem]',
                        allowed ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-100/80 opacity-75'
                      )}
                    >
                      <Avatar className="h-6 w-6 border border-slate-200 shrink-0">
                        <AvatarImage src={d.avatarUrl} alt={d.name} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {d.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className="flex-1 truncate text-sm font-medium text-slate-800 min-w-0"
                        title={d.name}
                      >
                        {d.name}
                      </span>
                      <Switch
                        checked={allowed}
                        onCheckedChange={(checked) =>
                          setExcludedDonorIds((prev) =>
                            checked ? prev.filter((id) => id !== d.id) : [...prev, d.id]
                          )
                        }
                        className="shrink-0"
                      />
                    </div>
                  );
                })}
                {suggestionDonors.length === 0 && (
                  <span className="text-xs text-slate-500 col-span-full">No hay orígenes en las sugerencias</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4 border-l border-slate-200 pl-6 lg:pl-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-slate-800 leading-tight">Quien recibe horas</p>
                      <p className="text-sm text-slate-500 mt-0.5">No superará este % de carga</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={maxReceiverLoadPctInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMaxReceiverLoadPctInput(v);
                        const n = parseInt(v, 10);
                        if (v !== '' && !isNaN(n) && n >= 1 && n <= 100) setMaxReceiverLoadPct(n);
                      }}
                      onBlur={() => {
                        const n = parseInt(maxReceiverLoadPctInput, 10);
                        const clamped =
                          maxReceiverLoadPctInput === '' || isNaN(n) || n < 1
                            ? 100
                            : Math.min(100, Math.max(1, n));
                        setMaxReceiverLoadPct(clamped);
                        setMaxReceiverLoadPctInput(String(clamped));
                      }}
                      className="h-10 w-16 text-center font-mono text-lg font-bold tabular-nums"
                    />
                    <span className="text-base font-semibold text-slate-600">%</span>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-sm min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-slate-800 leading-tight">Quien cede horas</p>
                      <p className="text-sm text-slate-500 mt-0.5">No bajará de este % de carga</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={minSenderLoadPctInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMinSenderLoadPctInput(v);
                        const n = parseInt(v, 10);
                        if (v !== '' && !isNaN(n) && n >= 0 && n <= 100) setMinSenderLoadPct(n);
                      }}
                      onBlur={() => {
                        const n = parseInt(minSenderLoadPctInput, 10);
                        const clamped =
                          minSenderLoadPctInput === '' || isNaN(n) || n < 0
                            ? 30
                            : Math.min(100, Math.max(0, n));
                        setMinSenderLoadPct(clamped);
                        setMinSenderLoadPctInput(String(clamped));
                      }}
                      className="h-10 w-16 text-center font-mono text-lg font-bold tabular-nums"
                    />
                    <span className="text-base font-semibold text-slate-600">%</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderKanban className="h-4 w-4 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Solo proyectos en común</p>
                      <p className="text-[11px] text-slate-500">Sugerir solo en proyectos que donante y receptor comparten</p>
                    </div>
                  </div>
                  <Switch checked={onlySharedProjects} onCheckedChange={setOnlySharedProjects} className="shrink-0" />
                </div>
                {filteredProjects.length > 0 && (
                  <Popover onOpenChange={(open) => !open && setProjectSearch('')}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-sm h-9">
                        <FolderKanban className="h-4 w-4 mr-2" />
                        {includedProjectIds.size === 0 ? 'Todos los proyectos' : `Solo ${includedProjectIds.size} proyecto(s) seleccionados`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2 max-h-80 overflow-hidden flex flex-col" align="start">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Solo considerar estos proyectos</p>
                      <p className="text-[11px] text-slate-500 mb-2">Vacío = todos. Selecciona para limitar.</p>
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Buscar proyecto..."
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          className="pl-9 h-9 text-sm"
                        />
                      </div>
                      <div className="overflow-auto max-h-52 min-h-0">
                        {projectsFilteredBySearch.slice(0, 100).map((p) => (
                          <label key={p.id} className="flex items-center gap-2 py-1.5 cursor-pointer text-sm">
                            <Checkbox
                              checked={includedProjectIds.has(p.id)}
                              onCheckedChange={(checked) => {
                                setIncludedProjectIds((prev) => {
                                  const next = new Set(prev);
                                  if (checked) next.add(p.id);
                                  else next.delete(p.id);
                                  return next;
                                });
                              }}
                            />
                            <span className="truncate">
                              <SensitiveText kind="project" id={p.id}>{p.name}</SensitiveText>
                            </span>
                          </label>
                        ))}
                      </div>
                      {(projectsFilteredBySearch.length > 100 || filteredProjects.length > 100) && (
                        <p className="text-[10px] text-slate-400 pt-1">
                          {projectSearch.trim() ? `${projectsFilteredBySearch.length} de ${filteredProjects.length}` : `Mostrando 100 de ${filteredProjects.length}`}
                        </p>
                      )}
                      {includedProjectIds.size > 0 && (
                        <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={() => setIncludedProjectIds(new Set())}>
                          Usar todos los proyectos
                        </Button>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Las sugerencias se recalculan al cambiar cualquier valor.
              </p>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Resumen propuesto para un empleado (usado en móvil dentro de cada grupo y en desktop en panel derecho) */
function ResumenPropuesto({
  group,
  getMonthlyCapacity,
  getEmployeeAssignedHours,
  compact,
  rightPanelPorProyectoOpen,
  setRightPanelPorProyectoOpen,
}: {
  group: EmployeeRecommendation;
  getMonthlyCapacity: (id: string) => CapacityResult;
  getEmployeeAssignedHours: (id: string) => number;
  compact?: boolean;
  rightPanelPorProyectoOpen?: boolean;
  setRightPanelPorProyectoOpen?: (v: boolean) => void;
}) {
  const byFrom = new Map<string, { fromName: string; fromAvatar?: string; hours: number }>();
  const byProject: {
    projectId: string;
    projectName: string;
    items: { fromName: string; hours: number }[];
  }[] = [];
  let totalToReceptor = 0;
  group.projects.forEach((p) => {
    const projectItems: { fromName: string; hours: number }[] = [];
    p.transfers.forEach((t) => {
      if (t.suggestedHours <= 0) return;
      if (!byFrom.has(t.fromId)) byFrom.set(t.fromId, { fromName: t.fromName, fromAvatar: t.fromAvatar, hours: 0 });
      byFrom.get(t.fromId)!.hours += t.suggestedHours;
      totalToReceptor += t.suggestedHours;
      projectItems.push({ fromName: t.fromName, hours: t.suggestedHours });
    });
    if (projectItems.length) byProject.push({ projectId: p.projectId, projectName: p.projectName, items: projectItems });
  });
  if (totalToReceptor <= 0) {
    if (!compact) return <div className="text-sm text-slate-500 py-4">Sin horas sugeridas para este empleado con la opción actual.</div>;
    return null;
  }
  const receptorCap = getMonthlyCapacity(group.employeeId).available;
  const receptorAssigned = getEmployeeAssignedHours(group.employeeId);
  const receptorNewPct = receptorCap > 0 ? Math.round(((receptorAssigned + totalToReceptor) / receptorCap) * 100) : 0;
  const originLoads = Array.from(byFrom.entries()).map(([fromId, { fromName, hours }]) => {
    const cap = getMonthlyCapacity(fromId).available;
    const assigned = getEmployeeAssignedHours(fromId);
    const pct = cap > 0 ? Math.round(((assigned - hours) / cap) * 100) : 0;
    return { fromId, fromName, fromAvatar: byFrom.get(fromId)?.fromAvatar, hours, pct };
  });

  if (compact) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 mt-3 space-y-3 shadow-sm">
        <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Resumen propuesto</p>
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-500">Quitar horas a</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(byFrom.entries()).map(([fromId, { fromName, fromAvatar, hours }]) => (
              <div
                key={fromId}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm"
              >
                <Avatar className="h-7 w-7 border border-slate-200 shrink-0">
                  <AvatarImage src={fromAvatar} alt={fromName} />
                  <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-medium">
                    {fromName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-slate-800 truncate max-w-[100px]">{fromName}</span>
                <Badge variant="secondary" className="shrink-0 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-mono">
                  −{hours}h
                </Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-slate-200" />
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-2.5">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border-2 border-primary/30 shrink-0">
              <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {group.employeeName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-500">Añadir horas a</p>
              <p className="font-semibold text-slate-900 text-sm truncate">{group.employeeName}</p>
            </div>
            <Badge className="shrink-0 bg-primary text-primary-foreground text-xs font-mono">+{totalToReceptor}h</Badge>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 mb-1.5">Cargas resultantes</p>
          <div className="flex flex-wrap gap-1.5">
            {originLoads.map((o) => (
              <span
                key={o.fromId}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                  o.pct > 100 ? 'bg-red-50 border-red-200 text-red-700' : o.pct >= 80 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700'
                )}
              >
                {o.fromName} {o.pct}%
              </span>
            ))}
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
              {group.employeeName} {receptorNewPct}%
            </span>
          </div>
        </div>
        {byProject.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-slate-500 mb-1">Por proyecto</p>
            <div className="space-y-1.5">
              {byProject.map((proj) => (
                <div key={proj.projectId} className="rounded border border-slate-200 bg-white px-2 py-1.5">
                  <p className="text-[11px] font-medium text-slate-700 truncate">
                    <SensitiveText kind="project" id={proj.projectId}>{proj.projectName}</SensitiveText>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {proj.items.map((item, j) => (
                      <span
                        key={j}
                        className="text-[10px] text-slate-600 bg-slate-100 rounded px-1 font-mono"
                      >
                        {item.fromName} −{item.hours}h
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop panel derecho
  return (
    <>
      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Resumen propuesto</h4>
      <div className="mb-2">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">Cargas resultantes</p>
        <div className="flex flex-wrap gap-1.5">
          {originLoads.map((o) => (
            <span
              key={o.fromId}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                o.pct > 100 ? 'bg-red-50 border-red-200 text-red-700' : o.pct >= 80 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700'
              )}
            >
              <span className="truncate max-w-[72px]">{o.fromName}</span>
              <span className="font-mono font-semibold">{o.pct}%</span>
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
            <span className="truncate max-w-[72px]">{group.employeeName}</span>
            <span className="font-mono font-semibold">{receptorNewPct}%</span>
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <p className="text-[11px] font-medium text-slate-500 uppercase w-full">Transferencias</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {Array.from(byFrom.entries()).map(([fromId, { fromName, fromAvatar, hours }]) => (
            <div
              key={fromId}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white pl-1 pr-2 py-1 shadow-sm"
            >
              <Avatar className="h-6 w-6 border border-slate-200 shrink-0">
                <AvatarImage src={fromAvatar} alt={fromName} />
                <AvatarFallback className="text-[10px]">{fromName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium text-slate-700 truncate max-w-[70px]">{fromName}</span>
              <span className="text-[11px] font-mono text-rose-600 font-semibold">−{hours}h</span>
            </div>
          ))}
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <div className="flex items-center gap-2 rounded-lg border-2 border-primary/30 bg-primary/5 pl-2 pr-2.5 py-1.5">
          <Avatar className="h-7 w-7 border-2 border-primary/30 shrink-0">
            <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
            <AvatarFallback className="text-xs font-semibold text-primary">
              {group.employeeName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold text-slate-800 truncate max-w-[90px]">{group.employeeName}</span>
          <Badge className="shrink-0 bg-primary text-primary-foreground text-[11px] font-mono">
            +{totalToReceptor}h
          </Badge>
        </div>
      </div>
      {byProject.length > 0 && rightPanelPorProyectoOpen !== undefined && setRightPanelPorProyectoOpen && (
        <Collapsible open={rightPanelPorProyectoOpen} onOpenChange={setRightPanelPorProyectoOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 py-0.5 mt-0.5"
            >
              {rightPanelPorProyectoOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Por proyecto ({byProject.length})
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1.5 pt-1">
              {byProject.map((proj) => (
                <div key={proj.projectId} className="rounded border border-slate-200 bg-white px-2 py-1.5">
                  <p className="text-[11px] font-medium text-slate-700 truncate">
                    <SensitiveText kind="project" id={proj.projectId}>{proj.projectName}</SensitiveText>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {proj.items.map((item, j) => (
                      <span
                        key={j}
                        className="text-[10px] text-slate-600 bg-slate-100 rounded px-1 font-mono"
                      >
                        {item.fromName} −{item.hours}h
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </>
  );
}

export function DeadlinesSuggestionsPanel(props: DeadlinesSuggestionsPanelProps) {
  const {
    open,
    onOpenChange,
    isMobile,
    expandedProjects,
    setExpandedProjects,
    expandedEmployees,
    setExpandedEmployees,
    excludedDonorIds,
    setExcludedDonorIds,
    maxReceiverLoadPct,
    setMaxReceiverLoadPct,
    maxReceiverLoadPctInput,
    setMaxReceiverLoadPctInput,
    minSenderLoadPct,
    setMinSenderLoadPct,
    minSenderLoadPctInput,
    setMinSenderLoadPctInput,
    suggestionsCondicionantesOpen,
    setSuggestionsCondicionantesOpen,
    rightPanelPorProyectoOpen,
    setRightPanelPorProyectoOpen,
    suggestionDonors,
    suggestionsByEmployeeAndProject,
    getMonthlyCapacity,
    getEmployeeAssignedHours,
    onlySharedProjects,
    setOnlySharedProjects,
    includedProjectIds,
    setIncludedProjectIds,
    filteredProjects,
  } = props;

  const onClose = () => handleClose(onOpenChange, setExpandedProjects, setExpandedEmployees);

  const title = (
    <span className="flex items-center gap-2">
      <Sparkles className="h-5 w-5 text-orange-500" />
      Sugerencias de redistribución
    </span>
  );

  const condicionantesProps = {
    suggestionDonors,
    excludedDonorIds,
    setExcludedDonorIds,
    maxReceiverLoadPctInput,
    setMaxReceiverLoadPctInput,
    setMaxReceiverLoadPct,
    minSenderLoadPctInput,
    setMinSenderLoadPctInput,
    setMinSenderLoadPct,
    suggestionsCondicionantesOpen,
    setSuggestionsCondicionantesOpen,
    onlySharedProjects,
    setOnlySharedProjects,
    includedProjectIds,
    setIncludedProjectIds,
    filteredProjects,
  };

  const listContent = (
    <>
      {suggestionsByEmployeeAndProject.map((group) => {
        const isEmployeeOpen = expandedEmployees.has(group.employeeId);
        return (
          <div key={group.employeeId} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Collapsible
              open={isEmployeeOpen}
              onOpenChange={(open) =>
                setExpandedEmployees((prev) => {
                  const next = new Set(prev);
                  if (open) next.add(group.employeeId);
                  else next.delete(group.employeeId);
                  return next;
                })
              }
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50/80 transition-colors"
                >
                  <Avatar className="h-10 w-10 border-2 border-slate-200 shrink-0 ring-1 ring-slate-100">
                    <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {group.employeeName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{group.employeeName}</p>
                    <p className="text-xs text-slate-500">
                      Puede recibir horas en {group.projects.length} {group.projects.length === 1 ? 'proyecto' : 'proyectos'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                    >
                      Déficit: {Math.round(group.deficitHours * 2) / 2}h
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 font-medium">
                      {group.projects.length}
                    </Badge>
                  </div>
                  {isEmployeeOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-slate-100 bg-slate-50/30 px-2 pb-2 pt-1 space-y-2">
                  {group.projects.map((proj) => {
                    const projectKey = `${group.employeeId}-${proj.projectId}`;
                    const isProjectOpen = expandedProjects.has(projectKey);
                    return (
                      <div key={projectKey} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                        <Collapsible
                          open={isProjectOpen}
                          onOpenChange={(open) =>
                            setExpandedProjects((prev) => {
                              const n = new Set(prev);
                              if (open) n.add(projectKey);
                              else n.delete(projectKey);
                              return n;
                            })
                          }
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              className="w-full flex items-center gap-2.5 p-2.5 text-left hover:bg-slate-50 transition-colors"
                            >
                              <FolderKanban className="h-4 w-4 text-slate-400 shrink-0" />
                              <span className="font-medium text-slate-800 text-sm truncate flex-1">
                                <SensitiveText kind="project" id={proj.projectId}>{proj.projectName}</SensitiveText>
                              </span>
                              <span className="text-[11px] text-slate-500 shrink-0">
                                {proj.transfers.length} {proj.transfers.length === 1 ? 'origen' : 'orígenes'}
                              </span>
                              {isProjectOpen ? (
                                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              )}
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border-t border-slate-100 bg-slate-50/50 px-2 py-2 space-y-2">
                              {proj.transfers.map((t) => (
                                <div
                                  key={t.fromId}
                                  className="flex items-start gap-3 p-2.5 rounded-md bg-white border border-slate-100 shadow-sm"
                                >
                                  <Avatar className="h-8 w-8 border border-slate-200 shrink-0">
                                    <AvatarImage src={t.fromAvatar} alt={t.fromName} />
                                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                                      {t.fromName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 text-sm">{t.fromName}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                      <span className="font-mono font-semibold text-primary">{t.hoursOnProject}h</span>
                                      <span>asignadas en este proyecto</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                      <ArrowRight className="h-3 w-3 text-slate-400" />
                                      {t.suggestedHours > 0 ? (
                                        <>Pasar hasta {t.suggestedHours}h a {group.employeeName}</>
                                      ) : (
                                        <>Sin margen sugerido; revisar en tabla</>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    );
                  })}
                  {isMobile && (
                    <ResumenPropuesto
                      group={group}
                      getMonthlyCapacity={getMonthlyCapacity}
                      getEmployeeAssignedHours={getEmployeeAssignedHours}
                      compact
                    />
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : onClose())}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col">
          <SheetHeader className="text-left">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden flex flex-col mt-2">
            <p className="text-xs text-slate-500 mb-3">
              Recomendaciones por proyecto. Quién puede recibir horas y desde qué proyecto transferir. Ajusta los
              condicionantes para afinar.
            </p>
            <CondicionantesBlock {...condicionantesProps} compact />
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2">{listContent}</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const selectedGroup = suggestionsByEmployeeAndProject.find((g) => expandedEmployees.has(g.employeeId));
  const rightPanel = (
    <div className="hidden lg:flex flex-col min-h-0 overflow-y-auto overflow-x-hidden bg-slate-50/50 rounded-lg border border-slate-200 p-3">
      {!selectedGroup ? (
        <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-8 px-4">
          <PanelRight className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium">Selecciona un empleado</p>
          <p className="text-xs text-center">Expande una fila para ver aquí el resumen.</p>
        </div>
      ) : (
        <ResumenPropuesto
          group={selectedGroup}
          getMonthlyCapacity={getMonthlyCapacity}
          getEmployeeAssignedHours={getEmployeeAssignedHours}
          rightPanelPorProyectoOpen={rightPanelPorProyectoOpen}
          setRightPanelPorProyectoOpen={setRightPanelPorProyectoOpen}
        />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : onClose())}>
      <DialogContent className="max-w-[95vw] sm:max-w-[640px] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Recomendaciones por proyecto: quién puede recibir horas y desde qué proyecto transferir. Expande un
            empleado y revisa el panel de la derecha. Ajusta los condicionantes para afinar el reparto.
          </DialogDescription>
        </DialogHeader>
        <CondicionantesBlock {...condicionantesProps} />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,minmax(320px,400px)] gap-4 min-h-0">
          <div className="overflow-y-auto min-h-0 py-1 space-y-3 pr-1 border-r-0 lg:border-r lg:border-slate-200 lg:pr-4">
            {listContent}
          </div>
          {rightPanel}
        </div>
      </DialogContent>
    </Dialog>
  );
}
