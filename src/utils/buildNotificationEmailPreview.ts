import { absoluteUrl } from '@/lib/publicSiteUrl';
import type { Allocation, Project } from '@/types';
import type {
  CoherenceOpStatus,
  NotificationIssueFlag,
  NotificationRule,
} from '@/types/notifications';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import {
  analyzeProjectMonthForNotifications,
  passesProjectClientFilters,
  projectMatchesIssueFlags,
  type AllocationRow,
  type ProjectIssueFlag,
  type ProjectRow,
} from '@/utils/projectNotificationMetrics';
import {
  coherenceDigestEmailHtml,
  coherenceSingleProjectEmailHtml,
  operationalStatusFromInconsistency,
  scheduledProjectAlertEmailHtml,
  statusLabelEs,
  taskTransferEmailHtml,
} from '@/utils/notificationEmailPreviewHtml';
import type { Inconsistency } from '@/utils/planningCoherenceCompute';
import { computeGlobalPlanningInconsistencies } from '@/utils/planningCoherenceCompute';

export interface NotificationPreviewInput {
  rule: NotificationRule;
  agencyId: string;
  agencyName: string;
  hoursTrackingPreference: 'actual' | 'computed' | null | undefined;
  allocations: Allocation[];
  projects: Project[];
  employees: Array<{ id: string; name: string; avatarUrl?: string }>;
}

export interface NotificationPreviewResult {
  html: string;
  subject: string;
  note?: string;
}

function utcMonthContext(): { viewMonth: Date; monthKey: string; monthProgress: number } {
  const now = new Date();
  const viewMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const monthProgress = Math.round((now.getUTCDate() / daysInMonth) * 100);
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return { viewMonth, monthKey, monthProgress };
}

function issueLabels(flags: NotificationIssueFlag[]): string[] {
  const labels: string[] = [];
  for (const f of flags) {
    switch (f) {
      case 'needs_planning':
        labels.push('Falta planificación (horas asignadas vs mínimo/presupuesto)');
        break;
      case 'behind_schedule':
        labels.push('Ritmo de ejecución por debajo del esperado para el mes');
        break;
      case 'over_budget':
        labels.push('Horas planificadas por encima del presupuesto mensual');
        break;
      case 'no_activity':
        labels.push('Sin horas planificadas pese a tener presupuesto');
        break;
    }
  }
  return labels;
}

function toHoursPref(p: NotificationPreviewInput['hoursTrackingPreference']): 'actual' | 'computed' {
  return p === 'actual' ? 'actual' : 'computed';
}

function mapAllocations(allocs: Allocation[]): AllocationRow[] {
  return allocs.map((a) => ({
    project_id: a.projectId,
    employee_id: a.employeeId,
    week_start_date: a.weekStartDate,
    hours_assigned: Number(a.hoursAssigned) || 0,
    status: a.status,
    hours_actual: a.hoursActual ?? null,
    hours_computed: a.hoursComputed ?? null,
  }));
}

function passesCoherenceThreshold(inc: Inconsistency, minAbs: number): boolean {
  if (Math.abs(inc.totalDifference) >= minAbs) return true;
  return inc.employees.some((e) => Math.abs(e.difference) >= minAbs);
}

function passesProjectClientFiltersCoherence(
  inc: Inconsistency,
  clientByProjectId: Map<string, string>,
  projectIds?: string[],
  clientIds?: string[],
): boolean {
  if (projectIds?.length && !projectIds.includes(inc.projectId)) return false;
  const cid = clientByProjectId.get(inc.projectId);
  if (clientIds?.length && (!cid || !clientIds.includes(cid))) return false;
  return true;
}

const DEFAULT_MATCH: NotificationIssueFlag[] = [
  'needs_planning',
  'behind_schedule',
  'over_budget',
  'no_activity',
];

const DEFAULT_COHERENCE_OPS: CoherenceOpStatus[] = [
  'over-budget',
  'behind-schedule',
  'needs-planning',
  'no-activity',
];

