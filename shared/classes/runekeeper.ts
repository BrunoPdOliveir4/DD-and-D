// ── Runekeeper: caster, rune-based abilities, invocations ──
import type { ClassDef, AbilityDef } from '../types';

const RUNEKEEPER_ABILITIES: AbilityDef[] = [
  // Core
  { id: 'rk_frost_rune', name: 'Runa de Gelo', description: 'Coloca runa no chão que explode após 1s, congelando inimigos por 2s.', icon: '❄️', cooldownMs: 6000, manaCost: 20, branch: 'core', tier: 1 },
  { id: 'rk_fire_rune', name: 'Runa de Fogo', description: 'Runa que cria coluna de fogo, causando dano contínuo por 3s.', icon: '🔥', cooldownMs: 7000, manaCost: 20, branch: 'core', tier: 1 },
  { id: 'rk_summon_golem', name: 'Invocar Golem', description: 'Invoca golem de pedra que tanque inimigos por 8s. Ataca lentamente.', icon: '🗿', cooldownMs: 20000, manaCost: 35, branch: 'core', tier: 2 },
  { id: 'rk_rune_shield', name: 'Escudo Rúnico', description: 'Escudo que absorve 200 de dano por 5s. Explode ao quebrar.', icon: '🛡️', cooldownMs: 14000, manaCost: 25, branch: 'core', tier: 2 },
  // Offensive
  { id: 'rk_arcane_bolt', name: 'Projétil Arcano', description: 'Dispara projétil teleguiado que persegue o alvo mais próximo.', icon: '✨', cooldownMs: 4000, manaCost: 10, branch: 'offensive', tier: 1 },
  { id: 'rk_rune_trap', name: 'Runa Armadilha', description: 'Runa invisível que detona quando inimigo pisa. Dano alto + slow.', icon: '🪤', cooldownMs: 10000, manaCost: 20, branch: 'offensive', tier: 2 },
  { id: 'rk_chain_lightning', name: 'Relâmpago em Cadeia', description: 'Raio que salta entre 5 inimigos, dano reduzido a cada salto.', icon: '⚡', cooldownMs: 12000, manaCost: 30, branch: 'offensive', tier: 2 },
  { id: 'rk_meteor', name: 'Meteoro', description: 'Invoca meteoro que cai após 2s. Dano massivo AoE + queimadura.', icon: '☄️', cooldownMs: 25000, manaCost: 45, branch: 'offensive', tier: 3 },
  // Utility
  { id: 'rk_teleport', name: 'Teleporte Rúnico', description: 'Teleporta para posição do mouse. Deixa runa de slow onde estava.', icon: '🌀', cooldownMs: 8000, manaCost: 15, branch: 'utility', tier: 1 },
  { id: 'rk_mana_drain', name: 'Drenar Mana', description: 'Rouba energia dos inimigos próximos, reduzindo cooldowns em 2s.', icon: '💜', cooldownMs: 16000, manaCost: 0, branch: 'utility', tier: 1 },
  { id: 'rk_summon_wisp', name: 'Invocar Wisp', description: 'Wisp que cura 5% HP/s por 6s enquanto segue o jogador.', icon: '🧚', cooldownMs: 18000, manaCost: 25, branch: 'utility', tier: 2 },
  { id: 'rk_time_warp', name: 'Distorção Temporal', description: 'Área que desacelera inimigos em 60% por 4s.', icon: '⏳', cooldownMs: 20000, manaCost: 30, branch: 'utility', tier: 3 },
  // Advanced
  { id: 'rk_rune_overload', name: 'Sobrecarga Rúnica', description: 'Próximas 3 runas colocadas detonam instantaneamente com +50% dano.', icon: '💥', cooldownMs: 22000, manaCost: 30, branch: 'advanced', tier: 2 },
  { id: 'rk_elemental_fusion', name: 'Fusão Elemental', description: 'Combina gelo+fogo: área massiva que congela e depois explode.', icon: '🌈', cooldownMs: 30000, manaCost: 40, branch: 'advanced', tier: 2 },
  { id: 'rk_arcane_singularity', name: 'Singularidade Arcana', description: 'Buraco negro que puxa inimigos por 4s e depois explode.', icon: '🕳️', cooldownMs: 50000, manaCost: 50, branch: 'advanced', tier: 3 },
];

export const RUNEKEEPER: ClassDef = {
  id: 'runekeeper',
  name: 'Runekeeper',
  tagline: 'Runas são sua arma. O campo é seu tabuleiro.',
  color: 0x9b59b6,
  baseStats: { maxHealth: 700, speed: 150, defense: 6, attackDamage: 30, attackSpeed: 0.8, attackRange: 200 },
  passive: { name: 'Ressonância Rúnica', description: 'Runas colocadas próximas ressoam entre si: +15% dano por runa adjacente (raio 150px). Max 3 runas ativas.' },
  abilities: RUNEKEEPER_ABILITIES,
};
