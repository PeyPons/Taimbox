import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
    AgencyAccessError,
    assertAgencyPermission,
    assertPlatformAdmin,
    getBearerToken,
} from '../_shared/agency-access.ts'
import { completeAdsSyncLog } from '../_shared/complete-ads-sync-log.ts'

// Configuración de CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // 1. Manejo de CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Inicializar cliente Supabase (usando variables de entorno del Edge Runtime)
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
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401,
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
                    permission: 'can_access_google_ads',
                })
            }
        }
        const logId = job_id || `edge-${Date.now()}`;

        // Función de log helper
        const logMessages: string[] = []
        const log = async (msg: string) => {
            console.log(msg)
            logMessages.push(msg)
            if (job_id) {
                await supabase.from('ads_sync_logs').update({
                    logs: logMessages.slice(-50),
                    status: 'running'
                }).eq('id', job_id)
            }
        }

        // Diagnóstico de variables de entorno (solo nombres de claves)
        const envKeys = Object.keys(Deno.env.toObject());
        console.log("VARS DISPONIBLES:", envKeys.filter(k => k.includes('GOOGLE') || k.includes('VITE')));

        await log(`🚀 Iniciando Google Ads Edge Function para ${agency_id ? `Agencia ${agency_id}` : 'Todas las agencias'}...`)

        // 4. Lógica de Negocio (Ported from ads-worker.js)

        // --- HELPERS ---
        const API_VERSION = 'v22'; // Google Ads API Version

        function getDateRange() {
            const now = new Date();
            const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const year = currentMonth.getFullYear();
            const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
            const day = String(currentMonth.getDate()).padStart(2, '0');
            const firstDay = `${year}-${month}-01`;
            const todayDate = new Date();
            const tYear = todayDate.getFullYear();
            const tMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
            const tDay = String(todayDate.getDate()).padStart(2, '0');
            const today = `${tYear}-${tMonth}-${tDay}`;
            return { firstDay, today };
        }

        // --- Obtener todas las cuentas (MCC + sub-MCCs + subcuentas) recursivamente ---
        type CustomerClientRow = { id: string; descriptive_name: string; level: number; manager: boolean };
        async function runCustomerClientQuery(
            accessToken: string,
            loginMccId: string,
            customerId: string,
            developerToken: string
        ): Promise<CustomerClientRow[]> {
            const query = `
                SELECT customer_client.id, customer_client.descriptive_name, customer_client.level, customer_client.manager
                FROM customer_client
                WHERE customer_client.level <= 1`;
            const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:searchStream`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': developerToken,
                    'Content-Type': 'application/json',
                    'login-customer-id': loginMccId,
                },
                body: JSON.stringify({ query }),
            });
            const rows: CustomerClientRow[] = [];
            if (!response.ok) return rows;
            const data = await response.json();
            const processBatch = (batch: any) => {
                if (!batch?.results) return;
                batch.results.forEach((row: any) => {
                    const cc = row.customerClient || row.customer_client;
                    if (!cc) return;
                    const id = String(cc.id ?? cc.clientCustomer?.replace?.(/^customers\//, '') ?? '');
                    if (!id) return;
                    rows.push({
                        id,
                        descriptive_name: cc.descriptiveName || cc.descriptive_name || `Cuenta ${id}`,
                        level: Number(cc.level ?? 0),
                        manager: !!(cc.manager ?? false),
                    });
                });
            };
            if (Array.isArray(data)) data.forEach(processBatch);
            else if (data && typeof data === 'object') processBatch(data);
            return rows;
        }

        async function fetchChildAccounts(accessToken: string, mccId: string, developerToken: string): Promise<{ account_id: string; account_name: string }[]> {
            const clientsMap = new Map<string, { account_id: string; account_name: string }>();
            const seenIds = new Set<string>();
            const queue: string[] = [mccId];
            while (queue.length > 0) {
                const customerId = queue.shift()!;
                if (seenIds.has(customerId)) continue;
                seenIds.add(customerId);
                const rows = await runCustomerClientQuery(accessToken, mccId, customerId, developerToken);
                for (const row of rows) {
                    clientsMap.set(row.id, { account_id: row.id, account_name: row.descriptive_name });
                    if (row.manager && row.level === 1) queue.push(row.id);
                }
            }
            return Array.from(clientsMap.values());
        }

        function parseBudgetId(raw: unknown): string {
            if (raw == null || raw === '') return '';
            const s = String(raw).trim();
            const fromResource = s.match(/campaignBudgets\/(\d+)/i);
            if (fromResource) return fromResource[1];
            if (/^\d+$/.test(s)) return s;
            const digitsOnly = s.replace(/\D/g, '');
            return digitsOnly || s;
        }

        function extractCampaignBudgetRaw(row: Record<string, unknown>): string {
            const campaignBudget = row.campaignBudget ?? row.campaign_budget;
            const budgetObj =
                campaignBudget && typeof campaignBudget === 'object'
                    ? (campaignBudget as Record<string, unknown>)
                    : null;
            const campaign = row.campaign && typeof row.campaign === 'object'
                ? (row.campaign as Record<string, unknown>)
                : null;

            const candidates: unknown[] = [
                budgetObj?.resourceName,
                budgetObj?.resource_name,
                budgetObj?.id,
                campaign?.campaignBudget,
                campaign?.campaign_budget,
            ];

            for (const c of candidates) {
                if (c != null && String(c).trim() !== '') return String(c);
            }
            return '';
        }

        async function upsertGoogleAccountConfig(
            agencyId: string,
            accountId: string,
            accountName: string,
            currency: string | null,
        ) {
            const { error } = await supabase.from('ad_accounts_config').upsert({
                account_id: accountId,
                account_name: accountName,
                platform: 'google',
                is_active: true,
                agency_id: agencyId,
                currency: currency ? String(currency).toUpperCase() : null,
            }, { onConflict: 'account_id,agency_id,platform' });
            if (error) console.warn(`upsert ad_accounts_config ${accountId}:`, error.message);
        }

        // --- FETCH CAMPAIGNS ---
        type GoogleCampaignRow = {
            client_id: string;
            campaign_id: string;
            campaign_name: string;
            status: string;
            date: string;
            cost: number;
            daily_budget: number;
            budget_id: string;
            conversions_value: number;
            conversions: number;
            clicks: number;
            impressions: number;
        };

        async function runGoogleAdsQuery(
            accessToken: string,
            customerId: string,
            developerToken: string,
            mccId: string,
            query: string,
        ): Promise<any[]> {
            const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:searchStream`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': developerToken,
                    'Content-Type': 'application/json',
                    'login-customer-id': mccId,
                },
                body: JSON.stringify({ query }),
            });

            const results: any[] = [];
            if (!response.ok) return results;

            const data = await response.json();
            const processBatch = (batch: any) => {
                if (!batch?.results) return;
                batch.results.forEach((row: any) => results.push(row));
            };
            if (Array.isArray(data)) data.forEach(processBatch);
            else if (data && typeof data === 'object') processBatch(data);
            return results;
        }

        async function fetchCampaignCatalog(
            accessToken: string,
            customerId: string,
            developerToken: string,
            mccId: string,
            dateRange: { firstDay: string },
        ): Promise<Map<string, GoogleCampaignRow>> {
            const query = `
                SELECT
                  campaign.id,
                  campaign.name,
                  campaign.status,
                  campaign_budget.id,
                  campaign_budget.amount_micros
                FROM campaign
                WHERE campaign.status IN ('ENABLED', 'PAUSED')`;

            const rows = await runGoogleAdsQuery(accessToken, customerId, developerToken, mccId, query);
            const catalog = new Map<string, GoogleCampaignRow>();

            for (const row of rows) {
                const campaignId = String(row.campaign?.id ?? '');
                if (!campaignId) continue;

                const budgetMicros = row.campaignBudget?.amountMicros ?? row.campaign_budget?.amount_micros ?? '0';
                const budgetRaw = extractCampaignBudgetRaw(row);

                catalog.set(campaignId, {
                    client_id: customerId,
                    campaign_id: campaignId,
                    campaign_name: row.campaign?.name ?? '',
                    status: row.campaign?.status ?? '',
                    date: dateRange.firstDay,
                    cost: 0,
                    daily_budget: Number(budgetMicros) / 1000000,
                    budget_id: parseBudgetId(budgetRaw),
                    conversions_value: 0,
                    conversions: 0,
                    clicks: 0,
                    impressions: 0,
                });
            }

            return catalog;
        }

        async function fetchCampaignMetrics(
            accessToken: string,
            customerId: string,
            developerToken: string,
            mccId: string,
            dateRange: { firstDay: string; today: string },
        ): Promise<Map<string, Omit<GoogleCampaignRow, 'daily_budget' | 'budget_id' | 'campaign_name' | 'status'>>> {
            const query = `
                SELECT
                  campaign.id,
                  campaign.name,
                  campaign.status,
                  campaign_budget.id,
                  campaign_budget.amount_micros,
                  metrics.cost_micros,
                  metrics.conversions_value,
                  metrics.conversions,
                  metrics.clicks,
                  metrics.impressions,
                  segments.date
                FROM campaign
                WHERE
                  segments.date BETWEEN '${dateRange.firstDay}' AND '${dateRange.today}'`;

            const rows = await runGoogleAdsQuery(accessToken, customerId, developerToken, mccId, query);
            const metrics = new Map<string, GoogleCampaignRow>();

            for (const row of rows) {
                const rawCostMicros = row.metrics?.costMicros ?? row.metrics?.cost_micros ?? 0;
                const costDollars = Number(rawCostMicros) / 1000000;
                const campaignId = String(row.campaign?.id ?? '');
                if (!campaignId) continue;

                if (!metrics.has(campaignId)) {
                    metrics.set(campaignId, {
                        client_id: customerId,
                        campaign_id: campaignId,
                        campaign_name: row.campaign?.name ?? '',
                        status: row.campaign?.status ?? '',
                        date: dateRange.firstDay,
                        cost: 0,
                        daily_budget: 0,
                        budget_id: '',
                        conversions_value: 0,
                        conversions: 0,
                        clicks: 0,
                        impressions: 0,
                    });
                }

                const entry = metrics.get(campaignId)!;
                entry.cost += costDollars;
                entry.conversions_value += parseFloat(String(row.metrics?.conversionsValue ?? row.metrics?.conversions_value ?? 0));
                entry.conversions += parseFloat(String(row.metrics?.conversions ?? 0));
                entry.clicks += parseInt(String(row.metrics?.clicks ?? 0), 10);
                entry.impressions += parseInt(String(row.metrics?.impressions ?? 0), 10);
            }

            return metrics;
        }

        async function fetchCampaigns(accessToken, customerId, clientSecret, clientId, developerToken, refreshToken, mccId) {
            const dateRange = getDateRange();
            const catalog = await fetchCampaignCatalog(accessToken, customerId, developerToken, mccId, dateRange);
            const metrics = await fetchCampaignMetrics(accessToken, customerId, developerToken, mccId, dateRange);

            const merged = new Map<string, GoogleCampaignRow>(catalog);

            for (const [campaignId, metricRow] of metrics) {
                const existing = merged.get(campaignId);
                if (existing) {
                    existing.cost = metricRow.cost;
                    existing.conversions_value = metricRow.conversions_value;
                    existing.conversions = metricRow.conversions;
                    existing.clicks = metricRow.clicks;
                    existing.impressions = metricRow.impressions;
                    if (metricRow.campaign_name) existing.campaign_name = metricRow.campaign_name;
                    if (metricRow.status) existing.status = metricRow.status;
                } else {
                    const budgetMicros = 0;
                    merged.set(campaignId, {
                        ...metricRow,
                        daily_budget: budgetMicros,
                        budget_id: '',
                    });
                }
            }

            return Array.from(merged.values());
        }

        // --- REFRESH TOKEN ---
        async function getAccessToken(clientId, clientSecret, refreshToken) {
            const tokenUrl = 'https://oauth2.googleapis.com/token';
            const params = new URLSearchParams();
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('refresh_token', refreshToken);
            params.append('grant_type', 'refresh_token');

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Error refreshing token: ${err}`);
            }

            const data = await response.json();
            return data.access_token;
        }

        // --- FETCH ACCESSIBLE CUSTOMERS (Auto-Discovery) ---
        async function fetchAccessibleCustomers(accessToken, developerToken) {
            const url = `https://googleads.googleapis.com/${API_VERSION}/customers:listAccessibleCustomers`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': developerToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return []; // Si falla, devolvemos vacío y usamos config manual
            const data = await response.json();
            return data.resourceNames || []; // ej: ["customers/1234567890", ...]
        }

        async function fetchCustomerDetails(accessToken, developerToken, customerId, mccId) {
            const query = `SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1`;
            const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:searchStream`;

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'developer-token': developerToken,
                        'Content-Type': 'application/json',
                        'login-customer-id': mccId // Importante para acceder a subcuentas
                    },
                    body: JSON.stringify({ query }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data[0] && data[0].results && data[0].results[0]) {
                        return data[0].results[0].customer;
                    }
                }
            } catch (e) {
                return null;
            }
            return null;
        }

        async function refreshMissingAccountCurrencies(
            accessToken: string,
            developerToken: string,
            loginCustomerId: string,
            agencyId: string,
        ) {
            const { data: missing, error } = await supabase
                .from('ad_accounts_config')
                .select('account_id')
                .eq('agency_id', agencyId)
                .eq('platform', 'google')
                .eq('is_active', true)
                .or('currency.is.null,currency.eq.');

            if (error || !missing?.length) return;

            for (const row of missing) {
                const details = await fetchCustomerDetails(accessToken, developerToken, row.account_id, loginCustomerId);
                const raw = details?.currencyCode ?? details?.currency_code ?? null;
                if (!raw) continue;
                const { error: updErr } = await supabase
                    .from('ad_accounts_config')
                    .update({ currency: String(raw).toUpperCase() })
                    .eq('agency_id', agencyId)
                    .eq('platform', 'google')
                    .eq('account_id', row.account_id);
                if (updErr) console.warn(`refresh currency ${row.account_id}:`, updErr.message);
            }
        }

        // --- MAIN PROCESS AGENCY (SAAS MODEL) ---
        async function processAgency(agency: any) {
            const integrations = agency.settings?.integrations || {};

            // 1. CREDENCIALES DE LA PLATAFORMA (Taimbox)
            const clientId = getSecret('GOOGLE_CLIENT_ID');
            const clientSecret = getSecret('GOOGLE_CLIENT_SECRET');
            const developerToken = getSecret('GOOGLE_DEVELOPER_TOKEN');

            // 2. CREDENCIALES DEL CLIENTE (Agencia)
            // Prioridad: Columna DB (nuevo OAuth) > Integrations JSON (legacy) > Env Global (testing)
            const refreshToken = agency.google_ads_refresh_token || integrations.googleRefreshToken || getSecret('GOOGLE_REFRESH_TOKEN');
            const loginCustomerId = agency.google_ads_customer_id || integrations.googleAdsCustomerId || getSecret('GOOGLE_MCC_ID');

            // Validación
            if (!clientId || !clientSecret || !developerToken) {
                await log(`❌ Error Crítico: Faltan credenciales de PLATAFORMA (Client ID/Secret/DevToken) en variables de entorno.`);
                return;
            }

            if (!refreshToken) {
                await log(`ℹ️ Agencia ${agency.name} saltada: No tiene Google Ads conectado (Falta Refresh Token).`);
                return;
            }

            await log(`🏢 Procesando ${agency.name} (Modo SaaS)...`);

            try {
                await log(`  ⏳ Refrescando token de acceso...`);
                const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);
                await log(`  ✅ Token obtenido.`);

                const { data: accountsRaw, error: accError } = await supabase
                    .from('ad_accounts_config')
                    .select('account_id, account_name')
                    .eq('agency_id', agency.id)
                    .eq('platform', 'google')
                    .eq('is_active', true);

                if (accError) {
                    await log(`    ❌ Error consultando cuentas en BD: ${accError.message}`);
                    return;
                }

                let clients = accountsRaw || [];
                await log(`    🔍 Encontradas ${clients.length} cuentas ACTIVAS en configuración.`);

                if (clients.length === 0 && loginCustomerId) {
                    await log(`    ℹ️ Sin filas en ad_accounts_config; obteniendo MCC y subcuentas (${loginCustomerId})...`);
                    const childAccounts = await fetchChildAccounts(accessToken, loginCustomerId, developerToken);
                    if (childAccounts.length > 0) {
                        clients = childAccounts;
                        await log(`    ✅ Encontradas ${clients.length} cuentas (MCC + sub-MCCs + subcuentas).`);
                    } else {
                        await log(`    ℹ️ No se obtuvieron subcuentas; usando solo cuenta MCC (${loginCustomerId}).`);
                        clients = [{ account_id: loginCustomerId, account_name: `Cuenta ${loginCustomerId}` }];
                    }
                }
                if (clients.length === 0) {
                    await log(`    ℹ️ Sin cuentas en ad_accounts_config ni cuenta seleccionada en la agencia.`);
                    return;
                }

                await log(`    ⏳ Consultando métricas para ${clients.length} cuentas...`);

                for (const client of clients) {
                    const customerDetails = await fetchCustomerDetails(accessToken, developerToken, client.account_id, loginCustomerId);
                    const accountCurrency = customerDetails?.currencyCode ?? customerDetails?.currency_code ?? null;
                    await upsertGoogleAccountConfig(
                        agency.id,
                        client.account_id,
                        client.account_name,
                        accountCurrency ? String(accountCurrency) : null,
                    );

                    const campaigns = await fetchCampaigns(accessToken, client.account_id, clientSecret, clientId, developerToken, refreshToken, loginCustomerId);

                    const dateRange = getDateRange();
                    if (campaigns.length > 0) {
                        const upsertData = campaigns.map(c => ({
                            client_id: c.client_id,
                            client_name: client.account_name,
                            campaign_id: c.campaign_id,
                            campaign_name: c.campaign_name,
                            status: c.status,
                            date: c.date,
                            cost: c.cost,
                            daily_budget: c.daily_budget,
                            budget_id: c.budget_id || null,
                            agency_id: agency.id,
                            conversions: c.conversions,
                            conversions_value: c.conversions_value,
                            impressions: c.impressions,
                            clicks: c.clicks
                        }));

                        await supabase.from('google_ads_campaigns')
                            .delete()
                            .eq('agency_id', agency.id)
                            .eq('client_id', client.account_id)
                            .gte('date', dateRange.firstDay)
                            .lte('date', dateRange.today);

                        const { error } = await supabase.from('google_ads_campaigns').upsert(upsertData, { onConflict: 'campaign_id, date' });
                        if (error) await log(`    ❌ Error guardando ${client.account_name}: ${error.message}`);
                        else await log(`    ✅ ${client.account_name}: ${campaigns.length} campañas.`);
                    } else {
                        await supabase.from('google_ads_campaigns')
                            .delete()
                            .eq('agency_id', agency.id)
                            .eq('client_id', client.account_id)
                            .gte('date', dateRange.firstDay)
                            .lte('date', dateRange.today);
                        const placeholderRow = {
                            client_id: client.account_id,
                            client_name: client.account_name,
                            campaign_id: `__no_campaigns_${client.account_id}`,
                            campaign_name: client.account_name,
                            status: 'NONE',
                            date: dateRange.firstDay,
                            cost: 0,
                            daily_budget: 0,
                            agency_id: agency.id,
                            conversions: 0,
                            conversions_value: 0,
                            impressions: 0,
                            clicks: 0
                        };
                        const { error: placeErr } = await supabase.from('google_ads_campaigns').upsert(placeholderRow, { onConflict: 'campaign_id, date' });
                        if (placeErr) await log(`    ⚠️ Placeholder ${client.account_name}: ${placeErr.message}`);
                        await log(`    ⏭️ ${client.account_name}: 0 campañas (registrada con 0 €).`);
                    }
                }

                const syncedClientIds = clients.map((c: { account_id: string }) => c.account_id);
                if (syncedClientIds.length > 0) {
                    const { error: delErr } = await supabase
                        .from('google_ads_campaigns')
                        .delete()
                        .eq('agency_id', agency.id)
                        .not('client_id', 'in', syncedClientIds);
                    if (delErr) await log(`    ⚠️ Aviso limpieza cuentas antiguas: ${delErr.message}`);
                }

                await refreshMissingAccountCurrencies(accessToken, developerToken, loginCustomerId, agency.id);

            } catch (e: any) {
                await log(`    ❌ Error Agencia ${agency.name}: ${e.message}`);
            }
        }


        // 5. Query Agencies (incluir columnas de Google Ads para modo SaaS)
        let query = supabase.from('agencies').select('id, name, settings, google_ads_refresh_token, google_ads_customer_id')
        if (agency_id) {
            query = query.eq('id', agency_id)
        }

        const { data: agencies, error: agenciesError } = await query

        if (agenciesError) throw new Error(agenciesError.message)

        if (agencies) {
            for (const agency of agencies) {
                await processAgency(agency)
            }
        }

        await log('🎉 Sincronización finalizada correctamente.')

        await completeAdsSyncLog(supabase, {
            platform: 'google',
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
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: error.status,
            })
        }
        const message = error instanceof Error ? error.message : 'Error interno'
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
