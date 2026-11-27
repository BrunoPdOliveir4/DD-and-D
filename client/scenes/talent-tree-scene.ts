import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT, API_BASE } from '../config';
import { ALL_CLASSES } from '../../shared/classes';
import type { ClassId, AbilityDef, PlayerProfile } from '../../shared/types';
import { CLASS_IDS, masteryBonuses } from '../../shared/types';
import { getStoredProfile, getStoredToken, storeAuth } from '../services/auth';

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
  private goldText!: Phaser.GameObjects.Text;
  private equippedCount!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.talentTree);
  }

  init(data?: { profile?: PlayerProfile; selectedClass?: ClassId }): void {
    this.profile = data?.profile ?? getStoredProfile();
    if (data?.selectedClass) this.selectedClass = data.selectedClass;
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

    // Gold display
    const gold = this.profile?.gold ?? 0;
    this.goldText = this.add.text(GAME_WIDTH - 20, 25, `💰 ${gold}`, {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#c9a44e',
    }).setOrigin(1, 0.5);

    // Equipped count
    const progress = this.profile?.classProgress[this.selectedClass];
    const eqCount = progress?.equippedAbilities.length ?? 0;
    this.equippedCount = this.add.text(GAME_WIDTH - 20, 45, `Equipadas: ${eqCount}/5`, {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#71717a',
    }).setOrigin(1, 0.5);

    // Class tabs
    this.createClassTabs();

    // Draw tree
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

      this.add.text(x, 68, def.name, {
        fontFamily: '"Cinzel", serif', fontSize: '13px',
        color: isSelected ? '#ffffff' : '#71717a', fontStyle: isSelected ? 'bold' : 'normal',
      }).setOrigin(0.5);

      const hitZone = this.add.zone(x, 68, tabW, 32).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => {
        this.selectedClass = classId;
        this.scene.restart({ profile: this.profile, selectedClass: classId });
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

      this.add.text(bx, by, BRANCH_LABELS[branch], {
        fontFamily: '"Cinzel", serif', fontSize: '13px', color: `#${color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const branchAbilities = def.abilities.filter(a => a.branch === branch);

      branchAbilities.forEach((ab, aIdx) => {
        const ay = by + 35 + aIdx * 72;
        const isUnlocked = unlocked.has(ab.id);
        const isEquipped = equipped.has(ab.id);
        const nodeSize = 50;

        // Connection line
        if (aIdx > 0) {
          const lineG = this.add.graphics();
          lineG.lineStyle(2, color, isUnlocked ? 0.4 : 0.1);
          lineG.lineBetween(bx, ay - 72 + nodeSize / 2 + 5, bx, ay - nodeSize / 2 - 5);
        }

        // Node bg
        const nodeBg = this.add.graphics();
        nodeBg.fillStyle(isUnlocked ? color : PALETTE.panel, isUnlocked ? 0.2 : 0.6);
        nodeBg.fillRoundedRect(bx - nodeSize / 2 - 40, ay - nodeSize / 2, nodeSize + 80, nodeSize, 6);
        nodeBg.lineStyle(1, isEquipped ? 0xffd700 : (isUnlocked ? color : 0x333333), isEquipped ? 0.9 : 0.4);
        nodeBg.strokeRoundedRect(bx - nodeSize / 2 - 40, ay - nodeSize / 2, nodeSize + 80, nodeSize, 6);

        if (isEquipped) {
          nodeBg.lineStyle(2, 0xffd700, 0.6);
          nodeBg.strokeRoundedRect(bx - nodeSize / 2 - 42, ay - nodeSize / 2 - 2, nodeSize + 84, nodeSize + 4, 8);
        }

        // Tier badge
        const tierColors = [0x2ecc71, 0xf39c12, 0xe74c3c];
        this.add.circle(bx + nodeSize / 2 + 30, ay - nodeSize / 2 + 8, 8, tierColors[ab.tier - 1], 0.6);

        // Icon + name
        this.add.text(bx - 35, ay - 5, ab.icon, { fontSize: '20px' }).setOrigin(0.5);
        this.add.text(bx + 5, ay - 10, ab.name, {
          fontFamily: '"Cinzel", serif', fontSize: '11px',
          color: isUnlocked ? '#d4d4d8' : '#555555', fontStyle: isUnlocked ? 'bold' : 'normal',
        });

        // Status text
        if (!isUnlocked) {
          const tierCosts: Record<number, number> = { 1: 100, 2: 250, 3: 500 };
          const cost = tierCosts[ab.tier] ?? 100;
          this.add.text(bx + 5, ay + 8, `🔒 ${cost}g · Tier ${ab.tier}`, {
            fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#666',
          });
        } else {
          const statusText = isEquipped ? '✅ Equipada' : '○ Click p/ equipar';
          this.add.text(bx + 5, ay + 8, statusText, {
            fontFamily: '"Cinzel", serif', fontSize: '9px', color: isEquipped ? '#c9a44e' : '#888',
          });
        }

        // Interactivity
        const hitZone = this.add.zone(bx, ay, nodeSize + 80, nodeSize).setInteractive({ useHandCursor: true });
        hitZone.on('pointerover', () => this.showTooltip(ab, bx, ay + nodeSize / 2 + 10, isUnlocked, isEquipped));
        hitZone.on('pointerout', () => this.hideTooltip());
        hitZone.on('pointerdown', () => this.onNodeClick(ab, isUnlocked, isEquipped));
      });
    });

    // Mastery
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

  private async onNodeClick(ab: AbilityDef, isUnlocked: boolean, isEquipped: boolean): Promise<void> {
    const token = getStoredToken();
    if (!token || !this.profile) return;

    if (!isUnlocked) {
      // Unlock ability
      try {
        const res = await fetch(`${API_BASE}/class/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ classId: this.selectedClass, abilityId: ab.id, tier: ab.tier }),
        });
        const data = await res.json();
        if (!res.ok) {
          this.showFeedback(data.error || 'Erro', '#e74c3c');
          return;
        }
        // Update local profile
        this.profile.gold = data.remainingGold;
        this.profile.classProgress[this.selectedClass].unlockedAbilities.push(ab.id);
        this.updateLocalProfile();
        this.showFeedback(`${ab.icon} ${ab.name} desbloqueada!`, '#2ecc71');
        this.scene.restart({ profile: this.profile, selectedClass: this.selectedClass });
      } catch {
        this.showFeedback('Erro de conexão', '#e74c3c');
      }
    } else if (!isEquipped) {
      // Equip ability
      const progress = this.profile.classProgress[this.selectedClass];
      if (progress.equippedAbilities.length >= 5) {
        this.showFeedback('Máximo 5 habilidades equipadas! Desequipe uma primeiro.', '#f39c12');
        return;
      }
      const newEquipped = [...progress.equippedAbilities, ab.id];
      await this.saveEquip(newEquipped);
    } else {
      // Unequip
      const progress = this.profile.classProgress[this.selectedClass];
      const newEquipped = progress.equippedAbilities.filter(id => id !== ab.id);
      await this.saveEquip(newEquipped);
    }
  }

  private async saveEquip(abilityIds: string[]): Promise<void> {
    const token = getStoredToken();
    if (!token || !this.profile) return;

    try {
      const res = await fetch(`${API_BASE}/class/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classId: this.selectedClass, abilityIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        this.showFeedback(data.error || 'Erro', '#e74c3c');
        return;
      }
      this.profile!.classProgress[this.selectedClass].equippedAbilities = abilityIds;
      this.updateLocalProfile();
      this.showFeedback(`Skills equipadas: ${abilityIds.length}/5`, '#c9a44e');
      this.scene.restart({ profile: this.profile, selectedClass: this.selectedClass });
    } catch {
      this.showFeedback('Erro de conexão', '#e74c3c');
    }
  }

  private updateLocalProfile(): void {
    if (!this.profile) return;
    const token = getStoredToken();
    if (token) storeAuth({ token, player: this.profile });
  }

  private showFeedback(text: string, color: string): void {
    const fb = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 90, text, {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(300);
    this.tweens.add({ targets: fb, alpha: 0, y: fb.y - 30, duration: 2000, onComplete: () => fb.destroy() });
  }

  private showTooltip(ab: AbilityDef, x: number, y: number, isUnlocked: boolean, isEquipped: boolean): void {
    this.hideTooltip();
    const container = this.add.container(x, y).setDepth(200);
    this.tooltipContainer = container;

    const tw = 240, th = 95;
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

    container.add(this.add.text(0, 68, `CD: ${ab.cooldownMs / 1000}s  ·  Custo: ${ab.manaCost}`, {
      fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#71717a',
    }).setOrigin(0.5, 0));

    // Action hint
    const action = !isUnlocked ? '🔓 Click para desbloquear'
      : isEquipped ? '❌ Click para desequipar'
      : '✅ Click para equipar';
    container.add(this.add.text(0, th - 5, action, {
      fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#c9a44e',
    }).setOrigin(0.5, 1));
  }

  private hideTooltip(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy();
      this.tooltipContainer = null;
    }
  }
}
