import React, { useEffect, useMemo, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar, { FRANCHISE_DRAWER_WIDTH } from "./Sidebar";
import Topbar from "./Topbar";
import { FranchiseConsoleStyles } from "../components/consoleUi";

const routeMeta = [
  {
    match: (pathname) => pathname === "/franchise/dashboard",
    title: "Operations Dashboard",
    subtitle: "A premium control room for orders, stock alerts, payouts, and support pressure.",
  },
  {
    match: (pathname) => pathname === "/franchise/orders",
    title: "Orders & Fulfilment",
    subtitle: "Monitor delivery flow, invoice readiness, and customer order movement in one place.",
  },
  {
    match: (pathname) => pathname === "/franchise/products",
    title: "Product Management",
    subtitle: "Control franchise-owned catalog visibility, section mapping, and product readiness.",
  },
  {
    match: (pathname) => pathname.startsWith("/franchise/orders/"),
    title: "Order Details",
    subtitle: "Review customer, payment, fulfilment, and invoice actions with a clean operational view.",
  },
  {
    match: (pathname) => pathname === "/franchise/reports",
    title: "Sales & Reports",
    subtitle: "Read the revenue ledger, sales mix, and current period performance with clarity.",
  },
  {
    match: (pathname) => pathname === "/franchise/payments",
    title: "Payments & Settlement",
    subtitle: "Track eligible payouts, hold-period impact, and commission breakdown with confidence.",
  },
  {
    match: (pathname) => pathname === "/franchise/inventory",
    title: "Inventory Control",
    subtitle: "Stay ahead of low-stock pressure and manage restock workflow with a cleaner workspace.",
  },
  {
    match: (pathname) => pathname === "/franchise/support",
    title: "Support Workspace",
    subtitle: "Follow ticket activity, admin replies, and issue resolution without losing operational context.",
  },
  {
    match: (pathname) => pathname === "/franchise/support/create",
    title: "New Support Ticket",
    subtitle: "Raise a structured issue for admin review and attach the right order context when needed.",
  },
  {
    match: (pathname) => pathname.startsWith("/franchise/support/"),
    title: "Support Details",
    subtitle: "Review the full conversation timeline and send a clean operational update.",
  },
  {
    match: (pathname) => pathname === "/franchise/profile",
    title: "Profile & Settings",
    subtitle: "Manage identity, business profile, KYC, and security preferences in one premium desk.",
  },
];

export default function FranchiseLayout() {
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
        title: "Franchise Console",
        subtitle: "Manage daily franchise operations in a cleaner premium workspace.",
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
        bgcolor: "#f5f7fa",
        color: "#111827",
        overflow: "hidden",

        /* Clean light base — warm white to cool grey */
        background: "linear-gradient(160deg, #ffffff 0%, #f3f6fb 50%, #edf1f7 100%)",

        /* Very soft ambient tints — decorative, never distracting */
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(ellipse 40% 30% at 2% 0%,   rgba(234,179,8,0.07)   0%, transparent 100%)",
            "radial-gradient(ellipse 30% 22% at 98% 0%,  rgba(59,130,246,0.06)  0%, transparent 100%)",
            "radial-gradient(ellipse 26% 20% at 80% 96%, rgba(16,185,129,0.05)  0%, transparent 100%)",
          ].join(", "),
          pointerEvents: "none",
          zIndex: 0,
        },

        /* Ultra-faint dot grid — fades toward the bottom */
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.08) 40%, transparent 80%)",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.08) 40%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <FranchiseConsoleStyles />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          width: "100%",

          /* Thin top accent bar — amber to blue */
          "&::before": {
            content: '""',
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(234,179,8,0.0) 5%, rgba(234,179,8,0.9) 28%, rgba(234,179,8,1) 50%, rgba(59,130,246,0.7) 78%, transparent 100%)",
            zIndex: 9999,
            pointerEvents: "none",
          },
        }}
      >
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
              md: `calc(100% - ${FRANCHISE_DRAWER_WIDTH}px)`,
            },

            /* Clean border between sidebar and content */
            borderLeft: {
              xs: "none",
              md: "1px solid rgba(0,0,0,0.08)",
            },

            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",

            /* Very subtle inset shadow from left edge */
            boxShadow: {
              xs: "none",
              md: "inset 2px 0 12px rgba(0,0,0,0.03)",
            },
          }}
        >
          <Topbar
            onMenuClick={() => setMobileOpen(true)}
            showMenuButton={isMobile}
            pageTitle={meta.title}
            pageSubtitle={meta.subtitle}
          />

          {/* Topbar bottom divider */}
          <Box
            sx={{
              height: "1px",
              mx: { xs: 2, md: 3.5 },
              background:
                "linear-gradient(90deg, transparent, rgba(234,179,8,0.35) 20%, rgba(0,0,0,0.08) 65%, transparent)",
            }}
          />

          <Box
            sx={{
              px: { xs: 2, md: 3.5 },
              pb: { xs: 4, md: 6 },
              pt: { xs: 2.5, md: 3.5 },
              maxWidth: 1700,
              mx: "auto",
              width: "100%",
              flexGrow: 1,
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}