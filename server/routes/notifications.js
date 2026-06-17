import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

router.get(
  "/:volunteerId",
  async (req, res) => {
    try {
      const notifications =
        await Notification.find({
          volunteerId:
            req.params.volunteerId
        }).sort({
          createdAt: -1
        });

      res.json(notifications);
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);
// Test route to create a sample notification for a volunteer with ID "6a3291a6eed0698ef9053690"
router.get("/test/create", async (req, res) => {

  const notification =
    await Notification.create({
      volunteerId:
        "6a3291a6eed0698ef9053690",

      title:
        "Test Notification",

      message:
        "Notification system working perfectly",

      read: false
    });

  res.json(notification);
});

router.patch(
  "/read/:id",
  async (req, res) => {
    try {
      const notification =
        await Notification.findByIdAndUpdate(
          req.params.id,
          { read: true },
          { new: true }
        );

      res.json(notification);
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);

export default router;