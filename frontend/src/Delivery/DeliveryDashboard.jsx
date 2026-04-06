import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL + "/api";
const api = axios.create({ baseURL: API });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("daToken");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

function normalizeOrder(o) {
  const sm = {
    pending:"Assigned", assigned:"Assigned", picked:"Picked",
    "in-transit":"In Transit", delivered:"Delivered", cancelled:"Cancelled",
    Assigned:"Assigned", Picked:"Picked", "In Transit":"In Transit",
    Delivered:"Delivered", Failed:"Failed", Cancelled:"Cancelled",
  };
  return {
    _id:             o._id,
    orderId:         o.orderId || o._id?.slice(-8).toUpperCase(),
    customerName:    o.address?.fullName  || o.userId?.name  || o.customerName  || "—",
    customerPhone:   o.address?.phone     || o.userId?.phone || o.customerPhone || "",
    customerAddress: o.customerAddress ||
      [o.address?.addressLine, o.address?.city, o.address?.state, o.address?.pincode]
        .filter(Boolean).join(", "),
    orderAmount:  o.totalAmount || o.orderAmount || 0,
    status:       sm[o.deliveryStatus || o.status] || "Assigned",
    isQueued:     o.isQueued || false,
    createdAt:    o.createdAt,
    isD2C:        !!(o.userId || o.address?.fullName),
    deliveryPayout: o.deliveryPayout || 0,
  };
}

/* ─── SVG Icons ─────────────────────────────────────────────────── */
const Ic = {
  Box:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Rupee:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-5H6"/></svg>,
  Cal:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Star:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Pct:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  Trophy:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>,
  Grid:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Inbox:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Zap:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  History: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.27"/></svg>,
  User:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Card:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Power:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
  LogOut:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Pin:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Wifi:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  WifiOff: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 16 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  Map:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Queue:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Menu:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Close:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

/* ─── Animated Counter ──────────────────────────────────────────── */
function Counter({ to, prefix = "", suffix = "", dec = 0 }) {
  const [v, setV] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const n = parseFloat(to) || 0, t0 = performance.now();
    const run = t => {
      const p = Math.min((t - t0) / 900, 1), e = 1 - Math.pow(1 - p, 4);
      setV(n * e);
      if (p < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);
  return <>{prefix}{dec ? v.toFixed(dec) : Math.floor(v).toLocaleString("en-IN")}{suffix}</>;
}

/* ─── Toast ─────────────────────────────────────────────────────── */
function Toast({ t }) {
  if (!t) return null;
  const bg = { success: "#10b981", error: "#ef4444", info: "#6366f1" }[t.type] || "#10b981";
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, left: 16, zIndex: 9999, maxWidth: 420, margin: "0 auto",
      background: bg, color: "#fff", padding: "13px 18px", borderRadius: 14,
      fontSize: 13, fontWeight: 700, boxShadow: "0 12px 40px rgba(0,0,0,.28)",
      animation: "toastIn .35s cubic-bezier(.34,1.56,.64,1)", display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ width: 16, height: 16, display: "flex", flexShrink: 0 }}>{t.type === "error" ? Ic.X : Ic.Check}</span>
      {t.msg}
    </div>
  );
}

