import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { ALL_CLASSES } from '../../shared/classes';
import type { ClassId, ClassDef, PlayerProfile } from '../../shared/types';
import { CLASS_IDS, masteryBonuses } from '../../shared/types';
import { getStoredProfile } from '../services/auth';

export class ClassSelectScene extends Phaser.Scene {
  private profile!: PlayerProfile | null;
  private selectedIndex = 0;
  private gameMode: 'arena' | 'dungeon' = 'arena';
  private items: Array<{ classId: ClassId; def: ClassDef; container: Phaser.GameObjects.Container }> = [];
  private detailsContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super(SCENE_KEYS.classSelect);
  }

  init(data?: { profile?: PlayerProfile; gameMode?: 'arena' | 'dungeon' }): void {
    this.profile = data?.profile ?? getStoredProfile();
    this.gameMode = data?.gameMode ?? 'arena';
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    this.selectedIndex = 0;
    this.items = [];

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.bgLight, PALETTE.bgLight, PALETTE.bg, PALETTE.bg, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 40, 'ESCOLHA SUA CLASSE', {
      fontFamily: '"Cinzel", serif', fontSize: '28px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Class cards (horizontal)
    const cardW = 180, cardH = 200, gap = 20;
    const totalW = CLASS_IDS.length * cardW + (CLASS_IDS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;

    CLASS_IDS.forEach((classId, i) => {
      const def = ALL_CLASSES[classId];
      const progress = this.profile?.classProgress[classId];
      const mastery = progress?.mastery ?? 0;
      const x = startX + i * (cardW + gap) + cardW / 2;
      const y = 190;

      const container = this.add.container(x, y);

      // Card background
      const cardBg = this.add.graphics();
      cardBg.fillStyle(PALETTE.panel, 0.9);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
      cardBg.lineStyle(2, def.color, 0.6);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
      container.add(cardBg);

      // Class color stripe at top
      const stripe = this.add.graphics();
      stripe.fillStyle(def.color, 0.8);
      stripe.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, 6, { tl: 8, tr: 8, bl: 0, br: 0 });
      container.add(stripe);

      // Class circle (colored)
      const circle = this.add.circle(0, -40, 28, def.color, 0.3);
      circle.setStrokeStyle(2, def.color, 0.8);
      container.add(circle);

      // Class name
      container.add(this.add.text(0, 5, def.name, {
        fontFamily: '"Cinzel", serif', fontSize: '16px', color: '#d4d4d8', fontStyle: 'bold',
      }).setOrigin(0.5));

      // Tagline
      container.add(this.add.text(0, 28, def.tagline, {
        fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#71717a',
        wordWrap: { width: cardW - 20 }, align: 'center',
      }).setOrigin(0.5));

      // Mastery
      const masteryText = mastery > 0 ? `⭐ Maestria ${mastery}` : 'Sem maestria';
      container.add(this.add.text(0, 60, masteryText, {
        fontFamily: '"Cinzel", serif', fontSize: '11px', color: mastery > 0 ? '#c9a44e' : '#555',
      }).setOrigin(0.5));

      // Lock overlay if not unlocked
      if (progress && !progress.unlocked) {
        const lock = this.add.graphics();
        lock.fillStyle(0x000000, 0.6);
        lock.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
        container.add(lock);
        container.add(this.add.text(0, -10, '🔒', { fontSize: '32px' }).setOrigin(0.5));
        container.add(this.add.text(0, 25, 'Em breve', {
          fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#71717a',
        }).setOrigin(0.5));
      }

      // Interactive
      const hitZone = this.add.zone(0, 0, cardW, cardH).setInteractive({ useHandCursor: true });
      container.add(hitZone);
      hitZone.on('pointerdown', () => {
        if (progress && !progress.unlocked) return;
        this.selectedIndex = i;
        this.selectClass(classId);
      });
      hitZone.on('pointerover', () => {
        if (progress && !progress.unlocked) return;
        this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
        this.showDetails(classId);
      });
      hitZone.on('pointerout', () => {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      });

      this.items.push({ classId, def, container });
    });

    // Details panel placeholder
    this.showDetails('hunter');

    // Back button
    const back = this.add.text(60, GAME_HEIGHT - 40, '← VOLTAR', {
      fontFamily: '"Cinzel", serif', fontSize: '16px', color: '#71717a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.mainMenu, { profile: this.profile }));
    back.on('pointerover', () => back.setColor('#d4d4d8'));
    back.on('pointerout', () => back.setColor('#71717a'));

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private showDetails(classId: ClassId): void {
    if (this.detailsContainer) this.detailsContainer.destroy();

    const def = ALL_CLASSES[classId];
    const progress = this.profile?.classProgress[classId];
    const mastery = progress?.mastery ?? 0;
    const bonuses = masteryBonuses(mastery);
    const container = this.add.container(GAME_WIDTH / 2, 420);
    this.detailsContainer = container;

    // Panel background
    const pw = 700, ph = 240;
    const panel = this.add.graphics();
    panel.fillStyle(PALETTE.panel, 0.85);
    panel.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 8);
    panel.lineStyle(1, def.color, 0.4);
    panel.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 8);
    container.add(panel);

    // Class name + passive
    container.add(this.add.text(-pw / 2 + 20, -ph / 2 + 15, `${def.name} — ${def.passive.name}`, {
      fontFamily: '"Cinzel", serif', fontSize: '18px', color: '#d4d4d8', fontStyle: 'bold',
    }));
    container.add(this.add.text(-pw / 2 + 20, -ph / 2 + 40, def.passive.description, {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#71717a',
      wordWrap: { width: pw - 40 },
    }));

    // Stats
    const stats = def.baseStats;
    const statsText = `❤️ ${stats.maxHealth}  ⚔️ ${stats.attackDamage}  🛡️ ${stats.defense}  💨 ${stats.speed}  🏹 ${stats.attackRange}`;
    container.add(this.add.text(-pw / 2 + 20, -ph / 2 + 70, statsText, {
      fontFamily: '"Cinzel", serif', fontSize: '13px', color: '#d4d4d8',
    }));

    // Mastery bonuses
    if (mastery > 0) {
      container.add(this.add.text(-pw / 2 + 20, -ph / 2 + 95, `⭐ Maestria ${mastery}: +${bonuses.damagePercent}% dano, +${bonuses.healthPercent}% HP, -${bonuses.cooldownPercent.toFixed(1)}% CD, +${bonuses.goldBonus}% ouro`, {
        fontFamily: '"Cinzel", serif', fontSize: '11px', color: '#c9a44e',
      }));
    }

    // Abilities grid (4 per row)
    const abY = -ph / 2 + (mastery > 0 ? 120 : 100);
    def.abilities.forEach((ab, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const ax = -pw / 2 + 25 + col * 138;
      const ay = abY + row * 36;

      const unlocked = progress?.unlockedAbilities.includes(ab.id) ?? false;
      const color = unlocked ? '#d4d4d8' : '#555';
      container.add(this.add.text(ax, ay, `${ab.icon} ${ab.name}`, {
        fontFamily: '"Cinzel", serif', fontSize: '11px', color,
      }));
    });

    // Play button
    const playBtn = this.add.text(pw / 2 - 20, ph / 2 - 25, '▶ JOGAR', {
      fontFamily: '"Cinzel", serif', fontSize: '18px', color: '#c9a44e', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    playBtn.on('pointerdown', () => this.selectClass(classId));
    playBtn.on('pointerover', () => playBtn.setColor('#f5e6a3'));
    playBtn.on('pointerout', () => playBtn.setColor('#c9a44e'));
    container.add(playBtn);
  }

  private selectClass(classId: ClassId): void {
    const progress = this.profile?.classProgress[classId];
    if (progress && !progress.unlocked) return;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (this.gameMode === 'dungeon') {
        this.scene.start(SCENE_KEYS.dungeonMap, { classId });
      } else {
        this.scene.start(SCENE_KEYS.game, { classId });
      }
    });
  }
}
