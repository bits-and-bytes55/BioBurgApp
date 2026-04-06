import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BULK_MANUFACTURING_AUTH_API_BASE,
  persistBulkManufacturingSession,
} from "../bulkManufactureApi";
import {
  ConsoleButton,
  ConsoleNotice,
  FranchiseConsoleStyles,
} from "../../Franchise/components/consoleUi";

const emptyForgotForm = {
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    color: "#edf3f7",
    bgcolor: "rgba(255,255,255,0.03)",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.08)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(215,178,109,0.32)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(215,178,109,0.85)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#000102",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#030200",
  },
  "& .MuiInputBase-input": {
    color: "#edf3f7",
  },
};

const primaryButtonSx = {
  minHeight: 52,
  borderRadius: 999,
  textTransform: "none",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  color: "#091015",
  background:
    "linear-gradient(135deg, rgba(240,213,157,1) 0%, rgba(215,178,109,1) 100%)",
  boxShadow: "0 20px 34px rgba(215,178,109,0.25)",
  "&:hover": {
    background:
      "linear-gradient(135deg, rgba(247,224,173,1) 0%, rgba(222,188,121,1) 100%)",
  },
  "&.Mui-disabled": {
    color: "rgba(9,16,21,0.6)",
    background: "rgba(215,178,109,0.45)",
  },
};

const secondaryButtonSx = {
  minHeight: 44,
  borderRadius: 999,
  textTransform: "none",
  fontWeight: 700,
  color: "#edf3f7",
  borderColor: "rgba(255,255,255,0.1)",
  bgcolor: "rgba(255,255,255,0.03)",
  "&:hover": {
    borderColor: "rgba(215,178,109,0.35)",
    bgcolor: "rgba(255,255,255,0.05)",
  },
};

