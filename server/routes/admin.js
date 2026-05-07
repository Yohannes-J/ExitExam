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
    const students = await User.find({ role: { $in: ['student', 'admin'] } })
      .select('-password')
      .sort({ role: 1, createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/students — create a STUDENT (name, studentId, department, password)
router.post('/students', async (req, res) => {
  try {
    const { name, studentId, department, password } = req.body;
    if (!name || !studentId || !password) {
      return res.status(400).json({ message: 'Full name, Student ID and password are required' });
    }
    const exists = await User.findOne({ studentId });
    if (exists) return res.status(409).json({ message: 'Student ID already exists' });
    const user = await User.create({
      name, studentId, department, password, role: 'student',
    });
    res.status(201).json({
      id: user._id, name: user.name, studentId: user.studentId,
      department: user.department, role: user.role, createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/admins — create an ADMIN/TEACHER (name, email, department, role)
router.post('/admins', async (req, res) => {
  try {
    const { name, email, department, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }
    const validRole = ['admin'].includes(role) ? role : 'admin';
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    // Generate a studentId-like identifier for admin
    const adminId = `ADM-${Date.now()}`;
    const defaultPassword = 'admin123';

    const user = await User.create({
      name, email, department, role: validRole,
      studentId: adminId, password: defaultPassword,
    });
    res.status(201).json({
      id: user._id, name: user.name, email: user.email, studentId: user.studentId,
      department: user.department, role: user.role, createdAt: user.createdAt,
      defaultPassword,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/students/:id — update any user
router.put('/students/:id', async (req, res) => {
  try {
    const { name, studentId, email, department, password, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (department !== undefined) user.department = department;
    if (role && ['student', 'admin'].includes(role)) user.role = role;

    // Student fields
    if (studentId) user.studentId = studentId;

    // Admin fields
    if (email) user.email = email;

    // Password reset
    if (password) user.password = password;

    await user.save();
    res.json({
      id: user._id, name: user.name, studentId: user.studentId,
      email: user.email, department: user.department, role: user.role,
    });
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

// DELETE /api/admin/results/:id
router.delete('/results/:id', async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json({ message: 'Result deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
