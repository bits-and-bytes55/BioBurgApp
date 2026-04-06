import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  Typography, Chip, Button, CircularProgress, Paper, Container,
  useMediaQuery, useTheme, IconButton, Tooltip, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Skeleton, TableContainer, Menu, MenuItem, List, ListItem,
  ListItemText, Divider, alpha,
} from "@mui/material";
import {
  Close, Visibility, Refresh, CheckCircle, HourglassEmpty,
  Person, CalendarToday, QuestionAnswer, FilterList,
  Search, OpenInNew,
} from "@mui/icons-material";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ── Status config aligned with DB enum ──────────────────────────────────────
const STATUS = {
  pending:   { label: "Pending",   color: "warning", dot: "#f59e0b", bg: "#fef3c7" },
  completed: { label: "Completed", color: "success", dot: "#22c55e", bg: "#dcfce7" },
  cancelled: { label: "Cancelled", color: "error",   dot: "#ef4444", bg: "#fee2e2" },
};

const FILTERS = ["All", "Pending", "Completed", "Cancelled"];

export default function Consultations() {
  const [consultations, setConsultations]       = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [openDialog, setOpenDialog]             = useState(false);
  const [snackbar, setSnackbar]                 = useState({ open: false, message: "", severity: "success" });
  const [searchTerm, setSearchTerm]             = useState("");
  const [filter, setFilter]                     = useState("All");
  const [sortBy, setSortBy]                     = useState("newest");
  const [anchorEl, setAnchorEl]                 = useState(null);

  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down("md"));
  const token     = localStorage.getItem("adminToken");

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchConsultations = async (showLoading = true) => {
    showLoading ? setLoading(true) : setRefreshing(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/doctor-consultations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConsultations(res.data.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "/login/admin";
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchConsultations(); }, []);

  // ── Status updates ───────────────────────────────────────────────────────
  const closeConsultation = async (id) => {
    try {
      await axios.put(`${BASE_URL}/api/admin/consultations/${id}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConsultations(false);
    } catch { alert("Failed to close consultation"); }
  };

  const openConsultation = async (id) => {
    try {
      await axios.put(`${BASE_URL}/api/admin/consultations/${id}/open`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConsultations(false);
    } catch { alert("Failed to reopen consultation"); }
  };

  // ── Filter / search ──────────────────────────────────────────────────────
  const filtered = consultations
    .filter(c => {
      const matchSearch =
        c.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.patientMobile?.includes(searchTerm);
      const matchFilter =
        filter === "All" || c.status === filter.toLowerCase();
      return matchSearch && matchFilter;
    })
    .sort((a, b) =>
      sortBy === "newest"
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    );

  const counts = {
    All:       consultations.length,
    Pending:   consultations.filter(c => c.status === "pending").length,
    Completed: consultations.filter(c => c.status === "completed").length,
    Cancelled: consultations.filter(c => c.status === "cancelled").length,
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  const LoadingSkeleton = () => (
    <Box>
      <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 2 }} />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={68} sx={{ mb: 1, borderRadius: 2 }} />
      ))}
    </Box>
  );

  // ── Mobile card ──────────────────────────────────────────────────────────
  const MobileCard = ({ c }) => {
    const st = STATUS[c.status] || STATUS.pending;
    return (
      <Card sx={{ mb: 2, borderLeft: 4, borderColor: `${st.color}.main` }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Box>
              <Typography fontWeight={700}>{c.patientName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {c.patientMobile}
              </Typography>
            </Box>
            <Chip label={st.label} color={st.color} size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {c.doctor?.fullName || "Doctor"} · {c.mode}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {c.date} {c.time && `· ${c.time}`}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <IconButton size="small" onClick={() => { setSelectedConsultation(c); setOpenDialog(true); }}>
              <Visibility />
            </IconButton>
            {c.status === "pending" ? (
              <Button size="small" variant="outlined" color="warning" startIcon={<Close />}
                onClick={() => closeConsultation(c._id)}>
                Close
              </Button>
            ) : c.status === "completed" ? (
              <Button size="small" variant="outlined" color="success" startIcon={<OpenInNew />}
                onClick={() => openConsultation(c._id)}>
                Reopen
              </Button>
            ) : null}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // ── Desktop table ────────────────────────────────────────────────────────
  const DesktopTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: theme.shadows[3] }}>
      <Table>
        <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
          <TableRow>
            {["Patient", "Mobile", "Doctor", "Mode", "Date & Time", "Status", "Actions"].map(h => (
              <TableCell key={h} sx={{ fontWeight: 700, color: "primary.main" }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map(c => {
            const st = STATUS[c.status] || STATUS.pending;
            return (
              <TableRow key={c._id}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <TableCell sx={{ fontWeight: 600 }}>{c.patientName || "—"}</TableCell>
                <TableCell>{c.patientMobile || "—"}</TableCell>
                <TableCell>{c.doctor?.fullName || "—"}</TableCell>
                <TableCell>{c.mode || "—"}</TableCell>
                <TableCell>
                  {c.date || new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {c.time ? ` · ${c.time}` : ""}
                </TableCell>
                <TableCell>
                  <Chip label={st.label} color={st.color} size="small" sx={{ fontWeight: 700 }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => { setSelectedConsultation(c); setOpenDialog(true); }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {c.status === "pending" && (
                      <Button size="small" variant="outlined" color="warning"
                        onClick={() => closeConsultation(c._id)} sx={{ fontSize: 12, borderRadius: 2 }}>
                        Complete
                      </Button>
                    )}
                    {c.status === "completed" && (
                      <Button size="small" variant="outlined" color="success"
                        onClick={() => openConsultation(c._id)} sx={{ fontSize: 12, borderRadius: 2 }}>
                        Reopen
                      </Button>
                    )}
                    {c.status === "cancelled" && (
                      <Button size="small" variant="outlined" color="info"
                        onClick={() => openConsultation(c._id)} sx={{ fontSize: 12, borderRadius: 2 }}>
                        Reopen
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 3 }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant={isMobile ? "h6" : "h4"} fontWeight="bold" color="primary.main">
            Consultations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage doctor-patient consultations
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => fetchConsultations(false)} disabled={refreshing}
              sx={{ borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
              <Refresh sx={{ animation: refreshing ? "spin 1s linear infinite" : "none",
                "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<FilterList />} onClick={e => setAnchorEl(e.currentTarget)}
            sx={{ borderRadius: 2, textTransform: "none" }}>
            Sort
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, mb: 3 }}>
        {[
          { label: "Total",     count: counts.All,       color: "primary.main",  bg: alpha(theme.palette.primary.main, 0.05) },
          { label: "Pending",   count: counts.Pending,   color: "warning.main",  bg: alpha(theme.palette.warning.main,  0.05) },
          { label: "Completed", count: counts.Completed, color: "success.main",  bg: alpha(theme.palette.success.main,  0.05) },
          { label: "Cancelled", count: counts.Cancelled, color: "error.main",    bg: alpha(theme.palette.error.main,    0.05) },
        ].map(s => (
          <Card key={s.label} sx={{ borderRadius: 2, backgroundColor: s.bg }}>
            <CardContent sx={{ textAlign: "center", py: "12px !important" }}>
              <Typography variant="h4" fontWeight="bold" color={s.color}>{s.count}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Search + Filter chips */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", flex: "1 1 220px",
            backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, px: 2, py: 0.5 }}>
            <Search sx={{ color: "text.secondary", mr: 1 }} />
            <input
              type="text"
              placeholder="Search by patient name or phone…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 14, color: theme.palette.text.primary }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {FILTERS.map(f => (
              <Chip key={f} label={`${f} (${counts[f]})`}
                onClick={() => setFilter(f)}
                color={filter === f ? (f === "All" ? "primary" : f === "Pending" ? "warning" : f === "Completed" ? "success" : "error") : "default"}
                variant={filter === f ? "filled" : "outlined"}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Content */}
      {loading ? <LoadingSkeleton /> : filtered.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">No consultations found</Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || filter !== "All" ? "Try adjusting your search or filter" : "No consultations yet"}
          </Typography>
        </Paper>
      ) : isMobile ? (
        <Box>{filtered.map(c => <MobileCard key={c._id} c={c} />)}</Box>
      ) : (
        <DesktopTable />
      )}

      {/* Sort menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 200, borderRadius: 2, mt: 1 } }}>
        <MenuItem disabled><Typography variant="subtitle2" fontWeight="bold">Sort By</Typography></MenuItem>
        <MenuItem selected={sortBy === "newest"} onClick={() => { setSortBy("newest"); setAnchorEl(null); }}>
          <ListItemText primary="Newest First" />
          {sortBy === "newest" && <CheckCircle color="primary" fontSize="small" />}
        </MenuItem>
        <MenuItem selected={sortBy === "oldest"} onClick={() => { setSortBy("oldest"); setAnchorEl(null); }}>
          <ListItemText primary="Oldest First" />
          {sortBy === "oldest" && <CheckCircle color="primary" fontSize="small" />}
        </MenuItem>
      </Menu>

      {/* Detail dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setSelectedConsultation(null); }}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedConsultation && (() => {
          const c  = selectedConsultation;
          const st = STATUS[c.status] || STATUS.pending;
          return (
            <>
              <DialogTitle sx={{ borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" fontWeight="bold">Consultation Details</Typography>
                  <IconButton onClick={() => { setOpenDialog(false); setSelectedConsultation(null); }}><Close /></IconButton>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 3 }}>
                {[
                  ["Patient",  c.patientName  || "—"],
                  ["Mobile",   c.patientMobile || "—"],
                  ["Doctor",   c.doctor?.fullName || "—"],
                  ["Mode",     c.mode || "—"],
                  ["Date",     c.date || new Date(c.createdAt).toLocaleDateString("en-IN")],
                  ["Time",     c.time || "—"],
                  ["Status",   <Chip label={st.label} color={st.color} size="small" />],
                ].map(([k, v]) => (
                  <Box key={k} sx={{ display: "flex", justifyContent: "space-between", py: 1,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>{k}</Typography>
                    <Typography variant="body2">{v}</Typography>
                  </Box>
                ))}
              </DialogContent>
              <DialogActions sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Button onClick={() => { setOpenDialog(false); setSelectedConsultation(null); }} sx={{ borderRadius: 2 }}>
                  Close
                </Button>
                {c.status === "pending" && (
                  <Button variant="contained" color="warning" startIcon={<CheckCircle />}
                    onClick={() => { closeConsultation(c._id); setOpenDialog(false); setSelectedConsultation(null); }}
                    sx={{ borderRadius: 2 }}>
                    Mark Complete
                  </Button>
                )}
                {(c.status === "completed" || c.status === "cancelled") && (
                  <Button variant="contained" color="success" startIcon={<OpenInNew />}
                    onClick={() => { openConsultation(c._id); setOpenDialog(false); setSelectedConsultation(null); }}
                    sx={{ borderRadius: 2 }}>
                    Reopen
                  </Button>
                )}
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Container>
  );
}