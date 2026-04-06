import { useState,toast, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

//  THEME SYSTEM 
const PRESET_THEMES = [
  { name:"default",  label:"Ocean Blue",  accent:"#0369a1", accentHov:"#0284c7" },
  { name:"emerald",  label:"Emerald",     accent:"#059669", accentHov:"#047857" },
  { name:"violet",   label:"Violet",      accent:"#7c3aed", accentHov:"#6d28d9" },
  { name:"rose",     label:"Rose",        accent:"#e11d48", accentHov:"#be123c" },
  { name:"amber",    label:"Amber",       accent:"#d97706", accentHov:"#b45309" },
  { name:"teal",     label:"Teal",        accent:"#0f766e", accentHov:"#0d6460" },
  { name:"fuchsia",  label:"Fuchsia",     accent:"#a21caf", accentHov:"#86198f" },
  { name:"indigo",   label:"Indigo",      accent:"#4338ca", accentHov:"#3730a3" },
  { name:"slate",    label:"Slate",       accent:"#475569", accentHov:"#334155" },
  { name:"orange",   label:"Orange",      accent:"#ea580c", accentHov:"#c2410c" },
];
function hex2rgba(hex,a){try{const[r,g,b]=hex.replace("#","").match(/.{2}/g).map(x=>parseInt(x,16));return`rgba(${r},${g},${b},${a})`;}catch{return`rgba(3,105,161,${a})`;}}
function buildTheme(mode,accent,accentHov){
  const light={bg:"#f0f4f8",surface:"#ffffff",surface2:"#f8fafc",border:"#e2e8f0",border2:"#cbd5e1",text:"#0f172a",text2:"#334155",muted:"#64748b",accent,accentBg:hex2rgba(accent,.1),accentHov,danger:"#be123c",dangerBg:"#fff1f2",success:"#065f46",successBg:"#ecfdf5",warn:"#92400e",warnBg:"#fffbeb",purple:"#5b21b6",purpleBg:"#f5f3ff",sidebar:"#0f172a",sidebarText:"#94a3b8",sidebarActive:accent,sidebarActiveBg:hex2rgba(accent,.12)};
  const dark={bg:"#0a0f1e",surface:"#111827",surface2:"#1e293b",border:"#1e293b",border2:"#334155",text:"#f1f5f9",text2:"#cbd5e1",muted:"#64748b",accent,accentBg:hex2rgba(accent,.15),accentHov,danger:"#fb7185",dangerBg:hex2rgba("#fb7185",.12),success:"#34d399",successBg:hex2rgba("#34d399",.12),warn:"#fbbf24",warnBg:hex2rgba("#fbbf24",.12),purple:"#a78bfa",purpleBg:hex2rgba("#a78bfa",.12),sidebar:"#070c18",sidebarText:"#475569",sidebarActive:accent,sidebarActiveBg:hex2rgba(accent,.1)};
  return mode==="light"?light:dark;
}

// ── THEMES 
const THEMES = {
  light: {
    bg:"#f0f4f8",surface:"#ffffff",surface2:"#f8fafc",border:"#e2e8f0",border2:"#cbd5e1",
    text:"#0f172a",text2:"#334155",muted:"#64748b",accent:"#0369a1",accentBg:"#e0f2fe",
    accentHov:"#0284c7",danger:"#be123c",dangerBg:"#fff1f2",success:"#065f46",
    successBg:"#ecfdf5",warn:"#92400e",warnBg:"#fffbeb",purple:"#5b21b6",purpleBg:"#f5f3ff",
    sidebar:"#0f172a",sidebarText:"#94a3b8",sidebarActive:"#38bdf8",sidebarActiveBg:"rgba(56,189,248,0.12)",
    teal:"#0f766e",tealBg:"#f0fdfa",pink:"#9d174d",pinkBg:"#fdf2f8",
  },
  dark: {
    bg:"#0a0f1e",surface:"#111827",surface2:"#1e293b",border:"#1e293b",border2:"#334155",
    text:"#f1f5f9",text2:"#cbd5e1",muted:"#64748b",accent:"#38bdf8",accentBg:"rgba(56,189,248,0.12)",
    accentHov:"#0ea5e9",danger:"#fb7185",dangerBg:"rgba(251,113,133,0.12)",success:"#34d399",
    successBg:"rgba(52,211,153,0.12)",warn:"#fbbf24",warnBg:"rgba(251,191,36,0.12)",purple:"#a78bfa",
    purpleBg:"rgba(167,139,250,0.12)",sidebar:"#070c18",sidebarText:"#475569",
    sidebarActive:"#38bdf8",sidebarActiveBg:"rgba(56,189,248,0.1)",
    teal:"#2dd4bf",tealBg:"rgba(45,212,191,0.12)",pink:"#f472b6",pinkBg:"rgba(244,114,182,0.12)",
  },
};

//  CONSTANTS 
const BLOOD_GROUPS=["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const DEPT_LIST=["Cardiology","Orthopedics","General Medicine","Pediatrics","Neurology","Emergency","Radiology","Gynecology","ENT","Dermatology","Psychiatry","Oncology","Ophthalmology","Urology","Nephrology","Gastroenterology","Pulmonology","Endocrinology"];
const SHIFTS=["Morning","Afternoon","Evening","Night"];
const GENDERS=["Male","Female","Other","Prefer not to say"];
const FREQ_LIST=["Once daily","Twice daily","Thrice daily","Every 6 hours","Every 8 hours","Every 12 hours","As needed","Before meals","After meals","At bedtime","With food","Weekly"];
const DURATION_LIST=["1 day","2 days","3 days","5 days","7 days","10 days","14 days","21 days","1 month","2 months","3 months","6 months","Ongoing"];
const PAYMENT_MODES=["Cash","Credit Card","Debit Card","UPI","Net Banking","Insurance","Cheque","DD"];
const QUALIFICATIONS_BASE=["MBBS","MD","MS","DNB","DM","MCh","BDS","MDS","BAMS","BHMS","BPT","MPT","Ph.D","FRCS","MRCP","Fellowship"];
const SPECIALIZATIONS_BASE=[...DEPT_LIST,"Sports Medicine","Geriatrics","Neonatology","Rheumatology","Infectious Disease","Palliative Care","Nuclear Medicine","Interventional Cardiology","Plastic Surgery","Vascular Surgery","Spine Surgery","Hand Surgery","Transplant Surgery"];
const COMMON_MEDICINES=[
  {name:"Paracetamol 500mg",salt:"Paracetamol",category:"Analgesic",price:2},
  {name:"Amoxicillin 500mg",salt:"Amoxicillin",category:"Antibiotic",price:12},
  {name:"Ibuprofen 400mg",salt:"Ibuprofen",category:"NSAID",price:5},
  {name:"Omeprazole 20mg",salt:"Omeprazole",category:"PPI",price:8},
  {name:"Metformin 500mg",salt:"Metformin",category:"Antidiabetic",price:4},
  {name:"Atorvastatin 10mg",salt:"Atorvastatin",category:"Statin",price:15},
  {name:"Amlodipine 5mg",salt:"Amlodipine",category:"CCB",price:6},
  {name:"Azithromycin 500mg",salt:"Azithromycin",category:"Antibiotic",price:35},
  {name:"Cetirizine 10mg",salt:"Cetirizine",category:"Antihistamine",price:3},
  {name:"Pantoprazole 40mg",salt:"Pantoprazole",category:"PPI",price:10},
  {name:"Cefixime 200mg",salt:"Cefixime",category:"Antibiotic",price:28},
  {name:"Dolo 650mg",salt:"Paracetamol",category:"Analgesic",price:3},
  {name:"Vitamin D3 60K",salt:"Cholecalciferol",category:"Supplement",price:45},
  {name:"Vitamin B12 500mcg",salt:"Cyanocobalamin",category:"Supplement",price:20},
  {name:"Aspirin 75mg",salt:"Aspirin",category:"Antiplatelet",price:2},
  {name:"Metronidazole 400mg",salt:"Metronidazole",category:"Antibiotic",price:7},
  {name:"Losartan 50mg",salt:"Losartan",category:"ARB",price:9},
  {name:"Lisinopril 10mg",salt:"Lisinopril",category:"ACE Inhibitor",price:8},
  {name:"Furosemide 40mg",salt:"Furosemide",category:"Diuretic",price:5},
  {name:"Insulin Regular 40IU",salt:"Insulin",category:"Antidiabetic",price:180},
];

// UTILS 
function useWindowWidth(){const[w,setW]=useState(window.innerWidth);useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w;}
function getToken(){const keys=["hospitalToken","hospital_token","token","authToken","hToken","jwtToken","accessToken"];for(const k of keys){const v=localStorage.getItem(k);if(v?.startsWith("eyJ"))return v;}try{const u=JSON.parse(localStorage.getItem("hospitalUser")||"{}");if(u.token?.startsWith("eyJ"))return u.token;}catch{}for(const k of Object.keys(localStorage)){const v=localStorage.getItem(k);if(v?.startsWith("eyJ")&&v.split(".").length===3)return v;}return null;}
async function apiFetch(path,opts={}){const token=getToken();const res=await fetch(`${BASE_API}${path}`,{...opts,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{}),...opts.headers}});if(!res.ok)throw new Error(`${res.status}`);return res.json();}
async function saveSection(section, data) {
  try {
    const token = getToken();
    const res = await fetch(`${BASE_API}/api/hospital/dashboard/update`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ section, data }),
    });
 
    const json = await res.json().catch(() => ({}));
 
    if (!res.ok || !json.success) {
      const msg = json.message || `Failed to save ${section}`;
      console.error("saveSection failed:", section, msg);
      if (typeof toast !== "undefined") {
        toast.error(`Auto-save failed for ${section}. Data kept locally.`, { duration: 4000 });
      }
      return false;
    }
 
    return true;
  } catch (e) {
    console.error("saveSection network error:", section, e.message);
    if (typeof toast !== "undefined") {
      toast.error(`Network error — ${section} not saved to server.`, { duration: 4000 });
    }
    return false;
  }
}
const lsGet=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
function getHospitalId(){try{const u=JSON.parse(localStorage.getItem("hospitalUser")||"{}");return u._id||u.id||"default";}catch{return"default";}}
function getKeys(){const id=getHospitalId();return{patients:`hd_${id}_patients`,appointments:`hd_${id}_appointments`,doctors:`hd_${id}_doctors`,departments:`hd_${id}_departments`,lab:`hd_${id}_lab`,pharmacy:`hd_${id}_pharmacy`,billing:`hd_${id}_billing`,inventory:`hd_${id}_inventory`,staff:`hd_${id}_staff`,prescriptions:`hd_${id}_prescriptions`};}
function useStore(cacheKey, initial, section) {
  const [data, setData] = useState(() => lsGet(cacheKey, initial));
  const timer = useRef(null);
 
  const set = useCallback((fn) => {
    setData((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;

      lsSet(cacheKey, next);

      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        saveSection(section, next);
      }, 800);
 
      return next;
    });
  }, [cacheKey, section]);
 
  return [data, set];
}
function genPatientId(list){const max=list.map(p=>parseInt((p.patientId||"PT-000").replace("PT-",""))||0);return`PT-${String(Math.max(0,...max)+1).padStart(4,"0")}`;}
function genTokenNo(list){const max=list.map(p=>parseInt(p.tokenNo||"0")||0);return Math.max(0,...max)+1;}
function genPrescriptionId(list){const max=list.map(p=>parseInt((p.prescriptionId||"RX-000").replace("RX-",""))||0);return`RX-${String(Math.max(0,...max)+1).padStart(4,"0")}`;}
function genId(prefix,list){const nums=list.map(i=>parseInt((i.id||"0").replace(/\D/g,""))||0);return`${prefix}-${String(Math.max(0,...nums)+1).padStart(3,"0")}`;}
const today=()=>new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
const todayISO=()=>new Date().toISOString().split("T")[0];
const now=()=>new Date().toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
const fmtDate=d=>d?new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—";
const fmtAmt=a=>`₹${(a||0).toLocaleString("en-IN")}`;
const card=(T,extra={})=>({background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,.06)",...extra});

//  PDF/PRINT UTILITIES 
//  PROFESSIONAL PRINT SYSTEM (Lab-Report Style)
function getHospInfo(){const s=JSON.parse(localStorage.getItem("hospitalUser")||"{}");return{name:s.facilityName||"Hospital",city:s.city||"",state:s.state||"",phone:s.phone||"",email:s.email||"",logo:s.profilePhotoUrl||"",accent:s.themeColor||"#0369a1",regNo:s.registrationNumber||"",licenseNo:s.licenseNumber||"",facilityType:s.facilityType||"Hospital"};}

function getPrintCSS(accent="#0369a1"){
  return`<style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#222;background:#fff;font-size:12px;}
    .page{max-width:900px;margin:0 auto;border:1px solid #ccc;}
    /* TOP HEADER */
    .doc-header{background:${accent};color:#fff;display:flex;justify-content:space-between;align-items:center;padding:14px 22px;gap:16px;}
    .dh-left{display:flex;align-items:center;gap:14px;}
    .dh-logo{width:60px;height:60px;border-radius:8px;object-fit:cover;border:2px solid rgba(255,255,255,0.5);flex-shrink:0;}
    .dh-logo-ph{width:60px;height:60px;border-radius:8px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#fff;flex-shrink:0;}
    .dh-hosp-name{font-size:19px;font-weight:800;margin-bottom:2px;}
    .dh-hosp-sub{font-size:9.5px;opacity:.88;line-height:1.5;}
    .dh-right{text-align:right;min-width:200px;}
    .dh-bioburg{font-size:21px;font-weight:900;opacity:.95;}
    .dh-tagline{font-size:9px;opacity:.75;margin-bottom:5px;}
    .dh-doc-type{font-size:12.5px;font-weight:700;background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.3);border-radius:5px;padding:3px 11px;display:inline-block;}
    .dh-doc-id{font-size:9.5px;opacity:.8;margin-top:3px;}
    /* CONTACT BAR */
    .sub-hdr{background:${accent}18;border-bottom:2px solid ${accent};display:flex;justify-content:space-between;align-items:center;padding:6px 22px;font-size:10px;color:#333;flex-wrap:wrap;gap:6px;}
    .sh-lbl{font-weight:700;color:${accent};margin-right:3px;}
    /* INFO BAR */
    .info-bar{display:flex;justify-content:space-between;flex-wrap:wrap;padding:10px 22px;background:#f8fafc;border-bottom:1px solid #e2e8f0;gap:16px;}
    .ib-field{display:flex;flex-direction:column;min-width:100px;}
    .ib-lbl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:1px;}
    .ib-val{font-size:11.5px;font-weight:600;color:#111;}
    /* SECTION */
    .sec-title{background:${accent}12;border-left:4px solid ${accent};padding:5px 12px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${accent};margin:12px 22px 6px;}
    .body{padding:0 22px 14px;}
    /* GRIDS */
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:7px 26px;margin:8px 0;}
    .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px 18px;margin:8px 0;}
    .g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:7px 14px;margin:8px 0;}
    .fl{font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:1px;letter-spacing:.06em;}
    .fv{font-size:12px;color:#222;font-weight:400;}
    /* TABLE — lab-report style */
    table{width:100%;border-collapse:collapse;font-size:11.5px;margin:6px 0;}
    thead tr{background:${accent};}
    th{padding:6px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#fff;}
    td{padding:6px 10px;border-bottom:1px solid #f0f0f0;color:#222;font-weight:400;}
    tr:nth-child(even) td{background:#fafafa;}
    tr:last-child td{border-bottom:none;}
    /* AMOUNT BOX */
    .amt-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:11px 14px;margin-top:10px;max-width:300px;margin-left:auto;}
    .amt-row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;color:#555;}
    .amt-total{display:flex;justify-content:space-between;font-size:14px;font-weight:800;padding-top:7px;border-top:2px solid ${accent};color:${accent};margin-top:3px;}
    /* TOKEN */
    .token{background:${accent};color:#fff;border-radius:6px;padding:4px 13px;font-size:17px;font-weight:800;display:inline-block;margin-bottom:6px;letter-spacing:1px;}
    /* ALERTS */
    .alert-danger{background:#fff1f2;border:1px solid #fca5a5;border-radius:5px;padding:7px 11px;font-size:11px;color:#b91c1c;margin:6px 0;}
    /* SIGNATURES */
    .sig-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px;padding:0 6px;}
    .sig-block{text-align:center;min-width:150px;}
    .sig-line{border-top:1px solid #444;padding-top:5px;margin-top:34px;font-size:10px;color:#444;}
    .sig-name{font-weight:700;font-size:10.5px;color:#111;}
    .sig-role{font-size:9px;color:#666;margin-top:1px;}
    /* FOOTER */
    .doc-footer{background:${accent};color:#fff;padding:8px 22px;display:flex;justify-content:space-between;align-items:center;font-size:9.5px;margin-top:8px;}
    .df-left{display:flex;gap:16px;flex-wrap:wrap;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{border:none;}}
  </style>`;}

// Legacy compat
function shareAsPDF(t,h){printDoc(t,h);}

function printDoc(title,bodyHtml,docId=""){
  const h=getHospInfo();
  const accent=h.accent||"#0369a1";
  const logoHtml=h.logo?`<img src="${h.logo}" class="dh-logo" alt="logo"/>`:`<div class="dh-logo-ph">${(h.name||"H").charAt(0).toUpperCase()}</div>`;
  const printedAt=new Date().toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const w=window.open("","_blank");
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>${getPrintCSS(accent)}</head><body>
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">
        ${logoHtml}
        <div>
          <div class="dh-hosp-name">${h.name}</div>
          <div class="dh-hosp-sub">${h.facilityType||"Hospital"}</div>
          ${h.regNo?`<div class="dh-hosp-sub">Reg: ${h.regNo}${h.licenseNo?" | Lic: "+h.licenseNo:""}</div>`:""}
          <div class="dh-hosp-sub">${[h.city,h.state].filter(Boolean).join(", ")}</div>
        </div>
      </div>
      <div class="dh-right">
        <div class="dh-bioburg">Bioburg</div>
        <div class="dh-tagline">HMS Platform</div>
        <div class="dh-doc-type">${title}</div>
        ${docId?`<div class="dh-doc-id">Ref: ${docId}</div>`:""}
        <div class="dh-doc-id">Printed: ${printedAt}</div>
      </div>
    </div>
    <div class="sub-hdr">
      ${h.phone?`<span><span class="sh-lbl"></span>${h.phone}</span>`:""}
      ${h.email?`<span><span class="sh-lbl"></span>${h.email}</span>`:""}
      ${h.licenseNo?`<span><span class="sh-lbl">Lic:</span>${h.licenseNo}</span>`:""}
      <span style="opacity:.6;font-style:italic">Computer-Generated Document</span>
    </div>
    ${bodyHtml}
    <div class="doc-footer">
      <div class="df-left">
        ${h.phone?`<span>${h.phone}</span>`:""}
        ${h.email?`<span>${h.email}</span>`:""}
        ${[h.city,h.state].filter(Boolean).length?`<span> ${[h.city,h.state].filter(Boolean).join(", ")}</span>`:""}
      </div>
      <span>Powered by Bioburg</span>
    </div>
  </div></body></html>`);
  w.document.close();w.print();
}



// ── COMPONENTS 
function Badge({status,T}){
  const MAP={
    "Active":{c:T.success,bg:T.successBg},"Admitted":{c:T.accent,bg:T.accentBg},"OPD":{c:T.success,bg:T.successBg},
    "Discharged":{c:T.muted,bg:T.surface2},"Emergency":{c:T.danger,bg:T.dangerBg},"Confirmed":{c:T.success,bg:T.successBg},
    "Waiting":{c:T.warn,bg:T.warnBg},"Cancelled":{c:T.danger,bg:T.dangerBg},"In Progress":{c:T.accent,bg:T.accentBg},
    "Completed":{c:T.success,bg:T.successBg},"Pending":{c:T.warn,bg:T.warnBg},"Dispensed":{c:T.success,bg:T.successBg},
    "Paid":{c:T.success,bg:T.successBg},"Unpaid":{c:T.danger,bg:T.dangerBg},"Partial":{c:T.warn,bg:T.warnBg},
    "Available":{c:T.success,bg:T.successBg},"On Leave":{c:T.warn,bg:T.warnBg},"In Stock":{c:T.success,bg:T.successBg},
    "Low Stock":{c:T.danger,bg:T.dangerBg},"Normal":{c:T.success,bg:T.successBg},"Abnormal":{c:T.danger,bg:T.dangerBg},
    "Male":{c:T.accent,bg:T.accentBg},"Female":{c:T.purple,bg:T.purpleBg},
  };
  const s=MAP[status]||{c:T.muted,bg:T.surface2};
  return <span style={{background:s.bg,color:s.c,border:`1px solid ${s.c}`,borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{status}</span>;
}

function Btn({label,onClick,variant="primary",small,icon,T,disabled,style={}}){
  const[h,setH]=useState(false);
  const V={
    primary:{bg:h?T.accentHov:T.accent,color:"#fff",border:"none"},
    secondary:{bg:h?T.surface2:T.surface,color:T.text2,border:`1px solid ${T.border2}`},
    danger:{bg:h?T.dangerBg:T.dangerBg,color:T.danger,border:`1px solid ${T.danger}`},
    ghost:{bg:h?T.accentBg:"transparent",color:T.accent,border:"none"},
    success:{bg:h?"#059669":T.success,color:"#fff",border:"none"},
    teal:{bg:h?T.tealBg:"transparent",color:T.teal,border:`1px solid ${T.teal}`},
  };
  const s=V[variant]||V.primary;
  return(
    <button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{padding:small?"5px 12px":"8px 18px",borderRadius:9,border:s.border,background:s.bg,color:s.color,cursor:disabled?"not-allowed":"pointer",fontWeight:600,fontSize:small?11.5:13,fontFamily:"inherit",transition:"all 0.15s",whiteSpace:"nowrap",opacity:disabled?.5:1,display:"flex",alignItems:"center",gap:5,...style}}>
      {icon&&<span style={{fontSize:13}}>{icon}</span>}{label}
    </button>
  );
}

// Medicine Autocomplete Component
function MedicineAutocomplete({value,onChange,inventory,T,placeholder="Search medicine or salt name…"}){
  const[open,setOpen]=useState(false);
  const[q,setQ]=useState(value||"");
  const ref=useRef(null);
  
  // Merge inventory medicines with common list
  const allMeds=useMemo(()=>{
    const invMeds=(inventory||[]).filter(i=>i.category==="Medicine"||i.item).map(i=>({name:i.item,salt:i.salt||"",category:i.category||"Medicine",price:parseFloat(i.price)||0}));
    const merged=[...COMMON_MEDICINES,...invMeds];
    const seen=new Set();
    return merged.filter(m=>{if(seen.has(m.name))return false;seen.add(m.name);return true;});
  },[inventory]);

  const filtered=useMemo(()=>{
    if(!q||q.length<2)return[];
    const lq=q.toLowerCase();
    return allMeds.filter(m=>m.name.toLowerCase().includes(lq)||m.salt.toLowerCase().includes(lq)||m.category.toLowerCase().includes(lq)).slice(0,8);
  },[q,allMeds]);

  useEffect(()=>{
    const handler=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);return()=>document.removeEventListener("mousedown",handler);
  },[]);

  const select=(med)=>{setQ(med.name);onChange(med);setOpen(false);};

  return(
    <div ref={ref} style={{position:"relative"}}>
      <input value={q} onChange={e=>{setQ(e.target.value);onChange({name:e.target.value,salt:"",price:0});setOpen(true);}}
        onFocus={()=>setOpen(true)} placeholder={placeholder}
        style={{width:"100%",padding:"9px 12px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface2,color:T.text}}/>
      {open&&filtered.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:9999,background:T.surface,border:`1px solid ${T.border2}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",marginTop:2}}>
          {filtered.map((med,i)=>(
            <div key={i} onClick={()=>select(med)} style={{padding:"9px 14px",cursor:"pointer",borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.accentBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div>
                <div style={{fontWeight:700,color:T.text,fontSize:13}}>{med.name}</div>
                <div style={{fontSize:10.5,color:T.muted}}>Salt: {med.salt} · {med.category}</div>
              </div>
              {med.price>0&&<span style={{fontSize:11,color:T.success,fontWeight:700}}>₹{med.price}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Multi-medicine table component
function MedicineTable({medicines,setMedicines,T,inventory,showPrice=false}){
  const addMed=()=>setMedicines(m=>[...m,{name:"",salt:"",dosage:"",frequency:"Twice daily",duration:"7 days",qty:1,price:0,instructions:""}]);
  const removeMed=i=>setMedicines(m=>m.filter((_,idx)=>idx!==i));
  const updateMed=(i,field,val)=>setMedicines(m=>m.map((x,idx)=>idx===i?{...x,[field]:val}:x));

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:11.5,fontWeight:800,color:T.accent,textTransform:"uppercase",letterSpacing:".1em"}}>Medicines / Drugs</div>
        <Btn T={T} label="+ Add Medicine" variant="ghost" small onClick={addMed}/>
      </div>
      {medicines.map((med,i)=>(
        <div key={i} style={{background:T.surface2,borderRadius:10,border:`1px solid ${T.border}`,padding:"12px",marginBottom:8}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:"0 10px",marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Medicine Name / Salt</div>
              <MedicineAutocomplete T={T} inventory={inventory} value={med.name}
                onChange={m=>updateMed(i,"name",m.name||m)&&updateMed(i,"salt",m.salt||"")||setMedicines(ms=>ms.map((x,idx)=>idx===i?{...x,name:m.name||m,salt:m.salt||"",price:m.price||x.price}:x))}/>
            </div>
            <div>
              <div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Dosage</div>
              <input value={med.dosage} onChange={e=>updateMed(i,"dosage",e.target.value)} placeholder="e.g. 500mg"
                style={{width:"100%",padding:"9px 10px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface,color:T.text}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Qty</div>
              <input type="number" value={med.qty||1} onChange={e=>updateMed(i,"qty",e.target.value)} min={1}
                style={{width:"100%",padding:"9px 10px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface,color:T.text}}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"+(showPrice?" 1fr":""),gap:"0 10px",marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Frequency</div>
              <select value={med.frequency} onChange={e=>updateMed(i,"frequency",e.target.value)}
                style={{width:"100%",padding:"9px 10px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface,color:T.text,cursor:"pointer"}}>
                {FREQ_LIST.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Duration</div>
              <select value={med.duration} onChange={e=>updateMed(i,"duration",e.target.value)}
                style={{width:"100%",padding:"9px 10px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface,color:T.text,cursor:"pointer"}}>
                {DURATION_LIST.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {showPrice&&(
              <div>
                <div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Price/unit (₹)</div>
                <input type="number" value={med.price||0} onChange={e=>updateMed(i,"price",parseFloat(e.target.value)||0)}
                  style={{width:"100%",padding:"9px 10px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface,color:T.text}}/>
              </div>
            )}
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Instructions</div>
              <input value={med.instructions||""} onChange={e=>updateMed(i,"instructions",e.target.value)} placeholder="e.g. Take with food, avoid alcohol…"
                style={{width:"100%",padding:"9px 10px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface,color:T.text}}/>
            </div>
            {medicines.length>1&&<Btn T={T} label="✕ Remove" variant="danger" small onClick={()=>removeMed(i)}/>}
          </div>
        </div>
      ))}
    </div>
  );
}

// Billing Amount with discount/addon
function BillingCalculator({services,setServices,discount,setDiscount,discountType,setDiscountType,addons,setAddons,T}){
  const subtotal=services.reduce((a,s)=>a+(parseFloat(s.amount)||0),0);
  const discAmt=discountType==="percent"?subtotal*(parseFloat(discount)||0)/100:parseFloat(discount)||0;
  const addonTotal=addons.reduce((a,x)=>a+(parseFloat(x.amount)||0),0);
  const total=Math.max(0,subtotal-discAmt+addonTotal);

  const addService=()=>setServices(s=>[...s,{name:"",amount:""}]);
  const addAddon=()=>setAddons(a=>[...a,{name:"",amount:""}]);

  return(
    <div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11.5,fontWeight:800,color:T.accent,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Services / Charges</div>
        {services.map((s,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
            <input value={s.name} onChange={e=>setServices(ss=>ss.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder="Service name" style={{flex:2,padding:"8px 10px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface2,color:T.text}}/>
            <input type="number" value={s.amount} onChange={e=>setServices(ss=>ss.map((x,j)=>j===i?{...x,amount:e.target.value}:x))} placeholder="₹" style={{flex:1,padding:"8px 10px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface2,color:T.text}}/>
            {services.length>1&&<button onClick={()=>setServices(ss=>ss.filter((_,j)=>j!==i))} style={{border:"none",background:T.dangerBg,color:T.danger,borderRadius:7,padding:"6px 10px",cursor:"pointer",fontWeight:700,fontSize:13}}>✕</button>}
          </div>
        ))}
        <Btn T={T} label="+ Add Service" variant="ghost" small onClick={addService} style={{marginTop:4}}/>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11.5,fontWeight:800,color:T.purple,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Add-ons / Extra Charges</div>
        {addons.map((a,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
            <input value={a.name} onChange={e=>setAddons(aa=>aa.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder="Add-on name (e.g. Consumables)" style={{flex:2,padding:"8px 10px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface2,color:T.text}}/>
            <input type="number" value={a.amount} onChange={e=>setAddons(aa=>aa.map((x,j)=>j===i?{...x,amount:e.target.value}:x))} placeholder="₹" style={{flex:1,padding:"8px 10px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface2,color:T.text}}/>
            <button onClick={()=>setAddons(aa=>aa.filter((_,j)=>j!==i))} style={{border:"none",background:T.dangerBg,color:T.danger,borderRadius:7,padding:"6px 10px",cursor:"pointer",fontWeight:700,fontSize:13}}>✕</button>
          </div>
        ))}
        <Btn T={T} label="+ Add Extra" variant="ghost" small onClick={addAddon} style={{marginTop:4}}/>
      </div>
      <div style={{background:T.surface2,borderRadius:10,border:`1px solid ${T.border}`,padding:"14px 16px"}}>
        <div style={{fontSize:11.5,fontWeight:800,color:T.success,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Billing Summary</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}><span style={{color:T.muted}}>Subtotal</span><strong style={{color:T.text}}>{fmtAmt(subtotal)}</strong></div>
        <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
          <span style={{fontSize:12,color:T.muted,width:70,flexShrink:0}}>Discount</span>
          <input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0" style={{flex:1,padding:"6px 8px",borderRadius:7,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface,color:T.text}}/>
          <select value={discountType} onChange={e=>setDiscountType(e.target.value)} style={{padding:"6px 8px",borderRadius:7,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface,color:T.text}}>
            <option value="percent">%</option>
            <option value="flat">₹ Flat</option>
          </select>
          {discAmt>0&&<span style={{fontSize:11,color:T.danger,fontWeight:700}}>-{fmtAmt(discAmt)}</span>}
        </div>
        {addonTotal>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}><span style={{color:T.muted}}>Add-ons</span><span style={{color:T.purple,fontWeight:600}}>+{fmtAmt(addonTotal)}</span></div>}
        <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:800,paddingTop:8,borderTop:`2px solid ${T.border}`,marginTop:4}}><span style={{color:T.text}}>Total</span><span style={{color:T.accent}}>{fmtAmt(total)}</span></div>
      </div>
    </div>
  );
}

// Qualification + Specialization with custom add-ons
function MultiSelectDropdown({label,options,selected,setSelected,T,placeholder="Select or type to add…"}){
  const[input,setInput]=useState("");
  const[open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const toggle=(v)=>setSelected(sel=>sel.includes(v)?sel.filter(x=>x!==v):[...sel,v]);
  const addCustom=()=>{if(input.trim()&&!selected.includes(input.trim())){setSelected(s=>[...s,input.trim()]);setInput("");}};
  const filtered=options.filter(o=>o.toLowerCase().includes(input.toLowerCase())&&!selected.includes(o));

  return(
    <div ref={ref} style={{marginBottom:14}}>
      {label&&<div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</div>}
      <div style={{border:`1.5px solid ${T.border2}`,borderRadius:9,background:T.surface2,minHeight:44,padding:"6px 10px",cursor:"text"}} onClick={()=>setOpen(true)}>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
          {selected.map(s=>(
            <span key={s} style={{background:T.accentBg,color:T.accent,border:`1px solid ${T.accent}`,borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
              {s}<button onClick={e=>{e.stopPropagation();toggle(s);}} style={{border:"none",background:"none",cursor:"pointer",color:T.accent,fontSize:13,padding:0,lineHeight:1}}>×</button>
            </span>
          ))}
        </div>
        <div style={{display:"flex",gap:6}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onFocus={()=>setOpen(true)} placeholder={selected.length===0?placeholder:"Add more…"}
            style={{border:"none",background:"transparent",outline:"none",fontSize:12,fontFamily:"inherit",color:T.text,flex:1}}
            onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom();}}}/>
          {input.trim()&&<button onClick={addCustom} style={{border:"none",background:T.accentBg,color:T.accent,borderRadius:7,padding:"2px 8px",cursor:"pointer",fontSize:11,fontWeight:700}}>+ Add</button>}
        </div>
      </div>
      {open&&(filtered.length>0)&&(
        <div style={{position:"absolute",zIndex:9999,background:T.surface,border:`1px solid ${T.border2}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",marginTop:2,maxHeight:200,overflowY:"auto",minWidth:220}}>
          {filtered.map((opt,i)=>(
            <div key={opt} onClick={()=>toggle(opt)} style={{padding:"8px 14px",cursor:"pointer",fontSize:12,color:T.text,borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.accentBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FInput({label,value,onChange,type="text",options,required,T,placeholder,multiline,rows=3,readOnly}){
  const base={width:"100%",padding:"9px 12px",borderRadius:9,border:`1.5px solid ${T.border2}`,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:readOnly?T.bg:T.surface2,color:T.text,transition:"border 0.15s"};
  const focusStyle=e=>{e.target.style.borderColor=T.accent;e.target.style.background=T.surface;};
  const blurStyle=e=>{e.target.style.borderColor=T.border2;e.target.style.background=readOnly?T.bg:T.surface2;};
  return(
    <div style={{marginBottom:14}}>
      {label&&<div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}{required&&<span style={{color:T.danger}}> *</span>}</div>}
      {options
        ?<select value={value} onChange={e=>onChange(e.target.value)} style={{...base,cursor:"pointer"}} onFocus={focusStyle} onBlur={blurStyle} disabled={readOnly}><option value="">— Select —</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>
        :multiline
          ?<textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{...base,resize:"vertical"}} onFocus={focusStyle} onBlur={blurStyle} readOnly={readOnly}/>
          :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={focusStyle} onBlur={blurStyle} readOnly={readOnly}/>
      }
    </div>
  );
}

function Modal({title,onClose,children,T,wide,extraWide}){
  const w=useWindowWidth();const mob=w<640;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:9999,display:"flex",alignItems:mob?"flex-end":"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:T.surface,borderRadius:mob?"18px 18px 0 0":16,width:mob?"100%":extraWide?"min(960px,96vw)":wide?"min(760px,95vw)":"min(560px,95vw)",maxHeight:mob?"92vh":"88vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.3)",padding:mob?"20px 14px":"28px 30px",border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:800,color:T.text}}>{title}</h2>
          <button onClick={onClose} style={{border:"none",background:T.surface2,borderRadius:8,cursor:"pointer",padding:"6px 12px",fontSize:16,color:T.muted}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({message,onConfirm,onClose,T}){
  return(
    <Modal title="Confirm Action" onClose={onClose} T={T}>
      <p style={{color:T.text2,fontSize:14,marginBottom:24,lineHeight:1.6}}>{message}</p>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn label="Cancel" variant="secondary" onClick={onClose} T={T}/>
        <Btn label="Confirm Delete" variant="danger" onClick={onConfirm} T={T}/>
      </div>
    </Modal>
  );
}

function PageHeader({title,subtitle,action,T}){
  const w=useWindowWidth();const mob=w<640;
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:mob?"flex-start":"center",flexDirection:mob?"column":"row",gap:mob?12:0,marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:4,height:36,borderRadius:4,background:T.accent,flexShrink:0}}/>
        <div>
          <h1 style={{margin:0,fontSize:mob?18:22,fontWeight:800,color:T.text,letterSpacing:"-0.4px"}}>{title}</h1>
          {subtitle&&<p style={{margin:"3px 0 0",fontSize:12.5,color:T.muted}}>{subtitle}</p>}
        </div>
      </div>
      {action&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{action}</div>}
    </div>
  );
}

function StatCard({label,value,sub,color,icon,T}){
  return(
    <div style={{...card(T,{padding:"18px 20px",borderTop:`3px solid ${color}`})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{fontSize:10.5,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.09em"}}>{label}</div>
        {icon&&<span style={{fontSize:20,opacity:.7}}>{icon}</span>}
      </div>
      <div style={{fontSize:28,fontWeight:800,color:T.text,letterSpacing:"-1.5px",lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:12,color:T.muted,marginTop:6}}>{sub}</div>}
    </div>
  );
}

function SearchInput({value,onChange,placeholder,T}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,background:T.surface2,border:`1.5px solid ${T.border2}`,borderRadius:10,padding:"8px 14px",minWidth:220,boxSizing:"border-box"}}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth={2.5} strokeLinecap="round"><circle cx={11} cy={11} r={8}/><path d="m21 21-4.3-4.3"/></svg>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{border:"none",background:"transparent",outline:"none",fontSize:13,width:200,fontFamily:"inherit",color:T.text}}/>
    </div>
  );
}

function FilterTabs({tabs,active,onChange,counts,T}){
  const w=useWindowWidth();const mob=w<640;
  return(
    <div style={{display:"flex",flexWrap:"wrap",gap:2,background:T.surface2,borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
      {tabs.map(s=>(
        <button key={s} onClick={()=>onChange(s)} style={{padding:mob?"5px 8px":"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:mob?10:12,fontFamily:"inherit",background:active===s?T.accent:"transparent",color:active===s?"#fff":T.muted,transition:"all 0.13s"}}>
          {s==="all"?"All":s}
          <span style={{marginLeft:4,fontSize:9,fontWeight:700,background:active===s?"rgba(255,255,255,0.2)":T.border,color:active===s?"#fff":T.muted,borderRadius:20,padding:"0 5px"}}>{counts?.[s]??0}</span>
        </button>
      ))}
    </div>
  );
}

function DataTable({headers,rows,onEdit,onDelete,onPrint,onShare,T,printLabel,shareLabel}){
  return(
    <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:560,fontSize:12.5}}>
        <thead>
          <tr style={{background:T.surface2,borderBottom:`2px solid ${T.border}`}}>
            {headers.map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",whiteSpace:"nowrap"}}>{h}</th>)}
            {(onEdit||onDelete||onPrint||onShare)&&<th style={{padding:"10px 12px",textAlign:"center",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase"}}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length===0&&<tr><td colSpan={headers.length+1} style={{textAlign:"center",padding:"48px",color:T.muted,fontSize:13}}>No records found</td></tr>}
          {rows.map((row,i)=>(
            <tr key={i} style={{borderBottom:i<rows.length-1?`1px solid ${T.border}`:"none",transition:"background 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {row.cells.map((cell,j)=><td key={j} style={{padding:"11px 12px",color:T.text,verticalAlign:"middle"}}>{cell}</td>)}
              {(onEdit||onDelete||onPrint||onShare)&&(
                <td style={{padding:"11px 12px",textAlign:"center"}}>
                  <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>
                    {onEdit&&<Btn label="Edit" variant="secondary" small onClick={()=>onEdit(row.raw)} T={T}/>}
                    {onPrint&&<Btn label={printLabel||"🖨"} variant="ghost" small onClick={()=>onPrint(row.raw)} T={T}/>}
                    {onShare&&<Btn label={shareLabel||"📤"} variant="ghost" small onClick={()=>onShare(row.raw)} T={T}/>}
                    {onDelete&&<Btn label="Del" variant="danger" small onClick={()=>onDelete(row.raw)} T={T}/>}
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

function SectionCard({title,count,color,children,T,action}){
  return(
    <div style={{...card(T,{padding:0,overflow:"hidden"})}}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.surface2}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:9,height:9,borderRadius:"50%",background:color}}/>
          <span style={{fontWeight:700,fontSize:13,color:T.text}}>{title}</span>
          {count!==undefined&&<span style={{fontSize:10.5,background:color+"22",color:color,borderRadius:20,padding:"2px 7px",fontWeight:700}}>{count}</span>}
        </div>
        {action}
      </div>
      <div style={{padding:"14px 16px"}}>{children}</div>
    </div>
  );
}

//  PATIENT REGISTRATION with Token Number
function PatientRegistration({patients,setPatients,T}){
  const w=useWindowWidth();const mob=w<640;
  const[search,setSearch]=useState("");const[filter,setFilter]=useState("all");
  const[modal,setModal]=useState(null);const[confirm,setConfirm]=useState(null);const[form,setForm]=useState({});

  const f0={
    fullName:"",gender:"Male",dob:"",age:"",phone:"",email:"",address:"",city:"",state:"",pin:"",
    bloodGroup:"",allergies:"",existingDiseases:"",currentMedications:"",emergencyContact:"",
    dept:"General Medicine",doctorAssigned:"",appointmentTime:"",status:"OPD",
    registrationDate:today(),paymentMode:"Cash",insuranceProvider:"",insurancePolicyNo:"",
  };
  const F=v=>setForm(f=>({...f,...v}));
  const calcAge=dob=>{if(!dob)return"";const d=new Date(dob),n=new Date();let age=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))age--;return String(age);};

  const saveFn=()=>{
    if(!form.fullName||!form.phone)return alert("Full Name and Phone are required.");
    if(modal==="add"){const tokenNo=genTokenNo(patients);setPatients(prev=>[{...form,patientId:genPatientId(prev),tokenNo,registrationDate:today()},...prev]);}
    else setPatients(prev=>prev.map(x=>x.patientId===form.patientId?form:x));
    setModal(null);
  };

  const printPatient=(p)=>{
    const html=`
      <div class="section">
        <div class="token">Token #${p.tokenNo||"—"}</div>
        <div class="g2">
          ${[["Patient ID",p.patientId],["Name",p.fullName],["Age/Gender",`${p.age||"—"} yrs / ${p.gender||"—"}`],["Blood Group",p.bloodGroup||"—"],["Phone",p.phone||"—"],["Email",p.email||"—"]].map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
        </div>
      </div>
      <div class="section">
        <div class="sec-title">Medical Information</div>
        <div class="g2">
          ${[["Department",p.dept||"—"],["Doctor Assigned",p.doctorAssigned||"—"],["Status",p.status||"—"],["Appointment Time",p.appointmentTime||"—"],["Allergies",p.allergies||"None"],["Existing Conditions",p.existingDiseases||"None"]].map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
        </div>
      </div>
      <div class="section">
        <div class="sec-title">Payment & Contact</div>
        <div class="g2">
          ${[["Payment Mode",p.paymentMode||"Cash"],["Insurance",p.insuranceProvider||"—"],["Policy No.",p.insurancePolicyNo||"—"],["Emergency Contact",p.emergencyContact||"—"],["Registration Date",p.registrationDate||"—"],["Address",`${p.address||""}${p.city?", "+p.city:""}${p.state?", "+p.state:""}`]].map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
        </div>
      </div>`;
    printDoc(`Patient Card — ${p.fullName}`,html);
  };


  const tabs=["all","Admitted","OPD","Discharged","Emergency"];
  const filtered=patients.filter(p=>filter==="all"||p.status===filter).filter(p=>!search||p.fullName?.toLowerCase().includes(search.toLowerCase())||p.patientId?.toLowerCase().includes(search.toLowerCase())||p.phone?.includes(search));
  const counts=tabs.reduce((a,s)=>({...a,[s]:s==="all"?patients.length:patients.filter(p=>p.status===s).length}),{});

  return(
    <>
      <PageHeader T={T} title="Patient Registration" subtitle={`${patients.length} patients registered`}
        action={<><Btn T={T} label="Register Patient" onClick={()=>{setForm(f0);setModal("add");}}/></>}/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(5,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total" value={patients.length} color={T.accent}/>
        <StatCard T={T} label="Admitted" value={patients.filter(p=>p.status==="Admitted").length} color={T.purple}/>
        <StatCard T={T} label="OPD" value={patients.filter(p=>p.status==="OPD").length} color={T.success}/>
        <StatCard T={T} label="Emergency" value={patients.filter(p=>p.status==="Emergency").length} color={T.danger}/>
        <StatCard T={T} label="Discharged" value={patients.filter(p=>p.status==="Discharged").length} color={T.muted}/>
      </div>
      <div style={card(T,{padding:"16px"})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:mob?"flex-start":"center",flexDirection:mob?"column":"row",marginBottom:14,gap:10}}>
          <FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, ID, phone…" T={T}/>
        </div>
        <DataTable T={T}
          headers={["Token","Patient ID","Name","Age/Gender","Blood","Phone","Department","Status"]}
          rows={filtered.map(p=>({raw:p,cells:[
            <span style={{background:T.accentBg,color:T.accent,border:`1px solid ${T.accent}`,borderRadius:8,padding:"3px 10px",fontSize:13,fontWeight:800}}>#{p.tokenNo||"—"}</span>,
            <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{p.patientId}</span>,
            <div><div style={{fontWeight:700,color:T.text}}>{p.fullName}</div><div style={{fontSize:10.5,color:T.muted}}>{p.email||"—"}</div></div>,
            <div><div style={{fontWeight:600}}>{p.age||"—"} yrs</div><Badge status={p.gender} T={T}/></div>,
            <span style={{background:T.warnBg,color:T.warn,border:`1px solid ${T.warn}`,borderRadius:6,padding:"2px 7px",fontSize:11,fontWeight:700}}>{p.bloodGroup||"—"}</span>,
            p.phone,p.dept,<Badge status={p.status} T={T}/>
          ]}))}
          onEdit={p=>{setForm({...p});setModal("edit");}}
          onPrint={p=>printPatient(p)}
          onShare={p=>shareAsPDF(`Patient — ${p.fullName}`,`<div class="section"><div class="token">Token #${p.tokenNo||"—"}</div><div class="g2">${[["Patient ID",p.patientId],["Name",p.fullName],["Age",p.age||"—"],["Blood Group",p.bloodGroup||"—"],["Department",p.dept||"—"],["Status",p.status||"—"]].map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}</div></div>`)}
          printLabel="Full Card"   
          shareLabel="Token Slip" 
          onDelete={p=>setConfirm(p)}
        />
      </div>

      {modal&&(
        <Modal title={modal==="add"?"Register New Patient":"Edit Patient"} onClose={()=>setModal(null)} T={T} extraWide>
          {modal==="add"&&(
            <div style={{background:T.accentBg,border:`1px solid ${T.accent}`,borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:T.accent,fontWeight:600}}>
              Token number will be auto-assigned upon registration
            </div>
          )}
          {modal==="edit"&&form.tokenNo&&(
            <div style={{background:T.accentBg,border:`1px solid ${T.accent}`,borderRadius:10,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:11,color:T.accent,fontWeight:700,textTransform:"uppercase"}}>Token Number</span>
              <span style={{background:T.accent,color:"#fff",borderRadius:8,padding:"4px 14px",fontSize:18,fontWeight:800}}>#{form.tokenNo}</span>
            </div>
          )}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11.5,fontWeight:800,color:T.accent,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12,paddingBottom:7,borderBottom:`2px solid ${T.accentBg}`}}>Basic Information</div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:"0 18px"}}>
              <FInput T={T} label="Full Name" value={form.fullName||""} onChange={v=>F({fullName:v})} required/>
              <FInput T={T} label="Gender" value={form.gender||""} onChange={v=>F({gender:v})} options={GENDERS}/>
              <FInput T={T} label="Date of Birth" value={form.dob||""} onChange={v=>F({dob:v,age:calcAge(v)})} type="date"/>
              <FInput T={T} label="Age (years)" value={form.age||""} onChange={v=>F({age:v})} type="number" placeholder="Auto from DOB"/>
              <FInput T={T} label="Phone Number" value={form.phone||""} onChange={v=>F({phone:v})} required/>
              <FInput T={T} label="Email Address" value={form.email||""} onChange={v=>F({email:v})} type="email"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"2fr 1fr 1fr",gap:"0 18px"}}>
              <FInput T={T} label="Address" value={form.address||""} onChange={v=>F({address:v})}/>
              <FInput T={T} label="City" value={form.city||""} onChange={v=>F({city:v})}/>
              <FInput T={T} label="PIN Code" value={form.pin||""} onChange={v=>F({pin:v})}/>
            </div>
          </div>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11.5,fontWeight:800,color:T.purple,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12,paddingBottom:7,borderBottom:`2px solid ${T.purpleBg}`}}>Medical Information</div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px"}}>
              <FInput T={T} label="Blood Group" value={form.bloodGroup||""} onChange={v=>F({bloodGroup:v})} options={BLOOD_GROUPS}/>
              <FInput T={T} label="Emergency Contact (Name & Phone)" value={form.emergencyContact||""} onChange={v=>F({emergencyContact:v})}/>
              <FInput T={T} label="Allergies" value={form.allergies||""} onChange={v=>F({allergies:v})} placeholder="e.g. Penicillin, Pollen"/>
              <FInput T={T} label="Existing Diseases" value={form.existingDiseases||""} onChange={v=>F({existingDiseases:v})} placeholder="e.g. Diabetes, Hypertension"/>
              <div style={{gridColumn:mob?"1":"1/-1"}}><FInput T={T} label="Current Medications" value={form.currentMedications||""} onChange={v=>F({currentMedications:v})} multiline rows={2}/></div>
            </div>
          </div>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11.5,fontWeight:800,color:T.success,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12,paddingBottom:7,borderBottom:`2px solid ${T.successBg}`}}>Hospital & Payment</div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:"0 18px"}}>
              <FInput T={T} label="Department" value={form.dept||""} onChange={v=>F({dept:v})} options={DEPT_LIST}/>
              <FInput T={T} label="Doctor Assigned" value={form.doctorAssigned||""} onChange={v=>F({doctorAssigned:v})}/>
              <FInput T={T} label="Appointment Time" value={form.appointmentTime||""} onChange={v=>F({appointmentTime:v})} type="time"/>
              <FInput T={T} label="Status" value={form.status||""} onChange={v=>F({status:v})} options={["OPD","Admitted","Emergency","Discharged"]}/>
              <FInput T={T} label="Payment Mode" value={form.paymentMode||"Cash"} onChange={v=>F({paymentMode:v})} options={PAYMENT_MODES}/>
              {(form.paymentMode==="Insurance")&&<FInput T={T} label="Insurance Provider" value={form.insuranceProvider||""} onChange={v=>F({insuranceProvider:v})}/>}
              {(form.paymentMode==="Insurance")&&<FInput T={T} label="Policy Number" value={form.insurancePolicyNo||""} onChange={v=>F({insurancePolicyNo:v})}/>}
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Register Patient":"Save Changes"} onClick={saveFn}/>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal T={T} message={`Delete patient "${confirm.fullName}" (${confirm.patientId})?`} onConfirm={()=>{setPatients(p=>p.filter(x=>x.patientId!==confirm.patientId));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  PRESCRIPTION MANAGEMENT with multi-medicine autocomplete
function PrescriptionManagement({prescriptions,setPrescriptions,inventory,T}){
  const w=useWindowWidth();const mob=w<640;
  const[search,setSearch]=useState("");
  const[modal,setModal]=useState(null);const[confirm,setConfirm]=useState(null);const[form,setForm]=useState({});
  const[viewRx,setViewRx]=useState(null);
  const[medicines,setMedicines]=useState([{name:"",salt:"",dosage:"",frequency:"Twice daily",duration:"7 days",qty:1,price:0,instructions:""}]);

  const f0={prescriptionId:"",patientId:"",patientName:"",patientPhone:"",doctorName:"",diagnosis:"",testsRecommended:"",doctorNotes:"",nextVisitDate:"",date:today(),followUpInstructions:""};

  const openAdd=()=>{setForm(f0);setMedicines([{name:"",salt:"",dosage:"",frequency:"Twice daily",duration:"7 days",qty:1,price:0,instructions:""}]);setModal("add");};
  const openEdit=rx=>{setForm({...rx});setMedicines(rx.medicines||[{name:"",salt:"",dosage:"",frequency:"Twice daily",duration:"7 days",qty:1,price:0,instructions:""}]);setModal("edit");};

  const saveFn=()=>{
    if(!form.patientName||!form.doctorName||!form.diagnosis)return alert("Patient Name, Doctor and Diagnosis required.");
    const rx={...form,medicines,prescriptionId:form.prescriptionId||genPrescriptionId(prescriptions),date:form.date||today()};
    if(modal==="add")setPrescriptions(prev=>[rx,...prev]);
    else setPrescriptions(prev=>prev.map(x=>x.prescriptionId===rx.prescriptionId?rx:x));
    setModal(null);
  };

  const printRx=rx=>{
    const html=`
      <div class="section">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
          <div><div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:4px">Prescription ID</div><div style="font-size:18px;font-weight:800;color:#0369a1;font-family:monospace">${rx.prescriptionId}</div></div>
          <div style="font-size:48px;color:#0369a1;opacity:.1;font-family:Georgia;line-height:1">℞</div>
        </div>
        <div class="g2">
          ${[["Patient",rx.patientName],["Patient ID",rx.patientId||"—"],["Phone",rx.patientPhone||"—"],["Doctor","Dr. "+rx.doctorName],["Date",rx.date],["Diagnosis",rx.diagnosis],["Next Visit",rx.nextVisitDate?fmtDate(rx.nextVisitDate):"—"]].map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
        </div>
      </div>
      <div class="section">
        <div class="sec-title">Prescribed Medicines</div>
        <table><thead><tr><th>#</th><th>Medicine</th><th>Salt</th><th>Dosage</th><th>Freq</th><th>Duration</th><th>Qty</th><th>Instructions</th></tr></thead><tbody>
          ${(rx.medicines||[]).map((m,i)=>`<tr><td>${i+1}</td><td><strong>${m.name}</strong></td><td style="color:#64748b;font-size:11px">${m.salt||"—"}</td><td>${m.dosage||"—"}</td><td>${m.frequency}</td><td>${m.duration}</td><td>${m.qty||1}</td><td style="font-size:11px">${m.instructions||"—"}</td></tr>`).join("")}
        </tbody></table>
      </div>
      ${rx.testsRecommended?`<div class="section"><div class="sec-title">Tests Recommended</div><div class="fv">${rx.testsRecommended}</div></div>`:""}
      ${rx.doctorNotes?`<div class="section"><div class="sec-title">Doctor's Notes</div><div style="background:#fffbeb;border:1px solid #92400e;border-radius:8px;padding:12px;font-size:13px">${rx.doctorNotes}</div></div>`:""}
      ${rx.followUpInstructions?`<div class="section"><div class="sec-title">Follow-up Instructions</div><div class="fv">${rx.followUpInstructions}</div></div>`:""}
      <div style="margin-top:40px;display:flex;justify-content:flex-end"><div style="border-top:1px solid #1a1a2e;width:200px;padding-top:8px;font-size:12px">Dr. ${rx.doctorName}<br/>Signature</div></div>`;
    printDoc(`Prescription — ${rx.prescriptionId}`,html);
  };

  const filtered=prescriptions.filter(r=>!search||r.patientName?.toLowerCase().includes(search.toLowerCase())||r.prescriptionId?.toLowerCase().includes(search.toLowerCase())||r.doctorName?.toLowerCase().includes(search.toLowerCase()));

  return(
    <>
      <PageHeader T={T} title="Prescription Management" subtitle={`${prescriptions.length} prescriptions issued`}
        action={<Btn T={T} label="New Prescription" onClick={openAdd}/>}/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total Prescriptions" value={prescriptions.length} color={T.accent}/>
        <StatCard T={T} label="This Month" value={prescriptions.filter(r=>r.date?.includes(new Date().toLocaleDateString("en-IN",{month:"short"}))).length} color={T.success}/>
        <StatCard T={T} label="Tests Ordered" value={prescriptions.filter(r=>r.testsRecommended).length} color={T.purple}/>
      </div>
      <div style={card(T,{padding:"16px"})}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search patient, doctor, ID…" T={T}/>
        </div>
        <DataTable T={T}
          headers={["Rx ID","Patient","Doctor","Diagnosis","Medicines","Date","Next Visit"]}
          rows={filtered.map(r=>({raw:r,cells:[
            <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{r.prescriptionId}</span>,
            <div><div style={{fontWeight:700}}>{r.patientName}</div><div style={{fontSize:10.5,color:T.muted}}>{r.patientId||"—"}</div><div style={{fontSize:10.5,color:T.muted}}>{r.patientPhone||"—"}</div></div>,
            <span style={{fontWeight:600}}>Dr. {r.doctorName}</span>,
            <div style={{maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.diagnosis}</div>,
            <span style={{fontSize:11.5,color:T.muted}}>{r.medicines?.length||0} med{r.medicines?.length!==1?"s":""}</span>,
            r.date,
            r.nextVisitDate?<span style={{color:T.success,fontWeight:600}}>{fmtDate(r.nextVisitDate)}</span>:"—",
          ]}))}
          onEdit={r=>openEdit(r)}
          onPrint={r=>printRx(r)}
          onDelete={r=>setConfirm(r)}
        />
      </div>

      {viewRx&&(
        <Modal title={`Prescription — ${viewRx.prescriptionId}`} onClose={()=>setViewRx(null)} T={T} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            {[["Patient",viewRx.patientName],["Doctor","Dr. "+viewRx.doctorName],["Date",viewRx.date],["Diagnosis",viewRx.diagnosis]].map(([l,v])=>(
              <div key={l} style={{background:T.surface2,borderRadius:9,padding:"11px 13px",border:`1px solid ${T.border}`}}>
                <div style={{fontSize:9.5,color:T.muted,textTransform:"uppercase",fontWeight:700,marginBottom:3}}>{l}</div>
                <div style={{fontSize:13.5,fontWeight:600,color:T.text}}>{v}</div>
              </div>
            ))}
          </div>
          <SectionCard T={T} title="Medicines" count={viewRx.medicines?.length} color={T.accent}>
            {(viewRx.medicines||[]).map((m,i)=>(
              <div key={i} style={{padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><span style={{fontWeight:700,color:T.text}}>{i+1}. {m.name}</span>{m.salt&&<span style={{fontSize:11,color:T.muted,marginLeft:8}}>({m.salt})</span>}<span style={{fontSize:11.5,color:T.muted,marginLeft:8}}>{m.dosage}</span></div>
                  <div style={{display:"flex",gap:6}}>
                    <span style={{fontSize:11,color:T.accent,background:T.accentBg,borderRadius:6,padding:"2px 7px"}}>{m.frequency}</span>
                    <span style={{fontSize:11,color:T.muted,background:T.surface2,borderRadius:6,padding:"2px 7px",border:`1px solid ${T.border}`}}>{m.duration}</span>
                    <span style={{fontSize:11,color:T.purple,background:T.purpleBg,borderRadius:6,padding:"2px 7px"}}>Qty: {m.qty||1}</span>
                  </div>
                </div>
                {m.instructions&&<div style={{fontSize:11.5,color:T.muted,marginTop:4}}> {m.instructions}</div>}
              </div>
            ))}
          </SectionCard>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:14}}>
            <Btn T={T} label="🖨 Print" onClick={()=>printRx(viewRx)}/>
            <Btn T={T} label="📤 Share PDF" variant="secondary" onClick={()=>printRx(viewRx)}/>
            <Btn T={T} label="Close" variant="secondary" onClick={()=>setViewRx(null)}/>
          </div>
        </Modal>
      )}

      {modal&&(
        <Modal title={modal==="add"?"New Prescription":"Edit Prescription"} onClose={()=>setModal(null)} T={T} extraWide>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px",marginBottom:16}}>
            <FInput T={T} label="Patient Name" value={form.patientName||""} onChange={v=>setForm(f=>({...f,patientName:v}))} required/>
            <FInput T={T} label="Patient ID" value={form.patientId||""} onChange={v=>setForm(f=>({...f,patientId:v}))}/>
            <FInput T={T} label="Patient Phone" value={form.patientPhone||""} onChange={v=>setForm(f=>({...f,patientPhone:v}))} type="tel" placeholder="10-digit mobile number"/>
            <FInput T={T} label="Doctor Name" value={form.doctorName||""} onChange={v=>setForm(f=>({...f,doctorName:v}))} required/>
            <FInput T={T} label="Date" value={form.date||""} onChange={v=>setForm(f=>({...f,date:v}))} type="date"/>
            <div style={{gridColumn:mob?"1":"1/-1"}}><FInput T={T} label="Diagnosis" value={form.diagnosis||""} onChange={v=>setForm(f=>({...f,diagnosis:v}))} required/></div>
          </div>
          <MedicineTable medicines={medicines} setMedicines={setMedicines} T={T} inventory={inventory}/>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px",marginTop:16}}>
            <FInput T={T} label="Tests Recommended" value={form.testsRecommended||""} onChange={v=>setForm(f=>({...f,testsRecommended:v}))} placeholder="CBC, Blood Sugar, X-Ray…"/>
            <FInput T={T} label="Next Visit Date" value={form.nextVisitDate||""} onChange={v=>setForm(f=>({...f,nextVisitDate:v}))} type="date"/>
            <div style={{gridColumn:mob?"1":"1/-1"}}><FInput T={T} label="Doctor's Notes" value={form.doctorNotes||""} onChange={v=>setForm(f=>({...f,doctorNotes:v}))} multiline rows={2}/></div>
            <div style={{gridColumn:mob?"1":"1/-1"}}><FInput T={T} label="Follow-up Instructions" value={form.followUpInstructions||""} onChange={v=>setForm(f=>({...f,followUpInstructions:v}))} multiline rows={2}/></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Issue Prescription":"Save Changes"} onClick={saveFn}/>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal T={T} message={`Delete prescription ${confirm.prescriptionId}?`} onConfirm={()=>{setPrescriptions(p=>p.filter(x=>x.prescriptionId!==confirm.prescriptionId));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  BILLING with payment modes, discount, addons
function BillingSection({billing,setBilling,T}){
  const w=useWindowWidth();const mob=w<640;
  const[search,setSearch]=useState("");const[filter,setFilter]=useState("all");
  const[modal,setModal]=useState(null);const[confirm,setConfirm]=useState(null);const[form,setForm]=useState({});
  const[services,setServices]=useState([{name:"Consultation",amount:""}]);
  const[discount,setDiscount]=useState("0");const[discountType,setDiscountType]=useState("flat");
  const[addons,setAddons]=useState([]);

  const calcTotals=()=>{
    const sub=services.reduce((a,s)=>a+(parseFloat(s.amount)||0),0);
    const discAmt=discountType==="percent"?sub*(parseFloat(discount)||0)/100:parseFloat(discount)||0;
    const addonTotal=addons.reduce((a,x)=>a+(parseFloat(x.amount)||0),0);
    return{subtotal:sub,discAmt,addonTotal,total:Math.max(0,sub-discAmt+addonTotal)};
  };

  const f0={patient:"",patientId:"",patientPhone:"",dept:"General Medicine",date:today(),paymentMode:"Cash",insuranceProvider:"",insurancePolicyNo:"",cardLast4:"",upiId:"",status:"Unpaid",paid:"0",notes:""};
  
  const saveFn=()=>{
    if(!form.patient)return alert("Patient name required.");
    const{total,subtotal,discAmt,addonTotal}=calcTotals();
    const paidAmt=parseFloat(form.paid)||0;
    const status=paidAmt>=total?"Paid":paidAmt>0?"Partial":"Unpaid";
    if(modal==="add")setBilling(prev=>[{...form,id:genId("BL",prev),services,discount,discountType,addons,amount:total,subtotal,discAmt,addonTotal,paid:paidAmt,balance:Math.max(0,total-paidAmt),status},...prev]);
    else setBilling(prev=>prev.map(x=>x.id===form.id?{...form,services,discount,discountType,addons,amount:total,subtotal,discAmt,addonTotal,paid:paidAmt,balance:Math.max(0,total-paidAmt),status}:x));
    setModal(null);
  };

  const openAdd=()=>{setForm(f0);setServices([{name:"Consultation",amount:""}]);setDiscount("0");setDiscountType("flat");setAddons([]);setModal("add");};
  const openEdit=b=>{setForm({...b});setServices(b.services||[{name:"",amount:b.amount||""}]);setDiscount(b.discount||"0");setDiscountType(b.discountType||"flat");setAddons(b.addons||[]);setModal("edit");};

  const printBill=b=>{
    const{subtotal,discAmt,addonTotal,total}=b.subtotal!=null?b:{subtotal:b.amount,discAmt:0,addonTotal:0,total:b.amount};
    const html=`
      <div class="section">
        <div class="sec-title">Patient & Payment Details</div>
        <div class="g2">
          ${[["Bill ID",b.id],["Patient",b.patient],["Patient ID",b.patientId||"—"],["Department",b.dept],["Date",b.date],["Payment Mode",b.paymentMode||"Cash"],b.paymentMode==="Insurance"?["Insurance / Policy",`${b.insuranceProvider||"—"} / ${b.insurancePolicyNo||"—"}`]:["",""]].filter(x=>x[0]).map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
        </div>
      </div>
      <div class="section">
        <div class="sec-title">Services & Charges</div>
        <table><thead><tr><th>Service</th><th style="text-align:right">Amount</th></tr></thead><tbody>
          ${(b.services||[]).map(s=>`<tr><td>${s.name}</td><td style="text-align:right;font-weight:600">${fmtAmt(parseFloat(s.amount)||0)}</td></tr>`).join("")}
          ${(b.addons||[]).map(a=>`<tr><td style="color:#5b21b6">${a.name} (Add-on)</td><td style="text-align:right;color:#5b21b6;font-weight:600">+${fmtAmt(parseFloat(a.amount)||0)}</td></tr>`).join("")}
        </tbody></table>
        <div class="amt-box">
          <div class="amt-row"><span>Subtotal</span><strong>${fmtAmt(subtotal||b.amount||0)}</strong></div>
          ${discAmt?`<div class="amt-row"><span>Discount</span><span style="color:#be123c">-${fmtAmt(discAmt)}</span></div>`:""}
          ${addonTotal?`<div class="amt-row"><span>Add-ons</span><span style="color:#5b21b6">+${fmtAmt(addonTotal)}</span></div>`:""}
          <div class="amt-total"><span>Total</span><strong>${fmtAmt(total||b.amount||0)}</strong></div>
          <div class="amt-row"><span>Amount Paid</span><span style="color:#065f46;font-weight:700">${fmtAmt(parseFloat(b.paid)||0)}</span></div>
          <div class="amt-row"><span>Balance Due</span><span style="color:${b.balance>0?"#be123c":"#065f46"};font-weight:700">${fmtAmt(b.balance||0)}</span></div>
        </div>
      </div>
      ${b.notes?`<div class="section"><div class="sec-title">Notes</div><div>${b.notes}</div></div>`:""}`;
    printDoc(`Invoice — ${b.id}`,html);
  };

  const tabs=["all","Paid","Partial","Unpaid"];
  const filtered=billing.filter(b=>filter==="all"||b.status===filter).filter(b=>!search||b.patient?.toLowerCase().includes(search.toLowerCase())||b.id?.toLowerCase().includes(search.toLowerCase()));
  const counts=tabs.reduce((a,s)=>({...a,[s]:s==="all"?billing.length:billing.filter(b=>b.status===s).length}),{});
  const totalBilled=billing.reduce((a,b)=>a+(parseFloat(b.amount)||0),0);
  const totalCollected=billing.reduce((a,b)=>a+(parseFloat(b.paid)||0),0);

  return(
    <>
      <PageHeader T={T} title="Billing & Payments" subtitle="Invoice and payment tracking" action={<Btn T={T} label="New Invoice" onClick={openAdd}/>}/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total Invoices" value={billing.length} color={T.accent}/>
        <StatCard T={T} label="Collected" value={fmtAmt(totalCollected)} sub={`of ${fmtAmt(totalBilled)}`} color={T.success}/>
        <StatCard T={T} label="Outstanding" value={fmtAmt(totalBilled-totalCollected)} color={T.danger}/>
        <StatCard T={T} label="Unpaid Count" value={billing.filter(b=>b.status!=="Paid").length} color={T.warn}/>
      </div>
      <div style={card(T,{padding:"16px"})}>
        <div style={{display:"flex",justifyContent:"space-between",flexDirection:mob?"column":"row",marginBottom:14,gap:10}}>
          <FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/>
          <SearchInput value={search} onChange={setSearch} placeholder="Search patient or ID…" T={T}/>
        </div>
        <DataTable T={T} headers={["Bill ID","Patient","Department","Date","Payment","Total","Paid","Balance","Status"]}
          rows={filtered.map(b=>({raw:b,cells:[
            <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{b.id}</span>,
            <div><div style={{fontWeight:700}}>{b.patient}</div><div style={{fontSize:10.5,color:T.muted}}>{b.patientId||"—"}</div><div style={{fontSize:10.5,color:T.muted}}>{b.patientPhone||"—"}</div></div>,
            b.dept,b.date,
            <div><span style={{fontSize:11,background:T.accentBg,color:T.accent,borderRadius:6,padding:"2px 7px",fontWeight:600}}>{b.paymentMode||"Cash"}</span></div>,
            <strong>{fmtAmt(parseFloat(b.amount)||0)}</strong>,
            <span style={{color:T.success,fontWeight:600}}>{fmtAmt(parseFloat(b.paid)||0)}</span>,
            <span style={{color:b.status!=="Paid"?T.danger:T.success,fontWeight:700}}>{fmtAmt(b.balance||0)}</span>,
            <Badge status={b.status} T={T}/>
          ]}))}
          onEdit={openEdit} onPrint={printBill} onDelete={b=>setConfirm(b)}/>
      </div>

      {modal&&(
        <Modal title={modal==="add"?"New Invoice":"Edit Invoice"} onClose={()=>setModal(null)} T={T} extraWide>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px",marginBottom:16}}>
            <FInput T={T} label="Patient Name" value={form.patient||""} onChange={v=>setForm(f=>({...f,patient:v}))} required/>
            <FInput T={T} label="Patient ID" value={form.patientId||""} onChange={v=>setForm(f=>({...f,patientId:v}))}/>
            <FInput T={T} label="Patient Phone" value={form.patientPhone||""} onChange={v=>setForm(f=>({...f,patientPhone:v}))} type="tel" placeholder="10-digit mobile number"/>
            <FInput T={T} label="Department" value={form.dept||""} onChange={v=>setForm(f=>({...f,dept:v}))} options={DEPT_LIST}/>
            <FInput T={T} label="Date" value={form.date||""} onChange={v=>setForm(f=>({...f,date:v}))}/>
            <FInput T={T} label="Payment Mode" value={form.paymentMode||"Cash"} onChange={v=>setForm(f=>({...f,paymentMode:v}))} options={PAYMENT_MODES}/>
            {(form.paymentMode==="Credit Card"||form.paymentMode==="Debit Card")&&<FInput T={T} label="Card Last 4 Digits" value={form.cardLast4||""} onChange={v=>setForm(f=>({...f,cardLast4:v}))} placeholder="e.g. 4321" type="number"/>}
            {form.paymentMode==="UPI"&&<FInput T={T} label="UPI ID" value={form.upiId||""} onChange={v=>setForm(f=>({...f,upiId:v}))} placeholder="e.g. patient@upi"/>}
            {form.paymentMode==="Insurance"&&<FInput T={T} label="Insurance Provider" value={form.insuranceProvider||""} onChange={v=>setForm(f=>({...f,insuranceProvider:v}))}/>}
            {form.paymentMode==="Insurance"&&<FInput T={T} label="Policy Number" value={form.insurancePolicyNo||""} onChange={v=>setForm(f=>({...f,insurancePolicyNo:v}))}/>}
          </div>
          <BillingCalculator services={services} setServices={setServices} discount={discount} setDiscount={setDiscount} discountType={discountType} setDiscountType={setDiscountType} addons={addons} setAddons={setAddons} T={T}/>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px",marginTop:14}}>
            <FInput T={T} label="Amount Paid (₹)" value={form.paid||"0"} onChange={v=>setForm(f=>({...f,paid:v}))} type="number"/>
            <FInput T={T} label="Notes" value={form.notes||""} onChange={v=>setForm(f=>({...f,notes:v}))}/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Create Invoice":"Save Changes"} onClick={saveFn}/>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal T={T} message={`Delete invoice for "${confirm.patient}"?`} onConfirm={()=>{setBilling(p=>p.filter(x=>x.id!==confirm.id));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

// DEPARTMENTS
function DepartmentsManagement({departments,setDepartments,T}){
  const w=useWindowWidth();const mob=w<640;
  const[modal,setModal]=useState(null);const[form,setForm]=useState({});const[confirm,setConfirm]=useState(null);const[search,setSearch]=useState("");
  const save=()=>{
    if(!form.name)return alert("Department name required.");
    if(modal==="add")setDepartments(prev=>[...prev,{...form,id:genId("DEPT",prev),occupied:parseInt(form.occupied)||0,capacity:parseInt(form.capacity)||20}]);
    else setDepartments(prev=>prev.map(d=>d.id===form.id?{...form,occupied:parseInt(form.occupied)||0,capacity:parseInt(form.capacity)||20}:d));
    setModal(null);
  };
  const filtered=departments.filter(d=>!search||d.name?.toLowerCase().includes(search.toLowerCase()));
  return(<>
    <PageHeader T={T} title="Departments" subtitle={`${departments.length} departments`} action={<Btn T={T} label="Add Department" onClick={()=>{setForm({name:"",capacity:"20",occupied:"0"});setModal("add");}}/>}/>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
      <StatCard T={T} label="Total" value={departments.length} color={T.accent}/><StatCard T={T} label="Total Capacity" value={departments.reduce((a,d)=>a+(parseInt(d.capacity)||0),0)} color={T.purple}/><StatCard T={T} label="Total Occupied" value={departments.reduce((a,d)=>a+(parseInt(d.occupied)||0),0)} color={T.warn}/><StatCard T={T} label="Avg Occupancy" value={`${Math.round((departments.reduce((a,d)=>a+(parseInt(d.occupied)||0),0)/(departments.reduce((a,d)=>a+(parseInt(d.capacity)||1),0))*100))}%`} color={T.success}/>
    </div>
    <div style={card(T,{padding:"16px"})}>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><SearchInput value={search} onChange={setSearch} placeholder="Search departments…" T={T}/></div>
      <DataTable T={T} headers={["ID","Department","Capacity","Occupied","Available","Occupancy %"]}
        rows={filtered.map(d=>{const pct=Math.round((parseInt(d.occupied)||0)/(parseInt(d.capacity)||1)*100);return{raw:d,cells:[
          <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{d.id}</span>,
          <strong>{d.name}</strong>,d.capacity,d.occupied,(parseInt(d.capacity)||0)-(parseInt(d.occupied)||0),
          <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{height:6,background:T.surface2,borderRadius:99,overflow:"hidden",width:60,border:`1px solid ${T.border}`}}><div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:pct>=85?T.danger:T.accent,borderRadius:99}}/></div><span style={{color:pct>=85?T.danger:T.success,fontWeight:700,fontSize:11}}>{pct}%</span></div>
        ]};})
        }
        onEdit={d=>{setForm({...d});setModal("edit");}} onDelete={d=>setConfirm(d)}/>
    </div>
    {modal&&(<Modal title={modal==="add"?"Add Department":"Edit Department"} onClose={()=>setModal(null)} T={T} wide>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px"}}>
        <FInput T={T} label="Department Name" value={form.name||""} onChange={v=>setForm(f=>({...f,name:v}))} required/>
        <FInput T={T} label="Capacity" value={form.capacity||""} onChange={v=>setForm(f=>({...f,capacity:v}))} type="number"/>
        <FInput T={T} label="Currently Occupied" value={form.occupied||"0"} onChange={v=>setForm(f=>({...f,occupied:v}))} type="number"/>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/><Btn T={T} label={modal==="add"?"Add Department":"Save Changes"} onClick={save}/></div>
    </Modal>)}
    {confirm&&<ConfirmModal T={T} message={`Delete department "${confirm.name}"?`} onConfirm={()=>{setDepartments(p=>p.filter(x=>x.id!==confirm.id));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
  </>);}

  //  STAFF MANAGEMENT with qualification dropdown+addon, specialization addon
function StaffManagement({staff,setStaff,doctors,setDoctors,T}){
  const w=useWindowWidth();const mob=w<640;
  const[tab,setTab]=useState("staff");
  const[search,setSearch]=useState("");const[modal,setModal]=useState(null);const[confirm,setConfirm]=useState(null);const[form,setForm]=useState({});
  const[qualifications,setQualifications]=useState([]);
  const[specializations,setSpecializations]=useState([]);

  const f0Staff={name:"",role:"Staff Nurse",dept:"General Medicine",shift:"Morning",joined:"",phone:"",email:"",salary:"",status:"Available"};
  const f0Doctor={name:"",spec:"Cardiology",exp:"",rating:"5.0",status:"Available",shift:"Morning",phone:"",email:"",regNo:"",bio:""};

  const openDoctorAdd=()=>{setForm(f0Doctor);setQualifications([]);setSpecializations([]);setModal("add");};
  const openDoctorEdit=d=>{setForm({...d});setQualifications(d.qualifications||[]);setSpecializations(d.specializations||[d.spec].filter(Boolean));setModal("edit");};

  const saveStaff=()=>{if(!form.name||!form.phone)return alert("Name and phone required.");if(modal==="add")setStaff(prev=>[{...form,id:genId("ST",prev)},...prev]);else setStaff(prev=>prev.map(x=>x.id===form.id?form:x));setModal(null);};
  const saveDoctor=()=>{
    if(!form.name||!form.phone)return alert("Name and phone required.");
    const doc={...form,qualifications,specializations,spec:specializations[0]||form.spec};
    if(modal==="add")setDoctors(prev=>[{...doc,id:genId("D",prev)},...prev]);
    else setDoctors(prev=>prev.map(x=>x.id===form.id?doc:x));
    setModal(null);
  };

  const printDoctor=d=>{
    const html=`
      <div class="section">
        <div class="sec-title">Doctor Profile</div>
        <div class="g2">
          ${[["Name","Dr. "+d.name],["Registration No.",d.regNo||"—"],["Phone",d.phone||"—"],["Email",d.email||"—"],["Experience",d.exp||"—"],["Rating","⭐ "+d.rating],["Shift",d.shift||"—"],["Status",d.status||"—"]].map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
        </div>
      </div>
      ${d.qualifications?.length?`<div class="section"><div class="sec-title">Qualifications</div><div class="fv">${d.qualifications.join(" | ")}</div></div>`:""}
      ${d.specializations?.length?`<div class="section"><div class="sec-title">Specializations</div><div>${d.specializations.map(s=>`<span class="badge badge-info" style="margin:2px">${s}</span>`).join(" ")}</div></div>`:""}
      ${d.bio?`<div class="section"><div class="sec-title">Bio</div><div>${d.bio}</div></div>`:""}`;
    printDoc(`Doctor Profile — Dr. ${d.name}`,html);
  };

  const filteredStaff=staff.filter(s=>!search||s.name?.toLowerCase().includes(search.toLowerCase())||s.role?.toLowerCase().includes(search.toLowerCase()));
  const filteredDoctors=doctors.filter(d=>!search||d.name?.toLowerCase().includes(search.toLowerCase())||d.spec?.toLowerCase().includes(search.toLowerCase()));

  return(
    <>
      <PageHeader T={T} title="Staff Management" subtitle="Doctors, nurses and hospital personnel"
        action={<Btn T={T} label={tab==="staff"?"Add Staff":"Add Doctor"} onClick={()=>{if(tab==="staff"){setForm(f0Staff);setModal("add");}else openDoctorAdd();}}/>}/>
      <div style={{display:"flex",gap:8,marginBottom:20}}>{["staff","doctors"].map(t=>(<Btn key={t} T={T} label={t==="staff"?" All Staff":" Doctors"} variant={tab===t?"primary":"secondary"} onClick={()=>setTab(t)}/>))}</div>

      {tab==="staff"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
            <StatCard T={T} label="Total Staff" value={staff.length} color={T.accent}/>
            <StatCard T={T} label="On Duty" value={staff.filter(s=>s.status==="Available").length} color={T.success}/>
            <StatCard T={T} label="On Leave" value={staff.filter(s=>s.status==="On Leave").length} color={T.warn}/>
            <StatCard T={T} label="Night Shift" value={staff.filter(s=>s.shift==="Night").length} color={T.purple}/>
          </div>
          <div style={card(T,{padding:"16px"})}>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><SearchInput value={search} onChange={setSearch} placeholder="Search name or role…" T={T}/></div>
            <DataTable T={T} headers={["ID","Name","Role","Department","Shift","Phone","Salary","Status"]}
              rows={filteredStaff.map(s=>({raw:s,cells:[
                <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{s.id}</span>,
                <div><div style={{fontWeight:700}}>{s.name}</div><div style={{fontSize:10.5,color:T.muted}}>{s.email||"—"}</div></div>,
                s.role,s.dept,
                <span style={{fontSize:11.5,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:6,padding:"2px 7px"}}>{s.shift}</span>,
                s.phone,s.salary?<span style={{fontWeight:600,color:T.success}}>{fmtAmt(parseFloat(s.salary)||0)}</span>:"—",<Badge status={s.status} T={T}/>
              ]}))}
              onEdit={s=>{setForm({...s});setModal("edit");}} onDelete={s=>setConfirm({...s,_type:"staff"})}/>
          </div>
        </>
      )}
      {tab==="doctors"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
            <StatCard T={T} label="Total Doctors" value={doctors.length} color={T.accent}/>
            <StatCard T={T} label="Available" value={doctors.filter(d=>d.status==="Available").length} color={T.success}/>
            <StatCard T={T} label="On Leave" value={doctors.filter(d=>d.status==="On Leave").length} color={T.warn}/>
            <StatCard T={T} label="Specializations" value={[...new Set(doctors.flatMap(d=>d.specializations||[d.spec]).filter(Boolean))].length} color={T.purple}/>
          </div>
          <div style={card(T,{padding:"16px"})}>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><SearchInput value={search} onChange={setSearch} placeholder="Search name or specialization…" T={T}/></div>
            <DataTable T={T} headers={["ID","Name","Qualifications","Specializations","Experience","Rating","Phone","Status"]}
              rows={filteredDoctors.map(d=>({raw:d,cells:[
                <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{d.id}</span>,
                <div><div style={{fontWeight:700}}>Dr. {d.name}</div><div style={{fontSize:10.5,color:T.muted}}>{d.email||"—"}</div></div>,
                <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{(d.qualifications||[d.qualification]).filter(Boolean).map(q=><span key={q} style={{fontSize:10,background:T.purpleBg,color:T.purple,borderRadius:5,padding:"1px 6px",fontWeight:700}}>{q}</span>)}</div>,
                <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{(d.specializations||[d.spec]).filter(Boolean).map(s=><span key={s} style={{fontSize:10,background:T.accentBg,color:T.accent,borderRadius:5,padding:"1px 6px",fontWeight:600}}>{s}</span>)}</div>,
                d.exp,<span style={{fontWeight:700,color:T.warn}}>{d.rating}</span>,d.phone,<Badge status={d.status} T={T}/>
              ]}))}
              onEdit={openDoctorEdit} onPrint={printDoctor} onShare={printDoctor} onDelete={d=>setConfirm({...d,_type:"doctor"})}/>
          </div>
        </>
      )}

      {modal&&tab==="staff"&&(
        <Modal title={modal==="add"?"Add Staff Member":"Edit Staff"} onClose={()=>setModal(null)} T={T} wide>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px"}}>
            <FInput T={T} label="Full Name" value={form.name||""} onChange={v=>setForm(f=>({...f,name:v}))} required/>
            <FInput T={T} label="Role" value={form.role||""} onChange={v=>setForm(f=>({...f,role:v}))} options={["Head Nurse","Staff Nurse","Lab Technician","Pharmacist","Radiographer","Ward Boy","Receptionist","Ambulance Driver","Housekeeping","Security","Admin"]}/>
            <FInput T={T} label="Department" value={form.dept||""} onChange={v=>setForm(f=>({...f,dept:v}))} options={DEPT_LIST}/>
            <FInput T={T} label="Shift" value={form.shift||""} onChange={v=>setForm(f=>({...f,shift:v}))} options={SHIFTS}/>
            <FInput T={T} label="Phone" value={form.phone||""} onChange={v=>setForm(f=>({...f,phone:v}))} required/>
            <FInput T={T} label="Email" value={form.email||""} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/>
            <FInput T={T} label="Salary (₹/month)" value={form.salary||""} onChange={v=>setForm(f=>({...f,salary:v}))} type="number"/>
            <FInput T={T} label="Date Joined" value={form.joined||""} onChange={v=>setForm(f=>({...f,joined:v}))} type="date"/>
            <FInput T={T} label="Status" value={form.status||""} onChange={v=>setForm(f=>({...f,status:v}))} options={["Available","On Leave"]}/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Add Staff":"Save Changes"} onClick={saveStaff}/>
          </div>
        </Modal>
      )}
      {modal&&tab==="doctors"&&(
        <Modal title={modal==="add"?"Add Doctor":"Edit Doctor"} onClose={()=>setModal(null)} T={T} extraWide>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px",marginBottom:8}}>
            <FInput T={T} label="Full Name" value={form.name||""} onChange={v=>setForm(f=>({...f,name:v}))} required/>
            <FInput T={T} label="Registration No." value={form.regNo||""} onChange={v=>setForm(f=>({...f,regNo:v}))}/>
            <FInput T={T} label="Phone" value={form.phone||""} onChange={v=>setForm(f=>({...f,phone:v}))} required/>
            <FInput T={T} label="Email" value={form.email||""} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/>
            <FInput T={T} label="Experience" value={form.exp||""} onChange={v=>setForm(f=>({...f,exp:v}))} placeholder="e.g. 10 years"/>
            <FInput T={T} label="Rating (0–5)" value={form.rating||""} onChange={v=>setForm(f=>({...f,rating:v}))} type="number"/>
            <FInput T={T} label="Shift" value={form.shift||""} onChange={v=>setForm(f=>({...f,shift:v}))} options={SHIFTS}/>
            <FInput T={T} label="Status" value={form.status||""} onChange={v=>setForm(f=>({...f,status:v}))} options={["Available","On Leave"]}/>
          </div>
          <div style={{position:"relative"}}>
            <MultiSelectDropdown T={T} label="Qualifications (select multiple + add custom)" options={QUALIFICATIONS_BASE} selected={qualifications} setSelected={setQualifications} placeholder="MBBS, MD, DNB… or type to add"/>
          </div>
          <div style={{position:"relative"}}>
            <MultiSelectDropdown T={T} label="Specializations (select multiple + add custom)" options={SPECIALIZATIONS_BASE} selected={specializations} setSelected={setSpecializations} placeholder="Cardiology, Neurology… or type to add"/>
          </div>
          <FInput T={T} label="Bio / About" value={form.bio||""} onChange={v=>setForm(f=>({...f,bio:v}))} multiline rows={2} placeholder="Short professional bio…"/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Add Doctor":"Save Changes"} onClick={saveDoctor}/>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal T={T} message={`Remove "${confirm.name}"?`} onConfirm={()=>{if(confirm._type==="doctor")setDoctors(p=>p.filter(x=>x.id!==confirm.id));else setStaff(p=>p.filter(x=>x.id!==confirm.id));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  PHARMACY 
function PharmacySection({pharmacy,setPharmacy,inventory,setInventory,T}){
  const w=useWindowWidth();const mob=w<640;
  const[tab,setTab]=useState("dispensing");
  const[search,setSearch]=useState("");const[filter,setFilter]=useState("all");
  const[modal,setModal]=useState(null);const[confirm,setConfirm]=useState(null);const[form,setForm]=useState({});
  const[medicines,setMedicines]=useState([{name:"",salt:"",dosage:"",qty:1,price:0,frequency:"As needed",duration:"3 days",instructions:""}]);

  const f0={patient:"",patientId:"",patientPhone:"",doctor:"",date:today(),status:"Pending",paymentMode:"Cash",discount:"0",discountType:"flat",notes:""};

  const calcTotal=()=>{const sub=medicines.reduce((a,m)=>a+(parseFloat(m.price)||0)*(parseInt(m.qty)||1),0);const disc=form.discountType==="percent"?sub*(parseFloat(form.discount)||0)/100:parseFloat(form.discount)||0;return Math.max(0,sub-disc);};

  const saveFn=()=>{
    if(!form.patient||medicines.filter(m=>m.name).length===0)return alert("Patient and at least one medicine required.");
    const amount=calcTotal();
    if(modal==="add")setPharmacy(prev=>[{...form,id:genId("PH",prev),medicines,amount},...prev]);
    else setPharmacy(prev=>prev.map(x=>x.id===form.id?{...form,medicines,amount}:x));
    setModal(null);
  };

  const printDispensing=p=>{
    const html=`
      <div class="section">
        <div class="g2">
          ${[["Dispensing ID",p.id],["Patient",p.patient],["Patient ID",p.patientId||"—"],["Phone",p.patientPhone||"—"],["Doctor",p.doctor||"—"],["Date",p.date],["Status",p.status],["Payment Mode",p.paymentMode||"Cash"]].map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
        </div>
      </div>
      <div class="section">
        <div class="sec-title">Medicines Dispensed</div>
        <table><thead><tr><th>#</th><th>Medicine</th><th>Salt</th><th>Dosage</th><th>Qty</th><th>Freq</th><th>Price</th><th>Total</th></tr></thead><tbody>
          ${(p.medicines||[]).map((m,i)=>`<tr><td>${i+1}</td><td><strong>${m.name}</strong></td><td style="color:#64748b;font-size:11px">${m.salt||"—"}</td><td>${m.dosage||"—"}</td><td>${m.qty||1}</td><td>${m.frequency}</td><td>${fmtAmt(parseFloat(m.price)||0)}</td><td style="font-weight:700">${fmtAmt((parseFloat(m.price)||0)*(parseInt(m.qty)||1))}</td></tr>`).join("")}
        </tbody></table>
        <div class="amt-box">
          <div class="amt-total"><span>Total</span><strong>${fmtAmt(parseFloat(p.amount)||0)}</strong></div>
        </div>
      </div>`;
    printDoc(`Pharmacy Dispensing — ${p.id}`,html);
  };

  const tabs=["all","Pending","Dispensed"];
  const filtered=pharmacy.filter(p=>filter==="all"||p.status===filter).filter(p=>!search||p.patient?.toLowerCase().includes(search.toLowerCase()));
  const counts=tabs.reduce((a,s)=>({...a,[s]:s==="all"?pharmacy.length:pharmacy.filter(p=>p.status===s).length}),{});

  return(
    <>
      <PageHeader T={T} title="Pharmacy & Medicines" subtitle="Prescription dispensing & stock" action={<Btn T={T} label="New Dispensing" onClick={()=>{setForm(f0);setMedicines([{name:"",salt:"",dosage:"",qty:1,price:0,frequency:"As needed",duration:"3 days",instructions:""}]);setModal("add");}}/>}/>
      <div style={{display:"flex",gap:8,marginBottom:20}}>{["dispensing","inventory"].map(t=>(<Btn key={t} T={T} label={t==="dispensing"?" Dispensing":" Drug Inventory"} variant={tab===t?"primary":"secondary"} onClick={()=>setTab(t)}/>))}</div>
      {tab==="dispensing"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
            <StatCard T={T} label="Total Rx" value={pharmacy.length} color={T.accent}/>
            <StatCard T={T} label="Dispensed" value={pharmacy.filter(p=>p.status==="Dispensed").length} color={T.success}/>
            <StatCard T={T} label="Pending" value={pharmacy.filter(p=>p.status==="Pending").length} color={T.warn}/>
            <StatCard T={T} label="Revenue" value={fmtAmt(pharmacy.reduce((a,p)=>a+(parseFloat(p.amount)||0),0))} color={T.purple}/>
          </div>
          <div style={card(T,{padding:"16px"})}>
            <div style={{display:"flex",justifyContent:"space-between",flexDirection:mob?"column":"row",marginBottom:14,gap:10}}>
              <FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/>
              <SearchInput value={search} onChange={setSearch} placeholder="Search patient…" T={T}/>
            </div>
            <DataTable T={T} headers={["ID","Patient","Medicines","Doctor","Date","Status","Amount"]}
              rows={filtered.map(p=>({raw:p,cells:[
                <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{p.id}</span>,
                <div><div style={{fontWeight:700}}>{p.patient}</div><div style={{fontSize:10.5,color:T.muted}}>{p.patientId||"—"}</div><div style={{fontSize:10.5,color:T.muted}}>{p.patientPhone||"—"}</div></div>,
                <span style={{color:T.muted,fontSize:11.5}}>{p.medicines?.length||1} medicine{(p.medicines?.length||1)!==1?"s":""}</span>,
                p.doctor,p.date,<Badge status={p.status} T={T}/>,
                <strong style={{color:T.success}}>{p.amount?fmtAmt(parseFloat(p.amount)||0):"—"}</strong>
              ]}))}
              onEdit={p=>{setForm({...p});setMedicines(p.medicines||[{name:p.medicine||"",salt:"",dosage:"",qty:p.qty||1,price:0,frequency:"As needed",duration:"3 days",instructions:""}]);setModal("edit");}}
              onPrint={printDispensing} onDelete={p=>setConfirm(p)}/>
          </div>
        </>
      )}
      {tab==="inventory"&&<InventorySection inventory={inventory} setInventory={setInventory} T={T}/>}
      {modal&&(
        <Modal title={modal==="add"?"New Pharmacy Dispensing":"Edit Dispensing"} onClose={()=>setModal(null)} T={T} extraWide>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px",marginBottom:16}}>
            <FInput T={T} label="Patient Name" value={form.patient||""} onChange={v=>setForm(f=>({...f,patient:v}))} required/>
            <FInput T={T} label="Patient ID" value={form.patientId||""} onChange={v=>setForm(f=>({...f,patientId:v}))}/>
            <FInput T={T} label="Patient Phone" value={form.patientPhone||""} onChange={v=>setForm(f=>({...f,patientPhone:v}))} type="tel" placeholder="10-digit mobile number"/>
            <FInput T={T} label="Prescribed By" value={form.doctor||""} onChange={v=>setForm(f=>({...f,doctor:v}))}/>
            <FInput T={T} label="Payment Mode" value={form.paymentMode||"Cash"} onChange={v=>setForm(f=>({...f,paymentMode:v}))} options={PAYMENT_MODES}/>
            <FInput T={T} label="Status" value={form.status||""} onChange={v=>setForm(f=>({...f,status:v}))} options={["Pending","Dispensed"]}/>
          </div>
          <MedicineTable medicines={medicines} setMedicines={setMedicines} T={T} inventory={inventory} showPrice/>
          <div style={{background:T.surface2,borderRadius:10,border:`1px solid ${T.border}`,padding:"12px 16px",marginTop:10}}>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:T.muted,fontWeight:700}}>Discount:</span>
              <input type="number" value={form.discount||"0"} onChange={e=>setForm(f=>({...f,discount:e.target.value}))} style={{width:70,padding:"6px 8px",borderRadius:7,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface,color:T.text}}/>
              <select value={form.discountType||"flat"} onChange={e=>setForm(f=>({...f,discountType:e.target.value}))} style={{padding:"6px 8px",borderRadius:7,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface,color:T.text}}>
                <option value="flat">₹ Flat</option><option value="percent">%</option>
              </select>
              <span style={{marginLeft:"auto",fontWeight:800,color:T.accent,fontSize:15}}>Total: {fmtAmt(calcTotal())}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:12}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Dispense":"Save Changes"} onClick={saveFn}/>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal T={T} message={`Delete dispensing for "${confirm.patient}"?`} onConfirm={()=>{setPharmacy(p=>p.filter(x=>x.id!==confirm.id));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  INVENTORY SECTION
function InventorySection({inventory,setInventory,orders=[],T,standalone}){
  const orderedItems=useMemo(()=>{const s=new Set();(orders||[]).forEach(o=>(o.items||[]).forEach(i=>{if(i.name)s.add(i.name.toLowerCase());}));return s;},[orders]);
  const w=useWindowWidth();const mob=w<640;
  const[search,setSearch]=useState("");const[filter,setFilter]=useState("all");
  const[modal,setModal]=useState(null);const[confirm,setConfirm]=useState(null);const[form,setForm]=useState({});
  const f0={item:"",salt:"",category:"Medicine",qty:"",unit:"Strips",reorder:"",supplier:"",price:""};
  const getStatus=item=>+item.qty<=(+item.reorder||0)?"Low Stock":"In Stock";
  const saveFn=()=>{
    if(!form.item)return alert("Item name required.");
    const d=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short"});
    if(modal==="add")setInventory(prev=>[{...form,id:genId("INV",prev),status:getStatus(form),lastUpdated:d},...prev]);
    else setInventory(prev=>prev.map(x=>x.id===form.id?{...form,status:getStatus(form),lastUpdated:d}:x));
    setModal(null);
  };
  const tabs=["all","In Stock","Low Stock"];
  const filtered=inventory.filter(i=>filter==="all"||i.status===filter).filter(i=>!search||i.item?.toLowerCase().includes(search.toLowerCase())||i.salt?.toLowerCase().includes(search.toLowerCase())||i.category?.toLowerCase().includes(search.toLowerCase()));
  const counts=tabs.reduce((a,s)=>({...a,[s]:s==="all"?inventory.length:inventory.filter(i=>i.status===s).length}),{});

  const printInventory=()=>{
    const html=`<div class="section"><div class="sec-title">Drug Inventory Report</div>
      <table><thead><tr><th>Item</th><th>Salt</th><th>Category</th><th>Qty</th><th>Unit</th><th>Reorder</th><th>Supplier</th><th>Price</th><th>Status</th></tr></thead><tbody>
        ${inventory.map(i=>`<tr><td><strong>${i.item}</strong></td><td style="color:#64748b;font-size:11px">${i.salt||"—"}</td><td>${i.category}</td><td style="font-weight:700;color:${i.status==="Low Stock"?"#be123c":"#065f46"}">${i.qty}</td><td>${i.unit}</td><td>${i.reorder||"—"}</td><td>${i.supplier||"—"}</td><td>${i.price?fmtAmt(parseFloat(i.price)||0):"—"}</td><td><span class="badge ${i.status==="In Stock"?"badge-success":"badge-danger"}">${i.status}</span></td></tr>`).join("")}
      </tbody></table></div>`;
    printDoc("Drug Inventory Report",html);
  };

  return(
    <>
      {standalone&&<PageHeader T={T} title="Drug Inventory" subtitle="Medicine & supply stock management" action={<Btn T={T} label="Add Item" onClick={()=>{setForm(f0);setModal("add");}}/>}/>}
      {!standalone&&<div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:12}}>
        <Btn T={T} label="🖨 Print Inventory" variant="secondary" onClick={printInventory}/>
        <Btn T={T} label="Add Drug/Item" onClick={()=>{setForm(f0);setModal("add");}}/>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total Items" value={inventory.length} color={T.accent}/>
        <StatCard T={T} label="In Stock" value={inventory.filter(i=>i.status==="In Stock").length} color={T.success}/>
        <StatCard T={T} label="Low Stock" value={inventory.filter(i=>i.status==="Low Stock").length} color={T.danger}/>
        <StatCard T={T} label="Categories" value={[...new Set(inventory.map(i=>i.category))].length} color={T.purple}/>
      </div>
      <div style={card(T,{padding:"16px"})}>
        <div style={{display:"flex",justifyContent:"space-between",flexDirection:mob?"column":"row",marginBottom:14,gap:10}}>
          <FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/>
          <SearchInput value={search} onChange={setSearch} placeholder="Search item, salt, category…" T={T}/>
        </div>
        <DataTable T={T} headers={["Item ID","Name","Salt","Category","Qty","Unit","Reorder","Supplier","Price","Status"]}
          rows={filtered.map(i=>({raw:i,cells:[
            <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{i.id}</span>,
            <strong>{i.item}</strong>,
            <span style={{fontSize:11.5,color:T.muted}}>{i.salt||"—"}</span>,
            <span style={{fontSize:11.5,background:T.accentBg,color:T.accent,borderRadius:6,padding:"2px 7px"}}>{i.category}</span>,
            <span style={{fontWeight:700,color:+i.qty<=(+i.reorder||0)?T.danger:T.text}}>{i.qty}</span>,
            i.unit,i.reorder,i.supplier,
            i.price?<span style={{fontWeight:600,color:T.success}}>{fmtAmt(parseFloat(i.price)||0)}</span>:"—",
            <Badge status={i.status} T={T}/>
          ]}))}
          onEdit={i=>{setForm({...i});setModal("edit");}} onDelete={i=>setConfirm(i)}/>
      </div>
      {modal&&(
        <Modal title={modal==="add"?"Add Drug/Item":"Edit Item"} onClose={()=>setModal(null)} T={T} wide>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px"}}>
            <FInput T={T} label="Item Name" value={form.item||""} onChange={v=>setForm(f=>({...f,item:v}))} required/>
            <FInput T={T} label="Salt / Generic Name" value={form.salt||""} onChange={v=>setForm(f=>({...f,salt:v}))} placeholder="e.g. Paracetamol"/>
            <FInput T={T} label="Category" value={form.category||""} onChange={v=>setForm(f=>({...f,category:v}))} options={["Medicine","PPE","Fluids","Consumables","Equipment","Surgical","IV Fluids","Vaccine","Supplement","Topical"]}/>
            <FInput T={T} label="Unit" value={form.unit||""} onChange={v=>setForm(f=>({...f,unit:v}))} options={["Strips","Vials","Bottles","Pcs","Boxes","Litres","kg","Ampoules","Sachets"]}/>
            <FInput T={T} label="Quantity" value={form.qty||""} onChange={v=>setForm(f=>({...f,qty:v}))} type="number"/>
            <FInput T={T} label="Reorder Level" value={form.reorder||""} onChange={v=>setForm(f=>({...f,reorder:v}))} type="number"/>
            <FInput T={T} label="Price (₹ per unit)" value={form.price||""} onChange={v=>setForm(f=>({...f,price:v}))} type="number"/>
            <FInput T={T} label="Supplier" value={form.supplier||""} onChange={v=>setForm(f=>({...f,supplier:v}))}/>
          </div>
          <p style={{fontSize:11.5,color:T.muted,margin:"0 0 12px"}}>Status auto-set: Low Stock if qty ≤ reorder level.</p>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Add Item":"Save Changes"} onClick={saveFn}/>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal T={T} message={`Remove "${confirm.item}" from inventory?`} onConfirm={()=>{setInventory(p=>p.filter(x=>x.id!==confirm.id));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  LAB REPORTS with print/share
function LabReports({lab,setLab,T}){
  const w=useWindowWidth();const mob=w<640;
  const[search,setSearch]=useState("");const[filter,setFilter]=useState("all");
  const[modal,setModal]=useState(null);const[confirm,setConfirm]=useState(null);const[form,setForm]=useState({});
  const f0={patient:"",patientId:"",patientPhone:"",test:"CBC + ESR",doctor:"",status:"Pending",result:"—",reportUrl:"",reportName:"",notes:"",reportedValues:""};

  const saveFn=()=>{
    if(!form.patient||!form.test)return alert("Patient and test required.");
    if(form.reportUrl==="__uploading__")return alert("Please wait for upload to finish.");
    if(modal==="add")setLab(prev=>[{...form,id:genId("LB",prev),collected:now()},...prev]);
    else setLab(prev=>prev.map(x=>x.id===form.id?form:x));
    setModal(null);
  };

  const printLabReport=l=>{
    const html=`
      <div class="section">
        <div class="g2">
          ${[["Lab ID",l.id],["Patient",l.patient],["Patient ID",l.patientId||"—"],["Test",l.test],["Ordered By",l.doctor||"—"],["Collected",l.collected],["Status",l.status],["Result",l.result||"Pending"]].map(([k,v])=>`<div class="field"><div class="fl">${k}</div><div class="fv">${v}</div></div>`).join("")}
        </div>
      </div>
      ${l.reportedValues?`<div class="section"><div class="sec-title">Reported Values</div><div class="fv" style="white-space:pre-line">${l.reportedValues}</div></div>`:""}
      ${l.notes?`<div class="section"><div class="sec-title">Notes / Observations</div><div>${l.notes}</div></div>`:""}
      ${l.reportUrl&&l.reportUrl!=="__uploading__"?`<div class="section"><div class="sec-title">Report Image</div><img src="${l.reportUrl}" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0;margin-top:8px"/></div>`:""}`;
    printDoc(`Lab Report — ${l.id}`,html);
  };

  const handleFileUpload=async(e)=>{
    const file=e.target.files[0];if(!file)return;
    if(!file.type.startsWith("image/")){alert("Only image files supported.");e.target.value="";return;}
    if(file.size>5*1024*1024){alert("Max 5MB.");e.target.value="";return;}
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      setForm(f=>({...f,reportUrl:"__uploading__",reportName:file.name}));
      try{
        const token=getToken();
        const res=await fetch(`${BASE_API}/api/upload`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({file:ev.target.result})});
        const data=await res.json();
        if(data.url)setForm(f=>({...f,reportUrl:data.url,reportPublicId:data.public_id,reportName:file.name}));
        else throw new Error(data.message||"Upload failed");
      }catch(err){alert("Upload failed: "+err.message);setForm(f=>({...f,reportUrl:"",reportName:""}));}
    };
    reader.readAsDataURL(file);
  };

  const tabs=["all","Pending","In Progress","Completed"];
  const filtered=lab.filter(l=>filter==="all"||l.status===filter).filter(l=>!search||l.patient?.toLowerCase().includes(search.toLowerCase())||l.id?.toLowerCase().includes(search.toLowerCase()));
  const counts=tabs.reduce((a,s)=>({...a,[s]:s==="all"?lab.length:lab.filter(l=>l.status===s).length}),{});

  return(
    <>
      <PageHeader T={T} title="Lab Reports" subtitle="Test orders and lab results" action={<Btn T={T} label="New Lab Test" onClick={()=>{setForm(f0);setModal("add");}}/>}/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total Tests" value={lab.length} color={T.accent}/>
        <StatCard T={T} label="Completed" value={lab.filter(l=>l.status==="Completed").length} color={T.success}/>
        <StatCard T={T} label="In Progress" value={lab.filter(l=>l.status==="In Progress").length} color={T.purple}/>
        <StatCard T={T} label="Pending" value={lab.filter(l=>l.status==="Pending").length} color={T.warn}/>
      </div>
      <div style={card(T,{padding:"16px"})}>
        <div style={{display:"flex",justifyContent:"space-between",flexDirection:mob?"column":"row",marginBottom:14,gap:10}}>
          <FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/>
          <SearchInput value={search} onChange={setSearch} placeholder="Search patient or ID…" T={T}/>
        </div>
        <DataTable T={T} headers={["Lab ID","Patient","Test","Ordered By","Collected","Status","Result","Report"]}
          rows={filtered.map(l=>({raw:l,cells:[
            <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{l.id}</span>,
            <div><div style={{fontWeight:700}}>{l.patient}</div><div style={{fontSize:10.5,color:T.muted}}>{l.patientId||"—"}</div><div style={{fontSize:10.5,color:T.muted}}>{l.patientPhone||"—"}</div></div>,
            <span style={{fontWeight:600}}>{l.test}</span>,
            l.doctor,l.collected,<Badge status={l.status} T={T}/>,
            l.result&&l.result!=="—"?<Badge status={l.result} T={T}/>:<span style={{color:T.muted}}>—</span>,
            l.reportUrl&&l.reportUrl!=="__uploading__"?<div style={{display:"flex",alignItems:"center",gap:6}}>
              <img src={l.reportUrl} alt="report" style={{width:28,height:28,objectFit:"cover",borderRadius:4,border:`1px solid ${T.border2}`,flexShrink:0}} onError={e=>e.target.style.display="none"}/>
              <a href={l.reportUrl} target="_blank" rel="noopener noreferrer" style={{color:T.accent,fontWeight:600,fontSize:11.5,textDecoration:"none"}}>View ↗</a>
            </div>:<span style={{color:T.muted,fontSize:11.5}}>{l.reportUrl==="__uploading__"?"Uploading…":"—"}</span>
          ]}))}
          onEdit={l=>{setForm({...l});setModal("edit");}} onPrint={printLabReport}  onDelete={l=>setConfirm(l)}/>
      </div>
      {modal&&(
        <Modal title={modal==="add"?"New Lab Test":"Edit Lab Test"} onClose={()=>setModal(null)} T={T} wide>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px"}}>
            <FInput T={T} label="Patient Name" value={form.patient||""} onChange={v=>setForm(f=>({...f,patient:v}))} required/>
            <FInput T={T} label="Patient ID" value={form.patientId||""} onChange={v=>setForm(f=>({...f,patientId:v}))}/>
            <FInput T={T} label="Patient Phone" value={form.patientPhone||""} onChange={v=>setForm(f=>({...f,patientPhone:v}))} type="tel" placeholder="10-digit mobile number"/>
            <FInput T={T} label="Test" value={form.test||""} onChange={v=>setForm(f=>({...f,test:v}))} options={["CBC + ESR","Blood Sugar (F/PP)","X-Ray","MRI","CT Scan","Lipid Profile","Urine Routine","LFT","KFT","ECG","Ultrasound","Thyroid Profile","COVID-19 RT-PCR","HbA1c","Vitamin D","Vitamin B12","CRP","D-Dimer","Coagulation Profile","Bone Profile"]}/>
            <FInput T={T} label="Ordered By (Doctor)" value={form.doctor||""} onChange={v=>setForm(f=>({...f,doctor:v}))}/>
            <FInput T={T} label="Status" value={form.status||""} onChange={v=>setForm(f=>({...f,status:v}))} options={["Pending","In Progress","Completed"]}/>
            <FInput T={T} label="Result" value={form.result||""} onChange={v=>setForm(f=>({...f,result:v}))} options={["—","Normal","Abnormal","High","Low"]}/>
            <div style={{gridColumn:mob?"1":"1/-1"}}><FInput T={T} label="Reported Values (e.g. HB: 12.5, WBC: 6000…)" value={form.reportedValues||""} onChange={v=>setForm(f=>({...f,reportedValues:v}))} multiline rows={3}/></div>
            <div style={{gridColumn:mob?"1":"1/-1"}}><FInput T={T} label="Notes" value={form.notes||""} onChange={v=>setForm(f=>({...f,notes:v}))} multiline rows={2}/></div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:7}}>Upload Report Image</div>
            <label style={{display:"block"}}>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{display:"none"}} disabled={form.reportUrl==="__uploading__"}/>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",border:`2px dashed ${form.reportUrl==="__uploading__"?T.accent:form.reportUrl?T.success:T.border2}`,borderRadius:10,cursor:form.reportUrl==="__uploading__"?"wait":"pointer",background:T.surface2}}>
                {form.reportUrl==="__uploading__"?<div style={{flex:1}}><div style={{fontWeight:600,color:T.accent,fontSize:12,marginBottom:5}}>Uploading…</div><div style={{height:4,background:T.border,borderRadius:9}}><div style={{height:"100%",width:"60%",background:T.accent,borderRadius:9}}/></div></div>
                :form.reportUrl?<><img src={form.reportUrl} alt="preview" style={{width:44,height:44,objectFit:"cover",borderRadius:7,border:`1px solid ${T.border2}`,flexShrink:0}}/><div style={{flex:1}}><div style={{fontWeight:700,color:T.success,fontSize:12}}>✓ {form.reportName}</div><div style={{fontSize:10.5,color:T.muted}}>Click to replace</div></div></>
                :<><span style={{fontSize:22}}></span><div><div style={{fontWeight:600,color:T.text,fontSize:12}}>Click to upload report image</div><div style={{fontSize:10.5,color:T.muted}}>JPG, PNG — max 5 MB</div></div></>}
              </div>
            </label>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Create Test Order":"Save Changes"} onClick={saveFn} disabled={form.reportUrl==="__uploading__"}/>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal T={T} message={`Delete lab test for "${confirm.patient}"?`} onConfirm={()=>{setLab(p=>p.filter(x=>x.id!==confirm.id));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  REPORTS & ANALYTICS with daily/weekly reports
function ReportsAnalytics({patients,appointments,billing,lab,pharmacy,prescriptions,doctors,staff,T}){
  const w=useWindowWidth();const mob=w<640;
  const[reportType,setReportType]=useState("daily");
  const[reportDate,setReportDate]=useState(todayISO());

  const totalRevenue=billing.reduce((a,b)=>a+(parseFloat(b.paid)||0),0);
  const totalOutstanding=billing.reduce((a,b)=>a+(parseFloat(b.amount)||0),0)-totalRevenue;
  const deptCounts=patients.reduce((a,p)=>{a[p.dept]=(a[p.dept]||0)+1;return a;},{});
  const topDepts=Object.entries(deptCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const totalDept=topDepts.reduce((a,[,c])=>a+c,0);
  const COLORS=[T.accent,T.purple,T.success,T.warn,T.danger];
  const genderCounts={Male:patients.filter(p=>p.gender==="Male").length,Female:patients.filter(p=>p.gender==="Female").length,Other:patients.filter(p=>p.gender&&p.gender!=="Male"&&p.gender!=="Female").length};

  // Filter data for date range
  const getDateRange=()=>{
    const end=new Date(reportDate);
    const start=new Date(reportDate);
    if(reportType==="weekly")start.setDate(start.getDate()-6);
    return{start,end};
  };

  const filterByDate=(items,dateField="date")=>{
    const{start,end}=getDateRange();
    return items.filter(item=>{
      try{
        const d=new Date(item[dateField]);
        return d>=start&&d<=end;
      }catch{return false;}
    });
  };

  const periodPatients=filterByDate(patients,"registrationDate");
  const periodBilling=filterByDate(billing);
  const periodLab=filterByDate(lab,"collected");
  const periodAppointments=filterByDate(appointments);

  const printReport=()=>{
    const{start,end}=getDateRange();
    const label=reportType==="daily"?`Daily Report — ${fmtDate(reportDate)}`:`Weekly Report — ${fmtDate(start)} to ${fmtDate(end)}`;
    const periodRev=periodBilling.reduce((a,b)=>a+(parseFloat(b.paid)||0),0);
    const html=`
      <div class="section">
        <div class="sec-title">Report Period</div>
        <div class="g2">
          <div class="field"><div class="fl">Report Type</div><div class="fv">${reportType==="daily"?"Daily":"Weekly"} Report</div></div>
          <div class="field"><div class="fl">Period</div><div class="fv">${fmtDate(start)}${reportType==="weekly"?" — "+fmtDate(end):""}</div></div>
          <div class="field"><div class="fl">Generated On</div><div class="fv">${new Date().toLocaleString("en-IN")}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="sec-title">Period Summary</div>
        <table><thead><tr><th>Metric</th><th>Period</th><th>Total</th></tr></thead><tbody>
          <tr><td>New Patients</td><td><strong>${periodPatients.length}</strong></td><td>${patients.length}</td></tr>
          <tr><td>Appointments</td><td><strong>${periodAppointments.length}</strong></td><td>${appointments.length}</td></tr>
          <tr><td>Revenue Collected</td><td><strong>${fmtAmt(periodRev)}</strong></td><td>${fmtAmt(totalRevenue)}</td></tr>
          <tr><td>Lab Tests</td><td><strong>${periodLab.length}</strong></td><td>${lab.length}</td></tr>
          <tr><td>Prescriptions</td><td><strong>${filterByDate(prescriptions).length}</strong></td><td>${prescriptions.length}</td></tr>
        </tbody></table>
      </div>
      <div class="section">
        <div class="sec-title">Billing Breakdown (Period)</div>
        <table><thead><tr><th>Bill ID</th><th>Patient</th><th>Date</th><th>Amount</th><th>Paid</th><th>Status</th></tr></thead><tbody>
          ${periodBilling.slice(0,20).map(b=>`<tr><td>${b.id}</td><td>${b.patient}</td><td>${b.date}</td><td>${fmtAmt(parseFloat(b.amount)||0)}</td><td>${fmtAmt(parseFloat(b.paid)||0)}</td><td><span class="badge ${b.status==="Paid"?"badge-success":b.status==="Partial"?"badge-warn":"badge-danger"}">${b.status}</span></td></tr>`).join("")}
        </tbody></table>
      </div>
      <div class="section">
        <div class="sec-title">Overall Hospital Stats</div>
        <div class="g3">
          ${[["Total Patients",patients.length],["Active Doctors",doctors.filter(d=>d.status==="Available").length],["Staff on Duty",staff.filter(s=>s.status==="Available").length],["Total Revenue",fmtAmt(totalRevenue)],["Outstanding",fmtAmt(totalOutstanding)],["Prescriptions",prescriptions.length]].map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
        </div>
      </div>`;
    printDoc(label,html);
  };

  return(
    <>
      <PageHeader T={T} title="Reports & Analytics" subtitle="Hospital performance overview"/>
      <div style={{...card(T,{padding:"16px 20px",marginBottom:20}),display:"flex",flexWrap:"wrap",gap:12,alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:12.5,fontWeight:600,color:T.muted}}>Report Type:</span>
          {["daily","weekly"].map(t=>(
            <button key={t} onClick={()=>setReportType(t)} style={{padding:"7px 16px",borderRadius:8,border:`1.5px solid ${reportType===t?T.accent:T.border2}`,background:reportType===t?T.accent:"transparent",color:reportType===t?"#fff":T.muted,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              {t==="daily"?" Daily":" Weekly"}
            </button>
          ))}
          <input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} style={{padding:"7px 10px",borderRadius:8,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface2,color:T.text}}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn T={T} label="🖨 Print Report" onClick={printReport}/>
          <Btn T={T} label="Share PDF" variant="secondary" onClick={printReport}/>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total Revenue" value={fmtAmt(totalRevenue)} sub={`${fmtAmt(totalOutstanding)} outstanding`} color={T.success}/>
        <StatCard T={T} label="Total Patients" value={patients.length} sub={`${patients.filter(p=>p.status==="Admitted").length} admitted`} color={T.accent}/>
        <StatCard T={T} label="Appointments" value={appointments.length} sub={`${appointments.filter(a=>a.status==="Completed").length} completed`} color={T.purple}/>
        <StatCard T={T} label="Lab Tests" value={lab.length} sub={`${lab.filter(l=>l.status==="Completed").length} completed`} color={T.warn}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:16}}>
        <div style={card(T,{padding:"20px"})}>
          <h3 style={{margin:"0 0 14px",fontWeight:700,fontSize:13.5,color:T.text}}>Patients by Department</h3>
          {topDepts.length===0?<p style={{color:T.muted,fontSize:12}}>No data yet</p>:topDepts.map(([dept,count],i)=>{const pct=totalDept>0?Math.round((count/totalDept)*100):0;return(<div key={dept} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{fontWeight:600,color:T.text}}>{dept}</span><span style={{fontWeight:700,color:COLORS[i%5]}}>{count} ({pct}%)</span></div><div style={{height:7,background:T.surface2,borderRadius:99,overflow:"hidden",border:`1px solid ${T.border}`}}><div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:COLORS[i%5]}}/></div></div>);})}
        </div>
        <div style={card(T,{padding:"20px"})}>
          <h3 style={{margin:"0 0 14px",fontWeight:700,fontSize:13.5,color:T.text}}>Gender & Blood Group</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[["Male",genderCounts.Male,T.accent],["Female",genderCounts.Female,T.purple],["Other",genderCounts.Other,T.muted]].map(([l,v,c])=>(<div key={l} style={{background:T.surface2,borderRadius:9,padding:"12px 8px",textAlign:"center",border:`1px solid ${T.border}`}}><div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div><div style={{fontSize:10.5,color:T.muted,fontWeight:600,textTransform:"uppercase"}}>{l}</div></div>))}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {BLOOD_GROUPS.map(bg=>{const c=patients.filter(p=>p.bloodGroup===bg).length;return c>0?<span key={bg} style={{background:T.warnBg,color:T.warn,border:`1px solid ${T.warn}`,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700}}>{bg}: {c}</span>:null;})}
          </div>
        </div>
        <div style={card(T,{padding:"20px"})}>
          <h3 style={{margin:"0 0 14px",fontWeight:700,fontSize:13.5,color:T.text}}>Billing Overview</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            {[["Total Billed",fmtAmt(billing.reduce((a,b)=>a+(parseFloat(b.amount)||0),0)),T.text],["Collected",fmtAmt(totalRevenue),T.success],["Outstanding",fmtAmt(totalOutstanding),T.danger],["Paid Invoices",billing.filter(b=>b.status==="Paid").length+" bills",T.success]].map(([l,v,c])=>(<div key={l} style={{background:T.surface2,borderRadius:9,padding:"11px 12px",border:`1px solid ${T.border}`}}><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",fontWeight:700,marginBottom:3}}>{l}</div><div style={{fontSize:14,fontWeight:800,color:c}}>{v}</div></div>))}
          </div>
        </div>
        <div style={card(T,{padding:"20px"})}>
          <h3 style={{margin:"0 0 14px",fontWeight:700,fontSize:13.5,color:T.text}}>Operational Summary</h3>
          {[{l:"Prescriptions Issued",v:prescriptions.length,c:T.purple},{l:"Pharmacy Dispensed",v:pharmacy.filter(p=>p.status==="Dispensed").length,c:T.success},{l:"Lab Tests Completed",v:lab.filter(l=>l.status==="Completed").length,c:T.accent},{l:"Pending Lab Tests",v:lab.filter(l=>l.status==="Pending").length,c:T.warn},{l:"Active Doctors",v:doctors.filter(d=>d.status==="Available").length,c:T.success},{l:"Staff on Duty",v:staff.filter(s=>s.status==="Available").length,c:T.success}].map(({l,v,c})=>(<div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:12.5,color:T.text2}}>{l}</span><span style={{fontWeight:800,fontSize:17,color:c}}>{v}</span></div>))}
        </div>
      </div>
    </>
  );
}

//  APPOINTMENT / CONSULTATION
function DoctorConsultation({appointments,setAppointments,T}){
  const w=useWindowWidth();const mob=w<640;
  const[search,setSearch]=useState("");const[filter,setFilter]=useState("all");
  const[modal,setModal]=useState(null);const[confirm,setConfirm]=useState(null);const[form,setForm]=useState({});
  const f0={patientId:"",patientName:"",patientPhone:"",dept:"General Medicine",doctor:"",date:"",time:"",type:"Consultation",notes:"",status:"Confirmed",fee:"",paymentMode:"Cash",discount:"0",discountType:"flat"};

  const saveFn=()=>{
    if(!form.patientName||!form.date||!form.time)return alert("Patient, Date and Time required.");
    const disc=form.discountType==="percent"?(parseFloat(form.fee)||0)*(parseFloat(form.discount)||0)/100:parseFloat(form.discount)||0;
    const netFee=Math.max(0,(parseFloat(form.fee)||0)-disc);
    if(modal==="add")setAppointments(prev=>[{...form,id:genId("AP",prev),netFee},...prev]);
    else setAppointments(prev=>prev.map(x=>x.id===form.id?{...form,netFee}:x));
    setModal(null);
  };

  const printAppt=a=>{
    const html=`<div class="section">
      <div class="token">Appt: ${a.id}</div>
      <div class="g2">
        ${[["Patient",a.patientName],["Patient ID",a.patientId||"—"],["Department",a.dept],["Doctor",a.doctor||"—"],["Type",a.type],["Date & Time",`${fmtDate(a.date)} ${a.time}`],["Fee",a.fee?fmtAmt(parseFloat(a.fee)||0):"—"],["Net Fee",a.netFee!=null?fmtAmt(a.netFee):"—"],["Payment Mode",a.paymentMode||"Cash"],["Status",a.status]].map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
      </div>
      ${a.notes?`<div class="section"><div class="sec-title">Notes</div><div>${a.notes}</div></div>`:""}
    </div>`;
    printDoc(`Appointment — ${a.id}`,html);
  };

  const tabs=["all","Confirmed","In Progress","Waiting","Completed","Cancelled"];
  const filtered=appointments.filter(a=>filter==="all"||a.status===filter).filter(a=>!search||a.patientName?.toLowerCase().includes(search.toLowerCase())||a.id?.toLowerCase().includes(search.toLowerCase())||a.doctor?.toLowerCase().includes(search.toLowerCase()));
  const counts=tabs.reduce((a,s)=>({...a,[s]:s==="all"?appointments.length:appointments.filter(x=>x.status===s).length}),{});

  return(
    <>
      <PageHeader T={T} title="Doctor Consultation" subtitle="Appointment & consultation management" action={<Btn T={T} label="New Appointment" onClick={()=>{setForm(f0);setModal("add");}}/>}/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total" value={appointments.length} color={T.accent}/>
        <StatCard T={T} label="Confirmed" value={appointments.filter(a=>a.status==="Confirmed").length} color={T.success}/>
        <StatCard T={T} label="Waiting" value={appointments.filter(a=>a.status==="Waiting").length} color={T.warn}/>
        <StatCard T={T} label="Today" value={appointments.filter(a=>a.date===todayISO()).length} color={T.purple}/>
      </div>
      <div style={card(T,{padding:"16px"})}>
        <div style={{display:"flex",justifyContent:"space-between",flexDirection:mob?"column":"row",marginBottom:14,gap:10}}>
          <FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/>
          <SearchInput value={search} onChange={setSearch} placeholder="Search patient, doctor, ID…" T={T}/>
        </div>
        <DataTable T={T}
          headers={["Appt ID","Patient","Phone","Type","Dept","Doctor","Date","Time","Fee","Payment","Status"]}
          rows={filtered.map(a=>({raw:a,cells:[
            <span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{a.id}</span>,
            <div><div style={{fontWeight:700}}>{a.patientName}</div><div style={{fontSize:10.5,color:T.muted}}>{a.patientId||"—"}</div></div>,
            <span style={{fontSize:12,color:T.muted}}>{a.patientPhone||"—"}</span>,
            <span style={{fontSize:11,color:T.purple,background:T.purpleBg,borderRadius:5,padding:"2px 7px",fontWeight:600}}>{a.type}</span>,
            a.dept,a.doctor,fmtDate(a.date),a.time,
            a.fee?<div><div style={{fontWeight:700,color:T.success}}>{fmtAmt(parseFloat(a.fee)||0)}</div>{a.netFee!=null&&a.netFee!==parseFloat(a.fee)&&<div style={{fontSize:10.5,color:T.accent}}>Net: {fmtAmt(a.netFee)}</div>}</div>:"—",
            <span style={{fontSize:11,background:T.accentBg,color:T.accent,borderRadius:5,padding:"2px 7px",fontWeight:600}}>{a.paymentMode||"Cash"}</span>,
            <Badge status={a.status} T={T}/>
          ]}))}
          onEdit={a=>{setForm({...a});setModal("edit");}} onPrint={printAppt} onDelete={a=>setConfirm(a)}/>
      </div>
      {modal&&(
        <Modal title={modal==="add"?"New Appointment":"Edit Appointment"} onClose={()=>setModal(null)} T={T} wide>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"0 18px"}}>
            <FInput T={T} label="Patient Name" value={form.patientName||""} onChange={v=>setForm(f=>({...f,patientName:v}))} required/>
            <FInput T={T} label="Patient ID (optional)" value={form.patientId||""} onChange={v=>setForm(f=>({...f,patientId:v}))}/>
            <FInput T={T} label="Patient Phone" value={form.patientPhone||""} onChange={v=>setForm(f=>({...f,patientPhone:v}))} type="tel" placeholder="10-digit mobile number"/>
            <FInput T={T} label="Consultation Type" value={form.type||""} onChange={v=>setForm(f=>({...f,type:v}))} options={["Consultation","Follow-up","Check-up","New Patient","Vaccination","Surgery Pre-op","Emergency","Telemedicine"]}/>
            <FInput T={T} label="Department" value={form.dept||""} onChange={v=>setForm(f=>({...f,dept:v}))} options={DEPT_LIST}/>
            <FInput T={T} label="Doctor" value={form.doctor||""} onChange={v=>setForm(f=>({...f,doctor:v}))}/>
            <FInput T={T} label="Consultation Fee (₹)" value={form.fee||""} onChange={v=>setForm(f=>({...f,fee:v}))} type="number"/>
            <FInput T={T} label="Date" value={form.date||""} onChange={v=>setForm(f=>({...f,date:v}))} type="date" required/>
            <FInput T={T} label="Time" value={form.time||""} onChange={v=>setForm(f=>({...f,time:v}))} type="time" required/>
            <FInput T={T} label="Payment Mode" value={form.paymentMode||"Cash"} onChange={v=>setForm(f=>({...f,paymentMode:v}))} options={PAYMENT_MODES}/>
            <FInput T={T} label="Status" value={form.status||""} onChange={v=>setForm(f=>({...f,status:v}))} options={["Confirmed","In Progress","Waiting","Completed","Cancelled"]}/>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:T.muted,fontWeight:700}}>Discount:</span>
            <input type="number" value={form.discount||"0"} onChange={e=>setForm(f=>({...f,discount:e.target.value}))} style={{width:70,padding:"7px 9px",borderRadius:7,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface2,color:T.text}}/>
            <select value={form.discountType||"flat"} onChange={e=>setForm(f=>({...f,discountType:e.target.value}))} style={{padding:"7px 9px",borderRadius:7,border:`1.5px solid ${T.border2}`,fontSize:12,fontFamily:"inherit",outline:"none",background:T.surface2,color:T.text}}>
              <option value="flat">₹ Flat</option><option value="percent">%</option>
            </select>
            {form.fee&&<span style={{fontSize:12,color:T.accent,fontWeight:700}}>Net: {fmtAmt(Math.max(0,(parseFloat(form.fee)||0)-(form.discountType==="percent"?(parseFloat(form.fee)||0)*(parseFloat(form.discount)||0)/100:parseFloat(form.discount)||0)))}</span>}
          </div>
          <FInput T={T} label="Notes" value={form.notes||""} onChange={v=>setForm(f=>({...f,notes:v}))} multiline rows={2}/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <Btn T={T} label="Cancel" variant="secondary" onClick={()=>setModal(null)}/>
            <Btn T={T} label={modal==="add"?"Create Appointment":"Save Changes"} onClick={saveFn}/>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal T={T} message={`Delete appointment for "${confirm.patientName}"?`} onConfirm={()=>{setAppointments(p=>p.filter(x=>x.id!==confirm.id));setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    </>
  );
}

//  PATIENT HISTORY
function PatientHistory({patients,prescriptions,lab,billing,appointments,T}){
  const w=useWindowWidth();const mob=w<640;
  const[search,setSearch]=useState("");const[sel,setSel]=useState(null);
  const filtered=patients.filter(p=>!search||p.fullName?.toLowerCase().includes(search.toLowerCase())||p.patientId?.toLowerCase().includes(search.toLowerCase())||p.phone?.includes(search));
  const getHistory=p=>({rxs:prescriptions.filter(r=>r.patientId===p.patientId||r.patientName===p.fullName),labs:lab.filter(l=>l.patientId===p.patientId||l.patient===p.fullName),bills:billing.filter(b=>b.patientId===p.patientId||b.patient===p.fullName),appts:appointments.filter(a=>a.patientId===p.patientId||a.patientName===p.fullName)});

  const printHistory=p=>{
    const{rxs,labs,bills}=getHistory(p);
    const html=`
      <div class="section">
        <div class="sec-title">Patient Profile</div>
        <div class="token">Token #${p.tokenNo||"—"}</div>
        <div class="g3">
          ${[["Patient ID",p.patientId],["Name",p.fullName],["Age",`${p.age||"—"} yrs`],["Gender",p.gender||"—"],["Blood Group",p.bloodGroup||"—"],["Phone",p.phone||"—"],["Email",p.email||"—"],["Department",p.dept||"—"],["Status",p.status||"—"]].map(([l,v])=>`<div class="field"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
        </div>
        ${p.allergies?`<div style="background:#fff1f2;border:1px solid #be123c;border-radius:8px;padding:10px;margin-top:10px"><strong style="color:#be123c">Allergies:</strong> ${p.allergies}</div>`:""}
      </div>
      ${rxs.length?`<div class="section"><div class="sec-title">Prescriptions (${rxs.length})</div><table><thead><tr><th>ID</th><th>Doctor</th><th>Diagnosis</th><th>Date</th><th>Medicines</th></tr></thead><tbody>${rxs.map(r=>`<tr><td>${r.prescriptionId}</td><td>Dr. ${r.doctorName}</td><td>${r.diagnosis}</td><td>${r.date}</td><td>${r.medicines?.length||0} item(s)</td></tr>`).join("")}</tbody></table></div>`:""}
      ${labs.length?`<div class="section"><div class="sec-title">Lab Tests (${labs.length})</div><table><thead><tr><th>ID</th><th>Test</th><th>Status</th><th>Result</th><th>Date</th></tr></thead><tbody>${labs.map(l=>`<tr><td>${l.id}</td><td>${l.test}</td><td>${l.status}</td><td>${l.result||"—"}</td><td>${l.collected}</td></tr>`).join("")}</tbody></table></div>`:""}
      ${bills.length?`<div class="section"><div class="sec-title">Billing (${bills.length})</div><table><thead><tr><th>ID</th><th>Date</th><th>Amount</th><th>Paid</th><th>Status</th></tr></thead><tbody>${bills.map(b=>`<tr><td>${b.id}</td><td>${b.date}</td><td>${fmtAmt(parseFloat(b.amount)||0)}</td><td>${fmtAmt(parseFloat(b.paid)||0)}</td><td>${b.status}</td></tr>`).join("")}</tbody></table></div>`:""}`;
    printDoc(`Medical History — ${p.fullName}`,html);
  };

  return(
    <>
      <PageHeader T={T} title="Patient Medical History" subtitle="Complete patient timeline"/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"300px 1fr",gap:16}}>
        <div>
          <div style={{marginBottom:12}}><SearchInput value={search} onChange={setSearch} placeholder="Search patient…" T={T}/></div>
          <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:"70vh",overflowY:"auto"}}>
            {filtered.map(p=>(
              <div key={p.patientId} onClick={()=>setSel(p)} style={{...card(T,{padding:"13px 15px",cursor:"pointer",border:`2px solid ${sel?.patientId===p.patientId?T.accent:T.border}`})}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontWeight:700,color:T.text,fontSize:13.5}}>{p.fullName}</div>
                    <div style={{fontSize:11,color:T.accent,fontFamily:"monospace",fontWeight:700}}>{p.patientId}</div>
                    {p.tokenNo&&<div style={{fontSize:10.5,color:T.muted}}>Token #{p.tokenNo}</div>}
                  </div>
                  <Badge status={p.status} T={T}/>
                </div>
                <div style={{marginTop:7,display:"flex",gap:6,flexWrap:"wrap"}}>
                  {p.bloodGroup&&<span style={{fontSize:11,background:T.warnBg,color:T.warn,borderRadius:6,padding:"1px 7px",fontWeight:700}}>{p.bloodGroup}</span>}
                  <span style={{fontSize:11,color:T.muted}}>{p.age?`${p.age} yrs`:""}</span>
                  <span style={{fontSize:11,color:T.muted}}>{p.phone}</span>
                </div>
              </div>
            ))}
            {filtered.length===0&&<div style={{...card(T,{padding:"36px",textAlign:"center"}),color:T.muted,fontSize:12.5}}>No patients found</div>}
          </div>
        </div>
        {sel?(()=>{
          const{rxs,labs,bills,appts}=getHistory(sel);
          return(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={card(T,{padding:"18px 22px"})}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <div style={{fontSize:21,fontWeight:800,color:T.text}}>{sel.fullName}</div>
                    <div style={{fontSize:11.5,color:T.accent,fontFamily:"monospace",fontWeight:700,marginTop:2}}>{sel.patientId}</div>
                    {sel.tokenNo&&<div style={{fontSize:11.5,color:T.muted,marginTop:2}}>Token #{sel.tokenNo}</div>}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <Btn T={T} label="🖨 Print History" variant="secondary" small onClick={()=>printHistory(sel)}/>
                    <Badge status={sel.status} T={T}/>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[["Age",`${sel.age||"—"} yrs`],["Gender",sel.gender||"—"],["Blood Group",sel.bloodGroup||"—"],["Phone",sel.phone||"—"],["City",sel.city||"—"],["Doctor",sel.doctorAssigned||"—"]].map(([l,v])=>(
                    <div key={l} style={{background:T.surface2,borderRadius:8,padding:"9px 11px",border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:9.5,color:T.muted,textTransform:"uppercase",fontWeight:700,marginBottom:2}}>{l}</div>
                      <div style={{fontWeight:700,color:T.text,fontSize:12.5}}>{v}</div>
                    </div>
                  ))}
                </div>
                {(sel.allergies||sel.existingDiseases)&&(
                  <div style={{marginTop:12,display:"flex",gap:10,flexWrap:"wrap"}}>
                    {sel.allergies&&<div style={{padding:"7px 12px",background:T.dangerBg,borderRadius:8,border:`1px solid ${T.danger}`,fontSize:11.5}}><span style={{fontWeight:700,color:T.danger}}>Allergies: </span><span style={{color:T.text2}}>{sel.allergies}</span></div>}
                    {sel.existingDiseases&&<div style={{padding:"7px 12px",background:T.warnBg,borderRadius:8,border:`1px solid ${T.warn}`,fontSize:11.5}}><span style={{fontWeight:700,color:T.warn}}>Conditions: </span><span style={{color:T.text2}}>{sel.existingDiseases}</span></div>}
                  </div>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:12}}>
                <SectionCard T={T} title="Prescriptions" count={rxs.length} color={T.purple}>{rxs.length===0?<p style={{color:T.muted,fontSize:12}}>None on record</p>:rxs.slice(0,3).map(r=>(<div key={r.prescriptionId} style={{paddingBottom:9,marginBottom:9,borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700,color:T.accent,fontSize:11.5}}>{r.prescriptionId}</span><span style={{fontSize:10.5,color:T.muted}}>{r.date}</span></div><div style={{fontSize:11.5,color:T.text2,marginTop:2}}>Dr. {r.doctorName} — {r.diagnosis}</div><div style={{fontSize:10.5,color:T.muted,marginTop:1}}>{r.medicines?.length||0} medicine(s)</div></div>))}</SectionCard>
                <SectionCard T={T} title="Lab Tests" count={labs.length} color={T.accent}>{labs.length===0?<p style={{color:T.muted,fontSize:12}}>None on record</p>:labs.slice(0,3).map(l=>(<div key={l.id} style={{paddingBottom:9,marginBottom:9,borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700,fontSize:11.5}}>{l.test}</span><Badge status={l.status} T={T}/></div><div style={{fontSize:10.5,color:T.muted,marginTop:2}}>{l.collected}</div></div>))}</SectionCard>
                <SectionCard T={T} title="Appointments" count={appts.length} color={T.success}>{appts.length===0?<p style={{color:T.muted,fontSize:12}}>None on record</p>:appts.slice(0,3).map(a=>(<div key={a.id} style={{paddingBottom:9,marginBottom:9,borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700,fontSize:11.5}}>{a.type}</span><Badge status={a.status} T={T}/></div><div style={{fontSize:10.5,color:T.muted,marginTop:2}}>{fmtDate(a.date)} {a.time}</div></div>))}</SectionCard>
                <SectionCard T={T} title="Billing" count={bills.length} color={T.warn}>{bills.length===0?<p style={{color:T.muted,fontSize:12}}>None on record</p>:bills.slice(0,3).map(b=>(<div key={b.id} style={{paddingBottom:9,marginBottom:9,borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700,fontSize:11.5}}>{fmtAmt(parseFloat(b.amount)||0)}</span><Badge status={b.status} T={T}/></div><div style={{fontSize:10.5,color:T.muted,marginTop:2}}>{b.date} · {b.paymentMode||"—"}</div></div>))}</SectionCard>
              </div>
            </div>
          );
        })():<div style={{...card(T,{padding:"70px",textAlign:"center"}),color:T.muted}}><div style={{fontSize:38,marginBottom:12}}>🔍</div><div style={{fontWeight:700,fontSize:14}}>Select a patient to view medical history</div></div>}
      </div>
    </>
  );
}

//  DASHBOARD OVERVIEW
function DashboardOverview({patients,appointments,billing,lab,pharmacy,doctors,departments,inventory,T}){
  const w=useWindowWidth();const mob=w<640;
  const dateStr=new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const stored=JSON.parse(localStorage.getItem("hospitalUser")||"{}");
  const totalBilled=billing.reduce((a,b)=>a+(parseFloat(b.amount)||0),0);
  const totalCollected=billing.reduce((a,b)=>a+(parseFloat(b.paid)||0),0);
  const alerts=[{l:"Pending Lab Tests",v:lab.filter(l=>l.status==="Pending").length,c:T.warn},{l:"Pending Dispensing",v:pharmacy.filter(p=>p.status==="Pending").length,c:T.purple},{l:"Unpaid Bills",v:billing.filter(b=>b.status==="Unpaid").length,c:T.danger},{l:"Low Stock Items",v:(inventory||[]).filter(i=>i.status==="Low Stock").length,c:T.danger},{l:"Waiting Appointments",v:appointments.filter(a=>a.status==="Waiting").length,c:T.warn},{l:"Doctors on Leave",v:doctors.filter(d=>d.status==="On Leave").length,c:T.muted}];

  return(
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:mob?"flex-start":"center",flexDirection:mob?"column":"row",marginBottom:24,gap:12}}>
        <div><h1 style={{margin:0,fontSize:mob?20:25,fontWeight:800,color:T.text,letterSpacing:"-0.5px"}}>Good {new Date().getHours()<12?"morning":"afternoon"}, {stored.contactPerson?.split(" ")[0]||"Admin"} 👋</h1><p style={{margin:"3px 0 0",fontSize:12.5,color:T.muted}}>{dateStr}</p></div>
        <div style={{background:T.accentBg,border:`1px solid ${T.accent}`,borderRadius:10,padding:"9px 15px",fontSize:12.5,fontWeight:600,color:T.accent}}>{stored.facilityName||"Hospital"}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total Patients" value={patients.length} sub={`${patients.filter(p=>p.status==="Admitted").length} admitted`} color={T.accent}/>
        <StatCard T={T} label="Today Appointments" value={appointments.filter(a=>a.date===todayISO()).length} sub={`${appointments.length} total`} color={T.purple}/>
        <StatCard T={T} label="Revenue Collected" value={fmtAmt(totalCollected)} sub={`${fmtAmt(totalBilled-totalCollected)} pending`} color={T.success}/>
        <StatCard T={T} label="Doctors on Duty" value={doctors.filter(d=>d.status==="Available").length} sub={`of ${doctors.length} total`} color={T.warn}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
        <SectionCard T={T} title="Alerts & Pending" color={T.danger}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {alerts.map((a,i)=>(<div key={i} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:9,padding:"11px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11.5,color:T.muted}}>{a.l}</span><span style={{fontWeight:800,fontSize:17,color:a.v>0?a.c:T.success}}>{a.v}</span></div>))}
          </div>
        </SectionCard>
        <SectionCard T={T} title="Recent Patients" count={patients.length} color={T.accent}>
          {patients.length===0?<p style={{color:T.muted,fontSize:12,textAlign:"center",padding:"18px 0"}}>No patients yet</p>:patients.slice(0,5).map((p,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<4?`1px solid ${T.border}`:"none"}}><div style={{display:"flex",alignItems:"center",gap:9}}><div style={{width:32,height:32,borderRadius:"50%",background:T.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:T.accent,flexShrink:0}}>{p.fullName?.charAt(0)||"?"}</div><div><div style={{fontWeight:700,color:T.text,fontSize:12.5}}>{p.fullName}</div><div style={{fontSize:10.5,color:T.muted}}>{p.patientId} · Token #{p.tokenNo||"—"}</div></div></div><Badge status={p.status} T={T}/></div>))}
        </SectionCard>
        <SectionCard T={T} title="Upcoming Appointments" color={T.purple}>
          {appointments.filter(a=>["Confirmed","Waiting"].includes(a.status)).length===0?<p style={{color:T.muted,fontSize:12,textAlign:"center",padding:"18px 0"}}>No upcoming appointments</p>:appointments.filter(a=>["Confirmed","Waiting"].includes(a.status)).slice(0,5).map((a,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}><div><div style={{fontWeight:600,color:T.text,fontSize:12.5}}>{a.patientName}</div><div style={{fontSize:10.5,color:T.muted}}>{a.dept} · {a.time}</div></div><Badge status={a.status} T={T}/></div>))}
        </SectionCard>
        <SectionCard T={T} title="Department Occupancy" color={T.success}>
          {departments.length===0?<p style={{color:T.muted,fontSize:12,textAlign:"center",padding:"18px 0"}}>No departments added</p>:departments.slice(0,5).map((d,i)=>{const pct=Math.min(Math.round((+d.occupied/+d.capacity)*100)||0,100);const high=pct>=85;return(<div key={i} style={{marginBottom:11}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{fontWeight:600,color:T.text}}>{d.name}</span><span style={{fontWeight:700,color:high?T.danger:T.muted}}>{d.occupied||0}/{d.capacity||0}</span></div><div style={{height:6,background:T.surface2,borderRadius:99,overflow:"hidden",border:`1px solid ${T.border}`}}><div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:high?T.danger:T.accent}}/></div></div>);})}
        </SectionCard>
      </div>
    </>
  );
}

//  PROFILE SECTION
function ProfileSection({T}){
  const w=useWindowWidth();const mob=w<768;
  const stored=JSON.parse(localStorage.getItem("hospitalUser")||"{}");
  const[editing,setEditing]=useState(false);const[saved,setSaved]=useState(false);const[saveError,setSaveError]=useState("");const[loading,setLoading]=useState(true);
  const[photoUploading,setPhotoUploading]=useState(false);
  const[form,setForm]=useState({
    facilityName:stored.facilityName||"",email:stored.email||"",phone:stored.phone||"",
    registrationNumber:stored.registrationNumber||"",licenseNumber:stored.licenseNumber||"",
    city:stored.city||"",state:stored.state||"",facilityType:stored.facilityType||"Hospital",
    numberOfBeds:stored.numberOfBeds||"",establishedYear:stored.establishedYear||"",
    profilePhotoUrl:stored.profilePhotoUrl||"",
    registrationCertUrl:stored.registrationCertUrl||"",licenseCertUrl:stored.licenseCertUrl||"",
    ownerIdDocUrl:stored.ownerIdDocUrl||"",buildingPermitUrl:stored.buildingPermitUrl||""
  });

  useEffect(()=>{
    (async()=>{
      try{
        const data=await apiFetch("/api/hospital/profile");
        if(data?.facility){
          const f=data.facility;
          setForm({facilityName:f.facilityName||"",email:f.email||"",phone:f.phone||"",registrationNumber:f.registrationNumber||"",licenseNumber:f.licenseNumber||"",city:f.city||"",state:f.state||"",facilityType:f.facilityType||"Hospital",numberOfBeds:String(f.numberOfBeds||""),establishedYear:String(f.establishedYear||""),profilePhotoUrl:f.profilePhotoUrl||"",registrationCertUrl:f.registrationCertUrl||"",licenseCertUrl:f.licenseCertUrl||"",ownerIdDocUrl:f.ownerIdDocUrl||"",buildingPermitUrl:f.buildingPermitUrl||""});
          localStorage.setItem("hospitalUser",JSON.stringify({...stored,...f}));
        }
      }catch(e){console.warn(e.message);}finally{setLoading(false);}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleSave=async()=>{
    setSaveError("");
    try{
      const data=await apiFetch("/api/hospital/profile",{method:"PUT",body:JSON.stringify({facilityName:form.facilityName,phone:form.phone,licenseNumber:form.licenseNumber,city:form.city,state:form.state,facilityType:form.facilityType,numberOfBeds:form.numberOfBeds?Number(form.numberOfBeds):null,establishedYear:form.establishedYear?Number(form.establishedYear):null})});
      if(data?.facility){localStorage.setItem("hospitalUser",JSON.stringify({...JSON.parse(localStorage.getItem("hospitalUser")||"{}"),... data.facility}));}
      setSaved(true);setEditing(false);setTimeout(()=>setSaved(false),3000);
    }catch{setSaveError("Failed to save.");}
  };

  const handlePhotoUpload=async(e)=>{
    const file=e.target.files[0];if(!file)return;
    if(!file.type.startsWith("image/")){alert("Image files only.");return;}
    if(file.size>5*1024*1024){alert("Max 5MB.");return;}
    setPhotoUploading(true);
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      try{
        const token=getToken();
        const res=await fetch(`${BASE_API}/api/upload`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({file:ev.target.result})});
        const data=await res.json();
        if(data.url){
          await apiFetch("/api/hospital/profile/photo",{method:"PUT",body:JSON.stringify({profilePhotoUrl:data.url,profilePhotoPublicId:data.public_id})});
          setForm(f=>({...f,profilePhotoUrl:data.url}));
          const u=JSON.parse(localStorage.getItem("hospitalUser")||"{}");
          localStorage.setItem("hospitalUser",JSON.stringify({...u,profilePhotoUrl:data.url}));
          window.dispatchEvent(new Event("storage"));
        }else throw new Error(data.message||"Upload failed");
      }catch(err){alert("Photo upload failed: "+err.message);}finally{setPhotoUploading(false);}
    };
    reader.readAsDataURL(file);
  };

  if(loading)return <div style={{textAlign:"center",padding:"60px",color:T.muted}}>Loading profile…</div>;
  const docs=[["Registration Certificate",form.registrationCertUrl],["License Certificate",form.licenseCertUrl],["Owner / Director ID",form.ownerIdDocUrl],["Building / Fire Permit",form.buildingPermitUrl]].filter(([,url])=>url);

  return(
    <>
      <PageHeader T={T} title="Hospital Profile" subtitle="Registration, contact details and invoice logo"/>
      {saved&&<div style={{background:T.successBg,border:`1px solid ${T.success}`,borderRadius:9,padding:"9px 14px",marginBottom:16,color:T.success,fontSize:13,fontWeight:600}}>✓ Profile saved successfully.</div>}
      {saveError&&<div style={{background:T.dangerBg,border:`1px solid ${T.danger}`,borderRadius:9,padding:"9px 14px",marginBottom:16,color:T.danger,fontSize:13,fontWeight:600}}>{saveError}</div>}
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"280px 1fr",gap:18}}>
        {/* LEFT: Photo + Quick Info */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={card(T,{padding:22,textAlign:"center"})}>
            {/* Profile Photo */}
            <div style={{position:"relative",width:90,height:90,margin:"0 auto 14px"}}>
              {form.profilePhotoUrl
                ?<img src={form.profilePhotoUrl} alt="Hospital Logo" style={{width:90,height:90,borderRadius:14,objectFit:"cover",border:`3px solid ${T.accent}`}}/>
                :<div style={{width:90,height:90,borderRadius:14,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:28}}>{(form.facilityName||"H").charAt(0).toUpperCase()}</div>
              }
              <label style={{position:"absolute",bottom:-8,right:-8,cursor:"pointer"}}>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
                <div style={{width:30,height:30,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",border:`2px solid ${T.surface}`,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
                  {photoUploading?"⏳":"📷"}
                </div>
              </label>
            </div>
            <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:2}}>{form.facilityName||"Hospital"}</div>
            <div style={{fontSize:11.5,color:T.muted,marginBottom:12}}>{form.email||"—"}</div>
            {/* Upload button */}
            <label style={{cursor:"pointer",display:"block",marginBottom:10}}>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
              <div style={{background:T.accentBg,color:T.accent,border:`1.5px solid ${T.accent}`,borderRadius:9,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                {photoUploading?"⏳ Uploading…":"📷 Upload Hospital Logo"}
              </div>
            </label>
            <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 11px",fontSize:11,color:T.muted,lineHeight:1.5,textAlign:"left"}}>
              📌 This logo appears on the <strong style={{color:T.accent}}>top-left of every invoice</strong>, prescription, lab report, and other printed documents.
            </div>
            <div style={{marginTop:14,borderTop:`1px solid ${T.border}`,paddingTop:12}}>
              {[["Beds",form.numberOfBeds||"—"],["Est.",form.establishedYear||"—"],["City",form.city||"—"],["Type",form.facilityType||"—"]].map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:6}}><span style={{color:T.muted}}>{k}</span><span style={{fontWeight:600,color:T.text}}>{v}</span></div>))}
            </div>
          </div>
          {/* Invoice Preview Card */}
          <div style={card(T,{padding:16})}>
            <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Invoice Header Preview</div>
            <div style={{background:T.accent,borderRadius:8,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {form.profilePhotoUrl
                  ?<img src={form.profilePhotoUrl} alt="logo" style={{width:32,height:32,borderRadius:5,objectFit:"cover",border:"1.5px solid rgba(255,255,255,0.5)"}}/>
                  :<div style={{width:32,height:32,borderRadius:5,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13}}>{(form.facilityName||"H").charAt(0)}</div>
                }
                <div>
                  <div style={{fontWeight:800,fontSize:11.5,color:"#fff"}}>{form.facilityName||"Hospital Name"}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.8)"}}>{form.city||"City"}, {form.state||"State"}</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:900,fontSize:14,color:"#fff"}}>Bioburg</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.7)"}}>HMS Platform</div>
              </div>
            </div>
            <div style={{fontSize:10,color:T.muted,marginTop:8,textAlign:"center"}}>↑ This is how your header appears on all prints</div>
          </div>
        </div>


        {/* RIGHT: Details */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={card(T,{padding:22})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
              <h3 style={{margin:0,fontSize:13.5,fontWeight:700,color:T.text}}>Registration Details</h3>
              <div style={{display:"flex",gap:8}}>
                {editing&&<Btn T={T} label="Cancel" variant="secondary" onClick={()=>setEditing(false)}/>}
                <Btn T={T} label={editing?"Save Changes":"Edit Profile"} onClick={editing?handleSave:()=>setEditing(true)}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:"14px 24px"}}>
              {[["facilityName","Facility Name"],["email","Email"],["phone","Phone"],["registrationNumber","Reg. No."],["licenseNumber","License No."],["city","City"],["state","State"],["facilityType","Facility Type"],["numberOfBeds","No. of Beds"],["establishedYear","Est. Year"]].map(([key,label])=>{
                const ro=new Set(["email","registrationNumber"]);
                return(
                  <div key={key}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{label}</div>
                    {editing&&!ro.has(key)
                      ?<input value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",padding:"8px 11px",borderRadius:8,border:`1.5px solid ${T.border2}`,fontSize:13,color:T.text,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface2}}/>
                      :<div style={{fontSize:13.5,color:form[key]?T.text:T.muted,fontWeight:500}}>{form[key]||"—"}{ro.has(key)&&editing&&<span style={{fontSize:9.5,color:T.muted,marginLeft:6}}>(cannot edit)</span>}</div>
                    }
                  </div>
                );
              })}
            </div>
          </div>
          <div style={card(T,{padding:22})}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <h3 style={{margin:0,fontSize:13.5,fontWeight:700,color:T.text}}>Submitted Documents</h3>
              <span style={{background:docs.length>0?T.successBg:T.warnBg,color:docs.length>0?T.success:T.warn,border:`1px solid ${docs.length>0?T.success:T.warn}`,borderRadius:99,padding:"2px 9px",fontSize:10.5,fontWeight:700}}>{docs.length} uploaded</span>
            </div>
            {docs.length===0
              ?<div style={{background:T.warnBg,border:`1px solid ${T.warn}`,borderRadius:9,padding:"12px 14px",fontSize:12.5,color:T.warn}}>No documents uploaded during registration.</div>
              :<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
                {docs.map(([label,url])=>(
                  <div key={label} style={{background:T.surface2,borderRadius:9,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                    <div style={{height:90,overflow:"hidden",background:T.border}}><img src={url} alt={label} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/></div>
                    <div style={{padding:"9px 11px"}}><div style={{fontSize:11.5,fontWeight:700,color:T.text,marginBottom:5}}>{label}</div><div style={{display:"flex",gap:5}}><a href={url} target="_blank" rel="noopener noreferrer" style={{flex:1,textAlign:"center",fontSize:11,fontWeight:600,color:T.accent,background:T.accentBg,border:`1px solid ${T.accent}`,borderRadius:6,padding:"4px 0",textDecoration:"none"}}>View ↗</a><a href={url} download style={{flex:1,textAlign:"center",fontSize:11,fontWeight:600,color:T.text2,background:T.surface,border:`1px solid ${T.border2}`,borderRadius:6,padding:"4px 0",textDecoration:"none"}}>Download</a></div></div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      </div>
    </>
  );
}

//  SETTINGS
function SettingsSection({setPatients,setAppointments,setBilling,setLab,T,darkMode,setDarkMode,themeAccent,setThemeAccent,themeName,setThemeName,onSaveTheme}){
  const w=useWindowWidth();const mob=w<768;
  const KEYS=getKeys();
  const[notif,setNotif]=useState(()=>lsGet("hd_notif",{appointments:true,lab:true,billing:false,inventory:true,sms:false}));
  const[pw,setPw]=useState({current:"",newpw:"",confirm:""});
  const[pwMsg,setPwMsg]=useState("");const[saved,setSaved]=useState(false);
  const saveNotif=()=>{lsSet("hd_notif",notif);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const changePw=async()=>{if(!pw.current)return setPwMsg("Enter current password.");if(pw.newpw.length<6)return setPwMsg("Min 6 characters.");if(pw.newpw!==pw.confirm)return setPwMsg("Passwords do not match.");try{await apiFetch("/api/hospital/update-password",{method:"PUT",body:JSON.stringify({currentPassword:pw.current,newPassword:pw.newpw})});setPwMsg("Password updated successfully.");setPw({current:"",newpw:"",confirm:""});setTimeout(()=>setPwMsg(""),3000);}catch{setPwMsg("Failed. Check current password.");}};
  const clearSection=async(section,setter)=>{if(!window.confirm("Permanently delete all records?"))return;setter([]);lsSet(KEYS[section],[]);try{await apiFetch("/api/hospital/dashboard/update",{method:"POST",body:JSON.stringify({section,data:[]})})}catch{}window.location.reload();};

  return(
    <>
      <PageHeader T={T} title="Settings" subtitle="System and account configuration"/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:18}}>
        <div style={{...card(T,{padding:22}),gridColumn:mob?"1":"1/-1"}}> 
          <h3 style={{margin:"0 0 16px",fontSize:13.5,fontWeight:700,color:T.text}}>Theme & Appearance</h3>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${T.border}`,marginBottom:16}}>
            <div><div style={{fontWeight:600,fontSize:13,color:T.text}}>Dark Mode</div><div style={{fontSize:11.5,color:T.muted,marginTop:2}}>Switch interface to dark theme</div></div>
            <div onClick={()=>setDarkMode(d=>!d)} style={{width:46,height:25,borderRadius:99,background:darkMode?T.accent:T.border2,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{position:"absolute",top:3,left:darkMode?23:3,width:19,height:19,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.3)",transition:"left 0.2s"}}/></div>
          </div>
          <div style={{fontSize:11.5,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Preset Color Themes</div>
          <div style={{fontSize:11,color:T.muted,marginBottom:12}}>The selected colour appears on the UI and all printed invoices, prescriptions & reports.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:14}}>
            {PRESET_THEMES.map(preset=>(<button key={preset.name} onClick={()=>{if(setThemeName)setThemeName(preset.name);if(setThemeAccent)setThemeAccent(preset.accent);if(onSaveTheme)onSaveTheme(preset.accent,preset.name);}} style={{padding:"10px 8px",borderRadius:10,border:`2px solid ${(themeName||"default")===preset.name?preset.accent:T.border}`,background:(themeName||"default")===preset.name?hex2rgba(preset.accent,.1):T.surface2,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.15s"}}><div style={{width:24,height:24,borderRadius:"50%",background:preset.accent,margin:"0 auto 6px"}}/><div style={{fontSize:10.5,fontWeight:700,color:(themeName||"default")===preset.name?preset.accent:T.muted}}>{preset.label}</div></button>))}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:11.5,fontWeight:700,color:T.muted,flexShrink:0}}>Custom Colour:</span>
            <input type="color" value={themeAccent||"#0369a1"} onChange={e=>{if(setThemeAccent)setThemeAccent(e.target.value);if(onSaveTheme)onSaveTheme(e.target.value,"custom");}} style={{width:40,height:36,padding:2,borderRadius:8,border:`1.5px solid ${T.border2}`,cursor:"pointer",background:"transparent"}}/>
            <input value={themeAccent||"#0369a1"} onChange={e=>{if(setThemeAccent)setThemeAccent(e.target.value);if(onSaveTheme)onSaveTheme(e.target.value,"custom");}} placeholder="#0369a1" style={{width:100,padding:"7px 10px",borderRadius:8,border:`1.5px solid ${T.border2}`,fontSize:13,fontFamily:"monospace",outline:"none",background:T.surface2,color:T.text}}/>
            <span style={{fontSize:11,color:T.muted}}>Applies to UI and all prints instantly</span>
          </div>
        </div>
        <div style={card(T,{padding:22})}>
          <h3 style={{margin:"0 0 16px",fontSize:13.5,fontWeight:700,color:T.text}}>Notifications</h3>
          {[{key:"appointments",l:"Appointment Reminders"},{key:"lab",l:"Lab Results Ready"},{key:"billing",l:"Payment Alerts"},{key:"inventory",l:"Low Stock Warnings"},{key:"sms",l:"SMS Reminders"}].map(item=>(<div key={item.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10,marginBottom:10,borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:12.5,color:T.text}}>{item.l}</span><div onClick={()=>setNotif(n=>({...n,[item.key]:!n[item.key]}))} style={{width:42,height:23,borderRadius:99,background:notif[item.key]?T.accent:T.border2,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{position:"absolute",top:3,left:notif[item.key]?21:3,width:17,height:17,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/></div></div>))}
          <Btn T={T} label={saved?"✓ Saved!":"Save Preferences"} onClick={saveNotif}/>
        </div>
        <div style={card(T,{padding:22})}>
          <h3 style={{margin:"0 0 16px",fontSize:13.5,fontWeight:700,color:T.text}}>Change Password</h3>
          {pwMsg&&<div style={{background:pwMsg.includes("success")?T.successBg:T.dangerBg,color:pwMsg.includes("success")?T.success:T.danger,border:`1px solid ${pwMsg.includes("success")?T.success:T.danger}`,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12.5}}>{pwMsg}</div>}
          {[["Current Password","current"],["New Password","newpw"],["Confirm Password","confirm"]].map(([label,key])=>(<div key={key} style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{label}</div><input type="password" value={pw[key]} onChange={e=>setPw(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"8px 11px",borderRadius:8,border:`1.5px solid ${T.border2}`,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:T.surface2,color:T.text}}/></div>))}
          <Btn T={T} label="Update Password" onClick={changePw}/>
        </div>
        <div style={card(T,{padding:22})}>
          <h3 style={{margin:"0 0 16px",fontSize:13.5,fontWeight:700,color:T.text}}>System Information</h3>
          {[["Timezone","Asia/Kolkata (IST)"],["Currency","Indian Rupee (₹)"],["Date Format","DD MMM YYYY"],["Version","4.0.0"],["Support","support@bioburg.in"]].map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10,marginBottom:10,borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:12.5,color:T.muted}}>{k}</span><span style={{fontSize:11.5,fontWeight:600,color:T.text,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 9px"}}>{v}</span></div>))}
        </div>
        <div style={{...card(T,{padding:22}),gridColumn:mob?"1":"1/-1"}}>
          <h3 style={{margin:"0 0 5px",fontSize:13.5,fontWeight:700,color:T.text}}>Data Management</h3>
          <p style={{fontSize:11.5,color:T.muted,marginBottom:14}}>These actions permanently delete records from MongoDB and cannot be undone.</p>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(4,1fr)",gap:10}}>
            {[["Clear Patients","patients",setPatients],["Clear Appointments","appointments",setAppointments],["Clear Billing","billing",setBilling],["Clear Lab Records","lab",setLab]].map(([label,section,setter])=>(<div key={section} style={{background:T.dangerBg,border:`1px solid ${T.danger}`,borderRadius:9,padding:"13px",textAlign:"center"}}><div style={{fontWeight:600,fontSize:12.5,color:T.text,marginBottom:9}}>{label}</div><Btn T={T} label="Clear All" variant="danger" small onClick={()=>clearSection(section,setter)}/></div>))}
          </div>
        </div>
      </div>
    </>
  );
}

//  PURCHASE ORDERS
function PurchaseOrders({T}){
  const w=useWindowWidth();const mob=w<640;
  const[orders,setOrders]=useState([]);const[loading,setLoading]=useState(true);const[search,setSearch]=useState("");const[filter,setFilter]=useState("all");
  useEffect(()=>{(async()=>{try{const data=await apiFetch("/api/hospital/my-orders");setOrders(data.orders||[]);}catch(e){console.warn(e.message);}finally{setLoading(false);}})();},[]);
  const STATUS_COLOR={PLACED:{c:T.accent,bg:T.accentBg},CONFIRMED:{c:T.success,bg:T.successBg},PROCESSING:{c:T.purple,bg:T.purpleBg},SHIPPED:{c:T.accent,bg:T.accentBg},OUT_FOR_DELIVERY:{c:T.warn,bg:T.warnBg},DELIVERED:{c:T.success,bg:T.successBg},CANCELLED:{c:T.danger,bg:T.dangerBg}};
  const StatusPill=({status})=>{const s=STATUS_COLOR[status]||{c:T.muted,bg:T.surface2};return <span style={{background:s.bg,color:s.c,border:`1px solid ${s.c}`,borderRadius:99,padding:"2px 9px",fontSize:10.5,fontWeight:700,whiteSpace:"nowrap"}}>{status?.replace(/_/g," ")}</span>;};
  const tabs=["all","PLACED","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"];
  const filtered=orders.filter(o=>filter==="all"||o.orderStatus===filter).filter(o=>!search||o.orderId?.toLowerCase().includes(search.toLowerCase())||o.items?.some(i=>i.name?.toLowerCase().includes(search.toLowerCase())));
  const counts=tabs.reduce((a,s)=>({...a,[s]:s==="all"?orders.length:orders.filter(o=>o.orderStatus===s).length}),{});
  if(loading)return <div style={{display:"flex",justifyContent:"center",padding:"60px",color:T.muted}}><div style={{width:36,height:36,borderRadius:"50%",border:`4px solid ${T.border}`,borderTopColor:T.accent,animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  return(
    <>
      <PageHeader T={T} title="Purchase Orders" subtitle="Orders placed via the BioBurg platform"/>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard T={T} label="Total Orders" value={orders.length} color={T.accent}/>
        <StatCard T={T} label="Delivered" value={orders.filter(o=>o.orderStatus==="DELIVERED").length} color={T.success}/>
        <StatCard T={T} label="In Progress" value={orders.filter(o=>["PLACED","CONFIRMED","PROCESSING","SHIPPED"].includes(o.orderStatus)).length} color={T.purple}/>
        <StatCard T={T} label="Total Spent" value={fmtAmt(orders.filter(o=>o.orderStatus==="DELIVERED").reduce((a,o)=>a+(o.totalAmount||0),0))} color={T.warn}/>
      </div>
      <div style={card(T,{padding:"16px"})}>
        <div style={{display:"flex",justifyContent:"space-between",flexDirection:mob?"column":"row",marginBottom:14,gap:10}}>
          <FilterTabs tabs={tabs} active={filter} onChange={setFilter} counts={counts} T={T}/>
          <SearchInput value={search} onChange={setSearch} placeholder="Search order ID, item…" T={T}/>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:640,fontSize:12.5}}>
            <thead><tr style={{background:T.surface2,borderBottom:`2px solid ${T.border}`}}>{["Order ID","Date","Items","Amount","Payment","Status"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:"48px",color:T.muted,fontSize:13}}>{orders.length===0?"No orders placed yet.":"No orders match filter."}</td></tr>}
              {filtered.map((o,i)=>(
                <tr key={o._id} style={{borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"11px 12px"}}><span style={{fontFamily:"monospace",color:T.accent,fontWeight:800,fontSize:11}}>{o.orderId||o._id?.slice(-8).toUpperCase()}</span></td>
                  <td style={{padding:"11px 12px",color:T.muted,fontSize:11.5}}>{o.createdAt?new Date(o.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}</td>
                  <td style={{padding:"11px 12px"}}><div style={{maxWidth:180}}>{(o.items||[]).slice(0,2).map((item,j)=><div key={j} style={{fontSize:11.5,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name||"Unnamed"} × {item.quantity}</div>)}{(o.items?.length||0)>2&&<div style={{fontSize:10.5,color:T.muted}}>+{o.items.length-2} more</div>}</div></td>
                  <td style={{padding:"11px 12px"}}><strong style={{color:T.success}}>{fmtAmt(o.totalAmount||0)}</strong></td>
                  <td style={{padding:"11px 12px"}}><span style={{fontSize:11,background:T.accentBg,color:T.accent,borderRadius:5,padding:"2px 7px",fontWeight:600}}>{o.paymentMode||"—"}</span></td>
                  <td style={{padding:"11px 12px"}}><StatusPill status={o.orderStatus}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

//  SIDEBAR + MAIN LAYOUT
const NAV_ITEMS=[
  {key:"dashboard",label:"Dashboard"},{key:"patients",label:"Patients"},{key:"consultation",label:"Consultation"},
  {key:"prescriptions",label:"Prescriptions"},{key:"appointments",label:"Appointments"},{key:"history",label:"Medical History"},
  {key:"billing",label:"Billing"},{key:"lab",label:"Lab Reports"},{key:"pharmacy",label:"Pharmacy"},
  {key:"orders",label:"Purchase Orders"},{key:"staff",label:"Staff"},{key:"reports",label:"Reports"},
  {key:"profile",label:"Profile"},{key:"settings",label:"Settings"},
];
const NAV_GROUPS=[
  {label:"Main",items:["dashboard"]},{label:"Clinical",items:["patients","consultation","prescriptions","appointments","history"]},
  {label:"Finance",items:["billing","lab","pharmacy","orders"]},{label:"Admin",items:["staff","reports","profile","settings"]},
];

function Sidebar({active,onChange,userName,facilityName,profilePhoto,onLogout,badges,T,darkMode,setDarkMode}){
  const itemMap=Object.fromEntries(NAV_ITEMS.map(i=>[i.key,i]));
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0,background:T.sidebar}}>
      <div style={{padding:"18px 14px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div><div style={{fontWeight:800,fontSize:13.5,color:"#f1f5f9",letterSpacing:"-0.2px"}}>Bioburg</div><div style={{fontSize:9.5,color:T.sidebarText,fontWeight:500}}>Hospital Management</div></div>
          {profilePhoto && (
  <img src={profilePhoto} alt="hospital" style={{width:34,height:34,borderRadius:8,objectFit:"cover",border:`2px solid rgba(255,255,255,0.3)`,flexShrink:0,marginRight:2}}/>
)}
          <div onClick={()=>setDarkMode(d=>!d)} style={{marginLeft:"auto",width:30,height:17,borderRadius:99,background:darkMode?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.1)",cursor:"pointer",position:"relative",border:"1px solid rgba(255,255,255,0.1)",transition:"background 0.2s",flexShrink:0}}>
            <div style={{position:"absolute",top:2,left:darkMode?13:2,width:11,height:11,borderRadius:"50%",background:darkMode?T.accent:"#94a3b8",transition:"left 0.2s"}}/>
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px 8px"}}>
        {NAV_GROUPS.map(group=>(
          <div key={group.label} style={{marginBottom:6}}>
            <div style={{fontSize:8.5,fontWeight:700,color:"rgba(148,163,184,0.45)",letterSpacing:"0.16em",textTransform:"uppercase",padding:"7px 10px 3px"}}>{group.label}</div>
            {group.items.map(key=>{
              const item=itemMap[key];const isActive=active===key;const badge=badges[key];
              return(
                <button key={key} onClick={()=>onChange(key)} style={{width:"100%",padding:"8px 11px",display:"flex",alignItems:"center",gap:9,border:`1px solid ${isActive?"rgba(56,189,248,0.2)":"transparent"}`,borderRadius:9,cursor:"pointer",fontFamily:"inherit",fontWeight:isActive?700:500,fontSize:12.5,background:isActive?T.sidebarActiveBg:"transparent",color:isActive?T.sidebarActive:T.sidebarText,transition:"all 0.12s",marginBottom:1,textAlign:"left"}}>
                  <span style={{fontSize:13,flexShrink:0}}>{item.icon}</span>
                  <span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</span>
                  {badge>0&&<span style={{background:"#f43f5e",color:"#fff",borderRadius:99,padding:"0 5px",fontSize:9.5,fontWeight:700,flexShrink:0}}>{badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{padding:"8px 10px 12px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"9px 11px",marginBottom:7}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            {profilePhoto
  ?<img src={profilePhoto} alt="logo" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",border:`2px solid ${T.accent}`,flexShrink:0}}/>
  :<div style={{width:28,height:28,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:11,flexShrink:0}}>{(userName||"H").charAt(0).toUpperCase()}</div>
}
            <div style={{overflow:"hidden"}}><div style={{fontSize:12,fontWeight:700,color:"#f1f5f9",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{userName}</div><div style={{fontSize:10,color:T.sidebarText}}>Hospital Admin</div></div>
          </div>
          <div style={{fontSize:10,color:T.accent,background:"rgba(56,189,248,0.1)",borderRadius:5,padding:"2px 7px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{facilityName}</div>
        </div>
        <button onClick={()=>window.open("/","_blank")} style={{width:"100%",padding:"8px 11px",border:`1px solid rgba(255,255,255,0.1)`,borderRadius:9,cursor:"pointer",background:"rgba(255,255,255,0.05)",color:"#94a3b8",fontWeight:600,fontSize:12,fontFamily:"inherit",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          🛍️ Visit Store
        </button>
        <button onClick={onLogout} style={{width:"100%",padding:"8px 11px",border:"1px solid rgba(251,113,133,0.3)",borderRadius:9,cursor:"pointer",background:"rgba(251,113,133,0.08)",color:"#fb7185",fontWeight:600,fontSize:12,fontFamily:"inherit"}}>Sign Out</button>
      </div>
    </div>
  );
}

const SIDEBAR_W=232;

//  MAIN APP - Replace entire export default function HospitalDashboard()
export default function HospitalDashboard(){
  const[active,setActive]=useState("dashboard");
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const[loading,setLoading]=useState(true);
  const[darkMode,setDarkMode]=useState(()=>lsGet("hd_dark",false));
  const[themeAccent,setThemeAccent]=useState(()=>lsGet("hd_accent","#0369a1"));
  const[themeAccentHov,setThemeAccentHov]=useState(()=>lsGet("hd_accentHov","#0284c7"));
  const[themeName,setThemeName]=useState(()=>lsGet("hd_themeName","default"));
  const[profilePhoto,setProfilePhoto]=useState(()=>JSON.parse(localStorage.getItem("hospitalUser")||"{}").profilePhotoUrl||null);
  const navigate=useNavigate();
  const w2=useWindowWidth();const isMobile=w2<768;
  const T=useMemo(()=>buildTheme(darkMode?"dark":"light",themeAccent,themeAccentHov),[darkMode,themeAccent,themeAccentHov]);

  const handleSaveTheme=async(accent,name)=>{
    const preset=PRESET_THEMES.find(p=>p.name===name);
    const hov=preset?preset.accentHov:accent;
    setThemeAccentHov(hov);
    lsSet("hd_accent",accent);lsSet("hd_accentHov",hov);lsSet("hd_themeName",name);
    const u=JSON.parse(localStorage.getItem("hospitalUser")||"{}");
    localStorage.setItem("hospitalUser",JSON.stringify({...u,themeColor:accent}));
    try{await apiFetch("/api/hospital/profile/theme",{method:"PUT",body:JSON.stringify({themeColor:accent,themeMode:darkMode?"dark":"light",themeName:name})});}catch{}
  };

  const KEYS=getKeys();
  const[patients,setPatients]=useStore(KEYS.patients,[],"patients");
  const[appointments,setAppointments]=useStore(KEYS.appointments,[],"appointments");
  const[doctors,setDoctors]=useStore(KEYS.doctors,[],"doctors");
  const[departments,setDepartments]=useStore(KEYS.departments,[],"departments");
  const[lab,setLab]=useStore(KEYS.lab,[],"lab");
  const[pharmacy,setPharmacy]=useStore(KEYS.pharmacy,[],"pharmacy");
  const[billing,setBilling]=useStore(KEYS.billing,[],"billing");
  const[inventory,setInventory]=useStore(KEYS.inventory,[],"inventory");
  const[staff,setStaff]=useStore(KEYS.staff,[],"staff");
  const[prescriptions,setPrescriptions]=useStore(KEYS.prescriptions,[],"prescriptions");

  const stored=JSON.parse(localStorage.getItem("hospitalUser")||"{}");
  const userName=stored?.contactPerson||stored?.name||"Admin";
  const facilityName=stored?.facilityName||stored?.name||"Hospital";

  useEffect(()=>{lsSet("hd_dark",darkMode);document.body.style.background=T.bg;},[darkMode,T]);
  useEffect(()=>{
    const h=()=>{const u=JSON.parse(localStorage.getItem("hospitalUser")||"{}");setProfilePhoto(u.profilePhotoUrl||null);};
    window.addEventListener("storage",h);return()=>window.removeEventListener("storage",h);
  },[]);
  useEffect(()=>{
    (async()=>{
      try{
        const data=await apiFetch("/api/hospital/dashboard");
        if(data?.data){const d=data.data;const setters={patients:setPatients,appointments:setAppointments,doctors:setDoctors,departments:setDepartments,lab:setLab,pharmacy:setPharmacy,billing:setBilling,inventory:setInventory,staff:setStaff,prescriptions:setPrescriptions};Object.entries(setters).forEach(([key,setter])=>{if(Array.isArray(d[key])){setter(d[key]);lsSet(KEYS[key],d[key]);}});}
        try{const prof=await apiFetch("/api/hospital/profile");if(prof?.facility){const f=prof.facility;if(f.themeColor){setThemeAccent(f.themeColor);lsSet("hd_accent",f.themeColor);}if(f.themeName){setThemeName(f.themeName);}if(f.profilePhotoUrl)setProfilePhoto(f.profilePhotoUrl);const u2=JSON.parse(localStorage.getItem("hospitalUser")||"{}");localStorage.setItem("hospitalUser",JSON.stringify({...u2,...f}));}}catch{}
      }catch(e){console.warn("Backend load failed, using cache",e.message);}finally{setLoading(false);}
    })();
    sessionStorage.setItem("activePortal","hospital");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleLogout=()=>{
    localStorage.clear();
    navigate("/hospital/login");
  };
  const badges={appointments:appointments.filter(a=>a.status==="Waiting").length,lab:lab.filter(l=>l.status==="Pending").length,billing:billing.filter(b=>b.status==="Unpaid").length,pharmacy:pharmacy.filter(p=>p.status==="Pending").length};
  const sp={patients,setPatients,appointments,setAppointments,doctors,setDoctors,departments,setDepartments,lab,setLab,pharmacy,setPharmacy,billing,setBilling,inventory,setInventory,staff,setStaff,prescriptions,setPrescriptions};

  const SECTIONS={
    dashboard:<DashboardOverview {...sp} inventory={inventory} T={T}/>,
    patients:<PatientRegistration patients={patients} setPatients={setPatients} T={T}/>,
    consultation:<DoctorConsultation appointments={appointments} setAppointments={setAppointments} patients={patients} T={T}/>,
    prescriptions:<PrescriptionManagement prescriptions={prescriptions} setPrescriptions={setPrescriptions} patients={patients} inventory={inventory} T={T}/>,
    appointments:<DoctorConsultation appointments={appointments} setAppointments={setAppointments} patients={patients} T={T}/>,
    history:<PatientHistory patients={patients} prescriptions={prescriptions} lab={lab} billing={billing} appointments={appointments} T={T}/>,
    billing:<BillingSection billing={billing} setBilling={setBilling} patients={patients} T={T}/>,
    lab:<LabReports lab={lab} setLab={setLab} patients={patients} T={T}/>,
    pharmacy:<PharmacySection pharmacy={pharmacy} setPharmacy={setPharmacy} inventory={inventory} setInventory={setInventory} patients={patients} T={T}/>,
    orders:<PurchaseOrders T={T}/>,
    departments:<DepartmentsManagement departments={departments} setDepartments={setDepartments} T={T}/>,
    staff:<StaffManagement staff={staff} setStaff={setStaff} doctors={doctors} setDoctors={setDoctors} T={T}/>,
    reports:<ReportsAnalytics {...sp} T={T}/>,
    profile:<ProfileSection T={T}/>,
    settings:<SettingsSection setPatients={setPatients} setAppointments={setAppointments} setBilling={setBilling} setLab={setLab} T={T} darkMode={darkMode} setDarkMode={setDarkMode} themeAccent={themeAccent} setThemeAccent={setThemeAccent} themeName={themeName} setThemeName={setThemeName} onSaveTheme={handleSaveTheme}/>,
  };

  if(loading){return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:T.bg,flexDirection:"column",gap:12}}><div style={{width:42,height:42,borderRadius:"50%",border:`4px solid ${T.border}`,borderTopColor:T.accent,animation:"spin 0.8s linear infinite"}}/><div style={{fontSize:13,color:T.muted,fontWeight:600}}>Loading HMS…</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);}

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif",background:T.bg,transition:"background 0.3s"}}>
      {!isMobile&&(
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          <aside style={{width:SIDEBAR_W,flexShrink:0,overflowY:"auto",boxSizing:"border-box",boxShadow:"2px 0 12px rgba(0,0,0,0.15)"}}>
            <Sidebar active={active} onChange={setActive} userName={userName} facilityName={facilityName} profilePhoto={profilePhoto} onLogout={handleLogout} badges={badges} T={T} darkMode={darkMode} setDarkMode={setDarkMode}/>
          </aside>
          <main style={{flex:1,minWidth:0,padding:"26px 28px",overflowY:"auto",background:T.bg}}>
            {SECTIONS[active]||SECTIONS.dashboard}
          </main>
        </div>
      )}
      {isMobile&&(
        <>
          <div style={{position:"sticky",top:0,background:T.sidebar,borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:150,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{border:"none",background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:13,color:"#f1f5f9"}}>{sidebarOpen?"✕ Close":"☰ Menu"}</button>
            <span style={{fontWeight:700,fontSize:13.5,color:"#f1f5f9"}}>{NAV_ITEMS.find(i=>i.key===active)?.label||"Dashboard"}</span>
            <div style={{width:70}}/>
          </div>
          {sidebarOpen&&(
            <div style={{position:"fixed",inset:0,zIndex:140,display:"flex"}} onClick={()=>setSidebarOpen(false)}>
              <div style={{width:260,height:"100%",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
                <Sidebar active={active} onChange={k=>{setActive(k);setSidebarOpen(false);}} userName={userName} facilityName={facilityName} profilePhoto={profilePhoto} onLogout={handleLogout} badges={badges} T={T} darkMode={darkMode} setDarkMode={setDarkMode}/>
              </div>
              <div style={{flex:1,background:"rgba(0,0,0,0.5)"}}/>
            </div>
          )}
          <main style={{flex:1,padding:"14px 12px 18px",minWidth:0,overflowX:"hidden",background:T.bg}}>
            {SECTIONS[active]||SECTIONS.dashboard}
          </main>
        </>
      )}
    </div>
  );
}