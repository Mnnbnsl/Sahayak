import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer"
    },

    title: String,

    message: String,

    type: {
      type: String,
      default: "TASK"
    },

    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Notification",
  NotificationSchema
);