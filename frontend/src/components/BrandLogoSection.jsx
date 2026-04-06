import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { API_BASE_URL } from "../config/api";

const BASE_API = API_BASE_URL;

export default function BrandLogoSection() {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    axios
      .get(`${BASE_API}/api/brands/all`)
      .then((res) => setBrands(res.data?.data || []))
      .catch(() => setBrands([]));
  }, []);

  if (brands.length === 0) return null;

  return (
    <Box sx={{ mt: 4 }}>
      {/* TITLE */}
      <Typography
        variant="h6"
        sx={{ fontWeight: "bold", mb: 2, px: 2 }}
      >
        Top Pharma Brands | Save Up to 75% Off
      </Typography>

      {/* SLIDER */}
      <Box sx={{ px: 2, position: "relative" }}>
        <Swiper
          modules={[Autoplay, Navigation]}
          loop
          navigation
          autoplay={{
            delay: 1800,
            disableOnInteraction: false,
            pauseOnMouseEnter: true, // 🔥 hover stop
          }}
          spaceBetween={16}
          breakpoints={{
            0: { slidesPerView: 3 },
            600: { slidesPerView: 4 },
            900: { slidesPerView: 6 },
          }}
        >
          {brands.map((b) => (
            <SwiperSlide key={b._id}>
              {/* FIXED CARD */}
              <Box
                sx={{
                  width: 120,
                  height: 70,
                  mx: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 2,
                  transition: "all 0.25s ease",
                  "&:hover": {
                    transform: "scale(1.04)",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                  },
                }}
              >
                {/* IMAGE HOLDER */}
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    component="img"
                    src={b.logo}
                    alt={b.name}
                    sx={{
                      maxWidth: "90%",
                      maxHeight: "60%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))", // 🌫️ light shadow
                    }}
                  />
                </Box>
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* 🔽 ARROW SIZE CUSTOMIZATION */}
        <style>
          {`
            .swiper-button-next,
            .swiper-button-prev {
              color: #1e293b;
              width: 28px;
              height: 28px;
            }

            .swiper-button-next::after,
            .swiper-button-prev::after {
              font-size: 18px;
              font-weight: bold;
            }
          `}
        </style>
      </Box>
    </Box>
  );
}
