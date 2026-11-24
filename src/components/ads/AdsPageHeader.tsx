import { RefreshCw, Scissors, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AdsLastSyncInfo } from '@/hooks/useAdsLastSync';
import { cn } from '@/lib/utils';

interface AdsPageHeaderProps {
  title: string;
  sync?: AdsLastSyncInfo | null;
  connected?: boolean;
  accountCount: number;
  attentionCount: number;
  attentionOnly: boolean;
  onAttentionOnly: (value: boolean) => void;
  onSync: () => void;
  syncing: boolean;
  onSplit: () => void;
  search: string;
  onSearch: (value: string) => void;
  showHidden: boolean;
  onShowHidden: (value: boolean) => void;
  showZero: boolean;
  onShowZero: (value: boolean) => void;
  hiddenSwitchId: string;
  zeroSwitchId: string;
}

export function AdsPageHeader({
  title,
  sync,
  connected = true,
  accountCount,
  attentionCount,
  attentionOnly,
  onAttentionOnly,
  onSync,
  syncing,
  onSplit,
  search,
  onSearch,
  showHidden,
  onShowHidden,
  showZero,
  onShowZero,
  hiddenSwitchId,
  zeroSwitchId,
}: AdsPageHeaderProps) {
  const { t, i18n } = useTranslation('app');
  const locale = i18n.language.toLowerCase().startsWith('en') ? 'en-GB' : 'es-ES';
  const syncTime = sync
    ? sync.at.toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;
  const syncSource = sync
    ? (sync.source === 'cron'
      ? t('ads.syncSource.scheduled', 'automática')
      : t('ads.syncSource.manual', 'manual'))
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            {connected && (
              <>
                <span>
                  {syncTime
                    ? t('ads.header.synced', { time: syncTime, source: syncSource, defaultValue: `Sincronizado ${syncTime} · ${syncSource}` })
                    : t('ads.noSync', 'Sin sincronizar')}
                </span>
                <span className="text-slate-300">·</span>
              </>
            )}
            <span>{t('ads.header.accounts', { count: accountCount, defaultValue: `${accountCount} cuentas` })}</span>
            {attentionCount > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  className={cn(
                    'underline-offset-2 hover:underline',
                    attentionOnly ? 'font-medium text-slate-900' : 'text-amber-800',
                  )}
                  onClick={() => onAttentionOnly(!attentionOnly)}
                >
                  {t('ads.header.review', { count: attentionCount, defaultValue: `${attentionCount} por revisar` })}
                </button>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onSplit} className="text-slate-600">
            <Scissors className="mr-1.5 h-4 w-4" />
            {t('ads.actions.split', 'Dividir')}
          </Button>
          <Button size="sm" onClick={onSync} disabled={syncing}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', syncing && 'animate-spin')} />
            {syncing ? t('ads.actions.syncing', 'Sincronizando...') : t('ads.actions.sync', 'Sincronizar')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={t('ads.filters.searchPlaceholder', 'Buscar cuenta o campaña...')}
            className="h-9 border-slate-200 bg-white pl-9"
          />
          {search && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2" onClick={() => onSearch('')}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id={hiddenSwitchId} checked={showHidden} onCheckedChange={onShowHidden} />
            <Label htmlFor={hiddenSwitchId} className="cursor-pointer text-sm text-slate-600">
              {t('ads.filters.showHidden', 'Ocultos')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id={zeroSwitchId} checked={showZero} onCheckedChange={onShowZero} />
            <Label htmlFor={zeroSwitchId} className="cursor-pointer text-sm text-slate-600">
              {t('ads.filters.showZeroSpend', 'Sin inversión (0 €)')}
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
