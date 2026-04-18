import type { AgencySettings, CommonExpenseAllocation, CommonExpenseEntry, DepartmentDefinition } from '@/types';
import { employeeBelongsToDepartment } from '@/utils/departmentUtils';

/** Tolerancia en puntos porcentuales para la suma de `split_percent` (redondeo). */
export const SPLIT_PERCENT_TOLERANCE_PP = 0.5;

export function validateSplitPercentParts(parts: ReadonlyArray<{ percent: number }>): {
  ok: boolean;
  sum: number;
} {
  const sum = parts.reduce((s, p) => s + p.percent, 0);
  const ok = sum >= 100 - SPLIT_PERCENT_TOLERANCE_PP && sum <= 100 + SPLIT_PERCENT_TOLERANCE_PP;
  return { ok, sum };
}

export interface AllocateCommonExpensesEmployeeRow {
  id: string;
  department?: string;
  departmentId?: string;
}

export interface AllocateCommonExpensesParams {
  entries: ReadonlyArray<CommonExpenseEntry>;
  employees: ReadonlyArray<AllocateCommonExpensesEmployeeRow>;
  departments: ReadonlyArray<DepartmentDefinition>;
  /** Horas totales del mes por empleado (ámbito agencia, mismo criterio que el modo de la página). */
  getEmployeeHours: (employeeId: string) => number;
  /**
   * Nómina mensual del empleado (€/mes). Usado por líneas con `distribution: 'byPayroll'`.
   * Si no se proporciona, `byPayroll` se comporta como `byHours` (compatibilidad hacia atrás).
   */
  getEmployeePayroll?: (employeeId: string) => number;
}

export interface AllocateCommonExpensesSuccess {
  ok: true;
  overheadByEmployee: Map<string, number>;
  totalOverheadApplied: number;
  totalConfiguredAmount: number;
  /** Con gasto configurado y al menos un empleado con horas > 0, empleados en agencia con 0 h. */
  employeeIdsZeroHoursWithPeersWorking: string[];
}

export interface AllocateCommonExpensesFailure {
  ok: false;
  code: 'NEGATIVE_AMOUNT' | 'SPLIT_SUM_OUT_OF_RANGE';
  entryId?: string;
  splitSum?: number;
}

export type AllocateCommonExpensesResult = AllocateCommonExpensesSuccess | AllocateCommonExpensesFailure;

function resolveDepartment(
  departmentId: string,
  departments: ReadonlyArray<DepartmentDefinition>
): DepartmentDefinition | null {
  return (
    departments.find(d => d.id === departmentId || d.name === departmentId) ?? null
  );
}

function employeesInDepartment(
  departmentId: string,
  departments: ReadonlyArray<DepartmentDefinition>,
  employees: ReadonlyArray<AllocateCommonExpensesEmployeeRow>
): AllocateCommonExpensesEmployeeRow[] {
  const dept = resolveDepartment(departmentId, departments);
  if (!dept) return [];
  return employees.filter(e =>
    employeeBelongsToDepartment(e.department ?? e.departmentId, dept.id, dept.name)
  );
}

/**
 * Reparte `amount` entre empleados usando un peso por empleado.
 * - Si `includeZero=false`, descarta empleados con peso 0.
 * - Si `includeZero=true`, los incluye con peso 1 cuando el peso es 0 sólo si es el único elegible (nunca — se usa en `byHeadcount` con peso siempre 1).
 * - Si el total de pesos es 0, no asigna nada.
 * - El último destinatario absorbe el resto de redondeo para que la suma sea exacta.
 */
function addProportional(
  acc: Map<string, number>,
  amount: number,
  emps: ReadonlyArray<AllocateCommonExpensesEmployeeRow>,
  getWeight: (employeeId: string) => number,
  includeZero: boolean
): void {
  if (amount <= 0) return;
  const eligible = includeZero ? emps.slice() : emps.filter(e => getWeight(e.id) > 0);
  const totalW = eligible.reduce((s, e) => s + getWeight(e.id), 0);
  if (totalW <= 0) return;

  let assigned = 0;
  for (let i = 0; i < eligible.length; i++) {
    const e = eligible[i];
    const w = getWeight(e.id);
    const isLast = i === eligible.length - 1;
    const share = isLast
      ? Math.round((amount - assigned) * 100) / 100
      : Math.round(((amount * w) / totalW) * 100) / 100;
    assigned += share;
    acc.set(e.id, (acc.get(e.id) ?? 0) + share);
  }
}

function splitAmountsByPercent(
  total: number,
  parts: ReadonlyArray<{ departmentId: string; percent: number }>
): { departmentId: string; amount: number }[] {
  if (parts.length === 0) return [];
  const out: { departmentId: string; amount: number }[] = [];
  let acc = 0;
  for (let i = 0; i < parts.length; i++) {
    const isLast = i === parts.length - 1;
    const slice = isLast
      ? Math.round((total - acc) * 100) / 100
      : Math.round(total * (parts[i].percent / 100) * 100) / 100;
    acc += slice;
    out.push({ departmentId: parts[i].departmentId, amount: slice });
  }
  return out;
}

/**
 * Calcula el overhead de gastos comunes por empleado. Sin efectos secundarios.
 */
/** Alinea ids de departamento en entradas guardadas (legacy por nombre o id antiguo). Llamar al leer y antes de persistir. */
export function normalizeCommonExpenseEntriesDepartments(
  entries: CommonExpenseEntry[] | undefined,
  departments: ReadonlyArray<DepartmentDefinition>
): CommonExpenseEntry[] {
  if (!entries?.length) return [];
  const resolve = (id: string): string => {
    const d = departments.find(x => x.id === id || x.name === id);
    return d?.id ?? id;
  };
  const normAlloc = (allocation: CommonExpenseAllocation): CommonExpenseAllocation => {
    if (allocation.type === 'department') {
      return { type: 'department', departmentId: resolve(allocation.departmentId) };
    }
    if (allocation.type === 'split_percent') {
      return {
        type: 'split_percent',
        parts: allocation.parts.map(p => ({
          ...p,
          departmentId: resolve(p.departmentId),
        })),
      };
    }
    return allocation;
  };
  return entries.map(e => ({ ...e, allocation: normAlloc(e.allocation) }));
}

