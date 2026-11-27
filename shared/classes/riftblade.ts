// ── Riftblade: assassin/mage-blade, space manipulation, high burst ──
import type { ClassDef, AbilityDef } from '../types';

const RIFTBLADE_ABILITIES: AbilityDef[] = [
  // Core
  { id: 'rb_blink_strike', name: 'Golpe Dimensional', description: 'Teleporta atrás do alvo e ataca. Dano crítico se pelas costas.', icon: '⚡', cooldownMs: 6000, manaCost: 20, branch: 'core', tier: 1 },
  { id: 'rb_void_mark', name: 'Marca do Vazio', description: 'Marca inimigo por 6s. Próximo ataque contra marcado causa +80% dano.', icon: '🎯', cooldownMs: 10000, manaCost: 15, branch: 'core', tier: 1 },
  { id: 'rb_phase_shift', name: 'Fase Dimensional', description: 'Fica intangível por 1.5s. Pode se mover mas não atacar.', icon: '👻', cooldownMs: 12000, manaCost: 20, branch: 'core', tier: 2 },
  { id: 'rb_spatial_rift', name: 'Fenda Espacial', description: 'Cria portal de entrada e saída. Pode teleportar entre eles por 10s.', icon: '🌀', cooldownMs: 18000, manaCost: 25, branch: 'core', tier: 2 },
  // Offensive
  { id: 'rb_shadow_blade', name: 'Lâmina Sombria', description: 'Projétil rápido que causa dano e reduz defesa do alvo por 4s.', icon: '🗡️', cooldownMs: 4000, manaCost: 10, branch: 'offensive', tier: 1 },
  { id: 'rb_void_eruption', name: 'Erupção do Vazio', description: 'Detona todas as Marcas do Vazio ativas. Dano massivo AoE.', icon: '💥', cooldownMs: 14000, manaCost: 30, branch: 'offensive', tier: 2 },
  { id: 'rb_clone_assault', name: 'Assalto de Clones', description: 'Cria 3 clones que atacam em sequência. Cada um causa 40% do dano.', icon: '👥', cooldownMs: 16000, manaCost: 35, branch: 'offensive', tier: 2 },
  { id: 'rb_dimensional_slash', name: 'Corte Dimensional', description: 'Corta o espaço em linha reta. Dano ignora toda defesa.', icon: '✂️', cooldownMs: 20000, manaCost: 40, branch: 'offensive', tier: 3 },
  // Utility
  { id: 'rb_shadow_step', name: 'Passo Sombrio', description: 'Dash curto que deixa cópia que atrai ataques por 2s.', icon: '💨', cooldownMs: 5000, manaCost: 10, branch: 'utility', tier: 1 },
  { id: 'rb_void_anchor', name: 'Âncora Dimensional', description: 'Marca posição. Reativar teleporta de volta e cura 20% HP.', icon: '⚓', cooldownMs: 14000, manaCost: 15, branch: 'utility', tier: 1 },
  { id: 'rb_gravity_well', name: 'Poço Gravitacional', description: 'Puxa inimigos para o centro por 2s. Slow 50% após.', icon: '🌑', cooldownMs: 16000, manaCost: 25, branch: 'utility', tier: 2 },
  { id: 'rb_temporal_rewind', name: 'Rebobinar', description: 'Retorna à posição e HP de 3s atrás.', icon: '⏪', cooldownMs: 25000, manaCost: 20, branch: 'utility', tier: 3 },
  // Advanced
  { id: 'rb_assassinate', name: 'Assassinar', description: 'Se alvo tem Marca do Vazio + menos de 25% HP: kill instantâneo.', icon: '☠️', cooldownMs: 30000, manaCost: 40, branch: 'advanced', tier: 2 },
  { id: 'rb_mirror_dimension', name: 'Dimensão Espelho', description: 'Cria arena isolada com 1 inimigo por 5s. +50% dano dentro.', icon: '🪞', cooldownMs: 35000, manaCost: 40, branch: 'advanced', tier: 2 },
  { id: 'rb_reality_shatter', name: 'Estilhaçar Realidade', description: 'AoE massiva: rasga o espaço por 6s. Dano contínuo + pull central.', icon: '💎', cooldownMs: 55000, manaCost: 50, branch: 'advanced', tier: 3 },
];

export const RIFTBLADE: ClassDef = {
  id: 'riftblade',
  name: 'Riftblade',
  tagline: 'O espaço é sua arma. A precisão é seu estilo.',
  color: 0x3498db,
  baseStats: { maxHealth: 750, speed: 190, defense: 7, attackDamage: 65, attackSpeed: 1.0, attackRange: 80 },
  passive: { name: 'Distorção Espacial', description: 'Após usar habilidade de teleporte, próximo ataque causa +40% dano e tem alcance dobrado. 4s de janela.' },
  abilities: RIFTBLADE_ABILITIES,
};
