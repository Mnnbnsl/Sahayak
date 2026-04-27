import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import connectDB from './config/db.js';
import Report from './models/Report.js';
import Verification from './models/Verification.js';
import Task from './models/Task.js';
import Volunteer from './models/Volunteer.js';
import User from './models/User.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
connectDB(); // Connect to MongoDB
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files


const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173" } // Your Vite frontend URL
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// File Upload

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// AI Analysis Function

async function analyzeWithLLM(data) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("No GEMINI_API_KEY provided. Using fallback logic.");
        return {
            is_incident: true,
            severity_score: 5,
            confidence: 0.95, // high confidence to test auto dispatch
            reasoning: "Fallback due to missing API key"
        };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
### ROLE
You are an expert Emergency Response Dispatcher and Incident Analyst. Your goal is to triage incoming reports to determine if they require immediate professional intervention.

### INPUT DATA
- **Category:** ${data.category}
- **Location:** ${data.location}
- **Description:** ${data.description}

### EVALUATION CRITERIA
1. **is_incident**: Set to true ONLY if the description involves an active threat to life, property, public safety, or the environment. False for general inquiries, non-emergencies, or completed historical events.
2. **severity_score (1-10)**:
   - **1-3 (Low)**: Minor property damage, non-life-threatening issues (e.g., minor water leak, parking violation).
   - **4-6 (Medium)**: Significant damage or risk of injury (e.g., localized fire, minor car accident with no trapped passengers).
   - **7-10 (High/Critical)**: Immediate life threat, mass casualties, or widespread disaster (e.g., structural collapse, active shooter, cardiac arrest).
3. **confidence**: A decimal between 0 and 1 representing how certain you are based on the clarity of the description.

### CONSTRAINTS
- Return **STRICT JSON ONLY**.
- Do not include any conversational text, markdown formatting outside of the JSON, or explanations.
- The "reasoning" field must cite specific cues from the description.

### OUTPUT SCHEMA
{
  "is_incident": boolean,
  "severity_score": number,
  "confidence": number,
  "reasoning": "string"
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
        return JSON.parse(text);
    } catch (err) {
        console.error("LLM parse error:", text);

        // fallback (VERY IMPORTANT)
        return {
            is_incident: true,
            severity_score: 5,
            confidence: 0.5,
            reasoning: "Fallback due to parsing error"
        };
    }
}

function decideStatus(ai) {
    if (!ai.is_incident) return "Rejected";
    if (ai.confidence < 0.9) return "Pending";
    return "Approved";
}

// Volunteer matching
async function suggestVolunteer(report) {
    const volunteers = await Volunteer.find({
        availability: true,
        skills: report.category
    });

    let best = null;
    let bestScore = -1;

    for (let v of volunteers) {
        let score = 0;

        // ⭐ skill match (already filtered but boost)
        score += 5;

        // ⭐ experience
        score += v.tasksCompleted * 0.2;

        // ⭐ rating
        score += v.rating * 2;

        // ⭐ location match
        if (v.location === report.location) score += 3;

        if (score > bestScore) {
            best = v;
            bestScore = score;
        }
    }

    return best;
}

async function assignTask(report) {
    const volunteer = await suggestVolunteer(report);

    if (!volunteer) throw new Error("No volunteers available");

    const task = await Task.create({
        reportId: report._id,
        volunteerId: volunteer._id
    });

    // mark volunteer busy
    volunteer.availability = false;
    await volunteer.save();

    // update report
    report.status = "Assigned";
    await report.save();

    return task;
}

// --- API ROUTES ---

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({ fullName, email, password: hashedPassword });
        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Volunteer Auth Routes
