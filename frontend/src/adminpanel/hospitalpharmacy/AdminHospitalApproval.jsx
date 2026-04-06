import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const STATUS = {
  pending: {
    label: "Pending",
    color: "#92400e",
    bg: "#fffbeb",
    border: "#fde68a",
    dot: "#f59e0b",
  },
  approved: {
    label: "Approved",
    color: "#065f46",
    bg: "#ecfdf5",
    border: "#6ee7b7",
    dot: "#10b981",
  },
  rejected: {
    label: "Rejected",
    color: "#7f1d1d",
    bg: "#fff1f2",
    border: "#fecdd3",
    dot: "#f43f5e",
  },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 99,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          display: "inline-block",
        }}
      />
      {s.label}
    </span>
  );
}

function ActionBtn({ children, variant, onClick, disabled, style = {} }) {
  const [hov, setHov] = useState(false);
  const variants = {
    approve: {
      base: { background: "#10b981", color: "#fff", border: "none" },
      hover: {
        background: "#059669",
        boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
      },
    },
    reject: {
      base: {
        background: "#fff1f2",
        color: "#be123c",
        border: "1.5px solid #fecdd3",
      },
      hover: {
        background: "#ffe4e6",
        boxShadow: "0 4px 14px rgba(244,63,94,0.15)",
      },
    },
    ghost: {
      base: {
        background: "#f8fafc",
        color: "#475569",
        border: "1.5px solid #e2e8f0",
      },
      hover: { background: "#f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    },
    danger: {
      base: { background: "#ef4444", color: "#fff", border: "none" },
      hover: {
        background: "#dc2626",
        boxShadow: "0 4px 14px rgba(239,68,68,0.4)",
      },
    },
  };
  const v = variants[variant] || variants.ghost;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "7px 16px",
        borderRadius: 9,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        fontSize: 12.5,
        transition: "all 0.18s",
        fontFamily: "inherit",
        opacity: disabled ? 0.6 : 1,
        ...v.base,
        ...(hov && !disabled ? v.hover : {}),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, borderColor }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "22px 24px",
        border: "1px solid #f1f5f9",
        borderTop: `3px solid ${borderColor}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        flex: 1,
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontSize: 34,
          fontWeight: 800,
          color: "#0f172a",
          letterSpacing: "-1.5px",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: "#94a3b8",
          marginTop: 6,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: "11px 14px",
        border: `1.5px solid ${color}22`,
        borderTop: `3px solid ${color}`,
        flex: "1 1 110px",
        minWidth: 100,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          color: "#94a3b8",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
        {value ?? 0}
      </div>
    </div>
  );
}

function MiniTable({ headers, rows }) {
  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: 8,
        border: "1px solid #f1f5f9",
      }}
    >
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
      >
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: "7px 10px",
                  textAlign: "left",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  borderBottom: "1.5px solid #e2e8f0",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{
                  padding: "14px",
                  textAlign: "center",
                  color: "#cbd5e1",
                  fontSize: 12,
                }}
              >
                No records yet
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < rows.length - 1 ? "1px solid #f8fafc" : "none",
                }}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    style={{
                      padding: "7px 10px",
                      color: "#334155",
                      verticalAlign: "middle",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Expanded Panel — reads from BACKEND, not localStorage ───────────────────
function HospitalExpandedPanel({ hospital }) {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const BLUE = "#0077a3";
  const token = localStorage.getItem('adminToken') 
           || localStorage.getItem('admin_token')
           || localStorage.getItem('token')
           || localStorage.getItem('authToken');

const fetchDashData = async () => {
  try {
    setLoading(true);
    const res = await axios.get(
      `${BASE_API}/api/hospital/dashboard/${hospital._id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setDashData(res.data.dashboard || null);
  } catch (err) {
    console.warn("Could not fetch dashboard data:", err?.response?.data?.message || err.message);
    setDashData(null);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchDashData();
  // ✅ Auto-refresh every 15 seconds
  const interval = setInterval(fetchDashData, 15000);
  return () => clearInterval(interval);
}, [hospital._id]);

  const d = dashData || {};
  const patients = d.patients || [];
  const appointments = d.appointments || [];
  const doctors = d.doctors || [];
  const departments = d.departments || [];
  const lab = d.lab || [];
  const pharmacy = d.pharmacy || [];
  const billing = d.billing || [];
  const inventory = d.inventory || [];
  const staff = d.staff || [];

  const getStockSt = (item) =>
    +item.qty <= (+item.reorder || 0) ? "Low Stock" : "In Stock";
  const totalBeds = departments.reduce((a, x) => a + (+x.capacity || 0), 0);
  const occBeds = departments.reduce((a, x) => a + (+x.occupied || 0), 0);
  const totalBill = billing.reduce(
    (a, b) =>
      a +
      (parseFloat((b.amount || "0").toString().replace(/[^0-9.]/g, "")) || 0),
    0,
  );
  const totalPaid = billing.reduce(
    (a, b) =>
      a + (parseFloat((b.paid || "0").toString().replace(/[^0-9.]/g, "")) || 0),
    0,
  );

  const SHead = ({ title, count }) => (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 8,
        paddingBottom: 5,
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      {title}
      {count !== undefined && (
        <span
          style={{
            background: "#f1f5f9",
            color: "#94a3b8",
            borderRadius: 20,
            padding: "1px 8px",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );

  return (
    <tr>
      <td
        colSpan={9}
        style={{ padding: 0, borderBottom: `2px solid ${BLUE}22` }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#f0f9ff,#f8fafc)",
            padding: "20px 28px",
          }}
        >
          {/* Hospital identity bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
              background: "#fff",
              borderRadius: 12,
              padding: "14px 18px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: BLUE,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {(hospital.facilityName || "H").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>
                {hospital.facilityName}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
                {hospital.email} · {hospital.phone} · {hospital.city},{" "}
                {hospital.state}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                Reg: {hospital.registrationNumber || "—"} · Beds:{" "}
                {hospital.numberOfBeds || "—"} · Est:{" "}
                {hospital.establishedYear || "—"}
              </div>
            </div>
            <span
              style={{
                background: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #6ee7b7",
                borderRadius: 99,
                padding: "4px 12px",
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              ✓ Approved & Active
            </span>
          </div>

          {loading ? (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "40px",
                textAlign: "center",
                border: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: "3px solid #e2e8f0",
                  borderTopColor: BLUE,
                  borderRadius: "50%",
                  margin: "0 auto 12px",
                  animation: "spin 1s linear infinite",
                }}
              />
              <div style={{ fontSize: 13, color: "#94a3b8" }}>
                Loading dashboard data...
              </div>
            </div>
          ) : (
            // Always render dashboard — shows zeros if no data yet, fills as hospital adds records
            <>
              {/* Stats row */}
              <div style={{ marginBottom: 18 }}>
                <SHead title="Live Dashboard Summary" />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <MiniStat
                    label="Patients"
                    value={patients.length}
                    color={BLUE}
                  />
                  <MiniStat
                    label="Appointments"
                    value={appointments.length}
                    color="#7c3aed"
                  />
                  <MiniStat
                    label="Beds Occ/Total"
                    value={`${occBeds}/${totalBeds}`}
                    color="#f59e0b"
                  />
                  <MiniStat
                    label="Doctors on Duty"
                    value={
                      doctors.filter((doc) => doc.status === "Available").length
                    }
                    color="#10b981"
                  />
                  <MiniStat
                    label="Lab Pending"
                    value={lab.filter((l) => l.status === "Pending").length}
                    color="#f43f5e"
                  />
                  <MiniStat
                    label="Rx Pending"
                    value={
                      pharmacy.filter((p) => p.status === "Pending").length
                    }
                    color="#7c3aed"
                  />
                  <MiniStat
                    label="Unpaid Bills"
                    value={billing.filter((b) => b.status === "Unpaid").length}
                    color="#f43f5e"
                  />
                  <MiniStat
                    label="Low Stock"
                    value={
                      inventory.filter((i) => getStockSt(i) === "Low Stock")
                        .length
                    }
                    color="#f59e0b"
                  />
                  <MiniStat
                    label="Revenue"
                    value={`₹${totalBill.toLocaleString()}`}
                    color="#10b981"
                  />
                  <MiniStat
                    label="Collected"
                    value={`₹${totalPaid.toLocaleString()}`}
                    color={BLUE}
                  />
                </div>
              </div>

              {/* Tables grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {/* Patients */}
                <div>
                  <SHead title="Patients" count={patients.length} />
                  <MiniTable
                    headers={["ID", "Name", "Age", "Dept", "Status"]}
                    rows={patients
                      .slice(0, 5)
                      .map((p) => [
                        <span
                          style={{
                            fontFamily: "monospace",
                            color: BLUE,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {p.id}
                        </span>,
                        <strong>{p.name}</strong>,
                        p.age,
                        p.dept,
                        <span
                          style={{
                            color:
                              p.status === "Emergency"
                                ? "#f43f5e"
                                : p.status === "Admitted"
                                  ? "#7c3aed"
                                  : p.status === "Discharged"
                                    ? "#94a3b8"
                                    : "#10b981",
                            fontWeight: 700,
                          }}
                        >
                          {p.status}
                        </span>,
                      ])}
                  />
                  {patients.length > 5 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        marginTop: 4,
                        textAlign: "right",
                      }}
                    >
                      +{patients.length - 5} more
                    </div>
                  )}
                </div>

                {/* Appointments */}
                <div>
                  <SHead title="Appointments" count={appointments.length} />
                  <MiniTable
                    headers={["ID", "Patient", "Dept", "Time", "Status"]}
                    rows={appointments
                      .slice(0, 5)
                      .map((a) => [
                        <span
                          style={{
                            fontFamily: "monospace",
                            color: BLUE,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {a.id}
                        </span>,
                        <strong>{a.patient}</strong>,
                        a.dept,
                        a.time,
                        <span
                          style={{
                            color:
                              a.status === "Confirmed"
                                ? "#10b981"
                                : a.status === "Cancelled"
                                  ? "#f43f5e"
                                  : "#f59e0b",
                            fontWeight: 700,
                          }}
                        >
                          {a.status}
                        </span>,
                      ])}
                  />
                  {appointments.length > 5 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        marginTop: 4,
                        textAlign: "right",
                      }}
                    >
                      +{appointments.length - 5} more
                    </div>
                  )}
                </div>

                {/* Doctors */}
                <div>
                  <SHead title="Doctors" count={doctors.length} />
                  <MiniTable
                    headers={[
                      "ID",
                      "Name",
                      "Specialization",
                      "Shift",
                      "Status",
                    ]}
                    rows={doctors
                      .slice(0, 5)
                      .map((doc) => [
                        <span
                          style={{
                            fontFamily: "monospace",
                            color: BLUE,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {doc.id}
                        </span>,
                        <strong>{doc.name}</strong>,
                        doc.spec,
                        doc.shift,
                        <span
                          style={{
                            color:
                              doc.status === "Available"
                                ? "#10b981"
                                : "#f59e0b",
                            fontWeight: 700,
                          }}
                        >
                          {doc.status}
                        </span>,
                      ])}
                  />
                </div>

                {/* Departments */}
                <div>
                  <SHead
                    title="Departments & Beds"
                    count={departments.length}
                  />
                  <MiniTable
                    headers={["Name", "Head", "Beds", "Occupied", "OPD"]}
                    rows={departments
                      .slice(0, 5)
                      .map((dept) => [
                        <strong>{dept.name}</strong>,
                        dept.head || "—",
                        dept.capacity,
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              +dept.occupied / +dept.capacity > 0.85
                                ? "#f43f5e"
                                : "#10b981",
                          }}
                        >
                          {dept.occupied}
                        </span>,
                        dept.opd || 0,
                      ])}
                  />
                </div>

                {/* Lab */}
                <div>
                  <SHead title="Lab & Tests" count={lab.length} />
                  <MiniTable
                    headers={["ID", "Patient", "Test", "Status", "Result"]}
                    rows={lab
                      .slice(0, 5)
                      .map((l) => [
                        <span
                          style={{
                            fontFamily: "monospace",
                            color: BLUE,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {l.id}
                        </span>,
                        <strong>{l.patient}</strong>,
                        l.test,
                        <span
                          style={{
                            color:
                              l.status === "Completed" ? "#10b981" : "#f59e0b",
                            fontWeight: 700,
                          }}
                        >
                          {l.status}
                        </span>,
                        l.result || "—",
                      ])}
                  />
                </div>

                {/* Billing */}
                <div>
                  <SHead title="Billing" count={billing.length} />
                  <MiniTable
                    headers={["ID", "Patient", "Total", "Paid", "Status"]}
                    rows={billing.slice(0, 5).map((b) => {
                      const total =
                        parseFloat(
                          (b.amount || "0").toString().replace(/[^0-9.]/g, ""),
                        ) || 0;
                      const paid =
                        parseFloat(
                          (b.paid || "0").toString().replace(/[^0-9.]/g, ""),
                        ) || 0;
                      return [
                        <span
                          style={{
                            fontFamily: "monospace",
                            color: BLUE,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {b.id}
                        </span>,
                        <strong>{b.patient}</strong>,
                        `₹${total.toLocaleString()}`,
                        <span style={{ color: "#10b981", fontWeight: 600 }}>
                          ₹{paid.toLocaleString()}
                        </span>,
                        <span
                          style={{
                            color:
                              b.status === "Paid"
                                ? "#10b981"
                                : b.status === "Unpaid"
                                  ? "#f43f5e"
                                  : "#f59e0b",
                            fontWeight: 700,
                          }}
                        >
                          {b.status}
                        </span>,
                      ];
                    })}
                  />
                  <div
                    style={{
                      marginTop: 7,
                      fontSize: 11.5,
                      color: "#64748b",
                      display: "flex",
                      gap: 12,
                    }}
                  >
                    <span>
                      Billed: <strong>₹{totalBill.toLocaleString()}</strong>
                    </span>
                    <span style={{ color: "#10b981" }}>
                      Paid: <strong>₹{totalPaid.toLocaleString()}</strong>
                    </span>
                    <span style={{ color: "#f43f5e" }}>
                      Due:{" "}
                      <strong>
                        ₹{(totalBill - totalPaid).toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Inventory */}
                <div>
                  <SHead title="Inventory" count={inventory.length} />
                  <MiniTable
                    headers={["ID", "Item", "Category", "Qty", "Status"]}
                    rows={inventory
                      .slice(0, 5)
                      .map((item) => [
                        <span
                          style={{
                            fontFamily: "monospace",
                            color: BLUE,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {item.id}
                        </span>,
                        <strong>{item.item}</strong>,
                        item.category,
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              getStockSt(item) === "Low Stock"
                                ? "#f43f5e"
                                : "#334155",
                          }}
                        >
                          {item.qty}
                        </span>,
                        <span
                          style={{
                            color:
                              getStockSt(item) === "Low Stock"
                                ? "#f43f5e"
                                : "#10b981",
                            fontWeight: 700,
                          }}
                        >
                          {getStockSt(item)}
                        </span>,
                      ])}
                  />
                </div>

                {/* Staff */}
                <div>
                  <SHead title="Staff" count={staff.length} />
                  <MiniTable
                    headers={["ID", "Name", "Role", "Shift", "Status"]}
                    rows={staff
                      .slice(0, 5)
                      .map((s) => [
                        <span
                          style={{
                            fontFamily: "monospace",
                            color: BLUE,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {s.id}
                        </span>,
                        <strong>{s.name}</strong>,
                        s.role,
                        s.shift,
                        <span
                          style={{
                            color:
                              s.status === "Available" ? "#10b981" : "#f59e0b",
                            fontWeight: 700,
                          }}
                        >
                          {s.status}
                        </span>,
                      ])}
                  />
                </div>
              </div>
            </>
          )}

          <div
            style={{
              marginTop: 14,
              textAlign: "center",
              fontSize: 11,
              color: "#cbd5e1",
            }}
          >
            📌 Data is fetched live from the database. Zeros mean the hospital
            portal hasn't been used yet — data auto-updates as they add records.
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function AdminHospitalApproval() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rejectModal, setRejectModal] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState({ open: false, data: null });
  const [actionLoading, setActionLoading] = useState(null);
  const [hovRow, setHovRow] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const token = localStorage.getItem("adminToken");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_API}/api/hospital/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHospitals(res.data.hospitals || []);
    } catch (err) {
      toast.error("Failed to load hospitals");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id, name) => {
    setActionLoading(id + "-approve");
    try {
      await axios.patch(
        `${BASE_API}/api/hospital/approve/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`${name} approved successfully`);
      fetchData();
    } catch (err) {
  console.error(err);
  toast.error(err?.response?.data?.message || "Something went wrong");
}
    finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.id) return;
    setActionLoading(rejectModal.id + "-reject");
    try {
      await axios.patch(
        `${BASE_API}/api/hospital/reject/${rejectModal.id}`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`${rejectModal.name} rejected`);
      setRejectModal({ open: false, id: null, name: "" });
      setRejectReason("");
      fetchData();
    }catch (err) {
  console.error("Rejection error:", err);
  toast.error(err?.response?.data?.message || "Rejection failed");
}
    finally {
      setActionLoading(null);
    }
  };

  const counts = {
    all: hospitals.length,
    pending: hospitals.filter((h) => h.status === "pending").length,
    approved: hospitals.filter((h) => h.status === "approved").length,
    rejected: hospitals.filter((h) => h.status === "rejected").length,
  };

  const filtered = hospitals.filter((h) => {
    const okFilter = filter === "all" || h.status === filter;
    const q = search.toLowerCase();
    const okSearch =
      !q ||
      h.facilityName?.toLowerCase().includes(q) ||
      h.email?.toLowerCase().includes(q) ||
      h.city?.toLowerCase().includes(q) ||
      h.registrationNumber?.toLowerCase().includes(q);
    return okFilter && okSearch;
  });

  const TABS = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div
      style={{
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        background: "#f8fafc",
        minHeight: "100vh",
        padding: "32px 36px",
      }}
    >
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 4,
              height: 36,
              borderRadius: 4,
              background: "linear-gradient(180deg,#0077a3,#005580)",
            }}
          />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.5px",
              }}
            >
              Hospital Approvals
            </h1>
            <p
              style={{ margin: "3px 0 0 0", fontSize: 13.5, color: "#94a3b8" }}
            >
              Review and manage hospital registration requests
            </p>
          </div>
        </div>
        <ActionBtn
          variant="ghost"
          onClick={fetchData}
          style={{ padding: "9px 20px", fontSize: 13 }}
        >
          Refresh
        </ActionBtn>
      </div>

      {/* Stat Cards */}
      <div
        style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}
      >
        <StatCard
          label="Total Hospitals"
          value={counts.all}
          borderColor="#0077a3"
        />
        <StatCard
          label="Pending Review"
          value={counts.pending}
          borderColor="#f59e0b"
        />
        <StatCard
          label="Approved"
          value={counts.approved}
          borderColor="#10b981"
        />
        <StatCard
          label="Rejected"
          value={counts.rejected}
          borderColor="#f43f5e"
        />
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "10px 14px",
          border: "1px solid #f1f5f9",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 3,
            background: "#f8fafc",
            borderRadius: 10,
            padding: 3,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 12.5,
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: filter === t.key ? "#0077a3" : "transparent",
                color: filter === t.key ? "#fff" : "#64748b",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
            >
              {t.label}
              <span
                style={{
                  background:
                    filter === t.key ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                  color: filter === t.key ? "#fff" : "#94a3b8",
                  borderRadius: 20,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#cbd5e1",
              fontSize: 15,
            }}
          >
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, city, reg. number..."
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              borderRadius: 9,
              border: "1.5px solid #e2e8f0",
              fontSize: 13.5,
              outline: "none",
              background: "#f8fafc",
              boxSizing: "border-box",
              color: "#334155",
              fontFamily: "inherit",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#0077a3")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </div>
        <span
          style={{
            fontSize: 12.5,
            color: "#cbd5e1",
            marginLeft: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #f1f5f9",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid #e2e8f0",
                borderTopColor: "#0077a3",
                borderRadius: "50%",
                margin: "0 auto 16px",
              }}
            />
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              Loading hospitals...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#cbd5e1" }}>
              No hospitals found
            </div>
            <div style={{ fontSize: 13, color: "#e2e8f0", marginTop: 4 }}>
              Try adjusting your search or filter
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1.5px solid #e2e8f0",
                }}
              >
                <th style={{ width: 48, padding: "12px 8px 12px 18px" }}></th>
                {[
                  "Hospital",
                  "Contact",
                  "Location",
                  "Type",
                  "Reg. No.",
                  "Registered",
                  "Status",
                  "Actions",
                ].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "12px 18px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => {
                const isHov = hovRow === h._id;
                const isExpanded = expandedId === h._id;
                const isApproved = h.status === "approved";
                return (
                  <React.Fragment key={h._id}>
                    <tr
                      onMouseEnter={() => setHovRow(h._id)}
                      onMouseLeave={() => setHovRow(null)}
                      style={{
                        borderBottom:
                          !isExpanded && i < filtered.length - 1
                            ? "1px solid #f1f5f9"
                            : "none",
                        background: isExpanded
                          ? "#f0f9ff"
                          : isHov
                            ? "#f8fbff"
                            : "#fff",
                        transition: "background 0.14s",
                      }}
                    >
                      {/* Arrow expand cell */}
                      <td style={{ padding: "14px 8px 14px 18px" }}>
                        <button
                          onClick={() =>
                            isApproved &&
                            setExpandedId(isExpanded ? null : h._id)
                          }
                          title={
                            isApproved
                              ? isExpanded
                                ? "Hide dashboard data"
                                : "View dashboard data"
                              : "Only approved hospitals have dashboard data"
                          }
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: `1.5px solid ${isExpanded ? "#0077a3" : isApproved ? "#e2e8f0" : "#f1f5f9"}`,
                            background: isExpanded ? "#0077a3" : "#f8fafc",
                            cursor: isApproved ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                            color: isExpanded
                              ? "#fff"
                              : isApproved
                                ? "#64748b"
                                : "#e2e8f0",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {isExpanded ? "▼" : "▶"}
                        </button>
                      </td>

                      <td
                        style={{ padding: "14px 18px", cursor: "pointer" }}
                        onClick={() => setDetailModal({ open: true, data: h })}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: 14,
                          }}
                        >
                          {h.facilityName || "—"}
                        </div>
                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          {h.email}
                        </div>
                      </td>
                      <td
                        style={{ padding: "14px 18px", cursor: "pointer" }}
                        onClick={() => setDetailModal({ open: true, data: h })}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            color: "#334155",
                            fontWeight: 500,
                          }}
                        >
                          {h.contactPerson || "—"}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            marginTop: 1,
                          }}
                        >
                          {h.phone || ""}
                        </div>
                      </td>
                      <td
                        style={{ padding: "14px 18px", cursor: "pointer" }}
                        onClick={() => setDetailModal({ open: true, data: h })}
                      >
                        <div style={{ fontSize: 13, color: "#334155" }}>
                          {h.city || "—"}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            marginTop: 1,
                          }}
                        >
                          {h.state || ""}
                        </div>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            background: "#e0f2fe",
                            color: "#0369a1",
                            borderRadius: 6,
                            padding: "3px 10px",
                            fontSize: 11.5,
                            fontWeight: 600,
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                          }}
                        >
                          {h.facilityType || "hospital"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 18px",
                          fontSize: 12.5,
                          color: "#64748b",
                          fontFamily: "ui-monospace,monospace",
                        }}
                      >
                        {h.registrationNumber || "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 18px",
                          fontSize: 12,
                          color: "#94a3b8",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h.createdAt
                          ? new Date(h.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <StatusBadge status={h.status} />
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 7,
                            alignItems: "center",
                          }}
                        >
                          {h.status !== "approved" && (
                            <ActionBtn
                              variant="approve"
                              disabled={actionLoading === h._id + "-approve"}
                              onClick={() =>
                                handleApprove(h._id, h.facilityName)
                              }
                            >
                              {actionLoading === h._id + "-approve"
                                ? "Approving..."
                                : "Approve"}
                            </ActionBtn>
                          )}
                          {h.status !== "rejected" && (
                            <ActionBtn
                              variant="reject"
                              onClick={() =>
                                setRejectModal({
                                  open: true,
                                  id: h._id,
                                  name: h.facilityName,
                                })
                              }
                            >
                              Reject
                            </ActionBtn>
                          )}
                          {h.status === "approved" && (
                            <span
                              style={{
                                fontSize: 12,
                                color: "#10b981",
                                fontWeight: 600,
                                padding: "0 4px",
                              }}
                            >
                              Active
                            </span>
                          )}
                          {h.status === "rejected" && (
                            <span
                              style={{
                                fontSize: 12,
                                color: "#f43f5e",
                                fontWeight: 600,
                                padding: "0 4px",
                              }}
                            >
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded dashboard row — fetches from DB */}
                    {isExpanded && isApproved && (
                      <HospitalExpandedPanel hospital={h} />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal.open &&
        detailModal.data &&
        (() => {
          const h = detailModal.data;
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 24,
                backdropFilter: "blur(2px)",
              }}
              onClick={() => setDetailModal({ open: false, data: null })}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  width: "100%",
                  maxWidth: 600,
                  boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(135deg,#0077a3 0%,#004f6e 100%)",
                    padding: "28px 32px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#fff",
                        }}
                      >
                        {h.facilityName}
                      </h2>
                      <p
                        style={{
                          margin: "5px 0 0",
                          fontSize: 13,
                          color: "rgba(255,255,255,0.65)",
                        }}
                      >
                        {h.email}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setDetailModal({ open: false, data: null })
                      }
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "none",
                        color: "#fff",
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        cursor: "pointer",
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <StatusBadge status={h.status} />
                  </div>
                </div>
                <div style={{ padding: "28px 32px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "18px 32px",
                    }}
                  >
                    {[
                      ["Contact Person", h.contactPerson],
                      ["Phone", h.phone],
                      ["City", h.city],
                      ["State", h.state],
                      ["Pin Code", h.pinCode],
                      ["Reg. Number", h.registrationNumber],
                      ["License No.", h.licenseNumber],
                      ["Facility Type", h.facilityType],
                      ["No. of Beds", h.numberOfBeds],
                      ["Est. Year", h.establishedYear],
                    ]
                      .filter(([, v]) => v)
                      .map(([label, val]) => (
                        <div key={label}>
                          <div
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: "#94a3b8",
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              marginBottom: 3,
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              color: "#1e293b",
                              fontWeight: 500,
                            }}
                          >
                            {val}
                          </div>
                        </div>
                      ))}
                  </div>
                  {h.address && (
                    <div
                      style={{
                        marginTop: 20,
                        paddingTop: 20,
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: 4,
                        }}
                      >
                        Address
                      </div>
                      <div
                        style={{
                          fontSize: 13.5,
                          color: "#334155",
                          lineHeight: 1.6,
                        }}
                      >
                        {h.address}
                      </div>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: "16px 32px 28px",
                    display: "flex",
                    gap: 10,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <ActionBtn
                    variant="ghost"
                    onClick={() => setDetailModal({ open: false, data: null })}
                    style={{ flex: 1, padding: "11px" }}
                  >
                    Close
                  </ActionBtn>
                  {h.status !== "approved" && (
                    <ActionBtn
                      variant="approve"
                      onClick={() => {
                        handleApprove(h._id, h.facilityName);
                        setDetailModal({ open: false, data: null });
                      }}
                      style={{ flex: 1, padding: "11px" }}
                    >
                      Approve Hospital
                    </ActionBtn>
                  )}
                  {h.status !== "rejected" && (
                    <ActionBtn
                      variant="danger"
                      onClick={() => {
                        setDetailModal({ open: false, data: null });
                        setRejectModal({
                          open: true,
                          id: h._id,
                          name: h.facilityName,
                        });
                      }}
                      style={{ flex: 1, padding: "11px" }}
                    >
                      Reject Hospital
                    </ActionBtn>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "32px 36px",
              width: 460,
              boxShadow: "0 30px 80px rgba(0,0,0,0.22)",
            }}
          >
            <div
              style={{
                height: 4,
                background: "linear-gradient(90deg,#ef4444,#f97316)",
                borderRadius: 4,
                marginBottom: 24,
              }}
            />
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: 19,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Reject Hospital
            </h3>
            <p style={{ margin: "0 0 4px", fontSize: 13.5, color: "#64748b" }}>
              You are about to reject{" "}
              <strong style={{ color: "#0f172a" }}>{rejectModal.name}</strong>.
            </p>
            <p style={{ margin: "0 0 20px", fontSize: 12.5, color: "#94a3b8" }}>
              This action will block the hospital from logging in. Provide an
              optional reason below.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid registration number, incomplete documents..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1.5px solid #e2e8f0",
                fontSize: 13.5,
                color: "#334155",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                lineHeight: 1.6,
                background: "#f8fafc",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ef4444")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <ActionBtn
                variant="ghost"
                onClick={() => {
                  setRejectModal({ open: false, id: null, name: "" });
                  setRejectReason("");
                }}
                style={{ flex: 1, padding: "11px" }}
              >
                Cancel
              </ActionBtn>
              <ActionBtn
                variant="danger"
                disabled={!!actionLoading}
                onClick={handleReject}
                style={{ flex: 1, padding: "11px" }}
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </ActionBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}