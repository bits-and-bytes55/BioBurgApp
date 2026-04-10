// AdminPopupVideoManager.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { compressImage } from "../../../utils/mediaCompressor";

const API_BASE      = import.meta.env.VITE_API_BASE_URL;
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const MAX_VIDEO_MB  = 100;

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
});

const DEFAULT_CONFIG = {
  enabled: false,
  videoUrl: "", videoPublicId: "", videoType: "url",
  posterUrl: "", posterPublicId: "",
  title: "Welcome to BioBurg!",
  subtitle: "India's trusted healthcare platform",
  ctaText: "Explore Now", ctaLink: "/",
  showDelay: 2, autoPlay: true, showOnce: true,
  accentColor: "#2563eb", showCloseButton: true, closeAfter: 0,
};

// ── Direct Cloudinary upload via XHR 
function uploadToCloudinary(file, resourceType = "video", onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);
    fd.append("folder", `popup-${resourceType}s`);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload  = () => xhr.status === 200
      ? resolve(JSON.parse(xhr.responseText))
      : reject(new Error(`Cloudinary ${xhr.status}: ${xhr.responseText}`));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}

// ── Delete via backend 
async function callDeleteMedia(publicId, resourceType) {
  if (!publicId) return;
  try {
    await axios.post(
      `${API_BASE}/api/popup-video/delete-media`,
      { publicId, resourceType },
      getAuthHeader()
    );
  } catch { /* best-effort */ }
}

// ── Toggle component 
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: "pointer",
        background: checked ? "#2563eb" : "#cbd5e1",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 2, width: 20, height: 20,
        borderRadius: "50%", background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        transition: "transform 0.2s",
        transform: checked ? "translateX(22px)" : "translateX(2px)",
      }} />
    </div>
  );
}

// ── Range slider with labels 
function RangeField({ label, value, min, max, step, onChange, formatVal, ticks }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
        {label}: <strong style={{ color: "#2563eb" }}>{formatVal ? formatVal(value) : value}</strong>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#2563eb", cursor: "pointer" }}
      />
      {ticks && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
          {ticks.map(t => <span key={t}>{t}</span>)}
        </div>
      )}
    </div>
  );
}

