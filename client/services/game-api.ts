import { API_BASE } from '../config';
import { getStoredToken, storeAuth } from './auth';
import type { PlayerProfile } from '../../shared/types';

export interface RunResult {
  xpEarned: number;
  goldEarned: number;
  newLevel: number;
  totalXp: number;
  masteryUps: number;
  newMastery: number;
  classLevel: number;
  nextMasteryXp: number;
  currentClassXp: number;
  profile: PlayerProfile | null;
}

export async function saveRun(wave: number, kills: number, gold: number, classId: string, gameMode: 'arena' | 'dungeon' = 'arena'): Promise<RunResult> {
  const token = getStoredToken();
  if (!token) throw new Error('Não autenticado');

  const res = await fetch(`${API_BASE}/game/save-run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ wave, kills, gold, classId, gameMode }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao salvar run');
  }

  const result: RunResult = await res.json();

  // Sync profile locally
  if (result.profile && token) {
    storeAuth({ token, player: result.profile });
  }

  return result;
}

/** Fetch fresh profile from server */
export async function fetchProfile(): Promise<PlayerProfile | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const profile: PlayerProfile = await res.json();
    storeAuth({ token, player: profile });
    return profile;
  } catch {
    return null;
  }
}
