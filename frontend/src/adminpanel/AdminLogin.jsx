import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginAs } from "../../utils/auth"; 
import { API_BASE_URL } from "../config/api";
// import admin from "../../../backend/models/admin";

const BASE_API = API_BASE_URL;

const AdminLogin = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // VALIDATION
  const validateForm = () => {
    if (!form.username.trim()) return "Username is required";
    if (!form.password.trim()) return "Password is required";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      const res = await axios.post(`${BASE_API}/api/admin/login`, form);

      // Save Admin Token
      loginAs("admin", res.data.token); 
      localStorage.setItem("adminToken", res.data.token);
      console.log("Admin Token:", res.data.token)
      navigate("/admin/dashboard");
      toast.success("Login Successful!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Credentials!");
      console.log(error)
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: 350,
          borderRadius: 3
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: "bold", textAlign: "center" }}
        >
          🔐 Admin Login
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
              )
            }}
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2, py: 1.2, fontSize: "16px" }}
            type="submit"
          >
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminLogin;

