/**
 * Genera public/recursos/plantilla-planificacion-recursos-taimbox.xlsx
 * Ejecutar: node scripts/generate-plantilla-xlsx.mjs
 *
 * 5 hojas: Instrucciones, Equipo, Proyectos, Asignacion, Insights
 * Fórmulas nativas, validación de datos, protección de celdas,
 * formato condicional, autofiltros, colores, panes congelados.
 */
import ExcelJS from 'exceljs';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'recursos');
const outFile = join(outDir, 'plantilla-planificacion-recursos-taimbox.xlsx');
mkdirSync(outDir, { recursive: true });

const wb = new ExcelJS.Workbook();
wb.creator = 'Taimbox';
wb.created = new Date();

// ─── Paleta ───
const INDIGO = '4338CA';
const INDIGO_LIGHT = 'E0E7FF';
const EMERALD = '059669';
const EMERALD_LIGHT = 'D1FAE5';
const AMBER = 'D97706';
const AMBER_LIGHT = 'FEF3C7';
const ROSE = 'E11D48';
const ROSE_LIGHT = 'FFE4E6';
const VIOLET = '7C3AED';
const SLATE_50 = 'F8FAFC';
const SLATE_200 = 'E2E8F0';
const SLATE_700 = '334155';
const WHITE = 'FFFFFF';

const headerFont = { bold: true, color: { argb: WHITE }, size: 11, name: 'Calibri' };
const headerFill = (c) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: c } });
const lightFill = (c) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: c } });
const thinBorder = {
  top: { style: 'thin', color: { argb: SLATE_200 } },
  bottom: { style: 'thin', color: { argb: SLATE_200 } },
  left: { style: 'thin', color: { argb: SLATE_200 } },
  right: { style: 'thin', color: { argb: SLATE_200 } },
};
const bodyFont = { size: 11, name: 'Calibri', color: { argb: SLATE_700 } };

