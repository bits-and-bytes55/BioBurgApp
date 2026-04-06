import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');

  .rad-root { font-family: 'DM Sans', sans-serif; background: #f7f9f8; min-height: 100vh; color: #1a1a18; }

  .rad-hero {
    background: linear-gradient(130deg, #0b1f3a 55%, #0d3d30 100%);
    padding: 52px 52px 48px; position: relative; overflow: hidden;
  }
  .rad-hero::before {
    content: ''; position: absolute; right: -60px; top: -80px;
    width: 360px; height: 360px; border-radius: 50%;
    background: rgba(13,124,102,.18); pointer-events: none;
  }
  .rad-hero-tag { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #11a688; margin-bottom: 10px; }
  .rad-hero-title { font-family: 'DM Serif Display', serif; font-size: 36px; color: #fff; line-height: 1.15; max-width: 520px; margin-bottom: 10px; }
  .rad-hero-sub { font-size: 14px; color: rgba(255,255,255,.6); max-width: 420px; line-height: 1.65; }

  .rad-crumb {
    padding: 13px 52px; background: #fff; border-bottom: 1px solid #e2e2df;
    font-size: 12px; color: #9a9a96; display: flex; align-items: center; gap: 7px;
  }
  .rad-crumb a { color: #0d7c66; text-decoration: none; font-weight: 500; }
  .rad-crumb a:hover { text-decoration: underline; }

  .rad-shell { max-width: 980px; margin: 28px auto 72px; padding: 0 24px; }

  .rad-card {
    background: #fff; border-radius: 14px;
    box-shadow: 0 4px 24px rgba(11,31,58,.08);
    padding: 36px 40px; margin-bottom: 22px; border: 1px solid #e8e8e5;
  }
  .rad-card-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
  .rad-card-title { font-family: 'DM Serif Display', serif; font-size: 21px; color: #0b1f3a; }
  .rad-card-sub { font-size: 13px; color: #9a9a96; margin-top: 4px; line-height: 1.5; }
  .rad-badge {
    font-size: 11px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase;
    background: #e6f5f2; color: #0d7c66; padding: 5px 13px; border-radius: 20px;
    white-space: nowrap; flex-shrink: 0;
  }

  .rad-search-input {
    width: 100%; padding: 12px 16px; border: 1.5px solid #e2e2df;
    border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px;
    background: #f4f4f2; outline: none; margin-bottom: 16px;
    transition: border-color .2s;
  }
  .rad-search-input:focus { border-color: #0d7c66; background: #fff; }

  .rad-centres-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 8px; }
  .rad-centre-card {
    border-radius: 12px; padding: 20px; cursor: pointer;
    transition: all .2s; position: relative;
    border: 2px solid #e2e2df; background: #fff;
  }
  .rad-centre-card:hover { border-color: #0d7c66; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(13,124,102,.12); }
  .rad-centre-card.selected { border-color: #0d7c66; background: #e6f5f2; }
  .rad-centre-selected-badge {
    position: absolute; top: 12px; right: 12px;
    background: #0d7c66; color: #fff; font-size: 10px;
    font-weight: 700; padding: 3px 10px; border-radius: 20px;
  }
  .rad-centre-name { font-family: 'DM Serif Display', serif; font-size: 16px; color: #0b1f3a; margin-bottom: 6px; }
  .rad-centre-location { font-size: 12px; color: #0d7c66; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
  .rad-centre-type { font-size: 12px; color: #9a9a96; }
  .rad-centre-phone { font-size: 13px; color: #1a1a18; margin-top: 6px; }
  .rad-centre-services { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
  .rad-service-tag {
    font-size: 10px; font-weight: 600; background: #f4f4f2;
    border: 1px solid #e2e2df; border-radius: 5px; padding: 2px 8px; color: #0b1f3a;
  }

  .rad-btn-primary {
    background: #0d7c66; color: #fff; border: none; border-radius: 8px;
    padding: 14px 44px; font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 600; cursor: pointer;
    transition: background .2s, transform .2s, box-shadow .2s;
  }
  .rad-btn-primary:hover { background: #11a688; transform: translateY(-1px); box-shadow: 0 6px 22px rgba(13,124,102,.3); }
  .rad-btn-primary:disabled { background: #ccc; cursor: not-allowed; transform: none; box-shadow: none; opacity: .6; }
  .rad-btn-ghost {
    background: transparent; color: #0b1f3a; border: 1.5px solid #e2e2df;
    border-radius: 8px; padding: 11px 20px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer; transition: border-color .2s;
  }
  .rad-btn-ghost:hover { border-color: #0b1f3a; }

  .rad-divider { height: 1px; background: #efefed; margin: 26px 0; }
  .rad-section-lbl {
    font-size: 11px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase;
    color: #0b1f3a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e6f5f2;
  }

  .rad-svc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px; }
  .rad-svc-card {
    padding: 18px 12px; border-radius: 10px; border: 2px solid #e2e2df;
    cursor: pointer; transition: all .2s; background: #fff; text-align: center;
  }
  .rad-svc-card:hover { border-color: #0d7c66; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(13,124,102,.12); }
  .rad-svc-card.active { border-color: #0d7c66; background: #e6f5f2; }
  .rad-svc-icon { font-size: 26px; margin-bottom: 8px; }
  .rad-svc-name { font-size: 12px; font-weight: 600; color: #0b1f3a; }

  .rad-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .rad-field label { font-size: 11px; font-weight: 700; color: #0b1f3a; letter-spacing: .5px; text-transform: uppercase; }
  .rad-field input, .rad-field select, .rad-field textarea {
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1a18;
    background: #f4f4f2; border: 1.5px solid #e2e2df; border-radius: 8px;
    padding: 11px 13px; outline: none; width: 100%;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .rad-field input:focus, .rad-field select:focus, .rad-field textarea:focus {
    border-color: #0d7c66; background: #fff; box-shadow: 0 0 0 3px rgba(13,124,102,.1);
  }
  .rad-field textarea { resize: vertical; min-height: 80px; }

  .rad-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .rad-s2 { grid-column: span 2; }

  .rad-radio-strip { display: flex; border: 1.5px solid #e2e2df; border-radius: 8px; overflow: hidden; }
  .rad-radio-strip label {
    flex: 1; text-align: center; padding: 10px 6px; font-size: 13px; font-weight: 500;
    cursor: pointer; border-right: 1px solid #e2e2df;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: background .15s, color .15s;
  }
  .rad-radio-strip label:last-child { border-right: none; }
  .rad-radio-strip label.active { background: #e6f5f2; color: #0d7c66; font-weight: 600; }
  .rad-radio-strip input[type=radio] { width: 14px; height: 14px; accent-color: #0d7c66; }

  .rad-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .rad-chip {
    display: flex; align-items: center; gap: 6px; background: #f4f4f2;
    border: 1.5px solid #e2e2df; border-radius: 8px; padding: 8px 12px;
    cursor: pointer; font-size: 12px; font-weight: 500; transition: all .15s;
  }
  .rad-chip:hover { border-color: #0d7c66; color: #0d7c66; }
  .rad-chip.selected { border-color: #0d7c66; background: #e6f5f2; color: #0d7c66; }
  .rad-chip input { width: 13px; height: 13px; accent-color: #0d7c66; pointer-events: none; }

  .rad-alert-warn {
    background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px;
    padding: 10px 14px; font-size: 12px; color: #92400e; margin-bottom: 14px;
  }

  .rad-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; margin-bottom: 16px; }
  .rad-detail-key { font-size: 11px; font-weight: 600; color: #9a9a96; margin-bottom: 2px; }
  .rad-detail-val { font-size: 13px; color: #1e3553; font-weight: 500; }
  .rad-tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .rad-tag {
    background: #e6f5f2; border: 1px solid #99f6e4; border-radius: 6px;
    padding: 3px 9px; font-size: 12px; font-weight: 500; color: #065f46;
  }

  .rad-submit-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-top: 28px; }
  .rad-submit-note { font-size: 12px; color: #9a9a96; line-height: 1.65; }

  .rad-terms {
    background: #f4f4f2; border-radius: 8px; padding: 14px 17px; margin-top: 22px;
    font-size: 12px; color: #9a9a96; line-height: 1.7; border: 1px solid #e2e2df;
  }

  .rad-progress { display: flex; gap: 6px; margin-top: 12px; }
  .rad-progress-bar { height: 3px; flex: 1; border-radius: 2px; transition: background .3s; }

  .rad-success-overlay {
    display: none; position: fixed; inset: 0; background: rgba(11,31,58,.65);
    backdrop-filter: blur(5px); z-index: 9999; align-items: center; justify-content: center;
  }
  .rad-success-overlay.show { display: flex; }
  .rad-success-box {
    background: #fff; border-radius: 16px; padding: 52px 46px; text-align: center;
    max-width: 440px; width: 90%; box-shadow: 0 24px 64px rgba(0,0,0,.18);
    animation: radPop .3s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes radPop { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: scale(1); } }
  .rad-check-ring {
    width: 66px; height: 66px; border-radius: 50%; background: #0d7c66;
    margin: 0 auto 22px; display: flex; align-items: center; justify-content: center;
  }
  .rad-check-ring svg { width: 30px; height: 30px; }
  .rad-s-title { font-family: 'DM Serif Display', serif; font-size: 26px; color: #0b1f3a; margin-bottom: 10px; }
  .rad-s-sub { font-size: 14px; color: #9a9a96; line-height: 1.6; margin-bottom: 22px; }
  .rad-ref {
    font-family: monospace; font-size: 19px; font-weight: 700; color: #0d7c66;
    background: #e6f5f2; padding: 10px 24px; border-radius: 8px;
    letter-spacing: 2px; display: inline-block; margin-bottom: 26px;
  }

  .rad-loading { text-align: center; padding: 40px; color: #9a9a96; font-size: 14px; }
  .rad-empty { text-align: center; padding: 40px; color: #9a9a96; font-size: 14px; }

  @media (max-width: 720px) {
    .rad-hero, .rad-crumb { padding-left: 20px; padding-right: 20px; }
    .rad-hero-title { font-size: 26px; }
    .rad-g2 { grid-template-columns: 1fr; }
    .rad-s2 { grid-column: span 1; }
    .rad-shell { padding: 0 14px; }
    .rad-card { padding: 22px 16px; }
    .rad-svc-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
  }
`;

// ─── SERVICE CONFIG ───────────────────────────────────────────────────────────
const SERVICE_ICONS = {
  "MRI": "", "CT Scan": "", "X-Ray": "", "Ultrasound": "",
  "PET-CT Scan": "", "Mammography": "", "Echocardiogram": "",
  "Blood Tests": "", "Hematology": "", "Biochemistry": "",
  "Pathology": "", "Microbiology": "", "DEXA Scan": "",
  "Colour Doppler": "", "Home Collection": "",
};

const SERVICE_FORM_CONFIG = {
  "MRI": {
    fields: ["bodyPart", "contrast", "claustrophobia", "metalImplants", "pacemaker", "pregnant", "kidneyDisease", "fastingHours", "clinicalIndication", "allergies", "medHistory"],
    bodyParts: ["Brain / Head", "Spine – Cervical", "Spine – Lumbar", "Knee", "Shoulder", "Abdomen", "Pelvis", "Cardiac", "Whole Body", "Other"],
    label: "MRI Scan",
  },
  "CT Scan": {
    fields: ["bodyPart", "contrast", "kidneyDisease", "pregnant", "fastingHours", "clinicalIndication", "allergies", "medHistory"],
    bodyParts: ["Brain / Head", "Chest / Lungs", "Abdomen", "Pelvis", "Spine", "Extremities", "CT Angiography", "HRCT Chest", "Whole Body", "Other"],
    label: "CT Scan",
  },
  "X-Ray": {
    fields: ["bodyPart", "pregnant", "clinicalIndication"],
    bodyParts: ["Chest", "Spine", "Hand / Wrist", "Foot / Ankle", "Knee", "Hip / Pelvis", "Shoulder", "Skull", "Other"],
    label: "X-Ray",
  },
  "Ultrasound": {
    fields: ["bodyPart", "pregnant", "fastingHours", "clinicalIndication", "medHistory"],
    bodyParts: ["Abdomen", "Pelvis", "Obstetric (Pregnancy)", "Thyroid / Neck", "Breast", "Scrotal", "Renal / KUB", "Colour Doppler", "Other"],
    label: "Ultrasound / Sonography",
  },
  "PET-CT Scan": {
    fields: ["bodyPart", "contrast", "kidneyDisease", "pregnant", "fastingHours", "clinicalIndication", "allergies", "medHistory"],
    bodyParts: ["Whole Body", "Brain", "Cardiac", "Chest", "Abdomen & Pelvis", "Other"],
    label: "PET-CT Scan",
  },
  "Mammography": {
    fields: ["contrast", "pregnant", "clinicalIndication", "medHistory"],
    bodyParts: ["Bilateral (Both Breasts)", "Left Breast Only", "Right Breast Only"],
    label: "Mammography",
  },
  "Echocardiogram": {
    fields: ["contrast", "clinicalIndication", "medHistory", "allergies"],
    bodyParts: ["Standard Echo", "Stress Echo", "Transesophageal Echo (TEE)"],
    label: "Echocardiogram (Echo)",
  },
  "Blood Tests": {
    fields: ["fastingHours", "clinicalIndication", "medHistory", "allergies"],
    testOptions: ["Complete Blood Count (CBC)", "Liver Function Test (LFT)", "Kidney Function Test (KFT)", "Thyroid Panel (TSH, T3, T4)", "Lipid Profile", "HbA1c", "Blood Glucose (FBS/PPBS)", "Vitamin D / B12", "Iron Studies", "Coagulation Profile", "ESR & CRP", "Uric Acid"],
    label: "Blood Tests",
  },
  "Hematology": {
    fields: ["fastingHours", "clinicalIndication", "medHistory"],
    testOptions: ["Complete Hemogram", "Peripheral Blood Smear", "Bone Marrow Examination", "Coagulation Studies (PT/APTT)", "Bleeding Time / Clotting Time", "Reticulocyte Count", "Sickle Cell Screening"],
    label: "Hematology",
  },
  "Biochemistry": {
    fields: ["fastingHours", "clinicalIndication", "medHistory"],
    testOptions: ["Glucose (FBS/PPBS/Random)", "HbA1c", "Lipid Profile", "Liver Enzymes (AST/ALT/ALP)", "Bilirubin (Total/Direct)", "Kidney Panel (Urea/Creatinine)", "Electrolytes (Na/K/Cl)", "Calcium & Phosphorus", "Serum Proteins (Albumin/Globulin)", "Uric Acid", "LDH", "Amylase / Lipase"],
    label: "Biochemistry",
  },
  "Pathology": {
    fields: ["clinicalIndication", "medHistory"],
    testOptions: ["Biopsy – Histopathology (HPE)", "FNAC (Fine Needle Aspiration)", "Pap Smear / Cervical Cytology", "Urine Routine & Microscopy", "Stool Examination", "Sputum Analysis", "Body Fluid Analysis", "Frozen Section"],
    label: "Pathology",
  },
  "Microbiology": {
    fields: ["clinicalIndication", "medHistory"],
    testOptions: ["Blood Culture & Sensitivity", "Urine Culture & Sensitivity", "Sputum Culture", "Stool Culture", "Wound Swab Culture", "TB – GeneXpert / AFB", "Fungal Culture", "Widal / Dengue / Malaria / Typhoid"],
    label: "Microbiology",
  },
  "DEXA Scan": {
    fields: ["bodyPart", "pregnant", "clinicalIndication", "medHistory"],
    bodyParts: ["Lumbar Spine (L1–L4)", "Hip – Femoral Neck", "Whole Body", "Forearm"],
    label: "Bone Densitometry (DEXA)",
  },
  "Colour Doppler": {
    fields: ["bodyPart", "clinicalIndication", "medHistory"],
    bodyParts: ["Carotid Arteries", "Peripheral Arteries (Limbs)", "Renal Arteries", "Portal Vein / Abdomen", "Deep Vein Thrombosis (DVT)", "Fetal Doppler", "Other"],
    label: "Colour Doppler Study",
  },
};

const normalizeService = (s) => {
  const map = {
    "mri": "MRI", "ct scan": "CT Scan", "x-ray": "X-Ray", "xray": "X-Ray",
    "ultrasound": "Ultrasound", "ultrasound / sonography": "Ultrasound",
    "pet-ct scan": "PET-CT Scan", "mammography": "Mammography",
    "echocardiogram": "Echocardiogram", "echocardiogram (echo)": "Echocardiogram",
    "blood tests": "Blood Tests", "hematology": "Hematology",
    "biochemistry": "Biochemistry", "pathology": "Pathology",
    "microbiology": "Microbiology", "dexa scan": "DEXA Scan",
    "bone densitometry (dexa)": "DEXA Scan", "colour doppler": "Colour Doppler",
    "colour doppler study": "Colour Doppler",
  };
  return map[s?.toLowerCase()] || s;
};

const ALLERGIES_LIST = ["Iodine / Contrast Dye", "Shellfish", "Penicillin", "Sulfa Drugs", "Latex", "Aspirin / NSAIDs", "None Known"];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function RadiologyDiagnosticsTest() {
  
  const navigate = useNavigate();

  const isLoggedIn = !!(
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken")
  );

  // Step: "centres" | "booking"
  const [view, setView] = useState("centres");

  // Centres state
  const [centres, setCentres] = useState([]);
  const [centresLoading, setCentresLoading] = useState(true);
  const [centreSearch, setCentreSearch] = useState("");
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Booking state
  const [step, setStep] = useState("service"); // service | patient | details | confirm | success
  const [selectedService, setSelectedService] = useState(null);
  const [refNum, setRefNum] = useState("");

  const [patient, setPatient] = useState({
    fullName: "", dob: "", gender: "", mobile: "", email: "",
    address: "", city: "", state: "", bloodGroup: "",
  });

  useEffect(() => {
  if (!isLoggedIn) return;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken");

  // console.log("TOKEN FOUND:", token); 

  axios
    .get(`${BASE_API}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      // console.log("API RESPONSE:", res.data); 
      const u = res.data?.user || {};        
      setPatient((prev) => ({
        ...prev,
        fullName: u.name ? `${u.name} ${u.lastname || ""}`.trim() : prev.fullName,
        email:    u.email    || prev.email,
        gender:   u.gender   || prev.gender,
        address:  u.address  || prev.address,
      }));
    })
    .catch((err) => console.error("AUTOFILL ERROR:", err.response?.status, err.response?.data));
}, [isLoggedIn]);

  const [testDetails, setTestDetails] = useState({
    selectedTests: [], bodyPart: "", contrast: "", clinicalIndication: "",
    claustrophobia: "", pregnant: "", pacemaker: "", metalImplants: "", kidneyDisease: "",
    allergies: [], fastingHours: "", medHistory: "",
    apptDate: "", apptSlot: "", paymentMode: "", refDocName: "", refDocSpec: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);

  // Inject CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Fetch approved radiology centres
  useEffect(() => {
    axios.get(`${BASE_API}/api/partners/approved`)
      .then(res => setCentres(res.data?.data || []))
      .catch(() => setCentres([]))
      .finally(() => setCentresLoading(false));
  }, []);

  const filteredCentres = centres.filter(c => {
    const q = centreSearch.toLowerCase();
    return (
      c.businessName?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.businessType?.toLowerCase().includes(q)
    );
  });

  const handleBookAtCentre = (centre) => {
    setSelectedCentre(centre);
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      setView("booking");
      setStep("service");
      window.scrollTo(0, 0);
    }
  };

  const handleGoLogin = () => {
    sessionStorage.setItem("redirectAfterLogin", "/register/radiology-diagnosticstest");
    navigate("/userlogin");
  };

  // Services available at selected centre
  const availableServices = selectedCentre?.servicesOffered || [];
  const serviceConfigs = availableServices
    .map(s => ({ raw: s, key: normalizeService(s), config: SERVICE_FORM_CONFIG[normalizeService(s)] }))
    .filter(s => s.config);

  const cfg = selectedService ? SERVICE_FORM_CONFIG[normalizeService(selectedService)] : null;
  const hasField = f => cfg?.fields?.includes(f);

  const setP = k => e => setPatient(f => ({ ...f, [k]: e.target.value }));
  const setT = k => e => setTestDetails(f => ({ ...f, [k]: typeof e === "string" ? e : e.target.value }));
  const toggleArr = (k, v) => setTestDetails(f => {
    const arr = f[k];
    return { ...f, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] };
  });

  const handleSubmit = async () => {
  if (!patient.fullName || !patient.mobile || !testDetails.apptDate) {
    alert("Please fill all required fields.");
    return;
  }

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken");

  try {
    await axios.post(
      `${BASE_API}/api/partners/book`,
      {
        partnerId: selectedCentre._id,
        fullName: patient.fullName,
        mobile: patient.mobile,
        email: patient.email,
        dob: patient.dob,
        gender: patient.gender,
        address: patient.address,
        city: patient.city,
        state: patient.state,
        bloodGroup: patient.bloodGroup,
        scanTypes: [selectedService],
        bodyPart: testDetails.bodyPart,
        contrast: testDetails.contrast,
        clinicalIndication: testDetails.clinicalIndication,
        claustrophobia: testDetails.claustrophobia,
        pregnant: testDetails.pregnant,
        pacemaker: testDetails.pacemaker,
        metalImplants: testDetails.metalImplants,
        kidneyDisease: testDetails.kidneyDisease,
        allergies: testDetails.allergies,
        medHistory: testDetails.medHistory,
        refDocName: testDetails.refDocName,
        refDocSpec: testDetails.refDocSpec,
        apptDate: testDetails.apptDate,
        apptSlot: testDetails.apptSlot,
        paymentMode: testDetails.paymentMode,
        status: "PENDING",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRefNum("BIO-" + Math.floor(100000 + Math.random() * 900000));
    setShowSuccess(true);
  } catch (err) {
    console.error("Booking error:", err);
    alert("Booking failed. Please try again.");
  }
};

  const resetAll = () => {
    setView("centres");
    setSelectedCentre(null);
    setStep("service");
    setSelectedService(null);
    setPatient({ fullName: "", dob: "", gender: "", mobile: "", email: "", address: "", city: "", state: "", bloodGroup: "" });
    setTestDetails({ selectedTests: [], bodyPart: "", contrast: "", clinicalIndication: "", claustrophobia: "", pregnant: "", pacemaker: "", metalImplants: "", kidneyDisease: "", allergies: [], fastingHours: "", medHistory: "", apptDate: "", apptSlot: "", paymentMode: "", refDocName: "", refDocSpec: "" });
    setShowSuccess(false);
  };

  const STEPS = ["service", "patient", "details", "confirm"];
  const stepIdx = STEPS.indexOf(step);

  const RadioStrip = ({ options, value, onChange }) => (
    <div className="rad-radio-strip">
      {options.map(opt => (
        <label key={opt} className={value === opt ? "active" : ""} onClick={() => onChange(opt)}>
          <input type="radio" checked={value === opt} onChange={() => {}} />
          {opt}
        </label>
      ))}
    </div>
  );

  const Chips = ({ options, selected, onToggle }) => (
    <div className="rad-chips">
      {options.map(opt => (
        <div key={opt} className={`rad-chip${selected.includes(opt) ? " selected" : ""}`} onClick={() => onToggle(opt)}>
          <input type="checkbox" checked={selected.includes(opt)} onChange={() => {}} />
          {opt}
        </div>
      ))}
    </div>
  );

  return (
    <div className="rad-root">

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(11,31,58,.7)",
          backdropFilter: "blur(6px)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "48px 44px",
            textAlign: "center", maxWidth: 420, width: "90%",
            boxShadow: "0 24px 64px rgba(0,0,0,.2)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "#e6f5f2",
              margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d7c66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#0b1f3a", marginBottom: 10 }}>
              Login Required
            </div>
            <div style={{ fontSize: 14, color: "#9a9a96", lineHeight: 1.65, marginBottom: 28 }}>
              To book at <strong>{selectedCentre?.businessName}</strong>, please log in first.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={handleGoLogin} style={{
                background: "#0d7c66", color: "#fff", border: "none",
                borderRadius: 8, padding: "13px 32px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>Login to Continue</button>
              <button onClick={() => { setShowAuthModal(false); setSelectedCentre(null); }} style={{
                background: "transparent", color: "#9a9a96", border: "1.5px solid #e2e2df",
                borderRadius: 8, padding: "13px 24px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer",
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="rad-hero">
        <div className="rad-hero-tag">Radiology & Diagnostics</div>
        <h1 className="rad-hero-title">Book a Radiology or Diagnostic Test</h1>
        <p className="rad-hero-sub">MRI, CT Scan, X-Ray, Ultrasound & more — find an approved centre near you.</p>
      </div>

      {/* BREADCRUMB */}
      <div className="rad-crumb">
        <a href="/">Home</a> ›
        <a href="/services">Services</a> ›
        <span>Radiology & Diagnostic Booking</span>
        {selectedCentre && view === "booking" && (
          <><span>›</span><span>{selectedCentre.businessName}</span></>
        )}
      </div>

      {/* ── CENTRES VIEW ── */}
      {view === "centres" && (
        <div className="rad-shell">
          <div className="rad-card">
            <div className="rad-card-head">
              <div>
                <div className="rad-card-title">Choose a Radiology Centre</div>
                <div className="rad-card-sub">Select an approved diagnostic centre near you to book your scan or test.</div>
              </div>
              <div className="rad-badge">{centres.length} Centres Available</div>
            </div>

            <input
              className="rad-search-input"
              type="text"
              placeholder="Search by name, city or type…"
              value={centreSearch}
              onChange={e => setCentreSearch(e.target.value)}
            />

            {centresLoading ? (
              <div className="rad-loading"> Loading approved centres…</div>
            ) : filteredCentres.length === 0 ? (
              <div className="rad-empty">
                {centres.length === 0
                  ? " No approved radiology centres available yet."
                  : "No centres match your search."}
              </div>
            ) : (
              <div className="rad-centres-grid">
                {filteredCentres.map(centre => (
                  <div
                    key={centre._id}
                    onClick={() => setSelectedCentre(centre)}
                    className={`rad-centre-card${selectedCentre?._id === centre._id ? " selected" : ""}`}
                  >
                    {selectedCentre?._id === centre._id && (
                      <div className="rad-centre-selected-badge">✓ Selected</div>
                    )}
                    <div className="rad-centre-name">{centre.businessName}</div>
                    <div className="rad-centre-location">
                      {centre.city}{centre.state ? `, ${centre.state}` : ""}
                    </div>
                    <div className="rad-centre-type">{centre.businessType}</div>
                    {centre.mobile && (
                      <div className="rad-centre-phone"> {centre.mobile}</div>
                    )}
                    {centre.servicesOffered?.length > 0 && (
                      <div className="rad-centre-services">
                        {centre.servicesOffered.slice(0, 4).map(s => (
                          <span key={s} className="rad-service-tag">{s}</span>
                        ))}
                        {centre.servicesOffered.length > 4 && (
                          <span className="rad-service-tag">+{centre.servicesOffered.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
              <button
                className="rad-btn-primary"
                disabled={!selectedCentre}
                onClick={() => selectedCentre && handleBookAtCentre(selectedCentre)}
              >
                {selectedCentre
                  ? `Book at ${selectedCentre.businessName} →`
                  : "Select a Centre to Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOOKING VIEW ── */}
      {view === "booking" && (
        <div className="rad-shell">

          {/* Selected centre info bar */}
          <div style={{
            background: "#e6f5f2", border: "1px solid #99f6e4", borderRadius: 10,
            padding: "14px 20px", marginBottom: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#0b1f3a" }}>
                 {selectedCentre?.businessName}
              </div>
              <div style={{ fontSize: 12, color: "#0d7c66", marginTop: 2 }}>
                {selectedCentre?.city}{selectedCentre?.state ? `, ${selectedCentre.state}` : ""} · {selectedCentre?.businessType}
              </div>
            </div>
            <button
              onClick={() => { setView("centres"); setStep("service"); setSelectedService(null); }}
              className="rad-btn-ghost"
              style={{ fontSize: 13, padding: "8px 16px" }}
            >
              ← Change Centre
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e2df", overflow: "hidden", marginBottom: 20, boxShadow: "0 4px 20px rgba(11,31,58,.07)" }}>
            <div style={{ display: "flex" }}>
              {[["1", "Service"], ["2", "Patient"], ["3", "Details"], ["4", "Confirm"]].map(([num, label], i) => (
                <div key={label} style={{
                  flex: 1, textAlign: "center", padding: "14px 8px",
                  fontSize: 11, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase",
                  color: i <= stepIdx ? "#fff" : "#9a9a96",
                  background: i < stepIdx ? "#0d7c66" : i === stepIdx ? "#0d7c66" : "#fff",
                  borderRight: i < 3 ? "1px solid #e2e2df" : "none",
                }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 3 }}>{num}</div>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── STEP: SELECT SERVICE ── */}
          {step === "service" && (
            <div className="rad-card">
              <div className="rad-card-head">
                <div>
                  <div className="rad-card-title">Select a Service</div>
                  <div className="rad-card-sub">Choose from services available at {selectedCentre?.businessName}</div>
                </div>
                <div className="rad-badge">Step 1 of 4</div>
              </div>

              {serviceConfigs.length === 0 ? (
                <div className="rad-empty">
                  This centre has not listed any services yet. Please choose another centre.
                </div>
              ) : (
                <div className="rad-svc-grid">
                  {serviceConfigs.map(({ raw, key, config }) => (
                    <div
                      key={key}
                      className={`rad-svc-card${selectedService === raw ? " active" : ""}`}
                      onClick={() => setSelectedService(raw)}
                    >
                      <div className="rad-svc-icon">{SERVICE_ICONS[key] || ""}</div>
                      <div className="rad-svc-name">{config.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  className="rad-btn-primary"
                  disabled={!selectedService}
                  onClick={() => setStep("patient")}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: PATIENT INFO ── */}
          {step === "patient" && (
            <div className="rad-card">
              <div className="rad-card-head">
                <div>
                  <div className="rad-card-title">Patient Information</div>
                  <div className="rad-card-sub">Provide accurate details as they will appear on the report.</div>
                </div>
                <div className="rad-badge">Step 2 of 4</div>
              </div>

              <div className="rad-section-lbl">Personal Details</div>
              <div className="rad-g2">
                <div className="rad-field">
                  <label>Full Name * {patient.fullName && <span style={{color:"#0d7c66",fontWeight:400,textTransform:"none"}}>✓ auto-filled</span>}</label>
                  <input placeholder="Patient's full name" value={patient.fullName} onChange={setP("fullName")} />
                </div>
                <div className="rad-field">
                  <label>Date of Birth</label>
                  <input type="date" value={patient.dob} onChange={setP("dob")} />
                </div>
                <div className="rad-field">
                  <label>Gender</label>
                  <RadioStrip options={["Male", "Female", "Other"]} value={patient.gender}
                    onChange={v => setPatient(f => ({ ...f, gender: v }))} />
                </div>
                <div className="rad-field">
                  <label>Blood Group</label>
                  <select value={patient.bloodGroup} onChange={setP("bloodGroup")}>
                    <option value="">Select</option>
                    {["A+","A−","B+","B−","AB+","AB−","O+","O−","Don't Know"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="rad-field">
                  <label>Mobile *</label>
                  <input type="tel" placeholder="+91 XXXXX XXXXX" value={patient.mobile} onChange={setP("mobile")} />
                </div>
                <div className="rad-field">
                  <label>Email</label>
                  <input type="email" placeholder="patient@email.com" value={patient.email} onChange={setP("email")} />
                </div>
                <div className="rad-field">
                  <label>City</label>
                  <input placeholder="City" value={patient.city} onChange={setP("city")} />
                </div>
                <div className="rad-field">
                  <label>State</label>
                  <select value={patient.state} onChange={setP("state")}>
                    <option value="">Select state</option>
                    {["Delhi","Maharashtra","Karnataka","Tamil Nadu","Uttar Pradesh","West Bengal","Gujarat","Rajasthan","Telangana","Madhya Pradesh","Haryana","Punjab","Bihar","Odisha","Other"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="rad-field rad-s2">
                  <label>Address</label>
                  <input placeholder="Full address" value={patient.address} onChange={setP("address")} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button className="rad-btn-ghost" onClick={() => setStep("service")}>← Back</button>
                <button className="rad-btn-primary" onClick={() => {
                  if (!patient.fullName || !patient.mobile) { alert("Name and mobile are required."); return; }
                  setStep("details");
                }}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP: TEST DETAILS ── */}
          {step === "details" && cfg && (
            <div className="rad-card">
              <div className="rad-card-head">
                <div>
                  <div className="rad-card-title">{cfg.label} — Test Details</div>
                  <div className="rad-card-sub">Safety screening & appointment scheduling</div>
                </div>
                <div className="rad-badge">Step 3 of 4</div>
              </div>

              {cfg.testOptions && (
                <>
                  <div className="rad-section-lbl">Select Tests</div>
                  <Chips
                    options={cfg.testOptions}
                    selected={testDetails.selectedTests}
                    onToggle={v => toggleArr("selectedTests", v)}
                  />
                  <div className="rad-divider" />
                </>
              )}

              {cfg.bodyParts && (
                <>
                  <div className="rad-section-lbl">Body Part / Area</div>
                  <div className="rad-field">
                    <select value={testDetails.bodyPart} onChange={setT("bodyPart")}>
                      <option value="">Select body area</option>
                      {cfg.bodyParts.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="rad-divider" />
                </>
              )}

              {(hasField("contrast") || hasField("fastingHours") || hasField("clinicalIndication")) && (
                <>
                  <div className="rad-section-lbl">Scan / Test Details</div>
                  <div className="rad-g2">
                    {hasField("contrast") && (
                      <div className="rad-field">
                        <label>Contrast Required</label>
                        <select value={testDetails.contrast} onChange={setT("contrast")}>
                          <option value="">As advised by doctor</option>
                          <option>Yes – With Contrast</option>
                          <option>No – Without Contrast</option>
                          <option>Both (with and without)</option>
                        </select>
                      </div>
                    )}
                    {hasField("fastingHours") && (
                      <div className="rad-field">
                        <label>Fasting Status</label>
                        <select value={testDetails.fastingHours} onChange={setT("fastingHours")}>
                          <option value="">Select</option>
                          <option>Currently fasting (4+ hrs)</option>
                          <option>Currently fasting (6+ hrs)</option>
                          <option>Not fasting</option>
                          <option>Will fast before appointment</option>
                        </select>
                      </div>
                    )}
                    {hasField("clinicalIndication") && (
                      <div className="rad-field rad-s2">
                        <label>Clinical Indication / Symptoms</label>
                        <textarea placeholder="Describe symptoms or clinical indication…"
                          value={testDetails.clinicalIndication} onChange={setT("clinicalIndication")} />
                      </div>
                    )}
                  </div>
                  <div className="rad-divider" />
                </>
              )}

              {(hasField("claustrophobia") || hasField("pregnant") || hasField("pacemaker") || hasField("metalImplants") || hasField("kidneyDisease")) && (
                <>
                  <div className="rad-section-lbl">Safety Screening</div>
                  <div className="rad-alert-warn">⚠️ Required for imaging safety — please answer accurately.</div>
                  <div className="rad-g2">
                    {hasField("claustrophobia") && (
                      <div className="rad-field">
                        <label>Claustrophobia</label>
                        <RadioStrip options={["Yes", "No", "Not Sure"]} value={testDetails.claustrophobia}
                          onChange={v => setTestDetails(f => ({ ...f, claustrophobia: v }))} />
                      </div>
                    )}
                    {hasField("pregnant") && (
                      <div className="rad-field">
                        <label>Pregnancy</label>
                        <RadioStrip options={["Yes", "No", "Not Applicable"]} value={testDetails.pregnant}
                          onChange={v => setTestDetails(f => ({ ...f, pregnant: v }))} />
                      </div>
                    )}
                    {hasField("pacemaker") && (
                      <div className="rad-field">
                        <label>Pacemaker / Cardiac Implant</label>
                        <RadioStrip options={["Yes", "No", "Not Sure"]} value={testDetails.pacemaker}
                          onChange={v => setTestDetails(f => ({ ...f, pacemaker: v }))} />
                      </div>
                    )}
                    {hasField("metalImplants") && (
                      <div className="rad-field">
                        <label>Metal Implants</label>
                        <RadioStrip options={["Yes", "No", "Not Sure"]} value={testDetails.metalImplants}
                          onChange={v => setTestDetails(f => ({ ...f, metalImplants: v }))} />
                      </div>
                    )}
                    {hasField("kidneyDisease") && (
                      <div className="rad-field">
                        <label>Kidney Disease</label>
                        <RadioStrip options={["Yes", "No", "Not Sure"]} value={testDetails.kidneyDisease}
                          onChange={v => setTestDetails(f => ({ ...f, kidneyDisease: v }))} />
                      </div>
                    )}
                  </div>
                  {hasField("allergies") && (
                    <div className="rad-field">
                      <label>Known Allergies</label>
                      <Chips options={ALLERGIES_LIST} selected={testDetails.allergies}
                        onToggle={v => toggleArr("allergies", v)} />
                    </div>
                  )}
                  {hasField("medHistory") && (
                    <div className="rad-field">
                      <label>Other Medical History</label>
                      <textarea placeholder="Diabetes, prior surgeries, adverse reactions…"
                        value={testDetails.medHistory} onChange={setT("medHistory")} />
                    </div>
                  )}
                  <div className="rad-divider" />
                </>
              )}

              <div className="rad-section-lbl">Referring Doctor</div>
              <div className="rad-g2">
                <div className="rad-field">
                  <label>Doctor's Name</label>
                  <input placeholder="Dr. Full Name" value={testDetails.refDocName} onChange={setT("refDocName")} />
                </div>
                <div className="rad-field">
                  <label>Specialisation</label>
                  <input placeholder="e.g. Orthopaedics" value={testDetails.refDocSpec} onChange={setT("refDocSpec")} />
                </div>
              </div>

              <div className="rad-divider" />
              <div className="rad-section-lbl">Appointment</div>
              <div className="rad-g2">
                <div className="rad-field">
                  <label>Date *</label>
                  <input type="date" value={testDetails.apptDate}
                    min={new Date().toISOString().split("T")[0]} onChange={setT("apptDate")} />
                </div>
                <div className="rad-field">
                  <label>Time Slot</label>
                  <select value={testDetails.apptSlot} onChange={setT("apptSlot")}>
                    <option value="">Select slot</option>
                    {["07:00–09:00 AM","09:00–11:00 AM","11:00 AM–01:00 PM","01:00–03:00 PM","03:00–05:00 PM","05:00–07:00 PM"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="rad-field">
                <label>Payment Mode</label>
                <RadioStrip
                  options={["Online – UPI", "Online – Card", "Pay at Centre", "Insurance / TPA", "Govt. Scheme"]}
                  value={testDetails.paymentMode}
                  onChange={v => setTestDetails(f => ({ ...f, paymentMode: v }))}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <button className="rad-btn-ghost" onClick={() => setStep("patient")}>← Back</button>
                <button className="rad-btn-primary" onClick={() => setStep("confirm")}>Review Booking →</button>
              </div>
            </div>
          )}

          {/* ── STEP: CONFIRM ── */}
          {step === "confirm" && (
            <div className="rad-card">
              <div className="rad-card-head">
                <div>
                  <div className="rad-card-title">Review & Confirm</div>
                  <div className="rad-card-sub">Please verify all details before confirming.</div>
                </div>
                <div className="rad-badge">Step 4 of 4</div>
              </div>

              <div style={{
                background: "#e6f5f2", border: "1px solid #99f6e4", borderRadius: 10,
                padding: "14px 18px", marginBottom: 20,
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0b1f3a" }}>
                  {SERVICE_ICONS[normalizeService(selectedService)] || ""} {cfg?.label}
                </div>
                <div style={{ fontSize: 12, color: "#0d7c66", marginTop: 4 }}>
                   {selectedCentre?.businessName} · {selectedCentre?.city}
                </div>
                <div style={{ fontSize: 12, color: "#9a9a96", marginTop: 2 }}>
                  {testDetails.apptDate ? new Date(testDetails.apptDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  {testDetails.apptSlot ? ` · ${testDetails.apptSlot}` : ""}
                </div>
              </div>

              <div className="rad-section-lbl">Patient</div>
              <div className="rad-detail-grid">
                <div><div className="rad-detail-key">Name</div><div className="rad-detail-val">{patient.fullName}</div></div>
                <div><div className="rad-detail-key">Mobile</div><div className="rad-detail-val">{patient.mobile}</div></div>
                {patient.gender && <div><div className="rad-detail-key">Gender</div><div className="rad-detail-val">{patient.gender}</div></div>}
                {patient.city && <div><div className="rad-detail-key">City</div><div className="rad-detail-val">{patient.city}</div></div>}
              </div>

              {testDetails.selectedTests.length > 0 && (
                <>
                  <div className="rad-section-lbl">Tests Selected</div>
                  <div className="rad-tag-row" style={{ marginBottom: 16 }}>
                    {testDetails.selectedTests.map(t => <span key={t} className="rad-tag">{t}</span>)}
                  </div>
                </>
              )}

              {testDetails.bodyPart && (
                <>
                  <div className="rad-section-lbl">Body Part</div>
                  <div className="rad-detail-val" style={{ marginBottom: 16 }}>{testDetails.bodyPart}</div>
                </>
              )}

              {testDetails.paymentMode && (
                <>
                  <div className="rad-section-lbl">Payment</div>
                  <div className="rad-detail-val" style={{ marginBottom: 16 }}>{testDetails.paymentMode}</div>
                </>
              )}

              <div className="rad-terms">
                By confirming, you acknowledge that all details are accurate. Our team will contact you to confirm the appointment. Cancellation is free up to 2 hours before scheduled time.
              </div>

              <div className="rad-submit-row">
                <div className="rad-submit-note">
                  A confirmation will be sent to <strong>{patient.mobile}</strong> via SMS.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="rad-btn-ghost" onClick={() => setStep("details")}>← Edit Details</button>
                  <button className="rad-btn-primary" onClick={handleSubmit}>✓ Confirm Booking</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      <div className={`rad-success-overlay${showSuccess ? " show" : ""}`}>
        <div className="rad-success-box">
          <div className="rad-check-ring">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="rad-s-title">Booking Confirmed!</div>
          <div className="rad-s-sub">
            {cfg?.label} appointment for <strong>{patient.fullName}</strong> at <strong>{selectedCentre?.businessName}</strong> has been booked.
          </div>
          <div className="rad-ref">{refNum}</div>
          <p style={{ fontSize: 12, color: "#9a9a96", marginBottom: 26, lineHeight: 1.7 }}>
            Confirmation SMS will be sent to {patient.mobile || "the patient"}.
          </p>
          <button className="rad-btn-primary" onClick={resetAll}>Book Another Test</button>
        </div>
      </div>
    </div>
  );
}