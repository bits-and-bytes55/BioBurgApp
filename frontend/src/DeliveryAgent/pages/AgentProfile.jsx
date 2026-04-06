import { useEffect, useState } from "react";
import {
  Box,
  Avatar,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
import {
  Email,
  Phone,
  LocationOn,
  Business,
} from "@mui/icons-material";
import { getDeliveryAgentProfile } from "../services/deliveryAgentApi";

const AgentProfile = () => {
  const [agent, setAgent] = useState(null);

  useEffect(() => {
    getDeliveryAgentProfile().then((res) => {
      setAgent(res.data.data);
    });
  }, []);

  if (!agent) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Card sx={{ borderRadius: 4, mb: 4 }}>
        <Box sx={{ height: 200, background: "linear-gradient(135deg,#667eea,#764ba2)" }} />
        <Box sx={{ p: 3, display: "flex", gap: 3 }}>
          <Avatar sx={{ width: 100, height: 100 }}>
            {agent.name?.charAt(0)}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h5">{agent.name}</Typography>
            <Typography color="text.secondary">Delivery Agent</Typography>
            <Box mt={1}>
              <Chip label="Active" color="success" size="small" />
              <Chip label={agent.assignedArea} size="small" sx={{ ml: 1 }} />
            </Box>
          </Box>
          <Button variant="contained">Edit</Button>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography fontWeight="bold">Info</Typography>
              <Divider sx={{ my: 2 }} />

              <Typography><Business /> {agent.assignedArea}</Typography>
              <Typography><Email /> {agent.email}</Typography>
              <Typography><Phone /> {agent.phone}</Typography>
              <Typography><LocationOn /> India</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgentProfile;
