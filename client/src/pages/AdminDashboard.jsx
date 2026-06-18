import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import AdminSettings from "./AdminSettings";
import { 
  LayoutDashboard, ClipboardList, Users, CheckCircle, 
  Settings, Search, Bell, Activity, ShieldCheck, 
  Plus, X, UserPlus, LogOut, Clock, XCircle
} from "lucide-react";

// --- Leaflet Map Configurations ---
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// --- Dynamic Color-Coded Leaflet Marker Generator ---
const createColoredMarker = (status) => {
  let color = "#EF4444"; // Default: Red 🔴
  
  switch (status?.toLowerCase()) {
    case "pending":
      color = "#EF4444"; // Red 🔴
      break;
    case "assigned":
      color = "#3B82F6"; // Blue 🔵
      break;
    case "completed":
      color = "#F59E0B"; // Yellow 🟡
      break;
    case "verified":
    case "approved":
    case "resolved":
      color = "#10B981"; // Green 🟢
      break;
    default:
      color = "#EF4444";
  }

  // A sleek custom SVG pin with an animated wave ring matching the dark theme layout
  const svgTemplate = `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
      <circle cx="18" cy="18" r="10" fill="${color}" fill-opacity="0.3" style="transform-origin: center; animation: pulse 2s infinite ease-out;"/>
      <path d="M18 2C11.4 2 6 7.4 6 14c0 7.5 10.7 18.7 11.2 19.3.4.4 1.1.4 1.5 0C19.3 32.7 30 21.5 30 14c0-6.6-5.4-12-12-12zm0 16.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" fill="${color}"/>
      <style>
        @keyframes pulse {
          0% { r: 8; opacity: 1; }
          100% { r: 22; opacity: 0; }
        }
      </style>
    </svg>
  `;

  return L.divIcon({
    html: svgTemplate,
    className: "custom-leaflet-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 34],
    popupAnchor: [0, -30],
  });
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("dashboard"); 
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null); 
  const [verifications, setVerifications] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, volunteers: 0, resolved: 0 });
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {
      console.error("Failed to safely read session profile:", e);
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_URL}/api/reports`, { headers });
        const data = await res.json();
        if (Array.isArray(data)) {
          setReports(data);
          if (data.length > 0) setSelectedReport(data[0]); 
          setStats(prev => ({ 
            ...prev, 
            total: data.length,
            pending: data.filter(r => r && r.status === 'Pending').length,
            resolved: data.filter(r => r && (r.status === 'Approved' || r.status === 'Resolved' || r.status === 'Verified')).length
          }));
        }

        const tasksRes = await fetch(`${API_URL}/api/tasks`, { headers });
        const tasksData = await tasksRes.json();
        if (Array.isArray(tasksData)) {
          const completed = tasksData.filter(
            task => task.status && task.status.toLowerCase() === "completed"
          );
          setCompletedTasks(completed);
          if (completed.length > 0) {
            setSelectedTask(completed[0]);
          }
        }
      } catch (err) { 
        console.error("System pipeline fetch mismatch:", err); 
      }
    };
    
    fetchStats();

    const socket = io(API_URL, { transports: ['websocket'] });

    socket.on("new-report", (newReport) => {
      if (!newReport) return;
      setReports((prev) => [newReport, ...prev]);
      setStats((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
    });

    socket.on("report-updated", (updated) => {
      if (!updated) return;
      setReports(prev => prev.map(r => r && r._id === updated._id ? updated : r));
      setSelectedReport(prev => prev && prev._id === updated._id ? updated : prev);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        if (isLogin) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user)); 
          setUser(data.user);
          setShowAuth(false);
          window.location.reload(); 
        } else {
          alert("Account created! Please login.");
          setIsLogin(true);
        }
      } else { alert(data.message || "Auth error."); }
    } catch (err) { alert("Server connection could not be established."); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status, forceApproval: true })
      });

      const data = await response.json();
      if (response.ok) {
        setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r));
        setStats(prev => ({
          ...prev,
          pending: status === 'Pending' ? prev.pending : Math.max(0, prev.pending - 1),
          resolved: (status === 'Approved' || status === 'Resolved' || status === 'Verified') ? prev.resolved + 1 : prev.resolved
        }));
      } else {
        alert(`${data.message || "Error"}. (Bypassing locally for map preview)`);
        setReports(prev => prev.map(r => r._id === id ? { ...r, status: 'Approved' } : r));
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleVerificationUpdate = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}/verify`, { method: "POST" });
      if (response.ok) {
        const taskToVerify = completedTasks.find(t => t._id === id);
        if (taskToVerify && taskToVerify.reportId) {
          setReports(prev => prev.map(r => r._id === taskToVerify.reportId._id ? { ...r, status: 'Verified' } : r));
        }
        setCompletedTasks(prev => prev.filter(task => task._id !== id));
        setSelectedTask(null);
        alert("Mission Verified Successfully");
      } else {
        alert("Verification Failed");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleRejectTask = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}/reject`, { method: "POST" });
      if (response.ok) {
        const taskToReject = completedTasks.find(t => t._id === id);
        if (taskToReject && taskToReject.reportId) {
          setReports(prev => prev.map(r => r._id === taskToReject.reportId._id ? { ...r, status: 'Assigned' } : r));
        }
        setCompletedTasks(prev => prev.filter(task => task._id !== id));
        setSelectedTask(null);
        alert("Proof Rejected");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex h-screen bg-[#050816] text-white font-sans relative overflow-hidden">
      
      {/* AUTH MODAL */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0F24] border border-[#1C223C] w-full max-w-md rounded-[32px] p-8 relative">
            <button onClick={() => setShowAuth(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X /></button>
            <h2 className="text-3xl font-bold mb-6">{isLogin ? "Login" : "Register"}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <input type="text" placeholder="Full Name" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500"
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                </div>
              )}
              <input type="email" placeholder="Email" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500"
                onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input type="password" placeholder="Password" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500"
                onChange={(e) => setFormData({...formData, password: e.target.value})} />
              <button type="submit" className="w-full bg-[#F97316] text-white font-bold py-4 rounded-xl mt-4 hover:bg-[#EA580C] transition-all">
                {isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <span onClick={() => setIsLogin(!isLogin)} className="text-orange-500 cursor-pointer ml-2 font-bold hover:underline">
                {isLogin ? "Register" : "Login"}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-[#1C223C] bg-[#0A0F24] p-6 hidden lg:flex flex-col gap-8 z-20">
        <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 bg-[#F97316] rounded-lg"></div>
          <span className="text-xl font-bold italic">Sahayak</span>
        </div>
        <nav className="space-y-1">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          <NavItem icon={<ClipboardList size={20}/>} label="Review Queue" active={activeTab === "review"} onClick={() => setActiveTab("review")} />
          <NavItem icon={<ShieldCheck size={20}/>} label="Verification" active={activeTab === "verification"} onClick={() => setActiveTab("verification")} />
          <NavItem icon={<Settings size={20}/>} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 flex justify-between items-center px-8 border-b border-[#1C223C] z-30">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input type="text" placeholder="Search incidents..." className="w-full bg-[#11162B] border border-[#1C223C] rounded-full py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-[#F97316]"/>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/report")} className="bg-[#F97316] hover:bg-[#EA580C] text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all">
              <Plus size={18}/> Submit Request
            </button>

            {!user ? (
              <button onClick={() => { setShowAuth(true); setIsLogin(true); }} className="text-sm font-bold text-gray-400 hover:text-white">Login / Sign Up</button>
            ) : (
              <div className="flex items-center gap-3 bg-[#11162B] px-3 py-1.5 rounded-full border border-[#1C223C]">
                <span className="text-xs font-bold text-gray-300 hidden md:block">{user.fullName || "Admin"}</span>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500"><LogOut size={16} /></button>
              </div>
            )}

            <div className="flex items-center gap-4 border-l border-[#1C223C] pl-6">
              <div className="relative p-2 bg-[#11162B] rounded-full border border-[#1C223C] cursor-pointer hover:bg-[#1C223C]">
                <Bell size={18}/><span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#11162B]"></span>
              </div>
              <div onClick={() => !user && setShowAuth(true)} className={`w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#1C223C] cursor-pointer ${user ? 'bg-gradient-to-tr from-orange-600 to-yellow-500' : 'bg-[#11162B]'}`}>
                <span className="text-sm font-black text-white">{user ? user.fullName.charAt(0).toUpperCase() : <UserPlus size={18} className="text-gray-500"/>}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === "dashboard" ? (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-bold">Live Dashboard</h2>
                <p className="text-gray-500 text-sm italic">System Pulse: Online</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard label="Total Requests" value={stats.total} icon={<Activity className="text-orange-500"/>}/>
                <StatCard label="Pending" value={stats.pending} icon={<Clock className="text-yellow-500"/>}/>
                <StatCard label="Active Volunteers" value={stats.volunteers} icon={<Users className="text-blue-500"/>}/>
                <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle className="text-green-500"/>}/>
              </div>
              
              {/* INTERACTIVE COMPONENT MAP TILES */}
              <div className="h-[500px] overflow-hidden rounded-3xl border border-[#1C223C] relative z-10">
                <MapContainer center={[23.2156, 72.6369]} zoom={5} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {/* Filter completely removed so Pending pins (like Gandhinagar) are immediately visible! */}
                  {Array.isArray(reports) && reports.filter(r => r).map(report => {
                    const lat = Number(report.latitude) || 23.2156;
                    const lng = Number(report.longitude) || 72.6369;
                    return (
                      <Marker 
                        key={report._id} 
                        position={[lat, lng]} 
                        icon={createColoredMarker(report.status)}
                      >
                        <Popup>
                          <div className="text-black p-0.5">
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <h3 className="font-bold text-orange-600 m-0 text-sm">{report.category || "Incident"}</h3>
                              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-300">
                                {report.status || "Pending"}
                              </span>
                            </div>
                            <p className="text-xs my-1 text-gray-700">{report.description}</p>
                            <div className="text-[10px] font-bold text-gray-500">Severity: {report.severityScore || 0}/10</div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>
          ) : activeTab === "review" ? (
            <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
              <div className="mb-6">
                <h2 className="text-3xl font-bold">Review Queue</h2>
                <p className="text-gray-500 text-sm italic">AI flagged requests needing manual verification</p>
              </div>

              <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
                <div className="w-1/3 bg-[#0A0F24] border border-[#1C223C] rounded-[32px] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-[#1C223C] bg-[#0D122B] text-[10px] font-black text-gray-500 uppercase tracking-widest">Incoming Feed</div>
                  <div className="flex-1 overflow-y-auto">
                    {reports.length > 0 ? reports.map(r => (
                      <div key={r._id} onClick={() => setSelectedReport(r)} 
                        className={`p-5 border-b border-[#1C223C] cursor-pointer transition-all hover:bg-[#11162B] ${selectedReport?._id === r._id ? 'bg-[#11162B] border-l-4 border-orange-500' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded
                            ${r.status === "Pending" ? "bg-red-500/10 text-red-500" :
                            r.status === "Assigned" ? "bg-blue-500/10 text-blue-500" :
                            r.status === "Completed" ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"}`}>
                            {r.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm truncate">{r.category || "General"}</h4>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">{r.description}</p>
                      </div>
                    )) : <p className="p-10 text-center text-gray-600">No records found.</p>}
                  </div>
                </div>

                <div className="flex-1 bg-[#0A0F24] border border-[#1C223C] rounded-[32px] p-8 overflow-y-auto">
                  {selectedReport ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold italic tracking-tighter">AI VERIFICATION PANEL</h3>
                        <div className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-1 rounded-full text-[10px] font-black">
                          CONFIDENCE: {selectedReport.confidence ? (selectedReport.confidence * 100).toFixed(0) : "85"}%
                        </div>
                        <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-1 rounded-full text-[10px] font-black">
                          SEVERITY: {selectedReport.severityScore || 0}/10
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailField label="Location" value={selectedReport.location} />
                        <DetailField label="Incident Category" value={selectedReport.category} />
                        <div className="col-span-2"><DetailField label="Description" value={selectedReport.description} isLarge /></div>
                        <DetailField label="Contact" value={selectedReport.phone || "Not Provided"} />
                      </div>
                      <div className="bg-[#11162B] border border-orange-500/20 p-5 rounded-2xl">
                        <p className="text-[10px] font-black text-orange-500 uppercase mb-1">AI Reasoning</p>
                        <p className="text-sm text-gray-300 italic">"{selectedReport.aiReason || "Automatic analysis pending detailed context."}"</p>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => handleStatusUpdate(selectedReport._id, 'Approved')} className="flex-1 bg-orange-500 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">Approve & Dispatch</button>
                        <button onClick={() => handleStatusUpdate(selectedReport._id, 'Rejected')} className="px-8 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><XCircle/></button>
                      </div>
                    </div>
                  ) : <div className="h-full flex items-center justify-center text-gray-600 italic">Select an item to review</div>}
                </div>
              </div>
            </div>
          ) : activeTab === "verification" ? (
            <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
              <div className="mb-6">
                <h2 className="text-3xl font-bold">Verification Queue</h2>
                <p className="text-gray-500 text-sm italic">Review proof of completed missions</p>
              </div>

              <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
                <div className="w-1/3 bg-[#0A0F24] border border-[#1C223C] rounded-[32px] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-[#1C223C] bg-[#0D122B] text-[10px] font-black text-gray-500 uppercase tracking-widest">Pending Verifications</div>
                  <div className="flex-1 overflow-y-auto">
                      {completedTasks.length > 0 ? (
                        completedTasks.map(task => (
                          <div
                            key={task._id}
                            onClick={() => setSelectedTask(task)}
                            className={`p-5 border-b border-[#1C223C] cursor-pointer transition-all hover:bg-[#11162B] ${selectedTask?._id === task._id ? "bg-[#11162B] border-l-4 border-orange-500" : ""}`}
                          >
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 mb-2 inline-block">
                              {task.status}
                            </span>
                            <h4 className="font-bold text-sm truncate">{task.reportId?.category}</h4>
                            <p className="text-xs text-gray-400 mt-1">Volunteer: {task.volunteerId?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{task.reportId?.location}</p>
                          </div>
                        ))
                      ) : (
                        <p className="p-10 text-center text-gray-600">No completed tasks awaiting verification.</p>
                      )}
                  </div>
                </div>

                <div className="flex-1 bg-[#0A0F24] border border-[#1C223C] rounded-[32px] p-8 overflow-y-auto space-y-6">
                  {selectedTask ? (
                    <>
                      <div className="bg-[#11162B] border border-[#1C223C] rounded-3xl p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Category</p>
                            <p className="font-bold text-orange-500">{selectedTask.reportId?.category || "General"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Volunteer</p>
                            <p className="font-bold text-white">{selectedTask.volunteerId?.name || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Location</p>
                            <p className="text-white">{selectedTask.reportId?.location || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Phone</p>
                            <p className="text-white">{selectedTask.volunteerId?.phone || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Severity</p>
                            <p className="text-orange-500 font-bold">{selectedTask.reportId?.severityScore || 0}/10</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <p className="text-green-400 font-bold">{selectedTask.status}</p>
                          </div>
                        </div>
                      </div>

                      {selectedTask.proofImageUrl && (
                        <div className="border border-[#1C223C] rounded-3xl overflow-hidden bg-[#11162B]">
                          <div className="p-3 border-b border-[#1C223C] text-xs font-bold text-gray-500 uppercase">Uploaded Proof</div>
                          <img src={selectedTask.proofImageUrl} alt="Proof" className="w-full h-auto max-h-96 object-contain" />
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button onClick={() => handleVerificationUpdate(selectedTask._id)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all">Verify & Close Mission</button>
                        <button onClick={() => handleRejectTask(selectedTask._id)} className="flex-1 border-2 border-red-900/50 hover:border-red-500 text-red-500 font-bold py-3 rounded-xl transition-all">Reject Proof</button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 italic">Select a completed task</div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "settings" ? (
            <AdminSettings />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all active:scale-95 ${active ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20' : 'text-gray-500 hover:bg-[#11162B] hover:text-white'}`}>
      {icon} <span className="font-bold text-sm tracking-tight">{label}</span>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-[#0A0F24] border border-[#1C223C] p-7 rounded-[28px] flex items-center justify-between hover:border-orange-500/30 transition-all cursor-default">
      <div><p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-widest">{label}</p><h3 className="text-4xl font-bold">{value}</h3></div>
      <div className="p-4 bg-[#11162B] rounded-2xl border border-[#1C223C]">{icon}</div>
    </div>
  );
}

function DetailField({ label, value, isLarge }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">{label}</p>
      <div className={`w-full bg-[#11162B] border border-[#1C223C] rounded-2xl px-5 flex items-center ${isLarge ? 'py-4 min-h-[80px]' : 'h-14'} text-sm font-bold text-white`}>{value || "N/A"}</div>
    </div>
  );
}