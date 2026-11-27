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
  unlockedAbilities: string[]; // ability IDs
  equippedAbilities: string[]; // 5 equipped ability IDs
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