export default function AdminPopupVideoManager() {
  const [config,         setConfig]         = useState(DEFAULT_CONFIG);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewOpen,    setPreviewOpen]    = useState(false);
  const [videoFile,      setVideoFile]      = useState(null);
  const [posterFile,     setPosterFile]     = useState(null);
  const [activeTab,      setActiveTab]      = useState("video");

  const videoInputRef  = useRef(null);
  const posterInputRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/popup-video/config`, getAuthHeader())
      .then(res => { if (res.data?.config) setConfig({ ...DEFAULT_CONFIG, ...res.data.config }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setConfig(p => ({ ...p, [key]: val }));

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Select a valid video file"); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { toast.error(`Max ${MAX_VIDEO_MB} MB`); return; }
    setVideoFile(file);
    set("videoType", "upload");
    set("videoUrl", URL.createObjectURL(file));
    toast.success("Video ready — click Save to upload");
  };

  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    set("posterUrl", URL.createObjectURL(file));
  };

  const handleDeleteVideo = async () => {
    if (!window.confirm("Remove this video?")) return;
    await callDeleteMedia(config.videoPublicId, "video");
    set("videoUrl", ""); set("videoPublicId", ""); set("videoType", "url");
    setVideoFile(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
    toast.success("Video removed");
  };

  const handleDeletePoster = async () => {
    await callDeleteMedia(config.posterPublicId, "image");
    set("posterUrl", ""); set("posterPublicId", "");
    setPosterFile(null);
    if (posterInputRef.current) posterInputRef.current.value = "";
    toast.success("Thumbnail removed");
  };

  const handleSave = async () => {
    if (config.enabled && !config.videoUrl) {
      toast.error("Add a video URL or upload a video first"); return;
    }
    setSaving(true);
    try {
      let final = { ...config };

      // 1 — Upload video directly to Cloudinary (no backend needed)
      if (videoFile && config.videoType === "upload") {
        setUploading(true); setUploadProgress(0);
        await callDeleteMedia(final.videoPublicId, "video");
        const tid = toast.loading("Uploading video to Cloudinary…");
        const r = await uploadToCloudinary(videoFile, "video", pct => setUploadProgress(pct));
        toast.dismiss(tid); toast.success("Video uploaded!");
        final.videoUrl = r.secure_url; final.videoPublicId = r.public_id; final.videoType = "upload";
        setVideoFile(null); setUploading(false); setUploadProgress(0);
      }

      // 2 — Upload poster directly to Cloudinary
      if (posterFile) {
        const compressed = await compressImage(posterFile, { maxWidthOrHeight: 1280, quality: 0.8, outputFormat: "image/jpeg" });
        const tid = toast.loading("Uploading thumbnail…");
        const r = await uploadToCloudinary(compressed, "image", () => {});
        toast.dismiss(tid);
        final.posterUrl = r.secure_url; final.posterPublicId = r.public_id;
        setPosterFile(null);
      }

      // 3 — Save config blob to backend
      await axios.post(`${API_BASE}/api/popup-video/config`, { config: final }, getAuthHeader());
      setConfig(final);
      toast.success("All settings saved!");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to save");
    } finally {
      setSaving(false); setUploading(false); setUploadProgress(0);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12, flexDirection: "column" }}>
      <div style={S.spinner} />
      <span style={{ color: "#64748b", fontSize: 14 }}>Loading settings…</span>
    </div>
  );

  const TABS = [
    { key: "video",      label: "Video"   },
    { key: "text",       label: "Text"    },
    { key: "behaviour",  label: "Settings" },
    { key: "appearance", label: "Style"   },
  ];

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          <div style={S.headerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={S.headerTitle}>Popup Video Manager</h1>
            <p style={S.headerSub}>Control the video popup shown to visitors on your home page</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ ...S.badge, background: config.enabled ? "#22c55e" : "#64748b" }}>
            {config.enabled ? "● LIVE" : "○ OFF"}
          </div>
          <button style={S.headerSaveBtn} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* MOBILE TAB BAR */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button key={t.key}
            style={{ ...S.tab, ...(activeTab === t.key ? S.tabActive : {}) }}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div style={S.grid}>

        {/* LEFT — Video & Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Status card */}
          <div style={{ ...S.card, display: activeTab === "video" ? "block" : "none" }} className="pmv-always">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={S.cardTitle}>Popup Status</div>
                <div style={S.cardSub}>Toggle popup on/off for all visitors</div>
              </div>
              <Toggle checked={config.enabled} onChange={v => set("enabled", v)} />
            </div>
            {config.enabled && (
              <div style={S.successBanner}>✓ Popup is active — visitors will see it on the home page</div>
            )}
          </div>

          {/* Video source card */}
          <div style={{ ...S.card, display: activeTab === "video" ? "block" : "none" }} className="pmv-always">
            <div style={S.cardTitle}>Video Source</div>
            <div style={S.cardSub}>Paste a URL or upload a video file</div>

            {/* URL input */}
            <div style={{ marginTop: 12 }}>
              <label style={S.label}>Video URL (YouTube embed or direct MP4)</label>
              <div style={S.inputWrap}>
                <span style={{ padding: "0 10px", fontSize: 16 }}></span>
                <input
                  style={S.inputInner}
                  placeholder="https://www.youtube.com/embed/VIDEO_ID or https://…/video.mp4"
                  value={config.videoType === "url" ? config.videoUrl : ""}
                  onChange={e => { set("videoUrl", e.target.value); set("videoType", "url"); }}
                />
              </div>
            </div>

            <div style={S.orDivider}>
              <div style={S.orLine} /><span style={S.orText}>OR UPLOAD FILE</span><div style={S.orLine} />
            </div>

            <input type="file" ref={videoInputRef} hidden accept="video/*" onChange={handleVideoChange} />

            {config.videoUrl ? (
              <div style={S.fileCard}>
                <div style={S.fileCardPlay}>▶</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.fileCardName}>{videoFile ? videoFile.name : "Video configured"}</div>
                  <div style={S.fileCardType}>{config.videoType === "upload" ? "☁ Cloudinary upload" : "🔗 External URL"}</div>
                </div>
                <button style={S.ghostBtn} onClick={() => setPreviewOpen(true)}>👁</button>
                <button style={{ ...S.ghostBtn, color: "#ef4444" }} onClick={handleDeleteVideo}>🗑</button>
              </div>
            ) : (
              <button style={S.uploadArea} onClick={() => videoInputRef.current?.click()}>
                <span style={{ fontSize: 28 }}>⬆</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Upload Video File</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>MP4 / WebM — max {MAX_VIDEO_MB} MB</span>
              </button>
            )}

            {uploading && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Uploading to Cloudinary…</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{uploadProgress}%</span>
                </div>
                <div style={S.progressTrack}>
                  <div style={{ ...S.progressFill, width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Poster */}
            <div style={{ marginTop: 20 }}>
              <div style={S.cardTitle}>Thumbnail / Poster</div>
              <input type="file" ref={posterInputRef} hidden accept="image/*" onChange={handlePosterChange} />
              {config.posterUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                  <img src={config.posterUrl} alt="poster"
                    style={{ width: 90, height: 56, objectFit: "cover", borderRadius: 8, border: "1.5px solid #e2e8f0" }} />
                  <button style={S.outlineBtn} onClick={() => posterInputRef.current?.click()}>Change</button>
                  <button style={{ ...S.outlineBtn, color: "#ef4444", borderColor: "#fca5a5" }} onClick={handleDeletePoster}>Remove</button>
                </div>
              ) : (
                <button style={{ ...S.uploadArea, marginTop: 8, padding: "14px 12px" }}
                  onClick={() => posterInputRef.current?.click()}>
                  <span style={{ fontSize: 20 }}></span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Upload Thumbnail Image</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Text, Behaviour, Appearance */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Text & CTA */}
          <div style={{ ...S.card, display: activeTab === "text" ? "block" : "none" }} className="pmv-always">
            <div style={S.cardTitle}>Text &amp; Call-to-Action</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              <div>
                <label style={S.label}>Popup Title</label>
                <input style={S.input} value={config.title} maxLength={80}
                  onChange={e => set("title", e.target.value)} placeholder="Welcome title…" />
                <div style={{ textAlign: "right", fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{config.title.length}/80</div>
              </div>
              <div>
                <label style={S.label}>Subtitle / Tagline</label>
                <input style={S.input} value={config.subtitle} maxLength={120}
                  onChange={e => set("subtitle", e.target.value)} placeholder="Short tagline…" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={S.label}>Button Text</label>
                  <input style={S.input} value={config.ctaText} onChange={e => set("ctaText", e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>Button Link</label>
                  <input style={S.input} value={config.ctaLink} onChange={e => set("ctaLink", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Behaviour */}
          <div style={{ ...S.card, display: activeTab === "behaviour" ? "block" : "none" }} className="pmv-always">
            <div style={S.cardTitle}>⚙️ Behaviour</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 14 }}>
              <RangeField
                label="Show Delay" value={config.showDelay} min={0} max={15} step={1}
                onChange={v => set("showDelay", v)}
                formatVal={v => `${v}s`} ticks={["0s", "5s", "10s", "15s"]}
              />
              <RangeField
                label="Auto-close" value={config.closeAfter} min={0} max={60} step={5}
                onChange={v => set("closeAfter", v)}
                formatVal={v => v === 0 ? "Never" : `${v}s`} ticks={["Never", "15s", "30s", "60s"]}
              />
              {[
                ["autoPlay",        "Auto-play video (muted)"],
                ["showOnce",        "Show only once per session"],
                ["showCloseButton", "Show close (✕) button"],
              ].map(([key, label]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#334155" }}>{label}</span>
                  <Toggle checked={config[key]} onChange={v => set(key, v)} />
                </div>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div style={{ ...S.card, display: activeTab === "appearance" ? "block" : "none" }} className="pmv-always">
            <div style={S.cardTitle}>Appearance</div>
            <div style={{ marginTop: 14 }}>
              <label style={S.label}>Accent Colour</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                <input type="color" value={config.accentColor}
                  onChange={e => set("accentColor", e.target.value)}
                  style={{ width: 48, height: 40, border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer", padding: 2 }}
                />
                <span style={{ fontSize: 13, fontFamily: "monospace", color: "#475569" }}>{config.accentColor}</span>
              </div>
            </div>
            <div style={S.infoBanner}>
              ℹ Use the Preview button in the action bar to see how the popup will look before going live.
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={S.actionBar}>
        <button style={S.previewBtn} onClick={() => setPreviewOpen(true)} disabled={!config.videoUrl}>
          👁 Preview Popup
        </button>
        <button style={S.saveBigBtn} onClick={handleSave} disabled={saving}>
          {saving
            ? <><span style={S.spinnerSm} /> Saving…</>
            : "Save All Changes"
          }
        </button>
      </div>

      {/* PREVIEW MODAL */}
      {previewOpen && (
        <div style={S.overlay} onClick={() => setPreviewOpen(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={{ fontWeight: 700, color: "white", fontSize: 15 }}>Live Preview</span>
              <button style={S.modalCloseBtn} onClick={() => setPreviewOpen(false)}>✕</button>
            </div>
            <div style={{ background: "#0f172a", borderRadius: "0 0 16px 16px", overflow: "hidden" }}>
              <div style={{ position: "relative", background: "#000", aspectRatio: "16/9" }}>
                {config.videoUrl
                  ? config.videoUrl.includes("youtube.com") || config.videoUrl.includes("youtu.be")
                    ? <iframe src={`${config.videoUrl}${config.autoPlay ? "?autoplay=1&mute=1" : ""}`}
                        style={{ width: "100%", height: "100%", border: "none" }}
                        allow="autoplay;encrypted-media" allowFullScreen title="Preview" />
                    : <video src={config.videoUrl} poster={config.posterUrl || undefined}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        autoPlay={config.autoPlay} muted loop playsInline />
                  : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 180, color: "#475569", fontSize: 14 }}>
                      No video configured
                    </div>
                }
                {config.showCloseButton && (
                  <div style={S.previewCloseBtn}>✕</div>
                )}
              </div>
              <div style={{ padding: "20px 24px", textAlign: "center" }}>
                {config.title    && <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 6 }}>{config.title}</div>}
                {config.subtitle && <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 20 }}>{config.subtitle}</div>}
                {config.ctaText  && (
                  <button style={{ background: config.accentColor, color: "white", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    {config.ctaText}
                  </button>
                )}
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 14 }}>
                  {config.showDelay > 0 ? `Appears after ${config.showDelay}s` : "Appears immediately"} •{" "}
                  {config.showOnce ? "Once per session" : "Every visit"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inject keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) {
          .pmv-tabbar  { display: none !important; }
          .pmv-always  { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ── Shared styles object ─────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh", background: "#f1f5f9", padding: 16,
    fontFamily: "'Segoe UI', system-ui, sans-serif", boxSizing: "border-box",
  },
  spinner: {
    width: 32, height: 32, borderRadius: "50%",
    border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb",
    animation: "spin 0.8s linear infinite",
  },
  spinnerSm: {
    display: "inline-block", width: 14, height: 14, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,.35)", borderTop: "2px solid white",
    animation: "spin 0.8s linear infinite", marginRight: 6, verticalAlign: "middle",
  },
  header: {
    background: "linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)",
    borderRadius: 16, padding: "18px 22px", marginBottom: 14,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12, flexWrap: "wrap",
  },
  headerIcon: {
    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
    background: "rgba(255,255,255,.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { margin: 0, fontSize: 17, fontWeight: 800, color: "white" },
  headerSub:   { margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,.7)" },
  badge: {
    color: "white", fontWeight: 700, fontSize: 11,
    padding: "4px 12px", borderRadius: 20, letterSpacing: ".5px",
  },
  headerSaveBtn: {
    background: "white", color: "#1e3a5f", border: "none",
    borderRadius: 10, padding: "9px 18px", fontWeight: 700,
    fontSize: 13, cursor: "pointer",
  },
  tabBar: {
    display: "flex", gap: 4, marginBottom: 14,
    background: "white", borderRadius: 12, padding: 4,
    overflowX: "auto", boxShadow: "0 1px 4px rgba(0,0,0,.07)",
  },
  tab: {
    flex: 1, minWidth: 80, padding: "8px 6px", border: "none",
    background: "transparent", borderRadius: 8,
    fontSize: 12, fontWeight: 600, color: "#64748b",
    cursor: "pointer", whiteSpace: "nowrap",
  },
  tabActive: { background: "#2563eb", color: "white" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 16, marginBottom: 16,
  },
  card: {
    background: "white", borderRadius: 16, padding: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e2e8f0",
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#1e293b" },
  cardSub:   { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  successBanner: {
    marginTop: 10, padding: "8px 12px", background: "#f0fdf4",
    border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#16a34a",
  },
  infoBanner: {
    marginTop: 16, padding: "10px 12px", background: "#eff6ff",
    border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 12, color: "#2563eb",
  },
  label: { fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 },
  input: {
    width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, color: "#1e293b",
    background: "#f8fafc", outline: "none", boxSizing: "border-box",
  },
  inputWrap: {
    display: "flex", alignItems: "center", marginTop: 6,
    border: "1.5px solid #e2e8f0", borderRadius: 10,
    background: "#f8fafc", overflow: "hidden",
  },
  inputInner: {
    flex: 1, border: "none", outline: "none", background: "transparent",
    padding: "10px 12px 10px 0", fontSize: 13, color: "#1e293b",
  },
  orDivider: { display: "flex", alignItems: "center", gap: 8, margin: "14px 0" },
  orLine:    { flex: 1, height: 1, background: "#e2e8f0" },
  orText:    { fontSize: 10, fontWeight: 700, color: "#94a3b8", whiteSpace: "nowrap" },
  fileCard: {
    display: "flex", alignItems: "center", gap: 10,
    border: "1.5px solid #2563eb", borderRadius: 12,
    padding: "10px 12px", background: "#eff6ff",
  },
  fileCardPlay: {
    width: 36, height: 36, borderRadius: 8, background: "#2563eb",
    color: "white", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 14, flexShrink: 0,
  },
  fileCardName: { fontSize: 13, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  fileCardType: { fontSize: 11, color: "#64748b", marginTop: 2 },
  ghostBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 16, padding: "5px 7px", borderRadius: 7,
  },
  uploadArea: {
    width: "100%", border: "1.5px dashed #cbd5e1", borderRadius: 12,
    background: "#f8fafc", padding: "22px 12px", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 6, color: "#64748b", boxSizing: "border-box",
    transition: "border-color .2s",
  },
  outlineBtn: {
    background: "none", border: "1.5px solid #cbd5e1", borderRadius: 8,
    padding: "6px 14px", fontSize: 12, fontWeight: 600,
    color: "#475569", cursor: "pointer",
  },
  progressTrack: {
    height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden",
  },
  progressFill: {
    height: "100%", background: "linear-gradient(90deg,#2563eb,#60a5fa)",
    borderRadius: 3, transition: "width .3s",
  },
  actionBar: {
    display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap",
  },
  previewBtn: {
    background: "white", border: "1.5px solid #e2e8f0",
    borderRadius: 10, padding: "10px 20px", fontSize: 13,
    fontWeight: 600, color: "#475569", cursor: "pointer",
  },
  saveBigBtn: {
    background: "linear-gradient(135deg,#1e3a5f,#2563eb)",
    color: "white", border: "none", borderRadius: 10,
    padding: "11px 28px", fontSize: 14, fontWeight: 700,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999, padding: 16, boxSizing: "border-box",
  },
  modal: {
    background: "#1e293b", borderRadius: 16, overflow: "hidden",
    width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,.1)",
  },
  modalCloseBtn: {
    background: "rgba(255,255,255,.12)", border: "none", color: "white",
    borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 13,
  },
  previewCloseBtn: {
    position: "absolute", top: 10, right: 10, width: 28, height: 28,
    borderRadius: "50%", background: "rgba(0,0,0,.6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "white", fontSize: 12, cursor: "pointer",
    border: "1px solid rgba(255,255,255,.2)",
  },
};