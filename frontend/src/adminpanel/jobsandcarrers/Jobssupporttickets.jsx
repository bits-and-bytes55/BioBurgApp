import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const STATUS_META = {
  open:        { label: "Open",        bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
  in_progress: { label: "In Progress", bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  resolved:    { label: "Resolved",    bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  closed:      { label: "Closed",      bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
};

const PRIORITY_META = {
  low:    { label: "Low",    bg: "#f0fdf4", color: "#15803d" },
  medium: { label: "Medium", bg: "#eff6ff", color: "#1d4ed8" },
  high:   { label: "High",   bg: "#fff7ed", color: "#c2410c" },
  urgent: { label: "Urgent", bg: "#fff1f2", color: "#be123c" },
};

const fmt     = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function JobsSupportTickets() {
  const token   = localStorage.getItem("adminToken") || localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const containerRef = useRef(null);
  const [w, setW] = useState(800);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setW(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    setW(containerRef.current.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const isMobile = w < 600;
  const isTablet = w >= 600 && w < 900;

  const [tickets, setTickets]               = useState([]);
  const [stats, setStats]                   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [selected, setSelected]             = useState(null);
  const [statusFilter, setStatusFilter]     = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch]                 = useState("");
  const [page, setPage]                     = useState(1);
  const [totalPages, setTotalPages]         = useState(1);
  const [total, setTotal]                   = useState(0);
  const [updating, setUpdating]             = useState(false);
  const [filtersOpen, setFiltersOpen]       = useState(false);
  const [editStatus,   setEditStatus]       = useState("");
  const [editPriority, setEditPriority]     = useState("");
  const [editNote,     setEditNote]         = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const r = await axios.get(`${BASE_API}/api/jobs-support/stats`, { headers });
      const d = r.data.success ? r.data.data : r.data;
      setStats(d);
    } catch { /* silent — stats are optional */ }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter)   params.status   = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search)         params.search   = search;
      const r = await axios.get(`${BASE_API}/api/jobs-support`, { headers, params });
      const d = r.data.success ? r.data.data : (r.data.tickets ?? r.data.data ?? []);
      setTickets(d);
      setTotalPages(r.data.pages ?? Math.max(1, Math.ceil((r.data.total ?? d.length) / 15)));
      setTotal(r.data.total ?? d.length);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, search]);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openDetail = (ticket) => {
    setSelected(ticket);
    setEditStatus(ticket.status    || "open");
    setEditPriority(ticket.priority || "medium");
    setEditNote(ticket.adminNote   || "");
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await axios.patch(
        `${BASE_API}/api/jobs-support/${selected._id}`,
        { status: editStatus, priority: editPriority, adminNote: editNote },
        { headers }
      );
      toast.success("Ticket updated!");
      setSelected(null);
      fetchTickets();
      fetchStats();
    } catch { toast.error("Update failed"); }
    finally { setUpdating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this ticket permanently?")) return;
    try {
      await axios.delete(`${BASE_API}/api/jobs-support/${id}`, { headers });
      toast.success("Ticket deleted");
      if (selected?._id === id) setSelected(null);
      fetchTickets();
      fetchStats();
    } catch { toast.error("Delete failed"); }
  };

  const lbl = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" };

  return (
    <div ref={containerRef} style={{ fontFamily: "'DM Sans','Inter',sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .strow:hover{background:#f0f9ff!important;cursor:pointer;}
        .strow{transition:background .12s;}
        .stbtn:hover{opacity:.82;}
        input:focus,select:focus,textarea:focus{outline:2px solid #0077a3;outline-offset:1px;}
        .tcard:hover{box-shadow:0 6px 24px rgba(0,119,163,.12)!important;transform:translateY(-1px);}
        .tcard{transition:all .18s ease;}
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: isMobile ? "20px 16px 16px" : "28px 32px 20px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#0077a3", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
          Jobs & Careers Support
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Support Tickets</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              {isMobile ? "Candidate support tickets" : "All support tickets submitted via the Jobs & Careers page"}
            </p>
          </div>
          {isMobile && (
            <button onClick={() => setFiltersOpen(o => !o)}
              style={{ padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#0077a3", background: "#f0f9ff", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {filtersOpen ? "▲ Hide" : "▼ Filter"}
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: isMobile ? "16px 12px" : isTablet ? "20px 20px" : "24px 32px" }}>

        {/* ── Stats Row ── */}
        {stats && (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(5,1fr)",
            gap: isMobile ? 8 : 14,
            marginBottom: isMobile ? 16 : 24,
          }}>
            {[
              { label: "Total",       val: stats.total,                          bg: "#f8fafc", color: "#0f172a" },
              { label: "Open",        val: stats.open,                           bg: "#fef9c3", color: "#854d0e" },
              { label: "In Progress", val: stats.in_progress ?? stats.inProgress, bg: "#eff6ff", color: "#1d4ed8" },
              { label: "Resolved",    val: stats.resolved,                       bg: "#f0fdf4", color: "#15803d" },
              { label: "Closed",      val: stats.closed,                         bg: "#f1f5f9", color: "#475569" },
            ].map((st, i) => (
              <div key={st.label} style={{
                background: st.bg, borderRadius: isMobile ? 10 : 12,
                padding: isMobile ? "12px 10px" : "16px 20px",
                border: "1px solid #e2e8f0",
                animation: `fadeUp .3s ease ${i * 0.05}s both`,
                display: isMobile && (st.label === "In Progress" || st.label === "Closed") ? "none" : "block",
              }}>
                <p style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: st.color, margin: 0 }}>{st.val ?? 0}</p>
                <p style={{ fontSize: isMobile ? 9 : 11, fontWeight: 700, color: "#94a3b8", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {st.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters ── */}
        {(!isMobile || filtersOpen) && (
          <div style={{
            background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
            padding: isMobile ? "14px" : "16px 20px",
            marginBottom: 14,
            display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end",
          }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={lbl}>Search</label>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Name, email, subject..."
                style={{ display: "block", marginTop: 6, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, width: "100%", fontFamily: "inherit" }} />
            </div>
            <div style={{ flex: "0 1 150px" }}>
              <label style={lbl}>Status</label>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ display: "block", marginTop: 6, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, width: "100%", fontFamily: "inherit", cursor: "pointer" }}>
                <option value="">All Statuses</option>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ flex: "0 1 150px" }}>
              <label style={lbl}>Priority</label>
              <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
                style={{ display: "block", marginTop: 6, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, width: "100%", fontFamily: "inherit", cursor: "pointer" }}>
                <option value="">All Priorities</option>
                {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <button onClick={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); setPage(1); }}
              style={{ padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#64748b", background: "#fff", cursor: "pointer" }}>
              ✕ Reset
            </button>
          </div>
        )}

        {/* ── DESKTOP TABLE ── */}
        {!isMobile && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "auto", boxShadow: "0 2px 16px rgba(0,0,0,.05)", marginBottom: 16 }}>
            {loading ? <LoadingSpinner /> : tickets.length === 0 ? <EmptyState /> : (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["#", "Name / Email", "Category", "Subject", "Status", "Priority", "Date", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t, i) => {
                    const sm = STATUS_META[t.status]     || STATUS_META.open;
                    const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                    return (
                      <tr key={t._id} className="strow"
                        style={{ borderBottom: "1px solid #f1f5f9", animation: `fadeUp .22s ease ${i * 0.03}s both` }}>
                        <td style={{ padding: "13px 14px", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
                          #{String(t._id).slice(-6).toUpperCase()}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{t.name}</p>
                          <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{t.email}</p>
                          {t.phone && <p style={{ fontSize: 10, color: "#94a3b8", margin: "1px 0 0" }}>{t.phone}</p>}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#374151" }}>{t.category || "—"}</td>
                        <td style={{ padding: "13px 14px", maxWidth: 200 }}>
                          <span style={{ fontSize: 13, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.message}</span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: sm.bg, color: sm.color }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.dot, display: "inline-block" }} />{sm.label}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: pm.bg, color: pm.color }}>{pm.label}</span>
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>{fmtDate(t.createdAt)}</td>
                        <td style={{ padding: "13px 14px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="stbtn" onClick={() => openDetail(t)}
                              style={{ padding: "6px 12px", background: "#0077a3", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              View
                            </button>
                            <button className="stbtn" onClick={() => handleDelete(t._id)}
                              style={{ padding: "6px 10px", background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── MOBILE CARDS ── */}
        {isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {loading ? <LoadingSpinner /> : tickets.length === 0 ? <EmptyState /> : (
              tickets.map((t, i) => {
                const sm = STATUS_META[t.status]     || STATUS_META.open;
                const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                return (
                  <div key={t._id} className="tcard"
                    style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e8eef4", boxShadow: "0 2px 10px rgba(0,0,0,.05)", animation: `fadeUp .25s ease ${i * 0.04}s both` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: sm.bg, color: sm.color }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.dot, display: "inline-block" }} />{sm.label}
                        </span>
                        <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 6, background: pm.bg, color: pm.color }}>{pm.label}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", flexShrink: 0 }}>
                        #{String(t._id).slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 4px", lineHeight: 1.4 }}>{t.subject}</h3>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {t.message}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{t.name}</p>
                        <p style={{ fontSize: 11, color: "#64748b", margin: "1px 0 0" }}>{t.category} · {fmtDate(t.createdAt)}</p>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="stbtn" onClick={() => openDetail(t)}
                          style={{ padding: "7px 14px", background: "#0077a3", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          View
                        </button>
                        <button className="stbtn" onClick={() => handleDelete(t._id)}
                          style={{ padding: "7px 10px", background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Showing {tickets.length} of {total} tickets</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                style={{ padding: "7px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#374151", background: "#fff", cursor: "pointer", opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ padding: "7px 14px", fontSize: 13, color: "#0077a3", fontWeight: 600 }}>Page {page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                style={{ padding: "7px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#374151", background: "#fff", cursor: "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ══ DETAIL MODAL ══ */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
          <div style={{
            background: "#fff",
            borderRadius: isMobile ? "20px 20px 0 0" : 20,
            width: "100%", maxWidth: isMobile ? "100%" : 620,
            maxHeight: isMobile ? "92vh" : "90vh",
            overflowY: "auto",
            boxShadow: "0 32px 80px rgba(0,0,0,.25)",
            animation: "fadeUp .2s ease both",
          }}>
            <div style={{ background: "linear-gradient(135deg,#003d57,#0077a3)", borderRadius: isMobile ? "20px 20px 0 0" : "20px 20px 0 0", padding: isMobile ? "18px 20px" : "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, color: "#7dd3fc", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 3px" }}>
                  Ticket #{String(selected._id).slice(-8).toUpperCase()}
                </p>
                <h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.subject}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>✕</button>
            </div>

            <div style={{ padding: isMobile ? "18px 16px 24px" : "24px 28px 28px" }}>
              <div style={{
                background: "#f8fafc", borderRadius: 10, padding: isMobile ? "14px" : "16px 18px",
                marginBottom: 18,
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? "8px" : "10px 20px",
              }}>
                {[
                  ["Name",      selected.name],
                  ["Email",     selected.email],
                  ["Phone",     selected.phone || "—"],
                  ["Category",  selected.category],
                  ["Source",    selected.source || "Jobs & Careers"],
                  ["Submitted", fmt(selected.createdAt)],
                  ...(selected.resolvedAt ? [["Resolved", fmt(selected.resolvedAt)]] : []),
                ].map(([label, val]) => (
                  <div key={label} style={{ display: isMobile ? "flex" : "block", gap: 8, alignItems: "baseline" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0, flexShrink: 0 }}>{label}:</p>
                    <p style={{ fontSize: 13, color: "#0f172a", fontWeight: 500, margin: isMobile ? 0 : "2px 0 0", wordBreak: "break-all" }}>{val}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Message from Candidate</p>
                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#0f172a", lineHeight: 1.7 }}>
                  {selected.message}
                </div>
              </div>

              {selected.adminNote && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Previous Admin Note</p>
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#78350f", lineHeight: 1.7 }}>
                    {selected.adminNote}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Update Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Priority</label>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                    {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Admin Note (internal)</label>
                <textarea value={editNote} onChange={e => setEditNote(e.target.value)}
                  placeholder="Add internal notes, actions taken, follow-up details..."
                  rows={3} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                <button onClick={() => setSelected(null)}
                  style={{ flex: isMobile ? "1 1 auto" : "unset", padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#64748b", background: "#fff", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(selected._id)}
                  style={{ flex: isMobile ? "1 1 auto" : "unset", padding: "10px 14px", background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  🗑 Delete
                </button>
                <button onClick={handleUpdate} disabled={updating}
                  style={{ flex: isMobile ? "1 0 100%" : "unset", padding: "10px 22px", background: updating ? "#94a3b8" : "linear-gradient(135deg,#0077a3,#003d57)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: updating ? "wait" : "pointer" }}>
                  {updating ? "Saving..." : "✓ Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const LoadingSpinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 12 }}>
    <div style={{ width: 28, height: 28, border: "3px solid #e2e8f0", borderTop: "3px solid #0077a3", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
    <span style={{ color: "#64748b", fontSize: 14 }}>Loading tickets...</span>
  </div>
);

const EmptyState = () => (
  <div style={{ textAlign: "center", padding: 60 }}>
    <span style={{ fontSize: 36 }}>🎫</span>
    <p style={{ fontWeight: 700, color: "#1e293b", marginTop: 12 }}>No tickets found</p>
    <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Try adjusting filters or wait for candidates to submit tickets</p>
  </div>
);