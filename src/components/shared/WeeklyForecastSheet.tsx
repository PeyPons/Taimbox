import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp } from 'lucide-react';
import { format, startOfMonth, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { MonthlyEvolutionChart } from '@/components/employee/MonthlyEvolutionChart';
import { getWeeksForMonth } from '@/utils/dateUtils';

interface WeeklyForecastSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialViewDate?: Date;
}

export function WeeklyForecastSheet({ open, onOpenChange, initialViewDate }: WeeklyForecastSheetProps) {
  const { projects, allocations, employees } = useApp();
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialViewDate) return initialViewDate;
    const saved = localStorage.getItem('forecast_date');
    return saved ? new Date(saved) : new Date();
  });

  useEffect(() => {
    if (initialViewDate) {
      setCurrentMonth(initialViewDate);
    }
  }, [initialViewDate]);

  useEffect(() => {
    localStorage.setItem('forecast_date', currentMonth.toISOString());
  }, [currentMonth]);

  const weeks = getWeeksForMonth(currentMonth);

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentMonth(new Date());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-[95vw] overflow-y-auto px-6 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl border-l shadow-2xl pt-10"
      >
        <SheetHeader className="pb-6 border-b mb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Previsión mensual (Weekly Forecast)
          </SheetTitle>
          <SheetDescription>
            Seguimiento de horas contratadas y redistribución de carga
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Control de mes */}
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm w-fit">
            <h2 className="text-lg font-bold capitalize text-slate-900 flex items-center gap-2 ml-2">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleToday} className="h-7 text-xs px-2">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />Mes actual
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Gráfico de Evolución Mensual */}
          <MonthlyEvolutionChart
            currentMonth={currentMonth}
            weeks={weeks}
            allocations={allocations}
            projects={projects}
            employees={employees}
          />

          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-slate-600">
              Para ver el contenido completo de Weekly Forecast (semáforo de proyectos, feed de bloqueos, redistribución), 
              accede a la página completa desde el menú de navegación.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
