export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 1200;

// Texture keys (generated procedurally)
export const TEX = {
  player: 'tex_player',
  grunt: 'tex_grunt',
  brute: 'tex_brute',
  arrowPoison: 'tex_arrow_poison',
  arrowStun: 'tex_arrow_stun',
  arrowLacerate: 'tex_arrow_lacerate',
  tile: 'tex_tile',
} as const;

export const PLAYER_RADIUS = 20;
export const PLAYER_SPEED = 180;
export const PLAYER_MAX_HP = 850;

export const ENEMY_TYPES = {
  grunt: { hp: 60, speed: 100, damage: 12, radius: 16, color: 0xcc3333, attackCooldownMs: 1200 },
  brute: { hp: 140, speed: 65, damage: 25, radius: 22, color: 0x881111, attackCooldownMs: 1800 },
} as const;

export type EnemyType = keyof typeof ENEMY_TYPES;
