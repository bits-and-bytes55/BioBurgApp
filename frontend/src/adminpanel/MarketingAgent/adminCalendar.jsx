// frontend/src/adminpanel/MarketingAgent/AdminCalendar.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Paper, Grid, Typography, Chip, Button, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip, CircularProgress,
  Snackbar, Alert, useMediaQuery, useTheme, Skeleton, Badge,
  Switch, FormControlLabel, Avatar, Stack,
} from "@mui/material";
import {
  ChevronLeft, ChevronRight, Add, Close, Delete, Edit,
  Save, Cancel, PushPin, PushPinOutlined, Event,
  CellTower, AdminPanelSettings, Visibility, CalendarMonth,
  Refresh,
} from "@mui/icons-material";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API = `${API_BASE}/api/calendar`;

const EVENT_COLOR = {
  meeting:   "#3b82f6",
  launch:    "#22c55e",
  training:  "#f59e0b",
  event:     "#8b5cf6",
  deadline:  "#ef4444",
  follow_up: "#06b6d4",
  other:     "#6b7280",
};

const EVENT_BG = {
  meeting:   "#eff6ff",
  launch:    "#f0fdf4",
  training:  "#fffbeb",
  event:     "#faf5ff",
  deadline:  "#fef2f2",
  follow_up: "#ecfeff",
  other:     "#f9fafb",
};

