export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const SCENE_KEYS = {
  boot: 'BootScene',
  login: 'LoginScene',
  mainMenu: 'MainMenuScene',
  classSelect: 'ClassSelectScene',
  talentTree: 'TalentTreeScene',
  tutorial: 'TutorialScene',
  game: 'GameScene',
  hud: 'HudScene',
  guild: 'GuildScene',
} as const;

export const PALETTE = {
  bg: 0x0a0a0f,
  bgLight: 0x1a1a2e,
  gold: 0xc9a44e,
  goldLight: 0xf5e6a3,
  text: 0xd4d4d8,
  muted: 0x71717a,
  panel: 0x16162a,
  panelEdge: 0x2a2a4a,
  red: 0xe74c3c,
  green: 0x2ecc71,
  blue: 0x3498db,
  purple: 0x9b59b6,
  orange: 0xf39c12,
  white: 0xffffff,
  black: 0x000000,
} as const;

export const API_BASE = '/api';
