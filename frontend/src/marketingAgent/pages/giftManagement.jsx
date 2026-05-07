import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Avatar, Divider, Tabs, Tab, CircularProgress, Tooltip,
  InputAdornment, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, useTheme, useMediaQuery, Badge, LinearProgress,
  FormControl, InputLabel, Select,
} from "@mui/material";
import {
  CardGiftcard, Add, Edit, Delete, Close, Search, Refresh,
  Inventory2, CheckCircle, Warning, ErrorOutline, AttachMoney,
  CloudUpload, People, BarChart, LocalShipping, FilterList,
  Visibility, TrendingUp, Category,
} from "@mui/icons-material";

/* API  */
const BASE = import.meta.env.VITE_API_BASE_URL;
const api = () =>
  axios.create({
    baseURL: `${BASE}/api/agent/gifts`,
    headers: { Authorization: `Bearer ${localStorage.getItem("agentToken")}` },
  });

/* Constants  */
const CATEGORIES   = ["Promotional", "Festive", "Medical", "Stationery", "Electronics", "Other"];
const RECIPIENT_TYPES = ["Doctor", "Chemist", "Stockist", "Hospital", "Clinic", "Other"];

const CAT_COLORS = {
  Promotional: "#6366f1", Festive: "#f59e0b", Medical: "#10b981",
  Stationery: "#3b82f6", Electronics: "#8b5cf6", Other: "#64748b",
};

const STOCK_META = {
  "In Stock":    { color: "#10b981", bg: "#d1fae5", icon: <CheckCircle sx={{ fontSize: 13 }} /> },
  "Low Stock":   { color: "#f59e0b", bg: "#fef3c7", icon: <Warning     sx={{ fontSize: 13 }} /> },
  "Out of Stock":{ color: "#ef4444", bg: "#fee2e2", icon: <ErrorOutline sx={{ fontSize: 13 }} /> },
};

/* StatCard  */
const StatCard = ({ label, value, sub, icon, color }) => (
  <Card sx={{
    borderRadius: 3, border: "1.5px solid", borderColor: color + "30",
    background: `linear-gradient(135deg, ${color}0d 0%, #fff 100%)`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)", height: "100%",
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</Typography>
          {sub && <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.4 }}>{sub}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: color + "20", color, width: 42, height: 42, borderRadius: 2 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

/*  ImageUploader  */
const ImageUploader = ({ value, onChange, onRemove }) => {
  const ref = useRef(null);
  const handle = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be < 5 MB"); return; }
    const r = new FileReader();
    r.onloadend = () => onChange({ base64: r.result.split(",")[1], mime: file.type, preview: r.result });
    r.readAsDataURL(file);
  };
  return (
    <Box>
      <input ref={ref} type="file" accept="image/*" hidden onChange={e => handle(e.target.files[0])} />
      {value ? (
        <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", height: 100 }}>
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <IconButton size="small" onClick={onRemove}
            sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(0,0,0,0.55)", color: "#fff", width: 24, height: 24 }}>
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      ) : (
        <Box onClick={() => ref.current?.click()} sx={{
          height: 80, border: "2px dashed #cbd5e1", borderRadius: 2,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
          cursor: "pointer", bgcolor: "#f8fafc",
          "&:hover": { borderColor: "#6366f1", bgcolor: "#eef2ff" }, transition: "all 0.2s",
        }}>
          <CloudUpload sx={{ fontSize: 20, color: "#94a3b8" }} />
          <Typography sx={{ fontSize: 12, color: "#64748b" }}>Upload image (max 5 MB)</Typography>
        </Box>
      )}
    </Box>
  );
};

