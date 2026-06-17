import express from "express";
import Volunteer from "../models/Volunteer.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      skills,
      location
    } = req.body;

    const existingVolunteer =
      await Volunteer.findOne({ email });

    if (existingVolunteer) {
      return res.status(400).json({
        message: "Volunteer already exists"
      });
    }

    const volunteer = await Volunteer.create({
      name,
      email,
      password,
      skills,
      location,
      availability: true
    });

    res.status(201).json({
      message: "Volunteer registered successfully",
      volunteer
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const volunteer = await Volunteer.findOne({
      email
    });

    if (!volunteer) {
      return res.status(400).json({
        message: "Volunteer not found"
      });
    }

    if (volunteer.password !== password) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        volunteerId: volunteer._id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.status(200).json({
      token,
      volunteer
    });
  } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
});

// GET VOLUNTEER PROFILE
router.get("/profile/:id", async (req, res) => {
  try {
    const volunteer =
      await Volunteer.findById(
        req.params.id
      );

    res.json(volunteer);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

// UPDATE PROFILE
router.put("/profile/:id", async (req, res) => {
  try {
    const volunteer =
      await Volunteer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.json(volunteer);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

// TOOGLE AVAILABILITY
router.patch(
  "/availability/:id",
  async (req, res) => {
    try {
      const volunteer =
        await Volunteer.findById(
          req.params.id
        );

      volunteer.availability =
        !volunteer.availability;

      await volunteer.save();

      res.json(volunteer);
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);

export default router;