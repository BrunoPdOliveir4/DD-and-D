import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { generateTextures } from '../systems/textures';
import { generatePlayerTexture, getBasicAttackConfig, type BasicAttackConfig } from '../systems/class-gameplay';
import {
  TEX, WORLD_WIDTH, WORLD_HEIGHT, PLAYER_RADIUS, PLAYER_SPEED, PLAYER_MAX_HP,
  ENEMY_TYPES, type EnemyType,
} from '../systems/constants';
import { ALL_CLASSES } from '../../shared/classes';
import type { ClassId, ClassDef } from '../../shared/types';
import { getStoredProfile } from '../services/auth';
import {
  createQuiver, currentArrow, fireArrow, tickReload, reloadProgress,
  ARROW_DAMAGE, ARROW_SPEED, type ArrowType, type QuiverState, ARROW_COLORS,
} from '../systems/quiver';
import { saveRun, type RunResult } from '../services/game-api';
import { buildWave, randomEdgePosition } from '../systems/wave-manager';

// ── Ability definitions (3 starter abilities per class) ──
interface AbilityState {
  id: string;
  name: string;
  icon: string;
  cooldownMs: number;
  lastUsedMs: number;
}

// Map ability definition IDs to game-scene ability IDs
const ABILITY_ID_MAP: Record<string, { id: string; name: string; icon: string; cooldownMs: number }> = {
  // Hunter
  'hnt_rain_arrows': { id: 'rain', name: 'Chuva de Flechas', icon: '🏹', cooldownMs: 8000 },
  'hnt_agile_retreat': { id: 'roll', name: 'Recuo Ágil', icon: '💨', cooldownMs: 5000 },
  'hnt_piercing_arrow': { id: 'pierce', name: 'Flecha Perfurante', icon: '💎', cooldownMs: 6000 },
  'hnt_quick_reload': { id: 'quick_reload', name: 'Recarga Rápida', icon: '⚡', cooldownMs: 10000 },
  'hnt_eagle_eye': { id: 'eagle_eye', name: 'Olho de Águia', icon: '🦅', cooldownMs: 15000 },
  'hnt_prey_mark': { id: 'prey_mark', name: 'Marca da Presa', icon: '🎯', cooldownMs: 12000 },
  'hnt_arrow_storm': { id: 'arrow_storm', name: 'Tempestade de Flechas', icon: '🌪️', cooldownMs: 20000 },
  'hnt_wild_instinct': { id: 'wild_instinct', name: 'Instinto Selvagem', icon: '🐺', cooldownMs: 25000 },
  'hnt_double_shot': { id: 'double_shot', name: 'Tiro Duplo', icon: '🏹', cooldownMs: 6000 },
  'hnt_bear_trap': { id: 'bear_trap', name: 'Armadilha de Urso', icon: '🪤', cooldownMs: 10000 },
  'hnt_camouflage': { id: 'camouflage', name: 'Camuflagem', icon: '🌿', cooldownMs: 16000 },
  'hnt_falcon_stance': { id: 'falcon_stance', name: 'Postura do Falcão', icon: '🦅', cooldownMs: 18000 },
  'hnt_homing_arrow': { id: 'homing_arrow', name: 'Flecha Rastreadora', icon: '🏹', cooldownMs: 8000 },
  'hnt_final_burst': { id: 'final_burst', name: 'Rajada Final', icon: '💥', cooldownMs: 22000 },
  'hnt_explosive_arrow': { id: 'explosive_arrow', name: 'Flecha Explosiva', icon: '💣', cooldownMs: 10000 },
  // Berserker
  'bsk_cleave': { id: 'cleave', name: 'Cleave', icon: '⚔️', cooldownMs: 5000 },
  'bsk_charge': { id: 'charge', name: 'Investida', icon: '🏃', cooldownMs: 6000 },
  'bsk_war_cry': { id: 'war_cry', name: 'Grito de Guerra', icon: '📢', cooldownMs: 12000 },
  'bsk_axe_throw': { id: 'axe_throw', name: 'Arremesso de Machado', icon: '🪓', cooldownMs: 7000 },
  'bsk_whirlwind': { id: 'whirlwind', name: 'Redemoinho', icon: '🌪️', cooldownMs: 12000 },
  'bsk_bloodlust': { id: 'bloodlust', name: 'Sede de Sangue', icon: '🩸', cooldownMs: 14000 },
  'bsk_fury_slam': { id: 'fury_slam', name: 'Golpe Furioso', icon: '💢', cooldownMs: 10000 },
  'bsk_execute': { id: 'execute', name: 'Execução', icon: '💀', cooldownMs: 8000 },
  'bsk_iron_skin': { id: 'iron_skin', name: 'Pele de Ferro', icon: '🛡️', cooldownMs: 15000 },
  'bsk_intimidate': { id: 'intimidate', name: 'Intimidar', icon: '😤', cooldownMs: 16000 },
  'bsk_undying': { id: 'undying', name: 'Imortal', icon: '💪', cooldownMs: 45000 },
  'bsk_berserker_rage': { id: 'berserker_rage', name: 'Fúria do Berserker', icon: '🔴', cooldownMs: 25000 },
  'bsk_ground_pound': { id: 'ground_pound', name: 'Terremoto', icon: '🌋', cooldownMs: 20000 },
  'bsk_avatar_of_war': { id: 'avatar_of_war', name: 'Avatar de Guerra', icon: '👹', cooldownMs: 60000 },
  'bsk_rampage': { id: 'rampage', name: 'Frenesi', icon: '🔥', cooldownMs: 18000 },
  // Runekeeper
  'rk_frost_rune': { id: 'frost_rune', name: 'Runa de Gelo', icon: '❄️', cooldownMs: 6000 },
  'rk_fire_rune': { id: 'fire_rune', name: 'Runa de Fogo', icon: '🔥', cooldownMs: 7000 },
  'rk_teleport': { id: 'teleport', name: 'Teleporte Rúnico', icon: '🌀', cooldownMs: 8000 },
  'rk_arcane_bolt': { id: 'arcane_bolt', name: 'Projétil Arcano', icon: '✨', cooldownMs: 4000 },
  'rk_chain_lightning': { id: 'chain_lightning', name: 'Relâmpago em Cadeia', icon: '⚡', cooldownMs: 12000 },
  'rk_rune_shield': { id: 'rune_shield', name: 'Escudo Rúnico', icon: '🛡️', cooldownMs: 14000 },
  'rk_summon_golem': { id: 'summon_golem', name: 'Invocar Golem', icon: '🗿', cooldownMs: 20000 },
  'rk_mana_drain': { id: 'mana_drain', name: 'Drenar Mana', icon: '💜', cooldownMs: 16000 },
  'rk_summon_wisp': { id: 'summon_wisp', name: 'Invocar Wisp', icon: '🧚', cooldownMs: 18000 },
  'rk_time_warp': { id: 'time_warp', name: 'Distorção Temporal', icon: '⏳', cooldownMs: 20000 },
  'rk_rune_trap': { id: 'rune_trap', name: 'Runa Armadilha', icon: '🪤', cooldownMs: 10000 },
  'rk_meteor': { id: 'meteor', name: 'Meteoro', icon: '☄️', cooldownMs: 25000 },
  'rk_rune_overload': { id: 'rune_overload', name: 'Sobrecarga Rúnica', icon: '💥', cooldownMs: 22000 },
  'rk_elemental_fusion': { id: 'elemental_fusion', name: 'Fusão Elemental', icon: '🌈', cooldownMs: 30000 },
  'rk_arcane_singularity': { id: 'arcane_singularity', name: 'Singularidade Arcana', icon: '🕳️', cooldownMs: 50000 },
  // Riftblade
  'rb_blink_strike': { id: 'blink_strike', name: 'Golpe Dimensional', icon: '⚡', cooldownMs: 6000 },
  'rb_shadow_step': { id: 'shadow_step', name: 'Passo Sombrio', icon: '💨', cooldownMs: 5000 },
  'rb_void_mark': { id: 'void_mark', name: 'Marca do Vazio', icon: '🎯', cooldownMs: 10000 },
  'rb_shadow_blade': { id: 'shadow_blade', name: 'Lâmina Sombria', icon: '🗡️', cooldownMs: 4000 },
  'rb_phase_shift': { id: 'phase_shift', name: 'Fase Dimensional', icon: '👻', cooldownMs: 12000 },
  'rb_spatial_rift': { id: 'spatial_rift', name: 'Fenda Espacial', icon: '🌀', cooldownMs: 18000 },
  'rb_void_eruption': { id: 'void_eruption', name: 'Erupção do Vazio', icon: '💥', cooldownMs: 14000 },
  'rb_clone_assault': { id: 'clone_assault', name: 'Assalto de Clones', icon: '👥', cooldownMs: 16000 },
  'rb_dimensional_slash': { id: 'dimensional_slash', name: 'Corte Dimensional', icon: '✂️', cooldownMs: 20000 },
  'rb_void_anchor': { id: 'void_anchor', name: 'Âncora Dimensional', icon: '⚓', cooldownMs: 14000 },
  'rb_gravity_well': { id: 'gravity_well', name: 'Poço Gravitacional', icon: '🌑', cooldownMs: 16000 },
  'rb_temporal_rewind': { id: 'temporal_rewind', name: 'Rebobinar', icon: '⏪', cooldownMs: 25000 },
  'rb_assassinate': { id: 'assassinate', name: 'Assassinar', icon: '☠️', cooldownMs: 30000 },
  'rb_mirror_dimension': { id: 'mirror_dimension', name: 'Dimensão Espelho', icon: '🪞', cooldownMs: 35000 },
  'rb_reality_shatter': { id: 'reality_shatter', name: 'Estilhaçar Realidade', icon: '💎', cooldownMs: 55000 },
  // Trickster
  'tk_juggle': { id: 'juggle', name: 'Malabarismo', icon: '🤹', cooldownMs: 5000 },
  'tk_smoke_mirror': { id: 'smoke_mirror', name: 'Espelho de Fumaça', icon: '🪞', cooldownMs: 10000 },
  'tk_tumble': { id: 'tumble', name: 'Cambalhota', icon: '🤸', cooldownMs: 4000 },
  'tk_poison_flask': { id: 'poison_flask', name: 'Frasco de Veneno', icon: '🧪', cooldownMs: 7000 },
  'tk_card_trick': { id: 'card_trick', name: 'Truque de Cartas', icon: '🃏', cooldownMs: 8000 },
  'tk_vanish': { id: 'vanish', name: 'Desaparecer', icon: '💨', cooldownMs: 14000 },
  'tk_explosive_confetti': { id: 'explosive_confetti', name: 'Confete Explosivo', icon: '🎉', cooldownMs: 12000 },
  'tk_knife_rain': { id: 'knife_rain', name: 'Chuva de Facas', icon: '🔪', cooldownMs: 10000 },
  'tk_grand_finale': { id: 'grand_finale', name: 'Grand Finale', icon: '🎆', cooldownMs: 35000 },
  'tk_swap': { id: 'swap', name: 'Troca', icon: '🔄', cooldownMs: 12000 },
  'tk_puppet_show': { id: 'puppet_show', name: 'Show de Marionetes', icon: '🎭', cooldownMs: 20000 },
  'tk_lucky_coin': { id: 'lucky_coin', name: 'Moeda da Sorte', icon: '🪙', cooldownMs: 18000 },
  'tk_hall_of_mirrors': { id: 'hall_of_mirrors', name: 'Salão de Espelhos', icon: '🏰', cooldownMs: 30000 },
  'tk_chaos_roulette': { id: 'chaos_roulette', name: 'Roleta do Caos', icon: '🎰', cooldownMs: 15000 },
  'tk_curtain_call': { id: 'curtain_call', name: 'Última Cortina', icon: '🎪', cooldownMs: 60000 },
};

