import { format, parseISO, startOfWeek } from 'date-fns';

export interface UserNotificationState {
  /** Lunes (yyyy-MM-dd) de la semana en la que ya se mostró el recordatorio semanal */
  lastWeeklyReminderWeekKey?: string;
  /** projectId -> ISO de cuándo se notificó superación de presupuesto */
  budgetAlerts: Record<string, string>;
  /** yyyy-MM del mes del aviso de cierre -> ISO */
  deadlineAlerts: Record<string, string>;
  /** dedupeKey ads PPC -> ISO */
  adsBudgetAlerts: Record<string, string>;
}

const emptyState = (): UserNotificationState => ({
  budgetAlerts: {},
  deadlineAlerts: {},
  adsBudgetAlerts: {},
});

export function storageKeyForNotifyState(agencyId: string, userId: string): string {
  return `tb_notify_state_${agencyId}_${userId}`;
}

function normalizeState(raw: unknown): UserNotificationState {
  if (!raw || typeof raw !== 'object') return emptyState();
  const o = raw as Record<string, unknown>;
  return {
    lastWeeklyReminderWeekKey:
      typeof o.lastWeeklyReminderWeekKey === 'string' ? o.lastWeeklyReminderWeekKey : undefined,
    budgetAlerts:
      o.budgetAlerts && typeof o.budgetAlerts === 'object'
        ? { ...(o.budgetAlerts as Record<string, string>) }
        : {},
    deadlineAlerts:
      o.deadlineAlerts && typeof o.deadlineAlerts === 'object'
        ? { ...(o.deadlineAlerts as Record<string, string>) }
        : {},
    adsBudgetAlerts:
      o.adsBudgetAlerts && typeof o.adsBudgetAlerts === 'object'
        ? { ...(o.adsBudgetAlerts as Record<string, string>) }
        : {},
  };
}

/** Elimina proyectos inexistentes y meses de deadline pasados (estrictamente anteriores al mes actual). */
export function pruneNotificationState(
  state: UserNotificationState,
  validProjectIds: Set<string>,
  now: Date = new Date()
): UserNotificationState {
  const budgetAlerts: Record<string, string> = {};
  for (const [pid, iso] of Object.entries(state.budgetAlerts)) {
    if (validProjectIds.has(pid)) budgetAlerts[pid] = iso;
  }
  const currentMonth = format(now, 'yyyy-MM');
  const deadlineAlerts: Record<string, string> = {};
  for (const [key, iso] of Object.entries(state.deadlineAlerts)) {
    if (key >= currentMonth) deadlineAlerts[key] = iso;
  }
  const adsBudgetAlerts: Record<string, string> = {};
  for (const [key, iso] of Object.entries(state.adsBudgetAlerts)) {
    const monthPart = key.split(':')[2];
    if (!monthPart || monthPart >= currentMonth) adsBudgetAlerts[key] = iso;
  }
  return { ...state, budgetAlerts, deadlineAlerts, adsBudgetAlerts };
}

function collectDeadlineLegacyKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('deadline_alert_')) keys.push(k);
  }
  return keys;
}

function migrateLegacyIntoState(): UserNotificationState {
  const state = emptyState();

  const budgetRaw = localStorage.getItem('budget_alert_projects');
  if (budgetRaw) {
    try {
      const ids = JSON.parse(budgetRaw) as unknown;
      const iso = new Date().toISOString();
      if (Array.isArray(ids)) {
        for (const id of ids) {
          if (typeof id === 'string') state.budgetAlerts[id] = iso;
        }
      }
    } catch {
      /* ignore */
    }
    localStorage.removeItem('budget_alert_projects');
  }

  const lastWeekly = localStorage.getItem('last_weekly_reminder');
  if (lastWeekly) {
    try {
      const d = parseISO(lastWeekly);
      const monday = startOfWeek(d, { weekStartsOn: 1 });
      state.lastWeeklyReminderWeekKey = format(monday, 'yyyy-MM-dd');
    } catch {
      /* ignore */
    }
    localStorage.removeItem('last_weekly_reminder');
  }

  for (const k of collectDeadlineLegacyKeys()) {
    const m = /^deadline_alert_(\d+)_(\d+)$/.exec(k);
    if (m) {
      const year = parseInt(m[1], 10);
      const month0 = parseInt(m[2], 10);
      const monthKey = `${year}-${String(month0 + 1).padStart(2, '0')}`;
      state.deadlineAlerts[monthKey] = new Date().toISOString();
    }
    localStorage.removeItem(k);
  }

  /* No borrar `notifications` aquí: la migra `NotificationContext` → `tb_inbox_*`. */

  return state;
}

export function loadNotificationState(
  storageKey: string,
  validProjectIds: Set<string>,
  now: Date = new Date()
): UserNotificationState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      return pruneNotificationState(normalizeState(parsed), validProjectIds, now);
    }
  } catch {
    /* fall through to migrate */
  }

  const migrated = migrateLegacyIntoState();
  const pruned = pruneNotificationState(migrated, validProjectIds, now);
  saveNotificationState(storageKey, pruned);
  return pruned;
}

export function saveNotificationState(storageKey: string, state: UserNotificationState): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (e) {
    console.error('notificationState: no se pudo guardar', e);
  }
}
