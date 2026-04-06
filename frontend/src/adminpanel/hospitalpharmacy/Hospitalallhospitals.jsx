import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_API, C, GS } from "./_hospitalSharedUtils";
import { PageHeader, SearchBar, RejectModal, DetailModal, HospitalTable } from "./_shared";

export default function HospitalAllHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastSync, setLastSync]   = useState(null);
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState("newest");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [detailTarget, setDetailTarget]   = useState(null);
  const token = localStorage.getItem("adminToken");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${BASE_API}/api/hospital/all`, { headers: { Authorization: `Bearer ${token}` } });
      setHospitals(res.data.hospitals || []);
      setLastSync(new Date());
    } catch { if (!silent) toast.error("Failed to load hospitals"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(() => fetchData(true), 30000); return () => clearInterval(iv); }, [fetchData]);

  const handleApprove = async (id, name) => {
    setActionLoading(id + "-approve");
    try {
      await axios.patch(`${BASE_API}/api/hospital/approve/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${name} approved`); fetchData(true);
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget._id + "-reject");
    try {
      await axios.patch(`${BASE_API}/api/hospital/reject/${rejectTarget._id}`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${rejectTarget.facilityName} rejected`); setRejectTarget(null); fetchData(true);
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setActionLoading(null); }
  };

  const filtered = hospitals
    .filter(h => {
      const q = search.toLowerCase();
      return !q || h.facilityName?.toLowerCase().includes(q) || h.email?.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q) || h.registrationNumber?.toLowerCase().includes(q) || h.contactPerson?.toLowerCase().includes(q) || h.state?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === "newest")  return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest")  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "name")    return (a.facilityName || "").localeCompare(b.facilityName || "");
      if (sort === "beds")    return (+b.numberOfBeds || 0) - (+a.numberOfBeds || 0);
      return 0;
    });

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <style>{GS}</style>
      <PageHeader title="Hospital Zone — All Hospitals" sub={`${hospitals.length} hospitals registered on platform`} lastSync={lastSync} onRefresh={() => fetchData()} />

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "10px 14px", border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, city, state, reg. number..." />
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 9, border: `1.5px solid ${C.border2}`, fontSize: 13, background: C.bg, color: "#334155", fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A–Z</option>
          <option value="beds">Most Beds</option>
        </select>
        <span style={{ fontSize: 12.5, color: "#cbd5e1", whiteSpace: "nowrap", marginLeft: "auto" }}>{filtered.length} of {hospitals.length} records</span>
      </div>

      <HospitalTable hospitals={filtered} loading={loading} expandedId={expandedId} setExpandedId={setExpandedId}
        onDetail={setDetailTarget} onApprove={handleApprove} onReject={setRejectTarget} actionLoading={actionLoading}
        emptyMsg="No hospitals match your search" />

      {detailTarget && <DetailModal hospital={detailTarget} onClose={() => setDetailTarget(null)} onApprove={handleApprove} onReject={h => { setDetailTarget(null); setRejectTarget(h); }} />}
      {rejectTarget && <RejectModal hospital={rejectTarget} onConfirm={handleRejectConfirm} onCancel={() => setRejectTarget(null)} loading={!!actionLoading} />}
    </div>
  );
}