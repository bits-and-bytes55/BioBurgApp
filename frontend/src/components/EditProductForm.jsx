// src/components/EditProductForm.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box, TextField, Button, Typography, Grid, MenuItem, Select,
  FormControl, InputLabel, Chip, IconButton, Paper, Card, CardContent,
  Container, InputAdornment, Avatar, Stack, Switch, Divider, Alert,
  FormControlLabel, RadioGroup, Radio, Accordion, AccordionSummary,
  AccordionDetails, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, LinearProgress, CircularProgress, Rating, Checkbox, Fab,
} from "@mui/material";
import axios from "axios";
import {
  Delete as DeleteIcon, Add as AddIcon, CloudUpload as CloudUploadIcon,
  Save as SaveIcon, Info as InfoIcon, CurrencyRupee as CurrencyRupeeIcon,
  LocalOffer as LocalOfferIcon, Category as CategoryIcon,
  AccountTree as AccountTreeIcon, Storefront as StorefrontIcon,
  LocalHospital as LocalHospitalIcon, Warning as WarningIcon,
  FlashOn as FlashOnIcon, Edit as EditIcon, AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon, Star as StarIcon,
  Inventory as InventoryIcon,
  CalendarToday as CalendarTodayIcon, Factory as FactoryIcon,
  Percent as PercentIcon, AccountBalance as AccountBalanceIcon,
  Loyalty as LoyaltyIcon, Description as DescriptionIcon,
  AutoFixHigh as AutoFixHighIcon, CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon, Calculate as CalculateIcon,
  PhotoCamera as PhotoCameraIcon, Videocam as VideocamIcon,
  Store as StoreIcon, ArrowUpward as ArrowUpwardIcon,
  QrCode2, Person as PersonIcon,
  Inventory2 as Inventory2Icon, Search as SearchIcon,
  Close as CloseIcon, SwapHoriz as SwapIcon,
  Verified as VerifiedIcon, Recommend as RecommendIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

import ProductQRCode from "../components/ProductQRCode";
import {compressImage } from "../../utils/mediaCompressor";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("adminToken");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
const n = (v) => parseFloat(v) || 0;
const fmt = (v) => isNaN(v) ? "0.00" : Number(v).toFixed(2);

// ── Toast ─────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, severity = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, severity }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  return { toasts, show };
};

// ── File Upload Area ──────────────────────────────────────────────────────
const FileUploadArea = ({ title, accept, multiple, onFilesSelect, icon, type = "image", existingUrls = [] }) => {
  const ref = useRef(null);
  const [previews, setPreviews] = useState([]);
  const processFiles = (files) => {
    const arr = Array.from(files);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
    onFilesSelect?.(arr);
  };
  return (
    <Paper variant="outlined" sx={{ p: 3, textAlign: "center", border: "2px dashed #90caf9", borderRadius: 2, cursor: "pointer", bgcolor: "#f8fbff", "&:hover": { borderColor: "primary.main", bgcolor: "#e3f2fd" }, transition: "all .2s" }}
      onClick={() => ref.current.click()}
      onDrop={e => { e.preventDefault(); processFiles(e.dataTransfer.files); }}
      onDragOver={e => e.preventDefault()}>
      {icon}
      <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5, fontWeight: 600 }}>{title}</Typography>
      <Typography variant="caption" color="text.secondary">{type === "image" ? "Drag & drop • 800×800px recommended" : "Upload video file"}</Typography>
      <input type="file" ref={ref} hidden accept={accept} multiple={multiple} onChange={e => processFiles(e.target.files)} />
      <Box sx={{ mt: 1.5 }}>
        <Button variant="outlined" size="small" startIcon={<CloudUploadIcon />} onClick={e => { e.stopPropagation(); ref.current.click(); }}>Browse Files</Button>
      </Box>

      {existingUrls.length > 0 && previews.length === 0 && (
        <Box>
          <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
            ✓ {existingUrls.length} existing image(s) — upload new to replace
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, justifyContent: "center" }}>
            {existingUrls.slice(0, 8).map((url, i) => (
              <Box key={i} component="img" src={url}
                sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 1, border: "2px solid #90caf9" }} />
            ))}
          </Box>
        </Box>
      )}

      {previews.length > 0 && (
        <Box>
          <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: "block" }}>
            ⚠ {previews.length} new image(s) — will replace existing on save
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, justifyContent: "center" }}>
            {previews.map((url, i) => (
              <Box key={i} component="img" src={url}
                sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 1, border: "2px solid #ff9800" }} />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// ── GST Section ───────────────────────────────────────────────────────────
const GSTSection = ({ gstRate, onGstRateChange, gstValues, gstExpiry, onExpiryChange }) => (
  <Stack spacing={2}>
    <Alert severity="info" icon={<CalculateIcon />} sx={{ py: 0.5 }}>Enter total GST % — CGST & SGST auto-split as half each; IGST = full rate.</Alert>
    <Grid container spacing={2}>
      {[
        { label: "Total GST %", value: gstRate, onChange: e => onGstRateChange(e.target.value), readOnly: false },
        { label: "IGST %", value: gstValues.igst, readOnly: true },
        { label: "CGST %", value: gstValues.cgst, readOnly: true },
        { label: "SGST %", value: gstValues.sgst, readOnly: true },
      ].map((f, i) => (
        <Grid item xs={6} sm={3} key={i}>
          <TextField fullWidth label={f.label} size="small" type="number" value={f.value} onChange={f.onChange}
            InputProps={{ readOnly: f.readOnly, endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            sx={f.readOnly ? { bgcolor: "#f0f7ff" } : {}} />
        </Grid>
      ))}
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" type="date" label="GST Expiry Date" InputLabelProps={{ shrink: true }} value={gstExpiry} onChange={e => onExpiryChange(e.target.value)} />
      </Grid>
    </Grid>
  </Stack>
);

// ── Sections Manager ──────────────────────────────────────────────────────
const ALL_SECTIONS = [
  "Featured Products", "Best Sellers", "New Arrivals", "Flash Sale", "Top Rated", "Recommended",
  "Doctor's Choice", "Ayurvedic", "OTC Medicines", "Diabetic Care", "Heart Care", "Women's Health",
  "Baby Care", "Vitamins & Supplements", "Pain Relief", "Skin Care", "Nutritional", "Immunity Boosters",
];
const SectionsManager = ({ sections, onChange }) => (
  <Box>
    <Typography variant="subtitle2" fontWeight={700} mb={1}>Product Sections / Collections</Typography>
    <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: 12 }}>Products with the same section tag appear together in "Customers Also Viewed".</Alert>
    <Box display="flex" flexWrap="wrap" gap={1}>
      {ALL_SECTIONS.map(s => {
        const sel = sections?.includes(s);
        return <Chip key={s} label={s} size="small" color={sel ? "primary" : "default"} variant={sel ? "filled" : "outlined"}
          onClick={() => onChange(sel ? sections.filter(x => x !== s) : [...(sections || []), s])} sx={{ cursor: "pointer" }} />;
      })}
    </Box>
    {sections?.length > 0 && <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>✓ Appears in: {sections.join(", ")}</Typography>}
  </Box>
);

// ── Per-Role Offers ───────────────────────────────────────────────────────
const ROLES_LIST = [
  { value: "all", label: "All Users" }, { value: "customer", label: "Customer (B2C)" },
  { value: "b2b", label: "B2B" }, { value: "hospital", label: "Hospital" },
  { value: "pharmacy", label: "Pharmacy" }, { value: "wholesale", label: "Wholesale" },
  { value: "vendor", label: "Vendor" }, { value: "franchise", label: "Franchise" },
  { value: "manufacturer", label: "Manufacturer" },
];
const OffersManager = ({ offers, onChange }) => {
  const [text, setText] = useState(""); const [flashing, setFlashing] = useState(false); const [userType, setUserType] = useState("all");
  const add = () => { if (!text.trim()) return; onChange([...offers, { text: text.trim(), flashing, userType }]); setText(""); setFlashing(false); setUserType("all"); };
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} mb={1}>Offers with Icons (per user role)</Typography>
      <Box display="flex" gap={1} flexWrap="wrap" alignItems="flex-end" mb={1.5}>
        <TextField size="small" label="Offer text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} sx={{ flex: 1, minWidth: 200 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>User Type</InputLabel>
          <Select value={userType} label="User Type" onChange={e => setUserType(e.target.value)}>
            {ROLES_LIST.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControlLabel control={<Switch checked={flashing} onChange={e => setFlashing(e.target.checked)} size="small" color="warning" />} label={<Typography variant="caption">Flash</Typography>} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={add}>Add</Button>
      </Box>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {offers.map((o, i) => <Chip key={i} label={`${o.text}${o.userType !== "all" ? ` (${o.userType})` : ""}`} onDelete={() => onChange(offers.filter((_, j) => j !== i))} icon={o.flashing ? <FlashOnIcon /> : <LocalOfferIcon />} color={o.flashing ? "warning" : "default"} />)}
      </Box>
    </Box>
  );
};

