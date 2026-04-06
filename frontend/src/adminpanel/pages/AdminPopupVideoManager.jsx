// AdminPopupVideoManager.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Box, Paper, Typography, Button, TextField, Switch, FormControlLabel,
  CircularProgress, Alert, Divider, Chip, IconButton, Slider, Stack,
  Dialog, DialogTitle, DialogContent, Tooltip,
} from "@mui/material";
import {
  VideoCall as VideoCallIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Close as CloseIcon,
  Link as LinkIcon,
  Timer as TimerIcon,
  TextFields as TextIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import axios from "axios";
import toast from "react-hot-toast";
import { compressVideo, compressImage } from "../../../utils/mediaCompressor";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const MAX_VIDEO_MB = 20;

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
});

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });

const DEFAULT_CONFIG = {
  enabled: false,
  videoUrl: "",
  videoPublicId: "",         
  videoType: "url",
  posterUrl: "",
  posterPublicId: "",         
  title: "Welcome to BioBurg!",
  subtitle: "India's trusted healthcare platform",
  ctaText: "Explore Now",
  ctaLink: "/",
  showDelay: 2,
  autoPlay: true,
  showOnce: true,
  overlayColor: "rgba(0,0,0,0.75)",
  accentColor: "#2563eb",
  showCloseButton: true,
  closeAfter: 0,
};

