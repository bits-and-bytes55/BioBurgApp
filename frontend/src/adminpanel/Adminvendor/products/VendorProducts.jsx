import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Package,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  BarChart3,
  Tag,
  Percent,
  ShoppingBag,
  Grid,
  List,
  Settings,
  Image as ImageIcon,
  ShoppingCart,
  Award,
  Shield,
  Users,
  Calendar,
  Edit,
  Copy,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Zap,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL + "/api";

export default function VendorProducts({ vendorId: propVendorId }) {
  const { vendorId: paramVendorId } = useParams();
  const resolvedVendorId = propVendorId || paramVendorId;

  const [selectedVendorId, setSelectedVendorId] = useState(resolvedVendorId || "");
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [viewMode, setViewMode] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState(null);
  const token = localStorage.getItem("adminToken");

  // Fetch all vendors when no vendorId is provided
  useEffect(() => {
    if (!resolvedVendorId) {
      setVendorsLoading(true);
      axios
        .get(`${API}/admin/vendors`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setVendors(res.data.vendors || res.data.data || []);
        })
        .catch((err) => {
          console.error("Error fetching vendors:", err);
          setVendors([]);
        })
        .finally(() => setVendorsLoading(false));
    }
  }, [resolvedVendorId]);

  // Fetch products whenever selectedVendorId changes
  useEffect(() => {
    if (selectedVendorId) {
      fetchVendorProducts();
    }
  }, [selectedVendorId]);

  const fetchVendorProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/product/vendor/${selectedVendorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data || res.data.products || [];
      setProducts(data);
      calculateStats(data);
    } catch (error) {
      console.error("Error fetching vendor products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productData) => {
    const total = productData.length;
    const active = productData.filter((p) => p.statusActive === "active").length;
    const blocked = productData.filter((p) => p.statusActive === "blocked").length;
    const pending = productData.filter((p) => p.statusActive === "pending").length;
    const totalValue = productData.reduce((sum, p) => sum + (p.mrp || 0), 0);
    const avgPrice = total > 0 ? totalValue / total : 0;

    const categoryStats = {};
    productData.forEach((product) => {
      const category = product.category || "Uncategorized";
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    setStats({ total, active, blocked, pending, totalValue, avgPrice, categoryStats });
  };

  const toggleStatus = async (id, status) => {
    try {
      await axios.put(
        `${API}/admin/product/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchVendorProducts();
    } catch (error) {
      console.error("Error updating product status:", error);
    }
  };

  const bulkToggleStatus = async (status) => {
    try {
      await Promise.all(
        selectedProducts.map((id) =>
          axios.put(
            `${API}/admin/product/${id}/status`,
            { status },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      fetchVendorProducts();
      setSelectedProducts([]);
      setBulkAction(null);
    } catch (error) {
      console.error("Error bulk updating product status:", error);
    }
  };

  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter(
        (product) =>
          product.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((product) => product.statusActive === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((product) => product.category === categoryFilter);
    }

    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (sortConfig.key === "mrp") {
        return sortConfig.direction === "asc"
          ? (a.mrp || 0) - (b.mrp || 0)
          : (b.mrp || 0) - (a.mrp || 0);
      }

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
  }, [products, searchTerm, statusFilter, categoryFilter, sortConfig]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800 border-green-200",
      blocked: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      out_of_stock: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return colors[status] || colors.active;
  };

  const getCategoryColor = (category) => {
    const colors = {
      Electronics: "bg-blue-100 text-blue-800",
      Fashion: "bg-pink-100 text-pink-800",
      "Home & Kitchen": "bg-amber-100 text-amber-800",
      Beauty: "bg-purple-100 text-purple-800",
      Sports: "bg-green-100 text-green-800",
      Books: "bg-indigo-100 text-indigo-800",
      Default: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors["Default"];
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p._id));
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const uniqueCategories = useMemo(() => {
    const categories = new Set();
    products.forEach((product) => {
      if (product.category) categories.add(product.category);
    });
    return Array.from(categories);
  }, [products]);

  // ── No vendor selected: show vendor picker ──────────────────────────────────
  if (!selectedVendorId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-start justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-md mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vendor Products</h2>
              <p className="text-sm text-gray-500">Select a vendor to view their products</p>
            </div>
          </div>

          {vendorsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              <span className="ml-2 text-gray-600">Loading vendors...</span>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No vendors found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <button
                  key={vendor._id}
                  onClick={() => setSelectedVendorId(vendor._id)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition flex items-center justify-between group"
                >
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-700">
                      {vendor.name || vendor.businessName || vendor.email}
                    </p>
                    {vendor.email && vendor.name && (
                      <p className="text-xs text-gray-500">{vendor.email}</p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Loading products ─────────────────────────────────────────────────────────
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-xl shadow"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Vendor Products</h1>
                <p className="text-gray-600 mt-1">Manage and monitor all products from this vendor</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Vendor switcher (only shown when accessed from dashboard, not route) */}
            {!resolvedVendorId && (
              <button
                onClick={() => setSelectedVendorId("")}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Change Vendor
              </button>
            )}
            <button
              onClick={fetchVendorProducts}
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
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-full">
                <Package className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">
                +{Math.floor((stats?.total || 0) * 0.12)}
              </span>
              <span className="text-gray-500 ml-2">this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.active || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${stats?.total ? (stats.active / stats.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats?.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats?.totalValue || 0)}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-full">
                <DollarSign className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <DollarSign className="w-4 h-4 text-amber-500 mr-1" />
              <span className="text-gray-600">Avg: {formatCurrency(stats?.avgPrice || 0)}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blocked Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.blocked || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600 font-medium">Requires attention</span>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedProducts.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">Bulk Selection Mode</h3>
                  <p className="text-indigo-100 text-sm">
                    {selectedProducts.length} product(s) selected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={bulkAction || ""}
                  onChange={(e) => {
                    if (e.target.value) bulkToggleStatus(e.target.value);
                  }}
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-white"
                >
                  <option value="">Bulk Actions</option>
                  <option value="active">Activate Selected</option>
                  <option value="blocked">Block Selected</option>
                  <option value="pending">Mark as Pending</option>
                </select>
                <button
                  onClick={() => {
                    setSelectedProducts([]);
                    setBulkAction(null);
                  }}
                  className="px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-gray-100 transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products by name, brand, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="pending">Pending</option>
                  <option value="draft">Draft</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
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
                  {uniqueCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Grid className="w-4 h-4" />
                Grid View
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
                List View
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} products found
              </span>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No products found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm
                        ? "Try adjusting your search filters"
                        : "No products available for this vendor"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-500 mt-2">No image</p>
                        </div>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          product.statusActive
                        )}`}
                      >
                        {product.statusActive?.charAt(0).toUpperCase() +
                          product.statusActive?.slice(1)}
                      </span>
                    </div>

                    <div className="absolute top-3 left-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>

                    {product.category && (
                      <div className="absolute bottom-3 left-3">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${getCategoryColor(
                            product.category
                          )}`}
                        >
                          {product.category}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-900 text-lg truncate">
                        {product.brandName || product.productName}
                      </h3>
                      {product.productName && product.productName !== product.brandName && (
                        <p className="text-sm text-gray-600 mt-1 truncate">{product.productName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-gray-600">
                          {product.rating || "4.5"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(product.mrp || 0)}
                        </p>
                        {product.discountedPrice && (
                          <p className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.discountedPrice)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Stock</p>
                        <p
                          className={`font-semibold ${
                            (product.stock || 0) > 10
                              ? "text-green-600"
                              : (product.stock || 0) > 0
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.stock || 0} units
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        {product.statusActive === "active" ? (
                          <button
                            onClick={() => toggleStatus(product._id, "blocked")}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleStatus(product._id, "active")}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 py-4 px-6">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.length === filteredProducts.length &&
                          filteredProducts.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product Details
                    </th>
                    <th
                      className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("mrp")}
                    >
                      <div className="flex items-center gap-1">
                        Price
                        {sortConfig.key === "mrp" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Stock
                    </th>
                    <th
                      className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("statusActive")}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortConfig.key === "statusActive" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => handleSelectProduct(product._id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.productName}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{product.brandName}</p>
                              {product.productName && (
                                <p className="text-sm text-gray-600 truncate max-w-[200px]">
                                  {product.productName}
                                </p>
                              )}
                              {product.category && (
                                <span
                                  className={`px-2 py-1 text-xs rounded mt-1 inline-block ${getCategoryColor(
                                    product.category
                                  )}`}
                                >
                                  {product.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-900">
                            {formatCurrency(product.mrp || 0)}
                          </div>
                          {product.discountedPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.discountedPrice)}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div
                            className={`font-semibold ${
                              (product.stock || 0) > 10
                                ? "text-green-600"
                                : (product.stock || 0) > 0
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {product.stock || 0} units
                          </div>
                          <div className="text-xs text-gray-500">
                            Updated: {formatDate(product.updatedAt)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              product.statusActive
                            )}`}
                          >
                            {product.statusActive?.charAt(0).toUpperCase() +
                              product.statusActive?.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {product.statusActive === "active" ? (
                              <button
                                onClick={() => toggleStatus(product._id, "blocked")}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Block Product"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleStatus(product._id, "active")}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Activate Product"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
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
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-semibold">1-{Math.min(filteredProducts.length, 12)}</span> of{" "}
              <span className="font-semibold">{filteredProducts.length}</span> products
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Previous
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                1
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Product Rating</p>
                <p className="text-2xl font-bold mt-2">4.7/5</p>
              </div>
              <Star className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Top Category</p>
                <p className="text-2xl font-bold mt-2">{uniqueCategories[0] || "N/A"}</p>
              </div>
              <Award className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Categories</p>
                <p className="text-2xl font-bold mt-2">{uniqueCategories.length}</p>
              </div>
              <Tag className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedProduct.brandName}
                  </h3>
                  <p className="text-gray-600 mt-1">{selectedProduct.productName}</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                  {selectedProduct.image ? (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.productName}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">MRP</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedProduct.mrp || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-semibold text-gray-900">
                    {selectedProduct.category || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className="font-semibold text-gray-900">
                    {selectedProduct.stock || 0} units
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      selectedProduct.statusActive
                    )}`}
                  >
                    {selectedProduct.statusActive?.charAt(0).toUpperCase() +
                      selectedProduct.statusActive?.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(selectedProduct.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}