import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ClipboardList, CheckCircle, MapPin, Search, Bell, Upload, Loader2, ArrowLeft, X, UserPlus, LogOut
} from "lucide-react";

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", skills: "Medical", location: "City Center" });

  const API_URL = import.meta.env.VITE_API_URL || "https://sahayak-dh3b.onrender.com";

  useEffect(() => {
    const savedUser = localStorage.getItem("vol_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const fetchTasks = async () => {
      const token = localStorage.getItem("vol_token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/tasks/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setTasks(data);
        if (data.length > 0) setSelectedTask(data[0]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTasks();
  }, [API_URL, user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "/api/auth/volunteer/login" : "/api/auth/volunteer/register";
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        if (isLogin) {
          localStorage.setItem("vol_token", data.token);
          localStorage.setItem("vol_user", JSON.stringify(data.user)); 
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
    localStorage.removeItem("vol_token");
    localStorage.removeItem("vol_user");
    setUser(null);
    setTasks([]);
    setSelectedTask(null);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedImage) return alert("Please upload a proof image to complete the task.");
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("proofImage", selectedImage);

    try {
      const response = await fetch(`${API_URL}/api/tasks/${selectedTask._id}/complete`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Task marked as completed! Awaiting admin verification.");
        setTasks(prev => prev.map(t => t._id === selectedTask._id ? { ...t, status: "COMPLETED" } : t));
        setSelectedTask(prev => ({ ...prev, status: "COMPLETED" }));
        setSelectedImage(null);
      } else {
        alert("Failed to complete task.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050816] text-white font-sans overflow-hidden relative">

      {/* AUTH MODAL */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0F24] border border-[#1C223C] w-full max-w-md rounded-[32px] p-8 relative">
            <button onClick={() => setShowAuth(false)} className="absolute top-6 right-6 text-gray-500"><X /></button>
            <h2 className="text-3xl font-bold mb-6">{isLogin ? "Volunteer Login" : "Join as Volunteer"}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                  <input type="text" placeholder="Full Name" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 outline-none focus:border-blue-500"
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                  <input type="text" placeholder="Location" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 outline-none focus:border-blue-500"
                    onChange={(e) => setFormData({...formData, location: e.target.value})} />
                  <select required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 outline-none focus:border-blue-500"
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}>
                    <option value="Medical">Medical</option>
                    <option value="Fire">Fire</option>
                    <option value="Accident">Accident</option>
                    <option value="General">General/Other</option>
                  </select>
                </div>
              )}
              <input type="email" placeholder="Email" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 outline-none focus:border-blue-500"
                onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input type="password" placeholder="Password" required className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl py-3 px-4 outline-none focus:border-blue-500"
                onChange={(e) => setFormData({...formData, password: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 hover:bg-blue-500 transition-all active:scale-95">
                {isLogin ? "Sign In" : "Register"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already a volunteer?"}
              <span onClick={() => setIsLogin(!isLogin)} className="text-blue-500 cursor-pointer ml-2 font-bold hover:underline">
                {isLogin ? "Join Now" : "Login"}
              </span>
            </p>
          </div>
        </div>
      )}
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-[#1C223C] bg-[#0A0F24] p-6 hidden lg:flex flex-col gap-8 z-20">
        <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center">
             <ArrowLeft className="text-white w-4 h-4" />
          </div>
          <span className="text-xl font-bold italic">Volunteer</span>
        </div>
        <nav className="space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
            <ClipboardList size={20}/> <span className="font-bold text-sm tracking-tight">My Tasks</span>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 flex justify-between items-center px-8 border-b border-[#1C223C]">
          <h1 className="text-xl font-bold tracking-tight text-gray-300">Active Missions</h1>
          <div className="flex items-center gap-4">
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
                <Bell size={18}/><span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#11162B]"></span>
              </div>
              <div onClick={() => !user && setShowAuth(true)} className={`w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#1C223C] cursor-pointer ${user ? 'bg-gradient-to-tr from-blue-600 to-cyan-500' : 'bg-[#11162B]'}`}>
                <span className="text-sm font-black text-white">{user ? user.fullName.charAt(0).toUpperCase() : <UserPlus size={18} className="text-gray-500"/>}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="mb-6">
              <h2 className="text-3xl font-bold">Task Queue</h2>
              <p className="text-gray-500 text-sm italic">Respond to emergencies assigned to you</p>
            </div>

            <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
              {/* LIST COLUMN */}
              <div className="w-1/3 bg-[#0A0F24] border border-[#1C223C] rounded-[32px] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-[#1C223C] bg-[#0D122B] text-[10px] font-black text-gray-500 uppercase tracking-widest">Assigned Tasks</div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {tasks.length > 0 ? tasks.map(t => (
                    <div key={t._id} onClick={() => setSelectedTask(t)} 
                      className={`p-5 border-b border-[#1C223C] cursor-pointer transition-all hover:bg-[#11162B] ${selectedTask?._id === t._id ? 'bg-[#11162B] border-l-4 border-blue-500' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${t.status === "COMPLETED" ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"}`}>
                          {t.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm truncate">{t.reportId?.category || "Emergency Task"}</h4>
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                        <MapPin className="w-3 h-3 text-gray-500" /> {t.reportId?.location || "Unknown"}
                      </div>
                    </div>
                  )) : <p className="p-10 text-center text-gray-600">No tasks assigned yet.</p>}
                </div>
              </div>

              {/* DETAILS COLUMN */}
              <div className="flex-1 bg-[#0A0F24] border border-[#1C223C] rounded-[32px] p-8 overflow-y-auto custom-scrollbar">
                {selectedTask ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold italic tracking-tighter">MISSION DETAILS</h3>
                      {selectedTask.status === "COMPLETED" && (
                        <div className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
                          <CheckCircle size={12} /> COMPLETED
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailField label="Location" value={selectedTask.reportId?.location} />
                      <DetailField label="Category" value={selectedTask.reportId?.category} />
                      <div className="col-span-2"><DetailField label="Description" value={selectedTask.reportId?.description} isLarge /></div>
                      <DetailField label="Contact Info" value={selectedTask.reportId?.phone} />
                    </div>

                    {selectedTask.status !== "COMPLETED" && (
                      <div className="bg-[#11162B] border border-[#1C223C] p-6 rounded-2xl space-y-4">
                        <h4 className="text-sm font-bold text-gray-300">Complete Task</h4>
                        <p className="text-xs text-gray-500">Upload visual proof of the resolved situation to complete this mission.</p>
                        
                        <input type="file" id="proof-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
                        <label 
                          htmlFor="proof-upload" 
                          className="border-2 border-dashed border-[#2A3459] rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-[#1C223C] cursor-pointer transition-all"
                        >
                          {selectedImage ? (
                            <div className="text-center">
                              <p className="text-blue-500 font-bold text-sm">{selectedImage.name}</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Upload size={18} /> <span className="text-sm font-bold">Upload Proof Image</span>
                            </div>
                          )}
                        </label>

                        <button 
                          onClick={handleCompleteTask} 
                          disabled={isSubmitting || !selectedImage}
                          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSubmitting || !selectedImage ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'}`}
                        >
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                          Submit for Verification
                        </button>
                      </div>
                    )}
                  </div>
                ) : <div className="h-full flex items-center justify-center text-gray-600 italic">Select a task to view details</div>}
              </div>
            </div>
          </div>
        </div>
      </main>
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
