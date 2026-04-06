// src/VendorPanel/pages/VendorDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Avatar, CircularProgress,
  Alert, Paper, Chip, LinearProgress, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, Button,
} from "@mui/material";
import ShoppingBagIcon    from "@mui/icons-material/ShoppingBag";
import InventoryIcon      from "@mui/icons-material/Inventory";
import CurrencyRupeeIcon  from "@mui/icons-material/CurrencyRupee";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import TrendingUpIcon     from "@mui/icons-material/TrendingUp";
import LocalShippingIcon  from "@mui/icons-material/LocalShipping";
import StarIcon           from "@mui/icons-material/Star";
import RefreshIcon        from "@mui/icons-material/Refresh";
import axios from "axios";
import { getToken, isLoggedIn } from "../../../utils/auth";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL;

const vendorApi = axios.create({ baseURL: API_BASE });
vendorApi.interceptors.request.use((cfg) => {
  const token = getToken("vendor");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const STATUS_COLOR = {
  pending:    "#d97706",
  confirmed:  "#2563eb",
  processing: "#7c3aed",
  shipped:    "#0891b2",
  delivered:  "#16a34a",
  cancelled:  "#dc2626",
  placed:     "#6b7280",
};

export default function VendorDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn("vendor")) navigate("/login/vendor", { replace: true });
  }, [navigate]);

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch only incoming vendor orders (orders placed TO this vendor)
      const [ordersRes, productsRes] = await Promise.allSettled([
        vendorApi.get("/api/vendor/orders"),
        vendorApi.get("/api/vendor/products"),
      ]);

      const orders =
        ordersRes.status === "fulfilled"
          ? ordersRes.value.data?.data || []
          : [];

      const products =
        productsRes.status === "fulfilled"
          ? productsRes.value.data?.data ||
            productsRes.value.data?.products ||
            []
          : [];

      const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered");

      // Revenue = sum of vendorTotal (or totalAmount) for delivered incoming orders
      const totalSales = deliveredOrders.reduce(
        (sum, o) => sum + Number(o.vendorTotal ?? o.totalAmount ?? 0),
        0,
      );

      const ordersByStatus = Object.entries(
        orders.reduce((acc, o) => {
          const key = o.orderStatus || "unknown";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
      ).map(([status, count]) => ({ _id: status, count }));

      const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setData({
        totalOrders:     orders.length,
        deliveredOrders: deliveredOrders.length,
        totalProducts:   products.length,
        totalSales,
        ordersByStatus,
        recentOrders,
        topProducts: products.slice(0, 5),
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={fetchDashboard}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );

  const statCards = [
    {
      icon: <ShoppingBagIcon />,
      label: "Total Orders",
      value: data?.totalOrders ?? 0,
      color: "#1565c0",
      bg: "#e3f2fd",
    },
    {
      icon: <CheckCircleIcon />,
      label: "Delivered",
      value: data?.deliveredOrders ?? 0,
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      icon: <InventoryIcon />,
      label: "Total Products",
      value: data?.totalProducts ?? 0,
      color: "#7c3aed",
      bg: "#f5f3ff",
    },
    {
      icon: <CurrencyRupeeIcon />,
      label: "Total Revenue",
      value: `₹${Number(data?.totalSales ?? 0).toLocaleString("en-IN")}`,
      color: "#d97706",
      bg: "#fffbeb",
    },
  ];

  const totalOrders = data?.totalOrders || 1;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#111827">
            Vendor Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of your store performance
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} size="small" onClick={fetchDashboard}>
          Refresh
        </Button>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }} elevation={0}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ bgcolor: s.bg, color: s.color, width: 44, height: 44 }}>
                    {s.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {s.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color={s.color}>
                      {s.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Orders by Status */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ borderRadius: 2, border: "1px solid #e5e7eb", p: 2.5 }} elevation={0}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <LocalShippingIcon sx={{ color: "#1565c0" }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Orders by Status
              </Typography>
            </Box>
            {!data?.ordersByStatus || data.ordersByStatus.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                No orders yet
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {data.ordersByStatus.map((s, i) => {
                  const pct = Math.round((s.count / totalOrders) * 100);
                  return (
                    <Box key={i}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ textTransform: "capitalize" }}
                        >
                          {s._id}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={STATUS_COLOR[s._id] || "#374151"}
                        >
                          {s.count} ({pct}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "#f3f4f6",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: STATUS_COLOR[s._id] || "#1565c0",
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }} elevation={0}>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{ p: 2.5, borderBottom: "1px solid #f3f4f6" }}
            >
              <TrendingUpIcon sx={{ color: "#1565c0" }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Recent Orders
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f9fafb" }}>
                    {["Order ID", "Amount", "Status", "Date"].map((h) => (
                      <TableCell key={h}><b>{h}</b></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!data?.recentOrders || data.recentOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary" variant="body2">
                          No recent orders
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.recentOrders.map((o) => (
                      <TableRow key={o._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            #{(o._id || "").slice(-6).toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600}>
                            ₹{Number(o.vendorTotal ?? o.totalAmount ?? 0).toLocaleString("en-IN")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={o.orderStatus || "pending"}
                            size="small"
                            sx={{
                              bgcolor: STATUS_COLOR[o.orderStatus]
                                ? `${STATUS_COLOR[o.orderStatus]}20`
                                : "#f3f4f6",
                              color: STATUS_COLOR[o.orderStatus] || "#374151",
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {o.createdAt
                              ? new Date(o.createdAt).toLocaleDateString("en-IN")
                              : "—"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Top Products */}
        {data?.topProducts && data.topProducts.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }} elevation={0}>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{ p: 2.5, borderBottom: "1px solid #f3f4f6" }}
              >
                <StarIcon sx={{ color: "#f59e0b" }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Your Products
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2, p: 2, overflowX: "auto" }}>
                {data.topProducts.map((p, i) => (
                  <Paper
                    key={p._id || i}
                    variant="outlined"
                    sx={{ minWidth: 140, p: 1.5, borderRadius: 2, textAlign: "center", flexShrink: 0 }}
                  >
                    <Avatar
                      variant="rounded"
                      src={p.images?.[0]?.url}
                      sx={{ width: 52, height: 52, mx: "auto", mb: 1 }}
                    />
                    <Typography variant="caption" fontWeight={700} display="block" noWrap>
                      {p.brandName || "—"}
                    </Typography>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      ₹{p.mrp || "0"}
                    </Typography>
                    <Chip
                      label={p.totalStocks || p.stocks || 0}
                      size="small"
                      variant="outlined"
                      color={(p.totalStocks || p.stocks || 0) > 0 ? "success" : "error"}
                      sx={{ mt: 0.5, display: "flex" }}
                    />
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}