// src/VendorPanel/pages/VendorAnalytics.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Avatar,
  CircularProgress, Alert, Button,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import ShoppingBagIcon   from "@mui/icons-material/ShoppingBag";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import PendingIcon       from "@mui/icons-material/HourglassEmpty";
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

const STATUS_PALETTE = {
  placed:     "#6b7280",
  pending:    "#d97706",
  confirmed:  "#2563eb",
  processing: "#7c3aed",
  shipped:    "#0891b2",
  delivered:  "#16a34a",
  cancelled:  "#dc2626",
};

const FALLBACK_COLORS = [
  "#4f46e5", "#16a34a", "#d97706", "#dc2626",
  "#0891b2", "#7c3aed", "#6b7280",
];

export default function VendorAnalytics() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Try dedicated analytics endpoint first; fall back to orders
      let data = null;
      try {
        const res = await vendorApi.get("/api/vendor/analytics");
        data = res.data?.data || null;
      } catch {
        // Build analytics from incoming orders
        const res = await vendorApi.get("/api/vendor/orders");
        const orders = res.data?.data || [];

        const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered");
        const pendingOrders   = orders.filter((o) =>
          ["pending", "placed", "confirmed", "processing"].includes(o.orderStatus),
        );
        const totalSales = deliveredOrders.reduce(
          (sum, o) => sum + Number(o.vendorTotal ?? o.totalAmount ?? 0),
          0,
        );

        const statusMap = orders.reduce((acc, o) => {
          const key = o.orderStatus || "unknown";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        data = {
          totalOrders:     orders.length,
          deliveredOrders: deliveredOrders.length,
          pendingOrders:   pendingOrders.length,
          totalSales,
          ordersByStatus: Object.entries(statusMap).map(([_id, count]) => ({ _id, count })),
        };
      }
      setStats(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

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
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={fetchAnalytics}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );

  const chartData = (stats?.ordersByStatus || []).map((s) => ({
    status: s._id,
    count:  s.count,
    fill:   STATUS_PALETTE[s._id] || "#4f46e5",
  }));

  const statCards = [
    {
      icon: <ShoppingBagIcon />,
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      color: "#1565c0",
      bg: "#e3f2fd",
    },
    {
      icon: <CheckCircleIcon />,
      label: "Delivered",
      value: stats?.deliveredOrders ?? 0,
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      icon: <PendingIcon />,
      label: "Pending / Active",
      value: stats?.pendingOrders ?? 0,
      color: "#d97706",
      bg: "#fff7ed",
    },
    {
      icon: <CurrencyRupeeIcon />,
      label: "Total Revenue",
      value: `₹${Number(stats?.totalSales ?? 0).toLocaleString("en-IN")}`,
      color: "#7c3aed",
      bg: "#f5f3ff",
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#111827">
            Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Insights from your incoming orders
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} size="small" onClick={fetchAnalytics}>
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

      {/* Charts */}
      {chartData.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary">No order data available yet.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Bar Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb", p: 2 }} elevation={0}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Orders by Status (Bar)
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 12, textTransform: "capitalize" }}
                    tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val) => [val, "Orders"]}
                    labelFormatter={(label) => label.charAt(0).toUpperCase() + label.slice(1)}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* Pie Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb", p: 2 }} elevation={0}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Orders by Status (Pie)
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ status, percent }) =>
                      `${status} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.fill || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [val, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Legend
                    formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}