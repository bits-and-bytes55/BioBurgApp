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
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Stack,
  useMediaQuery,
  useTheme,
  alpha,
  Tooltip,
  TableContainer,
  TablePagination,
  LinearProgress
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
  PersonAdd,
  PersonOff,
  MedicalServices,
  Email,
  AccountCircle,
  Close
} from "@mui/icons-material";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function PendingDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [actionType, setActionType] = useState(""); // "approve" or "reject"
  const [processing, setProcessing] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const token = localStorage.getItem("adminToken");

  const fetchPendingDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${BASE_URL}/api/admin/doctors/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDoctors(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load pending doctors. Please try again.");
      
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "/login/admin";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const handleApprove = async (id) => {
    setProcessing(true);
    try {
      await axios.put(
        `${BASE_URL}/api/admin/doctors/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess("Doctor approved successfully!");
      fetchPendingDoctors();
    } catch (err) {
      console.error(err);
      setError("Failed to approve doctor. Please try again.");
    } finally {
      setProcessing(false);
      setOpenDialog(false);
    }
  };

  const handleReject = async (id) => {
    setProcessing(true);
    try {
      await axios.put(
        `${BASE_URL}/api/admin/doctors/${id}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess("Doctor rejected successfully!");
      fetchPendingDoctors();
    } catch (err) {
      console.error(err);
      setError("Failed to reject doctor. Please try again.");
    } finally {
      setProcessing(false);
      setOpenDialog(false);
    }
  };

  const openActionDialog = (doctor, type) => {
    setSelectedDoctor(doctor);
    setActionType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDoctor(null);
    setActionType("");
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate displayed doctors for pagination
  const displayedDoctors = doctors.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Function to get initials for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Mobile card view for doctor
  const DoctorCard = ({ doctor }) => (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
        }
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Avatar
            sx={{
              bgcolor: theme.palette.warning.main,
              width: 56,
              height: 56,
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            {getInitials(doctor.fullName)}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="600">
              {doctor.fullName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Email fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                {doctor.email}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <MedicalServices fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="body2">
              <strong>Specialization:</strong> {doctor.specialization}
            </Typography>
          </Stack>
          
          <Box>
            <Chip 
              label="Pending Review" 
              color="warning" 
              size="small"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        </Stack>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
        <Tooltip title="Approve Doctor">
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => openActionDialog(doctor, "approve")}
            disabled={processing}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {isSmallMobile ? 'Approve' : 'Approve'}
          </Button>
        </Tooltip>
        
        <Tooltip title="Reject Doctor">
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={() => openActionDialog(doctor, "reject")}
            disabled={processing}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {isSmallMobile ? 'Reject' : 'Reject'}
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              Pending Doctors
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and manage doctor registration requests
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh List">
              <IconButton 
                onClick={fetchPendingDoctors} 
                disabled={loading}
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'background.default' }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="outlined"
              startIcon={<PersonAdd />}
              onClick={fetchPendingDoctors}
              disabled={loading}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
        
        {/* Stats */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 2, 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Typography variant="h4" fontWeight="700" color="primary.main">
                  {doctors.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Requests
                </Typography>
              </Box>
              <AccountCircle sx={{ fontSize: 40, color: 'primary.light' }} />
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress />
          <Typography 
            variant="body2" 
            align="center" 
            sx={{ mt: 2, color: 'text.secondary' }}
          >
            Loading pending doctors...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && doctors.length === 0 && (
        <Paper 
          sx={{ 
            p: 8, 
            textAlign: 'center', 
            borderRadius: 3,
            bgcolor: 'background.default'
          }}
        >
          <PersonOff sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No pending doctors found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            All doctor registration requests have been processed.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchPendingDoctors}
            sx={{ borderRadius: 2, textTransform: 'none', mt: 1 }}
          >
            Refresh
          </Button>
        </Paper>
      )}

      {/* Desktop Table View */}
      {!loading && doctors.length > 0 && !isMobile && (
        <Paper 
          sx={{ 
            width: '100%', 
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }}
        >
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Doctor</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Specialization</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {displayedDoctors.map((doctor) => (
                  <TableRow 
                    key={doctor._id}
                    hover
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.warning.main,
                            width: 40,
                            height: 40,
                            fontWeight: 'bold'
                          }}
                        >
                          {getInitials(doctor.fullName)}
                        </Avatar>
                        <Typography fontWeight="500">
                          {doctor.fullName}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Email fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography>{doctor.email}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={doctor.specialization} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="Pending" 
                        color="warning" 
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Approve">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => openActionDialog(doctor, "approve")}
                            disabled={processing}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Approve
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title="Reject">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => openActionDialog(doctor, "reject")}
                            disabled={processing}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Reject
                          </Button>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={doctors.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        </Paper>
      )}

      {/* Mobile Card View */}
      {!loading && doctors.length > 0 && isMobile && (
        <Box>
          {displayedDoctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
          
          {/* Mobile Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Button
              size="small"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              sx={{ textTransform: 'none' }}
            >
              Previous
            </Button>
            
            <Typography variant="body2" color="text.secondary">
              Page {page + 1} of {Math.ceil(doctors.length / rowsPerPage)}
            </Typography>
            
            <Button
              size="small"
              onClick={() => setPage(Math.min(Math.ceil(doctors.length / rowsPerPage) - 1, page + 1))}
              disabled={page >= Math.ceil(doctors.length / rowsPerPage) - 1}
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="600">
              {actionType === "approve" ? "Approve Doctor" : "Reject Doctor"}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {selectedDoctor && (
            <>
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Avatar
                  sx={{
                    bgcolor: actionType === "approve" ? 'success.main' : 'error.main',
                    width: 48,
                    height: 48,
                    fontWeight: 'bold'
                  }}
                >
                  {getInitials(selectedDoctor.fullName)}
                </Avatar>
                <Box>
                  <Typography fontWeight="600">{selectedDoctor.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDoctor.email}
                  </Typography>
                </Box>
              </Stack>
              
              <DialogContentText id="alert-dialog-description">
                Are you sure you want to {actionType} 
                <Typography component="span" fontWeight="600"> {selectedDoctor.fullName}</Typography>?
                {actionType === "approve" 
                  ? " This will grant them full access to the platform."
                  : " This will reject their registration request."
                }
              </DialogContentText>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => actionType === "approve" ? handleApprove(selectedDoctor._id) : handleReject(selectedDoctor._id)}
            variant="contained"
            color={actionType === "approve" ? "success" : "error"}
            autoFocus
            disabled={processing}
            startIcon={actionType === "approve" ? <CheckCircle /> : <Cancel />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {processing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `${actionType === "approve" ? "Approve" : "Reject"} Doctor`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert 
          onClose={() => setSuccess("")} 
          severity="success" 
          sx={{ borderRadius: 2 }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}