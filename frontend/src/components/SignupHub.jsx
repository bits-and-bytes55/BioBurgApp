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
  Collapse,
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
  AssignmentInd,
  VerifiedUser,
  ArrowForward,
  Security,
  LocalHospital,
  Biotech,
  Work,
  Dashboard as DashboardIcon,
  AccountCircle,
  ViewList,
  TextFields,
  Palette,
  Map,
  Notifications,
  ExpandMore,
  ExpandLess,
  Menu as MenuIcon,
  ChevronLeft,
  TwoWheeler,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

/* ===================== STYLES ===================== */

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
    "&.open": {
      transform: "translateX(0)",
    },
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
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(4),
  backgroundColor: "#f1f5f9",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const DashboardCard = styled(Card)(() => ({
  height: "100%",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 25px rgba(0, 115, 170, 0.15)",
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

const SubCategoryItem = styled(ListItem)(({ theme }) => ({
  paddingLeft: theme.spacing(4),
  borderRadius: 6,
  margin: theme.spacing(0.25, 1),
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  "& .MuiListItemText-primary": {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.9)",
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

/* ===================== MAIN COMPONENT ===================== */

export default function SignupHub() {
  const [activeCategory, setActiveCategory] = useState("dashboard");
  const [expandedCategories, setExpandedCategories] = useState({
  user: true, b2b: false, bsp: false, jobs: false, corporate: false, staff: false,
});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const categories = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <DashboardIcon />,
      items: [],
    },
    {
      id: "user",
      title: "Register With Us",
      icon: <Person />,
      items: [
        {
          id: "user-register",
          title: "(D2C) User Register",
          description: "Patients & Caregivers",
          icon: <Person />,
          to: "/userregister",
        },
      ]
    },
    {
      id: "b2b",
      title: "Business To Business (B2B)",
      icon: <Person />,
      items: [
        {
          id: "bulk",
          title: "Bulk Manufacturing",
          description: "Contract Manufacturing",
          icon: <Business />,
          to: "/register/bulk-manufacturing",
        },
        {
          id: "hospital",
          title: "Hospital Registration",
          description: "Hospitals & Clinics",
          icon: <LocalHospital />,
          to: "/register/hospital",
        },
        {
          id: "pharmacy",
          title: "Pharmacy Registration",
          description: "Pharmacy & Drugstores",
          icon: <LocalPharmacy />,
          to: "/register/pharmacy",
        },
        {
          id: "franchise",
          title: "Bioburg Franchise",
          description: "Franchise Partner",
          icon: <AssignmentInd />,
          to: "/franchise-application",
        },
        {
          id: "vendor",
          title: "Bioburg Vendors",
          description: "Pharmacy & Distribution",
          icon: <LocalPharmacy />,
          to: "/register/vendor",
        },
        {
          id: "cf",
          title: "Bioburg C & F",
          description: "Coming Soon",
          icon: <Work />,
          disabled: true,
        },
        {
          id: "jewelers",
          title: "Bioburg Jeweler's",
          description: "Coming Soon",
          icon: <Work />,
          disabled: true,
        },
        {
          id: "insurance",
          title: "Insurance Partner's",
          description: "Coming Soon",
          icon: <Work />,
          disabled: true,
        },
        {
          id: "aboard",
          title: "Aboard India C & F",
          description: "Coming Soon",
          icon: <Work />,
          disabled: true,
        },
      ],
    },

    {
      id: "bsp",
      title: "Business Sponsor Partners",
      icon: <MedicalServices />,
      items: [
        {
          id: "doctor-consultation",
          title: "Online Dr. Consultation",
          description: "Doctors & Practitioners",
          icon: <MedicalServices />,
          to: "/register/doctor",
        },
        {
          id: "manufacturer",
          title: "Pharma Manufacturer Registration",
          description: "Production units and formulation partners",
          icon: <Science />,
          to: "/register/pharma-manufacturer",
        },
        {
          id: "radiology-corporate",
          title: "Bioburg Partner Registration",
          description: "Diagnostic Center Registration",
          icon: <Biotech />,
          to: "/register/radiology-diagnostics",
        },
        {
          id: "sponsor",
          title: "Sponsor Pharma Brand",
          description: "Coming Soon",
          icon: <Work />,
          disabled: true,
        },
      ]
    },

    {
      id: "jobs",
      title: "Jobs And Careers",
      icon: <Work />,
      items: [
        {
          id: "jobs",
          title: "Jobs and Careers",
          description: "Apply for a position",
          icon: <Work />,
          to: "/register/jobs-careers",
        },
        {
          id: "ex-servicemen",
          title: "Jobs Ex-Servicemen",
          description: "Veterans recruitment portal",
          icon: <Work />,
          to: "/register/exservice",
        },
      ]
    },
    {
      id: "corporate",
      title: "Corporate Registration",
      icon: <Business />,
      items: [
        {
          id: "marketing-agent",
          title: "Marketing Official's",
          description: "Marketing Agent Register",
          icon: <Work />,
          to: "/agent/register",
        },
        {
          id: "delivery-man",
          title: "Delivery Man Register",
          description: "Field Delivery Personnel",
          icon: <TwoWheeler />,
          to: "/delivery/signup",
        },
      ],
    },
  ];

  const handleCategoryClick = (categoryId) => {
  if (categoryId === "dashboard") {
    setActiveCategory(categoryId);
  } else {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
    setActiveCategory(categoryId);
  }
  if (isMobile) setSidebarOpen(false);
};
 

  const renderContent = () => {
    const category = categories.find((c) => c.id === activeCategory);
    if (!category) return null;

    switch (activeCategory) {
      case "dashboard":
        return (
          <Box>
            <Typography variant="h4" fontWeight={700} mb={3}>
              Dashboard Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6} lg={3}>
                <DashboardCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: alpha("#0077a3", 0.1),
                          color: "#0077a3",
                        }}
                      >
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">1,234</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Users
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </DashboardCard>
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <DashboardCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: alpha("#10b981", 0.1),
                          color: "#10b981",
                        }}
                      >
                        <Business />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">456</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Corporate Accounts
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </DashboardCard>
              </Grid>
            </Grid>
          </Box>
        );

      case "user": case "b2b": case "bsp": case "jobs": case "corporate": case "staff":
        return (
          <Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={4}
            >
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {category.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Choose from the available registration options
                </Typography>
              </Box>
              <Chip
                icon={<Security />}
                label="Secure Registration"
                color="primary"
                variant="outlined"
              />
            </Box>

            <Grid container spacing={3}>
              {category.items.map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <DashboardCard>
                    <CardContent
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <Avatar
                          sx={{
                            bgcolor: item.disabled
                              ? "#e5e7eb"
                              : alpha("#0077a3", 0.1),
                            color: item.disabled ? "#9ca3af" : "#0077a3",
                            width: 48,
                            height: 48,
                          }}
                        >
                          {item.icon}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600}>{item.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Box>
                      </Box>

                      <Box mt="auto">
                        <Button
                          component={item.disabled ? "button" : Link}
                          to={item.disabled ? undefined : item.to}
                          disabled={item.disabled}
                          fullWidth
                          variant="contained"
                          endIcon={!item.disabled && <ArrowForward />}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            backgroundColor: item.disabled
                              ? "#e5e7eb"
                              : "#0077a3",
                            "&:hover": {
                              backgroundColor: item.disabled
                                ? "#e5e7eb"
                                : "#005f8a",
                            },
                          }}
                        >
                          {item.disabled ? "Coming Soon" : "Register Now"}
                        </Button>
                      </Box>
                    </CardContent>
                  </DashboardCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      default:
        return (
          <Box>
            <Typography variant="h4" fontWeight={700} mb={3}>
              {category.title}
            </Typography>
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                This section is under development
              </Typography>
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
            background: "linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)",
            color: "white",
          },
        }}
      >
        <SidebarContent
          categories={categories}
          activeCategory={activeCategory}
          expandedCategories={expandedCategories}
          onCategoryClick={handleCategoryClick}
          onClose={() => setSidebarOpen(false)}
        />
      </Drawer>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar>
          <SidebarContent
            categories={categories}
            activeCategory={activeCategory}
            expandedCategories={expandedCategories}
            onCategoryClick={handleCategoryClick}
          />
        </Sidebar>
      )}

      <MainContent>
        <Header elevation={0}>
          <Box display="flex" alignItems="center" gap={2}>
            {isMobile && (
              <IconButton onClick={() => setSidebarOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Bioburg Registration Hub
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Secure Registration Portal
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<VerifiedUser />}
              label="Secure Portal"
              size="small"
              sx={{ backgroundColor: alpha("#0077a3", 0.1) }}
            />
            <Avatar sx={{ width: 40, height: 40, bgcolor: "#0077a3" }}>
              <Person />
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
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © 2024 Bioburg Pharma • support@bioburgpharma.com
          </Typography>
        </Box>
      </MainContent>
    </DashboardLayout>
  );
}

