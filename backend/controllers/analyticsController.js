// backend/controllers/analyticsController.js
// Mock analytics controller. Replace mock sections with real DB queries later.

import express from "express";

/**
 * Utility to generate monthly data between startMonth and endMonth (both "YYYY-MM")
 * Returns array: [{ month: "Jan", year: 2025, key: "2025-01", sales: 120 }, ... ]
 */
const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function generateMonthlyRange(startMonth, endMonth) {
  // startMonth/endMonth: "YYYY-MM"
  const [sY, sM] = startMonth.split("-").map(Number);
  const [eY, eM] = endMonth.split("-").map(Number);
  const out = [];
  let y = sY, m = sM;
  while (y < eY || (y === eY && m <= eM)) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push({
      key,
      monthLabel: monthLabels[m - 1],
      month: m,
      year: y,
      sales: Math.round(Math.random() * 400) + 20 // mock
    });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

// GET /api/admin/analytics/summary
export const getSummary = async (req, res) => {
  try {
    // TODO: Replace with DB queries (User.countDocuments(), Order.sum(), etc.)
    const summary = {
      totalUsers: 3782,
      totalOrders: 5359,
      revenue: 20000, // raw number or cents
    };
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error("getSummary error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/analytics/monthly-sales?start=YYYY-MM&end=YYYY-MM
export const getMonthlySales = async (req, res) => {
  try {
    const { start, end } = req.query;
    // default range last 12 months if not provided
    const endDefault = new Date();
    const startDefault = new Date(endDefault.getFullYear(), endDefault.getMonth() - 11, 1);
    const startQ = start || `${startDefault.getFullYear()}-${String(startDefault.getMonth()+1).padStart(2,"0")}`;
    const endQ = end || `${endDefault.getFullYear()}-${String(endDefault.getMonth()+1).padStart(2,"0")}`;

    // TODO: Replace with DB aggregation to sum sales per month
    const data = generateMonthlyRange(startQ, endQ).map(d => ({
      month: `${d.monthLabel} ${d.year}`,
      key: d.key,
      sales: d.sales
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("getMonthlySales error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/analytics/target?month=YYYY-MM
export const getTarget = async (req, res) => {
  try {
    const { month } = req.query;
    // TODO: Replace with DB computation: current revenue / targetRevenue * 100
    const percent = Math.round(50 + Math.random() * 50); // 50-100% mock
    res.json({ success: true, data: { percent } });
  } catch (err) {
    console.error("getTarget error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
