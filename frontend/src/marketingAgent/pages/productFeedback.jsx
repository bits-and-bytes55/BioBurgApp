import { useState, useEffect, useRef } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

//  DROPDOWN DATA 
const USER_TYPES = [
  "Doctor / Physician",
  "Pharmacist",
  "Patient",
  "Nurse / Paramedic",
  "Hospital Administrator",
  "Distributor / Wholesaler",
  "Retailer",
  "Caregiver",
  "Other",
];

const SPECIALIZATIONS = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Orthopedic",
  "Neurologist",
  "Gynecologist",
  "ENT Specialist",
  "Ophthalmologist",
  "Psychiatrist",
  "Oncologist",
  "Endocrinologist",
  "Pulmonologist",
  "Urologist",
  "Gastroenterologist",
  "Not Applicable",
  "Other",
];

const PRODUCT_CATEGORIES = [
  "Tablets",
  "Capsules",
  "Syrups / Liquids",
  "Injectables",
  "Topical / Ointments",
  "Drops (Eye / Ear / Nasal)",
  "Inhalers",
  "Ayurvedic / Herbal",
  "Nutraceuticals / Supplements",
  "Medical Devices",
  "Diagnostic Kits",
  "Other",
];

const FEEDBACK_TYPES = [
  "Product Quality",
  "Packaging & Labelling",
  "Pricing & Affordability",
  "Availability / Stock",
  "Side Effects Reported",
  "Efficacy / Therapeutic Outcome",
  "Taste / Odour / Appearance",
  "Storage & Handling",
  "Counterfeit / Substandard Concern",
  "Positive Experience",
  "Other",
];

const OVERALL_EXPERIENCE = [
  "Excellent",
  "Good",
  "Average",
  "Below Average",
  "Poor",
];

const HOW_LONG = [
  "First time use",
  "Less than 1 month",
  "1 – 3 months",
  "3 – 6 months",
  "6 – 12 months",
  "More than 1 year",
  "Other",
];

const PATIENT_AGE_GROUPS = [
  "Neonatal (0–28 days)",
  "Infant (1–12 months)",
  "Pediatric (1–12 years)",
  "Adolescent (13–17 years)",
  "Adult (18–60 years)",
  "Geriatric (60+ years)",
  "Not Applicable",
  "Other",
];

const SOURCE_OPTIONS = [
  "Prescription by Doctor",
  "Self-medication / OTC",
  "Pharmacist Recommendation",
  "Online Purchase",
  "Hospital / Clinic Dispensary",
  "Other",
];

const WOULD_RECOMMEND = ["Definitely Yes", "Probably Yes", "Not Sure", "Probably No", "Definitely No"];

const toAlpha = (v) => v.replace(/[^a-zA-Z\s.\-'()/,]/g, "");

const toNumeric = (v, max) => {
  const n = v.replace(/\D/g, "");
  if (max !== undefined && n !== "" && Number(n) > max) return String(max);
  return n;
};

const toAlphaNum = (v) => v.replace(/[^a-zA-Z0-9\s\-/]/g, "");

const toPhone = (v) => v.replace(/\D/g, "").slice(0, 15);

// STAR RATING 
function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const LABELS = ["", "Very Poor", "Poor", "Average", "Good", "Excellent"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onMouseEnter={() => !disabled && setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => !disabled && onChange(s)}
          aria-label={`${s} star`}
          style={{
            background: "none",
            border: "none",
            cursor: disabled ? "default" : "pointer",
            fontSize: 32,
            padding: "0 2px",
            lineHeight: 1,
            color: (hover || value) >= s ? "#f59e0b" : "#e5e7eb",
            transform: (hover || value) >= s ? "scale(1.18)" : "scale(1)",
            transition: "transform 0.13s, color 0.13s",
            filter: (hover || value) >= s ? "drop-shadow(0 0 4px #f59e0b66)" : "none",
          }}
        >★</button>
      ))}
      {value > 0 && (
        <span style={{
          marginLeft: 8, fontSize: 13, fontWeight: 700,
          color: value >= 4 ? "#16a34a" : value === 3 ? "#d97706" : "#dc2626",
          background: value >= 4 ? "#dcfce7" : value === 3 ? "#fef3c7" : "#fee2e2",
          padding: "3px 10px", borderRadius: 20,
        }}>
          {LABELS[value]}
        </span>
      )}
    </div>
  );
}

