import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: String, required: true },
    category: { type: String, default: 'General' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
}, { timestamps: true });

TodoSchema.index({ userId: 1, completed: 1 });
TodoSchema.index({ userId: 1, category: 1 });

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);