function styleHeader(row, color) {
  row.eachCell({ includeEmpty: true }, (c) => {
    c.font = headerFont;
    c.fill = headerFill(color);
    c.border = thinBorder;
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  row.height = 30;
}

function styleBody(row, idx) {
  const fill = idx % 2 === 0 ? lightFill(WHITE) : lightFill(SLATE_50);
  row.eachCell({ includeEmpty: false }, (c) => {
    c.font = bodyFont;
    c.fill = fill;
    c.border = thinBorder;
    c.alignment = { vertical: 'middle' };
  });
  row.height = 22;
}

function protectFormula(cell) {
  cell.protection = { locked: true };
}

function unlockCell(cell) {
  cell.protection = { locked: false };
}

// ═══════════════════════════════════════════════════════════════
// 1) INSTRUCCIONES
// ═══════════════════════════════════════════════════════════════
const wsInstr = wb.addWorksheet('Instrucciones', {
  properties: { tabColor: { argb: INDIGO } },
});
wsInstr.getColumn(1).width = 90;

const instrucciones = [
  ['t', '🗂️  PLANTILLA DE PLANIFICACIÓN DE RECURSOS — Taimbox'],
  ['', ''],
  ['b', 'Esta plantilla tiene 4 hojas de trabajo + esta página de instrucciones.'],
  ['b', 'Todas las fórmulas están conectadas: edita los datos base y el resto se actualiza solo.'],
  ['b', 'Las celdas con fórmula están protegidas (fondo gris claro); solo puedes editar las celdas de entrada.'],
  ['', ''],
  ['h', '── HOJA "Equipo" ──'],
  ['b', '• Rellena una fila por persona del equipo (nombre, rol, jornada, coste hora).'],
  ['b', '• Ajusta las horas de reuniones, admin/formación y ausencias cada semana.'],
  ['b', '• La columna "Capacidad neta" se calcula automáticamente: Jornada − Reuniones − Admin − Ausencias.'],
  ['b', '• "Coste hora" es el coste interno (no precio de venta); se usa para calcular márgenes en "Proyectos" e "Insights".'],
  ['', ''],
  ['h', '── HOJA "Proyectos" ──'],
  ['b', '• Un proyecto (o cliente-servicio) por fila. Fee y horas presupuestadas son mensuales.'],
  ['b', '• Las columnas "Horas asignadas semana", "Pacing", "Coste semana" y "Margen" se calculan desde "Asignación".'],
  ['b', '• El pacing compara las horas asignadas esta semana con la media semanal presupuestada (horas mes ÷ 4).'],
  ['b', '• El margen es: fee mensual − (coste semanal estimado × 4 semanas).'],
  ['', ''],
  ['h', '── HOJA "Asignación" ──'],
  ['b', '• Una fila por cada bloque persona + proyecto + semana.'],
  ['b', '• Las columnas "Persona" y "Proyecto" tienen desplegables enlazados a "Equipo" y "Proyectos" (evita errores de escritura).'],
  ['b', '• Duplica filas para semanas distintas cambiando la columna "Semana".'],
  ['b', '• Incluye datos de ejemplo de dos semanas (S12 y S13) para que veas el patrón.'],
  ['', ''],
  ['h', '── HOJA "Insights" ──'],
  ['b', '• Se actualiza sola desde las demás hojas. No toques las fórmulas.'],
  ['b', '• Formato condicional automático: 🟢 verde (70–90%), 🟡 ámbar (>90%), 🔴 rojo (≥100%).'],
  ['b', '• Estado con 4 niveles: ✅ ÓPTIMO, ⚠️ RIESGO, ⛔ SOBRECARGA, 💤 BAJA CARGA.'],
  ['b', '• KPIs de resumen debajo de la tabla: utilización media, personas en riesgo, horas libres, coste total e "Impuesto Excel".'],
  ['', ''],
  ['h', '── CUÁNDO ACTUALIZAR ──'],
  ['b', '• Cada lunes: ajustar ausencias en "Equipo" y añadir las asignaciones de la nueva semana en "Asignación".'],
  ['b', '• Cuando entre un proyecto nuevo: añadir fila en "Proyectos" y las asignaciones correspondientes.'],
  ['b', '• Cuando se incorpore alguien: añadir fila en "Equipo" y actualizar los desplegables si es necesario.'],
  ['', ''],
  ['h', '── CONSEJOS PARA NO ROMPER LA HOJA ──'],
  ['b', '• Usa siempre los desplegables en "Asignación". Si escribes el nombre a mano y hay una tilde o espacio distinto, las fórmulas no cruzan.'],
  ['b', '• No borres filas dentro de rangos de fórmula; mejor vacía el contenido y déjala en blanco.'],
  ['b', '• Si necesitas más filas de persona o proyecto, insértalas ANTES de la fila de totales.'],
  ['', ''],
  ['h', '── SIGUIENTE PASO ──'],
  ['b', '• Cuando el mantenimiento semanal pese más que el valor que aporta, la misma lógica vive en Taimbox.'],
  ['b', '• taimbox.com/planificador-recursos'],
];
instrucciones.forEach(([type, text]) => {
  const r = wsInstr.addRow([text]);
  if (type === 't') {
    r.getCell(1).font = { bold: true, size: 16, name: 'Calibri', color: { argb: INDIGO } };
    r.height = 36;
  } else if (type === 'h') {
    r.getCell(1).font = { bold: true, size: 12, name: 'Calibri', color: { argb: INDIGO } };
  } else {
    r.getCell(1).font = { size: 11, name: 'Calibri', color: { argb: SLATE_700 } };
  }
});

// ═══════════════════════════════════════════════════════════════
// 2) EQUIPO
// ═══════════════════════════════════════════════════════════════
const EQUIPO_DATA_ROWS = 12; // 10 personas + 2 vacías

const wsEquipo = wb.addWorksheet('Equipo', {
  views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
  properties: { tabColor: { argb: INDIGO } },
  pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
});
wsEquipo.columns = [
  { header: 'Persona', key: 'persona', width: 22 },
  { header: 'Rol / Departamento', key: 'rol', width: 22 },
  { header: 'Jornada (h/sem)', key: 'jornada', width: 16 },
  { header: 'Reuniones (h)', key: 'reuniones', width: 16 },
  { header: 'Admin / formación (h)', key: 'admin', width: 20 },
  { header: 'Ausencias semana (h)', key: 'ausencias', width: 20 },
  { header: 'Capacidad neta (h)', key: 'neta', width: 20 },
  { header: 'Coste hora (€)', key: 'costeHora', width: 16 },
];
styleHeader(wsEquipo.getRow(1), INDIGO);
wsEquipo.autoFilter = 'A1:H1';

const equipo = [
  ['Ana López', 'Paid Media', 40, 6, 2, 0, 35],
  ['Luis García', 'Diseño', 40, 4, 2, 0, 30],
  ['María Pérez', 'Cuentas / Traffic', 40, 8, 3, 0, 40],
  ['Carlos Ruiz', 'SEO / Contenidos', 40, 5, 2, 0, 32],
  ['Elena Martín', 'Social Media', 40, 4, 2, 0, 28],
  ['Jorge Navarro', 'Desarrollo Web', 40, 3, 1, 0, 45],
  ['Sara Díaz', 'Estrategia / Dirección', 40, 10, 4, 0, 55],
  ['Pablo Torres', 'Diseño Junior', 32, 3, 2, 0, 22],
  ['(Tu nombre)', '(Departamento)', 40, 0, 0, 0, 0],
  ['(Tu nombre)', '(Departamento)', 40, 0, 0, 0, 0],
];
equipo.forEach((row, i) => {
  const rn = i + 2;
  const r = wsEquipo.addRow([row[0], row[1], row[2], row[3], row[4], row[5], null, row[6]]);
  r.getCell('neta').value = { formula: `C${rn}-D${rn}-E${rn}-F${rn}` };
  r.getCell('neta').numFmt = '0';
  r.getCell('costeHora').numFmt = '#,##0 €';
  protectFormula(r.getCell('neta'));
  // Input cells unlocked
  ['persona', 'rol', 'jornada', 'reuniones', 'admin', 'ausencias', 'costeHora'].forEach((k) => unlockCell(r.getCell(k)));
  styleBody(r, i);
});

const eqTotRow = equipo.length + 2;
wsEquipo.getCell(`A${eqTotRow}`).value = 'TOTALES';
wsEquipo.getCell(`A${eqTotRow}`).font = { ...bodyFont, bold: true };
['C', 'D', 'E', 'F', 'G'].forEach((col) => {
  wsEquipo.getCell(`${col}${eqTotRow}`).value = { formula: `SUM(${col}2:${col}${eqTotRow - 1})` };
  wsEquipo.getCell(`${col}${eqTotRow}`).font = { ...bodyFont, bold: true };
  protectFormula(wsEquipo.getCell(`${col}${eqTotRow}`));
});
wsEquipo.getRow(eqTotRow).eachCell({ includeEmpty: false }, (c) => {
  c.border = thinBorder;
  c.fill = lightFill(INDIGO_LIGHT);
});

const eqNote = eqTotRow + 2;
wsEquipo.mergeCells(`A${eqNote}:H${eqNote}`);
wsEquipo.getCell(`A${eqNote}`).value = '📋 Rellena una fila por persona. "Capacidad neta" se calcula sola (Jornada − Reuniones − Admin − Ausencias). Actualiza "Ausencias semana" cada lunes.';
wsEquipo.getCell(`A${eqNote}`).font = { size: 10, name: 'Calibri', color: { argb: '64748B' }, italic: true };
wsEquipo.getCell(`A${eqNote}`).alignment = { wrapText: true };

await wsEquipo.protect('', {
  selectLockedCells: true,
  selectUnlockedCells: true,
  formatColumns: true,
  formatRows: true,
  sort: true,
  autoFilter: true,
  insertRows: true,
});

// ═══════════════════════════════════════════════════════════════
// 3) PROYECTOS
// ═══════════════════════════════════════════════════════════════
const PROY_DATA_ROWS = 10; // 8 + 2 vacías

const wsProyectos = wb.addWorksheet('Proyectos', {
  views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
  properties: { tabColor: { argb: EMERALD } },
  pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
});
wsProyectos.columns = [
  { header: 'Proyecto / Cliente', key: 'proyecto', width: 28 },
  { header: 'Tipo', key: 'tipo', width: 14 },
  { header: 'Fee mensual (€)', key: 'fee', width: 18 },
  { header: 'Horas presup. / mes', key: 'horasMes', width: 20 },
  { header: 'Horas asignadas semana', key: 'horasSemana', width: 22 },
  { header: 'Pacing horas (%)', key: 'pacing', width: 18 },
  { header: 'Coste semana est. (€)', key: 'costeSemana', width: 22 },
  { header: 'Margen mensual est. (€)', key: 'margen', width: 24 },
];
styleHeader(wsProyectos.getRow(1), EMERALD);
wsProyectos.autoFilter = 'A1:H1';

const proyectos = [
  ['Marca Alpha — Paid', 'Retainer', 4500, 60],
  ['Marca Alpha — Social', 'Retainer', 2000, 30],
  ['Marca Beta — Web', 'Proyecto', 8000, 100],
  ['Marca Gamma — SEO', 'Retainer', 3000, 45],
  ['Marca Delta — Branding', 'Proyecto', 6000, 80],
  ['Interno — Formación', 'Interno', 0, 20],
  ['(Proyecto)', '(Tipo)', 0, 0],
  ['(Proyecto)', '(Tipo)', 0, 0],
];
proyectos.forEach((row, i) => {
  const rn = i + 2;
  const r = wsProyectos.addRow([row[0], row[1], row[2], row[3]]);

  r.getCell('horasSemana').value = { formula: `SUMIF(Asignacion!B:B,A${rn},Asignacion!D:D)` };
  r.getCell('pacing').value = { formula: `IFERROR(E${rn}/(D${rn}/4),0)` };
  r.getCell('pacing').numFmt = '0%';
  r.getCell('costeSemana').value = { formula: `IFERROR(SUMPRODUCT((Asignacion!B$2:B$200=A${rn})*Asignacion!D$2:D$200*VLOOKUP(Asignacion!A$2:A$200,Equipo!A:H,8,FALSE)),0)` };
  r.getCell('margen').value = { formula: `C${rn}-(G${rn}*4)` };
  r.getCell('fee').numFmt = '#,##0 €';
  r.getCell('costeSemana').numFmt = '#,##0 €';
  r.getCell('margen').numFmt = '#,##0 €';

  ['horasSemana', 'pacing', 'costeSemana', 'margen'].forEach((k) => protectFormula(r.getCell(k)));
  ['proyecto', 'tipo', 'fee', 'horasMes'].forEach((k) => unlockCell(r.getCell(k)));

  // Dropdown for "Tipo"
  r.getCell('tipo').dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: ['"Retainer,Proyecto,Interno"'],
    showErrorMessage: true,
    errorTitle: 'Tipo inválido',
    error: 'Usa: Retainer, Proyecto o Interno',
  };

  styleBody(r, i);
});

const prTotRow = proyectos.length + 2;
wsProyectos.getCell(`A${prTotRow}`).value = 'TOTALES';
wsProyectos.getCell(`A${prTotRow}`).font = { ...bodyFont, bold: true };
['C', 'D', 'E', 'G', 'H'].forEach((col) => {
  wsProyectos.getCell(`${col}${prTotRow}`).value = { formula: `SUM(${col}2:${col}${prTotRow - 1})` };
  wsProyectos.getCell(`${col}${prTotRow}`).font = { ...bodyFont, bold: true };
  if (['C', 'G', 'H'].includes(col)) wsProyectos.getCell(`${col}${prTotRow}`).numFmt = '#,##0 €';
  protectFormula(wsProyectos.getCell(`${col}${prTotRow}`));
});
wsProyectos.getRow(prTotRow).eachCell({ includeEmpty: false }, (c) => {
  c.border = thinBorder;
  c.fill = lightFill(EMERALD_LIGHT);
});

wsProyectos.addConditionalFormatting({
  ref: `H2:H${prTotRow - 1}`,
  rules: [{
    type: 'cellIs', operator: 'lessThan', formulae: [0], priority: 1,
    style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: ROSE_LIGHT } }, font: { color: { argb: ROSE }, bold: true } },
  }],
});
wsProyectos.addConditionalFormatting({
  ref: `F2:F${prTotRow - 1}`,
  rules: [
    { type: 'cellIs', operator: 'greaterThan', formulae: [1.2], priority: 2,
      style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: ROSE_LIGHT } }, font: { color: { argb: ROSE }, bold: true } } },
    { type: 'cellIs', operator: 'greaterThan', formulae: [1], priority: 3,
      style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_LIGHT } }, font: { color: { argb: AMBER }, bold: true } } },
  ],
});