export default function AdminPopupVideoManager() {
  const [config,         setConfig]         = useState(DEFAULT_CONFIG);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewOpen,    setPreviewOpen]    = useState(false);
  const [videoFile,      setVideoFile]      = useState(null);   
  const [posterFile,     setPosterFile]     = useState(null);   
  const videoInputRef  = useRef(null);
  const posterInputRef = useRef(null);
  const previewVideoRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/popup-video/config`, getAuthHeader())
      .then((res) => {
        if (res.data?.config) setConfig({ ...DEFAULT_CONFIG, ...res.data.config });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setConfig((p) => ({ ...p, [key]: val }));

  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video must be under ${MAX_VIDEO_MB} MB`);
      return;
    }
    setVideoFile(file);
    set("videoType", "upload");
    set("videoUrl", URL.createObjectURL(file));   
    toast.success("Video selected — click Save to upload");
  };

  const handlePosterFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    set("posterUrl", URL.createObjectURL(file));  
  };

  const handleDeleteVideo = async () => {
    if (!window.confirm("Remove the current video? This cannot be undone.")) return;
    try {
      if (config.videoPublicId) {
        await axios.post(
          `${API_BASE}/api/popup-video/delete-media`,
          { publicId: config.videoPublicId, resourceType: "video" },
          getAuthHeader()
        );
      }
    } catch { /* best-effort */ }

    set("videoUrl", "");
    set("videoPublicId", "");
    set("videoType", "url");
    setVideoFile(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
    toast.success("Video removed — save to apply");
  };
  const handleDeletePoster = async () => {
    try {
      if (config.posterPublicId) {
        await axios.post(
          `${API_BASE}/api/popup-video/delete-media`,
          { publicId: config.posterPublicId, resourceType: "image" },
          getAuthHeader()
        );
      }
    } catch { /* best-effort */ }

    set("posterUrl", "");
    set("posterPublicId", "");
    setPosterFile(null);
    if (posterInputRef.current) posterInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (config.enabled && !config.videoUrl) {
      toast.error("Please add a video URL or upload a video first");
      return;
    }
    setSaving(true);
    try {
      let finalConfig = { ...config };

      /* Upload video via base64 */
      if (videoFile && config.videoType === "upload") {
        setUploading(true);
        setUploadProgress(10);

        // Delete old video from Cloudinary first (if exists)
        if (finalConfig.videoPublicId) {
          await axios
            .post(
              `${API_BASE}/api/popup-video/delete-media`,
              { publicId: finalConfig.videoPublicId, resourceType: "video" },
              getAuthHeader()
            )
            .catch(() => {});
        }

        setUploadProgress(30);
        const compressedVideo = await compressVideo(videoFile, { videoBitsPerSecond: 1_000_000 });
        const base64 = await toBase64(compressedVideo);
        setUploadProgress(60);

        const { data } = await axios.post(
          `${API_BASE}/api/popup-video/upload`,
          { data: base64 },
          getAuthHeader()
        );

        finalConfig.videoUrl      = data.url;
        finalConfig.videoPublicId = data.public_id;
        finalConfig.videoType     = "upload";
        setVideoFile(null);
        setUploadProgress(100);
        setUploading(false);
      }

      /* Upload poster via base64 */
      if (posterFile) {
        const compressedPoster = await compressImage(posterFile, {
          maxWidthOrHeight: 1280,
          quality: 0.75,
          outputFormat: "image/jpeg",
        });
        const base64 = await toBase64(compressedPoster);
        const { data } = await axios.post(
          `${API_BASE}/api/popup-video/upload-poster`,
          { data: base64 },
          getAuthHeader()
        );
        finalConfig.posterUrl      = data.url;
        finalConfig.posterPublicId = data.public_id;
        setPosterFile(null);
      }

      /* Save config blob */
      await axios.post(
        `${API_BASE}/api/popup-video/config`,
        { config: finalConfig },
        getAuthHeader()
      );

      setConfig(finalConfig);
      toast.success("Popup video settings saved!");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={400} gap={2}>
        <CircularProgress />
        <Typography color="text.secondary">Loading popup settings…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", pb: 6 }}>

      {/* HEADER */}
      <Box
        sx={{
          background: "linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)",
          borderRadius: 3, p: 3, mb: 3, color: "white",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 2,
            bgcolor: "rgba(255,255,255,.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <VideoCallIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>Popup Video Manager</Typography>
            <Typography variant="body2" sx={{ opacity: .8 }}>
              Control the video popup shown to visitors on the home page
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1.5} alignItems="center">
          <Chip
            label={config.enabled ? "LIVE" : "DISABLED"}
            sx={{
              bgcolor: config.enabled ? "#22c55e" : "rgba(255,255,255,.2)",
              color: "white", fontWeight: 700, fontSize: 12,
              animation: config.enabled ? "pulse 2s infinite" : "none",
              "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: .7 } },
            }}
          />
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saving}
            onClick={handleSave}
            sx={{ bgcolor: "white", color: "#1e3a5f", fontWeight: 700, "&:hover": { bgcolor: "#e0f2fe" } }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>

        {/* ── LEFT COLUMN ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

          {/* Enable / Disable */}
          <Paper elevation={0} sx={{ border: "1.5px solid", borderColor: config.enabled ? "#2563eb" : "#e5e7eb", borderRadius: 2.5, p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography fontWeight={700} fontSize={15}>Popup Status</Typography>
                <Typography variant="caption" color="text.secondary">
                  Toggle the popup on or off for all visitors
                </Typography>
              </Box>
              <Switch
                checked={config.enabled}
                onChange={(e) => set("enabled", e.target.checked)}
                color="primary"
              />
            </Box>
            {config.enabled && (
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2, py: .5, fontSize: 12 }}>
                Popup is active — visitors will see it on home page
              </Alert>
            )}
          </Paper>

          {/* Video Source */}
          <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2.5, p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <VideoCallIcon color="primary" sx={{ fontSize: 20 }} />
              <Typography fontWeight={700} fontSize={15}>Video Source</Typography>
            </Box>

            {/* URL */}
            <TextField
              fullWidth size="small"
              label="Video URL (YouTube embed, direct MP4, etc.)"
              placeholder="https://www.youtube.com/embed/VIDEO_ID"
              value={config.videoUrl && config.videoType === "url" ? config.videoUrl : ""}
              onChange={(e) => { set("videoUrl", e.target.value); set("videoType", "url"); }}
              InputProps={{ startAdornment: <LinkIcon sx={{ mr: 1, color: "#94a3b8", fontSize: 18 }} /> }}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ mb: 2 }}><Chip label="OR" size="small" /></Divider>

            {/* File upload (hidden input) */}
            <input
              type="file"
              ref={videoInputRef}
              hidden
              accept="video/*"
              onChange={handleVideoFileChange}
            />

            {config.videoUrl ? (
              <Box sx={{
                border: "1.5px solid #2563eb", borderRadius: 2, p: 2,
                bgcolor: "#eff6ff",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1,
              }}>
                <Box display="flex" alignItems="center" gap={1.5} flex={1} minWidth={0}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: 1.5,
                    bgcolor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <PlayIcon sx={{ color: "white", fontSize: 20 }} />
                  </Box>
                  <Box minWidth={0}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {videoFile ? videoFile.name : "Video configured"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {config.videoType === "upload" ? "Uploaded file" : "External URL"}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={.5}>
                  <Tooltip title="Preview">
                    <IconButton size="small" onClick={() => setPreviewOpen(true)}>
                      <PreviewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove video">
                    <IconButton size="small" color="error" onClick={handleDeleteVideo}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<UploadIcon />}
                onClick={() => videoInputRef.current?.click()}
                sx={{ py: 1.5, borderStyle: "dashed", borderRadius: 2 }}
              >
                Upload Video File (MP4, WebM — max {MAX_VIDEO_MB} MB)
              </Button>
            )}

            {/* Upload progress */}
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={.5}>
                  <Typography variant="caption">Uploading video…</Typography>
                  <Typography variant="caption" fontWeight={700}>{uploadProgress}%</Typography>
                </Box>
                <Box sx={{ height: 6, bgcolor: "#e5e7eb", borderRadius: 3 }}>
                  <Box sx={{
                    height: "100%", width: `${uploadProgress}%`,
                    bgcolor: "#2563eb", borderRadius: 3, transition: "width .3s",
                  }} />
                </Box>
              </Box>
            )}

            {/* Poster / Thumbnail */}
            <Box mt={2.5}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Thumbnail / Poster Image
              </Typography>
              <input
                type="file"
                ref={posterInputRef}
                hidden
                accept="image/*"
                onChange={handlePosterFileChange}
              />
              {config.posterUrl ? (
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    component="img"
                    src={config.posterUrl}
                    sx={{ width: 80, height: 50, objectFit: "cover", borderRadius: 1.5, border: "1px solid #e5e7eb" }}
                  />
                  <Button size="small" variant="outlined" onClick={() => posterInputRef.current?.click()}>Change</Button>
                  <Button size="small" color="error" onClick={handleDeletePoster}>Remove</Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  onClick={() => posterInputRef.current?.click()}
                  sx={{ borderStyle: "dashed" }}
                >
                  Upload Thumbnail
                </Button>
              )}
            </Box>
          </Paper>
        </Box>

        {/* ── RIGHT COLUMN ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

          {/* Text & CTA */}
          <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2.5, p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TextIcon color="primary" sx={{ fontSize: 20 }} />
              <Typography fontWeight={700} fontSize={15}>Text &amp; CTA</Typography>
            </Box>
            <Stack spacing={2}>
              <TextField
                fullWidth size="small"
                label="Popup Title"
                value={config.title}
                onChange={(e) => set("title", e.target.value)}
                inputProps={{ maxLength: 80 }}
                helperText={`${config.title.length}/80`}
              />
              <TextField
                fullWidth size="small"
                label="Subtitle / Tagline"
                value={config.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                inputProps={{ maxLength: 120 }}
              />
              <Box display="flex" gap={1.5}>
                <TextField
                  fullWidth size="small"
                  label="Button Text"
                  value={config.ctaText}
                  onChange={(e) => set("ctaText", e.target.value)}
                />
                <TextField
                  fullWidth size="small"
                  label="Button Link"
                  value={config.ctaLink}
                  onChange={(e) => set("ctaLink", e.target.value)}
                />
              </Box>
            </Stack>
          </Paper>

          {/* Behaviour */}
          <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2.5, p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <SettingsIcon color="primary" sx={{ fontSize: 20 }} />
              <Typography fontWeight={700} fontSize={15}>Behaviour</Typography>
            </Box>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={.5}>
                  <TimerIcon sx={{ fontSize: 14, mr: .5, verticalAlign: "middle" }} />
                  Show delay: <strong>{config.showDelay}s</strong>
                </Typography>
                <Slider
                  value={config.showDelay}
                  onChange={(_, v) => set("showDelay", v)}
                  min={0} max={15} step={1}
                  marks={[{ value: 0, label: "0s" }, { value: 5, label: "5s" }, { value: 15, label: "15s" }]}
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={600} mb={.5}>
                  Auto-close after: <strong>{config.closeAfter === 0 ? "Never" : `${config.closeAfter}s`}</strong>
                </Typography>
                <Slider
                  value={config.closeAfter}
                  onChange={(_, v) => set("closeAfter", v)}
                  min={0} max={60} step={5}
                  marks={[{ value: 0, label: "Never" }, { value: 30, label: "30s" }, { value: 60, label: "60s" }]}
                  size="small"
                />
              </Box>

              <Box display="flex" flexDirection="column" gap={1}>
                <FormControlLabel
                  control={<Switch checked={config.autoPlay} onChange={(e) => set("autoPlay", e.target.checked)} size="small" color="primary" />}
                  label={<Typography variant="body2">Auto-play video (muted)</Typography>}
                />
                <FormControlLabel
                  control={<Switch checked={config.showOnce} onChange={(e) => set("showOnce", e.target.checked)} size="small" color="primary" />}
                  label={<Typography variant="body2">Show only once per session</Typography>}
                />
                <FormControlLabel
                  control={<Switch checked={config.showCloseButton} onChange={(e) => set("showCloseButton", e.target.checked)} size="small" color="primary" />}
                  label={<Typography variant="body2">Show close (✕) button</Typography>}
                />
              </Box>
            </Stack>
          </Paper>

          {/* Appearance */}
          <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2.5, p: 3 }}>
            <Typography fontWeight={700} fontSize={15} mb={2}>Appearance</Typography>
            <Box>
              <Typography variant="caption" color="text.secondary" mb={.5} display="block">Accent Colour</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  component="input"
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  sx={{ width: 40, height: 36, cursor: "pointer", border: "1px solid #e5e7eb", borderRadius: 1, p: .25 }}
                />
                <Typography variant="caption" fontFamily="monospace">{config.accentColor}</Typography>
              </Box>
            </Box>
            <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2, py: .5, fontSize: 12 }}>
              Preview the popup before going live using the Preview button below.
            </Alert>
          </Paper>
        </Box>
      </Box>

      {/* ACTION BAR */}
      <Box display="flex" gap={2} mt={3} justifyContent="flex-end" flexWrap="wrap">
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={() => setPreviewOpen(true)}
          disabled={!config.videoUrl}
        >
          Preview Popup
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          disabled={saving}
          onClick={handleSave}
          sx={{ background: "linear-gradient(135deg,#1e3a5f,#2563eb)", px: 3 }}
        >
          {saving ? "Saving…" : "Save All Changes"}
        </Button>
      </Box>

      {/* PREVIEW DIALOG */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth={false}>
        <Box sx={{
          position: "relative",
          bgcolor: config.overlayColor,
          minWidth: { xs: "95vw", md: 700 },
          maxWidth: 800,
          borderRadius: 3,
          overflow: "hidden",
        }}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "white", pb: 1 }}>
            <Typography fontWeight={700}>Popup Preview</Typography>
            <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{
              background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
              borderRadius: 2.5, overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,.5)",
            }}>
              <Box sx={{ position: "relative", bgcolor: "#000", aspectRatio: "16/9" }}>
                {config.videoUrl ? (
                  config.videoUrl.includes("youtube.com") || config.videoUrl.includes("youtu.be") ? (
                    <iframe
                      src={config.videoUrl + (config.autoPlay ? "?autoplay=1&mute=1" : "")}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      allow="autoplay;encrypted-media"
                      allowFullScreen
                      title="Preview"
                    />
                  ) : (
                    <video
                      ref={previewVideoRef}
                      src={config.videoUrl}
                      poster={config.posterUrl || undefined}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      autoPlay={config.autoPlay}
                      muted
                      loop
                      playsInline
                    />
                  )
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%" minHeight={200}>
                    <Typography color="gray">No video configured</Typography>
                  </Box>
                )}
                {config.showCloseButton && (
                  <Box sx={{
                    position: "absolute", top: 10, right: 10,
                    width: 32, height: 32, borderRadius: "50%",
                    bgcolor: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", border: "1px solid rgba(255,255,255,.2)",
                  }}>
                    <CloseIcon sx={{ fontSize: 16, color: "white" }} />
                  </Box>
                )}
              </Box>
              <Box sx={{ p: 3, textAlign: "center" }}>
                {config.title && (
                  <Typography variant="h5" fontWeight={800} color="white" mb={.5}>{config.title}</Typography>
                )}
                {config.subtitle && (
                  <Typography variant="body2" color="rgba(255,255,255,.65)" mb={2.5}>{config.subtitle}</Typography>
                )}
                {config.ctaText && (
                  <Button
                    variant="contained"
                    sx={{ bgcolor: config.accentColor, px: 4, py: 1.2, borderRadius: 2, fontWeight: 700 }}
                  >
                    {config.ctaText}
                  </Button>
                )}
                <Typography variant="caption" color="rgba(255,255,255,.4)" display="block" mt={1.5}>
                  {config.showDelay > 0 ? `Appears after ${config.showDelay}s` : "Appears immediately"} •{" "}
                  {config.showOnce ? "Once per session" : "Every visit"}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
        </Box>
      </Dialog>
    </Box>
  );
}