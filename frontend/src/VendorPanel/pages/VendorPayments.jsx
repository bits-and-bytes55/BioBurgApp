// src/VendorPanel/pages/VendorPayments.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Avatar, Button, CircularProgress, Alert,
} from "@mui/material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import ShoppingBagIcon   from "@mui/icons-material/ShoppingBag";
import RefreshIcon       from "@mui/icons-material/Refresh";
import axios from "axios";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  import.meta.env.VITE_API_BASE_URL;

const vendorApi = axios.create({ baseURL: API_BASE });
vendorApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("vendorToken");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function VendorPayments() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Pull from incoming orders — same source of truth as dashboard
      const res = await vendorApi.get("/api/vendor/orders");
      const orders = res.data?.data || [];

      const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered");

      const totalEarned = deliveredOrders.reduce(
        (sum, o) => sum + Number(o.vendorTotal ?? o.totalAmount ?? 0),
        0,
      );

      setSummary({
        totalEarned,
        deliveredCount: deliveredOrders.length,
        totalOrders: orders.length,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payment data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#111827">
            Payments & Earnings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your earnings from delivered orders
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPayments} size="small">
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Banner */}
      <Paper
        sx={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          color: "#fff",
          p: 3,
          borderRadius: 3,
          mb: 3,
        }}
        elevation={0}
      >
        <Typography variant="h4" fontWeight={800}>
          ₹{Number(summary?.totalEarned || 0).toLocaleString("en-IN")}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          Total Earnings from {summary?.deliveredCount || 0} delivered order
          {(summary?.deliveredCount || 0) !== 1 ? "s" : ""}
        </Typography>
      </Paper>

      {/* Stat Cards */}
      <Grid container spacing={2}>
        {[
          {
            icon: <CurrencyRupeeIcon />,
            label: "Total Earned",
            value: `₹${Number(summary?.totalEarned || 0).toLocaleString("en-IN")}`,
            color: "#7c3aed",
            bg: "#f5f3ff",
          },
          {
            icon: <CheckCircleIcon />,
            label: "Delivered Orders",
            value: summary?.deliveredCount || 0,
            color: "#16a34a",
            bg: "#f0fdf4",
          },
          {
            icon: <ShoppingBagIcon />,
            label: "Total Orders",
            value: summary?.totalOrders || 0,
            color: "#1565c0",
            bg: "#e3f2fd",
          },
        ].map((s, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }} elevation={0}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ bgcolor: s.bg, color: s.color, width: 40, height: 40 }}>
                    {s.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {s.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color={s.color}>
                      {s.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}