const prNote = prTotRow + 2;
wsProyectos.mergeCells(`A${prNote}:H${prNote}`);
wsProyectos.getCell(`A${prNote}`).value = '📋 Las horas y costes se calculan desde "Asignación". El pacing compara horas asignadas esta semana con la media semanal presupuestada (horas mes ÷ 4). Margen negativo aparece en rojo.';
wsProyectos.getCell(`A${prNote}`).font = { size: 10, name: 'Calibri', color: { argb: '64748B' }, italic: true };
wsProyectos.getCell(`A${prNote}`).alignment = { wrapText: true };

await wsProyectos.protect('', {
  selectLockedCells: true,
  selectUnlockedCells: true,
  formatColumns: true,
  formatRows: true,
  sort: true,
  autoFilter: true,
  insertRows: true,
});

// ═══════════════════════════════════════════════════════════════
// 4) ASIGNACIÓN (2 semanas de datos)
// ═══════════════════════════════════════════════════════════════
const wsAsig = wb.addWorksheet('Asignacion', {
  views: [{ state: 'frozen', ySplit: 1, xSplit: 2, activeCell: 'C2' }],
  properties: { tabColor: { argb: AMBER } },
  pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
});
wsAsig.columns = [
  { header: 'Persona', key: 'persona', width: 22 },
  { header: 'Proyecto / Cliente', key: 'proyecto', width: 28 },
  { header: 'Semana', key: 'semana', width: 20 },
  { header: 'Horas asignadas', key: 'horas', width: 16 },
  { header: 'Notas', key: 'notas', width: 36 },
];
styleHeader(wsAsig.getRow(1), AMBER);
wsAsig.autoFilter = 'A1:E1';

