/* Ejecutar con: node ads-worker.js */
import 'dotenv/config'; 
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const DEVELOPER_TOKEN = process.env.GOOGLE_DEVELOPER_TOKEN;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const MCC_ID = process.env.GOOGLE_MCC_ID || process.env.GOOGLE_LOGIN_CUSTOMER_ID; 

const API_VERSION = 'v22';

if (!SUPABASE_URL || !SUPABASE_KEY || !CLIENT_ID || !MCC_ID) { 
    console.error("❌ Faltan claves en .env"); process.exit(1); 
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- UTILIDADES ---

function getDateRange() {
  const now = new Date();
  // Usar el mes ACTUAL, no el anterior
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const year = currentMonth.getFullYear();
  const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
  const day = String(currentMonth.getDate()).padStart(2, '0');
  const firstDay = `${year}-${month}-${day}`;
  const today = new Date().toISOString().split('T')[0];
  const range = { firstDay, today };
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ads-worker.js:33',message:'Date range calculated',data:{firstDay:range.firstDay,today:range.today},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion
  return range;
}

async function getAccessToken() {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: REFRESH_TOKEN, grant_type: 'refresh_token' }),
    });
    const data = await response.json();
    if (!data.access_token) throw new Error(JSON.stringify(data));
    return data.access_token;
  } catch (e) { throw new Error(`Error Token: ${e.message}`); }
}

