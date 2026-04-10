import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ROLES = [
  { value: "marketing_agent",  label: "Marketing Agent" },
  { value: "delivery_agent",   label: "Delivery Agent" },
  { value: "sales_manager",    label: "Sales Manager" },
  { value: "hr",               label: "HR" },
  { value: "accountant",       label: "Accountant" },
  { value: "operations",       label: "Operations" },
  { value: "admin",            label: "Admin" },
  { value: "intern",           label: "Intern" },
  { value: "other",            label: "Other" },
];

const EMP_TYPES = [
  { value: "full_time",  label: "Full Time" },
  { value: "part_time",  label: "Part Time" },
  { value: "contract",   label: "Contract" },
  { value: "intern",     label: "Intern" },
];

const STATUS_COLORS = {
  active:     { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  inactive:   { bg: "#fef9c3", color: "#854d0e", border: "#fde68a" },
  terminated: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

const adminHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const EMPTY_FORM = {
  fullName: "", email: "", phone: "", role: "marketing_agent",
  customRole: "", department: "", designation: "", joiningDate: "",
  salary: "", employmentType: "full_time", status: "active",
  city: "", state: "", adminNote: "",
};

export default function JobHistoryPage() {
  const [employees, setEmployees]   = useState([]);
  const [stats, setStats]           = useState({});
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [hiredApps, setHiredApps]   = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting]   = useState(null);

  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]             = useState(1);
  const LIMIT = 20;

  const [modal, setModal]       = useState(null); // null | "add" | "edit"
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [detail, setDetail]     = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: LIMIT,
        ...(roleFilter !== "all"   && { role: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(search && { search }),
      });
      const res = await axios.get(`${API}/api/employees?${params}`, {
        headers: adminHeaders(),
      });
      setEmployees(res.data.data || []);
      setTotal(res.data.total || 0);
      setStats(res.data.stats || {});
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, search]);

  const fetchHiredApps = async () => {
    try {
      const res = await axios.get(`${API}/api/employees/hired-applications`, {
        headers: adminHeaders(),
      });
      setHiredApps(res.data.data || []);
    } catch {
      toast.error("Failed to load hired applications");
    }
  };

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal("add"); };
  const openEdit = (emp) => {
    setForm({
      fullName: emp.fullName, email: emp.email, phone: emp.phone,
      role: emp.role, customRole: emp.customRole || "",
      department: emp.department || "", designation: emp.designation || "",
      joiningDate: emp.joiningDate ? emp.joiningDate.slice(0, 10) : "",
      salary: emp.salary || "", employmentType: emp.employmentType || "full_time",
      status: emp.status, city: emp.city || "", state: emp.state || "",
      adminNote: emp.adminNote || "",
    });
    setEditTarget(emp);
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.fullName || !form.email || !form.phone || !form.role) {
      toast.error("Fill required fields"); return;
    }
    setSaving(true);
    try {
      if (modal === "add") {
        await axios.post(`${API}/api/employees`, form, { headers: adminHeaders() });
        toast.success("Employee added!");
      } else {
        await axios.patch(`${API}/api/employees/${editTarget._id}`, form, {
          headers: adminHeaders(),
        });
        toast.success("Employee updated!");
      }
      setModal(null); setEditTarget(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await axios.delete(`${API}/api/employees/${id}`, { headers: adminHeaders() });
      toast.success("Deleted"); fetchEmployees();
    } catch { toast.error("Delete failed"); }
  };

  const handleImport = async (appId) => {
    setImporting(appId);
    try {
      await axios.post(`${API}/api/employees/import/${appId}`, {}, {
        headers: adminHeaders(),
      });
      toast.success("Imported as employee!");
      fetchHiredApps(); fetchEmployees();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Import failed");
    } finally {
      setImporting(null);
    }
  };

  const handleQuickRoleChange = async (emp, newRole) => {
    try {
      await axios.patch(`${API}/api/employees/${emp._id}`,
        { role: newRole }, { headers: adminHeaders() });
      toast.success("Role updated!");
      fetchEmployees();
    } catch { toast.error("Failed to update role"); }
  };

  const handleQuickStatusChange = async (emp, newStatus) => {
    try {
      await axios.patch(`${API}/api/employees/${emp._id}`,
        { status: newStatus }, { headers: adminHeaders() });
      toast.success("Status updated!");
      fetchEmployees();
    } catch { toast.error("Failed to update status"); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const roleLabel  = (r, custom) => r === "other" ? (custom || "Other") : (ROLES.find(x => x.value === r)?.label || r);

  return (
    <>
      <style>{`
        .eh-page { padding: 20px; font-family: 'Segoe UI', sans-serif; max-width: 1400px; }
        .eh-stats { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 20px; }
        @media(min-width:600px){ .eh-stats { grid-template-columns: repeat(3,1fr); } }
        @media(min-width:900px){ .eh-stats { grid-template-columns: repeat(5,1fr); } }
        .eh-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .eh-table-wrap { overflow-x: auto; }
        .eh-table-wrap table { min-width: 900px; width: 100%; border-collapse: collapse; }
        .eh-mobile { display: flex; flex-direction: column; gap: 0; }
        .eh-card { padding: 14px; border-bottom: 1px solid #f3f4f6; }
        .show-table { display: none; } .show-cards { display: block; }
        @media(min-width: 900px){ .show-table { display: block; } .show-cards { display: none; } }
        .eh-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
        .eh-modal { background: #fff; border-radius: 16px; padding: 24px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .eh-import-modal { background: #fff; border-radius: 16px; padding: 24px; width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .eh-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media(max-width:500px){ .eh-form-grid { grid-template-columns: 1fr; } }
        .eh-input { padding: 9px 12px; border-radius: 8px; border: 1.5px solid #e5e7eb; font-size: 13px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
        .eh-label { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 4px; display: block; }
        .eh-select { padding: 9px 12px; border-radius: 8px; border: 1.5px solid #e5e7eb; font-size: 13px; background: #fff; font-family: inherit; width: 100%; }
        .eh-btn-primary { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 14px; font-family: inherit; }
        .eh-btn-cancel  { padding: 10px 16px; background: #f3f4f6; color: #374151; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 13px; font-family: inherit; }
        .eh-btn-import  { padding: 6px 14px; background: #10b981; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 12px; font-family: inherit; }
        .eh-btn-edit    { padding: 5px 12px; background: #EEF2FF; color: #6366f1; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; }
        .eh-btn-delete  { padding: 5px 12px; background: #FEF2F2; color: #ef4444; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; }
        .eh-btn-view    { padding: 5px 12px; background: #f0fdf4; color: #15803d; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; }
        .eh-role-select { padding: 4px 8px; border-radius: 6px; border: 1.5px solid #e5e7eb; font-size: 12px; background: #fff; cursor: pointer; }
        .eh-status-select { padding: 4px 8px; border-radius: 6px; border: 1.5px solid #e5e7eb; font-size: 12px; background: #fff; cursor: pointer; }
      `}</style>

      <div className="eh-page">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Job History</h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Manage all staff, roles, and imported candidates</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => { fetchHiredApps(); setShowImport(true); }}
              style={{ padding: "10px 18px", background: "#FFFBEB", color: "#d97706", border: "1.5px solid #FDE68A", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              Import Hired
            </button>
            <button onClick={openAdd} className="eh-btn-primary">+ Add Employee</button>
          </div>
        </div>

        {/* Stats */}
        <div className="eh-stats">
          {[
            { label: "Total",     value: stats.total    ?? 0, color: "#6366f1" },
            { label: "Active",    value: stats.active   ?? 0, color: "#10b981" },
            { label: "Inactive",  value: stats.inactive ?? 0, color: "#f59e0b" },
            { label: "Marketing", value: stats.marketing ?? 0, color: "#8b5cf6" },
            { label: "Delivery",  value: stats.delivery ?? 0, color: "#0ea5e9" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderTopWidth: 3, borderTopColor: s.color, borderRadius: 12, padding: "12px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="eh-filters">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email, ID..." className="eh-input" style={{ flex: 1, minWidth: 200 }} />
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="eh-select" style={{ width: "auto" }}>
            <option value="all">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="eh-select" style={{ width: "auto" }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        {/* Table / Cards */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#6b7280" }}>Loading employees...</div>
          ) : employees.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af" }}>No employees found.</div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="show-cards">
                <div className="eh-mobile">
                  {employees.map(emp => {
                    const sc = STATUS_COLORS[emp.status] || STATUS_COLORS.active;
                    return (
                      <div key={emp._id} className="eh-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{emp.fullName}</p>
                            <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{emp.email}</p>
                            <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{emp.employeeId}</p>
                          </div>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            {emp.status}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                          <select value={emp.role} onChange={e => handleQuickRoleChange(emp, e.target.value)} className="eh-role-select">
                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                          <select value={emp.status} onChange={e => handleQuickStatusChange(emp, e.target.value)} className="eh-status-select">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="terminated">Terminated</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setDetail(emp)} className="eh-btn-view">View</button>
                          <button onClick={() => openEdit(emp)} className="eh-btn-edit">Edit</button>
                          <button onClick={() => handleDelete(emp._id)} className="eh-btn-delete">Delete</button>
                        </div>
                        {emp.sourceType === "job_application" && (
                          <span style={{ display: "inline-block", marginTop: 6, fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 20 }}>
                            Hired via Job Application
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Table */}
              <div className="show-table">
                <div className="eh-table-wrap">
                  <table>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        {["ID", "Name", "Phone", "Role", "Designation", "Type", "Status", "Joined", "Source", "Actions"].map(h => (
                          <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => {
                        const sc = STATUS_COLORS[emp.status] || STATUS_COLORS.active;
                        return (
                          <tr key={emp._id} style={{ borderBottom: "1px solid #f3f4f6" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>{emp.employeeId || "—"}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <p style={{ fontWeight: 700, margin: 0, fontSize: 13 }}>{emp.fullName}</p>
                              <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{emp.email}</p>
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: 13 }}>{emp.phone}</td>
                            <td style={{ padding: "12px 14px" }}>
                              {/* Inline role edit */}
                              <select value={emp.role} onChange={e => handleQuickRoleChange(emp, e.target.value)} className="eh-role-select">
                                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{emp.designation || "—"}</td>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151" }}>
                              {EMP_TYPES.find(t => t.value === emp.employmentType)?.label || emp.employmentType}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <select value={emp.status} onChange={e => handleQuickStatusChange(emp, e.target.value)}
                                className="eh-status-select"
                                style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="terminated">Terminated</option>
                              </select>
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                              {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN") : "—"}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              {emp.sourceType === "job_application"
                                ? <span style={{ fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: 20 }}>Job App</span>
                                : <span style={{ fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 20 }}>Manual</span>}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => setDetail(emp)} className="eh-btn-view">View</button>
                                <button onClick={() => openEdit(emp)} className="eh-btn-edit">Edit</button>
                                <button onClick={() => handleDelete(emp._id)} className="eh-btn-delete">Del</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, padding: "16px 20px", borderTop: "1px solid #f3f4f6" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600 }}>← Prev</button>
              <span style={{ fontSize: 13, color: "#374151" }}>{page} / {totalPages} ({total})</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600 }}>Next →</button>
            </div>
          )}
        </div>

        {/* ADD / EDIT MODAL */}
        {modal && (
          <div className="eh-modal-overlay">
            <div className="eh-modal">
              <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800 }}>
                {modal === "add" ? "Add Employee" : "Edit Employee"}
              </h3>
              <div className="eh-form-grid">
                {[
                  { label: "Full Name *", key: "fullName", type: "text" },
                  { label: "Email *",     key: "email",    type: "email" },
                  { label: "Phone *",     key: "phone",    type: "text" },
                  { label: "Designation", key: "designation", type: "text" },
                  { label: "Department",  key: "department",  type: "text" },
                  { label: "City",        key: "city",        type: "text" },
                  { label: "State",       key: "state",       type: "text" },
                  { label: "Joining Date",key: "joiningDate", type: "date" },
                  { label: "Salary (₹)", key: "salary",      type: "number" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="eh-label">{f.label}</label>
                    <input type={f.type} value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="eh-input" />
                  </div>
                ))}

                <div>
                  <label className="eh-label">Role *</label>
                  <select value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))} className="eh-select">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                {form.role === "other" && (
                  <div>
                    <label className="eh-label">Custom Role</label>
                    <input value={form.customRole} onChange={e => setForm(prev => ({ ...prev, customRole: e.target.value }))} className="eh-input" placeholder="e.g. Legal Advisor" />
                  </div>
                )}

                <div>
                  <label className="eh-label">Employment Type</label>
                  <select value={form.employmentType} onChange={e => setForm(prev => ({ ...prev, employmentType: e.target.value }))} className="eh-select">
                    {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="eh-label">Status</label>
                  <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} className="eh-select">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="eh-label">Admin Note</label>
                <textarea value={form.adminNote} onChange={e => setForm(prev => ({ ...prev, adminNote: e.target.value }))}
                  className="eh-input" style={{ minHeight: 70, resize: "vertical" }} placeholder="Internal notes..." />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <button onClick={handleSave} disabled={saving} className="eh-btn-primary">
                  {saving ? "Saving..." : modal === "add" ? "Add Employee" : "Save Changes"}
                </button>
                <button onClick={() => { setModal(null); setEditTarget(null); }} className="eh-btn-cancel">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* IMPORT HIRED MODAL */}
        {showImport && (
          <div className="eh-modal-overlay">
            <div className="eh-import-modal">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Import Hired Candidates</h3>
                <button onClick={() => setShowImport(false)} className="eh-btn-cancel">✕ Close</button>
              </div>
              {hiredApps.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "30px 0" }}>No hired candidates found in job applications.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {hiredApps.map(app => (
                    <div key={app._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: 10, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>{app.fullName}</p>
                        <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{app.email} · {app.phone}</p>
                        <p style={{ fontSize: 12, color: "#6366f1", margin: "2px 0 0", fontWeight: 600 }}>Applied for: {app.applyingFor}</p>
                      </div>
                      {app.alreadyImported ? (
                        <span style={{ fontSize: 12, fontWeight: 700, background: "#f0fdf4", color: "#15803d", padding: "4px 12px", borderRadius: 20, border: "1px solid #bbf7d0" }}>
                          ✓ Already imported
                        </span>
                      ) : (
                        <button onClick={() => handleImport(app._id)} disabled={importing === app._id} className="eh-btn-import">
                          {importing === app._id ? "Importing..." : "Import as Employee"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DETAIL MODAL */}
        {detail && (
          <div className="eh-modal-overlay" onClick={() => setDetail(null)}>
            <div className="eh-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>👤 Employee Detail</h3>
                <button onClick={() => setDetail(null)} className="eh-btn-cancel">✕ Close</button>
              </div>
              {[
                ["Employee ID",  detail.employeeId || "—"],
                ["Full Name",    detail.fullName],
                ["Email",        detail.email],
                ["Phone",        detail.phone],
                ["Role",         roleLabel(detail.role, detail.customRole)],
                ["Designation",  detail.designation || "—"],
                ["Department",   detail.department  || "—"],
                ["Employment",   EMP_TYPES.find(t => t.value === detail.employmentType)?.label || "—"],
                ["Status",       detail.status],
                ["Salary",       detail.salary ? `₹${Number(detail.salary).toLocaleString("en-IN")}` : "—"],
                ["City",         detail.city  || "—"],
                ["State",        detail.state || "—"],
                ["Joined",       detail.joiningDate ? new Date(detail.joiningDate).toLocaleDateString("en-IN") : "—"],
                ["Source",       detail.sourceType === "job_application" ? "Job Application" : "Manual"],
                ["Added On",     new Date(detail.createdAt).toLocaleDateString("en-IN")],
                ["Note",         detail.adminNote || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f3f4f6", gap: 8 }}>
                  <span style={{ width: 130, minWidth: 130, fontSize: 12, fontWeight: 700, color: "#6b7280", flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#111827", wordBreak: "break-word" }}>{v}</span>
                </div>
              ))}
              <button onClick={() => { openEdit(detail); setDetail(null); }}
                style={{ ...{}, marginTop: 16, width: "100%" }} className="eh-btn-primary">
                Edit This Employee
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}