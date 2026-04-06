import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { useState } from "react";
import { deliveryAgentRegister } from "./services/deliveryAgentApi";

import { useNavigate } from "react-router-dom";

const AgentRegister = () => {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const { data } = await deliveryAgentRegister(form);
    localStorage.setItem("deliveryToken", data.token);
    navigate("/delivery-agent/login");
  };

  return (
    <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h5">Delivery Agent Register</Typography>

        {["name", "email", "phone", "assignedArea", "password"].map((field) => (
          <TextField
            key={field}
            fullWidth
            margin="normal"
            label={field}
            type={field === "password" ? "password" : "text"}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          />
        ))}

        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleSubmit}>
          Register
        </Button>
      </Paper>
    </Box>
  );
};

export default AgentRegister;
