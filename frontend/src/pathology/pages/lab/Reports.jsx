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
  Button,
  Box,
  TextField,
} from "@mui/material";

// const API_BASE = import.meta.env.VITE_API_BASE_URL + "/api";
const API_BASE = import.meta.env.VITE_API_BASE_URL;


export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [bookingId, setBookingId] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("labToken");

  useEffect(() => {
    fetchReports();
  }, []);

  /* ================= FETCH REPORTS ================= */
  const fetchReports = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/reports/my-reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReports(res.data.data || []);
    } catch (err) {
      alert("Failed to load reports");
      console.error(err.response?.data || err.message);
    }
  };

  /* ================= FILE TO BASE64 ================= */
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  /* ================= UPLOAD REPORT ================= */
  const handleUpload = async () => {
    if (!bookingId || !file) {
      alert("Booking ID and file required");
      return;
    }

    try {
      setLoading(true);

      const base64 = await convertToBase64(file);

      await axios.post(
        `${API_BASE}/reports/upload`,
        {
          bookingId,
          fileBase64: base64,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Report uploaded successfully");
      setBookingId("");
      setFile(null);
      fetchReports();
    } catch (err) {
      alert("Upload failed");
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight="bold">
        My Reports
      </Typography>

      {/* ================= UPLOAD SECTION ================= */}
      <Box sx={{ mt: 3, mb: 4 }}>
        <Typography fontWeight="bold" mb={1}>
          Upload Report
        </Typography>

        <TextField
          label="Booking ID"
          fullWidth
          sx={{ mb: 2 }}
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
        />

        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload Report"}
        </Button>
      </Box>

      {/* ================= REPORTS TABLE ================= */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>Test</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3}>No reports found</TableCell>
            </TableRow>
          ) : (
            reports.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{r.bookingId?.patientName}</TableCell>
                <TableCell>{r.bookingId?.testName}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    onClick={() => window.open(r.reportUrl, "_blank")}
                  >
                    View / Download
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
