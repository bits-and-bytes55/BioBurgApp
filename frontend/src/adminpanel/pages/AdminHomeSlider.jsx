import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  Box, Button, Paper, Typography, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Snackbar, CircularProgress,
  Tooltip, Divider, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import {
  Delete, Visibility, VisibilityOff, Crop, AspectRatio,
  Check, Close, Refresh, Upload, PhotoSizeSelectLarge,
} from "@mui/icons-material";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL;

const DIMENSION_PRESETS = [
  { label: "Full Banner", w: 1920, h: 600 },
  { label: "Wide",        w: 1440, h: 500 },
  { label: "Square",      w: 800,  h: 800 },
  { label: "Portrait",    w: 600,  h: 900 },
  { label: "Story",       w: 1080, h: 1920 },
];

// ─────────────────────────────────────────────────────────────
// CropModal  –  fixed pixel-accurate crop
// ─────────────────────────────────────────────────────────────
function CropModal({ open, imageUrl, onClose, onSave }) {
  const containerRef = useRef(null);
  const imgRef       = useRef(null);
  const canvasRef    = useRef(null);
  const dragRef      = useRef(null);

  // crop box in DISPLAY pixels (relative to the rendered <img> element)
  const [crop, setCrop]     = useState({ x: 60, y: 40, w: 300, h: 160 });
  const [imgRect, setImgRect] = useState(null); // bounding rect of the img tag
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (open) {
      setCrop({ x: 60, y: 40, w: 300, h: 160 });
      setImgLoaded(false);
      setImgRect(null);
    }
  }, [open, imageUrl]);

  // After image loads, record its rendered bounding rect
  const handleImgLoad = () => {
    if (imgRef.current) {
      const r = imgRef.current.getBoundingClientRect();
      setImgRect(r);
      // Start crop box centered in displayed image
      const w = Math.round(r.width  * 0.6);
      const h = Math.round(r.height * 0.5);
      const x = Math.round((r.width  - w) / 2);
      const y = Math.round((r.height - h) / 2);
      setCrop({ x, y, w, h });
    }
    setImgLoaded(true);
  };

  // Recalculate imgRect on resize
  useEffect(() => {
    const recalc = () => {
      if (imgRef.current && imgLoaded) {
        setImgRect(imgRef.current.getBoundingClientRect());
      }
    };
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [imgLoaded]);

  // ── Drag handlers (attached to window so leaving container doesn't break) ──
  const onMouseDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { type, startX: e.clientX, startY: e.clientY, ...crop };
  };

  const onMouseMove = useCallback((e) => {
    if (!dragRef.current || !imgRef.current) return;
    const { type, startX, startY, x, y, w, h } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const iw = imgRef.current.getBoundingClientRect().width;
    const ih = imgRef.current.getBoundingClientRect().height;

    if (type === "move") {
      setCrop(c => ({
        ...c,
        x: Math.max(0, Math.min(iw - c.w, x + dx)),
        y: Math.max(0, Math.min(ih - c.h, y + dy)),
      }));
    }
    if (type === "resize-br") {
      setCrop(c => ({
        ...c,
        w: Math.max(60, Math.min(iw - c.x, w + dx)),
        h: Math.max(40, Math.min(ih - c.y, h + dy)),
      }));
    }
    if (type === "resize-tr") {
      const newH = Math.max(40, h - dy);
      const newY = Math.min(y + h - 40, y + dy);
      setCrop(c => ({
        ...c,
        w: Math.max(60, Math.min(iw - c.x, w + dx)),
        h: newH,
        y: Math.max(0, newY),
      }));
    }
    if (type === "resize-bl") {
      const newW = Math.max(60, w - dx);
      const newX = Math.min(x + w - 60, x + dx);
      setCrop(c => ({
        ...c,
        w: newW,
        h: Math.max(40, Math.min(ih - c.y, h + dy)),
        x: Math.max(0, newX),
      }));
    }
    if (type === "resize-tl") {
      const newW = Math.max(60, w - dx);
      const newH = Math.max(40, h - dy);
      setCrop(c => ({
        ...c,
        w: newW,
        h: newH,
        x: Math.max(0, Math.min(x + w - 60, x + dx)),
        y: Math.max(0, Math.min(y + h - 40, y + dy)),
      }));
    }
  }, []);

  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  useEffect(() => {
    if (open) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup",   onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [open, onMouseMove, onMouseUp]);

  // ── Apply crop: map display-px → natural-px ──
  const applyCrop = () => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;

    // Scale factor: natural size vs rendered size
    const scaleX = img.naturalWidth  / img.getBoundingClientRect().width;
    const scaleY = img.naturalHeight / img.getBoundingClientRect().height;

    const sx = Math.round(crop.x * scaleX);
    const sy = Math.round(crop.y * scaleY);
    const sw = Math.round(crop.w * scaleX);
    const sh = Math.round(crop.h * scaleY);

    canvas.width  = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob(blob => { if (blob) onSave(blob); }, "image/jpeg", 0.92);
  };

  // Corner handle helper
  const cornerStyle = (pos) => {
    const base = {
      position: "absolute", width: 14, height: 14,
      bgcolor: "#38bdf8", border: "2px solid #fff",
      borderRadius: 0.5, zIndex: 10,
    };
    const map = {
      tl: { top: -6,  left: -6,  cursor: "nwse-resize" },
      tr: { top: -6,  right: -6, cursor: "nesw-resize" },
      bl: { bottom: -6, left: -6, cursor: "nesw-resize" },
      br: { bottom: -6, right: -6, cursor: "nwse-resize" },
    };
    return { ...base, ...map[pos] };
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, bgcolor: "#0f172a", userSelect: "none" } }}>
      <DialogTitle sx={{ color: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Crop sx={{ color: "#38bdf8" }} />
          <Typography fontWeight={700} color="#f1f5f9">Crop Image</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#94a3b8" }}><Close /></IconButton>
      </DialogTitle>

      {/* Info bar */}
      <Box sx={{ bgcolor: "#1e293b", px: 3, py: 1.5, display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
        <Typography fontSize={12} color="#94a3b8">
          Drag the box to move · Drag corners to resize
        </Typography>
        <Typography fontSize={12} color="#38bdf8" fontWeight={700} ml="auto">
          {Math.round(crop.w)} × {Math.round(crop.h)} px
        </Typography>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Image + crop overlay container */}
        <Box
          ref={containerRef}
          sx={{ position: "relative", bgcolor: "#020617", lineHeight: 0, overflow: "hidden" }}
        >
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              crossOrigin="anonymous"
              alt="crop source"
              onLoad={handleImgLoad}
              draggable={false}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "60vh",
                objectFit: "contain",
                display: "block",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          )}

          {imgLoaded && (
            <>
              {/* Dark overlay: 4 rects around crop box */}
              {/* Top */}
              <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: crop.y, bgcolor: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              {/* Bottom */}
              <Box sx={{ position: "absolute", top: crop.y + crop.h, left: 0, right: 0, bottom: 0, bgcolor: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              {/* Left */}
              <Box sx={{ position: "absolute", top: crop.y, left: 0, width: crop.x, height: crop.h, bgcolor: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              {/* Right */}
              <Box sx={{ position: "absolute", top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h, bgcolor: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />

              {/* Crop box */}
              <Box
                sx={{
                  position: "absolute",
                  left: crop.x, top: crop.y, width: crop.w, height: crop.h,
                  border: "2px solid #38bdf8",
                  boxSizing: "border-box",
                  cursor: "move",
                }}
                onMouseDown={e => onMouseDown(e, "move")}
              >
                {/* Rule-of-thirds grid lines */}
                {[33.33, 66.66].map(p => (
                  <Box key={p}>
                    <Box sx={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: "1px", bgcolor: "rgba(56,189,248,0.35)", pointerEvents: "none" }} />
                    <Box sx={{ position: "absolute", top: `${p}%`, left: 0, right: 0, height: "1px", bgcolor: "rgba(56,189,248,0.35)", pointerEvents: "none" }} />
                  </Box>
                ))}

                {/* 4 corner handles */}
                {[
                  { pos: "tl", type: "resize-tl" },
                  { pos: "tr", type: "resize-tr" },
                  { pos: "bl", type: "resize-bl" },
                  { pos: "br", type: "resize-br" },
                ].map(({ pos, type }) => (
                  <Box key={pos} sx={cornerStyle(pos)}
                    onMouseDown={e => { e.stopPropagation(); onMouseDown(e, type); }} />
                ))}

                {/* Edge midpoint handles */}
                <Box sx={{ position: "absolute", top: "50%", left: -5, transform: "translateY(-50%)", width: 10, height: 20, bgcolor: "#38bdf8", borderRadius: 0.5, cursor: "ew-resize" }}
                  onMouseDown={e => { e.stopPropagation(); onMouseDown(e, "resize-tl"); }} />
                <Box sx={{ position: "absolute", top: "50%", right: -5, transform: "translateY(-50%)", width: 10, height: 20, bgcolor: "#38bdf8", borderRadius: 0.5, cursor: "ew-resize" }}
                  onMouseDown={e => { e.stopPropagation(); onMouseDown(e, "resize-br"); }} />
              </Box>
            </>
          )}
        </Box>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </DialogContent>

      <DialogActions sx={{ bgcolor: "#1e293b", px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: "#94a3b8", textTransform: "none" }}>Cancel</Button>
        <Button variant="contained" onClick={applyCrop} startIcon={<Check />}
          disabled={!imgLoaded}
          sx={{ bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" }, textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
          Apply Crop
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// DimensionModal  –  fixed: applies immediately with live preview
// ─────────────────────────────────────────────────────────────
function DimensionModal({ open, slider, onClose, onSave }) {
  const [preset,    setPreset]    = useState("");
  const [customW,   setCustomW]   = useState(1920);
  const [customH,   setCustomH]   = useState(600);
  const [objectFit, setObjectFit] = useState("cover");

  useEffect(() => {
    if (slider) {
      setCustomW(slider.width     || 1920);
      setCustomH(slider.height    || 600);
      setObjectFit(slider.objectFit || "cover");
      setPreset("");
    }
  }, [slider]);

  const applyPreset = (p) => {
    setPreset(p.label);
    setCustomW(p.w);
    setCustomH(p.h);
  };

  const handleSave = () => {
    const w = Number(customW);
    const h = Number(customH);
    if (!w || !h || w < 1 || h < 1) return;
    onSave({ width: w, height: h, objectFit });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <AspectRatio color="primary" />
          <Typography fontWeight={700}>Set Dimensions &amp; Fit</Typography>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>

        {/* Presets */}
        <Typography fontSize={12} fontWeight={600} color="#64748b" mb={1.5} textTransform="uppercase" letterSpacing={1}>
          Preset Sizes
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
          {DIMENSION_PRESETS.map(p => (
            <Chip key={p.label}
              label={`${p.label} (${p.w}×${p.h})`}
              size="small"
              onClick={() => applyPreset(p)}
              sx={{
                cursor: "pointer",
                fontWeight: preset === p.label ? 700 : 400,
                bgcolor: preset === p.label ? "#0ea5e9" : "#f1f5f9",
                color:   preset === p.label ? "#fff"    : "#334155",
                "&:hover": { bgcolor: preset === p.label ? "#0284c7" : "#e2e8f0" },
              }}
            />
          ))}
        </Box>

        {/* Custom W × H */}
        <Typography fontSize={12} fontWeight={600} color="#64748b" mb={1.5} textTransform="uppercase" letterSpacing={1}>
          Custom (px)
        </Typography>
        <Box display="flex" gap={2} mb={3} alignItems="center">
          <TextField
            label="Width" type="number" size="small" value={customW}
            onChange={e => { setCustomW(e.target.value); setPreset(""); }}
            inputProps={{ min: 1 }} sx={{ flex: 1 }}
          />
          <Typography color="text.secondary" fontWeight={700}>×</Typography>
          <TextField
            label="Height" type="number" size="small" value={customH}
            onChange={e => { setCustomH(e.target.value); setPreset(""); }}
            inputProps={{ min: 1 }} sx={{ flex: 1 }}
          />
        </Box>

        {/* Object-fit */}
        <Typography fontSize={12} fontWeight={600} color="#64748b" mb={1.5} textTransform="uppercase" letterSpacing={1}>
          Image Fit
        </Typography>
        <ToggleButtonGroup
          value={objectFit} exclusive
          onChange={(_, v) => v && setObjectFit(v)}
          size="small"
        >
          {["cover","contain","fill","none"].map(f => (
            <ToggleButton key={f} value={f}
              sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, px: 2 }}>
              {f}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography fontSize={11} color="text.secondary" mt={1}>
          {objectFit === "cover"   && "Fills container – crops edges if needed (recommended for banners)"}
          {objectFit === "contain" && "Fits fully inside – may show empty space on sides"}
          {objectFit === "fill"    && "Stretches to fill exactly – may distort proportions"}
          {objectFit === "none"    && "Displays at original size – may overflow"}
        </Typography>

        {/* Live preview */}
        {slider?.image && (
          <Box mt={3}>
            <Typography fontSize={11} fontWeight={600} color="#64748b" mb={1} textTransform="uppercase" letterSpacing={1}>
              Live Preview
            </Typography>
            <Box sx={{
              borderRadius: 2, overflow: "hidden",
              border: "1px solid #e2e8f0",
              width: "100%",
              height: Math.round((customH / customW) * 500) || 120,
              maxHeight: 200,
              minHeight: 80,
              transition: "height 0.3s",
            }}>
              <img src={slider.image} alt="preview"
                style={{ width: "100%", height: "100%", objectFit, display: "block" }} />
            </Box>
            <Typography fontSize={11} color="#94a3b8" mt={0.5}>
              Aspect ratio preview: {customW} × {customH} px with object-fit: {objectFit}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<PhotoSizeSelectLarge />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" } }}
        >
          Save Dimensions
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// SliderCard  –  fixed MUI v6 Grid (no xs/sm/md/lg)
// ─────────────────────────────────────────────────────────────
function SliderCard({ slide, index, onDelete, onToggle, onCrop, onDimension }) {
  return (
    <Box sx={{
      borderRadius: 2, overflow: "hidden", border: "1px solid #e2e8f0",
      opacity: slide.isActive === false ? 0.6 : 1,
      transition: "all 0.2s",
      "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
      position: "relative",
    }}>
      {/* Active badge */}
      <Box sx={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}>
        <Chip
          label={slide.isActive === false ? "Inactive" : "Active"}
          size="small"
          sx={{
            fontSize: 10, fontWeight: 700,
            bgcolor: slide.isActive === false ? "#fef2f2" : "#f0fdf4",
            color:   slide.isActive === false ? "#dc2626" : "#16a34a",
            border: `1px solid ${slide.isActive === false ? "#fecaca" : "#bbf7d0"}`,
          }}
        />
      </Box>

      {/* Index badge */}
      <Box sx={{
        position: "absolute", top: 8, right: 8, zIndex: 2,
        bgcolor: "rgba(0,0,0,0.55)", borderRadius: "50%", width: 22, height: 22,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Typography fontSize={10} color="#fff" fontWeight={700}>{index + 1}</Typography>
      </Box>

      <img
        src={slide.image}
        alt={`Slider ${index + 1}`}
        style={{
          width: "100%",
          height: 140,
          objectFit: slide.objectFit || "cover",
          display: "block",
        }}
      />

      <Box sx={{ px: 1.5, pt: 1, pb: 0.5, bgcolor: "#f8fafc" }}>
        <Typography fontSize={11} color="#64748b">
          {slide.width && slide.height
            ? `${slide.width} × ${slide.height} px · ${slide.objectFit || "cover"}`
            : `Default · ${slide.objectFit || "cover"}`}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", p: 1, gap: 0.5, bgcolor: "#f8fafc" }}>
        <Tooltip title="Crop image">
          <IconButton size="small" onClick={() => onCrop(slide)}
            sx={{ flex: 1, borderRadius: 1.5, bgcolor: "#e0f2fe", "&:hover": { bgcolor: "#bae6fd" } }}>
            <Crop fontSize="small" sx={{ color: "#0284c7" }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Set dimensions">
          <IconButton size="small" onClick={() => onDimension(slide)}
            sx={{ flex: 1, borderRadius: 1.5, bgcolor: "#ede9fe", "&:hover": { bgcolor: "#ddd6fe" } }}>
            <AspectRatio fontSize="small" sx={{ color: "#7c3aed" }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={slide.isActive === false ? "Activate" : "Deactivate"}>
          <IconButton size="small" onClick={() => onToggle(slide)}
            sx={{
              flex: 1, borderRadius: 1.5,
              bgcolor: slide.isActive === false ? "#f0fdf4" : "#fffbeb",
              "&:hover": { bgcolor: slide.isActive === false ? "#dcfce7" : "#fef3c7" },
            }}>
            {slide.isActive === false
              ? <Visibility fontSize="small" sx={{ color: "#16a34a" }} />
              : <VisibilityOff fontSize="small" sx={{ color: "#d97706" }} />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(slide)}
            sx={{ flex: 1, borderRadius: 1.5, bgcolor: "#fef2f2", "&:hover": { bgcolor: "#fee2e2" } }}>
            <Delete fontSize="small" sx={{ color: "#dc2626" }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
export default function AdminHomeSlider() {
  const [sliders,        setSliders]        = useState([]);
  // localOverrides: { [_id]: { width, height, objectFit, image, isActive } }
  // These WIN over server data so refetches don't overwrite unsaved changes
  const [localOverrides, setLocalOverrides] = useState({});
  const [image,          setImage]          = useState("");
  const [fileName,       setFileName]       = useState("");
  const [uploading,      setUploading]      = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [snackbar,       setSnackbar]       = useState({ open: false, msg: "", sev: "success" });
  const [cropTarget,     setCropTarget]     = useState(null);
  const [dimTarget,      setDimTarget]      = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleting,       setDeleting]       = useState(false);

  const notify = (msg, sev = "success") => setSnackbar({ open: true, msg, sev });

  // Sliders merged with local overrides — local always wins
  const mergedSliders = sliders.map(s =>
    localOverrides[s._id] ? { ...s, ...localOverrides[s._id] } : s
  );

  const setOverride = (id, fields) =>
    setLocalOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...fields } }));

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_API}/api/home-sliders/admin`);
      const data = Array.isArray(res.data) ? res.data : [];
      setSliders(data);
      // Clear overrides where backend has caught up
      setLocalOverrides(prev => {
        const next = { ...prev };
        data.forEach(s => {
          const ov = next[s._id];
          if (!ov) return;
          const allMatch = Object.keys(ov).every(k => String(s[k]) === String(ov[k]));
          if (allMatch) delete next[s._id];
        });
        return next;
      });
    } catch { setSliders([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSliders(); }, []);

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadSlider = async () => {
    if (!image) return notify("Please select an image first.", "error");
    setUploading(true);
    try {
      await axios.post(`${BASE_API}/api/home-sliders/add`, { image });
      notify("✅ Slider uploaded!");
      setImage(""); setFileName("");
      fetchSliders();
    } catch (e) {
      notify(e.response?.data?.message || "Upload failed.", "error");
    } finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget._id;
    setDeleting(true);
    setDeleteTarget(null);
    try {
      await axios.delete(`${BASE_API}/api/home-sliders/${targetId}`);
      // Remove from local sliders state immediately
      setSliders(prev => prev.filter(s => s._id !== targetId));
      setLocalOverrides(prev => { const n = {...prev}; delete n[targetId]; return n; });
      notify("🗑️ Slider deleted.");
    } catch {
      notify("Delete failed.", "error");
    } finally { setDeleting(false); }
  };

  const handleToggle = async (slide) => {
    const newActive = slide.isActive !== false;  // flip: true→false, false→true
    const newVal = !newActive;
    // Optimistic override
    setOverride(slide._id, { isActive: newVal });
    try {
      await axios.patch(`${BASE_API}/api/home-sliders/${slide._id}/toggle`);
      notify(newVal ? "✅ Activated!" : "⏸️ Deactivated!");
    } catch {
      // Revert
      setOverride(slide._id, { isActive: slide.isActive });
      notify("Toggle failed.", "error");
    }
  };

  const handleSaveDimensions = async ({ width, height, objectFit }) => {
    const targetId = dimTarget._id;
    // ✅ Set override immediately — survives any subsequent fetchSliders
    setOverride(targetId, { width, height, objectFit });
    setDimTarget(null);
    try {
      await axios.patch(`${BASE_API}/api/home-sliders/${targetId}/dimensions`, { width, height, objectFit });
      notify(`📐 Saved: ${width}×${height} · ${objectFit}`);
    } catch (e) {
      // Revert override only on error
      setLocalOverrides(prev => {
        const next = { ...prev };
        if (next[targetId]) {
          delete next[targetId].width;
          delete next[targetId].height;
          delete next[targetId].objectFit;
        }
        return next;
      });
      notify(e.response?.data?.message || "Failed to save dimensions.", "error");
    }
  };

  const handleCropSave = (blob) => {
    const targetId = cropTarget._id;
    setCropTarget(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      // ✅ Override image immediately — card thumbnail updates instantly
      setOverride(targetId, { image: base64 });
      try {
        const res = await axios.patch(`${BASE_API}/api/home-sliders/${targetId}/crop`, { image: base64 });
        notify("✂️ Crop applied!");
        // Replace base64 override with cloudinary URL if returned
        if (res.data?.image) {
          setOverride(targetId, { image: res.data.image });
        }
      } catch {
        notify("Crop save failed.", "error");
        // Revert image override
        setLocalOverrides(prev => {
          const next = { ...prev };
          if (next[targetId]) delete next[targetId].image;
          return next;
        });
      }
    };
    reader.readAsDataURL(blob);
  };

  const active   = mergedSliders.filter(s => s.isActive !== false);
  const inactive = mergedSliders.filter(s => s.isActive === false);

  // Responsive column count via CSS
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 24,
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Home Page Slider</Typography>
          <Typography fontSize={13} color="text.secondary">Upload, crop, resize and manage homepage banners</Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Chip label={`${active.length} Active`} size="small"
            sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 700, border: "1px solid #bbf7d0" }} />
          <Chip label={`${inactive.length} Inactive`} size="small"
            sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, border: "1px solid #fecaca" }} />
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={fetchSliders} sx={{ bgcolor: "#f1f5f9" }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Upload row */}
      <Box sx={{
        p: 2.5, mb: 3, borderRadius: 2,
        border: "2px dashed #cbd5e1", bgcolor: "#f8fafc",
        display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap",
      }}>
        <input type="file" accept="image/*" onChange={handleImage} id="slider-file" style={{ display: "none" }} />
        <label htmlFor="slider-file">
          <Button variant="outlined" component="span"
            sx={{ textTransform: "none", borderRadius: 2, borderColor: "#94a3b8", color: "#475569" }}>
            Choose File
          </Button>
        </label>
        <Typography fontSize={13} color={fileName ? "#334155" : "#94a3b8"} sx={{ flex: 1, minWidth: 120 }}>
          {fileName || "No file chosen"}
        </Typography>
        {image && (
          <Box sx={{ width: 120, height: 60, borderRadius: 1.5, overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <img src={image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
        )}
        <Button
          variant="contained"
          onClick={uploadSlider}
          disabled={!image || uploading}
          startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <Upload />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
        >
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </Box>

      {/* Slider grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : mergedSliders.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography fontSize={36}>🖼️</Typography>
          <Typography color="text.secondary" fontWeight={600}>No sliders yet</Typography>
          <Typography fontSize={13} color="text.secondary">Upload your first banner above</Typography>
        </Box>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <Typography fontSize={13} fontWeight={700} color="#16a34a" mb={1.5}>
                ● Active ({active.length})
              </Typography>
              <div style={gridStyle}>
                {active.map((s, i) => (
                  <SliderCard key={s._id} slide={s} index={i}
                    onDelete={setDeleteTarget} onToggle={handleToggle}
                    onCrop={setCropTarget} onDimension={setDimTarget} />
                ))}
              </div>
            </>
          )}

          {inactive.length > 0 && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Typography fontSize={13} fontWeight={700} color="#dc2626" mb={1.5}>
                ○ Inactive ({inactive.length})
              </Typography>
              <div style={gridStyle}>
                {inactive.map((s, i) => (
                  <SliderCard key={s._id} slide={s} index={i}
                    onDelete={setDeleteTarget} onToggle={handleToggle}
                    onCrop={setCropTarget} onDimension={setDimTarget} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Modals ── */}
      <CropModal
        open={!!cropTarget}
        imageUrl={cropTarget?.image || null}
        onClose={() => setCropTarget(null)}
        onSave={handleCropSave}
      />

      <DimensionModal
        open={!!dimTarget}
        slider={dimTarget}
        onClose={() => setDimTarget(null)}
        onSave={handleSaveDimensions}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle display="flex" alignItems="center" gap={1}>
          <Delete color="error" />
          <Typography fontWeight={700}>Delete Slider?</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography fontSize={14} color="text.secondary">
            This will permanently remove the slider image from Cloudinary and the database. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <Delete />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.sev} sx={{ width: "100%" }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Paper>
  );
}