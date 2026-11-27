import type { PlayerProfile, AuthResponse } from '../../shared/types';
import { API_BASE } from '../config';

const TOKEN_KEY = 'ddd_token';
const PROFILE_KEY = 'ddd_profile';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredProfile(): PlayerProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeAuth(response: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, response.token);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(response.player));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export async function apiLogin(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao fazer login');
  }
  return res.json();
}

export async function apiRegister(username: string, password: string, displayName: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, displayName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao registrar');
  }
  return res.json();
}

export async function apiGetProfile(): Promise<PlayerProfile> {
  const token = getStoredToken();
  if (!token) throw new Error('Não autenticado');
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      throw new Error('Sessão expirada');
    }
    throw new Error('Erro ao buscar perfil');
  }
  return res.json();
}
