import mongoose from 'mongoose';

const RoutineItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    time: { type: String, required: true }, // e.g., "06:30"
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const RoutineLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    routineItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoutineItem', required: true },
    date: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
}, { timestamps: true });

RoutineItemSchema.index({ userId: 1, order: 1 });
RoutineLogSchema.index({ userId: 1, date: 1 });
RoutineLogSchema.index({ routineItemId: 1, date: 1 });

export const RoutineItem = mongoose.models.RoutineItem || mongoose.model('RoutineItem', RoutineItemSchema);
export const RoutineLog = mongoose.models.RoutineLog || mongoose.model('RoutineLog', RoutineLogSchema);
