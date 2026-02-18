/**
 * usePlannerData Hook
 * 
 * Extracts date navigation logic, week calculations, and month loading
 * from PlannerGrid component into a reusable hook.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { getWeeksForMonth, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { useAgency } from '@/contexts/AgencyContext';
import { employeeBelongsToDepartment, normalizeDepartments } from '@/utils/departmentUtils';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Employee } from '@/types';

interface WeekData {
    weekStart: Date;
    weekEnd: Date;
    effectiveStart: Date;
    effectiveEnd: Date;
}

interface UsePlannerDataOptions {
    initialDate?: Date;
    showOnlyMe?: boolean;
    selectedEmployeeId?: string;
    selectedProjectId?: string;
}

export function usePlannerData(options: UsePlannerDataOptions = {}) {
    const {
        employees,
        projects,
        allocations,
        absences,
        teamEvents,
        currentUser,
        ensureMonthLoaded,
        isLoading: isGlobalLoading,
        getEmployeeMonthlyLoad
    } = useApp();
    const { currentAgency } = useAgency();
    const { selectedDepartmentId } = useDepartmentView();
    const { isPlatformAdmin } = usePlatformAdmin();
    const departments = useMemo(() => normalizeDepartments(currentAgency?.settings?.departments), [currentAgency?.settings?.departments]);

    // ============================================================
    // Date State & Navigation
    // ============================================================
    const [currentMonth, setCurrentMonth] = useState(() => {
        const saved = localStorage.getItem('planner_date');
        return saved ? new Date(saved) : (options.initialDate || new Date());
    });

    const [isLoadingMonth, setIsLoadingMonth] = useState(false);

    // Persist current month to localStorage
    useEffect(() => {
        localStorage.setItem('planner_date', currentMonth.toISOString());
    }, [currentMonth]);

    // Load data for current month using centralized ensureMonthLoaded
    useEffect(() => {
        if (!isGlobalLoading) {
            setIsLoadingMonth(true);
            ensureMonthLoaded(currentMonth)
                .finally(() => setIsLoadingMonth(false));
        }
    }, [currentMonth, isGlobalLoading, ensureMonthLoaded]);

    // ============================================================
    // Navigation Handlers
    // ============================================================
    const goToPrevMonth = useCallback(() => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const goToToday = useCallback(() => {
        setCurrentMonth(new Date());
    }, []);

    // ============================================================
    // Computed Values
    // ============================================================
    const weeks = useMemo(() => getWeeksForMonth(currentMonth), [currentMonth]);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Index of employees by project for filtering
    const employeesByProject = useMemo(() => {
        const index = new Map<string, Set<string>>();
        (allocations || []).forEach(a => {
            if (isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)) {
                if (!index.has(a.projectId)) index.set(a.projectId, new Set());
                index.get(a.projectId)!.add(a.employeeId);
            }
        });
        return index;
    }, [allocations, currentMonth]);

    // ============================================================
    // Filtered Employees
    // ============================================================
    const filteredEmployees = useMemo(() => {
        const showOnlyMe = options.showOnlyMe ?? false;
        const selectedEmployeeId = options.selectedEmployeeId ?? 'all';
        const selectedProjectId = options.selectedProjectId ?? 'all';

        // Si showOnlyMe está activo: para usuarios normales filtrar por currentUser; si es platform admin sin perfil en la agencia, mostrar todos (ver datos de la agencia).
        const effectiveShowOnlyMe = showOnlyMe && currentUser != null;

        return (employees || []).filter((e: Employee) => {
            if (!e.isActive) return false;
            if (effectiveShowOnlyMe && e.id !== currentUser!.id) return false;
            if (selectedEmployeeId !== 'all' && e.id !== selectedEmployeeId) return false;
            if (selectedProjectId !== 'all') {
                const employeesInProject = employeesByProject.get(selectedProjectId);
                if (!employeesInProject || !employeesInProject.has(e.id)) return false;
            }
            // Vista por departamento: solo empleados del departamento seleccionado
            if (selectedDepartmentId && departments.length > 0) {
                const dept = departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
                if (dept && !employeeBelongsToDepartment(e.department, dept.id, dept.name)) return false;
            }
            return true;
        });
    }, [employees, options.showOnlyMe, options.selectedEmployeeId, options.selectedProjectId, employeesByProject, currentUser, selectedDepartmentId, departments, isPlatformAdmin]);

    // Sorted lists for dropdowns
    const sortedProjects = useMemo(() =>
        [...(projects || [])].sort((a, b) => a.name.localeCompare(b.name)),
        [projects]
    );

    const sortedEmployees = useMemo(() =>
        [...(employees || [])].filter(e => e.isActive).sort((a, b) => a.name.localeCompare(b.name)),
        [employees]
    );

    const monthAllocations = useMemo(() =>
        (allocations || []).filter(a => isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)),
        [allocations, currentMonth]
    );

    return {
        // Current state
        currentMonth,
        year,
        month,
        weeks,
        isLoadingMonth,

        // Navigation
        goToPrevMonth,
        goToNextMonth,
        goToToday,
        setCurrentMonth,

        // Filtered data
        filteredEmployees,
        sortedProjects,
        sortedEmployees,
        employeesByProject,
        monthAllocations,

        // Raw data from context (for components that need it)
        employees,
        projects,
        allocations,
        absences,
        teamEvents,
        currentUser,

        // Utility functions
        getEmployeeMonthlyLoad
    };
}
