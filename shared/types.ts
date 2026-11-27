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

// ── Global player level (separate from mastery, harder to level) ──

/** XP needed for global player level. Much harder than mastery. */
export function globalLevelXpRequired(currentLevel: number): number {
  // Level 1→2: 1000, then +500 per level + cubic scaling
  return 1000 + (currentLevel - 1) * 500 + Math.floor(Math.pow(currentLevel - 1, 2.5) * 20);
}

/** Total XP needed from 0 to reach a given level */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += globalLevelXpRequired(i);
  }
  return total;
}

/** Calculate level from total XP */
export function levelFromXp(totalXp: number): { level: number; currentLevelXp: number; nextLevelXp: number } {
  let level = 1;
  let remaining = totalXp;
  while (true) {
    const needed = globalLevelXpRequired(level);
    if (remaining < needed) {
      return { level, currentLevelXp: remaining, nextLevelXp: needed };
    }
    remaining -= needed;
    level++;
  }
}

// ── Mastery system (infinite progression) ──

// Mastery tier names and colors
export interface MasteryTier {
  name: string;
  minMastery: number;
  color: number;
  borderStyle: 'none' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'master' | 'grandmaster';
}

export const MASTERY_TIERS: MasteryTier[] = [
  { name: 'Sem Faixa',  minMastery: 0,  color: 0x555555, borderStyle: 'none' },
  { name: 'Bronze',     minMastery: 1,  color: 0xcd7f32, borderStyle: 'bronze' },
  { name: 'Prata',      minMastery: 3,  color: 0xc0c0c0, borderStyle: 'silver' },
  { name: 'Ouro',       minMastery: 5,  color: 0xffd700, borderStyle: 'gold' },
  { name: 'Diamante',   minMastery: 10, color: 0x00d4ff, borderStyle: 'diamond' },
  { name: 'Mestre',     minMastery: 20, color: 0xff4500, borderStyle: 'master' },
  { name: 'Grão-Mestre', minMastery: 50, color: 0xff00ff, borderStyle: 'grandmaster' },
];

export function getMasteryTier(mastery: number): MasteryTier {
  let tier = MASTERY_TIERS[0];
  for (const t of MASTERY_TIERS) {
    if (mastery >= t.minMastery) tier = t;
  }
  return tier;
}

// Mastery-gated skills: 5 per class, unlocked at mastery milestones
export const MASTERY_SKILL_GATES: Record<ClassId, { abilityId: string; masteryRequired: number }[]> = {
  hunter: [
    { abilityId: 'hnt_quick_reload', masteryRequired: 2 },
    { abilityId: 'hnt_eagle_eye', masteryRequired: 5 },
    { abilityId: 'hnt_prey_mark', masteryRequired: 8 },
    { abilityId: 'hnt_arrow_storm', masteryRequired: 12 },
    { abilityId: 'hnt_wild_instinct', masteryRequired: 20 },
  ],
  berserker: [
    { abilityId: 'bsk_axe_throw', masteryRequired: 2 },
    { abilityId: 'bsk_bloodlust', masteryRequired: 5 },
    { abilityId: 'bsk_whirlwind', masteryRequired: 8 },
    { abilityId: 'bsk_iron_skin', masteryRequired: 12 },
    { abilityId: 'bsk_avatar_of_war', masteryRequired: 20 },
  ],
  runekeeper: [
    { abilityId: 'rk_arcane_bolt', masteryRequired: 2 },
    { abilityId: 'rk_rune_shield', masteryRequired: 5 },
    { abilityId: 'rk_chain_lightning', masteryRequired: 8 },
    { abilityId: 'rk_summon_golem', masteryRequired: 12 },
    { abilityId: 'rk_arcane_singularity', masteryRequired: 20 },
  ],
  riftblade: [
    { abilityId: 'rb_shadow_blade', masteryRequired: 2 },
    { abilityId: 'rb_phase_shift', masteryRequired: 5 },
    { abilityId: 'rb_void_eruption', masteryRequired: 8 },
    { abilityId: 'rb_clone_assault', masteryRequired: 12 },
    { abilityId: 'rb_reality_shatter', masteryRequired: 20 },
  ],
  trickster: [
    { abilityId: 'tk_poison_flask', masteryRequired: 2 },
    { abilityId: 'tk_vanish', masteryRequired: 5 },
    { abilityId: 'tk_card_trick', masteryRequired: 8 },
    { abilityId: 'tk_hall_of_mirrors', masteryRequired: 12 },
    { abilityId: 'tk_curtain_call', masteryRequired: 20 },
  ],
};

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
