import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Badge,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  Business,
  Person,
  Phone,
  LocationOn,
  CalendarToday,
  AttachMoney,
  CheckCircle,
  Pending,
  Cancel,
  FilterList,
  Search,
  Download,
  Share,
  Visibility,
  Edit,
  Delete,
  WhatsApp,
  Email,
  Map,
  TrendingUp,
  Refresh,
  Star,
  StarBorder,
  Image,
  AccessTime,
  DirectionsCar
} from "@mui/icons-material";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const token = localStorage.getItem("agentToken");

  const statusOptions = [
    { value: "all", label: "All Leads" },
    { value: "completed", label: "Completed", color: "success" },
    { value: "pending", label: "Pending", color: "warning" },
    { value: "followup", label: "Follow-up", color: "info" },
    { value: "cancelled", label: "Cancelled", color: "error" },
  ];

  const sortOptions = [
    { value: "date", label: "Most Recent" },
    { value: "distance", label: "Distance (High to Low)" },
    { value: "name", label: "Hospital Name" },
    { value: "status", label: "Status" },
  ];

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          "https://bioburglifescience-1.onrender.com/api/agent/leads",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const leadsData = res.data.leads || [];
        setLeads(leadsData);
        setFilteredLeads(leadsData);
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...leads];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(lead =>
        lead.hospitalName?.toLowerCase().includes(term) ||
        lead.doctorName?.toLowerCase().includes(term) ||
        lead.area?.toLowerCase().includes(term) ||
        lead.partner?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(lead => lead.jobStatus?.toLowerCase() === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.jobStartTime || b.createdAt) - new Date(a.jobStartTime || a.createdAt);
        case "distance":
          return (b.totalDistanceKm || 0) - (a.totalDistanceKm || 0);
        case "name":
          return (a.hospitalName || "").localeCompare(b.hospitalName || "");
        case "status":
          return (a.jobStatus || "").localeCompare(b.jobStatus || "");
        default:
          return 0;
      }
    });

    setFilteredLeads(result);
  }, [leads, searchTerm, statusFilter, sortBy]);

  const handleViewLead = (lead) => {
    setSelectedLead(lead);
    setViewDialogOpen(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "https://bioburglifescience-1.onrender.com/api/agent/leads",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setLeads(res.data.leads || []);
    } catch (error) {
      console.error("Error refreshing leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportLeads = () => {
    const headers = ["Hospital", "Doctor", "Contact", "Location", "Status", "Distance", "Date"];
    const csvData = filteredLeads.map(lead => [
      lead.hospitalName || "N/A",
      lead.doctorName || "N/A",
      lead.mobile || "N/A",
      `${lead.area || ""}, ${lead.district || ""}`,
      lead.jobStatus || "N/A",
      lead.totalDistanceKm || 0,
      new Date(lead.jobStartTime || lead.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      'completed': { color: 'success', icon: <CheckCircle fontSize="small" /> },
      'pending': { color: 'warning', icon: <Pending fontSize="small" /> },
      'followup': { color: 'info', icon: <AccessTime fontSize="small" /> },
      'cancelled': { color: 'error', icon: <Cancel fontSize="small" /> }
    };

    const config = statusConfig[status?.toLowerCase()] || { color: 'default', icon: null };

    return (
      <Chip
        icon={config.icon}
        label={status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                Leads Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track and manage all your completed leads and customer contacts
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, md: 0 }, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportLeads}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<TrendingUp />}
              >
                Analytics
              </Button>
            </Box>
          </Box>

          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {leads.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Leads
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {leads.filter(l => l.jobStatus === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {leads.filter(l => l.jobStatus === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {leads.filter(l => l.jobStatus === 'followup').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Follow-up
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search leads by hospital, doctor, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
              >
                {sortOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={1}>
              <Tooltip title="Clear filters">
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setSortBy("date");
                  }}
                >
                  Clear
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="All Leads" />
          <Tab label="Recent" />
          <Tab label="High Priority" />
          <Tab label="Need Follow-up" />
        </Tabs>
      </Box>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <FilterList sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No leads found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your filters"
                : "No completed leads yet. Start by completing your first job!"}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredLeads.map((lead, index) => (
            <Grid item xs={12} key={lead.id || index}>
              <Card 
                sx={{ 
                  borderRadius: 3, 
                  boxShadow: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    {/* Left Column - Lead Info */}
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.light',
                            width: 56,
                            height: 56
                          }}
                        >
                          <Business />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {lead.hospitalName || "N/A"}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <Business fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                {lead.partner}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {getStatusChip(lead.jobStatus)}
                              <Tooltip title="Priority">
                                <IconButton size="small">
                                  {lead.priority ? <Star color="warning" /> : <StarBorder />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <Person fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                <strong>Doctor:</strong> {lead.doctorName} ({lead.degree})
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <Phone fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                <strong>Mobile:</strong> {lead.mobile || "N/A"}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                <strong>Location:</strong> {lead.area}, {lead.district}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <DirectionsCar fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                <strong>Distance:</strong> {lead.totalDistanceKm || 0} KM
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                <strong>Date:</strong> {formatDate(lead.jobStartTime)}
                              </Typography>
                            </Grid>
                            {lead.commission && (
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2">
                                  <AttachMoney fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                  <strong>Commission:</strong> ₹{lead.commission}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Right Column - Actions & Image */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {lead.hospitalImage && (
                          <Box sx={{ textAlign: 'center' }}>
                            <img
                              src={lead.hospitalImage}
                              alt="hospital"
                              style={{
                                width: '100%',
                                maxWidth: 200,
                                borderRadius: 8,
                                border: '1px solid #e0e0e0'
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Hospital Photo
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                          <Tooltip title="View Details">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleViewLead(lead)}
                              fullWidth
                            >
                              View
                            </Button>
                          </Tooltip>
                          <Tooltip title="Call">
                            <IconButton color="primary" size="small">
                              <Phone />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="WhatsApp">
                            <IconButton color="success" size="small">
                              <WhatsApp />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton color="error" size="small">
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* View Lead Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedLead && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Lead Details</Typography>
              <Box>
                {getStatusChip(selectedLead.jobStatus)}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    <Business fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Hospital/Store Information
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLead.hospitalName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Partner Type: {selectedLead.partner}
                  </Typography>
                  
                  {selectedLead.hospitalImage && (
                    <Box sx={{ mt: 2 }}>
                      <img
                        src={selectedLead.hospitalImage}
                        alt="hospital"
                        style={{ maxWidth: '100%', borderRadius: 8 }}
                      />
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    <Person fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Contact Person
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLead.doctorName} ({selectedLead.degree})
                  </Typography>
                  <Typography variant="body2">
                    <Phone fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    {selectedLead.mobile}
                  </Typography>
                  {selectedLead.email && (
                    <Typography variant="body2">
                      <Email fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      {selectedLead.email}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Location Details
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedLead.area}, {selectedLead.district}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    State: {selectedLead.state || "N/A"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedLead.address}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    <DirectionsCar fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Job Details
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Distance Traveled: {selectedLead.totalDistanceKm || 0} KM
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Job Status: {selectedLead.jobStatus}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Date: {formatDate(selectedLead.jobStartTime)}
                  </Typography>
                  {selectedLead.commission && (
                    <Typography variant="body2" gutterBottom>
                      Commission: ₹{selectedLead.commission}
                    </Typography>
                  )}
                </Grid>

                {selectedLead.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Additional Notes
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {selectedLead.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<WhatsApp />}
                color="success"
              >
                WhatsApp
              </Button>
              <Button
                variant="contained"
                startIcon={<Phone />}
                color="primary"
              >
                Call Now
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Summary Footer */}
      {filteredLeads.length > 0 && (
        <Card sx={{ mt: 4, borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredLeads.length} of {leads.length} leads
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}