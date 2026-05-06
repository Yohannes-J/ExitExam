import express from 'express';
import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/results — student's own results
router.get('/', protect, async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate('exam', 'title subject duration passingScore')
      .sort({ submittedAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/results/:id — single result with review
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id).populate('exam');
    if (!result) return res.status(404).json({ message: 'Result not found' });
    if (result.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
