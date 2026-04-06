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

const BASE_API = import.meta.env.VITE_API_BASE_URL;
// const BASE_API = import.meta.env.VITE_API_BASE_URL;


export default function AdminRadiologyLabs() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("ALL"); // ALL | PENDING

  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchLabs();
  }, [view]);

  // 🔹 FETCH LABS (ALL / PENDING)
  const fetchLabs = async () => {
    try {
      setLoading(true);

      const url =
        view === "ALL"
          ? `${BASE_API}/api/radiology/admin/partners`
          : `${BASE_API}/api/radiology/admin/partners/pending`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      setLabs(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load radiology labs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 APPROVE
  const approveLab = async (partnerId) => {
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

      toast.success("Radiology lab approved");
      fetchLabs();
    } catch {
      toast.error("Approval failed");
    }
  };

  // 🔹 REJECT
  const rejectLab = async (partnerId) => {
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

      toast.success("Radiology lab rejected");
      fetchLabs();
    } catch {
      toast.error("Rejection failed");
    }
  };

  // 🔹 STATUS CHIP COLOR
  const getStatusChip = (status) => {
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "error";
    return "warning";
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Radiology Labs
        </Typography>

        {/* 🔁 TOGGLE */}
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(e, val) => val && setView(val)}
          size="small"
        >
          <ToggleButton value="ALL">All Labs</ToggleButton>
          <ToggleButton value="PENDING">Pending Only</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Business Name</TableCell>
              <TableCell>Owner Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {labs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No Radiology Labs Found
                </TableCell>
              </TableRow>
            ) : (
              labs.map((lab) => (
                <TableRow key={lab._id}>
                  <TableCell>{lab.businessName}</TableCell>
                  <TableCell>{lab.ownerName}</TableCell>
                  <TableCell>{lab.email}</TableCell>
                  <TableCell>{lab.mobile}</TableCell>
                  <TableCell>{lab.city}</TableCell>

                  <TableCell>
                    <Chip
                      label={lab.status}
                      color={getStatusChip(lab.status)}
                      size="small"
                    />
                  </TableCell>

                  <TableCell align="right">
                    {lab.status === "PENDING" ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          sx={{ mr: 1 }}
                          onClick={() => approveLab(lab._id)}
                        >
                          Approve
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => rejectLab(lab._id)}
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
