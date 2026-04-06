import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BASE_API, C, GS } from "./_pharmacySharedUtils";

function daysLeft(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

// ── Helper: derive expiring items from inventory (≤180 days)
function getExpiringFromInventory(inventory) {
  return inventory.filter(i => {
    const d = daysLeft(i.expiryDate || i.expiry);
    return d !== null && d >= 0 && d <= 180;
  }).sort((a, b) => daysLeft(a.expiryDate || a.expiry) - daysLeft(b.expiryDate || b.expiry));
}

//LiveBadge ]
export function LiveBadge({ lastSync }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:C.greenLight, border:`1px solid ${C.greenBorder}`, borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:700, color:"#065f46" }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, display:"inline-block", animation:"ph-pulse 1.5s ease-in-out infinite" }} />
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
      <div style={{ width:36, height:36, border:`3px solid ${C.border2}`, borderTopColor:C.primary, borderRadius:"50%", animation:"ph-spin 0.9s linear infinite" }} />
      <div style={{ fontSize:13, color:C.muted }}>{msg || "Loading..."}</div>
    </div>
  );
}

// PageHeader
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

//SearchBar
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
export function RejectModal({ pharmacy, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, backdropFilter:"blur(2px)" }}>
      <div style={{ background:"#fff", borderRadius:18, padding:"32px 36px", width:460, boxShadow:"0 30px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ height:4, background:"linear-gradient(90deg,#ef4444,#f97316)", borderRadius:4, marginBottom:24 }} />
        <h3 style={{ margin:"0 0 6px", fontSize:19, fontWeight:800, color:C.text }}>Reject Pharmacy</h3>
        <p style={{ margin:"0 0 4px", fontSize:13.5, color:C.slate }}>Rejecting <strong style={{ color:C.text }}>{pharmacy?.facilityName}</strong>.</p>
        <p style={{ margin:"0 0 20px", fontSize:12.5, color:C.muted }}>This blocks the pharmacy from logging in. Provide an optional reason.</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="e.g. Invalid drug license, incomplete documentation..." rows={4}
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

//DetailModal
export function DetailModal({ pharmacy: p, onClose, onApprove, onReject }) {
  if (!p) return null;
  const fields = [
    ["Contact Person", p.contactPerson], ["Phone", p.phone], ["City", p.city], ["State", p.state],
    ["Pin Code", p.pinCode], ["License No.", p.licenseNumber || p.drugLicenseNumber],
    ["Facility Type", p.facilityType], ["GST Number", p.gstNumber],
    ["PAN Number", p.panNumber], ["Est. Year", p.establishedYear],
  ].filter(([, v]) => v);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:24, backdropFilter:"blur(2px)" }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:620, boxShadow:"0 30px 80px rgba(0,0,0,0.25)", overflow:"hidden", maxHeight:"90vh", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>
        <div style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding:"28px 32px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#fff" }}>{p.facilityName}</h2>
              <p style={{ margin:"5px 0 0", fontSize:13, color:"rgba(255,255,255,0.65)" }}>{p.email}</p>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </div>
          <div style={{ marginTop:14 }}><StatusBadge status={p.status} /></div>
        </div>
        <div style={{ padding:"28px 32px", overflowY:"auto", flex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px 32px" }}>
            {fields.map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:14, color:"#1e293b", fontWeight:500 }}>{val}</div>
              </div>
            ))}
          </div>
          {p.address && (
            <div style={{ marginTop:20, paddingTop:20, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Address</div>
              <div style={{ fontSize:13.5, color:"#334155", lineHeight:1.6 }}>{p.address}</div>
            </div>
          )}
        </div>
        <div style={{ padding:"16px 32px 28px", display:"flex", gap:10, borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px", borderRadius:9, border:`1.5px solid ${C.border2}`, background:C.bg, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:C.slate }}>Close</button>
          {p.status !== "approved" && <button onClick={() => { onApprove(p._id, p.facilityName); onClose(); }} style={{ flex:1, padding:"11px", borderRadius:9, border:"none", background:C.green, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Approve Pharmacy</button>}
          {p.status !== "rejected" && <button onClick={() => { onClose(); onReject(p); }} style={{ flex:1, padding:"11px", borderRadius:9, border:"none", background:C.red, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Reject Pharmacy</button>}
        </div>
      </div>
    </div>
  );
}

//SectionDetailModal
function SectionDetailModal({ title, headers, allRows, accentColor, onClose }) {
  const [search, setSearch] = useState("");
  const getTextFromCell = cell => {
    if (typeof cell === "string" || typeof cell === "number") return String(cell).toLowerCase();
    if (cell?.props?.children) {
      const ch = cell.props.children;
      if (typeof ch === "string" || typeof ch === "number") return String(ch).toLowerCase();
      if (Array.isArray(ch)) return ch.map(c => typeof c === "string" || typeof c === "number" ? String(c) : "").join(" ").toLowerCase();
    }
    return "";
  };
  const filteredRows = allRows.filter(row => !search || row.some(cell => getTextFromCell(cell).includes(search.toLowerCase())));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:99999, padding:20, backdropFilter:"blur(5px)" }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:880, maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 40px 100px rgba(0,0,0,0.35)", overflow:"hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ background:`linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`, padding:"20px 26px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <h2 style={{ margin:0, fontSize:19, fontWeight:800, color:"#fff", letterSpacing:"-0.3px" }}>{title}</h2>
            <p style={{ margin:"3px 0 0", fontSize:12, color:"rgba(255,255,255,0.72)" }}>
              {filteredRows.length} of {allRows.length} record{allRows.length !== 1 ? "s" : ""}
              {search && ` · matching "${search}"`}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"14px 26px", borderBottom:`1px solid ${C.border}`, flexShrink:0, background:"#fafbfc" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", fontSize:15, pointerEvents:"none" }}>⌕</span>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}...`}
              style={{ width:"100%", padding:"9px 36px 9px 34px", borderRadius:9, border:`1.5px solid ${C.border2}`, fontSize:13, outline:"none", background:"#fff", boxSizing:"border-box", color:"#334155", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor = accentColor}
              onBlur={e  => e.target.style.borderColor = C.border2} />
            {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"#e2e8f0", border:"none", borderRadius:"50%", width:20, height:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#64748b" }}>✕</button>}
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:"0 26px 22px" }}>
          {filteredRows.length === 0
            ? <div style={{ padding:"56px 0", textAlign:"center" }}><div style={{ fontSize:38, marginBottom:10 }}>🔍</div><div style={{ fontSize:14, fontWeight:600, color:"#cbd5e1" }}>No results found</div></div>
            : <div style={{ overflowX:"auto", borderRadius:11, border:`1px solid ${C.border}`, marginTop:14 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ background:C.bg }}>
                    <th style={{ padding:"9px 13px", textAlign:"left", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1.5px solid ${C.border2}`, whiteSpace:"nowrap" }}>#</th>
                    {headers.map(h => <th key={h} style={{ padding:"9px 13px", textAlign:"left", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1.5px solid ${C.border2}`, whiteSpace:"nowrap" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filteredRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom:i < filteredRows.length - 1 ? `1px solid ${C.border}` : "none", transition:"background 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding:"9px 13px", color:C.muted, fontSize:11, fontWeight:600 }}>{i + 1}</td>
                        {row.map((cell, j) => <td key={j} style={{ padding:"9px 13px", color:"#334155", verticalAlign:"middle" }}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      </div>
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
        <button onClick={onView} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"7px 0", borderRadius:8, width:"100%", border:`1.5px solid ${hov ? color : C.border2}`, background:hov ? `${color}12` : C.bg, color:hov ? color : C.slate, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:11, transition:"all 0.16s" }}>
          👁 View All Records
        </button>
      ) : (
        <div style={{ fontSize:11, color:"#cbd5e1", textAlign:"center", padding:"6px 0" }}>No records yet</div>
      )}
    </div>
  );
}

// MiniStat
function MiniStat({ label, value, color }) {
  return (
    <div style={{ background:"#fff", borderRadius:10, padding:"10px 13px", border:`1.5px solid ${color}22`, borderTop:`3px solid ${color}`, flex:"1 1 105px", minWidth:95 }}>
      <div style={{ fontSize:9, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:19, fontWeight:800, color:C.text }}>{value ?? 0}</div>
    </div>
  );
}

// ExpandedDashboard
export function ExpandedDashboard({ pharmacy }) {
  const [data,    setData]    = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync,setLastSync] = useState(null);
  const [modal,   setModal]   = useState(null);
  const token = localStorage.getItem("adminToken") || localStorage.getItem("admin_token") || localStorage.getItem("token");

  const fetchDash = useCallback(async () => {
    try {
      const [dashRes, orderRes] = await Promise.allSettled([
        axios.get(`${BASE_API}/api/pharmacy/dashboard/${pharmacy._id}`, { headers:{ Authorization:`Bearer ${token}` } }),
        // fetch all orders and filter by this pharmacy client-side
        axios.get(`${BASE_API}/api/pharmacy/orders-by-pharmacy/${pharmacy._id}`, { headers:{ Authorization:`Bearer ${token}` } }),
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
        // filter to this pharmacy's orders
        setOrders(allOrders);
      }
    } catch {
      setData({});
    } finally {
      setLoading(false);
    }
  }, [pharmacy._id, token]);

  useEffect(() => { fetchDash(); const iv = setInterval(fetchDash, 15000); return () => clearInterval(iv); }, [fetchDash]);

  const d = data || {};
  // const prescriptions = d.prescriptions || [];
  const inventory     = d.inventory     || d.medicines || [];
  // const staff         = d.staff         || [];
  const billing       = d.billing       || [];
  const suppliers     = d.suppliers     || [];
  const expiring = getExpiringFromInventory(inventory);
  const customers     = d.customers     || [];

  const getStock = item => +item.qty <= (+item.reorder || 0) ? "Low Stock" : "In Stock";
  const sc = s => ["Dispensed","Delivered","Paid","Active","Processed","Received"].includes(s) ? C.green : ["Cancelled","Unpaid","Expired"].includes(s) ? C.rose : C.amber;

  const totalBill  = billing.reduce((a,b) => a + (parseFloat((b.amount||b.totalAmount||"0").toString().replace(/[^0-9.]/g,""))||0), 0);
  const totalPaid  = billing.reduce((a,b) => a + (parseFloat((b.paid||"0").toString().replace(/[^0-9.]/g,""))||0), 0);
  const orderRev   = orders.filter(o=>o.orderStatus==="DELIVERED").reduce((a,o)=>a+(o.totalAmount||0), 0);
  const ordersPend = orders.filter(o=>["PLACED","CONFIRMED","PROCESSING"].includes(o.orderStatus)).length;

  const ID = ({ v }) => <span style={{ fontFamily:"monospace", color:C.primary, fontSize:10, fontWeight:700 }}>{v}</span>;
  const St = ({ s }) => <span style={{ color:sc(s), fontWeight:700 }}>{s}</span>;

  // const prescriptionRows = prescriptions.map(p  => [<ID v={p.id}/>, <strong>{p.patient}</strong>, p.doctor||"—", p.date||"—", <St s={p.status}/>]);
  const inventoryRows    = inventory.map(i       => [<ID v={i.id||i.medicineId}/>, <strong>{i.name||i.medicineName||i.item}</strong>, i.category||"—", <span style={{fontWeight:700,color:getStock(i)==="Low Stock"?C.rose:"#334155"}}>{i.qty||i.quantity||0}</span>, <span style={{color:getStock(i)==="Low Stock"?C.rose:C.green,fontWeight:700}}>{getStock(i)}</span>]);
  const billingRows      = billing.map(b         => { const tot=parseFloat((b.amount||b.totalAmount||"0").toString().replace(/[^0-9.]/g,""))||0; const pd=parseFloat((b.paid||"0").toString().replace(/[^0-9.]/g,""))||0; return [<ID v={b.id||b.invoiceNumber}/>,<strong>{b.patient||b.customerName}</strong>,`₹${tot.toLocaleString("en-IN")}`,<span style={{color:C.green,fontWeight:600}}>₹{pd.toLocaleString("en-IN")}</span>,<St s={b.status||b.paymentMode}/>]; });
  const supplierRows     = suppliers.map(s       => [<ID v={s.id||s.supplierId}/>, <strong>{s.name||s.supplierName}</strong>, s.contact||s.phone||"—", s.category||"—", <St s={s.status}/>]);
  // AFTER
const expiringRows = expiring.map(e => {
  const d = daysLeft(e.expiryDate || e.expiry);
  return [
    <ID v={e.id || e.medicineId}/>,
    <strong>{e.medicineName || e.name || e.medicine}</strong>,
    e.batchNumber || e.batch || "—",
    <span style={{ color: d <= 30 ? C.rose : "#f97316", fontWeight:700 }}>
      {e.expiryDate || e.expiry} ({d === 0 ? "Today!" : `${d}d left`})
    </span>,
    e.quantity || e.qty || "—",
  ];
});
  // const staffRows        = staff.map(s           => [<ID v={s.id}/>, <strong>{s.name}</strong>, s.role, s.shift, <St s={s.status}/>]);
  const customerRows     = customers.map(c       => [<ID v={c.id||c.customerId}/>, <strong>{c.name}</strong>, c.phone||"—", c.email||"—", c.joinedDate||"—"]);
  // const purchaseRows     = purchases.map(p       => [<ID v={p.id||p.purchaseOrderId}/>, <strong>{p.supplierName||p.supplier||"—"}</strong>, p.medicineName||p.items||"—", `₹${(+p.totalAmount||0).toLocaleString("en-IN")}`, <St s={p.status}/>]);
  const orderRows        = orders.map(o          => [
    <span style={{fontFamily:"monospace",color:C.primary,fontSize:10,fontWeight:700}}>{o.orderId||o._id?.slice(-8).toUpperCase()}</span>,
    o.createdAt?new Date(o.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—",
    <span style={{fontSize:12}}>{(o.items||[]).slice(0,1).map(i=>i.name||i.productId?.brandName||"Item").join(", ")}{o.items?.length>1?` +${o.items.length-1} more`:""}</span>,
    `₹${(o.totalAmount||0).toLocaleString("en-IN")}`,
    <span style={{background:o.paymentStatus==="PAID"?C.greenLight:C.amberLight,color:o.paymentStatus==="PAID"?"#065f46":"#92400e",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600}}>{o.orderStatus?.replace(/_/g," ")||"—"}</span>
  ]);

  const SH = ({ t }) => <div style={{ fontSize:10, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:7, paddingBottom:4, borderBottom:`1px solid ${C.border2}` }}>{t}</div>;

  return (
    <>
      <tr>
        <td colSpan={9} style={{ padding:0, borderBottom:`2px solid ${C.primary}22` }}>
          <div style={{ background:"linear-gradient(135deg,#f0fdf4,#f8fafc)", padding:"18px 26px" }}>

            {/* Identity bar */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18, background:"#fff", borderRadius:12, padding:"13px 16px", border:`1px solid ${C.border2}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:C.primary, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:17 }}>
                {(pharmacy.facilityName || "P").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:14, color:C.text }}>{pharmacy.facilityName}</div>
                <div style={{ fontSize:11.5, color:C.slate, marginTop:1 }}>{pharmacy.email} · {pharmacy.phone} · {pharmacy.city}, {pharmacy.state}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>License: {pharmacy.licenseNumber || pharmacy.drugLicenseNumber || "—"} · Type: {pharmacy.facilityType || "Pharmacy"}</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <LiveBadge lastSync={lastSync} />
                <button onClick={fetchDash} style={{ padding:"4px 12px", borderRadius:7, border:`1px solid ${C.border2}`, background:C.bg, fontSize:11, fontWeight:600, cursor:"pointer", color:C.slate, fontFamily:"inherit" }}>Sync</button>
              </div>
            </div>

            {loading ? (
              <div style={{ background:"#fff", borderRadius:12, padding:"36px", textAlign:"center", border:`1px solid ${C.border}` }}>
                <div style={{ width:28, height:28, border:`3px solid ${C.border2}`, borderTopColor:C.primary, borderRadius:"50%", margin:"0 auto 10px", animation:"ph-spin 1s linear infinite" }} />
                <div style={{ fontSize:13, color:C.muted }}>Fetching live dashboard data...</div>
              </div>
            ) : (
              <>
                {/*Live Summary Stats*/}
                <div style={{ marginBottom:16 }}>
                  <SH t="Live Summary" />
                  <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
                    {/* <MiniStat label="Prescriptions"  value={prescriptions.length}                                             color={C.primary} /> */}
                    <MiniStat label="Inventory"       value={inventory.length}                                                 color="#0077a3" />
                    {/* <MiniStat label="Rx Pending"      value={prescriptions.filter(p => p.status==="Pending").length}           color={C.amber} /> */}
                    <MiniStat label="Low Stock"       value={inventory.filter(i => getStock(i)==="Low Stock").length}          color={C.rose} />
                    <MiniStat label="Expiring ≤6mo" value={expiring.length}                          color="#f97316" />
                    <MiniStat label="Expired"       value={getExpiredFromInventory(inventory).length} color={C.rose}  />
                    <MiniStat label="Customers"       value={customers.length}                                                 color="#0077a3" />
                    {/* <MiniStat label="Staff"           value={staff.length}                                                     color="#7c3aed" /> */}
                    <MiniStat label="Revenue"         value={`₹${totalBill.toLocaleString("en-IN")}`}                         color={C.green} />
                    <MiniStat label="Collected"       value={`₹${totalPaid.toLocaleString("en-IN")}`}                         color={C.primary} />
                  </div>
                </div>

                {/* Orders MiniStats (BioBurg platform orders)*/}
                {orders.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <SH t="Platform Orders (BioBurg)" />
                    <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
                      <MiniStat label="Total Orders"   value={orders.length}        color={C.primary} />
                      <MiniStat label="Order Revenue"  value={`₹${orderRev.toLocaleString("en-IN")}`} color={C.green} />
                      <MiniStat label="Orders Pending" value={ordersPend}           color={C.amber} />
                      <MiniStat label="Delivered"      value={orders.filter(o=>o.orderStatus==="DELIVERED").length} color={C.green} />
                      <MiniStat label="Cancelled"      value={orders.filter(o=>o.orderStatus==="CANCELLED").length} color={C.rose} />
                    </div>
                  </div>
                )}

                {/*Section Cards grid*/}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10 }}>
                  {[
                    // { t:"Prescriptions", n:prescriptions.length, headers:["ID","Patient","Doctor","Date","Status"],         rows:prescriptionRows, color:C.primary },
                    { t:"Inventory",     n:inventory.length,     headers:["ID","Medicine","Category","Qty","Status"],       rows:inventoryRows,    color:"#0077a3" },
                    { t:"Billing",       n:billing.length,       headers:["ID","Customer","Total","Paid","Status"],         rows:billingRows,      color:C.green,
                      extra: billing.length > 0 ? (
                        <div style={{ fontSize:10.5, color:C.slate, display:"flex", gap:10, flexWrap:"wrap" }}>
                          <span>Billed: <strong>₹{totalBill.toLocaleString("en-IN")}</strong></span>
                          <span style={{color:C.green}}>Paid: <strong>₹{totalPaid.toLocaleString("en-IN")}</strong></span>
                          <span style={{color:C.rose}}>Due: <strong>₹{(totalBill-totalPaid).toLocaleString("en-IN")}</strong></span>
                        </div>
                      ) : null
                    },
                    { t:"Expiring Soon", n:expiring.length,       headers:["ID","Medicine","Batch","Expiry","Qty"],         rows:expiringRows,     color:"#f97316" },
                    { t:"Suppliers",     n:suppliers.length,      headers:["ID","Name","Contact","Category","Status"],      rows:supplierRows,     color:C.amber },
                    { t:"Customers",     n:customers.length,      headers:["ID","Name","Phone","Email","Joined"],           rows:customerRows,     color:"#7c3aed" },
                    // { t:"Purchases",     n:purchases.length,      headers:["ID","Supplier","Medicine","Total","Status"],    rows:purchaseRows,     color:C.rose },
                    // { t:"Staff",         n:staff.length,          headers:["ID","Name","Role","Shift","Status"],            rows:staffRows,        color:"#7c3aed" },
                    { t:"Orders (BioBurg)", n:orders.length,      headers:["Order ID","Date","Items","Amount","Status"],    rows:orderRows,        color:C.primary,
  extra: orders.length > 0 ? (
    <div style={{ fontSize:10.5, color:C.slate, display:"flex", gap:10, flexWrap:"wrap" }}>
      <span>Rev: <strong>₹{orderRev.toLocaleString("en-IN")}</strong></span>
      <span style={{color:C.amber}}>Pending: <strong>{ordersPend}</strong></span>
      <span style={{color:C.green}}>Done: <strong>{orders.filter(o=>o.orderStatus==="DELIVERED").length}</strong></span>
    </div>
  ) : null
},
                  ].map(({ t, n, headers, rows, color, extra }) => (
                    <SectionCard key={t} t={t} n={n} color={color} extra={extra}
                      onView={n > 0 ? () => setModal({ title:t, headers, rows, color }) : null} />
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop:12, textAlign:"center", fontSize:11, color:"#cbd5e1" }}>
              Data fetched live every 15 seconds. Click <strong style={{color:C.primary}}>👁 View All Records</strong> on any section to search & browse all records.
            </div>
          </div>
        </td>
      </tr>

      {modal && (
        <SectionDetailModal
          title={modal.title} headers={modal.headers} allRows={modal.rows}
          accentColor={modal.color} onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function getExpiredFromInventory(inventory) {
  return inventory.filter(i => {
    const d = daysLeft(i.expiryDate || i.expiry);
    return d !== null && d < 0;
  });
}
//PharmacyRow + PharmacyTable
function PharmacyRow({ p, expandedId, setExpandedId, onDetail, onApprove, onReject, actionLoading }) {
  const [hov, setHov] = useState(false);
  const isExp = expandedId === p._id;
  const isApproved = p.status === "approved";
  return (
    <React.Fragment>
      <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ borderBottom:!isExp?`1px solid ${C.border}`:"none", background:isExp?"#f0fdf4":hov?"#f8fff9":"#fff", transition:"background 0.14s" }}>
        <td style={{ padding:"14px 8px 14px 16px" }}>
          <button onClick={() => isApproved && setExpandedId(isExp ? null : p._id)}
            title={isApproved ? "View live dashboard" : "Only approved pharmacies have dashboard data"}
            style={{ width:28, height:28, borderRadius:"50%", border:`1.5px solid ${isExp?C.primary:isApproved?C.border2:C.border}`, background:isExp?C.primary:C.bg, cursor:isApproved?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", color:isExp?"#fff":isApproved?C.slate:C.border2, fontSize:10, fontWeight:700 }}>
            {isExp ? "▼" : "▶"}
          </button>
        </td>
        <td style={{ padding:"14px 16px", cursor:"pointer" }} onClick={() => onDetail(p)}>
          <div style={{ fontWeight:700, color:C.text, fontSize:14 }}>{p.facilityName || "—"}</div>
          <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{p.email}</div>
        </td>
        <td style={{ padding:"14px 16px", cursor:"pointer" }} onClick={() => onDetail(p)}>
          <div style={{ fontSize:13, color:"#334155", fontWeight:500 }}>{p.contactPerson || "—"}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{p.phone || ""}</div>
        </td>
        <td style={{ padding:"14px 16px", cursor:"pointer" }} onClick={() => onDetail(p)}>
          <div style={{ fontSize:13, color:"#334155" }}>{p.city || "—"}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{p.state || ""}</div>
        </td>
        <td style={{ padding:"14px 16px" }}>
          <span style={{ background:"#dcfce7", color:"#15803d", borderRadius:6, padding:"3px 10px", fontSize:11.5, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.03em" }}>{p.facilityType || "pharmacy"}</span>
        </td>
        <td style={{ padding:"14px 16px", fontSize:12.5, color:C.slate, fontFamily:"ui-monospace,monospace" }}>{p.licenseNumber || p.drugLicenseNumber || "—"}</td>
        <td style={{ padding:"14px 16px", fontSize:12, color:C.muted, whiteSpace:"nowrap" }}>
          {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
        </td>
        <td style={{ padding:"14px 16px" }}><StatusBadge status={p.status} /></td>
        <td style={{ padding:"14px 16px" }}>
          <div style={{ display:"flex", gap:7, alignItems:"center" }}>
            {p.status !== "approved" && (
              <button onClick={() => onApprove(p._id, p.facilityName)} disabled={actionLoading === p._id + "-approve"}
                style={{ padding:"6px 14px", borderRadius:8, border:"none", background:C.green, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit", opacity:actionLoading===p._id+"-approve"?0.7:1 }}>
                {actionLoading === p._id + "-approve" ? "..." : "Approve"}
              </button>
            )}
            {p.status !== "rejected" && (
              <button onClick={() => onReject(p)}
                style={{ padding:"6px 14px", borderRadius:8, border:`1.5px solid ${C.redBorder}`, background:C.redLight, color:"#be123c", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Reject</button>
            )}
            {p.status === "approved"  && <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>Active</span>}
            {p.status === "rejected"  && <span style={{ fontSize:12, color:C.rose,  fontWeight:600 }}>Inactive</span>}
          </div>
        </td>
      </tr>
      {isExp && isApproved && <ExpandedDashboard pharmacy={p} />}
    </React.Fragment>
  );
}

export function PharmacyTable({ pharmacies, loading, expandedId, setExpandedId, onDetail, onApprove, onReject, actionLoading, emptyMsg }) {
  if (loading) return <Spinner msg="Loading pharmacies..." />;
  const COLS = ["", "Pharmacy", "Contact", "Location", "Type", "License No.", "Registered", "Status", "Actions"];
  return (
    <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", overflow:"hidden" }}>
      {pharmacies.length === 0
        ? <div style={{ padding:"80px 0", textAlign:"center" }}><div style={{ fontSize:13, fontWeight:600, color:"#cbd5e1" }}>{emptyMsg || "No pharmacies found"}</div></div>
        : <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
              <thead><tr style={{ background:C.bg, borderBottom:`1.5px solid ${C.border2}` }}>
                {COLS.map(c => <th key={c} style={{ padding:"12px 16px", textAlign:"left", fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{c}</th>)}
              </tr></thead>
              <tbody>
                {pharmacies.map(p => (
                  <PharmacyRow key={p._id} p={p} expandedId={expandedId} setExpandedId={setExpandedId}
                    onDetail={onDetail} onApprove={onApprove} onReject={onReject} actionLoading={actionLoading} />
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  );
}