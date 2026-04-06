import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { ExternalLink } from "lucide-react";
import {
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  Tag,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Search,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Users,
  Store,
  Shield,
} from "lucide-react";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

export default function VendorDetails() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchAllVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllVendors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${BASE_API}/api/vendor/admin/approved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data || res.data?.vendors || res.data || [];
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError("Failed to load vendors. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredVendors = useMemo(() => {
    let result = [...vendors];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (v) =>
          v.businessName?.toLowerCase().includes(q) ||
          v.fullName?.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q) ||
          v.phone?.includes(q) ||
          v.gstNumber?.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q) ||
          v._id?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((v) =>
        statusFilter === "approved" ? v.isApproved : !v.isApproved
      );
    }
    result.sort((a, b) => {
      let av = a[sortConfig.key];
      let bv = b[sortConfig.key];
      if (sortConfig.key === "createdAt") { av = new Date(av); bv = new Date(bv); }
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortConfig.direction === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return result;
  }, [vendors, searchTerm, statusFilter, sortConfig]);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleExport = () => {
    const rows = [
      ["Vendor ID", "Business Name", "Full Name", "Email", "Phone", "City", "State", "GST", "Status", "Joined"],
      ...filteredVendors.map((v) => [
        v._id, v.businessName || "", v.fullName || "", v.email || "",
        v.phone || "", v.city || "", v.state || "", v.gstNumber || "",
        v.isApproved ? "Approved" : "Not Approved", formatDate(v.createdAt),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendors_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl shadow"></div>)}
          </div>
          <div className="h-96 bg-white rounded-xl shadow"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Vendor Details</h1>
            <p className="text-gray-500 mt-1 text-sm">All registered vendors — live from database</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAllVendors}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm transition">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={handleExport}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm transition">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={fetchAllVendors} className="ml-auto text-sm text-red-600 font-medium hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Vendors", value: vendors.length, icon: <Users className="w-6 h-6 text-indigo-600" />, bg: "bg-indigo-50", color: "text-indigo-600" },
            { label: "Approved", value: vendors.filter((v) => v.isApproved).length, icon: <CheckCircle className="w-6 h-6 text-green-600" />, bg: "bg-green-50", color: "text-green-600" },
            { label: "Not Approved", value: vendors.filter((v) => !v.isApproved).length, icon: <XCircle className="w-6 h-6 text-red-500" />, bg: "bg-red-50", color: "text-red-500" },
          ].map(({ label, value, icon, bg, color }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
              <div className={`p-3 rounded-full ${bg}`}>{icon}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, phone, GST, city or vendor ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="blocked">Not Approved</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{filteredVendors.length} vendor(s) found</p>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { label: "Vendor", key: "businessName" },
                    { label: "Contact", key: "email" },
                    { label: "Location", key: "city" },
                    { label: "GST No.", key: "gstNumber" },
                    { label: "Status", key: "isApproved" },
                    { label: "Joined", key: "createdAt" },
                    { label: "Actions", key: null },
                  ].map(({ label, key }) => (
                    <th
                      key={label}
                      onClick={() => key && handleSort(key)}
                      className={`py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${key ? "cursor-pointer select-none hover:bg-gray-100" : ""}`}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {key && sortConfig.key === key && (
                          sortConfig.direction === "asc"
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <Store className="w-14 h-14 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-semibold">No vendors found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm ? "Try a different search term" : "No vendors registered yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">

                      {/* Vendor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-700 font-bold text-sm">
                              {(vendor.businessName || vendor.fullName || "V").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm leading-tight">
                              {vendor.businessName || vendor.fullName || "—"}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">
                              #{vendor._id?.slice(-8).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-700 leading-tight">{vendor.email || "—"}</p>
                        <p className="text-xs text-gray-400">{vendor.phone || "—"}</p>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-700">
                          {[vendor.city, vendor.state].filter(Boolean).join(", ") || "—"}
                        </p>
                        {vendor.pincode && <p className="text-xs text-gray-400">{vendor.pincode}</p>}
                      </td>

                      {/* GST */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {vendor.gstNumber || "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          vendor.isApproved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {vendor.isApproved
                            ? <><CheckCircle className="w-3 h-3" /> Approved</>
                            : <><XCircle className="w-3 h-3" /> Not Approved</>}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600 whitespace-nowrap">{formatDate(vendor.createdAt)}</p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelectedVendor(vendor); setActiveTab("overview"); }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={`mailto:${vendor.email}`}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                          {vendor.phone && (
                            <a
                              href={`tel:${vendor.phone}`}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                              title="Call"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filteredVendors.length} of {vendors.length} vendors
          </div>
        </div>
      </div>

      {/* ════════════ Full Detail Modal ════════════ */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {(selectedVendor.businessName || selectedVendor.fullName || "V").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    {selectedVendor.businessName || selectedVendor.fullName}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedVendor.isApproved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {selectedVendor.isApproved ? "✓ Approved" : "✗ Not Approved"}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      ID: {selectedVendor._id}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
              {["overview", "documents", "location", "all fields"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all capitalize ${
                    activeTab === tab
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div className="p-6">

              {/* ── Overview ── */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Full Name", value: selectedVendor.fullName },
                      { label: "Business Name", value: selectedVendor.businessName },
                      { label: "Email", value: selectedVendor.email },
                      { label: "Phone", value: selectedVendor.phone || selectedVendor.altPhone },
                      { label: "Business Type", value: selectedVendor.businessType || selectedVendor.registrationType },
                      { label: "Category", value: selectedVendor.category },
                      { label: "Role", value: selectedVendor.role },
                      { label: "Joined On", value: formatDate(selectedVendor.createdAt) },
                    ].filter((d) => d.value).map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 break-all">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Drug Licenses */}
                  {[selectedVendor.drugLicenseNumber1, selectedVendor.drugLicenseNumber2,
                    selectedVendor.drugLicenseNumber3, selectedVendor.drugLicenseNumber4].some(Boolean) && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Drug License Numbers</p>
                      <div className="flex flex-wrap gap-2">
                        {[selectedVendor.drugLicenseNumber1, selectedVendor.drugLicenseNumber2,
                          selectedVendor.drugLicenseNumber3, selectedVendor.drugLicenseNumber4]
                          .filter(Boolean).map((lic, i) => (
                            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-mono border border-blue-200">
                              {lic}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-3 pt-2 flex-wrap">
                    <a href={`mailto:${selectedVendor.email}`}
                      className="flex-1 min-w-[120px] px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm font-medium">
                      <MessageSquare className="w-4 h-4" /> Send Email
                    </a>
                    {selectedVendor.phone && (
                      <a href={`tel:${selectedVendor.phone}`}
                        className="flex-1 min-w-[100px] px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium">
                        <PhoneCall className="w-4 h-4" /> Call
                      </a>
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedVendor._id).then(() => alert("Vendor ID copied!"))}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                      Copy ID
                    </button>
                  </div>
                </div>
              )}

              {/* ── Documents ── */}
              {activeTab === "documents" && (
  <div>
    <p className="text-sm font-semibold text-gray-700 mb-4">
      Uploaded Documents
    </p>

    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

      {[
        { label: "GST Certificate", value: selectedVendor.gstCertificate },
        { label: "PAN Card", value: selectedVendor.pancard },
        { label: "Owner Photo", value: selectedVendor.ownerPhoto },
        { label: "Aadhar Card", value: selectedVendor.aadharCard },
        { label: "Voter ID", value: selectedVendor.voterId },
        { label: "Education Certificate", value: selectedVendor.educationCertificate },

        { label: "Drug License 1", value: selectedVendor.drugLicense1 },
        { label: "Drug License 2", value: selectedVendor.drugLicense2 },
        { label: "Drug License 3", value: selectedVendor.drugLicense3 },
        { label: "Drug License 4", value: selectedVendor.drugLicense4 },

        { label: "Shop Photo 1", value: selectedVendor.shopPhoto1 },
        { label: "Shop Photo 2", value: selectedVendor.shopPhoto2 },
        { label: "Shop Photo 3", value: selectedVendor.shopPhoto3 },
        { label: "Shop Photo 4", value: selectedVendor.shopPhoto4 },
        { label: "Shop Photo 5", value: selectedVendor.shopPhoto5 },
      ]
        .filter(doc => doc.value)
        .map((doc, i) => (
          <div key={i} className="border rounded-lg p-2 bg-gray-50">

            <p className="text-xs text-gray-500 mb-1">{doc.label}</p>

            <a href={doc.value} target="_blank" rel="noopener noreferrer">
              <img
                src={doc.value}
                alt={doc.label}
                className="w-full h-28 object-cover rounded"
              />
            </a>

            <a
              href={doc.value}
              target="_blank"
              className="text-xs text-indigo-600 mt-1 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View
            </a>
          </div>
        ))}
    </div>

    {/* VIDEO */}
    {selectedVendor.shopVideo && (
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Shop Video
        </p>
        <video controls className="w-full rounded">
          <source src={selectedVendor.shopVideo} />
        </video>
      </div>
    )}

    {/* EMPTY STATE */}
    {![
      selectedVendor.gstCertificate,
      selectedVendor.pancard,
      selectedVendor.shopPhoto1
    ].some(Boolean) && (
      <div className="text-center py-10 text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No documents available</p>
      </div>
    )}
  </div>
)}
              {/* ── Location ── */}
              {activeTab === "location" && (
                <div className="space-y-3">
                  {[
                    { label: "Address", value: selectedVendor.address },
                    { label: "City", value: selectedVendor.city },
                    { label: "State", value: selectedVendor.state },
                    { label: "Pincode", value: selectedVendor.pincode },
                    { label: "Country", value: selectedVendor.country || (selectedVendor.city ? "India" : null) },
                  ].filter((d) => d.value).map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{value}</p>
                    </div>
                  ))}
                  {!selectedVendor.city && !selectedVendor.address && (
                    <div className="text-center py-10 text-gray-400">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No location details</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── All Fields ── */}
              {activeTab === "all fields" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(selectedVendor)
                    .filter(([k, v]) =>
                      v !== null && v !== undefined && v !== "" &&
                      !Array.isArray(v) && typeof v !== "object" &&
                      !["__v", "password", "otp", "otpExpiry"].includes(k)
                    )
                    .map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-1 font-mono">{key}</p>
                        <p className="text-sm font-semibold text-gray-800 break-all">
                          {String(value)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setSelectedVendor(null)}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}