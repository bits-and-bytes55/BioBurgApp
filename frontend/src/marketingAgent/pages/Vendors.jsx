import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Tooltip,
  CircularProgress,
  Alert,
  Badge,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Rating,
  Fab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from "@mui/material";
import {
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  Visibility,
  Phone,
  WhatsApp,
  Email,
  CalendarToday,
  AccessTime,
  LocationOn,
  Business,
  Person,
  CheckCircle,
  Pending,
  Cancel,
  Refresh,
  Download,
  Print,
  Share,
  ArrowUpward,
  ArrowDownward,
  Sort,
  Markunread,
  Drafts,
  Archive,
  Unarchive,
  Star,
  StarBorder,
  NoteAdd,
  AttachFile,
  MoreVert,
  Chat,
  Call,
  Schedule,
  PriorityHigh,
  LowPriority,
  TrendingUp,
  Analytics,
  Group,
  PersonAdd
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { toast } from "react-hot-toast";

const Enquiries = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // States
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    pending: 0,
    resolved: 0,
    highPriority: 0,
    followUpToday: 0
  });

  const token = localStorage.getItem("agentToken");
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL + "/api/agent",
    headers: { Authorization: `Bearer ${token}` }
  });

  // Filter options
  const statusOptions = [
    { value: "all", label: "All Status", color: "default" },
    { value: "new", label: "New", color: "primary" },
    { value: "pending", label: "Pending", color: "warning" },
    { value: "in-progress", label: "In Progress", color: "info" },
    { value: "resolved", label: "Resolved", color: "success" },
    { value: "cancelled", label: "Cancelled", color: "error" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priority" },
    { value: "high", label: "High", color: "error" },
    { value: "medium", label: "Medium", color: "warning" },
    { value: "low", label: "Low", color: "success" },
  ];

  const sourceOptions = [
    { value: "all", label: "All Sources" },
    { value: "website", label: "Website" },
    { value: "phone", label: "Phone Call" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "email", label: "Email" },
    { value: "referral", label: "Referral" },
    { value: "walk-in", label: "Walk-in" },
  ];

  // New enquiry form
  const [newEnquiry, setNewEnquiry] = useState({
    name: "",
    mobile: "",
    email: "",
    source: "phone",
    enquiryType: "general",
    priority: "medium",
    message: "",
    assignedTo: "",
    followUpDate: null,
    notes: ""
  });

  // Fetch enquiries data
  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const response = await api.get("/enquiries");
      const enquiriesData = response.data.enquiries || [];
      setEnquiries(enquiriesData);
      setFilteredEnquiries(enquiriesData);
      
      // Calculate stats
      const total = enquiriesData.length;
      const newCount = enquiriesData.filter(e => e.status === "new").length;
      const pending = enquiriesData.filter(e => e.status === "pending").length;
      const resolved = enquiriesData.filter(e => e.status === "resolved").length;
      const highPriority = enquiriesData.filter(e => e.priority === "high").length;
      const followUpToday = enquiriesData.filter(e => {
        if (!e.followUpDate) return false;
        const today = new Date().toDateString();
        const followUp = new Date(e.followUpDate).toDateString();
        return followUp === today;
      }).length;
      
      setStats({
        total,
        new: newCount,
        pending,
        resolved,
        highPriority,
        followUpToday
      });
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      toast.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...enquiries];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(enquiry =>
        enquiry.name?.toLowerCase().includes(term) ||
        enquiry.mobile?.includes(term) ||
        enquiry.email?.toLowerCase().includes(term) ||
        enquiry.message?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(enquiry => enquiry.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      result = result.filter(enquiry => enquiry.priority === priorityFilter);
    }

    // Apply source filter
    if (sourceFilter !== "all") {
      result = result.filter(enquiry => enquiry.source === sourceFilter);
    }

    // Apply date range filter
    if (dateRange[0] && dateRange[1]) {
      result = result.filter(enquiry => {
        const enquiryDate = new Date(enquiry.createdAt);
        return enquiryDate >= dateRange[0] && enquiryDate <= dateRange[1];
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle dates
      if (sortField === "createdAt" || sortField === "followUpDate") {
        aValue = new Date(a[sortField] || 0);
        bValue = new Date(b[sortField] || 0);
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEnquiries(result);
  }, [enquiries, searchTerm, statusFilter, priorityFilter, sourceFilter, dateRange, sortField, sortDirection]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // View enquiry details
  const handleViewEnquiry = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setViewDialogOpen(true);
  };

  // Create new enquiry
  const handleCreateEnquiry = async () => {
    try {
      await api.post("/enquiries", newEnquiry);
      toast.success("Enquiry created successfully");
      fetchEnquiries();
      setNewDialogOpen(false);
      setNewEnquiry({
        name: "",
        mobile: "",
        email: "",
        source: "phone",
        enquiryType: "general",
        priority: "medium",
        message: "",
        assignedTo: "",
        followUpDate: null,
        notes: ""
      });
    } catch (error) {
      toast.error("Failed to create enquiry");
    }
  };

  // Update enquiry status
  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/enquiries/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchEnquiries();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Delete enquiry
  const handleDeleteEnquiry = async () => {
    try {
      await api.delete(`/enquiries/${selectedEnquiry._id}`);
      toast.success("Enquiry deleted successfully");
      fetchEnquiries();
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete enquiry");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Name', 'Mobile', 'Email', 'Source', 'Type', 'Priority', 'Status', 'Follow-up'];
    const csvData = filteredEnquiries.map(enquiry => [
      new Date(enquiry.createdAt).toLocaleDateString(),
      enquiry.name,
      enquiry.mobile,
      enquiry.email || 'N/A',
      enquiry.source,
      enquiry.enquiryType,
      enquiry.priority,
      enquiry.status,
      enquiry.followUpDate ? new Date(enquiry.followUpDate).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enquiries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  // Get status chip
  const getStatusChip = (status) => {
    const statusConfig = {
      'new': { color: 'primary', icon: <Markunread fontSize="small" /> },
      'pending': { color: 'warning', icon: <Pending fontSize="small" /> },
      'in-progress': { color: 'info', icon: <AccessTime fontSize="small" /> },
      'resolved': { color: 'success', icon: <CheckCircle fontSize="small" /> },
      'cancelled': { color: 'error', icon: <Cancel fontSize="small" /> }
    };

    const config = statusConfig[status] || { color: 'default', icon: null };

    return (
      <Chip
        icon={config.icon}
        label={status?.charAt(0).toUpperCase() + status?.slice(1)}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Get priority chip
  const getPriorityChip = (priority) => {
    const priorityConfig = {
      'high': { color: 'error', icon: <PriorityHigh fontSize="small" /> },
      'medium': { color: 'warning', icon: null },
      'low': { color: 'success', icon: <LowPriority fontSize="small" /> }
    };

    const config = priorityConfig[priority] || { color: 'default', icon: null };

    return (
      <Chip
        icon={config.icon}
        label={priority?.charAt(0).toUpperCase() + priority?.slice(1)}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Get source chip
  const getSourceChip = (source) => {
    const sourceConfig = {
      'website': { icon: <Business fontSize="small" />, color: 'primary' },
      'phone': { icon: <Phone fontSize="small" />, color: 'success' },
      'whatsapp': { icon: <WhatsApp fontSize="small" />, color: 'success' },
      'email': { icon: <Email fontSize="small" />, color: 'info' },
      'referral': { icon: <Group fontSize="small" />, color: 'warning' },
      'walk-in': { icon: <Person fontSize="small" />, color: 'secondary' }
    };

    const config = sourceConfig[source] || { icon: null, color: 'default' };

    return (
      <Chip
        icon={config.icon}
        label={source?.charAt(0).toUpperCase() + source?.slice(1)}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                   Enquiries Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track and manage all customer enquiries and leads
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, md: 0 }, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchEnquiries}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={exportToCSV}
                >
                  Export
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={() => setNewDialogOpen(true)}
                >
                  New Enquiry
                </Button>
              </Box>
            </Box>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Enquiries
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Badge badgeContent={stats.new} color="error" max={99}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {stats.new}
                      </Typography>
                    </Badge>
                    <Typography variant="caption" color="text.secondary">
                      New
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {stats.pending}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {stats.resolved}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Resolved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {stats.highPriority}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      High Priority
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                      {stats.followUpToday}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Follow-up Today
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Filters Section */}
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search by name, mobile, email or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Status"
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
              <Grid item xs={6} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Priority"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  size="small"
                >
                  {priorityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  size="small"
                >
                  {sourceOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => {}}
                  fullWidth
                >
                  Apply
                </Button>
              </Grid>
            </Grid>

            {/* Advanced Filters */}
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <DatePicker
                      label="From Date"
                      value={dateRange[0]}
                      onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                    <DatePicker
                      label="To Date"
                      value={dateRange[1]}
                      onChange={(newValue) => setDateRange([dateRange[0], newValue])}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    size="small"
                    onClick={() => setDateRange([null, null])}
                  >
                    Clear Dates
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setSourceFilter('all');
                      setDateRange([null, null]);
                    }}
                    startIcon={<Delete />}
                  >
                    Clear All
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="All Enquiries" />
            <Tab label="New & Pending" />
            <Tab label="High Priority" />
            <Tab label="Follow-up Today" />
            <Tab label="Resolved" />
          </Tabs>
        </Box>

        {/* Enquiries List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredEnquiries.length === 0 ? (
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <FilterList sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No enquiries found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'No enquiries yet. Start by adding your first enquiry!'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setNewDialogOpen(true)}
              >
                Add First Enquiry
              </Button>
            </CardContent>
          </Card>
        ) : isMobile ? (
          // Mobile View
          <List>
            {filteredEnquiries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((enquiry) => (
              <Card key={enquiry._id} sx={{ mb: 2, borderRadius: 3, boxShadow: 2 }}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      {enquiry.name?.charAt(0) || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {enquiry.name}
                        </Typography>
                        <Box>
                          {getStatusChip(enquiry.status)}
                          {getPriorityChip(enquiry.priority)}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" component="span">
                            <Phone fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {enquiry.mobile}
                          </Typography>
                          {enquiry.email && (
                            <Typography variant="body2" component="div">
                              <Email fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              {enquiry.email}
                            </Typography>
                          )}
                          <Typography variant="body2" component="div">
                            <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {formatDate(enquiry.createdAt)} {formatTime(enquiry.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Source: {getSourceChip(enquiry.source)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                          "{enquiry.message?.substring(0, 100)}..."
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleViewEnquiry(enquiry)}>
                      <Visibility />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Card>
            ))}
          </List>
        ) : (
          // Desktop Table View
          <>
            <TableContainer component={Card} sx={{ borderRadius: 3, boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleSort('createdAt')}
                        startIcon={<Sort />}
                        endIcon={sortField === 'createdAt' ? (sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />) : null}
                      >
                        Date & Time
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleSort('name')}
                        startIcon={<Sort />}
                        endIcon={sortField === 'name' ? (sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />) : null}
                      >
                        Customer
                      </Button>
                    </TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Follow-up</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEnquiries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((enquiry) => (
                    <TableRow
                      key={enquiry._id}
                      hover
                      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {formatDate(enquiry.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(enquiry.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                            {enquiry.name?.charAt(0) || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {enquiry.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {enquiry._id?.slice(-6)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            <Phone fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {enquiry.mobile}
                          </Typography>
                          {enquiry.email && (
                            <Typography variant="body2" color="text.secondary">
                              <Email fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              {enquiry.email}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {getSourceChip(enquiry.source)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={enquiry.enquiryType}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {getPriorityChip(enquiry.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(enquiry.status)}
                      </TableCell>
                      <TableCell>
                        {enquiry.followUpDate ? (
                          <Chip
                            icon={<Schedule fontSize="small" />}
                            label={formatDate(enquiry.followUpDate)}
                            size="small"
                            color={new Date(enquiry.followUpDate) < new Date() ? 'error' : 'default'}
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Not set
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewEnquiry(enquiry)}
                              color="info"
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Call">
                            <IconButton
                              size="small"
                              onClick={() => window.open(`tel:${enquiry.mobile}`)}
                              color="success"
                            >
                              <Call fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => window.open(`https://wa.me/${enquiry.mobile}`)}
                              color="success"
                            >
                              <WhatsApp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedEnquiry(enquiry);
                                setDeleteDialogOpen(true);
                              }}
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredEnquiries.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            onClick={() => setNewDialogOpen(true)}
          >
            <Add />
          </Fab>
        )}

        {/* View Enquiry Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedEnquiry && (
            <>
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Enquiry Details</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {getStatusChip(selectedEnquiry.status)}
                  {getPriorityChip(selectedEnquiry.priority)}
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <Person fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Customer Information
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedEnquiry.name}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <Phone fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      {selectedEnquiry.mobile}
                    </Typography>
                    {selectedEnquiry.email && (
                      <Typography variant="body2" gutterBottom>
                        <Email fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        {selectedEnquiry.email}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <Business fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Enquiry Details
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Source: {getSourceChip(selectedEnquiry.source)}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Type: {selectedEnquiry.enquiryType}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Created: {formatDate(selectedEnquiry.createdAt)} at {formatTime(selectedEnquiry.createdAt)}
                    </Typography>
                    {selectedEnquiry.followUpDate && (
                      <Typography variant="body2" gutterBottom>
                        Follow-up: {formatDate(selectedEnquiry.followUpDate)}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <NoteAdd fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Message
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <Typography variant="body1">
                        {selectedEnquiry.message}
                      </Typography>
                    </Paper>
                  </Grid>

                  {selectedEnquiry.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <NoteAdd fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Internal Notes
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                        <Typography variant="body2">
                          {selectedEnquiry.notes}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'space-between' }}>
                <Box>
                  <Button onClick={() => setViewDialogOpen(false)}>
                    Close
                  </Button>
                  <Button
                    color="error"
                    onClick={() => {
                      setViewDialogOpen(false);
                      setSelectedEnquiry(selectedEnquiry);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Phone />}
                    onClick={() => window.open(`tel:${selectedEnquiry.mobile}`)}
                  >
                    Call
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<WhatsApp />}
                    onClick={() => window.open(`https://wa.me/${selectedEnquiry.mobile}`)}
                    color="success"
                  >
                    WhatsApp
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleUpdateStatus(selectedEnquiry._id, 'resolved')}
                    disabled={selectedEnquiry.status === 'resolved'}
                  >
                    Mark Resolved
                  </Button>
                </Box>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* New Enquiry Dialog */}
        <Dialog
          open={newDialogOpen}
          onClose={() => setNewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add New Enquiry</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  value={newEnquiry.name}
                  onChange={(e) => setNewEnquiry({...newEnquiry, name: e.target.value})}
                  size="small"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={newEnquiry.mobile}
                  onChange={(e) => setNewEnquiry({...newEnquiry, mobile: e.target.value})}
                  size="small"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={newEnquiry.email}
                  onChange={(e) => setNewEnquiry({...newEnquiry, email: e.target.value})}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Source"
                  value={newEnquiry.source}
                  onChange={(e) => setNewEnquiry({...newEnquiry, source: e.target.value})}
                  size="small"
                >
                  {sourceOptions.slice(1).map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Enquiry Type"
                  value={newEnquiry.enquiryType}
                  onChange={(e) => setNewEnquiry({...newEnquiry, enquiryType: e.target.value})}
                  size="small"
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="service">Service</MenuItem>
                  <MenuItem value="pricing">Pricing</MenuItem>
                  <MenuItem value="support">Support</MenuItem>
                  <MenuItem value="complaint">Complaint</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Priority"
                  value={newEnquiry.priority}
                  onChange={(e) => setNewEnquiry({...newEnquiry, priority: e.target.value})}
                  size="small"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={3}
                  value={newEnquiry.message}
                  onChange={(e) => setNewEnquiry({...newEnquiry, message: e.target.value})}
                  size="small"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="Follow-up Date"
                  value={newEnquiry.followUpDate}
                  onChange={(newValue) => setNewEnquiry({...newEnquiry, followUpDate: newValue})}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Internal Notes"
                  multiline
                  rows={2}
                  value={newEnquiry.notes}
                  onChange={(e) => setNewEnquiry({...newEnquiry, notes: e.target.value})}
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateEnquiry}
              disabled={!newEnquiry.name || !newEnquiry.mobile || !newEnquiry.message}
            >
              Create Enquiry
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this enquiry? This action cannot be undone.
            </Typography>
            {selectedEnquiry && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Deleting: {selectedEnquiry.name} - {selectedEnquiry.mobile}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteEnquiry}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Summary Footer */}
        {filteredEnquiries.length > 0 && (
          <Card sx={{ mt: 4, borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredEnquiries.length} of {enquiries.length} enquiries
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last updated: {new Date().toLocaleTimeString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Enquiries;