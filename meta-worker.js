
/* Ejecutar con: node meta-worker.js */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const cleanEnv = (val) => val ? val.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim() : '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_VERSION = 'v19.0';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Faltan claves de Supabase");
  console.error("VITE_SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_KEY ? "✓" : "✗");
  process.exit(1);
}

console.log(`🔗 Conectando a Supabase: ${SUPABASE_URL}`);

// Configuración explícita para Supabase autohosteado
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    // Configuración adicional para autohosteado
    transport: 'websocket',
    timeout: 20000, // 20 segundos de timeout
  },
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function getAccountName(id, accessToken) {
    try {
        const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${id}?fields=name&access_token=${accessToken}`);
        const data = await res.json();
        if (data.error) console.error(`Error fetching name for ${id}:`, data.error.message);
        return data.name || id;
    } catch (e) {
        console.error(`Error fetching name for ${id}:`, e);
        return id;
    }
}

async function processAgency(agency, log) {
    const integrations = agency.settings?.integrations || {};
    const accessToken = integrations.metaAccessToken;

    if (!accessToken) {
        // await log(`⚠️ Agencia ${agency.name} (${agency.slug}) no tiene Access Token configurado.`);
        return;
    }

    // NUEVO: Leer cuentas desde la tabla de configuración, NO desde el JSON antiguo
    const { data: configAccounts } = await supabase
        .from('ad_accounts_config')
        .select('account_id')
        .eq('agency_id', agency.id)
        .eq('platform', 'meta')
        .eq('is_active', true);

    const ids = configAccounts?.map(a => a.account_id) || [];

    if (!ids.length) {
        await log(`⚠️ Agencia ${agency.name}: Token presente pero sin cuentas configuradas en tabla.`);
        return;
    }

    await log(`🏢 Procesando Agencia: ${agency.name} (${ids.length} cuentas)`);

    for (const id of ids) {
        const name = await getAccountName(id, accessToken);
        await log(`  👉 Cuenta: ${name} (${id})`);

        // Actualizar nombre en config
        // Actualizar nombre en config (Forzamos UPDATE para asegurar cambio)
        const { error: updateError } = await supabase
            .from('ad_accounts_config')
            .update({ account_name: name })
            .eq('account_id', id)
            .eq('agency_id', agency.id);

        if (updateError) await log(`    ⚠️ Error actualizando nombre DB: ${updateError.message}`);

        // Fetch Insights (Resumido)
        const range = { start: new Date().toISOString().slice(0, 8) + '01', end: new Date().toISOString().slice(0, 10) };
        const url = `https://graph.facebook.com/${API_VERSION}/${id}/insights?level=campaign&fields=campaign_id,campaign_name,spend,actions,action_values&time_range={'since':'${range.start}','until':'${range.end}'}&access_token=${accessToken}`;

        try {
            // (Clean Sync movido dentro de la condición de datos encontrados)

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
                        agency_id: agency.id
                    };
                });

                if (upsertData.length > 0) {
                    // CLEAN SYNC CONDICIONAL: Solo borramos si tenemos nuevos datos para reemplazar
                    await supabase.from('meta_ads_campaigns')
                        .delete()
                        .eq('client_id', id)
                        .gte('date', range.start);

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
    // LIMPIEZA DE CUENTAS HUÉRFANAS
    // Eliminar campañas de esta agencia asociadas a cuentas que NO están en la lista configurada (ids)
    if (ids.length > 0) {
        const idsString = ids.map(i => `"${i}"`).join(',');
        const { error: orphanError } = await supabase
            .from('meta_ads_campaigns')
            .delete()
            .eq('agency_id', agency.id)
            .not('client_id', 'in', `(${idsString})`);

        if (orphanError) await log(`  ⚠️ Error limpiando huérfanos: ${orphanError.message}`);
        else await log(`  🧹 Limpieza de cuentas no configuradas completada.`);
    }
}

