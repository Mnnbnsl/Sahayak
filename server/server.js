import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectDB from './config/db.js';
import Report from './models/Report.js';

dotenv.config();
const app = express();
const server = http.createServer(app);

// 1. Cloudinary & Gemini Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Socket.io Setup
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

connectDB();

// --- AI SEVERITY ANALYSIS LOGIC ---
async function analyzeSeverity(description) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Act as an emergency dispatcher. Analyze this report: "${description}". 
    Rate severity 1-10. Return ONLY JSON: {"score": number, "reason": "short explanation"}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Clean JSON formatting if AI adds markdown
    const cleanJson = responseText.replace(/```json|```/g, "");
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Error:", error);
    return { score: 5, reason: "Manual analysis needed" };
  }
}

// --- API ROUTES ---
app.post('/api/reports', upload.single('image'), async (req, res) => {
  try {
    const { name, phone, description, location, category } = req.body;
    let imageUrl = "";

    // A. Upload Image to Cloudinary if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    // B. Get AI Analysis
    const analysis = await analyzeSeverity(description);

    // C. Save to Database
    const newReport = new Report({
      name, phone, description, location, category, 
      imageUrl, severityScore: analysis.score, aiReason: analysis.reason
    });
    await newReport.save();

    // D. Notify Admin via Socket.io
    io.emit('new-report', newReport);

    res.status(201).json({ success: true, report: newReport });
  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

io.on('connection', (socket) => {
  console.log('Admin Connected:', socket.id);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));