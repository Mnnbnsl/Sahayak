import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your pages
import LandingPage from "./pages/LandingPage";
import ReportPage from "./pages/ReportPage";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";

// Optional: Global Components (like a Navbar if you have one)
// import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#050816]">
        {/* If you have a shared Navbar, place it here */}
        
        <Routes>
          {/* Main Landing Page - Third card leads to /admin */}
          <Route path="/" element={<LandingPage />} />

          {/* User Reporting Page */}
          <Route path="/report" element={<ReportPage />} />

          {/* Admin / Coordinator Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Volunteer Dashboard */}
          <Route path="/volunteer" element={<VolunteerDashboard />} />

          {/* Fallback for 404 - Optional */}
          <Route 
            path="*" 
            element={
              <div className="flex items-center justify-center h-screen text-white">
                <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;