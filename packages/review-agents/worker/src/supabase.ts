import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { env } from './env.js';

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws as unknown as typeof WebSocket },
});
