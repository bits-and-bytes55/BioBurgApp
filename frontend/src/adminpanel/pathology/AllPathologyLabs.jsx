import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Alert,
  LinearProgress,
  alpha,
  useTheme
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Visibility,
  Edit,
  Refresh,
  Search,
  FilterList,
  Business,
  Email,
  Phone,
  LocationOn
} from "@mui/icons-material";
import axios from "axios";
import toast from "react-hot-toast";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL;


export default function PathologyRegistrations() {
  const [labs, setLabs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLab, setSelectedLab] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });
  const theme = useTheme();

  // 🔐 ADMIN TOKEN
  const token = localStorage.getItem("adminToken");

  // 🚨 SAFETY CHECK
  useEffect(() => {
    if (!token) {
      toast.error("Admin not logged in");
    }
  }, [token]);

  // 🔹 FETCH ALL LABS
  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BASE_API}/api/admin/pathology/labs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        const labsData = res.data.data;
        setLabs(labsData);
        setFilteredLabs(labsData);
        calculateStats(labsData);
      } else {
        toast.error("Failed to fetch labs");
      }
    } catch (err) {
      console.error("FETCH LAB ERROR 👉", err);
      toast.error(
        err?.response?.data?.message || "Unauthorized / Server error"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔹 CALCULATE STATISTICS
  const calculateStats = (labsData) => {
    const active = labsData.filter(lab => lab.status === "ACTIVE").length;
    const inactive = labsData.filter(lab => lab.status === "INACTIVE").length;
    setStats({
      active,
      inactive,
      total: labsData.length
    });
  };

  // 🔹 UPDATE LAB STATUS
  const updateStatus = async (labId, status) => {
    try {
      const res = await axios.patch(
        `${BASE_API}/api/admin/pathology/labs/${labId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        toast.success(`Lab ${status === "ACTIVE" ? "approved" : "rejected"} successfully`);
        fetchLabs(); // refresh list
      } else {
        toast.error("Status update failed");
      }
    } catch (err) {
      console.error("STATUS UPDATE ERROR 👉", err);
      toast.error(
        err?.response?.data?.message || "Unauthorized / Server error"
      );
    }
  };

  // 🔹 VIEW LAB DETAILS
  const handleViewLab = (lab) => {
    setSelectedLab(lab);
    setViewDialogOpen(true);
  };

  // 🔹 FILTER AND SEARCH
  useEffect(() => {
    let filtered = labs;

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(lab => lab.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lab =>
        lab.fullName?.toLowerCase().includes(term) ||
        lab.email?.toLowerCase().includes(term) ||
        lab.mobile?.includes(term) ||
        lab.address?.city?.toLowerCase().includes(term)
      );
    }

    setFilteredLabs(filtered);
  }, [searchTerm, statusFilter, labs]);

  // 🔄 INITIAL LOAD
  useEffect(() => {
    if (token) fetchLabs();
  }, [token]);

  // 🎨 STYLES
  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE": return { bg: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main };
      case "INACTIVE": return { bg: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main };
      default: return { bg: alpha(theme.palette.grey[500], 0.1), color: theme.palette.grey[700] };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER SECTION */}
      <Paper 
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold">
              🧪 Pathology Lab Registrations
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Manage and monitor laboratory registrations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchLabs}
            sx={{
              bgcolor: 'white',
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: alpha('#fff', 0.9)
              }
            }}
          >
            Refresh Data
          </Button>
        </Box>

        {/* STATS CARDS */}
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Labs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {stats.active}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Labs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main" fontWeight="bold">
                  {stats.inactive}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* FILTERS AND SEARCH */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search labs by name, email, city or phone..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <FilterList sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredLabs.length} of {labs.length} labs
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* MAIN TABLE */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading lab registrations...
            </Typography>
          </Box>
        ) : filteredLabs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No pathology labs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {labs.length === 0 ? "No labs registered yet" : "Try adjusting your filters"}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Lab Details
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Contact Info
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        City
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Status
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Actions
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLabs.map((lab) => (
                    <TableRow 
                      key={lab._id}
                      hover
                      sx={{
                        '&:last-child td': { borderBottom: 0 },
                        '&:hover': { bgcolor: theme.palette.action.hover }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), mr: 2 }}>
                            <Business sx={{ color: theme.palette.primary.main }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {lab.fullName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {lab._id?.substring(0, 8)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" mb={0.5}>
                            <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">{lab.email}</Typography>
                          </Box>
                          <Box display="flex" alignItems="center">
                            <Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">{lab.mobile}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography>{lab.address?.city || "-"}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lab.status}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(lab.status).bg,
                            color: getStatusColor(lab.status).color,
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewLab(lab)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {lab.status === "ACTIVE" ? (
                            <Tooltip title="Deactivate Lab">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Cancel />}
                                onClick={() => updateStatus(lab._id, "INACTIVE", lab.fullName)}
                                color="error"
                              >
                                Reject
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Approve Lab">
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<CheckCircle />}
                                onClick={() => updateStatus(lab._id, "ACTIVE", lab.fullName)}
                                color="success"
                              >
                                Approve
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      {/* LAB DETAILS DIALOG */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedLab && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <Business sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Lab Details</Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Lab Name
                          </Typography>
                          <Typography variant="body1">
                            {selectedLab.fullName}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Registration ID
                          </Typography>
                          <Typography variant="body1" fontFamily="monospace">
                            {selectedLab._id}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Contact Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Email Address
                          </Typography>
                          <Typography variant="body1">
                            {selectedLab.email}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Mobile Number
                          </Typography>
                          <Typography variant="body1">
                            {selectedLab.mobile}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Address
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            City
                          </Typography>
                          <Typography variant="body1">
                            {selectedLab.address?.city || "Not specified"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                          <Chip
                            label={selectedLab.status}
                            color={selectedLab.status === "ACTIVE" ? "success" : "warning"}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              {selectedLab.status === "ACTIVE" ? (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => {
                    updateStatus(selectedLab._id, "INACTIVE", selectedLab.fullName);
                    setViewDialogOpen(false);
                  }}
                >
                  Deactivate Lab
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => {
                    updateStatus(selectedLab._id, "ACTIVE", selectedLab.fullName);
                    setViewDialogOpen(false);
                  }}
                >
                  Approve Lab
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}