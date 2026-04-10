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
import { getAgentProfile } from "../../components/services/agentApi";

const AgentProfile = () => {
  const [agent, setAgent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAgentProfile()
      .then((res) => {
        setAgent(res.data.data);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setError("Failed to load profile. Please try again.");
      });
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;
  if (!agent) return <Typography>Loading...</Typography>;

  return (
    <Box>
      {/* COVER */}
      <Card sx={{ borderRadius: 4, overflow: "hidden", mb: 4 }}>
        <Box
          sx={{
            height: 220,
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        />

        {/* PROFILE HEADER */}
        <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 3 }}>
          <Avatar
            sx={{
              width: 110,
              height: 110,
              border: "4px solid white",
              mt: "-80px",
            }}
          >
            {agent.name?.charAt(0)}
          </Avatar>

          <Box flex={1}>
            <Typography variant="h5" fontWeight="bold">
              {agent.name}
            </Typography>
            <Typography color="text.secondary">
              Marketing Agent
            </Typography>

            <Box mt={1} display="flex" gap={1}>
              <Chip label="Active" color="success" size="small" />
              <Chip label={agent.assignedArea} size="small" />
            </Box>
          </Box>

          <Button variant="contained">Edit Profile</Button>
        </Box>
      </Card>

      {/* DETAILS */}
      <Grid container spacing={3}>
        {/* LEFT */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography fontWeight="bold" mb={2}>
                Introduction
              </Typography>

              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Business fontSize="small" />
                <Typography>{agent.assignedArea}</Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Email fontSize="small" />
                <Typography>{agent.email}</Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <Phone fontSize="small" />
                <Typography>{agent.phone || "N/A"}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn fontSize="small" />
                <Typography>India</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography fontWeight="bold" mb={2}>
                Activity
              </Typography>

              <Box
                sx={{
                  p: 2,
                  border: "1px solid #e5e7eb",
                  borderRadius: 3,
                }}
              >
                <Typography color="text.secondary">
                  Share your thoughts...
                </Typography>
              </Box>

              <Box mt={2} display="flex" justifyContent="space-between">
                <Box display="flex" gap={2}>
                  <Chip label="Photo / Video" />
                  <Chip label="Article" />
                </Box>

                <Button variant="contained">Post</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgentProfile;
