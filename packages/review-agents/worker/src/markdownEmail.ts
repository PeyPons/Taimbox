/** Convierte markdown del informe a HTML seguro para email (subset GFM). */
export function markdownToEmailHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 4px;border-radius:3px;">$1</code>');

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push(
        `<pre style="background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;white-space:pre-wrap;">${esc(buf.join('\n'))}</pre>`,
      );
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (row: string) =>
          row
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
        const header = parseRow(tableLines[0]);
        const bodyRows = tableLines.slice(2).map(parseRow);
        out.push('<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">');
        out.push('<thead><tr>');
        for (const h of header) {
          out.push(
            `<th style="border:1px solid #cbd5e1;padding:8px;background:#f1f5f9;text-align:left;">${inline(h)}</th>`,
          );
        }
        out.push('</tr></thead><tbody>');
        for (const row of bodyRows) {
          out.push('<tr>');
          for (const cell of row) {
            out.push(`<td style="border:1px solid #cbd5e1;padding:8px;">${inline(cell)}</td>`);
          }
          out.push('</tr>');
        }
        out.push('</tbody></table>');
      }
      continue;
    }

    if (line.startsWith('### ')) {
      out.push(
        `<h3 style="margin:16px 0 8px;font-size:15px;color:#0f172a;">${inline(line.slice(4))}</h3>`,
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      out.push(
        `<h2 style="margin:20px 0 10px;font-size:17px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">${inline(line.slice(3))}</h2>`,
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      out.push(`<h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${inline(line.slice(2))}</h1>`);
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const quotes: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quotes.push(lines[i].slice(2));
        i++;
      }
      out.push(
        `<blockquote style="margin:10px 0;padding:8px 14px;border-left:4px solid #4f46e5;background:#f1f5f9;color:#334155;">${inline(quotes.join(' '))}</blockquote>`,
      );
      continue;
    }

    if (/^[-*] /.test(line)) {
      out.push('<ul style="margin:8px 0;padding-left:20px;">');
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        out.push(`<li style="margin:4px 0;">${inline(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push('</ul>');
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    out.push(`<p style="margin:8px 0;line-height:1.55;color:#334155;">${inline(line)}</p>`);
    i++;
  }

  return out.join('\n');
}

export function formatReviewSourceLabels(
  inputs: Array<{
    input_type: string;
    original_filename?: string | null;
    source_url?: string | null;
  }>,
): string {
  const labels: string[] = [];
  for (const inp of inputs) {
    if (inp.original_filename?.trim()) {
      labels.push(inp.original_filename.trim());
    } else if (inp.source_url?.trim()) {
      try {
        const u = new URL(inp.source_url);
        labels.push(u.hostname + u.pathname.replace(/\/$/, '').slice(0, 60));
      } catch {
        labels.push(inp.source_url.trim());
      }
    } else if (inp.input_type === 'paste') {
      labels.push('texto pegado');
    }
  }
  return labels.length ? labels.join(', ') : 'tu contenido';
}

export function shortSubjectLabel(sourceLabels: string, maxLen = 55): string {
  const one = sourceLabels.split(',')[0]?.trim() ?? 'Revisión';
  if (one.length <= maxLen) return one;
  return `${one.slice(0, maxLen - 1)}…`;
}
