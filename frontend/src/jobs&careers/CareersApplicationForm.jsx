import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  fullName: "", email: "", phone: "", dateOfBirth: "", gender: "",
  address: "", city: "", state: "", pinCode: "",
  qualification: "", fieldOfStudy: "", workExperience: "", currentJobTitle: "",
  applyingFor: "", jobType: "", skills: "", preferredLocation: "",
  expectedSalary: "", noticePeriod: "", linkedIn: "", coverLetter: "", resume: null,
};

const JOB_ROLES = [
  "Sales Executive","Marketing Manager","Pharma Representative","Medical Representative",
  "Delivery Executive","Customer Support","Account Manager","Operations Manager",
  "Warehouse Executive","HR Executive","IT Support","Data Analyst",
  "Business Development Executive","Quality Assurance","Other",
];

const JOB_TYPE_OPTIONS = [
  "Full-Time","Part-Time","Internship","Contract","Consultant","Freelance",
];

const STATES = [
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

const steps = ["Personal Info", "Address", "Professional Details", "Review & Submit"];

export default function JobsAndCareersRegister() {
  const navigate = useNavigate();
  const [step, setStep]           = useState(0);
  const [form, setForm]           = useState(initialState);
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.fullName.trim()) e.fullName = "Full name is required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required";
      if (!form.phone.trim() || !/^\d{10}$/.test(form.phone)) e.phone = "Valid 10-digit phone number is required";
      if (!form.dateOfBirth) e.dateOfBirth = "Date of birth is required";
      if (!form.gender) e.gender = "Please select gender";
    }
    if (step === 1) {
      if (!form.address.trim()) e.address = "Address is required";
      if (!form.city.trim()) e.city = "City is required";
      if (!form.state) e.state = "Please select state";
      if (!form.pinCode.trim() || !/^\d{6}$/.test(form.pinCode)) e.pinCode = "Valid 6-digit PIN code is required";
    }
    if (step === 2) {
      if (!form.qualification) e.qualification = "Please select qualification";
      if (!form.applyingFor) e.applyingFor = "Please select a job role";
      if (!form.jobType)     e.jobType     = "Please select job type";
      if (!form.skills.trim()) e.skills = "Please enter at least one skill";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== "") data.append(k, v);
      });
      await axios.post(`${BASE_API}/api/jobs-careers/register`, data, {
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

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: "center", padding: "60px 40px" }}>
          <div style={styles.successBadge}>Application Submitted</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: "24px 0 12px" }}>
            Thank you, {form.fullName}!
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6, maxWidth: 420, margin: "0 auto 32px" }}>
            Your <strong>{form.jobType}</strong> application for <strong>{form.applyingFor}</strong> has been received.
            Our team will review your profile and get in touch at{" "}
            <strong>{form.email}</strong>.
          </p>
          <button onClick={() => navigate("/signup")} style={styles.btnPrimary}>
            Back to Registration Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <p style={styles.headerSub}>Bioburg Pharma · Careers Portal</p>
          <h1 style={styles.headerTitle}>Jobs & Careers Registration</h1>
          <p style={styles.headerDesc}>Fill in the details below to apply. All fields marked * are mandatory.</p>
        </div>

        {/* Stepper */}
        <div style={styles.stepperWrap}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div style={styles.stepItem}>
                <div style={{
                  ...styles.stepCircle,
                  ...(i < step ? styles.stepDone : {}),
                  ...(i === step ? styles.stepActive : {}),
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{
                  ...styles.stepLabel,
                  color: i === step ? "#0077a3" : i < step ? "#10b981" : "#94a3b8",
                  fontWeight: i === step ? 600 : 400,
                }}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ ...styles.stepLine, backgroundColor: i < step ? "#10b981" : "#e2e8f0" }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 0: Personal Info */}
        {step === 0 && (
          <div>
            <h2 style={styles.sectionTitle}>Personal Information</h2>
            <div style={styles.grid2}>
              <Field label="Full Name" name="fullName" required placeholder="e.g. Rahul Sharma" form={form} errors={errors} update={update} />
              <Field label="Email Address" name="email" type="email" required placeholder="e.g. rahul@email.com" form={form} errors={errors} update={update} />
              <Field label="Phone Number" name="phone" type="tel" required placeholder="10-digit mobile number" form={form} errors={errors} update={update} />
              <Field label="Date of Birth" name="dateOfBirth" type="date" required form={form} errors={errors} update={update} />
            </div>
            <div style={styles.grid3}>
              <Field label="Gender" name="gender" required options={["Male","Female","Other","Prefer not to say"]} form={form} errors={errors} update={update} />
            </div>
          </div>
        )}

        {/*STEP 1: Address*/}
        {step === 1 && (
          <div>
            <h2 style={styles.sectionTitle}>Address Details</h2>
            <div style={styles.grid1}>
              <Field label="Full Address" name="address" required placeholder="House No., Street, Area" textarea form={form} errors={errors} update={update} />
            </div>
            <div style={styles.grid3}>
              <Field label="City" name="city" required placeholder="e.g. Udaipur" form={form} errors={errors} update={update} />
              <Field label="State" name="state" required options={STATES} form={form} errors={errors} update={update} />
              <Field label="PIN Code" name="pinCode" required placeholder="6-digit PIN" form={form} errors={errors} update={update} />
            </div>
          </div>
        )}

        {/*STEP 2: Professional*/}
        {step === 2 && (
          <div>
            <h2 style={styles.sectionTitle}>Professional Details</h2>
            <div style={styles.grid2}>
              <Field label="Highest Qualification" name="qualification" required options={QUALIFICATIONS} form={form} errors={errors} update={update} />
              <Field label="Field of Study" name="fieldOfStudy" placeholder="e.g. Pharmacy, Commerce, Engineering" form={form} errors={errors} update={update} />
              <Field label="Total Work Experience" name="workExperience" options={["Fresher","Less than 1 year","1 - 2 years","2 - 5 years","5 - 10 years","10+ years"]} form={form} errors={errors} update={update} />
              <Field label="Current / Last Job Title" name="currentJobTitle" placeholder="e.g. Sales Executive" form={form} errors={errors} update={update} />
            </div>

            {/*Job Role + Type side by side — highlighted */}
            <div style={styles.jobTypeBox}>
              <p style={styles.jobTypeHeading}>Position Details</p>
              <div style={styles.grid2}>
                <Field label="Applying For" name="applyingFor" required options={JOB_ROLES} form={form} errors={errors} update={update} />
                <Field
                  label="Job Type"
                  name="jobType"
                  required
                  options={JOB_TYPE_OPTIONS}
                  form={form}
                  errors={errors}
                  update={update}
                  hint="Select the type of employment"
                />
              </div>
            </div>

            <div style={styles.grid2}>
              <Field label="Preferred Location" name="preferredLocation" placeholder="e.g. Jaipur, Delhi, Remote" form={form} errors={errors} update={update} />
              <Field label="Expected Salary (per month)" name="expectedSalary" placeholder="e.g. ₹25,000" form={form} errors={errors} update={update} />
              <Field label="Notice Period" name="noticePeriod" options={["Immediate","15 days","30 days","60 days","90 days"]} form={form} errors={errors} update={update} />
              <Field label="LinkedIn Profile URL" name="linkedIn" type="url" placeholder="https://linkedin.com/in/yourname" form={form} errors={errors} update={update} />
            </div>
            <div style={styles.grid1}>
              <Field label="Key Skills" name="skills" required placeholder="e.g. Communication, Sales, MS Excel, CRM" textarea form={form} errors={errors} update={update} />
              <Field label="Cover Letter / About Yourself" name="coverLetter" placeholder="Briefly tell us why you are a great fit..." textarea form={form} errors={errors} update={update} />
            </div>
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Upload Resume (PDF / DOC)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setForm((p) => ({ ...p, resume: e.target.files[0] }))}
                style={styles.fileInput}
              />
              {form.resume && (
                <span style={{ fontSize: 12, color: "#10b981", marginTop: 4, display: "block" }}>
                  ✓ Selected: {form.resume.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/*STEP 3: Review */}
        {step === 3 && (
          <div>
            <h2 style={styles.sectionTitle}>Review Your Application</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
              Please review your details before submitting. Use the Back button to make changes.
            </p>
            {[
              { heading: "Personal Information", rows: [
                ["Full Name", form.fullName], ["Email", form.email], ["Phone", form.phone],
                ["Date of Birth", form.dateOfBirth], ["Gender", form.gender],
              ]},
              { heading: "Address", rows: [
                ["Address", form.address], ["City", form.city],
                ["State", form.state], ["PIN Code", form.pinCode],
              ]},
              { heading: "Professional Details", rows: [
                ["Qualification", form.qualification], ["Field of Study", form.fieldOfStudy],
                ["Experience", form.workExperience], ["Applying For", form.applyingFor],
                ["Job Type", form.jobType],
                ["Preferred Location", form.preferredLocation], ["Expected Salary", form.expectedSalary],
                ["Notice Period", form.noticePeriod], ["Skills", form.skills],
                ["Resume", form.resume?.name || "—"],
              ]},
            ].map((section) => (
              <div key={section.heading} style={styles.reviewSection}>
                <h3 style={styles.reviewHeading}>{section.heading}</h3>
                <table style={styles.reviewTable}>
                  <tbody>
                    {section.rows.map(([k, v]) => v ? (
                      <tr key={k} style={styles.reviewRow}>
                        <td style={styles.reviewKey}>{k}</td>
                        <td style={styles.reviewVal}>
                          {/* Highlight Job Type in review */}
                          {k === "Job Type"
                            ? <span style={{ background: "#eff8fb", color: "#0077a3", padding: "2px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid #bae6fd" }}>{v}</span>
                            : v
                          }
                        </td>
                      </tr>
                    ) : null)}
                  </tbody>
                </table>
              </div>
            ))}
            <div style={styles.disclaimer}>
              By submitting this form you confirm that all information provided is accurate and
              complete. Bioburg Pharma will use this data solely for recruitment purposes.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={styles.navRow}>
          {step > 0
            ? <button onClick={back} style={styles.btnSecondary}>Back</button>
            : <button onClick={() => navigate("/signup")} style={styles.btnSecondary}>Cancel</button>
          }
          {step < steps.length - 1
            ? <button onClick={next} style={styles.btnPrimary}>Continue</button>
            : <button onClick={handleSubmit} disabled={loading} style={styles.btnPrimary}>
                {loading ? "Submitting..." : "Submit Application"}
              </button>
          }
        </div>

      </div>
    </div>
  );
}

//Field — defined OUTSIDE main component
function Field({ label, name, type = "text", required, placeholder, options, textarea, form, errors, update, hint }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>
        {label}{required && <span style={styles.req}> *</span>}
      </label>
      {hint && <p style={{ fontSize: 12, color: "#94a3b8", margin: "-2px 0 4px" }}>{hint}</p>}
      {options ? (
        <select
          value={form[name]}
          onChange={update(name)}
          style={{ ...styles.input, ...(errors[name] ? styles.inputErr : {}), color: form[name] ? "#1e293b" : "#94a3b8" }}
        >
          <option value="">— Select —</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : textarea ? (
        <textarea
          rows={4}
          value={form[name]}
          onChange={update(name)}
          placeholder={placeholder}
          style={{ ...styles.input, resize: "vertical", ...(errors[name] ? styles.inputErr : {}) }}
        />
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={update(name)}
          placeholder={placeholder}
          style={{ ...styles.input, ...(errors[name] ? styles.inputErr : {}) }}
        />
      )}
      {errors[name] && <span style={styles.errMsg}>{errors[name]}</span>}
    </div>
  );
}

// Styles
const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f1f5f9", padding: "40px 16px", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  card: { maxWidth: 860, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)", padding: "40px 48px" },
  header: { borderBottom: "1px solid #e2e8f0", paddingBottom: 24, marginBottom: 32 },
  headerSub: { fontSize: 12, fontWeight: 600, color: "#0077a3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  headerDesc: { fontSize: 14, color: "#64748b", margin: 0 },
  stepperWrap: { display: "flex", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 4 },
  stepItem: { display: "flex", alignItems: "center", gap: 8 },
  stepCircle: { width: 32, height: 32, borderRadius: "50%", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#94a3b8", backgroundColor: "#fff", flexShrink: 0 },
  stepActive: { border: "2px solid #0077a3", color: "#0077a3", backgroundColor: "#eff8fb" },
  stepDone: { border: "2px solid #10b981", color: "#10b981", backgroundColor: "#f0fdf4" },
  stepLabel: { fontSize: 13 },
  stepLine: { flex: 1, height: 2, minWidth: 20, maxWidth: 48, borderRadius: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: "#0f172a", margin: "0 0 24px", paddingBottom: 12, borderBottom: "1px solid #f1f5f9" },
  grid1: { display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 20 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 20 },
  // Job type highlight box
  jobTypeBox: { background: "linear-gradient(135deg,#f0f9ff,#eff6ff)", border: "1px solid #bae6fd", borderRadius: 10, padding: "16px 18px", marginBottom: 20 },
  jobTypeHeading: { fontSize: 12, fontWeight: 700, color: "#0077a3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 },

  fieldWrap: { display: "flex", flexDirection: "column" },
  label: { fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 },
  req: { color: "#ef4444" },
  input: { padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#1e293b", backgroundColor: "#fff", outline: "none", transition: "border-color 0.15s", width: "100%", boxSizing: "border-box" },
  inputErr: { borderColor: "#ef4444" },
  errMsg: { fontSize: 12, color: "#ef4444", marginTop: 4 },
  fileInput: { padding: "8px 0", fontSize: 14, color: "#374151", cursor: "pointer" },
  reviewSection: { marginBottom: 28, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" },
  reviewHeading: { fontSize: 13, fontWeight: 600, color: "#0077a3", backgroundColor: "#f0f9ff", padding: "10px 16px", margin: 0, borderBottom: "1px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.06em" },
  reviewTable: { width: "100%", borderCollapse: "collapse" },
  reviewRow: { borderBottom: "1px solid #f1f5f9" },
  reviewKey: { padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#64748b", width: "35%", verticalAlign: "top" },
  reviewVal: { padding: "10px 16px", fontSize: 14, color: "#1e293b", verticalAlign: "top", whiteSpace: "pre-wrap" },
  disclaimer: { backgroundColor: "#fafafa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", fontSize: 13, color: "#64748b", lineHeight: 1.6, marginTop: 16 },
  navRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 24, borderTop: "1px solid #e2e8f0" },
  btnPrimary: { padding: "12px 32px", backgroundColor: "#0077a3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnSecondary: { padding: "12px 24px", backgroundColor: "transparent", color: "#64748b", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  successBadge: { display: "inline-block", padding: "6px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#15803d", letterSpacing: "0.04em" },
};