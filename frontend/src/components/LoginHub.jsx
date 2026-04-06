import React, { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Divider,
  Container,
  alpha,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  Person,
  Business,
  Group,
  MedicalServices,
  Science,
  LocalPharmacy,
  LocalHospital,
  DeliveryDining,
  AssignmentInd,
  Security,
  VerifiedUser,
  ArrowForward,
  Dashboard as DashboardIcon,
  AccountCircle,
  ViewList,
  TextFields,
  Palette,
  Map,
  Notifications,
  Lock,
  Login as LoginIcon,
  AdminPanelSettings,
  LocalShipping,
  HealthAndSafety,
  TwoWheeler,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

/* ===================== STYLES ===================== */

const DashboardLayout = styled(Box)(({ theme }) => ({
  display: "flex",
  minHeight: "100vh",
  backgroundColor: "#f8fafc",
}));

const Sidebar = styled(Paper)(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  borderRadius: 0,
  borderRight: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  background: theme.palette.primary.main, // Teal gradient
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
    "&.open": {
      transform: "translateX(0)",
    },
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  overflow: "hidden",
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(4),
  backgroundColor: "#f1f5f9",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const DashboardCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 25px rgba(14, 165, 233, 0.15)",
  },
}));

const CategoryItem = styled(ListItem)(({ theme, selected }) => ({
  borderRadius: 8,
  margin: theme.spacing(0.5, 1),
  backgroundColor: selected ? "rgba(255, 255, 255, 0.15)" : "transparent",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  "& .MuiListItemIcon-root": {
    minWidth: 40,
    color: selected ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
  },
  "& .MuiListItemText-primary": {
    fontWeight: selected ? 600 : 400,
    color: "#ffffff",
  },
  "& .MuiListItemText-secondary": {
    color: "rgba(255, 255, 255, 0.7)",
  },
}));

const Header = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderRadius: 0,
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const AccessPortalCard = styled(Card)(({ theme }) => ({
  height: "100%",
  minHeight: 200,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: "0 12px 30px rgba(14, 165, 233, 0.15)",
    borderColor: theme.palette.primary.light,
  },
}));

/* ===================== MAIN COMPONENT ===================== */

