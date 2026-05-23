function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.REVIEW_API_PORT ?? 3001),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  supabaseServiceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  portalPublicUrl: process.env.REVIEW_PORTAL_URL ?? 'http://localhost:5174',
  corsOrigin: process.env.REVIEW_CORS_ORIGIN ?? '*',
};
