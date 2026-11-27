// ── Berserker: melee fury-based, basic attack focused ──
import type { ClassDef, AbilityDef } from '../types';

const BERSERKER_ABILITIES: AbilityDef[] = [
  // Core
  { id: 'bsk_axe_throw', name: 'Arremesso de Machado', description: 'Arremessa machado que atordoa por 1s e retorna.', icon: '🪓', cooldownMs: 7000, manaCost: 15, branch: 'core', tier: 1 },
  { id: 'bsk_war_cry', name: 'Grito de Guerra', description: 'Buff +30% velocidade de ataque por 5s. Inimigos próximos são repelidos.', icon: '📢', cooldownMs: 12000, manaCost: 20, branch: 'core', tier: 1 },
  { id: 'bsk_bloodlust', name: 'Sede de Sangue', description: 'Próximos 5 ataques curam 15% do dano causado.', icon: '🩸', cooldownMs: 14000, manaCost: 25, branch: 'core', tier: 2 },
  { id: 'bsk_fury_slam', name: 'Golpe Furioso', description: 'Slam AoE que causa dano proporcional à fúria acumulada.', icon: '💢', cooldownMs: 10000, manaCost: 20, branch: 'core', tier: 2 },
  // Offensive
  { id: 'bsk_cleave', name: 'Cleave', description: 'Ataque em arco que atinge todos inimigos à frente.', icon: '⚔️', cooldownMs: 5000, manaCost: 15, branch: 'offensive', tier: 1 },
  { id: 'bsk_execute', name: 'Execução', description: 'Dano massivo em alvo com menos de 30% HP. Reseta se matar.', icon: '💀', cooldownMs: 8000, manaCost: 25, branch: 'offensive', tier: 2 },
  { id: 'bsk_whirlwind', name: 'Redemoinho', description: 'Gira causando dano AoE por 3s. Pode se mover durante.', icon: '🌪️', cooldownMs: 12000, manaCost: 30, branch: 'offensive', tier: 2 },
  { id: 'bsk_rampage', name: 'Frenesi', description: 'Cada kill nos próximos 6s aumenta ataque em +15%. Acumula.', icon: '🔥', cooldownMs: 18000, manaCost: 35, branch: 'offensive', tier: 3 },
  // Utility
  { id: 'bsk_charge', name: 'Investida', description: 'Avança em linha reta, empurrando inimigos no caminho.', icon: '🏃', cooldownMs: 6000, manaCost: 15, branch: 'utility', tier: 1 },
  { id: 'bsk_iron_skin', name: 'Pele de Ferro', description: 'Reduz dano recebido em 50% por 3s.', icon: '🛡️', cooldownMs: 15000, manaCost: 20, branch: 'utility', tier: 1 },
  { id: 'bsk_intimidate', name: 'Intimidar', description: 'Inimigos próximos fogem por 2s e tomam 20% mais dano.', icon: '😤', cooldownMs: 16000, manaCost: 25, branch: 'utility', tier: 2 },
  { id: 'bsk_undying', name: 'Imortal', description: 'Ao chegar a 0 HP, sobrevive com 1 HP e fica invulnerável por 2s. Cooldown longo.', icon: '💪', cooldownMs: 45000, manaCost: 0, branch: 'utility', tier: 3 },
  // Advanced
  { id: 'bsk_berserker_rage', name: 'Fúria do Berserker', description: 'Buff: +40% dano, +20% velocidade, mas -30% defesa por 8s.', icon: '🔴', cooldownMs: 25000, manaCost: 30, branch: 'advanced', tier: 2 },
  { id: 'bsk_ground_pound', name: 'Terremoto', description: 'Golpe no chão: onda sísmica em todas direções, stun 1.5s.', icon: '🌋', cooldownMs: 20000, manaCost: 35, branch: 'advanced', tier: 2 },
  { id: 'bsk_avatar_of_war', name: 'Avatar de Guerra', description: 'Transformação: dobra de tamanho, +100% dano, +50% HP por 10s.', icon: '👹', cooldownMs: 60000, manaCost: 50, branch: 'advanced', tier: 3 },
];

export const BERSERKER: ClassDef = {
  id: 'berserker',
  name: 'Berserker',
  tagline: 'Fúria pura. Cada golpe alimenta o próximo.',
  color: 0xe74c3c,
  baseStats: { maxHealth: 1100, speed: 160, defense: 12, attackDamage: 55, attackSpeed: 1.5, attackRange: 50 },
  passive: { name: 'Fúria Crescente', description: 'Ataques sequenciais acumulam Fúria (+5% dano por stack, max 10). Perde stacks após 3s sem atacar.' },
  abilities: BERSERKER_ABILITIES,
};
