import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import cloudinary from 'cloudinary';
import connectDB from './config/db.js';
import Report from './models/Report.js';
import Verification from './models/Verification.js';
import Task from './models/Task.js';
import Volunteer from './models/Volunteer.js';
import Notification from './models/Notification.js';
import User from './models/User.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import taskRoutes from "./routes/tasks.js";
import volunteerRoutes from "./routes/volunteers.js";
import notificationRoutes from "./routes/notifications.js";

const app = express();
connectDB(); // Connect to MongoDB Atlas cluster

// Cloudinary Engine SDK Initialization
cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// Sync server cross-origin configurations directly with frontend port mapping targets
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
}));
app.use(express.json());
app.use("/api/tasks", taskRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/notifications", notificationRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST", "PATCH"] }
});

// Share socket instance across express routing parameters safely
app.set('socketio', io);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Memory RAM storage buffer management for seamless multi-platform image streaming
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper logic: Async image stream parsing straight to Cloudinary media buckets
const uploadToCloudinary = (fileBuffer, folderName) => {
    return new Promise((resolve, reject) => {
        if (!fileBuffer) return resolve(null);
        cloudinary.v2.uploader.upload_stream({ folder: folderName }, (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
        }).end(fileBuffer);
    });
};

// AI Analysis Function
async function analyzeWithLLM(data) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("No GEMINI_API_KEY provided. Using fallback logic.");
        return {
            is_incident: true,
            severity_score: 5,
            confidence: 0.95,
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
   - 1-3 (Low): Minor property damage, non-life-threatening issues.
   - 4-6 (Medium): Significant damage or risk of injury.
   - 7-10 (High/Critical): Immediate life threat, mass casualties, or widespread disaster.
3. **confidence**: A decimal between 0 and 1 representing how certain you are based on the clarity of the description.

### CONSTRAINTS FOLLOW THEM STRICTLY
- Return STRICT JSON ONLY.
- Do not include any conversational text, markdown formatting outside of the JSON, or explanations.
- The "reasoning" field must cite specific cues from the description.
- Dont return null values or undefined for any of the fields.

### OUTPUT SCHEMA 
{
  "is_incident": boolean,
  "severity_score": number,
  "confidence": number,
  "reasoning": "string"
}
`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const cleanedText = text.replace(/```json\n?|```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (err) {
            console.error("LLM parse error:", text);
            return {
                is_incident: true,
                severity_score: 5,
                confidence: 0.95,
                reasoning: "Fallback due to parsing error"
            };
        }
    } catch (apiError) {
        console.error("Gemini API Error:", apiError.message);
        return {
            is_incident: true,
            severity_score: 8,
            confidence: 0.95,
            reasoning: "Fallback triggered due to API transaction failure"
        };
    }
}

function decideStatus(ai) {
    if (!ai.is_incident) return "Rejected";
    if (ai.confidence < 0.9) return "Pending";
    return "Approved";
}
// Volunteer Suggestion Logic
async function suggestVolunteer(report) {

    console.log("REPORT CATEGORY:", report.category);

    const allVolunteers = await Volunteer.find({});
    console.log("ALL VOLUNTEERS:", allVolunteers);

    const volunteers = await Volunteer.find({
        availability: true
    });

    console.log("MATCHING VOLUNTEERS:", volunteers);

    let best = null;
    let bestScore = -1;

    for (let v of volunteers) {
        let score = 0;
        score += 5;
        score += (v.tasksCompleted || 0) * 0.2;
        score += (v.rating || 0) * 2;

        if (v.location === report.location)
            score += 3;

        if (score > bestScore) {
            best = v;
            bestScore = score;
        }
    }

    return best;
}
async function assignTask(report) {
    console.log("ENTERED ASSIGN TASK");
    console.log("REPORT CATEGORY:", report.category);

    const volunteer = await suggestVolunteer(report);

    console.log("MATCHED VOLUNTEER:", volunteer);

    if (!volunteer) throw new Error("No volunteers available");

    const task = await Task.create({
        reportId: report._id,
        volunteerId: volunteer._id
    });

    console.log("TASK CREATED:", task);
    console.log("BEFORE NOTIFICATION");
    try {
        const notification = await Notification.create({
            volunteerId: volunteer._id,
            title: "New Emergency Assigned",
            message: `${report.category} emergency assigned at ${report.location}`,
            type: "TASK"
        });

        console.log("NOTIFICATION CREATED:", notification);

    } catch(err) {
        console.log("NOTIFICATION ERROR:", err);
    }
    
    volunteer.availability = false;
    await volunteer.save();

    report.status = "Approved";
    await report.save();

    return task;
}
// --- MIDDLEWARE ---
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

// --- AUTH API ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({ fullName, email, password: hashedPassword });
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

// --- OPERATIONAL LOGIC APP ROUTES ---

// 1. Fetch all reports for Admin Review Queue Panel
app.get('/api/reports', async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Form submission channel parsing data directly to Cloudinary + Gemini
app.post('/api/reports', upload.single("image"), async (req, res) => {
    try {
        const data = req.body;

        // Stream binary file chunk straight up to Cloudinary
        let secureAssetUrl = null;
        if (req.file) {
            secureAssetUrl = await uploadToCloudinary(req.file.buffer, 'sahayak_reports');
        }

        const ai = await analyzeWithLLM(data);

        const latitude = parseFloat(data.latitude);
        const longitude = parseFloat(data.longitude);

        const newReport = await Report.create({
            name: data.name || "Anonymous User",
            phone: data.phone,
            description: data.description,
            location: data.location,

            latitude: isNaN(latitude) ? 31.6340 : latitude,
            longitude: isNaN(longitude) ? 74.8723 : longitude,

            category: data.category,
            imageUrl: secureAssetUrl,
            severityScore: ai.severity_score,
            aiReasoning: ai.reasoning,
            confidence: ai.confidence,
            status : "Pending"
        });

        

        io.emit('new-report', newReport);
        res.status(201).json(newReport);

    } catch (err) {
        console.error("Ingestion failed:", err);
        res.status(500).json({ error: "Emergency compilation failed" });
    }
});

// 3. Update report status manual administrative fallback overrides
app.patch('/api/reports/:id', async (req, res) => {
    try {
        const { status, forceApproval } = req.body;
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: "Report instance not found" });

        if (status === "Approved") {
            try {
                console.log("APPROVING REPORT:", report._id);
                console.log("REPORT CATEGORY:", report.category);
                // Try standard assignment
                await assignTask(report);
            } catch (err) {
                // IF VOLUNTEERS OFFLINE BUT ADMIN FORCED IT via Dashboard: Override and drop on map!
                if (forceApproval) {
                    report.status = "Approved";
                    await report.save();
                    
                    io.emit("report-updated", report);
                    return res.json(report);
                }
                
                // Otherwise block it with the standard exception
                return res.status(400).json({ message: "No compatible volunteers available online right now" });
            }
        } else {
            report.status = status;
            await report.save();
        }

        io.emit("report-updated", report);
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// the reject endpoint for volunteers to reject assigned tasks and trigger reassignment logic
app.post("/api/tasks/:id/reject", async (req, res) => {

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      message: "Task not found"
    });
  }

  task.status = "Assigned";

  await task.save();

  res.json({
    success: true
  });
});

// 4. Fetch Verification Queue
app.get('/api/verifications', async (req, res) => {
    try {
        const list = await Verification.find({ status: 'Pending' });
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/verifications/:id', verifyToken, async (req, res) => {
    try {
        const { status } = req.body; 
        const verification = await Verification.findById(req.params.id);
        if (!verification) return res.status(404).json({ message: "Verification entry missing" });

        verification.status = status;
        await verification.save();

        const task = await Task.findOne({ reportId: verification.reportId, volunteerId: verification.volunteerId, status: "COMPLETED" });
        
        if (task) {
            if (status === "Approved") {
                task.status = "VERIFIED";
                task.verified = true;
                
                const report = await Report.findById(task.reportId);
                if (report) {
                    report.status = "Resolved";
                    await report.save();
                    io.emit("report-updated", report);
                }

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
        res.status(500).json({ error: "Server verification processing error" });
    }
});

// 5. Fetch tasks assigned to the authenticated active volunteer
app.get('/api/tasks/me', verifyToken, async (req, res) => {
    try {
        const tasks = await Task.find({ volunteerId: req.user.id })
            .populate('reportId')
            .sort({ _id: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Server task processing failed" });
    }
});

app.post("/api/tasks/:id/complete", upload.single("proofImage"), async (req, res) => {
    console.log("========== COMPLETE ROUTE HIT ==========");
    console.log("REQ FILE:", req.file);
    try {
        let cloudProofUrl = null;
        if (req.file) {
            cloudProofUrl = await uploadToCloudinary(req.file.buffer, 'sahayak_proofs');
            console.log("CLOUD URL:", cloudProofUrl);
        }

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task reference missing" });

        task.status = "COMPLETED";
        task.proofImageUrl = cloudProofUrl;
        await task.save();
        console.log("TASK UPDATED");

        const report = await Report.findById(task.reportId);
        const volunteer = await Volunteer.findById(task.volunteerId);

        console.log("REPORT FOUND:", report?._id);
        console.log("VOLUNTEER FOUND:", volunteer?.name);

        const verification  = await Verification.create({
            reportId: task.reportId,
            volunteerName: volunteer.name,
            volunteerId: volunteer._id,
            proofImageUrl: cloudProofUrl,
            aiConfidence: report.confidence || 1.0,
            status: "Pending"
        });
        console.log("VERIFICATION CREATED:", verification);

        res.json(task);
    } catch (err) {
        console.error("TASK COMPLETION ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/tasks/:id/verify", async (req, res) => {
    const task = await Task.findById(req.params.id);
    task.status = "VERIFIED";
    task.verified = true;
    await task.save();
    res.json(task);
});

// --- REALTIME WEB_SOCKET COMMUNICATIONS LAYER ---
io.on('connection', (socket) => {
    console.log(`Sahayak Command Center socket connection opened: ${socket.id}`);
    socket.on('disconnect', () => console.log('Socket link dropped safely'));
});

server.listen(5000, () => console.log("Sahayak Processing Engine cleanly deployed on port 5000"));
