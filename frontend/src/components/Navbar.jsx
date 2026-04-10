import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Container,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  ListItemButton,
  ListItemText,
  Avatar,
  Chip,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link, useNavigate } from "react-router-dom";

import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import LoginIcon from "@mui/icons-material/Login";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import { logout as authLogout } from "../../utils/auth";
/*  STYLES  */

const PrimaryNav = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: "#fff",
  boxShadow: "none",
}));

const LogoBox = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  textDecoration: "none",
  color: "inherit",
});

const SiteTitle = styled(Typography)({
  fontWeight: "bold",
  fontSize: "1.3rem",
});

const DeliveryButton = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginLeft: theme.spacing(3),
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
}));

const NavActions = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "10px",
});

const NavLinkButton = styled(Button)({
  color: "#fff",
  textTransform: "none",
  fontWeight: 500,
});

const SignUpButton = styled(Button)({
  color: "#fff",
  textTransform: "none",
  fontWeight: 500,
  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
});

/*  HELPER — read vendor / user from localStorage  */
function readVendorSession() {
  const token = localStorage.getItem("vendorToken");
  const raw = localStorage.getItem("vendorUser");
  if (!token || !raw) return null;
  try {
    const u = JSON.parse(raw);
    return {
      token,
      name: u?.businessName || u?.contactPerson || u?.name || "Vendor",
      email: u?.email || "",
      initials: (u?.businessName || u?.contactPerson || u?.name || "V")
        .slice(0, 2)
        .toUpperCase(),
    };
  } catch {
    return null;
  }
}

function readUserSession() {
  const token = localStorage.getItem("userToken");
  const raw = localStorage.getItem("user");
  if (!token || !raw) return null;
  try {
    const u = JSON.parse(raw);
    return {
      token,
      name: u?.name || u?.fullName || "User",
      email: u?.email || "",
      initials: (u?.name || u?.fullName || "U").slice(0, 2).toUpperCase(),
    };
  } catch {
    return null;
  }
}

/*  COMPONENT  */

