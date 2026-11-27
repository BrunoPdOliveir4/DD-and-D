// ── Trickster: chaotic jester, skill-focused, illusions ──
import type { ClassDef, AbilityDef } from '../types';

const TRICKSTER_ABILITIES: AbilityDef[] = [
  // Core
  { id: 'tk_juggle', name: 'Malabarismo', description: 'Arremessa 3 bolas que ricocheteiam entre inimigos.', icon: '🤹', cooldownMs: 5000, manaCost: 15, branch: 'core', tier: 1 },
  { id: 'tk_smoke_mirror', name: 'Espelho de Fumaça', description: 'Cria cópia ilusória que atrai inimigos por 4s. Explode ao acabar.', icon: '🪞', cooldownMs: 10000, manaCost: 20, branch: 'core', tier: 1 },
  { id: 'tk_card_trick', name: 'Truque de Cartas', description: 'Lança 5 cartas em leque. Cada carta tem efeito aleatório (dano/slow/stun).', icon: '🃏', cooldownMs: 8000, manaCost: 20, branch: 'core', tier: 2 },
  { id: 'tk_vanish', name: 'Desaparecer', description: 'Fica invisível por 3s. Próximo ataque causa +60% dano e revela.', icon: '💨', cooldownMs: 14000, manaCost: 25, branch: 'core', tier: 2 },
  // Offensive
  { id: 'tk_poison_flask', name: 'Frasco de Veneno', description: 'Arremessa frasco que cria poça de veneno por 4s. DoT + slow.', icon: '🧪', cooldownMs: 7000, manaCost: 15, branch: 'offensive', tier: 1 },
  { id: 'tk_explosive_confetti', name: 'Confete Explosivo', description: 'AoE de confete que causa dano e confunde inimigos (movem aleatório) por 2s.', icon: '🎉', cooldownMs: 12000, manaCost: 25, branch: 'offensive', tier: 2 },
  { id: 'tk_knife_rain', name: 'Chuva de Facas', description: 'Joga 8 facas em área circular. Cada faca causa dano individual.', icon: '🔪', cooldownMs: 10000, manaCost: 25, branch: 'offensive', tier: 2 },
  { id: 'tk_grand_finale', name: 'Grand Finale', description: 'Combo massivo: fumaça + clones + explosão. Dano escala com habilidades usadas antes.', icon: '🎆', cooldownMs: 35000, manaCost: 45, branch: 'offensive', tier: 3 },
  // Utility
  { id: 'tk_tumble', name: 'Cambalhota', description: 'Roll rápido com i-frames (invulnerável durante). Curto cooldown.', icon: '🤸', cooldownMs: 4000, manaCost: 10, branch: 'utility', tier: 1 },
  { id: 'tk_swap', name: 'Troca', description: 'Troca de posição com um inimigo. O inimigo fica atordoado 1s.', icon: '🔄', cooldownMs: 12000, manaCost: 20, branch: 'utility', tier: 1 },
  { id: 'tk_puppet_show', name: 'Show de Marionetes', description: 'Controla um inimigo por 3s. Ele ataca os aliados.', icon: '🎭', cooldownMs: 20000, manaCost: 30, branch: 'utility', tier: 2 },
  { id: 'tk_lucky_coin', name: 'Moeda da Sorte', description: 'Cara: cura 25% HP. Coroa: +50% dano por 5s. Sempre bom.', icon: '🪙', cooldownMs: 18000, manaCost: 15, branch: 'utility', tier: 3 },
  // Advanced
  { id: 'tk_hall_of_mirrors', name: 'Salão de Espelhos', description: 'Cria 4 clones que copiam suas habilidades com 30% dano por 6s.', icon: '🏰', cooldownMs: 30000, manaCost: 40, branch: 'advanced', tier: 2 },
  { id: 'tk_chaos_roulette', name: 'Roleta do Caos', description: 'Habilidade aleatória: pode ser qualquer skill do jogo. Sem custo.', icon: '🎰', cooldownMs: 15000, manaCost: 0, branch: 'advanced', tier: 2 },
  { id: 'tk_curtain_call', name: 'Última Cortina', description: 'O mundo vira palco: todos inimigos dançam (stun 3s) + dano por segundo.', icon: '🎪', cooldownMs: 60000, manaCost: 50, branch: 'advanced', tier: 3 },
];

export const TRICKSTER: ClassDef = {
  id: 'trickster',
  name: 'Trickster',
  tagline: 'O caos é o plano. A confusão é a arma.',
  color: 0xf39c12,
  baseStats: { maxHealth: 680, speed: 200, defense: 5, attackDamage: 35, attackSpeed: 1.3, attackRange: 120 },
  passive: { name: 'Improviso', description: 'A cada 4 habilidades usadas, a próxima tem cooldown zerado e custo zero. Contador visual no HUD.' },
  abilities: TRICKSTER_ABILITIES,
};
