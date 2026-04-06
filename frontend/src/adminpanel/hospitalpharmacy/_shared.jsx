import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BASE_API, C, GS } from "./_hospitalSharedUtils";

const fmtMoney = n =>
  n >= 10000000 ? `₹${(n/10000000).toFixed(1)}Cr`
  : n >= 100000 ? `₹${(n/100000).toFixed(1)}L`
  : n >= 1000   ? `₹${(n/1000).toFixed(1)}k`
  : `₹${n}`;

// LiveBadge
export function LiveBadge({ lastSync }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:C.greenLight, border:`1px solid ${C.greenBorder}`, borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:700, color:"#065f46" }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, display:"inline-block", animation:"h-pulse 1.5s ease-in-out infinite" }} />
        Live
      </span>
      {lastSync && <span style={{ fontSize:11, color:"#cbd5e1" }}>Synced {lastSync.toLocaleTimeString("en-IN")}</span>}
    </div>
  );
}

//StatusBadge
export function StatusBadge({ status }) {
  const M = {
    pending:  { label:"Pending",  color:"#92400e", bg:"#fffbeb", border:"#fde68a", dot:"#f59e0b" },
    approved: { label:"Approved", color:"#065f46", bg:"#ecfdf5", border:"#6ee7b7", dot:"#10b981" },
    rejected: { label:"Rejected", color:"#7f1d1d", bg:"#fff1f2", border:"#fecdd3", dot:"#f43f5e" },
  };
  const s = M[status] || M.pending;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:s.bg, color:s.color, border:`1px solid ${s.border}`, borderRadius:99, padding:"4px 12px", fontSize:12, fontWeight:700, letterSpacing:"0.02em" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block" }} />
      {s.label}
    </span>
  );
}

//Spinner
export function Spinner({ msg }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 0", gap:14 }}>
      <style>{GS}</style>
      <div style={{ width:36, height:36, border:`3px solid ${C.border2}`, borderTopColor:C.primary, borderRadius:"50%", animation:"h-spin 0.9s linear infinite" }} />
      <div style={{ fontSize:13, color:C.muted }}>{msg || "Loading..."}</div>
    </div>
  );
}

//PageHeader
export function PageHeader({ title, sub, lastSync, onRefresh }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:4, height:40, borderRadius:4, background:`linear-gradient(180deg,${C.primary},${C.primaryDark})` }} />
        <div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:C.text, letterSpacing:"-0.5px" }}>{title}</h1>
          <p style={{ margin:"3px 0 0", fontSize:13, color:C.muted }}>{sub}</p>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <LiveBadge lastSync={lastSync} />
        <button onClick={onRefresh} style={{ padding:"8px 18px", borderRadius:9, border:`1.5px solid ${C.border2}`, background:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", color:C.slate, fontFamily:"inherit" }}>
          Refresh
        </button>
      </div>
    </div>
  );
}

// SearchBar
export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position:"relative", flex:1, minWidth:220 }}>
      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#cbd5e1", fontSize:15, pointerEvents:"none" }}>⌕</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Search..."}
        style={{ width:"100%", padding:"8px 12px 8px 32px", borderRadius:9, border:`1.5px solid ${C.border2}`, fontSize:13, outline:"none", background:C.bg, boxSizing:"border-box", color:"#334155", fontFamily:"inherit", transition:"border-color 0.2s" }}
        onFocus={e => e.target.style.borderColor = C.primary}
        onBlur={e  => e.target.style.borderColor = C.border2} />
    </div>
  );
}

