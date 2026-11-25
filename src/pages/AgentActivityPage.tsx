import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  HelpCircle,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { useAgency } from '@/contexts/AgencyContext';
import { useAgentActions } from '@/hooks/useAgentActions';
import { useDateLocale } from '@/hooks/useDateLocale';
import type {
  AgentAction,
  AgentActionCategory,
  AgentActionChannel,
  AgentActionStatus,
  AgentTool,
} from '@/types/agentActions';
import {
  attributeAgentActions,
  formatMinutes,
  type ActionAttribution,
} from '@/utils/agentActionAttribution';
import { cn } from '@/lib/utils';

type RangeMode = 'today' | 'week' | 'day' | 'month' | 'custom';
type ViewMode = 'tree' | 'list';

const CATEGORY_LABEL: Record<AgentActionCategory, string> = {
  intake: 'Petición',
  triage: 'Detección',
  client_work: 'Cliente',
  internal: 'Interno',
  noise: 'Descartado',
};

const CATEGORY_STYLE: Record<AgentActionCategory, string> = {
  intake: 'bg-sky-100 text-sky-800 border-sky-200',
  triage: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  client_work: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  internal: 'bg-amber-100 text-amber-900 border-amber-200',
  noise: 'bg-stone-100 text-stone-600 border-stone-200',
};

const TOOL_LABEL: Record<AgentTool, string> = {
  claude: 'Claude',
  codex: 'Codex',
  antigravity: 'Antigravity',
  other: 'Otro',
};

const TOOL_STYLE: Record<AgentTool, string> = {
  claude: 'bg-orange-100 text-orange-800 border-orange-200',
  codex: 'bg-teal-100 text-teal-800 border-teal-200',
  antigravity: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const CHANNEL_LABEL: Record<string, string> = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  seo: 'SEO',
  dv360: 'DV360',
  analytics: 'Analítica',
  email: 'Correo',
  crm: 'CRM',
  chatgpt_ads: 'ChatGPT Ads',
  internal: 'Interno',
  reporting: 'Informe',
  other: 'Otro',
};

const STATUS_LABEL: Record<AgentActionStatus, string> = {
  requested: 'Pedida',
  in_progress: 'En curso',
  completed: 'Terminada',
  cancelled: 'Cancelada',
};

