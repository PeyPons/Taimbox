/**
 * Unified capacity calculation utilities
 * 
 * Prevents double-counting of absence/event overlap by calculating
 * capacity reduction day-by-day and ensuring the maximum reduction
 * per day never exceeds scheduled hours.
 */

import { Absence, TeamEvent, WorkSchedule } from '@/types';
import { eachDayOfInterval, getDay, parseISO, startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';

const DAY_KEYS: (keyof WorkSchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Get the scheduled working hours for a specific day
 */
export function getScheduledHoursForDay(date: Date, workSchedule: WorkSchedule): number {
    const dayIndex = getDay(date);
    const dayName = DAY_KEYS[dayIndex];
    return workSchedule[dayName] || 0;
}

/**
 * Check if a specific date is covered by any absence (full day)
 */
export function isDateCoveredByAbsence(date: Date, absences: Absence[]): boolean {
    return absences.some(absence => {
        try {
            const startDate = startOfDay(parseISO(absence.startDate));
            const endDate = endOfDay(parseISO(absence.endDate));
            const checkDate = startOfDay(date);
            return checkDate >= startDate && checkDate <= endDate;
        } catch {
            return false;
        }
    });
}

/**
 * Get absence hours for a specific day
 * Returns the hours reduced by absences on that day (capped by scheduled hours)
 */
export function getAbsenceHoursForDay(
    date: Date,
    absences: Absence[],
    workSchedule: WorkSchedule
): number {
    const scheduledHours = getScheduledHoursForDay(date, workSchedule);
    if (scheduledHours === 0) return 0;

    let maxAbsenceHours = 0;
    const dateToCheck = startOfDay(date);

    absences.forEach(absence => {
        try {
            const absStart = startOfDay(parseISO(absence.startDate));
            const absEnd = startOfDay(parseISO(absence.endDate));

            if (dateToCheck >= absStart && dateToCheck <= absEnd) {
                // Determine hours for this absence
                const absenceHours = Number(absence.hours);
                let hoursForDay: number;

                if (!isNaN(absenceHours) && absenceHours > 0) {
                    // Partial absence - use specified hours (capped)
                    hoursForDay = Math.min(absenceHours, scheduledHours);
                } else {
                    // Full day absence
                    hoursForDay = scheduledHours;
                }

                // Track maximum (if multiple absences overlap, take the highest)
                maxAbsenceHours = Math.max(maxAbsenceHours, hoursForDay);
            }
        } catch {
            // Skip invalid absences
        }
    });

    return maxAbsenceHours;
}

/**
 * Get team event hours for a specific day
 * Returns the hours reduced by events on that day (capped by scheduled hours)
 */
export function getEventHoursForDay(
    date: Date,
    employeeId: string,
    teamEvents: TeamEvent[],
    workSchedule: WorkSchedule
): number {
    const scheduledHours = getScheduledHoursForDay(date, workSchedule);
    if (scheduledHours === 0) return 0;

    let totalEventHours = 0;
    const dateStr = format(date, 'yyyy-MM-dd');

    teamEvents.forEach(event => {
        const eventDateStr = format(new Date(event.date), 'yyyy-MM-dd');

        if (eventDateStr === dateStr) {
            // Check if employee is affected
            const isAffected = event.affectedEmployeeIds === 'all' ||
                event.affectedEmployeeIds.includes(employeeId);

            if (isAffected) {
                if (event.hoursReduction >= 8) {
                    // Full day event - use employee's scheduled hours
                    totalEventHours = Math.max(totalEventHours, scheduledHours);
                } else {
                    // Partial event - add up to scheduled max
                    totalEventHours = Math.min(totalEventHours + event.hoursReduction, scheduledHours);
                }
            }
        }
    });

    return Math.min(totalEventHours, scheduledHours);
}

/**
 * Get the UNIFIED daily reduction for a specific day
 * 
 * This is the core function that prevents double-counting:
 * - If there's an absence that covers the day, events are ignored
 * - Returns the maximum reduction without exceeding scheduled hours
 */
export function getDailyReduction(
    date: Date,
    employeeId: string,
    absences: Absence[],
    teamEvents: TeamEvent[],
    workSchedule: WorkSchedule
): number {
    const scheduledHours = getScheduledHoursForDay(date, workSchedule);
    if (scheduledHours === 0) return 0;

    // Get absence hours for this day
    const absenceHours = getAbsenceHoursForDay(date, absences, workSchedule);

    // If absence already covers the full day, no need to check events
    if (absenceHours >= scheduledHours) {
        return scheduledHours;
    }

    // Get event hours for this day
    const eventHours = getEventHoursForDay(date, employeeId, teamEvents, workSchedule);

    // Return the maximum of absence/event hours, never exceeding scheduled
    // This prevents double-counting when both exist on the same day
    return Math.min(scheduledHours, Math.max(absenceHours, eventHours));
}

/**
 * Calculate total capacity reduction for a date range
 * 
 * Iterates day-by-day and sums up unified reductions,
 * ensuring no double-counting of overlapping absences and events.
 */
export function getCapacityReductionInRange(
    startDate: Date,
    endDate: Date,
    employeeId: string,
    absences: Absence[],
    teamEvents: TeamEvent[],
    workSchedule: WorkSchedule
): number {
    const rangeStart = startOfDay(startDate);
    const rangeEnd = endOfDay(endDate);

    // Filter relevant absences (those that overlap with the range)
    const relevantAbsences = absences.filter(absence => {
        try {
            const absStart = startOfDay(parseISO(absence.startDate));
            const absEnd = endOfDay(parseISO(absence.endDate));
            return absStart <= rangeEnd && absEnd >= rangeStart;
        } catch {
            return false;
        }
    });

    // Filter relevant events
    const relevantEvents = teamEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= rangeStart && eventDate <= rangeEnd;
    });

    // Sum up day-by-day reductions
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    let totalReduction = 0;

    days.forEach(day => {
        totalReduction += getDailyReduction(day, employeeId, relevantAbsences, relevantEvents, workSchedule);
    });

    return totalReduction;
}