export default function Navbar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* session state */
  const [vendor, setVendor] = useState(null);
  const [user, setUser] = useState(null);

  // Re-read on mount + on storage events (cross-tab) + poll briefly
  const refreshSessions = () => {
    setVendor(readVendorSession());
    setUser(readUserSession());
  };

  useEffect(() => {
    refreshSessions();
    window.addEventListener("storage", refreshSessions);

    // poll for 3 s after mount so banner appears immediately after login
    let tries = 0;
    const id = setInterval(() => {
      refreshSessions();
      if (++tries >= 6) clearInterval(id);
    }, 500);

    return () => {
      window.removeEventListener("storage", refreshSessions);
      clearInterval(id);
    };
  }, []);

  /* menus */
  const [signupAnchorEl, setSignupAnchorEl] = useState(null);
  const [loginAnchorEl, setLoginAnchorEl] = useState(null);
  const [coLoginAnchorEl, setCoLoginAnchorEl] = useState(null);
  const [registerWithUsEl, setRegisterWithUsEl] = useState(null);
  const [vendorMenuEl, setVendorMenuEl] = useState(null);
  const [userMenuEl, setUserMenuEl] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeAll = () => {
  setSignupAnchorEl(null);
  setLoginAnchorEl(null);
};

  /* vendor logout */
  const handleVendorLogout = () => {
    authLogout();
    setVendorMenuEl(null);
    setVendor(null);
    setUser(null);
    navigate("/");
  };

  /* user logout */
  const handleUserLogout = () => {
    authLogout();
    setUserMenuEl(null);
    setUser(null);
    navigate("/");
  };

  /*  RENDER  */
  return (
    <>
      <PrimaryNav position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {isMobile ? (
              <>
                <IconButton
                  color="inherit"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  <MenuIcon />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/"
                  color="inherit"
                  sx={{
                    flexGrow: 1,
                    borderRadius: 0,
                    justifyContent: "flex-start",
                  }}
                >
                  <HealthAndSafetyOutlinedIcon />
                </IconButton>
              </>
            ) : (
              <>
                <LogoBox component={Link} to="/">
                  <HealthAndSafetyOutlinedIcon />
                  <SiteTitle>BioBurg</SiteTitle>
                </LogoBox>

                <DeliveryButton>
                  <LocationOnOutlinedIcon />
                  <Typography fontWeight="bold">Selected Pin Code</Typography>
                  <NorthEastIcon fontSize="small" />
                </DeliveryButton>

                <Box sx={{ flexGrow: 1 }} />
              </>
            )}

            {/* ── ACTION BUTTONS ── */}
            <NavActions>
              {/* ── VENDOR ACCOUNT CHIP (replaces Login/SignUp when vendor is active) ── */}
              {vendor ? (
                <>
                  <Tooltip
                    title={`${vendor.name}${vendor.email ? " · " + vendor.email : ""}`}
                  >
                    <Chip
                      avatar={
                        <Avatar
                          sx={{
                            bgcolor: "#7c3aed",
                            color: "#fff !important",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {vendor.initials}
                        </Avatar>
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <StorefrontIcon sx={{ fontSize: 13 }} />
                          <span
                            style={{
                              maxWidth: 110,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {vendor.name}
                          </span>
                          <ArrowDropDownIcon sx={{ fontSize: 16 }} />
                        </Box>
                      }
                      onClick={(e) => setVendorMenuEl(e.currentTarget)}
                      sx={{
                        bgcolor: "rgba(124,58,237,0.20)",
                        border: "1px solid rgba(167,139,250,0.50)",
                        color: "#e9d5ff",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                        height: 34,
                        "&:hover": { bgcolor: "rgba(124,58,237,0.32)" },
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  </Tooltip>

                  {/* Vendor account menu */}
                  <Menu
                    anchorEl={vendorMenuEl}
                    open={Boolean(vendorMenuEl)}
                    onClose={() => setVendorMenuEl(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    sx={{ mt: 1, zIndex: 9999 }}
                    PaperProps={{
                      sx: {
                        minWidth: 220,
                        borderRadius: 2,
                        border: "1px solid rgba(124,58,237,0.20)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    {/* Header */}
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        bgcolor: "#f5f3ff",
                        borderBottom: "1px solid #ede9fe",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Signed in as vendor
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="#5b21b6"
                        noWrap
                      >
                        {vendor.name}
                      </Typography>
                      {vendor.email && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {vendor.email}
                        </Typography>
                      )}
                    </Box>

                    <MenuItem
                      onClick={() => {
                        setVendorMenuEl(null);
                        navigate("/vendor/dashboard");
                      }}
                      sx={{ gap: 1.5, py: 1.2 }}
                    >
                      <DashboardIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                      <Typography variant="body2" fontWeight={600}>
                        Vendor Dashboard
                      </Typography>
                    </MenuItem>

                    <MenuItem
                      onClick={() => {
                        setVendorMenuEl(null);
                        navigate("/vendor/orders");
                      }}
                      sx={{ gap: 1.5, py: 1.2 }}
                    >
                      <StorefrontIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                      <Typography variant="body2" fontWeight={600}>
                        My Orders
                      </Typography>
                    </MenuItem>

                    <MenuItem
                      onClick={() => {
                        setVendorMenuEl(null);
                        navigate("/vendor/profile");
                      }}
                      sx={{ gap: 1.5, py: 1.2 }}
                    >
                      <PersonIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                      <Typography variant="body2" fontWeight={600}>
                        Profile
                      </Typography>
                    </MenuItem>

                    <Divider />

                    <MenuItem
                      onClick={handleVendorLogout}
                      sx={{ gap: 1.5, py: 1.2, color: "#dc2626" }}
                    >
                      <LogoutIcon sx={{ fontSize: 18, color: "#dc2626" }} />
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="#dc2626"
                      >
                        Sign Out
                      </Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : user ? (
                /* ── REGULAR USER ACCOUNT CHIP ── */
                <>
                  <Tooltip
                    title={`${user.name}${user.email ? " · " + user.email : ""}`}
                  >
                    <Chip
                      avatar={
                        <Avatar
                          sx={{
                            bgcolor: "#1d4ed8",
                            color: "#fff !important",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {user.initials}
                        </Avatar>
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <span
                            style={{
                              maxWidth: 110,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {user.name}
                          </span>
                          <ArrowDropDownIcon sx={{ fontSize: 16 }} />
                        </Box>
                      }
                      onClick={(e) => setUserMenuEl(e.currentTarget)}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                        height: 34,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  </Tooltip>

                  <Menu
                    anchorEl={userMenuEl}
                    open={Boolean(userMenuEl)}
                    onClose={() => setUserMenuEl(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    sx={{ mt: 1, zIndex: 9999 }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        bgcolor: "#eff6ff",
                        borderBottom: "1px solid #dbeafe",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Signed in
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="#1e40af"
                        noWrap
                      >
                        {user.name}
                      </Typography>
                    </Box>
                    <MenuItem
                      onClick={() => {
                        setUserMenuEl(null);
                        navigate("/profile");
                      }}
                      sx={{ gap: 1.5 }}
                    >
                      <PersonIcon sx={{ fontSize: 18, color: "#1d4ed8" }} />
                      <Typography variant="body2" fontWeight={600}>
                        My Profile
                      </Typography>
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setUserMenuEl(null);
                        navigate("/my-orders");
                      }}
                      sx={{ gap: 1.5 }}
                    >
                      <StorefrontIcon sx={{ fontSize: 18, color: "#1d4ed8" }} />
                      <Typography variant="body2" fontWeight={600}>
                        My Orders
                      </Typography>
                    </MenuItem>
                    <Divider />
                    <MenuItem
                      onClick={handleUserLogout}
                      sx={{ gap: 1.5, color: "#dc2626" }}
                    >
                      <LogoutIcon sx={{ fontSize: 18, color: "#dc2626" }} />
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="#dc2626"
                      >
                        Sign Out
                      </Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                /* ── NOT LOGGED IN — show Login / Sign Up ── */
                <>
                  {!isMobile && (
                    <NavLinkButton
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLoginAnchorEl(e.currentTarget);
                      }}
                    >
                      <LoginIcon sx={{ mr: 0.5 }} />
                      Login
                    </NavLinkButton>
                  )}

                  {!isMobile && (
                    <SignUpButton
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSignupAnchorEl(e.currentTarget);
                      }}
                    >
                      <HowToRegIcon sx={{ mr: 0.5 }} />
                      Sign Up
                    </SignUpButton>
                  )}
                </>
              )}

              <NavLinkButton component={Link} to="/offers">
                <LocalOfferIcon />
              </NavLinkButton>

              <NavLinkButton component={Link} to="/cart">
                <ShoppingCartIcon />
              </NavLinkButton>
            </NavActions>

            {/* ═══════════════ LOGIN MENU ═══════════════ */}
            <Menu
              anchorEl={loginAnchorEl}
              open={Boolean(loginAnchorEl)}
              onClose={() => setLoginAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              sx={{ mt: 1, zIndex: 9999 }}
            >
              <MenuItem component={Link} to="/userlogin" onClick={closeAll}>
                <LoginIcon sx={{ mr: 1, fontSize: 18 }} /> User Login
              </MenuItem>
              <MenuItem component={Link} to="/login" onClick={closeAll}>
                <DashboardIcon sx={{ mr: 1, fontSize: 18 }} /> All Login Options
              </MenuItem>
            </Menu>

            {/* ═══════════════ SIGN UP MENU ═══════════════ */}
            <Menu
              anchorEl={signupAnchorEl}
              open={Boolean(signupAnchorEl)}
              onClose={() => setSignupAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              sx={{ mt: 1, zIndex: 9999 }}
            >
              <MenuItem component={Link} to="/userregister" onClick={closeAll}>
                <PersonIcon sx={{ mr: 1, fontSize: 18 }} /> User Register
              </MenuItem>
              <MenuItem component={Link} to="/signup" onClick={closeAll}>
                <HowToRegIcon sx={{ mr: 1, fontSize: 18 }} /> All Register
                Options
              </MenuItem>
            </Menu>
          </Toolbar>
        </Container>
      </PrimaryNav>

      {/* ── MOBILE DRAWER ── */}
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <Box sx={{ width: 270, p: 2 }}>
          <IconButton onClick={() => setIsDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
          <Divider sx={{ mb: 1 }} />

          {/* Show vendor info in drawer if logged in as vendor */}
          {vendor && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                bgcolor: "#f5f3ff",
                borderRadius: 2,
                border: "1px solid #ede9fe",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Vendor Account
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#5b21b6">
                {vendor.name}
              </Typography>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<DashboardIcon />}
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate("/vendor/dashboard");
                }}
                sx={{ mt: 1, borderColor: "#7c3aed", color: "#7c3aed" }}
              >
                Go to Dashboard
              </Button>
              <Button
                fullWidth
                size="small"
                startIcon={<LogoutIcon />}
                onClick={handleVendorLogout}
                sx={{ mt: 0.5, color: "#dc2626" }}
              >
                Sign Out
              </Button>
            </Box>
          )}

          <ListItemButton
            component={Link}
            to="/login"
            onClick={() => setIsDrawerOpen(false)}
          >
            <ListItemText primary="All Login Options" />
          </ListItemButton>
          <ListItemButton
            component={Link}
            to="/userlogin"
            onClick={() => setIsDrawerOpen(false)}
          >
            <ListItemText primary="User Login" />
          </ListItemButton>
          <ListItemButton
            component={Link}
            to="/login/vendor"
            onClick={() => setIsDrawerOpen(false)}
          >
            <ListItemText primary="Vendor Login" />
          </ListItemButton>
        </Box>
      </Drawer>
    </>
  );
}
