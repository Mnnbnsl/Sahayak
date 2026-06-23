# Sahayak

AI-Powered Disaster Response and Volunteer Coordination Platform

---

## Table of Contents

1. Introduction
2. Problem Statement
3. Objectives
4. System Architecture
5. Core Features
6. Workflow
7. Technology Stack
8. Project Structure
9. Database Design
10. API Endpoints
11. Installation Guide
12. Environment Variables
13. Deployment
14. Security Considerations
15. Current Implementations
16. Future Enhancements
17. Author

---

# 1. Introduction

Sahayak is a full-stack disaster response and volunteer coordination platform designed to improve emergency management during natural disasters, accidents, medical emergencies, fires, floods, and infrastructure failures.

The platform enables citizens to report emergencies, allows administrators to validate and prioritize incidents, automatically assigns suitable volunteers, tracks mission execution, collects proof of task completion, and verifies completed missions through an administrative review process.

The system is designed to reduce response time, improve volunteer utilization, and provide transparency throughout the disaster management lifecycle.

---

# 2. Problem Statement

During emergencies, information is often fragmented across multiple channels. Citizens struggle to reach responders, administrators lack centralized visibility, and volunteers are assigned manually without considering skills, availability, or location.

Existing systems typically suffer from:

* Delayed incident reporting
* Poor volunteer coordination
* Lack of proof-based verification
* Limited situational awareness
* No centralized monitoring dashboard
* Manual task allocation

Sahayak addresses these challenges through an integrated emergency response platform.

---

# 3. Objectives

The primary objectives of Sahayak are:

* Enable rapid emergency reporting
* Provide AI-assisted incident assessment
* Improve volunteer assignment efficiency
* Maintain proof-based accountability
* Offer centralized monitoring for administrators
* Reduce emergency response delays
* Improve disaster management transparency

---

# 4. System Architecture

The platform follows a client-server architecture.

Citizen Portal (React)
↓
REST API
↓
Node.js / Express Backend
↓
MongoDB Atlas

Additional Integrations:

* Cloudinary for image storage
* Socket.IO for real-time communication
* Geolocation APIs for incident mapping
* AI Classification Engine for emergency analysis

---

# 5. Core Features

## Citizen Portal

The citizen portal allows users to report emergencies directly from the field.

Features:

* Emergency report submission
* GPS coordinate capture
* Incident categorization
* Evidence image upload
* AI-powered incident analysis
* Severity assessment
* Incident tracking

---

## Administrative Dashboard

The administrative dashboard provides centralized disaster management capabilities.

Features:

* Review emergency reports
* Approve or reject incidents
* Monitor active emergencies
* Assign volunteers
* Review proof submissions
* Verify completed missions
* Track incident status

---

## Volunteer Dashboard

The volunteer dashboard enables efficient mission management.

Features:

* View assigned tasks
* Mission status tracking
* Contact affected citizens
* Upload completion proof
* Receive notifications
* Update availability status

---

## Verification System

Ensures accountability and transparency.

Features:

* Proof image submission
* Cloudinary integration
* Administrative verification
* Mission closure workflow

---

## Notification System

Supports real-time communication.

Features:

* Assignment notifications
* Verification notifications
* Task status updates
* Emergency alerts

---

# 6. Workflow

## Incident Reporting

Citizen
→ Submit Emergency Report
→ Upload Evidence
→ AI Analysis
→ Generate Severity Score

---

## Incident Review

AI Analysis
→ Admin Dashboard
→ Report Review
→ Approval Decision

---

## Volunteer Assignment

Approved Report
→ Volunteer Recommendation Engine
→ Task Creation
→ Volunteer Notification

---

## Mission Completion

Volunteer
→ Complete Assigned Task
→ Upload Proof Image
→ Submit Verification Request

---

## Verification

Verification Queue
→ Admin Review
→ Approve / Reject Proof
→ Mission Closure

---

# 7. Technology Stack

## Frontend

Framework:

* React.js

Build Tool:

* Vite

Routing:

* React Router DOM

Styling:

* Tailwind CSS

Icons:

* Lucide React

