import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT, API_BASE } from '../config';
import { ALL_CLASSES } from '../../shared/classes';
import type { ClassId, AbilityDef, PlayerProfile } from '../../shared/types';
import { CLASS_IDS, masteryBonuses, getMasteryTier } from '../../shared/types';
import { getStoredProfile, getStoredToken, storeAuth } from '../services/auth';

const BRANCH_COLORS: Record<string, number> = {
  core: 0xc9a44e, offensive: 0xe74c3c, utility: 0x2ecc71, advanced: 0x9b59b6,
};
const BRANCH_LABELS: Record<string, string> = {
  core: 'Core', offensive: 'Ofensivo', utility: 'Utilitário', advanced: 'Avançado',
};

const EQUIP_BAR_Y = GAME_HEIGHT - 70;
const NODE_SIZE = 44;

export class TalentTreeScene extends Phaser.Scene {
  private profile!: PlayerProfile | null;
  private selectedClass: ClassId = 'hunter';
  private tooltipContainer: Phaser.GameObjects.Container | null = null;
  private equipBarContainer!: Phaser.GameObjects.Container;
  private dragging: { abilityId: string; icon: Phaser.GameObjects.Text } | null = null;

  constructor() { super(SCENE_KEYS.talentTree); }

  init(data?: { profile?: PlayerProfile; selectedClass?: ClassId }): void {
    this.profile = data?.profile ?? getStoredProfile();
    if (data?.selectedClass) this.selectedClass = data.selectedClass;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x07070c);
    this.dragging = null;

