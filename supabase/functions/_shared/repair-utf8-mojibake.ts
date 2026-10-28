/** Igual que src/utils/repairUtf8Mojibake.ts: repara UTF-8 leído como Latin-1. */
export function repairUtf8Mojibake(value: string | null | undefined): string {
  if (!value) return '';
  if (!/[\u00C3\u00C2]/.test(value)) return value;

  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) return value;
    bytes[i] = code;
  }

  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (!decoded || decoded.includes('\uFFFD')) return value;
    return decoded;
  } catch {
    return value;
  }
}
