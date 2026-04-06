import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const ARM_STYLES = {
  Army:       { bg:"#fef9c3", color:"#854d0e", dot:"#eab308" },
  Navy:       { bg:"#eff6ff", color:"#1d4ed8", dot:"#3b82f6" },
  "Air Force":{ bg:"#f5f3ff", color:"#6d28d9", dot:"#a855f7" },
  Any:        { bg:"#f1f5f9", color:"#475569", dot:"#94a3b8" },
};

const TYPE_STYLES = {
  "Full-Time":  { bg:"#dcfce7", color:"#15803d", dot:"#22c55e" },
  "Part-Time":  { bg:"#dbeafe", color:"#1d4ed8", dot:"#3b82f6" },
  Internship:   { bg:"#fef9c3", color:"#a16207", dot:"#eab308" },
  Contract:     { bg:"#f3e8ff", color:"#7c3aed", dot:"#a855f7" },
  Consultant:   { bg:"#fff7ed", color:"#c2410c", dot:"#f97316" },
  Freelance:    { bg:"#f0fdf4", color:"#065f46", dot:"#10b981" },
};

const SVC_YRS = ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","15+"];

const SUPPORT_CATEGORIES = [
  "Application Status Enquiry",
  "Job Posting Query",
  "Technical Issue",
  "Document Submission Help",
  "Interview Scheduling",
  "Offer Letter / Joining Query",
  "Other",
];

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

