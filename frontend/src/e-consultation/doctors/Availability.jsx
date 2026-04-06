import React, { useEffect, useState } from "react";
import api from "./doctorApi";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const card = {
  background: "#ffffff",
  borderRadius: 16,
  padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  border: "1px solid #e2e8f0",
  marginBottom: 20,
};

const Availability = () => {
  const [days, setDays] = useState([]);
  const [slots, setSlots] = useState([{ from: "", to: "" }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/doctor/availability");
        if (res.data?.availability) {
          setDays(res.data.availability.days || []);
          setSlots(res.data.availability.slots?.length ? res.data.availability.slots : [{ from: "", to: "" }]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, []);

  const toggleDay = (day) => {
    setDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleSlotChange = (index, field, value) => {
    const updated = [...slots];
    updated[index][field] = value;
    setSlots(updated);
  };

  const removeSlot = (index) => {
    if (slots.length === 1) return;
    setSlots(slots.filter((_, i) => i !== index));
  };

  const addSlot = () => setSlots([...slots, { from: "", to: "" }]);

  const saveAvailability = async () => {
    setSaving(true);
    try {
      await api.post("/doctor/availability", { days, slots });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#0f172a", fontSize: 24, fontWeight: 700, margin: 0 }}>Availability</h1>
        <p style={{ color: "#64748b", fontSize: 13.5, margin: "4px 0 0" }}>Set your working days and consultation time slots</p>
      </div>

      {/* Days */}
      <div style={card}>
        <h3 style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Available Days</h3>
        <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 16px" }}>Select the days you're available for consultations</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {DAYS.map((day, i) => {
            const active = days.includes(day);
            return (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                style={{
                  padding: "14px 8px",
                  borderRadius: 12,
                  border: `2px solid ${active ? "#3b82f6" : "#e2e8f0"}`,
                  background: active ? "#eff6ff" : "#f8fafc",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = "#93c5fd"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#3b82f6" : "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {DAY_SHORT[i]}
                </span>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: active ? "#3b82f6" : "#e2e8f0",
                    transition: "background 0.15s",
                  }}
                />
              </button>
            );
          })}
        </div>
        {days.length > 0 && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
            <p style={{ color: "#0369a1", fontSize: 13, fontWeight: 600, margin: 0 }}>
              Available on: {days.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Time Slots */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, margin: 0 }}>Consultation Time Slots</h3>
            <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Add one or more time windows for appointments</p>
          </div>
          <button
            onClick={addSlot}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1.5px solid #bfdbfe",
              background: "#eff6ff",
              color: "#3b82f6",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Slot
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {slots.map((slot, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px",
                background: "#f8fafc",
                borderRadius: 12,
                border: "1.5px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", minWidth: 60, textAlign: "right" }}>From</span>
                <input
                  type="time"
                  value={slot.from}
                  onChange={(e) => handleSlotChange(index, "from", e.target.value)}
                  style={{
                    flex: 1,
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 14,
                    color: "#0f172a",
                    background: "#fff",
                    outline: "none",
                    cursor: "pointer",
                  }}
                />
              </div>
              <div style={{ width: 16, height: 2, background: "#cbd5e1", borderRadius: 1 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", minWidth: 20 }}>To</span>
                <input
                  type="time"
                  value={slot.to}
                  onChange={(e) => handleSlotChange(index, "to", e.target.value)}
                  style={{
                    flex: 1,
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 14,
                    color: "#0f172a",
                    background: "#fff",
                    outline: "none",
                    cursor: "pointer",
                  }}
                />
              </div>
              {slots.length > 1 && (
                <button
                  onClick={() => removeSlot(index)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "none",
                    background: "#fee2e2",
                    color: "#dc2626",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", fontSize: 13.5, fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Availability saved!
          </div>
        )}
        <button
          onClick={saveAvailability}
          disabled={saving}
          style={{
            padding: "11px 28px",
            borderRadius: 12,
            border: "none",
            background: saving ? "#93c5fd" : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: saving ? "default" : "pointer",
            boxShadow: saving ? "none" : "0 4px 14px rgba(59,130,246,0.4)",
            transition: "all 0.2s",
          }}
        >
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </div>
    </div>
  );
};

export default Availability;