/* ===================== SIDEBAR CONTENT ===================== */

function SidebarContent({
  categories,
  activeCategory,
  expandedCategories,
  onCategoryClick,
  onClose,
}) {
  return (
    <>
      {/* Sidebar Header */}
      <Box sx={{ p: 3, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            sx={{ bgcolor: "#ffffff", color: "#1e40af", width: 40, height: 40 }}
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
              Pharma Solutions
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation List */}
      <List sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {categories.map((category) => (
          <React.Fragment key={category.id}>
            <CategoryItem
              button
              selected={activeCategory === category.id}
              onClick={() => onCategoryClick(category.id)}
            >
              <ListItemIcon>{category.icon}</ListItemIcon>
              <ListItemText
                primary={category.title}
                secondary={
                  category.items.length > 0
                    ? `${category.items.length} options`
                    : ""
                }
              />
              {category.items.length > 0 &&
                (expandedCategories[category.id] ? (
                  <ExpandLess />
                ) : (
                  <ExpandMore />
                ))}
            </CategoryItem>

            {category.items.length > 0 && (
              <Collapse
                in={expandedCategories[category.id]}
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {category.items.map((item) => (
                    <SubCategoryItem
                      key={item.id}
                      button
                      component={item.disabled ? "div" : Link}
                      to={item.disabled ? undefined : item.to}
                      selected={activeCategory === item.id}
                      onClick={() => {
                        if (item.disabled) {
                          onCategoryClick(item.id);
                          return;
                        }

                        if (onClose) {
                          onClose();
                        }
                      }}
                    >
                      <ListItemText primary={item.title} />
                    </SubCategoryItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </>
  );
}