app.post('/api/auth/volunteer/register', async (req, res) => {
    try {
        const { fullName, email, password, skills, location } = req.body;
        const existingUser = await Volunteer.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Volunteer already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await Volunteer.create({ name: fullName, email, password: hashedPassword, skills, location });
        res.status(201).json({ message: "Volunteer created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/api/auth/volunteer/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Volunteer.findOne({ email });
        if (!user) return res.status(404).json({ message: "Volunteer not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, role: 'volunteer' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, fullName: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// 1. Fetch all reports for the Review Queue
app.get('/api/reports', verifyToken, async (req, res) => {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
});

// 2. Submit a new request (Triggers live update)
app.post('/api/reports', upload.single("image"), async (req, res) => {
    try {
        const data = req.body;

        const ai = await analyzeWithLLM(data);
        const status = decideStatus(ai);

        const newReport = await Report.create({
            name: data.name,
            phone: data.phone,
            description: data.description,
            location: data.location,
            category: data.category,
            imageUrl: req.file ? req.file.path : null,

            severityScore: ai.severity_score,
            aiReason: ai.reasoning,
            confidence: ai.confidence,

            status
        });
        if (status === "Approved") {
            try {
                await assignTask(newReport);
            } catch (err) {
                newReport.status = "Pending";
                await newReport.save();
            }
        }

        io.emit('new-report', newReport);

        res.status(201).json(newReport);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 3. Update report status (Approve/Reject logic)
app.patch('/api/reports/:id', verifyToken, async (req, res) => {
    const { status } = req.body;

    const report = await Report.findById(req.params.id);

    if (status === "Approved") {
        try {
            await assignTask(report);
        } catch (err) {
            return res.status(404).json({ message: "No volunteers available" });
        }
    } else {
        report.status = status;
        await report.save();
    }

    io.emit("report-updated", report);

    res.json(report);
});

// 4. Fetch Verification Queue
app.get('/api/verifications', verifyToken, async (req, res) => {
    const list = await Verification.find({ status: 'Pending' });
    res.json(list);
});

app.patch('/api/verifications/:id', verifyToken, async (req, res) => {
    try {
        const { status } = req.body; 
        const verification = await Verification.findById(req.params.id);
        if (!verification) return res.status(404).json({ message: "Verification not found" });

        verification.status = status;
        await verification.save();

        const task = await Task.findOne({ reportId: verification.reportId, volunteerId: verification.volunteerId, status: "COMPLETED" });
        
        if (task) {
            if (status === "Approved") {
                task.status = "VERIFIED";
                task.verified = true;
                
                // Update the report to Resolved
                const report = await Report.findById(task.reportId);
                if (report) {
                    report.status = "Resolved";
                    await report.save();
                    io.emit("report-updated", report);
                }

                // Make volunteer available again
                const volunteer = await Volunteer.findById(task.volunteerId);
                if (volunteer) {
                    volunteer.availability = true;
                    volunteer.tasksCompleted += 1;
                    await volunteer.save();
                }

            } else {
                task.status = "ASSIGNED"; 
                task.proofImage = null;
            }
            await task.save();
        }

        res.json(verification);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// 5. Fetch tasks for logged-in volunteer
app.get('/api/tasks/me', verifyToken, async (req, res) => {
    try {
        const tasks = await Task.find({ volunteerId: req.user.id })
            .populate('reportId')
            .sort({ _id: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/tasks/:id/complete", upload.single("proofImage"), async (req, res) => {
    const proofImage = req.file ? req.file.path : null;

    const task = await Task.findById(req.params.id);

    task.status = "COMPLETED";
    task.proofImage = proofImage;

    await task.save();

    const report = await Report.findById(task.reportId);
    const volunteer = await Volunteer.findById(task.volunteerId);

    await Verification.create({
        reportId: task.reportId,
        volunteerName: volunteer.name,
        volunteerId: volunteer._id,
        proofImageUrl: proofImage,
        aiConfidence: report.confidence,
        status: "Pending"
    });

    res.json(task);
});

app.post("/api/tasks/:id/verify", async (req, res) => {
    const task = await Task.findById(req.params.id);

    task.status = "VERIFIED";
    task.verified = true;

    await task.save();

    res.json(task);
});

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
    console.log('Admin connected:', socket.id);
    socket.on('disconnect', () => console.log('Admin disconnected'));
});

server.listen(5000, () => console.log("Server running on port 5000"));