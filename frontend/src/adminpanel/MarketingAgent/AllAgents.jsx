import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../config/api";
const BASE = `${API_BASE_URL}/api`;

const getToken = () => localStorage.getItem("adminToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AV_PALETTE = [
  { bg: "#9FE1CB", text: "#085041" },
  { bg: "#CECBF6", text: "#3C3489" },
  { bg: "#FAC775", text: "#633806" },
  { bg: "#B5D4F4", text: "#0C447C" },
  { bg: "#F5C4B3", text: "#712B13" },
  { bg: "#F4C0D1", text: "#72243E" },
];
const avatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AV_PALETTE[h % AV_PALETTE.length];
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })
    : "—";

/* ── Sub-components ── */

function Avatar({ name, size = 36 }) {
  const av = avatarColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: av.bg,
        color: av.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size > 44 ? 16 : 12,
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: "0.04em",
      }}
    >
      {initials(name)}
    </div>
  );
}

function Badge({ children, variant = "neutral" }) {
  const map = {
    green: { bg: "#EAF3DE", color: "#3B6D11" },
    red: { bg: "#FCEBEB", color: "#A32D2D" },
    amber: { bg: "#FAEEDA", color: "#854F0B" },
    blue: { bg: "#E6F1FB", color: "#185FA5" },
    purple: { bg: "#F3EEFF", color: "#6D28D9" },
    neutral: { bg: "#F1EFE8", color: "#5F5E5A" },
  };
  const s = map[variant] || map.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "2px 9px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </span>
  );
}

function Btn({ label, onClick, disabled, variant = "neutral" }) {
  const map = {
    green: { bg: "#EAF3DE", color: "#3B6D11", border: "#C0DD97", hover: "#D4ECC0" },
    red: { bg: "#FCEBEB", color: "#A32D2D", border: "#F7C1C1", hover: "#FADADA" },
    blue: { bg: "#E6F1FB", color: "#185FA5", border: "#B5D4F4", hover: "#CCE1F7" },
    amber: { bg: "#FAEEDA", color: "#854F0B", border: "#FAC775", hover: "#F5DDB8" },
    purple: { bg: "#F3EEFF", color: "#6D28D9", border: "#D4AEFF", hover: "#E8D5FF" },
    neutral: { bg: "#F8F8F6", color: "#444", border: "#DDD", hover: "#EEE" },
  };
  const s = map[variant] || map.neutral;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "5px 12px",
        fontSize: 11,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 7,
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = s.hover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = s.bg; }}
    >
      {label}
    </button>
  );
}

