function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  const {
    agencyName,
    fromName,
    toName,
    projectName,
    taskName,
    hours,
    reason,
    appUrl,
  } = params;
  const safe = {
    agencyName: escapeHtml(agencyName),
    fromName: escapeHtml(fromName),
    toName: escapeHtml(toName),
    projectName: escapeHtml(projectName),
    taskName: escapeHtml(taskName),
    hours: escapeHtml(hours),
    reason: reason ? escapeHtml(reason) : "",
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
    reason ? `Motivo: ${reason}` : "",
    ``,
    `Abre Taimbox para aceptar o rechazar: ${appUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

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
          ${reason ? `<p style="margin:12px 0;"><strong>Motivo:</strong> ${safe.reason}</p>` : ""}
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
  const listHtml = issues.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
  const text = [
    `Alerta de proyecto — ${agencyName}`,
    `Proyecto: ${projectName}`,
    `Mes: ${monthLabel}`,
    ...issues.map((i) => `• ${i}`),
    ``,
    appUrl,
  ].join("\n");

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
