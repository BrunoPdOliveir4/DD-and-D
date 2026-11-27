import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { QuiverState } from '../systems/quiver';
import { QUIVER_SIZE, RELOAD_MS, ARROW_COLORS, reloadProgress, currentArrow } from '../systems/quiver';

interface HudData {
  hp: number;
  maxHp: number;
  quiver: QuiverState;
  abilities: Array<{ id: string; name: string; icon: string; cooldownMs: number; lastUsedMs: number }>;
  wave: number;
  gold: number;
  kills: number;
  time: number;
}

export class HudScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private quiverDisplay!: Phaser.GameObjects.Graphics;
  private quiverText!: Phaser.GameObjects.Text;
  private abilitySlots: Phaser.GameObjects.Container[] = [];
  private waveText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.hud);
  }

  create(): void {
    // HP bar background + fill
    this.hpBar = this.add.graphics().setDepth(100);
    this.hpText = this.add.text(120, 24, '', {
      fontFamily: '"Cinzel", serif', fontSize: '13px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(101);

    // Quiver display
    this.quiverDisplay = this.add.graphics().setDepth(100);
    this.quiverText = this.add.text(20, 54, 'ALJAVA', {
      fontFamily: '"Cinzel", serif', fontSize: '10px', color: '#71717a', letterSpacing: 2,
    }).setDepth(100);

    // Wave + gold + kills
    this.waveText = this.add.text(GAME_WIDTH - 20, 20, '', {
      fontFamily: '"Cinzel", serif', fontSize: '18px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(100);

    this.goldText = this.add.text(GAME_WIDTH - 20, 46, '', {
      fontFamily: '"Cinzel", serif', fontSize: '15px', color: '#d9b25f',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(100);

    this.killText = this.add.text(GAME_WIDTH - 20, 68, '', {
      fontFamily: '"Cinzel", serif', fontSize: '13px', color: '#71717a',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(100);

    // Ability bar slots
    for (let i = 0; i < 3; i++) {
      const x = GAME_WIDTH / 2 - 100 + i * 80;
      const y = GAME_HEIGHT - 60;
      const container = this.add.container(x, y).setDepth(100);
      this.abilitySlots.push(container);
    }

    // Listen to game scene events
    const gameScene = this.scene.get(SCENE_KEYS.game);
    gameScene.events.on('hudUpdate', (data: HudData) => this.updateHud(data));
  }

  private updateHud(data: HudData): void {
    this.drawHpBar(data.hp, data.maxHp);
    this.drawQuiver(data.quiver, data.time);
    this.drawAbilities(data.abilities, data.time);
    this.waveText.setText(`⚔️ Onda ${data.wave}`);
    this.goldText.setText(`🪙 ${data.gold}`);
    this.killText.setText(`💀 ${data.kills}`);
  }

  private drawHpBar(hp: number, maxHp: number): void {
    this.hpBar.clear();
    const x = 20, y = 20, w = 200, h = 22, r = 4;
    const frac = Math.max(0, hp / maxHp);

    // Shadow
    this.hpBar.fillStyle(0x000000, 0.4);
    this.hpBar.fillRoundedRect(x + 1, y + 1, w, h, r);
    // Background
    this.hpBar.fillStyle(0x1a1a2e);
    this.hpBar.fillRoundedRect(x, y, w, h, r);
    // Fill
    const fillColor = frac > 0.5 ? 0x2ecc71 : frac > 0.25 ? 0xf39c12 : 0xe74c3c;
    this.hpBar.fillStyle(fillColor);
    if (frac > 0) this.hpBar.fillRoundedRect(x, y, Math.max(8, w * frac), h, r);
    // Glass
    this.hpBar.fillStyle(0xffffff, 0.1);
    this.hpBar.fillRoundedRect(x + 1, y + 1, w - 2, h / 2, r);
    // Border
    this.hpBar.lineStyle(1, 0xffffff, 0.15);
    this.hpBar.strokeRoundedRect(x, y, w, h, r);
    // HP text
    this.hpText.setText(`${Math.ceil(hp)} / ${maxHp}`);
  }

  private drawQuiver(quiver: QuiverState, time: number): void {
    this.quiverDisplay.clear();
    const x = 20, y = 66;
    const size = 14, gap = 4;

    for (let i = 0; i < QUIVER_SIZE; i++) {
      const cx = x + i * (size + gap) + size / 2;
      const cy = y + size / 2;

      if (i < quiver.currentIndex) {
        // Used arrow — dim
        this.quiverDisplay.fillStyle(0x333333, 0.5);
        this.quiverDisplay.fillCircle(cx, cy, size / 2);
      } else if (quiver.reloading) {
        // Reloading — pulse
        const progress = reloadProgress(quiver, time);
        const unlocked = i / QUIVER_SIZE < progress;
        this.quiverDisplay.fillStyle(unlocked ? 0x555555 : 0x222222, 0.6);
        this.quiverDisplay.fillCircle(cx, cy, size / 2);
      } else {
        // Available arrow
        const type = quiver.arrows[i];
        const color = ARROW_COLORS[type];
        const isCurrent = i === quiver.currentIndex;

        this.quiverDisplay.fillStyle(color, isCurrent ? 1 : 0.7);
        this.quiverDisplay.fillCircle(cx, cy, size / 2);

        if (isCurrent) {
          this.quiverDisplay.lineStyle(2, 0xffffff, 0.8);
          this.quiverDisplay.strokeCircle(cx, cy, size / 2 + 2);
        }
      }
    }

    // Reload bar
    if (quiver.reloading) {
      const progress = reloadProgress(quiver, time);
      const barW = QUIVER_SIZE * (size + gap) - gap;
      this.quiverDisplay.fillStyle(0x333333);
      this.quiverDisplay.fillRect(x, y + size + 4, barW, 3);
      this.quiverDisplay.fillStyle(0xc9a44e);
      this.quiverDisplay.fillRect(x, y + size + 4, barW * progress, 3);
    }
  }

  private drawAbilities(abilities: HudData['abilities'], time: number): void {
    for (let i = 0; i < abilities.length && i < this.abilitySlots.length; i++) {
      const container = this.abilitySlots[i];
      container.removeAll(true);
      const ab = abilities[i];
      const elapsed = time - ab.lastUsedMs;
      const ready = elapsed >= ab.cooldownMs;
      const frac = ready ? 1 : elapsed / ab.cooldownMs;

      const x = 0, y = 0, size = 56;

      // Background
      const bg = this.add.graphics();
      bg.fillStyle(ready ? 0x1a1a2e : 0x0d0d1a, 0.9);
      bg.fillRoundedRect(x - size / 2, y - size / 2, size, size, 6);
      bg.lineStyle(1, ready ? 0xc9a44e : 0x333333, ready ? 0.6 : 0.3);
      bg.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 6);

      // Cooldown overlay
      if (!ready) {
        bg.fillStyle(0x000000, 0.6);
        const coolH = size * (1 - frac);
        bg.fillRect(x - size / 2, y - size / 2, size, coolH);
      }

      container.add(bg);

      // Icon
      const icon = this.add.text(x, y - 4, ab.icon, { fontSize: '24px' }).setOrigin(0.5);
      container.add(icon);

      // Key hint
      const key = this.add.text(x, y + size / 2 - 8, `${i + 1}`, {
        fontFamily: '"Cinzel", serif', fontSize: '11px',
        color: ready ? '#c9a44e' : '#555',
      }).setOrigin(0.5);
      container.add(key);

      // Cooldown text
      if (!ready) {
        const remaining = Math.ceil((ab.cooldownMs - elapsed) / 1000);
        const cdText = this.add.text(x, y - 4, `${remaining}`, {
          fontFamily: '"Cinzel", serif', fontSize: '16px', color: '#ffffff',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);
        container.add(cdText);
      }
    }
  }
}
