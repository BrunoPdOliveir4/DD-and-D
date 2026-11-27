// ── Shared types between client and server ──

export type ClassId = 'berserker' | 'hunter' | 'runekeeper' | 'riftblade' | 'trickster';

export const CLASS_IDS: readonly ClassId[] = ['berserker', 'hunter', 'runekeeper', 'riftblade', 'trickster'];

export type AbilitySlot = 0 | 1 | 2 | 3 | 4;

export interface AbilityDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji for now
  cooldownMs: number;
  manaCost: number;
  branch: 'core' | 'offensive' | 'utility' | 'advanced';
  tier: 1 | 2 | 3; // unlock tier in talent tree
}

export interface ClassDef {
  id: ClassId;
  name: string;
  tagline: string;
  color: number;
  baseStats: BaseStats;
  passive: PassiveDef;
  abilities: AbilityDef[];
}

export interface BaseStats {
  maxHealth: number;
  speed: number;
  defense: number;
  attackDamage: number;
  attackSpeed: number; // attacks per second
  attackRange: number;
}

export interface PassiveDef {
  name: string;
  description: string;
}

// ── Auth ──

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  player: PlayerProfile;
}

export interface PlayerProfile {
  id: string;
  username: string;
  displayName: string;
  level: number;
  xp: number;
  gold: number;
  classProgress: Record<ClassId, ClassProgress>;
  guildId: string | null;
  tutorialDone: boolean;
  createdAt: string;
}

export interface ClassProgress {
  unlocked: boolean;
  xp: number;
  level: number;
  mastery: number; // infinite mastery points earned
  unlockedAbilities: string[]; // ability IDs
  equippedAbilities: string[]; // 5 equipped ability IDs
}

// ── Mastery system (infinite progression) ──

/** XP needed to reach a mastery level. Scales infinitely. */
export function masteryXpRequired(currentMastery: number): number {
  // Base 500, +200 per level, quadratic scaling
  return 500 + currentMastery * 200 + Math.floor(currentMastery * currentMastery * 10);
}

/** Mastery bonuses per point */
export interface MasteryBonus {
  damagePercent: number;   // +1% per mastery
  healthPercent: number;   // +0.5% per mastery
  cooldownPercent: number; // -0.3% per mastery (capped at 30%)
  goldBonus: number;       // +2% per mastery
}

export function masteryBonuses(mastery: number): MasteryBonus {
  return {
    damagePercent: mastery * 1,
    healthPercent: mastery * 0.5,
    cooldownPercent: Math.min(30, mastery * 0.3),
    goldBonus: mastery * 2,
  };
}

// ── Guild ──

export interface Guild {
  id: string;
  name: string;
  tag: string; // 2-4 char tag
  leaderId: string;
  memberIds: string[];
  createdAt: string;
  level: number;
  xp: number;
}

// ── Game state ──

export interface Vector2 {
  x: number;
  y: number;
}
