import React, { useState, useEffect } from "react";
import {
  Container, Paper, TextField, Typography, Button, IconButton,
  InputAdornment, Dialog, DialogTitle, DialogContent, Box, Link, Divider, Avatar,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { MedicalServices, Email, Lock } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { loginAs } from "../../utils/auth";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

// Math CAPTCHA
function useCaptcha() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [input, setInput] = useState("");
  const refresh = () => {
    setA(Math.floor(Math.random() * 9) + 1);
    setB(Math.floor(Math.random() * 9) + 1);
    setInput("");
  };
  useEffect(() => { refresh(); }, []);
  const valid = parseInt(input, 10) === a + b;
  return { a, b, input, setInput, valid, refresh };
}

function CaptchaBox({ a, b, input, setInput, valid, refresh }) {
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1.5px solid #e2e8f0" }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Security Check
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
        <Box sx={{
          px: 2.5, py: 1, bgcolor: "#059669", borderRadius: 1.5,
          fontFamily: "monospace", fontSize: 18, fontWeight: 800,
          color: "#fff", letterSpacing: 4, userSelect: "none", transform: "skewX(-4deg)",
        }}>
          {a} + {b} = ?
        </Box>
        <TextField
          size="small" placeholder="SUM" value={input}
          onChange={e => setInput(e.target.value)}
          inputProps={{ maxLength: 3, style: { fontWeight: 700, textAlign: "center", width: 56 } }}
          error={input.length > 0 && !valid}
          sx={{ width: 90 }}
        />
        <Button size="small" onClick={refresh} sx={{ minWidth: 0, color: "#64748b", fontSize: 18, p: 0.5 }}>↻</Button>
        {valid && <Typography sx={{ color: "#059669", fontWeight: 700, fontSize: 20 }}>✓</Typography>}
      </Box>
    </Box>
  );
}

export default function PharmacyLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const captcha       = useCaptcha();
  const forgotCaptcha = useCaptcha();

  const [form,         setForm]         = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [forgotOpen,   setForgotOpen]   = useState(false);
  const [forgotData,   setForgotData]   = useState({ email: "", otp: "", newPassword: "" });

  const handleChange       = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleForgotChange = e => setForgotData({ ...forgotData, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    if (!captcha.valid) {
      toast.error("Please solve the security check first");
      captcha.refresh();
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_API}/api/pharmacy/login`, form);
      const facility = res.data.facility;
      const token    = res.data.token;
      loginAs("pharmacy", res.data.token);
      localStorage.setItem("pharmacyUser",  JSON.stringify(facility));
      localStorage.setItem("pharmacyToken", token);
      localStorage.setItem("activeRole",    "pharmacy");
      login(token, { name: facility.facilityName, email: facility.email, type: "pharmacy" }, "pharmacyToken", "pharmacyUser");
      toast.success("Login Successful");
      navigate("/pharmacy/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
      captcha.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = e => { if (e.key === "Enter") handleLogin(); };

  const sendOtp = async () => {
    try {
      await axios.post(`${BASE_API}/api/pharmacy/forgot-password`, { email: forgotData.email });
      toast.success("OTP sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const resetPassword = async () => {
    if (!forgotCaptcha.valid) { toast.error("Solve the captcha first"); forgotCaptcha.refresh(); return; }
    try {
      await axios.post(`${BASE_API}/api/pharmacy/reset-password`, forgotData);
      toast.success("Password updated! Please login.");
      setForgotOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  const GREEN = "#059669";
  const DARK_GREEN = "#047857";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f1f5f9", py: 8 }}>
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          <Box textAlign="center" mb={4}>
            <Avatar sx={{ width: 70, height: 70, bgcolor: GREEN, margin: "0 auto 16px" }}>
              <MedicalServices sx={{ fontSize: 35 }} />
            </Avatar>
            <Typography variant="h4" fontWeight={700} color={GREEN}>Pharmacy Login</Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Access your pharmacy management dashboard
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <TextField fullWidth label="Email Address" name="email" type="email" margin="normal"
            value={form.email} onChange={handleChange} onKeyDown={handleKeyDown}
            InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }} />

          <TextField fullWidth label="Password" name="password" margin="normal"
            type={showPassword ? "text" : "password"} value={form.password}
            onChange={handleChange} onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }} />

          {/* CAPTCHA */}
          <CaptchaBox {...captcha} />

          <Button fullWidth variant="contained" size="large" onClick={handleLogin}
            disabled={loading || !captcha.valid}
            sx={{ mt: 3, py: 1.5, fontWeight: "bold", bgcolor: GREEN, "&:hover": { bgcolor: DARK_GREEN }, "&:disabled": { bgcolor: "#94a3b8" } }}>
            {loading ? "Logging in..." : "Login"}
          </Button>

          <Box textAlign="center" mt={2}>
            <Link component="button" variant="body2" onClick={() => setForgotOpen(true)}
              sx={{ color: GREEN, cursor: "pointer", textDecoration: "none" }}>
              Forgot Password?
            </Link>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">OR</Typography>
          </Divider>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              New pharmacy?{" "}
              <Link href="/register/pharmacy" sx={{ color: GREEN, fontWeight: 600 }}>Register Here</Link>
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Email Address" name="email" type="email" margin="normal"
            value={forgotData.email} onChange={handleForgotChange} />
          <Button fullWidth variant="outlined"
            sx={{ mt: 2, color: GREEN, borderColor: GREEN }} onClick={sendOtp}>
            Send OTP
          </Button>
          <TextField fullWidth label="Enter OTP" name="otp" margin="normal"
            value={forgotData.otp} onChange={handleForgotChange} />
          <TextField fullWidth label="New Password" name="newPassword" type="password" margin="normal"
            value={forgotData.newPassword} onChange={handleForgotChange} />
          <CaptchaBox {...forgotCaptcha} />
          <Button fullWidth variant="contained" onClick={resetPassword}
            disabled={!forgotCaptcha.valid}
            sx={{ mt: 2, bgcolor: GREEN, "&:hover": { bgcolor: DARK_GREEN }, "&:disabled": { bgcolor: "#94a3b8" } }}>
            Reset Password
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}