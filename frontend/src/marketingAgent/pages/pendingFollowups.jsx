// frontend/src/marketingAgent/pages/pendingFollowups.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Grid, Typography, Chip, Button, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip, CircularProgress,
  Snackbar, Alert, useMediaQuery, useTheme, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, Badge, Avatar, LinearProgress, Tabs, Tab,
  Card, CardContent, Stack, ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import {
  PendingActions, CheckCircle, Cancel, Schedule, OpenInNew,
  Edit, Save, Close, Add, Search, FilterList, Refresh,
  CalendarMonth, Person, Notes, ArrowForward, Phone,
  Business, TrendingUp, AccessTime, Flag, MoreVert,
  KeyboardArrowDown, Visibility, AssignmentTurnedIn,
  ViewList, GridView, Circle,
} from "@mui/icons-material";
import PageShell from "./Pageshell";

//Config 
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_FU   = `${API_BASE}/api/follow-ups`;

//Stage config 
const STAGES = [
  { value: "pending",     label: "Pending",     color: "warning",  icon: <PendingActions sx={{ fontSize: 14 }} />,     bg: "#fef3c7", fg: "#92400e" },
  { value: "contacted",   label: "Contacted",   color: "info",     icon: <Phone sx={{ fontSize: 14 }} />,              bg: "#dbeafe", fg: "#1e40af" },
  { value: "in_progress", label: "In Progress", color: "primary",  icon: <TrendingUp sx={{ fontSize: 14 }} />,         bg: "#ede9fe", fg: "#4c1d95" },
  { value: "completed",   label: "Completed",   color: "success",  icon: <CheckCircle sx={{ fontSize: 14 }} />,        bg: "#d1fae5", fg: "#064e3b" },
  { value: "cancelled",   label: "Cancelled",   color: "error",    icon: <Cancel sx={{ fontSize: 14 }} />,             bg: "#fee2e2", fg: "#7f1d1d" },
];

