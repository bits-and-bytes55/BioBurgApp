import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import frontLogoUrl from "../../assets/IDCARDS/frontlogo.png";
import backLogoUrl  from "../../assets/IDCARDS/backlogo.png";

const API = import.meta.env.VITE_API_BASE_URL;

const agentHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agentToken")}`,
});

const initials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Image loader 
async function loadImg(src) {
  return new Promise(resolve => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload  = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = src;
  });
}

//  Front card canvas renderer 
async function renderCardPreview(card) {
  const W = 320, H = 510, DPR = 2;
  const cv = document.createElement("canvas");
  cv.width = W * DPR; cv.height = H * DPR;
  const ctx = cv.getContext("2d");
  ctx.scale(DPR, DPR);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 12); ctx.fill();

  const hg = ctx.createLinearGradient(0, 0, W, 78);
  hg.addColorStop(0, "#26bfbf"); hg.addColorStop(1, "#1e3a5f");
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, 78);

  const logo = await loadImg(frontLogoUrl);
  if (logo) ctx.drawImage(logo, 6, 4, 68, 68);

  ctx.fillStyle = "#fff"; ctx.font = "bold 13px Arial";
  ctx.textAlign = "left"; ctx.fillText("BIOBURG LIFESCIENCES", 80, 34);
  ctx.font = "8.5px Arial"; ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("PHARMACEUTICALS DISTRIBUTOR", 80, 52);

  // Yellow wave
  ctx.fillStyle = "#f5c012";
  ctx.beginPath();
  ctx.moveTo(0, 78); ctx.bezierCurveTo(W*0.3, 64, W*0.7, 92, W, 78);
  ctx.lineTo(W, 90); ctx.bezierCurveTo(W*0.7, 104, W*0.3, 76, 0, 90);
  ctx.closePath(); ctx.fill();

  // Second teal
  ctx.fillStyle = "#26bfbf";
  ctx.beginPath();
  ctx.moveTo(0, 90); ctx.bezierCurveTo(W*0.3, 104, W*0.7, 76, W, 90);
  ctx.lineTo(W, 136); ctx.lineTo(0, 136); ctx.closePath(); ctx.fill();

  const px = W / 2, py = 210;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(px, py, 50, 58, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#dce8ee"; ctx.fill(); ctx.clip();
  if (card.photo) {
    const img = await loadImg(card.photo);
    if (img) ctx.drawImage(img, px - 50, py - 58, 100, 116);
  }
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(px, py, 52, 60, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 2.5; ctx.stroke();

  ctx.fillStyle = "#1e3a5f"; ctx.font = "bold 15px Arial";
  ctx.textAlign = "center"; ctx.fillText((card.name || "—").toUpperCase(), W / 2, 292);
  ctx.fillStyle = "#cc2200"; ctx.font = "bold 11px Arial";
  ctx.fillText(card.designation || "Marketing Agent", W / 2, 309);

  ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(20, 320); ctx.lineTo(W - 20, 320); ctx.stroke();

  const fields = [
    ["Employee ID", card.employeeId || "—"],
    ["Department",  card.department  || "—"],
    ["Issued On",   fmtDateShort(card.issuedAt)],
    ["Valid Till",  fmtDateShort(card.validTill)],
    ["Phone",       card.phone || "—"],
  ];
  fields.forEach(([label, value], i) => {
    const y = 340 + i * 26;
    ctx.fillStyle = "#9ca3af"; ctx.font = "9.5px Arial"; ctx.textAlign = "left";
    ctx.fillText(label, 22, y);
    ctx.fillStyle = "#111827"; ctx.font = "bold 10.5px Arial"; ctx.textAlign = "right";
    ctx.fillText(value, W - 22, y);
  });

  const fg = ctx.createLinearGradient(0, H - 46, W, H);
  fg.addColorStop(0, "#1e3a5f"); fg.addColorStop(1, "#26bfbf");
  ctx.fillStyle = fg; ctx.fillRect(0, H - 46, W, 46);
  ctx.fillStyle = "#fff"; ctx.font = "7px Arial"; ctx.textAlign = "center";
  ctx.fillText("Display this card at all times on Bioburg premises", W / 2, H - 18);

  return cv.toDataURL("image/png");
}

//  Back card canvas renderer 
async function renderBackPreview(card) {
  const W = 320, H = 510, DPR = 2;
  const cv = document.createElement("canvas");
  cv.width = W * DPR; cv.height = H * DPR;
  const ctx = cv.getContext("2d");
  ctx.scale(DPR, DPR);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 12); ctx.fill();

  const hg = ctx.createLinearGradient(0, 0, W, 78);
  hg.addColorStop(0, "#26bfbf"); hg.addColorStop(1, "#1e3a5f");
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, 78);

  const logo = await loadImg(frontLogoUrl);   // ← needs import
  if (logo) ctx.drawImage(logo, 6, 4, 68, 68);

  ctx.fillStyle = "#fff"; ctx.font = "bold 12px Arial";
  ctx.textAlign = "left"; ctx.fillText("BIOBURG LIFESCIENCES", 80, 34);
  ctx.font = "7.5px Arial"; ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("PHARMACEUTICALS DISTRIBUTOR", 80, 52);

  ctx.fillStyle = "#f5c012";
  ctx.beginPath();
  ctx.moveTo(0, 78); ctx.bezierCurveTo(W*0.3, 64, W*0.7, 92, W, 78);
  ctx.lineTo(W, 90); ctx.bezierCurveTo(W*0.7, 104, W*0.3, 76, 0, 90);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = "#26bfbf";
  ctx.beginPath();
  ctx.moveTo(0, 90); ctx.bezierCurveTo(W*0.3, 104, W*0.7, 76, W, 90);
  ctx.lineTo(W, 138); ctx.lineTo(0, 138); ctx.closePath(); ctx.fill();

  const backLogo = await loadImg(backLogoUrl); // ← needs import
  if (backLogo) ctx.drawImage(backLogo, 10, 148, 120, 120);

  ctx.fillStyle = "#26bfbf"; ctx.font = "bold 7px Arial";
  ctx.textAlign = "center"; ctx.fillText("BIOBURG LIFESCIENCES", 70, 278);

  ctx.fillStyle = "#111111"; ctx.font = "bold 10px Arial";
  ctx.textAlign = "left"; ctx.fillText("Motto Of Bioburg", 142, 168);

  const mottos = [
    "Nothing Beyond Our Products",
    "Bio Burg Helping Peoples",
    "Our Challenge Is Life Sciences",
    "Biosciences, Research & Development",
  ];
  ctx.fillStyle = "#333333"; ctx.font = "8.5px Arial";
  mottos.forEach((m, i) => ctx.fillText("• " + m, 142, 184 + i * 15));

  ctx.strokeStyle = "#cccccc"; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(12, 252); ctx.lineTo(W - 12, 252); ctx.stroke();

  ctx.fillStyle = "#cc0000"; ctx.font = "bold 9px Arial";
  ctx.textAlign = "left"; ctx.fillText("Terms And Conditions:-", 12, 268);

  ctx.fillStyle = "#333333"; ctx.font = "8px Arial";
  const terms = "This Card is not transferable. It is the property of the \"Bioburg Lifesciences\" and is to be returned to the issuing authority on cessation of the service.";
  const words = terms.split(" "); let line = "", ty = 282;
  words.forEach(w => {
    const t = line + w + " ";
    if (ctx.measureText(t).width > W - 24 && line) {
      ctx.fillText(line.trim(), 12, ty); line = w + " "; ty += 13;
    } else line = t;
  });
  if (line.trim()) ctx.fillText(line.trim(), 12, ty);

  ctx.fillStyle = "#111111"; ctx.font = "bold 8.5px Arial";
  ctx.textAlign = "center"; ctx.fillText("If Found Please Return it to", W/2, 328);
  ctx.strokeStyle = "#111"; ctx.lineWidth = 0.6;
  const tw = ctx.measureText("If Found Please Return it to").width;
  ctx.beginPath(); ctx.moveTo(W/2 - tw/2, 330); ctx.lineTo(W/2 + tw/2, 330); ctx.stroke();

  const contacts = [
    ["Address", "B-119, 2nd Floor, Lane No-7, Laxmi Vihar,"],
    ["",        "Mohan Garden, Dwarka Mor, New Delhi-110059."],
    ["E-Mail",  "bioburg.lifesciences@yahoo.com"],
    ["Phone",   "9990719273, 9868013337, 6005459761"],
    ["Website", "https://www.bioburglifesciences.com"],
  ];
  ctx.textAlign = "left";
  contacts.forEach(([label, value], i) => {
    const y = 344 + i * 14;
    if (label) {
      ctx.fillStyle = "#111"; ctx.font = "bold 7.5px Arial";
      ctx.fillText(label + ":", 12, y);
      ctx.fillStyle = "#333"; ctx.font = "7.5px Arial";
      ctx.fillText(value, 12 + ctx.measureText(label + ": ").width + 4, y);
    } else {
      ctx.fillStyle = "#333"; ctx.font = "7.5px Arial";
      ctx.fillText(value, 12, y);
    }
  });

  const fg = ctx.createLinearGradient(0, H - 46, W, H);
  fg.addColorStop(0, "#1e3a5f"); fg.addColorStop(1, "#26bfbf");
  ctx.fillStyle = fg; ctx.fillRect(0, H - 46, W, 46);
  ctx.fillStyle = "#fff"; ctx.font = "6.5px Arial"; ctx.textAlign = "center";
  ctx.fillText("Display the Security Pass at all times while outside BIOBURG Premises", W/2, H - 16);

  return cv.toDataURL("image/png");
}

