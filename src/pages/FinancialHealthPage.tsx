import { useMemo, useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useProjectMetrics, type ProjectMetricsDeadline } from '@/hooks/useProjectMetrics';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ArrowDownRight,
    Users,
    Search,
    LayoutDashboard,
    FolderKanban,
    UserCircle,
    ChevronDown,
    ChevronRight,
    Info,
    Lock,
    Wallet,
    Flame,
    CheckCircle2,
    Landmark,
    Settings2,
    Download
} from 'lucide-react';
import { format, startOfMonth, subMonths, addMonths, endOfMonth, isSameMonth, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { normalizeDepartments, employeeBelongsToDepartment } from '@/utils/departmentUtils';
import {
    formatEhrTargetForDisplay,
    numberToPositiveDecimalInputString,
    parsePositiveDecimalInput,
    sanitizePositiveDecimalInput,
} from '@/utils/positiveDecimalInput';
import { isAllocationInEffectiveMonth, getWorkingDaysInMonth, getWorkingDaysElapsedInMonth } from '@/utils/dateUtils';
import type { Project, Employee, CommonExpenseEntry } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { usePrivacyDemo } from '@/contexts/PrivacyDemoContext';
import {
    allocateCommonExpenses,
    collectCommonExpenseEntriesForMonth,
    normalizeCommonExpenseEntriesDepartments,
    type AllocateCommonExpensesFailure,
} from '@/utils/commonExpensesAllocation';
import {
    CommonExpensesSettingsCard,
    validateCommonExpensesDraft,
} from '@/components/agency/CommonExpensesSettingsCard';
import { toast } from '@/lib/notify';
import { usePermissions } from '@/hooks/usePermissions';
import { buildRentabilityDiagnosticPayload } from '@/utils/reportExports/rentabilityDiagnostic';
import {
    getRowCost,
    getStandardHourlyCost,
    getStandardMonthlyCapacity,
    overheadShareForRow,
} from '@/utils/profitabilityCost';

/** Límite % margen para considerar "óptimo" (verde). Por debajo hasta 0% = ámbar; negativo = rojo. */
const MARGIN_HEALTHY_PCT = 20;

/** Clase CSS y si mostrar icono de alerta para semáforo de margen (por %). */
function getMarginSemaphore(marginPct: number): { className: string; showAlert: boolean } {
    if (marginPct > MARGIN_HEALTHY_PCT) return { className: 'text-emerald-600 dark:text-emerald-400', showAlert: false };
    if (marginPct >= 0) return { className: 'text-amber-500', showAlert: false };
    return { className: 'text-red-600', showAlert: true };
}

export default function FinancialHealthPage() {
    const { t } = useTranslation('app');
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [searchQuery, setSearchQuery] = useState('');
    const [hoursMode, setHoursMode] = useState<'actual' | 'computed'>('computed');
    const [costMode, setCostMode] = useState<'standard' | 'dynamic'>('standard');
    const [costHelpOpen, setCostHelpOpen] = useState(false);
    const [profitSettingsOpen, setProfitSettingsOpen] = useState(false);
    const [profitSettingsSaving, setProfitSettingsSaving] = useState(false);
    const [ehrTargetInput, setEhrTargetInput] = useState('');
    const [commonExpensesDraft, setCommonExpensesDraft] = useState<Record<string, CommonExpenseEntry[]>>({});
    const [commonExpensesRecurringDraft, setCommonExpensesRecurringDraft] = useState<CommonExpenseEntry[]>([]);
    const profitSettingsHydratedRef = useRef(false);
    const [deadlinesForMonth, setDeadlinesForMonth] = useState<ProjectMetricsDeadline[]>([]);
    const { projects, clients, employees, allocations, ensureMonthLoaded } = useApp();
    const { currentAgency, updateSettings } = useAgency();
    const { selectedDepartmentId } = useDepartmentView();
    const { historyMinDate: minReportingMonth } = useSubscriptionLimits();
    const { isActive: privacyDemoActive, anonymizer: privacyAnonymizer } = usePrivacyDemo();
    const { canAccess } = usePermissions();

    useEffect(() => {
        if (currentAgency?.settings?.hoursTrackingPreference) {
            setHoursMode(currentAgency.settings.hoursTrackingPreference);
        }
    }, [currentAgency?.settings?.hoursTrackingPreference]);

    useEffect(() => {
        ensureMonthLoaded(currentMonth);
    }, [currentMonth, ensureMonthLoaded]);

    // Cargar deadlines del mes para que las horas/presupuesto mostrados respeten budgetOverride (ajustes en Deadlines).
    useEffect(() => {
        const monthKey = format(currentMonth, 'yyyy-MM');
        let cancelled = false;
        fetchDeadlinesForMonth(monthKey, currentAgency?.id).then(({ data, error }) => {
            if (cancelled || error) {
                if (!cancelled && error) console.error('Error cargando deadlines en Rentabilidad:', error);
                return;
            }
            setDeadlinesForMonth(
                (data || []).map(d => ({
                    projectId: d.projectId,
                    month: d.month,
                    budgetOverride: d.budgetOverride,
                }))
            );
        });
        return () => { cancelled = true; };
    }, [currentMonth, currentAgency?.id]);

    const departments = useMemo(
        () => normalizeDepartments(currentAgency?.settings?.departments),
        [currentAgency?.settings?.departments]
    );

    useEffect(() => {
        if (!profitSettingsOpen) {
            profitSettingsHydratedRef.current = false;
            return;
        }
        if (!currentAgency || profitSettingsHydratedRef.current) return;
        profitSettingsHydratedRef.current = true;
        const deptsNorm = normalizeDepartments(currentAgency.settings?.departments);
        setEhrTargetInput(
            numberToPositiveDecimalInputString(currentAgency.settings?.ehrTarget ?? 75, 75)
        );
        const rawCommon = currentAgency.settings?.commonExpensesByMonth;
        if (rawCommon && typeof rawCommon === 'object' && !Array.isArray(rawCommon)) {
            const next: Record<string, CommonExpenseEntry[]> = {};
            for (const [k, arr] of Object.entries(rawCommon)) {
                if (!Array.isArray(arr)) continue;
                next[k] = normalizeCommonExpenseEntriesDepartments(arr as CommonExpenseEntry[], deptsNorm);
            }
            setCommonExpensesDraft(next);
        } else {
            setCommonExpensesDraft({});
        }
        const rawRec = currentAgency.settings?.commonExpensesRecurring;
        if (Array.isArray(rawRec)) {
            setCommonExpensesRecurringDraft(
                normalizeCommonExpenseEntriesDepartments(rawRec as CommonExpenseEntry[], deptsNorm)
            );
        } else {
            setCommonExpensesRecurringDraft([]);
        }
    }, [profitSettingsOpen, currentAgency]);

    const handleSaveProfitSettings = useCallback(async () => {
        if (!currentAgency?.id) return;
        const commonErr = validateCommonExpensesDraft(
            commonExpensesDraft,
            commonExpensesRecurringDraft,
            departments,
            (k, d) => t(k, d)
        );
        if (commonErr) {
            toast.error(commonErr);
            return;
        }
        setProfitSettingsSaving(true);
        try {
            const normalizedCommon: Record<string, CommonExpenseEntry[]> = {};
            for (const [k, arr] of Object.entries(commonExpensesDraft)) {
                normalizedCommon[k] = normalizeCommonExpenseEntriesDepartments(
                    arr.map(({ recurringFromMonth: _rf, recurringUntilMonth: _ru, ...rest }) => rest),
                    departments
                );
            }
            const normalizedRecurring = normalizeCommonExpenseEntriesDepartments(
                commonExpensesRecurringDraft,
                departments
            );
            const ehrTarget = parsePositiveDecimalInput(ehrTargetInput, 75, 1);
            await updateSettings({
                ehrTarget,
                commonExpensesByMonth: normalizedCommon,
                commonExpensesRecurring: normalizedRecurring,
            });
            toast.success(t('financialHealth.settings.saved', 'Cambios guardados'));
            setProfitSettingsOpen(false);
        } catch (err) {
            console.error(err);
            toast.error(t('financialHealth.settings.saveError', 'No se pudo guardar la configuración'));
        } finally {
            setProfitSettingsSaving(false);
        }
    }, [
        commonExpensesDraft,
        commonExpensesRecurringDraft,
        currentAgency?.id,
        departments,
        ehrTargetInput,
        t,
        updateSettings,
    ]);

    const employeesForView = useMemo(() => {
        if (!selectedDepartmentId || !departments.length) return employees ?? [];
        const dept = departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
        if (!dept) return employees ?? [];
        return (employees ?? []).filter(e => employeeBelongsToDepartment(e.department, dept.id, dept.name));
    }, [employees, selectedDepartmentId, departments]);

    const projectIdsForDepartment = useMemo(() => {
        if (!selectedDepartmentId) return undefined as Set<string> | undefined;
        if (!employeesForView.length) return new Set<string>();
        const allowedEmployeeIds = new Set(employeesForView.map(e => e.id));
        const ids = new Set<string>();
        (allocations ?? []).forEach(a => {
            if (!allowedEmployeeIds.has(a.employeeId)) return;
            if (!isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)) return;
            ids.add(a.projectId);
        });
        return ids;
    }, [allocations, employeesForView, selectedDepartmentId, currentMonth]);

    const handlePrevMonth = () => setCurrentMonth(prev => {
        const next = subMonths(prev, 1);
        if (minReportingMonth && next < minReportingMonth) return minReportingMonth;
        return next;
    });
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
    const handleToday = () => setCurrentMonth(startOfMonth(new Date()));

    useEffect(() => {
        if (minReportingMonth && currentMonth < minReportingMonth) {
            setCurrentMonth(minReportingMonth);
        }
    }, [minReportingMonth]);

    const {
        projectMetrics,
        employeeMetrics,
        totals
    } = useProjectMetrics({
        month: currentMonth,
        deadlines: deadlinesForMonth
    });

    const selectedDept = useMemo(() => {
        if (!selectedDepartmentId || !departments.length) return null;
        return departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId) ?? null;
    }, [selectedDepartmentId, departments]);

    const projectMetricsForView = useMemo(() => {
        if (!projectIdsForDepartment || !selectedDept) return projectMetrics;
        return projectMetrics.filter(p => {
            // Proyectos internos (ingreso 0 €) siempre en vista: ver "Inversión interna" / pérdida
            if ((p.monthlyFee ?? 0) === 0) return true;
            if (!projectIdsForDepartment.has(p.projectId)) return false;
            const proj = projects?.find(pr => pr.id === p.projectId);
            if (!proj?.responsibleDepartmentId) return true;
            return proj.responsibleDepartmentId === selectedDept.id || proj.responsibleDepartmentId === selectedDept.name;
        });
    }, [projectMetrics, projectIdsForDepartment, selectedDept, projects]);

    const clientById = useMemo(() => {
        const map = new Map<string, string>();
        clients.forEach(c => map.set(c.id, c.name));
        return map;
    }, [clients]);

    const projectMetricsFilteredBySearch = useMemo(() => {
        if (!searchQuery.trim()) return projectMetricsForView;
        const q = searchQuery.trim().toLowerCase();
        return projectMetricsForView.filter(p => {
            const clientName = clientById.get(p.clientId) || p.clientName || '';
            return p.projectName.toLowerCase().includes(q) || clientName.toLowerCase().includes(q);
        });
    }, [projectMetricsForView, searchQuery, clientById]);

    const projectMetricsBillable = useMemo(
        () => projectMetricsFilteredBySearch.filter(p => (p.monthlyFee ?? 0) > 0),
        [projectMetricsFilteredBySearch]
    );
    const projectMetricsInternal = useMemo(
        () => projectMetricsFilteredBySearch.filter(p => (p.monthlyFee ?? 0) === 0),
        [projectMetricsFilteredBySearch]
    );

    const projectMetricsBillableWithActivity = useMemo(
        () => projectMetricsBillable.filter(p => (hoursMode === 'computed' ? p.computed : p.actual) > 0),
        [projectMetricsBillable, hoursMode]
    );

    const employeeMetricsForView = useMemo(() => {
        if (!selectedDepartmentId) return employeeMetrics;
        const allowedIds = new Set(employeesForView.map(e => e.id));
        return employeeMetrics.filter(em => allowedIds.has(em.employeeId));
    }, [employeeMetrics, selectedDepartmentId, employeesForView]);

    const commonExpensesMonthKey = useMemo(() => format(currentMonth, 'yyyy-MM'), [currentMonth]);

    const employeeHoursGlobalById = useMemo(() => {
        const m = new Map<string, number>();
        employeeMetrics.forEach(em => {
            const h = hoursMode === 'computed' ? em.totalComputed : em.totalActual;
            m.set(em.employeeId, h);
        });
        return m;
    }, [employeeMetrics, hoursMode]);

    const mergedCommonExpenseEntries = useMemo(
        () => collectCommonExpenseEntriesForMonth(currentAgency?.settings, commonExpensesMonthKey, departments),
        [
            currentAgency?.settings?.commonExpensesByMonth,
            currentAgency?.settings?.commonExpensesRecurring,
            commonExpensesMonthKey,
            departments,
        ]
    );

    const employeePayrollById = useMemo(() => {
        const map = new Map<string, number>();
        (employees ?? []).forEach(e => {
            map.set(e.id, e.monthlyCost ?? e.hourlyRate ?? 0);
        });
        return map;
    }, [employees]);

    const commonExpensesAlloc = useMemo(() => {
        const empRows = (employees ?? [])
            .filter(e => e.isActive)
            .map(e => ({
                id: e.id,
                department: e.department,
                departmentId: e.departmentId,
            }));
        return allocateCommonExpenses({
            entries: mergedCommonExpenseEntries,
            employees: empRows,
            departments,
            getEmployeeHours: id => employeeHoursGlobalById.get(id) ?? 0,
            getEmployeePayroll: id => employeePayrollById.get(id) ?? 0,
        });
    }, [mergedCommonExpenseEntries, employees, departments, employeeHoursGlobalById, employeePayrollById]);

    const overheadByEmployee = useMemo((): ReadonlyMap<string, number> => {
        if (commonExpensesAlloc.ok) return commonExpensesAlloc.overheadByEmployee;
        return new Map<string, number>();
    }, [commonExpensesAlloc]);

    const totalOverheadInView = useMemo(() => {
        if (!commonExpensesAlloc.ok) return 0;
        return employeeMetricsForView.reduce(
            (s, em) => s + (commonExpensesAlloc.overheadByEmployee.get(em.employeeId) ?? 0),
            0
        );
    }, [commonExpensesAlloc, employeeMetricsForView]);

    const totalsForView = useMemo(() => {
        const totalFee = projectMetricsBillableWithActivity.reduce((s, p) => s + p.monthlyFee, 0);
        const totalActual = projectMetricsBillableWithActivity.reduce((s, p) => s + p.actual, 0);
        const totalComputed = projectMetricsBillableWithActivity.reduce((s, p) => s + p.computed, 0);
        const totalBudget = projectMetricsBillableWithActivity.reduce((s, p) => s + p.budget, 0);
        const avgProgress = projectMetricsBillableWithActivity.length > 0
            ? projectMetricsBillableWithActivity.reduce((s, p) => s + p.progressOperational, 0) / projectMetricsBillableWithActivity.length
            : 0;
        return { totalFee, totalActual, totalComputed, totalBudget, avgProgress };
    }, [projectMetricsBillableWithActivity]);

    // === Mes en curso vs cerrado (pacing e ingreso devengado) — definido pronto para totalRevenue y effectiveCostMode ===
    const isViewingCurrentMonth = useMemo(
        () => isSameMonth(currentMonth, new Date()),
        [currentMonth]
    );
    const workingDaysInMonth = useMemo(() => getWorkingDaysInMonth(currentMonth), [currentMonth]);
    const workingDaysElapsed = useMemo(() => getWorkingDaysElapsedInMonth(currentMonth), [currentMonth]);
    const pctMonthElapsed = useMemo(() => {
        if (!isViewingCurrentMonth) return 100;
        return workingDaysInMonth > 0 ? (workingDaysElapsed / workingDaysInMonth) * 100 : 0;
    }, [isViewingCurrentMonth, workingDaysInMonth, workingDaysElapsed]);
    const dynamicCostFallbackActive = useMemo(
        () => costMode === 'dynamic' && isViewingCurrentMonth && pctMonthElapsed < 25,
        [costMode, isViewingCurrentMonth, pctMonthElapsed]
    );
    const effectiveCostMode = dynamicCostFallbackActive ? 'standard' : costMode;
    const accruedRatio = useMemo(() => {
        if (!isViewingCurrentMonth) return 1;
        return workingDaysInMonth > 0 ? workingDaysElapsed / workingDaysInMonth : 0;
    }, [isViewingCurrentMonth, workingDaysInMonth, workingDaysElapsed]);
    const projectDisplayFeeMap = useMemo(() => {
        const map = new Map<string, number>();
        projectMetricsForView.forEach(p => {
            const fee = p.monthlyFee ?? 0;
            if (!isViewingCurrentMonth) {
                map.set(p.projectId, fee);
                return;
            }
            // Si ya ha cumplido o superado el 100 % de las horas del presupuesto, el ingreso devengado es el total (ya se ha “ganado” el fee).
            const hoursDisplay = hoursMode === 'computed' ? p.computed : p.actual;
            const budget = p.budget > 0 ? p.budget : 0;
            const hasReachedOrExceededBudget = budget > 0 && hoursDisplay >= budget;
            map.set(p.projectId, hasReachedOrExceededBudget ? fee : fee * accruedRatio);
        });
        return map;
    }, [projectMetricsForView, isViewingCurrentMonth, accruedRatio, hoursMode]);
    const totalDisplayRevenue = useMemo(() => {
        return projectMetricsBillableWithActivity.reduce(
            (sum, p) => sum + (projectDisplayFeeMap.get(p.projectId) ?? p.monthlyFee ?? 0),
            0
        );
    }, [projectMetricsBillableWithActivity, projectDisplayFeeMap]);
    const projectPacingMap = useMemo(() => {
        const map = new Map<string, { pctConsumed: number; pctElapsed: number; isOverPacing: boolean }>();
        projectMetricsForView.forEach(p => {
            const budget = p.budget > 0 ? p.budget : 0;
            const hoursDisplay = hoursMode === 'computed' ? p.computed : p.actual;
            const pctConsumed = budget > 0 ? (hoursDisplay / budget) * 100 : 0;
            const pctElapsed = isViewingCurrentMonth ? pctMonthElapsed : 100;
            const isOverPacing = pctConsumed > pctElapsed;
            map.set(p.projectId, { pctConsumed, pctElapsed, isOverPacing });
        });
        return map;
    }, [projectMetricsForView, hoursMode, isViewingCurrentMonth, pctMonthElapsed]);

    // === KPI 1: Precio Hora Efectivo global (según vista) === Horas según filtro Reales/Computadas. Ingreso devengado si mes en curso.
    const totalRevenue = isViewingCurrentMonth ? totalDisplayRevenue : totalsForView.totalFee;
    const totalHoursForView = hoursMode === 'computed' ? totalsForView.totalComputed : totalsForView.totalActual;
    const effectiveHourlyRate = totalHoursForView > 0 ? totalRevenue / totalHoursForView : 0;

    // Coste mensual total de la vista (nóminas): contabilidad pura. Cada empleado tiene un coste mensual; se reparte a proyectos por proporción de horas.
    const totalMonthlyCostView = useMemo(() => {
        return employeeMetricsForView.reduce((sum, em) => {
            const emp = employees.find(e => e.id === em.employeeId);
            return sum + (emp?.monthlyCost ?? emp?.hourlyRate ?? 0);
        }, 0);
    }, [employeeMetricsForView, employees]);

    const totalHoursForCostDenominator =
        hoursMode === 'computed' ? totalsForView.totalComputed : totalsForView.totalActual;
    const avgHourlyCost =
        totalHoursForCostDenominator > 0 ? totalMonthlyCostView / totalHoursForCostDenominator : 0;

    const usesLoadedCostForTarget =
        commonExpensesAlloc.ok && commonExpensesAlloc.totalConfiguredAmount > 0;
    const avgLoadedHourlyCost =
        totalHoursForCostDenominator > 0
            ? (totalMonthlyCostView + totalOverheadInView) / totalHoursForCostDenominator
            : 0;
    const avgForTarget =
        usesLoadedCostForTarget && avgLoadedHourlyCost > 0 ? avgLoadedHourlyCost : avgHourlyCost;

    // Objetivo de EHR: configurable en agencia o por defecto 75 €/h (coste cargado si hay gastos comunes en el mes)
    const defaultEhrTarget = avgForTarget > 0 ? Math.max(avgForTarget, 75) : 75;
    const ehrTarget = (currentAgency?.settings?.ehrTarget != null && currentAgency.settings.ehrTarget > 0)
        ? currentAgency.settings.ehrTarget
        : defaultEhrTarget;
    const ehrIsHealthy = effectiveHourlyRate >= ehrTarget && totalHoursForView > 0;

    // === Ranking de hemorragias: solo proyectos facturables (con actividad por defecto) ===
    type EnrichedProject = {
        metric: typeof projectMetrics[number];
        clientName: string;
        ehr: number;          // € / h real
        ehrLabel: string;     // texto para UI (incluye "Sin iniciar" si procede)
    };

    const enrichedProjects: EnrichedProject[] = useMemo(() => {
        return projectMetricsBillableWithActivity.map(p => {
            const clientName = clientById.get(p.clientId) || p.clientName || 'Cliente desconocido';
            const projectHours = hoursMode === 'computed' ? p.computed : p.actual;
            const ehr = projectHours > 0 ? (p.monthlyFee || 0) / projectHours : Number.POSITIVE_INFINITY;
            const ehrLabel = projectHours > 0
                ? `${(ehr || 0).toFixed(0)} €/h`
                : 'Sin iniciar';
            return { metric: p, clientName, ehr, ehrLabel };
        });
    }, [projectMetricsBillableWithActivity, clientById, hoursMode]);

    const sortedProjects = useMemo(() => {
        return [...enrichedProjects].sort((a, b) => {
            const ehrA = a.ehr;
            const ehrB = b.ehr;
            if (!isFinite(ehrA) && !isFinite(ehrB)) return 0;
            if (!isFinite(ehrA)) return 1;
            if (!isFinite(ehrB)) return -1;
            return ehrA - ehrB; // de peor (más bajo) a mejor
        });
    }, [enrichedProjects]);

    const [showAllProjects, setShowAllProjects] = useState(false);
    const projectsToShow = showAllProjects ? sortedProjects : sortedProjects.slice(0, 10);

    // Mapa proyecto -> desglose por empleado (hours = computadas, actual = reales)
    const projectEmployeesMap = useMemo(() => {
        const map = new Map<string, { employeeId: string; hours: number; actual: number }[]>();
        employeeMetricsForView.forEach(em => {
            em.projectBreakdown.forEach(pb => {
                const list = map.get(pb.projectId) || [];
                list.push({ employeeId: em.employeeId, hours: pb.hours, actual: pb.actual ?? 0 });
                map.set(pb.projectId, list);
            });
        });
        return map;
    }, [employeeMetricsForView]);

    const projectByIdForAttr = useMemo(() => {
        const map = new Map<string, { actual: number; monthlyFee: number }>();
        projectMetricsForView.forEach(p => map.set(p.projectId, { actual: p.actual, monthlyFee: p.monthlyFee || 0 }));
        return map;
    }, [projectMetricsForView]);

    // Total de horas por proyecto según el mismo breakdown que los empleados (computed), para repartir el fee sin distorsión
    const projectTotalHoursFromBreakdown = useMemo(() => {
        const map = new Map<string, number>();
        projectEmployeesMap.forEach((rows, projectId) => {
            map.set(projectId, rows.reduce((s, r) => s + r.hours, 0));
        });
        return map;
    }, [projectEmployeesMap]);

    // Horas totales por empleado (computed) en la vista: para repartir el coste mensual entre proyectos
    const employeeTotalHoursMap = useMemo(() => {
        const map = new Map<string, number>();
        employeeMetricsForView.forEach(em => map.set(em.employeeId, em.totalComputed));
        return map;
    }, [employeeMetricsForView]);

    // Coste por proyecto: reparto del coste mensual (nómina) por horas en el modo actual (reales/computadas). Contabilidad pura.
    const projectCostAndMarginMap = useMemo(() => {
        const map = new Map<string, { cost: number; payrollCost: number; overheadCost: number; margin: number }>();
        const employeeTotalsByMode = new Map<string, number>();
        employeeMetricsForView.forEach(em => {
            const totalInMode = hoursMode === 'computed' ? em.totalComputed : em.totalActual;
            employeeTotalsByMode.set(em.employeeId, totalInMode);
        });
        projectMetricsForView.forEach(p => {
            const breakdown = projectEmployeesMap.get(p.projectId) || [];
            let payrollCost = 0;
            let overheadCost = 0;
            breakdown.forEach(row => {
                const emp = employees.find(e => e.id === row.employeeId);
                const totalHEmployeeInMode = employeeTotalsByMode.get(row.employeeId) ?? 0;
                const hoursDisplay = hoursMode === 'computed' ? row.hours : (row.actual ?? 0);
                const totalHGlobal = employeeHoursGlobalById.get(row.employeeId) ?? totalHEmployeeInMode;
                payrollCost += getRowCost(emp, hoursDisplay, totalHEmployeeInMode, effectiveCostMode);
                overheadCost += overheadShareForRow(row.employeeId, hoursDisplay, totalHGlobal, overheadByEmployee);
            });
            const cost = payrollCost + overheadCost;
            const fee = p.monthlyFee || 0;
            map.set(p.projectId, { cost, payrollCost, overheadCost, margin: fee - cost });
        });
        return map;
    }, [projectMetricsForView, projectEmployeesMap, employees, projectByIdForAttr, projectTotalHoursFromBreakdown, hoursMode, effectiveCostMode, employeeMetricsForView, employeeHoursGlobalById, overheadByEmployee]);

    // === KPI 2: Margen Neto Global === Coste = solo el coste atribuido a los proyectos visibles (filtro búsqueda).
    const totalInternalCost = useMemo(() => {
        return projectMetricsBillableWithActivity.reduce(
            (sum, p) => sum + (projectCostAndMarginMap.get(p.projectId)?.cost ?? 0),
            0
        );
    }, [projectMetricsBillableWithActivity, projectCostAndMarginMap]);

    const netMargin = totalRevenue - totalInternalCost;
    const marginIsPositive = netMargin >= 0;
    const marginPercent: number | null = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : null;

    // Desglose por empleado en proyecto. hoursDisplay = horas a mostrar según modo (reales/computadas); en modo reales se escalan para que la suma = horas reales del proyecto.
    const projectEmployeeAttributionMap = useMemo(() => {
        const map = new Map<string, { employeeId: string; hours: number; hoursDisplay: number; cost: number; attributedRevenue: number; margin: number }[]>();
        employeeMetricsForView.forEach(em => {
            const emp = employees.find(e => e.id === em.employeeId);
            const totalHEmployeeInMode = hoursMode === 'computed' ? em.totalComputed : em.totalActual;
            em.projectBreakdown.forEach(pb => {
                const hours = pb.hours;
                const actualHours = pb.actual ?? 0;
                const projectActual = projectByIdForAttr.get(pb.projectId)?.actual ?? 0;
                const totalHours = projectTotalHoursFromBreakdown.get(pb.projectId) ?? 0;
                const hoursDisplay = hoursMode === 'computed' ? hours : actualHours;
                const totalHGlobal = employeeHoursGlobalById.get(em.employeeId) ?? totalHEmployeeInMode;
                const payrollCost = getRowCost(emp, hoursDisplay, totalHEmployeeInMode, effectiveCostMode);
                const overheadCost = overheadShareForRow(em.employeeId, hoursDisplay, totalHGlobal, overheadByEmployee);
                const cost = payrollCost + overheadCost;
                const monthlyFee = projectByIdForAttr.get(pb.projectId)?.monthlyFee ?? 0;
                const totalHoursInMode = hoursMode === 'computed' ? totalHours : projectActual;
                const attributedRevenue = totalHoursInMode > 0 ? (hoursDisplay / totalHoursInMode) * monthlyFee : 0;
                const margin = attributedRevenue - cost;
                const list = map.get(pb.projectId) || [];
                list.push({ employeeId: em.employeeId, hours, hoursDisplay, cost, attributedRevenue, margin });
                map.set(pb.projectId, list);
            });
        });
        return map;
    }, [employeeMetricsForView, employees, projectTotalHoursFromBreakdown, projectByIdForAttr, hoursMode, effectiveCostMode, employeeHoursGlobalById, overheadByEmployee]);

    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId);
            else next.add(projectId);
            return next;
        });
    };

    // === Rentabilidad por departamento (área) ===
    const projectById = useMemo(() => {
        const map = new Map<string, Project>();
        projects.forEach(p => map.set(p.id, p));
        return map;
    }, [projects]);

    const departmentProfitability = useMemo(() => {
        const records: {
            id: string;
            name: string;
            ehr: number;
            revenue: number;
            hours: number;
            payrollCost: number;
            overheadCost: number;
            cost: number;
            margin: number;
        }[] = [];
        departments.forEach(dept => {
            let revenue = 0;
            let hours = 0;
            let payrollCost = 0;
            let overheadCost = 0;
            projectMetricsBillableWithActivity.forEach(pm => {
                const proj = projectById.get(pm.projectId);
                if (!proj) return;
                if (!proj.responsibleDepartmentId) return;
                if (proj.responsibleDepartmentId !== dept.id && proj.responsibleDepartmentId !== dept.name) return;
                const fee = projectDisplayFeeMap.get(pm.projectId) ?? pm.monthlyFee ?? 0;
                revenue += fee;
                hours += hoursMode === 'computed' ? pm.computed : pm.actual;
                const cm = projectCostAndMarginMap.get(pm.projectId);
                payrollCost += cm?.payrollCost ?? 0;
                overheadCost += cm?.overheadCost ?? 0;
            });
            const cost = payrollCost + overheadCost;
            const margin = revenue - cost;
            if (hours > 0 && revenue > 0) {
                const ehr = revenue / hours;
                records.push({
                    id: dept.id,
                    name: dept.name,
                    ehr,
                    revenue,
                    hours,
                    payrollCost,
                    overheadCost,
                    cost,
                    margin,
                });
            }
        });

        const NO_DEPT_ID = '__none__';
        let revenueNone = 0;
        let hoursNone = 0;
        let payrollCostNone = 0;
        let overheadCostNone = 0;
        projectMetricsBillableWithActivity.forEach(pm => {
            const proj = projectById.get(pm.projectId);
            if (!proj || proj.responsibleDepartmentId) return;
            const fee = projectDisplayFeeMap.get(pm.projectId) ?? pm.monthlyFee ?? 0;
            revenueNone += fee;
            hoursNone += hoursMode === 'computed' ? pm.computed : pm.actual;
            const cm = projectCostAndMarginMap.get(pm.projectId);
            payrollCostNone += cm?.payrollCost ?? 0;
            overheadCostNone += cm?.overheadCost ?? 0;
        });
        const costNone = payrollCostNone + overheadCostNone;
        const marginNone = revenueNone - costNone;
        if (hoursNone > 0 && revenueNone > 0) {
            records.push({
                id: NO_DEPT_ID,
                name: 'Sin departamento',
                ehr: revenueNone / hoursNone,
                revenue: revenueNone,
                hours: hoursNone,
                payrollCost: payrollCostNone,
                overheadCost: overheadCostNone,
                cost: costNone,
                margin: marginNone,
            });
        }

        return {
            items: records.sort((a, b) => b.ehr - a.ehr),
        };
    }, [
        departments,
        projectMetricsBillableWithActivity,
        projectById,
        hoursMode,
        projectCostAndMarginMap,
        projectDisplayFeeMap,
    ]);

    // === Por empleado: coste = coste mensual (nómina); ingreso atribuido = reparto del fee de proyectos por horas. Contabilidad pura. ===
    type EmployeeProfitability = {
        employeeId: string;
        employeeName: string;
        totalActual: number;
        totalComputed: number;
        /** Horas (según modo) solo de proyectos con actividad en la vista actual */
        totalHoursDisplay: number;
        /** Horas (según modo) totales del mes del empleado */
        totalHoursGlobal: number;
        /** Horas del mes no imputadas a ningún proyecto visible/interno (tareas fuera de vista) */
        hoursNotAttributed: number;
        /** Nómina mensual del empleado (€/mes) — tal como está configurada en su ficha */
        payrollMonthly: number;
        /** Overhead del mes total del empleado (gastos comunes que le tocan) */
        overheadTotalEmployee: number;
        /** Coste de las horas no imputadas en el modo actual (sólo significativo en modo dinámico) */
        costNotAttributed: number;
        payrollNotAttributed: number;
        overheadNotAttributed: number;
        /**
         * Modo operativo: nómina no explicada por horas del mes × tarifa estándar (capacidad teórica > horas trabajadas).
         * Cierra: nómina filas + no imputada + esto = nómina mensual (± céntimos).
         */
        payrollStandardIdle: number;
        /** Nómina total cargada al coste del empleado (filas + no imputada + hueco operativo). */
        payrollAllocatedTotal: number;
        cost: number;
        payrollCost: number;
        overheadCost: number;
        attributedRevenue: number;
        margin: number;
        marginPercent: number;
        byProject: {
            projectId: string;
            projectName: string;
            hours: number;
            hoursDisplay: number;
            payrollCost: number;
            overheadCost: number;
            cost: number;
            attributedRevenue: number;
            margin: number;
            /** Fee mensual / horas totales del proyecto (mismo modo horas). Solo facturables; 0 si interno. */
            projectEhr: number;
        }[];
    };

    const projectIdsWithActivity = useMemo(
        () => new Set(projectMetricsBillableWithActivity.map(p => p.projectId)),
        [projectMetricsBillableWithActivity]
    );

    const employeeProfitabilityList = useMemo((): EmployeeProfitability[] => {
        return employeeMetricsForView.map(em => {
            const emp = employees.find(e => e.id === em.employeeId);
            const totalHEmployeeInMode = hoursMode === 'computed' ? em.totalComputed : em.totalActual;
            const totalHGlobal = employeeHoursGlobalById.get(em.employeeId) ?? totalHEmployeeInMode;
            let attributedRevenue = 0;
            let costFromVisibleProjects = 0;
            let payrollFromVisibleProjects = 0;
            let overheadFromVisibleProjects = 0;
            const byProject: EmployeeProfitability['byProject'] = [];
            em.projectBreakdown.forEach(pb => {
                const isBillableWithActivity = projectIdsWithActivity.has(pb.projectId);
                const hours = pb.hours;
                const actualHours = pb.actual ?? 0;
                const projectActual = projectByIdForAttr.get(pb.projectId)?.actual ?? 0;
                const totalHours = projectTotalHoursFromBreakdown.get(pb.projectId) ?? 0;
                const hoursDisplay = hoursMode === 'computed' ? hours : actualHours;
                const monthlyFee = projectByIdForAttr.get(pb.projectId)?.monthlyFee ?? 0;
                const isInternal = (monthlyFee ?? 0) === 0;
                const hasHours = hoursDisplay > 0;
                /** Coste de nómina + overhead para cualquier imputación con horas (evita huecos vs total mensual del empleado). */
                const includeCostRow = hasHours && (isInternal || (monthlyFee ?? 0) > 0);
                if (!includeCostRow) return;

                const payrollRow = getRowCost(emp, hoursDisplay, totalHEmployeeInMode, effectiveCostMode);
                const overheadRow = overheadShareForRow(em.employeeId, hoursDisplay, totalHGlobal, overheadByEmployee);
                const rowCost = payrollRow + overheadRow;
                const totalHoursInMode = hoursMode === 'computed' ? totalHours : projectActual;
                const attr = totalHoursInMode > 0 ? (hoursDisplay / totalHoursInMode) * (monthlyFee ?? 0) : 0;
                const projectEhr =
                    (monthlyFee ?? 0) > 0 && totalHoursInMode > 0 ? (monthlyFee ?? 0) / totalHoursInMode : 0;
                const countRevenue = isBillableWithActivity;
                if (countRevenue) {
                    attributedRevenue += attr;
                }
                costFromVisibleProjects += rowCost;
                payrollFromVisibleProjects += payrollRow;
                overheadFromVisibleProjects += overheadRow;
                const attributed = countRevenue ? attr : 0;
                byProject.push({
                    projectId: pb.projectId,
                    projectName: pb.projectName,
                    hours,
                    hoursDisplay,
                    payrollCost: payrollRow,
                    overheadCost: overheadRow,
                    cost: rowCost,
                    attributedRevenue: attributed,
                    margin: attributed - rowCost,
                    projectEhr
                });
            });
            const totalHoursDisplay = byProject.reduce((s, b) => s + b.hoursDisplay, 0);
            const payrollMonthly = emp?.monthlyCost ?? emp?.hourlyRate ?? 0;
            const overheadTotalEmployee = overheadByEmployee.get(em.employeeId) ?? 0;
            /** Evita fila/total «No imputado» por ruido numérico: total mensual vs suma por proyecto suele diferir en centésimas de hora. */
            const UNATTRIBUTED_HOURS_EPS = 0.02;
            const hoursNotAttributedRaw = Math.max(0, totalHEmployeeInMode - totalHoursDisplay);
            const hoursNotAttributed =
                hoursNotAttributedRaw < UNATTRIBUTED_HOURS_EPS ? 0 : hoursNotAttributedRaw;
            // Coste de horas no imputadas:
            // - Modo dinámico: nómina × (hNA / hTotal) — así la suma cuadra con la nómina exacta.
            // - Modo estándar: hNA × coste/h estándar (informativo, puede no cuadrar con nómina por capacidad teórica).
            const payrollNotAttributed = effectiveCostMode === 'dynamic'
                ? (totalHEmployeeInMode > 0 ? payrollMonthly * (hoursNotAttributed / totalHEmployeeInMode) : 0)
                : hoursNotAttributed * getStandardHourlyCost(emp);
            const overheadNotAttributed = overheadShareForRow(
                em.employeeId,
                hoursNotAttributed,
                totalHGlobal,
                overheadByEmployee
            );
            const costNotAttributed = payrollNotAttributed + overheadNotAttributed;
            const payrollStandardIdle =
                effectiveCostMode === 'standard' && emp && payrollMonthly > 0
                    ? Math.max(
                          0,
                          Math.round((payrollMonthly - getStandardHourlyCost(emp) * totalHEmployeeInMode) * 100) / 100
                      )
                    : 0;
            const payrollAllocatedTotal =
                payrollFromVisibleProjects + payrollNotAttributed + payrollStandardIdle;
            const costTotal =
                costFromVisibleProjects + costNotAttributed + payrollStandardIdle;
            const margin = attributedRevenue - costTotal;
            const marginPercent = attributedRevenue > 0 ? (margin / attributedRevenue) * 100 : 0;
            return {
                employeeId: em.employeeId,
                employeeName: em.employeeName,
                totalActual: em.totalActual,
                totalComputed: em.totalComputed,
                totalHoursDisplay,
                totalHoursGlobal: totalHEmployeeInMode,
                hoursNotAttributed,
                payrollMonthly,
                overheadTotalEmployee,
                costNotAttributed,
                payrollNotAttributed,
                overheadNotAttributed,
                payrollStandardIdle,
                payrollAllocatedTotal,
                cost: costTotal,
                payrollCost: payrollFromVisibleProjects,
                overheadCost: overheadFromVisibleProjects,
                attributedRevenue,
                margin,
                marginPercent,
                byProject
            };
        });
    }, [employeeMetricsForView, employees, projectTotalHoursFromBreakdown, projectByIdForAttr, hoursMode, effectiveCostMode, projectIdsWithActivity, employeeHoursGlobalById, overheadByEmployee]);

    const agencyTotalOverheadApplied = commonExpensesAlloc.ok ? commonExpensesAlloc.totalOverheadApplied : 0;
    const commonExpensesAllocError: AllocateCommonExpensesFailure | null = commonExpensesAlloc.ok
        ? null
        : commonExpensesAlloc;
    const commonExpensesBreakdown = useMemo(() => {
        const recurring = currentAgency?.settings?.commonExpensesRecurring ?? [];
        const recurringInMonth = recurring.filter(e => {
            if (!e.recurringFromMonth) return false;
            if (e.recurringFromMonth > commonExpensesMonthKey) return false;
            if (e.recurringUntilMonth && e.recurringUntilMonth < commonExpensesMonthKey) return false;
            return true;
        });
        const monthly = currentAgency?.settings?.commonExpensesByMonth?.[commonExpensesMonthKey] ?? [];
        const totalRecurring = recurringInMonth.reduce((s, e) => s + (e.amount || 0), 0);
        const totalMonthly = monthly.reduce((s, e) => s + (e.amount || 0), 0);
        return {
            total: totalRecurring + totalMonthly,
            totalRecurring,
            totalMonthly,
            countRecurring: recurringInMonth.length,
            countMonthly: monthly.length,
        };
    }, [currentAgency?.settings?.commonExpensesRecurring, currentAgency?.settings?.commonExpensesByMonth, commonExpensesMonthKey]);
    const commonExpensesZeroHourWarningNames = useMemo(() => {
        if (!commonExpensesAlloc.ok || commonExpensesAlloc.employeeIdsZeroHoursWithPeersWorking.length === 0) {
            return [] as string[];
        }
        return commonExpensesAlloc.employeeIdsZeroHoursWithPeersWorking
            .map(id => employees.find(e => e.id === id)?.name)
            .filter((n): n is string => Boolean(n));
    }, [commonExpensesAlloc, employees]);

    const overheadVisibleFromRows = useMemo(() => {
        let sum = 0;
        employeeMetricsForView.forEach(em => {
            const totalHEmployeeInMode = hoursMode === 'computed' ? em.totalComputed : em.totalActual;
            const totalHGlobal = employeeHoursGlobalById.get(em.employeeId) ?? totalHEmployeeInMode;
            em.projectBreakdown.forEach(pb => {
                const hours = pb.hours;
                const actualHours = pb.actual ?? 0;
                const monthlyFee = projectByIdForAttr.get(pb.projectId)?.monthlyFee ?? 0;
                const isInternal = (monthlyFee ?? 0) === 0;
                const hoursDisplay = hoursMode === 'computed' ? hours : actualHours;
                const hasHours = hoursDisplay > 0;
                if (hasHours && (isInternal || (monthlyFee ?? 0) > 0)) {
                    sum += overheadShareForRow(em.employeeId, hoursDisplay, totalHGlobal, overheadByEmployee);
                }
            });
        });
        return Math.round(sum * 100) / 100;
    }, [employeeMetricsForView, hoursMode, projectByIdForAttr, employeeHoursGlobalById, overheadByEmployee]);

    const employeeProfitabilityFilteredBySearch = useMemo(() => {
        if (!searchQuery.trim()) return employeeProfitabilityList;
        const q = searchQuery.trim().toLowerCase();
        return employeeProfitabilityList.filter(ep => {
            if (ep.employeeName.toLowerCase().includes(q)) return true;
            return ep.byProject.some(bp => bp.projectName.toLowerCase().includes(q));
        });
    }, [employeeProfitabilityList, searchQuery]);

    /** Con búsqueda activa: totales por empleado solo de proyectos que coinciden con el filtro (para fila y pie). */
    const employeeDisplayTotalsWhenSearch = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.trim().toLowerCase();
        const map = new Map<
            string,
            { hours: number; attr: number; cost: number; margin: number; payroll: number; overhead: number }
        >();
        employeeProfitabilityFilteredBySearch.forEach(ep => {
            const filtered = ep.byProject.filter(bp => bp.projectName.toLowerCase().includes(q));
            const hours = filtered.reduce((s, b) => s + b.hoursDisplay, 0);
            const attr = filtered.reduce((s, b) => s + b.attributedRevenue, 0);
            const cost = filtered.reduce((s, b) => s + b.cost, 0);
            const margin = filtered.reduce((s, b) => s + b.margin, 0);
            const payroll = filtered.reduce((s, b) => s + b.payrollCost, 0);
            const overhead = filtered.reduce((s, b) => s + b.overheadCost, 0);
            map.set(ep.employeeId, { hours, attr, cost, margin, payroll, overhead });
        });
        return map;
    }, [employeeProfitabilityFilteredBySearch, searchQuery]);

    const departmentNameForView = useMemo(() => {
        if (!selectedDepartmentId) return null;
        const d = departments.find(x => x.id === selectedDepartmentId || x.name === selectedDepartmentId);
        return d?.name ?? null;
    }, [selectedDepartmentId, departments]);

    const internalWithActivity = useMemo(
        () => projectMetricsInternal.filter(p => (hoursMode === 'computed' ? p.computed : p.actual) > 0),
        [projectMetricsInternal, hoursMode]
    );

    const hoursHeaderLabel = hoursMode === 'computed' ? 'HORAS (COMPUTADAS)' : 'HORAS (REALES)';
    const costHeaderLabel = effectiveCostMode === 'standard' ? 'Coste (€) — Operativo' : 'Coste (€) — Dinámico';
    const costHeaderTooltip = useMemo(() => {
        const commonNote =
            agencyTotalOverheadApplied > 0
                ? ' ' +
                  t(
                      'financialHealth.costTooltip.commonNote',
                      'Incluye gastos comunes del mes prorrateados por horas. En modo operativo la nómina usa capacidad teórica; los gastos comunes usan las horas del mes (reales o computadas según el filtro).'
                  )
                : '';
        if (dynamicCostFallbackActive) {
            const base = t(
                'financialHealth.costTooltip.fallbackIntro',
                'Cálculo dinámico en espera: aún no hay suficientes horas registradas en el mes para un prorrateo exacto de la nómina. Se muestra temporalmente el coste operativo.'
            );
            const extra =
                agencyTotalOverheadApplied > 0
                    ? ' ' +
                      t(
                          'financialHealth.costTooltip.fallbackCommon',
                          'Los gastos comunes se siguen prorrateando con las horas registradas del mes en el modo elegido (reales o computadas).'
                      )
                    : '';
            return base + extra;
        }
        if (costMode === 'standard') {
            return (
                t(
                    'financialHealth.costTooltip.standard',
                    'Suma de horas × coste hora operativo (capacidad teórica del mes).'
                ) + commonNote
            );
        }
        return (
            t(
                'financialHealth.costTooltip.dynamic',
                'Suma de horas × coste hora prorrateado del mes. El total de nómina coincide con las nóminas.'
            ) + commonNote
        );
    }, [dynamicCostFallbackActive, costMode, agencyTotalOverheadApplied, t]);

    const handleExportDiagnosticJson = useCallback(() => {
        try {
            const payload = buildRentabilityDiagnosticPayload({
                commonExpensesAlloc,
                commonExpensesMonthKey,
                costMode,
                effectiveCostMode,
                isViewingCurrentMonth,
                dynamicCostFallbackActive,
                pctMonthElapsed,
                departmentNameForView,
                searchQueryActive: Boolean(searchQuery.trim()),
                agencyId: currentAgency?.id ?? null,
                agencyName: currentAgency?.name ?? null,
                hoursMode,
                totalRevenue,
                totalHoursForView,
                effectiveHourlyRate,
                netMargin,
                marginPercent,
                totalInternalCost,
                totalOverheadInView,
                ehrTarget,
                projectMetricsForView,
                projectCostAndMarginMap,
                employeeProfitabilityList,
                employees,
            });

            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `taimbox-rentabilidad-diagnostico-${commonExpensesMonthKey}.json`;
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success(t('financialHealth.exportDiagnostic.success'));
        } catch (e) {
            console.error(e);
            toast.error(t('financialHealth.exportDiagnostic.error'));
        }
    }, [
        commonExpensesAlloc,
        commonExpensesMonthKey,
        costMode,
        currentAgency?.id,
        currentAgency?.name,
        departmentNameForView,
        dynamicCostFallbackActive,
        effectiveCostMode,
        effectiveHourlyRate,
        employeeProfitabilityList,
        employees,
        ehrTarget,
        hoursMode,
        isViewingCurrentMonth,
        marginPercent,
        netMargin,
        pctMonthElapsed,
        projectCostAndMarginMap,
        projectMetricsForView,
        searchQuery,
        totalHoursForView,
        totalInternalCost,
        totalOverheadInView,
        totalRevenue,
        t,
    ]);

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
            {/* Cabecera con título y contexto */}
            <header className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <DollarSign className="h-7 w-7 text-emerald-600 shrink-0" aria-hidden />
                    {t('financialHealth.title', 'Rentabilidad')}
                </h1>
                <p className="text-slate-600 text-sm max-w-xl">
                    {t('financialHealth.subtitle', 'Precio hora efectivo, margen neto y rentabilidad por proyecto y empleado.')}
                    {departmentNameForView && (
                        <span className="block mt-1 text-emerald-700 font-medium">
                            {t('financialHealth.view', 'Vista:')} {departmentNameForView}
                        </span>
                    )}
                </p>
            </header>

            {/* Barra de filtros y navegación */}
            <TooltipProvider delayDuration={300}>
                <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="relative flex-1 min-w-0 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden />
                        <Input
                            placeholder={t('financialHealth.search', 'Buscar proyecto o cliente...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-white border-slate-200"
                            aria-label="Buscar en Rentabilidad"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePrevMonth}
                                    disabled={minReportingMonth != null && isSameMonth(currentMonth, minReportingMonth)}
                                    className="h-9 w-9 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                    aria-label="Mes anterior"
                                >
                                    <ChevronRight className="h-4 w-4 rotate-180" />
                                </Button>
                                <Button variant="ghost" onClick={handleToday} className="h-9 px-3 text-sm font-medium text-slate-800 capitalize min-w-[100px]">
                                    {format(currentMonth, 'MMM yyyy', { locale: es })}
                                </Button>
                                {minReportingMonth != null && (
                                    <span className="text-xs text-slate-500 hidden sm:inline">{t('financialHealth.controls.starterPlan', 'Plan Starter: mes actual y anterior')}</span>
                                )}
                                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 text-slate-600 hover:bg-slate-100" aria-label="Mes siguiente">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            {isViewingCurrentMonth ? (
                                <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 animate-pulse">
                                    {t('financialHealth.controls.currentMonth', 'Mes en curso')}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-slate-200 text-slate-600 border-0">
                                    {t('financialHealth.controls.closedMonth', 'Mes cerrado')}
                                </Badge>
                            )}
                            {canAccess('/agency') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 gap-1.5 shrink-0"
                                    onClick={() => setProfitSettingsOpen(true)}
                                >
                                    <Settings2 className="h-4 w-4" />
                                    {t('financialHealth.settings.openButton', 'Objetivo y gastos')}
                                </Button>
                            )}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-1.5 shrink-0"
                                        onClick={handleExportDiagnosticJson}
                                    >
                                        <Download className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t('financialHealth.exportDiagnostic.button')}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs max-w-xs">
                                    {t('financialHealth.exportDiagnostic.tooltip')}
                                </TooltipContent>
                            </Tooltip>
                            {canAccess('/agency') && (
                                <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0 text-xs" asChild>
                                    <Link to="/exportacion-informes">{t('financialHealth.exportHubLink', 'Más exportaciones')}</Link>
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{t('financialHealth.filters.hours', 'Horas:')}</span>
                            <div className="flex rounded-md border border-slate-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setHoursMode('actual')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium transition-colors",
                                        hoursMode === 'actual' ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {t('financialHealth.filters.actual', 'Reales')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHoursMode('computed')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium transition-colors border-l border-slate-200",
                                        hoursMode === 'computed' ? "bg-fuchsia-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {t('financialHealth.filters.computed', 'Computadas')}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{t('financialHealth.filters.cost', 'Coste:')}</span>
                            <div className="flex rounded-md border border-slate-200 overflow-hidden">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => setCostMode('standard')}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-medium transition-colors",
                                                costMode === 'standard' ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {t('financialHealth.filters.operational', 'Operativo')}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">
                                        {t('financialHealth.filters.operationalHelp', 'Aísla el coste del proyecto de vacaciones y tiempos muertos.')}
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => setCostMode('dynamic')}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-medium transition-colors border-l border-slate-200",
                                                costMode === 'dynamic' ? "bg-amber-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {t('financialHealth.filters.dynamic', 'Dinámico')}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">
                                        {t('financialHealth.filters.dynamicHelp', 'Reparte la nómina entre las horas reales del mes (el total coincide con la nómina).')}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-700 shrink-0" onClick={() => setCostHelpOpen(true)} aria-label="Cómo se calcula el coste">
                                <Info className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </TooltipProvider>

            <Dialog open={costHelpOpen} onOpenChange={setCostHelpOpen}>
                <DialogContent className="max-w-xl rounded-2xl border-slate-200/90 shadow-xl p-0 gap-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 border-b border-slate-200/80 px-6 pt-6 pb-5">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2.5">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-sm text-primary">
                                    <DollarSign className="h-5 w-5" />
                                </span>
                                Modelos de coste
                            </DialogTitle>
                            <p className="text-sm text-slate-500 leading-relaxed mt-2">
                                Dos formas de analizar la rentabilidad, según lo que necesites en cada momento.
                            </p>
                        </DialogHeader>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 border-l-4 border-l-indigo-500">
                            <div className="flex items-center gap-2.5 mb-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                                    <Lock className="h-4 w-4" />
                                </span>
                                <h3 className="font-semibold text-slate-900 text-sm">Coste estándar (operativo)</h3>
                                <span className="text-[11px] font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Por defecto</span>
                            </div>
                            <ul className="space-y-2.5 text-sm text-slate-600">
                                <li className="flex gap-2.5 pl-0">
                                    <span className="text-indigo-600 font-semibold shrink-0 w-[120px]">Para qué sirve:</span>
                                    <span>Evaluar si un proyecto o un cliente es rentable.</span>
                                </li>
                                <li className="flex gap-2.5 pl-0">
                                    <span className="text-indigo-600 font-semibold shrink-0 w-[120px]">Cómo se calcula:</span>
                                    <span>Coste por hora = nómina ÷ <strong>capacidad teórica del mes</strong> (horas que trabajaría sin vacaciones). Si no está definida, se usan 110 h de referencia.</span>
                                </li>
                                <li className="flex gap-2.5 pl-0">
                                    <span className="text-indigo-600 font-semibold shrink-0 w-[120px]">Por qué no coincide:</span>
                                    <span>Se calcula siempre sobre las mismas horas teóricas: las vacaciones no reducen la base, por lo que los proyectos no se ven más caros; si se trabajan más horas, el coste mostrado puede superar la nómina (margen adicional).</span>
                                </li>
                            </ul>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 border-l-4 border-l-violet-500">
                            <div className="flex items-center gap-2.5 mb-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                                    <Wallet className="h-4 w-4" />
                                </span>
                                <h3 className="font-semibold text-slate-900 text-sm">Coste dinámico</h3>
                            </div>
                            <ul className="space-y-2.5 text-sm text-slate-600">
                                <li className="flex gap-2.5 pl-0">
                                    <span className="text-violet-600 font-semibold shrink-0 w-[120px]">Para qué sirve:</span>
                                    <span>Cuadrar la cuenta del banco a final de mes.</span>
                                </li>
                                <li className="flex gap-2.5 pl-0">
                                    <span className="text-violet-600 font-semibold shrink-0 w-[120px]">Cómo se calcula:</span>
                                    <span>Coste por hora = nómina ÷ <strong>horas reales del mes</strong> (las registradas, incluyendo tiempos muertos y vacaciones). El total coincide con la nómina.</span>
                                </li>
                                <li className="flex gap-2.5 pl-0">
                                    <span className="text-violet-600 font-semibold shrink-0 w-[120px]">Cuándo usarlo:</span>
                                    <span>Cuando necesites ver a dónde ha ido cada céntimo que ha salido del banco.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 border-l-4 border-l-teal-500">
                            <div className="flex items-center gap-2.5 mb-2">
                                <Landmark className="h-4 w-4 text-teal-600" />
                                <h3 className="font-semibold text-slate-900 text-sm">Gastos comunes</h3>
                            </div>
                            <p className="text-sm text-slate-600">
                                {t('financialHealth.costHelp.commonCosts')}
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80">
                        <Button
                            onClick={() => setCostHelpOpen(false)}
                            className="rounded-lg px-6 font-medium"
                        >
                            Entendido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={profitSettingsOpen} onOpenChange={setProfitSettingsOpen}>
                <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] max-h-[min(90vh,880px)] overflow-y-auto rounded-2xl border-slate-200">
                    <DialogHeader>
                        <DialogTitle>
                            {t('financialHealth.settings.dialogTitle', 'Objetivo EHR y gastos comunes')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'financialHealth.settings.dialogDescription',
                                'Define el precio hora objetivo y los gastos que se prorratean en esta página (fijos por mes o puntuales).'
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="max-w-xs space-y-2">
                            <Label htmlFor="fh-ehr-target">
                                {t('agency.general.ehrTarget', 'Objetivo Precio Hora Efectivo (€/h)')}
                            </Label>
                            <Input
                                id="fh-ehr-target"
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                value={ehrTargetInput}
                                onChange={e => setEhrTargetInput(sanitizePositiveDecimalInput(e.target.value))}
                                onBlur={() => {
                                    const v = parsePositiveDecimalInput(ehrTargetInput, 75, 1);
                                    setEhrTargetInput(numberToPositiveDecimalInputString(v, 75));
                                }}
                            />
                            <p className="text-xs text-slate-500">
                                {t(
                                    'financialHealth.settings.ehrNote',
                                    'Mínimo 1 €/h. Si no guardas un valor, se usará el coste cargado o 75 €/h según la lógica de la página.'
                                )}
                            </p>
                        </div>
                        <CommonExpensesSettingsCard
                            departments={departments}
                            value={commonExpensesDraft}
                            onChange={setCommonExpensesDraft}
                            recurringValue={commonExpensesRecurringDraft}
                            onRecurringChange={setCommonExpensesRecurringDraft}
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setProfitSettingsOpen(false)}
                            disabled={profitSettingsSaving}
                        >
                            {t('financialHealth.settings.cancel', 'Cancelar')}
                        </Button>
                        <Button type="button" onClick={handleSaveProfitSettings} disabled={profitSettingsSaving}>
                            {profitSettingsSaving
                                ? t('financialHealth.settings.saving', 'Guardando…')
                                : t('financialHealth.settings.save', 'Guardar')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <TooltipProvider delayDuration={300}>
                <Tabs defaultValue="resumen" className="space-y-6">
                    <div className="space-y-1">
                        <TabsList className="grid w-full max-w-lg grid-cols-3 h-11 bg-slate-100 p-1 rounded-lg">
                            <TabsTrigger value="resumen" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                                <LayoutDashboard className="h-4 w-4 shrink-0" />
                                Resumen
                            </TabsTrigger>
                            <TabsTrigger value="proyectos" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                                <FolderKanban className="h-4 w-4 shrink-0" />
                                Proyectos
                            </TabsTrigger>
                            <TabsTrigger value="empleados" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                                <UserCircle className="h-4 w-4 shrink-0" />
                                Empleados
                            </TabsTrigger>
                        </TabsList>
                        <p className="text-xs text-slate-500 px-0.5">Resumen · Tabla de proyectos · Rentabilidad por empleado en €</p>
                    </div>

                    <TabsContent value="resumen" className="space-y-8 mt-0">
                        {/* KPIs */}
                        <section className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Indicadores clave">
                            <Card className="border-l-4 border-emerald-500 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                            <DollarSign className="h-4 w-4" />
                                        </span>
                                        Precio Hora Efectivo (EHR)
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-1">
                                        Ingresos por horas {hoursMode === 'computed' ? 'computadas' : 'reales'}. Solo proyectos facturables con actividad.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span
                                            className={cn(
                                                "text-3xl md:text-4xl font-bold tabular-nums",
                                                totalHoursForView === 0 ? "text-slate-400" : ehrIsHealthy ? "text-emerald-700" : "text-red-600"
                                            )}
                                        >
                                            {totalHoursForView > 0
                                                ? `${effectiveHourlyRate.toFixed(0)} €/h`
                                                : '–'}
                                        </span>
                                        {totalHoursForView > 0 && !ehrIsHealthy && (
                                            <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Objetivo de la agencia:{' '}
                                        <span className="font-semibold tabular-nums">
                                          {formatEhrTargetForDisplay(ehrTarget)} €/h
                                        </span>
                                    </p>
                                    {totalHoursForView > 0 && (
                                        <p className="text-[11px] mt-1 text-slate-500">
                                            {ehrIsHealthy ? (
                                                <>Por encima del objetivo. La agencia está generando buen margen por hora.</>
                                            ) : (
                                                <>Por debajo del objetivo. Cada hora trabajada deja menos margen del deseado.</>
                                            )}
                                        </p>
                                    )}
                                    {usesLoadedCostForTarget && (
                                        <p className="text-[11px] mt-1 text-slate-500">
                                            {t('financialHealth.ehrTargetLoadedNote')}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className={cn("border-l-4 shadow-sm bg-white overflow-hidden", marginIsPositive ? "border-emerald-500" : "border-red-500")}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", marginIsPositive ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                                            {marginIsPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                        </span>
                                        Margen Neto
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-1">
                                        Ingresos menos coste interno. Solo proyectos facturables con actividad.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span
                                            className={cn(
                                                "text-3xl md:text-4xl font-bold tabular-nums",
                                                marginIsPositive ? "text-emerald-700" : "text-red-600"
                                            )}
                                        >
                                            {netMargin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </span>
                                        {marginIsPositive ? (
                                            <TrendingUp className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                                        ) : (
                                            <TrendingDown className="h-5 w-5 text-red-500" aria-hidden="true" />
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Badge
                                            variant={marginIsPositive ? 'outline' : 'destructive'}
                                            className={cn(
                                                "text-[11px] font-semibold tabular-nums",
                                                marginIsPositive
                                                    ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                                    : "border-red-300 bg-red-600/90 text-white"
                                            )}
                                        >
                                            {marginPercent != null
                                                ? `${marginPercent.toFixed(1)}% margen`
                                                : totalRevenue <= 0 && netMargin !== 0
                                                  ? 'n/a margen (sin ingreso devengado)'
                                                  : 'Sin facturación'}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-indigo-500 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                            <Landmark className="h-4 w-4" />
                                        </span>
                                        Gastos comunes del mes
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-1">
                                        Alquiler, software y otros gastos fijos imputados a los empleados.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl md:text-4xl font-bold tabular-nums text-slate-800">
                                            {commonExpensesBreakdown.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                        <span>
                                            Fijos:{' '}
                                            <span className="font-semibold tabular-nums">
                                                {commonExpensesBreakdown.totalRecurring.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                            </span>
                                            {' '}({commonExpensesBreakdown.countRecurring} líneas)
                                        </span>
                                        <span className="text-slate-400">·</span>
                                        <span>
                                            Puntuales:{' '}
                                            <span className="font-semibold tabular-nums">
                                                {commonExpensesBreakdown.totalMonthly.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                            </span>
                                            {' '}({commonExpensesBreakdown.countMonthly} líneas)
                                        </span>
                                    </div>
                                    {commonExpensesBreakdown.total > 0 && totalRevenue > 0 && (
                                        <p className="text-[11px] mt-1 text-slate-500">
                                            {((commonExpensesBreakdown.total / totalRevenue) * 100).toFixed(1)}% sobre ingresos del mes.
                                        </p>
                                    )}
                                    {commonExpensesBreakdown.total === 0 && (
                                        <p className="text-[11px] mt-1 text-slate-500">
                                            Aún no hay gastos comunes configurados. Añade alquiler, licencias u otros costes compartidos para un coste real por hora.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </section>

                        {(commonExpensesAllocError ||
                            agencyTotalOverheadApplied > 0 ||
                            commonExpensesZeroHourWarningNames.length > 0 ||
                            (commonExpensesAlloc.ok &&
                                commonExpensesAlloc.unallocatedAmount > 0.009)) && (
                            <section aria-label={t('financialHealth.commonExpenses.title')}>
                                <Card className="shadow-sm border border-slate-200 bg-white border-l-4 border-l-indigo-500 overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                <Landmark className="h-4 w-4" />
                                            </span>
                                            {t('financialHealth.commonExpenses.title')}
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500">
                                            {t('financialHealth.commonExpenses.description')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        {commonExpensesAllocError && (
                                            <p className="text-red-600 text-sm">
                                                {t('financialHealth.commonExpenses.allocError')}
                                                {commonExpensesAllocError.code === 'SPLIT_SUM_OUT_OF_RANGE' &&
                                                    commonExpensesAllocError.splitSum != null && (
                                                        <span className="ml-1 tabular-nums">
                                                            ({t('agency.commonExpenses.errSplitSum')} — Σ={commonExpensesAllocError.splitSum.toFixed(2)}%)
                                                        </span>
                                                    )}
                                            </p>
                                        )}
                                        {commonExpensesAlloc.ok && commonExpensesAlloc.unallocatedAmount > 0.009 && (
                                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                                                {t(
                                                    'financialHealth.commonExpenses.unallocated',
                                                    'Parte de los gastos comunes no se ha podido imputar ({{amount}}). Revisa departamentos vacíos o líneas con 0 h en modo por horas.',
                                                    {
                                                        amount: commonExpensesAlloc.unallocatedAmount.toLocaleString('es-ES', {
                                                            style: 'currency',
                                                            currency: 'EUR',
                                                        }),
                                                    }
                                                )}
                                            </p>
                                        )}
                                        {!commonExpensesAllocError && agencyTotalOverheadApplied > 0 && (
                                            <>
                                                <dl className="grid gap-2 sm:grid-cols-2">
                                                    <div>
                                                        <dt className="text-xs text-slate-500">
                                                            {t('financialHealth.commonExpenses.totalAgency')}
                                                        </dt>
                                                        <dd className="font-mono font-semibold text-slate-800">
                                                            {agencyTotalOverheadApplied.toLocaleString('es-ES', {
                                                                style: 'currency',
                                                                currency: 'EUR',
                                                            })}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs text-slate-500">
                                                            {t('financialHealth.commonExpenses.inViewRows')}
                                                        </dt>
                                                        <dd className="font-mono font-semibold text-slate-800">
                                                            {overheadVisibleFromRows.toLocaleString('es-ES', {
                                                                style: 'currency',
                                                                currency: 'EUR',
                                                            })}
                                                        </dd>
                                                    </div>
                                                </dl>
                                                {Math.abs(overheadVisibleFromRows - agencyTotalOverheadApplied) > 0.02 && (
                                                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                                                        {t('financialHealth.commonExpenses.diffNote')}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                        {commonExpensesZeroHourWarningNames.length > 0 && (
                                            <p className="text-xs text-slate-600">
                                                {t('financialHealth.commonExpenses.zeroHourPeers', {
                                                    names: commonExpensesZeroHourWarningNames.join(', '),
                                                })}
                                            </p>
                                        )}
                                        {canAccess('/agency') && (
                                            <p>
                                                <button
                                                    type="button"
                                                    onClick={() => setProfitSettingsOpen(true)}
                                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline-offset-2 hover:underline"
                                                >
                                                    {t('financialHealth.commonExpenses.configure')}
                                                </button>
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* Radar de hemorragias */}
                        <section aria-label="Radar de hemorragias">
                            <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                            <ArrowDownRight className="h-4 w-4" />
                                        </span>
                                        Radar de hemorragias
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500">
                                        Proyectos facturables ordenados por peor Precio Hora Efectivo. Arriba, los que más sangran rentabilidad.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {sortedProjects.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                            <div className="rounded-full bg-slate-100 p-4 mb-3">
                                                <FolderKanban className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-600">Sin proyectos con facturación este mes</p>
                                            <p className="text-xs text-slate-500 mt-1 max-w-sm">No hay proyectos facturables con actividad, o no coinciden con los filtros aplicados.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Cliente / Proyecto</th>
                                                            <th className="px-4 py-3 text-right font-medium">
                                                                <span className="inline-flex items-center gap-1">
                                                                    {isViewingCurrentMonth ? 'Ingreso devengado (€)' : 'Ingreso (Fee)'}
                                                                    {isViewingCurrentMonth && (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <span className="cursor-help text-slate-400 hover:text-slate-600 inline-flex" aria-label="Info ingreso devengado">
                                                                                    <Info className="h-3.5 w-3.5" />
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top" className="text-xs">
                                                                                En mes en curso se muestra el ingreso devengado (prorrateo por días). Si el proyecto ya ha cumplido o superado el 100 % de las horas del presupuesto, se muestra el fee total.
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                </span>
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-medium">{hoursHeaderLabel} / Budget</th>
                                                            <th className="px-4 py-3 text-right font-medium">Precio Hora Efectivo</th>
                                                            <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.payrollImputed')}</span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="text-xs max-w-xs">
                                                                        {t('financialHealth.columns.payrollImputedHelp')}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.commonOverhead')}</span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="text-xs max-w-xs">
                                                                        {t('financialHealth.columns.commonOverheadHelp')}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-medium">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="cursor-help underline decoration-dotted">Ritmo</span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="text-xs">
                                                                        % de presupuesto consumido frente a % de mes transcurrido. Rojo: ritmo por encima de lo previsto. Verde: ritmo adecuado.
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-medium">Margen (€)</th>
                                                            <th className="px-4 py-3 text-right font-medium rounded-tr-lg">Acción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {projectsToShow.map(({ metric: p, clientName, ehr, ehrLabel }, idx) => {
                                                            const cm = projectCostAndMarginMap.get(p.projectId) ?? { cost: 0, payrollCost: 0, overheadCost: 0, margin: 0 };
                                                            const displayFeeRadar = projectDisplayFeeMap.get(p.projectId) ?? p.monthlyFee ?? 0;
                                                            const displayMarginRadar = displayFeeRadar - cm.cost;
                                                            const marginPctRadar = displayFeeRadar > 0 ? (displayMarginRadar / displayFeeRadar) * 100 : 0;
                                                            const semaphoreRadar = getMarginSemaphore(marginPctRadar);
                                                            const attributionRows = projectEmployeeAttributionMap.get(p.projectId) || [];
                                                            const client = clients.find(c => c.id === p.clientId);
                                                            const clientInitialsRaw = (clientName || '?')
                                                                .split(' ')
                                                                .slice(0, 2)
                                                                .map(part => part[0])
                                                                .join('')
                                                                .toUpperCase();
                                                            const clientInitials = privacyDemoActive
                                                                ? privacyAnonymizer.account(p.clientId ?? 'unknown-client').slice(0, 2).toUpperCase()
                                                                : clientInitialsRaw;
                                                            const projectHours = hoursMode === 'computed' ? p.computed : p.actual;
                                                            const hoursRatio = p.budget > 0 ? projectHours / p.budget : 0;
                                                            const isOverBudget = projectHours > p.budget && p.budget > 0;
                                                            const ehrBelowTarget = isFinite(ehr) && projectHours > 0 && ehr < ehrTarget;
                                                            const isExpanded = expandedProjects.has(p.projectId);

                                                            return (
                                                                <Fragment key={p.projectId}>
                                                                    <tr
                                                                        role="button"
                                                                        tabIndex={0}
                                                                        className={cn("align-top transition-colors cursor-pointer", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}
                                                                        onClick={() => toggleProject(p.projectId)}
                                                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleProject(p.projectId); } }}
                                                                    >
                                                                        <td className="px-4 py-3 align-top min-w-[12rem] sm:min-w-[20rem] lg:min-w-[24rem]">
                                                                            <div className="flex items-start gap-3">
                                                                                <Avatar className="h-8 w-8 border shrink-0 mt-0.5">
                                                                                    <AvatarFallback
                                                                                        className="bg-slate-900 text-white text-xs font-bold flex items-center justify-center"
                                                                                        style={client?.color ? { backgroundColor: client.color, color: 'white' } : undefined}
                                                                                    >
                                                                                        {clientInitials}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="font-semibold text-slate-900 break-words whitespace-normal leading-snug">
                                                                                        <SensitiveText kind="project" id={p.projectId}>{p.projectName}</SensitiveText>
                                                                                    </div>
                                                                                    <div className="text-[11px] text-slate-500 break-words whitespace-normal leading-snug mt-0.5">
                                                                                        <SensitiveText kind="account" id={p.clientId ?? 'unknown-client'}>{clientName}</SensitiveText>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right align-middle">
                                                                            <div className="font-mono text-xs tabular-nums">
                                                                                {(projectDisplayFeeMap.get(p.projectId) ?? p.monthlyFee).toLocaleString('es-ES', {
                                                                                    style: 'currency',
                                                                                    currency: 'EUR'
                                                                                })}
                                                                                {isViewingCurrentMonth && (p.monthlyFee ?? 0) > 0 && (
                                                                                    <span className="block text-[10px] text-slate-400 font-normal">/ {p.monthlyFee.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} total</span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right align-middle">
                                                                            <div className="flex flex-col items-end gap-1">
                                                                                <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                                                                                    {projectHours.toFixed(1)}h / {p.budget.toFixed(1)}h
                                                                                </span>
                                                                                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                    <div
                                                                                        className={cn(
                                                                                            "h-full rounded-full transition-all",
                                                                                            isOverBudget ? "bg-red-500" : "bg-emerald-500"
                                                                                        )}
                                                                                        style={{
                                                                                            width: `${Math.min(100, p.budget > 0 ? (hoursRatio * 100) : 0)}%`
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right align-middle">
                                                                            <div className="flex items-center justify-end gap-1">
                                                                                {projectHours > 0 ? (
                                                                                    <Badge
                                                                                        variant={ehrBelowTarget ? 'destructive' : 'outline'}
                                                                                        className={cn(
                                                                                            "text-[11px] font-semibold tabular-nums",
                                                                                            ehrBelowTarget
                                                                                                ? "bg-red-600 text-white border-red-600"
                                                                                                : "bg-emerald-50 text-emerald-700 border-emerald-300"
                                                                                        )}
                                                                                    >
                                                                                        {ehrLabel}
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge variant="outline" className="text-[11px] text-slate-500 border-slate-300 bg-slate-50">
                                                                                        Sin iniciar
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right align-middle font-mono text-xs tabular-nums text-slate-700" onClick={(e) => e.stopPropagation()}>
                                                                            {cm.payrollCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right align-middle font-mono text-xs tabular-nums text-slate-600" onClick={(e) => e.stopPropagation()}>
                                                                            {cm.overheadCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right align-middle">
                                                                            {(() => {
                                                                                const pacing = projectPacingMap.get(p.projectId);
                                                                                if (!pacing || p.budget <= 0) return <span className="text-slate-400 text-[11px]">–</span>;
                                                                                return (
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <div className="flex items-center gap-1.5 justify-end">
                                                                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                                    <div
                                                                                                        className={cn("h-full rounded-full", pacing.isOverPacing ? "bg-red-500" : "bg-emerald-500")}
                                                                                                        style={{ width: `${Math.min(100, pacing.pctConsumed)}%` }}
                                                                                                    />
                                                                                                </div>
                                                                                                {pacing.isOverPacing ? <Flame className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden />}
                                                                                            </div>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent side="top" className="text-xs">
                                                                                            {pacing.isOverPacing
                                                                                                ? `Consumido ${pacing.pctConsumed.toFixed(0)}% del presupuesto con ${pacing.pctElapsed.toFixed(0)}% del mes transcurrido. Ritmo por encima de lo previsto; a este ritmo puede reducirse el margen a fin de mes.`
                                                                                                : `Consumido ${pacing.pctConsumed.toFixed(0)}% del presupuesto con ${pacing.pctElapsed.toFixed(0)}% del mes transcurrido. Ritmo adecuado.`}
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                );
                                                                            })()}
                                                                        </td>
                                                                        <td className={cn("px-4 py-3 text-right align-middle font-mono text-xs tabular-nums font-semibold", semaphoreRadar.className)}>
                                                                            <span className="inline-flex items-center justify-end gap-1">
                                                                                {semaphoreRadar.showAlert && <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                                                                                {displayMarginRadar.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                                                                            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-slate-600 hover:text-slate-900" onClick={(e) => { e.stopPropagation(); toggleProject(p.projectId); }}>
                                                                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                                                Desglose
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                    {isExpanded && (
                                                                        <tr>
                                                                            <td colSpan={9} className="p-0 align-top bg-slate-50/50">
                                                                                <div className="px-4 py-4">
                                                                                    {attributionRows.length === 0 ? (
                                                                                        <p className="text-sm italic text-slate-500 py-4">Sin desglose por empleado para este mes.</p>
                                                                                    ) : (
                                                                                        <div className="flex flex-col lg:flex-row gap-4">
                                                                                            <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                                                                                <div className="overflow-x-auto">
                                                                                                    <table className="w-full text-sm min-w-[320px]">
                                                                                                        <colgroup>
                                                                                                            <col className="min-w-[112px] w-[32%]" />
                                                                                                            <col className="min-w-[64px] w-[10%]" />
                                                                                                            <col className="min-w-[88px] w-[14%]" />
                                                                                                            <col className="min-w-[80px] w-[13%]" />
                                                                                                            <col className="min-w-[72px] w-[11%]" />
                                                                                                            <col className="min-w-[72px] w-[11%]" />
                                                                                                            <col className="min-w-[80px] w-[9%]" />
                                                                                                        </colgroup>
                                                                                                        <thead>
                                                                                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                                                                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Empleado</th>
                                                                                                                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Horas</th>
                                                                                                                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Ingreso atrib. (€)</th>
                                                                                                                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Coste (€)</th>
                                                                                                                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                                                                                                                    <Tooltip>
                                                                                                                        <TooltipTrigger asChild>
                                                                                                                            <span className="cursor-help underline decoration-dotted">{t('financialHealth.employee.projectExpandCostPerHour')}</span>
                                                                                                                        </TooltipTrigger>
                                                                                                                        <TooltipContent side="top" className="text-xs max-w-xs">
                                                                                                                            {t('financialHealth.employee.projectExpandCostPerHourTooltip')}
                                                                                                                        </TooltipContent>
                                                                                                                    </Tooltip>
                                                                                                                </th>
                                                                                                                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                                                                                                                    <Tooltip>
                                                                                                                        <TooltipTrigger asChild>
                                                                                                                            <span className="cursor-help underline decoration-dotted">{t('financialHealth.employee.expandMarginPerHour')}</span>
                                                                                                                        </TooltipTrigger>
                                                                                                                        <TooltipContent side="top" className="text-xs max-w-xs">
                                                                                                                            {t('financialHealth.employee.expandMarginPerHourTooltip')}
                                                                                                                        </TooltipContent>
                                                                                                                    </Tooltip>
                                                                                                                </th>
                                                                                                                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Margen (€)</th>
                                                                                                            </tr>
                                                                                                            <tr className="bg-slate-50/80">
                                                                                                                <th className="text-left py-0.5 px-4 text-[11px] font-normal text-slate-400" colSpan={7}>{hoursMode === 'computed' ? 'Horas computadas' : 'Horas reales'}</th>
                                                                                                            </tr>
                                                                                                        </thead>
                                                                                                        <tbody className="divide-y divide-slate-100">
                                                                                                            {attributionRows.map((row, i) => {
                                                                                                                const emp = employees.find(e => e.id === row.employeeId);
                                                                                                                const rowMarginPct = row.attributedRevenue > 0 ? (row.margin / row.attributedRevenue) * 100 : (row.margin < 0 ? -1 : 0);
                                                                                                                const rowSem = getMarginSemaphore(rowMarginPct);
                                                                                                                const costPh = row.hoursDisplay > 0.001 ? row.cost / row.hoursDisplay : 0;
                                                                                                                const marginPh = row.hoursDisplay > 0.001 ? row.margin / row.hoursDisplay : 0;
                                                                                                                return (
                                                                                                                    <tr key={row.employeeId} className={cn("transition-colors hover:bg-slate-50/50", i % 2 === 1 && "bg-slate-50/30")}>
                                                                                                                        <td className="py-2.5 px-4 font-medium text-slate-900" title={emp?.name || 'Empleado'}>{emp?.name || 'Empleado'}</td>
                                                                                                                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 text-sm">{row.hoursDisplay.toFixed(1)} h</td>
                                                                                                                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 text-sm">{row.attributedRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 text-sm">{row.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 text-sm">
                                                                                                                            {row.hoursDisplay > 0.001 ? `${costPh.toFixed(2)} €/h` : '–'}
                                                                                                                        </td>
                                                                                                                        <td
                                                                                                                            className={cn(
                                                                                                                                'py-2.5 px-3 text-right font-mono tabular-nums text-sm',
                                                                                                                                row.hoursDisplay > 0.001
                                                                                                                                    ? marginPh >= 0
                                                                                                                                        ? 'text-emerald-700'
                                                                                                                                        : 'text-red-600'
                                                                                                                                    : 'text-slate-700'
                                                                                                                            )}
                                                                                                                        >
                                                                                                                            {row.hoursDisplay > 0.001 ? `${marginPh.toFixed(2)} €/h` : '–'}
                                                                                                                        </td>
                                                                                                                        <td className={cn("py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-sm", rowSem.className)}>
                                                                                                                            <span className="inline-flex items-center justify-end gap-1">
                                                                                                                                {rowSem.showAlert && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
                                                                                                                                {row.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                                                                            </span>
                                                                                                                        </td>
                                                                                                                    </tr>
                                                                                                                );
                                                                                                            })}
                                                                                                            {(() => {
                                                                                                                const totMargin = attributionRows.reduce((s, r) => s + r.margin, 0);
                                                                                                                const totRev = attributionRows.reduce((s, r) => s + r.attributedRevenue, 0);
                                                                                                                const totCost = attributionRows.reduce((s, r) => s + r.cost, 0);
                                                                                                                const totH = attributionRows.reduce((s, r) => s + r.hoursDisplay, 0);
                                                                                                                const totMarginPct = totRev > 0 ? (totMargin / totRev) * 100 : (totMargin < 0 ? -1 : 0);
                                                                                                                const totSem = getMarginSemaphore(totMarginPct);
                                                                                                                return (
                                                                                                                    <tr className="border-t-2 border-slate-200 bg-slate-100/90 font-semibold text-slate-800">
                                                                                                                        <td className="py-3 px-4">Total</td>
                                                                                                                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">{totH.toFixed(1)} h</td>
                                                                                                                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">{totRev.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">{totCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">
                                                                                                                            {totH > 0.001 ? `${(totCost / totH).toFixed(2)} €/h` : '–'}
                                                                                                                        </td>
                                                                                                                        <td
                                                                                                                            className={cn(
                                                                                                                                'py-3 px-3 text-right font-mono tabular-nums text-sm',
                                                                                                                                totH > 0.001
                                                                                                                                    ? totMargin / totH >= 0
                                                                                                                                        ? 'text-emerald-700'
                                                                                                                                        : 'text-red-600'
                                                                                                                                    : undefined
                                                                                                                            )}
                                                                                                                        >
                                                                                                                            {totH > 0.001 ? `${(totMargin / totH).toFixed(2)} €/h` : '–'}
                                                                                                                        </td>
                                                                                                                        <td className={cn("py-3 px-4 text-right font-mono tabular-nums text-sm", totSem.className)}>
                                                                                                                            <span className="inline-flex items-center justify-end gap-1">
                                                                                                                                {totSem.showAlert && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
                                                                                                                                {totMargin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                                                                            </span>
                                                                                                                        </td>
                                                                                                                    </tr>
                                                                                                                );
                                                                                                            })()}
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="lg:w-52 shrink-0 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resumen</p>
                                                                                                <dl className="space-y-3 text-sm">
                                                                                                    <div>
                                                                                                        <dt className="text-slate-500 text-xs">Coste total</dt>
                                                                                                        <dd className="font-mono font-semibold text-slate-800">{attributionRows.reduce((s, r) => s + r.cost, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <dt className="text-slate-500 text-xs">Margen total</dt>
                                                                                                        <dd className={cn("font-mono font-semibold", (() => { const totRev = attributionRows.reduce((s, r) => s + r.attributedRevenue, 0); const totMarg = attributionRows.reduce((s, r) => s + r.margin, 0); const pct = totRev > 0 ? (totMarg / totRev) * 100 : (totMarg < 0 ? -1 : 0); return getMarginSemaphore(pct).className; })())}>{attributionRows.reduce((s, r) => s + r.margin, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <dt className="text-slate-500 text-xs">% margen</dt>
                                                                                                        <dd className="font-mono font-semibold text-slate-800">
                                                                                                            {(() => {
                                                                                                                const totRev = attributionRows.reduce((s, r) => s + r.attributedRevenue, 0);
                                                                                                                const totMarg = attributionRows.reduce((s, r) => s + r.margin, 0);
                                                                                                                return totRev > 0 ? `${((totMarg / totRev) * 100).toFixed(1)}%` : '–';
                                                                                                            })()}
                                                                                                        </dd>
                                                                                                    </div>
                                                                                                </dl>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {sortedProjects.length > 10 && (
                                                <div className="flex justify-center pt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() => setShowAllProjects(prev => !prev)}
                                                    >
                                                        {showAllProjects ? 'Ver solo Top 10 peores' : 'Ver todos los proyectos'}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </section>

                        {/* Inversión interna */}
                        {internalWithActivity.length > 0 && (
                            <section aria-label="Inversión interna">
                                <Card className="shadow-sm border border-slate-200 bg-white border-l-4 border-l-slate-400 overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                <FolderKanban className="h-4 w-4" />
                                            </span>
                                            Inversión interna
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500">
                                            Proyectos internos (horas y coste). No forman parte del radar de rentabilidad.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Cliente / Proyecto</th>
                                                        <th className="px-4 py-3 text-right font-medium">{hoursHeaderLabel}</th>
                                                        <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.payrollImputed')}</span>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="text-xs max-w-xs">
                                                                    {t('financialHealth.columns.payrollImputedHelp')}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </th>
                                                        <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.commonOverhead')}</span>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="text-xs max-w-xs">
                                                                    {t('financialHealth.columns.commonOverheadHelp')}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </th>
                                                        <th className="px-4 py-3 text-right font-medium rounded-tr-lg">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.costTotal')}</span>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="text-xs max-w-xs">
                                                                    {t('financialHealth.columns.costTotalHelp')}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {internalWithActivity.map((p, idx) => {
                                                        const clientName = clientById.get(p.clientId) || p.clientName || 'Cliente desconocido';
                                                        const pcm = projectCostAndMarginMap.get(p.projectId) ?? {
                                                            cost: 0,
                                                            payrollCost: 0,
                                                            overheadCost: 0,
                                                            margin: 0,
                                                        };
                                                        return (
                                                            <tr key={p.projectId} className={cn("transition-colors", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}>
                                                                <td className="px-4 py-3">
                                                                    <div className="font-medium text-slate-900">
                                                                        <SensitiveText kind="project" id={p.projectId}>{p.projectName}</SensitiveText>
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500">
                                                                        <SensitiveText kind="account" id={p.clientId ?? 'unknown-client'}>{clientName}</SensitiveText>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{(hoursMode === 'computed' ? p.computed : p.actual).toFixed(1)} h</td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                                    {pcm.payrollCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                                                                    {pcm.overheadCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                                    {pcm.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* Rentabilidad por departamento y por empleado */}
                        <section aria-label="Rentabilidad por área y empleados">
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                                <TrendingUp className="h-4 w-4" />
                                            </span>
                                            Rentabilidad por departamento
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help underline decoration-dotted decoration-slate-400">
                                                        Ingreso, nómina y gastos comunes imputados a proyectos del área (mismo criterio que la tabla de proyectos).
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="text-xs max-w-sm">
                                                    {t('financialHealth.columns.departmentTableHelp')}
                                                </TooltipContent>
                                            </Tooltip>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {departmentProfitability.items.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                                <div className="rounded-full bg-slate-100 p-3 mb-2">
                                                    <LayoutDashboard className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-600">Sin datos por departamento</p>
                                                <p className="text-xs text-slate-500 mt-1">No hay proyectos con departamento responsable este mes.</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm min-w-[640px]">
                                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                                        <tr>
                                                            <th className="px-3 py-2.5 text-left font-medium rounded-tl-lg">Área</th>
                                                            <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">{hoursHeaderLabel}</th>
                                                            <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">Ingr. (€)</th>
                                                            <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">{t('financialHealth.columns.payrollImputed')}</th>
                                                            <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">{t('financialHealth.columns.commonOverhead')}</th>
                                                            <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">Margen (€)</th>
                                                            <th className="px-3 py-2.5 text-right font-medium rounded-tr-lg whitespace-nowrap">EHR</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {departmentProfitability.items.map((dept, idx) => {
                                                            const isBelowTarget = dept.ehr < ehrTarget;
                                                            const marginPctDept = dept.revenue > 0 ? (dept.margin / dept.revenue) * 100 : (dept.margin < 0 ? -1 : 0);
                                                            const semDept = getMarginSemaphore(marginPctDept);
                                                            return (
                                                                <tr key={dept.id} className={cn(idx % 2 === 1 ? "bg-slate-50/50" : "bg-white")}>
                                                                    <td className="px-3 py-2.5 font-medium text-slate-900">{dept.name}</td>
                                                                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">{dept.hours.toFixed(1)} h</td>
                                                                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-800">
                                                                        {dept.revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700">
                                                                        {dept.payrollCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">
                                                                        {dept.overheadCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                    </td>
                                                                    <td className={cn("px-3 py-2.5 text-right font-mono tabular-nums font-semibold", semDept.className)}>
                                                                        {dept.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-right">
                                                                        <span
                                                                            className={cn(
                                                                                "text-xs font-semibold tabular-nums",
                                                                                isBelowTarget ? "text-red-600" : "text-emerald-700"
                                                                            )}
                                                                        >
                                                                            {dept.ehr.toFixed(0)} €/h
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Rentabilidad por empleado (lista completa) */}
                                <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                                <Users className="h-4 w-4" />
                                            </span>
                                            Rentabilidad por empleado
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500">
                                            Horas, ingreso atribuido, coste y margen por empleado. Ordenado por margen. Detalle en pestaña Empleados.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {employeeProfitabilityFilteredBySearch.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                                <div className="rounded-full bg-slate-100 p-3 mb-2">
                                                    <UserCircle className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-600">Sin datos de empleados</p>
                                                <p className="text-xs text-slate-500 mt-1">No hay empleados con actividad este mes o no coinciden con la búsqueda.</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-medium rounded-tl-lg min-w-[120px]">Empleado</th>
                                                            <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[100px]">{hoursHeaderLabel}</th>
                                                            <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[110px]">Ingr. atrib. (€)</th>
                                                            <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[88px]">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.payrollImputed')}</span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="text-xs max-w-xs">
                                                                        {t('financialHealth.columns.payrollImputedHelp')}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[88px]">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.commonOverhead')}</span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="text-xs max-w-xs">
                                                                        {t('financialHealth.columns.commonOverheadHelp')}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[88px]">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.costTotal')}</span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="text-xs max-w-xs">
                                                                        {t('financialHealth.columns.costTotalHelp')}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[70px]">Coste/h</th>
                                                            <th className="px-4 py-3 text-right font-medium rounded-tr-lg whitespace-nowrap min-w-[90px]">Margen (€)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {[...employeeProfitabilityFilteredBySearch]
                                                            .sort((a, b) => {
                                                                const marginA = employeeDisplayTotalsWhenSearch ? (employeeDisplayTotalsWhenSearch.get(a.employeeId)?.margin ?? a.margin) : a.margin;
                                                                const marginB = employeeDisplayTotalsWhenSearch ? (employeeDisplayTotalsWhenSearch.get(b.employeeId)?.margin ?? b.margin) : b.margin;
                                                                return marginB - marginA;
                                                            })
                                                            .map((ep, idx) => {
                                                                const display = employeeDisplayTotalsWhenSearch?.get(ep.employeeId);
                                                                const h = display ? display.hours : (hoursMode === 'computed' ? ep.totalComputed : ep.totalActual);
                                                                const attr = display ? display.attr : ep.attributedRevenue;
                                                                const cost = display ? display.cost : ep.cost;
                                                                const margin = display ? display.margin : ep.margin;
                                                                const payrollShow = display ? display.payroll : ep.payrollAllocatedTotal;
                                                                const overheadShow = display ? display.overhead : ep.overheadCost + ep.overheadNotAttributed;
                                                                const marginPct = attr > 0 ? (margin / attr) * 100 : (margin < 0 ? -1 : 0);
                                                                const semaphore = getMarginSemaphore(marginPct);
                                                                const costPerHour = h > 0 ? cost / h : 0;
                                                                const empResumen = employees.find(e => e.id === ep.employeeId);
                                                                const baseHoursStd = getStandardMonthlyCapacity(empResumen);
                                                                const qEmp = searchQuery.trim().toLowerCase();
                                                                const bpTip =
                                                                    display && qEmp
                                                                        ? ep.byProject.filter(bp =>
                                                                              bp.projectName.toLowerCase().includes(qEmp)
                                                                          )
                                                                        : ep.byProject;
                                                                const payrollPart = bpTip.reduce((s, b) => s + b.payrollCost, 0);
                                                                const overheadPart = bpTip.reduce((s, b) => s + b.overheadCost, 0);
                                                                const hEff = h;
                                                                const pHr = hEff > 0 ? payrollPart / hEff : 0;
                                                                const oHr = hEff > 0 ? overheadPart / hEff : 0;
                                                                const costHelpText =
                                                                    hEff > 0
                                                                        ? overheadPart > 0
                                                                            ? costMode === 'standard'
                                                                                ? t('financialHealth.costHour.tooltipLoadedStd', {
                                                                                      baseH: baseHoursStd.toFixed(0),
                                                                                      p: pHr.toFixed(2),
                                                                                      o: oHr.toFixed(2),
                                                                                      c: costPerHour.toFixed(2),
                                                                                  })
                                                                                : t('financialHealth.costHour.tooltipLoadedDyn', {
                                                                                      baseH: hEff.toFixed(0),
                                                                                      p: pHr.toFixed(2),
                                                                                      o: oHr.toFixed(2),
                                                                                      c: costPerHour.toFixed(2),
                                                                                  })
                                                                            : costMode === 'standard'
                                                                              ? `Base: ${baseHoursStd.toFixed(0)} h (capacidad teórica del mes) · ${costPerHour.toFixed(2)} €/h`
                                                                              : `Base: ${hEff.toFixed(0)} h (reales del mes) · Nómina: ${(empResumen?.monthlyCost ?? empResumen?.hourlyRate ?? 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} → ${costPerHour.toFixed(2)} €/h`
                                                                        : null;
                                                                return (
                                                                    <tr key={ep.employeeId} className={cn("transition-colors", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}>
                                                                        <td className="px-4 py-3 font-medium text-slate-900">{ep.employeeName}</td>
                                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{h.toFixed(1)} h</td>
                                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{attr.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                                            {payrollShow.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                                                                            {overheadShow.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                                                                            {costHelpText ? (
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <span className="cursor-help underline decoration-dotted decoration-slate-300">{h > 0 ? `${costPerHour.toFixed(2)} €/h` : '–'}</span>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent side="left" className="text-xs font-normal">
                                                                                        {costHelpText}
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            ) : (h > 0 ? `${costPerHour.toFixed(2)} €/h` : '–')}
                                                                        </td>
                                                                        <td className={cn("px-4 py-3 text-right font-mono tabular-nums font-semibold", semaphore.className)}>
                                                                            <span className="inline-flex items-center justify-end gap-1">
                                                                                {semaphore.showAlert && <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                                                                                {margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                    </tbody>
                                                    <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                                                        <tr className="text-sm font-semibold text-slate-800">
                                                            <td className="px-4 py-3">Total</td>
                                                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                                {employeeProfitabilityFilteredBySearch.reduce((s, ep) => {
                                                                    const d = employeeDisplayTotalsWhenSearch?.get(ep.employeeId);
                                                                    return s + (d ? d.hours : (hoursMode === 'computed' ? ep.totalComputed : ep.totalActual));
                                                                }, 0).toFixed(1)} h
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                                {(employeeDisplayTotalsWhenSearch
                                                                    ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0)
                                                                    : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0)
                                                                ).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                                {(employeeDisplayTotalsWhenSearch
                                                                    ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.payroll ?? ep.payrollAllocatedTotal), 0)
                                                                    : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.payrollAllocatedTotal, 0)
                                                                ).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                                {(employeeDisplayTotalsWhenSearch
                                                                    ? employeeProfitabilityFilteredBySearch.reduce(
                                                                          (s, ep) =>
                                                                              s +
                                                                              (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.overhead ??
                                                                                  ep.overheadCost + ep.overheadNotAttributed),
                                                                          0
                                                                      )
                                                                    : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.overheadCost + ep.overheadNotAttributed, 0)
                                                                ).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                                {(employeeDisplayTotalsWhenSearch
                                                                    ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.cost ?? ep.cost), 0)
                                                                    : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.cost, 0)
                                                                ).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                                {(() => {
                                                                    const totalH = employeeProfitabilityFilteredBySearch.reduce((s, ep) => {
                                                                        const d = employeeDisplayTotalsWhenSearch?.get(ep.employeeId);
                                                                        return s + (d ? d.hours : (hoursMode === 'computed' ? ep.totalComputed : ep.totalActual));
                                                                    }, 0);
                                                                    const totalCost = employeeDisplayTotalsWhenSearch
                                                                        ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.cost ?? ep.cost), 0)
                                                                        : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.cost, 0);
                                                                    return totalH > 0 ? `${(totalCost / totalH).toFixed(2)} €/h` : '–';
                                                                })()}
                                                            </td>
                                                            <td className={cn("px-4 py-3 text-right font-mono tabular-nums", (() => {
                                                                const totalAttr = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                                const totalMargin = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                                return getMarginSemaphore(totalAttr > 0 ? (totalMargin / totalAttr) * 100 : (totalMargin < 0 ? -1 : 0)).className;
                                                            })())}>
                                                                <span className="inline-flex items-center justify-end gap-1">
                                                                    {(() => {
                                                                        const totalAttr = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                                        const totalMargin = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                                        const sem = getMarginSemaphore(totalAttr > 0 ? (totalMargin / totalAttr) * 100 : (totalMargin < 0 ? -1 : 0));
                                                                        return sem.showAlert && <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
                                                                    })()}
                                                                    {(employeeDisplayTotalsWhenSearch
                                                                        ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0)
                                                                        : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0)
                                                                    ).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </section>
                    </TabsContent>

                    <TabsContent value="proyectos" className="space-y-6 mt-0">
                        <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                        <FolderKanban className="h-4 w-4" />
                                    </span>
                                    Tabla de proyectos (facturables)
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Proyectos con fee y actividad este mes. Coste interno y margen en euros.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {projectMetricsBillableWithActivity.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <div className="rounded-full bg-slate-100 p-4 mb-3">
                                            <FolderKanban className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">Sin proyectos facturables</p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm">No hay proyectos con fee y actividad este mes, o no coinciden con los filtros.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Cliente / Proyecto</th>
                                                    <th className="px-4 py-3 text-right font-medium">
                                                        <span className="inline-flex items-center gap-1">
                                                            {isViewingCurrentMonth ? 'Ingreso devengado (€)' : 'Fee (€)'}
                                                            {isViewingCurrentMonth && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="cursor-help text-slate-400 hover:text-slate-600 inline-flex" aria-label="Info ingreso devengado">
                                                                            <Info className="h-3.5 w-3.5" />
                                                                        </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="text-xs">
                                                                        En mes en curso se muestra el ingreso devengado (prorrateo por días). Si el proyecto ya ha cumplido o superado el 100 % de las horas del presupuesto, se muestra el fee total.
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </span>
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium">{hoursHeaderLabel} / Budget</th>
                                                    <th className="px-4 py-3 text-right font-medium">EHR</th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.payrollImputed')}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                {t('financialHealth.columns.payrollImputedHelp')}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.commonOverhead')}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                {t('financialHealth.columns.commonOverheadHelp')}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-help underline decoration-dotted">Ritmo</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-xs">
                                                                % de presupuesto consumido frente a % de mes transcurrido. Rojo: ritmo por encima de lo previsto. Verde: ritmo adecuado.
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium">Margen (€)</th>
                                                    <th className="px-4 py-3 text-right font-medium rounded-tr-lg">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {[...enrichedProjects].sort((a, b) => a.ehr - b.ehr).map(({ metric: p, clientName, ehr, ehrLabel }, idx) => {
                                                    const cm = projectCostAndMarginMap.get(p.projectId) ?? { cost: 0, payrollCost: 0, overheadCost: 0, margin: 0 };
                                                    const displayFeeProj = projectDisplayFeeMap.get(p.projectId) ?? p.monthlyFee ?? 0;
                                                    const displayMarginProj = displayFeeProj - cm.cost;
                                                    const marginPctProj = displayFeeProj > 0 ? (displayMarginProj / displayFeeProj) * 100 : 0;
                                                    const semaphoreProj = getMarginSemaphore(marginPctProj);
                                                    const isExpanded = expandedProjects.has(p.projectId);
                                                    const client = clients.find(c => c.id === p.clientId);
                                                    const clientInitialsRaw = (clientName || '?').split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
                                                    const clientInitials = privacyDemoActive
                                                        ? privacyAnonymizer.account(p.clientId ?? 'unknown-client').slice(0, 2).toUpperCase()
                                                        : clientInitialsRaw;
                                                    const attributionRows = projectEmployeeAttributionMap.get(p.projectId) || [];
                                                    return (
                                                        <Fragment key={p.projectId}>
                                                            <tr
                                                                role="button"
                                                                tabIndex={0}
                                                                className={cn("align-top transition-colors cursor-pointer", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}
                                                                onClick={() => toggleProject(p.projectId)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleProject(p.projectId); } }}
                                                            >
                                                                <td className="px-4 py-3 align-top min-w-[12rem] sm:min-w-[20rem] lg:min-w-[24rem]">
                                                                    <div className="flex items-start gap-3">
                                                                        <Avatar className="h-8 w-8 border shrink-0 mt-0.5">
                                                                            <AvatarFallback className="bg-slate-900 text-white text-xs font-bold" style={client?.color ? { backgroundColor: client.color, color: 'white' } : undefined}>{clientInitials}</AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="font-semibold text-slate-900 break-words whitespace-normal leading-snug">
                                                                                <SensitiveText kind="project" id={p.projectId}>{p.projectName}</SensitiveText>
                                                                            </div>
                                                                            <div className="text-[11px] text-slate-500 break-words whitespace-normal leading-snug mt-0.5">
                                                                                <SensitiveText kind="account" id={p.clientId ?? 'unknown-client'}>{clientName}</SensitiveText>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                                    {(projectDisplayFeeMap.get(p.projectId) ?? p.monthlyFee).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                    {isViewingCurrentMonth && (p.monthlyFee ?? 0) > 0 && (
                                                                        <span className="block text-[10px] text-slate-400 font-normal">/ {p.monthlyFee.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} total</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-slate-600">{(hoursMode === 'computed' ? p.computed : p.actual).toFixed(1)}h / {p.budget.toFixed(1)}h</td>
                                                                <td className="px-4 py-3 text-right"><Badge variant="outline" className="text-[11px] font-semibold tabular-nums">{ehrLabel}</Badge></td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700" onClick={(e) => e.stopPropagation()}>
                                                                    {cm.payrollCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600" onClick={(e) => e.stopPropagation()}>
                                                                    {cm.overheadCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    {(() => {
                                                                        const pacing = projectPacingMap.get(p.projectId);
                                                                        if (!pacing || p.budget <= 0) return <span className="text-slate-400 text-[11px]">–</span>;
                                                                        return (
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <div className="flex items-center gap-1.5 justify-end">
                                                                                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                            <div className={cn("h-full rounded-full", pacing.isOverPacing ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, pacing.pctConsumed)}%` }} />
                                                                                        </div>
                                                                                        {pacing.isOverPacing ? <Flame className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden />}
                                                                                    </div>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent side="top" className="text-xs">
                                                                                    {pacing.isOverPacing ? `Consumido ${pacing.pctConsumed.toFixed(0)}% del presupuesto con ${pacing.pctElapsed.toFixed(0)}% del mes transcurrido. Ritmo por encima de lo previsto.` : `Consumido ${pacing.pctConsumed.toFixed(0)}% del presupuesto con ${pacing.pctElapsed.toFixed(0)}% del mes transcurrido. Ritmo adecuado.`}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                <td className={cn("px-4 py-3 text-right font-mono tabular-nums font-semibold", semaphoreProj.className)}>
                                                                    <span className="inline-flex items-center justify-end gap-1">
                                                                        {semaphoreProj.showAlert && <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                                                                        {displayMarginProj.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                                    <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-slate-600 hover:text-slate-900" onClick={(e) => { e.stopPropagation(); toggleProject(p.projectId); }}>
                                                                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                                        Desglose
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                            {isExpanded && attributionRows.length > 0 && (
                                                                <tr>
                                                                    <td colSpan={9} className="p-0 align-top bg-slate-50/50">
                                                                        <div className="px-4 py-4">
                                                                            <div className="flex flex-col lg:flex-row gap-4">
                                                                                <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                                                                    <div className="overflow-x-auto">
                                                                                        <table className="w-full text-sm min-w-[320px]">
                                                                                            <colgroup>
                                                                                                <col className="min-w-[112px] w-[32%]" />
                                                                                                <col className="min-w-[64px] w-[10%]" />
                                                                                                <col className="min-w-[88px] w-[14%]" />
                                                                                                <col className="min-w-[80px] w-[13%]" />
                                                                                                <col className="min-w-[72px] w-[11%]" />
                                                                                                <col className="min-w-[72px] w-[11%]" />
                                                                                                <col className="min-w-[80px] w-[9%]" />
                                                                                            </colgroup>
                                                                                            <thead>
                                                                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Empleado</th>
                                                                                                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Horas</th>
                                                                                                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Ingreso atrib. (€)</th>
                                                                                                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Coste (€)</th>
                                                                                                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                                                                                                        <Tooltip>
                                                                                                            <TooltipTrigger asChild>
                                                                                                                <span className="cursor-help underline decoration-dotted">{t('financialHealth.employee.projectExpandCostPerHour')}</span>
                                                                                                            </TooltipTrigger>
                                                                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                                                                {t('financialHealth.employee.projectExpandCostPerHourTooltip')}
                                                                                                            </TooltipContent>
                                                                                                        </Tooltip>
                                                                                                    </th>
                                                                                                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                                                                                                        <Tooltip>
                                                                                                            <TooltipTrigger asChild>
                                                                                                                <span className="cursor-help underline decoration-dotted">{t('financialHealth.employee.expandMarginPerHour')}</span>
                                                                                                            </TooltipTrigger>
                                                                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                                                                {t('financialHealth.employee.expandMarginPerHourTooltip')}
                                                                                                            </TooltipContent>
                                                                                                        </Tooltip>
                                                                                                    </th>
                                                                                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Margen (€)</th>
                                                                                                </tr>
                                                                                                <tr className="bg-slate-50/80">
                                                                                                    <th className="text-left py-0.5 px-4 text-[11px] font-normal text-slate-400" colSpan={7}>{hoursMode === 'computed' ? 'Horas computadas' : 'Horas reales'}</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody className="divide-y divide-slate-100">
                                                                                                {attributionRows.map((row, i) => {
                                                                                                    const emp = employees.find(e => e.id === row.employeeId);
                                                                                                    const rowMarginPct = row.attributedRevenue > 0 ? (row.margin / row.attributedRevenue) * 100 : (row.margin < 0 ? -1 : 0);
                                                                                                    const rowSem = getMarginSemaphore(rowMarginPct);
                                                                                                    const costPh = row.hoursDisplay > 0.001 ? row.cost / row.hoursDisplay : 0;
                                                                                                    const marginPh = row.hoursDisplay > 0.001 ? row.margin / row.hoursDisplay : 0;
                                                                                                    return (
                                                                                                        <tr key={row.employeeId} className={cn("transition-colors hover:bg-slate-50/50", i % 2 === 1 && "bg-slate-50/30")}>
                                                                                                            <td className="py-2.5 px-4 font-medium text-slate-900" title={emp?.name || 'Empleado'}>{emp?.name || 'Empleado'}</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 text-sm">{row.hoursDisplay.toFixed(1)} h</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 text-sm">{row.attributedRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 text-sm">{row.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 text-sm">
                                                                                                                {row.hoursDisplay > 0.001 ? `${costPh.toFixed(2)} €/h` : '–'}
                                                                                                            </td>
                                                                                                            <td
                                                                                                                className={cn(
                                                                                                                    'py-2.5 px-3 text-right font-mono tabular-nums text-sm',
                                                                                                                    row.hoursDisplay > 0.001
                                                                                                                        ? marginPh >= 0
                                                                                                                            ? 'text-emerald-700'
                                                                                                                            : 'text-red-600'
                                                                                                                        : 'text-slate-700'
                                                                                                                )}
                                                                                                            >
                                                                                                                {row.hoursDisplay > 0.001 ? `${marginPh.toFixed(2)} €/h` : '–'}
                                                                                                            </td>
                                                                                                            <td className={cn("py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-sm", rowSem.className)}>
                                                                                                                <span className="inline-flex items-center justify-end gap-1">
                                                                                                                    {rowSem.showAlert && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
                                                                                                                    {row.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                                                                </span>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    );
                                                                                                })}
                                                                                                {(() => {
                                                                                                    const totMargin = attributionRows.reduce((s, r) => s + r.margin, 0);
                                                                                                    const totRev = attributionRows.reduce((s, r) => s + r.attributedRevenue, 0);
                                                                                                    const totCost = attributionRows.reduce((s, r) => s + r.cost, 0);
                                                                                                    const totH = attributionRows.reduce((s, r) => s + r.hoursDisplay, 0);
                                                                                                    const totMarginPct = totRev > 0 ? (totMargin / totRev) * 100 : (totMargin < 0 ? -1 : 0);
                                                                                                    const totSem = getMarginSemaphore(totMarginPct);
                                                                                                    return (
                                                                                                        <tr className="border-t-2 border-slate-200 bg-slate-100/90 font-semibold text-slate-800">
                                                                                                            <td className="py-3 px-4">Total</td>
                                                                                                            <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">{totH.toFixed(1)} h</td>
                                                                                                            <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">{totRev.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                            <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">{totCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                            <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">
                                                                                                                {totH > 0.001 ? `${(totCost / totH).toFixed(2)} €/h` : '–'}
                                                                                                            </td>
                                                                                                            <td
                                                                                                                className={cn(
                                                                                                                    'py-3 px-3 text-right font-mono tabular-nums text-sm',
                                                                                                                    totH > 0.001
                                                                                                                        ? totMargin / totH >= 0
                                                                                                                            ? 'text-emerald-700'
                                                                                                                            : 'text-red-600'
                                                                                                                        : undefined
                                                                                                                )}
                                                                                                            >
                                                                                                                {totH > 0.001 ? `${(totMargin / totH).toFixed(2)} €/h` : '–'}
                                                                                                            </td>
                                                                                                            <td className={cn("py-3 px-4 text-right font-mono tabular-nums text-sm", totSem.className)}>
                                                                                                                <span className="inline-flex items-center justify-end gap-1">
                                                                                                                    {totSem.showAlert && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
                                                                                                                    {totMargin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                                                                </span>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    );
                                                                                                })()}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="lg:w-52 shrink-0 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resumen</p>
                                                                                    <dl className="space-y-3 text-sm">
                                                                                        <div>
                                                                                            <dt className="text-slate-500 text-xs">Coste total</dt>
                                                                                            <dd className="font-mono font-semibold text-slate-800">{attributionRows.reduce((s, r) => s + r.cost, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                        </div>
                                                                                        <div>
                                                                                            <dt className="text-slate-500 text-xs">Margen total</dt>
                                                                                            <dd className={cn("font-mono font-semibold", (() => { const totRev = attributionRows.reduce((s, r) => s + r.attributedRevenue, 0); const totMarg = attributionRows.reduce((s, r) => s + r.margin, 0); const pct = totRev > 0 ? (totMarg / totRev) * 100 : (totMarg < 0 ? -1 : 0); return getMarginSemaphore(pct).className; })())}>{attributionRows.reduce((s, r) => s + r.margin, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                        </div>
                                                                                        <div>
                                                                                            <dt className="text-slate-500 text-xs">% margen</dt>
                                                                                            <dd className="font-mono font-semibold text-slate-800">
                                                                                                {(() => {
                                                                                                    const totRev = attributionRows.reduce((s, r) => s + r.attributedRevenue, 0);
                                                                                                    const totMarg = attributionRows.reduce((s, r) => s + r.margin, 0);
                                                                                                    return totRev > 0 ? `${((totMarg / totRev) * 100).toFixed(1)}%` : '–';
                                                                                                })()}
                                                                                            </dd>
                                                                                        </div>
                                                                                    </dl>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </Fragment>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                                                <tr className="text-sm font-semibold text-slate-800">
                                                    <td className="px-4 py-3">Total</td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                        {employeeProfitabilityFilteredBySearch.reduce((s, ep) => {
                                                            const d = employeeDisplayTotalsWhenSearch?.get(ep.employeeId);
                                                            return s + (d ? d.hours : (hoursMode === 'computed' ? ep.totalComputed : ep.totalActual));
                                                        }, 0).toFixed(1)} h
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                        {(employeeDisplayTotalsWhenSearch
                                                            ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0)
                                                            : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0)
                                                        ).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                        {(employeeDisplayTotalsWhenSearch
                                                            ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.cost ?? ep.cost), 0)
                                                            : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.cost, 0)
                                                        ).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                        {(() => {
                                                            const totalH = employeeProfitabilityFilteredBySearch.reduce((s, ep) => {
                                                                const d = employeeDisplayTotalsWhenSearch?.get(ep.employeeId);
                                                                return s + (d ? d.hours : (hoursMode === 'computed' ? ep.totalComputed : ep.totalActual));
                                                            }, 0);
                                                            const totalCost = employeeDisplayTotalsWhenSearch
                                                                ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.cost ?? ep.cost), 0)
                                                                : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.cost, 0);
                                                            return totalH > 0 ? `${(totalCost / totalH).toFixed(2)} €/h` : '–';
                                                        })()}
                                                    </td>
                                                    <td className={cn("px-4 py-3 text-right font-mono tabular-nums", (() => {
                                                        const ta = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                        const tm = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                        return getMarginSemaphore(ta > 0 ? (tm / ta) * 100 : (tm < 0 ? -1 : 0)).className;
                                                    })())}>
                                                        <span className="inline-flex items-center justify-end gap-1">
                                                            {(() => {
                                                                const ta = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                                const tm = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                                const sem = getMarginSemaphore(ta > 0 ? (tm / ta) * 100 : (tm < 0 ? -1 : 0));
                                                                return sem.showAlert && <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
                                                            })()}
                                                            {(employeeDisplayTotalsWhenSearch
                                                                ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0)
                                                                : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0)
                                                            ).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                        </span>
                                                    </td>
                                                    <td className={cn("px-4 py-3 text-right font-mono tabular-nums", (() => {
                                                        const ta = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                        const tm = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                        return getMarginSemaphore(ta > 0 ? (tm / ta) * 100 : (tm < 0 ? -1 : 0)).className;
                                                    })())}>
                                                        {(() => {
                                                            const ta = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                            const tm = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                            return ta > 0 ? `${((tm / ta) * 100).toFixed(1)}%` : '–';
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3" />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Proyectos internos (fee 0) en esta pestaña para que la búsqueda los muestre */}
                        {internalWithActivity.length > 0 && (
                            <Card className="shadow-sm border border-slate-200 bg-white border-l-4 border-l-slate-400 overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                            <FolderKanban className="h-4 w-4" />
                                        </span>
                                        Proyectos internos (sin fee)
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500">
                                        Proyectos con fee 0 € y actividad este mes. Rentabilidad negativa (solo coste). Respetan la búsqueda.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Cliente / Proyecto</th>
                                                    <th className="px-4 py-3 text-right font-medium">{hoursHeaderLabel}</th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.payrollImputed')}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                {t('financialHealth.columns.payrollImputedHelp')}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.commonOverhead')}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                {t('financialHealth.columns.commonOverheadHelp')}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium rounded-tr-lg">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-help underline decoration-dotted">{t('financialHealth.columns.costTotal')}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                {t('financialHealth.columns.costTotalHelp')}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {internalWithActivity.map((p, idx) => {
                                                    const clientName = clientById.get(p.clientId) || p.clientName || 'Cliente desconocido';
                                                    const pcm = projectCostAndMarginMap.get(p.projectId) ?? {
                                                        cost: 0,
                                                        payrollCost: 0,
                                                        overheadCost: 0,
                                                        margin: 0,
                                                    };
                                                    return (
                                                        <tr key={p.projectId} className={cn("transition-colors", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}>
                                                            <td className="px-4 py-3">
                                                                <div className="font-medium text-slate-900">
                                                                    <SensitiveText kind="project" id={p.projectId}>{p.projectName}</SensitiveText>
                                                                </div>
                                                                <div className="text-[11px] text-slate-500">
                                                                    <SensitiveText kind="account" id={p.clientId ?? 'unknown-client'}>{clientName}</SensitiveText>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{(hoursMode === 'computed' ? p.computed : p.actual).toFixed(1)} h</td>
                                                            <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                                {pcm.payrollCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                                                                {pcm.overheadCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                                {pcm.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="empleados" className="space-y-6 mt-0">
                        <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                        <UserCircle className="h-4 w-4" />
                                    </span>
                                    Rentabilidad por empleado
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Horas, ingreso atribuido, coste y margen. Expande para ver desglose por proyecto.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {employeeProfitabilityFilteredBySearch.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <div className="rounded-full bg-slate-100 p-4 mb-3">
                                            <UserCircle className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">Sin datos de empleados</p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm">No hay empleados con actividad este mes o no coinciden con la búsqueda.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium rounded-tl-lg min-w-[120px]">Empleado</th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[100px]">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-help underline decoration-dotted">Nómina</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                Nómina mensual configurada en la ficha del empleado. No depende de las horas registradas.
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[100px]">{hoursHeaderLabel}</th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[110px]">Ingr. atrib. (€)</th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[80px]">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-help underline decoration-dotted">{costHeaderLabel}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                {costHeaderTooltip}
                                                                <br />
                                                                <span className="text-slate-300">Compuesto por nómina imputada + gastos comunes. Pasa el ratón por la cifra para ver el desglose.</span>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[70px]">Coste/h</th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[90px]">Margen (€)</th>
                                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[70px]">% margen</th>
                                                    <th className="px-4 py-3 text-right font-medium rounded-tr-lg">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {[...employeeProfitabilityFilteredBySearch].sort((a, b) => {
                                                    const marginA = employeeDisplayTotalsWhenSearch ? (employeeDisplayTotalsWhenSearch.get(a.employeeId)?.margin ?? a.margin) : a.margin;
                                                    const marginB = employeeDisplayTotalsWhenSearch ? (employeeDisplayTotalsWhenSearch.get(b.employeeId)?.margin ?? b.margin) : b.margin;
                                                    return marginB - marginA;
                                                }).map((ep, idx) => {
                                                    const isExpanded = expandedProjects.has(`emp-${ep.employeeId}`);
                                                    const display = employeeDisplayTotalsWhenSearch?.get(ep.employeeId);
                                                    const displayHours = display ? display.hours : (hoursMode === 'computed' ? ep.totalComputed : ep.totalActual);
                                                    const displayAttr = display ? display.attr : ep.attributedRevenue;
                                                    const displayCost = display ? display.cost : ep.cost;
                                                    const displayMargin = display ? display.margin : ep.margin;
                                                    const displayMarginPct = displayAttr > 0 ? (displayMargin / displayAttr) * 100 : (displayMargin < 0 ? -1 : (display ? 0 : ep.marginPercent));
                                                    const semaphoreEmp = getMarginSemaphore(displayMarginPct);
                                                    const costPerHour = displayHours > 0 ? displayCost / displayHours : 0;
                                                    const empTab = employees.find(e => e.id === ep.employeeId);
                                                    const baseHoursStdTab = getStandardMonthlyCapacity(empTab);
                                                    const qTab = searchQuery.trim().toLowerCase();
                                                    const bpTipTab =
                                                        display && qTab
                                                            ? ep.byProject.filter(bp =>
                                                                  bp.projectName.toLowerCase().includes(qTab)
                                                              )
                                                            : ep.byProject;
                                                    const payrollPartTab = qTab
                                                        ? bpTipTab.reduce((s, b) => s + b.payrollCost, 0)
                                                        : ep.payrollAllocatedTotal;
                                                    const overheadPartTab = qTab
                                                        ? bpTipTab.reduce((s, b) => s + b.overheadCost, 0)
                                                        : Math.max(0, ep.cost - ep.payrollAllocatedTotal);
                                                    const hEffTab = displayHours;
                                                    const pHrTab = hEffTab > 0 ? payrollPartTab / hEffTab : 0;
                                                    const oHrTab = hEffTab > 0 ? overheadPartTab / hEffTab : 0;
                                                    const costHelpTextTab =
                                                        hEffTab > 0
                                                            ? overheadPartTab > 0
                                                                ? costMode === 'standard'
                                                                    ? t('financialHealth.costHour.tooltipLoadedStd', {
                                                                          baseH: baseHoursStdTab.toFixed(0),
                                                                          p: pHrTab.toFixed(2),
                                                                          o: oHrTab.toFixed(2),
                                                                          c: costPerHour.toFixed(2),
                                                                      })
                                                                    : t('financialHealth.costHour.tooltipLoadedDyn', {
                                                                          baseH: hEffTab.toFixed(0),
                                                                          p: pHrTab.toFixed(2),
                                                                          o: oHrTab.toFixed(2),
                                                                          c: costPerHour.toFixed(2),
                                                                      })
                                                                : costMode === 'standard'
                                                                  ? `Base: ${baseHoursStdTab.toFixed(0)} h (capacidad teórica del mes) · ${costPerHour.toFixed(2)} €/h`
                                                                  : `Base: ${hEffTab.toFixed(0)} h (reales del mes) · Nómina: ${(empTab?.monthlyCost ?? empTab?.hourlyRate ?? 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} → ${costPerHour.toFixed(2)} €/h`
                                                            : null;
                                                    return (
                                                        <Fragment key={ep.employeeId}>
                                                            <tr
                                                                role="button"
                                                                tabIndex={0}
                                                                className={cn("align-top transition-colors cursor-pointer", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}
                                                                onClick={() => toggleProject(`emp-${ep.employeeId}`)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleProject(`emp-${ep.employeeId}`); } }}
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="h-8 w-8 border shrink-0">
                                                                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">{ep.employeeName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="font-medium text-slate-900">{ep.employeeName}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                                    {ep.payrollMonthly.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600" onClick={(e) => e.stopPropagation()}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span className="cursor-help underline decoration-dotted decoration-slate-300">{displayHours.toFixed(1)} h</span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top" className="text-xs max-w-xs">
                                                                            {ep.totalHoursGlobal > 0
                                                                                ? `${displayHours.toFixed(1)} h imputadas de ${ep.totalHoursGlobal.toFixed(1)} h totales del mes (${((displayHours / ep.totalHoursGlobal) * 100).toFixed(0)}%).`
                                                                                : `${displayHours.toFixed(1)} h.`}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{displayAttr.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700" onClick={(e) => e.stopPropagation()}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span className="cursor-help underline decoration-dotted decoration-slate-300">{displayCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="left" className="text-xs">
                                                                            <div className="space-y-0.5">
                                                                                <div>Nómina imputada: <span className="font-mono">{(display ? (ep.payrollAllocatedTotal * (displayCost / (ep.cost || 1))) : ep.payrollAllocatedTotal).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span></div>
                                                                                <div>Gastos comunes: <span className="font-mono">{(display ? (displayCost - ep.payrollAllocatedTotal * (displayCost / (ep.cost || 1))) : ep.cost - ep.payrollAllocatedTotal).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span></div>
                                                                                <div className="pt-0.5 border-t border-slate-200/40">Total: <span className="font-mono font-semibold">{displayCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span></div>
                                                                                {ep.hoursNotAttributed > 0.001 && (
                                                                                    <div className="pt-1 text-slate-300">
                                                                                        {ep.hoursNotAttributed.toFixed(1)} h no imputadas · {ep.costNotAttributed.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600" onClick={(e) => e.stopPropagation()}>
                                                                    {costHelpTextTab ? (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <span className="cursor-help underline decoration-dotted decoration-slate-300">{displayHours > 0 ? `${costPerHour.toFixed(2)} €/h` : '–'}</span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="left" className="text-xs font-normal">
                                                                                {costHelpTextTab}
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    ) : (displayHours > 0 ? `${costPerHour.toFixed(2)} €/h` : '–')}
                                                                </td>
                                                                <td className={cn("px-4 py-3 text-right font-mono tabular-nums font-semibold", semaphoreEmp.className)}>
                                                                    <span className="inline-flex items-center justify-end gap-1">
                                                                        {semaphoreEmp.showAlert && <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                                                                        {displayMargin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                    </span>
                                                                </td>
                                                                <td className={cn("px-4 py-3 text-right font-mono tabular-nums", semaphoreEmp.className)}>{displayAttr > 0 ? `${displayMarginPct.toFixed(1)}%` : '–'}</td>
                                                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                                    <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-slate-600 hover:text-slate-900" onClick={(e) => { e.stopPropagation(); toggleProject(`emp-${ep.employeeId}`); }}>
                                                                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                                        Desglose
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                            {(() => {
                                                                const q = searchQuery.trim().toLowerCase();
                                                                const byProjectFiltered = q ? ep.byProject.filter(bp => bp.projectName.toLowerCase().includes(q)) : ep.byProject;
                                                                const showExpand = isExpanded && byProjectFiltered.length > 0;
                                                                const sumHours = byProjectFiltered.reduce((s, b) => s + b.hoursDisplay, 0);
                                                                const sumAttr = byProjectFiltered.reduce((s, b) => s + b.attributedRevenue, 0);
                                                                const sumPayroll = byProjectFiltered.reduce((s, b) => s + b.payrollCost, 0);
                                                                const sumOverhead = byProjectFiltered.reduce((s, b) => s + b.overheadCost, 0);
                                                                const sumCost = byProjectFiltered.reduce((s, b) => s + b.cost, 0);
                                                                const sumMargin = byProjectFiltered.reduce((s, b) => s + b.margin, 0);
                                                                const marginPct = sumAttr > 0 ? ((sumMargin / sumAttr) * 100) : (sumMargin < 0 ? -1 : (ep.attributedRevenue > 0 ? ep.marginPercent : 0));
                                                                const hoursNotAttributed = q ? 0 : ep.hoursNotAttributed;
                                                                const payrollNotAttributed = q ? 0 : ep.payrollNotAttributed;
                                                                const overheadNotAttributed = q ? 0 : ep.overheadNotAttributed;
                                                                const costNotAttributed = q ? 0 : ep.costNotAttributed;
                                                                const showNotAttributedRow = !q && hoursNotAttributed > 0.001;
                                                                const payrollStandardIdleRow = q ? 0 : ep.payrollStandardIdle;
                                                                const showStandardIdleRow = !q && payrollStandardIdleRow > 0.005;
                                                                const totalHoursRow = sumHours + (showNotAttributedRow ? hoursNotAttributed : 0);
                                                                const totalPayrollRow =
                                                                    sumPayroll +
                                                                    (showNotAttributedRow ? payrollNotAttributed : 0) +
                                                                    (showStandardIdleRow ? payrollStandardIdleRow : 0);
                                                                const totalOverheadRow = sumOverhead + (showNotAttributedRow ? overheadNotAttributed : 0);
                                                                const totalCostRow =
                                                                    sumCost +
                                                                    (showNotAttributedRow ? costNotAttributed : 0) +
                                                                    (showStandardIdleRow ? payrollStandardIdleRow : 0);
                                                                const dynamicMode = effectiveCostMode === 'dynamic';
                                                                return showExpand && (
                                                                    <tr>
                                                                        <td colSpan={9} className="p-0 align-top bg-slate-50/50">
                                                                            <div className="px-4 py-4">
                                                                                <div className="flex flex-col lg:flex-row gap-4">
                                                                                    <div className="shrink-0 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Desglose del empleado</div>
                                                                                        <dl className="space-y-2.5 text-sm">
                                                                                            <div>
                                                                                                <dt className="text-slate-500 text-xs">Nómina del mes</dt>
                                                                                                <dd className="font-mono font-semibold text-slate-800">{ep.payrollMonthly.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                            </div>
                                                                                            <div>
                                                                                                <dt className="text-slate-500 text-xs">Horas del mes ({hoursMode === 'computed' ? 'computadas' : 'reales'})</dt>
                                                                                                <dd className="font-mono font-semibold text-slate-800">{(q ? sumHours : ep.totalHoursGlobal).toFixed(1)} h</dd>
                                                                                            </div>
                                                                                            <div className="border-t border-slate-100 pt-2">
                                                                                                <dt className="text-slate-500 text-xs">Ingreso atribuido</dt>
                                                                                                <dd className="font-mono font-semibold text-slate-800">{(q ? sumAttr : ep.attributedRevenue).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                            </div>
                                                                                            <div>
                                                                                                <dt className="text-slate-500 text-xs flex items-center gap-1">
                                                                                                    <Tooltip>
                                                                                                        <TooltipTrigger asChild>
                                                                                                            <span className="cursor-help underline decoration-dotted">Nómina en coste</span>
                                                                                                        </TooltipTrigger>
                                                                                                        <TooltipContent side="top" className="text-xs max-w-xs">
                                                                                                            {t('financialHealth.employee.payrollInCostTooltip')}
                                                                                                        </TooltipContent>
                                                                                                    </Tooltip>
                                                                                                </dt>
                                                                                                <dd className="font-mono font-semibold text-slate-800">{(q ? sumPayroll : ep.payrollAllocatedTotal).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                            </div>
                                                                                            {!q && ep.payrollStandardIdle > 0.005 && effectiveCostMode === 'standard' && (
                                                                                                <div>
                                                                                                    <dt className="text-slate-500 text-xs flex items-center gap-1">
                                                                                                        <Tooltip>
                                                                                                            <TooltipTrigger asChild>
                                                                                                                <span className="cursor-help underline decoration-dotted">{t('financialHealth.employee.standardIdleLabel')}</span>
                                                                                                            </TooltipTrigger>
                                                                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                                                                {t('financialHealth.employee.standardIdleTooltip')}
                                                                                                            </TooltipContent>
                                                                                                        </Tooltip>
                                                                                                    </dt>
                                                                                                    <dd className="font-mono font-semibold text-slate-600">
                                                                                                        {ep.payrollStandardIdle.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                                                    </dd>
                                                                                                </div>
                                                                                            )}
                                                                                            <div>
                                                                                                <dt className="text-slate-500 text-xs">Gastos comunes</dt>
                                                                                                <dd className="font-mono font-semibold text-slate-800">{(q ? sumOverhead : ep.overheadCost).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                            </div>
                                                                                            {!q && ep.hoursNotAttributed > 0.001 && (
                                                                                                <div>
                                                                                                    <dt className="text-slate-500 text-xs flex items-center gap-1">
                                                                                                        <Tooltip>
                                                                                                            <TooltipTrigger asChild>
                                                                                                                <span className="cursor-help underline decoration-dotted">No imputado</span>
                                                                                                            </TooltipTrigger>
                                                                                                            <TooltipContent side="top" className="text-xs max-w-xs">
                                                                                                                {dynamicMode
                                                                                                                    ? `${ep.hoursNotAttributed.toFixed(1)} h en tareas internas o proyectos fuera de la vista. Suma al coste para cuadrar con la nómina.`
                                                                                                                    : `${ep.hoursNotAttributed.toFixed(1)} h en tareas internas o fuera de vista. En modo Operativo el coste se calcula sobre capacidad teórica, por lo que la suma puede no cuadrar exactamente con la nómina.`}
                                                                                                            </TooltipContent>
                                                                                                        </Tooltip>
                                                                                                    </dt>
                                                                                                    <dd className="font-mono font-semibold text-slate-600">
                                                                                                        {ep.costNotAttributed.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                                                        <span className="block text-[11px] text-slate-400 font-normal">{ep.hoursNotAttributed.toFixed(1)} h</span>
                                                                                                    </dd>
                                                                                                </div>
                                                                                            )}
                                                                                            <div className="border-t border-slate-100 pt-2">
                                                                                                <dt className="text-slate-500 text-xs">Margen (€)</dt>
                                                                                                <dd className={cn("font-mono font-semibold", getMarginSemaphore(marginPct).className)}>{(q ? sumMargin : ep.margin).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                            </div>
                                                                                            <div>
                                                                                                <dt className="text-slate-500 text-xs">% margen</dt>
                                                                                                <dd className={cn("font-mono font-semibold", getMarginSemaphore(marginPct).className)}>{(q ? sumAttr > 0 : ep.attributedRevenue > 0) ? `${marginPct.toFixed(1)}%` : '–'}</dd>
                                                                                            </div>
                                                                                        </dl>
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                                                                        <div className="overflow-x-auto">
                                                                                            <table className="w-full text-sm min-w-[520px]">
                                                                                                <colgroup>
                                                                                                    <col className="min-w-[112px] w-[24%]" />
                                                                                                    <col className="min-w-[52px] w-[7%]" />
                                                                                                    <col className="min-w-[80px] w-[12%]" />
                                                                                                    <col className="min-w-[68px] w-[10%]" />
                                                                                                    <col className="min-w-[68px] w-[10%]" />
                                                                                                    <col className="min-w-[72px] w-[11%]" />
                                                                                                    <col className="min-w-[72px] w-[11%]" />
                                                                                                    <col className="min-w-[68px] w-[15%]" />
                                                                                                </colgroup>
                                                                                                <thead>
                                                                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                                                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Proyecto</th>
                                                                                                        <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Horas</th>
                                                                                                        <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Ingreso atrib. (€)</th>
                                                                                                        <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Nómina imput.</th>
                                                                                                        <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">G. comunes</th>
                                                                                                        <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                                                                                                            <Tooltip>
                                                                                                                <TooltipTrigger asChild>
                                                                                                                    <span className="cursor-help underline decoration-dotted">{t('financialHealth.employee.expandMarginPerHour')}</span>
                                                                                                                </TooltipTrigger>
                                                                                                                <TooltipContent side="top" className="text-xs max-w-xs">
                                                                                                                    {t('financialHealth.employee.expandMarginPerHourTooltip')}
                                                                                                                </TooltipContent>
                                                                                                            </Tooltip>
                                                                                                        </th>
                                                                                                        <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                                                                                                            <Tooltip>
                                                                                                                <TooltipTrigger asChild>
                                                                                                                    <span className="cursor-help underline decoration-dotted">{t('financialHealth.employee.expandProjectEhr')}</span>
                                                                                                                </TooltipTrigger>
                                                                                                                <TooltipContent side="top" className="text-xs max-w-xs">
                                                                                                                    {t('financialHealth.employee.expandProjectEhrTooltip')}
                                                                                                                </TooltipContent>
                                                                                                            </Tooltip>
                                                                                                        </th>
                                                                                                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Margen (€)</th>
                                                                                                    </tr>
                                                                                                    <tr className="bg-slate-50/80">
                                                                                                        <th className="text-left py-0.5 px-4 text-[11px] font-normal text-slate-400" colSpan={8}>{hoursMode === 'computed' ? 'Horas computadas' : 'Horas reales'}</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody className="divide-y divide-slate-100">
                                                                                                    {byProjectFiltered.map((bp, i) => (
                                                                                                        <tr key={bp.projectId} className={cn("transition-colors hover:bg-slate-50/50", i % 2 === 1 && "bg-slate-50/30")}>
                                                                                                            <td className="py-2.5 px-4 font-medium text-slate-900" title={bp.projectName}>
                                                                                                                <SensitiveText kind="project" id={bp.projectId}>{bp.projectName}</SensitiveText>
                                                                                                            </td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 text-sm">{bp.hoursDisplay.toFixed(1)} h</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 text-sm">{bp.attributedRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 text-sm">{bp.payrollCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500 text-sm">{bp.overheadCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                            <td
                                                                                                                className={cn(
                                                                                                                    'py-2.5 px-3 text-right font-mono tabular-nums text-sm',
                                                                                                                    bp.hoursDisplay > 0.001
                                                                                                                        ? bp.margin / bp.hoursDisplay >= 0
                                                                                                                            ? 'text-emerald-700'
                                                                                                                            : 'text-red-600'
                                                                                                                        : 'text-slate-700'
                                                                                                                )}
                                                                                                            >
                                                                                                                {bp.hoursDisplay > 0.001 ? `${(bp.margin / bp.hoursDisplay).toFixed(2)} €/h` : '–'}
                                                                                                            </td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 text-sm">
                                                                                                                {bp.projectEhr > 0 ? `${bp.projectEhr.toFixed(2)} €/h` : '–'}
                                                                                                            </td>
                                                                                                            {(() => {
                                                                                                                const bpPct = bp.attributedRevenue > 0 ? (bp.margin / bp.attributedRevenue) * 100 : (bp.margin < 0 ? -1 : 0);
                                                                                                                const bpSem = getMarginSemaphore(bpPct);
                                                                                                                return (
                                                                                                                    <td className={cn("py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-sm", bpSem.className)}>
                                                                                                                        <span className="inline-flex items-center justify-end gap-1">
                                                                                                                            {bpSem.showAlert && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
                                                                                                                            {bp.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                                                                                        </span>
                                                                                                                    </td>
                                                                                                                );
                                                                                                            })()}
                                                                                                        </tr>
                                                                                                    ))}
                                                                                                    {showNotAttributedRow && (
                                                                                                        <tr className="bg-amber-50/40 text-slate-600 italic">
                                                                                                            <td className="py-2.5 px-4 text-sm">
                                                                                                                <Tooltip>
                                                                                                                    <TooltipTrigger asChild>
                                                                                                                        <span className="cursor-help underline decoration-dotted decoration-amber-400">No imputado</span>
                                                                                                                    </TooltipTrigger>
                                                                                                                    <TooltipContent side="right" className="text-xs max-w-xs">
                                                                                                                        {dynamicMode
                                                                                                                            ? 'Horas en tareas internas o proyectos fuera de esta vista. Se añaden aquí para que el total cuadre con la nómina.'
                                                                                                                            : 'Horas en tareas internas o fuera de vista. En modo Operativo el coste se calcula con capacidad teórica y puede no cuadrar exactamente con la nómina.'}
                                                                                                                    </TooltipContent>
                                                                                                                </Tooltip>
                                                                                                            </td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm">{hoursNotAttributed.toFixed(1)} h</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm">—</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm">{payrollNotAttributed.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm">{overheadNotAttributed.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm">—</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm">—</td>
                                                                                                            <td className="py-2.5 px-4 text-right font-mono tabular-nums text-sm text-slate-500">{(-costNotAttributed).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                        </tr>
                                                                                                    )}
                                                                                                    {showStandardIdleRow && (
                                                                                                        <tr className="bg-slate-100/50 text-slate-600 text-sm">
                                                                                                            <td className="py-2.5 px-4">
                                                                                                                <Tooltip>
                                                                                                                    <TooltipTrigger asChild>
                                                                                                                        <span className="cursor-help underline decoration-dotted decoration-slate-400">{t('financialHealth.employee.standardIdleRowLabel')}</span>
                                                                                                                    </TooltipTrigger>
                                                                                                                    <TooltipContent side="right" className="text-xs max-w-xs">
                                                                                                                        {t('financialHealth.employee.standardIdleRowTableTooltip')}
                                                                                                                    </TooltipContent>
                                                                                                                </Tooltip>
                                                                                                            </td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">—</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">—</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">{payrollStandardIdleRow.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">—</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">—</td>
                                                                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">—</td>
                                                                                                            <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-500">{(-payrollStandardIdleRow).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                        </tr>
                                                                                                    )}
                                                                                                    <tr className="border-t-2 border-slate-200 bg-slate-100/90 font-semibold text-slate-800">
                                                                                                        <td className="py-3 px-4">Total</td>
                                                                                                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">{totalHoursRow.toFixed(1)} h</td>
                                                                                                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">{sumAttr.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">{totalPayrollRow.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">{totalOverheadRow.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                        <td
                                                                                                            className={cn(
                                                                                                                'py-3 px-3 text-right font-mono tabular-nums text-sm',
                                                                                                                totalHoursRow > 0.001
                                                                                                                    ? (sumAttr - totalCostRow) / totalHoursRow >= 0
                                                                                                                        ? 'text-emerald-700'
                                                                                                                        : 'text-red-600'
                                                                                                                    : 'text-slate-800'
                                                                                                            )}
                                                                                                        >
                                                                                                            {totalHoursRow > 0.001
                                                                                                                ? `${((sumAttr - totalCostRow) / totalHoursRow).toFixed(2)} €/h`
                                                                                                                : '–'}
                                                                                                        </td>
                                                                                                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm">—</td>
                                                                                                        <td className={cn("py-3 px-4 text-right font-mono tabular-nums text-sm", (sumAttr - totalCostRow) >= 0 ? "text-emerald-700" : "text-red-600")}>{(sumAttr - totalCostRow).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                    </tr>
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })()}
                                                        </Fragment>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t-2 border-slate-200 bg-slate-100/90 font-semibold text-slate-800">
                                                    <td className="px-4 py-3">Total</td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                        {employeeProfitabilityFilteredBySearch
                                                            .reduce((s, ep) => s + ep.payrollMonthly, 0)
                                                            .toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                        {employeeDisplayTotalsWhenSearch
                                                            ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.hours ?? 0), 0).toFixed(1)
                                                            : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (hoursMode === 'computed' ? ep.totalComputed : ep.totalActual), 0).toFixed(1)} h
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                        {employeeDisplayTotalsWhenSearch
                                                            ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? 0), 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                                                            : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                        {employeeDisplayTotalsWhenSearch
                                                            ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.cost ?? 0), 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                                                            : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.cost, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                    </td>
                                                    <td className={cn("px-4 py-3 text-right font-mono tabular-nums", (() => {
                                                        const ta = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                        const tm = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                        return getMarginSemaphore(ta > 0 ? (tm / ta) * 100 : (tm < 0 ? -1 : 0)).className;
                                                    })())}>
                                                        <span className="inline-flex items-center justify-end gap-1">
                                                            {(() => {
                                                                const ta = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                                const tm = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                                const sem = getMarginSemaphore(ta > 0 ? (tm / ta) * 100 : (tm < 0 ? -1 : 0));
                                                                return sem.showAlert && <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
                                                            })()}
                                                            {employeeDisplayTotalsWhenSearch
                                                                ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                                                                : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                        </span>
                                                    </td>
                                                    <td className={cn("px-4 py-3 text-right font-mono tabular-nums", (() => {
                                                        const ta = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                        const tm = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                        return getMarginSemaphore(ta > 0 ? (tm / ta) * 100 : (tm < 0 ? -1 : 0)).className;
                                                    })())}>
                                                        {(() => {
                                                            const ta = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.attr ?? ep.attributedRevenue), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                            const tm = employeeDisplayTotalsWhenSearch ? employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (employeeDisplayTotalsWhenSearch.get(ep.employeeId)?.margin ?? ep.margin), 0) : employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                            return ta > 0 ? `${((tm / ta) * 100).toFixed(1)}%` : '–';
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3" />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TooltipProvider>
        </div>
    );
}
