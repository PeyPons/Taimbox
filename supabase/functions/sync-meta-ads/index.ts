import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
    AgencyAccessError,
    assertAgencyPermission,
    assertPlatformAdmin,
    getBearerToken,
} from '../_shared/agency-access.ts'
import { completeAdsSyncLog } from '../_shared/complete-ads-sync-log.ts'

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

        const getSecret = (key: string) => Deno.env.get(key) || Deno.env.get(`VITE_${key}`);

        if (!supabaseUrl || !supabaseKey || !supabaseAnonKey) {
            throw new Error('Faltan variables de entorno SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY')
        }

        let requestData: { agency_id?: string; job_id?: string } = {}
        try {
            requestData = await req.json()
        } catch (e) {
            // Body vacío es aceptable
        }

        const { agency_id, job_id } = requestData
        const adsCronSecret = Deno.env.get('ADS_CRON_SECRET')
        const cronHeader = req.headers.get('X-Ads-Cron-Secret')
        const isAdsCron = !!(adsCronSecret && cronHeader === adsCronSecret && agency_id)

        const bearer = getBearerToken(req)
        if (!isAdsCron) {
            if (!bearer) {
                return new Response(JSON.stringify({ error: 'No autorizado.' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        if (!isAdsCron) {
            if (!agency_id) {
                await assertPlatformAdmin({ supabaseUrl, supabaseAnonKey, token: bearer! })
            } else {
                await assertAgencyPermission({
                    supabaseUrl,
                    supabaseAnonKey,
                    supabaseServiceKey: supabaseKey,
                    token: bearer!,
                    agencyId: agency_id,
                    permission: 'can_access_meta_ads',
                })
            }
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

        type MetaCampaignInsight = {
            campaign_id: string;
            campaign_name: string;
            spend: string;
            conversions?: number;
            conversions_value?: number;
            clicks?: string | number;
            impressions?: string | number;
            actions?: Array<{ action_type: string; value: string }>;
            action_values?: Array<{ action_type: string; value: string }>;
        };

        type MetaCampaignCatalogItem = {
            id: string;
            name: string;
            status: string;
            effective_status?: string;
            daily_budget?: string;
        };

        async function fetchGraphPaginated<T>(initialUrl: string): Promise<T[]> {
            const all: T[] = [];
            let url: string | null = initialUrl;
            while (url) {
                const res = await fetch(url);
                const json = await res.json();
                if (json.error) throw new Error(json.error.message);
                all.push(...(json.data || []));
                url = json.paging?.next ?? null;
            }
            return all;
        }

        async function fetchCampaignCatalog(accessToken: string, accountId: string): Promise<MetaCampaignCatalogItem[]> {
            const url = `https://graph.facebook.com/${API_VERSION}/${accountId}/campaigns?fields=id,name,status,effective_status,daily_budget&limit=500&access_token=${accessToken}`;
            try {
                const campaigns = await fetchGraphPaginated<MetaCampaignCatalogItem>(url);
                return campaigns.filter((c) => {
                    const status = c.effective_status || c.status || '';
                    return status === 'ACTIVE' || status === 'PAUSED';
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                console.error(`Error catalog ${accountId}:`, msg);
                return [];
            }
        }

        async function fetchCampaignInsights(accessToken: string, accountId: string): Promise<Map<string, MetaCampaignInsight>> {
            const { start, end } = getDateRange();
            const url = `https://graph.facebook.com/${API_VERSION}/${accountId}/insights?level=campaign&fields=campaign_id,campaign_name,spend,conversions,clicks,impressions,actions,action_values&time_range={'since':'${start}','until':'${end}'}&access_token=${accessToken}&limit=500`;

            const insightsMap = new Map<string, MetaCampaignInsight>();
            try {
                const rows = await fetchGraphPaginated<MetaCampaignInsight>(url);
                for (const row of rows) {
                    if (row.campaign_id) insightsMap.set(String(row.campaign_id), row);
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                console.error(`Error insights ${accountId}:`, msg);
            }
            return insightsMap;
        }

        function parseMetaConversions(row: MetaCampaignInsight): { conv: number; val: number } {
            let conv = 0;
            let val = 0;
            if (row.actions) {
                const purchase = row.actions.find((a) => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
                if (purchase) conv = parseFloat(purchase.value);
            }
            if (row.action_values) {
                const purchaseVal = row.action_values.find((a) => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
                if (purchaseVal) val = parseFloat(purchaseVal.value);
            }
            return { conv, val };
        }

        async function refreshMissingMetaCurrencies(accessToken: string, agencyId: string) {
            const { data: missing, error } = await supabase
                .from('ad_accounts_config')
                .select('account_id')
                .eq('agency_id', agencyId)
                .eq('platform', 'meta')
                .eq('is_active', true)
                .or('currency.is.null,currency.eq.');

            if (error || !missing?.length) return;

            const metaAccounts = await fetchAdAccounts(accessToken);
            const currencyById = new Map<string, string>();
            for (const acc of metaAccounts) {
                const id = acc.account_id ? `act_${acc.account_id}` : '';
                if (id && acc.currency) currencyById.set(id, String(acc.currency).toUpperCase());
            }

            for (const row of missing) {
                const code = currencyById.get(row.account_id);
                if (!code) continue;
                const { error: updErr } = await supabase
                    .from('ad_accounts_config')
                    .update({ currency: code })
                    .eq('agency_id', agencyId)
                    .eq('platform', 'meta')
                    .eq('account_id', row.account_id);
                if (updErr) console.warn(`refresh meta currency ${row.account_id}:`, updErr.message);
            }
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

                await refreshMissingMetaCurrencies(accessToken, agency.id);

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
                    const catalog = await fetchCampaignCatalog(accessToken, id);
                    const insights = await fetchCampaignInsights(accessToken, id);

                    if (catalog.length > 0) {
                        const upsertData = catalog.map((camp) => {
                            const row = insights.get(String(camp.id));
                            const { conv, val } = row ? parseMetaConversions(row) : { conv: 0, val: 0 };

                            return {
                                client_id: id,
                                client_name: account.account_name,
                                campaign_id: String(camp.id),
                                campaign_name: camp.name || row?.campaign_name || `Campaña ${camp.id}`,
                                status: camp.effective_status || camp.status || 'UNKNOWN',
                                date: start,
                                cost: row ? parseFloat(row.spend || '0') : 0,
                                conversions: conv,
                                conversions_value: val,
                                impressions: row ? parseInt(String(row.impressions || 0), 10) : 0,
                                clicks: row ? parseInt(String(row.clicks || 0), 10) : 0,
                                agency_id: agency.id,
                            };
                        });

                        await supabase.from('meta_ads_campaigns')
                            .delete()
                            .eq('client_id', id)
                            .gte('date', start)
                            .lte('date', end);

                        const { error } = await supabase.from('meta_ads_campaigns').upsert(upsertData, { onConflict: 'campaign_id, date' });
                        if (error) await log(`    ❌ Error guardando ${account.account_name}: ${error.message}`);
                        else await log(`    ✅ ${account.account_name}: ${upsertData.length} campañas (activas/pausadas).`);
                    } else {
                        await log(`    ℹ️ ${account.account_name}: 0 campañas activas o pausadas.`);
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
        await completeAdsSyncLog(supabase, {
            platform: 'meta',
            agencyId: agency_id,
            jobId: job_id,
            logMessages,
            status: 'completed',
            source: isAdsCron ? 'cron' : 'manual',
        })

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
