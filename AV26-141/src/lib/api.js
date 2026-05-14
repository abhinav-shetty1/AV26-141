import { supabase } from './supabase';

const API = import.meta.env.VITE_API_URL; // http://localhost:5000

/**
 * Authenticated fetch helper.
 * Automatically attaches the Supabase JWT from the current session.
 */
export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `API error ${res.status}`);
  }

  return res.json();
}

/**
 * Upload a file (multipart/form-data).
 * Used for the Excel import endpoint.
 */
export async function apiUpload(path, file) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Upload error ${res.status}`);
  }

  return res.json();
}
