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
  Select,
  MenuItem,
} from "@mui/material";

export default function LabBookings() {
  const [bookings, setBookings] = useState([]);
  const token = localStorage.getItem("labToken");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const res = await axios.get(
      "https://bioburglifescience-1.onrender.com/api/bookings/my-bookings",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setBookings(res.data.data);
  };

  const updateStatus = async (id, status) => {
    await axios.put(
      `https://bioburglifescience-1.onrender.com/api/bookings/${id}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    fetchBookings();
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight="bold">
        My Bookings
      </Typography>

      <Table sx={{ mt: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>Mobile</TableCell>
            <TableCell>Test</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b._id}>
              <TableCell>{b.patientName}</TableCell>
              <TableCell>{b.patientMobile}</TableCell>
              <TableCell>{b.testName}</TableCell>
              <TableCell>
                {new Date(b.bookingDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Select
                  size="small"
                  value={b.status}
                  onChange={(e) =>
                    updateStatus(b._id, e.target.value)
                  }
                >
                  <MenuItem value="BOOKED">BOOKED</MenuItem>
                  <MenuItem value="COLLECTED">COLLECTED</MenuItem>
                  <MenuItem value="PROCESSING">PROCESSING</MenuItem>
                  <MenuItem value="REPORT_READY">REPORT READY</MenuItem>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
