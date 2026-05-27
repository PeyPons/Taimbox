import { Link } from 'react-router-dom';
import { Clock, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ActiveTimerSidebarState } from '@/hooks/useActiveTimerForSidebar';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface SidebarTimerPanelProps {
  activeTimer: ActiveTimerSidebarState;
  formattedLiveTime: string;
  timesHref: string | null;
  timesActive: boolean;
  onStop: () => void | Promise<void>;
}

export function SidebarTimerPanel({
  activeTimer,
  formattedLiveTime,
  timesHref,
  timesActive,
  onStop,
}: SidebarTimerPanelProps) {
  const { t } = useAppTranslation();

  if (activeTimer.isActive) {
    const title =
      (activeTimer.taskName || t('sidebar.timer.taskInProgress', 'Tarea en curso')) +
      (activeTimer.clientName
        ? ` · ${t('sidebar.timer.client', 'Cliente:')} ${activeTimer.clientName}`
        : '');

    return (
      <div
        className="mb-3 rounded-md overflow-hidden bg-gradient-to-br from-emerald-950/50 to-slate-800/30 ring-1 ring-emerald-500/25"
        role="status"
        aria-live="polite"
        aria-label={t('sidebar.timer.trackingAria', 'Cronómetro en curso')}
      >
        <div className="flex items-stretch min-w-0">
          <div className="w-1 shrink-0 bg-emerald-400" aria-hidden />
          <div className="min-w-0 flex-1 px-3 py-2.5 space-y-2">
            <div className="flex items-start gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0 mt-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
                  {t('sidebar.timer.tracking', 'En curso')}
                </p>
                <p className="text-xs font-medium text-slate-100 truncate leading-snug" title={title}>
                  {activeTimer.taskName || t('sidebar.timer.taskInProgress', 'Tarea en curso')}
                </p>
                {activeTimer.clientName && (
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{activeTimer.clientName}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pl-4">
              <span className="text-xl font-mono font-semibold tabular-nums tracking-tight text-emerald-300">
                {formattedLiveTime}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-950/50 text-xs shrink-0"
                onClick={() => void onStop()}
              >
                <Square className="h-3 w-3 fill-current mr-1" />
                {t('sidebar.timer.stop', 'Parar')}
              </Button>
            </div>

            <p className="text-[10px] text-slate-500 pl-4">
              {t('sidebar.timer.todayTotal', 'Hoy en total:')}{' '}
              <span className="font-mono tabular-nums text-slate-400">
                {activeTimer.formattedTodayCompact}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const idleContent = (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <Clock
          className={cn(
            'h-4 w-4 shrink-0',
            timesActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
          )}
        />
        <span
          className={cn(
            'text-xs font-medium truncate',
            timesActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
          )}
        >
          {t('sidebar.timer.todayLabel', 'Hoy')}
        </span>
      </div>
      <span
        className={cn(
          'font-mono text-sm font-semibold tabular-nums shrink-0',
          timesActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-100'
        )}
        title={activeTimer.formattedTimeLabel}
      >
        {activeTimer.formattedTodayCompact}
      </span>
    </>
  );

  const idleClassName = cn(
    'mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-md transition-colors min-w-0',
    timesActive
      ? 'bg-primary text-white shadow-md shadow-indigo-900/20'
      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 group'
  );

  if (timesHref) {
    return (
      <Link to={timesHref} className={idleClassName} title={t('sidebar.timer.viewTimes', 'Ver tiempos')}>
        {idleContent}
      </Link>
    );
  }

  return (
    <div className={idleClassName} title={activeTimer.formattedTimeLabel}>
      {idleContent}
    </div>
  );
}
