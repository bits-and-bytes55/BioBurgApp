// frontend/src/marketingAgent/pages/CompanyCalendar.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Grid, Typography, Chip, Button, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip, CircularProgress,
  Snackbar, Alert, useMediaQuery, useTheme, Skeleton, Badge,
} from "@mui/material";
import {
  ChevronLeft, ChevronRight, Event, Add, Close,
  Delete, Edit, Save, Cancel, PendingActions, OpenInNew,
} from "@mui/icons-material";
import PageShell from "./Pageshell";

//  Config 
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API      = `${API_BASE}/api/calendar`;
const API_FU   = `${API_BASE}/api/follow-ups`;  

const EVENT_COLOR = {
  meeting:    "primary",
  launch:     "success",
  training:   "warning",
  event:      "secondary",
  deadline:   "error",
  follow_up:  "info",
  other:      "default",
};

// Helper: resolve colour for any type string (custom types fall back to "default")
const resolveColor = (type = "") =>
  EVENT_COLOR[type.toLowerCase()] ?? "default";

const EVENT_TYPES = ["meeting", "launch", "training", "event", "deadline", "other"];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS_OF_WEEK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

//  Helpers 
const toDateKey      = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const getTodayKey    = () => { const t = new Date(); return toDateKey(t.getFullYear(), t.getMonth(), t.getDate()); };
const formatDateLabel = (dateKey) => {
  if (!dateKey) return "";
  const [y, m, d] = dateKey.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
};
const getCalendarDays = (year, month) => ({
  first: new Date(year, month, 1).getDay(),
  days:  new Date(year, month + 1, 0).getDate(),
});

