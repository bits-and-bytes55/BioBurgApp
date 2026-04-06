import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Grid, Paper, Typography, CircularProgress, Chip, Avatar,
  LinearProgress,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import MapIcon from "@mui/icons-material/Map";
import WifiIcon from "@mui/icons-material/Wifi";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import PersonIcon from "@mui/icons-material/Person";

const BASE = import.meta.env.VITE_API_BASE_URL;

const StatCard = ({ label, value, icon, color, sub }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3, borderRadius: 3, border: "1.5px solid #f1f5f9",
      background: `linear-gradient(135deg, #fff 60%, ${color}18 100%)`,
      display: "flex", alignItems: "center", gap: 2,
      transition: "box-shadow .2s",
      "&:hover": { boxShadow: "0 4px 24px 0 rgba(0,0,0,.08)" },
    }}
  >
    <Box sx={{
      width: 52, height: 52, borderRadius: "14px",
      background: `${color}1a`, display: "flex",
      alignItems: "center", justifyContent: "center",
      color: color, fontSize: 26,
    }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>
        {value ?? <CircularProgress size={18} />}
      </Typography>
      {sub && <Typography sx={{ fontSize: 12, color: "#64748b", mt: .3 }}>{sub}</Typography>}
    </Box>
  </Paper>
);

export default function DeliveryOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    axios.get(`${BASE}/api/delivery/admin/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => { if (r.data.success) setData(r.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deliveryRate = data?.totalOrders
    ? Math.round((data.deliveredOrders / data.totalOrders) * 100) : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>
            Delivery Zone
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#64748b" }}>
            Live operational overview
          </Typography>
        </Box>
        <Chip
          icon={<WifiIcon sx={{ fontSize: 14 }} />}
          label={`${data?.onlineAgents ?? 0} Agents Online`}
          sx={{ background: "#dcfce7", color: "#16a34a", fontWeight: 700, fontSize: 13 }}
        />
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: "Total Agents", value: data?.totalAgents, icon: <PersonIcon />, color: "#6366f1", sub: `${data?.activeAgents} active` },
          { label: "Total Orders", value: data?.totalOrders, icon: <ShoppingBagIcon />, color: "#f59e0b", sub: `${data?.pendingOrders} pending` },
          { label: "Delivered", value: data?.deliveredOrders, icon: <CheckCircleOutlineIcon />, color: "#10b981", sub: `${deliveryRate}% success rate` },
          { label: "Today's Earnings", value: data ? `₹${data.todayEarnings.toLocaleString("en-IN")}` : null, icon: <CurrencyRupeeIcon />, color: "#ec4899", sub: "Delivery payouts" },
          { label: "Pending Deliveries", value: data?.pendingOrders, icon: <PendingActionsIcon />, color: "#ef4444", sub: "Needs assignment" },
        ].map((s, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* Charts row */}
      <Grid container spacing={2.5}>
        {/* 7-day trend */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1.5px solid #f1f5f9" }}>
            <Typography sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>
              7-Day Order Trend
            </Typography>
            {loading ? (
              <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.sevenDayTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Delivery performance */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1.5px solid #f1f5f9", height: "100%" }}>
            <Typography sx={{ fontWeight: 700, mb: 2.5, color: "#1e293b" }}>
              Performance Overview
            </Typography>
            {[
              { label: "Delivery Success Rate", value: deliveryRate, color: "#10b981" },
              { label: "Agent Availability", value: data?.totalAgents ? Math.round((data.activeAgents / data.totalAgents) * 100) : 0, color: "#6366f1" },
              { label: "Agents Currently Online", value: data?.totalAgents ? Math.round((data.onlineAgents / data.totalAgents) * 100) : 0, color: "#f59e0b" },
            ].map((p, i) => (
              <Box key={i} sx={{ mb: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: .5 }}>
                  <Typography sx={{ fontSize: 13, color: "#64748b" }}>{p.label}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.value}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate" value={p.value}
                  sx={{ height: 8, borderRadius: 4,
                    "& .MuiLinearProgress-bar": { backgroundColor: p.color },
                    backgroundColor: `${p.color}20`,
                  }}
                />
              </Box>
            ))}

            <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #f1f5f9" }}>
              <Typography sx={{ fontSize: 13, color: "#64748b", mb: 1 }}>Quick Status</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { label: "Online", count: data?.onlineAgents, color: "#10b981" },
                  { label: "Pending", count: data?.pendingOrders, color: "#f59e0b" },
                ].map((b, i) => (
                  <Chip key={i} label={`${b.label}: ${b.count ?? 0}`}
                    sx={{ fontSize: 12, fontWeight: 600, background: `${b.color}15`, color: b.color }} />
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}