import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_API, C, GS } from "./_hospitalSharedUtils";
import { PageHeader, SearchBar, RejectModal, DetailModal, HospitalTable } from "./_shared";

function DetailModalLocal({ hospital: h, onClose, onApprove, onReject, actionLoading }) {
  if (!h) return null;
  const fields = [["Contact Person", h.contactPerson], ["Phone", h.phone], ["City", h.city], ["State", h.state], ["Pin Code", h.pinCode], ["Reg. Number", h.registrationNumber], ["License No.", h.licenseNumber], ["Facility Type", h.facilityType], ["No. of Beds", h.numberOfBeds], ["Est. Year", h.establishedYear]].filter(([, v]) => v);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24, backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 620, boxShadow: "0 30px 80px rgba(0,0,0,0.25)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark || "#005580"})`, padding: "28px 32px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>{h.facilityName}</h2>
              <p style={{ margin: "5px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{h.email}</p>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 34, height: 34, borderRadius: 9, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div style={{ marginTop: 14 }}><StatusBadge status={h.status} /></div>
        </div>
        <div style={{ padding: "28px 32px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 32px" }}>
            {fields.map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, color: "#1e293b", fontWeight: 500 }}>{val}</div>
              </div>
            ))}
          </div>
          {h.address && <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Address</div>
            <div style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.6 }}>{h.address}</div>
          </div>}
          {h.specializations?.length > 0 && <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Specializations</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {h.specializations.map(s => <span key={s} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: C.primaryLight || "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>{s}</span>)}
            </div>
          </div>}
        </div>
        <div style={{ padding: "16px 32px 28px", display: "flex", gap: 10, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 9, border: `1.5px solid ${C.border2}`, background: C.bg, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: C.slate }}>Close</button>
          <button onClick={() => { onApprove(h._id, h.facilityName); onClose(); }} disabled={actionLoading === h._id}
            style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: actionLoading === h._id ? 0.7 : 1 }}>
            {actionLoading === h._id ? "Approving..." : "Approve Hospital"}
          </button>
          <button onClick={() => { onClose(); onReject(h); }}
            style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: C.red, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Reject Hospital</button>
        </div>
      </div>
    </div>
  );
}

export default function HospitalPending() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastSync, setLastSync]   = useState(null);
  const [search, setSearch]       = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [detailTarget, setDetailTarget]   = useState(null);
  const token = localStorage.getItem("adminToken");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${BASE_API}/api/hospital/all`, { headers: { Authorization: `Bearer ${token}` } });
      setHospitals((res.data.hospitals || []).filter(h => h.status === "pending"));
      setLastSync(new Date());
    } catch { if (!silent) toast.error("Failed to load hospitals"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(() => fetchData(true), 30000); return () => clearInterval(iv); }, [fetchData]);

  const handleApprove = async (id, name) => {
    setActionLoading(id);
    try {
      await axios.patch(`${BASE_API}/api/hospital/approve/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${name} approved`); fetchData(true);
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget._id);
    try {
      await axios.patch(`${BASE_API}/api/hospital/reject/${rejectTarget._id}`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${rejectTarget.facilityName} rejected`); setRejectTarget(null); fetchData(true);
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setActionLoading(null); }
  };

  const filtered = hospitals.filter(h => {
    const q = search.toLowerCase();
    return !q || h.facilityName?.toLowerCase().includes(q) || h.email?.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q) || h.state?.toLowerCase().includes(q) || h.registrationNumber?.toLowerCase().includes(q);
  });

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "80px 0" }}>
      <style>{GS}</style>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.border2}`, borderTopColor: C.primary, borderRadius: "50%", animation: "h-spin 0.9s linear infinite" }} />
      <div style={{ fontSize: 13, color: C.muted }}>Loading pending hospitals...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <style>{GS}</style>
      <PageHeader title="Hospital Zone — Pending Approvals" sub="Hospitals waiting for admin review and verification" lastSync={lastSync} onRefresh={() => fetchData()} />

      {/* Search + count */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 22, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#cbd5e1", fontSize: 15 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pending hospitals..."
            style={{ width: "100%", padding: "9px 12px 9px 32px", borderRadius: 9, border: `1.5px solid ${C.border2}`, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box", fontFamily: "inherit", color: "#334155" }}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border2} />
        </div>
        <span style={{ background: C.amberLight, color: "#92400e", border: `1px solid ${C.amberBorder}`, borderRadius: 99, padding: "5px 14px", fontSize: 12.5, fontWeight: 700 }}>
          {filtered.length} pending
        </span>
      </div>

      {/* All caught up */}
      {filtered.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "64px 24px", border: `1px solid ${C.border}`, textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.greenLight, border: `2px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>All caught up!</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>No hospitals are pending review{search ? " matching your search" : " right now"}.</div>
        </div>
      )}

      {/* Card grid */}
      {filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 18 }}>
          {filtered.map(h => (
            <div key={h._id} style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", animation: "h-slide 0.3s ease both" }}>
              {/* Card header */}
              <div style={{ background: `linear-gradient(135deg,${C.amberLight},#fffde7)`, borderBottom: `1px solid ${C.amberBorder}`, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.text, lineHeight: 1.3 }}>{h.facilityName}</div>
                    <div style={{ fontSize: 12, color: C.slate, marginTop: 3 }}>{h.city}{h.state ? `, ${h.state}` : ""}</div>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: "16px 20px", flex: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                  {[
                    ["Contact", h.contactPerson || "—"],
                    ["Phone", h.phone || "—"],
                    ["Reg. No.", h.registrationNumber || "—"],
                    ["Beds", h.numberOfBeds || "—"],
                    ["Type", h.facilityType || "Hospital"],
                    ["Est. Year", h.establishedYear || "—"],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Email</div>
                  <div style={{ fontSize: 12.5, color: C.primary, fontWeight: 500 }}>{h.email}</div>
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["Emergency", h.emergencyServices], ["Ambulance", h.ambulanceService], ["24x7 Rx", h.pharmacy24x7], ["ICU", h.icuAvailable]].map(([l, v]) => (
                    <span key={l} style={{ padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: v ? C.greenLight : C.bg, color: v ? "#065f46" : C.muted, border: `1px solid ${v ? C.greenBorder : C.border2}` }}>{l}</span>
                  ))}
                </div>

                <div style={{ marginTop: 10, fontSize: 11.5, color: C.muted }}>
                  Submitted: {h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                </div>
              </div>

              {/* Card footer */}
              <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, background: C.bg }}>
                <button onClick={() => setDetailTarget(h)}
                  style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1.5px solid ${C.border2}`, background: "#fff", color: C.slate, fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
                  View Details
                </button>
                <button onClick={() => handleApprove(h._id, h.facilityName)} disabled={actionLoading === h._id}
                  style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", opacity: actionLoading === h._id ? 0.7 : 1 }}>
                  {actionLoading === h._id ? "Approving..." : "Approve"}
                </button>
                <button onClick={() => setRejectTarget(h)}
                  style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1.5px solid ${C.redBorder}`, background: C.redLight, color: "#be123c", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailTarget && <DetailModalLocal hospital={detailTarget} onClose={() => setDetailTarget(null)} onApprove={handleApprove} onReject={h => { setDetailTarget(null); setRejectTarget(h); }} actionLoading={actionLoading} />}
      {rejectTarget && <RejectModal hospital={rejectTarget} onConfirm={handleRejectConfirm} onCancel={() => setRejectTarget(null)} loading={!!actionLoading} />}
    </div>
  );
}