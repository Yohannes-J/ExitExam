/**
 * Run once to create an admin account:
 *   node scripts/createAdmin.js
 */
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGO_URI);

const existing = await User.findOne({ email: 'admin@exitexam.com' });
if (existing) {
  console.log('Admin already exists:', existing.email);
} else {
  const admin = await User.create({
    name: 'Admin',
    studentId: 'ADMIN001',
    email: 'admin@exitexam.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administration',
  });
  console.log('✅ Admin created:', admin.email, '/ password: admin123');
}

await mongoose.disconnect();
process.exit(0);
