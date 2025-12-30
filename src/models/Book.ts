import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    author: { type: String },
    category: { type: String, default: 'General' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    status: { type: String, enum: ['wishlist', 'reading', 'completed'], default: 'wishlist' },
    notes: { type: String },
    startDate: { type: Date },
    finishDate: { type: Date },
    coverUrl: { type: String },
}, { timestamps: true });

BookSchema.index({ userId: 1 });
BookSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Book || mongoose.model('Book', BookSchema);
