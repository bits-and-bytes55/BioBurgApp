import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { useState } from "react";
import { deliveryAgentLogin } from "./services/deliveryAgentApi";
import { useNavigate } from "react-router-dom";

const AgentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { data } = await deliveryAgentLogin({ email, password });
    localStorage.setItem("deliveryToken", data.token);
    console.log(data.token);
    navigate("/delivery-agent/delivery-dashboard");
  };

  return (
    <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
      <Paper sx={{ p: 4, width: 350 }}>
        <Typography variant="h5" mb={2}>Delivery Agent Login</Typography>

        <TextField fullWidth label="Email" margin="normal"
          onChange={(e) => setEmail(e.target.value)} />

        <TextField fullWidth label="Password" type="password" margin="normal"
          onChange={(e) => setPassword(e.target.value)} />

        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleLogin}>
          Login
        </Button>
      </Paper>
    </Box>
  );
};

export default AgentLogin;