//  ID Card Modal (ONE declaration only) 
function IDCardModal({ frontImg, backImg, card, onClose }) {
  const [side, setSide] = useState("front");
  const img = side === "front" ? frontImg : backImg;

  const download = () => {
    if (!img) return;
    const a = document.createElement("a");
    a.href = img;
    a.download = `ID_${card?.employeeId || "card"}_${side}.png`;
    a.click();
    toast.success(`${side === "front" ? "Front" : "Back"} downloaded!`);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#0f172a", borderRadius:20, padding:24, maxWidth:370, width:"100%", boxShadow:"0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#fff" }}>Your ID Card</h3>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:18, color:"#fff" }}>×</button>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          {["front","back"].map(s => (
            <button key={s} onClick={() => setSide(s)} style={{
              flex:1, padding:"7px 0", border:"1.5px solid #c9a84c", borderRadius:8,
              background: side===s ? "#c9a84c" : "transparent",
              color: side===s ? "#1a1a1a" : "#c9a84c",
              fontWeight:700, cursor:"pointer", fontSize:12, fontFamily:"inherit",
            }}>
              {s === "front" ? "Front Side" : "Back Side"}
            </button>
          ))}
        </div>
        {img
          ? <img src={img} alt="ID Card" style={{ width:"100%", borderRadius:12, border:"2px solid #c9a84c", display:"block" }} />
          : <div style={{ height:160, display:"flex", alignItems:"center", justifyContent:"center", color:"#9ca3af" }}>Generating…</div>}
        <div style={{ display:"flex", gap:8, marginTop:14 }}>
          <button onClick={download} disabled={!img}
            style={{ flex:1, padding:"11px 0", background:"linear-gradient(135deg,#c9a84c,#b8860b)", color:"#1a1a1a", border:"none", borderRadius:10, fontWeight:800, cursor:"pointer", fontSize:13 }}>
            ⬇ Download {side === "front" ? "Front" : "Back"}
          </button>
          <button onClick={() => {
            [frontImg, backImg].forEach((im, i) => {
              if (!im) return;
              setTimeout(() => {
                const a = document.createElement("a");
                a.href = im; a.download = `ID_${card?.employeeId || "card"}_${i===0?"front":"back"}.png`; a.click();
              }, i * 400);
            });
            toast.success("Both sides downloading!");
          }} style={{ flex:1, padding:"11px 0", background:"rgba(255,255,255,0.1)", color:"#fff", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:13 }}>
            ⬇ Both Sides
          </button>
        </div>
      </div>
    </div>
  );
}

