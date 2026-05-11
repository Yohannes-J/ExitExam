import express from 'express';
import Exam from '../models/Exam.js';
import Result from '../models/Result.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const studentDept = req.user.department || '';

    
    
    
    
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

router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).select('-questions.correctIndex');
    if (!exam || !exam.isActive) return res.status(404).json({ message: 'Exam not found' });

    
    const studentDept = req.user.department || '';
    const examDept = exam.department || '';
    if (examDept !== 'All' && examDept !== '' && examDept !== studentDept) {
      return res.status(403).json({ message: 'This exam is not available for your department' });
    }

    
    const existing = await Result.findOne({ student: req.user._id, exam: exam._id });
    if (existing) return res.status(403).json({ message: 'You have already submitted this exam' });

    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { answers, timeTaken } = req.body; 
    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isActive) return res.status(404).json({ message: 'Exam not found' });

    const existing = await Result.findOne({ student: req.user._id, exam: exam._id });
    if (existing) return res.status(403).json({ message: 'Already submitted' });

    let score = 0;
    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
    const gradedAnswers = exam.questions.map((q) => {
      const ans = answers?.find((a) => a.questionId === q._id.toString());
      const selectedIndex = ans ? ans.selectedIndex : -1;
      const textAnswer = ans ? (ans.textAnswer || '') : '';

      let isCorrect = false;
      if (q.type === 'mcq' || !q.type) {
        isCorrect = selectedIndex === q.correctIndex;
      } else if (q.type === 'truefalse') {
        isCorrect = selectedIndex === q.correctIndex;
      } else if (q.type === 'short' || q.type === 'essay') {
        
        isCorrect = false;
      }

      if (isCorrect) score += q.points;
      return { questionId: q._id, selectedIndex, textAnswer, isCorrect };
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
