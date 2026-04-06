import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

//  Multi-Theme System 
const THEME_PRESETS = {
  dark: {
    name:"Dark Navy", bg:"#060d18", surface:"#0d1b2a", surface2:"#132033", border:"#1a2d42", border2:"#243d57",
    text:"#e2f0ff", text2:"#a8c8e8", muted:"#4a7090",
    accent:"#34d399", accentBg:"rgba(52,211,153,0.12)", accentHov:"#10b981",
    danger:"#fb7185", dangerBg:"rgba(251,113,133,0.12)",
    success:"#34d399", successBg:"rgba(52,211,153,0.12)",
    warn:"#fbbf24", warnBg:"rgba(251,191,36,0.12)",
    purple:"#a78bfa", purpleBg:"rgba(167,139,250,0.12)",
    blue:"#38bdf8", blueBg:"rgba(56,189,248,0.12)",
    sidebar:"#050d18", sidebarText:"#3a5f7a", sidebarActive:"#34d399", sidebarActiveBg:"rgba(52,211,153,0.1)",
  },
  light: {
    name:"Clean White", bg:"#f0f4f8", surface:"#ffffff", surface2:"#f8fafc", border:"#e2e8f0", border2:"#cbd5e1",
    text:"#0f172a", text2:"#334155", muted:"#64748b",
    accent:"#059669", accentBg:"#d1fae5", accentHov:"#047857",
    danger:"#be123c", dangerBg:"#fff1f2",
    success:"#065f46", successBg:"#ecfdf5",
    warn:"#92400e", warnBg:"#fffbeb",
    purple:"#5b21b6", purpleBg:"#f5f3ff",
    blue:"#0369a1", blueBg:"#e0f2fe",
    sidebar:"#0f172a", sidebarText:"#94a3b8", sidebarActive:"#34d399", sidebarActiveBg:"rgba(52,211,153,0.12)",
  },
  ocean: {
    name:"Ocean Blue", bg:"#0a1628", surface:"#0f2040", surface2:"#152a52", border:"#1e3a6a", border2:"#2a4f8a",
    text:"#e8f4ff", text2:"#93c5fd", muted:"#4a7090",
    accent:"#38bdf8", accentBg:"rgba(56,189,248,0.15)", accentHov:"#0ea5e9",
    danger:"#f87171", dangerBg:"rgba(248,113,113,0.12)",
    success:"#4ade80", successBg:"rgba(74,222,128,0.12)",
    warn:"#fbbf24", warnBg:"rgba(251,191,36,0.12)",
    purple:"#c084fc", purpleBg:"rgba(192,132,252,0.12)",
    blue:"#60a5fa", blueBg:"rgba(96,165,250,0.12)",
    sidebar:"#060f1e", sidebarText:"#3a6080", sidebarActive:"#38bdf8", sidebarActiveBg:"rgba(56,189,248,0.1)",
  },
  rose: {
    name:"Rose Gold", bg:"#fff5f7", surface:"#ffffff", surface2:"#fff0f3", border:"#ffd6e0", border2:"#fbb6c8",
    text:"#1a0a0f", text2:"#5a2a35", muted:"#b07080",
    accent:"#e11d48", accentBg:"#ffe4ec", accentHov:"#be123c",
    danger:"#9b2335", dangerBg:"#ffe4e6",
    success:"#166534", successBg:"#dcfce7",
    warn:"#854d0e", warnBg:"#fef9c3",
    purple:"#7c3aed", purpleBg:"#f3e8ff",
    blue:"#1d4ed8", blueBg:"#dbeafe",
    sidebar:"#1a0a0f", sidebarText:"#8a4050", sidebarActive:"#e11d48", sidebarActiveBg:"rgba(225,29,72,0.1)",
  },
  forest: {
    name:"Forest Green", bg:"#0d1f0f", surface:"#132216", surface2:"#182b1a", border:"#1e3820", border2:"#2a4f2e",
    text:"#e8f5ea", text2:"#86c98e", muted:"#4a7050",
    accent:"#4ade80", accentBg:"rgba(74,222,128,0.12)", accentHov:"#22c55e",
    danger:"#f87171", dangerBg:"rgba(248,113,113,0.12)",
    success:"#4ade80", successBg:"rgba(74,222,128,0.12)",
    warn:"#fbbf24", warnBg:"rgba(251,191,36,0.12)",
    purple:"#c084fc", purpleBg:"rgba(192,132,252,0.12)",
    blue:"#60a5fa", blueBg:"rgba(96,165,250,0.12)",
    sidebar:"#080f09", sidebarText:"#2a5030", sidebarActive:"#4ade80", sidebarActiveBg:"rgba(74,222,128,0.1)",
  },
  purple: {
    name:"Midnight Purple", bg:"#0e0a1e", surface:"#160f2e", surface2:"#1c143a", border:"#2a1f4e", border2:"#3a2f6a",
    text:"#f0eaff", text2:"#c4b5fd", muted:"#6b5a9a",
    accent:"#a78bfa", accentBg:"rgba(167,139,250,0.15)", accentHov:"#8b5cf6",
    danger:"#fb7185", dangerBg:"rgba(251,113,133,0.12)",
    success:"#4ade80", successBg:"rgba(74,222,128,0.12)",
    warn:"#fbbf24", warnBg:"rgba(251,191,36,0.12)",
    purple:"#c084fc", purpleBg:"rgba(192,132,252,0.12)",
    blue:"#60a5fa", blueBg:"rgba(96,165,250,0.12)",
    sidebar:"#080514", sidebarText:"#3a2f6a", sidebarActive:"#a78bfa", sidebarActiveBg:"rgba(167,139,250,0.1)",
  },
  amber: {
    name:"Amber Warm", bg:"#1a0f00", surface:"#271800", surface2:"#321f00", border:"#4a2e00", border2:"#6b4200",
    text:"#fff8e8", text2:"#fcd34d", muted:"#92742a",
    accent:"#f59e0b", accentBg:"rgba(245,158,11,0.15)", accentHov:"#d97706",
    danger:"#ef4444", dangerBg:"rgba(239,68,68,0.12)",
    success:"#22c55e", successBg:"rgba(34,197,94,0.12)",
    warn:"#f97316", warnBg:"rgba(249,115,22,0.12)",
    purple:"#a78bfa", purpleBg:"rgba(167,139,250,0.12)",
    blue:"#38bdf8", blueBg:"rgba(56,189,248,0.12)",
    sidebar:"#100800", sidebarText:"#5a3a10", sidebarActive:"#f59e0b", sidebarActiveBg:"rgba(245,158,11,0.1)",
  },
};

// ── Helpers 
const lsGet = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch{ return fb; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch{ /* storage unavailable */ } };
const today = () => new Date().toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";
const fmtAmt = a => `₹${(+a||0).toLocaleString("en-IN")}`;
const genId = (prefix, list) => { const nums = list.map(i => parseInt((i.id||"0").replace(/\D/g,""))||0); return `${prefix}-${String(Math.max(0,...nums)+1).padStart(4,"0")}`; };
const daysLeft = d => { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); };

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return w;
}

function getToken() {
  const keys = ["pharmacyToken","pharmacy_token","token","authToken","jwtToken","accessToken"];
  for (const k of keys) { const v = localStorage.getItem(k); if (v?.startsWith("eyJ")) return v; }
  try { const u = JSON.parse(localStorage.getItem("pharmacyUser")||"{}"); if (u.token?.startsWith("eyJ")) return u.token; } catch { /* ignore */ }
  for (const k of Object.keys(localStorage)) { const v = localStorage.getItem(k); if (v?.startsWith("eyJ") && v.split(".").length===3) return v; }
  return null;
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_API}${path}`, {
    ...opts,
    headers: { "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}), ...opts.headers },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function saveSection(section, data) {
  const res = await apiFetch("/api/pharmacy/dashboard/update", {
    method: "POST",
    body: JSON.stringify({ section, data }),
  });
  return res;
}

function getPharmacyId() {
  try { const u = JSON.parse(localStorage.getItem("pharmacyUser")||"{}"); return u._id||u.id||"default"; }
  catch { return "default"; }
}

function getKeys() {
  const id = getPharmacyId();
  return {
    inventory:`ph_${id}_inventory`, billing:`ph_${id}_billing`,
    suppliers:`ph_${id}_suppliers`, purchases:`ph_${id}_purchases`,
    customers:`ph_${id}_customers`, prescriptions:`ph_${id}_prescriptions`,
    staff:`ph_${id}_staff`,
  };
}

function useStore(cacheKey, initial, section) {
  const [data, setData] = useState(() => lsGet(cacheKey, initial));
  const [syncStatus, setSyncStatus] = useState("idle");
  const timer = useRef(null);
  const retryTimer = useRef(null);

  const set = useCallback((fn) => {
    setData(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      lsSet(cacheKey, next);
      clearTimeout(timer.current);
      setSyncStatus("saving");
      timer.current = setTimeout(() => {
        saveSection(section, next)
          .then(() => {
            setSyncStatus("saved");
            setTimeout(() => setSyncStatus("idle"), 2000);
          })
          .catch(() => {
            setSyncStatus("error");
            clearTimeout(retryTimer.current);
            retryTimer.current = setTimeout(() => {
              saveSection(section, next)
                .then(() => {
                  setSyncStatus("saved");
                  setTimeout(() => setSyncStatus("idle"), 2000);
                })
                .catch(() => setSyncStatus("error"));
            }, 5000);
          });
      }, 800);
      return next;
    });
  }, [cacheKey, section]);

  return [data, set, syncStatus];
}

// ── PDF/Print Utilities 
function printHTML(html, title="Report") {
  const w = window.open("","_blank");
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>*{box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;margin:0;padding:20px;color:#111;background:#fff}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}table{width:100%;border-collapse:collapse}th{background:#f0f9ff;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#475569;border-bottom:2px solid #e2e8f0}td{padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:12px}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #059669;padding-bottom:16px;margin-bottom:20px}.logo{font-size:22px;font-weight:800;color:#059669}.badge{background:#ecfdf5;color:#059669;border:1px solid #059669;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700}.total-row{background:#f0fdf4;font-weight:700}.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}.stat-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px}.stat-label{font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:700;margin-bottom:4px}.stat-value{font-size:22px;font-weight:800;color:#0f172a}</style></head><body>${html}</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>{ w.print(); }, 400);
}

function buildInvoiceHTML(inv, ph) {
  const items = inv.items || [];
  const subtotal = items.reduce((s, it) => { const p=parseFloat(it.price)||0,q=parseFloat(it.quantity)||0,d=parseFloat(it.discount)||0; return s+p*q*(1-d/100); }, 0);
  const gstAmt   = items.reduce((s, it) => { const base=(parseFloat(it.price)||0)*(parseFloat(it.quantity)||0)*(1-(parseFloat(it.discount)||0)/100); return s+base*((parseFloat(it.gst)||0)/100); }, 0);
  const overDisc = subtotal*(parseFloat(inv.overallDiscount||0)/100);
  const addOn    = parseFloat(inv.addOnCharges||0);
  const total    = subtotal - overDisc + gstAmt + addOn;
  const profit   = items.reduce((s, it) => { const cp=parseFloat(it.costPrice||0),q=parseFloat(it.quantity||0),sp=parseFloat(it.price||0),d=parseFloat(it.discount||0); return s+(sp*(1-d/100)-cp)*q; }, 0);

  const brand = ph.brandColor || "#059669";
  const logoHtml = ph.logoUrl
    ? `<img src="${ph.logoUrl}" style="height:60px;max-width:140px;object-fit:contain;" alt="${ph.facilityName}"/>`
    : `<div style="height:60px;width:60px;background:${brand};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;font-weight:900;font-family:Arial;">${(ph.facilityName||"P").charAt(0).toUpperCase()}</div>`;
  const now = new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Invoice ${inv.invoiceNumber}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;padding:20px;}
@media print{
  body{padding:8px;}
  @page{margin:8mm;}
  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important;}
  .top-bar{background:${brand} !important;}
  thead tr{background:${brand} !important;}
  .pay-badge{background:${brand} !important;}
  .footer-bar{background:${brand} !important;}
}
.page{max-width:800px;margin:0 auto;border:1px solid #ccc;}
.top-bar{background:${brand};padding:5px 14px;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.top-bar span{color:rgba(255,255,255,0.92);font-size:10.5px;}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding:12px 14px 10px;border-bottom:2px solid ${brand};}
.h-left{display:flex;align-items:flex-start;gap:12px;flex:1;}
.h-center{flex:1;text-align:center;padding:0 14px;}
.h-right{text-align:right;}
.ph-name{font-size:16px;font-weight:900;color:${brand};letter-spacing:-0.3px;}
.ph-sub{font-size:10px;color:#555;margin-top:3px;line-height:1.55;}
.doc-title{font-size:13px;font-weight:700;color:#111;text-transform:uppercase;letter-spacing:1px;}
.doc-sub{font-size:10px;color:#666;margin-top:3px;}
.inv-num{font-size:16px;font-weight:900;color:${brand};margin-top:7px;}
.inv-date{font-size:10px;color:#555;margin-top:2px;}
.pay-badge{display:inline-block;background:${brand};color:#fff;border-radius:4px;padding:2px 10px;font-size:10px;font-weight:700;margin-top:5px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.bb-brand{font-size:14px;font-weight:900;color:#1a5fa8;letter-spacing:-0.5px;}
.bb-sub{font-size:9px;color:#888;}
.info-row-section{background:#f7f7f7;border-bottom:1px solid #ddd;padding:8px 14px;display:flex;gap:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.info-col{flex:1;}
.ic-title{font-size:9px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #ddd;padding-bottom:3px;margin-bottom:5px;}
.ic-row{display:flex;justify-content:space-between;font-size:10.5px;margin-bottom:2px;}
.ic-lbl{color:#666;}
.ic-val{color:#1a1a1a;font-weight:600;text-align:right;}
table{width:100%;border-collapse:collapse;}
thead tr{background:${brand};-webkit-print-color-adjust:exact;print-color-adjust:exact;}
thead th{padding:7px 9px;text-align:left;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;}
thead th.r{text-align:right;}
thead th.c{text-align:center;}
tbody tr:nth-child(odd){background:#fafafa;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
tbody tr:nth-child(even){background:#fff;}
tbody tr{border-bottom:1px solid #eee;}
tbody td{padding:7px 9px;font-size:11px;vertical-align:middle;}
tbody td.r{text-align:right;}
tbody td.c{text-align:center;}
.med-name{font-size:11.5px;color:#1a1a1a;}
.med-gen{font-size:9.5px;color:#888;margin-top:1px;}
.totals-wrap{display:flex;justify-content:flex-end;padding:10px 14px;border-top:1px solid #eee;}
.totals-inner{width:250px;}
.t-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px;color:#555;}
.t-row.grand{border-top:2px solid ${brand};margin-top:5px;padding-top:7px;font-size:15px;font-weight:900;color:${brand};}
.t-row.profit-row{border-top:1px dashed #ddd;margin-top:4px;padding-top:4px;font-size:10px;color:#999;}
.notes{background:#fffbeb;border-top:1px solid #fde68a;border-bottom:1px solid #fde68a;padding:6px 14px;font-size:11px;color:#92400e;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.sign-section{display:flex;justify-content:flex-end;padding:10px 14px 6px;}
.sign-box{text-align:center;width:160px;}
.sign-line{border-top:1px solid #aaa;margin-top:28px;padding-top:4px;font-size:10px;color:#555;}
.footer-bar{background:${brand};padding:7px 14px;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.footer-bar span{color:rgba(255,255,255,0.92);font-size:10px;}
</style>
</head>
<body>
<div class="page">

<div class="top-bar" style="background:${brand};-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;">
  <span style="color:rgba(255,255,255,0.92);font-size:10.5px;">${ph.facilityName||"Pharmacy"}${ph.address?" &nbsp;|&nbsp; "+ph.address:""}</span>
  <span style="color:rgba(255,255,255,0.92);font-size:10.5px;">INVOICE #${inv.invoiceNumber} &nbsp;|&nbsp; ${inv.date}</span>
</div>

<div class="header">
  <div class="h-left">
    ${logoHtml}
    <div>
      <div class="ph-name">${ph.facilityName||"Pharmacy"}</div>
      <div class="ph-sub">
        ${ph.address||""}${ph.address?"<br/>":""}
        Ph: ${ph.phone||"—"}${ph.alternatePhone?" | "+ph.alternatePhone:""}${ph.whatsappNumber?" | WA: "+ph.whatsappNumber:""}
        ${ph.gstNumber?"<br/>GSTIN: <b>"+ph.gstNumber+"</b>":""}${ph.drugLicenseNumber?" &nbsp;|&nbsp; Drug Lic: <b>"+ph.drugLicenseNumber+"</b>":""}
        ${ph.licenseNumber?"<br/>Lic No: <b>"+ph.licenseNumber+"</b>":""}${ph.registrationNumber?" &nbsp;|&nbsp; Reg: <b>"+ph.registrationNumber+"</b>":""}
        ${ph.panNumber?"<br/>PAN: <b>"+ph.panNumber+"</b>":""}
      </div>
    </div>
  </div>
  <div class="h-center">
    <div class="doc-title">Sales Invoice</div>
    <div class="doc-sub">Tax Invoice &nbsp;|&nbsp; GST Compliant</div>
    <div class="inv-num">#${inv.invoiceNumber}</div>
    <div class="inv-date">${inv.date}</div>
    <div class="pay-badge" style="background:${brand};color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;">${inv.paymentMode||"Cash"}</div>
  </div>
  <div class="h-right">
    <div class="bb-brand">BioBurg</div>
    <div class="bb-sub">Powered by BioBurg</div>
    <div class="bb-sub">bioburg.in</div>
  </div>
</div>

<div class="info-row-section" style="background:#f7f7f7;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
  <div class="info-col">
    <div class="ic-title">Patient / Billed To</div>
    <div class="ic-row"><span class="ic-lbl">Name</span><span class="ic-val">${inv.customerName||"Walk-in"}</span></div>
    ${inv.doctorName?`<div class="ic-row"><span class="ic-lbl">Doctor</span><span class="ic-val">Dr. ${inv.doctorName}</span></div>`:""}
    ${inv.prescriptionNumber?`<div class="ic-row"><span class="ic-lbl">Rx No.</span><span class="ic-val">${inv.prescriptionNumber}</span></div>`:""}
  </div>
  <div class="info-col">
    <div class="ic-title">Payment Details</div>
    <div class="ic-row"><span class="ic-lbl">Mode</span><span class="ic-val">${inv.paymentMode||"Cash"}</span></div>
    ${inv.upiId?`<div class="ic-row"><span class="ic-lbl">UPI Ref</span><span class="ic-val">${inv.upiId}</span></div>`:""}
    ${inv.cardLast4?`<div class="ic-row"><span class="ic-lbl">${inv.cardType||"Card"}</span><span class="ic-val">****${inv.cardLast4}</span></div>`:""}
    ${inv.bankName?`<div class="ic-row"><span class="ic-lbl">Bank</span><span class="ic-val">${inv.bankName}</span></div>`:""}
  </div>
  <div class="info-col">
    <div class="ic-title">Invoice Info</div>
    <div class="ic-row"><span class="ic-lbl">Invoice No.</span><span class="ic-val">${inv.invoiceNumber}</span></div>
    <div class="ic-row"><span class="ic-lbl">Date</span><span class="ic-val">${inv.date}</span></div>
    <div class="ic-row"><span class="ic-lbl">Printed</span><span class="ic-val">${now}</span></div>
  </div>
</div>

<table>
  <thead>
    <tr style="background:${brand};-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;">
      <th style="width:28px;padding:7px 9px;text-align:left;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;">#</th>
      <th style="padding:7px 9px;text-align:left;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;">Medicine / Product</th>
      <th style="width:46px;padding:7px 9px;text-align:center;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;">Qty</th>
      <th style="width:66px;padding:7px 9px;text-align:right;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;">MRP</th>
      <th style="width:46px;padding:7px 9px;text-align:center;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;">Disc%</th>
      <th style="width:46px;padding:7px 9px;text-align:center;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;">GST%</th>
      <th style="width:74px;padding:7px 9px;text-align:right;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${items.map((it,i)=>{const base=(parseFloat(it.price)||0)*(parseFloat(it.quantity)||0)*(1-(parseFloat(it.discount)||0)/100);const amt=base*(1+(parseFloat(it.gst)||0)/100);return `<tr><td style="color:#888">${i+1}</td><td><div class="med-name">${it.medicineName}</div>${it.genericName?`<div class="med-gen">${it.genericName}</div>`:""}</td><td class="c">${it.quantity}</td><td class="r">&#8377;${(+it.price||0).toFixed(2)}</td><td class="c" style="color:#777">${it.discount||0}%</td><td class="c" style="color:#777">${it.gst||0}%</td><td class="r" style="font-weight:600;">&#8377;${amt.toFixed(2)}</td></tr>`;}).join("")}
  </tbody>
</table>

