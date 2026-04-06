import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
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
  Store,
  Globe,
  Target,
  Activity,
  Zap,
  Sparkles,
  Filter as FilterIcon
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL + "/api";

export default function AllVendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [viewMode, setViewMode] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const token = localStorage.getItem("adminToken");

  // AFTER
useEffect(() => {
  fetchAllProducts();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.data);
      calculateStats(res.data.data);
    } catch (error) {
      console.error("Error fetching all products:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productData) => {
    const total = productData.length;
    const active = productData.filter(p => p.statusActive === "active").length;
    const blocked = productData.filter(p => p.statusActive === "blocked").length;
    const pending = productData.filter(p => p.statusActive === "pending").length;
    const totalValue = productData.reduce((sum, p) => sum + (p.mrp || 0), 0);
    const avgPrice = total > 0 ? totalValue / total : 0;
    
    // Calculate vendor distribution
    const vendorStats = {};
    productData.forEach(product => {
      const vendorName = product.vendor?.businessName || "Unknown Vendor";
      vendorStats[vendorName] = (vendorStats[vendorName] || 0) + 1;
    });

    // Calculate category distribution
    const categoryStats = {};
    productData.forEach(product => {
      const category = product.category || "Uncategorized";
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    setStats({
      total,
      active,
      blocked,
      pending,
      totalValue,
      avgPrice,
      vendorStats,
      categoryStats,
      uniqueVendors: Object.keys(vendorStats).length
    });
  };

  const toggleStatus = async (id, status) => {
    try {
      await axios.put(
        `${API}/admin/product/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAllProducts();
    } catch (error) {
      console.error("Error updating product status:", error);
    }
  };

  const bulkToggleStatus = async (status) => {
    try {
      await Promise.all(
        selectedProducts.map(id =>
          axios.put(
            `${API}/admin/product/${id}/status`,
            { status },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      fetchAllProducts();
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

    // Search filter
    if (searchTerm) {
      result = result.filter(product =>
        product.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(product => product.statusActive === statusFilter);
    }

    // Vendor filter
    if (vendorFilter !== "all") {
      result = result.filter(product => product.vendor?._id === vendorFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter(product => product.category === categoryFilter);
    }

    // Sorting
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
      
      if (sortConfig.key === "vendor.businessName") {
        const aVendor = a.vendor?.businessName || "";
        const bVendor = b.vendor?.businessName || "";
        return sortConfig.direction === "asc" 
          ? aVendor.localeCompare(bVendor)
          : bVendor.localeCompare(aVendor);
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
  }, [products, searchTerm, statusFilter, vendorFilter, categoryFilter, sortConfig]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800 border-green-200",
      blocked: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      out_of_stock: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return colors[status] || colors.active;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Electronics': 'bg-blue-100 text-blue-800',
      'Fashion': 'bg-pink-100 text-pink-800',
      'Home & Kitchen': 'bg-amber-100 text-amber-800',
      'Beauty': 'bg-purple-100 text-purple-800',
      'Sports': 'bg-green-100 text-green-800',
      'Books': 'bg-indigo-100 text-indigo-800',
      'Food & Beverage': 'bg-red-100 text-red-800',
      'Default': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Default'];
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id));
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id)
        ? prev.filter(pId => pId !== id)
        : [...prev, id]
    );
  };

  const uniqueVendors = useMemo(() => {
    const vendors = new Map();
    products.forEach(product => {
      if (product.vendor && !vendors.has(product.vendor._id)) {
        vendors.set(product.vendor._id, product.vendor);
      }
    });
    return Array.from(vendors.values());
  }, [products]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set();
    products.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    return Array.from(categories);
  }, [products]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All Vendor Products</h1>
                <p className="text-gray-600 mt-1">
                  Manage products from all vendors in one place
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllProducts}
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
              <span className="text-green-600 font-medium">+{Math.floor((stats?.total || 0) * 0.08)}</span>
              <span className="text-gray-500 ml-2">this week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Vendors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.uniqueVendors || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: '78%' }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {Math.floor((stats?.uniqueVendors || 0) * 0.85)} selling actively
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inventory Value</p>
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
              <span className="text-gray-600">
                Avg: {formatCurrency(stats?.avgPrice || 0)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blocked Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.blocked || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full" 
                  style={{ width: `${stats?.total ? (stats.blocked / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats?.total ? Math.round((stats.blocked / stats.total) * 100) : 0}% of total
              </p>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedProducts.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">Bulk Selection Mode</h3>
                  <p className="text-indigo-100 text-sm">
                    {selectedProducts.length} product(s) selected from {new Set(selectedProducts.map(id => 
                      products.find(p => p._id === id)?.vendor?._id
                    )).size} vendors
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={bulkAction || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      bulkToggleStatus(e.target.value);
                    }
                  }}
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-white"
                >
                  <option value="">Bulk Actions</option>
                  <option value="active">Activate Selected</option>
                  <option value="blocked">Block Selected</option>
                  <option value="pending">Mark as Pending</option>
                  <option value="out_of_stock">Mark as Out of Stock</option>
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
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products, vendors, or categories..."
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

            {/* Status Filter */}
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
          </div>

          {/* Advanced Filters & View Toggle */}
          <div className="flex flex-wrap justify-between items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  showAdvancedFilters 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                Advanced Filters
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === "grid" 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Grid className="w-4 h-4" />
                Grid
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
                List
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} products from {uniqueVendors.length} vendors
              </span>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <span className="self-center text-gray-500">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortConfig.key}
                    onChange={(e) => handleSort(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="createdAt">Date Added</option>
                    <option value="mrp">Price</option>
                    <option value="brandName">Product Name</option>
                    <option value="vendor.businessName">Vendor Name</option>
                    <option value="statusActive">Status</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setCategoryFilter("all");
                    setSearchTerm("");
                    setStatusFilter("all");
                    setVendorFilter("all");
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                >
                  Clear All
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Display - Grid View */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No products found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm ? "Try adjusting your search filters" : "No products available"}
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
                  {/* Product Header */}
                  <div className="relative">
                    <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
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
                    
                    {/* Vendor Badge */}
                    <div className="absolute top-3 left-3">
                      <div className="flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-xs rounded-lg">
                        <Store className="w-3 h-3" />
                        <span className="max-w-[100px] truncate">
                          {product.vendor?.businessName || "Unknown Vendor"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(product.statusActive)}`}>
                        {product.statusActive?.charAt(0).toUpperCase() + product.statusActive?.slice(1)}
                      </span>
                    </div>
                    
                    {/* Selection Checkbox */}
                    <div className="absolute bottom-3 left-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    
                    {/* Category Badge */}
                    {product.category && (
                      <div className="absolute bottom-3 right-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getCategoryColor(product.category)}`}>
                          {product.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-gray-900 truncate">
                        {product.brandName || product.productName}
                      </h3>
                      {product.productName && product.productName !== product.brandName && (
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {product.productName}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(product.mrp || 0)}
                        </p>
                        {product.discountedPrice && (
                          <p className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.discountedPrice)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span className="text-sm text-gray-600">4.5</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.floor(Math.random() * 100) + 50} reviews
                        </div>
                      </div>
                    </div>

                    {/* Vendor & Stock Info */}
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Store className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600 truncate max-w-[120px]">
                          {product.vendor?.businessName || "Vendor"}
                        </span>
                      </div>
                      <div className={`font-medium ${
                        (product.stock || 0) > 10 ? 'text-green-600' : 
                        (product.stock || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {product.stock || 0} in stock
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* Edit functionality */}}
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
                            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleStatus(product._id, "active")}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
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
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product Details
                    </th>
                    <th 
                      className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("vendor.businessName")}
                    >
                      <div className="flex items-center gap-1">
                        Vendor
                        {sortConfig.key === "vendor.businessName" && (
                          sortConfig.direction === "asc" ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("mrp")}
                    >
                      <div className="flex items-center gap-1">
                        Price
                        {sortConfig.key === "mrp" && (
                          sortConfig.direction === "asc" ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        )}
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
                        {sortConfig.key === "statusActive" && (
                          sortConfig.direction === "asc" ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
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
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            {product.image ? (
                              <img src={product.image} alt={product.productName} className="w-12 h-12 object-cover rounded-lg" />
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
                              <span className={`px-2 py-1 text-xs rounded mt-1 inline-block ${getCategoryColor(product.category)}`}>
                                {product.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                            <Store className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-[150px]">
                              {product.vendor?.businessName || "Unknown Vendor"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {product.vendor?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">{formatCurrency(product.mrp || 0)}</div>
                        {product.discountedPrice && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.discountedPrice)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className={`font-semibold ${
                          (product.stock || 0) > 10 ? 'text-green-600' : 
                          (product.stock || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {product.stock || 0} units
                        </div>
                        <div className="text-xs text-gray-500">Updated today</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.statusActive)}`}>
                          {product.statusActive?.charAt(0).toUpperCase() + product.statusActive?.slice(1)}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-semibold">1-{Math.min(filteredProducts.length, 12)}</span> of{" "}
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
                2
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                3
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Vendor Distribution */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Vendors by Products</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {Object.entries(stats?.vendorStats || {})
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([vendorName, count]) => (
                <div key={vendorName} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                      <Store className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                      {vendorName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{count}</span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
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
                  <h3 className="text-xl font-bold text-gray-900">{selectedProduct.brandName}</h3>
                  <p className="text-gray-600 mt-1">Product Details</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Modal content would show detailed product information */}
              <p className="text-gray-600">Detailed product information would appear here...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}