const YYYY_MM = /^\d{4}-\d{2}$/;

/** Líneas efectivas para un mes: recurrentes aplicables + líneas solo de ese mes. */
export function collectCommonExpenseEntriesForMonth(
  settings: Pick<AgencySettings, 'commonExpensesByMonth' | 'commonExpensesRecurring'> | undefined,
  monthKey: string,
  departments: ReadonlyArray<DepartmentDefinition>
): CommonExpenseEntry[] {
  const byMonthRaw = settings?.commonExpensesByMonth?.[monthKey] ?? [];
  const recurringRaw = (settings?.commonExpensesRecurring ?? []).filter(e => {
    const from = e.recurringFromMonth;
    if (!from || !YYYY_MM.test(from)) return false;
    if (from > monthKey) return false;
    const until = e.recurringUntilMonth;
    if (until && YYYY_MM.test(until) && until < monthKey) return false;
    return true;
  });
  const byMonth = normalizeCommonExpenseEntriesDepartments(byMonthRaw, departments).map(e => {
    const { recurringFromMonth: _f, recurringUntilMonth: _u, ...rest } = e;
    return rest;
  });
  const recurring = normalizeCommonExpenseEntriesDepartments(recurringRaw, departments);
  return [...recurring, ...byMonth];
}

type DistributionMode = NonNullable<CommonExpenseEntry['distribution']>;

/** Aplica un importe sobre un subconjunto de empleados según el modo de reparto. */
function distributeAmount(
  acc: Map<string, number>,
  amount: number,
  emps: ReadonlyArray<AllocateCommonExpensesEmployeeRow>,
  mode: DistributionMode,
  getEmployeeHours: (id: string) => number,
  getEmployeePayroll: (id: string) => number
): void {
  if (amount <= 0 || emps.length === 0) return;
  if (mode === 'byHeadcount') {
    addProportional(acc, amount, emps, () => 1, true);
    return;
  }
  if (mode === 'byPayroll') {
    addProportional(acc, amount, emps, id => getEmployeePayroll(id), false);
    return;
  }
  addProportional(acc, amount, emps, id => getEmployeeHours(id), false);
}

export function allocateCommonExpenses(
  params: AllocateCommonExpensesParams
): AllocateCommonExpensesResult {
  const { entries, employees, departments, getEmployeeHours } = params;
  const getPayrollFn = params.getEmployeePayroll ?? (() => 0);

  const overheadByEmployee = new Map<string, number>();
  for (const e of employees) {
    overheadByEmployee.set(e.id, 0);
  }

  let totalConfiguredAmount = 0;
  let allEntriesAreByHours = true;

  for (const entry of entries) {
    if (entry.amount < 0) {
      return { ok: false, code: 'NEGATIVE_AMOUNT', entryId: entry.id };
    }
    totalConfiguredAmount += entry.amount;
    if (entry.amount === 0) continue;

    const mode: DistributionMode = entry.distribution ?? 'byHours';
    if (mode !== 'byHours') allEntriesAreByHours = false;

    const { allocation } = entry;

    if (allocation.type === 'global') {
      distributeAmount(overheadByEmployee, entry.amount, employees, mode, getEmployeeHours, getPayrollFn);
      continue;
    }

    if (allocation.type === 'department') {
      const inDept = employeesInDepartment(allocation.departmentId, departments, employees);
      distributeAmount(overheadByEmployee, entry.amount, inDept, mode, getEmployeeHours, getPayrollFn);
      continue;
    }

    if (allocation.type === 'split_percent') {
      const { ok, sum } = validateSplitPercentParts(allocation.parts);
      if (!ok) {
        return {
          ok: false,
          code: 'SPLIT_SUM_OUT_OF_RANGE',
          entryId: entry.id,
          splitSum: sum,
        };
      }
      const slices = splitAmountsByPercent(entry.amount, allocation.parts);
      for (const { departmentId, amount: slice } of slices) {
        const inDept = employeesInDepartment(departmentId, departments, employees);
        distributeAmount(overheadByEmployee, slice, inDept, mode, getEmployeeHours, getPayrollFn);
      }
    }
  }

  let totalOverheadApplied = 0;
  for (const v of overheadByEmployee.values()) {
    totalOverheadApplied += v;
  }
  totalOverheadApplied = Math.round(totalOverheadApplied * 100) / 100;

  // Solo emitimos el aviso de "empleados con 0h recibiendo 0€" si todas las líneas usan `byHours`.
  // Con `byHeadcount` o `byPayroll` ya se reparte sobre ellos, así que no hay hueco que avisar.
  const hasPositiveHours = employees.some(e => getEmployeeHours(e.id) > 0);
  const hasConfiguredExpenses = entries.some(e => e.amount > 0);
  const employeeIdsZeroHoursWithPeersWorking: string[] = [];
  if (hasConfiguredExpenses && hasPositiveHours && allEntriesAreByHours) {
    for (const e of employees) {
      if (getEmployeeHours(e.id) <= 0) {
        employeeIdsZeroHoursWithPeersWorking.push(e.id);
      }
    }
  }

  return {
    ok: true,
    overheadByEmployee,
    totalOverheadApplied,
    totalConfiguredAmount,
    employeeIdsZeroHoursWithPeersWorking,
  };
}
