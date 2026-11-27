import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { clearAuth } from '../services/auth';
import type { PlayerProfile } from '../../shared/types';

export class MainMenuScene extends Phaser.Scene {
  private profile!: PlayerProfile;

  constructor() {
    super(SCENE_KEYS.mainMenu);
  }

  init(data: { profile: PlayerProfile }): void {
    this.profile = data.profile;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.bgLight, PALETTE.bgLight, PALETTE.bg, PALETTE.bg, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 80, 'DD&D', {
      fontFamily: '"Cinzel", serif',
      fontSize: '48px',
      color: '#c9a44e',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Welcome
    this.add.text(GAME_WIDTH / 2, 130, `Bem-vindo, ${this.profile.displayName}`, {
      fontFamily: '"Cinzel", serif',
      fontSize: '18px',
      color: '#d4d4d8',
    }).setOrigin(0.5);

    // Level + gold display
    this.add.text(GAME_WIDTH / 2, 155, `Nível ${this.profile.level}  ·  🪙 ${this.profile.gold}`, {
      fontFamily: '"Cinzel", serif',
      fontSize: '14px',
      color: '#71717a',
    }).setOrigin(0.5);

    // Menu buttons
    const buttons = [
      { label: 'ARENA', callback: () => this.scene.start(SCENE_KEYS.classSelect, { profile: this.profile, gameMode: 'arena' }) },
      { label: 'DUNGEON', callback: () => this.scene.start(SCENE_KEYS.classSelect, { profile: this.profile, gameMode: 'dungeon' }) },
      { label: 'TALENTOS', callback: () => this.scene.start(SCENE_KEYS.talentTree, { profile: this.profile }) },
      { label: 'GUILDA', callback: () => this.scene.start(SCENE_KEYS.guild, { profile: this.profile }) },
      { label: 'SAIR', callback: () => { clearAuth(); this.scene.start(SCENE_KEYS.login); } },
    ];

    const startY = 220;
    const gap = 60;
    buttons.forEach((btn, i) => {
      const y = startY + i * gap;
      const bg = this.add.graphics();
      bg.fillStyle(PALETTE.panel, 0.8);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 140, y - 20, 280, 44, 6);
      bg.lineStyle(1, PALETTE.gold, 0.3);
      bg.strokeRoundedRect(GAME_WIDTH / 2 - 140, y - 20, 280, 44, 6);

      const text = this.add.text(GAME_WIDTH / 2, y, btn.label, {
        fontFamily: '"Cinzel", serif',
        fontSize: '20px',
        color: '#c9a44e',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const hitArea = this.add.zone(GAME_WIDTH / 2, y, 280, 44).setInteractive({ useHandCursor: true });
      hitArea.on('pointerover', () => { text.setColor('#f5e6a3'); bg.clear(); bg.fillStyle(PALETTE.panelEdge, 0.9); bg.fillRoundedRect(GAME_WIDTH / 2 - 140, y - 20, 280, 44, 6); bg.lineStyle(1, PALETTE.gold, 0.6); bg.strokeRoundedRect(GAME_WIDTH / 2 - 140, y - 20, 280, 44, 6); });
      hitArea.on('pointerout', () => { text.setColor('#c9a44e'); bg.clear(); bg.fillStyle(PALETTE.panel, 0.8); bg.fillRoundedRect(GAME_WIDTH / 2 - 140, y - 20, 280, 44, 6); bg.lineStyle(1, PALETTE.gold, 0.3); bg.strokeRoundedRect(GAME_WIDTH / 2 - 140, y - 20, 280, 44, 6); });
      hitArea.on('pointerdown', btn.callback);
    });

    // Footer
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'DD&D v0.1.0 — Early Development', {
      fontFamily: '"Cinzel", serif',
      fontSize: '11px',
      color: '#3f3f46',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
