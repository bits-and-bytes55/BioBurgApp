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
  Chip,
  CircularProgress,
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import toast from "react-hot-toast";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL;


export default function AdminRadiologyCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("PENDING"); // PENDING | ALL

  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchCenters();
    // eslint-disable-next-line
  }, [view]);

  // 🔹 FETCH CENTERS
  const fetchCenters = async () => {
    try {
      setLoading(true);

      const url =
        view === "PENDING"
          ? `${BASE_API}/api/radiology/admin/centers/pending`
          : `${BASE_API}/api/radiology/admin/centers`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      setCenters(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load radiology centers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 APPROVE
  const approveCenter = async (partnerId) => {
    try {
      await axios.post(
        `${BASE_API}/api/radiology/admin/partners/approve`,
        { partnerId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      toast.success("Radiology center approved");
      fetchCenters();
    } catch (err) {
      toast.error("Approval failed");
    }
  };

  // 🔹 REJECT
  const rejectCenter = async (partnerId) => {
    try {
      await axios.post(
        `${BASE_API}/api/radiology/admin/partners/reject`,
        { partnerId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      toast.success("Radiology center rejected");
      fetchCenters();
    } catch (err) {
      toast.error("Rejection failed");
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Radiology Centers
        </Typography>

        {/* TOGGLE */}
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(e, val) => val && setView(val)}
          size="small"
        >
          <ToggleButton value="PENDING">Pending</ToggleButton>
          <ToggleButton value="ALL">All</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* LOADER */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Business Name</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {centers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No Radiology Centers Found
                </TableCell>
              </TableRow>
            ) : (
              centers.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>{c.businessName}</TableCell>
                  <TableCell>{c.ownerName}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.mobile}</TableCell>
                  <TableCell>{c.city}</TableCell>
                  <TableCell>{c.businessType}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.status}
                      color={
                        c.status === "APPROVED"
                          ? "success"
                          : c.status === "REJECTED"
                          ? "error"
                          : "warning"
                      }
                      size="small"
                    />
                  </TableCell>

                  <TableCell align="right">
                    {c.status === "PENDING" ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          sx={{ mr: 1 }}
                          onClick={() => approveCenter(c._id)}
                        >
                          Approve
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => rejectCenter(c._id)}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
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
