import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { getStoredToken, getStoredProfile } from '../services/auth';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  create(): void {
    // Hide loading screen
    const el = document.getElementById('loading-screen');
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }

    // Check if already logged in
    const token = getStoredToken();
    const profile = getStoredProfile();

    if (token && profile) {
      if (!profile.tutorialDone) {
        this.scene.start(SCENE_KEYS.tutorial);
      } else {
        this.scene.start(SCENE_KEYS.mainMenu, { profile });
      }
    } else {
      this.scene.start(SCENE_KEYS.login);
    }
  }
}