export default function BulkManufacturingLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotData, setForgotData] = useState(emptyForgotForm);
  const [forgotError, setForgotError] = useState("");
  const [forgotNotice, setForgotNotice] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setNotice("");

      const { data } = await axios.post(
        `${BULK_MANUFACTURING_AUTH_API_BASE}/login`,
        {
          identifier,
          password,
        },
      );

      persistBulkManufacturingSession(data.token, data.account);
      navigate("/bulk-manufacturing/dashboard", { replace: true });
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "Unable to login to the bulk manufacturing portal.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotChange = (event) => {
    setForgotData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const openForgotDialog = () => {
    setForgotOpen(true);
    setForgotError("");
    setForgotNotice("");
    setNotice("");
    setForgotData((current) => ({
      ...emptyForgotForm,
      email: current.email || identifier,
    }));
  };

  const closeForgotDialog = () => {
    setForgotOpen(false);
    setForgotError("");
    setForgotNotice("");
  };

  const sendResetOtp = async () => {
    if (!forgotData.email) {
      setForgotError("Please enter your registered email first.");
      return;
    }

    setForgotError("");
    setForgotNotice("");
    setSendingOtp(true);

    try {
      const response = await axios.post(
        `${BULK_MANUFACTURING_AUTH_API_BASE}/forgot-password`,
        { email: forgotData.email },
      );

      const nextNotice = response.data?.debugOtp
        ? `${response.data.message} OTP: ${response.data.debugOtp}`
        : response.data?.message || "OTP sent to your registered email.";

      setForgotNotice(nextNotice);
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
      const response = await axios.post(
        `${BULK_MANUFACTURING_AUTH_API_BASE}/reset-password`,
        {
          email: forgotData.email,
          otp: forgotData.otp,
          newPassword: forgotData.newPassword,
        },
      );

      setIdentifier(forgotData.email);
      setPassword("");
      setNotice(
        response.data?.message || "Password reset successful. Please log in.",
      );
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
        minHeight: "100vh",
        bgcolor: "#071015",
        color: "#edf3f7",
        background:
          "radial-gradient(circle at top left, rgba(210, 207, 200, 0.41), transparent 24%), radial-gradient(circle at 90% 12%, rgba(122, 180, 255, 0.35), transparent 18%), linear-gradient(180deg, #6897b0 0%, #05090d 100%)",
        py: { xs: 4, md: 8 },
      }}
    >
      <FranchiseConsoleStyles />
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              bgcolor: "transparent",
              background:
                "radial-gradient(circle at top left, rgb(255, 255, 255), transparent 28%), linear-gradient(180deg, rgb(255, 255, 255), rgba(8,12,17,0.93))",
              boxShadow: "0 34px 90px rgba(0,0,0,0.34)",
            }}
          >
            <Box
              className="console-mono"
              sx={{
                display: "inline-flex",
                px: 1.7,
                py: 0.9,
                borderRadius: 999,
                border: "1px solid rgba(215,178,109,0.2)",
                bgcolor: "rgba(215,178,109,0.08)",
                fontSize: 11,
                letterSpacing: 2.4,
                textTransform: "uppercase",
                color: "#735009",
              }}
            >
              Bulk manufacturing partner portal
            </Box>
            <Typography
              className="console-display"
              sx={{
                mt: 2.5,
                fontSize: { xs: 34, md: 56 },
                lineHeight: 0.95,
                letterSpacing: "-0.05em",
                fontWeight: 700,
              }}
            >
              Access your contract manufacturing workspace.
            </Typography>
            <Typography sx={{ mt: 2.5, maxWidth: 620, color: "#000000", fontSize: 15.5, lineHeight: 1.95 }}>
              Approved applicants can sign in to track review status, submit fresh
              product requirements, manage website catalog products, and receive
              quote updates from the BioBurg team.
            </Typography>

            <Stack spacing={2} sx={{ mt: 4 }}>
              <ConsoleNotice tone="info">
                This portal is enabled only after admin approval. Use the username or
                email shared by the admin team.
              </ConsoleNotice>
              <ConsoleNotice tone="warning">
                If your application is still pending, continue using the public
                registration form. Login access is provisioned only after review.
              </ConsoleNotice>
            </Stack>
          </Paper>

          <Paper
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              bgcolor: "transparent",
              background:
                "linear-gradient(180deg, rgb(255, 255, 255), rgba(8,12,17,0.93))",
              boxShadow: "0 34px 90px rgba(0,0,0,0.34)",
              alignSelf: "center",
            }}
          >
            <Typography
              className="console-display"
              sx={{ fontSize: 32, lineHeight: 1, letterSpacing: "-0.04em", fontWeight: 700 }}
            >
              Sign in
            </Typography>
            <Typography sx={{ mt: 1.2, color: "#3b4348", lineHeight: 1.8 }}>
              Enter your provisioned login ID and password to continue.
            </Typography>

            {error ? <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert> : null}
            {notice ? <Alert severity="success" sx={{ mt: 3 }}>{notice}</Alert> : null}

            <Stack spacing={2.5} sx={{ mt: 3 }}>
              <TextField
                label="Username or Email"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                fullWidth
                sx={fieldSx}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                fullWidth
                sx={fieldSx}
              />
              <Button type="submit" fullWidth variant="contained" disabled={submitting} sx={primaryButtonSx}>
                {submitting ? "Signing in..." : "Login to portal"}
              </Button>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Link
                  component="button"
                  type="button"
                  underline="none"
                  onClick={openForgotDialog}
                  sx={{
                    color: "#f0d59d",
                    fontSize: 14,
                    fontWeight: 600,
                    "&:hover": {
                      color: "#fff2cf",
                    },
                  }}
                >
                  Forgot password?
                </Link>
                <Typography sx={{ fontSize: 13.5, color: "#667987" }}>
                  Protected internal access
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Container>

      <Dialog
        open={forgotOpen}
        onClose={closeForgotDialog}
        fullWidth
        maxWidth="xs"
        className="franchise-console-root franchise-console-dialog"
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 24, letterSpacing: "-0.03em" }}>
          Reset Bulk Manufacturing Password
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.2}>
            <Typography sx={{ fontSize: 14, lineHeight: 1.8, color: "#000000" }}>
              Enter your registered email, request an OTP, then set your new
              password securely.
            </Typography>

            <TextField
              label="Registered email"
              name="email"
              type="email"
              value={forgotData.email}
              onChange={handleForgotChange}
              fullWidth
              variant="outlined"
              sx={fieldSx}
            />

            <Button
              variant="outlined"
              onClick={sendResetOtp}
              disabled={sendingOtp}
              sx={secondaryButtonSx}
            >
              {sendingOtp ? "Sending OTP..." : "Send OTP"}
            </Button>

            <TextField
              label="OTP"
              name="otp"
              value={forgotData.otp}
              onChange={handleForgotChange}
              fullWidth
              variant="outlined"
              sx={fieldSx}
            />

            <TextField
              label="New password"
              name="newPassword"
              type="password"
              value={forgotData.newPassword}
              onChange={handleForgotChange}
              fullWidth
              variant="outlined"
              sx={fieldSx}
            />

            <TextField
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              value={forgotData.confirmPassword}
              onChange={handleForgotChange}
              fullWidth
              variant="outlined"
              sx={fieldSx}
            />

            {forgotError ? <Alert severity="error">{forgotError}</Alert> : null}
            {forgotNotice ? <Alert severity="success">{forgotNotice}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
          <Button onClick={closeForgotDialog} variant="outlined" sx={secondaryButtonSx}>
            Close
          </Button>
          <ConsoleButton onClick={resetPassword} disabled={resettingPassword}>
            {resettingPassword ? "Resetting..." : "Reset Password"}
          </ConsoleButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
