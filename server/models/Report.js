import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  location: {
    type: String
  },

  // NEW
  latitude: {
    type: Number
  },

  // NEW
  longitude: {
    type: Number
  },

  category: {
    type: String
  },

  imageUrl: {
    type: String
  },

  severityScore: {
    type: Number
  },

  confidence: {
    type: Number
  },

  aiReasoning: {
    type: String
  },

    status: {
    type: String,
    enum: [
      "Pending",
      "Approved",
      "Assigned",
      "In_Progress",
      "Completed",
      "Verified",
      "Rejected"
    ],
    default: "Pending"
   }, 

  assignedVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Report', ReportSchema);