<div class="totals-wrap">
  <div class="totals-inner">
    <div class="t-row"><span>Subtotal</span><span>&#8377;${subtotal.toFixed(2)}</span></div>
    ${overDisc>0?`<div class="t-row" style="color:#dc2626;"><span>Discount (${inv.overallDiscount||0}%)</span><span>&#8722;&#8377;${overDisc.toFixed(2)}</span></div>`:""}
    <div class="t-row"><span>GST</span><span>&#8377;${gstAmt.toFixed(2)}</span></div>
    ${addOn>0?`<div class="t-row" style="color:#d97706;"><span>${inv.addOnLabel||"Other Charges"}</span><span>+&#8377;${addOn.toFixed(2)}</span></div>`:""}
    <div class="t-row grand"><span>TOTAL</span><span>&#8377;${total.toFixed(2)}</span></div>
    <div class="t-row profit-row"><span>Internal Profit</span><span style="color:${profit>=0?"#059669":"#dc2626"};">&#8377;${profit.toFixed(2)}</span></div>
  </div>
</div>

${inv.notes?`<div class="notes">Notes: ${inv.notes}</div>`:""}

<div class="sign-section">
  <div class="sign-box">
    <div class="sign-line">${ph.facilityName||"Pharmacy"}<br/>Stamp &amp; Signature</div>
  </div>
</div>

<div class="footer-bar" style="background:${brand};-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;padding:7px 14px;display:flex;justify-content:space-between;align-items:center;">
  <span style="color:rgba(255,255,255,0.92);font-size:10px;">${ph.phone||""}${ph.alternatePhone?" | "+ph.alternatePhone:""}</span>
  <span style="color:rgba(255,255,255,0.92);font-size:10px;">Thank you &nbsp;|&nbsp; ${ph.facilityName||"Pharmacy"} &nbsp;|&nbsp; Computer-generated invoice</span>
  <span style="color:rgba(255,255,255,0.92);font-size:10px;">${ph.email||"support@bioburg.in"}</span>
</div>

</div>
</body>
</html>`;
}

function printInvoiceDoc(html) {
  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(()=>w.print(),400);
}

// ── Shared UI 
function card(T, extra = {}) {
  return { background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", ...extra };
}

function StatCard({ label, value, sub, color, T }) {
  return (
    <div style={{ ...card(T, { padding:"18px 20px", borderLeft:`4px solid ${color}` }) }}>
      <div style={{ fontSize:10.5, color:T.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:800, color:T.text, letterSpacing:"-1px", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11.5, color:T.muted, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status, T }) {
  const MAP = {
    "Active":{ c:T.success, bg:T.successBg },"Inactive":{ c:T.muted, bg:T.surface2 },
    "In Stock":{ c:T.success, bg:T.successBg },"Low Stock":{ c:T.warn, bg:T.warnBg },
    "Out":{ c:T.danger, bg:T.dangerBg },"Paid":{ c:T.success, bg:T.successBg },
    "Pending":{ c:T.warn, bg:T.warnBg },"Received":{ c:T.success, bg:T.successBg },
    "Ordered":{ c:T.blue, bg:T.blueBg },"Returned":{ c:T.danger, bg:T.dangerBg },
    "Expired":{ c:T.danger, bg:T.dangerBg },"Expiring":{ c:T.warn, bg:T.warnBg },
    "Safe":{ c:T.success, bg:T.successBg },"Cash":{ c:T.success, bg:T.successBg },
    "UPI":{ c:T.blue, bg:T.blueBg },"Card":{ c:T.purple, bg:T.purpleBg },
    "NetBanking":{ c:T.accent, bg:T.accentBg },"Credit":{ c:T.purple, bg:T.purpleBg },
  };
  const s = MAP[status] || { c:T.muted, bg:T.surface2 };
  return <span style={{ background:s.bg, color:s.c, border:`1px solid ${s.c}33`, borderRadius:99, padding:"2px 10px", fontSize:11.5, fontWeight:700, whiteSpace:"nowrap" }}>{status}</span>;
}

function Btn({ label, onClick, variant="primary", small, T, disabled, icon }) {
  const [h, setH] = useState(false);
  const V = {
    primary:{ bg:h?T.accentHov:T.accent, color:"#fff", border:"none" },
    secondary:{ bg:h?T.surface2:T.surface, color:T.text2, border:`1px solid ${T.border2}` },
    danger:{ bg:T.dangerBg, color:T.danger, border:`1px solid ${T.danger}` },
    ghost:{ bg:h?T.accentBg:"transparent", color:T.accent, border:"none" },
    warn:{ bg:T.warnBg, color:T.warn, border:`1px solid ${T.warn}` },
  };
  const s = V[variant] || V.primary;
  return (
    <button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ padding:small?"5px 12px":"8px 18px", borderRadius:9, border:s.border, background:s.bg, color:s.color, cursor:disabled?"not-allowed":"pointer", fontWeight:600, fontSize:small?12:13, fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap", opacity:disabled?.5:1, display:"flex", alignItems:"center", gap:5 }}>
      {icon && <span>{icon}</span>}{label}
    </button>
  );
}

function FInput({ label, value, onChange, type="text", options, required, T, placeholder, multiline, rows=3, prefix, suffix, allowOther }) {
  const base = { width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${T.border2}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", background:T.surface2, color:T.text };
  const fs = e => e.target.style.borderColor = T.accent;
  const fb = e => e.target.style.borderColor = T.border2;
  const isOtherSelected = allowOther && options && !options.includes(value) && value && value !== "";
  const [showCustom, setShowCustom] = useState(isOtherSelected);
  const [customVal, setCustomVal] = useState(isOtherSelected ? value : "");

  const handleSelect = (v) => {
    if(allowOther && v==="__other__") { setShowCustom(true); onChange(customVal||""); }
    else { setShowCustom(false); onChange(v); }
  };
  const handleCustom = (v) => { setCustomVal(v); onChange(v); };

  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}{required && <span style={{ color:T.danger }}> *</span>}</div>}
      {(prefix||suffix) ? (
        <div style={{ display:"flex", alignItems:"center", border:`1.5px solid ${T.border2}`, borderRadius:9, overflow:"hidden", background:T.surface2 }}>
          {prefix && <span style={{ padding:"0 10px", color:T.muted, fontSize:13, fontWeight:600, borderRight:`1px solid ${T.border2}`, whiteSpace:"nowrap" }}>{prefix}</span>}
          <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ ...base, border:"none", borderRadius:0, flex:1 }} onFocus={fs} onBlur={fb}/>
          {suffix && <span style={{ padding:"0 10px", color:T.muted, fontSize:13, fontWeight:600, borderLeft:`1px solid ${T.border2}`, whiteSpace:"nowrap" }}>{suffix}</span>}
        </div>
      ) : options ? (
        <>
          <select
            value={showCustom?"__other__":(options.includes(value)?value:"")}
            onChange={e=>handleSelect(e.target.value)}
            style={{ ...base, cursor:"pointer" }} onFocus={fs} onBlur={fb}>
            <option value="">— Select —</option>
            {options.map(o => <option key={typeof o==="object"?o.value:o} value={typeof o==="object"?o.value:o}>{typeof o==="object"?o.label:o}</option>)}
            {allowOther && <option value="__other__">✏ Other (type below)</option>}
          </select>
          {(showCustom || (allowOther && value && !options.includes(value))) && (
            <input type="text" value={customVal||value} onChange={e=>handleCustom(e.target.value)}
              placeholder="Type your value here…"
              style={{ ...base, marginTop:6, border:`1.5px solid ${T.accent}` }} onFocus={fs} onBlur={fb}/>
          )}
        </>
      ) : multiline ? (
        <textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ ...base, resize:"vertical" }} onFocus={fs} onBlur={fb}/>
      ) : (
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={fs} onBlur={fb}/>
      )}
    </div>
  );
}

// Medicine AutoComplete Input
function MedAutoComplete({ label, value, onChange, inventory, T, onSelect, required }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value||"");
  const ref = useRef(null);
  useEffect(()=>{ setQ(value||""); },[value]);
  useEffect(()=>{
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[]);
  const matches = q.length>0 ? inventory.filter(m=>
    m.medicineName?.toLowerCase().includes(q.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(q.toLowerCase()) ||
    m.brand?.toLowerCase().includes(q.toLowerCase())
  ).slice(0,8) : [];
  return (
    <div style={{ marginBottom:14, position:"relative" }} ref={ref}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}{required && <span style={{ color:T.danger }}> *</span>}</div>}
      <input value={q} onChange={e=>{ setQ(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={()=>setOpen(true)}
        placeholder="Type medicine name or salt…"
        style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${T.border2}`, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", background:T.surface2, color:T.text }}/>
      {open && matches.length>0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:9000, background:T.surface, border:`1.5px solid ${T.border2}`, borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.2)", maxHeight:220, overflowY:"auto" }}>
          {matches.map((m,i)=>(
            <div key={i} onMouseDown={()=>{ setQ(m.medicineName); setOpen(false); onSelect&&onSelect(m); onChange(m.medicineName); }}
              style={{ padding:"10px 14px", cursor:"pointer", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}
              onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{m.medicineName}</div>
                <div style={{ fontSize:11, color:T.muted }}>{m.genericName||""} {m.brand?`· ${m.brand}`:""}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.accent }}>{fmtAmt(m.sellingPrice||0)}</div>
                <div style={{ fontSize:10, color:m.quantity<=0?T.danger:T.muted }}>Stock: {m.quantity}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, T, wide, extraWide, full }) {
  const w = useWindowWidth(); const mob = w < 640;
  const mw = full?"98vw":extraWide?"min(960px,96vw)":wide?"min(780px,95vw)":"min(580px,95vw)";
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9999, display:"flex", alignItems:mob?"flex-end":"center", justifyContent:"center", backdropFilter:"blur(4px)" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:T.surface, borderRadius:mob?"18px 18px 0 0":16, width:mob?"100%":mw, maxHeight:mob?"94vh":"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.4)", padding:mob?"20px 16px":"28px 30px", border:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:T.text }}>{title}</h2>
          <button onClick={onClose} style={{ border:"none", background:T.surface2, borderRadius:8, cursor:"pointer", padding:"6px 12px", fontSize:16, color:T.muted }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onClose, T }) {
  return (
    <Modal title="Confirm Action" onClose={onClose} T={T}>
      <p style={{ color:T.text2, fontSize:14, marginBottom:24, lineHeight:1.6 }}>{message}</p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn label="Cancel" variant="secondary" onClick={onClose} T={T}/>
        <Btn label="Confirm" variant="danger" onClick={onConfirm} T={T}/>
      </div>
    </Modal>
  );
}

function PageHeader({ title, subtitle, action, T }) {
  const w = useWindowWidth(); const mob = w < 640;
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:mob?"flex-start":"center", flexDirection:mob?"column":"row", gap:mob?12:0, marginBottom:24 }}>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:4, height:36, borderRadius:4, background:T.accent, flexShrink:0 }}/>
        <div>
          <h1 style={{ margin:0, fontSize:mob?18:22, fontWeight:800, color:T.text, letterSpacing:"-0.4px" }}>{title}</h1>
          {subtitle && <p style={{ margin:"3px 0 0", fontSize:12.5, color:T.muted }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{action}</div>}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder, T }) {
  const w = useWindowWidth();
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, background:T.surface2, border:`1.5px solid ${T.border2}`, borderRadius:10, padding:"8px 14px", width:w<640?"100%":"auto", minWidth:220, boxSizing:"border-box" }}>
      <span style={{ color:T.muted, fontSize:13 }}>⌕</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ border:"none", background:"transparent", outline:"none", fontSize:13, width:w<640?"100%":200, fontFamily:"inherit", color:T.text }}/>
    </div>
  );
}

function FilterTabs({ tabs, active, onChange, counts, T }) {
  const mob = useWindowWidth() < 640;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:2, background:T.surface2, borderRadius:10, padding:3, border:`1px solid ${T.border}` }}>
      {tabs.map(s => (
        <button key={s} onClick={() => onChange(s)}
          style={{ padding:mob?"5px 8px":"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:mob?10.5:12.5, fontFamily:"inherit", background:active===s?T.accent:"transparent", color:active===s?"#fff":T.muted, transition:"all 0.13s" }}>
          {s==="all"?"All":s}
          {counts && <span style={{ marginLeft:4, fontSize:10, background:active===s?"rgba(255,255,255,0.25)":T.border, color:active===s?"#fff":T.muted, borderRadius:20, padding:"0 5px" }}>{counts[s]??0}</span>}
        </button>
      ))}
    </div>
  );
}

function DataTable({ headers, rows, onEdit, onDelete, T, extraActions }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560, fontSize:13 }}>
        <thead>
          <tr style={{ background:T.surface2, borderBottom:`2px solid ${T.border}` }}>
            {headers.map(h => <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10.5, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{h}</th>)}
            {(onEdit||onDelete||extraActions) && <th style={{ padding:"10px 14px", textAlign:"center", fontSize:10.5, fontWeight:700, color:T.muted, textTransform:"uppercase" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={headers.length+1} style={{ textAlign:"center", padding:"48px", color:T.muted, fontSize:13 }}>No records found</td></tr>}
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom:i<rows.length-1?`1px solid ${T.border}`:"none", transition:"background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background=T.surface2}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              {row.cells.map((cell, j) => <td key={j} style={{ padding:"12px 14px", color:T.text, verticalAlign:"middle" }}>{cell}</td>)}
              {(onEdit||onDelete||extraActions) && (
                <td style={{ padding:"12px 14px", textAlign:"center" }}>
                  <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                    {extraActions && extraActions(row.raw)}
                    {onEdit && <Btn label="Edit" variant="secondary" small onClick={() => onEdit(row.raw)} T={T}/>}
                    {onDelete && <Btn label="Del" variant="danger" small onClick={() => onDelete(row.raw)} T={T}/>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionCard({ title, count, color, children, T, action }) {
  return (
    <div style={{ ...card(T, { padding:0, overflow:"hidden" }) }}>
      <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.surface2 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:color }}/>
          <span style={{ fontWeight:700, fontSize:13.5, color:T.text }}>{title}</span>
          {count !== undefined && <span style={{ fontSize:11, background:color+"22", color, borderRadius:20, padding:"2px 8px", fontWeight:700 }}>{count}</span>}
        </div>
        {action}
      </div>
      <div style={{ padding:"16px 18px" }}>{children}</div>
    </div>
  );
}

// ── Constants 
const MED_CATEGORIES = ["Tablet","Capsule","Syrup","Injection","Ointment","Drops","Inhaler","Powder","Gel","Cream","Vaccine","OTC","Surgical","Supplement","Ayurvedic"];
const PAYMENT_MODES = ["Cash","UPI","Card","NetBanking","Credit","Insurance"];
const INDIAN_STATES = ["Andhra Pradesh","Assam","Bihar","Delhi","Goa","Gujarat","Haryana","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Odisha","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal"];
const QUALIFICATIONS = ["B.Pharm","M.Pharm","D.Pharm","Pharm.D","MBBS","MD","BDS","MDS","B.Sc Nursing","M.Sc Nursing","GNM","ANM","MBA (Healthcare)","Other"];
const SPECIALIZATIONS = ["General Medicine","Cardiology","Dermatology","Orthopedics","Pediatrics","Gynecology","Neurology","Oncology","Ophthalmology","ENT","Psychiatry","Endocrinology","Nephrology","Pulmonology","Gastroenterology","Other"];
const CARD_TYPES = ["Visa","Mastercard","RuPay","Amex","Discover"];

//  DASHBOARD OVERVIEW
function DashboardOverview({ inventory, billing, purchases, customers, T }) {
  const mob = useWindowWidth() < 640;
  const stored = JSON.parse(localStorage.getItem("pharmacyUser")||"{}");
  const todayStr = today();

  const todaySales = billing.filter(b=>b.date===todayStr).reduce((a,b)=>a+(parseFloat(b.totalAmount)||0),0);
  const todayCost  = billing.filter(b=>b.date===todayStr).reduce((a,b)=>a+(b.items||[]).reduce((s,it)=>{const cp=parseFloat(it.costPrice||0),q=parseFloat(it.quantity||0);return s+cp*q;},0),0);
  const todayProfit = todaySales - todayCost;
  const lowStock = inventory.filter(i=>+i.quantity<=(+(i.minStock||10))).length;
  const expiringSoon = inventory.filter(i=>{const d=daysLeft(i.expiryDate);return d!==null&&d>=0&&d<=180;}).length;
  const outOfStock = inventory.filter(i=>+i.quantity===0).length;
  const totalRevenue = billing.reduce((a,b)=>a+(parseFloat(b.totalAmount)||0),0);
  const totalCost = billing.reduce((a,b)=>a+(b.items||[]).reduce((s,it)=>{return s+(parseFloat(it.costPrice||0))*(parseFloat(it.quantity||0));},0),0);
  const totalProfit = totalRevenue - totalCost;

  const recentSales = [...billing].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5);
  const expiringMeds = inventory.filter(i=>{const d=daysLeft(i.expiryDate);return d!==null&&d<=180&&d>=0;}).sort((a,b)=>daysLeft(a.expiryDate)-daysLeft(b.expiryDate)).slice(0,5);
  const lowStockMeds = inventory.filter(i=>+i.quantity<=(+i.minStock||0)).slice(0,5);

  const printDash = () => {
    const html = `
      <div class="header"><div><div class="logo">Dashboard Summary</div><div style="font-size:12px;color:#64748b">${stored.facilityName} · ${todayStr}</div></div></div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Today Revenue</div><div class="stat-value" style="color:#059669">${fmtAmt(todaySales)}</div></div>
        <div class="stat-card"><div class="stat-label">Today Profit</div><div class="stat-value" style="color:${todayProfit>=0?"#059669":"#dc2626"}">${fmtAmt(todayProfit)}</div></div>
        <div class="stat-card"><div class="stat-label">Low Stock</div><div class="stat-value" style="color:#d97706">${lowStock}</div></div>
        <div class="stat-card"><div class="stat-label">Expiring (6mo)</div><div class="stat-value" style="color:#dc2626">${expiringSoon}</div></div>
      </div>
      <h3>Recent Sales</h3>
      <table><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Payment</th><th>Amount</th></tr></thead><tbody>
      ${recentSales.map(s=>`<tr><td>${s.invoiceNumber}</td><td>${s.customerName||"Walk-in"}</td><td>${s.date}</td><td>${s.paymentMode}</td><td>₹${(+s.totalAmount||0).toFixed(2)}</td></tr>`).join("")}
      </tbody></table>`;
    printHTML(html,"Dashboard Summary");
  };

  return (
    <>
      <div style={{ marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:mob?20:26, fontWeight:800, color:T.text, letterSpacing:"-0.5px" }}>
            Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, {stored.contactPerson?.split(" ")[0]||"Admin"}
          </h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:T.muted }}>
            {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} · {stored.facilityName}
          </p>
        </div>
        <Btn T={T} label="Print Summary" variant="secondary" small icon="🖨" onClick={printDash}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)", gap:12, marginBottom:14 }}>
        <StatCard T={T} label="Today's Revenue" value={fmtAmt(todaySales)} sub={`${billing.filter(b=>b.date===todayStr).length} invoices`} color={T.accent}/>
        <StatCard T={T} label="Today's Profit" value={fmtAmt(todayProfit)} sub={todayProfit>=0?"Profitable":"Loss today"} color={todayProfit>=0?T.success:T.danger}/>
        <StatCard T={T} label="Low Stock" value={lowStock} sub="Items below minimum" color={T.warn}/>
        <StatCard T={T} label="Expiring ≤6mo" value={expiringSoon} sub="Needs attention" color={T.danger}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <StatCard T={T} label="Total Revenue" value={fmtAmt(totalRevenue)} sub="All time" color={T.blue}/>
        <StatCard T={T} label="Total Profit" value={fmtAmt(totalProfit)} sub="Revenue - Cost" color={totalProfit>=0?T.success:T.danger}/>
        <StatCard T={T} label="Total Customers" value={customers.length} sub="Registered" color={T.purple}/>
        <StatCard T={T} label="Total Medicines" value={inventory.length} sub={`${outOfStock} out of stock`} color={T.accent}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:16 }}>
        <SectionCard T={T} title="Today's Alerts" color={T.danger}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { label:"Low Stock", value:lowStock, color:T.warn },
              { label:"Expiring ≤6 months", value:expiringSoon, color:T.danger },
              { label:"Out of Stock", value:outOfStock, color:T.danger },
              { label:"Pending Orders", value:purchases.filter(p=>p.status==="Ordered").length, color:T.blue },
            ].map((a,i)=>(
              <div key={i} style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:T.muted }}>{a.label}</span>
                <span style={{ fontWeight:800, fontSize:20, color:a.value>0?a.color:T.success }}>{a.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard T={T} title="Recent Sales" count={recentSales.length} color={T.accent}>
          {recentSales.length===0 ? <p style={{ color:T.muted, fontSize:13, textAlign:"center", padding:"20px 0" }}>No sales yet</p>
            : recentSales.map((s,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<recentSales.length-1?`1px solid ${T.border}`:"none" }}>
                <div>
                  <div style={{ fontWeight:700, color:T.text, fontSize:13 }}>{s.customerName||"Walk-in"}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{s.invoiceNumber} · {s.date}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:700, color:T.accent }}>{fmtAmt(parseFloat(s.totalAmount)||0)}</div>
                  <StatusBadge status={s.paymentMode||"Cash"} T={T}/>
                </div>
              </div>
            ))}
        </SectionCard>

        <SectionCard T={T} title="Expiring Soon (6 months)" count={expiringMeds.length} color={T.danger}>
          {expiringMeds.length===0 ? <p style={{ color:T.muted, fontSize:13, textAlign:"center", padding:"20px 0" }}>No medicines expiring soon</p>
            : expiringMeds.map((m,i)=>{
              const d = daysLeft(m.expiryDate);
              return (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<expiringMeds.length-1?`1px solid ${T.border}`:"none" }}>
                  <div>
                    <div style={{ fontWeight:700, color:T.text, fontSize:13 }}>{m.medicineName}</div>
                    <div style={{ fontSize:11, color:T.muted }}>Batch: {m.batchNumber||"—"} · Exp: {fmtDate(m.expiryDate)}</div>
                  </div>
                  <span style={{ fontWeight:700, fontSize:12, color:d<=30?T.danger:d<=90?T.warn:T.blue, background:d<=30?T.dangerBg:d<=90?T.warnBg:T.blueBg, borderRadius:8, padding:"3px 10px" }}>
                    {d===0?"Today!":d<0?`${Math.abs(d)}d ago`:`${d}d`}
                  </span>
                </div>
              );
            })}
        </SectionCard>

        <SectionCard T={T} title="Low Stock Alert" color={T.warn}>
          {lowStockMeds.length===0
            ? <p style={{ color:T.muted, fontSize:13, textAlign:"center", padding:"20px 0" }}>All items well stocked</p>
            : lowStockMeds.map((m,i,arr)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none" }}>
                <div>
                  <div style={{ fontWeight:700, color:T.text, fontSize:13 }}>{m.medicineName}</div>
                  <div style={{ fontSize:11, color:T.muted }}>Min: {m.minStock||0} · Current: {m.quantity}</div>
                </div>
                <StatusBadge status={+m.quantity===0?"Out":"Low Stock"} T={T}/>
              </div>
            ))}
        </SectionCard>
      </div>
    </>
  );
}

