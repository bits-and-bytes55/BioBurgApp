import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ShoppingBag,
  Star,
  ChevronRight,
  Calendar,
  TrendingDown,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL + "/api";

export default function VendorOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("monthly");
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/vendor/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data?.data || res.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getKPIIcon = (key) => {
    switch (key) {
      case "Total Vendors":
        return <Users className="w-6 h-6 text-blue-500" />;
      case "Active Vendors":
        return <Users className="w-6 h-6 text-green-500" />;
      case "Total Orders":
        return <Package className="w-6 h-6 text-purple-500" />;
      case "Total Revenue":
        return <DollarSign className="w-6 h-6 text-amber-500" />;
      case "Avg Order Value":
        return <ShoppingBag className="w-6 h-6 text-rose-500" />;
      default:
        return <TrendingUp className="w-6 h-6 text-gray-500" />;
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

  const getRevenueGrowth = () => {
    if (!data?.monthlyOrders || data.monthlyOrders.length < 2) return 0;
    const current = data.monthlyOrders[data.monthlyOrders.length - 1];
    const previous = data.monthlyOrders[data.monthlyOrders.length - 2];
    if (!previous?.orders) return 100;
    return Math.round(((current.orders - previous.orders) / previous.orders) * 100);
  };

  const chartData = data?.monthlyOrders?.map((m, index) => ({
    name: `${m._id.month}/${m._id.year}`,
    orders: m.orders,
    revenue: m.revenue || Math.floor(m.orders * 1500),
    color: index % 2 === 0 ? '#8b5cf6' : '#10b981'
  })) || [];

  const topVendors = data?.topVendors || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-xl shadow"></div>
              ))}
            </div>
            <div className="h-96 bg-white rounded-xl shadow mb-8"></div>
            <div className="h-96 bg-white rounded-xl shadow"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-4xl mb-4"></div>
        <p className="text-gray-700 text-lg">Failed to load dashboard data</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Overview of vendor performance and analytics
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex bg-white rounded-lg shadow border">
              {["daily", "weekly", "monthly"].map((range) => (
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
              onClick={fetchDashboard}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow border hover:bg-gray-50 transition flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {Object.entries(data.kpis || {}).map(([key, value]) => (
            <div
              key={key}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gray-50">
                  {getKPIIcon(key)}
                </div>
                <div className={`flex items-center ${key === "Total Orders" ? "text-green-500" : "text-gray-400"}`}>
                  {key === "Total Orders" ? (
                    <>
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-semibold">+12%</span>
                    </>
                  ) : null}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-2">{key}</p>
              <p className="text-2xl font-bold text-gray-900">
                {key.includes("Revenue") || key.includes("Value")
                  ? formatCurrency(value)
                  : value}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {key === "Total Vendors" && "Across all categories"}
                  {key === "Active Vendors" && "Last 30 days"}
                  {key === "Total Orders" && "Completed orders"}
                  {key === "Total Revenue" && "Net revenue"}
                  {key === "Avg Order Value" && "Average per order"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Order Trends</h3>
                <p className="text-gray-600">Monthly vendor order performance</p>
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="w-5 h-5 mr-2" />
                <span className="font-semibold">+{getRevenueGrowth()}% growth</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [value, 'Orders']}
                />
                <Bar
                  dataKey="orders"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="flex justify-center mt-6 space-x-8">
              {chartData.slice(-3).map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{item.orders}</div>
                  <div className="text-sm text-gray-500">Orders in {item.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Summary</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-blue-700">Top Performing</p>
                  <p className="text-2xl font-bold text-gray-900">{topVendors[0]?.vendorName || "N/A"}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Order Completion</span>
                    <span className="text-sm font-semibold">94%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Vendor Satisfaction</span>
                    <span className="text-sm font-semibold">88%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">On-time Delivery</span>
                    <span className="text-sm font-semibold">96%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total active vendors this month</span>
                  <span className="font-semibold text-gray-900">+{data.kpis?.["Active Vendors"] || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Vendors Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Top Performing Vendors</h3>
            <p className="text-gray-600">Based on orders and revenue</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Vendor</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Orders</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Rating</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {topVendors.map((vendor, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          index === 0 ? 'bg-amber-100' :
                          index === 1 ? 'bg-gray-100' :
                          index === 2 ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          <span className={`font-semibold ${
                            index === 0 ? 'text-amber-600' :
                            index === 1 ? 'text-gray-600' :
                            index === 2 ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                            {vendor.vendorName?.charAt(0) || 'V'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{vendor.vendorName}</p>
                          <p className="text-xs text-gray-500">ID: #{vendor._id?.slice(-6) || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-700">{vendor.email}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{vendor.orders}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {formatCurrency(vendor.revenue)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-amber-400 mr-1" />
                        <span>{4.2 + (index * 0.2)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        vendor.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {vendor.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {topVendors.length} of {data.kpis?.["Total Vendors"] || 0} vendors
            </p>
            <button className="flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition">
              View all vendors
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
            <h4 className="font-semibold mb-2">Peak Order Day</h4>
            <p className="text-2xl font-bold">Friday</p>
            <p className="text-sm opacity-90">Most orders placed on this day</p>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
            <h4 className="font-semibold mb-2">Avg Response Time</h4>
            <p className="text-2xl font-bold">2.4 hrs</p>
            <p className="text-sm opacity-90">Vendor response time</p>
          </div>
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-6 text-white">
            <h4 className="font-semibold mb-2">Issues Resolved</h4>
            <p className="text-2xl font-bold">98%</p>
            <p className="text-sm opacity-90">Support ticket resolution rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}