//  API fetch helper 
const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json"))
    throw new Error(`Server returned ${res.status} — check API route is mounted`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

//  Pending Follow-up badge on calendar cell 
const FollowUpDot = () => (
  <Box sx={{
    width: 6, height: 6, borderRadius: "50%",
    bgcolor: "info.main", display: "inline-block", ml: 0.4, verticalAlign: "middle",
  }} />
);

//  Component 
export default function CompanyCalendar() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [current, setCurrent]   = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [events,  setEvents]    = useState({});
  const [upcoming, setUpcoming] = useState([]);
  const [followUps, setFollowUps] = useState([]); // ← pending follow-ups
  const [fuByDate, setFuByDate] = useState({});   // ← follow-ups keyed by date
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);

  const [dialogOpen, setDialogOpen]     = useState(false);
  const [selectedDate, setSelected]     = useState(null);

  // New-event form
  const [newTitle,      setNewTitle]      = useState("");
  const [newType,       setNewType]       = useState("meeting");
  const [newCustomType, setNewCustomType] = useState("");   // ← "Other" custom label
  const [newDesc,       setNewDesc]       = useState("");

  // Edit-event form
  const [editingId,       setEditingId]       = useState(null);
  const [editTitle,       setEditTitle]       = useState("");
  const [editType,        setEditType]        = useState("meeting");
  const [editCustomType,  setEditCustomType]  = useState(""); // ← "Other" custom label
  const [editDesc,        setEditDesc]        = useState("");

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  //  Fetch calendar events 
  const fetchMonthEvents = useCallback(async (year, month) => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API}/events?year=${year}&month=${month + 1}`);
      setEvents(data.data || {});
    } catch (err) {
      showSnack(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpcoming = useCallback(async () => {
    try {
      const data = await apiFetch(`${API}/events/upcoming?limit=6`);
      setUpcoming(data.data || []);
    } catch { /* sidebar fails silently */ }
  }, []);

  //  Fetch pending follow-ups and map to calendar dates 
  const fetchFollowUps = useCallback(async () => {
    try {
      const data = await apiFetch(`${API_FU}?status=pending&limit=100`);
      const list = data.data || [];
      setFollowUps(list);

      // Build date-keyed map  { "2026-04-24": [fu, ...] }
      const map = {};
      list.forEach((fu) => {
        const key = fu.followUpDate?.slice(0, 10) || fu.date?.slice(0, 10);
        if (!key) return;
        if (!map[key]) map[key] = [];
        map[key].push(fu);
      });
      setFuByDate(map);
    } catch { /* follow-ups fail silently */ }
  }, []);

  useEffect(() => {
    fetchMonthEvents(current.year, current.month);
    fetchUpcoming();
    fetchFollowUps();
  }, [current, fetchMonthEvents, fetchUpcoming, fetchFollowUps]);

  //  Navigation 
  const prevMonth = () => setCurrent((p) => ({
    year:  p.month === 0 ? p.year - 1 : p.year,
    month: p.month === 0 ? 11 : p.month - 1,
  }));
  const nextMonth = () => setCurrent((p) => ({
    year:  p.month === 11 ? p.year + 1 : p.year,
    month: p.month === 11 ? 0 : p.month + 1,
  }));
  const goToToday = () => setCurrent({ year: new Date().getFullYear(), month: new Date().getMonth() });

  //  Day click 
  const handleDayClick = (day) => {
    setSelected(toDateKey(current.year, current.month, day));
    setNewTitle(""); setNewType("meeting"); setNewCustomType(""); setNewDesc("");
    setEditingId(null);
    setDialogOpen(true);
  };

  // Resolve final type string (substitutes custom label when "other" is selected)
  const resolveType = (typeVal, customVal) =>
    typeVal === "other" && customVal.trim() ? customVal.trim().toLowerCase() : typeVal;

  //  CRUD 
  const handleCreate = async () => {
    if (!newTitle.trim() || !selectedDate) return;
    if (newType === "other" && !newCustomType.trim()) return;
    setSaving(true);
    try {
      const finalType = resolveType(newType, newCustomType);
      const data = await apiFetch(`${API}/events`, {
        method: "POST",
        body: JSON.stringify({
          title:       newTitle.trim(),
          type:        finalType,
          date:        selectedDate,
          description: newDesc.trim(),
        }),
      });
      const ev = data.data;
      setEvents((prev) => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), ev] }));
      setUpcoming((prev) => [...prev, ev].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6));
      setNewTitle(""); setNewCustomType(""); setNewDesc("");
      showSnack("Event added successfully");
    } catch (err) { showSnack(err.message, "error"); }
    finally { setSaving(false); }
  };

  const startEdit = (ev) => {
    // Detect if the stored type is a custom one (not in base list)
    const baseTypes = ["meeting", "launch", "training", "event", "deadline", "follow_up"];
    const isCustom  = !baseTypes.includes(ev.type);
    setEditingId(ev._id);
    setEditTitle(ev.title);
    setEditType(isCustom ? "other" : ev.type);
    setEditCustomType(isCustom ? ev.type : "");
    setEditDesc(ev.description || "");
  };

  const handleUpdate = async (id) => {
    if (!editTitle.trim()) return;
    if (editType === "other" && !editCustomType.trim()) return;
    setSaving(true);
    try {
      const finalType = resolveType(editType, editCustomType);
      const data = await apiFetch(`${API}/events/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title: editTitle.trim(), type: finalType, description: editDesc.trim() }),
      });
      const updated = data.data;
      setEvents((prev) => ({
        ...prev,
        [selectedDate]: (prev[selectedDate] || []).map((e) => (e._id === id ? updated : e)),
      }));
      setUpcoming((prev) => prev.map((e) => (e._id === id ? updated : e)));
      setEditingId(null);
      showSnack("Event updated");
    } catch (err) { showSnack(err.message, "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await apiFetch(`${API}/events/${id}`, { method: "DELETE" });
      setEvents((prev) => {
        const list = (prev[selectedDate] || []).filter((e) => e._id !== id);
        const next = { ...prev };
        if (list.length === 0) delete next[selectedDate];
        else next[selectedDate] = list;
        return next;
      });
      setUpcoming((prev) => prev.filter((e) => e._id !== id));
      if (editingId === id) setEditingId(null);
      showSnack("Event deleted");
    } catch (err) { showSnack(err.message, "error"); }
    finally { setSaving(false); }
  };

  // ── Add follow-up as a calendar event 
  const handleAddFollowUpToCalendar = async (fu) => {
    const date = fu.followUpDate?.slice(0, 10) || fu.date?.slice(0, 10);
    if (!date) return showSnack("Follow-up has no date", "error");
    setSaving(true);
    try {
      const data = await apiFetch(`${API}/events`, {
        method: "POST",
        body: JSON.stringify({
          title:       `Follow-up: ${fu.clientName || fu.name || fu.title || "Pending"}`,
          type:        "follow_up",
          date,
          description: fu.notes || fu.description || "",
          followUpId:  fu._id,
        }),
      });
      const ev = data.data;
      setEvents((prev) => ({ ...prev, [date]: [...(prev[date] || []), ev] }));
      showSnack("Follow-up added to calendar");
    } catch (err) { showSnack(err.message, "error"); }
    finally { setSaving(false); }
  };

  //  Computed 
  const { first, days } = getCalendarDays(current.year, current.month);
  const todayKey        = getTodayKey();
  const cells           = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const selectedEvents  = selectedDate ? (events[selectedDate] || []) : [];
  const selectedFUs     = selectedDate ? (fuByDate[selectedDate] || []) : [];
  const totalFollowUps  = followUps.length;

  //  Render 
  return (
    <PageShell
      title="Company Calendar"
      subtitle="Events, meetings & important dates"
      breadcrumb={[{ label: "Planning & Calendar" }, { label: "Company Calendar" }]}
    >
      <Grid container spacing={2}>

        {/* ── Calendar grid ── */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>

            {/* Month navigation */}
            <Box sx={{
              p: { xs: 1, sm: 2 }, display: "flex", alignItems: "center",
              justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider",
            }}>
              <Button size="small" onClick={prevMonth}><ChevronLeft /></Button>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 15 } }}>
                  {MONTHS[current.month]} {current.year}
                </Typography>
                <Button size="small" variant="outlined" onClick={goToToday}
                  sx={{ fontSize: 10, py: 0.3, px: 1, minWidth: "auto" }}>
                  Today
                </Button>
              </Box>
              <Button size="small" onClick={nextMonth}><ChevronRight /></Button>
            </Box>

            {/* Day-of-week headers */}
            <Grid container sx={{ px: 1, py: 0.5, bgcolor: "background.default" }}>
              {DAYS_OF_WEEK.map((d) => (
                <Grid size={12 / 7} key={d} sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: { xs: 9, sm: 11 }, fontWeight: 700, color: "text.secondary" }}>
                    {isMobile ? d[0] : d}
                  </Typography>
                </Grid>
              ))}
            </Grid>
            <Divider />

            {/* Day cells */}
            <Box sx={{ p: { xs: 0.25, sm: 1 } }}>
              {loading ? (
                <Grid container>
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Grid size={12 / 7} key={i} sx={{ p: 0.5, minHeight: { xs: 44, sm: 72 } }}>
                      <Skeleton variant="rounded" height={isMobile ? 40 : 66} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Grid container>
                  {cells.map((day, idx) => {
                    const dateKey  = day ? toDateKey(current.year, current.month, day) : null;
                    const dayEvts  = dateKey ? (events[dateKey] || []) : [];
                    const dayFUs   = dateKey ? (fuByDate[dateKey] || []) : [];
                    const isToday  = dateKey === todayKey;
                    const maxShow  = isMobile ? 1 : 3;

                    return (
                      <Grid size={12 / 7} key={idx} sx={{ p: { xs: 0.25, sm: 0.5 }, minHeight: { xs: 44, sm: 72 } }}>
                        {day && (
                          <Box
                            onClick={() => handleDayClick(day)}
                            sx={{
                              height: "100%", p: { xs: 0.3, sm: 0.5 },
                              borderRadius: 2, cursor: "pointer",
                              bgcolor: isToday ? "primary.main" : "transparent",
                              "&:hover": { bgcolor: isToday ? "primary.dark" : "action.hover" },
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Typography sx={{
                                fontSize: { xs: 10, sm: 12 },
                                fontWeight: isToday ? 800 : 400,
                                color: isToday ? "white" : "text.primary",
                                lineHeight: 1,
                              }}>
                                {day}
                              </Typography>
                              {/* Blue dot indicator for pending follow-ups on this day */}
                              {dayFUs.length > 0 && !isMobile && (
                                <Tooltip title={`${dayFUs.length} follow-up${dayFUs.length > 1 ? "s" : ""}`}>
                                  <Box sx={{
                                    width: 7, height: 7, borderRadius: "50%",
                                    bgcolor: isToday ? "rgba(255,255,255,0.9)" : "info.main",
                                    ml: 0.5, flexShrink: 0,
                                  }} />
                                </Tooltip>
                              )}
                            </Box>

                            {dayEvts.slice(0, maxShow).map((e, i) => (
                              <Box key={i} sx={{
                                mt: 0.3, px: { xs: 0.3, sm: 0.5 }, py: 0.2,
                                bgcolor: `${resolveColor(e.type)}.main`,
                                borderRadius: 1,
                              }}>
                                <Typography sx={{
                                  fontSize: { xs: 7, sm: 9 }, color: "white",
                                  fontWeight: 600, lineHeight: 1.2,
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                  {e.title}
                                </Typography>
                              </Box>
                            ))}

                            {/* Follow-up mini pills */}
                            {!isMobile && dayFUs.slice(0, Math.max(0, maxShow - dayEvts.length)).map((fu, i) => (
                              <Box key={`fu-${i}`} sx={{
                                mt: 0.3, px: 0.5, py: 0.2,
                                bgcolor: "info.main", borderRadius: 1,
                                borderLeft: "2px dashed rgba(255,255,255,0.6)",
                              }}>
                                <Typography sx={{
                                  fontSize: 9, color: "white", fontWeight: 600,
                                  lineHeight: 1.2, overflow: "hidden",
                                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                   {fu.clientName || fu.name || "Follow-up"}
                                </Typography>
                              </Box>
                            ))}

                            {(dayEvts.length + dayFUs.length) > maxShow && (
                              <Typography sx={{ fontSize: 8, color: isToday ? "rgba(255,255,255,0.8)" : "text.secondary", mt: 0.2 }}>
                                +{(dayEvts.length + dayFUs.length) - maxShow} more
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ── Sidebar ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Upcoming Events */}
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden", mb: 2 }}>
            <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography sx={{ fontWeight: 700 }}>Upcoming Events</Typography>
            </Box>
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, maxHeight: 300, overflowY: "auto" }}>
              {upcoming.length === 0 && (
                <Typography sx={{ fontSize: 13, color: "text.secondary", textAlign: "center", py: 2 }}>
                  No upcoming events
                </Typography>
              )}
              {upcoming.map((ev) => (
                <Box key={ev._id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 1.5, bgcolor: "background.default", borderRadius: 2 }}>
                  <Event sx={{ fontSize: 18, color: `${resolveColor(ev.type)}.main`, mt: 0.3, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 600, mb: 0.3 }}>
                      {formatDateLabel(ev.date)}
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.title}
                    </Typography>
                    <Chip
                      label={ev.type} size="small"
                      color={resolveColor(ev.type)}
                      sx={{ fontSize: 10, height: 18, mt: 0.3 }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", mb: 1 }}>Legend</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                {[...EVENT_TYPES.filter(t => t !== "other"), "follow_up", "other"].map((t) => (
                  <Chip
                    key={t} label={t === "other" ? "custom" : t}
                    size="small" color={EVENT_COLOR[t]}
                    sx={{ fontSize: 10, height: 20 }}
                  />
                ))}
              </Box>
            </Box>
          </Paper>

          {/* ── Pending Follow-ups Panel ── */}
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "info.light", borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{
              p: 2, borderBottom: "1px solid", borderColor: "divider",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PendingActions sx={{ fontSize: 18, color: "info.main" }} />
                <Typography sx={{ fontWeight: 700 }}>Pending Follow-ups</Typography>
                {totalFollowUps > 0 && (
                  <Chip label={totalFollowUps} size="small" color="info" sx={{ fontSize: 10, height: 18 }} />
                )}
              </Box>
              <Tooltip title="Open Follow-ups page">
                <IconButton size="small" onClick={() => navigate("/agent/calendar/follow-ups")} sx={{ color: "info.main" }}>
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1, maxHeight: 260, overflowY: "auto" }}>
              {followUps.length === 0 && (
                <Typography sx={{ fontSize: 13, color: "text.secondary", textAlign: "center", py: 2 }}>
                  No pending follow-ups
                </Typography>
              )}
              {followUps.slice(0, 5).map((fu) => {
                const fuDate = fu.followUpDate?.slice(0, 10) || fu.date?.slice(0, 10);
                return (
                  <Box key={fu._id} sx={{
                    display: "flex", alignItems: "flex-start", gap: 1.5,
                    p: 1.5, bgcolor: "background.default", borderRadius: 2,
                    border: "1px solid", borderColor: "info.light",
                  }}>
                    <PendingActions sx={{ fontSize: 16, color: "info.main", mt: 0.3, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {fu.clientName || fu.name || fu.title || "Pending Follow-up"}
                      </Typography>
                      {fuDate && (
                        <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 0.2 }}>
                          📅 {formatDateLabel(fuDate)}
                        </Typography>
                      )}
                      {fu.notes && (
                        <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {fu.notes}
                        </Typography>
                      )}
                    </Box>
                    <Tooltip title="Add to Calendar">
                      <IconButton
                        size="small"
                        onClick={() => handleAddFollowUpToCalendar(fu)}
                        disabled={saving}
                        sx={{ color: "primary.main", flexShrink: 0 }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>

            {followUps.length > 5 && (
              <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider", textAlign: "center" }}>
                <Button size="small" variant="text" endIcon={<OpenInNew />} onClick={() => navigate("/agent/calendar/follow-ups")}>
                  View all {totalFollowUps} follow-ups
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Day Detail Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingId(null); }}
        maxWidth="sm" fullWidth fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{formatDateLabel(selectedDate)}</Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
              {selectedFUs.length > 0 && ` · ${selectedFUs.length} follow-up${selectedFUs.length > 1 ? "s" : ""}`}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => { setDialogOpen(false); setEditingId(null); }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 0 }}>

          {/* ── Pending Follow-ups for this day ── */}
          {selectedFUs.length > 0 && (
            <>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "info.main", mb: 1 }}>
                Pending Follow-ups on this day
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                {selectedFUs.map((fu) => (
                  <Box key={fu._id} sx={{
                    p: 1.5, bgcolor: "info.50", borderRadius: 2,
                    border: "1px dashed", borderColor: "info.main",
                    display: "flex", alignItems: "center", gap: 1,
                  }}>
                    <PendingActions sx={{ fontSize: 16, color: "info.main", flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {fu.clientName || fu.name || fu.title || "Pending Follow-up"}
                      </Typography>
                      {fu.notes && (
                        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{fu.notes}</Typography>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                      <Tooltip title="Add to Calendar Events">
                        <IconButton size="small" color="primary" onClick={() => handleAddFollowUpToCalendar(fu)} disabled={saving}>
                          <Add fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Go to Follow-ups page">
                        <IconButton size="small" color="info" onClick={() => { setDialogOpen(false); navigate("/agent/calendar/follow-ups"); }}>
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ mb: 1.5 }} />
            </>
          )}

          {/* Existing calendar events */}
          {selectedEvents.length === 0 && selectedFUs.length === 0 && (
            <Typography sx={{ fontSize: 13, color: "text.secondary", textAlign: "center", py: 2 }}>
              No events on this day — add one below
            </Typography>
          )}

          {selectedEvents.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
              {selectedEvents.map((ev) => (
                <Box key={ev._id} sx={{ p: 1.5, bgcolor: "background.default", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  {editingId === ev._id ? (
                    // ── Edit form ──
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <TextField
                        fullWidth size="small" label="Title"
                        value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(ev._id); }}
                      />
                      <TextField fullWidth size="small" select label="Type" value={editType} onChange={(e) => setEditType(e.target.value)}>
                        {EVENT_TYPES.map((t) => (
                          <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>
                            {t === "other" ? "Other (custom)" : t}
                          </MenuItem>
                        ))}
                      </TextField>
                      {/* Custom type field shown only when "other" is selected */}
                      {editType === "other" && (
                        <TextField
                          fullWidth size="small" label="Custom type label *"
                          placeholder='e.g. "workshop", "webinar", "review"'
                          value={editCustomType}
                          onChange={(e) => setEditCustomType(e.target.value)}
                          inputProps={{ maxLength: 30 }}
                          helperText="This label will be saved as the event type"
                        />
                      )}
                      <TextField
                        fullWidth size="small" label="Description" multiline rows={2}
                        value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                      />
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small" variant="contained"
                          startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <Save />}
                          onClick={() => handleUpdate(ev._id)}
                          disabled={saving || !editTitle.trim() || (editType === "other" && !editCustomType.trim())}
                        >
                          Save
                        </Button>
                        <Button size="small" startIcon={<Cancel />} onClick={() => setEditingId(null)}>Cancel</Button>
                      </Box>
                    </Box>
                  ) : (
                    // ── View row ──
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <Event sx={{ fontSize: 18, color: `${resolveColor(ev.type)}.main`, mt: 0.3, flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</Typography>
                        {ev.description && (
                          <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.3 }}>{ev.description}</Typography>
                        )}
                        <Chip
                          label={ev.type} size="small"
                          color={resolveColor(ev.type)}
                          sx={{ fontSize: 10, height: 18, mt: 0.5 }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => startEdit(ev)} disabled={saving}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(ev._id)} disabled={saving} sx={{ color: "error.main" }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* ── Add new event ── */}
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>Add New Event</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <TextField
              fullWidth size="small" label="Event title" required
              value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newTitle.trim()) handleCreate(); }}
            />
            <TextField
              fullWidth size="small" select label="Type"
              value={newType} onChange={(e) => setNewType(e.target.value)}
            >
              {EVENT_TYPES.map((t) => (
                <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>
                  {t === "other" ? "Other (custom)" : t}
                </MenuItem>
              ))}
            </TextField>

            {/* Custom type text field — appears only when "Other" is selected */}
            {newType === "other" && (
              <TextField
                fullWidth size="small" label="Custom type label *" required
                placeholder='e.g. "workshop", "webinar", "review"'
                value={newCustomType}
                onChange={(e) => setNewCustomType(e.target.value)}
                inputProps={{ maxLength: 30 }}
                helperText='Type any label — it will be saved as the event type'
              />
            )}

            <TextField
              fullWidth size="small" label="Description (optional)"
              multiline rows={2}
              value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDialogOpen(false); setEditingId(null); }} size="small">Close</Button>
          <Button
            variant="contained" size="small"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Add />}
            onClick={handleCreate}
            disabled={
              saving || !newTitle.trim() ||
              (newType === "other" && !newCustomType.trim())
            }
          >
            Add Event
          </Button>
        </DialogActions>
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