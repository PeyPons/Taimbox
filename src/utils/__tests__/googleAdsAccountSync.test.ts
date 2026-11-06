import { describe, expect, it } from 'vitest';
import {
    collectMccClients,
    mergeGoogleSyncAccounts,
    type CustomerClientNode,
} from '../../../supabase/functions/_shared/google-ads-accounts.ts';

const MCC = '1111111111';
const SUB_MCC = '2222222222';
const MAGIC = '8978427939';
const CANCELED = '5612552019';
const NESTED = '3333333333';

function node(partial: Partial<CustomerClientNode> & Pick<CustomerClientNode, 'id' | 'level' | 'manager'>): CustomerClientNode {
    return {
        descriptive_name: partial.descriptive_name ?? partial.id,
        status: partial.status ?? 'ENABLED',
        ...partial,
    };
}

describe('collectMccClients', () => {
    it('incluye clientes nuevos del MCC y de un sub-MCC, y aparta gestores y canceladas', async () => {
        const tree: Record<string, CustomerClientNode[]> = {
            [MCC]: [
                node({ id: MCC, level: 0, manager: true, descriptive_name: 'Coco Solution' }),
                node({ id: MAGIC, level: 1, manager: false, descriptive_name: 'Magic & Sailing' }),
                node({ id: CANCELED, level: 1, manager: false, descriptive_name: 'Co-Art', status: 'CANCELED' }),
                node({ id: SUB_MCC, level: 1, manager: true, descriptive_name: 'Grupo Loro Parque' }),
            ],
            [SUB_MCC]: [
                node({ id: SUB_MCC, level: 0, manager: true, descriptive_name: 'Grupo Loro Parque' }),
                node({ id: NESTED, level: 1, manager: false, descriptive_name: 'Loro Parque' }),
            ],
        };

        const result = await collectMccClients(MCC, async (id) => tree[id] ?? []);

        expect(result.leaves.map((a) => a.account_id).sort()).toEqual([MAGIC, NESTED].sort());
        expect(result.managerIds).toEqual(expect.arrayContaining([MCC, SUB_MCC]));
        expect(result.skipped.map((a) => a.account_id)).toEqual([CANCELED]);
    });
});

describe('mergeGoogleSyncAccounts', () => {
    it('añade la cuenta nueva y no vuelve a pedir métricas de MCC ni de canceladas', () => {
        const merged = mergeGoogleSyncAccounts({
            configured: [
                { account_id: MCC, account_name: 'Coco Solution' },
                { account_id: '4444444444', account_name: 'Siam Park' },
                { account_id: CANCELED, account_name: 'Co-Art' },
            ],
            hierarchyLeaves: [
                { account_id: MAGIC, account_name: 'Magic & Sailing' },
                { account_id: '4444444444', account_name: 'Siam Park' },
            ],
            inactiveIds: [],
            managerIds: [MCC, SUB_MCC],
            skippedIds: [CANCELED],
        });

        expect(merged.addedIds).toEqual([MAGIC]);
        expect(merged.clients.map((a) => a.account_id).sort()).toEqual([MAGIC, '4444444444'].sort());
    });

    it('no reincorpora una cuenta que la agencia desactivó', () => {
        const merged = mergeGoogleSyncAccounts({
            configured: [],
            hierarchyLeaves: [{ account_id: '897-842-7939', account_name: 'Magic & Sailing' }],
            inactiveIds: [MAGIC],
            managerIds: [],
            skippedIds: [],
        });
        expect(merged.clients).toEqual([]);
        expect(merged.addedIds).toEqual([]);
    });
});
