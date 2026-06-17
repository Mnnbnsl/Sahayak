import express from "express";
import Report from "../models/Report.js";
import Task from "../models/Task.js";
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
      return res.status(404).json({
        message: "Incident record not found."
      });
    }

    if (status === "Approved") {

      const activeVolunteers = await Volunteer.find({
        availability: true
      });

      if (!activeVolunteers.length) {

        if (forceApproval) {

          report.status = "Approved";
          await report.save();

          const io = req.app.get("socketio");
          if (io) io.emit("report-updated", report);

          return res.status(200).json({
            message:
              "Report approved manually without volunteer assignment.",
            report
          });
        }

        return res.status(400).json({
          message: "No compatible volunteers available online right now"
        });
      }

      const volunteer = activeVolunteers[0];

      report.status = "Approved";
      report.assignedVolunteer = volunteer._id;

      await report.save();

      await Task.create({
        reportId: report._id,
        volunteerId: volunteer._id,
        status: "Assigned"
      });
      volunteer.availability = false;
      await volunteer.save();
      
      console.log("TASK CREATED:", task);
    }
    else {
      report.status = status || report.status;
      await report.save();
    }

    const io = req.app.get("socketio");

    if (io) {
      io.emit("report-updated", report);
    }

    res.status(200).json({
      message: "Report state updated successfully.",
      report
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server database update transaction failed."
    });
  }
});

export default router;