import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { BootScene } from './scenes/boot-scene';
import { LoginScene } from './scenes/login-scene';
import { MainMenuScene } from './scenes/main-menu-scene';
import { ClassSelectScene } from './scenes/class-select-scene';
import { GameScene } from './scenes/game-scene';
import { HudScene } from './scenes/hud-scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0a0f',
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  scene: [BootScene, LoginScene, MainMenuScene, ClassSelectScene, GameScene, HudScene],
};

new Phaser.Game(config);
