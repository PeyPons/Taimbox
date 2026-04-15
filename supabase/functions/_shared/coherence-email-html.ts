import type { Inconsistency } from "./planning-coherence-compute.ts";
import type { CoherenceOpStatus } from "./coherence-operational-status.ts";
import { statusLabelEs } from "./coherence-operational-status.ts";

function esc(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hoursToComputeHtml(budget: number, computed: number): string {
  if (budget <= 0) return "";
  const v = Math.round(Math.max(0, budget - computed) * 100) / 100;
  return `<span style="color:#64748b">Por computar:</span> <strong style="font-family:monospace">${esc(String(v))}h</strong>`;
}

function deltaStyle(isPositive: boolean): string {
  return isPositive ? "color:#c2410c;font-weight:700" : "color:#1d4ed8;font-weight:700";
}

function renderProjectBlock(
  inc: Inconsistency,
  opStatus: CoherenceOpStatus,
  monthLabel: string,
): string {
  const badgeBg =
    opStatus === "over-budget"
      ? "#fee2e2"
      : opStatus === "behind-schedule"
        ? "#ffedd5"
        : opStatus === "needs-planning"
          ? "#fef3c7"
          : opStatus === "no-activity"
            ? "#f1f5f9"
            : "#ecfdf5";
  const badgeColor =
    opStatus === "over-budget"
      ? "#991b1b"
      : opStatus === "behind-schedule"
        ? "#c2410c"
        : opStatus === "needs-planning"
          ? "#b45309"
          : opStatus === "no-activity"
            ? "#475569"
            : "#047857";

  const isPositive = inc.totalDifference > 0;
  const cardBg = isPositive ? "#fffbeb" : "#eff6ff";
  const border = isPositive ? "#fde68a" : "#bfdbfe";

  const budgetMin =
    (inc.budgetHours > 0 || inc.minimumHours > 0)
      ? `<div style="font-size:11px;color:#64748b;margin-top:6px;">${
        inc.budgetHours > 0
          ? `Asignadas: <strong>${esc(String(inc.budgetHours))}h</strong>`
          : ""
      }${
        inc.budgetHours > 0 && inc.minimumHours > 0 ? " • " : ""
      }${
        inc.minimumHours > 0 ? `Mínimo: <strong>${esc(String(inc.minimumHours))}h</strong>` : ""
      }</div>`
      : "";

  const noDeadlineBanner = inc.totalDeadlineHours === 0
    ? `<div style="margin-top:8px;padding:8px 10px;font-size:11px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;">
        Este proyecto no figura en el deadline del mes; los totales son planificación + computado del equipo.
      </div>`
    : "";

  const mainRow = inc.totalDeadlineHours === 0
    ? `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;margin-top:8px;color:#334155;">
        <span style="color:#64748b;font-style:italic">Sin deadline</span>
        <span style="color:#cbd5e1">→</span>
        <span style="color:#2563eb">Plan: <strong>${esc(String(inc.totalPlannedHours))}h</strong></span>
        <span style="color:#059669">Comp: <strong>${esc(String(inc.totalComputedHours))}h</strong></span>
        <span style="color:#cbd5e1">→</span>
        ${hoursToComputeHtml(inc.budgetHours, inc.totalComputedHours)}
        <span style="color:#cbd5e1">→</span>
        <span style="${deltaStyle(isPositive)}">${isPositive ? "+" : ""}${esc(String(inc.totalDifference))}h</span>
      </div>`
    : `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;margin-top:8px;color:#334155;">
        <span><span style="color:#64748b">Deadline:</span> <strong>${esc(String(inc.totalDeadlineHours))}h</strong></span>
        <span style="color:#cbd5e1">→</span>
        <span style="color:#2563eb">Plan: <strong>${esc(String(inc.totalPlannedHours))}h</strong></span>
        <span style="color:#059669">Comp: <strong>${esc(String(inc.totalComputedHours))}h</strong></span>
        <span style="color:#cbd5e1">→</span>
        ${hoursToComputeHtml(inc.budgetHours, inc.totalComputedHours)}
        <span style="color:#cbd5e1">→</span>
        <span style="${deltaStyle(isPositive)}">${isPositive ? "+" : ""}${esc(String(inc.totalDifference))}h</span>
      </div>`;

  const employeesHtml = inc.employees.length
    ? `<div style="margin-top:14px;padding-top:12px;border-top:1px solid #fcd34d;">
        <div style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:8px;">
          Empleados afectados (${inc.employees.length})
        </div>
        ${inc.employees.map((emp) => {
          const empPos = emp.difference > 0;
          const dl = emp.hasDeadline
            ? `<span style="color:#64748b">Deadline: <strong>${esc(String(emp.deadlineHours))}h</strong></span><span style="color:#cbd5e1"> → </span>`
            : `<span style="color:#d97706;font-weight:600;font-style:italic">No incluido en deadline</span><span style="color:#cbd5e1"> · </span>`;
          return `<div style="font-size:12px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:10px;margin-bottom:8px;">
            <div style="font-weight:600;color:#334155;margin-bottom:6px;">${esc(emp.employeeName)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:11px;">
              ${dl}
              <span style="color:#2563eb">Plan: <strong>${esc(String(emp.plannedHours))}h</strong></span>
              <span style="color:#059669">Comp: <strong>${esc(String(emp.computedHours))}h</strong></span>
              <span style="color:#cbd5e1">→</span>
              <span style="${deltaStyle(empPos)}">${empPos ? "+" : ""}${esc(String(emp.difference))}h</span>
            </div>
          </div>`;
        }).join("")}
      </div>`
    : "";

  return `<div style="background:${cardBg};border:1px solid ${border};border-radius:10px;padding:14px 16px;margin-bottom:16px;">
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:4px;">
      <span style="font-size:15px;font-weight:700;color:#0f172a;">${esc(inc.projectName)}</span>
      <span style="font-size:10px;padding:3px 8px;border-radius:999px;background:${badgeBg};color:${badgeColor};font-weight:600;">
        ${esc(statusLabelEs(opStatus))}
      </span>
    </div>
    <div style="font-size:11px;color:#94a3b8;">Mes ${esc(monthLabel)}</div>
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
  const blocks = items.map(({ inc, opStatus }) => renderProjectBlock(inc, opStatus, monthLabel)).join("\n");

  const text = [
    `${intro} — ${agencyName} (${monthLabel})`,
    "",
    ...items.map(({ inc, opStatus }) =>
      `${inc.projectName} [${statusLabelEs(opStatus)}] — Δ ${inc.totalDifference}h — ${appUrl}`
    ),
 ].join("\n");

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">
        <tr><td style="padding-bottom:12px;">
          <div style="font-size:18px;font-weight:700;color:#0f172a;">Coherencia de planificación</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">${esc(agencyName)} · ${esc(monthLabel)}</div>
          <p style="font-size:14px;color:#334155;margin:12px 0 0;line-height:1.5;">${esc(intro)}</p>
        </td></tr>
        <tr><td>${blocks}</td></tr>
        <tr><td style="padding-top:8px;text-align:center;">
          <a href="${esc(appUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Abrir seguimiento operativo</a>
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
  const intro = "Detalle de desviación entre deadline y planificación del equipo (misma vista que en Taimbox).";
  return coherenceDigestEmailHtml({
    agencyName: params.agencyName,
    monthLabel: params.monthLabel,
    intro,
    items: [{ inc: params.inc, opStatus: params.opStatus }],
    appUrl: params.appUrl,
  });
}
