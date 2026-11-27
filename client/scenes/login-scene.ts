import Phaser from 'phaser';
import { SCENE_KEYS, PALETTE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { apiLogin, apiRegister, storeAuth } from '../services/auth';

export class LoginScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.login);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);

    // Dark gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.bgLight, PALETTE.bgLight, PALETTE.bg, PALETTE.bg, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 140, 'DD&D', {
      fontFamily: '"Cinzel", serif',
      fontSize: '64px',
      color: '#c9a44e',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 195, 'DYNAMIC DUNGEONS & DRAGONS', {
      fontFamily: '"Cinzel", serif',
      fontSize: '14px',
      color: '#71717a',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // DOM form
    const formHtml = `
      <div id="login-form" style="
        display: flex; flex-direction: column; align-items: center; gap: 12px;
        font-family: 'Cinzel', serif;
      ">
        <input id="login-username" type="text" placeholder="Usuário" autocomplete="username"
          style="width: 280px; padding: 10px 16px; background: #16162a; border: 1px solid #2a2a4a;
          border-radius: 6px; color: #d4d4d8; font-size: 15px; outline: none; font-family: inherit;"
        />
        <input id="login-password" type="password" placeholder="Senha" autocomplete="current-password"
          style="width: 280px; padding: 10px 16px; background: #16162a; border: 1px solid #2a2a4a;
          border-radius: 6px; color: #d4d4d8; font-size: 15px; outline: none; font-family: inherit;"
        />
        <input id="login-display" type="text" placeholder="Nome de exibição (registro)" autocomplete="off"
          style="width: 280px; padding: 10px 16px; background: #16162a; border: 1px solid #2a2a4a;
          border-radius: 6px; color: #d4d4d8; font-size: 15px; outline: none; font-family: inherit; display: none;"
        />
        <div style="display: flex; gap: 12px; margin-top: 4px;">
          <button id="btn-login" style="
            padding: 10px 28px; background: linear-gradient(135deg, #c9a44e, #8b6914);
            border: none; border-radius: 6px; color: #0a0a0f; font-size: 15px;
            font-weight: bold; cursor: pointer; font-family: inherit; letter-spacing: 1px;
          ">ENTRAR</button>
          <button id="btn-register" style="
            padding: 10px 28px; background: transparent; border: 1px solid #c9a44e;
            border-radius: 6px; color: #c9a44e; font-size: 15px;
            cursor: pointer; font-family: inherit; letter-spacing: 1px;
          ">REGISTRAR</button>
        </div>
        <div id="login-error" style="color: #e74c3c; font-size: 13px; min-height: 20px;"></div>
        <div id="login-toggle" style="color: #71717a; font-size: 12px; cursor: pointer; text-decoration: underline;">
          Primeira vez? Clique em REGISTRAR
        </div>
      </div>
    `;

    const dom = this.add.dom(GAME_WIDTH / 2, 380).createFromHTML(formHtml);
    dom.setOrigin(0.5);

    let isRegisterMode = false;

    const loginBtn = dom.getChildByID('btn-login') as HTMLButtonElement;
    const registerBtn = dom.getChildByID('btn-register') as HTMLButtonElement;
    const usernameInput = dom.getChildByID('login-username') as HTMLInputElement;
    const passwordInput = dom.getChildByID('login-password') as HTMLInputElement;
    const displayInput = dom.getChildByID('login-display') as HTMLInputElement;
    const errorDiv = dom.getChildByID('login-error') as HTMLDivElement;
    const toggleDiv = dom.getChildByID('login-toggle') as HTMLDivElement;

    const setError = (msg: string) => { errorDiv.textContent = msg; };
    const setLoading = (loading: boolean) => {
      loginBtn.disabled = loading;
      registerBtn.disabled = loading;
      loginBtn.style.opacity = loading ? '0.5' : '1';
      registerBtn.style.opacity = loading ? '0.5' : '1';
    };

    toggleDiv.addEventListener('click', () => {
      isRegisterMode = !isRegisterMode;
      displayInput.style.display = isRegisterMode ? 'block' : 'none';
      toggleDiv.textContent = isRegisterMode
        ? 'Já tem conta? Clique em ENTRAR'
        : 'Primeira vez? Clique em REGISTRAR';
      setError('');
    });

    loginBtn.addEventListener('click', async () => {
      setError('');
      const user = usernameInput.value.trim();
      const pass = passwordInput.value;
      if (!user || !pass) { setError('Preencha usuário e senha'); return; }
      setLoading(true);
      try {
        const response = await apiLogin(user, pass);
        storeAuth(response);
        this.scene.start(SCENE_KEYS.mainMenu, { profile: response.player });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    registerBtn.addEventListener('click', async () => {
      setError('');
      const user = usernameInput.value.trim();
      const pass = passwordInput.value;
      const display = displayInput.value.trim() || user;
      if (!user || !pass) { setError('Preencha usuário e senha'); return; }
      if (!isRegisterMode) {
        isRegisterMode = true;
        displayInput.style.display = 'block';
        toggleDiv.textContent = 'Já tem conta? Clique em ENTRAR';
        setError('Preencha o nome de exibição e clique REGISTRAR');
        return;
      }
      setLoading(true);
      try {
        const response = await apiRegister(user, pass, display);
        storeAuth(response);
        this.scene.start(SCENE_KEYS.tutorial);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    // Enter key submits
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (isRegisterMode) registerBtn.click();
        else loginBtn.click();
      }
    };
    usernameInput.addEventListener('keydown', handleEnter);
    passwordInput.addEventListener('keydown', handleEnter);
    displayInput.addEventListener('keydown', handleEnter);
  }
}
