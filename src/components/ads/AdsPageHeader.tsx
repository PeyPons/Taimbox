import { RefreshCw, Scissors, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
}

function FilterChip({
  active,
  onClick,
  children,
  tone = 'neutral',
}: {
  active: boolean;
  onClick: () => void;
  children: string;
  tone?: 'neutral' | 'attention';
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-8 shrink-0 rounded-full border px-3 text-[13px] transition-colors',
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : tone === 'attention'
            ? 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  );
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {connected && (
              <>
                <span>
                  {syncTime
                    ? t('ads.header.synced', { time: syncTime, source: syncSource, defaultValue: `Sincronizado ${syncTime} · ${syncSource}` })
                    : t('ads.noSync', 'Sin sincronizar')}
                </span>
                <span className="px-1.5 text-slate-300">·</span>
              </>
            )}
            <span>{t('ads.header.accounts', { count: accountCount, defaultValue: `${accountCount} cuentas` })}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSplit} className="border-slate-200 bg-white text-slate-700 shadow-none">
            <Scissors className="mr-1.5 h-4 w-4" />
            {t('ads.actions.split', 'Dividir')}
          </Button>
          <Button size="sm" onClick={onSync} disabled={syncing} className="shadow-none">
            <RefreshCw className={cn('mr-1.5 h-4 w-4', syncing && 'animate-spin')} />
            {syncing ? t('ads.actions.syncing', 'Sincronizando...') : t('ads.actions.sync', 'Sincronizar')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:px-4">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={t('ads.filters.searchPlaceholder', 'Buscar cuenta o campaña...')}
            className="h-9 w-full rounded-lg border border-transparent bg-slate-50 pl-9 pr-8 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-200 focus:bg-white"
          />
          {search && (
            <button
              type="button"
              className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
              onClick={() => onSearch('')}
              aria-label={t('ads.actions.close', 'Cerrar')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          <FilterChip active={showHidden} onClick={() => onShowHidden(!showHidden)}>
            {t('ads.filters.viewHidden', 'Ver ocultas')}
          </FilterChip>
          <FilterChip active={showZero} onClick={() => onShowZero(!showZero)}>
            {t('ads.filters.viewZero', 'Ver sin gasto')}
          </FilterChip>
          {attentionCount > 0 && (
            <FilterChip active={attentionOnly} tone="attention" onClick={() => onAttentionOnly(!attentionOnly)}>
              {t('ads.header.review', { count: attentionCount, defaultValue: `${attentionCount} por revisar` })}
            </FilterChip>
          )}
        </div>
      </div>
    </div>
  );
}
