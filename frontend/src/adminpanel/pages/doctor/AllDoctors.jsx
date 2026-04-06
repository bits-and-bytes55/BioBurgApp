// pages/admin/Doctors.jsx
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
  Container,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TablePagination,
  useMediaQuery,
  useTheme,
  Skeleton,
  Avatar,
  Stack,
  Badge,
  Menu,
  MenuItem,
  Fade
} from "@mui/material";
import {
  Search,
  FilterList,
  MoreVert,
  CheckCircle,
  Block,
  Person,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Warning,
  VerifiedUser,
  Lock,
  LockOpen,
  PersonAdd,
  Sort
} from "@mui/icons-material";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const token = localStorage.getItem("adminToken");

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/admin/doctors`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDoctors(res.data.data);
      setFilteredDoctors(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch doctors. Please try again.");
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "/login/admin";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filter doctors based on search term and status filter
  useEffect(() => {
    let result = doctors;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(doctor =>
        doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        result = result.filter(doctor => doctor.status === 'approved' && doctor.isActive);
      } else if (statusFilter === 'pending') {
        result = result.filter(doctor => doctor.status === 'pending');
      } else if (statusFilter === 'blocked') {
        result = result.filter(doctor => doctor.status === 'approved' && !doctor.isActive);
      } else if (statusFilter === 'rejected') {
        result = result.filter(doctor => doctor.status === 'rejected');
      }
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredDoctors(result);
    setPage(0); // Reset to first page when filters change
  }, [doctors, searchTerm, statusFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const approveDoctor = async (id) => {
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
      fetchDoctors();
    } catch (err) {
      console.error(err);
      setError("Failed to approve doctor. Please try again.");
    }
  };

  const toggleBlock = async (id) => {
    try {
      await axios.put(
        `${BASE_URL}/api/admin/doctors/${id}/block`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchDoctors();
    } catch (err) {
      console.error(err);
      setError("Failed to update doctor status. Please try again.");
    }
  };

  const handleActionClick = (doctor, action) => {
    setSelectedDoctor(doctor);
    setDialogAction(action);
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleConfirmAction = () => {
    if (selectedDoctor) {
      if (dialogAction === 'approve') {
        approveDoctor(selectedDoctor._id);
      } else if (dialogAction === 'toggleBlock') {
        toggleBlock(selectedDoctor._id);
      }
    }
    setOpenDialog(false);
    setSelectedDoctor(null);
  };

  const handleMenuClick = (event, doctor) => {
    setAnchorEl(event.currentTarget);
    setSelectedDoctor(doctor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDoctor(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (doctor) => {
    if (doctor.status === 'pending') return 'warning';
    if (doctor.status === 'rejected') return 'error';
    if (doctor.status === 'approved' && doctor.isActive) return 'success';
    if (doctor.status === 'approved' && !doctor.isActive) return 'error';
    return 'default';
  };

  const getStatusText = (doctor) => {
    if (doctor.status === 'pending') return 'Pending Review';
    if (doctor.status === 'rejected') return 'Rejected';
    if (doctor.status === 'approved' && doctor.isActive) return 'Active';
    if (doctor.status === 'approved' && !doctor.isActive) return 'Blocked';
    return 'Unknown';
  };

  const getStatusIcon = (doctor) => {
    if (doctor.status === 'pending') return <Warning />;
    if (doctor.status === 'rejected') return <Block />;
    if (doctor.status === 'approved' && doctor.isActive) return <VerifiedUser />;
    if (doctor.status === 'approved' && !doctor.isActive) return <Lock />;
    return <Person />;
  };

  // Mobile Card View
  const MobileDoctorCard = ({ doctor }) => (
    <Card 
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {doctor.fullName?.charAt(0) || <Person />}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="600">
                {doctor.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {doctor.email}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={(e) => handleMenuClick(e, doctor)}>
            <MoreVert />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Chip
            icon={getStatusIcon(doctor)}
            label={getStatusText(doctor)}
            color={getStatusColor(doctor)}
            size="small"
            variant="outlined"
          />
          {doctor.status === 'pending' && (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleActionClick(doctor, 'approve')}
            >
              Approve
            </Button>
          )}
          {doctor.status === 'approved' && (
            <Button
              size="small"
              variant={doctor.isActive ? "outlined" : "contained"}
              color={doctor.isActive ? "error" : "primary"}
              startIcon={doctor.isActive ? <Lock /> : <LockOpen />}
              onClick={() => handleActionClick(doctor, 'toggleBlock')}
            >
              {doctor.isActive ? 'Block' : 'Unblock'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3
        }}>
          <Box>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              Doctors Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and monitor all registered doctors in the system
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchDoctors}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => {/* Add new doctor functionality */}}
            >
              Add Doctor
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Total Doctors</Typography>
                <Typography variant="h4">{doctors.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Active</Typography>
                <Typography variant="h4" color="success.main">
                  {doctors.filter(d => d.status === 'approved' && d.isActive).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Pending</Typography>
                <Typography variant="h4" color="warning.main">
                  {doctors.filter(d => d.status === 'pending').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Blocked</Typography>
                <Typography variant="h4" color="error.main">
                  {doctors.filter(d => d.status === 'approved' && !d.isActive).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter Bar */}
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            mb: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search doctors by name or email..."
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white'
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setStatusFilter('all')}
                  startIcon={<FilterList />}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => setStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'contained' : 'outlined'}
                  color="warning"
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'blocked' ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => setStatusFilter('blocked')}
                >
                  Blocked
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

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

      {/* Loading State */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="80%" />
                    </Box>
                  </Box>
                  <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Results Count */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredDoctors.length} of {doctors.length} doctors
            </Typography>
            {filteredDoctors.length > 0 && !isMobile && (
              <Button
                size="small"
                startIcon={<Sort />}
                onClick={() => handleSort('fullName')}
              >
                Sort by Name {sortConfig.key === 'fullName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </Button>
            )}
          </Box>

          {/* Doctors List - Mobile Cards / Desktop Table */}
          {isMobile ? (
            // Mobile Card View
            <Box sx={{ mb: 3 }}>
              {filteredDoctors.length > 0 ? (
                filteredDoctors
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((doctor) => (
                    <MobileDoctorCard key={doctor._id} doctor={doctor} />
                  ))
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No doctors found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? 'Try adjusting your search' : 'No doctors in the system yet'}
                  </Typography>
                </Paper>
              )}
            </Box>
          ) : (
            // Desktop Table View
            <Paper 
              sx={{ 
                width: '100%', 
                overflow: 'hidden',
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Doctor
                        <IconButton size="small" onClick={() => handleSort('fullName')}>
                          <Sort fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((doctor) => (
                        <TableRow 
                          key={doctor._id} 
                          hover
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                                {doctor.fullName?.charAt(0)}
                              </Avatar>
                              <Typography fontWeight="500">{doctor.fullName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{doctor.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(doctor)}
                              label={getStatusText(doctor)}
                              color={getStatusColor(doctor)}
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Tooltip title="View Details">
                                <IconButton size="small">
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              {doctor.status === 'pending' && (
                                <Tooltip title="Approve Doctor">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    startIcon={<CheckCircle />}
                                    onClick={() => handleActionClick(doctor, 'approve')}
                                    sx={{ borderRadius: 1 }}
                                  >
                                    Approve
                                  </Button>
                                </Tooltip>
                              )}
                              
                              {doctor.status === 'approved' && (
                                <Tooltip title={doctor.isActive ? "Block Doctor" : "Unblock Doctor"}>
                                  <Button
                                    size="small"
                                    variant={doctor.isActive ? "outlined" : "contained"}
                                    color={doctor.isActive ? "error" : "primary"}
                                    startIcon={doctor.isActive ? <Lock /> : <LockOpen />}
                                    onClick={() => handleActionClick(doctor, 'toggleBlock')}
                                    sx={{ borderRadius: 1 }}
                                  >
                                    {doctor.isActive ? 'Block' : 'Unblock'}
                                  </Button>
                                </Tooltip>
                              )}
                              
                              <IconButton size="small" onClick={(e) => handleMenuClick(e, doctor)}>
                                <MoreVert fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Box sx={{ py: 4 }}>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No doctors found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'Try adjusting your search criteria' : 'No doctors have been registered yet'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Pagination */}
          {filteredDoctors.length > 0 && (
            <TablePagination
              component="div"
              count={filteredDoctors.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{
                mt: 2,
                '& .MuiTablePagination-toolbar': {
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }
              }}
            />
          )}
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={() => {/* View details */}}>
          <Visibility fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => {/* Edit doctor */}}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        {selectedDoctor?.status === 'pending' && (
          <MenuItem onClick={() => handleActionClick(selectedDoctor, 'approve')}>
            <CheckCircle fontSize="small" sx={{ mr: 1 }} color="success" /> Approve
          </MenuItem>
        )}
        {selectedDoctor?.status === 'approved' && (
          <MenuItem onClick={() => handleActionClick(selectedDoctor, 'toggleBlock')}>
            {selectedDoctor.isActive ? (
              <>
                <Block fontSize="small" sx={{ mr: 1 }} color="error" /> Block
              </>
            ) : (
              <>
                <LockOpen fontSize="small" sx={{ mr: 1 }} color="success" /> Unblock
              </>
            )}
          </MenuItem>
        )}
        <MenuItem onClick={() => {/* Delete doctor */}} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Action
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction === 'approve' && `Are you sure you want to approve ${selectedDoctor?.fullName}?`}
            {dialogAction === 'toggleBlock' && selectedDoctor?.isActive
              ? `Are you sure you want to block ${selectedDoctor?.fullName}?`
              : `Are you sure you want to unblock ${selectedDoctor?.fullName}?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction} 
            autoFocus
            variant="contained"
            color={dialogAction === 'toggleBlock' && selectedDoctor?.isActive ? 'error' : 'primary'}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}