//  Leave Modal 
function LeaveModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ leaveType:"casual", fromDate:"", toDate:"", reason:"" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.fromDate || !form.toDate) { toast.error("Please select both dates"); return; }
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:440, padding:24, boxShadow:"0 24px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#1e3a5f" }}>🏖️ Apply for Leave</h3>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:18 }}>×</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Leave Type</label>
            <select value={form.leaveType} onChange={e => setForm(p => ({...p, leaveType: e.target.value}))}
              style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, outline:"none", fontFamily:"inherit", background:"#fff" }}>
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="earned">Earned Leave</option>
              <option value="emergency">Emergency Leave</option>
            </select>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["From Date","fromDate"],["To Date","toDate"]].map(([label, key]) => (
              <div key={key}>
                <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>{label}</label>
                <input type="date" value={form[key]} onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
              </div>
            ))}
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Reason</label>
            <textarea value={form.reason} onChange={e => setForm(p => ({...p, reason: e.target.value}))}
              placeholder="Briefly describe reason for leave..."
              style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, outline:"none", fontFamily:"inherit", minHeight:80, resize:"vertical", boxSizing:"border-box" }} />
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:18 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px 0", background:"#f3f4f6", border:"none", borderRadius:10, fontWeight:600, cursor:"pointer", fontSize:13 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ flex:2, padding:"10px 0", background:"#1e3a5f", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:13, opacity:submitting?0.7:1 }}>
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

