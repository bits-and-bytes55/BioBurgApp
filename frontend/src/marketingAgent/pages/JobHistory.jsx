import React, { useState, useEffect, useCallback } from "react";
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
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  FilterList,
  Search,
  CalendarToday,
  LocationOn,
  Business,
  Person,
  Phone,
  WhatsApp,
  DirectionsCar,
  AccessTime,
  Edit,
  Delete,
  Visibility,
  Download,
  Refresh,
  Print,
  CheckCircle,
  Pending,
  Cancel,
  TrendingUp,
  AttachMoney,
  ClearAll,
  ArrowUpward,
  ArrowDownward,
  Sort,
} from "@mui/icons-material";
import { toast } from "react-hot-toast";

const JobHistory = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState("dutyDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    totalDistance: 0,
    totalCommission: 0,
  });

  // ── API instance (memoised so it doesn't re-create on every render) ──
  const getApi = useCallback(() => {
    const token = localStorage.getItem("agentToken");
    return axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL + "/api/agent",
      headers: { Authorization: `Bearer ${token}` },
    });
  }, []);

  const dateRanges = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "completed", label: "Completed" },
    { value: "in-progress", label: "In Progress" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // ── Fetch ──
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const api = getApi();
      const response = await api.get("/job/history");
      const jobsData = response.data?.jobs ?? [];
      setJobs(jobsData);
      setFilteredJobs(jobsData);
      setStats({
        total: jobsData.length,
        completed: jobsData.filter((j) => j.status === "completed").length,
        pending: jobsData.filter((j) => j.status === "pending").length,
        cancelled: jobsData.filter((j) => j.status === "cancelled").length,
        totalDistance: jobsData.reduce(
          (s, j) => s + (j.totalDistanceKm || 0),
          0,
        ),
        totalCommission: jobsData.reduce((s, j) => s + (j.commission || 0), 0),
      });
    } catch (error) {
      const msg =
        error.response?.status === 404
          ? "API route not found — check your server route /api/agent/job/history"
          : error.response?.status === 401
            ? "Session expired — please log in again"
            : error.response?.data?.message || "Failed to load job history";
      console.error("JobHistory fetch error:", error);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [getApi]);

  // single call on mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ── Filtering / sorting ──
  useEffect(() => {
    let result = [...jobs];
    const now = new Date();

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (j) =>
          j.hospitalName?.toLowerCase().includes(term) ||
          j.doctorName?.toLowerCase().includes(term) ||
          j.address?.toLowerCase().includes(term) ||
          j.area?.toLowerCase().includes(term),
      );
    }

    if (statusFilter !== "all")
      result = result.filter((j) => j.status === statusFilter);

    if (dateFilter !== "all") {
      result = result.filter((j) => {
        const d = new Date(j.dutyDate);
        switch (dateFilter) {
          case "today":
            return d.toDateString() === now.toDateString();
          case "yesterday": {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            return d.toDateString() === y.toDateString();
          }
          case "week": {
            const w = new Date(now);
            w.setDate(w.getDate() - 7);
            return d >= w;
          }
          case "month": {
            const m = new Date(now);
            m.setMonth(m.getMonth() - 1);
            return d >= m;
          }
          case "lastMonth": {
            const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const e = new Date(now.getFullYear(), now.getMonth(), 0);
            return d >= s && d <= e;
          }
          case "quarter": {
            const q = new Date(now);
            q.setMonth(q.getMonth() - 3);
            return d >= q;
          }
          case "year": {
            const yr = new Date(now);
            yr.setFullYear(yr.getFullYear() - 1);
            return d >= yr;
          }
          default:
            return true;
        }
      });
    }

    result.sort((a, b) => {
      const av = sortField === "dutyDate" ? new Date(a.dutyDate) : a[sortField];
      const bv = sortField === "dutyDate" ? new Date(b.dutyDate) : b[sortField];
      return sortDirection === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });

    setFilteredJobs(result);
  }, [jobs, searchTerm, statusFilter, dateFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    setSortField(field);
    setSortDirection((prev) =>
      sortField === field && prev === "desc" ? "asc" : "desc",
    );
  };

  const handleDeleteJob = async () => {
    try {
      await getApi().delete(`/job/${selectedJob._id}`);
      toast.success("Job deleted successfully");
      setDeleteDialogOpen(false);
      fetchJobs();
    } catch {
      toast.error("Failed to delete job");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Hospital",
      "Doctor",
      "Location",
      "Status",
      "Distance (KM)",
      "Commission",
    ];
    const rows = filteredJobs.map((j) => [
      j.dutyDate,
      j.hospitalName,
      j.doctorName,
      j.area,
      j.status,
      j.totalDistanceKm || 0,
      j.commission || 0,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `job-history-${new Date().toISOString().split("T")[0]}.csv`,
    });
    a.click();
    toast.success("CSV exported");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setSortField("dutyDate");
    setSortDirection("desc");
    toast.success("Filters cleared");
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const getStatusChip = (status) => {
    const cfg = {
      completed: { color: "success", icon: <CheckCircle fontSize="small" /> },
      "in-progress": {
        color: "warning",
        icon: <AccessTime fontSize="small" />,
      },
      pending: { color: "info", icon: <Pending fontSize="small" /> },
      cancelled: { color: "error", icon: <Cancel fontSize="small" /> },
    };
    const { color = "default", icon = null } = cfg[status] || {};
    return (
      <Chip
        icon={icon}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };

  const SortBtn = ({ field, label }) => (
    <Button
      size="small"
      onClick={() => handleSort(field)}
      startIcon={<Sort />}
      endIcon={
        sortField === field ? (
          sortDirection === "asc" ? (
            <ArrowUpward />
          ) : (
            <ArrowDownward />
          )
        ) : null
      }
    >
      {label}
    </Button>
  );

  // ── Stats card data ──
  const statCards = [
    { value: stats.total, label: "Total Jobs", color: "primary.main" },
    { value: stats.completed, label: "Completed", color: "success.main" },
    { value: stats.pending, label: "Pending", color: "warning.main" },
    { value: stats.cancelled, label: "Cancelled", color: "error.main" },
    {
      value: stats.totalDistance.toFixed(1),
      label: "Total KM",
      color: "info.main",
    },
    {
      value: `₹${stats.totalCommission}`,
      label: "Total Commission",
      color: "success.main",
    },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 3 } }}>
      {/* ── Header ── */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "primary.main", mb: 0.5 }}
              >
                Job History
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track and manage all your field job records
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: { xs: 2, md: 0 },
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchJobs}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportToCSV}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={() => window.print()}
              >
                Print
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── Stats Cards — MUI Grid v2 (size prop, no item/xs/sm/md) ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((s, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 2 }}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%" }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: "bold", color: s.color }}
                >
                  {s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Filters ── */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search jobs by hospital, doctor, or location…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <Search sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                {statusOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                label="Date Range"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                size="small"
              >
                {dateRanges.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<FilterList />}
                sx={{ flex: 1 }}
              >
                Apply Filters
              </Button>
              <Tooltip title="Clear all filters">
                <IconButton onClick={clearFilters} color="primary">
                  <ClearAll />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="All Jobs" />
          <Tab label="This Week" />
          <Tab label="This Month" />
          <Tab label="High Commission" />
          <Tab label="Pending Actions" />
        </Tabs>
      </Box>

      {/* ── Table / Empty / Loader ── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredJobs.length === 0 ? (
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ textAlign: "center", py: 8 }}>
            <FilterList sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No jobs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                ? "Try adjusting your filters"
                : "Start by creating your first job"}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <TableContainer
            component={Card}
            sx={{ borderRadius: 3, boxShadow: 3 }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "grey.50" }}>
                  <TableCell>
                    <SortBtn field="dutyDate" label="Date" />
                  </TableCell>
                  <TableCell>
                    <SortBtn field="hospitalName" label="Hospital/Store" />
                  </TableCell>
                  <TableCell>Doctor/Contact</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>
                    <SortBtn field="totalDistanceKm" label="Distance" />
                  </TableCell>
                  <TableCell>Commission</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredJobs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((job) => (
                    <TableRow
                      key={job._id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedJob(job);
                        setViewDialogOpen(true);
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(job.dutyDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.dutyTime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: "primary.light",
                            }}
                          >
                            <Business fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {job.hospitalName || "N/A"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {job.partner}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          <Person
                            fontSize="small"
                            sx={{ verticalAlign: "middle", mr: 0.5 }}
                          />
                          {job.doctorName || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.degree}
                        </Typography>
                        {job.mobile && (
                          <Typography variant="caption" display="block">
                            <Phone
                              fontSize="small"
                              sx={{ verticalAlign: "middle", mr: 0.5 }}
                            />
                            {job.mobile}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          <LocationOn
                            fontSize="small"
                            sx={{ verticalAlign: "middle", mr: 0.5 }}
                          />
                          {job.area || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.district}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(job.status)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={<DirectionsCar fontSize="small" />}
                          label={`${job.totalDistanceKm || 0} KM`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {job.commission ? (
                          <Chip
                            icon={<AttachMoney fontSize="small" />}
                            label={`₹${job.commission}`}
                            color="success"
                            size="small"
                            variant="filled"
                            sx={{ fontWeight: "bold" }}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            justifyContent: "center",
                          }}
                        >
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJob(job);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJob(job);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJob(job);
                                setDeleteDialogOpen(true);
                              }}
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
            count={filteredJobs.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </>
      )}

      {/* ── View Dialog ── */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Job Details</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {getStatusChip(selectedJob.status)}
                {selectedJob.commission && (
                  <Chip
                    icon={<AttachMoney fontSize="small" />}
                    label={`₹${selectedJob.commission}`}
                    color="success"
                    size="small"
                  />
                )}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    <CalendarToday
                      fontSize="small"
                      sx={{ verticalAlign: "middle", mr: 1 }}
                    />
                    Date &amp; Time
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedJob.dutyDate)} at {selectedJob.dutyTime}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    <Business
                      fontSize="small"
                      sx={{ verticalAlign: "middle", mr: 1 }}
                    />
                    Hospital/Store
                  </Typography>
                  <Typography variant="body1">
                    {selectedJob.hospitalName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Type: {selectedJob.partner}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    <Person
                      fontSize="small"
                      sx={{ verticalAlign: "middle", mr: 1 }}
                    />
                    Doctor/Contact
                  </Typography>
                  <Typography variant="body1">
                    {selectedJob.doctorName} ({selectedJob.degree})
                  </Typography>
                  <Typography variant="body2">
                    <Phone
                      fontSize="small"
                      sx={{ verticalAlign: "middle", mr: 1 }}
                    />
                    {selectedJob.mobile}
                  </Typography>
                  {selectedJob.whatsapp && (
                    <Typography variant="body2">
                      <WhatsApp
                        fontSize="small"
                        sx={{ verticalAlign: "middle", mr: 1 }}
                      />
                      {selectedJob.whatsapp}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    <LocationOn
                      fontSize="small"
                      sx={{ verticalAlign: "middle", mr: 1 }}
                    />
                    Location
                  </Typography>
                  <Typography variant="body2">
                    {selectedJob.area}, {selectedJob.district},{" "}
                    {selectedJob.state}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedJob.address}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    <DirectionsCar
                      fontSize="small"
                      sx={{ verticalAlign: "middle", mr: 1 }}
                    />
                    Distance &amp; Tracking
                  </Typography>
                  <Typography variant="body2">
                    Start KM: {selectedJob.startKm || 0}
                  </Typography>
                  <Typography variant="body2">
                    Close KM: {selectedJob.closeKm || 0}
                  </Typography>
                  <Typography variant="body2">
                    Total: {selectedJob.totalDistanceKm || 0} KM
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    <TrendingUp
                      fontSize="small"
                      sx={{ verticalAlign: "middle", mr: 1 }}
                    />
                    Performance
                  </Typography>
                  <Typography variant="body2">
                    Commission: ₹{selectedJob.commission || 0}
                  </Typography>
                  <Typography variant="body2">
                    Duration: {selectedJob.duration || "N/A"}
                  </Typography>
                </Grid>
                {selectedJob.hospitalImage && (
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Hospital Image
                    </Typography>
                    <img
                      src={selectedJob.hospitalImage.url}
                      alt="Hospital"
                      style={{ maxWidth: "100%", borderRadius: 8 }}
                    />
                  </Grid>
                )}
                {selectedJob.notes && (
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Additional Notes
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                      {selectedJob.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => {
                  setViewDialogOpen(false);
                  setEditDialogOpen(true);
                }}
              >
                Edit Job
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this job record? This action cannot
            be undone.
          </Typography>
          {selectedJob && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Deleting: {selectedJob.hospitalName} —{" "}
              {formatDate(selectedJob.dutyDate)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteJob}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Footer ── */}
      {filteredJobs.length > 0 && (
        <Card sx={{ mt: 4, borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Showing {filteredJobs.length} of {jobs.length} jobs
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  align="center"
                >
                  Avg Commission: ₹
                  {(stats.totalCommission / (stats.total || 1)).toFixed(2)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  align="right"
                >
                  Last Updated: {new Date().toLocaleTimeString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default JobHistory;
