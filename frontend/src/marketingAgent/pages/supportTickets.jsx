import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  FormHelperText, Chip, IconButton, Tooltip, CircularProgress,
  Paper, Divider, Badge, Alert, Snackbar, Grid, InputAdornment,
  Collapse, Card, CardContent, CardHeader, Avatar,
  LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from "@mui/material";
import {
  Add, Close, Search, FilterList, Refresh, AttachFile,
  ExpandMore, ExpandLess, SupportAgent, Schedule, CheckCircle,
  PendingActions, ErrorOutline, ConfirmationNumber, Person,
  Category, PriorityHigh, Notes, Send, Visibility,
  Edit, Delete
} from "@mui/icons-material";

const API = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem("agentToken");

const CATEGORY_OPTIONS = [
  "Technical Issue",
  "Billing & Payments",
  "Product Query",
  "Order Issue",
  "GPS / Tracking Problem",
  "Account Access",
  "Performance Dispute",
  "Training Request",
  "Other",
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

const STATUS_OPTIONS = ["All", "open", "in_progress", "resolved", "closed"];

const STATUS_COLORS = {
  open: { bg: "#fef3c7", color: "#d97706", label: "Open" },
  in_progress: { bg: "#dbeafe", color: "#2563eb", label: "In Progress" },
  resolved: { bg: "#d1fae5", color: "#059669", label: "Resolved" },
  closed: { bg: "#f3f4f6", color: "#6b7280", label: "Closed" },
};

const PRIORITY_COLORS = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#ef4444",
  Critical: "#dc2626",
};