/* ── Location + Image Modal ── */
function LiveDataModal({ agent, onClose }) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!agent) return;

  const fetchData = async () => {
    try {
      const res = await fetch(`${BASE}/admin/marketing-agents/${agent._id}/live-data`, {
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error("API failed");

      const data = await res.json();

      if (data.success) {
        setLiveData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [agent]);

  if (!agent) return null;

  const lat = liveData?.currentLocation?.latitude;
  const lng = liveData?.currentLocation?.longitude;
  const updatedAt = liveData?.currentLocation?.updatedAt;
  const hasLocation = lat && lng;
  const proofImage = liveData?.startProofImage;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 620,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            background: agent.isOnJob ? "#f0fdf4" : "#f8fafc",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
              Live Data — {agent.name}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
              {agent.isOnJob ? (
                <span style={{ color: "#16a34a", fontWeight: 600 }}>Currently on job</span>
              ) : (
                <span style={{ color: "#94a3b8" }}>Not on job</span>
              )}
              {updatedAt && (
                <span style={{ marginLeft: 8 }}>
                  · Location updated {new Date(updatedAt).toLocaleTimeString("en-IN")}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "#94a3b8",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            Loading live data...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Map */}
            {hasLocation ? (
              <>
                <div style={{ height: 280, background: "#f1f5f9" }}>
                  <iframe
                    title="Agent Location"
                    src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                    width="100%"
                    height="280"
                    style={{ border: "none", display: "block" }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <div
                  style={{
                    padding: "12px 20px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    gap: 20,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.08em" }}>
                      LATITUDE
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
                      {lat.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.08em" }}>
                      LONGITUDE
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
                      {lng.toFixed(6)}
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${lat},${lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      marginLeft: "auto",
                      padding: "7px 14px",
                      background: "#1d4ed8",
                      color: "#fff",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Open in Maps
                  </a>
                </div>
              </>
            ) : (
              <div style={{ padding: "32px 20px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  No location data available
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  Agent has not shared location yet.
                </div>
              </div>
            )}

            {/* Proof Image */}
            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "0.08em",
                  marginBottom: 10,
                }}
              >
                START-OF-JOB PROOF IMAGE
              </div>
              {proofImage ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={proofImage}
                    alt="Start proof"
                    style={{
                      width: "100%",
                      maxHeight: 220,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "#94a3b8",
                    }}
                  >
                    Auto-deletes from storage after 24 hours
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "20px",
                    background: "#f8fafc",
                    borderRadius: 10,
                    border: "1px dashed #e2e8f0",
                    textAlign: "center",
                    fontSize: 13,
                    color: "#94a3b8",
                  }}
                >
                  No proof image uploaded for this job
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Agent Settings Modal ── */
function AgentSettingsModal({ agent, onClose, onSaved }) {
  const [form, setForm] = useState({
    requireLocation: agent?.jobStartRequirements?.requireLocation ?? true,
    requireImage: agent?.jobStartRequirements?.requireImage ?? false,
    geofenceEnabled: agent?.geofence?.enabled ?? false,
    geofenceLat: agent?.geofence?.latitude ?? "",
    geofenceLng: agent?.geofence?.longitude ?? "",
    geofenceRadiusKm: agent?.geofence?.radiusKm ?? 50,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `${BASE}/admin/marketing-agents/${agent._id}/settings`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      onSaved(data.agent);
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  if (!agent) return null;

  const Toggle = ({ checked, onChange, label, description }) => (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid #f1f5f9",
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 42,
          height: 24,
          borderRadius: 12,
          background: checked ? "#1d4ed8" : "#e2e8f0",
          border: "none",
          cursor: "pointer",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    fontSize: 13,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
              Agent Settings
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {agent.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "#94a3b8",
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Job Start Requirements */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            JOB START REQUIREMENTS
          </div>

          <Toggle
            label="Require Location"
            description="Agent must share GPS location before starting a job"
            checked={form.requireLocation}
            onChange={(v) => setForm((f) => ({ ...f, requireLocation: v }))}
          />
          <Toggle
            label="Require Start Photo"
            description="Agent must upload a photo before starting a job"
            checked={form.requireImage}
            onChange={(v) => setForm((f) => ({ ...f, requireImage: v }))}
          />

          {/* Geofencing */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.08em",
              margin: "20px 0 8px",
            }}
          >
            GEOFENCE ALERT
          </div>

          <Toggle
            label="Enable Geofence Alert"
            description="Alert when agent goes outside assigned area"
            checked={form.geofenceEnabled}
            onChange={(v) => setForm((f) => ({ ...f, geofenceEnabled: v }))}
          />

          {form.geofenceEnabled && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                    Center Latitude
                  </div>
                  <input
                    type="number"
                    placeholder="e.g. 28.6139"
                    value={form.geofenceLat}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, geofenceLat: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                    Center Longitude
                  </div>
                  <input
                    type="number"
                    placeholder="e.g. 77.2090"
                    value={form.geofenceLng}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, geofenceLng: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ maxWidth: 180 }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                  Radius (km)
                </div>
                <input
                  type="number"
                  placeholder="50"
                  value={form.geofenceRadiusKm}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, geofenceRadiusKm: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  background: "#f8fafc",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #f1f5f9",
                }}
              >
                The agent will see a red alert banner when they travel more than{" "}
                {form.geofenceRadiusKm || "—"} km from the center point.
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                background: "#FCEBEB",
                border: "1px solid #F7C1C1",
                borderRadius: 8,
                fontSize: 13,
                color: "#A32D2D",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
            <Btn label="Cancel" onClick={onClose} />
            <Btn
              label={saving ? "Saving..." : "Save Settings"}
              variant="blue"
              disabled={saving}
              onClick={handleSave}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Detail Modal ── */
function AgentModal({ agent, onClose, onAction, actionLoading, onOpenSettings }) {
  if (!agent) return null;

  const rows = [
    ["Email", agent.email],
    ["Phone", agent.phone || "—"],
    ["Assigned Area", agent.assignedArea || "—"],
    ["Registered", fmtDate(agent.createdAt)],
    ["GPS Violations", agent.gpsViolationCount ?? 0],
    ["GPS Blocked", agent.isGpsBlocked ? "Yes" : "No"],
    ["Currently On Job", agent.isOnJob ? "Yes" : "No"],
    ["Approval Status", agent.isApproved ? "Approved" : "Pending"],
    [
      "Requires Location",
      agent.jobStartRequirements?.requireLocation ? "Yes" : "No",
    ],
    [
      "Requires Start Photo",
      agent.jobStartRequirements?.requireImage ? "Yes" : "No",
    ],
    [
      "Geofence",
      agent.geofence?.enabled
        ? `${agent.geofence.radiusKm ?? 50} km radius`
        : "Disabled",
    ],
  ];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 500,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 20px 14px",
            borderBottom: "1px solid #f1f5f9",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 1,
          }}
        >
          <Avatar name={agent.name} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              {agent.name}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Marketing Agent</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: "#94a3b8",
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {agent.isApproved ? (
              <Badge variant="green">Approved</Badge>
            ) : (
              <Badge variant="amber">Pending Approval</Badge>
            )}
            {agent.isGpsBlocked && <Badge variant="red">GPS Blocked</Badge>}
            {agent.isOnJob && <Badge variant="blue">On Job</Badge>}
            {!agent.isOnJob && agent.isApproved && (
              <Badge variant="neutral">Idle</Badge>
            )}
          </div>

          <div
            style={{
              background: "#f8fafc",
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid #f1f5f9",
              marginBottom: 14,
            }}
          >
            {rows.map(([k, v], i) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                  padding: "9px 14px",
                  borderBottom: i < rows.length - 1 ? "1px solid #f1f5f9" : "none",
                  background: i % 2 === 0 ? "#fff" : "#f8fafc",
                }}
              >
                <span style={{ color: "#64748b", fontWeight: 500 }}>{k}</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: "#0f172a",
                    textAlign: "right",
                    maxWidth: "60%",
                  }}
                >
                  {String(v)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {!agent.isApproved && (
              <Btn
                label={actionLoading === "approve" ? "Approving..." : "Approve"}
                variant="green"
                disabled={!!actionLoading}
                onClick={() => onAction("approve", agent._id)}
              />
            )}
            {agent.isApproved && (
              <Btn
                label={actionLoading === "revoke" ? "Revoking..." : "Revoke"}
                variant="amber"
                disabled={!!actionLoading}
                onClick={() => onAction("revoke", agent._id)}
              />
            )}
            {agent.isGpsBlocked ? (
              <Btn
                label={actionLoading === "unblock" ? "Unblocking..." : "Unblock GPS"}
                variant="blue"
                disabled={!!actionLoading}
                onClick={() => onAction("unblock", agent._id)}
              />
            ) : (
              <Btn
                label={actionLoading === "block" ? "Blocking..." : "Block GPS"}
                variant="red"
                disabled={!!actionLoading}
                onClick={() => onAction("block", agent._id)}
              />
            )}
            <Btn
              label="Live Data"
              variant="purple"
              onClick={() => onAction("viewLocation", agent._id)}
            />
            <Btn
              label="Settings"
              variant="blue"
              onClick={() => onOpenSettings(agent)}
            />
            <Btn label="Close" onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function AllAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [locationAgent, setLocationAgent] = useState(null);
  const [settingsAgent, setSettingsAgent] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const res = await fetch(`${BASE}/admin/marketing-agents`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleAction = async (action, agentId) => {
    if (action === "viewLocation") {
      const agent = agents.find((a) => a._id === agentId);
      setLocationAgent(agent);
      setSelectedAgent(null);
      return;
    }

    const endpointMap = {
      approve: `${BASE}/admin/marketing-agents/${agentId}/approve`,
      revoke: `${BASE}/admin/marketing-agents/${agentId}/revoke`,
      unblock: `${BASE}/admin/marketing-agents/${agentId}/unblock-gps`,
      block: `${BASE}/admin/marketing-agents/${agentId}/block-gps`,
    };

    if (!endpointMap[action]) return;

    setActionLoading(action);
    try {
      const res = await fetch(endpointMap[action], {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Action failed");
      }
      const data = await res.json();
      setAgents((prev) =>
        prev.map((a) => (a._id === agentId ? { ...a, ...data.agent } : a))
      );
      if (selectedAgent?._id === agentId)
        setSelectedAgent((p) => ({ ...p, ...data.agent }));
      const msgMap = {
        approve: "Agent approved",
        revoke: "Approval revoked",
        unblock: "GPS unblocked",
        block: "GPS blocked",
      };
      showToast(msgMap[action] || "Done");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSettingsSaved = (updatedAgent) => {
    setAgents((prev) =>
      prev.map((a) => (a._id === updatedAgent._id ? { ...a, ...updatedAgent } : a))
    );
    showToast("Agent settings saved");
  };

  const quickApprove = (agentId) => handleAction("approve", agentId);

  const counts = {
    all: agents.length,
    approved: agents.filter((a) => a.isApproved && !a.isGpsBlocked).length,
    pending: agents.filter((a) => !a.isApproved).length,
    blocked: agents.filter((a) => a.isGpsBlocked).length,
    live: agents.filter((a) => a.isOnJob).length,
  };

  const filtered = agents.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      (a.assignedArea || "").toLowerCase().includes(q) ||
      (a.email || "").toLowerCase().includes(q) ||
      (a.phone || "").includes(q);
    if (!matchSearch) return false;
    if (filter === "approved") return a.isApproved && !a.isGpsBlocked;
    if (filter === "pending") return !a.isApproved;
    if (filter === "blocked") return a.isGpsBlocked;
    if (filter === "live") return a.isOnJob;
    return true;
  });

  /* ── Column widths — fixed so header and rows always align ── */
  const COL = "44px 1fr 130px 76px 72px 90px 82px 220px";

//   const cellStyle = {
//     display: "contents",
//   };

  return (
    <div
      style={{
        padding: isMobile ? "1rem 0" : "2rem 0",
        fontFamily: "var(--font-sans, sans-serif)",
        color: "#1e293b",
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        .agent-row:hover { background: #f8fafc !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            background: toast.type === "error" ? "#FCEBEB" : "#EAF3DE",
            color: toast.type === "error" ? "#A32D2D" : "#3B6D11",
            border: `1px solid ${toast.type === "error" ? "#F7C1C1" : "#C0DD97"}`,
            zIndex: 2000,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            whiteSpace: "nowrap",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#94a3b8",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Marketing Zone
          </div>
          <div
            style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#0f172a" }}
          >
            All Agents
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {counts.live > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 20,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontSize: 12,
                fontWeight: 700,
                color: "#16a34a",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#16a34a",
                  display: "inline-block",
                  animation: "pulse 1.5s infinite",
                }}
              />
              {counts.live} Live
            </div>
          )}
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            {agents.length} registered
          </div>
          <button
            onClick={fetchAgents}
            disabled={loading}
            style={{
              padding: "7px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              color: "#475569",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "12px 16px",
            borderRadius: 10,
            background: "#FCEBEB",
            border: "1px solid #F7C1C1",
            fontSize: 13,
            color: "#A32D2D",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Failed to load: {error}</span>
          <span style={{ cursor: "pointer", fontWeight: 700 }} onClick={fetchAgents}>
            Retry
          </span>
        </div>
      )}

      {/* Pending warning */}
      {!loading && counts.pending > 0 && (
        <div
          onClick={() => setFilter("pending")}
          style={{
            marginBottom: "1.5rem",
            padding: "12px 16px",
            borderRadius: 10,
            background: "#FAEEDA",
            border: "1px solid #FAC775",
            fontSize: 13,
            color: "#633806",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span>
            {counts.pending} agent{counts.pending > 1 ? "s" : ""} waiting for
            approval — they cannot log in until approved.
          </span>
          <span style={{ fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
            Review
          </span>
        </div>
      )}

      {/* Stat tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)",
          gap: 10,
          marginBottom: "1.5rem",
        }}
      >
        {[
          { key: "all", label: "Total" },
          { key: "approved", label: "Approved" },
          { key: "pending", label: "Pending" },
          { key: "blocked", label: "GPS Blocked" },
          { key: "live", label: "Live Now" },
        ].map(({ key, label }) => (
          <div
            key={key}
            onClick={() => setFilter(key)}
            style={{
              background: filter === key ? "#f0f7ff" : "#fff",
              borderRadius: 12,
              padding: "14px",
              cursor: "pointer",
              border:
                filter === key ? "1.5px solid #93c5fd" : "1px solid #e8edf2",
              transition: "all 0.15s",
              boxShadow:
                filter === key ? "0 0 0 3px rgba(147,197,253,0.2)" : "none",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#94a3b8",
                marginBottom: 8,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: 1,
              }}
            >
              {loading ? "—" : counts[key]}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search name, area, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "9px 14px",
            fontSize: 13,
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#0f172a",
            outline: "none",
          }}
        />
        {!isMobile && (
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "approved", "pending", "blocked", "live"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: 8,
                  textTransform: "capitalize",
                  border:
                    filter === f ? "1.5px solid #93c5fd" : "1px solid #e2e8f0",
                  background: filter === f ? "#f0f7ff" : "#fff",
                  color: filter === f ? "#1d4ed8" : "#475569",
                }}
              >
                {f} ({loading ? "—" : counts[f]})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                style={{
                  height: 52,
                  background: "#f1f5f9",
                  borderRadius: 10,
                  opacity: 0.8 - i * 0.12,
                }}
              />
            ))}
        </div>
      )}

      {/* Mobile: card grid */}
      {!loading && isMobile && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                fontSize: 14,
                color: "#94a3b8",
              }}
            >
              No agents match this filter.
            </div>
          ) : (
            filtered.map((agent) => (
              <div
                key={agent._id}
                style={{
                  background: "#fff",
                  border: "1px solid #e8edf2",
                  borderRadius: 12,
                  padding: "14px",
                  borderLeft: `4px solid ${
                    !agent.isApproved
                      ? "#EF9F27"
                      : agent.isGpsBlocked
                      ? "#E24B4A"
                      : "#1D9E75"
                  }`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <Avatar name={agent.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0f172a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {agent.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {agent.assignedArea || "—"} · {agent.phone || "—"}
                    </div>
                  </div>
                  {agent.isOnJob && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#16a34a",
                        flexShrink: 0,
                        boxShadow: "0 0 0 3px #dcfce7",
                      }}
                    />
                  )}
                </div>
                <div
                  style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}
                >
                  {agent.isApproved ? (
                    <Badge variant="green">Approved</Badge>
                  ) : (
                    <Badge variant="amber">Pending</Badge>
                  )}
                  {agent.isOnJob && <Badge variant="blue">On Job</Badge>}
                  {agent.isGpsBlocked && <Badge variant="red">GPS Blocked</Badge>}
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  <Btn label="View" onClick={() => setSelectedAgent(agent)} />
                  <Btn
                    label="Live Data"
                    variant="purple"
                    onClick={() => setLocationAgent(agent)}
                  />
                  <Btn
                    label="Settings"
                    variant="blue"
                    onClick={() => setSettingsAgent(agent)}
                  />
                  {!agent.isApproved && (
                    <Btn
                      label={actionLoading === agent._id ? "..." : "Approve"}
                      variant="green"
                      disabled={actionLoading === agent._id}
                      onClick={() => quickApprove(agent._id)}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Desktop: table — fixed column layout so header + rows are always aligned */}
      {!loading && !isMobile && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8edf2",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          }}
        >
          {/* Table using CSS Grid with fixed columns */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 900 }}>
              {/* Header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: COL,
                  gap: 0,
                  padding: "10px 16px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#94a3b8",
                  alignItems: "center",
                }}
              >
                <div />
                <div>Agent</div>
                <div>Area</div>
                <div>Approval</div>
                <div>Job</div>
                <div>GPS</div>
                <div>Joined</div>
                <div>Actions</div>
              </div>

              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    fontSize: 14,
                    color: "#94a3b8",
                  }}
                >
                  No agents match this filter.
                </div>
              ) : (
                filtered.map((agent, i) => {
                  const rowBg = agent.isOnJob
                    ? "rgba(240,253,244,0.6)"
                    : !agent.isApproved
                    ? "rgba(254,243,199,0.3)"
                    : "#fff";

                  return (
                    <div
                      key={agent._id}
                      className="agent-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: COL,
                        gap: 0,
                        padding: "11px 16px",
                        alignItems: "center",
                        borderBottom:
                          i < filtered.length - 1 ? "1px solid #f8fafc" : "none",
                        background: rowBg,
                        transition: "background 0.1s",
                      }}
                    >
                      {/* Avatar col */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ position: "relative" }}>
                          <Avatar name={agent.name} />
                          {agent.isOnJob && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                background: "#16a34a",
                                border: "2px solid #fff",
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Name + contact */}
                      <div style={{ minWidth: 0, paddingRight: 8 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {agent.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {agent.phone || agent.email || "—"}
                        </div>
                      </div>

                      {/* Area */}
                      <div
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          paddingRight: 8,
                        }}
                      >
                        {agent.assignedArea || "—"}
                      </div>

                      {/* Approval */}
                      <div>
                        {agent.isApproved ? (
                          <Badge variant="green">Approved</Badge>
                        ) : (
                          <Badge variant="amber">Pending</Badge>
                        )}
                      </div>

                      {/* Job */}
                      <div>
                        {agent.isOnJob ? (
                          <Badge variant="blue">On Job</Badge>
                        ) : (
                          <Badge variant="neutral">Idle</Badge>
                        )}
                      </div>

                      {/* GPS */}
                      <div>
                        {agent.isGpsBlocked ? (
                          <Badge variant="red">Blocked</Badge>
                        ) : agent.gpsViolationCount > 0 ? (
                          <Badge variant="amber">
                            {agent.gpsViolationCount} strike
                            {agent.gpsViolationCount > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <Badge variant="neutral">Clear</Badge>
                        )}
                      </div>

                      {/* Joined */}
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        {fmtDate(agent.createdAt)}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <Btn
                          label="View"
                          onClick={() => setSelectedAgent(agent)}
                        />
                        <Btn
                          label="Live"
                          variant="purple"
                          onClick={() => setLocationAgent(agent)}
                        />
                        <Btn
                          label="Settings"
                          variant="blue"
                          onClick={() => setSettingsAgent(agent)}
                        />
                        {!agent.isApproved && (
                          <Btn
                            label={
                              actionLoading === agent._id ? "..." : "Approve"
                            }
                            variant="green"
                            disabled={!!actionLoading}
                            onClick={() => quickApprove(agent._id)}
                          />
                        )}
                        {agent.isApproved && (
                          <Btn
                            label="Revoke"
                            variant="amber"
                            disabled={!!actionLoading}
                            onClick={() => handleAction("revoke", agent._id)}
                          />
                        )}
                        {agent.isGpsBlocked ? (
                          <Btn
                            label="Unblock"
                            variant="blue"
                            disabled={!!actionLoading}
                            onClick={() => handleAction("unblock", agent._id)}
                          />
                        ) : (
                          <Btn
                            label="Block"
                            variant="red"
                            disabled={!!actionLoading}
                            onClick={() => handleAction("block", agent._id)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && agents.length === 0 && !error && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8edf2",
            borderRadius: 14,
            padding: "3rem",
            textAlign: "center",
            marginTop: "1rem",
          }}
        >
          <div
            style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}
          >
            No agents found
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            Marketing agents will appear here once they register.
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAgent && (
        <AgentModal
          agent={agents.find((a) => a._id === selectedAgent._id) || selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onAction={handleAction}
          actionLoading={actionLoading}
          onOpenSettings={(a) => {
            setSettingsAgent(a);
            setSelectedAgent(null);
          }}
        />
      )}

      {/* Live Data Modal */}
      {locationAgent && (
        <LiveDataModal
          agent={agents.find((a) => a._id === locationAgent._id) || locationAgent}
          onClose={() => setLocationAgent(null)}
        />
      )}

      {/* Settings Modal */}
      {settingsAgent && (
        <AgentSettingsModal
          agent={agents.find((a) => a._id === settingsAgent._id) || settingsAgent}
          onClose={() => setSettingsAgent(null)}
          onSaved={handleSettingsSaved}
        />
      )}
    </div>
  );
}