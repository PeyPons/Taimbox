import type { Request, Response, NextFunction } from 'express';
import { supabaseForUser } from '../supabase.js';

export interface AuthLocals {
  userId: string;
  jwt: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const jwt = header.slice(7);
  const sb = supabaseForUser(jwt);
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  res.locals.auth = { userId: data.user.id, jwt } satisfies AuthLocals;
  next();
}
