import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

type RangeMode = 'today' | 'week' | 'day' | 'month' | 'custom';
type ViewMode = 'tree' | 'list';

const CATEGORY_LABEL: Record<AgentActionCategory, string> = {
  intake: 'Petición',
  triage: 'Detección',
  client_work: 'Trabajo de cliente',
  internal: 'Interno',
  noise: 'Descartado',
};

const TOOL_LABEL: Record<AgentTool, string> = {
  claude: 'Claude',
  codex: 'Codex',
  antigravity: 'Antigravity',
  other: 'Otro',
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
  'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm min-w-[9.5rem] max-w-full';

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
      map.set(clientKeyOf(action), action.category === 'internal' && !action.clientId
        ? t('agentActivity.internalBucket', 'Gestiones internas')
        : (action.clientLabel ?? t('agentActivity.noClient', 'Sin cliente')));
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

  const hasActiveFilters =
    searchQuery !== ''
    || employeeKey !== 'all'
    || clientKey !== 'all'
    || projectKey !== 'all'
    || channel !== 'all'
    || category !== 'all'
    || tool !== 'all'
    || status !== 'all'
    || onlyImputable
    || onlyUnresolved
    || showNoise;

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
    // If ancestors were noise-hidden, still hide them unless showNoise
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
  const roots = forest.get('__root__') ?? [];
  const defaultRootsOpen = roots.length <= 8 && searchQuery === '';

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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {t('agentActivity.title', 'Trabajo de agentes')}
          </h1>
          <p className="text-slate-500 mt-1 max-w-3xl">
            {t(
              'agentActivity.subtitle',
              'Aquí ves qué se pidió a Claude, Codex o Antigravity y a qué cliente fue el tiempo. Si alguien tiene varias cosas a la vez, la hora se reparte: no se cuenta entera en cada cliente.',
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          {t('agentActivity.refresh', 'Actualizar')}
        </Button>
      </div>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="text-sm font-medium text-slate-700">
          {t('agentActivity.periodTitle', 'Periodo')}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => setRangeMode(key)}
            >
              {t(`agentActivity.range.${key}`, fallback)}
            </Button>
          ))}
          <span className="text-sm text-slate-500 ml-1">
            {format(start, 'd MMM', { locale: dateLocale })} –{' '}
            {format(new Date(end.getTime() - 1), 'd MMM yyyy', { locale: dateLocale })}
            {loading && <Loader2 className="inline h-3.5 w-3.5 ml-2 animate-spin" />}
          </span>
        </div>

        {rangeMode === 'day' && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => shiftDay(-1)} aria-label={t('agentActivity.range.prevDay', 'Día anterior')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type="date"
              value={selectedDay}
              onChange={(event) => {
                setSelectedDay(event.target.value);
                setRangeMode('day');
              }}
              className="w-[11.5rem] h-9"
              aria-label={t('agentActivity.range.pickDay', 'Elegir día')}
            />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => shiftDay(1)} aria-label={t('agentActivity.range.nextDay', 'Día siguiente')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedDay(toDateInputValue(today)); setRangeMode('day'); }}>
              {t('agentActivity.range.jumpToday', 'Ir a hoy')}
            </Button>
          </div>
        )}

        {rangeMode === 'month' && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => shiftMonth(-1)} aria-label={t('agentActivity.range.prevMonth', 'Mes anterior')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                setRangeMode('month');
              }}
              className="w-[11.5rem] h-9"
              aria-label={t('agentActivity.range.pickMonth', 'Elegir mes')}
            />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => shiftMonth(1)} aria-label={t('agentActivity.range.nextMonth', 'Mes siguiente')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedMonth(toMonthInputValue(today));
                setRangeMode('month');
              }}
            >
              {t('agentActivity.range.jumpThisMonth', 'Mes actual')}
            </Button>
            <span className="text-sm text-slate-600">
              {format(start, 'MMMM yyyy', { locale: dateLocale })}
            </span>
          </div>
        )}

        {rangeMode === 'custom' && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm text-slate-600">
              <span className="block">{t('agentActivity.range.from', 'Desde')}</span>
              <Input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="w-[11.5rem] h-9"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span className="block">{t('agentActivity.range.to', 'Hasta')}</span>
              <Input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="w-[11.5rem] h-9"
              />
            </label>
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={t('agentActivity.metrics.wall', 'Tiempo real')}
          value={formatMinutes(attribution.totals.wallMinutes)}
          hint={t('agentActivity.metrics.wallHint', 'Cuánto tiempo estuvo alguien con trabajo abierto. Si había dos cosas a la vez, no se duplica.')}
        />
        <Metric
          label={t('agentActivity.metrics.imputable', 'A clientes')}
          value={formatMinutes(attribution.totals.imputableMinutes)}
          hint={t('agentActivity.metrics.imputableHint', 'Tiempo que sí se puede asignar a un cliente (o a gestiones internas), ya repartido si había solapes.')}
        />
        <Metric
          label={t('agentActivity.metrics.presence', 'Si sumaras todo')}
          value={formatMinutes(attribution.totals.presenceMinutes)}
          hint={t('agentActivity.metrics.presenceHint', 'La cifra que se infla si sumas cada cliente por separado cuando hay varios a la vez.')}
        />
        <Metric
          label={t('agentActivity.metrics.unattributed', 'Sin cliente')}
          value={formatMinutes(attribution.totals.unattributedMinutes)}
          hint={t('agentActivity.metrics.unattributedHint', 'Peticiones, lecturas o detecciones que no acabaron en trabajo de un cliente.')}
        />
      </div>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-700">
            {t('agentActivity.filtersTitle', 'Filtros y búsqueda')}
          </span>
          <span className="text-slate-400">·</span>
          <span>
            {t('agentActivity.resultsCount', '{{count}} resultados', { count: visible.length })}
            {actions.length !== visible.length
              ? ` ${t('agentActivity.ofTotal', 'de {{total}}', { total: actions.length })}`
              : ''}
          </span>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-slate-600" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              {t('agentActivity.clearFilters', 'Limpiar filtros')}
            </Button>
          )}
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t(
              'agentActivity.searchPlaceholder',
              'Buscar por título, cliente, proyecto, persona…',
            )}
            className="pl-9 h-10"
            aria-label={t('agentActivity.searchAria', 'Buscar actividad de agentes')}
          />
          {searchInput && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
              onClick={() => setSearchInput('')}
              aria-label={t('agentActivity.clearSearch', 'Borrar búsqueda')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select className={selectClass} value={employeeKey} onChange={(e) => setEmployeeKey(e.target.value)} aria-label={t('agentActivity.filterEmployee', 'Persona')}>
            <option value="all">{t('agentActivity.allEmployees', 'Todas las personas')}</option>
            {employees.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select className={selectClass} value={clientKey} onChange={(e) => setClientKey(e.target.value)} aria-label={t('agentActivity.filterClient', 'Cliente')}>
            <option value="all">{t('agentActivity.allClients', 'Todos los clientes')}</option>
            {clients.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select className={selectClass} value={projectKey} onChange={(e) => setProjectKey(e.target.value)} aria-label={t('agentActivity.filterProject', 'Proyecto')}>
            <option value="all">{t('agentActivity.allProjects', 'Todos los proyectos')}</option>
            {projects.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className={selectClass}
            value={channel}
            onChange={(e) => setChannel(e.target.value as 'all' | AgentActionChannel)}
            aria-label={t('agentActivity.filterChannel', 'Canal')}
          >
            <option value="all">{t('agentActivity.allChannels', 'Todos los canales')}</option>
            {channels.map((value) => (
              <option key={value} value={value}>{CHANNEL_LABEL[value] ?? value}</option>
            ))}
          </select>
          <select
            className={selectClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as 'all' | AgentActionCategory)}
            aria-label={t('agentActivity.filterCategory', 'Tipo')}
          >
            <option value="all">{t('agentActivity.allCategories', 'Todos los tipos')}</option>
            {(Object.keys(CATEGORY_LABEL) as AgentActionCategory[]).map((value) => (
              <option key={value} value={value}>{CATEGORY_LABEL[value]}</option>
            ))}
          </select>
          <select
            className={selectClass}
            value={tool}
            onChange={(e) => setTool(e.target.value as 'all' | AgentTool)}
            aria-label={t('agentActivity.filterTool', 'Herramienta')}
          >
            <option value="all">{t('agentActivity.allTools', 'Todas las herramientas')}</option>
            <option value="claude">Claude</option>
            <option value="codex">Codex</option>
            <option value="antigravity">Antigravity</option>
            <option value="other">{t('agentActivity.otherTool', 'Otro')}</option>
          </select>
          <select
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | AgentActionStatus)}
            aria-label={t('agentActivity.filterStatus', 'Estado')}
          >
            <option value="all">{t('agentActivity.allStatuses', 'Todos los estados')}</option>
            {(Object.keys(STATUS_LABEL) as AgentActionStatus[]).map((value) => (
              <option key={value} value={value}>{STATUS_LABEL[value]}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <FilterChip
            active={onlyImputable}
            onClick={() => setOnlyImputable((value) => !value)}
            label={t('agentActivity.onlyImputable', 'Solo tiempo a clientes')}
          />
          <FilterChip
            active={onlyUnresolved}
            onClick={() => setOnlyUnresolved((value) => !value)}
            label={t('agentActivity.onlyUnresolved', 'Cliente sin resolver')}
          />
          <FilterChip
            active={showNoise}
            onClick={() => setShowNoise((value) => !value)}
            label={t('agentActivity.showNoise', 'Ver descartados')}
          />
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'tree' ? 'default' : 'outline'}
              onClick={() => setViewMode('tree')}
            >
              {t('agentActivity.viewTree', 'Árbol')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              {t('agentActivity.viewList', 'Lista')}
            </Button>
            {viewMode === 'tree' && (
              <>
                <Button type="button" size="sm" variant="ghost" onClick={() => setExpandAllToken((n) => n + 1)}>
                  {t('agentActivity.expandAll', 'Abrir todo')}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setCollapseAllToken((n) => n + 1)}>
                  {t('agentActivity.collapseAll', 'Cerrar todo')}
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b text-sm font-medium text-slate-700 flex flex-wrap items-center justify-between gap-2">
          <span>{t('agentActivity.clientsTitle', 'Resumen por cliente')}</span>
          <span className="text-xs font-normal text-slate-500">
            {t('agentActivity.clientsHint', 'Pulsa un cliente para filtrar la lista de abajo.')}
          </span>
        </div>
        {filteredClientRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            {t('agentActivity.clientsEmpty', 'Todavía no hay trabajo de cliente en este periodo.')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{t('agentActivity.col.client', 'Cliente')}</th>
                  <th className="px-4 py-2 font-medium">{t('agentActivity.col.actions', 'Acciones')}</th>
                  <th className="px-4 py-2 font-medium">{t('agentActivity.col.imputable', 'A clientes')}</th>
                  <th className="px-4 py-2 font-medium">{t('agentActivity.col.presence', 'Si sumaras todo')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientRows.map((row) => {
                  const selected = clientKey === row.clientKey;
                  return (
                    <tr
                      key={row.clientKey}
                      className={`border-t cursor-pointer hover:bg-slate-50 ${selected ? 'bg-slate-100' : ''}`}
                      onClick={() => setClientKey(selected ? 'all' : row.clientKey)}
                    >
                      <td className="px-4 py-2 text-slate-900">
                        {row.clientId ? (
                          <SensitiveText kind="account" id={row.clientId}>{row.label}</SensitiveText>
                        ) : row.label}
                      </td>
                      <td className="px-4 py-2">{row.actionCount}</td>
                      <td className="px-4 py-2">{formatMinutes(row.imputableMinutes)}</td>
                      <td className="px-4 py-2 text-slate-500">{formatMinutes(row.presenceMinutes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && visible.length === 0 && (
        <div className="border border-dashed rounded-lg p-6 text-sm text-slate-500 space-y-2">
          <p>
            {hasActiveFilters
              ? t('agentActivity.emptyFiltered', 'No hay nada con estos filtros. Prueba a limpiarlos o cambia el periodo.')
              : t('agentActivity.empty', 'Cuando un agente termine un trabajo real, aparecerá aquí. Una lectura suelta o un comando local no debería registrarse.')}
          </p>
          {!hasActiveFilters && (
            <p>
              <Link className="text-slate-900 underline" to="/api-docs#resource-agent_actions">
                {t('agentActivity.apiLink', 'Cómo registrarlo por API')}
              </Link>
            </p>
          )}
        </div>
      )}

      {viewMode === 'tree' ? (
        <div className="space-y-3">
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
        <div className="bg-white border rounded-lg divide-y">
          {flatList.map((action) => (
            <FlatActionRow
              key={action.id}
              action={action}
              part={attribution.byAction.get(action.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-md border px-3 text-sm transition-colors ${
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
      <p className="text-xs text-slate-500 mt-2">{hint}</p>
    </div>
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
  const [open, setOpen] = useState(defaultOpen);

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

  return (
    <div className={depth === 0 ? 'bg-white border rounded-lg' : 'border-l border-slate-200 ml-4 pl-3'}>
      <div className={depth === 0 ? 'p-4' : 'py-3'}>
        <ActionBadges action={action} />
        <div className="mt-2 flex items-start gap-2">
          {children.length > 0 ? (
            <button type="button" className="mt-0.5 text-slate-400 shrink-0" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <span className="w-4 shrink-0" />}
          <div className="min-w-0 flex-1">
            <div className="text-sm text-slate-900 font-medium">{action.title}</div>
            {action.outcome && <p className="mt-1 text-sm text-slate-600">{action.outcome}</p>}
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
    <div className="p-4" style={{ paddingLeft: 16 + pad }}>
      <ActionBadges action={action} />
      <div className="mt-2 text-sm text-slate-900 font-medium">{action.title}</div>
      {action.outcome && <p className="mt-1 text-sm text-slate-600">{action.outcome}</p>}
      <ActionMeta action={action} when={when} part={part} />
    </div>
  );
}

function ActionBadges({ action }: { action: AgentAction }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">{CATEGORY_LABEL[action.category]}</span>
      <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">{TOOL_LABEL[action.tool]}</span>
      {action.channel && (
        <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">{CHANNEL_LABEL[action.channel] ?? action.channel}</span>
      )}
      {action.clientLabel && (
        <span className="text-xs text-slate-700">
          {action.clientId ? (
            <SensitiveText kind="account" id={action.clientId}>{action.clientLabel}</SensitiveText>
          ) : action.clientLabel}
          {action.matchStatus === 'unmatched' || action.matchStatus === 'ambiguous' ? ' · sin imputar' : ''}
        </span>
      )}
      {action.projectLabel && (
        <span className="text-xs text-slate-600">
          {action.projectId ? (
            <SensitiveText kind="project" id={action.projectId}>{action.projectLabel}</SensitiveText>
          ) : action.projectLabel}
        </span>
      )}
      {action.clientTier && <span className="text-xs text-slate-500">{action.clientTier}</span>}
      {action.status !== 'completed' && (
        <span className="text-xs text-amber-700">{STATUS_LABEL[action.status]}</span>
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
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      <span>
        {action.employeeId ? (
          <SensitiveText kind="employee" id={action.employeeId}>{action.employeeLabel ?? 'Persona'}</SensitiveText>
        ) : (action.employeeLabel ?? 'Sin persona')}
      </span>
      <span>{when}</span>
      {part?.imputable && <span>A cliente {formatMinutes(part.imputableMinutes)}</span>}
      {part?.imputable && part.presenceMinutes - part.imputableMinutes > 0.5 && (
        <span>Sin repartir {formatMinutes(part.presenceMinutes)}</span>
      )}
      {action.historyRef && <span className="truncate max-w-md">{action.historyRef}</span>}
    </div>
  );
}
