import React from "react";
import { Box, Typography, Button, Paper, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useParams, useNavigate } from "react-router-dom";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PersonIcon from "@mui/icons-material/Person";

// ── Detect active portal ──────────────────────────────────────────────────────
function getActiveRole() {
  if (localStorage.getItem("userToken") || localStorage.getItem("authToken") || localStorage.getItem("token"))
    return "user";
  if (localStorage.getItem("vendorToken"))   return "vendor";
  if (localStorage.getItem("hospitalToken")) return "hospital";
  if (localStorage.getItem("pharmacyToken")) return "pharmacy";
  if (localStorage.getItem("doctorToken"))   return "doctor";
  return "guest";
}

const ORDERS_ROUTE = {
  vendor  : "/vendor/orders",
  hospital: "/hospital/dashboard",
  pharmacy: "/pharmacy/dashboard",
  user    : "/orders",
  guest   : "/orders",
};

export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const role        = getActiveRole();
  const isVendor    = role === "vendor";

  return (
    <Box sx={{ minHeight: "70vh", display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
      <Paper elevation={3} sx={{ maxWidth: 520, width: "100%", p: 4, textAlign: "center", borderRadius: 3 }}>

        {/* Role badge */}
        <Chip
          icon={isVendor ? <StorefrontIcon sx={{ fontSize: "16px !important" }} /> : <PersonIcon sx={{ fontSize: "16px !important" }} />}
          label={isVendor ? "Vendor Purchase" : "Order Confirmed"}
          color={isVendor ? "secondary" : "success"}
          variant="outlined"
          size="small"
          sx={{ mb: 2, fontWeight: 600 }}
        />

        <CheckCircleIcon color="success" sx={{ fontSize: 70, display: "block", mx: "auto" }} />

        <Typography variant="h5" sx={{ mt: 2, fontWeight: "bold" }}>
          Order Placed Successfully 
        </Typography>

        <Typography sx={{ mt: 1, color: "text.secondary" }}>
          {isVendor
            ? "Your vendor purchase is confirmed. Track it in your Vendor Dashboard under My Purchases."
            : "Thank you for your purchase. Your order has been placed and will be processed shortly."}
        </Typography>

        {/* Order ID pill */}
        <Box sx={{ mt: 2, py: 1, px: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200", display: "inline-block" }}>
          <Typography sx={{ fontFamily: "monospace", fontSize: 13 }}>
            <b>Order ID:</b> {orderId}
          </Typography>
        </Box>

        <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>

          {/* PRIMARY — correct orders page per role */}
          <Button
            variant="contained"
            startIcon={isVendor ? <StorefrontIcon /> : <PersonIcon />}
            onClick={() => {
              if (isVendor) {
                // Pass defaultTab:1 so VendorOrders opens "My Purchases" directly
                navigate("/vendor/orders", { state: { defaultTab: 1 } });
              } else {
                navigate(ORDERS_ROUTE[role] || "/orders");
              }
            }}
            sx={isVendor ? { bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" } } : {}}
          >
            {isVendor ? "View My Purchases" : "View My Orders"}
          </Button>

          <Button variant="outlined" onClick={() => navigate("/")}>
            Continue Shopping
          </Button>
        </Box>

        {isVendor && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            Dashboard → Orders → My Purchases tab
          </Typography>
        )}
      </Paper>
    </Box>
  );
}