//RejectModal
export function RejectModal({ hospital, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, backdropFilter:"blur(2px)" }}>
      <div style={{ background:"#fff", borderRadius:18, padding:"32px 36px", width:460, boxShadow:"0 30px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ height:4, background:"linear-gradient(90deg,#ef4444,#f97316)", borderRadius:4, marginBottom:24 }} />
        <h3 style={{ margin:"0 0 6px", fontSize:19, fontWeight:800, color:C.text }}>Reject Hospital</h3>
        <p style={{ margin:"0 0 4px", fontSize:13.5, color:C.slate }}>Rejecting <strong style={{ color:C.text }}>{hospital?.facilityName}</strong>.</p>
        <p style={{ margin:"0 0 20px", fontSize:12.5, color:C.muted }}>This blocks the hospital from logging in. Provide an optional reason.</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="e.g. Invalid registration number, incomplete documents..." rows={4}
          style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${C.border2}`, fontSize:13.5, color:"#334155", resize:"vertical", outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:C.bg }}
          onFocus={e => e.target.style.borderColor = C.red}
          onBlur={e  => e.target.style.borderColor = C.border2} />
        <div style={{ display:"flex", gap:10, marginTop:22 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"11px", borderRadius:9, border:`1.5px solid ${C.border2}`, background:C.bg, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:C.slate }}>Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            style={{ flex:1, padding:"11px", borderRadius:9, border:"none", background:C.red, color:"#fff", fontWeight:700, fontSize:13, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", opacity:loading?0.7:1 }}>
            {loading ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DetailModal({ hospital: h, onClose, onApprove, onReject }) {
  if (!h) return null;
 
  const fields = [
    ["Contact Person",  h.contactPerson],
    ["Phone",           h.phone],
    ["City",            h.city],
    ["State",           h.state],
    ["Pin Code",        h.pinCode],
    ["Reg. Number",     h.registrationNumber],
    ["License No.",     h.licenseNumber],
    ["Facility Type",   h.facilityType],
    ["No. of Beds",     h.numberOfBeds],
    ["Est. Year",       h.establishedYear],
    ["GST Number",      h.gstNumber],
    ["PAN Number",      h.panNumber],
    ["Designation",     h.designation],
    ["Alt. Phone",      h.alternatePhone],
  ].filter(([, v]) => v);
 
  const svcList = [
    ["Emergency",     h.emergencyServices],
    ["Ambulance",     h.ambulanceService],
    ["24×7 Pharmacy", h.pharmacy24x7],
    ["Home Delivery", h.homeDelivery],
    ["ICU",           h.icuAvailable],
  ];
 
  // Documents — only show slots that have a Cloudinary URL
  const docs = [
    ["Registration Certificate", h.registrationCertUrl],
    ["License Certificate",      h.licenseCertUrl],
    ["Owner / Director ID",      h.ownerIdDocUrl],
    ["Building / Fire Permit",   h.buildingPermitUrl],
  ].filter(([, url]) => url);
 
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:24, backdropFilter:"blur(2px)" }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:700, boxShadow:"0 30px 80px rgba(0,0,0,0.25)", overflow:"hidden", maxHeight:"92vh", display:"flex", flexDirection:"column" }}
        onClick={e => e.stopPropagation()}>
 
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding:"28px 32px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#fff" }}>{h.facilityName}</h2>
              <p style={{ margin:"5px 0 0", fontSize:13, color:"rgba(255,255,255,0.65)" }}>{h.email}</p>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </div>
          <div style={{ marginTop:14 }}><StatusBadge status={h.status} /></div>
        </div>
 
        {/* Scrollable body */}
        <div style={{ padding:"28px 32px", overflowY:"auto", flex:1 }}>
 
          {/* Info grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px 32px", marginBottom:20 }}>
            {fields.map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:14, color:"#1e293b", fontWeight:500 }}>{val}</div>
              </div>
            ))}
          </div>
 
          {/* Address */}
          {h.address && (
            <div style={{ marginBottom:20, paddingTop:18, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Address</div>
              <div style={{ fontSize:13.5, color:"#334155", lineHeight:1.6 }}>{h.address}</div>
            </div>
          )}
 
          {/* Services */}
          <div style={{ marginBottom:20, paddingTop:18, borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Services</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {svcList.map(([l, v]) => (
                <span key={l} style={{ padding:"4px 12px", borderRadius:99, fontSize:12, fontWeight:600, background:v?C.greenLight:C.bg, color:v?"#065f46":C.muted, border:`1px solid ${v?C.greenBorder:C.border2}` }}>
                  {v ? "✓" : "✗"} {l}
                </span>
              ))}
            </div>
          </div>
 
          {/* Specializations */}
          {h.specializations?.length > 0 && (
            <div style={{ marginBottom:20, paddingTop:18, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Specializations</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {h.specializations.map(s => (
                  <span key={s} style={{ padding:"4px 12px", borderRadius:99, fontSize:12, fontWeight:600, background:"#e0f2fe", color:"#0369a1", border:"1px solid #bae6fd" }}>{s}</span>
                ))}
              </div>
            </div>
          )}
 
          {/* ── Documents ── */}
          <div style={{ paddingTop:18, borderTop:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                Submitted Documents
              </div>
              <span style={{
                background: docs.length > 0 ? C.greenLight : C.amberLight,
                color:      docs.length > 0 ? "#065f46"    : "#92400e",
                border:    `1px solid ${docs.length > 0 ? C.greenBorder : C.amberBorder}`,
                borderRadius:99, padding:"1px 9px", fontSize:10.5, fontWeight:700,
              }}>
                {docs.length} uploaded
              </span>
            </div>
 
            {docs.length === 0 ? (
              <div style={{ background:C.amberLight, border:`1.5px solid ${C.amberBorder}`, borderRadius:10, padding:"14px 18px", fontSize:13, color:"#92400e" }}>
                ⚠ No documents uploaded — verify manually before approving.
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {docs.map(([label, url]) => (
                  <div key={label} style={{ background:C.bg, borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden" }}>
                    {/* Thumbnail */}
                    <div style={{ height:120, overflow:"hidden", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <img src={url} alt={label}
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}
                        onError={e => { e.target.style.display="none"; e.target.parentNode.innerHTML='<div style="color:#94a3b8;font-size:12px;text-align:center">Image unavailable</div>'; }} />
                    </div>
                    {/* Label + actions */}
                    <div style={{ padding:"10px 12px" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:6 }}>{label}</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          style={{ flex:1, textAlign:"center", fontSize:11.5, fontWeight:600, color:C.primary, background:"#e0f2fe", border:`1px solid ${C.primary}`, borderRadius:7, padding:"5px 0", textDecoration:"none" }}>
                          View ↗
                        </a>
                        <a href={url} download
                          style={{ flex:1, textAlign:"center", fontSize:11.5, fontWeight:600, color:C.slate, background:C.bg, border:`1px solid ${C.border2}`, borderRadius:7, padding:"5px 0", textDecoration:"none" }}>
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
 
        {/* Footer */}
        <div style={{ padding:"16px 32px 28px", display:"flex", gap:10, borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px", borderRadius:9, border:`1.5px solid ${C.border2}`, background:C.bg, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:C.slate }}>Close</button>
          {h.status !== "approved" && (
            <button onClick={() => { onApprove(h._id, h.facilityName); onClose(); }}
              style={{ flex:1, padding:"11px", borderRadius:9, border:"none", background:C.green, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              Approve Hospital
            </button>
          )}
          {h.status !== "rejected" && (
            <button onClick={() => { onClose(); onReject(h); }}
              style={{ flex:1, padding:"11px", borderRadius:9, border:"none", background:C.red, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              Reject Hospital
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
//EyeIcon
function EyeIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

//SectionDetailModal
function SectionDetailModal({ title, headers, allRows, accentColor, onClose }) {
  const [search, setSearch] = useState("");

  const getTextFromCell = (cell) => {
    if (typeof cell === "string" || typeof cell === "number") return String(cell).toLowerCase();
    if (cell?.props?.children) {
      const ch = cell.props.children;
      if (typeof ch === "string" || typeof ch === "number") return String(ch).toLowerCase();
      if (Array.isArray(ch)) return ch.map(c => typeof c === "string" || typeof c === "number" ? String(c) : "").join(" ").toLowerCase();
    }
    return "";
  };

  const filteredRows = allRows.filter(row =>
    !search || row.some(cell => getTextFromCell(cell).includes(search.toLowerCase()))
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:99999, padding:20, backdropFilter:"blur(5px)" }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:880, maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 40px 100px rgba(0,0,0,0.35)", overflow:"hidden" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ background:`linear-gradient(135deg,${accentColor} 0%,${accentColor}dd 100%)`, padding:"20px 26px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <h2 style={{ margin:0, fontSize:19, fontWeight:800, color:"#fff", letterSpacing:"-0.3px" }}>{title}</h2>
            <p style={{ margin:"3px 0 0", fontSize:12, color:"rgba(255,255,255,0.72)" }}>
              {filteredRows.length} of {allRows.length} record{allRows.length !== 1 ? "s" : ""}
              {search && ` · matching "${search}"`}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.32)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}>✕</button>
        </div>
        <div style={{ padding:"14px 26px", borderBottom:`1px solid ${C.border}`, flexShrink:0, background:"#fafbfc" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", fontSize:15, pointerEvents:"none" }}>⌕</span>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()} by any field...`}
              style={{ width:"100%", padding:"9px 36px 9px 34px", borderRadius:9, border:`1.5px solid ${C.border2}`, fontSize:13, outline:"none", background:"#fff", boxSizing:"border-box", color:"#334155", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor = accentColor}
              onBlur={e  => e.target.style.borderColor = C.border2} />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"#e2e8f0", border:"none", borderRadius:"50%", width:20, height:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#64748b" }}>✕</button>
            )}
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:"0 26px 22px" }}>
          {filteredRows.length === 0 ? (
            <div style={{ padding:"56px 0", textAlign:"center" }}>
              <div style={{ fontSize:38, marginBottom:10 }}>🔍</div>
              <div style={{ fontSize:14, fontWeight:600, color:"#cbd5e1" }}>No results found</div>
              <div style={{ fontSize:12, color:"#e2e8f0", marginTop:3 }}>Try a different search term</div>
            </div>
          ) : (
            <div style={{ overflowX:"auto", borderRadius:11, border:`1px solid ${C.border}`, marginTop:14 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:C.bg }}>
                    <th style={{ padding:"9px 13px", textAlign:"left", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1.5px solid ${C.border2}`, whiteSpace:"nowrap" }}>#</th>
                    {headers.map(h => (
                      <th key={h} style={{ padding:"9px 13px", textAlign:"left", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1.5px solid ${C.border2}`, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => (
                    <tr key={i}
                      style={{ borderBottom: i < filteredRows.length - 1 ? `1px solid ${C.border}` : "none", transition:"background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fbff"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding:"9px 13px", color:C.muted, fontSize:11, fontWeight:600 }}>{i + 1}</td>
                      {row.map((cell, j) => (
                        <td key={j} style={{ padding:"9px 13px", color:"#334155", verticalAlign:"middle" }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

//MiniStat
function MiniStat({ label, value, color, sub }) {
  return (
    <div style={{ background:"#fff", borderRadius:10, padding:"10px 13px", border:`1.5px solid ${color}22`, borderTop:`3px solid ${color}`, flex:"1 1 105px", minWidth:95 }}>
      <div style={{ fontSize:9, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:19, fontWeight:800, color:C.text, lineHeight:1 }}>{value ?? 0}</div>
      {sub && <div style={{ fontSize:9.5, color:C.muted, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

//SectionCard
function SectionCard({ t, n, color, onView, extra }) {
  const [hov, setHov] = useState(false);
  const hasData = n > 0;
  return (
    <div style={{ background:"#fff", borderRadius:12, padding:"14px 16px", border:`1px solid ${C.border}`, borderTop:`3px solid ${color}`, boxShadow:"0 1px 3px rgba(0,0,0,0.04)", display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:9.5, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.08em" }}>{t}</div>
        <span style={{ background:hasData ? `${color}18` : C.bg, color:hasData ? color : C.muted, borderRadius:20, padding:"2px 9px", fontSize:11, fontWeight:800 }}>{n}</span>
      </div>
      {extra && extra}
      {hasData ? (
        <button onClick={onView}
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"7px 0", borderRadius:8, width:"100%", border:`1.5px solid ${hov ? color : C.border2}`, background:hov ? `${color}12` : C.bg, color:hov ? color : C.slate, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:11, transition:"all 0.16s" }}>
          <EyeIcon size={12} />
          View All Records
        </button>
      ) : (
        <div style={{ fontSize:11, color:"#cbd5e1", textAlign:"center", padding:"6px 0" }}>No records yet</div>
      )}
    </div>
  );
}

function OrderStatusPill({ status }) {
  const map = {
    PLACED:           { bg:"#eff6ff",   color:"#1d4ed8",  border:"#bfdbfe"  },
    CONFIRMED:        { bg:"#ecfdf5",   color:"#065f46",  border:"#6ee7b7"  },
    PROCESSING:       { bg:"#f5f3ff",   color:"#5b21b6",  border:"#ddd6fe"  },
    SHIPPED:          { bg:"#eff6ff",   color:"#1d4ed8",  border:"#bfdbfe"  },
    OUT_FOR_DELIVERY: { bg:"#fffbeb",   color:"#92400e",  border:"#fde68a"  },
    DELIVERED:        { bg:"#ecfdf5",   color:"#065f46",  border:"#6ee7b7"  },
    CANCELLED:        { bg:"#fff1f2",   color:"#be123c",  border:"#fecdd3"  },
    UNDER_REVIEW:     { bg:"#fffbeb",   color:"#92400e",  border:"#fde68a"  },
    APPROVED:         { bg:"#ecfdf5",   color:"#065f46",  border:"#6ee7b7"  },
    REJECTED:         { bg:"#fff1f2",   color:"#be123c",  border:"#fecdd3"  },
  };
  const s = map[status] || { bg:C.bg, color:C.slate, border:C.border2 };
  return (
    <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`, borderRadius:99, padding:"2px 9px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
      {(status || "—").replace(/_/g, " ")}
    </span>
  );
}
export function ExpandedDashboard({ hospital }) {
  const [data,        setData]        = useState(null);
  const [orders,      setOrders]      = useState([]);     
  const [loading,     setLoading]     = useState(true);
  const [lastSync,    setLastSync]    = useState(null);
  const [modal,       setModal]       = useState(null);
  const token = localStorage.getItem("adminToken") || localStorage.getItem("admin_token") || localStorage.getItem("token");

  
const fetchDash = useCallback(async () => {
  try {
    const headers = { Authorization: `Bearer ${token}` };

    const [dashRes, orderRes] = await Promise.allSettled([
      axios.get(`${BASE_API}/api/hospital/dashboard/${hospital._id}`, { headers }),
      axios.get(`${BASE_API}/api/hospital/orders`, { headers }),
    ]);

    if (dashRes.status === "fulfilled") {
      setData(dashRes.value.data.dashboard || {});
      setLastSync(new Date());
    } else {
      setData({});
    }

    if (orderRes.status === "fulfilled") {
      const payload = orderRes.value.data;
      const allOrders = Array.isArray(payload) ? payload : (payload.orders || []);
      const hospitalOrders = allOrders.filter(
        o => o.hospitalRef?._id?.toString() === hospital._id?.toString()
          || o.hospitalId?.toString() === hospital._id?.toString()
      );
      setOrders(hospitalOrders);
    }
  } catch {
    setData({});
  } finally {
    setLoading(false);
  }
}, [hospital._id, token]);

  useEffect(() => {
    fetchDash();
    const iv = setInterval(fetchDash, 15000);
    return () => clearInterval(iv);
  }, [fetchDash]);

  const d = data || {};
  const patients     = d.patients     || [];
  const appointments = d.appointments || [];
  const doctors      = d.doctors      || [];
  const departments  = d.departments  || [];
  const lab          = d.lab          || [];
  const billing      = d.billing      || [];
  const inventory    = d.inventory    || [];
  const staff        = d.staff        || [];

  //Order-derived stats
  const totalOrderRevenue = orders.reduce((a, o) => a + (o.totalAmount || 0), 0);
  const deliveredOrders   = orders.filter(o => o.orderStatus === "DELIVERED").length;
  const pendingOrders     = orders.filter(o => ["PLACED","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY"].includes(o.orderStatus)).length;

  const getStock  = item => +item.qty <= (+item.reorder || 0) ? "Low Stock" : "In Stock";
  const sc        = s => ["Available","Confirmed","Completed","Paid"].includes(s) ? C.green : ["Emergency","Unpaid","Cancelled"].includes(s) ? C.rose : C.amber;
  const totalBill = billing.reduce((a, b) => a + (parseFloat((b.amount||"0").toString().replace(/[^0-9.]/g,""))||0), 0);
  const totalPaid = billing.reduce((a, b) => a + (parseFloat((b.paid||"0").toString().replace(/[^0-9.]/g,""))||0), 0);
  const occBeds   = departments.reduce((a, x) => a + (+x.occupied||0), 0);
  const totalBeds = departments.reduce((a, x) => a + (+x.capacity||0), 0);

  const ID = ({ v }) => <span style={{ fontFamily:"monospace", color:C.primary, fontSize:10, fontWeight:700 }}>{v}</span>;
  const St = ({ s }) => <span style={{ color:sc(s), fontWeight:700 }}>{s}</span>;

  // ── Row builders ──────────────────────────────────────────────────────
  const patientRows     = patients.map(p     => [<ID v={p.id}/>, <strong>{p.name}</strong>, p.age, p.dept, <St s={p.status}/>]);
  const appointmentRows = appointments.map(a => [<ID v={a.id}/>, <strong>{a.patient}</strong>, a.dept, a.time, <St s={a.status}/>]);
  const doctorRows      = doctors.map(doc    => [<ID v={doc.id}/>, <strong>{doc.name}</strong>, doc.spec, doc.shift, <St s={doc.status}/>]);
  const deptRows        = departments.map(dep=> [<strong>{dep.name}</strong>, dep.head||"—", dep.capacity, <span style={{fontWeight:700,color:+dep.occupied/+dep.capacity>0.85?C.rose:C.green}}>{dep.occupied}</span>, dep.opd||0]);
  const labRows         = lab.map(l          => [<ID v={l.id}/>, <strong>{l.patient}</strong>, l.test, <St s={l.status}/>, l.result||"—"]);
  const billingRows     = billing.map(b      => {
    const tot = parseFloat((b.amount||"0").toString().replace(/[^0-9.]/g,""))||0;
    const pd  = parseFloat((b.paid||"0").toString().replace(/[^0-9.]/g,""))||0;
    return [<ID v={b.id}/>, <strong>{b.patient}</strong>, `₹${tot.toLocaleString("en-IN")}`, <span style={{color:C.green,fontWeight:600}}>₹{pd.toLocaleString("en-IN")}</span>, <St s={b.status}/>];
  });
  const inventoryRows   = inventory.map(item => [<ID v={item.id}/>, <strong>{item.item}</strong>, item.category, <span style={{fontWeight:700,color:getStock(item)==="Low Stock"?C.rose:"#334155"}}>{item.qty}</span>, <span style={{color:getStock(item)==="Low Stock"?C.rose:C.green,fontWeight:700}}>{getStock(item)}</span>]);
  const staffRows       = staff.map(s        => [<ID v={s.id}/>, <strong>{s.name}</strong>, s.role, s.shift, <St s={s.status}/>]);

  // Orders row builder
  const orderRows = orders.map(o => [
    <span style={{ fontFamily:"monospace", color:C.primary, fontSize:10, fontWeight:700 }}>
      {o.orderId || o._id?.slice(-8).toUpperCase()}
    </span>,
    <div style={{ maxWidth:160 }}>
      {(o.items || []).slice(0, 2).map((item, j) => (
        <div key={j} style={{ fontSize:11, color:"#334155", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {item.name || "Unnamed"} × {item.quantity}
        </div>
      ))}
      {(o.items?.length || 0) > 2 && <div style={{ fontSize:10, color:C.muted }}>+{o.items.length - 2} more</div>}
    </div>,
    o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—",
    <strong style={{ color:C.green }}>{fmtMoney(o.totalAmount || 0)}</strong>,
    <span style={{ fontSize:11, background:o.paymentMode==="ONLINE"?"#eff6ff":C.bg, color:o.paymentMode==="ONLINE"?C.primary:C.slate, border:`1px solid ${o.paymentMode==="ONLINE"?C.primary:C.border2}`, borderRadius:6, padding:"1px 7px", fontWeight:600 }}>
      {o.paymentMode || "—"}
    </span>,
    <OrderStatusPill status={o.orderStatus} />,
  ]);

  //Section header helper
  const SH = ({ t, n, headers, rows, color }) => {
    const [hov, setHov] = useState(false);
    const hasData = n > 0;
    return (
      <div style={{ fontSize:10, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:7, paddingBottom:4, borderBottom:`1px solid ${C.border2}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span>{t}</span>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {n !== undefined && (
            <span style={{ background:C.bg, color:C.muted, borderRadius:20, padding:"1px 7px", fontSize:9.5, fontWeight:700 }}>{n}</span>
          )}
          {hasData && headers && rows && (
            <button
              onClick={() => setModal({ title:t, headers, rows, color: color || C.primary })}
              onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
              title={`View all ${t}`}
              style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 9px 2px 7px", borderRadius:20, border:`1.5px solid ${hov ? (color||C.primary) : C.border2}`, background:hov ? `${color||C.primary}14` : C.bg, color:hov ? (color||C.primary) : C.muted, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.05em", transition:"all 0.16s" }}>
              <EyeIcon size={11} />
              View All
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <tr>
        <td colSpan={9} style={{ padding:0, borderBottom:`2px solid ${C.primary}22` }}>
          <div style={{ background:"linear-gradient(135deg,#f0f9ff,#f8fafc)", padding:"18px 26px" }}>

            {/* ── Identity bar ── */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18, background:"#fff", borderRadius:12, padding:"13px 16px", border:`1px solid ${C.border2}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:C.primary, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:17 }}>
                {(hospital.facilityName||"H").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:14, color:C.text }}>{hospital.facilityName}</div>
                <div style={{ fontSize:11.5, color:C.slate, marginTop:1 }}>{hospital.email} · {hospital.phone} · {hospital.city}, {hospital.state}</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <LiveBadge lastSync={lastSync} />
                <button onClick={fetchDash} style={{ padding:"4px 12px", borderRadius:7, border:`1px solid ${C.border2}`, background:C.bg, fontSize:11, fontWeight:600, cursor:"pointer", color:C.slate, fontFamily:"inherit" }}>Sync</button>
              </div>
            </div>

            {loading ? (
              <div style={{ background:"#fff", borderRadius:12, padding:"36px", textAlign:"center", border:`1px solid ${C.border}` }}>
                <div style={{ width:28, height:28, border:`3px solid ${C.border2}`, borderTopColor:C.primary, borderRadius:"50%", margin:"0 auto 10px", animation:"h-spin 1s linear infinite" }} />
                <div style={{ fontSize:13, color:C.muted }}>Fetching live dashboard data...</div>
              </div>
            ) : (
              <>
                {/* ════════════════════════════════════════════
                    LIVE SUMMARY STAT ROW — orders added here
                ════════════════════════════════════════════ */}
                <div style={{ marginBottom:16 }}>
                  <SH t="Live Summary" />
                  <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
                    <MiniStat label="Patients"        value={patients.length}                                         color={C.primary} />
                    <MiniStat label="Appointments"    value={appointments.length}                                     color="#7c3aed" />
                    <MiniStat label="Beds Occ/Total"  value={`${occBeds}/${totalBeds}`}                               color={C.amber} />
                    <MiniStat label="Doctors on Duty" value={doctors.filter(d => d.status==="Available").length}      color={C.green} />
                    <MiniStat label="Lab Pending"     value={lab.filter(l => l.status==="Pending").length}            color={C.rose} />
                    <MiniStat label="Unpaid Bills"    value={billing.filter(b => b.status==="Unpaid").length}         color={C.rose} />
                    <MiniStat label="Low Stock"       value={inventory.filter(i => getStock(i)==="Low Stock").length} color={C.amber} />
                    <MiniStat label="Revenue"         value={`₹${totalBill.toLocaleString("en-IN")}`}                 color={C.green} />
                    <MiniStat label="Collected"       value={`₹${totalPaid.toLocaleString("en-IN")}`}                 color={C.primary} />
                    {/* ── NEW ORDER STATS ── */}
                    <MiniStat label="Orders"          value={orders.length}                                           color="#0891b2" />
                    <MiniStat label="Order Revenue"   value={fmtMoney(totalOrderRevenue)}                            color={C.green} sub={`${deliveredOrders} delivered`} />
                    <MiniStat label="Orders Pending"  value={pendingOrders}                                           color={C.amber} />
                  </div>
                </div>

                {/*SECTION CARDS — Orders card added at end*/}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                  {[
                    { t:"Patients",     n:patients.length,     headers:["ID","Name","Age","Dept","Status"],            rows:patientRows,     color:C.primary },
                    { t:"Appointments", n:appointments.length, headers:["ID","Patient","Dept","Time","Status"],         rows:appointmentRows, color:"#7c3aed" },
                    { t:"Doctors",      n:doctors.length,      headers:["ID","Name","Specialization","Shift","Status"], rows:doctorRows,      color:C.green },
                    { t:"Departments",  n:departments.length,  headers:["Name","Head","Beds","Occupied","OPD"],         rows:deptRows,        color:C.amber },
                    { t:"Lab & Tests",  n:lab.length,          headers:["ID","Patient","Test","Status","Result"],       rows:labRows,         color:C.rose },
                    {
                      t:"Billing", n:billing.length,
                      headers:["ID","Patient","Total","Paid","Status"], rows:billingRows, color:C.green,
                      extra: billing.length > 0 ? (
                        <div style={{ fontSize:10.5, color:C.slate, display:"flex", gap:10, flexWrap:"wrap" }}>
                          <span>Billed: <strong>₹{totalBill.toLocaleString("en-IN")}</strong></span>
                          <span style={{color:C.green}}>Paid: <strong>₹{totalPaid.toLocaleString("en-IN")}</strong></span>
                          <span style={{color:C.rose}}>Due: <strong>₹{(totalBill-totalPaid).toLocaleString("en-IN")}</strong></span>
                        </div>
                      ) : null,
                    },
                    { t:"Inventory",    n:inventory.length,    headers:["ID","Item","Category","Qty","Status"],         rows:inventoryRows,   color:C.amber },
                    { t:"Staff",        n:staff.length,        headers:["ID","Name","Role","Shift","Status"],           rows:staffRows,       color:"#7c3aed" },
                    //Orders section card
                    {
                      t:"Orders", n:orders.length,
                      headers:["Order ID","Items","Date","Amount","Payment","Status"], rows:orderRows, color:"#0891b2",
                      extra: orders.length > 0 ? (
                        <div style={{ fontSize:10.5, color:C.slate, display:"flex", gap:10, flexWrap:"wrap" }}>
                          <span>Revenue: <strong style={{color:C.green}}>{fmtMoney(totalOrderRevenue)}</strong></span>
                          <span>Delivered: <strong style={{color:C.green}}>{deliveredOrders}</strong></span>
                          <span style={{color:C.amber}}>Pending: <strong>{pendingOrders}</strong></span>
                        </div>
                      ) : null,
                    },
                  ].map(({ t, n, headers, rows, color, extra }) => (
                    <SectionCard key={t} t={t} n={n} color={color} extra={extra}
                      onView={n > 0 ? () => setModal({ title:t, headers, rows, color }) : null} />
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop:12, textAlign:"center", fontSize:11, color:"#cbd5e1" }}>
              Data fetched live every 15 seconds. Click <strong style={{color:C.primary}}>👁 View All</strong> on any section to search & browse all records.
            </div>
          </div>
        </td>
      </tr>

      {modal && (
        <SectionDetailModal title={modal.title} headers={modal.headers} allRows={modal.rows} accentColor={modal.color} onClose={() => setModal(null)} />
      )}
    </>
  );
}

//HospitalRow
function HospitalRow({ h, expandedId, setExpandedId, onDetail, onApprove, onReject, actionLoading }) {
  const [hov, setHov] = useState(false);
  const isExp      = expandedId === h._id;
  const isApproved = h.status === "approved";
  return (
    <React.Fragment>
      <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ borderBottom:!isExp?`1px solid ${C.border}`:"none", background:isExp?"#f0f9ff":hov?"#f8fbff":"#fff", transition:"background 0.14s" }}>
        <td style={{ padding:"14px 8px 14px 16px" }}>
          <button onClick={() => isApproved && setExpandedId(isExp ? null : h._id)}
            title={isApproved ? "View live dashboard" : "Only approved hospitals have dashboard data"}
            style={{ width:28, height:28, borderRadius:"50%", border:`1.5px solid ${isExp?C.primary:isApproved?C.border2:C.border}`, background:isExp?C.primary:C.bg, cursor:isApproved?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", color:isExp?"#fff":isApproved?C.slate:C.border2, fontSize:10, fontWeight:700 }}>
            {isExp ? "▼" : "▶"}
          </button>
        </td>
        <td style={{ padding:"14px 16px", cursor:"pointer" }} onClick={() => onDetail(h)}>
          <div style={{ fontWeight:700, color:C.text, fontSize:14 }}>{h.facilityName || "—"}</div>
          <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{h.email}</div>
        </td>
        <td style={{ padding:"14px 16px", cursor:"pointer" }} onClick={() => onDetail(h)}>
          <div style={{ fontSize:13, color:"#334155", fontWeight:500 }}>{h.contactPerson || "—"}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{h.phone || ""}</div>
        </td>
        <td style={{ padding:"14px 16px", cursor:"pointer" }} onClick={() => onDetail(h)}>
          <div style={{ fontSize:13, color:"#334155" }}>{h.city || "—"}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{h.state || ""}</div>
        </td>
        <td style={{ padding:"14px 16px" }}>
          <span style={{ background:"#e0f2fe", color:"#0369a1", borderRadius:6, padding:"3px 10px", fontSize:11.5, fontWeight:600, textTransform:"uppercase" }}>{h.facilityType || "hospital"}</span>
        </td>
        <td style={{ padding:"14px 16px", fontSize:12.5, color:C.slate, fontFamily:"ui-monospace,monospace" }}>{h.registrationNumber || "—"}</td>
        <td style={{ padding:"14px 16px", fontSize:12, color:C.muted, whiteSpace:"nowrap" }}>
          {h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
        </td>
        <td style={{ padding:"14px 16px" }}><StatusBadge status={h.status} /></td>
        <td style={{ padding:"14px 16px" }}>
          <div style={{ display:"flex", gap:7, alignItems:"center" }}>
            {h.status !== "approved" && (
              <button onClick={() => onApprove(h._id, h.facilityName)} disabled={actionLoading === h._id + "-approve"}
                style={{ padding:"6px 14px", borderRadius:8, border:"none", background:C.green, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit", opacity:actionLoading===h._id+"-approve"?0.7:1 }}>
                {actionLoading === h._id + "-approve" ? "..." : "Approve"}
              </button>
            )}
            {h.status !== "rejected" && (
              <button onClick={() => onReject(h)}
                style={{ padding:"6px 14px", borderRadius:8, border:`1.5px solid ${C.redBorder}`, background:C.redLight, color:"#be123c", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Reject</button>
            )}
            {h.status === "approved" && <span style={{ fontSize:12, color:C.green,  fontWeight:600 }}>Active</span>}
            {h.status === "rejected" && <span style={{ fontSize:12, color:C.rose,   fontWeight:600 }}>Inactive</span>}
          </div>
        </td>
      </tr>
      {isExp && isApproved && <ExpandedDashboard hospital={h} />}
    </React.Fragment>
  );
}

//HospitalTable
export function HospitalTable({ hospitals, loading, expandedId, setExpandedId, onDetail, onApprove, onReject, actionLoading, emptyMsg }) {
  if (loading) return <Spinner msg="Loading hospitals..." />;
  const COLS = ["", "Hospital", "Contact", "Location", "Type", "Reg. No.", "Registered", "Status", "Actions"];
  return (
    <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", overflow:"hidden" }}>
      {hospitals.length === 0 ? (
        <div style={{ padding:"80px 0", textAlign:"center" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#cbd5e1" }}>{emptyMsg || "No hospitals found"}</div>
        </div>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
            <thead>
              <tr style={{ background:C.bg, borderBottom:`1.5px solid ${C.border2}` }}>
                {COLS.map(c => <th key={c} style={{ padding:"12px 16px", textAlign:"left", fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {hospitals.map(h => (
                <HospitalRow key={h._id} h={h} expandedId={expandedId} setExpandedId={setExpandedId}
                  onDetail={onDetail} onApprove={onApprove} onReject={onReject} actionLoading={actionLoading} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}