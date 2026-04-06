import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  Typography,
  Container,
  Paper,
  TableContainer,
  LinearProgress,
  Alert,
  IconButton,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  useMediaQuery,
  Tooltip,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Skeleton,
  alpha,
} from "@mui/material";
import {
  Block as BlockIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Email as EmailIcon,
} from "@mui/icons-material";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function ApprovedDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [blocking, setBlocking] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));

  const token = localStorage.getItem("adminToken");

  const fetchApprovedDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${BASE_URL}/api/admin/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const approved = res.data.data.filter(
        (d) => d.status === "approved" && d.isActive === true
      );

      setDoctors(approved);
    } catch (err) {
      console.error(err);
      setError("Failed to load doctors. Please try again.");

      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "/login/admin";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedDoctors();
  }, [refresh]);

  const handleBlockClick = (doctor) => {
    setSelectedDoctor(doctor);
    setBlockDialogOpen(true);
  };

  const handleBlockConfirm = async () => {
    if (!selectedDoctor) return;
    
    setBlocking(true);
    try {
      await axios.put(
        `${BASE_URL}/api/admin/doctors/${selectedDoctor._id}/block`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBlockDialogOpen(false);
      setSelectedDoctor(null);
      fetchApprovedDoctors();
    } catch (err) {
      console.error(err);
      setError("Failed to block doctor. Please try again.");
    } finally {
      setBlocking(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.fullName?.toLowerCase().includes(searchTerm) ||
      doctor.email?.toLowerCase().includes(searchTerm) ||
      doctor.specialization?.toLowerCase().includes(searchTerm)
  );

  // Loading skeleton
  const renderSkeletons = () => {
    return Array.from(new Array(isMobile ? 3 : 5)).map((_, index) => (
      <TableRow key={index}>
        <TableCell>
          <Skeleton variant="text" width="60%" />
        </TableCell>
        <TableCell>
          <Skeleton variant="text" width="80%" />
        </TableCell>
        <TableCell>
          <Skeleton variant="text" width="40%" />
        </TableCell>
        <TableCell>
          <Skeleton variant="rectangular" width={60} height={24} />
        </TableCell>
        <TableCell>
          <Skeleton variant="rectangular" width={80} height={32} />
        </TableCell>
      </TableRow>
    ));
  };

  // Mobile card view
  const MobileDoctorCard = ({ doctor }) => (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        '&:hover': {
          boxShadow: theme.shadows[3],
        }
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 56,
              height: 56,
            }}
          >
            <PersonIcon fontSize="medium" />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="600">
              {doctor.fullName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {doctor.email}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Specialization
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <MedicalIcon fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight="500">
                {doctor.specialization}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Box>
              <Chip
                label="Active"
                color="success"
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          </Grid>
        </Grid>

        <Box mt={2}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<BlockIcon />}
            onClick={() => handleBlockClick(doctor)}
            size="small"
          >
            Block Doctor
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      {/* Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, md: 3 },
          mb: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Stack 
          direction={{ xs: "column", md: "row" }} 
          justifyContent="space-between" 
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography 
              variant="h4" 
              fontWeight="700" 
              color="primary"
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
            >
              Approved Doctors
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and monitor approved healthcare professionals
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setRefresh(!refresh)}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<ViewIcon />}
              size={isMobile ? "small" : "medium"}
            >
              Export
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Stats and Search Section */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search doctors by name, email, or specialization..."
              value={searchTerm}
              onChange={handleSearch}
              size={isMobile ? "small" : "medium"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2,
              borderRadius: 2,
              textAlign: "center",
              background: alpha(theme.palette.success.main, 0.08),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            }}
          >
            <Typography variant="h3" fontWeight="700" color="success.main">
              {doctors.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Doctors
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Box mb={3}>
          <LinearProgress sx={{ borderRadius: 1 }} />
        </Box>
      )}

      {/* Content */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        {!loading && filteredDoctors.length === 0 ? (
          <Box 
            sx={{ 
              p: 8, 
              textAlign: "center",
              background: alpha(theme.palette.background.default, 0.5),
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? "No matching doctors found" : "No approved doctors"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? "Try adjusting your search criteria" : "All approved doctors will appear here"}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Desktop Table View */}
            {!isMobile && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Doctor</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Specialization</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      renderSkeletons()
                    ) : (
                      filteredDoctors.map((doctor) => (
                        <TableRow 
                          key={doctor._id}
                          hover
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            }
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                }}
                              >
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body1" fontWeight="500">
                                  {doctor.fullName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {doctor._id?.substring(0, 8)}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{doctor.email}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {doctor.phone || "No phone"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={doctor.specialization}
                              size="small"
                              sx={{
                                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                color: theme.palette.secondary.dark,
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="Active"
                              color="success"
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="View Details">
                                <IconButton size="small" color="primary">
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Block Doctor">
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<BlockIcon />}
                                  onClick={() => handleBlockClick(doctor)}
                                >
                                  Block
                                </Button>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Mobile Card View */}
            {isMobile && !loading && (
              <Box sx={{ p: 2 }}>
                {filteredDoctors.map((doctor) => (
                  <MobileDoctorCard key={doctor._id} doctor={doctor} />
                ))}
              </Box>
            )}

            {isMobile && loading && (
              <Box sx={{ p: 2 }}>
                {Array.from(new Array(3)).map((_, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2 }}>
                    <Skeleton variant="rectangular" width="100%" height={120} />
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}

        {/* Footer Info */}
        {!loading && filteredDoctors.length > 0 && (
          <Box 
            sx={{ 
              p: 2, 
              backgroundColor: alpha(theme.palette.background.default, 0.5),
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              Showing {filteredDoctors.length} of {doctors.length} doctors
              {searchTerm && ` • Filtered by: "${searchTerm}"`}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Block Confirmation Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => !blocking && setBlockDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="h6" fontWeight="600">
            Confirm Block Action
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mt: 2 }}>
            Are you sure you want to block{" "}
            <Typography component="span" fontWeight="600" color="primary">
              {selectedDoctor?.fullName}
            </Typography>
            ?
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action will prevent the doctor from accessing the system and remove them from active listings.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button
            onClick={() => setBlockDialogOpen(false)}
            disabled={blocking}
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBlockConfirm}
            color="error"
            variant="contained"
            disabled={blocking}
            startIcon={<BlockIcon />}
            size={isMobile ? "small" : "medium"}
          >
            {blocking ? "Blocking..." : "Block Doctor"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}