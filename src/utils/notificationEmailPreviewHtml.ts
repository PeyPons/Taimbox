/**
 * Plantillas HTML de notificaciones para vista previa en el cliente.
 * Mantener alineado con `supabase/functions/_shared/notification-email-templates.ts`
 * y `supabase/functions/_shared/coherence-email-html.ts` + `coherence-operational-status.ts`.
 */

import type { Inconsistency } from '@/utils/planningCoherenceCompute';

export type CoherenceOpStatus =
  | 'over-budget'
  | 'behind-schedule'
  | 'needs-planning'
  | 'no-activity'
  | 'in-rule';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function operationalStatusFromInconsistency(
  inc: Inconsistency,
  monthProgress: number,
): CoherenceOpStatus {
  const effectiveUsage = round2(inc.totalPlannedHours + inc.totalComputedHours);
  const budget = inc.budgetHours;
  const planned = inc.totalPlannedHours;
  const computed = inc.totalComputedHours;

  const deadlineExcess = inc.totalDeadlineHours > 0 && inc.totalDifference > 0.05;
  const effectiveOverBudget = budget > 0 && round2(effectiveUsage) > round2(budget);
  if (deadlineExcess || effectiveOverBudget) return 'over-budget';

  if (budget > 0 && monthProgress > 30) {
    const executionPct = effectiveUsage > 0 ? (computed / effectiveUsage) * 100 : 0;
    if (executionPct < monthProgress - 20) return 'behind-schedule';
  }

  if (budget > 0 && planned === 0 && computed === 0) return 'no-activity';

  const shortOfBudget = budget > 0 && effectiveUsage < round2(budget);
  if (shortOfBudget) return 'needs-planning';

  return 'in-rule';
}

export function statusLabelEs(status: CoherenceOpStatus): string {
  switch (status) {
    case 'over-budget':
      return 'Exceso horas';
    case 'behind-schedule':
      return 'Retrasados';
    case 'needs-planning':
      return 'Falta planificar';
    case 'no-activity':
      return 'Sin actividad';
    default:
      return 'En regla';
  }
}

