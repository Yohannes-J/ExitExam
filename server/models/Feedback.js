import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String },
    category: { 
      type: String, 
      enum: ['bug', 'feature', 'ui', 'performance', 'other'], 
      required: true 
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    status: { 
      type: String, 
      enum: ['new', 'read', 'resolved', 'closed'], 
      default: 'new' 
    },
    adminResponse: { type: String, default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);