    const bg = this.add.graphics();
    bg.fillStyle(0x0d0d1a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title + gold
    this.add.text(GAME_WIDTH / 2, 20, 'TALENTOS', {
      fontFamily: '"Cinzel", serif', fontSize: '20px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    const gold = this.profile?.gold ?? 0;
    this.add.text(GAME_WIDTH - 16, 20, `💰 ${gold}`, {
      fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#c9a44e',
    }).setOrigin(1, 0.5);

    // Class tabs
    this.createClassTabs();

    // Tree
    this.drawTree();

    // Equip bar
    this.drawEquipBar();

    // Back
    const back = this.add.text(50, 20, '← VOLTAR', {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#555',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.mainMenu, { profile: this.profile }));
    back.on('pointerover', () => back.setColor('#d4d4d8'));
    back.on('pointerout', () => back.setColor('#555'));

    // Drag listener
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragging) {
        this.dragging.icon.setPosition(p.x, p.y);
      }
    });
    this.input.on('pointerup', () => {
      if (this.dragging) {
        // Check if dropped on equip bar
        if (this.input.activePointer.y > EQUIP_BAR_Y - 30) {
          this.equipAbility(this.dragging.abilityId);
        }
        this.dragging.icon.destroy();
        this.dragging = null;
      }
    });

    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  private createClassTabs(): void {
    const tabW = 100, gap = 6;
    const totalW = CLASS_IDS.length * tabW + (CLASS_IDS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;

    CLASS_IDS.forEach((classId, i) => {
      const def = ALL_CLASSES[classId];
      const x = startX + i * (tabW + gap) + tabW / 2;
      const isSelected = classId === this.selectedClass;

      const tabBg = this.add.graphics();
      tabBg.fillStyle(isSelected ? def.color : 0x111118, isSelected ? 0.25 : 0.7);
      tabBg.fillRoundedRect(x - tabW / 2, 42, tabW, 26, 4);
      if (isSelected) {
        tabBg.lineStyle(1, def.color, 0.6);
        tabBg.strokeRoundedRect(x - tabW / 2, 42, tabW, 26, 4);
      }

      this.add.text(x, 55, def.name, {
        fontFamily: '"Cinzel", serif', fontSize: '11px',
        color: isSelected ? '#fff' : '#555', fontStyle: isSelected ? 'bold' : 'normal',
      }).setOrigin(0.5);

      this.add.zone(x, 55, tabW, 26).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
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

    const branchStartX = 50;
    const branchW = (GAME_WIDTH - branchStartX * 2) / 4;

    branches.forEach((branch, bIdx) => {
      const bx = branchStartX + bIdx * branchW + branchW / 2;
      const by = 85;
      const color = BRANCH_COLORS[branch];

      // Branch label
      this.add.text(bx, by, BRANCH_LABELS[branch], {
        fontFamily: 'Inter, sans-serif', fontSize: '10px',
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const branchAbilities = def.abilities.filter(a => a.branch === branch);

      branchAbilities.forEach((ab, aIdx) => {
        const ay = by + 30 + aIdx * (NODE_SIZE + 14);
        const isUnlocked = unlocked.has(ab.id);
        const isEquipped = equipped.has(ab.id);

        // Connection line
        if (aIdx > 0) {
          const lineG = this.add.graphics();
          lineG.lineStyle(1, color, isUnlocked ? 0.3 : 0.08);
          lineG.lineBetween(bx, ay - (NODE_SIZE + 14) + NODE_SIZE / 2 + 3, bx, ay - NODE_SIZE / 2 - 3);
        }

        // Node background (icon only)
        const nodeBg = this.add.graphics();
        nodeBg.fillStyle(isUnlocked ? color : 0x111118, isUnlocked ? 0.15 : 0.7);
        nodeBg.fillRoundedRect(bx - NODE_SIZE / 2, ay - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE, 8);

        // Border
        if (isEquipped) {
          nodeBg.lineStyle(2, 0xffd700, 0.8);
          nodeBg.strokeRoundedRect(bx - NODE_SIZE / 2, ay - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE, 8);
          // Outer glow
          nodeBg.lineStyle(1, 0xffd700, 0.2);
          nodeBg.strokeRoundedRect(bx - NODE_SIZE / 2 - 2, ay - NODE_SIZE / 2 - 2, NODE_SIZE + 4, NODE_SIZE + 4, 10);
        } else if (isUnlocked) {
          nodeBg.lineStyle(1, color, 0.5);
          nodeBg.strokeRoundedRect(bx - NODE_SIZE / 2, ay - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE, 8);
        } else {
          nodeBg.lineStyle(1, 0x222228, 0.5);
          nodeBg.strokeRoundedRect(bx - NODE_SIZE / 2, ay - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE, 8);
        }

        // Icon (centered, big)
        const icon = this.add.text(bx, ay, ab.icon, {
          fontSize: '22px',
        }).setOrigin(0.5);
        if (!isUnlocked) icon.setAlpha(0.35);

        // Lock indicator
        if (!isUnlocked) {
          this.add.text(bx + NODE_SIZE / 2 - 4, ay - NODE_SIZE / 2 + 4, '🔒', {
            fontSize: '10px',
          }).setOrigin(0.5);
        }

        // Tier dot (bottom-right)
        const tierColors = [0x2ecc71, 0xf39c12, 0xe74c3c];
        this.add.circle(bx + NODE_SIZE / 2 - 4, ay + NODE_SIZE / 2 - 4, 4, tierColors[ab.tier - 1], 0.6);

        // Interactive zone
        const hitZone = this.add.zone(bx, ay, NODE_SIZE, NODE_SIZE)
          .setInteractive({ useHandCursor: true, draggable: isUnlocked });

        hitZone.on('pointerover', () => {
          this.showTooltip(ab, bx, ay, isUnlocked, isEquipped);
          if (isUnlocked) {
            nodeBg.clear();
            nodeBg.fillStyle(color, 0.3);
            nodeBg.fillRoundedRect(bx - NODE_SIZE / 2, ay - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE, 8);
            nodeBg.lineStyle(1, 0xffffff, 0.3);
            nodeBg.strokeRoundedRect(bx - NODE_SIZE / 2, ay - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE, 8);
          }
        });
        hitZone.on('pointerout', () => {
          this.hideTooltip();
          // Redraw is handled by scene restart after equip
        });
        hitZone.on('pointerdown', () => this.onNodeClick(ab, isUnlocked, isEquipped));

        // Drag start for unlocked abilities
        if (isUnlocked) {
          hitZone.on('dragstart', () => {
            const dragIcon = this.add.text(this.input.activePointer.x, this.input.activePointer.y, ab.icon, {
              fontSize: '28px',
            }).setOrigin(0.5).setDepth(999).setAlpha(0.8);
            this.dragging = { abilityId: ab.id, icon: dragIcon };
          });
        }
      });
    });

    // Mastery info (above equip bar)
    const mastery = progress?.mastery ?? 0;
    const tier = getMasteryTier(mastery);
    if (mastery > 0) {
      const bonus = masteryBonuses(mastery);
      this.add.text(GAME_WIDTH / 2, EQUIP_BAR_Y - 25, `⭐ ${tier.name} M${mastery} · +${bonus.damagePercent}% dmg · +${bonus.healthPercent}% HP · -${bonus.cooldownPercent.toFixed(1)}% CD`, {
        fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#555',
      }).setOrigin(0.5);
    }
  }

  private drawEquipBar(): void {
    this.equipBarContainer = this.add.container(0, 0).setDepth(50);
    const progress = this.profile?.classProgress[this.selectedClass];
    const equipped = progress?.equippedAbilities ?? [];
    const def = ALL_CLASSES[this.selectedClass];

    // Bar background
    const barW = 340, barH = 56;
    const barX = GAME_WIDTH / 2 - barW / 2, barY = EQUIP_BAR_Y;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x0a0a0f, 0.9);
    barBg.fillRoundedRect(barX, barY, barW, barH, 8);
    barBg.lineStyle(1, 0xc9a44e, 0.15);
    barBg.strokeRoundedRect(barX, barY, barW, barH, 8);
    this.equipBarContainer.add(barBg);

    // Label
    const buildLabel = this.add.text(barX - 4, barY + barH / 2, 'BUILD', {
      fontFamily: '"Cinzel", serif', fontSize: '9px', color: '#555',
    }).setOrigin(0.5).setRotation(-Math.PI / 2);
    this.equipBarContainer.add(buildLabel);

    // 5 slots
    for (let i = 0; i < 5; i++) {
      const slotX = barX + 30 + i * 62;
      const slotY = barY + barH / 2;
      const slotSize = 44;

      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x111118, 0.8);
      slotBg.fillRoundedRect(slotX - slotSize / 2, slotY - slotSize / 2, slotSize, slotSize, 6);
      slotBg.lineStyle(1, 0x222228, 0.5);
      slotBg.strokeRoundedRect(slotX - slotSize / 2, slotY - slotSize / 2, slotSize, slotSize, 6);
      this.equipBarContainer.add(slotBg);

      // Key label
      this.equipBarContainer.add(this.add.text(slotX, slotY - slotSize / 2 - 6, `${i + 1}`, {
        fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#3a3a3a',
      }).setOrigin(0.5));

      if (i < equipped.length) {
        const abId = equipped[i];
        const abDef = def.abilities.find(a => a.id === abId);
        if (abDef) {
          const icon = this.add.text(slotX, slotY, abDef.icon, { fontSize: '20px' }).setOrigin(0.5);
          this.equipBarContainer.add(icon);

          // Click to unequip
          const hitZone = this.add.zone(slotX, slotY, slotSize, slotSize)
            .setInteractive({ useHandCursor: true });
          hitZone.on('pointerdown', () => this.unequipSlot(i));
          hitZone.on('pointerover', () => {
            this.showTooltip(abDef, slotX, slotY - slotSize / 2 - 10, true, true);
            slotBg.clear();
            slotBg.fillStyle(0x1e1e36, 0.9);
            slotBg.fillRoundedRect(slotX - slotSize / 2, slotY - slotSize / 2, slotSize, slotSize, 6);
            slotBg.lineStyle(1, 0xe74c3c, 0.5);
            slotBg.strokeRoundedRect(slotX - slotSize / 2, slotY - slotSize / 2, slotSize, slotSize, 6);
          });
          hitZone.on('pointerout', () => this.hideTooltip());
          this.equipBarContainer.add(hitZone);
        }
      } else {
        // Empty slot hint
        this.equipBarContainer.add(this.add.text(slotX, slotY, '+', {
          fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#222',
        }).setOrigin(0.5));
      }
    }
  }

  private async equipAbility(abilityId: string): Promise<void> {
    if (!this.profile) return;
    const progress = this.profile.classProgress[this.selectedClass];
    if (progress.equippedAbilities.includes(abilityId)) return;
    if (progress.equippedAbilities.length >= 5) {
      this.showFeedback('Máx 5! Desequipe uma primeiro.', '#f39c12');
      return;
    }
    const newEquipped = [...progress.equippedAbilities, abilityId];
    await this.saveEquip(newEquipped);
  }

  private async unequipSlot(index: number): Promise<void> {
    if (!this.profile) return;
    const progress = this.profile.classProgress[this.selectedClass];
    const newEquipped = progress.equippedAbilities.filter((_, i) => i !== index);
    await this.saveEquip(newEquipped);
  }

  private async onNodeClick(ab: AbilityDef, isUnlocked: boolean, isEquipped: boolean): Promise<void> {
    const token = getStoredToken();
    if (!token || !this.profile) return;

    if (!isUnlocked) {
      try {
        const res = await fetch(`${API_BASE}/class/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ classId: this.selectedClass, abilityId: ab.id, tier: ab.tier }),
        });
        const data = await res.json();
        if (!res.ok) { this.showFeedback(data.error || 'Erro', '#e74c3c'); return; }
        this.profile.gold = data.remainingGold;
        this.profile.classProgress[this.selectedClass].unlockedAbilities.push(ab.id);
        this.updateLocalProfile();
        this.showFeedback(`${ab.icon} ${ab.name} desbloqueada!`, '#2ecc71');
        this.scene.restart({ profile: this.profile, selectedClass: this.selectedClass });
      } catch { this.showFeedback('Erro de conexão', '#e74c3c'); }
    } else if (!isEquipped) {
      await this.equipAbility(ab.id);
    } else {
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
      if (!res.ok) { this.showFeedback(data.error || 'Erro', '#e74c3c'); return; }
      this.profile!.classProgress[this.selectedClass].equippedAbilities = abilityIds;
      this.updateLocalProfile();
      this.scene.restart({ profile: this.profile, selectedClass: this.selectedClass });
    } catch { this.showFeedback('Erro de conexão', '#e74c3c'); }
  }

  private updateLocalProfile(): void {
    if (!this.profile) return;
    const token = getStoredToken();
    if (token) storeAuth({ token, player: this.profile });
  }

  private showFeedback(text: string, color: string): void {
    const fb = this.add.text(GAME_WIDTH / 2, EQUIP_BAR_Y - 40, text, {
      fontFamily: '"Cinzel", serif', fontSize: '13px', color, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(300);
    this.tweens.add({ targets: fb, alpha: 0, y: fb.y - 25, duration: 1800, onComplete: () => fb.destroy() });
  }

  private showTooltip(ab: AbilityDef, x: number, y: number, isUnlocked: boolean, isEquipped: boolean): void {
    this.hideTooltip();

    // Clamp tooltip position to screen
    const tw = 240, th = 100;
    let tx = x, ty = y - th - 8;
    if (ty < 5) ty = y + NODE_SIZE / 2 + 8;
    if (tx - tw / 2 < 5) tx = tw / 2 + 5;
    if (tx + tw / 2 > GAME_WIDTH - 5) tx = GAME_WIDTH - tw / 2 - 5;

    const container = this.add.container(tx, ty).setDepth(400);
    this.tooltipContainer = container;

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0f, 0.95);
    bg.fillRoundedRect(-tw / 2, 0, tw, th, 6);
    bg.lineStyle(1, BRANCH_COLORS[ab.branch], 0.4);
    bg.strokeRoundedRect(-tw / 2, 0, tw, th, 6);
    container.add(bg);

    container.add(this.add.text(0, 8, `${ab.icon} ${ab.name}`, {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#d4d4d8', fontStyle: 'bold',
    }).setOrigin(0.5, 0));

    container.add(this.add.text(0, 26, ab.description, {
      fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#999',
      wordWrap: { width: tw - 20 }, align: 'center', lineSpacing: 2,
    }).setOrigin(0.5, 0));

    container.add(this.add.text(0, 68, `CD: ${ab.cooldownMs / 1000}s  ·  Custo: ${ab.manaCost}`, {
      fontFamily: 'Inter, sans-serif', fontSize: '8px', color: '#555',
    }).setOrigin(0.5, 0));

    const action = !isUnlocked
      ? `🔓 Click para desbloquear (${({1:100,2:250,3:500} as any)[ab.tier]}g)`
      : isEquipped ? '❌ Click para desequipar' : '✅ Click para equipar · Arraste para a barra';
    container.add(this.add.text(0, th - 6, action, {
      fontFamily: 'Inter, sans-serif', fontSize: '8px', color: '#c9a44e',
    }).setOrigin(0.5, 1));
  }

  private hideTooltip(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy();
      this.tooltipContainer = null;
    }
  }
}
