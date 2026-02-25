import { useMemo } from 'react';
import { parseISO, isSameMonth, isBefore, isAfter, startOfMonth, endOfMonth, getDay, format, eachDayOfInterval, isWeekend } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import { Allocation, Project, Employee } from '../types';
import { getEffectiveBudget } from '@/utils/budgetUtils';

/**
 * Central metrics calculation hook.
 * Single source of truth for project and employee metrics.
 * Use this throughout the application instead of recalculating locally.
 */

export interface ProjectMetrics {
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;

    // Hours
    planned: number;        // hoursAssigned from allocations
    actual: number;         // hoursActual (user-entered)
    computed: number;       // hoursComputed (from time_entries or derived)
    budget: number;         // budgetHours from project
    minimum: number;        // minimumHours from project

    // Financials
    monthlyFee: number;
    hourlyRate: number;     // Calculated: monthlyFee / budget (or avg employee rate)
    hoursValue: number;     // computed * hourlyRate

    // Progress
    progressOperational: number;  // computed / budget (0-100)
    progressBilling: number;      // hoursValue / monthlyFee (0-100)
    available: number;            // budget - computed

    // Status
    isPacing: boolean;      // On track for the month
    isOverBudget: boolean;
}

export interface EmployeeMetrics {
    employeeId: string;
    employeeName: string;

    // Hours
    totalPlanned: number;
    totalActual: number;
    totalComputed: number;
    capacity: number;

    // Load
    loadPercentage: number;
    status: 'empty' | 'healthy' | 'warning' | 'overload';

    // Projects breakdown
    projectBreakdown: { projectId: string; projectName: string; hours: number }[];
}

/** Deadline mínimo para presupuesto efectivo (budgetOverride del mes) */
export interface ProjectMetricsDeadline {
    projectId: string;
    month: string;
    budgetOverride?: number;
}

export interface UseProjectMetricsOptions {
    month: Date;
    projectId?: string;
    employeeId?: string;
    clientId?: string;
    /** Si se pasa, se usa getEffectiveBudget(project, deadline) para el objetivo del mes (coherente con Deadlines/Coherencia) */
    deadlines?: ProjectMetricsDeadline[];
}

export interface UseProjectMetricsResult {
    projectMetrics: ProjectMetrics[];
    employeeMetrics: EmployeeMetrics[];
    totals: {
        totalPlanned: number;
        totalActual: number;
        totalComputed: number;
        totalBudget: number;
        totalFee: number;
        avgProgress: number;
    };
    isLoading: boolean;

    // Helper functions
    getProjectMetrics: (projectId: string) => ProjectMetrics | undefined;
    getEmployeeMetrics: (employeeId: string) => EmployeeMetrics | undefined;
}

/**
 * Calculate working days in month for proration
 */
function getWorkingDaysInPeriod(start: Date, end: Date): number {
    const days = eachDayOfInterval({ start, end });
    return days.filter(d => !isWeekend(d)).length;
}

/**
 * Prorate hours for split weeks (allocation spans two months)
 */
