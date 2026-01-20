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
            // Si hay un job_id, reportar progreso a la BD (opcional en edge functions, pero útil para feedback UI)
            if (job_id) {
                await supabase.from('ads_sync_logs').update({
                    logs: logMessages.slice(-50),
                    status: 'running'
                }).eq('id', job_id)
            }
        }

        await log(`🚀 Iniciando Google Ads Edge Function para ${agency_id ? `Agencia ${agency_id}` : 'Todas las agencias'}...`)

        // 4. Lógica de Negocio (Ported from ads-worker.js)

        // --- HELPERS ---
        const API_VERSION = 'v15'; // Google Ads API Version

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
                  segments.date BETWEEN '${dateRange.firstDay}' AND '${dateRange.today}'
                  AND metrics.cost_micros > 0`;

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
                if (data && Array.isArray(data)) {
                    data.forEach((batch: any) => {
                        if (batch.results) {
                            batch.results.forEach((row: any) => {
                                const rawCostMicros = row.metrics?.costMicros || row.metrics?.cost_micros || 0;
                                const costDollars = parseInt(rawCostMicros) / 1000000;
                                const campaignId = String(row.campaign?.id || '');
                                const campaignName = row.campaign?.name || '';
                                const campaignStatus = row.campaign?.status || '';

                                const key = campaignId;

                                if (!aggregator.has(key)) {
                                    const budgetMicros = row.campaignBudget?.amountMicros || row.campaign_budget?.amount_micros || '0';
                                    const dailyBudget = parseInt(budgetMicros) / 1000000;

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
                                entry.conversions_value += parseFloat(row.metrics?.conversionsValue || row.metrics?.conversions_value || 0);
                                entry.conversions += parseFloat(row.metrics?.conversions || 0);
                                entry.clicks += parseInt(row.metrics?.clicks || 0);
                                entry.impressions += parseInt(row.metrics?.impressions || 0);
                            });
                        }
                    });
                }
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


        // --- MAIN PROCESS AGENCY ---
        async function processAgency(agency: any) {
            const integrations = agency.settings?.integrations || {};

            // Env vars fallback handled inside Deno.env (MUST be set in Function Secrets)
            const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
            const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
            const developerToken = Deno.env.get('GOOGLE_DEVELOPER_TOKEN') || integrations.googleAdsDevToken;
            const globalRefreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');
            const globalMccId = Deno.env.get('GOOGLE_MCC_ID');

            const refreshToken = integrations.googleRefreshToken || globalRefreshToken;
            const mccId = integrations.googleAdsCustomerId || globalMccId;

            if (!refreshToken || !mccId || !clientId || !clientSecret || !developerToken) {
                await log(`ℹ️ Agencia ${agency.name} saltada: Faltan credenciales.`);
                if (!refreshToken) await log(`  - Falta refreshToken`);
                if (!mccId) await log(`  - Falta mccId`);
                return;
            }

            await log(`🏢 Procesando ${agency.name} (MCC: ${mccId})...`);

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

                const clients = accountsRaw || [];
                await log(`    🔍 Encontradas ${clients.length} cuentas ACTIVAS en configuración.`);

                if (clients.length === 0) {
                    await log(`    ℹ️ Sin cuentas activas en 'ad_accounts_config' para esta agencia.`);
                    return;
                }

                await log(`    ⏳ Consultando métricas para ${clients.length} cuentas...`);

                for (const client of clients) {
                    const campaigns = await fetchCampaigns(accessToken, client.account_id, clientSecret, clientId, developerToken, refreshToken, mccId);

                    if (campaigns.length > 0) {
                        const dateRange = getDateRange();
                        const upsertData = campaigns.map(c => ({
                            client_id: c.client_id,
                            client_name: client.account_name, // Usar nombre de base de datos
                            campaign_id: c.campaign_id,
                            campaign_name: c.campaign_name,
                            status: c.status,
                            date: c.date,
                            cost: c.cost,
                            daily_budget: c.daily_budget,
                            currency: 'EUR', // Hardcoded or fetch from customer details
                            agency_id: agency.id,
                            conversions: c.conversions,
                            conversions_value: c.conversions_value,
                            impressions: c.impressions,
                            clicks: c.clicks
                        }));

                        // Clean current month data for this client
                        await supabase.from('google_ads_campaigns')
                            .delete()
                            .eq('client_id', client.account_id)
                            .gte('date', dateRange.firstDay)
                            .lte('date', dateRange.today);

                        const { error } = await supabase.from('google_ads_campaigns').upsert(upsertData, { onConflict: 'campaign_id, date' });
                        if (error) await log(`    ❌ Error guardando datos ${client.account_name}: ${error.message}`);
                        // else await log(`    ✅ ${client.account_name}: ${campaigns.length} campañas actualizadas.`);
                    }
                }

            } catch (e: any) {
                await log(`    ❌ Error Agencia ${agency.name}: ${e.message}`);
            }
        }


        // 5. Query Agencies
        let query = supabase.from('agencies').select('id, name, settings')
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
