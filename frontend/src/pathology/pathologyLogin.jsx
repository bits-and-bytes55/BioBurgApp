import React, { useState } from "react";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/labs/login`,
        formData,
        { headers: { "Content-Type": "application/json" } }
      );

      //  Save token
      localStorage.setItem("labToken", res.data.token);
      console.log(res.data.token);

      alert("Login Successful");

      // Redirect to dashboard
      navigate("/lab");

    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5", display: "flex", alignItems: "center" }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" mb={2} fontWeight="bold">
            Lab Login
          </Typography>

          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
          >
            Login
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