const PRIORITY = [
  { value: "high",   label: "High",   color: "#ef4444" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low",    label: "Low",    color: "#22c55e" },
];

const stageInfo = (val) => STAGES.find((s) => s.value === val) || STAGES[0];
const priorityInfo = (val) => PRIORITY.find((p) => p.value === val) || PRIORITY[1];

// API helper
const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json"))
    throw new Error(`Server returned ${res.status}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// Helpers 
const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const isOverdue = (iso) => {
  if (!iso) return false;
  return new Date(iso) < new Date();
};

// Stat Card 
function StatCard({ label, value, color, icon, loading }) {
  return (
    <Card elevation={0} sx={{
      border: "1px solid", borderColor: "divider", borderRadius: 3,
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
    }}>
      <CardContent sx={{ p: "16px !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600, mb: 0.5 }}>
              {label}
            </Typography>
            {loading
              ? <Skeleton width={40} height={32} />
              : <Typography sx={{ fontSize: 26, fontWeight: 800, color }}>{value}</Typography>
            }
          </Box>
          <Avatar sx={{ bgcolor: `${color}22`, width: 44, height: 44 }}>
            <Box sx={{ color, display: "flex" }}>{icon}</Box>
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

// Stage Badge 
function StageBadge({ stage }) {
  const s = stageInfo(stage);
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", gap: 0.5,
      px: 1.2, py: 0.4, borderRadius: 2,
      bgcolor: s.bg, color: s.fg, fontSize: 11, fontWeight: 700,
    }}>
      {s.icon} {s.label}
    </Box>
  );
}

// Main Component
export default function PendingFollowUps() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  // data
  const [followUps, setFollowUps] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  // filters
  const [search,      setSearch]      = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [viewMode,    setViewMode]    = useState("table"); // "table" | "kanban"

  // edit dialog
  const [editOpen, setEditOpen]   = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [editStage, setEditStage] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPriority, setEditPriority] = useState("medium");

  // detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  // Fetch 
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_FU}?limit=200`);
      setFollowUps(data.data || []);
    } catch (err) {
      showSnack(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Stats
  const stats = STAGES.reduce((acc, s) => {
    acc[s.value] = followUps.filter((f) => (f.status || "pending") === s.value).length;
    return acc;
  }, {});
  const overdue = followUps.filter((f) =>
    ["pending", "contacted", "in_progress"].includes(f.status || "pending") &&
    isOverdue(f.followUpDate || f.date)
  ).length;

  // Filtered list 
  const filtered = followUps.filter((f) => {
    const name = (f.clientName || f.name || f.title || "").toLowerCase();
    const note = (f.notes || f.description || "").toLowerCase();
    const q    = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || note.includes(q);
    const matchStage  = filterStage === "all" || (f.status || "pending") === filterStage;
    return matchSearch && matchStage;
  });

  // Kanban groups 
  const kanbanGroups = STAGES.map((s) => ({
    ...s,
    items: filtered.filter((f) => (f.status || "pending") === s.value),
  }));

  // Update stage 
  const openEdit = (fu) => {
    setEditItem(fu);
    setEditStage(fu.status || "pending");
    setEditNotes(fu.notes || fu.description || "");
    setEditPriority(fu.priority || "medium");
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const data = await apiFetch(`${API_FU}/${editItem._id}`, {
        method: "PUT",
        body: JSON.stringify({
          status:   editStage,
          notes:    editNotes,
          priority: editPriority,
        }),
      });
      const updated = data.data;
      setFollowUps((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
      setEditOpen(false);
      showSnack("Follow-up updated successfully");
    } catch (err) {
      showSnack(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Quick stage change (no dialog)
  const quickStage = async (fu, newStage) => {
    try {
      const data = await apiFetch(`${API_FU}/${fu._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStage }),
      });
      const updated = data.data;
      setFollowUps((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
      showSnack(`Moved to "${stageInfo(newStage).label}"`);
    } catch (err) {
      showSnack(err.message, "error");
    }
  };

  // Render 
  return (
    <PageShell
      title="Pending Follow-ups"
      subtitle="Track and manage client follow-up stages"
      breadcrumb={[{ label: "Planning & Calendar" }, { label: "Pending Follow-ups" }]}
    >
      {/* ── Stats row ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Total" value={followUps.length} color="#6366f1"
            icon={<PendingActions />} loading={loading} />
        </Grid>
        {STAGES.slice(0, 3).map((s) => (
          <Grid item xs={6} sm={4} md={2} key={s.value}>
            <StatCard label={s.label} value={stats[s.value] || 0} color={s.fg}
              icon={s.icon} loading={loading} />
          </Grid>
        ))}
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Completed" value={stats.completed || 0} color="#059669"
            icon={<CheckCircle />} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Overdue" value={overdue} color="#dc2626"
            icon={<Flag />} loading={loading} />
        </Grid>
      </Grid>

      {/* ── Toolbar ── */}
      <Paper elevation={0} sx={{
        border: "1px solid", borderColor: "divider", borderRadius: 3,
        p: 2, mb: 2,
      }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
          {/* Search */}
          <TextField
            size="small" placeholder="Search by name or notes…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Stage filter */}
          <TextField
            select size="small" label="Stage" value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All Stages</MenuItem>
            {STAGES.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </TextField>

          {/* View toggle */}
          <ToggleButtonGroup
            size="small" value={viewMode} exclusive
            onChange={(_, v) => { if (v) setViewMode(v); }}
          >
            <ToggleButton value="table"><ViewList sx={{ fontSize: 18 }} /></ToggleButton>
            <ToggleButton value="kanban"><GridView sx={{ fontSize: 18 }} /></ToggleButton>
          </ToggleButtonGroup>

          <Tooltip title="Refresh">
            <IconButton size="small" onClick={fetchAll} disabled={loading}>
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Button
            size="small" variant="outlined" startIcon={<CalendarMonth />}
            onClick={() => navigate("/agent/calendar/company")}
          >
            Company Calendar
          </Button>
        </Box>
      </Paper>

      {/* ── Table View ── */}
      {viewMode === "table" && (
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "background.default" }}>
                  {["Client / Name", "Date", "Stage", "Priority", "Notes", "Actions"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <TableCell key={j}><Skeleton /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : filtered.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
                          No follow-ups found
                        </TableCell>
                      </TableRow>
                    )
                    : filtered.map((fu) => {
                        const fuDate  = fu.followUpDate?.slice(0, 10) || fu.date?.slice(0, 10);
                        const od      = isOverdue(fuDate) && ["pending","contacted","in_progress"].includes(fu.status || "pending");
                        const pri     = priorityInfo(fu.priority || "medium");
                        return (
                          <TableRow key={fu._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                            {/* Name */}
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 12 }}>
                                  {(fu.clientName || fu.name || "?")[0].toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                                    {fu.clientName || fu.name || fu.title || "—"}
                                  </Typography>
                                  {fu.company && (
                                    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                                      {fu.company}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>

                            {/* Date */}
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                {od && (
                                  <Tooltip title="Overdue">
                                    <Flag sx={{ fontSize: 13, color: "error.main" }} />
                                  </Tooltip>
                                )}
                                <Typography sx={{ fontSize: 12, color: od ? "error.main" : "text.primary", fontWeight: od ? 700 : 400 }}>
                                  {formatDate(fuDate)}
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Stage */}
                            <TableCell>
                              <StageBadge stage={fu.status || "pending"} />
                            </TableCell>

                            {/* Priority */}
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Circle sx={{ fontSize: 8, color: pri.color }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: pri.color }}>
                                  {pri.label}
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Notes */}
                            <TableCell>
                              <Typography sx={{
                                fontSize: 12, color: "text.secondary",
                                maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                {fu.notes || fu.description || "—"}
                              </Typography>
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Tooltip title="View details">
                                  <IconButton size="small" onClick={() => { setDetailItem(fu); setDetailOpen(true); }}>
                                    <Visibility sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit / Update stage">
                                  <IconButton size="small" color="primary" onClick={() => openEdit(fu)}>
                                    <Edit sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                }
              </TableBody>
            </Table>
          </TableContainer>

          {/* Count footer */}
          {!loading && filtered.length > 0 && (
            <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                Showing {filtered.length} of {followUps.length} follow-ups
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* ── Kanban View ── */}
      {viewMode === "kanban" && (
        <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2, alignItems: "flex-start" }}>
          {kanbanGroups.map((group) => (
            <Box key={group.value} sx={{
              minWidth: 240, maxWidth: 280, flexShrink: 0,
              border: "1px solid", borderColor: "divider", borderRadius: 3,
              bgcolor: "background.paper", overflow: "hidden",
            }}>
              {/* Column header */}
              <Box sx={{
                px: 2, py: 1.5, display: "flex", alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "3px solid", borderColor: group.fg,
                bgcolor: group.bg,
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Box sx={{ color: group.fg, display: "flex" }}>{group.icon}</Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: group.fg }}>
                    {group.label}
                  </Typography>
                </Box>
                <Chip label={group.items.length} size="small"
                  sx={{ bgcolor: group.fg, color: "white", fontSize: 11, height: 20 }} />
              </Box>

              {/* Cards */}
              <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 1, minHeight: 100, maxHeight: 520, overflowY: "auto" }}>
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} variant="rounded" height={80} />
                    ))
                  : group.items.length === 0
                    ? (
                      <Typography sx={{ fontSize: 12, color: "text.secondary", textAlign: "center", py: 3 }}>
                        No items
                      </Typography>
                    )
                    : group.items.map((fu) => {
                        const fuDate = fu.followUpDate?.slice(0, 10) || fu.date?.slice(0, 10);
                        const od     = isOverdue(fuDate) && group.value !== "completed" && group.value !== "cancelled";
                        const pri    = priorityInfo(fu.priority || "medium");

                        return (
                          <Paper key={fu._id} elevation={0} sx={{
                            p: 1.5, border: "1px solid", borderRadius: 2,
                            borderColor: od ? "error.light" : "divider",
                            cursor: "pointer", transition: "box-shadow 0.15s",
                            "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
                          }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, flex: 1, lineHeight: 1.3 }}>
                                {fu.clientName || fu.name || fu.title || "Follow-up"}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 0.3 }}>
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => openEdit(fu)} sx={{ p: 0.3 }}>
                                    <Edit sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>

                            {fuDate && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mt: 0.6 }}>
                                {od && <Flag sx={{ fontSize: 11, color: "error.main" }} />}
                                <Typography sx={{ fontSize: 10, color: od ? "error.main" : "text.secondary", fontWeight: od ? 700 : 400 }}>
                                  {formatDate(fuDate)}
                                </Typography>
                              </Box>
                            )}

                            {fu.notes && (
                              <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {fu.notes}
                              </Typography>
                            )}

                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                <Circle sx={{ fontSize: 7, color: pri.color }} />
                                <Typography sx={{ fontSize: 10, color: pri.color, fontWeight: 600 }}>
                                  {pri.label}
                                </Typography>
                              </Box>

                              {/* Quick next-stage button */}
                              {STAGES.findIndex((s) => s.value === group.value) < STAGES.length - 2 && (
                                <Tooltip title={`Move to ${STAGES[STAGES.findIndex((s) => s.value === group.value) + 1]?.label}`}>
                                  <IconButton size="small"
                                    onClick={() => {
                                      const nextIdx = STAGES.findIndex((s) => s.value === group.value) + 1;
                                      quickStage(fu, STAGES[nextIdx].value);
                                    }}
                                    sx={{ p: 0.3, color: "primary.main" }}>
                                    <ArrowForward sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Paper>
                        );
                      })
                }
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* ── Edit / Update Stage Dialog ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Update Follow-up</Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              {editItem?.clientName || editItem?.name || editItem?.title || ""}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setEditOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Current → New stage visual */}
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1.5, p: 1.5,
            bgcolor: "background.default", borderRadius: 2, border: "1px solid", borderColor: "divider",
          }}>
            <StageBadge stage={editItem?.status || "pending"} />
            <ArrowForward sx={{ fontSize: 16, color: "text.secondary" }} />
            <StageBadge stage={editStage} />
          </Box>

          <TextField
            select fullWidth size="small" label="Stage"
            value={editStage} onChange={(e) => setEditStage(e.target.value)}
          >
            {STAGES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ color: s.fg }}>{s.icon}</Box>
                  {s.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select fullWidth size="small" label="Priority"
            value={editPriority} onChange={(e) => setEditPriority(e.target.value)}
          >
            {PRIORITY.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Circle sx={{ fontSize: 10, color: p.color }} />
                  {p.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth size="small" label="Notes / Remarks"
            multiline rows={3}
            value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Add notes about this follow-up…"
          />

          {/* Stage pipeline progress */}
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary", mb: 1 }}>
              Pipeline Progress
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {STAGES.filter((s) => !["cancelled"].includes(s.value)).map((s, i) => {
                const activeIdx = STAGES.findIndex((x) => x.value === editStage);
                const thisIdx   = STAGES.findIndex((x) => x.value === s.value);
                const done = thisIdx <= activeIdx && editStage !== "cancelled";
                return (
                  <Box key={s.value} sx={{ flex: 1 }}>
                    <Box sx={{
                      height: 6, borderRadius: 3,
                      bgcolor: done ? s.fg : "divider",
                      transition: "background-color 0.3s",
                    }} />
                    <Typography sx={{ fontSize: 9, color: done ? s.fg : "text.disabled", mt: 0.4, textAlign: "center" }}>
                      {s.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} size="small">Cancel</Button>
          <Button
            variant="contained" size="small"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save />}
            onClick={handleUpdate}
            disabled={saving}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Detail Dialog ── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        {detailItem && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  {(detailItem.clientName || detailItem.name || "?")[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                    {detailItem.clientName || detailItem.name || detailItem.title || "Follow-up"}
                  </Typography>
                  {detailItem.company && (
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{detailItem.company}</Typography>
                  )}
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setDetailOpen(false)}><Close fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 0 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary", mb: 0.5 }}>Stage</Typography>
                  <StageBadge stage={detailItem.status || "pending"} />
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary", mb: 0.5 }}>Priority</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Circle sx={{ fontSize: 10, color: priorityInfo(detailItem.priority || "medium").color }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: priorityInfo(detailItem.priority || "medium").color }}>
                      {priorityInfo(detailItem.priority || "medium").label}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary", mb: 0.5 }}>Follow-up Date</Typography>
                  <Typography sx={{ fontSize: 13 }}>
                    {formatDate(detailItem.followUpDate || detailItem.date)}
                  </Typography>
                </Grid>
                {detailItem.phone && (
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary", mb: 0.5 }}>Phone</Typography>
                    <Typography sx={{ fontSize: 13 }}>{detailItem.phone}</Typography>
                  </Grid>
                )}
                {(detailItem.notes || detailItem.description) && (
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary", mb: 0.5 }}>Notes</Typography>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: "background.default", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                      <Typography sx={{ fontSize: 13 }}>{detailItem.notes || detailItem.description}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => { setDetailOpen(false); openEdit(detailItem); }} variant="outlined" size="small" startIcon={<Edit />}>
                Edit
              </Button>
              <Button onClick={() => setDetailOpen(false)} size="small">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </PageShell>
  );
}