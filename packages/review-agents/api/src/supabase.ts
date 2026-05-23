import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { env } from './env.js';

const serverClientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws as unknown as typeof WebSocket },
};

export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceKey,
  serverClientOptions,
);

export function supabaseForUser(jwt: string) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    ...serverClientOptions,
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}