const STARTER_ABILITIES: Record<string, AbilityState[]> = {
  hunter: [
    { id: 'rain', name: 'Chuva de Flechas', icon: '🏹', cooldownMs: 8000, lastUsedMs: -99999 },
    { id: 'roll', name: 'Recuo Ágil', icon: '💨', cooldownMs: 5000, lastUsedMs: -99999 },
    { id: 'eagle_eye', name: 'Olho de Águia', icon: '🦅', cooldownMs: 15000, lastUsedMs: -99999 },
    { id: 'arrow_storm', name: 'Tempestade de Flechas', icon: '🌪️', cooldownMs: 20000, lastUsedMs: -99999 },
    { id: 'pierce', name: 'Flecha Perfurante', icon: '💎', cooldownMs: 6000, lastUsedMs: -99999 },
  ],
  berserker: [
    { id: 'axe_throw', name: 'Arremesso de Machado', icon: '🪓', cooldownMs: 7000, lastUsedMs: -99999 },
    { id: 'war_cry', name: 'Grito de Guerra', icon: '📢', cooldownMs: 12000, lastUsedMs: -99999 },
    { id: 'bloodlust', name: 'Sede de Sangue', icon: '🩸', cooldownMs: 14000, lastUsedMs: -99999 },
    { id: 'fury_slam', name: 'Golpe Furioso', icon: '💢', cooldownMs: 10000, lastUsedMs: -99999 },
    { id: 'cleave', name: 'Cleave', icon: '⚔️', cooldownMs: 5000, lastUsedMs: -99999 },
  ],
  runekeeper: [
    { id: 'frost_rune', name: 'Runa de Gelo', icon: '❄️', cooldownMs: 6000, lastUsedMs: -99999 },
    { id: 'fire_rune', name: 'Runa de Fogo', icon: '🔥', cooldownMs: 7000, lastUsedMs: -99999 },
    { id: 'summon_golem', name: 'Invocar Golem', icon: '🗿', cooldownMs: 20000, lastUsedMs: -99999 },
    { id: 'rune_shield', name: 'Escudo Rúnico', icon: '🛡️', cooldownMs: 14000, lastUsedMs: -99999 },
    { id: 'arcane_bolt', name: 'Projétil Arcano', icon: '✨', cooldownMs: 4000, lastUsedMs: -99999 },
  ],
  riftblade: [
    { id: 'blink_strike', name: 'Golpe Dimensional', icon: '⚡', cooldownMs: 6000, lastUsedMs: -99999 },
    { id: 'void_mark', name: 'Marca do Vazio', icon: '🎯', cooldownMs: 10000, lastUsedMs: -99999 },
    { id: 'phase_shift', name: 'Fase Dimensional', icon: '👻', cooldownMs: 12000, lastUsedMs: -99999 },
    { id: 'spatial_rift', name: 'Fenda Espacial', icon: '🌀', cooldownMs: 18000, lastUsedMs: -99999 },
    { id: 'shadow_blade', name: 'Lâmina Sombria', icon: '🗡️', cooldownMs: 4000, lastUsedMs: -99999 },
  ],
  trickster: [
    { id: 'juggle', name: 'Malabarismo', icon: '🤹', cooldownMs: 5000, lastUsedMs: -99999 },
    { id: 'smoke_mirror', name: 'Espelho de Fumaça', icon: '🪞', cooldownMs: 10000, lastUsedMs: -99999 },
    { id: 'card_trick', name: 'Truque de Cartas', icon: '🃏', cooldownMs: 8000, lastUsedMs: -99999 },
    { id: 'vanish', name: 'Desaparecer', icon: '💨', cooldownMs: 14000, lastUsedMs: -99999 },
    { id: 'poison_flask', name: 'Frasco de Veneno', icon: '🧪', cooldownMs: 7000, lastUsedMs: -99999 },
  ],
};

// ── Enemy data attached to sprites ──
interface EnemyData {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  type: EnemyType;
  lastAttackMs: number;
  attackCooldownMs: number;
  hpBar: Phaser.GameObjects.Graphics;
  stunUntil: number;
  poisonUntil: number;
  poisonTickMs: number;
}

