import React, { useState } from "react";
import {
  Box, Button, Paper, Typography, Card, CardContent,
  Grid, Chip, Avatar, Divider, alpha, IconButton,
  Collapse, List, ListItem, ListItemIcon, ListItemText,
  Drawer, useTheme, useMediaQuery,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  Person, Business, Group, MedicalServices, Science,
  LocalPharmacy, LocalHospital, DeliveryDining, AssignmentInd,
  Security, VerifiedUser, ArrowForward, Dashboard as DashboardIcon,
  Lock, Login as LoginIcon, AdminPanelSettings, LocalShipping,
  HealthAndSafety, TwoWheeler, Work,
  ExpandMore, ExpandLess, Menu as MenuIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

/* ─── STYLES ─── */
const DashboardLayout = styled(Box)(({ theme }) => ({
  display: "flex",
  minHeight: "100vh",
  backgroundColor: theme.palette.primary.main,
}));

const Sidebar = styled(Paper)(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  borderRadius: 0,
  borderRight: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  background: theme.palette.primary.main,
  color: "white",
  position: "sticky",
  top: 0,
  height: "100vh",
  overflowY: "auto",
  [theme.breakpoints.down("md")]: {
    position: "fixed",
    zIndex: 1200,
    transform: "translateX(-100%)",
    transition: "transform 0.3s ease",
    "&.open": { transform: "translateX(0)" },
  },
}));

const MainContent = styled(Box)(() => ({
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  overflow: "hidden",
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1, overflowY: "auto", padding: theme.spacing(4), backgroundColor: "#f1f5f9",
  [theme.breakpoints.down("sm")]: { padding: theme.spacing(2) },
}));

const DashboardCard = styled(Card)({
  height: "100%", borderRadius: 12, border: "1px solid #e2e8f0", background: "#ffffff",
  transition: "all 0.3s ease",
  "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 25px rgba(14,165,233,0.15)" },
});

const NavItem = styled(ListItem, { shouldForwardProp: p => p !== "sel" })(({ sel }) => ({
  borderRadius: 8, margin: "4px 8px",
  backgroundColor: sel ? "rgba(255,255,255,0.18)" : "transparent",
  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
  "& .MuiListItemIcon-root": { minWidth: 44, color: sel ? "#fff" : "rgba(255,255,255,0.7)" },
  "& .MuiListItemText-primary": { fontWeight: sel ? 700 : 500, color: "#fff", fontSize: 15 },
  "& .MuiListItemText-secondary": { color: "rgba(255,255,255,0.65)", fontSize: 12 },
}));

const SubItem = styled(ListItem)(({ theme }) => ({
  paddingLeft: theme.spacing(5), borderRadius: 6, margin: "1px 8px",
  "&:hover": { backgroundColor: "rgba(255,255,255,0.07)" },
  "& .MuiListItemText-primary": { fontSize: "0.9rem", color: "rgba(255,255,255,0.9)" },
}));

const TopBar = styled(Paper)({
  padding: "14px 24px", borderRadius: 0, borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between",
});

const PortalCard = styled(Card)(({ theme }) => ({
  height: "100%", minHeight: 200, borderRadius: 12, border: "1px solid #e2e8f0",
  background: "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)",
  transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: "0 12px 30px rgba(14,165,233,0.15)",
    borderColor: theme.palette.primary.light,
  },
}));

