import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

  fullName: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    enum: ["superadmin", "coordinator"],
    required: true
  },

  role: {
    type: String,
    default: "coordinator"
  },

  notificationSettings: {

    reports: {
      type: Boolean,
      default: true
    },

    assignments: {
      type: Boolean,
      default: true
    },

    verifications: {
      type: Boolean,
      default: true
    }

  },

  preferences: {

    autoRefresh: {
      type: Boolean,
      default: true
    },

    darkMode: {
      type: Boolean,
      default: true
    }

  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model(
  "User",
  userSchema
);