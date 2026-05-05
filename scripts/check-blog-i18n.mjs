/**
 * Comprueba que las claves i18n referenciadas en artículos del blog existan en ES y EN.
 * No marca cadenas vacías (a veces intencionadas en copy EN).
 * Uso: node scripts/check-blog-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const es = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/es/blog.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/en/blog.json'), 'utf8'));

function getAt(obj, keyPath) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || cur === undefined) return undefined;
    if (Array.isArray(cur) && /^\d+$/.test(p)) {
      cur = cur[Number(p)];
    } else if (typeof cur === 'object' && p in cur) {
      cur = cur[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function extractStaticKeys(content) {
  const keys = new Set();
  for (const re of [
    /t\(\s*'((?:posts|components)\.[^']+)'\s*\)/g,
    /t\(\s*"((?:posts|components)\.[^"]+)"\s*\)/g,
    /i18nKey="((?:posts|components)\.[^"]+)"/g,
  ]) {
    let m;
    while ((m = re.exec(content))) keys.add(m[1]);
  }
  return keys;
}

function expandPostKeyTemplates(content, postKey, extras = []) {
  const keys = new Set();
  const re = /`posts\.\$\{postKey\}\.([^`${]+)`/g;
  let m;
  while ((m = re.exec(content))) {
    let suffix = m[1];
    if (suffix.includes('${i}')) {
      if (suffix.startsWith('faq.q')) {
        for (let i = 1; i <= 5; i++) {
          keys.add(`posts.${postKey}.${suffix.replace(/\$\{i\}/g, String(i))}`);
        }
      } else if (suffix.includes('sections.map.table.rows.${i}')) {
        for (let i = 0; i <= 5; i++) {
          keys.add(`posts.${postKey}.${suffix.replace(/\$\{i\}/g, String(i))}`);
        }
      } else {
        keys.add(`posts.${postKey}.${suffix.replace(/\$\{i\}/g, '0')}`);
      }
    } else {
      keys.add(`posts.${postKey}.${suffix}`);
    }
  }
  for (const k of extras) keys.add(k);
  return keys;
}

function extractTpKeys(content, postSlug) {
  const keys = new Set();
  const re = /tp\(\s*'([^']+)'\s*\)/g;
  let m;
  while ((m = re.exec(content))) {
    keys.add(`posts.${postSlug}.${m[1]}`);
  }
  return keys;
}

function expandCompKey(content, compKey) {
  const keys = new Set();
  const re = /`\$\{compKey\}\.([^`]+)`/g;
  let m;
  while ((m = re.exec(content))) {
    keys.add(`${compKey}.${m[1]}`);
  }
  return keys;
}

const allKeys = new Set();

const files = [
  {
    path: 'src/components/landing/blog/CapacidadCalendarioVsProductivaArticle.tsx',
    expand: () =>
      expandPostKeyTemplates(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/CapacidadCalendarioVsProductivaArticle.tsx'), 'utf8'),
        'capacidadCalendarioVsProductiva',
      ),
  },
  { path: 'src/components/landing/blog/GestionCargaTrabajoEquipoArticle.tsx', expand: () => expandPostKeyTemplates(
      fs.readFileSync(path.join(root, 'src/components/landing/blog/GestionCargaTrabajoEquipoArticle.tsx'), 'utf8'),
      'gestionCargaTrabajoEquipo',
    ) },
  { path: 'src/components/landing/blog/ComoMedirRentabilidadProyectoArticle.tsx', expand: () => expandPostKeyTemplates(
      fs.readFileSync(path.join(root, 'src/components/landing/blog/ComoMedirRentabilidadProyectoArticle.tsx'), 'utf8'),
      'comoMedirRentabilidadProyecto',
    ) },
  {
    path: 'src/components/landing/blog/LeyParkinsonArticle.tsx',
    expand: () =>
      extractStaticKeys(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/LeyParkinsonArticle.tsx'), 'utf8'),
      ),
  },
  {
    path: 'src/components/landing/blog/PlanificacionProyectosArticle.tsx',
    expand: () =>
      extractStaticKeys(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/PlanificacionProyectosArticle.tsx'), 'utf8'),
      ),
  },
  {
    path: 'src/components/landing/blog/PorQueAgenciaPierdeRentabilidadArticle.tsx',
    expand: () =>
      extractStaticKeys(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/PorQueAgenciaPierdeRentabilidadArticle.tsx'), 'utf8'),
      ),
  },
  {
    path: 'src/components/landing/blog/KpisAgenciasMarketingArticle.tsx',
    expand: () =>
      extractStaticKeys(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/KpisAgenciasMarketingArticle.tsx'), 'utf8'),
      ),
  },
  {
    path: 'src/components/landing/blog/PlantillaPlanificacionRecursosArticle.tsx',
    expand: () =>
      extractTpKeys(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/PlantillaPlanificacionRecursosArticle.tsx'), 'utf8'),
        'plantillaPlanificacionRecursos',
      ),
  },
  {
    path: 'src/components/landing/WhatIsTimeboxingArticle.tsx',
    expand: () =>
      extractStaticKeys(fs.readFileSync(path.join(root, 'src/components/landing/WhatIsTimeboxingArticle.tsx'), 'utf8')),
  },
  {
    path: 'src/components/landing/blog/CargaTrabajoFrameworkVisual.tsx',
    expand: () =>
      expandCompKey(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/CargaTrabajoFrameworkVisual.tsx'), 'utf8'),
        'components.cargaTrabajoFramework',
      ),
  },
  {
    path: 'src/components/landing/blog/SenalesCargaAlertaVisual.tsx',
    expand: () =>
      expandCompKey(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/SenalesCargaAlertaVisual.tsx'), 'utf8'),
        'components.senalesCargaAlerta',
      ),
  },
  {
    path: 'src/components/landing/blog/ParkinsonLawVisual.tsx',
    expand: () =>
      expandCompKey(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/ParkinsonLawVisual.tsx'), 'utf8'),
        'components.parkinsonLawVisual',
      ),
  },
  {
    path: 'src/components/landing/blog/OcupacionVsRentabilidadChart.tsx',
    expand: () =>
      expandCompKey(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/OcupacionVsRentabilidadChart.tsx'), 'utf8'),
        'components.ocupacionChart',
      ),
  },
  {
    path: 'src/components/landing/blog/ScopeProtocoloInfographic.tsx',
    expand: () =>
      extractStaticKeys(
        fs.readFileSync(path.join(root, 'src/components/landing/blog/ScopeProtocoloInfographic.tsx'), 'utf8'),
      ),
  },
];

for (const f of files) {
  for (const k of f.expand()) allKeys.add(k);
}

const missingEs = [];
const missingEn = [];

for (const key of [...allKeys].sort()) {
  if (getAt(es, key) === undefined) missingEs.push(key);
  if (getAt(en, key) === undefined) missingEn.push(key);
}

console.log('Claves comprobadas:', allKeys.size);
if (missingEs.length) {
  console.log('\n=== Faltan en ES (blog.json) ===');
  missingEs.forEach((k) => console.log(k));
}
if (missingEn.length) {
  console.log('\n=== Faltan en EN (blog.json) ===');
  missingEn.forEach((k) => console.log(k));
}

const code = missingEs.length || missingEn.length ? 1 : 0;
if (code === 0) console.log('\nOK: todas las claves existen en ES y EN.');
process.exit(code);
