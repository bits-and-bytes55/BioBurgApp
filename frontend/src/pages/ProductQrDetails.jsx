import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  LocalOffer as LocalOfferIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

const DetailRow = ({ label, value }) => (
  <Box sx={{ py: 1 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={600}>
      {value || "N/A"}
    </Typography>
  </Box>
);

const ProductQrDetails = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `${API_BASE}/api/products/qr/${encodeURIComponent(token || "")}`
        );
        if (res.data?.success) {
          setProduct(res.data.product);
        } else {
          setError("Unable to load product details");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Invalid or expired QR code");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [token]);

  const displayName = useMemo(() => {
    if (!product) return "";
    return (
      product.brandName ||
      product.genericCompositions ||
      product.manufacturer ||
      "Product Details"
    );
  }, [product]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading product details...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            QR Scan Error
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button component={Link} to="/" variant="contained">
            Go to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 3, md: 6 },
        background:
          "radial-gradient(circle at top right, #e2ecff 0%, #f8fafc 40%, #eef3ff 100%)",
      }}
    >
      <Container maxWidth="md">
        <Paper
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 3,
            border: "1px solid #dbeafe",
            boxShadow: "0 18px 44px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Product data verified through BioBurg QR scan
              </Typography>
            </Box>
            <VerifiedIcon color="success" sx={{ fontSize: 34 }} />
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
            <Chip icon={<CategoryIcon />} label={product.category || "Uncategorized"} />
            <Chip icon={<InventoryIcon />} label={`Stock: ${product.totalStocks ?? "N/A"}`} />
            <Chip icon={<LocalOfferIcon />} label={product.isOTC ? "OTC Product" : "Prescription Required"} />
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <DetailRow label="Manufacturer" value={product.manufacturer} />
            </Grid>
            <Grid item xs={12} md={6}>
              <DetailRow label="Generic Composition" value={product.genericCompositions} />
            </Grid>
            <Grid item xs={12} md={4}>
              <DetailRow label="MRP" value={product.mrp != null ? `Rs. ${product.mrp}` : "N/A"} />
            </Grid>
            <Grid item xs={12} md={4}>
              <DetailRow label="Batch Number" value={product.batchNumber} />
            </Grid>
            <Grid item xs={12} md={4}>
              <DetailRow label="Expiry Date" value={product.expiryDate} />
            </Grid>
            <Grid item xs={12} md={6}>
              <DetailRow label="HSN" value={product.hsn} />
            </Grid>
            <Grid item xs={12} md={6}>
              <DetailRow label="QR Token" value={product.qrCodeToken} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={Link}
              to={`/product-details/${product.id}`}
              variant="contained"
            >
              Open Full Product Page
            </Button>
            <Button component={Link} to="/" variant="outlined">
              Back to Home
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProductQrDetails;
