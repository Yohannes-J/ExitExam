import express from 'express';
import School from '../models/School.js';
import Department from '../models/Department.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── Public (authenticated) ──────────────────────────────────

// GET /api/schools — all active schools
router.get('/', protect, async (req, res) => {
  try {
    const schools = await School.find({ isActive: true }).sort({ name: 1 });
    res.json(schools);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/schools/:id/departments — departments for a school
router.get('/:id/departments', protect, async (req, res) => {
  try {
    const depts = await Department.find({ school: req.params.id, isActive: true }).sort({ name: 1 });
    res.json(depts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Admin only ──────────────────────────────────────────────

// POST /api/schools
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name) return res.status(400).json({ message: 'School name is required' });
    const school = await School.create({ name, code });
    res.status(201).json(school);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'School already exists' });
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/schools/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(school);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/schools/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await School.findByIdAndDelete(req.params.id);
    await Department.deleteMany({ school: req.params.id });
    res.json({ message: 'School and its departments deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/schools/:id/departments
router.post('/:id/departments', protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Department name is required' });
    const dept = await Department.create({ name, school: req.params.id });
    res.status(201).json(dept);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Department already exists in this school' });
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/schools/departments/:deptId
router.put('/departments/:deptId', protect, adminOnly, async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.deptId, req.body, { new: true });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/schools/departments/:deptId
router.delete('/departments/:deptId', protect, adminOnly, async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.deptId);
    res.json({ message: 'Department deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
