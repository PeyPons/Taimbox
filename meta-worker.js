
/* Ejecutar con: node meta-worker.js */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const cleanEnv = (val) => val ? val.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim() : '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_VERSION = 'v19.0';

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("❌ Faltan claves de Supabase"); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAccountName(id, accessToken) {
    try {
        const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${id}?fields=name&access_token=${accessToken}`);
        const data = await res.json();
        return data.name || id;
    } catch { return id; }
}

async function processAgency(agency, log) {
    const integrations = agency.settings?.integrations || {};
    const accessToken = integrations.metaAccessToken;
    const accountIdsRaw = integrations.metaAdAccountIds;

    if (!accessToken) {
        // await log(`⚠️ Agencia ${agency.name} (${agency.slug}) no tiene Access Token configurado.`);
        return;
    }

    let ids = [];
    if (accountIdsRaw) {
        ids = accountIdsRaw.split(',').map(i => i.trim()).filter(Boolean);
    }

    if (!ids.length) {
        await log(`⚠️ Agencia ${agency.name}: Token presente pero sin cuentas configuradas.`);
        return;
    }

    await log(`🏢 Procesando Agencia: ${agency.name} (${ids.length} cuentas)`);

    for (const id of ids) {
        const name = await getAccountName(id, accessToken);
        await log(`  👉 Cuenta: ${name} (${id})`);

        // Actualizar nombre en config (Tabla global ad_accounts_config - OJO: esto es compartido, habría que ver si se segrega)
        // Por ahora lo dejamos igual, asumiendo que el ID es la clave
        await supabase.from('ad_accounts_config').upsert({ account_id: id, account_name: name, platform: 'meta', is_active: true }, { onConflict: 'account_id' });

        // Fetch Insights (Resumido)
        const range = { start: new Date().toISOString().slice(0, 8) + '01', end: new Date().toISOString().slice(0, 10) };
        const url = `https://graph.facebook.com/${API_VERSION}/${id}/insights?level=campaign&fields=campaign_id,campaign_name,spend,actions,action_values&time_range={'since':'${range.start}','until':'${range.end}'}&access_token=${accessToken}`;

        try {
            const res = await fetch(url);
            const json = await res.json();

            if (json.error) {
                await log(`  ❌ Error API Meta (${name}): ${json.error.message}`);
                continue;
            }

            if (json.data) {
                const upsertData = json.data.map(row => {
                    let conv = 0, val = 0;
                    row.actions?.forEach(a => { if (a.action_type === 'purchase' || a.action_type === 'lead') conv += parseFloat(a.value); });
                    row.action_values?.forEach(a => { if (a.action_type === 'purchase') val += parseFloat(a.value); });

                    return {
                        client_id: id, client_name: name,
                        campaign_id: row.campaign_id, campaign_name: row.campaign_name,
                        status: 'ENABLED', date: range.start,
                        cost: row.spend, conversions: conv, conversions_value: val,
                        // agency_id: agency.id // TODO: Añadir columna agency_id en migración futura si se requiere aislamiento estricto en DB
                    };
                });

                if (upsertData.length > 0) {
                    await supabase.from('meta_ads_campaigns').upsert(upsertData, { onConflict: 'campaign_id, date' });
                    await log(`  ✅ ${upsertData.length} campañas actualizadas.`);
                } else {
                    await log(`  ℹ️ Sin datos de campañas.`);
                }
            }
        } catch (err) {
            await log(`  ❌ Error fetch (${name}): ${err.message}`);
        }
    }
}

async function processSyncJob(jobId) {
    const log = async (msg) => {
        console.log(msg); // También loguear en consola
        const { data } = await supabase.from('meta_sync_logs').select('logs').eq('id', jobId).single();
        await supabase.from('meta_sync_logs').update({ logs: [...(data?.logs || []), msg].slice(-50) }).eq('id', jobId);
    };

    try {
        await supabase.from('meta_sync_logs').update({ status: 'running' }).eq('id', jobId);
        await log("🚀 Iniciando Worker Multi-Agencia Meta ...");

        // 1. Obtener todas las agencias
        const { data: agencies, error } = await supabase.from('agencies').select('id, name, slug, settings');

        if (error) throw new Error(`Error obteniendo agencias: ${error.message}`);
        if (!agencies || agencies.length === 0) {
            await log("⚠️ No se encontraron agencias en el sistema.");
            return;
        }

        await log(`🔎 Analizando ${agencies.length} agencias...`);

        // 2. Iterar agencias
        for (const agency of agencies) {
            await processAgency(agency, log);
        }

        await log("🎉 Sincronización finalizada.");
        await supabase.from('meta_sync_logs').update({ status: 'completed' }).eq('id', jobId);
    } catch (e) {
        await log(`Error General: ${e.message}`);
        await supabase.from('meta_sync_logs').update({ status: 'error' }).eq('id', jobId);
    }
}

supabase.channel('meta-listener').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meta_sync_logs' }, p => {
    if (p.new.status === 'pending') processSyncJob(p.new.id);
}).subscribe();

setInterval(async () => {
    const { data } = await supabase.from('meta_sync_logs').select('id').eq('status', 'pending').limit(1);
    if (data?.length) processSyncJob(data[0].id);
}, 5000);

console.log("Meta Worker Multi-Tenant Started...");
