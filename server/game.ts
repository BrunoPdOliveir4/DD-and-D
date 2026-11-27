import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from './db';
import { masteryXpRequired, levelFromXp, MASTERY_SKILL_GATES } from '../shared/types';
import type { ClassId } from '../shared/types';

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

// ── Save game results ──
router.post('/save-run', async (req, res) => {
  try {
    const playerId = getPlayerId(req);
    if (!playerId) { res.status(401).json({ error: 'Não autenticado' }); return; }

    const { wave, kills, gold, classId } = req.body;
    if (!wave || !classId) { res.status(400).json({ error: 'Dados incompletos' }); return; }

    const db = getDB();
    const xpEarned = kills * 10 + wave * 25 + gold * 2;

    // Get current player first
    const player = await db.collection('players').findOne({ _id: new ObjectId(playerId) });
    if (!player) { res.status(404).json({ error: 'Jogador não encontrado' }); return; }

    // ── Mastery calculation ──
    const classProgress = player.classProgress?.[classId];
    let currentMastery = classProgress?.mastery ?? 0;
    let currentClassXp = (classProgress?.xp ?? 0) + xpEarned;
    let masteryUps = 0;

    // Check for mastery level ups (can go up multiple levels in one run)
    while (currentClassXp >= masteryXpRequired(currentMastery)) {
      currentClassXp -= masteryXpRequired(currentMastery);
      currentMastery++;
      masteryUps++;
    }

    // ── Auto-unlock mastery-gated skills ──
    const gates = MASTERY_SKILL_GATES[classId as ClassId] ?? [];
    const alreadyUnlocked = new Set(classProgress?.unlockedAbilities ?? []);
    const newlyUnlocked: string[] = [];
    for (const gate of gates) {
      if (currentMastery >= gate.masteryRequired && !alreadyUnlocked.has(gate.abilityId)) {
        newlyUnlocked.push(gate.abilityId);
      }
    }

    // ── Class level (separate from mastery) ──
    const classLevel = Math.floor(Math.sqrt(currentClassXp / 100)) + 1;

    // Update player
    const updateOps: any = {
      $inc: {
        xp: xpEarned,
        gold: gold,
      },
      $set: {
        [`classProgress.${classId}.xp`]: currentClassXp,
        [`classProgress.${classId}.mastery`]: currentMastery,
        [`classProgress.${classId}.level`]: classLevel,
      },
    };
    // Add mastery-gated skills
    if (newlyUnlocked.length > 0) {
      updateOps.$addToSet = {
        [`classProgress.${classId}.unlockedAbilities`]: { $each: newlyUnlocked },
      };
    }

    const result = await db.collection('players').findOneAndUpdate(
      { _id: new ObjectId(playerId) },
      updateOps,
      { returnDocument: 'after' },
    );

    if (!result) { res.status(404).json({ error: 'Erro ao atualizar' }); return; }

    // Global level (harder, separate from mastery)
    const totalXp = (player.xp ?? 0) + xpEarned;
    const globalLvl = levelFromXp(totalXp);
    const newLevel = globalLvl.level;
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
      masteryUps,
      playedAt: new Date().toISOString(),
    });

    // Return updated profile data
    const updatedProfile = await db.collection('players').findOne({ _id: new ObjectId(playerId) });

    res.json({
      xpEarned,
      goldEarned: gold,
      newLevel: Math.max(newLevel, result.level),
      totalXp,
      masteryUps,
      newMastery: currentMastery,
      classLevel,
      nextMasteryXp: masteryXpRequired(currentMastery),
      currentClassXp,
      // Send full updated profile so client can sync
      profile: updatedProfile ? {
        id: updatedProfile._id.toString(),
        username: updatedProfile.username,
        displayName: updatedProfile.displayName,
        level: Math.max(newLevel, updatedProfile.level),
        xp: updatedProfile.xp,
        gold: updatedProfile.gold,
        classProgress: updatedProfile.classProgress,
        guildId: updatedProfile.guildId,
        tutorialDone: updatedProfile.tutorialDone,
        createdAt: updatedProfile.createdAt,
      } : null,
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
