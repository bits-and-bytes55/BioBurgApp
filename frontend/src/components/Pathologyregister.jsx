import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_API =
  import.meta.env.VITE_API_BASE_URL;

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');

  .path-root { font-family: 'DM Sans', sans-serif; background: #f7f9f8; min-height: 100vh; color: #1a1a18; }

  .path-hero {
    background: linear-gradient(130deg, #0b1f3a 55%, #0d3d30 100%);
    padding: 52px 52px 48px; position: relative; overflow: hidden;
  }
  .path-hero::before {
    content: ''; position: absolute; right: -60px; top: -80px;
    width: 360px; height: 360px; border-radius: 50%;
    background: rgba(13,124,102,.18); pointer-events: none;
  }
  .path-hero-tag { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #11a688; margin-bottom: 10px; }
  .path-hero-title { font-family: 'DM Serif Display', serif; font-size: 36px; color: #fff; line-height: 1.15; max-width: 520px; margin-bottom: 10px; }
  .path-hero-sub { font-size: 14px; color: rgba(255,255,255,.6); max-width: 420px; line-height: 1.65; }

  .path-crumb {
    padding: 13px 52px; background: #fff; border-bottom: 1px solid #e2e2df;
    font-size: 12px; color: #9a9a96; display: flex; align-items: center; gap: 7px;
  }
  .path-crumb a { color: #0d7c66; text-decoration: none; font-weight: 500; }
  .path-crumb a:hover { text-decoration: underline; }

  .path-shell { max-width: 980px; margin: 28px auto 72px; padding: 0 24px; }

  .path-card {
    background: #fff; border-radius: 14px;
    box-shadow: 0 4px 24px rgba(11,31,58,.08);
    padding: 36px 40px; margin-bottom: 22px; border: 1px solid #e8e8e5;
  }
  .path-card-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
  .path-card-title { font-family: 'DM Serif Display', serif; font-size: 21px; color: #0b1f3a; }
  .path-card-sub { font-size: 13px; color: #9a9a96; margin-top: 4px; line-height: 1.5; }
  .path-badge {
    font-size: 11px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase;
    background: #e6f5f2; color: #0d7c66; padding: 5px 13px; border-radius: 20px;
    white-space: nowrap; flex-shrink: 0;
  }

  .path-search-input {
    width: 100%; padding: 12px 16px; border: 1.5px solid #e2e2df;
    border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px;
    background: #f4f4f2; outline: none; margin-bottom: 16px; transition: border-color .2s;
  }
  .path-search-input:focus { border-color: #0d7c66; background: #fff; }

  .path-labs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 8px; }
  .path-lab-card {
    border-radius: 12px; padding: 20px; cursor: pointer;
    transition: all .2s; position: relative;
    border: 2px solid #e2e2df; background: #fff;
  }
  .path-lab-card:hover { border-color: #0d7c66; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(13,124,102,.12); }
  .path-lab-card.selected { border-color: #0d7c66; background: #e6f5f2; }
  .path-lab-selected-badge {
    position: absolute; top: 12px; right: 12px;
    background: #0d7c66; color: #fff; font-size: 10px;
    font-weight: 700; padding: 3px 10px; border-radius: 20px;
  }
  .path-lab-name { font-family: 'DM Serif Display', serif; font-size: 16px; color: #0b1f3a; margin-bottom: 6px; }
  .path-lab-location { font-size: 12px; color: #0d7c66; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
  .path-lab-type { font-size: 12px; color: #9a9a96; }
  .path-lab-phone { font-size: 13px; color: #1a1a18; margin-top: 6px; }
  .path-lab-services { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
  .path-service-tag {
    font-size: 10px; font-weight: 600; background: #f4f4f2;
    border: 1px solid #e2e2df; border-radius: 5px; padding: 2px 8px; color: #0b1f3a;
  }

  .path-svc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px; }
  .path-svc-card {
    padding: 18px 12px; border-radius: 10px; border: 2px solid #e2e2df;
    cursor: pointer; transition: all .2s; background: #fff; text-align: center;
  }
  .path-svc-card:hover { border-color: #0d7c66; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(13,124,102,.12); }
  .path-svc-card.active { border-color: #0d7c66; background: #e6f5f2; }
  .path-svc-icon { font-size: 26px; margin-bottom: 8px; }
  .path-svc-name { font-size: 12px; font-weight: 600; color: #0b1f3a; }

  .path-btn-primary {
    background: #0d7c66; color: #fff; border: none; border-radius: 8px;
    padding: 14px 44px; font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 600; cursor: pointer;
    transition: background .2s, transform .2s, box-shadow .2s;
  }
  .path-btn-primary:hover { background: #11a688; transform: translateY(-1px); box-shadow: 0 6px 22px rgba(13,124,102,.3); }
  .path-btn-primary:disabled { background: #ccc; cursor: not-allowed; transform: none; box-shadow: none; opacity: .6; }
  .path-btn-ghost {
    background: transparent; color: #0b1f3a; border: 1.5px solid #e2e2df;
    border-radius: 8px; padding: 11px 20px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer; transition: border-color .2s;
  }
  .path-btn-ghost:hover { border-color: #0b1f3a; }

  .path-divider { height: 1px; background: #efefed; margin: 26px 0; }
  .path-section-lbl {
    font-size: 11px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase;
    color: #0b1f3a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e6f5f2;
  }

  .path-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .path-field label { font-size: 11px; font-weight: 700; color: #0b1f3a; letter-spacing: .5px; text-transform: uppercase; }
  .path-field input, .path-field select, .path-field textarea {
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1a18;
    background: #f4f4f2; border: 1.5px solid #e2e2df; border-radius: 8px;
    padding: 11px 13px; outline: none; width: 100%;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .path-field input:focus, .path-field select:focus, .path-field textarea:focus {
    border-color: #0d7c66; background: #fff; box-shadow: 0 0 0 3px rgba(13,124,102,.1);
  }
  .path-field textarea { resize: vertical; min-height: 80px; }

  .path-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .path-s2 { grid-column: span 2; }

  .path-radio-strip { display: flex; border: 1.5px solid #e2e2df; border-radius: 8px; overflow: hidden; }
  .path-radio-strip label {
    flex: 1; text-align: center; padding: 10px 6px; font-size: 13px; font-weight: 500;
    cursor: pointer; border-right: 1px solid #e2e2df;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: background .15s, color .15s;
  }
  .path-radio-strip label:last-child { border-right: none; }
  .path-radio-strip label.active { background: #e6f5f2; color: #0d7c66; font-weight: 600; }
  .path-radio-strip input[type=radio] { width: 14px; height: 14px; accent-color: #0d7c66; }

  .path-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .path-chip {
    display: flex; align-items: center; gap: 6px; background: #f4f4f2;
    border: 1.5px solid #e2e2df; border-radius: 8px; padding: 8px 12px;
    cursor: pointer; font-size: 12px; font-weight: 500; transition: all .15s;
  }
  .path-chip:hover { border-color: #0d7c66; color: #0d7c66; }
  .path-chip.selected { border-color: #0d7c66; background: #e6f5f2; color: #0d7c66; }
  .path-chip input { width: 13px; height: 13px; accent-color: #0d7c66; pointer-events: none; }

  .path-alert-warn {
    background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px;
    padding: 10px 14px; font-size: 12px; color: #92400e; margin-bottom: 14px;
  }

  .path-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; margin-bottom: 16px; }
  .path-detail-key { font-size: 11px; font-weight: 600; color: #9a9a96; margin-bottom: 2px; }
  .path-detail-val { font-size: 13px; color: #1e3553; font-weight: 500; }
  .path-tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .path-tag {
    background: #e6f5f2; border: 1px solid #99f6e4; border-radius: 6px;
    padding: 3px 9px; font-size: 12px; font-weight: 500; color: #065f46;
  }

  .path-submit-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-top: 28px; }
  .path-submit-note { font-size: 12px; color: #9a9a96; line-height: 1.65; }

  .path-terms {
    background: #f4f4f2; border-radius: 8px; padding: 14px 17px; margin-top: 22px;
    font-size: 12px; color: #9a9a96; line-height: 1.7; border: 1px solid #e2e2df;
  }

  .path-success-overlay {
    display: none; position: fixed; inset: 0; background: rgba(11,31,58,.65);
    backdrop-filter: blur(5px); z-index: 9999; align-items: center; justify-content: center;
  }
  .path-success-overlay.show { display: flex; }
  .path-success-box {
    background: #fff; border-radius: 16px; padding: 52px 46px; text-align: center;
    max-width: 440px; width: 90%; box-shadow: 0 24px 64px rgba(0,0,0,.18);
    animation: pathPop .3s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes pathPop { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: scale(1); } }
  .path-check-ring {
    width: 66px; height: 66px; border-radius: 50%; background: #0d7c66;
    margin: 0 auto 22px; display: flex; align-items: center; justify-content: center;
  }
  .path-check-ring svg { width: 30px; height: 30px; }
  .path-s-title { font-family: 'DM Serif Display', serif; font-size: 26px; color: #0b1f3a; margin-bottom: 10px; }
  .path-s-sub { font-size: 14px; color: #9a9a96; line-height: 1.6; margin-bottom: 22px; }
  .path-ref {
    font-family: monospace; font-size: 19px; font-weight: 700; color: #0d7c66;
    background: #e6f5f2; padding: 10px 24px; border-radius: 8px;
    letter-spacing: 2px; display: inline-block; margin-bottom: 26px;
  }

  .path-loading { text-align: center; padding: 40px; color: #9a9a96; font-size: 14px; }
  .path-empty { text-align: center; padding: 40px; color: #9a9a96; font-size: 14px; }

  .path-progress {
    background: #fff; border-radius: 12px; border: 1px solid #e2e2df;
    overflow: hidden; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(11,31,58,.07);
  }
  .path-progress-inner { display: flex; }
  .path-prog-step {
    flex: 1; text-align: center; padding: 14px 8px;
    font-size: 11px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase;
    color: #9a9a96; border-right: 1px solid #e2e2df; transition: background .2s;
  }
  .path-prog-step:last-child { border-right: none; }
  .path-prog-step.active, .path-prog-step.done { color: #fff; background: #0d7c66; }
  .path-prog-num { font-family: 'DM Serif Display', serif; font-size: 20px; font-weight: 700; margin-bottom: 3px; }

  .path-centre-bar {
    background: #e6f5f2; border: 1px solid #99f6e4; border-radius: 10px;
    padding: 14px 20px; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
  }

  @media (max-width: 720px) {
    .path-hero, .path-crumb { padding-left: 20px; padding-right: 20px; }
    .path-hero-title { font-size: 26px; }
    .path-g2 { grid-template-columns: 1fr; }
    .path-s2 { grid-column: span 1; }
    .path-shell { padding: 0 14px; }
    .path-card { padding: 22px 16px; }
    .path-svc-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
  }
`;

// ─── SERVICE CONFIG (shared with radiology) ───────────────────────────────────
const SERVICE_ICONS = {
  "MRI": "", "CT Scan": "", "X-Ray": "", "Ultrasound": "",
  "PET-CT Scan": "", "Mammography": "", "Echocardiogram": "",
  "Blood Tests": "", "Hematology": "", "Biochemistry": "",
  "Pathology": "", "Microbiology": "", "DEXA Scan": "",
  "Colour Doppler": "", "Home Collection": "",
  "Urine Tests": "", "Stool Tests": "", "Culture & Sensitivity": "",
  "Hormone Tests": "", "Allergy Tests": "", "Genetic Tests": "",
  "Cardiac Markers": "", "Tumour Markers": "",
};

const SERVICE_FORM_CONFIG = {
  "Blood Tests": {
    fields: ["fastingHours", "clinicalIndication", "medHistory", "allergies"],
    testOptions: [
      "Complete Blood Count (CBC)", "Liver Function Test (LFT)", "Kidney Function Test (KFT)",
      "Thyroid Panel (TSH, T3, T4)", "Lipid Profile", "HbA1c",
      "Blood Glucose (FBS/PPBS)", "Vitamin D / B12", "Iron Studies",
      "Coagulation Profile", "ESR & CRP", "Uric Acid",
    ],
    label: "Blood Tests",
  },
  "Hematology": {
    fields: ["fastingHours", "clinicalIndication", "medHistory"],
    testOptions: [
      "Complete Hemogram", "Peripheral Blood Smear", "Bone Marrow Examination",
      "Coagulation Studies (PT/APTT)", "Bleeding Time / Clotting Time",
      "Reticulocyte Count", "Sickle Cell Screening",
    ],
    label: "Hematology",
  },
  "Biochemistry": {
    fields: ["fastingHours", "clinicalIndication", "medHistory"],
    testOptions: [
      "Glucose (FBS/PPBS/Random)", "HbA1c", "Lipid Profile",
      "Liver Enzymes (AST/ALT/ALP)", "Bilirubin (Total/Direct)",
      "Kidney Panel (Urea/Creatinine)", "Electrolytes (Na/K/Cl)",
      "Calcium & Phosphorus", "Serum Proteins (Albumin/Globulin)",
      "Uric Acid", "LDH", "Amylase / Lipase",
    ],
    label: "Biochemistry",
  },
  "Pathology": {
    fields: ["clinicalIndication", "medHistory"],
    testOptions: [
      "Biopsy – Histopathology (HPE)", "FNAC (Fine Needle Aspiration)",
      "Pap Smear / Cervical Cytology", "Urine Routine & Microscopy",
      "Stool Examination", "Sputum Analysis", "Body Fluid Analysis", "Frozen Section",
    ],
    label: "Pathology",
  },
  "Microbiology": {
    fields: ["clinicalIndication", "medHistory"],
    testOptions: [
      "Blood Culture & Sensitivity", "Urine Culture & Sensitivity",
      "Sputum Culture", "Stool Culture", "Wound Swab Culture",
      "TB – GeneXpert / AFB", "Fungal Culture", "Widal / Dengue / Malaria / Typhoid",
    ],
    label: "Microbiology",
  },
  "Urine Tests": {
    fields: ["clinicalIndication", "medHistory"],
    testOptions: [
      "Urine Routine & Microscopy", "Urine Culture & Sensitivity",
      "24hr Urine Protein", "Urine Microalbumin", "Urine Creatinine",
    ],
    label: "Urine Tests",
  },
  "Hormone Tests": {
    fields: ["fastingHours", "clinicalIndication", "medHistory"],
    testOptions: [
      "TSH / T3 / T4", "FSH / LH", "Estradiol (E2)", "Progesterone",
      "Testosterone", "Prolactin", "Cortisol", "DHEA-S", "AMH",
    ],
    label: "Hormone Tests",
  },
  "Cardiac Markers": {
    fields: ["clinicalIndication", "medHistory"],
    testOptions: [
      "Troponin I / T", "CK-MB", "Pro-BNP / BNP",
      "Homocysteine", "hs-CRP", "D-Dimer", "Myoglobin",
    ],
    label: "Cardiac Markers",
  },
  "Tumour Markers": {
    fields: ["clinicalIndication", "medHistory"],
    testOptions: [
      "PSA (Prostate)", "CA-125 (Ovarian)", "CA 19-9 (Pancreatic)",
      "CEA (Colorectal)", "AFP (Liver)", "CA 15-3 (Breast)", "HCG (Testicular)",
    ],
    label: "Tumour Markers",
  },
  "Allergy Tests": {
    fields: ["clinicalIndication", "medHistory"],
    testOptions: [
      "Total IgE", "Specific IgE Panel (Food)", "Specific IgE Panel (Inhalants)",
      "Patch Test Panel", "RAST Test",
    ],
    label: "Allergy Tests",
  },
  "Genetic Tests": {
    fields: ["clinicalIndication", "medHistory"],
    testOptions: [
      "Karyotyping", "BRCA1/BRCA2 Screening", "Thalassemia Screening",
      "G6PD Deficiency", "Factor V Leiden Mutation",
    ],
    label: "Genetic Tests",
  },
  "Home Collection": {
    fields: ["clinicalIndication", "medHistory"],
    testOptions: [],
    label: "Home Sample Collection",
  },
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
  "Colour Doppler": {
    fields: ["bodyPart", "clinicalIndication", "medHistory"],
    bodyParts: ["Carotid Arteries", "Peripheral Arteries (Limbs)", "Renal Arteries", "Portal Vein / Abdomen", "Deep Vein Thrombosis (DVT)", "Fetal Doppler", "Other"],
    label: "Colour Doppler Study",
  },
  "DEXA Scan": {
    fields: ["bodyPart", "pregnant", "clinicalIndication", "medHistory"],
    bodyParts: ["Lumbar Spine (L1–L4)", "Hip – Femoral Neck", "Whole Body", "Forearm"],
    label: "Bone Densitometry (DEXA)",
  },
};

const ALLERGIES_LIST = ["Iodine / Contrast Dye", "Shellfish", "Penicillin", "Sulfa Drugs", "Latex", "Aspirin / NSAIDs", "None Known"];

const normalizeService = (s) => {
  if (!s) return s;
  const map = {
    "blood tests": "Blood Tests", "hematology": "Hematology",
    "biochemistry": "Biochemistry", "pathology": "Pathology",
    "microbiology": "Microbiology", "urine tests": "Urine Tests",
    "hormone tests": "Hormone Tests", "cardiac markers": "Cardiac Markers",
    "tumour markers": "Tumour Markers", "allergy tests": "Allergy Tests",
    "genetic tests": "Genetic Tests", "home collection": "Home Collection",
    "home sample collection": "Home Collection",
    "mri": "MRI", "ct scan": "CT Scan", "x-ray": "X-Ray",
    "ultrasound": "Ultrasound", "colour doppler": "Colour Doppler",
    "dexa scan": "DEXA Scan",
  };
  return map[s.toLowerCase()] || s;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Pathologylabpage() {
  const navigate = useNavigate();

  const isLoggedIn = !!(
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken")
  );

  // View: "labs" | "booking"
  const [view, setView] = useState("labs");

  // Lab state
  const [labs, setLabs] = useState([]);
  const [labsLoading, setLabsLoading] = useState(true);
  const [labSearch, setLabSearch] = useState("");
  const [selectedLab, setSelectedLab] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Booking flow state
  const [step, setStep] = useState("service"); // service | patient | details | confirm
  const [selectedService, setSelectedService] = useState(null);
  const [refNum, setRefNum] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Patient info
  const [patient, setPatient] = useState({
    fullName: "", dob: "", gender: "", mobile: "", email: "",
    address: "", city: "", state: "", bloodGroup: "",
  });

  // Test details
  const [testDetails, setTestDetails] = useState({
    selectedTests: [], bodyPart: "", contrast: "", clinicalIndication: "",
    claustrophobia: "", pregnant: "", pacemaker: "", metalImplants: "", kidneyDisease: "",
    allergies: [], fastingHours: "", medHistory: "",
    apptDate: "", apptSlot: "", collectionType: "", paymentMode: "",
    refDocName: "", refDocSpec: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);

  // Inject CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Fetch approved pathology labs
  useEffect(() => {
    axios.get(`${BASE_API}/api/labs/approved`)
      .then(res => setLabs(res.data?.data || []))
      .catch(() => setLabs([]))
      .finally(() => setLabsLoading(false));
  }, []);

  // Autofill patient from user profile
  useEffect(() => {
    if (!isLoggedIn) return;
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("authToken");
    axios
      .get(`${BASE_API}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const u = res.data?.user || {};
        setPatient((prev) => ({
          ...prev,
          fullName: u.name ? `${u.name} ${u.lastname || ""}`.trim() : prev.fullName,
          email: u.email || prev.email,
          gender: u.gender || prev.gender,
          address: u.address || prev.address,
        }));
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const filteredLabs = labs.filter(c => {
    const q = labSearch.toLowerCase();
    return (
      (c.labName || c.businessName)?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      (c.labType || c.businessType)?.toLowerCase().includes(q)
    );
  });

  const handleBookAtLab = (lab) => {
    setSelectedLab(lab);
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      setView("booking");
      setStep("service");
      window.scrollTo(0, 0);
    }
  };

  const handleGoLogin = () => {
    sessionStorage.setItem("redirectAfterLogin", "/book-lab-test");
    navigate("/userlogin");
  };

  // Services at selected lab
  const availableServices = selectedLab?.servicesOffered || [];
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

    setSubmitting(true);
    try {
      await axios.post(
        `${BASE_API}/api/labs/book`,
        {
          labId: selectedLab._id,
          labName: selectedLab.labName || selectedLab.businessName,
          fullName: patient.fullName,
          mobile: patient.mobile,
          email: patient.email,
          dob: patient.dob,
          gender: patient.gender,
          address: patient.address,
          city: patient.city,
          state: patient.state,
          bloodGroup: patient.bloodGroup,
          serviceType: selectedService,
          selectedTests: testDetails.selectedTests,
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
          collectionType: testDetails.collectionType,
          paymentMode: testDetails.paymentMode,
          status: "PENDING",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRefNum("LAB-" + Math.floor(100000 + Math.random() * 900000));
      setShowSuccess(true);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setView("labs");
    setSelectedLab(null);
    setStep("service");
    setSelectedService(null);
    setPatient({ fullName: "", dob: "", gender: "", mobile: "", email: "", address: "", city: "", state: "", bloodGroup: "" });
    setTestDetails({ selectedTests: [], bodyPart: "", contrast: "", clinicalIndication: "", claustrophobia: "", pregnant: "", pacemaker: "", metalImplants: "", kidneyDisease: "", allergies: [], fastingHours: "", medHistory: "", apptDate: "", apptSlot: "", collectionType: "", paymentMode: "", refDocName: "", refDocSpec: "" });
    setShowSuccess(false);
  };

  const STEPS = ["service", "patient", "details", "confirm"];
  const stepIdx = STEPS.indexOf(step);

  const RadioStrip = ({ options, value, onChange }) => (
    <div className="path-radio-strip">
      {options.map(opt => (
        <label key={opt} className={value === opt ? "active" : ""} onClick={() => onChange(opt)}>
          <input type="radio" checked={value === opt} onChange={() => {}} />
          {opt}
        </label>
      ))}
    </div>
  );

  const Chips = ({ options, selected, onToggle }) => (
    <div className="path-chips">
      {options.map(opt => (
        <div key={opt} className={`path-chip${selected.includes(opt) ? " selected" : ""}`} onClick={() => onToggle(opt)}>
          <input type="checkbox" checked={selected.includes(opt)} onChange={() => {}} />
          {opt}
        </div>
      ))}
    </div>
  );

  return (
    <div className="path-root">

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
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#0b1f3a", marginBottom: 10 }}>Login Required</div>
            <div style={{ fontSize: 14, color: "#9a9a96", lineHeight: 1.65, marginBottom: 28 }}>
              To book at <strong>{selectedLab?.labName || selectedLab?.businessName}</strong>, please log in first.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={handleGoLogin} style={{
                background: "#0d7c66", color: "#fff", border: "none",
                borderRadius: 8, padding: "13px 32px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>Login to Continue</button>
              <button onClick={() => { setShowAuthModal(false); setSelectedLab(null); }} style={{
                background: "transparent", color: "#9a9a96", border: "1.5px solid #e2e2df",
                borderRadius: 8, padding: "13px 24px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer",
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="path-hero">
        <div className="path-hero-tag">Pathology Services</div>
        <h1 className="path-hero-title">Book a Pathology Lab Test</h1>
        <p className="path-hero-sub">Blood tests, urine tests, biopsies & more — find an approved lab near you.</p>
      </div>

      {/* BREADCRUMB */}
      <div className="path-crumb">
        <a href="/">Home</a> ›
        <a href="/services">Services</a> ›
        <span>Pathology Lab Booking</span>
        {selectedLab && view === "booking" && (
          <><span>›</span><span>{selectedLab.labName || selectedLab.businessName}</span></>
        )}
      </div>

      {/* ── LABS VIEW ── */}
      {view === "labs" && (
        <div className="path-shell">
          <div className="path-card">
            <div className="path-card-head">
              <div>
                <div className="path-card-title">Choose a Pathology Lab</div>
                <div className="path-card-sub">Select an approved lab near you to book your test.</div>
              </div>
              <div className="path-badge">{labs.length} Labs Available</div>
            </div>

            <input
              className="path-search-input"
              type="text"
              placeholder="Search by name, city or type…"
              value={labSearch}
              onChange={e => setLabSearch(e.target.value)}
            />

            {labsLoading ? (
              <div className="path-loading">⏳ Loading approved labs…</div>
            ) : filteredLabs.length === 0 ? (
              <div className="path-empty">
                {labs.length === 0
                  ? " No approved pathology labs available yet."
                  : "No labs match your search."}
              </div>
            ) : (
              <div className="path-labs-grid">
                {filteredLabs.map(lab => {
                  const name = lab.labName || lab.businessName;
                  const type = lab.labType || lab.businessType;
                  const services = lab.servicesOffered || [];
                  return (
                    <div
                      key={lab._id}
                      onClick={() => setSelectedLab(lab)}
                      className={`path-lab-card${selectedLab?._id === lab._id ? " selected" : ""}`}
                    >
                      {selectedLab?._id === lab._id && (
                        <div className="path-lab-selected-badge">✓ Selected</div>
                      )}
                      <div className="path-lab-name">{name}</div>
                      <div className="path-lab-location">
                        {lab.city}{lab.state ? `, ${lab.state}` : ""}
                      </div>
                      <div className="path-lab-type">{type}</div>
                      {lab.mobile && <div className="path-lab-phone"> {lab.mobile}</div>}
                      {services.length > 0 && (
                        <div className="path-lab-services">
                          {services.slice(0, 4).map(s => (
                            <span key={s} className="path-service-tag">{s}</span>
                          ))}
                          {services.length > 4 && (
                            <span className="path-service-tag">+{services.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
              <button
                className="path-btn-primary"
                disabled={!selectedLab}
                onClick={() => selectedLab && handleBookAtLab(selectedLab)}
              >
                {selectedLab
                  ? `Book at ${selectedLab.labName || selectedLab.businessName} →`
                  : "Select a Lab to Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOOKING VIEW ── */}
      {view === "booking" && (
        <div className="path-shell">

          {/* Lab info bar */}
          <div className="path-centre-bar">
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#0b1f3a" }}>
                 {selectedLab?.labName || selectedLab?.businessName}
              </div>
              <div style={{ fontSize: 12, color: "#0d7c66", marginTop: 2 }}>
                {selectedLab?.city}{selectedLab?.state ? `, ${selectedLab.state}` : ""} · {selectedLab?.labType || selectedLab?.businessType}
              </div>
            </div>
            <button
              onClick={() => { setView("labs"); setStep("service"); setSelectedService(null); }}
              className="path-btn-ghost"
              style={{ fontSize: 13, padding: "8px 16px" }}
            >
              ← Change Lab
            </button>
          </div>

          {/* Progress bar */}
          <div className="path-progress">
            <div className="path-progress-inner">
              {[["1", "Service"], ["2", "Patient"], ["3", "Details"], ["4", "Confirm"]].map(([num, label], i) => (
                <div key={label} className={`path-prog-step${i <= stepIdx ? " active" : ""}`}>
                  <div className="path-prog-num">{num}</div>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── STEP: SELECT SERVICE ── */}
          {step === "service" && (
            <div className="path-card">
              <div className="path-card-head">
                <div>
                  <div className="path-card-title">Select a Service</div>
                  <div className="path-card-sub">Choose from services available at {selectedLab?.labName || selectedLab?.businessName}</div>
                </div>
                <div className="path-badge">Step 1 of 4</div>
              </div>

              {serviceConfigs.length === 0 ? (
                <div className="path-empty">
                  This lab has not listed any services yet. Please choose another lab.
                </div>
              ) : (
                <div className="path-svc-grid">
                  {serviceConfigs.map(({ raw, key, config }) => (
                    <div
                      key={key}
                      className={`path-svc-card${selectedService === raw ? " active" : ""}`}
                      onClick={() => setSelectedService(raw)}
                    >
                      <div className="path-svc-icon">{SERVICE_ICONS[key] || ""}</div>
                      <div className="path-svc-name">{config.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  className="path-btn-primary"
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
            <div className="path-card">
              <div className="path-card-head">
                <div>
                  <div className="path-card-title">Patient Information</div>
                  <div className="path-card-sub">Provide accurate details as they will appear on the report.</div>
                </div>
                <div className="path-badge">Step 2 of 4</div>
              </div>

              <div className="path-section-lbl">Personal Details</div>
              <div className="path-g2">
                <div className="path-field">
                  <label>
                    Full Name *{" "}
                    {patient.fullName && (
                      <span style={{ color: "#0d7c66", fontWeight: 400, textTransform: "none" }}>✓ auto-filled</span>
                    )}
                  </label>
                  <input placeholder="Patient's full name" value={patient.fullName} onChange={setP("fullName")} />
                </div>
                <div className="path-field">
                  <label>Date of Birth</label>
                  <input type="date" value={patient.dob} onChange={setP("dob")} />
                </div>
                <div className="path-field">
                  <label>Gender</label>
                  <RadioStrip options={["Male", "Female", "Other"]} value={patient.gender}
                    onChange={v => setPatient(f => ({ ...f, gender: v }))} />
                </div>
                <div className="path-field">
                  <label>Blood Group</label>
                  <select value={patient.bloodGroup} onChange={setP("bloodGroup")}>
                    <option value="">Select</option>
                    {["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "Don't Know"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="path-field">
                  <label>Mobile *</label>
                  <input type="tel" placeholder="+91 XXXXX XXXXX" value={patient.mobile} onChange={setP("mobile")} />
                </div>
                <div className="path-field">
                  <label>
                    Email{" "}
                    {patient.email && (
                      <span style={{ color: "#0d7c66", fontWeight: 400, textTransform: "none" }}>✓ auto-filled</span>
                    )}
                  </label>
                  <input type="email" placeholder="patient@email.com" value={patient.email} onChange={setP("email")} />
                </div>
                <div className="path-field">
                  <label>City</label>
                  <input placeholder="City" value={patient.city} onChange={setP("city")} />
                </div>
                <div className="path-field">
                  <label>State</label>
                  <select value={patient.state} onChange={setP("state")}>
                    <option value="">Select state</option>
                    {["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Gujarat", "Rajasthan", "Telangana", "Madhya Pradesh", "Haryana", "Punjab", "Bihar", "Odisha", "Other"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="path-field path-s2">
                  <label>
                    Address{" "}
                    {patient.address && (
                      <span style={{ color: "#0d7c66", fontWeight: 400, textTransform: "none" }}>✓ auto-filled</span>
                    )}
                  </label>
                  <input placeholder="Full address" value={patient.address} onChange={setP("address")} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button className="path-btn-ghost" onClick={() => setStep("service")}>← Back</button>
                <button className="path-btn-primary" onClick={() => {
                  if (!patient.fullName || !patient.mobile) { alert("Name and mobile are required."); return; }
                  setStep("details");
                }}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP: TEST DETAILS ── */}
          {step === "details" && cfg && (
            <div className="path-card">
              <div className="path-card-head">
                <div>
                  <div className="path-card-title">{cfg.label} — Test Details</div>
                  <div className="path-card-sub">Test options & appointment scheduling</div>
                </div>
                <div className="path-badge">Step 3 of 4</div>
              </div>

              {/* Test options (for pathology services) */}
              {cfg.testOptions && cfg.testOptions.length > 0 && (
                <>
                  <div className="path-section-lbl">Select Tests</div>
                  <Chips
                    options={cfg.testOptions}
                    selected={testDetails.selectedTests}
                    onToggle={v => toggleArr("selectedTests", v)}
                  />
                  <div className="path-divider" />
                </>
              )}

              {/* Body part (for imaging services) */}
              {cfg.bodyParts && (
                <>
                  <div className="path-section-lbl">Body Part / Area</div>
                  <div className="path-field">
                    <select value={testDetails.bodyPart} onChange={setT("bodyPart")}>
                      <option value="">Select body area</option>
                      {cfg.bodyParts.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="path-divider" />
                </>
              )}

              {/* Scan-specific fields */}
              {(hasField("contrast") || hasField("fastingHours") || hasField("clinicalIndication")) && (
                <>
                  <div className="path-section-lbl">Test Details</div>
                  <div className="path-g2">
                    {hasField("contrast") && (
                      <div className="path-field">
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
                      <div className="path-field">
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
                      <div className="path-field path-s2">
                        <label>Clinical Indication / Symptoms</label>
                        <textarea
                          placeholder="Describe symptoms or reason for test…"
                          value={testDetails.clinicalIndication} onChange={setT("clinicalIndication")}
                        />
                      </div>
                    )}
                  </div>
                  <div className="path-divider" />
                </>
              )}

              {/* Safety screening (for imaging) */}
              {(hasField("claustrophobia") || hasField("pregnant") || hasField("pacemaker") || hasField("metalImplants") || hasField("kidneyDisease")) && (
                <>
                  <div className="path-section-lbl">Safety Screening</div>
                  <div className="path-alert-warn">⚠️ Required for imaging safety — please answer accurately.</div>
                  <div className="path-g2">
                    {hasField("claustrophobia") && (
                      <div className="path-field">
                        <label>Claustrophobia</label>
                        <RadioStrip options={["Yes", "No", "Not Sure"]} value={testDetails.claustrophobia}
                          onChange={v => setTestDetails(f => ({ ...f, claustrophobia: v }))} />
                      </div>
                    )}
                    {hasField("pregnant") && (
                      <div className="path-field">
                        <label>Pregnancy</label>
                        <RadioStrip options={["Yes", "No", "Not Applicable"]} value={testDetails.pregnant}
                          onChange={v => setTestDetails(f => ({ ...f, pregnant: v }))} />
                      </div>
                    )}
                    {hasField("pacemaker") && (
                      <div className="path-field">
                        <label>Pacemaker / Cardiac Implant</label>
                        <RadioStrip options={["Yes", "No", "Not Sure"]} value={testDetails.pacemaker}
                          onChange={v => setTestDetails(f => ({ ...f, pacemaker: v }))} />
                      </div>
                    )}
                    {hasField("metalImplants") && (
                      <div className="path-field">
                        <label>Metal Implants</label>
                        <RadioStrip options={["Yes", "No", "Not Sure"]} value={testDetails.metalImplants}
                          onChange={v => setTestDetails(f => ({ ...f, metalImplants: v }))} />
                      </div>
                    )}
                    {hasField("kidneyDisease") && (
                      <div className="path-field">
                        <label>Kidney Disease</label>
                        <RadioStrip options={["Yes", "No", "Not Sure"]} value={testDetails.kidneyDisease}
                          onChange={v => setTestDetails(f => ({ ...f, kidneyDisease: v }))} />
                      </div>
                    )}
                  </div>
                  {hasField("allergies") && (
                    <div className="path-field">
                      <label>Known Allergies</label>
                      <Chips options={ALLERGIES_LIST} selected={testDetails.allergies}
                        onToggle={v => toggleArr("allergies", v)} />
                    </div>
                  )}
                  <div className="path-divider" />
                </>
              )}

              {/* Medical history (shared) */}
              {hasField("medHistory") && (
                <>
                  <div className="path-field">
                    <label>Other Medical History</label>
                    <textarea
                      placeholder="Diabetes, prior surgeries, current medications…"
                      value={testDetails.medHistory} onChange={setT("medHistory")}
                    />
                  </div>
                  <div className="path-divider" />
                </>
              )}

              {/* Referring doctor */}
              <div className="path-section-lbl">Referring Doctor (Optional)</div>
              <div className="path-g2">
                <div className="path-field">
                  <label>Doctor's Name</label>
                  <input placeholder="Dr. Full Name" value={testDetails.refDocName} onChange={setT("refDocName")} />
                </div>
                <div className="path-field">
                  <label>Specialisation</label>
                  <input placeholder="e.g. General Physician" value={testDetails.refDocSpec} onChange={setT("refDocSpec")} />
                </div>
              </div>

              <div className="path-divider" />
              <div className="path-section-lbl">Appointment</div>
              <div className="path-g2">
                <div className="path-field">
                  <label>Date *</label>
                  <input
                    type="date" value={testDetails.apptDate}
                    min={new Date().toISOString().split("T")[0]} onChange={setT("apptDate")}
                  />
                </div>
                <div className="path-field">
                  <label>Time Slot</label>
                  <select value={testDetails.apptSlot} onChange={setT("apptSlot")}>
                    <option value="">Select slot</option>
                    {["06:00–08:00 AM (Early Morning)", "08:00–10:00 AM", "10:00 AM–12:00 PM", "12:00–02:00 PM", "02:00–04:00 PM", "04:00–06:00 PM"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="path-field">
                  <label>Collection Type</label>
                  <select value={testDetails.collectionType} onChange={setT("collectionType")}>
                    <option value="">Select type</option>
                    <option>Home Collection</option>
                    <option>Walk-in at Lab</option>
                    <option>Hospital / Clinic</option>
                  </select>
                </div>
                <div className="path-field">
                  <label>Payment Mode</label>
                  <select value={testDetails.paymentMode} onChange={setT("paymentMode")}>
                    <option value="">Select payment</option>
                    <option>Online – UPI</option>
                    <option>Online – Card</option>
                    <option>Pay at Lab</option>
                    <option>Insurance / TPA</option>
                    <option>Govt. Scheme</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <button className="path-btn-ghost" onClick={() => setStep("patient")}>← Back</button>
                <button className="path-btn-primary" onClick={() => setStep("confirm")}>Review Booking →</button>
              </div>
            </div>
          )}

          {/* ── STEP: CONFIRM ── */}
          {step === "confirm" && (
            <div className="path-card">
              <div className="path-card-head">
                <div>
                  <div className="path-card-title">Review & Confirm</div>
                  <div className="path-card-sub">Please verify all details before confirming.</div>
                </div>
                <div className="path-badge">Step 4 of 4</div>
              </div>

              {/* Booking summary banner */}
              <div style={{
                background: "#e6f5f2", border: "1px solid #99f6e4", borderRadius: 10,
                padding: "14px 18px", marginBottom: 20,
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0b1f3a" }}>
                  {SERVICE_ICONS[normalizeService(selectedService)] || ""} {cfg?.label}
                </div>
                <div style={{ fontSize: 12, color: "#0d7c66", marginTop: 4 }}>
                   {selectedLab?.labName || selectedLab?.businessName} · {selectedLab?.city}
                </div>
                <div style={{ fontSize: 12, color: "#9a9a96", marginTop: 2 }}>
                  {testDetails.apptDate
                    ? new Date(testDetails.apptDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                    : "—"}
                  {testDetails.apptSlot ? ` · ${testDetails.apptSlot}` : ""}
                  {testDetails.collectionType ? ` · ${testDetails.collectionType}` : ""}
                </div>
              </div>

              <div className="path-section-lbl">Patient</div>
              <div className="path-detail-grid">
                <div><div className="path-detail-key">Name</div><div className="path-detail-val">{patient.fullName}</div></div>
                <div><div className="path-detail-key">Mobile</div><div className="path-detail-val">{patient.mobile}</div></div>
                {patient.gender && <div><div className="path-detail-key">Gender</div><div className="path-detail-val">{patient.gender}</div></div>}
                {patient.city && <div><div className="path-detail-key">City</div><div className="path-detail-val">{patient.city}</div></div>}
                {patient.email && <div><div className="path-detail-key">Email</div><div className="path-detail-val">{patient.email}</div></div>}
                {patient.bloodGroup && <div><div className="path-detail-key">Blood Group</div><div className="path-detail-val">{patient.bloodGroup}</div></div>}
              </div>

              {testDetails.selectedTests.length > 0 && (
                <>
                  <div className="path-section-lbl">Tests Selected</div>
                  <div className="path-tag-row" style={{ marginBottom: 16 }}>
                    {testDetails.selectedTests.map(t => <span key={t} className="path-tag">{t}</span>)}
                  </div>
                </>
              )}

              {testDetails.bodyPart && (
                <>
                  <div className="path-section-lbl">Body Part</div>
                  <div className="path-detail-val" style={{ marginBottom: 16 }}>{testDetails.bodyPart}</div>
                </>
              )}

              {testDetails.paymentMode && (
                <>
                  <div className="path-section-lbl">Payment</div>
                  <div className="path-detail-val" style={{ marginBottom: 16 }}>{testDetails.paymentMode}</div>
                </>
              )}

              {testDetails.clinicalIndication && (
                <>
                  <div className="path-section-lbl">Clinical Indication</div>
                  <div className="path-detail-val" style={{ marginBottom: 16 }}>{testDetails.clinicalIndication}</div>
                </>
              )}

              <div className="path-terms">
                By confirming, you acknowledge that all information is accurate. Our team will contact you to confirm the appointment. Cancellation is free up to 2 hours before scheduled time. Reports will be sent to your email and available in your account.
              </div>

              <div className="path-submit-row">
                <div className="path-submit-note">
                  Confirmation will be sent to <strong>{patient.mobile}</strong> via SMS.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="path-btn-ghost" onClick={() => setStep("details")}>← Edit Details</button>
                  <button
                    className="path-btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "✓ Confirm Booking"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      <div className={`path-success-overlay${showSuccess ? " show" : ""}`}>
        <div className="path-success-box">
          <div className="path-check-ring">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="path-s-title">Booking Confirmed!</div>
          <div className="path-s-sub">
            {cfg?.label} test for <strong>{patient.fullName}</strong> at{" "}
            <strong>{selectedLab?.labName || selectedLab?.businessName}</strong> has been booked.
          </div>
          <div className="path-ref">{refNum}</div>
          <p style={{ fontSize: 12, color: "#9a9a96", marginBottom: 26, lineHeight: 1.7 }}>
            Confirmation SMS will be sent to {patient.mobile || "the patient"}.
          </p>
          <button className="path-btn-primary" onClick={resetAll}>Book Another Test</button>
        </div>
      </div>
    </div>
  );
}