import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MyWeekView } from '@/components/employee/MyWeekView';
import { PriorityInsights, ProjectTeamPulse } from '@/components/employee/DashboardWidgets';
import { ReliabilityIndexCard } from '@/components/employee/ReliabilityIndexCard';
import { PlanningInconsistenciesCard } from '@/components/employee/PlanningInconsistenciesCard';
import { CollaborationCards } from '@/components/employee/CollaborationCards';
import { MonthlyBalanceCard } from '@/components/employee/MonthlyBalanceCard';
import { LoadIndicator } from '@/components/shared/LoadIndicator';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeRow } from '@/components/planner/EmployeeRow';
import { MobilePlannerView } from '@/components/planner/MobilePlannerView';
import { AllocationSheet } from '@/components/planner/AllocationSheet';
import { getWeeksForMonth, getMonthName } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, ListPlus } from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function DemoEmployeeDashboard() {
  const {
    employees, allocations, absences, teamEvents, projects,
    getEmployeeMonthlyLoad,
    currentUser
  } = useDemo();
  const isMobile = useIsMobile();
  const { t, i18n } = useTranslation('landing');
  const dateLocale = i18n.language.startsWith('en') ? enUS : es;

  const demoEmployee = currentUser || employees[0];
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; weekStart: Date } | null>(null);
  const [activeTab, setActiveTab] = useState('dependencies');

  const weeks = useMemo(() => getWeeksForMonth(currentMonth), [currentMonth]);
  const gridTemplate = `250px repeat(${weeks.length}, minmax(0, 1fr)) 100px`;
  const monthlyLoad = getEmployeeMonthlyLoad(demoEmployee.id, currentMonth.getFullYear(), currentMonth.getMonth());

  const handlePrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const handleToday = () => setCurrentMonth(new Date());

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-20">
      {/* Banner demo */}
      <p className="text-xs text-slate-500 text-center sm:text-left">{t('demo.banner')}</p>

      {/* CONTROL MES */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 p-3 rounded-lg border border-slate-200 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold capitalize text-slate-800 flex items-center gap-2">
            {getMonthName(currentMonth)}
            <Badge variant="secondary" className="font-normal text-slate-500 bg-slate-100">{currentMonth.getFullYear()}</Badge>
          </h2>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
          <Button variant="ghost" size="icon" className={cn('h-7 w-7', isMobile && 'h-11 w-11 min-h-[44px]')} onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={handleToday} className={cn('h-7 text-xs px-2', isMobile && 'h-11 min-h-[44px] text-sm px-3')} aria-label={t('demo.currentMonth')}>{t('demo.currentMonth')}</Button>
          <Button variant="ghost" size="icon" className={cn('h-7 w-7', isMobile && 'h-11 w-11 min-h-[44px]')} onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* CALENDARIO */}
      {isMobile ? (
        <div className="space-y-3">
          <MobilePlannerView
            filteredEmployees={[demoEmployee]}
            weeks={weeks}
            allocations={allocations}
            viewDate={currentMonth}
            getEmployeeMonthlyLoad={getEmployeeMonthlyLoad}
            onOpenSheet={(empId, date) => setSelectedCell({ employeeId: empId, weekStart: date })}
          />
        </div>
      ) : (
        <Card className="overflow-hidden border-indigo-100 shadow-sm">
          <div className="overflow-x-auto custom-scrollbar w-full">
            <div className="grid bg-slate-50/50 border-b" style={{ gridTemplateColumns: gridTemplate }}>
              <div className="px-4 py-3 font-bold text-sm text-slate-700 flex items-center border-r sticky left-0 z-20 bg-slate-50">{t('demo.myCalendar')}</div>
              {weeks.map((week, index) => {
                const effectiveStart = week.effectiveStart || week.weekStart;
                const effectiveEnd = week.effectiveEnd || addDays(week.weekStart, 6);
                const workingDays: Date[] = [];
                let currentDay = new Date(effectiveStart);
                while (currentDay <= effectiveEnd) {
                  const dayOfWeek = currentDay.getDay();
                  if (dayOfWeek >= 1 && dayOfWeek <= 5) workingDays.push(new Date(currentDay));
                  currentDay = addDays(currentDay, 1);
                }
                const firstWorkingDay = workingDays[0];
                const lastWorkingDay = workingDays[workingDays.length - 1];
                const weekDateLabel = firstWorkingDay && lastWorkingDay
                  ? `${format(firstWorkingDay, 'd', { locale: dateLocale })}-${format(lastWorkingDay, 'd MMM', { locale: dateLocale })}`
                  : `${format(effectiveStart, 'd', { locale: dateLocale })}-${format(effectiveEnd, 'd MMM', { locale: dateLocale })}`;
                return (
                  <div key={week.weekStart.toISOString()} className="text-center px-1 py-2 border-r flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase text-slate-500">{t('demo.weekShort')}{index + 1}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{weekDateLabel}</span>
                  </div>
                );
              })}
              <div className="px-2 py-3 font-bold text-xs text-center flex items-center justify-center">{t('demo.total')}</div>
            </div>
            <div className="grid bg-white" style={{ gridTemplateColumns: gridTemplate }}>
              <EmployeeRow
                employee={demoEmployee}
                weeks={weeks}
                projects={projects}
                allocations={allocations}
                absences={absences}
                teamEvents={teamEvents}
                viewDate={currentMonth}
                onOpenSheet={(empId, date) => setSelectedCell({ employeeId: empId, weekStart: date })}
              />
              <div className="flex items-center justify-center border-l p-2 bg-white">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-slate-800">{monthlyLoad.hours}h</span>
                  <span className="text-[10px] text-slate-400 font-medium">/ {monthlyLoad.capacity}h</span>
                  <span className={cn(
                    'text-[10px] font-bold mt-1 px-1.5 rounded-full',
                    monthlyLoad.status === 'overload' ? 'text-red-600 bg-red-50' :
                      monthlyLoad.status === 'warning' ? 'text-amber-600 bg-amber-50' :
                        monthlyLoad.status === 'healthy' ? 'text-emerald-600 bg-emerald-50' :
                          'text-slate-400 bg-slate-50'
                  )}>{monthlyLoad.percentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* PESTAÑAS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-white border border-slate-200 flex-nowrap overflow-x-auto custom-scrollbar gap-2 min-w-0">
          <TabsTrigger value="dependencies" className="px-4 py-2 min-h-[44px] data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 shrink-0">
            <AlertCircle className="h-4 w-4 mr-2" /> {t('demo.tabDependencies')}
          </TabsTrigger>
          <TabsTrigger value="projects" className="px-4 py-2 min-h-[44px] data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 shrink-0">
            <ListPlus className="h-4 w-4 mr-2" /> {t('demo.tabProjects')}
          </TabsTrigger>
          <TabsTrigger value="coherence" className="px-4 py-2 min-h-[44px] data-[state=active]:bg-red-50 data-[state=active]:text-red-700 shrink-0">
            <CheckCircle2 className="h-4 w-4 mr-2" /> {t('demo.tabPlanning')}
          </TabsTrigger>
          <TabsTrigger value="teammates" className="px-4 py-2 min-h-[44px] shrink-0">{t('demo.tabTeammates')}</TabsTrigger>
          <TabsTrigger value="metrics" className="px-4 py-2 min-h-[44px] shrink-0">{t('demo.tabMetrics')}</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="dependencies" className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriorityInsights employeeId={demoEmployee.id} viewDate={currentMonth} />
              <ProjectTeamPulse employeeId={demoEmployee.id} viewDate={currentMonth} />
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4 focus-visible:outline-none">
            <MyWeekView employeeId={demoEmployee.id} viewDate={currentMonth} />
          </TabsContent>

          <TabsContent value="coherence" className="focus-visible:outline-none min-w-0">
            <PlanningInconsistenciesCard employeeId={demoEmployee.id} viewDate={currentMonth} isManager={false} />
          </TabsContent>

          <TabsContent value="teammates" className="focus-visible:outline-none">
            <CollaborationCards employeeId={demoEmployee.id} viewDate={currentMonth} />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6 focus-visible:outline-none">
            <MonthlyBalanceCard employeeId={demoEmployee.id} viewDate={currentMonth} />
            <ReliabilityIndexCard employeeId={demoEmployee.id} viewDate={currentMonth} />
          </TabsContent>
        </div>
      </Tabs>

      {/* MODAL AllocationSheet */}
      {selectedCell && (
        <AllocationSheet
          open={!!selectedCell}
          onOpenChange={(open) => !open && setSelectedCell(null)}
          employeeId={selectedCell.employeeId}
          weekStart={selectedCell.weekStart.toISOString()}
          viewDateContext={currentMonth}
        />
      )}
    </div>
  );
}
