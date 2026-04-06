// frontend/src/e-consultation/doctors/DoctorProfile.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const api = axios.create({ baseURL: `${BASE_URL}/api` });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("doctorToken");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const SPECIALIZATIONS = [
  "General Physician","Cardiologist","Neurologist","Dermatologist",
  "Pediatrician","Orthopedist","Gynecologist","ENT Specialist",
  "Psychiatrist","Ophthalmologist","Diabetologist","Oncologist",
  "Pulmonologist","Gastroenterologist","Nephrologist","Urologist",
];
const LANGUAGES = ["English","Hindi","Bengali","Tamil","Telugu","Marathi","Gujarati","Kannada","Punjabi","Malayalam"];
const MODES = ["Video Call","Chat","Phone"];

// ─── helpers ─────────────────────────────────────────────────────────────────
const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

const toBase64 = (file) =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

// ─── Field components ────────────────────────────────────────────────────────
const inp = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a",
  background: "#f8fafc", outline: "none", fontFamily: "inherit",
  boxSizing: "border-box", transition: "border-color .15s, background .15s",
};
const inpFocus = { borderColor: "#2563eb", background: "#fff" };

const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
      {label}
    </label>
    {children}
  </div>
);

const ReadValue = ({ value }) => (
  <p style={{ color: value ? "#0f172a" : "#cbd5e1", fontSize: 14, margin: 0, fontStyle: value ? "normal" : "italic" }}>
    {value || "Not set"}
  </p>
);

