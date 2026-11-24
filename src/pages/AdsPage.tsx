import { Fragment, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgency } from '@/contexts/AgencyContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { INPUT_LIMITS } from '@/constants/inputLimits';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  RefreshCw, Settings, Layers,
  TrendingUp, TrendingDown, Scissors, Plus, Trash2,
  AlertTriangle, CheckCircle2,
  EyeOff, X, Check, ChevronDown, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAdsFormatMoney } from '@/hooks/useAdsFormatMoney';
import { useRefreshMissingAdCurrencies } from '@/hooks/useRefreshMissingAdCurrencies';
import { addCampaignDailyBudget, countSharedBudgetCampaigns, getCampaignDisplayDailyBudget, isSharedPortfolioBudget } from '@/utils/adsBudgetUtils';
import { repairUtf8Mojibake } from '@/utils/repairUtf8Mojibake';
import { CampaignPerformanceList, type CampaignMetricRow } from '@/components/ads/CampaignPerformanceList';
import { RoasValue } from '@/components/ads/RoasValue';
import { toast } from '@/lib/notify';
import { useAnonymizeAds } from '@/hooks/useAnonymizeAds';
import { AnonymizedContent } from '@/components/ads/AnonymizedContent';
import { AdsPageHeader } from '@/components/ads/AdsPageHeader';
import { AdsAccountRow, AdsIconButton } from '@/components/ads/AdsAccountRow';
import { AdsPacePanel } from '@/components/ads/AdsPacePanel';
import { AdAccountNotesTrigger } from '@/components/ads/AdAccountNotesTrigger';
import { AdBudgetEditor } from '@/components/ads/AdBudgetEditor';
import { useAdAccountNotesRealtime } from '@/hooks/useAdAccountNotes';
import { budgetWindowFor, computeBudgetPace, dateInRange, resolveStoredBudget, type BudgetMode } from '@/utils/adBudgetWindow';
import { useAdsLastSync } from '@/hooks/useAdsLastSync';

const GoogleIcon = () => (
  <svg className="mx-auto h-8 w-8 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
  </svg>
);

// --- TIPOS ---
interface CampaignData {
  campaign_id: string;
  campaign_name: string;
  status: string;
  cost: number;
  conversions_value?: number;
  conversions?: number;
  daily_budget?: number;
  budget_id?: string | null;
  clicks?: number;
  impressions?: number;
  original_client_name?: string;
  original_client_id?: string;
  client_id: string;
  client_name: string;
  date?: string;
  created_at?: string;
}

interface RegisteredAccount {
  account_id: string;
  account_name: string;
  platform: string;
  is_active: boolean;
  currency?: string | null;
}


interface SegmentationRule {
  id: string;
  account_id: string;
  keyword: string;
  virtual_name: string;
  platform: string;
}

interface ClientPacing {
  client_id: string;
  client_name: string;
  is_group: boolean;
  budget: number;
  spent: number;
  progress: number;
  forecast: number;
  recommendedDaily: number;
  avgDailySpend: number;
  currentDailyBudget: number;
  status: 'ok' | 'risk' | 'over' | 'under';
  remainingBudget: number;
  total_conversions_val: number;
  total_clicks: number;
  total_impressions: number;
  total_conversions: number;
  campaigns: CampaignData[];
  isHidden: boolean;
  groupName?: string;
  isManualGroupBudget?: boolean;
  isSalesAccount: boolean;
  realIdsList: { id: string, name: string }[];
  budgetSpent: number;
  budgetMode: BudgetMode;
  periodStart: string | null;
  periodEnd: string | null;
  globalRoas: number;
  ctr: number;
  cpc: number;
  cpa: number;
}

const formatProjectName = (name: string) => (name || '').replace(/^(Cliente|Client)\s*[-:]?\s*/i, '');
const normalizeId = (id: string) => id ? id.trim() : '';


