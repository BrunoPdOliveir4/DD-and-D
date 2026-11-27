import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { clearAuth } from '../services/auth';
import type { PlayerProfile } from '../../shared/types';
import { levelFromXp } from '../../shared/types';

export class MainMenuScene extends Phaser.Scene {
  private profile!: PlayerProfile;

  constructor() {
    super(SCENE_KEYS.mainMenu);
  }

  init(data: { profile: PlayerProfile }): void {
    this.profile = data.profile;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x07070c);

    const bg = this.add.graphics();
    bg.fillStyle(0x0d0d1a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative rune circles
    const deco = this.add.graphics().setAlpha(0.03);
    deco.lineStyle(1, 0xc9a44e);
    deco.strokeCircle(GAME_WIDTH / 2, 300, 200);
    deco.strokeCircle(GAME_WIDTH / 2, 300, 260);
    deco.strokeCircle(GAME_WIDTH / 2, 300, 320);
    this.tweens.add({ targets: deco, alpha: 0.06, duration: 2000, yoyo: true, repeat: -1 });

    // Title
    this.add.text(GAME_WIDTH / 2, 70, 'DD&D', {
      fontFamily: '"Cinzel", serif', fontSize: '52px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 115, 'DYNAMIC DUNGEONS & DRAGONS', {
      fontFamily: '"Cinzel", serif', fontSize: '11px', color: '#555',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Profile line
    if (this.profile) {
      const globalLevel = levelFromXp(this.profile.xp);
      this.add.text(GAME_WIDTH / 2, 148, `${this.profile.displayName}  ·  Nv ${globalLevel.level}  ·  💰 ${this.profile.gold}`, {
        fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#71717a',
      }).setOrigin(0.5);
    }

    // Separator
    const sep = this.add.graphics();
    sep.lineStyle(1, 0xc9a44e, 0.12);
    sep.lineBetween(GAME_WIDTH / 2 - 140, 170, GAME_WIDTH / 2 + 140, 170);

    // Menu buttons
    const buttons = [
      { label: 'ARENA', desc: 'Ondas infinitas de combate', callback: () => this.scene.start(SCENE_KEYS.classSelect, { profile: this.profile, gameMode: 'arena' }) },
      { label: 'DUNGEON', desc: 'Salas procedurais com boss', callback: () => this.scene.start(SCENE_KEYS.classSelect, { profile: this.profile, gameMode: 'dungeon' }) },
      { label: 'TALENTOS', desc: 'Desbloquear e equipar skills', callback: () => this.scene.start(SCENE_KEYS.talentTree, { profile: this.profile }) },
      { label: 'GUILDA', desc: 'Criar ou entrar em uma guilda', callback: () => this.scene.start(SCENE_KEYS.guild, { profile: this.profile }) },
      { label: 'SAIR', desc: '', callback: () => { clearAuth(); this.scene.start(SCENE_KEYS.login); } },
    ];

    const startY = 200;
    const gap = 56;
    buttons.forEach((btn, i) => {
      const y = startY + i * gap;
      const container = this.add.container(GAME_WIDTH / 2, y);

      const bgG = this.add.graphics();
      bgG.fillStyle(PALETTE.panel, 0.6);
      bgG.fillRoundedRect(-150, -22, 300, 44, 6);
      bgG.lineStyle(1, PALETTE.gold, 0.08);
      bgG.strokeRoundedRect(-150, -22, 300, 44, 6);
      container.add(bgG);

      const text = this.add.text(0, btn.desc ? -5 : 0, btn.label, {
        fontFamily: '"Cinzel", serif', fontSize: '17px', color: '#c9a44e', fontStyle: 'bold',
        letterSpacing: 2,
      }).setOrigin(0.5);
      container.add(text);

      if (btn.desc) {
        const desc = this.add.text(0, 12, btn.desc, {
          fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#555',
        }).setOrigin(0.5);
        container.add(desc);
      }

      const hitArea = this.add.zone(0, 0, 300, 44).setInteractive({ useHandCursor: true });
      container.add(hitArea);
      hitArea.on('pointerover', () => {
        this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 80 });
        bgG.clear();
        bgG.fillStyle(PALETTE.panelEdge, 0.7);
        bgG.fillRoundedRect(-150, -22, 300, 44, 6);
        bgG.lineStyle(1, PALETTE.gold, 0.25);
        bgG.strokeRoundedRect(-150, -22, 300, 44, 6);
        text.setColor('#f5e6a3');
      });
      hitArea.on('pointerout', () => {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
        bgG.clear();
        bgG.fillStyle(PALETTE.panel, 0.6);
        bgG.fillRoundedRect(-150, -22, 300, 44, 6);
        bgG.lineStyle(1, PALETTE.gold, 0.08);
        bgG.strokeRoundedRect(-150, -22, 300, 44, 6);
        text.setColor('#c9a44e');
      });
      hitArea.on('pointerdown', btn.callback);
    });

    // Footer
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'DD&D v0.2.0 — Early Development', {
      fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#2a2a2e',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
