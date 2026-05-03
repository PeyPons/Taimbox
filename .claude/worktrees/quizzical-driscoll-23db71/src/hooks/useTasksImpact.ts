import { useMemo } from 'react';
import { Project, NewTaskRow } from '@/types';
import { ProjectBudgetStatus } from './useAllocationSheet';
import { format } from 'date-fns';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

interface UseTasksImpactProps {
    newTasks: NewTaskRow[];
    projects: Project[];
    weeks: { weekStart: Date; effectiveStart?: Date; effectiveEnd?: Date }[];
    employeeId: string;
    getEmployeeLoadForWeek: (
        employeeId: string,
        weekStart: string,
        effectiveStart?: Date,
        effectiveEnd?: Date,
        viewMonth?: Date
    ) => { hours: number; capacity: number; percentage: number };
    getProjectBudgetStatus: (projectId: string) => ProjectBudgetStatus;
    viewMonth?: Date;
}

export function useTasksImpact({
    newTasks,
    projects,
    weeks,
    employeeId,
    getEmployeeLoadForWeek,
    getProjectBudgetStatus,
    viewMonth
}: UseTasksImpactProps) {

    const tasksImpact = useMemo(() => {
        if (!employeeId) return { projects: [], weeks: [] };

        const projectImpact: Record<string, number> = {};
        const weekImpact: Record<string, number> = {};

        newTasks.forEach(task => {
            const hours = parseFloat(task.hours) || 0;
            if (hours > 0) {
                if (task.projectId) projectImpact[task.projectId] = (projectImpact[task.projectId] || 0) + hours;
                if (task.weekDate) weekImpact[task.weekDate] = (weekImpact[task.weekDate] || 0) + hours;
            }
        });

        const projectsResult = Object.entries(projectImpact).map(([projectId, adding]) => {
            const project = projects.find(p => p.id === projectId);
            const currentStatus = getProjectBudgetStatus(projectId);
            const newTotal = currentStatus.totalComputed + currentStatus.totalPlanned + adding;
            const exceeds = currentStatus.budgetMax > 0 && newTotal > currentStatus.budgetMax;
            return {
                id: projectId,
                name: project?.name || '',
                adding,
                current: currentStatus,
                newTotal,
                exceeds,
                status: currentStatus // Ensure status is passed if needed
            };
        });

        const weeksResult = Object.entries(weekImpact).map(([weekDate, adding]) => {
            const weekIndex = weeks.findIndex(w => format(w.weekStart, 'yyyy-MM-dd') === weekDate);
            if (weekIndex === -1) return null;

            const weekData = weeks[weekIndex];
            const currentLoad = getEmployeeLoadForWeek(
                employeeId,
                weekData.weekStart.toISOString(), // Assuming string input based on typical usage, checking compatibility
                weekData.effectiveStart,
                weekData.effectiveEnd,
                viewMonth
            );

            const newTotal = round2(currentLoad.hours + adding);
            // Logic for capacity might vary, assuming currentLoad.capacity is the weekly limit
            const exceeds = newTotal > currentLoad.capacity;

            return {
                weekDate,
                weekIndex,
                adding,
                currentHours: currentLoad.hours,
                capacity: currentLoad.capacity,
                newTotal,
                exceeds
            };
        }).filter((w): w is NonNullable<typeof w> => w !== null);

        return { projects: projectsResult, weeks: weeksResult };
    }, [newTasks, projects, weeks, employeeId, getEmployeeLoadForWeek, getProjectBudgetStatus, viewMonth]);

    const getWeekExceedStatus = (weekDate: string) => tasksImpact.weeks.find((w) => w.weekDate === weekDate)?.exceeds || false;
    const getProjectExceedStatus = (projectId: string) => tasksImpact.projects.find((p) => p.id === projectId)?.exceeds || false;

    return {
        tasksImpact,
        getWeekExceedStatus,
        getProjectExceedStatus
    };
}
