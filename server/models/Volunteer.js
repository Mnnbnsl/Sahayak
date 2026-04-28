import mongoose from "mongoose";

const VolunteerSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    skills: [String], // ["Medical", "Fire"]
    location: String,
    rating: { type: Number, default: 3 },
    tasksCompleted: { type: Number, default: 0 },
    availability: { type: Boolean, default: true }
});

const Volunteer = mongoose.model("Volunteer", VolunteerSchema);

export default Volunteer;