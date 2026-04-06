import React, { useState } from "react";
import axios from "axios";
import {
  MANUFACTURER_API_BASE,
  persistManufacturerSession,
} from "./manufacturerApi";

export default function ManufacturerLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${MANUFACTURER_API_BASE}/login`, {
        identifier,
        password,
      });

      persistManufacturerSession(res.data.token, res.data.manufacturer);
      window.location.href = "/manufacturer/dashboard";
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={submitHandler}
        className="bg-white p-8 rounded-xl shadow w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Manufacturer Login
        </h2>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <input
          type="text"
          placeholder="Official Email or Username"
          className="w-full border p-3 rounded mb-4"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700">
          Login
        </button>
      </form>
    </div>
  );
}
