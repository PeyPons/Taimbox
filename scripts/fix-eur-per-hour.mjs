import fs from 'node:fs';

const path = 'src/pages/FinancialHealthPage.tsx';
let c = fs.readFileSync(path, 'utf8');

const headerReplacements = [
  ['>Margen (€)<', '>{`Margen ${inCurrencyParens}`}<'],
  ['>Ingr. (€)<', '>{`Ingr. ${inCurrencyParens}`}<'],
  ['>Ingreso atrib. (€)<', '>{`Ingreso atrib. ${inCurrencyParens}`}<'],
  ['>Coste (€)<', '>{`Coste ${inCurrencyParens}`}<'],
  ["? 'Ingreso devengado (€)' : 'Ingreso (Fee)'", "? `Ingreso devengado ${inCurrencyParens}` : 'Ingreso (Fee)'"],
  ["? 'Ingreso devengado (€)' : 'Fee (€)'", "? `Ingreso devengado ${inCurrencyParens}` : `Fee ${inCurrencyParens}`"],
  ['<dt className="text-slate-500 text-xs">Margen (€)</dt>', '<dt className="text-slate-500 text-xs">{`Margen ${inCurrencyParens}`}</dt>'],
  ['Proyectos con fee 0 € y actividad', 'Proyectos con fee 0 {currencySymbol} y actividad'],
];

for (const [from, to] of headerReplacements) {
  c = c.split(from).join(to);
}

// Tooltips: pass formatted per-hour instead of raw numbers
c = c.replace(
  /p: pHr\.toFixed\(2\),\s*\n\s*o: oHr\.toFixed\(2\),\s*\n\s*c: costPerHour\.toFixed\(2\),/g,
  'p: formatPerHour(pHr, 2),\n                                                                                      o: formatPerHour(oHr, 2),\n                                                                                      c: formatPerHour(costPerHour, 2),',
);
c = c.replace(
  /p: pHrTab\.toFixed\(2\),\s*\n\s*o: oHrTab\.toFixed\(2\),\s*\n\s*c: costPerHour\.toFixed\(2\),/g,
  'p: formatPerHour(pHrTab, 2),\n                                                                          o: formatPerHour(oHrTab, 2),\n                                                                          c: formatPerHour(costPerHour, 2),',
);

fs.writeFileSync(path, c);
console.log('remaining € in FinancialHealthPage:', (c.match(/€/g) || []).length);
