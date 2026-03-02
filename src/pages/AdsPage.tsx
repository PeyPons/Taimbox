import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  RefreshCw, Clock, Search, Settings, Layers,
  TrendingUp, TrendingDown, Scissors, Plus, Trash2,
  AlertTriangle, CheckCircle2, Calendar, Target,
  ArrowUpRight, ArrowDownRight, Eye, EyeOff, X, Check, ChevronDown, ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAnonymizeAds } from '@/hooks/useAnonymizeAds';
import { AnonymizedContent } from '@/components/ads/AnonymizedContent';
import { AnonymizedBanner } from '@/components/ads/AnonymizedBanner';

const GoogleIcon = () => (
  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
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
  globalRoas: number;
  ctr: number;
  cpc: number;
  cpa: number;
}

const formatProjectName = (name: string) => (name || '').replace(/^(Cliente|Client)\s*[-:]?\s*/i, '');
const normalizeId = (id: string) => id ? id.trim() : '';

const getRoasColor = (roas: number) => {
  if (roas >= 4) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (roas >= 2) return "text-blue-600 bg-blue-50 border-blue-200";
  if (roas >= 1) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'over': return { color: 'bg-red-500', text: 'Excedido', icon: AlertTriangle, badgeClass: 'bg-red-100 text-red-700 border-red-200' };
    case 'risk': return { color: 'bg-amber-500', text: 'En riesgo', icon: TrendingUp, badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'under': return { color: 'bg-blue-500', text: 'Bajo', icon: TrendingDown, badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' };
    default: return { color: 'bg-emerald-500', text: 'OK', icon: CheckCircle2, badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
};

// Componente de stat card para el header
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}

const StatCard = memo(function StatCard({ icon: Icon, label, value, subValue, color = 'slate' }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-200',
    blue: 'bg-blue-50 border-blue-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
  };

  return (
    <div className={cn("rounded-xl border p-4", colorClasses[color])}>
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
    </div>
  );
});

export default function AdsPage() {
  const { currentAgency } = useAgency();
  const { isActive: isAnonymized, anonymizer } = useAnonymizeAds();
  const [rawData, setRawData] = useState<CampaignData[]>([]);
  const [clientSettings, setClientSettings] = useState<Record<string, { budget: number; group_name: string; is_hidden: boolean; is_sales_account: boolean }>>({});
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [segmentationRules, setSegmentationRules] = useState<SegmentationRule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [showZeroSpend, setShowZeroSpend] = useState(false);
  const [expandedSubAccounts, setExpandedSubAccounts] = useState<Record<string, boolean>>({});

  // Modales
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [editingClient, setEditingClient] = useState<{ id: string, name: string, group: string, hidden: boolean, isSales: boolean } | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [openRuleAccount, setOpenRuleAccount] = useState(false);

  // Formulario nueva regla
  const ruleFormSchema = z.object({
    account: z.string().min(1, 'Debes seleccionar una cuenta'),
    keyword: z.string().min(1, 'La palabra clave es obligatoria'),
    name: z.string().min(1, 'El nombre es obligatorio'),
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

  // Datos del mes actual
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

  const fetchData = async () => {
    if (!currentAgency?.id) return;

    try {
      const [adsRes, settingsRes, accountsRes, logsRes, rulesRes] = await Promise.all([
        supabase.from('google_ads_campaigns').select('*').eq('agency_id', currentAgency.id),
        supabase.from('client_settings').select('*').eq('agency_id', currentAgency.id),
        supabase.from('ad_accounts_config').select('*').eq('platform', 'google').eq('is_active', true).eq('agency_id', currentAgency.id),
        supabase.from('ads_sync_logs').select('created_at').eq('agency_id', currentAgency.id).eq('status', 'completed').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('segmentation_rules').select('*').eq('platform', 'google').eq('agency_id', currentAgency.id)
      ]);

      const settingsMap: Record<string, { budget: number; group_name: string; is_hidden: boolean; is_sales_account: boolean }> = {};
      settingsRes.data?.forEach((s: { client_id: string; budget_limit?: number; group_name?: string; is_hidden?: boolean; is_sales_account?: boolean }) => {
        settingsMap[s.client_id] = {
          budget: Number(s.budget_limit) || 0,
          group_name: s.group_name || '',
          is_hidden: s.is_hidden || false,
          is_sales_account: s.is_sales_account !== false
        };
      });

      setRawData(adsRes.data || []);
      setClientSettings(settingsMap);
      setRegisteredAccounts(accountsRes.data || []);
      setSegmentationRules(rulesRes.data || []);

      if (logsRes.data) {
        setLastSyncTime(new Date(logsRes.data.created_at));
      } else if (adsRes.data && adsRes.data.length > 0) {
        const dates = adsRes.data.map((d: CampaignData & { created_at?: string; date?: string }) => new Date(d.created_at || d.date || '').getTime());
        setLastSyncTime(new Date(Math.max(...dates)));
      }
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const handleStartSync = async () => {
    if (!currentAgency) {
      toast.error("Error: No se ha identificado la agencia actual.");
      return;
    }
    setIsSyncing(true);
    setSyncStatus('running');
    setSyncLogs(['🚀 Iniciando conexión con Google Ads...']);
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

    let intervalId: NodeJS.Timeout;
    let channel = supabase.channel(`google-sync-${currentJobId}`);

    const checkStatus = async () => {
      const { data } = await supabase.from('ads_sync_logs').select('*').eq('id', currentJobId).single();
      if (data) handleUpdate(data);
    };

    const handleUpdate = (row: any) => {
      if (row.logs) setSyncLogs(row.logs);

      if (row.status === 'completed') {
        setSyncStatus('completed');
        setSyncProgress(100);
        toast.success('Sincronización completada');
        fetchData();
        cleanup();
        setTimeout(() => { setIsSyncing(false); setCurrentJobId(null); }, 2000);
      } else if (row.status === 'error') {
        setSyncStatus('error');
        toast.error('Error en el proceso');
        cleanup();
      }
    };

    const cleanup = () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };

    // 1. Suscripción Realtime
    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ads_sync_logs', filter: `id=eq.${currentJobId}` }, (payload) => handleUpdate(payload.new))
      .subscribe();

    // 2. Polling Loop (cada 2s)
    intervalId = setInterval(checkStatus, 2000);

    return () => cleanup();
  }, [currentJobId, isSyncing]);

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

  const handleSaveBudget = async (clientId: string, amount: string) => {
    if (!currentAgency?.id) return;
    const numAmount = parseFloat(amount);

    setClientSettings(prev => ({
      ...prev,
      [clientId]: { ...prev[clientId], budget: isNaN(numAmount) ? 0 : numAmount }
    }));

    const { error } = await supabase.from('client_settings').upsert({
      client_id: clientId,
      budget_limit: isNaN(numAmount) ? 0 : numAmount,
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
    toast.success('Configuración guardada');
  };

  // Lógica principal de cálculo
  const reportData = useMemo(() => {
    if (!rawData.length) return [];

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const stats = new Map<string, {
      name: string, spent: number, budget: number, total_conversions_val: number,
      total_clicks: number, total_impressions: number, total_conversions: number,
      is_group: boolean, isHidden: boolean, isSalesAccount: boolean,
      realIds: string[], realIdsNames: { id: string, name: string }[],
      campaigns: CampaignData[], isManualGroupBudget: boolean, autoDailyBudgetSum: number
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
      const settings = clientSettings[acc.id] || { budget: 0, group_name: '', is_hidden: false, is_sales_account: true };
      const groupKey = settings.group_name?.trim() ? `GROUP-${settings.group_name}` : acc.id;

      if (!settings.group_name?.trim() && !stats.has(groupKey)) {
        stats.set(groupKey, {
          name: acc.name || acc.id,
          spent: 0, budget: settings.budget || 0, total_conversions_val: 0,
          total_clicks: 0, total_impressions: 0, total_conversions: 0,
          is_group: false, isHidden: settings.is_hidden, isSalesAccount: settings.is_sales_account !== false,
          realIds: [acc.id], realIdsNames: [{ id: acc.id, name: acc.name }],
          campaigns: [], isManualGroupBudget: false, autoDailyBudgetSum: 0
        });
      }
    });

    let totalProcessedCost = 0;
    let filteredOutCount = 0;
    rawData.forEach(row => {
      // Filtrar por todos los días del mes actual (del 1 al último día del mes)
      // Filtrar por todos los días del mes actual (Robust Date check)
      // Aseguramos formato YYYY-MM-DD para comparación de texto
      const rowDateStr = typeof row.date === 'string' ? row.date.substring(0, 10) : new Date(row.date).toISOString().substring(0, 10);
      const isInRange = rowDateStr >= monthStart && rowDateStr <= monthEnd;

      if (!isInRange) {
        filteredOutCount++;
        return;
      }
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

      const settings = clientSettings[finalId] || { budget: 0, group_name: '', is_hidden: false, is_sales_account: true };
      const groupKey = settings.group_name?.trim() ? `GROUP-${settings.group_name}` : finalId;
      const displayName = settings.group_name?.trim() ? settings.group_name : finalName;

      const isGroupManual = groupKey.startsWith('GROUP-') && (clientSettings[groupKey]?.budget > 0);
      const isIndividualManual = !groupKey.startsWith('GROUP-') && settings.budget > 0;

      if (!stats.has(groupKey)) {
        stats.set(groupKey, {
          name: displayName, spent: 0, budget: 0, total_conversions_val: 0,
          total_clicks: 0, total_impressions: 0, total_conversions: 0,
          is_group: groupKey.startsWith('GROUP-'), isHidden: settings.is_hidden, isSalesAccount: settings.is_sales_account !== false,
          realIds: [], realIdsNames: [], campaigns: [], isManualGroupBudget: isGroupManual, autoDailyBudgetSum: 0
        });
      }

      const entry = stats.get(groupKey)!;
      const rowCost = Number(row.cost) || 0;
      entry.spent += rowCost;
      totalProcessedCost += rowCost;
      entry.total_conversions_val += (row.conversions_value || 0);
      entry.total_clicks += (row.clicks || 0);
      entry.total_impressions += (row.impressions || 0);
      entry.total_conversions += (row.conversions || 0);

      if (row.status === 'ENABLED' && row.daily_budget > 0) entry.autoDailyBudgetSum += row.daily_budget;

      if (!entry.realIds.includes(finalId)) {
        entry.realIds.push(finalId);
        entry.realIdsNames.push({ id: finalId, name: finalName });
        if (!entry.is_group && isIndividualManual) entry.budget = settings.budget;
      }

      if (row.cost > 0) {
        entry.campaigns.push({
          ...row,
          original_client_name: finalName,
          original_client_id: finalId
        });
      }
    });

    const report: ClientPacing[] = [];

    stats.forEach((value, key) => {
      let finalBudget = 0;
      if (value.is_group) {
        const groupSettings = clientSettings[key.replace('GROUP-', '')] || clientSettings[key];
        if (groupSettings?.budget > 0) finalBudget = groupSettings.budget;
        else finalBudget = value.autoDailyBudgetSum * 30.4;
      } else {
        if (value.budget > 0) finalBudget = value.budget;
        else finalBudget = value.autoDailyBudgetSum * 30.4;
      }

      const spent = value.spent;
      const avgDailySpend = currentDay > 0 ? spent / currentDay : 0;
      const forecast = avgDailySpend * daysInMonth;
      const progress = finalBudget > 0 ? (spent / finalBudget) * 100 : 0;
      const remainingBudget = Math.max(0, finalBudget - spent);
      const recommendedDaily = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;
      const currentDailyBudget = value.autoDailyBudgetSum;
      const globalRoas = spent > 0 ? value.total_conversions_val / spent : 0;

      // Nuevas métricas calculadas
      const ctr = value.total_impressions > 0 ? (value.total_clicks / value.total_impressions) * 100 : 0;
      const cpc = value.total_clicks > 0 ? spent / value.total_clicks : 0;
      const cpa = value.total_conversions > 0 ? spent / value.total_conversions : 0;

      let status: 'ok' | 'risk' | 'over' | 'under' = 'ok';
      if (finalBudget > 0) {
        if (spent > finalBudget) status = 'over';
        else if (forecast > finalBudget) status = 'risk';
        else if (progress < 50 && currentDay > 20) status = 'under';
      }

      report.push({
        client_id: key, client_name: value.name, is_group: value.is_group,
        budget: finalBudget, spent, progress, forecast, recommendedDaily, avgDailySpend,
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
    if (!showZeroSpend) filtered = filtered.filter(c => c.spent > 0);
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(c => c.client_name.toLowerCase().includes(lower) || c.campaigns.some(camp => camp.campaign_name.toLowerCase().includes(lower)));
    }

    return filtered.sort((a, b) => b.spent - a.spent);
  }, [rawData, clientSettings, registeredAccounts, searchTerm, showHidden, showZeroSpend, segmentationRules, now, currentDay, daysInMonth, daysRemaining]);

  // Estadísticas globales
  const globalStats = useMemo(() => {
    const totalBudget = reportData.reduce((acc, r) => acc + r.budget, 0);
    const totalSpent = reportData.reduce((acc, r) => acc + r.spent, 0);
    const totalRevenue = reportData.reduce((acc, r) => acc + r.total_conversions_val, 0);
    const totalRecommendedDaily = reportData.reduce((acc, r) => acc + r.recommendedDaily, 0);
    const totalCurrentDaily = reportData.reduce((acc, r) => acc + r.currentDailyBudget, 0);
    const atRisk = reportData.filter(r => r.status === 'risk' || r.status === 'over').length;
    const globalRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

    // Nuevas estadísticas agregadas
    const totalClicks = reportData.reduce((acc, r) => acc + r.total_clicks, 0);
    const totalImpressions = reportData.reduce((acc, r) => acc + r.total_impressions, 0);
    const totalConversions = reportData.reduce((acc, r) => acc + r.total_conversions, 0);
    const globalCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const globalCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
    const globalCpa = totalConversions > 0 ? totalSpent / totalConversions : 0;

    return {
      totalBudget, totalSpent, totalRevenue, totalRecommendedDaily, totalCurrentDaily, atRisk, globalRoas,
      totalClicks, totalImpressions, totalConversions, globalCtr, globalCpc, globalCpa
    };
  }, [reportData]);

  // Selector para modal de reglas
  const uniqueAccountsForSelector = useMemo(() => {
    const unique = new Map();
    rawData.forEach(r => unique.set(r.client_id, r.client_name));
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [rawData]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <GoogleIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Google Ads</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {lastSyncTime ? lastSyncTime.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin sincronizar'}
                </span>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Del 1 al {daysInMonth}
                </Badge>
                {isAnonymized && (
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Datos protegidos
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={() => setIsSplitModalOpen(true)} className="flex-1 md:flex-none">
              <Scissors className="w-4 h-4 mr-2" /> Dividir
            </Button>
            <Button onClick={handleStartSync} disabled={isSyncing} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700">
              <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
              Sincronizar
            </Button>
          </div>
        </div>

        {isAnonymized && <AnonymizedBanner isActive={isAnonymized} />}

        {/* Stats Cards - Reorganized for PPC */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            icon={Target}
            label="Inversión"
            value={formatCurrency(globalStats.totalSpent)}
            subValue={`de ${formatCurrency(globalStats.totalBudget)}`}
            color="blue"
          />
          <StatCard
            icon={ArrowUpRight}
            label="Clicks"
            value={globalStats.totalClicks.toLocaleString('es-ES')}
            subValue={`CTR ${globalStats.globalCtr.toFixed(2)}%`}
            color="slate"
          />
          <StatCard
            icon={TrendingUp}
            label="Conversiones"
            value={globalStats.totalConversions.toFixed(0)}
            subValue={`CPA ${formatCurrency(globalStats.globalCpa)}`}
            color="emerald"
          />
          <StatCard
            icon={Target}
            label="ROAS"
            value={`${globalStats.globalRoas.toFixed(2)}x`}
            subValue={`CPC ${formatCurrency(globalStats.globalCpc)}`}
            color={globalStats.globalRoas >= 2 ? 'emerald' : globalStats.globalRoas >= 1 ? 'amber' : 'red'}
          />
          <StatCard
            icon={ArrowDownRight}
            label="Diario recomendado"
            value={formatCurrency(globalStats.totalRecommendedDaily)}
            subValue={`Actual: ${formatCurrency(globalStats.totalCurrentDaily)}`}
            color={globalStats.totalRecommendedDaily < globalStats.totalCurrentDaily ? 'amber' : 'emerald'}
          />
          <StatCard
            icon={AlertTriangle}
            label="En riesgo"
            value={globalStats.atRisk.toString()}
            subValue={`${daysRemaining} días restantes`}
            color={globalStats.atRisk > 0 ? 'red' : 'slate'}
          />
        </div>

        {/* Buscador y filtros */}
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-3 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar cuenta o campaña..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200"
            />
            {searchTerm && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchTerm('')}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="show-hidden" checked={showHidden} onCheckedChange={setShowHidden} />
              <Label htmlFor="show-hidden" className="text-sm text-slate-600 cursor-pointer flex items-center gap-1">
                {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                Ocultos
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="show-zero-spend" checked={showZeroSpend} onCheckedChange={setShowZeroSpend} />
              <Label htmlFor="show-zero-spend" className="text-sm text-slate-600 cursor-pointer flex items-center gap-1">
                Sin inversión (0 €)
              </Label>
            </div>
            <span className="text-sm text-slate-500">{reportData.length} cuentas</span>
          </div>
        </div>
      </div>

      {/* Lista de cuentas */}
      <div className="space-y-3">
        <Accordion type="single" collapsible className="space-y-2">
          {reportData.map((client) => {
            const statusConfig = getStatusConfig(client.status);
            const dailyDiff = client.currentDailyBudget - client.recommendedDaily;
            const isOverspending = dailyDiff > 0 && client.status !== 'ok';

            return (
              <AccordionItem
                key={client.client_id}
                value={client.client_id}
                className={cn(
                  "bg-white border rounded-xl shadow-sm overflow-hidden",
                  client.isHidden && "opacity-60 border-dashed"
                )}
              >
                <AccordionTrigger className="hover:no-underline py-4 px-4 group">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between w-full pr-4 gap-4">
                    {/* Info cliente */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className={cn("w-1.5 h-12 rounded-full", statusConfig.color)} />
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div>
                            <AnonymizedContent isActive={isAnonymized} className="font-bold text-lg text-slate-900" asBlock placeholder={anonymizer.account(client.client_id)}>
                              {formatProjectName(client.client_name)}
                            </AnonymizedContent>
                            {isAnonymized && (client.realIdsList[0]?.id || client.client_id) && (
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                ID: {client.realIdsList[0]?.id || client.client_id}
                              </div>
                            )}
                          </div>
                          {client.is_group && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Layers className="w-3 h-3" /> GRUPO
                            </Badge>
                          )}
                          <Badge variant="outline" className={cn("text-[10px]", statusConfig.badgeClass)}>
                            {statusConfig.text}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {client.isSalesAccount && client.globalRoas > 0 && (
                            <Badge variant="outline" className={cn("text-[10px] h-5", getRoasColor(client.globalRoas))}>
                              ROAS {client.globalRoas.toFixed(2)}
                            </Badge>
                          )}
                          {client.isHidden && (
                            <Badge variant="outline" className="text-[10px] h-5 gap-1">
                              <EyeOff className="w-3 h-3" /> Oculto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso (desktop) */}
                    {client.budget > 0 && (
                      <div className="hidden lg:flex flex-col flex-1 max-w-xs mx-4">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>{client.progress.toFixed(0)}% gastado</span>
                          <span>Proy: {formatCurrency(client.forecast)}</span>
                        </div>
                        <Progress
                          value={Math.min(client.progress, 100)}
                          className={cn("h-2",
                            client.status === 'over' && "[&>div]:bg-red-500",
                            client.status === 'risk' && "[&>div]:bg-amber-500",
                            client.status === 'ok' && "[&>div]:bg-blue-500"
                          )}
                        />
                      </div>
                    )}

                    {/* Métricas rápidas */}
                    <div className="flex items-center gap-4 lg:gap-6 justify-end">
                      {client.isSalesAccount && client.total_conversions_val > 0 && (
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] uppercase text-slate-400 font-medium">Valor</div>
                          <div className="text-lg font-bold text-emerald-600">{formatCurrency(client.total_conversions_val)}</div>
                        </div>
                      )}
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-400 font-medium">Invertido</div>
                        <div className="text-xl font-bold text-slate-900">{formatCurrency(client.spent)}</div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            role="button"
                            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 cursor-pointer")}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!client.is_group) {
                                setEditingClient({
                                  id: client.client_id,
                                  name: client.client_name,
                                  group: clientSettings[client.client_id]?.group_name || '',
                                  hidden: clientSettings[client.client_id]?.is_hidden || false,
                                  isSales: clientSettings[client.client_id]?.is_sales_account !== false
                                });
                              } else {
                                toast.info("Abre el grupo para editar cuentas individuales");
                              }
                            }}
                          >
                            <Settings className="w-4 h-4 text-slate-400" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Configurar</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="border-t bg-slate-50/50">
                  <div className="p-4 space-y-6">
                    {/* Cuentas vinculadas (grupos) - Tabla de desglose */}

                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Panel de presupuesto */}
                      <div className="bg-white p-4 rounded-lg border space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-slate-700">
                              Presupuesto {client.is_group ? 'Total' : 'Mensual'}
                            </Label>
                            {!client.isManualGroupBudget && !clientSettings[client.client_id]?.budget && (
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">
                                Auto
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">€</span>
                            <Input
                              key={`${client.client_id}-${client.budget}`}
                              type="number"
                              defaultValue={clientSettings[client.client_id]?.budget > 0 ? clientSettings[client.client_id]?.budget : ''}
                              onBlur={(e) => handleSaveBudget(client.client_id, e.target.value)}
                              className="h-8 w-28 text-right"
                              placeholder={client.budget.toFixed(0)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Consumo ({client.progress.toFixed(1)}%)</span>
                            <span className={client.remainingBudget <= 0 ? 'text-red-500 font-bold' : ''}>
                              Disponible: {formatCurrency(client.remainingBudget)}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(client.progress, 100)}
                            className={cn("h-2.5",
                              client.status === 'over' && "[&>div]:bg-red-500",
                              client.status === 'risk' && "[&>div]:bg-amber-500",
                              client.status === 'ok' && "[&>div]:bg-blue-500"
                            )}
                          />
                        </div>

                        {/* Comparativa diario actual vs recomendado */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className={cn(
                            "p-3 rounded-lg border-2 text-center",
                            isOverspending ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
                          )}>
                            <div className="text-[10px] uppercase text-slate-500 font-medium mb-1">
                              Diario actual
                            </div>
                            <div className={cn(
                              "text-xl font-bold",
                              isOverspending ? "text-amber-600" : "text-slate-700"
                            )}>
                              {formatCurrency(client.currentDailyBudget)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              configurado en Google
                            </div>
                          </div>
                          <div className={cn(
                            "p-3 rounded-lg border-2 text-center",
                            "bg-emerald-50 border-emerald-200"
                          )}>
                            <div className="text-[10px] uppercase text-slate-500 font-medium mb-1">
                              Diario recomendado
                            </div>
                            <div className="text-xl font-bold text-emerald-600">
                              {formatCurrency(client.recommendedDaily)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              para no pasarte
                            </div>
                          </div>
                        </div>

                        {/* Alerta si hay diferencia significativa */}
                        {isOverspending && dailyDiff > 5 && (
                          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>
                              Reduce el presupuesto diario en <strong>{formatCurrency(dailyDiff)}</strong> para ajustarte al límite mensual.
                            </span>
                          </div>
                        )}

                        {/* Proyección */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-600">Proyección fin de mes</span>
                          <span className={cn(
                            "font-bold",
                            client.forecast > client.budget ? "text-red-600" : "text-slate-700"
                          )}>
                            {formatCurrency(client.forecast)}
                          </span>
                        </div>
                      </div>

                      {/* Tabla de campañas - Mejorada con métricas PPC */}
                      <div className="bg-white rounded-lg border overflow-hidden">
                        <div className="max-h-[350px] overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 border-b">
                              <tr>
                                <th className="px-3 py-2.5 text-left">Campaña</th>
                                <th className="px-2 py-2.5 text-right w-24">P. Diario</th>
                                <th className="px-2 py-2.5 text-right">Gasto</th>
                                <th className="px-2 py-2.5 text-right hidden md:table-cell">Clicks</th>
                                <th className="px-2 py-2.5 text-right hidden lg:table-cell">CTR</th>
                                <th className="px-2 py-2.5 text-right hidden lg:table-cell">CPC</th>
                                <th className="px-2 py-2.5 text-right">Conv</th>
                                {client.isSalesAccount && <th className="px-2 py-2.5 text-center">ROAS</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {client.campaigns.map((camp, idx) => {
                                const roas = camp.cost > 0 ? (camp.conversions_value || 0) / camp.cost : 0;
                                const campCtr = (camp.impressions || 0) > 0 ? ((camp.clicks || 0) / (camp.impressions || 1)) * 100 : 0;
                                const campCpc = (camp.clicks || 0) > 0 ? camp.cost / (camp.clicks || 1) : 0;
                                const isHighBudget = (camp.daily_budget || 0) > 0 && (camp.cost / (currentDay || 1)) > (camp.daily_budget || 0);
                                return (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-3 py-2.5">
                                      <div className="space-y-1">
                                        <AnonymizedContent isActive={isAnonymized} className="font-medium text-slate-700 line-clamp-2" placeholder={anonymizer.campaign(camp.campaign_id)}>
                                          {camp.campaign_name}
                                        </AnonymizedContent>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                          <span className="flex items-center gap-1">
                                            <span className={cn(
                                              "w-1.5 h-1.5 rounded-full",
                                              camp.status === 'ENABLED' ? 'bg-emerald-400' : 'bg-slate-300'
                                            )} />
                                            {camp.status === 'ENABLED' ? 'Activa' : 'Pausada'}
                                          </span>
                                          {client.is_group && (camp.original_client_name || camp.original_client_id) && (
                                            <AnonymizedContent isActive={isAnonymized} className="truncate max-w-[100px]" placeholder={anonymizer.account(camp.original_client_id || camp.client_id)}>
                                              | {formatProjectName(camp.original_client_name || '')}
                                            </AnonymizedContent>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-2 py-2.5 text-right font-mono text-slate-500">
                                      {camp.daily_budget ? formatCurrency(camp.daily_budget) : '-'}
                                    </td>
                                    <td className={cn("px-2 py-2.5 text-right font-medium", isHighBudget ? "text-amber-600" : "text-slate-900")}>
                                      {formatCurrency(camp.cost)}
                                    </td>
                                    <td className="px-2 py-2.5 text-right hidden md:table-cell text-slate-600">
                                      {(camp.clicks || 0).toLocaleString('es-ES')}
                                    </td>
                                    <td className="px-2 py-2.5 text-right hidden lg:table-cell text-slate-500">
                                      {campCtr.toFixed(2)}%
                                    </td>
                                    <td className="px-2 py-2.5 text-right hidden lg:table-cell text-slate-500">
                                      {formatCurrency(campCpc)}
                                    </td>
                                    <td className="px-2 py-2.5 text-right text-emerald-600">
                                      {(camp.conversions || 0).toFixed(0)}
                                    </td>
                                    {client.isSalesAccount && (
                                      <td className="px-2 py-2.5 text-center">
                                        <Badge variant="outline" className={cn("text-[10px]", getRoasColor(roas))}>
                                          {roas.toFixed(2)}
                                        </Badge>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                              {client.campaigns.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                                    Sin campañas con gasto este mes
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Cuentas vinculadas (grupos) - Tabla de desglose interactiva */}
                    {client.is_group && (
                      <div className="bg-white p-4 rounded-lg border mt-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5" /> Desglose por Cuenta ({client.realIdsList.length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                              <tr>
                                <th className="px-3 py-2 text-left w-6"></th>
                                <th className="px-3 py-2 text-left">Cuenta</th>
                                <th className="px-2 py-2 text-right">Gasto</th>
                                <th className="px-2 py-2 text-right">% Grupo</th>
                                <th className="px-2 py-2 text-right hidden md:table-cell">Clicks</th>
                                <th className="px-2 py-2 text-right">Conv</th>
                                <th className="px-2 py-2 text-center">ROAS</th>
                                <th className="px-2 py-2 text-center" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {client.realIdsList.map(sub => {
                                const subCampaigns = client.campaigns.filter(c => c.original_client_id === sub.id || c.client_id === sub.id);
                                const subSpent = subCampaigns.reduce((a, c) => a + c.cost, 0);
                                const subClicks = subCampaigns.reduce((a, c) => a + (c.clicks || 0), 0);
                                const subConv = subCampaigns.reduce((a, c) => a + (c.conversions || 0), 0);
                                const subValue = subCampaigns.reduce((a, c) => a + (c.conversions_value || 0), 0);
                                const subRoas = subSpent > 0 ? subValue / subSpent : 0;
                                const pctOfGroup = client.spent > 0 ? (subSpent / client.spent) * 100 : 0;

                                const isExpanded = expandedSubAccounts[sub.id];

                                return (
                                  <>
                                    <tr key={sub.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedSubAccounts(prev => ({ ...prev, [sub.id]: !prev[sub.id] }))}>
                                      <td className="px-3 py-2.5 text-slate-400">
                                        {isExpanded ? <TrendingDown className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
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
                                        {formatCurrency(subSpent)}
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
                                        <Badge variant="outline" className={cn("text-[10px]", getRoasColor(subRoas))}>
                                          {subRoas.toFixed(2)}
                                        </Badge>
                                      </td>
                                      <td className="px-2 py-2.5 text-center">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingClient({ id: sub.id, name: sub.name, group: client.groupName || '', hidden: false, isSales: true });
                                          }}
                                          className="text-slate-400 hover:text-blue-500"
                                        >
                                          <Settings className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                    {isExpanded && (
                                      <tr className="bg-slate-50">
                                        <td colSpan={8} className="p-3">
                                          <div className="bg-white rounded border overflow-hidden">
                                            <table className="w-full text-xs">
                                              <thead className="bg-slate-50/50 text-slate-400 border-b">
                                                <tr>
                                                  <th className="px-3 py-2 text-left">Campaña</th>
                                                  <th className="px-2 py-2 text-right">P. Diario</th>
                                                  <th className="px-2 py-2 text-right">Gasto</th>
                                                  <th className="px-2 py-2 text-right">Conv</th>
                                                  <th className="px-2 py-2 text-center">ROAS</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {subCampaigns.sort((a, b) => b.cost - a.cost).map(camp => {
                                                  const campRoas = camp.cost > 0 ? (camp.conversions_value || 0) / camp.cost : 0;
                                                  const isHighBudget = (camp.daily_budget || 0) > 0 && (camp.cost / (currentDay || 1)) > (camp.daily_budget || 0);

                                                  return (
                                                    <tr key={camp.campaign_id} className="border-b last:border-0 hover:bg-slate-50">
                                                      <td className="px-3 py-2 font-medium text-slate-600 truncate max-w-[200px]">
                                                        <AnonymizedContent isActive={isAnonymized} placeholder={anonymizer.campaign(camp.campaign_id)}>
                                                          {camp.campaign_name}
                                                        </AnonymizedContent>
                                                      </td>
                                                      <td className="px-2 py-2 text-right text-slate-500 font-mono">
                                                        {camp.daily_budget ? formatCurrency(camp.daily_budget) : '-'}
                                                      </td>
                                                      <td className={cn("px-2 py-2.5 text-right font-medium", isHighBudget ? "text-amber-600" : "text-slate-900")}>
                                                        {formatCurrency(camp.cost)}
                                                      </td>
                                                      <td className="px-2 py-2 text-right text-emerald-600">
                                                        {(camp.conversions || 0).toFixed(0)}
                                                      </td>
                                                      <td className="px-2 py-2 text-center">
                                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded", getRoasColor(campRoas))}>
                                                          {campRoas.toFixed(2)}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                                {subCampaigns.length === 0 && <tr><td colSpan={5} className="p-3 text-center text-slate-400">Sin campañas activas</td></tr>}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {reportData.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <GoogleIcon />
            <h3 className="text-lg font-medium text-slate-700 mt-4">Sin datos</h3>
            <p className="text-sm text-slate-500 mt-1">Sincroniza para cargar las cuentas de Google Ads</p>
          </div>
        )}
      </div>

      {/* Modal configurar cliente */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar cuenta</DialogTitle>
            <DialogDescription>
              {editingClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del grupo (Holding)</Label>
              <Input
                value={editingClient?.group || ''}
                onChange={(e) => setEditingClient(prev => prev ? { ...prev, group: e.target.value } : null)}
                placeholder="Ej: Grupo Empresarial ABC"
              />
              <p className="text-xs text-slate-500">
                Las cuentas con el mismo nombre de grupo se consolidarán juntas.
              </p>
            </div>
            <div className="flex justify-between items-center py-3 border-t">
              <div>
                <Label>Cuenta de ventas (ROAS)</Label>
                <p className="text-xs text-slate-500">Mostrar métricas de conversión</p>
              </div>
              <Switch
                checked={editingClient?.isSales !== false}
                onCheckedChange={(c) => setEditingClient(prev => prev ? { ...prev, isSales: c } : null)}
              />
            </div>
            <div className="flex justify-between items-center py-3 border-t">
              <div>
                <Label>Ocultar cuenta</Label>
                <p className="text-xs text-slate-500">No aparecerá en la lista principal</p>
              </div>
              <Switch
                checked={editingClient?.hidden || false}
                onCheckedChange={(c) => setEditingClient(prev => prev ? { ...prev, hidden: c } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>Cancelar</Button>
            <Button onClick={handleSaveClientSettings}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal dividir cuentas */}
      <Dialog open={isSplitModalOpen} onOpenChange={setIsSplitModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" /> Dividir cuentas
            </DialogTitle>
            <DialogDescription>
              Crea cuentas virtuales separando campañas que contengan una palabra clave específica.
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
                      <FormLabel className="text-xs font-medium">Cuenta origen</FormLabel>
                      <Popover open={openRuleAccount} onOpenChange={setOpenRuleAccount}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className="w-full justify-between font-normal bg-white">
                              <span className="truncate">{field.value ? (uniqueAccountsForSelector.find(a => a.id === field.value)?.name || uniqueAccountsForSelector.find(a => a.id === field.value)?.id || 'selecciona...') : 'selecciona...'}</span>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandList className="max-h-[280px]">
                              <CommandGroup>
                                {uniqueAccountsForSelector.map(acc => (
                                  <CommandItem key={acc.id} value={acc.name || acc.id} onSelect={() => { field.onChange(acc.id); setOpenRuleAccount(false); }}>
                                    <Check className={cn('mr-2 h-4 w-4 shrink-0', field.value === acc.id ? 'opacity-100' : 'opacity-0')} />
                                    {acc.name || acc.id}
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
                      <FormLabel className="text-xs font-medium">Si contiene...</FormLabel>
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
                      <FormLabel className="text-xs font-medium">Crear cuenta...</FormLabel>
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
              <h4 className="text-xs font-bold text-slate-500 uppercase">Reglas activas ({segmentationRules.length})</h4>
              {segmentationRules.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-4 text-center">No hay reglas definidas</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {segmentationRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">
                          {normalizeId(rule.account_id).slice(0, 10)}...
                        </Badge>
                        <span className="text-sm text-slate-500">
                          Si contiene <strong className="text-slate-700">"{rule.keyword}"</strong>
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
        <DialogContent className="sm:max-w-md bg-slate-950 text-slate-100 border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {syncStatus === 'running' && <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />}
              {syncStatus === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              Sincronizando Google Ads
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {syncStatus === 'running' ? 'Conectando con la API...' : 'Proceso finalizado'}
            </DialogDescription>
          </DialogHeader>
          <div className="w-full">
            <Progress value={syncProgress} className="h-2 bg-slate-800 [&>div]:bg-blue-500" />
          </div>
          <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-green-400 h-64 overflow-hidden border border-slate-800">
            <div className="h-full overflow-y-auto space-y-1" ref={scrollRef}>
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
