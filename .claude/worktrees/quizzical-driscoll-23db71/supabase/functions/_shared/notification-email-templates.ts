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
  const listHtml = issues.map((i) => `
    <tr>
      <td style="padding:8px 12px;font-size:14px;color:#334155;line-height:1.5;border-bottom:1px solid #f1f5f9;">
        <span style="color:#f59e0b;margin-right:8px;">⚠️</span> ${escapeHtml(i)}
      </td>
    </tr>`).join("");
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
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:28px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">🔔 Taimbox</span>
          </td>
        </tr>
        <!-- Title -->
        <tr>
          <td style="padding:28px 32px 0;">
            <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#0f172a;">Alerta de proyecto</h1>
            <p style="margin:0 0 20px;font-size:13px;color:#64748b;">${safeAgency} · ${safeMonth}</p>
          </td>
        </tr>
        <!-- Project name -->
        <tr>
          <td style="padding:0 32px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;border-left:4px solid #f59e0b;">
              <div style="font-size:17px;font-weight:700;color:#0f172a;margin-bottom:4px;">${safeProject}</div>
              <div style="font-size:11px;color:#94a3b8;">${safeMonth}</div>
            </div>
          </td>
        </tr>
        <!-- Issues -->
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Incidencias detectadas</div>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;overflow:hidden;">
              ${listHtml}
            </table>
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding:24px 32px 28px;text-align:center;">
            <a href="${safeUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.2px;box-shadow:0 2px 8px rgba(79,70,229,0.3);">Ver en Taimbox</a>
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
</body>
</html>`;

  return { html, text };
}

/** Misma base que en `EmployeeSettings` / `EmployeeDialog` (fun-emoji 9.x). */
const DICEBEAR_FUN_EMOJI_BASE = "https://api.dicebear.com/9.x/fun-emoji/svg";

/**
 * URL de avatar para el HTML del correo: usa `avatar_url` si es http(s), si no genera Dicebear con el nombre.
 */
export function employeeAvatarUrlForEmail(
  avatarUrl: string | null | undefined,
  displayName: string,
): string {
  const u = (avatarUrl ?? "").trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const seed = (displayName ?? "").trim() || "user";
  return `${DICEBEAR_FUN_EMOJI_BASE}?seed=${encodeURIComponent(seed)}`;
}

export type DependencyUnblockUnblockedTaskRow = {
  taskName: string;
  projectName: string;
  clientName: string | null;
};

export function dependencyUnblockEmailHtml(params: {
  agencyName: string;
  /** Primer nombre (o palabra) para el saludo. */
  recipientFirstName: string;
  /** Nombre completo del destinatario (p. ej. alt de imagen). */
  assigneeName: string;
  closerName: string;
  closerAvatarUrl: string;
  assigneeAvatarUrl: string;
  blockingTaskName: string;
  blockingProjectName: string;
  blockingClientName?: string | null;
  unblockedTasks: DependencyUnblockUnblockedTaskRow[];
}): { html: string; text: string } {
  const {
    agencyName,
    recipientFirstName,
    assigneeName,
    closerName,
    closerAvatarUrl,
    assigneeAvatarUrl,
    blockingTaskName,
    blockingProjectName,
    blockingClientName,
    unblockedTasks,
  } = params;

  const safeAgency = escapeHtml(agencyName);
  const safeFirst = escapeHtml(recipientFirstName.trim() || "equipo");
  const safeAssignee = escapeHtml(
    assigneeName.trim() || recipientFirstName.trim() || "equipo",
  );
  const safeCloser = escapeHtml(closerName);
  const safeBlockingTask = escapeHtml(blockingTaskName);
  const safeBlockingProject = escapeHtml(blockingProjectName);
  const safeCloserImg = escapeHtml(closerAvatarUrl);
  const safeAssigneeImg = escapeHtml(assigneeAvatarUrl);

  const plural = unblockedTasks.length > 1;
  const titleTask = plural ? "tus tareas ya están desbloqueadas" : "tu tarea ya está desbloqueada";
  const leadTask = plural
    ? "Se cerraron los pasos previos que mantenían tu planificación en espera y ya puedes comenzar con tus tareas."
    : "Se cerró el paso previo que mantenía tu planificación en espera y ya puedes comenzar con tu tarea.";

  const projectClientLine =
    blockingClientName && blockingClientName.trim()
      ? `${safeBlockingProject} <span style="font-weight:400;color:#64748b;">· ${escapeHtml(blockingClientName.trim())}</span>`
      : safeBlockingProject;

  const tasksLabel =
    unblockedTasks.length > 1
      ? "Ya puedes comenzar con tus tareas"
      : "Ya puedes comenzar";

  const tasksBodyHtml = unblockedTasks
    .map((t, idx) => {
      const safeTask = escapeHtml(t.taskName);
      const clientBit =
        t.clientName && t.clientName.trim()
          ? ` <span style="font-weight:400;color:#64748b;">· ${escapeHtml(t.clientName.trim())}</span>`
          : "";
      const projectLine =
        unblockedTasks.length > 1
          ? `<p style="margin:${idx === 0 ? "0" : "10px"} 0 0;font-size:11px;color:#64748b;line-height:1.45;">
              <span style="font-weight:700;color:#475569;">Proyecto:</span>
              ${escapeHtml(t.projectName)}${clientBit}
            </p>`
          : "";
      return `<p style="margin:${idx === 0 ? "0" : "10px"} 0 0;font-size:14px;font-weight:600;color:#0f172a;line-height:1.45;">${safeTask}</p>${projectLine}`;
    })
    .join("");

  const textBlockingClient =
    blockingClientName && blockingClientName.trim()
      ? `Cliente: ${blockingClientName.trim()}`
      : null;
  const textLines: string[] = [
    `Hola ${recipientFirstName.trim() || "equipo"}, ${plural ? "tus tareas ya pueden avanzar" : "tu tarea ya puede avanzar"} — ${agencyName}`,
    ``,
    plural
      ? `Se cerraron pasos previos y tu planificación deja de estar en espera.`
      : `Se cerró un paso previo y tu planificación deja de estar en espera.`,
    ``,
    `Proyecto (tarea completada): ${blockingProjectName}`,
    ...(textBlockingClient ? [textBlockingClient] : []),
    `Tarea completada: ${blockingTaskName}`,
    `Completada por: ${closerName}`,
    ``,
    `${tasksLabel} —`,
  ];
  for (const t of unblockedTasks) {
    textLines.push(`· ${t.taskName}`);
    textLines.push(`  ${t.projectName}${t.clientName ? ` · ${t.clientName}` : ""}`);
  }
  textLines.push("", "Taimbox · notificación automática de seguimiento operativo.");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Dependencia resuelta</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;">${safeAgency}</p>
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;font-weight:700;letter-spacing:-0.02em;">
                Hola ${safeFirst}, ${escapeHtml(titleTask)}
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
                El flujo operativo ha avanzado. ${escapeHtml(leadTask)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;">Proyecto afectado</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;line-height:1.45;">
                      ${projectClientLine}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="40" valign="top" style="padding-right:16px;">
                    <img src="${safeCloserImg}" alt="${safeCloser}" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:50%;border:1px solid #cbd5e1;background:#fff;" />
                  </td>
                  <td valign="middle">
                    <p style="margin:0 0 4px;font-size:13px;color:#475569;line-height:1.5;">
                      <strong style="color:#0f172a;">${safeCloser}</strong> completó su tarea:
                    </p>
                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.45;text-decoration:line-through;">
                      ${safeBlockingTask}
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="40" align="center" style="padding:6px 16px 6px 0;">
                    <div style="height:22px;width:2px;background-color:#e2e8f0;margin:0 auto;"></div>
                  </td>
                  <td>&nbsp;</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="40" valign="top" style="padding-right:16px;">
                    <img src="${safeAssigneeImg}" alt="${safeAssignee}" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:50%;border:2px solid #4f46e5;background:#fff;box-shadow:0 0 0 3px #e0e7ff;" />
                  </td>
                  <td valign="middle">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#4f46e5;line-height:1.4;">
                      ${escapeHtml(tasksLabel)}
                    </p>
                    ${tasksBodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
          <tr>
            <td align="center" style="padding:24px 0;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">Taimbox</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">Notificación automática de seguimiento operativo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text: textLines.join("\n") };
}
