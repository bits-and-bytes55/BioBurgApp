import React from "react";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { clearBulkManufacturingSession } from "../bulkManufactureApi";

const formatToday = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function TopStrip({ children, tone = "neutral" }) {
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
        px: 1.25,
        py: 0.6,
        borderRadius: 999,
        border: "1px solid",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        ...tones[tone],
      }}
    >
      {children}
    </Box>
  );
}

export default function Topbar({
  onMenuClick = () => {},
  pageTitle = "Bulk Manufacturing Dashboard",
  pageSubtitle = "Manage application and requirement activity",
  showMenuButton = false,
}) {
  const navigate = useNavigate();
  const storedUser = JSON.parse(
    localStorage.getItem("bulkManufacturingUser") || "{}",
  );

  const logout = () => {
    clearBulkManufacturingSession();
    navigate("/bulk-manufacturing/login");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "transparent",
        boxShadow: "none",
        px: { xs: 1.5, md: 2 },
        pt: { xs: 1, md: 1.25 },
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: "auto" }}>
        <Box
          sx={{
            width: "100%",
            px: { xs: 1.75, md: 2.5 },
            py: { xs: 1.25, md: 1.5 },
            borderRadius: { xs: 3, md: 3.5 },
            border: "1px solid rgba(0,0,0,0.08)",
            background: "#ffffff",
            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", xl: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", xl: "center" }}
          >
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              {showMenuButton ? (
                <IconButton
                  onClick={onMenuClick}
                  edge="start"
                  sx={{
                    color: "#1a2530",
                    border: "1px solid rgba(0,0,0,0.09)",
                    bgcolor: "rgba(0,0,0,0.02)",
                    mt: 0.25,
                    p: 0.75,
                  }}
                >
                  <MenuIcon sx={{ fontSize: 18 }} />
                </IconButton>
              ) : null}

              <Box>
                <Typography
                  className="console-mono"
                  sx={{
                    fontSize: 9,
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                    color: "#aab8c2",
                    mb: 0.5,
                  }}
                >
                  Bulk manufacturing workspace
                </Typography>
                <Typography
                  className="console-display"
                  sx={{
                    fontSize: { xs: 18, md: 22 },
                    lineHeight: 1.1,
                    fontWeight: 700,
                    color: "#0f1e2a",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {pageTitle}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#5a7080",
                    mt: 0.5,
                    maxWidth: 700,
                    lineHeight: 1.6,
                    fontSize: 12,
                  }}
                >
                  {pageSubtitle}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={0.75}
              alignItems={{ xs: "stretch", md: "center" }}
              flexWrap="wrap"
              useFlexGap
            >
              <TopStrip tone="neutral">{formatToday()}</TopStrip>
              <TopStrip tone={storedUser.status === "ACTIVE" ? "green" : "gold"}>
                {storedUser.status || "UNKNOWN"}
              </TopStrip>
              {storedUser.requestStatus ? (
                <TopStrip tone="blue">{storedUser.requestStatus}</TopStrip>
              ) : null}
              <TopStrip tone="gold">
                {storedUser.companyName || storedUser.username || storedUser.email || "Partner"}
              </TopStrip>
              <Button
                onClick={logout}
                sx={{
                  color: "#b83028",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: 999,
                  border: "1px solid rgba(200,80,70,0.2)",
                  bgcolor: "rgba(220,80,70,0.06)",
                  px: 1.75,
                  minHeight: 32,
                  "&:hover": {
                    bgcolor: "rgba(220,80,70,0.12)",
                  },
                }}
              >
                Logout
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Toolbar>
    </AppBar>
  );
}