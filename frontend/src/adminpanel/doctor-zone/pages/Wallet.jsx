import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Paper, Typography, Chip, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Avatar
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Wallet() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/admin/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const approved = res.data.data.filter(d => d.status === "approved");
        setDoctors(approved);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const totalEarnings     = doctors.reduce((sum, d) => sum + (d.wallet?.totalEarnings || 0), 0);
  const totalAvailable    = doctors.reduce((sum, d) => sum + (d.wallet?.availableBalance || 0), 0);
  const doctorsWithWallet = doctors.filter(d => (d.wallet?.totalEarnings || 0) > 0);

  const getInitials = (name = "") =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const summaryCards = [
    { label: "Total Platform Earnings", value: `₹${totalEarnings.toLocaleString()}`, icon: TrendingUpIcon, color: "#0f766e", bg: "#f0fdfa" },
    { label: "Available Balance (All)", value: `₹${totalAvailable.toLocaleString()}`, icon: AccountBalanceWalletIcon, color: "#1d4ed8", bg: "#eff6ff" },
    { label: "Doctors with Earnings",   value: doctorsWithWallet.length, icon: PeopleAltIcon, color: "#7c3aed", bg: "#f5f3ff" },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#0f172a" }}>Wallet Overview</Typography>
        <Typography variant="body2" color="text.secondary">Platform-wide earnings summary</Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2.5, mb: 4 }}>
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Paper key={label} elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: "#0f172a", mt: 0.5 }}>{value}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: bg }}>
                <Icon sx={{ fontSize: 24, color }} />
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Per-Doctor Wallet Table */}
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#0f172a" }}>Doctor-wise Earnings</Typography>
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#0f766e" }} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  {["Doctor", "Specialization", "Total Earnings", "Available Balance", "Transactions", "Status"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 600, color: "#475569", fontSize: 13, py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#94a3b8" }}>No data</TableCell>
                  </TableRow>
                ) : doctors
                    .sort((a, b) => (b.wallet?.totalEarnings || 0) - (a.wallet?.totalEarnings || 0))
                    .map(d => (
                  <TableRow key={d._id} sx={{ "&:hover": { background: "#f8fafc" } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: "#0f766e", fontSize: 13, fontWeight: 600 }}>
                          {getInitials(d.fullName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ color: "#0f172a" }}>{d.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">{d.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{d.specialization || "—"}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: "#0f766e" }}>
                        ₹{(d.wallet?.totalEarnings || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ color: "#1d4ed8" }}>
                        ₹{(d.wallet?.availableBalance || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={d.wallet?.transactions?.length || 0}
                        size="small"
                        sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={d.isActive ? "Active" : "Blocked"}
                        color={d.isActive ? "success" : "error"}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}