/*  GiftCard  */
const GiftCard = ({ gift, onEdit, onDelete, onDistribute }) => {
  const stockMeta = STOCK_META[gift.stockStatus] || STOCK_META["In Stock"];
  const catColor  = CAT_COLORS[gift.category] || "#64748b";
  const pct       = gift.totalQuantity > 0 ? (gift.availableQuantity / gift.totalQuantity) * 100 : 0;

  return (
    <Card sx={{
      borderRadius: 3, border: "1.5px solid #e2e8f0",
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden",
      transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
      "&:hover": { transform: "translateY(-3px)", boxShadow: "0 10px 32px rgba(0,0,0,0.11)" },
    }}>
      {/* Colour top bar */}
      <Box sx={{ height: 4, bgcolor: catColor }} />

      {/* Image */}
      <Box sx={{ height: 120, bgcolor: catColor + "12", position: "relative", overflow: "hidden" }}>
        {gift.image?.url ? (
          <img src={gift.image.url} alt={gift.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CardGiftcard sx={{ fontSize: 52, color: catColor + "80" }} />
          </Box>
        )}
        <Chip
          label={gift.category} size="small"
          sx={{ position: "absolute", top: 8, left: 8, bgcolor: catColor, color: "#fff", fontWeight: 700, fontSize: 10 }}
        />
      </Box>

      <CardContent sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0f172a", mb: 0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {gift.name}
        </Typography>
        {gift.description && (
          <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {gift.description}
          </Typography>
        )}

        {/* Stock bar */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
            <Chip label={gift.stockStatus} size="small" icon={stockMeta.icon}
              sx={{ fontSize: 10, fontWeight: 700, bgcolor: stockMeta.bg, color: stockMeta.color, height: 20, border: "none" }} />
            <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
              {gift.availableQuantity} / {gift.totalQuantity}
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={pct}
            sx={{ height: 5, borderRadius: 4, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { bgcolor: stockMeta.color, borderRadius: 4 } }} />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#1d4ed8" }}>
            ₹{gift.value.toLocaleString("en-IN")}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Distribute">
              <IconButton size="small" onClick={() => onDistribute(gift)}
                disabled={gift.availableQuantity === 0}
                sx={{ bgcolor: "#f0fdf4", color: "#10b981", width: 28, height: 28, "&:disabled": { opacity: 0.4 } }}>
                <LocalShipping sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(gift)}
                sx={{ bgcolor: "#eff6ff", color: "#3b82f6", width: 28, height: 28 }}>
                <Edit sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(gift._id)}
                sx={{ bgcolor: "#fef2f2", color: "#ef4444", width: 28, height: 28 }}>
                <Delete sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/*  GiftFormDialog  */
const EMPTY_GIFT = { name: "", category: "Promotional", description: "", totalQuantity: "", value: "" };

const GiftFormDialog = ({ open, onClose, onSaved, initial }) => {
  const [form, setForm]     = useState(EMPTY_GIFT);
  const [img, setImg]       = useState(null);   // { base64, mime, preview }
  const [rmImg, setRmImg]   = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?._id;

  useEffect(() => {
    if (!open) return;
    setForm(initial
      ? { name: initial.name, category: initial.category, description: initial.description || "", totalQuantity: initial.totalQuantity, value: initial.value }
      : EMPTY_GIFT
    );
    setImg(null); setRmImg(false);
  }, [open, initial]);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, totalQuantity: Number(form.totalQuantity), value: Number(form.value) };
      if (img?.base64)  { payload.imageBase64 = img.base64; payload.imageMimeType = img.mime; }
      else if (rmImg)   { payload.removeImage = true; }

      isEdit
        ? await api().put(`/${initial._id}`, payload)
        : await api().post("/", payload);

      toast.success(isEdit ? "Gift updated " : "Gift added ");
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const previewSrc = img?.preview || (!rmImg && initial?.image?.url) || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, fontSize: 17, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ bgcolor: "#6366f110", color: "#6366f1", width: 34, height: 34, borderRadius: 1.5 }}>
            <CardGiftcard fontSize="small" />
          </Avatar>
          {isEdit ? "Edit Gift" : "Add New Gift"}
        </Box>
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField fullWidth label="Gift Name *" value={form.name} onChange={f("name")} size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Category" value={form.category} onChange={f("category")} size="small" select>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Total Quantity *" value={form.totalQuantity} onChange={f("totalQuantity")}
              size="small" type="number" inputProps={{ min: 0 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Value per Unit (₹) *" value={form.value} onChange={f("value")}
              size="small" type="number" inputProps={{ min: 0 }}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" value={form.description} onChange={f("description")}
              size="small" multiline rows={2} placeholder="Brief description of the gift…" />
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#475569", mb: 0.8 }}>Gift Image (optional)</Typography>
            <ImageUploader
              value={previewSrc}
              onChange={d => { setImg(d); setRmImg(false); }}
              onRemove={() => { setImg(null); setRmImg(true); }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" sx={{ borderRadius: 2, borderColor: "#e2e8f0", color: "#64748b" }}>Cancel</Button>
        <Button onClick={submit} variant="contained" size="small" disabled={saving}
          startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <Add />}
          sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, borderRadius: 2, fontWeight: 700 }}>
          {saving ? "Saving…" : isEdit ? "Update Gift" : "Add Gift"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/*  DistributeDialog  */
const EMPTY_DIST = { recipientName: "", recipientType: "Doctor", recipientContact: "", area: "", quantity: 1, occasion: "", notes: "" };

const DistributeDialog = ({ open, onClose, gift, onSaved }) => {
  const [form, setForm]     = useState(EMPTY_DIST);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setForm({ ...EMPTY_DIST, quantity: 1 }); }, [open]);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.recipientName.trim()) { toast.error("Recipient name is required"); return; }
    if (form.quantity < 1 || form.quantity > gift.availableQuantity) {
      toast.error(`Quantity must be between 1 and ${gift.availableQuantity}`); return;
    }
    setSaving(true);
    try {
      await api().post("/distribute", { ...form, giftId: gift._id, quantity: Number(form.quantity) });
      toast.success("Gift distributed successfully ");
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  if (!gift) return null;
  const stockMeta = STOCK_META[gift.stockStatus] || STOCK_META["In Stock"];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: CAT_COLORS[gift.category] + "20", color: CAT_COLORS[gift.category] }}>
            <LocalShipping fontSize="small" />
          </Avatar>
          Distribute Gift
        </Box>
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {/* Gift summary */}
        <Box sx={{ display: "flex", gap: 1.5, p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, mb: 2.5, alignItems: "center" }}>
          {gift.image?.url
            ? <img src={gift.image.url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
            : <Avatar sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: CAT_COLORS[gift.category] + "20", color: CAT_COLORS[gift.category] }}><CardGiftcard /></Avatar>
          }
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{gift.name}</Typography>
            <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>{gift.category} · ₹{gift.value} per unit</Typography>
          </Box>
          <Chip label={`${gift.availableQuantity} left`} size="small" icon={stockMeta.icon}
            sx={{ bgcolor: stockMeta.bg, color: stockMeta.color, fontWeight: 700, fontSize: 11 }} />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField fullWidth label="Recipient Name *" value={form.recipientName} onChange={f("recipientName")} size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Type *" value={form.recipientType} onChange={f("recipientType")} size="small" select>
              {RECIPIENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Contact Number" value={form.recipientContact} onChange={f("recipientContact")} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Area / Location" value={form.area} onChange={f("area")} size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Quantity *" value={form.quantity} onChange={f("quantity")}
              size="small" type="number" inputProps={{ min: 1, max: gift.availableQuantity }}
              helperText={`Max: ${gift.availableQuantity}`} />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField fullWidth label="Occasion" value={form.occasion} onChange={f("occasion")}
              size="small" placeholder="e.g. Doctor's Day, Product Launch…" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Notes" value={form.notes} onChange={f("notes")}
              size="small" multiline rows={2} placeholder="Any additional notes…" />
          </Grid>
        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" sx={{ borderRadius: 2, borderColor: "#e2e8f0", color: "#64748b" }}>Cancel</Button>
        <Button onClick={submit} variant="contained" size="small" disabled={saving}
          startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <LocalShipping sx={{ fontSize: 14 }} />}
          sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, borderRadius: 2, fontWeight: 700 }}>
          {saving ? "Distributing…" : "Distribute Gift"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* MAIN */
export default function GiftManagement() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [gifts,     setGifts]     = useState([]);
  const [dists,     setDists]     = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState(0);
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  const [formOpen,  setFormOpen]  = useState(false);
  const [editGift,  setEditGift]  = useState(null);
  const [distGift,  setDistGift]  = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [g, d, s] = await Promise.all([
        api().get("/"),
        api().get("/my-distributions"),
        api().get("/stats"),
      ]);
      setGifts(g.data);
      setDists(d.data);
      setStats(s.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load gifts");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api().delete(`/${deleteId}`);
      toast.success("Gift deleted");
      setDeleteId(null);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setDeleting(false); }
  };

  /* Filtered catalog */
  const filtered = gifts.filter(g => {
    const q  = search.toLowerCase();
    const ms = !q || g.name.toLowerCase().includes(q) || (g.description || "").toLowerCase().includes(q);
    const mc = catFilter === "All" || g.category === catFilter;
    const mk = stockFilter === "All" || g.stockStatus === stockFilter;
    return ms && mc && mk;
  });

  const totalInventoryValue = stats ? `₹${stats.totalValue.toLocaleString("en-IN")}` : "₹0";

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: { sm: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ p: 1.2, bgcolor: "#6366f1", borderRadius: 2.5, display: "flex", boxShadow: "0 4px 14px #6366f140" }}>
            <CardGiftcard sx={{ color: "#fff", fontSize: 26 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
              Gift Management
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#64748b" }}>
              Manage gift inventory & track distributions
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAll} sx={{ border: "1.5px solid #e2e8f0", color: "#475569", width: 40, height: 40 }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<Add />}
            onClick={() => { setEditGift(null); setFormOpen(true); }}
            sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, borderRadius: 2, fontWeight: 700, textTransform: "none", px: 2.5 }}>
            Add Gift
          </Button>
        </Box>
      </Box>

      {/* ── Stats ── */}
      {loading ? (
        <LinearProgress sx={{ mb: 3, borderRadius: 1, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: "#6366f1" } }} />
      ) : stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Total Gifts" value={stats.totalGifts} sub="in catalog" color="#6366f1" icon={<CardGiftcard />} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="In Stock" value={stats.inStock} sub="available" color="#10b981" icon={<CheckCircle />} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Low Stock" value={stats.lowStock} sub="≤ 5 units" color="#f59e0b" icon={<Warning />} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Out of Stock" value={stats.outOfStock} sub="need restock" color="#ef4444" icon={<ErrorOutline />} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Distributed" value={stats.distributed} sub="by me" color="#3b82f6" icon={<LocalShipping />} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Inventory Value" value={totalInventoryValue} sub="total worth" color="#8b5cf6" icon={<TrendingUp />} />
          </Grid>
        </Grid>
      )}

      {/* ── Tabs ── */}
      <Paper sx={{ borderRadius: 3, border: "1.5px solid #e2e8f0", boxShadow: "none", mb: 2.5, overflow: "hidden" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant={isMobile ? "fullWidth" : "standard"}
          sx={{ "& .MuiTab-root": { fontSize: 13, fontWeight: 600, textTransform: "none", minHeight: 48 }, "& .Mui-selected": { color: "#6366f1" }, "& .MuiTabs-indicator": { bgcolor: "#6366f1" } }}>
          <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}><Inventory2 sx={{ fontSize: 16 }} /> Gift Catalog <Chip label={gifts.length} size="small" sx={{ height: 17, fontSize: 10, fontWeight: 700, bgcolor: tab === 0 ? "#e0e7ff" : "#f1f5f9", color: tab === 0 ? "#6366f1" : "#64748b" }} /></Box>} />
          <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}><LocalShipping sx={{ fontSize: 16 }} /> My Distributions <Chip label={dists.length} size="small" sx={{ height: 17, fontSize: 10, fontWeight: 700, bgcolor: tab === 1 ? "#e0e7ff" : "#f1f5f9", color: tab === 1 ? "#6366f1" : "#64748b" }} /></Box>} />
        </Tabs>
      </Paper>

      {/* ── Catalog Tab ── */}
      {tab === 0 && (
        <>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1.5px solid #f1f5f9", display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField size="small" placeholder="Search gifts…" value={search} onChange={e => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 180, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: "#94a3b8" }} /></InputAdornment> }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Category</InputLabel>
              <Select value={catFilter} label="Category" onChange={e => setCatFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="All">All Categories</MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Stock</InputLabel>
              <Select value={stockFilter} label="Stock" onChange={e => setStockFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="All">All Stock</MenuItem>
                <MenuItem value="In Stock">In Stock</MenuItem>
                <MenuItem value="Low Stock">Low Stock</MenuItem>
                <MenuItem value="Out of Stock">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#6366f1" }} /></Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 10, border: "2px dashed #e2e8f0", borderRadius: 3 }}>
              <CardGiftcard sx={{ fontSize: 56, color: "#cbd5e1", mb: 2 }} />
              <Typography sx={{ fontWeight: 700, color: "#475569", mb: 0.5 }}>
                {search || catFilter !== "All" || stockFilter !== "All" ? "No gifts match your filters" : "No gifts added yet"}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#94a3b8", mb: 3 }}>
                {search || catFilter !== "All" ? "Try adjusting your search or filters" : "Add your first gift to get started"}
              </Typography>
              {!search && catFilter === "All" && (
                <Button variant="contained" startIcon={<Add />} onClick={() => { setEditGift(null); setFormOpen(true); }}
                  sx={{ bgcolor: "#6366f1", borderRadius: 2, textTransform: "none", fontWeight: 700 }}>
                  Add First Gift
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filtered.map(g => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={g._id}>
                  <GiftCard gift={g}
                    onEdit={gift => { setEditGift(gift); setFormOpen(true); }}
                    onDelete={id => setDeleteId(id)}
                    onDistribute={gift => setDistGift(gift)} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* ── Distributions Tab ── */}
      {tab === 1 && (
        loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#6366f1" }} /></Box>
        ) : dists.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, border: "2px dashed #e2e8f0", borderRadius: 3 }}>
            <LocalShipping sx={{ fontSize: 56, color: "#cbd5e1", mb: 2 }} />
            <Typography sx={{ fontWeight: 700, color: "#475569" }}>No distributions yet</Typography>
            <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>Distribute a gift from the catalog to see history here</Typography>
          </Box>
        ) : (
          <Paper sx={{ borderRadius: 3, border: "1.5px solid #e2e8f0", boxShadow: "none", overflow: "hidden" }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {["Gift", "Recipient", "Type", "Area", "Qty", "Value", "Occasion", "Date"].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dists.map(d => {
                    const catColor = CAT_COLORS[d.gift?.category] || "#64748b";
                    return (
                      <TableRow key={d._id} hover sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {d.gift?.image?.url
                              ? <img src={d.gift.image.url} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover" }} />
                              : <Avatar sx={{ width: 30, height: 30, borderRadius: 1, bgcolor: catColor + "20", color: catColor }}><CardGiftcard sx={{ fontSize: 14 }} /></Avatar>
                            }
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{d.gift?.name || "—"}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{d.recipientName}</TableCell>
                        <TableCell>
                          <Chip label={d.recipientType} size="small"
                            sx={{ fontSize: 10, height: 20, bgcolor: "#f1f5f9", color: "#475569", fontWeight: 600 }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: "#64748b" }}>{d.area || "—"}</TableCell>
                        <TableCell>
                          <Chip label={d.quantity} size="small"
                            sx={{ fontSize: 11, height: 20, bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 800 }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>
                          ₹{((d.gift?.value || 0) * d.quantity).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: "#64748b" }}>{d.occasion || "—"}</TableCell>
                        <TableCell sx={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                          {new Date(d.distributedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )
      )}

      {/* ── Dialogs ── */}
      <GiftFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditGift(null); }}
        onSaved={fetchAll} initial={editGift} />

      <DistributeDialog open={!!distGift} onClose={() => setDistGift(null)}
        gift={distGift} onSaved={fetchAll} />

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16, pb: 0.5 }}>Delete Gift?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: "#64748b" }}>
            This will permanently remove the gift and its image. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} size="small" sx={{ color: "#64748b", textTransform: "none" }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" size="small" disabled={deleting}
            startIcon={deleting ? <CircularProgress size={13} color="inherit" /> : <Delete sx={{ fontSize: 14 }} />}
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" }, textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}