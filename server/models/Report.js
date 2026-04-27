import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  description: { type: String, required: true },
  location: String,
  category: String,
  imageUrl: String,
  severityScore: Number,
  aiReason: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Report', reportSchema);