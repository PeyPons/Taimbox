import { Fragment, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAgency } from '@/contexts/AgencyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { RefreshCw, Settings, Layers, TrendingUp, TrendingDown, Scissors, Plus, Trash2, AlertTriangle, CheckCircle2, EyeOff, X, Facebook, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAdsFormatMoney } from '@/hooks/useAdsFormatMoney';
import { useRefreshMissingAdCurrencies } from '@/hooks/useRefreshMissingAdCurrencies';
import { toast } from '@/lib/notify';
import { useAnonymizeAds } from '@/hooks/useAnonymizeAds';
import { AnonymizedContent } from '@/components/ads/AnonymizedContent';
import { AdsPageHeader } from '@/components/ads/AdsPageHeader';
import { AdsAccountRow, AdsIconButton, adsAccountCardClass } from '@/components/ads/AdsAccountRow';
import { AdsPacePanel } from '@/components/ads/AdsPacePanel';
import { AdAccountNotesTrigger } from '@/components/ads/AdAccountNotesTrigger';
import { AdBudgetEditor } from '@/components/ads/AdBudgetEditor';
import { useAdAccountNotesRealtime } from '@/hooks/useAdAccountNotes';
import { budgetWindowFor, computeBudgetPace, dateInRange, resolveStoredBudget, type BudgetMode } from '@/utils/adBudgetWindow';
import { CampaignPerformanceList, type CampaignMetricRow } from '@/components/ads/CampaignPerformanceList';
import { RoasValue } from '@/components/ads/RoasValue';
import { useAdsLastSync } from '@/hooks/useAdsLastSync';
import { repairUtf8Mojibake } from '@/utils/repairUtf8Mojibake';

interface MetaCampaignData { campaign_id: string; campaign_name: string; status: string; cost: number; conversions_value?: number; conversions?: number; clicks?: number; impressions?: number; daily_budget?: number; original_client_name?: string; original_client_id?: string; date?: string; client_id?: string; client_name?: string; created_at?: string; }
interface SegmentationRule { id: string; account_id: string; keyword: string; virtual_name: string; platform: string; }
interface ClientPacing { client_id: string; client_name: string; is_group: boolean; budget: number; spent: number; budgetSpent: number; budgetMode: BudgetMode; periodStart: string | null; periodEnd: string | null; currentDailyBudget: number; progress: number; forecast: number; recommendedDaily: number; avgDailySpend: number; status: 'ok' | 'risk' | 'over' | 'under'; remainingBudget: number; total_conversions_val: number; campaigns: MetaCampaignData[]; isHidden: boolean; groupName?: string; isManualGroupBudget?: boolean; isSalesAccount: boolean; realIdsList: { id: string, name: string }[]; globalRoas: number; }

