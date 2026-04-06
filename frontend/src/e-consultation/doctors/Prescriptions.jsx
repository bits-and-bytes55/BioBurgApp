import React, { useEffect, useState } from "react";
import { DOCTOR_API_BASE_URL } from "./doctorApi";
import api from "./doctorApi";

const card = {
  background: "#ffffff",
  borderRadius: 16,
  padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  border: "1px solid #e2e8f0",
  marginBottom: 20,
};

const inputStyle = {
  width: "100%",
  border: "1.5px solid #e2e8f0",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  color: "#0f172a",
  background: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s, background 0.15s",
};

const Input = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
    <input
      {...props}
      style={inputStyle}
      onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
    />
  </div>
);

const emptyForm = {
  patientName: "", patientAge: "", patientGender: "",
  diagnosis: "", notes: "",
  medicines: [{ name: "", dosage: "", duration: "" }],
};

const Prescriptions = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("create");

  useEffect(() => { fetchPrescriptions(); }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get("/doctor/prescriptions");
      setList(res.data.data || []);
    } catch {
      setList([
        { _id: "demo1", patientName: "Aanya Sharma", patientAge: 28, diagnosis: "Viral Fever", createdAt: new Date().toISOString(), medicines: [{ name: "Paracetamol", dosage: "500mg", duration: "5 days" }] },
        { _id: "demo2", patientName: "Rahul Mehta", patientAge: 42, diagnosis: "Hypertension", createdAt: new Date(Date.now() - 86400000).toISOString(), medicines: [{ name: "Amlodipine", dosage: "5mg", duration: "Ongoing" }] },
      ]);
    }
  };

  const handleMed = (i, field, value) => {
    const meds = [...form.medicines];
    meds[i][field] = value;
    setForm({ ...form, medicines: meds });
  };

  const addMed = () => setForm({ ...form, medicines: [...form.medicines, { name: "", dosage: "", duration: "" }] });
  const removeMed = (i) => { if (form.medicines.length === 1) return; setForm({ ...form, medicines: form.medicines.filter((_, idx) => idx !== i) }); };

  const save = async () => {
    if (!form.patientName || !form.diagnosis) { alert("Patient name and diagnosis are required"); return; }
    setSaving(true);
    try {
      await api.post("/doctor/prescriptions", form);
      setForm(emptyForm);
      fetchPrescriptions();
      setTab("history");
    } catch { alert("Failed to save prescription"); }
    finally { setSaving(false); }
  };

  const downloadPDF = (id) => {
    const token = localStorage.getItem("doctorToken");
    window.open(`${DOCTOR_API_BASE_URL}/prescriptions/${id}/pdf?token=${token}`, "_blank");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#0f172a", fontSize: 24, fontWeight: 700, margin: 0 }}>Prescriptions</h1>
        <p style={{ color: "#64748b", fontSize: 13.5, margin: "4px 0 0" }}>Create and manage patient prescriptions</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f1f5f9", padding: 4, borderRadius: 12, width: "fit-content" }}>
        {["create", "history"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "9px 24px",
              borderRadius: 9,
              border: "none",
              background: tab === t ? "#fff" : "transparent",
              color: tab === t ? "#0f172a" : "#64748b",
              fontWeight: 600,
              fontSize: 13.5,
              cursor: "pointer",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
              textTransform: "capitalize",
            }}
          >
            {t === "create" ? "New Prescription" : `History (${list.length})`}
          </button>
        ))}
      </div>

      {tab === "create" && (
        <div>
          {/* Patient Info */}
          <div style={card}>
            <h3 style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, background: "#3b82f6", borderRadius: "50%", display: "inline-block" }} />
              Patient Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
              <Input label="Patient Name" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Full name" />
              <Input label="Age" type="number" value={form.patientAge} onChange={(e) => setForm({ ...form, patientAge: e.target.value })} placeholder="Years" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Gender</label>
                <select
                  value={form.patientGender}
                  onChange={(e) => setForm({ ...form, patientGender: e.target.value })}
                  style={{ ...inputStyle }}
                  onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Input label="Diagnosis / Condition" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Primary diagnosis" />
            </div>
          </div>

          {/* Medicines */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, background: "#8b5cf6", borderRadius: "50%", display: "inline-block" }} />
                Medicines
              </h3>
              <button
                onClick={addMed}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#3b82f6", fontWeight: 600, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Medicine
              </button>
            </div>

            {/* Column Headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 36px", gap: 10, marginBottom: 8 }}>
              {["Medicine Name", "Dosage", "Duration", ""].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</span>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {form.medicines.map((m, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 36px", gap: 10, alignItems: "center" }}>
                  <input
                    value={m.name}
                    onChange={(e) => handleMed(i, "name", e.target.value)}
                    placeholder="e.g. Paracetamol"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                  />
                  <input
                    value={m.dosage}
                    onChange={(e) => handleMed(i, "dosage", e.target.value)}
                    placeholder="e.g. 500mg"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                  />
                  <input
                    value={m.duration}
                    onChange={(e) => handleMed(i, "duration", e.target.value)}
                    placeholder="e.g. 5 days"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                  />
                  <button
                    onClick={() => removeMed(i)}
                    disabled={form.medicines.length === 1}
                    style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: form.medicines.length === 1 ? "#f1f5f9" : "#fee2e2", color: form.medicines.length === 1 ? "#cbd5e1" : "#dc2626", cursor: form.medicines.length === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={card}>
            <h3 style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Additional Notes</h3>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Dietary restrictions, lifestyle advice, follow-up instructions..."
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
              onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ padding: "12px 32px", borderRadius: 12, border: "none", background: saving ? "#93c5fd" : "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "default" : "pointer", boxShadow: saving ? "none" : "0 4px 14px rgba(59,130,246,0.35)", display: "flex", alignItems: "center", gap: 8 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              {saving ? "Saving..." : "Save Prescription"}
            </button>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div>
          {list.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <p style={{ color: "#64748b", fontSize: 15, fontWeight: 500 }}>No prescriptions yet. Create your first one!</p>
              <button onClick={() => setTab("create")} style={{ marginTop: 12, padding: "10px 24px", borderRadius: 10, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                Create Prescription
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {list.map((p) => (
                <div key={p._id} style={{ ...card, marginBottom: 0, display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, margin: 0 }}>{p.patientName}
                      {p.patientAge && <span style={{ fontSize: 12, fontWeight: 400, color: "#64748b", marginLeft: 8 }}>{p.patientAge} yrs • {p.patientGender}</span>}
                    </p>
                    <p style={{ color: "#475569", fontSize: 13.5, margin: "4px 0 8px" }}>{p.diagnosis}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {p.medicines?.map((m, i) => (
                        <span key={i} style={{ padding: "3px 10px", borderRadius: 6, background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 600, border: "1px solid #bbf7d0" }}>
                          {m.name} {m.dosage}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 10px" }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                    </p>
                    <button
                      onClick={() => downloadPDF(p._id)}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
