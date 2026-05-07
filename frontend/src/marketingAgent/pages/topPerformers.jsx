import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment, Tooltip, Divider, Alert, Snackbar,
  FormControl, InputLabel, Select, FormHelperText, CircularProgress,
} from "@mui/material";
import {
  EmojiEvents, Add, Edit, Delete, Search,
  TrendingUp, Star, Person, Close, Visibility, WorkspacePremium,
  Leaderboard, Refresh, CheckCircle,
} from "@mui/icons-material";

// CONFIG 
const API = import.meta.env.VITE_API_BASE_URL;

const REGIONS      = ["North","South","East","West","Central","Northeast","Northwest","Other"];
const DESIGNATIONS = ["Medical Representative","Senior MR","Area Sales Manager","Regional Sales Manager","Territory Manager","Field Executive","Other"];
const AWARD_TYPES  = ["Top Performer","Best Achiever","Star Performer","Diamond Club","President Club","Other"];
const PERIODS      = ["Monthly","Quarterly","Half-Yearly","Annually","Other"];
const MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QUARTERS     = ["Q1 (Jan–Mar)","Q2 (Apr–Jun)","Q3 (Jul–Sep)","Q4 (Oct–Dec)"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => String(currentYear + 1 - i));
const MEDAL_COLORS = ["#FFD700","#C0C0C0","#CD7F32"];

const INIT_FORM = {
  agentName:"", agentId:"", designation:"", designationOther:"",
  region:"", regionOther:"", awardType:"", awardTypeOther:"",
  period:"", periodOther:"", month:"", quarter:"", year:"",
  rank:"", totalSales:"", targetsAchieved:"", conversionRate:"",
  leadsGenerated:"", placesCovered:"", incentiveEarned:"", pointsEarned:"", remarks:"",
};

// ─── VALIDATION ───────────────────────────────────────────────────────────────
function validate(form) {
  const e = {};
  const req  = (f, msg) => { if (!String(form[f] ?? "").trim()) e[f] = msg; };
  const num  = (f, msg, min=0, max=Infinity) => {
    const v = Number(form[f]);
    if (form[f] === "" || form[f] === null || form[f] === undefined) { e[f] = msg; return; }
    if (isNaN(v) || v < min || v > max) e[f] = `Must be ${min}–${max}`;
  };

  req("agentName",  "Agent name is required");
  req("agentId",    "Agent ID is required");
  req("designation","Designation is required");
  if (form.designation === "Other") req("designationOther","Please specify");
  req("region",     "Region is required");
  if (form.region === "Other") req("regionOther","Please specify");
  req("awardType",  "Award type is required");
  if (form.awardType === "Other") req("awardTypeOther","Please specify");
  req("period",     "Period is required");
  if (form.period === "Monthly")   req("month",  "Month is required");
  if (form.period === "Quarterly") req("quarter","Quarter is required");
  req("year", "Year is required");

  num("rank",           "Rank is required", 1, 999);
  num("totalSales",     "Total sales is required", 0);
  num("targetsAchieved","Target % is required", 0, 100);
  num("conversionRate", "Conversion % is required", 0, 100);
  num("leadsGenerated", "Leads is required", 0);
  num("placesCovered",  "Places is required", 0);
  num("incentiveEarned","Incentive is required", 0);
  num("pointsEarned",   "Points is required", 0);

  return { errors: e, valid: Object.keys(e).length === 0 };
}

// ─── SMALL UI PIECES ─────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <Paper elevation={0} sx={{
      p:2.5, borderRadius:3, border:"1px solid", borderColor:"divider",
      display:"flex", alignItems:"center", gap:2,
      transition:"transform .2s,box-shadow .2s",
      "&:hover":{ transform:"translateY(-2px)", boxShadow:3 },
    }}>
      <Box sx={{ p:1.5, borderRadius:2, bgcolor:`${color}18` }}>
        <Box sx={{ color, fontSize:28, display:"flex" }}>{icon}</Box>
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
      </Box>
    </Paper>
  );
}