const formatProjectName = (name: string) => (name || '').replace(/^(Cliente|Client|Cuenta|Account)\s*[-:]?\s*/i, '');
const normalizeId = (id: string) => id ? id.replace(/^act_/, '').trim() : '';
const getStatusConfig = (status: string, t: any) => {
  switch (status) {
    case 'over': return { color: 'bg-red-500', text: t('ads.status.exceeded', 'Excedido'), badgeClass: 'bg-red-100 text-red-700 border-red-200' };
    case 'risk': return { color: 'bg-amber-500', text: t('ads.status.risk', 'En riesgo'), badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'under': return { color: 'bg-blue-500', text: t('ads.status.low', 'Bajo'), badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' };
    default: return { color: 'bg-emerald-500', text: t('ads.status.ok', 'OK'), badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
};

interface ClientSettingsMap {
  [key: string]: {
    budget: number;
    group_name: string;
    is_hidden: boolean;
    is_sales_account: boolean;
    budgetMode: BudgetMode;
    periodStart: string | null;
    periodEnd: string | null;
  };
}

interface RegisteredAccount {
  account_id: string;
  account_name: string;
  platform: string;
  is_active: boolean;
  currency?: string | null;
}

export default function MetaAdsPage() {
  const { t } = useTranslation('app');
  const { currentAgency } = useAgency();
  const { isActive: isAnonymized, anonymizer } = useAnonymizeAds();
  const [rawData, setRawData] = useState<MetaCampaignData[]>([]);
  const [clientSettings, setClientSettings] = useState<ClientSettingsMap>({});
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>([]);
  const { formatMoney, currencySymbolForClient } = useAdsFormatMoney(registeredAccounts);
  const [loading, setLoading] = useState(true);
  const { meta: metaSync, refresh: refreshLastSync } = useAdsLastSync();
  useAdAccountNotesRealtime('meta');
  const metaConnected = Boolean(currentAgency?.meta_ads_access_token);
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [segmentationRules, setSegmentationRules] = useState<SegmentationRule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  /** Si es true, también se listan cuentas con gasto 0 € en el mes. Si es false (defecto), se ocultan. Misma lógica que Google Ads. */
  const [showZeroSpend, setShowZeroSpend] = useState(false);
  const [expandedSubAccounts, setExpandedSubAccounts] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'completed' | 'warning' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [editingClient, setEditingClient] = useState<{ id: string, name: string, group: string, hidden: boolean, isSales: boolean } | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [newRuleAccount, setNewRuleAccount] = useState('');
  const [openNewRuleAccount, setOpenNewRuleAccount] = useState(false);
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleName, setNewRuleName] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!currentAgency?.id) return;
    try {
      const [adsRes, settingsRes, accountsRes, rulesRes] = await Promise.all([
        supabase.from('meta_ads_campaigns').select('*').eq('agency_id', currentAgency.id),
        supabase.from('client_settings').select('*').eq('agency_id', currentAgency.id),
        supabase.from('ad_accounts_config').select('*').eq('platform', 'meta').eq('is_active', true).eq('agency_id', currentAgency.id),
        supabase.from('segmentation_rules').select('*').eq('platform', 'meta').eq('agency_id', currentAgency.id)
      ]);
      const settingsMap: ClientSettingsMap = {};
      settingsRes.data?.forEach((s: { client_id: string; budget_limit?: number; group_name?: string; is_hidden?: boolean; is_sales_account?: boolean; budget_mode?: string | null; budget_period_start?: string | null; budget_period_end?: string | null }) => { settingsMap[s.client_id] = { budget: Number(s.budget_limit) || 0, group_name: s.group_name || '', is_hidden: s.is_hidden || false, is_sales_account: s.is_sales_account !== false, budgetMode: s.budget_mode === 'period' ? 'period' : 'month', periodStart: s.budget_period_start ?? null, periodEnd: s.budget_period_end ?? null }; });
      setRawData((adsRes.data || []).map((row: MetaCampaignData) => ({
        ...row,
        campaign_name: repairUtf8Mojibake(row.campaign_name),
        client_name: repairUtf8Mojibake(row.client_name),
      })));
      setClientSettings(settingsMap);
      setRegisteredAccounts(accountsRes.data || []);
      setSegmentationRules(rulesRes.data || []);
    } catch (error) { console.error('Error fetching data', error); } finally { setLoading(false); }
  }, [currentAgency?.id]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  useRefreshMissingAdCurrencies(
    currentAgency?.id,
    'meta',
    registeredAccounts,
    () => { void fetchData(); },
    !loading,
  );

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const handleStartSync = async () => {
    if (!currentAgency) {
      toast.error(t('common.errorIdentifyingAgency', 'Error: No se ha identificado la agencia actual.'));
      return;
    }
    setIsSyncing(true); setSyncStatus('running'); setSyncLogs([t('ads.dialogs.sync.initMeta', '🚀 Conectando con Meta API...')]); setSyncProgress(0);
    try {
      const { data, error } = await supabase.from('meta_sync_logs').insert({
        status: 'pending',
        logs: ['Iniciando worker...'],
        agency_id: currentAgency?.id
      }).select().single();
      if (error) throw error;
      setCurrentJobId(data.id);

      // Trigger Edge Function
      const { error: funcError } = await supabase.functions.invoke('sync-meta-ads', {
        body: { job_id: data.id, agency_id: currentAgency?.id }
      });

      if (funcError) throw funcError;

    } catch (err: any) { setSyncStatus('error'); setSyncLogs(prev => [...prev, `❌ Error al iniciar: ${err.message}`]); setIsSyncing(false); }
  };

  // Efecto para sincronización resiliente (Realtime + Polling fallback)
  useEffect(() => {
    if (!currentJobId || !isSyncing) return;

    const channel = supabase.channel(`meta-sync-${currentJobId}`);

    const checkStatus = async () => {
      const { data } = await supabase.from('meta_sync_logs').select('*').eq('id', currentJobId).single();
      if (data) handleUpdate(data);
    };

    const handleUpdate = (row: any) => {
      if (row.logs) setSyncLogs(row.logs);

      if (row.status === 'completed' || row.status === 'warning') {
        setSyncStatus(row.status);
        setSyncProgress(100);
        if (row.status === 'warning') {
          toast.warning(t('ads.dialogs.sync.relink', 'No se actualizó ninguna campaña. Vuelve a vincular la cuenta en Integraciones.'));
        } else {
          toast.success(t('ads.dialogs.sync.completed', 'Sincronización completada'));
        }
        fetchData();
        void refreshLastSync();
        cleanup();
        if (row.status === 'completed') setTimeout(() => { setIsSyncing(false); setCurrentJobId(null); }, 2000);
      } else if (row.status === 'error') {
        setSyncStatus('error');
        toast.error(t('ads.dialogs.sync.error', 'Error en el proceso'));
        cleanup();
      }
    };

    // 1. Suscripción Realtime
    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meta_sync_logs', filter: `id=eq.${currentJobId}` }, (payload) => handleUpdate(payload.new))
      .subscribe();

    // 2. Polling Loop
    const intervalId = setInterval(checkStatus, 2000);

    const cleanup = () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };

    return () => cleanup();
  }, [currentJobId, isSyncing, fetchData, refreshLastSync, t]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [syncLogs, isSyncing]);

  const handleAddRule = async () => {
    if (!newRuleAccount || !newRuleKeyword || !newRuleName) { toast.error(t('common.fillRequiredFields', 'Rellena todos los campos')); return; }
    if (!currentAgency?.id) { toast.error("No hay agencia seleccionada"); return; }
    const { data, error } = await supabase.from('segmentation_rules').insert({ platform: 'meta', account_id: newRuleAccount, keyword: newRuleKeyword, virtual_name: newRuleName, agency_id: currentAgency.id }).select();
    if (error) toast.error("Error: " + error.message);
    else { setSegmentationRules(prev => [...prev, ...(data || [])]); setNewRuleKeyword(''); setNewRuleName(''); toast.success(t('common.saved', 'Regla guardada')); }
  };

  const handleDeleteRule = async (id: string) => {
    const { error } = await supabase.from('segmentation_rules').delete().eq('id', id);
    if (error) toast.error("Error: " + error.message);
    else { setSegmentationRules(prev => prev.filter(r => r.id !== id)); toast.info("Regla eliminada"); }
  };

  const handleSaveBudget = async (clientId: string, next: { amount: number; mode: BudgetMode; periodStart: string | null; periodEnd: string | null }) => {
    if (!currentAgency?.id) return;
    setClientSettings(prev => ({
      ...prev,
      [clientId]: {
        budget: next.amount,
        group_name: prev[clientId]?.group_name || '',
        is_hidden: prev[clientId]?.is_hidden || false,
        is_sales_account: prev[clientId]?.is_sales_account !== false,
        budgetMode: next.mode,
        periodStart: next.periodStart,
        periodEnd: next.periodEnd,
      },
    }));
    const { error } = await supabase.from('client_settings').upsert({
      client_id: clientId,
      budget_limit: next.amount,
      budget_mode: next.mode,
      budget_period_start: next.mode === 'period' ? next.periodStart : null,
      budget_period_end: next.mode === 'period' ? next.periodEnd : null,
      agency_id: currentAgency.id,
    }, { onConflict: 'client_id' });
    if (error) toast.error(t('common.errorSaving', "Error guardando")); else fetchData();
  };

  const handleSaveClientSettings = async () => {
    if (!editingClient || !currentAgency?.id) return;
    await supabase.from('client_settings').upsert({ client_id: editingClient.id, group_name: editingClient.group, is_hidden: editingClient.hidden, is_sales_account: editingClient.isSales, agency_id: currentAgency.id }, { onConflict: 'client_id' });
    setEditingClient(null); fetchData(); toast.success(t('common.saved', 'Guardado'));
  };

  const reportData = useMemo(() => {
    if (!rawData.length) return [];
    const now = new Date();
    const monthWindow = budgetWindowFor({ mode: 'month' }, now);
    const emptySettings = { budget: 0, group_name: '', is_hidden: false, is_sales_account: true, budgetMode: 'month' as const, periodStart: null, periodEnd: null };
    const stats = new Map<string, { name: string, spent: number, budgetSpent: number, budget: number, total_conversions_val: number, is_group: boolean, isHidden: boolean, isSalesAccount: boolean, realIds: string[], realIdsNames: { id: string, name: string }[], campaigns: MetaCampaignData[], isManualGroupBudget: boolean, dailySum: number }>();

    registeredAccounts.forEach(acc => {
      const settings = clientSettings[acc.account_id] || emptySettings;
      const groupKey = settings.group_name?.trim() ? `GROUP-${settings.group_name}` : acc.account_id;
      if (!settings.group_name?.trim() && !stats.has(groupKey)) {
        stats.set(groupKey, { name: acc.account_name || acc.account_id, spent: 0, budgetSpent: 0, budget: settings.budget || 0, total_conversions_val: 0, is_group: false, isHidden: settings.is_hidden, isSalesAccount: settings.is_sales_account !== false, realIds: [acc.account_id], realIdsNames: [{ id: acc.account_id, name: acc.account_name }], campaigns: [], isManualGroupBudget: false, dailySum: 0 });
      }
    });

    rawData.forEach(row => {
      if (!row.date) return;
      const rowDate = row.date.slice(0, 10);
      let finalId = row.client_id, finalName = row.client_name || row.client_id;
      const rulesForAccount = segmentationRules.filter(r => normalizeId(r.account_id) === normalizeId(row.client_id));
      if (rulesForAccount.length > 0) { const match = rulesForAccount.find(r => row.campaign_name.toLowerCase().includes(r.keyword.toLowerCase())); if (match) { finalId = `${row.client_id}_${match.keyword.toUpperCase()}`; finalName = match.virtual_name; } }
      const settings = clientSettings[finalId] || emptySettings;
      const groupKey = settings.group_name?.trim() ? `GROUP-${settings.group_name}` : finalId;
      const budgetSettings = resolveStoredBudget(groupKey, [finalId], clientSettings);
      const window = budgetWindowFor({ mode: budgetSettings.budgetMode, periodStart: budgetSettings.periodStart, periodEnd: budgetSettings.periodEnd }, now);
      const inMonth = dateInRange(rowDate, monthWindow.start, monthWindow.end);
      const inBudget = dateInRange(rowDate, window.start, window.end);
      if (!inMonth && !inBudget) return;
      const displayName = settings.group_name?.trim() ? settings.group_name : finalName;
      const isGroupManual = groupKey.startsWith('GROUP-') && (clientSettings[groupKey]?.budget > 0);
      const isIndividualManual = !groupKey.startsWith('GROUP-') && settings.budget > 0;
      if (!stats.has(groupKey)) { stats.set(groupKey, { name: displayName, spent: 0, budgetSpent: 0, budget: 0, total_conversions_val: 0, is_group: groupKey.startsWith('GROUP-'), isHidden: settings.is_hidden, isSalesAccount: settings.is_sales_account !== false, realIds: [], realIdsNames: [], campaigns: [], isManualGroupBudget: isGroupManual, dailySum: 0 }); }
      const entry = stats.get(groupKey)!;
      const rowCost = Number(row.cost || 0);
      if (inBudget) entry.budgetSpent += rowCost;
      if (!inMonth) return;
      entry.spent += rowCost; entry.total_conversions_val += Number(row.conversions_value || 0);
      if (!entry.realIds.includes(finalId)) { entry.realIds.push(finalId); entry.realIdsNames.push({ id: finalId, name: finalName }); if (!entry.is_group && isIndividualManual) entry.budget = settings.budget; }
      if (row.status === 'ACTIVE' && Number(row.daily_budget) > 0) entry.dailySum += Number(row.daily_budget) || 0;
      if (rowCost > 0 || Number(row.impressions) > 0 || row.status === 'ACTIVE' || row.status === 'PAUSED') {
        entry.campaigns.push({ ...row, original_client_name: finalName, original_client_id: finalId, cost: Number(row.cost), conversions_value: Number(row.conversions_value), conversions: Number(row.conversions), clicks: Number(row.clicks), impressions: Number(row.impressions) });
      }
    });

    const report: ClientPacing[] = [];
    stats.forEach((value, key) => {
      const spent = value.spent;
      const budgetSettings = resolveStoredBudget(key, value.realIds, clientSettings);
      const finalBudget = budgetSettings.budget;
      const window = budgetWindowFor({ mode: budgetSettings.budgetMode, periodStart: budgetSettings.periodStart, periodEnd: budgetSettings.periodEnd }, now);
      const pace = computeBudgetPace({ spent: value.budgetSpent, amount: finalBudget, window, currentDailyBudget: value.dailySum });
      const globalRoas = spent > 0 ? value.total_conversions_val / spent : 0;
      const status = finalBudget > 0 ? pace.status : 'ok';
      report.push({ client_id: key, client_name: value.name, is_group: value.is_group, budget: finalBudget, spent, budgetSpent: value.budgetSpent, budgetMode: window.mode, periodStart: window.mode === 'period' ? budgetSettings.periodStart : null, periodEnd: window.mode === 'period' ? budgetSettings.periodEnd : null, currentDailyBudget: value.dailySum, progress: pace.progress, forecast: pace.forecast, recommendedDaily: pace.recommendedDaily, avgDailySpend: pace.avgDaily, status, remainingBudget: pace.remaining, total_conversions_val: value.total_conversions_val, isHidden: value.isHidden, isSalesAccount: value.isSalesAccount, groupName: value.is_group ? value.name : undefined, isManualGroupBudget: value.isManualGroupBudget, realIdsList: value.realIdsNames, campaigns: value.campaigns.sort((a, b) => b.cost - a.cost), globalRoas });
    });
    let filtered = report;
    if (!showHidden) filtered = filtered.filter(c => !c.isHidden);
    if (!showZeroSpend) {
      filtered = filtered.filter(c =>
        c.spent > 0 || c.budgetSpent > 0 || c.campaigns.some(camp => camp.status === 'ACTIVE' || camp.status === 'PAUSED')
      );
    }
    if (searchTerm) { const lower = searchTerm.toLowerCase(); filtered = filtered.filter(c => c.client_name.toLowerCase().includes(lower) || c.campaigns.some(camp => camp.campaign_name.toLowerCase().includes(lower))); }
    return filtered.sort((a, b) => b.spent - a.spent);
  }, [rawData, clientSettings, registeredAccounts, searchTerm, showHidden, showZeroSpend, segmentationRules]);

  const attentionCount = reportData.filter((row) => row.budget > 0 && (row.status === 'risk' || row.status === 'over')).length;
  const listedAccounts = attentionOnly
    ? reportData.filter((row) => row.budget > 0 && (row.status === 'risk' || row.status === 'over'))
    : reportData;

  const uniqueAccountsForSelector = useMemo(() => {
    const unique = new Map();
    rawData.forEach(r => unique.set(r.client_id, r.client_name));
    registeredAccounts.forEach(acc => unique.set(acc.account_id, acc.account_name));
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [rawData, registeredAccounts]);

  return (
    <div className="mx-auto max-w-[90rem] space-y-4 p-4 pb-20 sm:p-6">
      <AdsPageHeader
        title={t('ads.meta', 'Meta Ads')}
        sync={metaSync}
        connected={metaConnected}
        accountCount={reportData.length}
        attentionCount={attentionCount}
        attentionOnly={attentionOnly}
        onAttentionOnly={setAttentionOnly}
        onSync={handleStartSync}
        syncing={isSyncing}
        onSplit={() => setIsSplitModalOpen(true)}
        search={searchTerm}
        onSearch={setSearchTerm}
        showHidden={showHidden}
        onShowHidden={setShowHidden}
        showZero={showZeroSpend}
        onShowZero={setShowZeroSpend}
      />

      <div className="space-y-3">
        <Accordion type="single" collapsible className="space-y-3">
          {listedAccounts.map((client) => {
            const statusConfig = getStatusConfig(client.status, t);
            const dailyDiff = client.currentDailyBudget - client.recommendedDaily;
            const isOverspending = client.currentDailyBudget > 0 && dailyDiff > 0 && client.status !== 'ok';
            const dailyShown = client.currentDailyBudget > 0 ? client.currentDailyBudget : client.avgDailySpend;
            const visibleName = isAnonymized ? anonymizer.account(client.client_id) : formatProjectName(client.client_name);
            const statusLabel = client.budget <= 0
              ? undefined
              : client.status === 'ok'
                ? t('ads.header.onTrack', 'En ritmo')
                : client.status === 'under'
                  ? t('ads.header.underPace', 'Va por debajo')
                  : statusConfig.text;
            return (
              <AccordionItem key={client.client_id} value={client.client_id} className={adsAccountCardClass(client.isHidden, client.status, client.budget > 0)}>
                <AccordionTrigger className="px-4 py-4 text-slate-500 hover:bg-slate-50/80 hover:no-underline data-[state=open]:bg-white [&>svg]:ml-1 [&>svg]:h-8 [&>svg]:w-8 [&>svg]:rounded-full [&>svg]:bg-slate-100 [&>svg]:p-1.5 [&>svg]:text-slate-500">
                  <AdsAccountRow
                    mark={visibleName}
                    seed={client.client_id}
                    name={(
                      <AnonymizedContent isActive={isAnonymized} className="font-semibold" asBlock placeholder={anonymizer.account(client.client_id)}>
                        {formatProjectName(client.client_name)}
                      </AnonymizedContent>
                    )}
                    status={client.budget > 0 ? client.status : undefined}
                    statusLabel={statusLabel}
                    detail={(
                      <>
                        {isAnonymized && (client.realIdsList[0]?.id || client.client_id) && (
                          <span className="font-mono text-[11px] text-slate-400">{client.realIdsList[0]?.id || client.client_id}</span>
                        )}
                        {client.is_group && (
                          <span className="inline-flex items-center gap-1">
                            <Layers className="h-3 w-3" /> {t('ads.table.groupAccounts', 'Cuentas del grupo')}
                          </span>
                        )}
                        <RoasValue plain isSales={client.isSalesAccount} cost={client.spent} conversionValue={client.total_conversions_val} />
                        {client.isHidden && (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <EyeOff className="h-3 w-3" /> {t('ads.status.hidden', 'Oculto')}
                          </span>
                        )}
                      </>
                    )}
                    progress={client.budget > 0 ? {
                      percent: client.progress,
                      caption: client.remainingBudget > 0
                        ? t('ads.header.paceLine', {
                          percent: Math.round(client.progress),
                          amount: formatMoney(client.remainingBudget, client.client_id),
                          defaultValue: `${Math.round(client.progress)}% del presupuesto · quedan ${formatMoney(client.remainingBudget, client.client_id)}`,
                        })
                        : t('ads.header.paceOver', {
                          percent: Math.round(client.progress),
                          defaultValue: `${Math.round(client.progress)}% del presupuesto`,
                        }),
                    } : null}
                    spentCaption={t('ads.header.thisMonth', 'Este mes')}
                    spent={formatMoney(client.spent, client.client_id)}
                    budgetLine={client.budget > 0
                      ? t('ads.header.ofBudget', { amount: formatMoney(client.budget, client.client_id), defaultValue: `de ${formatMoney(client.budget, client.client_id)}` })
                      : t('ads.header.noBudget', 'Sin presupuesto')}
                    valueCaption={client.isSalesAccount && client.total_conversions_val > 0 ? t('ads.stats.revenue', 'Valor') : undefined}
                    value={client.isSalesAccount && client.total_conversions_val > 0 ? formatMoney(client.total_conversions_val, client.client_id) : undefined}
                    actions={(
                      <>
                        {!client.is_group && (
                          <AdAccountNotesTrigger platform="meta" accountId={client.client_id} anonymized={isAnonymized} />
                        )}
                        <AdsIconButton
                          label={t('ads.actions.edit', 'Configurar')}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!client.is_group) {
                              setEditingClient({
                                id: client.client_id,
                                name: client.client_name,
                                group: clientSettings[client.client_id]?.group_name || '',
                                hidden: clientSettings[client.client_id]?.is_hidden || false,
                                isSales: clientSettings[client.client_id]?.is_sales_account !== false,
                              });
                            } else {
                              toast.info("Abre el grupo para editar");
                            }
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </AdsIconButton>
                      </>
                    )}
                  />
                </AccordionTrigger>
                <AccordionContent className="border-t border-slate-100 bg-slate-50/70 p-0">
                  <div className="grid items-start gap-6 px-4 py-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-5">
                    <AdsPacePanel
                      title={client.budgetMode === 'period'
                        ? t('ads.pacing.periodBudget', 'Presupuesto del periodo')
                        : t('ads.pacing.monthlyBudget', { type: client.is_group ? t('ads.status.total', 'Total') : t('ads.status.monthly', 'Mensual'), defaultValue: `Presupuesto ${client.is_group ? 'Total' : 'Mensual'}` })}
                      editor={(
                        <AdBudgetEditor
                          key={`${client.client_id}-${client.budget}-${client.budgetMode}-${client.periodStart ?? ''}-${client.periodEnd ?? ''}`}
                          amount={client.budget || 0}
                          mode={client.budgetMode}
                          periodStart={client.periodStart}
                          periodEnd={client.periodEnd}
                          currencySymbol={currencySymbolForClient(client.client_id, client.realIdsList.map((r) => r.id))}
                          onCommit={(next) => { void handleSaveBudget(client.client_id, next); }}
                        />
                      )}
                      note={(
                        <>
                          {client.budget <= 0 && t('ads.pacing.setTargetHintMeta', 'Escribe el presupuesto del mes para ver el ritmo. Meta no trae un objetivo mensual: lo defines aquí.')}
                          {client.budget > 0 && client.budgetMode === 'period' && (
                            <>
                              {t('ads.pacing.periodSpent', { amount: formatMoney(client.budgetSpent, client.client_id), defaultValue: `Gastado en el periodo: ${formatMoney(client.budgetSpent, client.client_id)}` })}
                              {' · '}
                              {t('ads.pacing.monthSpent', { amount: formatMoney(client.spent, client.client_id), defaultValue: `Este mes: ${formatMoney(client.spent, client.client_id)}` })}
                            </>
                          )}
                          {client.budget > 0 && (
                            <p className="mt-2">
                              <Trans i18nKey="ads.pacing.metaNote" t={t} components={{ strong: <strong className="font-medium text-slate-600" /> }} />
                            </p>
                          )}
                        </>
                      )}
                      progress={client.budget > 0 ? {
                        percent: client.progress,
                        status: client.status,
                        available: t('ads.pacing.available', { amount: formatMoney(client.remainingBudget, client.client_id), defaultValue: `Disponible: ${formatMoney(client.remainingBudget, client.client_id)}` }),
                        danger: client.remainingBudget <= 0,
                      } : null}
                      metrics={client.budget > 0 ? [
                        {
                          label: client.currentDailyBudget > 0
                            ? t('ads.pacing.metaDailyInfo', 'Límite diario en Meta')
                            : t('ads.pacing.avgDaily', 'Gasto medio diario'),
                          value: formatMoney(dailyShown, client.client_id),
                          hint: client.currentDailyBudget > 0
                            ? t('ads.pacing.metaDailySub', 'campañas activas en Meta')
                            : client.budgetMode === 'period'
                              ? t('ads.pacing.avgDailySubPeriod', 'ritmo del periodo, Meta no ha devuelto un diario')
                              : t('ads.pacing.avgDailySubMeta', 'ritmo del mes, Meta no ha devuelto un diario'),
                          tone: isOverspending ? 'warn' : 'default',
                        },
                        {
                          label: t('ads.pacing.recommendedDaily', 'Objetivo medio diario'),
                          value: formatMoney(client.recommendedDaily, client.client_id),
                          hint: client.budgetMode === 'period'
                            ? t('ads.pacing.recommendedDailySubPeriod', 'para cerrar el periodo en el presupuesto')
                            : t('ads.pacing.recommendedDailySub', 'para cerrar el mes en el presupuesto'),
                        },
                      ] : client.currentDailyBudget > 0 ? [
                        {
                          label: t('ads.pacing.metaDailyInfo', 'Límite diario en Meta'),
                          value: formatMoney(client.currentDailyBudget, client.client_id),
                        },
                      ] : []}
                      warning={client.budget > 0 && isOverspending && dailyDiff > 1
                        ? t('ads.pacing.paceWarningMeta', 'El límite diario de las campañas activas en Meta supera el ritmo para cerrar el presupuesto. Revísalo en el administrador de anuncios.')
                        : null}
                      forecast={{
                        label: client.budgetMode === 'period'
                          ? t('ads.pacing.forecastTitlePeriod', 'Proyección fin de periodo')
                          : t('ads.pacing.forecastTitle', 'Proyección fin de mes'),
                        value: formatMoney(client.forecast, client.client_id),
                        danger: client.budget > 0 && client.forecast > client.budget,
                      }}
                    />
                    <div className="min-w-0 space-y-4">
                      <CampaignPerformanceList
                        isSales={client.isSalesAccount}
                        formatMoney={(amount) => formatMoney(amount, client.client_id)}
                        rows={client.campaigns.map((camp, idx): CampaignMetricRow => ({
                          key: `${camp.campaign_id}-${camp.date || idx}`,
                          name: (
                            <AnonymizedContent isActive={isAnonymized} className="font-medium text-slate-800" placeholder={anonymizer.campaign(camp.campaign_id)}>
                              {camp.campaign_name}
                            </AnonymizedContent>
                          ),
                          status: camp.status,
                          cost: Number(camp.cost) || 0,
                          clicks: Number(camp.clicks) || 0,
                          impressions: Number(camp.impressions) || 0,
                          conversions: Number(camp.conversions) || 0,
                          conversionValue: Number(camp.conversions_value) || 0,
                          dailyBudget: Number(camp.daily_budget) > 0 ? formatMoney(Number(camp.daily_budget), client.client_id) : undefined,
                          subtitle: client.is_group && (camp.original_client_name || camp.original_client_id) ? (
                            <AnonymizedContent isActive={isAnonymized} className="truncate max-w-[140px]" placeholder={anonymizer.account(camp.original_client_id || camp.client_id || '')}>
                              | {formatProjectName(camp.original_client_name || '')}
                            </AnonymizedContent>
                          ) : undefined,
                        }))}
                      />

                    {client.is_group && (
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <h3 className="text-[13px] font-medium text-slate-900">{t('ads.table.groupAccounts', 'Cuentas del grupo')}</h3>
                          <span className="text-[12px] tabular-nums text-slate-500">{client.realIdsList.length}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[13px]">
                            <thead className="border-b border-slate-100 text-[11px] font-medium text-slate-400">
                              <tr>
                                <th className="px-3 py-2 text-left w-6"></th>
                                <th className="px-3 py-2 text-left">{t('ads.table.account', 'Cuenta')}</th>
                                <th className="px-2 py-2 text-right">{t('ads.table.spent', 'Gasto')}</th>
                                <th className="px-2 py-2 text-right">{t('ads.table.groupPct', '% Grupo')}</th>
                                <th className="px-2 py-2 text-right">{t('ads.table.conv', 'Conv')}</th>
                                <th className="px-2 py-2 text-center">{t('ads.table.roas', 'ROAS')}</th>
                                <th className="px-2 py-2 text-center" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {client.realIdsList.map(sub => {
                                const subCampaigns = client.campaigns.filter(c => c.original_client_id === sub.id || c.client_id === sub.id);
                                const subSpent = subCampaigns.reduce((a, c) => a + c.cost, 0);
                                const subConv = subCampaigns.reduce((a, c) => a + (c.conversions || 0), 0);
                                const subValue = subCampaigns.reduce((a, c) => a + (c.conversions_value || 0), 0);
                                const pctOfGroup = client.spent > 0 ? (subSpent / client.spent) * 100 : 0;

                                const isExpanded = expandedSubAccounts[sub.id];

                                return (
                                  <Fragment key={sub.id}>
                                    <tr className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={() => setExpandedSubAccounts(prev => ({ ...prev, [sub.id]: !prev[sub.id] }))}>
                                      <td className="px-3 py-3 text-slate-400">
                                        <ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} />
                                      </td>
                                      <td className="px-3 py-2.5 font-medium text-slate-700">
                                        <div>
                                          <AnonymizedContent isActive={isAnonymized} placeholder={anonymizer.account(sub.id)}>{formatProjectName(sub.name)}</AnonymizedContent>
                                          {isAnonymized && <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {sub.id}</div>}
                                        </div>
                                      </td>
                                      <td className="px-2 py-2.5 text-right font-medium text-slate-900">{formatMoney(subSpent, sub.id)}</td>
                                      <td className="px-2 py-2.5 text-right text-slate-500">{pctOfGroup.toFixed(1)}%</td>
                                      <td className="px-2 py-2.5 text-right text-emerald-600">{subConv.toFixed(0)}</td>
                                      <td className="px-2 py-2.5 text-center"><RoasValue isSales={client.isSalesAccount} cost={subSpent} conversionValue={subValue} /></td>
                                      <td className="px-2 py-2.5 text-center">
                                        <div className="inline-flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                          <AdAccountNotesTrigger platform="meta" accountId={sub.id} anonymized={isAnonymized} />
                                          <AdsIconButton
                                            label={t('ads.actions.edit', 'Configurar')}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              setEditingClient({ id: sub.id, name: sub.name, group: client.groupName || '', hidden: false, isSales: true });
                                            }}
                                          >
                                            <Settings className="h-4 w-4" />
                                          </AdsIconButton>
                                        </div>
                                      </td>
                                    </tr>
                                    {isExpanded && (
                                      <tr className="bg-slate-50">
                                        <td colSpan={7} className="p-3">
                                          <CampaignPerformanceList
                                            isSales={client.isSalesAccount}
                                            formatMoney={(amount) => formatMoney(amount, sub.id)}
                                            rows={[...subCampaigns].sort((a, b) => b.cost - a.cost).map((camp, idx): CampaignMetricRow => ({
                                              key: `${camp.campaign_id}-${idx}`,
                                              name: (
                                                <AnonymizedContent isActive={isAnonymized} placeholder={anonymizer.campaign(camp.campaign_id)}>
                                                  {camp.campaign_name}
                                                </AnonymizedContent>
                                              ),
                                              status: camp.status,
                                              cost: Number(camp.cost) || 0,
                                              clicks: Number(camp.clicks) || 0,
                                              impressions: Number(camp.impressions) || 0,
                                              conversions: Number(camp.conversions) || 0,
                                              conversionValue: Number(camp.conversions_value) || 0,
                                            }))}
                                          />
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        {attentionOnly && listedAccounts.length === 0 && reportData.length > 0 && (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
            {t('ads.header.reviewEmpty', 'Ninguna cuenta por revisar con los filtros actuales.')}
          </p>
        )}

        {reportData.length === 0 && !loading && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-16 text-center">
            <Facebook className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-3 text-sm font-medium text-slate-800">{t('ads.status.noData', 'Sin datos')}</h3>
            <p className="mt-1 text-sm text-slate-500">{t('ads.status.syncPrompt', 'Sincroniza para cargar cuentas')}</p>
          </div>
        )}
      </div>

      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('ads.dialogs.configAccount.title', 'Configurar cuenta')}</DialogTitle>
            <DialogDescription>{editingClient?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('ads.dialogs.configAccount.groupName', 'Nombre del grupo (Holding)')}</Label>
              <Input
                value={editingClient?.group || ''}
                onChange={(e) => setEditingClient(prev => prev ? { ...prev, group: e.target.value } : null)}
                placeholder={t('ads.dialogs.configAccount.groupPlaceholder', 'Ej: Grupo ABC')}
              />
              <p className="text-xs text-slate-500">{t('ads.dialogs.configAccount.groupNoteShort', 'Las cuentas del mismo grupo se consolidan.')}</p>
            </div>
            <div className="flex justify-between items-center py-3 border-t">
              <div>
                <Label>{t('ads.dialogs.configAccount.salesAccount', 'Cuenta de ventas (ROAS)')}</Label>
                <p className="text-xs text-slate-500">{t('ads.dialogs.configAccount.salesAccountNoteShort', 'Mostrar conversiones')}</p>
              </div>
              <Switch checked={editingClient?.isSales !== false} onCheckedChange={(c) => setEditingClient(prev => prev ? { ...prev, isSales: c } : null)} />
            </div>
            <div className="flex justify-between items-center py-3 border-t">
              <div>
                <Label>{t('ads.dialogs.configAccount.hideAccount', 'Ocultar cuenta')}</Label>
                <p className="text-xs text-slate-500">{t('ads.dialogs.configAccount.hideAccountNoteShort', 'No aparecerá en la lista')}</p>
              </div>
              <Switch checked={editingClient?.hidden || false} onCheckedChange={(c) => setEditingClient(prev => prev ? { ...prev, hidden: c } : null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>{t('ads.actions.cancel', 'Cancelar')}</Button>
            <Button onClick={handleSaveClientSettings}>{t('ads.actions.save', 'Guardar')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSplitModalOpen} onOpenChange={setIsSplitModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" /> {t('ads.dialogs.splitAccounts.title', 'Dividir Cuentas')}
            </DialogTitle>
            <DialogDescription>{t('ads.dialogs.splitAccounts.descriptionShort', 'Separa campañas por palabra clave en cuentas virtuales.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-lg border">
              <div className="col-span-12 sm:col-span-4 space-y-1">
                <Label className="text-xs font-medium">{t('ads.dialogs.splitAccounts.sourceAccount', 'Cuenta Origen')}</Label>
                <Popover open={openNewRuleAccount} onOpenChange={setOpenNewRuleAccount}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal bg-white">
                      <span className="truncate">{newRuleAccount ? (uniqueAccountsForSelector.find(a => a.id === newRuleAccount)?.name || uniqueAccountsForSelector.find(a => a.id === newRuleAccount)?.id || t('ads.dialogs.splitAccounts.selectAccount', 'Selecciona...')) : t('ads.dialogs.splitAccounts.selectAccount', 'Selecciona...')}</span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t('ads.filters.searchPlaceholder', 'Buscar cuenta o ID...')} className="h-9" />
                      <CommandList className="max-h-[280px]">
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">{t('common.noResults', 'Ninguna cuenta coincide.')}</CommandEmpty>
                        <CommandGroup>
                          {uniqueAccountsForSelector.map((acc) => (
                            <CommandItem
                              key={acc.id}
                              value={`${acc.name || ''} ${acc.id}`}
                              onSelect={() => {
                                setNewRuleAccount(acc.id);
                                setOpenNewRuleAccount(false);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', newRuleAccount === acc.id ? 'opacity-100' : 'opacity-0')} />
                              <span className="truncate">{acc.name || acc.id}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="col-span-6 sm:col-span-3 space-y-1">
                <Label className="text-xs font-medium">{t('ads.dialogs.splitAccounts.ifContains', 'Si contiene...')}</Label>
                <Input placeholder="Ej: Loro" className="bg-white" value={newRuleKeyword} onChange={e => setNewRuleKeyword(e.target.value)} />
              </div>
              <div className="col-span-6 sm:col-span-3 space-y-1">
                <Label className="text-xs font-medium">{t('ads.dialogs.splitAccounts.createAccount', 'Crear cuenta...')}</Label>
                <Input placeholder="Ej: Loro Parque" className="bg-white" value={newRuleName} onChange={e => setNewRuleName(e.target.value)} />
              </div>
              <div className="col-span-12 sm:col-span-2">
                <Button onClick={handleAddRule} className="w-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase">{t('ads.dialogs.splitAccounts.activeRules', { count: segmentationRules.length, defaultValue: `Reglas Activas (${segmentationRules.length})` })}</h4>
              {segmentationRules.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-4 text-center">{t('ads.dialogs.splitAccounts.noRules', 'No hay reglas')}</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {segmentationRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">{normalizeId(rule.account_id).slice(0, 10)}...</Badge>
                        <span className="text-sm text-slate-500">
                          {t('ads.dialogs.splitAccounts.ifContainsLabel', { keyword: rule.keyword, defaultValue: `Si contiene "${rule.keyword}"` })}
                        </span>
                        <span className="text-slate-300">→</span>
                        <span className="font-bold text-blue-600">{rule.virtual_name}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="text-red-500 hover:bg-red-50 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSyncing} onOpenChange={(open) => { if (syncStatus !== 'running') setIsSyncing(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {syncStatus === 'running' && <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />}
              {syncStatus === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {syncStatus === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
              {t('ads.dialogs.sync.title', { platform: 'Meta Ads' })}
            </DialogTitle>
            <DialogDescription>
              {syncStatus === 'running'
                ? t('ads.dialogs.sync.connecting', 'Conectando...')
                : syncStatus === 'warning'
                  ? t('ads.dialogs.sync.relink', 'No se actualizó ninguna campaña. Vuelve a vincular la cuenta en Integraciones.')
                  : t('ads.dialogs.sync.finished', 'Finalizado')}
            </DialogDescription>
          </DialogHeader>
          <Progress value={syncProgress} className="h-1" />
          <div className="h-64 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <div className="h-full space-y-1 overflow-y-auto p-3 font-mono text-[12px] leading-5 text-slate-700" ref={scrollRef}>
              {syncLogs.map((log, i) => <div key={i} className="break-words">{log}</div>)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
