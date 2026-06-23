import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VolunteerLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://sahayak-backend-tk6h.onrender.com";

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/api/volunteers/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();
      console.log("LOGIN DATA:", data);
      
      if (response.ok) {

        localStorage.setItem(
            "volunteerToken",
            data.token
        );

        localStorage.setItem(
            "volunteerId",
            data.volunteer._id || data.volunteer.id
        );

        localStorage.setItem(
            "volunteerName",
            data.volunteer.name
        );

        localStorage.setItem(
            "volunteerEmail",
            data.volunteer.email
        );

        alert("Login Successful");

        navigate("/volunteer");
        }else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
      alert("Server Error");
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex justify-center items-center">
      <form
        onSubmit={handleLogin}
        className="bg-[#11162B] p-8 rounded-2xl w-[450px]"
      >
        <h1 className="text-3xl text-white font-bold mb-6">
          Volunteer Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded bg-[#050816] text-white"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded bg-[#050816] text-white"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-orange-500 py-3 rounded-xl text-white font-bold"
        >
          Login
        </button>
      </form>
    </div>
  );
}