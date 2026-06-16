import express from "express";
import Report from "../models/Report.js";
import Volunteer from "../models/Volunteer.js";

const router = express.Router();

/**
 * @route   GET /api/reports
 * @desc    Fetch all incident reports for the Admin Dashboard feed
 */
router.get("/", async (req, res) => {
  try {
    // Fetch reports sorted by newest first
    const reports = await Report.find().sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Server error retrieving reports stream." });
  }
});

/**
 * @route   POST /api/reports
 * @desc    Create a new emergency report (User Submits Report)
 */
router.post("/", async (req, res) => {
  try {
    const { category, description, location, latitude, longitude, phone } = req.body;

    // Basic Validation
    if (!category || !description || !location) {
      return res.status(400).json({ message: "Required fields missing." });
    }

    // Mock AI analysis values for testing metrics
    const confidence = Math.random() * (0.99 - 0.75) + 0.75; // 75% to 99%
    const severityScore = Math.floor(Math.random() * 5) + 6;   // 6 to 10 scale

    const newReport = new Report({
      category,
      description,
      location,
      latitude: latitude || 30.7333,
      longitude: longitude || 76.7794,
      phone,
      status: "Pending",
      confidence,
      severityScore,
      aiReason: `Automated detection flagged high priority ${category} risk indicators.`
    });

    await newReport.save();

    // Access Socket.io from the global app instance to broadcast real-time updates
    const io = req.app.get("socketio");
    if (io) {
      io.emit("new-report", newReport);
    }

    res.status(201).json({ message: "Report submitted successfully!", report: newReport });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ message: "Internal server validation pipeline error." });
  }
});

/**
 * @route   PATCH /api/reports/:id
 * @desc    Update status of a report (Review Queue -> Approve / Reject)
 */
router.patch("/:id", async (req, res) => {
  try {
    const { status, forceApproval } = req.body;
    const reportId = req.params.id;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Incident record not found." });
    }

    // Process logic explicitly for manual dashboard approvals
    if (status === "Approved") {
      // Look for active volunteers matching criteria in MongoDB
      const activeVolunteers = await Volunteer.find({ isOnline: true });

      // If no volunteers are online (the issue from image_73f5e6.png)
      if (!activeVolunteers || activeVolunteers.length === 0) {
        
        // CHECK OVERRIDE FLAG: If dashboard passed forceApproval, bypass block!
        if (forceApproval) {
          report.status = "Approved";
          await report.save();

          // Push the real-time update socket handshake down to the frontend
          const io = req.app.get("socketio");
          if (io) io.emit("report-updated", report);

          return res.status(200).json({
            message: "Report approved manually without an active volunteer assignment.",
            report
          });
        }

        // Default blocker response if no override flag is present
        return res.status(400).json({ 
          message: "No compatible volunteers available online right now" 
        });
      }
    }

    // Default state resolution for other transitions (e.g., 'Rejected')
    report.status = status || report.status;
    await report.save();

    const io = req.app.get("socketio");
    if (io) io.emit("report-updated", report);

    res.status(200).json({ message: "Report state updated successfully.", report });
  } catch (error) {
    console.error("Error updating report state:", error);
    res.status(500).json({ message: "Server database update transaction failed." });
  }
});

export default router;