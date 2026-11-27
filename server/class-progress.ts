// ── Server endpoint for class progress (unlock/equip abilities) ──
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from './db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function getPlayerId(req: any): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string };
    return payload.sub;
  } catch { return null; }
}

// ── Unlock ability ──
router.post('/unlock', async (req, res) => {
  try {
    const playerId = getPlayerId(req);
    if (!playerId) { res.status(401).json({ error: 'Não autenticado' }); return; }

    const { classId, abilityId } = req.body;
    if (!classId || !abilityId) { res.status(400).json({ error: 'classId e abilityId obrigatórios' }); return; }

    const db = getDB();
    const player = await db.collection('players').findOne({ _id: new ObjectId(playerId) });
    if (!player) { res.status(404).json({ error: 'Jogador não encontrado' }); return; }

    const progress = player.classProgress?.[classId];
    if (!progress) { res.status(400).json({ error: 'Classe inválida' }); return; }
    if (!progress.unlocked) { res.status(400).json({ error: 'Classe bloqueada' }); return; }

    // Cost: level × 50 gold
    const cost = progress.level * 50;
    if (player.gold < cost) { res.status(400).json({ error: `Ouro insuficiente (precisa de ${cost})` }); return; }

    // Already unlocked?
    if (progress.unlockedAbilities.includes(abilityId)) {
      res.status(400).json({ error: 'Habilidade já desbloqueada' }); return;
    }

    await db.collection('players').updateOne(
      { _id: new ObjectId(playerId) },
      {
        $addToSet: { [`classProgress.${classId}.unlockedAbilities`]: abilityId },
        $inc: { gold: -cost },
      },
    );

    res.json({ success: true, cost, remainingGold: player.gold - cost });
  } catch (err: any) {
    console.error('Unlock ability error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── Equip abilities (set 5 equipped slots) ──
router.post('/equip', async (req, res) => {
  try {
    const playerId = getPlayerId(req);
    if (!playerId) { res.status(401).json({ error: 'Não autenticado' }); return; }

    const { classId, abilityIds } = req.body;
    if (!classId || !Array.isArray(abilityIds)) { res.status(400).json({ error: 'classId e abilityIds obrigatórios' }); return; }
    if (abilityIds.length > 5) { res.status(400).json({ error: 'Máximo 5 habilidades' }); return; }

    const db = getDB();
    const player = await db.collection('players').findOne({ _id: new ObjectId(playerId) });
    if (!player) { res.status(404).json({ error: 'Jogador não encontrado' }); return; }

    const progress = player.classProgress?.[classId];
    if (!progress) { res.status(400).json({ error: 'Classe inválida' }); return; }

    // Validate all abilities are unlocked
    for (const id of abilityIds) {
      if (!progress.unlockedAbilities.includes(id)) {
        res.status(400).json({ error: `Habilidade ${id} não desbloqueada` }); return;
      }
    }

    await db.collection('players').updateOne(
      { _id: new ObjectId(playerId) },
      { $set: { [`classProgress.${classId}.equippedAbilities`]: abilityIds } },
    );

    res.json({ success: true, equippedAbilities: abilityIds });
  } catch (err: any) {
    console.error('Equip abilities error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── Get class progress ──
router.get('/progress/:classId', async (req, res) => {
  try {
    const playerId = getPlayerId(req);
    if (!playerId) { res.status(401).json({ error: 'Não autenticado' }); return; }

    const db = getDB();
    const player = await db.collection('players').findOne({ _id: new ObjectId(playerId) });
    if (!player) { res.status(404).json({ error: 'Jogador não encontrado' }); return; }

    const progress = player.classProgress?.[req.params.classId];
    if (!progress) { res.status(400).json({ error: 'Classe inválida' }); return; }

    res.json(progress);
  } catch (err: any) {
    console.error('Get progress error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
