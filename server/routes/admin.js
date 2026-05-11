import express from 'express';
import Exam from '../models/Exam.js';
import Result from '../models/Result.js';
import User from '../models/User.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, adminOnly); 

const isTeacher = (user) => user.role === 'teacher';

const teacherDepts = (user) => {
  if (user.departments && user.departments.length > 0) return user.departments;
  if (user.department) return [user.department];
  return [];
};

router.get('/exams', async (req, res) => {
  try {
    const query = isTeacher(req.user)
      ? { $or: [{ department: { $in: [req.user.department, 'All', ...teacherDepts(req.user)] } }] }
      : {};
    const exams = await Exam.find(query).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/exams', async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    
    if (isTeacher(req.user)) {
      const myDepts = teacherDepts(req.user);
      if (!myDepts.includes(data.department)) {
        data.department = myDepts[0] || req.user.department;
      }
    }
    const exam = await Exam.create(data);
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (isTeacher(req.user) && exam.department !== req.user.department && exam.department !== 'All') {
      return res.status(403).json({ message: 'Access denied to this exam' });
    }
    const updateData = { ...req.body };
    
    if (isTeacher(req.user)) updateData.department = req.user.department;
    const updated = await Exam.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (isTeacher(req.user) && exam.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/results', async (req, res) => {
  try {
    let results = await Result.find()
      .populate('student', 'name studentId email department')
      .populate('exam', 'title subject department')
      .sort({ submittedAt: -1 });

    if (isTeacher(req.user)) {
      const myDepts = teacherDepts(req.user);
      results = results.filter(r =>
        myDepts.includes(r.student?.department) ||
        myDepts.includes(r.exam?.department) ||
        r.exam?.department === 'All'
      );
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/students', async (req, res) => {
  try {
    const query = isTeacher(req.user)
      ? { role: 'student', department: { $in: teacherDepts(req.user) } }
      : { role: { $in: ['student', 'admin', 'teacher'] } };
    const students = await User.find(query).select('-password').sort({ role: 1, createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/students', async (req, res) => {
  try {
    const { name, studentId, department, password } = req.body;
    if (!name || !studentId || !password) {
      return res.status(400).json({ message: 'Full name, Student ID and password are required' });
    }
    if (password.length < 6 || !/[a-zA-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters and contain at least 1 letter' });
    }
    const exists = await User.findOne({ studentId });
    if (exists) return res.status(409).json({ message: 'Student ID already exists' });
    
    const dept = isTeacher(req.user) ? req.user.department : department;
    const user = await User.create({ name, studentId, department: dept, password, role: 'student' });
    res.status(201).json({
      id: user._id, name: user.name, studentId: user.studentId,
      department: user.department, role: user.role, createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admins', superAdminOnly, async (req, res) => {
  try {
    const { name, email, department, departments, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }
    const validRole = ['admin', 'teacher'].includes(role) ? role : 'teacher';
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const adminId = `ADM-${Date.now()}`;
    const defaultPassword = 'admin123';
    const user = await User.create({
      name, email,
      department: department || '',
      departments: validRole === 'teacher' ? (departments || []) : [],
      role: validRole,
      studentId: adminId, password: defaultPassword,
    });
    res.status(201).json({
      id: user._id, name: user.name, email: user.email, studentId: user.studentId,
      department: user.department, departments: user.departments, role: user.role,
      createdAt: user.createdAt, defaultPassword,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/students/:id', async (req, res) => {
  try {
    const { name, studentId, email, department, password, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (department !== undefined) user.department = department;
    if (Array.isArray(req.body.departments)) user.departments = req.body.departments;
    if (role && ['student', 'admin', 'teacher'].includes(role) && !isTeacher(req.user)) user.role = role;
    if (studentId) user.studentId = studentId;
    if (email) user.email = email;
    if (password) user.password = password;
    await user.save();
    res.json({ id: user._id, name: user.name, studentId: user.studentId, email: user.email, department: user.department, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(403).json({ message: 'Cannot delete the last admin account' });
      }
    }
    if (isTeacher(req.user) && user.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/results/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('student', 'name studentId department email')
      .populate('exam');
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