//  MEDICINE MANAGEMENT
function MedicineManagement({ inventory, setInventory, T }) {
  const mob = useWindowWidth() < 640;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({});
  const [qualExtra, setQualExtra] = useState("");
  const [specExtra, setSpecExtra] = useState("");
  const fileRef = useRef(null);

  const f0 = {
    medicineId:"", medicineName:"", genericName:"", category:"Tablet", brand:"", manufacturer:"",
    manufacturerDrugLicense:"", batchNumber:"", quantity:"", minStock:"10", purchasePrice:"",
    sellingPrice:"", gstPercent:"12", manufacturingDate:"", expiryDate:"", rack:"",
    qualification:"", specialization:"", notes:""
  };

  const getStockStatus = m => +m.quantity===0?"Out":+m.quantity<=(+m.minStock||10)?"Low Stock":"In Stock";
  const getExpiryStatus = m => { const d=daysLeft(m.expiryDate); if(d===null)return"Safe"; if(d<0)return"Expired"; if(d<=180)return"Expiring"; return"Safe"; };

  const saveFn = () => {
    if (!form.medicineName||!form.quantity) return alert("Medicine name and quantity required.");
    const qual = form.qualification==="Other"?qualExtra:form.qualification;
    const spec = form.specialization==="Other"?specExtra:form.specialization;
    const item = { ...form, qualification:qual, specialization:spec, medicineId:form.medicineId||genId("MED",inventory) };
    if (modal==="add") setInventory(prev=>[item,...prev]);
    else setInventory(prev=>prev.map(x=>x.medicineId===item.medicineId?item:x));
    setModal(null);
  };

  // Excel import
  const handleExcelImport = (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const lines = text.split("\n").filter(l=>l.trim());
        const headers = lines[0].split(",").map(h=>h.trim().toLowerCase().replace(/\s+/g,""));
        const col = (n) => headers.indexOf(n);
        const rows = lines.slice(1).map(line=>{
          const cells = line.split(",");
          const get = (i) => (cells[i]||"").trim().replace(/^"|"$/g,"");
          return {
            medicineName: get(col("medicinename")||col("name")||0),
            genericName: get(col("genericname")||col("generic")||1),
            category: get(col("category")||2)||"Tablet",
            brand: get(col("brand")||3),
            manufacturer: get(col("manufacturer")||4),
            batchNumber: get(col("batchnumber")||col("batch")||5),
            quantity: get(col("quantity")||col("qty")||6)||"0",
            minStock: get(col("minstock")||col("minqty")||7)||"10",
            purchasePrice: get(col("purchaseprice")||col("costprice")||8)||"0",
            sellingPrice: get(col("sellingprice")||col("mrp")||9)||"0",
            gstPercent: get(col("gstpercent")||col("gst")||10)||"12",
            expiryDate: get(col("expirydate")||col("expiry")||11),
            manufacturingDate: get(col("manufacturingdate")||col("mfgdate")||12),
            rack: get(col("rack")||13),
          };
        }).filter(r=>r.medicineName);
        const newItems = rows.map(r=>({ ...r, medicineId:genId("MED",[...inventory,...rows]) }));
        setInventory(prev=>[...newItems,...prev]);
        alert(`✓ Imported ${newItems.length} medicines from Excel.`);
      } catch { alert("Import failed. Please use the correct CSV format."); }
    };
    reader.readAsText(file);
    e.target.value="";
  };

  const downloadTemplate = () => {
    const csv = "Medicine Name,Generic Name,Category,Brand,Manufacturer,Batch Number,Quantity,Min Stock,Purchase Price,Selling Price,GST%,Expiry Date,Mfg Date,Rack\nParacetamol 500mg,Paracetamol,Tablet,Dolo,Micro Labs,B001,100,10,2,4,12,2025-12-31,2024-01-01,A1";
    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="medicine_import_template.csv"; a.click();
  };

  const printInventory = () => {
    const html = `
      <div class="header"><div class="logo">Inventory Report</div><div style="font-size:12px;color:#64748b">${today()}</div></div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value">${inventory.length}</div></div>
        <div class="stat-card"><div class="stat-label">In Stock</div><div class="stat-value" style="color:#059669">${inventory.filter(m=>getStockStatus(m)==="In Stock").length}</div></div>
        <div class="stat-card"><div class="stat-label">Low Stock</div><div class="stat-value" style="color:#d97706">${inventory.filter(m=>getStockStatus(m)==="Low Stock").length}</div></div>
        <div class="stat-card"><div class="stat-label">Expiring ≤6mo</div><div class="stat-value" style="color:#dc2626">${inventory.filter(m=>getExpiryStatus(m)==="Expiring").length}</div></div>
      </div>
      <table><thead><tr><th>ID</th><th>Name</th><th>Generic</th><th>Category</th><th>Batch</th><th>Qty</th><th>MRP</th><th>Expiry</th><th>Status</th></tr></thead><tbody>
      ${filtered.map(m=>`<tr><td>${m.medicineId}</td><td><b>${m.medicineName}</b><br><span style="font-size:10px;color:#94a3b8">${m.brand||""}</span></td><td>${m.genericName||"—"}</td><td>${m.category}</td><td>${m.batchNumber||"—"}</td><td style="color:${+m.quantity<=+(m.minStock||10)?"#dc2626":"inherit"}">${m.quantity}</td><td>₹${m.sellingPrice||0}</td><td>${fmtDate(m.expiryDate)}</td><td>${getStockStatus(m)}</td></tr>`).join("")}
      </tbody></table>`;
    printHTML(html,"Inventory Report");
  };

  const tabs = ["all","In Stock","Low Stock","Out","Expiring","Expired"];
  const filtered = inventory
    .filter(m=>filter==="all"||{"In Stock":getStockStatus(m)==="In Stock","Low Stock":getStockStatus(m)==="Low Stock","Out":+m.quantity===0,"Expiring":getExpiryStatus(m)==="Expiring","Expired":getExpiryStatus(m)==="Expired"}[filter])
    .filter(m=>!search||m.medicineName?.toLowerCase().includes(search.toLowerCase())||m.genericName?.toLowerCase().includes(search.toLowerCase())||m.batchNumber?.toLowerCase().includes(search.toLowerCase())||m.brand?.toLowerCase().includes(search.toLowerCase()));
  const counts = tabs.reduce((a,s)=>({...a,[s]:s==="all"?inventory.length:s==="In Stock"?inventory.filter(m=>getStockStatus(m)==="In Stock").length:s==="Low Stock"?inventory.filter(m=>getStockStatus(m)==="Low Stock").length:s==="Out"?inventory.filter(m=>+m.quantity===0).length:s==="Expiring"?inventory.filter(m=>getExpiryStatus(m)==="Expiring").length:inventory.filter(m=>getExpiryStatus(m)==="Expired").length}),{});

  return (
    <>
      <PageHeader T={T} title="Medicine Management" subtitle={`${inventory.length} medicines in inventory`}
        action={<>
          <Btn T={T} label="Template" variant="secondary" onClick={downloadTemplate}/>
          <Btn T={T} label="Import Excel/CSV" variant="secondary" onClick={()=>fileRef.current?.click()}/>
          <input ref={fileRef} type="file" accept=".csv,.xlsx" style={{display:"none"}} onChange={handleExcelImport}/>
          <Btn T={T} label="Print" variant="secondary" small icon="🖨" onClick={printInventory}/>
          <Btn T={T} label="Add Medicine" icon="+" onClick={()=>{setForm(f0);setModal("add");}}/>
        </>}/>

      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"repeat(5,1fr)", gap:12, marginBottom:20 }}>
        <StatCard T={T} label="Total" value={inventory.length} color={T.blue}/>
        <StatCard T={T} label="In Stock" value={inventory.filter(m=>getStockStatus(m)==="In Stock").length} color={T.success}/>
        <StatCard T={T} label="Low Stock" value={inventory.filter(m=>getStockStatus(m)==="Low Stock").length} color={T.warn}/>
        <StatCard T={T} label="Out of Stock" value={inventory.filter(m=>+m.quantity===0).length} color={T.danger}/>
        <StatCard T={T} label="Expiring ≤6mo" value={inventory.filter(m=>getExpiryStatus(m)==="Expiring").length} color={T.danger}/>
      </div>

      <div style={{ ...card(T,{padding:"16px"}) }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:mob?"flex-start":"center", flexDirection:mob?"column":"row", marginBottom:14, gap:10 }}>
          <FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/>
          <SearchInput value={search} onChange={setSearch} placeholder="Search medicine, generic, brand, batch…" T={T}/>
        </div>
        <DataTable T={T}
          headers={["Med ID","Name","Generic","Category","Batch","Qty","Min","MRP","GST%","Expiry","Stock","Exp Status"]}
          rows={filtered.map(m=>({ raw:m, cells:[
            <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:12}}>{m.medicineId}</span>,
            <div><div style={{fontWeight:700,color:T.text}}>{m.medicineName}</div><div style={{fontSize:11,color:T.muted}}>{m.brand||"—"}</div></div>,
            <span style={{color:T.muted,fontSize:12}}>{m.genericName||"—"}</span>,
            <span style={{fontSize:12,background:T.blueBg,color:T.blue,borderRadius:6,padding:"2px 8px"}}>{m.category}</span>,
            m.batchNumber||"—",
            <span style={{fontWeight:700,color:+m.quantity<=(+m.minStock||10)?T.danger:T.text}}>{m.quantity}</span>,
            m.minStock||"10",
            m.sellingPrice?fmtAmt(m.sellingPrice):"—",
            m.gstPercent?`${m.gstPercent}%`:"—",
            <span style={{fontSize:12,color:(()=>{const d=daysLeft(m.expiryDate);return d!==null&&d>=0&&d<=180?T.warn:T.text;})()}}>{fmtDate(m.expiryDate)}</span>,
            <StatusBadge status={getStockStatus(m)} T={T}/>,
            <StatusBadge status={getExpiryStatus(m)} T={T}/>,
          ]}))}
          onEdit={m=>{setForm({...m});setModal("edit");}} onDelete={m=>setConfirm(m)}
        />
      </div>

      {modal && (
        <Modal title={modal==="add"?"Add New Medicine":"Edit Medicine"} onClose={()=>setModal(null)} T={T} extraWide>
          {/* Basic Information */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:800,color:T.accent,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${T.accentBg}`}}>Basic Information</div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:"0 20px"}}>
              <FInput T={T} label="Medicine Name" value={form.medicineName||""} onChange={v=>setForm(f=>({...f,medicineName:v}))} required/>
              <FInput T={T} label="Generic / Salt Name" value={form.genericName||""} onChange={v=>setForm(f=>({...f,genericName:v}))}/>
              <FInput T={T} label="Category" value={form.category||""} onChange={v=>setForm(f=>({...f,category:v}))} options={MED_CATEGORIES}/>
              <FInput T={T} label="Brand" value={form.brand||""} onChange={v=>setForm(f=>({...f,brand:v}))}/>
              <FInput T={T} label="Manufacturer" value={form.manufacturer||""} onChange={v=>setForm(f=>({...f,manufacturer:v}))}/>
              <FInput T={T} label="Manufacturer Drug License No." value={form.manufacturerDrugLicense||""} onChange={v=>setForm(f=>({...f,manufacturerDrugLicense:v}))} placeholder="e.g. KA/DL/001234"/>
              <FInput T={T} label="Rack / Location" value={form.rack||""} onChange={v=>setForm(f=>({...f,rack:v}))} placeholder="e.g. A-12"/>
            </div>
          </div>
          {/* Qualification & Specialization */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:800,color:T.purple,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${T.purpleBg}`}}>Qualification / Prescription Info</div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 20px"}}>
              <div>
                <FInput T={T} label="Qualification" value={form.qualification||""} onChange={v=>setForm(f=>({...f,qualification:v}))} options={QUALIFICATIONS}/>
                {form.qualification==="Other" && <FInput T={T} label="Specify Qualification" value={qualExtra} onChange={setQualExtra} placeholder="Enter qualification"/>}
              </div>
              <div>
                <FInput T={T} label="Specialization" value={form.specialization||""} onChange={v=>setForm(f=>({...f,specialization:v}))} options={SPECIALIZATIONS}/>
                {form.specialization==="Other" && <FInput T={T} label="Specify Specialization" value={specExtra} onChange={setSpecExtra} placeholder="Enter specialization"/>}
              </div>
            </div>
          </div>
          {/* Inventory & Pricing */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:800,color:T.blue,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${T.blueBg}`}}>Inventory & Pricing</div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:"0 20px"}}>
              <FInput T={T} label="Batch Number" value={form.batchNumber||""} onChange={v=>setForm(f=>({...f,batchNumber:v}))}/>
              <FInput T={T} label="Stock Quantity" value={form.quantity||""} onChange={v=>setForm(f=>({...f,quantity:v}))} type="number" required/>
              <FInput T={T} label="Minimum Stock Alert" value={form.minStock||""} onChange={v=>setForm(f=>({...f,minStock:v}))} type="number"/>
              <FInput T={T} label="Purchase / Cost Price" value={form.purchasePrice||""} onChange={v=>setForm(f=>({...f,purchasePrice:v}))} type="number" prefix="₹"/>
              <FInput T={T} label="Selling Price / MRP" value={form.sellingPrice||""} onChange={v=>setForm(f=>({...f,sellingPrice:v}))} type="number" prefix="₹"/>
              <FInput T={T} label="GST %" value={form.gstPercent||""} onChange={v=>setForm(f=>({...f,gstPercent:v}))} options={["0","5","12","18","28"]}/>
            </div>
            {form.purchasePrice && form.sellingPrice && (
              <div style={{background:T.accentBg,borderRadius:9,padding:"10px 14px",marginTop:4,fontSize:13,color:T.accent}}>
                Margin: ₹{(+form.sellingPrice - +form.purchasePrice).toFixed(2)} ({form.purchasePrice>0?(((+form.sellingPrice-+form.purchasePrice)/+form.purchasePrice)*100).toFixed(1):0}%)
              </div>
            )}
          </div>
          {/* Expiry */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:800,color:T.warn,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${T.warnBg}`}}>Expiry Information</div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 20px"}}>
              <FInput T={T} label="Manufacturing Date" value={form.manufacturingDate||""} onChange={v=>setForm(f=>({...f,manufacturingDate:v}))} type="date"/>
              <FInput T={T} label="Expiry Date" value={form.expiryDate||""} onChange={v=>setForm(f=>({...f,expiryDate:v}))} type="date"/>
            </div>
            {form.expiryDate && (()=>{const d=daysLeft(form.expiryDate);return d!==null&&d<=180&&d>=0?<div style={{background:T.warnBg,borderRadius:9,padding:"8px 14px",fontSize:13,color:T.warn}}>⚠ This medicine expires in {d} days</div>:null;})()}
          </div>
          {/* Notes */}
          <FInput T={T} label="Additional Notes" value={form.notes||""} onChange={v=>setForm(f=>({...f,notes:v}))} multiline rows={2} placeholder="Storage instructions, special handling…"/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Add Medicine":"Save Changes"} onClick={saveFn}/>
          </div>
        </Modal>
      )}
      {confirm && <ConfirmModal T={T} message={`Delete "${confirm.medicineName}" from inventory?`} onConfirm={()=>{setInventory(p=>p.filter(x=>x.medicineId!==confirm.medicineId));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  SALES & BILLING 
function SalesBilling({ billing, setBilling, inventory, setInventory, T }) {
  const mob = useWindowWidth() < 640;
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null); const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({}); const [items, setItems] = useState([]);

  const f0 = { invoiceNumber:"", date:today(), customerName:"", doctorName:"", prescriptionNumber:"", paymentMode:"Cash", upiId:"", cardType:"", cardLast4:"", bankName:"", notes:"", overallDiscount:"0", addOnCharges:"0", addOnLabel:"" };
  const emptyItem = () => ({ medicineName:"", genericName:"", quantity:"1", price:"", discount:"0", gst:"12", costPrice:"" });

  const calcItemAmt = it => {
    const p=parseFloat(it.price)||0, q=parseFloat(it.quantity)||0, d=parseFloat(it.discount)||0, g=parseFloat(it.gst)||0;
    return p*q*(1-d/100)*(1+g/100);
  };
  const calcSubtotal = its => its.reduce((s,it)=>s+calcItemAmt(it),0);
  const calcOverallDisc = (sub,disc) => sub*(parseFloat(disc)||0)/100;
  const calcTotal = (its,disc,addOn) => {
    const sub=calcSubtotal(its); return sub - calcOverallDisc(sub,disc) + (parseFloat(addOn)||0);
  };
  const calcProfit = (its,disc,addOn) => {
    const revenue = calcTotal(its,disc,addOn);
    const cost = its.reduce((s,it)=>{const cp=parseFloat(it.costPrice||0),q=parseFloat(it.quantity||0);return s+cp*q;},0);
    return revenue - cost;
  };

  const openAdd = () => { setForm(f0); setItems([emptyItem()]); setModal("add"); };

  const handleMedSelect = (m, idx) => {
    setItems(prev=>prev.map((x,j)=>j===idx?{
      ...x, medicineName:m.medicineName, genericName:m.genericName||"",
      price:m.sellingPrice||"", costPrice:m.purchasePrice||"", gst:m.gstPercent||"12",
    }:x));
  };

  const saveFn = () => {
    if (!form.customerName) return alert("Customer name required.");
    const total = calcTotal(items, form.overallDiscount, form.addOnCharges);
    const profit = calcProfit(items, form.overallDiscount, form.addOnCharges);
    const inv = {
      ...form, invoiceNumber:form.invoiceNumber||genId("INV",billing),
      items, totalAmount:total.toFixed(2), profit:profit.toFixed(2), createdAt:new Date().toISOString()
    };
    if (modal==="add") {
      setBilling(prev=>[inv,...prev]);
      items.forEach(it=>{ if(it.medicineName&&it.quantity) setInventory(prev=>prev.map(m=>m.medicineName.toLowerCase()===it.medicineName.toLowerCase()?{...m,quantity:String(Math.max(0,+m.quantity-+it.quantity))}:m)); });
    } else setBilling(prev=>prev.map(x=>x.invoiceNumber===inv.invoiceNumber?inv:x));
    setModal(null);
  };

  const printInvoice = (inv) => {
    const stored = JSON.parse(localStorage.getItem("pharmacyUser")||"{}");
    const ph = {
      ...stored,
      logoUrl:    localStorage.getItem("ph_logo_url")||"",
      brandColor: localStorage.getItem("ph_brand_color")||stored.brandColor||"#059669",
      email:      stored.email||"",
    };
    printInvoiceDoc(buildInvoiceHTML(inv, ph));
  };

  const tabs = ["all","Cash","UPI","Card","NetBanking","Credit"];
  const filtered = billing.filter(b=>filter==="all"||b.paymentMode===filter).filter(b=>!search||b.customerName?.toLowerCase().includes(search.toLowerCase())||b.invoiceNumber?.toLowerCase().includes(search.toLowerCase())||b.doctorName?.toLowerCase().includes(search.toLowerCase()));
  const counts = tabs.reduce((a,s)=>({...a,[s]:s==="all"?billing.length:billing.filter(b=>b.paymentMode===s).length}),{});
  const todayRev = billing.filter(b=>b.date===today()).reduce((a,b)=>a+(parseFloat(b.totalAmount)||0),0);
  const totalProfit = billing.reduce((a,b)=>a+(parseFloat(b.profit)||0),0);

  const printAllInvoices = () => {
    const pharmacyName = JSON.parse(localStorage.getItem("pharmacyUser")||"{}").facilityName||"Pharmacy";
    const html = `
      <div class="header"><div class="logo">Sales Report</div><div style="font-size:12px;color:#64748b">${today()} — ${pharmacyName}</div></div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value" style="color:#059669">${fmtAmt(billing.reduce((a,b)=>a+(parseFloat(b.totalAmount)||0),0))}</div></div>
        <div class="stat-card"><div class="stat-label">Total Profit</div><div class="stat-value" style="color:${totalProfit>=0?"#059669":"#dc2626"}">${fmtAmt(totalProfit)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Invoices</div><div class="stat-value">${billing.length}</div></div>
        <div class="stat-card"><div class="stat-label">Today Revenue</div><div class="stat-value">${fmtAmt(todayRev)}</div></div>
      </div>
      <table><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Doctor</th><th>Payment</th><th>Total</th><th>Profit</th></tr></thead><tbody>
      ${filtered.map(b=>`<tr><td>${b.invoiceNumber}</td><td>${b.date}</td><td>${b.customerName||"Walk-in"}</td><td>${b.doctorName||"—"}</td><td>${b.paymentMode}</td><td>₹${(+b.totalAmount||0).toFixed(2)}</td><td style="color:${(+b.profit||0)>=0?"#059669":"#dc2626"}">₹${(+b.profit||0).toFixed(2)}</td></tr>`).join("")}
      </tbody></table>`;
    printHTML(html,"Sales Report");
  };

  return (
    <>
      <PageHeader T={T} title="Sales & Billing" subtitle="Invoice management & GST billing"
        action={<>
          <Btn T={T} label="Print Report" variant="secondary" small icon="🖨" onClick={printAllInvoices}/>
          <Btn T={T} label="New Sale" icon="+" onClick={openAdd}/>
        </>}/>

      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(5,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Today Revenue" value={fmtAmt(todayRev)} color={T.accent}/>
        <StatCard T={T} label="Total Invoices" value={billing.length} color={T.blue}/>
        <StatCard T={T} label="Total Profit" value={fmtAmt(totalProfit)} color={totalProfit>=0?T.success:T.danger}/>
        <StatCard T={T} label="Cash Sales" value={billing.filter(b=>b.paymentMode==="Cash").length} color={T.success}/>
        <StatCard T={T} label="Digital Sales" value={billing.filter(b=>b.paymentMode!=="Cash").length} color={T.purple}/>
      </div>

      <div style={{...card(T,{padding:"16px"})}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:mob?"flex-start":"center",flexDirection:mob?"column":"row",marginBottom:14,gap:10}}>
          <FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/>
          <SearchInput value={search} onChange={setSearch} placeholder="Search customer, invoice, doctor…" T={T}/>
        </div>
        <DataTable T={T}
          headers={["Invoice","Date","Customer","Doctor","Items","Payment","Total","Profit"]}
          rows={filtered.map(b=>({raw:b,cells:[
            <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:12}}>{b.invoiceNumber}</span>,
            b.date,
            <div style={{fontWeight:700}}>{b.customerName||"Walk-in"}</div>,
            b.doctorName||"—",
            <span style={{fontSize:12,color:T.muted}}>{b.items?.length||0} items</span>,
            <StatusBadge status={b.paymentMode||"Cash"} T={T}/>,
            <strong style={{color:T.accent}}>{fmtAmt(parseFloat(b.totalAmount)||0)}</strong>,
            <span style={{fontWeight:700,color:(+b.profit||0)>=0?T.success:T.danger}}>{fmtAmt(parseFloat(b.profit)||0)}</span>,
          ]}))}
          extraActions={(b)=>(
            <div style={{display:"flex",gap:4}}>
              <Btn T={T} label="🖨" variant="ghost" small onClick={()=>printInvoice(b)}/>
              <Btn T={T} label="Edit" variant="secondary" small onClick={()=>{setForm({...b});setItems(b.items||[]);setModal("edit");}}/>
              <Btn T={T} label="Del" variant="danger" small onClick={()=>setConfirm(b)}/>
            </div>
          )}
        />
      </div>

      {modal && (
        <Modal title={modal==="add"?"New Sale Invoice":"Edit Invoice"} onClose={()=>setModal(null)} T={T} full>
          {/* Customer & Doctor */}
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:"0 20px",marginBottom:4}}>
            <FInput T={T} label="Customer Name" value={form.customerName||""} onChange={v=>setForm(f=>({...f,customerName:v}))} required placeholder="Walk-in or customer name"/>
            <FInput T={T} label="Doctor Name" value={form.doctorName||""} onChange={v=>setForm(f=>({...f,doctorName:v}))} placeholder="Prescribing doctor"/>
            <FInput T={T} label="Prescription No." value={form.prescriptionNumber||""} onChange={v=>setForm(f=>({...f,prescriptionNumber:v}))}/>
            <FInput T={T} label="Date" value={form.date||""} onChange={v=>setForm(f=>({...f,date:v}))} type="date"/>
            <FInput T={T} label="Payment Mode" value={form.paymentMode||""} onChange={v=>setForm(f=>({...f,paymentMode:v}))} options={PAYMENT_MODES}/>
            {form.paymentMode==="UPI" && <FInput T={T} label="UPI ID / Transaction Ref." value={form.upiId||""} onChange={v=>setForm(f=>({...f,upiId:v}))} placeholder="name@upi or ref no."/>}
            {form.paymentMode==="Card" && <>
              <FInput T={T} label="Card Type" value={form.cardType||""} onChange={v=>setForm(f=>({...f,cardType:v}))} options={CARD_TYPES}/>
              <FInput T={T} label="Last 4 Digits" value={form.cardLast4||""} onChange={v=>setForm(f=>({...f,cardLast4:v.slice(0,4)}))} placeholder="XXXX" type="number"/>
            </>}
            {(form.paymentMode==="NetBanking"||form.paymentMode==="Credit") && <FInput T={T} label="Bank Name" value={form.bankName||""} onChange={v=>setForm(f=>({...f,bankName:v}))} placeholder="Bank name"/>}
          </div>

          {/* Medicine Items */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:800,color:T.accent,textTransform:"uppercase",letterSpacing:".1em"}}>Medicine Items</div>
              <Btn T={T} label="+ Add Medicine" variant="ghost" small onClick={()=>setItems(i=>[...i,emptyItem()])}/>
            </div>
            {items.map((it,i)=>(
              <div key={i} style={{marginBottom:10,padding:"12px 14px",background:T.surface2,borderRadius:12,border:`1px solid ${T.border}`}}>
                <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"3fr 1fr 1fr 1fr 1fr 1fr auto",gap:"0 10px",alignItems:"start"}}>
                  <MedAutoComplete T={T} label={i===0?"Medicine Name":""} value={it.medicineName} onChange={v=>setItems(a=>a.map((x,j)=>j===i?{...x,medicineName:v}:x))} inventory={inventory} onSelect={m=>handleMedSelect(m,i)} required={i===0}/>
                  <FInput T={T} label={i===0?"Qty":""} value={it.quantity} onChange={v=>setItems(a=>a.map((x,j)=>j===i?{...x,quantity:v}:x))} type="number"/>
                  <FInput T={T} label={i===0?"MRP ₹":""} value={it.price} onChange={v=>setItems(a=>a.map((x,j)=>j===i?{...x,price:v}:x))} type="number"/>
                  <FInput T={T} label={i===0?"Disc %":""} value={it.discount} onChange={v=>setItems(a=>a.map((x,j)=>j===i?{...x,discount:v}:x))} type="number"/>
                  <FInput T={T} label={i===0?"GST %":""} value={it.gst} onChange={v=>setItems(a=>a.map((x,j)=>j===i?{...x,gst:v}:x))} options={["0","5","12","18","28"]}/>
                  <FInput T={T} label={i===0?"Cost ₹":""} value={it.costPrice||""} onChange={v=>setItems(a=>a.map((x,j)=>j===i?{...x,costPrice:v}:x))} type="number" placeholder="0"/>
                  <div style={{display:"flex",alignItems:i===0?"flex-end":"center",paddingBottom:14}}>
                    {items.length>1&&<Btn T={T} label="✕" variant="danger" small onClick={()=>setItems(a=>a.filter((_,j)=>j!==i))}/>}
                  </div>
                </div>
                {it.medicineName && it.price && it.quantity && (
                  <div style={{fontSize:12,color:T.muted,marginTop:4}}>
                    Item total: <strong style={{color:T.text}}>{fmtAmt(calcItemAmt(it))}</strong>
                    {it.costPrice && <span style={{marginLeft:12}}>Profit: <strong style={{color:(calcItemAmt(it)-+it.costPrice*+it.quantity)>=0?T.success:T.danger}}>{fmtAmt(calcItemAmt(it)-(+it.costPrice||0)*(+it.quantity||0))}</strong></span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:"0 20px",marginBottom:16}}>
            <FInput T={T} label="Overall Discount %" value={form.overallDiscount||"0"} onChange={v=>setForm(f=>({...f,overallDiscount:v}))} type="number" suffix="%"/>
            <FInput T={T} label="Add-on / Extra Charges" value={form.addOnCharges||"0"} onChange={v=>setForm(f=>({...f,addOnCharges:v}))} type="number" prefix="₹"/>
            <FInput T={T} label="Add-on Label" value={form.addOnLabel||""} onChange={v=>setForm(f=>({...f,addOnLabel:v}))} placeholder="e.g. Delivery, Consultation"/>
          </div>
          <FInput T={T} label="Notes / Instructions" value={form.notes||""} onChange={v=>setForm(f=>({...f,notes:v}))} placeholder="Any special instructions…"/>

          {/* Summary Box */}
          <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",marginBottom:18}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 20px",fontSize:13}}>
              <div style={{color:T.muted}}>Subtotal</div><div style={{textAlign:"right",fontWeight:600}}>{fmtAmt(calcSubtotal(items))}</div>
              <div style={{color:T.muted}}>Discount ({form.overallDiscount||0}%)</div><div style={{textAlign:"right",fontWeight:600,color:T.danger}}>−{fmtAmt(calcOverallDisc(calcSubtotal(items),form.overallDiscount||0))}</div>
              {+form.addOnCharges>0&&<><div style={{color:T.muted}}>{form.addOnLabel||"Add-on"}</div><div style={{textAlign:"right",fontWeight:600,color:T.warn}}>+{fmtAmt(form.addOnCharges)}</div></>}
              <div style={{color:T.text,fontWeight:700,fontSize:15,borderTop:`1px solid ${T.border}`,paddingTop:8}}>Total</div>
              <div style={{textAlign:"right",fontWeight:800,fontSize:18,color:T.accent,borderTop:`1px solid ${T.border}`,paddingTop:8}}>{fmtAmt(calcTotal(items,form.overallDiscount,form.addOnCharges))}</div>
              <div style={{color:T.muted}}>Estimated Profit</div>
              <div style={{textAlign:"right",fontWeight:700,color:calcProfit(items,form.overallDiscount,form.addOnCharges)>=0?T.success:T.danger}}>
                {fmtAmt(calcProfit(items,form.overallDiscount,form.addOnCharges))}
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Create Invoice":"Save Changes"} onClick={saveFn}/>
          </div>
        </Modal>
      )}
      {confirm && <ConfirmModal T={T} message={`Delete invoice "${confirm.invoiceNumber}"?`} onConfirm={()=>{setBilling(p=>p.filter(x=>x.invoiceNumber!==confirm.invoiceNumber));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  SUPPLIER MANAGEMENT
function SupplierManagement({ suppliers, setSuppliers, T }) {
  const mob = useWindowWidth() < 640;
  const [search, setSearch] = useState(""); const [modal, setModal] = useState(null); const [confirm, setConfirm] = useState(null); const [form, setForm] = useState({});
  const f0 = { supplierId:"", supplierName:"", companyName:"", phone:"", alternatePhone:"", whatsappNumber:"", email:"", address:"", city:"", state:"", gstNumber:"", status:"Active" };
  const saveFn = () => {
    if (!form.supplierName||!form.phone) return alert("Supplier name and phone required.");
    const s = { ...form, supplierId:form.supplierId||genId("SUP",suppliers) };
    if (modal==="add") setSuppliers(prev=>[s,...prev]); else setSuppliers(prev=>prev.map(x=>x.supplierId===s.supplierId?s:x));
    setModal(null);
  };
  const filtered = suppliers.filter(s=>!search||s.supplierName?.toLowerCase().includes(search.toLowerCase())||s.companyName?.toLowerCase().includes(search.toLowerCase()));

  const printSuppliers = () => {
    const html = `<div class="header"><div class="logo">Supplier Directory</div><div style="font-size:12px;color:#64748b">${today()}</div></div>
    <table><thead><tr><th>ID</th><th>Name</th><th>Company</th><th>Phone</th><th>WhatsApp</th><th>City</th><th>GST</th><th>Status</th></tr></thead><tbody>
    ${filtered.map(s=>`<tr><td>${s.supplierId}</td><td>${s.supplierName}</td><td>${s.companyName||"—"}</td><td>${s.phone}</td><td>${s.whatsappNumber||"—"}</td><td>${s.city||"—"}</td><td>${s.gstNumber||"—"}</td><td>${s.status||"Active"}</td></tr>`).join("")}
    </tbody></table>`;
    printHTML(html,"Supplier Directory");
  };

  return (
    <>
      <PageHeader T={T} title="Supplier Management" subtitle={`${suppliers.length} suppliers`}
        action={<>
          <Btn T={T} label="Print" variant="secondary" small icon="🖨" onClick={printSuppliers}/>
          <Btn T={T} label="Add Supplier" icon="+" onClick={()=>{setForm(f0);setModal("add");}}/>
        </>}/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total Suppliers" value={suppliers.length} color={T.accent}/>
        <StatCard T={T} label="Active" value={suppliers.filter(s=>s.status==="Active").length} color={T.success}/>
        <StatCard T={T} label="States" value={[...new Set(suppliers.map(s=>s.state).filter(Boolean))].length} color={T.blue}/>
      </div>
      <div style={{...card(T,{padding:"16px"})}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><SearchInput value={search} onChange={setSearch} placeholder="Search supplier or company…" T={T}/></div>
        <DataTable T={T} headers={["ID","Name","Company","Phone","WhatsApp","Email","City","GST","Status"]}
          rows={filtered.map(s=>({raw:s,cells:[
            <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:12}}>{s.supplierId}</span>,
            <div style={{fontWeight:700}}>{s.supplierName}</div>,
            s.companyName||"—", s.phone,
            s.whatsappNumber?<a href={`https://wa.me/91${s.whatsappNumber}`} target="_blank" rel="noreferrer" style={{color:T.success,fontSize:12}}>💬 {s.whatsappNumber}</a>:"—",
            s.email||"—", s.city||"—", s.gstNumber||"—",
            <StatusBadge status={s.status||"Active"} T={T}/>,
          ]}))}
          onEdit={s=>{setForm({...s});setModal("edit");}} onDelete={s=>setConfirm(s)}
        />
      </div>
      {modal && (
        <Modal title={modal==="add"?"Add Supplier":"Edit Supplier"} onClose={()=>setModal(null)} T={T} wide>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 20px"}}>
            <FInput T={T} label="Supplier Name" value={form.supplierName||""} onChange={v=>setForm(f=>({...f,supplierName:v}))} required/>
            <FInput T={T} label="Company Name" value={form.companyName||""} onChange={v=>setForm(f=>({...f,companyName:v}))}/>
            <FInput T={T} label="Phone" value={form.phone||""} onChange={v=>setForm(f=>({...f,phone:v}))} required/>
            <FInput T={T} label="Alternate Phone" value={form.alternatePhone||""} onChange={v=>setForm(f=>({...f,alternatePhone:v}))}/>
            <FInput T={T} label="WhatsApp Number" value={form.whatsappNumber||""} onChange={v=>setForm(f=>({...f,whatsappNumber:v}))} placeholder="10-digit mobile"/>
            <FInput T={T} label="Email" value={form.email||""} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/>
            <FInput T={T} label="GST Number" value={form.gstNumber||""} onChange={v=>setForm(f=>({...f,gstNumber:v}))}/>
            <FInput T={T} label="Status" value={form.status||""} onChange={v=>setForm(f=>({...f,status:v}))} options={["Active","Inactive"]}/>
            <div style={{gridColumn:mob?"1":"1/-1"}}><FInput T={T} label="Address" value={form.address||""} onChange={v=>setForm(f=>({...f,address:v}))}/></div>
            <FInput T={T} label="City" value={form.city||""} onChange={v=>setForm(f=>({...f,city:v}))}/>
            <FInput T={T} label="State" value={form.state||""} onChange={v=>setForm(f=>({...f,state:v}))} options={INDIAN_STATES}/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Add Supplier":"Save Changes"} onClick={saveFn}/>
          </div>
        </Modal>
      )}
      {confirm && <ConfirmModal T={T} message={`Remove "${confirm.supplierName}"?`} onConfirm={()=>{setSuppliers(p=>p.filter(x=>x.supplierId!==confirm.supplierId));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  PURCHASE ORDERS (with inventory merge)
function PurchaseOrders({ T, setInventory }) {
  const mob = useWindowWidth() < 640;
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState("all");
  const [mergeConfirm, setMergeConfirm] = useState(null);

  useEffect(()=>{
    (async()=>{
      try { const data = await apiFetch("/api/orders/my-orders"); setOrders(data.orders||[]); }
      catch(e) { console.warn("Orders fetch failed:", e.message); }
      finally { setLoading(false); }
    })();
  },[]);

  const mergeToInventory = (order) => {
    const items = order.items||[];
    let merged = 0;
    setInventory(prev=>{
      const updated = [...prev];
      items.forEach(item=>{
        const idx = updated.findIndex(m=>
          m.medicineName?.toLowerCase()===item.name?.toLowerCase() ||
          m.medicineId===item.productId
        );
        if(idx>=0) {
          updated[idx]={ ...updated[idx], quantity:String(+updated[idx].quantity+(+item.quantity||0)) };
          merged++;
        } else {
          updated.unshift({
            medicineId: genId("MED",updated),
            medicineName: item.name||"Unknown",
            quantity: String(item.quantity||0),
            sellingPrice: item.price||"0",
            purchasePrice: item.price||"0",
            minStock: "10",
            category: "OTC",
            gstPercent: "12",
            brand: item.brand||"",
            batchNumber: item.batchNumber||"",
          });
          merged++;
        }
      });
      // Immediately sync merged inventory to MongoDB
      saveSection("inventory", updated).catch(e=>console.warn("Inventory sync after merge failed:", e.message));
      return updated;
    });
    setOrders(prev=>prev.map(o=>o._id===order._id?{...o,mergedToInventory:true}:o));
    alert(`✓ Merged ${merged} items from order ${order.orderId||order._id?.slice(-8)} into inventory. Saved to MongoDB.`);
    setMergeConfirm(null);
  };

  const SC = { PLACED:{c:T.accent,bg:T.accentBg},CONFIRMED:{c:T.success,bg:T.successBg},PROCESSING:{c:T.purple,bg:T.purpleBg},SHIPPED:{c:T.accent,bg:T.accentBg},OUT_FOR_DELIVERY:{c:T.warn,bg:T.warnBg},DELIVERED:{c:T.success,bg:T.successBg},CANCELLED:{c:T.danger,bg:T.dangerBg} };
  const SPill = ({status})=>{ const s=SC[status]||{c:T.muted,bg:T.surface2}; return <span style={{background:s.bg,color:s.c,border:`1px solid ${s.c}`,borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{status?.replace(/_/g," ")}</span>; };

  const tabs = ["all","PLACED","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"];
  const filtered = orders.filter(o=>filter==="all"||o.orderStatus===filter).filter(o=>!search||o.orderId?.toLowerCase().includes(search.toLowerCase())||o.items?.some(i=>i.name?.toLowerCase().includes(search.toLowerCase())));
  const counts = tabs.reduce((a,s)=>({...a,[s]:s==="all"?orders.length:orders.filter(o=>o.orderStatus===s).length}),{});
  const totalSpend = orders.filter(o=>o.orderStatus==="DELIVERED").reduce((a,o)=>a+(o.totalAmount||0),0);

  if(loading) return <div style={{display:"flex",justifyContent:"center",padding:"60px 0",color:T.muted}}><div style={{width:36,height:36,borderRadius:"50%",border:`4px solid ${T.border}`,borderTopColor:T.accent,animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <>
      <PageHeader T={T} title="Purchase Orders" subtitle="Orders from BioBurg platform · Merge delivered orders to inventory"/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total Orders" value={orders.length} color={T.accent}/>
        <StatCard T={T} label="Delivered" value={orders.filter(o=>o.orderStatus==="DELIVERED").length} color={T.success}/>
        <StatCard T={T} label="In Progress" value={orders.filter(o=>["PLACED","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY"].includes(o.orderStatus)).length} color={T.purple}/>
        <StatCard T={T} label="Total Spent" value={fmtAmt(totalSpend)} color={T.warn}/>
      </div>
      <div style={{...card(T,{padding:"16px"})}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:mob?"flex-start":"center",flexDirection:mob?"column":"row",marginBottom:14,gap:10}}>
          <FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/>
          <SearchInput value={search} onChange={setSearch} placeholder="Search order ID, item…" T={T}/>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700,fontSize:13}}>
            <thead><tr style={{background:T.surface2,borderBottom:`2px solid ${T.border}`}}>
              {["Order ID","Date","Items","Amount","Payment","Status","Actions"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10.5,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:"48px",color:T.muted,fontSize:13}}>{orders.length===0?"No orders placed yet.":"No orders match filter."}</td></tr>}
              {filtered.map((o,i)=>(
                <tr key={o._id} style={{borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background=T.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"12px 14px"}}><span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:12}}>{o.orderId||o._id?.slice(-8).toUpperCase()}</span></td>
                  <td style={{padding:"12px 14px",color:T.muted,fontSize:12,whiteSpace:"nowrap"}}>{o.createdAt?new Date(o.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}</td>
                  <td style={{padding:"12px 14px"}}><div style={{maxWidth:180}}>{(o.items||[]).slice(0,2).map((item,j)=><div key={j} style={{fontSize:12,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name||"Item"} × {item.quantity}</div>)}{(o.items?.length||0)>2&&<div style={{fontSize:11,color:T.muted}}>+{o.items.length-2} more</div>}</div></td>
                  <td style={{padding:"12px 14px"}}><strong style={{color:T.success}}>{fmtAmt(o.totalAmount||0)}</strong></td>
                  <td style={{padding:"12px 14px"}}><span style={{fontSize:12,background:o.paymentMode==="ONLINE"?T.accentBg:T.surface2,color:o.paymentMode==="ONLINE"?T.accent:T.muted,border:`1px solid ${o.paymentMode==="ONLINE"?T.accent:T.border}`,borderRadius:6,padding:"2px 8px",fontWeight:600}}>{o.paymentMode||"—"}</span></td>
                  <td style={{padding:"12px 14px"}}><SPill status={o.orderStatus}/></td>
                  <td style={{padding:"12px 14px"}}>
                    {o.orderStatus==="DELIVERED"&&!o.mergedToInventory&&(
                      <Btn T={T} label="→ Inventory" variant="ghost" small onClick={()=>setMergeConfirm(o)}/>
                    )}
                    {o.mergedToInventory&&<span style={{fontSize:11,color:T.success,fontWeight:600}}>✓ Merged</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {mergeConfirm && <ConfirmModal T={T} message={`Merge ${mergeConfirm.items?.length||0} items from order "${mergeConfirm.orderId||mergeConfirm._id?.slice(-8)}" into your inventory stock?`} onConfirm={()=>mergeToInventory(mergeConfirm)} onClose={()=>setMergeConfirm(null)}/>}
    </>
  );
}

//  CUSTOMER MANAGEMENT
function CustomerManagement({ customers, setCustomers, billing, T }) {
  const mob = useWindowWidth() < 640;
  const [search, setSearch] = useState(""); const [modal, setModal] = useState(null); const [confirm, setConfirm] = useState(null); const [form, setForm] = useState({});
  const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
  const f0 = { customerId:"", name:"", phone:"", alternatePhone:"", whatsappNumber:"", email:"", address:"", dob:"", gender:"", bloodGroup:"", age:"", department:"", status:"OPD", referredBy:"", insurance:"", notes:"" };
  const saveFn = () => {
    if (!form.name||!form.phone) return alert("Name and phone required.");
    const c = { ...form, customerId:form.customerId||genId("CUS",customers), joinedDate:form.joinedDate||today() };
    if (modal==="add") setCustomers(prev=>[c,...prev]); else setCustomers(prev=>prev.map(x=>x.customerId===c.customerId?c:x));
    setModal(null);
  };
  const filtered = customers.filter(c=>!search||c.name?.toLowerCase().includes(search.toLowerCase())||c.phone?.includes(search)||c.customerId?.toLowerCase().includes(search.toLowerCase()));

  // Print patient token card (like image 3 - professional card)
  const printTokenCard = (c) => {
    const ph = {
      ...JSON.parse(localStorage.getItem("pharmacyUser")||"{}"),
      logoUrl: localStorage.getItem("ph_logo_url")||"",
    };
    const visits = billing.filter(b=>b.customerName===c.name).length;
    const logoHtml = ph.logoUrl
      ? `<img src="${ph.logoUrl}" style="height:48px;object-fit:contain;" alt="logo"/>`
      : `<div style="font-size:22px;font-weight:900;color:#059669">${ph.facilityName||"Pharmacy"}</div>`;
    const html = `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:18px">
        <div>${logoHtml}<div style="font-size:11px;color:#64748b;margin-top:4px">${ph.address||""} | ${ph.phone||""}</div></div>
        <div style="text-align:right">
          <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700">Patient — ${c.name}</div>
          <div style="font-size:10px;color:#94a3b8">Printed: ${new Date().toLocaleString("en-IN")}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">PATIENT ID</div><div style="font-weight:400;font-size:10px">${c.customerId}</div></div>
        <div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">NAME</div><div style="font-weight:400;font-size:10px">${c.name}</div></div>
        <div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">AGE</div><div style="font-weight:400;font-size:10px">${c.age||"—"}</div></div>
        <div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">GENDER</div><div style="font-weight:400;font-size:10px">${c.gender||"—"}</div></div>
        <div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">BLOOD GROUP</div><div style="font-weight:400;font-size:10px">${c.bloodGroup||"—"}</div></div>
        <div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">PHONE</div><div style="font-weight:400;font-size:10px">${c.phone}</div></div>
        <div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">DEPARTMENT</div><div style="font-weight:400;font-size:10px">${c.department||"General Medicine"}</div></div>
        <div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">STATUS</div><div style="font-weight:400;font-size:14px">${c.status||"OPD"}</div></div>
        ${c.referredBy?`<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">REFERRED BY</div><div style="font-weight:400;font-size:10px">${c.referredBy}</div></div>`:""}
        ${c.insurance?`<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">INSURANCE</div><div style="font-weight:400;font-size:10px">${c.insurance}</div></div>`:""}
        <div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">TOTAL VISITS</div><div style="font-weight:400;font-size:10px">${visits}</div></div>
        <div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">REGISTERED</div><div style="font-weight:400;font-size:10px">${c.joinedDate||"—"}</div></div>
      </div>
      ${c.notes?`<div style="margin-top:16px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:11px;color:#64748b">Notes: ${c.notes}</div>`:""}
      <div style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:10px;font-size:10px;color:#94a3b8;text-align:center">This is a computer-generated document. · ${ph.facilityName} — ${new Date().getFullYear()}</div>
    </div>`;
    printHTML(html, `Patient Receipt — ${c.name}`);
  };

  const printCustomers = () => {
    const html = `<div class="header"><div class="logo">Patient Directory</div><div style="font-size:12px;color:#64748b">${today()}</div></div>
    <table><thead><tr><th>ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Blood Group</th><th>Phone</th><th>Department</th><th>Status</th><th>Visits</th></tr></thead><tbody>
    ${filtered.map(c=>`<tr><td>${c.customerId}</td><td>${c.name}</td><td>${c.age||"—"}</td><td>${c.gender||"—"}</td><td>${c.bloodGroup||"—"}</td><td>${c.phone}</td><td>${c.department||"—"}</td><td>${c.status||"—"}</td><td>${billing.filter(b=>b.customerName===c.name).length}</td></tr>`).join("")}
    </tbody></table>`;
    printHTML(html,"Patient Directory");
  };

  return (
    <>
      <PageHeader T={T} title="Patient / Customer Management" subtitle={`${customers.length} patients registered`}
        action={<>
          <Btn T={T} label="Print All" variant="secondary" small icon="🖨" onClick={printCustomers}/>
          <Btn T={T} label="Add Patient" icon="+" onClick={()=>{setForm(f0);setModal("add");}}/>
        </>}/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total Patients" value={customers.length} color={T.accent}/>
        <StatCard T={T} label="With Purchases" value={customers.filter(c=>billing.some(b=>b.customerName===c.name)).length} color={T.success}/>
        <StatCard T={T} label="Regular (3+)" value={customers.filter(c=>billing.filter(b=>b.customerName===c.name).length>=3).length} color={T.blue}/>
        <StatCard T={T} label="OPD" value={customers.filter(c=>c.status==="OPD").length} color={T.purple}/>
      </div>
      <div style={{...card(T,{padding:"16px"})}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><SearchInput value={search} onChange={setSearch} placeholder="Search name, phone, ID…" T={T}/></div>
        <DataTable T={T} headers={["Patient ID","Name","Age","Gender","Blood","Phone","Department","Status","Visits"]}
          rows={filtered.map(c=>({raw:c,cells:[
            <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:12}}>{c.customerId}</span>,
            <div><div style={{fontWeight:700}}>{c.name}</div><div style={{fontSize:10,color:T.muted}}>{c.whatsappNumber?`💬 ${c.whatsappNumber}`:c.email||""}</div></div>,
            c.age||"—",
            c.gender||"—",
            c.bloodGroup?<span style={{fontWeight:700,color:T.danger}}>{c.bloodGroup}</span>:"—",
            c.phone,
            c.department||"—",
            <StatusBadge status={c.status||"OPD"} T={T}/>,
            <span style={{fontWeight:700,color:T.blue}}>{billing.filter(b=>b.customerName===c.name).length}</span>,
          ]}))}
          extraActions={(c)=>(
            <Btn T={T} label="Receipt" variant="ghost" small onClick={()=>printTokenCard(c)}/>
          )}
          onEdit={c=>{setForm({...c});setModal("edit");}} onDelete={c=>setConfirm(c)}
        />
      </div>
      {modal && (
        <Modal title={modal==="add"?"Add Patient":"Edit Patient"} onClose={()=>setModal(null)} T={T} extraWide>
          <div style={{marginBottom:14,fontSize:11,fontWeight:800,color:T.accent,textTransform:"uppercase",letterSpacing:".1em",paddingBottom:8,borderBottom:`2px solid ${T.accentBg}`}}>Personal Information</div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:"0 20px"}}>
            <FInput T={T} label="Full Name" value={form.name||""} onChange={v=>setForm(f=>({...f,name:v}))} required/>
            <FInput T={T} label="Age" value={form.age||""} onChange={v=>setForm(f=>({...f,age:v}))} type="number" placeholder="e.g. 35"/>
            <FInput T={T} label="Gender" value={form.gender||""} onChange={v=>setForm(f=>({...f,gender:v}))} options={["Male","Female","Other"]} allowOther/>
            <FInput T={T} label="Blood Group" value={form.bloodGroup||""} onChange={v=>setForm(f=>({...f,bloodGroup:v}))} options={BLOOD_GROUPS} allowOther/>
            <FInput T={T} label="Date of Birth" value={form.dob||""} onChange={v=>setForm(f=>({...f,dob:v}))} type="date"/>
            <FInput T={T} label="Status" value={form.status||""} onChange={v=>setForm(f=>({...f,status:v}))} options={["OPD","IPD","Emergency","Follow-up","Discharged"]} allowOther/>
          </div>
          <div style={{marginBottom:14,fontSize:11,fontWeight:800,color:T.blue,textTransform:"uppercase",letterSpacing:".1em",paddingBottom:8,borderBottom:`2px solid ${T.blueBg}`,marginTop:4}}>Contact Details</div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:"0 20px"}}>
            <FInput T={T} label="Phone" value={form.phone||""} onChange={v=>setForm(f=>({...f,phone:v}))} required/>
            <FInput T={T} label="Alternate Phone" value={form.alternatePhone||""} onChange={v=>setForm(f=>({...f,alternatePhone:v}))}/>
            <FInput T={T} label="WhatsApp Number" value={form.whatsappNumber||""} onChange={v=>setForm(f=>({...f,whatsappNumber:v}))} placeholder="10-digit"/>
            <FInput T={T} label="Email" value={form.email||""} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/>
            <div style={{gridColumn:mob?"1":"1/-1",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
              <FInput T={T} label="Address" value={form.address||""} onChange={v=>setForm(f=>({...f,address:v}))}/>
            </div>
          </div>
          <div style={{marginBottom:14,fontSize:11,fontWeight:800,color:T.purple,textTransform:"uppercase",letterSpacing:".1em",paddingBottom:8,borderBottom:`2px solid ${T.purpleBg}`,marginTop:4}}>Medical Details</div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:"0 20px"}}>
            <FInput T={T} label="Department" value={form.department||""} onChange={v=>setForm(f=>({...f,department:v}))} options={SPECIALIZATIONS} allowOther/>
            <FInput T={T} label="Referred By (Doctor)" value={form.referredBy||""} onChange={v=>setForm(f=>({...f,referredBy:v}))} placeholder="Dr. Name"/>
            <FInput T={T} label="Insurance / TPA" value={form.insurance||""} onChange={v=>setForm(f=>({...f,insurance:v}))} placeholder="e.g. Star Health, ESIC"/>
            <div style={{gridColumn:mob?"1":"1/-1"}}><FInput T={T} label="Notes / Medical History / Allergies" value={form.notes||""} onChange={v=>setForm(f=>({...f,notes:v}))} multiline rows={2}/></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Add Patient":"Save Changes"} onClick={saveFn}/>
          </div>
        </Modal>
      )}
      {confirm && <ConfirmModal T={T} message={`Remove "${confirm.name}"?`} onConfirm={()=>{setCustomers(p=>p.filter(x=>x.customerId!==confirm.customerId));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  EXPIRY ALERTS (6 months)
function ExpiryAlerts({ inventory, T }) {
  const [filter, setFilter] = useState("all");
  const mob = useWindowWidth()<640;
  const expItems = inventory.map(m=>({...m,dl:daysLeft(m.expiryDate)})).filter(m=>m.dl!==null).sort((a,b)=>a.dl-b.dl);
  const getCat = d => d<0?"Expired":d<=30?"≤30 days":d<=90?"≤90 days":d<=180?"≤6 months":"Safe";
  const tabs = ["all","Expired","≤30 days","≤90 days","≤6 months","Safe"];
  const filtered = expItems.filter(m=>filter==="all"||getCat(m.dl)===filter);
  const counts = tabs.reduce((a,s)=>({...a,[s]:s==="all"?expItems.length:expItems.filter(m=>getCat(m.dl)===s).length}),{});

  const printExpiry = () => {
    const html = `<div class="header"><div class="logo">⚠ Expiry Alert Report</div><div style="font-size:12px;color:#64748b">${today()}</div></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">Expired</div><div class="stat-value" style="color:#dc2626">${expItems.filter(m=>m.dl<0).length}</div></div>
      <div class="stat-card"><div class="stat-label">≤30 Days</div><div class="stat-value" style="color:#dc2626">${expItems.filter(m=>m.dl>=0&&m.dl<=30).length}</div></div>
      <div class="stat-card"><div class="stat-label">≤90 Days</div><div class="stat-value" style="color:#d97706">${expItems.filter(m=>m.dl>=0&&m.dl<=90).length}</div></div>
      <div class="stat-card"><div class="stat-label">≤6 Months</div><div class="stat-value" style="color:#2563eb">${expItems.filter(m=>m.dl>=0&&m.dl<=180).length}</div></div>
    </div>
    <table><thead><tr><th>Medicine</th><th>Generic</th><th>Category</th><th>Batch</th><th>Expiry</th><th>Days Left</th><th>Stock</th></tr></thead><tbody>
    ${filtered.map(m=>{const d=m.dl;return `<tr><td><b>${m.medicineName}</b></td><td>${m.genericName||"—"}</td><td>${m.category}</td><td>${m.batchNumber||"—"}</td><td>${fmtDate(m.expiryDate)}</td><td style="color:${d<0?"#dc2626":d<=30?"#dc2626":d<=90?"#d97706":"#2563eb"}">${d<0?`${Math.abs(d)}d ago`:d===0?"Today!":`${d} days`}</td><td>${m.quantity}</td></tr>`;}).join("")}
    </tbody></table>`;
    printHTML(html,"Expiry Alert Report");
  };

  return (
    <>
      <PageHeader T={T} title="Expiry & Stock Alerts" subtitle="Monitor medicine expiry up to 6 months"
        action={<Btn T={T} label="Print Report" variant="secondary" small icon="🖨" onClick={printExpiry}/>}/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(5,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Expired" value={expItems.filter(m=>m.dl<0).length} color={T.danger}/>
        <StatCard T={T} label="≤30 days" value={expItems.filter(m=>m.dl>=0&&m.dl<=30).length} color={T.danger}/>
        <StatCard T={T} label="≤90 days" value={expItems.filter(m=>m.dl>=0&&m.dl<=90).length} color={T.warn}/>
        <StatCard T={T} label="≤6 months" value={expItems.filter(m=>m.dl>=0&&m.dl<=180).length} color={T.blue}/>
        <StatCard T={T} label="Out of Stock" value={inventory.filter(m=>+m.quantity===0).length} color={T.danger}/>
      </div>
      <div style={{...card(T,{padding:"16px"})}}>
        <div style={{marginBottom:14}}><FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/></div>
        <DataTable T={T} headers={["Medicine","Generic","Category","Batch","Expiry","Days Left","Stock","Status"]}
          rows={filtered.map(m=>{const d=m.dl; const clr=d<0?T.danger:d<=30?T.danger:d<=90?T.warn:d<=180?T.blue:T.success; return {raw:m,cells:[
            <div style={{fontWeight:700}}>{m.medicineName}</div>,
            <span style={{color:T.muted,fontSize:12}}>{m.genericName||"—"}</span>,
            <span style={{fontSize:12,background:T.blueBg,color:T.blue,borderRadius:6,padding:"2px 8px"}}>{m.category}</span>,
            m.batchNumber||"—", fmtDate(m.expiryDate),
            <span style={{fontWeight:700,color:clr,background:clr+"22",borderRadius:8,padding:"3px 10px",fontSize:12}}>
              {d<0?`${Math.abs(d)}d ago`:d===0?"Today!":`${d} days`}
            </span>,
            <span style={{fontWeight:700,color:+m.quantity===0?T.danger:T.text}}>{m.quantity}</span>,
            <StatusBadge status={d<0?"Expired":d<=180?"Expiring":"Safe"} T={T}/>,
          ]};})
          }
        />
      </div>
    </>
  );
}

// ── Reusable Panel wrapper with print/share header ────────────────────────────
function ReportPanel({ title, T, onPrint, children, color }) {
  return (
    <div style={{...card(T,{padding:0,overflow:"hidden"})}}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,background:T.surface2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontWeight:700,fontSize:13,color:color||T.accent,textTransform:"uppercase",letterSpacing:"0.06em"}}>{title}</span>
        {onPrint && (
          <div style={{display:"flex",gap:6}}>
            <button onClick={onPrint} title="Print this panel"
              style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${T.border2}`,background:T.surface,color:T.muted,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit"}}>
              🖨 Print
            </button>
            <button onClick={()=>{
              const text=document.getElementById(`panel-${title.replace(/\s/g,"-")}`)?.innerText||"";
              if(navigator.clipboard) navigator.clipboard.writeText(text).then(()=>alert("Copied to clipboard!"));
            }} title="Copy panel text"
              style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${T.border2}`,background:T.surface,color:T.muted,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit"}}>
              Copy
            </button>
          </div>
        )}
      </div>
      <div id={`panel-${title.replace(/\s/g,"-")}`} style={{padding:"16px 18px"}}>{children}</div>
    </div>
  );
}

//  REPORTS 
function Reports({ billing, inventory, purchases, suppliers, customers, T }) {
  const mob = useWindowWidth()<640;

  // ── Date range state 
  const todayISO = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(); firstOfMonth.setDate(1);
  const firstISO = firstOfMonth.toISOString().split("T")[0];

  const [rangeMode, setRangeMode]   = useState("month"); // quick|custom
  const [dateFrom, setDateFrom]     = useState(firstISO);
  const [dateTo,   setDateTo]       = useState(todayISO);
  const [appliedFrom, setAppliedFrom] = useState(firstISO);
  const [appliedTo,   setAppliedTo]   = useState(todayISO);
  const [showCalendar, setShowCalendar] = useState(false);

  // Quick range presets
  const applyPreset = (mode) => {
    setRangeMode(mode);
    const now = new Date();
    let from = new Date();
    if(mode==="today")   { from = new Date(now.toDateString()); }
    else if(mode==="week")  { from.setDate(now.getDate()-6); }
    else if(mode==="month") { from.setDate(1); }
    else if(mode==="quarter"){ from.setMonth(now.getMonth()-2); from.setDate(1); }
    else if(mode==="year")  { from = new Date(now.getFullYear(),0,1); }
    const f = from.toISOString().split("T")[0];
    const t = now.toISOString().split("T")[0];
    setDateFrom(f); setDateTo(t); setAppliedFrom(f); setAppliedTo(t);
  };

  const applyCustom = () => {
    setAppliedFrom(dateFrom); setAppliedTo(dateTo);
    setRangeMode("custom"); setShowCalendar(false);
  };

  // ── Filter billing by date range 
  const inRange = (b) => {
    try {
      const d = new Date(b.createdAt || b.date);
      const from = new Date(appliedFrom); from.setHours(0,0,0,0);
      const to   = new Date(appliedTo);   to.setHours(23,59,59,999);
      return d >= from && d <= to;
    } catch { return false; }
  };
  const salesData = billing.filter(inRange);

  // ── Metrics 
  const totalRevenue   = billing.reduce((a,b)=>a+(parseFloat(b.totalAmount)||0),0);
  const totalCost      = billing.reduce((a,b)=>a+(b.items||[]).reduce((s,it)=>s+(parseFloat(it.costPrice||0))*(parseFloat(it.quantity||0)),0),0);
  const totalProfit    = totalRevenue - totalCost;
  const totalPurchase  = purchases.reduce((a,p)=>a+(parseFloat(p.totalAmount)||0),0);
  const gstCollected   = billing.reduce((a,b)=>a+(b.items||[]).reduce((s,it)=>{const base=(parseFloat(it.price)||0)*(parseFloat(it.quantity)||0)*(1-(parseFloat(it.discount)||0)/100);return s+base*(parseFloat(it.gst||0)/100);},0),0);

  const rangeRevenue  = salesData.reduce((a,b)=>a+(parseFloat(b.totalAmount)||0),0);
  const rangeCost     = salesData.reduce((a,b)=>a+(b.items||[]).reduce((s,it)=>s+(parseFloat(it.costPrice||0))*(parseFloat(it.quantity||0)),0),0);
  const rangeProfit   = rangeRevenue - rangeCost;
  const rangeGst      = salesData.reduce((a,b)=>a+(b.items||[]).reduce((s,it)=>{const base=(parseFloat(it.price)||0)*(parseFloat(it.quantity)||0)*(1-(parseFloat(it.discount)||0)/100);return s+base*(parseFloat(it.gst||0)/100);},0),0);
  const uniquePatients= [...new Set(salesData.map(b=>b.customerName).filter(Boolean))].length;
  const walkIns       = salesData.filter(b=>!b.customerName||b.customerName==="Walk-in").length;
  const newPatients   = salesData.filter(b=>{
    const name = b.customerName; if(!name||name==="Walk-in") return false;
    const firstBill = [...billing].sort((a,c)=>new Date(a.createdAt||0)-new Date(c.createdAt||0)).find(x=>x.customerName===name);
    return firstBill && inRange(firstBill);
  }).length;
  const repeatPatients = uniquePatients - newPatients;
  const avgSale  = salesData.length>0 ? rangeRevenue/salesData.length : 0;

  // Top medicines in range
  const medSales = {}; salesData.forEach(b=>(b.items||[]).forEach(it=>{if(it.medicineName){medSales[it.medicineName]=(medSales[it.medicineName]||0)+(parseFloat(it.quantity)||0);}}));
  const topMeds = Object.entries(medSales).sort((a,b)=>b[1]-a[1]).slice(0,8);

  // Top customers in range
  const custSales = {}; salesData.forEach(b=>{const n=b.customerName||"Walk-in"; custSales[n]=(custSales[n]||0)+(parseFloat(b.totalAmount)||0);});
  const topCusts = Object.entries(custSales).sort((a,b)=>b[1]-a[1]).slice(0,6);

  const catBreak  = inventory.reduce((a,m)=>{a[m.category]=(a[m.category]||0)+1;return a;},{});
  const topCats   = Object.entries(catBreak).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const COLORS    = [T.accent,T.blue,T.purple,T.warn,T.danger,T.success];
  const payBreak  = salesData.reduce((a,b)=>{const m=b.paymentMode||"Cash";a[m]=a[m]||{count:0,amount:0};a[m].count++;a[m].amount+=parseFloat(b.totalAmount)||0;return a;},{});

  const fmtRangeLabel = () => {
    if(rangeMode==="today") return "Today";
    if(rangeMode==="week")  return "Last 7 Days";
    if(rangeMode==="month") return "This Month";
    if(rangeMode==="quarter") return "This Quarter";
    if(rangeMode==="year")  return "This Year";
    return `${appliedFrom} → ${appliedTo}`;
  };

  // ── Print helpers 
  const ph = JSON.parse(localStorage.getItem("pharmacyUser")||"{}");

  const printFull = () => {
    const html = `
      <div class="header">
        <div><div class="logo">${ph.facilityName||"Pharmacy"} — Report</div>
        <div style="font-size:12px;color:#64748b">Period: ${fmtRangeLabel()} · Generated: ${new Date().toLocaleString("en-IN")}</div></div>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Revenue</div><div class="stat-value" style="color:#059669">${fmtAmt(rangeRevenue)}</div></div>
        <div class="stat-card"><div class="stat-label">Profit</div><div class="stat-value" style="color:${rangeProfit>=0?"#059669":"#dc2626"}">${fmtAmt(rangeProfit)}</div></div>
        <div class="stat-card"><div class="stat-label">Invoices</div><div class="stat-value">${salesData.length}</div></div>
        <div class="stat-card"><div class="stat-label">Unique Patients</div><div class="stat-value">${uniquePatients}</div></div>
      </div>
      <h3>Profit & Loss Statement</h3>
      <table><thead><tr><th>Item</th><th>All-Time</th><th>${fmtRangeLabel()}</th></tr></thead><tbody>
        <tr><td>Sales Revenue</td><td>₹${totalRevenue.toFixed(2)}</td><td>₹${rangeRevenue.toFixed(2)}</td></tr>
        <tr><td>Cost of Goods</td><td style="color:#dc2626">−₹${totalCost.toFixed(2)}</td><td style="color:#dc2626">−₹${rangeCost.toFixed(2)}</td></tr>
        <tr class="total-row"><td><b>Gross Profit</b></td><td><b>₹${totalProfit.toFixed(2)}</b></td><td><b>₹${rangeProfit.toFixed(2)}</b></td></tr>
        <tr><td>GST Collected</td><td>₹${gstCollected.toFixed(2)}</td><td>₹${rangeGst.toFixed(2)}</td></tr>
        <tr><td>Net Margin</td><td>${totalRevenue>0?((totalProfit/totalRevenue)*100).toFixed(1):0}%</td><td>${rangeRevenue>0?((rangeProfit/rangeRevenue)*100).toFixed(1):0}%</td></tr>
      </tbody></table>
      <h3>Patient / Customer Summary</h3>
      <table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
        <tr><td>Total Unique Patients</td><td>${uniquePatients}</td></tr>
        <tr><td>New Patients (this period)</td><td>${newPatients}</td></tr>
        <tr><td>Repeat Patients</td><td>${repeatPatients}</td></tr>
        <tr><td>Walk-in Sales</td><td>${walkIns}</td></tr>
        <tr><td>Total Registered Customers</td><td>${customers.length}</td></tr>
      </tbody></table>
      <h3>Sales Transactions (${salesData.length})</h3>
      <table><thead><tr><th>Invoice</th><th>Date</th><th>Patient</th><th>Doctor</th><th>Payment</th><th>Total</th><th>Profit</th></tr></thead><tbody>
      ${salesData.map(b=>`<tr><td>${b.invoiceNumber}</td><td>${b.date}</td><td>${b.customerName||"Walk-in"}</td><td>${b.doctorName||"—"}</td><td>${b.paymentMode}</td><td>₹${(+b.totalAmount||0).toFixed(2)}</td><td style="color:${(+b.profit||0)>=0?"#059669":"#dc2626"}">₹${(+b.profit||0).toFixed(2)}</td></tr>`).join("")}
      </tbody></table>
      <h3>Top Medicines Sold</h3>
      <table><thead><tr><th>Medicine</th><th>Qty Sold</th></tr></thead><tbody>
      ${topMeds.map(([n,q])=>`<tr><td>${n}</td><td>${q}</td></tr>`).join("")}
      </tbody></table>`;
    printHTML(html, `${ph.facilityName||"Pharmacy"} Report – ${fmtRangeLabel()}`);
  };

  const printPL = () => {
    const html = `<div class="header"><div class="logo">P&L Statement — ${ph.facilityName}</div><div style="font-size:12px;color:#64748b">Period: ${fmtRangeLabel()}</div></div>
    <table><thead><tr><th>Item</th><th>All-Time</th><th>Selected Period</th></tr></thead><tbody>
      <tr><td>Sales Revenue</td><td>₹${totalRevenue.toFixed(2)}</td><td>₹${rangeRevenue.toFixed(2)}</td></tr>
      <tr><td>Cost of Goods Sold</td><td style="color:#dc2626">−₹${totalCost.toFixed(2)}</td><td style="color:#dc2626">−₹${rangeCost.toFixed(2)}</td></tr>
      <tr class="total-row"><td><b>Gross Profit</b></td><td style="color:${totalProfit>=0?"#059669":"#dc2626"}"><b>₹${totalProfit.toFixed(2)}</b></td><td style="color:${rangeProfit>=0?"#059669":"#dc2626"}"><b>₹${rangeProfit.toFixed(2)}</b></td></tr>
      <tr><td>GST Collected</td><td>₹${gstCollected.toFixed(2)}</td><td>₹${rangeGst.toFixed(2)}</td></tr>
      <tr><td>Purchase Orders</td><td style="color:#dc2626">−₹${totalPurchase.toFixed(2)}</td><td>—</td></tr>
      <tr class="total-row"><td><b>Net Margin</b></td><td><b>${totalRevenue>0?((totalProfit/totalRevenue)*100).toFixed(1):0}%</b></td><td><b>${rangeRevenue>0?((rangeProfit/rangeRevenue)*100).toFixed(1):0}%</b></td></tr>
    </tbody></table>`;
    printHTML(html,"P&L Statement");
  };

  const printPatients = () => {
    const html = `<div class="header"><div class="logo">Patient Report — ${ph.facilityName}</div><div style="font-size:12px;color:#64748b">Period: ${fmtRangeLabel()}</div></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">Unique Patients</div><div class="stat-value">${uniquePatients}</div></div>
      <div class="stat-card"><div class="stat-label">New Patients</div><div class="stat-value" style="color:#059669">${newPatients}</div></div>
      <div class="stat-card"><div class="stat-label">Repeat Patients</div><div class="stat-value" style="color:#2563eb">${repeatPatients}</div></div>
      <div class="stat-card"><div class="stat-label">Walk-ins</div><div class="stat-value">${walkIns}</div></div>
    </div>
    <h3>Top Patients by Revenue</h3>
    <table><thead><tr><th>Patient</th><th>Total Spent</th></tr></thead><tbody>
    ${topCusts.map(([n,a])=>`<tr><td>${n}</td><td>₹${a.toFixed(2)}</td></tr>`).join("")}
    </tbody></table>`;
    printHTML(html,"Patient Report");
  };

  const printSalesTxn = () => {
    const html = `<div class="header"><div class="logo">Sales Transactions — ${ph.facilityName}</div><div style="font-size:12px;color:#64748b">Period: ${fmtRangeLabel()}</div></div>
    <table><thead><tr><th>Invoice</th><th>Date</th><th>Patient</th><th>Doctor</th><th>Payment</th><th>Total</th><th>Profit</th></tr></thead><tbody>
    ${salesData.map(b=>`<tr><td>${b.invoiceNumber}</td><td>${b.date}</td><td>${b.customerName||"Walk-in"}</td><td>${b.doctorName||"—"}</td><td>${b.paymentMode}</td><td>₹${(+b.totalAmount||0).toFixed(2)}</td><td style="color:${(+b.profit||0)>=0?"#059669":"#dc2626"}">₹${(+b.profit||0).toFixed(2)}</td></tr>`).join("")}
    </tbody></table>`;
    printHTML(html,"Sales Transactions");
  };

  const printMeds = () => {
    const html = `<div class="header"><div class="logo">Medicine Sales — ${ph.facilityName}</div><div style="font-size:12px;color:#64748b">Period: ${fmtRangeLabel()}</div></div>
    <table><thead><tr><th>Medicine</th><th>Qty Sold</th></tr></thead><tbody>
    ${topMeds.map(([n,q])=>`<tr><td>${n}</td><td>${q}</td></tr>`).join("")}
    </tbody></table>`;
    printHTML(html,"Medicine Sales");
  };

  const inputStyle = { padding:"7px 10px", borderRadius:8, border:`1.5px solid ${T.border2}`, fontSize:12, background:T.surface2, color:T.text, fontFamily:"inherit", outline:"none" };

  return (
    <>
      {/* ── Header ── */}
      <PageHeader T={T} title="Reports & Analytics" subtitle="Custom date range · P&L · Patient analytics · Per-panel print"
        action={<>
          <Btn T={T} label="🖨 Full Report" variant="secondary" small onClick={printFull}/>
        </>}/>

      {/* ── Date Range Selector ── */}
      <div style={{...card(T,{padding:"16px 20px",marginBottom:20})}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
          <span style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginRight:4}}>Period:</span>
          {/* Quick presets */}
          <div style={{display:"flex",gap:2,background:T.surface2,borderRadius:9,padding:2,border:`1px solid ${T.border}`}}>
            {[["today","Today"],["week","7 Days"],["month","Month"],["quarter","Quarter"],["year","Year"]].map(([k,l])=>(
              <button key={k} onClick={()=>applyPreset(k)}
                style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:600,fontSize:11.5,fontFamily:"inherit",background:rangeMode===k?T.accent:"transparent",color:rangeMode===k?"#fff":T.muted,transition:"all 0.13s",whiteSpace:"nowrap"}}>
                {l}
              </button>
            ))}
          </div>
          {/* Custom date range toggle */}
          <button onClick={()=>setShowCalendar(p=>!p)}
            style={{padding:"6px 14px",borderRadius:9,border:`1.5px solid ${rangeMode==="custom"?T.accent:T.border2}`,background:rangeMode==="custom"?T.accentBg:T.surface,color:rangeMode==="custom"?T.accent:T.muted,cursor:"pointer",fontWeight:600,fontSize:11.5,fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
            Custom Range {showCalendar?"▲":"▼"}
          </button>
          {/* Active range label */}
          <div style={{marginLeft:"auto",fontSize:12,color:T.accent,fontWeight:700,background:T.accentBg,borderRadius:8,padding:"5px 12px",border:`1px solid ${T.accent}33`}}>
            {fmtRangeLabel()}
          </div>
        </div>

        {/* Custom date picker */}
        {showCalendar && (
          <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`,display:"flex",flexWrap:"wrap",gap:14,alignItems:"flex-end"}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>From Date</div>
              <input type="date" value={dateFrom} max={dateTo} onChange={e=>setDateFrom(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>To Date</div>
              <input type="date" value={dateTo} min={dateFrom} max={todayISO} onChange={e=>setDateTo(e.target.value)} style={inputStyle}/>
            </div>
            <Btn T={T} label="Apply Range" onClick={applyCustom}/>
            <div style={{fontSize:12,color:T.muted,alignSelf:"center"}}>
              {Math.ceil((new Date(dateTo)-new Date(dateFrom))/86400000)+1} days selected
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Summary Row ── */}
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(5,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Revenue" value={fmtAmt(rangeRevenue)} sub={fmtRangeLabel()} color={T.accent}/>
        <StatCard T={T} label="Profit" value={fmtAmt(rangeProfit)} sub={`${rangeRevenue>0?((rangeProfit/rangeRevenue)*100).toFixed(1):0}% margin`} color={rangeProfit>=0?T.success:T.danger}/>
        <StatCard T={T} label="Invoices" value={salesData.length} sub={`${fmtAmt(avgSale)} avg`} color={T.blue}/>
        <StatCard T={T} label="Unique Patients" value={uniquePatients} sub={`${newPatients} new · ${repeatPatients} repeat`} color={T.purple}/>
        <StatCard T={T} label="GST Collected" value={fmtAmt(rangeGst)} sub="For period" color={T.warn}/>
      </div>

      {/* ── P&L Panel ── */}
      <div style={{marginBottom:16}}>
        <ReportPanel title="Profit & Loss Statement" T={T} color={T.accent} onPrint={printPL}>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:12,marginBottom:14}}>
            {[
              {l:"Total Revenue (All-time)",v:fmtAmt(totalRevenue),sub:fmtAmt(rangeRevenue)+" this period",c:T.accent},
              {l:"Cost of Goods (All-time)",v:fmtAmt(totalCost),sub:fmtAmt(rangeCost)+" this period",c:T.danger},
              {l:"Gross Profit",v:fmtAmt(totalProfit),sub:`${totalRevenue>0?((totalProfit/totalRevenue)*100).toFixed(1):0}% net margin`,c:totalProfit>=0?T.success:T.danger,big:true},
              {l:"GST Collected (All-time)",v:fmtAmt(gstCollected),sub:fmtAmt(rangeGst)+" this period",c:T.purple},
              {l:"Purchase Orders",v:fmtAmt(totalPurchase),sub:`${purchases.length} orders`,c:T.blue},
              {l:"Period Profit",v:fmtAmt(rangeProfit),sub:`${rangeRevenue>0?((rangeProfit/rangeRevenue)*100).toFixed(1):0}% margin`,c:rangeProfit>=0?T.success:T.danger,big:true},
            ].map(({l,v,c,big,sub},i)=>(
              <div key={i} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:10.5,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>{l}</div>
                <div style={{fontSize:big?22:18,fontWeight:800,color:c,marginBottom:3}}>{v}</div>
                {sub&&<div style={{fontSize:11,color:T.muted}}>{sub}</div>}
              </div>
            ))}
          </div>
          {/* P&L mini table */}
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
              <thead><tr style={{background:T.surface2,borderBottom:`2px solid ${T.border}`}}>
                {["Item","All-Time",fmtRangeLabel()].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  ["Sales Revenue", fmtAmt(totalRevenue), fmtAmt(rangeRevenue), T.text],
                  ["Cost of Goods", `−${fmtAmt(totalCost)}`, `−${fmtAmt(rangeCost)}`, T.danger],
                  ["Gross Profit", fmtAmt(totalProfit), fmtAmt(rangeProfit), totalProfit>=0?T.success:T.danger],
                  ["GST Collected", fmtAmt(gstCollected), fmtAmt(rangeGst), T.purple],
                  ["Net Margin", `${totalRevenue>0?((totalProfit/totalRevenue)*100).toFixed(1):0}%`, `${rangeRevenue>0?((rangeProfit/rangeRevenue)*100).toFixed(1):0}%`, T.accent],
                ].map(([label,all,period,c],i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:"9px 12px",color:T.text2,fontWeight:600}}>{label}</td>
                    <td style={{padding:"9px 12px",fontWeight:700,color:c}}>{all}</td>
                    <td style={{padding:"9px 12px",fontWeight:800,color:c,fontSize:14}}>{period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportPanel>
      </div>

      {/* ── Patient / Customer Analytics Panel ── */}
      <div style={{marginBottom:16}}>
        <ReportPanel title="Patient & Customer Analytics" T={T} color={T.purple} onPrint={printPatients}>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:16}}>
            {[
              {l:"Unique Patients",v:uniquePatients,c:T.purple,sub:"In selected period"},
              {l:"New Patients",v:newPatients,c:T.success,sub:"First-time buyers"},
              {l:"Repeat Patients",v:repeatPatients,c:T.blue,sub:"Returning buyers"},
              {l:"Walk-in Sales",v:walkIns,c:T.warn,sub:"No name recorded"},
              {l:"Registered Customers",v:customers.length,c:T.accent,sub:"In database"},
              {l:"Avg Spend/Patient",v:uniquePatients>0?fmtAmt(rangeRevenue/uniquePatients):"—",c:T.blue,sub:"This period"},
              {l:"Total Invoices",v:salesData.length,c:T.text,sub:"In period"},
              {l:"Avg Sale Value",v:fmtAmt(avgSale),c:T.accent,sub:"Per invoice"},
            ].map(({l,v,c,sub},i)=>(
              <div key={i} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{l}</div>
                <div style={{fontSize:18,fontWeight:800,color:c,marginBottom:2}}>{v}</div>
                <div style={{fontSize:10.5,color:T.muted}}>{sub}</div>
              </div>
            ))}
          </div>
          {/* Top patients */}
          {topCusts.length>0 && (
            <>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Top Patients by Revenue</div>
              {topCusts.map(([name,amt],i)=>{
                const pct = rangeRevenue>0 ? Math.round((amt/rangeRevenue)*100) : 0;
                return (
                  <div key={i} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:4}}>
                      <span style={{fontWeight:600,color:T.text}}>{i+1}. {name}</span>
                      <span style={{fontWeight:700,color:COLORS[i%6]}}>{fmtAmt(amt)} ({pct}%)</span>
                    </div>
                    <div style={{height:6,background:T.surface2,borderRadius:99,overflow:"hidden",border:`1px solid ${T.border}`}}>
                      <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:COLORS[i%6]}}/>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </ReportPanel>
      </div>

      {/* ── Sales Transactions Panel ── */}
      <div style={{marginBottom:16}}>
        <ReportPanel title={`Sales Transactions (${salesData.length})`} T={T} color={T.blue} onPrint={printSalesTxn}>
          {salesData.length===0
            ? <p style={{color:T.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>No sales in selected period.</p>
            : <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5,minWidth:600}}>
                  <thead><tr style={{background:T.surface2,borderBottom:`2px solid ${T.border}`}}>
                    {["Invoice","Date","Patient","Doctor","Payment","Items","Total","Profit"].map(h=>(
                      <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {salesData.slice(0,50).map((b,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${T.border}`,transition:"background 0.1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{padding:"9px 12px",fontFamily:"monospace",color:T.accent,fontWeight:700,fontSize:11}}>{b.invoiceNumber}</td>
                        <td style={{padding:"9px 12px",color:T.muted,fontSize:11,whiteSpace:"nowrap"}}>{b.date}</td>
                        <td style={{padding:"9px 12px",fontWeight:600,color:T.text}}>{b.customerName||"Walk-in"}</td>
                        <td style={{padding:"9px 12px",color:T.muted,fontSize:11}}>{b.doctorName||"—"}</td>
                        <td style={{padding:"9px 12px"}}><StatusBadge status={b.paymentMode||"Cash"} T={T}/></td>
                        <td style={{padding:"9px 12px",color:T.muted,fontSize:11}}>{b.items?.length||0}</td>
                        <td style={{padding:"9px 12px",fontWeight:700,color:T.accent}}>{fmtAmt(parseFloat(b.totalAmount)||0)}</td>
                        <td style={{padding:"9px 12px",fontWeight:700,color:(+b.profit||0)>=0?T.success:T.danger}}>{fmtAmt(parseFloat(b.profit)||0)}</td>
                      </tr>
                    ))}
                    {salesData.length>50 && <tr><td colSpan={8} style={{padding:"10px 12px",color:T.muted,fontSize:11,textAlign:"center"}}>+ {salesData.length-50} more rows — use Print for full list</td></tr>}
                  </tbody>
                </table>
              </div>
          }
        </ReportPanel>
      </div>

      {/* ── Bottom 4 panels ── */}
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:16}}>

        {/* Top Medicines */}
        <ReportPanel title="Top Medicines Sold" T={T} color={T.warn} onPrint={printMeds}>
          {topMeds.length===0 ? <p style={{color:T.muted,fontSize:13}}>No sales data for this period.</p>
          : topMeds.map(([name,qty],i)=>{
            const max = topMeds[0][1]||1;
            const pct = Math.round((qty/max)*100);
            return (
              <div key={i} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:4}}>
                  <span style={{fontWeight:600,color:T.text}}>{i+1}. {name}</span>
                  <span style={{fontWeight:700,color:COLORS[i%6]}}>{qty} units</span>
                </div>
                <div style={{height:6,background:T.surface2,borderRadius:99,overflow:"hidden",border:`1px solid ${T.border}`}}>
                  <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:COLORS[i%6]}}/>
                </div>
              </div>
            );
          })}
        </ReportPanel>

        {/* Payment Mode Breakdown */}
        <ReportPanel title="Sales by Payment Mode" T={T} color={T.blue} onPrint={()=>{
          const html=`<div class="header"><div class="logo">Payment Modes — ${ph.facilityName}</div><div style="font-size:12px;color:#64748b">Period: ${fmtRangeLabel()}</div></div>
          <table><thead><tr><th>Mode</th><th>Count</th><th>Amount</th><th>Share</th></tr></thead><tbody>
          ${Object.entries(payBreak).map(([m,d])=>`<tr><td>${m}</td><td>${d.count}</td><td>₹${d.amount.toFixed(2)}</td><td>${rangeRevenue>0?((d.amount/rangeRevenue)*100).toFixed(1):0}%</td></tr>`).join("")}
          </tbody></table>`;
          printHTML(html,"Payment Modes");
        }}>
          {Object.keys(payBreak).length===0
            ? <p style={{color:T.muted,fontSize:13}}>No sales in selected period.</p>
            : Object.entries(payBreak).map(([mode,data])=>{
                const pct = rangeRevenue>0 ? Math.round((data.amount/rangeRevenue)*100) : 0;
                return (
                  <div key={mode} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <StatusBadge status={mode} T={T}/>
                        <span style={{fontSize:12,color:T.muted}}>{data.count} sales</span>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <span style={{fontWeight:700,color:T.accent,fontSize:13}}>{fmtAmt(data.amount)}</span>
                        <span style={{fontSize:10,color:T.muted,marginLeft:6}}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{height:5,background:T.surface2,borderRadius:99,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:T.accent}}/>
                    </div>
                  </div>
                );
              })
          }
        </ReportPanel>

        {/* Stock / Inventory */}
        <ReportPanel title="Stock Summary" T={T} color={T.success} onPrint={()=>{
          const html=`<div class="header"><div class="logo">Stock Report — ${ph.facilityName}</div><div style="font-size:12px;color:#64748b">${today()}</div></div>
          <table><thead><tr><th>Category</th><th>Count</th><th>%</th></tr></thead><tbody>
          ${topCats.map(([c,n])=>`<tr><td>${c}</td><td>${n}</td><td>${inventory.length>0?((n/inventory.length)*100).toFixed(1):0}%</td></tr>`).join("")}
          </tbody></table>
          <h3>Stock Status</h3>
          <table><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>
          <tr><td>Total Medicines</td><td>${inventory.length}</td></tr>
          <tr><td>In Stock</td><td>${inventory.filter(m=>+m.quantity>+(m.minStock||10)).length}</td></tr>
          <tr><td>Low Stock</td><td>${inventory.filter(m=>+m.quantity<=(+m.minStock||10)&&+m.quantity>0).length}</td></tr>
          <tr><td>Out of Stock</td><td>${inventory.filter(m=>+m.quantity===0).length}</td></tr>
          <tr><td>Expiring ≤6 months</td><td>${inventory.filter(m=>{const d=daysLeft(m.expiryDate);return d!==null&&d>=0&&d<=180;}).length}</td></tr>
          </tbody></table>`;
          printHTML(html,"Stock Report");
        }}>
          <div style={{marginBottom:14}}>
            {[{l:"Total Medicines",v:inventory.length,c:T.blue},{l:"In Stock",v:inventory.filter(m=>+m.quantity>+(m.minStock||10)).length,c:T.success},{l:"Low Stock",v:inventory.filter(m=>+m.quantity<=(+m.minStock||10)&&+m.quantity>0).length,c:T.warn},{l:"Out of Stock",v:inventory.filter(m=>+m.quantity===0).length,c:T.danger},{l:"Expiring ≤6mo",v:inventory.filter(m=>{const d=daysLeft(m.expiryDate);return d!==null&&d>=0&&d<=180;}).length,c:T.danger}].map(({l,v,c})=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:13,color:T.text2}}>{l}</span>
                <span style={{fontWeight:800,fontSize:17,color:c}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8,marginTop:12}}>By Category</div>
          {topCats.map(([cat,count],i)=>{
            const pct=inventory.length>0?Math.round((count/inventory.length)*100):0;
            return(<div key={cat} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{fontWeight:600,color:T.text}}>{cat}</span>
                <span style={{fontWeight:700,color:COLORS[i%6]}}>{count} ({pct}%)</span>
              </div>
              <div style={{height:5,background:T.surface2,borderRadius:99,overflow:"hidden",border:`1px solid ${T.border}`}}>
                <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:COLORS[i%6]}}/>
              </div>
            </div>);
          })}
        </ReportPanel>

        {/* Purchase Summary */}
        <ReportPanel title="Purchase & Supplier Summary" T={T} color={T.blue} onPrint={()=>{
          const html=`<div class="header"><div class="logo">Purchase Report — ${ph.facilityName}</div><div style="font-size:12px;color:#64748b">${today()}</div></div>
          <table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
          <tr><td>Total Orders</td><td>${purchases.length}</td></tr>
          <tr><td>Received</td><td>${purchases.filter(p=>p.status==="Received").length}</td></tr>
          <tr><td>Ordered (Pending)</td><td>${purchases.filter(p=>p.status==="Ordered").length}</td></tr>
          <tr><td>Returned</td><td>${purchases.filter(p=>p.status==="Returned").length}</td></tr>
          <tr><td>Total Suppliers</td><td>${suppliers.length}</td></tr>
          <tr><td>Total Spend</td><td>₹${totalPurchase.toFixed(2)}</td></tr>
          </tbody></table>`;
          printHTML(html,"Purchase Report");
        }}>
          {[
            {l:"Total Orders",v:purchases.length,c:T.blue},
            {l:"Received",v:purchases.filter(p=>p.status==="Received").length,c:T.success},
            {l:"Ordered (Pending)",v:purchases.filter(p=>p.status==="Ordered").length,c:T.warn},
            {l:"Returned",v:purchases.filter(p=>p.status==="Returned").length,c:T.danger},
            {l:"Total Suppliers",v:suppliers.length,c:T.purple},
            {l:"Total Purchase Spend",v:fmtAmt(totalPurchase),c:T.blue},
          ].map(({l,v,c})=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:13,color:T.text2}}>{l}</span>
              <span style={{fontWeight:800,fontSize:typeof v==="string"?14:17,color:c}}>{v}</span>
            </div>
          ))}
        </ReportPanel>
      </div>
    </>
  );
}

//  PROFILE (with photo upload)
function ProfileSection({ T }) {
  const mob = useWindowWidth()<768;
  const stored = JSON.parse(localStorage.getItem("pharmacyUser")||"{}");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(()=>localStorage.getItem("ph_profile_photo")||"");
  const [logoUrl, setLogoUrl] = useState(()=>localStorage.getItem("ph_logo_url")||"");
  const [brandColor, setBrandColor] = useState(()=>localStorage.getItem("ph_brand_color")||stored.brandColor||"#059669");
  const photoRef = useRef(null);
  const logoRef  = useRef(null);
  const [form, setForm] = useState({
    facilityName:stored.facilityName||"", email:stored.email||"", phone:stored.phone||"",
    alternatePhone:stored.alternatePhone||"", whatsappNumber:stored.whatsappNumber||"",
    registrationNumber:stored.registrationNumber||"", licenseNumber:stored.licenseNumber||"",
    drugLicenseNumber:stored.drugLicenseNumber||"", city:stored.city||"", state:stored.state||"",
    gstNumber:stored.gstNumber||"", panNumber:stored.panNumber||"", address:stored.address||"",
    pharmacy24x7:stored.pharmacy24x7||false, homeDelivery:stored.homeDelivery||false,
    onlinePrescription:stored.onlinePrescription||false,
  });

  useEffect(()=>{
    (async()=>{
      try {
        const data = await apiFetch("/api/pharmacy/profile");
        if(data?.facility||data?.pharmacy) {
          const f = data.facility||data.pharmacy;
          setForm(prev=>({
            ...prev,
            facilityName:f.facilityName||"", email:f.email||"", phone:f.phone||"",
            alternatePhone:f.alternatePhone||"", whatsappNumber:f.whatsappNumber||"",
            registrationNumber:f.registrationNumber||"", licenseNumber:f.licenseNumber||"",
            drugLicenseNumber:f.drugLicenseNumber||"", city:f.city||"", state:f.state||"",
            gstNumber:f.gstNumber||"", panNumber:f.panNumber||"", address:f.address||"",
            pharmacy24x7:f.pharmacy24x7||false, homeDelivery:f.homeDelivery||false,
            onlinePrescription:f.onlinePrescription||false,
          }));
          if(f.profilePhoto) { setProfilePhoto(f.profilePhoto); localStorage.setItem("ph_profile_photo",f.profilePhoto); }
          if(f.logoUrl) { setLogoUrl(f.logoUrl); localStorage.setItem("ph_logo_url",f.logoUrl); }
          if(f.brandColor) { setBrandColor(f.brandColor); localStorage.setItem("ph_brand_color",f.brandColor); }
          localStorage.setItem("pharmacyUser", JSON.stringify({...stored,...f}));
        }
      } catch(e) { console.warn("Profile fetch failed:", e.message); }
      finally { setLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleImageUpload = (file, type) => {
    if(!file) return;
    if(file.size > 2*1024*1024) return alert("Image too large. Max 2MB.");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      if(type==="photo") {
        setProfilePhoto(base64);
        localStorage.setItem("ph_profile_photo", base64);
        apiFetch("/api/pharmacy/profile/photo", {method:"PUT", body:JSON.stringify({photo:base64})}).catch(console.warn);
      } else {
        setLogoUrl(base64);
        localStorage.setItem("ph_logo_url", base64);
        apiFetch("/api/pharmacy/profile", {method:"PUT", body:JSON.stringify({logoUrl:base64})}).catch(console.warn);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBrandColorChange = (color) => {
    setBrandColor(color);
    localStorage.setItem("ph_brand_color", color);
    apiFetch("/api/pharmacy/profile", {method:"PUT", body:JSON.stringify({brandColor:color})}).catch(console.warn);
  };

  const removeLogo = () => {
    if(!window.confirm("Remove pharmacy logo?")) return;
    setLogoUrl("");
    localStorage.removeItem("ph_logo_url");
    apiFetch("/api/pharmacy/profile", {method:"PUT", body:JSON.stringify({logoUrl:""})}).catch(console.warn);
  };

  useEffect(()=>{
    if(!profilePhoto) {
      apiFetch("/api/pharmacy/profile").then(data=>{
        const f = data?.facility||data?.pharmacy;
        if(f?.profilePhoto) { setProfilePhoto(f.profilePhoto); localStorage.setItem("ph_profile_photo",f.profilePhoto); }
      }).catch(()=>{});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleSave = async () => {
    setSaveError("");
    try {
      const payload = {
        facilityName:      form.facilityName,
        phone:             form.phone,
        alternatePhone:    form.alternatePhone,
        whatsappNumber:    form.whatsappNumber,
        drugLicenseNumber: form.drugLicenseNumber,
        licenseNumber:     form.licenseNumber,
        city:              form.city,
        state:             form.state,
        gstNumber:         form.gstNumber,
        panNumber:         form.panNumber,
        address:           form.address || "",
        contactPerson:     form.contactPerson || form.facilityName,
        pharmacy24x7:      form.pharmacy24x7,
        homeDelivery:      form.homeDelivery,
        onlinePrescription:form.onlinePrescription,
        genericMedicines:  form.genericMedicines || false,
        brandColor,
      };
      const res = await apiFetch("/api/pharmacy/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res?.facility) {
        const currentStored = JSON.parse(localStorage.getItem("pharmacyUser")||"{}");
        localStorage.setItem("pharmacyUser", JSON.stringify({ ...currentStored, ...res.facility, brandColor }));
      }
      setSaved(true); setEditing(false); setTimeout(()=>setSaved(false), 3000);
    } catch {
      setSaveError("Failed to save profile. Please check your connection and try again.");
    }
  };

  const [loginHistory, setLoginHistory] = useState([]);
  useEffect(()=>{
    apiFetch("/api/pharmacy/login-history").then(d=>{ if(d?.loginHistory) setLoginHistory(d.loginHistory.slice().reverse()); }).catch(()=>{});
  },[]);

  if(loading) return <div style={{textAlign:"center",padding:"60px 0",color:T.muted}}>Loading profile…</div>;

  const fields = [
    ["facilityName","Pharmacy Name"],["email","Email"],["phone","Phone"],["alternatePhone","Alternate Phone"],
    ["whatsappNumber","WhatsApp Number"],["registrationNumber","Reg. No."],["licenseNumber","License No."],
    ["drugLicenseNumber","Drug License No."],["city","City"],["state","State"],["gstNumber","GST Number"],["panNumber","PAN Number"]
  ];
  const readOnly = new Set(["email","registrationNumber"]);

  const printProfile = () => {
    const html = `<div class="header"><div class="logo">${form.facilityName}</div><div style="font-size:12px;color:#64748b">Profile Report · ${today()}</div></div>
    <table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
    ${fields.map(([k,l])=>`<tr><td><b>${l}</b></td><td>${form[k]||"—"}</td></tr>`).join("")}
    <tr><td>24x7 Service</td><td>${form.pharmacy24x7?"Yes":"No"}</td></tr>
    <tr><td>Home Delivery</td><td>${form.homeDelivery?"Yes":"No"}</td></tr>
    <tr><td>Online Prescription</td><td>${form.onlinePrescription?"Yes":"No"}</td></tr>
    </tbody></table>`;
    printHTML(html,"Pharmacy Profile");
  };

  return (
    <>
      <PageHeader T={T} title="Pharmacy Profile" subtitle="Registration, branding and contact details"
        action={<Btn T={T} label="Print Profile" variant="secondary" small onClick={printProfile}/>}/>
      {saved && <div style={{background:T.successBg,border:`1px solid ${T.success}`,borderRadius:10,padding:"10px 16px",marginBottom:18,color:T.success,fontSize:13,fontWeight:600}}>Profile saved successfully.</div>}
      {saveError && <div style={{background:T.dangerBg,border:`1px solid ${T.danger}`,borderRadius:10,padding:"10px 16px",marginBottom:18,color:T.danger,fontSize:13}}>{saveError}</div>}
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"300px 1fr",gap:20}}>
        <div style={{...card(T,{padding:26,textAlign:"center"})}}>

          {/* Profile Photo */}
          <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
            {profilePhoto
              ? <img src={profilePhoto} alt="Profile" style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",border:`3px solid ${brandColor}`}}/>
              : <div style={{width:80,height:80,borderRadius:"50%",background:brandColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:28,margin:"0 auto"}}>{(form.facilityName||"P").charAt(0).toUpperCase()}</div>
            }
            <button onClick={()=>photoRef.current?.click()} style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",background:brandColor,border:`2px solid ${T.surface}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700}}>+</button>
            <input ref={photoRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImageUpload(e.target.files[0],"photo")}/>
          </div>
          <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:3}}>{form.facilityName||"Pharmacy"}</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:6}}>{form.email}</div>
          {form.phone && <div style={{fontSize:12,color:T.muted,marginBottom:14}}>{form.phone}{form.whatsappNumber?` · ${form.whatsappNumber}`:""}</div>}

          {/* Invoice Logo */}
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:14,marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Invoice Logo</div>
            {logoUrl
              ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                  <img src={logoUrl} alt="Logo" style={{height:52,maxWidth:140,objectFit:"contain",borderRadius:8,border:`1px solid ${T.border}`}}/>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>logoRef.current?.click()} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${T.border2}`,background:T.surface2,color:T.muted,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit"}}>Change</button>
                    <button onClick={removeLogo} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${T.danger}`,background:T.dangerBg,color:T.danger,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit"}}>Remove</button>
                  </div>
                </div>
              : <div>
                  <button onClick={()=>logoRef.current?.click()} style={{padding:"7px 16px",borderRadius:8,border:`1.5px dashed ${T.border2}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",width:"100%"}}>Upload Logo</button>
                  <div style={{fontSize:10,color:T.muted,marginTop:4}}>Appears on all invoices and prints</div>
                </div>
            }
            <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImageUpload(e.target.files[0],"logo")}/>
          </div>

          {/* Invoice Header Color Picker */}
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:14,marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Invoice Header Colour</div>
            <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
              <input
                type="color"
                value={brandColor}
                onChange={e=>handleBrandColorChange(e.target.value)}
                style={{width:40,height:36,padding:2,borderRadius:8,border:`1.5px solid ${T.border2}`,cursor:"pointer",background:"transparent"}}
              />
              <div style={{flex:1}}>
                <div style={{height:28,borderRadius:6,background:brandColor,border:`1px solid ${T.border}`}}/>
                <div style={{fontSize:10,color:T.muted,marginTop:3,textAlign:"center",fontFamily:"monospace"}}>{brandColor}</div>
              </div>
              <button onClick={()=>handleBrandColorChange("#059669")}
                style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border2}`,background:T.surface2,color:T.muted,cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>Reset</button>
            </div>
            <div style={{marginTop:8,display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
              {["#059669","#0369a1","#7c3aed","#be123c","#b45309","#0f766e","#1d4ed8","#9333ea"].map(c=>(
                <button key={c} onClick={()=>handleBrandColorChange(c)}
                  title={c}
                  style={{width:20,height:20,borderRadius:"50%",background:c,border:brandColor===c?`2px solid ${T.text}`:"2px solid transparent",cursor:"pointer",padding:0,outline:"none"}}/>
              ))}
            </div>
            <div style={{fontSize:10,color:T.muted,marginTop:6}}>Applied to all invoice headers and footers</div>
          </div>

          <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:14}}>
            {form.pharmacy24x7&&<span style={{background:T.successBg,color:T.success,border:`1px solid ${T.success}`,borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:700}}>24x7</span>}
            {form.homeDelivery&&<span style={{background:T.blueBg,color:T.blue,border:`1px solid ${T.blue}`,borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:700}}>Home Delivery</span>}
            {form.onlinePrescription&&<span style={{background:T.purpleBg,color:T.purple,border:`1px solid ${T.purple}`,borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:700}}>Online Rx</span>}
          </div>
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:14}}>
            {[["City",form.city||"—"],["State",form.state||"—"],["GST",form.gstNumber||"—"],["Drug Lic.",form.drugLicenseNumber||"—"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:8}}><span style={{color:T.muted}}>{k}</span><span style={{fontWeight:600,color:T.text,fontSize:11}}>{v}</span></div>
            ))}
          </div>
        </div>

        <div style={{...card(T,{padding:26})}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexWrap:"wrap",gap:10}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700,color:T.text}}>Registration Details</h3>
            <div style={{display:"flex",gap:8}}>
              {editing&&<Btn T={T} label="Cancel" variant="secondary" onClick={()=>setEditing(false)}/>}
              <Btn T={T} label={editing?"Save Changes":"Edit Profile"} onClick={editing?handleSave:()=>setEditing(true)}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"16px 28px"}}>
            {fields.map(([key,label])=>(
              <div key={key}>
                <div style={{fontSize:10.5,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{label}</div>
                {editing&&!readOnly.has(key)
                  ?<input value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:13,color:T.text,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface2}}/>
                  :<div style={{fontSize:14,color:form[key]?T.text:T.muted,fontWeight:500}}>{form[key]||"—"}{readOnly.has(key)&&editing&&<span style={{fontSize:10,color:T.muted,marginLeft:6}}>(cannot edit)</span>}</div>}
              </div>
            ))}
          </div>
          {editing && (
            <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.07em"}}>Services</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[["pharmacy24x7","24x7 Open"],["homeDelivery","Home Delivery"],["onlinePrescription","Online Prescription"]].map(([key,label])=>(
                  <div key={key} onClick={()=>setForm(f=>({...f,[key]:!f[key]}))} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:9,border:`1px solid ${form[key]?T.accent:T.border}`,cursor:"pointer",background:form[key]?T.accentBg:T.surface2}}>
                    <div style={{width:18,height:18,borderRadius:4,background:form[key]?T.accent:T.surface,border:`2px solid ${form[key]?T.accent:T.border2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff"}}>{form[key]?"✓":""}</div>
                    <span style={{fontSize:12,fontWeight:600,color:form[key]?T.accent:T.muted}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login History */}
      {loginHistory.length > 0 && (
        <div style={{...card(T,{padding:24,marginTop:20})}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700,color:T.text}}>Recent Login Activity</h3>
            <span style={{fontSize:11,color:T.muted}}>{loginHistory.length} recent sessions</span>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:T.surface2,borderBottom:`2px solid ${T.border}`}}>
                  {["#","Date & Time","IP Address","Device","Browser","Status"].map(h=>(
                    <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loginHistory.slice(0,10).map((l,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`,transition:"background 0.1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"10px 12px",color:T.muted}}>{i+1}</td>
                    <td style={{padding:"10px 12px",color:T.text,whiteSpace:"nowrap"}}>
                      {l.time ? new Date(l.time).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}) : "—"}
                    </td>
                    <td style={{padding:"10px 12px",fontFamily:"monospace",color:T.blue,fontSize:11}}>{l.ip||"—"}</td>
                    <td style={{padding:"10px 12px",color:T.text}}>{l.device||"—"}</td>
                    <td style={{padding:"10px 12px",color:T.text}}>{l.browser||"—"}</td>
                    <td style={{padding:"10px 12px"}}>
                      <span style={{background:i===0?T.successBg:T.surface2,color:i===0?T.success:T.muted,border:`1px solid ${i===0?T.success:T.border}`,borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:700}}>
                        {i===0?"Current":"Previous"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:12,padding:"10px 14px",background:T.warnBg,border:`1px solid ${T.warn}33`,borderRadius:9,fontSize:12,color:T.warn}}>
            ⚠ You receive an email alert every time someone logs into this account. If you see an unrecognised login, change your password immediately.
          </div>
        </div>
      )}
    </>
  );
}

