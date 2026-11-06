export type GoogleAccountRef = { account_id: string; account_name: string };

export type CustomerClientNode = {
    id: string;
    descriptive_name: string;
    level: number;
    manager: boolean;
    status: string;
};

const SKIP_STATUSES = new Set(['CANCELED', 'CANCELLED', 'CLOSED']);

export function normalizeGoogleCustomerId(raw: string): string {
    return String(raw ?? '').replace(/\D/g, '');
}

function statusOf(node: CustomerClientNode): string {
    return (node.status || 'ENABLED').toUpperCase();
}

export type MccHierarchy = {
    leaves: GoogleAccountRef[];
    managerIds: string[];
    skipped: GoogleAccountRef[];
};

/** Recorre MCC → sub-MCC y separa cuentas de cliente, gestores y cuentas canceladas. */
export async function collectMccClients(
    rootId: string,
    query: (customerId: string) => Promise<CustomerClientNode[]>,
): Promise<MccHierarchy> {
    const root = normalizeGoogleCustomerId(rootId);
    const leaves = new Map<string, GoogleAccountRef>();
    const managerIds = new Set<string>();
    const skipped = new Map<string, GoogleAccountRef>();
    const seen = new Set<string>();
    const queue: string[] = root ? [root] : [];

    while (queue.length > 0) {
        const customerId = queue.shift()!;
        if (seen.has(customerId)) continue;
        seen.add(customerId);
        const rows = await query(customerId);
        for (const row of rows) {
            const id = normalizeGoogleCustomerId(row.id);
            if (!id) continue;
            const name = row.descriptive_name || `Cuenta ${id}`;
            const status = statusOf(row);
            if (row.manager) {
                managerIds.add(id);
                if (row.level === 1 && !SKIP_STATUSES.has(status)) queue.push(id);
                continue;
            }
            if (SKIP_STATUSES.has(status)) {
                skipped.set(id, { account_id: id, account_name: name });
                continue;
            }
            if (row.level === 0 && id !== customerId) continue;
            if (row.level > 1) continue;
            leaves.set(id, { account_id: id, account_name: name });
        }
    }

    return {
        leaves: Array.from(leaves.values()),
        managerIds: Array.from(managerIds),
        skipped: Array.from(skipped.values()),
    };
}

export function mergeGoogleSyncAccounts(params: {
    configured: GoogleAccountRef[];
    hierarchyLeaves: GoogleAccountRef[];
    inactiveIds: string[];
    managerIds: string[];
    skippedIds: string[];
}): { clients: GoogleAccountRef[]; addedIds: string[] } {
    const inactive = new Set(params.inactiveIds.map(normalizeGoogleCustomerId));
    const managers = new Set(params.managerIds.map(normalizeGoogleCustomerId));
    const skipped = new Set(params.skippedIds.map(normalizeGoogleCustomerId));
    const byId = new Map<string, GoogleAccountRef>();
    const configuredIds = new Set<string>();

    for (const row of params.configured) {
        const id = normalizeGoogleCustomerId(row.account_id);
        if (!id) continue;
        configuredIds.add(id);
        if (inactive.has(id) || managers.has(id) || skipped.has(id)) continue;
        byId.set(id, { account_id: id, account_name: row.account_name || `Cuenta ${id}` });
    }

    const addedIds: string[] = [];
    for (const row of params.hierarchyLeaves) {
        const id = normalizeGoogleCustomerId(row.account_id);
        if (!id || inactive.has(id) || managers.has(id) || skipped.has(id)) continue;
        if (!configuredIds.has(id)) addedIds.push(id);
        const prev = byId.get(id);
        byId.set(id, {
            account_id: id,
            account_name: row.account_name || prev?.account_name || `Cuenta ${id}`,
        });
    }

    return { clients: Array.from(byId.values()), addedIds };
}
