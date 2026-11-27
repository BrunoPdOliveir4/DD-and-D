// Arrow types for the Hunter's quiver system
export type ArrowType = 'poison' | 'stun' | 'lacerate';

export const ARROW_COLORS: Record<ArrowType, number> = {
  poison: 0x2ecc71,
  stun: 0x3498db,
  lacerate: 0xe74c3c,
};

export const ARROW_LABELS: Record<ArrowType, string> = {
  poison: '🟢',
  stun: '🔵',
  lacerate: '🔴',
};

export const QUIVER_SIZE = 9;
export const RELOAD_MS = 4000;
export const ARROW_SPEED = 500;
export const ARROW_DAMAGE = 35;

export interface QuiverState {
  arrows: ArrowType[];
  currentIndex: number;
  reloading: boolean;
  reloadStartMs: number;
}

/** Shuffle and create a quiver: 3 of each type */
export function createQuiver(): QuiverState {
  const arrows: ArrowType[] = [
    'poison', 'poison', 'poison',
    'stun', 'stun', 'stun',
    'lacerate', 'lacerate', 'lacerate',
  ];
  // Fisher-Yates shuffle
  for (let i = arrows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrows[i], arrows[j]] = [arrows[j], arrows[i]];
  }
  return { arrows, currentIndex: 0, reloading: false, reloadStartMs: 0 };
}

/** Get current arrow or null if reloading */
export function currentArrow(q: QuiverState): ArrowType | null {
  if (q.reloading || q.currentIndex >= QUIVER_SIZE) return null;
  return q.arrows[q.currentIndex];
}

/** Advance to next arrow, start reload if empty */
export function fireArrow(q: QuiverState, nowMs: number): QuiverState {
  const next = q.currentIndex + 1;
  if (next >= QUIVER_SIZE) {
    return { ...q, currentIndex: next, reloading: true, reloadStartMs: nowMs };
  }
  return { ...q, currentIndex: next };
}

/** Check reload, return new quiver if done */
export function tickReload(q: QuiverState, nowMs: number): QuiverState {
  if (!q.reloading) return q;
  if (nowMs - q.reloadStartMs >= RELOAD_MS) {
    return createQuiver();
  }
  return q;
}

export function reloadProgress(q: QuiverState, nowMs: number): number {
  if (!q.reloading) return 1;
  return Math.min(1, (nowMs - q.reloadStartMs) / RELOAD_MS);
}
