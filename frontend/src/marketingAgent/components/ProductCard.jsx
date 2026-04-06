import { useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Stack,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Avatar,
  Divider,
  CardActions,
  LinearProgress,
  Fade,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  WhatsApp,
  FavoriteBorder,
  Favorite,
  Share,
  Visibility,
  LocalOffer,
  Inventory,
  Verified,
  MedicalServices,
  ContentCopy,
  Bolt,
  TrendingUp,
  Star,
} from "@mui/icons-material";
import VariantSelector from "./VariantSelector";
import { shareOnWhatsApp } from "../utils/whatsappShare";

// Styled Components
const CompactCard = styled(Card)(({ theme }) => ({
  borderRadius: "16px",
  background: "white",
  boxShadow: "0 2px 12px rgba(37, 211, 102, 0.08)",
  transition: "all 0.3s ease",
  overflow: "visible",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  border: "1px solid rgba(37, 211, 102, 0.1)",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(37, 211, 102, 0.15)",
    borderColor: "rgba(37, 211, 102, 0.2)",
  },
}));

const ImageContainer = styled(Box)({
  position: "relative",
  overflow: "hidden",
  borderTopLeftRadius: "16px",
  borderTopRightRadius: "16px",
  height: "160px",
  background: "linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%)",
});

const DiscountBadge = styled(Chip)(({ theme }) => ({
  position: "absolute",
  top: "8px",
  left: "8px",
  background: "linear-gradient(135deg, #FF6B6B, #FF4757)",
  color: "white",
  fontWeight: "700",
  fontSize: "0.65rem",
  height: "22px",
  zIndex: 2,
  "& .MuiChip-label": {
    padding: "0 8px",
  },
}));

const FavoriteButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: "8px",
  right: "8px",
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.9)",
  border: "1px solid rgba(37, 211, 102, 0.1)",
  zIndex: 2,
  "&:hover": {
    background: "white",
  },
}));

const WhatsAppButton = styled(Button)(({ theme }) => ({
  background: "#25D366",
  color: "white",
  fontWeight: "600",
  borderRadius: "10px",
  padding: "6px 12px",
  fontSize: "0.75rem",
  textTransform: "none",
  minWidth: "auto",
  flex: 1,
  "&:hover": {
    background: "#128C7E",
  },
}));

const PriceText = styled(Typography)(({ theme }) => ({
  fontWeight: "700",
  fontSize: "1.1rem",
  color: "#25D366",
  lineHeight: 1,
}));

const StockChip = styled(Chip)(({ theme, instock }) => ({
  fontSize: "0.65rem",
  height: "20px",
  background: instock 
    ? "rgba(37, 211, 102, 0.1)"
    : "rgba(255, 107, 107, 0.1)",
  color: instock ? "#25D366" : "#FF6B6B",
  fontWeight: "600",
  border: `1px solid ${instock ? "rgba(37, 211, 102, 0.2)" : "rgba(255, 107, 107, 0.2)"}`,
}));

const TypeChip = styled(Chip)(({ theme }) => ({
  fontSize: "0.65rem",
  height: "20px",
  background: "rgba(155, 89, 182, 0.1)",
  color: "#8E44AD",
  fontWeight: "500",
  border: "1px solid rgba(155, 89, 182, 0.2)",
}));

export default function CompactAgentProductCard({ product }) {
  const [variant, setVariant] = useState(product.variants?.[0]);
  const [isFavorite, setIsFavorite] = useState(false);

  const image =
    product.images?.[product.primaryImageIndex || 0]?.url ||
    "/no-image.png";

  const price = variant?.price || product.price || product.mrp;
  const originalPrice = variant?.mrp || product.mrp;
  const discount = originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <CompactCard>
      <ImageContainer>
        <CardMedia
          component="img"
          image={image}
          alt={product.title}
          sx={{
            height: "100%",
            width: "100%",
            objectFit: "cover",
            transition: "transform 0.5s ease",
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
        />

        <FavoriteButton size="small" onClick={() => setIsFavorite(!isFavorite)}>
          {isFavorite ? (
            <Favorite sx={{ fontSize: "16px", color: "#FF6B6B" }} />
          ) : (
            <FavoriteBorder sx={{ fontSize: "16px", color: "#666" }} />
          )}
        </FavoriteButton>

        {discount > 0 && (
          <DiscountBadge
            icon={<LocalOffer sx={{ fontSize: "12px" }} />}
            label={`${discount}% OFF`}
            size="small"
          />
        )}
      </ImageContainer>

      <CardContent sx={{ p: 1.5, flexGrow: 1 }}>
        {/* Product Title */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: "600",
            fontSize: "0.85rem",
            lineHeight: 1.3,
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            height: "2.4rem",
          }}
        >
          {product.title}
        </Typography>

        {/* Brand */}
        <Typography
          variant="caption"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "#128C7E",
            fontWeight: "500",
            mb: 1,
          }}
        >
          <Verified sx={{ fontSize: "12px" }} />
          {product.brandName}
        </Typography>

        {/* Price */}
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1.5 }}>
          <PriceText>₹{price.toLocaleString()}</PriceText>
          {originalPrice > price && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                textDecoration: "line-through",
                fontSize: "0.75rem",
              }}
            >
              ₹{originalPrice.toLocaleString()}
            </Typography>
          )}
        </Box>

        {/* Variant Selector */}
        {product.variants?.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <VariantSelector
              variants={product.variants}
              onChange={setVariant}
              selectedVariant={variant}
              compact
            />
          </Box>
        )}

        {/* Status Chips */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }}>
          <StockChip
            icon={<Inventory sx={{ fontSize: "12px" }} />}
            label={product.stock > 0 ? "In Stock" : "Out of Stock"}
            instock={product.stock > 0}
            size="small"
          />
          <TypeChip
            icon={<MedicalServices sx={{ fontSize: "12px" }} />}
            label={product.isOTC ? "OTC" : "Rx"}
            size="small"
          />
        </Stack>
      </CardContent>

      {/* WhatsApp Button */}
      <CardActions sx={{ p: 1.5, pt: 0 }}>
        <WhatsAppButton
          size="small"
          startIcon={<WhatsApp sx={{ fontSize: "16px" }} />}
          onClick={() => shareOnWhatsApp(product, variant)}
          disabled={product.stock === 0}
        >
          Share
        </WhatsAppButton>
        
        <Tooltip title="Quick View">
          <IconButton size="small" sx={{ ml: 1 }}>
            <Visibility sx={{ fontSize: "18px", color: "#666" }} />
          </IconButton>
        </Tooltip>
      </CardActions>
    </CompactCard>
  );
}