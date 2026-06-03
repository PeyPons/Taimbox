#!/usr/bin/env node
/**
 * CI: bloquea claims de marketing no respaldados (seguridad, uptime, PPC real-time, SDK Python).
 * Uso: node scripts/check-marketing-claims.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const SCAN_DIRS = [
  path.join(ROOT, 'src/locales'),
  path.join(ROOT, 'src/pages/PresentationPage.tsx'),
];

/** Patrones prohibidos (regex) — excluir apiDocs (Realtime SDK legítimo). */
const FORBIDDEN = [
  { pattern: /SOC\s*2\s*Type\s*II/i, label: 'SOC 2 Type II (no certificado propio)' },
  { pattern: /99\.99\s*%\s*Uptime/i, label: '99.99% uptime' },
  { pattern: /AWS\s*Shield/i, label: 'AWS Shield' },
  { pattern: /Read-Replicas/i, label: 'Read-Replicas HA' },
  { pattern: /Point-in-Time Recovery \(PITR\)/i, label: 'PITR 7 días (infra)' },
  { pattern: /Infraestructura Certificada \(AWS\)/i, label: 'Infraestructura Certificada AWS' },
  { pattern: /Node\.js y Python/i, label: 'SDK Node.js y Python (solo REST)' },
  { pattern: /en tiempo real.*gasto|gasto.*en tiempo real/i, label: 'PPC gasto en tiempo real' },
];

const ALLOWED_PATH_SUBSTRINGS = [
  'apiDocs.json',
  'blog.json',
];

function collectFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const stat = fs.statSync(dir);
  if (stat.isFile() && (dir.endsWith('.json') || dir.endsWith('.tsx'))) {
    acc.push(dir);
    return acc;
  }
  if (!stat.isDirectory()) return acc;
  for (const name of fs.readdirSync(dir)) {
    collectFiles(path.join(dir, name), acc);
  }
  return acc;
}

const files = [];
for (const entry of SCAN_DIRS) {
  if (entry.endsWith('.tsx')) files.push(entry);
  else collectFiles(entry, files);
}

let failed = false;
for (const file of files) {
  if (ALLOWED_PATH_SUBSTRINGS.some((s) => file.includes(s))) continue;
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  for (const { pattern, label } of FORBIDDEN) {
    if (pattern.test(text)) {
      console.error(`[claims] ${rel}: prohibido — ${label}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error('\nRevisa copy en /seguridad, /integraciones, /monitor-ppc y PresentationPage.');
  process.exit(1);
}
console.log('check-marketing-claims: OK');
