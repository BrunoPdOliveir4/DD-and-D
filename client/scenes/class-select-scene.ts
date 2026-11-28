import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT, API_BASE } from '../config';
import { ALL_CLASSES } from '../../shared/classes';
import type { ClassId, ClassDef, PlayerProfile } from '../../shared/types';
import { CLASS_IDS, masteryBonuses, getMasteryTier, levelFromXp, MASTERY_SKILL_GATES } from '../../shared/types';
import { getStoredProfile, getStoredToken, storeAuth } from '../services/auth';

export class ClassSelectScene extends Phaser.Scene {
  private profile!: PlayerProfile | null;
  private selectedClass: ClassId | null = null;
  private gameMode: 'arena' | 'dungeon' = 'arena';
  private detailsContainer: Phaser.GameObjects.Container | null = null;
  private playBtn!: Phaser.GameObjects.Text;
  private talentBtn!: Phaser.GameObjects.Text;
  private cardBgs: Map<ClassId, Phaser.GameObjects.Graphics> = new Map();

  constructor() { super(SCENE_KEYS.classSelect); }

  init(data?: { profile?: PlayerProfile; gameMode?: 'arena' | 'dungeon' }): void {
    this.profile = data?.profile ?? getStoredProfile();
    this.gameMode = data?.gameMode ?? 'arena';
    this.selectedClass = null;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x07070c);
    this.cardBgs.clear();

