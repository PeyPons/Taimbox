import type { Employee } from '@/types';

/** Capacidad teórica mensual fallback cuando no hay weekly capacity (modelo operativo). */
export const DEFAULT_MONTHLY_HOURS = 110;

/** Horas base sobre las que se calcula el coste/h estándar (capacidad teórica del mes). */
export function getStandardMonthlyCapacity(emp: Employee | undefined): number {
  if (!emp) return DEFAULT_MONTHLY_HOURS;
  const monthly = (emp.defaultWeeklyCapacity || 0) * 4.33;
  return monthly > 0 ? monthly : DEFAULT_MONTHLY_HOURS;
}

function monthlyPayroll(emp: Employee | undefined): number {
  if (!emp) return 0;
  const v = emp.monthlyCost ?? emp.hourlyRate;
  return v != null && v > 0 ? v : 0;
}

/** Coste hora estándar: nómina mensual / capacidad teórica mensual (modelo operativo). */
export function getStandardHourlyCost(emp: Employee | undefined): number {
  const payroll = monthlyPayroll(emp);
  if (payroll <= 0) return 0;
  const denom = getStandardMonthlyCapacity(emp);
  return payroll / denom;
}

/** Coste de una fila: modo estándar (horas × coste/h) o dinámico (prorrateo nómina por horas del mes). */
export function getRowCost(
  emp: Employee | undefined,
  hoursDisplay: number,
  totalHEmployeeInMode: number,
  costMode: 'standard' | 'dynamic'
): number {
  const monthly = emp ? monthlyPayroll(emp) : 0;
  if (costMode === 'standard') {
    return hoursDisplay * getStandardHourlyCost(emp);
  }
  return totalHEmployeeInMode > 0 ? monthly * (hoursDisplay / totalHEmployeeInMode) : 0;
}

/** Prorrateo de overhead del empleado a una fila; denominador = horas globales del mes (agencia). */
export function overheadShareForRow(
  employeeId: string,
  hoursDisplay: number,
  totalHoursGlobalForEmployee: number,
  overheadByEmployee: ReadonlyMap<string, number>
): number {
  if (totalHoursGlobalForEmployee <= 0) return 0;
  const oh = overheadByEmployee.get(employeeId) ?? 0;
  return oh * (hoursDisplay / totalHoursGlobalForEmployee);
}

/** Listados de rentabilidad por empleado: solo activos con horas > 0 en el modo actual. */
export function filterEmployeeProfitabilityRowsForDisplay<
  T extends { employeeId: string; totalComputed: number; totalActual: number },
>(rows: T[], employees: Employee[], hoursMode: 'actual' | 'computed'): T[] {
  const employeeById = new Map(employees.map((e) => [e.id, e]));
  return rows.filter((row) => {
    const emp = employeeById.get(row.employeeId);
    if (!emp?.isActive) return false;
    const hours = hoursMode === 'computed' ? row.totalComputed : row.totalActual;
    return hours > 0;
  });
}