const STATUS_STYLE: Record<AgentActionStatus, string> = {
  requested: 'text-sky-700',
  in_progress: 'text-amber-700',
  completed: 'text-emerald-700',
  cancelled: 'text-rose-700',
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toMonthInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function parseLocalMonth(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(year, month - 1, 1);
}

function exclusiveEndFromInclusiveDay(day: Date): Date {
  const end = startOfLocalDay(day);
  end.setDate(end.getDate() + 1);
  return end;
}

function employeeKeyOf(action: AgentAction): string {
  return action.employeeId ?? `label:${(action.employeeLabel ?? 'sin-persona').trim().toLowerCase()}`;
}

function clientKeyOf(action: AgentAction): string {
  if (action.category === 'internal') return 'internal';
  if (action.clientId) return action.clientId;
  return `label:${(action.clientLabel ?? 'sin-cliente').trim().toLowerCase()}`;
}

function projectKeyOf(action: AgentAction): string {
  if (action.projectId) return action.projectId;
  const label = action.projectLabel?.trim();
  if (!label) return 'none';
  return `label:${label.toLowerCase()}`;
}

function employeeDisplayName(action: AgentAction): string {
  return action.employeeLabel?.trim() || (action.employeeId ? 'Persona' : 'Sin persona');
}

function buildChildren(actions: AgentAction[]): Map<string, AgentAction[]> {
  const ids = new Set(actions.map((action) => action.id));
  const map = new Map<string, AgentAction[]>();
  for (const action of actions) {
    const parent = action.parentId && ids.has(action.parentId) ? action.parentId : null;
    const key = parent ?? '__root__';
    const list = map.get(key) ?? [];
    list.push(action);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }
  return map;
}

function countDescendants(id: string, forest: Map<string, AgentAction[]>): number {
  const children = forest.get(id) ?? [];
  return children.reduce((sum, child) => sum + 1 + countDescendants(child.id, forest), 0);
}

function deepLatest(action: AgentAction, forest: Map<string, AgentAction[]>): string {
  let latest = action.finishedAt ?? action.startedAt;
  for (const child of forest.get(action.id) ?? []) {
    const childLatest = deepLatest(child, forest);
    if (childLatest > latest) latest = childLatest;
  }
  return latest;
}

function matchesSearch(action: AgentAction, query: string): boolean {
  if (!query) return true;
  const haystack = [
    action.title,
    action.outcome,
    action.clientLabel,
    action.projectLabel,
    action.employeeLabel,
    action.historyRef,
    action.clientTier,
    action.channel ? CHANNEL_LABEL[action.channel] ?? action.channel : '',
    CATEGORY_LABEL[action.category],
    TOOL_LABEL[action.tool],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function expandWithAncestors(matchedIds: Set<string>, byId: Map<string, AgentAction>): Set<string> {
  const keep = new Set(matchedIds);
  for (const id of matchedIds) {
    let current = byId.get(id);
    while (current?.parentId) {
      keep.add(current.parentId);
      current = byId.get(current.parentId);
    }
  }
  return keep;
}

const selectClass =
  'h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm min-w-[9rem] max-w-full';

export default function AgentActivityPage() {
  const { t } = useTranslation('app');
  const dateLocale = useDateLocale();
  const { currentAgency } = useAgency();
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const [rangeMode, setRangeMode] = useState<RangeMode>('today');
  const [selectedDay, setSelectedDay] = useState(() => toDateInputValue(today));
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthInputValue(today));
  const [customFrom, setCustomFrom] = useState(() => toDateInputValue(today));
  const [customTo, setCustomTo] = useState(() => toDateInputValue(today));
  const [searchInput, setSearchInput] = useState('');
  const [employeeKey, setEmployeeKey] = useState('all');
  const [clientKey, setClientKey] = useState('all');
  const [projectKey, setProjectKey] = useState('all');
  const [channel, setChannel] = useState<'all' | AgentActionChannel>('all');
  const [category, setCategory] = useState<'all' | AgentActionCategory>('all');
  const [tool, setTool] = useState<'all' | AgentTool>('all');
  const [status, setStatus] = useState<'all' | AgentActionStatus>('all');
  const [showNoise, setShowNoise] = useState(false);
  const [onlyImputable, setOnlyImputable] = useState(false);
  const [onlyUnresolved, setOnlyUnresolved] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [expandAllToken, setExpandAllToken] = useState(0);
  const [collapseAllToken, setCollapseAllToken] = useState(0);

  const { start, end } = useMemo(() => {
    if (rangeMode === 'today') {
      return { start: today, end: exclusiveEndFromInclusiveDay(today) };
    }
    if (rangeMode === 'week') {
      const startWeek = new Date(today);
      startWeek.setDate(startWeek.getDate() - 6);
      return { start: startWeek, end: exclusiveEndFromInclusiveDay(today) };
    }
    if (rangeMode === 'day') {
      const day = parseLocalDate(selectedDay) ?? today;
      return { start: startOfLocalDay(day), end: exclusiveEndFromInclusiveDay(day) };
    }
    if (rangeMode === 'month') {
      const monthStart = parseLocalMonth(selectedMonth) ?? new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      return { start: monthStart, end: monthEnd };
    }
    const from = parseLocalDate(customFrom) ?? today;
    const to = parseLocalDate(customTo) ?? today;
    const startCustom = startOfLocalDay(from <= to ? from : to);
    const endDay = startOfLocalDay(from <= to ? to : from);
    return { start: startCustom, end: exclusiveEndFromInclusiveDay(endDay) };
  }, [rangeMode, today, selectedDay, selectedMonth, customFrom, customTo]);

  const { actions, loading, error, refresh } = useAgentActions(currentAgency?.id ?? null, start, end);

  const shiftMonth = (delta: number) => {
    const base = parseLocalMonth(selectedMonth) ?? new Date(today.getFullYear(), today.getMonth(), 1);
    const next = new Date(base.getFullYear(), base.getMonth() + delta, 1);
    setSelectedMonth(toMonthInputValue(next));
    setRangeMode('month');
  };

  const shiftDay = (delta: number) => {
    const base = parseLocalDate(selectedDay) ?? today;
    const next = new Date(base);
    next.setDate(next.getDate() + delta);
    setSelectedDay(toDateInputValue(next));
    setRangeMode('day');
  };

  const attribution = useMemo(
    () => attributeAgentActions(actions, { start, end, now: new Date() }),
    [actions, start, end],
  );

  const searchQuery = searchInput.trim().toLowerCase();

  const employees = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of attribution.byEmployee) map.set(row.employeeKey, row.label);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [attribution.byEmployee]);

  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of attribution.byClient) map.set(row.clientKey, row.label);
    for (const action of actions) {
      if (!action.clientLabel && action.category !== 'internal') continue;
      map.set(
        clientKeyOf(action),
        action.category === 'internal' && !action.clientId
          ? t('agentActivity.internalBucket', 'Gestiones internas')
          : (action.clientLabel ?? t('agentActivity.noClient', 'Sin cliente')),
      );
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [actions, attribution.byClient, t]);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const action of actions) {
      if (!action.projectLabel && !action.projectId) continue;
      map.set(projectKeyOf(action), action.projectLabel?.trim() || t('agentActivity.unnamedProject', 'Proyecto'));
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [actions, t]);

  const channels = useMemo(() => {
    const set = new Set<AgentActionChannel>();
    for (const action of actions) {
      if (action.channel) set.add(action.channel);
    }
    return [...set].sort((a, b) => (CHANNEL_LABEL[a] ?? a).localeCompare(CHANNEL_LABEL[b] ?? b, 'es'));
  }, [actions]);

  const advancedFilterCount = [
    clientKey !== 'all',
    projectKey !== 'all',
    channel !== 'all',
    category !== 'all',
    tool !== 'all',
    status !== 'all',
    onlyImputable,
    onlyUnresolved,
    showNoise,
  ].filter(Boolean).length;

  const hasActiveFilters = searchQuery !== '' || employeeKey !== 'all' || advancedFilterCount > 0;

  const clearFilters = () => {
    setSearchInput('');
    setEmployeeKey('all');
    setClientKey('all');
    setProjectKey('all');
    setChannel('all');
    setCategory('all');
    setTool('all');
    setStatus('all');
    setOnlyImputable(false);
    setOnlyUnresolved(false);
    setShowNoise(false);
  };

  const visible = useMemo(() => {
    const byId = new Map(actions.map((action) => [action.id, action]));
    const matched = new Set<string>();

    for (const action of actions) {
      if (!showNoise && action.category === 'noise') continue;
      if (tool !== 'all' && action.tool !== tool) continue;
      if (category !== 'all' && action.category !== category) continue;
      if (channel !== 'all' && action.channel !== channel) continue;
      if (status !== 'all' && action.status !== status) continue;
      if (employeeKey !== 'all' && employeeKeyOf(action) !== employeeKey) continue;
      if (clientKey !== 'all' && clientKeyOf(action) !== clientKey) continue;
      if (projectKey !== 'all' && projectKeyOf(action) !== projectKey) continue;
      if (onlyUnresolved && action.matchStatus !== 'unmatched' && action.matchStatus !== 'ambiguous') continue;
      if (onlyImputable && !attribution.byAction.get(action.id)?.imputable) continue;
      if (!matchesSearch(action, searchQuery)) continue;
      matched.add(action.id);
    }

    const keep = expandWithAncestors(matched, byId);
    return actions.filter((action) => {
      if (!keep.has(action.id)) return false;
      if (!showNoise && action.category === 'noise' && !matched.has(action.id)) return false;
      return true;
    });
  }, [
    actions,
    attribution.byAction,
    category,
    channel,
    clientKey,
    employeeKey,
    onlyImputable,
    onlyUnresolved,
    projectKey,
    searchQuery,
    showNoise,
    status,
    tool,
  ]);

  const forest = useMemo(() => buildChildren(visible), [visible]);
  const roots = useMemo(() => {
    const list = [...(forest.get('__root__') ?? [])];
    list.sort((a, b) => deepLatest(b, forest).localeCompare(deepLatest(a, forest)));
    return list;
  }, [forest]);
  const defaultRootsOpen = searchQuery !== '' || roots.length <= 3;

  const flatList = useMemo(
    () => [...visible].sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [visible],
  );

  const filteredClientRows = useMemo(() => {
    if (clientKey === 'all' && !searchQuery && employeeKey === 'all' && projectKey === 'all') {
      return attribution.byClient;
    }
    const visibleClientKeys = new Set(
      visible
        .filter((action) => action.category === 'client_work' || action.category === 'internal')
        .map(clientKeyOf),
    );
    return attribution.byClient.filter((row) => visibleClientKeys.has(row.clientKey));
  }, [attribution.byClient, clientKey, employeeKey, projectKey, searchQuery, visible]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-3">
        {/* Cabecera compacta */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">
              {t('agentActivity.title', 'Trabajo de agentes')}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">
              {t(
                'agentActivity.subtitleShort',
                'Peticiones a Claude, Codex o Antigravity y el tiempo repartido por cliente.',
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} className="gap-2 shrink-0">
            <RefreshCw className="h-3.5 w-3.5" />
            {t('agentActivity.refresh', 'Actualizar')}
          </Button>
        </div>

        {/* Periodo + métricas en una franja */}
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['today', 'Hoy'],
                ['week', '7 días'],
                ['day', 'Día'],
                ['month', 'Mes'],
                ['custom', 'Rango'],
              ] as const
            ).map(([key, fallback]) => (
              <Button
                key={key}
                variant={rangeMode === key ? 'default' : 'outline'}
                size="sm"
                className={cn('h-8', rangeMode === key && 'bg-teal-700 hover:bg-teal-800')}
                onClick={() => setRangeMode(key)}
              >
                {t(`agentActivity.range.${key}`, fallback)}
              </Button>
            ))}
            <span className="text-xs text-slate-500 ml-1">
              {format(start, 'd MMM', { locale: dateLocale })} –{' '}
              {format(new Date(end.getTime() - 1), 'd MMM yyyy', { locale: dateLocale })}
              {loading && <Loader2 className="inline h-3.5 w-3.5 ml-1.5 animate-spin" />}
            </span>
          </div>

          {(rangeMode === 'day' || rangeMode === 'month' || rangeMode === 'custom') && (
            <div className="flex flex-wrap items-center gap-2">
              {rangeMode === 'day' && (
                <>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftDay(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Input type="date" value={selectedDay} onChange={(e) => { setSelectedDay(e.target.value); setRangeMode('day'); }} className="w-[10.5rem] h-8" />
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftDay(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {rangeMode === 'month' && (
                <>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Input type="month" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setRangeMode('month'); }} className="w-[10.5rem] h-8" />
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {rangeMode === 'custom' && (
                <>
                  <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-[10.5rem] h-8" aria-label={t('agentActivity.range.from', 'Desde')} />
                  <span className="text-xs text-slate-400">→</span>
                  <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-[10.5rem] h-8" aria-label={t('agentActivity.range.to', 'Hasta')} />
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            <MetricPill
              tone="sky"
              label={t('agentActivity.metrics.wall', 'Tiempo real')}
              value={formatMinutes(attribution.totals.wallMinutes)}
              tip={t(
                'agentActivity.metrics.wallTip',
                'Unión de intervalos con algo abierto. Si hay dos cosas a la vez, el reloj no se duplica.',
              )}
            />
            <MetricPill
              tone="emerald"
              label={t('agentActivity.metrics.imputable', 'A clientes')}
              value={formatMinutes(attribution.totals.imputableMinutes)}
              tip={t(
                'agentActivity.metrics.imputableTip',
                'Solo trabajo de cliente resuelto o gestiones internas. Si hay solape, se reparte a partes iguales (salvo attention=exclusive).',
              )}
            />
            <MetricPill
              tone="amber"
              label={t('agentActivity.metrics.presence', 'Si sumaras')}
              value={formatMinutes(attribution.totals.presenceMinutes)}
              tip={t(
                'agentActivity.metrics.presenceTip',
                'Suma bruta de cada bloque sin repartir. Se infla cuando hay varios clientes en paralelo.',
              )}
            />
            <MetricPill
              tone="rose"
              label={t('agentActivity.metrics.unattributed', 'Sin cliente')}
              value={formatMinutes(attribution.totals.unattributedMinutes)}
              tip={t(
                'agentActivity.metrics.unattributedTip',
                'Petición, detección o lectura que no acabó en un cliente concreto.',
              )}
            />
          </div>
        </div>

        {/* Barra de búsqueda / filtros rápidos */}
        <div className="rounded-lg border border-teal-200/80 bg-teal-50/40 px-3 py-2.5 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[14rem] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/70 pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('agentActivity.searchPlaceholder', 'Buscar título, cliente, proyecto, persona…')}
                className="pl-8 h-9 bg-white border-teal-200 focus-visible:ring-teal-600"
                aria-label={t('agentActivity.searchAria', 'Buscar actividad de agentes')}
              />
              {searchInput && (
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setSearchInput('')}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              className={cn(selectClass, 'border-teal-200')}
              value={employeeKey}
              onChange={(e) => setEmployeeKey(e.target.value)}
              aria-label={t('agentActivity.filterEmployee', 'Persona')}
            >
              <option value="all">{t('agentActivity.allEmployees', 'Todas las personas')}</option>
              {employees.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <Button
              type="button"
              size="sm"
              variant={filtersOpen || advancedFilterCount > 0 ? 'default' : 'outline'}
              className={cn(
                'h-9 gap-1.5',
                (filtersOpen || advancedFilterCount > 0) && 'bg-teal-700 hover:bg-teal-800',
              )}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <Filter className="h-3.5 w-3.5" />
              {t('agentActivity.moreFilters', 'Más filtros')}
              {advancedFilterCount > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 text-[11px]">{advancedFilterCount}</span>
              )}
            </Button>

            {hasActiveFilters && (
              <Button type="button" size="sm" variant="ghost" className="h-9 text-teal-800" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" />
                {t('agentActivity.clearFilters', 'Limpiar')}
              </Button>
            )}

            <span className="text-xs text-teal-900/70 ml-auto">
              {t('agentActivity.resultsCount', '{{count}} resultados', { count: visible.length })}
              {actions.length !== visible.length
                ? ` ${t('agentActivity.ofTotal', 'de {{total}}', { total: actions.length })}`
                : ''}
              {' · '}
              {t('agentActivity.rootsCount', '{{count}} raíces', { count: roots.length })}
            </span>
          </div>

          {filtersOpen && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-teal-100">
              <select className={selectClass} value={clientKey} onChange={(e) => setClientKey(e.target.value)}>
                <option value="all">{t('agentActivity.allClients', 'Todos los clientes')}</option>
                {clients.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <select className={selectClass} value={projectKey} onChange={(e) => setProjectKey(e.target.value)}>
                <option value="all">{t('agentActivity.allProjects', 'Todos los proyectos')}</option>
                {projects.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <select className={selectClass} value={channel} onChange={(e) => setChannel(e.target.value as 'all' | AgentActionChannel)}>
                <option value="all">{t('agentActivity.allChannels', 'Todos los canales')}</option>
                {channels.map((value) => <option key={value} value={value}>{CHANNEL_LABEL[value] ?? value}</option>)}
              </select>
              <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as 'all' | AgentActionCategory)}>
                <option value="all">{t('agentActivity.allCategories', 'Todos los tipos')}</option>
                {(Object.keys(CATEGORY_LABEL) as AgentActionCategory[]).map((value) => (
                  <option key={value} value={value}>{CATEGORY_LABEL[value]}</option>
                ))}
              </select>
              <select className={selectClass} value={tool} onChange={(e) => setTool(e.target.value as 'all' | AgentTool)}>
                <option value="all">{t('agentActivity.allTools', 'Todas las herramientas')}</option>
                <option value="claude">Claude</option>
                <option value="codex">Codex</option>
                <option value="antigravity">Antigravity</option>
                <option value="other">{t('agentActivity.otherTool', 'Otro')}</option>
              </select>
              <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as 'all' | AgentActionStatus)}>
                <option value="all">{t('agentActivity.allStatuses', 'Todos los estados')}</option>
                {(Object.keys(STATUS_LABEL) as AgentActionStatus[]).map((value) => (
                  <option key={value} value={value}>{STATUS_LABEL[value]}</option>
                ))}
              </select>
              <FilterChip active={onlyImputable} onClick={() => setOnlyImputable((v) => !v)} label={t('agentActivity.onlyImputable', 'Solo a clientes')} tone="emerald" />
              <FilterChip active={onlyUnresolved} onClick={() => setOnlyUnresolved((v) => !v)} label={t('agentActivity.onlyUnresolved', 'Cliente sin resolver')} tone="amber" />
              <FilterChip active={showNoise} onClick={() => setShowNoise((v) => !v)} label={t('agentActivity.showNoise', 'Descartados')} tone="stone" />
            </div>
          )}
        </div>

        {/* Resumen clientes colapsable */}
        <Collapsible open={clientsOpen} onOpenChange={setClientsOpen}>
          <div className="rounded-lg border border-emerald-200/70 bg-white overflow-hidden">
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-emerald-50/60">
                <span className="font-medium text-emerald-900 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  {t('agentActivity.clientsTitle', 'Resumen por cliente')}
                  <span className="text-xs font-normal text-emerald-700/70">({filteredClientRows.length})</span>
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  {t('agentActivity.clientsToggle', 'Ver tiempos')}
                  <ChevronDown className={cn('h-4 w-4 transition-transform', clientsOpen && 'rotate-180')} />
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredClientRows.length === 0 ? (
                <p className="px-3 py-4 text-sm text-slate-500 border-t">
                  {t('agentActivity.clientsEmpty', 'Todavía no hay trabajo de cliente en este periodo.')}
                </p>
              ) : (
                <div className="overflow-x-auto border-t">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-500 bg-emerald-50/40">
                      <tr>
                        <th className="px-3 py-1.5 font-medium">{t('agentActivity.col.client', 'Cliente')}</th>
                        <th className="px-3 py-1.5 font-medium">{t('agentActivity.col.actions', 'Acciones')}</th>
                        <th className="px-3 py-1.5 font-medium">{t('agentActivity.col.imputable', 'A clientes')}</th>
                        <th className="px-3 py-1.5 font-medium">{t('agentActivity.col.presence', 'Si sumaras')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClientRows.map((row) => {
                        const selected = clientKey === row.clientKey;
                        return (
                          <tr
                            key={row.clientKey}
                            className={cn('border-t cursor-pointer hover:bg-emerald-50/50', selected && 'bg-emerald-50')}
                            onClick={() => setClientKey(selected ? 'all' : row.clientKey)}
                          >
                            <td className="px-3 py-1.5 text-slate-900">
                              {row.clientId ? (
                                <SensitiveText kind="account" id={row.clientId}>{row.label}</SensitiveText>
                              ) : row.label}
                            </td>
                            <td className="px-3 py-1.5">{row.actionCount}</td>
                            <td className="px-3 py-1.5 text-emerald-800 font-medium">{formatMinutes(row.imputableMinutes)}</td>
                            <td className="px-3 py-1.5 text-amber-800/80">{formatMinutes(row.presenceMinutes)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Controles de vista + listado */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            {t('agentActivity.listTitle', 'Actividad')}
          </span>
          <div className="flex rounded-md border border-slate-200 overflow-hidden">
            <button
              type="button"
              className={cn('px-2.5 h-8 text-xs', viewMode === 'tree' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600')}
              onClick={() => setViewMode('tree')}
            >
              {t('agentActivity.viewTree', 'Árbol')}
            </button>
            <button
              type="button"
              className={cn('px-2.5 h-8 text-xs border-l', viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600')}
              onClick={() => setViewMode('list')}
            >
              {t('agentActivity.viewList', 'Lista')}
            </button>
          </div>
          {viewMode === 'tree' && (
            <>
              <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setExpandAllToken((n) => n + 1)}>
                {t('agentActivity.expandAll', 'Abrir')}
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setCollapseAllToken((n) => n + 1)}>
                {t('agentActivity.collapseAll', 'Cerrar')}
              </Button>
            </>
          )}
          <p className="text-xs text-slate-500 ml-auto max-w-md text-right">
            {t(
              'agentActivity.rootHint',
              'Cada petición es una raíz. Si retomas la misma conversación, no crees otra: reutiliza el external_id o añade hijos.',
            )}
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && visible.length === 0 && (
          <div className="border border-dashed border-slate-300 rounded-lg p-5 text-sm text-slate-500 space-y-2 bg-slate-50/50">
            <p>
              {hasActiveFilters
                ? t('agentActivity.emptyFiltered', 'No hay nada con estos filtros. Prueba a limpiarlos o cambia el periodo.')
                : t('agentActivity.empty', 'Cuando un agente termine un trabajo real, aparecerá aquí.')}
            </p>
            {!hasActiveFilters && (
              <p>
                <Link className="text-teal-800 underline" to="/api-docs#resource-agent_actions">
                  {t('agentActivity.apiLink', 'Cómo registrarlo por API')}
                </Link>
              </p>
            )}
          </div>
        )}

        {viewMode === 'tree' ? (
          <div className="space-y-2">
            {roots.map((action) => (
              <ActionNode
                key={action.id}
                action={action}
                forest={forest}
                attribution={attribution.byAction}
                depth={0}
                defaultOpen={defaultRootsOpen}
                expandAllToken={expandAllToken}
                collapseAllToken={collapseAllToken}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg divide-y">
            {flatList.map((action) => (
              <FlatActionRow key={action.id} action={action} part={attribution.byAction.get(action.id)} />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function MetricPill({
  label,
  value,
  tip,
  tone,
}: {
  label: string;
  value: string;
  tip: string;
  tone: 'sky' | 'emerald' | 'amber' | 'rose';
}) {
  const toneClass = {
    sky: 'bg-sky-50 border-sky-200 text-sky-950',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    amber: 'bg-amber-50 border-amber-200 text-amber-950',
    rose: 'bg-rose-50 border-rose-200 text-rose-950',
  }[tone];

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs', toneClass)}>
      <span className="opacity-70">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="opacity-60 hover:opacity-100" aria-label={tip}>
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
          {tip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone: 'emerald' | 'amber' | 'stone';
}) {
  const activeClass = {
    emerald: 'border-emerald-700 bg-emerald-700 text-white',
    amber: 'border-amber-700 bg-amber-700 text-white',
    stone: 'border-stone-700 bg-stone-700 text-white',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-9 rounded-md border px-3 text-sm transition-colors',
        active ? activeClass : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  );
}

function ActionNode({
  action,
  forest,
  attribution,
  depth,
  defaultOpen,
  expandAllToken,
  collapseAllToken,
}: {
  action: AgentAction;
  forest: Map<string, AgentAction[]>;
  attribution: Map<string, ActionAttribution>;
  depth: number;
  defaultOpen: boolean;
  expandAllToken: number;
  collapseAllToken: number;
}) {
  const children = forest.get(action.id) ?? [];
  const parts = countDescendants(action.id, forest);
  const [open, setOpen] = useState(depth === 0 ? defaultOpen : true);

  useEffect(() => {
    if (expandAllToken > 0) setOpen(true);
  }, [expandAllToken]);

  useEffect(() => {
    if (collapseAllToken > 0) setOpen(false);
  }, [collapseAllToken]);

  const part = attribution.get(action.id);
  const when = action.finishedAt
    ? `${format(new Date(action.startedAt), 'd MMM HH:mm')} – ${format(new Date(action.finishedAt), 'HH:mm')}`
    : format(new Date(action.startedAt), 'd MMM HH:mm');

  const borderTone =
    depth === 0
      ? action.category === 'client_work'
        ? 'border-l-emerald-500'
        : action.category === 'internal'
          ? 'border-l-amber-500'
          : 'border-l-sky-500'
      : 'border-l-slate-200';

  return (
    <div className={cn(depth === 0 ? 'bg-white border border-slate-200 rounded-lg border-l-4' : 'ml-3 pl-3 border-l-2', borderTone)}>
      <div className={depth === 0 ? 'p-3' : 'py-2'}>
        <div className="flex items-start gap-2">
          {children.length > 0 ? (
            <button type="button" className="mt-0.5 text-slate-400 shrink-0" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <span className="w-4 shrink-0" />}
          <div className="min-w-0 flex-1 space-y-1.5">
            <ActionBadges action={action} parts={depth === 0 ? parts : 0} />
            <div className="text-sm text-slate-900 font-medium leading-snug">{action.title}</div>
            {action.outcome && <p className="text-sm text-slate-600">{action.outcome}</p>}
            <ActionMeta action={action} when={when} part={part} />
          </div>
        </div>
      </div>
      {open && children.map((child) => (
        <ActionNode
          key={child.id}
          action={child}
          forest={forest}
          attribution={attribution}
          depth={depth + 1}
          defaultOpen={defaultOpen}
          expandAllToken={expandAllToken}
          collapseAllToken={collapseAllToken}
        />
      ))}
    </div>
  );
}

function FlatActionRow({
  action,
  part,
}: {
  action: AgentAction;
  part: ActionAttribution | undefined;
}) {
  const when = action.finishedAt
    ? `${format(new Date(action.startedAt), 'd MMM HH:mm')} – ${format(new Date(action.finishedAt), 'HH:mm')}`
    : format(new Date(action.startedAt), 'd MMM HH:mm');
  const pad = Math.min(action.depth, 4) * 12;

  return (
    <div className="p-3" style={{ paddingLeft: 12 + pad }}>
      <ActionBadges action={action} parts={0} />
      <div className="mt-1.5 text-sm text-slate-900 font-medium">{action.title}</div>
      {action.outcome && <p className="mt-1 text-sm text-slate-600">{action.outcome}</p>}
      <ActionMeta action={action} when={when} part={part} />
    </div>
  );
}

function ActionBadges({ action, parts }: { action: AgentAction; parts: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={cn('text-[11px] rounded-md border px-1.5 py-0.5 font-medium', CATEGORY_STYLE[action.category])}>
        {CATEGORY_LABEL[action.category]}
      </span>
      <span className={cn('text-[11px] rounded-md border px-1.5 py-0.5 font-medium', TOOL_STYLE[action.tool])}>
        {TOOL_LABEL[action.tool]}
      </span>
      {action.channel && (
        <span className="text-[11px] rounded-md border border-slate-200 bg-slate-50 text-slate-700 px-1.5 py-0.5">
          {CHANNEL_LABEL[action.channel] ?? action.channel}
        </span>
      )}
      {action.clientLabel && (
        <span className="text-[11px] text-emerald-800 font-medium">
          {action.clientId ? (
            <SensitiveText kind="account" id={action.clientId}>{action.clientLabel}</SensitiveText>
          ) : action.clientLabel}
          {action.matchStatus === 'unmatched' || action.matchStatus === 'ambiguous' ? (
            <span className="text-amber-700"> · sin imputar</span>
          ) : null}
        </span>
      )}
      {action.projectLabel && (
        <span className="text-[11px] text-teal-800">
          {action.projectId ? (
            <SensitiveText kind="project" id={action.projectId}>{action.projectLabel}</SensitiveText>
          ) : action.projectLabel}
        </span>
      )}
      {parts > 0 && (
        <span className="text-[11px] rounded-md bg-sky-50 border border-sky-200 text-sky-800 px-1.5 py-0.5">
          {parts} {parts === 1 ? 'parte' : 'partes'}
        </span>
      )}
      {action.status !== 'completed' && (
        <span className={cn('text-[11px] font-medium', STATUS_STYLE[action.status])}>
          {STATUS_LABEL[action.status]}
        </span>
      )}
    </div>
  );
}

function ActionMeta({
  action,
  when,
  part,
}: {
  action: AgentAction;
  when: string;
  part: ActionAttribution | undefined;
}) {
  const name = employeeDisplayName(action);
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
      <span className="text-slate-700 font-medium">
        {action.employeeId ? (
          <SensitiveText kind="employee" id={action.employeeId}>{name}</SensitiveText>
        ) : name}
      </span>
      <span>{when}</span>
      {part?.imputable && <span className="text-emerald-700">A cliente {formatMinutes(part.imputableMinutes)}</span>}
      {part?.imputable && part.presenceMinutes - part.imputableMinutes > 0.5 && (
        <span className="text-amber-700">Sin repartir {formatMinutes(part.presenceMinutes)}</span>
      )}
      {action.historyRef && <span className="truncate max-w-md">{action.historyRef}</span>}
    </div>
  );
}
