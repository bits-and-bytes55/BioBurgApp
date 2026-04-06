import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  Avatar,
  Tooltip,
  Skeleton,
  Grid,
} from "@mui/material";
import {
  Edit,
  Delete,
  WorkOutline,
  LocationOn,
  Business,
  AttachMoney,
  Schedule,
  Add,
  Save,
  Close,
} from "@mui/icons-material";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;
const API = `${BASE_API}/api/jobs-manage`;

const EMPTY_FORM = {
  title: "",
  department: "",
  location: "",
  experience: "",
  salary: "",
  jobType: "Full-Time",
  description: "",
};

const JOB_TYPE_STYLES = {
  "Full-Time":  { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  "Part-Time":  { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  Internship:   { bg: "#fef9c3", color: "#a16207", border: "#fef08a" },
  Contract:     { bg: "#f3e8ff", color: "#7c3aed", border: "#e9d5ff" },
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
};

export default function ManageJobs() {
  const [jobs, setJobs]             = useState([]);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      toast.error("Session expired — please log in again.");
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(API, { headers });
      setJobs(res.data.jobs ?? []);
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? "Unauthorized — please log in again."
          : "Failed to fetch jobs.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Job title is required."); return; }
    const headers = getAuthHeaders();
    if (!headers) { toast.error("Session expired."); return; }
    setSubmitting(true);
    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, form, { headers });
        toast.success("Job updated!");
      } else {
        await axios.post(API, form, { headers });
        toast.success("Job created!");
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchJobs();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const headers = getAuthHeaders();
    if (!headers) { toast.error("Session expired."); return; }
    try {
      await axios.delete(`${API}/${id}`, { headers });
      toast.success("Job deleted.");
      fetchJobs();
    } catch { toast.error("Delete failed."); }
  };

  const handleEdit = (job) => {
    setEditingId(job._id);
    setForm(job);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const toggleStatus = async (job) => {
    const headers = getAuthHeaders();
    if (!headers) { toast.error("Session expired."); return; }
    try {
      await axios.put(
        `${API}/${job._id}`,
        { status: job.status === "active" ? "inactive" : "active" },
        { headers }
      );
      toast.success("Status updated.");
      fetchJobs();
    } catch { toast.error("Failed to update status."); }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, maxWidth: 1200, mx: "auto" }}>

      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <Avatar sx={{ bgcolor: "#3b82f6", width: 44, height: 44 }}>
          <WorkOutline />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            Jobs & Careers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage job listings and applications
          </Typography>
        </Box>
        <Box flex={1} />
        <Chip
          label={`${jobs.length} listing${jobs.length !== 1 ? "s" : ""}`}
          size="small"
          sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}
        />
      </Stack>

      {/* Form */}
      <Paper
        elevation={0}
        sx={{
          p: 4, mb: 4, borderRadius: 3,
          border: "1px solid",
          borderColor: editingId ? "#fde68a" : "#e2e8f0",
          bgcolor: editingId ? "#fffbeb" : "#fff",
          transition: "all 0.2s",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: editingId ? "#f59e0b" : "#3b82f6" }}>
            {editingId ? <Save sx={{ fontSize: 16 }} /> : <Add sx={{ fontSize: 16 }} />}
          </Avatar>
          <Typography variant="h6" fontWeight={600}>
            {editingId ? "Edit Job Listing" : "Post a New Job"}
          </Typography>
        </Stack>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Job Title" name="title"
              value={form.title} onChange={handleChange}
              placeholder="e.g. Senior React Developer"
              InputProps={{ startAdornment: <WorkOutline sx={{ color: "#94a3b8", mr: 1, fontSize: 20 }} /> }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Department" name="department"
              value={form.department} onChange={handleChange}
              placeholder="e.g. Engineering"
              InputProps={{ startAdornment: <Business sx={{ color: "#94a3b8", mr: 1, fontSize: 20 }} /> }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Location" name="location"
              value={form.location} onChange={handleChange}
              placeholder="e.g. Mumbai, Remote"
              InputProps={{ startAdornment: <LocationOn sx={{ color: "#94a3b8", mr: 1, fontSize: 20 }} /> }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Experience Required" name="experience"
              value={form.experience} onChange={handleChange}
              placeholder="e.g. 2–4 years"
              InputProps={{ startAdornment: <Schedule sx={{ color: "#94a3b8", mr: 1, fontSize: 20 }} /> }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Salary / CTC" name="salary"
              value={form.salary} onChange={handleChange}
              placeholder="e.g. ₹8–12 LPA"
              InputProps={{ startAdornment: <AttachMoney sx={{ color: "#94a3b8", mr: 1, fontSize: 20 }} /> }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth label="Job Type" name="jobType"
              value={form.jobType} onChange={handleChange}
            >
              {["Full-Time", "Part-Time", "Internship", "Contract"].map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField fullWidth multiline rows={4}
              label="Job Description" name="description"
              value={form.description} onChange={handleChange}
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} mt={3}>
          <Button
            variant="contained" size="large"
            onClick={handleSubmit} disabled={submitting}
            startIcon={editingId ? <Save /> : <Add />}
            sx={{
              textTransform: "none", fontWeight: 600, borderRadius: 2, px: 4,
              bgcolor: editingId ? "#f59e0b" : "#3b82f6",
              "&:hover": { bgcolor: editingId ? "#d97706" : "#2563eb" },
            }}
          >
            {submitting ? (editingId ? "Updating…" : "Creating…") : (editingId ? "Update Job" : "Post Job")}
          </Button>
          {editingId && (
            <Button variant="outlined" size="large" onClick={handleCancel}
              startIcon={<Close />}
              sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
            >
              Cancel
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Table */}
      <Typography variant="h6" fontWeight={600} mb={2}>All Listings</Typography>

      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              {["Position", "Department", "Location", "Type", "Status", "Actions"].map((h) => (
                <TableCell key={h} align={h === "Actions" ? "center" : "left"}
                  sx={{ fontWeight: 700, color: "#475569", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="rounded" height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : jobs.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Stack alignItems="center" spacing={1}>
                      <WorkOutline sx={{ fontSize: 40, color: "#cbd5e1" }} />
                      <Typography color="text.secondary">No jobs posted yet.</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Use the form above to add your first listing.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )
              : jobs.map((job) => {
                  const ts = JOB_TYPE_STYLES[job.jobType] ?? JOB_TYPE_STYLES["Full-Time"];
                  return (
                    <TableRow key={job._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Typography fontWeight={600} fontSize="0.9rem">{job.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize="0.875rem" color="text.secondary">{job.department}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationOn sx={{ fontSize: 14, color: "#94a3b8" }} />
                          <Typography fontSize="0.875rem" color="text.secondary">{job.location}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={job.jobType} size="small"
                          sx={{ bgcolor: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, fontWeight: 600, fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Click to toggle">
                          <Chip
                            label={job.status === "active" ? "Active" : "Inactive"}
                            size="small" onClick={() => toggleStatus(job)}
                            sx={{
                              cursor: "pointer", fontWeight: 600, fontSize: "0.75rem",
                              bgcolor: job.status === "active" ? "#dcfce7" : "#f1f5f9",
                              color: job.status === "active" ? "#15803d" : "#64748b",
                              border: `1px solid ${job.status === "active" ? "#bbf7d0" : "#e2e8f0"}`,
                            }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(job)}
                              sx={{ bgcolor: "#eff6ff", color: "#3b82f6", "&:hover": { bgcolor: "#dbeafe" } }}
                            >
                              <Edit sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(job._id)}
                              sx={{ bgcolor: "#fff1f2", color: "#ef4444", "&:hover": { bgcolor: "#ffe4e6" } }}
                            >
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}