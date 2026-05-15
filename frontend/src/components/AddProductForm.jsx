// PharmaProductForm.jsx  — FULL UPDATED FILE (all patches applied)

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box, TextField, Button, Typography, Grid, MenuItem, Select,
  FormControl, InputLabel, Chip, IconButton, Paper, Card, CardContent,
  Container, InputAdornment, Avatar, Stack, Switch, Divider, Alert,
  FormControlLabel, RadioGroup, Radio, Accordion, AccordionSummary,
  AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, CircularProgress, Rating, Checkbox, Fab,
} from "@mui/material";
import axios from "axios";
import {
  Delete as DeleteIcon, Add as AddIcon, CloudUpload as CloudUploadIcon,
  Save as SaveIcon, Info as InfoIcon, CurrencyRupee as CurrencyRupeeIcon,
  LocalOffer as LocalOfferIcon, Category as CategoryIcon,
  AccountTree as AccountTreeIcon, Storefront as StorefrontIcon,
  LocalHospital as LocalHospitalIcon, Warning as WarningIcon,
  FlashOn as FlashOnIcon, Edit as EditIcon, AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon, Star as StarIcon, Inventory as InventoryIcon,
  CalendarToday as CalendarTodayIcon, Factory as FactoryIcon,
  Percent as PercentIcon, AccountBalance as AccountBalanceIcon,
  Loyalty as LoyaltyIcon, Description as DescriptionIcon,
  AutoFixHigh as AutoFixHighIcon, CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon, Calculate as CalculateIcon,
  PhotoCamera as PhotoCameraIcon, Videocam as VideocamIcon,
  Store as StoreIcon, ArrowUpward as ArrowUpwardIcon, QrCode2,
  Person as PersonIcon, Inventory2 as Inventory2Icon, Search as SearchIcon,
  Close as CloseIcon, SwapHoriz as SwapIcon, Verified as VerifiedIcon,
  Recommend as RecommendIcon, Shield as ShieldIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import ProductQRCode from "../components/ProductQRCode";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;
const getManagedProductToken = (preferredTokenKey = "adminToken") =>
  localStorage.getItem(preferredTokenKey) ||
  localStorage.getItem("adminToken") ||
  localStorage.getItem("franchiseToken") ||
  localStorage.getItem("bulkManufacturingToken") ||
  localStorage.getItem("vendorToken") || "";
const defaultGetProductPath    = (id) => `/api/admin/product/${id}`;
const defaultUpdateProductPath = (id) => `/api/products/update/${id}`;

const n   = (v) => parseFloat(v) || 0;
const fmt = (v) => (isNaN(v) ? "0.00" : Number(v).toFixed(2));

//  Toast 
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, severity = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, severity }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return { toasts, show };
};

//  File Upload Area 
const FileUploadArea = ({ title, accept, multiple, onFilesSelect, icon, type = "image" }) => {
  const ref = useRef(null);
  const [previews, setPreviews] = useState([]);
  const processFiles = (files) => {
    const arr = Array.from(files);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
    onFilesSelect?.(arr);
  };
  return (
    <Paper variant="outlined" sx={{
      p: 3, textAlign: "center", border: "2px dashed #90caf9", borderRadius: 2,
      cursor: "pointer", bgcolor: "#f8fbff",
      "&:hover": { borderColor: "primary.main", bgcolor: "#e3f2fd" }, transition: "all .2s",
    }}
      onClick={() => ref.current.click()}
      onDrop={(e) => { e.preventDefault(); processFiles(e.dataTransfer.files); }}
      onDragOver={(e) => e.preventDefault()}
    >
      {icon}
      <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5, fontWeight: 600 }}>{title}</Typography>
      <Typography variant="caption" color="text.secondary">
        {type === "image" ? "Drag & drop • 800×800px recommended" : "Upload video file"}
      </Typography>
      <input type="file" ref={ref} hidden accept={accept} multiple={multiple}
        onChange={(e) => processFiles(e.target.files)} />
      <Box sx={{ mt: 1.5 }}>
        <Button variant="outlined" size="small" startIcon={<CloudUploadIcon />}
          onClick={(e) => { e.stopPropagation(); ref.current.click(); }}>Browse Files</Button>
      </Box>
      {previews.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2, justifyContent: "center" }}>
          {previews.map((url, i) =>
            type === "image" ? (
              <Box key={i} component="img" src={url}
                sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 1, border: "1px solid #ddd" }} />
            ) : (
              <Box key={i} display="flex" alignItems="center" gap={0.5}>
                <VideocamIcon color="primary" />
                <Typography variant="caption">Video ready</Typography>
              </Box>
            )
          )}
        </Box>
      )}
    </Paper>
  );
};

//  GST Section 
const GSTSection = ({ gstRate, onGstRateChange, gstValues, gstExpiry, onExpiryChange }) => (
  <Stack spacing={2}>
    <Alert severity="info" icon={<CalculateIcon />} sx={{ py: 0.5 }}>
      Enter total GST % — CGST &amp; SGST auto-split as half each; IGST = full rate.
    </Alert>
    <Grid container spacing={2}>
      {[
        { label: "Total GST %", value: gstRate, onChange: (e) => onGstRateChange(e.target.value), readOnly: false },
        { label: "IGST %", value: gstValues.igst, readOnly: true },
        { label: "CGST %", value: gstValues.cgst, readOnly: true },
        { label: "SGST %", value: gstValues.sgst, readOnly: true },
      ].map((f, i) => (
        <Grid item xs={6} sm={3} key={i}>
          <TextField fullWidth label={f.label} size="small" type="number" value={f.value}
            onChange={f.onChange}
            InputProps={{ readOnly: f.readOnly, endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            sx={f.readOnly ? { bgcolor: "#f0f7ff" } : {}} />
        </Grid>
      ))}
      <Grid item xs={12} sm={6}>
        <TextField fullWidth size="small" type="date" label="GST Expiry Date"
          InputLabelProps={{ shrink: true }} value={gstExpiry}
          onChange={(e) => onExpiryChange(e.target.value)} />
      </Grid>
    </Grid>
  </Stack>
);

//  Sections Manager 
const ALL_SECTIONS = [
  "Featured Products","Best Sellers","New Arrivals","Flash Sale","Top Rated",
  "Recommended","Doctor's Choice","Ayurvedic","OTC Medicines","Diabetic Care",
  "Heart Care","Women's Health","Baby Care","Vitamins & Supplements","Pain Relief",
  "Skin Care","Nutritional","Immunity Boosters",
];
const SectionsManager = ({ sections, onChange }) => (
  <Box>
    <Typography variant="subtitle2" fontWeight={700} mb={1}>Product Sections / Collections</Typography>
    <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: 12 }}>
      Products with the same section tag appear together in "Customers Also Viewed".
    </Alert>
    <Box display="flex" flexWrap="wrap" gap={1}>
      {ALL_SECTIONS.map((s) => {
        const sel = sections?.includes(s);
        return (
          <Chip key={s} label={s} size="small" color={sel ? "primary" : "default"}
            variant={sel ? "filled" : "outlined"}
            onClick={() => onChange(sel ? sections.filter((x) => x !== s) : [...(sections || []), s])}
            sx={{ cursor: "pointer" }} />
        );
      })}
    </Box>
    {sections?.length > 0 && (
      <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
        ✓ Appears in: {sections.join(", ")}
      </Typography>
    )}
  </Box>
);

//  Per-Role Offers 
const ROLES_LIST = [
  { value: "all", label: "All Users" }, { value: "customer", label: "Customer (B2C)" },
  { value: "b2b", label: "B2B" }, { value: "hospital", label: "Hospital" },
  { value: "pharmacy", label: "Pharmacy" }, { value: "wholesale", label: "Wholesale" },
  { value: "vendor", label: "Vendor" }, { value: "franchise", label: "Franchise" },
  { value: "manufacturer", label: "Manufacturer" },
];
const OffersManager = ({ offers, onChange }) => {
  const [text, setText] = useState("");
  const [flashing, setFlashing] = useState(false);
  const [userType, setUserType] = useState("all");
  const add = () => {
    if (!text.trim()) return;
    onChange([...offers, { text: text.trim(), flashing, userType }]);
    setText(""); setFlashing(false); setUserType("all");
  };
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} mb={1}>Offers with Icons (per user role)</Typography>
      <Box display="flex" gap={1} flexWrap="wrap" alignItems="flex-end" mb={1.5}>
        <TextField size="small" label="Offer text" value={text}
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
          sx={{ flex: 1, minWidth: 200 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>User Type</InputLabel>
          <Select value={userType} label="User Type" onChange={(e) => setUserType(e.target.value)}>
            {ROLES_LIST.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch checked={flashing} onChange={(e) => setFlashing(e.target.checked)} size="small" color="warning" />}
          label={<Typography variant="caption">Flash</Typography>} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={add}>Add</Button>
      </Box>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {offers.map((o, i) => (
          <Chip key={i}
            label={`${o.text}${o.userType !== "all" ? ` (${o.userType})` : ""}`}
            onDelete={() => onChange(offers.filter((_, j) => j !== i))}
            icon={o.flashing ? <FlashOnIcon /> : <LocalOfferIcon />}
            color={o.flashing ? "warning" : "default"} />
        ))}
      </Box>
    </Box>
  );
};

