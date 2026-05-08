import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseISO } from 'date-fns';
import { computeBuildRentabilityDiagnosticParams } from '@/utils/reportExports/financialHealthExportCompute';
import type { Allocation, Client, Employee, Project } from '@/types';

const client = (id: string, name: string): Client => ({
  id,
  agencyId: 'a1',
  name,
  color: '#111',
});

const baseEmployee = (): Employee => ({
  id: 'e1',
  agencyId: 'a1',
  name: 'Emp',
  role: 'dev',
  defaultWeeklyCapacity: 40,
  workSchedule: {
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 0,
    sunday: 0,
  },
  isActive: true,
  monthlyCost: 4000,
});

const baseProject = (over: Partial<Project> = {}): Project => ({
  id: 'p-alpha',
  agencyId: 'a1',
  clientId: 'c-alpha',
  name: 'Alpha branding',
  status: 'active',
  budgetHours: 80,
  monthlyFee: 3000,
  ...over,
});

describe('computeBuildRentabilityDiagnosticParams', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('filtra proyectos por texto de búsqueda (nombre de proyecto o cliente)', () => {
    const clients = [client('c-alpha', 'Acme SL'), client('c-beta', 'Other Corp')];
    const projects: Project[] = [
      baseProject({
        id: 'p-alpha',
        clientId: 'c-alpha',
        name: 'Alpha branding zz_unique_search_token',
      }),
      baseProject({
        id: 'p-beta',
        clientId: 'c-beta',
        name: 'Beta ops',
      }),
    ];
    const allocations: Allocation[] = [
      {
        id: 'a1',
        employeeId: 'e1',
        projectId: 'p-alpha',
        weekStartDate: '2026-05-04',
        hoursAssigned: 10,
        hoursActual: 10,
        hoursComputed: 10,
        status: 'completed',
      },
      {
        id: 'a2',
        employeeId: 'e1',
        projectId: 'p-beta',
        weekStartDate: '2026-05-11',
        hoursAssigned: 10,
        hoursActual: 10,
        hoursComputed: 10,
        status: 'completed',
      },
    ];
    const month = parseISO('2026-05-01');
    const sinBusqueda = computeBuildRentabilityDiagnosticParams({
      currentMonth: month,
      allocations,
      projects,
      clients,
      employees: [baseEmployee()],
      deadlinesForMonth: [
        { projectId: 'p-alpha', month: '2026-05' },
        { projectId: 'p-beta', month: '2026-05' },
      ],
      selectedDepartmentId: null,
      agency: {
        id: 'a1',
        name: 'Agencia',
        settings: {},
      },
      hoursMode: 'computed',
      costMode: 'standard',
      searchQuery: '',
    });
    const conBusqueda = computeBuildRentabilityDiagnosticParams({
      currentMonth: month,
      allocations,
      projects,
      clients,
      employees: [baseEmployee()],
      deadlinesForMonth: [
        { projectId: 'p-alpha', month: '2026-05' },
        { projectId: 'p-beta', month: '2026-05' },
      ],
      selectedDepartmentId: null,
      agency: {
        id: 'a1',
        name: 'Agencia',
        settings: {},
      },
      hoursMode: 'computed',
      costMode: 'standard',
      searchQuery: 'zz_unique_search_token',
    });
    expect(sinBusqueda.projectMetricsForView.map((p) => p.projectId).sort()).toEqual(['p-alpha', 'p-beta']);
    expect(conBusqueda.projectMetricsForView.map((p) => p.projectId)).toEqual(['p-alpha']);
  });

  it('si el ID de departamento no existe, no filtra métricas por área (comportamiento tolerante a datos)', () => {
    const clients = [client('c1', 'Cliente')];
    const projects = [baseProject({ id: 'p1', clientId: 'c1', name: 'Proyecto' })];
    const allocations: Allocation[] = [
      {
        id: 'a1',
        employeeId: 'e1',
        projectId: 'p1',
        weekStartDate: '2026-05-04',
        hoursAssigned: 5,
        hoursActual: 5,
        hoursComputed: 5,
        status: 'completed',
      },
    ];
    const month = parseISO('2026-05-01');
    const res = computeBuildRentabilityDiagnosticParams({
      currentMonth: month,
      allocations,
      projects,
      clients,
      employees: [{ ...baseEmployee(), department: 'legacy-dept' }],
      deadlinesForMonth: [{ projectId: 'p1', month: '2026-05' }],
      selectedDepartmentId: 'dept-inexistente',
      agency: {
        id: 'a1',
        name: 'Agencia',
        settings: {
          departments: [{ id: 'd-real', name: 'Real' }],
        },
      },
      hoursMode: 'actual',
      costMode: 'standard',
    });
    expect(res.projectMetricsForView.some((p) => p.projectId === 'p1')).toBe(true);
    expect(res.departmentNameForView).toBeNull();
  });

  it('en mes corriente con costMode dynamic y poco % del mes transcurrido, fuerza coste estándar (anti-picos)', () => {
    const clients = [client('c1', 'Cliente')];
    const projects = [baseProject({ id: 'p1', clientId: 'c1' })];
    const allocations: Allocation[] = [
      {
        id: 'a1',
        employeeId: 'e1',
        projectId: 'p1',
        weekStartDate: '2026-05-04',
        hoursAssigned: 2,
        hoursActual: 2,
        status: 'completed',
      },
    ];
    const month = parseISO('2026-05-01');
    const res = computeBuildRentabilityDiagnosticParams({
      currentMonth: month,
      allocations,
      projects,
      clients,
      employees: [baseEmployee()],
      deadlinesForMonth: [{ projectId: 'p1', month: '2026-05' }],
      selectedDepartmentId: null,
      agency: { id: 'a1', name: 'A', settings: {} },
      hoursMode: 'actual',
      costMode: 'dynamic',
    });
    expect(res.isViewingCurrentMonth).toBe(true);
    expect(res.dynamicCostFallbackActive).toBe(true);
    expect(res.effectiveCostMode).toBe('standard');
  });
});
