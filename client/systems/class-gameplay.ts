import Phaser from 'phaser';
import type { ClassId } from '../../shared/types';
import { ALL_CLASSES } from '../../shared/classes';
import { PLAYER_RADIUS, WORLD_WIDTH, WORLD_HEIGHT } from './constants';

/** Generate a player texture based on class */
export function generatePlayerTexture(scene: Phaser.Scene, classId: ClassId): string {
  const texKey = `tex_player_${classId}`;
  if (scene.textures.exists(texKey)) return texKey;

  const def = ALL_CLASSES[classId];
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const r = PLAYER_RADIUS;
  const d = r * 2;

  // Body circle
  g.fillStyle(def.color, 0.9);
  g.fillCircle(r, r, r);

  // Inner ring
  g.lineStyle(2, 0xffffff, 0.2);
  g.strokeCircle(r, r, r - 3);

  // Class-specific detail
  switch (classId) {
    case 'hunter':
      // Arrow indicator pointing right
      g.fillStyle(0xffffff, 0.7);
      g.fillTriangle(r + r * 0.4, r, r + r * 0.8, r, r + r * 0.6, r - 4);
      g.fillTriangle(r + r * 0.4, r, r + r * 0.8, r, r + r * 0.6, r + 4);
      break;
    case 'berserker':
      // Axe cross
      g.lineStyle(3, 0xffffff, 0.5);
      g.lineBetween(r - 6, r - 6, r + 6, r + 6);
      g.lineBetween(r + 6, r - 6, r - 6, r + 6);
      break;
    case 'runekeeper':
      // Rune circle
      g.lineStyle(1, 0xffffff, 0.4);
      g.strokeCircle(r, r, 8);
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(r, r, 3);
      break;
    case 'riftblade':
      // Slash mark
      g.lineStyle(2, 0xffffff, 0.6);
      g.lineBetween(r - 8, r + 4, r + 8, r - 4);
      g.lineBetween(r - 6, r - 6, r + 6, r + 6);
      break;
    case 'trickster':
      // Jester dots
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(r - 5, r - 3, 3);
      g.fillCircle(r + 5, r - 3, 3);
      // Smile arc
      g.lineStyle(1, 0xffffff, 0.4);
      g.arc(r, r + 2, 6, 0, Math.PI, false);
      g.strokePath();
      break;
  }

  // Direction dot
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(r + r * 0.65, r, 3);

  g.generateTexture(texKey, d, d);
  g.destroy();
  return texKey;
}

/** Basic attack behavior per class */
export interface BasicAttackConfig {
  type: 'ranged' | 'melee' | 'rune' | 'hybrid';
  projectileSpeed: number;
  damage: number;
  range: number;
  attackCooldownMs: number;
  color: number;
  secondaryDamage?: number; // for hybrid: weak ranged projectile damage
}

export function getBasicAttackConfig(classId: ClassId): BasicAttackConfig {
  const def = ALL_CLASSES[classId];
  const stats = def.baseStats;

  switch (classId) {
    case 'hunter':
      return { type: 'ranged', projectileSpeed: 500, damage: stats.attackDamage, range: stats.attackRange, attackCooldownMs: 800, color: def.color };
    case 'berserker':
      return { type: 'melee', projectileSpeed: 0, damage: stats.attackDamage, range: stats.attackRange, attackCooldownMs: 600, color: def.color };
    case 'runekeeper':
      return { type: 'rune', projectileSpeed: 350, damage: stats.attackDamage, range: stats.attackRange, attackCooldownMs: 1200, color: def.color };
    case 'riftblade':
      return { type: 'melee', projectileSpeed: 0, damage: stats.attackDamage, range: 80, attackCooldownMs: 500, color: def.color };
    case 'trickster':
      return { type: 'hybrid', projectileSpeed: 350, damage: stats.attackDamage, range: 70, attackCooldownMs: 600, color: def.color, secondaryDamage: 12 };
    default:
      return { type: 'ranged', projectileSpeed: 500, damage: 30, range: 200, attackCooldownMs: 800, color: 0xffffff };
  }
}
