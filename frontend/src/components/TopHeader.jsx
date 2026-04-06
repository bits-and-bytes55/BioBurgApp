import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Drawer,
  IconButton,
  useMediaQuery,
  Divider,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";

// Icons
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import GroupIcon from "@mui/icons-material/Group";
import MenuIcon from "@mui/icons-material/Menu";

const HeaderWrapper = styled(Box)(() => ({
  backgroundColor: "#000",
  color: "#fff",
  padding: "6px 0",
  fontSize: "13px",
}));

const HeaderRouterLink = styled(Box)(() => ({
  color: "#dcdcdc",
  marginLeft: "16px",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  userSelect: "none",
  "&:hover": {
    color: "#fff",
  },
}));

export default function TopHeader() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ---------------- On Click LOGIC (FIX) ---------------- */


const handleClick = (event) => {
  setAnchorEl(event.currentTarget);
};

const handleClose = () => {
  setAnchorEl(null);
};

const open = Boolean(anchorEl);

  /* -------------------------------------------------- */

  return (
    <HeaderWrapper>
      <Box
        sx={{
          maxWidth: "1300px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        {/* MOBILE MENU */}
        {isMobile && (
          <IconButton sx={{ color: "#fff" }} onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
        )}

        {!isMobile && (
          <>
            <HeaderRouterLink>Doctor’s Zone</HeaderRouterLink>
<Typography sx={{ mx: 1 }}>|</Typography>

{/* REGISTER WITH US (CLICK BASED) */}
<Box sx={{ display: "flex", alignItems: "center" }}>
  <HeaderRouterLink onClick={handleClick}>
    Register with Us
    <KeyboardArrowDownIcon sx={{ fontSize: 16, ml: 0.5 }} />
  </HeaderRouterLink>
</Box>

{/* DROPDOWN MENU */}
<Menu
  anchorEl={anchorEl}
  open={open}
  onClose={handleClose}
  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
  transformOrigin={{ vertical: "top", horizontal: "right" }}
  sx={{
    "& .MuiPaper-root": {
      backgroundColor: "#111",
      color: "#fff",
      minWidth: 270,
    },
  }}
>
  {/* menu items yahan rahenge */}
              <MenuItem component={RouterLink} to='/userregister'>
                User Register
              </MenuItem>
              <Divider />
              <MenuItem component={RouterLink} to='/franchise-application'>
                Bioburg Franchise
              </MenuItem>
              <MenuItem component={RouterLink} to='/register/vendor'>
                Bioburg Vendor's
              </MenuItem>
              <MenuItem component={RouterLink} to='#' disabled>
                Bioburg Jeweler's
              </MenuItem>
              <MenuItem component={RouterLink} to='#' disabled>
                Bioburg C and F
              </MenuItem>
              <MenuItem component={RouterLink} to='#' disabled>
                Business to Business (B2B)
              </MenuItem>
              <MenuItem component={RouterLink} to='#' disabled>
                Hospital & Pharmacy
              </MenuItem>
              <MenuItem component={RouterLink} to='/register/bulk-manufacturing'>
                Bulk Manufacturing
              </MenuItem>
              <MenuItem component={RouterLink} to='/register/doctor'>
                 DR. Consultation
              </MenuItem>
              <MenuItem component={RouterLink} to='/register/radiology-diagnostics'>
                Radiology Diagnostics
              </MenuItem>
              <MenuItem component={RouterLink} to='/book-lab-test'>
                Pathology  Lab Test
              </MenuItem>
              <MenuItem component={RouterLink} to='#' disabled>
                Sponsor Pharma Brand 
              </MenuItem>
              <MenuItem component={RouterLink} to='/register/pharma-manufacturer'>
                Pharma Manufacturers
              </MenuItem>
              <MenuItem component={RouterLink} to='#' disabled>
                Insurance Partner's 
              </MenuItem>
               <MenuItem component={RouterLink} to='#' disabled>
                Aboard India C & F
              </MenuItem>
              <MenuItem component={RouterLink} to='/careers-application'>
                Jobs and Careers
              </MenuItem>
              <MenuItem component={RouterLink} to='/ex-servicemen-application'>
                Jobs Ex-Servicemen 
              </MenuItem>
              {/* <MenuItem component={RouterLink} to='/AdminRegister'>
                Admin Register
              </MenuItem> */}
            </Menu>

            <Typography sx={{ mx: 1 }}>|</Typography>

            <HeaderRouterLink component={RouterLink} to="/register/vendor">Sell with us</HeaderRouterLink>
            <Typography sx={{ mx: 1 }}>|</Typography>

            <HeaderRouterLink>
              Deals
              <LocalOfferIcon sx={{ fontSize: 16, ml: 0.5, color: "orange" }} />
            </HeaderRouterLink>

            <Typography sx={{ mx: 1 }}>|</Typography>
            <HeaderRouterLink>Help</HeaderRouterLink>
          </>
        )}
      </Box>

      {/* MOBILE DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 280, background: "#111", height: "100%", color: "#fff", p: 2 }}>
          <Typography sx={{ mb: 2, fontWeight: 600 }}>
            Register with Us
          </Typography>

          <MenuItem component={RouterLink} to="/register/admin">
            <MedicalServicesIcon sx={{ mr: 1 }} /> Admin
          </MenuItem>
          <MenuItem component={RouterLink} to="/register/vendor">
            <StorefrontIcon sx={{ mr: 1 }} /> Vendor
          </MenuItem>
          <MenuItem component={RouterLink} to="/register/franchise">
            <BusinessCenterIcon sx={{ mr: 1 }} /> Franchise
          </MenuItem>
        </Box>
      </Drawer>
    </HeaderWrapper>
  );
}
