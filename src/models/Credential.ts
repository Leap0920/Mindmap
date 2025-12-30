import mongoose from 'mongoose';

const CredentialSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    site: { type: String, required: true },
    url: { type: String },
    username: { type: String, required: true },
    password: { type: String, required: true }, // Encrypted
    notes: { type: String },
    category: { type: String, default: 'General' },
    lastUsed: { type: Date },
}, { timestamps: true });

CredentialSchema.index({ userId: 1 });
CredentialSchema.index({ userId: 1, site: 1 });

export default mongoose.models.Credential || mongoose.model('Credential', CredentialSchema);
