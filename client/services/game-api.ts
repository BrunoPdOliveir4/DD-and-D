import { API_BASE } from '../config';
import { getStoredToken } from './auth';

export interface RunResult {
  xpEarned: number;
  goldEarned: number;
  newLevel: number;
  totalXp: number;
}

export async function saveRun(wave: number, kills: number, gold: number, classId: string): Promise<RunResult> {
  const token = getStoredToken();
  if (!token) throw new Error('Não autenticado');

  const res = await fetch(`${API_BASE}/game/save-run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ wave, kills, gold, classId }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao salvar run');
  }

  return res.json();
}
