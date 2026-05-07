/**
 * Update admin email or password:
 *   node scripts/updateAdmin.js
 */
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGO_URI);

const admin = await User.findOne({ role: 'admin' });
if (!admin) {
  console.log('❌ No admin found. Run createAdmin.js first.');
  process.exit(1);
}

// ── Change these values as needed ──────────────────────
const NEW_EMAIL    = 'admin@exitexam.com';   // change if needed
const NEW_PASSWORD = 'admin123';             // change to a strong password
// ───────────────────────────────────────────────────────

admin.email    = NEW_EMAIL;
admin.password = NEW_PASSWORD; // pre-save hook will hash it
await admin.save();

console.log('✅ Admin updated');
console.log('   Email   :', admin.email);
console.log('   Password: (hashed — use the value you set above)');

await mongoose.disconnect();
process.exit(0);