export function taskTransferEmailHtml(params: {
  agencyName: string;
  fromName: string;
  toName: string;
  projectName: string;
  taskName: string;
  hours: string;
  reason?: string | null;
  appUrl: string;
}): { html: string; text: string } {
  const { agencyName, fromName, toName, projectName, taskName, hours, reason, appUrl } = params;
  const safe = {
    agencyName: escapeHtml(agencyName),
    fromName: escapeHtml(fromName),
    toName: escapeHtml(toName),
    projectName: escapeHtml(projectName),
    taskName: escapeHtml(taskName),
    hours: escapeHtml(hours),
    reason: reason ? escapeHtml(reason) : '',
    appUrl: escapeHtml(appUrl),
  };

  const text = [
    `Nueva solicitud de transferencia de tarea — ${agencyName}`,
    ``,
    `De: ${fromName}`,
    `Para: ${toName}`,
    `Proyecto: ${projectName}`,
    `Tarea: ${taskName}`,
    `Horas: ${hours}`,
    reason ? `Motivo: ${reason}` : '',
    ``,
    `Abre Taimbox para aceptar o rechazar: ${appUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><title>Transferencia de tarea</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;max-width:560px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:24px 28px;text-align:center;">
          <span style="font-size:20px;font-weight:700;color:#fff;">Taimbox</span>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;">
          <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Nueva solicitud de transferencia</h1>
          <p style="margin:0;color:#64748b;font-size:14px;">${safe.agencyName}</p>
        </td></tr>
        <tr><td style="padding:8px 28px 28px;font-size:15px;color:#334155;line-height:1.6;">
          <p style="margin:12px 0;"><strong>De:</strong> ${safe.fromName}</p>
          <p style="margin:12px 0;"><strong>Para:</strong> ${safe.toName}</p>
          <p style="margin:12px 0;"><strong>Proyecto:</strong> ${safe.projectName}</p>
          <p style="margin:12px 0;"><strong>Tarea:</strong> ${safe.taskName}</p>
          <p style="margin:12px 0;"><strong>Horas:</strong> ${safe.hours}</p>
          ${reason ? `<p style="margin:12px 0;"><strong>Motivo:</strong> ${safe.reason}</p>` : ''}
          <p style="margin:24px 0 0;">
            <a href="${safe.appUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Abrir planificador</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { html, text };
}

export function scheduledProjectAlertEmailHtml(params: {
  agencyName: string;
  projectName: string;
  issues: string[];
  monthLabel: string;
  appUrl: string;
}): { html: string; text: string } {
  const { agencyName, projectName, issues, monthLabel, appUrl } = params;
  const safeAgency = escapeHtml(agencyName);
  const safeProject = escapeHtml(projectName);
  const safeMonth = escapeHtml(monthLabel);
  const safeUrl = escapeHtml(appUrl);
  const listHtml = issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('');
  const text = [
    `Alerta de proyecto — ${agencyName}`,
    `Proyecto: ${projectName}`,
    `Mes: ${monthLabel}`,
    ...issues.map((i) => `• ${i}`),
    ``,
    appUrl,
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;max-width:560px;width:100%;">
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 8px;font-size:18px;color:#0f172a;">Alerta de proyecto</h1>
          <p style="margin:0 0 16px;color:#64748b;font-size:14px;">${safeAgency} · ${safeMonth}</p>
          <p style="margin:0 0 12px;font-size:16px;color:#334155;"><strong>${safeProject}</strong></p>
          <ul style="margin:0;padding-left:20px;color:#334155;">${listHtml}</ul>
          <p style="margin:24px 0 0;"><a href="${safeUrl}" style="color:#4f46e5;">Ver en Taimbox</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { html, text };
}

function hoursToComputeHtml(budget: number, computed: number): string {
  if (budget <= 0) return '';
  const v = Math.round(Math.max(0, budget - computed) * 100) / 100;
  return `<span style="color:#64748b">Por computar:</span> <strong style="font-family:monospace">${escapeHtml(String(v))}h</strong>`;
}

function deltaStyle(isPositive: boolean): string {
  return isPositive ? 'color:#c2410c;font-weight:700' : 'color:#1d4ed8;font-weight:700';
}

function renderProjectBlock(inc: Inconsistency, opStatus: CoherenceOpStatus, monthLabel: string): string {
  const badgeBg =
    opStatus === 'over-budget'
      ? '#fee2e2'
      : opStatus === 'behind-schedule'
        ? '#ffedd5'
        : opStatus === 'needs-planning'
          ? '#fef3c7'
          : opStatus === 'no-activity'
            ? '#f1f5f9'
            : '#ecfdf5';
  const badgeColor =
    opStatus === 'over-budget'
      ? '#991b1b'
      : opStatus === 'behind-schedule'
        ? '#c2410c'
        : opStatus === 'needs-planning'
          ? '#b45309'
          : opStatus === 'no-activity'
            ? '#475569'
            : '#047857';

  const isPositive = inc.totalDifference > 0;
  const cardBg = isPositive ? '#fffbeb' : '#eff6ff';
  const border = isPositive ? '#fde68a' : '#bfdbfe';

  const budgetMin =
    inc.budgetHours > 0 || inc.minimumHours > 0
      ? `<div style="font-size:11px;color:#64748b;margin-top:6px;">${
          inc.budgetHours > 0 ? `Asignadas: <strong>${escapeHtml(String(inc.budgetHours))}h</strong>` : ''
        }${inc.budgetHours > 0 && inc.minimumHours > 0 ? ' • ' : ''}${
          inc.minimumHours > 0 ? `Mínimo: <strong>${escapeHtml(String(inc.minimumHours))}h</strong>` : ''
        }</div>`
      : '';

  const noDeadlineBanner = inc.totalDeadlineHours === 0
    ? `<div style="margin-top:8px;padding:8px 10px;font-size:11px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;">
        Este proyecto no figura en el deadline del mes; los totales son planificación + computado del equipo.
      </div>`
    : '';

  const mainRow =
    inc.totalDeadlineHours === 0
      ? `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;margin-top:8px;color:#334155;">
        <span style="color:#64748b;font-style:italic">Sin deadline</span>
        <span style="color:#cbd5e1">→</span>
        <span style="color:#2563eb">Plan: <strong>${escapeHtml(String(inc.totalPlannedHours))}h</strong></span>
        <span style="color:#059669">Comp: <strong>${escapeHtml(String(inc.totalComputedHours))}h</strong></span>
        <span style="color:#cbd5e1">→</span>
        ${hoursToComputeHtml(inc.budgetHours, inc.totalComputedHours)}
        <span style="color:#cbd5e1">→</span>
        <span style="${deltaStyle(isPositive)}">${isPositive ? '+' : ''}${escapeHtml(String(inc.totalDifference))}h</span>
      </div>`
      : `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;margin-top:8px;color:#334155;">
        <span><span style="color:#64748b">Deadline:</span> <strong>${escapeHtml(String(inc.totalDeadlineHours))}h</strong></span>
        <span style="color:#cbd5e1">→</span>
        <span style="color:#2563eb">Plan: <strong>${escapeHtml(String(inc.totalPlannedHours))}h</strong></span>
        <span style="color:#059669">Comp: <strong>${escapeHtml(String(inc.totalComputedHours))}h</strong></span>
        <span style="color:#cbd5e1">→</span>
        ${hoursToComputeHtml(inc.budgetHours, inc.totalComputedHours)}
        <span style="color:#cbd5e1">→</span>
        <span style="${deltaStyle(isPositive)}">${isPositive ? '+' : ''}${escapeHtml(String(inc.totalDifference))}h</span>
      </div>`;

  const employeesHtml = inc.employees.length
    ? `<div style="margin-top:14px;padding-top:12px;border-top:1px solid #fcd34d;">
        <div style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:8px;">
          Empleados afectados (${inc.employees.length})
        </div>
        ${inc.employees
          .map((emp) => {
            const empPos = emp.difference > 0;
            const dl = emp.hasDeadline
              ? `<span style="color:#64748b">Deadline: <strong>${escapeHtml(String(emp.deadlineHours))}h</strong></span><span style="color:#cbd5e1"> → </span>`
              : `<span style="color:#d97706;font-weight:600;font-style:italic">No incluido en deadline</span><span style="color:#cbd5e1"> · </span>`;
            return `<div style="font-size:12px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:10px;margin-bottom:8px;">
            <div style="font-weight:600;color:#334155;margin-bottom:6px;">${escapeHtml(emp.employeeName)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:11px;">
              ${dl}
              <span style="color:#2563eb">Plan: <strong>${escapeHtml(String(emp.plannedHours))}h</strong></span>
              <span style="color:#059669">Comp: <strong>${escapeHtml(String(emp.computedHours))}h</strong></span>
              <span style="color:#cbd5e1">→</span>
              <span style="${deltaStyle(empPos)}">${empPos ? '+' : ''}${escapeHtml(String(emp.difference))}h</span>
            </div>
          </div>`;
          })
          .join('')}
      </div>`
    : '';

  return `<div style="background:${cardBg};border:1px solid ${border};border-radius:10px;padding:14px 16px;margin-bottom:16px;">
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:4px;">
      <span style="font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(inc.projectName)}</span>
      <span style="font-size:10px;padding:3px 8px;border-radius:999px;background:${badgeBg};color:${badgeColor};font-weight:600;">
        ${escapeHtml(statusLabelEs(opStatus))}
      </span>
    </div>
    <div style="font-size:11px;color:#94a3b8;">Mes ${escapeHtml(monthLabel)}</div>
    ${budgetMin}
    ${noDeadlineBanner}
    ${mainRow}
    ${employeesHtml}
  </div>`;
}

export function coherenceDigestEmailHtml(params: {
  agencyName: string;
  monthLabel: string;
  intro: string;
  items: Array<{ inc: Inconsistency; opStatus: CoherenceOpStatus }>;
  appUrl: string;
}): { html: string; text: string } {
  const { agencyName, monthLabel, intro, items, appUrl } = params;
  const blocks = items.map(({ inc, opStatus }) => renderProjectBlock(inc, opStatus, monthLabel)).join('\n');

  const text = [
    `${intro} — ${agencyName} (${monthLabel})`,
    '',
    ...items.map(
      ({ inc, opStatus }) => `${inc.projectName} [${statusLabelEs(opStatus)}] — Δ ${inc.totalDifference}h — ${appUrl}`,
    ),
  ].join('\n');

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">
        <tr><td style="padding-bottom:12px;">
          <div style="font-size:18px;font-weight:700;color:#0f172a;">Coherencia de planificación</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">${escapeHtml(agencyName)} · ${escapeHtml(monthLabel)}</div>
          <p style="font-size:14px;color:#334155;margin:12px 0 0;line-height:1.5;">${escapeHtml(intro)}</p>
        </td></tr>
        <tr><td>${blocks}</td></tr>
        <tr><td style="padding-top:8px;text-align:center;">
          <a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Abrir seguimiento operativo</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { html, text };
}

export function coherenceSingleProjectEmailHtml(params: {
  agencyName: string;
  monthLabel: string;
  inc: Inconsistency;
  opStatus: CoherenceOpStatus;
  appUrl: string;
}): { html: string; text: string } {
  const intro = 'Detalle de desviación entre deadline y planificación del equipo (misma vista que en Taimbox).';
  return coherenceDigestEmailHtml({
    agencyName: params.agencyName,
    monthLabel: params.monthLabel,
    intro,
    items: [{ inc: params.inc, opStatus: params.opStatus }],
    appUrl: params.appUrl,
  });
}
