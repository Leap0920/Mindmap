import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    author: { type: String },
    category: { type: String, default: 'General' },
    status: { type: String, enum: ['wishlist', 'reading', 'completed'], default: 'wishlist' },
    notes: { type: String },
    startDate: { type: Date },
    finishDate: { type: Date },
    coverUrl: { type: String },
    totalPages: { type: Number, default: 0 },
    currentPage: { type: Number, default: 0 },
    genre: { type: String },
    description: { type: String },
    isFavorite: { type: Boolean, default: false },
    tags: [{ type: String }],
    review: { type: String },
    recommendedBy: { type: String },
}, { timestamps: true });

BookSchema.index({ userId: 1 });
BookSchema.index({ userId: 1, status: 1 });
BookSchema.index({ userId: 1, isFavorite: 1 });

export default mongoose.models.Book || mongoose.model('Book', BookSchema);