//  Main Component 
export default function AgentProfile() {
  const [agent, setAgent]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({});
  const [pointsSummary, setPointsSummary] = useState(null);

  const [idCard, setIdCard]               = useState(null);
  const [idCardFront, setIdCardFront]     = useState("");
  const [idCardBack,  setIdCardBack]      = useState("");
  const [idCardLoading, setIdCardLoading] = useState(true);
  const [showIDModal, setShowIDModal]     = useState(false);

  const [leaves, setLeaves]                 = useState([]);
  const [leavesLoading, setLeavesLoading]   = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [slips, setSlips]               = useState([]);
  const [slipsLoading, setSlipsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchPoints();
    fetchIDCard();
    fetchLeaves();
    fetchSlips();
  }, []);

  const fetchProfile = async () => {
    try {
      const res  = await axios.get(`${API}/api/marketing-agent/profile`, { headers: agentHeaders() });
      const data = res.data.data || res.data.agent || res.data;
      setAgent(data);
      setForm({
        name: data.name || "", phone: data.phone || "",
        email: data.email || "", city: data.city || "",
        state: data.state || "", address: data.address || "",
        emergencyContact: data.emergencyContact || "", bio: data.bio || "",
      });
    } catch { toast.error("Failed to load profile"); }
    finally { setLoading(false); }
  };

  const fetchPoints = async () => {
    try {
      const res = await axios.get(`${API}/api/points/agent/summary`, { headers: agentHeaders() });
      setPointsSummary(res.data.data);
    } catch {}
  };

  const fetchIDCard = async () => {
    setIdCardLoading(true);
    try {
      const res  = await axios.get(`${API}/api/marketing-agent/my-id-card`, { headers: agentHeaders() });
      const card = res.data.card || res.data.data || res.data;
      if (card?.employeeId) {
        setIdCard(card);
        const front = card.cardImage     || await renderCardPreview(card).catch(() => "");
        const back  = card.cardImageBack || await renderBackPreview(card).catch(() => "");
        setIdCardFront(front);
        setIdCardBack(back);
      }
    } catch {}
    setIdCardLoading(false);
  };

  const fetchLeaves = async () => {
    setLeavesLoading(true);
    try {
      const res = await axios.get(`${API}/api/marketing-agent/leaves`, { headers: agentHeaders() });
      setLeaves(res.data.leaves || res.data.data || []);
    } catch { setLeaves([]); }
    setLeavesLoading(false);
  };

  const fetchSlips = async () => {
    setSlipsLoading(true);
    try {
      const res = await axios.get(`${API}/api/marketing-agent/salary-slips`, { headers: agentHeaders() });
      setSlips(res.data.slips || res.data.data || []);
    } catch { setSlips([]); }
    setSlipsLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/api/marketing-agent/profile`, form, { headers: agentHeaders() });
      toast.success("Profile updated!");
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally { setSaving(false); }
  };

  const handleLeaveSubmit = async (leaveForm) => {
    try {
      await axios.post(`${API}/api/marketing-agent/leaves`, leaveForm, { headers: agentHeaders() });
      toast.success("Leave request submitted!");
      setShowLeaveModal(false);
      fetchLeaves();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit leave");
    }
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", flexDirection:"column", gap:12 }}>
      <div style={{ width:40, height:40, border:"4px solid #e0e7ff", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color:"#6366f1", fontWeight:600 }}>Loading profile...</p>
    </div>
  );
  if (!agent) return <div style={{ padding:24, textAlign:"center", color:"#9ca3af" }}>Could not load profile.</div>;

  const stats = [
    { label:"Points Balance", value: pointsSummary?.balance ?? "—",       color:"#6366f1" },
    { label:"Total Earned",   value: pointsSummary?.totalEarned ?? "—",    color:"#10b981" },
    { label:"Cash Value",     value: pointsSummary ? `₹${(pointsSummary.amountEquivalent||0).toFixed(0)}` : "—", color:"#f59e0b" },
    { label:"Redeemed",       value: pointsSummary?.totalRedeemed ?? "—",  color:"#ef4444" },
  ];

  const lss = (s) => ({
    approved:{ bg:"#f0fdf4", color:"#15803d" },
    rejected: { bg:"#fef2f2", color:"#dc2626" },
    pending:  { bg:"#fefce8", color:"#b45309" },
  })[s] || { bg:"#f9fafb", color:"#374151" };

  return (
    <>
      <style>{`
        .ap * { box-sizing: border-box; }
        .ap { font-family:'Segoe UI',sans-serif; color:#111827; max-width:960px; margin:0 auto; padding:16px; }
        @media(min-width:640px){ .ap { padding:24px; } }
        .ap-cover { height:160px; border-radius:16px 16px 0 0; background:linear-gradient(135deg,#6366f1,#8b5cf6 50%,#06b6d4); }
        @media(min-width:480px){ .ap-cover { height:200px; } }
        .ap-header { background:#fff; border-radius:0 0 16px 16px; padding:0 20px 20px; box-shadow:0 4px 20px rgba(0,0,0,0.08); margin-bottom:20px; }
        .ap-avatar-row { display:flex; flex-direction:column; align-items:flex-start; gap:12px; padding-top:12px; }
        @media(min-width:480px){ .ap-avatar-row { flex-direction:row; align-items:flex-end; justify-content:space-between; } }
        .ap-avatar { width:80px; height:80px; border-radius:50%; border:4px solid #fff; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:800; color:#fff; background:linear-gradient(135deg,#6366f1,#8b5cf6); margin-top:-48px; box-shadow:0 4px 12px rgba(99,102,241,0.4); flex-shrink:0; }
        @media(min-width:480px){ .ap-avatar { width:100px; height:100px; margin-top:-60px; font-size:32px; } }
        .ap-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:20px; }
        @media(min-width:600px){ .ap-stats { grid-template-columns:repeat(4,1fr); } }
        .ap-main { display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:660px){ .ap-main { grid-template-columns:300px 1fr; } }
        .ap-card { background:#fff; border-radius:14px; box-shadow:0 2px 12px rgba(0,0,0,0.06); border:1px solid #f0f0f0; padding:20px; animation:fadeUp .3s ease both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ap-info-row { display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-bottom:1px solid #f3f4f6; }
        .ap-info-row:last-child { border-bottom:none; }
        .ap-info-label { font-size:11px; color:#9ca3af; font-weight:600; margin:0 0 2px; text-transform:uppercase; letter-spacing:.04em; }
        .ap-info-val { font-size:13px; color:#111827; font-weight:600; margin:0; word-break:break-all; }
        .ap-badge { display:inline-flex; padding:3px 12px; border-radius:20px; font-size:11px; font-weight:700; }
        .ap-label { font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; display:block; }
        .ap-input { padding:9px 12px; border-radius:8px; border:1.5px solid #e5e7eb; font-size:13px; outline:none; font-family:inherit; width:100%; transition:border-color .15s; }
        .ap-input:focus { border-color:#6366f1; }
        .ap-btn-edit   { padding:9px 18px; background:#6366f1; color:#fff; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:13px; font-family:inherit; }
        .ap-btn-save   { padding:9px 18px; background:#10b981; color:#fff; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:13px; font-family:inherit; }
        .ap-btn-cancel { padding:9px 18px; background:#f3f4f6; color:#374151; border:none; border-radius:10px; font-weight:600; cursor:pointer; font-size:13px; font-family:inherit; }
        .ap-sh { font-size:14px; font-weight:700; margin:0 0 14px; color:#374151; display:flex; align-items:center; gap:7px; }
        .ap-idbox { border-radius:12px; background:linear-gradient(135deg,#0f172a,#1e3a5f); padding:18px; text-align:center; }
        .ap-idthumb { width:100%; max-width:210px; border-radius:10px; border:2px solid #c9a84c; cursor:pointer; transition:transform .2s,box-shadow .2s; }
        .ap-idthumb:hover { transform:scale(1.03); box-shadow:0 12px 30px rgba(0,0,0,0.45); }
        .ap-idbtn { display:inline-flex; align-items:center; gap:6px; margin-top:11px; padding:9px 20px; background:linear-gradient(135deg,#c9a84c,#b8860b); color:#1a1a1a; border:none; border-radius:10px; font-weight:800; cursor:pointer; font-size:13px; font-family:inherit; }
        .ap-noid { padding:22px; text-align:center; color:#64748b; background:#f8fafc; border-radius:12px; border:2px dashed #e2e8f0; }
        .ap-ltbl { width:100%; border-collapse:collapse; font-size:12px; }
        .ap-ltbl th { background:#f9fafb; padding:8px 10px; text-align:left; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #f0f0f0; }
        .ap-ltbl td { padding:8px 10px; border-bottom:1px solid #f9fafb; color:#374151; }
        .ap-ltbl tr:last-child td { border-bottom:none; }
        .ap-slip { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#f9fafb; border-radius:10px; border:1px solid #f0f0f0; }
        .ap-slip-dl { padding:6px 14px; background:#1e3a5f; color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; }
        .ap-slip-dl:hover { background:#162d4a; }
        .ap-act-row { display:flex; gap:12px; padding:10px 0; border-bottom:1px solid #f3f4f6; align-items:flex-start; }
        .ap-act-row:last-child { border-bottom:none; }
        .ap-empty { text-align:center; padding:22px 0; color:#9ca3af; }
        .ap-spin { width:24px; height:24px; border:3px solid #e5e7eb; border-top-color:#6366f1; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto 8px; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <div className="ap">
        {showIDModal && idCard && (
          <IDCardModal
            frontImg={idCardFront}
            backImg={idCardBack}
            card={idCard}
            onClose={() => setShowIDModal(false)}
          />
        )}
        {showLeaveModal && (
          <LeaveModal onClose={() => setShowLeaveModal(false)} onSubmit={handleLeaveSubmit} />
        )}

        <div className="ap-cover" />

        <div className="ap-header">
          <div className="ap-avatar-row">
            <div className="ap-avatar">{initials(agent.name)}</div>
            <div style={{ flex:1 }}>
              <h2 style={{ margin:"0 0 2px", fontSize:20, fontWeight:800 }}>{agent.name}</h2>
              <p style={{ margin:0, fontSize:13, color:"#6b7280" }}>
                Marketing Agent{agent.assignedArea && ` · ${agent.assignedArea}`}
              </p>
              <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                <span className="ap-badge" style={{ background:agent.isApproved?"#f0fdf4":"#fef9c3", color:agent.isApproved?"#15803d":"#854d0e" }}>
                  {agent.isApproved ? "✓ Approved" : "⏳ Pending"}
                </span>
                {agent.isOnJob && <span className="ap-badge" style={{ background:"#eff6ff", color:"#1d4ed8" }}>On Job</span>}
                {agent.assignedArea && <span className="ap-badge" style={{ background:"#f5f3ff", color:"#7c3aed" }}>{agent.assignedArea}</span>}
                {idCard && <span className="ap-badge" style={{ background:"#fefce8", color:"#92400e" }}>{idCard.employeeId}</span>}
              </div>
            </div>
            <div>
              {!editMode
                ? <button className="ap-btn-edit" onClick={() => setEditMode(true)}>Edit Profile</button>
                : <div style={{ display:"flex", gap:8 }}>
                    <button className="ap-btn-save" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</button>
                    <button className="ap-btn-cancel" onClick={() => setEditMode(false)}>Cancel</button>
                  </div>}
            </div>
          </div>
        </div>

        <div className="ap-stats">
          {stats.map(s => (
            <div key={s.label} style={{ background:"#fff", border:"1px solid #e5e7eb", borderTop:`3px solid ${s.color}`, borderRadius:12, padding:"12px 14px", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize:11, margin:"0 0 4px", color:"#6b7280", fontWeight:600 }}>{s.label}</p>
              <p style={{ fontSize:20, fontWeight:800, color:s.color, margin:0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="ap-main">

          {/* LEFT */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Contact */}
            <div className="ap-card">
              <h3 className="ap-sh">👤 Contact Information</h3>
              {!editMode ? (
                [
                  { label:"Email",     val: agent.email },
                  { label:"Phone",     val: agent.phone || "Not set" },
                  { label:"City",      val: agent.city  || "Not set" },
                  { label:"State",     val: agent.state || "Not set" },
                  { label:"Address",   val: agent.address || "Not set" },
                  { label:"Emergency", val: agent.emergencyContact || "Not set" },
                ].map(r => (
                  <div key={r.label} className="ap-info-row">
                    <div><p className="ap-info-label">{r.label}</p><p className="ap-info-val">{r.val}</p></div>
                  </div>
                ))
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    { label:"Phone",             key:"phone" },
                    { label:"City",              key:"city" },
                    { label:"State",             key:"state" },
                    { label:"Address",           key:"address" },
                    { label:"Emergency Contact", key:"emergencyContact" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="ap-label">{f.label}</label>
                      <input type="text" value={form[f.key]}
                        onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                        className="ap-input" />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f3f4f6" }}>
                <h3 style={{ fontSize:13, fontWeight:700, margin:"0 0 10px", color:"#374151" }}>Account Info</h3>
                {[
                  { label:"Agent ID",    val: agent._id?.toString().slice(-8).toUpperCase() },
                  { label:"Registered",  val: fmtDate(agent.createdAt) },
                  { label:"GPS Blocked", val: agent.isGpsBlocked ? "Yes" : "No" },
                  { label:"GPS Strikes", val: agent.gpsViolationCount ?? 0 },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f9fafb", fontSize:12 }}>
                    <span style={{ color:"#9ca3af", fontWeight:600 }}>{r.label}</span>
                    <span style={{ color:"#374151", fontWeight:700 }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ID Card */}
            <div className="ap-card">
              <h3 className="ap-sh">Employee ID Card</h3>
              {idCardLoading ? (
                <div className="ap-empty"><div className="ap-spin" />Loading…</div>
              ) : idCard ? (
                <div className="ap-idbox">
                  {/* ── fixed JSX: wrap all children in a fragment ── */}
                  <>
                    {idCardFront && (
                      <img src={idCardFront} alt="ID Card" className="ap-idthumb" onClick={() => setShowIDModal(true)} />
                    )}
                    <p style={{ color:"rgba(255,255,255,0.55)", fontSize:11, margin:"8px 0 0" }}>
                      Tap to enlarge · <strong style={{ color:"#c9a84c" }}>{idCard.employeeId}</strong>
                    </p>
                    <button className="ap-idbtn" onClick={() => setShowIDModal(true)}>View & Download</button>
                    <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, textAlign:"left" }}>
                      {[
                        { label:"Issued On",   val: fmtDateShort(idCard.issuedAt) },
                        { label:"Valid Till",  val: fmtDateShort(idCard.validTill) },
                        { label:"Department",  val: idCard.department  || "—" },
                        { label:"Designation", val: idCard.designation || "—" },
                      ].map(r => (
                        <div key={r.label} style={{ background:"rgba(255,255,255,0.08)", borderRadius:8, padding:"8px 10px" }}>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:".04em" }}>{r.label}</p>
                          <p style={{ fontSize:12, color:"#fff", fontWeight:700, margin:0 }}>{r.val}</p>
                        </div>
                      ))}
                    </div>
                  </>
                </div>
              ) : (
                <div className="ap-noid">
                  <div style={{ fontSize:36, marginBottom:8 }}></div>
                  <p style={{ margin:"0 0 4px", fontWeight:700, color:"#374151" }}>No ID Card Issued Yet</p>
                  <p style={{ margin:0, fontSize:12 }}>Your card will appear here once issued by admin.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Bio */}
            <div className="ap-card">
              <h3 className="ap-sh">About</h3>
              {!editMode ? (
                <p style={{ fontSize:13, color:agent.bio?"#374151":"#9ca3af", lineHeight:1.6, margin:0 }}>
                  {agent.bio || "No bio added yet. Click 'Edit Profile' to add one."}
                </p>
              ) : (
                <>
                  <label className="ap-label">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))}
                    className="ap-input" style={{ minHeight:80, resize:"vertical" }}
                    placeholder="Write a short description about yourself…" />
                </>
              )}
            </div>

            {/* Leave Requests */}
            <div className="ap-card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <h3 className="ap-sh" style={{ margin:0 }}>Leave Requests</h3>
                <button onClick={() => setShowLeaveModal(true)}
                  style={{ padding:"7px 14px", background:"#1e3a5f", color:"#fff", border:"none", borderRadius:9, fontWeight:700, cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
                  + Apply Leave
                </button>
              </div>
              {leavesLoading ? (
                <div className="ap-empty"><div className="ap-spin" />Loading…</div>
              ) : leaves.length === 0 ? (
                <div className="ap-empty"><div style={{ fontSize:28, marginBottom:6 }}>🌴</div><p style={{ margin:0, fontSize:13 }}>No leave requests yet.</p></div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table className="ap-ltbl">
                    <thead>
                      <tr>{["Type","From","To","Days","Status"].map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {leaves.slice(0, 10).map((l, i) => {
                        const days = l.fromDate && l.toDate
                          ? Math.max(1, Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / 86400000) + 1) : "—";
                        const ss = lss(l.status);
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight:600, textTransform:"capitalize" }}>{l.leaveType || "Leave"}</td>
                            <td>{fmtDateShort(l.fromDate)}</td>
                            <td>{fmtDateShort(l.toDate)}</td>
                            <td style={{ textAlign:"center", fontWeight:700 }}>{days}</td>
                            <td>
                              <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:ss.bg, color:ss.color }}>
                                {l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1) : "Pending"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Salary Slips */}
            <div className="ap-card">
              <h3 className="ap-sh">Salary Slips</h3>
              {slipsLoading ? (
                <div className="ap-empty"><div className="ap-spin" />Loading…</div>
              ) : slips.length === 0 ? (
                <div className="ap-empty">
                  <div style={{ fontSize:28, marginBottom:6 }}></div>
                  <p style={{ margin:"0 0 4px", fontWeight:700, color:"#374151" }}>No Salary Slips Yet</p>
                  <p style={{ margin:0, fontSize:12 }}>Slips will appear here once generated by admin.</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {slips.map((slip, i) => (
                    <div key={i} className="ap-slip">
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:40, height:40, background:"#eff6ff", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📄</div>
                        <div>
                          <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#1e3a5f" }}>
                            {slip.month || `Slip ${i+1}`} {slip.year || ""}
                          </p>
                          <p style={{ margin:0, fontSize:11, color:"#6b7280" }}>
                            Net: <strong style={{ color:"#10b981" }}>₹{(slip.netPay || 0).toLocaleString("en-IN")}</strong>
                            {slip.generatedAt && <span> · {fmtDateShort(slip.generatedAt)}</span>}
                          </p>
                        </div>
                      </div>
                      <button className="ap-slip-dl"
                        onClick={() => slip.fileUrl ? window.open(slip.fileUrl,"_blank") : toast.error("File not available")}>
                        ⬇ Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Points Activity */}
            <div className="ap-card">
              <h3 className="ap-sh">Recent Points Activity</h3>
              {!pointsSummary?.history?.length ? (
                <div className="ap-empty"><div style={{ fontSize:28, marginBottom:6 }}></div><p style={{ margin:0, fontSize:13 }}>No points activity yet.</p></div>
              ) : pointsSummary.history.slice(0, 8).map((h, i) => (
                <div key={i} className="ap-act-row">
                  <div style={{ width:36, height:36, borderRadius:10, background:h.points>0?"#f0fdf4":"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                    {h.points > 0 ? "⬆️" : "⬇️"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#374151", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {h.taskLabel || h.taskKey}
                    </p>
                    {h.note && <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af" }}>{h.note}</p>}
                    <p style={{ margin:"2px 0 0", fontSize:11, color:"#d1d5db" }}>
                      {new Date(h.createdAt).toLocaleDateString("en-IN",{ day:"numeric", month:"short", year:"numeric" })}
                    </p>
                  </div>
                  <span style={{ fontSize:14, fontWeight:800, color:h.points>0?"#10b981":"#ef4444", flexShrink:0 }}>
                    {h.points>0?"+":""}{h.points} pts
                  </span>
                </div>
              ))}
            </div>

            {/* Job Requirements */}
            <div className="ap-card">
              <h3 className="ap-sh">Job Requirements</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { label:"Location Required",   val:agent.jobStartRequirements?.requireLocation?"Yes":"No",  ok:agent.jobStartRequirements?.requireLocation },
                  { label:"Start Photo Required", val:agent.jobStartRequirements?.requireImage?"Yes":"No",    ok:agent.jobStartRequirements?.requireImage },
                  { label:"Geofence",             val:agent.geofence?.enabled?`${agent.geofence.radiusKm||50}km`:"Disabled", ok:false },
                  { label:"GPS Blocked",          val:agent.isGpsBlocked?"Blocked":"Clear", ok:!agent.isGpsBlocked },
                ].map(r => (
                  <div key={r.label} style={{ background:"#f9fafb", borderRadius:10, padding:"10px 12px", border:"1px solid #f0f0f0" }}>
                    <p style={{ fontSize:10, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:".04em", margin:"0 0 4px" }}>{r.label}</p>
                    <p style={{ fontSize:13, fontWeight:700, margin:0, color:r.ok===true?"#15803d":r.ok===false&&r.val!=="Clear"?"#dc2626":"#374151" }}>{r.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}