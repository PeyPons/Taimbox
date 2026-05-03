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

function fmtHours(h: number): string {
  return h % 1 === 0 ? String(h) : String(Math.round(h * 100) / 100);
}

function statusBadgeStyles(opStatus: CoherenceOpStatus): { bg: string; color: string; border: string } {
  switch (opStatus) {
    case "over-budget":
      return { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" };
    case "behind-schedule":
      return { bg: "#ffedd5", color: "#9a3412", border: "#fdba74" };
    case "needs-planning":
      return { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" };
    case "no-activity":
      return { bg: "#f1f5f9", color: "#334155", border: "#e2e8f0" };
    default:
      return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
  }
}

function renderProjectBlockCompact(
  inc: Inconsistency,
  opStatus: CoherenceOpStatus,
  monthLabel: string,
): string {
  const badge = statusBadgeStyles(opStatus);
  const isPositive = inc.totalDifference > 0;
  const cardBg = isPositive ? "#fffbeb" : "#eff6ff";
  const cardBorder = isPositive ? "#fde68a" : "#bfdbfe";
  const deltaColor = isPositive ? "#b45309" : "#1d4ed8";
  const deltaSign = isPositive ? "+" : "";

  const remainingToCompute = inc.budgetHours > 0
    ? Math.round(Math.max(0, inc.budgetHours - inc.totalComputedHours) * 100) / 100
    : null;

  const budgetLine = inc.budgetHours > 0 || inc.minimumHours > 0
    ? `<div style="margin-top:4px;font-size:10px;color:#64748b;line-height:1.4;">
        ${inc.budgetHours > 0 ? `Asignadas: <strong style="color:#334155;">${esc(fmtHours(inc.budgetHours))}h</strong>` : ""}
        ${inc.budgetHours > 0 && inc.minimumHours > 0 ? ' <span style="color:#cbd5e1">•</span> ' : ""}
        ${inc.minimumHours > 0 ? `Mínimo: <strong style="color:#334155;">${esc(fmtHours(inc.minimumHours))}h</strong>` : ""}
      </div>`
    : "";

  const noDeadlineBanner = inc.totalDeadlineHours === 0
    ? `<div style="margin-top:6px;padding:6px 8px;font-size:11px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;line-height:1.4;">
        Este proyecto no figura en el deadline del mes; la fila de abajo resume planificación y cómputo del equipo.
      </div>`
    : "";

  const mainLine = inc.totalDeadlineHours === 0
    ? `<div style="margin-top:6px;font-size:12px;color:#334155;line-height:1.65;flex-wrap:wrap;">
        <span style="color:#64748b;font-style:italic">Sin deadline</span>
        <span style="color:#cbd5e1;margin:0 4px;">→</span>
        <span style="color:#2563eb">Plan: <strong>${esc(fmtHours(inc.totalPlannedHours))}h</strong></span>
        <span style="color:#059669;margin-left:6px;">Comp: <strong>${esc(fmtHours(inc.totalComputedHours))}h</strong></span>
        ${
      remainingToCompute !== null
        ? `<span style="color:#cbd5e1;margin:0 4px;">→</span><span style="color:#64748b">Por computar</span> <span style="font-family:ui-monospace,monospace;font-weight:600;color:#2563eb;">${fmtHours(remainingToCompute)}h</span>`
        : ""
    }
        <span style="color:#cbd5e1;margin:0 4px;">→</span>
        <span style="color:#64748b">Plan+Comp:</span>
        <strong style="color:${deltaColor};margin-left:4px;">${deltaSign}${esc(fmtHours(inc.totalDifference))}h</strong>
      </div>`
    : `<div style="margin-top:6px;font-size:12px;color:#334155;line-height:1.65;">
        <span style="color:#64748b">Deadline:</span> <strong>${esc(fmtHours(inc.totalDeadlineHours))}h</strong>
        <span style="color:#cbd5e1;margin:0 4px;">→</span>
        <span style="color:#2563eb">Plan: <strong>${esc(fmtHours(inc.totalPlannedHours))}h</strong></span>
        <span style="color:#059669;margin-left:6px;">Comp: <strong>${esc(fmtHours(inc.totalComputedHours))}h</strong></span>
        ${
      remainingToCompute !== null
        ? `<span style="color:#cbd5e1;margin:0 4px;">→</span><span style="color:#64748b">Por computar</span> <span style="font-family:ui-monospace,monospace;font-weight:600;color:#2563eb;">${fmtHours(remainingToCompute)}h</span>`
        : ""
    }
        <span style="color:#cbd5e1;margin:0 4px;">→</span>
        <span style="color:#64748b">Vs deadline:</span>
        <strong style="color:${deltaColor};margin-left:4px;">${deltaSign}${esc(fmtHours(inc.totalDifference))}h</strong>
      </div>`;

  const employeesHtml = inc.employees.length
    ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid ${isPositive ? "#fcd34d" : "#93c5fd"};">
        <div style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:6px;">
          Empleados afectados (${inc.employees.length})
        </div>
        ${inc.employees.map((emp) => {
          const empPos = emp.difference > 0;
          const empDeltaColor = empPos ? "#d97706" : "#2563eb";
          const empSign = empPos ? "+" : "";
          const head = emp.hasDeadline
            ? `<span style="font-size:11px;color:#64748b;">Deadline: <strong style="color:#334155;">${fmtHours(emp.deadlineHours)}h</strong></span>`
            : `<span style="color:#d97706;font-style:italic;font-weight:600;margin-right:6px;">No incluido en deadline</span>`;
          return `<div style="font-size:12px;background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;margin-bottom:6px;">
            <div style="font-weight:600;color:#334155;margin-bottom:4px;">${esc(emp.employeeName)}</div>
            <div style="font-size:10px;line-height:1.55;color:#334155;">
              ${head}
              <span style="color:#2563eb">Plan: <strong>${esc(fmtHours(emp.plannedHours))}h</strong></span>
              <span style="color:#059669;margin-left:4px;">Comp: <strong>${esc(fmtHours(emp.computedHours))}h</strong></span>
              <span style="color:#cbd5e1;margin:0 4px;">→</span>
              <span style="color:#64748b">Vs DL:</span>
              <strong style="color:${empDeltaColor};margin-left:3px;">${empSign}${esc(fmtHours(emp.difference))}h</strong>
            </div>
          </div>`;
        }).join("")}
      </div>`
    : "";

  return `<div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:8px;padding:10px 12px;margin-bottom:10px;">
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:2px;">
      <span style="font-size:14px;font-weight:600;color:#1e293b;">${esc(inc.projectName)}</span>
      <span style="font-size:10px;padding:2px 8px;border-radius:999px;background:${badge.bg};color:${badge.color};border:1px solid ${badge.border};font-weight:600;">
        ${esc(statusLabelEs(opStatus))}
      </span>
    </div>
    <div style="font-size:11px;color:#94a3b8;">Mes ${esc(monthLabel)}</div>
    ${budgetLine}
    ${noDeadlineBanner}
    ${mainLine}
    ${employeesHtml}
  </div>`;
}

function compactEmailWrapper(params: {
  title: string;
  subtitle: string;
  intro: string;
  blocks: string;
  ctaUrl: string;
  ctaText: string;
}): string {
  const { title, subtitle, intro, blocks, ctaUrl, ctaText } = params;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:16px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;">
        <tr><td style="padding:14px 16px 10px;border-bottom:1px solid #f1f5f9;">
          <div style="font-size:16px;font-weight:700;color:#0f172a;">${esc(title)}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${esc(subtitle)}</div>
          <p style="margin:8px 0 0;font-size:13px;color:#475569;line-height:1.45;">${esc(intro)}</p>
        </td></tr>
        <tr><td style="padding:12px 16px 16px;">
          ${blocks}
        </td></tr>
        <tr><td style="padding:0 16px 16px;text-align:center;">
          <a href="${esc(ctaUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;">${esc(ctaText)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function coherenceDigestEmailHtml(params: {
  agencyName: string;
  monthLabel: string;
  intro: string;
  items: Array<{ inc: Inconsistency; opStatus: CoherenceOpStatus }>;
  appUrl: string;
}): { html: string; text: string } {
  const { agencyName, monthLabel, intro, items, appUrl } = params;
  const blocks = items
    .map(({ inc, opStatus }) => renderProjectBlockCompact(inc, opStatus, monthLabel))
    .join("\n");

  const text = [
    `${intro} — ${agencyName} (${monthLabel})`,
    "",
    ...items.map(({ inc, opStatus }) =>
      `${inc.projectName} [${statusLabelEs(opStatus)}] — Δ ${inc.totalDifference}h — ${appUrl}`
    ),
  ].join("\n");

  const html = compactEmailWrapper({
    title: "Coherencia de planificación",
    subtitle: `${agencyName} · ${monthLabel}`,
    intro,
    blocks,
    ctaUrl: appUrl,
    ctaText: "Abrir seguimiento operativo",
  });

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
