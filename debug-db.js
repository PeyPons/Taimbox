// Script para verificar datos en Supabase directamente
// Ejecutar con: node debug-db.js
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Cargar .env manualmente (Siempre intentarlo para asegurar todas las claves)
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            if (line.trim().startsWith('#')) return;
            const cleanLine = line.trim().replace(/^export\s+/, '');
            const [key, ...values] = cleanLine.split('=');
            if (key && values.length > 0) {
                const val = values.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = val;
            }
        });
        console.log("✅ .env procesado. Claves Supabase encontradas:",
            Object.keys(process.env).filter(k => k.includes('SUPABASE'))
        );
    } else {
        console.log("⚠️ No se encontró el archivo .env en la raíz.");
    }
} catch (e) {
    console.log("⚠️ Error leyendo .env:", e.message);
}


const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
let SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
    console.log("⚠️ Service Role Key no encontrada. Usando Anon Key (lectura limitada).");
    SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Faltan claves. Asegúrate de tener .env con VITE_SUPABASE_URL y valid KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
    console.log("\n🔍 ---- GOOGLE ADS CAMPAIGNS (Últimos 5) ----");
    const { data: campaigns, error } = await supabase
        .from('google_ads_campaigns')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error consultando campañas:", error.message);
    } else if (!campaigns || campaigns.length === 0) {
        console.log("⚠️ La tabla 'google_ads_campaigns' está VACÍA.");
    } else {
        console.log(`✅ Registros encontrados: ${campaigns.length}`);
        console.log("Ejemplo de Coste (Row 0):", campaigns[0].cost);
        console.log("Ejemplo completo:", JSON.stringify(campaigns[0], null, 2));

        const costs = campaigns.map(c => c.cost);
        const total = costs.reduce((a, b) => a + Number(b), 0);
        console.log(`💰 Costes de la muestra: ${costs.join(', ')}`);
        console.log(`💰 Total muestra: ${total}`);
    }

    console.log("\n🔍 ---- AD ACCOUNTS CONFIG (Google) ----");
    const { data: accounts, error: accError } = await supabase
        .from('ad_accounts_config')
        .select('*')
        .eq('platform', 'google')
        .limit(5);

    if (accError) console.error("❌ Error Accounts:", accError.message);
    else {
        console.log(`✅ Cuentas encontradas: ${accounts?.length}`);
        if (accounts?.length) console.log("Ejemplo ID:", accounts[0].account_id);
    }
})();
