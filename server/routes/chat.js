import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

import Volunteer from "../models/Volunteer.js";
import Task from "../models/Task.js";
import Report from "../models/Report.js";
import Notification from "../models/Notification.js";

const router = express.Router();

const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

router.post("/", async (req, res) => {

  try {

    const {
      message,
      role,
      userId,
      currentPage
    } = req.body;

    let context = "";

    if (role === "volunteer") {

      const volunteer =
        await Volunteer.findById(userId);

      const tasks =
        await Task.find({
          volunteerId: userId
        }).populate("reportId");

      const notifications =
        await Notification.find({
          volunteerId: userId
        }).limit(5);

      context = `
Volunteer Name:
${volunteer?.name}

Skills:
${volunteer?.skills?.join(", ")}

Availability:
${volunteer?.availability}

Tasks Completed:
${volunteer?.tasksCompleted}

Assigned Tasks:
${tasks.length}

Recent Notifications:
${notifications
  .map(n => n.message)
  .join("\n")}
`;
    }

    if (role === "admin") {

      const reports =
        await Report.find();

      const volunteers =
        await Volunteer.find();

      const tasks =
        await Task.find();

      context = `
        Pending Reports:
        ${
        reports.filter(
        r => r.status === "Pending"
        ).length
        }

        Available Volunteers:
        ${
        volunteers.filter(
        v => v.availability
        ).length
        }

        Total Tasks:
        ${tasks.length}
        `;
    }

    const prompt = `
    You are Sahayak AI, the intelligent emergency response assistant for the Sahayak Disaster Management Platform.

    Role:
    ${role}

    Current Page:
    ${currentPage}

    Live Context:
    ${context}

    Capabilities:
    - Disaster response guidance
    - Flood safety
    - Fire safety
    - Earthquake safety
    - Cyclone safety
    - First aid guidance
    - Volunteer support
    - Admin dashboard help
    - Sahayak platform help

    IMPORTANT:
    - Assume the user is in India unless they explicitly say otherwise.
    - Fire Brigade: 101
    - Ambulance: 108
    - Emergency Response: 112
    - Police: 100
    - Never recommend 911 unless the user specifically says they are in the United States.

    Rules:
    - Always prioritize human safety.
    - Never invent data.
    - Use live context if available.
    - Never claim emergency services were contacted.
    - Never claim a volunteer was dispatched unless it exists in context.
    - Never claim a report was created unless it exists in context.
    - Keep responses concise and actionable.
    - Use bullet points whenever appropriate.

    For emergencies:
    1. Immediate actions first.
    2. Safety precautions second.
    3. Emergency contact information third.

    For first aid:
    - Provide basic guidance only.
    - Never provide diagnosis.
    - Never provide prescription advice.
    - Mention that professional medical assistance should be sought when necessary.

    For volunteers:
    - Help with tasks.
    - Help with equipment recommendations.
    - Help with disaster response procedures.

    For admins:
    - Help with reports.
    - Help with volunteers.
    - Help with dashboard usage.
    - Use context statistics when available.

    If the user asks "Volunteer Help" or requests volunteer assistance:

    Do not give a generic introduction.

    Instead provide:
    - Equipment recommendations
    - Safety procedures
    - Response protocols
    - Examples of volunteer tasks
    - Common volunteer questions

    Format the response using bullet points.

    Example:

    Volunteer Support

    Recommended Equipment:
    - Helmet
    - Gloves
    - Flashlight
    - First Aid Kit
    - Reflective Vest

    Safety Guidelines:
    - Never enter unstable structures.
    - Follow official instructions.
    - Work in teams whenever possible.

    How can I assist you with your volunteer duties?

    User Message:
    ${message}
    `;

    const model =
      genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
      });
     
    console.log("ROLE:", role);
    console.log("USER ID:", userId);
    console.log("CURRENT PAGE:", currentPage);
    console.log("MESSAGE:", message);
    console.log("CALLING GEMINI...");

    const result =
      await model.generateContent(
        prompt
      );
    
    console.log("GEMINI SUCCESS");

    const reply =
      result.response.text();

    res.json({ reply });

  } catch (err) {

    console.error(err);

    res.json({
        reply:
        `⚠️ Chatbot Error: ${err.message}`
    });


  }

});

export default router;