function PodiumCard({ performer, index }) {
  if (!performer) return null;
  return (
    <Paper elevation={0} sx={{
      p:3, borderRadius:3, textAlign:"center",
      border:"2px solid", borderColor:MEDAL_COLORS[index],
      background:`linear-gradient(135deg,${MEDAL_COLORS[index]}12,${MEDAL_COLORS[index]}06)`,
      transition:"transform .2s", "&:hover":{ transform:"translateY(-4px)", boxShadow:4 },
    }}>
      <Typography fontSize={32} mb={1}>{["🥇","🥈","🥉"][index]}</Typography>
      <Avatar sx={{ width:64, height:64, mx:"auto", mb:1.5, bgcolor:MEDAL_COLORS[index], color:"#fff", fontSize:22, fontWeight:800 }}>
        {performer.agentName.charAt(0)}
      </Avatar>
      <Typography fontWeight={800} fontSize={15}>{performer.agentName}</Typography>
      <Typography variant="caption" color="text.secondary">{performer.designation}</Typography>
      <Divider sx={{ my:1.5 }} />
      <Box sx={{ display:"flex", justifyContent:"space-around" }}>
        <Box>
          <Typography fontWeight={700} fontSize={13}>₹{Number(performer.totalSales).toLocaleString()}</Typography>
          <Typography variant="caption" color="text.secondary">Sales</Typography>
        </Box>
        <Box>
          <Typography fontWeight={700} fontSize={13} color="success.main">{performer.targetsAchieved}%</Typography>
          <Typography variant="caption" color="text.secondary">Target</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

// Dropdown with optional "Other" expander
function DropField({ label, name, value, error, onChange, options, otherName, otherValue, otherError }) {
  return (
    <>
      <FormControl fullWidth size="small" error={!!error} required>
        <InputLabel>{label}</InputLabel>
        <Select name={name} value={value} onChange={onChange} label={label}>
          {options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
      {value === "Other" && otherName && (
        <TextField
          label={`Specify ${label}`} name={otherName} value={otherValue ?? ""} onChange={onChange}
          error={!!otherError} helperText={otherError}
          required fullWidth size="small" sx={{ mt:1.5 }}
        />
      )}
    </>
  );
}

// Text field (no digits)
function TxtField({ label, name, value, error, onChange, required=true }) {
  return (
    <TextField
      label={label} name={name} value={value} onChange={onChange}
      error={!!error} helperText={error}
      required={required} fullWidth size="small"
    />
  );
}

// Number field
function NumField({ label, name, value, error, onChange, prefix, suffix, required=true }) {
  return (
    <TextField
      label={label} name={name} value={value} onChange={onChange}
      error={!!error} helperText={error}
      required={required} fullWidth size="small" inputProps={{ inputMode:"decimal" }}
      InputProps={{
        startAdornment: prefix ? <InputAdornment position="start">{prefix}</InputAdornment> : undefined,
        endAdornment:   suffix ? <InputAdornment position="end">{suffix}</InputAdornment>   : undefined,
      }}
    />
  );
}

// ─── FORM DIALOG (defined OUTSIDE main component) ────────────────────────────
function FormDialog({ open, onClose, form, errors, onChange, onSubmit, submitting, editId }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx:{ borderRadius:3 } }}>
      <DialogTitle sx={{ display:"flex", alignItems:"center", gap:1, pb:1 }}>
        <EmojiEvents color="warning" />
        <Typography fontWeight={700} fontSize={18}>
          {editId ? "Edit Top Performer" : "Add Top Performer"}
        </Typography>
        <IconButton onClick={onClose} sx={{ ml:"auto" }}><Close /></IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt:2.5 }}>
        <Grid container spacing={2}>

          {/* Agent Info */}
          <Grid item xs={12}>
            <Typography variant="overline" color="primary" fontWeight={700}>Agent Information</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TxtField label="Agent Full Name" name="agentName" value={form.agentName} error={errors.agentName} onChange={onChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TxtField label="Agent ID" name="agentId" value={form.agentId} error={errors.agentId} onChange={onChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DropField label="Designation" name="designation" value={form.designation} error={errors.designation}
              onChange={onChange} options={DESIGNATIONS}
              otherName="designationOther" otherValue={form.designationOther} otherError={errors.designationOther} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DropField label="Region" name="region" value={form.region} error={errors.region}
              onChange={onChange} options={REGIONS}
              otherName="regionOther" otherValue={form.regionOther} otherError={errors.regionOther} />
          </Grid>

          {/* Award Details */}
          <Grid item xs={12}><Divider /><Typography variant="overline" color="primary" fontWeight={700} sx={{ mt:1, display:"block" }}>Award Details</Typography></Grid>
          <Grid item xs={12} sm={6}>
            <DropField label="Award Type" name="awardType" value={form.awardType} error={errors.awardType}
              onChange={onChange} options={AWARD_TYPES}
              otherName="awardTypeOther" otherValue={form.awardTypeOther} otherError={errors.awardTypeOther} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumField label="Rank" name="rank" value={form.rank} error={errors.rank} onChange={onChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DropField label="Period Type" name="period" value={form.period} error={errors.period}
              onChange={onChange} options={PERIODS}
              otherName="periodOther" otherValue={form.periodOther} otherError={errors.periodOther} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" required error={!!errors.year}>
              <InputLabel>Year</InputLabel>
              <Select name="year" value={form.year} onChange={onChange} label="Year">
                {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
              {errors.year && <FormHelperText>{errors.year}</FormHelperText>}
            </FormControl>
          </Grid>
          {form.period === "Monthly" && (
            <Grid item xs={12} sm={6}>
              <DropField label="Month" name="month" value={form.month} error={errors.month}
                onChange={onChange} options={MONTHS} />
            </Grid>
          )}
          {form.period === "Quarterly" && (
            <Grid item xs={12} sm={6}>
              <DropField label="Quarter" name="quarter" value={form.quarter} error={errors.quarter}
                onChange={onChange} options={QUARTERS} />
            </Grid>
          )}

          {/* Performance Metrics */}
          <Grid item xs={12}><Divider /><Typography variant="overline" color="primary" fontWeight={700} sx={{ mt:1, display:"block" }}>Performance Metrics</Typography></Grid>
          <Grid item xs={12} sm={6}>
            <NumField label="Total Sales" name="totalSales" value={form.totalSales} error={errors.totalSales} onChange={onChange} prefix="₹" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumField label="Targets Achieved" name="targetsAchieved" value={form.targetsAchieved} error={errors.targetsAchieved} onChange={onChange} suffix="%" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumField label="Conversion Rate" name="conversionRate" value={form.conversionRate} error={errors.conversionRate} onChange={onChange} suffix="%" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumField label="Leads Generated" name="leadsGenerated" value={form.leadsGenerated} error={errors.leadsGenerated} onChange={onChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumField label="Places Covered" name="placesCovered" value={form.placesCovered} error={errors.placesCovered} onChange={onChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumField label="Incentive Earned" name="incentiveEarned" value={form.incentiveEarned} error={errors.incentiveEarned} onChange={onChange} prefix="₹" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumField label="Points Earned" name="pointsEarned" value={form.pointsEarned} error={errors.pointsEarned} onChange={onChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Remarks (Optional)" name="remarks" value={form.remarks} onChange={onChange}
              fullWidth size="small" multiline rows={3} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px:3, pb:2.5, gap:1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Cancel</Button>
        <Button onClick={onSubmit} variant="contained" color="warning" disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
          sx={{ fontWeight:700 }}>
          {submitting ? "Saving…" : editId ? "Update" : "Add Performer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── VIEW DIALOG (defined OUTSIDE main component) ─────────────────────────────
function ViewDialog({ open, onClose, performer }) {
  if (!performer) return null;
  const rows = [
    ["Award",          performer.awardType],
    ["Period",         `${performer.period} ${performer.month || performer.quarter || ""} ${performer.year}`.trim()],
    ["Total Sales",    `₹${Number(performer.totalSales).toLocaleString()}`],
    ["Target Achieved",`${performer.targetsAchieved}%`],
    ["Conversion Rate",`${performer.conversionRate}%`],
    ["Leads Generated", performer.leadsGenerated],
    ["Places Covered",  performer.placesCovered],
    ["Incentive Earned",`₹${Number(performer.incentiveEarned).toLocaleString()}`],
    ["Points Earned",   performer.pointsEarned],
  ];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
      <DialogTitle sx={{ display:"flex", alignItems:"center", gap:1 }}>
        <WorkspacePremium color="warning" />
        <Typography fontWeight={700}>Performer Details</Typography>
        <IconButton onClick={onClose} sx={{ ml:"auto" }}><Close /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box sx={{ textAlign:"center", mb:3 }}>
          <Avatar sx={{ width:80, height:80, mx:"auto", mb:2, bgcolor:"warning.main", fontSize:30, fontWeight:800 }}>
            {performer.agentName.charAt(0)}
          </Avatar>
          <Typography fontWeight={800} fontSize={20}>{performer.agentName}</Typography>
          <Typography color="text.secondary">{performer.designation} — {performer.region}</Typography>
          <Chip label={`Rank #${performer.rank}`} color="warning" sx={{ mt:1, fontWeight:700 }} />
        </Box>
        <Grid container spacing={1.5}>
          {rows.map(([k, v]) => (
            <Grid item xs={6} key={k}>
              <Paper elevation={0} sx={{ p:1.5, borderRadius:2, border:"1px solid", borderColor:"divider", bgcolor:"background.default" }}>
                <Typography variant="caption" color="text.secondary">{k}</Typography>
                <Typography fontWeight={700} fontSize={14}>{v}</Typography>
              </Paper>
            </Grid>
          ))}
          {performer.remarks && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p:1.5, borderRadius:2, border:"1px solid", borderColor:"divider", bgcolor:"background.default" }}>
                <Typography variant="caption" color="text.secondary">Remarks</Typography>
                <Typography fontSize={14}>{performer.remarks}</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TopPerformers() {
  const [performers,    setPerformers]    = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [search,        setSearch]        = useState("");
  const [formOpen,      setFormOpen]      = useState(false);
  const [viewOpen,      setViewOpen]      = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editId,        setEditId]        = useState(null);
  const [viewPerformer, setViewPerformer] = useState(null);
  const [form,          setForm]          = useState(INIT_FORM);
  const [errors,        setErrors]        = useState({});
  const [submitting,    setSubmitting]    = useState(false);
  const [snack,         setSnack]         = useState({ open:false, msg:"", severity:"success" });

  // ── fetch ──
  const fetchPerformers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/top-performers`);
      const data = await res.json();
      setPerformers(Array.isArray(data) ? data : []);
    } catch {
      showSnack("Failed to load performers", "error");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPerformers(); }, [fetchPerformers]);

  const showSnack = (msg, severity = "success") => setSnack({ open:true, msg, severity });

  // ── handlers ──
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => { const next = { ...er }; delete next[name]; return next; });
  }, []);

  const openAdd = () => {
    setForm(INIT_FORM); setErrors({}); setEditId(null); setFormOpen(true);
  };

  const openEdit = (p) => {
    setForm({ ...INIT_FORM, ...p }); setErrors({}); setEditId(p._id); setFormOpen(true);
  };

  const handleSubmit = async () => {
    const { errors: errs, valid } = validate(form);
    setErrors(errs);
    if (!valid) { showSnack("Please fix all errors", "error"); return; }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        rank:            Number(form.rank),
        totalSales:      Number(form.totalSales),
        targetsAchieved: Number(form.targetsAchieved),
        conversionRate:  Number(form.conversionRate),
        leadsGenerated:  Number(form.leadsGenerated),
        placesCovered:   Number(form.placesCovered),
        incentiveEarned: Number(form.incentiveEarned),
        pointsEarned:    Number(form.pointsEarned),
      };

      const url    = editId ? `${API}/api/top-performers/${editId}` : `${API}/api/top-performers`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Save failed");
      }

      showSnack(editId ? "Performer updated!" : "Performer added!");
      setFormOpen(false);
      await fetchPerformers();
    } catch (e) {
      showSnack(e.message || "Error saving performer", "error");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/api/top-performers/${id}`, { method:"DELETE" });
      showSnack("Performer removed!");
      await fetchPerformers();
    } catch { showSnack("Delete failed", "error"); }
    setDeleteConfirm(null);
  };

  // ── derived ──
  const filtered = performers.filter(p =>
    (p.agentName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.agentId   ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.region    ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const top3 = [...performers].sort((a,b) => Number(a.rank) - Number(b.rank)).slice(0,3);

  const totalIncentive = performers.reduce((a, p) => a + Number(p.incentiveEarned || 0), 0);
  const totalPoints    = performers.reduce((a, p) => a + Number(p.pointsEarned    || 0), 0);
  const avgTarget      = performers.length
    ? Math.round(performers.reduce((a,p) => a + Number(p.targetsAchieved||0), 0) / performers.length)
    : null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p:{ xs:2, md:3 }, bgcolor:"background.default", minHeight:"100vh" }}>

      {/* Header */}
      <Box sx={{ display:"flex", alignItems:"center", justifyContent:"space-between", mb:3, flexWrap:"wrap", gap:2 }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:1.5 }}>
          <Box sx={{ p:1.5, bgcolor:"warning.main", borderRadius:2, display:"flex" }}>
            <Leaderboard sx={{ color:"white", fontSize:28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>Top Performers</Typography>
            <Typography variant="caption" color="text.secondary">Leaderboard & Recognition Management</Typography>
          </Box>
        </Box>
        <Box sx={{ display:"flex", gap:1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchPerformers} disabled={loading}><Refresh /></IconButton>
          </Tooltip>
          <Button variant="contained" color="warning" startIcon={<Add />} onClick={openAdd} sx={{ fontWeight:700 }}>
            Add Performer
          </Button>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Performers" value={performers.length}          icon={<Person />}      color="#1d4ed8" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Avg Target %"     value={avgTarget != null ? `${avgTarget}%` : "—"} icon={<TrendingUp />} color="#16a34a" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Incentives" value={performers.length ? `₹${totalIncentive.toLocaleString()}` : "—"} icon={<Star />} color="#d97706" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Points"     value={totalPoints.toLocaleString()}               icon={<EmojiEvents />} color="#7c3aed" />
        </Grid>
      </Grid>

      {/* Podium */}
      {top3.length > 0 && (
        <Box mb={3}>
          <Typography fontWeight={700} mb={1.5} sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <EmojiEvents color="warning" fontSize="small" /> Hall of Fame — Top 3
          </Typography>
          <Grid container spacing={2}>
            {top3.map((p,i) => (
              <Grid item xs={12} sm={4} key={p._id}>
                <PodiumCard performer={p} index={i} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius:3, border:"1px solid", borderColor:"divider" }}>
        <Box sx={{ p:2, display:"flex", alignItems:"center", gap:2, flexWrap:"wrap" }}>
          <TextField
            size="small" placeholder="Search name, ID, region…"
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment:<InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ minWidth:240 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml:"auto" }}>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:"action.hover" }}>
                {["Rank","Agent","Designation","Region","Award","Period","Sales","Target %","Conversion","Incentive","Points","Actions"].map(h => (
                  <TableCell key={h} sx={{ fontWeight:700, fontSize:12, whiteSpace:"nowrap" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py:6 }}>
                    <CircularProgress color="warning" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py:6, color:"text.secondary" }}>
                    No performers found. Click "Add Performer" to get started.
                  </TableCell>
                </TableRow>
              ) : filtered.map((p) => {
                const rankNum = Number(p.rank);
                const medalLabel = rankNum === 1 ? "🥇 1st" : rankNum === 2 ? "🥈 2nd" : rankNum === 3 ? "🥉 3rd" : `#${rankNum}`;
                const medalColor = rankNum <= 3 ? MEDAL_COLORS[rankNum-1] : undefined;
                return (
                  <TableRow key={p._id} hover sx={{ "&:last-child td":{ borderBottom:0 } }}>
                    <TableCell>
                      <Chip label={medalLabel} size="small" sx={{
                        fontWeight:700, fontSize:11,
                        bgcolor: medalColor ? `${medalColor}22` : "action.hover",
                        color:   medalColor ?? "text.primary",
                        border:  medalColor ? `1px solid ${medalColor}` : "none",
                      }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                        <Avatar sx={{ width:32, height:32, bgcolor:"primary.main", fontSize:13, fontWeight:700 }}>
                          {p.agentName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600} fontSize={13}>{p.agentName}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.agentId}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography fontSize={13}>{p.designation}</Typography></TableCell>
                    <TableCell><Chip label={p.region} size="small" /></TableCell>
                    <TableCell><Chip label={p.awardType} size="small" color="warning" variant="outlined" /></TableCell>
                    <TableCell>
                      <Typography fontSize={12}>{p.period}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.month || p.quarter || ""} {p.year}</Typography>
                    </TableCell>
                    <TableCell><Typography fontWeight={600} fontSize={13}>₹{Number(p.totalSales).toLocaleString()}</Typography></TableCell>
                    <TableCell>
                      <Chip label={`${p.targetsAchieved}%`} size="small"
                        color={Number(p.targetsAchieved) >= 100 ? "success" : "default"} />
                    </TableCell>
                    <TableCell><Typography fontSize={13}>{p.conversionRate}%</Typography></TableCell>
                    <TableCell><Typography fontWeight={600} fontSize={13} color="success.main">₹{Number(p.incentiveEarned).toLocaleString()}</Typography></TableCell>
                    <TableCell><Typography fontSize={13}>{Number(p.pointsEarned).toLocaleString()}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display:"flex", gap:0.5 }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => { setViewPerformer(p); setViewOpen(true); }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => openEdit(p)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteConfirm(p._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Dialogs (stable — not re-mounted on state change) ── */}
      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        form={form}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitting={submitting}
        editId={editId}
      />

      <ViewDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        performer={viewPerformer}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle fontWeight={700}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this performer? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2 }}>
          <Button onClick={() => setDeleteConfirm(null)} variant="outlined">Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} variant="contained" color="error" sx={{ fontWeight:700 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open:false }))}
        anchorOrigin={{ vertical:"bottom", horizontal:"center" }}>
        <Alert severity={snack.severity} variant="filled"
          onClose={() => setSnack(s => ({ ...s, open:false }))}
          sx={{ borderRadius:2, fontWeight:600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}