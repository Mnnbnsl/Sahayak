import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, ClipboardList, Users, CheckCircle, 
  Settings, Search, Bell, Activity, ShieldCheck, 
  BarChart3, Plus, X, Lock, Mail, UserPlus, LogOut 
} from "lucide-react";

const socket = io("http://localhost:5000");

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, volunteers: 89, resolved: 0 });
  
  // Auth & User States
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null); // Stores logged-in user info
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });

  useEffect(() => {
    // 1. Check if user is already logged in on page load
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/reports");
        const data = await res.json();
        setReports(data);
        setStats(prev => ({ 
          ...prev, 
          total: data.length,
          pending: data.filter(r => r.status === 'Pending').length,
          resolved: data.filter(r => r.status === 'Resolved').length
        }));
      } catch (err) { console.error(err); }
    };
    fetchStats();

    socket.on("new-report", (newReport) => {
      setReports((prev) => [newReport, ...prev]);
      setStats((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
    });

    return () => socket.off("new-report");
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
          alert("Login Successful!");
          // Save both token and user object
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user)); 
          setUser(data.user); // This updates the UI immediately
          setShowAuth(false);
        } else {
          alert("Registration Successful! Please login.");
          setIsLogin(true);
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Server error. Is your backend running?");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    alert("Logged out successfully");
  };

  // Helper to get initials
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div className="flex min-h-screen bg-[#050816] text-white font-sans relative">
      
      {/* AUTH MODAL */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0F24] border border-[#1C223C] w-full max-w-md rounded-[32px] p-8 relative">
            <button onClick={() => setShowAuth(false)} className="absolute top-6 right-6 text-gray-500"><X /></button>
            <h2 className="text-3xl font-bold mb-6">{isLogin ? "Login" : "Register"}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <input type="text" placeholder="Full Name" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4"
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
              )}
              <input type="email" placeholder="Email" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4"
                onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input type="password" placeholder="Password" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4"
                onChange={(e) => setFormData({...formData, password: e.target.value})} />
              <button type="submit" className="w-full bg-[#F97316] text-white font-bold py-4 rounded-xl mt-4 hover:bg-[#EA580C]">
                {isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-400">
              {isLogin ? "New here?" : "Joined already?"} 
              <span onClick={() => setIsLogin(!isLogin)} className="text-[#F97316] cursor-pointer ml-1 font-bold">
                {isLogin ? "Register" : "Login"}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-[#1C223C] bg-[#0A0F24] p-6 hidden lg:flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-[#F97316] rounded-lg"></div>
          <span className="text-xl font-bold">Sahayak</span>
        </div>
        <nav className="space-y-1">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active />
          <NavItem icon={<ClipboardList size={20}/>} label="Review Queue" />
          <NavItem icon={<ShieldCheck size={20}/>} label="Verification" />
          <NavItem icon={<BarChart3 size={20}/>} label="Analytics" />
          <NavItem icon={<Settings size={20}/>} label="Settings" />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input type="text" placeholder="Search incidents..." className="w-full bg-[#11162B] border border-[#1C223C] rounded-full py-2 pl-10 pr-4 outline-none focus:border-[#F97316] text-sm"/>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/report")} className="bg-[#F97316] hover:bg-[#EA580C] text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2">
              <Plus size={18}/> Submit Request
            </button>

            {/* DYNAMIC AUTH SECTION */}
            {!user ? (
              <button onClick={() => { setShowAuth(true); setIsLogin(true); }} className="text-sm font-bold text-gray-400 hover:text-white">
                Login / Sign Up
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-[#11162B] px-3 py-1.5 rounded-full border border-[#1C223C]">
                <span className="text-xs font-bold text-gray-300 hidden md:block">{user.fullName}</span>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                  <LogOut size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 border-l border-[#1C223C] pl-6">
              <div className="relative p-2 bg-[#11162B] rounded-full border border-[#1C223C] cursor-pointer hover:bg-[#1C223C] transition-colors">
                <Bell size={18}/>
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#11162B]"></span>
              </div>
              
              {/* CIRCULAR INITIAL ICON */}
              <div 
                onClick={() => !user && setShowAuth(true)}
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#1C223C] cursor-pointer transition-transform hover:scale-105 shadow-lg ${user ? 'bg-gradient-to-tr from-orange-600 to-yellow-500' : 'bg-[#11162B]'}`}
              >
                <span className="text-sm font-black text-white">
                  {user ? getInitial(user.fullName) : <UserPlus size={18} className="text-gray-500"/>}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="mb-8">
           <h2 className="text-3xl font-bold">Live Dashboard</h2>
           <p className="text-gray-500 text-sm">Welcome back, {user ? user.fullName : "Guest"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Requests" value={stats.total} icon={<Activity className="text-orange-500"/>}/>
          <StatCard label="Pending" value={stats.pending} icon={<Activity className="text-yellow-500"/>}/>
          <StatCard label="Active Volunteers" value={stats.volunteers} icon={<Users className="text-blue-500"/>}/>
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle className="text-green-500"/>}/>
        </div>

        <div className="bg-[#0A0F24] border border-[#1C223C] rounded-[24px] p-8 min-h-[400px]">
           <h3 className="text-xl font-bold mb-6">Crisis Heatmap</h3>
           <div className="h-64 border-2 border-dashed border-[#1C223C] rounded-2xl flex items-center justify-center text-gray-600 bg-[#050816]/50">
             <p className="font-medium">Waiting for geographical data sync...</p>
           </div>
        </div>
      </main>
    </div>
  );
}

// ... NavItem and StatCard components remain the same
function NavItem({ icon, label, active }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-[#F97316]/10 text-[#F97316]' : 'text-gray-500 hover:bg-[#11162B] hover:text-white'}`}>
      {icon} <span className="font-semibold text-sm">{label}</span>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-[#0A0F24] border border-[#1C223C] p-6 rounded-2xl flex items-center justify-between hover:border-[#F97316]/30 transition-colors">
      <div>
        <p className="text-gray-500 text-[10px] font-bold uppercase mb-1 tracking-wider">{label}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
      <div className="p-3 bg-[#11162B] rounded-xl border border-[#1C223C]">{icon}</div>
    </div>
  );
}