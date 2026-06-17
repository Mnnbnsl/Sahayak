import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report"
  },

  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Volunteer"
  },

  status: {
    type: String,
    default: "Assigned"
  },

  proofImageUrl: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Task", TaskSchema);