//  SETTINGS (multi-theme, color picker, password)
function SettingsSection({ setInventory, setBilling, setSuppliers, setCustomers, T, themeKey, setThemeKey }) {
  const mob = useWindowWidth()<768;
  const KEYS = getKeys();
  const [pw, setPw] = useState({current:"",newpw:"",confirm:""});
  const [pwMsg, setPwMsg] = useState("");

  const changePw = async () => {
    if(!pw.current) return setPwMsg("Enter current password.");
    if(pw.newpw.length<6) return setPwMsg("Min 6 characters.");
    if(pw.newpw!==pw.confirm) return setPwMsg("Passwords do not match.");
    try {
      await apiFetch("/api/pharmacy/password",{method:"PUT",body:JSON.stringify({currentPassword:pw.current,newPassword:pw.newpw})});
      setPwMsg("Password updated successfully."); setPw({current:"",newpw:"",confirm:""}); setTimeout(()=>setPwMsg(""),3000);
    } catch { setPwMsg("Failed. Check current password."); }
  };

  const clearSection = async (section, setter) => {
    if(!window.confirm(`Permanently delete ALL ${section} records from both this device and the server?`)) return;
    setter([]);
    lsSet(KEYS[section], []);
    try {
      await apiFetch("/api/pharmacy/dashboard/update", {
        method: "POST",
        body: JSON.stringify({ section, data: [] }),
      });
      alert(`✓ ${section} cleared from MongoDB and local cache.`);
    } catch(e) {
      alert(`Local cleared, but server sync failed: ${e.message}`);
    }
  };

  return (
    <>
      <PageHeader T={T} title="Settings" subtitle="System, appearance, and account configuration"/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:20}}>
        {/* Theme Selector */}
        <div style={{...card(T,{padding:24,gridColumn:mob?"1":"1/-1"})}}>
          <h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:T.text}}>Theme Selection</h3>
          <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(7,1fr)",gap:10}}>
            {Object.entries(THEME_PRESETS).map(([key,theme])=>(
              <div key={key} onClick={()=>setThemeKey(key)}
                style={{padding:"12px 8px",borderRadius:10,cursor:"pointer",border:`2px solid ${themeKey===key?T.accent:T.border}`,background:theme.bg,textAlign:"center",transition:"all 0.15s"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:theme.accent,margin:"0 auto 6px",border:`2px solid ${theme.surface}`}}/>
                <div style={{fontSize:10,fontWeight:700,color:themeKey===key?T.accent:T.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{theme.name}</div>
                {themeKey===key && <div style={{fontSize:9,color:T.accent,marginTop:2}}>✓ Active</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Password */}
        <div style={{...card(T,{padding:24})}}>
          <h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:T.text}}>Change Password</h3>
          {pwMsg&&<div style={{background:pwMsg.includes("success")?T.successBg:T.dangerBg,color:pwMsg.includes("success")?T.success:T.danger,borderRadius:9,padding:"9px 14px",marginBottom:14,fontSize:13}}>{pwMsg}</div>}
          {[["Current Password","current"],["New Password","newpw"],["Confirm Password","confirm"]].map(([label,key])=>(
            <div key={key} style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{label}</div>
              <input type="password" value={pw[key]} onChange={e=>setPw(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface2,color:T.text}}/>
            </div>
          ))}
          <Btn T={T} label="Update Password" onClick={changePw}/>
        </div>

        {/* System Info */}
        <div style={{...card(T,{padding:24})}}>
          <h3 style={{margin:"0 0 18px",fontSize:14,fontWeight:700,color:T.text}}>System Information</h3>
          {[["Timezone","Asia/Kolkata (IST)"],["Currency","Indian Rupee (₹)"],["GST","Enabled"],["Version","2.0.0"],["Support","support@bioburg.in"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:12,marginBottom:12,borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:13,color:T.muted}}>{k}</span>
              <span style={{fontSize:12,fontWeight:600,color:T.text,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:7,padding:"3px 10px"}}>{v}</span>
            </div>
          ))}
        </div>

        {/* Data Management */}
        <div style={{...card(T,{padding:24})}}>
          <h3 style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:T.text}}>Data Management</h3>
          <p style={{fontSize:12,color:T.muted,marginBottom:16}}>These actions permanently delete records.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[["Clear Inventory","inventory",setInventory],["Clear Sales","billing",setBilling],["Clear Suppliers","suppliers",setSuppliers],["Clear Customers","customers",setCustomers]].map(([label,section,setter])=>(
              <div key={section} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:T.dangerBg,border:`1px solid ${T.danger}33`,borderRadius:9}}>
                <span style={{fontWeight:600,fontSize:13,color:T.text}}>{label}</span>
                <Btn T={T} label="Clear" variant="danger" small onClick={()=>clearSection(section,setter)}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Sidebar & Nav 
