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

type DependencyUnblockDependentRow = {
  projectId: string;
  projectName: string;
  clientName: string | null;
  taskName: string;
  assigneeName: string;
};

function groupDependentsByProject(rows: DependencyUnblockDependentRow[]): Array<{
  projectId: string;
  projectName: string;
  clientName: string | null;
  items: { taskName: string; assigneeName: string }[];
}> {
  const map = new Map<
    string,
    { projectName: string; clientName: string | null; items: { taskName: string; assigneeName: string }[] }
  >();
  for (const d of rows) {
    const cur = map.get(d.projectId);
    const item = { taskName: d.taskName, assigneeName: d.assigneeName };
    if (!cur) {
      map.set(d.projectId, {
        projectName: d.projectName,
        clientName: d.clientName,
        items: [item],
      });
    } else {
      cur.items.push(item);
    }
  }
  return [...map.entries()].map(([projectId, v]) => ({ projectId, ...v }));
}

function labeledRow(label: string, value: string): string {
  const safeLabel = escapeHtml(label);
  const safeValue = escapeHtml(value);
  return `
    <tr>
      <td style="padding:6px 0;vertical-align:top;width:132px;font-size:13px;color:#64748b;font-weight:600;">${safeLabel}</td>
      <td style="padding:6px 0;font-size:14px;color:#0f172a;line-height:1.45;">${safeValue}</td>
    </tr>`;
}

export function dependencyUnblockEmailHtml(params: {
  agencyName: string;
  closerName: string;
  blockingTaskName: string;
  blockingProjectName: string;
  blockingClientName?: string | null;
  dependents: DependencyUnblockDependentRow[];
  appUrl: string;
  operationsUrl?: string;
}): { html: string; text: string } {
  const {
    agencyName,
    closerName,
    blockingTaskName,
    blockingProjectName,
    blockingClientName,
    dependents,
    appUrl,
    operationsUrl,
  } = params;

  const safe = {
    agencyName: escapeHtml(agencyName),
    closerName: escapeHtml(closerName),
    blockingTaskName: escapeHtml(blockingTaskName),
    blockingProjectName: escapeHtml(blockingProjectName),
    appUrl: escapeHtml(appUrl),
    operationsUrl: operationsUrl ? escapeHtml(operationsUrl) : "",
  };

  const blockingClientLine =
    blockingClientName && blockingClientName.trim()
      ? labeledRow("Cliente", blockingClientName.trim())
      : "";

  const completedSectionHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e0e7ff;border-radius:10px;overflow:hidden;background:#fafbff;">
      <tr>
        <td style="background:linear-gradient(90deg,#eef2ff 0%,#e0e7ff 100%);padding:10px 14px;border-bottom:1px solid #c7d2fe;">
          <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.06em;color:#4338ca;text-transform:uppercase;">Tarea completada (desbloquea a otras)</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${labeledRow("Proyecto", blockingProjectName)}
            ${blockingClientLine}
            ${labeledRow("Tarea bloqueadora", blockingTaskName)}
            ${labeledRow("Responsable", closerName)}
          </table>
        </td>
      </tr>
    </table>`;

  const groups = groupDependentsByProject(dependents);
  const dependentsBlocksHtml = groups
    .map((g) => {
      const clientPart =
        g.clientName && g.clientName.trim()
          ? `<span style="color:#64748b;font-weight:500;"> · ${escapeHtml(g.clientName.trim())}</span>`
          : "";
      const rowsInner = g.items
        .map((it, idx) => {
          const border =
            idx < g.items.length - 1 ? "border-bottom:1px solid #f1f5f9;" : "";
          return `
            <tr>
              <td style="padding:10px 14px;${border}">
                <p style="margin:0 0 4px;font-size:13px;color:#0f172a;font-weight:600;line-height:1.4;">${escapeHtml(it.taskName)}</p>
                <p style="margin:0;font-size:12px;color:#64748b;">
                  <span style="font-weight:600;color:#475569;">Asignada a:</span> ${escapeHtml(it.assigneeName)}
                </p>
              </td>
            </tr>`;
        })
        .join("");
      return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#fff;">
      <tr>
        <td style="background:#f8fafc;padding:10px 14px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.06em;color:#64748b;text-transform:uppercase;">Proyecto</p>
          <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#0f172a;line-height:1.35;">
            ${escapeHtml(g.projectName)}${clientPart}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0;">
          <p style="margin:0;padding:8px 14px 0;font-size:10px;font-weight:700;letter-spacing:0.05em;color:#94a3b8;text-transform:uppercase;">Tareas que estaban esperando</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsInner}</table>
        </td>
      </tr>
    </table>`;
    })
    .join("");

  const textBlockingClient =
    blockingClientName && blockingClientName.trim()
      ? `Cliente: ${blockingClientName.trim()}`
      : null;
  const textLines: string[] = [
    `Tarea desbloqueada — ${agencyName}`,
    ``,
    `── Tarea completada ──`,
    `Proyecto: ${blockingProjectName}`,
    ...(textBlockingClient ? [textBlockingClient] : []),
    `Tarea bloqueadora: ${blockingTaskName}`,
    `Responsable: ${closerName}`,
    ``,
    `── Tareas que quedan listas para avanzar ──`,
  ];
  for (const g of groups) {
    textLines.push("");
    textLines.push(`▸ ${g.projectName}${g.clientName ? ` · ${g.clientName}` : ""}`);
    for (const it of g.items) {
      textLines.push(`  · ${it.taskName} (asignada a ${it.assigneeName})`);
    }
  }
  textLines.push("", `Planificador: ${appUrl}`);
  if (operationsUrl) {
    textLines.push(`Seguimiento operativo: ${operationsUrl}`);
  }

  const secondaryCta = safe.operationsUrl
    ? `<p style="margin:12px 0 0;text-align:center;">
            <a href="${safe.operationsUrl}" style="color:#4f46e5;font-size:14px;font-weight:600;text-decoration:underline;">Ver seguimiento operativo</a>
          </p>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><title>Tarea desbloqueada</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;max-width:600px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:22px 24px;text-align:center;">
          <span style="font-size:19px;font-weight:700;color:#fff;letter-spacing:-0.02em;">Taimbox</span>
        </td></tr>
        <tr><td style="padding:24px 24px 8px;">
          <h1 style="margin:0 0 6px;font-size:20px;color:#0f172a;line-height:1.25;">Una tarea se completó y otras quedan desbloqueadas</h1>
          <p style="margin:0;color:#64748b;font-size:14px;">${safe.agencyName}</p>
        </td></tr>
        <tr><td style="padding:8px 24px 24px;font-size:15px;color:#334155;line-height:1.55;">
          <p style="margin:0 0 18px;font-size:14px;color:#475569;">Mismo criterio que en <strong>Seguimiento operativo</strong>: proyecto, personas y nombre de cada tarea.</p>
          ${completedSectionHtml}
          <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.06em;color:#64748b;text-transform:uppercase;">Desbloqueadas (por proyecto)</p>
          ${dependentsBlocksHtml}
          <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 0;">
            <tr>
              <td style="border-radius:8px;background:#4f46e5;">
                <a href="${safe.appUrl}" style="display:inline-block;padding:12px 22px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;">Abrir planificador</a>
              </td>
            </tr>
          </table>
          ${secondaryCta}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { html, text: textLines.join("\n") };
}
