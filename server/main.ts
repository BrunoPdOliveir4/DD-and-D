import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDB } from './db';
import authRouter from './auth';
import gameRouter from './game';
import guildRouter from './guild';
import classProgressRouter from './class-progress';
import type { ClassId } from '../shared/types';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

const STARTER_ABILITY_IDS: Record<ClassId, string[]> = {
  hunter: ['hnt_rain_arrows', 'hnt_agile_retreat', 'hnt_eagle_eye', 'hnt_arrow_storm', 'hnt_piercing_arrow'],
  berserker: ['bsk_axe_throw', 'bsk_war_cry', 'bsk_bloodlust', 'bsk_fury_slam', 'bsk_cleave'],
  runekeeper: ['rk_frost_rune', 'rk_fire_rune', 'rk_summon_golem', 'rk_rune_shield', 'rk_arcane_bolt'],
  riftblade: ['rb_blink_strike', 'rb_void_mark', 'rb_phase_shift', 'rb_spatial_rift', 'rb_shadow_blade'],
  trickster: ['tk_juggle', 'tk_smoke_mirror', 'tk_card_trick', 'tk_vanish', 'tk_poison_flask'],
};

async function migrateLegacyAccounts(): Promise<void> {
  const db = getDB();
  const players = await db.collection('players').find({}).toArray();
  let migrated = 0;
  const classIds: ClassId[] = ['berserker', 'hunter', 'runekeeper', 'riftblade', 'trickster'];

  for (const player of players) {
    const updates: Record<string, any> = {};
    for (const classId of classIds) {
      const progress = player.classProgress?.[classId];
      if (!progress) {
        // Class entry missing entirely — create it
        updates[`classProgress.${classId}`] = {
          unlocked: true, xp: 0, level: 1, mastery: 0,
          unlockedAbilities: [...STARTER_ABILITY_IDS[classId]],
          equippedAbilities: [...STARTER_ABILITY_IDS[classId]],
        };
      } else {
        if (progress.unlocked !== true) {
          updates[`classProgress.${classId}.unlocked`] = true;
        }
        // Ensure 5 starters are in unlockedAbilities
        const existing = new Set(progress.unlockedAbilities ?? []);
        const missing = STARTER_ABILITY_IDS[classId].filter(id => !existing.has(id));
        if (missing.length > 0) {
          updates[`classProgress.${classId}.unlockedAbilities`] = [
            ...(progress.unlockedAbilities ?? []), ...missing
          ];
        }
        // Ensure equippedAbilities has at least 5 (backfill if fewer)
        const equipped = progress.equippedAbilities ?? [];
        if (equipped.length < 5) {
          const allUnlocked = [...new Set([...(progress.unlockedAbilities ?? []), ...missing])];
          const toAdd = allUnlocked.filter((id: string) => !equipped.includes(id)).slice(0, 5 - equipped.length);
          if (toAdd.length > 0) {
            updates[`classProgress.${classId}.equippedAbilities`] = [...equipped, ...toAdd];
          }
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      await db.collection('players').updateOne({ _id: player._id }, { $set: updates });
      migrated++;
    }
  }
  if (migrated > 0) console.log(`📦 Migrated ${migrated} legacy account(s)`);
}

async function main() {
  await connectDB();

  // Migrate legacy accounts: ensure all classes have unlocked=true and 5 starter abilities
  await migrateLegacyAccounts();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/game', gameRouter);
  app.use('/api/guild', guildRouter);
  app.use('/api/class', classProgressRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', game: 'DD&D', version: '0.1.0' });
  });

  app.listen(PORT, () => {
    console.log(`🎮 DD&D server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
