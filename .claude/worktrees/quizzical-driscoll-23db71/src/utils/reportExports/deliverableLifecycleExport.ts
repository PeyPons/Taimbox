import { format } from 'date-fns';
import type { Client, Project } from '@/types';
import type { DeliverableLifecycle } from '@/utils/deliverableLifecycle';
import type { PrivacyAnonymizer } from '@/lib/privacyDemoAnonymizer';
import { getLifecycleStatusClasses } from '@/utils/deliverableLifecycleStatus';

function escapeCsvCell(value: string): string {
    if (value.includes('"') || value.includes(';') || value.includes('\n') || value.includes('\r')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export function buildDeliverableLifecycleCsv(args: {
    agencyName: string;
    projects: Project[];
    clients: Client[];
    lifecycles: Map<string, DeliverableLifecycle>;
    privacyAnonymizer?: PrivacyAnonymizer;
}): string {
    const { agencyName, projects, clients, lifecycles, privacyAnonymizer } = args;
    const genAt = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    const clientName = (id: string) => {
        const c = clients.find((x) => x.id === id);
        const n = c?.name ?? '';
        return privacyAnonymizer ? privacyAnonymizer.account(id) : n;
    };
    const projectName = (p: Project) =>
        privacyAnonymizer ? privacyAnonymizer.project(p.id) : p.name;

    const headers = [
        'Agencia',
        'Generado',
        'Proyecto',
        'Cliente',
        'Fase inicio',
        'Fase fin',
        'Horas consumidas',
        'Horas techo',
        'Pct consumido',
        'Pct esperado',
        'Coste hasta hoy',
        'Ingreso contrato',
        'Ingreso devengado',
        'Margen EUR',
        'Margen pct',
        'Estado vida',
    ];

    const rows: string[][] = [headers];

    for (const p of projects) {
        const lc = lifecycles.get(p.id);
        if (!lc || lc.status === 'no-phase') continue;
        const ph = lc.phase;
        const pctExp =
            ph && ph.totalDays > 0
                ? String(Math.round((lc.pacing.daysElapsed / ph.totalDays) * 1000) / 10)
                : '';
        const st = getLifecycleStatusClasses(lc.status).label;
        rows.push([
            agencyName,
            genAt,
            projectName(p),
            clientName(p.clientId),
            ph ? format(ph.start, 'yyyy-MM-dd') : '',
            ph ? format(ph.due, 'yyyy-MM-dd') : '',
            String(lc.hours.computed),
            String(lc.hours.budget),
            String(lc.hours.pctConsumed),
            pctExp,
            String(lc.finance.costToDate),
            String(lc.finance.contractFee),
            String(lc.finance.revenueAccrued),
            lc.finance.marginAbsolute != null ? String(lc.finance.marginAbsolute) : '',
            lc.finance.marginPct != null ? String(lc.finance.marginPct) : '',
            st,
        ]);
    }

    return rows.map((r) => r.map((c) => escapeCsvCell(c)).join(';')).join('\r\n');
}