const NAV_GROUPS = [
  { label:"Main",      items:[{key:"dashboard",label:"Dashboard"}] },
  { label:"Inventory", items:[{key:"medicines",label:"Medicines"},{key:"expiry",label:"Expiry Alerts"}] },
  { label:"Sales",     items:[{key:"sales",label:"Sales & Billing"},{key:"purchases",label:"Purchase Orders"},{key:"suppliers",label:"Suppliers"},{key:"customers",label:"Patients"}] },
  { label:"Admin",     items:[{key:"reports",label:"Reports"},{key:"profile",label:"Profile"},{key:"settings",label:"Settings"}] },
];

function Sidebar({ active, onChange, userName, facilityName, onLogout, badges, T, profilePhoto }) {
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0,background:T.sidebar}}>
      <div style={{padding:"18px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontWeight:800,fontSize:16,color:"#f1f5f9",letterSpacing:"-0.5px"}}>Bioburg</div>
          <div style={{fontSize:9,color:T.sidebarText,fontWeight:600,background:"rgba(255,255,255,0.06)",borderRadius:4,padding:"2px 6px"}}>RX</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px"}}>
        {NAV_GROUPS.map(group=>(
          <div key={group.label} style={{marginBottom:8}}>
            <div style={{fontSize:9,fontWeight:700,color:"rgba(148,163,184,0.4)",letterSpacing:"0.14em",textTransform:"uppercase",padding:"8px 10px 4px"}}>{group.label}</div>
            {group.items.map(item=>{
              const isActive = active===item.key;
              const badge = badges[item.key];
              return (
                <button key={item.key} onClick={()=>onChange(item.key)}
                  style={{width:"100%",padding:"9px 12px",display:"flex",alignItems:"center",gap:9,border:`1px solid ${isActive?"rgba(52,211,153,0.2)":"transparent"}`,borderRadius:9,cursor:"pointer",fontFamily:"inherit",fontWeight:isActive?700:500,fontSize:13,background:isActive?T.sidebarActiveBg:"transparent",color:isActive?T.sidebarActive:T.sidebarText,transition:"all 0.13s",marginBottom:1,textAlign:"left"}}>
                  <span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</span>
                  {badge > 0 && <span style={{background:"#f43f5e",color:"#fff",borderRadius:99,padding:"0 6px",fontSize:10,fontWeight:700,minWidth:18,textAlign:"center"}}>{badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{padding:"10px 10px 14px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}>
            {profilePhoto
              ? <img src={profilePhoto} alt="" style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`2px solid ${T.sidebarActive}`}}/>
              : <div style={{width:32,height:32,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,flexShrink:0}}>{(userName||"P").charAt(0).toUpperCase()}</div>
            }
            <div style={{overflow:"hidden"}}>
              <div style={{fontSize:12.5,fontWeight:700,color:"#f1f5f9",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{userName}</div>
              <div style={{fontSize:10.5,color:T.sidebarText}}>Pharmacy Admin</div>
            </div>
          </div>
          <div style={{fontSize:10.5,color:T.accent,background:"rgba(52,211,153,0.1)",borderRadius:6,padding:"3px 8px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{facilityName}</div>
        </div>
        <button onClick={()=>window.open("/","_blank")} style={{width:"100%",padding:"8px 11px",border:`1px solid rgba(255,255,255,0.1)`,borderRadius:9,cursor:"pointer",background:"rgba(255,255,255,0.05)",color:"#94a3b8",fontWeight:600,fontSize:12,fontFamily:"inherit",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          🛍️ Visit Store
        </button>
        <button onClick={onLogout} style={{width:"100%",padding:"8px 12px",border:"1px solid rgba(251,113,133,0.3)",borderRadius:9,cursor:"pointer",background:"rgba(251,113,133,0.08)",color:"#fb7185",fontWeight:600,fontSize:12.5,fontFamily:"inherit"}}>Sign Out</button>
      </div>
    </div>
  );
}

//  Main Dashboard 
const SIDEBAR_W = 242;

export default function PharmacyDashboard() {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [themeKey, setThemeKey] = useState(()=>lsGet("ph_theme","dark"));
  const navigate = useNavigate();
  const w = useWindowWidth(); const isMobile = w < 768;
  const T = THEME_PRESETS[themeKey] || THEME_PRESETS.dark;
  const KEYS = getKeys();

  const [inventory, setInventory, syncInv]   = useStore(KEYS.inventory,    [], "inventory");
  const [billing,   setBilling,   syncBill]   = useStore(KEYS.billing,      [], "billing");
  const [suppliers, setSuppliers, syncSup]    = useStore(KEYS.suppliers,    [], "suppliers");
  const [purchases, setPurchases, syncPur]    = useStore(KEYS.purchases,    [], "purchases");
  const [customers, setCustomers, syncCus]    = useStore(KEYS.customers,    [], "customers");
  const [prescriptions, setPrescriptions]     = useStore(KEYS.prescriptions,[], "prescriptions");
  const [staff, setStaff]                     = useStore(KEYS.staff,        [], "staff");

  // Global sync status — worst of all section statuses
  const syncStatus = [syncInv,syncBill,syncSup,syncPur,syncCus].includes("error") ? "error"
    : [syncInv,syncBill,syncSup,syncPur,syncCus].includes("saving") ? "saving" : "idle";

  const stored = JSON.parse(localStorage.getItem("pharmacyUser")||"{}");
  const userName = stored?.contactPerson || stored?.name || "Admin";
  const facilityName = stored?.facilityName || "Pharmacy";
  const profilePhoto = localStorage.getItem("ph_profile_photo")||"";

  useEffect(()=>{ lsSet("ph_theme",themeKey); document.body.style.background=T.bg; },[themeKey,T]);

  useEffect(()=>{
    (async()=>{
      try {
        const data = await apiFetch("/api/pharmacy/dashboard");
        // Support both response shapes: { dashboard: {...} } or { data: {...} }
        const d = data?.dashboard || data?.data;
        if (d) {
          const sectionMap = {
            inventory:     setInventory,
            billing:       setBilling,
            suppliers:     setSuppliers,
            purchases:     setPurchases,
            customers:     setCustomers,
            prescriptions: setPrescriptions,
            staff:         setStaff,
          };
          // Also handle old field name aliases from MongoDB
          const aliases = { medicines:"inventory", orders:"purchases", expiry:"inventory" };

          Object.entries(sectionMap).forEach(([key, setter]) => {
            const val = d[key] ?? d[aliases[key]];
            if (Array.isArray(val) && val.length > 0) {
              // Only overwrite if MongoDB has data (don't wipe local with empty)
              setter(val);
              lsSet(KEYS[key], val);
            }
          });

          // Also refresh pharmacyUser from profile to get latest fields
          try {
            const profileRes = await apiFetch("/api/pharmacy/profile");
            const facility = profileRes?.facility || profileRes?.pharmacy;
            if (facility) {
              const stored = JSON.parse(localStorage.getItem("pharmacyUser")||"{}");
              localStorage.setItem("pharmacyUser", JSON.stringify({ ...stored, ...facility }));
              // Sync profile photo
              if (facility.profilePhoto && facility.profilePhoto !== localStorage.getItem("ph_profile_photo")) {
                localStorage.setItem("ph_profile_photo", facility.profilePhoto);
              }
            }
          } catch (profileErr) {
            console.warn("Profile fetch failed:", profileErr.message);
          }
        }
      } catch(e) {
        console.warn("Backend load failed, using localStorage cache:", e.message);
      } finally {
        setLoading(false);
      }
    })();
    sessionStorage.setItem("activePortal","pharmacy");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleLogout = () => {
    // Clear auth tokens
    localStorage.removeItem("pharmacyUser");
    ["pharmacyToken","pharmacy_token","token","authToken","jwtToken","accessToken"].forEach(k=>localStorage.removeItem(k));
    // Clear all section caches for this pharmacy
    Object.values(KEYS).forEach(k=>localStorage.removeItem(k));
    localStorage.removeItem("ph_profile_photo");
    navigate("/pharmacy/login");
  };

  // Sync status pill component
  const SyncPill = () => {
    if (syncStatus==="idle") return null;
    const cfg = {
      saving:{ bg:"rgba(251,191,36,0.15)", color:"#fbbf24", dot:"#fbbf24", label:"Saving…" },
      error: { bg:"rgba(251,113,133,0.15)", color:"#fb7185", dot:"#fb7185", label:"Save failed – retrying" },
    };
    const c = cfg[syncStatus];
    return (
      <div style={{position:"fixed",bottom:20,right:20,zIndex:9999,background:c.bg,border:`1px solid ${c.color}33`,borderRadius:99,padding:"7px 14px",display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:600,color:c.color,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:c.dot,display:"inline-block",animation:syncStatus==="saving"?"pulse 1s infinite":"none"}}/>
        {c.label}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      </div>
    );
  };

  const badges = {
    medicines: inventory.filter(m=>+m.quantity<=(+(m.minStock)||10)).length,
    expiry: inventory.filter(m=>{const d=daysLeft(m.expiryDate);return d!==null&&d>=0&&d<=180;}).length,
    purchases: purchases.filter(p=>p.status==="Ordered").length,
  };

  const sp = {inventory,setInventory,billing,setBilling,suppliers,setSuppliers,purchases,setPurchases,customers,setCustomers,prescriptions,setPrescriptions,staff,setStaff};

  const SECTIONS = {
    dashboard: <DashboardOverview {...sp} T={T}/>,
    medicines: <MedicineManagement inventory={inventory} setInventory={setInventory} T={T}/>,
    sales:     <SalesBilling billing={billing} setBilling={setBilling} inventory={inventory} setInventory={setInventory} customers={customers} T={T}/>,
    purchases: <PurchaseOrders T={T} setInventory={setInventory}/>,
    suppliers: <SupplierManagement suppliers={suppliers} setSuppliers={setSuppliers} T={T}/>,
    customers: <CustomerManagement customers={customers} setCustomers={setCustomers} billing={billing} T={T}/>,
    expiry:    <ExpiryAlerts inventory={inventory} T={T}/>,
    reports:   <Reports billing={billing} inventory={inventory} purchases={purchases} suppliers={suppliers} customers={customers} T={T}/>,
    profile:   <ProfileSection T={T}/>,
    settings:  <SettingsSection setInventory={setInventory} setBilling={setBilling} setSuppliers={setSuppliers} setCustomers={setCustomers} T={T} themeKey={themeKey} setThemeKey={setThemeKey}/>,
  };

  const handleNav = (key) => { setActive(key); setSidebarOpen(false); };

  if(loading) return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:T.bg,flexDirection:"column",gap:14}}>
      <div style={{width:44,height:44,borderRadius:"50%",border:`4px solid ${T.border}`,borderTopColor:T.accent,animation:"spin 0.8s linear infinite"}}/>
      <div style={{fontSize:13,color:T.muted,fontWeight:600}}>Loading Pharmacy…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif",background:T.bg,transition:"background 0.3s"}}>
      <SyncPill/>
      <Navbar/>
      {!isMobile&&(
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          <aside style={{width:SIDEBAR_W,flexShrink:0,overflowY:"auto",boxShadow:"2px 0 12px rgba(0,0,0,0.18)"}}>
            <Sidebar active={active} onChange={setActive} userName={userName} facilityName={facilityName} onLogout={handleLogout} badges={badges} T={T} profilePhoto={profilePhoto}/>
          </aside>
          <main style={{flex:1,minWidth:0,padding:"26px 30px",overflowY:"auto",background:T.bg}}>
            {SECTIONS[active]||SECTIONS.dashboard}
          </main>
        </div>
      )}
      {isMobile&&(
        <>
          <div style={{position:"sticky",top:0,background:T.sidebar,borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:150,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{border:"none",background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:13,color:"#f1f5f9"}}>
              {sidebarOpen?"✕ Close":"☰ Menu"}
            </button>
            <span style={{fontWeight:700,fontSize:14,color:"#f1f5f9"}}>{NAV_GROUPS.flatMap(g=>g.items).find(i=>i.key===active)?.label||"Dashboard"}</span>
            <div style={{width:70}}/>
          </div>
          {sidebarOpen&&(
            <div style={{position:"fixed",inset:0,zIndex:140,display:"flex"}} onClick={()=>setSidebarOpen(false)}>
              <div style={{width:280,height:"100%",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
                <Sidebar active={active} onChange={handleNav} userName={userName} facilityName={facilityName} onLogout={handleLogout} badges={badges} T={T} profilePhoto={profilePhoto}/>
              </div>
              <div style={{flex:1,background:"rgba(0,0,0,0.5)"}}/>
            </div>
          )}
          <main style={{flex:1,padding:"16px 14px 20px",minWidth:0,overflowX:"hidden",background:T.bg}}>
            {SECTIONS[active]||SECTIONS.dashboard}
          </main>
        </>
      )}
    </div>
  );
}