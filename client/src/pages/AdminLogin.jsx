import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
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
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        localStorage.setItem(
          "adminLoggedIn",
          "true"
        );

        navigate("/admin");
      } else {
        alert(data.message || "Invalid Credentials");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-orange-500/10 blur-[180px] rounded-full" />

      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-blue-500/10 blur-[180px] rounded-full" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

      {/* Login Card */}
      <form
        onSubmit={handleLogin}
        className="relative z-10 w-full max-w-md bg-[#09112B] border border-[#1B2547] rounded-3xl p-6 sm:p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-4xl font-bold">
            Login
          </h1>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white text-3xl transition"
          >
            ×
          </button>
        </div>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
          className="w-full bg-[#111A38] border border-[#1C2850] rounded-xl px-4 py-4 text-white placeholder-gray-500 outline-none focus:border-orange-500 mb-4"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
          className="w-full bg-[#111A38] border border-[#1C2850] rounded-xl px-4 py-4 text-white placeholder-gray-500 outline-none focus:border-orange-500 mb-6"
        />

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 transition-all duration-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20"
        >
          Sign In
        </button>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Coordinator Access Only
        </p>
      </form>
    </div>
  );
}