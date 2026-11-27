import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env');

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();

  // Create indexes
  await db.collection('players').createIndex({ username: 1 }, { unique: true });
  await db.collection('guilds').createIndex({ name: 1 }, { unique: true });
  await db.collection('guilds').createIndex({ tag: 1 }, { unique: true });

  console.log('✅ MongoDB connected');
  return db;
}

export function getDB(): Db {
  if (!db) throw new Error('Database not connected — call connectDB() first');
  return db;
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
