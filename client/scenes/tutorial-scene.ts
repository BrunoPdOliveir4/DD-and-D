import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { getStoredProfile, getStoredToken, storeAuth } from '../services/auth';

interface TutorialStep {
  title: string;
  text: string;
  icon: string;
  highlight?: string; // area to highlight
}

const STEPS: TutorialStep[] = [
  {
    title: 'Bem-vindo ao DD&D!',
    text: 'Dynamic Dungeons & Dragons é um jogo de combate tático com 5 classes únicas, árvore de talentos e maestria infinita.',
    icon: '⚔️',
  },
  {
    title: 'Movimentação',
    text: 'Use WASD para mover seu personagem pela arena. Seu personagem sempre olha na direção do mouse.',
    icon: '🕹️',
  },
  {
    title: 'Ataque Básico',
    text: 'Segure o botão esquerdo do mouse para mirar — uma linha colorida mostra a direção. Solte para disparar!',
    icon: '🏹',
  },
  {
    title: 'Habilidades',
    text: 'Pressione 1, 2 ou 3 para usar suas habilidades equipadas. Cada uma tem cooldown próprio — observe a barra inferior.',
    icon: '✨',
  },
  {
    title: 'Aljava do Hunter',
    text: 'O Hunter tem 9 flechas tipadas: 🟢Veneno (DoT), 🔵Atordoar (stun), 🔴Lacerante (+dano). Após 9 tiros, 4s de recarga.',
    icon: '🎯',
  },
  {
    title: 'Classes & Maestria',
    text: '5 classes disponíveis, cada uma com 15 habilidades em 4 ramos. A maestria é infinita — quanto mais joga, mais forte fica!',
    icon: '⭐',
  },
  {
    title: 'Pronto para a batalha!',
    text: 'Sobreviva às ondas de inimigos, colete ouro e evolua. Boa sorte, aventureiro!',
    icon: '🎮',
  },
];

export class TutorialScene extends Phaser.Scene {
  private currentStep = 0;
  private stepContainer: Phaser.GameObjects.Container | null = null;
  private dotsContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super(SCENE_KEYS.tutorial);
  }

  create(): void {
    this.currentStep = 0;
    this.cameras.main.setBackgroundColor(PALETTE.bg);

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.bgLight, PALETTE.bgLight, PALETTE.bg, PALETTE.bg, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative circles
    const deco = this.add.graphics();
    deco.lineStyle(1, PALETTE.gold, 0.06);
    deco.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 200);
    deco.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 250);
    deco.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 300);

    // Skip button
    const skip = this.add.text(GAME_WIDTH - 30, 30, 'PULAR ›', {
      fontFamily: '"Cinzel", serif', fontSize: '14px', color: '#71717a',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => this.completeTutorial());
    skip.on('pointerover', () => skip.setColor('#d4d4d8'));
    skip.on('pointerout', () => skip.setColor('#71717a'));

    this.showStep(0);
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private showStep(index: number): void {
    this.currentStep = index;
    if (this.stepContainer) this.stepContainer.destroy();
    if (this.dotsContainer) this.dotsContainer.destroy();

    const step = STEPS[index];
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
    this.stepContainer = container;

    // Icon
    const icon = this.add.text(0, -80, step.icon, { fontSize: '56px' }).setOrigin(0.5);
    container.add(icon);

    // Title
    const title = this.add.text(0, -20, step.title, {
      fontFamily: '"Cinzel", serif', fontSize: '28px', color: '#c9a44e', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(title);

    // Text
    const text = this.add.text(0, 30, step.text, {
      fontFamily: '"Cinzel", serif', fontSize: '15px', color: '#d4d4d8',
      wordWrap: { width: 500 }, align: 'center', lineSpacing: 6,
    }).setOrigin(0.5, 0);
    container.add(text);

    // Entrance animation
    container.setAlpha(0);
    container.setScale(0.9);
    this.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 300, ease: 'Cubic.easeOut' });

    // Navigation buttons
    const navY = GAME_HEIGHT / 2 + 120;
    const isLast = index === STEPS.length - 1;
    const isFirst = index === 0;

    if (!isFirst) {
      const prev = this.add.text(-120, navY - GAME_HEIGHT / 2 + 30, '‹ Anterior', {
        fontFamily: '"Cinzel", serif', fontSize: '16px', color: '#71717a',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      prev.on('pointerdown', () => this.showStep(index - 1));
      prev.on('pointerover', () => prev.setColor('#d4d4d8'));
      prev.on('pointerout', () => prev.setColor('#71717a'));
      container.add(prev);
    }

    const nextLabel = isLast ? 'COMEÇAR! ›' : 'Próximo ›';
    const nextColor = isLast ? '#c9a44e' : '#d4d4d8';
    const next = this.add.text(120, navY - GAME_HEIGHT / 2 + 30, nextLabel, {
      fontFamily: '"Cinzel", serif', fontSize: '16px', color: nextColor, fontStyle: isLast ? 'bold' : 'normal',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    next.on('pointerdown', () => {
      if (isLast) this.completeTutorial();
      else this.showStep(index + 1);
    });
    next.on('pointerover', () => next.setColor('#f5e6a3'));
    next.on('pointerout', () => next.setColor(nextColor));
    container.add(next);

    // Progress dots
    const dots = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 50);
    this.dotsContainer = dots;
    STEPS.forEach((_, i) => {
      const dotX = (i - (STEPS.length - 1) / 2) * 18;
      const active = i === index;
      const dot = this.add.circle(dotX, 0, active ? 5 : 3, active ? PALETTE.gold : 0x555555);
      dots.add(dot);
    });
  }

  private completeTutorial(): void {
    // Mark tutorial as done (update local profile)
    const profile = getStoredProfile();
    if (profile) {
      profile.tutorialDone = true;
      const token = getStoredToken();
      if (token) storeAuth({ token, player: profile });
    }

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.mainMenu, { profile });
    });
  }
}