async function getClientAccounts(accessToken) {
  const query = `SELECT customer_client.client_customer, customer_client.descriptive_name FROM customer_client WHERE customer_client.status = 'ENABLED' AND customer_client.manager = false`;
  const response = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${MCC_ID}/googleAds:searchStream`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'developer-token': DEVELOPER_TOKEN, 'Content-Type': 'application/json', 'login-customer-id': MCC_ID },
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

// Agregación por DÍA para gráficos diarios en informes
async function getAccountData(customerId, accessToken, dateRange) {
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
    headers: { 'Authorization': `Bearer ${accessToken}`, 'developer-token': DEVELOPER_TOKEN, 'Content-Type': 'application/json', 'login-customer-id': MCC_ID },
    body: JSON.stringify({ query }),
  });

  const aggregator = new Map(); // Usamos un Map para agregar por campaña+día

  if (response.ok) {
    const data = await response.json();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ads-worker.js:100',message:'API response received',data:{customerId,isArray:Array.isArray(data),batchesCount:Array.isArray(data)?data.length:0,firstBatchStructure:data&&Array.isArray(data)&&data[0]?Object.keys(data[0]):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
    // #endregion
    if (data && Array.isArray(data)) {
      let totalRawCostMicros = 0;
      let rowCount = 0;
      console.log(`📊 [${customerId}] Procesando ${data.length} batches de la API`);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ads-worker.js:108',message:'Starting to process API data',data:{customerId,batchesCount:data.length,firstBatchResultsCount:data[0]?.results?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
      // #endregion
      data.forEach(batch => { 
        if (batch.results) { 
          batch.results.forEach(row => { 
            rowCount++;
            // #region agent log - Log detallado de cada fila
            const rawCostMicros = row.metrics?.costMicros || row.metrics?.cost_micros || 0;
            const rawCostMicrosParsed = parseInt(rawCostMicros) || 0;
            const costDollars = rawCostMicrosParsed / 1000000;
            const campaignId = String(row.campaign?.id || '');
            const dailyDate = row.segments?.date || '';
            const campaignName = row.campaign?.name || '';
            const campaignStatus = row.campaign?.status || '';
            
            // Console.log para ver en consola del servidor
            if (rowCount <= 5 || rowCount % 100 === 0) {
              console.log(`  📋 Fila ${rowCount}: ${campaignName} | ${dailyDate} | Coste: ${costDollars.toFixed(2)}€ | Micros: ${rawCostMicrosParsed}`);
            }
            
            // Log TODAS las filas con información completa
            fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ads-worker.js:120',message:'API row detail',data:{customerId,rowNumber:rowCount,campaignId,campaignName,campaignStatus,date:dailyDate,costMicrosRaw:rawCostMicros,costMicrosParsed:rawCostMicrosParsed,costDollars,metricsKeys:row.metrics?Object.keys(row.metrics):null,fullMetrics:row.metrics,segmentsKeys:row.segments?Object.keys(row.segments):null,fullSegments:row.segments,campaignKeys:row.campaign?Object.keys(row.campaign):null,fullCampaign:row.campaign},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H7'})}).catch(()=>{});
            // #endregion
            totalRawCostMicros += rawCostMicrosParsed;
            
            const key = `${campaignId}_${dailyDate}`; // Clave única: ID + DÍA

            if (!aggregator.has(key)) {
                // Acceder al presupuesto diario (la API v22 devuelve en camelCase)
                const budgetMicros = row.campaignBudget?.amountMicros || row.campaign_budget?.amount_micros || '0';
                const dailyBudget = parseInt(budgetMicros) / 1000000;
                
                aggregator.set(key, {
                    client_id: customerId,
                    campaign_id: campaignId,
                    campaign_name: campaignName,
                    status: campaignStatus,
                    date: dailyDate,
                    cost: 0,
                    daily_budget: dailyBudget,
                    conversions_value: 0,
                    conversions: 0,
                    clicks: 0,
                    impressions: 0
                });
            }

            // SUMAR MÉTRICAS (Agregación por día)
            const entry = aggregator.get(key);
            const costBefore = entry.cost;
            entry.cost += costDollars;
            // #region agent log - Log de agregación
            fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ads-worker.js:150',message:'Aggregation step',data:{customerId,key,campaignId,date:dailyDate,costDollars,costBefore,costAfter:entry.cost,aggregatorSize:aggregator.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            entry.conversions_value += parseFloat(row.metrics?.conversionsValue || row.metrics?.conversions_value || 0);
            entry.conversions += parseFloat(row.metrics?.conversions || 0);
            entry.clicks += parseInt(row.metrics?.clicks || 0);
            entry.impressions += parseInt(row.metrics?.impressions || 0);
          }); 
        } 
      });
      // #region agent log - Totales finales por cuenta
      const totalCostDollars = Array.from(aggregator.values()).reduce((sum, e) => sum + e.cost, 0);
      const entriesByDate = new Map();
      aggregator.forEach((entry, key) => {
        if (!entriesByDate.has(entry.date)) entriesByDate.set(entry.date, 0);
        entriesByDate.set(entry.date, entriesByDate.get(entry.date) + entry.cost);
      });
      const dateRange = aggregator.size > 0 ? {
        min: Math.min(...Array.from(aggregator.values()).map(e => e.date)),
        max: Math.max(...Array.from(aggregator.values()).map(e => e.date))
      } : null;
      
      console.log(`✅ [${customerId}] Procesadas ${rowCount} filas → ${aggregator.size} entradas únicas`);
      console.log(`💰 [${customerId}] Total coste: ${totalCostDollars.toFixed(2)}€ (${(totalRawCostMicros/1000000).toFixed(2)}€ en micros)`);
      console.log(`📅 [${customerId}] Rango fechas: ${dateRange?.min || 'N/A'} a ${dateRange?.max || 'N/A'}`);
      
      fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ads-worker.js:160',message:'Aggregation totals',data:{customerId,rowCount,totalRawCostMicros,totalRawCostDollars:totalRawCostMicros/1000000,totalCostDollars,entriesCount:aggregator.size,dateRange,sampleEntries:Array.from(aggregator.values()).slice(0,5)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
    }
  } else {
      const errorText = await response.text();
      console.warn(`⚠️ Aviso cuenta ${customerId}: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
  }
  
  // Devolvemos los valores del Map como array limpio
  return Array.from(aggregator.values());
}

