import { isIP } from 'node:net';

const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function isPrivateIp(host: string): boolean {
  if (!isIP(host)) return false;
  if (host.includes(':')) {
    return host.startsWith('fc') || host.startsWith('fd') || host === '::1';
  }
  const parts = host.split('.').map(Number);
  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('URL inválida');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Solo http/https');
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || isPrivateIp(host)) {
    throw new Error('URL no permitida (red interna)');
  }
  return url;
}
