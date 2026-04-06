import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FranchiseConsoleStyles } from "../components/consoleUi";
import {
  FRANCHISE_AUTH_API_BASE,
  persistFranchiseSession,
} from "../franchiseApi";

const emptyForgotForm = {
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

const authFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    color: "#111827",
    bgcolor: "#ffffff",
    "& fieldset": {
      borderColor: "rgba(0,0,0,0.12)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(202,138,4,0.45)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(202,138,4,0.85)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#64748b",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#92400e",
  },
  "& .MuiFormHelperText-root": {
    color: "#64748b",
  },
};

const primaryButtonSx = {
  minHeight: 52,
  borderRadius: 999,
  textTransform: "none",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  color: "#ffffff",
  background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
  boxShadow: "0 8px 24px rgba(217,119,6,0.30)",
  "&:hover": {
    background: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)",
    boxShadow: "0 10px 28px rgba(217,119,6,0.38)",
  },
  "&.Mui-disabled": {
    color: "rgba(255,255,255,0.6)",
    background: "rgba(217,119,6,0.40)",
  },
};

const secondaryButtonSx = {
  minHeight: 44,
  borderRadius: 999,
  textTransform: "none",
  fontWeight: 700,
  color: "#374151",
  borderColor: "rgba(0,0,0,0.12)",
  bgcolor: "#ffffff",
  "&:hover": {
    borderColor: "rgba(202,138,4,0.45)",
    bgcolor: "#fffbeb",
  },
};

function MessageStrip({ children, tone = "error" }) {
  const tones = {
    error: {
      borderColor: "rgba(220,38,38,0.22)",
      color: "#991b1b",
      background: "rgba(220,38,38,0.06)",
    },
    success: {
      borderColor: "rgba(16,185,129,0.22)",
      color: "#065f46",
      background: "rgba(16,185,129,0.07)",
    },
    info: {
      borderColor: "rgba(59,130,246,0.22)",
      color: "#1e40af",
      background: "rgba(59,130,246,0.07)",
    },
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1.4,
        borderRadius: 3,
        border: "1px solid",
        fontSize: 14,
        lineHeight: 1.6,
        ...tones[tone],
      }}
    >
      {children}
    </Box>
  );
}

