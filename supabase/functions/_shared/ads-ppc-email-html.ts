import type { AdsPpcAlert } from "./ads-ppc-notification-metrics.ts";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function adsPpcStatusLabelEs(status: "over" | "risk"): string {
  return status === "over" ? "Presupuesto superado" : "En riesgo de superar presupuesto";
}

function platformLabel(platform: "google" | "meta"): string {
  return platform === "google" ? "Google Ads" : "Meta Ads";
}

function appUrlForPlatform(siteUrl: string, platform: "google" | "meta"): string {
  const base = siteUrl.replace(/\/$/, "");
  return platform === "google" ? `${base}/ads` : `${base}/meta-ads`;
}

function renderMetricsRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 0;font-size:13px;color:#64748b;">${escapeHtml(label)}</td>
    <td style="padding:4px 0;font-size:13px;color:#0f172a;font-weight:600;text-align:right;">${escapeHtml(value)}</td>
  </tr>`;
}

export function adsPpcSingleAccountEmailHtml(params: {
  agencyName: string;
  alert: AdsPpcAlert;
  appUrl: string;
}): { html: string; text: string } {
  const { agencyName, alert, appUrl } = params;
  const statusLabel = adsPpcStatusLabelEs(alert.status);
  const plat = platformLabel(alert.platform);
  const pctSpent = alert.budget > 0 ? Math.round((alert.spent / alert.budget) * 100) : 0;
  const pctForecast = alert.budget > 0 ? Math.round((alert.forecast / alert.budget) * 100) : 0;

  const text = [
    `Alerta PPC — ${agencyName}`,
    `${plat}: ${alert.displayName}`,
    `Estado: ${statusLabel}`,
    `Mes: ${alert.monthKey}`,
    `Gastado: ${fmtMoney(alert.spent)} (${pctSpent}% del presupuesto)`,
    `Presupuesto: ${fmtMoney(alert.budget)}`,
    `Previsión fin de mes: ${fmtMoney(alert.forecast)} (${pctForecast}%)`,
    "",
    appUrl,
  ].join("\n");

  const badgeBg = alert.status === "over" ? "#fee2e2" : "#ffedd5";
  const badgeColor = alert.status === "over" ? "#991b1b" : "#9a3412";

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;max-width:560px;width:100%;border:1px solid #e2e8f0;">
        <tr><td style="padding:28px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#64748b;text-transform:uppercase;">${escapeHtml(agencyName)} · ${escapeHtml(alert.monthKey)}</p>
          <h1 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Alerta de presupuesto PPC</h1>
          <p style="margin:0 0 16px;font-size:14px;color:#475569;">
            <strong>${escapeHtml(plat)}</strong> — ${escapeHtml(alert.displayName)}
          </p>
          <span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;background:${badgeBg};color:${badgeColor};">${escapeHtml(statusLabel)}</span>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
            ${renderMetricsRow("Gastado", `${fmtMoney(alert.spent)} (${pctSpent}%)`)}
            ${renderMetricsRow("Presupuesto mensual", fmtMoney(alert.budget))}
            ${renderMetricsRow("Previsión fin de mes", `${fmtMoney(alert.forecast)} (${pctForecast}%)`)}
          </table>
          <p style="margin:24px 0 0;"><a href="${escapeHtml(appUrl)}" style="color:#4f46e5;font-weight:600;">Ver en Taimbox</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { html, text };
}

export function adsPpcDigestEmailHtml(params: {
  agencyName: string;
  monthLabel: string;
  alerts: AdsPpcAlert[];
  siteUrl: string;
}): { html: string; text: string } {
  const { agencyName, monthLabel, alerts, siteUrl } = params;
  const rowsHtml = alerts.map((a) => {
    const statusLabel = adsPpcStatusLabelEs(a.status);
    const plat = platformLabel(a.platform);
    const url = appUrlForPlatform(siteUrl, a.platform);
    const pct = a.budget > 0 ? Math.round((a.spent / a.budget) * 100) : 0;
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">
        <strong>${escapeHtml(a.displayName)}</strong><br/>
        <span style="color:#64748b;">${escapeHtml(plat)} · ${escapeHtml(statusLabel)}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;color:#0f172a;">
        ${escapeHtml(fmtMoney(a.spent))} / ${escapeHtml(fmtMoney(a.budget))}<br/>
        <span style="color:#64748b;">${pct}%</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;">
        <a href="${escapeHtml(url)}" style="color:#4f46e5;">Abrir</a>
      </td>
    </tr>`;
  }).join("");

  const textLines = [
    `Resumen PPC — ${agencyName}`,
    `Mes: ${monthLabel}`,
    `${alerts.length} cuenta(s) en alerta:`,
    "",
  ];
  for (const a of alerts) {
    textLines.push(
      `· ${platformLabel(a.platform)} — ${a.displayName}: ${adsPpcStatusLabelEs(a.status)} (${fmtMoney(a.spent)} / ${fmtMoney(a.budget)})`,
    );
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;max-width:600px;width:100%;border:1px solid #e2e8f0;">
        <tr><td style="padding:28px 28px 16px;">
          <h1 style="margin:0 0 8px;font-size:18px;color:#0f172a;">Resumen de alertas PPC</h1>
          <p style="margin:0;font-size:14px;color:#64748b;">${escapeHtml(agencyName)} · ${escapeHtml(monthLabel)}</p>
        </td></tr>
        <tr><td style="padding:0 16px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Cuenta</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;">Gasto / presup.</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;">&nbsp;</th>
            </tr>
            ${rowsHtml}
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { html, text: textLines.join("\n") };
}
