import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../systems/constants';
import type { QuiverState } from '../systems/quiver';
import { QUIVER_SIZE, RELOAD_MS, ARROW_COLORS, reloadProgress, currentArrow } from '../systems/quiver';
import type { ClassId } from '../../shared/types';
import { ALL_CLASSES } from '../../shared/classes';

interface HudData {
  hp: number;
  maxHp: number;
  quiver: QuiverState;
  abilities: Array<{ id: string; name: string; icon: string; cooldownMs: number; lastUsedMs: number }>;
  wave: number;
  gold: number;
  kills: number;
  classId?: ClassId;
  isAiming?: boolean;
  time: number;
}

export class HudScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private quiverDisplay!: Phaser.GameObjects.Graphics;
  private quiverLabel!: Phaser.GameObjects.Text;
  private abilitySlots: Phaser.GameObjects.Container[] = [];
  private waveText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private minimap!: Phaser.GameObjects.Graphics;
  private topPanel!: Phaser.GameObjects.Graphics;
  private bottomPanel!: Phaser.GameObjects.Graphics;
  private classNameText!: Phaser.GameObjects.Text;
  private escHint!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.hud);
  }

  create(): void {
    // ── Top panel (glass) ──
    this.topPanel = this.add.graphics().setDepth(99);
    this.topPanel.fillStyle(0x07070c, 0.65);
    this.topPanel.fillRect(0, 0, GAME_WIDTH, 52);
    // Subtle bottom edge
    this.topPanel.lineStyle(1, 0xffffff, 0.04);
    this.topPanel.lineBetween(0, 52, GAME_WIDTH, 52);

    // ── Bottom panel (glass) ──
    this.bottomPanel = this.add.graphics().setDepth(99);
    this.bottomPanel.fillStyle(0x07070c, 0.65);
    this.bottomPanel.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);
    this.bottomPanel.lineStyle(1, 0xffffff, 0.04);
    this.bottomPanel.lineBetween(0, GAME_HEIGHT - 80, GAME_WIDTH, GAME_HEIGHT - 80);

    // ── HP bar ──
    this.hpBar = this.add.graphics().setDepth(100);
    this.hpText = this.add.text(135, 26, '', {
      fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setDepth(101);

    // Class name (top-left)
    this.classNameText = this.add.text(20, 7, '', {
      fontFamily: '"Cinzel", serif', fontSize: '10px', color: '#71717a',
      letterSpacing: 2,
    }).setDepth(101);

    // ── Quiver display ──
    this.quiverDisplay = this.add.graphics().setDepth(100);
    this.quiverLabel = this.add.text(250, 15, '', {
      fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#555',
    }).setDepth(100);

    // ── Wave / gold / kills (top-right) ──
    this.waveText = this.add.text(GAME_WIDTH - 16, 12, '', {
      fontFamily: '"Cinzel", serif', fontSize: '16px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(100);

    this.goldText = this.add.text(GAME_WIDTH - 16, 32, '', {
      fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#d9b25f',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(100);

    this.killText = this.add.text(GAME_WIDTH - 80, 32, '', {
      fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#71717a',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(100);

    // ── Ability bar (bottom center) ──
    for (let i = 0; i < 5; i++) {
      const x = GAME_WIDTH / 2 - 130 + i * 60;
      const y = GAME_HEIGHT - 44;
      const container = this.add.container(x, y).setDepth(100);
      this.abilitySlots.push(container);
    }

    // ESC hint
    this.escHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, 'ESC entre ondas para sair', {
      fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#3a3a3a',
    }).setOrigin(0.5).setDepth(100);

    // ── Minimap (bottom-left) ──
    this.minimap = this.add.graphics().setDepth(100);

    // Listen
    const gameScene = this.scene.get(SCENE_KEYS.game);
    gameScene.events.on('hudUpdate', (data: HudData) => this.updateHud(data));
  }

  private updateHud(data: HudData): void {
    this.drawHpBar(data.hp, data.maxHp);
    if (data.classId === 'hunter') {
      this.drawQuiver(data.quiver, data.time);
      this.quiverLabel.setVisible(true);
    } else {
      this.quiverDisplay.clear();
      this.quiverLabel.setVisible(false);
    }
    this.drawAbilities(data.abilities, data.time);
    this.drawMinimap();
    this.waveText.setText(`Onda ${data.wave}`);
    this.goldText.setText(`${data.gold} 🪙`);
    this.killText.setText(`${data.kills} 💀`);

    if (data.classId) {
      const def = ALL_CLASSES[data.classId];
      this.classNameText.setText(def.name.toUpperCase());
    }
  }

  private drawHpBar(hp: number, maxHp: number): void {
    this.hpBar.clear();
    const x = 20, y = 18, w = 230, h = 16, r = 3;
    const frac = Math.max(0, hp / maxHp);

    // Background
    this.hpBar.fillStyle(0x111118, 0.9);
    this.hpBar.fillRoundedRect(x, y, w, h, r);
    // Fill
    const fillColor = frac > 0.6 ? 0x22c55e : frac > 0.3 ? 0xeab308 : 0xef4444;
    if (frac > 0) {
      this.hpBar.fillStyle(fillColor, 0.85);
      this.hpBar.fillRoundedRect(x, y, Math.max(6, w * frac), h, r);
    }
    // Glass highlight
    this.hpBar.fillStyle(0xffffff, 0.07);
    this.hpBar.fillRoundedRect(x + 1, y + 1, w - 2, h * 0.45, { tl: r, tr: r, bl: 0, br: 0 });
    // Border
    this.hpBar.lineStyle(1, 0xffffff, 0.08);
    this.hpBar.strokeRoundedRect(x, y, w, h, r);
    // Low HP pulse effect
    if (frac <= 0.25 && frac > 0) {
      this.hpBar.lineStyle(1, 0xef4444, 0.3);
      this.hpBar.strokeRoundedRect(x - 1, y - 1, w + 2, h + 2, r + 1);
    }

    this.hpText.setPosition(x + w / 2, y + h / 2);
    this.hpText.setText(`${Math.ceil(hp)} / ${maxHp}`);
    this.hpText.setColor(frac <= 0.25 ? '#ef4444' : '#ffffff');
  }

  private drawQuiver(quiver: QuiverState, time: number): void {
    this.quiverDisplay.clear();
    const x = 260, y = 18;
    const size = 12, gap = 3;

    for (let i = 0; i < QUIVER_SIZE; i++) {
      const cx = x + i * (size + gap) + size / 2;
      const cy = y + size / 2;

      if (i < quiver.currentIndex) {
        this.quiverDisplay.fillStyle(0x222228, 0.6);
        this.quiverDisplay.fillCircle(cx, cy, size / 2);
      } else if (quiver.reloading) {
        const progress = reloadProgress(quiver, time);
        const unlocked = i / QUIVER_SIZE < progress;
        this.quiverDisplay.fillStyle(unlocked ? 0x444450 : 0x1a1a22, 0.7);
        this.quiverDisplay.fillCircle(cx, cy, size / 2);
      } else {
        const type = quiver.arrows[i];
        const color = ARROW_COLORS[type];
        const isCurrent = i === quiver.currentIndex;

        this.quiverDisplay.fillStyle(color, isCurrent ? 1 : 0.6);
        this.quiverDisplay.fillCircle(cx, cy, size / 2);

        if (isCurrent) {
          this.quiverDisplay.lineStyle(2, 0xffffff, 0.6);
          this.quiverDisplay.strokeCircle(cx, cy, size / 2 + 2);
        }
      }
    }

    // Reload bar
    if (quiver.reloading) {
      const progress = reloadProgress(quiver, time);
      const barW = QUIVER_SIZE * (size + gap) - gap;
      this.quiverDisplay.fillStyle(0x222228);
      this.quiverDisplay.fillRoundedRect(x, y + size + 4, barW, 3, 1);
      this.quiverDisplay.fillStyle(0xc9a44e);
      this.quiverDisplay.fillRoundedRect(x, y + size + 4, barW * progress, 3, 1);
      this.quiverLabel.setText('Recarregando...');
    } else {
      const remaining = QUIVER_SIZE - quiver.currentIndex;
      this.quiverLabel.setText(`${remaining}/${QUIVER_SIZE}`);
    }
  }

  private drawAbilities(abilities: HudData['abilities'], time: number): void {
    for (let i = 0; i < this.abilitySlots.length; i++) {
      const container = this.abilitySlots[i];
      container.removeAll(true);

      if (i >= abilities.length) {
        // Empty slot
        const bg = this.add.graphics();
        bg.fillStyle(0x111118, 0.5);
        bg.fillRoundedRect(-24, -24, 48, 48, 6);
        bg.lineStyle(1, 0x222228, 0.5);
        bg.strokeRoundedRect(-24, -24, 48, 48, 6);
        container.add(bg);
        continue;
      }

      const ab = abilities[i];
      const elapsed = time - ab.lastUsedMs;
      const ready = elapsed >= ab.cooldownMs;
      const frac = ready ? 1 : elapsed / ab.cooldownMs;
      const size = 48;

      // Background
      const bg = this.add.graphics();
      bg.fillStyle(ready ? 0x16162a : 0x0d0d14, 0.9);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 6);

      // Cooldown sweep (top-down wipe)
      if (!ready) {
        bg.fillStyle(0x000000, 0.55);
        const coolH = size * (1 - frac);
        bg.fillRect(-size / 2, -size / 2, size, coolH);
      }

      // Border
      bg.lineStyle(1, ready ? 0xc9a44e : 0x2a2a3a, ready ? 0.5 : 0.3);
      bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 6);

      // Ready glow
      if (ready) {
        bg.lineStyle(1, 0xc9a44e, 0.12);
        bg.strokeRoundedRect(-size / 2 - 1, -size / 2 - 1, size + 2, size + 2, 7);
      }

      container.add(bg);

      // Icon
      const icon = this.add.text(0, -2, ab.icon, { fontSize: '20px' }).setOrigin(0.5);
      if (!ready) icon.setAlpha(0.4);
      container.add(icon);

      // Key hint (top-left corner)
      const keyBg = this.add.graphics();
      keyBg.fillStyle(0x000000, 0.6);
      keyBg.fillRoundedRect(-size / 2, -size / 2, 16, 14, { tl: 6, tr: 0, bl: 0, br: 4 });
      container.add(keyBg);

      const key = this.add.text(-size / 2 + 8, -size / 2 + 7, `${i + 1}`, {
        fontFamily: 'Inter, sans-serif', fontSize: '9px',
        color: ready ? '#c9a44e' : '#444',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(key);

      // Cooldown countdown
      if (!ready) {
        const remaining = Math.ceil((ab.cooldownMs - elapsed) / 1000);
        const cdText = this.add.text(0, -2, `${remaining}`, {
          fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);
        container.add(cdText);
      }
    }
  }

  private drawMinimap(): void {
    this.minimap.clear();
    const MX = 16, MY = GAME_HEIGHT - 80 - 90, MW = 90, MH = 65;
    const scaleX = MW / WORLD_WIDTH;
    const scaleY = MH / WORLD_HEIGHT;

    // Background
    this.minimap.fillStyle(0x07070c, 0.75);
    this.minimap.fillRoundedRect(MX, MY, MW, MH, 4);
    this.minimap.lineStyle(1, 0xffffff, 0.06);
    this.minimap.strokeRoundedRect(MX, MY, MW, MH, 4);

    const gameScene = this.scene.get(SCENE_KEYS.game) as Phaser.Scene;
    const enemies = gameScene.children?.list?.filter(
      (c: any) => c.getData?.('d') && (c.getData('d') as any).hp > 0
    ) ?? [];

    // Enemy dots
    for (const e of enemies) {
      const ex = MX + (e as any).x * scaleX;
      const ey = MY + (e as any).y * scaleY;
      this.minimap.fillStyle(0xef4444, 0.7);
      this.minimap.fillCircle(ex, ey, 1.5);
    }

    // Player dot
    const player = (gameScene as any).player;
    if (player) {
      const px = MX + player.x * scaleX;
      const py = MY + player.y * scaleY;
      this.minimap.fillStyle(0x22c55e, 1);
      this.minimap.fillCircle(px, py, 2.5);
      // Direction indicator
      const r = player.rotation ?? 0;
      this.minimap.lineStyle(1, 0x22c55e, 0.5);
      this.minimap.lineBetween(px, py, px + Math.cos(r) * 6, py + Math.sin(r) * 6);
    }
  }
}
