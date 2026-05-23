import { env } from './env.js';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendCompletionEmail(
  to: string,
  jobId: string,
  summary: string,
): Promise<void> {
  if (!env.resendApiKey) return;
  const link = `${env.portalPublicUrl}/jobs/${jobId}`;
  const safeSummary = escapeHtml(summary.slice(0, 600));
  const html = `
    <p>Hola,</p>
    <p>Tu revisión ha finalizado y ya está disponible.</p>
    <p><strong>Resumen:</strong><br>${safeSummary}</p>
    <p>
      <a href="${link}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">
        Ver informe completo
      </a>
    </p>
    <p style="color:#64748b;font-size:12px;">— Taimbox</p>
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
      subject: 'Tu revisión está lista — Taimbox',
      html,
    }),
  });
}
