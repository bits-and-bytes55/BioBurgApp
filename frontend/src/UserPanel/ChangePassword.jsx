import React, { useState } from "react";
import axios from "axios";

export default function ChangePassword() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const handleChangePassword = () => {
    const token = localStorage.getItem("token");

    axios.post(
      "https://bioburglifescience-1.onrender.com/api/user/change-password",
      { oldPassword: oldPass, newPassword: newPass },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    .then(res => alert(res.data.message))
    .catch(err => alert("Error updating password"));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="font-bold text-xl mb-4">Change Password</h2>

      <input
        type="password"
        placeholder="Old Password"
        value={oldPass}
        onChange={(e) => setOldPass(e.target.value)}
        className="border w-full p-2 rounded mb-4"
      />

      <input
        type="password"
        placeholder="New Password"
        value={newPass}
        onChange={(e) => setNewPass(e.target.value)}
        className="border w-full p-2 rounded mb-4"
      />

      <button
        onClick={handleChangePassword}
        className="bg-[#6892D5] text-white py-2 px-5 rounded"
      >
        Update Password
      </button>
    </div>
  );
}