//  FIELD WRAPPER 
function Field({ label, required, error, hint, children, span2 }) {
  return (
    <div style={{ gridColumn: span2 ? "1 / -1" : undefined }}>
      <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: "#1e293b", letterSpacing: "0.01em" }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
        {hint && <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 12, marginLeft: 6 }}>({hint})</span>}
      </label>
      {children}
      {error && (
        <div className="pf-err" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
          <span style={{ fontSize: 13 }}>⚠</span> {error}
        </div>
      )}
    </div>
  );
}

// SECTION 
function Section({ step, title, subtitle, children }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      border: "1px solid #f1f5f9",
    }}>
      {/* Section header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 22px",
        background: "linear-gradient(135deg, #f8faff 0%, #eef4ff 100%)",
        borderBottom: "1px solid #e8f0fe",
      }}>
        {/* <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "linear-gradient(135deg, #1e40af, #3b82f6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
          boxShadow: "0 2px 8px rgba(59,130,246,0.35)",
        }}>{}</div> */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", background: "#dbeafe", padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em" }}>
              STEP {step}
            </span>
          </div>
          <h3 style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
          {subtitle && <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ padding: "22px 22px 24px" }}>{children}</div>
    </div>
  );
}

// ─── CSS CLASSES (injected once) ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  .pf-global *, .pf-global *::before, .pf-global *::after { box-sizing: border-box; }
  .pf-global {
    font-family: 'Outfit', sans-serif;
    background: linear-gradient(160deg, #f0f4ff 0%, #f8fafc 50%, #f0fdf4 100%);
    min-height: 100vh;
    padding: 0 0 72px;
  }

  /* ── hero ── */
  .pf-hero {
    background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%);
    padding: 36px 24px 48px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .pf-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  .pf-hero-title  { margin: 0; font-size: clamp(22px, 4vw, 34px); font-weight: 800; color: #fff; letter-spacing: -0.5px; position: relative; }
  .pf-hero-sub    { margin: 10px 0 0; font-size: clamp(13px, 2vw, 16px); color: #bfdbfe; position: relative; font-weight: 400; }
  .pf-hero-badge  { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); backdrop-filter: blur(6px); color: #fff; font-size: 12px; font-weight: 600; padding: 5px 14px; border-radius: 20px; margin-bottom: 16px; position: relative; }

  /* ── body ── */
  .pf-body { max-width: 820px; margin: -24px auto 0; padding: 0 14px; position: relative; }
  @media (min-width: 768px) { .pf-body { padding: 0 24px; } }

  /* ── grid ── */
  .pf-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
  @media (min-width: 560px) { .pf-grid { grid-template-columns: 1fr 1fr; } }

  /* ── inputs ── */
  .pf-input, .pf-select, .pf-textarea {
    width: 100%; padding: 11px 14px;
    border: 1.5px solid #e2e8f0; border-radius: 9px;
    font-family: 'Outfit', sans-serif; font-size: 14px; color: #0f172a;
    background: #fafbff; outline: none; appearance: none; -webkit-appearance: none;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  }
  .pf-input::placeholder, .pf-select::placeholder, .pf-textarea::placeholder { color: #94a3b8; }
  .pf-input:focus, .pf-select:focus, .pf-textarea:focus {
    border-color: #3b82f6; background: #fff;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }
  .pf-input.err, .pf-select.err, .pf-textarea.err {
    border-color: #ef4444; background: #fff9f9;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
  }
  .pf-select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; background-size: 18px;
    padding-right: 38px; cursor: pointer;
  }
  .pf-textarea { resize: vertical; min-height: 96px; line-height: 1.65; }

  /* ── other field ── */
  .pf-other-wrap { margin-top: 10px; animation: pf-slide-in 0.2s ease; }
  @keyframes pf-slide-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

  /* ── char counter ── */
  .pf-counter { text-align: right; font-size: 11px; color: #94a3b8; margin-top: 4px; font-family: 'JetBrains Mono', monospace; }

  /* ── recommend ── */
  .pf-rec-group { display: flex; flex-wrap: wrap; gap: 8px; }
  .pf-rec-btn {
    padding: 9px 16px; border-radius: 9px; border: 1.5px solid #e2e8f0;
    background: #fafbff; font-family: 'Outfit', sans-serif; font-size: 13px;
    font-weight: 600; cursor: pointer; transition: all 0.16s; white-space: nowrap;
  }
  .pf-rec-btn:hover:not(.sel) { border-color: #94a3b8; background: #f8fafc; }
  .pf-rec-btn.sel-green  { background: #f0fdf4; border-color: #22c55e; color: #15803d; }
  .pf-rec-btn.sel-red    { background: #fef2f2; border-color: #ef4444; color: #b91c1c; }
  .pf-rec-btn.sel-yellow { background: #fffbeb; border-color: #f59e0b; color: #92400e; }
  .pf-rec-btn.sel-orange { background: #fff7ed; border-color: #f97316; color: #9a3412; }
  .pf-rec-btn.sel-gray   { background: #f8fafc; border-color: #64748b; color: #334155; }

  /* ── submit btn ── */
  .pf-submit-btn {
    width: 100%; padding: 15px; border: none; border-radius: 12px; cursor: pointer;
    font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700;
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%);
    color: #fff; letter-spacing: 0.2px;
    box-shadow: 0 4px 15px rgba(37,99,235,0.4);
    transition: all 0.2s;
  }
  .pf-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.45); }
  .pf-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .pf-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  /* ── spinner ── */
  .pf-spin { display: inline-block; width: 17px; height: 17px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: spin 0.65s linear infinite; vertical-align: middle; margin-right: 8px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── success ── */
  .pf-success {
    background: #fff; border-radius: 20px; padding: 56px 32px;
    text-align: center; margin: 32px auto;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 500px;
    border: 1px solid #f0fdf4;
  }
  .pf-success-ring {
    width: 88px; height: 88px; border-radius: 50%;
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    display: flex; align-items: center; justify-content: center;
    font-size: 42px; margin: 0 auto 20px;
    box-shadow: 0 0 0 12px rgba(34,197,94,0.1);
    animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes pop { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  /* ── progress bar ── */
  .pf-progress { height: 4px; background: #e2e8f0; border-radius: 0; overflow: hidden; }
  .pf-progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #06b6d4); border-radius: 0; transition: width 0.4s ease; }

  /* ── required note ── */
  .pf-req-note { font-size: 12px; color: #64748b; text-align: center; margin-top: 12px; }

  /* ── toast ── */
  .pf-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    padding: 12px 22px; border-radius: 12px; font-family: 'Outfit', sans-serif;
    font-size: 14px; font-weight: 600; z-index: 9999;
    animation: pf-toast-in 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    white-space: nowrap; max-width: 90vw; text-align: center;
  }
  .pf-toast.success { background: #15803d; color: #fff; }
  .pf-toast.error   { background: #b91c1c; color: #fff; }
  @keyframes pf-toast-in { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
`;

// ─── INITIAL STATE ────────────────────────────────────────────────────────────
const INIT = {
  // WHO
  submitterType: "", submitterTypeOther: "",
  submitterName: "", submitterPhone: "", submitterEmail: "",
  organizationName: "", city: "", state: "",
  specialization: "", specializationOther: "",
  // PRODUCT
  productName: "", productCode: "", batchNumber: "",
  category: "", categoryOther: "",
  productSource: "", productSourceOther: "",
  howLong: "", howLongOther: "",
  // FEEDBACK
  feedbackType: "", feedbackTypeOther: "",
  patientAgeGroup: "", patientAgeGroupOther: "",
  prescriptionCount: "",
  rating: 0,
  overallExperience: "", 
  feedbackText: "",
  specificIssue: "",
  suggestions: "",
  wouldRecommend: "",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ProductFeedback() {
  const [form, setForm]         = useState(INIT);
  const [errors, setErrors]     = useState({});
  const [submitting, setSub]    = useState(false);
  const [submitted, setDone]    = useState(false);
  const [toast, setToast]       = useState(null); // { msg, type }
  const [progress, setProgress] = useState(0);
  const styleInjected           = useRef(false);

  // inject CSS once
  useEffect(() => {
    if (styleInjected.current) return;
    const tag = document.createElement("style");
    tag.textContent = CSS;
    document.head.appendChild(tag);
    styleInjected.current = true;
  }, []);

  // progress calculation
  useEffect(() => {
    const total = 18; // rough count of required fields
    const filled = [
      form.submitterType, form.submitterName, form.submitterPhone,
      form.organizationName, form.city, form.state,
      form.specialization, form.productName, form.category,
      form.productSource, form.howLong, form.feedbackType,
      form.patientAgeGroup, form.prescriptionCount,
      form.rating, form.overallExperience,
      form.feedbackText, form.wouldRecommend,
    ].filter((v) => v && String(v).trim() !== "" && v !== 0).length;
    setProgress(Math.round((filled / total) * 100));
  }, [form]);

  // toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── setter ──
  const set = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  // ── validate ──
  const validate = () => {
    const e = {};

    // WHO
    if (!form.submitterType)             e.submitterType    = "Please select who you are.";
    if (form.submitterType === "Other" && !form.submitterTypeOther.trim())
                                         e.submitterTypeOther = "Please specify.";
    if (!form.submitterName.trim())      e.submitterName    = "Your name is required.";
    if (!form.submitterPhone.trim())     e.submitterPhone   = "Phone number is required.";
    else if (form.submitterPhone.length < 7)
                                         e.submitterPhone   = "Enter at least 7 digits.";
    if (form.submitterEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.submitterEmail))
                                         e.submitterEmail   = "Enter a valid email address.";
    if (!form.organizationName.trim())   e.organizationName = "Hospital / Clinic / Organisation name is required.";
    if (!form.city.trim())               e.city             = "City is required.";
    if (!form.state.trim())              e.state            = "State is required.";
    if (!form.specialization)            e.specialization   = "Please select a specialization / role.";
    if (form.specialization === "Other" && !form.specializationOther.trim())
                                         e.specializationOther = "Please specify.";

    // PRODUCT
    if (!form.productName.trim())        e.productName      = "Product name is required.";
    if (!form.category)                  e.category         = "Please select a category.";
    if (form.category === "Other" && !form.categoryOther.trim())
                                         e.categoryOther    = "Please specify.";
    if (!form.productSource)             e.productSource    = "Please select how you obtained the product.";
    if (form.productSource === "Other" && !form.productSourceOther.trim())
                                         e.productSourceOther = "Please specify.";
    if (!form.howLong)                   e.howLong          = "Please select how long you've used this product.";
    if (form.howLong === "Other" && !form.howLongOther.trim())
                                         e.howLongOther     = "Please specify.";

    // FEEDBACK
    if (!form.feedbackType)              e.feedbackType     = "Please select a feedback type.";
    if (form.feedbackType === "Other" && !form.feedbackTypeOther.trim())
                                         e.feedbackTypeOther = "Please specify.";
    if (!form.patientAgeGroup)           e.patientAgeGroup  = "Please select a patient / user age group.";
    if (form.patientAgeGroup === "Other" && !form.patientAgeGroupOther.trim())
                                         e.patientAgeGroupOther = "Please specify.";
    if (!form.prescriptionCount.trim())  e.prescriptionCount = "This field is required.";
    else if (Number(form.prescriptionCount) < 1 || Number(form.prescriptionCount) > 99999)
                                         e.prescriptionCount = "Enter a number between 1 and 99999.";
    if (!form.rating)                    e.rating           = "Please rate the product.";
    if (!form.overallExperience)         e.overallExperience = "Please select your overall experience.";
    if (!form.feedbackText.trim())       e.feedbackText     = "Please describe your feedback in detail.";
    if (!form.wouldRecommend)            e.wouldRecommend   = "Please select an option.";

    return e;
  };

  // ── submit ──
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setToast({ msg: `Please fix ${Object.keys(errs).length} error(s) before submitting.`, type: "error" });
      setTimeout(() => {
        const el = document.querySelector(".pf-err");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
      return;
    }

    const payload = {
      submitter_type:        form.submitterType === "Other" ? form.submitterTypeOther : form.submitterType,
      submitter_name:        form.submitterName,
      submitter_phone:       form.submitterPhone,
      submitter_email:       form.submitterEmail || null,
      organization_name:     form.organizationName,
      city:                  form.city,
      state:                 form.state,
      specialization:        form.specialization === "Other" ? form.specializationOther : form.specialization,
      product_name:          form.productName,
      product_code:          form.productCode || null,
      batch_number:          form.batchNumber  || null,
      category:              form.category === "Other" ? form.categoryOther : form.category,
      product_source:        form.productSource === "Other" ? form.productSourceOther : form.productSource,
      how_long:              form.howLong === "Other" ? form.howLongOther : form.howLong,
      feedback_type:         form.feedbackType === "Other" ? form.feedbackTypeOther : form.feedbackType,
      patient_age_group:     form.patientAgeGroup === "Other" ? form.patientAgeGroupOther : form.patientAgeGroup,
      prescription_count:    Number(form.prescriptionCount),
      rating:                form.rating,
      overall_experience:    form.overallExperience,
      feedback_text:         form.feedbackText,
      specific_issue:        form.specificIssue || null,
      suggestions:           form.suggestions   || null,
      would_recommend:       form.wouldRecommend,
      submitted_at:          new Date().toISOString(),
    };

    setSub(true);
    try {
      await axios.post(`${BASE_URL}/api/public/product-feedback`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      setDone(true);
      setToast({ msg: "Feedback submitted successfully! Thank you.", type: "success" });
    } catch (err) {
      console.error("Feedback submit error:", err);
      const msg = err?.response?.data?.message || "Submission failed. Please try again.";
      setToast({ msg, type: "error" });
    } finally {
      setSub(false);
    }
  };

  // ─── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="pf-global">
        <div className="pf-hero">
          <p className="pf-hero-title">Thank You!</p>
        </div>
        <div className="pf-body">
          <div className="pf-success">
            <div className="pf-success-ring">✓</div>
            <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              Feedback Received
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 28px", lineHeight: 1.6 }}>
              Your feedback on <strong style={{ color: "#1e3a8a" }}>{form.productName}</strong> has been
              recorded successfully. It will help us improve our products and services.
            </p>
            <button
              onClick={() => { setForm(INIT); setErrors({}); setDone(false); }}
              className="pf-submit-btn"
              style={{ maxWidth: 280, margin: "0 auto", display: "block" }}
            >
              Submit Another Feedback
            </button>
          </div>
        </div>
        {toast && <div className={`pf-toast ${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  // ─── FORM ──────────────────────────────────────────────────────────────────
  return (
    <div className="pf-global">
      {/* HERO */}
      {/* <div className="pf-hero">
        <div className="pf-hero-badge">🌐 Open to Everyone &nbsp;·&nbsp; No Login Required</div>
        <h1 className="pf-hero-title">Product Feedback Form</h1>
        <p className="pf-hero-sub">
          Share your experience with our products — your feedback drives quality improvement
        </p>
      </div> */}

      {/* PROGRESS */}
      <div className="pf-progress">
        <div className="pf-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="pf-body">
        {/* progress label */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px 4px", fontSize: 12, color: "#64748b" }}>
          {/* <span>Form completion</span> */}
          {/* <span style={{ fontWeight: 700, color: progress === 100 ? "#16a34a" : "#3b82f6" }}>{progress}%</span> */}
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ paddingTop: 12 }}>

          {/*  STEP 1 — WHO ARE YOU  */}
          <Section step={1} title="About You" subtitle="Tell us who you are">
            <div className="pf-grid">

              {/* Submitter Type */}
              <Field label="I am a" required error={errors.submitterType}>
                <select
                  className={`pf-select${errors.submitterType ? " err" : ""}`}
                  value={form.submitterType}
                  onChange={(e) => set("submitterType", e.target.value)}
                >
                  <option value="">-- Select Role --</option>
                  {USER_TYPES.map((u) => <option key={u}>{u}</option>)}
                </select>
              </Field>

              {/* Specialization */}
              <Field label="Specialization / Department" required error={errors.specialization}>
                <select
                  className={`pf-select${errors.specialization ? " err" : ""}`}
                  value={form.specialization}
                  onChange={(e) => set("specialization", e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>

              {/* Other: submitter type */}
              {form.submitterType === "Other" && (
                <Field label="Specify Your Role" required error={errors.submitterTypeOther}>
                  <input
                    className={`pf-input${errors.submitterTypeOther ? " err" : ""}`}
                    placeholder="Type your role (letters only)"
                    value={form.submitterTypeOther}
                    onChange={(e) => set("submitterTypeOther", toAlpha(e.target.value))}
                    maxLength={60}
                  />
                </Field>
              )}

              {/* Other: specialization */}
              {form.specialization === "Other" && (
                <Field label="Specify Specialization" required error={errors.specializationOther}>
                  <input
                    className={`pf-input${errors.specializationOther ? " err" : ""}`}
                    placeholder="Type your specialization (letters only)"
                    value={form.specializationOther}
                    onChange={(e) => set("specializationOther", toAlpha(e.target.value))}
                    maxLength={60}
                  />
                </Field>
              )}

              {/* Name */}
              <Field label="Full Name" required error={errors.submitterName} hint="letters only">
                <input
                  className={`pf-input${errors.submitterName ? " err" : ""}`}
                  placeholder="Your full name"
                  value={form.submitterName}
                  onChange={(e) => set("submitterName", toAlpha(e.target.value))}
                  maxLength={80}
                />
              </Field>

              {/* Phone */}
              <Field label="Mobile / Phone Number" required error={errors.submitterPhone} hint="digits only">
                <input
                  className={`pf-input${errors.submitterPhone ? " err" : ""}`}
                  placeholder="e.g. 9876543210"
                  value={form.submitterPhone}
                  onChange={(e) => set("submitterPhone", toPhone(e.target.value))}
                  inputMode="numeric"
                  maxLength={15}
                />
              </Field>

              {/* Email */}
              <Field label="Email Address" error={errors.submitterEmail} hint="optional">
                <input
                  className={`pf-input${errors.submitterEmail ? " err" : ""}`}
                  type="email"
                  placeholder="your@email.com"
                  value={form.submitterEmail}
                  onChange={(e) => set("submitterEmail", e.target.value)}
                />
              </Field>

              {/* Organisation */}
              <Field label="Hospital / Clinic / Organisation" required error={errors.organizationName} hint="letters only">
                <input
                  className={`pf-input${errors.organizationName ? " err" : ""}`}
                  placeholder="Name of your workplace"
                  value={form.organizationName}
                  onChange={(e) => set("organizationName", toAlpha(e.target.value))}
                  maxLength={120}
                />
              </Field>

              {/* City */}
              <Field label="City" required error={errors.city} hint="letters only">
                <input
                  className={`pf-input${errors.city ? " err" : ""}`}
                  placeholder="Your city"
                  value={form.city}
                  onChange={(e) => set("city", toAlpha(e.target.value))}
                  maxLength={60}
                />
              </Field>

              {/* State */}
              <Field label="State" required error={errors.state} hint="letters only">
                <input
                  className={`pf-input${errors.state ? " err" : ""}`}
                  placeholder="Your state"
                  value={form.state}
                  onChange={(e) => set("state", toAlpha(e.target.value))}
                  maxLength={60}
                />
              </Field>

            </div>
          </Section>

          {/*  STEP 2 — PRODUCT DETAILS  */}
          <Section step={2} title="Product Details" subtitle="Tell us about the product">
            <div className="pf-grid">

              {/* Product Name */}
              <Field label="Product Name" required error={errors.productName} hint="letters only">
                <input
                  className={`pf-input${errors.productName ? " err" : ""}`}
                  placeholder="Name of the medicine / product"
                  value={form.productName}
                  onChange={(e) => set("productName", toAlpha(e.target.value))}
                  maxLength={100}
                />
              </Field>

              {/* Product Code */}
              <Field label="Product Code / SKU" error={errors.productCode} hint="optional, letters & numbers">
                <input
                  className={`pf-input${errors.productCode ? " err" : ""}`}
                  placeholder="e.g. PRD-1023"
                  value={form.productCode}
                  onChange={(e) => set("productCode", toAlphaNum(e.target.value))}
                  maxLength={30}
                />
              </Field>

              {/* Batch No */}
              <Field label="Batch Number" error={errors.batchNumber} hint="optional, letters & numbers">
                <input
                  className={`pf-input${errors.batchNumber ? " err" : ""}`}
                  placeholder="e.g. B20240501"
                  value={form.batchNumber}
                  onChange={(e) => set("batchNumber", toAlphaNum(e.target.value))}
                  maxLength={30}
                />
              </Field>

              {/* Category */}
              <Field label="Product Category" required error={errors.category}>
                <select
                  className={`pf-select${errors.category ? " err" : ""}`}
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  <option value="">-- Select Category --</option>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>

              {form.category === "Other" && (
                <Field label="Specify Category" required error={errors.categoryOther}>
                  <input
                    className={`pf-input${errors.categoryOther ? " err" : ""}`}
                    placeholder="Type the category (letters only)"
                    value={form.categoryOther}
                    onChange={(e) => set("categoryOther", toAlpha(e.target.value))}
                    maxLength={60}
                  />
                </Field>
              )}

              {/* Product Source */}
              <Field label="How Did You Obtain the Product?" required error={errors.productSource}>
                <select
                  className={`pf-select${errors.productSource ? " err" : ""}`}
                  value={form.productSource}
                  onChange={(e) => set("productSource", e.target.value)}
                >
                  <option value="">-- Select Source --</option>
                  {SOURCE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>

              {form.productSource === "Other" && (
                <Field label="Specify Source" required error={errors.productSourceOther}>
                  <input
                    className={`pf-input${errors.productSourceOther ? " err" : ""}`}
                    placeholder="Type the source (letters only)"
                    value={form.productSourceOther}
                    onChange={(e) => set("productSourceOther", toAlpha(e.target.value))}
                    maxLength={80}
                  />
                </Field>
              )}

              {/* How Long */}
              <Field label="How Long Have You Used This Product?" required error={errors.howLong}>
                <select
                  className={`pf-select${errors.howLong ? " err" : ""}`}
                  value={form.howLong}
                  onChange={(e) => set("howLong", e.target.value)}
                >
                  <option value="">-- Select Duration --</option>
                  {HOW_LONG.map((h) => <option key={h}>{h}</option>)}
                </select>
              </Field>

              {form.howLong === "Other" && (
                <Field label="Specify Duration" required error={errors.howLongOther}>
                  <input
                    className={`pf-input${errors.howLongOther ? " err" : ""}`}
                    placeholder="e.g. 2 years"
                    value={form.howLongOther}
                    onChange={(e) => set("howLongOther", e.target.value)}
                    maxLength={40}
                  />
                </Field>
              )}

            </div>
          </Section>

          {/* STEP 3 — FEEDBACK  */}
          <Section step={3} title="Your Feedback" subtitle="Share your experience in detail">
            <div className="pf-grid">

              {/* Feedback Type */}
              <Field label="Nature of Feedback" required error={errors.feedbackType}>
                <select
                  className={`pf-select${errors.feedbackType ? " err" : ""}`}
                  value={form.feedbackType}
                  onChange={(e) => set("feedbackType", e.target.value)}
                >
                  <option value="">-- Select Type --</option>
                  {FEEDBACK_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>

              {form.feedbackType === "Other" && (
                <Field label="Specify Nature of Feedback" required error={errors.feedbackTypeOther}>
                  <input
                    className={`pf-input${errors.feedbackTypeOther ? " err" : ""}`}
                    placeholder="Describe the nature (letters only)"
                    value={form.feedbackTypeOther}
                    onChange={(e) => set("feedbackTypeOther", toAlpha(e.target.value))}
                    maxLength={80}
                  />
                </Field>
              )}

              {/* Patient Age Group */}
              <Field label="Patient / User Age Group" required error={errors.patientAgeGroup}>
                <select
                  className={`pf-select${errors.patientAgeGroup ? " err" : ""}`}
                  value={form.patientAgeGroup}
                  onChange={(e) => set("patientAgeGroup", e.target.value)}
                >
                  <option value="">-- Select Age Group --</option>
                  {PATIENT_AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </Field>

              {form.patientAgeGroup === "Other" && (
                <Field label="Specify Age Group" required error={errors.patientAgeGroupOther}>
                  <input
                    className={`pf-input${errors.patientAgeGroupOther ? " err" : ""}`}
                    placeholder="e.g. Neonatal (0–28 days)"
                    value={form.patientAgeGroupOther}
                    onChange={(e) => set("patientAgeGroupOther", e.target.value)}
                    maxLength={40}
                  />
                </Field>
              )}

              {/* Prescription Count */}
              <Field
                label="No. of Times Prescribed / Used"
                required
                error={errors.prescriptionCount}
                hint="numbers only"
              >
                <input
                  className={`pf-input${errors.prescriptionCount ? " err" : ""}`}
                  placeholder="e.g. 5"
                  value={form.prescriptionCount}
                  onChange={(e) => set("prescriptionCount", toNumeric(e.target.value, 99999))}
                  inputMode="numeric"
                  maxLength={5}
                />
              </Field>

              {/* Overall Experience */}
              <Field label="Overall Experience" required error={errors.overallExperience}>
                <select
                  className={`pf-select${errors.overallExperience ? " err" : ""}`}
                  value={form.overallExperience}
                  onChange={(e) => set("overallExperience", e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {OVERALL_EXPERIENCE.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>

            </div>

            {/* Star Rating — full width */}
            <div style={{ marginTop: 20 }}>
              <Field label="Star Rating" required error={errors.rating}>
                <StarRating
                  value={form.rating}
                  onChange={(v) => { set("rating", v); }}
                />
                {errors.rating && (
                  <div className="pf-err" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
                    <span>⚠</span> {errors.rating}
                  </div>
                )}
              </Field>
            </div>

            {/* Detailed Feedback */}
            <div style={{ marginTop: 20 }}>
              <Field label="Detailed Feedback" required error={errors.feedbackText}>
                <textarea
                  className={`pf-textarea${errors.feedbackText ? " err" : ""}`}
                  placeholder="Please describe your experience with this product in detail — efficacy, side effects, quality, packaging, availability, etc."
                  value={form.feedbackText}
                  onChange={(e) => set("feedbackText", e.target.value)}
                  maxLength={1200}
                  rows={5}
                />
                <div className="pf-counter">{form.feedbackText.length} / 1200</div>
              </Field>
            </div>

            {/* Specific Issue */}
            <div style={{ marginTop: 16 }}>
              <Field label="Specific Issue or Observation" error={errors.specificIssue} hint="optional">
                <input
                  className="pf-input"
                  placeholder="e.g. tablet disintegrates slowly, unusual odour in batch"
                  value={form.specificIssue}
                  onChange={(e) => set("specificIssue", e.target.value)}
                  maxLength={200}
                />
              </Field>
            </div>

            {/* Suggestions */}
            <div style={{ marginTop: 16 }}>
              <Field label="Suggestions for Improvement" error={errors.suggestions} hint="optional">
                <textarea
                  className="pf-textarea"
                  placeholder="How can we make this product better for you?"
                  value={form.suggestions}
                  onChange={(e) => set("suggestions", e.target.value)}
                  maxLength={600}
                  rows={3}
                />
                <div className="pf-counter">{form.suggestions.length} / 600</div>
              </Field>
            </div>

            {/* Would Recommend */}
            <div style={{ marginTop: 20 }}>
              <label style={{ display: "block", marginBottom: 10, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                Would You Recommend This Product? <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className="pf-rec-group">
                {WOULD_RECOMMEND.map((opt) => {
                  const cls =
                    opt === "Definitely Yes" ? "sel-green" :
                    opt === "Probably Yes"   ? "sel-green" :
                    opt === "Not Sure"       ? "sel-yellow" :
                    opt === "Probably No"    ? "sel-orange" :
                                              "sel-red";
                  const emoji =
                    opt === "Definitely Yes" ? "👍" :
                    opt === "Probably Yes"   ? "🙂" :
                    opt === "Not Sure"       ? "🤔" :
                    opt === "Probably No"    ? "😕" : "👎";
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`pf-rec-btn${form.wouldRecommend === opt ? ` ${cls}` : ""}`}
                      onClick={() => set("wouldRecommend", opt)}
                    >
                      {emoji} {opt}
                    </button>
                  );
                })}
              </div>
              {errors.wouldRecommend && (
                <div className="pf-err" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
                  <span>⚠</span> {errors.wouldRecommend}
                </div>
              )}
            </div>
          </Section>

          {/* ═══ SUBMIT ══════════════════════════════════════════════════════ */}
          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <button type="submit" className="pf-submit-btn" disabled={submitting}>
              {submitting
                ? <><span className="pf-spin" />Submitting your feedback...</>
                : "Submit Feedback →"}
            </button>
            <p className="pf-req-note">
              Fields marked <span style={{ color: "#ef4444" }}>*</span> are required &nbsp;·&nbsp;
              No account needed &nbsp;·&nbsp; Your data is kept confidential
            </p>
          </div>

        </form>
      </div>

      {/* TOAST */}
      {toast && <div className={`pf-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}