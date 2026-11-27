// ── Procedural dungeon generator ──
import type { Vector2 } from '../../shared/types';

export type RoomType = 'spawn' | 'combat' | 'elite' | 'boss' | 'treasure' | 'rest';

export interface DungeonRoom {
  id: number;
  type: RoomType;
  x: number; // grid x
  y: number; // grid y
  worldX: number; // pixel center
  worldY: number; // pixel center
  connections: number[]; // connected room IDs
  cleared: boolean;
  enemies: number; // enemy count (0 for non-combat)
  reward?: { gold: number; xp: number };
}

export interface DungeonMap {
  rooms: DungeonRoom[];
  currentRoomId: number;
  floor: number;
  seed: number;
}

// ── Seeded PRNG ──
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const ROOM_SIZE = 800; // pixels per room
const GRID_SIZE = 5;   // 5×5 grid

export function generateDungeon(floor: number, seed?: number): DungeonMap {
  const s = seed ?? (Date.now() ^ (floor * 7919));
  const rng = mulberry32(s);
  const rooms: DungeonRoom[] = [];

  // Place rooms on grid — start at center, path to boss
  const path = generatePath(rng);

  // Create rooms along path
  path.forEach((pos, i) => {
    let type: RoomType = 'combat';
    if (i === 0) type = 'spawn';
    else if (i === path.length - 1) type = 'boss';
    else if (i === Math.floor(path.length / 2)) type = 'rest';
    else if (rng() < 0.15) type = 'treasure';
    else if (rng() < 0.2) type = 'elite';

    const enemies = type === 'combat' ? 4 + floor + Math.floor(rng() * 3)
      : type === 'elite' ? 2 + Math.floor(rng() * 2)
      : type === 'boss' ? 1
      : 0;

    rooms.push({
      id: i,
      type,
      x: pos.x,
      y: pos.y,
      worldX: pos.x * ROOM_SIZE + ROOM_SIZE / 2,
      worldY: pos.y * ROOM_SIZE + ROOM_SIZE / 2,
      connections: [],
      cleared: i === 0,
      enemies,
      reward: type !== 'spawn' && type !== 'rest' ? {
        gold: enemies * 5 + floor * 10 + (type === 'treasure' ? 50 : 0),
        xp: enemies * 15 + floor * 20 + (type === 'boss' ? 100 : 0),
      } : undefined,
    });
  });

  // Connect adjacent rooms
  for (let i = 0; i < rooms.length - 1; i++) {
    rooms[i].connections.push(rooms[i + 1].id);
    rooms[i + 1].connections.push(rooms[i].id);
  }

  // Add some random side connections for variety
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 2; j < rooms.length; j++) {
      const dist = Math.abs(rooms[i].x - rooms[j].x) + Math.abs(rooms[i].y - rooms[j].y);
      if (dist === 1 && rng() < 0.3 && !rooms[i].connections.includes(j)) {
        rooms[i].connections.push(j);
        rooms[j].connections.push(i);
      }
    }
  }

  return { rooms, currentRoomId: 0, floor, seed: s };
}

function generatePath(rng: () => number): Vector2[] {
  const path: Vector2[] = [];
  const visited = new Set<string>();
  let x = 2, y = 4; // Start bottom center
  const target = { x: 2, y: 0 }; // Boss at top center
  const roomCount = 7 + Math.floor(rng() * 4); // 7-10 rooms

  path.push({ x, y });
  visited.add(`${x},${y}`);

  for (let i = 1; i < roomCount - 1; i++) {
    const dirs = [
      { dx: 0, dy: -1 }, // up (towards boss)
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: -1 }, // up again (bias towards boss)
    ];

    let moved = false;
    // Shuffle dirs
    for (let d = dirs.length - 1; d > 0; d--) {
      const j = Math.floor(rng() * (d + 1));
      [dirs[d], dirs[j]] = [dirs[j], dirs[d]];
    }

    for (const dir of dirs) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !visited.has(key)) {
        x = nx; y = ny;
        path.push({ x, y });
        visited.add(key);
        moved = true;
        break;
      }
    }

    if (!moved) break;
  }

  // Ensure boss room at target
  if (path[path.length - 1].x !== target.x || path[path.length - 1].y !== target.y) {
    path.push(target);
  }

  return path;
}

export function getRoomSize(): number { return ROOM_SIZE; }

export function canEnterRoom(dungeon: DungeonMap, roomId: number): boolean {
  const current = dungeon.rooms[dungeon.currentRoomId];
  if (!current.connections.includes(roomId)) return false;
  // Must clear current room first (unless spawn)
  if (!current.cleared && current.type !== 'spawn') return false;
  return true;
}

export function enterRoom(dungeon: DungeonMap, roomId: number): DungeonMap {
  return { ...dungeon, currentRoomId: roomId };
}

export function clearRoom(dungeon: DungeonMap, roomId: number): DungeonMap {
  const rooms = dungeon.rooms.map(r =>
    r.id === roomId ? { ...r, cleared: true } : r
  );
  return { ...dungeon, rooms };
}
