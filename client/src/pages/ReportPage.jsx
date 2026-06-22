import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Upload,
  MapPin,
  Send,
  User,
  Phone,
  ChevronDown,
  Loader2,
  Trash2,
  AlertTriangle
} from "lucide-react";

export default function ReportPage() {
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  
  // GPS & Geocoding States
  const [gpsStatus, setGpsStatus] = useState("idle"); // 'idle', 'detecting', 'success', 'failed'
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
    location: "",
    category: "",
    latitude: null,
    longitude: null
  });

  // Memory Leak Fix: Clean up object URL when image changes or component unmounts[cite: 1]
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Function to capture GPS and translate coordinates -> address strings cleanly[cite: 1]
  const handleFetchCurrentLocation = (e) => {
    if (e) e.preventDefault();
    
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setGpsStatus("failed");
      return;
    }

    setGpsStatus("detecting");
    setIsGeocoding(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        setGpsStatus("success");

        try {
          // Reverse geocoding via OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: {
                "User-Agent": "Sahayak-Emergency-Platform"
              }
            }
          );
          
          if (!response.ok) throw new Error("Geocoding failed");
          
          const data = await response.json();
          
          if (data && data.display_name) {
            setFormData((prev) => ({
              ...prev,
              location: data.display_name
            }));
            toast.success("Location coordinates and address loaded");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast.error("Coordinates captured, but failed to fetch address text");
        } finally {
          setIsGeocoding(false);
        }
      },
      (error) => {
        console.error("GPS Error:", error.message);
        setGpsStatus("failed");
        setIsGeocoding(false);
        toast.error("Could not access physical GPS permissions");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = (e) => {
    e.preventDefault();
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("phone", formData.phone);
    data.append("description", formData.description);
    data.append("location", formData.location);
    data.append("category", formData.category === "Other" ? customCategory : formData.category);
    
    // Send fallback coordinates if user hasn't explicitly clicked "Use Current Location"
    data.append("latitude", formData.latitude || "");
    data.append("longitude", formData.longitude || "");

    if (selectedImage) {
      data.append("image", selectedImage);
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        body: data
      });

      const result = await response.json();

      if (response.ok) {
        // 1. Toast for polished UI (if configured)[cite: 1]
        toast.success("Emergency report submitted successfully");
        // 2. Safe browser fallback alert so you never miss a confirmation message
        alert("Report submitted successfully! AI is analyzing the emergency.");
        
        navigate("/");
      } else {
        toast.error(result.message || "Failed to submit report");
        alert(result.message || "Server Error encountered during submission");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit report");
      alert("Could not connect to backend. Make sure the server is running on port 5000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col items-center py-6 md:py-12 px-4 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Panel */}
      <div className="w-full max-w-3xl mb-6 flex flex-col items-center relative z-10 min-h-[44px]">
        <div className="w-full flex items-center justify-between mb-4 relative">
          <button
            onClick={() => navigate("/")}
            className="p-2.5 bg-[#11162B] border border-[#232B4C] hover:bg-[#1C223C] rounded-full transition-all absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center active:scale-95 z-20"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div className="w-full text-center px-12">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Emergency Report
            </h1>
          </div>
        </div>
        
        <div className="w-full flex justify-center px-2">
          <div className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs md:text-sm text-center max-w-md sm:max-w-none">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>Report emergencies for immediate volunteer assistance</span>
          </div>
        </div>
      </div>

      {/* Main Card Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl bg-[#11162B]/70 backdrop-blur-md border border-[#232B4C] p-5 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.08)] space-y-5 relative z-10"
      >
        {/* Name & Phone Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs md:text-sm font-semibold text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4 text-[#F97316]" />
              Name
            </label>
            <input
              required
              type="text"
              placeholder="Full Name"
              value={formData.name}
              className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F97316] transition-colors"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs md:text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#F97316]" />
              Phone Number
            </label>
            <input
              required
              type="tel"
              placeholder="Active Phone Number"
              value={formData.phone}
              className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F97316] transition-colors"
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        {/* Controlled Location Form Row with Action Inline Button */}
        <div className="space-y-2">
          <label className="text-xs md:text-sm font-semibold text-gray-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#F97316]" />
            Location
          </label>
          <div className="relative flex items-center w-full">
            <input
              required
              type="text"
              placeholder="Area, City, Landmark, or House No."
              value={formData.location}
              className="w-full bg-[#050816] border border-[#2A3459] rounded-xl pl-4 pr-32 py-3 text-sm outline-none focus:border-[#F97316] transition-colors truncate"
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <button
              type="button"
              disabled={isGeocoding}
              onClick={handleFetchCurrentLocation}
              className="absolute right-2 px-3 py-1.5 bg-[#1C223C] hover:bg-[#252C4E] border border-[#2A3459] text-xs font-medium text-gray-300 hover:text-white rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {isGeocoding ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#F97316]" />
              ) : (
                <MapPin className="w-3 h-3 text-[#F97316]" />
              )}
              <span>Use GPS</span>
            </button>
          </div>

          {/* Dynamic Status Badging below input row */}
          <div className="flex items-center gap-2 text-xs pt-0.5">
            {gpsStatus === "success" && (
              <span className="text-green-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                GPS location detected
              </span>
            )}
            {gpsStatus === "detecting" && (
              <span className="text-yellow-400 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Detecting GPS location...
              </span>
            )}
            {gpsStatus === "failed" && (
              <span className="text-red-400">
                GPS unavailable. Using fallback location coordinates.
              </span>
            )}
          </div>
        </div>

        {/* Description & Counter */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs md:text-sm font-semibold text-gray-300">
              Describe the Emergency
            </label>
            <span className="text-xs text-gray-500">
              {formData.description.length}/500
            </span>
          </div>
          <textarea
            required
            maxLength={500}
            rows="3"
            placeholder="Provide clear operational details..."
            value={formData.description}
            className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F97316] transition-colors resize-none"
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Category Selector */}
        <div className="space-y-2">
          <label className="text-xs md:text-sm font-semibold text-gray-300">
            Emergency Category
          </label>
          <div className="relative">
            <select
              required
              value={formData.category}
              className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 text-sm appearance-none focus:border-[#F97316] outline-none cursor-pointer"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select Category</option>
              <option value="Medical">Medical Emergency</option>
              <option value="Fire">Fire Incident</option>
              <option value="Accident">Road Accident</option>
              <option value="Flood">Flood / Water Logging</option>
              <option value="Earthquake">Earthquake</option>
              <option value="Building Collapse">Building Collapse</option>
              <option value="Landslide">Landslide</option>
              <option value="Rescue">Rescue Required</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 w-4 h-4" />
          </div>

          {formData.category === "Other" && (
            <div className="mt-2">
              <input
                required
                type="text"
                placeholder="Specify Emergency Type"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F97316]"
              />
            </div>
          )}
        </div>

        {/* Upload Box & Image Preview */}
        <div className="space-y-2">
          <label className="text-xs md:text-sm font-semibold text-gray-300">
            Upload Evidence
          </label>
          <input
            type="file"
            id="img-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />

          {!imagePreview ? (
            <label
              htmlFor="img-upload"
              className="border-2 border-dashed border-[#2A3459] rounded-xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#F97316] transition-colors"
            >
              <Upload className="w-10 h-10 text-gray-500" />
              <p className="mt-2 text-sm text-gray-400">Click to upload photo evidence</p>
            </label>
          ) : (
            <div className="border border-[#232B4C] bg-[#0A0D1A] rounded-xl p-3 flex flex-col items-center">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-52 object-cover rounded-xl"
              />
              <div className="w-full flex items-center justify-between text-xs mt-3 px-1">
                <span className="text-gray-400 truncate max-w-[180px] sm:max-w-md">
                  {selectedImage?.name}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Warning Alert Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-300 text-sm leading-tight">
            Please ensure the information provided is accurate. False reporting compromises system performance and delays support dispatch.
          </p>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed font-bold flex justify-center items-center gap-2 text-white shadow-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting Report...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}