/**
 * Get detailed breakdown of capacity reductions for UI display
 * Returns both the total reduction and a breakdown by reason
 */
export function getCapacityReductionBreakdown(
    startDate: Date,
    endDate: Date,
    employeeId: string,
    absences: Absence[],
    teamEvents: TeamEvent[],
    workSchedule: WorkSchedule
): {
    total: number;
    breakdown: { reason: string; hours: number; type: 'absence' | 'event' }[]
} {
    const rangeStart = startOfDay(startDate);
    const rangeEnd = endOfDay(endDate);
    const breakdown: { reason: string; hours: number; type: 'absence' | 'event' }[] = [];

    // Track which days are already accounted for by absences
    const daysAccountedFor = new Map<string, number>();

    // Process absences first (they take priority)
    absences.forEach(absence => {
        try {
            const absStart = startOfDay(parseISO(absence.startDate));
            const absEnd = startOfDay(parseISO(absence.endDate));

            if (absStart > rangeEnd || absEnd < rangeStart) return;

            let hoursForThisAbsence = 0;
            const days = eachDayOfInterval({
                start: absStart < rangeStart ? rangeStart : absStart,
                end: absEnd > rangeEnd ? rangeEnd : absEnd
            });

            days.forEach(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const scheduledHours = getScheduledHoursForDay(day, workSchedule);
                const existingHours = daysAccountedFor.get(dayKey) || 0;

                if (scheduledHours > 0 && existingHours < scheduledHours) {
                    const absenceHours = Number(absence.hours);
                    const hoursToAdd = (!isNaN(absenceHours) && absenceHours > 0)
                        ? Math.min(absenceHours, scheduledHours - existingHours)
                        : scheduledHours - existingHours;

                    hoursForThisAbsence += hoursToAdd;
                    daysAccountedFor.set(dayKey, existingHours + hoursToAdd);
                }
            });

            if (hoursForThisAbsence > 0) {
                breakdown.push({
                    reason: `Ausencia: ${absence.type}`,
                    hours: hoursForThisAbsence,
                    type: 'absence'
                });
            }
        } catch {
            // Skip invalid absences
        }
    });

    // Process events (only for days not fully covered by absences)
    teamEvents.forEach(event => {
        const eventDate = new Date(event.date);
        if (eventDate < rangeStart || eventDate > rangeEnd) return;

        const isAffected = event.affectedEmployeeIds === 'all' ||
            event.affectedEmployeeIds.includes(employeeId);
        if (!isAffected) return;

        const dayKey = format(eventDate, 'yyyy-MM-dd');
        const scheduledHours = getScheduledHoursForDay(eventDate, workSchedule);
        const existingHours = daysAccountedFor.get(dayKey) || 0;

        if (scheduledHours > 0 && existingHours < scheduledHours) {
            const eventReduction = event.hoursReduction >= 8
                ? scheduledHours
                : event.hoursReduction;
            const hoursToAdd = Math.min(eventReduction, scheduledHours - existingHours);

            if (hoursToAdd > 0) {
                breakdown.push({
                    reason: `Evento: ${event.name}`,
                    hours: hoursToAdd,
                    type: 'event'
                });
                daysAccountedFor.set(dayKey, existingHours + hoursToAdd);
            }
        }
    });

    // Calculate total
    let total = 0;
    daysAccountedFor.forEach(hours => { total += hours; });

    return { total, breakdown };
}
