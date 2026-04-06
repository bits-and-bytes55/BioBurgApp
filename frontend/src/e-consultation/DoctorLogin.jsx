import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Link,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon
} from "@mui/icons-material";
import { loginAs } from "../../utils/auth";

// THEME COLOR
const THEME_COLOR = "#1976d2";

export default function DoctorLogin() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on typing
  };

  const handleTogglePassword = () => setShowPassword(!showPassword);

 const handleLogin = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    const res = await axios.post(
      // "https://bioburglifescience-1.onrender.com/api/doctor/login",
      "https://bioburglifescience-1.onrender.com/api/doctor/login",
      formData
    );

    loginAs("doctor", res.data.token);
    localStorage.setItem("doctorToken", res.data.token);

    // optional (quick UI use)
    localStorage.setItem("doctorId", res.data.doctor._id);

    window.location.href = "/doctor";

  } catch (err) {
    setError(err.response?.data?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      
      {/* LEFT SIDE: BRANDING IMAGE (Hidden on Mobile) */}
      {!isMobile && (
        <Grid item xs={12} md={6} sx={{
          bgcolor: "#0d47a1",
          backgroundImage: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          p: 4
        }}>
          <Box sx={{ maxWidth: 400, textAlign: "center" }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              BIOBURG HEALTH
            </Typography>
            <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
              Doctor's Portal
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, lineHeight: 1.7 }}>
              Access your dashboard, manage appointments, and provide seamless consultations to your patients.
            </Typography>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/3774/3774299.png" 
              alt="Doctor Login" 
              style={{ width: "250px", marginTop: "40px", opacity: 0.9 }} 
            />
          </Box>
        </Grid>
      )}

      {/* RIGHT SIDE: LOGIN FORM */}
      <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f4f6f8" }}>
        <Container maxWidth="xs">
          <Paper elevation={4} sx={{ p: 4, borderRadius: 3, width: "100%" }}>
            
            {/* Mobile Branding */}
            {isMobile && (
               <Typography variant="h5" color={THEME_COLOR} fontWeight="bold" textAlign="center" mb={3}>
                 BIOBURG HEALTH
               </Typography>
            )}

            <Box textAlign="center" mb={3}>
              <Typography variant="h5" fontWeight="bold" color="#333">
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please login to your account
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                
                {/* Email Field */}
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password Field */}
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleTogglePassword} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Remember Me & Forgot Password */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <FormControlLabel
                    control={<Checkbox color="primary" />}
                    label={<Typography variant="body2">Remember me</Typography>}
                  />
                  <Link href="#" underline="hover" variant="body2" color={THEME_COLOR} fontWeight="bold">
                    Forgot Password?
                  </Link>
                </Box>

                {/* Login Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={loading}
                  startIcon={!loading && <LoginIcon />}
                  sx={{
                    bgcolor: THEME_COLOR,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: "bold",
                    "&:hover": { bgcolor: "#115293" }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
                </Button>
              </Box>
            </form>

            <Box mt={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{" "}
                {/* 🔥 LINK FIXED HERE */}
                <Link 
                    component={RouterLink} 
                    to="/register/doctor" 
                    underline="hover" 
                    color={THEME_COLOR} 
                    fontWeight="bold"
                >
                  Register as Doctor
                </Link>
              </Typography>
            </Box>

          </Paper>
        </Container>
      </Grid>
    </Grid>
  );
}