import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import Report from './models/Report.js';
import User from './models/User.js'; // Import the new User model

dotenv.config();
const app = express();
const server = http.createServer(app);

// --- CONFIGURATION ---
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

connectDB();

// --- AI ANALYSIS LOGIC ---
async function analyzeSeverity(description) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this emergency report: "${description}". 
    Rate severity from 1 to 10. Provide ONLY a JSON response: {"score": 8, "reason": "Short explanation"}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return { score: 5, reason: "Manual review required due to analysis error" };
  }
}

// --- AUTHENTICATION ROUTES ---

// 1. Register New User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, password: hashedPassword });
    
    await newUser.save();
    res.status(201).json({ success: true, message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

// 2. Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { fullName: user.fullName, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

// --- REPORT ROUTES ---

app.post('/api/reports', upload.single('image'), async (req, res) => {
  try {
    const { name, phone, description, location, category } = req.body;
    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    const analysis = await analyzeSeverity(description);

    const newReport = new Report({
      name, phone, description, location, category, 
      imageUrl, severityScore: analysis.score, aiReason: analysis.reason,
      status: 'Pending'
    });
    
    await newReport.save();
    io.emit('new-report', newReport); // Real-time update for dashboard

    res.status(201).json({ success: true, report: newReport });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports" });
  }
});

// --- UPDATE REPORT STATUS (Approve/Reject) ---
app.patch('/api/reports/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    // Notify all clients that a report status has changed
    io.emit('report-updated', updatedReport);
    
    res.json({ success: true, report: updatedReport });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update report" });
  }
});

// --- SERVER START ---
io.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));