    const bg = this.add.graphics();
    bg.fillStyle(0x0d0d1a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Profile panel
    this.drawProfilePanel();

    // Title
    const modeLabel = this.gameMode === 'dungeon' ? 'DUNGEON' : 'ARENA';
    const modeColor = this.gameMode === 'dungeon' ? '#9b59b6' : '#c9a44e';
    this.add.text(GAME_WIDTH / 2, 28, `ESCOLHA SUA CLASSE`, {
      fontFamily: '"Cinzel", serif', fontSize: '20px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 50, modeLabel, {
      fontFamily: '"Cinzel", serif', fontSize: '11px', color: modeColor, letterSpacing: 4,
    }).setOrigin(0.5);

    // Class cards
    const cardW = 170, cardH = 200, gap = 14;
    const totalW = CLASS_IDS.length * cardW + (CLASS_IDS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;

    CLASS_IDS.forEach((classId, i) => {
      const def = ALL_CLASSES[classId];
      const progress = this.profile?.classProgress[classId];
      const mastery = progress?.mastery ?? 0;
      const tier = getMasteryTier(mastery);
      const x = startX + i * (cardW + gap) + cardW / 2;
      const y = 180;

      const container = this.add.container(x, y);

      // Card bg
      const cardBg = this.add.graphics();
      this.drawCardBg(cardBg, cardW, cardH, def.color, tier, false);
      container.add(cardBg);
      this.cardBgs.set(classId, cardBg);

      // Top stripe
      const stripe = this.add.graphics();
      stripe.fillStyle(def.color, 0.8);
      stripe.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, 4, { tl: 8, tr: 8, bl: 0, br: 0 });
      container.add(stripe);

      // Class circle
      const circle = this.add.circle(0, -45, 24, def.color, 0.25);
      circle.setStrokeStyle(tier.borderStyle !== 'none' ? 2 : 1, tier.borderStyle !== 'none' ? tier.color : def.color, 0.8);
      container.add(circle);
      container.add(this.add.text(0, -45, def.name[0], {
        fontFamily: '"Cinzel", serif', fontSize: '20px', color: '#d4d4d8', fontStyle: 'bold',
      }).setOrigin(0.5));

      // Name + tagline
      container.add(this.add.text(0, -12, def.name, {
        fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#d4d4d8', fontStyle: 'bold',
      }).setOrigin(0.5));
      container.add(this.add.text(0, 6, def.tagline, {
        fontFamily: 'Inter, sans-serif', fontSize: '8px', color: '#71717a',
        wordWrap: { width: cardW - 20 }, align: 'center',
      }).setOrigin(0.5));

      // Mastery
      const tierLabel = tier.borderStyle !== 'none' ? `${tier.name} · M${mastery}` : `Maestria ${mastery}`;
      const tierColor = tier.borderStyle !== 'none' ? `#${tier.color.toString(16).padStart(6, '0')}` : '#555';
      container.add(this.add.text(0, 36, tierLabel, {
        fontFamily: '"Cinzel", serif', fontSize: '10px', color: tierColor, fontStyle: 'bold',
      }).setOrigin(0.5));

      // Equipped abilities preview
      const equipped = progress?.equippedAbilities ?? [];
      const eqIcons = equipped.slice(0, 5).map(id => {
        const ab = def.abilities.find(a => a.id === id);
        return ab?.icon ?? '?';
      }).join(' ');
      container.add(this.add.text(0, 58, eqIcons || '— vazio —', {
        fontSize: equipped.length > 0 ? '14px' : '9px', color: equipped.length > 0 ? '#d4d4d8' : '#333',
      }).setOrigin(0.5));

      container.add(this.add.text(0, 76, `${equipped.length}/5 equipadas`, {
        fontFamily: 'Inter, sans-serif', fontSize: '8px', color: '#555',
      }).setOrigin(0.5));

      // Interactive — SELECT (not start)
      const hitZone = this.add.zone(0, 0, cardW, cardH).setInteractive({ useHandCursor: true });
      container.add(hitZone);
      hitZone.on('pointerdown', () => this.onSelectClass(classId));
      hitZone.on('pointerover', () => {
        this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 80 });
        this.showDetails(classId);
      });
      hitZone.on('pointerout', () => {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
      });
    });

    // Details panel (bottom)
    this.showDetails('hunter');

    // ── JOGAR button (disabled until selection) ──
    this.playBtn = this.add.text(GAME_WIDTH / 2 + 80, GAME_HEIGHT - 35, '▶ JOGAR', {
      fontFamily: '"Cinzel", serif', fontSize: '20px', color: '#333', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.playBtn.on('pointerdown', () => this.startGame());
    this.playBtn.on('pointerover', () => { if (this.selectedClass) this.playBtn.setColor('#f5e6a3'); });
    this.playBtn.on('pointerout', () => { if (this.selectedClass) this.playBtn.setColor('#c9a44e'); });

    // ── TALENTOS button ──
    this.talentBtn = this.add.text(GAME_WIDTH / 2 - 80, GAME_HEIGHT - 35, '⚙️ TALENTOS', {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#333',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.talentBtn.on('pointerdown', () => {
      if (this.selectedClass) {
        this.scene.start(SCENE_KEYS.talentTree, { profile: this.profile, selectedClass: this.selectedClass });
      }
    });

    // Back
    const back = this.add.text(50, GAME_HEIGHT - 35, '← VOLTAR', {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#555',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.mainMenu, { profile: this.profile }));
    back.on('pointerover', () => back.setColor('#d4d4d8'));
    back.on('pointerout', () => back.setColor('#555'));

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private drawCardBg(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number, tier: any, selected: boolean): void {
    g.clear();
    g.fillStyle(selected ? 0x16162a : PALETTE.panel, 0.9);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    if (selected) {
      g.lineStyle(2, 0xffd700, 0.9);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
      g.lineStyle(1, 0xffd700, 0.2);
      g.strokeRoundedRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 10);
    } else if (tier.borderStyle !== 'none') {
      g.lineStyle(2, tier.color, 0.7);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    } else {
      g.lineStyle(1, color, 0.3);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    }
  }

  private onSelectClass(classId: ClassId): void {
    this.selectedClass = classId;

    // Update card highlights
    const cardW = 170, cardH = 200;
    CLASS_IDS.forEach(cid => {
      const bg = this.cardBgs.get(cid);
      if (!bg) return;
      const def = ALL_CLASSES[cid];
      const tier = getMasteryTier(this.profile?.classProgress[cid]?.mastery ?? 0);
      this.drawCardBg(bg, cardW, cardH, def.color, tier, cid === classId);
    });

    // Enable buttons
    this.playBtn.setColor('#c9a44e');
    this.talentBtn.setColor('#71717a');

    // Update details
    this.showDetails(classId);
  }

  private drawProfilePanel(): void {
    if (!this.profile) return;
    const globalLevel = levelFromXp(this.profile.xp);
    const pw = 200, ph = 50;
    const px = GAME_WIDTH - pw - 12, py = 10;

    const g = this.add.graphics();
    g.fillStyle(PALETTE.panel, 0.7);
    g.fillRoundedRect(px, py, pw, ph, 6);

    this.add.text(px + 8, py + 8, this.profile.displayName, {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#d4d4d8', fontStyle: 'bold',
    });
    this.add.text(px + pw - 8, py + 8, `Nv ${globalLevel.level}`, {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#c9a44e', fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.add.text(px + 8, py + 30, `💰 ${this.profile.gold}`, {
      fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#c9a44e',
    });
  }

  private showDetails(classId: ClassId): void {
    if (this.detailsContainer) this.detailsContainer.destroy();

    const def = ALL_CLASSES[classId];
    const progress = this.profile?.classProgress[classId];
    const mastery = progress?.mastery ?? 0;
    const tier = getMasteryTier(mastery);
    const bonuses = masteryBonuses(mastery);
    const container = this.add.container(GAME_WIDTH / 2, 420);
    this.detailsContainer = container;

    const pw = 740, ph = 220;
    const panel = this.add.graphics();
    panel.fillStyle(PALETTE.panel, 0.8);
    panel.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 8);
    panel.lineStyle(1, classId === this.selectedClass ? 0xffd700 : def.color, 0.3);
    panel.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 8);
    container.add(panel);

    // Name + passive
    container.add(this.add.text(-pw / 2 + 16, -ph / 2 + 10, `${def.name} — ${def.passive.name}`, {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#d4d4d8', fontStyle: 'bold',
    }));
    container.add(this.add.text(-pw / 2 + 16, -ph / 2 + 30, def.passive.description, {
      fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#71717a', wordWrap: { width: pw / 2 - 20 },
    }));

    // Stats
    const stats = def.baseStats;
    container.add(this.add.text(-pw / 2 + 16, -ph / 2 + 54, `❤️ ${stats.maxHealth}  ⚔️ ${stats.attackDamage}  🛡️ ${stats.defense}  💨 ${stats.speed}  🏹 ${stats.attackRange}`, {
      fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#d4d4d8',
    }));

    // Mastery bonuses
    if (mastery > 0) {
      container.add(this.add.text(-pw / 2 + 16, -ph / 2 + 72, `⭐ ${tier.name} M${mastery}: +${bonuses.damagePercent}% dmg · +${bonuses.healthPercent}% HP · -${bonuses.cooldownPercent.toFixed(1)}% CD`, {
        fontFamily: 'Inter, sans-serif', fontSize: '9px', color: `#${tier.color.toString(16).padStart(6, '0')}`,
      }));
    }

    // Abilities grid (left)
    const abY = -ph / 2 + 90;
    container.add(this.add.text(-pw / 2 + 16, abY - 12, 'Habilidades:', {
      fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#c9a44e', fontStyle: 'bold',
    }));
    def.abilities.slice(0, 8).forEach((ab, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const unlocked = progress?.unlockedAbilities.includes(ab.id) ?? false;
      container.add(this.add.text(-pw / 2 + 16 + col * 90, abY + row * 18, `${ab.icon} ${ab.name}`, {
        fontFamily: 'Inter, sans-serif', fontSize: '9px', color: unlocked ? '#d4d4d8' : '#333',
      }));
    });

    // Mastery skills (right)
    const gates = MASTERY_SKILL_GATES[classId];
    const mskX = pw / 2 - 200;
    container.add(this.add.text(mskX, abY - 12, 'Skills de Maestria:', {
      fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#c9a44e', fontStyle: 'bold',
    }));
    gates.forEach((gate, i) => {
      const ab = def.abilities.find(a => a.id === gate.abilityId);
      const isUnlocked = mastery >= gate.masteryRequired;
      const label = isUnlocked ? `${ab?.icon ?? '?'} ${ab?.name ?? ''}` : `🔒 M${gate.masteryRequired} — ${ab?.name ?? ''}`;
      container.add(this.add.text(mskX, abY + i * 18, label, {
        fontFamily: 'Inter, sans-serif', fontSize: '9px', color: isUnlocked ? '#2ecc71' : '#444',
      }));
    });

    // Selection hint
    if (!this.selectedClass) {
      container.add(this.add.text(pw / 2 - 16, ph / 2 - 16, 'Clique em uma classe para selecionar', {
        fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#555',
      }).setOrigin(1, 1));
    }
  }

  private startGame(): void {
    if (!this.selectedClass) return;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (this.gameMode === 'dungeon') {
        this.scene.start(SCENE_KEYS.dungeonMap, { classId: this.selectedClass });
      } else {
        this.scene.start(SCENE_KEYS.game, { classId: this.selectedClass });
      }
    });
  }
}
