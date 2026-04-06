import { Box, Drawer } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import AgentSidebar from "../components/AgentSidebar";

const SIDEBAR_WIDTH = 240;

const AgentLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop */}
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <AgentSidebar darkMode={darkMode} />
      </Box>

      {/* Mobile */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: "block", lg: "none" } }}
      >
        <AgentSidebar mobile onClose={() => setMobileOpen(false)} />
      </Drawer>

      {/* Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          p: 3,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AgentLayout;
