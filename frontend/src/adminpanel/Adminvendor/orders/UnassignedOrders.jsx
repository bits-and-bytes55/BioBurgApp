import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Package,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  User,
  Store,
  Calendar,
  Download,
  RefreshCw,
  Zap,
  Sparkles,
  Target,
  BarChart3,
  MoreVertical,
  ExternalLink,
  TrendingUp,
  Shield,
  MessageSquare,
  PhoneCall,
  Star,
  Tag,
  Truck,
  ThumbsUp,
  Award,
  Briefcase
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api";

export default function UnassignedOrders() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState(null);
  const [vendorSuggestions, setVendorSuggestions] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE_URL}/admin-order/unassigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data);
      calculateStats(res.data.data);
    } catch (error) {
      console.error("Error fetching unassigned orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE_URL}/vendor/admin/approved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendors(res.data.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const calculateStats = (orderData) => {
    const total = orderData.length;
    const pendingOver30Min = orderData.filter(o => {
      const created = new Date(o.createdAt);
      const now = new Date();
      const diffMinutes = (now - created) / (1000 * 60);
      return diffMinutes > 30;
    }).length;
    
    const highPriority = orderData.filter(o => o.priority === "high").length;
    const withSpecialRequests = orderData.filter(o => o.specialInstructions).length;

    setStats({
      total,
      pendingOver30Min,
      highPriority,
      withSpecialRequests,
      avgWaitTime: "25 minutes"
    });
  };

  const assignVendor = async (orderId, vendorId) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${API_BASE_URL}/admin-order/assign-vendor`,
        { orderId, vendorId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show success feedback
      const orderRow = document.getElementById(`order-${orderId}`);
      if (orderRow) {
        orderRow.classList.add('bg-green-50');
        setTimeout(() => {
          orderRow.classList.remove('bg-green-50');
        }, 2000);
      }
      
      fetchOrders();
    } catch (error) {
      console.error("Error assigning vendor:", error);
    }
  };

  const autoAssignVendor = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    // Simple matching algorithm
    const bestVendor = vendors.reduce((best, vendor) => {
      let score = 0;
      
      // Category match
      if (order.category && vendor.category === order.category) score += 30;
      
      // Rating bonus
      if (vendor.rating >= 4.5) score += 25;
      else if (vendor.rating >= 4.0) score += 15;
      
      // Capacity consideration
      if (vendor.activeOrders < 5) score += 20;
      else if (vendor.activeOrders < 10) score += 10;
      
      return score > (best.score || 0) ? { vendor, score } : best;
    }, {});

    if (bestVendor.vendor) {
      await assignVendor(orderId, bestVendor.vendor._id);
    }
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

    // Search filter
    if (searchTerm) {
      result = result.filter(order =>
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter(order => order.priority === priorityFilter);
    }

    // Sorting
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (sortConfig.key === "createdAt" || sortConfig.key === "assignedAt") {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }
      
      if (sortConfig.key === "totalAmount") {
        return sortConfig.direction === "asc" 
          ? (a.totalAmount || 0) - (b.totalAmount || 0)
          : (b.totalAmount || 0) - (a.totalAmount || 0);
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
  }, [orders, searchTerm, priorityFilter, sortConfig]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeElapsed = (dateString) => {
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffMinutes = Math.floor((now - orderDate) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  const getPriorityColor = (minutes) => {
    if (minutes > 60) return "bg-red-500 text-white";
    if (minutes > 30) return "bg-orange-500 text-white";
    if (minutes > 15) return "bg-yellow-500 text-white";
    return "bg-gray-100 text-gray-800";
  };

  const getVendorMatchScore = (order, vendor) => {
    let score = 50;
    
    if (order.category && vendor.category === order.category) {
      score += 20;
    }
    
    if (vendor.rating >= 4.5) score += 15;
    else if (vendor.rating >= 4.0) score += 10;
    
    if (vendor.activeOrders < 5) score += 15;
    else if (vendor.activeOrders < 10) score += 5;
    
    return Math.min(score, 100);
  };

  const getTopVendorSuggestions = (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return [];

    return vendors
      .map(vendor => ({
        ...vendor,
        matchScore: getVendorMatchScore(order, vendor)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
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
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Unassigned Orders</h1>
                <p className="text-gray-600 mt-1">
                  Manage and assign pending orders to vendors
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
            <button
              onClick={() => {
                filteredOrders.forEach(order => autoAssignVendor(order._id));
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Auto-assign All
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Awaiting Assignment</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <Package className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-gray-600">Avg wait: {stats?.avgWaitTime || "N/A"}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.highPriority || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600 font-medium">Requires attention</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending 30min</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pendingOver30Min || 0}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full" 
                  style={{ width: `${stats?.total ? (stats.pendingOver30Min / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Need escalation</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Vendors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{vendors.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">Ready to assign</span>
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
                  placeholder="Search by Order ID, Customer Name, Email, or City..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Priority Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              <button className="px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Total orders: <span className="font-semibold">{orders.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-600">
                Urgent: <span className="font-semibold text-orange-600">{stats?.pendingOver30Min || 0}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-600">
                Vendors online: <span className="font-semibold text-green-600">{vendors.filter(v => v.isOnline).length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th 
                    className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("userId.name")}
                  >
                    <div className="flex items-center gap-1">
                      Customer
                      {sortConfig.key === "userId.name" && (
                        sortConfig.direction === "asc" ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Items & Amount
                  </th>
                  <th 
                    className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Time
                      {sortConfig.key === "createdAt" && (
                        sortConfig.direction === "asc" ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Assign Vendor
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                        <p className="text-gray-500 text-lg">All orders are assigned! 🎉</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Great job! No unassigned orders at the moment.
                        </p>
                        <button
                          onClick={fetchOrders}
                          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          Check for New Orders
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const timeElapsed = getTimeElapsed(order.createdAt);
                    const timeMinutes = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60));
                    const topVendors = getTopVendorSuggestions(order._id);

                    return (
                      <React.Fragment key={order._id}>
                        <tr 
                          id={`order-${order._id}`}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Order Details */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
                                <Package className="w-5 h-5 text-yellow-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900">
                                    #{order._id?.slice(-8).toUpperCase()}
                                  </p>
                                  {order.priority === "high" && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      High
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {formatDate(order.createdAt)}
                                  </span>
                                </div>
                                {order.shippingAddress && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500 truncate max-w-[180px]">
                                      {order.shippingAddress.city}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Customer Info */}
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{order.userId?.name}</p>
                                  <p className="text-xs text-gray-500 truncate max-w-[180px]">
                                    {order.userId?.email}
                                  </p>
                                </div>
                              </div>
                              {order.userId?.phone && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  {order.userId.phone}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Items & Amount */}
                          <td className="py-4 px-6">
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  ₹{order.totalAmount || 0}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {order.items?.length || 0} item(s)
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {order.items?.slice(0, 2).map((item, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {item.name?.slice(0, 15)}...
                                  </span>
                                ))}
                                {order.items?.length > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    +{order.items.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Time */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(timeMinutes)}`}>
                                {timeElapsed}
                              </span>
                              <span className="text-xs text-gray-500">
                                {timeMinutes > 30 ? "Urgent" : "Waiting"}
                              </span>
                            </div>
                            {timeMinutes > 30 && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                                <Clock className="w-3 h-3" />
                                Needs quick assignment
                              </div>
                            )}
                          </td>

                          {/* Assign Vendor */}
                          <td className="py-4 px-6">
                            <div className="space-y-2">
                              <div className="relative">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      assignVendor(order._id, e.target.value);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none text-sm"
                                  defaultValue=""
                                >
                                  <option value="">Select vendor...</option>
                                  {vendors.map(vendor => (
                                    <option key={vendor._id} value={vendor._id}>
                                      {vendor.businessName} ({vendor.rating}★)
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                              </div>
                              <button
                                onClick={() => autoAssignVendor(order._id)}
                                className="w-full px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs rounded-lg hover:bg-indigo-100 transition flex items-center justify-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                Auto-assign
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                title="Show Suggestions"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row - Vendor Suggestions */}
                        {expandedOrder === order._id && (
                          <tr className="bg-gray-50">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="pl-16 pr-6">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                      <Award className="w-5 h-5 text-yellow-500" />
                                      <h4 className="font-semibold text-gray-900">Top Vendor Recommendations</h4>
                                    </div>
                                    <button
                                      onClick={() => setExpandedOrder(null)}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      <XCircle className="w-5 h-5" />
                                    </button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {topVendors.map((vendor, idx) => (
                                      <div key={vendor._id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                                              <Store className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                              <p className="font-medium text-gray-900">{vendor.businessName}</p>
                                              <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-amber-500" />
                                                <span className="text-xs text-gray-600">{vendor.rating || 4.5}★</span>
                                              </div>
                                            </div>
                                          </div>
                                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                            {vendor.matchScore}% Match
                                          </span>
                                        </div>
                                        
                                        <div className="space-y-2 mb-4">
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Category:</span>
                                            <span className="font-medium">{vendor.category || "General"}</span>
                                          </div>
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Active Orders:</span>
                                            <span className={`font-medium ${vendor.activeOrders < 5 ? "text-green-600" : "text-yellow-600"}`}>
                                              {vendor.activeOrders || 0}/10
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Response Time:</span>
                                            <span className="font-medium">~5 min</span>
                                          </div>
                                        </div>
                                        
                                        <button
                                          onClick={() => assignVendor(order._id, vendor._id)}
                                          className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                                        >
                                          <ThumbsUp className="w-4 h-4" />
                                          Assign this Vendor
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filteredOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-semibold">{filteredOrders.length}</span> unassigned orders
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      filteredOrders.forEach(order => autoAssignVendor(order._id));
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Assign All Automatically
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition">
                      Previous
                    </button>
                    <button className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                      1
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition">
                      2
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Assignment Time</p>
                <p className="text-2xl font-bold mt-2">8 minutes</p>
              </div>
              <Clock className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Success Rate</p>
                <p className="text-2xl font-bold mt-2">98.2%</p>
              </div>
              <CheckCircle className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Customer Satisfaction</p>
                <p className="text-2xl font-bold mt-2">4.8/5</p>
              </div>
              <Star className="w-8 h-8 opacity-80" />
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
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Order #{selectedOrder._id?.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Created {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{selectedOrder.userId?.name}</p>
                        <p className="text-sm text-gray-600">{selectedOrder.userId?.email}</p>
                      </div>
                    </div>
                    {selectedOrder.userId?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span>{selectedOrder.userId.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-bold">₹{selectedOrder.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span>{selectedOrder.items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-yellow-600 font-medium">Unassigned</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}