async function processSyncJob(jobId) {
    // Verificar que el job no esté ya siendo procesado o ya completado
    const { data: existingJob } = await supabase.from('meta_sync_logs').select('status').eq('id', jobId).single();
    if (!existingJob || existingJob.status !== 'pending') {
        console.log(`[Job ${jobId}] Saltado: estado actual es '${existingJob?.status || 'no encontrado'}'`);
        return;
    }

    const log = async (msg) => {
        console.log(`[Job ${jobId}] ${msg}`); // También loguear en consola
        try {
            const { data } = await supabase.from('meta_sync_logs').select('logs').eq('id', jobId).single();
            await supabase.from('meta_sync_logs').update({ logs: [...(data?.logs || []), msg].slice(-50) }).eq('id', jobId);
        } catch (err) {
            console.error(`[Job ${jobId}] Error actualizando logs:`, err.message);
        }
    };

    try {
        // Actualizar estado a 'running' de forma atómica
        const { error: updateError } = await supabase
            .from('meta_sync_logs')
            .update({ status: 'running' })
            .eq('id', jobId)
            .eq('status', 'pending'); // Solo actualizar si sigue siendo 'pending'
        
        if (updateError) {
            console.log(`[Job ${jobId}] Ya está siendo procesado por otro worker`);
            return;
        }

        // Fetch target agency from the log
        const { data: logData } = await supabase.from('meta_sync_logs').select('agency_id').eq('id', jobId).single();
        const targetAgencyId = logData?.agency_id;

        await log(`🚀 Iniciando Worker Meta...`);
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

// Verificar conexión a Supabase
async function testConnection() {
    try {
        const { data, error } = await supabase.from('meta_sync_logs').select('id').limit(1);
        if (error) {
            console.error('❌ Error de conexión a Supabase:', error.message);
            return false;
        }
        console.log('✅ Conexión a Supabase verificada');
        return true;
    } catch (err) {
        console.error('❌ Error verificando conexión:', err.message);
        return false;
    }
}

// Set para evitar procesar el mismo job múltiples veces
const processingJobs = new Set();

// Intentar suscripción Realtime (opcional, fallback a polling)
let realtimeConnected = false;
let realtimeChannel = null;

try {
    console.log('🔌 Intentando conectar Realtime...');
    realtimeChannel = supabase.channel('meta-listener', {
        config: {
            broadcast: { self: false },
            presence: { key: '' }
        }
    })
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'meta_sync_logs' 
        }, (p) => {
            console.log('📨 Evento Realtime recibido:', p.new.id);
            if (p.new.status === 'pending' && !processingJobs.has(p.new.id)) {
                processingJobs.add(p.new.id);
                processSyncJob(p.new.id).finally(() => {
                    processingJobs.delete(p.new.id);
                });
            }
        })
        .subscribe((status, err) => {
            console.log(`🔌 Estado Realtime: ${status}`);
            if (status === 'SUBSCRIBED') {
                realtimeConnected = true;
                console.log('✅ Realtime conectado para Meta Worker');
            } else if (status === 'CHANNEL_ERROR') {
                realtimeConnected = false;
                console.warn('⚠️ Error en canal Realtime:', err?.message || 'Error desconocido');
                console.warn('⚠️ Usando solo polling');
            } else if (status === 'TIMED_OUT') {
                realtimeConnected = false;
                console.warn('⚠️ Timeout en conexión Realtime, usando solo polling');
            } else if (status === 'CLOSED') {
                realtimeConnected = false;
                console.warn('⚠️ Canal Realtime cerrado, usando solo polling');
            }
        });
    
    // Timeout para detectar si no se conecta en 10 segundos
    setTimeout(() => {
        if (!realtimeConnected) {
            console.warn('⚠️ Realtime no se conectó en 10 segundos, usando solo polling');
        }
    }, 10000);
    
} catch (err) {
    console.warn('⚠️ Error configurando Realtime:', err.message);
    console.warn('⚠️ Usando solo polling');
    realtimeConnected = false;
}

// Polling como método principal (más confiable en Supabase local)
setInterval(async () => {
    try {
        const { data, error } = await supabase
            .from('meta_sync_logs')
            .select('id')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1);
        
        if (error) {
            console.error('❌ Error consultando jobs pendientes:', error.message);
            return;
        }
        
        if (data?.length && !processingJobs.has(data[0].id)) {
            processingJobs.add(data[0].id);
            processSyncJob(data[0].id).finally(() => {
                processingJobs.delete(data[0].id);
            });
        }
    } catch (err) {
        console.error('❌ Error en polling:', err.message);
    }
}, 3000); // Reducido a 3 segundos para mejor respuesta

// Inicializar worker
(async () => {
    const connected = await testConnection();
    if (!connected) {
        console.error('❌ No se pudo conectar a Supabase. Verifica tu configuración.');
        process.exit(1);
    }
    
    // Esperar un momento para que Realtime se conecte
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mode = realtimeConnected ? 'Realtime + Polling' : 'Solo Polling';
    console.log(`Meta Worker Multi-Tenant Started... Modo: ${mode}`);
    console.log(`📊 Polling cada 3 segundos para jobs pendientes`);
})();
