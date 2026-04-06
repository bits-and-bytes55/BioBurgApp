import React from "react";
import { AppBar, Box, Button, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { clearFranchiseSession } from "../franchiseApi";

const formatToday = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function TopStrip({ children, tone = "neutral" }) {
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
        px: 1.5,
        py: 0.9,
        borderRadius: 999,
        border: "1px solid",
        fontSize: 12,
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
  pageTitle = "Franchise Dashboard",
  pageSubtitle = "Daily operations for your franchise zone",
  showMenuButton = false,
}) {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("franchiseUser") || "{}");

  const logout = () => {
    clearFranchiseSession();
    navigate("/franchise/login");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "transparent",
        boxShadow: "none",
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 2.5 },
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: "auto" }}>
        <Box
          sx={{
            width: "100%",
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 2.5 },
            borderRadius: { xs: 4, md: 5 },
            border: "1px solid rgba(0,0,0,0.08)",
            background:
              "linear-gradient(135deg, #fffbf0 0%, #ffffff 60%, #f8faff 100%)",
            backdropFilter: "blur(18px)",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(202,138,4,0.12)",
          }}
        >
          <Stack
            direction={{ xs: "column", xl: "row" }}
            spacing={2.5}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", xl: "center" }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              {showMenuButton ? (
                <IconButton
                  onClick={onMenuClick}
                  edge="start"
                  sx={{
                    color: "#374151",
                    border: "1px solid rgba(0,0,0,0.09)",
                    bgcolor: "rgba(0,0,0,0.03)",
                    mt: 0.25,
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.07)",
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              ) : null}

              <Box>
                <Typography
                  className="console-mono"
                  sx={{
                    fontSize: 11,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    mb: 1,
                  }}
                >
                  Franchise command center
                </Typography>
                <Typography
                  className="console-display"
                  sx={{
                    fontSize: { xs: 26, md: 32 },
                    lineHeight: 1.05,
                    fontWeight: 700,
                    color: "#111827",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {pageTitle}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#64748b", mt: 1.2, maxWidth: 760, lineHeight: 1.75 }}
                >
                  {pageSubtitle}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", md: "center" }}
              flexWrap="wrap"
              useFlexGap
            >
              <TopStrip tone="neutral">{formatToday()}</TopStrip>
              <TopStrip tone={storedUser.status === "ACTIVE" ? "green" : "gold"}>
                {storedUser.status || "UNKNOWN"}
              </TopStrip>
              {storedUser.zoneName ? <TopStrip tone="blue">{storedUser.zoneName}</TopStrip> : null}
              <TopStrip tone="gold">{storedUser.fullName || storedUser.email || "Franchise"}</TopStrip>
              <Button
                onClick={logout}
                sx={{
                  color: "#991b1b",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 999,
                  border: "1px solid rgba(220,38,38,0.22)",
                  bgcolor: "rgba(220,38,38,0.06)",
                  px: 2,
                  minHeight: 40,
                  "&:hover": {
                    bgcolor: "rgba(220,38,38,0.12)",
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