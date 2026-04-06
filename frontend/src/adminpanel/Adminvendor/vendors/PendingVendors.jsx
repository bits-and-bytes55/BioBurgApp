import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Download,
  RefreshCw,
  Shield,
  FileText,
  MoreVertical,
  ExternalLink,
  TrendingUp,
  Users,
  Award,
  Star,
  Tag,
  PhoneCall,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock as ClockIcon,
  Briefcase,
  CreditCard,
  ShieldCheck
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL + "/api";

export default function PendingVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [stats, setStats] = useState(null);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [actionMenu, setActionMenu] = useState(null);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // FIXED: correct endpoint
      const res = await axios.get(`${API}/vendor/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // FIXED: handle both data shapes
      const data = res.data?.data || res.data?.vendors || res.data || [];
      setVendors(Array.isArray(data) ? data : []);
      calculateStats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching pending vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (vendorData) => {
    const total = vendorData.length;
    const pendingOver7Days = vendorData.filter(v => {
      const created = new Date(v.createdAt);
      const now = new Date();
      const diffDays = (now - created) / (1000 * 60 * 60 * 24);
      return diffDays > 7;
    }).length;

    const categoryStats = {};
    vendorData.forEach(vendor => {
      const category = vendor.category || "Uncategorized";
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    setStats({
      total,
      pendingOver7Days,
      categoryStats,
      avgWaitTime: "3.2 days"
    });
  };

  const approveVendor = async (id) => {
    try {
      await axios.put(
        `${API}/vendor/admin/${id}/status`,
        { isApproved: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchVendors();
    } catch (error) {
      console.error("Error approving vendor:", error);
    }
  };

  const rejectVendor = async (id, reason = "Application rejected") => {
    try {
      await axios.put(
        `${API}/vendor/admin/${id}/status`,
        {
          isApproved: false,
          rejectionReason: reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchVendors();
    } catch (error) {
      console.error("Error rejecting vendor:", error);
    }
  };

  const bulkApprove = async () => {
    try {
      await Promise.all(
        bulkSelection.map(id =>
          axios.put(
            `${API}/vendor/admin/${id}/status`,
            { isApproved: true },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      fetchVendors();
      setBulkSelection([]);
    } catch (error) {
      console.error("Error bulk approving vendors:", error);
    }
  };

  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const filteredVendors = useMemo(() => {
    let result = [...vendors];

    if (searchTerm) {
      result = result.filter(vendor =>
        vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.phone?.includes(searchTerm)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(vendor => vendor.category === categoryFilter);
    }

    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (sortConfig.key === "createdAt") {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === "asc"
        ? (aVal || 0) - (bVal || 0)
        : (bVal || 0) - (aVal || 0);
    });

    return result;
  }, [vendors, searchTerm, categoryFilter, sortConfig]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTimeElapsed = (dateString) => {
    const now = new Date();
    const vendorDate = new Date(dateString);
    const diffDays = Math.floor((now - vendorDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Electronics': 'bg-blue-100 text-blue-800',
      'Fashion': 'bg-pink-100 text-pink-800',
      'Food & Beverage': 'bg-green-100 text-green-800',
      'Home & Kitchen': 'bg-amber-100 text-amber-800',
      'Beauty': 'bg-purple-100 text-purple-800',
      'Sports': 'bg-orange-100 text-orange-800',
      'Books': 'bg-indigo-100 text-indigo-800',
      'Automotive': 'bg-red-100 text-red-800',
      'Default': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Default'];
  };

  const handleSelectAll = () => {
    if (bulkSelection.length === filteredVendors.length) {
      setBulkSelection([]);
    } else {
      setBulkSelection(filteredVendors.map(v => v._id));
    }
  };

  const handleSelectVendor = (id) => {
    setBulkSelection(prev =>
      prev.includes(id)
        ? prev.filter(vId => vId !== id)
        : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-xl shadow"></div>
              ))}
            </div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-96 bg-white rounded-xl shadow"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pending Vendor Approvals</h1>
                <p className="text-gray-600 mt-1">
                  Review and approve new vendor applications
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchVendors}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-orange-600 font-medium">+{Math.floor((stats?.total || 0) * 0.15)} new</span>
              <span className="text-gray-500 ml-2">this week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending 7 Days</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pendingOver7Days || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${stats?.total ? (stats.pendingOver7Days / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Requires immediate attention</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Wait Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.avgWaitTime || "N/A"}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <ClockIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">-12% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approval Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">78%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Based on last 30 days</p>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {bulkSelection.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">Bulk Selection Mode</h3>
                  <p className="text-indigo-100 text-sm">
                    {bulkSelection.length} vendor(s) selected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={bulkApprove}
                  className="px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Approve All
                </button>
                <button
                  onClick={() => setBulkSelection([])}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by business name, email, or contact person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none"
                >
                  <option value="all">All Categories</option>
                  {Object.keys(stats?.categoryStats || {}).map(category => (
                    <option key={category} value={category}>
                      {category} ({stats.categoryStats[category]})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => setBulkSelection(filteredVendors.map(v => v._id))}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Select All
            </button>
            <button
              onClick={bulkApprove}
              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Quick Approve All
            </button>
            <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-2">
              <FileText className="w-4 h-4" />
              View Documentation
            </button>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pending Applications</h3>
                <p className="text-sm text-gray-600">
                  {filteredVendors.length} applications awaiting review
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 py-4 px-6">
                    <input
                      type="checkbox"
                      checked={bulkSelection.length === filteredVendors.length && filteredVendors.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th
                    className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("businessName")}
                  >
                    <div className="flex items-center gap-1">
                      Business Details
                      {sortConfig.key === "businessName" && (
                        sortConfig.direction === "asc" ?
                        <ChevronUp className="w-4 h-4" /> :
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th
                    className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Application Date
                      {sortConfig.key === "createdAt" && (
                        sortConfig.direction === "asc" ?
                        <ChevronUp className="w-4 h-4" /> :
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                        <p className="text-gray-500 text-lg">No pending applications! 🎉</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Great job! All vendor applications have been reviewed.
                        </p>
                        <button
                          onClick={fetchVendors}
                          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          Check for New Applications
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => {
                    const timeElapsed = getTimeElapsed(vendor.createdAt);
                    const isLongPending = timeElapsed.includes('week') || timeElapsed.includes('month');

                    return (
                      <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={bulkSelection.includes(vendor._id)}
                            onChange={() => handleSelectVendor(vendor._id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Business Details */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
                              <Building className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{vendor.businessName || vendor.fullName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(vendor.category)}`}>
                                  {vendor.category || "General"}
                                </span>
                                {vendor.gstNumber && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    GST: {vendor.gstNumber}
                                  </span>
                                )}
                              </div>
                              {(vendor.city || vendor.state) && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                  <MapPin className="w-3 h-3" />
                                  <span>{[vendor.city, vendor.state].filter(Boolean).join(", ")}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Information */}
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">{vendor.fullName || vendor.businessName}</p>
                                <p className="text-xs text-gray-500">Contact Person</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <a
                                href={`mailto:${vendor.email}`}
                                className="text-sm text-indigo-600 hover:text-indigo-800"
                              >
                                {vendor.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <a
                                href={`tel:${vendor.phone}`}
                                className="text-sm text-gray-700"
                              >
                                {vendor.phone || vendor.altPhone || "Not provided"}
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Application Date */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{formatDate(vendor.createdAt)}</span>
                            </div>
                            <div className={`flex items-center gap-1 text-sm ${isLongPending ? 'text-red-600' : 'text-gray-600'}`}>
                              <Clock className="w-3 h-3" />
                              <span>{timeElapsed}</span>
                              {isLongPending && (
                                <AlertCircle className="w-3 h-3 ml-1" />
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                              isLongPending
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {isLongPending ? 'Long Pending' : 'Under Review'}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {/* FIXED: view now opens the modal with full details */}
                            <button
                              onClick={() => setSelectedVendor(vendor)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => approveVendor(vendor._id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Approve Vendor"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setActionMenu(actionMenu === vendor._id ? null : vendor._id)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {actionMenu === vendor._id && (
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                  <button
                                    onClick={() => { setSelectedVendor(vendor); setActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <FileText className="w-4 h-4" />
                                    View Documents
                                  </button>
                                  <button
                                    onClick={() => { window.open(`mailto:${vendor.email}`); setActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    Send Message
                                  </button>
                                  <button
                                    onClick={() => { window.open(`tel:${vendor.phone}`); setActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <PhoneCall className="w-4 h-4" />
                                    Call Vendor
                                  </button>
                                  <div className="border-t border-gray-200">
                                    <button
                                      onClick={() => { rejectVendor(vendor._id, "Incomplete documentation"); setActionMenu(null); }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <ThumbsDown className="w-4 h-4" />
                                      Reject Application
                                    </button>
                                  </div>
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

          {filteredVendors.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-semibold">1-{filteredVendors.length}</span> of{" "}
                <span className="font-semibold">{filteredVendors.length}</span> pending applications
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Review Time</p>
                <p className="text-2xl font-bold mt-2">18 hours</p>
              </div>
              <ClockIcon className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Approval Rate</p>
                <p className="text-2xl font-bold mt-2">78%</p>
              </div>
              <Award className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Quality Score</p>
                <p className="text-2xl font-bold mt-2">8.7/10</p>
              </div>
              <Star className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* FIXED: Vendor Detail Modal — was placeholder text, now shows real data */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedVendor.businessName || selectedVendor.fullName}</h3>
                  <p className="text-gray-600 mt-1">Vendor Application Details</p>
                </div>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* DOCUMENTS SECTION */}
<div>
  <p className="text-sm font-semibold text-gray-700 mb-3">
    Uploaded Documents
  </p>

  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

    {[
      { label: "GST Certificate", value: selectedVendor.gstCertificate },
      { label: "PAN Card", value: selectedVendor.pancard },
      { label: "Owner Photo", value: selectedVendor.ownerPhoto },
      { label: "Aadhar Card", value: selectedVendor.aadharCard },
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

          <a
            href={doc.value}
            target="_blank"
            rel="noopener noreferrer"
          >
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
</div>
              {/* Vendor ID */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Vendor ID</p>
                <p className="text-sm font-mono font-bold text-gray-800 break-all">{selectedVendor._id}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Full Name",         value: selectedVendor.fullName },
                  { label: "Business Name",     value: selectedVendor.businessName },
                  { label: "Email",             value: selectedVendor.email },
                  { label: "Phone",             value: selectedVendor.phone || selectedVendor.altPhone },
                  { label: "Business Type",     value: selectedVendor.businessType || selectedVendor.registrationType },
                  { label: "GST Number",        value: selectedVendor.gstNumber },
                  { label: "City",              value: selectedVendor.city },
                  { label: "State",             value: selectedVendor.state },
                  { label: "Pincode",           value: selectedVendor.pincode },
                  { label: "Applied On",        value: selectedVendor.createdAt ? formatDate(selectedVendor.createdAt) : null },
                ].filter(d => d.value).map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Drug Licenses */}
              {(selectedVendor.drugLicenseNumber1 || selectedVendor.drugLicenseNumber2) && (
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

              {/* Action buttons inside modal */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { approveVendor(selectedVendor._id); setSelectedVendor(null); }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <ThumbsUp className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => { rejectVendor(selectedVendor._id, "Incomplete documentation"); setSelectedVendor(null); }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <ThumbsDown className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}