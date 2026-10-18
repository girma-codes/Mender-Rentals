const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3001';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('mender_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface ApiErrorBody {
  error?: string;
  issues?: { field: string; message: string }[];
}

/** Extracts a human-readable message from an API error response. */
function extractError(body: ApiErrorBody, fallback: string): string {
  // If Zod validation failed, surface each field + message so it's debuggable
  if (body.issues && body.issues.length > 0) {
    const detail = body.issues
      .map(i => (i.field ? `${i.field}: ${i.message}` : i.message))
      .join(' | ');
    return `Validation failed — ${detail}`;
  }
  return body.error ?? fallback;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  console.debug('[API POST]', path, body);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: ApiErrorBody = await res.json().catch(() => ({ error: 'Request failed' }));
    console.error('[API POST error]', path, res.status, err);
    throw new Error(extractError(err, 'Request failed'));
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err: ApiErrorBody = await res.json().catch(() => ({ error: 'Request failed' }));
    console.error('[API GET error]', path, res.status, err);
    throw new Error(extractError(err, 'Request failed'));
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  console.debug('[API PATCH]', path, body);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: ApiErrorBody = await res.json().catch(() => ({ error: 'Request failed' }));
    console.error('[API PATCH error]', path, res.status, err);
    throw new Error(extractError(err, 'Request failed'));
  }
  return res.json() as Promise<T>;
}
