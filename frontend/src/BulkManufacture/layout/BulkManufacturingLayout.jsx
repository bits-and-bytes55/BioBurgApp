import React, { useEffect, useMemo, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import { FranchiseConsoleStyles } from "../../Franchise/components/consoleUi";
import Sidebar, { BULK_DRAWER_WIDTH } from "./Sidebar";
import Topbar from "./Topbar";

const routeMeta = [
  {
    match: (pathname) => pathname === "/bulk-manufacturing/dashboard",
    title: "Partner Dashboard",
    subtitle: "Track application review, document status, and requirement momentum from one command center.",
  },
  {
    match: (pathname) => pathname === "/bulk-manufacturing/products",
    title: "Product Management",
    subtitle: "Publish your own catalog to the website using the same product engine and section mapping used across the platform.",
  },
  {
    match: (pathname) => pathname === "/bulk-manufacturing/orders",
    title: "Orders & Leads",
    subtitle: "Track and operate website orders that belong to your bulk-manufacturing-owned product catalog.",
  },
  {
    match: (pathname) => pathname === "/bulk-manufacturing/requirements",
    title: "Requirement Desk",
    subtitle: "Create, revise, and follow manufacturing requirements with quote readiness and admin feedback.",
  },
  {
    match: (pathname) => pathname === "/bulk-manufacturing/documents",
    title: "Documents & Compliance",
    subtitle: "Review uploaded KYC and compliance documents along with verification notes from the admin team.",
  },
  {
    match: (pathname) => pathname === "/bulk-manufacturing/profile",
    title: "Profile & Company Details",
    subtitle: "Keep contact, company, and portal details updated for faster coordination and quoting.",
  },
];

export default function BulkManufacturingLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  const meta = useMemo(
    () =>
      routeMeta.find((item) => item.match(location.pathname)) || {
        title: "Bulk Manufacturing Portal",
        subtitle: "A cleaner premium desk for contract manufacturing partners.",
      },
    [location.pathname],
  );

  return (
    <Box
      className="franchise-console-root"
      sx={{
  position: "relative",
  display: "flex",
  minHeight: "100vh",
  bgcolor: "#f4f6f8",
  color: "#1a2530",
  overflow: "hidden",
  background: "linear-gradient(180deg, #f4f6f8 0%, #eef1f4 100%)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 9% 10%, rgba(215,178,109,0.07), transparent 24%), radial-gradient(circle at 88% 8%, rgba(122,180,255,0.06), transparent 18%)",
    pointerEvents: "none",
  },
  "&::after": { display: "none" },
}}
    >
      <FranchiseConsoleStyles />

      <Box sx={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
        <Sidebar
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <Box
          sx={{
            flexGrow: 1,
            width: {
              xs: "100%",
              md: `calc(100% - ${BULK_DRAWER_WIDTH}px)`,
            },
          }}
        >
          <Topbar
            onMenuClick={() => setMobileOpen(true)}
            showMenuButton={isMobile}
            pageTitle={meta.title}
            pageSubtitle={meta.subtitle}
          />

          <Box
            sx={{
              px: { xs: 2, md: 3.5 },
              pb: { xs: 4, md: 6 },
              pt: { xs: 2.5, md: 3.5 },
              maxWidth: 1700,
              mx: "auto",
              width: "100%",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
