import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <Box sx={{ width: 240, bgcolor: "#1976d2", color: "white" }}>
      <Typography variant="h6" sx={{ p: 2, fontWeight: "bold" }}>
        BIOBURG LAB
      </Typography>

      <List>
        <ListItemButton onClick={() => navigate("/lab/dashboard")}>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate("/lab/profile")}>
          <ListItemText primary="Profile" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate("/lab/tests")}>
          <ListItemText primary="Tests" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate("/lab/bookings")}>
          <ListItemText primary="Bookings" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate("/lab/reports")}>
          <ListItemText primary="Reports" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate("/lab/change-password")}>
          <ListItemText primary="Change Password" />
        </ListItemButton>

        <ListItemButton
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Box>
  );
}