export async function buildNotificationEmailPreview(
  input: NotificationPreviewInput,
): Promise<NotificationPreviewResult> {
  const { rule, agencyName } = input;
  const hoursPref = toHoursPref(input.hoursTrackingPreference);

  if (rule.triggerType === 'task_transfer_pending') {
    const { html } = taskTransferEmailHtml({
      agencyName,
      fromName: 'Ana García',
      toName: 'Luis Pérez',
      projectName: 'Proyecto ejemplo (marca / cliente)',
      taskName: 'Tarea de ejemplo — revisión creativo',
      hours: '4',
      reason: 'Prioridad cambiada; necesito foco en otro cliente.',
      appUrl: absoluteUrl('/planner'),
    });
    return {
      html,
      subject: `Nueva solicitud de transferencia — ${agencyName}`,
      note: 'Datos de ejemplo: el correo real usará empleados, proyecto, tarea y horas de cada solicitud.',
    };
  }

  const { viewMonth, monthKey, monthProgress } = utcMonthContext();
  const evalMode = rule.conditions.evaluation ?? 'project_month_health';

  if (evalMode === 'deadline_coherence') {
    const { data: deadlines = [], error } = await fetchDeadlinesForMonth(monthKey, input.agencyId);
    if (error) {
      throw error;
    }

    const inconsistencies = computeGlobalPlanningInconsistencies({
      deadlines,
      allocations: input.allocations,
      projects: input.projects,
      employees: input.employees,
      viewDate: viewMonth,
      allowedEmployeeIds: null,
      selectedEmployeeId: 'all',
      selectedProjectId: 'all',
      hideProjectSearch: false,
      hoursTrackingPreference: input.hoursTrackingPreference ?? null,
    });

    const clientByProjectId = new Map(input.projects.map((p) => [p.id, p.clientId]));
    const minAbs = rule.conditions.coherence_min_abs_hours ?? 0.05;
    const opIn = (rule.conditions.coherence_op_status_in?.length
      ? rule.conditions.coherence_op_status_in
      : DEFAULT_COHERENCE_OPS) as CoherenceOpStatus[];

    const flagged: Array<{ inc: Inconsistency; opStatus: CoherenceOpStatus }> = [];
    for (const inc of inconsistencies) {
      if (
        !passesProjectClientFiltersCoherence(
          inc,
          clientByProjectId,
          rule.conditions.project_ids,
          rule.conditions.client_ids,
        )
      ) {
        continue;
      }
      if (!passesCoherenceThreshold(inc, minAbs)) continue;
      const opStatus = operationalStatusFromInconsistency(inc, monthProgress);
      if (!opIn.includes(opStatus)) continue;
      flagged.push({ inc, opStatus });
    }

    const appUrl = absoluteUrl('/operaciones');
    const delivery = rule.conditions.coherence_delivery_mode ?? 'per_project';
    const digestMax = rule.conditions.coherence_digest_max ?? 12;

    if (flagged.length === 0) {
      if (inconsistencies.length > 0) {
        const inc = inconsistencies[0];
        const opStatus = operationalStatusFromInconsistency(inc, monthProgress);
        const { html } = coherenceSingleProjectEmailHtml({
          agencyName,
          monthLabel: monthKey,
          inc,
          opStatus,
          appUrl,
        });
        return {
          html,
          subject: `${statusLabelEs(opStatus)}: ${inc.projectName} (${monthKey})`,
          note: 'Ningún proyecto cumple ahora los filtros de esta regla (umbral y estados). Vista de formato con el primer proyecto de la lista de coherencia del mes (UTC).',
        };
      }
      return {
        html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head><body style="margin:0;font-family:system-ui;padding:24px;background:#f1f5f9;color:#334155;">
<p>No hay datos de coherencia para <strong>${monthKey}</strong> (UTC) o no hay deadlines/asignaciones en proyectos activos.</p></body></html>`,
        subject: `Vista previa — coherencia (${monthKey})`,
        note: 'Sin proyectos que mostrar con los datos cargados.',
      };
    }

    if (delivery === 'digest') {
      const slice = flagged.slice(0, digestMax);
      const intro = `Resumen de ${slice.length} proyecto(s) con desviación respecto a deadlines / planificación (umbral ≥ ${minAbs}h).`;
      const { html } = coherenceDigestEmailHtml({
        agencyName,
        monthLabel: monthKey,
        intro,
        items: slice,
        appUrl,
      });
      return {
        html,
        subject: `Coherencia de planificación — ${slice.length} proyecto(s) · ${monthKey}`,
      };
    }

    const { inc, opStatus } = flagged[0];
    const { html } = coherenceSingleProjectEmailHtml({
      agencyName,
      monthLabel: monthKey,
      inc,
      opStatus,
      appUrl,
    });
    return {
      html,
      subject: `${statusLabelEs(opStatus)}: ${inc.projectName} (${monthKey})`,
      note:
        flagged.length > 1
          ? `Con los datos actuales habría ${flagged.length} correos (uno por proyecto); aquí ves el primero.`
          : undefined,
    };
  }

  const matchAny = (rule.conditions.match_any?.length ? rule.conditions.match_any : DEFAULT_MATCH) as NotificationIssueFlag[];
  const allocRows = mapAllocations(input.allocations);
  const activeProjects = input.projects.filter((p) => p.status === 'active');

  let firstMatch: {
    projectName: string;
    matched: NotificationIssueFlag[];
  } | null = null;

  for (const p of activeProjects) {
    const row: ProjectRow = {
      id: p.id,
      client_id: p.clientId,
      status: p.status,
      budget_hours: p.budgetHours,
      minimum_hours: p.minimumHours ?? null,
    };
    const analysis = analyzeProjectMonthForNotifications(row, allocRows, viewMonth, monthProgress, hoursPref);
    if (!analysis) continue;
    if (!passesProjectClientFilters(analysis, rule.conditions.project_ids, rule.conditions.client_ids)) continue;
    if (!projectMatchesIssueFlags(analysis, matchAny as ProjectIssueFlag[])) continue;
    const matchedFlags = matchAny.filter((f) => projectMatchesIssueFlags(analysis, [f as ProjectIssueFlag]));
    firstMatch = {
      projectName: p.name,
      matched: (matchedFlags.length ? matchedFlags : matchAny) as NotificationIssueFlag[],
    };
    break;
  }

  const appUrl = absoluteUrl('/projects');

  if (!firstMatch) {
    const { html } = scheduledProjectAlertEmailHtml({
      agencyName,
      projectName: 'Ejemplo — nombre del proyecto',
      issues: issueLabels(matchAny),
      monthLabel: monthKey,
      appUrl,
    });
    return {
      html,
      subject: `Alerta de proyecto: Ejemplo — nombre del proyecto (${monthKey})`,
      note: 'Ningún proyecto activo cumple ahora estas condiciones. Los textos reflejan las alertas que tienes marcadas. Mes de referencia: UTC (igual que el cron).',
    };
  }

  const { html } = scheduledProjectAlertEmailHtml({
    agencyName,
    projectName: firstMatch.projectName,
    issues: issueLabels(firstMatch.matched),
    monthLabel: monthKey,
    appUrl,
  });

  return {
    html,
    subject: `Alerta de proyecto: ${firstMatch.projectName} (${monthKey})`,
  };
}
