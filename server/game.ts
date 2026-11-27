import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from './db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Middleware to extract player ID from JWT
function getPlayerId(req: any): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}

// ── Save game results ──
router.post('/save-run', async (req, res) => {
  try {
    const playerId = getPlayerId(req);
    if (!playerId) { res.status(401).json({ error: 'Não autenticado' }); return; }

    const { wave, kills, gold, classId } = req.body;
    if (!wave || !classId) { res.status(400).json({ error: 'Dados incompletos' }); return; }

    const db = getDB();
    const xpEarned = kills * 10 + wave * 25 + gold * 2;

    // Update player profile
    const result = await db.collection('players').findOneAndUpdate(
      { _id: new ObjectId(playerId) },
      {
        $inc: {
          xp: xpEarned,
          gold: gold,
          [`classProgress.${classId}.xp`]: xpEarned,
        },
      },
      { returnDocument: 'after' },
    );

    if (!result) { res.status(404).json({ error: 'Jogador não encontrado' }); return; }

    // Check level ups
    const totalXp = result.xp;
    const newLevel = Math.floor(Math.sqrt(totalXp / 100)) + 1;
    if (newLevel > result.level) {
      await db.collection('players').updateOne(
        { _id: new ObjectId(playerId) },
        { $set: { level: newLevel } },
      );
    }

    // Save run to history
    await db.collection('runs').insertOne({
      playerId: new ObjectId(playerId),
      classId,
      wave,
      kills,
      goldEarned: gold,
      xpEarned,
      playedAt: new Date().toISOString(),
    });

    res.json({
      xpEarned,
      goldEarned: gold,
      newLevel: Math.max(newLevel, result.level),
      totalXp: totalXp,
    });
  } catch (err: any) {
    console.error('Save run error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── Get run history ──
router.get('/history', async (req, res) => {
  try {
    const playerId = getPlayerId(req);
    if (!playerId) { res.status(401).json({ error: 'Não autenticado' }); return; }

    const db = getDB();
    const runs = await db.collection('runs')
      .find({ playerId: new ObjectId(playerId) })
      .sort({ playedAt: -1 })
      .limit(20)
      .toArray();

    res.json(runs);
  } catch (err: any) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
