import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AssignOrderModal from "./components/AssignOrderModal";

const BASE = import.meta.env.VITE_API_BASE_URL;
const authApi = (url, opts = {}) =>
  axios({
    url: `${BASE}${url}`,
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    ...opts,
  });

/* ── Status config ───────────────────────────────────────────── */
const SM = {
  Pending:      { bg: "#fef3c7", c: "#d97706", dot: "#f59e0b" },
  Assigned:     { bg: "#eff6ff", c: "#3b82f6", dot: "#60a5fa" },
  Picked:       { bg: "#f0fdf4", c: "#16a34a", dot: "#4ade80" },
  "In Transit": { bg: "#fdf4ff", c: "#9333ea", dot: "#c084fc" },
  Delivered:    { bg: "#dcfce7", c: "#15803d", dot: "#22c55e" },
  Failed:       { bg: "#fee2e2", c: "#dc2626", dot: "#f87171" },
  Cancelled:    { bg: "#f1f5f9", c: "#64748b", dot: "#94a3b8" },
};
const STATUSES = Object.keys(SM);
const toDisplay = s =>
  ({ pending: "Pending", assigned: "Assigned", picked: "Picked", "in-transit": "In Transit", delivered: "Delivered", cancelled: "Cancelled", failed: "Failed" }[s] || "Pending");
const toEnum = s =>
  ({ Pending: "pending", Assigned: "assigned", Picked: "picked", "In Transit": "in-transit", Delivered: "delivered", Cancelled: "cancelled", Failed: "cancelled" }[s] || s.toLowerCase());

/* ── Icons ───────────────────────────────────────────────────── */
const Ic = {
  Search:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Map:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Add:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Agent:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Edit:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  X:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Nav:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
  Truck:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Cart:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Rupee:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-5H6"/></svg>,
  Signal:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="6" x2="1" y2="18"/><line x1="6" y1="2" x2="6" y2="22"/><line x1="11" y1="9" x2="11" y2="15"/><line x1="16" y1="5" x2="16" y2="19"/><line x1="21" y1="2" x2="21" y2="22"/></svg>,
};

/* ── Reusable Pill ───────────────────────────────────────────── */
function Pill({ status }) {
  const m = SM[status] || SM.Pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: m.bg, color: m.c, border: `1px solid ${m.dot}55`, borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   LIVE MAP MODAL
   Shows the delivery agent's CURRENT GPS location (not the 
   delivery address). The 🛵 pin = where the agent physically is.
