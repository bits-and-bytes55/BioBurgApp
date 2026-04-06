import express from "express";
import {
  registerHospital, loginHospital, forgotHospitalPassword, resetHospitalPassword,
  getAllHospitals, getHospitalProfile, updateHospitalProfile, updateHospitalProfilePhoto,
  updateHospitalTheme, updateHospitalPassword, getHospitalDashboard,
  getMyHospitalDashboard, updateHospitalDashboardSection,
  approveHospital, rejectHospital,deleteHospital,
} from "../controllers/hospitalController.js";

import Hospital from "../models/Hospital.js";
import Order    from "../models/Order.js";
import { protectHospital } from "../middleware/Hospital/auth.js";
import { notifyHospitalApproved, notifyHospitalRejected } from "../services/notificationService.js";

const router = express.Router();

/*  Public  */
router.post("/register",        registerHospital);
router.post("/login",           loginHospital);
router.post("/forgot-password", forgotHospitalPassword);
router.post("/reset-password",  resetHospitalPassword);
router.get ("/all",             getAllHospitals);

/*  Protected — Hospital  */
router.get ("/profile",             protectHospital, getHospitalProfile);
router.put ("/profile",             protectHospital, updateHospitalProfile);
router.put ("/profile/photo",       protectHospital, updateHospitalProfilePhoto);
router.put ("/profile/theme",       protectHospital, updateHospitalTheme);
router.put ("/update-password",     protectHospital, updateHospitalPassword);
router.get ("/dashboard",           protectHospital, getMyHospitalDashboard);
router.post("/dashboard/update",    protectHospital, updateHospitalDashboardSection);

/*  Hospital's own orders  */
router.get("/my-orders", protectHospital, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, orders, count: orders.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/*  Admin: approve / reject  */
router.patch("/approve/:id", async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, { status: "approved", isApproved: true, approvedAt: new Date() }, { new: true });
    if (!hospital) return res.status(404).json({ success: false, message: "Hospital not found" });
    notifyHospitalApproved({ name: hospital.contactPerson || hospital.facilityName, email: hospital.email, phone: hospital.phone, facilityName: hospital.facilityName }).catch(console.error);
    res.json({ success: true, message: `${hospital.facilityName} approved! Email & SMS sent.`, hospital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/reject/:id", async (req, res) => {
  try {
    const { reason } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, { status: "rejected", isApproved: false, rejectionReason: reason || "Rejected by admin" }, { new: true });
    if (!hospital) return res.status(404).json({ success: false, message: "Hospital not found" });
    notifyHospitalRejected({ name: hospital.contactPerson || hospital.facilityName, email: hospital.email, phone: hospital.phone, facilityName: hospital.facilityName, reason }).catch(console.error);
    res.json({ success: true, message: "Hospital rejected. Email & SMS sent.", hospital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/*  Admin: all orders summary  */
router.get("/orders", async (req, res) => {
  try {
    const hospitals = await Hospital.find().select("_id facilityName email city state numberOfBeds status").lean();
    if (hospitals.length === 0) return res.json({ success: true, orders: [], summary: [] });
    const hospMap = {};
    hospitals.forEach(h => { hospMap[h._id.toString()] = h; });
    const grouped = await Order.aggregate([{ $match: { userId: { $in: hospitals.map(h => h._id) } } }, { $group: { _id: "$userId", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" }, lastOrderAt: { $max: "$createdAt" }, statuses: { $push: "$orderStatus" } } }]);
    const summary = grouped.map(g => { const hosp = hospMap[g._id.toString()] || {}; return { hospitalId: g._id.toString(), facilityName: hosp.facilityName || "Unknown", city: hosp.city || "", state: hosp.state || "", count: g.count, revenue: g.revenue, lastOrderAt: g.lastOrderAt, statuses: g.statuses }; }).sort((a,b) => b.count - a.count);
    const rawOrders = await Order.find({ userId: { $in: hospitals.map(h => h._id) } }, { userId:1, totalAmount:1, orderStatus:1, createdAt:1, paymentMode:1 }).sort({ createdAt: -1 }).lean();
    const enriched = rawOrders.map(o => ({ ...o, hospitalRef: o.userId ? hospMap[o.userId.toString()] || null : null }));
    res.json({ success: true, orders: enriched, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/*  Admin: view any hospital's dashboard  */
router.get("/dashboard/:id", getHospitalDashboard);
router.delete("/delete/:id", deleteHospital);

export default router;