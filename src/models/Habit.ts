import mongoose from 'mongoose';

const HabitEntrySchema = new mongoose.Schema({
    habitId: { type: String, required: true },
    name: { type: String, required: true },
    completed: { type: Boolean, default: false },
});

const HabitDaySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    entries: [HabitEntrySchema],
}, { timestamps: true });

// User's custom habit settings (what habits they are tracking)
const HabitDefinitionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    icon: { type: String },
    color: { type: String, default: '#ffffff' },
}, { timestamps: true });

export const HabitDay = mongoose.models.HabitDay || mongoose.model('HabitDay', HabitDaySchema);
export const HabitDefinition = mongoose.models.HabitDefinition || mongoose.model('HabitDefinition', HabitDefinitionSchema);
