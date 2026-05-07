import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  code: { type: String, default: '' },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  points: { type: Number, default: 1 },
});

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    subject: { type: String, required: true },
    department: { type: String, default: 'All' },
    duration: { type: Number, required: true }, // in minutes
    passingScore: { type: Number, default: 50 }, // percentage
    questions: [questionSchema],
    isActive: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Exam', examSchema);
