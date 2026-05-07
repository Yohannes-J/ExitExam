import express from 'express';
import Exam from '../models/Exam.js';
import Result from '../models/Result.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/admin/exams
router.get('/exams', async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/exams
router.post('/exams', async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/exams/:id
router.put('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/exams/:id
router.delete('/exams/:id', async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/results
router.get('/results', async (req, res) => {
  try {
    const results = await Result.find()
      .populate('student', 'name studentId email department')
      .populate('exam', 'title subject')
      .sort({ submittedAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/students — admin creates a student account
router.post('/students', async (req, res) => {
  try {
    const { name, studentId, email, password, department } = req.body;
    if (!name || !studentId || !email || !password) {
      return res.status(400).json({ message: 'Name, Student ID, email and password are required' });
    }
    const exists = await User.findOne({ $or: [{ email }, { studentId }] });
    if (exists) return res.status(409).json({ message: 'Email or Student ID already exists' });
    const user = await User.create({ name, studentId, email, password, department, role: 'student' });
    res.status(201).json({ id: user._id, name: user.name, studentId: user.studentId, email: user.email, department: user.department, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/students/:id — update student info
router.put('/students/:id', async (req, res) => {
  try {
    const { name, studentId, email, department, password } = req.body;
    const update = { name, studentId, email, department };
    // Only update password if provided
    if (password) {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'Student not found' });
      user.name = name;
      user.studentId = studentId;
      user.email = email;
      user.department = department;
      user.password = password; // triggers pre-save hash
      await user.save();
      return res.json({ id: user._id, name: user.name, studentId: user.studentId, email: user.email, department: user.department });
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Student not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/students/:id
router.delete('/students/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
