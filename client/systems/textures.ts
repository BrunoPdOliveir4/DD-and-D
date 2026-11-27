import Phaser from 'phaser';
import { TEX, PLAYER_RADIUS, ENEMY_TYPES, WORLD_WIDTH, WORLD_HEIGHT } from '../systems/constants';
import { ARROW_COLORS } from '../systems/quiver';

/** Generate all procedural textures for the game */
export function generateTextures(scene: Phaser.Scene): void {
  // Player circle (green)
  if (!scene.textures.exists(TEX.player)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x2ecc71);
    g.fillCircle(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_RADIUS);
    // Direction indicator
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(PLAYER_RADIUS + PLAYER_RADIUS * 0.5, PLAYER_RADIUS, 4);
    g.generateTexture(TEX.player, PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);
    g.destroy();
  }

  // Enemy textures
  for (const [key, def] of Object.entries(ENEMY_TYPES)) {
    const texKey = key === 'grunt' ? TEX.grunt : TEX.brute;
    if (!scene.textures.exists(texKey)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(def.color);
      g.fillCircle(def.radius, def.radius, def.radius);
      // Eye dots
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(def.radius - 5, def.radius - 4, 3);
      g.fillCircle(def.radius + 5, def.radius - 4, 3);
      g.generateTexture(texKey, def.radius * 2, def.radius * 2);
      g.destroy();
    }
  }

  // Arrow projectiles
  const arrowTypes: Array<{ key: string; color: number }> = [
    { key: TEX.arrowPoison, color: ARROW_COLORS.poison },
    { key: TEX.arrowStun, color: ARROW_COLORS.stun },
    { key: TEX.arrowLacerate, color: ARROW_COLORS.lacerate },
  ];
  for (const { key, color } of arrowTypes) {
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(color);
      g.fillRect(0, 0, 10, 4);
      // Arrow tip
      g.fillStyle(0xffffff, 0.6);
      g.fillTriangle(10, 0, 14, 2, 10, 4);
      g.generateTexture(key, 14, 4);
      g.destroy();
    }
  }

  // Floor tile
  if (!scene.textures.exists(TEX.tile)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const SIZE = 64;
    g.fillStyle(0x1a1a2e);
    g.fillRect(0, 0, SIZE, SIZE);
    g.lineStyle(1, 0x2a2a4a, 0.3);
    g.strokeRect(0, 0, SIZE, SIZE);
    // Subtle detail
    g.fillStyle(0x16162a, 0.5);
    g.fillRect(2, 2, 4, 4);
    g.fillRect(SIZE - 6, SIZE - 6, 4, 4);
    g.generateTexture(TEX.tile, SIZE, SIZE);
    g.destroy();
  }
}
