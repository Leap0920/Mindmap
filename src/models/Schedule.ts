import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    teacher: { type: String },
    room: { type: String },
    time: { type: String, required: true }, // e.g., "08:00 - 09:30"
    days: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    color: { type: String, default: '#ffffff' },
    notes: { type: String },
}, { timestamps: true });

ScheduleSchema.index({ userId: 1 });

export default mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