export default function FranchiseLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotData, setForgotData] = useState(emptyForgotForm);
  const [forgotError, setForgotError] = useState("");
  const [forgotNotice, setForgotNotice] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleForgotChange = (event) => {
    setForgotData({ ...forgotData, [event.target.name]: event.target.value });
  };

  const openForgotDialog = () => {
    setForgotOpen(true);
    setForgotError("");
    setForgotNotice("");
    setNotice("");
    setForgotData((current) => ({
      ...emptyForgotForm,
      email: current.email || formData.email,
    }));
  };

  const closeForgotDialog = () => {
    setForgotOpen(false);
    setForgotError("");
    setForgotNotice("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const response = await axios.post(`${FRANCHISE_AUTH_API_BASE}/login`, formData);
      persistFranchiseSession(response.data.token, response.data.account);
      navigate("/franchise/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const sendResetOtp = async () => {
    if (!forgotData.email) {
      setForgotError("Please enter your registered franchise email first.");
      return;
    }
    setForgotError("");
    setForgotNotice("");
    setSendingOtp(true);
    try {
      const response = await axios.post(`${FRANCHISE_AUTH_API_BASE}/forgot-password`, { email: forgotData.email });
      setForgotNotice(response.data?.message || "OTP sent to your registered email.");
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const resetPassword = async () => {
    if (!forgotData.email || !forgotData.otp || !forgotData.newPassword) {
      setForgotError("Email, OTP and new password are required.");
      return;
    }
    if (forgotData.newPassword !== forgotData.confirmPassword) {
      setForgotError("New password and confirm password must match.");
      return;
    }
    setForgotError("");
    setForgotNotice("");
    setResettingPassword(true);
    try {
      const response = await axios.post(`${FRANCHISE_AUTH_API_BASE}/reset-password`, {
        email: forgotData.email,
        otp: forgotData.otp,
        newPassword: forgotData.newPassword,
      });
      setFormData((current) => ({ ...current, email: forgotData.email, password: "" }));
      setNotice(response.data?.message || "Password reset successful. Please log in.");
      setForgotData(emptyForgotForm);
      closeForgotDialog();
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <Box
      className="franchise-console-root"
      sx={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        bgcolor: "#f5f7fa",
        color: "#111827",
        background: "linear-gradient(160deg, #ffffff 0%, #f3f6fb 50%, #edf1f7 100%)",

        /* Soft ambient tints */
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(ellipse 40% 30% at 2% 0%, rgba(234,179,8,0.08) 0%, transparent 100%)",
            "radial-gradient(ellipse 30% 22% at 98% 0%, rgba(59,130,246,0.06) 0%, transparent 100%)",
          ].join(", "),
          pointerEvents: "none",
        },

        /* Dot grid */
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 70%)",
          pointerEvents: "none",
        },

        /* Amber top bar */
        "& .MuiStepLabel-label": { color: "#64748b", fontWeight: 600 },
        "& .MuiStepLabel-label.Mui-active": { color: "#111827" },
        "& .MuiStepLabel-label.Mui-completed": { color: "#374151" },
        "& .MuiStepIcon-root": { color: "rgba(0,0,0,0.12)" },
        "& .MuiStepIcon-root.Mui-active": { color: "#d97706" },
        "& .MuiStepIcon-root.Mui-completed": { color: "#059669" },
        "& .MuiStepConnector-line": { borderColor: "rgba(0,0,0,0.10)" },
      }}
    >
      <FranchiseConsoleStyles />

      {/* Top accent bar */}
      <Box
        sx={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: "3px",
          background: "linear-gradient(90deg, transparent, rgba(234,179,8,0.9) 30%, rgba(251,191,36,1) 50%, rgba(59,130,246,0.6) 78%, transparent)",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 5, md: 8 } }}>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            alignItems: "stretch",
            gridTemplateColumns: { xs: "1fr", lg: "1.08fr 0.92fr" },
          }}
        >
          {/* Left — brand panel */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "linear-gradient(135deg, #fffbf0 0%, #ffffff 60%, #f0f7ff 100%)",
              p: { xs: 3, md: 5 },
              boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(202,138,4,0.10)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 520,
            }}
          >
            {/* Ambient glow */}
            <Box
              sx={{
                position: "absolute", top: -40, right: -40,
                width: 200, height: 200, borderRadius: "50%",
                bgcolor: "rgba(251,191,36,0.14)", filter: "blur(40px)", pointerEvents: "none",
              }}
            />

            <Box>
              <Box
                className="console-mono"
                sx={{
                  display: "inline-flex",
                  px: 1.8, py: 1,
                  borderRadius: 999,
                  border: "1px solid rgba(202,138,4,0.30)",
                  bgcolor: "rgba(234,179,8,0.08)",
                  fontSize: 11,
                  letterSpacing: 2.4,
                  textTransform: "uppercase",
                  color: "#92400e",
                }}
              >
                Franchise command center
              </Box>

              <Typography
                className="console-display"
                sx={{
                  mt: 3,
                  fontSize: { xs: 32, md: 52 },
                  lineHeight: 0.97,
                  letterSpacing: "-0.05em",
                  fontWeight: 700,
                  color: "#111827",
                  maxWidth: 540,
                }}
              >
                Run your franchise desk with a sharper, premium workspace.
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  maxWidth: 560,
                  fontSize: { xs: 15, md: 15.5 },
                  lineHeight: 1.9,
                  color: "#64748b",
                }}
              >
                Access orders, product control, settlements, inventory, and support
                in one professional operating environment built for daily execution.
              </Typography>
            </Box>

            <Stack spacing={2} sx={{ mt: 5 }}>
              {[
                "Live operational visibility across orders, stock, and payouts",
                "Zone-aware product ownership and franchise-specific fulfilment flow",
                "Secure account recovery with OTP-based password reset",
              ].map((item) => (
                <Box
                  key={item}
                  sx={{
                    display: "flex", gap: 1.5, alignItems: "flex-start",
                    p: 2, borderRadius: 4,
                    border: "1px solid rgba(0,0,0,0.07)",
                    bgcolor: "rgba(0,0,0,0.015)",
                  }}
                >
                  <Box
                    sx={{
                      mt: 0.5, width: 9, height: 9, borderRadius: "50%",
                      bgcolor: "#d97706",
                      boxShadow: "0 0 14px rgba(217,119,6,0.35)",
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontSize: 14, lineHeight: 1.8, color: "#374151" }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Right — login form */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "#ffffff",
              p: { xs: 3, md: 4.5 },
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            }}
          >
            {/* Top amber line */}
            <Box
              sx={{
                position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                background: "linear-gradient(90deg, rgba(251,191,36,0.9), rgba(217,119,6,0.8) 50%, transparent)",
                borderRadius: "6px 6px 0 0",
              }}
            />

            <Typography
              className="console-mono"
              sx={{ fontSize: 11, letterSpacing: 2.8, textTransform: "uppercase", color: "#94a3b8", mt: 1 }}
            >
              Secure access
            </Typography>
            <Typography
              className="console-display"
              sx={{
                mt: 1.5,
                fontSize: { xs: 26, md: 34 },
                lineHeight: 1,
                letterSpacing: "-0.04em",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Franchise Login
            </Typography>
            <Typography sx={{ mt: 1.5, fontSize: 14.5, lineHeight: 1.8, color: "#64748b" }}>
              Sign in using the franchise credentials shared by the BioBurg team.
            </Typography>

            <Box component="form" onSubmit={handleLogin} sx={{ mt: 4 }}>
              <Stack spacing={2.2}>
                <TextField
                  fullWidth label="Email address" name="email" type="email" required
                  value={formData.email} onChange={handleChange}
                  variant="outlined" sx={authFieldSx}
                />
                <TextField
                  fullWidth label="Password" name="password" type="password" required
                  value={formData.password} onChange={handleChange}
                  variant="outlined" sx={authFieldSx}
                />

                {error ? <MessageStrip>{error}</MessageStrip> : null}
                {notice ? <MessageStrip tone="success">{notice}</MessageStrip> : null}

                <Button type="submit" fullWidth variant="contained" disabled={loading} sx={primaryButtonSx}>
                  {loading ? "Logging in..." : "Enter Franchise Console"}
                </Button>

                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                  <Link
                    component="button" type="button" underline="none"
                    onClick={openForgotDialog}
                    sx={{ color: "#d97706", fontSize: 14, fontWeight: 600, "&:hover": { color: "#92400e" } }}
                  >
                    Forgot password?
                  </Link>
                  <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>
                    Protected internal access
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Forgot password dialog */}
      <Dialog
        open={forgotOpen}
        onClose={closeForgotDialog}
        fullWidth
        maxWidth="xs"
        className="franchise-console-root franchise-console-dialog"
        PaperProps={{
          sx: {
            background: "#ffffff",
            color: "#111827",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 4,
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.03em", color: "#111827" }}>
          Reset Franchise Password
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "rgba(0,0,0,0.07)" }}>
          <Stack spacing={2.2}>
            <Typography sx={{ fontSize: 14, lineHeight: 1.8, color: "#64748b" }}>
              Enter your registered email, request an OTP, then set your new password securely.
            </Typography>
            <TextField label="Registered email" name="email" type="email" value={forgotData.email} onChange={handleForgotChange} fullWidth variant="outlined" sx={authFieldSx} />
            <Button variant="outlined" onClick={sendResetOtp} disabled={sendingOtp} sx={secondaryButtonSx}>
              {sendingOtp ? "Sending OTP..." : "Send OTP"}
            </Button>
            <TextField label="OTP" name="otp" value={forgotData.otp} onChange={handleForgotChange} fullWidth variant="outlined" sx={authFieldSx} />
            <TextField label="New password" name="newPassword" type="password" value={forgotData.newPassword} onChange={handleForgotChange} fullWidth variant="outlined" sx={authFieldSx} />
            <TextField label="Confirm new password" name="confirmPassword" type="password" value={forgotData.confirmPassword} onChange={handleForgotChange} fullWidth variant="outlined" sx={authFieldSx} />

            {forgotError ? <MessageStrip>{forgotError}</MessageStrip> : null}
            {forgotNotice ? <MessageStrip tone="success">{forgotNotice}</MessageStrip> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1, borderColor: "rgba(0,0,0,0.07)" }}>
          <Button onClick={closeForgotDialog} variant="outlined" sx={secondaryButtonSx}>
            Close
          </Button>
          <Button variant="contained" onClick={resetPassword} disabled={resettingPassword} sx={primaryButtonSx}>
            {resettingPassword ? "Resetting..." : "Reset Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}