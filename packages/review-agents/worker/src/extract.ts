import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { assertSafeUrl } from './ssrf.js';

export async function extractFromBuffer(
  buf: Buffer,
  filename: string,
): Promise<string> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) {
    const data = await pdfParse(buf);
    return data.text;
  }
  if (lower.endsWith('.docx')) {
    const r = await mammoth.extractRawText({ buffer: buf });
    return r.value;
  }
  return buf.toString('utf-8');
}

export async function extractFromUrl(url: string): Promise<string> {
  const parsed = assertSafeUrl(url);
  const res = await fetch(parsed.toString(), {
    redirect: 'follow',
    headers: { 'User-Agent': 'TaimboxReviewAgent/1.0' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Fetch ${res.status}`);
  const html = await res.text();
  if (html.length > 5_000_000) throw new Error('HTML demasiado grande');
  const dom = new JSDOM(html, { url: parsed.toString() });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  const title = article?.title ?? dom.window.document.title ?? '';
  const text = article?.textContent ?? dom.window.document.body?.textContent ?? '';
  return `# ${title}\n\n${text}`.trim();
}

export function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks.length ? chunks : [''];
}
