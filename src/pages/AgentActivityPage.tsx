import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { useAgency } from '@/contexts/AgencyContext';
import { useAgentActions } from '@/hooks/useAgentActions';
import { useDateLocale } from '@/hooks/useDateLocale';
import type { AgentAction, AgentActionCategory, AgentTool } from '@/types/agentActions';
import {
  attributeAgentActions,
  formatMinutes,
  type ActionAttribution,
} from '@/utils/agentActionAttribution';

type RangeKey = 'today' | 'week' | 'month';

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

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function rangeFor(key: RangeKey, today: Date): { start: Date; end: Date } {
  const startToday = startOfLocalDay(today);
  if (key === 'today') {
    const end = new Date(startToday);
    end.setDate(end.getDate() + 1);
    return { start: startToday, end };
  }
  if (key === 'week') {
    const start = new Date(startToday);
    start.setDate(start.getDate() - 6);
    const end = new Date(startToday);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return { start, end };
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

export default function AgentActivityPage() {
  const { t } = useTranslation('app');
  const dateLocale = useDateLocale();
  const { currentAgency } = useAgency();
  const [rangeKey, setRangeKey] = useState<RangeKey>('today');
  const [employeeKey, setEmployeeKey] = useState('all');
  const [tool, setTool] = useState<'all' | AgentTool>('all');
  const [showNoise, setShowNoise] = useState(false);
  const [onlyImputable, setOnlyImputable] = useState(false);

  const { start, end } = useMemo(() => rangeFor(rangeKey, new Date()), [rangeKey]);
  const { actions, loading, error, refresh } = useAgentActions(currentAgency?.id ?? null, start, end);

  const attribution = useMemo(
    () => attributeAgentActions(actions, { start, end, now: new Date() }),
    [actions, start, end],
  );

  const employees = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of attribution.byEmployee) map.set(row.employeeKey, row.label);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [attribution.byEmployee]);

  const visible = useMemo(() => {
    return actions.filter((action) => {
      if (!showNoise && action.category === 'noise') return false;
      if (tool !== 'all' && action.tool !== tool) return false;
      if (employeeKey !== 'all') {
        const key = action.employeeId ?? `label:${(action.employeeLabel ?? 'sin-persona').trim().toLowerCase()}`;
        if (key !== employeeKey) return false;
      }
      return true;
    });
  }, [actions, employeeKey, showNoise, tool]);

  const visibleIds = useMemo(() => {
    if (!onlyImputable) return new Set(visible.map((action) => action.id));
    const keep = new Set<string>();
    const byId = new Map(visible.map((action) => [action.id, action]));
    for (const action of visible) {
      if (!attribution.byAction.get(action.id)?.imputable) continue;
      let current: AgentAction | undefined = action;
      while (current) {
        keep.add(current.id);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
    }
    return keep;
  }, [attribution.byAction, onlyImputable, visible]);

  const forest = useMemo(() => buildChildren(visible.filter((action) => visibleIds.has(action.id))), [visible, visibleIds]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {t('agentActivity.title', 'Trabajo en paralelo')}
          </h1>
          <p className="text-slate-500 mt-1 max-w-3xl">
            {t(
              'agentActivity.subtitle',
              'Lo que cada persona pide a Claude, Codex o Antigravity, y el trabajo de cliente que sale de ahí. Si varias cosas coinciden en el tiempo, la hora se reparte: no se suma entera a cada cliente.',
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          {t('agentActivity.refresh', 'Actualizar')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['today', 'week', 'month'] as RangeKey[]).map((key) => (
          <Button
            key={key}
            variant={rangeKey === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRangeKey(key)}
          >
            {t(`agentActivity.range.${key}`, key === 'today' ? 'Hoy' : key === 'week' ? '7 días' : 'Mes')}
          </Button>
        ))}
        <span className="text-sm text-slate-500 ml-1">
          {format(start, 'd MMM', { locale: dateLocale })} – {format(new Date(end.getTime() - 1), 'd MMM yyyy', { locale: dateLocale })}
          {loading && <Loader2 className="inline h-3.5 w-3.5 ml-2 animate-spin" />}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={t('agentActivity.metrics.wall', 'Reloj de la persona')}
          value={formatMinutes(attribution.totals.wallMinutes)}
          hint={t('agentActivity.metrics.wallHint', 'Tiempo real con algo abierto, sin duplicar solapes.')}
        />
        <Metric
          label={t('agentActivity.metrics.imputable', 'Imputable')}
          value={formatMinutes(attribution.totals.imputableMinutes)}
          hint={t('agentActivity.metrics.imputableHint', 'Solo trabajo de cliente resuelto, o gestión interna, ya repartido.')}
        />
        <Metric
          label={t('agentActivity.metrics.presence', 'Suma sin repartir')}
          value={formatMinutes(attribution.totals.presenceMinutes)}
          hint={t('agentActivity.metrics.presenceHint', 'La cifra que se infla cuando hay cuatro clientes a la vez.')}
        />
        <Metric
          label={t('agentActivity.metrics.unattributed', 'Sin imputar')}
          value={formatMinutes(attribution.totals.unattributedMinutes)}
          hint={t('agentActivity.metrics.unattributedHint', 'Lectura, detección o petición que no llegó a un cliente.')}
        />
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b text-sm font-medium text-slate-700">
          {t('agentActivity.clientsTitle', 'Por cliente')}
        </div>
        {attribution.byClient.length === 0 ? (
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
                  <th className="px-4 py-2 font-medium">{t('agentActivity.col.imputable', 'Imputable')}</th>
                  <th className="px-4 py-2 font-medium">{t('agentActivity.col.presence', 'Suma sin repartir')}</th>
                </tr>
              </thead>
              <tbody>
                {attribution.byClient.map((row) => (
                  <tr key={row.clientKey} className="border-t">
                    <td className="px-4 py-2 text-slate-900">
                      {row.clientId ? (
                        <SensitiveText kind="account" id={row.clientId}>{row.label}</SensitiveText>
                      ) : row.label}
                    </td>
                    <td className="px-4 py-2">{row.actionCount}</td>
                    <td className="px-4 py-2">{formatMinutes(row.imputableMinutes)}</td>
                    <td className="px-4 py-2 text-slate-500">{formatMinutes(row.presenceMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          value={employeeKey}
          onChange={(event) => setEmployeeKey(event.target.value)}
          aria-label={t('agentActivity.filterEmployee', 'Persona')}
        >
          <option value="all">{t('agentActivity.allEmployees', 'Todas las personas')}</option>
          {employees.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          value={tool}
          onChange={(event) => setTool(event.target.value as 'all' | AgentTool)}
          aria-label={t('agentActivity.filterTool', 'Herramienta')}
        >
          <option value="all">{t('agentActivity.allTools', 'Todas las herramientas')}</option>
          <option value="claude">Claude</option>
          <option value="codex">Codex</option>
          <option value="antigravity">Antigravity</option>
          <option value="other">{t('agentActivity.otherTool', 'Otro')}</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={onlyImputable} onChange={(event) => setOnlyImputable(event.target.checked)} />
          {t('agentActivity.onlyImputable', 'Solo lo imputable')}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showNoise} onChange={(event) => setShowNoise(event.target.checked)} />
          {t('agentActivity.showNoise', 'Ver descartados')}
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && forest.get('__root__') == null && (
        <div className="border border-dashed rounded-lg p-6 text-sm text-slate-500 space-y-2">
          <p>{t('agentActivity.empty', 'Cuando un agente cierre una petición real, el árbol aparece aquí. Una lectura suelta o un comando local no debería registrarse.')}</p>
          <p>
            <Link className="text-slate-900 underline" to="/api-docs#resource-agent_actions">
              {t('agentActivity.apiLink', 'Contrato para registrarlo por API')}
            </Link>
          </p>
        </div>
      )}

      <div className="space-y-3">
        {(forest.get('__root__') ?? []).map((action) => (
          <ActionNode
            key={action.id}
            action={action}
            forest={forest}
            attribution={attribution.byAction}
            depth={0}
          />
        ))}
      </div>
    </div>
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
}: {
  action: AgentAction;
  forest: Map<string, AgentAction[]>;
  attribution: Map<string, ActionAttribution>;
  depth: number;
}) {
  const children = forest.get(action.id) ?? [];
  const [open, setOpen] = useState(true);
  const part = attribution.get(action.id);
  const when = action.finishedAt
    ? `${format(new Date(action.startedAt), 'd MMM HH:mm')} – ${format(new Date(action.finishedAt), 'HH:mm')}`
    : format(new Date(action.startedAt), 'd MMM HH:mm');

  return (
    <div className={depth === 0 ? 'bg-white border rounded-lg' : 'border-l border-slate-200 ml-4 pl-3'}>
      <div className={depth === 0 ? 'p-4' : 'py-3'}>
        <div className="flex flex-wrap items-center gap-2">
          {children.length > 0 ? (
            <button type="button" className="text-slate-400" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <span className="w-4" />}
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
          {action.clientTier && <span className="text-xs text-slate-500">{action.clientTier}</span>}
          {action.status !== 'completed' && (
            <span className="text-xs text-amber-700">{action.status === 'cancelled' ? 'Cancelada' : 'En curso'}</span>
          )}
        </div>
        <div className="mt-2 text-sm text-slate-900">{action.title}</div>
        {action.outcome && <p className="mt-1 text-sm text-slate-600">{action.outcome}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            {action.employeeId ? (
              <SensitiveText kind="employee" id={action.employeeId}>{action.employeeLabel ?? 'Persona'}</SensitiveText>
            ) : (action.employeeLabel ?? 'Sin persona')}
          </span>
          <span>{when}</span>
          {part?.imputable && <span>Imputable {formatMinutes(part.imputableMinutes)}</span>}
          {part?.imputable && part.presenceMinutes - part.imputableMinutes > 0.5 && (
            <span>Presencia {formatMinutes(part.presenceMinutes)}</span>
          )}
          {action.historyRef && <span className="truncate max-w-md">{action.historyRef}</span>}
        </div>
      </div>
      {open && children.map((child) => (
        <ActionNode key={child.id} action={child} forest={forest} attribution={attribution} depth={depth + 1} />
      ))}
    </div>
  );
}