const getStatusConfig = (status: string, t: any) => {
  switch (status) {
    case 'over': return { color: 'bg-red-500', text: t('ads.status.exceeded', 'Excedido'), icon: AlertTriangle, badgeClass: 'bg-red-100 text-red-700 border-red-200' };
    case 'risk': return { color: 'bg-amber-500', text: t('ads.status.risk', 'En riesgo'), icon: TrendingUp, badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'under': return { color: 'bg-blue-500', text: t('ads.status.low', 'Bajo'), icon: TrendingDown, badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' };
    default: return { color: 'bg-emerald-500', text: t('ads.status.ok', 'OK'), icon: CheckCircle2, badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
};

export default function AdsPage() {
  const { t } = useTranslation('app');
  const { currentAgency } = useAgency();
  const { isActive: isAnonymized, anonymizer } = useAnonymizeAds();
  const [rawData, setRawData] = useState<CampaignData[]>([]);
  const [clientSettings, setClientSettings] = useState<Record<string, { budget: number; group_name: string; is_hidden: boolean; is_sales_account: boolean; budgetMode: BudgetMode; periodStart: string | null; periodEnd: string | null }>>({});
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>([]);
  const { formatMoney, currencySymbolForClient } = useAdsFormatMoney(registeredAccounts);
  const [loading, setLoading] = useState(true);
  const { google: googleSync, refresh: refreshLastSync } = useAdsLastSync();
  useAdAccountNotesRealtime('google');
  const googleConnected = Boolean(currentAgency?.google_ads_refresh_token);
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [segmentationRules, setSegmentationRules] = useState<SegmentationRule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [showZeroSpend, setShowZeroSpend] = useState(false);
  const [expandedSubAccounts, setExpandedSubAccounts] = useState<Record<string, boolean>>({});

  // Modales
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'completed' | 'warning' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [editingClient, setEditingClient] = useState<{ id: string, name: string, group: string, hidden: boolean, isSales: boolean } | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [openRuleAccount, setOpenRuleAccount] = useState(false);

  // Formulario nueva regla
  const ruleFormSchema = z.object({
    account: z.string().min(1, t('ads.dialogs.splitAccounts.selectAccount', 'Debes seleccionar una cuenta')),
    keyword: z.string().min(1, t('ads.dialogs.splitAccounts.ifContains', 'La palabra clave es obligatoria')).max(INPUT_LIMITS.keyword),
    name: z.string().min(1, t('ads.dialogs.splitAccounts.createAccount', 'El nombre es obligatorio')).max(INPUT_LIMITS.clientName),
  });

  type RuleFormValues = z.infer<typeof ruleFormSchema>;

  const ruleForm = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      account: '',
      keyword: '',
      name: '',
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const daysInMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentAgency?.id) return;

    try {
      const [adsRes, settingsRes, accountsRes, rulesRes] = await Promise.all([
        supabase.from('google_ads_campaigns').select('*').eq('agency_id', currentAgency.id),
        supabase.from('client_settings').select('*').eq('agency_id', currentAgency.id),
        supabase.from('ad_accounts_config').select('*').eq('platform', 'google').eq('is_active', true).eq('agency_id', currentAgency.id),
        supabase.from('segmentation_rules').select('*').eq('platform', 'google').eq('agency_id', currentAgency.id)
      ]);

      const settingsMap: Record<string, { budget: number; group_name: string; is_hidden: boolean; is_sales_account: boolean; budgetMode: BudgetMode; periodStart: string | null; periodEnd: string | null }> = {};
      settingsRes.data?.forEach((s: { client_id: string; budget_limit?: number; group_name?: string; is_hidden?: boolean; is_sales_account?: boolean; budget_mode?: string | null; budget_period_start?: string | null; budget_period_end?: string | null }) => {
        settingsMap[s.client_id] = {
          budget: Number(s.budget_limit) || 0,
          group_name: s.group_name || '',
          is_hidden: s.is_hidden || false,
          is_sales_account: s.is_sales_account !== false,
          budgetMode: s.budget_mode === 'period' ? 'period' : 'month',
          periodStart: s.budget_period_start ?? null,
          periodEnd: s.budget_period_end ?? null,
        };
      });

      setRawData((adsRes.data || []).map((row: CampaignData) => ({
        ...row,
        campaign_name: repairUtf8Mojibake(row.campaign_name),
        client_name: repairUtf8Mojibake(row.client_name),
      })));
      setClientSettings(settingsMap);
      setRegisteredAccounts(accountsRes.data || []);
      setSegmentationRules(rulesRes.data || []);

    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  }, [currentAgency?.id]);

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial
  }, []);

  useRefreshMissingAdCurrencies(
    currentAgency?.id,
    'google',
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
    setIsSyncing(true);
    setSyncStatus('running');
    setSyncLogs([t('ads.dialogs.sync.initGoogle', '🚀 Iniciando conexión con Google Ads...')]);
    setSyncProgress(0);

    try {
      const { data, error } = await supabase.from('ads_sync_logs').insert({
        status: 'pending',
        logs: ['Esperando worker...'],
        agency_id: currentAgency?.id
      }).select().single();

      if (error) throw error;
      setCurrentJobId(data.id);

      // Trigger Edge Function (Serverless)
      const { error: funcError } = await supabase.functions.invoke('sync-google-ads', {
        body: { job_id: data.id, agency_id: currentAgency?.id }
      });

      if (funcError) throw funcError;

    } catch (err: any) {
      setSyncStatus('error');
      setSyncLogs(prev => [...prev, `❌ Error al iniciar sincronización: ${err.message}`]);
      setIsSyncing(false);
    }
  };

  // Efecto para manejar la sincronización (Realtime + Polling fallback)
  useEffect(() => {
    if (!currentJobId || !isSyncing) return;

    const channel = supabase.channel(`google-sync-${currentJobId}`);

    const checkStatus = async () => {
      const { data } = await supabase.from('ads_sync_logs').select('*').eq('id', currentJobId).single();
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ads_sync_logs', filter: `id=eq.${currentJobId}` }, (payload) => handleUpdate(payload.new))
      .subscribe();

    // 2. Polling Loop (cada 2s)
    const intervalId = setInterval(checkStatus, 2000);

    const cleanup = () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };

    return () => cleanup();
  }, [currentJobId, isSyncing, fetchData, refreshLastSync, t]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [syncLogs, isSyncing]);

  const onAddRule = async (data: RuleFormValues) => {
    if (!currentAgency?.id) return;
    const newRule = {
      platform: 'google',
      account_id: data.account,
      keyword: data.keyword,
      virtual_name: data.name,
      agency_id: currentAgency.id
    };

    const { data: result, error } = await supabase.from('segmentation_rules').insert(newRule).select();

    if (error) {
      console.error('Error guardando regla:', error);
      const errorMessage = error.message || 'Error al guardar la regla';
      toast.error(errorMessage);
    } else {
      setSegmentationRules(prev => [...prev, ...(result || [])]);
      ruleForm.reset();
      toast.success("Regla guardada");
    }
  };

  const handleDeleteRule = async (id: string) => {
    const { error } = await supabase.from('segmentation_rules').delete().eq('id', id);
    if (error) {
      toast.error("Error eliminando: " + error.message);
    } else {
      setSegmentationRules(prev => prev.filter(r => r.id !== id));
      toast.info("Regla eliminada");
    }
  };

  const handleSaveBudget = async (
    clientId: string,
    next: { amount: number; mode: BudgetMode; periodStart: string | null; periodEnd: string | null },
  ) => {
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
      }
    }));

    const { error } = await supabase.from('client_settings').upsert({
      client_id: clientId,
      budget_limit: next.amount,
      budget_mode: next.mode,
      budget_period_start: next.mode === 'period' ? next.periodStart : null,
      budget_period_end: next.mode === 'period' ? next.periodEnd : null,
      agency_id: currentAgency.id
    }, { onConflict: 'client_id' });

    if (error) toast.error("Error guardando presupuesto");
    else fetchData();
  };

  const handleSaveClientSettings = async () => {
    if (!editingClient || !currentAgency?.id) return;
    await supabase.from('client_settings').upsert({
      client_id: editingClient.id,
      group_name: editingClient.group,
      is_hidden: editingClient.hidden,
      is_sales_account: editingClient.isSales,
      agency_id: currentAgency.id
    }, { onConflict: 'client_id' });
    setEditingClient(null);
    fetchData();
    toast.success(t('ads.toasts.configSaved'));
  };

  // Lógica principal de cálculo
  const reportData = useMemo(() => {
    if (!rawData.length) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const stats = new Map<string, {
      name: string, spent: number, budgetSpent: number, budget: number, total_conversions_val: number,
      total_clicks: number, total_impressions: number, total_conversions: number,
      is_group: boolean, isHidden: boolean, isSalesAccount: boolean,
      realIds: string[], realIdsNames: { id: string, name: string }[],
      campaigns: CampaignData[], isManualGroupBudget: boolean, autoDailyBudgetSum: number,
      seenBudgetIds: Set<string>
    }>();

    const uniqueAccounts = Array.from(new Set(rawData.map(r => JSON.stringify({ id: r.client_id, name: r.client_name }))))
      .map(s => JSON.parse(s));

    // Ensure we init stats for registered accounts too (even if no current data)
    registeredAccounts.forEach(acc => {
      if (!uniqueAccounts.find(u => normalizeId(u.id) === normalizeId(acc.account_id))) {
        uniqueAccounts.push({ id: acc.account_id, name: acc.account_name });
      }
    });


    uniqueAccounts.forEach(acc => {
      const settings = clientSettings[acc.id] || { budget: 0, group_name: '', is_hidden: false, is_sales_account: true, budgetMode: 'month' as const, periodStart: null, periodEnd: null };
      const groupKey = settings.group_name?.trim() ? `GROUP-${settings.group_name}` : acc.id;

      if (!settings.group_name?.trim() && !stats.has(groupKey)) {
        stats.set(groupKey, {
          name: acc.name || acc.id,
          spent: 0, budgetSpent: 0, budget: settings.budget || 0, total_conversions_val: 0,
          total_clicks: 0, total_impressions: 0, total_conversions: 0,
          is_group: false, isHidden: settings.is_hidden, isSalesAccount: settings.is_sales_account !== false,
          realIds: [acc.id], realIdsNames: [{ id: acc.id, name: acc.name }],
          campaigns: [], isManualGroupBudget: false, autoDailyBudgetSum: 0, seenBudgetIds: new Set<string>()
        });
      }
    });

    let totalProcessedCost = 0;
    let filteredOutCount = 0;
    rawData.forEach(row => {
      if (row.campaign_id?.startsWith('__no_campaigns_')) return;
      // Filtrar por todos los días del mes actual (del 1 al último día del mes)
      // Filtrar por todos los días del mes actual (Robust Date check)
      // Aseguramos formato YYYY-MM-DD para comparación de texto
      const rowDateStr = typeof row.date === 'string' ? row.date.substring(0, 10) : new Date(row.date).toISOString().substring(0, 10);
      const isInMonth = rowDateStr >= monthStart && rowDateStr <= monthEnd;

      let finalId = row.client_id;
      let finalName = row.client_name;

      // NOTA: Se removió el filtro isRegistered porque estaba ocultando todos los datos
      // ya que los IDs de google_ads_campaigns no coincidían con ad_accounts_config

      // Aplicar reglas de segmentación
      const rulesForAccount = segmentationRules.filter(r => normalizeId(r.account_id) === normalizeId(row.client_id));
      if (rulesForAccount.length > 0) {
        const match = rulesForAccount.find(r => row.campaign_name.toLowerCase().includes(r.keyword.toLowerCase()));
        if (match) {
          finalId = `${row.client_id}_${match.keyword.toUpperCase()}`;
          finalName = match.virtual_name;
        }
      }

      const settings = clientSettings[finalId] || { budget: 0, group_name: '', is_hidden: false, is_sales_account: true, budgetMode: 'month' as const, periodStart: null, periodEnd: null };
      const groupKey = settings.group_name?.trim() ? `GROUP-${settings.group_name}` : finalId;
      const budgetSettings = resolveStoredBudget(groupKey, [finalId], clientSettings);
      const window = budgetWindowFor({
        mode: budgetSettings.budgetMode,
        periodStart: budgetSettings.periodStart,
        periodEnd: budgetSettings.periodEnd,
      }, now);
      const inBudget = dateInRange(rowDateStr, window.start, window.end);
      if (!isInMonth && !inBudget) {
        filteredOutCount++;
        return;
      }
      const displayName = settings.group_name?.trim() ? settings.group_name : finalName;

      const isGroupManual = groupKey.startsWith('GROUP-') && (clientSettings[groupKey]?.budget > 0);
      const isIndividualManual = !groupKey.startsWith('GROUP-') && settings.budget > 0;

      if (!stats.has(groupKey)) {
        stats.set(groupKey, {
          name: displayName, spent: 0, budgetSpent: 0, budget: 0, total_conversions_val: 0,
          total_clicks: 0, total_impressions: 0, total_conversions: 0,
          is_group: groupKey.startsWith('GROUP-'), isHidden: settings.is_hidden, isSalesAccount: settings.is_sales_account !== false,
          realIds: [], realIdsNames: [], campaigns: [], isManualGroupBudget: isGroupManual, autoDailyBudgetSum: 0, seenBudgetIds: new Set<string>()
        });
      }

      const entry = stats.get(groupKey)!;
      const rowCost = Number(row.cost) || 0;
      if (inBudget) entry.budgetSpent += rowCost;
      if (!isInMonth) return;

      entry.spent += rowCost;
      totalProcessedCost += rowCost;
      entry.total_conversions_val += (row.conversions_value || 0);
      entry.total_clicks += (row.clicks || 0);
      entry.total_impressions += (row.impressions || 0);
      entry.total_conversions += (row.conversions || 0);

      if (row.status === 'ENABLED' && row.daily_budget > 0) {
        entry.autoDailyBudgetSum = addCampaignDailyBudget(
          entry.autoDailyBudgetSum,
          entry.seenBudgetIds,
          Number(row.daily_budget) || 0,
          row.budget_id,
          row.status,
          row.client_id,
        );
      }

      if (!entry.realIds.includes(finalId)) {
        entry.realIds.push(finalId);
        entry.realIdsNames.push({ id: finalId, name: finalName });
        if (!entry.is_group && isIndividualManual) entry.budget = settings.budget;
      }

      if (row.cost > 0 || row.status === 'ENABLED' || row.status === 'PAUSED') {
        entry.campaigns.push({
          ...row,
          original_client_name: finalName,
          original_client_id: finalId
        });
      }
    });

    const report: ClientPacing[] = [];

    stats.forEach((value, key) => {
      const spent = value.spent;
      const budgetSettings = resolveStoredBudget(key, value.realIds, clientSettings);
      const finalBudget = budgetSettings.budget;
      const window = budgetWindowFor({
        mode: budgetSettings.budgetMode,
        periodStart: budgetSettings.periodStart,
        periodEnd: budgetSettings.periodEnd,
      }, now);
      const currentDailyBudget = value.autoDailyBudgetSum;
      const pace = computeBudgetPace({
        spent: value.budgetSpent,
        amount: finalBudget,
        window,
        currentDailyBudget,
      });
      const avgDailySpend = pace.avgDaily;
      const forecast = pace.forecast;
      const progress = pace.progress;
      const remainingBudget = pace.remaining;
      const recommendedDaily = pace.recommendedDaily;
      const globalRoas = spent > 0 ? value.total_conversions_val / spent : 0;

      // Nuevas métricas calculadas
      const ctr = value.total_impressions > 0 ? (value.total_clicks / value.total_impressions) * 100 : 0;
      const cpc = value.total_clicks > 0 ? spent / value.total_clicks : 0;
      const cpa = value.total_conversions > 0 ? spent / value.total_conversions : 0;

      const status = finalBudget > 0 ? pace.status : 'ok';

      report.push({
        client_id: key, client_name: value.name, is_group: value.is_group,
        budget: finalBudget, spent, budgetSpent: value.budgetSpent, budgetMode: window.mode,
        periodStart: window.mode === 'period' ? budgetSettings.periodStart : null,
        periodEnd: window.mode === 'period' ? budgetSettings.periodEnd : null,
        progress, forecast, recommendedDaily, avgDailySpend,
        currentDailyBudget, status, remainingBudget, total_conversions_val: value.total_conversions_val,
        total_clicks: value.total_clicks, total_impressions: value.total_impressions,
        total_conversions: value.total_conversions, ctr, cpc, cpa,
        isHidden: value.isHidden, isSalesAccount: value.isSalesAccount,
        groupName: value.is_group ? value.name : undefined,
        isManualGroupBudget: value.isManualGroupBudget, realIdsList: value.realIdsNames,
        campaigns: value.campaigns.sort((a, b) => b.cost - a.cost), globalRoas
      });
    });

    let filtered = report;
    if (!showHidden) filtered = filtered.filter(c => !c.isHidden);
    if (!showZeroSpend) {
      filtered = filtered.filter(c =>
        c.spent > 0 || c.budgetSpent > 0 || c.campaigns.some(camp => camp.status === 'ENABLED' || camp.status === 'PAUSED')
      );
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(c => c.client_name.toLowerCase().includes(lower) || c.campaigns.some(camp => camp.campaign_name.toLowerCase().includes(lower)));
    }

    return filtered.sort((a, b) => b.spent - a.spent);
  }, [rawData, clientSettings, registeredAccounts, searchTerm, showHidden, showZeroSpend, segmentationRules, daysInMonth]);

  const attentionCount = reportData.filter((row) => row.budget > 0 && (row.status === 'risk' || row.status === 'over')).length;
  const listedAccounts = attentionOnly
    ? reportData.filter((row) => row.budget > 0 && (row.status === 'risk' || row.status === 'over'))
    : reportData;

  // Selector para modal de reglas
  const uniqueAccountsForSelector = useMemo(() => {
    const unique = new Map();
    rawData.forEach(r => unique.set(r.client_id, r.client_name));
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [rawData]);

  const renderCampaignDailyBudget = (
    camp: CampaignData,
    sharedCounts: Map<string, number>,
    accountId: string,
  ) => {
    const displayDaily = getCampaignDisplayDailyBudget(camp, sharedCounts);
    if (!displayDaily) return '-';
    const isShared = isSharedPortfolioBudget(camp, sharedCounts);
    const displayLabel = formatMoney(displayDaily, accountId);
    if (!isShared) return displayLabel;
    const portfolioTotal = formatMoney(Number(camp.daily_budget), accountId);
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-dotted decoration-slate-300">{displayLabel}</span>
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-xs">
          {t('ads.table.sharedBudgetTooltip', {
            total: portfolioTotal,
            defaultValue: 'Cartera compartida: {{total}} diarios en total entre varias campañas.',
          })}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="mx-auto max-w-[90rem] space-y-4 p-4 pb-20 sm:p-6">
      <AdsPageHeader
        title={t('ads.google', 'Google Ads')}
        sync={googleSync}
        connected={googleConnected}
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Accordion type="single" collapsible>
          {listedAccounts.map((client) => {
            const statusConfig = getStatusConfig(client.status, t);
            const dailyDiff = client.currentDailyBudget - client.recommendedDaily;
            const isOverspending = dailyDiff > 0 && client.status !== 'ok';
            const sharedBudgetCounts = countSharedBudgetCampaigns(client.campaigns);
            const attention = client.budget > 0 && (client.status === 'risk' || client.status === 'over');

            return (
              <AccordionItem
                key={client.client_id}
                value={client.client_id}
                className={cn("border-slate-200", client.isHidden && "opacity-60")}
              >
                <AccordionTrigger className="px-4 py-3.5 text-slate-400 hover:bg-slate-50/80 hover:no-underline data-[state=open]:bg-slate-50/50">
                  <AdsAccountRow
                    name={(
                      <AnonymizedContent isActive={isAnonymized} className="font-medium" asBlock placeholder={anonymizer.account(client.client_id)}>
                        {formatProjectName(client.client_name)}
                      </AnonymizedContent>
                    )}
                    status={client.budget > 0 ? client.status : undefined}
                    detail={(
                      <>
                        {isAnonymized && (client.realIdsList[0]?.id || client.client_id) && (
                          <span className="font-mono text-[11px] text-slate-400">{client.realIdsList[0]?.id || client.client_id}</span>
                        )}
                        {client.is_group && (
                          <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
                            <Layers className="h-3 w-3" /> {t('ads.table.groupAccounts', 'Cuentas del grupo')}
                          </span>
                        )}
                        {attention && (
                          <span className={cn('text-[12px] font-medium', client.status === 'over' ? 'text-red-600' : 'text-amber-700')}>
                            {statusConfig.text}
                          </span>
                        )}
                        <RoasValue plain isSales={client.isSalesAccount} cost={client.spent} conversionValue={client.total_conversions_val} />
                        {client.isHidden && (
                          <span className="inline-flex items-center gap-1 text-[12px] text-slate-400">
                            <EyeOff className="h-3 w-3" /> {t('ads.status.hidden', 'Oculto')}
                          </span>
                        )}
                      </>
                    )}
                    progress={client.budget > 0 ? {
                      percent: client.progress,
                      caption: t('ads.pacing.forecast', { amount: formatMoney(client.forecast, client.client_id), defaultValue: `Proy: ${formatMoney(client.forecast, client.client_id)}` }),
                    } : null}
                    spentCaption={t('ads.header.thisMonth', 'Este mes')}
                    spent={formatMoney(client.spent, client.client_id)}
                    valueCaption={client.isSalesAccount && client.total_conversions_val > 0 ? t('ads.stats.revenue', 'Valor') : undefined}
                    value={client.isSalesAccount && client.total_conversions_val > 0 ? formatMoney(client.total_conversions_val, client.client_id) : undefined}
                    actions={(
                      <>
                        {!client.is_group && (
                          <AdAccountNotesTrigger platform="google" accountId={client.client_id} anonymized={isAnonymized} />
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
                              toast.info("Abre el grupo para editar cuentas individuales");
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
                          {client.budget <= 0 && t('ads.pacing.setTargetHint', 'Escribe el presupuesto del mes para ver el ritmo. No se rellena solo a partir del límite diario de Google.')}
                          {client.budget > 0 && client.budgetMode === 'period' && (
                            <>
                              {t('ads.pacing.periodSpent', { amount: formatMoney(client.budgetSpent, client.client_id), defaultValue: `Gastado en el periodo: ${formatMoney(client.budgetSpent, client.client_id)}` })}
                              {' · '}
                              {t('ads.pacing.monthSpent', { amount: formatMoney(client.spent, client.client_id), defaultValue: `Este mes: ${formatMoney(client.spent, client.client_id)}` })}
                            </>
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
                          label: t('common.actualDaily', 'Diario actual'),
                          value: formatMoney(client.currentDailyBudget, client.client_id),
                          hint: t('ads.pacing.googleNoteConfig', 'configurado en Google'),
                          tone: isOverspending ? 'warn' : 'default',
                        },
                        {
                          label: t('ads.pacing.recommendedDaily', 'Diario recomendado'),
                          value: formatMoney(client.recommendedDaily, client.client_id),
                          hint: client.budgetMode === 'period'
                            ? t('ads.pacing.recommendedDailySubPeriod', 'para cerrar el periodo en el presupuesto')
                            : t('ads.pacing.recommendedDailySub', 'para cerrar el mes en el presupuesto'),
                        },
                      ] : client.currentDailyBudget > 0 ? [
                        {
                          label: t('ads.pacing.googleDailyInfo', 'Límite diario en Google'),
                          value: formatMoney(client.currentDailyBudget, client.client_id),
                        },
                      ] : []}
                      warning={client.budget > 0 && isOverspending && dailyDiff > 5
                        ? t('ads.pacing.paceWarningGoogle', 'El ritmo de gasto va por encima del objetivo para no superar el presupuesto mensual. Revisa las campañas en Google Ads, esto suele ocurrir si los presupuestos diarios suman más que el objetivo mensual dividido por 30.')
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
                          dailyBudget: renderCampaignDailyBudget(
                            camp,
                            sharedBudgetCounts,
                            camp.original_client_id || camp.client_id || client.client_id,
                          ),
                          subtitle: client.is_group && (camp.original_client_name || camp.original_client_id) ? (
                            <AnonymizedContent isActive={isAnonymized} className="truncate max-w-[140px]" placeholder={anonymizer.account(camp.original_client_id || camp.client_id)}>
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
                                <th className="px-2 py-2 text-right hidden md:table-cell">{t('ads.stats.clicks', 'Clicks')}</th>
                                <th className="px-2 py-2 text-right">{t('ads.table.conv', 'Conv')}</th>
                                <th className="px-2 py-2 text-center">{t('ads.table.roas', 'ROAS')}</th>
                                <th className="px-2 py-2 text-center" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {client.realIdsList.map(sub => {
                                const subCampaigns = client.campaigns.filter(c => c.original_client_id === sub.id || c.client_id === sub.id);
                                const subSharedBudgetCounts = countSharedBudgetCampaigns(subCampaigns);
                                const subSpent = subCampaigns.reduce((a, c) => a + c.cost, 0);
                                const subClicks = subCampaigns.reduce((a, c) => a + (c.clicks || 0), 0);
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
                                          <AnonymizedContent isActive={isAnonymized} placeholder={anonymizer.account(sub.id)}>
                                            {formatProjectName(sub.name)}
                                          </AnonymizedContent>
                                          {isAnonymized && (
                                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {sub.id}</div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-2 py-2.5 text-right font-medium text-slate-900">
                                        {formatMoney(subSpent, sub.id)}
                                      </td>
                                      <td className="px-2 py-2.5 text-right text-slate-500">
                                        {pctOfGroup.toFixed(1)}%
                                      </td>
                                      <td className="px-2 py-2.5 text-right hidden md:table-cell text-slate-500">
                                        {subClicks.toLocaleString('es-ES')}
                                      </td>
                                      <td className="px-2 py-2.5 text-right text-emerald-600">
                                        {subConv.toFixed(0)}
                                      </td>
                                      <td className="px-2 py-2.5 text-center">
                                        <RoasValue isSales={client.isSalesAccount} cost={subSpent} conversionValue={subValue} />
                                      </td>
                                      <td className="px-2 py-2.5 text-center">
                                        <div className="inline-flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                          <AdAccountNotesTrigger
                                            platform="google"
                                            accountId={sub.id}
                                            anonymized={isAnonymized}
                                          />
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
                                        <td colSpan={8} className="p-3">
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
                                              dailyBudget: renderCampaignDailyBudget(camp, subSharedBudgetCounts, sub.id),
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
          <p className="px-4 py-12 text-center text-sm text-slate-500">
            {t('ads.header.reviewEmpty', 'Ninguna cuenta por revisar con los filtros actuales.')}
          </p>
        )}

        {reportData.length === 0 && !loading && (
          <div className="px-4 py-16 text-center">
            <GoogleIcon />
            <h3 className="mt-3 text-sm font-medium text-slate-800">{t('ads.status.noData', 'Sin datos')}</h3>
            <p className="mt-1 text-sm text-slate-500">{t('ads.status.syncPrompt', 'Sincroniza para cargar las cuentas de Google Ads')}</p>
          </div>
        )}
      </div>

      {/* Modal configurar cliente */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('ads.dialogs.configAccount.title', 'Configurar cuenta')}</DialogTitle>
            <DialogDescription>
              {editingClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('ads.dialogs.configAccount.groupName', 'Nombre del grupo (Holding)')}</Label>
              <Input
                value={editingClient?.group || ''}
                onChange={(e) => setEditingClient(prev => prev ? { ...prev, group: e.target.value } : null)}
                placeholder={t('ads.dialogs.configAccount.groupPlaceholder', 'Ej: Grupo Empresarial ABC')}
              />
              <p className="text-xs text-slate-500">
                {t('ads.dialogs.configAccount.groupNote', 'Las cuentas con el mismo nombre de grupo se consolidarán juntas.')}
              </p>
            </div>
            <div className="flex justify-between items-center py-3 border-t">
              <div>
                <Label>{t('ads.dialogs.configAccount.salesAccount', 'Cuenta de ventas (ROAS)')}</Label>
                <p className="text-xs text-slate-500">{t('ads.dialogs.configAccount.salesAccountNote', 'Mostrar métricas de conversión')}</p>
              </div>
              <Switch
                checked={editingClient?.isSales !== false}
                onCheckedChange={(c) => setEditingClient(prev => prev ? { ...prev, isSales: c } : null)}
              />
            </div>
            <div className="flex justify-between items-center py-3 border-t">
              <div>
                <Label>{t('ads.dialogs.configAccount.hideAccount', 'Ocultar cuenta')}</Label>
                <p className="text-xs text-slate-500">{t('ads.dialogs.configAccount.hideAccountNote', 'No aparecerá en la lista principal')}</p>
              </div>
              <Switch
                checked={editingClient?.hidden || false}
                onCheckedChange={(c) => setEditingClient(prev => prev ? { ...prev, hidden: c } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>{t('ads.actions.cancel', 'Cancelar')}</Button>
            <Button onClick={handleSaveClientSettings}>{t('ads.actions.save', 'Guardar')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal dividir cuentas */}
      <Dialog open={isSplitModalOpen} onOpenChange={setIsSplitModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" /> {t('ads.dialogs.splitAccounts.title', 'Dividir cuentas')}
            </DialogTitle>
            <DialogDescription>
              {t('ads.dialogs.splitAccounts.description', 'Crea cuentas virtuales separando campañas que contengan una palabra clave específica.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Formulario nueva regla */}
            <Form {...ruleForm}>
              <form onSubmit={ruleForm.handleSubmit(onAddRule)} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-lg border">
                <FormField
                  control={ruleForm.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem className="col-span-12 sm:col-span-4">
                      <FormLabel className="text-xs font-medium">{t('ads.dialogs.splitAccounts.sourceAccount', 'Cuenta origen')}</FormLabel>
                      <Popover open={openRuleAccount} onOpenChange={setOpenRuleAccount}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className="w-full justify-between font-normal bg-white">
                              <span className="truncate">{field.value ? (uniqueAccountsForSelector.find(a => a.id === field.value)?.name || uniqueAccountsForSelector.find(a => a.id === field.value)?.id || t('ads.dialogs.splitAccounts.selectAccount', 'selecciona...')) : t('ads.dialogs.splitAccounts.selectAccount', 'selecciona...')}</span>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder={t('ads.filters.searchPlaceholder', 'Buscar cuenta o ID...')} className="h-9" />
                            <CommandList className="max-h-[280px]">
                              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                                {t('common.noResults', 'Ninguna cuenta coincide.')}
                              </CommandEmpty>
                              <CommandGroup>
                                {uniqueAccountsForSelector.map((acc) => (
                                  <CommandItem
                                    key={acc.id}
                                    value={`${acc.name || ''} ${acc.id}`}
                                    onSelect={() => {
                                      field.onChange(acc.id);
                                      setOpenRuleAccount(false);
                                    }}
                                  >
                                    <Check className={cn('mr-2 h-4 w-4 shrink-0', field.value === acc.id ? 'opacity-100' : 'opacity-0')} />
                                    <span className="truncate">{acc.name || acc.id}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ruleForm.control}
                  name="keyword"
                  render={({ field }) => (
                    <FormItem className="col-span-6 sm:col-span-3">
                      <FormLabel className="text-xs font-medium">{t('ads.dialogs.splitAccounts.ifContains', 'Si contiene...')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: palabra clave" className="bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ruleForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-6 sm:col-span-3">
                      <FormLabel className="text-xs font-medium">{t('ads.dialogs.splitAccounts.createAccount', 'Crear cuenta...')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Nombre de la cuenta" className="bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-12 sm:col-span-2">
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>

            {/* Lista de reglas activas */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase">{t('ads.dialogs.splitAccounts.activeRules', { count: segmentationRules.length, defaultValue: `Reglas activas (${segmentationRules.length})` })}</h4>
              {segmentationRules.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-4 text-center">{t('ads.dialogs.splitAccounts.noRules', 'No hay reglas definidas')}</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {segmentationRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">
                          {normalizeId(rule.account_id).slice(0, 10)}...
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {t('ads.dialogs.splitAccounts.ifContainsLabel', { keyword: rule.keyword, defaultValue: `Si contiene "${rule.keyword}"` })}
                        </span>
                        <span className="text-slate-300">→</span>
                        <span className="font-bold text-blue-600">{rule.virtual_name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-500 hover:bg-red-50 h-8 w-8"
                      >
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

      {/* Modal Sincronización */}
      <Dialog open={isSyncing} onOpenChange={(open) => { if (syncStatus !== 'running') setIsSyncing(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {syncStatus === 'running' && <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />}
              {syncStatus === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {syncStatus === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
              {t('ads.dialogs.sync.title', { platform: 'Google Ads' })}
            </DialogTitle>
            <DialogDescription>
              {syncStatus === 'running'
                ? t('ads.dialogs.sync.connecting', 'Conectando con la API...')
                : syncStatus === 'warning'
                  ? t('ads.dialogs.sync.relink', 'No se actualizó ninguna campaña. Vuelve a vincular la cuenta en Integraciones.')
                  : t('ads.dialogs.sync.finished', 'Proceso finalizado')}
            </DialogDescription>
          </DialogHeader>
          <div className="w-full">
            <Progress value={syncProgress} className="h-1" />
          </div>
          <div className="h-64 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <div className="h-full space-y-1 overflow-y-auto p-3 font-mono text-[12px] leading-5 text-slate-700" ref={scrollRef}>
              {syncLogs.map((log, i) => (
                <div key={i} className="break-words">{log}</div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
