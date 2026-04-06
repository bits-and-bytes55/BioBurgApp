import React from "react";
import { Box, Typography } from "@mui/material";

const features = [
  {
    title: "WIDEST RANGE",
    subtitle: "1,00,000+ Listed Products",
    icon: "💊",
  },
  {
    title: "FREE DELIVERY",
    subtitle: "on Order For ₹500 or more",
    icon: "🚚",
  },
  {
    title: "BEST OFFERS",
    subtitle: "Exclusive Prices",
    icon: "🏷️",
  },
  {
    title: "COD AVAILABLE",
    subtitle: "With Only ₹50/- Charge",
    icon: "💰",
  },
];

export default function FeaturesBar() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        gap: 2,
        mt: 5,
        flexWrap: "wrap",
      }}
    >
      {features.map((item, index) => (
        <Box
          key={index}
          sx={{
            background: "#f58220",
            color: "white",
            px: 3,
            py: 1.5,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
            transition: "0.3s",
            "&:hover": { transform: "translateY(-3px)" },
          }}
        >
          <Box
            sx={{
              fontSize: "28px",
              background: "rgba(255,255,255,0.25)",
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
            }}
          >
            {item.icon}
          </Box>

          <Box sx={{ textAlign: "left" }}>
            <Typography
              sx={{ fontWeight: 700, fontSize: "14px", lineHeight: "16px" }}
            >
              {item.title}
            </Typography>

            <Typography
              sx={{ fontSize: "12px", lineHeight: "14px", opacity: 0.9 }}
            >
              {item.subtitle}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
