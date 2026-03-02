// supabase/functions/_shared/resend.ts
// Módulo compartido para enviar emails vía Resend API

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
}

interface SendEmailResult {
    success: boolean;
    id?: string;
    error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
        console.error('[Resend] RESEND_API_KEY no configurada');
        return { success: false, error: 'RESEND_API_KEY no configurada' };
    }

    const from = Deno.env.get('RESEND_FROM_EMAIL') || 'Taimbox <onboarding@resend.dev>';

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                html: options.html,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[Resend] Error ${response.status}: ${errorBody}`);
            return { success: false, error: `Resend API error: ${response.status}` };
        }

        const data = await response.json();
        console.log(`[Resend] Email enviado exitosamente. ID: ${data.id}`);
        return { success: true, id: data.id };
    } catch (err: any) {
        console.error('[Resend] Error enviando email:', err);
        return { success: false, error: err?.message || 'Error desconocido' };
    }
}