/* ─── Map Tab (no Nominatim / no CORS) ─────────────────────────── */
function MapView({ orders, agentGps }) {
  const mapRef = useRef(null);
  const leafRef = useRef(null);
  const agentPin = useRef(null);

  useEffect(() => {
    if (!document.getElementById("lf-css")) {
      const l = document.createElement("link");
      l.id = "lf-css"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    const init = () => {
      if (!mapRef.current || leafRef.current || !window.L) return;
      const L = window.L;
      const lat = agentGps?.lat || 26.9124, lng = agentGps?.lng || 75.7873;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "© OpenStreetMap" }).addTo(map);
      leafRef.current = map;
    };
    if (window.L) init();
    else {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = init; document.head.appendChild(s);
    }
    return () => { if (leafRef.current) { leafRef.current.remove(); leafRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!leafRef.current || !window.L || !agentGps?.lat) return;
    const L = window.L;
    if (agentPin.current) agentPin.current.remove();
    const icon = L.divIcon({
      html: `<div style="background:#0d9488;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 4px 12px rgba(13,148,136,.5)">🛵</div>`,
      className: "", iconSize: [36, 36], iconAnchor: [18, 18],
    });
    agentPin.current = L.marker([agentGps.lat, agentGps.lng], { icon })
      .addTo(leafRef.current).bindPopup("<strong>Your Location</strong>");
    leafRef.current.setView([agentGps.lat, agentGps.lng], 14);
  }, [agentGps]);

  const active = orders.filter(o => ["Assigned", "Picked", "In Transit"].includes(o.status));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* GPS status pill */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
        background: agentGps ? "#d1fae5" : "#fef3c7", padding: "7px 14px", borderRadius: 99,
        border: "1px solid", borderColor: agentGps ? "#a7f3d0" : "#fde68a",
        fontSize: 12, fontWeight: 700, color: agentGps ? "#065f46" : "#92400e",
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: agentGps ? "#10b981" : "#f59e0b", flexShrink: 0 }} />
        {agentGps
          ? `GPS Active — ${agentGps.lat.toFixed(5)}, ${agentGps.lng.toFixed(5)}`
          : "Allow location in browser to enable GPS"}
      </div>

      {/* Map */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div ref={mapRef} style={{ width: "100%", height: "min(420px, 55vw)" }} />
        {!agentGps && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: "rgba(248,250,252,.88)", gap: 10,
          }}>
            <div style={{ fontSize: 40 }}></div>
            <div style={{ fontWeight: 700, color: "#475569", fontSize: 15 }}>Enable Location Access</div>
            <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", maxWidth: 240 }}>
              Allow location permission in your browser to see your position on the map
            </div>
          </div>
        )}
      </div>

      {/* Active delivery cards */}
      {active.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
          {active.map((o, i) => {
            const c = o.status === "In Transit" ? "#f59e0b" : o.status === "Picked" ? "#8b5cf6" : "#3b82f6";
            return (
              <div key={o._id} style={{ background: "#fff", border: `1.5px solid ${c}30`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>#{o.orderId}</div>
                  <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: `${c}15`, color: c }}>{o.status}</div>
                </div>
                <div style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>{o.customerName}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{o.customerAddress || "—"}</div>
                <div style={{ marginTop: 8, fontWeight: 800, color: "#0d9488" }}>₹{Number(o.orderAmount || 0).toFixed(2)}</div>
                {o.customerAddress && (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(o.customerAddress)}`}
                    target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, fontWeight: 700, color: "#3b82f6", textDecoration: "none" }}>
                     Navigate →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {active.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#94a3b8", fontSize: 13 }}>
          No active deliveries to show on map
        </div>
      )}
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────── */
export default function DeliveryAgentDashboard() {
  const navigate = useNavigate();
  const [agent, setAgent]       = useState(() => { try { return JSON.parse(localStorage.getItem("daAgent")); } catch { return null; } });
  const [tab, setTab]           = useState("overview");
  const [rawOrders, setRawOrders] = useState([]);
  const [toggling, setToggling] = useState(false);
  const [toast, setToast]       = useState(null);
  const [ready, setReady]       = useState(false);
  const [gps, setGps]           = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const watchRef = useRef(null);

  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);
  const fire = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const orders = rawOrders.map(normalizeOrder);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/delivery/me");
      if (data.success) {
        const u = { ...data.agent, isOnline: data.agent.availability === "online" };
        setAgent(u); localStorage.setItem("daAgent", JSON.stringify(u));
      }
    } catch (e) { if (e.response?.status === 401) { localStorage.clear(); navigate("/delivery/login"); } }
  }, [navigate]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get("/delivery/my-orders");
      if (data.success) setRawOrders(data.data || []);
    } catch (e) { console.error("fetchOrders:", e.message); }
  }, []);

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGps({ lat, lng });
        try { await api.patch("/delivery/location", { lat, lng }); } catch {}
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 15000 }
    );
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("daToken")) { navigate("/delivery/login"); return; }
    fetchMe(); fetchOrders(); startGPS();
    const iv = setInterval(() => { fetchMe(); fetchOrders(); }, 15000);
    return () => { clearInterval(iv); if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  const toggleOnline = async () => {
    setToggling(true);
    try {
      const { data } = await api.patch("/delivery/toggle-online");
      if (data.success) {
        setAgent(p => { const u = { ...p, availability: data.availability, isOnline: data.availability === "online" }; localStorage.setItem("daAgent", JSON.stringify(u)); return u; });
        fire(data.message, data.availability === "online" ? "success" : "info");
      }
    } catch { fire("Failed to update status", "error"); }
    finally { setToggling(false); }
  };

  /* ── FIX: always use agent-auth route, never /orders/:id/delivery-status ── */
  const updateOrder = async (id, status) => {
    try {
      await api.patch(`/delivery/my-orders/${id}/status`, { status });
      fire(`Marked as ${status}`);
      fetchOrders();
      if (status === "Delivered") fetchMe();
    } catch (e) { fire(e.response?.data?.message || "Update failed", "error"); }
  };

  if (!agent) return null;

  const assigned = orders.filter(o => o.status === "Assigned");
  const active   = orders.filter(o => ["Picked", "In Transit"].includes(o.status));
  const done     = orders.filter(o => o.status === "Delivered");
  const monthDel = agent.thisMonthDeliveries || 0;
  const target   = agent.incentiveDeliveryTarget || 100;
  const prog     = Math.min(100, (monthDel / target) * 100);

  const NAV = [
    { id: "overview",  label: "Overview",  icon: Ic.Grid },
    { id: "assigned",  label: "Assigned",  icon: Ic.Inbox,   badge: assigned.length },
    { id: "active",    label: "Active",    icon: Ic.Zap,     badge: active.length },
    { id: "map",       label: "Map",       icon: Ic.Map },
    { id: "history",   label: "History",   icon: Ic.History },
    { id: "profile",   label: "Profile",   icon: Ic.User },
    { id: "earnings",  label: "Earnings",  icon: Ic.Card },
  ];

  const STATS = [
    { icon: Ic.Box,    label: "Total Deliveries",  val: agent.totalDeliveries || 0,    pre: "",  suf: "",  c: "#0d9488", g: "#ccfbf1,#99f6e4" },
    { icon: Ic.Rupee,  label: "Total Earnings",    val: agent.totalEarnings || 0,      pre: "₹", suf: "",  c: "#059669", g: "#dcfce7,#bbf7d0" },
    { icon: Ic.Cal,    label: "This Month",        val: agent.thisMonthEarnings || 0,  pre: "₹", suf: "",  c: "#d97706", g: "#fef3c7,#fde68a" },
    { icon: Ic.Star,   label: "Rating",            val: agent.avgRating || 0,          pre: "",  suf: "",  c: "#7c3aed", g: "#ede9fe,#ddd6fe", dec: 1 },
    { icon: Ic.Pct,    label: "Commission",        val: agent.commission ?? 7,         pre: "",  suf: "%", c: "#0369a1", g: "#e0f2fe,#bae6fd" },
    { icon: Ic.Trophy, label: "Monthly Bonus",     val: agent.incentive ?? 400,        pre: "₹", suf: "",  c: "#be185d", g: "#fce7f3,#fbcfe8" },
  ];

  const pageTitle = { overview: "Overview", assigned: "Assigned", active: "Active", map: "Live Map", history: "History", profile: "Profile", earnings: "Earnings" }[tab];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --sidebar-w:252px;--bottom-h:64px;
          --sidebar:#0c1320;--teal:#0d9488;
          --bg:#f0f4f8;--card:#fff;--border:#e8edf2;
          --text:#0f172a;--muted:#64748b;--faint:#94a3b8;
          --font-d:'Outfit',sans-serif;--font-b:'Plus Jakarta Sans',sans-serif;
        }
        html,body{font-family:var(--font-b);background:var(--bg);color:var(--text);min-height:100vh}

        /* ── Layout ── */
        .layout{display:flex;min-height:100vh}

        /* ── Sidebar — shown on ≥768px ── */
        .sidebar{
          width:var(--sidebar-w);flex-shrink:0;background:var(--sidebar);
          position:fixed;top:0;left:0;bottom:0;z-index:200;
          display:flex;flex-direction:column;
          background-image:radial-gradient(ellipse at 10% 0%,rgba(13,148,136,.18) 0%,transparent 60%);
          transition:transform .28s cubic-bezier(.4,0,.2,1);
        }
        .sidebar-top{padding:20px 18px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
        .brand-name{font-family:var(--font-d);font-size:19px;font-weight:800;color:#f1f5f9;letter-spacing:-.3px}
        .brand-sub{font-size:11px;color:#475569;font-weight:500;margin-top:1px}
        .sidebar-nav{flex:1;padding:14px 10px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
        .nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;border:none;background:none;cursor:pointer;width:100%;text-align:left;transition:all .15s}
        .nav-item:hover{background:rgba(255,255,255,.06)}
        .nav-item.on{background:linear-gradient(135deg,rgba(13,148,136,.25),rgba(8,145,178,.15));border:1px solid rgba(13,148,136,.3)}
        .nav-item svg{width:15px;height:15px;flex-shrink:0;color:#475569}
        .nav-item.on svg{color:#5eead4}
        .nav-lbl{font-size:13px;font-weight:600;color:#64748b}
        .nav-item.on .nav-lbl{color:#e2e8f0}
        .nav-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);margin-left:auto;flex-shrink:0}
        .nav-badge{margin-left:auto;background:#ef4444;color:#fff;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;flex-shrink:0}
        .sidebar-foot{border-top:1px solid rgba(255,255,255,.07);flex-shrink:0}
        .toggle-btn{margin:10px;padding:11px 14px;border-radius:12px;border:none;cursor:pointer;display:flex;align-items:center;gap:9px;font-family:var(--font-b);font-weight:700;font-size:12px;transition:all .28s;width:calc(100% - 20px)}
        .toggle-btn.on{background:linear-gradient(135deg,#059669,#0d9488);color:#fff;box-shadow:0 4px 18px rgba(13,148,136,.4)}
        .toggle-btn.off{background:rgba(255,255,255,.05);color:#475569;border:1px solid rgba(255,255,255,.08)}
        .toggle-btn:disabled{opacity:.6;cursor:not-allowed}
        .blink{width:7px;height:7px;border-radius:50%;flex-shrink:0}
        .blink.on{background:#fff;animation:blk 1.5s ease infinite}
        .blink.off{background:#334155}
        @keyframes blk{0%,100%{opacity:1}50%{opacity:.4}}
        .agent-row{padding:12px 14px;display:flex;align-items:center;gap:10px}
        .agent-av{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#1d4ed8,#7c3aed);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-weight:800;font-size:15px;color:#fff;flex-shrink:0}
        .agent-n{font-family:var(--font-d);font-size:13px;font-weight:700;color:#e2e8f0}
        .agent-id{font-size:10px;color:#475569;margin-top:1px}
        .logout{margin-left:auto;background:none;border:none;cursor:pointer;color:#334155;padding:6px;border-radius:8px;display:flex;transition:all .2s}
        .logout:hover{background:rgba(239,68,68,.15);color:#ef4444}
        .logout svg{width:14px;height:14px}

        /* ── Mobile top bar ── */
        .mobile-topbar{display:none;position:fixed;top:0;left:0;right:0;height:56px;background:rgba(12,19,32,.97);z-index:180;align-items:center;padding:0 16px;gap:12px;border-bottom:1px solid rgba(255,255,255,.07)}
        .mobile-brand{font-family:var(--font-d);font-size:17px;font-weight:800;color:#f1f5f9;flex:1}
        .icon-btn{background:none;border:none;cursor:pointer;color:#64748b;padding:7px;border-radius:9px;display:flex;align-items:center;justify-content:center;transition:all .2s}
        .icon-btn:hover{background:rgba(255,255,255,.1);color:#e2e8f0}
        .icon-btn svg{width:20px;height:20px}

        /* ── Mobile drawer overlay ── */
        .drawer-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:190;backdrop-filter:blur(3px)}
        .drawer-overlay.open{display:block}

        /* ── Bottom nav — mobile only ── */
        .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:var(--bottom-h);background:rgba(12,19,32,.97);border-top:1px solid rgba(255,255,255,.07);z-index:180;align-items:center;padding:0 4px;backdrop-filter:blur(8px)}
        .bn-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:7px 4px;cursor:pointer;border:none;background:none;border-radius:10px;position:relative;min-width:0}
        .bn-item svg{width:20px;height:20px;color:#475569;flex-shrink:0}
        .bn-item.on svg{color:#5eead4}
        .bn-lbl{font-size:9px;font-weight:600;color:#475569;white-space:nowrap}
        .bn-item.on .bn-lbl{color:#5eead4}
        .bn-badge{position:absolute;top:5px;right:calc(50% - 16px);background:#ef4444;color:#fff;font-size:9px;font-weight:800;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 3px}

        /* ── Main content area ── */
        .main{margin-left:var(--sidebar-w);flex:1;display:flex;flex-direction:column;min-height:100vh}
        .topbar{background:rgba(255,255,255,.88);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 28px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;height:60px;flex-shrink:0}
        .page-title{font-family:var(--font-d);font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-.3px}
        .page-date{font-size:11px;color:var(--faint);font-weight:500}
        .sep{width:1px;height:26px;background:var(--border);flex-shrink:0}
        .status-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 13px;border-radius:99px;font-size:11px;font-weight:700;white-space:nowrap}
        .sc-on{background:#d1fae5;color:#065f46}
        .sc-off{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
        .chip-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
        .sc-on .chip-dot{background:#10b981;animation:blk 1.5s infinite}
        .sc-off .chip-dot{background:#94a3b8}
        .gps-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;background:#d1fae5;color:#065f46;font-size:10px;font-weight:700;white-space:nowrap}

        /* ── Content ── */
        .content{padding:24px 28px;flex:1}

        /* ── Stats grid ── */
        .stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:22px}
        .stat-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px 16px;position:relative;overflow:hidden;transition:transform .22s,box-shadow .22s;cursor:default}
        .stat-card:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.08)}
        .stat-glow{position:absolute;top:-18px;right:-18px;width:72px;height:72px;border-radius:50%;opacity:.16;pointer-events:none}
        .stat-icon{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;flex-shrink:0}
        .stat-icon svg{width:18px;height:18px}
        .stat-num{font-family:var(--font-d);font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-.5px;line-height:1}
        .stat-lbl{font-size:10px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.07em;margin-top:4px}
        .stat-bar{height:3px;border-radius:99px;margin-top:12px;opacity:.3}

        /* ── Cards ── */
        .card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px}
        .card-hd{font-family:var(--font-d);font-size:14px;font-weight:800;color:#0f172a;letter-spacing:-.2px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .gy>*+*{margin-top:12px}
        .span2{grid-column:1/-1}

        /* ── Status box (online/offline) ── */
        .sbox{border-radius:14px;padding:18px;display:flex;align-items:center;gap:14px}
        .sbox.on{background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid #a7f3d0}
        .sbox.off{background:#f8fafc;border:1px solid #e2e8f0}
        .si{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .si svg{width:22px;height:22px}
        .go-btn{margin-top:14px;width:100%;padding:13px;border:none;cursor:pointer;border-radius:12px;font-family:var(--font-b);font-weight:700;font-size:13px;background:linear-gradient(135deg,#0d9488,#0891b2);color:#fff;transition:all .2s}
        .go-btn:hover{opacity:.9;transform:translateY(-1px)}
        .go-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}

        /* ── Progress ── */
        .prog-track{height:9px;background:#f1f5f9;border-radius:99px;overflow:hidden}
        .prog-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#0d9488,#06b6d4);transition:width 1.4s cubic-bezier(.34,1.56,.64,1)}
        .prog-labels{display:flex;justify-content:space-between;align-items:center;margin-top:8px}
        .prog-val{font-family:var(--font-d);font-size:12px;font-weight:800;color:#0d9488}
        .prog-max{font-size:11px;color:var(--faint)}

        /* ── Assignment boxes ── */
        .abox{border-radius:12px;padding:16px}
        .abox.cur{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fcd34d}
        .abox.emp{background:#f8fafc;border:1.5px dashed #e2e8f0}
        .empty-st{padding:36px 16px;text-align:center}
        .ei{width:54px;height:54px;background:#f1f5f9;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;border:1px solid #e2e8f0}
        .ei svg{width:26px;height:26px;color:#94a3b8}

        /* ── Order cards ── */
        .ocard{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;transition:all .2s}
        .ocard:hover{border-color:#d1d5db;box-shadow:0 5px 20px rgba(0,0,0,.07);transform:translateY(-1px)}
        .pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
        .pa{background:#dbeafe;color:#1d4ed8}.pp{background:#ede9fe;color:#6d28d9}.pt{background:#fef3c7;color:#b45309}.pd{background:#d1fae5;color:#065f46}.pf{background:#fee2e2;color:#b91c1c}
        .acts{display:flex;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid #f8fafc;flex-wrap:wrap}
        .act{flex:1;min-width:90px;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 12px;border:none;border-radius:10px;font-family:var(--font-b);font-weight:700;font-size:12px;cursor:pointer;transition:all .18s;white-space:nowrap}
        .act:hover{opacity:.88;transform:translateY(-1px)}
        .act-pk{background:#0d9488;color:#fff}
        .act-tr{background:#f59e0b;color:#fff}
        .act-dl{background:#10b981;color:#fff}
        .act-f{background:#fef2f2;color:#dc2626;flex:0;padding:10px 14px}
        .payout-tag{display:inline-flex;align-items:center;gap:5px;background:#d1fae5;border:1px solid #a7f3d0;border-radius:7px;padding:3px 9px;font-size:11px;font-weight:700;color:#065f46;margin-top:6px}

        /* ── Info rows (profile) ── */
        .irow{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f8fafc}
        .irow:last-child{border:none}
        .ilbl{font-size:12px;font-weight:600;color:var(--faint)}
        .ival{font-size:12px;font-weight:700;color:#1e293b;max-width:58%;text-align:right;word-break:break-word}
        .dlink{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#0d9488;text-decoration:none}

        /* ── Commission tiles ── */
        .ctile{border-radius:14px;padding:20px;text-align:center}
        .cnum{font-family:var(--font-d);font-size:26px;font-weight:900;letter-spacing:-.5px}
        .clbl{font-size:10px;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.07em}

        /* ── Earning cards ── */
        .ecard{border-radius:14px;padding:20px;text-align:center;border:1px solid #f1f5f9;background:#fff}
        .ei2{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
        .ei2 svg{width:20px;height:20px}
        .enum{font-family:var(--font-d);font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-.4px}
        .elbl{font-size:10px;color:var(--faint);font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.07em}

        .banner{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;font-size:12px;font-weight:600}
        .banner.s{background:#d1fae5;color:#065f46;border:1px solid #a7f3d0}

        @keyframes toastIn{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .42s ease both}

        /* ═══════════════════════════════════════════════
           RESPONSIVE BREAKPOINTS
        ═══════════════════════════════════════════════ */

        /* Tablet: 768px–1199px — sidebar collapses to drawer */
        @media(max-width:1199px){
          .stats-grid{grid-template-columns:repeat(3,1fr)}
          .g4{grid-template-columns:repeat(2,1fr)}
        }

        @media(max-width:900px){
          .g3{grid-template-columns:repeat(2,1fr)}
        }

        @media(max-width:767px){
          /* Hide desktop sidebar */
          .sidebar{transform:translateX(-100%)}
          .sidebar.open{transform:translateX(0)}

          /* Show mobile topbar + bottom nav */
          .mobile-topbar{display:flex}
          .bottom-nav{display:flex}
          .drawer-overlay{z-index:190}

          /* Main shifts up for topbar, down for bottom nav */
          .main{margin-left:0;padding-top:56px;padding-bottom:var(--bottom-h)}
          .topbar{display:none}

          /* Tighter content padding */
          .content{padding:16px}

          /* Stats: 2 columns on mobile */
          .stats-grid{grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px}
          .stat-card{padding:14px 12px}
          .stat-num{font-size:18px}
          .stat-icon{width:34px;height:34px;margin-bottom:10px}

          /* Stack grids to 1 column */
          .g2,.g3,.g4{grid-template-columns:1fr}
          .span2{grid-column:auto}

          .card{padding:16px;border-radius:14px}
          .card-hd{font-size:13px}

          .ocard{padding:14px}

          /* Acts stack */
          .acts{flex-wrap:nowrap}
          .act{min-width:0;font-size:11px;padding:9px 10px}
        }

        @media(max-width:480px){
          .stats-grid{grid-template-columns:repeat(2,1fr);gap:8px}
          .stat-num{font-size:17px}
          .content{padding:12px}
          .ctile{padding:14px}
          .cnum{font-size:22px}
        }
      `}</style>

      <Toast t={toast} />

      {/* ── Mobile drawer overlay ── */}
      <div className={`drawer-overlay ${mobileMenu ? "open" : ""}`} onClick={() => setMobileMenu(false)} />

      {/* ── Mobile topbar ── */}
      <div className="mobile-topbar">
        <button className="icon-btn" onClick={() => setMobileMenu(v => !v)}>
          <span style={{ width: 20, height: 20, display: "flex" }}>{mobileMenu ? Ic.Close : Ic.Menu}</span>
        </button>
        <span className="mobile-brand">Bioburg</span>
        <div className={`status-chip ${agent.isOnline ? "sc-on" : "sc-off"}`} style={{ fontSize: 10, padding: "4px 10px" }}>
          <div className="chip-dot" />
          {agent.isOnline ? "Online" : "Offline"}
        </div>
        {gps && <span style={{ fontSize: 16 }}></span>}
      </div>

      <div className="layout">
        {/* ── Sidebar (desktop always visible, mobile = drawer) ── */}
        <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
          <div className="sidebar-top">
            <div className="brand-name">Bioburg</div>
            <div className="brand-sub">Delivery Network</div>
          </div>

          <nav className="sidebar-nav">
            {NAV.map(({ id, label, icon, badge }) => (
              <button key={id} className={`nav-item ${tab === id ? "on" : ""}`}
                onClick={() => { setTab(id); setMobileMenu(false); }}>
                <span style={{ width: 15, height: 15, display: "flex", flexShrink: 0 }}>{icon}</span>
                <span className="nav-lbl">{label}</span>
                {badge > 0 && <span className="nav-badge">{badge}</span>}
                {tab === id && badge === undefined && <span className="nav-dot" />}
              </button>
            ))}
          </nav>

          <div className="sidebar-foot">
            <button className={`toggle-btn ${agent.isOnline ? "on" : "off"}`}
              onClick={toggleOnline} disabled={toggling}>
              <span className={`blink ${agent.isOnline ? "on" : "off"}`} />
              {toggling ? "Updating…" : agent.isOnline ? "You're Online" : "You're Offline"}
              <span style={{ marginLeft: "auto", width: 13, height: 13, display: "flex", opacity: .7 }}>{Ic.Power}</span>
            </button>
            <div className="agent-row">
              <div className="agent-av">{agent.name?.charAt(0)}</div>
              <div>
                <div className="agent-n">{agent.name?.split(" ")[0]}</div>
                <div className="agent-id">{agent.agentId || "Agent"}</div>
              </div>
              <button className="logout" onClick={() => { localStorage.clear(); navigate("/delivery/login"); }} title="Logout">
                <span style={{ display: "flex" }}>{Ic.LogOut}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main">
          {/* Desktop topbar */}
          <header className="topbar">
            <div>
              <div className="page-title">{pageTitle}</div>
              <div className="page-date">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            <div className="sep" />
            <div className={`status-chip ${agent.isOnline ? "sc-on" : "sc-off"}`}>
              <div className="chip-dot" />{agent.isOnline ? "Online" : "Offline"}
            </div>
            {gps && (
              <div className="gps-chip">
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />GPS
              </div>
            )}
          </header>

          <div className="content">
            {/* ── Stats ── */}
            <div className="stats-grid">
              {STATS.map(({ icon, label, val, pre, suf, c, g, dec }, i) => (
                <div className="stat-card fu" key={label} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="stat-glow" style={{ background: c }} />
                  <div className="stat-icon" style={{ background: `linear-gradient(135deg,${g})` }}>
                    <span style={{ color: c, width: 18, height: 18, display: "flex" }}>{icon}</span>
                  </div>
                  <div className="stat-num">
                    {ready ? <Counter to={val} prefix={pre} suffix={suf} dec={dec || 0} /> : `${pre}0${suf}`}
                  </div>
                  <div className="stat-lbl">{label}</div>
                  <div className="stat-bar" style={{ background: `linear-gradient(90deg,${g})` }} />
                </div>
              ))}
            </div>

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div className="g2 fu" style={{ animationDelay: "260ms" }}>
                {/* Connection status card */}
                <div className="card">
                  <div className="card-hd">Connection Status</div>
                  <div className={`sbox ${agent.isOnline ? "on" : "off"}`}>
                    <div className="si" style={{ background: agent.isOnline ? "#d1fae5" : "#f1f5f9" }}>
                      <span style={{ width: 22, height: 22, display: "flex", color: agent.isOnline ? "#059669" : "#94a3b8" }}>
                        {agent.isOnline ? Ic.Wifi : Ic.WifiOff}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-d)", fontSize: 17, fontWeight: 800, color: agent.isOnline ? "#065f46" : "#475569" }}>
                        {agent.isOnline ? "Online & Ready" : "Currently Offline"}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 3, color: agent.isOnline ? "#059669" : "#94a3b8" }}>
                        {agent.isOnline ? "Receiving orders from admin" : "Toggle online to start accepting"}
                      </div>
                    </div>
                  </div>
                  {!agent.isOnline && (
                    <button className="go-btn" onClick={toggleOnline} disabled={toggling}>
                      {toggling ? "Updating…" : "Go Online →"}
                    </button>
                  )}
                </div>

                {/* Current assignment */}
                <div className="card">
                  <div className="card-hd">
                    Current Assignment
                    {assigned.length > 1 && (
                      <span style={{ fontSize: 10, background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 6, fontWeight: 700, whiteSpace: "nowrap" }}>
                        +{assigned.length - 1} queued
                      </span>
                    )}
                  </div>
                  {assigned.length > 0 ? (
                    <>
                      <div className="abox cur">
                        <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 800, color: "#92400e" }}>
                          Order #{assigned[0].orderId}
                        </div>
                        {/* Payout */}
                        {(assigned[0].deliveryPayout > 0 || assigned[0].orderAmount > 0) && (
                          <div className="payout-tag">
                             Payout: ₹{assigned[0].deliveryPayout || Math.round((assigned[0].orderAmount || 0) * (agent.commission ?? 7) / 100)}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: "#b45309", marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                          {assigned[0].customerName && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 12, height: 12, display: "flex", flexShrink: 0 }}>{Ic.User}</span>
                              {assigned[0].customerName}
                            </div>
                          )}
                          {assigned[0].customerAddress && (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                              <span style={{ width: 12, height: 12, display: "flex", flexShrink: 0, marginTop: 1 }}>{Ic.Pin}</span>
                              {assigned[0].customerAddress}
                            </div>
                          )}
                          {assigned[0].customerAddress && (
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(assigned[0].customerAddress)}`}
                              target="_blank" rel="noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#d97706", textDecoration: "none", marginTop: 2 }}>
                               Open in Maps
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Queued orders */}
                      {assigned.slice(1).map((o, i) => (
                        <div key={o._id} style={{ background: "#f8fafc", border: "1px solid #e8edf2", borderRadius: 10, padding: "10px 13px", marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 15, height: 15, display: "flex", color: "#94a3b8", flexShrink: 0 }}>{Ic.Queue}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Queue #{i + 2}: #{o.orderId}</span>
                          <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>{o.customerName}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="abox emp">
                      <div className="empty-st" style={{ padding: "28px 12px" }}>
                        <div className="ei"><span style={{ display: "flex", width: 26, height: 26 }}>{Ic.Inbox}</span></div>
                        <div style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 800, color: "#475569", marginBottom: 5 }}>No Active Assignment</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>Stay online to receive orders</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="card span2">
                  <div className="card-hd">
                    Monthly Incentive Progress
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{monthDel} / {target} deliveries</span>
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 13, color: "#64748b" }}>
                    Complete <strong style={{ color: "#0d9488" }}>{Math.max(0, target - monthDel)} more</strong> to unlock ₹{agent.incentive ?? 400} bonus
                  </div>
                  <div className="prog-track"><div className="prog-fill" style={{ width: ready ? `${prog}%` : "0%" }} /></div>
                  <div className="prog-labels">
                    <span className="prog-max">0</span>
                    <span className="prog-val">{Math.round(prog)}% complete</span>
                    <span className="prog-max">{target}</span>
                  </div>
                  {prog >= 100 && (
                    <div className="banner s" style={{ marginTop: 14 }}>
                      <span style={{ width: 16, height: 16, display: "flex", flexShrink: 0 }}>{Ic.Trophy}</span>
                      Target reached! ₹{agent.incentive ?? 400} bonus will be credited this Monday.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ASSIGNED ── */}
            {tab === "assigned" && (
              <div className="gy">
                {assigned.length > 1 && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#92400e" }}>
                    <span style={{ width: 15, height: 15, display: "flex", flexShrink: 0 }}>{Ic.Queue}</span>
                    {assigned.length} orders in queue — complete first to unlock next
                  </div>
                )}
                {assigned.length === 0
                  ? <EmptyState icon={Ic.Inbox} title="No Assigned Orders" sub="Stay online to receive orders" />
                  : assigned.map((o, i) => <OCard key={o._id} o={o} onUpd={updateOrder} delay={i * 55} queuePos={i + 1} commission={agent.commission ?? 7} />)
                }
              </div>
            )}

            {/* ── ACTIVE ── */}
            {tab === "active" && (
              <div className="gy">
                {active.length === 0
                  ? <EmptyState icon={Ic.Zap} title="No Active Deliveries" sub="Pick up an assigned order to begin" />
                  : active.map((o, i) => <OCard key={o._id} o={o} onUpd={updateOrder} delay={i * 55} commission={agent.commission ?? 7} />)
                }
              </div>
            )}

            {/* ── MAP ── */}
            {tab === "map" && (
              <div className="card fu">
                <div className="card-hd">Live Delivery Map</div>
                <MapView orders={orders} agentGps={gps} />
              </div>
            )}

            {/* ── HISTORY ── */}
            {tab === "history" && (
              <div className="gy">
                {done.length === 0
                  ? <EmptyState icon={Ic.History} title="No History Yet" sub="Completed deliveries appear here" />
                  : done.map((o, i) => <OCard key={o._id} o={o} delay={i * 55} commission={agent.commission ?? 7} />)
                }
              </div>
            )}

            {tab === "profile"  && <ProfileTab agent={agent} />}
            {tab === "earnings" && <EarningsTab agent={agent} ready={ready} />}
          </div>
        </main>
      </div>

      {/* ── Bottom Nav (mobile only) ── */}
      <nav className="bottom-nav">
        {NAV.map(({ id, label, icon, badge }) => (
          <button key={id} className={`bn-item ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>
            {badge > 0 && <span className="bn-badge">{badge}</span>}
            <span style={{ width: 20, height: 20, display: "flex" }}>{icon}</span>
            <span className="bn-lbl">{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

/* ─── Empty State ─────────────────────────────────────────────────── */
function EmptyState({ icon, title, sub }) {
  return (
    <div className="card">
      <div className="empty-st">
        <div className="ei"><span style={{ display: "flex", width: 26, height: 26 }}>{icon}</span></div>
        <div style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 800, color: "#475569", marginBottom: 5 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</div>
      </div>
    </div>
  );
}

/* ─── Order Card ─────────────────────────────────────────────────── */
function OCard({ o, onUpd, delay = 0, queuePos, commission = 7 }) {
  const pc = { Assigned: "pa", Picked: "pp", "In Transit": "pt", Delivered: "pd", Failed: "pf" }[o.status] || "pa";
  const payout = o.deliveryPayout || (o.orderAmount ? Math.round(o.orderAmount * commission / 100) : 0);
  const Ico = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;

  return (
    <div className="ocard fu" style={{ animationDelay: `${delay}ms`, opacity: queuePos > 1 ? 0.72 : 1 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 800, color: "#0f172a" }}>#{o.orderId}</span>
            <span className={`pill ${pc}`}>{o.status}</span>
            {queuePos > 1 && <span style={{ fontSize: 9, background: "#fef3c7", color: "#b45309", padding: "2px 7px", borderRadius: 5, fontWeight: 700 }}>Queue #{queuePos}</span>}
            {o.isD2C && <span style={{ fontSize: 9, background: "#eff6ff", color: "#3b82f6", padding: "2px 7px", borderRadius: 5, fontWeight: 700 }}>D2C</span>}
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>
            {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 16, fontWeight: 900, color: "#0d9488" }}>
            ₹{Number(o.orderAmount || 0).toFixed(2)}
          </div>
          {payout > 0 && (
            <div style={{ fontSize: 10, color: "#059669", fontWeight: 700, marginTop: 2 }}>+₹{payout} payout</div>
          )}
        </div>
      </div>

      {/* Info body */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 7, border: "1px solid #f1f5f9" }}>
        {o.customerName && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#334155" }}>
            <span style={{ width: 12, height: 12, display: "flex", flexShrink: 0, color: "#94a3b8" }}>
              {Ico(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>)}
            </span>
            <strong>{o.customerName}</strong>
            {o.customerPhone && <span style={{ color: "#94a3b8", marginLeft: 2 }}>· {o.customerPhone}</span>}
          </div>
        )}
        {o.customerAddress && (
          <div style={{ paddingTop: 6, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: "#334155" }}>
              <span style={{ width: 12, height: 12, display: "flex", flexShrink: 0, marginTop: 1, color: "#94a3b8" }}>
                {Ico(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>)}
              </span>
              <span style={{ flex: 1, wordBreak: "break-word" }}>{o.customerAddress}</span>
            </div>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(o.customerAddress)}`}
              target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, fontWeight: 700, color: "#3b82f6", textDecoration: "none" }}>
              🗺️ Navigate →
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      {onUpd && queuePos !== undefined && queuePos > 1 ? (
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
          Complete current order first to unlock
        </div>
      ) : onUpd && (
        <div className="acts">
          {o.status === "Assigned" && (
            <button className="act act-pk" onClick={() => onUpd(o._id, "Picked")}>
              <span style={{ width: 13, height: 13, display: "flex" }}>
                {Ico(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></>)}
              </span>Picked Up
            </button>
          )}
          {o.status === "Picked" && (
            <button className="act act-tr" onClick={() => onUpd(o._id, "In Transit")}>
              <span style={{ width: 13, height: 13, display: "flex" }}>
                {Ico(<><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>)}
              </span>Start Delivery
            </button>
          )}
          {o.status === "In Transit" && (
            <>
              <button className="act act-dl" onClick={() => onUpd(o._id, "Delivered")}>
                <span style={{ width: 13, height: 13, display: "flex" }}>
                  {Ico(<polyline points="20 6 9 17 4 12" />)}
                </span>Delivered
              </button>
              <button className="act act-f" onClick={() => onUpd(o._id, "Failed")}>
                <span style={{ width: 13, height: 13, display: "flex" }}>
                  {Ico(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>)}
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Profile Tab ─────────────────────────────────────────────────── */
function ProfileTab({ agent }) {
  const docs = agent.documents || {}, bank = agent.bankDetails || {};
  const Sec = ({ title, children }) => (
    <div className="card fu"><div className="card-hd">{title}</div>{children}</div>
  );
  const Row = ({ l, v }) => (
    <div className="irow"><span className="ilbl">{l}</span><span className="ival">{v || "—"}</span></div>
  );
  return (
    <div className="g2" style={{ gap: 16 }}>
      <Sec title="Personal">
        <Row l="Agent ID" v={agent.agentId} />
        <Row l="Full Name" v={agent.name} />
        <Row l="Mobile" v={agent.phone} />
        <Row l="Email" v={agent.email} />
        <Row l="Zone" v={agent.deliveryZone || agent.zone} />
        <Row l="Status" v={agent.status} />
        <Row l="Since" v={agent.createdAt ? new Date(agent.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"} />
      </Sec>
      <Sec title="Vehicle">
        <Row l="Type" v={agent.vehicleType} />
        <Row l="Reg. No." v={agent.vehicleNumber || agent.vehicleReg} />
        <Row l="Driving Licence" v={agent.drivingLicence} />
        <Row l="PAN" v={agent.panNumber || agent.panCard} />
      </Sec>
      <Sec title="Bank & Payment">
        <Row l="Bank" v={bank.bankName || agent.bankName} />
        <Row l="Account" v={(bank.accountNumber || agent.accountNumber) ? "••••" + String(bank.accountNumber || agent.accountNumber).slice(-4) : "—"} />
        <Row l="IFSC" v={bank.ifscCode || agent.ifscCode} />
        <Row l="UPI ID" v={agent.upiId} />
      </Sec>
      <Sec title="Documents">
        {[
          ["Aadhaar / ID Proof", docs.aadhaar || docs.aadhaarUrl],
          ["Driving Licence",    docs.licenceCopy || docs.licenceCopyUrl],
          ["Vehicle RC",         docs.vehicleRC || docs.vehicleRCUrl],
          ["Passport Photo",     docs.passportPhoto || docs.passportPhotoUrl],
          ["UPI QR Code",        docs.upiQrImage || docs.upiQrImageUrl],
        ].map(([l, url]) => (
          <div className="irow" key={l}>
            <span className="ilbl">{l}</span>
            {url
              ? <a href={url} target="_blank" rel="noreferrer" className="dlink">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  View
                </a>
              : <span style={{ fontSize: 11, color: "#cbd5e1" }}>Not uploaded</span>
            }
          </div>
        ))}
      </Sec>
    </div>
  );
}

function EarningsTab({ agent, ready }) {
  const [records,  setRecords]  = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/delivery/my-earnings-detail?page=${page}&limit=10`)
      .then(({ data }) => {
        if (data.success) {
          setRecords(data.records || []);
          setTotal(data.total   || 0);
          setSummary(data.summary);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const comm      = agent.commission              ?? 7;
  const incentive = agent.incentive               ?? 400;
  const target    = agent.incentiveDeliveryTarget ?? 100;
  const dels      = agent.totalDeliveries || 0;
  const rating    = agent.avgRating       || 0;

  const totalEarned  = summary?.totalEarned  ?? agent.totalEarnings     ?? 0;
  const totalPaid    = summary?.totalPaid    ?? 0;
  const totalPending = summary?.totalPending ?? 0;
  const pendingCount = summary?.pendingCount ?? 0;
  const avg          = dels ? Math.round(totalEarned / dels) : 0;
  const totalPages   = Math.ceil(total / 10);

  const Sv = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }} className="fu">

      {/* ── Two big summary cards ── */}
      <div className="g2">
        <div style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #a7f3d0", borderRadius: 18, padding: "22px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 12px rgba(16,185,129,.15)" }}>
            <span style={{ color: "#059669", width: 24, height: 24, display: "flex" }}>
              {Sv(<><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-5H6" /></>)}
            </span>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 900, color: "#065f46", letterSpacing: "-.5px", lineHeight: 1 }}>
              {ready ? <Counter to={totalEarned} prefix="₹" /> : "₹0"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: ".07em", marginTop: 4 }}>All-Time Earnings</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Across {dels} completed deliveries</div>
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg,#faf5ff,#ede9fe)", border: "1px solid #c4b5fd", borderRadius: 18, padding: "22px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 12px rgba(124,58,237,.15)" }}>
            <span style={{ color: "#7c3aed", width: 24, height: 24, display: "flex" }}>
              {Sv(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>)}
            </span>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 900, color: "#6d28d9", letterSpacing: "-.5px", lineHeight: 1 }}>
              {ready ? <Counter to={avg} prefix="₹" /> : "₹0"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: ".07em", marginTop: 4 }}>Avg per Delivery</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Rating: ★ {Number(rating).toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* ── Paid vs Pending breakdown ── */}
      <div className="card">
        <div className="card-hd">Payout Status</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { label: "Total Earned",    val: totalEarned,  pre: "₹", c: "#0d9488", bg: "#f0fdfa",  border: "#99f6e4" },
            { label: "Paid to Account", val: totalPaid,    pre: "₹", c: "#059669", bg: "#f0fdf4",  border: "#a7f3d0" },
            { label: "Awaiting Payout", val: totalPending, pre: "₹", c: "#d97706", bg: "#fffbeb",  border: "#fde68a" },
          ].map(({ label, val, pre, c, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 14px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 900, color: c, letterSpacing: "-.4px" }}>
                {ready ? <Counter to={val} prefix={pre} /> : `${pre}0`}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: ".07em", marginTop: 5, opacity: .85 }}>{label}</div>
            </div>
          ))}
        </div>
        {totalPending > 0 && pendingCount > 0 && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
            💳 {pendingCount} payment{pendingCount !== 1 ? "s" : ""} totalling <strong>₹{totalPending}</strong> will be transferred to your bank every Monday
          </div>
        )}
        {totalPaid > 0 && totalPending === 0 && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#d1fae5", border: "1px solid #a7f3d0", borderRadius: 10, fontSize: 12, color: "#065f46", fontWeight: 600 }}>
            ✅ All earnings have been paid — no pending payouts
          </div>
        )}
      </div>

      {/* ── Per-order earning records ── */}
      <div className="card">
        <div className="card-hd">
          Earning Records
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{total} total</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8", fontSize: 13 }}>Loading records…</div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 16px", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>💰</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>No earning records yet</div>
            <div style={{ fontSize: 12, marginTop: 5 }}>Records appear after completing deliveries</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {records.map(r => {
                const orderId = r.order?.orderId || r.order?._id?.toString().slice(-8).toUpperCase() || "—";
                const date    = new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                return (
                  <div key={r._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: r.isPaid ? "#d1fae5" : "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                      {r.isPaid ? "✅" : "⏳"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Order #{orderId}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{date} · {r.type}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--font-d)", fontSize: 16, fontWeight: 900, color: "#0d9488" }}>₹{r.amount}</div>
                      <div style={{ marginTop: 3 }}>
                        {r.isPaid ? (
                          <span style={{ fontSize: 10, background: "#d1fae5", color: "#065f46", borderRadius: 5, padding: "1px 7px", fontWeight: 700 }}>
                            Paid {r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, background: "#fef3c7", color: "#d97706", borderRadius: 5, padding: "1px 7px", fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 14 }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                  style={{ padding: "6px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "var(--font-b)", fontSize: 12, fontWeight: 600, color: "#64748b", opacity: page === 1 ? .4 : 1 }}>
                  Prev
                </button>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                  style={{ padding: "6px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", fontFamily: "var(--font-b)", fontSize: 12, fontWeight: 600, color: "#64748b", opacity: page >= totalPages ? .4 : 1 }}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Commission & Incentive ── */}
      <div className="card">
        <div className="card-hd">Commission & Incentive</div>
        <div className="g3" style={{ marginBottom: 14 }}>
          <div className="ctile" style={{ background: "linear-gradient(135deg,#f0fdfa,#ccfbf1)", border: "1px solid #99f6e4" }}>
            <div className="cnum" style={{ color: "#0d9488" }}>{comm}%</div>
            <div className="clbl" style={{ color: "#0f766e" }}>Per Delivery Commission</div>
          </div>
          <div className="ctile" style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid #fcd34d" }}>
            <div className="cnum" style={{ color: "#d97706" }}>₹{incentive}</div>
            <div className="clbl" style={{ color: "#b45309" }}>Monthly Bonus</div>
          </div>
          <div className="ctile" style={{ background: "linear-gradient(135deg,#faf5ff,#ede9fe)", border: "1px solid #c4b5fd" }}>
            <div className="cnum" style={{ color: "#7c3aed" }}>{target}</div>
            <div className="clbl" style={{ color: "#6d28d9" }}>Target / Month</div>
          </div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #f1f5f9", marginBottom: 10, fontSize: 12, color: "#64748b" }}>
          <strong style={{ color: "#334155" }}>How it's calculated:</strong> Each order payout = Order Value × {comm}%
          &nbsp;·&nbsp; Example: ₹500 order → <strong style={{ color: "#0d9488" }}>₹{Math.round(500 * comm / 100)} payout</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 10, padding: "11px 14px", fontSize: 12, color: "#065f46", fontWeight: 600 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Earnings transferred every <strong style={{ marginLeft: 3, marginRight: 3 }}>Monday</strong> to your bank account
        </div>
      </div>
    </div>
  );
}