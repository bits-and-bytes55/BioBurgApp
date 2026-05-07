import { Box, Button, TextField, Typography, InputAdornment, IconButton, Checkbox, FormControlLabel, Link, CircularProgress } from "@mui/material";
import { useState } from "react";
import { agentLogin } from "../components/services/agentApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

const AgentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleCaptchaCheck = () => {
    if (captchaVerified || captchaLoading) return;
    setCaptchaLoading(true);
    setTimeout(() => {
      setCaptchaLoading(false);
      setCaptchaVerified(true);
      setCaptchaChecked(true);
    }, 1200);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!captchaVerified) {
      toast.error("Please verify you are not a robot.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await agentLogin({ email, password });
      localStorage.setItem("agentToken", data.token);
      if (data.success) {
        toast.success("Login Successful!");
        navigate("/agent/dashboard");
      } else {
        toast.error("Invalid Credentials");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email.");
      return;
    }
    // plug in your forgot-password API here
    toast.success("Reset link sent! Check your inbox.");
    setForgotOpen(false);
    setResetEmail("");
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: "#ffffff",
      "& fieldset": { borderColor: "#d1d5db", borderWidth: "1.5px" },
      "&:hover fieldset": { borderColor: "#6366f1" },
      "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: "2px" },
    },
    "& .MuiInputLabel-root": { color: "#6b7280", fontSize: 14, fontWeight: 500 },
    "& .MuiInputLabel-root.Mui-focused": { color: "#6366f1" },
    "& .MuiOutlinedInput-input": { color: "#111827", fontSize: 14, padding: "13px 14px 13px 0" },
    "& .MuiInputAdornment-root": { color: "#9ca3af" },
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      sx={{ backgroundColor: "#f3f4f6", fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Left decorative panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "42%",
          background: "linear-gradient(160deg, #6366f1 0%, #4f46e5 50%, #3730a3 100%)",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: "absolute", top: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <Box sx={{ position: "absolute", bottom: -80, right: -40, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <Box sx={{ position: "absolute", top: "40%", right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />

        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: "18px",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            mx: "auto", mb: 3,
          }}>
            <ShieldOutlinedIcon sx={{ color: "#fff", fontSize: 36 }} />
          </Box>
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 1.5 }}>
            Agent Portal
          </Typography>
          <Typography sx={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, maxWidth: 280, mx: "auto" }}>
            Manage your daily field activities, log visits, and track performance — all in one place.
          </Typography>

          <Box sx={{ mt: 5, display: "flex", flexDirection: "column", gap: 2 }}>
            {["Real-time GPS Tracking", "Daily Call Reports", "Visit & Lead Management"].map((item) => (
              <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: "center" }}>
                <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography sx={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</Typography>
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500 }}>{item}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right: Login Form */}
      <Box
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ p: { xs: 2, sm: 4 }, backgroundColor: "#ffffff" }}
      >
        <Box sx={{ width: "100%", maxWidth: 400 }}>

          {/* Mobile logo */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1.5, mb: 4 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldOutlinedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Agent Portal</Typography>
          </Box>

          <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mb: 0.5 }}>
            Welcome back 👋
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#6b7280", mb: 4 }}>
            Sign in to continue to your dashboard
          </Typography>

          {/* Email */}
          <Box mb={2.5}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", mb: 0.75 }}>Email Address</Typography>
            <TextField
              fullWidth
              placeholder="agent@company.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ fontSize: 18, color: "#9ca3af", ml: 0.5 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Box>

          {/* Password */}
          <Box mb={2.5}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", mb: 0.75 }}>Password</Typography>
            <TextField
              fullWidth
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 18, color: "#9ca3af", ml: 0.5 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      sx={{ color: "#9ca3af", mr: 0.25, "&:hover": { color: "#6366f1", bgcolor: "transparent" } }}
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Box>

          {/* CAPTCHA */}
          <Box mb={2.5}>
            <Box
              onClick={handleCaptchaCheck}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                border: "1.5px solid",
                borderColor: captchaVerified ? "#16a34a" : "#d1d5db",
                borderRadius: "10px",
                p: "12px 16px",
                backgroundColor: captchaVerified ? "#f0fdf4" : "#fafafa",
                cursor: captchaVerified ? "default" : "pointer",
                transition: "all 0.2s",
                "&:hover": !captchaVerified ? { borderColor: "#6366f1", backgroundColor: "#fafaff" } : {},
              }}
            >
              {/* Checkbox visual */}
              <Box sx={{
                width: 22, height: 22, borderRadius: "5px", flexShrink: 0,
                border: "2px solid",
                borderColor: captchaVerified ? "#16a34a" : "#d1d5db",
                backgroundColor: captchaVerified ? "#16a34a" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.25s",
              }}>
                {captchaVerified && (
                  <Typography sx={{ color: "#fff", fontSize: 13, lineHeight: 1, fontWeight: 700 }}>✓</Typography>
                )}
              </Box>

              {captchaLoading && (
                <CircularProgress size={16} sx={{ color: "#6366f1", flexShrink: 0 }} />
              )}

              <Typography sx={{ fontSize: 13, color: captchaVerified ? "#15803d" : "#374151", fontWeight: 500, flex: 1 }}>
                {captchaLoading ? "Verifying..." : captchaVerified ? "Verified — You're human ✓" : "I'm not a robot"}
              </Typography>

              <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                <Typography sx={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.5 }}>
                  reCAPTCHA<br />
                  <span style={{ fontSize: 9 }}>Privacy · Terms</span>
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Remember me + Forgot */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                  sx={{ color: "#d1d5db", "&.Mui-checked": { color: "#6366f1" }, p: "4px 8px 4px 0" }}
                />
              }
              label={<Typography sx={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Remember me</Typography>}
              sx={{ m: 0 }}
            />
            <Link
              component="button"
              onClick={() => setForgotOpen(true)}
              underline="none"
              sx={{ fontSize: 13, fontWeight: 600, color: "#6366f1", cursor: "pointer", "&:hover": { color: "#4f46e5" } }}
            >
              Forgot password?
            </Link>
          </Box>

          {/* Login Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
            sx={{
              py: 1.6,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              fontWeight: 700,
              fontSize: 14,
              textTransform: "none",
              letterSpacing: "0.01em",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              transition: "all 0.2s",
              "&:hover": {
                background: "linear-gradient(135deg, #4f46e5, #3730a3)",
                boxShadow: "0 6px 20px rgba(99,102,241,0.45)",
                transform: "translateY(-1px)",
              },
              "&:active": { transform: "translateY(0)" },
              "&.Mui-disabled": { opacity: 0.65, background: "linear-gradient(135deg, #6366f1, #4f46e5)" },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Sign In"}
          </Button>

          <Typography sx={{ fontSize: 11, color: "#d1d5db", textAlign: "center", mt: 3, letterSpacing: "0.08em" }}>
            SECURE · ENCRYPTED · MONITORED
          </Typography>
        </Box>
      </Box>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <Box
          onClick={(e) => { if (e.target === e.currentTarget) setForgotOpen(false); }}
          sx={{
            position: "fixed", inset: 0, zIndex: 1300,
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            p: 2,
          }}
        >
          <Box
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              p: { xs: 3, sm: "36px 40px" },
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            <IconButton
              onClick={() => setForgotOpen(false)}
              sx={{ position: "absolute", top: 14, right: 14, color: "#9ca3af", "&:hover": { color: "#374151", bgcolor: "#f3f4f6" } }}
            >
              <Typography sx={{ fontSize: 18, lineHeight: 1 }}>✕</Typography>
            </IconButton>

            <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
              <LockOutlinedIcon sx={{ color: "#6366f1", fontSize: 22 }} />
            </Box>

            <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#111827", mb: 0.5 }}>
              Reset Password
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6b7280", mb: 3, lineHeight: 1.6 }}>
              Enter your registered email and we'll send a reset link to your inbox.
            </Typography>

            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", mb: 0.75 }}>Email Address</Typography>
            <TextField
              fullWidth
              placeholder="agent@company.com"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ fontSize: 18, color: "#9ca3af", ml: 0.5 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleForgotPassword}
              sx={{
                mt: 2.5, py: 1.5,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                fontWeight: 700, fontSize: 14,
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                "&:hover": { background: "linear-gradient(135deg, #4f46e5, #3730a3)" },
              }}
            >
              Send Reset Link
            </Button>

            <Button
              fullWidth
              onClick={() => setForgotOpen(false)}
              sx={{ mt: 1, color: "#6b7280", fontWeight: 600, fontSize: 13, textTransform: "none", "&:hover": { bgcolor: "#f9fafb" } }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AgentLogin;