Realtime:

* Socket.IO Client

---

## Backend

Runtime:

* Node.js

Framework:

* Express.js

Authentication:

* JWT

File Upload:

* Multer

Realtime Communication:

* Socket.IO

---

## Database

Database:

* MongoDB Atlas

ODM:

* Mongoose

---

## Cloud Services

Cloudinary

Purpose:

* Evidence image storage
* Mission proof storage

---

# 8. Project Structure

Sahayak/

client/

src/

components/

pages/

Admin/

Volunteer/

Citizen/

services/

utils/

App.jsx

main.jsx

public/

package.json

server/

models/

Report.js

Volunteer.js

Task.js

Verification.js

Notification.js

User.js

routes/

reports.js

tasks.js

volunteers.js

notifications.js

verifications.js

middleware/

uploads/

utils/

server.js

package.json

README.md

---

# 9. Database Design

## Report Collection

Stores emergency reports.

Fields:

* _id
* name
* phone
* location
* latitude
* longitude
* category
* description
* imageUrl
* severityScore
* confidence
* status
* createdAt

---

## Volunteer Collection

Stores volunteer information.

Fields:

* _id
* name
* email
* phone
* skills
* location
* availability
* rating
* tasksCompleted

---

## Task Collection

Stores assignments.

Fields:

* _id
* reportId
* volunteerId
* status
* proofImageUrl
* createdAt

---

## Verification Collection

Stores proof review records.

Fields:

* _id
* reportId
* volunteerId
* volunteerName
* proofImageUrl
* aiConfidence
* status

---

## Notification Collection

Stores user notifications.

Fields:

* _id
* volunteerId
* title
* message
* type
* read
* createdAt

---

# 10. API Endpoints

## Reports

POST /api/reports

Create emergency report

GET /api/reports

Fetch all reports

PATCH /api/reports/:id

Approve or update report status

---

## Volunteers

GET /api/volunteers

Fetch volunteers

POST /api/volunteers

Register volunteer

PATCH /api/volunteers/:id

Update volunteer status

---

## Tasks

GET /api/tasks

Fetch tasks

GET /api/tasks/volunteer/:id

Fetch volunteer tasks

POST /api/tasks/:id/complete

Complete task and upload proof

PATCH /api/tasks/:id/verify

Verify completed task

---

## Notifications

GET /api/notifications/:volunteerId

Fetch volunteer notifications

PATCH /api/notifications/:id/read

Mark notification as read

---

# 11. Installation Guide

Clone Repository

git clone https://github.com/yourusername/sahayak.git

cd sahayak

Install Backend Dependencies

cd server

npm install

npm start

Install Frontend Dependencies

cd client

npm install

npm run dev

---

# 12. Environment Variables

Backend

PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret

Frontend

VITE_API_URL=http://localhost:5000

---

# 13. Deployment

Frontend

Recommended Platforms:

* Vercel
* Netlify

Backend

Recommended Platforms:

* Render
* Railway
* AWS EC2

Database

* MongoDB Atlas

Storage

* Cloudinary

---

# 14. Security Considerations

Implemented:

* JWT-based authentication
* Protected administrative routes
* Input validation
* Secure image storage using Cloudinary

Planned:

* Rate limiting
* Refresh token rotation
* Role-based access control
* Audit logging

---

# 15. Current Implementations

Completed:

* Emergency Reporting
* AI Incident Analysis
* Admin Review Queue
* Volunteer Assignment
* Volunteer Dashboard
* Cloudinary Proof Upload
* Verification Queue
* Mission Verification
* MongoDB Integration
* Notification Storage
* Incident Mapping

---

# 16. Future Enhancements

Planned Features:

* Real-time notifications
* AI chatbot assistant
* Duplicate report detection
* Heatmap visualization
* Predictive disaster analytics
* Multi-language support
* Mobile application
* Government integration
* SMS notifications

---

# 17. Author

Jaspreet Kaur

Bachelor of Technology (Information Technology)

Dr. B. R. Ambedkar National Institute of Technology, Jalandhar

---

# License

This project is developed for educational, research, and social impact purposes.