//  Coupon Manager 
const CouponManager = ({ coupons, onChange }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", type: "percent", discount: "", minOrder: "", expiryDate: "", usageLimit: "", roles: [] });
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    setForm((f) => ({ ...f, code: Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") }));
  };
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
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                {["Code","Type","Discount","Min Order","Roles","Expiry","Actions"].map((h) => (
                  <TableCell key={h}><b>{h}</b></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.map((c, i) => (
                <TableRow key={i} hover>
                  <TableCell><Chip label={c.code} size="small" color="primary" variant="outlined" /></TableCell>
                  <TableCell>{c.type === "percent" ? "%" : "₹ Flat"}</TableCell>
                  <TableCell>{c.type === "percent" ? `${c.discount}%` : `₹${c.discount}`}</TableCell>
                  <TableCell>{c.minOrder ? `₹${c.minOrder}` : "—"}</TableCell>
                  <TableCell>
                    {c.roles?.length
                      ? c.roles.map((r) => <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />)
                      : <Chip label="All Users" size="small" color="success" />}
                  </TableCell>
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
              <TextField label="Code *" fullWidth size="small" value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
              <IconButton onClick={generateCode} title="Auto-generate"><QrCode2 /></IconButton>
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>Discount Type</InputLabel>
              <Select value={form.type} label="Discount Type" onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <MenuItem value="percent">Percentage (%)</MenuItem>
                <MenuItem value="flat">Flat (₹)</MenuItem>
              </Select>
            </FormControl>
            <TextField label={`Discount ${form.type === "percent" ? "%" : "₹"} *`} fullWidth size="small" type="number"
              value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} />
            <TextField label="Minimum Order (₹)" fullWidth size="small" type="number"
              value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))} />
            <TextField label="Usage Limit (blank = unlimited)" fullWidth size="small" type="number"
              value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
            <TextField label="Expiry Date" fullWidth size="small" type="date"
              InputLabelProps={{ shrink: true }} value={form.expiryDate}
              onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
            <Box>
              <Typography variant="caption" color="text.secondary" mb={1} display="block">
                Applicable Roles — leave empty to apply to ALL users
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.75}>
                {ROLES_LIST.filter((r) => r.value !== "all").map((role) => (
                  <Chip key={role.value} label={role.label} size="small"
                    color={form.roles?.includes(role.value) ? "primary" : "default"}
                    variant={form.roles?.includes(role.value) ? "filled" : "outlined"}
                    onClick={() => {
                      const nr = form.roles?.includes(role.value)
                        ? form.roles.filter((r) => r !== role.value)
                        : [...(form.roles || []), role.value];
                      setForm((f) => ({ ...f, roles: nr }));
                    }}
                    sx={{ cursor: "pointer" }} />
                ))}
              </Box>
              {form.roles?.length === 0 && (
                <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: "block" }}>
                  ✓ This coupon will be visible to all user types
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} variant="contained">{editing !== null ? "Update" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ProductPicker 
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function ProductPicker({ onSelect, exclude = [], label = "Search product", authTokenKey = "adminToken", searchEndpoint = "/api/admin/products/search" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const dq = useDebounce(query);
  useEffect(() => {
    if (!dq.trim()) { setResults([]); return; }
    setLoading(true);
    const token = getManagedProductToken(authTokenKey);
    fetch(`${API_BASE}${searchEndpoint}?q=${encodeURIComponent(dq)}&limit=8`, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then((r) => r.json())
      .then((d) => setResults((d.products || d.data || []).filter((p) => !exclude.includes(p._id))))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);
  return (
    <Box>
      <TextField size="small" fullWidth placeholder={label} value={query}
        onChange={(e) => setQuery(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start">{loading ? <CircularProgress size={14} /> : <SearchIcon sx={{ fontSize: 18, color: "#9ca3af" }} />}</InputAdornment>,
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => { setQuery(""); setResults([]); }}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
            </InputAdornment>
          ) : null,
        }} />
      {results.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 0.5, maxHeight: 240, overflowY: "auto", borderRadius: 2, zIndex: 10, position: "relative" }}>
          {results.map((p) => (
            <Box key={p._id} onClick={() => { onSelect(p); setQuery(""); setResults([]); }}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25, cursor: "pointer",
                    borderBottom: "1px solid #f3f4f6", "&:hover": { bgcolor: "#f0f7ff" }, "&:last-child": { borderBottom: "none" } }}>
              <Avatar src={p.images?.[0]?.url} variant="rounded" sx={{ width: 36, height: 36, bgcolor: "#e3f2fd", flexShrink: 0 }}>
                <Inventory2Icon sx={{ color: "#1565c0", fontSize: 20 }} />
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={700} noWrap>{p.brandName}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {p.genericCompositions || p.manufacturer || ""} · MRP ₹{p.mrp || "—"}
                </Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 16, color: "#1565c0", opacity: 0.4 }} />
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}

function ComboDialog({ open, onClose, onSave, initial, currentProduct, authTokenKey = "adminToken", productSearchPath = "/api/admin/products/search" }) {
  const EMPTY = { id: "", name: "", products: [], comboPrice: "", active: true };
  const [form, setForm] = useState(EMPTY);
  useEffect(() => {
    if (open) {
      if (initial) { setForm({ ...EMPTY, ...initial }); }
      else {
        const prefilled = currentProduct ? [{ _id: currentProduct._id, brandName: currentProduct.brandName, mrp: currentProduct.mrp, images: currentProduct.images || [] }] : [];
        setForm({ ...EMPTY, id: String(Date.now()), products: prefilled });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const removeProduct = (idx) => setF("products", form.products.filter((_, i) => i !== idx));
  const addProduct = (p) => {
    if (form.products.length >= 2) return;
    if (form.products.some((x) => x._id === p._id)) return;
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
          <TextField label="Combo Name (optional)" size="small" fullWidth value={form.name}
            onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Immunity Starter Pack…" />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Select 2 Products *</Typography>
            <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: 12 }}>
              {currentProduct ? `"${currentProduct.brandName}" is pre-filled as Product 1. Search for Product 2.` : "Search and pick exactly 2 products."}
            </Alert>
            <Stack spacing={1.5}>
              {form.products.map((p, i) => (
                <Paper key={p._id} variant="outlined" sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 2, borderColor: i === 0 ? "#bfdbfe" : "#bbf7d0", bgcolor: i === 0 ? "#f0f7ff" : "#f0fdf4" }}>
                  <Avatar src={p.images?.[0]?.url} variant="rounded" sx={{ width: 40, height: 40, flexShrink: 0 }}><Inventory2Icon /></Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={700} noWrap>{p.brandName}</Typography>
                    <Typography variant="caption" color="text.secondary">MRP ₹{p.mrp || "—"}</Typography>
                  </Box>
                  <Chip label={i === 0 ? "Product 1 (Current)" : "Product 2"} size="small" color={i === 0 ? "primary" : "success"} />
                  {!(i === 0 && currentProduct && String(p._id) === String(currentProduct._id)) && (
                    <IconButton size="small" color="error" onClick={() => removeProduct(i)}><CloseIcon fontSize="small" /></IconButton>
                  )}
                </Paper>
              ))}
              {form.products.length < 2 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                    {form.products.length === 0 ? "Add Product 1" : "Search for Product 2 to pair with this product"}
                  </Typography>
                  <ProductPicker onSelect={addProduct} exclude={form.products.map((p) => p._id)}
                    label={`Search for product ${form.products.length + 1}…`}
                    authTokenKey={authTokenKey} searchEndpoint={productSearchPath} />
                </Box>
              )}
            </Stack>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Combo Pricing *</Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField label="Individual Total (MRP)" size="small"
                value={totalMrp > 0 ? `₹ ${totalMrp.toFixed(2)}` : "—"} InputProps={{ readOnly: true }}
                sx={{ bgcolor: "#f9fafb", flex: 1, minWidth: 140 }} />
              <TextField label="Combo Price *" size="small" type="number" value={form.comboPrice}
                onChange={(e) => setF("comboPrice", e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                sx={{ flex: 1, minWidth: 140 }} />
            </Box>
            {discPct > 0 && (
              <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2" color="#15803d" fontWeight={600}>Customer saves ₹{saving.toFixed(2)}</Typography>
                <Chip label={`${discPct}% off`} color="success" size="small" />
              </Box>
            )}
            {comboPrice > 0 && comboPrice >= totalMrp && totalMrp > 0 && (
              <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: 12 }}>Combo price should be less than individual total.</Alert>
            )}
          </Box>
          <FormControlLabel
            control={<Switch checked={form.active !== false} onChange={(e) => setF("active", e.target.checked)} color="success" />}
            label={<Typography variant="body2" fontWeight={600}>{form.active !== false ? "Active — visible on product pages" : "Inactive — hidden from customers"}</Typography>} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => canSave && onSave(form)} variant="contained" disabled={!canSave}
          startIcon={<CheckCircleIcon />} sx={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
          {initial ? "Update Combo" : "Create Combo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ProductComboBuilder({ combos = [], onChange, currentProduct, authTokenKey = "adminToken", productSearchPath = "/api/admin/products/search" }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (combo) => { setEditing(combo); setDialogOpen(true); };
  const handleSave = (form) => {
    if (editing) onChange(combos.map((c) => (c.id === form.id ? form : c)));
    else onChange([...combos, form]);
    setDialogOpen(false);
  };
  const handleDelete = (id) => {
    if (!window.confirm("Remove this combo?")) return;
    onChange(combos.filter((c) => c.id !== id));
  };
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Product Combos / Bundles</Typography>
          <Typography variant="caption" color="text.secondary">Pick any 2 products and set a discounted combo price. Shows on both product pages as "Frequently Bought Together".</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}
          sx={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", flexShrink: 0, ml: 2 }}>+ Create Combo</Button>
      </Box>
      <Alert severity="info" sx={{ py: 0.5, mb: 2, fontSize: 12 }}>
        Each combo links exactly <strong>2 products</strong>. It will appear on <em>both</em> product detail pages automatically.
        {currentProduct && <strong> "{currentProduct.brandName}" will be auto-added as Product 1.</strong>}
      </Alert>
      {combos.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2, borderStyle: "dashed", bgcolor: "#f9fafb" }}>
          <Inventory2Icon sx={{ fontSize: 40, color: "#d1d5db", mb: 1 }} />
          <Typography variant="body2" color="text.secondary" fontWeight={600}>No combos yet</Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Create your first product bundle to boost average order value.</Typography>
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openAdd}>Create First Combo</Button>
        </Paper>
      ) : (
        combos.map((combo) => {
          const p1 = combo.products?.[0]; const p2 = combo.products?.[1];
          const totalMrp = (parseFloat(p1?.mrp) || 0) + (parseFloat(p2?.mrp) || 0);
          const cp = parseFloat(combo.comboPrice) || 0;
          const saving = totalMrp - cp;
          const discPct = totalMrp > 0 ? Math.round((saving / totalMrp) * 100) : 0;
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
      <ComboDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave}
        initial={editing} currentProduct={currentProduct} authTokenKey={authTokenKey} productSearchPath={productSearchPath} />
    </Box>
  );
}

// ── Recommendations & Certifications Manager ──────────────────────────────────
function RecommendationsManager({ recommendations, certifications, onRecommendChange, onCertChange }) {
  const recImgRef  = useRef(null);
  const certImgRef = useRef(null);
  const [recForm,  setRecForm]  = useState({ label: "", description: "", imageFile: null, imagePreview: "" });
  const [certForm, setCertForm] = useState({ label: "", issuedBy: "", year: "", imageFile: null, imagePreview: "" });

  const toBase64 = (file) => new Promise((res, rej) => {
    if (!file) { res(null); return; }
    if (typeof file === "string") { res(file); return; }
    if (file.url) { res({ url: file.url, public_id: file.public_id || file.publicId || "" }); return; }
    if (!(file instanceof Blob)) { res(file); return; }
    const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result); r.onerror = rej;
  });

  const handleRecImg  = async (e) => { const file = e.target.files?.[0]; if (!file) return; const b64 = await toBase64(file); setRecForm( (f) => ({ ...f, imageFile: file, imagePreview: b64 })); };
  const handleCertImg = async (e) => { const file = e.target.files?.[0]; if (!file) return; const b64 = await toBase64(file); setCertForm((f) => ({ ...f, imageFile: file, imagePreview: b64 })); };

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
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <RecommendIcon color="success" />
          <Typography variant="subtitle1" fontWeight={700}>Doctor / Expert Recommendations</Typography>
          <Chip label={`${recommendations.length} added`} size="small" color="success" />
        </Box>
        <Alert severity="info" sx={{ py: 0.5, mb: 2, fontSize: 12 }}>Add doctor or expert recommendations with a photo. These appear on the product detail page as trust signals.</Alert>
        {recommendations.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={1.5} mb={2}>
            {recommendations.map((rec, i) => (
              <Paper key={rec.id || i} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5, minWidth: 220, maxWidth: 300 }}>
                {rec.image && (rec.image.startsWith("data:") || rec.image.startsWith("http")) ? (
                  <Box component="img" src={rec.image} sx={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #e8f5e9", flexShrink: 0 }} onError={(e) => { e.target.style.display = "none"; }} />
                ) : <Avatar sx={{ width: 48, height: 48, bgcolor: "#e8f5e9" }}><RecommendIcon color="success" /></Avatar>}
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={700} noWrap>{rec.label}</Typography>
                  {rec.description && <Typography variant="caption" color="text.secondary" noWrap>{rec.description}</Typography>}
                </Box>
                <IconButton size="small" color="error" onClick={() => onRecommendChange(recommendations.filter((_, j) => j !== i))}><DeleteIcon fontSize="small" /></IconButton>
              </Paper>
            ))}
          </Box>
        )}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#f9fafb" }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Add Recommendation</Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                {recForm.imagePreview ? <Box component="img" src={recForm.imagePreview} sx={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid #4caf50" }} />
                  : <Avatar sx={{ width: 64, height: 64, bgcolor: "#e8f5e9", cursor: "pointer" }} onClick={() => recImgRef.current?.click()}><PhotoCameraIcon color="success" /></Avatar>}
                <input type="file" ref={recImgRef} hidden accept="image/*" onChange={handleRecImg} />
                <Button size="small" variant="outlined" color="success" onClick={() => recImgRef.current?.click()} sx={{ fontSize: 10 }}>{recForm.imagePreview ? "Change Photo" : "Upload Photo"}</Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Stack spacing={1.5}>
                <TextField size="small" fullWidth label="Name / Title *" placeholder="e.g. Dr. Anjali Sharma, MBBS" value={recForm.label} onChange={(e) => setRecForm((f) => ({ ...f, label: e.target.value }))} />
                <TextField size="small" fullWidth label="Description (optional)" placeholder="e.g. Senior Cardiologist, AIIMS Delhi" value={recForm.description} onChange={(e) => setRecForm((f) => ({ ...f, description: e.target.value }))} />
                <Button variant="contained" color="success" size="small" startIcon={<AddIcon />} onClick={addRec} disabled={!recForm.label.trim()} sx={{ alignSelf: "flex-start" }}>Add Recommendation</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      <Divider />
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <VerifiedIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>Certifications &amp; Quality Badges</Typography>
          <Chip label={`${certifications.length} added`} size="small" color="primary" />
        </Box>
        <Alert severity="info" sx={{ py: 0.5, mb: 2, fontSize: 12 }}>Add certifications like ISO, FSSAI, GMP, CDSCO, Ayush etc. with their logo/badge image.</Alert>
        {certifications.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={1.5} mb={2}>
            {certifications.map((cert, i) => (
              <Paper key={cert.id || i} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5, minWidth: 200, maxWidth: 280 }}>
                {cert.image && (cert.image.startsWith("data:") || cert.image.startsWith("http")) ? (
                  <Box component="img" src={cert.image} sx={{ width: 48, height: 48, objectFit: "contain", border: "1px solid #e3f2fd", borderRadius: 1, flexShrink: 0, bgcolor: "white", p: 0.5 }} onError={(e) => { e.target.style.display = "none"; }} />
                ) : <Avatar sx={{ width: 48, height: 48, bgcolor: "#e3f2fd" }}><VerifiedIcon color="primary" /></Avatar>}
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
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#f9fafb" }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Add Certification</Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                {certForm.imagePreview ? <Box component="img" src={certForm.imagePreview} sx={{ width: 64, height: 64, objectFit: "contain", border: "2px solid #1565c0", borderRadius: 1, bgcolor: "white", p: 0.5 }} />
                  : <Avatar sx={{ width: 64, height: 64, bgcolor: "#e3f2fd", cursor: "pointer" }} onClick={() => certImgRef.current?.click()}><PhotoCameraIcon color="primary" /></Avatar>}
                <input type="file" ref={certImgRef} hidden accept="image/*" onChange={handleCertImg} />
                <Button size="small" variant="outlined" color="primary" onClick={() => certImgRef.current?.click()} sx={{ fontSize: 10 }}>{certForm.imagePreview ? "Change Badge" : "Upload Badge"}</Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Stack spacing={1.5}>
                <TextField size="small" fullWidth label="Certification Name *" placeholder="e.g. ISO 9001:2015, FSSAI, GMP Certified" value={certForm.label} onChange={(e) => setCertForm((f) => ({ ...f, label: e.target.value }))} />
                <Box display="flex" gap={1.5}>
                  <TextField size="small" fullWidth label="Issued By" placeholder="e.g. Bureau of Indian Standards" value={certForm.issuedBy} onChange={(e) => setCertForm((f) => ({ ...f, issuedBy: e.target.value }))} />
                  <TextField size="small" sx={{ width: 120 }} label="Year" placeholder="2023" value={certForm.year} onChange={(e) => setCertForm((f) => ({ ...f, year: e.target.value }))} />
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

// ── CombinationBuilder 
const CombinationBuilder = ({ combinations, onChange }) => {
  const [attrs, setAttrs] = useState([]);
  const [attrName, setAttrName] = useState("");
  const [attrVals, setAttrVals] = useState("");

  useEffect(() => {
    if (combinations?.length > 0 && attrs.length === 0) {
      const firstCombo = combinations[0];
      if (firstCombo?.attributes) {
        const reconstructed = Object.entries(firstCombo.attributes).map(([name]) => ({
          name,
          values: [...new Set(combinations.map((c) => c.attributes?.[name]).filter(Boolean))],
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
      for (const combo of result) for (const val of attr.values) tmp.push({ ...combo, [attr.name]: val });
      result = tmp;
    }
    onChange(result.map((combo) => {
      const existing = combinations?.find((c) => newAttrs.every((a) => (c.attributes?.[a.name] || c[a.name]) === combo[a.name]));
      return { attributes: combo, price: existing?.price || "", stock: existing?.stock || "", sku: existing?.sku || "", image: existing?.image || null };
    }));
  };

  const addAttr = () => {
    if (!attrName.trim() || !attrVals.trim()) return;
    const vals = attrVals.split(",").map((v) => v.trim()).filter(Boolean);
    const existingIdx = attrs.findIndex((a) => a.name.toLowerCase() === attrName.trim().toLowerCase());
    let newAttrs;
    if (existingIdx >= 0) newAttrs = attrs.map((a, i) => i === existingIdx ? { ...a, values: [...new Set([...a.values, ...vals])] } : a);
    else newAttrs = [...attrs, { name: attrName.trim(), values: vals }];
    setAttrs(newAttrs); setAttrName(""); setAttrVals(""); rebuild(newAttrs);
  };

  const removeAttrValue = (attrIdx, valIdx) => {
    const newAttrs = attrs.map((a, i) => { if (i !== attrIdx) return a; return { ...a, values: a.values.filter((_, j) => j !== valIdx) }; }).filter((a) => a.values.length > 0);
    setAttrs(newAttrs); rebuild(newAttrs);
  };

  const updateCombo = (idx, field, val) => { const updated = [...combinations]; updated[idx] = { ...updated[idx], [field]: val }; onChange(updated); };
  const deleteCombo = (idx) => onChange(combinations.filter((_, i) => i !== idx));
  const attrKeys = attrs.length > 0 ? attrs.map((a) => a.name) : (combinations[0]?.attributes ? Object.keys(combinations[0].attributes) : []);

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} mb={1}>Attribute Combination Builder</Typography>
      <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: 12 }}>Add attributes like "Type: Pack Of 4, Pack Of 6" — all combinations generate automatically.</Alert>
      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}>
        {attrs.length > 0 && (
          <Box mb={1.5}>
            {attrs.map((a, attrIdx) => (
              <Box key={attrIdx} mb={1}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>{a.name}:</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {a.values.map((val, valIdx) => (
                    <Chip key={valIdx} label={val} size="small" onDelete={() => removeAttrValue(attrIdx, valIdx)} color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="flex-end">
          <TextField size="small" label="Attribute Name" placeholder="e.g. Type, Size" value={attrName} onChange={(e) => setAttrName(e.target.value)} sx={{ width: 160 }} helperText="Enter same name to add more values" />
          <TextField size="small" label="Values (comma-separated)" placeholder="Pack Of 4, Pack Of 6" value={attrVals} onChange={(e) => setAttrVals(e.target.value)} sx={{ width: 260 }} onKeyDown={(e) => e.key === "Enter" && addAttr()} helperText="Multiple values = multiple combinations" />
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addAttr} sx={{ mb: 2.5 }}>Add</Button>
          {attrs.length > 0 && (
            <Button size="small" color="error" variant="outlined" sx={{ mb: 2.5 }} onClick={() => { if (window.confirm("Clear all attributes?")) { setAttrs([]); onChange([]); } }}>Clear All</Button>
          )}
        </Box>
      </Paper>
      {combinations?.length > 0 && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="caption" color="text.secondary">{combinations.length} combination(s) — fill in price &amp; stock for each</Typography>
          </Box>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  {attrKeys.map((k) => <TableCell key={k}><b>{k}</b></TableCell>)}
                  <TableCell><b>Price (₹)</b></TableCell><TableCell><b>Stock</b></TableCell>
                  <TableCell><b>SKU</b></TableCell><TableCell><b>Image</b></TableCell><TableCell><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {combinations.map((c, idx) => (
                  <TableRow key={idx} hover>
                    {attrKeys.map((k) => <TableCell key={k}>{c.attributes?.[k] || c[k]}</TableCell>)}
                    <TableCell><TextField size="small" type="number" value={c.price} onChange={(e) => updateCombo(idx, "price", e.target.value)} sx={{ width: 100 }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></TableCell>
                    <TableCell><TextField size="small" type="number" value={c.stock} onChange={(e) => updateCombo(idx, "stock", e.target.value)} sx={{ width: 80 }} /></TableCell>
                    <TableCell><TextField size="small" value={c.sku} onChange={(e) => updateCombo(idx, "sku", e.target.value)} placeholder="Auto" sx={{ width: 120 }} /></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {c.image && <Box component="img" src={typeof c.image === "string" ? c.image : c.image?.url || c.image} sx={{ width: 40, height: 40, objectFit: "cover", borderRadius: 1, border: "1px solid #ddd" }} />}
                        <label>
                          <input type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => updateCombo(idx, "image", ev.target.result); reader.readAsDataURL(file); }} />
                          <Button size="small" variant="outlined" component="span" sx={{ fontSize: 10, px: 1 }}>{c.image ? "Change" : "Upload"}</Button>
                        </label>
                      </Box>
                    </TableCell>
                    <TableCell><IconButton size="small" color="error" onClick={() => deleteCombo(idx)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
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

// ── AuthorManager ─────────────────────────────────────────────────────────────
const AuthorManager = ({ authors, onChange }) => {
  const ROLES = ["Written By", "Reviewed By", "Medically Reviewed By"];
  const EMPTY = { role: "Written By", name: "", designation: "", imageUrl: "", about: "", linkedin: "", experience_years: "", education: [], experience: [] };
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const setF = (field, val) => setForm((f) => ({ ...f, [field]: val }));
  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({ ...EMPTY, ...authors[i] }); setOpen(true); };
  const save = () => {
    if (!form.name.trim()) return;
    if (editing !== null) { const u = [...authors]; u[editing] = form; onChange(u); } else onChange([...authors, form]);
    setOpen(false); setEditing(null);
  };
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
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" display="block">{a.role}</Typography>
                <Typography variant="body2" fontWeight={700}>{a.name}</Typography>
                {a.designation && <Typography variant="caption">{a.designation}</Typography>}
              </Box>
              <Box>
                <IconButton size="small" onClick={() => openEdit(i)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => onChange(authors.filter((_, j) => j !== i))}><DeleteIcon fontSize="small" /></IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing !== null ? "Edit Author" : "Add Author"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={form.role} label="Role" onChange={(e) => setF("role", e.target.value)}>
                {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Name *" fullWidth size="small" value={form.name} onChange={(e) => setF("name", e.target.value)} />
            <TextField label="Designation" fullWidth size="small" value={form.designation} onChange={(e) => setF("designation", e.target.value)} />
            <TextField label="Photo URL (optional)" fullWidth size="small" value={form.imageUrl} onChange={(e) => setF("imageUrl", e.target.value)} />
            <TextField label="LinkedIn URL" fullWidth size="small" value={form.linkedin || ""} onChange={(e) => setF("linkedin", e.target.value)} />
            <TextField label="Years of Experience" fullWidth size="small" type="number" value={form.experience_years || ""} onChange={(e) => setF("experience_years", e.target.value)} />
            <TextField label="About / Bio" fullWidth size="small" multiline rows={3} value={form.about || ""} onChange={(e) => setF("about", e.target.value)} />
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                <Typography variant="subtitle2" fontWeight={700}>Education</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addEdu}>Add</Button>
              </Box>
              {(form.education || []).map((e, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <TextField size="small" label="Degree" value={e.degree} onChange={(ev) => updateEdu(i, "degree", ev.target.value)} sx={{ flex: 1.5 }} />
                  <TextField size="small" label="Institution" value={e.institution} onChange={(ev) => updateEdu(i, "institution", ev.target.value)} sx={{ flex: 2 }} />
                  <TextField size="small" label="Year" value={e.year} onChange={(ev) => updateEdu(i, "year", ev.target.value)} sx={{ width: 110 }} />
                  <IconButton size="small" color="error" onClick={() => removeEdu(i)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Box>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                <Typography variant="subtitle2" fontWeight={700}>Work Experience</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addExp}>Add</Button>
              </Box>
              {(form.experience || []).map((ex, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <TextField size="small" label="Role" value={ex.role} onChange={(ev) => updateExp(i, "role", ev.target.value)} sx={{ flex: 1.5 }} />
                  <TextField size="small" label="Organization" value={ex.organization} onChange={(ev) => updateExp(i, "organization", ev.target.value)} sx={{ flex: 2 }} />
                  <TextField size="small" label="Period" value={ex.period} onChange={(ev) => updateExp(i, "period", ev.target.value)} sx={{ width: 130 }} />
                  <IconButton size="small" color="error" onClick={() => removeExp(i)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} variant="contained">{editing !== null ? "Update" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── ReviewManagement ──────────────────────────────────────────────────────────
const ReviewManagement = ({ reviews, onChange }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ user: "", rating: 4, comment: "", date: new Date().toISOString().split("T")[0], verified: true });
  const save = () => {
    if (editing !== null) { const u = [...reviews]; u[editing] = form; onChange(u); } else onChange([...reviews, { ...form, id: Date.now() }]);
    setOpen(false); setEditing(null);
    setForm({ user: "", rating: 4, comment: "", date: new Date().toISOString().split("T")[0], verified: true });
  };
  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight={700}>Customer Reviews ({reviews.length})</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setEditing(null); setOpen(true); }}>Add Review</Button>
        </Box>
        {reviews.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  {["User","Rating","Comment","Date","Verified","Actions"].map((h) => <TableCell key={h}><b>{h}</b></TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.user}</TableCell>
                    <TableCell><Rating value={r.rating} readOnly size="small" /></TableCell>
                    <TableCell><Typography variant="caption" noWrap sx={{ maxWidth: 180, display: "block" }}>{r.comment}</Typography></TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.verified ? "✓" : "—"}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setForm(r); setEditing(i); setOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => onChange(reviews.filter((_, j) => j !== i))}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing !== null ? "Edit Review" : "Add Review"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="User Name" fullWidth size="small" value={form.user} onChange={(e) => setForm((f) => ({ ...f, user: e.target.value }))} />
              <Box>
                <Typography variant="caption">Rating</Typography><br />
                <Rating value={form.rating} onChange={(_, v) => setForm((f) => ({ ...f, rating: v }))} />
              </Box>
              <TextField label="Comment" multiline rows={3} fullWidth size="small" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} />
              <TextField label="Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <FormControlLabel control={<Checkbox checked={form.verified} onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))} />} label="Verified Purchase" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} variant="contained">{editing !== null ? "Update" : "Add"}</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// NEW — Rate-first discount section components
// ════════════════════════════════════════════════════════════════════════════

// ── Role rates config (8 standard + 14 MR levels) ─────────────────────────
const ROLE_RATES_CONFIG = [
  { key:"b2c",          label:"D2C / B2C — Customer",       color:"#1565c0", bg:"#e3f2fd", rateKey:"saleRatePTR",       totalKey:"totalSaleValue",         iconKey:"store",    group:"main" },
  { key:"b2b",          label:"B2B — Business",              color:"#6a1b9a", bg:"#f3e5f5", rateKey:"b2bRate",           totalKey:"totalBusinessSaleValue", iconKey:"account",  group:"main" },
  { key:"wholesale",    label:"Wholesale / Distributor",     color:"#e65100", bg:"#fff3e0", rateKey:"wholesaleSaleRate", totalKey:"totalWholesaleValue",    iconKey:"offer",    group:"main" },
  { key:"hospital",     label:"Hospital",                    color:"#0277bd", bg:"#e1f5fe", rateKey:"hospitalSaleRate",  totalKey:"hospitalTotalValue",     iconKey:"hospital", group:"main" },
  { key:"pharmacy",     label:"Pharmacy",                    color:"#2e7d32", bg:"#e8f5e9", rateKey:"pharmacySaleRate",  totalKey:"pharmacyTotalValue",     iconKey:"store2",   group:"main" },
  { key:"vendor",       label:"Vendor",                      color:"#00695c", bg:"#e0f2f1", rateKey:"vendorRate",        totalKey:null,                     iconKey:"account",  group:"main" },
  { key:"franchise",    label:"Franchise",                   color:"#ad1457", bg:"#fce4ec", rateKey:"franchiseRate",     totalKey:null,                     iconKey:"store2",   group:"main" },
  { key:"manufacturer", label:"Manufacturer",                color:"#4527a0", bg:"#ede7f6", rateKey:"manufacturerRate",  totalKey:null,                     iconKey:"factory",  group:"main" },
  ...Array.from({ length: 14 }, (_, i) => ({
    key:`mrL${i+1}`, label:`Marketing Agent L${i+1}`, color:"#37474f", bg:"#eceff1",
    rateKey:`mrL${i+1}Rate`, totalKey:null, iconKey:"person", group:"mr",
  })),
];

const PRESET_COLORS = [
  "#1565c0","#6a1b9a","#e65100","#0277bd","#2e7d32",
  "#00695c","#ad1457","#4527a0","#558b2f","#f57f17",
  "#37474f","#bf360c","#006064","#880e4f","#1a237e",
];

const roleIconMap = (iconKey) => {
  const map = {
    store:    <StoreIcon />,
    account:  <AccountTreeIcon />,
    offer:    <LocalOfferIcon />,
    hospital: <LocalHospitalIcon />,
    store2:   <StorefrontIcon />,
    factory:  <FactoryIcon />,
    person:   <PersonIcon />,
    tag:      <LocalOfferIcon />,
  };
  return map[iconKey] ?? <LocalOfferIcon />;
};

// ── RoleRateCard ──────────────────────────────────────────────────────────────
const RoleRateCard = ({ config, mrp, stocks, rateValue, totalValue, onChange, onDelete, compact = false }) => {
  const mrpN  = parseFloat(mrp)       || 0;
  const rateN = parseFloat(rateValue) || 0;
  const stN   = parseFloat(stocks)    || 0;
  const discPct    = mrpN > 0 && rateN > 0 ? ((mrpN - rateN) / mrpN * 100).toFixed(2) : null;
  const saving     = mrpN > 0 && rateN > 0 ? fmt(mrpN - rateN) : null;
  const compTotal  = totalValue != null ? totalValue : (rateN > 0 ? fmt(rateN * stN) : null);
  const isOverMrp  = rateN > mrpN && mrpN > 0;
  const icon = roleIconMap(config.iconKey || config.icon || "tag");

  if (compact) {
    return (
      <Paper variant="outlined" sx={{ p:1.5, borderRadius:2, borderColor:config.color+"55", bgcolor:config.bg+"55", position:"relative" }}>
        {onDelete && (
          <IconButton size="small" color="error" onClick={onDelete}
            sx={{ position:"absolute", top:4, right:4, width:20, height:20, border:"1px solid #fee2e2", bgcolor:"#fff" }}>
            <CloseIcon sx={{ fontSize:12 }} />
          </IconButton>
        )}
        <Box display="flex" alignItems="center" gap={0.75} mb={1} pr={onDelete ? 2.5 : 0}>
          <Box sx={{ color:config.color, display:"flex", fontSize:16 }}>{icon}</Box>
          <Typography variant="caption" fontWeight={700} sx={{ color:config.color, flex:1, lineHeight:1.2 }}>
            {config.label}
          </Typography>
          {discPct && (
            <Chip label={`${discPct}%`} size="small"
              sx={{ height:16, fontSize:9, fontWeight:800, bgcolor:config.color, color:"#fff", ml:"auto",
                    "& .MuiChip-label":{ px:0.75 } }} />
          )}
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <TextField size="small" label="Rate (₹)" type="number" value={rateValue}
            onChange={e => onChange(e.target.value)} fullWidth error={isOverMrp}
            InputProps={{ startAdornment:<InputAdornment position="start">₹</InputAdornment> }} />
          <Box sx={{ minWidth:64, textAlign:"center", p:1, bgcolor:config.bg, borderRadius:1, border:`1px solid ${config.color}33`, flexShrink:0 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize:9 }}>Off MRP</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color:config.color, fontSize:11 }}>
              {discPct ? `${discPct}%` : "—"}
            </Typography>
          </Box>
        </Box>
        {saving && (
          <Typography variant="caption" color="text.secondary" sx={{ mt:0.5, display:"block" }}>
            Save ₹{saving}/unit
          </Typography>
        )}
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p:2, borderRadius:2, borderColor:config.color, borderWidth:1.5, position:"relative" }}>
      {onDelete && (
        <IconButton size="small" color="error" onClick={onDelete}
          sx={{ position:"absolute", top:8, right:8, border:"1px solid #fee2e2", bgcolor:"#fff8f8" }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
      <Box display="flex" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
        <Box sx={{ color:config.color, display:"flex", alignItems:"center" }}>{icon}</Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color:config.color }}>{config.label}</Typography>
        {config.isCustom && <Chip label="Custom" size="small" color="secondary" variant="outlined" sx={{ fontSize:10 }} />}
        {discPct && <Chip label={`${discPct}% below MRP`} size="small" sx={{ bgcolor:config.bg, color:config.color, fontWeight:700 }} />}
        {isOverMrp && <Chip label="⚠ Exceeds MRP" size="small" color="error" />}
      </Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <TextField fullWidth size="small" label="Sale Rate (₹) *" type="number"
            value={rateValue} onChange={e => onChange(e.target.value)}
            placeholder={mrpN > 0 ? `≤ ₹${mrpN}` : "Enter rate…"} error={isOverMrp}
            helperText={isOverMrp ? "Rate exceeds MRP" : "Primary input"}
            InputProps={{ startAdornment:<InputAdornment position="start">₹</InputAdornment> }} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth size="small" label="Discount % (Auto)"
            value={discPct ? `${discPct}%` : "—"} InputProps={{ readOnly:true }}
            sx={{ bgcolor:config.bg }} helperText="(MRP − Rate) / MRP × 100" />
        </Grid>
        {config.totalKey && (
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label="Total Value"
              value={compTotal ? `₹ ${compTotal}` : "—"} InputProps={{ readOnly:true }}
              sx={{ bgcolor:config.bg }} helperText="Rate × Total Stocks" />
          </Grid>
        )}
        <Grid item xs={12} sm={config.totalKey ? 3 : 6}>
          <Box sx={{ p:1.5, borderRadius:2, bgcolor:config.bg, textAlign:"center", border:`1px solid ${config.color}33` }}>
            <Typography variant="caption" color="text.secondary" display="block">Saving / unit</Typography>
            <Typography fontWeight={700} sx={{ color:config.color }}>{saving ? `₹ ${saving}` : "—"}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

// ── AddRoleDialog ─────────────────────────────────────────────────────────────
const AddRoleDialog = ({ open, onClose, onAdd }) => {
  const [form, setForm] = useState({ label:"", key:"", color:"#1565c0", bg:"#e3f2fd" });
  const [keyError, setKeyError] = useState("");

  const handleLabelChange = (val) => {
    const autoKey = val.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");
    setForm(f => ({ ...f, label:val, key:autoKey }));
    setKeyError("");
  };

  const handleAdd = () => {
    if (!form.label.trim()) return;
    if (!form.key.trim()) { setKeyError("Key is required"); return; }
    if (!/^[a-z][a-z0-9_]*$/.test(form.key)) { setKeyError("Key must start with a letter, only a-z 0-9 _"); return; }
    onAdd({
      key:      form.key,
      label:    form.label.trim(),
      color:    form.color,
      bg:       form.bg || form.color + "22",
      rateKey:  form.key + "Rate",
      totalKey: null,
      iconKey:  "tag",
      group:    "custom",
      isCustom: true,
    });
    setForm({ label:"", key:"", color:"#1565c0", bg:"#e3f2fd" });
    setKeyError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
      <DialogTitle sx={{ fontWeight:700, display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #f3f4f6" }}>
        <Box display="flex" alignItems="center" gap={1}><AddIcon color="primary" />Add Custom Role Category</Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mt:2, mb:2, py:0.5, fontSize:12 }}>
          Custom categories are stored with the product. You can add roles like <strong>NGO, Government, VIP, Agent, Reseller</strong> etc.
        </Alert>
        <Stack spacing={2}>
          <TextField fullWidth size="small" label="Role Name *" placeholder="e.g. Government Supply, NGO, VIP Client"
            value={form.label} onChange={e => handleLabelChange(e.target.value)}
            helperText="The display name shown on the form and product page" />
          <TextField fullWidth size="small" label="Role Key (auto-generated, editable)"
            placeholder="e.g. government_supply" value={form.key}
            onChange={e => { setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"") })); setKeyError(""); }}
            error={!!keyError} helperText={keyError || "Unique identifier used in the database. Only a-z, 0-9, _"} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Accent Color</Typography>
            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
              {PRESET_COLORS.map(c => (
                <Box key={c} onClick={() => setForm(f => ({ ...f, color:c, bg:c+"18" }))}
                  sx={{ width:28, height:28, borderRadius:"50%", bgcolor:c, cursor:"pointer",
                        border: form.color===c ? "3px solid #000" : "2px solid transparent",
                        transition:"border .15s", "&:hover":{ opacity:0.8 } }} />
              ))}
              <Box sx={{ display:"flex", alignItems:"center", gap:0.5 }}>
                <Typography variant="caption" color="text.secondary">Custom:</Typography>
                <input type="color" value={form.color}
                  onChange={e => setForm(f => ({ ...f, color:e.target.value, bg:e.target.value+"18" }))}
                  style={{ width:28, height:28, border:"none", cursor:"pointer", padding:0, borderRadius:"50%" }} />
              </Box>
            </Box>
          </Box>
          {form.label && (
            <Paper variant="outlined" sx={{ p:2, borderRadius:2, borderColor:form.color, borderWidth:1.5 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Preview:</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ color:form.color }}><LocalOfferIcon /></Box>
                <Typography fontWeight={700} sx={{ color:form.color }}>{form.label}</Typography>
                <Chip label="Custom" size="small" color="secondary" variant="outlined" sx={{ fontSize:10 }} />
              </Box>
            </Paper>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px:3, pb:2.5, gap:1 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleAdd} variant="contained" disabled={!form.label.trim()} startIcon={<AddIcon />}
          sx={{ background:"linear-gradient(135deg,#1565c0,#0d47a1)" }}>Add Role</Button>
      </DialogActions>
    </Dialog>
  );
};

// ── ManageRolesDialog ─────────────────────────────────────────────────────────
const ManageRolesDialog = ({ open, onClose, customRoles, onDelete }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
    <DialogTitle sx={{ fontWeight:700, display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #f3f4f6" }}>
      <Box display="flex" alignItems="center" gap={1}><CategoryIcon color="primary" />Manage Custom Roles ({customRoles.length})</Box>
      <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
    </DialogTitle>
    <DialogContent>
      {customRoles.length === 0 ? (
        <Box sx={{ py:4, textAlign:"center" }}><Typography color="text.secondary">No custom roles added yet.</Typography></Box>
      ) : (
        <Stack spacing={1.5} sx={{ mt:1.5 }}>
          {customRoles.map((r, i) => (
            <Paper key={r.key} variant="outlined" sx={{ p:1.5, borderRadius:2, borderColor:r.color+"55", display:"flex", alignItems:"center", gap:1.5 }}>
              <Box sx={{ width:16, height:16, borderRadius:"50%", bgcolor:r.color, flexShrink:0 }} />
              <Box flex={1}>
                <Typography variant="body2" fontWeight={700}>{r.label}</Typography>
                <Typography variant="caption" color="text.secondary">key: {r.key} · field: {r.rateKey}</Typography>
              </Box>
              <Chip label="Custom" size="small" color="secondary" variant="outlined" sx={{ fontSize:10 }} />
              <IconButton size="small" color="error" onClick={() => onDelete(i)}><DeleteIcon fontSize="small" /></IconButton>
            </Paper>
          ))}
        </Stack>
      )}
    </DialogContent>
    <DialogActions sx={{ px:3, pb:2 }}>
      <Button onClick={onClose} variant="contained">Done</Button>
    </DialogActions>
  </Dialog>
);

// ── buildRatePayload (used in handleSubmit) ───────────────────────────────────
const buildRatePayload = (fd, customRoles = []) => {
  const mrp = parseFloat(fd.mrp) || 0;
  const computeDiscount = (rateStr) => {
    const rate = parseFloat(rateStr) || 0;
    if (!rate || !mrp) return 0;
    return parseFloat(((mrp - rate) / mrp * 100).toFixed(4));
  };
  return {
    saleRatePTR:       parseFloat(fd.saleRatePTR)      || 0,
    ptr:               parseFloat(fd.saleRatePTR)      || 0,
    rateB2C:           parseFloat(fd.saleRatePTR)      || 0,
    b2bRate:           parseFloat(fd.b2bRate)           || 0,
    rateB2B:           parseFloat(fd.b2bRate)           || 0,
    wholesaleSaleRate: parseFloat(fd.wholesaleSaleRate) || 0,
    wsr:               parseFloat(fd.wholesaleSaleRate) || 0,
    rateWholesale:     parseFloat(fd.wholesaleSaleRate) || 0,
    hospitalSaleRate:  parseFloat(fd.hospitalSaleRate)  || 0,
    saleRateHPSR:      parseFloat(fd.hospitalSaleRate)  || 0,
    hpsr:              parseFloat(fd.hospitalSaleRate)  || 0,
    rateHospital:      parseFloat(fd.hospitalSaleRate)  || 0,
    pharmacySaleRate:  parseFloat(fd.pharmacySaleRate)  || 0,
    ratePharmacy:      parseFloat(fd.pharmacySaleRate)  || 0,
    vendorRate:        parseFloat(fd.vendorRate)         || 0,
    rateVendor:        parseFloat(fd.vendorRate)         || 0,
    franchiseRate:     parseFloat(fd.franchiseRate)      || 0,
    rateFranchise:     parseFloat(fd.franchiseRate)      || 0,
    manufacturerRate:  parseFloat(fd.manufacturerRate)   || 0,
    rateManufacturer:  parseFloat(fd.manufacturerRate)   || 0,
    b2cDiscount:          computeDiscount(fd.saleRatePTR),
    discountB2C:          computeDiscount(fd.saleRatePTR),
    b2bDiscount:          computeDiscount(fd.b2bRate),
    discountB2B:          computeDiscount(fd.b2bRate),
    hospitalDiscount:     computeDiscount(fd.hospitalSaleRate),
    discountHospital:     computeDiscount(fd.hospitalSaleRate),
    hospitalPharmacyDiscount: computeDiscount(fd.hospitalSaleRate),
    pharmacyDiscount:     computeDiscount(fd.pharmacySaleRate),
    discountPharmacy:     computeDiscount(fd.pharmacySaleRate),
    vendorDiscount:       computeDiscount(fd.vendorRate),
    discountVendor:       computeDiscount(fd.vendorRate),
    franchiseDiscount:    computeDiscount(fd.franchiseRate),
    discountFranchise:    computeDiscount(fd.franchiseRate),
    manufacturerDiscount: computeDiscount(fd.manufacturerRate),
    discountManufacturer: computeDiscount(fd.manufacturerRate),
    totalCostOfStores:      fd.totalCostOfStores,
    totalActualValue:       fd.totalActualValue,
    totalSaleValue:         fd.totalSaleValue,
    totalBusinessSaleValue: fd.totalBusinessSaleValue,
    totalWholesaleValue:    fd.totalWholesaleValue,
    hospitalTotalValue:     fd.hospitalTotalValue,
    pharmacyTotalValue:     fd.pharmacyTotalValue,
    ...Object.fromEntries(Array.from({ length:14 }, (_, i) => [`mrL${i+1}Rate`, parseFloat(fd[`mrL${i+1}Rate`]) || 0])),
    ...Object.fromEntries((customRoles || []).map(r => [r.rateKey, parseFloat(fd[r.rateKey]) || 0])),
  };
};

const PharmaProductForm = ({
  editProductId = null, onSuccess,
  authTokenKey = "adminToken",
  productSearchPath = "/api/admin/products/search",
  getProductPath = defaultGetProductPath,
  createProductPath = "/api/products/add",
  updateProductPath = defaultUpdateProductPath,
  fixedFranchiseZoneId = "",
  hideFranchiseZoneField = false,
}) => {
  const { toasts, show } = useToast();
  const [expanded, setExpanded] = useState("panel1");
  const [submitting, setSubmitting] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [mainCategories, setMainCategories]           = useState([]);
  const [subCategories, setSubCategories]             = useState([]);
  const [franchiseZones, setFranchiseZones]           = useState([]);
  const [selectedMainCat, setSelectedMainCat]         = useState("");
  const [selectedSubCat, setSelectedSubCat]           = useState("");
  const [selectedFranchiseZone, setSelectedFranchiseZone] = useState("");
  const [subCatLoading, setSubCatLoading]             = useState(false);
  const [subCatIds, setSubCatIds]                     = useState(new Set());
  const [availableHomeSections, setAvailableHomeSections] = useState([]);
  const [selectedHomeSections, setSelectedHomeSections]   = useState([]);
  const [franchiseZonesLoading, setFranchiseZonesLoading] = useState(false);

  const [specifications, setSpecifications]   = useState([{ key: "", value: "" }]);
  const [variants, setVariants]               = useState([{ name: "", price: "", stock: "" }]);
  const [combinations, setCombinations]       = useState([]);
  const [combos, setCombos]                   = useState([]);
  const [reviews, setReviews]                 = useState([]);
  const [coupons, setCoupons]                 = useState([]);
  const [sections, setSections]               = useState([]);
  const [authors, setAuthors]                 = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [certifications, setCertifications]   = useState([]);
  //  NEW: custom role categories 
  const [customRoles, setCustomRoles]         = useState([]);
  const [injectionTypes, setInjectionTypes]   = useState([]);
  const [tabletTypes, setTabletTypes]         = useState([]);
  const [selectedInjType, setSelectedInjType] = useState("");
  const [selectedTabType, setSelectedTabType] = useState("");
  const [addRoleOpen, setAddRoleOpen]         = useState(false);
  const [manageRoleOpen, setManageRoleOpen]   = useState(false);

  const [gstRate, setGstRate]     = useState("");
  const [gstValues, setGstValues] = useState({ igst: "", cgst: "", sgst: "" });

  const [fd, setFd] = useState({
    images: [], video: null,
    manufacturer: "", brandName: "", genericCompositions: "",
    totalStocks: "", hsn: "", batchNumber: "", batchDateEffect: "",
    expiryDate: "", caseBoxPackage: "", packageType: "", productWeight: "",
    minRateFixed: "", mrp: "", amp: "",
    totalCostOfStores: "0.00", totalActualValue: "0.00",
    // ── Rate-first fields (PRIMARY inputs) ───────────────────────────────
    saleRatePTR:       "",   // B2C / PTR
    b2bRate:           "",   // B2B
    wholesaleSaleRate: "",   // Wholesale/Distributor
    hospitalSaleRate:  "",   // Hospital
    pharmacySaleRate:  "",   // Pharmacy
    vendorRate:        "",   // Vendor
    franchiseRate:     "",   // Franchise
    manufacturerRate:  "",   // Manufacturer
    //  Auto-computed totals 
    totalSaleValue:         "0.00",
    totalBusinessSaleValue: "0.00",
    totalWholesaleValue:    "0.00",
    hospitalTotalValue:     "0.00",
    pharmacyTotalValue:     "0.00",
    casePackPrice: "",
    gstDateEffect: "",
    offersWithIcon: [], additionalOffers: "",
    scheme1: "", scheme2: "",
    tags: [], description: "", moreInformation: "", disclaimer: "",
    productRating: 4.5, doctorFeedbacks: [],
    currentStatus1: "active", currentStatus2: "appear",
    topReviewFromIndia: "", isOTC: true,
    marketerName: "", marketerAddress: "", countryOfOrigin: "", lastUpdated: "",
    //  MR level rates L1–L14 
    mrL1Rate:"",  mrL2Rate:"",  mrL3Rate:"",  mrL4Rate:"",
    mrL5Rate:"",  mrL6Rate:"",  mrL7Rate:"",  mrL8Rate:"",
    mrL9Rate:"",  mrL10Rate:"", mrL11Rate:"", mrL12Rate:"",
    mrL13Rate:"", mrL14Rate:"",
  });

  const isBulkManufacturingDesk =
    authTokenKey === "bulkManufacturingToken" ||
    String(createProductPath || "").includes("/bulk-manufacturing-portal/products");

  const set = (field, value) => setFd((p) => ({ ...p, [field]: value }));

  const requestClient = useMemo(() => {
    const client = axios.create({ baseURL: API_BASE });
    client.interceptors.request.use((cfg) => {
      const token = getManagedProductToken(authTokenKey);
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });
    return client;
  }, [authTokenKey]);

  useEffect(() => {
    const t = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadCategories = useCallback(async () => {
    const token = getManagedProductToken(authTokenKey);
    for (const url of [`${API_BASE}/api/category/all`, `${API_BASE}/api/categories/all`]) {
      try {
        const res = await fetch(url, { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const d = await res.json();
        const cats = d.categories || d.data || [];
        if (cats.length) { setMainCategories(cats); return; }
      } catch {}
    }
  }, [authTokenKey]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken") || "";
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sections/all`, { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const d = await res.json();
        const secs = d.sections || d.homeSections || d.data || [];
        if (secs.length) setAvailableHomeSections(secs);
      } catch {}
    })();
  }, []);

  const loadFranchiseZones = useCallback(async () => {
    if (hideFranchiseZoneField || fixedFranchiseZoneId) { setFranchiseZones([]); return; }
    const adminToken = getManagedProductToken(authTokenKey);
    if (!adminToken) { setFranchiseZones([]); return; }
    setFranchiseZonesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/zones`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` } });
      const data = await res.json();
      setFranchiseZones(data.zones || []);
    } catch { setFranchiseZones([]); }
    finally { setFranchiseZonesLoading(false); }
  }, [authTokenKey, fixedFranchiseZoneId, hideFranchiseZoneField]);
  useEffect(() => { loadFranchiseZones(); }, [loadFranchiseZones]);
  useEffect(() => { if (fixedFranchiseZoneId) setSelectedFranchiseZone(fixedFranchiseZoneId); }, [fixedFranchiseZoneId]);

  useEffect(() => {
    if (!selectedMainCat) { setSubCategories([]); setSelectedSubCat(""); return; }
    const cat = mainCategories.find((c) => c._id === selectedMainCat);
    if (!cat) return;
    const token = getManagedProductToken(authTokenKey);
    setSubCatLoading(true);
    fetch(`${API_BASE}/api/category/sub/${encodeURIComponent(cat.title)}`, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then((r) => r.json())
      .then((d) => setSubCategories(d.categories || []))
      .catch(() => setSubCategories([]))
      .finally(() => setSubCatLoading(false));
  }, [authTokenKey, mainCategories, selectedMainCat]);

  //  Edit-load 
  useEffect(() => {
    if (!editProductId) return;
    requestClient.get(getProductPath(editProductId)).then((res) => {
      const p = res.data.data || res.data.product;
      if (!p) return;

      setFd((prev) => ({
        ...prev,
        images: p.images || [], video: p.video?.url ? [p.video] : [],
        manufacturer: p.manufacturer || "", brandName: p.brandName || "",
        genericCompositions: p.genericCompositions || "",
        totalStocks: p.totalStocks || "", hsn: p.hsn || "",
        batchNumber: p.batchNumber || "", batchDateEffect: p.dateOfEffect || "",
        expiryDate: p.expiryDate || "", caseBoxPackage: p.caseBoxPackage || "",
        packageType: p.packageType || "", productWeight: p.productWeight || "",
        minRateFixed: p.minRateFixed || "", mrp: p.mrp || "", amp: p.amp || "",
        casePackPrice: p.casePackPrice || "", gstDateEffect: p.gstDateEffect || "",
        offersWithIcon: p.offersWithIcon || [], additionalOffers: p.additionalOffers || "",
        scheme1: p.scheme1 || "", scheme2: p.scheme2 || "",
        tags: p.tags || [], description: p.fullDescription || "",
        moreInformation: p.shortDescription || "", disclaimer: p.disclaimer || "",
        productRating: p.rating || 4.5, doctorFeedbacks: p.doctorFeedbacks || [],
        currentStatus1: p.statusActive || "active", currentStatus2: p.statusAppear || "appear",
        topReviewFromIndia: p.topReviewFromIndia || "", isOTC: p.isOTC !== undefined ? p.isOTC : true,
        marketerName: p.marketerName || "", marketerAddress: p.marketerAddress || "",
        countryOfOrigin: p.countryOfOrigin || "", lastUpdated: p.lastUpdated || "",
      }));

      if (p.gst_igst) {
        setGstRate(String(p.gst_igst));
        setGstValues({ igst: String(p.gst_igst), cgst: String(p.gst_cgst || 0), sgst: String(p.gst_sgst || 0) });
      }
      if (p.category?._id)    setSelectedMainCat(p.category._id);
      if (p.subCategory?._id) setSelectedSubCat(p.subCategory._id);
      setSelectedFranchiseZone(p.franchiseZoneId?._id || p.franchiseZoneId || "");
      if (p.specifications?.length)   setSpecifications(p.specifications);
      if (p.variants?.length)         setVariants(p.variants);
      if (p.combinations?.length)     setCombinations(p.combinations);
      if (p.combos?.length)           setCombos(p.combos);
      if (p.sections?.length)         setSections(p.sections);
      if (p.homeSections?.length)     setSelectedHomeSections(p.homeSections);
      if (p.reviews?.length)          setReviews(p.reviews);
      if (p.coupons?.length)          setCoupons(p.coupons);
      if (p.authors?.length)          setAuthors(p.authors);
      if (p.recommendations?.length)  setRecommendations(p.recommendations);
      if (p.certifications?.length)   setCertifications(p.certifications);
      if (p.injectionTypes?.length)   setInjectionTypes(p.injectionTypes);
      if (p.tabletTypes?.length)      setTabletTypes(p.tabletTypes);
      if (p.customRoles?.length)      setCustomRoles(p.customRoles);

      // ── Load rates (primary inputs) with ?? fallback chain ───────────
      const mrpEdit = parseFloat(p.mrp) || 0;
      const resolveRate = (explicit, discPct) => {
        const r = parseFloat(explicit);
        if (r > 0) return String(r);
        const d = parseFloat(discPct);
        if (mrpEdit > 0 && d > 0) return fmt(mrpEdit * (1 - d / 100));
        return "";
      };
      setFd((prev) => ({
        ...prev,
        saleRatePTR:       resolveRate(p.saleRatePTR      ?? p.ptr          ?? p.rateB2C,       p.discountB2C    ?? p.b2cDiscount),
        b2bRate:           resolveRate(p.rateB2B           ?? p.b2bRate,                         p.discountB2B    ?? p.b2bDiscount),
        wholesaleSaleRate: resolveRate(p.wholesaleSaleRate  ?? p.wsr         ?? p.rateWholesale, p.discountWholesale ?? ""),
        hospitalSaleRate:  resolveRate(p.hospitalSaleRate   ?? p.saleRateHPSR ?? p.hpsr ?? p.rateHospital, p.discountHospital ?? p.hospitalPharmacyDiscount),
        pharmacySaleRate:  resolveRate(p.pharmacySaleRate   ?? p.ratePharmacy,                  p.discountPharmacy),
        vendorRate:        resolveRate(p.vendorRate          ?? p.rateVendor,                    p.discountVendor),
        franchiseRate:     resolveRate(p.franchiseRate       ?? p.rateFranchise,                 p.discountFranchise),
        manufacturerRate:  resolveRate(p.manufacturerRate    ?? p.rateManufacturer,               p.discountManufacturer),
        ...Object.fromEntries(
          Array.from({ length:14 }, (_, i) => {
            const k = `mrL${i+1}Rate`;
            const v = p[k];
            return [k, v != null && parseFloat(v) > 0 ? String(parseFloat(v)) : ""];
          })
        ),
        ...Object.fromEntries(
          (p.customRoles || []).map(r => [r.rateKey, r.rate != null && parseFloat(r.rate) > 0 ? String(parseFloat(r.rate)) : ""])
        ),
      }));
    }).catch(() => {});
  }, [editProductId, getProductPath, requestClient]);

  const handleGstRateChange = (val) => {
    setGstRate(val);
    const total = parseFloat(val) || 0;
    const half  = (total / 2).toFixed(2);
    setGstValues({ igst: fmt(total), cgst: half, sgst: half });
    setFd((p) => ({ ...p, gst: { igst: fmt(total), cgst: half, sgst: half } }));
  };

  // ── NEW pricing useEffect: totals only, rates are primary inputs ─────────
  useEffect(() => {
    const stocks = n(fd.totalStocks);
    const mrp    = n(fd.mrp);
    const amp    = n(fd.amp);
    setFd((p) => ({
      ...p,
      totalCostOfStores:      fmt(amp * stocks),
      totalActualValue:       fmt(mrp * stocks),
      totalSaleValue:         fmt(n(p.saleRatePTR)       * stocks),
      totalBusinessSaleValue: fmt(n(p.b2bRate)            * stocks),
      totalWholesaleValue:    fmt(n(p.wholesaleSaleRate)  * stocks),
      hospitalTotalValue:     fmt(n(p.hospitalSaleRate)   * stocks),
      pharmacyTotalValue:     fmt(n(p.pharmacySaleRate)   * stocks),
    }));

  }, [
    fd.totalStocks, fd.mrp, fd.amp,
    fd.saleRatePTR, fd.b2bRate, fd.wholesaleSaleRate,
    fd.hospitalSaleRate, fd.pharmacySaleRate,
  ]);

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result); r.onerror = rej;
  });

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errors = [];
    if (!fd.manufacturer)  errors.push("Manufacturer");
    if (!fd.brandName)     errors.push("Brand Name");
    if (!selectedMainCat)  errors.push("Category");
    if (!fd.mrp)           errors.push("MRP");
    if (!fd.totalStocks)   errors.push("Total Stocks");
    if (isBulkManufacturingDesk && sections.length === 0) errors.push("At least one Website Section");
    if (errors.length) { show(`Required: ${errors.join(", ")}`, "error"); return; }

    setSubmitting(true);
    try {
      const imgBase64 = await Promise.all(fd.images.map(toBase64));
      let videoBase64 = null;
      if (fd.video?.length) videoBase64 = await toBase64(fd.video[0]);

      const payload = {
        manufacturer: fd.manufacturer, brandName: fd.brandName,
        genericCompositions: fd.genericCompositions, hsn: fd.hsn,
        batchNumber: fd.batchNumber, category: selectedMainCat,
        subCategory: selectedSubCat || null,
        franchiseZoneId: fixedFranchiseZoneId || selectedFranchiseZone || null,
        sections, homeSections: selectedHomeSections || [],
        totalStocks: fd.totalStocks, productWeight: fd.productWeight,
        packageType: fd.packageType, injectionTypes, tabletTypes,
        caseBoxPackage: fd.caseBoxPackage, casePackPrice: fd.casePackPrice,
        batchDateEffect: fd.batchDateEffect, expiryDate: fd.expiryDate,
        minRateFixed: fd.minRateFixed, mrp: fd.mrp, amp: fd.amp,
        gst: gstValues, gstDateEffect: fd.gstDateEffect,
        offersWithIcon: fd.offersWithIcon, additionalOffers: fd.additionalOffers,
        scheme1: fd.scheme1, scheme2: fd.scheme2, coupons, authors, combos,
        recommendations, certifications,
        // ── All custom role categories ──────────────────────────────────
        customRoles: customRoles.map(r => ({
          key: r.key, label: r.label, color: r.color, bg: r.bg,
          iconKey: r.iconKey || "tag", rateKey: r.rateKey, isCustom: true,
          rate: parseFloat(fd[r.rateKey]) || 0,
          discount: (() => {
            const mrp2 = parseFloat(fd.mrp) || 0;
            const rate = parseFloat(fd[r.rateKey]) || 0;
            return mrp2 > 0 && rate > 0 ? parseFloat(((mrp2 - rate) / mrp2 * 100).toFixed(4)) : 0;
          })(),
        })),
        tags: fd.tags, showInCategories: Array(9).fill(false),
        description: fd.description, moreInformation: fd.moreInformation,
        disclaimer: fd.disclaimer, currentStatus1: fd.currentStatus1,
        currentStatus2: fd.currentStatus2, isOTC: fd.isOTC,
        productRating: fd.productRating, topReviewFromIndia: fd.topReviewFromIndia,
        doctorFeedbacks: fd.doctorFeedbacks, marketerName: fd.marketerName,
        marketerAddress: fd.marketerAddress, countryOfOrigin: fd.countryOfOrigin,
        lastUpdated: fd.lastUpdated, variants: variants.filter((v) => v.name),
        combinations, specifications, reviews,
        images: imgBase64, video: videoBase64,
        // ── Rates + derived discounts ────────────────────────────────────
        ...buildRatePayload(fd, customRoles),
      };

      const url    = editProductId ? updateProductPath(editProductId) : createProductPath;
      const method = editProductId ? "put" : "post";
      const response = await requestClient[method](url, payload, { timeout: 60000 });
      if (response.data.success) {
        show(`"${fd.brandName}" ${editProductId ? "updated" : "saved"} successfully!`);
        onSuccess?.();
      } else show(response.data.message || "Failed to save", "error");
    } catch (err) {
      show(err.response?.data?.message || "Server error", "error");
    } finally { setSubmitting(false); }
  };

  const accordion = (panel) => ({
    expanded: expanded === panel,
    onChange: (_, open) => setExpanded(open ? panel : false),
  });

  const margin = (() => {
    const cost = n(fd.totalCostOfStores), sale = n(fd.totalSaleValue);
    if (!cost || !sale) return null;
    return (((sale - cost) / cost) * 100).toFixed(1);
  })();

  const [tagInput, setTagInput]       = useState("");
  const [doctorInput, setDoctorInput] = useState("");

  // custom role handlers
  const handleAddCustomRole = (newRole) => {
    if (customRoles.some(r => r.key === newRole.key)) {
      show(`Role "${newRole.key}" already exists`, "error"); return;
    }
    setCustomRoles(prev => [...prev, newRole]);
  };
  const handleDeleteCustomRole = (idx) => {
    if (!window.confirm("Remove this custom role?")) return;
    setCustomRoles(prev => prev.filter((_, i) => i !== idx));
  };

  const mainRoles  = ROLE_RATES_CONFIG.filter(r => r.group === "main");
  const mrRoles    = ROLE_RATES_CONFIG.filter(r => r.group === "mr");
  const mrFilled   = mrRoles.filter(r   => parseFloat(fd[r.rateKey])    > 0).length;
  const custFilled = customRoles.filter(r => parseFloat(fd[r.rateKey])  > 0).length;

  return (
    <Box sx={{ bgcolor: "#f0f4f8", minHeight: "100vh", pb: 10 }}>
      {/* Toast */}
      <Box sx={{ position: "fixed", top: 80, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 1 }}>
        {toasts.map((t) => (
          <Alert key={t.id} severity={t.severity} variant="filled" sx={{ minWidth: 280, boxShadow: 3 }}>{t.msg}</Alert>
        ))}
      </Box>

      {/* Header */}
      <Paper elevation={4} sx={{ borderRadius: 0, background: "linear-gradient(135deg,#1565c0,#0d47a1)", color: "white", px: 3, py: 2 }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,.2)", width: 48, height: 48 }}><InventoryIcon /></Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{editProductId ? "Edit Product" : "Add New Product"}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Pharmaceutical Product Management</Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Chip icon={<AccessTimeIcon />} label={currentDateTime.toLocaleString()}
                sx={{ bgcolor: "rgba(255,255,255,.15)", color: "white", "& .MuiChip-icon": { color: "white" } }} />
              {margin && <Chip label={`Margin: ${margin}%`} sx={{ bgcolor: n(margin) > 0 ? "rgba(76,175,80,.3)" : "rgba(244,67,54,.3)", color: "white" }} />}
              <Button variant="contained" startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={submitting} onClick={handleSubmit}
                sx={{ bgcolor: "white", color: "#1565c0", fontWeight: 700, "&:hover": { bgcolor: "#e3f2fd" }, px: 3 }}>
                {submitting ? "Saving..." : editProductId ? "Update" : "Save Product"}
              </Button>
            </Box>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <form onSubmit={handleSubmit}>
              {isBulkManufacturingDesk && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
                  Bulk-manufacturing products appear on the public website only after you assign at least one section in <strong>Category, Sections &amp; Tags</strong>.
                </Alert>
              )}

              {/* 1. Media */}
              <Accordion {...accordion("panel1")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#e3f2fd", width: 32, height: 32 }}><PhotoCameraIcon color="primary" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Product Media</Typography>
                    {fd.images.length > 0 && <Chip label={`${fd.images.length} image(s)`} size="small" color="success" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={7}>
                      <FileUploadArea title="Product Images (multiple)" accept="image/*" multiple onFilesSelect={(files) => set("images", files)}
                        icon={<PhotoCameraIcon sx={{ fontSize: 40, color: "#1565c0" }} />} type="image" />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <FileUploadArea title="Product Video" accept="video/*" multiple={false} onFilesSelect={(files) => set("video", files)}
                        icon={<VideocamIcon sx={{ fontSize: 40, color: "#1565c0" }} />} type="video" />
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
                      { label:"Manufacturer *", field:"manufacturer", md:4 },
                      { label:"Brand Name *",   field:"brandName",    md:4 },
                      { label:"Generic Compositions", field:"genericCompositions", md:4 },
                      { label:"Total Stocks *", field:"totalStocks", type:"number", md:3 },
                      { label:"HSN Code *",     field:"hsn",         md:3 },
                      { label:"Batch Number",   field:"batchNumber", md:3 },
                      { label:"Product Weight (g)", field:"productWeight", type:"number", md:3 },
                      { label:"Date of Effect", field:"batchDateEffect", type:"date", md:3 },
                      { label:"Expiry Date",    field:"expiryDate",  type:"date", md:3 },
                      { label:"Case Box Package", field:"caseBoxPackage", md:3 },
                      { label:"Package Type",   field:"packageType", md:3 },
                    ].map(({ label, field, type, md }) => (
                      <Grid item xs={12} md={md} key={field}>
                        <TextField fullWidth label={label} type={type || "text"}
                          InputLabelProps={type === "date" ? { shrink: true } : undefined}
                          value={fd[field]} onChange={(e) => set(field, e.target.value)} />
                      </Grid>
                    ))}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Injection Types</Typography>
                      <Box display="flex" gap={1}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Select</InputLabel>
                          <Select value={selectedInjType} label="Select" onChange={(e) => setSelectedInjType(e.target.value)}>
                            {["Vials","Ampoules","Cartridges","Prefilled Syringes","Infusions"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button variant="contained" size="small" onClick={() => { if (!selectedInjType || injectionTypes.includes(selectedInjType)) return; setInjectionTypes([...injectionTypes, selectedInjType]); setSelectedInjType(""); }}>Add</Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                        {injectionTypes.map((t, i) => <Chip key={i} label={t} size="small" color="primary" variant="outlined" onDelete={() => setInjectionTypes(injectionTypes.filter((_, j) => j !== i))} />)}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Tablet / Capsule Types</Typography>
                      <Box display="flex" gap={1}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Select</InputLabel>
                          <Select value={selectedTabType} label="Select" onChange={(e) => setSelectedTabType(e.target.value)}>
                            {["Blisters","Strips","Bottles","Alu-Alu","Sachets"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button variant="contained" size="small" color="secondary" onClick={() => { if (!selectedTabType || tabletTypes.includes(selectedTabType)) return; setTabletTypes([...tabletTypes, selectedTabType]); setSelectedTabType(""); }}>Add</Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                        {tabletTypes.map((t, i) => <Chip key={i} label={t} size="small" color="secondary" variant="outlined" onDelete={() => setTabletTypes(tabletTypes.filter((_, j) => j !== i))} />)}
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 3. Pricing */}
              <Accordion {...accordion("panel3")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#fce4ec", width: 32, height: 32 }}><CurrencyRupeeIcon color="error" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Pricing &amp; Costing</Typography>
                    {fd.mrp && <Chip label={`MRP ₹${fd.mrp}`} size="small" color="error" variant="outlined" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Grid container spacing={2}>
                    {[
                      { label:"Min Rate Fixed", field:"minRateFixed" },
                      { label:"MRP *",          field:"mrp" },
                      { label:"AMP (Actual Mfr Price)", field:"amp" },
                      { label:"Case Pack Price",field:"casePackPrice" },
                    ].map(({ label, field }) => (
                      <Grid item xs={12} md={3} key={field}>
                        <TextField fullWidth label={label} type="number" value={fd[field]} onChange={(e) => set(field, e.target.value)}
                          InputProps={{ startAdornment:<InputAdornment position="start">₹</InputAdornment> }} />
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p:2, bgcolor:"#f8f9fa", borderRadius:2 }}>
                        <Typography variant="caption" color="text.secondary" mb={1} display="block">
                          <CalculateIcon sx={{ fontSize:14, mr:0.5 }} />Auto-Calculated
                        </Typography>
                        <Grid container spacing={2}>
                          {[
                            { label:"Total Cost of Stores", value:fd.totalCostOfStores, helper:"AMP × Stocks" },
                            { label:"Total Actual Value",   value:fd.totalActualValue,  helper:"MRP × Stocks" },
                            { label:"B2C Sale Total",       value:fd.totalSaleValue,    helper:"B2C Rate × Stocks" },
                          ].map(({ label, value, helper }) => (
                            <Grid item xs={12} md={4} key={label}>
                              <TextField fullWidth label={label} value={`₹ ${value}`} InputProps={{ readOnly:true }} sx={{ bgcolor:"#fff" }} helperText={helper} />
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 4. Discounts & Sales Rates — NEW RATE-FIRST DESIGN */}
              <Accordion {...accordion("panel4")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Avatar sx={{ bgcolor: "#ede7f6", width: 32, height: 32 }}><PercentIcon color="secondary" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Discounts &amp; Sales Rates (All Roles)</Typography>
                    <Chip label={`${mainRoles.filter(r => parseFloat(fd[r.rateKey]) > 0).length}/8 main`} size="small" />
                    {mrFilled   > 0 && <Chip label={`${mrFilled}/14 MR`}   size="small" color="primary" />}
                    {custFilled > 0 && <Chip label={`${custFilled} custom`} size="small" color="secondary" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Alert severity="info" icon={<CalculateIcon />} sx={{ mb: 2, py: 0.5 }}>
                    Enter the <strong>Sale Rate (₹)</strong> for each role. Discount&nbsp;% and total value are auto-calculated from MRP.
                  </Alert>

                  {/* Toolbar */}
                  <Box display="flex" justifyContent="flex-end" gap={1} mb={2} flexWrap="wrap">
                    {customRoles.length > 0 && (
                      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setManageRoleOpen(true)}>
                        Manage Custom ({customRoles.length})
                      </Button>
                    )}
                    <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setAddRoleOpen(true)}
                      sx={{ background: "linear-gradient(135deg,#1565c0,#0d47a1)" }}>
                      + Add More Categories
                    </Button>
                  </Box>

                  <Stack spacing={2}>
                    {/* ── 8 standard roles ── */}
                    {mainRoles.map(config => (
                      <RoleRateCard key={config.key} config={config}
                        mrp={fd.mrp} stocks={fd.totalStocks}
                        rateValue={fd[config.rateKey]}
                        totalValue={config.totalKey ? fd[config.totalKey] : null}
                        onChange={val => set(config.rateKey, val)} />
                    ))}

                    {/* ── Custom roles ── */}
                    {customRoles.length > 0 && (
                      <>
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <Divider sx={{ flex: 1 }} />
                          <Chip label={`Custom Roles (${customRoles.length})`} size="small" color="secondary" />
                          <Divider sx={{ flex: 1 }} />
                        </Box>
                        {customRoles.map((config, idx) => (
                          <RoleRateCard key={config.key} config={config}
                            mrp={fd.mrp} stocks={fd.totalStocks}
                            rateValue={fd[config.rateKey] || ""}
                            totalValue={null}
                            onChange={val => set(config.rateKey, val)}
                            onDelete={() => handleDeleteCustomRole(idx)} />
                        ))}
                      </>
                    )}

                    {/* ── MR Levels L1–L14 (collapsible) ── */}
                    <Accordion defaultExpanded={mrFilled > 0}
                      sx={{ border: "1.5px solid #b0bec5", borderRadius: "8px !important", "&:before": { display: "none" } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#f5f7fa" }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <PersonIcon color="action" />
                          <Typography fontWeight={700}>Marketing Agents (L1 – L14)</Typography>
                          <Chip label={`${mrFilled} rates set`} size="small" color={mrFilled > 0 ? "primary" : "default"} />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ bgcolor: "#fafafa" }}>
                        <Alert severity="info" sx={{ mb: 2, py: 0.5, fontSize: 12 }}>
                          Set individual sale rates per marketing-agent level. Discount&nbsp;% is auto-shown next to each rate.
                        </Alert>
                        <Grid container spacing={2}>
                          {mrRoles.map(config => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={config.key}>
                              <RoleRateCard compact config={config}
                                mrp={fd.mrp} stocks={fd.totalStocks}
                                rateValue={fd[config.rateKey]}
                                totalValue={null}
                                onChange={val => set(config.rateKey, val)} />
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Add Role Dialogs */}
              <AddRoleDialog open={addRoleOpen} onClose={() => setAddRoleOpen(false)} onAdd={handleAddCustomRole} />
              <ManageRolesDialog open={manageRoleOpen} onClose={() => setManageRoleOpen(false)}
                customRoles={customRoles} onDelete={handleDeleteCustomRole} />

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
                  <GSTSection gstRate={gstRate} onGstRateChange={handleGstRateChange} gstValues={gstValues}
                    gstExpiry={fd.gstDateEffect} onExpiryChange={(v) => set("gstDateEffect", v)} />
                </AccordionDetails>
              </Accordion>

              {/* 6. Offers */}
              <Accordion {...accordion("panel6")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#fff8e1", width: 32, height: 32 }}><LocalOfferIcon color="warning" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Offers, Schemes &amp; Coupons</Typography>
                    <Chip label={`${fd.offersWithIcon.length} offers · ${coupons.length} coupons`} size="small" color="warning" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={3}>
                    <OffersManager offers={fd.offersWithIcon} onChange={(v) => set("offersWithIcon", v)} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Scheme I" placeholder="e.g. Buy 2 Get 1 Free" value={fd.scheme1} onChange={(e) => set("scheme1", e.target.value)}
                          InputProps={{ startAdornment:<InputAdornment position="start"><LoyaltyIcon /></InputAdornment> }} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Scheme II" placeholder="e.g. Extra 5% on bulk" value={fd.scheme2} onChange={(e) => set("scheme2", e.target.value)}
                          InputProps={{ startAdornment:<InputAdornment position="start"><LoyaltyIcon /></InputAdornment> }} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Additional Offers / Notes" value={fd.additionalOffers} onChange={(e) => set("additionalOffers", e.target.value)} />
                      </Grid>
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
                    <Typography fontWeight={700}>Variants, Combos &amp; Specifications</Typography>
                    <Chip label={`${variants.length} variant · ${combos.length} combo · ${combinations.length} attr-combo · ${specifications.length} spec`} size="small" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="subtitle1" fontWeight={700}>Simple Variants (Pack Sizes)</Typography>
                        <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setVariants([...variants, { name: "", price: "", stock: "" }])}>Add</Button>
                      </Box>
                      {variants.map((v, i) => (
                        <Grid container spacing={2} key={i} sx={{ mb: 1 }} alignItems="center">
                          <Grid item xs={4}><TextField fullWidth size="small" label="Pack Name" value={v.name} onChange={(e) => { const a=[...variants]; a[i].name=e.target.value; setVariants(a); }} /></Grid>
                          <Grid item xs={3}><TextField fullWidth size="small" label="Price" type="number" value={v.price} onChange={(e) => { const a=[...variants]; a[i].price=e.target.value; setVariants(a); }} InputProps={{ startAdornment:<InputAdornment position="start">₹</InputAdornment> }} /></Grid>
                          <Grid item xs={3}><TextField fullWidth size="small" label="Stock" type="number" value={v.stock} onChange={(e) => { const a=[...variants]; a[i].stock=e.target.value; setVariants(a); }} /></Grid>
                          <Grid item xs={2}><IconButton color="error" onClick={() => setVariants(variants.filter((_, j) => j !== i))} disabled={variants.length === 1}><DeleteIcon /></IconButton></Grid>
                        </Grid>
                      ))}
                    </Box>
                    <Divider />
                    <ProductComboBuilder combos={combos} onChange={setCombos}
                      currentProduct={editProductId ? { _id: editProductId, brandName: fd.brandName, mrp: fd.mrp, images: [] } : null}
                      authTokenKey={authTokenKey} productSearchPath={productSearchPath} />
                    <Divider />
                    <CombinationBuilder combinations={combinations} onChange={setCombinations} />
                    <Divider />
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="subtitle1" fontWeight={700}>Specifications</Typography>
                        <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setSpecifications([...specifications, { key: "", value: "" }])}>Add</Button>
                      </Box>
                      {specifications.map((spec, i) => (
                        <Grid container spacing={2} key={i} sx={{ mb: 1 }} alignItems="center">
                          <Grid item xs={5}><TextField fullWidth size="small" label="Property" value={spec.key} onChange={(e) => { const s=[...specifications]; s[i].key=e.target.value; setSpecifications(s); }} /></Grid>
                          <Grid item xs={6}><TextField fullWidth size="small" label="Value" value={spec.value} onChange={(e) => { const s=[...specifications]; s[i].value=e.target.value; setSpecifications(s); }} /></Grid>
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
                    <Typography fontWeight={700}>Category, Sections &amp; Tags</Typography>
                    {sections.length > 0 && <Chip label={`${sections.length} section(s)`} size="small" color="primary" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={3}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Main Category *</InputLabel>
                          <Select value={selectedMainCat} label="Main Category *" onChange={(e) => setSelectedMainCat(e.target.value)}>
                            <MenuItem value="" disabled><em>{mainCategories.length === 0 ? "Loading..." : "Select category"}</em></MenuItem>
                            {mainCategories.map((c) => {
                              const isSub = subCatIds.has(c._id);
                              return (
                                <MenuItem key={c._id} value={c._id} sx={isSub ? { pl: 3.5, bgcolor: "#fafafa" } : {}}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {isSub && <Chip label="SUB" size="small" sx={{ height:15, fontSize:9, fontWeight:800, bgcolor:"#e3f2fd", color:"#1565c0", borderRadius:"3px", "& .MuiChip-label":{ px:0.75, py:0 } }} />}
                                    <Typography variant="body2" sx={{ color:isSub?"text.secondary":"text.primary", fontStyle:isSub?"italic":"normal" }}>
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
                          <Select value={selectedSubCat} label="Sub Category (optional)" onChange={(e) => setSelectedSubCat(e.target.value)}>
                            <MenuItem value=""><em>None</em></MenuItem>
                            {subCategories.map((s) => <MenuItem key={s._id} value={s._id}>{s.title}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                      {!hideFranchiseZoneField && (
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>{franchiseZonesLoading ? "Loading franchise zones..." : "Franchise Fulfilment Zone"}</InputLabel>
                            <Select value={selectedFranchiseZone} label="Franchise Fulfilment Zone" onChange={(e) => setSelectedFranchiseZone(e.target.value)}>
                              <MenuItem value=""><em>No franchise routing</em></MenuItem>
                              {franchiseZones.map((zone) => (
                                <MenuItem key={zone._id} value={zone._id}>
                                  {zone.name}{zone.pincodes?.length ? ` (${zone.pincodes.length} pincodes)` : ""}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                    </Grid>
                    <Divider />
                    <SectionsManager sections={sections} onChange={setSections} />
                    <Divider />
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle2" fontWeight={700}>Home Page Sections</Typography>
                        {selectedHomeSections.length > 0 && <Chip label={`${selectedHomeSections.length} selected`} size="small" color="secondary" />}
                      </Box>
                      <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: 12 }}>Select home page sections where this product should appear.</Alert>
                      {availableHomeSections.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">No home sections found — ensure the home sections API is available.</Typography>
                      ) : (
                        <FormControl fullWidth>
                          <InputLabel>Home Page Sections</InputLabel>
                          <Select multiple value={selectedHomeSections} label="Home Page Sections"
                            onChange={(e) => setSelectedHomeSections(e.target.value)}
                            renderValue={(selected) => (
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {selected.map((sKey) => {
                                  const sec = availableHomeSections.find((s) => (s.key || s.slug || s.title?.toLowerCase().replace(/\s+/g,"-")) === sKey);
                                  return <Chip key={sKey} label={sec?.title || sec?.name || sKey} size="small" color="secondary" />;
                                })}
                              </Box>
                            )}>
                            {availableHomeSections.map((s) => {
                              const sKey   = s.key || s.slug || s.title?.toLowerCase().replace(/\s+/g,"-");
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
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>SEO Tags</Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <TextField fullWidth size="small" placeholder="Type tag and press Enter" value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key !== "Enter") return; e.preventDefault(); if (!tagInput.trim()) return; set("tags", [...fd.tags, tagInput.trim()]); setTagInput(""); }} />
                        <Button onClick={() => { if (!tagInput.trim()) return; set("tags", [...fd.tags, tagInput.trim()]); setTagInput(""); }} variant="outlined" size="small">Add</Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {fd.tags.map((tag, i) => <Chip key={i} label={tag} onDelete={() => set("tags", fd.tags.filter((_, j) => j !== i))} size="small" />)}
                      </Box>
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
                      { label:"Product Description (shown in Description tab)", field:"description", rows:5 },
                      { label:"More Information / Short Description", field:"moreInformation", rows:4 },
                      { label:"Disclaimer", field:"disclaimer", rows:3 },
                    ].map(({ label, field, rows }) => (
                      <Box key={field}>
                        <Typography variant="subtitle2" fontWeight={600} mb={1}>{label}</Typography>
                        <TextField fullWidth multiline rows={rows} value={fd[field]} onChange={(e) => set(field, e.target.value)} placeholder={`Enter ${label}...`} />
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* 10. Author Details */}
              <Accordion {...accordion("panel10")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#e8f5e9", width: 32, height: 32 }}><PersonIcon color="success" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Author Details &amp; Marketer Info</Typography>
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
                        { label:"Marketer Name",    field:"marketerName",    md:6 },
                        { label:"Country of Origin",field:"countryOfOrigin", md:6 },
                        { label:"Marketer Address", field:"marketerAddress", md:12 },
                        { label:"Last Updated",     field:"lastUpdated",     md:6 },
                      ].map(({ label, field, md }) => (
                        <Grid item xs={12} md={md} key={field}>
                          <TextField fullWidth label={label} value={fd[field]} onChange={(e) => set(field, e.target.value)} size="small" />
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
                    <Typography fontWeight={700}>Ratings &amp; Reviews</Typography>
                    <Rating value={fd.productRating} readOnly size="small" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Overall Product Rating</Typography>
                      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                        <Rating size="large" precision={0.5} value={parseFloat(fd.productRating) || 0}
                          onChange={(_, v) => set("productRating", v ?? 0)} />
                        <TextField size="small" type="number" label="Manual Rating (0-5)" value={fd.productRating}
                          onChange={(e) => set("productRating", Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
                          inputProps={{ min: 0, max: 5, step: 0.1 }} sx={{ width: 160 }}
                          InputProps={{ endAdornment:<InputAdornment position="end">/ 5</InputAdornment> }} />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>Top Review from India</Typography>
                      <TextField fullWidth multiline rows={3} value={fd.topReviewFromIndia} onChange={(e) => set("topReviewFromIndia", e.target.value)} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Doctor Feedbacks</Typography>
                      <Box display="flex" gap={1} mb={1.5}>
                        <TextField fullWidth size="small" multiline rows={2} placeholder="Doctor feedback..." value={doctorInput} onChange={(e) => setDoctorInput(e.target.value)} />
                        <Button variant="contained" size="small" onClick={() => {
                          if (!doctorInput.trim()) return;
                          set("doctorFeedbacks", [...fd.doctorFeedbacks, { id: Date.now(), feedback: doctorInput.trim(), date: new Date().toLocaleDateString(), doctor: "Dr. Anonymous" }]);
                          setDoctorInput("");
                        }} sx={{ alignSelf: "flex-end" }}>Add</Button>
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
                    <Avatar sx={{ bgcolor: fd.isOTC ? "#e8f5e9" : "#ffebee", width: 32, height: 32 }}>
                      <WarningIcon color={fd.isOTC ? "success" : "error"} sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography fontWeight={700}>Status &amp; Prescription</Typography>
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
                          <Select value={fd.currentStatus1} label="Visibility Status" onChange={(e) => set("currentStatus1", e.target.value)}>
                            <MenuItem value="active"><Chip label="Active — visible to users" color="success" size="small" /></MenuItem>
                            <MenuItem value="inactive"><Chip label="Inactive — hidden" size="small" /></MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Display Mode</InputLabel>
                          <Select value={fd.currentStatus2} label="Display Mode" onChange={(e) => set("currentStatus2", e.target.value)}>
                            <MenuItem value="appear">Appear on storefront</MenuItem>
                            <MenuItem value="disappear">Disappear from storefront</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, border: `2px solid ${fd.isOTC ? "#4caf50" : "#f44336"}` }}>
                      <RadioGroup row value={String(fd.isOTC)} onChange={(e) => set("isOTC", e.target.value === "true")}>
                        <FormControlLabel value="true" control={<Radio color="success" />}
                          label={<Box><Typography fontWeight={700} color="success.main">OTC / Over-the-Counter</Typography><Typography variant="caption" color="text.secondary">No prescription required</Typography></Box>}
                          sx={{ mr: 4 }} />
                        <FormControlLabel value="false" control={<Radio color="error" />}
                          label={<Box><Typography fontWeight={700} color="error.main">Rx — Prescription Required</Typography><Typography variant="caption" color="text.secondary">Customer must upload prescription</Typography></Box>} />
                      </RadioGroup>
                    </Paper>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* 13. Recommendations & Certifications */}
              <Accordion {...accordion("panel13")} sx={{ mb: 2, borderRadius: "12px !important", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fff" }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#e8f5e9", width: 32, height: 32 }}><VerifiedIcon color="success" sx={{ fontSize: 18 }} /></Avatar>
                    <Typography fontWeight={700}>Recommendations &amp; Certifications</Typography>
                    <Chip label={`${recommendations.length} rec · ${certifications.length} cert`} size="small" color="success" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#fff", pt: 0 }}>
                  <RecommendationsManager recommendations={recommendations} certifications={certifications}
                    onRecommendChange={setRecommendations} onCertChange={setCertifications} />
                </AccordionDetails>
              </Accordion>

              {/* QR Code */}
              {fd.brandName && (
                <Box sx={{ mb: 3 }}>
                  <ProductQRCode product={{ _id: editProductId || "preview", brandName: fd.brandName, manufacturer: fd.manufacturer, mrp: fd.mrp, expiryDate: fd.expiryDate, batchNumber: fd.batchNumber, gst_igst: gstRate }} />
                </Box>
              )}

              {/* Submit */}
              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap" sx={{ mt: 3 }}>
                <Button type="submit" variant="contained" size="large"
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={submitting}
                  sx={{ px: 6, py: 1.5, fontSize: "1rem", fontWeight: 700, borderRadius: 3, background: "linear-gradient(135deg,#1565c0,#0d47a1)" }}>
                  {submitting ? "Saving…" : editProductId ? "Update Product" : "Save & Publish"}
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
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, opacity: 0.9 }}>📊 Live Pricing Summary</Typography>
                  <Grid container spacing={1.5}>
                    {[
                      { label:"MRP",          value:`₹ ${fd.mrp || "0"}`,              color:"white"    },
                      { label:"AMP",          value:`₹ ${fd.amp || "0"}`,              color:"#90caf9"  },
                      { label:"B2C (PTR)",    value:`₹ ${fd.saleRatePTR || "—"}`,      color:"#a5d6a7"  },
                      { label:"B2B Rate",     value:`₹ ${fd.b2bRate     || "—"}`,      color:"#ce93d8"  },
                      { label:"Wholesale",    value:`₹ ${fd.wholesaleSaleRate || "—"}`, color:"#ffcc80" },
                      { label:"Hospital",     value:`₹ ${fd.hospitalSaleRate  || "—"}`, color:"#80cbc4" },
                      { label:"Pharmacy",     value:`₹ ${fd.pharmacySaleRate  || "—"}`, color:"#a5d6a7" },
                      { label:"Vendor",       value:`₹ ${fd.vendorRate        || "—"}`, color:"#f48fb1" },
                      { label:"Franchise",    value:`₹ ${fd.franchiseRate     || "—"}`, color:"#ffcc80" },
                      { label:"Manufacturer", value:`₹ ${fd.manufacturerRate  || "—"}`, color:"#b0bec5" },
                      { label:"Total Stocks", value: fd.totalStocks || "0",             color:"white"   },
                      { label:"Coupons",      value:`${coupons.length} active`,          color:"#f48fb1" },
                      { label:"Combos",       value:`${combos.length} bundle(s)`,        color:"#a5d6a7" },
                      { label:"MR Rates",     value:`${Array.from({length:14},(_,i)=>fd[`mrL${i+1}Rate`]).filter(Boolean).length}/14 set`, color:"#b0bec5" },
                      { label:"Custom Roles", value:`${customRoles.length} role(s)`,     color:"#ce93d8" },
                      { label:"Recs",         value:`${recommendations.length} rec · ${certifications.length} cert`, color:"#90caf9" },
                    ].map((item) => (
                      <Grid item xs={6} key={item.label}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(255,255,255,.1)" }}>
                          <Typography variant="caption" sx={{ opacity: 0.75, display: "block" }}>{item.label}</Typography>
                          <Typography fontWeight={700} sx={{ color: item.color, fontSize: ".9rem" }}>{item.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  {margin !== null && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: n(margin) >= 20 ? "rgba(76,175,80,.3)" : "rgba(244,67,54,.3)", textAlign: "center" }}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Gross Margin (B2C)</Typography>
                      <Typography variant="h4" fontWeight={700}>{margin}%</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Completeness */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>📝 Completeness</Typography>
                  {(() => {
                    const checks = [
                      { label:"Manufacturer",  done:!!fd.manufacturer },
                      { label:"Brand Name",    done:!!fd.brandName },
                      { label:"Category",      done:!!selectedMainCat },
                      { label:"MRP & AMP",     done:!!(fd.mrp && fd.amp) },
                      { label:"Stocks & HSN",  done:!!(fd.totalStocks && fd.hsn) },
                      { label:"GST Rate",      done:!!gstRate },
                      { label:"Images",        done:fd.images.length > 0 },
                      { label:"Description",   done:!!fd.description },
                      { label:"B2C Rate",      done:!!fd.saleRatePTR },
                      { label:"Author Details",done:authors.length > 0 },
                      { label:"Coupons",       done:coupons.length > 0 },
                      { label:"Certifications",done:certifications.length > 0 },
                    ];
                    const done = checks.filter((c) => c.done).length;
                    const pct  = Math.round((done / checks.length) * 100);
                    return (
                      <>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="caption" color="text.secondary">{done}/{checks.length} complete</Typography>
                          <Typography variant="caption" fontWeight={700} color={pct === 100 ? "success.main" : "primary.main"}>{pct}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct} sx={{ borderRadius: 4, height: 8, mb: 2 }} color={pct === 100 ? "success" : "primary"} />
                        <Stack spacing={0.5}>
                          {checks.map((c) => (
                            <Box key={c.label} display="flex" alignItems="center" gap={1}>
                              {c.done
                                ? <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                                : <Box sx={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid #ccc" }} />}
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

      <Fab color="primary" size="medium" sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <ArrowUpwardIcon />
      </Fab>
    </Box>
  );
};

export default PharmaProductForm;