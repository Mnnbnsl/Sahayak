import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VolunteerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    skills: ""
  });

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/api/volunteers/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
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
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-[#11162B] p-8 rounded-2xl w-[450px]"
      >
        <h1 className="text-3xl text-white font-bold mb-6">
          Volunteer Registration
        </h1>

        <input
          type="text"
          placeholder="Name"
          className="w-full mb-4 p-3 rounded bg-[#050816] text-white"
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
          className="w-full mb-4 p-3 rounded bg-[#050816] text-white"
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
          className="w-full mb-4 p-3 rounded bg-[#050816] text-white"
          onChange={(e) =>
            setFormData({
              ...formData,
              password: e.target.value
            })
          }
        />

        <input
          type="text"
          placeholder="Location"
          className="w-full mb-4 p-3 rounded bg-[#050816] text-white"
          onChange={(e) =>
            setFormData({
              ...formData,
              location: e.target.value
            })
          }
        />

        <select
          className="w-full mb-6 p-3 rounded bg-[#050816] text-white"
          onChange={(e) =>
            setFormData({
              ...formData,
              skills: e.target.value
            })
          }
        >
            <option value="Medical">Medical</option>
            <option value="Fire">Fire Rescue</option>
            <option value="Accident">Road Accident</option>
            <option value="Rescue">Disaster Rescue</option>
            <option value="Animal">Animal Rescue</option>
            <option value="Blood">Blood Donation</option>
            <option value="Helper">General Volunteer</option>

        </select>

        <button
          className="w-full bg-orange-500 py-3 rounded-xl text-white font-bold"
        >
          Register
        </button>
      </form>
    </div>
  );
}