import React from "react";
import {
  Box,
  ButtonBase,
  Divider,
  Drawer,
  List,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccountCircle,
  Dashboard,
  Description,
  Inventory2,
  Logout,
  ReceiptLong,
  Storefront,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { clearBulkManufacturingSession } from "../bulkManufactureApi";

export const BULK_DRAWER_WIDTH = 220;

const menu = [
  {
    label: "Dashboard",
    description: "Application and RFQ summary",
    path: "/bulk-manufacturing/dashboard",
    icon: <Dashboard sx={{ fontSize: 16 }} />,
  },
  {
    label: "All Products",
    description: "Create, list, and manage website catalog",
    path: "/bulk-manufacturing/products",
    icon: <Storefront sx={{ fontSize: 16 }} />,
  },
  {
    label: "Orders",
    description: "Track website orders and leads",
    path: "/bulk-manufacturing/orders",
    icon: <ReceiptLong sx={{ fontSize: 16 }} />,
  },
  {
    label: "Requirements",
    description: "Submit and track requirements",
    path: "/bulk-manufacturing/requirements",
    icon: <Inventory2 sx={{ fontSize: 16 }} />,
  },
  {
    label: "Documents",
    description: "Application files and review notes",
    path: "/bulk-manufacturing/documents",
    icon: <Description sx={{ fontSize: 16 }} />,
  },
  {
    label: "Profile",
    description: "Company and contact details",
    path: "/bulk-manufacturing/profile",
    icon: <AccountCircle sx={{ fontSize: 16 }} />,
  },
];

function StatusPill({ children, tone = "neutral" }) {
  const tones = {
    neutral: {
      borderColor: "rgba(0,0,0,0.1)",
      color: "#4a5e6a",
      background: "#f0f3f5",
    },
    gold: {
      borderColor: "rgba(184,137,42,0.28)",
      color: "#7a5510",
      background: "rgba(215,178,109,0.1)",
    },
    blue: {
      borderColor: "rgba(80,140,220,0.25)",
      color: "#1e4e8a",
      background: "rgba(122,180,255,0.09)",
    },
    green: {
      borderColor: "rgba(60,160,130,0.25)",
      color: "#1a5e48",
      background: "rgba(101,196,177,0.09)",
    },
  };

  return (
    <Box
      sx={{
        px: 1,
        py: 0.5,
        borderRadius: 999,
        border: "1px solid",
        fontSize: 10,
        lineHeight: 1,
        fontWeight: 700,
        ...tones[tone],
      }}
    >
      {children}
    </Box>
  );
}

export default function Sidebar({
  mobileOpen = false,
  onClose = () => {},
  isMobile = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = JSON.parse(
    localStorage.getItem("bulkManufacturingUser") || "{}",
  );

  const logout = () => {
    clearBulkManufacturingSession();
    navigate("/bulk-manufacturing/login");
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#1a2530",
        background: "#ffffff",
      }}
    >
      {/* Brand card */}
      <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "#f8fafc",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(215,178,109,0.12)",
                border: "1px solid rgba(215,178,109,0.24)",
                color: "#8a6010",
                fontWeight: 800,
                fontSize: 11,
                flexShrink: 0,
              }}
              className="console-display"
            >
              BM
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                className="console-mono"
                sx={{
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "#8da0ad",
                  mb: 0.4,
                }}
              >
                Bulk manufacturing desk
              </Typography>
              <Typography
                className="console-display"
                sx={{ fontSize: 15, lineHeight: 1.1, fontWeight: 700, color: "#0f1e2a" }}
              >
                BioBurg
              </Typography>
              <Typography sx={{ mt: 0.4, fontSize: 11, lineHeight: 1.5, color: "#5a7080" }}>
                {storedUser.companyName || storedUser.email || "Partner account"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
            <StatusPill tone={storedUser.status === "ACTIVE" ? "green" : "gold"}>
              {storedUser.status || "UNKNOWN"}
            </StatusPill>
            {storedUser.requestStatus ? (
              <StatusPill tone="blue">{storedUser.requestStatus}</StatusPill>
            ) : null}
            <StatusPill tone="gold">Contract manufacturing</StatusPill>
          </Stack>
        </Box>
      </Box>

      {/* Nav label */}
      <Box sx={{ px: 2, pb: 0.5 }}>
        <Typography
          className="console-mono"
          sx={{
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: 2.5,
            color: "#aab8c2",
            px: 0.5,
          }}
        >
          Navigation
        </Typography>
      </Box>

      {/* Nav list */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <List sx={{ px: 1.25, py: 0.75, flexGrow: 1, minHeight: 0, overflowY: "auto" }}>
          {menu.map((item) => {
            const selected =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

            return (
              <ButtonBase
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  borderRadius: 2.5,
                  mb: 0.5,
                  overflow: "hidden",
                  border: selected
                    ? "1px solid rgba(215,178,109,0.32)"
                    : "1px solid rgba(0,0,0,0.06)",
                  background: selected
                    ? "linear-gradient(135deg, rgba(215,178,109,0.11), #fffdf8)"
                    : "rgba(0,0,0,0.015)",
                  transition: "all .15s ease",
                  "&:hover": {
                    background: selected
                      ? "linear-gradient(135deg, rgba(215,178,109,0.16), #fffdf5)"
                      : "rgba(0,0,0,0.035)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 3,
                    bgcolor: selected ? "#c9a040" : "transparent",
                    flexShrink: 0,
                  }}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ width: "100%", px: 1.25, py: 1 }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: selected ? "rgba(215,178,109,0.14)" : "rgba(0,0,0,0.04)",
                      color: selected ? "#8a6010" : "#4a6070",
                      border: "1px solid",
                      borderColor: selected
                        ? "rgba(215,178,109,0.22)"
                        : "rgba(0,0,0,0.07)",
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <ListItemText
                    primary={item.label}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontWeight: selected ? 700 : 600,
                      fontSize: 12,
                      color: selected ? "#0f1e2a" : "#2d3f4c",
                    }}
                    secondaryTypographyProps={{
                      fontSize: 10,
                      color: "#8fa0ad",
                      sx: { mt: 0.15 },
                    }}
                  />
                </Stack>
              </ButtonBase>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: "rgba(0,0,0,0.07)", mx: 2 }} />

      {/* Session card */}
      <Box sx={{ p: 1.5 }}>
        <Box
          sx={{
            p: 1.25,
            borderRadius: 2.5,
            border: "1px solid rgba(0,0,0,0.07)",
            bgcolor: "#f8fafc",
          }}
        >
          <Typography
            className="console-mono"
            sx={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#aab8c2",
              mb: 0.75,
            }}
          >
            Session
          </Typography>
          <Typography sx={{ fontSize: 11, lineHeight: 1.6, color: "#5a7080", mb: 1 }}>
            Access has been provisioned after admin approval. Use logout while switching desks.
          </Typography>

          <ButtonBase
            onClick={logout}
            sx={{
              width: "100%",
              justifyContent: "flex-start",
              gap: 1,
              borderRadius: 2,
              px: 1.25,
              py: 0.85,
              color: "#b83028",
              border: "1px solid rgba(200,80,70,0.2)",
              bgcolor: "rgba(220,80,70,0.06)",
              "&:hover": {
                bgcolor: "rgba(220,80,70,0.11)",
              },
            }}
          >
            <Logout sx={{ fontSize: 14 }} />
            <Typography fontWeight={700} fontSize={12}>Logout</Typography>
          </ButtonBase>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: BULK_DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: BULK_DRAWER_WIDTH,
          boxSizing: "border-box",
          borderRight: "1px solid rgba(0,0,0,0.08)",
          background: "#ffffff",
          height: "100dvh",
          overflow: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}