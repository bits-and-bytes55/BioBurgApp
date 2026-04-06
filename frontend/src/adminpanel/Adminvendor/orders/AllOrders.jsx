import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  BarChart3,
  MoreVertical,
  Calendar,
  User,
  Store,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  DollarSign,
  Star,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api";

export default function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE_URL}/admin-order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // ✅ Safe parsing — handle both res.data.data and res.data array
      const data = res.data?.data || res.data?.orders || (Array.isArray(res.data) ? res.data : []);
      setOrders(data);
      calculateStats(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const totalAmount = data.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const completed = data.filter((o) => o.orderStatus === "delivered").length;
    const pending = data.filter((o) => o.orderStatus === "pending").length;
    const cancelled = data.filter((o) => o.orderStatus === "cancelled").length;
    setStats({
      total,
      totalAmount,
      completed,
      pending,
      cancelled,
      avgOrderValue: total > 0 ? totalAmount / total : 0,
    });
  };

  const STATUS_COLORS = {
    pending:    "bg-yellow-100 text-yellow-800",
    confirmed:  "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped:    "bg-purple-100 text-purple-800",
    delivered:  "bg-green-100 text-green-800",
    cancelled:  "bg-red-100 text-red-800",
    refunded:   "bg-gray-100 text-gray-800",
  };

  const STATUS_ICONS = {
    pending:    <Clock className="w-3 h-3" />,
    confirmed:  <CheckCircle className="w-3 h-3" />,
    processing: <Package className="w-3 h-3" />,
    shipped:    <Truck className="w-3 h-3" />,
    delivered:  <CheckCircle className="w-3 h-3" />,
    cancelled:  <XCircle className="w-3 h-3" />,
    refunded:   <DollarSign className="w-3 h-3" />,
  };

  const getStatusColor = (s) => STATUS_COLORS[s] || STATUS_COLORS.pending;
  const getStatusIcon  = (s) => STATUS_ICONS[s]  || <AlertCircle className="w-3 h-3" />;

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((o) =>
        o._id?.toLowerCase().includes(q) ||
        o.userId?.name?.toLowerCase().includes(q) ||
        o.userId?.email?.toLowerCase().includes(q) ||
        o.vendor?.businessName?.toLowerCase().includes(q) ||
        o.shippingAddress?.city?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((o) => o.orderStatus === statusFilter);
    }

    if (dateRange !== "all") {
      const days = dateRange === "today" ? 1 : dateRange === "week" ? 7 : 30;
      const cutoff = new Date(Date.now() - days * 86400000);
      result = result.filter((o) => new Date(o.createdAt) > cutoff);
    }

    result.sort((a, b) => {
      let av = a[sortConfig.key];
      let bv = b[sortConfig.key];
      if (sortConfig.key === "createdAt") { av = new Date(av); bv = new Date(bv); }
      if (av == null) return 1;
      if (bv == null) return -1;
      if (sortConfig.direction === "asc") return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

    return result;
  }, [orders, searchTerm, statusFilter, dateRange, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const handleExport = () => {
    const rows = [
      ["Order ID", "Customer", "Email", "Vendor", "Status", "Amount", "Items", "Payment", "City", "Date"],
      ...filteredOrders.map((o) => [
        o._id,
        o.userId?.name || "",
        o.userId?.email || "",
        o.vendor?.businessName || "",
        o.orderStatus || "",
        o.totalAmount || 0,
        o.items?.length || 0,
        o.paymentMethod || "",
        o.shippingAddress?.city || "",
        o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl shadow"></div>)}
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-500 mt-1 text-sm">Track and manage all vendor orders</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchOrders}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={handleExport}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={fetchOrders} className="ml-auto text-sm text-red-600 font-medium hover:underline">Retry</button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Orders",    value: stats?.total || 0,                        sub: `${stats?.pending || 0} pending`,           icon: <Package className="w-7 h-7 text-blue-600" />,   bg: "bg-blue-50" },
            { label: "Total Revenue",   value: formatCurrency(stats?.totalAmount || 0),  sub: `Avg ${formatCurrency(stats?.avgOrderValue || 0)}`, icon: <DollarSign className="w-7 h-7 text-green-600" />, bg: "bg-green-50" },
            { label: "Delivered",       value: stats?.completed || 0,                    sub: `${stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0}% rate`, icon: <CheckCircle className="w-7 h-7 text-emerald-600" />, bg: "bg-emerald-50" },
            { label: "Cancelled",       value: stats?.cancelled || 0,                    sub: `${stats?.total ? Math.round((stats.cancelled / stats.total) * 100) : 0}% rate`, icon: <XCircle className="w-7 h-7 text-red-500" />,    bg: "bg-red-50" },
          ].map(({ label, value, sub, icon, bg }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
                <div className={`p-3 rounded-full ${bg}`}>{icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Order ID, customer, vendor, city..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full appearance-none pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Status</option>
                {["pending","confirmed","processing","shipped","delivered","cancelled","refunded"].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={dateRange} onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
                className="w-full appearance-none pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
              <button key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
                  statusFilter === s
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {s !== "all" && getStatusIcon(s)}
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === s ? "bg-indigo-700" : "bg-gray-200 text-gray-600"}`}>
                  {s === "all" ? orders.length : orders.filter((o) => o.orderStatus === s).length}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400">{filteredOrders.length} order(s) found</p>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { label: "Order",    key: "_id" },
                    { label: "Customer", key: null },
                    { label: "Vendor",   key: null },
                    { label: "Status",   key: "orderStatus" },
                    { label: "Amount",   key: "totalAmount" },
                    { label: "Date",     key: "createdAt" },
                    { label: "Actions",  key: null },
                  ].map(({ label, key }) => (
                    <th key={label}
                      onClick={() => key && handleSort(key)}
                      className={`py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${key ? "cursor-pointer hover:bg-gray-100" : ""}`}>
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
                {pagedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-semibold">No orders found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm ? "Try a different search term" : "No orders placed yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  pagedOrders.map((order) => (
                    <tr key={order._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}>

                      {/* Order */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900 text-sm">
                          #{order._id?.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.paymentMethod || "Online"}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 text-sm">{order.userId?.name || "—"}</p>
                        <p className="text-xs text-gray-400">{order.userId?.email || ""}</p>
                        {order.shippingAddress?.city && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {order.shippingAddress.city}
                          </p>
                        )}
                      </td>

                      {/* Vendor */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 text-sm">
                          {order.vendor?.businessName || order.vendor?.fullName || "—"}
                        </p>
                        <p className="text-xs text-gray-400">{order.vendor?.category || ""}</p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.orderStatus)}`}>
                          {getStatusIcon(order.orderStatus)}
                          {order.orderStatus
                            ? order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)
                            : "Unknown"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-gray-400">{order.items?.length || 0} item(s)</p>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredOrders.length > PAGE_SIZE && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length}
              </p>
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition">
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${page === p ? "bg-indigo-600 text-white" : "border border-gray-300 hover:bg-gray-50"}`}>
                    {p}
                  </button>
                ))}
                {totalPages > 5 && <span className="px-2 text-gray-400">...</span>}
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-5 text-white flex items-center justify-between">
            <div><p className="text-sm opacity-90">Avg Processing Time</p><p className="text-2xl font-bold mt-1">2.4 hrs</p></div>
            <Clock className="w-8 h-8 opacity-70" />
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-5 text-white flex items-center justify-between">
            <div><p className="text-sm opacity-90">Success Rate</p>
              <p className="text-2xl font-bold mt-1">
                {stats?.total ? `${Math.round((stats.completed / stats.total) * 100)}%` : "—"}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 opacity-70" />
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-5 text-white flex items-center justify-between">
            <div><p className="text-sm opacity-90">Total Revenue</p><p className="text-2xl font-bold mt-1">{formatCurrency(stats?.totalAmount || 0)}</p></div>
            <DollarSign className="w-8 h-8 opacity-70" />
          </div>
        </div>
      </div>

      {/* ════════════ Order Detail Modal ════════════ */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Order #{selectedOrder._id?.slice(-8).toUpperCase()}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.orderStatus)}`}>
                    {getStatusIcon(selectedOrder.orderStatus)}
                    {selectedOrder.orderStatus?.charAt(0).toUpperCase() + selectedOrder.orderStatus?.slice(1)}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(selectedOrder.createdAt)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Order Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Order ID",      value: selectedOrder._id },
                  { label: "Amount",        value: formatCurrency(selectedOrder.totalAmount) },
                  { label: "Payment",       value: selectedOrder.paymentMethod || "Online" },
                  { label: "Payment Status",value: selectedOrder.paymentStatus || "—" },
                  { label: "Items",         value: `${selectedOrder.items?.length || 0} item(s)` },
                  { label: "Discount",      value: selectedOrder.discount > 0 ? formatCurrency(selectedOrder.discount) : "None" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 break-all">{value || "—"}</p>
                  </div>
                ))}
              </div>

              {/* Customer */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Customer</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: "Name",  value: selectedOrder.userId?.name },
                    { label: "Email", value: selectedOrder.userId?.email },
                    { label: "Phone", value: selectedOrder.userId?.phone || selectedOrder.shippingAddress?.phone },
                  ].filter((d) => d.value).map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-blue-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Shipping Address</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: "Name",    value: selectedOrder.shippingAddress.name || selectedOrder.shippingAddress.fullName },
                      { label: "Phone",   value: selectedOrder.shippingAddress.phone },
                      { label: "Address", value: selectedOrder.shippingAddress.address || selectedOrder.shippingAddress.street },
                      { label: "City",    value: selectedOrder.shippingAddress.city },
                      { label: "State",   value: selectedOrder.shippingAddress.state },
                      { label: "Pincode", value: selectedOrder.shippingAddress.pincode || selectedOrder.shippingAddress.zip },
                    ].filter((d) => d.value).map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-green-400">{label}</p>
                        <p className="text-sm font-semibold text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor */}
              {selectedOrder.vendor && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Vendor</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: "Business", value: selectedOrder.vendor.businessName || selectedOrder.vendor.fullName },
                      { label: "Email",    value: selectedOrder.vendor.email },
                      { label: "Phone",    value: selectedOrder.vendor.phone },
                      { label: "Category", value: selectedOrder.vendor.category },
                    ].filter((d) => d.value).map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-purple-400">{label}</p>
                        <p className="text-sm font-semibold text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Items */}
              {selectedOrder.items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Order Items ({selectedOrder.items.length})
                  </p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        {item.product?.images?.[0]?.url && (
                          <img src={item.product.images[0].url} alt=""
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {item.product?.brandName || item.productName || `Item ${i + 1}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            Qty: {item.quantity} × {formatCurrency(item.price || item.mrp || 0)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                          {formatCurrency((item.quantity || 1) * (item.price || item.mrp || 0))}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-700">Total Amount</p>
                    <p className="text-lg font-bold text-indigo-700">{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
              <button onClick={() => setSelectedOrder(null)}
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