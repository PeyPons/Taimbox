import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
    AgencyAccessError,
    assertAgencyPermission,
    assertPlatformAdmin,
    getBearerToken,
} from '../_shared/agency-access.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL')
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        // Fallback para secrets locales en self-hosted
        let localSecrets: any = {};
        try {
            const text = await Deno.readTextFile('/home/deno/functions/sync-meta-ads/secrets.json');
            localSecrets = JSON.parse(text);
        } catch (e) {
            // No hay archivo de secrets local
        }

        const getSecret = (key: string) => Deno.env.get(key) || Deno.env.get(`VITE_${key}`) || localSecrets[key];

        if (!supabaseUrl || !supabaseKey || !supabaseAnonKey) {
            throw new Error('Faltan variables de entorno SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY')
        }

        const bearer = getBearerToken(req)
        if (!bearer) {
            return new Response(JSON.stringify({ error: 'No autorizado.' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        let requestData: { agency_id?: string; job_id?: string } = {}
        try {
            requestData = await req.json()
        } catch (e) {
            // Body vacío es aceptable
        }

        const { agency_id, job_id } = requestData

        if (!agency_id) {
            await assertPlatformAdmin({ supabaseUrl, supabaseAnonKey, token: bearer })
        } else {
            await assertAgencyPermission({
                supabaseUrl,
                supabaseAnonKey,
                supabaseServiceKey: supabaseKey,
                token: bearer,
                agencyId: agency_id,
                permission: 'can_access_meta_ads',
            })
        }
        const logMessages: string[] = []

        const log = async (msg: string) => {
            console.log(msg)
            logMessages.push(msg)
            if (job_id) {
                await supabase.from('meta_sync_logs').update({
                    logs: logMessages.slice(-50),
                    status: 'running'
                }).eq('id', job_id)
            }
        }

        await log(`🚀 Iniciando Meta Ads Edge Function...`)

        // --- NEGOCIO (Port from meta-worker.js) ---
        const API_VERSION = 'v19.0';

        function getDateRange() {
            const now = new Date();
            const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const year = currentMonth.getFullYear();
            const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
            const day = String(currentMonth.getDate()).padStart(2, '0');
            const firstDay = `${year}-${month}-01`;
            const lastDayObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const lastDay = `${lastDayObj.getFullYear()}-${String(lastDayObj.getMonth() + 1).padStart(2, '0')}-${String(lastDayObj.getDate()).padStart(2, '0')}`;
            return { start: firstDay, end: lastDay };
        }

        async function fetchAdAccounts(accessToken: string) {
            const url = `https://graph.facebook.com/${API_VERSION}/me/adaccounts?fields=account_id,name,currency,account_status&limit=100&access_token=${accessToken}`;
            try {
                const res = await fetch(url);
                const json = await res.json();
                if (json.error) throw new Error(json.error.message);
                return json.data || [];
            } catch (e: any) {
                // throw new Error(`Error fetching ad accounts: ${e.message}`);
                return [];
            }
        }

        async function fetchCampaigns(accessToken: string, accountId: string) {
            const { start, end } = getDateRange();
            // Insights a nivel campaña
            const url = `https://graph.facebook.com/${API_VERSION}/${accountId}/insights?level=campaign&fields=campaign_id,campaign_name,spend,conversions,clicks,impressions,actions&time_range={'since':'${start}','until':'${end}'}&access_token=${accessToken}&limit=500`;

            try {
                const res = await fetch(url);
                const json = await res.json();
                if (json.error) throw new Error(json.error.message);
                return json.data || [];
            } catch (e: any) {
                console.error(`Error insights ${accountId}:`, e.message);
                return [];
            }
        }

        async function getCampaignStatus(accessToken: string, campaignId: string) {
            const url = `https://graph.facebook.com/${API_VERSION}/${campaignId}?fields=status&access_token=${accessToken}`;
            try {
                const res = await fetch(url);
                const json = await res.json();
                return json.status || 'UNKNOWN';
            } catch (e) { return 'UNKNOWN'; }
        }

        async function processAgency(agency: any) {
            const integrations = agency.settings?.integrations || {};
            const accessToken = agency.meta_ads_access_token || integrations.metaAccessToken || getSecret('META_ACCESS_TOKEN'); // Columna OAuth > JSON > env

            if (!accessToken) {
                await log(`⚠️ Agencia ${agency.name} no tiene Access Token de Meta.`);
                return;
            }

            await log(`🏢 Procesando ${agency.name}...`);

            // 1. Discovery & Sync
            try {
                await log(`  🔎 Buscando cuentas en Meta API...`);
                const metaAccounts = await fetchAdAccounts(accessToken);
                await log(`  ✅ Meta API devolvió ${metaAccounts.length} cuentas.`);

                // Update Ad Accounts Config in BULK
                if (metaAccounts.length > 0) {
                    const upsertConfigs = metaAccounts.map((acc: { account_id: string; name?: string; currency?: string }) => ({
                        account_id: `act_${acc.account_id}`,
                        account_name: acc.name || `Cuenta ${acc.account_id}`,
                        platform: 'meta',
                        is_active: true,
                        agency_id: agency.id,
                        currency: acc.currency ?? null,
                    }));

                    const { error: upsertErr } = await supabase.from('ad_accounts_config').upsert(upsertConfigs, { onConflict: 'account_id,agency_id,platform' });
                    if (upsertErr) await log(`    ⚠️ Error actualizando configuración: ${upsertErr.message}`);
                }

                // 2. Process ACTIVE accounts from DB
                const { data: configAccounts, error: selectErr } = await supabase
                    .from('ad_accounts_config')
                    .select('account_id, account_name')
                    .eq('agency_id', agency.id)
                    .eq('platform', 'meta')
                    .eq('is_active', true);

                if (selectErr) {
                    await log(`    ❌ Error consultando cuentas en BD: ${selectErr.message}`);
                    return;
                }

                const accountsToProcess = configAccounts || [];

                if (accountsToProcess.length === 0) {
                    await log(`    ℹ️ Sin cuentas activas en configuradas (ad_accounts_config) para ${agency.name}.`);
                    return;
                }

                await log(`    ⏳ Procesando ${accountsToProcess.length} cuentas configuradas...`);

                const { start, end } = getDateRange();

                for (const account of accountsToProcess) {
                    const id = account.account_id;
                    const campaigns = await fetchCampaigns(accessToken, id);

                    if (campaigns.length > 0) {
                        // Procesar cada campaña para obtener status y preparar upsert
                        const upsertData = [];

                        for (const row of campaigns) {
                            // Ignorar gasto 0
                            if (parseFloat(row.spend || '0') === 0 && parseFloat(row.impressions || '0') === 0) continue;

                            // Calcular conversiones y valor
                            let conv = 0;
                            let val = 0;
                            if (row.actions) {
                                // "purchase" or "omni_purchase" usually
                                const purchase = row.actions.find((a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
                                if (purchase) conv = parseFloat(purchase.value);
                            }
                            if (row.action_values) {
                                const purchaseVal = row.action_values.find((a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
                                if (purchaseVal) val = parseFloat(purchaseVal.value);
                            }

                            // Obtener status real (requiere llamada extra por campaña, costoso pero necesario si no viene en insights)
                            // En insights level=campaign NO viene el status, hay que pedirlo o asumir activo si gasta
                            // Para optimizar, asumimos ENABLED si tiene gasto hoy, o podríamos hacer fetch batch
                            // Por simplicidad en versión 1, usamos 'ENABLED' si gasta, o fetch individual
                            const status = await getCampaignStatus(accessToken, row.campaign_id);

                            upsertData.push({
                                client_id: id,
                                client_name: account.account_name,
                                campaign_id: row.campaign_id,
                                campaign_name: row.campaign_name,
                                status: status,
                                date: start, // Guardamos todo en el día 1 del mes para simplificar, o row.date_start
                                cost: row.spend,
                                conversions: conv,
                                conversions_value: val,
                                impressions: row.impressions || 0,
                                clicks: row.clicks || 0,
                                agency_id: agency.id
                            });
                        }

                        if (upsertData.length > 0) {
                            // Clean Sync
                            await supabase.from('meta_ads_campaigns')
                                .delete()
                                .eq('client_id', id)
                                .gte('date', start)
                                .lte('date', end);

                            const { error } = await supabase.from('meta_ads_campaigns').upsert(upsertData, { onConflict: 'campaign_id, date' });
                            if (error) await log(`    ❌ Error guardando ${account.account_name}: ${error.message}`);
                            else await log(`    ✅ ${account.account_name}: ${upsertData.length} campañas procesadas.`);
                        } else {
                            await log(`    ℹ️ ${account.account_name}: 0 campañas con gasto este mes.`);
                        }
                    }
                }

            } catch (e: any) {
                await log(`    ❌ Error Agencia ${agency.name}: ${e.message}`);
            }
        }


        // MAIN
        let query = supabase.from('agencies').select('id, name, settings, meta_ads_access_token')
        if (agency_id) query = query.eq('id', agency_id)

        const { data: agencies, error: agenciesError } = await query
        if (agenciesError) throw new Error(agenciesError.message)

        if (agencies) {
            for (const agency of agencies) await processAgency(agency)
        }

        await log('🎉 Finalizado.')
        if (job_id) {
            await supabase.from('meta_sync_logs').update({
                logs: logMessages.slice(-50),
                status: 'completed'
            }).eq('id', job_id)
        }

        return new Response(JSON.stringify({ success: true, logs: logMessages }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: unknown) {
        if (error instanceof AgencyAccessError) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: error.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
