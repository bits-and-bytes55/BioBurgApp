import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Shield,
  ShieldOff,
  CheckCircle,
  MoreVertical,
  Download,
  Mail,
  Phone,
  Building,
  Calendar,
  AlertCircle,
  Star,
  TrendingUp,
  UserCheck,
  ExternalLink,
  Package,
  RefreshCw,
  X,
  MessageSquare,
  BarChart2,
  UserX,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL + "/api";

// ── Vendor Detail Modal ────────────────────────────────────────────────────
function VendorDetailModal({ vendor, onClose, onBlock }) {
  if (!vendor) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {vendor.businessName?.charAt(0) || vendor.fullName?.charAt(0) || "V"}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {vendor.businessName || vendor.fullName}
              </h3>
              <p className="text-indigo-100 text-sm">{vendor.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Vendor ID */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Vendor ID</p>
            <p className="text-sm font-mono font-bold text-gray-800 break-all">{vendor._id}</p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Full Name", value: vendor.fullName },
              { label: "Business Name", value: vendor.businessName },
              { label: "Email", value: vendor.email },
              { label: "Phone", value: vendor.phone || vendor.altPhone || "Not provided" },
              { label: "Business Type", value: vendor.businessType || "General" },
              { label: "GST Number", value: vendor.gstNumber || "Not provided" },
              { label: "PAN Number", value: vendor.panNumber || "Not provided" },
              { label: "City", value: vendor.city || "Not set" },
              { label: "State", value: vendor.state || "Not set" },
              { label: "Pincode", value: vendor.pincode || "Not set" },
              { label: "Registration Type", value: vendor.registrationType || "—" },
              { label: "Joined", value: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
              </div>
            ))}
          </div>

          {/* Drug Licenses */}
          {(vendor.drugLicenseNumber1 || vendor.drugLicenseNumber2) && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Drug License Numbers</p>
              <div className="flex flex-wrap gap-2">
                {[vendor.drugLicenseNumber1, vendor.drugLicenseNumber2, vendor.drugLicenseNumber3, vendor.drugLicenseNumber4]
                  .filter(Boolean)
                  .map((lic, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-mono border border-blue-200">
                      {lic}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-700">Account Status</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {vendor.isApproved ? "This vendor is currently approved and active" : "This vendor account is not approved"}
              </p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${vendor.isApproved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {vendor.isApproved ? "Approved" : "Blocked"}
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-0 flex gap-3 flex-wrap">
          <button
            onClick={() => { onBlock(vendor._id, false); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
          >
            <ShieldOff className="w-4 h-4" />
            Block Vendor
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApprovedVendors({ onView }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "businessName", direction: "asc" });
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [actionMenu, setActionMenu] = useState(null);
  const [viewingVendor, setViewingVendor] = useState(null); // for modal
  const [actionLoading, setActionLoading] = useState({});
  const menuRef = useRef(null);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchVendors();
  }, []);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // FIXED: correct endpoint
      const res = await axios.get(`${API}/vendor/admin/approved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Handle both array and object response shapes
      const data = res.data?.data || res.data?.vendors || res.data || [];
      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, isApproved) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.put(
        `${API}/vendor/admin/${id}/status`,
        { isApproved },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchVendors();
    } catch (error) {
      console.error("Error updating vendor status:", error);
      alert("Failed to update vendor status. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // FIXED: safe onView handler — works whether prop is passed or not
  const handleView = (vendor) => {
    if (typeof onView === "function") {
      onView(vendor._id);
    } else {
      // Fallback: open our own modal
      setViewingVendor(vendor);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAndSortedVendors = useMemo(() => {
    let result = [...vendors];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (v) =>
          v.businessName?.toLowerCase().includes(q) ||
          v.fullName?.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q) ||
          v.phone?.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q)
      );
    }

    if (filterStatus === "approved") result = result.filter((v) => v.isApproved);
    if (filterStatus === "blocked") result = result.filter((v) => !v.isApproved);

    result.sort((a, b) => {
      const av = a[sortConfig.key] || "";
      const bv = b[sortConfig.key] || "";
      const cmp = String(av).toLowerCase().localeCompare(String(bv).toLowerCase());
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });

    return result;
  }, [vendors, searchTerm, filterStatus, sortConfig]);

  const handleSelectAll = (e) => {
    setSelectedVendors(
      e.target.checked ? filteredAndSortedVendors.map((v) => v._id) : []
    );
  };

  const handleSelectVendor = (id) => {
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]
    );
  };

  const handleBulkBlock = async () => {
    if (!window.confirm(`Block ${selectedVendors.length} vendor(s)?`)) return;
    await Promise.all(selectedVendors.map((id) => toggleStatus(id, false)));
    setSelectedVendors([]);
  };

  const handleExport = () => {
    const rows = [
      ["ID", "Business Name", "Full Name", "Email", "Phone", "City", "State", "GST", "Status", "Joined"],
      ...filteredAndSortedVendors.map((v) => [
        v._id,
        v.businessName || "",
        v.fullName || "",
        v.email || "",
        v.phone || "",
        v.city || "",
        v.state || "",
        v.gstNumber || "",
        v.isApproved ? "Approved" : "Blocked",
        v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `approved_vendors_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPerformanceScore = (vendor) => {
    const base = 70;
    const order = Math.min((vendor.totalOrders || 0) * 2, 20);
    const rating = Math.round((vendor.avgRating || 4) * 2);
    return Math.min(base + order + rating, 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-12 bg-gray-200 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vendor Detail Modal */}
      {viewingVendor && (
        <VendorDetailModal
          vendor={viewingVendor}
          onClose={() => setViewingVendor(null)}
          onBlock={toggleStatus}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approved Vendors</h2>
          <p className="text-gray-600 mt-1">Manage and monitor approved vendor accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchVendors}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Approved",
            value: vendors.length,
            icon: <UserCheck className="w-6 h-6 text-green-600" />,
            bg: "bg-green-50",
            sub: `${vendors.filter((v) => v.isApproved).length} currently active`,
            subColor: "text-green-600",
          },
          {
            label: "Active Vendors",
            value: vendors.filter((v) => v.isApproved).length,
            icon: <CheckCircle className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-50",
            sub: "Approved & enabled",
            subColor: "text-gray-500",
          },
          {
            label: "Blocked",
            value: vendors.filter((v) => !v.isApproved).length,
            icon: <ShieldOff className="w-6 h-6 text-red-500" />,
            bg: "bg-red-50",
            sub: "Needs review",
            subColor: "text-red-500",
          },
          {
            label: "Showing",
            value: filteredAndSortedVendors.length,
            icon: <Filter className="w-6 h-6 text-purple-600" />,
            bg: "bg-purple-50",
            sub: "After filters",
            subColor: "text-gray-500",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
              <div className={`p-3 ${s.bg} rounded-full`}>{s.icon}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className={`text-xs ${s.subColor}`}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter bar */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, phone, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Vendors</option>
              <option value="approved">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        {/* Bulk actions */}
        {selectedVendors.length > 0 && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">
                {selectedVendors.length} vendor(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkBlock}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition flex items-center gap-1"
              >
                <ShieldOff className="w-4 h-4" />
                Block Selected
              </button>
              <button
                onClick={() => setSelectedVendors([])}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedVendors.length === filteredAndSortedVendors.length &&
                      filteredAndSortedVendors.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                {[
                  { key: "businessName", label: "Business Name" },
                  { key: null, label: "Contact Info" },
                  { key: null, label: "Performance" },
                  { key: "isApproved", label: "Status" },
                  { key: null, label: "Actions" },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${col.key ? "cursor-pointer hover:bg-gray-100" : ""}`}
                    onClick={() => col.key && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.key && sortConfig.key === col.key && (
                        sortConfig.direction === "asc"
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mb-3 mx-auto" />
                    <p className="text-gray-500 text-lg">No vendors found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm ? "Try adjusting your search" : "No approved vendors yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedVendors.map((vendor) => {
                  const score = getPerformanceScore(vendor);
                  const isLoading = actionLoading[vendor._id];

                  return (
                    <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">
                      {/* Checkbox */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedVendors.includes(vendor._id)}
                          onChange={() => handleSelectVendor(vendor._id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Business Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-indigo-600">
                              {(vendor.businessName || vendor.fullName || "V").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {vendor.businessName || vendor.fullName || "—"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {vendor.businessType || vendor.registrationType || "General"}
                            </p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                              ID: {String(vendor._id).slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate max-w-[180px]">
                              {vendor.email || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {vendor.phone || vendor.altPhone || "Not provided"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {[vendor.city, vendor.state].filter(Boolean).join(", ") || "Location not set"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-600">Performance</span>
                              <span className="text-xs font-semibold">{score}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-32">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {vendor.totalOrders || 0} orders
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              {vendor.avgRating || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              vendor.isApproved
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vendor.isApproved ? "✓ Active" : "✗ Blocked"}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {vendor.createdAt
                              ? new Date(vendor.createdAt).toLocaleDateString("en-IN", {
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => handleView(vendor)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition flex items-center gap-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden lg:inline text-sm">View</span>
                          </button>

                          {/* Block/Unblock toggle */}
                          <button
                            onClick={() => toggleStatus(vendor._id, !vendor.isApproved)}
                            disabled={isLoading}
                            className={`p-2 rounded-lg transition flex items-center gap-1 ${
                              vendor.isApproved
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            } disabled:opacity-50`}
                            title={vendor.isApproved ? "Block Vendor" : "Unblock Vendor"}
                          >
                            {isLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : vendor.isApproved ? (
                              <ShieldOff className="w-4 h-4" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                            <span className="hidden lg:inline text-sm">
                              {vendor.isApproved ? "Block" : "Unblock"}
                            </span>
                          </button>

                          {/* More actions dropdown */}
                          <div className="relative" ref={actionMenu === vendor._id ? menuRef : null}>
                            <button
                              onClick={() =>
                                setActionMenu(actionMenu === vendor._id ? null : vendor._id)
                              }
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {actionMenu === vendor._id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                                <button
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                  onClick={() => {
                                    handleView(vendor);
                                    setActionMenu(null);
                                  }}
                                >
                                  <Eye className="w-4 h-4 text-indigo-500" />
                                  View Full Details
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                  onClick={() => {
                                    window.open(`mailto:${vendor.email}`);
                                    setActionMenu(null);
                                  }}
                                >
                                  <MessageSquare className="w-4 h-4 text-blue-500" />
                                  Send Email
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(vendor._id);
                                    setActionMenu(null);
                                    alert("Vendor ID copied to clipboard!");
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 text-gray-500" />
                                  Copy Vendor ID
                                </button>
                                <div className="border-t border-gray-200" />
                                <button
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                                  onClick={() => {
                                    toggleStatus(vendor._id, false);
                                    setActionMenu(null);
                                  }}
                                >
                                  <UserX className="w-4 h-4" />
                                  Block Account
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredAndSortedVendors.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-semibold">{filteredAndSortedVendors.length}</span>{" "}
              of <span className="font-semibold">{vendors.length}</span> vendors
            </div>
            <div className="text-xs text-gray-400">
              {selectedVendors.length > 0 && `${selectedVendors.length} selected`}
            </div>
          </div>
        )}
      </div>

      {/* Help Footer */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">Vendor Management Tips</h3>
            <p className="text-indigo-100 mt-1 text-sm">
              Click <strong>View</strong> for full vendor details · Click <strong>Block/Unblock</strong> to toggle access · Use ⋮ for more options
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-100">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            {vendors.filter((v) => v.isApproved).length} vendors active
          </div>
        </div>
      </div>
    </div>
  );
}