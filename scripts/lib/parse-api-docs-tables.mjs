/**
 * Extrae metadatos de tablas desde tables.ts (sin ejecutar TypeScript).
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TABLES_PATH = join(__dirname, '../../src/pages/api-docs/data/tables.ts');

const KNOWN_TABLES = [
  'agencies',
  'employees',
  'clients',
  'projects',
  'allocations',
  'allocation_notes',
  'deadlines',
  'time_entries',
  'active_timers',
  'timer_sessions',
  'task_transfers',
  'absences',
  'team_events',
  'global_assignments',
  'department_config',
  'client_settings',
  'weekly_feedback',
  'professional_goals',
  'user_routines',
  'project_editing_locks',
];

function unescapeSingleQuoted(str) {
  return str.replace(/\\'/g, "'");
}

function findMatchingBracket(source, openIndex) {
  const open = source[openIndex];
  const close = open === '[' ? ']' : open === '{' ? '}' : null;
  if (!close) return -1;
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === open) depth += 1;
    if (source[i] === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseColumns(block) {
  const columns = [];
  const re =
    /\{\s*name:\s*'([^']+)',\s*type:\s*'([^']+)',\s*required:\s*(true|false)([\s\S]*?)description:\s*'((?:\\'|[^'])*)'/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const tail = m[4];
    columns.push({
      name: m[1],
      type: m[2],
      required: m[3] === 'true',
      pk: /\bpk:\s*true\b/.test(tail),
      description: unescapeSingleQuoted(m[5]),
    });
  }
  return columns;
}

function parseTable(source, tableName) {
  const marker = `        name: '${tableName}',`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Tabla no encontrada en tables.ts: ${tableName}`);
  }
  const slice = source.slice(start);
  const descMatch = slice.match(/description:\s*\n?\s*'((?:\\'|[^'])*)'/);
  const authMatch = slice.match(/authNote:\s*\n?\s*'((?:\\'|[^'])*)'/);
  const columnsIdx = slice.indexOf('columns: [');
  if (!descMatch || columnsIdx === -1) {
    throw new Error(`No se pudo parsear ${tableName}`);
  }
  const bracketStart = start + columnsIdx + 'columns: '.length;
  const bracketEnd = findMatchingBracket(source, bracketStart);
  const columnsBlock = source.slice(bracketStart, bracketEnd + 1);

  return {
    name: tableName,
    description: unescapeSingleQuoted(descMatch[1]),
    authNote: authMatch ? unescapeSingleQuoted(authMatch[1]) : '',
    columns: parseColumns(columnsBlock),
  };
}

export function loadIntegrationTables() {
  const source = readFileSync(TABLES_PATH, 'utf8');
  return KNOWN_TABLES.map((name) => parseTable(source, name));
}
