import express from 'express';
import Exam from '../models/Exam.js';
import Result from '../models/Result.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/exams — list active exams for student (filtered by their department)
router.get('/', protect, async (req, res) => {
  try {
    const studentDept = req.user.department || '';

    // Build department filter:
    // - 'All' exams are visible to everyone
    // - dept-specific exams only visible to matching students
    // - empty dept exams only visible if student also has no dept
    const deptFilter = studentDept
      ? { $or: [{ department: 'All' }, { department: studentDept }] }
      : { $or: [{ department: 'All' }, { department: '' }, { department: { $exists: false } }] };

    const exams = await Exam.find({
      isActive: true,
      ...deptFilter,
    }).select('-questions.correctIndex');

    const results = await Result.find({ student: req.user._id }).select('exam');
    const submittedIds = results.map((r) => r.exam.toString());
    const data = exams.map((e) => ({
      ...e.toObject(),
      submitted: submittedIds.includes(e._id.toString()),
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/exams/:id — get exam with questions (no correct answers)
router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).select('-questions.correctIndex');
    if (!exam || !exam.isActive) return res.status(404).json({ message: 'Exam not found' });

    // Check department access
    const studentDept = req.user.department || '';
    const examDept = exam.department || '';
    if (examDept !== 'All' && examDept !== '' && examDept !== studentDept) {
      return res.status(403).json({ message: 'This exam is not available for your department' });
    }

    // Check if already submitted
    const existing = await Result.findOne({ student: req.user._id, exam: exam._id });
    if (existing) return res.status(403).json({ message: 'You have already submitted this exam' });

    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/exams/:id/submit — submit answers
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { answers, timeTaken } = req.body; // answers: [{ questionId, selectedIndex }]
    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isActive) return res.status(404).json({ message: 'Exam not found' });

    const existing = await Result.findOne({ student: req.user._id, exam: exam._id });
    if (existing) return res.status(403).json({ message: 'Already submitted' });

    let score = 0;
    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
    const gradedAnswers = exam.questions.map((q) => {
      const ans = answers?.find((a) => a.questionId === q._id.toString());
      const selectedIndex = ans ? ans.selectedIndex : -1;
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) score += q.points;
      return { questionId: q._id, selectedIndex, isCorrect };
    });

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentage >= exam.passingScore;

    const result = await Result.create({
      student: req.user._id,
      exam: exam._id,
      answers: gradedAnswers,
      score,
      totalPoints,
      percentage,
      passed,
      timeTaken: timeTaken || 0,
    });

    res.status(201).json({ result, passed, percentage, score, totalPoints });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