//  Support Modal 
function SupportModal({ onClose }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", category: "", subject: "", message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.category || !form.subject || !form.message) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE_API}/api/exservice-support`, {
        ...form,
        source: "ExService Careers Page",
        zone: "Jobs & ExService",
      });
      setTicketId(res.data.ticketId || res.data.data?._id || "—");
      setSubmitted(true);
      toast.success("Support ticket raised successfully!");
    } catch {
      toast.error("Failed to raise ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)",
      backdropFilter: "blur(4px)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeUp .2s ease both",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
      }}>
        {/* Modal Header */}
        <div style={{
          background: "linear-gradient(135deg,#1a1a2e,#0f3460)",
          borderRadius: "20px 20px 0 0", padding: "24px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 4px" }}>
              Jobs & ExService Zone
            </p>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Playfair Display',serif" }}>
              Raise a Support Ticket
            </h3>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
            width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {submitted ? (
          // Success state
          <div style={{ padding: "48px 32px", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg,#22c55e,#16a34a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, margin: "0 auto 20px",
            }}>✓</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", fontFamily: "'Playfair Display',serif" }}>
              Ticket Raised Successfully!
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 20px", lineHeight: 1.7 }}>
              Our team will reach out to you within 24–48 hours.<br/>
              Keep your email handy for updates.
            </p>
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 10, padding: "12px 20px", marginBottom: 24,
              display: "inline-block",
            }}>
              <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>Ticket Reference: </span>
              <span style={{ fontSize: 13, color: "#166534", fontWeight: 700, fontFamily: "monospace" }}>#{String(ticketId).slice(-8).toUpperCase()}</span>
            </div>
            <br/>
            <button onClick={onClose} style={{
              padding: "10px 28px", background: "#0077a3", color: "#fff",
              border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}>Close</button>
          </div>
        ) : (
          // Form
          <div style={{ padding: "28px 28px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", marginBottom: 16 }}>
              <div>
                <label style={ml}>Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Your full name" style={mi} />
              </div>
              <div>
                <label style={ml}>Email Address *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" style={mi} />
              </div>
              <div>
                <label style={ml}>Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX" style={mi} />
              </div>
              <div>
                <label style={ml}>Category *</label>
                <select name="category" value={form.category} onChange={handleChange} style={ms}>
                  <option value="">Select category</option>
                  {SUPPORT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={ml}>Subject *</label>
              <input name="subject" value={form.subject} onChange={handleChange}
                placeholder="Brief subject of your query" style={mi} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={ml}>Message *</label>
              <textarea name="message" value={form.message} onChange={handleChange}
                placeholder="Describe your issue or query in detail..."
                rows={4} style={{ ...mi, resize: "vertical", lineHeight: 1.6 }} />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{
                padding: "10px 20px", border: "1px solid #e2e8f0", borderRadius: 10,
                fontSize: 14, fontWeight: 600, color: "#64748b", background: "#fff",
                cursor: "pointer",
              }}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} style={{
                padding: "10px 28px",
                background: submitting ? "#94a3b8" : "linear-gradient(135deg,#0077a3,#0f3460)",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 600, cursor: submitting ? "wait" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page 
export default function ExServiceCareersPage() {
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTitle, setSearchTitle] = useState("");
  const [armFilter, setArmFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [locFilter, setLocFilter] = useState("");
  const [svcFrom, setSvcFrom]     = useState("");
  const [svcTo, setSvcTo]         = useState("");
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w < 640;
  const isTablet = w >= 640 && w < 1024;
  const px = isMobile ? "12px" : "24px";

  useEffect(() => {
    axios.get(`${BASE_API}/api/exservice-jobs/public`)
      .then(r => setJobs(r.data.jobs ?? []))
      .finally(() => setLoading(false));
  }, []);

  const locations = ["", ...new Set(jobs.map(j => j.location).filter(Boolean))];

  const filtered = jobs.filter(j => {
    const matchTitle = !searchTitle || j.title?.toLowerCase().includes(searchTitle.toLowerCase()) || j.department?.toLowerCase().includes(searchTitle.toLowerCase());
    const matchArm   = !armFilter   || j.serviceArm === armFilter || j.serviceArm === "Any";
    const matchType  = !typeFilter  || j.jobType === typeFilter;
    const matchLoc   = !locFilter   || j.location === locFilter;
    const svcMin     = parseInt(j.minServiceYears || 0);
    const matchFrom  = !svcFrom || svcMin >= parseInt(svcFrom);
    const matchTo    = !svcTo   || svcMin <= parseInt(svcTo);
    return matchTitle && matchArm && matchType && matchLoc && matchFrom && matchTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleReset = () => {
    setSearchTitle(""); setArmFilter(""); setTypeFilter("");
    setLocFilter(""); setSvcFrom(""); setSvcTo(""); setPage(1);
  };

  const fmt = d => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
  const filterCols = isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(5,1fr)";

  return (
    <div style={{ fontFamily:"'DM Sans','Inter',sans-serif", background:"#f1f4f8", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
        .exjr:hover{background:#eff6ff!important;cursor:pointer;}
        .exjr{transition:background .15s;}
        .exjcard:hover{box-shadow:0 10px 36px rgba(0,119,163,.16)!important;transform:translateY(-2px)!important;}
        .exjcard{transition:all .2s ease!important;}
        input:focus,select:focus,textarea:focus{outline:2px solid #0077a3;outline-offset:1px;}
        .exsbtn:hover{background:#005b7f!important;}
        .exrbtn:hover{background:#fee2e2!important;color:#b91c1c!important;border-color:#fca5a5!important;}
        .expb:hover:not([disabled]){background:#0077a3!important;color:#fff!important;}
        .sup-card:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,119,163,.2)!important;}
        .sup-card{transition:all .25s ease;}
        .sup-btn:hover{background:#005b7f!important;transform:scale(1.02);}
        .sup-btn{transition:all .2s ease;}
        .faq-item:hover .faq-q{color:#0077a3!important;}
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", padding:isMobile?"48px 20px 56px":"72px 48px 80px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 30% 50%,rgba(0,119,163,0.3) 0%,transparent 60%)", pointerEvents:"none" }}/>
        <p style={{ fontSize:12, fontWeight:700, color:"#60a5fa", textTransform:"uppercase", letterSpacing:"0.18em", marginBottom:16 }}>Honour · Service · Excellence</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?26:44, fontWeight:700, color:"#fff", lineHeight:1.2, margin:"0 0 16px" }}>Careers for Ex-Servicemen</h1>
        <p style={{ fontSize:isMobile?14:17, color:"rgba(255,255,255,0.75)", maxWidth:560, margin:"0 auto 32px", lineHeight:1.8 }}>
          Your service to the nation is your greatest qualification. Explore opportunities built for veterans.
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:16 }}>
          {[
            ["Active Openings", jobs.length],
            ["Army / Navy / AF", `${jobs.filter(j=>j.serviceArm==="Army").length} / ${jobs.filter(j=>j.serviceArm==="Navy").length} / ${jobs.filter(j=>j.serviceArm==="Air Force").length}`],
            ["Open to All Arms", jobs.filter(j=>j.serviceArm==="Any").length],
          ].map(([l,v]) => (
            <div key={l} style={{ background:"rgba(255,255,255,0.1)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"14px 24px", textAlign:"center" }}>
              <p style={{ fontSize:isMobile?20:26, fontWeight:700, color:"#fff", margin:0 }}>{v}</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.65)", margin:"4px 0 0", textTransform:"uppercase", letterSpacing:"0.06em" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEARCH PANEL ── */}
      <div style={{ maxWidth:1200, margin:isMobile?"-16px auto 0":"-32px auto 0", padding:`0 ${px}`, position:"relative", zIndex:10, animation:"fadeUp .5s ease both" }}>
        <div style={{ background:"#fff", borderRadius:16, boxShadow:"0 8px 40px rgba(0,0,0,.1)", overflow:"hidden" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:isMobile?"14px 16px":"20px 28px", borderBottom:"1px solid #f1f5f9" }}>
            <h2 style={{ fontSize:isMobile?14:17, fontWeight:700, color:"#0f172a", margin:0 }}>Search for Jobs</h2>
            {isMobile && (
              <button onClick={() => setFiltersOpen(o => !o)}
                style={{ padding:"6px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, fontWeight:600, color:"#0077a3", background:"#f0f9ff", cursor:"pointer" }}>
                {filtersOpen ? "▲ Hide" : "▼ Filters"}
              </button>
            )}
          </div>
          {(!isMobile || filtersOpen) && (
            <div style={{ padding:isMobile?"16px":"20px 28px" }}>
              <div style={{ display:"grid", gridTemplateColumns:filterCols, gap:"16px 20px", marginBottom:20 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={lbl}>Role / Department</label>
                  <input type="text" placeholder="e.g. Security Manager" value={searchTitle}
                    onChange={e => setSearchTitle(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && setPage(1)} style={inp} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={lbl}>Service Arm</label>
                  <select value={armFilter} onChange={e => { setArmFilter(e.target.value); setPage(1); }} style={sel}>
                    <option value="">All Arms</option>
                    {["Army","Navy","Air Force"].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={lbl}>Location</label>
                  <select value={locFilter} onChange={e => { setLocFilter(e.target.value); setPage(1); }} style={sel}>
                    <option value="">All Locations</option>
                    {locations.filter(Boolean).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={lbl}>Min. Service Years</label>
                  <div style={{ display:"flex", gap:8 }}>
                    <select value={svcFrom} onChange={e => setSvcFrom(e.target.value)} style={{ ...sel, flex:1 }}>
                      <option value="">From</option>
                      {SVC_YRS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={svcTo} onChange={e => setSvcTo(e.target.value)} style={{ ...sel, flex:1 }}>
                      <option value="">To</option>
                      {SVC_YRS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={lbl}>Employment Type</label>
                  <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} style={sel}>
                    <option value="">All Types</option>
                    {["Full-Time","Part-Time","Internship","Contract","Consultant","Freelance"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:isMobile?"stretch":"flex-end" }}>
                <button className="exrbtn" onClick={handleReset}
                  style={{ flex:isMobile?1:"unset", padding:"9px 20px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, fontWeight:600, color:"#64748b", background:"#fff", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
                  ✕ Reset
                </button>
                <button className="exsbtn" onClick={() => setPage(1)}
                  style={{ flex:isMobile?1:"unset", display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 24px", background:"#0077a3", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"background .2s" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  Search
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── LISTINGS ── */}
      <div style={{ maxWidth:1200, margin:"24px auto 0", padding:`0 ${px}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:isMobile?"flex-start":"center", flexDirection:isMobile?"column":"row", gap:10, marginBottom:12 }}>
          <div>
            <h2 style={{ fontSize:isMobile?17:20, fontWeight:700, color:"#0f172a", margin:0 }}>Current Openings</h2>
            <p style={{ fontSize:13, color:"#64748b", marginTop:3 }}>
              {loading ? "Loading..." : `${filtered.length} opening${filtered.length!==1?"s":""} found`}
            </p>
          </div>
          {!isMobile && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:13, color:"#64748b" }}>Show:</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ padding:"6px 10px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:13, color:"#374151", background:"#fff", cursor:"pointer" }}>
                {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
        </div>

        {!loading && (
          <p style={{ fontSize:13, color:"#64748b", marginBottom:14, lineHeight:1.6 }}>
            Proud to hire India's veterans. Don't see a suitable role?{" "}
            <span style={{ color:"#0077a3", cursor:"pointer", textDecoration:"underline" }} onClick={() => navigate("/register/exservice")}>Submit your profile here</span>.
          </p>
        )}

        {/* Desktop table */}
        {!isMobile && (
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", overflow:"auto", boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
            {loading ? <LoadingState/> : filtered.length===0 ? <EmptyState onReset={handleReset}/> : (
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    {["Job Title","Department","Location","Service Arm","Employment Type","Min. Service","Posted On"].map(h => (
                      <th key={h} style={{ padding:"13px 18px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".07em", borderBottom:"1px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((job, i) => {
                    const arm = job.serviceArm || "Any";
                    const as  = ARM_STYLES[arm] || ARM_STYLES.Any;
                    const ts  = TYPE_STYLES[job.jobType] || TYPE_STYLES["Full-Time"];
                    return (
                      <tr key={job._id} className="exjr"
                        style={{ borderBottom:"1px solid #f1f5f9", animation:`fadeUp .3s ease ${i*.04}s both` }}
                        onClick={() => navigate(`/exservice/jobs/${job._id}`)}>
                        <td style={{ padding:"14px 18px" }}>
                          <span style={{ color:"#0077a3", fontWeight:600, fontSize:14, fontFamily:"'Playfair Display',serif" }}>{job.title}</span>
                        </td>
                        <td style={{ padding:"14px 18px", fontSize:13, color:"#374151" }}>{job.department||"—"}</td>
                        <td style={{ padding:"14px 18px" }}>
                          <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:13, color:"#64748b" }}>
                            {job.location ? (<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{job.location}</>) : "—"}
                          </span>
                        </td>
                        <td style={{ padding:"14px 18px" }}>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, padding:"4px 10px", borderRadius:20, background:as.bg, color:as.color }}>
                            <span style={{ width:6, height:6, borderRadius:"50%", background:as.dot, display:"inline-block", flexShrink:0 }}/>{arm}
                          </span>
                        </td>
                        <td style={{ padding:"14px 18px" }}>
                          {job.jobType ? (
                            <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, padding:"4px 10px", borderRadius:20, background:ts.bg, color:ts.color }}>
                              <span style={{ width:6, height:6, borderRadius:"50%", background:ts.dot, display:"inline-block", flexShrink:0 }}/>{job.jobType}
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ padding:"14px 18px", fontSize:13, color:"#64748b" }}>
                          {job.minServiceYears ? `${job.minServiceYears} yrs` : "—"}
                        </td>
                        <td style={{ padding:"14px 18px", fontSize:13, color:"#94a3b8", whiteSpace:"nowrap" }}>{fmt(job.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Mobile cards */}
        {isMobile && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {loading ? <LoadingState/> : filtered.length===0 ? <EmptyState onReset={handleReset}/> : (
              paginated.map((job, i) => {
                const arm = job.serviceArm || "Any";
                const as  = ARM_STYLES[arm] || ARM_STYLES.Any;
                const ts  = TYPE_STYLES[job.jobType] || TYPE_STYLES["Full-Time"];
                return (
                  <div key={job._id} className="exjcard"
                    style={{ background:"#fff", borderRadius:14, padding:18, border:"1px solid #e8eef4", boxShadow:"0 2px 12px rgba(0,0,0,.05)", animation:`fadeUp .3s ease ${i*.05}s both`, cursor:"pointer" }}
                    onClick={() => navigate(`/exservice/jobs/${job._id}`)}>
                    <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:10 }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, background:as.bg, color:as.color }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:as.dot, display:"inline-block" }}/>{arm}
                      </span>
                      {job.jobType && (
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, background:ts.bg, color:ts.color }}>
                          <span style={{ width:5, height:5, borderRadius:"50%", background:ts.dot, display:"inline-block" }}/>{job.jobType}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>{job.title}</h3>
                    {job.department && <p style={{ fontSize:12, color:"#0077a3", fontWeight:600, margin:"0 0 10px" }}>{job.department}</p>}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:10 }}>
                      {job.location && <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#64748b" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{job.location}</span>}
                      {job.minServiceYears > 0 && <span style={{ fontSize:12, color:"#64748b" }}>{job.minServiceYears}+ yrs</span>}
                      {job.minRank && <span style={{ fontSize:12, color:"#64748b" }}>{job.minRank}+</span>}
                      {job.salary && <span style={{ fontSize:12, color:"#64748b" }}>{job.salary}</span>}
                    </div>
                    {job.description && <p style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, margin:"0 0 10px" }}>{job.description.slice(0,90)}{job.description.length>90?"…":""}</p>}
                    <div style={{ paddingTop:10, borderTop:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:11, color:"#94a3b8" }}> {fmt(job.createdAt)}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:"#0077a3", display:"flex", alignItems:"center", gap:4 }}>Apply Now <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:isMobile?4:6, marginTop:24, flexWrap:"wrap" }}>
            <button className="expb" disabled={page===1} onClick={() => setPage(p => p-1)}
              style={{ padding:isMobile?"6px 10px":"7px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, fontWeight:500, color:"#374151", background:"#fff", cursor:"pointer", transition:"all .15s", opacity:page===1?0.4:1 }}>
              ←{!isMobile&&" Prev"}
            </button>
            {Array.from({ length: totalPages }, (_,i) => i+1)
              .filter(p => p===1 || p===totalPages || Math.abs(p-page) <= (isMobile?1:2))
              .reduce((acc,p,idx,arr) => { if(idx>0 && p-arr[idx-1]>1) acc.push("…"); acc.push(p); return acc; },[])
              .map((p,idx) => p==="…"
                ? <span key={`d${idx}`} style={{ color:"#94a3b8", fontSize:14 }}>…</span>
                : <button key={p} className="expb" onClick={() => setPage(p)}
                    style={{ padding:isMobile?"6px 10px":"7px 14px", border:"1px solid", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer", transition:"all .15s", color:page===p?"#fff":"#374151", background:page===p?"#0077a3":"#fff", borderColor:page===p?"#0077a3":"#e2e8f0" }}>{p}</button>
              )}
            <button className="expb" disabled={page===totalPages} onClick={() => setPage(p => p+1)}
              style={{ padding:isMobile?"6px 10px":"7px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, fontWeight:500, color:"#374151", background:"#fff", cursor:"pointer", transition:"all .15s", opacity:page===totalPages?0.4:1 }}>
              {!isMobile&&"Next "}→
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SUPPORT SECTION
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:1200, margin:"48px auto 0", padding:`0 ${px}` }}>
        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:40 }}>
          <div style={{ flex:1, height:1, background:"linear-gradient(to right,transparent,#e2e8f0)" }}/>
          <span style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.14em", whiteSpace:"nowrap" }}>
            Veteran Support
          </span>
          <div style={{ flex:1, height:1, background:"linear-gradient(to left,transparent,#e2e8f0)" }}/>
        </div>

        {/* Support Hero Banner */}
        <div style={{
          background:"linear-gradient(135deg,#1a1a2e 0%,#0f3460 60%,#0077a3 100%)",
          borderRadius:20, padding:isMobile?"32px 24px":"48px 56px",
          display:"flex", flexDirection:isMobile?"column":"row",
          alignItems:"center", gap:32, marginBottom:32,
          position:"relative", overflow:"hidden",
          boxShadow:"0 20px 60px rgba(0,119,163,0.25)",
        }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:-60, right:100, width:160, height:160, borderRadius:"50%", background:"rgba(0,119,163,0.2)", pointerEvents:"none" }}/>

          <div style={{ flex:1 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(96,165,250,0.15)", border:"1px solid rgba(96,165,250,0.3)", borderRadius:20, padding:"5px 14px", marginBottom:16 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#60a5fa", animation:"pulse 2s infinite", display:"inline-block" }}/>
              <span style={{ fontSize:11, fontWeight:700, color:"#60a5fa", textTransform:"uppercase", letterSpacing:"0.1em" }}>Live Support Available</span>
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:32, fontWeight:700, color:"#fff", margin:"0 0 12px", lineHeight:1.3 }}>
              Need Help? We're Here<br/>for Our Veterans.
            </h2>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.72)", lineHeight:1.8, margin:"0 0 28px", maxWidth:480 }}>
              Whether it's an application query, technical issue, or guidance on the recruitment pipeline — raise a ticket and our team responds within 24 hours.
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
              <button className="sup-btn" onClick={() => setShowSupport(true)} style={{
                padding:"13px 32px",
                background:"linear-gradient(135deg,#0077a3,#005b7f)",
                color:"#fff", border:"none", borderRadius:12,
                fontSize:15, fontWeight:700, cursor:"pointer",
                display:"flex", alignItems:"center", gap:10,
                boxShadow:"0 8px 24px rgba(0,119,163,0.4)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Raise Support Ticket
              </button>
            </div>
          </div>

          {/* Right side stats */}
          {!isMobile && (
            <div style={{ display:"flex", flexDirection:"column", gap:16, flexShrink:0 }}>
              {[
                {label:"Avg. Response", val:"< 24 hrs" },
                {label:"Dedicated to", val:"Veterans" },
                {label:"Resolution Rate", val:"98%" },
              ].map(stat => (
                <div key={stat.label} style={{
                  background:"rgba(255,255,255,0.08)", backdropFilter:"blur(8px)",
                  border:"1px solid rgba(255,255,255,0.12)", borderRadius:12,
                  padding:"14px 20px", display:"flex", alignItems:"center", gap:14,
                }}>
                  <span style={{ fontSize:24 }}>{stat.icon}</span>
                  <div>
                    <p style={{ fontSize:18, fontWeight:700, color:"#fff", margin:0 }}>{stat.val}</p>
                    <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", margin:"2px 0 0", textTransform:"uppercase", letterSpacing:"0.06em" }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Support Cards */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":isTablet?"1fr 1fr":"repeat(3,1fr)", gap:16, marginBottom:32 }}>
          {[
            {
              title:"Application Support",
              desc:"Track your application status, understand pipeline stages, or resolve issues with your submission.",
              color:"#0077a3", bg:"#f0f9ff", border:"#bae6fd",
              action: () => setShowSupport(true),
            },
            {
              title:"Technical Help",
              desc:"Facing issues with form submission, document upload, or login? Get instant technical assistance.",
              color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe",
              action: () => setShowSupport(true),
            },
            {
              title:"Recruitment Guidance",
              desc:"Need clarity on eligibility criteria, rank requirements, or the joining process? We'll guide you.",
              color:"#15803d", bg:"#f0fdf4", border:"#bbf7d0",
              action: () => setShowSupport(true),
            },
          ].map(card => (
            <div key={card.title} className="sup-card" style={{
              background:card.bg, border:`1px solid ${card.border}`,
              borderRadius:16, padding:"24px 22px",
              boxShadow:"0 4px 16px rgba(0,0,0,.06)",
              cursor:"pointer",
            }} onClick={card.action}>
              <div style={{ fontSize:32, marginBottom:14 }}>{card.icon}</div>
              <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", margin:"0 0 8px" }}>{card.title}</h3>
              <p style={{ fontSize:13, color:"#64748b", lineHeight:1.7, margin:"0 0 18px" }}>{card.desc}</p>
              <span style={{ fontSize:13, fontWeight:700, color:card.color, display:"flex", alignItems:"center", gap:6 }}>
                Get Help <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:isMobile?"24px":"36px 40px", marginBottom:60, boxShadow:"0 2px 16px rgba(0,0,0,.05)" }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?18:22, fontWeight:700, color:"#0f172a", margin:"0 0 24px" }}>
            Frequently Asked Questions
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {[
              { q:"How do I check my application status?", a:"Log into your profile or raise a support ticket with your application email. Our team will update you within 24 hours." },
              { q:"What documents are required to apply?", a:"A valid service record, discharge certificate, rank certificate, and a recent resume/CV are typically required. Specific roles may need additional documents." },
              { q:"Can I apply for multiple positions?", a:"Yes, you can apply to as many positions as you are eligible for. Each application is evaluated independently." },
              { q:"How long does the hiring process take?", a:"The process typically takes 2–4 weeks from application to offer letter, depending on the role and service arm." },
              { q:"Who can I contact for urgent matters?", a:"Use the 'Raise Support Ticket' button above. For critical matters, mention URGENT in the subject line." },
            ].map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} last={i===4} />
            ))}
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
    </div>
  );
}

// ── FAQ Item with toggle ──────────────────────────────────────────────────────
function FaqItem({ q, a, last }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item" style={{ borderBottom: last ? "none" : "1px solid #f1f5f9" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:"100%", background:"none", border:"none", padding:"18px 0",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        cursor:"pointer", textAlign:"left", gap:16,
      }}>
        <span className="faq-q" style={{ fontSize:15, fontWeight:600, color:"#0f172a", lineHeight:1.5, transition:"color .15s" }}>{q}</span>
        <span style={{ fontSize:18, color:"#94a3b8", flexShrink:0, transition:"transform .2s", transform:open?"rotate(45deg)":"rotate(0deg)", display:"inline-block" }}>+</span>
      </button>
      {open && (
        <p style={{ fontSize:14, color:"#64748b", lineHeight:1.8, margin:"0 0 16px", animation:"fadeUp .2s ease both" }}>{a}</p>
      )}
    </div>
  );
}

const lbl = { fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em" };
const inp = { padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, color:"#1e293b", fontFamily:"inherit", background:"#fff", width:"100%" };
const sel = { padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, color:"#1e293b", fontFamily:"inherit", background:"#fff", cursor:"pointer", width:"100%" };
const ml  = { fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 };
const mi  = { padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, color:"#1e293b", fontFamily:"inherit", background:"#fff", width:"100%" };
const ms  = { padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, color:"#1e293b", fontFamily:"inherit", background:"#fff", cursor:"pointer", width:"100%" };

const LoadingState = () => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"60px 20px" }}>
    <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTop:"3px solid #0077a3", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
    <p style={{ color:"#64748b", marginTop:12, fontSize:14 }}>Loading openings...</p>
  </div>
);

const EmptyState = ({ onReset }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"60px 20px", textAlign:"center" }}>
    <span style={{ fontSize:40 }}>🎖️</span>
    <p style={{ fontWeight:700, color:"#1e293b", marginTop:12, fontSize:18 }}>No openings found</p>
    <p style={{ color:"#94a3b8", fontSize:13, marginTop:4, marginBottom:16 }}>Try adjusting your filters</p>
    <button onClick={onReset} style={{ padding:"8px 20px", background:"#0077a3", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Clear Filters</button>
  </div>
);