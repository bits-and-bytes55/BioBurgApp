// frontend/src/Delivery/DeliveryLogin.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { loginAs } from "../../utils/auth";

const API = import.meta.env.VITE_API_BASE_URL + "/api";

export default function DeliveryLogin() {
  const navigate = useNavigate();
  const [cred, setCred]       = useState({ phoneOrEmail: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const upd = (k) => (e) => { setCred((p) => ({ ...p, [k]: e.target.value })); setError(""); };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!cred.phoneOrEmail || !cred.password) { setError("Please enter your phone / email and password"); return; }
    setLoading(true);
    try {
      const isPhone = /^\d{10}$/.test(cred.phoneOrEmail);
      const payload = isPhone
        ? { phone: cred.phoneOrEmail, password: cred.password }
        : { email: cred.phoneOrEmail, password: cred.password };

      const { data } = await axios.post(`${API}/delivery/login`, payload);
      loginAs("delivery", data.token);
      localStorage.setItem("daToken", data.token);
      localStorage.setItem("daAgent", JSON.stringify(data.agent));
      navigate("/delivery/dashboard");
    } catch (err) {
      const msg  = err.response?.data?.message || "Login failed";
      const stat = err.response?.data?.status;
      if (stat === "pending")   setError("Your account is pending admin approval. Please wait 24–48 hours.");
      else if (stat === "rejected")  setError("Application rejected. Contact support@bioburgpharma.com");
      else if (stat === "suspended") setError("Account suspended. Please contact admin.");
      else setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-white border-r border-slate-200 flex-col justify-between p-12 xl:p-16">
        <div>
          <div className="w-8 h-1 bg-teal-500 rounded-full mb-8" />
          <h1 className="text-3xl xl:text-4xl font-bold text-slate-800 leading-tight">
            Delivery Partner<br />Portal
          </h1>
          <p className="text-slate-500 text-base mt-4 leading-relaxed max-w-sm">
            Sign in to access your delivery dashboard, manage orders, and track your earnings.
          </p>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          {[
            { label: "Commission", value: "7% per delivery" },
            { label: "Monthly Bonus", value: "₹400 on 100+ deliveries" },
            { label: "Payout", value: "Every Monday" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
              <span className="text-slate-500 text-sm">{label}</span>
              <span className="text-teal-600 text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel / Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">

        {/* Mobile title */}
        <div className="lg:hidden w-full max-w-md mb-8">
          <div className="w-6 h-0.5 bg-teal-500 rounded-full mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Delivery Partner Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="w-full max-w-md">

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Welcome back</p>
            <h2 className="text-2xl font-bold text-slate-800">Sign In</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Phone / Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                Phone / Email <span className="text-teal-600">*</span>
              </label>
              <input
                type="text"
                placeholder="10-digit phone number or email"
                value={cred.phoneOrEmail}
                onChange={upd("phoneOrEmail")}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                Password <span className="text-teal-600">*</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={cred.password}
                onChange={upd("password")}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Signing in...</>
              ) : (
                <>Sign In<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></>
              )}
            </button>
          </form>

          {/* Register */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Not registered yet?{" "}
            <Link to="/delivery/signup" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
              Register as Delivery Partner
            </Link>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Admin link */}
          <Link
            to="/login"
            className="flex items-center justify-center w-full border border-slate-200 rounded-xl py-2.5 text-sm text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all font-medium"
          >
            Admin / Staff Login
          </Link>

          <p className="text-center text-slate-400 text-xs mt-6">All access is logged and monitored</p>
        </div>
      </div>
    </div>
  );
}