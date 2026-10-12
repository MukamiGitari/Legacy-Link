/**
 * API client for Cloudflare Worker & Neon backend.
 *
 * Uses short-lived access tokens kept in memory and httpOnly refresh cookies
 * handled automatically by the browser.
 */

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

const DEFAULT_API_URL = 'https://legacy-link-api.heritagehub.workers.dev';
const API_BASE = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '') + '/api';

interface RequestOptions {
  method?: string;
  body?: any;
  retry?: boolean;
}

async function request<T = any>(path: string, { method = 'GET', body, retry = true }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include', // sends and receives the httpOnly refresh cookie
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, { method, body, retry: false });
    }
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed (${res.status})`);
  }

  if (res.status === 204) {
    return null as unknown as T;
  }

  return res.json();
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: any) => request<T>(path, { method: 'POST', body }),
  put: <T = any>(path: string, body?: any) => request<T>(path, { method: 'PUT', body }),
  del: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export async function uploadFileToR2({
  file,
  albumId,
}: {
  category?: string;
  file: File;
  recipeId?: string;
  albumId?: string;
}) {
  // Strategy 1: Direct upload via Worker endpoint (CORS-safe, streams directly to R2 bucket binding)
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (albumId) formData.append('albumId', albumId);

    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/albums/photos/upload-direct`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return { key: data.key, url: data.publicUrl || data.url };
    }
  } catch (directErr) {
    console.warn('[upload] direct upload failed, trying presign fallback:', directErr);
  }

  // Strategy 2: Presigned S3 PUT upload fallback
  const { uploadUrl, key, publicUrl } = await api.post<{ uploadUrl: string; key: string; publicUrl: string }>(
    '/albums/photos/presign-upload',
    {
      albumId,
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    }
  );

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error('Upload to storage failed');
  }

  return { key, url: publicUrl };
}
