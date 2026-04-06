import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
} from "@mui/material";
import {
  Dashboard,
  People,
  Business,
  Campaign,
  Assessment,
  MonetizationOn,
  Logout,
  ManageAccounts,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

const SIDEBAR_WIDTH = 240;

const AgentSidebar = ({ mobile = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { text: "Dashboard", icon: <Dashboard />, path: "/delivery-agent/delivery-dashboard" },
    { text: "Profile", icon: <ManageAccounts />, path: "/delivery-agent/delivery-profile" },
    { text: "Leads", icon: <People />, path: "/delivery-agent/delivery-leads" },
    { text: "Vendors", icon: <Business />, path: "/delivery-agent/delivery-vendors" },
    { text: "Campaigns", icon: <Campaign />, path: "/delivery-agent/delivery-campaigns" },
    { text: "Reports", icon: <Assessment />, path: "/delivery-agent/delivery-reports" },
    { text: "Commission", icon: <MonetizationOn />, path: "/delivery-agent/delivery-commission" },
  ];

  const logout = () => {
    localStorage.removeItem("deliveryToken");
    navigate("/delivery-agent/login");
  };

  return (
    <Drawer
      variant={mobile ? "temporary" : "permanent"}
      open={mobile}
      onClose={onClose}
      sx={{
        width: SIDEBAR_WIDTH,
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          background: "#1d4ed8",
          color: "white",
        },
      }}
    >
      <Box sx={{ p: 2, fontWeight: 700 }}>Delivery Agent</Box>
      <Divider />

      <List>
        {menu.map((item) => (
          <ListItemButton
            key={item.text}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              mobile && onClose?.();
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      <List>
        <ListItemButton onClick={logout}>
          <ListItemIcon sx={{ color: "white" }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Drawer>
  );
};

export default AgentSidebar;
