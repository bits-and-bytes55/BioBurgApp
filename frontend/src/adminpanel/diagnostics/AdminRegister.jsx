import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL; 

const AdminRegister = () => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showCPass, setShowCPass] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // VALIDATION
  const validateForm = () => {
    const { username, password, confirmPassword } = form;

    if (!username.trim()) return "Username is required";
    if (username.trim().length < 3)
      return "Username must be at least 3 characters";

    if (!password) return "Password is required";
    if (password.length < 6)
      return "Password must be at least 6 characters long";

    if (!confirmPassword) return "Confirm password is required";
    if (password !== confirmPassword) return "Passwords do not match";

    return ""; // no error
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm();
    if (validation) {
      toast.error(validation);
      return;
    }

    try {
      const res = await axios.post(`${BASE_API}/api/admin/register`, {
        username: form.username,
        password: form.password,
      });

      localStorage.setItem("adminToken", res.data.token);

      toast.success("Admin registered successfully!");

      navigate("/admin-login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed!");
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Paper elevation={6} sx={{ p: 4, width: 380, borderRadius: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}
        >
          🧑‍⚕️ Admin Register
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <TextField
            fullWidth
            label="Username"
            name="username"
            margin="normal"
            value={form.username}
            onChange={handleChange}
          />

          {/* Password */}
          <TextField
            fullWidth
            type={showPass ? "text" : "password"}
            label="Password"
            name="password"
            margin="normal"
            value={form.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass(!showPass)}>
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Confirm Password */}
          <TextField
            fullWidth
            type={showCPass ? "text" : "password"}
            label="Confirm Password"
            name="confirmPassword"
            margin="normal"
            value={form.confirmPassword}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCPass(!showCPass)}>
                    {showCPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2, py: 1.2, fontSize: "16px" }}
            type="submit"
          >
            Register
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminRegister;
