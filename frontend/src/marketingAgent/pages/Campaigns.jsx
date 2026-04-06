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
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  RadioGroup,
  Radio,
  FormGroup,
  Checkbox
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Download,
  Print,
  Share,
  TrendingUp,
  Analytics,
  Campaign,
  People,
  AttachMoney,
  CalendarToday,
  AccessTime,
  LocationOn,
  Business,
  Email,
  Phone,
  WhatsApp,
  CheckCircle,
  Pending,
  Cancel,
  Schedule,
  Star,
  StarBorder,
  FilterList,
  Search,
  ArrowUpward,
  ArrowDownward,
  Sort,
  CloudUpload,
  Image,
  VideoLibrary,
  Link,
  BarChart,
  PieChart,
  ShowChart,
  ThumbUp,
  ThumbDown,
  Comment,
  Share as ShareIcon,
  PersonAdd,
  GroupAdd,
  LocalOffer,
  Flag,
  Archive,
  Unarchive,
  MoreVert,
  Notifications,
  NotificationsOff,
  Timer,
  Speed,
  TrackChanges,
  Leaderboard,
  Insights,
  PieChart as PieChartIcon
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "react-hot-toast";

const Campaigns = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // States
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    completed: 0,
    totalBudget: 0,
    totalLeads: 0
  });

  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "digital",
    channel: "social_media",
    objective: "lead_generation",
    targetAudience: "doctors",
    budget: 0,
    startDate: null,
    endDate: null,
    description: "",
    tags: [],
    status: "draft"
  });

  const token = localStorage.getItem("agentToken");
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL + "/api/agent",
    headers: { Authorization: `Bearer ${token}` }
  });

  // Filter options
  const statusOptions = [
    { value: "all", label: "All Status", color: "default" },
    { value: "draft", label: "Draft", color: "default" },
    { value: "scheduled", label: "Scheduled", color: "info" },
    { value: "active", label: "Active", color: "success" },
    { value: "paused", label: "Paused", color: "warning" },
    { value: "completed", label: "Completed", color: "primary" },
    { value: "cancelled", label: "Cancelled", color: "error" },
  ];

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "digital", label: "Digital Marketing" },
    { value: "field", label: "Field Campaign" },
    { value: "event", label: "Event Marketing" },
    { value: "email", label: "Email Campaign" },
    { value: "sms", label: "SMS Campaign" },
    { value: "social", label: "Social Media" },
    { value: "referral", label: "Referral Program" },
  ];

  const channelOptions = [
    { value: "social_media", label: "Social Media" },
    { value: "email", label: "Email Marketing" },
    { value: "sms", label: "SMS Marketing" },
    { value: "field_visit", label: "Field Visit" },
    { value: "event", label: "Event/Conference" },
    { value: "webinar", label: "Webinar" },
    { value: "referral", label: "Referral Program" },
    { value: "telemarketing", label: "Telemarketing" },
  ];

  const objectiveOptions = [
    { value: "lead_generation", label: "Lead Generation" },
    { value: "brand_awareness", label: "Brand Awareness" },
    { value: "conversion", label: "Conversion" },
    { value: "retention", label: "Customer Retention" },
    { value: "engagement", label: "Engagement" },
    { value: "sales", label: "Direct Sales" },
  ];

  const targetAudienceOptions = [
    { value: "doctors", label: "Doctors" },
    { value: "hospitals", label: "Hospitals" },
    { value: "clinics", label: "Clinics" },
    { value: "medical_stores", label: "Medical Stores" },
    { value: "diagnostic_centers", label: "Diagnostic Centers" },
    { value: "general_public", label: "General Public" },
    { value: "corporate", label: "Corporate Offices" },
  ];

  const tagOptions = [
    "Healthcare", "B2B", "B2C", "Premium", "Budget", "Quick Win", 
    "Long Term", "Seasonal", "Festive", "New Product", "Promotion"
  ];

  // Mock performance data for charts
  const performanceData = [
    { name: 'Week 1', leads: 40, budget: 4000, conversions: 12 },
    { name: 'Week 2', leads: 30, budget: 3000, conversions: 8 },
    { name: 'Week 3', leads: 20, budget: 5000, conversions: 6 },
    { name: 'Week 4', leads: 27, budget: 4500, conversions: 9 },
    { name: 'Week 5', leads: 18, budget: 3500, conversions: 5 },
    { name: 'Week 6', leads: 23, budget: 4200, conversions: 7 },
    { name: 'Week 7', leads: 34, budget: 4800, conversions: 11 }
  ];

  const channelData = [
    { name: 'Social Media', value: 35, color: '#8884d8' },
    { name: 'Email', value: 25, color: '#82ca9d' },
    { name: 'Field Visit', value: 20, color: '#ffc658' },
    { name: 'Events', value: 15, color: '#ff8042' },
    { name: 'Referral', value: 5, color: '#0088fe' }
  ];

  // Fetch campaigns data
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await api.get("/campaigns");
      const campaignsData = response.data.campaigns || [];
      setCampaigns(campaignsData);
      setFilteredCampaigns(campaignsData);
      
      // Calculate stats
      const total = campaignsData.length;
      const active = campaignsData.filter(c => c.status === "active").length;
      const scheduled = campaignsData.filter(c => c.status === "scheduled").length;
      const completed = campaignsData.filter(c => c.status === "completed").length;
      const totalBudget = campaignsData.reduce((sum, c) => sum + (c.budget || 0), 0);
      const totalLeads = campaignsData.reduce((sum, c) => sum + (c.leadsGenerated || 0), 0);
      
      setStats({
        total,
        active,
        scheduled,
        completed,
        totalBudget,
        totalLeads
      });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...campaigns];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(campaign =>
        campaign.name?.toLowerCase().includes(term) ||
        campaign.description?.toLowerCase().includes(term) ||
        campaign.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(campaign => campaign.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter(campaign => campaign.type === typeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle dates
      if (sortField === "startDate" || sortField === "endDate" || sortField === "createdAt") {
        aValue = new Date(a[sortField] || 0);
        bValue = new Date(b[sortField] || 0);
      }

      // Handle numbers
      if (sortField === "budget" || sortField === "leadsGenerated") {
        aValue = a[sortField] || 0;
        bValue = b[sortField] || 0;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCampaigns(result);
  }, [campaigns, searchTerm, statusFilter, typeFilter, sortField, sortDirection]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // View campaign details
  const handleViewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setViewDialogOpen(true);
  };

  // Create new campaign
  const handleCreateCampaign = async () => {
    try {
      await api.post("/campaigns", newCampaign);
      toast.success("Campaign created successfully");
      fetchCampaigns();
      setCreateDialogOpen(false);
      setNewCampaign({
        name: "",
        type: "digital",
        channel: "social_media",
        objective: "lead_generation",
        targetAudience: "doctors",
        budget: 0,
        startDate: null,
        endDate: null,
        description: "",
        tags: [],
        status: "draft"
      });
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  // Update campaign status
  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/campaigns/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchCampaigns();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async () => {
    try {
      await api.delete(`/campaigns/${selectedCampaign._id}`);
      toast.success("Campaign deleted successfully");
      fetchCampaigns();
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete campaign");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Type', 'Status', 'Budget', 'Leads', 'Start Date', 'End Date', 'ROI'];
    const csvData = filteredCampaigns.map(campaign => [
      campaign.name,
      campaign.type,
      campaign.status,
      campaign.budget || 0,
      campaign.leadsGenerated || 0,
      new Date(campaign.startDate).toLocaleDateString(),
      new Date(campaign.endDate).toLocaleDateString(),
      `${((campaign.leadsGenerated || 0) / (campaign.budget || 1) * 100).toFixed(2)}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  // Get status chip
  const getStatusChip = (status) => {
    const statusConfig = {
      'draft': { color: 'default', icon: <Drafts fontSize="small" /> },
      'scheduled': { color: 'info', icon: <Schedule fontSize="small" /> },
      'active': { color: 'success', icon: <PlayArrow fontSize="small" /> },
      'paused': { color: 'warning', icon: <Pause fontSize="small" /> },
      'completed': { color: 'primary', icon: <CheckCircle fontSize="small" /> },
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

  // Get type chip
  const getTypeChip = (type) => {
    const typeConfig = {
      'digital': { color: 'primary', icon: <TrendingUp fontSize="small" /> },
      'field': { color: 'success', icon: <LocationOn fontSize="small" /> },
      'event': { color: 'warning', icon: <CalendarToday fontSize="small" /> },
      'email': { color: 'info', icon: <Email fontSize="small" /> },
      'sms': { color: 'secondary', icon: <Phone fontSize="small" /> },
      'social': { color: 'primary', icon: <ShareIcon fontSize="small" /> },
      'referral': { color: 'success', icon: <GroupAdd fontSize="small" /> }
    };

    const config = typeConfig[type] || { color: 'default', icon: null };

    return (
      <Chip
        icon={config.icon}
        label={type?.replace('_', ' ').charAt(0).toUpperCase() + type?.replace('_', ' ').slice(1)}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Calculate progress percentage
  const calculateProgress = (campaign) => {
    if (campaign.status === 'completed') return 100;
    if (campaign.status === 'cancelled') return 0;
    
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDuration = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.round((elapsed / totalDuration) * 100));
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
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
                  Marketing Campaigns
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Plan, execute, and track all your marketing campaigns
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, md: 0 }, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchCampaigns}
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
                  onClick={() => setCreateDialogOpen(true)}
                >
                  New Campaign
                </Button>
              </Box>
            </Box>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Campaign sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Campaigns
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <PlayArrow sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {stats.active}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Schedule sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                      {stats.scheduled}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Scheduled
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <CheckCircle sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {stats.completed}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Completed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <AttachMoney sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {formatCurrency(stats.totalBudget)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Budget
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ borderRadius: 2, boxShadow: 1, height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <People sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {stats.totalLeads}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Leads
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Analytics Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Campaign Performance Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="conversions" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Channel Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search campaigns by name, description or tags..."
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
                  label="Type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  size="small"
                >
                  {typeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<FilterList />}
                  onClick={() => {}}
                  sx={{ flex: 1 }}
                >
                  Apply Filters
                </Button>
                <Tooltip title="Clear all filters">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setTypeFilter("all");
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
            <Tab label="All Campaigns" />
            <Tab label="Active" />
            <Tab label="Scheduled" />
            <Tab label="High Performance" />
            <Tab label="Need Attention" />
          </Tabs>
        </Box>

        {/* Campaigns List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredCampaigns.length === 0 ? (
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Campaign sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No campaigns found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'No campaigns yet. Start by creating your first campaign!'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Grid container spacing={3}>
              {filteredCampaigns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((campaign) => (
                <Grid item xs={12} key={campaign._id}>
                  <Card sx={{ borderRadius: 3, boxShadow: 2, transition: 'all 0.3s ease', '&:hover': { boxShadow: 4 } }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        {/* Left Column - Campaign Info */}
                        <Grid item xs={12} md={8}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                              <Campaign />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                    {campaign.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {campaign.description?.substring(0, 100)}...
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  {getStatusChip(campaign.status)}
                                  {getTypeChip(campaign.type)}
                                </Box>
                              </Box>

                              {/* Progress Bar */}
                              <Box sx={{ mt: 2, mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Progress
                                  </Typography>
                                  <Typography variant="caption" fontWeight="bold">
                                    {calculateProgress(campaign)}%
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={calculateProgress(campaign)} 
                                  sx={{ height: 6, borderRadius: 3 }}
                                  color={campaign.status === 'active' ? 'success' : 'primary'}
                                />
                              </Box>

                              {/* Campaign Details */}
                              <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="body2">
                                    <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    <strong>Start:</strong> {formatDate(campaign.startDate)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="body2">
                                    <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    <strong>End:</strong> {formatDate(campaign.endDate)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="body2">
                                    <AttachMoney fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    <strong>Budget:</strong> {formatCurrency(campaign.budget || 0)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="body2">
                                    <People fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    <strong>Leads:</strong> {campaign.leadsGenerated || 0}
                                  </Typography>
                                </Grid>
                              </Grid>

                              {/* Tags */}
                              {campaign.tags && campaign.tags.length > 0 && (
                                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {campaign.tags.map((tag, index) => (
                                    <Chip key={index} label={tag} size="small" variant="outlined" />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Grid>

                        {/* Right Column - Actions & Metrics */}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* ROI Metrics */}
                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                ROI
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                {((campaign.leadsGenerated || 0) / (campaign.budget || 1) * 100).toFixed(1)}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Leads per ₹1000
                              </Typography>
                            </Paper>

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                              <Tooltip title="View Details">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Visibility />}
                                  onClick={() => handleViewCampaign(campaign)}
                                  fullWidth
                                >
                                  View
                                </Button>
                              </Tooltip>
                              {campaign.status === 'active' && (
                                <Tooltip title="Pause Campaign">
                                  <IconButton color="warning" size="small">
                                    <Pause />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {campaign.status === 'paused' && (
                                <Tooltip title="Resume Campaign">
                                  <IconButton color="success" size="small">
                                    <PlayArrow />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Analytics">
                                <IconButton color="info" size="small">
                                  <Analytics />
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

            <TablePagination
              component="div"
              count={filteredCampaigns.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ mt: 2 }}
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
            onClick={() => setCreateDialogOpen(true)}
          >
            <Add />
          </Fab>
        )}

        {/* View Campaign Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          {selectedCampaign && (
            <>
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Campaign Details</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {getStatusChip(selectedCampaign.status)}
                  {getTypeChip(selectedCampaign.type)}
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <Campaign fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Campaign Overview
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {selectedCampaign.name}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedCampaign.description}
                    </Typography>

                    {/* Performance Metrics */}
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Total Budget
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(selectedCampaign.budget || 0)}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Leads Generated
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {selectedCampaign.leadsGenerated || 0}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Conversion Rate
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                            {selectedCampaign.conversionRate || '0'}%
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            ROI
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {((selectedCampaign.leadsGenerated || 0) / (selectedCampaign.budget || 1) * 100).toFixed(1)}%
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Timeline */}
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Campaign Timeline
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <CalendarToday color="primary" />
                          <Typography variant="caption" display="block">
                            Start Date
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(selectedCampaign.startDate)}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, mx: 2 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={calculateProgress(selectedCampaign)} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <CalendarToday color="secondary" />
                          <Typography variant="caption" display="block">
                            End Date
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(selectedCampaign.endDate)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Campaign Details
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Channel" secondary={selectedCampaign.channel?.replace('_', ' ').toUpperCase()} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Objective" secondary={selectedCampaign.objective?.replace('_', ' ').toUpperCase()} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Target Audience" secondary={selectedCampaign.targetAudience?.replace('_', ' ').toUpperCase()} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Created On" secondary={formatDate(selectedCampaign.createdAt)} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Last Updated" secondary={formatDate(selectedCampaign.updatedAt)} />
                      </ListItem>
                    </List>

                    {selectedCampaign.tags && selectedCampaign.tags.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Tags
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedCampaign.tags.map((tag, index) => (
                            <Chip key={index} label={tag} size="small" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Grid>
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
                      setSelectedCampaign(selectedCampaign);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Analytics />}
                  >
                    Analytics
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => {
                      setViewDialogOpen(false);
                      setEditDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  {selectedCampaign.status === 'active' && (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<Pause />}
                      onClick={() => handleUpdateStatus(selectedCampaign._id, 'paused')}
                    >
                      Pause
                    </Button>
                  )}
                  {selectedCampaign.status === 'paused' && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<PlayArrow />}
                      onClick={() => handleUpdateStatus(selectedCampaign._id, 'active')}
                    >
                      Resume
                    </Button>
                  )}
                </Box>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Create Campaign Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaign Name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  size="small"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Campaign Type"
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                  size="small"
                >
                  {typeOptions.slice(1).map(option => (
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
                  label="Channel"
                  value={newCampaign.channel}
                  onChange={(e) => setNewCampaign({...newCampaign, channel: e.target.value})}
                  size="small"
                >
                  {channelOptions.map(option => (
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
                  label="Objective"
                  value={newCampaign.objective}
                  onChange={(e) => setNewCampaign({...newCampaign, objective: e.target.value})}
                  size="small"
                >
                  {objectiveOptions.map(option => (
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
                  label="Target Audience"
                  value={newCampaign.targetAudience}
                  onChange={(e) => setNewCampaign({...newCampaign, targetAudience: e.target.value})}
                  size="small"
                >
                  {targetAudienceOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Budget (₹)"
                  type="number"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({...newCampaign, budget: e.target.value})}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={newCampaign.startDate}
                  onChange={(newValue) => setNewCampaign({...newCampaign, startDate: newValue})}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={newCampaign.endDate}
                  onChange={(newValue) => setNewCampaign({...newCampaign, endDate: newValue})}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Initial Status"
                  value={newCampaign.status}
                  onChange={(e) => setNewCampaign({...newCampaign, status: e.target.value})}
                  size="small"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tags</InputLabel>
                  <Select
                    multiple
                    value={newCampaign.tags}
                    onChange={(e) => setNewCampaign({...newCampaign, tags: e.target.value})}
                    label="Tags"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {tagOptions.map((tag) => (
                      <MenuItem key={tag} value={tag}>
                        <Checkbox checked={newCampaign.tags.indexOf(tag) > -1} />
                        <ListItemText primary={tag} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateCampaign}
              disabled={!newCampaign.name || !newCampaign.description}
            >
              Create Campaign
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
              Are you sure you want to delete this campaign? This action cannot be undone.
            </Typography>
            {selectedCampaign && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Deleting: {selectedCampaign.name}
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
              onClick={handleDeleteCampaign}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Summary Footer */}
        {filteredCampaigns.length > 0 && (
          <Card sx={{ mt: 4, borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredCampaigns.length} of {campaigns.length} campaigns
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average ROI: {((stats.totalLeads / (stats.totalBudget || 1)) * 100).toFixed(1)}%
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

export default Campaigns;