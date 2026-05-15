import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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

// ── NEW: Referral status colors ──────────────────────────────
const REF_STATUS_COLORS = {
  pending:  { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  approved: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

// ── NEW: Designation / Department lists for approve form ─────
const DESIGNATIONS = [
  "Medical Representative","Senior MR","Area Manager","Regional Manager",
  "Zonal Manager","Sales Officer","Marketing Executive","Field Sales Officer",
  "Territory Manager","Business Development Executive","Other",
];
const DEPARTMENTS = ["Sales","Marketing","Field Operations","HR","Finance","Other"];

const adminHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const EMPTY_FORM = {
  fullName: "", email: "", phone: "",
  role: "",
  department: "", designation: "", joiningDate: "",
  salary: "", employmentType: "full_time", status: "active",
  city: "", state: "", adminNote: "",
};

export default function JobHistoryPage() {
  // ── ORIGINAL STATE ───────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [stats, setStats]         = useState({});
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [hiredApps, setHiredApps] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting]   = useState(null);

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]                 = useState(1);
  const LIMIT = 20;

  const [modal, setModal]           = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [detail, setDetail]         = useState(null);

  // ── NEW: Tab state + referral state ─────────────────────────
  const [activeTab, setActiveTab] = useState("staff"); // "staff" | "referrals"

  const [referrals, setReferrals]           = useState([]);
  const [refStats, setRefStats]             = useState({});
  const [refLoading, setRefLoading]         = useState(false);
  const [refSearch, setRefSearch]           = useState("");
  const [refStatusFilter, setRefStatusFilter] = useState("all");
  const [refPage, setRefPage]               = useState(1);
  const [refTotal, setRefTotal]             = useState(0);

  const [refDetail, setRefDetail]           = useState(null);
  const [approveModal, setApproveModal]     = useState(null);
  const [rejectModal, setRejectModal]       = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveForm, setApproveForm]       = useState({
    designation: "", designationOther: "",
    department: "", departmentOther: "",
    joiningDate: "", salary: "", zone: "", status: "active",
  });
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // ── ORIGINAL: fetch employees ────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: LIMIT,
        role: "marketing_agent",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(search && { search }),
      });
      const res = await axios.get(`${API}/api/employees?${params}`, { headers: adminHeaders() });
      setEmployees(res.data.data || []);
      setTotal(res.data.total || 0);
      setStats(res.data.stats || {});
    } catch { toast.error("Failed to load employees"); }
    finally { setLoading(false); }
  }, [page, statusFilter, search]);

  const fetchHiredApps = async () => {
    try {
      const res = await axios.get(`${API}/api/employees/hired-applications`, { headers: adminHeaders() });
      setHiredApps(res.data.data || []);
    } catch { toast.error("Failed to load hired applications"); }
  };

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const fetchReferrals = useCallback(async () => {
  setRefLoading(true);

  try {
    const params = new URLSearchParams({
      page: refPage,
      limit: LIMIT,
      ...(refStatusFilter !== "all" && { status: refStatusFilter }),
      ...(refSearch && { search: refSearch }),
    });

    const res = await axios.get(
      `${API}/api/admin/referrals/all?${params}`,
      { headers: adminHeaders() }
    );

    const referralsData = res.data.referrals || [];

    setReferrals(referralsData);

    setRefTotal(res.data.total || referralsData.length);

    setRefStats({
      total: referralsData.length,
      pending: referralsData.filter(r => r.status === "pending").length,
      approved: referralsData.filter(r => r.status === "approved").length,
      rejected: referralsData.filter(r => r.status === "rejected").length,
    });

  } catch (error) {
    console.error(error);
    toast.error("Failed to load referrals");
  } finally {
    setRefLoading(false);
  }
}, [refPage, refStatusFilter, refSearch]);

  useEffect(() => { if (activeTab === "referrals") fetchReferrals(); }, [fetchReferrals, activeTab]);

  // ── ORIGINAL: employee CRUD ──────────────────────────────────
  const openAdd  = () => { setForm(EMPTY_FORM); setModal("add"); };
  const openEdit = (emp) => {
    setForm({
      fullName: emp.fullName, email: emp.email, phone: emp.phone,
      role: emp.customRole || emp.role || "",
      department: emp.department || "", designation: emp.designation || "",
      joiningDate: emp.joiningDate ? emp.joiningDate.slice(0, 10) : "",
      salary: emp.salary || "", employmentType: emp.employmentType || "full_time",
      status: emp.status, city: emp.city || "", state: emp.state || "",
      adminNote: emp.adminNote || "",
    });
    setEditTarget(emp); setModal("edit");
  };

  const handleSave = async () => {
    if (!form.fullName || !form.email || !form.phone) {
      toast.error("Full name, email and phone are required"); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        role: "marketing_agent",
        customRole: form.role,
        designation: form.designation || form.role,
      };
      if (modal === "add") {
        await axios.post(`${API}/api/employees`, payload, { headers: adminHeaders() });
        toast.success("Employee added!");
      } else {
        await axios.patch(`${API}/api/employees/${editTarget._id}`, payload, { headers: adminHeaders() });
        toast.success("Employee updated!");
      }
      setModal(null); setEditTarget(null);
      fetchEmployees();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee record?")) return;
    try {
      await axios.delete(`${API}/api/employees/${id}`, { headers: adminHeaders() });
      toast.success("Deleted"); fetchEmployees();
    } catch { toast.error("Delete failed"); }
  };

  const handleImport = async (appId) => {
    setImporting(appId);
    try {
      await axios.post(`${API}/api/employees/import/${appId}`, {}, { headers: adminHeaders() });
      toast.success("Imported as employee!"); fetchHiredApps(); fetchEmployees();
    } catch (err) { toast.error(err?.response?.data?.message || "Import failed"); }
    finally { setImporting(null); }
  };

  const handleQuickField = async (emp, field, value) => {
    try {
      const payload = field === "customRole"
        ? { role: "marketing_agent", customRole: value, designation: value }
        : { [field]: value };
      await axios.patch(`${API}/api/employees/${emp._id}`, payload, { headers: adminHeaders() });
      fetchEmployees();
    } catch { toast.error("Update failed"); }
  };

  // ── NEW: referral approve / reject ───────────────────────────
  const openApprove = (ref) => {
    setApproveForm({ designation: "", designationOther: "", department: "", departmentOther: "", joiningDate: "", salary: "", zone: "", status: "active" });
    setApproveModal(ref);
  };
  const openReject = (ref) => { setRejectionReason(""); setRejectModal(ref); };

  const handleApprove = async () => {
    if (!approveForm.designation) { toast.error("Select a designation"); return; }
    if (approveForm.designation === "Other" && !approveForm.designationOther.trim()) { toast.error("Specify designation"); return; }
    if (!approveForm.department) { toast.error("Select a department"); return; }
    if (!approveForm.joiningDate) { toast.error("Joining date is required"); return; }
    if (!approveForm.salary.trim()) { toast.error("Salary is required"); return; }
    if (!approveForm.zone.trim()) { toast.error("Zone is required"); return; }
    setApproving(true);
    try {
      const payload = {
        status: "approved",
        designation: approveForm.designation === "Other" ? approveForm.designationOther : approveForm.designation,
        department:  approveForm.department  === "Other" ? approveForm.departmentOther  : approveForm.department,
        joiningDate: approveForm.joiningDate,
        salary: approveForm.salary,
        zone: approveForm.zone,
        employeeStatus: approveForm.status,
      };
      await axios.put(`${API}/api/admin/referrals/${approveModal._id}/approve`, payload, { headers: adminHeaders() });
      toast.success("Referral approved & added to staff!");
      setApproveModal(null);
      fetchReferrals();
      // Also refresh staff list so new member appears immediately
      fetchEmployees();
    } catch (err) { toast.error(err?.response?.data?.message || "Approval failed"); }
    finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) { toast.error("Please provide a rejection reason"); return; }
    setRejecting(true);
    try {
      await axios.put(`${API}/api/admin/referrals/${rejectModal._id}/reject`,
        { status: "rejected", rejectionReason }, { headers: adminHeaders() });
      toast.success("Referral rejected.");
      setRejectModal(null);
      fetchReferrals();
    } catch (err) { toast.error(err?.response?.data?.message || "Rejection failed"); }
    finally { setRejecting(false); }
  };

  const totalPages    = Math.ceil(total / LIMIT);
  const refTotalPages = Math.ceil(refTotal / LIMIT);
  const empRole = (e) => e.customRole || e.designation || e.role || "—";
  const af = (k, v) => setApproveForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <style>{`
        .jh *, .jh *::before, .jh *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .jh {
          padding: 12px;
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #111827;
          width: 100%;
          max-width: 1400px;
        }

        /* ── Header ── */
        .jh-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }
        .jh-header-title h2 { font-size: 18px; font-weight: 800; color: #111827; }
        .jh-header-title p  { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .jh-header-actions  { display: flex; gap: 8px; flex-wrap: wrap; }

        @media (min-width: 560px) {
          .jh { padding: 16px; }
          .jh-header { flex-direction: row; justify-content: space-between; align-items: flex-start; }
          .jh-header-title h2 { font-size: 20px; }
        }
        @media (min-width: 900px) {
          .jh { padding: 24px; }
          .jh-header-title h2 { font-size: 22px; }
        }

        /* ── NEW: Tabs ── */
        .jh-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 18px;
          border-bottom: 2px solid #e5e7eb;
          overflow-x: auto;
        }
        .jh-tab {
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 700;
          color: #6b7280;
          cursor: pointer;
          border: none;
          background: none;
          font-family: inherit;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s;
        }
        .jh-tab:hover { color: #374151; }
        .jh-tab.active { color: #6366f1; border-bottom-color: #6366f1; }
        .jh-tab-badge {
          background: #fef9c3; color: #b45309;
          font-size: 10px; font-weight: 800;
          padding: 1px 6px; border-radius: 20px;
        }
        .jh-tab.active .jh-tab-badge { background: #ede9fe; color: #6366f1; }

        /* ── Stats ── */
        .jh-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        @media (min-width: 400px) { .jh-stats { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 640px) { .jh-stats { grid-template-columns: repeat(5, 1fr); gap: 10px; } }

        .jh-stat-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          min-width: 0;
        }
        .jh-stat-card p:first-child {
          font-size: 10px; color: #6b7280; font-weight: 600;
          text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .jh-stat-card p:last-child { font-size: 20px; font-weight: 800; }

        /* ── Filters ── */
        .jh-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 14px;
          align-items: center;
        }
        .jh-filters input,
        .jh-filters select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1.5px solid #e5e7eb;
          font-size: 13px;
          background: #fff;
          font-family: inherit;
          outline: none;
          min-height: 38px;
        }
        .jh-filters input  { flex: 1; min-width: 140px; }
        .jh-filters select { min-width: 130px; flex-shrink: 0; }

        /* ── Main box ── */
        .jh-box {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border: 1px solid #f0f0f0;
          overflow: hidden;
        }

        /* ── Mobile cards (< 600px) ── */
        .jh-cards { display: flex; flex-direction: column; }
        .jh-card {
          padding: 12px 14px;
          border-bottom: 1px solid #f3f4f6;
        }
        .jh-card:last-child { border-bottom: none; }
        .jh-card-row1 {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 10px;
        }
        .jh-card-meta { flex: 1; min-width: 0; }
        .jh-card-meta-name {
          font-weight: 700; font-size: 14px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .jh-card-meta-email  { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .jh-card-meta-id     { font-size: 11px; color: #9ca3af; margin-top: 1px; font-family: monospace; }
        .jh-card-controls    { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 10px; }
        .jh-card-actions     { display: flex; gap: 6px; flex-wrap: wrap; }

        /* ── Tablet / Desktop table ── */
        .jh-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          background: linear-gradient(to right, white 30%, rgba(255,255,255,0)),
                      linear-gradient(to right, rgba(255,255,255,0), white 70%) 100% 0,
                      linear-gradient(to right, rgba(0,0,0,0.06), rgba(0,0,0,0)),
                      linear-gradient(to left,  rgba(0,0,0,0.06), rgba(0,0,0,0)) 100% 0;
          background-size: 40px 100%, 40px 100%, 14px 100%, 14px 100%;
          background-repeat: no-repeat;
          background-attachment: local, local, scroll, scroll;
        }
        .jh-table      { width: 100%; border-collapse: collapse; min-width: 900px; }
        .jh-th {
          padding: 10px 12px; text-align: left; font-size: 10px;
          font-weight: 700; color: #6b7280; text-transform: uppercase;
          letter-spacing: .04em; white-space: nowrap;
          border-bottom: 1px solid #e5e7eb; background: #f9fafb;
          position: sticky; top: 0; z-index: 1;
        }
        .jh-td {
          padding: 11px 12px; font-size: 13px; color: #374151;
          vertical-align: middle; border-bottom: 1px solid #f3f4f6;
        }

        /* ── Breakpoint toggles ── */
        .jh-mobile   { display: block; }
        .jh-tablet   { display: none; }
        .jh-desktop  { display: none; }
        @media (min-width: 600px) {
          .jh-mobile  { display: none; }
          .jh-tablet  { display: block; }
          .jh-desktop { display: none; }
        }
        @media (min-width: 1024px) {
          .jh-mobile  { display: none; }
          .jh-tablet  { display: none; }
          .jh-desktop { display: block; }
        }

        /* ── Inline inputs ── */
        .jh-inline-input {
          padding: 5px 8px; border-radius: 7px;
          border: 1.5px solid #e5e7eb; font-size: 12px;
          background: #fff; font-family: inherit; outline: none; width: 100%;
        }
        .jh-inline-input:focus { border-color: #6366f1; }

        /* ── Badges ── */
        .jh-badge {
          padding: 3px 9px; border-radius: 20px;
          font-size: 11px; font-weight: 700; white-space: nowrap;
          display: inline-block;
        }

        /* ── Buttons ── */
        .jh-btn {
          padding: 6px 12px; border: none; border-radius: 8px;
          cursor: pointer; font-weight: 600; font-size: 12px;
          font-family: inherit; white-space: nowrap;
          min-height: 32px; display: inline-flex; align-items: center; justify-content: center;
        }
        .jh-btn-view    { background: #f0fdf4; color: #15803d; }
        .jh-btn-edit    { background: #EEF2FF; color: #6366f1; }
        .jh-btn-del     { background: #FEF2F2; color: #ef4444; }
        .jh-btn-approve { background: #f0fdf4; color: #15803d; }
        .jh-btn-reject  { background: #fef2f2; color: #dc2626; }
        .jh-btn-import  { background: #10b981; color: #fff; padding: 7px 14px; font-size: 13px; }
        .jh-btn-primary {
          background: #6366f1; color: #fff;
          padding: 10px 18px; border-radius: 10px;
          font-weight: 700; font-size: 13px; min-height: 40px;
          border: none; cursor: pointer; font-family: inherit;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .jh-btn-cancel  {
          background: #f3f4f6; color: #374151;
          padding: 10px 14px; border-radius: 10px;
          font-weight: 600; font-size: 13px; min-height: 40px;
          border: none; cursor: pointer; font-family: inherit;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .jh-btn-hired   {
          background: #FFFBEB; color: #d97706;
          border: 1.5px solid #FDE68A;
          padding: 9px 16px; border-radius: 10px;
          font-weight: 700; font-size: 13px; cursor: pointer;
          font-family: inherit; min-height: 40px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .jh-btn-add {
          background: #6366f1; color: #fff;
          border: none; padding: 9px 16px; border-radius: 10px;
          font-weight: 700; font-size: 13px; cursor: pointer;
          font-family: inherit; min-height: 40px;
          display: inline-flex; align-items: center; justify-content: center;
        }

        /* ── Pagination ── */
        .jh-page {
          display: flex; justify-content: center; align-items: center;
          gap: 10px; padding: 14px; border-top: 1px solid #f3f4f6;
          flex-wrap: wrap;
        }
        .jh-page button {
          padding: 6px 14px; border-radius: 8px;
          border: 1.5px solid #e5e7eb; background: #fff;
          cursor: pointer; font-weight: 600; font-size: 13px;
          min-height: 36px;
        }
        .jh-page button:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Overlay ── */
        .jh-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 1000; padding: 0;
        }
        @media (min-width: 560px) {
          .jh-overlay { align-items: center; padding: 16px; }
        }

        /* ── Modals ── */
        .jh-modal, .jh-modal-lg {
          background: #fff;
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          border-radius: 16px 16px 0 0;
          padding: 20px 16px;
          box-shadow: 0 -4px 30px rgba(0,0,0,0.15);
        }
        @media (min-width: 560px) {
          .jh-modal    { max-width: 520px; border-radius: 16px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
          .jh-modal-lg { max-width: 680px; border-radius: 16px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        }

        /* ── Form ── */
        .jh-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 420px) {
          .jh-form-grid { grid-template-columns: 1fr 1fr; }
        }
        .jh-label { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 4px; display: block; }
        .jh-input {
          padding: 9px 12px; border-radius: 8px;
          border: 1.5px solid #e5e7eb; font-size: 13px;
          outline: none; font-family: inherit; width: 100%;
          min-height: 40px;
        }
        .jh-input:focus { border-color: #6366f1; }
        .jh-select {
          padding: 9px 12px; border-radius: 8px;
          border: 1.5px solid #e5e7eb; font-size: 13px;
          background: #fff; font-family: inherit; width: 100%;
          outline: none; min-height: 40px;
        }
        .jh-modal-footer {
          display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;
        }
        .jh-modal-footer .jh-btn-primary,
        .jh-modal-footer .jh-btn-cancel { flex: 1; min-width: 120px; }

        /* ── Detail rows ── */
        .jh-detail-row { display: flex; padding: 7px 0; border-bottom: 1px solid #f3f4f6; gap: 8px; }
        .jh-detail-key { width: 130px; min-width: 130px; font-size: 12px; font-weight: 700; color: #6b7280; flex-shrink: 0; }
        .jh-detail-val { font-size: 13px; color: #111827; word-break: break-word; }
        .jh-section-title { font-size: 11px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.06em; margin: 14px 0 6px; }

        /* ── Empty / loading ── */
        .jh-center { padding: 40px 20px; text-align: center; color: #9ca3af; }

        /* ── Source pill ── */
        .jh-pill-app    { font-size: 10px; font-weight: 700; background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 20px; display: inline-block; }
        .jh-pill-manual { font-size: 10px; font-weight: 700; background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 20px; display: inline-block; }
        .jh-pill-ref    { font-size: 10px; font-weight: 700; background: #fdf4ff; color: #a21caf; padding: 3px 8px; border-radius: 20px; display: inline-block; }

        /* ── Drag handle ── */
        .jh-modal-handle {
          width: 40px; height: 4px; background: #e5e7eb;
          border-radius: 4px; margin: 0 auto 16px; display: block;
        }
        @media (min-width: 560px) { .jh-modal-handle { display: none; } }

        .jh-scroll-hint {
          font-size: 11px; color: #9ca3af; padding: 6px 14px 0;
          display: flex; align-items: center; gap: 4px;
        }
        @media (min-width: 1024px) { .jh-scroll-hint { display: none; } }

        /* ── NEW: referral info box ── */
        .jh-ref-alert {
          padding: 10px 14px; border-radius: 10px;
          background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
          font-size: 12px; margin-bottom: 14px; line-height: 1.5;
        }
        .jh-textarea { resize: vertical; min-height: 80px; }
      `}</style>

      <div className="jh">

        {/* ── Header ── */}
        <div className="jh-header">
          <div className="jh-header-title">
            <h2>Marketing Staff Directory</h2>
            <p>Manage roles, designations and candidate referrals for your marketing team</p>
          </div>
          {activeTab === "staff" && (
            <div className="jh-header-actions">
              <button className="jh-btn-hired" onClick={() => { fetchHiredApps(); setShowImport(true); }}>
                Import Hired
              </button>
              <button className="jh-btn-add" onClick={openAdd}>+ Add Staff</button>
            </div>
          )}
        </div>

        {/* ── NEW: Tabs ── */}
        <div className="jh-tabs">
          <button
            className={`jh-tab ${activeTab === "staff" ? "active" : ""}`}
            onClick={() => setActiveTab("staff")}
          >
            👥 Marketing Staff
            <span className="jh-tab-badge">{stats.total ?? 0}</span>
          </button>
          <button
            className={`jh-tab ${activeTab === "referrals" ? "active" : ""}`}
            onClick={() => setActiveTab("referrals")}
          >
            📋 Agent Referrals
            <span className="jh-tab-badge">{refStats.pending ?? "—"} pending</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            ORIGINAL STAFF TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === "staff" && (
          <>
            {/* ── Stats ── */}
            <div className="jh-stats">
              {[
                { label: "Total Staff", value: stats.total    ?? 0, color: "#6366f1" },
                { label: "Active",      value: stats.active   ?? 0, color: "#10b981" },
                { label: "Inactive",    value: stats.inactive ?? 0, color: "#f59e0b" },
                { label: "Marketing",   value: stats.marketing ?? 0, color: "#8b5cf6" },
                { label: "Delivery",    value: stats.delivery ?? 0, color: "#0ea5e9" },
              ].map(s => (
                <div key={s.label} className="jh-stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                  <p>{s.label}</p>
                  <p style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* ── Filters ── */}
            <div className="jh-filters">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name, email, ID, role..."
              />
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            {/* ── Main card ── */}
            <div className="jh-box">
              {loading ? (
                <div className="jh-center">Loading...</div>
              ) : employees.length === 0 ? (
                <div className="jh-center">
                  No marketing staff found. Add someone or import from hired candidates.
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="jh-mobile">
                    <div className="jh-cards">
                      {employees.map(emp => {
                        const sc = STATUS_COLORS[emp.status] || STATUS_COLORS.active;
                        return (
                          <div key={emp._id} className="jh-card">
                            <div className="jh-card-row1">
                              <div className="jh-card-meta">
                                <div className="jh-card-meta-name">{emp.fullName}</div>
                                <div className="jh-card-meta-email">{emp.email}</div>
                                <div className="jh-card-meta-id">{emp.employeeId}</div>
                              </div>
                              <span className="jh-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                {emp.status}
                              </span>
                            </div>
                            <div style={{ marginBottom: 10 }}>
                              <label className="jh-label">Role / Designation</label>
                              <input
                                className="jh-inline-input"
                                defaultValue={empRole(emp)}
                                onBlur={e => { if (e.target.value !== empRole(emp)) handleQuickField(emp, "customRole", e.target.value); }}
                                placeholder="e.g. Area Sales Manager"
                              />
                            </div>
                            <div className="jh-card-controls">
                              <select
                                value={emp.status}
                                onChange={e => handleQuickField(emp, "status", e.target.value)}
                                className="jh-inline-input"
                                style={{ width: "auto", minWidth: 120 }}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="terminated">Terminated</option>
                              </select>
                              <span style={{ fontSize: 12, color: "#6b7280" }}>
                                {EMP_TYPES.find(t => t.value === emp.employmentType)?.label}
                              </span>
                            </div>
                            <div className="jh-card-actions">
                              <button className="jh-btn jh-btn-view" onClick={() => setDetail(emp)}>View</button>
                              <button className="jh-btn jh-btn-edit" onClick={() => openEdit(emp)}>Edit</button>
                              <button className="jh-btn jh-btn-del"  onClick={() => handleDelete(emp._id)}>Delete</button>
                              {emp.sourceType === "job_application" && <span className="jh-pill-app">Job App</span>}
                              {emp.sourceType === "referral"        && <span className="jh-pill-ref">Referral</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tablet */}
                  <div className="jh-tablet">
                    <div className="jh-table-wrap">
                      <table className="jh-table">
                        <thead>
                          <tr>
                            {["ID","Name & Email","Phone","Role / Designation","Type","Status","Joined","Source","Actions"].map(h => (
                              <th key={h} className="jh-th">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map(emp => {
                            const sc = STATUS_COLORS[emp.status] || STATUS_COLORS.active;
                            return (
                              <tr key={emp._id}
                                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <td className="jh-td" style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>{emp.employeeId || "—"}</td>
                                <td className="jh-td" style={{ minWidth: 160 }}>
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{emp.fullName}</div>
                                  <div style={{ fontSize: 11, color: "#6b7280" }}>{emp.email}</div>
                                </td>
                                <td className="jh-td" style={{ whiteSpace: "nowrap" }}>{emp.phone}</td>
                                <td className="jh-td" style={{ minWidth: 160 }}>
                                  <input
                                    className="jh-inline-input"
                                    defaultValue={empRole(emp)}
                                    onBlur={e => { if (e.target.value !== empRole(emp)) handleQuickField(emp, "customRole", e.target.value); }}
                                    placeholder="e.g. Area Sales Manager"
                                  />
                                </td>
                                <td className="jh-td" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                                  {EMP_TYPES.find(t => t.value === emp.employmentType)?.label || "—"}
                                </td>
                                <td className="jh-td">
                                  <select
                                    value={emp.status}
                                    onChange={e => handleQuickField(emp, "status", e.target.value)}
                                    className="jh-inline-input"
                                    style={{ background: sc.bg, color: sc.color, borderColor: sc.border, minWidth: 108 }}
                                  >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="terminated">Terminated</option>
                                  </select>
                                </td>
                                <td className="jh-td" style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                                  {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN") : "—"}
                                </td>
                                <td className="jh-td">
                                  {emp.sourceType === "job_application" ? <span className="jh-pill-app">Job App</span>
                                  : emp.sourceType === "referral"       ? <span className="jh-pill-ref">Referral</span>
                                  : <span className="jh-pill-manual">Manual</span>}
                                </td>
                                <td className="jh-td">
                                  <div style={{ display: "flex", gap: 5, whiteSpace: "nowrap" }}>
                                    <button className="jh-btn jh-btn-view" onClick={() => setDetail(emp)}>View</button>
                                    <button className="jh-btn jh-btn-edit" onClick={() => openEdit(emp)}>Edit</button>
                                    <button className="jh-btn jh-btn-del"  onClick={() => handleDelete(emp._id)}>Del</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="jh-scroll-hint">← Scroll horizontally to see all columns →</div>
                  </div>

                  {/* Desktop */}
                  <div className="jh-desktop">
                    <div className="jh-table-wrap">
                      <table className="jh-table">
                        <thead>
                          <tr>
                            {["ID","Name & Email","Phone","Role / Designation","Type","Status","Joined","Source","Actions"].map(h => (
                              <th key={h} className="jh-th">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map(emp => {
                            const sc = STATUS_COLORS[emp.status] || STATUS_COLORS.active;
                            return (
                              <tr key={emp._id}
                                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <td className="jh-td" style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{emp.employeeId || "—"}</td>
                                <td className="jh-td">
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{emp.fullName}</div>
                                  <div style={{ fontSize: 11, color: "#6b7280" }}>{emp.email}</div>
                                </td>
                                <td className="jh-td">{emp.phone}</td>
                                <td className="jh-td">
                                  <input
                                    className="jh-inline-input"
                                    defaultValue={empRole(emp)}
                                    onBlur={e => { if (e.target.value !== empRole(emp)) handleQuickField(emp, "customRole", e.target.value); }}
                                    placeholder="e.g. Area Sales Manager"
                                    style={{ maxWidth: 180 }}
                                  />
                                </td>
                                <td className="jh-td" style={{ fontSize: 12 }}>
                                  {EMP_TYPES.find(t => t.value === emp.employmentType)?.label || "—"}
                                </td>
                                <td className="jh-td">
                                  <select
                                    value={emp.status}
                                    onChange={e => handleQuickField(emp, "status", e.target.value)}
                                    className="jh-inline-input"
                                    style={{ background: sc.bg, color: sc.color, borderColor: sc.border, width: 108 }}
                                  >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="terminated">Terminated</option>
                                  </select>
                                </td>
                                <td className="jh-td" style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                                  {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN") : "—"}
                                </td>
                                <td className="jh-td">
                                  {emp.sourceType === "job_application" ? <span className="jh-pill-app">Job App</span>
                                  : emp.sourceType === "referral"       ? <span className="jh-pill-ref">Referral</span>
                                  : <span className="jh-pill-manual">Manual</span>}
                                </td>
                                <td className="jh-td">
                                  <div style={{ display: "flex", gap: 5 }}>
                                    <button className="jh-btn jh-btn-view" onClick={() => setDetail(emp)}>View</button>
                                    <button className="jh-btn jh-btn-edit" onClick={() => openEdit(emp)}>Edit</button>
                                    <button className="jh-btn jh-btn-del"  onClick={() => handleDelete(emp._id)}>Del</button>
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

              {totalPages > 1 && (
                <div className="jh-page">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                  <span style={{ fontSize: 13, color: "#374151" }}>{page} / {totalPages} ({total})</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            NEW: REFERRALS TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === "referrals" && (
          <>
            {/* Stats */}
            <div className="jh-stats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
              {[
                { label: "Total",    value: refStats.total    ?? 0, color: "#6366f1" },
                { label: "Pending",  value: refStats.pending  ?? 0, color: "#d97706" },
                { label: "Approved", value: refStats.approved ?? 0, color: "#15803d" },
                { label: "Rejected", value: refStats.rejected ?? 0, color: "#dc2626" },
              ].map(s => (
                <div key={s.label} className="jh-stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                  <p>{s.label}</p>
                  <p style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="jh-ref-alert">
              ℹ️ <strong>Referral Workflow:</strong> Agents submit candidates with complete details. Review each referral below — assign designation & department, then approve to add them to marketing staff, or reject with a reason.
            </div>

            {/* Filters */}
            <div className="jh-filters">
              <input
                value={refSearch}
                onChange={e => { setRefSearch(e.target.value); setRefPage(1); }}
                placeholder="Search name, phone, email, agent..."
              />
              <select value={refStatusFilter} onChange={e => { setRefStatusFilter(e.target.value); setRefPage(1); }}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="jh-box">
              {refLoading ? (
                <div className="jh-center">Loading referrals...</div>
              ) : referrals.length === 0 ? (
                <div className="jh-center">No referrals found. Agents submit referrals from their panel.</div>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="jh-mobile">
                    <div className="jh-cards">
                      {referrals.map(ref => {
                        const sc = REF_STATUS_COLORS[ref.status] || REF_STATUS_COLORS.pending;
                        return (
                          <div key={ref._id} className="jh-card">
                            <div className="jh-card-row1">
                              <div className="jh-card-meta">
                                <div className="jh-card-meta-name">{ref.fullName}</div>
                                <div className="jh-card-meta-email">{ref.phone} · WA: {ref.whatsapp}</div>
                                <div className="jh-card-meta-email">{ref.email}</div>
                              </div>
                              <span className="jh-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{ref.status}</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginBottom: 10, fontSize: 12 }}>
                              <div><span style={{ color: "#9ca3af", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Qualification</span><br />{ref.highestQualification}</div>
                              <div><span style={{ color: "#9ca3af", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Referred by</span><br />{ref.agentName || "—"}</div>
                              {ref.status === "approved" && ref.designation && (
                                <div style={{ gridColumn: "span 2" }}>
                                  <span className="jh-badge" style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>✓ {ref.designation}</span>
                                </div>
                              )}
                              {ref.status === "rejected" && ref.rejectionReason && (
                                <div style={{ gridColumn: "span 2", color: "#dc2626", fontSize: 11 }}>❌ {ref.rejectionReason}</div>
                              )}
                            </div>
                            <div className="jh-card-actions">
                              <button className="jh-btn jh-btn-view" onClick={() => setRefDetail(ref)}>View</button>
                              {ref.status === "pending" && <>
                                <button className="jh-btn jh-btn-approve" onClick={() => openApprove(ref)}>Approve</button>
                                <button className="jh-btn jh-btn-reject"  onClick={() => openReject(ref)}>Reject</button>
                              </>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tablet + Desktop shared table */}
                  <div style={{ display: "none" }} className="jh-tablet jh-desktop">
                  </div>
                  <div className="jh-tablet">
                    <div className="jh-table-wrap">
                      <table className="jh-table">
                        <thead><tr>
                          {["Candidate","Phone / WhatsApp","Qualification","Referred By","Date","Status","Designation","Actions"].map(h=>(
                            <th key={h} className="jh-th">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {referrals.map(ref => {
                            const sc = REF_STATUS_COLORS[ref.status] || REF_STATUS_COLORS.pending;
                            return (
                              <tr key={ref._id}
                                onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
                                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                <td className="jh-td">
                                  <div style={{fontWeight:700,fontSize:13}}>{ref.fullName}</div>
                                  <div style={{fontSize:11,color:"#6b7280"}}>{ref.email}</div>
                                </td>
                                <td className="jh-td" style={{fontSize:12}}>
                                  <div>{ref.phone}</div>
                                  <div style={{color:"#6b7280"}}>WA: {ref.whatsapp}</div>
                                  {ref.alternatePhone && <div style={{color:"#9ca3af"}}>Alt: {ref.alternatePhone}</div>}
                                </td>
                                <td className="jh-td" style={{fontSize:12}}>{ref.highestQualification === "Other" ? ref.qualificationOther : ref.highestQualification}</td>
                                <td className="jh-td" style={{fontSize:12,color:"#6b7280"}}>{ref.agentName || "—"}</td>
                                <td className="jh-td" style={{fontSize:11,color:"#9ca3af",whiteSpace:"nowrap"}}>
                                  {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString("en-IN") : "—"}
                                </td>
                                <td className="jh-td">
                                  <span className="jh-badge" style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{ref.status}</span>
                                </td>
                                <td className="jh-td">
                                  {ref.status === "approved" && ref.designation
                                    ? <span className="jh-badge" style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",fontSize:10}}>{ref.designation}</span>
                                    : <span style={{color:"#9ca3af",fontSize:12}}>—</span>}
                                </td>
                                <td className="jh-td">
                                  <div style={{display:"flex",gap:5,whiteSpace:"nowrap"}}>
                                    <button className="jh-btn jh-btn-view" onClick={() => setRefDetail(ref)}>View</button>
                                    {ref.status === "pending" && <>
                                      <button className="jh-btn jh-btn-approve" onClick={() => openApprove(ref)}>Approve</button>
                                      <button className="jh-btn jh-btn-reject"  onClick={() => openReject(ref)}>Reject</button>
                                    </>}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="jh-scroll-hint">← Scroll horizontally to see all columns →</div>
                  </div>

                  <div className="jh-desktop">
                    <div className="jh-table-wrap">
                      <table className="jh-table">
                        <thead><tr>
                          {["Candidate","Phone","WhatsApp","Alt Phone","Qualification","Referred By","Date","Status","Designation","Actions"].map(h=>(
                            <th key={h} className="jh-th">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {referrals.map(ref => {
                            const sc = REF_STATUS_COLORS[ref.status] || REF_STATUS_COLORS.pending;
                            return (
                              <tr key={ref._id}
                                onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
                                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                <td className="jh-td">
                                  <div style={{fontWeight:700,fontSize:13}}>{ref.fullName}</div>
                                  <div style={{fontSize:11,color:"#6b7280"}}>{ref.email}</div>
                                </td>
                                <td className="jh-td">{ref.phone}</td>
                                <td className="jh-td">{ref.whatsapp || "—"}</td>
                                <td className="jh-td" style={{color:"#9ca3af"}}>{ref.alternatePhone || "—"}</td>
                                <td className="jh-td" style={{fontSize:12}}>{ref.highestQualification === "Other" ? ref.qualificationOther : ref.highestQualification}</td>
                                <td className="jh-td" style={{fontSize:12,color:"#6b7280"}}>{ref.agentName || "—"}</td>
                                <td className="jh-td" style={{fontSize:11,color:"#9ca3af",whiteSpace:"nowrap"}}>
                                  {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString("en-IN") : "—"}
                                </td>
                                <td className="jh-td">
                                  <span className="jh-badge" style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{ref.status}</span>
                                </td>
                                <td className="jh-td">
                                  {ref.status === "approved" && ref.designation
                                    ? <span className="jh-badge" style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",fontSize:10}}>{ref.designation}</span>
                                    : <span style={{color:"#9ca3af",fontSize:12}}>—</span>}
                                </td>
                                <td className="jh-td">
                                  <div style={{display:"flex",gap:5}}>
                                    <button className="jh-btn jh-btn-view" onClick={() => setRefDetail(ref)}>View</button>
                                    {ref.status === "pending" && <>
                                      <button className="jh-btn jh-btn-approve" onClick={() => openApprove(ref)}>Approve</button>
                                      <button className="jh-btn jh-btn-reject"  onClick={() => openReject(ref)}>Reject</button>
                                    </>}
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

              {refTotalPages > 1 && (
                <div className="jh-page">
                  <button onClick={() => setRefPage(p => Math.max(1, p - 1))} disabled={refPage === 1}>← Prev</button>
                  <span style={{ fontSize: 13, color: "#374151" }}>{refPage} / {refTotalPages} ({refTotal})</span>
                  <button onClick={() => setRefPage(p => Math.min(refTotalPages, p + 1))} disabled={refPage === refTotalPages}>Next →</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            ORIGINAL: ADD / EDIT MODAL (unchanged)
        ══════════════════════════════════════════════════════ */}
        {modal && (
          <div className="jh-overlay">
            <div className="jh-modal">
              <span className="jh-modal-handle" />
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>
                {modal === "add" ? "Add Marketing Staff" : "Edit Staff Member"}
              </h3>

              <div className="jh-form-grid">
                {[
                  { label: "Full Name *",  key: "fullName",    type: "text" },
                  { label: "Email *",      key: "email",       type: "email" },
                  { label: "Phone *",      key: "phone",       type: "text" },
                  { label: "City",         key: "city",        type: "text" },
                  { label: "State",        key: "state",       type: "text" },
                  { label: "Joining Date", key: "joiningDate", type: "date" },
                  { label: "Salary (₹)",  key: "salary",      type: "number" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="jh-label">{f.label}</label>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="jh-input"
                    />
                  </div>
                ))}

                <div>
                  <label className="jh-label">Role / Designation *</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    className="jh-input"
                    placeholder="e.g. Area Sales Manager..."
                  />
                </div>

                <div>
                  <label className="jh-label">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    className="jh-input"
                    placeholder="e.g. North Zone Sales"
                  />
                </div>

                <div>
                  <label className="jh-label">Employment Type</label>
                  <select
                    value={form.employmentType}
                    onChange={e => setForm(p => ({ ...p, employmentType: e.target.value }))}
                    className="jh-select"
                  >
                    {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="jh-label">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="jh-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="jh-label">Admin Note</label>
                <textarea
                  value={form.adminNote}
                  onChange={e => setForm(p => ({ ...p, adminNote: e.target.value }))}
                  className="jh-input"
                  style={{ minHeight: 64, resize: "vertical" }}
                  placeholder="Internal notes about this staff member..."
                />
              </div>

              <div className="jh-modal-footer">
                <button onClick={handleSave} disabled={saving} className="jh-btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : modal === "add" ? "Add Staff Member" : "Save Changes"}
                </button>
                <button onClick={() => { setModal(null); setEditTarget(null); }} className="jh-btn-cancel">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ORIGINAL: IMPORT MODAL (unchanged) ── */}
        {showImport && (
          <div className="jh-overlay">
            <div className="jh-modal-lg">
              <span className="jh-modal-handle" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Import Hired Candidates</h3>
                <button onClick={() => setShowImport(false)} className="jh-btn-cancel" style={{ padding: "6px 12px" }}>✕</button>
              </div>

              {hiredApps.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "30px 0", fontSize: 14 }}>
                  No hired candidates found. Mark applications as "hired" in the Jobs section first.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {hiredApps.map(app => (
                    <div key={app._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: 10, flexWrap: "wrap", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{app.fullName}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{app.email} · {app.phone}</div>
                        <div style={{ fontSize: 12, color: "#6366f1", marginTop: 2, fontWeight: 600 }}>Applied for: {app.applyingFor}</div>
                      </div>
                      {app.alreadyImported ? (
                        <span className="jh-badge" style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", fontSize: 12 }}>
                          ✓ Already imported
                        </span>
                      ) : (
                        <button onClick={() => handleImport(app._id)} disabled={importing === app._id} className="jh-btn jh-btn-import">
                          {importing === app._id ? "Importing..." : "Import as Staff"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ORIGINAL: EMPLOYEE DETAIL MODAL (unchanged) ── */}
        {detail && (
          <div className="jh-overlay" onClick={() => setDetail(null)}>
            <div className="jh-modal" onClick={e => e.stopPropagation()}>
              <span className="jh-modal-handle" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800 }}>Staff Details</h3>
                <button onClick={() => setDetail(null)} className="jh-btn-cancel" style={{ padding: "6px 12px" }}>✕</button>
              </div>

              {[
                ["Employee ID",  detail.employeeId || "—"],
                ["Full Name",    detail.fullName],
                ["Email",        detail.email],
                ["Phone",        detail.phone],
                ["Role",         empRole(detail)],
                ["Department",   detail.department || "—"],
                ["Employment",   EMP_TYPES.find(t => t.value === detail.employmentType)?.label || "—"],
                ["Status",       detail.status],
                ["Salary",       detail.salary ? `₹${Number(detail.salary).toLocaleString("en-IN")}` : "—"],
                ["City",         detail.city || "—"],
                ["State",        detail.state || "—"],
                ["Joining Date", detail.joiningDate ? new Date(detail.joiningDate).toLocaleDateString("en-IN") : "—"],
                ["Source",       detail.sourceType === "job_application" ? "Hired via Job Application" : detail.sourceType === "referral" ? "Agent Referral" : "Manually Added"],
                ["Added On",     new Date(detail.createdAt).toLocaleDateString("en-IN")],
                ["Note",         detail.adminNote || "—"],
              ].map(([k, v]) => (
                <div key={k} className="jh-detail-row">
                  <span className="jh-detail-key">{k}</span>
                  <span className="jh-detail-val">{v}</span>
                </div>
              ))}

              <button
                onClick={() => { openEdit(detail); setDetail(null); }}
                className="jh-btn-primary"
                style={{ marginTop: 16, width: "100%", fontSize: 14 }}
              >
                Edit This Staff Member
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            NEW: REFERRAL DETAIL MODAL
        ══════════════════════════════════════════════════════ */}
        {refDetail && (
          <div className="jh-overlay" onClick={() => setRefDetail(null)}>
            <div className="jh-modal-lg" onClick={e => e.stopPropagation()}>
              <span className="jh-modal-handle" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Full Referral Details</h3>
                <button onClick={() => setRefDetail(null)} className="jh-btn-cancel" style={{ padding: "6px 12px" }}>✕</button>
              </div>

              {/* Identity bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                  {refDetail.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{refDetail.fullName}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{refDetail.email}</div>
                  {(() => { const sc = REF_STATUS_COLORS[refDetail.status] || REF_STATUS_COLORS.pending; return (
                    <span className="jh-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, marginTop: 4, display: "inline-block" }}>{refDetail.status}</span>
                  ); })()}
                </div>
              </div>

              <div className="jh-section-title">👤 Personal</div>
              {[["Gender",refDetail.gender],["Date of Birth",refDetail.dob],["Father's Name",refDetail.fatherName],["Mother's Name",refDetail.motherName||"—"],["Current Address",refDetail.currentAddress],["Permanent Address",refDetail.permanentAddress||"—"]].map(([k,v])=>(
                <div key={k} className="jh-detail-row"><span className="jh-detail-key">{k}</span><span className="jh-detail-val">{v}</span></div>
              ))}

              <div className="jh-section-title">🎓 Education</div>
              {[
                ["Qualification", refDetail.highestQualification === "Other" ? refDetail.qualificationOther : refDetail.highestQualification],
                ["Stream", refDetail.stream === "Other" ? refDetail.streamOther : (refDetail.stream||"—")],
                ["Institution", refDetail.institution],["Passing Year",refDetail.passingYear],["Percentage",refDetail.percentage],
                ["Extra Courses",refDetail.additionalCourses||"—"],
              ].map(([k,v])=>(
                <div key={k} className="jh-detail-row"><span className="jh-detail-key">{k}</span><span className="jh-detail-val">{v}</span></div>
              ))}
              {refDetail.resumeUrl
                ? <a href={refDetail.resumeUrl} target="_blank" rel="noreferrer" style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:9,border:"1.5px solid #e5e7eb",background:"#f8fafc",color:"#374151",fontSize:12,fontWeight:700,cursor:"pointer",textDecoration:"none",marginTop:8 }}>📄 Download Resume</a>
                : <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>No resume uploaded</div>
              }

              <div className="jh-section-title"> Contact</div>
              {[["Mobile",refDetail.phone],["WhatsApp",refDetail.whatsapp],["Alternate",refDetail.alternatePhone||"—"],["Email",refDetail.email],["LinkedIn",refDetail.linkedin||"—"]].map(([k,v])=>(
                <div key={k} className="jh-detail-row"><span className="jh-detail-key">{k}</span><span className="jh-detail-val">{v}</span></div>
              ))}

              <div className="jh-section-title">🔗 Referral Info</div>
              {[["Referred By",refDetail.agentName||refDetail.agentId||"—"],["Relation",refDetail.relationWithCandidate],["Agent's Note",refDetail.referralNote||"—"]].map(([k,v])=>(
                <div key={k} className="jh-detail-row"><span className="jh-detail-key">{k}</span><span className="jh-detail-val">{v}</span></div>
              ))}

              {refDetail.status === "approved" && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0", color: "#15803d", fontSize: 13 }}>
                  ✅ Approved · Designation: <strong>{refDetail.designation}</strong> · Dept: <strong>{refDetail.department}</strong>
                </div>
              )}
              {refDetail.status === "rejected" && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca", color: "#dc2626", fontSize: 13 }}>
                  ❌ Rejected: {refDetail.rejectionReason}
                </div>
              )}

              {refDetail.status === "pending" && (
                <div className="jh-modal-footer">
                  <button onClick={() => { setRefDetail(null); openApprove(refDetail); }} className="jh-btn-primary" style={{ background: "#15803d" }}>✓ Approve</button>
                  <button onClick={() => { setRefDetail(null); openReject(refDetail); }}  className="jh-btn-cancel"  style={{ background: "#fef2f2", color: "#dc2626" }}>✕ Reject</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── NEW: APPROVE MODAL ── */}
        {approveModal && (
          <div className="jh-overlay">
            <div className="jh-modal">
              <span className="jh-modal-handle" />
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>✅ Approve Referral</h3>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 18 }}>
                Approving: <strong>{approveModal.fullName}</strong> — assign role before confirming.
              </p>
              <div className="jh-form-grid">
                <div>
                  <label className="jh-label">Designation *</label>
                  <select value={approveForm.designation} onChange={e => af("designation", e.target.value)} className="jh-select">
                    <option value="">Select…</option>
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {approveForm.designation === "Other" && (
                  <div>
                    <label className="jh-label">Specify Designation *</label>
                    <input value={approveForm.designationOther} onChange={e => af("designationOther", e.target.value)} className="jh-input" placeholder="Enter designation" />
                  </div>
                )}
                <div>
                  <label className="jh-label">Department *</label>
                  <select value={approveForm.department} onChange={e => af("department", e.target.value)} className="jh-select">
                    <option value="">Select…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {approveForm.department === "Other" && (
                  <div>
                    <label className="jh-label">Specify Department *</label>
                    <input value={approveForm.departmentOther} onChange={e => af("departmentOther", e.target.value)} className="jh-input" placeholder="Enter department" />
                  </div>
                )}
                <div>
                  <label className="jh-label">Zone *</label>
                  <input value={approveForm.zone} onChange={e => af("zone", e.target.value)} className="jh-input" placeholder="e.g. North Zone" />
                </div>
                <div>
                  <label className="jh-label">Joining Date *</label>
                  <input type="date" value={approveForm.joiningDate} onChange={e => af("joiningDate", e.target.value)} className="jh-input" />
                </div>
                <div>
                  <label className="jh-label">Salary *</label>
                  <input value={approveForm.salary} onChange={e => af("salary", e.target.value)} className="jh-input" placeholder="e.g. ₹30000" />
                </div>
                <div>
                  <label className="jh-label">Employee Status</label>
                  <select value={approveForm.status} onChange={e => af("status", e.target.value)} className="jh-select">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: 12 }}>
                On approval, this candidate is automatically added to the Marketing Staff tab with the assigned role.
              </div>
              <div className="jh-modal-footer">
                <button onClick={handleApprove} disabled={approving} className="jh-btn-primary" style={{ background: "#15803d", opacity: approving ? 0.7 : 1 }}>
                  {approving ? "Approving…" : "✓ Confirm Approval"}
                </button>
                <button onClick={() => setApproveModal(null)} className="jh-btn-cancel">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── NEW: REJECT MODAL ── */}
        {rejectModal && (
          <div className="jh-overlay">
            <div className="jh-modal">
              <span className="jh-modal-handle" />
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>✕ Reject Referral</h3>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
                Rejecting: <strong>{rejectModal.fullName}</strong>. Provide a reason for the agent.
              </p>
              <label className="jh-label">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="jh-input jh-textarea"
                placeholder="e.g. Qualification does not meet requirements, no vacancy in that zone..."
              />
              <div className="jh-modal-footer">
                <button onClick={handleReject} disabled={rejecting} className="jh-btn-primary" style={{ background: "#dc2626", opacity: rejecting ? 0.7 : 1 }}>
                  {rejecting ? "Rejecting…" : "✕ Confirm Rejection"}
                </button>
                <button onClick={() => setRejectModal(null)} className="jh-btn-cancel">Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}