/* ─── DATA ─── */
const SECTIONS = [
  { id: "dashboard", title: "Dashboard", icon: <DashboardIcon />, items: [] },

  {
    id: "user", title: "Customer Login", icon: <Person />,
    description: "Patients & Caregivers",
    items: [
      { id: "d2c",    title: "Direct To Customer (D2C)", description: "Patients & Caregivers",   icon: <Person />,          to: "/userlogin" },
    ],
  },

  {
    id: "b2b", title: "Business To Business (B2B)", icon: <Business />,
    description: "Pharmacy, Hospital, Wholesale Partners",
    items: [
      { id: "bulk",     title: "Bulk Manufacturing Login",   description: "Contract Mfr Partners",      icon: <Business />,      to: "/bulk-manufacturing/login" },
      { id: "vendor",   title: "Vendor Login",               description: "Pharmacy Partners",           icon: <LocalPharmacy />, to: "/login/vendor" },
      { id: "franchise",title: "Franchise Login",            description: "BioBurg Franchise Partners",  icon: <AssignmentInd />, to: "/franchise/login" },
      { id: "hospital", title: "Hospital Login",             description: "Hospitals & Clinics",         icon: <LocalHospital />, to: "/hospital/login" },
      { id: "pharmacy", title: "Pharmacy Login",             description: "Pharmacy & Drugstores",       icon: <LocalPharmacy />, to: "/pharmacy/login" },
      { id: "cf",       title: "Bioburg C & F",              description: "Coming Soon",                 icon: <Work />,          disabled: true },
      { id: "jewelers", title: "Bioburg Jewelers",           description: "Coming Soon",                 icon: <Work />,          disabled: true },
      { id: "aboard",   title: "Bioburg Aboard India C&F",   description: "Coming Soon",                 icon: <Work />,          disabled: true },
    ],
  },

  {
    id: "bsp", title: "Business Sponsor Partners", icon: <MedicalServices />,
    description: "Doctors, Pharma Manufacturers",
    items: [
      { id: "doctor",        title: "Doctor Login",               description: "Medical Professionals",          icon: <MedicalServices />, to: "/login/doctor" },
      { id: "partner",       title: "Partner Login",              description: "Labs & Imaging Centers",         icon: <MedicalServices />, to: "/partner/login" },
      { id: "manufacturer",  title: "Pharma Manufacturer Login",  description: "Manufacturing partner portal",   icon: <Science />,         to: "/login/manufacturer" },
      { id: "pharma-sponsor",title: "Pharma Sponsor's",           description: "Coming Soon",                    icon: <Science />,         disabled: true },
      { id: "homeopath",     title: "Homeopath Manufacturer's",   description: "Coming Soon",                    icon: <Science />,         disabled: true },
    ],
  },
  {
    id: "corporate", title: "Corporate Login", icon: <Business />,
    description: "Marketing, Delivery, WAO, WAH",
    items: [
      { id: "marketing",   title: "Marketing Agent Login",     description: "Marketing Agent",            icon: <VerifiedUser />,    to: "/agent/login" },
      { id: "delivery",    title: "Delivery Man Login",        description: "Logistics & Distribution",   icon: <TwoWheeler />,      to: "/delivery/login" },
    ],
  },

  {
    id: "staff", title: "SA - Admin", icon: <Group />,
    description: "Admin, Auditors & Internal Staff",
    items: [
      { id: "admin",      title: "Admin Login",               description: "System Administration",     icon: <AdminPanelSettings />, to: "/admin-login" },
    ],
  },
];

