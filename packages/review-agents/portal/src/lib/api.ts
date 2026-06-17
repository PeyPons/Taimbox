import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_REVIEW_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const HTTP_MESSAGES: Record<number, string> = {
  429: 'Tienes 3 revisiones en curso. Espera a que terminen.',
  404: 'No encontrado.',
  401: 'Sesión expirada. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para esta acción.',
  500: 'Error del servidor. Inténtalo de nuevo en unos momentos.',
};

async function parseApiError(res: Response): Promise<ApiError> {
  const text = await res.text();
  let message = HTTP_MESSAGES[res.status] ?? `Error ${res.status}`;

  if (text) {
    try {
      const j = JSON.parse(text) as { error?: string | Record<string, unknown> };
      if (typeof j.error === 'string') {
        message = j.error;
      } else if (j.error && typeof j.error === 'object') {
        message = HTTP_MESSAGES[res.status] ?? 'Datos inválidos.';
      }
    } catch {
      if (text.length < 200 && !text.startsWith('{')) {
        message = text;
      }
    }
  }

  return new ApiError(message, res.status);
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('No session');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) throw await parseApiError(res);
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: await authHeaders() });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T = { ok: boolean }>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw await parseApiError(res);
  if (res.status === 204) return { ok: true } as T;
  return res.json() as Promise<T>;
}
