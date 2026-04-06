import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
];

const QUALIFICATIONS = [
  "10th Pass","12th Pass","Diploma","ITI","B.Sc","B.Com","B.A","B.Tech / B.E",
  "BBA","BCA","M.Sc","M.Com","M.A","M.Tech","MBA","MCA","Ph.D","Other",
];

const SERVICE_ARMS = ["Army","Navy","Air Force"];

const ARMY_RANKS = [
  "Sepoy","Lance Naik","Naik","Havildar","Naib Subedar","Subedar","Subedar Major",
  "2nd Lieutenant","Lieutenant","Captain","Major","Lieutenant Colonel","Colonel",
  "Brigadier","Major General","Lieutenant General","General","Field Marshal",
];
const NAVY_RANKS = [
  "Seaman","Leading Seaman","Petty Officer","Chief Petty Officer","Master Chief Petty Officer",
  "Sub Lieutenant","Lieutenant","Lieutenant Commander","Commander","Captain",
  "Commodore","Rear Admiral","Vice Admiral","Admiral","Admiral of the Fleet",
];
const AF_RANKS = [
  "Aircraftman","Leading Aircraftman","Corporal","Sergeant","Warrant Officer",
  "Master Warrant Officer","Flying Officer","Flight Lieutenant","Squadron Leader",
  "Wing Commander","Group Captain","Air Commodore","Air Vice Marshal","Air Marshal",
  "Air Chief Marshal","Marshal of the Air Force",
];

const DISCHARGE_TYPES = [
  "Honourable Discharge","Medical Discharge","VRS (Voluntary Retirement)",
  "Compulsory Retirement","Superannuation","Premature Retirement","Other",
];

const YEARS_SERVICE = [
  "Less than 1 year","1–3 years","3–5 years","5–10 years",
  "10–15 years","15–20 years","20–25 years","25+ years",
];

const CIVILIAN_EXPERIENCE = [
  "No civilian experience","Less than 1 year","1–2 years",
  "2–5 years","5–10 years","10+ years",
];

const NOTICE_OPTIONS = ["Immediate","15 days","1 month","2 months","3 months"];

const INITIAL = {
  // Personal
  fullName:"", email:"", phone:"", dateOfBirth:"", gender:"",
  // Address
  address:"", city:"", state:"", pinCode:"",
  // Military
  serviceArm:"", rank:"", serviceNumber:"", yearsOfService:"",
  dischargeType:"", serviceRecord:"", medals:"",
  // Civilian
  civilianQualification:"", fieldOfStudy:"", civilianExperience:"",
  currentJobTitle:"", skills:"", expectedSalary:"",
  noticePeriod:"", preferredLocation:"", linkedIn:"",
  // Application
  applyingFor:"", jobType:"", coverLetter:"",
};

const STEPS = [
  { num:"01", label:"Personal Info" },
  { num:"02", label:"Military Service" },
  { num:"03", label:"Civilian Details" },
  { num:"04", label:"Application" },
];

// roles that ex-servicemen can apply for at BioBurg
const EX_SERVICE_ROLES = [
  "Security Manager","Security Supervisor","Security Guard","Operations Manager",
  "Logistics Manager","Warehouse Supervisor","Fleet Manager","Driver (HMV/LMV)",
  "Safety Officer","Compliance Officer","Admin Executive","Facility Manager",
  "IT Support","Cyber Security Analyst","Procurement Officer","Quality Inspector",
  "Medical Officer","Nursing Staff","Paramedic","Lab Technician",
  "HR Executive","Training & Development Officer","Customer Support Executive",
  "Sales Executive","Business Development Manager","Other",
];

const JOB_TYPE_OPTIONS = [
  "Full-Time","Part-Time","Internship","Contract","Consultant","Freelance",
];

