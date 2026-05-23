import { env } from './env.js';

export async function sendCompletionEmail(
  to: string,
  jobId: string,
  summary: string,
): Promise<void> {
  if (!env.resendApiKey) return;
  const link = `${env.portalPublicUrl}/jobs/${jobId}`;
  const html = `
    <p>Tu revisión ha finalizado.</p>
    <p><strong>Resumen:</strong> ${summary.slice(0, 500)}</p>
    <p><a href="${link}">Ver informe completo</a></p>
  `;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.resendFrom,
      to: [to],
      subject: 'Revisión completada — Taimbox Review',
      html,
    }),
  });
}
