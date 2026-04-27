import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema({
    reportId: mongoose.Schema.Types.ObjectId,
    volunteerName: String,
    volunteerId: String,
    proofImageUrl: String,
    notes: String,
    aiConfidence: Number,
    status: { type: String, default: 'Pending' }
});

export default mongoose.model('Verification', verificationSchema);