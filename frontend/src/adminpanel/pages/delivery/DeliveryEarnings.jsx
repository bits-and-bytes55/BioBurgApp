import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE = import.meta.env.VITE_API_BASE_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });
const api  = (url, opts = {}) => axios({ url: `${BASE}${url}`, headers: auth(), ...opts });

const Ic = {
  Paid:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Pending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Rupee:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-5H6"/></svg>,
  Agent:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Sync:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${color}30`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-.5px", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const cfg = { Commission:{bg:"#eff6ff",c:"#3b82f6"}, Bonus:{bg:"#dcfce7",c:"#16a34a"}, Penalty:{bg:"#fee2e2",c:"#dc2626"}, Adjustment:{bg:"#fef3c7",c:"#d97706"} }[type] || {bg:"#f1f5f9",c:"#64748b"};
  return <span style={{ background: cfg.bg, color: cfg.c, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{type}</span>;
}

export default function DeliveryEarnings() {
  const [earnings,     setEarnings]     = useState([]);
  const [total,        setTotal]        = useState(0);
  const [summary,      setSummary]      = useState({});
  const [agentSummary, setAgentSummary] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [page,         setPage]         = useState(1);
  const [selected,     setSelected]     = useState([]);
  const [agents,       setAgents]       = useState([]);
  const [agentFilter,  setAgentFilter]  = useState("");
  const [paidFilter,   setPaidFilter]   = useState("");
  const [paying,       setPaying]       = useState(null);
  const [syncing,      setSyncing]      = useState(false);
  const [showSidebar,  setShowSidebar]  = useState(false);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (agentFilter) params.agentId = agentFilter;
      if (paidFilter !== "") params.isPaid = paidFilter;
      const { data } = await api("/api/delivery/admin/earnings", { params });
      if (data.success) {
        setEarnings(data.data || []);
        setTotal(data.total || 0);
        setSummary(data.summary || {});
        setAgentSummary(data.agentSummary || []);
      }
    } catch { toast.error("Failed to load earnings"); }
    finally { setLoading(false); }
  }, [page, agentFilter, paidFilter]);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);
  useEffect(() => {
    api("/api/delivery/admin/agents", { params: { status: "approved", limit: 100 } })
      .then(r => r.data.success && setAgents(r.data.agents || r.data.data || []))
      .catch(() => {});
  }, []);

  const syncEarnings = async () => {
    setSyncing(true);
    try {
      const { data } = await api("/api/delivery/admin/earnings/sync", { method: "POST" });
      toast.success(data.message || "Sync done");
      fetchEarnings();
    } catch (e) { toast.error(e.response?.data?.message || "Sync failed"); }
    finally { setSyncing(false); }
  };

  const markPaid = async (id) => {
    setPaying(id);
    try {
      const { data } = await api(`/api/delivery/admin/earnings/${id}/pay`, { method: "PATCH" });
      toast.success(data.message || "Marked as paid ✓");
      fetchEarnings();
    } catch { toast.error("Failed"); }
    finally { setPaying(null); }
  };

  const bulkPay = async () => {
    if (!selected.length) return;
    try {
      const { data } = await api("/api/delivery/admin/earnings/bulk-pay", { method: "POST", data: { ids: selected } });
      toast.success(data.message || "Bulk payment done ✓");
      setSelected([]); fetchEarnings();
    } catch { toast.error("Bulk pay failed"); }
  };

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectAllPending = () => {
    const ids = earnings.filter(e => !e.isPaid).map(e => e._id);
    setSelected(ids.length === selected.length ? [] : ids);
  };

  const totalPages  = Math.ceil(total / 15);
  const fmt         = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const pendingTot  = earnings.filter(e => selected.includes(e._id)).reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500&display=swap');
        .er*{box-sizing:border-box}
        .er{font-family:'DM Sans',sans-serif;color:#0f172a}
        /* Table */
        .er-tbl{width:100%;border-collapse:collapse}
        .er-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.09em;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #f1f5f9;white-space:nowrap}
        .er-tbl td{padding:11px 12px;border-bottom:1px solid #f8fafc;vertical-align:middle;font-size:13px}
        .er-tbl tbody tr:hover{background:#fafbfc}
        .er-tbl tbody tr:last-child td{border-bottom:none}
        .er-tbl tbody tr.sel{background:#f0f9ff}
        /* Buttons */
        .eb{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all .18s;white-space:nowrap}
        .eb:hover:not(:disabled){opacity:.85;transform:translateY(-1px)}
        .eb:disabled{opacity:.45;cursor:not-allowed;transform:none}
        .esel{border:1.5px solid #e2e8f0;border-radius:9px;padding:7px 10px;font-size:12px;font-family:'DM Sans',sans-serif;color:#0f172a;outline:none;background:#fff;cursor:pointer;width:100%;max-width:200px}
        .pg-b{padding:6px 12px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#475569;transition:all .15s}
        .pg-b:hover:not(:disabled){background:#f8fafc}
        .pg-b:disabled{opacity:.4;cursor:not-allowed}
        /* Responsive column hiding */
        @media(max-width:900px){.er-col-order,.er-col-type{display:none}}
        @media(max-width:640px){.er-col-date{display:none}}
        @media(max-width:480px){
          .er-tbl th,.er-tbl td{padding:9px 8px;font-size:12px}
          .eb{padding:6px 10px;font-size:11px}
        }
        /* Stats grid */
        .er-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
        @media(max-width:900px){.er-stats{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.er-stats{grid-template-columns:1fr 1fr;gap:8px}}
        /* Layout */
        .er-layout{display:flex;gap:18px;align-items:flex-start}
        .er-sidebar{width:260px;flex-shrink:0;background:#fff;border:1.5px solid #f1f5f9;border-radius:16px;padding:16px 18px;position:sticky;top:20px}
        @media(max-width:1000px){
          .er-layout{flex-direction:column}
          .er-sidebar{width:100%;position:static}
        }
        /* Mobile summary drawer toggle */
        .er-summary-toggle{display:none;width:100%;padding:11px 16px;background:#f0fdfa;border:1.5px solid #a7f3d0;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#065f46;cursor:pointer;margin-bottom:14px;text-align:left}
        @media(max-width:1000px){.er-summary-toggle{display:block}}
        /* Filters row */
        .er-filters{display:flex;gap:8px;padding:12px 14px;border-bottom:1px solid #f1f5f9;flex-wrap:wrap;align-items:center}
        /* Header */
        .er-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px}
        .er-hd-btns{display:flex;gap:8px;flex-wrap:wrap}
        @media(max-width:560px){
          .er-hd{flex-direction:column}
          .er-hd-btns{width:100%}
          .eb{flex:1;justify-content:center}
        }
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="er">
        {/* Header */}
        <div className="er-hd">
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "#0f172a", letterSpacing: "-.4px" }}>Earnings Management</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>Manage and process agent payouts</div>
          </div>
          <div className="er-hd-btns">
            <button className="eb" onClick={syncEarnings} disabled={syncing}
              style={{ background: "#f0fdf4", color: "#059669", border: "1.5px solid #a7f3d0" }}>
              <span style={{ display: "flex", animation: syncing ? "spin .8s linear infinite" : "none" }}>{Ic.Sync}</span>
              {syncing ? "Syncing…" : "Sync Earnings"}
            </button>
            {selected.length > 0 && (
              <button className="eb" onClick={bulkPay}
                style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", boxShadow: "0 4px 14px rgba(16,185,129,.3)" }}>
                <span style={{ display: "flex" }}>{Ic.Check}</span>
                Pay {selected.length} — {fmt(pendingTot)}
              </button>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="er-stats">
          <StatCard label="Total Paid"    value={fmt(summary.totalPaid)}   icon={Ic.Paid}    color="#10b981" bg="#f0fdf4" />
          <StatCard label="Total Pending" value={fmt(summary.totalUnpaid)} icon={Ic.Pending} color="#f59e0b" bg="#fffbeb" />
          <StatCard label="Records"       value={Number(summary.totalCount||0).toLocaleString()} icon={Ic.Rupee} color="#6366f1" bg="#eef2ff" />
          <StatCard label="Agents"        value={agentSummary.length}      icon={Ic.Agent}   color="#0d9488" bg="#f0fdfa" />
        </div>

        {/* Empty / sync hint */}
        {!loading && summary.totalCount === 0 && (
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 14, padding: "16px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>⚠️</div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e" }}>No earning records found</div>
              <div style={{ fontSize: 12, color: "#b45309", marginTop: 3 }}>Click <strong>Sync Earnings</strong> to create records for past deliveries.</div>
            </div>
            <button className="eb" onClick={syncEarnings} disabled={syncing}
              style={{ background: "#f59e0b", color: "#fff", flexShrink: 0 }}>
              {syncing ? "Syncing…" : "Sync Now →"}
            </button>
          </div>
        )}

        {/* Mobile: agent summary toggle */}
        <button className="er-summary-toggle" onClick={() => setShowSidebar(v => !v)}>
          👥 Agent Payout Summary ({agentSummary.length}) {showSidebar ? "▲" : "▼"}
        </button>

        <div className="er-layout">
          {/* Table */}
          <div style={{ flex: 1, minWidth: 0, background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 16, overflow: "hidden" }}>
            {/* Filters */}
            <div className="er-filters">
              <select className="esel" value={agentFilter} onChange={e => { setAgentFilter(e.target.value); setPage(1); }}>
                <option value="">All Agents</option>
                {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: 5 }}>
                {[["", "All"], ["false", "Pending"], ["true", "Paid"]].map(([v, l]) => (
                  <button key={v} onClick={() => { setPaidFilter(v); setPage(1); }}
                    style={{ padding: "6px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 11, transition: "all .15s",
                      background: paidFilter === v ? "#0f172a" : "#f1f5f9", color: paidFilter === v ? "#fff" : "#64748b" }}>
                    {l}
                  </button>
                ))}
              </div>
              {earnings.some(e => !e.isPaid) && (
                <button className="eb" onClick={selectAllPending} style={{ background: "#f1f5f9", color: "#475569", marginLeft: "auto" }}>
                  {selected.length === earnings.filter(e => !e.isPaid).length ? "Deselect All" : "Select Pending"}
                </button>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="er-tbl">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" style={{ accentColor: "#6366f1", width: 14, height: 14 }}
                        checked={selected.length > 0 && selected.length === earnings.filter(e => !e.isPaid).length}
                        onChange={selectAllPending} />
                    </th>
                    <th>Agent</th>
                    <th className="er-col-order">Order</th>
                    <th>Amount</th>
                    <th className="er-col-type">Type</th>
                    <th className="er-col-date">Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Loading…</td></tr>}
                  {!loading && earnings.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
                      <div style={{ fontWeight: 700 }}>No records</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Use "Sync Earnings" to create records</div>
                    </td></tr>
                  )}
                  {!loading && earnings.map(e => (
                    <tr key={e._id} className={selected.includes(e._id) ? "sel" : ""}>
                      <td>
                        {!e.isPaid && (
                          <input type="checkbox" style={{ accentColor: "#6366f1", width: 14, height: 14 }}
                            checked={selected.includes(e._id)} onChange={() => toggleSelect(e._id)} />
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{e.agent?.name || "—"}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'DM Mono',monospace" }}>{e.agent?.agentId}</div>
                      </td>
                      <td className="er-col-order" style={{ fontFamily: "'DM Mono',monospace", color: "#4f46e5", fontWeight: 600, fontSize: 12 }}>
                        {e.order?.orderId ? `#${e.order.orderId}` : e.order?._id?.toString().slice(-8).toUpperCase() || "—"}
                      </td>
                      <td style={{ fontWeight: 800, color: "#10b981", fontSize: 14 }}>₹{e.amount}</td>
                      <td className="er-col-type"><TypeBadge type={e.type} /></td>
                      <td className="er-col-date" style={{ color: "#94a3b8", fontSize: 11 }}>
                        {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td>
                        {e.isPaid ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#dcfce7", color: "#15803d", borderRadius: 7, padding: "2px 9px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                            <span style={{ display: "flex" }}>{Ic.Check}</span>Paid
                            {e.paidAt && <span style={{ fontSize: 10, opacity: .75 }}>{new Date(e.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>}
                          </span>
                        ) : (
                          <span style={{ background: "#fef3c7", color: "#d97706", borderRadius: 7, padding: "2px 9px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>Pending</span>
                        )}
                      </td>
                      <td>
                        {!e.isPaid && (
                          <button className="eb" onClick={() => markPaid(e._id)} disabled={paying === e._id}
                            style={{ background: paying === e._id ? "#f1f5f9" : "#dcfce7", color: "#15803d", border: "1px solid #a7f3d0", padding: "5px 10px", fontSize: 11 }}>
                            <span style={{ display: "flex" }}>{Ic.Check}</span>
                            {paying === e._id ? "…" : "Paid"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{((page-1)*15)+1}–{Math.min(page*15,total)} of {total}</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button className="pg-b" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</button>
                  <span style={{ fontSize: 12, color: "#64748b", padding: "0 4px" }}>{page}/{totalPages}</span>
                  <button className="pg-b" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button>
                </div>
              </div>
            )}
          </div>

          {/* Agent summary sidebar — always visible on desktop, toggle on mobile */}
          <div className="er-sidebar" style={{ display: showSidebar || window.innerWidth >= 1000 ? undefined : "none" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", marginBottom: 14 }}>Agent Payout Summary</div>
            {agentSummary.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>No data — run Sync first</div>
            ) : agentSummary.map((a, i) => (
              <div key={a._id || i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 0", borderBottom: i < agentSummary.length - 1 ? "1px solid #f8fafc" : "none", gap: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{a.count} record{a.count !== 1 ? "s" : ""}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, background: "#dcfce7", color: "#15803d", borderRadius: 5, padding: "1px 7px", fontWeight: 700 }}>✓ {fmt(a.paid)}</span>
                    {a.pending > 0 && <span style={{ fontSize: 10, background: "#fef3c7", color: "#d97706", borderRadius: 5, padding: "1px 7px", fontWeight: 700 }}>Due {fmt(a.pending)}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 14, color: "#10b981" }}>{fmt(a.total)}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>total</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}