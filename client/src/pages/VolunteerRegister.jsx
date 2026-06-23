import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VolunteerRegister() {
  const navigate = useNavigate();

  // Added latitude and longitude to state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    skills: "",
    latitude: null,
    longitude: null
  });

  const [loadingLocation, setLoadingLocation] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://sahayak-backend-tk6h.onrender.com";

  // GPS geolocation fetch handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          // Optional: automatically tag location string if empty
          location: prev.location || `GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        }));
        setLoadingLocation(false);
        alert("Coordinates captured successfully!");
      },
      (error) => {
        console.error(error);
        setLoadingLocation(false);
        alert("Unable to retrieve your location. Please type it manually.");
      }
    );
  };

  console.log("API URL =", API_URL);
  console.log("POST URL =", `${API_URL}/api/volunteers/register`);
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/api/auth/volunteers/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          // Spreads formData seamlessly (including latitude & longitude)
          body: JSON.stringify({
            ...formData,
            skills: [formData.skills]
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Registration Successful");
        navigate("/volunteer/login");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  };


  return (
    <div className="min-h-screen bg-[#050816] flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#11162B] p-6 sm:p-8 rounded-2xl w-full max-w-[450px] shadow-xl"
      >
        <h1 className="text-2xl sm:text-3xl text-white font-bold mb-6 text-center sm:text-left">
          Volunteer Registration
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            required
            className="w-full p-3 rounded bg-[#050816] text-white border border-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value
              })
            }
          />

          <input
            type="email"
            placeholder="Email"
            required
            className="w-full p-3 rounded bg-[#050816] text-white border border-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value
              })
            }
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="w-full p-3 rounded bg-[#050816] text-white border border-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value
              })
            }
          />

          {/* Location input with integrated GPS Button */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              required
              className="flex-1 p-3 rounded bg-[#050816] text-white border border-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  location: e.target.value
                })
              }
            />

            <button
              type="button"
              onClick={handleGetLocation}
              disabled={loadingLocation}
              title="Use Current Location"
              className={`px-4 rounded text-white font-bold transition-all ${
                formData.latitude && formData.longitude
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 dynamic-touch-target`}
            >
              {loadingLocation ? "⌛" : "📍"}
            </button>
          </div>

          {/* Visual confirmation tracker for coordinates */}
          {formData.latitude && formData.longitude && (
            <p className="text-xs text-green-400 mt-1 pl-1">
              ✓ Coordinates saved ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
            </p>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1 pl-1">Primary Skill</label>
            <select
              className="w-full p-3 rounded bg-[#050816] text-white border border-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
              value={formData.skills}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  skills: e.target.value
                })
              }
            >
              <option value="" disabled>Select your primary skill</option>
              <option value="Medical">Medical</option>
              <option value="Fire">Fire Rescue</option>
              <option value="Accident">Road Accident</option>
              <option value="Rescue">Disaster Rescue</option>
              <option value="Animal">Animal Rescue</option>
              <option value="Blood">Blood Donation</option>
              <option value="Helper">General Volunteer</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 mt-6 py-3 rounded-xl text-white font-bold transition-colors shadow-lg"
        >
          Register
        </button>
      </form>
    </div>
  );
}