import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  Bell,
  LogOut,
  MapPin,
  AlertTriangle,
  Phone,
  Upload,
  CheckCircle,
  Menu,
  X,
  User,
  Clock,
  CheckSquare,
  Eye,
  ToggleLeft,
  ToggleRight,
  Navigation
} from "lucide-react";

export default function VolunteerDashboard() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, tasks, notifications, settings
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to false for better mobile initializing
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Data States
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, completed: 0, verified: 0 });
  const [selectedImages, setSelectedImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null); // For deep mission details view

  // Profile & Settings States
  const [isAvailable, setIsAvailable] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    tasksCompleted: 0,
    rating: 5
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const volunteerId = localStorage.getItem("volunteerId");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("volunteerToken");

    if (!token || !volunteerId) {
      navigate("/");
    }
  }, [navigate, volunteerId]);

  useEffect(() => {
    fetchTasks();
    fetchNotifications();
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/volunteers/profile/${volunteerId}`
        );
        const data = await response.json();

        if (response.ok) {
          setProfile({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            skills: data.skills?.join(", ") || "",
            tasksCompleted: data.tasksCompleted || 0,
            rating: data.rating || 5
          });

          setIsAvailable(data.availability);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const assigned = tasks.filter(
      t => t.status?.toLowerCase() === "assigned"
    ).length;

    const completed = tasks.filter(
      t => t.status?.toLowerCase() === "completed"
    ).length;

    const verified = tasks.filter(
      t => t.status?.toLowerCase() === "verified"
    ).length;

    setStats({
      assigned,
      completed,
      verified
    });
  }, [tasks]);

  const fetchTasks = async () => {
    if (!volunteerId) {
      console.log("Volunteer not logged in");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tasks/volunteer/${volunteerId}`);
      
      if (!response.ok) {
        console.warn("Volunteer specific route failed, falling back to general tasks filter");
        const fallbackRes = await fetch(`${API_URL}/api/tasks`);
        const allTasks = await fallbackRes.json();
        if (fallbackRes.ok) {
          const filtered = allTasks.filter(t => t.volunteerId?._id === volunteerId );
          
          setTasks(
            filtered.sort(
              (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
            )
          );
          return;
        }
      }

      const data = await response.json();
      if (response.ok) {
        setTasks(
          data.sort(
            (a, b) =>
              new Date(b.createdAt) -
              new Date(a.createdAt)
          )
        );
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!volunteerId) return;

      const response = await fetch(
        `${API_URL}/api/notifications/${volunteerId}`
      );
      const data = await response.json();

      if (response.ok) {
        setNotifications(data);
        setUnreadNotificationsCount(
          data.filter((n) => !n.read).length
        );
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleImageSelect = (taskId, file) => {
    setSelectedImages((prev) => ({
      ...prev,
      [taskId]: file
    }));
  };

  const completeTask = async (taskId) => {
    try {
      console.log("COMPLETE BUTTON CLICKED", taskId);
      const formData = new FormData();
      console.log("SELECTED IMAGE:", selectedImages[taskId]);
      if (selectedImages[taskId]) {
        formData.append("proofImage", selectedImages[taskId]);
      } else {
        alert("Please select a valid image file as proof before submission.");
        return;
      }
      console.log("BEFORE FETCH");
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        alert("Mission proof uploaded successfully! Awaiting Admin verification.");
        setSelectedImages(prev => {
          const updated = { ...prev };
          delete updated[taskId];
          return updated;
        });
        if (selectedTask?._id === taskId) {
          setSelectedTask(prev => ({ ...prev, status: "Completed" }));
        }
        fetchTasks();
        fetchNotifications();
      } else {
        alert("Failed to complete task. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading proof image.");
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/volunteers/availability/${volunteerId}`,
        {
          method: "PATCH"
        }
      );
      const data = await response.json();

      if (response.ok) {
        setIsAvailable(data.availability);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      // Reconstructed fallback payload mapping safely
      const payload = {
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        skills: profile.skills.split(",").map(s => s.trim())
      };

      const response = await fetch(
        `${API_URL}/api/volunteers/profile/${volunteerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        alert("Profile updated successfully");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await Promise.all(
        notifications.map((notif) =>
          fetch(
            `${API_URL}/api/notifications/read/${notif._id}`,
            {
              method: "PATCH"
            }
          )
        )
      );
      fetchNotifications();
    } catch (err) {
      console.log(err);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await fetch(
        `${API_URL}/api/notifications/read/${id}`,
        {
          method: "PATCH"
        }
      );
      fetchNotifications();
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to securely log out?")) {
      localStorage.removeItem("volunteerId");
      localStorage.removeItem("volunteerToken");
      localStorage.removeItem("volunteerName");
      localStorage.removeItem("volunteerEmail");

      window.location.href = "/";
    }
  };

  const openGoogleMaps = (locationString) => {
    if (!locationString) return;
    const encodedLocation = encodeURIComponent(locationString);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, "_blank");
  };

  const initiateCall = (phoneNum) => {
    if (!phoneNum) {
      alert("No victim contact number provided for this incident.");
      return;
    }
    window.open(`tel:${phoneNum}`, "_self");
  };

  const sortedTasks = [
    ...tasks.filter(task => task.status !== "VERIFIED"),
    ...tasks.filter(task => task.status === "VERIFIED")
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      
      {/* MOBILE BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#050816] border-r border-[#232B4C] transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 md:fixed md:translate-x-0 flex flex-col justify-between h-full`}>
        <div>
          {/* Sidebar Brand Header */}
          <div className="p-6 border-b border-[#232B4C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/sahayak-logo.png" className="h-10" alt="Sahayak Logo" />
              <h1 className="font-bold text-sm tracking-wider text-white">
                SAHAYAK VOLUNTEER OPS
              </h1>
            </div>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedTask(null); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === "dashboard" ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/20" : "text-gray-400 hover:bg-[#11162B] hover:text-white"}`}
            >
              <LayoutDashboard size={20} />
              Dashboard Overview
            </button>
            <button
              onClick={() => { setActiveTab("tasks"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium relative ${activeTab === "tasks" ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/20" : "text-gray-400 hover:bg-[#11162B] hover:text-white"}`}
            >
              <ClipboardList size={20} />
              My Active Tasks
              {stats.assigned > 0 && (
                <span className="absolute right-3 bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {stats.assigned}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("notifications"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium relative ${activeTab === "notifications" ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/20" : "text-gray-400 hover:bg-[#11162B] hover:text-white"}`}
            >
              <Bell size={20} />
              Alert Notifications
              {unreadNotificationsCount > 0 && (
                <span className="absolute right-3 bg-white text-[#F97316] text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("settings"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === "settings" ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/20" : "text-gray-400 hover:bg-[#11162B] hover:text-white"}`}
            >
              <Settings size={20} />
              Settings & Profile
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-[#232B4C] bg-[#11162B]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F97316] to-[#EA580C] flex items-center justify-center text-white font-bold flex-shrink-0">
              {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="truncate flex-1">
              <h4 className="text-sm font-semibold truncate">{profile.name}</h4>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isAvailable ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></span>
                {isAvailable ? "Active Duty" : "Offline"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded-xl text-sm font-medium transition-all"
          >
            <LogOut size={16} />
            Secure Log Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 w-full min-h-screen">
        
        {/* TOP MOBILE BAR / ACTION STRIP */}
        <header className="bg-[#050816] border-b border-[#232B4C] h-16 px-4 md:px-6 flex items-center justify-between md:justify-end gap-4 sticky top-0 z-30">
          <button className="md:hidden text-gray-400 hover:text-white p-1" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Direct Quick Availability Toggle */}
            <button 
              onClick={handleToggleAvailability}
              className="flex items-center gap-2 bg-[#11162B] border border-[#232B4C] px-2.5 py-1.5 sm:px-3 rounded-xl text-sm"
            >
              <span className="text-xs text-gray-400 hidden sm:inline">Status:</span>
              {isAvailable ? (
                <span className="text-green-400 font-semibold flex items-center gap-1 text-xs sm:text-sm">
                  Available <ToggleRight size={18} className="text-green-400" />
                </span>
              ) : (
                <span className="text-gray-400 font-semibold flex items-center gap-1 text-xs sm:text-sm">
                  Unavailable <ToggleLeft size={18} className="text-gray-500" />
                </span>
              )}
            </button>

            {/* Quick Profile Pill */}
            <div className="flex items-center gap-2 bg-[#11162B] border border-[#232B4C] px-2.5 py-1.5 sm:px-3 rounded-xl text-sm">
              <User size={16} className="text-[#F97316]" />
              <span className="font-medium max-w-[100px] sm:max-w-[120px] truncate text-xs sm:text-sm">{profile.name || "User"}</span>
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT ROUTING PANEL */}
        <main className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && !selectedTask && (
            <div>
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome, {profile.name ? profile.name.split(" ")[0] : "Volunteer"}</h1>
                <p className="text-gray-400 text-sm mt-1">Here is your crisis intervention & deployment summary metrics.</p>
              </div>

              {/* ANALYTICS METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute right-4 top-4 text-[#F97316]/10">
                    <Clock size={48} />
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider">Assigned Missions</p>
                  <p className="text-3xl md:text-4xl font-black text-[#F97316] mt-2">{stats.assigned}</p>
                </div>

                <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute right-4 top-4 text-blue-500/10">
                    <CheckSquare size={48} />
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider">Pending Review</p>
                  <p className="text-3xl md:text-4xl font-black text-blue-400 mt-2">{stats.completed}</p>
                </div>

                <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute right-4 top-4 text-green-500/10">
                    <CheckCircle size={48} />
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider">Resolved Cases</p>
                  <p className="text-3xl md:text-4xl font-black text-green-400 mt-2">{stats.verified}</p>
                </div>
              </div>

              {/* ACTION CALLOUT / BANNER */}
              <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-5 md:p-6 mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">Need emergency dispatch instructions?</h3>
                  <p className="text-xs md:text-sm text-gray-300 mt-0.5">Toggle your active duty availability status so telemetry and assignments route correctly.</p>
                </div>
                <button 
                  onClick={() => setActiveTab("tasks")} 
                  className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all w-full sm:w-auto text-center"
                >
                  View Active Task Sheet
                </button>
              </div>

              {/* RECENT CURRENT TASK SNIPPET */}
              <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-5 md:p-6">
                <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                  <ClipboardList className="text-[#F97316]" size={22} /> Critical Assignments
                </h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Syncing telemetry data...</div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No active operational tasks designated to your account.</div>
                ) : (
                  <div className="divide-y divide-[#232B4C]">
                    {tasks.filter(task => task.status === "Assigned" || task.status === "COMPLETED" || task.status === "Pending").slice(0, 5).map((task) => (
                      <div key={task._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm md:text-md text-white">{task.reportId?.category || "General Assistance"}</h4>
                            <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full font-bold border ${
                              task.status === "Verified" ? "bg-green-950 text-green-400 border-green-800" :
                              task.status === "Completed" ? "bg-blue-950 text-blue-400 border-blue-800" : "bg-orange-950 text-[#F97316] border-orange-800"
                            }`}>{task.status}</span>
                          </div>
                          <p className="text-[11px] md:text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <MapPin size={12} className="text-[#F97316] flex-shrink-0" /> <span className="truncate">{task.reportId?.location || "Unknown Location"}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => { setSelectedTask(task); setActiveTab("tasks"); }}
                          className="bg-[#050816] hover:bg-[#11162B] text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 border border-[#232B4C] transition-colors w-full sm:w-auto"
                        >
                          <Eye size={14} /> Mission Control
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED TASKS MANAGEMENT & MISSION CONTROL */}
          {activeTab === "tasks" && (
            <div>
              {selectedTask ? (
                <div>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="mb-4 md:mb-6 bg-[#11162B] border border-[#232B4C] hover:bg-[#050816] text-gray-300 text-xs md:text-sm px-4 py-2 rounded-xl font-medium transition-all w-full sm:w-auto text-center"
                  >
                    ← Back to Task Dashboard Sheet
                  </button>

                  <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#232b4c] pb-5 mb-5">
                      <div>
                        <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#F97316] font-bold">Active Operational Incident Details</span>
                        <h1 className="text-xl md:text-3xl font-black mt-1 text-white">{selectedTask.reportId?.category || "Crisis Rescue Operation"}</h1>
                      </div>
                      <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold border ${
                        selectedTask.status === "Verified" ? "bg-green-950 text-green-400 border-green-800" :
                        selectedTask.status === "Completed" ? "bg-blue-950 text-blue-400 border-blue-800" : "bg-orange-950 text-[#F97316] border-orange-800"
                      }`}>
                        Status: {selectedTask.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                      <div className="space-y-4">
                        <div className="bg-[#050816] p-4 rounded-xl border border-[#232B4C]">
                          <label className="text-[10px] md:text-xs text-gray-400 font-semibold block uppercase mb-1">Geographical Parameters</label>
                          <p className="text-white text-sm md:font-medium flex items-center gap-2">
                            <MapPin size={16} className="text-[#F97316] flex-shrink-0" />
                            {selectedTask.reportId?.location || "No address parameters provided."}
                          </p>
                        </div>

                        <div className="bg-[#050816] p-4 rounded-xl border border-[#232B4C]">
                          <label className="text-[10px] md:text-xs text-gray-400 font-semibold block uppercase mb-1">Incident Critical Severity</label>
                          <p className="text-white text-sm md:font-medium flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                            Severity Rating: <span className="font-bold text-amber-400">{selectedTask.reportId?.severityScore || "N/A"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#050816] p-4 rounded-xl border border-[#232B4C]">
                        <label className="text-[10px] md:text-xs text-gray-400 font-semibold block uppercase mb-1">Incident Description & Logs</label>
                        <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                          {selectedTask.reportId?.description || "No customized report parameters or descriptions appended."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-[#232B4C] py-5 mb-6 md:mb-8">
                      <div>
                        <button
                          onClick={() => openGoogleMaps(selectedTask.reportId?.location)}
                          className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm"
                        >
                          <Navigation size={18} />
                          Launch Maps Navigation
                        </button>
                      </div>

                      <div>
                        <button
                          onClick={() => initiateCall(selectedTask.reportId?.phone)}
                          className="w-full bg-[#050816] hover:bg-[#11162B] text-green-400 border border-[#232B4C] font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
                        >
                          <Phone size={18} />
                          Call Victim Direct Line
                        </button>
                      </div>
                    </div>

                    {/* Operational Proof Submission File Area */}
                    <div>
                      <h3 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
                        <Upload size={18} className="text-[#F97316]" /> Operational Proof Submission
                      </h3>

                      {selectedTask.status === "Assigned" && (
                        <div className="bg-[#050816] border-2 border-dashed border-[#232B4C] rounded-2xl p-5 md:p-6 text-center">
                          <input
                            type="file"
                            id={`file-upload-detailed`}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageSelect(selectedTask._id, e.target.files[0])}
                          />
                          <label 
                            htmlFor={`file-upload-detailed`}
                            className="cursor-pointer inline-flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors w-full"
                          >
                            <div className="p-3 bg-[#11162B] rounded-full border border-[#232B4C] mb-1">
                              <Upload size={24} className="text-[#F97316]" />
                            </div>
                            <span className="font-semibold text-xs md:text-sm max-w-xs truncate mx-auto">
                              {selectedImages[selectedTask._id] ? `Selected: ${selectedImages[selectedTask._id].name}` : "Click to select operational proof image"}
                            </span>
                          </label>

                          {selectedImages[selectedTask._id] && (
                            <div className="mt-4 pt-4 border-t border-[#232B4C]">
                              <button
                                onClick={() => completeTask(selectedTask._id)}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2.5 rounded-xl inline-flex items-center justify-center gap-2 shadow-lg transition-all text-sm"
                              >
                                <CheckCircle size={18} />
                                Upload Proof & Complete
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedTask.status === "Completed" && (
                        <div className="bg-blue-950/40 border border-blue-900/60 text-blue-300 p-4 rounded-xl text-xs md:text-sm font-medium flex items-center gap-2">
                          <Clock size={18} className="animate-pulse flex-shrink-0" />
                          The operational proof telemetry has been posted to back-end datastores. Awaiting regional Administrator review verification.
                        </div>
                      )}

                      {selectedTask.status === "Verified" && (
                        <div className="bg-green-950/40 border border-green-900/60 text-green-300 p-4 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2">
                          <CheckCircle size={18} className="flex-shrink-0" />
                          This mission case assignment is completely audited, verified, and closed. Thank you for your service.
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ) : (
                /* INTERACTIVE LIST OF ALL ASSIGNED MISSIONS */
                <div>
                  <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                      Assigned Task Logs
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                      Manage your assigned emergency missions and track their status.
                    </p>
                  </div>

                  {/* Mission Statistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-4 md:p-5">
                      <p className="text-gray-400 text-xs md:text-sm">Assigned Missions</p>
                      <h2 className="text-2xl md:text-3xl font-black text-[#F97316] mt-1">{stats.assigned}</h2>
                    </div>

                    <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-4 md:p-5">
                      <p className="text-gray-400 text-xs md:text-sm">Pending Verification</p>
                      <h2 className="text-2xl md:text-3xl font-black text-blue-400 mt-1">{stats.completed}</h2>
                    </div>

                    <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-4 md:p-5">
                      <p className="text-gray-400 text-xs md:text-sm">Resolved Cases</p>
                      <h2 className="text-2xl md:text-3xl font-black text-green-400 mt-1">{stats.verified}</h2>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-20 text-gray-400 text-sm">Syncing database operations configuration...</div>
                  ) : tasks.length === 0 ? (
                    <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-8 md:p-12 text-center text-gray-400 text-sm">
                      <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
                      No assigned operational task objects mapped to this volunteer account.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:gap-6">
                      {sortedTasks.map((task) => (
                        <div key={task._id} className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-5 md:p-6 shadow-xl hover:border-[#F97316] transition-all duration-200">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                              {task.reportId?.category || "Rescue Operation Mission"}
                            </h2>
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border self-start sm:self-auto ${
                              task.status === "Verified" ? "bg-green-950 text-green-400 border-green-800" :
                              task.status === "Completed" ? "bg-blue-950 text-blue-400 border-blue-800" : "bg-orange-950 text-[#F97316] border-orange-800"
                            }`}>
                              {task.status}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4 text-xs md:text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-[#F97316] flex-shrink-0" />
                              <span className="truncate">{task.reportId?.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                              <span>Critical Level: {task.reportId?.severityScore || "0"}/10</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#232B4C]">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="bg-[#050816] hover:bg-[#11162B] border border-[#232B4C] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
                            >
                              <Eye size={14} /> Full Mission Panel
                            </button>

                            {task.status === "Assigned" && (
                              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                <input
                                  type="file"
                                  id={`file-upload-${task._id}`}
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageSelect(task._id, e.target.files[0])}
                                />
                                <label 
                                  htmlFor={`file-upload-${task._id}`}
                                  className="cursor-pointer bg-[#050816] hover:bg-[#11162B] border border-[#232B4C] text-xs font-semibold px-3 py-2 rounded-xl text-center flex-1 sm:flex-initial truncate max-w-[150px]"
                                >
                                  {selectedImages[task._id] ? selectedImages[task._id].name : "Select Proof File"}
                                </label>
                                {selectedImages[task._id] && (
                                  <button
                                    onClick={() => completeTask(task._id)}
                                    className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl"
                                  >
                                    Submit
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ALERT NOTIFICATIONS LIST VIEW */}
          {activeTab === "notifications" && (
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 md:mb-8">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    Alert Notifications
                  </h1>
                  <span className="bg-[#F97316] text-white px-2.5 py-0.5 rounded-full text-xs md:text-sm font-bold">
                    {notifications.length}
                  </span>
                </div>

                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="bg-[#F97316] hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto"
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              {/* Empty State */}
              {notifications.length === 0 ? (
                <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-10 md:p-20 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F97316]/10 flex items-center justify-center">
                    <Bell size={32} className="text-[#F97316]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">No Notifications</h2>
                  <p className="text-gray-400 text-xs md:text-sm mt-2">
                    You're all caught up. New emergency alerts will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`bg-[#11162B] rounded-2xl border p-4 md:p-6 transition-all duration-300
                      ${!notif.read ? "border-[#F97316] shadow-[0_0_25px_rgba(249,115,22,0.12)]" : "border-[#232B4C]"}`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        {/* LEFT SIDE */}
                        <div className="flex gap-3 md:gap-4 items-start">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${!notif.read ? "bg-[#F97316]/20" : "bg-[#050816]"}`}>
                            <Bell size={20} className="text-[#F97316]" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base md:text-lg font-bold text-white">{notif.title}</h3>
                              {!notif.read && (
                                <span className="bg-[#F97316] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 text-xs md:text-sm mt-1.5 leading-relaxed break-words">{notif.message}</p>
                            <p className="text-[10px] md:text-xs text-gray-500 mt-2">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* RIGHT SIDE */}
                        {!notif.read && (
                          <button
                            onClick={() => markNotificationRead(notif._id)}
                            className="bg-[#F97316] hover:bg-orange-600 px-3 py-1.5 rounded-xl text-white text-xs font-semibold transition-all w-full sm:w-auto text-center"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS & RESPONDER PROFILE */}
          {activeTab === "settings" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Settings & Profile
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-4 md:space-y-6">
                  {/* Availability Card */}
                  <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-5">
                    <button
                      onClick={handleToggleAvailability}
                      className={`w-full py-3.5 rounded-xl font-bold border flex items-center justify-center gap-2 transition-all text-sm ${
                        isAvailable
                          ? "bg-green-950/60 hover:bg-green-900/60 text-green-400 border-green-800"
                          : "bg-red-950/60 hover:bg-red-900/60 text-red-400 border-red-800"
                      }`}
                    >
                      {isAvailable ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      {isAvailable ? "Status: Active Duty" : "Status: Offline"}
                    </button>
                  </div>

                  {/* Statistics Card */}
                  <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-5">
                    <h3 className="text-lg font-bold mb-4">Volunteer Statistics</h3>
                    <div className="space-y-3.5 text-xs md:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tasks Completed</span>
                        <span className="text-green-400 font-bold">{profile.tasksCompleted || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Rating</span>
                        <span className="text-yellow-400 font-bold">⭐ {profile.rating || 5}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Availability</span>
                        <span className={`font-bold ${isAvailable ? "text-green-400" : "text-red-400"}`}>
                          {isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-400 flex-shrink-0">Email</span>
                        <span className="text-blue-400 text-xs truncate max-w-[180px] sm:max-w-none">{profile.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PROFILE FORM */}
                <div className="bg-[#11162B] border border-[#232B4C] rounded-2xl p-5 md:p-6 md:col-span-2">
                  <h3 className="text-base md:text-lg font-bold text-white mb-5">
                    Responder Profile Configurations
                  </h3>

                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-[10px] md:text-xs text-gray-400 font-semibold mb-1 uppercase">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full bg-[#050816] border border-[#232B4C] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-[10px] md:text-xs text-gray-400 font-semibold mb-1 uppercase">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full bg-[#050816] border border-[#232B4C] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[10px] md:text-xs text-gray-400 font-semibold mb-1 uppercase">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full bg-[#050816] border border-[#232B4C] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                        />
                      </div>

                      {/* Skills */}
                      <div>
                        <label className="block text-[10px] md:text-xs text-gray-400 font-semibold mb-1 uppercase">
                          Skills
                        </label>
                        <input
                          type="text"
                          value={profile.skills}
                          onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                          placeholder="Medical, Fire, Rescue"
                          className="w-full bg-[#050816] border border-[#232B4C] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all w-full sm:w-auto text-center"
                      >
                        Save Configuration Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}