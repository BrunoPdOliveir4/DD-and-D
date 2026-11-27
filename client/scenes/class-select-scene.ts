import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { ALL_CLASSES } from '../../shared/classes';
import type { ClassId, ClassDef, PlayerProfile } from '../../shared/types';
import { CLASS_IDS, masteryBonuses, getMasteryTier, levelFromXp, MASTERY_SKILL_GATES } from '../../shared/types';
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

    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.bgLight, PALETTE.bgLight, PALETTE.bg, PALETTE.bg, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // ── Player profile panel (top-left) ──
    this.drawProfilePanel();

    // Title
    this.add.text(GAME_WIDTH / 2, 30, `ESCOLHA SUA CLASSE — ${this.gameMode === 'dungeon' ? 'DUNGEON' : 'ARENA'}`, {
      fontFamily: '"Cinzel", serif', fontSize: '22px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Class cards (horizontal)
    const cardW = 180, cardH = 210, gap = 16;
    const totalW = CLASS_IDS.length * cardW + (CLASS_IDS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;

    CLASS_IDS.forEach((classId, i) => {
      const def = ALL_CLASSES[classId];
      const progress = this.profile?.classProgress[classId];
      const mastery = progress?.mastery ?? 0;
      const tier = getMasteryTier(mastery);
      const x = startX + i * (cardW + gap) + cardW / 2;
      const y = 190;

      const container = this.add.container(x, y);

      // Card background
      const cardBg = this.add.graphics();
      cardBg.fillStyle(PALETTE.panel, 0.9);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);

      // Mastery-tier border (styled by tier)
      if (tier.borderStyle !== 'none') {
        const borderWidth = tier.borderStyle === 'grandmaster' ? 3 : tier.borderStyle === 'master' ? 3 : 2;
        cardBg.lineStyle(borderWidth, tier.color, 0.9);
        cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);

        // Double border for diamond+
        if (['diamond', 'master', 'grandmaster'].includes(tier.borderStyle)) {
          cardBg.lineStyle(1, tier.color, 0.3);
          cardBg.strokeRoundedRect(-cardW / 2 - 3, -cardH / 2 - 3, cardW + 6, cardH + 6, 10);
        }
        // Glow for master+
        if (['master', 'grandmaster'].includes(tier.borderStyle)) {
          cardBg.lineStyle(1, tier.color, 0.15);
          cardBg.strokeRoundedRect(-cardW / 2 - 6, -cardH / 2 - 6, cardW + 12, cardH + 12, 12);
        }
      } else {
        cardBg.lineStyle(1, def.color, 0.3);
        cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
      }
      container.add(cardBg);

      // Top stripe (class color)
      const stripe = this.add.graphics();
      stripe.fillStyle(def.color, 0.8);
      stripe.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, 5, { tl: 8, tr: 8, bl: 0, br: 0 });
      container.add(stripe);

      // Class circle with mastery tier border
      const circle = this.add.circle(0, -45, 26, def.color, 0.25);
      circle.setStrokeStyle(tier.borderStyle !== 'none' ? 2 : 1, tier.borderStyle !== 'none' ? tier.color : def.color, 0.8);
      container.add(circle);

      // Class initial letter
      container.add(this.add.text(0, -45, def.name[0], {
        fontFamily: '"Cinzel", serif', fontSize: '22px', color: '#d4d4d8', fontStyle: 'bold',
      }).setOrigin(0.5));

      // Class name
      container.add(this.add.text(0, -10, def.name, {
        fontFamily: '"Cinzel", serif', fontSize: '15px', color: '#d4d4d8', fontStyle: 'bold',
      }).setOrigin(0.5));

      // Tagline
      container.add(this.add.text(0, 10, def.tagline, {
        fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#71717a',
        wordWrap: { width: cardW - 20 }, align: 'center',
      }).setOrigin(0.5));

      // Mastery tier badge
      const tierLabel = tier.borderStyle !== 'none' ? `${tier.name} · M${mastery}` : `Maestria ${mastery}`;
      const tierColor = tier.borderStyle !== 'none' ? `#${tier.color.toString(16).padStart(6, '0')}` : '#555';
      container.add(this.add.text(0, 38, tierLabel, {
        fontFamily: '"Cinzel", serif', fontSize: '10px', color: tierColor, fontStyle: 'bold',
      }).setOrigin(0.5));

      // Mastery skills unlocked count
      const gates = MASTERY_SKILL_GATES[classId];
      const masterySkillsUnlocked = gates.filter(g => mastery >= g.masteryRequired).length;
      container.add(this.add.text(0, 54, `🔓 ${masterySkillsUnlocked}/${gates.length} skills de maestria`, {
        fontFamily: '"Cinzel", serif', fontSize: '8px', color: '#71717a',
      }).setOrigin(0.5));

      // Equipped count
      const eqCount = progress?.equippedAbilities.length ?? 0;
      container.add(this.add.text(0, 68, `⚔️ ${eqCount}/5 equipadas`, {
        fontFamily: '"Cinzel", serif', fontSize: '8px', color: '#71717a',
      }).setOrigin(0.5));

      // Pulsing glow for grandmaster
      if (tier.borderStyle === 'grandmaster') {
        const glow = this.add.circle(0, 0, cardW / 2 + 8, tier.color, 0.08);
        container.addAt(glow, 0);
        this.tweens.add({ targets: glow, alpha: 0.02, duration: 1200, yoyo: true, repeat: -1 });
      }

      // Interactive
      const hitZone = this.add.zone(0, 0, cardW, cardH).setInteractive({ useHandCursor: true });
      container.add(hitZone);
      hitZone.on('pointerdown', () => {
        this.selectedIndex = i;
        this.selectClass(classId);
      });
      hitZone.on('pointerover', () => {
        this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
        this.showDetails(classId);
      });
      hitZone.on('pointerout', () => {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      });

      this.items.push({ classId, def, container });
    });

    // Details panel
    this.showDetails('hunter');

    // Back button
    const back = this.add.text(60, GAME_HEIGHT - 30, '← VOLTAR', {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#71717a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.mainMenu, { profile: this.profile }));
    back.on('pointerover', () => back.setColor('#d4d4d8'));
    back.on('pointerout', () => back.setColor('#71717a'));

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ── Player profile panel ──
  private drawProfilePanel(): void {
    if (!this.profile) return;

    const globalLevel = levelFromXp(this.profile.xp);
    const pw = 220, ph = 70;
    const px = GAME_WIDTH - pw - 15, py = 55;

    const g = this.add.graphics();
    g.fillStyle(PALETTE.panel, 0.85);
    g.fillRoundedRect(px, py, pw, ph, 6);
    g.lineStyle(1, PALETTE.gold, 0.3);
    g.strokeRoundedRect(px, py, pw, ph, 6);

    // Player name + level
    this.add.text(px + 10, py + 10, this.profile.displayName, {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#d4d4d8', fontStyle: 'bold',
    });
    this.add.text(px + pw - 10, py + 10, `Nv ${globalLevel.level}`, {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#c9a44e', fontStyle: 'bold',
    }).setOrigin(1, 0);

    // XP bar
    const barW = pw - 20, barH = 6;
    const barX = px + 10, barY = py + 32;
    g.fillStyle(0x333333);
    g.fillRoundedRect(barX, barY, barW, barH, 3);
    const frac = globalLevel.nextLevelXp > 0 ? globalLevel.currentLevelXp / globalLevel.nextLevelXp : 0;
    g.fillStyle(PALETTE.gold);
    g.fillRoundedRect(barX, barY, barW * Math.min(1, frac), barH, 3);

    this.add.text(px + 10, barY + 10, `${globalLevel.currentLevelXp} / ${globalLevel.nextLevelXp} XP`, {
      fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#71717a',
    });
    this.add.text(px + pw - 10, barY + 10, `💰 ${this.profile.gold}`, {
      fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#c9a44e',
    }).setOrigin(1, 0);
  }

  // ── Details panel ──
  private showDetails(classId: ClassId): void {
    if (this.detailsContainer) this.detailsContainer.destroy();

    const def = ALL_CLASSES[classId];
    const progress = this.profile?.classProgress[classId];
    const mastery = progress?.mastery ?? 0;
    const tier = getMasteryTier(mastery);
    const bonuses = masteryBonuses(mastery);
    const container = this.add.container(GAME_WIDTH / 2, 435);
    this.detailsContainer = container;

    const pw = 740, ph = 260;
    const panel = this.add.graphics();
    panel.fillStyle(PALETTE.panel, 0.85);
    panel.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 8);
    panel.lineStyle(1, tier.borderStyle !== 'none' ? tier.color : def.color, 0.4);
    panel.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 8);
    container.add(panel);

    // Class name + passive
    container.add(this.add.text(-pw / 2 + 20, -ph / 2 + 12, `${def.name} — ${def.passive.name}`, {
      fontFamily: '"Cinzel", serif', fontSize: '16px', color: '#d4d4d8', fontStyle: 'bold',
    }));
    container.add(this.add.text(-pw / 2 + 20, -ph / 2 + 34, def.passive.description, {
      fontFamily: '"Cinzel", serif', fontSize: '11px', color: '#71717a', wordWrap: { width: pw / 2 - 30 },
    }));

    // Stats
    const stats = def.baseStats;
    const statsText = `❤️ ${stats.maxHealth}  ⚔️ ${stats.attackDamage}  🛡️ ${stats.defense}  💨 ${stats.speed}  🏹 ${stats.attackRange}`;
    container.add(this.add.text(-pw / 2 + 20, -ph / 2 + 60, statsText, {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#d4d4d8',
    }));

    // Mastery bonuses
    if (mastery > 0) {
      container.add(this.add.text(-pw / 2 + 20, -ph / 2 + 80, `⭐ ${tier.name} (M${mastery}): +${bonuses.damagePercent}% dmg, +${bonuses.healthPercent}% HP, -${bonuses.cooldownPercent.toFixed(1)}% CD`, {
        fontFamily: '"Cinzel", serif', fontSize: '10px', color: `#${tier.color.toString(16).padStart(6, '0')}`,
      }));
    }

    // ── Left column: starter abilities ──
    const abY = -ph / 2 + 100;
    container.add(this.add.text(-pw / 2 + 20, abY - 15, 'Habilidades:', {
      fontFamily: '"Cinzel", serif', fontSize: '10px', color: '#c9a44e', fontStyle: 'bold',
    }));

    def.abilities.slice(0, 8).forEach((ab, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const ax = -pw / 2 + 20 + col * 90;
      const ay = abY + row * 22;
      const unlocked = progress?.unlockedAbilities.includes(ab.id) ?? false;
      container.add(this.add.text(ax, ay, `${ab.icon} ${ab.name}`, {
        fontFamily: '"Cinzel", serif', fontSize: '9px', color: unlocked ? '#d4d4d8' : '#444',
      }));
    });

    // ── Right column: mastery skills ──
    const gates = MASTERY_SKILL_GATES[classId];
    const mskX = pw / 2 - 220;
    container.add(this.add.text(mskX, abY - 15, 'Skills de Maestria:', {
      fontFamily: '"Cinzel", serif', fontSize: '10px', color: '#c9a44e', fontStyle: 'bold',
    }));

    gates.forEach((gate, i) => {
      const ab = def.abilities.find(a => a.id === gate.abilityId);
      const isUnlocked = mastery >= gate.masteryRequired;
      const icon = ab?.icon ?? '?';
      const name = ab?.name ?? gate.abilityId;
      const label = isUnlocked ? `${icon} ${name}` : `🔒 M${gate.masteryRequired} — ${name}`;
      container.add(this.add.text(mskX, abY + i * 20, label, {
        fontFamily: '"Cinzel", serif', fontSize: '10px',
        color: isUnlocked ? '#2ecc71' : '#555',
      }));
    });

    // Play button
    const playBtn = this.add.text(pw / 2 - 20, ph / 2 - 20, '▶ JOGAR', {
      fontFamily: '"Cinzel", serif', fontSize: '18px', color: '#c9a44e', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    playBtn.on('pointerdown', () => this.selectClass(classId));
    playBtn.on('pointerover', () => playBtn.setColor('#f5e6a3'));
    playBtn.on('pointerout', () => playBtn.setColor('#c9a44e'));
    container.add(playBtn);
  }

  private selectClass(classId: ClassId): void {
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