// --- Semana 12 ---
const asigS12 = [
  ['Ana López', 'Marca Alpha — Paid', 'S12 (17-21 mar)', 16, 'Campaña Q1 — optimización'],
  ['Ana López', 'Marca Gamma — SEO', 'S12 (17-21 mar)', 8, 'Auditoría técnica'],
  ['Ana López', 'Marca Delta — Branding', 'S12 (17-21 mar)', 6, 'Apoyo estrategia paid'],
  ['Luis García', 'Marca Alpha — Social', 'S12 (17-21 mar)', 12, 'Creatividades mensuales'],
  ['Luis García', 'Marca Delta — Branding', 'S12 (17-21 mar)', 14, 'Identidad visual fase 2'],
  ['Luis García', 'Marca Beta — Web', 'S12 (17-21 mar)', 6, 'Maquetación landing'],
  ['María Pérez', 'Marca Alpha — Paid', 'S12 (17-21 mar)', 10, 'Seguimiento semanal cliente'],
  ['María Pérez', 'Marca Alpha — Social', 'S12 (17-21 mar)', 6, 'Revisión calendario'],
  ['María Pérez', 'Marca Beta — Web', 'S12 (17-21 mar)', 8, 'Coordinación dev + diseño'],
  ['María Pérez', 'Marca Gamma — SEO', 'S12 (17-21 mar)', 5, 'Revisión entregas'],
  ['Carlos Ruiz', 'Marca Gamma — SEO', 'S12 (17-21 mar)', 20, 'Contenidos + linkbuilding'],
  ['Carlos Ruiz', 'Marca Alpha — Paid', 'S12 (17-21 mar)', 8, 'Copy landing pages'],
  ['Carlos Ruiz', 'Interno — Formación', 'S12 (17-21 mar)', 3, 'Documentar procesos SEO'],
  ['Elena Martín', 'Marca Alpha — Social', 'S12 (17-21 mar)', 18, 'Publicaciones + community'],
  ['Elena Martín', 'Marca Delta — Branding', 'S12 (17-21 mar)', 10, 'Tono de voz y guidelines'],
  ['Elena Martín', 'Interno — Formación', 'S12 (17-21 mar)', 4, 'Herramientas scheduling'],
  ['Jorge Navarro', 'Marca Beta — Web', 'S12 (17-21 mar)', 30, 'Desarrollo frontend sprint 3'],
  ['Jorge Navarro', 'Interno — Formación', 'S12 (17-21 mar)', 4, 'Documentar componentes'],
  ['Sara Díaz', 'Marca Alpha — Paid', 'S12 (17-21 mar)', 6, 'Dirección de cuenta'],
  ['Sara Díaz', 'Marca Beta — Web', 'S12 (17-21 mar)', 4, 'Revisión estratégica'],
  ['Sara Díaz', 'Marca Delta — Branding', 'S12 (17-21 mar)', 6, 'Dirección creativa'],
  ['Sara Díaz', 'Interno — Formación', 'S12 (17-21 mar)', 8, 'Onboarding Pablo'],
  ['Pablo Torres', 'Marca Alpha — Social', 'S12 (17-21 mar)', 10, 'Diseño posts redes'],
  ['Pablo Torres', 'Marca Delta — Branding', 'S12 (17-21 mar)', 12, 'Mockups bajo supervisión'],
  ['Pablo Torres', 'Interno — Formación', 'S12 (17-21 mar)', 4, 'Formación design system'],
];

