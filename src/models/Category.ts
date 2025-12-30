import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["todo", "habit"], default: "todo" },
}, { timestamps: true });

// Prevent duplicate categories for the same user/type
CategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
