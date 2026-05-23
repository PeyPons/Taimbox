import { env } from './env.js';

export function redisConnectionOptions() {
  const u = new URL(env.redisUrl);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    password: u.password || undefined,
    username: u.username || undefined,
    maxRetriesPerRequest: null as null,
  };
}