// --- Semana 13 (variaciones realistas) ---
const asigS13 = [
  ['Ana López', 'Marca Alpha — Paid', 'S13 (24-28 mar)', 14, 'Reporting mensual Q1'],
  ['Ana López', 'Marca Gamma — SEO', 'S13 (24-28 mar)', 10, 'Implementar auditoría'],
  ['Ana López', 'Marca Beta — Web', 'S13 (24-28 mar)', 8, 'Campaña lanzamiento web'],
  ['Luis García', 'Marca Alpha — Social', 'S13 (24-28 mar)', 10, 'Ajustes creatividades'],
  ['Luis García', 'Marca Delta — Branding', 'S13 (24-28 mar)', 16, 'Entrega identidad visual'],
  ['Luis García', 'Marca Beta — Web', 'S13 (24-28 mar)', 8, 'Diseño páginas internas'],
  ['María Pérez', 'Marca Alpha — Paid', 'S13 (24-28 mar)', 8, 'Cierre reporting marzo'],
  ['María Pérez', 'Marca Beta — Web', 'S13 (24-28 mar)', 12, 'Coordinación lanzamiento'],
  ['María Pérez', 'Marca Gamma — SEO', 'S13 (24-28 mar)', 6, 'Seguimiento mensual'],
  ['Carlos Ruiz', 'Marca Gamma — SEO', 'S13 (24-28 mar)', 18, 'Redacción contenidos abril'],
  ['Carlos Ruiz', 'Marca Beta — Web', 'S13 (24-28 mar)', 10, 'Textos web + SEO on-page'],
  ['Carlos Ruiz', 'Interno — Formación', 'S13 (24-28 mar)', 3, 'Sesión equipo IA + SEO'],
  ['Elena Martín', 'Marca Alpha — Social', 'S13 (24-28 mar)', 16, 'Calendario abril + programación'],
  ['Elena Martín', 'Marca Delta — Branding', 'S13 (24-28 mar)', 12, 'Lanzamiento tono de voz'],
  ['Elena Martín', 'Marca Beta — Web', 'S13 (24-28 mar)', 4, 'Social para lanzamiento web'],
  ['Jorge Navarro', 'Marca Beta — Web', 'S13 (24-28 mar)', 32, 'Sprint 4 — bug fixing + deploy'],
  ['Jorge Navarro', 'Interno — Formación', 'S13 (24-28 mar)', 2, 'Code review Pablo'],
  ['Sara Díaz', 'Marca Alpha — Paid', 'S13 (24-28 mar)', 4, 'Revisión resultados Q1'],
  ['Sara Díaz', 'Marca Beta — Web', 'S13 (24-28 mar)', 8, 'Go-live coordinación'],
  ['Sara Díaz', 'Marca Delta — Branding', 'S13 (24-28 mar)', 6, 'Presentación cliente'],
  ['Sara Díaz', 'Interno — Formación', 'S13 (24-28 mar)', 6, 'Onboarding Pablo (cierre)'],
  ['Pablo Torres', 'Marca Alpha — Social', 'S13 (24-28 mar)', 8, 'Diseño stories + reels'],
  ['Pablo Torres', 'Marca Delta — Branding', 'S13 (24-28 mar)', 14, 'Aplicaciones marca'],
  ['Pablo Torres', 'Interno — Formación', 'S13 (24-28 mar)', 3, 'Práctica Figma'],
];

