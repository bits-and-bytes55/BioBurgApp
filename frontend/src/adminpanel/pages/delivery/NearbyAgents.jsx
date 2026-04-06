import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL + "/api";
const authApi = (url, opts = {}) =>
  axios({
    url: `${API}${url}`,
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken") || localStorage.getItem("token")}` },
    ...opts,
  });

/* ── Haversine distance (returns metres) ────────────────────── */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

const RANGES = [
  { label: "100 m",  val: 100 },
  { label: "500 m",  val: 500 },
  { label: "1 km",   val: 1000 },
  { label: "2 km",   val: 2000 },
  { label: "5 km",   val: 5000 },
  { label: "10 km",  val: 10000 },
];

/* ══════════════════════════════════════════════════════════════
   NEARBY AGENTS MAP
══════════════════════════════════════════════════════════════ */
export default function NearbyAgentsMap({ onClose }) {
  const mapRef     = useRef(null);
  const leafRef    = useRef(null);
  const circleRef  = useRef(null);
  const adminRef   = useRef(null);
  const markersRef = useRef([]);

  const [adminPos,  setAdminPos]  = useState(null);
  const [gpsError,  setGpsError]  = useState(null);
  const [range,     setRange]     = useState(1000);
  const [agents,    setAgents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [nearby,    setNearby]    = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [called,    setCalled]    = useState({});

  /* ── Fetch all approved agents ── */
  const fetchAgents = useCallback(async () => {
    try {
      const { data } = await authApi("/delivery/admin/agents", {
        params: { status: "approved", limit: 200 },
      });
      const list = data.agents || data.data || [];
      setAgents(list.filter(a => a.location?.lat && a.location?.lng));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  /* ── Get admin GPS ── */
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setAdminPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsError("Location permission denied. Please allow location access."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  /* ── Init Leaflet map ── */
  useEffect(() => {
    if (!document.getElementById("lf-css2")) {
      const l = document.createElement("link");
      l.id = "lf-css2"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    const init = () => {
      if (!mapRef.current || leafRef.current || !window.L) return;
      // Wait one frame so the modal flex container has computed its dimensions
      requestAnimationFrame(() => {
        if (!mapRef.current || leafRef.current) return;
        const L   = window.L;
        const lat = adminPos?.lat || 26.9124;
        const lng = adminPos?.lng || 75.7873;
        const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);
        leafRef.current = map;
        if (adminPos) renderAll();
      });
    };
    if (window.L) init();
    else {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = init;
      document.head.appendChild(s);
    }
    return () => { if (leafRef.current) { leafRef.current.remove(); leafRef.current = null; } };
  }, []);

  /* ── Re-render when adminPos, agents or range changes ── */
  useEffect(() => {
    if (!leafRef.current || !window.L || !adminPos) return;
    renderAll();
  }, [adminPos, agents, range]);

  const renderAll = () => {
    if (!leafRef.current || !window.L || !adminPos) return;
    const L   = window.L;
    const map = leafRef.current;

    /* Remove old markers / circle */
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (circleRef.current)  { circleRef.current.remove();  circleRef.current = null; }
    if (adminRef.current)   { adminRef.current.remove();   adminRef.current  = null; }

    /* Admin marker */
    const adminIcon = L.divIcon({
      html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 4px 16px rgba(59,130,246,.5);">🏢</div>`,
      className: "", iconSize: [40, 40], iconAnchor: [20, 20],
    });
    adminRef.current = L.marker([adminPos.lat, adminPos.lng], { icon: adminIcon })
      .addTo(map)
      .bindPopup("<strong style='font-family:sans-serif'>Your Location (Admin)</strong>");
    map.setView([adminPos.lat, adminPos.lng], 14);

    /* Range circle */
    circleRef.current = L.circle([adminPos.lat, adminPos.lng], {
      radius: range,
      color: "#3b82f6", fillColor: "#3b82f6",
      fillOpacity: 0.06, weight: 2, dashArray: "6 4",
    }).addTo(map);

    /* Zoom to fit circle */
    map.fitBounds(circleRef.current.getBounds(), { padding: [40, 40] });

    /* Filter agents by range + place pins */
    const inRange = agents
      .map(a => ({
        ...a,
        dist: haversine(adminPos.lat, adminPos.lng, a.location.lat, a.location.lng),
      }))
      .filter(a => a.dist <= range)
      .sort((a, b) => a.dist - b.dist);

    setNearby(inRange);

    inRange.forEach(a => {
      const isOnline = a.availability === "online";
      const color    = isOnline ? "#10b981" : "#94a3b8";
      const border   = isOnline ? "#fff" : "#e2e8f0";
      const minsAgo  = a.location?.updatedAt
        ? Math.round((Date.now() - new Date(a.location.updatedAt)) / 60000)
        : null;
      const freshness = minsAgo === null ? "—"
        : minsAgo < 1 ? "Just now"
        : minsAgo < 60 ? `${minsAgo}m ago`
        : `${Math.floor(minsAgo / 60)}h ago`;

      const icon = L.divIcon({
        html: `
          <div style="position:relative">
            <div style="width:38px;height:38px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid ${border};box-shadow:0 3px 12px rgba(0,0,0,.25);cursor:pointer;">
              🛵
            </div>
            <div style="position:absolute;top:-3px;right:-3px;width:12px;height:12px;border-radius:50%;background:${isOnline ? "#22c55e" : "#94a3b8"};border:2px solid #fff;${isOnline ? "animation:mpulse 2s infinite" : ""}"></div>
          </div>`,
        className: "", iconSize: [38, 38], iconAnchor: [19, 19],
      });

      const popup = `
        <div style="font-family:'DM Sans',sans-serif;min-width:200px;padding:2px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="width:32px;height:32px;border-radius:8px;background:${isOnline ? "#d1fae5" : "#f1f5f9"};display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">🛵</div>
            <div>
              <div style="font-weight:800;color:#0f172a;font-size:13px">${a.name}</div>
              <div style="font-size:10px;color:#94a3b8;font-family:monospace">${a.agentId}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
            <span style="background:${isOnline ? "#d1fae5" : "#f1f5f9"};color:${isOnline ? "#065f46" : "#64748b"};padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700">${isOnline ? "🟢 Online" : "⚫ Offline"}</span>
            <span style="background:#eff6ff;color:#3b82f6;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700">${fmtDist(a.dist)} away</span>
          </div>
          <div style="font-size:11px;color:#64748b;margin-bottom:6px">Last seen: ${freshness}</div>
          <div style="font-size:11px;color:#334155;font-weight:600;margin-bottom:8px"> ${a.phone}</div>
          ${!isOnline
            ? `<a href="tel:${a.phone}" style="display:block;text-align:center;padding:7px;background:#0f172a;color:#fff;border-radius:7px;font-size:11px;font-weight:700;text-decoration:none;margin-bottom:4px">Call to Come Online</a>`
            : `<div style="text-align:center;padding:7px;background:#dcfce7;color:#065f46;border-radius:7px;font-size:11px;font-weight:700">Already Online</div>`
          }
        </div>`;

      const marker = L.marker([a.location.lat, a.location.lng], { icon })
        .addTo(map)
        .bindPopup(popup, { maxWidth: 240 });

      markersRef.current.push(marker);
    });
  };

  const onlineNearby  = nearby.filter(a => a.availability === "online");
  const offlineNearby = nearby.filter(a => a.availability !== "online");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1050, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(5px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes mpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.75)}}
        @keyframes nbslide{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .nb-modal{font-family:'DM Sans',sans-serif;background:#fff;border-radius:20px;width:100%;max-width:1100px;height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.4);animation:nbslide .3s ease}
        .nb-head{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid #f1f5f9;flex-shrink:0;flex-wrap:wrap;row-gap:8px}
        .nb-body{flex:1;display:flex;overflow:hidden;min-height:0}
        .nb-map{flex:1;position:relative;min-width:0}
        .nb-side{width:300px;flex-shrink:0;display:flex;flex-direction:column;border-left:1px solid #f1f5f9;overflow:hidden}
        .nb-range-btn{padding:6px 14px;border-radius:99px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;color:#64748b;transition:all .15s;white-space:nowrap}
        .nb-range-btn:hover{border-color:#94a3b8;color:#0f172a}
        .nb-range-btn.on{background:#0f172a;border-color:#0f172a;color:#fff}
        .nb-agent-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid #f8fafc;cursor:pointer;transition:background .12s}
        .nb-agent-item:hover{background:#f8fafc}
        .nb-agent-item.sel{background:#eff6ff;border-left:3px solid #3b82f6}
        .nb-call-btn{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:none;background:#0f172a;color:#fff;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;text-decoration:none;flex-shrink:0}
        .nb-call-btn:hover{background:#1e293b;transform:translateY(-1px)}
        .nb-call-btn.called{background:#10b981}
        @media(max-width:760px){.nb-side{display:none}.nb-modal{height:96vh}}
      `}</style>

      <div className="nb-modal">
        {/* Header */}
        <div className="nb-head">
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#0d9488,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🗺️</div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Nearby Agents Radar</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
              {adminPos ? ` Your location detected` : gpsError ? "⚠️ Location error" : "📡 Getting your location…"}
            </div>
          </div>

          {/* Range selector */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {RANGES.map(r => (
              <button key={r.val} className={`nb-range-btn ${range === r.val ? "on" : ""}`} onClick={() => setRange(r.val)}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "In Range",  val: nearby.length,       bg: "#eff6ff", c: "#1d4ed8" },
              { label: "Online",    val: onlineNearby.length,  bg: "#dcfce7", c: "#15803d" },
              { label: "Offline",   val: offlineNearby.length, bg: "#f1f5f9", c: "#475569" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, color: s.c, borderRadius: 8, padding: "5px 12px", textAlign: "center", minWidth: 54 }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{s.val}</div>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 9, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", flexShrink: 0, fontSize: 18 }}>✕</button>
        </div>

        <div className="nb-body">
          {/* Map */}
          <div className="nb-map" style={{ position: "relative", minHeight: 400 }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: 400, position: "absolute", inset: 0 }} />

            {/* GPS error overlay */}
            {gpsError && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(248,250,252,.96)", gap: 12, padding: 24 }}>
                <div style={{ fontSize: 48 }}>📍</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>Location Permission Required</div>
                <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>{gpsError}</div>
                <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Try Again
                </button>
              </div>
            )}

            {/* Loading overlay */}
            {!gpsError && !adminPos && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(248,250,252,.94)", gap: 12 }}>
                <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#0d9488", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Getting your location…</div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {/* Range label on map */}
            {adminPos && (
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,.85)", color: "#fff", borderRadius: 99, padding: "6px 16px", fontSize: 12, fontWeight: 700, backdropFilter: "blur(4px)", pointerEvents: "none", whiteSpace: "nowrap" }}>
                📡 Showing agents within {fmtDist(range)} radius
              </div>
            )}

            {/* No agents in range notice */}
            {adminPos && !loading && nearby.length === 0 && agents.length > 0 && (
              <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", borderRadius: 10, padding: "10px 18px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                ⚠️ No registered agents within {fmtDist(range)} — try a larger range
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="nb-side">
            {/* Section: Online nearby */}
            <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0, boxShadow: "0 0 0 2px #dcfce7" }} />
                Online nearby ({onlineNearby.length})
              </div>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {onlineNearby.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 14px", color: "#94a3b8", fontSize: 12 }}>
                  No online agents in this range
                </div>
              )}
              {onlineNearby.map(a => (
                <div key={a._id} className={`nb-agent-item ${selected === a._id ? "sel" : ""}`} onClick={() => {
                  setSelected(a._id);
                  if (leafRef.current) leafRef.current.setView([a.location.lat, a.location.lng], 16);
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🛵</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{a.agentId}</div>
                    <div style={{ fontSize: 11, color: "#0d9488", fontWeight: 600, marginTop: 1 }}>{fmtDist(a.dist)} away</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 2px #dcfce7" }} />
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #f1f5f9", borderTop: "1px solid #f1f5f9", flexShrink: 0, background: "#fafbfc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8", flexShrink: 0 }} />
                  Offline nearby — call to activate ({offlineNearby.length})
                </div>
              </div>

              {offlineNearby.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 14px", color: "#94a3b8", fontSize: 12 }}>
                  No offline agents in this range
                </div>
              )}

              {offlineNearby.map(a => {
                const minsAgo = a.location?.updatedAt
                  ? Math.round((Date.now() - new Date(a.location.updatedAt)) / 60000)
                  : null;
                const freshness = minsAgo === null ? "—"
                  : minsAgo < 60 ? `${minsAgo}m ago`
                  : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago`
                  : `${Math.floor(minsAgo / 1440)}d ago`;
                const wasCalled = called[a._id];
                return (
                  <div key={a._id} className={`nb-agent-item ${selected === a._id ? "sel" : ""}`}
                    style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}
                    onClick={() => {
                      setSelected(a._id);
                      if (leafRef.current) leafRef.current.setView([a.location.lat, a.location.lng], 16);
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, opacity: .65 }}>🛵</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{a.agentId}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                          <span style={{ fontSize: 10, color: "#64748b" }}>{fmtDist(a.dist)}</span>
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>· Last seen {freshness}</span>
                        </div>
                      </div>
                    </div>

                    {/* Phone + Call button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#334155", fontFamily: "monospace" }}>
                         {a.phone}
                      </span>
                      <a
                        href={`tel:${a.phone}`}
                        className={`nb-call-btn ${wasCalled ? "called" : ""}`}
                        onClick={e => {
                          e.stopPropagation();
                          setCalled(p => ({ ...p, [a._id]: true }));
                        }}
                      >
                        {wasCalled ? "✓ Called" : "Call"}
                      </a>
                    </div>

                    {wasCalled && (
                      <div style={{ width: "100%", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "5px 10px", fontSize: 11, color: "#065f46", fontWeight: 600 }}>
                        Called — ask them to go online
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state when no agents at all */}
              {!loading && agents.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📡</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>No Agent GPS Data</div>
                  <div style={{ fontSize: 12, marginTop: 5, lineHeight: 1.6 }}>
                    Agents must share their location at least once from their dashboard for you to see them here.
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div style={{ padding: "12px 14px", borderTop: "1px solid #f1f5f9", flexShrink: 0, background: "#fafbfc" }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {[
                  ["#22c55e", "Online"],
                  ["#94a3b8", "Offline"],
                  ["#3b82f6", "You (Admin)"],
                ].map(([c, l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#475569" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />{l}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>
                Dashed circle = selected range · GPS updates every time agent moves
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}