// ── Coupon Manager ────────────────────────────────────────────────────────
const CouponManager = ({ coupons, onChange }) => {
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", type: "percent", discount: "", minOrder: "", expiryDate: "", usageLimit: "", roles: [] });
  const generateCode = () => { const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; setForm(f => ({ ...f, code: Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") })); };
  const save = () => {
    if (!form.code || !form.discount) return;
    if (editing !== null) { const u = [...coupons]; u[editing] = { ...form, active: true }; onChange(u); }
    else onChange([...coupons, { ...form, active: true }]);
    setOpen(false); setEditing(null);
    setForm({ code: "", type: "percent", discount: "", minOrder: "", expiryDate: "", usageLimit: "", roles: [] });
  };
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>Coupon Codes ({coupons.length})</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setEditing(null); setOpen(true); }}>Add Coupon</Button>
      </Box>
      {coupons.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: "#f5f5f5" }}>{["Code", "Type", "Discount", "Min Order", "Roles", "Expiry", "Actions"].map(h => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow></TableHead>
            <TableBody>
              {coupons.map((c, i) => (
                <TableRow key={i} hover>
                  <TableCell><Chip label={c.code} size="small" color="primary" variant="outlined" /></TableCell>
                  <TableCell>{c.type === "percent" ? "%" : "₹ Flat"}</TableCell>
                  <TableCell>{c.type === "percent" ? `${c.discount}%` : `₹${c.discount}`}</TableCell>
                  <TableCell>{c.minOrder ? `₹${c.minOrder}` : "—"}</TableCell>
                  <TableCell>{c.roles?.length ? c.roles.map(r => <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />) : <Chip label="All Users" size="small" color="success" />}</TableCell>
                  <TableCell>{c.expiryDate || "No expiry"}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => { setForm(c); setEditing(i); setOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => onChange(coupons.filter((_, j) => j !== i))}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing !== null ? "Edit Coupon" : "New Coupon"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box display="flex" gap={1}>
              <TextField label="Code *" fullWidth size="small" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              <IconButton onClick={generateCode} title="Auto-generate"><QrCode2 /></IconButton>
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>Discount Type</InputLabel>
              <Select value={form.type} label="Discount Type" onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <MenuItem value="percent">Percentage (%)</MenuItem><MenuItem value="flat">Flat (₹)</MenuItem>
              </Select>
            </FormControl>
            <TextField label={`Discount ${form.type === "percent" ? "%" : "₹"} *`} fullWidth size="small" type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
            <TextField label="Minimum Order (₹)" fullWidth size="small" type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} />
            <TextField label="Usage Limit (blank = unlimited)" fullWidth size="small" type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
            <TextField label="Expiry Date" fullWidth size="small" type="date" InputLabelProps={{ shrink: true }} value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
            <Box>
              <Typography variant="caption" color="text.secondary" mb={1} display="block">Applicable Roles — leave empty to apply to ALL users</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.75}>
                {ROLES_LIST.filter(r => r.value !== "all").map(role => (
                  <Chip key={role.value} label={role.label} size="small"
                    color={form.roles?.includes(role.value) ? "primary" : "default"}
                    variant={form.roles?.includes(role.value) ? "filled" : "outlined"}
                    onClick={() => { const nr = form.roles?.includes(role.value) ? form.roles.filter(r => r !== role.value) : [...(form.roles || []), role.value]; setForm(f => ({ ...f, roles: nr })); }}
                    sx={{ cursor: "pointer" }} />
                ))}
              </Box>
              {form.roles?.length === 0 && <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: "block" }}>✓ This coupon will be visible to all user types</Typography>}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} variant="contained">{editing !== null ? "Update" : "Add"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Product Combo Builder ─────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

function ProductPicker({ onSelect, exclude = [], label = "Search product", authToken }) {
  const [query, setQuery] = useState(""); const [results, setResults] = useState([]); const [loading, setLoading] = useState(false);
  const dq = useDebounce(query);
  useEffect(() => {
    if (!dq.trim()) { setResults([]); return; }
    setLoading(true);
    const token = authToken || localStorage.getItem("adminToken") || "";
    fetch(`${API_BASE}/api/admin/products/search?q=${encodeURIComponent(dq)}&limit=8`, { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      .then(r => r.json()).then(d => setResults((d.products || d.data || []).filter(p => !exclude.includes(p._id)))).catch(() => setResults([])).finally(() => setLoading(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);
  return (
    <Box>
      <TextField size="small" fullWidth placeholder={label} value={query} onChange={e => setQuery(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start">{loading ? <CircularProgress size={14} /> : <SearchIcon sx={{ fontSize: 18, color: "#9ca3af" }} />}</InputAdornment>, endAdornment: query ? <InputAdornment position="end"><IconButton size="small" onClick={() => { setQuery(""); setResults([]); }}><CloseIcon sx={{ fontSize: 14 }} /></IconButton></InputAdornment> : null }} />
      {results.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 0.5, maxHeight: 240, overflowY: "auto", borderRadius: 2, zIndex: 10, position: "relative" }}>
          {results.map(p => (
            <Box key={p._id} onClick={() => { onSelect(p); setQuery(""); setResults([]); }} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25, cursor: "pointer", borderBottom: "1px solid #f3f4f6", "&:hover": { bgcolor: "#f0f7ff" }, "&:last-child": { borderBottom: "none" } }}>
              <Avatar src={p.images?.[0]?.url} variant="rounded" sx={{ width: 36, height: 36, bgcolor: "#e3f2fd", flexShrink: 0 }}><Inventory2Icon sx={{ color: "#1565c0", fontSize: 20 }} /></Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={700} noWrap>{p.brandName}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{p.genericCompositions || p.manufacturer || ""} · MRP ₹{p.mrp || "—"}</Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 16, color: "#1565c0", opacity: 0.4 }} />
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}

function ComboDialog({ open, onClose, onSave, initial, authToken }) {
  const EMPTY = { id: "", name: "", products: [], comboPrice: "", active: true };
  const [form, setForm] = useState(EMPTY);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) setForm(initial ? { ...EMPTY, ...initial } : { ...EMPTY, id: String(Date.now()) }); }, [open, initial]);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const removeProduct = (idx) => setF("products", form.products.filter((_, i) => i !== idx));
  const addProduct = (p) => {
    if (form.products.length >= 2) return;
    if (form.products.some(x => x._id === p._id)) return;
    setF("products", [...form.products, { _id: p._id, brandName: p.brandName, mrp: p.mrp, images: p.images }]);
  };
  const totalMrp = form.products.reduce((s, p) => s + (parseFloat(p.mrp) || 0), 0);
  const comboPrice = parseFloat(form.comboPrice) || 0;
  const saving = totalMrp - comboPrice;
  const discPct = totalMrp > 0 ? Math.round((saving / totalMrp) * 100) : 0;
  const canSave = form.products.length === 2 && comboPrice > 0;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6" }}>
        <Box display="flex" alignItems="center" gap={1}><Inventory2Icon color="primary" />{initial ? "Edit Combo" : "Create Product Combo"}</Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1.5 }}>
          <TextField label="Combo Name (optional)" size="small" fullWidth value={form.name} onChange={e => setF("name", e.target.value)} placeholder="e.g. Immunity Starter Pack…" />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Select 2 Products *</Typography>
            <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: 12 }}>Search and pick exactly 2 products. The combo appears on both product detail pages.</Alert>
            <Stack spacing={1.5}>
              {form.products.map((p, i) => (
                <Paper key={p._id} variant="outlined" sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 2, borderColor: i === 0 ? "#bfdbfe" : "#bbf7d0", bgcolor: i === 0 ? "#f0f7ff" : "#f0fdf4" }}>
                  <Avatar src={p.images?.[0]?.url} variant="rounded" sx={{ width: 40, height: 40, flexShrink: 0 }}><Inventory2Icon /></Avatar>
                  <Box flex={1} minWidth={0}><Typography variant="body2" fontWeight={700} noWrap>{p.brandName}</Typography><Typography variant="caption" color="text.secondary">MRP ₹{p.mrp || "—"}</Typography></Box>
                  <Chip label={`Product ${i + 1}`} size="small" color={i === 0 ? "primary" : "success"} />
                  <IconButton size="small" color="error" onClick={() => removeProduct(i)}><CloseIcon fontSize="small" /></IconButton>
                </Paper>
              ))}
              {form.products.length < 2 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" mb={0.5} display="block">{form.products.length === 0 ? "Add Product 1" : "Add Product 2"}</Typography>
                  <ProductPicker onSelect={addProduct} exclude={form.products.map(p => p._id)} label={`Search for product ${form.products.length + 1}…`} authToken={authToken} />
                </Box>
              )}
            </Stack>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Combo Pricing *</Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField label="Individual Total (MRP)" size="small" value={totalMrp > 0 ? `₹ ${totalMrp.toFixed(2)}` : "—"} InputProps={{ readOnly: true }} sx={{ bgcolor: "#f9fafb", flex: 1, minWidth: 140 }} />
              <TextField label="Combo Price *" size="small" type="number" value={form.comboPrice} onChange={e => setF("comboPrice", e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} sx={{ flex: 1, minWidth: 140 }} />
            </Box>
            {discPct > 0 && <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}><Typography variant="body2" color="#15803d" fontWeight={600}>Customer saves ₹{saving.toFixed(2)}</Typography><Chip label={`${discPct}% off`} color="success" size="small" /></Box>}
            {comboPrice > 0 && comboPrice >= totalMrp && totalMrp > 0 && <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: 12 }}>Combo price should be less than individual total.</Alert>}
          </Box>
          <FormControlLabel control={<Switch checked={form.active !== false} onChange={e => setF("active", e.target.checked)} color="success" />} label={<Typography variant="body2" fontWeight={600}>{form.active !== false ? "Active — visible on product pages" : "Inactive — hidden from customers"}</Typography>} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => canSave && onSave(form)} variant="contained" disabled={!canSave} startIcon={<CheckCircleIcon />} sx={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>{initial ? "Update Combo" : "Create Combo"}</Button>
      </DialogActions>
    </Dialog>
  );
}

function ProductComboBuilder({ combos = [], onChange, authToken }) {
  const [dialogOpen, setDialogOpen] = useState(false); const [editing, setEditing] = useState(null);
  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (combo) => { setEditing(combo); setDialogOpen(true); };
  const handleSave = (form) => { if (editing) onChange(combos.map(c => c.id === form.id ? form : c)); else onChange([...combos, form]); setDialogOpen(false); };
  const handleDelete = (id) => { if (!window.confirm("Remove this combo?")) return; onChange(combos.filter(c => c.id !== id)); };
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Product Combos / Bundles</Typography>
          <Typography variant="caption" color="text.secondary">Pick any 2 products and set a discounted combo price. Shows on both product pages as "Frequently Bought Together".</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd} sx={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", flexShrink: 0, ml: 2 }}>+ Create Combo</Button>
      </Box>
      <Alert severity="info" sx={{ py: 0.5, mb: 2, fontSize: 12 }}>Each combo links exactly <strong>2 products</strong>. It will appear on <em>both</em> product detail pages automatically.</Alert>
      {combos.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2, borderStyle: "dashed", bgcolor: "#f9fafb" }}>
          <Inventory2Icon sx={{ fontSize: 40, color: "#d1d5db", mb: 1 }} />
          <Typography variant="body2" color="text.secondary" fontWeight={600}>No combos yet</Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Create your first product bundle to boost average order value.</Typography>
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openAdd}>Create First Combo</Button>
        </Paper>
      ) : (
        combos.map(combo => {
          const p1 = combo.products?.[0]; const p2 = combo.products?.[1];
          const totalMrp = (parseFloat(p1?.mrp) || 0) + (parseFloat(p2?.mrp) || 0);
          const cp = parseFloat(combo.comboPrice) || 0; const saving = totalMrp - cp; const discPct = totalMrp > 0 ? Math.round((saving / totalMrp) * 100) : 0;
          return (
            <Paper key={combo.id} variant="outlined" sx={{ borderRadius: 2, border: "1.5px solid #e0e7ff", mb: 2, bgcolor: combo.active === false ? "#fafafa" : "white", opacity: combo.active === false ? 0.7 : 1, position: "relative", "&:hover": { boxShadow: 3 } }}>
              {discPct > 0 && <Box sx={{ position: "absolute", top: -10, left: 16, bgcolor: "#4f46e5", color: "white", borderRadius: 1, px: 1.5, py: 0.25, fontSize: 11, fontWeight: 700, zIndex: 1 }}>Save {discPct}%</Box>}
              <Box sx={{ p: 2, pt: 2.5, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                {[p1, p2].map((p, i) => p ? (
                  <React.Fragment key={i}>
                    {i === 1 && <SwapIcon sx={{ color: "#9ca3af", fontSize: 24 }} />}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 72 }}>
                      <Avatar src={p.images?.[0]?.url} variant="rounded" sx={{ width: 48, height: 48, bgcolor: i === 0 ? "#f0f7ff" : "#f0fdf4", mb: 0.5 }}><Inventory2Icon /></Avatar>
                      <Typography variant="caption" fontWeight={700} textAlign="center" sx={{ maxWidth: 72, lineHeight: 1.2 }}>{p.brandName || "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">₹{p.mrp || "—"}</Typography>
                    </Box>
                  </React.Fragment>
                ) : null)}
                <Box sx={{ ml: "auto", textAlign: "right" }}>
                  {combo.name && <Typography variant="caption" color="text.secondary" display="block">{combo.name}</Typography>}
                  {totalMrp > 0 && <Typography variant="caption" sx={{ textDecoration: "line-through", color: "#9ca3af", display: "block" }}>₹{totalMrp.toFixed(2)}</Typography>}
                  <Typography variant="h6" fontWeight={800} color="#4f46e5">₹{cp > 0 ? cp.toFixed(2) : "—"}</Typography>
                  {saving > 0 && <Chip label={`Save ₹${saving.toFixed(2)}`} size="small" color="success" sx={{ height: 18, fontSize: 10, mt: 0.5 }} />}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <IconButton size="small" onClick={() => openEdit(combo)} sx={{ border: "1px solid #e5e7eb" }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(combo.id)} sx={{ border: "1px solid #fee2e2" }}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              </Box>
            </Paper>
          );
        })
      )}
      <ComboDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} initial={editing} authToken={authToken} />
    </Box>
  );
}

