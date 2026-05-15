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

const TIER_CONFIG = {
  A: { label:'A', color:'#7c3aed', bg:'#f5f3ff', desc:'₹50,000+',     min:50000 },
  B: { label:'B', color:'#1d4ed8', bg:'#eff6ff', desc:'₹20K–49,999',  min:20000 },
  C: { label:'C', color:'#0891b2', bg:'#ecfeff', desc:'₹5K–19,999',   min:5000  },
  D: { label:'D', color:'#64748b', bg:'#f1f5f9', desc:'Below ₹5,000', min:0     },
}

// Replace the old fixed getCustomerTier with this
const getCustomerTier = (totalValue, thresholds = { A:50000, B:20000, C:5000 }) => {
  if (totalValue >= thresholds.A) return 'A'
  if (totalValue >= thresholds.B) return 'B'
  if (totalValue >= thresholds.C) return 'C'
  return 'D'
}

// Days until next annual occurrence of a YYYY-MM-DD date
const getDaysUntil = (dateStr) => {
  if (!dateStr) return null
  const today  = new Date(); today.setHours(0,0,0,0)
  const d      = new Date(dateStr)
  let next     = new Date(today.getFullYear(), d.getMonth(), d.getDate())
  if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate())
  return Math.round((next - today) / 86400000)
}

const dayLabel = (n) => {
  if (n === 0) return { text:'Today!',     color:'#dc2626', bg:'#fef2f2' }
  if (n === 1) return { text:'Tomorrow',   color:'#d97706', bg:'#fffbeb' }
  return            { text:`In ${n} days`, color:'#0891b2', bg:'#ecfeff' }
}

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

const DIST_TYPES = [
  "Doctor","Physician","Chemist","Pharmacist","Stockist",
  "Hospital","Clinic","Nursing Home","Manager","Purchase Manager",
  "Receptionist","Nurse","Lab Technician","Owner","Administrator","Other"
]

const normalizeType = (role) => DIST_TYPES.includes(role) ? role : "Other"

