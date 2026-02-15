/**
 * Devuelve el budget efectivo para un proyecto en un mes.
 * Si el deadline tiene budgetOverride, lo usa; si no, usa project.budgetHours.
 */
export function getEffectiveBudget(
    project: { budgetHours: number },
    deadline?: { budgetOverride?: number } | null
): number {
    if (deadline?.budgetOverride != null && deadline.budgetOverride >= 0) {
        return deadline.budgetOverride;
    }
    return project.budgetHours || 0;
}

/**
 * Devuelve el minimum efectivo para un proyecto en un mes.
 * Si el budget fue overridden, el minimum no puede exceder el override.
 */
export function getEffectiveMinimum(
    project: { budgetHours: number; minimumHours?: number },
    deadline?: { budgetOverride?: number } | null
): number {
    const minimum = project.minimumHours || 0;
    if (deadline?.budgetOverride != null && deadline.budgetOverride >= 0) {
        // Si hay override, el minimum no debe superar el budget ajustado
        return Math.min(minimum, deadline.budgetOverride);
    }
    return minimum;
}
