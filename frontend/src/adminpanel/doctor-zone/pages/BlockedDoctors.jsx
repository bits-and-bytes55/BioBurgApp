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
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Avatar,
  Stack,
  Grid,
} from "@mui/material";
import {
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  MedicalServices as MedicalServicesIcon,
} from "@mui/icons-material";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function BlockedDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));

  const token = localStorage.getItem("adminToken");

  const fetchBlockedDoctors = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const blocked = res.data.data.filter(
        (d) => d.status === "approved" && d.isActive === false
      );
      setDoctors(blocked);
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch blocked doctors");
      
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "/login/admin";
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlockedDoctors();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBlockedDoctors(false);
  };

  const handleUnblockClick = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenDialog(true);
  };

  const handleConfirmUnblock = async () => {
    if (!token) {
      setError("Admin session expired");
      localStorage.removeItem("adminToken");
      window.location.href = "/login/admin";
      return;
    }

    try {
      const res = await axios.put(
        `${BASE_URL}/api/admin/doctors/${selectedDoctor._id}/block`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(res.data.message);
      setOpenDialog(false);
      setSelectedDoctor(null);
      fetchBlockedDoctors(false);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unblock doctor");
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedDoctor(null);
  };

  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  // Mobile/Tablet Card View
  const renderMobileCard = (doctor) => (
    <Card 
      key={doctor._id} 
      sx={{ 
        mb: 2, 
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.error.light }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="600">
                {doctor.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmailIcon fontSize="small" />
                {doctor.email}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MedicalServicesIcon color="action" fontSize="small" />
            <Typography variant="body1">
              {doctor.specialization}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip 
              icon={<BlockIcon />} 
              label="Blocked" 
              color="error" 
              size="small"
              sx={{ fontWeight: 500 }}
            />
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleUnblockClick(doctor)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 2
              }}
            >
              Unblock
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // Desktop Table View
  const renderDesktopTable = () => (
    <Paper 
      sx={{ 
        width: '100%', 
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, py: 2 }}>Doctor</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 2 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 2 }}>Specialization</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 2 }} align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow 
                key={doctor._id}
                sx={{ 
                  '&:hover': { 
                    bgcolor: 'action.hover' 
                  },
                  transition: 'background-color 0.2s'
                }}
              >
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.error.light, width: 40, height: 40 }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography fontWeight="500">
                      {doctor.fullName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Typography color="text.secondary">
                    {doctor.email}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Chip 
                    label={doctor.specialization}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Chip 
                    icon={<BlockIcon />} 
                    label="Blocked" 
                    color="error"
                    sx={{ fontWeight: 500 }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ py: 2 }}>
                  <Tooltip title="Unblock Doctor">
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleUnblockClick(doctor)}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                        px: 2,
                        minWidth: 110
                      }}
                    >
                      Unblock
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ 
        mb: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography 
            variant="h4" 
            fontWeight="700" 
            sx={{ 
              color: theme.palette.text.primary,
              mb: 0.5
            }}
          >
            Blocked Doctors
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage blocked doctor accounts
          </Typography>
        </Box>
        
        <Tooltip title="Refresh list">
          <IconButton 
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'action.disabled' }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Card */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'error.light', 
            color: 'error.contrastText',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.1)'
          }}>
            <CardContent>
              <Typography variant="h3" fontWeight="700">
                {doctors.length}
              </Typography>
              <Typography variant="body1" fontWeight="500">
                Blocked Doctors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loading State */}
      {loading && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 10 
        }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
            Loading blocked doctors...
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!loading && doctors.length === 0 && (
        <Paper 
          sx={{ 
            textAlign: 'center', 
            py: 10, 
            borderRadius: 2,
            bgcolor: 'background.default'
          }}
        >
          <BlockIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Blocked Doctors Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All doctors are currently active
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Paper>
      )}

      {/* Doctors List */}
      {!loading && doctors.length > 0 && (
        <>
          {isMobile ? (
            <Box>
              {doctors.map(renderMobileCard)}
            </Box>
          ) : (
            renderDesktopTable()
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirm Unblock Doctor
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to unblock Dr. {selectedDoctor?.fullName}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will allow the doctor to access their account again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleDialogClose}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleConfirmUnblock}
            startIcon={<CheckCircleIcon />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Yes, Unblock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars for notifications */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          variant="filled"
          sx={{ borderRadius: 1 }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          variant="filled"
          sx={{ borderRadius: 1 }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}