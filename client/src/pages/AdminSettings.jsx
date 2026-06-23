import React, { useEffect, useState } from "react";
import {
  User,
  Bell,
  Settings,
  Save,
  Shield
} from "lucide-react";

export default function AdminSettings() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "", 
    role: ""
  });
  
  const [notifications, setNotifications] = useState({
    reports: true,
    assignments: true,
    verifications: true,
  });

  const [preferences, setPreferences] = useState({
    autoRefresh: true,
    darkMode: true,
  });
    useEffect(() => {

    const savedUser = localStorage.getItem("user");

    console.log("savedUser:", savedUser);

    if (!savedUser || savedUser === "undefined") {
        return;
    }

    try {

        const user = JSON.parse(savedUser);

        setProfile({
        fullName: user?.fullName || "",
        email: user?.email || "", 
        role: user?.role || ""
        });

        if (user?.notificationSettings) {
        setNotifications(user.notificationSettings);
        }

        if (user?.preferences) {
        setPreferences(user.preferences);
        }

    } catch (err) {
        console.error("JSON Parse Error:", err);
    }

    }, []);
    const [currentPassword, setCurrentPassword] =
    useState("");

    const [newPassword, setNewPassword] =
    useState("");

    const [confirmPassword, setConfirmPassword] =
    useState("");

    const [newCoordinator, setNewCoordinator] =
    useState({
      fullName: "",
      email: "",
      password: ""
    });

  const handleSave = async () => {

    try {

        const currentUser =
        JSON.parse(
            localStorage.getItem("user")
        );

        const response =
        await fetch(
            "https://sahayak-backend-tk6h.onrender.com/api/settings",
            {
            method: "PATCH",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
                id: currentUser.id || currentUser._id,
                fullName: profile.fullName,
                email: profile.email, 
                notificationSettings: notifications,
                preferences: preferences
            })
            }
        );

        const updatedUser =
        await response.json();

        if (response.ok) {

        localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
        );

        alert("Profile Updated");

        }

    } catch (err) {

        console.error(err);

        alert("Update Failed");

    }

    };
  const handlePasswordChange = async () => {

    if (newPassword !== confirmPassword) {

        alert("Passwords do not match");

        return;

    }

    try {

        const currentUser =
        JSON.parse(
            localStorage.getItem("user")
        );

        const response =
        await fetch(
            "https://sahayak-backend-tk6h.onrender.com/api/auth/change-password",
            {
            method: "PATCH",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
                userId:
                currentUser.id ||
                currentUser._id,

                currentPassword,
                newPassword
            })
            }
        );

        const data =
        await response.json();

        alert(data.message);

    } catch (err) {

        console.error(err);

        alert("Password update failed");

    }

    };

  const createCoordinator = async () => {

      try {

        const response = await fetch(
          "https://sahayak-backend-tk6h.onrender.com/api/auth/register",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              ...newCoordinator,
              role: "coordinator"
            })
          }
        );

        const data = await response.json();

        if (response.ok) {

          alert("Coordinator Created");

          setNewCoordinator({
            fullName: "",
            email: "",
            password: ""
          });

        } else {

          alert(data.message);

        }

      } catch (err) {

        console.log(err);

        alert("Creation Failed");

      }

    };  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-white">
          Settings
        </h2>

        <p className="text-gray-500 mt-1">
          Manage your account and platform preferences
        </p>
      </div>

      {/* PROFILE SETTINGS */}
      <div className="bg-[#0A0F24] border border-[#1C223C] rounded-3xl p-6">

        <div className="flex items-center gap-3 mb-6">
          <User className="text-orange-500" />
          <h3 className="font-bold text-xl">
            Profile Settings
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-5">

          <div>
            <label className="text-sm text-gray-400">
              Full Name
            </label>

            <input
              type="text"
              value={profile.fullName}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  fullName: e.target.value,
                })
              }
              className="w-full mt-2 bg-[#11162B] border border-[#1C223C] rounded-xl p-3 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">
              Email
            </label>

            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  email: e.target.value,
                })
              }
              className="w-full mt-2 bg-[#11162B] border border-[#1C223C] rounded-xl p-3 text-white"
            />
          </div>
        </div>
      </div>

      {/* SECURITY */}

      <div className="bg-[#0A0F24] border border-[#1C223C] rounded-3xl p-6">

        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-orange-500" />
          <h3 className="font-bold text-xl">
            Security
          </h3>
        </div>

        <div className="space-y-4">

        <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) =>
            setCurrentPassword(e.target.value)
            }
            className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl p-3 text-white"
        />

        <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) =>
            setNewPassword(e.target.value)
            }
            className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl p-3 text-white"
        />

        <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
            setConfirmPassword(e.target.value)
            }
            className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl p-3 text-white"
        />

        <button
            onClick={handlePasswordChange}
            className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl text-white"
        >
            Update Password
        </button>

        </div>

      </div>

      

     {profile.role === "superadmin" && (

        <div className="bg-[#0A0F24] border border-[#1C223C] rounded-3xl p-6">

          <h3 className="text-xl font-bold mb-6">
            Coordinator Management
          </h3>

          <div className="space-y-4">

            <input
              type="text"
              placeholder="Coordinator Name"
              value={newCoordinator.fullName}
              onChange={(e) =>
                setNewCoordinator({
                  ...newCoordinator,
                  fullName: e.target.value
                })
              }
              className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl p-3 text-white"
            />

            <input
              type="email"
              placeholder="Coordinator Email"
              value={newCoordinator.email}
              onChange={(e) =>
                setNewCoordinator({
                  ...newCoordinator,
                  email: e.target.value
                })
              }
              className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl p-3 text-white"
            />

            <input
              type="password"
              placeholder="Temporary Password"
              value={newCoordinator.password}
              onChange={(e) =>
                setNewCoordinator({
                  ...newCoordinator,
                  password: e.target.value
                })
              }
              className="w-full bg-[#11162B] border border-[#1C223C] rounded-xl p-3 text-white"
            />

            <button
              onClick={createCoordinator}
              className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-bold"
            >
              Create Coordinator
            </button>

          </div>

        </div>

        )}       
      

      {/* SAVE */}

      <div className="flex justify-end">

        <button
          onClick={handleSave}
          className="bg-[#F97316] hover:bg-[#EA580C] px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all"
        >
          <Save size={18} />
          Save Settings
        </button>

      </div>

    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between bg-[#11162B] border border-[#1C223C] rounded-xl p-4">
      <span>{label}</span>

      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-all ${
          checked
            ? "bg-orange-500"
            : "bg-gray-600"
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-all ${
            checked ? "ml-6" : "ml-1"
          }`}
        />
      </button>
    </div>
  );
}