// src/VendorPanel/pages/VendorLogin.jsx
// Key fix: after a successful login we now save `vendorUser` to localStorage.
// VendorBackBanner reads that key to show the vendor's name in the banner.

import React, { useState } from "react";
import {
  Container, Paper, TextField, Typography, Button, IconButton,
  InputAdornment, Dialog, DialogTitle, DialogContent,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Visibility    from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import toast from "react-hot-toast";
import { loginAs } from "../../utils/auth";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

export default function VendorLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email           : "",
    drugLicenseNumber1: "",
    password        : "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [forgotOpen,   setForgotOpen]   = useState(false);
  const [forgotData,   setForgotData]   = useState({ email: "", otp: "", newPassword: "" });

  const handleChange       = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleForgotChange = (e) => setForgotData({ ...forgotData, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_API}/api/vendor/login`, form);

      const token  = res.data.token;
      const vendor = res.data.vendor || res.data.user || res.data.data || {};

      // ── Persist token (existing helper) ───────────────────────────
      loginAs("vendor", token);

      // ── Persist vendor info so VendorBackBanner can read the name ─
      // (same pattern as pharmacy: localStorage.setItem("pharmacyUser", ...))
      localStorage.setItem("vendorUser",  JSON.stringify(vendor));
      localStorage.setItem("vendorToken", token);         // belt-and-suspenders
      localStorage.setItem("activeRole",  "vendor");

      toast.success("Login Successful");
      navigate("/vendor/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot-password flow ──────────────────────────────────────────
  const sendOtp = async () => {
    try {
      await axios.post(`${BASE_API}/api/vendor/forgot-password`, { email: forgotData.email });
      toast.success("OTP sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const resetPassword = async () => {
    try {
      await axios.post(`${BASE_API}/api/vendor/reset-password`, forgotData);
      toast.success("Password updated! Please login.");
      setForgotOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ p: 4, mt: 8, borderRadius: 3 }}>
        <Typography variant="h4" textAlign="center" fontWeight="bold" mb={3}>
          Vendor Login
        </Typography>

        <TextField
          fullWidth label="Email" name="email"
          margin="normal" onChange={handleChange}
        />
        <TextField
          fullWidth label="Drug License Number 1" name="drugLicenseNumber1"
          margin="normal" onChange={handleChange}
        />
        <TextField
          fullWidth label="Password" name="password"
          type={showPassword ? "text" : "password"}
          margin="normal" onChange={handleChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          fullWidth variant="contained"
          sx={{ mt: 3, py: 1.3, fontWeight: "bold" }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>

        <Button fullWidth variant="text" sx={{ mt: 2 }} onClick={() => setForgotOpen(true)}>
          Forgot Password?
        </Button>
      </Paper>

      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)}>
        <DialogTitle>Forgot Password</DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <TextField
            fullWidth label="Email" name="email"
            margin="normal" onChange={handleForgotChange}
          />
          <Button fullWidth sx={{ mt: 1 }} variant="contained" onClick={sendOtp}>
            Send OTP
          </Button>
          <TextField
            fullWidth label="Enter OTP" name="otp"
            margin="normal" onChange={handleForgotChange}
          />
          <TextField
            fullWidth label="New Password" name="newPassword"
            type="password" margin="normal" onChange={handleForgotChange}
          />
          <Button fullWidth sx={{ mt: 2 }} variant="contained" onClick={resetPassword}>
            Reset Password
          </Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
}