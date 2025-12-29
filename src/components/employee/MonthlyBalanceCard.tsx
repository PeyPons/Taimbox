import { useMemo, memo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isSameMonth, parseISO } from 'date-fns';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { Rocket, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthlyBalanceCardProps {
  employeeId: string;
  viewDate: Date;
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const MonthlyBalanceCard = memo(function MonthlyBalanceCard({ employeeId, viewDate }: MonthlyBalanceCardProps) {
  const { allocations } = useApp();

  // Allocations completadas del mes para este empleado
  const monthlyStats = useMemo(() => {
    const monthlyAllocations = allocations.filter(a => 
      a.employeeId === employeeId && 
      isAllocationInEffectiveMonth(a.weekStartDate, viewDate)
    );
    
    const completed = monthlyAllocations.filter(a => a.status === 'completed');
    const totalReal = completed.reduce((sum, a) => sum + (a.hoursActual || 0), 0);
    const totalComputed = completed.reduce((sum, a) => sum + (a.hoursComputed || 0), 0);
    
    return {
      totalReal: round2(totalReal),
      totalComputed: round2(totalComputed),
      hasData: completed.length > 0 && totalComputed > 0
    };
  }, [allocations, employeeId, viewDate]);

  const monthlyBalance = round2(monthlyStats.totalComputed - monthlyStats.totalReal);
  const isPositiveBalance = monthlyBalance >= 0;

  // Si no hay datos, mostrar ejemplo
  if (!monthlyStats.hasData) {
    return (
      <Card className="border-l-4 overflow-hidden border-l-emerald-500 bg-gradient-to-r from-emerald-50/80 to-emerald-50/30 relative" data-tour="balance-card">
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
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600">3h</p>
                <p className="text-[10px] text-blue-500 font-medium">Dedicadas</p>
              </div>
              <div className="text-slate-300 text-lg">→</div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-600">9h</p>
                <p className="text-[10px] text-emerald-500 font-medium">Computadas</p>
              </div>
              <div className="text-slate-300 text-lg">=</div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-600">+6h</p>
                <p className="text-[10px] font-medium text-emerald-500">Valor extra</p>
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
      isPositiveBalance 
        ? "border-l-emerald-500 bg-gradient-to-r from-emerald-50/80 to-emerald-50/30" 
        : "border-l-amber-500 bg-gradient-to-r from-amber-50/80 to-amber-50/30"
    )} data-tour="balance-card">
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {isPositiveBalance ? (
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
                {isPositiveBalance 
                  ? "¡Qué buen ritmo llevas! 🎉" 
                  : "Sincronizando tiempos..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {isPositiveBalance 
                  ? `Has aportado ${monthlyBalance}h de valor extra que el cliente agradecerá.`
                  : `Estamos ajustando las horas a tu ritmo real. ¡Todo bien!`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xl font-bold text-blue-600">{monthlyStats.totalReal}h</p>
              <p className="text-[10px] text-blue-500 font-medium">Dedicadas</p>
            </div>
            <div className="text-slate-300 text-lg">→</div>
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-600">{monthlyStats.totalComputed}h</p>
              <p className="text-[10px] text-emerald-500 font-medium">Computadas</p>
            </div>
            {monthlyBalance !== 0 && (
              <>
                <div className="text-slate-300 text-lg">=</div>
                <div className="text-center">
                  <p className={cn(
                    "text-xl font-bold",
                    isPositiveBalance ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {isPositiveBalance ? '+' : ''}{monthlyBalance}h
                  </p>
                  <p className={cn(
                    "text-[10px] font-medium",
                    isPositiveBalance ? "text-emerald-500" : "text-amber-500"
                  )}>
                    {isPositiveBalance ? 'Valor extra' : 'Ajuste'}
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