/* ─── MAIN ─── */
export default function LoginHub() {
  const [active,  setActive]  = useState("dashboard");
  const [open,    setOpen]    = useState({ user: false, b2b: false, bsp: false, jobs: false, corporate: false, staff: false });
  const [drawer,  setDrawer]  = useState(false);
  const theme  = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleNav = (id) => {
    if (id !== "dashboard") setOpen(p => ({ ...p, [id]: !p[id] }));
    setActive(id);
    if (mobile) setDrawer(false);
  };

  /* ── render ── */
  const renderContent = () => {
    const sec = SECTIONS.find(s => s.id === active);

    if (active === "dashboard") {
      return (
        <Box>
          <Typography variant="h4" fontWeight={700} mb={1} color="primary">Access Dashboard</Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Welcome to Bioburg's centralized secure login system.
          </Typography>
          <Grid container spacing={3}>
            {[
              { label: "Active Users",    value: "2,847", color: "#0d9488", icon: <Person /> },
              { label: "Corporate Logins",value: "156",   color: "#059669", icon: <Business /> },
              { label: "Failed Attempts", value: "3",     color: "#dc2626", icon: <Security /> },
              { label: "Uptime",          value: "99.9%", color: "#7c3aed", icon: <VerifiedUser /> },
            ].map(s => (
              <Grid item xs={12} md={6} lg={3} key={s.label}>
                <DashboardCard><CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Avatar sx={{ bgcolor: alpha(s.color, 0.1), color: s.color }}>{s.icon}</Avatar>
                    <Box>
                      <Typography variant="h6">{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Box>
                </CardContent></DashboardCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    }

    if (!sec) return null;

    return (
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary">{sec.title}</Typography>
            <Typography variant="body1" color="text.secondary">{sec.description || "Select your access portal"}</Typography>
          </Box>
          <Chip icon={<Security />} label="SSL Encrypted" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
        </Box>
        <Divider sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          {sec.items.map(item => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <PortalCard>
                <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", p: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar sx={{
                      bgcolor: item.disabled ? "#f3f4f6" : alpha("#0d9488", 0.1),
                      color:   item.disabled ? "#9ca3af" : "#0d9488",
                      width: 48, height: 48,
                    }}>
                      {item.icon}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                    </Box>
                  </Box>
                  <Box mt="auto">
                    <Button
                      component={item.disabled ? "button" : Link}
                      to={item.disabled ? undefined : item.to}
                      disabled={item.disabled}
                      fullWidth variant="contained"
                      startIcon={<LoginIcon />}
                      endIcon={!item.disabled ? <ArrowForward /> : null}
                      sx={{
                        py: 1.2, borderRadius: 2, textTransform: "none", fontWeight: 600, boxShadow: "none",
                        backgroundColor: item.disabled ? "#cbd5e1" : "#0d9488",
                        color: item.disabled ? "#64748b" : "#fff",
                        "&:hover": { backgroundColor: item.disabled ? "#cbd5e1" : "#0f766e" },
                      }}
                    >
                      {item.disabled ? "Coming Soon" : "Access Portal"}
                    </Button>
                  </Box>
                </CardContent>
              </PortalCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  /* ── sidebar ── */
  const SidebarContent = () => (
    <>
      <Box sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <Box display="flex" alignItems="center" gap={2} mb={1.5}>
          <Avatar sx={{ bgcolor: "#fff", color: "#0f766e", fontWeight: 700 }}>B</Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>BIOBURG</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>Access Control</Typography>
          </Box>
        </Box>
        <Chip label="SECURE ZONE" size="small"
          sx={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 600, fontSize: "0.7rem" }}
        />
      </Box>

      <List sx={{ flex: 1, py: 1 }}>
        {SECTIONS.map(sec => (
          <React.Fragment key={sec.id}>
            <NavItem button sel={active === sec.id ? 1 : 0} onClick={() => handleNav(sec.id)}>
              <ListItemIcon>{sec.icon}</ListItemIcon>
              <ListItemText
                primary={sec.title}
                secondary={sec.items.length > 0 ? `${sec.items.length} options` : ""}
              />
              {sec.items.length > 0 && (open[sec.id] ? <ExpandLess /> : <ExpandMore />)}
            </NavItem>

            {sec.items.length > 0 && (
              <Collapse in={open[sec.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {sec.items.map(item => (
                    <SubItem key={item.id} button
                      component={item.disabled ? "div" : Link}
                      to={item.disabled ? undefined : item.to}
                    >
                      <ListItemText primary={item.title}
                        primaryTypographyProps={{
                          style: { color: item.disabled ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.9)" }
                        }}
                      />
                    </SubItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </>
  );

  return (
    <DashboardLayout>
      {mobile && (
        <Drawer variant="temporary" open={drawer} onClose={() => setDrawer(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { width: 280, background: "#0f766e", color: "#fff" } }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {!mobile && <Sidebar><SidebarContent /></Sidebar>}

      <MainContent>
        <TopBar elevation={0}>
          <Box display="flex" alignItems="center" gap={2}>
            {mobile && <IconButton onClick={() => setDrawer(true)} sx={{ color: "#0d9488" }}><MenuIcon /></IconButton>}
            <Box>
              <Typography variant="h6" fontWeight={700}>Bioburg Access Portal</Typography>
              <Typography variant="caption" color="text.secondary">Secure Login Gateway</Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip icon={<VerifiedUser />} label="Enterprise Security" size="small"
              sx={{ backgroundColor: alpha("#0d9488", 0.1), color: "#0d9488", fontWeight: 600 }}
            />
            <Avatar sx={{ width: 40, height: 40, bgcolor: "#0d9488" }}><Lock /></Avatar>
          </Box>
        </TopBar>

        <ContentArea>{renderContent()}</ContentArea>

        <Box sx={{ p: 2, borderTop: "1px solid #e2e8f0", backgroundColor: "#fff", display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">© 2024 Bioburg Pharma • All access is logged and monitored</Typography>
          <Typography variant="caption" color="text.secondary">Need help? support@bioburgpharma.com</Typography>
        </Box>
      </MainContent>
    </DashboardLayout>
  );
}