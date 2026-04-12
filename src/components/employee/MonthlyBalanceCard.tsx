import { useMemo, memo } from 'react';
import { useAppOrDemo } from '@/hooks/useAppOrDemo';
import { useAgency } from '@/contexts/AgencyContext';
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

  if (!monthlyStats.hasData) {
    return (
      <Card className="border-l-4 overflow-hidden border-l-emerald-500 bg-gradient-to-r from-emerald-50/80 to-emerald-50/30 relative" data-tour="monthly-balance">
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="text-[9px] bg-amber-50 border-amber-200 text-amber-700">
            Ejemplo
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
                  ¡Qué buen ritmo llevas! 🎉
                </p>
                <p className="text-sm text-muted-foreground">
                  Has aportado 6h de valor extra que el cliente agradecerá.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 flex-wrap mt-2 sm:mt-0">
              <div className="text-center min-w-[50px]">
                <p className="text-lg sm:text-xl font-bold text-blue-600">3h</p>
                <p className="text-[9px] sm:text-[10px] text-blue-500 font-medium">Dedicadas</p>
              </div>
              <div className="text-slate-300 text-base sm:text-lg">→</div>
              <div className="text-center min-w-[50px]">
                <p className="text-lg sm:text-xl font-bold text-emerald-600">9h</p>
                <p className="text-[9px] sm:text-[10px] text-emerald-500 font-medium">Computadas</p>
              </div>
              <div className="text-slate-300 text-base sm:text-lg">=</div>
              <div className="text-center min-w-[50px]">
                <p className="text-lg sm:text-xl font-bold text-emerald-600">+6h</p>
                <p className="text-[9px] sm:text-[10px] font-medium text-emerald-500">Valor extra</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3">
            Esto es un ejemplo. Completa tareas para ver tu balance real.
          </p>
        </CardContent>
      </Card>
    );
  }

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
              <p className="font-semibold text-slate-800 text-base">
                {isActualMode ? (
                  monthlyBalance === 0
                    ? "Plan y real alineados"
                    : isPositiveBalance
                      ? "Por debajo de lo estimado"
                      : "Por encima de lo estimado"
                ) : (
                  isPositiveBalance
                    ? "¡Qué buen ritmo llevas! 🎉"
                    : "Sincronizando tiempos..."
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {isActualMode ? (
                  monthlyBalance === 0
                    ? "En las tareas cerradas del mes, el tiempo dedicado coincide con lo estimado."
                    : isPositiveBalance
                      ? `En cerradas has dedicado ${Math.abs(monthlyBalance)}h menos de lo estimado en conjunto. Puedes reajustar el plan si quieres.`
                      : `En cerradas has dedicado ${Math.abs(monthlyBalance)}h más de lo estimado. Revisa el planificador o el control de planificación.`
                ) : (
                  isPositiveBalance
                    ? `Has aportado ${monthlyBalance}h de valor extra que el cliente agradecerá.`
                    : `Estamos ajustando las horas a tu ritmo real. ¡Todo bien!`
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 flex-wrap mt-2 sm:mt-0">
            <div className="text-center min-w-[50px]">
              <p className="text-lg sm:text-xl font-bold text-blue-600">{monthlyStats.totalReal}h</p>
              <p className="text-[9px] sm:text-[10px] text-blue-500 font-medium">Dedicadas</p>
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
                {isActualMode ? 'Estimado (cerradas)' : 'Computadas'}
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
                    {isActualMode ? 'vs plan' : isPositiveBalance ? 'Valor extra' : 'Ajuste'}
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
