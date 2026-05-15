// AdminPopupVideoManager.jsx 
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  overlayColor: "rgba(0,0,0,0.75)",
};

/* ── Direct Cloudinary upload ── */
function uploadToCloudinary(file, resourceType = "video", onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);
    fd.append("folder", `popup-${resourceType}s`);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);
    if (onProgress) {
      xhr.upload.onprogress = e => {
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

/*  Sub-components  */
function Toggle({ checked, onChange, small }) {
  const w = small ? 36 : 44, h = small ? 20 : 24, knob = small ? 16 : 20;
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: w, height: h, borderRadius: h / 2, cursor: "pointer",
        background: checked ? "#2563eb" : "#cbd5e1",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: (h - knob) / 2,
        width: knob, height: knob,
        borderRadius: "50%", background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        transition: "transform 0.2s",
        transform: checked ? `translateX(${w - knob - (h - knob) / 2}px)` : `translateX(${(h - knob) / 2}px)`,
      }} />
    </div>
  );
}

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

/* ── Popup Card in list view ── */
function PopupCard({ doc, onEdit, onDelete, onToggle }) {
  const cfg = doc.config ?? {};
  const isYT = cfg.videoUrl?.includes("youtube.com") || cfg.videoUrl?.includes("youtu.be");

  return (
    <div style={S.popupCard}>
      {/* Thumbnail */}
      <div style={S.cardThumb}>
        {cfg.posterUrl
          ? <img src={cfg.posterUrl} alt="thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : isYT
            ? <div style={S.cardThumbPlaceholder}>▶ YT</div>
            : cfg.videoUrl
              ? <video src={cfg.videoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
              : <div style={S.cardThumbPlaceholder}>No Video</div>
        }
        <div style={{ ...S.cardLiveBadge, background: cfg.enabled ? "#22c55e" : "#64748b" }}>
          {cfg.enabled ? "● LIVE" : "○ OFF"}
        </div>
      </div>

      {/* Info */}
      <div style={S.cardInfo}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={S.cardInfoTitle}>{cfg.title || "Untitled Popup"}</div>
            <div style={S.cardInfoSub}>{cfg.subtitle || "No subtitle"}</div>
          </div>
          <Toggle checked={cfg.enabled} onChange={v => onToggle(doc._id, v)} small />
        </div>

        <div style={S.cardMeta}>
          <span style={S.metaTag}>⏱ {cfg.showDelay ?? 2}s delay</span>
          {cfg.closeAfter > 0 && <span style={S.metaTag}>⏲ auto-close {cfg.closeAfter}s</span>}
          {cfg.showOnce && <span style={S.metaTag}>👁 once/session</span>}
          {cfg.autoPlay && <span style={S.metaTag}>▶ auto-play</span>}
          <span style={S.metaTag}>
            {cfg.videoType === "upload" ? "☁ uploaded" : "🔗 URL"}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={S.cardEditBtn} onClick={() => onEdit(doc)}>✏ Edit</button>
          <button style={S.cardDeleteBtn} onClick={() => onDelete(doc)}>🗑 Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Editor Panel (create / edit a single popup) ── */
function PopupEditor({ initial, onSave, onCancel }) {
  // isNew = no _id yet (creating); isNew=false means we're editing an existing doc
  const isNew = !initial?._id;

  const [config, setConfig]           = useState({ ...DEFAULT_CONFIG, ...(initial?.config ?? {}) });
  const [saving, setSaving]           = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadPct, setUploadPct]     = useState(0);
  const [videoFile, setVideoFile]     = useState(null);
  const [posterFile, setPosterFile]   = useState(null);
  const [activeTab, setActiveTab]     = useState("video");
  const [previewOpen, setPreviewOpen] = useState(false);

  const videoInputRef  = useRef(null);
  const posterInputRef = useRef(null);

  const set = (key, val) => setConfig(p => ({ ...p, [key]: val }));

  const handleVideoChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Select a valid video file"); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { toast.error(`Max ${MAX_VIDEO_MB} MB`); return; }
    setVideoFile(file);
    set("videoType", "upload");
    set("videoUrl", URL.createObjectURL(file));
    toast.success("Video ready — click Save to upload");
  };

  const handlePosterChange = e => {
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

      // Upload video if a new file was selected
      if (videoFile && config.videoType === "upload") {
        setUploading(true); setUploadPct(0);
        await callDeleteMedia(final.videoPublicId, "video");
        const tid = toast.loading("Uploading video…");
        const r = await uploadToCloudinary(videoFile, "video", pct => setUploadPct(pct));
        toast.dismiss(tid); toast.success("Video uploaded!");
        final.videoUrl = r.secure_url; final.videoPublicId = r.public_id;
        setVideoFile(null); setUploading(false); setUploadPct(0);
      }

      // Upload poster/thumbnail if a new file was selected
      if (posterFile) {
        const compressed = await compressImage(posterFile, { maxWidthOrHeight: 1280, quality: 0.8, outputFormat: "image/jpeg" });
        const tid = toast.loading("Uploading thumbnail…");
        const r = await uploadToCloudinary(compressed, "image", () => {});
        toast.dismiss(tid);
        final.posterUrl = r.secure_url; final.posterPublicId = r.public_id;
        setPosterFile(null);
      }

      if (isNew) {
        // ── CREATE: POST to /create ──
        await axios.post(
          `${API_BASE}/api/popup-video/create`,
          { config: final },
          getAuthHeader()
        );
        toast.success("Popup created!");
      } else {
        // ── UPDATE: PUT to /update/:id ──
        await axios.put(
          `${API_BASE}/api/popup-video/update/${initial._id}`,
          { config: final },
          getAuthHeader()
        );
        toast.success("Popup updated!");
      }

      setConfig(final);
      onSave(final);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save");
    } finally {
      setSaving(false); setUploading(false); setUploadPct(0);
    }
  };

  const TABS = [
    { key: "video",      label: "Video"    },
    { key: "text",       label: "Text"     },
    { key: "behaviour",  label: "Settings" },
    { key: "appearance", label: "Style"    },
  ];

  return (
    <div style={S.editorWrap}>
      {/* Editor Header */}
      <div style={S.editorHeader}>
        <button style={S.backBtn} onClick={onCancel}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={S.editorTitle}>{isNew ? "New Popup" : "Edit Popup"}</div>
          <div style={S.editorSub}>{config.title || "Untitled"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...S.badge, background: config.enabled ? "#22c55e" : "#64748b" }}>
            {config.enabled ? "● LIVE" : "○ OFF"}
          </div>
          <button style={S.headerSaveBtn} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : (isNew ? "Create" : "Update")}
          </button>
        </div>
      </div>

      {/* Tab bar */}
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

      {/* Grid content */}
      <div style={S.grid}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Status */}
          <div style={{ ...S.card, display: activeTab === "video" ? "block" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={S.cardTitle}>Popup Status</div>
                <div style={S.cardSub}>Toggle popup on/off for visitors</div>
              </div>
              <Toggle checked={config.enabled} onChange={v => set("enabled", v)} />
            </div>
            {config.enabled && (
              <div style={S.successBanner}>✓ Popup is active — visitors will see it</div>
            )}
          </div>

          {/* Video source */}
          <div style={{ ...S.card, display: activeTab === "video" ? "block" : "none" }}>
            <div style={S.cardTitle}>Video Source</div>
            <div style={S.cardSub}>Paste a URL or upload a video file</div>

            <div style={{ marginTop: 12 }}>
              <label style={S.label}>Video URL (YouTube embed or direct MP4)</label>
              <div style={S.inputWrap}>
                <span style={{ padding: "0 10px", fontSize: 16 }}>🔗</span>
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
                  <div style={S.fileCardType}>{config.videoType === "upload" ? "☁ Cloudinary" : "🔗 External URL"}</div>
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
                  <span style={{ fontSize: 12, color: "#64748b" }}>Uploading…</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{uploadPct}%</span>
                </div>
                <div style={S.progressTrack}>
                  <div style={{ ...S.progressFill, width: `${uploadPct}%` }} />
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
                  <span style={{ fontSize: 20 }}>🖼</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Upload Thumbnail Image</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Text & CTA */}
          <div style={{ ...S.card, display: activeTab === "text" ? "block" : "none" }}>
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
          <div style={{ ...S.card, display: activeTab === "behaviour" ? "block" : "none" }}>
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
          <div style={{ ...S.card, display: activeTab === "appearance" ? "block" : "none" }}>
            <div style={S.cardTitle}>🎨 Appearance</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}>
              <div>
                <label style={S.label}>Accent Colour</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <input type="color" value={config.accentColor}
                    onChange={e => set("accentColor", e.target.value)}
                    style={{ width: 48, height: 40, border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer", padding: 2 }}
                  />
                  <span style={{ fontSize: 13, fontFamily: "monospace", color: "#475569" }}>{config.accentColor}</span>
                </div>
              </div>
              <div>
                <label style={S.label}>Overlay Background</label>
                <input style={S.input} value={config.overlayColor}
                  onChange={e => set("overlayColor", e.target.value)}
                  placeholder="rgba(0,0,0,0.75)" />
              </div>
            </div>
            <div style={S.infoBanner}>
              ℹ Use the Preview button to see how the popup will look before going live.
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={S.actionBar}>
        <button style={S.previewBtn} onClick={() => setPreviewOpen(true)} disabled={!config.videoUrl}>
          👁 Preview
        </button>
        <button style={S.saveBigBtn} onClick={handleSave} disabled={saving}>
          {saving
            ? <><span style={S.spinnerSm} /> Saving…</>
            : isNew ? "Create Popup" : "Update Popup"
          }
        </button>
      </div>

      {/* Preview modal */}
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
                  {config.showOnce ? "Once per session" : "Every visit"} •{" "}
                  Auto-minimizes after 2s on first load
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function AdminPopupVideoManager() {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);  // null = list view; object = editor view
  const [isNew,   setIsNew]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    axios.get(`${API_BASE}/api/popup-video/all`, getAuthHeader())
      .then(res => setDocs(res.data?.configs ?? []))
      .catch(() => toast.error("Failed to load popups"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleNew = () => {
    // Pass a fresh object with no _id so PopupEditor knows it's a create
    setEditing({ config: { ...DEFAULT_CONFIG } });
    setIsNew(true);
  };

  const handleEdit = doc => {
    setEditing(doc);   // doc has ._id so PopupEditor knows it's an update
    setIsNew(false);
  };

  const handleSave = () => {
    setEditing(null);
    load();
  };

  const handleCancel = () => {
    setEditing(null);
  };

  const handleDelete = async doc => {
    if (!window.confirm(`Delete "${doc.config?.title || "this popup"}"?`)) return;
    try {
      await callDeleteMedia(doc.config?.videoPublicId, "video");
      await callDeleteMedia(doc.config?.posterPublicId, "image");
      await axios.delete(`${API_BASE}/api/popup-video/delete/${doc._id}`, getAuthHeader());
      toast.success("Popup deleted");
      load();
    } catch {
      toast.error("Failed to delete popup");
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      const doc = docs.find(d => d._id === id);
      if (!doc) return;
      const updated = { ...doc.config, enabled };
      // Use PUT /update/:id to toggle a specific popup
      await axios.put(
        `${API_BASE}/api/popup-video/update/${id}`,
        { config: updated },
        getAuthHeader()
      );
      setDocs(prev => prev.map(d => d._id === id ? { ...d, config: updated } : d));
      toast.success(enabled ? "Popup activated" : "Popup deactivated");
    } catch {
      toast.error("Failed to toggle popup");
    }
  };

  /* Editor view */
  if (editing) {
    return (
      <PopupEditor
        initial={isNew ? null : editing}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  /* List view */
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          <div style={S.headerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={S.headerTitle}>Popup Video Manager</h1>
            <p style={S.headerSub}>
              {docs.length} popup{docs.length !== 1 ? "s" : ""} •{" "}
              {docs.filter(d => d.config?.enabled).length} live
            </p>
          </div>
        </div>
        <button style={S.newBtn} onClick={handleNew}>+ New Popup</button>
      </div>

      {/* Empty state */}
      {!loading && docs.length === 0 && (
        <div style={S.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>No popup videos yet</div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Create your first popup video to engage visitors on your homepage.</div>
          <button style={S.newBtn} onClick={handleNew}>+ Create First Popup</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12 }}>
          <div style={S.spinner} />
          <span style={{ color: "#64748b", fontSize: 14 }}>Loading popups…</span>
        </div>
      )}

      {/* Info banner */}
      {!loading && docs.length > 0 && (
        <div style={{ ...S.infoBanner, marginBottom: 16 }}>
          ℹ️ On the user page, the popup shows full-screen first, then automatically shrinks to a mini-player after 2 seconds. Once a visitor manually expands it, it stays open until they minimize or close it.
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {docs.map(doc => (
          <PopupCard
            key={doc._id}
            doc={doc}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* Styles  */
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
  newBtn: {
    background: "white", color: "#1e3a5f", border: "none",
    borderRadius: 10, padding: "10px 20px", fontWeight: 700,
    fontSize: 13, cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,.12)",
  },
  emptyState: {
    textAlign: "center", padding: "60px 20px",
    background: "white", borderRadius: 16,
    border: "1.5px dashed #cbd5e1",
  },
  infoBanner: {
    padding: "10px 14px", background: "#eff6ff",
    border: "1px solid #bfdbfe", borderRadius: 10, fontSize: 13, color: "#2563eb",
  },
  /* Popup card in list */
  popupCard: {
    display: "flex", gap: 0, background: "white", borderRadius: 16,
    border: "1px solid #e2e8f0", overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
  },
  cardThumb: {
    width: 160, flexShrink: 0, background: "#0b0f1a",
    position: "relative", overflow: "hidden",
    minHeight: 100,
  },
  cardThumbPlaceholder: {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "100%", color: "rgba(255,255,255,.4)", fontSize: 13, fontWeight: 600,
  },
  cardLiveBadge: {
    position: "absolute", top: 8, left: 8,
    color: "white", fontWeight: 700, fontSize: 10,
    padding: "3px 8px", borderRadius: 20, letterSpacing: ".4px",
  },
  cardInfo: {
    flex: 1, padding: "16px 18px",
  },
  cardInfoTitle: { fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 3 },
  cardInfoSub:   { fontSize: 12, color: "#64748b" },
  cardMeta: {
    display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10,
  },
  metaTag: {
    fontSize: 11, fontWeight: 600, color: "#475569",
    background: "#f1f5f9", borderRadius: 6, padding: "3px 8px",
  },
  cardEditBtn: {
    background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
    borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600,
    cursor: "pointer",
  },
  cardDeleteBtn: {
    background: "#fff5f5", color: "#ef4444", border: "1px solid #fca5a5",
    borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600,
    cursor: "pointer",
  },
  /* Editor layout */
  editorWrap: {
    minHeight: "100vh", background: "#f1f5f9", padding: 16,
    fontFamily: "'Segoe UI', system-ui, sans-serif", boxSizing: "border-box",
  },
  editorHeader: {
    background: "linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)",
    borderRadius: 16, padding: "14px 18px", marginBottom: 14,
    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
  },
  backBtn: {
    background: "rgba(255,255,255,.15)", color: "white", border: "none",
    borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
    flexShrink: 0,
  },
  editorTitle: { fontSize: 16, fontWeight: 800, color: "white", margin: 0 },
  editorSub:   { fontSize: 12, color: "rgba(255,255,255,.65)", marginTop: 2 },
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
  },
  outlineBtn: {
    background: "none", border: "1.5px solid #cbd5e1", borderRadius: 8,
    padding: "6px 14px", fontSize: 12, fontWeight: 600,
    color: "#475569", cursor: "pointer",
  },
  progressTrack: { height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" },
  progressFill: {
    height: "100%", background: "linear-gradient(90deg,#2563eb,#60a5fa)",
    borderRadius: 3, transition: "width .3s",
  },
  actionBar: {
    display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap",
    marginBottom: 16,
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