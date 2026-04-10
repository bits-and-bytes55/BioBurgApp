import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function PharmaSignup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔹 OLD PAGE KE SAARE FIELDS
  const [form, setForm] = useState({
    username: "",
    name: "",
    lastname: "",
    email: "",
    gender: "male",
    address: "",
    password: "",
    agree: false,
  });

  const BASE_API = import.meta.env.VITE_API_BASE_URL;
  // const BASE_API = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  /* ================= SIGN UP API ================= */
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!form.agree) {
      toast.error("Please accept terms & conditions");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${BASE_API}/api/user/signup`, {
        username: form.username,
        name: form.name,
        lastname: form.lastname,
        email: form.email,
        gender: form.gender,
        address: form.address,
        password: form.password,
      });

      if (res.data.success) {
        toast.success("Registration successful 🎉");
        navigate("/userlogin");
      } else {
        toast.error(res.data.message || "Registration failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] p-4 md:p-20">
      <div className="w-full max-w-5xl bg-[#1f1d2b] rounded-2xl shadow-2xl grid md:grid-cols-2 overflow-hidden mx-auto">

        {/* LEFT IMAGE */}
        <div className="hidden md:block relative">
          <img
            src="/registerimage.jpg"
            alt="Pharma"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 to-indigo-600/40"></div>
        </div>

        {/* RIGHT FORM */}
        <div className="p-5 md:p-12 text-dark bg-amber-50 overflow-y-auto">
          <h2 className="text-3xl font-bold mb-1">Create an account</h2>
          <p className="text-sm text-black-50 mb-6">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/userlogin")}
              className="text-blue-800 cursor-pointer hover:underline"
            >
              Log in
            </span>
          </p>

          <form onSubmit={handleSignup} className="space-y-4">

            {/* NAME */}
            <div className="grid grid-cols-2 gap-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="First Name"
                className="input-dark"
                required
              />
              <input
                name="lastname"
                value={form.lastname}
                onChange={handleChange}
                placeholder="Last Name"
                className="input-dark"
                required
              />
            </div>

            {/* USERNAME */}
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Username"
              className="input-dark"
              required
            />

            {/* EMAIL */}
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email address"
              className="input-dark"
              required
            />

            {/* GENDER */}
            <div className="flex gap-4 text-sm text-black-500">
              {["male", "female", "other"].map((g) => (
                <label key={g} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={handleChange}
                    className="accent-purple-500"
                  />
                  {g}
                </label>
              ))}
            </div>

            {/* ADDRESS */}
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Full Address"
              className="input-dark"
              required
            />

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create password"
                className="input-dark pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-sm text-gray-400"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* TERMS */}
            <label className="flex items-center gap-2 text-sm text-black-500">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={handleChange}
                className="accent-purple-500"
              />
              I agree to the{" "}
              <span className="text-blue-800 underline cursor-pointer">
                terms & conditions
              </span>
            </label>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>

      {/* TAILWIND HELPERS */}
      <style>{`
        .input-dark {
          width: 100%;
          padding: 12px 14px;
          background: #2a2838;
          border: 1px solid #3b3950;
          border-radius: 8px;
          color: white;
          outline: none;
        }
        .input-dark::placeholder {
          color: #9ca3af;
        }
        .input-dark:focus {
          border-color: #8b5cf6;
        }
      `}</style>
    </div>
  );
}