export class GameScene extends Phaser.Scene {
  // Player
  private player!: Phaser.Physics.Arcade.Sprite;
  private hp = PLAYER_MAX_HP;
  private maxHp = PLAYER_MAX_HP;
  private alive = true;
  private quiver: QuiverState = createQuiver();
  private abilities: AbilityState[] = [];
  private classId: ClassId = 'hunter';
  private classDef: ClassDef = ALL_CLASSES.hunter;
  private attackConfig!: BasicAttackConfig;
  private lastBasicAttackMs = 0;

  // Input
  private keys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private pointer!: Phaser.Input.Pointer;
  private aimLine!: Phaser.GameObjects.Graphics;
  private isAiming = false;

  // Groups
  private enemies!: Phaser.Physics.Arcade.Group;
  private arrows!: Phaser.Physics.Arcade.Group;
  private rainArrows!: Phaser.Physics.Arcade.Group;

  // Wave
  private wave = 0;
  private enemiesAlive = 0;
  private waveActive = false;
  private gold = 0;
  private kills = 0;

  constructor() {
    super(SCENE_KEYS.game);
  }

  init(data?: { classId?: ClassId }): void {
    this.classId = data?.classId ?? 'hunter';
    this.classDef = ALL_CLASSES[this.classId];
    this.attackConfig = getBasicAttackConfig(this.classId);
  }

