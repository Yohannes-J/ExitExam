/**
 * Sets department='All' on any exam that has empty/missing department.
 * Run once: node scripts/fixExamDepts.js
 */
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from '../models/Exam.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGO_URI);

const result = await Exam.updateMany(
  { $or: [{ department: '' }, { department: { $exists: false } }] },
  { $set: { department: 'All' } }
);

console.log(`✅ Fixed ${result.modifiedCount} exam(s) — set department to 'All'`);

await mongoose.disconnect();
process.exit(0);
