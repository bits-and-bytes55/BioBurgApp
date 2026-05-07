import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Grid, TextField, MenuItem, Typography, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Chip, Skeleton, Alert, InputAdornment, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  LinearProgress,
} from "@mui/material";
import { Search, Refresh, Add, Edit, EmojiEvents,
  HourglassEmpty, CheckCircle, Cancel, Upload } from "@mui/icons-material";
import axios from "axios";
import PageShell from "./Pageshell";

const API   = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const token = () => localStorage.getItem("agentToken");

const STATUS_COLOR = {
  Open     : { bg:"#dbeafe", color:"#1d4ed8" },
  Submitted: { bg:"#fef9c3", color:"#a16207" },
  Won      : { bg:"#dcfce7", color:"#16a34a" },
  Lost     : { bg:"#fee2e2", color:"#dc2626" },
  Cancelled: { bg:"#f3f4f6", color:"#6b7280" },
  Pending  : { bg:"#ede9fe", color:"#7c3aed" },
};

const fmtDate = iso =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"2-digit" }) : "—";

// ── Add/Edit Tender Dialog ────────────────────────────────────────────────────
function TenderDialog({ open, hospitals, editData, onClose, onSaved }) {
  const isEdit = !!editData;
  const [hospitalId, setHospitalId] = useState(editData?.hospitalId || "");
  const [form, setForm] = useState({
    tenderNo:"", description:"", products:"", quantity:"",
    estimatedValue:"", submissionDate:"", resultDate:"",
    status:"Open", remarks:"",
    ...(editData ? {
      ...editData,
      submissionDate: editData.submissionDate ? editData.submissionDate.split("T")[0] : "",
      resultDate    : editData.resultDate     ? editData.resultDate.split("T")[0]     : "",
      products      : Array.isArray(editData.products) ? editData.products.join(", ") : editData.products || "",
    } : {}),
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    if (editData) {
      setHospitalId(editData.hospitalId);
      setForm({
        tenderNo: editData.tenderNo||"", description: editData.description||"",
        products: Array.isArray(editData.products) ? editData.products.join(", ") : editData.products||"",
        quantity: editData.quantity||"", estimatedValue: editData.estimatedValue||"",
        submissionDate: editData.submissionDate ? editData.submissionDate.split("T")[0] : "",
        resultDate    : editData.resultDate     ? editData.resultDate.split("T")[0]     : "",
        status: editData.status||"Open", remarks: editData.remarks||"",
      });
    } else {
      setHospitalId(""); setForm({ tenderNo:"", description:"", products:"", quantity:"",
        estimatedValue:"", submissionDate:"", resultDate:"", status:"Open", remarks:"" });
    }
  }, [editData, open]);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    if (!hospitalId)          { setError("Select a hospital"); return; }
    if (!form.description)    { setError("Description is required"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        products: form.products ? form.products.split(",").map(p => p.trim()).filter(Boolean) : [],
      };
      if (isEdit) {
        await axios.put(
          `${API}/api/agent/crm/hospitals/${editData.hospitalId}/tenders/${editData._id}`,
          payload, { headers: { Authorization: `Bearer ${token()}` } }
        );
      } else {
        await axios.post(
          `${API}/api/agent/crm/hospitals/${hospitalId}/tenders`,
          payload, { headers: { Authorization: `Bearer ${token()}` } }
        );
      }
      onSaved(); onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Tender" : "Add Tender"}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          {!isEdit && (
            <Grid item xs={12}>
              <TextField fullWidth select size="small" label="Hospital *" value={hospitalId}
                onChange={e => setHospitalId(e.target.value)}>
                <MenuItem value="" disabled>Select hospital…</MenuItem>
                {hospitals.map(h => <MenuItem key={h._id} value={h._id}>{h.name} — {h.area}</MenuItem>)}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Tender No. / Reference"
              value={form.tenderNo} onChange={set("tenderNo")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth select size="small" label="Status" value={form.status}
              onChange={set("status")}>
              {["Open","Pending","Submitted","Won","Lost","Cancelled"].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Description / Scope *" multiline rows={2}
              value={form.description} onChange={set("description")} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small"
              label="Products (comma-separated, e.g. Product A, Product B)"
              value={form.products} onChange={set("products")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Quantity"
              value={form.quantity} onChange={set("quantity")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Estimated Value (₹)"
              value={form.estimatedValue} onChange={set("estimatedValue")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Submission Date" type="date"
              value={form.submissionDate} onChange={set("submissionDate")}
              InputLabelProps={{ shrink:true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Result / Award Date" type="date"
              value={form.resultDate} onChange={set("resultDate")}
              InputLabelProps={{ shrink:true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Remarks" multiline rows={2}
              value={form.remarks} onChange={set("remarks")} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Update Tender" : "Add Tender"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TenderDetails() {
  const [tenders,    setTenders]   = useState([]);
  const [hospitals,  setHospitals] = useState([]);
  const [stats,      setStats]     = useState({ won:0, submitted:0, open:0, lost:0 });
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState("");
  const [search,     setSearch]    = useState("");
  const [statusFilter,setStatusFilter] = useState("All");
  const [dialog,     setDialog]    = useState({ open:false, editData:null });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [tRes, hRes] = await Promise.all([
        axios.get(`${API}/api/agent/crm/hospitals/tenders${statusFilter !== "All" ? `?status=${statusFilter}` : ""}`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
        axios.get(`${API}/api/agent/crm/hospitals`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
      ]);
      setTenders(tRes.data.tenders);
      setStats(tRes.data.stats || { won:0, submitted:0, open:0, lost:0 });
      setHospitals(hRes.data.hospitals);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load tenders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = tenders.filter(t =>
    !search ||
    t.hospitalName?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.tenderNo?.toLowerCase().includes(search.toLowerCase())
  );

  const total     = stats.won + stats.submitted + stats.open + stats.lost;
  const winRate   = total > 0 ? Math.round((stats.won / total) * 100) : 0;

  return (
    <PageShell
      title="Tender Details"
      subtitle="Hospital supply tenders and bids"
      breadcrumb={[{ label:"CRM" }, { label:"Hospitals", link:"/agent/crm/hospitals" }, { label:"Tenders" }]}
      action={
        <Button startIcon={<Add />} variant="contained" size="small"
          onClick={() => setDialog({ open:true, editData:null })}>
          Add Tender
        </Button>
      }
    >
      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

      {/* ── Stats Cards ── */}
      <Grid container spacing={2} mb={2}>
        {[
          { label:"Total Tenders",  value:tenders.length, color:"#1d4ed8", icon:<Upload /> },
          { label:"Open",           value:stats.open,      color:"#1d4ed8", icon:<HourglassEmpty /> },
          { label:"Submitted",      value:stats.submitted, color:"#a16207", icon:<Upload /> },
          { label:"Won",            value:stats.won,       color:"#16a34a", icon:<EmojiEvents /> },
          { label:"Lost",           value:stats.lost,      color:"#dc2626", icon:<Cancel /> },
          { label:"Win Rate",       value:`${winRate}%`,   color:"#7c3aed", icon:<CheckCircle /> },
        ].map((s, i) => (
          <Grid item xs={6} sm={2} key={i}>
            <Paper elevation={0} sx={{ p:1.5, border:"1px solid", borderColor:"divider", borderRadius:3,
              textAlign:"center", background:`linear-gradient(135deg, ${s.color}08 0%, #fff 70%)` }}>
              <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Win rate bar */}
      {tenders.length > 0 && (
        <Paper elevation={0} sx={{ p:2, mb:2, border:"1px solid", borderColor:"divider", borderRadius:3 }}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" fontWeight={600} color="#16a34a">Won ({winRate}%)</Typography>
            <Typography variant="body2" fontWeight={600} color="#6b7280">Not Won ({100-winRate}%)</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={winRate}
            sx={{ height:8, borderRadius:4, bgcolor:"#f3f4f6",
              "& .MuiLinearProgress-bar":{ bgcolor:"#16a34a", borderRadius:4 } }} />
        </Paper>
      )}

      {/* Filters */}
      <Paper elevation={0} sx={{ p:2, mb:2, border:"1px solid", borderColor:"divider", borderRadius:3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" placeholder="Search hospital, description, tender no…"
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize:18 }} /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select size="small" label="Status" value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}>
              {["All","Open","Pending","Submitted","Won","Lost","Cancelled"].map(s => (
                <MenuItem key={s} value={s}>{s === "All" ? "All Statuses" : s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2} sx={{ display:"flex", justifyContent:"flex-end" }}>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={load} sx={{ bgcolor:"#f1f5f9" }}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={0}
        sx={{ border:"1px solid", borderColor:"divider", borderRadius:3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor:"#f8fafc" }}>
              {["Hospital","Tender No","Description","Products","Qty","Value (₹)","Submission","Result","Status","Actions"].map(h => (
                <TableCell key={h} sx={{ fontWeight:700, fontSize:12, py:1.5,
                  borderBottom:"2px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(10)].map((_, j) => <TableCell key={j}><Skeleton height={24} /></TableCell>)}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py:5, color:"text.disabled" }}>
                  No tenders found — add your first one
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t, i) => (
                <TableRow key={i} hover sx={{ "&:last-child td":{ borderBottom:0 } }}>
                  <TableCell>
                    <Typography fontSize={12} fontWeight={600}>{t.hospitalName}</Typography>
                    <Typography fontSize={11} color="text.secondary">{t.area}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize:12 }}>{t.tenderNo || "—"}</TableCell>
                  <TableCell sx={{ fontSize:12, maxWidth:160, overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    <Tooltip title={t.description}><span>{t.description}</span></Tooltip>
                  </TableCell>
                  <TableCell>
                    {(t.products||[]).length > 0 ? (
                      <Tooltip title={(t.products||[]).join(", ")}>
                        <Chip label={`${t.products.length} product(s)`} size="small"
                          sx={{ fontSize:10, bgcolor:"#ede9fe", color:"#7c3aed", cursor:"pointer" }} />
                      </Tooltip>
                    ) : "—"}
                  </TableCell>
                  <TableCell sx={{ fontSize:12 }}>{t.quantity || "—"}</TableCell>
                  <TableCell sx={{ fontSize:12, fontWeight:600 }}>
                    {t.estimatedValue ? `₹${t.estimatedValue}` : "—"}
                  </TableCell>
                  <TableCell sx={{ fontSize:12, whiteSpace:"nowrap" }}>{fmtDate(t.submissionDate)}</TableCell>
                  <TableCell sx={{ fontSize:12, whiteSpace:"nowrap" }}>{fmtDate(t.resultDate)}</TableCell>
                  <TableCell>
                    <Chip label={t.status} size="small"
                      sx={{ fontSize:10, fontWeight:700,
                        bgcolor: STATUS_COLOR[t.status]?.bg || "#f1f5f9",
                        color  : STATUS_COLOR[t.status]?.color || "#374151" }} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small"
                        onClick={() => setDialog({ open:true, editData:t })}>
                        <Edit sx={{ fontSize:15 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TenderDialog
        open={dialog.open}
        editData={dialog.editData}
        hospitals={hospitals}
        onClose={() => setDialog({ open:false, editData:null })}
        onSaved={load}
      />
    </PageShell>
  );
}