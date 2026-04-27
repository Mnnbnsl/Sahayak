import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },

    status: { 
        type: String, 
        default: "ASSIGNED" // ASSIGNED → COMPLETED → VERIFIED
    },

    proofImage: String,
    verified: { type: Boolean, default: false }
});

const Task = mongoose.model("Task", TaskSchema);

export default Task;