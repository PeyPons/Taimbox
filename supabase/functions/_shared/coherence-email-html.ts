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

function deltaStyle(isPositive: boolean): string {
  return isPositive ? "color:#dc2626;font-weight:700" : "color:#2563eb;font-weight:700";
}

function statusBadgeStyles(opStatus: CoherenceOpStatus): { bg: string; color: string; icon: string } {
  switch (opStatus) {
    case "over-budget":
      return { bg: "#fee2e2", color: "#991b1b", icon: "🔴" };
    case "behind-schedule":
      return { bg: "#ffedd5", color: "#9a3412", icon: "🟠" };
    case "needs-planning":
      return { bg: "#fef3c7", color: "#92400e", icon: "🟡" };
    case "no-activity":
      return { bg: "#f1f5f9", color: "#475569", icon: "⚪" };
    default:
      return { bg: "#ecfdf5", color: "#065f46", icon: "🟢" };
  }
}

function renderMetricRow(label: string, value: string, color: string, bold = false): string {
  return `<tr>
    <td style="padding:4px 12px 4px 0;font-size:12px;color:#64748b;white-space:nowrap;">${label}</td>
    <td style="padding:4px 0;font-size:13px;color:${color};${bold ? "font-weight:700;" : ""}font-family:'SF Mono',SFMono-Regular,Consolas,monospace;">${value}</td>
  </tr>`;
}

