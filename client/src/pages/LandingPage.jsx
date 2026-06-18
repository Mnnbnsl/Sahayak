import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Heart, ShieldCheck, ArrowRight } from "lucide-react";

// --- Sub-component for Action Cards ---
const ActionCard = ({ icon: Icon, title, description, buttons = [] }) => (
  <div className="group bg-[#0B0F19]/90 backdrop-blur-md border border-[#1E2640] p-6 sm:p-8 rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:border-[#F97316]/40 hover:-translate-y-2 hover:shadow-[0_12px_30px_-10px_rgba(249,115,22,0.08)] relative z-10">
    {/* Icon Container */}
    <div className="bg-[#131A30] p-4 rounded-xl border border-[#222D4A] mb-5 sm:mb-6 transition-colors duration-300 group-hover:border-[#F97316]/30">
      {Icon && <Icon className="w-8 h-8 text-[#F97316]" />}
    </div>
    
    {/* Title & Description */}
    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2 sm:mb-3">{title}</h3>
    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 flex-grow max-w-xs">{description}</p>
    
    {/* Action Buttons */}
    <div className="w-full space-y-3">
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          onClick={btn.onClick}
          className={`w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.99]
            ${btn.variant === "primary" 
              ? "bg-[#F97316] text-white hover:bg-[#EA580C] shadow-sm" 
              : "bg-[#131A30] text-gray-300 border border-[#222D4A] hover:bg-[#1A233D] hover:text-white"}`}
        >
          <span>{btn.text}</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      ))}
    </div>
  </div>
);

// --- Main Landing Page Component ---
export default function LandingPage() {
  const navigate = useNavigate();
  
  // Typewriter Implementation
  const words = ["It Matters Most", "Lives Are on the Line", "Seconds Count"];
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    let timer;
    const fullWord = words[currentWordIdx];

    const handleType = () => {
      if (!isDeleting) {
        setCurrentText(fullWord.substring(0, currentText.length + 1));
        setTypingSpeed(100);

        if (currentText === fullWord) {
          timer = setTimeout(() => setIsDeleting(true), 2000);
          return;
        }
      } else {
        setCurrentText(fullWord.substring(0, currentText.length - 1));
        setTypingSpeed(50);

        if (currentText === "") {
          setIsDeleting(false);
          setCurrentWordIdx((prev) => (prev + 1) % words.length);
        }
      }
    };

    timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIdx, typingSpeed]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050816] text-white flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-12 md:py-16">
      
      {/* ─── ELEGANT BACKGROUND VECTOR ARC ANIMATION (Inspired by Velvet) ─── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-70">
        <svg className="w-full h-full" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path 
            d="M-100 650C300 500 800 550 1600 200" 
            stroke="url(#arcGradient)" 
            strokeWidth="1.5"
            className="animate-[pulse_4s_ease-in-out_infinite]"
          />
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0" />
              <stop offset="30%" stopColor="#F97316" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Refined Ambient Soft Glow Spotlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-orange-500/[0.03] blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-blue-500/[0.02] blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Hero Header Section */}
      <div className="max-w-4xl w-full text-center mb-12 sm:mb-16 relative z-10 flex flex-col items-center">
        
        {/* Minimalist Tech Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#222D4A] bg-[#0B0F19]/80 text-gray-400 text-xs font-medium tracking-wide mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
          Emergency Coordination Framework
        </div>

        {/* Logo Section */}
        <div className="mb-6 h-20 sm:h-24 flex items-center justify-center">
          <img 
            src="/sahayak-logo.png" 
            alt="Sahayak Logo" 
            className="h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" 
            onError={(e) => { e.target.src = "https://via.placeholder.com/240x100?text=Sahayak"; }}
          />
        </div>
        
        {/* Dynamic Typewriter Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.2] mb-6 min-h-[4.5rem] sm:min-h-[5.5rem] md:min-h-[7rem]">
          Connecting Help When <br className="hidden sm:inline" />
          <span className="text-[#F97316] inline-block relative after:content-[''] after:absolute after:right-[-4px] after:top-[10%] after:bottom-[10%] after:w-[3px] after:bg-[#F97316] after:animate-[pulse_0.8s_infinite]">
            {currentText}
          </span>
        </h1>
        
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto px-2 leading-relaxed font-normal">
          An AI-powered emergency response platform built to securely connect citizens, regional volunteers, and vital response coordinators in real time.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl relative z-10">
        <ActionCard 
          icon={AlertTriangle} 
          title="Need Help?" 
          description="Report an active emergency to trigger immediate automated sorting and dispatch protocols."
          buttons={[{ text: "Report Now", variant: "primary", onClick: () => navigate("/report") }]}
        />
        
        <ActionCard 
          icon={Heart} 
          title="Want to Help?" 
          description="Enlist as a field volunteer to field requests and deliver assistance safely within your area."
          buttons={[
            { text: "Register", variant: "primary", onClick: () => navigate("/volunteer/register") },
            { text: "Login", variant: "secondary", onClick: () => navigate("/volunteer/login") }
          ]}
        />
        
        <ActionCard 
          icon={ShieldCheck} 
          title="Coordinator Access" 
          description="Access tactical administrative control dashboards to prioritize triage logs and assign personnel."
          buttons={[{ 
              text: "Admin Dashboard", 
              variant: "secondary", 
              onClick: () => navigate("/admin") 
          }]}
        />
      </div>

    </div>
  );
}