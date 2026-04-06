import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
} from "@mui/material";

const THEME_COLOR = "#1976d2";

export default function PartnerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "https://bioburglifescience-1.onrender.com/api/auth/partner/login",
        {
          email,
          password,
        }
      );

      // JWT SAVE
      localStorage.setItem("partnerToken", res.data.token);
      alert("Login successful");

      // REDIRECT TO DASHBOARD
      navigate("/partner/dashboard");

    } catch (err) {
      alert("Invalid email or password");
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            borderTop: `6px solid ${THEME_COLOR}`,
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            textAlign="center"
            gutterBottom
          >
            Partner Login
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 3 }}
          >
            Login using credentials provided after approval
          </Typography>

          <TextField
            fullWidth
            label="Email"
            variant="standard"
            sx={{ mb: 3 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="standard"
            sx={{ mb: 4 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            fullWidth
            variant="contained"
            sx={{
              bgcolor: THEME_COLOR,
              "&:hover": { bgcolor: "#115293" },
            }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