function renderProjectBlock(
  inc: Inconsistency,
  opStatus: CoherenceOpStatus,
  monthLabel: string,
): string {
  const badge = statusBadgeStyles(opStatus);
  const isPositive = inc.totalDifference > 0;
  const deltaColor = isPositive ? "#dc2626" : "#2563eb";
  const deltaSign = isPositive ? "+" : "";
  const borderLeftColor = isPositive ? "#f87171" : "#60a5fa";

  const budgetRow = inc.budgetHours > 0
    ? renderMetricRow("Presupuesto", `${fmtHours(inc.budgetHours)}h`, "#334155")
    : "";
  const minRow = inc.minimumHours > 0
    ? renderMetricRow("Mínimo", `${fmtHours(inc.minimumHours)}h`, "#334155")
    : "";

  const noDeadlineBanner = inc.totalDeadlineHours === 0
    ? `<tr><td colspan="2" style="padding:8px 0 2px;">
        <div style="padding:8px 12px;font-size:11px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;">
          ⚠️ Este proyecto no figura en el deadline del mes.
        </div>
      </td></tr>`
    : "";

  const remainingToCompute = inc.budgetHours > 0
    ? Math.round(Math.max(0, inc.budgetHours - inc.totalComputedHours) * 100) / 100
    : null;

  const metricsTable = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:12px;">
      ${inc.totalDeadlineHours > 0
        ? renderMetricRow("📋 Deadline", `${fmtHours(inc.totalDeadlineHours)}h`, "#334155", true)
        : ""}
      ${renderMetricRow("📐 Planificado", `${fmtHours(inc.totalPlannedHours)}h`, "#2563eb", true)}
      ${renderMetricRow("✅ Computado", `${fmtHours(inc.totalComputedHours)}h`, "#059669", true)}
      ${remainingToCompute !== null
        ? renderMetricRow("⏳ Por computar", `${fmtHours(remainingToCompute)}h`, "#64748b")
        : ""}
      ${budgetRow}
      ${minRow}
      ${noDeadlineBanner}
    </table>`;

  const deltaBlock = `
    <div style="margin-top:12px;padding:10px 14px;background:${isPositive ? "#fef2f2" : "#eff6ff"};border-radius:8px;border:1px solid ${isPositive ? "#fecaca" : "#bfdbfe"};">
      <span style="font-size:11px;color:#64748b;">Desviación total</span>
      <div style="font-size:20px;font-weight:700;color:${deltaColor};margin-top:2px;font-family:'SF Mono',SFMono-Regular,Consolas,monospace;">
        ${deltaSign}${fmtHours(inc.totalDifference)}h
      </div>
    </div>`;

  const employeesHtml = inc.employees.length
    ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid #e2e8f0;">
        <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
          👥 Empleados afectados (${inc.employees.length})
        </div>
        ${inc.employees.map((emp) => {
          const empPos = emp.difference > 0;
          const empDeltaColor = empPos ? "#dc2626" : "#2563eb";
          const empSign = empPos ? "+" : "";
          const deadlineInfo = emp.hasDeadline
            ? `<span style="font-size:11px;color:#64748b;">Deadline: <strong style="color:#334155;">${fmtHours(emp.deadlineHours)}h</strong></span>`
            : `<span style="font-size:10px;color:#d97706;font-weight:600;font-style:italic;">Sin deadline</span>`;
          return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:8px;">
            <div style="font-weight:600;font-size:13px;color:#1e293b;margin-bottom:8px;">${esc(emp.employeeName)}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size:11px;color:#64748b;padding:2px 0;">
                  ${deadlineInfo}
                </td>
                <td style="font-size:11px;text-align:right;padding:2px 0;" rowspan="2">
                  <div style="display:inline-block;padding:4px 10px;border-radius:6px;background:${empPos ? "#fef2f2" : "#eff6ff"};border:1px solid ${empPos ? "#fecaca" : "#bfdbfe"};">
                    <span style="font-size:14px;font-weight:700;color:${empDeltaColor};font-family:'SF Mono',SFMono-Regular,Consolas,monospace;">${empSign}${fmtHours(emp.difference)}h</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="font-size:11px;padding:2px 0;">
                  <span style="color:#2563eb;">Plan: <strong>${fmtHours(emp.plannedHours)}h</strong></span>
                  <span style="color:#cbd5e1;margin:0 4px;">·</span>
                  <span style="color:#059669;">Comp: <strong>${fmtHours(emp.computedHours)}h</strong></span>
                </td>
              </tr>
            </table>
          </div>`;
        }).join("")}
      </div>`
    : "";

  return `<div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.04);padding:20px;margin-bottom:16px;border-left:4px solid ${borderLeftColor};">
    <div style="margin-bottom:4px;">
      <span style="font-size:16px;font-weight:700;color:#0f172a;">${esc(inc.projectName)}</span>
      <span style="display:inline-block;font-size:10px;padding:3px 10px;border-radius:999px;background:${badge.bg};color:${badge.color};font-weight:600;margin-left:8px;vertical-align:middle;">
        ${badge.icon} ${esc(statusLabelEs(opStatus))}
      </span>
    </div>
    <div style="font-size:11px;color:#94a3b8;">Mes ${esc(monthLabel)}</div>
    ${metricsTable}
    ${deltaBlock}
    ${employeesHtml}
  </div>`;
}

function emailWrapper(params: {
  title: string;
  subtitle: string;
  intro: string;
  blocks: string;
  ctaUrl: string;
  ctaText: string;
}): string {
  const { title, subtitle, intro, blocks, ctaUrl, ctaText } = params;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;max-width:640px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:28px 40px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">📊 Taimbox</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Title -->
        <tr>
          <td style="padding:28px 32px 0;">
            <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#0f172a;">${esc(title)}</h1>
            <p style="margin:0 0 16px;font-size:13px;color:#64748b;">${esc(subtitle)}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">${esc(intro)}</p>
          </td>
        </tr>
        <!-- Content blocks -->
        <tr>
          <td style="padding:0 32px 16px;">
            ${blocks}
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding:8px 32px 28px;text-align:center;">
            <a href="${esc(ctaUrl)}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.2px;box-shadow:0 2px 8px rgba(79,70,229,0.3);">${esc(ctaText)}</a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
              © ${new Date().getFullYear()} Taimbox · Gestión inteligente de agencias<br/>
              Este email fue enviado automáticamente. No es necesario responder.
            </p>
          </td>
        </tr>
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
  const blocks = items.map(({ inc, opStatus }) => renderProjectBlock(inc, opStatus, monthLabel)).join("\n");

  const text = [
    `${intro} — ${agencyName} (${monthLabel})`,
    "",
    ...items.map(({ inc, opStatus }) =>
      `${inc.projectName} [${statusLabelEs(opStatus)}] — Δ ${inc.totalDifference}h — ${appUrl}`
    ),
 ].join("\n");

  const html = emailWrapper({
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