function useWindowWidth() {
  const [w, setW] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  React.useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

export default function ExServiceRegisterForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [resume, setResume] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const w = useWindowWidth();
  const isMobile = w < 640;

  const rankOptions = form.serviceArm === "Army" ? ARMY_RANKS
    : form.serviceArm === "Navy" ? NAVY_RANKS
    : form.serviceArm === "Air Force" ? AF_RANKS : [];

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.fullName.trim())  e.fullName  = "Full name is required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
      if (!form.phone.trim() || !/^\d{10}$/.test(form.phone))     e.phone = "10-digit phone required";
      if (!form.dateOfBirth) e.dateOfBirth = "Date of birth required";
      if (!form.gender)      e.gender      = "Please select gender";
    }
    if (step === 1) {
      if (!form.serviceArm)    e.serviceArm    = "Select your service arm";
      if (!form.rank)          e.rank          = "Select your rank";
      if (!form.yearsOfService) e.yearsOfService = "Select years of service";
      if (!form.dischargeType) e.dischargeType = "Select discharge type";
    }
    if (step === 2) {
      if (!form.applyingFor) e.applyingFor = "Please select a role";
      if (!form.jobType)     e.jobType     = "Please select job type";
      if (!form.skills.trim()) e.skills    = "Please enter at least one skill";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, 3)); };
  const back = () => { setErrors({}); setStep((s) => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (resume) fd.append("resume", resume);
      await axios.post(`${BASE_API}/api/exservice-jobs/apply`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (submitted) return (
    <div style={s.page}><Fonts />
      <div style={{ ...s.card, textAlign: "center", padding: isMobile ? "40px 20px" : "60px 48px" }}>
        <div style={s.successRibbon}/>
        <div style={s.successBadge}>🎖️ Application Submitted</div>
        <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: "#0f172a", margin: "20px 0 12px" }}>
          Jai Hind, {form.fullName}!
        </h2>
        <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, maxWidth: 440, margin: "0 auto 28px" }}>
          Your application for <strong>{form.applyingFor}</strong> has been received.
          We honour your service and will review your profile — you'll hear from us at <strong>{form.email}</strong>.
        </p>
        <div style={s.successMeta}>
          {[["Service Arm", form.serviceArm], ["Rank", form.rank], ["Applied For", form.applyingFor], ["Email", form.email]].map(([l, v]) => v ? (
            <div key={l} style={s.successRow}>
              <span style={s.successKey}>{l}</span>
              <span style={s.successVal}>{v}</span>
            </div>
          ) : null)}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
          <button onClick={() => navigate("/exservice/jobs")} style={s.btnPrimary}>View All Openings</button>
          <button onClick={() => navigate("/")} style={s.btnGhost}>Return Home</button>
        </div>
      </div>
    </div>
  );

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div style={s.page}><Fonts />

      {/* Hero Header */}
      <div style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#0f3460 60%,#0077a3 100%)", padding: isMobile ? "32px 20px 28px" : "40px 48px 36px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%,rgba(0,119,163,0.25) 0%,transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 860, margin: "0 auto" }}>
          <button onClick={() => navigate("/signup")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 12 }}>← Back</button>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Honour · Service · Excellence</p>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 30, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
            Ex-Servicemen Careers Portal
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>BioBurg Pharma — Proud to hire India's veterans</p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "20px 16px 60px" : "32px 48px 80px" }}>

        {/* Step Tracker */}
        <div style={{ background: "#fff", borderRadius: 12, padding: isMobile ? "16px" : "20px 28px", marginBottom: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "space-between", flexWrap: "wrap", gap: 8 }}>
            {STEPS.map((st, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, flexShrink: 0, transition: "all 0.3s",
                    background: step > i ? "#0077a3" : step === i ? "#0077a3" : "#f1f5f9",
                    color: step >= i ? "#fff" : "#94a3b8",
                    boxShadow: step === i ? "0 0 0 4px rgba(0,119,163,0.15)" : "none",
                  }}>
                    {step > i ? "✓" : i + 1}
                  </div>
                  {!isMobile && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{st.num}</p>
                      <p style={{ fontSize: 13, fontWeight: step === i ? 700 : 500, color: step === i ? "#0077a3" : step > i ? "#374151" : "#94a3b8", margin: 0 }}>{st.label}</p>
                    </div>
                  )}
                </div>
                {i < 3 && <div style={{ width: isMobile ? 20 : 40, height: 2, background: step > i ? "#0077a3" : "#e2e8f0", margin: "0 8px", transition: "background 0.3s", borderRadius: 2 }} />}
              </div>
            ))}
          </div>
          {isMobile && (
            <p style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "#0077a3", marginTop: 10 }}>
              Step {step + 1} of 4 — {STEPS[step].label}
            </p>
          )}
        </div>

        {/* Form Card */}
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 20px rgba(0,0,0,0.07)", overflow: "hidden", border: "1px solid #e2e8f0" }}>

          {/* Card header */}
          <div style={{ padding: isMobile ? "16px 20px" : "18px 32px", borderBottom: "1px solid #eef1f5", background: "#fbfcfd", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#0077a3", background: "#e4f2f8", padding: "3px 10px", borderRadius: 20, letterSpacing: "0.08em" }}>{STEPS[step].num}</span>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0 }}>{STEPS[step].label}</h3>
            </div>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{step + 1} / 4</span>
          </div>

          <div style={{ padding: isMobile ? "20px" : "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── STEP 0: Personal Info ─────────────────────────── */}
            {step === 0 && <>
              <Grid2 m={isMobile}>
                <Field label="Full Name" name="fullName" value={form.fullName} set={set} errors={errors} placeholder="As per service record" required />
                <Field label="Email Address" name="email" type="email" value={form.email} set={set} errors={errors} placeholder="your@email.com" required />
              </Grid2>
              <Grid2 m={isMobile}>
                <Field label="Mobile Number" name="phone" value={form.phone} set={set} errors={errors} placeholder="10-digit number" required />
                <Field label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} set={set} errors={errors} required />
              </Grid2>
              <Grid1>
                <Select label="Gender" name="gender" value={form.gender} set={set} errors={errors} opts={["Male","Female","Other","Prefer not to say"]} required />
              </Grid1>
              <Grid1>
                <Field label="Full Address" name="address" value={form.address} set={set} errors={errors} placeholder="House / Flat, Street, Area" textarea />
              </Grid1>
              <Grid3 m={isMobile}>
                <Field label="City" name="city" value={form.city} set={set} errors={errors} placeholder="City" />
                <Select label="State" name="state" value={form.state} set={set} errors={errors} opts={INDIAN_STATES} />
                <Field label="PIN Code" name="pinCode" value={form.pinCode} set={set} errors={errors} placeholder="6-digit PIN" />
              </Grid3>
            </>}

            {/* ── STEP 1: Military Service ──────────────────────── */}
            {step === 1 && <>
              <div style={s.highlightBox}>
                <p style={{ fontSize: 13, color: "#0f3460", fontWeight: 500, margin: 0 }}>
                  🎖️ Your military service is your greatest asset. Please fill in your service details accurately.
                </p>
              </div>
              <Grid2 m={isMobile}>
                <Select label="Service Arm" name="serviceArm" value={form.serviceArm} set={set} errors={errors} opts={SERVICE_ARMS} required />
                <Select label="Rank" name="rank" value={form.rank} set={set} errors={errors} opts={rankOptions.length ? rankOptions : ["—Please select Service Arm first—"]} required disabled={!form.serviceArm} />
              </Grid2>
              <Grid2 m={isMobile}>
                <Field label="Service Number" name="serviceNumber" value={form.serviceNumber} set={set} errors={errors} placeholder="Your official service number" />
                <Select label="Years of Service" name="yearsOfService" value={form.yearsOfService} set={set} errors={errors} opts={YEARS_SERVICE} required />
              </Grid2>
              <Grid2 m={isMobile}>
                <Select label="Discharge Type" name="dischargeType" value={form.dischargeType} set={set} errors={errors} opts={DISCHARGE_TYPES} required />
                <Field label="Medals / Awards" name="medals" value={form.medals} set={set} errors={errors} placeholder="e.g. Sena Medal, Vishisht Seva Medal" />
              </Grid2>
              <Grid1>
                <Field label="Service Record Summary" name="serviceRecord" value={form.serviceRecord} set={set} errors={errors} placeholder="Briefly describe your postings, key duties, and accomplishments during service..." textarea rows={4} hint="This helps recruiters understand your background quickly." />
              </Grid1>
            </>}

            {/* ── STEP 2: Civilian Details ──────────────────────── */}
            {step === 2 && <>
              <Grid2 m={isMobile}>
                <Select label="Civilian Qualification" name="civilianQualification" value={form.civilianQualification} set={set} errors={errors} opts={QUALIFICATIONS} />
                <Field label="Field of Study" name="fieldOfStudy" value={form.fieldOfStudy} set={set} errors={errors} placeholder="e.g. Engineering, Management" />
              </Grid2>
              <Grid2 m={isMobile}>
                <Select label="Civilian Work Experience" name="civilianExperience" value={form.civilianExperience} set={set} errors={errors} opts={CIVILIAN_EXPERIENCE} />
                <Field label="Current / Last Civilian Job Title" name="currentJobTitle" value={form.currentJobTitle} set={set} errors={errors} placeholder="e.g. Security Consultant" />
              </Grid2>
              <Grid2 m={isMobile}>
                <Select label="Applying For" name="applyingFor" value={form.applyingFor} set={set} errors={errors} opts={EX_SERVICE_ROLES} required />
                <Select label="Job Type" name="jobType" value={form.jobType} set={set} errors={errors} opts={JOB_TYPE_OPTIONS} required hint="Select the type of employment you're seeking" />
              </Grid2>
              <Grid2 m={isMobile}>
                <Field label="Preferred Location" name="preferredLocation" value={form.preferredLocation} set={set} errors={errors} placeholder="e.g. Jaipur, Pune, Remote" />
                <Field label="Expected Salary" name="expectedSalary" value={form.expectedSalary} set={set} errors={errors} placeholder="e.g. ₹5–8 LPA" />
              </Grid2>
              <Grid2 m={isMobile}>
                <Select label="Notice Period" name="noticePeriod" value={form.noticePeriod} set={set} errors={errors} opts={NOTICE_OPTIONS} />
                <Field label="LinkedIn Profile URL" name="linkedIn" value={form.linkedIn} set={set} errors={errors} placeholder="linkedin.com/in/yourname" />
              </Grid2>
              <Grid2 m={isMobile}>
                <Field label="Key Skills / Specialisations" name="skills" value={form.skills} set={set} errors={errors} placeholder="e.g. Leadership, Logistics, Cyber Security" required />
              </Grid2>
            </>}

            {/* ── STEP 3: Application ───────────────────────────── */}
            {step === 3 && <>
              {/* Summary card */}
              <div style={s.summaryBox}>
                <p style={s.summaryTitle}>Application Summary</p>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                  {[["Name", form.fullName],["Service Arm", form.serviceArm],["Rank", form.rank],["Years of Service", form.yearsOfService],["Discharge Type", form.dischargeType],["Applying For", form.applyingFor],["Job Type", form.jobType]].map(([l, v]) => v ? (
                    <div key={l} style={{ background: "#fff", borderRadius: 8, padding: "8px 12px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{l}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "3px 0 0" }}>{v}</p>
                    </div>
                  ) : null)}
                </div>
              </div>

              <Grid1>
                <Field label="Cover Letter" name="coverLetter" value={form.coverLetter} set={set} errors={errors}
                  placeholder="Describe how your military experience uniquely qualifies you for this role. Mention key postings, leadership achievements, and what drives you to join BioBurg..."
                  textarea rows={7} hint="Tell us about your service highlights and how they apply to this civilian role." />
              </Grid1>

              <Grid1>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Resume / CV</label>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>PDF, DOC, DOCX — Maximum 5 MB</p>
                  <label style={{ cursor: "pointer" }}>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => setResume(e.target.files[0])} style={{ display: "none" }} />
                    <div style={{ border: `1.5px dashed ${resume ? "#0077a3" : "#cdd5de"}`, borderRadius: 10, padding: "26px 20px", textAlign: "center", background: resume ? "#f0f9ff" : "#fafbfc", transition: "all 0.2s" }}>
                      {resume
                        ? <><p style={{ fontSize: 14, fontWeight: 600, color: "#0077a3", margin: "0 0 4px" }}>{resume.name}</p><p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Click to replace</p></>
                        : <><p style={{ fontSize: 14, fontWeight: 500, color: "#374151", margin: "0 0 4px" }}>Click to upload your resume</p><p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>PDF, DOC, DOCX — Max 5 MB</p></>
                      }
                    </div>
                  </label>
                </div>
              </Grid1>

              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.75, paddingLeft: 12, borderLeft: "3px solid #e2e8f0" }}>
                By submitting, I confirm all information is accurate and consent to BioBurg Pharma storing my data for recruitment purposes.
              </div>
            </>}

          </div>

          {/* Nav buttons */}
          <div style={{ padding: isMobile ? "16px 20px" : "18px 32px", borderTop: "1px solid #eef1f5", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fbfcfd", gap: 12, flexWrap: "wrap" }}>
            <div>
              {step > 0
                ? <button onClick={back} style={s.btnBack}>← Back</button>
                : <button onClick={() => navigate("/signup")} style={s.btnBack}>Cancel</button>
              }
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{step + 1} / 4</span>
              {step < 3
                ? <button onClick={next} style={s.btnPrimary}>Continue →</button>
                : <button onClick={handleSubmit} disabled={loading} style={{ ...s.btnPrimary, minWidth: isMobile ? "auto" : 190, opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Submitting..." : "Submit Application"}
                  </button>
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
    input, select, textarea, button { font-family: 'DM Sans', sans-serif; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #0077a3 !important; box-shadow: 0 0 0 3px rgba(0,119,163,0.1) !important; }
    input::placeholder, textarea::placeholder { color: #b8c5cf; font-size: 13px; }
    select option:disabled { color: #94a3b8; }
  `}</style>
);

const Grid1 = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>{children}</div>;
const Grid2 = ({ children, m }) => <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 20 }}>{children}</div>;
const Grid3 = ({ children, m }) => <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>{children}</div>;

function Field({ label, name, value, set, errors, placeholder, type = "text", required, textarea, rows = 3, hint, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {hint && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: -2 }}>{hint}</p>}
      {textarea
        ? <textarea name={name} value={value} onChange={set(name)} placeholder={placeholder} rows={rows}
            style={{ ...fi, resize: "vertical", ...(errors?.[name] ? fiErr : {}) }} disabled={disabled} />
        : <input type={type} name={name} value={value} onChange={set(name)} placeholder={placeholder}
            style={{ ...fi, ...(errors?.[name] ? fiErr : {}) }} disabled={disabled} />
      }
      {errors?.[name] && <span style={{ fontSize: 12, color: "#ef4444" }}>{errors[name]}</span>}
    </div>
  );
}

function Select({ label, name, value, set, errors, opts, required, disabled, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {hint && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: -2 }}>{hint}</p>}
      <select name={name} value={value} onChange={set(name)} disabled={disabled}
        style={{ ...fi, ...(errors?.[name] ? fiErr : {}), cursor: disabled ? "not-allowed" : "pointer", color: value ? "#1e293b" : "#94a3b8" }}>
        <option value="">— Select —</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors?.[name] && <span style={{ fontSize: 12, color: "#ef4444" }}>{errors[name]}</span>}
    </div>
  );
}

const fi = { width: "100%", padding: "11px 15px", border: "1px solid #dde3ea", borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff", transition: "all 0.2s", appearance: "none", fontFamily: "inherit" };
const fiErr = { borderColor: "#ef4444" };

const s = {
  page: { minHeight: "100vh", backgroundColor: "#f1f4f8", fontFamily: "'DM Sans','Inter',sans-serif" },
  card: { maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.1)", animation: "fadeUp 0.5s ease both" },
  successRibbon: { height: 5, background: "linear-gradient(90deg,#1a1a2e,#0f3460,#0077a3)", borderRadius: "12px 12px 0 0", margin: "-1px -1px 0" },
  successBadge: { display: "inline-block", padding: "6px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, fontSize: 14, fontWeight: 600, color: "#15803d", margin: "20px 0 0" },
  successMeta: { background: "#f8fafc", borderRadius: 10, padding: "16px 20px", borderLeft: "3px solid #0077a3", textAlign: "left", margin: "0 auto", maxWidth: 380 },
  successRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f1f5f9" },
  successKey: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" },
  successVal: { fontSize: 13, fontWeight: 500, color: "#1e293b" },
  highlightBox: { background: "linear-gradient(135deg,#eff8ff,#f0f9ff)", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 16px" },
  summaryBox: { background: "#f8fafc", borderRadius: 10, padding: "16px 18px", border: "1px solid #e2e8f0" },
  summaryTitle: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 },
  btnPrimary: { background: "#0077a3", color: "#fff", border: "none", borderRadius: 8, padding: "11px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnGhost: { background: "#f1f5f9", color: "#374151", border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnBack: { background: "none", border: "1px solid #dde3ea", borderRadius: 8, padding: "9px 20px", fontSize: 14, fontWeight: 600, color: "#64748b", cursor: "pointer" },
};