══════════════════════════════════════════════════════════════ */
function AgentLiveMap({ agents, onClose, onRefresh }) {
  const mapRef     = useRef(null);
  const leafRef    = useRef(null);
  const markersRef = useRef([]);

  /* Load Leaflet + init map */
  useEffect(() => {
    if (!document.getElementById("lf-css")) {
      const l = document.createElement("link");
      l.id = "lf-css"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    const initMap = () => {
      if (!mapRef.current || leafRef.current || !window.L) return;
      const L   = window.L;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([26.9124, 75.7873], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      leafRef.current = map;
      renderPins(L, map, agents);
    };
    if (window.L) { initMap(); }
    else {
      const s  = document.createElement("script");
      s.src    = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = initMap;
      document.head.appendChild(s);
    }
    return () => {
      if (leafRef.current) { leafRef.current.remove(); leafRef.current = null; }
    };
  }, []);

  /* Re-render pins when agents data updates */
  useEffect(() => {
    if (!leafRef.current || !window.L) return;
    renderPins(window.L, leafRef.current, agents);
  }, [agents]);

  const renderPins = (L, map, agentList) => {
    /* Remove old markers */
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    /* Only agents that have sent GPS coordinates */
    const withGps = agentList.filter(a => a.location?.lat && a.location?.lng);
    if (!withGps.length) return;

    const bounds = [];
    withGps.forEach(a => {
      const onDelivery = !!a.currentOrder;
      const pinColor   = onDelivery ? "#f59e0b" : "#10b981";

      /* ── The pin represents the AGENT's physical location ── */
      const iconHtml = `
        <div style="
          position:relative;
          background:${pinColor};
          width:40px;height:40px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:18px;border:3px solid #fff;
          box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer;
        ">
          🛵
          ${onDelivery
            ? `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#ef4444;border-radius:50%;border:2px solid #fff;"></div>`
            : `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#22c55e;border-radius:50%;border:2px solid #fff;animation:mapblink 2s infinite"></div>`
          }
        </div>`;

      const icon = L.divIcon({
        html:       iconHtml,
        className:  "",
        iconSize:   [40, 40],
        iconAnchor: [20, 20],
      });

      /* GPS freshness */
      const minsAgo = a.location?.updatedAt
        ? Math.round((Date.now() - new Date(a.location.updatedAt)) / 60000)
        : null;
      const freshness = minsAgo === null ? "—"
        : minsAgo === 0 ? "Just now"
        : minsAgo < 60  ? `${minsAgo}m ago`
        : `${Math.floor(minsAgo / 60)}h ago`;

      const coords = `${a.location.lat.toFixed(5)}, ${a.location.lng.toFixed(5)}`;

      const popupHtml = `
        <div style="font-family:'DM Sans',sans-serif;min-width:210px;padding:4px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="width:36px;height:36px;border-radius:50%;background:${pinColor};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">🛵</div>
            <div>
              <div style="font-weight:800;color:#0f172a;font-size:14px">${a.name}</div>
              <div style="font-size:11px;color:#64748b;font-family:monospace">${a.agentId || "—"}</div>
            </div>
          </div>

          <div style="background:#f8fafc;border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:11px">
            <div style="color:#64748b;margin-bottom:3px">📍 <strong>GPS Location</strong></div>
            <div style="color:#0f172a;font-family:monospace">${coords}</div>
            <div style="color:#94a3b8;margin-top:3px">Updated: ${freshness}</div>
          </div>

          <div style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-bottom:8px;
            background:${onDelivery ? "#fef3c7" : "#dcfce7"};color:${onDelivery ? "#b45309" : "#065f46"}">
            ${onDelivery ? `🚚 On delivery` : "✅ Available"}
          </div>

          ${onDelivery && a.currentOrder ? `
            <div style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:11px;margin-bottom:8px">
              <div style="font-weight:700;color:#0f172a;margin-bottom:3px">Order #${a.currentOrder.orderId}</div>
              <div style="color:#64748b">${a.currentOrder.destination || "—"}</div>
              <div style="color:#0d9488;font-weight:700;margin-top:3px">₹${a.currentOrder.amount || 0}</div>
            </div>
          ` : ""}

          <a href="https://maps.google.com/?q=${a.location.lat},${a.location.lng}"
             target="_blank"
             style="display:block;text-align:center;padding:7px;background:#3b82f6;color:#fff;border-radius:7px;font-size:12px;font-weight:700;text-decoration:none">
            Open in Google Maps
          </a>
        </div>`;

      const marker = L.marker([a.location.lat, a.location.lng], { icon })
        .addTo(map)
        .bindPopup(popupHtml, { maxWidth: 260 });

      markersRef.current.push(marker);
      bounds.push([a.location.lat, a.location.lng]);
    });

    if (bounds.length > 1)     map.fitBounds(bounds, { padding: [50, 50] });
    else if (bounds.length === 1) map.setView(bounds[0], 14);
  };

  const withGps   = agents.filter(a => a.location?.lat).length;
  const onDelivery = agents.filter(a => a.currentOrder).length;
  const available  = agents.filter(a => a.location?.lat && !a.currentOrder).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 940, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.4)" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f1f5f9", flexShrink: 0, flexWrap: "wrap", rowGap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#0d9488,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🗺️</div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Live Agent Locations</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>Real-time GPS position of delivery agents</div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "With GPS",   val: withGps,    bg: "#eff6ff", c: "#3b82f6" },
              { label: "On Delivery", val: onDelivery, bg: "#fef3c7", c: "#b45309" },
              { label: "Available",   val: available,  bg: "#dcfce7", c: "#065f46" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, color: s.c, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{s.val}</div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onRefresh} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "flex" }}>{Ic.Signal}</span>Refresh
            </button>
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
              <span style={{ display: "flex" }}>{Ic.X}</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ padding: "8px 20px", display: "flex", gap: 20, borderBottom: "1px solid #f8fafc", flexShrink: 0, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
            Pins show the agent's current GPS position — not the delivery address
          </div>
          {[["#10b981", "🟢 Available"], ["#f59e0b", "🟡 On Delivery"], ["#ef4444", "🔴 Red dot = active delivery"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#475569" }}>
              <span>{l}</span>
            </div>
          ))}
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative", minHeight: 360 }}>
          <style>{`@keyframes mapblink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}`}</style>
          <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: 380 }} />
          {withGps === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(248,250,252,.94)", gap: 12 }}>
              <div style={{ fontSize: 44 }}>📡</div>
              <div style={{ fontWeight: 800, color: "#475569", fontSize: 16 }}>No Agent GPS Data</div>
              <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
                Agents must allow location permission in their browser or app. GPS updates automatically every time they move.
              </div>
            </div>
          )}
        </div>

        {/* Agent list strip */}
        {agents.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, overflowX: "auto", flexShrink: 0, alignItems: "stretch" }}>
            {agents.map(a => {
              const hasGps = !!(a.location?.lat);
              const onDel  = !!a.currentOrder;
              const minsAgo = a.location?.updatedAt ? Math.round((Date.now() - new Date(a.location.updatedAt)) / 60000) : null;
              return (
                <div key={a._id} style={{ flexShrink: 0, background: onDel ? "#fffbeb" : hasGps ? "#f0fdf4" : "#f8fafc", border: `1.5px solid ${onDel ? "#fde68a" : hasGps ? "#a7f3d0" : "#e2e8f0"}`, borderRadius: 12, padding: "10px 14px", minWidth: 148 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                    <span style={{ fontSize: 16 }}>🛵</span>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a" }}>{a.name?.split(" ")[0]}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", marginBottom: 5 }}>{a.agentId}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: onDel ? "#f59e0b" : hasGps ? "#10b981" : "#94a3b8", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: onDel ? "#b45309" : hasGps ? "#065f46" : "#94a3b8" }}>
                      {!hasGps ? "No GPS" : onDel ? "On Delivery" : "Available"}
                    </span>
                  </div>
                  {hasGps && minsAgo !== null && (
                    <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 3 }}>
                      Updated {minsAgo < 1 ? "just now" : `${minsAgo}m ago`}
                    </div>
                  )}
                  {a.currentOrder && (
                    <div style={{ fontSize: 9, color: "#b45309", marginTop: 3, fontWeight: 600, fontFamily: "monospace" }}>
                      #{a.currentOrder.orderId}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Payout Edit Modal ───────────────────────────────────────── */
function PayoutModal({ order, onClose, onSaved }) {
  const [val, setVal]       = useState(order?.deliveryPayout || 0);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await authApi(`/api/orders/${order._id}/payout`, { method: "PATCH", data: { payout: Number(val) } });
      toast.success(`Payout updated to ₹${val}`);
      onSaved(); onClose();
    } catch { toast.error("Failed to update payout"); }
    finally { setSaving(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 340, padding: 22, boxShadow: "0 24px 60px rgba(0,0,0,.28)" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 3 }}>Edit Agent Payout</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          Order #{order?._id?.slice(-8).toUpperCase()} · {order?.customerName || "—"}
        </div>
        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
          Payout Amount (₹)
        </label>
        <input type="number" value={val} min={0} onChange={e => setVal(e.target.value)}
          style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "11px 14px", fontSize: 16, fontWeight: 800, color: "#0d9488", outline: "none", boxSizing: "border-box", textAlign: "center" }}
          onFocus={e => e.target.style.borderColor = "#0d9488"}
          onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#64748b" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: "linear-gradient(135deg,#10b981,#059669)", cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#fff", opacity: saving ? .6 : 1 }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Order Modal ─────────────────────────────────────────── */
function AddOrderModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ orderId: "", customerName: "", customerPhone: "", customerAddress: "", orderAmount: "", deliveryFee: "30", notes: "" });
  const [saving, setSaving] = useState(false);
  const Field = (label, key, type = "text") => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 5 }}>{label}</label>
      {type === "textarea"
        ? <textarea rows={2} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={inputSt} />
        : <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={inputSt} />
      }
    </div>
  );
  const inputSt = { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#0f172a", outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "none" };
  const submit = async () => {
    if (!form.orderId || !form.customerName) return toast.error("Order ID & customer name required");
    setSaving(true);
    try {
      await authApi("/api/delivery/admin/orders", { method: "POST", data: form });
      toast.success("Order added"); onAdded(); onClose();
    } catch (e) { toast.error(e.response?.data?.message || "Error"); }
    finally { setSaving(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 460, maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.28)" }}>
        <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Add Delivery Order</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 7, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}><span style={{ display: "flex" }}>{Ic.X}</span></button>
        </div>
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <div>{Field("Order ID *", "orderId")}</div>
            <div>{Field("Customer Name *", "customerName")}</div>
            <div>{Field("Phone", "customerPhone")}</div>
            <div>{Field("Order Amount", "orderAmount", "number")}</div>
            <div>{Field("Delivery Fee", "deliveryFee", "number")}</div>
          </div>
          {Field("Address", "customerAddress")}
          {Field("Notes", "notes", "textarea")}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#64748b" }}>Cancel</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, padding: "10px", border: "none", borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#4f46e5)", cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#fff", opacity: saving ? .65 : 1 }}>
              {saving ? "Adding…" : "Add Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function DeliveryOrders() {
  const [tab, setTab]               = useState(0);
  const [orders, setOrders]         = useState([]);
  const [d2cOrders, setD2cOrders]   = useState([]);
  const [agents, setAgents]         = useState([]);
  const [gpsRouteOk, setGpsRouteOk] = useState(true);  // stop hammering if 404
  const [loading, setLoading]       = useState(false);
  const [d2cLoading, setD2cLoading] = useState(false);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [statusF, setStatusF]       = useState("");
  const [d2cSearch, setD2cSearch]   = useState("");
  const [d2cFilter, setD2cFilter]   = useState("");

  const [mapOpen, setMapOpen]         = useState(false);
  const [addOpen, setAddOpen]         = useState(false);
  const [assignOrder, setAssignOrder] = useState(null);
  const [payoutOrder, setPayoutOrder] = useState(null);
  const intervalRef = useRef(null);

  /* ── Fetch agent GPS locations
     KEY FIX: If the route returns 404, set gpsRouteOk=false
     so the interval stops — no more console flooding.
  ── */
  const fetchAgents = useCallback(async () => {
    if (!gpsRouteOk) return;
    try {
      const { data } = await authApi("/api/delivery/admin/agents/locations");
      if (data.success) setAgents(data.agents || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setGpsRouteOk(false);  // ← stop retrying until page reload
        console.warn("DeliveryOrders: /api/delivery/admin/agents/locations not found — add the route to delivery.routes.js");
      }
      // 401/403/500 are transient — keep trying
    }
  }, [gpsRouteOk]);

  /* ── Fetch module orders ── */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await authApi("/api/delivery/admin/orders", {
        params: { search, status: statusF, page, limit: 15 },
      });
      if (data.success) { setOrders(data.data || []); setTotal(data.total || 0); }
    } catch {}
    finally { setLoading(false); }
  }, [search, statusF, page]);

  /* ── Fetch D2C orders ── */
  const fetchD2C = useCallback(async () => {
    setD2cLoading(true);
    try {
      const { data } = await authApi("/api/orders/admin/all");
      const all = data.orders || data || [];
      setD2cOrders(
        all
          .filter(o => o.deliveryAgent || o.deliveryStatus !== "pending")
          .map(o => ({
            _id:           o._id,
            orderId:       o.orderId || o._id?.slice(-8).toUpperCase(),
            customerName:  o.address?.fullName  || o.userId?.name  || "—",
            customerPhone: o.address?.phone     || o.userId?.phone || "—",
            customerAddr:  [o.address?.addressLine, o.address?.city, o.address?.state, o.address?.pincode].filter(Boolean).join(", "),
            orderAmount:   o.totalAmount || 0,
            deliveryPayout: o.deliveryPayout || 0,
            status:        toDisplay(o.deliveryStatus),
            agent:         o.deliveryAgent,
            items:         o.items?.length || 0,
            isQueued:      o.isQueued || false,
          }))
      );
    } catch {}
    finally { setD2cLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchD2C(); }, [fetchD2C]);

  useEffect(() => {
    fetchAgents();
    if (gpsRouteOk) {
      intervalRef.current = setInterval(fetchAgents, 15000);
    }
    return () => clearInterval(intervalRef.current);
  }, [fetchAgents, gpsRouteOk]);

  /* Update D2C delivery status */
  const updateStatus = async (id, displayStatus) => {
    try {
      await authApi(`/api/orders/${id}/delivery-status`, {
        method: "PATCH", data: { deliveryStatus: toEnum(displayStatus) },
      });
      toast.success(`→ ${displayStatus}`);
      fetchD2C();
    } catch { toast.error("Update failed"); }
  };

  const filteredD2C = d2cOrders.filter(o => {
    const q = d2cSearch.toLowerCase();
    return (!q || o.orderId?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q))
      && (!d2cFilter || o.status === d2cFilter);
  });

  const withGps     = agents.filter(a => a.location?.lat).length;
  const totalPages  = Math.ceil(total / 15);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500&display=swap');
        .do-wrap *{box-sizing:border-box}
        .do-wrap{font-family:'DM Sans',sans-serif;color:#0f172a}
        .do-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap}
        .do-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;white-space:nowrap}
        .do-btn:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}
        .do-btn:disabled{opacity:.45;cursor:not-allowed}
        .do-btn-primary{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 4px 14px rgba(99,102,241,.3)}
        .do-btn-map{background:linear-gradient(135deg,#0d9488,#0891b2);color:#fff;box-shadow:0 4px 14px rgba(13,148,136,.28)}
        .do-btn-ghost{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
        .do-tabs{display:flex;gap:2px;padding:0 18px;border-bottom:1.5px solid #f1f5f9;overflow-x:auto}
        .do-tab{display:flex;align-items:center;gap:7px;padding:12px 14px;border:none;background:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:#94a3b8;border-bottom:2.5px solid transparent;margin-bottom:-1.5px;white-space:nowrap;transition:color .15s}
        .do-tab:hover{color:#64748b}
        .do-tab.on{color:#0f172a;border-bottom-color:#0f172a}
        .do-tab-ct{font-size:10px;font-weight:700;padding:1px 6px;border-radius:99px;background:#f1f5f9;color:#64748b}
        .do-tab.on .do-tab-ct{background:#0f172a;color:#fff}
        .do-filters{display:flex;gap:7px;padding:12px 18px;flex-wrap:wrap;align-items:center;border-bottom:1px solid #f8fafc;row-gap:8px}
        .do-pill{padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700;cursor:pointer;border:none;transition:all .15s;white-space:nowrap;font-family:'DM Sans',sans-serif}
        .do-search{display:flex;align-items:center;gap:7px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:7px 12px;transition:border .2s;min-width:180px;flex:1;max-width:280px}
        .do-search:focus-within{border-color:#94a3b8;background:#fff}
        .do-search input{border:none;background:none;outline:none;font-family:'DM Sans',sans-serif;font-size:13px;color:#0f172a;width:100%;min-width:0}
        .do-tbl{width:100%;border-collapse:collapse}
        .do-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.09em;padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;white-space:nowrap}
        .do-tbl td{padding:12px 14px;border-bottom:1px solid #f8fafc;vertical-align:middle}
        .do-tbl tbody tr{transition:background .1s}
        .do-tbl tbody tr:hover{background:#fafbfc}
        .do-tbl tbody tr:last-child td{border-bottom:none}
        .do-ab{display:inline-flex;align-items:center;gap:4px;padding:5px 9px;border-radius:7px;font-size:11px;font-weight:600;border:1px solid transparent;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:'DM Sans',sans-serif;background:none}
        .do-ab:hover{opacity:.8;transform:translateY(-1px)}
        .do-sel{border:1px solid #e2e8f0;border-radius:7px;padding:4px 8px;font-size:11px;font-weight:600;cursor:pointer;outline:none;font-family:'DM Sans',sans-serif;background:#fff}
        .do-pg{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:11px 18px;border-top:1px solid #f1f5f9;flex-wrap:wrap}
        .live-dot{width:7px;height:7px;border-radius:50%;background:#10b981;animation:lbd 2s ease infinite}
        @keyframes lbd{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(16,185,129,.4)}50%{opacity:.6;box-shadow:0 0 0 4px rgba(16,185,129,0)}}
        /* Responsive column hiding */
        @media(max-width:960px){.do-tbl .col-addr,.do-tbl .col-items{display:none}}
        @media(max-width:720px){.do-tbl .col-agent{display:none}.do-hd-btns{flex-direction:column;width:100%}.do-btn{justify-content:center}}
        @media(max-width:560px){.do-tbl .col-phone{display:none}.do-filters{padding:10px 12px}.do-tabs{padding:0 10px}}
        @media(max-width:420px){.do-tbl{display:block;overflow-x:auto}.do-tbl th,.do-tbl td{padding:9px 10px}}
      `}</style>

      {mapOpen && (
        <AgentLiveMap
          agents={agents}
          onClose={() => setMapOpen(false)}
          onRefresh={fetchAgents}
        />
      )}
      {addOpen && (
        <AddOrderModal onClose={() => setAddOpen(false)} onAdded={() => { fetchOrders(); setAddOpen(false); }} />
      )}
      {assignOrder && (
        <AssignOrderModal
          open={true}
          onClose={() => setAssignOrder(null)}
          order={assignOrder}
          onSave={() => { fetchOrders(); fetchD2C(); setAssignOrder(null); }}
        />
      )}
      {payoutOrder && (
        <PayoutModal order={payoutOrder} onClose={() => setPayoutOrder(null)} onSaved={() => { fetchD2C(); setPayoutOrder(null); }} />
      )}

      <div className="do-wrap">
        {/* ── Header ── */}
        <div className="do-hd">
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "#0f172a", letterSpacing: "-.4px" }}>Order Management</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
              {tab === 0 ? `${total} delivery module orders` : `${d2cOrders.length} D2C assigned orders`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }} className="do-hd-btns">
            <button className="do-btn do-btn-map" onClick={() => setMapOpen(true)}>
              <span style={{ display: "flex" }}>{Ic.Map}</span>
              Live Agent Map
              {withGps > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.2)", borderRadius: 6, padding: "1px 7px", fontSize: 11 }}>
                  <span className="live-dot" />{withGps}
                </span>
              )}
              {!gpsRouteOk && (
                <span style={{ background: "rgba(255,255,255,.2)", borderRadius: 5, padding: "1px 6px", fontSize: 10, opacity: .8 }}>route missing</span>
              )}
            </button>
            <button className="do-btn do-btn-primary" onClick={() => setAddOpen(true)}>
              <span style={{ display: "flex" }}>{Ic.Add}</span>Add Order
            </button>
          </div>
        </div>

        {/* ── Agent quick strip (always show even without GPS) ── */}
        {agents.length > 0 && (
          <div style={{ display: "flex", gap: 9, marginBottom: 16, overflowX: "auto", paddingBottom: 3 }}>
            {agents.slice(0, 7).map(a => {
              const hasGps = !!(a.location?.lat);
              const onDel  = !!a.currentOrder;
              return (
                <div key={a._id} onClick={() => setMapOpen(true)} style={{ flexShrink: 0, background: "#fff", border: `1.5px solid ${onDel ? "#fde68a" : hasGps ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 11, padding: "8px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "box-shadow .15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.09)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: onDel ? "#fef3c7" : hasGps ? "#d1fae5" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🛵</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{a.name?.split(" ")[0]}</div>
                    <div style={{ fontSize: 10, color: onDel ? "#b45309" : hasGps ? "#065f46" : "#94a3b8", fontWeight: 600 }}>
                      {onDel ? "On delivery" : hasGps ? "Available" : "No GPS"}
                    </div>
                  </div>
                </div>
              );
            })}
            {agents.length > 7 && (
              <div onClick={() => setMapOpen(true)} style={{ flexShrink: 0, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 11, padding: "8px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                +{agents.length - 7} more
              </div>
            )}
          </div>
        )}

        {/* ── Card ── */}
        <div style={{ background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 16, overflow: "hidden" }}>
          {/* Tabs */}
          <div className="do-tabs">
            {[{ label: "Delivery Module Orders", count: total }, { label: "D2C Assigned Orders", count: d2cOrders.length }].map((t, i) => (
              <button key={i} className={`do-tab ${tab === i ? "on" : ""}`} onClick={() => setTab(i)}>
                <span style={{ display: "flex" }}>{i === 0 ? Ic.Truck : Ic.Cart}</span>
                {t.label}
                <span className="do-tab-ct">{t.count}</span>
              </button>
            ))}
          </div>

          {/* ════ TAB 0: Module orders ════ */}
          {tab === 0 && (
            <>
              <div className="do-filters">
                {["", ...STATUSES].map(s => (
                  <button key={s} className="do-pill" onClick={() => { setStatusF(s); setPage(1); }}
                    style={{ background: statusF === s ? "#0f172a" : "#f1f5f9", color: statusF === s ? "#fff" : "#64748b" }}>
                    {s || "All"}
                  </button>
                ))}
                <div style={{ marginLeft: "auto" }}>
                  <div className="do-search">
                    <span style={{ color: "#94a3b8", display: "flex", flexShrink: 0 }}>{Ic.Search}</span>
                    <input placeholder="Search orders…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                  </div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="do-tbl">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th className="col-addr">Address</th>
                      <th className="col-agent">Agent</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={7} style={{ textAlign: "center", padding: "44px", color: "#94a3b8", fontSize: 13 }}>Loading…</td></tr>}
                    {!loading && orders.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: "52px", color: "#94a3b8" }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
                        <div style={{ fontWeight: 700 }}>No orders found</div>
                      </td></tr>
                    )}
                    {!loading && orders.map(o => (
                      <tr key={o._id}>
                        <td><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: "#4f46e5" }}>#{o.orderId}</span></td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{o.customerName}</div>
                          <div className="col-phone" style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{o.customerPhone}</div>
                        </td>
                        <td className="col-addr" style={{ fontSize: 12, color: "#475569", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customerAddress || "—"}</td>
                        <td className="col-agent">
                          {o.assignedAgent
                            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#eff6ff", color: "#3b82f6", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}><span style={{ display: "flex" }}>{Ic.Agent}</span>{o.assignedAgent?.name || "Assigned"}</span>
                            : <span style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>Unassigned</span>
                          }
                        </td>
                        <td><Pill status={o.status || "Pending"} /></td>
                        <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{o.orderAmount ? `₹${Number(o.orderAmount).toFixed(0)}` : "—"}</td>
                        <td>
                          <button className="do-ab" onClick={() => setAssignOrder(o)} style={{ background: "#eff6ff", color: "#3b82f6", borderColor: "#bfdbfe" }}>
                            <span style={{ display: "flex" }}>{Ic.Agent}</span>Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="do-pg">
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Page {page} / {totalPages}</span>
                  <button className="do-btn do-btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                  <button className="do-btn do-btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              )}
            </>
          )}

          {/* ════ TAB 1: D2C assigned orders ════ */}
          {tab === 1 && (
            <>
              <div className="do-filters">
                {["", ...STATUSES].map(s => (
                  <button key={s} className="do-pill" onClick={() => setD2cFilter(s)}
                    style={{ background: d2cFilter === s ? "#3b82f6" : "#f1f5f9", color: d2cFilter === s ? "#fff" : "#64748b" }}>
                    {s || "All"}
                  </button>
                ))}
                <div style={{ marginLeft: "auto" }}>
                  <div className="do-search">
                    <span style={{ color: "#94a3b8", display: "flex", flexShrink: 0 }}>{Ic.Search}</span>
                    <input placeholder="Search orders…" value={d2cSearch} onChange={e => setD2cSearch(e.target.value)} />
                  </div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="do-tbl">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th className="col-addr">Address</th>
                      <th className="col-agent">Agent</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Payout</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d2cLoading && <tr><td colSpan={8} style={{ textAlign: "center", padding: "44px", color: "#94a3b8", fontSize: 13 }}>Loading…</td></tr>}
                    {!d2cLoading && filteredD2C.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: "center", padding: "52px", color: "#94a3b8" }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>🛒</div>
                        <div style={{ fontWeight: 700 }}>{d2cOrders.length === 0 ? "No D2C orders assigned yet" : "No orders match"}</div>
                        {d2cOrders.length === 0 && <div style={{ fontSize: 12, marginTop: 5 }}>Assign an agent from D2C All Orders</div>}
                      </td></tr>
                    )}
                    {!d2cLoading && filteredD2C.map(o => {
                      const agentName = typeof o.agent === "object" ? o.agent?.name : (o.agent ? "Assigned" : null);
                      return (
                        <tr key={o._id}>
                          <td>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: "#4f46e5" }}>#{o.orderId}</div>
                            {o.isQueued && <span style={{ fontSize: 9, background: "#fef3c7", color: "#d97706", borderRadius: 4, padding: "1px 6px", fontWeight: 700, marginTop: 2, display: "inline-block" }}>Queued</span>}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{o.customerName}</div>
                            <div className="col-phone" style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{o.customerPhone}</div>
                          </td>
                          <td className="col-addr" style={{ fontSize: 12, color: "#475569", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customerAddr || "—"}</td>
                          <td className="col-agent">
                            {agentName
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#eff6ff", color: "#3b82f6", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}><span style={{ display: "flex" }}>{Ic.Agent}</span>{agentName}</span>
                              : <span style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>Unassigned</span>
                            }
                          </td>
                          <td>
                            <select className="do-sel" value={o.status} onChange={e => updateStatus(o._id, e.target.value)}
                              style={{ color: SM[o.status]?.c || "#64748b", background: SM[o.status]?.bg || "#f1f5f9", borderColor: (SM[o.status]?.dot || "#94a3b8") + "44" }}>
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>₹{Number(o.orderAmount).toFixed(2)}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              {o.deliveryPayout > 0 && (
                                <span style={{ background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  <span style={{ display: "flex" }}>{Ic.Rupee}</span>{Number(o.deliveryPayout).toFixed(0)}
                                </span>
                              )}
                              <button className="do-ab" onClick={() => setPayoutOrder(o)} style={{ background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }}>
                                <span style={{ display: "flex" }}>{Ic.Edit}</span>
                              </button>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              <button className="do-ab" onClick={() => setAssignOrder({ ...o, _isD2C: true })} style={{ background: "#eff6ff", color: "#3b82f6", borderColor: "#bfdbfe" }}>
                                <span style={{ display: "flex" }}>{Ic.Agent}</span>Reassign
                              </button>
                              {o.customerAddr && (
                                <a href={`https://maps.google.com/?q=${encodeURIComponent(o.customerAddr)}`} target="_blank" rel="noreferrer"
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4", textDecoration: "none" }}>
                                  <span style={{ display: "flex" }}>{Ic.Nav}</span>Map
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}