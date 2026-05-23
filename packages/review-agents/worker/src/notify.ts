import { env } from './env.js';
import { markdownToEmailHtml, shortSubjectLabel } from './markdownEmail.js';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ReviewCompletionEmailParams {
  to: string;
  jobId: string;
  skillName: string;
  sourceLabels: string;
  resultMarkdown: string;
}

export async function sendCompletionEmail(params: ReviewCompletionEmailParams): Promise<void> {
  if (!env.resendApiKey) return;

  const { to, jobId, skillName, sourceLabels, resultMarkdown } = params;
  const link = `${env.portalPublicUrl}/jobs/${jobId}`;
  const safeSkill = escapeHtml(skillName);
  const safeSources = escapeHtml(sourceLabels);
  const reportHtml = markdownToEmailHtml(resultMarkdown);
  const subjectLabel = shortSubjectLabel(sourceLabels);

  const intro =
    sourceLabels.includes(',')
      ? `Los materiales revisados son: <strong>${safeSources}</strong>.`
      : `El material revisado es: <strong>${safeSources}</strong>.`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5;color:#0f172a;max-width:720px;margin:0 auto;padding:24px;">
  <p>Hola,</p>
  <p>
    La revisión <strong>${safeSkill}</strong> ha finalizado.
    ${intro}
  </p>
  <p style="color:#64748b;font-size:14px;">Informe completo:</p>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:16px 0;">
    ${reportHtml}
  </div>
  <p style="margin-top:24px;">
    <a href="${link}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">
      Abrir en el portal
    </a>
  </p>
  <p style="color:#64748b;font-size:12px;margin-top:32px;">— Taimbox</p>
</body>
</html>`;

  const text = [
    `La revisión "${skillName}" ha finalizado.`,
    `Material: ${sourceLabels}`,
    '',
    resultMarkdown,
    '',
    `Ver en el portal: ${link}`,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.resendFrom,
      to: [to],
      subject: `Revisión lista: ${subjectLabel} — Taimbox`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[review-worker] Resend error', res.status, body.slice(0, 500));
  }
}
