// frontend/src/components/ConsultationPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const SPEC_COLORS = {
  Neurologist: { bg: "#eef2ff", text: "#4338ca", border: "#c7d2fe" },
  Cardiologist: { bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
  Dermatologist: { bg: "#fefce8", text: "#a16207", border: "#fef08a" },
  Pediatrician: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  Orthopedist: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
  Gynecologist: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  "General Physician": { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
  "ENT Specialist": { bg: "#fdf4ff", text: "#a21caf", border: "#f5d0fe" },
  Psychiatrist: { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
  Ophthalmologist: { bg: "#fff8f1", text: "#b45309", border: "#fde68a" },
};
const getSpecColor = (s) =>
  SPEC_COLORS[s] || { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };

const SPECIALIZATIONS = [
  "All",
  "Neurologist",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Orthopedist",
  "Gynecologist",
  "General Physician",
  "ENT Specialist",
  "Psychiatrist",
  "Ophthalmologist",
];

/* ─── Doctor Avatar ──────────────────────────────────────────────────────── */
const DoctorAvatar = ({ doctor, size = 52 }) => {
  const [imgError, setImgError] = useState(false);
  const photoSrc = doctor.photo
    ? doctor.photo.startsWith("http")
      ? doctor.photo
      : `${BASE_URL}${doctor.photo}`
    : null;
  const hue = ((doctor.fullName || doctor.name || "").charCodeAt(0) * 37) % 360;
  const inits = (doctor.fullName || doctor.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {photoSrc && !imgError ? (
        <img
          src={photoSrc}
          alt={inits}
          onError={() => setImgError(true)}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #e8ecf0",
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: `hsl(${hue},50%,92%)`,
            color: `hsl(${hue},50%,35%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.32,
            fontWeight: 800,
            border: `2px solid hsl(${hue},50%,82%)`,
            fontFamily: "'Sora',sans-serif",
          }}
        >
          {inits}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 1,
          right: 1,
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: doctor.available ? "#22c55e" : "#94a3b8",
          border: "2px solid #fff",
          boxShadow: doctor.available
            ? "0 0 0 2px rgba(34,197,94,.25)"
            : "none",
        }}
      />
    </div>
  );
};

/* ─── Stars ──────────────────────────────────────────────────────────────── */
const Stars = ({ rating }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        style={{
          width: 7,
          height: 7,
          borderRadius: 1,
          transform: "rotate(45deg)",
          background: i <= Math.round(rating || 0) ? "#f59e0b" : "#e2e8f0",
        }}
      />
    ))}
    <span
      style={{ fontSize: 11, color: "#64748b", marginLeft: 4, fontWeight: 600 }}
    >
      {rating > 0 ? parseFloat(rating).toFixed(1) : "—"}
    </span>
  </div>
);

/* ─── Availability Badge ─────────────────────────────────────────────────── */
const AvailabilityInfo = ({ doctor }) => {
  const days = doctor.availability?.days || [];
  const slots = doctor.availability?.slots || [];

  if (!days.length && !slots.length) return null;

  const DAY_SHORT = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };
  const shortDays = days.map((d) => DAY_SHORT[d] || d).join(", ");

  const fmt12 = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div style={{ marginTop: 6, fontSize: 11, color: "#475569" }}>
      {shortDays && (
        <div style={{ marginBottom: 2 }}>
          <span style={{ fontWeight: 700 }}>Days: </span>
          {shortDays}
        </div>
      )}
      {slots.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {slots
            .filter((s) => s.from && s.to)
            .map((s, i) => (
              <span
                key={i}
                style={{
                  background: "#f0fdf4",
                  color: "#15803d",
                  border: "1px solid #bbf7d0",
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {fmt12(s.from)} – {fmt12(s.to)}
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

/* ─── Doctor Card ────────────────────────────────────────────────────────── */
const DoctorCard = ({ doc, selected, onSelect }) => {
  const sc = getSpecColor(doc.specialization);
  const name = doc.fullName || doc.name || "Doctor";
  return (
    <div
      onClick={() => onSelect(doc)}
      style={{
        background: selected ? "#f8faff" : "#fff",
        border: `1.5px solid ${selected ? "#2563eb" : "#e8ecf0"}`,
        borderRadius: 14,
        padding: "16px",
        cursor: "pointer",
        transition: "all .15s",
        boxShadow: selected
          ? "0 0 0 3px rgba(37,99,235,.1),0 4px 16px rgba(0,0,0,.07)"
          : "0 1px 4px rgba(0,0,0,.05)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <DoctorAvatar doctor={doc} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            <p
              style={{
                fontFamily: "'Sora',sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: "#0f172a",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </p>
            <span
              style={{
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 20,
                background: doc.available ? "#dcfce7" : "#f1f5f9",
                color: doc.available ? "#15803d" : "#64748b",
                border: `1px solid ${doc.available ? "#bbf7d0" : "#e2e8f0"}`,
              }}
            >
              {doc.available ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <span
            style={{
              display: "inline-block",
              marginTop: 5,
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 5,
              background: sc.bg,
              color: sc.text,
              border: `1px solid ${sc.border}`,
            }}
          >
            {doc.specialization || "General"}
          </span>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>
            {doc.qualification || "MBBS"}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          background: "#f8fafc",
          borderRadius: 9,
          overflow: "hidden",
          border: "1px solid #f1f5f9",
        }}
      >
        {[
          {
            label: "Exp",
            value: doc.experience > 0 ? `${doc.experience} yrs` : "—",
          },
          {
            label: "Fee",
            value: doc.consultationFee > 0 ? `₹${doc.consultationFee}` : "—",
          },
          { label: "Rating", value: <Stars rating={doc.rating} /> },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px 4px",
              borderRight: i < 2 ? "1px solid #e8ecf0" : "none",
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                color: "#94a3b8",
                fontWeight: 600,
                marginBottom: 3,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Languages */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(doc.languages || []).slice(0, 3).map((l) => (
            <span
              key={l}
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 4,
                background: "#f1f5f9",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                fontWeight: 500,
              }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Real availability from DB */}
      <AvailabilityInfo doctor={doc} />

      {/* About (expanded) */}
      {selected && doc.about && (
        <div
          style={{
            fontSize: 12,
            color: "#475569",
            lineHeight: 1.6,
            padding: "10px 12px",
            background: "#eff6ff",
            borderRadius: 8,
            borderLeft: "3px solid #2563eb",
          }}
        >
          {doc.about}
        </div>
      )}
    </div>
  );
};

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div
    style={{
      background: "#fff",
      border: "1.5px solid #f1f5f9",
      borderRadius: 14,
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }}
  >
    <div style={{ display: "flex", gap: 13 }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#f1f5f9",
        }}
      />
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
      >
        <div
          style={{
            height: 14,
            width: "65%",
            borderRadius: 6,
            background: "#f1f5f9",
          }}
        />
        <div
          style={{
            height: 10,
            width: "40%",
            borderRadius: 4,
            background: "#f8fafc",
          }}
        />
      </div>
    </div>
    <div style={{ height: 50, borderRadius: 9, background: "#f8fafc" }} />
  </div>
);

/* ─── Booking Modal ──────────────────────────────────────────────────────── */
const BookingModal = ({ doctor, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    symptoms: "",
    consultType: "video",
    slot: "",
  });

  // Build slots from doctor's availability, fall back to defaults
  const availSlots = (doctor.availability?.slots || [])
    .filter((s) => s.from && s.to)
    .map((s) => {
      const fmt = (t) => {
        const [h, m] = t.split(":").map(Number);
        return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
      };
      return `${fmt(s.from)} – ${fmt(s.to)}`;
    });

  const DEFAULT_SLOTS = [
    "9:00 AM",
    "10:00 AM",
    "11:30 AM",
    "1:00 PM",
    "2:30 PM",
    "4:00 PM",
    "5:30 PM",
    "7:00 PM",
  ];
  const SLOTS = availSlots.length ? availSlots : DEFAULT_SLOTS;

  const IS = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    background: "#f8fafc",
    fontFamily: "inherit",
    boxSizing: "border-box",
    marginTop: 4,
  };
  const name = doctor.fullName || doctor.name;
  const canNext1 =
    form.name && form.age && form.gender && form.phone && form.symptoms;
  const canNext2 = form.slot;

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15,23,42,.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          maxHeight: "95dvh",
          overflow: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,.25)",
          margin: "auto",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            background: "linear-gradient(135deg,#1e3a8a,#2563eb)",
            padding: "18px 20px 14px",
            borderRadius: "20px 20px 0 0",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 12,
              right: 14,
              background: "rgba(255,255,255,.15)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            ✕
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <DoctorAvatar doctor={doctor} size={40} />
            <div>
              <p
                style={{
                  color: "rgba(255,255,255,.6)",
                  fontSize: 10,
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Booking with
              </p>
              <h2
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  margin: "2px 0 0",
                  fontFamily: "'Sora',sans-serif",
                }}
              >
                {name}
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,.7)",
                  fontSize: 11,
                  margin: "1px 0 0",
                }}
              >
                {doctor.specialization} · ₹{doctor.consultationFee || 0}
              </p>
            </div>
          </div>
          {/* Steps */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {["Patient", "Slot", "Review"].map((l, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      step > i + 1
                        ? "#34d399"
                        : step === i + 1
                          ? "#fff"
                          : "rgba(255,255,255,.2)",
                    color: step === i + 1 ? "#1e3a8a" : "#fff",
                  }}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: step === i + 1 ? "#fff" : "rgba(255,255,255,.4)",
                    fontWeight: step === i + 1 ? 600 : 400,
                  }}
                >
                  {l}
                </span>
                {i < 2 && (
                  <div
                    style={{
                      width: 12,
                      height: 1,
                      background: "rgba(255,255,255,.2)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: "18px" }}>
          {/* Step 1 — Patient info */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 10.5,
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    Full Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Patient name"
                    style={IS}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 10.5,
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    Age *
                  </label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, age: e.target.value }))
                    }
                    placeholder="Years"
                    style={IS}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 10.5,
                    color: "#64748b",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Gender *
                </label>
                <div style={{ display: "flex", gap: 7, marginTop: 5 }}>
                  {["Male", "Female", "Other"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setForm((f) => ({ ...f, gender: g }))}
                      style={{
                        flex: 1,
                        padding: "7px",
                        borderRadius: 8,
                        border: "1.5px solid",
                        borderColor: form.gender === g ? "#2563eb" : "#e2e8f0",
                        background: form.gender === g ? "#eff6ff" : "#fff",
                        color: form.gender === g ? "#1d4ed8" : "#64748b",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: form.gender === g ? 700 : 500,
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 10.5,
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    Phone *
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+91…"
                    style={IS}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 10.5,
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    Email
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="Optional"
                    style={IS}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 10.5,
                    color: "#64748b",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Symptoms *
                </label>
                <textarea
                  rows={3}
                  value={form.symptoms}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, symptoms: e.target.value }))
                  }
                  placeholder="Describe symptoms…"
                  style={{ ...IS, resize: "vertical" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 10.5,
                    color: "#64748b",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Mode
                </label>
                <div style={{ display: "flex", gap: 7, marginTop: 5 }}>
                  {[
                    ["video", " Video"],
                    ["chat", " Chat"],
                    ["phone", " Phone"],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setForm((f) => ({ ...f, consultType: v }))}
                      style={{
                        flex: 1,
                        padding: "7px 4px",
                        borderRadius: 8,
                        border: "1.5px solid",
                        borderColor:
                          form.consultType === v ? "#2563eb" : "#e2e8f0",
                        background: form.consultType === v ? "#eff6ff" : "#fff",
                        color: form.consultType === v ? "#1d4ed8" : "#64748b",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: form.consultType === v ? 700 : 500,
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Slot */}
          {step === 2 && (
            <div>
              <h3
                style={{
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: 14,
                  margin: "0 0 4px",
                  fontFamily: "'Sora',sans-serif",
                }}
              >
                Choose a Time Slot
              </h3>
              {(doctor.availability?.days || []).length > 0 && (
                <p
                  style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px" }}
                >
                  Available: {doctor.availability.days.join(", ")}
                </p>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,1fr)",
                  gap: 8,
                }}
              >
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm((f) => ({ ...f, slot: s }))}
                    style={{
                      padding: "9px 8px",
                      borderRadius: 8,
                      border: "1.5px solid",
                      borderColor: form.slot === s ? "#2563eb" : "#e2e8f0",
                      background: form.slot === s ? "#eff6ff" : "#f8fafc",
                      color: form.slot === s ? "#1d4ed8" : "#334155",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: form.slot === s ? 700 : 500,
                      textAlign: "center",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div>
              <h3
                style={{
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: 14,
                  margin: "0 0 12px",
                  fontFamily: "'Sora',sans-serif",
                }}
              >
                Confirm Booking
              </h3>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: 14,
                  border: "1px solid #e2e8f0",
                }}
              >
                {[
                  ["Patient", form.name],
                  ["Age / Gender", `${form.age} · ${form.gender}`],
                  ["Doctor", name],
                  ["Specialization", doctor.specialization],
                  ["Slot", form.slot],
                  ["Mode", form.consultType],
                  ["Phone", form.phone],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#64748b" }}>{k}</span>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>
                      {v || "—"}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: 10,
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>
                    Total Fee
                  </span>
                  <span
                    style={{ fontWeight: 800, color: "#1d4ed8", fontSize: 16 }}
                  >
                    ₹{doctor.consultationFee || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  flex: 1,
                  padding: 11,
                  borderRadius: 10,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={() =>
                step < 3 ? setStep((s) => s + 1) : handleSubmit()
              }
              disabled={
                (step === 1 && !canNext1) ||
                (step === 2 && !canNext2) ||
                submitting
              }
              style={{
                flex: 2,
                padding: 11,
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg,#1e3a8a,#2563eb)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                opacity:
                  (step === 1 && !canNext1) ||
                  (step === 2 && !canNext2) ||
                  submitting
                    ? 0.4
                    : 1,
              }}
            >
              {submitting
                ? "Booking…"
                : step === 3
                  ? "Confirm Booking ✓"
                  : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function ConsultationPage() {
  const navigate = useNavigate();
  const isLoggedIn = !!(
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken")
  );
  const [tab, setTab] = useState("book");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("All");
  const [availFilter, setAvailFilter] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Fetch approved doctors — backend should populate availability field
    axios
      .get(`${BASE_URL}/api/doctor/approved`)
      .then((r) =>
        setDoctors(Array.isArray(r.data) ? r.data : r.data.doctors || []),
      )
      .catch(() => setError("Could not load doctors."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter((d) => {
    const n = (d.fullName || d.name || "").toLowerCase();
    const s = (d.specialization || "").toLowerCase();
    return (
      (!search ||
        n.includes(search.toLowerCase()) ||
        s.includes(search.toLowerCase())) &&
      (specFilter === "All" || d.specialization === specFilter) &&
      (availFilter === "all" ||
        (availFilter === "available" ? d.available : !d.available))
    );
  });

  const handleBooking = useCallback(
    async (form) => {
      try {
        // POST to backend — fields match consultationController.js
        await axios.post(`${BASE_URL}/api/doctor/consultations/book`, {
          doctorId: selectedDoc._id,
          name: form.name,
          phone: form.phone,
          email: form.email,
          age: form.age,
          gender: form.gender,
          symptoms: form.symptoms,
          consultType: form.consultType,
          slot: form.slot,
          fee: selectedDoc.consultationFee,
        });

        // Add to local history
        setBookings((prev) => [
          {
            id: Date.now(),
            doctorName: selectedDoc.fullName || selectedDoc.name,
            specialization: selectedDoc.specialization,
            photo: selectedDoc.photo,
            slot: form.slot,
            consultType: form.consultType,
            date: new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            status: "upcoming",
          },
          ...prev,
        ]);

        setToast({
          msg: `Booking confirmed with ${selectedDoc.fullName || selectedDoc.name}!`,
          type: "success",
        });
        setShowBooking(false);
        setSelectedDoc(null);
        setTab("history");
        setTimeout(() => setToast({ msg: "" }), 4000);
      } catch (err) {
        console.error("Booking error:", err);
        setToast({ msg: "Booking failed. Please try again.", type: "error" });
        setTimeout(() => setToast({ msg: "" }), 4000);
      }
    },
    [selectedDoc],
  );

  const onlineCount = doctors.filter((d) => d.available).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeIn  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:none} }
        .cp *  { box-sizing:border-box; }
        .cp    { font-family:'DM Sans',system-ui,sans-serif; }
        .dcard { transition: all .15s; }
        .dcard:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.09)!important; }
        .spec-scroll::-webkit-scrollbar { height: 4px; }
        .spec-scroll::-webkit-scrollbar-track { background: transparent; }
        .spec-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        @media (max-width: 900px) { .doc-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 580px) {
          .doc-grid { grid-template-columns: 1fr; }
          .page-header { padding: 14px 16px 0 !important; }
          .page-body   { padding: 14px 16px !important; }
          .tab-label   { font-size: 12px !important; }
        }
      `}</style>

      <div className="cp" style={{ minHeight: "100%", background: "#f4f6fb" }}>
        {/* Header */}
        <div
          className="page-header"
          style={{
            background: "#fff",
            borderBottom: "1px solid #e8ecf0",
            padding: "18px 24px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Sora',sans-serif",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.4px",
                  fontSize: "clamp(17px,3vw,22px)",
                }}
              >
                Doctor Consultations
              </h1>
              <p
                style={{ color: "#64748b", fontSize: 12.5, margin: "4px 0 0" }}
              >
                {loading
                  ? "Loading…"
                  : `${onlineCount} doctor${onlineCount !== 1 ? "s" : ""} online now`}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: onlineCount > 0 ? "#f0fdf4" : "#f8fafc",
                border: `1px solid ${onlineCount > 0 ? "#bbf7d0" : "#e2e8f0"}`,
                borderRadius: 9,
                padding: "7px 13px",
                fontSize: 12,
                fontWeight: 600,
                color: onlineCount > 0 ? "#15803d" : "#94a3b8",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: onlineCount > 0 ? "#22c55e" : "#cbd5e1",
                }}
              />
              {loading ? "…" : `${onlineCount} Online`}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex" }}>
            {[
              ["book", "Book Consultation"],
              ["history", "My Consultations"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className="tab-label"
                style={{
                  padding: "9px 16px",
                  border: "none",
                  background: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  color: tab === v ? "#2563eb" : "#64748b",
                  borderBottom: `2px solid ${tab === v ? "#2563eb" : "transparent"}`,
                  cursor: "pointer",
                  fontFamily: "'Sora',sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {l}
                {v === "history" && bookings.length > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: "#2563eb",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 10,
                    }}
                  >
                    {bookings.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div
          className="page-body"
          style={{ padding: "18px 24px", maxWidth: 1200, margin: "0 auto" }}
        >
          {/* Toast */}
          {toast.msg && (
            <div
              style={{
                background: toast.type === "error" ? "#fef2f2" : "#0f172a",
                color: toast.type === "error" ? "#dc2626" : "#fff",
                border: toast.type === "error" ? "1px solid #fecaca" : "none",
                borderRadius: 12,
                padding: "11px 16px",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
                animation: "slideUp .3s",
                boxShadow: "0 8px 30px rgba(0,0,0,.2)",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: toast.type === "error" ? "#fee2e2" : "#22c55e",
                  color: toast.type === "error" ? "#dc2626" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 12,
                }}
              >
                {toast.type === "error" ? "✕" : "✓"}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                {toast.msg}
              </span>
              <button
                onClick={() => setToast({ msg: "" })}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color:
                    toast.type === "error" ? "#dc2626" : "rgba(255,255,255,.5)",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Book Tab */}
          {tab === "book" && (
            <>
              {/* Search + filter */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ flex: 1, position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                        fontSize: 14,
                      }}
                    >
                      ⌕
                    </span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search doctor or specialization…"
                      style={{
                        width: "100%",
                        padding: "9px 12px 9px 28px",
                        borderRadius: 10,
                        border: "1.5px solid #e2e8f0",
                        fontSize: 13,
                        color: "#0f172a",
                        outline: "none",
                        background: "#fff",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters((f) => !f)}
                    style={{
                      flexShrink: 0,
                      padding: "9px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #e2e8f0",
                      background: showFilters ? "#eff6ff" : "#fff",
                      color: showFilters ? "#1d4ed8" : "#64748b",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    ⚙ Filters
                  </button>
                  <span
                    style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}
                  >
                    {loading
                      ? "…"
                      : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
                  </span>
                </div>

                {showFilters && (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      border: "1.5px solid #e2e8f0",
                      padding: "14px 16px",
                      animation: "slideDown .2s",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                          margin: "0 0 8px",
                        }}
                      >
                        Specialization
                      </p>
                      <div
                        className="spec-scroll"
                        style={{
                          display: "flex",
                          gap: 6,
                          overflowX: "auto",
                          paddingBottom: 4,
                        }}
                      >
                        {SPECIALIZATIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSpecFilter(s)}
                            style={{
                              flexShrink: 0,
                              padding: "6px 12px",
                              borderRadius: 20,
                              border: "1.5px solid",
                              borderColor:
                                specFilter === s ? "#2563eb" : "#e2e8f0",
                              background:
                                specFilter === s ? "#eff6ff" : "#f8fafc",
                              color: specFilter === s ? "#1d4ed8" : "#64748b",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: specFilter === s ? 700 : 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                          margin: "0 0 8px",
                        }}
                      >
                        Availability
                      </p>
                      <div
                        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                      >
                        {[
                          ["all", "All"],
                          ["available", "Online"],
                          ["offline", "Offline"],
                        ].map(([v, l]) => (
                          <button
                            key={v}
                            onClick={() => setAvailFilter(v)}
                            style={{
                              padding: "7px 14px",
                              borderRadius: 9,
                              border: "1.5px solid",
                              borderColor:
                                availFilter === v ? "#2563eb" : "#e2e8f0",
                              background:
                                availFilter === v ? "#eff6ff" : "#fff",
                              color: availFilter === v ? "#1d4ed8" : "#64748b",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: availFilter === v ? 700 : 500,
                            }}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: 10,
                    padding: "11px 14px",
                    marginBottom: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#c2410c", fontSize: 13 }}>
                    {error}
                  </span>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 7,
                      border: "1px solid #fed7aa",
                      background: "#fff",
                      color: "#c2410c",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Doctor grid */}
              <div className="doc-grid">
                {loading
                  ? Array(6)
                      .fill(0)
                      .map((_, i) => <Skeleton key={i} />)
                  : filtered.length > 0
                    ? filtered.map((doc) => (
                        <div key={doc._id} className="dcard">
                          <DoctorCard
                            doc={doc}
                            selected={selectedDoc?._id === doc._id}
                            onSelect={(d) =>
                              setSelectedDoc((p) =>
                                p?._id === d._id ? null : d,
                              )
                            }
                          />
                        </div>
                      ))
                    : !error && (
                        <div
                          style={{
                            gridColumn: "1/-1",
                            textAlign: "center",
                            padding: "44px 20px",
                          }}
                        >
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              background: "#f1f5f9",
                              margin: "0 auto 12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 20,
                            }}
                          >
                            🔍
                          </div>
                          <p
                            style={{
                              fontWeight: 700,
                              color: "#0f172a",
                              margin: 0,
                            }}
                          >
                            No doctors found
                          </p>
                          <p
                            style={{
                              color: "#94a3b8",
                              fontSize: 13,
                              margin: "5px 0 0",
                            }}
                          >
                            Try adjusting filters
                          </p>
                        </div>
                      )}
              </div>

              {/* Sticky "Book Now" bar */}
              {selectedDoc && (
                <div
                  style={{
                    position: "sticky",
                    bottom: 12,
                    marginTop: 14,
                    background: "#fff",
                    borderRadius: 14,
                    padding: "12px 16px",
                    border: "1.5px solid #e2e8f0",
                    boxShadow: "0 8px 32px rgba(0,0,0,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    animation: "slideUp .2s",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <DoctorAvatar doctor={selectedDoc} size={38} />
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: 0,
                          fontSize: 14,
                          fontFamily: "'Sora',sans-serif",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {selectedDoc.fullName || selectedDoc.name}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          {selectedDoc.specialization}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          · ₹{selectedDoc.consultationFee || 0}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: selectedDoc.available
                              ? "#15803d"
                              : "#dc2626",
                          }}
                        >
                          ● {selectedDoc.available ? "Available" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!selectedDoc.available) return;
                      if (!isLoggedIn) {
                        sessionStorage.setItem(
                          "redirectAfterLogin",
                          "/consultation",
                        );
                        navigate("/userlogin");
                      } else {
                        setShowBooking(true);
                      }
                    }}
                    disabled={!selectedDoc.available}
                    style={{
                      flexShrink: 0,
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "none",
                      background: selectedDoc.available
                        ? "linear-gradient(135deg,#1e3a8a,#2563eb)"
                        : "#e2e8f0",
                      color: selectedDoc.available ? "#fff" : "#94a3b8",
                      cursor: selectedDoc.available ? "pointer" : "not-allowed",
                      fontWeight: 700,
                      fontSize: 14,
                      fontFamily: "'Sora',sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedDoc.available ? "Book Now →" : "Doctor Offline"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* History Tab */}
          {tab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "56px 20px" }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "#f1f5f9",
                      margin: "0 auto 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                  </div>
                  <p
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: 15,
                      margin: 0,
                    }}
                  >
                    No consultations yet
                  </p>
                  <button
                    onClick={() => setTab("book")}
                    style={{
                      marginTop: 14,
                      padding: "9px 22px",
                      borderRadius: 10,
                      border: "none",
                      background: "#2563eb",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    Find a Doctor
                  </button>
                </div>
              ) : (
                bookings.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      border: "1.5px solid #e8ecf0",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <DoctorAvatar
                      doctor={{
                        fullName: b.doctorName,
                        photo: b.photo,
                        available: false,
                      }}
                      size={42}
                    />
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: 0,
                          fontSize: 14,
                          fontFamily: "'Sora',sans-serif",
                        }}
                      >
                        {b.doctorName}
                      </p>
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          margin: "3px 0 0",
                        }}
                      >
                        {b.specialization} · {b.slot} · {b.consultType}
                      </p>
                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: 11,
                          margin: "2px 0 0",
                        }}
                      >
                        {b.date}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "3px 12px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        background: "#f0fdf4",
                        color: "#15803d",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      Upcoming
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking modal */}
      {showBooking && selectedDoc && (
        <BookingModal
          doctor={selectedDoc}
          onClose={() => setShowBooking(false)}
          onSubmit={handleBooking}
        />
      )}
    </>
  );
}
