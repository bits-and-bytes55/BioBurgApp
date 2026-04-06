import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Skeleton,
  Chip,
  alpha,
  useTheme,
  Container,
  IconButton,
} from "@mui/material";
import { Link } from "react-router-dom";
import { ArrowForward, Business, LocalOffer, ChevronLeft, ChevronRight } from "@mui/icons-material";

//  Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

import api from "../../utils/api";

export default function B2BSection() {
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swiperInstance, setSwiperInstance] = useState(null);

  useEffect(() => {
    const fetchB2B = async () => {
      try {
        const res = await api.get("/api/b2b/all");
        setData(res.data?.data || res.data || []);
      } catch (err) {
        console.error("B2B fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchB2B();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3,  }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2, ml: 2 }} />
        <Box sx={{ px: 2 }}>
          <Swiper
            modules={[Navigation]}
            slidesPerView={6}
            spaceBetween={16}
            navigation
            breakpoints={{
              0: { slidesPerView: 1.4 },
              600: { slidesPerView: 2.5 },
              900: { slidesPerView: 6 },
            }}
          >
            {[...Array(6)].map((_, index) => (
              <SwiperSlide key={index}>
                <Skeleton
                  variant="rounded"
                  width={180}
                  height={260}
                  sx={{ borderRadius: 2 }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      </Container>
    );
  }

  if (data.length === 0) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 3, bgcolor: "white" }}>
      {/* Header Section */}
      <Box sx={{ mb: 3, px: { xs: 1, md: 0 }, bgcolor: "white" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 2,
              color: "primary.main",
            }}
          >
            <Business sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Bioburg Business to Business
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
              <LocalOffer sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography variant="body2" color="primary.main" fontWeight={500}>
                Save up to 75% on bulk orders
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Swiper Container with Navigation */}
      <Box sx={{ position: "relative", px: { xs: 0, sm: 1 }, bgcolor: "white", cursor: "pointer" }}>
        <Box sx={{ position: "relative", bgcolor: "white" }}>
          <Swiper
            modules={[Autoplay, Navigation, FreeMode]}
            slidesPerView={6}
            spaceBetween={16}
            navigation={{
              nextEl: ".custom-next",
              prevEl: ".custom-prev",
            }}
            freeMode={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            onSwiper={setSwiperInstance}
            breakpoints={{
              0: { slidesPerView: 1.3, spaceBetween: 12 },
              400: { slidesPerView: 1.8, spaceBetween: 12 },
              600: { slidesPerView: 2.5, spaceBetween: 14 },
              768: { slidesPerView: 3.2, spaceBetween: 16 },
              1024: { slidesPerView: 4.5, spaceBetween: 16 },
              1280: { slidesPerView: 5.5, spaceBetween: 16 },
              1500: { slidesPerView: 6.5, spaceBetween: 16 },
            }}
            style={{
              padding: "4px 2px 20px 2px",
              backgroundColor: "white",
            }}
          >
            {data.map((item) => {
              const imageUrl = typeof item.image === "string" ? item.image : item.image?.url;
              
              return (
                <SwiperSlide key={item._id}>
                  <Card
                    sx={{
                      width: "100%",
                      maxWidth: 180,
                      height: 260, // Increased height to 260px
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      transition: "all 0.25s ease",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      mx: "auto",
                      backgroundColor: "white",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    }}
                  >
                    {/* Image Container - Width matches container, increased height */}
                    <Box
                      sx={{
                        width: "100%", // Full width of container
                        height: 170, // Increased height to 170px
                        position: "relative",
                        overflow: "hidden",
                        flexShrink: 0,
                        backgroundColor: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 0, // No padding
                      }}
                    >
                      {imageUrl ? (
                        <>
                          {/* Image Container - Full width of parent */}
                          <Box
                            sx={{
                              width: "100%", // Takes full width of container
                              height: "100%", // Takes full height
                              position: "relative",
                              overflow: "hidden",
                              backgroundColor: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {/* Image - Full width, maintain aspect ratio */}
                            <Box
                              component="img"
                              src={imageUrl}
                              alt={item.title}
                              sx={{
                                width: "100%", // Full width of container
                                height: "auto", // Auto height to maintain aspect ratio
                                maxHeight: "100%", // Don't exceed container height
                                objectFit: "contain", // Maintain aspect ratio, fit within container
                                objectPosition: "center",
                                transition: "transform 0.4s ease",
                                backgroundColor: "white",
                                display: "block",
                                "&:hover": {
                                  transform: "scale(1.05)",
                                },
                              }}
                              onError={(e) => {
                                e.target.src = `https://via.placeholder.com/180x170/f5f5f5/4f46e5?text=${encodeURIComponent(item.title.substring(0, 20))}`;
                              }}
                            />
                          </Box>
                          
                          {/* B2B Badge */}
                          <Chip
                            label="B2B"
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: alpha(theme.palette.primary.main, 0.9),
                              color: "white",
                              fontWeight: "bold",
                              fontSize: "10px",
                              height: 20,
                              px: 0.5,
                              zIndex: 2,
                              "& .MuiChip-label": {
                                px: 1,
                              },
                            }}
                          />
                        </>
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            bgcolor: "white",
                            border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                          }}
                        >
                          <Business sx={{ fontSize: 32, color: alpha(theme.palette.primary.main, 0.3), mb: 1 }} />
                          <Typography variant="caption" color="text.secondary">
                            No Image
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Content Area */}
                    <CardContent
                      sx={{
                        p: 2,
                        pt: 1.5,
                        pb: "16px !important",
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "white",
                        height: 90, // Fixed content height
                      }}
                    >
                      {/* Title with better spacing */}
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{
                          mb: 1.5,
                          lineHeight: 1.4,
                          fontSize: "0.9rem",
                          overflow: "hidden",
                          display: "flex",
                          justifyContent: "center",
                          WebkitLineClamp: 3, // Show 3 lines max
                          WebkitBoxOrient: "vertical",
                          color: "text.primary",
                          flexGrow: 1,
                          minHeight: 60, // Ensure minimum height for text
                        }}
                      >
                        {item.title}
                      </Typography>

                      {/* Action Button and Badge */}
                      <Box sx={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        mt: "auto"
                      }}>
                        <Button
                          component={Link}
                          to={item.redirectUrl || "#"}
                          size="small"
                          variant="text"
                          endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                          sx={{
                            color: "primary.main",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            p: 0,
                            minWidth: "auto",
                            textTransform: "none",
                            "&:hover": {
                              backgroundColor: "transparent",
                              color: "primary.dark",
                              transform: "translateX(2px)",
                            },
                          }}
                        >
                          View Details
                        </Button>
                        
                        {/* Discount Badge */}
                        <Chip
                          label="75% OFF"
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: "success.dark",
                            fontWeight: "bold",
                            fontSize: "11px",
                            height: 22,
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Custom Navigation Buttons - Only show on desktop */}
          {data.length > 4 && (
            <>
              <IconButton
                className="custom-prev"
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: -12,
                  transform: "translateY(-50%)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "white",
                  boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
                  display: { xs: "none", md: "flex" },
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: "white",
                    transform: "translateY(-50%) scale(1.1)",
                  },
                  "& svg": {
                    fontSize: 20,
                  },
                }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                className="custom-next"
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: -12,
                  transform: "translateY(-50%)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "white",
                  boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
                  display: { xs: "none", md: "flex" },
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: "white",
                    transform: "translateY(-50%) scale(1.1)",
                  },
                  "& svg": {
                    fontSize: 20,
                  },
                }}
              >
                <ChevronRight />
              </IconButton>
            </>
          )}
        </Box>

        {/* Dots Indicator */}
        {/* <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 0.5,
            mt: 2,
            mb: 1,
            bgcolor: "white",
          }}
        >
          {[...Array(Math.min(6, Math.ceil(data.length / 4)))].map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: i === 0 ? "primary.main" : alpha(theme.palette.primary.main, 0.2),
                transition: "background-color 0.3s ease",
              }}
            />
          ))}
        </Box> */}
      </Box>

      {/* View All Button */}
      {/* {data.length > 8 && (
        <Box sx={{ textAlign: "center", mt: 2, bgcolor: "white" }}>
          <Button
            component={Link}
            to="/b2b"
            variant="outlined"
            size="small"
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 0.75,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              borderWidth: 1.5,
              backgroundColor: "white",
              "&:hover": {
                borderWidth: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            View All Business Solutions ({data.length})
          </Button>
        </Box>
      )} */}
    </Container>
  );
}