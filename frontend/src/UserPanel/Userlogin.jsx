import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/useCart";

export default function PharmaLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { syncGuestCartToServer } = useCart();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const BASE_API =
    import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post(`${BASE_API}/api/user/login`, form);

      if (res.data.success) {
        localStorage.setItem("userToken", res.data.token);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("activeRole", "user");
        localStorage.setItem("user", JSON.stringify(res.data.user));
        console.log("UserToken=", res.data.token);

        await syncGuestCartToServer();

        alert("Login successful!");

        const sessionRedirect = sessionStorage.getItem("redirectAfterLogin");
        if (sessionRedirect) {
          sessionStorage.removeItem("redirectAfterLogin");
          navigate(sessionRedirect, { replace: true });
        } else {
          const redirectTo = location.state?.redirectTo || "/";
          navigate(redirectTo, { replace: true });
        }
        setTimeout(() => window.location.reload(), 100);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Invalid email or password");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl grid md:grid-cols-2 overflow-hidden">
        {/* LEFT – BRAND */}
        <div className="hidden md:flex flex-col justify-center p-10 bg-gradient-to-br from-sky-600 to-emerald-600 text-white">
          <h2 className="text-3xl font-bold mb-4">Trusted Pharma Platform</h2>
          <p className="text-sm leading-relaxed opacity-90">
            Secure access to pharmaceutical, healthcare, and life science
            services. Built with compliance, quality, and patient safety at its
            core.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li>✔ Secure & encrypted login</li>
            <li>✔ Healthcare-grade compliance</li>
            <li>✔ Trusted by professionals</li>
          </ul>
        </div>

        {/* RIGHT – LOGIN FORM */}
        <div className="p-8 md:p-10">
          <h3 className="text-2xl font-bold text-gray-900">
            Sign in to your account
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Access your pharma dashboard securely
          </p>

          {location.state?.message && (
            <div className="mt-4 px-4 py-3 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-700">
              🔒 {location.state.message}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="doctor@pharma.com"
                required
                className="mt-1 w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-sm text-sky-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="text-right">
              <span
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-sky-600 hover:underline cursor-pointer"
              >
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition disabled:opacity-70"
            >
              {isLoading ? "Syncing cart & logging in..." : "Login Securely"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/userregister")}
                className="text-sky-600 font-semibold cursor-pointer hover:underline"
              >
                Register here
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
