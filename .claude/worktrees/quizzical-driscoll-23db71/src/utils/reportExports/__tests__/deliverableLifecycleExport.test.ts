import { describe, it, expect } from 'vitest';
import { buildDeliverableLifecycleCsv } from '@/utils/reportExports/deliverableLifecycleExport';
import type { Project, Client } from '@/types';
import { PROJECT_TYPE_ENTREGABLE } from '@/config/projectTypePresets';
import type { DeliverableLifecycle } from '@/utils/deliverableLifecycle';

const project = (over: Partial<Project> = {}): Project => ({
    id: 'p1',
    agencyId: 'a',
    clientId: 'c1',
    name: 'Proj;Test',
    status: 'active',
    budgetHours: 100,
    monthlyFee: 10000,
    projectType: PROJECT_TYPE_ENTREGABLE,
    deliverableContractFee: 10000,
    deliverableStartDate: '2026-01-01',
    deliverableDueDate: '2026-01-31',
    ...over,
});

const client = (): Client => ({
    id: 'c1',
    agencyId: 'a',
    name: 'Client"A',
    color: '#000',
});

describe('buildDeliverableLifecycleCsv', () => {
    it('incluye cabeceras y escapa ; y comillas', () => {
        const start = new Date('2026-01-01');
        const due = new Date('2026-01-31');
        const lc: DeliverableLifecycle = {
            phase: { start, due, totalDays: 31 },
            hours: {
                planned: 0,
                actual: 0,
                computed: 10,
                budget: 100,
                available: 90,
                pctConsumed: 10,
            },
            pacing: {
                daysElapsed: 15,
                daysRemaining: 16,
                expectedHoursToDate: 48.39,
                deltaHours: -38.39,
                projectedAtDueDate: 20,
                isProjectedOverBudget: false,
            },
            finance: {
                contractFee: 10000,
                costToDate: 500,
                revenueAccrued: 4838.71,
                marginAbsolute: 4338.71,
                marginPct: 89.7,
                effectiveHourlyRate: 100,
                hasUnknownCostEmployees: false,
            },
            status: 'on-track',
        };
        const csv = buildDeliverableLifecycleCsv({
            agencyName: 'Agencia;SL',
            projects: [project({ name: 'Nombre;con' })],
            clients: [client()],
            lifecycles: new Map([['p1', lc]]),
        });
        expect(csv.split('\r\n')[0]).toContain('Proyecto');
        expect(csv).toContain('""');
        const dataLine = csv.split('\r\n')[1];
        expect(dataLine).toContain('Nombre;con');
    });
});
