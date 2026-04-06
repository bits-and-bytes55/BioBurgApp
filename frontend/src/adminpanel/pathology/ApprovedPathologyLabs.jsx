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
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Grid,
  Card,
  CardContent,
  Divider,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ApprovedIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import axios from "axios";
import toast from "react-hot-toast";
import { format } from "date-fns";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL;


export default function ApprovedPathologyLabs() {
  const [labs, setLabs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [selectedLab, setSelectedLab] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivateDialog, setDeactivateDialog] = useState(false);
  const [labToDeactivate, setLabToDeactivate] = useState(null);

  const theme = useTheme();
  const token = localStorage.getItem("adminToken");

  // 🔹 Fetch only approved labs
  const fetchApprovedLabs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_API}/api/admin/pathology/labs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        const approvedLabs = res.data.data.filter(
          (lab) => lab.status === "ACTIVE"
        );
        setLabs(approvedLabs);
        setFilteredLabs(approvedLabs);
      }
    } catch (err) {
      console.error("FETCH APPROVED LABS ERROR 👉", err);
      toast.error("Failed to load approved labs");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Deactivate lab
  const deactivateLab = async (labId) => {
    try {
      const res = await axios.patch(
        `${BASE_API}/api/admin/pathology/labs/${labId}/status`,
        { status: "INACTIVE" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        toast.success("Lab deactivated successfully");
        fetchApprovedLabs();
        setDeactivateDialog(false);
        setLabToDeactivate(null);
      }
    } catch (err) {
      console.error("DEACTIVATE LAB ERROR 👉", err);
      toast.error("Deactivation failed");
    }
  };

  // 🔹 Filter and search labs
  useEffect(() => {
    let results = labs;

    // Apply search filter
    if (searchTerm) {
      results = results.filter(
        (lab) =>
          lab.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lab.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lab.mobile?.includes(searchTerm) ||
          lab.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply city filter
    if (cityFilter !== "all") {
      results = results.filter((lab) => lab.address?.city === cityFilter);
    }

    setFilteredLabs(results);
  }, [searchTerm, cityFilter, labs]);

  // 🔹 Get unique cities for filter
  const cities = [...new Set(labs.map((lab) => lab.address?.city).filter(Boolean))];

  // 🔹 Handle lab details view
  const handleViewLabDetails = (lab) => {
    setSelectedLab(lab);
    setDialogOpen(true);
  };

  // 🔹 Handle deactivate confirmation
  const handleDeactivateClick = (lab) => {
    setLabToDeactivate(lab);
    setDeactivateDialog(true);
  };

  // 🔹 Get lab avatar color based on name
  const getAvatarColor = (name) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  useEffect(() => {
    if (token) fetchApprovedLabs();
  }, [token]);

  return (
    <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          color: "white",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Approved Pathology Labs
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage and monitor approved laboratory accounts
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" fontWeight="bold">
              {filteredLabs.length} Active Labs
            </Typography>
            <Tooltip title="Refresh">
              <IconButton
                onClick={fetchApprovedLabs}
                sx={{ color: "white", bgcolor: alpha("#fff", 0.2) }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Total Approved Labs
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {labs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Active Today
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {labs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Cities Covered
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {cities.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="textPrimary">
                {format(new Date(), "hh:mm a")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
          <SearchIcon color="action" />
          <TextField
            placeholder="Search labs by name, email, city or phone..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 400 }}
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <FilterIcon color="action" />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All Cities</MenuItem>
              {cities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Main Content */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={10}
          >
            <CircularProgress size={60} />
            <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
              Loading approved labs...
            </Typography>
          </Box>
        ) : filteredLabs.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={10}
          >
            <ApprovedIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No approved labs found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchTerm || cityFilter !== "all"
                ? "Try adjusting your filters"
                : "All approved labs will appear here"}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: theme.palette.grey[50],
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  }}
                >
                  <TableCell sx={{ fontWeight: "bold", py: 2 }}>LAB DETAILS</TableCell>
                  <TableCell sx={{ fontWeight: "bold", py: 2 }}>CONTACT</TableCell>
                  <TableCell sx={{ fontWeight: "bold", py: 2 }}>LOCATION</TableCell>
                  <TableCell sx={{ fontWeight: "bold", py: 2 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: "bold", py: 2 }} align="center">
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLabs.map((lab) => (
                  <TableRow
                    key={lab._id}
                    hover
                    sx={{
                      "&:last-child td": { borderBottom: 0 },
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            bgcolor: getAvatarColor(lab.fullName),
                            width: 40,
                            height: 40,
                          }}
                        >
                          {lab.fullName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {lab.fullName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            ID: {lab._id?.slice(-8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          display="flex"
                          alignItems="center"
                          gap={1}
                          mb={0.5}
                        >
                          <EmailIcon fontSize="small" color="action" />
                          {lab.email}
                        </Typography>
                        <Typography
                          variant="body2"
                          display="flex"
                          alignItems="center"
                          gap={1}
                        >
                          <PhoneIcon fontSize="small" color="action" />
                          {lab.mobile}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          display="flex"
                          alignItems="center"
                          gap={1}
                        >
                          <LocationIcon fontSize="small" color="action" />
                          {lab.address?.city || "Not specified"}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {lab.address?.state || ""}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<ApprovedIcon />}
                        label="ACTIVE"
                        size="small"
                        color="success"
                        sx={{
                          fontWeight: "bold",
                          px: 1,
                          "& .MuiChip-icon": { color: "inherit" },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewLabDetails(lab)}
                            sx={{
                              color: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deactivate Lab">
                          <IconButton
                            size="small"
                            onClick={() => handleDeactivateClick(lab)}
                            sx={{
                              color: theme.palette.error.main,
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                            }}
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Lab Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedLab && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    bgcolor: getAvatarColor(selectedLab.fullName),
                    width: 50,
                    height: 50,
                  }}
                >
                  {selectedLab.fullName?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedLab.fullName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pathology Laboratory
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Contact Information
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">{selectedLab.email}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{selectedLab.mobile}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Address
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {selectedLab.address?.street
                        ? `${selectedLab.address.street}, ${selectedLab.address.city}`
                        : selectedLab.address?.city || "Not specified"}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {selectedLab.address?.state} {selectedLab.address?.pincode}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    icon={<ApprovedIcon />}
                    label="ACTIVE & APPROVED"
                    color="success"
                    sx={{ fontWeight: "bold" }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => setDialogOpen(false)}
                variant="outlined"
                color="inherit"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setDialogOpen(false);
                  handleDeactivateClick(selectedLab);
                }}
                variant="contained"
                color="error"
                startIcon={<BlockIcon />}
              >
                Deactivate Lab
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={deactivateDialog}
        onClose={() => setDeactivateDialog(false)}
        maxWidth="xs"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <BlockIcon color="error" />
            <Typography variant="h6" fontWeight="bold">
              Deactivate Lab
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate{" "}
            <strong>{labToDeactivate?.fullName}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This action will mark the lab as INACTIVE and they won't be able to
            access the system.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeactivateDialog(false)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => deactivateLab(labToDeactivate._id)}
            variant="contained"
            color="error"
            autoFocus
          >
            Confirm Deactivation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}