import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique name per school
departmentSchema.index({ name: 1, school: 1 }, { unique: true });

export default mongoose.model('Department', departmentSchema);