function prorateHoursForMonth(
    allocation: Allocation,
    month: Date
): { planned: number; actual: number; computed: number } {
    const weekStart = parseISO(allocation.weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    // If week is fully inside month, return full hours
    if (!isBefore(weekStart, monthStart) && !isAfter(weekEnd, monthEnd)) {
        return {
            planned: allocation.hoursAssigned || 0,
            actual: allocation.hoursActual || 0,
            computed: allocation.hoursComputed || allocation.hoursActual || allocation.hoursAssigned || 0
        };
    }

    // Calculate overlap period
    const overlapStart = isBefore(weekStart, monthStart) ? monthStart : weekStart;
    const overlapEnd = isAfter(weekEnd, monthEnd) ? monthEnd : weekEnd;

    // Get working days in overlap vs total week
    const overlapDays = getWorkingDaysInPeriod(overlapStart, overlapEnd);
    const totalDays = getWorkingDaysInPeriod(weekStart, weekEnd);

    if (totalDays === 0) return { planned: 0, actual: 0, computed: 0 };

    const ratio = overlapDays / totalDays;

    return {
        planned: (allocation.hoursAssigned || 0) * ratio,
        actual: (allocation.hoursActual || 0) * ratio,
        computed: (allocation.hoursComputed || allocation.hoursActual || allocation.hoursAssigned || 0) * ratio
    };
}

export function useProjectMetrics(options: UseProjectMetricsOptions): UseProjectMetricsResult {
    const { allocations, projects, clients, employees, isLoading } = useApp();
    const { month, projectId, employeeId, clientId, deadlines } = options;

    const result = useMemo(() => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthKey = format(month, 'yyyy-MM');

        // Filter allocations for the month (with proration for split weeks)
        const monthAllocations = allocations.filter(a => {
            const weekStart = parseISO(a.weekStartDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            // Include if week overlaps with month
            return !isAfter(weekStart, monthEnd) && !isBefore(weekEnd, monthStart);
        });

        // Apply additional filters
        let filteredAllocations = monthAllocations;
        if (projectId) {
            filteredAllocations = filteredAllocations.filter(a => a.projectId === projectId);
        }
        if (employeeId) {
            filteredAllocations = filteredAllocations.filter(a => a.employeeId === employeeId);
        }
        if (clientId) {
            const clientProjects = projects.filter(p => p.clientId === clientId).map(p => p.id);
            filteredAllocations = filteredAllocations.filter(a => clientProjects.includes(a.projectId));
        }

        // Calculate project metrics
        const projectMetricsMap = new Map<string, ProjectMetrics>();

        for (const project of projects) {
            if (projectId && project.id !== projectId) continue;
            if (clientId && project.clientId !== clientId) continue;

            const client = clients.find(c => c.id === project.clientId);
            const projectAllocations = filteredAllocations.filter(a => a.projectId === project.id);

            let totalPlanned = 0;
            let totalActual = 0;
            let totalComputed = 0;

            for (const allocation of projectAllocations) {
                const prorated = prorateHoursForMonth(allocation, month);
                totalPlanned += prorated.planned;
                totalActual += prorated.actual;
                totalComputed += prorated.computed;
            }

            const deadlineForMonth = deadlines?.find(d => d.projectId === project.id && d.month === monthKey);
            const budget = getEffectiveBudget(project, deadlineForMonth);
            const minimum = project.minimumHours || 0;
            const monthlyFee = project.monthlyFee || 0;
            const hourlyRate = budget > 0 ? monthlyFee / budget : 0;
            const hoursValue = totalComputed * hourlyRate;

            const progressOperational = budget > 0 ? (totalComputed / budget) * 100 : 0;
            const progressBilling = monthlyFee > 0 ? (hoursValue / monthlyFee) * 100 : 0;

            // Pacing: check if on track for day of month
            const today = new Date();
            const dayOfMonth = today.getDate();
            const daysInMonth = endOfMonth(month).getDate();
            const expectedProgress = (dayOfMonth / daysInMonth) * 100;
            const isPacing = progressOperational >= expectedProgress * 0.8; // Within 80% of expected

            projectMetricsMap.set(project.id, {
                projectId: project.id,
                projectName: project.name,
                clientId: project.clientId,
                clientName: client?.name || 'Unknown',
                planned: Math.round(totalPlanned * 100) / 100,
                actual: Math.round(totalActual * 100) / 100,
                computed: Math.round(totalComputed * 100) / 100,
                budget,
                minimum,
                monthlyFee,
                hourlyRate: Math.round(hourlyRate * 100) / 100,
                hoursValue: Math.round(hoursValue * 100) / 100,
                progressOperational: Math.round(progressOperational * 10) / 10,
                progressBilling: Math.round(progressBilling * 10) / 10,
                available: Math.round((budget - totalComputed) * 100) / 100,
                isPacing,
                isOverBudget: totalComputed > budget
            });
        }

        // Calculate employee metrics
        const employeeMetricsMap = new Map<string, EmployeeMetrics>();

        for (const employee of employees.filter(e => e.isActive)) {
            if (employeeId && employee.id !== employeeId) continue;

            const empAllocations = filteredAllocations.filter(a => a.employeeId === employee.id);

            let totalPlanned = 0;
            let totalActual = 0;
            let totalComputed = 0;
            const projectBreakdown: { projectId: string; projectName: string; hours: number }[] = [];

            // Group by project
            const projectHours = new Map<string, number>();

            for (const allocation of empAllocations) {
                const prorated = prorateHoursForMonth(allocation, month);
                totalPlanned += prorated.planned;
                totalActual += prorated.actual;
                totalComputed += prorated.computed;

                const current = projectHours.get(allocation.projectId) || 0;
                projectHours.set(allocation.projectId, current + prorated.computed);
            }

            for (const [projId, hours] of projectHours) {
                const project = projects.find(p => p.id === projId);
                projectBreakdown.push({
                    projectId: projId,
                    projectName: project?.name || 'Unknown',
                    hours: Math.round(hours * 100) / 100
                });
            }

            // Calculate capacity (weekly * ~4.33 weeks per month)
            const capacity = (employee.defaultWeeklyCapacity || 40) * 4.33;
            const loadPercentage = capacity > 0 ? (totalComputed / capacity) * 100 : 0;

            let status: 'empty' | 'healthy' | 'warning' | 'overload' = 'empty';
            if (loadPercentage === 0) status = 'empty';
            else if (loadPercentage <= 85) status = 'healthy';
            else if (loadPercentage <= 100) status = 'warning';
            else status = 'overload';

            employeeMetricsMap.set(employee.id, {
                employeeId: employee.id,
                employeeName: employee.name,
                totalPlanned: Math.round(totalPlanned * 100) / 100,
                totalActual: Math.round(totalActual * 100) / 100,
                totalComputed: Math.round(totalComputed * 100) / 100,
                capacity: Math.round(capacity * 100) / 100,
                loadPercentage: Math.round(loadPercentage * 10) / 10,
                status,
                projectBreakdown
            });
        }

        // Calculate totals
        const projectMetrics = Array.from(projectMetricsMap.values());
        const employeeMetrics = Array.from(employeeMetricsMap.values());

        const totals = {
            totalPlanned: projectMetrics.reduce((sum, p) => sum + p.planned, 0),
            totalActual: projectMetrics.reduce((sum, p) => sum + p.actual, 0),
            totalComputed: projectMetrics.reduce((sum, p) => sum + p.computed, 0),
            totalBudget: projectMetrics.reduce((sum, p) => sum + p.budget, 0),
            totalFee: projectMetrics.reduce((sum, p) => sum + p.monthlyFee, 0),
            avgProgress: projectMetrics.length > 0
                ? projectMetrics.reduce((sum, p) => sum + p.progressOperational, 0) / projectMetrics.length
                : 0
        };

        return {
            projectMetrics,
            employeeMetrics,
            totals,
            getProjectMetrics: (id: string) => projectMetricsMap.get(id),
            getEmployeeMetrics: (id: string) => employeeMetricsMap.get(id)
        };
    }, [allocations, projects, clients, employees, month, projectId, employeeId, clientId, deadlines]);

    return {
        ...result,
        isLoading
    };
}

export default useProjectMetrics;
