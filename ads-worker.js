
/* Ejecutar con: node ads-worker.js */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_VERSION = 'v22';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Faltan claves de Supabase"); process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- UTILIDADES ---

function getDateRange() {
  const now = new Date();
  // Usar el mes ACTUAL
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const year = currentMonth.getFullYear();
  const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
  const day = String(currentMonth.getDate()).padStart(2, '0');
  const firstDay = `${year}-${month}-${day}`;
  const today = new Date().toISOString().split('T')[0];
  return { firstDay, today };
}

// Obtener ACCESS TOKEN usando Refresh Token
async function getAccessToken(clientId, clientSecret, refreshToken) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }),
    });
    const data = await response.json();
    if (!data.access_token) throw new Error(JSON.stringify(data));
    return data.access_token;
  } catch (e) { throw new Error(`Error Token: ${e.message}`); }
}

async function getClientAccounts(accessToken, developerToken, mccId) {
  const query = `SELECT customer_client.client_customer, customer_client.descriptive_name FROM customer_client WHERE customer_client.status = 'ENABLED' AND customer_client.manager = false`;
  const response = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${mccId}/googleAds:searchStream`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'developer-token': developerToken, 'Content-Type': 'application/json', 'login-customer-id': mccId },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`Error API Clients: ${await response.text()}`);
  const data = await response.json();
  const clients = [];
  if (data && Array.isArray(data)) {
    data.forEach(batch => {
      if (batch.results) {
        batch.results.forEach(row => {
          const id = row.customerClient.clientCustomer.split('/')[1];
          clients.push({ id, name: row.customerClient.descriptiveName });
        });
      }
    });
  }
  return clients;
}

// Agregación por MES
async function getAccountData(customerId, accessToken, developerToken, mccId, dateRange) {
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

  const response = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:searchStream`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'developer-token': developerToken, 'Content-Type': 'application/json', 'login-customer-id': mccId },
    body: JSON.stringify({ query }),
  });

  const monthDate = dateRange.firstDay;
  const aggregator = new Map();

  if (response.ok) {
    const data = await response.json();
    if (data && Array.isArray(data)) {
      data.forEach(batch => {
        if (batch.results) {
          batch.results.forEach(row => {
            const rawCostMicros = row.metrics?.costMicros || row.metrics?.cost_micros || 0;
            const rawCostMicrosParsed = parseInt(rawCostMicros) || 0;
            const costDollars = rawCostMicrosParsed / 1000000;
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
                date: monthDate,
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
    console.warn(`⚠️ Aviso cuenta ${customerId}: ${response.status} - ${errorText.substring(0, 100)}...`);
  }

  return Array.from(aggregator.values());
}

// --- PROCESAMIENTO POR AGENCIA ---
async function processAgency(agency, log) {
  const integrations = agency.settings?.integrations || {};

  // Credenciales AGENCY LEVEL
  const clientId = process.env.GOOGLE_CLIENT_ID;         // App Global
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET; // App Global
  // El Developer Token suele ser UNO por App, pero aquí soportamos que la agencia traiga uno propio si quiere (raro, pero flexible)
  // Asumiremos que el DEVELOPER_TOKEN es de la APP (nuestro) o está en la agencia
  const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN || integrations.googleAdsDevToken;

  // MCC ID y Refresh Token SON ESPECÍFICOS DE LA AGENCIA
  const refreshToken = integrations.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN; // Fallback temporal
  const mccId = integrations.googleAdsCustomerId || process.env.GOOGLE_MCC_ID; // Fallback temporal

  // Validación básica
  if (!refreshToken || !mccId || !clientId || !clientSecret || !developerToken) {
    // await log(`ℹ️ Agencia ${agency.name} saltada: Datos de integración incompletos.`);
    return;
  }

  await log(`🏢 Procesando Agencia: ${agency.name} (MCC: ${mccId})`);

  try {
    const range = getDateRange();
    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);
    const clients = await getClientAccounts(accessToken, developerToken, mccId);

    await log(`  📋 ${clients.length} cuentas encontradas.`);

    for (const client of clients) {
      await log(`  👉 Cuenta: ${client.name} (${client.id})`);

      try {
        const campaignData = await getAccountData(client.id, accessToken, developerToken, mccId, range);

        if (campaignData.length > 0) {
          // BORRAR datos existentes del mes actual (estrategia de reemplazo mensual)
          await supabase.from('google_ads_campaigns')
            .delete()
            .eq('client_id', client.id)
            .gte('date', range.firstDay)
            .lte('date', range.today);

          const rowsToInsert = campaignData.map(d => ({ ...d, client_name: client.name }));

          const { error } = await supabase.from('google_ads_campaigns').insert(rowsToInsert);

          if (error) {
            await log(`    ❌ Error DB: ${error.message}`);
          } else {
            await log(`    ✅ Agregadas ${campaignData.length} a BD.`);
          }
        }
      } catch (err) {
        await log(`    ⚠️ Error cuenta ${client.name}: ${err.message}`);
      }
    }

  } catch (e) {
    await log(`  ❌ Error Agencia ${agency.name}: ${e.message}`);
  }
}


// --- MAIN LOOP ---
async function processSyncJob(jobId) {
  const log = async (msg) => {
    console.log(`[Job ${jobId}] ${msg}`);
    const { data } = await supabase.from('ads_sync_logs').select('logs').eq('id', jobId).single();
    const currentLogs = data?.logs || [];
    await supabase.from('ads_sync_logs').update({ logs: [...currentLogs, msg].slice(-50) }).eq('id', jobId);
  };

  try {
    await supabase.from('ads_sync_logs').update({ status: 'running' }).eq('id', jobId);

    // Fetch target agency from the log
    const { data: logData } = await supabase.from('ads_sync_logs').select('agency_id').eq('id', jobId).single();
    const targetAgencyId = logData?.agency_id;

    await log(`🚀 Iniciando Google Ads Worker...`);
    await log(`📋 Job ID: ${jobId}, Target Agency ID: ${targetAgencyId || 'None (All Agencies)'}`);
    if (targetAgencyId) await log(`🔒 Modo estricto: Sincronizando solo agencia ${targetAgencyId}`);

    // 1. Obtener agencias
    let query = supabase.from('agencies').select('id, name, slug, settings');
    if (targetAgencyId) {
      query = query.eq('id', targetAgencyId);
    }
    const { data: agencies, error } = await query;

    if (error) throw new Error(`Error obteniendo agencias: ${error.message}`);
    if (!agencies || agencies.length === 0) {
      await log("⚠️ No se encontraron agencias.");
      return;
    }

    // 2. Iterar
    for (const agency of agencies) {
      await processAgency(agency, log);
    }

    await log(`🎉 Finalizado.`);
    await supabase.from('ads_sync_logs').update({ status: 'completed' }).eq('id', jobId);

  } catch (err) {
    console.error(err);
    await log(`💥 ERROR: ${err.message}`);
    await supabase.from('ads_sync_logs').update({ status: 'error' }).eq('id', jobId);
  }
}

supabase.channel('google-worker-listener')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ads_sync_logs' }, (payload) => {
    if (payload.new.status === 'pending') processSyncJob(payload.new.id);
  })
  .subscribe();

setInterval(async () => {
  const { data } = await supabase.from('ads_sync_logs').select('id').eq('status', 'pending').limit(1);
  if (data?.length) processSyncJob(data[0].id);
}, 5000);

console.log(`📡 Google Worker Multi-Tenant Listo.`);
