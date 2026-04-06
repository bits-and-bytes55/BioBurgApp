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
  Inventory2,
  Logout,
  Payments,
  ReceiptLong,
  ShoppingCart,
  Storefront,
  SupportAgent,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { clearFranchiseSession } from "../franchiseApi";

export const FRANCHISE_DRAWER_WIDTH = 272;

const menu = [
  {
    label: "Dashboard",
    description: "Live zone operations",
    path: "/franchise/dashboard",
    icon: <Dashboard sx={{ fontSize: 18 }} />,
  },
  {
    label: "Products",
    description: "Catalog and ownership",
    path: "/franchise/products",
    icon: <Storefront sx={{ fontSize: 18 }} />,
  },
  {
    label: "Orders",
    description: "Fulfilment and invoices",
    path: "/franchise/orders",
    icon: <ShoppingCart sx={{ fontSize: 18 }} />,
  },
  {
    label: "Sales & Reports",
    description: "Revenue and ledger view",
    path: "/franchise/reports",
    icon: <ReceiptLong sx={{ fontSize: 18 }} />,
  },
  {
    label: "Payments",
    description: "Settlement visibility",
    path: "/franchise/payments",
    icon: <Payments sx={{ fontSize: 18 }} />,
  },
  {
    label: "Inventory",
    description: "Stock and restock queue",
    path: "/franchise/inventory",
    icon: <Inventory2 sx={{ fontSize: 18 }} />,
  },
  {
    label: "Support",
    description: "Tickets and replies",
    path: "/franchise/support",
    icon: <SupportAgent sx={{ fontSize: 18 }} />,
  },
  {
    label: "Profile",
    description: "Identity and settings",
    path: "/franchise/profile",
    icon: <AccountCircle sx={{ fontSize: 18 }} />,
  },
];

