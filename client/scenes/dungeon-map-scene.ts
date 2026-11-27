import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import {
  generateDungeon, canEnterRoom, enterRoom, clearRoom,
  type DungeonMap, type DungeonRoom, type RoomType,
} from '../systems/dungeon';
import type { ClassId, PlayerProfile } from '../../shared/types';
import { getStoredProfile } from '../services/auth';

const ROOM_ICONS: Record<RoomType, string> = {
  spawn: '🏠',
  combat: '⚔️',
  elite: '💀',
  boss: '👹',
  treasure: '💰',
  rest: '🏕️',
};

const ROOM_COLORS: Record<RoomType, number> = {
  spawn: 0x2ecc71,
  combat: 0xe74c3c,
  elite: 0xf39c12,
  boss: 0x9b59b6,
  treasure: 0xc9a44e,
  rest: 0x3498db,
};

export class DungeonMapScene extends Phaser.Scene {
  private dungeon!: DungeonMap;
  private classId: ClassId = 'hunter';
  private profile!: PlayerProfile | null;
  private sessionGold = 0;
  private sessionXp = 0;
  private sessionKills = 0;

  constructor() {
    super(SCENE_KEYS.dungeonMap);
  }

  init(data?: {
    classId?: ClassId;
    dungeon?: DungeonMap;
    profile?: PlayerProfile;
    sessionGold?: number;
    sessionXp?: number;
    sessionKills?: number;
    clearedRoomId?: number;
  }): void {
    this.classId = data?.classId ?? 'hunter';
    this.profile = data?.profile ?? getStoredProfile();
    this.sessionGold = data?.sessionGold ?? 0;
    this.sessionXp = data?.sessionXp ?? 0;
    this.sessionKills = data?.sessionKills ?? 0;

    if (data?.dungeon) {
      this.dungeon = data.dungeon;
      if (data.clearedRoomId !== undefined) {
        this.dungeon = clearRoom(this.dungeon, data.clearedRoomId);
      }
    } else {
      this.dungeon = generateDungeon(1);
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);

    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.bgLight, PALETTE.bgLight, PALETTE.bg, PALETTE.bg, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 25, `DUNGEON — Andar ${this.dungeon.floor}`, {
      fontFamily: '"Cinzel", serif', fontSize: '22px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Session stats
    this.add.text(20, 15, `💰 ${this.sessionGold}  ⚔️ ${this.sessionKills}  ✨ ${this.sessionXp} XP`, {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#71717a',
    });

    // Draw connections first (behind rooms)
    this.drawConnections();

    // Draw rooms
    this.drawRooms();

    // Legend
    this.drawLegend();

    // Back button
    const back = this.add.text(60, GAME_HEIGHT - 30, '← ABANDONAR', {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#71717a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.mainMenu, { profile: this.profile }));
    back.on('pointerover', () => back.setColor('#e74c3c'));
    back.on('pointerout', () => back.setColor('#71717a'));

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private drawConnections(): void {
    const g = this.add.graphics();
    const rooms = this.dungeon.rooms;
    const scale = this.getMapScale();
    const drawn = new Set<string>();

    rooms.forEach(room => {
      room.connections.forEach(cId => {
        const key = [Math.min(room.id, cId), Math.max(room.id, cId)].join('-');
        if (drawn.has(key)) return;
        drawn.add(key);

        const other = rooms[cId];
        const p1 = this.roomToScreen(room, scale);
        const p2 = this.roomToScreen(other, scale);

        const bothCleared = room.cleared && other.cleared;
        g.lineStyle(2, bothCleared ? 0x2ecc71 : 0x333333, bothCleared ? 0.6 : 0.3);
        g.lineBetween(p1.x, p1.y, p2.x, p2.y);
      });
    });
  }

  private drawRooms(): void {
    const scale = this.getMapScale();

    this.dungeon.rooms.forEach(room => {
      const pos = this.roomToScreen(room, scale);
      const isCurrent = room.id === this.dungeon.currentRoomId;
      const canEnter = canEnterRoom(this.dungeon, room.id);
      const color = ROOM_COLORS[room.type];
      const size = 32;

      // Room node
      const bg = this.add.graphics();
      bg.fillStyle(color, room.cleared ? 0.15 : 0.4);
      bg.fillRoundedRect(pos.x - size, pos.y - size, size * 2, size * 2, 8);
      bg.lineStyle(isCurrent ? 3 : 1, isCurrent ? 0xffd700 : (room.cleared ? 0x2ecc71 : color), isCurrent ? 0.9 : 0.5);
      bg.strokeRoundedRect(pos.x - size, pos.y - size, size * 2, size * 2, 8);

      // Current room pulse
      if (isCurrent) {
        const pulse = this.add.circle(pos.x, pos.y, size + 4, 0xffd700, 0.15);
        this.tweens.add({ targets: pulse, alpha: 0, scale: 1.3, duration: 1000, repeat: -1, yoyo: true });
      }

      // Icon
      this.add.text(pos.x, pos.y - 6, ROOM_ICONS[room.type], { fontSize: '20px' }).setOrigin(0.5);

      // Room label
      const label = room.type === 'boss' ? 'BOSS'
        : room.type === 'treasure' ? 'Tesouro'
        : room.type === 'rest' ? 'Descanso'
        : room.type === 'elite' ? 'Elite'
        : room.type === 'spawn' ? 'Início'
        : `${room.enemies} inimigos`;
      this.add.text(pos.x, pos.y + 20, label, {
        fontFamily: '"Cinzel", serif', fontSize: '9px',
        color: room.cleared ? '#2ecc71' : '#d4d4d8',
      }).setOrigin(0.5);

      // Cleared check
      if (room.cleared && room.type !== 'spawn') {
        this.add.text(pos.x + size - 4, pos.y - size + 4, '✓', {
          fontSize: '14px', color: '#2ecc71',
        }).setOrigin(0.5);
      }

      // Interactive — enter room
      if (canEnter && !room.cleared) {
        const hitZone = this.add.zone(pos.x, pos.y, size * 2, size * 2).setInteractive({ useHandCursor: true });
        hitZone.on('pointerover', () => {
          bg.clear();
          bg.fillStyle(color, 0.6);
          bg.fillRoundedRect(pos.x - size, pos.y - size, size * 2, size * 2, 8);
          bg.lineStyle(2, 0xffd700, 0.8);
          bg.strokeRoundedRect(pos.x - size, pos.y - size, size * 2, size * 2, 8);
        });
        hitZone.on('pointerout', () => {
          bg.clear();
          bg.fillStyle(color, 0.4);
          bg.fillRoundedRect(pos.x - size, pos.y - size, size * 2, size * 2, 8);
          bg.lineStyle(1, color, 0.5);
          bg.strokeRoundedRect(pos.x - size, pos.y - size, size * 2, size * 2, 8);
        });
        hitZone.on('pointerdown', () => this.enterRoom(room));
      }
    });
  }

  private enterRoom(room: DungeonRoom): void {
    this.dungeon = enterRoom(this.dungeon, room.id);

    if (room.type === 'rest') {
      // Rest: heal and mark cleared
      this.dungeon = clearRoom(this.dungeon, room.id);
      this.showFeedback('❤️ HP restaurado!');
      this.time.delayedCall(1000, () => this.scene.restart({
        classId: this.classId,
        dungeon: this.dungeon,
        profile: this.profile,
        sessionGold: this.sessionGold,
        sessionXp: this.sessionXp,
        sessionKills: this.sessionKills,
      }));
      return;
    }

    if (room.type === 'treasure') {
      // Treasure: give gold and mark cleared
      const gold = room.reward?.gold ?? 50;
      this.sessionGold += gold;
      this.dungeon = clearRoom(this.dungeon, room.id);
      this.showFeedback(`💰 +${gold} ouro!`);
      this.time.delayedCall(1000, () => this.scene.restart({
        classId: this.classId,
        dungeon: this.dungeon,
        profile: this.profile,
        sessionGold: this.sessionGold,
        sessionXp: this.sessionXp,
        sessionKills: this.sessionKills,
      }));
      return;
    }

    // Combat / Elite / Boss → go to game scene
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.game, {
        classId: this.classId,
        dungeonMode: true,
        dungeonRoom: room,
        dungeon: this.dungeon,
        sessionGold: this.sessionGold,
        sessionXp: this.sessionXp,
        sessionKills: this.sessionKills,
      });
    });
  }

  private showFeedback(text: string): void {
    const fb = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, text, {
      fontFamily: '"Cinzel", serif', fontSize: '24px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(300);
    this.tweens.add({ targets: fb, alpha: 0, y: fb.y - 40, duration: 1500, onComplete: () => fb.destroy() });
  }

  private getMapScale(): { offsetX: number; offsetY: number; cellSize: number } {
    const padding = 80;
    const cellSize = Math.min(
      (GAME_WIDTH - padding * 2) / 5,
      (GAME_HEIGHT - 120 - padding) / 5,
    );
    return {
      offsetX: (GAME_WIDTH - 5 * cellSize) / 2 + cellSize / 2,
      offsetY: 70 + cellSize / 2,
      cellSize,
    };
  }

  private roomToScreen(room: DungeonRoom, scale: ReturnType<typeof this.getMapScale>): { x: number; y: number } {
    return {
      x: scale.offsetX + room.x * scale.cellSize,
      y: scale.offsetY + room.y * scale.cellSize,
    };
  }

  private drawLegend(): void {
    const types: RoomType[] = ['combat', 'elite', 'boss', 'treasure', 'rest'];
    const labels = ['Combate', 'Elite', 'Boss', 'Tesouro', 'Descanso'];
    const y = GAME_HEIGHT - 25;
    const startX = GAME_WIDTH / 2 - 200;

    types.forEach((type, i) => {
      const x = startX + i * 90;
      this.add.circle(x, y, 6, ROOM_COLORS[type], 0.6);
      this.add.text(x + 12, y, labels[i], {
        fontFamily: '"Cinzel", serif', fontSize: '10px', color: '#71717a',
      }).setOrigin(0, 0.5);
    });
  }
}