// Personas list for dropdown validation (quoted comma-separated)
const personaNames = equipo.slice(0, 8).map((e) => e[0]);
const personaList = `"${personaNames.join(',')}"`;
const proyectoNames = proyectos.slice(0, 6).map((p) => p[0]);
const proyectoList = `"${proyectoNames.join(',')}"`;

const allAsig = [...asigS12, ...asigS13];
allAsig.forEach((row, i) => {
  const r = wsAsig.addRow(row);
  // Data validation dropdowns
  r.getCell('persona').dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [personaList],
    showErrorMessage: true,
    errorTitle: 'Persona no encontrada',
    error: 'Selecciona una persona de la lista o escribe el nombre exacto como aparece en la hoja "Equipo".',
  };
  r.getCell('proyecto').dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [proyectoList],
    showErrorMessage: true,
    errorTitle: 'Proyecto no encontrado',
    error: 'Selecciona un proyecto de la lista o escribe el nombre exacto como aparece en la hoja "Proyectos".',
  };
  unlockCell(r.getCell('persona'));
  unlockCell(r.getCell('proyecto'));
  unlockCell(r.getCell('semana'));
  unlockCell(r.getCell('horas'));
  unlockCell(r.getCell('notas'));
  styleBody(r, i);
});

// Add 20 extra rows with dropdowns ready for user input
for (let i = 0; i < 20; i++) {
  const r = wsAsig.addRow([]);
  r.getCell('persona').dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [personaList],
  };
  r.getCell('proyecto').dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [proyectoList],
  };
  unlockCell(r.getCell('persona'));
  unlockCell(r.getCell('proyecto'));
  unlockCell(r.getCell('semana'));
  unlockCell(r.getCell('horas'));
  unlockCell(r.getCell('notas'));
}

