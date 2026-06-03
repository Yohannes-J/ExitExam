import express from 'express';
import Feedback from '../models/Feedback.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Submit feedback (students)
router.post('/', protect, async (req, res) => {
  try {
    const { category, message, rating } = req.body;
    
    if (!category || !message) {
      return res.status(400).json({ message: 'Category and description are required' });
    }

    // Auto-generate title from first 50 chars of message
    const title = message.substring(0, 50).trim();

    const feedback = new Feedback({
      studentId: req.user._id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      category,
      title,
      message,
      rating: rating || null,
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all feedback (admin only)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { status, category } = req.query;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;

    const feedback = await Feedback.find(query)
      .populate('studentId', 'name studentId email department')
      .populate('respondedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get unread feedback count (for alerts)
router.get('/unread/count', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const count = await Feedback.countDocuments({ status: 'new' });
      res.json({ unreadCount: count });
    } else {
      const count = await Feedback.countDocuments({ 
        studentId: req.user._id, 
        status: { $ne: 'closed' }
      });
      res.json({ unreadCount: count });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get student's own feedback
router.get('/student/my', protect, async (req, res) => {
  try {
    const feedback = await Feedback.find({ studentId: req.user._id })
      .populate('respondedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single feedback
router.get('/:id', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('studentId', 'name studentId email department')
      .populate('respondedBy', 'name');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Only allow student to view own feedback or admin to view all
    const isOwner = feedback.studentId._id.toString() === req.user._id.toString() || 
                    feedback.studentId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update feedback (admin or student who owns it)
router.put('/:id', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check authorization
    const isOwner = feedback.studentId._id.toString() === req.user._id.toString() || 
                    feedback.studentId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Students can only edit if feedback status is 'new'
    if (isOwner && !isAdmin && feedback.status !== 'new') {
      return res.status(403).json({ message: 'Can only edit feedback with status "new"' });
    }

    // Students can update category, message, rating
    if (isOwner && !isAdmin) {
      const { category, message, rating } = req.body;
      if (category) feedback.category = category;
      if (message) {
        feedback.message = message;
        // Update title from first 50 chars of message
        feedback.title = message.substring(0, 50).trim();
      }
      if (rating !== undefined) feedback.rating = rating;
    }

    // Admin can update status and add response
    if (isAdmin) {
      const { status, adminResponse } = req.body;
      if (status) feedback.status = status;
      if (adminResponse !== undefined) {
        feedback.adminResponse = adminResponse;
        feedback.respondedBy = req.user._id;
        feedback.respondedAt = new Date();
      }
    }

    await feedback.save();
    res.json({ message: 'Feedback updated', feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete feedback (admin or student who owns it)
router.delete('/:id', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check authorization
    const isOwner = feedback.studentId._id.toString() === req.user._id.toString() || 
                    feedback.studentId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Students can only delete if feedback status is 'new'
    if (isOwner && !isAdmin && feedback.status !== 'new') {
      return res.status(403).json({ message: 'Can only delete feedback with status "new"' });
    }

    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
