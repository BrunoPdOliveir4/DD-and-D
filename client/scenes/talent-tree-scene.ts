import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { ALL_CLASSES } from '../../shared/classes';
import type { ClassId, AbilityDef, PlayerProfile } from '../../shared/types';
import { CLASS_IDS, masteryBonuses } from '../../shared/types';
import { getStoredProfile } from '../services/auth';

const BRANCH_COLORS: Record<string, number> = {
  core: 0xc9a44e,
  offensive: 0xe74c3c,
  utility: 0x2ecc71,
  advanced: 0x9b59b6,
};

const BRANCH_LABELS: Record<string, string> = {
  core: '⚙️ Core',
  offensive: '⚔️ Ofensivo',
  utility: '🛡️ Utilitário',
  advanced: '💎 Avançado',
};

export class TalentTreeScene extends Phaser.Scene {
  private profile!: PlayerProfile | null;
  private selectedClass: ClassId = 'hunter';
  private tooltipContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super(SCENE_KEYS.talentTree);
  }

  init(data?: { profile?: PlayerProfile }): void {
    this.profile = data?.profile ?? getStoredProfile();
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);

    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.bgLight, PALETTE.bgLight, PALETTE.bg, PALETTE.bg, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 25, 'ÁRVORE DE TALENTOS', {
      fontFamily: '"Cinzel", serif', fontSize: '24px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Class tabs
    this.createClassTabs();

    // Draw tree for selected class
    this.drawTree();

    // Back button
    const back = this.add.text(60, GAME_HEIGHT - 30, '← VOLTAR', {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#71717a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.mainMenu, { profile: this.profile }));
    back.on('pointerover', () => back.setColor('#d4d4d8'));
    back.on('pointerout', () => back.setColor('#71717a'));

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createClassTabs(): void {
    const tabW = 120, gap = 8;
    const totalW = CLASS_IDS.length * tabW + (CLASS_IDS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;

    CLASS_IDS.forEach((classId, i) => {
      const def = ALL_CLASSES[classId];
      const x = startX + i * (tabW + gap) + tabW / 2;
      const isSelected = classId === this.selectedClass;

      const tabBg = this.add.graphics();
      tabBg.fillStyle(isSelected ? def.color : PALETTE.panel, isSelected ? 0.3 : 0.7);
      tabBg.fillRoundedRect(x - tabW / 2, 52, tabW, 32, 4);
      if (isSelected) {
        tabBg.lineStyle(1, def.color, 0.8);
        tabBg.strokeRoundedRect(x - tabW / 2, 52, tabW, 32, 4);
      }

      const label = this.add.text(x, 68, def.name, {
        fontFamily: '"Cinzel", serif', fontSize: '13px',
        color: isSelected ? '#ffffff' : '#71717a', fontStyle: isSelected ? 'bold' : 'normal',
      }).setOrigin(0.5);

      const hitZone = this.add.zone(x, 68, tabW, 32).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => {
        this.selectedClass = classId;
        this.scene.restart({ profile: this.profile });
      });
    });
  }

  private drawTree(): void {
    const def = ALL_CLASSES[this.selectedClass];
    const progress = this.profile?.classProgress[this.selectedClass];
    const unlocked = new Set(progress?.unlockedAbilities ?? []);
    const equipped = new Set(progress?.equippedAbilities ?? []);
    const branches = ['core', 'offensive', 'utility', 'advanced'] as const;

    const branchStartX = 60;
    const branchW = (GAME_WIDTH - branchStartX * 2) / 4;

    branches.forEach((branch, bIdx) => {
      const bx = branchStartX + bIdx * branchW + branchW / 2;
      const by = 110;
      const color = BRANCH_COLORS[branch];

      // Branch header
      this.add.text(bx, by, BRANCH_LABELS[branch], {
        fontFamily: '"Cinzel", serif', fontSize: '13px', color: `#${color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Abilities in this branch
      const branchAbilities = def.abilities.filter(a => a.branch === branch);

      branchAbilities.forEach((ab, aIdx) => {
        const ay = by + 35 + aIdx * 72;
        const isUnlocked = unlocked.has(ab.id);
        const isEquipped = equipped.has(ab.id);
        const nodeSize = 50;

        // Connection line to previous
        if (aIdx > 0) {
          const lineG = this.add.graphics();
          lineG.lineStyle(2, color, isUnlocked ? 0.4 : 0.1);
          lineG.lineBetween(bx, ay - 72 + nodeSize / 2 + 5, bx, ay - nodeSize / 2 - 5);
        }

        // Node background
        const nodeBg = this.add.graphics();
        nodeBg.fillStyle(isUnlocked ? color : PALETTE.panel, isUnlocked ? 0.2 : 0.6);
        nodeBg.fillRoundedRect(bx - nodeSize / 2 - 40, ay - nodeSize / 2, nodeSize + 80, nodeSize, 6);
        nodeBg.lineStyle(1, isEquipped ? 0xffd700 : (isUnlocked ? color : 0x333333), isEquipped ? 0.9 : 0.4);
        nodeBg.strokeRoundedRect(bx - nodeSize / 2 - 40, ay - nodeSize / 2, nodeSize + 80, nodeSize, 6);

        // Equipped indicator
        if (isEquipped) {
          nodeBg.lineStyle(2, 0xffd700, 0.6);
          nodeBg.strokeRoundedRect(bx - nodeSize / 2 - 42, ay - nodeSize / 2 - 2, nodeSize + 84, nodeSize + 4, 8);
        }

        // Tier badge
        const tierColors = [0x2ecc71, 0xf39c12, 0xe74c3c];
        const tierBadge = this.add.circle(bx + nodeSize / 2 + 30, ay - nodeSize / 2 + 8, 8, tierColors[ab.tier - 1], 0.6);

        // Icon + name
        const icon = this.add.text(bx - 35, ay - 5, ab.icon, { fontSize: '20px' }).setOrigin(0.5);
        const name = this.add.text(bx + 5, ay - 10, ab.name, {
          fontFamily: '"Cinzel", serif', fontSize: '11px',
          color: isUnlocked ? '#d4d4d8' : '#555555', fontStyle: isUnlocked ? 'bold' : 'normal',
        });

        // Lock / tier indicator
        if (!isUnlocked) {
          const lockText = `Tier ${ab.tier}`;
          this.add.text(bx + 5, ay + 8, lockText, {
            fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#444',
          });
        } else {
          const statusText = isEquipped ? '✅ Equipada' : 'Desbloqueada';
          this.add.text(bx + 5, ay + 8, statusText, {
            fontFamily: '"Cinzel", serif', fontSize: '9px', color: isEquipped ? '#c9a44e' : '#71717a',
          });
        }

        // Tooltip on hover
        const hitZone = this.add.zone(bx, ay, nodeSize + 80, nodeSize).setInteractive({ useHandCursor: true });
        hitZone.on('pointerover', () => this.showTooltip(ab, bx, ay + nodeSize / 2 + 10));
        hitZone.on('pointerout', () => this.hideTooltip());
      });
    });

    // Mastery info at bottom
    const mastery = progress?.mastery ?? 0;
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 65, `⭐ Maestria ${this.selectedClass}: ${mastery}`, {
      fontFamily: '"Cinzel", serif', fontSize: '16px', color: '#c9a44e', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (mastery > 0) {
      const bonus = masteryBonuses(mastery);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 45, `+${bonus.damagePercent}% dano  ·  +${bonus.healthPercent}% HP  ·  -${bonus.cooldownPercent.toFixed(1)}% CD  ·  +${bonus.goldBonus}% ouro`, {
        fontFamily: '"Cinzel", serif', fontSize: '11px', color: '#71717a',
      }).setOrigin(0.5);
    }
  }

  private showTooltip(ab: AbilityDef, x: number, y: number): void {
    this.hideTooltip();
    const container = this.add.container(x, y).setDepth(200);
    this.tooltipContainer = container;

    const tw = 220, th = 80;
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0f, 0.95);
    bg.fillRoundedRect(-tw / 2, 0, tw, th, 6);
    bg.lineStyle(1, BRANCH_COLORS[ab.branch], 0.5);
    bg.strokeRoundedRect(-tw / 2, 0, tw, th, 6);
    container.add(bg);

    container.add(this.add.text(0, 10, `${ab.icon} ${ab.name}`, {
      fontFamily: '"Cinzel", serif', fontSize: '13px', color: '#d4d4d8', fontStyle: 'bold',
    }).setOrigin(0.5, 0));

    container.add(this.add.text(0, 30, ab.description, {
      fontFamily: '"Cinzel", serif', fontSize: '10px', color: '#a0a0a0',
      wordWrap: { width: tw - 20 }, align: 'center',
    }).setOrigin(0.5, 0));

    container.add(this.add.text(0, th - 8, `CD: ${ab.cooldownMs / 1000}s  ·  Custo: ${ab.manaCost}`, {
      fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#71717a',
    }).setOrigin(0.5, 1));
  }

  private hideTooltip(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy();
      this.tooltipContainer = null;
    }
  }
}
