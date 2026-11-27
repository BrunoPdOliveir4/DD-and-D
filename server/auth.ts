import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from './db';
import type { PlayerProfile, ClassProgress, ClassId, RegisterRequest, LoginRequest, AuthResponse } from '../shared/types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const STARTER_ABILITY_IDS: Record<ClassId, string[]> = {
  hunter: ['hnt_rain_arrows', 'hnt_agile_retreat', 'hnt_eagle_eye', 'hnt_arrow_storm', 'hnt_piercing_arrow'],
  berserker: ['bsk_axe_throw', 'bsk_war_cry', 'bsk_bloodlust', 'bsk_fury_slam', 'bsk_cleave'],
  runekeeper: ['rk_frost_rune', 'rk_fire_rune', 'rk_summon_golem', 'rk_rune_shield', 'rk_arcane_bolt'],
  riftblade: ['rb_blink_strike', 'rb_void_mark', 'rb_phase_shift', 'rb_spatial_rift', 'rb_shadow_blade'],
  trickster: ['tk_juggle', 'tk_smoke_mirror', 'tk_card_trick', 'tk_vanish', 'tk_poison_flask'],
};

function initialClassProgress(): Record<ClassId, ClassProgress> {
  const classes: ClassId[] = ['berserker', 'hunter', 'runekeeper', 'riftblade', 'trickster'];
  const progress = {} as Record<ClassId, ClassProgress>;
  for (const id of classes) {
    const starters = STARTER_ABILITY_IDS[id];
    progress[id] = {
      unlocked: true, // All classes unlocked from start
      xp: 0,
      level: 1,
      mastery: 0,
      unlockedAbilities: [...starters], // 3 starter abilities pre-unlocked
      equippedAbilities: [...starters], // and pre-equipped
    };
  }
  return progress;
}

// ── Register ──
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body as RegisterRequest;
    if (!username || !password || !displayName) {
      res.status(400).json({ error: 'username, password e displayName obrigatórios' });
      return;
    }
    if (username.length < 3 || username.length > 20) {
      res.status(400).json({ error: 'Username deve ter entre 3 e 20 caracteres' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
      return;
    }

    const db = getDB();
    const existing = await db.collection('players').findOne({ username: username.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'Username já existe' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const doc = {
      username: username.toLowerCase(),
      displayName,
      passwordHash: hash,
      level: 1,
      xp: 0,
      gold: 0,
      classProgress: initialClassProgress(),
      guildId: null,
      tutorialDone: false,
      createdAt: now,
    };

    const result = await db.collection('players').insertOne(doc);
    const profile: PlayerProfile = {
      id: result.insertedId.toString(),
      username: doc.username,
      displayName: doc.displayName,
      level: doc.level,
      xp: doc.xp,
      gold: doc.gold,
      classProgress: doc.classProgress,
      guildId: null,
      tutorialDone: false,
      createdAt: now,
    };

    const token = jwt.sign({ sub: profile.id, username: profile.username }, JWT_SECRET, { expiresIn: '7d' });
    const response: AuthResponse = { token, player: profile };
    res.status(201).json(response);
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── Login ──
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body as LoginRequest;
    if (!username || !password) {
      res.status(400).json({ error: 'username e password obrigatórios' });
      return;
    }

    const db = getDB();
    const doc = await db.collection('players').findOne({ username: username.toLowerCase() });
    if (!doc) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, doc.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const profile: PlayerProfile = {
      id: doc._id.toString(),
      username: doc.username,
      displayName: doc.displayName,
      level: doc.level,
      xp: doc.xp,
      gold: doc.gold,
      classProgress: doc.classProgress,
      guildId: doc.guildId,
      tutorialDone: doc.tutorialDone,
      createdAt: doc.createdAt,
    };

    const token = jwt.sign({ sub: profile.id, username: profile.username }, JWT_SECRET, { expiresIn: '7d' });
    const response: AuthResponse = { token, player: profile };
    res.json(response);
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── Get profile (authenticated) ──
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string };
    const db = getDB();
    const doc = await db.collection('players').findOne({ _id: new ObjectId(payload.sub) });
    if (!doc) {
      res.status(404).json({ error: 'Jogador não encontrado' });
      return;
    }

    const profile: PlayerProfile = {
      id: doc._id.toString(),
      username: doc.username,
      displayName: doc.displayName,
      level: doc.level,
      xp: doc.xp,
      gold: doc.gold,
      classProgress: doc.classProgress,
      guildId: doc.guildId,
      tutorialDone: doc.tutorialDone,
      createdAt: doc.createdAt,
    };

    res.json(profile);
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
