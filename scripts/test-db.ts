import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db();
  const collections = await db.listCollections().toArray();
  console.log('✅ MongoDB connected! DB:', db.databaseName);
  console.log('Collections:', collections.map(c => c.name));
  await client.close();
}

test().catch(e => { console.error('❌', e.message); process.exit(1); });