  create(): void {
    // Clean up any lingering state from previous run
    this.input.keyboard!.removeAllListeners();
    this.input.removeAllListeners();
    this.pauseOverlay = null;

    generateTextures(this);
    const playerTex = generatePlayerTexture(this, this.classId);
    this.alive = true;
    this.maxHp = this.classDef.baseStats.maxHealth;
    this.hp = this.maxHp;
    this.quiver = createQuiver();
    this.lastBasicAttackMs = 0;

    // Load abilities from profile (equipped) or fallback to starters
    const profile = getStoredProfile();
    const equipped = profile?.classProgress[this.classId]?.equippedAbilities ?? [];
    if (equipped.length > 0) {
      this.abilities = equipped
        .map(defId => {
          const mapped = ABILITY_ID_MAP[defId];
          if (!mapped) return null;
          return { ...mapped, lastUsedMs: -99999 } as AbilityState;
        })
        .filter(Boolean)
        .slice(0, 5) as AbilityState[];
    }
    // Fallback if no equipped or mapping failed
    if (this.abilities.length === 0) {
      this.abilities = (STARTER_ABILITIES[this.classId] ?? STARTER_ABILITIES.hunter).map(a => ({ ...a, lastUsedMs: -99999 }));
    }
    this.wave = 0;
    this.gold = 0;
    this.kills = 0;

    // World
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawFloor();

    // Player
    this.player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, playerTex);
    this.player.setCircle(PLAYER_RADIUS);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 80);
    this.cameras.main.setBackgroundColor(PALETTE.bg);

    // Custom crosshair cursor
    this.input.setDefaultCursor('crosshair');

    // Groups
    this.enemies = this.physics.add.group();
    this.arrows = this.physics.add.group();
    this.rainArrows = this.physics.add.group();

    // Collisions
    this.physics.add.overlap(this.arrows, this.enemies, this.onArrowHitEnemy as any, undefined, this);
    this.physics.add.overlap(this.rainArrows, this.enemies, this.onRainHitEnemy as any, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyTouchPlayer as any, undefined, this);

    // Input
    this.keys = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      S: this.input.keyboard!.addKey('S'),
      D: this.input.keyboard!.addKey('D'),
    };
    this.pointer = this.input.activePointer;

    // Aim line (drawn while holding left button)
    this.aimLine = this.add.graphics().setDepth(15);
    this.isAiming = false;

    // Hold left = aim, release = fire
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown() && this.alive) {
        this.isAiming = true;
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.isAiming && this.alive) {
        this.isAiming = false;
        this.aimLine.clear();
        this.shootArrow();
      }
    });

    this.input.keyboard!.on('keydown-ONE', () => this.useAbility(0));
    this.input.keyboard!.on('keydown-TWO', () => this.useAbility(1));
    this.input.keyboard!.on('keydown-THREE', () => this.useAbility(2));
    this.input.keyboard!.on('keydown-FOUR', () => this.useAbility(3));
    this.input.keyboard!.on('keydown-FIVE', () => this.useAbility(4));
    this.input.keyboard!.on('keydown-ESC', () => {
      if (!this.alive) return;
      // Between waves: offer exit
      if (!this.waveActive && this.wave > 0) {
        this.showPauseMenu(true);
        return;
      }
      // During wave: pause menu
      this.showPauseMenu(false);
    });

    // HUD
    this.scene.launch(SCENE_KEYS.hud);

    // Start wave 1
    this.time.delayedCall(1500, () => this.startNextWave());
  }

  update(time: number, _delta: number): void {
    if (!this.alive) return;

    // Reload tick
    this.quiver = tickReload(this.quiver, time);

    // Movement
    let vx = 0, vy = 0;
    if (this.keys.A.isDown) vx -= 1;
    if (this.keys.D.isDown) vx += 1;
    if (this.keys.W.isDown) vy -= 1;
    if (this.keys.S.isDown) vy += 1;
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0) {
      vx = (vx / len) * PLAYER_SPEED;
      vy = (vy / len) * PLAYER_SPEED;
    }
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

    // Player movement trail
    if (len > 0) {
      const trail = this.add.circle(this.player.x, this.player.y, PLAYER_RADIUS * 0.6, this.classDef.color, 0.15).setDepth(5);
      this.tweens.add({ targets: trail, alpha: 0, scale: 0.3, duration: 300, onComplete: () => trail.destroy() });
    }

    // Rotate toward mouse
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    this.player.setRotation(angle);

    // Aim line preview
    this.aimLine.clear();
    if (this.isAiming) {
      const canShoot = this.classId === 'hunter' ? !!currentArrow(this.quiver) : true;
      if (canShoot) {
        const color = this.classId === 'hunter' && currentArrow(this.quiver)
          ? ARROW_COLORS[currentArrow(this.quiver)!]
          : this.classDef.color;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
      const lineLen = Math.min(dist, 300);
      const endX = this.player.x + Math.cos(angle) * lineLen;
      const endY = this.player.y + Math.sin(angle) * lineLen;
      // Dashed aim line
      this.aimLine.lineStyle(2, color, 0.5);
      this.aimLine.lineBetween(this.player.x, this.player.y, endX, endY);
      // Tip circle
      this.aimLine.fillStyle(color, 0.4);
      this.aimLine.fillCircle(endX, endY, 6);
      }
    }

    // Enemy AI
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Phaser.Physics.Arcade.Sprite;
      const data = enemy.getData('d') as EnemyData;
      if (!data || data.hp <= 0) return;

      // Stunned?
      if (data.stunUntil > time) {
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        enemy.setTint(0x3498db); // blue tint while stunned
        return;
      }

      // Poison tick
      if (data.poisonUntil > time) {
        enemy.setTint(0x27ae60); // green tint while poisoned
        if (time - data.poisonTickMs > 500) {
          data.poisonTickMs = time;
          this.damageEnemy(enemy, data, 8, time);
        }
      } else if (data.stunUntil <= time) {
        enemy.clearTint();
      }

      // Chase player
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (dist > 30) {
        const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(
          Math.cos(a) * data.speed,
          Math.sin(a) * data.speed,
        );
      } else {
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });

    // Reposition enemy HP bars
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Phaser.Physics.Arcade.Sprite;
      const data = enemy.getData('d') as EnemyData;
      if (data && data.hp > 0) this.updateEnemyHpBar(enemy, data);
    });

    // Arrows out of bounds cleanup
    this.arrows.getChildren().forEach((obj) => {
      const a = obj as Phaser.Physics.Arcade.Sprite;
      if (a.x < -50 || a.x > WORLD_WIDTH + 50 || a.y < -50 || a.y > WORLD_HEIGHT + 50) {
        a.destroy();
      }
    });

    // Emit HUD data
    this.events.emit('hudUpdate', {
      hp: this.hp,
      maxHp: this.maxHp,
      quiver: this.quiver,
      abilities: this.abilities,
      wave: this.wave,
      gold: this.gold,
      kills: this.kills,
      isAiming: this.isAiming,
      classId: this.classId,
      time,
    });
  }

  // ── Shooting ──

  private shootArrow(): void {
    if (!this.alive) return;
    const now = this.time.now;

    // For Hunter: use quiver system
    if (this.classId === 'hunter') {
      const type = currentArrow(this.quiver);
      if (!type) return;
      const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
      const texKey = type === 'poison' ? TEX.arrowPoison : type === 'stun' ? TEX.arrowStun : TEX.arrowLacerate;
      const arrow = this.physics.add.sprite(this.player.x, this.player.y, texKey);
      arrow.setRotation(angle);
      arrow.setData('type', type);
      this.arrows.add(arrow);
      (arrow.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.cos(angle) * ARROW_SPEED, Math.sin(angle) * ARROW_SPEED,
      );
      this.quiver = fireArrow(this.quiver, now);
      return;
    }

    // For other classes: cooldown-based basic attack
    if (now - this.lastBasicAttackMs < this.attackConfig.attackCooldownMs) return;
    this.lastBasicAttackMs = now;

    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    if (this.attackConfig.type === 'melee') {
      // Melee arc attack
      const arcRange = this.attackConfig.range;
      const halfAngle = Math.PI / 3;
      const arc = this.add.graphics().setDepth(12);
      arc.fillStyle(this.attackConfig.color, 0.3);
      arc.slice(this.player.x, this.player.y, arcRange, angle - halfAngle, angle + halfAngle, false);
      arc.fillPath();
      this.tweens.add({ targets: arc, alpha: 0, duration: 200, onComplete: () => arc.destroy() });

      // Damage enemies in arc
      this.enemies.getChildren().forEach((obj) => {
        const enemy = obj as Phaser.Physics.Arcade.Sprite;
        const data = enemy.getData('d') as EnemyData;
        if (!data || data.hp <= 0) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        if (dist > arcRange) return;
        const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        let diff = Math.abs(enemyAngle - angle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        if (diff <= halfAngle) {
          this.damageEnemy(enemy, data, this.attackConfig.damage, now, { x: this.player.x, y: this.player.y });
        }
      });
      this.cameras.main.shake(60, 0.003);
    } else {
      // Ranged projectile (generic)
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const projKey = `proj_${this.classId}`;
      if (!this.textures.exists(projKey)) {
        g.fillStyle(this.attackConfig.color);
        g.fillRect(0, 0, 10, 4);
        g.fillStyle(0xffffff, 0.5);
        g.fillTriangle(10, 0, 14, 2, 10, 4);
        g.generateTexture(projKey, 14, 4);
        g.destroy();
      }
      const arrow = this.physics.add.sprite(this.player.x, this.player.y, projKey);
      arrow.setRotation(angle);
      arrow.setData('type', 'generic');
      arrow.setData('genericDamage', this.attackConfig.damage);
      this.arrows.add(arrow);
      (arrow.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.cos(angle) * this.attackConfig.projectileSpeed,
        Math.sin(angle) * this.attackConfig.projectileSpeed,
      );
    }
  }

  // ── Abilities ──

  private useAbility(index: number): void {
    if (!this.alive || index >= this.abilities.length) return;
    const ab = this.abilities[index];
    const now = this.time.now;
    if (now - ab.lastUsedMs < ab.cooldownMs) return;
    ab.lastUsedMs = now;

    switch (ab.id) {
      // ── Hunter ──
      case 'rain': this.abilityRainOfArrows(); break;
      case 'roll': this.abilityEvasiveRoll(); break;
      case 'pierce': this.abilityPiercingShot(); break;

      // ── Berserker ──
      case 'cleave': this.abilityCleave(); break;
      case 'charge': this.abilityCharge(); break;
      case 'war_cry': this.abilityWarCry(); break;

      // ── Runekeeper ──
      case 'frost_rune': this.abilityFrostRune(); break;
      case 'fire_rune': this.abilityFireRune(); break;
      case 'teleport': this.abilityTeleport(); break;

      // ── Riftblade ──
      case 'blink_strike': this.abilityBlinkStrike(); break;
      case 'shadow_step': this.abilityShadowStep(); break;
      case 'void_mark': this.abilityVoidMark(); break;

      // ── Trickster ──
      case 'juggle': this.abilityJuggle(); break;
      case 'smoke_mirror': this.abilitySmokeMirror(); break;
      case 'tumble': this.abilityTumble(); break;
    }
  }

  private abilityRainOfArrows(): void {
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const cx = worldPoint.x;
    const cy = worldPoint.y;
    const radius = 120;

    // Visual telegraph
    const circle = this.add.circle(cx, cy, radius, 0xc9a44e, 0.15).setDepth(5);
    this.tweens.add({
      targets: circle,
      alpha: 0.3,
      duration: 400,
      yoyo: true,
      onComplete: () => circle.destroy(),
    });

    // Spawn rain arrows after delay
    this.time.delayedCall(500, () => {
      for (let i = 0; i < 12; i++) {
        const ax = cx + (Math.random() - 0.5) * radius * 2;
        const ay = cy + (Math.random() - 0.5) * radius * 2;
        const rain = this.physics.add.sprite(ax, ay - 100, TEX.arrowPoison);
        rain.setRotation(Math.PI / 2);
        rain.setData('damage', 25);
        this.rainArrows.add(rain);
        (rain.body as Phaser.Physics.Arcade.Body).setVelocity(0, 300);
        this.time.delayedCall(600, () => { if (rain.active) rain.destroy(); });
      }
    });
  }

  private abilityEvasiveRoll(): void {
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    // Dash backwards
    const dashAngle = angle + Math.PI;
    const dashDist = 150;
    const targetX = this.player.x + Math.cos(dashAngle) * dashDist;
    const targetY = this.player.y + Math.sin(dashAngle) * dashDist;

    this.tweens.add({
      targets: this.player,
      x: Phaser.Math.Clamp(targetX, 30, WORLD_WIDTH - 30),
      y: Phaser.Math.Clamp(targetY, 30, WORLD_HEIGHT - 30),
      duration: 150,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Auto-fire arrow at end of dash
        this.shootArrow();
      },
    });
  }

  private abilityPiercingShot(): void {
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    const arrow = this.physics.add.sprite(this.player.x, this.player.y, TEX.arrowLacerate);
    arrow.setRotation(angle);
    arrow.setScale(2, 1.5);
    arrow.setData('type', 'lacerate');
    arrow.setData('piercing', true);
    arrow.setData('pierceDamage', 80);
    this.arrows.add(arrow);
    (arrow.body as Phaser.Physics.Arcade.Body).setVelocity(
      Math.cos(angle) * ARROW_SPEED * 1.4,
      Math.sin(angle) * ARROW_SPEED * 1.4,
    );

    // Camera shake for impact feel
    this.cameras.main.shake(100, 0.003);
  }

  // ── Berserker abilities ──

  private abilityCleave(): void {
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    const range = 100;
    const halfAngle = Math.PI / 2.5; // wider arc than basic melee

    const arc = this.add.graphics().setDepth(12);
    arc.fillStyle(0xe74c3c, 0.4);
    arc.slice(this.player.x, this.player.y, range, angle - halfAngle, angle + halfAngle, false);
    arc.fillPath();
    this.tweens.add({ targets: arc, alpha: 0, duration: 250, onComplete: () => arc.destroy() });

    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Phaser.Physics.Arcade.Sprite;
      const data = enemy.getData('d') as EnemyData;
      if (!data || data.hp <= 0) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist > range) return;
      const eAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      let diff = Math.abs(eAngle - angle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff <= halfAngle) {
        this.damageEnemy(enemy, data, 50, this.time.now, { x: this.player.x, y: this.player.y });
      }
    });
    this.cameras.main.shake(80, 0.005);
  }

  private abilityCharge(): void {
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    const dist = 200;
    const targetX = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 30, WORLD_WIDTH - 30);
    const targetY = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 30, WORLD_HEIGHT - 30);

    // Trail effect
    const trail = this.add.graphics().setDepth(5);
    trail.lineStyle(8, 0xe74c3c, 0.4);
    trail.lineBetween(this.player.x, this.player.y, targetX, targetY);
    this.tweens.add({ targets: trail, alpha: 0, duration: 400, onComplete: () => trail.destroy() });

    this.tweens.add({
      targets: this.player,
      x: targetX, y: targetY,
      duration: 150,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Damage enemies along path
        this.enemies.getChildren().forEach((obj) => {
          const enemy = obj as Phaser.Physics.Arcade.Sprite;
          const data = enemy.getData('d') as EnemyData;
          if (!data || data.hp <= 0) return;
          const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          if (d < 80) {
            this.damageEnemy(enemy, data, 40, this.time.now, { x: this.player.x, y: this.player.y });
          }
        });
        this.cameras.main.shake(60, 0.004);
      },
    });
  }

  private abilityWarCry(): void {
    // Buff: show visual + push nearby enemies
    const ring = this.add.circle(this.player.x, this.player.y, 120, 0xe74c3c, 0.2).setDepth(5);
    this.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 500, onComplete: () => ring.destroy() });

    const buffTxt = this.add.text(this.player.x, this.player.y - 30, '📢 +30% ATK SPD', {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#e74c3c', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: buffTxt, y: buffTxt.y - 30, alpha: 0, duration: 1500, onComplete: () => buffTxt.destroy() });

    // Push nearby enemies away
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Phaser.Physics.Arcade.Sprite;
      const data = enemy.getData('d') as EnemyData;
      if (!data || data.hp <= 0) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (d < 150) {
        const a = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(a) * 300, Math.sin(a) * 300);
      }
    });
  }

  // ── Runekeeper abilities ──

  private abilityFrostRune(): void {
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const rune = this.add.circle(worldPoint.x, worldPoint.y, 15, 0x3498db, 0.5).setDepth(5);
    const runeRing = this.add.circle(worldPoint.x, worldPoint.y, 60, 0x3498db, 0.1).setDepth(4);

    // Explode after 1s
    this.time.delayedCall(1000, () => {
      // Freeze effect
      const blast = this.add.circle(worldPoint.x, worldPoint.y, 80, 0x3498db, 0.3).setDepth(5);
      this.tweens.add({ targets: blast, scale: 1.5, alpha: 0, duration: 400, onComplete: () => blast.destroy() });
      rune.destroy();
      runeRing.destroy();

      this.enemies.getChildren().forEach((obj) => {
        const enemy = obj as Phaser.Physics.Arcade.Sprite;
        const data = enemy.getData('d') as EnemyData;
        if (!data || data.hp <= 0) return;
        const d = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, enemy.x, enemy.y);
        if (d < 80) {
          data.stunUntil = this.time.now + 2000;
          this.damageEnemy(enemy, data, 30, this.time.now);
        }
      });
    });
  }

  private abilityFireRune(): void {
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const rune = this.add.circle(worldPoint.x, worldPoint.y, 15, 0xe74c3c, 0.5).setDepth(5);

    // Fire column after 0.5s, lasts 3s
    this.time.delayedCall(500, () => {
      rune.destroy();
      let ticks = 0;
      const interval = this.time.addEvent({
        delay: 300,
        repeat: 9, // 3s total
        callback: () => {
          const flame = this.add.circle(worldPoint.x, worldPoint.y, 50 + Math.random() * 20, 0xe74c3c, 0.25).setDepth(5);
          this.tweens.add({ targets: flame, scale: 0.3, alpha: 0, duration: 300, onComplete: () => flame.destroy() });

          this.enemies.getChildren().forEach((obj) => {
            const enemy = obj as Phaser.Physics.Arcade.Sprite;
            const data = enemy.getData('d') as EnemyData;
            if (!data || data.hp <= 0) return;
            const d = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, enemy.x, enemy.y);
            if (d < 60) {
              this.damageEnemy(enemy, data, 12, this.time.now);
            }
          });
        },
      });
    });
  }

  private abilityTeleport(): void {
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const oldX = this.player.x, oldY = this.player.y;

    // Leave slow rune at old position
    const slowZone = this.add.circle(oldX, oldY, 50, 0x9b59b6, 0.2).setDepth(4);
    this.tweens.add({ targets: slowZone, alpha: 0, duration: 3000, onComplete: () => slowZone.destroy() });

    // Teleport VFX
    const flash = this.add.circle(oldX, oldY, 20, 0x9b59b6, 0.5).setDepth(10);
    this.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

    this.player.x = Phaser.Math.Clamp(worldPoint.x, 30, WORLD_WIDTH - 30);
    this.player.y = Phaser.Math.Clamp(worldPoint.y, 30, WORLD_HEIGHT - 30);

    const arrive = this.add.circle(this.player.x, this.player.y, 20, 0x9b59b6, 0.5).setDepth(10);
    this.tweens.add({ targets: arrive, scale: 2, alpha: 0, duration: 200, onComplete: () => arrive.destroy() });
  }

  // ── Riftblade abilities ──

  private abilityBlinkStrike(): void {
    // Find nearest enemy and teleport behind it
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let nearDist = Infinity;
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Phaser.Physics.Arcade.Sprite;
      const data = enemy.getData('d') as EnemyData;
      if (!data || data.hp <= 0) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (d < nearDist && d < 400) { nearDist = d; nearest = enemy; }
    });

    if (!nearest) return;
    const ne = nearest as Phaser.Physics.Arcade.Sprite;
    const data = ne.getData('d') as EnemyData;

    // Teleport behind enemy
    const a = Phaser.Math.Angle.Between(this.player.x, this.player.y, ne.x, ne.y);
    const behindX = ne.x + Math.cos(a) * 30;
    const behindY = ne.y + Math.sin(a) * 30;

    // VFX
    const flash1 = this.add.circle(this.player.x, this.player.y, 15, 0x3498db, 0.4).setDepth(10);
    this.tweens.add({ targets: flash1, scale: 2, alpha: 0, duration: 150, onComplete: () => flash1.destroy() });

    this.player.x = Phaser.Math.Clamp(behindX, 30, WORLD_WIDTH - 30);
    this.player.y = Phaser.Math.Clamp(behindY, 30, WORLD_HEIGHT - 30);

    const flash2 = this.add.circle(this.player.x, this.player.y, 15, 0x3498db, 0.4).setDepth(10);
    this.tweens.add({ targets: flash2, scale: 2, alpha: 0, duration: 150, onComplete: () => flash2.destroy() });

    // Strike with bonus damage (backstab)
    this.damageEnemy(ne, data, 85, this.time.now, { x: this.player.x, y: this.player.y });
    this.cameras.main.shake(60, 0.003);
  }

  private abilityShadowStep(): void {
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    const dist = 120;

    // Leave decoy at old position
    const decoyX = this.player.x, decoyY = this.player.y;
    const decoy = this.add.circle(decoyX, decoyY, PLAYER_RADIUS, 0x3498db, 0.4).setDepth(8);
    this.tweens.add({ targets: decoy, alpha: 0, duration: 2000, onComplete: () => decoy.destroy() });

    // Dash
    const targetX = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 30, WORLD_WIDTH - 30);
    const targetY = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 30, WORLD_HEIGHT - 30);
    this.tweens.add({
      targets: this.player,
      x: targetX, y: targetY,
      duration: 100,
      ease: 'Cubic.easeOut',
    });
  }

  private abilityVoidMark(): void {
    // Mark nearest enemy — next hit deals +80% damage
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let nearDist = Infinity;
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Phaser.Physics.Arcade.Sprite;
      const data = enemy.getData('d') as EnemyData;
      if (!data || data.hp <= 0) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (d < nearDist && d < 500) { nearDist = d; nearest = enemy; }
    });

    if (!nearest) return;
    const ne = nearest as Phaser.Physics.Arcade.Sprite;

    // Visual mark
    const ring = this.add.circle(ne.x, ne.y, 25, 0x9b59b6, 0.3).setDepth(9);
    const ringInner = this.add.circle(ne.x, ne.y, 10, 0x9b59b6, 0.5).setDepth(9);
    this.tweens.add({ targets: ring, scale: 1.5, alpha: 0, duration: 6000, onComplete: () => ring.destroy() });
    this.tweens.add({ targets: ringInner, alpha: 0, duration: 6000, onComplete: () => ringInner.destroy() });

    // Immediate burst damage
    const data = ne.getData('d') as EnemyData;
    this.damageEnemy(ne, data, 60, this.time.now);

    const markTxt = this.add.text(ne.x, ne.y - 25, '🎯 MARCADO', {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#9b59b6', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: markTxt, y: markTxt.y - 20, alpha: 0, duration: 1200, onComplete: () => markTxt.destroy() });
  }

  // ── Trickster abilities ──

  private abilityJuggle(): void {
    // Throw 3 bouncing balls
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * 0.3;
      const texKey = 'ball_trickster';
      if (!this.textures.exists(texKey)) {
        const g = this.make.graphics({ x: 0, y: 0 }, false);
        g.fillStyle(0xf39c12);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(4, 4, 2);
        g.generateTexture(texKey, 12, 12);
        g.destroy();
      }
      const ball = this.physics.add.sprite(this.player.x, this.player.y, texKey);
      ball.setData('type', 'generic');
      ball.setData('genericDamage', 25);
      ball.setBounce(1);
      this.arrows.add(ball);
      (ball.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.cos(angle) * 350, Math.sin(angle) * 350,
      );
      (ball.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
      // Auto destroy after 2s
      this.time.delayedCall(2000, () => { if (ball.active) ball.destroy(); });
    }
  }

  private abilitySmokeMirror(): void {
    // Create illusory clone that attracts enemies
    const cloneX = this.player.x, cloneY = this.player.y;
    const clone = this.add.circle(cloneX, cloneY, PLAYER_RADIUS, 0xf39c12, 0.5).setDepth(8);
    const cloneRing = this.add.circle(cloneX, cloneY, 30, 0xf39c12, 0.15).setDepth(7);

    // Attract nearby enemies for 4s
    const attract = this.time.addEvent({
      delay: 200,
      repeat: 19,
      callback: () => {
        this.enemies.getChildren().forEach((obj) => {
          const enemy = obj as Phaser.Physics.Arcade.Sprite;
          const data = enemy.getData('d') as EnemyData;
          if (!data || data.hp <= 0) return;
          const d = Phaser.Math.Distance.Between(cloneX, cloneY, enemy.x, enemy.y);
          if (d < 200) {
            const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, cloneX, cloneY);
            (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(
              Math.cos(a) * data.speed * 1.2,
              Math.sin(a) * data.speed * 1.2,
            );
          }
        });
      },
    });

    // Explode after 4s
    this.time.delayedCall(4000, () => {
      const blast = this.add.circle(cloneX, cloneY, 60, 0xf39c12, 0.4).setDepth(10);
      this.tweens.add({ targets: blast, scale: 2, alpha: 0, duration: 300, onComplete: () => blast.destroy() });
      clone.destroy();
      cloneRing.destroy();

      // Damage nearby enemies
      this.enemies.getChildren().forEach((obj) => {
        const enemy = obj as Phaser.Physics.Arcade.Sprite;
        const data = enemy.getData('d') as EnemyData;
        if (!data || data.hp <= 0) return;
        const d = Phaser.Math.Distance.Between(cloneX, cloneY, enemy.x, enemy.y);
        if (d < 80) {
          this.damageEnemy(enemy, data, 35, this.time.now, { x: cloneX, y: cloneY });
        }
      });
    });
  }

  private abilityTumble(): void {
    // Quick roll with i-frames
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    const dist = 100;
    const targetX = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 30, WORLD_WIDTH - 30);
    const targetY = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 30, WORLD_HEIGHT - 30);

    // Brief invulnerability
    this.player.setAlpha(0.4);
    (this.player.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;

    this.tweens.add({
      targets: this.player,
      x: targetX, y: targetY,
      duration: 150,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.player.setAlpha(1);
        (this.player.body as Phaser.Physics.Arcade.Body).checkCollision.none = false;
      },
    });
  }

  // ── Collisions ──

  private onArrowHitEnemy(arrowObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const arrow = arrowObj as Phaser.Physics.Arcade.Sprite;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    const data = enemy.getData('d') as EnemyData;
    if (!data || data.hp <= 0) return;

    const type = arrow.getData('type') as ArrowType | 'generic';
    const piercing = arrow.getData('piercing') as boolean;
    const pierceDmg = arrow.getData('pierceDamage') as number | undefined;
    const genericDmg = arrow.getData('genericDamage') as number | undefined;
    let dmg = pierceDmg || genericDmg || ARROW_DAMAGE;

    // Lacerate bonus
    if (type === 'lacerate') dmg = Math.round(dmg * 1.5);

    const now = this.time.now;

    // Apply effects
    if (type === 'stun') data.stunUntil = now + 1000;
    if (type === 'poison') {
      data.poisonUntil = now + 3000;
      data.poisonTickMs = now;
    }

    this.damageEnemy(enemy, data, dmg, now, { x: arrow.x, y: arrow.y });

    if (!piercing) arrow.destroy();
  }

  private onRainHitEnemy(rainObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const rain = rainObj as Phaser.Physics.Arcade.Sprite;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    const data = enemy.getData('d') as EnemyData;
    if (!data || data.hp <= 0) return;

    this.damageEnemy(enemy, data, 25, this.time.now);
    rain.destroy();
  }

  private onEnemyTouchPlayer(_playerObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    if (!this.alive) return;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    const data = enemy.getData('d') as EnemyData;
    if (!data || data.hp <= 0) return;

    const now = this.time.now;
    if (now - data.lastAttackMs < data.attackCooldownMs) return;
    data.lastAttackMs = now;

    this.hp -= data.damage;
    this.cameras.main.shake(80, 0.005);
    this.player.setTint(0xff4444);
    this.time.delayedCall(100, () => { if (this.player.active) this.player.clearTint(); });

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.showGameOver();
    }
  }

  // ── Enemy management ──

  private damageEnemy(enemy: Phaser.Physics.Arcade.Sprite, data: EnemyData, dmg: number, _now: number, knockbackFrom?: { x: number; y: number }): void {
    data.hp -= dmg;

    // Knockback
    if (knockbackFrom) {
      const kbAngle = Phaser.Math.Angle.Between(knockbackFrom.x, knockbackFrom.y, enemy.x, enemy.y);
      const kbForce = 120;
      (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.cos(kbAngle) * kbForce,
        Math.sin(kbAngle) * kbForce,
      );
    }

    // Floating damage text
    const txt = this.add.text(enemy.x, enemy.y - 20, `-${dmg}`, {
      fontFamily: '"Cinzel", serif',
      fontSize: '16px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => txt.destroy(),
    });

    // Flash
    enemy.setTint(0xffffff);
    this.time.delayedCall(60, () => { if (enemy.active) enemy.clearTint(); });

    // HP bar update
    this.updateEnemyHpBar(enemy, data);

    if (data.hp <= 0) {
      this.killEnemy(enemy, data);
    }
  }

  private updateEnemyHpBar(enemy: Phaser.Physics.Arcade.Sprite, data: EnemyData): void {
    const bar = data.hpBar;
    bar.clear();
    const width = 30;
    const height = 4;
    const x = enemy.x - width / 2;
    const y = enemy.y - ENEMY_TYPES[data.type].radius - 8;
    bar.fillStyle(0x333333);
    bar.fillRect(x, y, width, height);
    const frac = Math.max(0, data.hp / data.maxHp);
    bar.fillStyle(frac > 0.5 ? 0x2ecc71 : frac > 0.25 ? 0xf39c12 : 0xe74c3c);
    bar.fillRect(x, y, width * frac, height);
  }

  private killEnemy(enemy: Phaser.Physics.Arcade.Sprite, data: EnemyData): void {
    this.kills++;
    this.enemiesAlive--;

    // Hit-stop: brief time scale reduction for satisfying kills
    this.time.timeScale = 0.3;
    this.time.delayedCall(60, () => { this.time.timeScale = 1; });

    // Gold drop
    const goldDrop = data.type === 'brute' ? 5 : 2;
    this.gold += goldDrop;
    const goldTxt = this.add.text(enemy.x, enemy.y, `🪙+${goldDrop}`, {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#c9a44e',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: goldTxt, y: goldTxt.y - 25, alpha: 0, duration: 800,
      onComplete: () => goldTxt.destroy(),
    });

    // Death effect
    const circle = this.add.circle(enemy.x, enemy.y, 20, data.type === 'brute' ? 0x881111 : 0xcc3333, 0.4).setDepth(5);
    this.tweens.add({
      targets: circle, scale: 2, alpha: 0, duration: 300,
      onComplete: () => circle.destroy(),
    });

    data.hpBar.destroy();
    enemy.destroy();

    // Check wave clear
    if (this.enemiesAlive <= 0 && this.waveActive) {
      this.waveActive = false;
      // Wave clear celebration
      const clearTxt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '✨ ONDA CONCLUÍDA!', {
        fontFamily: '"Cinzel", serif', fontSize: '28px', color: '#2ecc71', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(50).setScale(0.5);
      this.tweens.add({
        targets: clearTxt, scale: 1.2, duration: 400, ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({ targets: clearTxt, alpha: 0, y: clearTxt.y - 20, duration: 800, delay: 600, onComplete: () => clearTxt.destroy() });
        },
      });
      this.cameras.main.flash(200, 46, 204, 113);
      this.time.delayedCall(2500, () => this.startNextWave());
    }
  }

  private spawnEnemy(type: EnemyType): void {
    const def = ENEMY_TYPES[type];
    const pos = randomEdgePosition();
    const texKey = type === 'grunt' ? TEX.grunt : TEX.brute;
    const enemy = this.physics.add.sprite(pos.x, pos.y, texKey);
    enemy.setCircle(def.radius);
    enemy.setDepth(8);
    enemy.setAlpha(0);
    enemy.setScale(0.3);

    // Spawn VFX: fade in + scale up
    this.tweens.add({ targets: enemy, alpha: 1, scale: 1, duration: 300, ease: 'Back.easeOut' });
    const spawnRing = this.add.circle(pos.x, pos.y, def.radius * 2, def.color, 0.3).setDepth(4);
    this.tweens.add({ targets: spawnRing, scale: 2, alpha: 0, duration: 400, onComplete: () => spawnRing.destroy() });

    const hpBar = this.add.graphics().setDepth(15);
    const data: EnemyData = {
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      damage: def.damage,
      type,
      lastAttackMs: 0,
      attackCooldownMs: def.attackCooldownMs,
      hpBar,
      stunUntil: 0,
      poisonUntil: 0,
      poisonTickMs: 0,
    };
    enemy.setData('d', data);
    this.enemies.add(enemy);
    this.enemiesAlive++;
  }

  private startNextWave(): void {
    if (!this.alive) return;
    this.wave++;
    this.waveActive = true;
    const config = buildWave(this.wave);

    // Announcement
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, `⚔️ Onda ${this.wave}`, {
      fontFamily: '"Cinzel", serif', fontSize: '32px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
    this.tweens.add({
      targets: txt, alpha: 0, y: txt.y - 30, duration: 1500, delay: 800,
      onComplete: () => txt.destroy(),
    });

    // Spawn enemies staggered
    let delay = 0;
    for (const entry of config.enemies) {
      for (let i = 0; i < entry.count; i++) {
        this.time.delayedCall(delay, () => this.spawnEnemy(entry.type));
        delay += 300;
      }
    }
  }

  // ── Floor ──

  private drawFloor(): void {
    const g = this.add.graphics().setDepth(0);
    // Dark stone floor
    g.fillStyle(0x0d0d1a);
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Tile grid with alternating subtle shades
    for (let x = 0; x < WORLD_WIDTH; x += 64) {
      for (let y = 0; y < WORLD_HEIGHT; y += 64) {
        const shade = ((x / 64 + y / 64) % 2 === 0) ? 0x111122 : 0x0e0e1c;
        g.fillStyle(shade, 0.6);
        g.fillRect(x, y, 64, 64);
      }
    }

    // Grid lines
    g.lineStyle(1, 0x1a1a2e, 0.3);
    for (let x = 0; x <= WORLD_WIDTH; x += 64) {
      g.lineBetween(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 64) {
      g.lineBetween(0, y, WORLD_WIDTH, y);
    }

    // Corner runes (decorative)
    const runePositions = [
      { x: 100, y: 100 }, { x: WORLD_WIDTH - 100, y: 100 },
      { x: 100, y: WORLD_HEIGHT - 100 }, { x: WORLD_WIDTH - 100, y: WORLD_HEIGHT - 100 },
      { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 },
    ];
    for (const pos of runePositions) {
      g.lineStyle(1, 0xc9a44e, 0.08);
      g.strokeCircle(pos.x, pos.y, 40);
      g.strokeCircle(pos.x, pos.y, 60);
      // Diamond
      g.lineStyle(1, 0xc9a44e, 0.06);
      const s = 25;
      g.lineBetween(pos.x, pos.y - s, pos.x + s, pos.y);
      g.lineBetween(pos.x + s, pos.y, pos.x, pos.y + s);
      g.lineBetween(pos.x, pos.y + s, pos.x - s, pos.y);
      g.lineBetween(pos.x - s, pos.y, pos.x, pos.y - s);
    }

    // Border with double line
    g.lineStyle(3, 0xc9a44e, 0.25);
    g.strokeRect(10, 10, WORLD_WIDTH - 20, WORLD_HEIGHT - 20);
    g.lineStyle(1, 0xc9a44e, 0.12);
    g.strokeRect(20, 20, WORLD_WIDTH - 40, WORLD_HEIGHT - 40);

    // Vignette darkening at edges (4 gradient rectangles)
    const vg = this.add.graphics().setDepth(1);
    vg.fillStyle(0x000000, 0.3);
    vg.fillRect(0, 0, WORLD_WIDTH, 80); // top
    vg.fillRect(0, WORLD_HEIGHT - 80, WORLD_WIDTH, 80); // bottom
    vg.fillRect(0, 0, 80, WORLD_HEIGHT); // left
    vg.fillRect(WORLD_WIDTH - 80, 0, 80, WORLD_HEIGHT); // right
  }

  private pauseOverlay: Phaser.GameObjects.Container | null = null;

  // ── Pause Menu ──

  private showPauseMenu(canExit: boolean): void {
    if (this.pauseOverlay) return; // already showing

    this.scene.pause();
    this.scene.pause(SCENE_KEYS.hud);

    const container = this.add.container(0, 0).setDepth(500).setScrollFactor(0);
    this.pauseOverlay = container;

    // Dim overlay
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setScrollFactor(0);
    container.add(dim);

    // Panel
    const pw = 320, ph = canExit ? 240 : 180;
    const px = GAME_WIDTH / 2 - pw / 2, py = GAME_HEIGHT / 2 - ph / 2;
    const panel = this.add.graphics().setScrollFactor(0);
    panel.fillStyle(0x0d0d1a, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 10);
    panel.lineStyle(1, 0xc9a44e, 0.2);
    panel.strokeRoundedRect(px, py, pw, ph, 10);
    container.add(panel);

    // Title
    container.add(this.add.text(GAME_WIDTH / 2, py + 28, 'PAUSADO', {
      fontFamily: '"Cinzel", serif', fontSize: '24px', color: '#c9a44e', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0));

    // Stats
    container.add(this.add.text(GAME_WIDTH / 2, py + 58, `Onda ${this.wave}  ·  ${this.kills} kills  ·  ${this.gold} 🪙`, {
      fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#71717a',
    }).setOrigin(0.5).setScrollFactor(0));

    // Resume button
    const resumeY = py + 95;
    const resumeBtn = this.createPauseButton(container, GAME_WIDTH / 2, resumeY, 'CONTINUAR', '#2ecc71');
    resumeBtn.on('pointerdown', () => this.closePauseMenu());

    if (canExit) {
      // Exit with rewards button
      const exitY = py + 145;
      const exitBtn = this.createPauseButton(container, GAME_WIDTH / 2, exitY, 'RETIRADA TÁTICA', '#c9a44e');
      exitBtn.on('pointerdown', () => {
        this.closePauseMenu();
        this.scene.resume();
        this.scene.resume(SCENE_KEYS.hud);
        this.exitWithRewards();
      });

      container.add(this.add.text(GAME_WIDTH / 2, exitY + 22, 'Salva XP, ouro e maestria', {
        fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#555',
      }).setOrigin(0.5).setScrollFactor(0));
    }

    // ESC hint
    container.add(this.add.text(GAME_WIDTH / 2, py + ph - 16, 'ESC para voltar', {
      fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#3a3a3a',
    }).setOrigin(0.5).setScrollFactor(0));

    // Listen for ESC to close
    const escHandler = () => {
      this.closePauseMenu();
      this.input.keyboard!.off('keydown-ESC', escHandler);
    };
    // Need small delay so the current ESC keydown doesn't immediately close
    this.time.delayedCall(100, () => {
      this.input.keyboard!.on('keydown-ESC', escHandler);
    });
  }

  private createPauseButton(container: Phaser.GameObjects.Container, x: number, y: number, label: string, color: string): Phaser.GameObjects.Zone {
    const bw = 240, bh = 38;
    const bg = this.add.graphics().setScrollFactor(0);
    bg.fillStyle(0x16162a, 0.9);
    bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
    bg.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.3);
    bg.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
    container.add(bg);

    const text = this.add.text(x, y, label, {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color, fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    container.add(text);

    const hitZone = this.add.zone(x, y, bw, bh).setScrollFactor(0).setInteractive({ useHandCursor: true });
    container.add(hitZone);
    hitZone.on('pointerover', () => {
      text.setColor('#ffffff');
      bg.clear();
      bg.fillStyle(0x1e1e36, 0.95);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
      bg.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.6);
      bg.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
    });
    hitZone.on('pointerout', () => {
      text.setColor(color);
      bg.clear();
      bg.fillStyle(0x16162a, 0.9);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
      bg.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.3);
      bg.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
    });
    return hitZone;
  }

  private closePauseMenu(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
    this.scene.resume();
    this.scene.resume(SCENE_KEYS.hud);
  }

  // ── Exit between waves (save progress) ──

  private exitWithRewards(): void {
    this.alive = false; // prevent further actions
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    saveRun(this.wave, this.kills, this.gold, this.classId).then(result => {
      this.showExitUI(result);
    }).catch(() => {
      this.showExitUI(null);
    });
  }

  private showExitUI(result: RunResult | null): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(100);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

    this.time.delayedCall(300, () => {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, 'RETIRADA TÁTICA', {
        fontFamily: '"Cinzel", serif', fontSize: '36px', color: '#c9a44e', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 5,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, [
        `⚔️ Onda ${this.wave}`,
        `💀 ${this.kills} kills`,
        `🪙 ${this.gold} ouro`,
      ].join('  ·  '), {
        fontFamily: '"Cinzel", serif', fontSize: '16px', color: '#d4d4d8',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      if (result) {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, `+${result.xpEarned} XP  ·  +${result.goldEarned} ouro`, {
          fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#c9a44e',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Mastery
        const masteryLine = result.masteryUps > 0
          ? `⭐ Maestria ${result.newMastery} (+${result.masteryUps}!)`
          : `⭐ Maestria ${result.newMastery}`;
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15, masteryLine, {
          fontFamily: '"Cinzel", serif', fontSize: '13px',
          color: result.masteryUps > 0 ? '#ffd700' : '#c9a44e',
          stroke: '#000000', strokeThickness: 3,
          fontStyle: result.masteryUps > 0 ? 'bold' : 'normal',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Mastery XP bar
        const barW = 180, barH = 6;
        const barX = GAME_WIDTH / 2 - barW / 2, barY = GAME_HEIGHT / 2 + 34;
        const barBg = this.add.graphics().setScrollFactor(0).setDepth(101);
        barBg.fillStyle(0x333333);
        barBg.fillRoundedRect(barX, barY, barW, barH, 3);
        const frac = result.nextMasteryXp > 0 ? result.currentClassXp / result.nextMasteryXp : 0;
        barBg.fillStyle(0xc9a44e);
        barBg.fillRoundedRect(barX, barY, barW * Math.min(1, frac), barH, 3);

        this.add.text(GAME_WIDTH / 2, barY + 12, `${result.currentClassXp} / ${result.nextMasteryXp} XP`, {
          fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#71717a',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
      }

      const btn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, '[ MENU ]', {
        fontFamily: '"Cinzel", serif', fontSize: '22px', color: '#c9a44e', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.scene.stop(SCENE_KEYS.hud);
        const updatedProfile = getStoredProfile();
        this.scene.start(SCENE_KEYS.mainMenu, { profile: updatedProfile });
      });
      btn.on('pointerover', () => btn.setColor('#f5e6a3'));
      btn.on('pointerout', () => btn.setColor('#c9a44e'));
    });
  }

  // ── Game Over ──

  private showGameOver(): void {
    this.player.setTint(0x666666);
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    // Save run to server
    saveRun(this.wave, this.kills, this.gold, this.classId).then(result => {
      this.showGameOverUI(result.xpEarned, result.newLevel, result);
    }).catch(() => {
      this.showGameOverUI(0, 0);
    });
  }

  private showGameOverUI(xpEarned: number, newLevel: number, result?: RunResult): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(100);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 500 });

    this.time.delayedCall(500, () => {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'DERROTADO', {
        fontFamily: '"Cinzel", serif', fontSize: '48px', color: '#e74c3c', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 6,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 15, [
        `⚔️ Onda ${this.wave}`,
        `💀 ${this.kills} kills`,
        `🪙 ${this.gold} ouro`,
      ].join('  ·  '), {
        fontFamily: '"Cinzel", serif', fontSize: '18px', color: '#d4d4d8',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      if (xpEarned > 0) {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 25, `+${xpEarned} XP${newLevel > 0 ? `  ·  Nível ${newLevel}` : ''}`, {
          fontFamily: '"Cinzel", serif', fontSize: '16px', color: '#c9a44e',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
      }

      // Mastery progress
      if (result) {
        const masteryLine = result.masteryUps > 0
          ? `⭐ Maestria ${result.newMastery} (+${result.masteryUps}!)`
          : `⭐ Maestria ${result.newMastery}`;
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, masteryLine, {
          fontFamily: '"Cinzel", serif', fontSize: '14px',
          color: result.masteryUps > 0 ? '#ffd700' : '#c9a44e',
          stroke: '#000000', strokeThickness: 3,
          fontStyle: result.masteryUps > 0 ? 'bold' : 'normal',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // XP bar toward next mastery
        const barW = 200, barH = 8;
        const barX = GAME_WIDTH / 2 - barW / 2;
        const barY = GAME_HEIGHT / 2 + 68;
        const barBg = this.add.graphics().setScrollFactor(0).setDepth(101);
        barBg.fillStyle(0x333333);
        barBg.fillRoundedRect(barX, barY, barW, barH, 4);
        const frac = result.nextMasteryXp > 0 ? result.currentClassXp / result.nextMasteryXp : 0;
        barBg.fillStyle(0xc9a44e);
        barBg.fillRoundedRect(barX, barY, barW * Math.min(1, frac), barH, 4);

        this.add.text(GAME_WIDTH / 2, barY + barH + 8, `${result.currentClassXp} / ${result.nextMasteryXp} XP`, {
          fontFamily: '"Cinzel", serif', fontSize: '10px', color: '#71717a',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
      }

      const btn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, '[ MENU ]', {
        fontFamily: '"Cinzel", serif', fontSize: '22px', color: '#c9a44e', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.scene.stop(SCENE_KEYS.hud);
        const updatedProfile = getStoredProfile();
        this.scene.start(SCENE_KEYS.mainMenu, { profile: updatedProfile });
      });
      btn.on('pointerover', () => btn.setColor('#f5e6a3'));
      btn.on('pointerout', () => btn.setColor('#c9a44e'));
    });
  }
}
