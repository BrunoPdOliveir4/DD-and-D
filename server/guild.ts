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

// ── Create guild ──
router.post('/create', async (req, res) => {
  try {
    const playerId = getPlayerId(req);
    if (!playerId) { res.status(401).json({ error: 'Não autenticado' }); return; }

    const { name, tag } = req.body;
    if (!name || name.length < 3 || name.length > 20) {
      res.status(400).json({ error: 'Nome deve ter 3-20 caracteres' }); return;
    }
    if (!tag || tag.length < 2 || tag.length > 4) {
      res.status(400).json({ error: 'Tag deve ter 2-4 caracteres' }); return;
    }

    const db = getDB();

    // Check player not already in a guild
    const player = await db.collection('players').findOne({ _id: new ObjectId(playerId) });
    if (!player) { res.status(404).json({ error: 'Jogador não encontrado' }); return; }
    if (player.guildId) { res.status(400).json({ error: 'Você já está em uma guilda' }); return; }

    // Create guild
    const result = await db.collection('guilds').insertOne({
      name,
      tag: tag.toUpperCase(),
      leaderId: new ObjectId(playerId),
      memberIds: [new ObjectId(playerId)],
      level: 1,
      xp: 0,
      createdAt: new Date().toISOString(),
    });

    // Update player
    await db.collection('players').updateOne(
      { _id: new ObjectId(playerId) },
      { $set: { guildId: result.insertedId.toString() } },
    );

    res.status(201).json({ id: result.insertedId.toString(), name, tag: tag.toUpperCase() });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: 'Nome ou tag já existe' }); return;
    }
    console.error('Create guild error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── Get my guild ──
router.get('/mine', async (req, res) => {
  try {
    const playerId = getPlayerId(req);
    if (!playerId) { res.status(401).json({ error: 'Não autenticado' }); return; }

    const db = getDB();
    const player = await db.collection('players').findOne({ _id: new ObjectId(playerId) });
    if (!player?.guildId) { res.status(404).json({ error: 'Sem guilda' }); return; }

    const guild = await db.collection('guilds').findOne({ _id: new ObjectId(player.guildId) });
    if (!guild) { res.status(404).json({ error: 'Guilda não encontrada' }); return; }

    // Get member details
    const members = await db.collection('players')
      .find({ _id: { $in: guild.memberIds } })
      .project({ _id: 1, displayName: 1, level: 1 })
      .toArray();

    res.json({
      id: guild._id.toString(),
      name: guild.name,
      tag: guild.tag,
      leaderId: guild.leaderId.toString(),
      level: guild.level,
      xp: guild.xp,
      memberCount: guild.memberIds.length,
      members: members.map(m => ({ id: m._id.toString(), displayName: m.displayName, level: m.level })),
    });
  } catch (err: any) {
    console.error('Get guild error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── Join guild by name ──
router.post('/join', async (req, res) => {
  try {
    const playerId = getPlayerId(req);
    if (!playerId) { res.status(401).json({ error: 'Não autenticado' }); return; }

    const { guildName } = req.body;
    const db = getDB();

    const player = await db.collection('players').findOne({ _id: new ObjectId(playerId) });
    if (player?.guildId) { res.status(400).json({ error: 'Já está em uma guilda' }); return; }

    const guild = await db.collection('guilds').findOne({ name: guildName });
    if (!guild) { res.status(404).json({ error: 'Guilda não encontrada' }); return; }
    if (guild.memberIds.length >= 50) { res.status(400).json({ error: 'Guilda cheia (máx 50)' }); return; }

    await db.collection('guilds').updateOne(
      { _id: guild._id },
      { $push: { memberIds: new ObjectId(playerId) } as any },
    );
    await db.collection('players').updateOne(
      { _id: new ObjectId(playerId) },
      { $set: { guildId: guild._id.toString() } },
    );

    res.json({ success: true, guildId: guild._id.toString() });
  } catch (err: any) {
    console.error('Join guild error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── Leave guild ──
router.post('/leave', async (req, res) => {
  try {
    const playerId = getPlayerId(req);
    if (!playerId) { res.status(401).json({ error: 'Não autenticado' }); return; }

    const db = getDB();
    const player = await db.collection('players').findOne({ _id: new ObjectId(playerId) });
    if (!player?.guildId) { res.status(400).json({ error: 'Não está em uma guilda' }); return; }

    const guild = await db.collection('guilds').findOne({ _id: new ObjectId(player.guildId) });
    if (!guild) { res.status(404).json({ error: 'Guilda não encontrada' }); return; }

    // Leader can't leave (must transfer first)
    if (guild.leaderId.toString() === playerId) {
      if (guild.memberIds.length > 1) {
        res.status(400).json({ error: 'Transfira a liderança antes de sair' }); return;
      }
      // Last member: delete guild
      await db.collection('guilds').deleteOne({ _id: guild._id });
    } else {
      await db.collection('guilds').updateOne(
        { _id: guild._id },
        { $pull: { memberIds: new ObjectId(playerId) } as any },
      );
    }

    await db.collection('players').updateOne(
      { _id: new ObjectId(playerId) },
      { $set: { guildId: null } },
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error('Leave guild error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
