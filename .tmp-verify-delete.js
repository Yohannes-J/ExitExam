import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './server/models/User.js';
import Exam from './server/models/Exam.js';

dotenv.config({ path: './server/.env' });

await mongoose.connect(process.env.MONGO_URI);

const studentId = 'TEACHER_OWNERSHIP_VERIFY';
const email = 'teacher-ownership-verify@exitexam.com';
const password = 'teacher123';

let teacher = await User.findOne({ studentId });
if (!teacher) {
  teacher = await User.create({
    name: 'Ownership Verify Teacher',
    studentId,
    email,
    password,
    role: 'teacher',
    department: 'Software Engineering',
  });
}

const ownExam = await Exam.create({
  title: 'Ownership Verify Exam',
  description: 'Temporary exam for permission verification',
  subject: 'Software Engineering',
  department: 'Software Engineering',
  duration: 30,
  passingScore: 60,
  isActive: false,
  shuffleQuestions: false,
  questions: [{ text: 'Temporary question', code: '', type: 'mcq', options: ['A', 'B', 'C', 'D'], correctIndex: 0, points: 1 }],
  createdBy: teacher._id,
});

const base = 'http://localhost:5000';
const loginRes = await fetch(base + '/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ studentId, password }),
});
const loginBody = await loginRes.json();
const token = loginBody.token;

const ownDeleteRes = await fetch(base + '/api/admin/exams/' + ownExam._id, {
  method: 'DELETE',
  headers: { Authorization: 'Bearer ' + token },
});
const otherDeleteRes = await fetch(base + '/api/admin/exams/69fcc8904bafadadab29da67', {
  method: 'DELETE',
  headers: { Authorization: 'Bearer ' + token },
});

console.log(JSON.stringify({
  loginStatus: loginRes.status,
  loginBody,
  ownDeleteStatus: ownDeleteRes.status,
  ownDeleteBody: await ownDeleteRes.text(),
  otherDeleteStatus: otherDeleteRes.status,
  otherDeleteBody: await otherDeleteRes.text(),
}, null, 2));

await mongoose.disconnect();