// --- LÓGICA WORKER ---
async function processSyncJob(jobId) {
  const log = async (msg) => {
    console.log(`[Job ${jobId}] ${msg}`);
    const { data } = await supabase.from('ads_sync_logs').select('logs').eq('id', jobId).single();
    const currentLogs = data?.logs || [];
    await supabase.from('ads_sync_logs').update({ logs: [...currentLogs, msg].slice(-50) }).eq('id', jobId);
  };

  try {
    await supabase.from('ads_sync_logs').update({ status: 'running' }).eq('id', jobId);
    
    const range = getDateRange();
    await log(`🚀 Sincronizando Google Ads v22 - Mes actual: ${range.firstDay} hasta ${range.today}`);
    
    const token = await getAccessToken();
    const clients = await getClientAccounts(token);
    await log(`📋 ${clients.length} cuentas encontradas.`);

    let totalRows = 0;
    
    for (const [index, client] of clients.entries()) {
      await log(`[${index + 1}/${clients.length}] ${client.name}...`);
      
      try {
          const campaignData = await getAccountData(client.id, token, range);
          // #region agent log - Datos antes de guardar en BD
          const totalCostBeforeDB = campaignData.reduce((sum, d) => sum + (d.cost || 0), 0);
          const costByDate = new Map();
          campaignData.forEach(d => {
            if (!costByDate.has(d.date)) costByDate.set(d.date, 0);
            costByDate.set(d.date, costByDate.get(d.date) + (d.cost || 0));
          });
          
          console.log(`\n📦 [${client.name}] Preparando ${campaignData.length} filas para BD`);
          console.log(`💰 [${client.name}] Total coste a guardar: ${totalCostBeforeDB.toFixed(2)}€`);
          console.log(`📅 [${client.name}] Rango: ${range.firstDay} a ${range.today}`);
          
          fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ads-worker.js:174',message:'Data before DB insert',data:{clientId:client.id,clientName:client.name,rowsCount:campaignData.length,totalCost:totalCostBeforeDB,dateRange:range,costByDate:Object.fromEntries(costByDate),sampleRows:campaignData.slice(0,10),allCampaigns:campaignData.map(d=>({campaignId:d.campaign_id,campaignName:d.campaign_name,date:d.date,cost:d.cost}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
          // #endregion
          
          if (campaignData.length > 0) {
             const rowsToInsert = campaignData.map(d => ({ ...d, client_name: client.name }));
             
             // Upsert masivo (ahora seguro porque no hay duplicados)
             const { error } = await supabase
                .from('google_ads_campaigns')
                .upsert(rowsToInsert, { onConflict: 'campaign_id, date' });
             
             if (error) {
               console.error(`❌ Error DB ${client.name}: ${error.message}`);
               // #region agent log
               fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ads-worker.js:190',message:'DB error',data:{clientId:client.id,clientName:client.name,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
               // #endregion
             } else {
               totalRows += campaignData.length;
               console.log(`✅ [${client.name}] Guardadas ${campaignData.length} filas en BD (Total: ${totalCostBeforeDB.toFixed(2)}€)`);
               // #region agent log - Confirmación de guardado
               fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ads-worker.js:195',message:'Data saved to DB',data:{clientId:client.id,clientName:client.name,rowsInserted:campaignData.length,totalCost:totalCostBeforeDB,dateRange:range},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
               // #endregion
             }
          }
      } catch (err) {
          console.error(`Skip ${client.name}:`, err.message);
      }
    }
    
    await log(`🎉 Finalizado. ${totalRows} filas actualizadas.`);
    await supabase.from('ads_sync_logs').update({ status: 'completed' }).eq('id', jobId);

  } catch (err) {
    console.error(err);
    await log(`💥 ERROR: ${err.message}`);
    await supabase.from('ads_sync_logs').update({ status: 'error' }).eq('id', jobId);
  }
}

supabase.channel('google-worker-listener')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ads_sync_logs' }, (payload) => {
        if(payload.new.status === 'pending') processSyncJob(payload.new.id);
    })
    .subscribe();

setInterval(async () => {
  const { data } = await supabase.from('ads_sync_logs').select('id').eq('status', 'pending').limit(1);
  if (data?.length) processSyncJob(data[0].id);
}, 5000);

console.log(`📡 Google Worker v22 (Aggregated) Listo.`);
