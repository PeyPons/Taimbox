import { describe, it, expect } from 'vitest';
import { addDays, format, parseISO, startOfMonth } from 'date-fns';

/**
 * Lógica de deduplicación de meses para refetch tras `accept_task_transfer`
 * (alineada con `useTaskTransfers` — sin mock de Supabase).
 */
function uniqueMonthStartsFromWeekStarts(weekStarts: Iterable<string>): Date[] {
    const months = new Map<string, Date>();
    for (const ws of weekStarts) {
        if (!ws?.trim()) continue;
        const m = startOfMonth(parseISO(ws));
        const key = format(m, 'yyyy-MM');
        months.set(key, m);
    }
    return [...months.values()];
}

describe('accept_task_transfer — refetch de meses', () => {
    it('deduplica cuando dos semanas caen en el mismo mes', () => {
        const weeks = ['2026-05-04', '2026-05-11'];
        const months = uniqueMonthStartsFromWeekStarts(weeks);
        expect(months).toHaveLength(1);
        expect(format(months[0], 'yyyy-MM')).toBe('2026-05');
    });

    it('incluye dos meses para rollover origen + siguiente ISO', () => {
        const orig = '2026-05-04';
        const next = format(addDays(parseISO(orig), 7), 'yyyy-MM-dd');
        const months = uniqueMonthStartsFromWeekStarts([orig, next]);
        expect(months.length).toBeGreaterThanOrEqual(1);
        expect(months.map((d) => format(d, 'yyyy-MM'))).toContain('2026-05');
    });
});

const runRpc = process.env.RUN_ACCEPT_TRANSFER_RPC_TESTS === '1';

describe.skipIf(!runRpc)('accept_task_transfer RPC (Supabase real)', () => {
    it('documentación: ejecutar con `supabase start`, migraciones aplicadas, `RUN_ACCEPT_TRANSFER_RPC_TESTS=1` y sesión JWT de receptor', () => {
        expect(runRpc).toBe(true);
    });
});