const asNote = allAsig.length + 22;
wsAsig.mergeCells(`A${asNote}:E${asNote}`);
wsAsig.getCell(`A${asNote}`).value = '📋 Una fila por bloque persona + proyecto + semana. Usa los desplegables para evitar errores. Las filas vacías de abajo tienen los desplegables listos.';
wsAsig.getCell(`A${asNote}`).font = { size: 10, name: 'Calibri', color: { argb: '64748B' }, italic: true };
wsAsig.getCell(`A${asNote}`).alignment = { wrapText: true };

await wsAsig.protect('', {
  selectLockedCells: true,
  selectUnlockedCells: true,
  formatColumns: true,
  formatRows: true,
  sort: true,
  autoFilter: true,
  insertRows: true,
});

// ═══════════════════════════════════════════════════════════════
// 5) INSIGHTS
// ═══════════════════════════════════════════════════════════════
const wsInsights = wb.addWorksheet('Insights', {
  views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
  properties: { tabColor: { argb: VIOLET } },
  pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
});
wsInsights.columns = [
  { header: 'Persona', key: 'persona', width: 22 },
  { header: 'Departamento', key: 'depto', width: 22 },
  { header: 'Cap. neta (h)', key: 'neta', width: 16 },
  { header: 'H. asignadas', key: 'asignadas', width: 14 },
  { header: 'H. libres', key: 'libres', width: 12 },
  { header: 'Utilización', key: 'utilizacion', width: 14 },
  { header: 'Estado', key: 'estado', width: 20 },
  { header: 'Coste sem. (€)', key: 'coste', width: 16 },
  { header: 'Nº proyectos', key: 'numProy', width: 14 },
];
styleHeader(wsInsights.getRow(1), VIOLET);
wsInsights.autoFilter = 'A1:I1';

const personas = equipo.slice(0, 8).map((e) => e[0]);
personas.forEach((nombre, i) => {
  const rn = i + 2;
  const eqRow = i + 2;
  const r = wsInsights.addRow([nombre]);

  r.getCell('depto').value = { formula: `Equipo!B${eqRow}` };
  r.getCell('neta').value = { formula: `Equipo!G${eqRow}` };
  r.getCell('asignadas').value = { formula: `SUMIF(Asignacion!A:A,A${rn},Asignacion!D:D)` };
  r.getCell('libres').value = { formula: `C${rn}-D${rn}` };
  r.getCell('utilizacion').value = { formula: `IFERROR(D${rn}/C${rn},0)` };
  r.getCell('utilizacion').numFmt = '0%';
  r.getCell('estado').value = { formula: `IF(F${rn}>=1,"⛔ SOBRECARGA",IF(F${rn}>0.9,"⚠️ RIESGO",IF(F${rn}>0.7,"✅ ÓPTIMO","💤 BAJA CARGA")))` };
  r.getCell('coste').value = { formula: `D${rn}*Equipo!H${eqRow}` };
  r.getCell('coste').numFmt = '#,##0 €';
  r.getCell('numProy').value = { formula: `COUNTIF(Asignacion!A:A,A${rn})` };

  // All cells in Insights are formula-driven
  r.eachCell({ includeEmpty: false }, (c) => protectFormula(c));

  styleBody(r, i);
});

