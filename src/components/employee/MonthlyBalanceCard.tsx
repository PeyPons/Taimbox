import { useMemo, memo } from 'react';
import { useAppOrDemo } from '@/hooks/useAppOrDemo';
import { useAgency } from '@/contexts/AgencyContext';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { Rocket, RefreshCw, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlanningDeltaHours } from '@/utils/hoursTracking';

interface MonthlyBalanceCardProps {
  employeeId: string;
  viewDate: Date;
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const MonthlyBalanceCard = memo(function MonthlyBalanceCard({ employeeId, viewDate }: MonthlyBalanceCardProps) {
  const { t } = useAppTranslation();
  const { allocations } = useAppOrDemo();
  const { currentAgency } = useAgency();
  const preference = currentAgency?.settings?.hoursTrackingPreference;

  const monthlyStats = useMemo(() => {
    const monthlyAllocations = allocations.filter(a =>
      a.employeeId === employeeId &&
      isAllocationInEffectiveMonth(a.weekStartDate, viewDate)
    );

    const completed = monthlyAllocations.filter(a => a.status === 'completed');
    const totalReal = round2(completed.reduce((sum, a) => sum + (a.hoursActual || 0), 0));
    const totalComputed = round2(completed.reduce((sum, a) => sum + (a.hoursComputed || 0), 0));
    const totalEstimatedClosed = round2(completed.reduce((sum, a) => sum + (a.hoursAssigned || 0), 0));
    const planDeltaSum = round2(
      completed.reduce((sum, a) => sum + (getPlanningDeltaHours(a, preference) ?? 0), 0)
    );

    const hasCompletedWithReal = completed.some(a => (a.hoursActual ?? 0) > 0);
    const hasData =
      completed.length > 0 &&
      (preference === 'actual'
        ? hasCompletedWithReal
        : hasCompletedWithReal || totalComputed > 0);

    return {
      totalReal,
      totalComputed,
      totalEstimatedClosed,
      planDeltaSum,
      hasData,
    };
  }, [allocations, employeeId, viewDate, preference]);

  const isActualMode = preference === 'actual';
  const monthlyBalance = isActualMode
    ? monthlyStats.planDeltaSum
    : round2(monthlyStats.totalComputed - monthlyStats.totalReal);
  const isPositiveBalance = monthlyBalance >= 0;

  const mb = (key: string, fallback: string, opts?: Record<string, unknown>) =>
    t(`team.dashboard.monthlyBalance.${key}`, fallback, opts);

  if (!monthlyStats.hasData) {
    return (
      <Card className="border-l-4 overflow-hidden border-l-emerald-500 bg-gradient-to-r from-emerald-50/80 to-emerald-50/30 relative" data-tour="monthly-balance">
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="text-[9px] bg-amber-50 border-amber-200 text-amber-700">
            {mb('exampleBadge', 'Example')}
          </Badge>
        </div>
        <CardContent className="py-4 px-5 opacity-75">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-base">
                  {mb('demoTitle', 'Great pace! 🎉')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mb('demoSubtitle', 'You contributed 6h of extra value the client will appreciate.')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 flex-wrap mt-2 sm:mt-0">
              <div className="text-center min-w-[50px]">
                <p className="text-lg sm:text-xl font-bold text-blue-600">3h</p>
                <p className="text-[9px] sm:text-[10px] text-blue-500 font-medium">{mb('dedicated', 'Logged')}</p>
              </div>
              <div className="text-slate-300 text-base sm:text-lg">→</div>
              <div className="text-center min-w-[50px]">
                <p className="text-lg sm:text-xl font-bold text-emerald-600">9h</p>
                <p className="text-[9px] sm:text-[10px] text-emerald-500 font-medium">{mb('computed', 'Computed')}</p>
              </div>
              <div className="text-slate-300 text-base sm:text-lg">=</div>
              <div className="text-center min-w-[50px]">
                <p className="text-lg sm:text-xl font-bold text-emerald-600">+6h</p>
                <p className="text-[9px] sm:text-[10px] font-medium text-emerald-500">{mb('extraValue', 'Extra value')}</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3">
            {mb('demoFootnote', 'This is an example. Complete tasks to see your real balance.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const title = isActualMode
    ? monthlyBalance === 0
      ? mb('actualAligned', 'Plan and actual aligned')
      : isPositiveBalance
        ? mb('actualUnder', 'Below estimate')
        : mb('actualOver', 'Above estimate')
    : isPositiveBalance
      ? mb('computedGoodPace', 'Great pace! 🎉')
      : mb('computedSyncing', 'Syncing times...');

  const subtitle = isActualMode
    ? monthlyBalance === 0
      ? mb('actualAlignedDesc', 'On closed tasks this month, logged time matches the estimate.')
      : isPositiveBalance
        ? mb('actualUnderDesc', 'On closed tasks you logged {{hours}}h less than estimated overall. You can adjust the plan if you want.', { hours: Math.abs(monthlyBalance) })
        : mb('actualOverDesc', 'On closed tasks you logged {{hours}}h more than estimated. Review the planner or planning control.', { hours: Math.abs(monthlyBalance) })
    : isPositiveBalance
      ? mb('computedExtraDesc', 'You contributed {{hours}}h of extra value the client will appreciate.', { hours: monthlyBalance })
      : mb('computedAdjustingDesc', 'We are adjusting hours to your real pace. All good!');

  return (
    <Card className={cn(
      "border-l-4 overflow-hidden",
      monthlyBalance === 0
        ? "border-l-slate-400 bg-gradient-to-r from-slate-50/90 to-slate-50/40"
        : isPositiveBalance
          ? "border-l-emerald-500 bg-gradient-to-r from-emerald-50/80 to-emerald-50/30"
          : "border-l-amber-500 bg-gradient-to-r from-amber-50/80 to-amber-50/30"
    )} data-tour="monthly-balance">
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {monthlyBalance === 0 ? (
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-slate-600" />
              </div>
            ) : isPositiveBalance ? (
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-emerald-600" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-amber-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800 text-base">{title}</p>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 flex-wrap mt-2 sm:mt-0">
            <div className="text-center min-w-[50px]">
              <p className="text-lg sm:text-xl font-bold text-blue-600">{monthlyStats.totalReal}h</p>
              <p className="text-[9px] sm:text-[10px] text-blue-500 font-medium">{mb('dedicated', 'Logged')}</p>
            </div>
            <div className="text-slate-300 text-base sm:text-lg">→</div>
            <div className="text-center min-w-[50px]">
              <p className={cn(
                "text-lg sm:text-xl font-bold",
                isActualMode ? "text-slate-700" : "text-emerald-600"
              )}>
                {isActualMode ? monthlyStats.totalEstimatedClosed : monthlyStats.totalComputed}h
              </p>
              <p className={cn(
                "text-[9px] sm:text-[10px] font-medium",
                isActualMode ? "text-slate-500" : "text-emerald-500"
              )}>
                {isActualMode ? mb('estimatedClosed', 'Estimated (closed)') : mb('computed', 'Computed')}
              </p>
            </div>
            {monthlyBalance !== 0 && (
              <>
                <div className="text-slate-300 text-base sm:text-lg">=</div>
                <div className="text-center min-w-[50px]">
                  <p className={cn(
                    "text-lg sm:text-xl font-bold",
                    isPositiveBalance ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {isPositiveBalance ? '+' : ''}{monthlyBalance}h
                  </p>
                  <p className={cn(
                    "text-[9px] sm:text-[10px] font-medium",
                    isPositiveBalance ? "text-emerald-500" : "text-amber-500"
                  )}>
                    {isActualMode
                      ? mb('vsPlan', 'vs plan')
                      : isPositiveBalance
                        ? mb('extraValue', 'Extra value')
                        : mb('adjustment', 'Adjustment')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
