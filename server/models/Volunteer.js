import mongoose from "mongoose";

const VolunteerSchema = new mongoose.Schema({
  name: {
     type: String,
    required: true
    },

  email: {
    type: String,
    unique: true,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  phone: {
    type: String
  },

  skills: [String],

  location: String,

  latitude: Number,

  longitude: Number,

  availability: {
    type: Boolean,
    default: true
  },

  rating: {
    type: Number,
    default: 5
  },

  tasksCompleted: {
    type: Number,
    default: 0
  },

  profileImage: String
});

export default mongoose.model(
  "Volunteer",
  VolunteerSchema
);