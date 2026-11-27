import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import authRouter from './auth';
import gameRouter from './game';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

async function main() {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/game', gameRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', game: 'DD&D', version: '0.1.0' });
  });

  app.listen(PORT, () => {
    console.log(`🎮 DD&D server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