// ─── Photo Upload component ───────────────────────────────────────────────────
const PhotoUpload = ({ photo, doctorName, onUploaded, onDeleted }) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState(photo || "");
  const [hover, setHover] = useState(false);

  useEffect(() => { setPreview(photo || ""); }, [photo]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Image must be under 5MB");
    setUploading(true);
    try {
      const base64 = await toBase64(file);
      setPreview(base64); // instant local preview
      const res = await api.post("/doctor/profile/photo", { photo: base64 });
      setPreview(res.data.photo);
      onUploaded && onUploaded(res.data.photo);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
      setPreview(photo || "");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remove profile photo?")) return;
    setDeleting(true);
    try {
      await api.delete("/doctor/profile/photo");
      setPreview("");
      onDeleted && onDeleted();
    } catch (err) {
      alert("Delete failed");
    } finally { setDeleting(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {/* Photo circle */}
      <div
        style={{ position: "relative", cursor: "pointer" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => !uploading && fileRef.current.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt={doctorName}
            style={{
              width: 100, height: 100, borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid #e2e8f0",
              transition: "filter .2s",
              filter: hover ? "brightness(0.7)" : "none",
            }}
          />
        ) : (
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: "linear-gradient(135deg,#2563eb,#7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "#fff",
            border: "3px solid #e2e8f0",
            filter: hover ? "brightness(0.8)" : "none",
            transition: "filter .2s",
          }}>
            {initials(doctorName)}
          </div>
        )}

        {/* Overlay */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "rgba(0,0,0,.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: hover || uploading ? 1 : 0, transition: "opacity .2s",
          pointerEvents: "none",
        }}>
          {uploading ? (
            <div style={{ width: 22, height: 22, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          )}
        </div>
      </div>

      <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleFile} />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: "1.5px solid #2563eb", background: "#eff6ff", color: "#1d4ed8",
            cursor: "pointer", opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? "Uploading…" : "Change Photo"}
        </button>
        {preview && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1.5px solid #fecaca", background: "#fff", color: "#dc2626",
              cursor: "pointer", opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? "Removing…" : "Remove"}
          </button>
        )}
      </div>

      <p style={{ color: "#94a3b8", fontSize: 11, textAlign: "center", margin: 0 }}>
        JPG, PNG or WEBP · Max 5MB<br/>Stored securely on Cloudinary
      </p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DoctorProfile() {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
  const token = localStorage.getItem("doctorToken");

  if (!token) {
    setError("Unauthorized. Please login again.");
    setLoading(false);
    return;
  }

  const fetchDoctorProfile = async () => {
    try {
      const res = await api.get("/doctor/profile");
      setDoctor(res.data);
      setForm(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("doctorToken");
        window.location.href = "/login/doctor";
        return;
      }
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  fetchDoctorProfile();

}, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send text fields — photo handled separately by PhotoUpload
      const { photo, photoPublicId, ...textFields } = form;
      const res = await api.put("/doctor/profile", textFields);
      setDoctor(res.data);
      setForm(res.data);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Save failed: " + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const toggleLang = (lang) => {
    const cur = form.languages || [];
    setForm({ ...form, languages: cur.includes(lang) ? cur.filter(l => l !== lang) : [...cur, lang] });
  };
  const toggleMode = (mode) => {
    const cur = form.consultationModes || [];
    setForm({ ...form, consultationModes: cur.includes(mode) ? cur.filter(m => m !== mode) : [...cur, mode] });
  };

  const card = {
    background: "#fff", borderRadius: 14, padding: "22px 24px",
    border: "1.5px solid #e8ecf0", marginBottom: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,.04)",
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Loading profile…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 20, color: "#dc2626" }}>
      {error}
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        .prof-inp:focus { border-color: #2563eb !important; background: #fff !important; }
        @media (max-width: 640px) {
          .prof-grid-2 { grid-template-columns: 1fr !important; }
          .prof-hero { flex-direction: column !important; align-items: flex-start !important; }
          .prof-hero-right { text-align: left !important; }
        }
      `}</style>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(18px,3vw,24px)", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
            My Profile
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
            Manage your professional info — visible to patients
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d", background: "#dcfce7", padding: "5px 12px", borderRadius: 8, animation: "fadeIn .2s" }}>
              ✓ Saved
            </span>
          )}
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(doctor); }} style={{
                padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0",
                background: "#fff", color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13,
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: "9px 20px", borderRadius: 9, border: "none",
                background: saving ? "#93c5fd" : "linear-gradient(135deg,#1e3a8a,#2563eb)",
                color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13,
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} style={{
              padding: "9px 20px", borderRadius: 9,
              border: "1.5px solid #2563eb", background: "#eff6ff",
              color: "#1d4ed8", cursor: "pointer", fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Hero card */}
      <div style={{
        ...card, padding: "28px 32px",
        background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#1d4ed8 100%)",
        border: "none", marginBottom: 20, animation: "fadeIn .3s",
      }}>
        <div className="prof-hero" style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          {/* Photo */}
          <PhotoUpload
            photo={doctor?.photo}
            doctorName={doctor?.fullName}
            onUploaded={(url) => setDoctor(d => ({ ...d, photo: url }))}
            onDeleted={() => setDoctor(d => ({ ...d, photo: "" }))}
          />

          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ color: "rgba(255,255,255,.55)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>
              VERIFIED DOCTOR
            </p>
            <h2 style={{ color: "#fff", fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 800, margin: "6px 0 4px", fontFamily: "'Sora',sans-serif" }}>
              {doctor?.fullName}
            </h2>
            <p style={{ color: "#93c5fd", fontSize: 14, margin: "0 0 12px" }}>{doctor?.specialization}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                doctor?.qualification,
                doctor?.experience ? `${doctor.experience} yrs exp` : null,
                doctor?.regNumber ? `Reg: ${doctor.regNumber}` : null,
              ].filter(Boolean).map((tag, i) => (
                <span key={i} style={{
                  background: "rgba(255,255,255,.12)", color: "#e0f2fe",
                  fontSize: 11, fontWeight: 600, padding: "4px 12px",
                  borderRadius: 100, backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255,255,255,.15)",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="prof-hero-right" style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ color: "#93c5fd", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>Consultation Fee</p>
            <p style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: "4px 0", lineHeight: 1, fontFamily: "'Sora',sans-serif" }}>
              ₹{doctor?.consultationFee || 0}
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: doctor?.available ? "rgba(34,197,94,.2)" : "rgba(148,163,184,.15)",
              color: doctor?.available ? "#86efac" : "#94a3b8",
              fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: doctor?.available ? "#22c55e" : "#64748b",
                boxShadow: doctor?.available ? "0 0 0 3px rgba(34,197,94,.3)" : "none",
              }} />
              {doctor?.available ? "Online Now" : "Offline"}
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="prof-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Personal Info */}
        <div style={card}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, background: "#2563eb", borderRadius: "50%", display: "inline-block" }} />
            Personal Information
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Full Name">
              {editing
                ? <input className="prof-inp" value={form.fullName || ""} onChange={e => setForm({ ...form, fullName: e.target.value })} style={inp} />
                : <ReadValue value={doctor?.fullName} />}
            </Field>
            <Field label="Email">
              <ReadValue value={doctor?.email} />
              <p style={{ fontSize: 10, color: "#94a3b8", margin: "2px 0 0" }}>Email cannot be changed</p>
            </Field>
            <Field label="Mobile">
              {editing
                ? <input className="prof-inp" value={form.mobile || ""} onChange={e => setForm({ ...form, mobile: e.target.value })} style={inp} placeholder="+91 XXXXX XXXXX" />
                : <ReadValue value={doctor?.mobile} />}
            </Field>
            <Field label="Gender">
              {editing ? (
                <select className="prof-inp" value={form.gender || ""} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              ) : <ReadValue value={doctor?.gender} />}
            </Field>
          </div>
        </div>

        {/* Professional Info */}
        <div style={card}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, background: "#7c3aed", borderRadius: "50%", display: "inline-block" }} />
            Professional Details
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Specialization">
              {editing ? (
                <select className="prof-inp" value={form.specialization || ""} onChange={e => setForm({ ...form, specialization: e.target.value })} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Select</option>
                  {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              ) : <ReadValue value={doctor?.specialization} />}
            </Field>
            <Field label="Qualification">
              {editing
                ? <input className="prof-inp" value={form.qualification || ""} onChange={e => setForm({ ...form, qualification: e.target.value })} style={inp} placeholder="MBBS, MD…" />
                : <ReadValue value={doctor?.qualification} />}
            </Field>
            <Field label="Experience (years)">
              {editing
                ? <input className="prof-inp" type="number" min="0" value={form.experience || ""} onChange={e => setForm({ ...form, experience: e.target.value })} style={inp} />
                : <ReadValue value={doctor?.experience ? `${doctor.experience} years` : null} />}
            </Field>
            <Field label="Consultation Fee (₹)">
              {editing
                ? <input className="prof-inp" type="number" min="0" value={form.consultationFee || ""} onChange={e => setForm({ ...form, consultationFee: e.target.value })} style={inp} />
                : <ReadValue value={doctor?.consultationFee ? `₹${doctor.consultationFee}` : null} />}
            </Field>
          </div>
        </div>
      </div>

      {/* About */}
      <div style={card}>
        <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, background: "#0369a1", borderRadius: "50%", display: "inline-block" }} />
          About / Bio
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400, marginLeft: 4 }}>— shown to patients</span>
        </h3>
        {editing ? (
          <textarea
            className="prof-inp"
            rows={3}
            value={form.about || ""}
            onChange={e => setForm({ ...form, about: e.target.value })}
            placeholder="Describe your expertise, approach, and specializations…"
            style={{ ...inp, resize: "vertical" }}
          />
        ) : (
          <p style={{ color: doctor?.about ? "#475569" : "#cbd5e1", fontSize: 13.5, margin: 0, lineHeight: 1.7, fontStyle: doctor?.about ? "normal" : "italic" }}>
            {doctor?.about || "No bio added yet"}
          </p>
        )}
      </div>

      {/* Languages + Modes */}
      <div className="prof-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 14px" }}>Languages</h3>
          {editing ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {LANGUAGES.map(l => {
                const active = (form.languages || []).includes(l);
                return (
                  <button key={l} onClick={() => toggleLang(l)} style={{
                    padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    border: "1.5px solid", cursor: "pointer",
                    borderColor: active ? "#2563eb" : "#e2e8f0",
                    background: active ? "#eff6ff" : "#f8fafc",
                    color: active ? "#1d4ed8" : "#64748b",
                    transition: "all .12s",
                  }}>{l}</button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {(doctor?.languages || []).length > 0
                ? doctor.languages.map(l => (
                    <span key={l} style={{ padding: "4px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>{l}</span>
                  ))
                : <p style={{ color: "#cbd5e1", fontSize: 13, fontStyle: "italic", margin: 0 }}>Not set</p>
              }
            </div>
          )}
        </div>

        <div style={card}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 14px" }}>Consultation Modes</h3>
          {editing ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {MODES.map(m => {
                const active = (form.consultationModes || []).includes(m);
                return (
                  <button key={m} onClick={() => toggleMode(m)} style={{
                    padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    border: "1.5px solid", cursor: "pointer",
                    borderColor: active ? "#7c3aed" : "#e2e8f0",
                    background: active ? "#faf5ff" : "#f8fafc",
                    color: active ? "#7c3aed" : "#64748b",
                    transition: "all .12s",
                  }}>{m}</button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {(doctor?.consultationModes || []).length > 0
                ? doctor.consultationModes.map(m => (
                    <span key={m} style={{ padding: "4px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>{m}</span>
                  ))
                : <p style={{ color: "#cbd5e1", fontSize: 13, fontStyle: "italic", margin: 0 }}>Not set</p>
              }
            </div>
          )}
        </div>
      </div>

      {/* Additional info */}
      <div className="prof-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 14px" }}>Reg. Number</h3>
          {editing
            ? <input className="prof-inp" value={form.regNumber || ""} onChange={e => setForm({ ...form, regNumber: e.target.value })} style={inp} placeholder="MCI / State council number" />
            : <ReadValue value={doctor?.regNumber} />}
        </div>
        <div style={card}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 14px" }}>Affiliation / Hospital</h3>
          {editing
            ? <input className="prof-inp" value={form.affiliation || ""} onChange={e => setForm({ ...form, affiliation: e.target.value })} style={inp} placeholder="Hospital or clinic name" />
            : <ReadValue value={doctor?.affiliation} />}
        </div>
      </div>

      {/* Availability preview */}
      {doctor?.availability && (
        <div style={card}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 14px" }}>
            Availability Schedule
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400, marginLeft: 8 }}>— set in Availability tab</span>
          </h3>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => {
              const active = doctor.availability.days?.includes(d);
              const short = d.slice(0, 3);
              return (
                <span key={d} style={{
                  padding: "4px 11px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: active ? "#eff6ff" : "#f8fafc",
                  color: active ? "#2563eb" : "#cbd5e1",
                  border: `1.5px solid ${active ? "#bfdbfe" : "#e2e8f0"}`,
                }}>{short}</span>
              );
            })}
          </div>
          {doctor.availability.slots?.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {doctor.availability.slots.map((s, i) => (
                <span key={i} style={{ padding: "4px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                  {s.from} – {s.to}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div style={card}>
        <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 12px" }}>
          Private Notes
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400, marginLeft: 8 }}>— not visible to patients</span>
        </h3>
        {editing ? (
          <textarea
            className="prof-inp"
            rows={2}
            value={form.notes || ""}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Personal reminders, internal notes…"
            style={{ ...inp, resize: "vertical" }}
          />
        ) : (
          <p style={{ color: "#64748b", fontSize: 13, margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>
            {doctor?.notes || "No notes"}
          </p>
        )}
      </div>
    </div>
  );
}
