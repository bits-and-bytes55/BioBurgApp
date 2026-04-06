import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  IconButton,
  Avatar,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
  Fade,
  TextField,
  InputAdornment,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import {
  CheckCircle,
  Visibility,
  PendingActions,
  Search,
  LocationOn,
  Email,
  Phone,
  Refresh,
  Business,
} from "@mui/icons-material";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL;

export default function PendingPathologyLabs() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [approvingId, setApprovingId] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, total: 0 });
  const theme = useTheme();

  const token = localStorage.getItem("adminToken");

  // 🔹 Fetch only pending labs
  const fetchPendingLabs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_API}/api/admin/pathology/labs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        const pendingLabs = res.data.data.filter(
          (lab) => lab.status === "INACTIVE"
        );
        setLabs(pendingLabs);
        
        // Calculate stats
        const total = res.data.data.length;
        const approved = res.data.data.filter(lab => lab.status === "ACTIVE").length;
        setStats({
          pending: pendingLabs.length,
          approved,
          total
        });
      }
    } catch (err) {
      console.error("FETCH PENDING LABS ERROR 👉", err);
      toast.error("Failed to load pending labs");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Approve lab
  const approveLab = async (labId) => {
    setApprovingId(labId);
    try {
      const res = await axios.patch(
        `${BASE_API}/api/admin/pathology/labs/${labId}/status`,
        { status: "ACTIVE" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        toast.success("Lab approved successfully!");
        fetchPendingLabs(); // refresh
      }
    } catch (err) {
      console.error("APPROVE LAB ERROR 👉", err);
      toast.error("Approval failed. Please try again.");
    } finally {
      setApprovingId(null);
    }
  };

  // 🔹 View lab details
  const viewLabDetails = (lab) => {
    toast.success(`Viewing details for ${lab.fullName}`, {
      icon: '👁️',
    });
    // In a real app, this would open a modal or navigate to details page
    console.log("Lab details:", lab);
  };

  useEffect(() => {
    if (token) fetchPendingLabs();
  }, [token]);

  // Filter labs based on search term
  const filteredLabs = labs.filter(
    (lab) =>
      lab.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Custom styles
  const styles = {
    gradientHeader: {
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
      color: "white",
      borderRadius: "12px 12px 0 0",
      padding: "24px",
    },
    statCard: {
      borderRadius: 2,
      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
    },
    tableRow: {
      transition: "background-color 0.2s ease",
      "&:hover": {
        backgroundColor: alpha(theme.palette.primary.light, 0.04),
      },
    },
    statusChip: {
      fontWeight: 600,
      letterSpacing: "0.5px",
    },
  };

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ maxWidth: "1400px", margin: "0 auto", p: { xs: 2, md: 3 } }}>
        {/* Header Section */}
        <Paper sx={styles.gradientHeader} elevation={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h4" fontWeight="700" gutterBottom>
                <PendingActions sx={{ verticalAlign: "middle", mr: 1.5 }} />
                Lab Pending Dashboard
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Review and approve pathology lab registration requests
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchPendingLabs}
              sx={{
                bgcolor: "white",
                color: theme.palette.primary.main,
                "&:hover": { bgcolor: "white", opacity: 0.9 },
              }}
            >
              Refresh
            </Button>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ ...styles.statCard, borderLeft: `4px solid ${theme.palette.warning.main}` }}>
                <CardContent>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    PENDING REVIEW
                  </Typography>
                  <Typography variant="h3" fontWeight="700" color="warning.main">
                    {stats.pending}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <PendingActions fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">Awaiting approval</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ ...styles.statCard, borderLeft: `4px solid ${theme.palette.success.main}` }}>
                <CardContent>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    APPROVED LABS
                  </Typography>
                  <Typography variant="h3" fontWeight="700" color="success.main">
                    {stats.approved}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <CheckCircle fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">Actively operating</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ ...styles.statCard, borderLeft: `4px solid ${theme.palette.info.main}` }}>
                <CardContent>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    TOTAL LABS
                  </Typography>
                  <Typography variant="h3" fontWeight="700" color="info.main">
                    {stats.total}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Business fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">Registered in system</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Content */}
        <Paper sx={{ 
          borderRadius: "0 0 12px 12px", 
          overflow: "hidden",
          boxShadow: `0 8px 40px ${alpha(theme.palette.common.black, 0.06)}`,
        }}>
          {/* Toolbar */}
          <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider", bgcolor: "background.default" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search labs by name, email, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "background.paper",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" justifyContent="flex-end" alignItems="center">
                  <Chip
                    label={`${filteredLabs.length} result${filteredLabs.length !== 1 ? 's' : ''}`}
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {searchTerm && `Searching for: "${searchTerm}"`}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Content */}
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={8}>
                <CircularProgress size={60} thickness={4} />
                <Typography variant="h6" mt={3} color="textSecondary">
                  Loading pending labs...
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Please wait while we fetch the latest requests
                </Typography>
              </Box>
            ) : filteredLabs.length === 0 ? (
              <Box textAlign="center" py={8}>
                {searchTerm ? (
                  <>
                    <Search sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No labs found for "{searchTerm}"
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Try adjusting your search criteria
                    </Typography>
                  </>
                ) : (
                  <>
                    <CheckCircle sx={{ fontSize: 80, color: "success.light", mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No pending labs to review
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      All lab registration requests have been processed
                    </Typography>
                    <Alert severity="success" sx={{ mt: 3, maxWidth: 500, mx: "auto" }}>
                      Great job! You're all caught up with lab approvals.
                    </Alert>
                  </>
                )}
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 750 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.light, 0.08) }}>
                      <TableCell sx={{ fontWeight: 700, py: 2 }}>LAB DETAILS</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 2 }}>CONTACT</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 2 }}>LOCATION</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 2 }}>STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 2 }} align="center">ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLabs.map((lab) => (
                      <TableRow key={lab._id} sx={styles.tableRow}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                mr: 2,
                              }}
                            >
                              {lab.fullName?.charAt(0).toUpperCase() || "L"}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="600">
                                {lab.fullName}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                ID: {lab._id?.substring(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            <Box display="flex" alignItems="center">
                              <Email fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                              <Typography variant="body2">{lab.email}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center">
                              <Phone fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                              <Typography variant="body2">{lab.mobile || "Not provided"}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LocationOn fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                            <Typography variant="body2">
                              {lab.address?.city || "City not specified"}
                              {lab.address?.state ? `, ${lab.address.state}` : ""}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="PENDING APPROVAL"
                            color="warning"
                            sx={styles.statusChip}
                            icon={<PendingActions />}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => viewLabDetails(lab)}
                                sx={{
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  "&:hover": { bgcolor: alpha(theme.palette.info.main, 0.2) },
                                }}
                              >
                                <Visibility fontSize="small" color="info" />
                              </IconButton>
                            </Tooltip>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={
                                approvingId === lab._id ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <CheckCircle />
                                )
                              }
                              onClick={() => approveLab(lab._id)}
                              disabled={approvingId === lab._id}
                              sx={{
                                bgcolor: "success.main",
                                "&:hover": { bgcolor: "success.dark" },
                                px: 2,
                              }}
                            >
                              {approvingId === lab._id ? "Approving..." : "Approve"}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {/* Footer */}
          {filteredLabs.length > 0 && !loading && (
            <Box sx={{ 
              p: 2, 
              borderTop: 1, 
              borderColor: "divider",
              bgcolor: "background.default",
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center" 
            }}>
              <Typography variant="body2" color="textSecondary">
                Tip: Review all details before approving a lab
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  // Bulk approve action (would need implementation)
                  toast.success("Bulk approval feature would be implemented here");
                }}
              >
                Bulk Approve Selected
              </Button>
            </Box>
          )}
        </Paper>

        {/* Empty State Illustration (hidden by default) */}
        <Box sx={{ textAlign: "center", mt: 4, opacity: 0.7 }}>
          <Typography variant="caption" color="textSecondary">
            © 2024 Pathology Management System • Secure Admin Dashboard v2.0
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
}