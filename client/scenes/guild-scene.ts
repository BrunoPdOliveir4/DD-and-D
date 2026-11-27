import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT, API_BASE } from '../config';
import { getStoredToken, getStoredProfile } from '../services/auth';
import type { PlayerProfile } from '../../shared/types';

export class GuildScene extends Phaser.Scene {
  private profile!: PlayerProfile | null;

  constructor() {
    super(SCENE_KEYS.guild);
  }

  init(data?: { profile?: PlayerProfile }): void {
    this.profile = data?.profile ?? getStoredProfile();
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);

    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.bgLight, PALETTE.bgLight, PALETTE.bg, PALETTE.bg, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 50, '🏰 GUILDA', {
      fontFamily: '"Cinzel", serif', fontSize: '32px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    if (this.profile?.guildId) {
      this.showGuildInfo();
    } else {
      this.showNoGuild();
    }

    // Back button
    const back = this.add.text(60, GAME_HEIGHT - 30, '← VOLTAR', {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#71717a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.mainMenu, { profile: this.profile }));
    back.on('pointerover', () => back.setColor('#d4d4d8'));
    back.on('pointerout', () => back.setColor('#71717a'));

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private showNoGuild(): void {
    // Central panel
    const pw = 500, ph = 300;
    const px = GAME_WIDTH / 2 - pw / 2, py = 120;
    const panel = this.add.graphics();
    panel.fillStyle(PALETTE.panel, 0.85);
    panel.fillRoundedRect(px, py, pw, ph, 8);
    panel.lineStyle(1, PALETTE.gold, 0.3);
    panel.strokeRoundedRect(px, py, pw, ph, 8);

    this.add.text(GAME_WIDTH / 2, py + 40, 'Você não está em uma guilda', {
      fontFamily: '"Cinzel", serif', fontSize: '18px', color: '#d4d4d8',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, py + 75, 'Guildas permitem jogar com amigos, compartilhar\nconquistas e competir em rankings.', {
      fontFamily: '"Cinzel", serif', fontSize: '13px', color: '#71717a',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5);

    // Create guild form (DOM)
    const formHtml = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;font-family:'Cinzel',serif;">
        <input id="guild-name" type="text" placeholder="Nome da Guilda" maxlength="20"
          style="width:240px;padding:8px 14px;background:#16162a;border:1px solid #2a2a4a;border-radius:6px;color:#d4d4d8;font-size:14px;outline:none;font-family:inherit;"/>
        <input id="guild-tag" type="text" placeholder="Tag (2-4 letras)" maxlength="4"
          style="width:240px;padding:8px 14px;background:#16162a;border:1px solid #2a2a4a;border-radius:6px;color:#d4d4d8;font-size:14px;outline:none;font-family:inherit;text-transform:uppercase;"/>
        <button id="btn-create-guild" style="padding:8px 24px;background:linear-gradient(135deg,#c9a44e,#8b6914);border:none;border-radius:6px;color:#0a0a0f;font-size:14px;font-weight:bold;cursor:pointer;font-family:inherit;">CRIAR GUILDA</button>
        <div id="guild-error" style="color:#e74c3c;font-size:12px;min-height:16px;"></div>
      </div>
    `;
    const dom = this.add.dom(GAME_WIDTH / 2, py + 200).createFromHTML(formHtml).setOrigin(0.5);

    const createBtn = dom.getChildByID('btn-create-guild') as HTMLButtonElement;
    const nameInput = dom.getChildByID('guild-name') as HTMLInputElement;
    const tagInput = dom.getChildByID('guild-tag') as HTMLInputElement;
    const errorDiv = dom.getChildByID('guild-error') as HTMLDivElement;

    createBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const tag = tagInput.value.trim().toUpperCase();
      if (!name || name.length < 3) { errorDiv.textContent = 'Nome deve ter 3+ caracteres'; return; }
      if (!tag || tag.length < 2 || tag.length > 4) { errorDiv.textContent = 'Tag deve ter 2-4 letras'; return; }

      try {
        const token = getStoredToken();
        const res = await fetch(`${API_BASE}/guild/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, tag }),
        });
        if (!res.ok) {
          const err = await res.json();
          errorDiv.textContent = err.error || 'Erro ao criar guilda';
          return;
        }
        const guild = await res.json();
        if (this.profile) this.profile.guildId = guild.id;
        this.scene.restart({ profile: this.profile });
      } catch {
        errorDiv.textContent = 'Erro de conexão';
      }
    });
  }

  private showGuildInfo(): void {
    // Placeholder — will be populated from API
    const pw = 600, ph = 400;
    const px = GAME_WIDTH / 2 - pw / 2, py = 110;
    const panel = this.add.graphics();
    panel.fillStyle(PALETTE.panel, 0.85);
    panel.fillRoundedRect(px, py, pw, ph, 8);
    panel.lineStyle(1, PALETTE.gold, 0.3);
    panel.strokeRoundedRect(px, py, pw, ph, 8);

    this.add.text(GAME_WIDTH / 2, py + 30, 'Carregando guilda...', {
      fontFamily: '"Cinzel", serif', fontSize: '18px', color: '#d4d4d8',
    }).setOrigin(0.5);

    // Fetch guild data
    this.loadGuildData(px, py, pw);
  }

  private async loadGuildData(px: number, py: number, pw: number): Promise<void> {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE}/guild/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const guild = await res.json();

      // Redraw with real data
      this.add.text(GAME_WIDTH / 2, py + 30, `[${guild.tag}] ${guild.name}`, {
        fontFamily: '"Cinzel", serif', fontSize: '22px', color: '#c9a44e', fontStyle: 'bold',
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, py + 60, `Nível ${guild.level}  ·  ${guild.memberCount} membros`, {
        fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#71717a',
      }).setOrigin(0.5);

      // Members list
      if (guild.members) {
        guild.members.forEach((member: any, i: number) => {
          const isLeader = member.id === guild.leaderId;
          this.add.text(px + 30, py + 100 + i * 28, `${isLeader ? '👑' : '•'} ${member.displayName} — Nv ${member.level}`, {
            fontFamily: '"Cinzel", serif', fontSize: '13px', color: isLeader ? '#c9a44e' : '#d4d4d8',
          });
        });
      }
    } catch {
      // silently fail
    }
  }
}
