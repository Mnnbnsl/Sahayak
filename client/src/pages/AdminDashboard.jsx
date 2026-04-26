import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, ClipboardList, Users, CheckCircle, 
  Settings, Search, Bell, Activity, ShieldCheck, 
  Plus, X, UserPlus, LogOut, MapPin, Clock, Edit3, XCircle
} from "lucide-react";

const socket = io("http://localhost:5000");

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("dashboard"); 
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null); // Added for Review Queue logic
  const [stats, setStats] = useState({ total: 0, pending: 0, volunteers: 89, resolved: 0 });
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/reports");
        const data = await res.json();
        setReports(data);
        if (data.length > 0) setSelectedReport(data[0]); // Default selection
        setStats(prev => ({ 
          ...prev, 
          total: data.length,
          pending: data.filter(r => r.status === 'Pending').length,
          resolved: data.filter(r => r.status === 'Approved').length
        }));
      } catch (err) { console.error(err); }
    };
    fetchStats();

    socket.on("new-report", (newReport) => {
      setReports((prev) => [newReport, ...prev]);
      setStats((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
    });

    socket.on("report-updated", (updated) => {
      setReports(prev => prev.map(r => r._id === updated._id ? updated : r));
    });

    return () => {
      socket.off("new-report");
      socket.off("report-updated");
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
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
        } else {
          alert("Account created! Please login.");
          setIsLogin(true);
        }
      } else { alert(data.message); }
    } catch (err) { alert("Server error."); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await fetch(`http://localhost:5000/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-screen bg-[#050816] text-white font-sans relative overflow-hidden">
      
      {/* AUTH MODAL - FIXED REGISTER LOGIC */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0F24] border border-[#1C223C] w-full max-w-md rounded-[32px] p-8 relative">
            <button onClick={() => setShowAuth(false)} className="absolute top-6 right-6 text-gray-500"><X /></button>
            <h2 className="text-3xl font-bold mb-6">{isLogin ? "Login" : "Register"}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {/* This field now properly appears when isLogin is false */}
              {!isLogin && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <input type="text" placeholder="Full Name" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 outline-none focus:border-orange-500"
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                </div>
              )}
              <input type="email" placeholder="Email" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 outline-none focus:border-orange-500"
                onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input type="password" placeholder="Password" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 outline-none focus:border-orange-500"
                onChange={(e) => setFormData({...formData, password: e.target.value})} />
              <button type="submit" className="w-full bg-[#F97316] text-white font-bold py-4 rounded-xl mt-4 hover:bg-[#EA580C] transition-all active:scale-95">
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
          <NavItem icon={<ShieldCheck size={20}/>} label="Verification" onClick={() => alert("Coming soon")} />
          <NavItem icon={<Settings size={20}/>} label="Settings" onClick={() => alert("Coming soon")} />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 flex justify-between items-center px-8 border-b border-[#1C223C]">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input type="text" placeholder="Search incidents..." className="w-full bg-[#11162B] border border-[#1C223C] rounded-full py-2 pl-10 pr-4 outline-none focus:border-[#F97316] text-sm"/>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/report")} className="bg-[#F97316] hover:bg-[#EA580C] text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all active:scale-95">
              <Plus size={18}/> Submit Request
            </button>

            {!user ? (
              <button onClick={() => { setShowAuth(true); setIsLogin(true); }} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Login / Sign Up</button>
            ) : (
              <div className="flex items-center gap-3 bg-[#11162B] px-3 py-1.5 rounded-full border border-[#1C223C]">
                <span className="text-xs font-bold text-gray-300 hidden md:block">{user.fullName}</span>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors"><LogOut size={16} /></button>
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
            /* --- DASHBOARD VIEW --- */
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
              <div className="bg-[#0A0F24] border border-[#1C223C] rounded-[32px] p-8 min-h-[400px]">
                <h3 className="text-xl font-bold mb-6 italic tracking-tighter">CRISIS HEATMAP</h3>
                <div className="h-64 border-2 border-dashed border-[#1C223C] rounded-3xl flex items-center justify-center text-gray-700 bg-[#050816]/50">
                  <p className="font-bold uppercase text-xs tracking-widest">Awaiting Live Geo-Stream...</p>
                </div>
              </div>
            </div>
          ) : (
            /* --- REVIEW QUEUE VIEW - FIXED SPLIT UI --- */
            <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
              <div className="mb-6">
                <h2 className="text-3xl font-bold">Review Queue</h2>
                <p className="text-gray-500 text-sm italic">AI flagged requests needing manual verification</p>
              </div>

              <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
                {/* LIST COLUMN */}
                <div className="w-1/3 bg-[#0A0F24] border border-[#1C223C] rounded-[32px] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-[#1C223C] bg-[#0D122B] text-[10px] font-black text-gray-500 uppercase tracking-widest">Incoming Feed</div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {reports.length > 0 ? reports.map(r => (
                      <div key={r._id} onClick={() => setSelectedReport(r)} 
                        className={`p-5 border-b border-[#1C223C] cursor-pointer transition-all hover:bg-[#11162B] ${selectedReport?._id === r._id ? 'bg-[#11162B] border-l-4 border-orange-500' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-orange-500 uppercase px-2 py-0.5 bg-orange-500/10 rounded">{r.status}</span>
                          <span className="text-[10px] text-gray-500 italic">Recent</span>
                        </div>
                        <h4 className="font-bold text-sm truncate">{r.category || "General"}</h4>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">{r.description}</p>
                      </div>
                    )) : <p className="p-10 text-center text-gray-600">No records found.</p>}
                  </div>
                </div>

                {/* DETAILS COLUMN */}
                <div className="flex-1 bg-[#0A0F24] border border-[#1C223C] rounded-[32px] p-8 overflow-y-auto custom-scrollbar">
                  {selectedReport ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold italic tracking-tighter">AI VERIFICATION PANEL</h3>
                        <div className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-1 rounded-full text-[10px] font-black">
                          CONFIDENCE: {selectedReport.severityScore || 7}/10
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
                        <button onClick={() => handleStatusUpdate(selectedReport._id, 'Approved')} className="flex-1 bg-orange-500 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 active:scale-95 transition-all">Approve & Dispatch</button>
                        <button onClick={() => handleStatusUpdate(selectedReport._id, 'Rejected')} className="px-8 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"><XCircle/></button>
                      </div>
                    </div>
                  ) : <div className="h-full flex items-center justify-center text-gray-600 italic">Select an item to review</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- REUSABLE COMPONENTS ---
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
      <div className={`w-full bg-[#11162B] border border-[#1C223C] rounded-2xl px-5 flex items-center ${isLarge ? 'py-4 min-h-[80px]' : 'h-14'} text-sm font-bold`}>{value || "N/A"}</div>
    </div>
  );
}