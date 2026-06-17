import express from "express";
import Task from "../models/Task.js";
import Volunteer from "../models/Volunteer.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const tasks = await Task.find()
    .populate("reportId")
    .populate("volunteerId");

  res.json(tasks);
});
// GET TASK FOR ONE VOLUNTEER THRIUGH VOLUNTEER ID
router.get(
  "/volunteer/:id",
  async (req, res) => {
    const tasks = await Task.find({
      volunteerId: req.params.id
    })
      .populate("reportId")
      .populate("volunteerId");

    res.json(tasks);
  }
);

// VERIFY TASK FROM ADMIN SIDE
router.patch("/:id/verify", async (req, res) => {
  try {

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    task.status = "Verified";

    await task.save();

    res.json({
      message: "Task verified",
      task
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
});

export default router;