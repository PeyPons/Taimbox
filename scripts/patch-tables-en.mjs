import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../src/pages/api-docs/data/tables.en.ts');
let s = fs.readFileSync(p, 'utf8');

/** Orden: cadenas largas antes que cortas para no romper sustituciones. */
const pairs = [
  [
    'Requiere autenticacion. Filtra por agency_id para listar timers de la agencia. RLS limita a la fila del empleado del usuario.',
    'Authentication required. Filter by agency_id to list agency timers. RLS limits to the user employee row.',
  ],
  [
    'Requiere autenticacion. Filtra por agency_id para listar sesiones de la agencia.',
    'Authentication required. Filter by agency_id to list agency sessions.',
  ],
  [
    'Requiere autenticacion. Filtra por agency_id para listar por agencia; RLS limita a las filas del empleado vinculado al usuario.',
    'Authentication required. Filter by agency_id to list by agency; RLS limits rows to the employee linked to the user.',
  ],
  ['Requiere autenticacion. El lock expira automaticamente.', 'Authentication required. The lock expires automatically.'],
  [
    'Requiere autenticacion. Se filtra por proyecto (que pertenece a una agencia).',
    'Authentication required. Filtered via project (which belongs to an agency).',
  ],
  [
    'Requiere autenticacion. Filtra por agency_id a traves del proyecto.',
    'Authentication required. Filter by agency_id via the project.',
  ],
  ['Requiere autenticacion. Filtra por agency_id obligatorio.', 'Authentication required. You must filter by agency_id.'],
  [
    'Requiere autenticacion. Solo puedes acceder a las agencias de tu usuario.',
    'Authentication required. You can only access agencies for your user.',
  ],
  ["group: 'Bloqueos de edicion'", "group: 'Editing locks'"],
  ["group: 'Objetivos'", "group: 'Goals'"],
  ["group: 'Configuracion'", "group: 'Configuration'"],
  ["group: 'Ausencias y eventos'", "group: 'Absences and events'"],
  ["group: 'Transferencias'", "group: 'Transfers'"],
  ["group: 'Planificacion'", "group: 'Planning'"],
  ["group: 'Organizacion'", "group: 'Organization'"],
  ['Ultima actualizacion. Auto-generado.', 'Last update. Auto-generated.'],
  ['Fecha de creacion. Auto-generado.', 'Creation timestamp. Auto-generated.'],
  ['Identificador unico.', 'Unique identifier.'],
  ['Requiere autenticacion.', 'Authentication required.'],
  ['Requiere autenticacion. Filtra por agency_id.', 'Authentication required. Filter by agency_id.'],
];

for (const [a, b] of pairs) {
  if (!s.includes(a)) continue;
  s = s.split(a).join(b);
}

fs.writeFileSync(p, s);
console.log('patched', p);
