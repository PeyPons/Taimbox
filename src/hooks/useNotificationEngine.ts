import { useCallback, useEffect } from 'react';
import { differenceInDays, endOfMonth, format, startOfWeek } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  loadNotificationState,
  saveNotificationState,
  storageKeyForNotifyState,
} from '@/lib/notificationState';

/**
 * Reglas automáticas → entradas en la campanita (historial local), no toasts.
 * Deduplicación en `notificationState` (`tb_notify_state_*`).
 */
export function useNotificationEngine(): void {
  const { currentUser, allocations, projects } = useApp();
  const { currentAgency } = useAgency();
  const { permissions } = usePermissions();
  const { pushSystemNotification } = useNotifications();

  const runRules = useCallback(() => {
    if (!currentUser?.id || !currentAgency?.id) return;

    const storageKey = storageKeyForNotifyState(currentAgency.id, currentUser.id);
    const projectIds = new Set(projects.map((p) => p.id));
    const now = new Date();
    let state = loadNotificationState(storageKey, projectIds, now);
    let dirty = false;

    const canSeeBudget =
      (permissions.can_access_agency_settings !== false || permissions.can_access_team !== false) &&
      permissions.can_access_projects !== false;

    if (canSeeBudget) {
      for (const p of projects) {
        if (p.status !== 'active') continue;
        if (state.budgetAlerts[p.id]) continue;
        const totalUsed = allocations
          .filter((a) => a.projectId === p.id)
          .reduce((acc, a) => acc + (a.hoursActual || 0), 0);
        if (totalUsed > p.budgetHours) {
          const clientsProjectsBase =
            permissions.can_access_clients !== false ? '/clients' : '/projects';
          pushSystemNotification({
            type: 'budget',
            title: 'Horas superadas',
            message: `${p.name} ha superado el presupuesto (${totalUsed.toFixed(1)}h de ${p.budgetHours}h).`,
            projectId: p.id,
            link: `${clientsProjectsBase}?projectId=${encodeURIComponent(p.id)}`,
          });
          state = {
            ...state,
            budgetAlerts: { ...state.budgetAlerts, [p.id]: now.toISOString() },
          };
          dirty = true;
        }
      }
    }

    const dayOfWeek = now.getDay();
    if (dayOfWeek === 4 && permissions.can_access_weekly_forecast !== false) {
      const monday = startOfWeek(now, { weekStartsOn: 1 });
      const weekKey = format(monday, 'yyyy-MM-dd');
      if (state.lastWeeklyReminderWeekKey !== weekKey) {
        const weekStartStr = format(monday, 'yyyy-MM-dd');
        const pending = allocations.filter(
          (a) =>
            a.employeeId === currentUser.id &&
            a.weekStartDate === weekStartStr &&
            a.status === 'planned' &&
            (!a.hoursActual || a.hoursActual === 0)
        );
        if (pending.length >= 2) {
          pushSystemNotification({
            type: 'weekly',
            title: 'Cierre semanal pendiente',
            message: `Tienes ${pending.length} tareas abiertas esta semana. Ciérralas y actualiza las horas reales.`,
            link: '/weekly-forecast',
          });
          state = { ...state, lastWeeklyReminderWeekKey: weekKey };
          dirty = true;
        }
      }
    }

    const monthEnd = endOfMonth(now);
    const daysLeft = differenceInDays(monthEnd, now);
    const monthKey = format(now, 'yyyy-MM');
    if (permissions.can_access_deadlines !== false && daysLeft <= 3 && !state.deadlineAlerts[monthKey]) {
      pushSystemNotification({
        type: 'deadline',
        title: 'Cierre de mes próximo',
        message: `Quedan ${Math.max(0, daysLeft)} día(s) hasta fin de mes. Revisa entregables y deadlines.`,
        link: '/deadlines',
      });
      state = {
        ...state,
        deadlineAlerts: { ...state.deadlineAlerts, [monthKey]: now.toISOString() },
      };
      dirty = true;
    }

    if (dirty) {
      saveNotificationState(storageKey, state);
    }
  }, [allocations, currentAgency?.id, currentUser?.id, permissions, projects, pushSystemNotification]);

  useEffect(() => {
    runRules();
  }, [runRules]);

  useEffect(() => {
    const onFocus = () => runRules();
    const onVis = () => {
      if (document.visibilityState === 'visible') runRules();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [runRules]);
}
