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
  CircularProgress,
  Box,
} from "@mui/material";
import toast from "react-hot-toast";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL;


export default function AdminRadiologyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_API}/api/radiology/admin/reports`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      setReports(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Radiology Reports
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
              <TableCell>Test</TableCell>
              <TableCell>Center</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Report</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No reports uploaded
                </TableCell>
              </TableRow>
            ) : (
              reports.map((r) => (
                <TableRow key={r._id}>
                  <TableCell>{r.bookingId?.patientName}</TableCell>
                  <TableCell>{r.bookingId?.testName}</TableCell>
                  <TableCell>{r.partnerId?.businessName}</TableCell>
                  <TableCell>{r.partnerId?.city}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        window.open(r.reportUrl, "_blank")
                      }
                    >
                      View / Download
                    </Button>
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
