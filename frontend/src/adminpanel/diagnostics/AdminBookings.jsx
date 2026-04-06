import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Box,
} from "@mui/material";
import toast from "react-hot-toast";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL;

export default function AdminRadiologyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_API}/api/radiology/admin/bookings`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      setBookings(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load bookings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Radiology Bookings
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>Test</TableCell>
              <TableCell>Booking Date</TableCell>
              <TableCell>Center</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => (
                <TableRow key={b._id}>
                  <TableCell>{b.patientName}</TableCell>
                  <TableCell>{b.patientMobile}</TableCell>
                  <TableCell>{b.testName}</TableCell>
                  <TableCell>
                    {new Date(b.bookingDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{b.partnerId?.businessName}</TableCell>
                  <TableCell>{b.partnerId?.city}</TableCell>
                  <TableCell>
                    <Chip
                      label={b.status}
                      color={
                        b.status === "REPORT_READY"
                          ? "success"
                          : b.status === "PROCESSING"
                          ? "info"
                          : "warning"
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}
