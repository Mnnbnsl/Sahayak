const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173" } // Your Vite frontend URL
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/sahayak', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"));

// --- DATABASE MODELS ---

const ReportSchema = new mongoose.Schema({
    category: String,
    description: String,
    location: String,
    phone: String,
    status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
    confidence: Number,
    aiReasoning: String,
    timestamp: { type: Date, default: Date.now }
});

const VerificationSchema = new mongoose.Schema({
    reportId: mongoose.Schema.Types.ObjectId,
    volunteerName: String,
    volunteerId: String,
    proofImageUrl: String,
    notes: String,
    aiConfidence: Number,
    status: { type: String, default: 'Pending' }
});

const Report = mongoose.model('Report', ReportSchema);
const Verification = mongoose.model('Verification', VerificationSchema);

// --- API ROUTES ---

// 1. Fetch all reports for the Review Queue
app.get('/api/reports', async (req, res) => {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
});

// 2. Submit a new request (Triggers live update)
app.post('/api/reports', async (req, res) => {
    const newReport = new Report(req.body);
    await newReport.save();
    io.emit('new-report', newReport); // Real-time push to dashboard
    res.status(201).json(newReport);
});

// 3. Update report status (Approve/Reject logic)
app.patch('/api/reports/:id', async (req, res) => {
    const { status } = req.body;
    const updated = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updated);
});

// 4. Fetch Verification Queue
app.get('/api/verifications', async (req, res) => {
    const list = await Verification.find({ status: 'Pending' });
    res.json(list);
});

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
    console.log('Admin connected:', socket.id);
    socket.on('disconnect', () => console.log('Admin disconnected'));
});

server.listen(5000, () => console.log("Server running on port 5000"));