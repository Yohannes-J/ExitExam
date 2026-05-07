/**
 * Fixes the duplicate null email index error.
 * Run once:  node scripts/fixEmailIndex.js
 */
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection.db;
const collection = db.collection('users');

try {
  await collection.dropIndex('email_1');
  console.log('✅ Old email index dropped');
} catch (e) {
  console.log('ℹ️  Index not found or already dropped:', e.message);
}

// Recreate as sparse (allows multiple nulls)
await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
console.log('✅ Sparse email index created — multiple null emails now allowed');

await mongoose.disconnect();
process.exit(0);
