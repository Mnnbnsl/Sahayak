import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  MapPin,
  Send,
  User,
  Phone,
  ChevronDown,
  CheckCircle,
  Loader2
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
    category: "",
    latitude: null,
    longitude: null
  });

  // Capture GPS automatically
// Capture GPS automatically
useEffect(() => {
  if (!navigator.geolocation) {
    console.log("Geolocation not supported");

    setFormData((prev) => ({
      ...prev,
      latitude: 31.6340,
      longitude: 74.8723
    }));

    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log(
        "GPS Captured:",
        position.coords.latitude,
        position.coords.longitude
      );

      setFormData((prev) => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }));
    },
    (error) => {
      console.log("GPS ERROR CODE:", error.code);
      console.log("GPS ERROR MESSAGE:", error.message);

      // Fallback to Amritsar
      setFormData((prev) => ({
        ...prev,
        latitude: 31.6340,
        longitude: 74.8723
      }));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}, []);

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

    data.append("latitude", formData.latitude);
    data.append("longitude", formData.longitude);

    if (selectedImage) {
      data.append("image", selectedImage);
    }

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        body: data
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          "Report submitted successfully! AI is analyzing the emergency."
        );

        console.log(result);

        navigate("/");
      } else {
        alert(result.message || "Server Error");
      }
    } catch (error) {
      console.error("Submission Error:", error);

      alert(
        "Could not connect to backend. Make sure server is running on port 5000."
      );
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
          <h1 className="text-3xl font-bold tracking-tight">
            Emergency Report
          </h1>

          <p className="text-gray-400 mt-1">
            AI-powered triage and immediate assistance
          </p>
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
              <User className="w-4 h-4 text-[#F97316]" />
              Name
            </label>

            <input
              required
              type="text"
              placeholder="Full Name"
              className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 outline-none focus:border-[#F97316]"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#F97316]" />
              Phone
            </label>

            <input
              required
              type="tel"
              placeholder="Phone Number"
              className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 outline-none focus:border-[#F97316]"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone: e.target.value
                })
              }
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#F97316]" />
            Location
          </label>

          <input
            required
            type="text"
            placeholder="Area, City, or Landmark"
            className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 outline-none focus:border-[#F97316]"
            onChange={(e) =>
              setFormData({
                ...formData,
                location: e.target.value
              })
            }
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">
            Describe the Emergency
          </label>

          <textarea
            required
            rows="4"
            placeholder="Please provide details"
            className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 outline-none focus:border-[#F97316]"
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value
              })
            }
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">
            Emergency Category
          </label>

          <div className="relative">
            <select
              required
              className="w-full bg-[#050816] border border-[#2A3459] rounded-xl px-4 py-3 appearance-none"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value
                })
              }
            >
              <option value="">Select Category</option>
              <option value="Medical">Medical</option>
              <option value="Fire">Fire</option>
              <option value="Accident">Accident</option>
              <option value="Other">Other</option>
            </select>

            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Upload */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">
            Evidence Image (Optional)
          </label>

          <input
            type="file"
            id="img-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />

          <label
            htmlFor="img-upload"
            className="border-2 border-dashed border-[#2A3459] rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer"
          >
            {selectedImage ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-500" />
                <p>{selectedImage.name}</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-500" />
                <p>Click to upload photo</p>
              </>
            )}
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl bg-[#F97316] font-bold flex justify-center items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Analyzing Report...
            </>
          ) : (
            <>
              <Send />
              Submit for AI Analysis
            </>
          )}
        </button>
      </form>
    </div>
  );
}