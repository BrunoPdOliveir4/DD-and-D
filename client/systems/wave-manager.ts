import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT, type EnemyType, ENEMY_TYPES } from '../systems/constants';

export interface WaveConfig {
  enemies: Array<{ type: EnemyType; count: number }>;
}

export function buildWave(waveNumber: number): WaveConfig {
  const gruntCount = 3 + waveNumber * 2;
  const bruteCount = Math.floor(waveNumber / 3);
  const enemies: WaveConfig['enemies'] = [{ type: 'grunt', count: gruntCount }];
  if (bruteCount > 0) enemies.push({ type: 'brute', count: bruteCount });
  return { enemies };
}

/** Random spawn position on the arena edge, outside camera */
export function randomEdgePosition(): { x: number; y: number } {
  const margin = 60;
  const side = Math.floor(Math.random() * 4);
  switch (side) {
    case 0: // top
      return { x: margin + Math.random() * (WORLD_WIDTH - margin * 2), y: margin };
    case 1: // bottom
      return { x: margin + Math.random() * (WORLD_WIDTH - margin * 2), y: WORLD_HEIGHT - margin };
    case 2: // left
      return { x: margin, y: margin + Math.random() * (WORLD_HEIGHT - margin * 2) };
    default: // right
      return { x: WORLD_WIDTH - margin, y: margin + Math.random() * (WORLD_HEIGHT - margin * 2) };
  }
}
