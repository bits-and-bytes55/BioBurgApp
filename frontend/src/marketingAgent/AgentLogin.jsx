import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { useState } from "react";
import { agentLogin } from "../components/services/agentApi";
import { useNavigate } from "react-router-dom";
import { toast} from "react-hot-toast";

const AgentLogin = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { data } = await agentLogin({ email, password });
    
    localStorage.setItem("agentToken", data.token);
    console.log(data.token);
    if(data.success){
      toast.success("Login Successful!");
      navigate("/agent/dashboard");
    } else{
      toast.error("Invalid Credentials");
    }   
  };

  return (
    <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
      <Paper sx={{ p: 4, width: 350 }}>
        <Typography variant="h5" mb={2}>Agent Login</Typography>

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
