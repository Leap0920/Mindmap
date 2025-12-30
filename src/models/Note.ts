import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: ['notepad', 'journal', 'notebook'], default: 'notepad' },
    subject: { type: String }, // For subject notebooks
    isLocked: { type: Boolean, default: false },
    passwordHash: { type: String }, // For locked notes
    tags: [{ type: String }],
    mood: { type: String }, // For journal entries
    date: { type: Date, default: Date.now }, // For journal entries
}, { timestamps: true });

NoteSchema.index({ userId: 1, type: 1 });
NoteSchema.index({ userId: 1, date: -1 });

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
