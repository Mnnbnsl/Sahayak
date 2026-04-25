import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Heart, ShieldCheck, ArrowRight } from "lucide-react";

const ActionCard = ({ icon: Icon, title, description, buttons = [] }) => (
  <div className="bg-[#11162B] border border-[#232B4C] p-8 rounded-[24px] flex flex-col items-center text-center shadow-2xl h-full transition-all hover:border-[#F97316]/50 hover:-translate-y-2">
    <div className="bg-[#1C223C] p-4 rounded-2xl border border-[#2A3459] mb-6">
      {Icon && <Icon className="w-10 h-10 text-[#F97316]" />}
    </div>
    <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-grow">{description}</p>
    <div className="w-full space-y-3">
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          onClick={btn.onClick}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all
            ${btn.variant === "primary" 
              ? "bg-[#F97316] text-white hover:bg-[#EA580C]" 
              : "bg-[#1C223C] text-gray-300 border border-[#2A3459] hover:bg-[#232B4C]"}`}
        >
          {btn.text} <ArrowRight className="w-5 h-5" />
        </button>
      ))}
    </div>
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full text-center mb-16">
        <img src="/sahayak-logo.png" alt="Sahayak Logo" className="h-20 mx-auto mb-6" 
             onError={(e) => e.target.src = "https://via.placeholder.com/200x80?text=Sahayak"}/>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          Connecting Help When <br/><span className="text-[#F97316]">It Matters Most</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        <ActionCard 
          icon={AlertTriangle} title="Need Help?" 
          description="Report an emergency and get immediate assistance from our AI triage and volunteer network."
          buttons={[{ text: "Report Now", variant: "primary", onClick: () => navigate("/report") }]}
        />
        <ActionCard 
          icon={Heart} title="Want to Help?" 
          description="Join as a volunteer and support those in need in your community."
          buttons={[
            { text: "Register", variant: "primary", onClick: () => navigate("/volunteer/register") },
            { text: "Login", variant: "secondary", onClick: () => navigate("/volunteer/login") }
          ]}
        />
        <ActionCard 
          icon={ShieldCheck} title="Coordinator Access" 
          description="Manage emergency reports and deploy local resources effectively."
          buttons={[{ text: "Admin Login", variant: "secondary", onClick: () => navigate("/admin/login") }]}
        />
      </div>
    </div>
  );
}