const validate = (f) => {
  const e = {};
  if (!f.subject?.trim()) e.subject = "Subject is required";
  else if (f.subject.trim().length < 5) e.subject = "At least 5 characters";

  if (!f.category) e.category = "Please select a category";
  if (f.category === "Other" && !f.categoryOther?.trim())
    e.categoryOther = "Please describe the category";

  if (!f.priority) e.priority = "Please select a priority";

  if (!f.description?.trim()) e.description = "Description is required";
  else if (f.description.trim().length < 20) e.description = "At least 20 characters";

  if (f.contactPhone && !/^\d{10,15}$/.test(f.contactPhone.replace(/\s/g, "")))
    e.contactPhone = "Enter a valid phone number (digits only)";

  return e;
};

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewTicket, setViewTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", type: "success" });
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    subject: "",
    category: "",
    categoryOther: "",
    priority: "Medium",
    description: "",
    contactPhone: "",
    contactEmail: "",
    attachmentNote: "",
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/agent/support/tickets`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setTickets(data.tickets || []);
    } catch {
      showSnack("Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const showSnack = (msg, type = "success") => setSnack({ open: true, msg, type });

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => { const e = { ...p }; delete e[field]; return e; });
  };

  const handlePhoneKeyDown = (e) => {
    const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "+", " "];
    if (!/\d/.test(e.key) && !allowed.includes(e.key)) e.preventDefault();
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        category: form.category === "Other" ? form.categoryOther : form.category,
      };
      const res = await fetch(`${API}/api/agent/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showSnack("Ticket created successfully!");
        setOpen(false);
        resetForm();
        fetchTickets();
      } else {
        showSnack(data.message || "Failed to create ticket", "error");
      }
    } catch {
      showSnack("Server error. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ subject: "", category: "", categoryOther: "", priority: "Medium", description: "", contactPhone: "", contactEmail: "", attachmentNote: "" });
    setErrors({});
  };

  const filtered = tickets
    .filter((t) => filterStatus === "All" || t.status === filterStatus)
    .filter((t) =>
      !search.trim() ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketId?.toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  const FieldLabel = ({ label, required }) => (
    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151", mb: 0.5 }}>
      {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </Typography>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "#1d4ed8", width: 44, height: 44 }}>
            <SupportAgent />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
              Support Tickets
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
              Raise and track your support requests
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          sx={{ bgcolor: "#1d4ed8", borderRadius: 2, fontWeight: 700, px: 3, textTransform: "none" }}
        >
          New Ticket
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total", value: counts.total, color: "#6366f1", icon: <ConfirmationNumber /> },
          { label: "Open", value: counts.open, color: "#f59e0b", icon: <PendingActions /> },
          { label: "In Progress", value: counts.in_progress, color: "#3b82f6", icon: <Schedule /> },
          { label: "Resolved", value: counts.resolved, color: "#10b981", icon: <CheckCircle /> },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb", bgcolor: "white" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar sx={{ bgcolor: s.color + "20", color: s.color, width: 40, height: 40 }}>
                  {s.icon}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                    {s.value}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{s.label}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb", bgcolor: "white", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Search tickets..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ color: "#9ca3af", mr: 1, fontSize: 18 }} /> }}
            sx={{ minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map((s) => (
              <Chip
                key={s}
                label={s === "All" ? "All" : STATUS_COLORS[s]?.label || s}
                onClick={() => setFilterStatus(s)}
                sx={{
                  fontWeight: filterStatus === s ? 700 : 500,
                  bgcolor: filterStatus === s ? "#1d4ed8" : "#f3f4f6",
                  color: filterStatus === s ? "white" : "#374151",
                  cursor: "pointer",
                }}
              />
            ))}
          </Box>
          <Box sx={{ ml: "auto" }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchTickets} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Tickets List */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#1d4ed8" }} />
          <Typography sx={{ mt: 2, color: "#6b7280" }}>Loading tickets...</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px solid #e5e7eb", bgcolor: "white" }}>
          <ConfirmationNumber sx={{ fontSize: 56, color: "#d1d5db", mb: 2 }} />
          <Typography sx={{ fontWeight: 600, color: "#374151", fontSize: 16 }}>No tickets found</Typography>
          <Typography sx={{ color: "#9ca3af", mt: 0.5 }}>
            {search ? "Try a different search term" : "Create your first support ticket"}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filtered.map((ticket) => (
            <Paper
              key={ticket._id}
              elevation={0}
              sx={{
                p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb", bgcolor: "white",
                cursor: "pointer", transition: "all 0.15s",
                "&:hover": { borderColor: "#1d4ed8", boxShadow: "0 4px 16px rgba(29,78,216,0.08)" },
              }}
              onClick={() => setViewTicket(ticket)}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                      {ticket.subject}
                    </Typography>
                    <Chip
                      size="small"
                      label={ticket.ticketId || "—"}
                      sx={{ fontSize: 10, height: 20, bgcolor: "#f3f4f6", color: "#6b7280" }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: 13, color: "#6b7280", mb: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {ticket.description}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip size="small" label={ticket.category} sx={{ fontSize: 11, height: 22, bgcolor: "#eff6ff", color: "#1d4ed8" }} />
                    <Chip
                      size="small"
                      label={ticket.priority}
                      sx={{ fontSize: 11, height: 22, bgcolor: PRIORITY_COLORS[ticket.priority] + "20", color: PRIORITY_COLORS[ticket.priority], fontWeight: 700 }}
                    />
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Chip
                    label={STATUS_COLORS[ticket.status]?.label || ticket.status}
                    size="small"
                    sx={{
                      bgcolor: STATUS_COLORS[ticket.status]?.bg || "#f3f4f6",
                      color: STATUS_COLORS[ticket.status]?.color || "#6b7280",
                      fontWeight: 700, mb: 1,
                    }}
                  />
                  <Typography sx={{ fontSize: 11, color: "#9ca3af", display: "block" }}>
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-IN") : "—"}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); resetForm(); }} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ConfirmationNumber sx={{ color: "#1d4ed8" }} />
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Raise Support Ticket</Typography>
          </Box>
          <IconButton size="small" onClick={() => { setOpen(false); resetForm(); }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Subject */}
          <Box>
            <FieldLabel label="Subject" required />
            <TextField
              fullWidth size="small" placeholder="Brief title of your issue"
              value={form.subject} onChange={(e) => handleChange("subject", e.target.value)}
              error={!!errors.subject} helperText={errors.subject}
              inputProps={{ maxLength: 120 }}
              onKeyDown={(e) => { /* allow all for text */ }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Box>

          {/* Category */}
          <Box>
            <FieldLabel label="Category" required />
            <FormControl fullWidth size="small" error={!!errors.category}>
              <Select
                value={form.category} onChange={(e) => handleChange("category", e.target.value)}
                displayEmpty renderValue={form.category ? undefined : () => <span style={{ color: "#9ca3af" }}>Select category</span>}
                sx={{ borderRadius: 2 }}
              >
                {CATEGORY_OPTIONS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
              {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
            </FormControl>
            {form.category === "Other" && (
              <Box sx={{ mt: 1 }}>
                <TextField
                  fullWidth size="small" placeholder="Please specify the category"
                  value={form.categoryOther} onChange={(e) => handleChange("categoryOther", e.target.value)}
                  error={!!errors.categoryOther} helperText={errors.categoryOther}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>
            )}
          </Box>

          {/* Priority */}
          <Box>
            <FieldLabel label="Priority" required />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {PRIORITY_OPTIONS.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  onClick={() => handleChange("priority", p)}
                  sx={{
                    cursor: "pointer", fontWeight: 700,
                    bgcolor: form.priority === p ? PRIORITY_COLORS[p] : PRIORITY_COLORS[p] + "20",
                    color: form.priority === p ? "white" : PRIORITY_COLORS[p],
                    border: `1px solid ${PRIORITY_COLORS[p]}`,
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Description */}
          <Box>
            <FieldLabel label="Description" required />
            <TextField
              fullWidth multiline rows={4} size="small"
              placeholder="Describe your issue in detail (minimum 20 characters)..."
              value={form.description} onChange={(e) => handleChange("description", e.target.value)}
              error={!!errors.description} helperText={errors.description || `${form.description.length}/1000`}
              inputProps={{ maxLength: 1000 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Box>

          {/* Contact Phone */}
          <Box>
            <FieldLabel label="Contact Phone (optional)" />
            <TextField
              fullWidth size="small" placeholder="10-15 digit phone number"
              value={form.contactPhone} onChange={(e) => handleChange("contactPhone", e.target.value)}
              onKeyDown={handlePhoneKeyDown}
              error={!!errors.contactPhone} helperText={errors.contactPhone}
              inputProps={{ maxLength: 15, inputMode: "numeric" }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 16, color: "#9ca3af" }} /></InputAdornment> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Box>

          {/* Contact Email */}
          <Box>
            <FieldLabel label="Contact Email (optional)" />
            <TextField
              fullWidth size="small" type="email" placeholder="your@email.com"
              value={form.contactEmail} onChange={(e) => handleChange("contactEmail", e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Box>

          {/* Attachment Note */}
          <Box>
            <FieldLabel label="Attachment Note (optional)" />
            <TextField
              fullWidth size="small" placeholder="Describe any screenshots or files you want to share"
              value={form.attachmentNote} onChange={(e) => handleChange("attachmentNote", e.target.value)}
              inputProps={{ maxLength: 300 }}
              InputProps={{ startAdornment: <AttachFile sx={{ fontSize: 16, color: "#9ca3af", mr: 0.5 }} /> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setOpen(false); resetForm(); }} sx={{ textTransform: "none", color: "#6b7280" }}>
            Cancel
          </Button>
          <Button
            variant="contained" onClick={handleSubmit} disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Send />}
            sx={{ bgcolor: "#1d4ed8", borderRadius: 2, fontWeight: 700, textTransform: "none", px: 3 }}
          >
            {submitting ? "Submitting..." : "Submit Ticket"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={!!viewTicket} onClose={() => setViewTicket(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        {viewTicket && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ConfirmationNumber sx={{ color: "#1d4ed8" }} />
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{viewTicket.subject}</Typography>
                  <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{viewTicket.ticketId}</Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setViewTicket(null)}><Close /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                <Chip label={STATUS_COLORS[viewTicket.status]?.label || viewTicket.status} size="small"
                  sx={{ bgcolor: STATUS_COLORS[viewTicket.status]?.bg, color: STATUS_COLORS[viewTicket.status]?.color, fontWeight: 700 }} />
                <Chip label={viewTicket.category} size="small" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8" }} />
                <Chip label={viewTicket.priority} size="small"
                  sx={{ bgcolor: PRIORITY_COLORS[viewTicket.priority] + "20", color: PRIORITY_COLORS[viewTicket.priority], fontWeight: 700 }} />
              </Box>
              <Typography sx={{ fontSize: 13, color: "#374151", mb: 2, lineHeight: 1.7 }}>{viewTicket.description}</Typography>
              {viewTicket.contactPhone && (
                <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 0.5 }}>{viewTicket.contactPhone}</Typography>
              )}
              {viewTicket.contactEmail && (
                <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 0.5 }}>{viewTicket.contactEmail}</Typography>
              )}
              {viewTicket.attachmentNote && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: "#f9fafb", borderRadius: 2 }}>
                  <Typography sx={{ fontSize: 12, color: "#6b7280" }}>📎 {viewTicket.attachmentNote}</Typography>
                </Box>
              )}
              {viewTicket.adminReply && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#eff6ff", borderRadius: 2, borderLeft: "3px solid #1d4ed8" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", mb: 0.5 }}>Admin Reply:</Typography>
                  <Typography sx={{ fontSize: 13, color: "#374151" }}>{viewTicket.adminReply}</Typography>
                </Box>
              )}
              <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 2 }}>
                Created: {viewTicket.createdAt ? new Date(viewTicket.createdAt).toLocaleString("en-IN") : "—"}
              </Typography>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.type} onClose={() => setSnack((p) => ({ ...p, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}