const resolveColor  = (t = "") => EVENT_COLOR[t.toLowerCase()] ?? EVENT_COLOR.other;
const resolveBg     = (t = "") => EVENT_BG[t.toLowerCase()]    ?? EVENT_BG.other;
const EVENT_TYPES   = ["meeting", "launch", "training", "event", "deadline", "follow_up", "other"];

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const toKey      = (y, m, d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const todayKey   = () => { const t = new Date(); return toKey(t.getFullYear(), t.getMonth(), t.getDate()); };
const fmtDate    = (k) => { if (!k) return ""; const [y,m,d] = k.split("-"); return `${MONTHS[+m-1]} ${+d}, ${y}`; };
const calDays    = (y, m) => ({ first: new Date(y,m,1).getDay(), days: new Date(y,m+1,0).getDate() });

const apiFetch = async (url, opts = {}) => {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  const ct  = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new Error(`Server returned ${res.status}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export default function AdminCalendar() {
  const theme   = useTheme();
  const isMd    = useMediaQuery(theme.breakpoints.down("md"));
  const isSm    = useMediaQuery(theme.breakpoints.down("sm"));

  const [cur,     setCur]     = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [events,  setEvents]  = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // dialog
  const [open,    setOpen]    = useState(false);
  const [selDate, setSelDate] = useState(null);
  const [editId,  setEditId]  = useState(null);

  // form
  const [fTitle,  setFTitle]  = useState("");
  const [fType,   setFType]   = useState("meeting");
  const [fCustom, setFCustom] = useState("");
  const [fDesc,   setFDesc]   = useState("");
  const [fPinned, setFPinned] = useState(false);

  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });
  const toast = (msg, sev = "success") => setSnack({ open: true, msg, sev });

  const pollRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (y = cur.year, m = cur.month) => {
    setLoading(true);
    try {
      const d = await apiFetch(`${API}/events?year=${y}&month=${m + 1}`);
      setEvents(d.data || {});
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [cur]);

  useEffect(() => { load(cur.year, cur.month); }, [cur]);

  // polling for live sync (fallback when socket not available on admin side)
  useEffect(() => {
    pollRef.current = setInterval(() => load(cur.year, cur.month), 30000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  // ── Nav ────────────────────────────────────────────────────────────────────
  const prev  = () => setCur(p => ({ year: p.month===0?p.year-1:p.year, month: p.month===0?11:p.month-1 }));
  const next  = () => setCur(p => ({ year: p.month===11?p.year+1:p.year, month: p.month===11?0:p.month+1 }));
  const today = () => setCur({ year: new Date().getFullYear(), month: new Date().getMonth() });

  // ── Dialog helpers ─────────────────────────────────────────────────────────
  const openCreate = (day) => {
    setSelDate(toKey(cur.year, cur.month, day));
    setEditId(null);
    setFTitle(""); setFType("meeting"); setFCustom(""); setFDesc(""); setFPinned(false);
    setOpen(true);
  };

  const openEdit = (ev) => {
    const base = ["meeting","launch","training","event","deadline","follow_up"];
    const custom = !base.includes(ev.type);
    setEditId(ev._id);
    setFTitle(ev.title);
    setFType(custom ? "other" : ev.type);
    setFCustom(custom ? ev.type : "");
    setFDesc(ev.description || "");
    setFPinned(ev.isPinned || false);
    setOpen(true);
  };

  const finalType = () => fType === "other" && fCustom.trim() ? fCustom.trim().toLowerCase() : fType;

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!fTitle.trim() || !selDate) return;
    if (fType === "other" && !fCustom.trim()) return;
    setSaving(true);
    try {
      const d = await apiFetch(`${API}/events`, {
        method: "POST",
        body: JSON.stringify({
          title: fTitle.trim(), type: finalType(), date: selDate,
          description: fDesc.trim(), isAdminCreated: true, isPinned: fPinned,
        }),
      });
      setEvents(prev => ({ ...prev, [selDate]: [...(prev[selDate]||[]), d.data] }));
      setFTitle(""); setFCustom(""); setFDesc(""); setFPinned(false);
      toast("Event broadcast to all agents ✓");
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!fTitle.trim()) return;
    setSaving(true);
    try {
      const d = await apiFetch(`${API}/events/${editId}`, {
        method: "PUT",
        body: JSON.stringify({ title: fTitle.trim(), type: finalType(), description: fDesc.trim(), isPinned: fPinned }),
      });
      setEvents(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(k => {
          updated[k] = updated[k].map(e => e._id === editId ? d.data : e);
        });
        return updated;
      });
      setEditId(null);
      toast("Event updated & synced ✓");
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, dateKey) => {
    setSaving(true);
    try {
      await apiFetch(`${API}/events/${id}`, { method: "DELETE" });
      setEvents(prev => {
        const list = (prev[dateKey]||[]).filter(e => e._id !== id);
        const next = { ...prev };
        if (list.length === 0) delete next[dateKey];
        else next[dateKey] = list;
        return next;
      });
      if (editId === id) setEditId(null);
      toast("Deleted & agents notified ✓");
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const { first, days } = calDays(cur.year, cur.month);
  const TK              = todayKey();
  const cells           = [...Array(first).fill(null), ...Array.from({length: days}, (_,i) => i+1)];
  const selEvents       = selDate ? (events[selDate]||[]) : [];
  const totalEvents     = Object.values(events).reduce((s, a) => s + a.length, 0);

  const typeColor = (t) => {
    const map = {
      meeting:"primary", launch:"success", training:"warning",
      event:"secondary", deadline:"error", follow_up:"info", other:"default"
    };
    return map[t?.toLowerCase()] ?? "default";
  };

  return (
    <Box sx={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* ── Header ── */}
      <Box sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        mb: 3, flexWrap: "wrap", gap: 2,
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CalendarMonth sx={{ color: "white", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1.2, color: "#1e1b4b" }}>
              Admin Calendar
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
              {totalEvents} event{totalEvents !== 1 ? "s" : ""} · changes sync to all agents live
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => load()} sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          <Chip
            icon={<CellTower sx={{ fontSize: 14 }} />}
            label="Live Sync ON"
            size="small"
            sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: 11 }}
          />
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* ── Calendar Grid ── */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{
            border: "1px solid #e5e7eb", borderRadius: 3, overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            {/* Nav Bar */}
            <Box sx={{
              px: 2.5, py: 1.5,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)",
            }}>
              <IconButton onClick={prev} sx={{ color: "white" }}><ChevronLeft /></IconButton>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 17, color: "white", letterSpacing: -0.3 }}>
                  {MONTHS[cur.month]} {cur.year}
                </Typography>
                <Button
                  size="small" onClick={today}
                  sx={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: 1.5, fontSize: 11, py: 0.3, px: 1.2, minWidth: "auto",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                >
                  Today
                </Button>
              </Box>
              <IconButton onClick={next} sx={{ color: "white" }}><ChevronRight /></IconButton>
            </Box>

            {/* Day Headers */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", bgcolor: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              {DAYS.map(d => (
                <Box key={d} sx={{ textAlign: "center", py: 1 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5 }}>
                    {isSm ? d[0] : d}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Cells */}
            <Box sx={{ p: isSm ? 0.5 : 1 }}>
              {loading ? (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 0.5 }}>
                  {Array.from({length: 35}).map((_,i) => (
                    <Skeleton key={i} variant="rounded" height={isSm ? 44 : 80} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: isSm ? 0.25 : 0.5 }}>
                  {cells.map((day, idx) => {
                    const dateKey = day ? toKey(cur.year, cur.month, day) : null;
                    const dayEvs  = dateKey ? (events[dateKey]||[]) : [];
                    const isToday = dateKey === TK;
                    const maxShow = isSm ? 1 : isMd ? 2 : 3;
                    const hasAdmin = dayEvs.some(e => e.isAdminCreated);

                    return (
                      <Box
                        key={idx}
                        onClick={() => day && openCreate(day)}
                        sx={{
                          minHeight: isSm ? 44 : 80, p: isSm ? 0.4 : 0.7,
                          borderRadius: 2, cursor: day ? "pointer" : "default",
                          border: isToday ? "2px solid #6366f1" : "1px solid transparent",
                          bgcolor: isToday ? "#eef2ff" : day ? "#ffffff" : "transparent",
                          transition: "all 0.15s ease",
                          "&:hover": day ? {
                            bgcolor: isToday ? "#e0e7ff" : "#f8fafc",
                            border: `1px solid ${isToday ? "#6366f1" : "#d1d5db"}`,
                            transform: "scale(1.01)",
                          } : {},
                          position: "relative",
                        }}
                      >
                        {day && (
                          <>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <Typography sx={{
                                fontSize: isSm ? 10 : 12, fontWeight: isToday ? 800 : 500,
                                width: isSm ? 16 : 20, height: isSm ? 16 : 20,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: "50%", bgcolor: isToday ? "#6366f1" : "transparent",
                                color: isToday ? "white" : "#374151",
                              }}>
                                {day}
                              </Typography>
                              {hasAdmin && !isSm && (
                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#8b5cf6" }} />
                              )}
                            </Box>

                            {dayEvs.slice(0, maxShow).map((ev, i) => (
                              <Box key={i} sx={{
                                mt: 0.4, px: 0.6, py: 0.25, borderRadius: 1,
                                bgcolor: resolveColor(ev.type),
                                display: "flex", alignItems: "center", gap: 0.3,
                              }}>
                                {ev.isPinned && <PushPin sx={{ fontSize: 7, color: "white" }} />}
                                <Typography sx={{
                                  fontSize: isSm ? 7 : 9, color: "white", fontWeight: 600,
                                  lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                  {ev.title}
                                </Typography>
                              </Box>
                            ))}

                            {dayEvs.length > maxShow && (
                              <Typography sx={{ fontSize: 8, color: "#6b7280", mt: 0.3 }}>
                                +{dayEvs.length - maxShow} more
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ── Sidebar ── */}
        <Grid item xs={12} lg={4}>
          {/* Legend */}
          <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: 2, mb: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#374151", mb: 1.5 }}>
              Event Types
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
              {EVENT_TYPES.filter(t => t !== "other").concat(["other"]).map(t => (
                <Box key={t} sx={{
                  display: "flex", alignItems: "center", gap: 0.5,
                  px: 1, py: 0.4, borderRadius: 10,
                  bgcolor: resolveBg(t), border: `1px solid ${resolveColor(t)}30`,
                }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: resolveColor(t) }} />
                  <Typography sx={{ fontSize: 10, fontWeight: 600, color: resolveColor(t), textTransform: "capitalize" }}>
                    {t === "follow_up" ? "follow-up" : t}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* All events this month */}
          <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{
              px: 2, py: 1.5, borderBottom: "1px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>
                {MONTHS[cur.month]} Events
              </Typography>
              <Chip label={totalEvents} size="small" sx={{ bgcolor: "#eef2ff", color: "#4338ca", fontWeight: 700, fontSize: 11 }} />
            </Box>
            <Box sx={{ maxHeight: 420, overflowY: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
              {totalEvents === 0 && (
                <Typography sx={{ fontSize: 13, color: "#9ca3af", textAlign: "center", py: 3 }}>
                  No events this month
                </Typography>
              )}
              {Object.entries(events).sort(([a],[b]) => a.localeCompare(b)).flatMap(([dateKey, evList]) =>
                evList.map(ev => (
                  <Box key={ev._id} sx={{
                    display: "flex", alignItems: "flex-start", gap: 1.5,
                    p: 1.5, borderRadius: 2, border: "1px solid #f3f4f6",
                    bgcolor: resolveBg(ev.type), cursor: "pointer",
                    "&:hover": { border: `1px solid ${resolveColor(ev.type)}40` },
                  }}
                    onClick={() => { setSelDate(dateKey); openEdit(ev); }}
                  >
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 1.5, flexShrink: 0,
                      bgcolor: resolveColor(ev.type),
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {ev.isPinned
                        ? <PushPin sx={{ fontSize: 14, color: "white" }} />
                        : <Event sx={{ fontSize: 14, color: "white" }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1f2937", lineHeight: 1.3 }}>
                        {ev.title}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 0.2 }}>
                        {fmtDate(dateKey)}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.5, mt: 0.4, flexWrap: "wrap" }}>
                        <Chip label={ev.type} size="small" color={typeColor(ev.type)}
                          sx={{ fontSize: 9, height: 16 }} />
                        {ev.isAdminCreated && (
                          <Chip label="Admin" size="small"
                            sx={{ fontSize: 9, height: 16, bgcolor: "#ede9fe", color: "#5b21b6" }} />
                        )}
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(ev._id, dateKey); }}
                      sx={{ color: "#ef4444", flexShrink: 0 }} disabled={saving}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Dialog ── */}
      <Dialog
        open={open}
        onClose={() => { setOpen(false); setEditId(null); }}
        maxWidth="sm" fullWidth fullScreen={isSm}
        PaperProps={{ sx: { borderRadius: isSm ? 0 : 3 } }}
      >
        <DialogTitle sx={{
          background: "linear-gradient(135deg,#1e1b4b,#312e81)",
          color: "white", display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1.5,
        }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AdminPanelSettings sx={{ fontSize: 18 }} />
              <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
                {editId ? "Edit Event" : "Add Event"}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.65)", mt: 0.3 }}>
              {fmtDate(selDate)} · visible to all marketing agents
            </Typography>
          </Box>
          <IconButton onClick={() => { setOpen(false); setEditId(null); }} sx={{ color: "white" }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          {/* Existing events for this date */}
          {!editId && selDate && (events[selDate]||[]).length > 0 && (
            <>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#374151", mb: 1 }}>
                Events on this day
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mb: 2 }}>
                {(events[selDate]||[]).map(ev => (
                  <Box key={ev._id} sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    p: 1.2, borderRadius: 2, border: "1px solid #f3f4f6",
                    bgcolor: resolveBg(ev.type),
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: resolveColor(ev.type), flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ev.title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(ev)} disabled={saving}>
                          <Edit sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(ev._id, selDate)} disabled={saving}
                          sx={{ color: "#ef4444" }}>
                          <Delete sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#374151", mb: 1.5 }}>
            {editId ? "Edit Event Details" : "New Event"}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <TextField fullWidth size="small" label="Event Title *" value={fTitle}
              onChange={e => setFTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !editId) handleCreate(); }}
              inputProps={{ maxLength: 200 }}
            />
            <TextField fullWidth size="small" select label="Event Type" value={fType}
              onChange={e => setFType(e.target.value)}>
              {EVENT_TYPES.map(t => (
                <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: resolveColor(t === "other" ? "other" : t) }} />
                    {t === "other" ? "Other (custom)" : t === "follow_up" ? "Follow-up" : t}
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            {fType === "other" && (
              <TextField fullWidth size="small" label="Custom Type Label *"
                placeholder='e.g. "workshop", "webinar", "review"'
                value={fCustom} onChange={e => setFCustom(e.target.value)}
                inputProps={{ maxLength: 30 }}
                helperText="This label will be saved as the event type"
              />
            )}

            <TextField fullWidth size="small" label="Description (optional)" multiline rows={2}
              value={fDesc} onChange={e => setFDesc(e.target.value)}
              inputProps={{ maxLength: 1000 }}
            />

            <Box sx={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              p: 1.5, borderRadius: 2, bgcolor: "#faf5ff", border: "1px solid #e9d5ff",
            }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#6d28d9" }}>Pin Event</Typography>
                <Typography sx={{ fontSize: 10, color: "#7c3aed" }}>Pinned events appear at top for agents</Typography>
              </Box>
              <Switch checked={fPinned} onChange={e => setFPinned(e.target.checked)}
                sx={{ "& .MuiSwitch-thumb": { bgcolor: "#7c3aed" } }}
              />
            </Box>

            <Box sx={{
              p: 1.5, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe",
              display: "flex", alignItems: "center", gap: 1,
            }}>
              <CellTower sx={{ fontSize: 16, color: "#2563eb" }} />
              <Typography sx={{ fontSize: 11, color: "#1d4ed8" }}>
                This event will be <strong>instantly visible</strong> to all marketing agents on their dashboard.
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setOpen(false); setEditId(null); }} size="small"
            sx={{ color: "#6b7280" }}>
            Cancel
          </Button>
          {editId ? (
            <Button variant="contained" size="small"
              startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <Save />}
              onClick={handleUpdate} disabled={saving || !fTitle.trim() || (fType === "other" && !fCustom.trim())}
              sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4338ca" }, borderRadius: 2 }}>
              Save Changes
            </Button>
          ) : (
            <Button variant="contained" size="small"
              startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <Add />}
              onClick={handleCreate} disabled={saving || !fTitle.trim() || (fType === "other" && !fCustom.trim())}
              sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4338ca" }, borderRadius: 2 }}>
              Broadcast Event
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.sev}
          variant="filled" sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}