function StatusPill({ children, tone = "neutral" }) {
  const tones = {
    neutral: {
      borderColor: "rgba(0,0,0,0.10)",
      color: "#475569",
      background: "rgba(0,0,0,0.04)",
    },
    gold: {
      borderColor: "rgba(202,138,4,0.30)",
      color: "#92400e",
      background: "rgba(234,179,8,0.10)",
    },
    blue: {
      borderColor: "rgba(59,130,246,0.28)",
      color: "#1e40af",
      background: "rgba(59,130,246,0.08)",
    },
    green: {
      borderColor: "rgba(16,185,129,0.28)",
      color: "#065f46",
      background: "rgba(16,185,129,0.09)",
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

export default function Sidebar({ mobileOpen = false, onClose = () => {}, isMobile = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = JSON.parse(localStorage.getItem("franchiseUser") || "{}");

  const logout = () => {
    clearFranchiseSession();
    navigate("/franchise/login");
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#111827",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        borderRight: "1px solid rgba(0,0,0,0.07)",
      }}
    >
      {/* ── Brand card — compact ── */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Box
          sx={{
            p: 1.75,
            borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "linear-gradient(135deg, #fffbf0 0%, #ffffff 100%)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 10px rgba(234,179,8,0.07)",
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            {/* Logo mark */}
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(234,179,8,0.12)",
                border: "1px solid rgba(202,138,4,0.28)",
                color: "#92400e",
                fontWeight: 800,
                fontSize: 13,
                flexShrink: 0,
              }}
              className="console-display"
            >
              BB
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                className="console-mono"
                sx={{
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "#94a3b8",
                  lineHeight: 1,
                  mb: 0.4,
                }}
              >
                Franchise operating suite
              </Typography>
              <Typography
                className="console-display"
                sx={{ fontSize: 18, lineHeight: 1.1, fontWeight: 700, color: "#111827" }}
              >
                BioBurg
              </Typography>
              <Typography
                sx={{ mt: 0.35, fontSize: 11.5, lineHeight: 1.4, color: "#64748b" }}
                noWrap
              >
                {storedUser.fullName || storedUser.email || "Franchise account"}
              </Typography>
            </Box>
          </Stack>

          {/* Status pills row */}
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
            <StatusPill tone={storedUser.status === "ACTIVE" ? "green" : "gold"}>
              {storedUser.status || "UNKNOWN"}
            </StatusPill>
            {storedUser.zoneName ? (
              <StatusPill tone="blue">{storedUser.zoneName}</StatusPill>
            ) : null}
            <StatusPill tone="gold">Premium workspace</StatusPill>
          </Stack>
        </Box>
      </Box>

      {/* ── Nav label ── */}
      <Box sx={{ px: 2.5, pb: 0.5 }}>
        <Typography
          className="console-mono"
          sx={{
            fontSize: 9.5,
            textTransform: "uppercase",
            letterSpacing: 2.5,
            color: "#94a3b8",
            px: 0.5,
          }}
        >
          Navigation
        </Typography>
      </Box>

      {/* ── Nav list — tighter items ── */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <List sx={{ px: 1.5, py: 0.5, flexGrow: 1, minHeight: 0, overflowY: "auto" }}>
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
                  borderRadius: 3,
                  mb: 0.5,
                  overflow: "hidden",
                  border: selected
                    ? "1px solid rgba(202,138,4,0.26)"
                    : "1px solid rgba(0,0,0,0.055)",
                  background: selected
                    ? "linear-gradient(135deg, rgba(254,243,199,0.85), rgba(255,255,255,0.95))"
                    : "rgba(0,0,0,0.012)",
                  transition: "all .18s ease",
                  "&:hover": {
                    background: selected
                      ? "linear-gradient(135deg, rgba(253,230,138,0.5), #ffffff)"
                      : "rgba(0,0,0,0.032)",
                    borderColor: selected
                      ? "rgba(202,138,4,0.36)"
                      : "rgba(0,0,0,0.09)",
                  },
                }}
              >
                {/* Active indicator bar */}
                <Box
                  sx={{
                    width: 3,
                    bgcolor: selected ? "#ca8a04" : "transparent",
                    flexShrink: 0,
                  }}
                />

                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{ width: "100%", px: 1.5, py: 1.1 }}
                >
                  {/* Icon box — smaller */}
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: selected ? "rgba(234,179,8,0.13)" : "rgba(0,0,0,0.04)",
                      color: selected ? "#92400e" : "#64748b",
                      border: "1px solid",
                      borderColor: selected
                        ? "rgba(202,138,4,0.22)"
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
                      fontSize: 13,
                      color: selected ? "#111827" : "#1e293b",
                      lineHeight: 1.2,
                    }}
                    secondaryTypographyProps={{
                      fontSize: 11,
                      color: "#94a3b8",
                      sx: { mt: 0.2, lineHeight: 1.2 },
                    }}
                  />
                </Stack>
              </ButtonBase>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: "rgba(0,0,0,0.07)", mx: 2 }} />

      {/* ── Session footer — compact ── */}
      <Box sx={{ p: 1.75 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.07)",
            bgcolor: "rgba(0,0,0,0.02)",
          }}
        >
          <Typography
            className="console-mono"
            sx={{
              fontSize: 9.5,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#94a3b8",
              mb: 0.75,
            }}
          >
            Session
          </Typography>
          <Typography sx={{ fontSize: 11.5, lineHeight: 1.6, color: "#64748b", mb: 1.25 }}>
            Secure franchise session is active. Use logout when switching desks.
          </Typography>

          <ButtonBase
            onClick={logout}
            sx={{
              width: "100%",
              justifyContent: "flex-start",
              gap: 1,
              borderRadius: 2.5,
              px: 1.4,
              py: 1,
              color: "#991b1b",
              border: "1px solid rgba(220,38,38,0.20)",
              bgcolor: "rgba(220,38,38,0.06)",
              "&:hover": {
                bgcolor: "rgba(220,38,38,0.12)",
              },
            }}
          >
            <Logout sx={{ fontSize: 16 }} />
            <Typography fontWeight={700} fontSize={13}>Logout</Typography>
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
        width: FRANCHISE_DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: FRANCHISE_DRAWER_WIDTH,
          boxSizing: "border-box",
          borderRight: "1px solid rgba(0,0,0,0.07)",
          background: "transparent",
          height: "100dvh",
          overflow: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}