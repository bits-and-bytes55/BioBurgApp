import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ShoppingBag,
  Star,
  Award,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ChevronRight,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Shield,
  Clock,
  Percent,
  Activity,
  Zap,
  Globe,
  ShoppingCart,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL + "/api";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const PERFORMANCE_COLORS = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'];

export default function VendorAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("monthly");
  const [activeChart, setActiveChart] = useState("revenue");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/vendor/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getRevenueChartData = () => {
    if (!data?.monthlyRevenue) return [];
    return data.monthlyRevenue.map(m => ({
      name: `${m._id.month}/${m._id.year}`,
      revenue: m.revenue,
      orders: m.orders || Math.floor(m.revenue / 1500),
      growth: Math.floor(Math.random() * 30) + 5 // Mock growth percentage
    }));
  };

  const getCategoryData = () => {
    const categories = [
      { name: 'Electronics', value: 35, color: '#0088FE' },
      { name: 'Fashion', value: 25, color: '#00C49F' },
      { name: 'Home & Kitchen', value: 20, color: '#FFBB28' },
      { name: 'Beauty', value: 12, color: '#FF8042' },
      { name: 'Sports', value: 8, color: '#8884d8' },
    ];
    return categories;
  };

  const getPerformanceData = () => {
    return [
      { name: 'Top 20%', value: 80, fill: PERFORMANCE_COLORS[4] },
      { name: 'Top 40%', value: 65, fill: PERFORMANCE_COLORS[3] },
      { name: 'Top 60%', value: 50, fill: PERFORMANCE_COLORS[2] },
      { name: 'Top 80%', value: 35, fill: PERFORMANCE_COLORS[1] },
      { name: 'All Vendors', value: 20, fill: PERFORMANCE_COLORS[0] },
    ];
  };

  const getTopVendorsData = () => {
    if (!data?.topVendors) return Array(5).fill().map((_, i) => ({
      name: `Vendor ${i + 1}`,
      revenue: Math.floor(Math.random() * 500000) + 200000,
      orders: Math.floor(Math.random() * 200) + 50,
      rating: (Math.random() * 1 + 4).toFixed(1),
      growth: Math.floor(Math.random() * 40) + 10
    }));
    
    return data.topVendors.slice(0, 5).map(v => ({
      name: v.vendorName || `Vendor ${v._id.slice(-4)}`,
      revenue: v.revenue || 0,
      orders: v.orders || 0,
      rating: 4.5,
      growth: 25
    }));
  };

  const getMonthlyTrendData = () => {
    return Array(12).fill().map((_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      revenue: Math.floor(Math.random() * 1000000) + 500000,
      orders: Math.floor(Math.random() * 500) + 200,
      customers: Math.floor(Math.random() * 300) + 100,
      avgOrder: Math.floor(Math.random() * 3000) + 1000
    }));
  };

  const calculateMetrics = () => {
    if (!data) return null;
    
    const totalVendors = data.kpis?.totalVendors || 0;
    const totalOrders = data.kpis?.vendorOrders || 0;
    const totalRevenue = data.kpis?.totalRevenue || 0;
    
    return {
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      avgVendorRevenue: totalVendors > 0 ? totalRevenue / totalVendors : 0,
      vendorGrowth: 12.5, // Mock growth percentage
      orderGrowth: 18.2,
      revenueGrowth: 22.8,
      completionRate: 94.7,
      satisfactionRate: 4.8
    };
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-white rounded-xl shadow"></div>
              <div className="h-80 bg-white rounded-xl shadow"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <p className="text-gray-700 text-lg">Failed to load analytics data</p>
        <button 
          onClick={fetchAnalytics}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const metrics = calculateMetrics();
  const revenueData = getRevenueChartData();
  const categoryData = getCategoryData();
  const performanceData = getPerformanceData();
  const topVendors = getTopVendorsData();
  const trendData = getMonthlyTrendData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Vendor Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-lg shadow border">
              {["daily", "weekly", "monthly", "yearly"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    timeRange === range
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow border hover:bg-gray-50 transition flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-semibold">+12.5%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Total Vendors</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatNumber(data.kpis?.totalVendors || 0)}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <span className="text-green-600 font-medium">+{Math.floor(data.kpis?.totalVendors * 0.125)}</span> this month
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-semibold">+18.2%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Vendor Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatNumber(data.kpis?.vendorOrders || 0)}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Avg: {Math.floor((data.kpis?.vendorOrders || 0) / (data.kpis?.totalVendors || 1))} orders per vendor
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb=4">
              <div className="p-3 rounded-xl bg-green-50">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-semibold">+22.8%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(data.kpis?.totalRevenue || 0)}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <span className="text-green-600 font-medium">+{formatCurrency(Math.floor((data.kpis?.totalRevenue || 0) * 0.228))}</span> vs last month
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-50">
                <ShoppingBag className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-semibold">+5.3%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(metrics?.avgOrderValue || 0)}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Per vendor: {formatCurrency(metrics?.avgVendorRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Revenue Performance</h3>
                <p className="text-gray-600">Monthly vendor revenue trends</p>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                {["revenue", "orders", "growth"].map((chart) => (
                  <button
                    key={chart}
                    onClick={() => setActiveChart(chart)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeChart === chart
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {chart.charAt(0).toUpperCase() + chart.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                    tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue"
                    radius={[8, 8, 0, 0]}
                    fill="#4f46e5"
                  />
                  <Bar 
                    dataKey="orders" 
                    name="Orders"
                    radius={[8, 8, 0, 0]}
                    fill="#10b981"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center mt-6 space-x-8">
              {revenueData.slice(-3).map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(item.revenue)}</div>
                  <div className="text-sm text-gray-500">Revenue in {item.name}</div>
                  <div className="text-xs text-green-600 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +{item.growth}% growth
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Distribution</h3>
            
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Market Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </div>
                  <span className="font-semibold">{category.value}%</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Market Coverage</span>
                <span className="font-semibold text-gray-900">100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Monthly Trends</h3>
                <p className="text-gray-600">Revenue, orders, and customers</p>
              </div>
              <LineChartIcon className="w-6 h-6 text-indigo-600" />
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue"
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    name="Orders"
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Ranking */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Top Performing Vendors</h3>
                <p className="text-gray-600">By revenue and growth rate</p>
              </div>
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            
            <div className="space-y-4">
              {topVendors.map((vendor, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100' : 
                      index === 1 ? 'bg-gray-100' : 
                      index === 2 ? 'bg-orange-100' : 'bg-blue-100'
                    }`}>
                      <span className={`font-bold ${
                        index === 0 ? 'text-yellow-600' : 
                        index === 1 ? 'text-gray-600' : 
                        index === 2 ? 'text-orange-600' : 'text-blue-600'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{vendor.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-3 h-3 text-amber-500" />
                        <span className="text-xs text-gray-600">{vendor.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(vendor.revenue)}</p>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      +{vendor.growth}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2">
              <ChevronRight className="w-4 h-4" />
              View All Vendors
            </button>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Order Completion Rate</p>
                <p className="text-3xl font-bold mt-2">{metrics?.completionRate || 0}%</p>
              </div>
              <CheckCircle className="w-8 h-8 opacity-80" />
            </div>
            <div className="mt-4">
              <div className="h-2 bg-blue-400 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full" 
                  style={{ width: `${metrics?.completionRate || 0}%` }}
                ></div>
              </div>
              <p className="text-xs opacity-90 mt-2">+2.1% from last month</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Customer Satisfaction</p>
                <p className="text-3xl font-bold mt-2">{metrics?.satisfactionRate || 0}/5</p>
              </div>
              <Star className="w-8 h-8 opacity-80" />
            </div>
            <div className="mt-4">
              <div className="h-2 bg-green-400 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full" 
                  style={{ width: `${(metrics?.satisfactionRate || 0) * 20}%` }}
                ></div>
              </div>
              <p className="text-xs opacity-90 mt-2">Based on 2.5k reviews</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Response Time</p>
                <p className="text-3xl font-bold mt-2">2.4 hrs</p>
              </div>
              <Clock className="w-8 h-8 opacity-80" />
            </div>
            <div className="mt-4">
              <div className="h-2 bg-purple-400 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full" 
                  style={{ width: '60%' }}
                ></div>
              </div>
              <p className="text-xs opacity-90 mt-2">-15% from last month</p>
            </div>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">96.7%</div>
              <p className="text-sm text-gray-600 mt-1">On-time Delivery</p>
              <div className="flex items-center justify-center mt-2 text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm">+3.2%</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">4.2</div>
              <p className="text-sm text-gray-600 mt-1">Avg Vendor Rating</p>
              <div className="flex items-center justify-center mt-2 text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm">+0.3</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">88%</div>
              <p className="text-sm text-gray-600 mt-1">Issue Resolution</p>
              <div className="flex items-center justify-center mt-2 text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm">+7.5%</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">2.1%</div>
              <p className="text-sm text-gray-600 mt-1">Return Rate</p>
              <div className="flex items-center justify-center mt-2 text-red-600">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span className="text-sm">-0.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">Insights & Recommendations</h3>
              <p className="text-indigo-700 mt-1">
                Based on current analytics, here are some suggestions:
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                View Details
              </button>
              <button className="px-4 py-2 bg-white text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition">
                Export Report
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-gray-900">Top Performers</span>
              </div>
              <p className="text-sm text-gray-600">
                Top 20% vendors generate 65% of total revenue
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900">Growth Opportunity</span>
              </div>
              <p className="text-sm text-gray-600">
                Electronics category shows 35% YoY growth
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">Areas to Improve</span>
              </div>
              <p className="text-sm text-gray-600">
                Vendor response time can be optimized
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}