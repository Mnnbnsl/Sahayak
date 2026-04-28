import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Upload, MapPin, Send, User, Phone, 
  ChevronDown, CheckCircle, Loader2 
} from "lucide-react";

export default function ReportPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
    location: "",
    category: ""
  });

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const data = new FormData();
    data.append("name", formData.name);
    data.append("phone", formData.phone);
    data.append("description", formData.description);
    data.append("location", formData.location);
    data.append("category", formData.category);
    if (selectedImage) data.append("image", selectedImage);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        alert("Report Sent! AI is now analyzing the severity...");
        navigate("/");
      } else {
        alert("Server error. Please check your backend.");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Failed to connect to server. Make sure your backend is running on port 5000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col items-center py-10 px-4 font-sans">
      
      {/* Header */}
      <div className="w-full max-w-2xl mb-8 flex items-center relative">
        <button 
          onClick={() => navigate("/")} 
          className="p-2 hover:bg-[#1C223C] rounded-full transition-colors absolute -left-12 hidden md:block"
        >
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <div className="w-full text-center">
          <h1 className="text-3xl font-bold tracking-tight">Emergency Report</h1>
          <p className="text-gray-400 mt-1">AI-powered triage and immediate assistance</p>
        </div>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="w-full max-w-2xl bg-[#11162B] border border-[#232B4C] p-8 rounded-[24px] shadow-2xl space-y-6"
      >
        
        {/* Name & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4 text-[#F97316]"/> Name
            </label>
            <input 
              required 
              type="text" 
              placeholder="Full Name" 
              className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 outline-none focus:border-[#F97316] transition-all"
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#F97316]"/> Phone
            </label>
            <input 
              required 
              type="tel" 
              placeholder="Phone Number" 
              className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 outline-none focus:border-[#F97316] transition-all"
              onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#F97316]"/> Location
          </label>
          <input 
            required 
            type="text" 
            placeholder="Area, City, or Landmark" 
            className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 outline-none focus:border-[#F97316] transition-all"
            onChange={(e) => setFormData({...formData, location: e.target.value})} 
          />
        </div>

        {/* Description Section */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">Describe the Emergency</label>
          <textarea 
            required 
            rows="4" 
            placeholder="Please provide details (e.g., 'Fire in apartment', 'Road accident at crossing')" 
            className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 outline-none focus:border-[#F97316] resize-none transition-all"
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
          />
        </div>

        {/* Category Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">Emergency Category</label>
          <div className="relative">
            <select 
              required
              className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 outline-none focus:border-[#F97316] appearance-none cursor-pointer"
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="">Select Category</option>
              <option value="Medical">Medical</option>
              <option value="Fire">Fire</option>
              <option value="Accident">Accident</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Image Upload Area */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 font-sans">Evidence Image (Optional)</label>
          <input type="file" id="img-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
          <label 
            htmlFor="img-upload" 
            className="border-2 border-dashed border-[#2A3459] rounded-xl p-10 flex flex-col items-center justify-center gap-2 hover:bg-[#1C223C] cursor-pointer group transition-all"
          >
            {selectedImage ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in">
                <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                <p className="text-green-500 font-bold">{selectedImage.name}</p>
                <p className="text-xs text-gray-500 mt-1">Click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
                <Upload className="w-12 h-12 text-gray-500 group-hover:text-[#F97316]" />
                <p className="text-gray-400 font-medium mt-2">Click to upload photo</p>
                <p className="text-gray-600 text-xs">Help AI assess severity faster</p>
              </div>
            )}
          </label>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all
            ${isSubmitting 
              ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
              : 'bg-[#F97316] text-white hover:bg-[#EA580C] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]'
            }`}
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Report...</>
          ) : (
            <><Send className="w-5 h-5" /> Submit for AI Analysis</>
          )}
        </button>
      </form>
    </div>
  );
}