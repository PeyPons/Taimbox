import { useState, useEffect, useMemo } from 'react';
import { EmployeeRow } from './EmployeeRow';
import { AllocationSheet } from './AllocationSheet';
import { MobilePlannerView } from './MobilePlannerView';
import { PlannerGridToolbar } from './PlannerGridToolbar';
import { useIsMobile, useIsWideLayout } from '@/hooks/use-mobile';
import { PendingTransfersPanel } from '@/components/transfers/TaskTransferComponents';
import { usePlannerData } from '@/hooks/usePlannerData';
import { getMonthName, isCurrentWeek } from '@/utils/dateUtils';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const EMPLOYEE_COL_WIDE = 180;
const EMPLOYEE_COL_NARROW = 168;
const WEEK_COL_MIN = 116;
const TOTAL_COL = 72;

export function PlannerGrid() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showOnlyMe, setShowOnlyMe] = useState(() => localStorage.getItem('planner_only_me') === 'true');
  const [openEmployeeCombo, setOpenEmployeeCombo] = useState(false);
  const [openProjectCombo, setOpenProjectCombo] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; weekStart: Date; autoAdd?: boolean } | null>(null);
  const isMobile = useIsMobile();
  const isWideLayout = useIsWideLayout();

  const {
    currentMonth,
    weeks,
    year,
    month,
    isLoadingMonth,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    filteredEmployees,
    sortedProjects,
    sortedEmployees,
    employees,
    projects,
    allocations,
    absences,
    teamEvents,
    getEmployeeMonthlyLoad,
  } = usePlannerData({ showOnlyMe, selectedEmployeeId, selectedProjectId });

  useEffect(() => {
    localStorage.setItem('planner_only_me', String(showOnlyMe));
  }, [showOnlyMe]);

  const handleCellClick = (employeeId: string, weekStart: Date, autoAdd?: boolean) =>
    setSelectedCell({ employeeId, weekStart, autoAdd });

  const employeeColWidth = isWideLayout ? EMPLOYEE_COL_WIDE : EMPLOYEE_COL_NARROW;
  const weekColTemplate = isWideLayout
    ? `repeat(${weeks.length}, minmax(${WEEK_COL_MIN}px, 1fr))`
    : `repeat(${weeks.length}, ${WEEK_COL_MIN}px)`;

  const gridTemplate = `${employeeColWidth}px ${weekColTemplate} ${TOTAL_COL}px`;

  const gridMinWidth = useMemo(
    () => employeeColWidth + weeks.length * WEEK_COL_MIN + TOTAL_COL,
    [employeeColWidth, weeks.length]
  );

  const toolbarProps = {
    currentMonth,
    year,
    onPrevMonth: goToPrevMonth,
    onNextMonth: goToNextMonth,
    onToday: goToToday,
    selectedEmployeeId,
    selectedProjectId,
    employees: employees || [],
    projects: projects || [],
    sortedEmployees,
    sortedProjects,
    onSelectEmployee: setSelectedEmployeeId,
    onSelectProject: setSelectedProjectId,
    showOnlyMe,
    onToggleShowOnlyMe: () => setShowOnlyMe(!showOnlyMe),
    openEmployeeCombo,
    setOpenEmployeeCombo,
    openProjectCombo,
    setOpenProjectCombo,
  };

  if (isLoadingMonth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-slate-500 dark:text-slate-400">Cargando {getMonthName(currentMonth)}...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 rounded-lg border shadow-sm overflow-hidden">
      <PlannerGridToolbar {...toolbarProps} />

      {isMobile ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-2 py-1 shrink-0">
            <PendingTransfersPanel />
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            <MobilePlannerView
              filteredEmployees={filteredEmployees}
              weeks={weeks}
              allocations={allocations || []}
              viewDate={currentMonth}
              getEmployeeMonthlyLoad={getEmployeeMonthlyLoad}
              onOpenSheet={handleCellClick}
              cellVariant="compact"
            />
          </div>
          {selectedCell && (
            <AllocationSheet
              open={!!selectedCell}
              onOpenChange={(open) => !open && setSelectedCell(null)}
              employeeId={selectedCell.employeeId}
              weekStart={selectedCell.weekStart.toISOString()}
              viewDateContext={currentMonth}
              initialAutoAdd={selectedCell.autoAdd}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-3 py-1.5 shrink-0">
            <PendingTransfersPanel />
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 min-h-0">
            <div style={{ minWidth: isWideLayout ? undefined : gridMinWidth }}>
              <div
                className="grid sticky top-0 z-10 bg-white dark:bg-slate-950 border-b shadow-sm"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div className="px-2 py-2 font-semibold text-xs text-slate-700 dark:text-slate-200 border-r flex items-center bg-slate-50 dark:bg-slate-900 sticky left-0 z-20">
                  Equipo ({filteredEmployees.length})
                </div>
                {weeks.map((week, index) => (
                  <div
                    key={week.weekStart.toISOString()}
                    className={cn(
                      'text-center px-1 py-2 border-r flex flex-col justify-center min-w-0',
                      isCurrentWeek(week.weekStart) && 'bg-indigo-50/60'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase truncate',
                        isCurrentWeek(week.weekStart) ? 'text-indigo-700' : 'text-slate-500'
                      )}
                    >
                      S{index + 1}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium truncate leading-tight">
                      {format(week.weekStart, 'd', { locale: es })}–
                      {format(addDays(week.weekStart, 4), 'd MMM', { locale: es })}
                    </span>
                  </div>
                ))}
                <div className="px-1 py-2 font-semibold text-[10px] text-center border-l bg-slate-50 flex items-center justify-center">
                  Total
                </div>
              </div>

              <div>
                {filteredEmployees.map((employee) => {
                  const monthlyLoad = getEmployeeMonthlyLoad(employee.id, year, month);
                  return (
                    <div
                      key={employee.id}
                      className="grid border-b hover:bg-slate-50/80 transition-colors bg-white items-stretch"
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      <EmployeeRow
                        employee={employee}
                        weeks={weeks}
                        projects={projects}
                        allocations={allocations}
                        absences={absences}
                        teamEvents={teamEvents}
                        viewDate={currentMonth}
                        onOpenSheet={(empId, date, autoAdd) => handleCellClick(empId, date, autoAdd)}
                        cellVariant="compact"
                      />

                      <div className="flex items-center justify-center border-l p-2 bg-slate-50/30 min-w-0">
                        <div
                          className={cn(
                            'flex flex-col items-center justify-center w-full max-w-[60px] min-h-[60px] rounded-lg border px-1.5 py-1.5',
                            monthlyLoad.status === 'overload'
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : monthlyLoad.status === 'warning'
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : monthlyLoad.status === 'healthy'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                          )}
                        >
                          <span className="text-xs font-bold leading-none tabular-nums">{monthlyLoad.hours}h</span>
                          <span className="text-[9px] opacity-70 tabular-nums">/ {monthlyLoad.capacity}h</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedCell && (
            <AllocationSheet
              open={!!selectedCell}
              onOpenChange={(open) => !open && setSelectedCell(null)}
              employeeId={selectedCell.employeeId}
              weekStart={selectedCell.weekStart.toISOString()}
              viewDateContext={currentMonth}
              initialAutoAdd={selectedCell.autoAdd}
            />
          )}
        </div>
      )}
    </div>
  );
}
