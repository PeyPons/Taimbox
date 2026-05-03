import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        // Fallback para secrets locales en self-hosted
        let localSecrets: any = {};
        try {
            const text = await Deno.readTextFile('/home/deno/functions/sync-google-ads/secrets.json');
            localSecrets = JSON.parse(text);
        } catch (e) {
            // No hay archivo de secrets local
        }

        const getSecret = (key: string) => Deno.env.get(key) || Deno.env.get(`VITE_${key}`) || localSecrets[key];

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 3. Parsear body para obtener agency_id (opcional - si viene vacío procesa todo)
        let requestData = {}
        try {
            requestData = await req.json()
        } catch (e) {
            // Body vacío es aceptable
        }

        const { agency_id, job_id } = requestData
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

        // --- FETCH CAMPAIGNS ---
        async function fetchCampaigns(accessToken, customerId, clientSecret, clientId, developerToken, refreshToken, mccId) {
            const dateRange = getDateRange();
            const query = `
                SELECT 
                  campaign.id, 
                  campaign.name, 
                  campaign.status, 
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

            const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:searchStream`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': developerToken,
                    'Content-Type': 'application/json',
                    'login-customer-id': mccId
                },
                body: JSON.stringify({ query }),
            });

            const aggregator = new Map();

            if (response.ok) {
                const data = await response.json();
                const processBatch = (batch: any) => {
                    if (!batch?.results) return;
                    batch.results.forEach((row: any) => {
                        const rawCostMicros = row.metrics?.costMicros ?? row.metrics?.cost_micros ?? 0;
                        const costDollars = Number(rawCostMicros) / 1000000;
                        const campaignId = String(row.campaign?.id ?? row.campaign?.id ?? '');
                        const campaignName = row.campaign?.name ?? '';
                        const campaignStatus = row.campaign?.status ?? '';

                        const key = campaignId;
                        if (!key) return;

                        if (!aggregator.has(key)) {
                            const budgetMicros = row.campaignBudget?.amountMicros ?? row.campaign_budget?.amount_micros ?? '0';
                            const dailyBudget = Number(budgetMicros) / 1000000;
                            aggregator.set(key, {
                                client_id: customerId,
                                campaign_id: campaignId,
                                campaign_name: campaignName,
                                status: campaignStatus,
                                date: dateRange.firstDay,
                                cost: 0,
                                daily_budget: dailyBudget,
                                conversions_value: 0,
                                conversions: 0,
                                clicks: 0,
                                impressions: 0
                            });
                        }
                        const entry = aggregator.get(key);
                        entry.cost += costDollars;
                        entry.conversions_value += parseFloat(String(row.metrics?.conversionsValue ?? row.metrics?.conversions_value ?? 0));
                        entry.conversions += parseFloat(String(row.metrics?.conversions ?? 0));
                        entry.clicks += parseInt(String(row.metrics?.clicks ?? 0), 10);
                        entry.impressions += parseInt(String(row.metrics?.impressions ?? 0), 10);
                    });
                };
                if (Array.isArray(data)) data.forEach(processBatch);
                else if (data && typeof data === 'object') processBatch(data);
            } else {
                const errorText = await response.text();
                // await log(`⚠️ Aviso cuenta ${customerId}: ${response.status} - ${errorText.substring(0, 100)}...`);
            }

            return Array.from(aggregator.values());
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

        if (job_id) {
            await supabase.from('ads_sync_logs').update({
                logs: logMessages.slice(-50),
                status: 'completed'
            }).eq('id', job_id)
        }

        return new Response(JSON.stringify({ success: true, logs: logMessages }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
