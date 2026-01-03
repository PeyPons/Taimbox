import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Faltan claves (Asegurate de cargar .env)");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
    console.log("🔍 Checking google_ads_campaigns (Last 5)...");
    const { data: campaigns, error } = await supabase
        .from('google_ads_campaigns')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);

    if (error) console.error("Error:", error);
    else console.log("Campaigns:", JSON.stringify(campaigns, null, 2));

    console.log("🔍 Checking ad_accounts_config (Google)...");
    const { data: accounts, error: accError } = await supabase
        .from('ad_accounts_config')
        .select('*')
        .eq('platform', 'google')
        .limit(5);

    if (accError) console.error("Error Acc:", accError);
    else console.log("Accounts:", JSON.stringify(accounts, null, 2));
})();
