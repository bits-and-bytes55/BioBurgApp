import { Box, Drawer, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import AgentSidebar from "../components/AgentSidebar";

const SIDEBAR_WIDTH = 248;

const AgentLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>

      {/* ── HAMBURGER — only visible on mobile ── */}
      {isMobile && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 1400,
            bgcolor: darkMode ? "#0f172a" : "#1d4ed8",
            color: "white",
            width: 42,
            height: 42,
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            "&:hover": { bgcolor: darkMode ? "#1e293b" : "#1e40af" },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* ── DESKTOP SIDEBAR (permanent) ── */}
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <AgentSidebar darkMode={darkMode} />
      </Box>

      {/* ── MOBILE SIDEBAR (temporary drawer) ── */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            border: "none",
          },
        }}
      >
        <AgentSidebar
          darkMode={darkMode}
          mobile
          onClose={() => setMobileOpen(false)}
        />
      </Drawer>

      {/* ── MAIN CONTENT ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          // Push content down on mobile so it clears the hamburger button
          pt: { xs: 8, lg: 0 },
          px: { xs: 2, lg: 3 },
          pb: 3,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AgentLayout;