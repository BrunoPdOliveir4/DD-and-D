import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { generateTextures } from '../systems/textures';
import {
  TEX, WORLD_WIDTH, WORLD_HEIGHT, PLAYER_RADIUS, PLAYER_SPEED, PLAYER_MAX_HP,
  ENEMY_TYPES, type EnemyType,
} from '../systems/constants';
import {
  createQuiver, currentArrow, fireArrow, tickReload, reloadProgress,
  ARROW_DAMAGE, ARROW_SPEED, type ArrowType, type QuiverState, ARROW_COLORS,
} from '../systems/quiver';
import { buildWave, randomEdgePosition } from '../systems/wave-manager';

// ── Ability definitions (3 starter abilities) ──
interface AbilityState {
  id: string;
  name: string;
  icon: string;
  cooldownMs: number;
  lastUsedMs: number;
}

const STARTER_ABILITIES: AbilityState[] = [
  { id: 'rain', name: 'Chuva de Flechas', icon: '🏹', cooldownMs: 8000, lastUsedMs: -99999 },
  { id: 'roll', name: 'Recuo Ágil', icon: '💨', cooldownMs: 5000, lastUsedMs: -99999 },
  { id: 'pierce', name: 'Flecha Perfurante', icon: '💎', cooldownMs: 6000, lastUsedMs: -99999 },
];

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

  // Input
  private keys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private pointer!: Phaser.Input.Pointer;

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

  create(): void {
    generateTextures(this);
    this.alive = true;
    this.hp = PLAYER_MAX_HP;
    this.quiver = createQuiver();
    this.abilities = STARTER_ABILITIES.map(a => ({ ...a, lastUsedMs: -99999 }));
    this.wave = 0;
    this.gold = 0;
    this.kills = 0;

    // World
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawFloor();

    // Player
    this.player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, TEX.player);
    this.player.setCircle(PLAYER_RADIUS);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 80);
    this.cameras.main.setBackgroundColor(PALETTE.bg);

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

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) this.shootArrow();
    });

    this.input.keyboard!.on('keydown-ONE', () => this.useAbility(0));
    this.input.keyboard!.on('keydown-TWO', () => this.useAbility(1));
    this.input.keyboard!.on('keydown-THREE', () => this.useAbility(2));
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.pause();
      // Simple resume on click
      this.input.once('pointerdown', () => this.scene.resume());
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

    // Rotate toward mouse
    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    this.player.setRotation(angle);

    // Enemy AI
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Phaser.Physics.Arcade.Sprite;
      const data = enemy.getData('d') as EnemyData;
      if (!data || data.hp <= 0) return;

      // Stunned?
      if (data.stunUntil > time) {
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        return;
      }

      // Poison tick
      if (data.poisonUntil > time && time - data.poisonTickMs > 500) {
        data.poisonTickMs = time;
        this.damageEnemy(enemy, data, 8, time);
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
      time,
    });
  }

  // ── Shooting ──

  private shootArrow(): void {
    if (!this.alive) return;
    const type = currentArrow(this.quiver);
    if (!type) return;

    const worldPoint = this.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    const texKey = type === 'poison' ? TEX.arrowPoison : type === 'stun' ? TEX.arrowStun : TEX.arrowLacerate;
    const arrow = this.physics.add.sprite(this.player.x, this.player.y, texKey);
    arrow.setRotation(angle);
    arrow.setData('type', type);
    (arrow.body as Phaser.Physics.Arcade.Body).setVelocity(
      Math.cos(angle) * ARROW_SPEED,
      Math.sin(angle) * ARROW_SPEED,
    );
    this.arrows.add(arrow);

    this.quiver = fireArrow(this.quiver, this.time.now);
  }

  // ── Abilities ──

  private useAbility(index: number): void {
    if (!this.alive || index >= this.abilities.length) return;
    const ab = this.abilities[index];
    const now = this.time.now;
    if (now - ab.lastUsedMs < ab.cooldownMs) return;
    ab.lastUsedMs = now;

    switch (ab.id) {
      case 'rain':
        this.abilityRainOfArrows();
        break;
      case 'roll':
        this.abilityEvasiveRoll();
        break;
      case 'pierce':
        this.abilityPiercingShot();
        break;
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
        (rain.body as Phaser.Physics.Arcade.Body).setVelocity(0, 300);
        this.rainArrows.add(rain);
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
    (arrow.body as Phaser.Physics.Arcade.Body).setVelocity(
      Math.cos(angle) * ARROW_SPEED * 1.4,
      Math.sin(angle) * ARROW_SPEED * 1.4,
    );
    this.arrows.add(arrow);

    // Camera shake for impact feel
    this.cameras.main.shake(100, 0.003);
  }

  // ── Collisions ──

  private onArrowHitEnemy(arrowObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const arrow = arrowObj as Phaser.Physics.Arcade.Sprite;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    const data = enemy.getData('d') as EnemyData;
    if (!data || data.hp <= 0) return;

    const type = arrow.getData('type') as ArrowType;
    const piercing = arrow.getData('piercing') as boolean;
    const pierceDmg = arrow.getData('pierceDamage') as number | undefined;
    let dmg = pierceDmg || ARROW_DAMAGE;

    // Lacerate bonus
    if (type === 'lacerate') dmg = Math.round(dmg * 1.5);

    const now = this.time.now;

    // Apply effects
    if (type === 'stun') data.stunUntil = now + 1000;
    if (type === 'poison') {
      data.poisonUntil = now + 3000;
      data.poisonTickMs = now;
    }

    this.damageEnemy(enemy, data, dmg, now);

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

  private damageEnemy(enemy: Phaser.Physics.Arcade.Sprite, data: EnemyData, dmg: number, _now: number): void {
    data.hp -= dmg;

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
      this.time.delayedCall(2000, () => this.startNextWave());
    }
  }

  private spawnEnemy(type: EnemyType): void {
    const def = ENEMY_TYPES[type];
    const pos = randomEdgePosition();
    const texKey = type === 'grunt' ? TEX.grunt : TEX.brute;
    const enemy = this.physics.add.sprite(pos.x, pos.y, texKey);
    enemy.setCircle(def.radius);
    enemy.setDepth(8);

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
    g.fillStyle(0x0d0d1a);
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    // Grid lines
    g.lineStyle(1, 0x1a1a2e, 0.4);
    for (let x = 0; x <= WORLD_WIDTH; x += 64) {
      g.lineBetween(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 64) {
      g.lineBetween(0, y, WORLD_WIDTH, y);
    }
    // Border
    g.lineStyle(3, 0xc9a44e, 0.3);
    g.strokeRect(10, 10, WORLD_WIDTH - 20, WORLD_HEIGHT - 20);
  }

  // ── Game Over ──

  private showGameOver(): void {
    this.player.setTint(0x666666);
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(100);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 500 });

    this.time.delayedCall(500, () => {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'DERROTADO', {
        fontFamily: '"Cinzel", serif', fontSize: '48px', color: '#e74c3c', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 6,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, [
        `Onda: ${this.wave}`,
        `Kills: ${this.kills}`,
        `Ouro: 🪙 ${this.gold}`,
      ].join('  ·  '), {
        fontFamily: '"Cinzel", serif', fontSize: '18px', color: '#d4d4d8',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      const btn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, '[ MENU ]', {
        fontFamily: '"Cinzel", serif', fontSize: '22px', color: '#c9a44e', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.scene.stop(SCENE_KEYS.hud);
        this.scene.start(SCENE_KEYS.mainMenu, { profile: null });
      });
      btn.on('pointerover', () => btn.setColor('#f5e6a3'));
      btn.on('pointerout', () => btn.setColor('#c9a44e'));
    });
  }
}
