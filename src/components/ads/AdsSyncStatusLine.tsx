import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import type { AdsLastSyncInfo } from '@/hooks/useAdsLastSync';

function formatSyncTime(date: Date, locale: string): string {
  return date.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PlatformSyncProps {
  label: string;
  info: AdsLastSyncInfo | null | undefined;
  connected?: boolean;
}

function PlatformSyncLine({ label, info, connected = true }: PlatformSyncProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('en') ? 'en-GB' : 'es-ES';

  if (!connected) return null;

  return (
    <span className="text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
      <span className="font-medium text-slate-600">{label}:</span>
      {info ? (
        <>
          <span>
            {t('ads.lastSyncShort', {
              time: formatSyncTime(info.at, locale),
              defaultValue: formatSyncTime(info.at, locale),
            })}
          </span>
          {info.source === 'cron' && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
              {t('ads.syncSource.scheduled', 'automática')}
            </Badge>
          )}
        </>
      ) : (
        <span>{t('ads.noSync', 'Sin sincronizar')}</span>
      )}
    </span>
  );
}

interface AdsSyncStatusLineProps {
  google?: AdsLastSyncInfo | null;
  meta?: AdsLastSyncInfo | null;
  googleConnected?: boolean;
  metaConnected?: boolean;
  /** Si true, apila Google y Meta; si false, solo muestra la plataforma activa + la otra en muted */
  layout?: 'stack' | 'inline';
  primaryPlatform?: 'google' | 'meta';
}

export function AdsSyncStatusLine({
  google,
  meta,
  googleConnected = true,
  metaConnected = true,
  layout = 'stack',
  primaryPlatform = 'google',
}: AdsSyncStatusLineProps) {
  const { t } = useTranslation();

  const primary =
    primaryPlatform === 'google'
      ? { label: t('ads.google', 'Google Ads'), info: google, connected: googleConnected }
      : { label: t('ads.meta', 'Meta Ads'), info: meta, connected: metaConnected };

  const secondary =
    primaryPlatform === 'google'
      ? { label: t('ads.meta', 'Meta Ads'), info: meta, connected: metaConnected }
      : { label: t('ads.google', 'Google Ads'), info: google, connected: googleConnected };

  if (layout === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <PlatformSyncLine {...primary} />
        {secondary.connected && (
          <>
            <span className="text-slate-300">·</span>
            <PlatformSyncLine {...secondary} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <PlatformSyncLine {...primary} />
      </div>
      {secondary.connected && (
        <div className="pl-5">
          <PlatformSyncLine {...secondary} />
        </div>
      )}
    </div>
  );
}
