import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  User,
  Store,
  Calendar,
  Download,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Shield,
  MessageSquare,
  PhoneCall,
  Navigation,
  Star,
  Award,
  Zap
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api";

export default function AssignedOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "assignedAt", direction: "desc" });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE_URL}/admin-order/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data);
      calculateStats(res.data.data);
    } catch (error) {
      console.error("Error fetching assigned orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orderData) => {
    const total = orderData.length;
    const pending = orderData.filter(o => o.orderStatus === "pending").length;
    const accepted = orderData.filter(o => o.orderStatus === "accepted").length;
    const processing = orderData.filter(o => o.orderStatus === "processing").length;
    const ready = orderData.filter(o => o.orderStatus === "ready_for_pickup").length;
    
    // Calculate vendor distribution
    const vendorStats = {};
    orderData.forEach(order => {
      const vendorName = order.vendor?.businessName || "Unassigned";
      vendorStats[vendorName] = (vendorStats[vendorName] || 0) + 1;
    });

    setStats({
      total,
      pending,
      accepted,
      processing,
      ready,
      vendorStats
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-blue-100 text-blue-800 border-blue-200",
      processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
      ready_for_pickup: "bg-green-100 text-green-800 border-green-200",
      picked_up: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      accepted: <CheckCircle className="w-4 h-4" />,
      processing: <Package className="w-4 h-4" />,
      ready_for_pickup: <Truck className="w-4 h-4" />,
      picked_up: <Navigation className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  const getStatusBadge = (status) => {
    const labels = {
      pending: "Awaiting Acceptance",
      accepted: "Accepted by Vendor",
      processing: "Being Prepared",
      ready_for_pickup: "Ready for Pickup",
      picked_up: "Picked Up",
      delivered: "Delivered",
      cancelled: "Cancelled"
    };
    return labels[status] || status;
  };

  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Active tab filter
    if (activeTab !== "all") {
      result = result.filter(order => order.orderStatus === activeTab);
    }

    // Search filter
    if (searchTerm) {
      result = result.filter(order =>
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Vendor filter
    if (vendorFilter !== "all") {
      result = result.filter(order => order.vendor?._id === vendorFilter);
    }

    // Sorting
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
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
  }, [orders, searchTerm, vendorFilter, activeTab, sortConfig]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeElapsed = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffMinutes = Math.floor((now - orderDate) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const uniqueVendors = useMemo(() => {
    const vendors = [];
    const vendorMap = new Map();
    
    orders.forEach(order => {
      if (order.vendor && !vendorMap.has(order.vendor._id)) {
        vendorMap.set(order.vendor._id, order.vendor);
        vendors.push(order.vendor);
      }
    });
    
    return vendors;
  }, [orders]);

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
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Truck className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Assigned Orders</h1>
                <p className="text-gray-600 mt-1">
                  Track vendor assignments and order progress
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assigned</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-full">
                <Package className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+8.2%</span>
              <span className="text-gray-500 ml-2">from yesterday</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Acceptance</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pending || 0}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full" 
                  style={{ width: `${stats?.total ? (stats.pending / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats?.total ? Math.round((stats.pending / stats.total) * 100) : 0}% of total
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.processing || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${stats?.total ? (stats.processing / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Avg completion: 45 minutes
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready for Pickup</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.ready || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-gray-600">Avg wait time: 15min</span>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { id: "all", label: "All Orders", count: orders.length },
                { id: "pending", label: "Pending", count: stats?.pending || 0 },
                { id: "accepted", label: "Accepted", count: stats?.accepted || 0 },
                { id: "processing", label: "Processing", count: stats?.processing || 0 },
                { id: "ready_for_pickup", label: "Ready", count: stats?.ready || 0 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-6 py-4 border-b-2 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tab.label}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {tab.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer, or Vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Vendor Filter */}
            <div>
              <div className="relative">
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none"
                >
                  <option value="all">All Vendors</option>
                  {uniqueVendors.map(vendor => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.businessName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Auto-assign Pending
            </button>
            <button className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Notify Vendors
            </button>
            <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-2">
              <PhoneCall className="w-4 h-4" />
              Escalate Issues
            </button>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Orders List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Package className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No assigned orders found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm ? "Try adjusting your search filters" : "All orders are processed"}
                  </p>
                  <button className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    Refresh Orders
                  </button>
                </div>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                <Package className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900">
                                  ORDER #{order._id?.slice(-8).toUpperCase()}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    Assigned {formatDate(order.assignedAt)}
                                  </span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {getTimeElapsed(order.assignedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-lg border ${getStatusColor(order.orderStatus)} flex items-center gap-2`}>
                            {getStatusIcon(order.orderStatus)}
                            <span className="font-medium">{getStatusBadge(order.orderStatus)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Customer Info */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{order.userId?.name || "Unknown"}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{order.userId?.phone || "No phone"}</span>
                                </div>
                              </div>
                            </div>
                            {order.shippingAddress && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-gray-700">
                                    {order.shippingAddress.addressLine1}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {order.shippingAddress.city}, {order.shippingAddress.state}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Vendor Info */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <Store className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{order.vendor?.businessName || "—"}</p>
                                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                                    <Star className="w-3 h-3 inline mr-1" />
                                    4.5
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{order.vendor?.phone || "No phone"}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Estimated prep time: 30-45 mins
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-sm font-medium text-gray-700">Items ({order.items?.length || 0})</p>
                            <p className="text-lg font-bold text-gray-900">₹{order.totalAmount || 0}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {order.items?.slice(0, 3).map((item, index) => (
                              <span key={index} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                                {item.name} × {item.quantity}
                              </span>
                            ))}
                            {order.items?.length > 3 && (
                              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                                +{order.items.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle view details
                              }}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle vendor contact
                              }}
                              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                            >
                              <PhoneCall className="w-4 h-4" />
                              Call Vendor
                            </button>
                          </div>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column - Analytics & Quick Actions */}
          <div className="space-y-6">
            {/* Vendor Performance */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Performance</h3>
              <div className="space-y-4">
                {Object.entries(stats?.vendorStats || {}).slice(0, 5).map(([vendorName, count]) => (
                  <div key={vendorName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                        <Store className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                        {vendorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="w-full mt-4 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View All Vendors
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Today's Snapshot</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Assigned Today</span>
                  <span className="font-bold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed Today</span>
                  <span className="font-bold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Response Time</span>
                  <span className="font-bold">8min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Issues Reported</span>
                  <span className="font-bold">2</span>
                </div>
              </div>
            </div>

            {/* Priority Orders */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Priority Orders</h3>
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="space-y-3">
                {orders
                  .filter(o => o.orderStatus === "pending" || o.orderStatus === "accepted")
                  .slice(0, 3)
                  .map(order => (
                    <div key={order._id} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-red-800">#{order._id?.slice(-6)}</p>
                          <p className="text-sm text-red-600">{order.userId?.name}</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded">
                          {getTimeElapsed(order.assignedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                  <Award className="w-5 h-5" />
                  Assign Bulk Orders
                </button>
                <button className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Send Broadcast
                </button>
                <button className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  Order #{selectedOrder._id?.slice(-8).toUpperCase()}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Modal content would show detailed order info */}
              <p className="text-gray-600">Detailed order information would appear here...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}