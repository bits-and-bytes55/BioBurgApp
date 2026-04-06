import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  MoreVertical,
  Calendar,
  Store,
  CreditCard,
  Filter,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL + "/api";

export default function VendorPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [stats, setStats] = useState(null);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/vendor/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data || res.data?.payments || res.data || [];
      const arr = Array.isArray(data) ? data : [];
      setPayments(arr);
      calculateStats(arr);
    } catch (error) {
      console.error("Error fetching vendor payments:", error);
      // Still render the page — backend endpoint may not exist yet
      setPayments([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalRevenue = data.reduce((sum, p) => sum + (p.amount || 0), 0);
    const completed    = data.filter(p => p.status === "completed" || p.status === "paid").length;
    const pending      = data.filter(p => p.status === "pending").length;
    const failed       = data.filter(p => p.status === "failed").length;
    setStats({ totalRevenue, completed, pending, failed, total: data.length });
  };

  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") direction = "asc";
    setSortConfig({ key, direction });
  };

  const filteredPayments = useMemo(() => {
    let result = [...payments];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p =>
        p._id?.toLowerCase().includes(q) ||
        p.vendor?.businessName?.toLowerCase().includes(q) ||
        p.vendor?.fullName?.toLowerCase().includes(q) ||
        p.transactionId?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(p => p.status === statusFilter);
    }

    result.sort((a, b) => {
      let av = a[sortConfig.key];
      let bv = b[sortConfig.key];

      if (sortConfig.key === "createdAt") {
        av = new Date(av); bv = new Date(bv);
      }
      if (sortConfig.key === "amount") {
        av = parseFloat(av) || 0; bv = parseFloat(bv) || 0;
      }

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      return sortConfig.direction === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    return result;
  }, [payments, searchTerm, statusFilter, sortConfig]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      paid:      "bg-green-100 text-green-800",
      pending:   "bg-yellow-100 text-yellow-800",
      failed:    "bg-red-100 text-red-800",
      refunded:  "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleExport = () => {
    const rows = [
      ["Payment ID", "Vendor", "Amount", "Status", "Method", "Transaction ID", "Date"],
      ...filteredPayments.map(p => [
        p._id,
        p.vendor?.businessName || p.vendor?.fullName || "",
        p.amount || 0,
        p.status || "",
        p.method || p.paymentMethod || "",
        p.transactionId || "",
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendor_payments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Vendor Payments</h1>
            <p className="text-gray-600 mt-1">Track and manage all vendor payment transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPayments}
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
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats?.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">All time</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.completed || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${stats?.total ? (stats.completed / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0}% of total
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.pending || 0}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-yellow-600">Awaiting processing</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.failed || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600">Requires attention</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by vendor name, payment ID, or transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">{filteredPayments.length} payment(s) found</p>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("_id")}
                  >
                    <div className="flex items-center gap-1">
                      Payment ID
                      {sortConfig.key === "_id" && (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th
                    className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center gap-1">
                      Amount
                      {sortConfig.key === "amount" && (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th
                    className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortConfig.key === "status" && (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Method
                  </th>
                  <th
                    className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortConfig.key === "createdAt" && (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <CreditCard className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No payments found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {payments.length === 0
                            ? "No payment records yet. Implement GET /api/admin/vendor/payments on the backend."
                            : "No payments match your filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="text-xs font-mono text-gray-700">
                          #{payment._id?.slice(-10)}
                        </p>
                        {payment.transactionId && (
                          <p className="text-xs text-gray-400 mt-0.5">Txn: {payment.transactionId}</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <Store className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {payment.vendor?.businessName || payment.vendor?.fullName || "—"}
                            </p>
                            {payment.vendor?.email && (
                              <p className="text-xs text-gray-500">{payment.vendor.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {payment.method || payment.paymentMethod || "—"}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{formatDate(payment.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredPayments.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-semibold">{filteredPayments.length}</span> of{" "}
                <span className="font-semibold">{payments.length}</span> payments ·{" "}
                Total: <span className="font-semibold">{formatCurrency(stats?.totalRevenue)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Payment Value</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(stats?.total ? (stats.totalRevenue / stats.total) : 0)}
                </p>
              </div>
              <CreditCard className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Success Rate</p>
                <p className="text-2xl font-bold mt-2">
                  {stats?.total ? Math.round(((stats.completed) / stats.total) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Transactions</p>
                <p className="text-2xl font-bold mt-2">{stats?.total || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
                  <p className="text-gray-600 mt-1 text-sm font-mono">#{selectedPayment._id}</p>
                </div>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Vendor",         value: selectedPayment.vendor?.businessName || selectedPayment.vendor?.fullName },
                  { label: "Amount",         value: formatCurrency(selectedPayment.amount) },
                  { label: "Status",         value: selectedPayment.status },
                  { label: "Method",         value: selectedPayment.method || selectedPayment.paymentMethod },
                  { label: "Transaction ID", value: selectedPayment.transactionId },
                  { label: "Order ID",       value: selectedPayment.orderId || selectedPayment.order?._id },
                  { label: "Date",           value: formatDate(selectedPayment.createdAt) },
                  { label: "Reference",      value: selectedPayment.reference || selectedPayment.razorpayPaymentId },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 break-all">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setSelectedPayment(null)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}