wsInsights.addConditionalFormatting({
  ref: `F2:F${personas.length + 1}`,
  rules: [
    { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: [1], priority: 1,
      style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: ROSE_LIGHT } }, font: { color: { argb: ROSE }, bold: true } } },
    { type: 'cellIs', operator: 'greaterThan', formulae: [0.9], priority: 2,
      style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_LIGHT } }, font: { color: { argb: AMBER }, bold: true } } },
    { type: 'cellIs', operator: 'greaterThan', formulae: [0.7], priority: 3,
      style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD_LIGHT } }, font: { color: { argb: EMERALD } } } },
  ],
});

const inTotRow = personas.length + 2;
wsInsights.getCell(`A${inTotRow}`).value = 'TOTALES / MEDIA';
wsInsights.getCell(`A${inTotRow}`).font = { ...bodyFont, bold: true };
wsInsights.getCell(`C${inTotRow}`).value = { formula: `SUM(C2:C${inTotRow - 1})` };
wsInsights.getCell(`D${inTotRow}`).value = { formula: `SUM(D2:D${inTotRow - 1})` };
wsInsights.getCell(`E${inTotRow}`).value = { formula: `SUM(E2:E${inTotRow - 1})` };
wsInsights.getCell(`F${inTotRow}`).value = { formula: `IFERROR(D${inTotRow}/C${inTotRow},0)` };
wsInsights.getCell(`F${inTotRow}`).numFmt = '0%';
wsInsights.getCell(`H${inTotRow}`).value = { formula: `SUM(H2:H${inTotRow - 1})` };
wsInsights.getCell(`H${inTotRow}`).numFmt = '#,##0 €';
wsInsights.getCell(`I${inTotRow}`).value = { formula: `SUM(I2:I${inTotRow - 1})` };
wsInsights.getRow(inTotRow).eachCell({ includeEmpty: false }, (c) => {
  c.border = thinBorder;
  c.fill = lightFill(INDIGO_LIGHT);
  c.font = { ...bodyFont, bold: true };
  protectFormula(c);
});

// KPIs
const kpi = inTotRow + 2;
wsInsights.getCell(`A${kpi}`).value = '📊 KPIs DE LA SEMANA';
wsInsights.getCell(`A${kpi}`).font = { bold: true, size: 13, name: 'Calibri', color: { argb: INDIGO } };

const kpis = [
  ['Utilización media del equipo', { formula: `F${inTotRow}` }, '0%'],
  ['Personas en riesgo o sobrecarga', { formula: `COUNTIF(F2:F${inTotRow - 1},">"&0.9)` }, '0'],
  ['Horas libres totales del equipo', { formula: `E${inTotRow}` }, '0'],
  ['Coste semanal total del equipo', { formula: `H${inTotRow}` }, '#,##0 €'],
  ['Impuesto Excel estimado (4h PM/sem)', { formula: `4*Equipo!H4` }, '#,##0 €'],
  ['Impuesto Excel anual estimado', { formula: `4*Equipo!H4*52` }, '#,##0 €'],
];
kpis.forEach(([label, value, fmt], i) => {
  const row = kpi + 1 + i;
  wsInsights.getCell(`A${row}`).value = label;
  wsInsights.getCell(`A${row}`).font = bodyFont;
  wsInsights.getCell(`B${row}`).value = value;
  wsInsights.getCell(`B${row}`).numFmt = fmt;
  wsInsights.getCell(`B${row}`).font = { ...bodyFont, bold: true, size: 14 };
  if (label.includes('Impuesto')) {
    wsInsights.getCell(`B${row}`).font = { ...bodyFont, bold: true, size: 14, color: { argb: ROSE } };
  }
  protectFormula(wsInsights.getCell(`B${row}`));
});

await wsInsights.protect('', {
  selectLockedCells: true,
  selectUnlockedCells: true,
  formatColumns: true,
  formatRows: true,
  sort: true,
  autoFilter: true,
});

await wb.xlsx.writeFile(outFile);
console.log('Wrote', outFile);