// ── Recommendations & Certifications Manager ──────────────────────────────
function RecommendationsManager({ recommendations, certifications, onRecommendChange, onCertChange }) {
  const recImgRef = useRef(null);
  const certImgRef = useRef(null);
  const [recForm, setRecForm] = useState({ label: "", description: "", imageFile: null, imagePreview: "" });
  const [certForm, setCertForm] = useState({ label: "", issuedBy: "", year: "", imageFile: null, imagePreview: "" });

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res(r.result);
    r.onerror = rej;
  });

  const handleRecImg = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const b64 = await toBase64(file);
    setRecForm(f => ({ ...f, imageFile: file, imagePreview: b64 }));
  };
  const handleCertImg = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const b64 = await toBase64(file);
    setCertForm(f => ({ ...f, imageFile: file, imagePreview: b64 }));
  };

  const addRec = () => {
    if (!recForm.label.trim()) return;
    onRecommendChange([...recommendations, { id: Date.now(), label: recForm.label, description: recForm.description, image: recForm.imagePreview }]);
    setRecForm({ label: "", description: "", imageFile: null, imagePreview: "" });
  };
  const addCert = () => {
    if (!certForm.label.trim()) return;
    onCertChange([...certifications, { id: Date.now(), label: certForm.label, issuedBy: certForm.issuedBy, year: certForm.year, image: certForm.imagePreview }]);
    setCertForm({ label: "", issuedBy: "", year: "", imageFile: null, imagePreview: "" });
  };

  return (
    <Stack spacing={3}>
      {/* ── Recommendations ── */}
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <RecommendIcon color="success" />
          <Typography variant="subtitle1" fontWeight={700}>Doctor / Expert Recommendations</Typography>
          <Chip label={`${recommendations.length} added`} size="small" color="success" />
        </Box>
        <Alert severity="info" sx={{ py: 0.5, mb: 2, fontSize: 12 }}>Add doctor or expert recommendations with a photo. These appear on the product detail page as trust signals.</Alert>

        {/* existing list */}
        {recommendations.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={1.5} mb={2}>
            {recommendations.map((rec, i) => (
              <Paper key={rec.id || i} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5, minWidth: 220, maxWidth: 300 }}>
                {rec.image
                  ? <Box component="img" src={rec.image} sx={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #e8f5e9", flexShrink: 0 }} />
                  : <Avatar sx={{ width: 48, height: 48, bgcolor: "#e8f5e9" }}><RecommendIcon color="success" /></Avatar>}
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={700} noWrap>{rec.label}</Typography>
                  {rec.description && <Typography variant="caption" color="text.secondary" noWrap>{rec.description}</Typography>}
                </Box>
                <IconButton size="small" color="error" onClick={() => onRecommendChange(recommendations.filter((_, j) => j !== i))}><DeleteIcon fontSize="small" /></IconButton>
              </Paper>
            ))}
          </Box>
        )}

        {/* add form */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#f9fafb" }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Add Recommendation</Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                {recForm.imagePreview
                  ? <Box component="img" src={recForm.imagePreview} sx={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid #4caf50" }} />
                  : <Avatar sx={{ width: 64, height: 64, bgcolor: "#e8f5e9", cursor: "pointer" }} onClick={() => recImgRef.current?.click()}><PhotoCameraIcon color="success" /></Avatar>}
                <input type="file" ref={recImgRef} hidden accept="image/*" onChange={handleRecImg} />
                <Button size="small" variant="outlined" color="success" onClick={() => recImgRef.current?.click()} sx={{ fontSize: 10 }}>
                  {recForm.imagePreview ? "Change Photo" : "Upload Photo"}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Stack spacing={1.5}>
                <TextField size="small" fullWidth label="Name / Title *" placeholder="e.g. Dr. Anjali Sharma, MBBS" value={recForm.label} onChange={e => setRecForm(f => ({ ...f, label: e.target.value }))} />
                <TextField size="small" fullWidth label="Description (optional)" placeholder="e.g. Senior Cardiologist, AIIMS Delhi" value={recForm.description} onChange={e => setRecForm(f => ({ ...f, description: e.target.value }))} />
                <Button variant="contained" color="success" size="small" startIcon={<AddIcon />} onClick={addRec} disabled={!recForm.label.trim()} sx={{ alignSelf: "flex-start" }}>Add Recommendation</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Divider />

      {/* ── Certifications ── */}
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <VerifiedIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>Certifications & Quality Badges</Typography>
          <Chip label={`${certifications.length} added`} size="small" color="primary" />
        </Box>
        <Alert severity="info" sx={{ py: 0.5, mb: 2, fontSize: 12 }}>Add certifications like ISO, FSSAI, GMP, CDSCO, Ayush etc. with their logo/badge image.</Alert>

        {/* existing list */}
        {certifications.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={1.5} mb={2}>
            {certifications.map((cert, i) => (
              <Paper key={cert.id || i} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5, minWidth: 200, maxWidth: 280 }}>
                {cert.image
                  ? <Box component="img" src={cert.image} sx={{ width: 48, height: 48, objectFit: "contain", border: "1px solid #e3f2fd", borderRadius: 1, flexShrink: 0, bgcolor: "white", p: 0.5 }} />
                  : <Avatar sx={{ width: 48, height: 48, bgcolor: "#e3f2fd" }}><VerifiedIcon color="primary" /></Avatar>}
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={700} noWrap>{cert.label}</Typography>
                  {cert.issuedBy && <Typography variant="caption" color="text.secondary" noWrap>By: {cert.issuedBy}</Typography>}
                  {cert.year && <Typography variant="caption" color="text.secondary" display="block">{cert.year}</Typography>}
                </Box>
                <IconButton size="small" color="error" onClick={() => onCertChange(certifications.filter((_, j) => j !== i))}><DeleteIcon fontSize="small" /></IconButton>
              </Paper>
            ))}
          </Box>
        )}

        {/* add form */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#f9fafb" }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Add Certification</Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                {certForm.imagePreview
                  ? <Box component="img" src={certForm.imagePreview} sx={{ width: 64, height: 64, objectFit: "contain", border: "2px solid #1565c0", borderRadius: 1, bgcolor: "white", p: 0.5 }} />
                  : <Avatar sx={{ width: 64, height: 64, bgcolor: "#e3f2fd", cursor: "pointer" }} onClick={() => certImgRef.current?.click()}><PhotoCameraIcon color="primary" /></Avatar>}
                <input type="file" ref={certImgRef} hidden accept="image/*" onChange={handleCertImg} />
                <Button size="small" variant="outlined" color="primary" onClick={() => certImgRef.current?.click()} sx={{ fontSize: 10 }}>
                  {certForm.imagePreview ? "Change Badge" : "Upload Badge"}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Stack spacing={1.5}>
                <TextField size="small" fullWidth label="Certification Name *" placeholder="e.g. ISO 9001:2015, FSSAI, GMP Certified" value={certForm.label} onChange={e => setCertForm(f => ({ ...f, label: e.target.value }))} />
                <Box display="flex" gap={1.5}>
                  <TextField size="small" fullWidth label="Issued By" placeholder="e.g. Bureau of Indian Standards" value={certForm.issuedBy} onChange={e => setCertForm(f => ({ ...f, issuedBy: e.target.value }))} />
                  <TextField size="small" sx={{ width: 120 }} label="Year" placeholder="2023" value={certForm.year} onChange={e => setCertForm(f => ({ ...f, year: e.target.value }))} />
                </Box>
                <Button variant="contained" color="primary" size="small" startIcon={<AddIcon />} onClick={addCert} disabled={!certForm.label.trim()} sx={{ alignSelf: "flex-start" }}>Add Certification</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Stack>
  );
}
const CombinationBuilder = ({ combinations, onChange }) => {
  const [attrs, setAttrs] = useState([]);
  const [attrName, setAttrName] = useState("");
  const [attrVals, setAttrVals] = useState("");

  // On load: reconstruct attrs from existing combinations
  useEffect(() => {
    if (combinations?.length > 0 && attrs.length === 0) {
      const firstCombo = combinations[0];
      if (firstCombo?.attributes) {
        const reconstructed = Object.entries(firstCombo.attributes).map(([name]) => ({
          name,
          values: [...new Set(combinations.map(c => c.attributes?.[name]).filter(Boolean))],
        }));
        setAttrs(reconstructed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinations]);

  const rebuild = (newAttrs) => {
    if (!newAttrs.length) { onChange([]); return; }
    let result = [{}];
    for (const attr of newAttrs) {
      const tmp = [];
      for (const combo of result)
        for (const val of attr.values) tmp.push({ ...combo, [attr.name]: val });
      result = tmp;
    }
    onChange(result.map(combo => {
      const existing = combinations?.find(c =>
        newAttrs.every(a => (c.attributes?.[a.name] || c[a.name]) === combo[a.name])
      );
      return {
        attributes: combo,
        price: existing?.price || "",
        stock: existing?.stock || "",
        sku: existing?.sku || "",
        image: existing?.image || null,
      };
    }));
  };

  const addAttr = () => {
    if (!attrName.trim() || !attrVals.trim()) return;
    const vals = attrVals.split(",").map(v => v.trim()).filter(Boolean);
    // Check if attribute already exists — if so, ADD values to it
    const existingIdx = attrs.findIndex(a => a.name.toLowerCase() === attrName.trim().toLowerCase());
    let newAttrs;
    if (existingIdx >= 0) {
      newAttrs = attrs.map((a, i) =>
        i === existingIdx
          ? { ...a, values: [...new Set([...a.values, ...vals])] }
          : a
      );
    } else {
      newAttrs = [...attrs, { name: attrName.trim(), values: vals }];
    }
    setAttrs(newAttrs);
    setAttrName("");
    setAttrVals("");
    rebuild(newAttrs);
  };

  const removeAttrValue = (attrIdx, valIdx) => {
    const newAttrs = attrs.map((a, i) => {
      if (i !== attrIdx) return a;
      return { ...a, values: a.values.filter((_, j) => j !== valIdx) };
    }).filter(a => a.values.length > 0);
    setAttrs(newAttrs);
    rebuild(newAttrs);
  };

  const updateCombo = (idx, field, val) => {
    const updated = [...combinations];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  };

  const deleteCombo = (idx) => onChange(combinations.filter((_, i) => i !== idx));

  const attrKeys = attrs.length > 0
    ? attrs.map(a => a.name)
    : combinations[0]?.attributes
      ? Object.keys(combinations[0].attributes)
      : [];

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} mb={1}>
        Attribute Combination Builder
      </Typography>
      <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: 12 }}>
        Add attributes like "Type: Pack Of 4, Pack Of 6" — all combinations generate automatically.
        You can add multiple values per attribute.
      </Alert>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}>
        {/* Show current attributes with their values */}
        {attrs.length > 0 && (
          <Box mb={1.5}>
            {attrs.map((a, attrIdx) => (
              <Box key={attrIdx} mb={1}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                  {a.name}:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {a.values.map((val, valIdx) => (
                    <Chip
                      key={valIdx}
                      label={val}
                      size="small"
                      onDelete={() => removeAttrValue(attrIdx, valIdx)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Box display="flex" gap={1} flexWrap="wrap" alignItems="flex-end">
          <TextField
            size="small"
            label="Attribute Name"
            placeholder="e.g. Type, Size"
            value={attrName}
            onChange={e => setAttrName(e.target.value)}
            sx={{ width: 160 }}
            helperText="Enter same name to add more values"
          />
          <TextField
            size="small"
            label="Values (comma-separated)"
            placeholder="Pack Of 4, Pack Of 6"
            value={attrVals}
            onChange={e => setAttrVals(e.target.value)}
            sx={{ width: 260 }}
            onKeyDown={e => e.key === "Enter" && addAttr()}
            helperText="Multiple values = multiple combinations"
          />
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addAttr} sx={{ mb: 2.5 }}>
            Add
          </Button>
          {attrs.length > 0 && (
            <Button
              size="small"
              color="error"
              variant="outlined"
              sx={{ mb: 2.5 }}
              onClick={() => { if (window.confirm("Clear all attributes?")) { setAttrs([]); onChange([]); } }}
            >
              Clear All
            </Button>
          )}
        </Box>
      </Paper>

      {combinations?.length > 0 && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="caption" color="text.secondary">
              {combinations.length} combination(s) — fill in price & stock for each
            </Typography>
          </Box>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  {attrKeys.map(k => <TableCell key={k}><b>{k}</b></TableCell>)}
                  <TableCell><b>Price (₹)</b></TableCell>
                  <TableCell><b>Stock</b></TableCell>
                  <TableCell><b>SKU</b></TableCell>
                  <TableCell><b>Image</b></TableCell>
                  <TableCell><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {combinations.map((c, idx) => (
                  <TableRow key={idx} hover>
                    {attrKeys.map(k => (
                      <TableCell key={k}>{c.attributes?.[k] || c[k]}</TableCell>
                    ))}
                    <TableCell>
                      <TextField size="small" type="number" value={c.price}
                        onChange={e => updateCombo(idx, "price", e.target.value)}
                        sx={{ width: 100 }}
                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={c.stock}
                        onChange={e => updateCombo(idx, "stock", e.target.value)}
                        sx={{ width: 80 }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={c.sku}
                        onChange={e => updateCombo(idx, "sku", e.target.value)}
                        placeholder="Auto" sx={{ width: 120 }} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {c.image && (
                          <Box component="img"
                            src={typeof c.image === "string" ? c.image : (c.image?.url || c.image)}
                            sx={{ width: 40, height: 40, objectFit: "cover", borderRadius: 1, border: "1px solid #ddd" }} />
                        )}
                        <label>
                          <input type="file" accept="image/*" hidden onChange={e => {
                            const file = e.target.files?.[0]; if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => updateCombo(idx, "image", ev.target.result);
                            reader.readAsDataURL(file);
                          }} />
                          <Button size="small" variant="outlined" component="span" sx={{ fontSize: 10, px: 1 }}>
                            {c.image ? "Change" : "Upload"}
                          </Button>
                        </label>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => deleteCombo(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

// ── Author Details Manager ────────────────────────────────────────────────
const AuthorManager = ({ authors, onChange }) => {
  const ROLES = ["Written By", "Reviewed By", "Medically Reviewed By"];
  const EMPTY = { role: "Written By", name: "", designation: "", imageUrl: "", about: "", linkedin: "", experience_years: "", education: [], experience: [] };
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState(null); const [form, setForm] = useState(EMPTY);
  const setF = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({ ...EMPTY, ...authors[i] }); setOpen(true); };
  const save = () => { if (!form.name.trim()) return; if (editing !== null) { const u = [...authors]; u[editing] = form; onChange(u); } else onChange([...authors, form]); setOpen(false); setEditing(null); };
  const addEdu = () => setF("education", [...(form.education || []), { degree: "", institution: "", year: "" }]);
  const updateEdu = (i, field, val) => { const a = [...(form.education || [])]; a[i] = { ...a[i], [field]: val }; setF("education", a); };
  const removeEdu = (i) => setF("education", (form.education || []).filter((_, j) => j !== i));
  const addExp = () => setF("experience", [...(form.experience || []), { role: "", organization: "", period: "" }]);
  const updateExp = (i, field, val) => { const a = [...(form.experience || [])]; a[i] = { ...a[i], [field]: val }; setF("experience", a); };
  const removeExp = (i) => setF("experience", (form.experience || []).filter((_, j) => j !== i));
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={700}>Author / Contributor Details (1mg-style)</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}>+ ADD AUTHOR</Button>
      </Box>
      <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: 12 }}>These appear in the product detail page sidebar like 1mg.</Alert>
      {authors.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap={2} mb={1.5}>
          {authors.map((a, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2, minWidth: 200, display: "flex", gap: 1.5, alignItems: "center" }}>
              <Avatar src={a.imageUrl} sx={{ width: 40, height: 40, bgcolor: "#1565c0" }}><PersonIcon /></Avatar>
              <Box flex={1}><Typography variant="caption" color="text.secondary" display="block">{a.role}</Typography><Typography variant="body2" fontWeight={700}>{a.name}</Typography>{a.designation && <Typography variant="caption">{a.designation}</Typography>}</Box>
              <Box><IconButton size="small" onClick={() => openEdit(i)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => onChange(authors.filter((_, j) => j !== i))}><DeleteIcon fontSize="small" /></IconButton></Box>
            </Paper>
          ))}
        </Box>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing !== null ? "Edit Author" : "Add Author"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl size="small" fullWidth><InputLabel>Role</InputLabel><Select value={form.role} label="Role" onChange={e => setF("role", e.target.value)}>{ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</Select></FormControl>
            <TextField label="Name *" fullWidth size="small" value={form.name} onChange={e => setF("name", e.target.value)} />
            <TextField label="Designation" fullWidth size="small" value={form.designation} onChange={e => setF("designation", e.target.value)} />
            <TextField label="Photo URL (optional)" fullWidth size="small" value={form.imageUrl} onChange={e => setF("imageUrl", e.target.value)} />
            <TextField label="LinkedIn URL" fullWidth size="small" value={form.linkedin || ""} onChange={e => setF("linkedin", e.target.value)} />
            <TextField label="Years of Experience" fullWidth size="small" type="number" value={form.experience_years || ""} onChange={e => setF("experience_years", e.target.value)} />
            <TextField label="About / Bio" fullWidth size="small" multiline rows={3} value={form.about || ""} onChange={e => setF("about", e.target.value)} />
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}><Typography variant="subtitle2" fontWeight={700}>Education</Typography><Button size="small" startIcon={<AddIcon />} onClick={addEdu}>Add</Button></Box>
              {(form.education || []).map((e, i) => (<Box key={i} sx={{ display: "flex", gap: 1, mb: 1 }}><TextField size="small" label="Degree" value={e.degree} onChange={ev => updateEdu(i, "degree", ev.target.value)} sx={{ flex: 1.5 }} /><TextField size="small" label="Institution" value={e.institution} onChange={ev => updateEdu(i, "institution", ev.target.value)} sx={{ flex: 2 }} /><TextField size="small" label="Year" value={e.year} onChange={ev => updateEdu(i, "year", ev.target.value)} sx={{ width: 110 }} /><IconButton size="small" color="error" onClick={() => removeEdu(i)}><DeleteIcon fontSize="small" /></IconButton></Box>))}
            </Box>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}><Typography variant="subtitle2" fontWeight={700}>Work Experience</Typography><Button size="small" startIcon={<AddIcon />} onClick={addExp}>Add</Button></Box>
              {(form.experience || []).map((ex, i) => (<Box key={i} sx={{ display: "flex", gap: 1, mb: 1 }}><TextField size="small" label="Role" value={ex.role} onChange={ev => updateExp(i, "role", ev.target.value)} sx={{ flex: 1.5 }} /><TextField size="small" label="Organization" value={ex.organization} onChange={ev => updateExp(i, "organization", ev.target.value)} sx={{ flex: 2 }} /><TextField size="small" label="Period" value={ex.period} onChange={ev => updateExp(i, "period", ev.target.value)} sx={{ width: 130 }} /><IconButton size="small" color="error" onClick={() => removeExp(i)}><DeleteIcon fontSize="small" /></IconButton></Box>))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} variant="contained">{editing !== null ? "Update" : "Add"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Review Management ─────────────────────────────────────────────────────
const ReviewManagement = ({ reviews, onChange }) => {
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ user: "", rating: 4, comment: "", date: new Date().toISOString().split("T")[0], verified: true });
  const save = () => {
    if (editing !== null) { const u = [...reviews]; u[editing] = form; onChange(u); } else onChange([...reviews, { ...form, id: Date.now() }]);
    setOpen(false); setEditing(null); setForm({ user: "", rating: 4, comment: "", date: new Date().toISOString().split("T")[0], verified: true });
  };
  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight={700}>Customer Reviews ({reviews.length})</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setEditing(null); setOpen(true); }}>Add Review</Button>
        </Box>
        {reviews.length > 0 && (
          <TableContainer><Table size="small">
            <TableHead><TableRow sx={{ bgcolor: "#f5f5f5" }}>{["User", "Rating", "Comment", "Date", "Verified", "Actions"].map(h => <TableCell key={h}><b>{h}</b></TableCell>)}</TableRow></TableHead>
            <TableBody>{reviews.map((r, i) => (<TableRow key={i} hover><TableCell>{r.user}</TableCell><TableCell><Rating value={r.rating} readOnly size="small" /></TableCell><TableCell><Typography variant="caption" noWrap sx={{ maxWidth: 180, display: "block" }}>{r.comment}</Typography></TableCell><TableCell>{r.date}</TableCell><TableCell>{r.verified ? "✓" : "—"}</TableCell><TableCell><IconButton size="small" onClick={() => { setForm(r); setEditing(i); setOpen(true); }}><EditIcon fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => onChange(reviews.filter((_, j) => j !== i))}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>))}</TableBody>
          </Table></TableContainer>
        )}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing !== null ? "Edit Review" : "Add Review"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="User Name" fullWidth size="small" value={form.user} onChange={e => setForm(f => ({ ...f, user: e.target.value }))} />
              <Box><Typography variant="caption">Rating</Typography><br /><Rating value={form.rating} onChange={(_, v) => setForm(f => ({ ...f, rating: v }))} /></Box>
              <TextField label="Comment" multiline rows={3} fullWidth size="small" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
              <TextField label="Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <FormControlLabel control={<Checkbox checked={form.verified} onChange={e => setForm(f => ({ ...f, verified: e.target.checked }))} />} label="Verified Purchase" />
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} variant="contained">{editing !== null ? "Update" : "Add"}</Button></DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default function EditProductForm({ productId, token: tokenProp, fetchEndpoint, updateEndpoint, onBack, onSuccess }) {
  
  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE });
    instance.interceptors.request.use((cfg) => {
      const token = tokenProp || localStorage.getItem("adminToken");
      if (token) cfg.headers.Authorization = "Bearer " + token;
      return cfg;
    });
    return instance;
  }, [tokenProp]);

  const { toasts, show } = useToast();
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState("panel1");
  const [submitting, setSubmitting] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedMainCat, setSelectedMainCat] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");
  const [subCatLoading, setSubCatLoading] = useState(false);
  const [subCatIds, setSubCatIds] = useState(new Set());
  const [availableHomeSections, setAvailableHomeSections] = useState([]);
  const [selectedHomeSections, setSelectedHomeSections] = useState([]);

  const [specifications, setSpecifications] = useState([{ key: "", value: "" }]);
  const [variants, setVariants] = useState([{ name: "", price: "", stock: "" }]);
  const [combinations, setCombinations] = useState([]);
  const [combos, setCombos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [sections, setSections] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [injectionTypes, setInjectionTypes] = useState([]);
  const [tabletTypes, setTabletTypes] = useState([]);
  const [selectedInjType, setSelectedInjType] = useState("");
  const [selectedTabType, setSelectedTabType] = useState("");

  const [gstRate, setGstRate] = useState("");
  const [gstValues, setGstValues] = useState({ igst: "", cgst: "", sgst: "" });

  const [newImages, setNewImages] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [newVideo, setNewVideo] = useState(null);

  const [fd, setFd] = useState({
    images: [], video: null,
    manufacturer: "", brandName: "", genericCompositions: "",
    totalStocks: "", hsn: "", batchNumber: "", batchDateEffect: "", expiryDate: "",
    caseBoxPackage: "", packageType: "", productWeight: "",
    minRateFixed: "", mrp: "", amp: "",
    totalCostOfStores: "0.00", totalActualValue: "0.00",
    b2cDiscount: "", saleRatePTR: "0.00", totalSaleValue: "0.00",
    b2bDiscount: "", totalBusinessSaleValue: "0.00",
    wholesaleSaleRate: "", totalWholesaleValue: "0.00",
    casePackPrice: "",
    hospitalDiscount: "", hospitalSaleRate: "", hospitalTotalValue: "0.00",
    pharmacyDiscount: "", pharmacySaleRate: "", pharmacyTotalValue: "0.00",
    vendorDiscount: "", vendorRate: "0.00",
    franchiseDiscount: "", franchiseRate: "0.00",
    manufacturerDiscount: "", manufacturerRate: "0.00",
    gstDateEffect: "",
    offersWithIcon: [],
    additionalOffers: "", scheme1: "", scheme2: "",
    tags: [], description: "", moreInformation: "", disclaimer: "",
    productRating: 4.5,
    doctorFeedbacks: [],
    currentStatus1: "active", currentStatus2: "appear",
    topReviewFromIndia: "",
    isOTC: true,
    marketerName: "", marketerAddress: "", countryOfOrigin: "", lastUpdated: "",
  });

  const set = (field, value) => setFd(p => ({ ...p, [field]: value }));

  useEffect(() => { const t = setInterval(() => setCurrentDateTime(new Date()), 1000); return () => clearInterval(t); }, []);

  // ── Fetch categories ──────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    const token = tokenProp || localStorage.getItem("adminToken") || "";
    for (const url of [`${API_BASE}/api/category/all`, `${API_BASE}/api/categories/all`]) {
      try {
        const res = await fetch(url, { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const d = await res.json();
        const cats = d.categories || d.data || [];
         
if (cats.length) {
  setMainCategories(cats);
  const subIds = new Set(
    cats
      .filter(c => !!(c.parent || c.parentId || c.parentCategory))
      .map(c => c._id)
  );
  setSubCatIds(subIds);
  return;
}
 
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  useEffect(() => {
  const token = tokenProp || localStorage.getItem("adminToken") || "";
  const tryUrls = [
    `${API_BASE}/api/sections/all`,
  ];
  (async () => {
    for (const url of tryUrls) {
      try {
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const d = await res.json();
        const secs = d.sections || d.homeSections || d.data || [];
        if (secs.length) {
          setAvailableHomeSections(secs);
          return;
        }
      } catch {}
    }
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  useEffect(() => {
    if (!selectedMainCat) { setSubCategories([]); setSelectedSubCat(""); return; }
    const cat = mainCategories.find(c => c._id === selectedMainCat);
    if (!cat) return;
    const token = tokenProp || localStorage.getItem("adminToken") || "";
    setSubCatLoading(true);
    fetch(`${API_BASE}/api/category/sub/${encodeURIComponent(cat.title)}`, { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      .then(r => r.json()).then(d => setSubCategories(d.categories || [])).catch(() => setSubCategories([])).finally(() => setSubCatLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMainCat, mainCategories]);

  // ── Fetch product data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) return;
    setLoading(true);

    const ROUTES = fetchEndpoint
      ? [fetchEndpoint]
      : [
          `/api/admin/product/${productId}`,
          `/api/admin/products/${productId}`,
          `/api/products/${productId}`,
        ];

    const tryFetch = async () => {
      for (const route of ROUTES) {
        try {
          const res = await api.get(route);
          const candidate = res.data?.product || res.data?.data || res.data;
          if (candidate && (candidate._id || candidate.brandName || candidate.mrp)) {
            console.log("Product loaded from", route, candidate);
            return candidate;
          }
        } catch { /* try next */ }
      }
      return null;
    };

    tryFetch().then(p => {
      if (!p) { show("Product not found — check backend GET route", "error"); setLoading(false); return; }

      setFd({
        manufacturer: p.manufacturer || "",
        brandName: p.brandName || "",
        genericCompositions: p.genericName || p.genericCompositions || "",
        totalStocks: String(p.stocks ?? p.totalStocks ?? p.stock ?? ""),
        hsn: p.hsn || "",
        batchNumber: p.batchNumber || "",
        batchDateEffect: (p.dateOfEffect || p.batchDateEffect || "").split("T")[0],
        expiryDate: (p.expiryDate || "").split("T")[0],
        caseBoxPackage: p.caseBoxPackage || "",
        packageType: p.packagingType || p.packageType || "",
        productWeight: String(p.productWeight ?? ""),
        minRateFixed: String(p.minRateFixed ?? ""),
        mrp: String(p.mrp ?? p.price ?? ""),
        amp: String(p.amp ?? ""),
        saleRatePTR: String(p.ptr ?? p.saleRatePTR ?? "0.00"),
        wholesaleSaleRate: String(p.wsr ?? p.wholesaleSaleRate ?? ""),
        casePackPrice: String(p.casePackPrice ?? ""),
        hospitalSaleRate: String(p.hpsr ?? p.hospitalSaleRate ?? "0.00"),
        pharmacySaleRate: String(p.pharmacySaleRate ?? "0.00"),
        vendorRate: String(p.vendorRate ?? "0.00"),
        franchiseRate: String(p.franchiseRate ?? "0.00"),
        manufacturerRate: String(p.manufacturerRate ?? "0.00"),
        totalCostOfStores: String(p.totalCostOfStores ?? "0.00"),
        totalActualValue: String(p.totalActualValue ?? "0.00"),
        totalSaleValue: String(p.totalSaleValue ?? "0.00"),
        totalBusinessSaleValue: String(p.totalBusinessSaleValue ?? "0.00"),
        totalWholesaleValue: String(p.totalWholesaleValue ?? "0.00"),
        hospitalTotalValue: "0.00",
        pharmacyTotalValue: "0.00",
        b2cDiscount: String(p.discountB2C ?? p.b2cDiscount ?? ""),
        b2bDiscount: String(p.discountB2B ?? p.b2bDiscount ?? ""),
        hospitalDiscount: String(p.discountHospital ?? p.hospitalDiscount ?? ""),
        pharmacyDiscount: String(p.discountHospital ?? p.pharmacyDiscount ?? ""),
        vendorDiscount: String(p.discountVendor ?? p.vendorDiscount ?? ""),
        franchiseDiscount: String(p.discountFranchise ?? p.franchiseDiscount ?? ""),
        manufacturerDiscount: String(p.discountManufacturer ?? p.manufacturerDiscount ?? ""),
        offersWithIcon: p.offersWithIcon || [],
        additionalOffers: p.additionalOffers || "",
        scheme1: p.scheme1 || "",
        scheme2: p.scheme2 || "",
        tags: p.tags || [],
        description: p.shortDescription || p.description || "",
        moreInformation: p.fullDescription || p.moreInformation || "",
        disclaimer: p.disclaimer || "",
        currentStatus1: p.statusActive || p.currentStatus1 || "active",
        currentStatus2: p.statusAppear || p.currentStatus2 || "appear",
        isOTC: p.isOTC !== undefined ? p.isOTC : true,
        productRating: p.rating ?? p.productRating ?? 4.5,
        topReviewFromIndia: p.topReviewFromIndia || "",
        doctorFeedbacks: p.doctorFeedbacks || [],
        marketerName: p.marketerName || "",
        marketerAddress: p.marketerAddress || "",
        countryOfOrigin: p.countryOfOrigin || "",
        lastUpdated: p.lastUpdated || "",
        injectionTypes: p.injectionTypes || [],
        tabletTypes: p.tabletTypes || [],
      });

      // GST handling
      const igstVal = String(p.gst_igst ?? p.gst?.igst ?? "");
      const cgstVal = String(p.gst_cgst ?? p.gst?.cgst ?? "");
      const sgstVal = String(p.gst_sgst ?? p.gst?.sgst ?? "");
      if (igstVal) {
        setGstRate(igstVal);
        setGstValues({ igst: igstVal, cgst: cgstVal, sgst: sgstVal });
      }

      // Categories
      const mainCatId = p.category?._id || p.category || "";
      const subCatId = p.subCategory?._id || p.subCategory || "";
      setSelectedMainCat(mainCatId);
      setSelectedSubCat(subCatId);

      // Images
      const urls = (p.images || []).map((img) => img?.url || img).filter(Boolean);
      setExistingImageUrls(urls);

      // Arrays
      if (p.specifications?.length) setSpecifications(p.specifications);
      if (p.variants?.length) setVariants(p.variants);
      if (p.combinations?.length) setCombinations(p.combinations);
      if (p.combos?.length) setCombos(p.combos);
      if (p.sections?.length) setSections(p.sections);
      if (p.homeSections?.length) {
  setSelectedHomeSections(p.homeSections);
}
      if (p.reviews?.length) setReviews(p.reviews);
      if (p.coupons?.length) setCoupons(p.coupons);
      if (p.authors?.length) setAuthors(p.authors);
      if (p.recommendations?.length) setRecommendations(p.recommendations);
      if (p.certifications?.length) setCertifications(p.certifications);
      if (p.injectionTypes?.length) setInjectionTypes(p.injectionTypes);
      if (p.tabletTypes?.length) setTabletTypes(p.tabletTypes);

      setLoading(false);
    }).catch(err => {
      console.error("Fetch error:", err);
      show("Failed to load product — see console", "error");
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, show]);

  const handleGstRateChange = (val) => {
    setGstRate(val);
    const total = parseFloat(val) || 0;
    const half = (total / 2).toFixed(2);
    setGstValues({ igst: fmt(total), cgst: half, sgst: half });
  };

  // Auto-calculations
  useEffect(() => {
    const stocks = n(fd.totalStocks), mrp = n(fd.mrp), amp = n(fd.amp);
    setFd(p => ({
      ...p,
      totalCostOfStores: fmt(amp * stocks),
      totalActualValue: fmt(mrp * stocks),
      saleRatePTR: fmt(mrp * (1 - n(p.b2cDiscount) / 100)),
      totalSaleValue: fmt(mrp * (1 - n(p.b2cDiscount) / 100) * stocks),
      totalBusinessSaleValue: fmt(mrp * (1 - n(p.b2bDiscount) / 100) * stocks),
      totalWholesaleValue: fmt(n(p.wholesaleSaleRate) * stocks),
      hospitalSaleRate: fmt(mrp * (1 - n(p.hospitalDiscount) / 100)),
      hospitalTotalValue: fmt(mrp * (1 - n(p.hospitalDiscount) / 100) * stocks),
      pharmacySaleRate: fmt(mrp * (1 - n(p.pharmacyDiscount) / 100)),
      pharmacyTotalValue: fmt(mrp * (1 - n(p.pharmacyDiscount) / 100) * stocks),
      vendorRate: fmt(mrp * (1 - n(p.vendorDiscount) / 100)),
      franchiseRate: fmt(mrp * (1 - n(p.franchiseDiscount) / 100)),
      manufacturerRate: fmt(mrp * (1 - n(p.manufacturerDiscount) / 100)),
    }));
  }, [fd.totalStocks, fd.mrp, fd.amp, fd.b2cDiscount, fd.b2bDiscount, fd.wholesaleSaleRate, fd.hospitalDiscount, fd.pharmacyDiscount, fd.vendorDiscount, fd.franchiseDiscount, fd.manufacturerDiscount]);

  const toBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result); r.onerror = rej; });
  const compressAndEncode = async (file) => {
    const compressed = await compressImage(file, { maxWidthOrHeight: 1280, quality: 0.75 });
    return toBase64(compressed);
  };
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errors = [];
    if (!fd.manufacturer) errors.push("Manufacturer");
    if (!fd.brandName) errors.push("Brand Name");
    if (!selectedMainCat) errors.push("Category");
    if (!fd.mrp) errors.push("MRP");
    if (!fd.totalStocks) errors.push("Total Stocks");
    if (errors.length) { show(`Required: ${errors.join(", ")}`, "error"); return; }
    setSubmitting(true);
    try {
      let payload = {
  manufacturer: fd.manufacturer,
  brandName: fd.brandName,
  genericCompositions: fd.genericCompositions,
  hsn: fd.hsn,
  batchNumber: fd.batchNumber,
  category: selectedMainCat,
  subCategory: selectedSubCat || null,
  sections,
  homeSections: selectedHomeSections || [],
  totalStocks: Number(fd.totalStocks),
  stocks: Number(fd.totalStocks),           
  productWeight: fd.productWeight,
  packageType: fd.packageType,
  injectionTypes,
  tabletTypes,
  caseBoxPackage: fd.caseBoxPackage,
  casePackPrice: fd.casePackPrice,
  dateOfEffect: fd.batchDateEffect,          
  expiryDate: fd.expiryDate,
  minRateFixed: fd.minRateFixed,
  mrp: Number(fd.mrp),
  amp: Number(fd.amp),
  saleRatePTR: Number(fd.saleRatePTR),
  wholesaleSaleRate: Number(fd.wholesaleSaleRate),
  hospitalSaleRate: Number(fd.hospitalSaleRate),
  pharmacySaleRate: Number(fd.pharmacySaleRate),
  vendorRate: Number(fd.vendorRate),
  franchiseRate: Number(fd.franchiseRate),
  manufacturerRate: Number(fd.manufacturerRate),
  totalCostOfStores: Number(fd.totalCostOfStores),
  totalActualValue: Number(fd.totalActualValue),
  totalSaleValue: Number(fd.totalSaleValue),
  totalBusinessSaleValue: Number(fd.totalBusinessSaleValue),
  totalWholesaleValue: Number(fd.totalWholesaleValue),

  discountB2C: Number(fd.b2cDiscount) || 0,
  discountB2B: Number(fd.b2bDiscount) || 0,
  discountHospital: Number(fd.hospitalDiscount) || 0,
  discountPharmacy: Number(fd.pharmacyDiscount) || 0,
  discountVendor: Number(fd.vendorDiscount) || 0,
  discountFranchise: Number(fd.franchiseDiscount) || 0,
  discountManufacturer: Number(fd.manufacturerDiscount) || 0,

  gst_igst: gstValues.igst ? Number(gstValues.igst) : undefined,
  gst_cgst: gstValues.cgst ? Number(gstValues.cgst) : undefined,
  gst_sgst: gstValues.sgst ? Number(gstValues.sgst) : undefined,
  gstDateEffect: fd.gstDateEffect,

  offersWithIcon: fd.offersWithIcon,
  additionalOffers: fd.additionalOffers,
  scheme1: fd.scheme1,
  scheme2: fd.scheme2,
  coupons,
  authors,
  combos,
  recommendations,
  certifications,
  tags: fd.tags,

  shortDescription: fd.description,
  fullDescription: fd.moreInformation,
  disclaimer: fd.disclaimer,

  statusActive: fd.currentStatus1,
  statusAppear: fd.currentStatus2,

  isOTC: fd.isOTC,
  rating: fd.productRating,               
  topReviewFromIndia: fd.topReviewFromIndia,
  doctorFeedbacks: fd.doctorFeedbacks,
  marketerName: fd.marketerName,
  marketerAddress: fd.marketerAddress,
  countryOfOrigin: fd.countryOfOrigin,
  lastUpdated: fd.lastUpdated,
  variants: variants.filter(v => v.name),
  combinations,
  specifications,
  reviews,
};
      
      // Handle images
      if (newImages.length > 0) {
        const imgBase64 = await Promise.all(newImages.map(compressAndEncode));
        payload.images = imgBase64;
      }

      // Handle video
      if (newVideo) {
        payload.video = await toBase64(newVideo[0]);
      }

      // PUT request with multiple fallback routes
      const PUT_ROUTES = updateEndpoint
        ? [updateEndpoint]
        : [
            `/api/admin/product/${productId}`,
            `/api/admin/products/update/${productId}`,
            `/api/admin/products/${productId}`,
            `/api/admin/product/update/${productId}`,
          ];

      let saved = false;
      let lastErr = null;
      for (const route of PUT_ROUTES) {
        try {
          await api.put(route, payload, { timeout: 60000 });
          console.log("Saved via", route);
          saved = true;
          break;
        } catch (e) {
          lastErr = e;
          if (e.response?.status !== 404) break;
        }
      }
      if (!saved) throw lastErr;

      show(`"${fd.brandName}" updated successfully!`);
      onSuccess?.();
      onBack?.();
    } catch (err) {
      console.error("Save error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to save";
      show(`Error: ${msg}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const accordion = (panel) => ({ expanded: expanded === panel, onChange: (_, open) => setExpanded(open ? panel : false) });

  const margin = (() => {
    const cost = n(fd.totalCostOfStores), sale = n(fd.totalSaleValue);
    if (!cost || !sale) return null;
    return ((sale - cost) / cost * 100).toFixed(1);
  })();

  const DISCOUNT_ROLES = [
    { key: "b2c", label: "B2C — Customer", color: "#1565c0", bg: "#e3f2fd", discF: "b2cDiscount", rateF: "saleRatePTR", totalF: "totalSaleValue", icon: <StoreIcon /> },
    { key: "b2b", label: "B2B — Business", color: "#6a1b9a", bg: "#f3e5f5", discF: "b2bDiscount", rateF: null, totalF: "totalBusinessSaleValue", icon: <AccountTreeIcon /> },
    { key: "wholesale", label: "Wholesale", color: "#e65100", bg: "#fff3e0", discF: null, rateF: "wholesaleSaleRate", totalF: "totalWholesaleValue", icon: <LocalOfferIcon />, isWsr: true },
    { key: "hospital", label: "Hospital", color: "#0277bd", bg: "#e1f5fe", discF: "hospitalDiscount", rateF: "hospitalSaleRate", totalF: "hospitalTotalValue", icon: <LocalHospitalIcon /> },
    { key: "pharmacy", label: "Pharmacy", color: "#2e7d32", bg: "#e8f5e9", discF: "pharmacyDiscount", rateF: "pharmacySaleRate", totalF: "pharmacyTotalValue", icon: <StorefrontIcon /> },
    { key: "vendor", label: "Vendor", color: "#00695c", bg: "#e0f2f1", discF: "vendorDiscount", rateF: "vendorRate", totalF: null, icon: <AccountTreeIcon /> },
    { key: "franchise", label: "Franchise", color: "#ad1457", bg: "#fce4ec", discF: "franchiseDiscount", rateF: "franchiseRate", totalF: null, icon: <StorefrontIcon /> },
    { key: "manufacturer", label: "Manufacturer", color: "#4527a0", bg: "#ede7f6", discF: "manufacturerDiscount", rateF: "manufacturerRate", totalF: null, icon: <FactoryIcon /> },
  ];

  const [tagInput, setTagInput] = useState("");
  const [doctorInput, setDoctorInput] = useState("");

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400} gap={2}>
        <CircularProgress />
        <Typography color="text.secondary">Loading product data…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f0f4f8", minHeight: "100vh", pb: 10 }}>
      {/* Toast */}
      <Box sx={{ position: "fixed", top: 80, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 1 }}>
        {toasts.map(t => <Alert key={t.id} severity={t.severity} variant="filled" sx={{ minWidth: 280, boxShadow: 3 }}>{t.msg}</Alert>)}
      </Box>

      {/* Header */}
      <Paper elevation={4} sx={{ borderRadius: 0, background: "linear-gradient(135deg,#1565c0,#0d47a1)", color: "white", px: 3, py: 2 }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Button startIcon={<ArrowBackIcon />} onClick={onBack}
                sx={{ color: "white", border: "1px solid rgba(255,255,255,0.5)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                Back
              </Button>
              <Box>
                <Typography variant="h5" fontWeight={700}>Edit Product</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {fd.brandName || "Loading…"} · ID: {productId}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Chip icon={<AccessTimeIcon />} label={currentDateTime.toLocaleString()} sx={{ bgcolor: "rgba(255,255,255,.15)", color: "white", "& .MuiChip-icon": { color: "white" } }} />
              {margin && <Chip label={`Margin: ${margin}%`} sx={{ bgcolor: n(margin) > 0 ? "rgba(76,175,80,.3)" : "rgba(244,67,54,.3)", color: "white" }} />}
              <Button variant="contained"
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={submitting} onClick={handleSubmit}
                sx={{ bgcolor: "white", color: "#1565c0", fontWeight: 700, "&:hover": { bgcolor: "#e3f2fd" }, px: 3 }}>
                {submitting ? "Saving…" : "Update Product"}
              </Button>
            </Box>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <form onSubmit={handleSubmit}>

              {/* 1. Media */}
              <Accordion {...accordion("panel1")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#e3f2fd", width: 32, height: 32 }}><PhotoCameraIcon color="primary" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Product Media</Typography>
                    {existingImageUrls.length > 0 && <Chip label={`${existingImageUrls.length} existing`} size="small" color="success" />}
                    {newImages.length > 0 && <Chip label={`${newImages.length} new`} size="small" color="warning" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={7}>
                      <FileUploadArea
                        title="Product Images (multiple)"
                        accept="image/*"
                        multiple
                        existingUrls={existingImageUrls}
                        onFilesSelect={files => setNewImages(files)}
                        icon={<PhotoCameraIcon sx={{ fontSize: 40, color: "#1565c0" }} />}
                        type="image"
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <FileUploadArea
                        title="Product Video"
                        accept="video/*"
                        multiple={false}
                        onFilesSelect={files => setNewVideo(files)}
                        icon={<VideocamIcon sx={{ fontSize: 40, color: "#1565c0" }} />}
                        type="video"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 2. Basic Info */}
              <Accordion {...accordion("panel2")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#e8f5e9", width: 32, height: 32 }}><InfoIcon color="success" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Basic Information</Typography>
                    {fd.brandName && <Chip label="✓" color="success" size="small" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Grid container spacing={2}>
                    {[
                      { label: "Manufacturer *", field: "manufacturer", md: 4 },
                      { label: "Brand Name *", field: "brandName", md: 4 },
                      { label: "Generic Compositions", field: "genericCompositions", md: 4 },
                      { label: "Total Stocks *", field: "totalStocks", type: "number", md: 3 },
                      { label: "HSN Code *", field: "hsn", md: 3 },
                      { label: "Batch Number", field: "batchNumber", md: 3 },
                      { label: "Product Weight (g)", field: "productWeight", type: "number", md: 3 },
                      { label: "Date of Effect", field: "batchDateEffect", type: "date", md: 3 },
                      { label: "Expiry Date", field: "expiryDate", type: "date", md: 3 },
                      { label: "Case Box Package", field: "caseBoxPackage", md: 3 },
                      { label: "Package Type", field: "packageType", md: 3 },
                    ].map(({ label, field, type, md }) => (
                      <Grid item xs={12} md={md} key={field}>
                        <TextField fullWidth label={label} type={type || "text"} InputLabelProps={type === "date" ? { shrink: true } : undefined} value={fd[field]} onChange={e => set(field, e.target.value)} />
                      </Grid>
                    ))}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Injection Types</Typography>
                      <Box display="flex" gap={1}>
                        <FormControl size="small" fullWidth><InputLabel>Select</InputLabel>
                          <Select value={selectedInjType} label="Select" onChange={e => setSelectedInjType(e.target.value)}>
                            {["Vials", "Ampoules", "Cartridges", "Prefilled Syringes", "Infusions"].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button variant="contained" size="small" onClick={() => { if (!selectedInjType || injectionTypes.includes(selectedInjType)) return; setInjectionTypes([...injectionTypes, selectedInjType]); setSelectedInjType(""); }}>Add</Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>{injectionTypes.map((t, i) => <Chip key={i} label={t} size="small" color="primary" variant="outlined" onDelete={() => setInjectionTypes(injectionTypes.filter((_, j) => j !== i))} />)}</Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Tablet / Capsule Types</Typography>
                      <Box display="flex" gap={1}>
                        <FormControl size="small" fullWidth><InputLabel>Select</InputLabel>
                          <Select value={selectedTabType} label="Select" onChange={e => setSelectedTabType(e.target.value)}>
                            {["Blisters", "Strips", "Bottles", "Alu-Alu", "Sachets"].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button variant="contained" size="small" color="secondary" onClick={() => { if (!selectedTabType || tabletTypes.includes(selectedTabType)) return; setTabletTypes([...tabletTypes, selectedTabType]); setSelectedTabType(""); }}>Add</Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>{tabletTypes.map((t, i) => <Chip key={i} label={t} size="small" color="secondary" variant="outlined" onDelete={() => setTabletTypes(tabletTypes.filter((_, j) => j !== i))} />)}</Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 3. Pricing */}
              <Accordion {...accordion("panel3")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#fce4ec", width: 32, height: 32 }}><CurrencyRupeeIcon color="error" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Pricing & Costing</Typography>
                    {fd.mrp && <Chip label={`MRP ₹${fd.mrp}`} size="small" color="error" variant="outlined" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Grid container spacing={2}>
                    {[
                      { label: "Min Rate Fixed", field: "minRateFixed" },
                      { label: "MRP *", field: "mrp" },
                      { label: "AMP (Actual Mfr Price)", field: "amp" },
                      { label: "Case Pack Price", field: "casePackPrice" }
                    ].map(({ label, field }) => (
                      <Grid item xs={12} md={3} key={field}>
                        <TextField fullWidth label={label} type="number" value={fd[field]} onChange={e => set(field, e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" mb={1} display="block"><CalculateIcon sx={{ fontSize: 14, mr: 0.5 }} />Auto-Calculated</Typography>
                        <Grid container spacing={2}>
                          {[
                            { label: "Total Cost of Stores", value: fd.totalCostOfStores, helper: "AMP × Stocks" },
                            { label: "Total Actual Value", value: fd.totalActualValue, helper: "MRP × Stocks" },
                            { label: "B2C Sale Total", value: fd.totalSaleValue, helper: "PTR × Stocks" }
                          ].map(({ label, value, helper }) => (
                            <Grid item xs={12} md={4} key={label}>
                              <TextField fullWidth label={label} value={`₹ ${value}`} InputProps={{ readOnly: true }} sx={{ bgcolor: "#fff" }} helperText={helper} />
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 4. Discounts */}
              <Accordion {...accordion("panel4")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#ede7f6", width: 32, height: 32 }}><PercentIcon color="secondary" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Discounts & Sales Rates (All Roles)</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={2}>
                    {DISCOUNT_ROLES.map(({ key, label, color, bg, discF, rateF, totalF, icon, isWsr }) => (
                      <Paper key={key} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: color }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}><Box sx={{ color }}>{icon}</Box><Typography variant="subtitle1" fontWeight={700} sx={{ color }}>{label}</Typography></Box>
                        <Grid container spacing={2} alignItems="center">
                          {isWsr ? (
                            <>
                              <Grid item xs={12} md={4}><TextField fullWidth label="Wholesale Sale Rate (WSR) ₹" type="number" value={fd.wholesaleSaleRate} onChange={e => set("wholesaleSaleRate", e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
                              <Grid item xs={12} md={4}><TextField fullWidth label="Total Wholesale Value" value={`₹ ${fd.totalWholesaleValue}`} InputProps={{ readOnly: true }} sx={{ bgcolor: bg }} helperText="WSR × Stocks" /></Grid>
                              <Grid item xs={12} md={4}>{fd.wholesaleSaleRate && fd.mrp && <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: bg, textAlign: "center" }}><Typography variant="caption" color="text.secondary">WSR vs MRP</Typography><Typography fontWeight={700} sx={{ color }}>{fmt((1 - n(fd.wholesaleSaleRate) / n(fd.mrp)) * 100)}% off</Typography></Box>}</Grid>
                            </>
                          ) : (
                            <>
                              {discF && <Grid item xs={12} md={3}><TextField fullWidth label={`${label} Discount %`} type="number" value={fd[discF]} onChange={e => set(discF, e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} inputProps={{ min: 0, max: 100 }} /></Grid>}
                              {rateF && <Grid item xs={12} md={3}><TextField fullWidth label="Sale Rate" value={`₹ ${fd[rateF] || fmt(n(fd.mrp) * (1 - n(fd[discF]) / 100))}`} InputProps={{ readOnly: true }} sx={{ bgcolor: bg }} /></Grid>}
                              {key === "b2b" && <Grid item xs={12} md={3}><TextField fullWidth label="B2B Rate/unit" value={`₹ ${fmt(n(fd.mrp) * (1 - n(fd.b2bDiscount) / 100))}`} InputProps={{ readOnly: true }} sx={{ bgcolor: bg }} /></Grid>}
                              {totalF && <Grid item xs={12} md={3}><TextField fullWidth label="Total Value" value={`₹ ${fd[totalF]}`} InputProps={{ readOnly: true }} sx={{ bgcolor: bg }} /></Grid>}
                              <Grid item xs={12} md={3}><Box sx={{ p: 1.5, borderRadius: 2, bgcolor: bg, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Saving/unit</Typography><Typography fontWeight={700} sx={{ color }}>₹ {fmt(n(fd.mrp) - n(fd[rateF] || fd.mrp))}</Typography></Box></Grid>
                            </>
                          )}
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* 5. GST */}
              <Accordion {...accordion("panel5")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#e0f2f1", width: 32, height: 32 }}><AccountBalanceIcon color="primary" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>GST Details</Typography>
                    {gstRate && <Chip label={`GST ${gstRate}%`} size="small" color="primary" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <GSTSection
                    gstRate={gstRate}
                    onGstRateChange={handleGstRateChange}
                    gstValues={gstValues}
                    gstExpiry={fd.gstDateEffect}
                    onExpiryChange={v => set("gstDateEffect", v)}
                  />
                </AccordionDetails>
              </Accordion>

              {/* 6. Offers */}
              <Accordion {...accordion("panel6")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#fff8e1", width: 32, height: 32 }}><LocalOfferIcon color="warning" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Offers, Schemes & Coupons</Typography>
                    <Chip label={`${fd.offersWithIcon.length} offers · ${coupons.length} coupons`} size="small" color="warning" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={3}>
                    <OffersManager offers={fd.offersWithIcon} onChange={v => set("offersWithIcon", v)} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}><TextField fullWidth label="Scheme I" placeholder="e.g. Buy 2 Get 1 Free" value={fd.scheme1} onChange={e => set("scheme1", e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><LoyaltyIcon /></InputAdornment> }} /></Grid>
                      <Grid item xs={12} md={6}><TextField fullWidth label="Scheme II" placeholder="e.g. Extra 5% on bulk" value={fd.scheme2} onChange={e => set("scheme2", e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><LoyaltyIcon /></InputAdornment> }} /></Grid>
                      <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Additional Offers / Notes" value={fd.additionalOffers} onChange={e => set("additionalOffers", e.target.value)} /></Grid>
                    </Grid>
                    <Divider />
                    <CouponManager coupons={coupons} onChange={setCoupons} />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* 7. Variants, Combos & Specifications */}
              <Accordion {...accordion("panel7")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#fce4ec", width: 32, height: 32 }}><AutoFixHighIcon color="error" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Variants, Combos & Specifications</Typography>
                    <Chip label={`${variants.length} variant · ${combos.length} combo · ${combinations.length} attr-combo · ${specifications.length} spec`} size="small" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={3}>
                    {/* Simple Variants */}
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="subtitle1" fontWeight={700}>Simple Variants (Pack Sizes)</Typography>
                        <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setVariants([...variants, { name: "", price: "", stock: "" }])}>Add</Button>
                      </Box>
                      {variants.map((v, i) => (
                        <Grid container spacing={2} key={i} sx={{ mb: 1 }} alignItems="center">
                          <Grid item xs={4}><TextField fullWidth size="small" label="Pack Name" value={v.name} onChange={e => { const a = [...variants]; a[i].name = e.target.value; setVariants(a); }} /></Grid>
                          <Grid item xs={3}><TextField fullWidth size="small" label="Price" type="number" value={v.price} onChange={e => { const a = [...variants]; a[i].price = e.target.value; setVariants(a); }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
                          <Grid item xs={3}><TextField fullWidth size="small" label="Stock" type="number" value={v.stock} onChange={e => { const a = [...variants]; a[i].stock = e.target.value; setVariants(a); }} /></Grid>
                          <Grid item xs={2}><IconButton color="error" onClick={() => setVariants(variants.filter((_, j) => j !== i))} disabled={variants.length === 1}><DeleteIcon /></IconButton></Grid>
                        </Grid>
                      ))}
                    </Box>
                    <Divider />

                    {/* Product Combo Builder */}
                    <ProductComboBuilder combos={combos} onChange={setCombos} authToken={tokenProp} />
                    <Divider />

                    {/* Attribute Combination Builder */}
                    <CombinationBuilder combinations={combinations} onChange={setCombinations} />
                    <Divider />

                    {/* Specifications */}
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="subtitle1" fontWeight={700}>Specifications</Typography>
                        <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setSpecifications([...specifications, { key: "", value: "" }])}>Add</Button>
                      </Box>
                      {specifications.map((spec, i) => (
                        <Grid container spacing={2} key={i} sx={{ mb: 1 }} alignItems="center">
                          <Grid item xs={5}><TextField fullWidth size="small" label="Property" value={spec.key} onChange={e => { const s = [...specifications]; s[i].key = e.target.value; setSpecifications(s); }} /></Grid>
                          <Grid item xs={6}><TextField fullWidth size="small" label="Value" value={spec.value} onChange={e => { const s = [...specifications]; s[i].value = e.target.value; setSpecifications(s); }} /></Grid>
                          <Grid item xs={1}><IconButton color="error" onClick={() => setSpecifications(specifications.filter((_, j) => j !== i))} disabled={specifications.length === 1}><DeleteIcon /></IconButton></Grid>
                        </Grid>
                      ))}
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* 8. Category */}
              <Accordion {...accordion("panel8")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#e8eaf6", width: 32, height: 32 }}><CategoryIcon color="primary" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Category, Sections & Tags</Typography>
                    {sections.length > 0 && <Chip label={`${sections.length} section(s)`} size="small" color="primary" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={3}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Main Category *</InputLabel>
                          <Select value={selectedMainCat} label="Main Category *" onChange={e => setSelectedMainCat(e.target.value)}>
                            <MenuItem value="" disabled><em>{mainCategories.length === 0 ? "Loading..." : "Select category"}</em></MenuItem>
                            {mainCategories.map((c) => {
  const isSub = subCatIds.has(c._id);
  return (
    <MenuItem
      key={c._id}
      value={c._id}
      sx={isSub ? { pl: 3.5, bgcolor: "#fafafa" } : {}}
    >
      <Box display="flex" alignItems="center" gap={1}>
        {isSub && (
          <Chip
            label="SUB"
            size="small"
            sx={{
              height: 15,
              fontSize: 9,
              fontWeight: 800,
              bgcolor: "#e3f2fd",
              color: "#1565c0",
              borderRadius: "3px",
              "& .MuiChip-label": { px: 0.75, py: 0 },
            }}
          />
        )}
        <Typography
          variant="body2"
          sx={{
            color: isSub ? "text.secondary" : "text.primary",
            fontStyle: isSub ? "italic" : "normal",
          }}
        >
          {isSub ? `↳ ${c.title}` : c.title}
        </Typography>
      </Box>
    </MenuItem>
  );
})}
 
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth disabled={!selectedMainCat || subCatLoading}>
                          <InputLabel>{subCatLoading ? "Loading..." : "Sub Category (optional)"}</InputLabel>
                          <Select value={selectedSubCat} label="Sub Category (optional)" onChange={e => setSelectedSubCat(e.target.value)}>
                            <MenuItem value=""><em>None</em></MenuItem>
                            {subCategories.map(s => <MenuItem key={s._id} value={s._id}>{s.title}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <Divider />
                    <SectionsManager sections={sections} onChange={setSections} />
                    <Box>
   <Box display="flex" alignItems="center" gap={1} mb={1}>
    <Typography variant="subtitle2" fontWeight={700}>
      Home Page Sections
    </Typography>
    {selectedHomeSections.length > 0 && (
      <Chip
        label={`${selectedHomeSections.length} selected`}
        size="small"
        color="secondary"
      />
    )}
  </Box>
  <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: 12 }}>
    Select home page sections where this product should appear.
  </Alert>

  {availableHomeSections.length === 0 ? (
    <Typography variant="caption" color="text.secondary">
      No home sections found — ensure the home sections API is available.
    </Typography>
  ) : (
    <FormControl fullWidth>
      <InputLabel>Home Page Sections</InputLabel>
      <Select
  multiple
  value={selectedHomeSections}
  label="Home Page Sections"
  onChange={(e) => setSelectedHomeSections(e.target.value)}
  renderValue={(selected) => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {selected.map((sKey) => {
        const sec = availableHomeSections.find(
  (s) => (s.key || s.slug || s.title?.toLowerCase().replace(/\s+/g, '-')) === sKey
);
        return (
          <Chip
            key={sKey}
            label={sec?.title || sec?.name || sKey}
            size="small"
            color="secondary"
          />
        );
      })}
    </Box>
  )}
>
  {availableHomeSections.map((s) => {
    // KEY FIX: always use a string key, never _id
    const sKey = s.key || s.slug || s.title?.toLowerCase().replace(/\s+/g, '-');
    const sLabel = s.title || s.name || sKey;
    return (
      <MenuItem key={sKey} value={sKey}>
        <Checkbox checked={selectedHomeSections.includes(sKey)} />
        <Typography variant="body2">{sLabel}</Typography>
      </MenuItem>
    );
  })}
</Select>
    </FormControl>
  )}

  {selectedHomeSections.length > 0 && (
    <Typography variant="caption" color="secondary.main" sx={{ mt: 1, display: "block" }}>
      ✓ Appears on home in:{" "}
      {availableHomeSections
  .filter((s) =>
    selectedHomeSections.includes(
      s.key || s.slug || s.title?.toLowerCase().replace(/\s+/g, '-')
    )
  )
        .map((s) => s.title || s.name)
        .join(", ")}
    </Typography>
  )}
</Box>
<Divider />
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>SEO Tags</Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <TextField fullWidth size="small" placeholder="Type tag and press Enter" value={tagInput} onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key !== "Enter") return; e.preventDefault(); if (!tagInput.trim()) return; set("tags", [...fd.tags, tagInput.trim()]); setTagInput(""); }} />
                        <Button onClick={() => { if (!tagInput.trim()) return; set("tags", [...fd.tags, tagInput.trim()]); setTagInput(""); }} variant="outlined" size="small">Add</Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={1}>{fd.tags.map((tag, i) => <Chip key={i} label={tag} onDelete={() => set("tags", fd.tags.filter((_, j) => j !== i))} size="small" />)}</Box>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* 9. Descriptions */}
              <Accordion {...accordion("panel9")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#e0f7fa", width: 32, height: 32 }}><DescriptionIcon color="info" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Descriptions</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={2}>
                    {[
                      { label: "Product Description (shown in Description tab)", field: "description", rows: 5 },
                      { label: "More Information / Short Description", field: "moreInformation", rows: 4 },
                      { label: "Disclaimer", field: "disclaimer", rows: 3 }
                    ].map(({ label, field, rows }) => (
                      <Box key={field}>
                        <Typography variant="subtitle2" fontWeight={600} mb={1}>{label}</Typography>
                        <TextField fullWidth multiline rows={rows} value={fd[field]} onChange={e => set(field, e.target.value)} placeholder={`Enter ${label}...`} />
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* 10. Author Details & Marketer Info */}
              <Accordion {...accordion("panel10")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#e8f5e9", width: 32, height: 32 }}><PersonIcon color="success" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Author Details & Marketer Info</Typography>
                    {authors.length > 0 && <Chip label={`${authors.length} author(s)`} size="small" color="success" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={3}>
                    <AuthorManager authors={authors} onChange={setAuthors} />
                    <Divider />
                    <Typography variant="subtitle2" fontWeight={700}>Marketer / Manufacturer Details</Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: "Marketer Name", field: "marketerName", md: 6 },
                        { label: "Country of Origin", field: "countryOfOrigin", md: 6 },
                        { label: "Marketer Address", field: "marketerAddress", md: 12 },
                        { label: "Last Updated", field: "lastUpdated", md: 6 }
                      ].map(({ label, field, md }) => (
                        <Grid item xs={12} md={md} key={field}>
                          <TextField fullWidth label={label} value={fd[field]} onChange={e => set(field, e.target.value)} size="small" />
                        </Grid>
                      ))}
                    </Grid>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* 11. Ratings & Reviews */}
              <Accordion {...accordion("panel11")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#fffde7", width: 32, height: 32 }}><StarIcon color="warning" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Ratings & Reviews</Typography>
                    <Rating value={fd.productRating} readOnly size="small" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Overall Product Rating</Typography>
                      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                        <Rating size="large" precision={0.5} value={parseFloat(fd.productRating) || 0} onChange={(_, v) => set("productRating", v ?? 0)} />
                        <TextField size="small" type="number" label="Manual Rating (0-5)" value={fd.productRating} onChange={e => set("productRating", Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))} inputProps={{ min: 0, max: 5, step: 0.1 }} sx={{ width: 160 }} InputProps={{ endAdornment: <InputAdornment position="end">/ 5</InputAdornment> }} />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>Top Review from India</Typography>
                      <TextField fullWidth multiline rows={3} value={fd.topReviewFromIndia} onChange={e => set("topReviewFromIndia", e.target.value)} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Doctor Feedbacks</Typography>
                      <Box display="flex" gap={1} mb={1.5}>
                        <TextField fullWidth size="small" multiline rows={2} placeholder="Doctor feedback..." value={doctorInput} onChange={e => setDoctorInput(e.target.value)} />
                        <Button variant="contained" size="small" onClick={() => { if (!doctorInput.trim()) return; set("doctorFeedbacks", [...fd.doctorFeedbacks, { id: Date.now(), feedback: doctorInput.trim(), date: new Date().toLocaleDateString(), doctor: "Dr. Anonymous" }]); setDoctorInput(""); }} sx={{ alignSelf: "flex-end" }}>Add</Button>
                      </Box>
                    </Box>
                    <ReviewManagement reviews={reviews} onChange={setReviews} />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* 12. Status & Prescription */}
              <Accordion {...accordion("panel12")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: fd.isOTC ? "#e8f5e9" : "#ffebee", width: 32, height: 32 }}><WarningIcon color={fd.isOTC ? "success" : "error"} sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Status & Prescription</Typography>
                    <Chip label={fd.currentStatus1} color={fd.currentStatus1 === "active" ? "success" : "default"} size="small" />
                    <Chip label={fd.isOTC ? "OTC" : "Rx Required"} color={fd.isOTC ? "success" : "error"} size="small" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={3}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Visibility Status</InputLabel>
                          <Select value={fd.currentStatus1} label="Visibility Status" onChange={e => set("currentStatus1", e.target.value)}>
                            <MenuItem value="active"><Chip label="Active — visible to users" color="success" size="small" /></MenuItem>
                            <MenuItem value="inactive"><Chip label="Inactive — hidden" size="small" /></MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Display Mode</InputLabel>
                          <Select value={fd.currentStatus2} label="Display Mode" onChange={e => set("currentStatus2", e.target.value)}>
                            <MenuItem value="appear">Appear on storefront</MenuItem>
                            <MenuItem value="disappear">Disappear from storefront</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, border: `2px solid ${fd.isOTC ? "#4caf50" : "#f44336"}` }}>
                      <RadioGroup row value={String(fd.isOTC)} onChange={e => set("isOTC", e.target.value === "true")}>
                        <FormControlLabel value="true" control={<Radio color="success" />} label={<Box><Typography fontWeight={700} color="success.main">OTC / Over-the-Counter</Typography><Typography variant="caption" color="text.secondary">No prescription required</Typography></Box>} sx={{ mr: 4 }} />
                        <FormControlLabel value="false" control={<Radio color="error" />} label={<Box><Typography fontWeight={700} color="error.main">Rx — Prescription Required</Typography><Typography variant="caption" color="text.secondary">Customer must upload prescription</Typography></Box>} />
                      </RadioGroup>
                    </Paper>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* 13. Recommendations & Certifications — NEW */}
              <Accordion {...accordion("panel13")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#e8f5e9", width: 32, height: 32 }}><VerifiedIcon color="success" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Recommendations & Certifications</Typography>
                    <Chip label={`${recommendations.length} rec · ${certifications.length} cert`} size="small" color="success" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <RecommendationsManager
                    recommendations={recommendations}
                    certifications={certifications}
                    onRecommendChange={setRecommendations}
                    onCertChange={setCertifications}
                  />
                </AccordionDetails>
              </Accordion>

              {/* QR Code Section */}
{fd.brandName && productId && (
  <Box sx={{ mb: 3 }}>
    <ProductQRCode
      product={{
        _id: productId,
        brandName: fd.brandName,
        manufacturer: fd.manufacturer,
        mrp: fd.mrp,
        expiryDate: fd.expiryDate,
        batchNumber: fd.batchNumber,
        gst_igst: gstRate,
      }}
    />
  </Box>
)}

              {/* Submit */}
              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap" sx={{ mt: 3 }}>
                <Button type="submit" variant="contained" size="large"
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={submitting} sx={{ px: 6, py: 1.5, fontSize: "1rem", fontWeight: 700, borderRadius: 3, background: "linear-gradient(135deg,#1565c0,#0d47a1)" }}>
                  {submitting ? "Saving…" : "Update Product"}
                </Button>
                <Button variant="outlined" size="large" startIcon={<RefreshIcon />} sx={{ px: 4, py: 1.5, borderRadius: 3 }}
                  onClick={() => window.confirm("Reset all form data?") && window.location.reload()}>
                  Reset Form
                </Button>
              </Box>
            </form>
          </Grid>

          {/* Right sidebar */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: "sticky", top: 20 }}>
              <Card sx={{ mb: 2, borderRadius: 3, background: "linear-gradient(135deg,#1565c0,#0d47a1)", color: "white" }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, opacity: .9 }}>📊 Live Pricing Summary</Typography>
                  <Grid container spacing={1.5}>
                    {[
                      { label: "MRP", value: `₹ ${fd.mrp || "0"}`, color: "white" },
                      { label: "AMP", value: `₹ ${fd.amp || "0"}`, color: "#90caf9" },
                      { label: "B2C (PTR)", value: `₹ ${fd.saleRatePTR}`, color: "#a5d6a7" },
                      { label: "B2B Rate", value: `₹ ${fmt(n(fd.mrp) * (1 - n(fd.b2bDiscount) / 100))}`, color: "#ce93d8" },
                      { label: "Wholesale", value: `₹ ${fd.wholesaleSaleRate || "—"}`, color: "#ffcc80" },
                      { label: "Hospital", value: `₹ ${fd.hospitalSaleRate}`, color: "#80cbc4" },
                      { label: "Pharmacy", value: `₹ ${fd.pharmacySaleRate}`, color: "#a5d6a7" },
                      { label: "Vendor", value: `₹ ${fd.vendorRate}`, color: "#f48fb1" },
                      { label: "Franchise", value: `₹ ${fd.franchiseRate}`, color: "#ffcc80" },
                      { label: "Manufacturer", value: `₹ ${fd.manufacturerRate}`, color: "#b0bec5" },
                      { label: "Total Stocks", value: fd.totalStocks || "0", color: "white" },
                      { label: "Coupons", value: `${coupons.length} active`, color: "#f48fb1" },
                      { label: "Combos", value: `${combos.length} bundle(s)`, color: "#a5d6a7" },
                      { label: "Recs", value: `${recommendations.length} rec · ${certifications.length} cert`, color: "#90caf9" },
                    ].map(item => (
                      <Grid item xs={6} key={item.label}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(255,255,255,.1)" }}>
                          <Typography variant="caption" sx={{ opacity: .75, display: "block" }}>{item.label}</Typography>
                          <Typography fontWeight={700} sx={{ color: item.color, fontSize: ".9rem" }}>{item.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  {margin !== null && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: n(margin) >= 20 ? "rgba(76,175,80,.3)" : "rgba(244,67,54,.3)", textAlign: "center" }}>
                      <Typography variant="caption" sx={{ opacity: .8 }}>Gross Margin (B2C)</Typography>
                      <Typography variant="h4" fontWeight={700}>{margin}%</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>📝 Completeness</Typography>
                  {(() => {
                    const checks = [
                      { label: "Manufacturer", done: !!fd.manufacturer },
                      { label: "Brand Name", done: !!fd.brandName },
                      { label: "Category", done: !!selectedMainCat },
                      { label: "MRP & AMP", done: !!(fd.mrp && fd.amp) },
                      { label: "Stocks & HSN", done: !!(fd.totalStocks && fd.hsn) },
                      { label: "GST Rate", done: !!gstRate },
                      { label: "Images", done: existingImageUrls.length > 0 },
                      { label: "Description", done: !!fd.description },
                      { label: "B2C Discount", done: !!fd.b2cDiscount },
                      { label: "Author Details", done: authors.length > 0 },
                      { label: "Coupons", done: coupons.length > 0 },
                      { label: "Certifications", done: certifications.length > 0 },
                    ];
                    const done = checks.filter(c => c.done).length;
                    const pct = Math.round(done / checks.length * 100);
                    return (
                      <>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="caption" color="text.secondary">{done}/{checks.length} complete</Typography>
                          <Typography variant="caption" fontWeight={700} color={pct === 100 ? "success.main" : "primary.main"}>{pct}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct} sx={{ borderRadius: 4, height: 8, mb: 2 }} color={pct === 100 ? "success" : "primary"} />
                        <Stack spacing={0.5}>
                          {checks.map(c => (
                            <Box key={c.label} display="flex" alignItems="center" gap={1}>
                              {c.done ? <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} /> : <Box sx={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid #ccc" }} />}
                              <Typography variant="caption" color={c.done ? "text.primary" : "text.secondary"}>{c.label}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
      <Fab color="primary" size="medium" sx={{ position: "fixed", bottom: 24, right: 24 }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUpwardIcon /></Fab>
    </Box>
  );
}