const DistributeDialog = ({ open, onClose, gift, onSaved }) => {
  const allCustomers    = useCustomers()
  const [search,        setSearch]        = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [selected,      setSelected]      = useState(null)
  const [remarks,       setRemarks]       = useState('')
  const [img,           setImg]           = useState(null)
  const [qty,           setQty]           = useState(1)
  const [occasion,      setOccasion]      = useState('')
  const [saving,        setSaving]        = useState(false)
  const [showSettings,  setShowSettings]  = useState(false)
  const imgRef = useRef(null)

  // ── Configurable thresholds (persisted in localStorage) ──
  const [thresholds, setThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem('giftTierThresholds')
      return saved ? JSON.parse(saved) : { A:50000, B:20000, C:5000 }
    } catch { return { A:50000, B:20000, C:5000 } }
  })

  const saveThresholds = (t) => {
    setThresholds(t)
    localStorage.setItem('giftTierThresholds', JSON.stringify(t))
  }

  // Auto quartile: split actual customer data into 4 equal buckets
  const applyQuartile = () => {
    if (allCustomers.length < 4) return
    const sorted = [...allCustomers].map(c => c.totalValue).sort((a,b) => a - b)
    const q = (p) => sorted[Math.floor(sorted.length * p)]
    saveThresholds({ A: Math.round(q(0.75)), B: Math.round(q(0.5)), C: Math.round(q(0.25)) })
  }

  const tier    = (v) => getCustomerTier(v, thresholds)

  useEffect(() => {
    if (open) {
      setSearch(''); setSearchFocused(false); setSelected(null)
      setRemarks(''); setImg(null); setQty(1); setOccasion('')
      setShowSettings(false)
    }
  }, [open])

  const handleImgFile = (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be < 5 MB'); return }
    const r = new FileReader()
    r.onloadend = () => setImg({ base64: r.result.split(',')[1], mime: file.type, preview: r.result })
    r.readAsDataURL(file)
  }

  // Show ALL on focus, filter when typing
  const displayList = (searchFocused || search.trim().length >= 1)
    ? allCustomers.filter(c =>
        !search.trim() ||
        c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.area.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 10)
    : []

  const submit = async () => {
    if (!selected) { toast.error('Select a customer first'); return }
    if (qty < 1 || qty > gift.availableQuantity) {
      toast.error(`Qty must be 1–${gift.availableQuantity}`); return
    }
    if (!img) { toast.error('Please upload a proof photo'); return }
    setSaving(true)
    try {
      const payload = {
        giftId:           gift._id,
        recipientName:    selected.contactPerson,
        recipientType:    normalizeType(selected.recipientType),
        recipientContact: selected.phone,
        area:             selected.area,
        quantity:         Number(qty),
        occasion,
        notes:            remarks,
        customerTier:     tier(selected.totalValue),
      }
      if (img?.base64) { payload.proofImageBase64 = img.base64; payload.proofImageMime = img.mime }
      await api().post('/distribute', payload)
      toast.success('Gift distributed successfully')
      onSaved(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  if (!gift) return null
  const stockMeta  = STOCK_META[gift.stockStatus] || STOCK_META['In Stock']
  const selTier    = selected ? tier(selected.totalValue) : null
  const selTierCfg = selTier  ? TIER_CONFIG[selTier]     : null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx:{ borderRadius:3 } }}>

      <DialogTitle sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:800, pb:1 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
          <Avatar sx={{ width:36, height:36, borderRadius:1.5,
            bgcolor: CAT_COLORS[gift.category]+'20', color: CAT_COLORS[gift.category] }}>
            <LocalShipping fontSize="small" />
          </Avatar>
          Distribute Gift
        </Box>
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt:2 }}>

        {/* Gift summary */}
        <Box sx={{ display:'flex', gap:1.5, p:1.5, bgcolor:'#f8fafc', borderRadius:2, mb:2, alignItems:'center' }}>
          {gift.image?.url
            ? <img src={gift.image.url} alt="" style={{ width:48, height:48, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
            : <Avatar sx={{ width:48, height:48, borderRadius:2, bgcolor: CAT_COLORS[gift.category]+'20', color: CAT_COLORS[gift.category] }}><CardGiftcard /></Avatar>
          }
          <Box sx={{ flex:1, minWidth:0 }}>
            <Typography sx={{ fontWeight:700, fontSize:14 }}>{gift.name}</Typography>
            <Typography sx={{ fontSize:12, color:'#94a3b8' }}>{gift.category} · ₹{gift.value} per unit</Typography>
          </Box>
          <Chip label={`${gift.availableQuantity} left`} size="small" icon={stockMeta.icon}
            sx={{ bgcolor: stockMeta.bg, color: stockMeta.color, fontWeight:700, fontSize:11 }} />
        </Box>

        {/* ── Customer search ── */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
          <Typography sx={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'0.07em' }}>
            SELECT CUSTOMER
          </Typography>
          <Button size="small" onClick={() => setShowSettings(s => !s)}
            sx={{ fontSize:10, color: showSettings ? '#6366f1' : '#94a3b8',
              bgcolor: showSettings ? '#eef2ff' : 'transparent', borderRadius:1.5,
              minWidth:0, px:1, py:0.25 }}>
            ⚙ Tier Settings
          </Button>
        </Box>

        {/* ── Tier settings panel ── */}
        {showSettings && (
          <Box sx={{ p:1.5, mb:1.5, bgcolor:'#f8fafc', borderRadius:2,
            border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', gap:1.5 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Typography sx={{ fontSize:11, fontWeight:700, color:'#475569' }}>
                Minimum purchase to qualify for each tier
              </Typography>
              <Button size="small" onClick={applyQuartile}
                disabled={allCustomers.length < 4}
                sx={{ fontSize:10, bgcolor:'#eff6ff', color:'#1d4ed8', borderRadius:1.5,
                  fontWeight:700, minWidth:0, px:1.5, py:0.25,
                  '&:disabled':{ opacity:0.4 } }}>
                Auto (Quartile)
              </Button>
            </Box>
            <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1.5 }}>
              {[
                { key:'A', color:'#7c3aed', label:'Tier A min (₹)' },
                { key:'B', color:'#1d4ed8', label:'Tier B min (₹)' },
                { key:'C', color:'#0891b2', label:'Tier C min (₹)' },
              ].map(({ key, color, label }) => (
                <Box key={key}>
                  <Typography sx={{ fontSize:10, fontWeight:700, color, mb:0.5 }}>{label}</Typography>
                  <TextField
                    size="small" type="number" fullWidth
                    value={thresholds[key]}
                    onChange={e => saveThresholds({ ...thresholds, [key]: Math.max(0, Number(e.target.value)) })}
                    inputProps={{ min:0, style:{ fontSize:12 } }}
                    sx={{ '& .MuiOutlinedInput-root':{ borderRadius:1.5 } }}
                  />
                </Box>
              ))}
            </Box>
            <Typography sx={{ fontSize:10, color:'#94a3b8' }}>
              Tier D = everyone below Tier C · Settings saved automatically
            </Typography>
          </Box>
        )}

        {/* Selected customer card */}
        {selected ? (
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, p:1.5, mb:1.5,
            border:`2px solid ${selTierCfg.color}40`, borderRadius:2, bgcolor: selTierCfg.bg }}>
            <Box sx={{ width:36, height:36, borderRadius:1.5, bgcolor: selTierCfg.color,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Typography sx={{ fontSize:16, fontWeight:800, color:'#fff' }}>{selTier}</Typography>
            </Box>
            <Box sx={{ flex:1, minWidth:0 }}>
              <Typography sx={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>
                {selected.contactPerson}
              </Typography>
              <Typography sx={{ fontSize:11, color:'#64748b' }}>
                {selected.recipientType}
                {selected.designation ? ` · ${selected.designation}` : ''}
                {selected.area ? ` · ${selected.area}` : ''}
              </Typography>
              <Typography sx={{ fontSize:11, color: selTierCfg.color, fontWeight:600 }}>
                Total purchases: ₹{selected.totalValue.toLocaleString('en-IN')} · Tier {selTier} ({selTierCfg.desc})
              </Typography>
            </Box>
            <Box sx={{ textAlign:'right', flexShrink:0 }}>
              {selected.phone && (
                <Typography sx={{ fontSize:11, color:'#64748b', fontFamily:'monospace' }}>{selected.phone}</Typography>
              )}
              {getDaysUntil(selected.dob) !== null && getDaysUntil(selected.dob) <= 7 && (
                <Chip label={`${dayLabel(getDaysUntil(selected.dob)).text}`} size="small"
                  sx={{ fontSize:10, height:18, mt:0.5,
                    bgcolor: dayLabel(getDaysUntil(selected.dob)).bg,
                    color:   dayLabel(getDaysUntil(selected.dob)).color, fontWeight:700 }} />
              )}
              {getDaysUntil(selected.anniversary) !== null && getDaysUntil(selected.anniversary) <= 7 && (
                <Chip label={` ${dayLabel(getDaysUntil(selected.anniversary)).text}`} size="small"
                  sx={{ fontSize:10, height:18, mt:0.5, ml:0.5,
                    bgcolor: dayLabel(getDaysUntil(selected.anniversary)).bg,
                    color:   dayLabel(getDaysUntil(selected.anniversary)).color, fontWeight:700 }} />
              )}
            </Box>
            <IconButton size="small" onClick={() => { setSelected(null); setSearch('') }}
              sx={{ color:'#94a3b8', ml:0.5 }}>
              <Close sx={{ fontSize:14 }} />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ position:'relative', mb:1.5 }}>
            <TextField
              fullWidth size="small"
              placeholder="Click to browse all customers or type to search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize:16, color:'#94a3b8' }} />
                  </InputAdornment>
                )
              }}
            />

            {/* Tier legend */}
            <Box sx={{ display:'flex', gap:1, mt:0.75, flexWrap:'wrap' }}>
              {Object.entries(TIER_CONFIG).map(([t, cfg]) => (
                <Box key={t} sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                  <Box sx={{ width:10, height:10, borderRadius:0.5, bgcolor: cfg.color }} />
                  <Typography sx={{ fontSize:10, color:'#64748b' }}>
                    {t}{t !== 'D'
                      ? `: ₹${thresholds[t].toLocaleString('en-IN')}+`
                      : `: below ₹${thresholds.C.toLocaleString('en-IN')}`}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Dropdown */}
            {displayList.length > 0 && (
              <Paper elevation={4} sx={{
                position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:9999,
                border:'1px solid #e2e8f0', borderRadius:2, overflow:'hidden',
                maxHeight:300, overflowY:'auto',
              }}>
                {/* Header row */}
                <Box sx={{ px:2, py:0.75, bgcolor:'#f8fafc', borderBottom:'1px solid #f1f5f9',
                  display:'flex', justifyContent:'space-between' }}>
                  <Typography sx={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.07em' }}>
                    {search.trim() ? `${displayList.length} RESULT(S)` : `ALL CUSTOMERS (${allCustomers.length})`}
                  </Typography>
                  <Typography sx={{ fontSize:10, color:'#94a3b8' }}>Sorted by purchases ↓</Typography>
                </Box>

                {[...displayList].sort((a,b) => b.totalValue - a.totalValue).map((c, i) => {
                  const t       = tier(c.totalValue)
                  const tCfg    = TIER_CONFIG[t]
                  const bdDays  = getDaysUntil(c.dob)
                  const anDays  = getDaysUntil(c.anniversary)
                  const hasCel  = (bdDays !== null && bdDays <= 7) || (anDays !== null && anDays <= 7)
                  return (
                    <Box key={i}
                      onMouseDown={() => { setSelected(c); setSearch(''); setSearchFocused(false) }}
                      sx={{
                        display:'flex', alignItems:'center', gap:1.5,
                        px:2, py:1.25, cursor:'pointer', borderBottom:'1px solid #f8fafc',
                        bgcolor: hasCel ? '#fffbeb' : 'transparent',
                        '&:hover':{ bgcolor: hasCel ? '#fef3c7' : '#f8fafc' },
                      }}>
                      {/* Tier box */}
                      <Box sx={{ width:28, height:28, borderRadius:1, bgcolor: tCfg.color,
                        flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Typography sx={{ fontSize:13, fontWeight:800, color:'#fff' }}>{t}</Typography>
                      </Box>
                      <Box sx={{ flex:1, minWidth:0 }}>
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                          <Typography sx={{ fontSize:13, fontWeight:700, color:'#0f172a',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {c.contactPerson}
                          </Typography>
                          {hasCel && (
                            <Typography sx={{ fontSize:12 }}>
                              {bdDays !== null && bdDays <= 7 ? '' : ''}
                              {anDays !== null && anDays <= 7 ? '' : ''}
                            </Typography>
                          )}
                        </Box>
                        <Typography sx={{ fontSize:11, color:'#64748b' }}>
                          {c.recipientType}{c.area ? ` · ${c.area}` : ''}
                          {c.designation ? ` · ${c.designation}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign:'right', flexShrink:0 }}>
                        <Typography sx={{ fontSize:12, fontWeight:700, color: tCfg.color }}>
                          ₹{c.totalValue.toLocaleString('en-IN')}
                        </Typography>
                        {c.phone && (
                          <Typography sx={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace' }}>{c.phone}</Typography>
                        )}
                      </Box>
                    </Box>
                  )
                })}
              </Paper>
            )}

            {allCustomers.length === 0 && searchFocused && (
              <Typography sx={{ fontSize:12, color:'#94a3b8', mt:1 }}>
                No past customers found yet — visit the DCR page to log customers first.
              </Typography>
            )}
          </Box>
        )}

        {/* ── Qty + Occasion ── */}
        <Box sx={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:2, mb:2, mt:1 }}>
          <TextField size="small" label="Quantity *" type="number"
            value={qty}
            onChange={e => setQty(Math.max(1, Math.min(gift.availableQuantity, Number(e.target.value))))}
            inputProps={{ min:1, max: gift.availableQuantity }}
            helperText={`Max: ${gift.availableQuantity}`}
          />
          <TextField size="small" label="Occasion"
            value={occasion} onChange={e => setOccasion(e.target.value)}
            placeholder="e.g. Birthday, Doctor's Day…"
          />
        </Box>

        {/* ── Remarks ── */}
        <TextField
          fullWidth multiline rows={2} size="small" label="Remarks"
          value={remarks} onChange={e => setRemarks(e.target.value)}
          placeholder="Any notes about this distribution…"
          sx={{ mb:2 }}
        />

        {/* ── Proof Image ── */}
        <Typography sx={{ fontSize:11, fontWeight:700, color:'#dc2626', letterSpacing:'0.07em', mb:1 }}>
  Photo With Customer *
</Typography>
        <input ref={imgRef} type="file" accept="image/*" hidden
          onChange={e => handleImgFile(e.target.files[0])} />
        {img?.preview ? (
          <Box sx={{ position:'relative', borderRadius:2, overflow:'hidden', height:100 }}>
            <img src={img.preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <IconButton size="small" onClick={() => setImg(null)}
              sx={{ position:'absolute', top:4, right:4, bgcolor:'rgba(0,0,0,0.55)', color:'#fff', width:24, height:24 }}>
              <Close sx={{ fontSize:14 }} />
            </IconButton>
          </Box>
        ) : (

<Box onClick={() => imgRef.current?.click()} sx={{
  height:72, border:'2px dashed #fca5a5', borderRadius:2,   
  display:'flex', alignItems:'center', justifyContent:'center', gap:1,
  cursor:'pointer', bgcolor:'#fff5f5',                        
  '&:hover':{ borderColor:'#ef4444', bgcolor:'#fee2e2' }, transition:'all 0.2s',
}}>
  <CloudUpload sx={{ fontSize:18, color:'#f87171' }} />        
  <Typography sx={{ fontSize:12, color:'#ef4444' }}>Upload photo (required)</Typography>
</Box>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ p:2, gap:1 }}>
        <Button onClick={onClose} variant="outlined" size="small"
          sx={{ borderRadius:2, borderColor:'#e2e8f0', color:'#64748b' }}>
          Cancel
        </Button>
        <Button onClick={submit} variant="contained" size="small" disabled={saving || !selected}
          startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <LocalShipping sx={{ fontSize:14 }} />}
          sx={{ bgcolor:'#10b981', '&:hover':{ bgcolor:'#059669' }, borderRadius:2, fontWeight:700 }}>
          {saving ? 'Distributing…' : 'Distribute Gift'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function useCustomers() {
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('agentToken')
    const BASE_AGENT = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    fetch(`${BASE_AGENT}/api/agent/responses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (!d.success) return
        // Aggregate by contactPerson+phone
        const map = {}
        d.responses.forEach(r => {
          const key = `${r.contactPerson}__${r.phone || ''}`
          if (!map[key]) {
            map[key] = {
              contactPerson: r.contactPerson,
              recipientType: r.contactRole || 'Other',
              phone:         r.phone        || '',
              area:          r.city         || r.district || '',
              dob:           r.dob          || '',
              anniversary:   r.anniversary  || '',
              designation:   r.designation  || '',
              totalValue:    0,
            }
          }
          map[key].totalValue += parseFloat(r.orderValue || 0)
        })
        setCustomers(Object.values(map))
      })
      .catch(() => {})
  }, [])

  return customers
}

function UpcomingCelebrations({ customers }) {
  const events = []
  customers.forEach(c => {
    const bd   = getDaysUntil(c.dob)
    const ann  = getDaysUntil(c.anniversary)
    if (bd  !== null && bd  <= 7) events.push({ customer:c, type:'Birthday',     days:bd  })
    if (ann !== null && ann <= 7) events.push({ customer:c, type:'Anniversary',  days:ann })
  })
  // Sort: today first
  events.sort((a,b) => a.days - b.days)

  if (events.length === 0) return null

  return (
    <Box sx={{ mb:2.5 }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
        <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:'#dc2626', animation:'pulse 1.5s infinite' }} />
        <Typography sx={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'0.07em' }}>
          UPCOMING CELEBRATIONS (next 7 days)
        </Typography>
      </Box>
      <Box sx={{ display:'flex', gap:1.5, flexWrap:'wrap' }}>
        {events.map((ev, i) => {
          const { text, color, bg } = dayLabel(ev.days)
          const tier   = getCustomerTier(ev.customer.totalValue)
          const tierCfg = TIER_CONFIG[tier]
          return (
            <Paper key={i} elevation={0} sx={{
              display:'flex', alignItems:'center', gap:1.5,
              px:2, py:1.25, borderRadius:2,
              border:`1px solid ${color}30`,
              bgcolor: bg,
              minWidth:220,
            }}>
              {/* Icon */}
              <Box sx={{ fontSize:20 }}>{ev.type === 'Birthday' ? '🎂' : '🎉'}</Box>

              <Box sx={{ flex:1, minWidth:0 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                  <Typography sx={{ fontSize:13, fontWeight:700, color:'#0f172a',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>
                    {ev.customer.contactPerson}
                  </Typography>
                  {/* Tier badge */}
                  <Box sx={{ px:0.75, py:0.1, borderRadius:1, bgcolor: tierCfg.bg,
                    fontSize:10, fontWeight:800, color: tierCfg.color, lineHeight:1.6,
                    border:`1px solid ${tierCfg.color}30`, flexShrink:0 }}>
                    {tier}
                  </Box>
                </Box>
                <Typography sx={{ fontSize:11, color:'#64748b' }}>
                  {ev.type}{ev.customer.designation ? ` · ${ev.customer.designation}` : ''}
                </Typography>
              </Box>

              <Box sx={{ textAlign:'right', flexShrink:0 }}>
                <Typography sx={{ fontSize:11, fontWeight:700, color }}>
                  {text}
                </Typography>
                {ev.customer.phone && (
                  <Typography sx={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace' }}>
                    {ev.customer.phone}
                  </Typography>
                )}
              </Box>
            </Paper>
          )
        })}
      </Box>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </Box>
  )
}

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
  const customers = useCustomers()  

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

     <UpcomingCelebrations customers={customers} />

      {/* ── Tabs ── */}
      <Paper sx={{ borderRadius:3, border:"1.5px solid #e2e8f0", boxShadow:"none", mb:2.5, overflow:"hidden" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant={isMobile ? "fullWidth" : "standard"}
          sx={{ "& .MuiTab-root":{ fontSize:13, fontWeight:600, textTransform:"none", minHeight:48 },
            "& .Mui-selected":{ color:"#6366f1" }, "& .MuiTabs-indicator":{ bgcolor:"#6366f1" } }}>

          <Tab label={
            <Box sx={{ display:"flex", alignItems:"center", gap:0.8 }}>
              <Inventory2 sx={{ fontSize:16 }} />
              Gift Catalog
              <Chip label={gifts.length} size="small" sx={{ height:17, fontSize:10, fontWeight:700,
                bgcolor:tab===0?"#e0e7ff":"#f1f5f9", color:tab===0?"#6366f1":"#64748b" }} />
            </Box>
          } />

          <Tab label={
            <Box sx={{ display:"flex", alignItems:"center", gap:0.8 }}>
              <LocalShipping sx={{ fontSize:16 }} />
              My Distributions
              <Chip label={dists.length} size="small" sx={{ height:17, fontSize:10, fontWeight:700,
                bgcolor:tab===1?"#e0e7ff":"#f1f5f9", color:tab===1?"#6366f1":"#64748b" }} />
            </Box>
          } />

          <Tab label={
            <Box sx={{ display:"flex", alignItems:"center", gap:0.8 }}>
              <Typography sx={{ fontSize:15, lineHeight:1 }}></Typography>
              Celebrations
              {(() => {
                const count = customers.filter(c => {
                  const bd = getDaysUntil(c.dob)
                  const an = getDaysUntil(c.anniversary)
                  return (bd !== null && bd <= 7) || (an !== null && an <= 7)
                }).length
                return count > 0
                  ? <Chip label={count} size="small" sx={{ height:17, fontSize:10, fontWeight:700, bgcolor:'#fef2f2', color:'#dc2626' }} />
                  : null
              })()}
            </Box>
          } />

        </Tabs>
      </Paper>

      {/* ── Tab 0: Catalog ── */}
      {tab === 0 && (
        <>
          <Paper sx={{ p:2, mb:2.5, borderRadius:2, boxShadow:"0 1px 6px rgba(0,0,0,0.05)",
            border:"1.5px solid #f1f5f9", display:"flex", gap:2, flexWrap:"wrap", alignItems:"center" }}>
            <TextField size="small" placeholder="Search gifts…" value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ flex:1, minWidth:180, "& .MuiOutlinedInput-root":{ borderRadius:2 } }}
              InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:17, color:"#94a3b8" }} /></InputAdornment> }} />
            <FormControl size="small" sx={{ minWidth:140 }}>
              <InputLabel>Category</InputLabel>
              <Select value={catFilter} label="Category" onChange={e => setCatFilter(e.target.value)} sx={{ borderRadius:2 }}>
                <MenuItem value="All">All Categories</MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth:130 }}>
              <InputLabel>Stock</InputLabel>
              <Select value={stockFilter} label="Stock" onChange={e => setStockFilter(e.target.value)} sx={{ borderRadius:2 }}>
                <MenuItem value="All">All Stock</MenuItem>
                <MenuItem value="In Stock">In Stock</MenuItem>
                <MenuItem value="Low Stock">Low Stock</MenuItem>
                <MenuItem value="Out of Stock">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          {loading ? (
            <Box sx={{ display:"flex", justifyContent:"center", py:8 }}>
              <CircularProgress sx={{ color:"#6366f1" }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign:"center", py:10, border:"2px dashed #e2e8f0", borderRadius:3 }}>
              <CardGiftcard sx={{ fontSize:56, color:"#cbd5e1", mb:2 }} />
              <Typography sx={{ fontWeight:700, color:"#475569", mb:0.5 }}>
                {search || catFilter !== "All" || stockFilter !== "All" ? "No gifts match your filters" : "No gifts added yet"}
              </Typography>
              <Typography sx={{ fontSize:13, color:"#94a3b8", mb:3 }}>
                {search || catFilter !== "All" ? "Try adjusting your search or filters" : "Add your first gift to get started"}
              </Typography>
              {!search && catFilter === "All" && (
                <Button variant="contained" startIcon={<Add />}
                  onClick={() => { setEditGift(null); setFormOpen(true) }}
                  sx={{ bgcolor:"#6366f1", borderRadius:2, textTransform:"none", fontWeight:700 }}>
                  Add First Gift
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filtered.map(g => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={g._id}>
                  <GiftCard gift={g}
                    onEdit={gift => { setEditGift(gift); setFormOpen(true) }}
                    onDelete={id => setDeleteId(id)}
                    onDistribute={gift => setDistGift(gift)} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* ── Tab 1: Distributions ── */}
      {tab === 1 && (
        loading ? (
          <Box sx={{ display:"flex", justifyContent:"center", py:8 }}>
            <CircularProgress sx={{ color:"#6366f1" }} />
          </Box>
        ) : dists.length === 0 ? (
          <Box sx={{ textAlign:"center", py:10, border:"2px dashed #e2e8f0", borderRadius:3 }}>
            <LocalShipping sx={{ fontSize:56, color:"#cbd5e1", mb:2 }} />
            <Typography sx={{ fontWeight:700, color:"#475569" }}>No distributions yet</Typography>
            <Typography sx={{ fontSize:13, color:"#94a3b8" }}>
              Distribute a gift from the catalog to see history here
            </Typography>
          </Box>
        ) : (
          <Paper sx={{ borderRadius:3, border:"1.5px solid #e2e8f0", boxShadow:"none", overflow:"hidden" }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor:"#f8fafc" }}>
                    {["Gift","Recipient","Type","Tier","Area","Qty","Value","Occasion","Proof","Date"].map(h => (
                      <TableCell key={h} sx={{ fontWeight:700, fontSize:11, color:"#64748b",
                        textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", py:1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dists.map(d => {
                    const catColor = CAT_COLORS[d.gift?.category] || "#64748b"
                    return (
                      <TableRow key={d._id} hover sx={{ "&:hover":{ bgcolor:"#f8fafc" } }}>

                        {/* Gift */}
                        <TableCell>
                          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                            {d.gift?.image?.url
                              ? <img src={d.gift.image.url} alt="" style={{ width:30, height:30, borderRadius:6, objectFit:"cover" }} />
                              : <Avatar sx={{ width:30, height:30, borderRadius:1, bgcolor:catColor+"20", color:catColor }}>
                                  <CardGiftcard sx={{ fontSize:14 }} />
                                </Avatar>
                            }
                            <Typography sx={{ fontSize:13, fontWeight:600 }}>{d.gift?.name || "—"}</Typography>
                          </Box>
                        </TableCell>

                        {/* Recipient */}
                        <TableCell sx={{ fontSize:13, fontWeight:600 }}>{d.recipientName}</TableCell>

                        {/* Type */}
                        <TableCell>
                          <Chip label={d.recipientType} size="small"
                            sx={{ fontSize:10, height:20, bgcolor:"#f1f5f9", color:"#475569", fontWeight:600 }} />
                        </TableCell>

                        {/* Tier */}
                        <TableCell>
                          {d.customerTier ? (
                            <Box sx={{ width:24, height:24, borderRadius:1, display:"inline-flex",
                              alignItems:"center", justifyContent:"center",
                              bgcolor:TIER_CONFIG[d.customerTier]?.color }}>
                              <Typography sx={{ fontSize:11, fontWeight:800, color:"#fff" }}>
                                {d.customerTier}
                              </Typography>
                            </Box>
                          ) : <Typography sx={{ fontSize:11, color:"#cbd5e1" }}>—</Typography>}
                        </TableCell>

                        {/* Area */}
                        <TableCell sx={{ fontSize:12, color:"#64748b" }}>{d.area || "—"}</TableCell>

                        {/* Qty */}
                        <TableCell>
                          <Chip label={d.quantity} size="small"
                            sx={{ fontSize:11, height:20, bgcolor:"#dbeafe", color:"#1d4ed8", fontWeight:800 }} />
                        </TableCell>

                        {/* Value */}
                        <TableCell sx={{ fontSize:13, fontWeight:700, color:"#10b981" }}>
                          ₹{((d.gift?.value || 0) * d.quantity).toLocaleString("en-IN")}
                        </TableCell>

                        {/* Occasion */}
                        <TableCell sx={{ fontSize:12, color:"#64748b" }}>{d.occasion || "—"}</TableCell>

                        {/* Proof */}
                        <TableCell>
                          {d.proofImage?.url ? (
                            <Box component="img" src={d.proofImage.url} alt="proof"
                              sx={{ width:32, height:32, borderRadius:1, objectFit:"cover", cursor:"pointer" }}
                              onClick={() => window.open(d.proofImage.url, "_blank")} />
                          ) : <Typography sx={{ fontSize:11, color:"#cbd5e1" }}>—</Typography>}
                        </TableCell>

                        {/* Date */}
                        <TableCell sx={{ fontSize:11, color:"#94a3b8", whiteSpace:"nowrap" }}>
                          {new Date(d.distributedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                        </TableCell>

                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )
      )}

      {/* ── Tab 2: Celebrations ── */}
      {tab === 2 && (() => {
        const events = []
        customers.forEach(c => {
          const bd  = getDaysUntil(c.dob)
          const ann = getDaysUntil(c.anniversary)
          if (bd  !== null && bd  <= 7) events.push({ customer:c, type:'Birthday',    days:bd  })
          if (ann !== null && ann <= 7) events.push({ customer:c, type:'Anniversary', days:ann })
        })
        events.sort((a,b) => a.days - b.days)

        if (events.length === 0) return (
          <Box sx={{ textAlign:"center", py:10, border:"2px dashed #e2e8f0", borderRadius:3 }}>
            <Typography sx={{ fontSize:48, mb:2 }}></Typography>
            <Typography sx={{ fontWeight:700, color:"#475569", mb:0.5 }}>
              No upcoming celebrations
            </Typography>
            <Typography sx={{ fontSize:13, color:"#94a3b8", maxWidth:400, mx:"auto" }}>
              Customers with birthdays or anniversaries in the next 7 days will appear here.
              Fill DOB and anniversary when logging DCR visits.
            </Typography>
          </Box>
        )

        return (
          <Box sx={{ display:"flex", flexDirection:"column", gap:1.5 }}>
            {events.map((ev, i) => {
              const { text, color, bg } = dayLabel(ev.days)
              const t    = getCustomerTier(ev.customer.totalValue)
              const tCfg = TIER_CONFIG[t]
              return (
                <Paper key={i} elevation={0} sx={{
                  display:"flex", alignItems:"center", gap:2,
                  px:2.5, py:2, borderRadius:2.5,
                  border:`1.5px solid ${color}30`, bgcolor:bg,
                }}>

                  {/* Icon badge */}
                  <Box sx={{ width:52, height:52, borderRadius:2, bgcolor:color,
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Typography sx={{ fontSize:24 }}>
                      {ev.type === 'Birthday' ? '🎂' : '🎉'}
                    </Typography>
                  </Box>

                  {/* Details */}
                  <Box sx={{ flex:1, minWidth:0 }}>
                    <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:0.25 }}>
                      <Typography sx={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>
                        {ev.customer.contactPerson}
                      </Typography>
                      <Box sx={{ px:0.75, py:0.1, borderRadius:1, bgcolor:tCfg.bg,
                        fontSize:10, fontWeight:800, color:tCfg.color,
                        border:`1px solid ${tCfg.color}30` }}>
                        {t}
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize:12, color:"#64748b" }}>
                      {ev.type}
                      {ev.customer.designation ? ` · ${ev.customer.designation}` : ''}
                      {ev.customer.area        ? ` · ${ev.customer.area}`        : ''}
                    </Typography>
                    <Typography sx={{ fontSize:11, color:tCfg.color, fontWeight:600, mt:0.25 }}>
                      Total purchases: ₹{ev.customer.totalValue.toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  {/* Right: day + phone + action */}
                  <Box sx={{ textAlign:"right", flexShrink:0 }}>
                    <Typography sx={{ fontSize:13, fontWeight:800, color }}>{text}</Typography>
                    {ev.customer.phone && (
                      <Typography sx={{ fontSize:11, color:"#94a3b8", fontFamily:"monospace", mt:0.25 }}>
                        {ev.customer.phone}
                      </Typography>
                    )}
                    <Button size="small"
                      onClick={() => setDistGift(gifts[0] || null)}
                      sx={{ fontSize:10, mt:0.75, bgcolor:color+'20', color,
                        borderRadius:1.5, fontWeight:700, minWidth:0, px:1.5, py:0.25 }}>
                      🎁 Send Gift
                    </Button>
                  </Box>

                </Paper>
              )
            })}
          </Box>
        )
      })()}

      {/* ── Dialogs ── */}
      <GiftFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditGift(null) }}
        onSaved={fetchAll} initial={editGift} />

      <DistributeDialog open={!!distGift} onClose={() => setDistGift(null)}
        gift={distGift} onSaved={fetchAll} />

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}
        PaperProps={{ sx:{ borderRadius:3, p:1 } }}>
        <DialogTitle sx={{ fontWeight:800, fontSize:16, pb:0.5 }}>Delete Gift?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize:13, color:"#64748b" }}>
            This will permanently remove the gift and its image. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px:2.5, pb:2, gap:1 }}>
          <Button onClick={() => setDeleteId(null)} size="small"
            sx={{ color:"#64748b", textTransform:"none" }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" size="small" disabled={deleting}
            startIcon={deleting ? <CircularProgress size={13} color="inherit" /> : <Delete sx={{ fontSize:14 }} />}
            sx={{ bgcolor:"#ef4444", "&:hover":{ bgcolor:"#dc2626" }, textTransform:"none", fontWeight:700, borderRadius:2 }}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}