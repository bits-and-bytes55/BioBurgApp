import { Grid, Paper, Typography, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";

const BASE_API = import.meta.env.VITE_API_BASE_URL;
// local ke liye:
// const BASE_API = import.meta.env.VITE_API_BASE_URL;

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("labToken"); // lab token

        const res = await axios.get(
          `${BASE_API}/api/labs/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: "Total Tests", value: stats?.totalTests },
    { label: "Total Bookings", value: stats?.totalBookings },
    { label: "Pending Reports", value: stats?.pendingReports },
    { label: "Profile Status", value: stats?.profileStatus }
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((item) => (
        <Grid item xs={12} md={3} key={item.label}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {item.label}
            </Typography>

            {loading ? (
              <CircularProgress size={22} sx={{ mt: 1 }} />
            ) : (
              <Typography variant="h5" fontWeight="bold">
                {item.value ?? "-"}
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