export default function LoginHub() {
  const [activeCategory, setActiveCategory] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const categories = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <DashboardIcon />,
    },
    {
      id: "user",
      title: "Customer Login",
      icon: <Person />,
      description: "Patients & Medical Professionals",
    },
    {
      id: "corporate",
      title: "Corporate Login",
      icon: <Business />,
      description: "Business & Manufacturing Partners",
    },
    {
      id: "staff",
      title: "Admin & Staff Login",
      icon: <Group />,
      description: "Internal Bioburg Access",
    },
  ];

  const portalOptions = {
    user: [
      {
        id: "patient",
        title: "Direct To Customer (D2C)",
        description: "Patients & Caregivers",
        icon: <Person />,
        to: "/userlogin",
        status: "active",
      },
      {
        id: "vendor",
        title: "Vendor Login",
        description: "Pharmacy Partners",
        icon: <LocalPharmacy />,
        to: "/login/vendor",
        status: "active",
      },
      {
        id: "doctor",
        title: "Doctor Login",
        description: "Medical Professionals",
        icon: <MedicalServices />,
        to: "/login/doctor",
        status: "active",
      },
      {
        id: "partner",
        title: "Partner Login",
        description: "Labs & Imaging Centers",
        icon: <MedicalServices />,
        to: "/partner/login",
        status: "active",
      },
    ],
    healthcare: [
      {
        id: "hospital-login",
        title: "Hospital Login",
        description: "Hospitals & Clinics",
        icon: <LocalHospital />,
        to: "/hospital/login",
        status: "active",
      },
      {
        id: "pharmacy-login",
        title: "Pharmacy Login",
        description: "Pharmacy & Drugstores",
        icon: <LocalPharmacy />,
        to: "/pharmacy/login",
        status: "active",
      },
    ],
    corporate: [
      {
        id: "manufacturer",
        title: "Pharma Manufacturer Login",
        description: "Approved manufacturing partner portal",
        icon: <Science />,
        to: "/login/manufacturer",
        status: "active",
      },
      {
        id: "bulk-manufacturing",
        title: "Bulk Manufacturing Login",
        description: "Contract Manufacturing Partners",
        icon: <Business />,
        to: "/bulk-manufacturing/login",
        status: "active",
      },
      {
        id: "franchise",
        title: "Franchise Login",
        description: "BioBurg Franchise Partners",
        icon: <AssignmentInd />,
        to: "/franchise/login",
        status: "active",
      },
      {
        id: "delivery",
        title: "Delivery Partner Login",
        description: "Logistics & Distribution",
        icon: <DeliveryDining />,
        to: "/delivery/login",
        status: "active",
      },
      {
        id: "corporate",
        title: "Corporate Official Login",
        description: "Business Management",
        icon: <AssignmentInd />,
        disabled: true,
      },
      {
        id: "hospital",
        title: "Hospital Login",
        description: "Hospitals & Clinics",
        icon: <LocalHospital />,
        to: "/hospital/login",
        status: "active",
      },
      {
        id: "pharmacy",
        title: "Pharmacy Login",
        description: "Pharmacy & Drugstores",
        icon: <LocalPharmacy />,
        to: "/pharmacy/login",
        status: "active",
      },
      {
        id: "supplier",
        title: "Supplier Login",
        description: "Raw Material Suppliers",
        icon: <LocalShipping />,
        disabled: true,
      },
    ],
    staff: [
      {
        id: "subadmin",
        title: "Sub-Admin Login",
        description: "Department Access",
        icon: <Group />,
        disabled: true,
      },
      {
        id: "admin",
        title: "Admin Login",
        description: "System Administration",
        icon: <AdminPanelSettings />,
        to: "/admin-login",
        status: "active",
      },
      {
        id: "superadmin",
        title: "Super-Admin Login",
        description: "Full System Control",
        icon: <Security />,
        disabled: true,
      },
      {
        id: "audit",
        title: "Audit Login",
        description: "Compliance & Audit",
        icon: <VerifiedUser />,
        disabled: true,
      },
      {
        id: "marketing-agent",
        title: "Marketing Agent Login",
        description: "Marketing Agent",
        icon: <VerifiedUser />,
        to: "/agent/login",
        status: "active",
      },
      {
        id: "delivery-agent",
        title: "Delivery Agent Login",
        description: "Delivery Agent",
        icon: <VerifiedUser />,
        to: "/delivery-agent/login",
        status: "active",
      },
      {
        id: "delivery-man",
        title: "Delivery Man Login",
        description: "Field Delivery Personnel",
        icon: <TwoWheeler />,
        to: "/delivery/login",
        status: "active",
      },
    ],
  };

  const renderContent = () => {
    switch (activeCategory) {
      case "dashboard":
        return (
          <Box>
            <Typography variant="h4" fontWeight={700} mb={3} color="primary">
              Access Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Welcome to Bioburg's centralized secure login system. Monitor all
              access points and system status.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6} lg={3}>
                <DashboardCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: alpha("#0d9488", 0.1),
                          color: "#0d9488",
                        }}
                      >
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">2,847</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Active Users
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      color="success.main"
                      fontWeight={600}
                    >
                      +12% this week
                    </Typography>
                  </CardContent>
                </DashboardCard>
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <DashboardCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: alpha("#059669", 0.1),
                          color: "#059669",
                        }}
                      >
                        <Business />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">156</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Corporate Logins
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      color="success.main"
                      fontWeight={600}
                    >
                      +5% this month
                    </Typography>
                  </CardContent>
                </DashboardCard>
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <DashboardCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: alpha("#dc2626", 0.1),
                          color: "#dc2626",
                        }}
                      >
                        <Security />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">3</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Failed Attempts
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      color="success.main"
                      fontWeight={600}
                    >
                      -2% from yesterday
                    </Typography>
                  </CardContent>
                </DashboardCard>
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <DashboardCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: alpha("#7c3aed", 0.1),
                          color: "#7c3aed",
                        }}
                      >
                        <VerifiedUser />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">99.9%</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Uptime
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      color="success.main"
                      fontWeight={600}
                    >
                      Stable for 30 days
                    </Typography>
                  </CardContent>
                </DashboardCard>
              </Grid>
            </Grid>
          </Box>
        );

      case "user":
      case "healthcare":
      case "corporate":
      case "staff":
        const category = categories.find((c) => c.id === activeCategory);
        const options = portalOptions[activeCategory] || [];

        return (
          <Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={4}
            >
              <Box>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {category?.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {category?.description || "Select your access portal"}
                </Typography>
              </Box>
              <Chip
                icon={<Security />}
                label="SSL Encrypted"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={3}>
              {options.map((option) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={option.id}>
                  <AccessPortalCard>
                    <CardContent
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        p: 3,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <Avatar
                          sx={{
                            bgcolor: alpha("#0d9488", 0.1),
                            color: "#0d9488",
                            width: 48,
                            height: 48,
                          }}
                        >
                          {option.icon}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600} gutterBottom>
                            {option.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </Box>

                      <Box mt="auto">
                        <Button
                          component={option.disabled ? "button" : Link}
                          to={option.disabled ? undefined : option.to}
                          disabled={option.disabled}
                          fullWidth
                          variant="contained"
                          startIcon={<LoginIcon />}
                          endIcon={!option.disabled ? <ArrowForward /> : null}
                          sx={{
                            py: 1.2,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            backgroundColor: option.disabled ? "#cbd5e1" : "#0d9488",
                            "&:hover": {
                              backgroundColor: option.disabled ? "#cbd5e1" : "#0f766e",
                            },
                          }}
                        >
                          {option.disabled ? "Coming Soon" : "Access Portal"}
                        </Button>
                      </Box>
                    </CardContent>
                  </AccessPortalCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      default:
        const currentCat = categories.find((c) => c.id === activeCategory);
        return (
          <Box>
            <Typography variant="h4" fontWeight={700} mb={3} color="primary">
              {currentCat?.title}
            </Typography>
            <Paper sx={{ p: 4, borderRadius: 2, backgroundColor: "#ffffff" }}>
              <Box textAlign="center" py={4}>
                <Lock sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" mb={1}>
                  Secure Access Required
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  maxWidth={400}
                  mx="auto"
                >
                  This section requires additional authentication. Please
                  contact your system administrator for access.
                </Typography>
              </Box>
            </Paper>
          </Box>
        );
    }
  };

  return (
    <DashboardLayout>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={sidebarOpen && isMobile}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 280,
            background: "linear-gradient(180deg, #0f766e 0%, #134e4a 100%)",
            color: "white",
          },
        }}
      >
        <SidebarContent
          categories={categories}
          activeCategory={activeCategory}
          onCategoryClick={(id) => {
            setActiveCategory(id);
            setSidebarOpen(false);
          }}
        />
      </Drawer>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar>
          <SidebarContent
            categories={categories}
            activeCategory={activeCategory}
            onCategoryClick={setActiveCategory}
          />
        </Sidebar>
      )}

      <MainContent>
        <Header elevation={0}>
          <Box display="flex" alignItems="center" gap={2}>
            {isMobile && (
              <IconButton
                onClick={() => setSidebarOpen(true)}
                sx={{ color: "#0d9488" }}
              >
                <LoginIcon />
              </IconButton>
            )}
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Bioburg Access Portal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Secure Login Gateway
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<VerifiedUser />}
              label="Enterprise Security"
              size="small"
              sx={{
                backgroundColor: alpha("#0d9488", 0.1),
                color: "#0d9488",
                fontWeight: 600,
              }}
            />
            <Avatar sx={{ width: 40, height: 40, bgcolor: "#0d9488" }}>
              <Lock />
            </Avatar>
          </Box>
        </Header>

        <ContentArea>{renderContent()}</ContentArea>

        <Box
          sx={{
            p: 2,
            textAlign: "center",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © 2024 Bioburg Pharma • All access is logged and monitored
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Need help? support@bioburgpharma.com
          </Typography>
        </Box>
      </MainContent>
    </DashboardLayout>
  );
}

/* ===================== SIDEBAR CONTENT ===================== */

function SidebarContent({ categories, activeCategory, onCategoryClick }) {
  return (
    <>
      {/* Sidebar Header */}
      <Box sx={{ p: 3, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            sx={{
              bgcolor: "#ffffff",
              color: "#0f766e",
              width: 40,
              height: 40,
              fontWeight: 700,
            }}
          >
            B
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              BIOBURG
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              Access Control
            </Typography>
          </Box>
        </Box>
        <Chip
          label="SECURE ZONE"
          size="small"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.7rem",
          }}
        />
      </Box>

      {/* Navigation List */}
      <List sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            button
            selected={activeCategory === category.id}
            onClick={() => onCategoryClick(category.id)}
          >
            <ListItemIcon>{category.icon}</ListItemIcon>
            <ListItemText
              primary={category.title}
              secondary={category.description}
            />
          </CategoryItem>
        ))}
      </List>
    </>
  );
}
