import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CalendarPreview() {
  const { t, i18n } = useTranslation('landing');
  const isEn = i18n.language.startsWith('en');
  const m = isEn ? 'Dec' : 'dic';
  const prefix = t('demo.weekShort'); // S or W

  interface WeekData {
    week: string;
    dates: string;
    estimated?: number;
    real?: number;
    computed?: number;
    gain?: number;
    loss?: number;
    status: 'completed' | 'pending' | 'free';
    capacity: number;
    used: number;
    pending?: number;
  }

  const weeks: WeekData[] = [
    {
      week: `${prefix}1`,
      dates: `1-5 ${m}`,
      estimated: 42,
      real: 31.5,
      computed: 32,
      gain: 0.5,
      status: 'completed',
      capacity: 40,
      used: 42,
      pending: 1
    },
    {
      week: `${prefix}2`,
      dates: `8-12 ${m}`,
      estimated: 30,
      status: 'pending',
      capacity: 40,
      used: 30
    },
    {
      week: `${prefix}3`,
      dates: `15-19 ${m}`,
      estimated: 42,
      real: 41.5,
      computed: 40,
      loss: 1.5,
      status: 'completed',
      capacity: 40,
      used: 42
    },
    {
      week: `${prefix}4`,
      dates: `22-26 ${m}`,
      status: 'free',
      capacity: 40,
      used: 0
    },
    {
      week: `${prefix}5`,
      dates: `29-31 ${m}`,
      status: 'free',
      capacity: 40,
      used: 0
    }
  ];

  const totalMonth = weeks.reduce((sum, w) => sum + (w.used || 0), 0);
  const totalCapacity = weeks.reduce((sum, w) => sum + w.capacity, 0);
  const monthPercentage = Math.round((totalMonth / totalCapacity) * 100);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 px-3 sm:px-6 py-3 sm:py-4">
        <h3 className="text-base sm:text-xl font-bold text-slate-900">{t('demo.myCalendar')}</h3>
      </div>

      {/* User Profile */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className="h-8 w-8 sm:h-12 sm:w-12 border-2 border-indigo-200">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-xs sm:text-sm">
              MA
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-slate-900 text-sm sm:text-base">María González</div>
            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">{t('demo.profileRole')}</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid - Scroll horizontal en mobile sin desbordar la página */}
      <div className="p-3 sm:p-6 bg-slate-50 overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden max-w-full sm:max-w-none sm:overflow-visible custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="grid grid-cols-6 gap-2 sm:gap-3 min-w-[520px] sm:min-w-0 w-max sm:w-auto mx-auto">
          {/* Week Headers */}
          {weeks.map((week) => (
            <div key={week.week} className="text-center">
              <div className="text-[10px] sm:text-xs font-bold text-slate-600 mb-0.5 sm:mb-1">{week.week}</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500">{week.dates}</div>
            </div>
          ))}
          <div className="text-center">
            <div className="text-[10px] sm:text-xs font-bold text-slate-600 mb-0.5 sm:mb-1 uppercase">{t('demo.totalMonth')}</div>
          </div>

          {/* Week Cards */}
          {weeks.map((week) => {
            const percentage = Math.round((week.used / week.capacity) * 100);
            const isOver = week.used > week.capacity;
            
            return (
              <div
                key={week.week}
                className={cn(
                  "rounded-lg border-2 p-2 sm:p-3 space-y-1 sm:space-y-2 transition-all hover:shadow-md",
                  week.status === 'completed' && !isOver
                    ? "bg-emerald-50 border-emerald-200"
                    : week.status === 'pending'
                    ? "bg-amber-50 border-amber-200"
                    : "bg-slate-100 border-slate-300"
                )}
              >
                {/* Progress Bar */}
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={cn(
                    "h-1 sm:h-1.5",
                    isOver ? "[&>div]:bg-red-500" :
                    week.status === 'completed' ? "[&>div]:bg-emerald-500" :
                    week.status === 'pending' ? "[&>div]:bg-amber-500" :
                    "[&>div]:bg-slate-400"
                  )}
                />

                {/* Estimated Hours */}
                {week.estimated > 0 && (
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <div className="flex items-center gap-0.5 sm:gap-1 text-slate-600">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">{t('demo.est')}</span>
                      <span className="sm:hidden">{t('demo.est')[0]}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 text-[10px] sm:text-xs">{week.estimated}h</span>
                  </div>
                )}

                {/* Real and Computed - Ocultar en mobile muy pequeño */}
                {week.real !== undefined && week.computed !== undefined && (
                  <div className="text-[9px] sm:text-xs space-y-0.5 hidden sm:block">
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t('demo.real')}</span>
                      <span className="font-mono font-semibold text-blue-700">{week.real}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t('demo.comp')}</span>
                      <span className="font-mono font-semibold text-emerald-700">{week.computed}h</span>
                    </div>
                  </div>
                )}

                {/* Gain/Loss Badge */}
                {week.gain !== undefined && (
                  <Badge className="w-full justify-center bg-emerald-500 text-white border-0 text-[9px] sm:text-[10px] py-0.5 sm:py-1 px-1">
                    <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">{t('demo.gain')} +{week.gain}h</span>
                    <span className="sm:hidden">+{week.gain}h</span>
                  </Badge>
                )}
                {week.loss !== undefined && (
                  <Badge className="w-full justify-center bg-red-500 text-white border-0 text-[9px] sm:text-[10px] py-0.5 sm:py-1 px-1">
                    <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">{t('demo.loss')} {week.loss}h</span>
                    <span className="sm:hidden">{week.loss}h</span>
                  </Badge>
                )}

                {/* Free Status */}
                {week.status === 'free' && (
                  <div className="text-center text-[10px] sm:text-xs font-medium text-slate-500 py-1 sm:py-2 uppercase">
                    {t('demo.free')}
                  </div>
                )}

                {/* Pending Tasks */}
                {week.pending && (
                  <div className="text-[9px] sm:text-[10px] text-amber-600 font-medium">
                    +{week.pending} {t('demo.pending')}
                  </div>
                )}

                {/* Bottom Status */}
                <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-slate-200">
                  {week.status === 'completed' && !isOver ? (
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                  )}
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-mono font-bold",
                    isOver ? "text-red-600" :
                    week.status === 'completed' ? "text-emerald-600" :
                    "text-amber-600"
                  )}>
                    {week.used}/{week.capacity}h
                  </span>
                </div>
              </div>
            );
          })}

          {/* Total Month Card */}
          <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-2 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2">
            <div className="text-lg sm:text-2xl font-bold text-emerald-700">{totalMonth}h</div>
            <div className="text-[10px] sm:text-xs text-slate-600">/ {totalCapacity}h</div>
            <div className="text-xs sm:text-sm font-bold text-emerald-600">{monthPercentage}%</div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
