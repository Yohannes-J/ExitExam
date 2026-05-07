/**
 * Reset admin password from command line:
 *
 *   node scripts/updateAdmin.js newpassword123
 *
 * Or edit NEW_PASSWORD below and run:
 *   node scripts/updateAdmin.js
 */
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Get password from command line arg, or fallback to hardcoded value
const NEW_PASSWORD = process.argv[2] || 'admin123';
const NEW_EMAIL    = process.argv[3] || null; // optional: pass new email as 2nd arg

if (!NEW_PASSWORD || NEW_PASSWORD.length < 6) {
  console.error('❌ Password must be at least 6 characters');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const admin = await User.findOne({ role: 'admin' });
if (!admin) {
  console.error('❌ No admin account found. Run createAdmin.js first.');
  await mongoose.disconnect();
  process.exit(1);
}

admin.password = NEW_PASSWORD; // pre-save hook hashes it
if (NEW_EMAIL) admin.email = NEW_EMAIL;
await admin.save();

console.log('✅ Admin password reset successfully');
console.log('   Name    :', admin.name);
console.log('   Email   :', admin.email);
console.log('   Password:', NEW_PASSWORD, '← use this to login');

await mongoose.disconnect();
process.exit(0);
